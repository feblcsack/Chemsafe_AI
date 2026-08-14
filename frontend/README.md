# ChemSafe / GHS-Lens — MVP

AI-powered chemical hazard detection. GHS pictogram recognition and OCR run
entirely client-side in the browser; PPE compliance monitoring runs as a
real-time video stream against a FastAPI backend.

---

## Architecture at a glance

```
┌─────────────────────────────────────────────────────────────┐
│                         USER'S DEVICE                        │
│                                                                │
│  Next.js (Vercel)                                             │
│    ├─ GHS pictogram detection  → onnxruntime-web (in-browser) │
│    ├─ OCR (product label text) → Tesseract.js (in-browser)    │
│    └─ PPE video frames  ───────────────────────────┐          │
│                                                     │          │
└─────────────────────────────────────────────────────┼──────────┘
                                                        │ WebSocket
                                                        │ (JPEG frames, ~2 fps)
┌───────────────────────────────────────────────────────▼──────┐
│                    FastAPI backend (Railway)                  │
│    ├─ /ppe/stream/{worker_id}/{zone_id}  → PPE inference      │
│    ├─ /pubchem/lookup                    → PubChem proxy      │
│    ├─ /zones, /scans, /admin/analytics   → business logic     │
│    └─ /inference/openvino/detect (optional, single-image)     │
└─────────────────────────────────────────────────────────┬─────┘
                                                            │
                                              ┌─────────────▼─────────────┐
                                              │  Supabase (Auth + Postgres)│
                                              └─────────────────────────────┘
```

**Why PPE detection is the one flow that isn't fully on-device:** the PPE
model (YOLO11s, 37MB) is significantly heavier than the GHS model. Benchmarked
on a standard CPU container, one inference pass takes ~400-500ms — that's
fine as a backend WebSocket loop throttled to ~2 fps, but too slow to run
smoothly in a browser tab via WASM without a noticeably janky UI. GHS
detection uses a much lighter model and stays fully client-side as originally
planned.

---

## ⚠️ Set expectations correctly before a demo or pitch

**"Real-time" PPE monitoring here means ~2 frames per second, not smooth
video.** That's a direct consequence of running a YOLO11s model on CPU
without a GPU. Two ways to describe this honestly to judges:
- *"Near-real-time compliance checking, refreshing roughly every half-second
  — fast enough to catch a sustained PPE violation, not fast enough for
  frame-perfect tracking."*
- If you need higher throughput: either train a smaller model variant
  (YOLO11n) for a meaningful speed gain, or deploy on GPU-backed hosting.
  Verify current GPU availability directly on Railway's docs before
  committing to a specific plan — this changes over time and shouldn't be
  taken on faith from any single source, including this README.

