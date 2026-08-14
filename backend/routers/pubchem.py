"""
Proxies queries to PubChem PUG REST so the API key/rate limit stays
server-side, and caches results in Supabase to avoid repeat lookups
for the same hazard class or product name.

Hardening in this version:
  - Retries with exponential backoff on transient failures (timeouts,
    5xx, connection errors) — NOT on 4xx, which won't succeed on retry.
  - Explicit timeout so one slow PubChem response can't hang a request.
  - Graceful fallback: if PubChem is unreachable, the endpoint still
    returns the static GHS safety info instead of erroring out — the
    core safety information should never be blocked by a third-party
    API being down.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import asyncio
import logging
import os
from supabase import create_client, Client

router = APIRouter()
logger = logging.getLogger("pubchem")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client | None = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    if SUPABASE_URL and SUPABASE_SERVICE_KEY
    else None
)

PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
REQUEST_TIMEOUT_S = 8.0
MAX_RETRIES = 3
BACKOFF_BASE_S = 0.5  # 0.5s, 1s, 2s

# Generic hazard info keyed by detected GHS pictogram class — used when
# there's no product name text (pure pictogram scan, OCR unavailable/empty).
GHS_CLASS_INFO = {
    "GHS_Symbol_CORROSION": {
        "label": "Corrosive",
        "plain_meaning": "Can damage skin, eyes, or metal on direct contact.",
        "safety_tips": [
            "Wear gloves and eye protection",
            "Don't mix with other substances unless you know the reaction",
            "Keep out of reach of children",
        ],
    },
    "GHS_Symbol_ENVIRONMENT": {
        "label": "Environmental Hazard",
        "plain_meaning": "Harmful to the environment, especially aquatic ecosystems.",
        "safety_tips": [
            "Don't pour into drains or soil directly",
            "Follow local hazardous waste disposal procedures",
        ],
    },
    "GHS_Symbol_EXCLAMATION_MARK": {
        "label": "Irritant / Harmful",
        "plain_meaning": "May cause mild irritation to skin, eyes, or airways.",
        "safety_tips": [
            "Use in a well-ventilated area",
            "Avoid prolonged skin contact",
        ],
    },
    "GHS_Symbol_EXPLODING_BOMB": {
        "label": "Explosive",
        "plain_meaning": "Risk of explosion when exposed to heat, impact, or friction.",
        "safety_tips": [
            "Keep away from flames and heat sources",
            "Don't drop, crush, or apply pressure",
        ],
    },
    "GHS_Symbol_FLAME": {
        "label": "Flammable",
        "plain_meaning": "Easily catches fire.",
        "safety_tips": [
            "Keep away from open flames, cigarettes, and heat sources",
            "Store in a cool, well-ventilated place",
        ],
    },
    "GHS_Symbol_FLAME_OVER_CIRCLE": {
        "label": "Oxidizer",
        "plain_meaning": "Can trigger or intensify a fire in other materials.",
        "safety_tips": [
            "Don't store near flammable materials",
            "Avoid contact with organic substances",
        ],
    },
    "GHS_Symbol_GAS_CYLINDER": {
        "label": "Gas Under Pressure",
        "plain_meaning": "Pressurized container — risk of rupture if heated.",
        "safety_tips": [
            "Don't store in hot areas or direct sunlight",
            "Never puncture or burn the container",
        ],
    },
    "GHS_Symbol_HEALTH_HAZARD": {
        "label": "Health Hazard",
        "plain_meaning": "Can cause serious health effects from inhalation, ingestion, or prolonged contact.",
        "safety_tips": [
            "Use a mask and gloves",
            "Ensure good ventilation while handling",
        ],
    },
    "GHS_Symbol_SKULL_AND_CROSSBONES": {
        "label": "Acute Toxicity",
        "plain_meaning": "Highly toxic — can be fatal if swallowed, inhaled, or absorbed through skin.",
        "safety_tips": [
            "NEVER ingest or inhale directly",
            "Store locked away, out of reach of children and food",
            "If exposed, seek emergency medical help or poison control immediately",
        ],
    },
}


class LookupRequest(BaseModel):
    ghs_classes: list[str] = []
    product_name_text: str | None = None


class LookupResponse(BaseModel):
    hazards: list[dict]
    pubchem_compound: dict | None = None
    source: str  # "cache" | "live" | "static_only" | "unavailable"


@router.post("/lookup", response_model=LookupResponse)
async def lookup(req: LookupRequest):
    if not req.ghs_classes and not req.product_name_text:
        raise HTTPException(400, "Provide at least ghs_classes or product_name_text")

    hazards = [
        {"class": c, **GHS_CLASS_INFO[c]} for c in req.ghs_classes if c in GHS_CLASS_INFO
    ]

    pubchem_compound = None
    source = "static_only"

    if req.product_name_text:
        query = req.product_name_text.lower().strip()

        cache_hit = None
        if supabase:
            try:
                cache_hit = (
                    supabase.table("pubchem_cache").select("*").eq("query_text", query).execute()
                )
            except Exception as e:
                logger.warning(f"Supabase cache read failed: {e}")

        if cache_hit and cache_hit.data:
            pubchem_compound = cache_hit.data[0]["response_json"]
            source = "cache"
        else:
            pubchem_compound = await _query_pubchem_with_retry(query)
            if pubchem_compound:
                source = "live"
                if supabase:
                    try:
                        supabase.table("pubchem_cache").insert(
                            {"query_text": query, "response_json": pubchem_compound}
                        ).execute()
                    except Exception as e:
                        logger.warning(f"Supabase cache write failed: {e}")
            else:
                # PubChem down or no match — hazards from static GHS info
                # still get returned above, so the response is never empty.
                source = "unavailable" if hazards else "static_only"

    return LookupResponse(hazards=hazards, pubchem_compound=pubchem_compound, source=source)


async def _query_pubchem_with_retry(name: str) -> dict | None:
    """Retries on transient errors only (timeouts, connection errors, 5xx).
    4xx (bad name, not found) fails fast — retrying won't change the outcome."""
    for attempt in range(MAX_RETRIES):
        try:
            return await _query_pubchem(name)
        except _RetryableError as e:
            if attempt == MAX_RETRIES - 1:
                logger.error(f"PubChem lookup failed after {MAX_RETRIES} attempts: {e}")
                return None
            wait = BACKOFF_BASE_S * (2**attempt)
            logger.info(f"PubChem lookup attempt {attempt + 1} failed, retrying in {wait}s")
            await asyncio.sleep(wait)
        except _NotFoundError:
            return None  # not retryable — the compound genuinely doesn't exist
    return None


