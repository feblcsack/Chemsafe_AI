from fastapi import APIRouter, HTTPException
from collections import Counter
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


def _require_db():
    if supabase is None:
        raise HTTPException(503, "Backend is not configured (missing SUPABASE_URL/SUPABASE_SERVICE_KEY)")
    return supabase


@router.get("/org/{org_id}")
def get_org_analytics(org_id: str):
    db = _require_db()
    zones = db.table("zones").select("id").eq("org_id", org_id).execute().data
    zone_ids = [z["id"] for z in zones]

    if not zone_ids:
        return {
            "total_zones": 0,
            "total_scans": 0,
            "most_common_hazard": None,
            "hazard_breakdown": {},
            "ppe_compliance_rate": None,
        }

    scans = (
        db.table("workplace_scans")
        .select("hazard_detected")
        .in_("zone_id", zone_ids)
        .execute()
        .data
    )

    hazard_counter: Counter = Counter()
    for s in scans:
        for h in s.get("hazard_detected", []):
            hazard_counter[h] += 1

    # PPE compliance, from live-stream events (once the PPE feature is active)
    ppe_events = (
        db.table("ppe_events")
        .select("compliance_status")
        .in_("zone_id", zone_ids)
        .execute()
        .data
    )
    compliance_rate = None
    if ppe_events:
        compliant = sum(1 for e in ppe_events if e["compliance_status"] == "compliant")
        compliance_rate = round(compliant / len(ppe_events) * 100, 1)

    return {
        "total_zones": len(zone_ids),
        "total_scans": len(scans),
        "most_common_hazard": hazard_counter.most_common(1)[0][0] if hazard_counter else None,
        "hazard_breakdown": dict(hazard_counter),
        "ppe_compliance_rate": compliance_rate,
    }


@router.get("/household/summary")
def get_household_summary():
    db = _require_db()
    scans = db.table("household_scans").select("hazard_detected").execute().data
    hazard_counter: Counter = Counter()
    for s in scans:
        for h in s.get("hazard_detected", []):
            hazard_counter[h] += 1
    return {
        "total_scans": len(scans),
        "hazard_breakdown": dict(hazard_counter),
    }
