"""
OPTIONAL accelerated inference path using Intel OpenVINO Runtime.

This is NOT the default flow for the app (default = onnxruntime-web,
client-side, in the visitor's own browser). This endpoint exists as:
  1. A showcase of Intel OpenVINO usage for the Intel AI Global Impact
     Festival judging criteria.
  2. A practical fallback for low-power devices where in-browser WASM
     inference is too slow (e.g. a fixed kiosk tablet at a factory
     entrance running a lightweight web view).

Requires the ONNX model to be converted to OpenVINO IR first — see
openvino_assets/convert_model.py, run once, offline, before deploying.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
import numpy as np
from PIL import Image
import io
import os

router = APIRouter()

_MODEL_XML = os.path.join(os.path.dirname(__file__), "..", "openvino_assets", "best.xml")
_compiled_model = None
_input_layer = None
_output_layer = None

CLASS_NAMES = [
    "GHS_Symbol_CORROSION", "GHS_Symbol_ENVIRONMENT", "GHS_Symbol_EXCLAMATION_MARK",
    "GHS_Symbol_EXPLODING_BOMB", "GHS_Symbol_FLAME", "GHS_Symbol_FLAME_OVER_CIRCLE",
    "GHS_Symbol_GAS_CYLINDER", "GHS_Symbol_HEALTH_HAZARD", "GHS_Symbol_SKULL_AND_CROSSBONES",
]


def _lazy_load_model():
    """Loads the OpenVINO-compiled model on first request, not at import time,
    so the backend still boots fine on machines/deploys without the IR files
    present (e.g. Railway container that hasn't run the conversion step)."""
    global _compiled_model, _input_layer, _output_layer
    if _compiled_model is not None:
        return
    if not os.path.exists(_MODEL_XML):
        raise HTTPException(
            503,
            "OpenVINO model not converted yet. Run openvino_assets/convert_model.py "
            "first, or use the default browser-based inference instead.",
        )
    from openvino.runtime import Core

    core = Core()
    model = core.read_model(_MODEL_XML)
    _compiled_model = core.compile_model(model, "CPU")
    _input_layer = _compiled_model.input(0)
    _output_layer = _compiled_model.output(0)


def _letterbox(img: Image.Image, size=640):
    w, h = img.size
    scale = min(size / w, size / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = img.resize((nw, nh))
    canvas = Image.new("RGB", (size, size), (114, 114, 114))
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2))
    return canvas, scale, (size - nw) // 2, (size - nh) // 2


def _nms(boxes, scores, iou_threshold=0.45):
    if len(boxes) == 0:
        return []
    boxes = np.array(boxes)
    scores = np.array(scores)
    x1, y1, x2, y2 = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(int(i))
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0, xx2 - xx1)
        h = np.maximum(0, yy2 - yy1)
        inter = w * h
        iou = inter / (areas[i] + areas[order[1:]] - inter + 1e-9)
        order = order[1:][iou < iou_threshold]
    return keep


@router.post("/detect")
async def detect_ghs_openvino(file: UploadFile = File(...), confidence: float = 0.25):
    _lazy_load_model()

    img_bytes = await file.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    letterboxed, scale, pad_x, pad_y = _letterbox(img)

    arr = np.asarray(letterboxed).astype(np.float32) / 255.0
    arr = arr.transpose(2, 0, 1)[np.newaxis, ...]  # NCHW

    result = _compiled_model([arr])[_output_layer]  # [1, 13, 8400]
    preds = result[0].T  # -> [8400, 13]

    boxes, scores, class_ids = [], [], []
    for row in preds:
        cls_scores = row[4:]
        cls_id = int(np.argmax(cls_scores))
        conf = float(cls_scores[cls_id])
        if conf < confidence:
            continue
        cx, cy, w, h = row[:4]
        x1 = (cx - w / 2 - pad_x) / scale
        y1 = (cy - h / 2 - pad_y) / scale
        x2 = (cx + w / 2 - pad_x) / scale
        y2 = (cy + h / 2 - pad_y) / scale
        boxes.append([x1, y1, x2, y2])
        scores.append(conf)
        class_ids.append(cls_id)

    keep = _nms(boxes, scores)

    detections = [
        {
            "class": CLASS_NAMES[class_ids[i]],
            "confidence": round(scores[i], 3),
            "box": [round(v, 1) for v in boxes[i]],
        }
        for i in keep
    ]
    return {"detections": detections, "engine": "openvino"}
