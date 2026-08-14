from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from supabase import create_client, Client

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
# Lazy/guarded client creation — importing this module must never crash the
# app at startup just because env vars aren't configured yet (e.g. first
# deploy before Railway env vars are set). Endpoints that need it will get
# a clear runtime error instead of the whole process failing to boot.
supabase: Client | None = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    if SUPABASE_URL and SUPABASE_SERVICE_KEY
    else None
)


class ZoneCreate(BaseModel):
    org_id: str
    name: str
    hazard_types: list[str]       # detected GHS classes from the assessment scan
    required_ppe: list[str]       # derived / admin-confirmed, e.g. ["gloves","goggles"]
    additional_requirements: str | None = None  # extra safety requirements text
    created_by: str               # admin user id


def _require_db():
    if supabase is None:
        raise HTTPException(503, "Backend is not configured (missing SUPABASE_URL/SUPABASE_SERVICE_KEY)")
    return supabase


@router.post("")
def create_zone(zone: ZoneCreate):
    db = _require_db()
    result = db.table("zones").insert(zone.model_dump()).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create zone")
    zone_row = result.data[0]
    # QR payload is just the zone id; the frontend renders it as a QR code
    return {"zone": zone_row, "qr_payload": zone_row["id"]}


@router.get("/{zone_id}")
def get_zone(zone_id: str):
    db = _require_db()
    result = db.table("zones").select("*").eq("id", zone_id).execute()
    if not result.data:
        raise HTTPException(404, "Zone not found")
    return result.data[0]


@router.get("/org/{org_id}")
def list_zones(org_id: str):
    db = _require_db()
    result = db.table("zones").select("*").eq("org_id", org_id).execute()
    return result.data
