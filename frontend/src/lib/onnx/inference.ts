/**
 * Client-side GHS pictogram detection using onnxruntime-web.
 *
 * IMPORTANT: onnxruntime-web is loaded via a <script> tag from CDN (see
 * app/layout.tsx), NOT imported as an npm module. Its bundle ships
 * pre-minified .mjs worker/threading loader files that use `import.meta`
 * in a way that breaks Next.js's webpack build when pulled into the
 * module graph — this is a known incompatibility, not something fixable
 * with a webpack rule tweak (tried three approaches; the CDN script tag
 * is what the ONNX Runtime team itself recommends for bundlers with this
 * problem). We only need the TYPES from the package, which `import type`
 * erases completely at compile time — it never reaches webpack.
 *
 * Model: best.onnx (YOLOv8, exported without built-in NMS)
 *   input:  images [1,3,640,640]
 *   output: output0 [1,13,8400]  → 4 box coords + 9 class scores per anchor
 */
import type * as OrtTypes from "onnxruntime-web";

declare global {
  interface Window {
    ort: typeof OrtTypes;
  }
}

function getOrt(): typeof OrtTypes {
  if (typeof window === "undefined" || !window.ort) {
    throw new Error(
      "onnxruntime-web hasn't loaded yet. Make sure the CDN <Script> tag in " +
        "app/layout.tsx has finished loading before calling detectGHS()."
    );
  }
  return window.ort;
}

export const GHS_CLASSES = [
  "GHS_Symbol_CORROSION",
  "GHS_Symbol_ENVIRONMENT",
  "GHS_Symbol_EXCLAMATION_MARK",
  "GHS_Symbol_EXPLODING_BOMB",
  "GHS_Symbol_FLAME",
  "GHS_Symbol_FLAME_OVER_CIRCLE",
  "GHS_Symbol_GAS_CYLINDER",
  "GHS_Symbol_HEALTH_HAZARD",
  "GHS_Symbol_SKULL_AND_CROSSBONES",
] as const;

export type GHSClass = (typeof GHS_CLASSES)[number];

export interface Detection {
  class: GHSClass;
  confidence: number;
  box: [number, number, number, number]; // x1,y1,x2,y2 in ORIGINAL image pixels
}

const MODEL_URL = "/models/ghs-detector.onnx";
const INPUT_SIZE = 640;

let sessionPromise: Promise<OrtTypes.InferenceSession> | null = null;

/** Loads (and caches) the inference session. Call once, reuse across scans. */
export function getSession(): Promise<OrtTypes.InferenceSession> {
  if (!sessionPromise) {
    const ort = getOrt();
    ort.env.wasm.wasmPaths =
      "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/";
    sessionPromise = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["webgpu", "wasm"], // tries WebGPU first, falls back to WASM
      graphOptimizationLevel: "all",
    });
  }
  // TypeScript now knows sessionPromise is not null here
  return sessionPromise as Promise<OrtTypes.InferenceSession>;
}

interface Letterbox {
  data: Float32Array;
  scale: number;
  padX: number;
  padY: number;
}

/** Resizes image into a 640x640 letterboxed canvas, normalizes to [0,1], NCHW layout. */
function letterboxAndNormalize(img: HTMLImageElement | HTMLVideoElement): Letterbox {
  const srcW = "videoWidth" in img ? img.videoWidth : img.naturalWidth;
  const srcH = "videoHeight" in img ? img.videoHeight : img.naturalHeight;

  const scale = Math.min(INPUT_SIZE / srcW, INPUT_SIZE / srcH);
  const newW = Math.round(srcW * scale);
  const newH = Math.round(srcH * scale);
  const padX = Math.floor((INPUT_SIZE - newW) / 2);
  const padY = Math.floor((INPUT_SIZE - newH) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(114,114,114)"; // standard YOLO letterbox pad color
  ctx.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE);
  ctx.drawImage(img, padX, padY, newW, newH);

  const imageData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
  const chw = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
  const plane = INPUT_SIZE * INPUT_SIZE;

  for (let i = 0; i < plane; i++) {
    chw[i] = imageData[i * 4] / 255;             // R
    chw[plane + i] = imageData[i * 4 + 1] / 255;  // G
    chw[2 * plane + i] = imageData[i * 4 + 2] / 255; // B
  }

  return { data: chw, scale, padX, padY };
}

function iou(a: number[], b: number[]): number {
  const [ax1, ay1, ax2, ay2] = a;
  const [bx1, by1, bx2, by2] = b;
  const interX1 = Math.max(ax1, bx1);
  const interY1 = Math.max(ay1, by1);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);
  const interArea = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
  const areaA = (ax2 - ax1) * (ay2 - ay1);
  const areaB = (bx2 - bx1) * (by2 - by1);
  return interArea / (areaA + areaB - interArea + 1e-9);
}

/** Manual NMS since the model was exported with nms=False. */
function nonMaxSuppression(dets: Detection[], iouThreshold = 0.45): Detection[] {
  const sorted = [...dets].sort((a, b) => b.confidence - a.confidence);
  const kept: Detection[] = [];
  while (sorted.length) {
    const best = sorted.shift()!;
    kept.push(best);
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].class === best.class && iou(best.box, sorted[i].box) > iouThreshold) {
        sorted.splice(i, 1);
      }
    }
  }
  return kept;
}

export interface DetectOptions {
  confidenceThreshold?: number; // default 0.35
  iouThreshold?: number;        // default 0.45
}

export async function detectGHS(
  img: HTMLImageElement | HTMLVideoElement,
  opts: DetectOptions = {}
): Promise<Detection[]> {
  const { confidenceThreshold = 0.35, iouThreshold = 0.45 } = opts;

  const ort = getOrt();
  const session = await getSession();
  const { data, scale, padX, padY } = letterboxAndNormalize(img);

  const tensor = new ort.Tensor("float32", data, [1, 3, INPUT_SIZE, INPUT_SIZE]);
  const outputs = await session.run({ [session.inputNames[0]]: tensor });
  const output = outputs[session.outputNames[0]]; // [1,13,8400]

  const raw = output.data as Float32Array;
  const numAnchors = output.dims[2]; // 8400
  const numAttrs = output.dims[1];   // 13 (4 box + 9 classes)
  const numClasses = numAttrs - 4;

  const candidates: Detection[] = [];

  for (let a = 0; a < numAnchors; a++) {
    // output is [1, attrs, anchors] — attrs are the OUTER stride, so index as attrs*numAnchors + a
    let bestClass = -1;
    let bestScore = -Infinity;
    for (let c = 0; c < numClasses; c++) {
      const score = raw[(4 + c) * numAnchors + a];
      if (score > bestScore) {
        bestScore = score;
        bestClass = c;
      }
    }
    if (bestScore < confidenceThreshold) continue;

    const cx = raw[0 * numAnchors + a];
    const cy = raw[1 * numAnchors + a];
    const w = raw[2 * numAnchors + a];
    const h = raw[3 * numAnchors + a];

    // Map from letterboxed 640x640 space back to original image pixels
    const x1 = (cx - w / 2 - padX) / scale;
    const y1 = (cy - h / 2 - padY) / scale;
    const x2 = (cx + w / 2 - padX) / scale;
    const y2 = (cy + h / 2 - padY) / scale;

    candidates.push({
      class: GHS_CLASSES[bestClass],
      confidence: bestScore,
      box: [x1, y1, x2, y2],
    });
  }

  return nonMaxSuppression(candidates, iouThreshold);
}
