from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
import os
from supabase import create_client, Client

logger = logging.getLogger("scans")

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


class HouseholdScanLog(BaseModel):
    hazard_detected: list[str]
    ocr_text: str | None = None
    pubchem_data: dict | None = None
    session_id: str | None = None  # anonymous, no auth required


class WorkplaceScanLog(BaseModel):
    zone_id: str
    scanned_by: str  # admin user id
    hazard_detected: list[str]
    pubchem_data: dict | None = None


@router.post("/household")
def log_household_scan(scan: HouseholdScanLog):
    # This is a fire-and-forget analytics log called from the anonymous
    # household scan flow — the frontend doesn't wait on it or handle its
    # errors, so a missing DB config should degrade silently, not surface
    # as a failed request the user sees.
    if supabase is None:
        logger.warning("household scan not logged: Supabase not configured")
        return {}
    result = supabase.table("household_scans").insert(scan.model_dump()).execute()
    return result.data[0] if result.data else {}


@router.post("/workplace")
def log_workplace_scan(scan: WorkplaceScanLog):
    if supabase is None:
        raise HTTPException(503, "Backend is not configured (missing SUPABASE_URL/SUPABASE_SERVICE_KEY)")
    result = supabase.table("workplace_scans").insert(scan.model_dump()).execute()
    return result.data[0] if result.data else {}
