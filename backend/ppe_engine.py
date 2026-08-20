"""
Server-side PPE detection engine.

This runs on the FastAPI backend (unlike GHS detection, which runs
client-side via onnxruntime-web). Kept as a standalone module so the
inference session is created once and reused across every frame/request,
instead of reloading the model per call — that reload cost is the single
biggest latency killer in naive real-time video pipelines.
"""
import numpy as np
from PIL import Image
import onnxruntime as ort
import os
import io
import time

_QUANT_PATH = os.path.join(os.path.dirname(__file__), "models", "ppe-detector.quant.onnx")
_FULL_PATH = os.path.join(os.path.dirname(__file__), "models", "ppe-detector.onnx")
# Prefer the INT8-quantized model (smaller, faster CPU inference — see
# openvino_assets/../models/README for the conversion command). Falls back
# to the full-precision model if quantization hasn't been run yet.
MODEL_PATH = _QUANT_PATH if os.path.exists(_QUANT_PATH) else _FULL_PATH
INPUT_SIZE = 640

CLASS_NAMES = [
    "Helmet", "Gloves", "Vest", "Boots", "Goggles", "none",
    "Person", "no_helmet", "no_goggle", "no_gloves", "no_boots",
]

# Classes that represent an active PPE violation
VIOLATION_CLASSES = {"no_helmet", "no_goggle", "no_gloves", "no_boots"}


class PPEEngine:
    """Singleton-style wrapper around the ONNX Runtime session.
    Instantiate ONCE at app startup and reuse for every frame."""

    def __init__(self):
        self.session = None
        self.input_name = None
        self.output_name = None

    def _ensure_session(self):
        if self.session is not None:
            return

        so = ort.SessionOptions()
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        # Cap intra-op threads — on Railway's shared CPU, oversubscribing
        # threads across concurrent WebSocket connections causes contention
        # and *increases* latency rather than reducing it.
        so.intra_op_num_threads = int(os.getenv("ORT_INTRA_OP_THREADS", "2"))
        so.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL

        self.session = ort.InferenceSession(
            MODEL_PATH, sess_options=so, providers=["CPUExecutionProvider"]
        )
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

    def _letterbox(self, img: Image.Image, size: int = INPUT_SIZE):
        w, h = img.size
        scale = min(size / w, size / h)
        nw, nh = int(w * scale), int(h * scale)
        resized = img.resize((nw, nh))
        canvas = Image.new("RGB", (size, size), (114, 114, 114))
        pad_x, pad_y = (size - nw) // 2, (size - nh) // 2
        canvas.paste(resized, (pad_x, pad_y))
        return canvas, scale, pad_x, pad_y

    def _nms(self, boxes, scores, class_ids, iou_threshold=0.45):
        if not boxes:
            return []
        boxes_arr = np.array(boxes)
        scores_arr = np.array(scores)
        x1, y1, x2, y2 = boxes_arr[:, 0], boxes_arr[:, 1], boxes_arr[:, 2], boxes_arr[:, 3]
        areas = (x2 - x1) * (y2 - y1)
        order = scores_arr.argsort()[::-1]
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
            same_class = class_ids[order[1:]] == class_ids[i]
            order = order[1:][(iou < iou_threshold) | (~same_class)]
        return keep

    def detect(self, image_bytes: bytes, confidence: float = 0.4, required_ppe: list[str] = None) -> dict:
        t0 = time.perf_counter()
        self._ensure_session()

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        letterboxed, scale, pad_x, pad_y = self._letterbox(img)

        arr = np.asarray(letterboxed).astype(np.float32) / 255.0
        arr = arr.transpose(2, 0, 1)[np.newaxis, ...]

        result = self.session.run([self.output_name], {self.input_name: arr})[0]
        preds = result[0].T  # [anchors, 15] -> 4 box + 11 class scores

        # ===== VECTORIZED INFERENCE (MUCH FASTER) =====
        # Extract all class scores at once
        cls_scores = preds[:, 4:]  # [N, 11]
        cls_ids = np.argmax(cls_scores, axis=1)  # [N]
        confidences = np.max(cls_scores, axis=1)  # [N]
        
        # Filter by confidence threshold
        mask = confidences >= confidence
        if not mask.any():
            return {
                "detections": [],
                "violations": [],
                "compliant": True,
                "inference_ms": round((time.perf_counter() - t0) * 1000, 1),
            }
        
        # Get filtered predictions
        filtered_boxes = preds[mask, :4]  # [cx, cy, w, h]
        filtered_cls_ids = cls_ids[mask]
        filtered_confidences = confidences[mask]
        
        # Convert box coords vectorized: cx,cy,w,h -> x1,y1,x2,y2 in original image space
        cx, cy, w, h = filtered_boxes[:, 0], filtered_boxes[:, 1], filtered_boxes[:, 2], filtered_boxes[:, 3]
        x1 = (cx - w / 2 - pad_x) / scale
        y1 = (cy - h / 2 - pad_y) / scale
        x2 = (cx + w / 2 - pad_x) / scale
        y2 = (cy + h / 2 - pad_y) / scale
        
        boxes = np.stack([x1, y1, x2, y2], axis=1).tolist()
        class_ids = filtered_cls_ids.tolist()
        scores = filtered_confidences.tolist()
        
        # Apply NMS
        keep = self._nms(boxes, scores, np.array(class_ids)) if class_ids else []

        detections = [
            {
                "class": CLASS_NAMES[class_ids[i]],
                "confidence": round(scores[i], 3),
                "box": [round(v, 1) for v in boxes[i]],
            }
            for i in keep
        ]

        # Determine violations based on zone requirements
        violations = []
        if required_ppe:
            # Map PPE requirements to detection classes
            ppe_mapping = {
                "helmet": "Helmet",
                "safety_goggles": "Goggles", 
                "goggles": "Goggles",
                "gloves": "Gloves",
                "safety_boots": "Boots",
                "boots": "Boots",
                "high_vis_vest": "Vest",
                "vest": "Vest",
            }
            
            detected_classes = {d["class"] for d in detections}
            
            for required in required_ppe:
                expected_class = ppe_mapping.get(required.lower())
                if expected_class and expected_class not in detected_classes:
                    # Add specific violation
                    violation_class = f"no_{expected_class.lower()}"
                    if violation_class in CLASS_NAMES:
                        violations.append(violation_class)
        else:
            # Fallback: use detected violation classes
            violations = [d["class"] for d in detections if d["class"] in VIOLATION_CLASSES]

        # Also include any directly detected violations
        detected_violations = [d["class"] for d in detections if d["class"] in VIOLATION_CLASSES]
        violations.extend(detected_violations)
        violations = list(set(violations))  # Remove duplicates

        return {
            "detections": detections,
            "violations": violations,
            "compliant": len(violations) == 0,
            "inference_ms": round((time.perf_counter() - t0) * 1000, 1),
        }


# Created once at import time, shared across all WebSocket connections
ppe_engine = PPEEngine()
