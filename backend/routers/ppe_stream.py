"""
Real-time PPE compliance detection over WebSocket.

Client sends JPEG frames as binary messages; server runs inference and
sends back JSON detection results. Frame rate is throttled server-side
(not just client-side) as a safety net against overload — a naive
per-frame ONNX inference loop on a shared Railway CPU will happily eat
100% CPU and start dropping/queueing frames under load without this.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import time
import os
from supabase import create_client, Client

from ppe_engine import ppe_engine

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
# Guarded like every other router — the live stream itself must keep working
# (detection + WebSocket response) even if DB logging isn't configured;
# only the ppe_events write is skipped, not the whole connection.
supabase: Client | None = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    if SUPABASE_URL and SUPABASE_SERVICE_KEY
    else None
)

# Minimum time between processed frames per connection. Tune based on
# how many concurrent workers you expect to stream at once — lower this
# only if you've load-tested Railway's CPU headroom for your plan.
MIN_FRAME_INTERVAL_S = float(os.getenv("PPE_MIN_FRAME_INTERVAL_S", "0.5"))  # ~2 fps


@router.websocket("/stream/{worker_id}/{zone_id}")
async def ppe_stream(websocket: WebSocket, worker_id: str, zone_id: str):
    await websocket.accept()
    last_processed = 0.0
    last_compliance_status: bool | None = None
    
    # Get zone requirements
    zone_required_ppe = []
    if supabase:
        try:
            zone_result = supabase.table("zones").select("required_ppe").eq("id", zone_id).single().execute()
            if zone_result.data:
                zone_required_ppe = zone_result.data.get("required_ppe", [])
        except Exception:
            pass  # Continue without zone requirements if fetch fails

    try:
        while True:
            frame_bytes = await websocket.receive_bytes()

            now = time.monotonic()
            if now - last_processed < MIN_FRAME_INTERVAL_S:
                continue  # drop this frame, client is sending faster than we process
            last_processed = now

            # Inference is CPU-bound and synchronous — run it in a thread
            # so it doesn't block the event loop for other connections.
            result = await asyncio.to_thread(ppe_engine.detect, frame_bytes, 0.4, zone_required_ppe)

            await websocket.send_json(result)

            # Only write to the DB on a state TRANSITION (compliant <-> violation),
            # not every frame — otherwise ppe_events grows unbounded at ~2 rows/sec/worker.
            if result["compliant"] != last_compliance_status:
                last_compliance_status = result["compliant"]
                status = "compliant" if result["compliant"] else "violation"
                try:
                    if supabase is None:
                        raise RuntimeError("Supabase not configured — skipping ppe_events write")
                    supabase.table("ppe_events").insert(
                        {
                            "worker_id": worker_id,
                            "zone_id": zone_id,
                            "detected_ppe": result["detections"],
                            "compliance_status": status,
                        }
                    ).execute()
                except Exception:
                    # DB hiccup shouldn't kill the live stream — log and keep going
                    pass

    except WebSocketDisconnect:
        pass
