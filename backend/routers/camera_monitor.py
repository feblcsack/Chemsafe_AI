"""
IP Camera PPE Monitoring Service

Continuously pulls frames from monitoring station cameras,
runs PPE detection, and logs compliance events.
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
import asyncio
import os
import time
import cv2
import numpy as np
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import logging
import json
from supabase import create_client, Client

from ppe_engine import ppe_engine

router = APIRouter()
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client | None = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    if SUPABASE_URL and SUPABASE_SERVICE_KEY
    else None
)

# Global state for active camera monitors
_active_monitors: Dict[str, dict] = {}
_monitor_task: Optional[asyncio.Task] = None

# Configuration
FRAME_INTERVAL_S = float(os.getenv("CAMERA_FRAME_INTERVAL_S", "2.0"))  # Check every 2 seconds
COMPLIANCE_CHECK_INTERVAL_S = float(os.getenv("COMPLIANCE_CHECK_INTERVAL_S", "1.2"))  # Faster detection: ~1.2 seconds


class CameraStreamReader:
    """Handles reading frames from IP camera streams (MJPEG/RTSP)"""
    
    def __init__(self, camera_url: str):
        self.camera_url = camera_url
        self.cap: Optional[cv2.VideoCapture] = None
        self.last_frame = None
        self.last_frame_time = 0
        
    def connect(self) -> bool:
        """Connect to camera stream"""
        try:
            self.cap = cv2.VideoCapture(self.camera_url)
            if not self.cap.isOpened():
                logger.error(f"Failed to open camera: {self.camera_url}")
                return False
            logger.info(f"Connected to camera: {self.camera_url}")
            return True
        except Exception as e:
            logger.error(f"Error connecting to camera {self.camera_url}: {e}")
            return False
    
    def read_frame(self) -> Optional[np.ndarray]:
        """Read a frame from the camera"""
        if not self.cap or not self.cap.isOpened():
            if not self.connect():
                return None
        
        try:
            ret, frame = self.cap.read()
            if ret:
                self.last_frame = frame
                self.last_frame_time = time.time()
                return frame
            else:
                logger.warning(f"Failed to read frame from {self.camera_url}")
                # Try to reconnect
                self.disconnect()
                return None
        except Exception as e:
            logger.error(f"Error reading frame: {e}")
            self.disconnect()
            return None
    
    def disconnect(self):
        """Disconnect from camera"""
        if self.cap:
            self.cap.release()
            self.cap = None


async def monitor_camera_station(station_id: str, camera_url: str, zone_id: str):
    """
    Background task to continuously monitor a camera station.
    Runs PPE detection on frames and logs violations.
    """
    logger.info(f"Starting camera monitor for station {station_id}")
    
    reader = CameraStreamReader(camera_url)
    last_compliance_check = 0
    last_compliance_status: Optional[dict] = None
    
    # Get zone requirements
    zone_required_ppe = []
    if supabase:
        try:
            zone_result = supabase.table("zones").select("required_ppe").eq("id", zone_id).single().execute()
            if zone_result.data:
                zone_required_ppe = zone_result.data.get("required_ppe", [])
                logger.info(f"Zone {zone_id} requires PPE: {zone_required_ppe}")
        except Exception as e:
            logger.error(f"Failed to fetch zone requirements: {e}")
    
    try:
        while station_id in _active_monitors:
            frame = await asyncio.to_thread(reader.read_frame)
            
            if frame is None:
                await asyncio.sleep(1)  # Wait before retry
                continue
            
            now = time.time()
            
            # Only run detection at configured interval
            if now - last_compliance_check < COMPLIANCE_CHECK_INTERVAL_S:
                await asyncio.sleep(0.2)  # Shorter sleep for faster loop iteration
                continue
            
            last_compliance_check = now
            
            # Convert frame to JPEG bytes for PPE engine
            # Use adaptive quality: lower quality = faster encoding
            encode_quality = int(os.getenv("JPEG_ENCODE_QUALITY", "75"))  # 75 is good balance
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, encode_quality])
            frame_bytes = buffer.tobytes()
            
            # Store frame bytes for MJPEG streaming
            _active_monitors[station_id]['last_frame_bytes'] = frame_bytes
            _active_monitors[station_id]['last_frame_time'] = now
            
            # Run PPE detection
            result = await asyncio.to_thread(
                ppe_engine.detect, 
                frame_bytes, 
                0.4,  # confidence threshold
                zone_required_ppe
            )
            
            # Store latest detection result
            _active_monitors[station_id]['last_detection'] = {
                'timestamp': datetime.now().isoformat(),
                'compliant': result['compliant'],
                'violations': result['violations'],
                'detections': result['detections'],
                'inference_ms': result['inference_ms']
            }
            
            logger.info(f"Station {station_id}: PPE={'✅ Compliant' if result['compliant'] else '❌ Violations'} - {result['violations']}")
            
            # Get workers in this zone for logging
            workers_in_zone = []
            if supabase:
                try:
                    workers_result = supabase.table("worker_zone_map").select("worker_id").eq("zone_id", zone_id).execute()
                    if workers_result.data:
                        workers_in_zone = [w['worker_id'] for w in workers_result.data]
                except Exception as e:
                    logger.error(f"Failed to fetch workers in zone: {e}")
            
            # Log compliance events on state change or for each worker
            if result['compliant'] != (last_compliance_status.get('compliant') if last_compliance_status else None):
                status = "compliant" if result['compliant'] else "violation"
                
                # Log for each worker in zone
                if supabase and workers_in_zone:
                    for worker_id in workers_in_zone:
                        try:
                            supabase.table("ppe_events").insert({
                                "worker_id": worker_id,
                                "zone_id": zone_id,
                                "detected_ppe": result['detections'],
                                "compliance_status": status,
                                "camera_station_id": station_id
                            }).execute()
                            logger.info(f"Logged PPE event for worker {worker_id[:8]}: {status}")
                        except Exception as e:
                            logger.error(f"Failed to log PPE event: {e}")
                
                last_compliance_status = result.copy()
            
            # No additional sleep - COMPLIANCE_CHECK_INTERVAL_S is the only throttle
            
    except asyncio.CancelledError:
        logger.info(f"Camera monitor for station {station_id} cancelled")
    except Exception as e:
        logger.error(f"Error in camera monitor {station_id}: {e}")
    finally:
        reader.disconnect()
        logger.info(f"Camera monitor for station {station_id} stopped")


@router.post("/start-monitoring")
async def start_monitoring(background_tasks: BackgroundTasks):
    """
    Start monitoring all active camera stations.
    Fetches stations from database and spawns monitor tasks.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Get all active monitoring stations
        result = supabase.table("monitoring_stations").select("*").eq("status", "active").execute()
        
        if not result.data:
            return {"message": "No active monitoring stations found", "count": 0}
        
        stations = result.data
        started = []
        
        for station in stations:
            station_id = station['id']
            camera_url = station.get('camera_url')
            zone_id = station.get('zone_id')
            
            if not camera_url or not zone_id:
                logger.warning(f"Station {station_id} missing camera_url or zone_id")
                continue
            
            # Skip if already monitoring
            if station_id in _active_monitors:
                logger.info(f"Station {station_id} already being monitored")
                continue
            
            # Store monitor info
            _active_monitors[station_id] = {
                'station_name': station['station_name'],
                'camera_url': camera_url,
                'zone_id': zone_id,
                'started_at': datetime.now().isoformat(),
                'last_detection': None,
                'last_frame_bytes': None,  # For MJPEG streaming
                'last_frame_time': 0,  # Track frame timing
            }
            
            # Start monitor task
            task = asyncio.create_task(monitor_camera_station(station_id, camera_url, zone_id))
            _active_monitors[station_id]['task'] = task
            
            started.append(station_id)
            logger.info(f"Started monitoring station: {station['station_name']}")
        
        return {
            "message": "Monitoring started",
            "stations": started,
            "count": len(started)
        }
        
    except Exception as e:
        logger.error(f"Failed to start monitoring: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop-monitoring")