class _RetryableError(Exception):
    pass


class _NotFoundError(Exception):
    pass


async def _query_pubchem(name: str) -> dict:
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S) as client:
        try:
            cid_resp = await client.get(f"{PUBCHEM_BASE}/compound/name/{name}/cids/JSON")
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            raise _RetryableError(str(e))

        if cid_resp.status_code == 404:
            raise _NotFoundError(name)
        if cid_resp.status_code >= 500:
            raise _RetryableError(f"PubChem returned {cid_resp.status_code}")
        if cid_resp.status_code != 200:
            raise _NotFoundError(name)

        cids = cid_resp.json().get("IdentifierList", {}).get("CID", [])
        if not cids:
            raise _NotFoundError(name)
        cid = cids[0]

        try:
            props_resp = await client.get(
                f"{PUBCHEM_BASE}/compound/cid/{cid}/property/"
                "IUPACName,MolecularFormula,CanonicalSMILES/JSON"
            )
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            raise _RetryableError(str(e))

        if props_resp.status_code >= 500:
            raise _RetryableError(f"PubChem returned {props_resp.status_code}")

        properties = props_resp.json().get("PropertyTable", {}).get("Properties", [{}])
        if not properties:
            raise _NotFoundError(name)

        return {"cid": cid, **properties[0]}