**Admin dashboard does not show live video from workers.** The WebSocket
sends detection *results* back only to the device that sent the frame (the
worker's own browser) — there's no video relay to the admin's screen. Admin
sees compliance **status** (compliant / violation, updated within 1-2s via
Supabase Realtime), not a video feed. Building true video relay is a real
follow-on feature (frame re-broadcast or WebRTC), not something to claim as
already working.

**OCR will not be perfect.** Real-world label photos vary too much in
lighting, angle, and print quality for any client-side OCR to be flawless.
The UI is built around this: confidence score shown, always editable before
submission. Don't promise "flawless OCR" in a pitch — promise "OCR with a
human-in-the-loop correction step," which is both true and more impressive
to a technical judge.

---

## ✅ Feature checklist

- [x] Household mode (`/scan`) — no auth, on-device GHS detection, editable
      OCR, PubChem lookup, plain-language hazard education
- [x] Workplace assessment (`/admin/zones/new`) — admin scans a zone,
      suggested PPE requirements, QR code generation
- [x] Worker onboarding (`/worker/dashboard`) — QR scan to check into a zone,
      see required PPE
- [x] **PPE live monitoring** — worker's device streams frames over
      WebSocket to FastAPI; server runs YOLO11s inference; admin sees status
      via Supabase Realtime (not video — see caveats above)
- [x] Full auth — Supabase Auth, admin/worker roles, RLS per table
- [x] Admin analytics — zone count, scan count, most common hazard
- [x] PubChem integration hardened — retries with exponential backoff on
      transient errors (timeouts, connection errors, 5xx), fast-fail on 4xx,
      graceful fallback to static GHS safety info if PubChem is unreachable
- [x] Optional OpenVINO-accelerated single-image endpoint (see below)
- [x] UI rebuilt on a small shadcn-style component set (`components/ui/`)
      plus bespoke Aceternity-style motion pieces (spotlight, scan grid,
      text reveal) — see Design system section

---

## 🧠 Why OpenVINO is a separate, optional path

`onnxruntime-web` (used for all client-side inference) does not support
OpenVINO as an execution provider — that's a browser-only API surface
(WASM / WebGL / WebGPU). OpenVINO only runs natively (Python/C++).

So it lives as an **optional FastAPI endpoint**
(`backend/routers/openvino_infer.py`) for single-image inference — useful
for a fixed kiosk device, batch processing, or simply to demonstrate Intel
stack usage for judging criteria. It is not part of the default flow.

To enable it:
```bash
pip install openvino-dev
python backend/openvino_assets/convert_model.py backend/models/ghs-detector.onnx
```

---

## 🎨 Design system

Palette and type moved away from generic AI-template defaults (no cream
background + terracotta accent, no default dark+neon-green look) toward
something grounded in the product's own subject matter — a computer-vision
safety sensor:

- **Colors:** `ink` (#101314, near-black), `paper` (#F7F5EF), `hazard`
  (#F2B707, GHS pictogram yellow — primary accent), `corrosive` (#C1440E,
  danger states), `safe` (#2E6B4F, compliant states), `steel` (#5B6770,
  secondary text)
- **Type:** JetBrains Mono for display/headings (technical, sensor-readout
  feel), Inter for body text
- **Signature element:** a faint grid + scanning line sweep
  (`components/ui/scan-grid.tsx`) referencing the actual mechanism the
  product uses — a model scanning a frame — rather than decoration for its
  own sake
- **Component layer:** `components/ui/` follows shadcn/ui conventions
  (`cva` variants, `cn()` merge utility, Radix `Slot` for `asChild`) —
  hand-authored to match that system exactly since the shadcn CLI needs
  network access this environment doesn't have; drop-in compatible if you
  later run `npx shadcn add <component>` in your own environment
- **Motion:** `framer-motion` for the hero text reveal and ambient spotlight
  drift — used once, deliberately, not scattered across every element

---

## Setup — Local Development

### 1. Supabase
1. Create a new project at supabase.com
2. SQL Editor → paste `supabase/schema.sql` → Run
3. Copy the Project URL and `anon` key from Settings → API

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY
uvicorn main:app --reload --port 8000
```
The PPE model is already at `backend/models/ppe-detector.quant.onnx`
(INT8-quantized, ~10MB — quantized from your 37MB export for faster CPU
inference; the full-precision `.onnx` is kept alongside as a fallback).

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Supabase URL/anon key + API URL
npm run dev
```
Open http://localhost:3000. The GHS model is already at
`frontend/public/models/ghs-detector.onnx`.

### 4. Test the full loop locally
1. Sign up as **admin** → create a zone via `/admin/zones/new` (scan any
   printed hazard symbol, or a phone screen showing one, to test detection)
2. Note the generated QR code
3. Sign up as **worker** (separate browser/incognito window) →
   `/worker/dashboard` → scan that QR (point your webcam at the other
   screen's QR code)
4. Worker dashboard should show required PPE, then start streaming to
   `PPELiveMonitor` — check the browser console and backend logs if the
   WebSocket doesn't connect
5. Back on the admin dashboard, the worker's compliance status card should
   update within a couple seconds

---

## Deploy — Production

### Frontend → Vercel
1. Push the repo to GitHub
2. Import the project on vercel.com, root directory: `frontend`
3. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_API_URL` (fill in after the backend is deployed)

### Backend → Railway
1. New Project on railway.app → Deploy from GitHub, root directory: `backend`
2. Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `FRONTEND_URL`,
   optionally `ORT_INTRA_OP_THREADS` and `PPE_MIN_FRAME_INTERVAL_S` to tune
   for your plan's CPU allocation
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Copy the Railway URL into `NEXT_PUBLIC_API_URL` on Vercel — use `wss://`
   automatically handled by the frontend's URL-scheme swap in
   `PPELiveMonitor.tsx`, no separate config needed

### A note on WebSocket + Railway
Railway supports long-lived WebSocket connections on standard deployments
(no special config needed beyond a normal web service). If you scale to
multiple backend replicas later, you'll need sticky sessions or a shared
state layer for the per-connection frame throttling — not a concern at MVP
scale with a single instance.

---

## Known limitations (be upfront about these, don't let a judge find them first)

- PPE throughput is CPU-bound at ~2 fps (see expectations section above)
- No video relay to admin — status only
- OCR accuracy is not guaranteed; correction step is the mitigation, not a
  substitute for accuracy
- `worker_zone_map` has no "leave zone" flow yet — a worker who switches
  zones will still show as checked into the old one until this is added
- Single-organization-per-admin signup flow; no "join an existing org by
  invite" flow yet