async def stop_monitoring():
    """Stop all camera monitoring tasks"""
    stopped = []
    
    for station_id, monitor_info in list(_active_monitors.items()):
        task = monitor_info.get('task')
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        stopped.append(station_id)
        del _active_monitors[station_id]
    
    return {
        "message": "Monitoring stopped",
        "stations": stopped,
        "count": len(stopped)
    }


@router.get("/monitoring-status")
async def get_monitoring_status():
    """Get status of all active monitors"""
    status = {}
    
    for station_id, monitor_info in _active_monitors.items():
        task = monitor_info.get('task')
        status[station_id] = {
            'station_name': monitor_info['station_name'],
            'started_at': monitor_info['started_at'],
            'is_running': task and not task.done() if task else False,
            'last_detection': monitor_info.get('last_detection')
        }
    
    return {
        "active_monitors": len(_active_monitors),
        "monitors": status
    }


@router.post("/detect-frame")
async def detect_frame(
    image: UploadFile = File(...),
    station_id: str = Form(...),
    required_ppe: str = Form("[]")
):
    """
    Detect PPE in a single uploaded frame (for device cameras).
    
    This endpoint allows browser-based device cameras to send frames
    for PPE detection without needing continuous video streaming.
    """
    try:
        # Parse required PPE
        required_ppe_list: List[str] = json.loads(required_ppe)
        
        # Read image bytes
        image_bytes = await image.read()
        
        # Run PPE detection
        result = await asyncio.to_thread(
            ppe_engine.detect,
            image_bytes,
            0.4,  # confidence threshold
            required_ppe_list
        )
        
        # Get zone_id for the station
        zone_id = None
        if supabase:
            try:
                station_result = supabase.table("monitoring_stations").select("zone_id").eq("id", station_id).single().execute()
                if station_result.data:
                    zone_id = station_result.data.get("zone_id")
            except Exception as e:
                logger.warning(f"Failed to fetch zone for station {station_id}: {e}")
        
        # Log PPE events if we have zone_id
        if supabase and zone_id:
            status = "compliant" if result['compliant'] else "violation"
            
            # Get workers in zone
            try:
                workers_result = supabase.table("worker_zone_map").select("worker_id").eq("zone_id", zone_id).execute()
                if workers_result.data:
                    for worker_row in workers_result.data:
                        worker_id = worker_row['worker_id']
                        try:
                            supabase.table("ppe_events").insert({
                                "worker_id": worker_id,
                                "zone_id": zone_id,
                                "detected_ppe": result['detections'],
                                "compliance_status": status,
                                "camera_station_id": station_id
                            }).execute()
                        except Exception as e:
                            logger.error(f"Failed to log PPE event for worker {worker_id}: {e}")
            except Exception as e:
                logger.error(f"Failed to fetch workers for zone {zone_id}: {e}")
        
        # Return detection result
        return {
            'timestamp': datetime.now().isoformat(),
            'compliant': result['compliant'],
            'violations': result['violations'],
            'detections': result['detections'],
            'inference_ms': result['inference_ms']
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid required_ppe JSON")
    except Exception as e:
        logger.error(f"Error detecting frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/station/{station_id}/latest")
async def get_latest_detection(station_id: str):
    """Get latest PPE detection result for a station"""
    if station_id not in _active_monitors:
        raise HTTPException(status_code=404, detail="Station not being monitored")
    
    detection = _active_monitors[station_id].get('last_detection')
    if not detection:
        raise HTTPException(status_code=404, detail="No detection data available yet")
    
    return detection


@router.get("/station/{station_id}/mjpeg")
async def stream_mjpeg(station_id: str, quality: int = 75):
    """
    MJPEG proxy stream for IP cameras.
    Optimized for performance with configurable quality.
    
    Query params:
    - quality: JPEG quality 1-100 (default 75, lower = faster/smaller)
    """
    if station_id not in _active_monitors:
        raise HTTPException(status_code=404, detail="Station not being monitored")
    
    # Validate quality parameter
    quality = max(50, min(quality, 95))  # Clamp between 50-95
    
    async def generate_mjpeg():
        """Generator that yields JPEG frames in MJPEG format"""
        last_frame_bytes = None
        frame_count = 0
        
        try:
            while station_id in _active_monitors:
                monitor_info = _active_monitors.get(station_id)
                if not monitor_info:
                    break
                
                frame_data = monitor_info.get('last_frame_bytes')
                
                if frame_data and frame_data != last_frame_bytes:
                    frame_count += 1
                    
                    # Optional: Re-compress frame for bandwidth optimization
                    # Only if quality is lower than 75 (detection uses 75)
                    if quality < 75:
                        try:
                            # Decode and re-encode at lower quality
                            import cv2
                            import numpy as np
                            nparr = np.frombuffer(frame_data, np.uint8)
                            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                            if img is not None:
                                _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, quality])
                                frame_data = buffer.tobytes()
                        except:
                            pass  # Use original if re-encoding fails
                    
                    # Yield MJPEG frame
                    yield (
                        b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + 
                        frame_data + 
                        b'\r\n'
                    )
                    last_frame_bytes = frame_data
                
                # Adaptive frame rate: ~15-20fps for smooth viewing
                # Lower FPS = less bandwidth, still smooth enough
                await asyncio.sleep(0.05)  # 20fps max
                
        except asyncio.CancelledError:
            logger.info(f"MJPEG stream for station {station_id} cancelled (served {frame_count} frames)")
        except Exception as e:
            logger.error(f"Error in MJPEG stream: {e}")
    
    return StreamingResponse(
        generate_mjpeg(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Accel-Buffering": "no"  # Disable proxy buffering for Railway/Nginx
        }
    )
