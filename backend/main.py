"""
ChemSafe / GHS-Lens — FastAPI backend

Responsibilities:
  - Proxy PubChem lookups (API key + rate limiting stay server-side)
  - Zone / worker business logic
  - Scan logging + analytics aggregation
  - Real-time PPE compliance detection over WebSocket (server-side inference)
  - Optional OpenVINO-accelerated single-image inference path

NOTE: GHS pictogram detection and OCR run client-side in the browser
(onnxruntime-web + Tesseract.js) — this backend never receives raw
product images for that flow. PPE detection is the one exception:
it runs here, server-side, over a WebSocket video stream.
"""
from pathlib import Path
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def _load_env_file() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_env_file()


def _suspend_proxy_env() -> dict[str, str]:
    saved: dict[str, str] = {}
    for key in ("HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "ALL_PROXY", "all_proxy"):
        value = os.environ.pop(key, None)
        if value is not None:
          saved[key] = value
    return saved


def _restore_proxy_env(saved: dict[str, str]) -> None:
    for key, value in saved.items():
        os.environ[key] = value


_proxy_env = _suspend_proxy_env()

from routers import pubchem, zones, scans, analytics, openvino_infer, ppe_stream, camera_monitor

_restore_proxy_env(_proxy_env)

app = FastAPI(
    title="ChemSafe API",
    description="Backend for GHS-Lens: PubChem proxy, zone/worker logic, analytics, PPE stream",
    version="0.2.0",
)

origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pubchem.router, prefix="/pubchem", tags=["pubchem"])
app.include_router(zones.router, prefix="/zones", tags=["zones"])
app.include_router(scans.router, prefix="/scans", tags=["scans"])
app.include_router(analytics.router, prefix="/admin/analytics", tags=["analytics"])
app.include_router(openvino_infer.router, prefix="/inference/openvino", tags=["openvino (optional)"])
app.include_router(ppe_stream.router, prefix="/ppe", tags=["ppe-stream"])
app.include_router(camera_monitor.router, prefix="/camera", tags=["camera-monitor"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "chemsafe-backend"}
