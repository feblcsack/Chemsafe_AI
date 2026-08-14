/**
 * Client-side OCR (Tesseract.js) for reading product name/text off labels
 * in Household mode, so we can query PubChem by name in addition to the
 * GHS pictogram classes.
 *
 * IMPORTANT: OCR accuracy on real-world product labels varies a lot with
 * lighting, angle, and font — it will NOT be perfect. We surface a
 * confidence score and always let the user edit the extracted text
 * before it's used, rather than pretending it's always correct.
 */
import { createWorker } from "tesseract.js";

export interface OCRResult {
  text: string;
  confidence: number; // 0-100, Tesseract's own confidence score
}

let workerPromise: ReturnType<typeof createWorker> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng+ind"); // English + Indonesian labels
  }
  return workerPromise;
}

export async function extractText(
  source: HTMLCanvasElement | HTMLImageElement
): Promise<OCRResult> {
  const worker = await getWorker();
  const {
    data: { text, confidence },
  } = await worker.recognize(source);

  return {
    text: text.trim(),
    confidence,
  };
}

/** Call on app teardown to free the worker's memory. */
export async function terminateOCR() {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
