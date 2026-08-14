"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { detectGHS, type Detection } from "@/lib/onnx/inference";
import { extractText } from "@/lib/ocr/extractText";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ScanSearch } from "lucide-react";

interface Props {
  onResult: (detections: Detection[], ocrText: string, ocrConfidence: number) => void;
}

export default function GHSScanner({ onResult }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const previewInFlightRef = useRef(false);
  const captureInProgressRef = useRef(false);
  const successTimeoutRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    let stream: MediaStream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // rear camera on phones
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setReady(true);
        }
      } catch {
        setError("Couldn't access the camera. Check your browser permissions.");
      }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateSize = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoSize({ width: video.videoWidth, height: video.videoHeight });
      }
    };

    updateSize();
    video.addEventListener("loadedmetadata", updateSize);
    video.addEventListener("resize", updateSize);

    return () => {
      video.removeEventListener("loadedmetadata", updateSize);
      video.removeEventListener("resize", updateSize);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    const schedulePreview = (delayMs: number) => {
      if (cancelled) return;
      previewTimeoutRef.current = window.setTimeout(async () => {
        if (
          cancelled ||
          previewInFlightRef.current ||
          captureInProgressRef.current ||
          !videoRef.current
        ) {
          schedulePreview(900);
          return;
        }

        previewInFlightRef.current = true;
        try {
          const dets = await detectGHS(videoRef.current, { confidenceThreshold: 0.4 });
          if (!cancelled && !captureInProgressRef.current) {
            setLiveDetections(dets);
          }
        } catch {
          // silent — live preview is best-effort, the capture flow handles real errors
        } finally {
          previewInFlightRef.current = false;
          schedulePreview(900);
        }
      }, delayMs);
    };

    schedulePreview(0);

    return () => {
      cancelled = true;
      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
    };
  }, [ready]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn("Cannot capture: video or canvas not ready");
      return;
    }
    
    console.log("Starting GHS capture...");
    setScanning(true);
    setError(null);
    captureInProgressRef.current = true;
    setCaptureSuccess(false);
    setCaptureStatus("Mendeteksi pictogram...");
    
    // Add timeout protection
    const timeoutId = setTimeout(() => {
      if (captureInProgressRef.current) {
        console.error("Capture timeout - resetting");
        captureInProgressRef.current = false;
        setScanning(false);
        setCaptureStatus(null);
        setError("Scan timeout. Please try again.");
      }
    }, 15000); // 15 second timeout

    try {
      console.log("Detecting GHS symbols...");
      const detections = await detectGHS(videoRef.current, { confidenceThreshold: 0.35 });
      console.log("Detections found:", detections.length, detections);
      
      setLiveDetections(detections);
      setCaptureSuccess(true);
      setCaptureStatus(
        detections.length > 0 ? `${detections.length} pictogram ditemukan` : "Label berhasil ditangkap"
      );

      if (successTimeoutRef.current !== null) {
        window.clearTimeout(successTimeoutRef.current);
      }

      await new Promise<void>((resolve) => {
        successTimeoutRef.current = window.setTimeout(resolve, 650);
      });

      console.log("Running OCR...");
      setCaptureStatus("Membaca teks...");
      
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);

      const ocr = await extractText(canvas);
      console.log("OCR result:", ocr);

      console.log("Calling onResult callback...");
      await Promise.resolve(onResult(detections, ocr.text, ocr.confidence));
      console.log("Capture completed successfully");
    } catch (err) {
      console.error("Detection failed:", err);
      setError("Detection failed. Try again with better lighting.");
    } finally {
      clearTimeout(timeoutId);
      if (successTimeoutRef.current !== null) {
        window.clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
      setCaptureSuccess(false);
      setCaptureStatus(null);
      captureInProgressRef.current = false;
      setScanning(false);
      console.log("Capture cleanup complete");
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <motion.div
        animate={captureSuccess ? { scale: 1.01, boxShadow: "0 0 0 1px rgba(46, 204, 113, 0.3), 0 0 52px -12px rgba(46, 204, 113, 0.45)" } : { scale: 1, boxShadow: "0 0 40px -12px rgba(242,183,7,0.25)" }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="relative rounded-2xl overflow-hidden border border-hazard/30 bg-ink aspect-[3/4]"
      >
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(242,183,7,0.08),transparent_55%)]" />

        {liveDetections.map((d, i) => (
          <motion.div
            key={`${d.class}-${i}`}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.16 }}
            className="absolute border-2 border-hazard rounded-xl bg-hazard/5 shadow-[0_0_24px_-10px_rgba(242,183,7,0.9)]"
            style={{
              left: `${(d.box[0] / videoSize.width) * 100}%`,
              top: `${(d.box[1] / videoSize.height) * 100}%`,
              width: `${((d.box[2] - d.box[0]) / videoSize.width) * 100}%`,
              height: `${((d.box[3] - d.box[1]) / videoSize.height) * 100}%`,
            }}
          >
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute -top-6 left-0 bg-hazard text-ink text-[10px] px-1.5 py-0.5 rounded-full font-display font-bold tracking-tight"
            >
              {d.class.replace("GHS_Symbol_", "")} · {Math.round(d.confidence * 100)}%
            </motion.span>
          </motion.div>
        ))}

        <AnimatePresence>
          {captureSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="absolute inset-0 flex items-center justify-center bg-ink/45 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ scale: 0.72 }}
                animate={{ scale: [0.72, 1.02, 1] }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative text-center px-5"
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.72, 1, 0.72] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-safe/40 bg-safe/15 shadow-[0_0_40px_rgba(46,204,113,0.35)]"
                >
                  <CheckCircle2 className="text-safe" size={28} />
                </motion.div>
                <p className="font-display text-base font-bold text-paper">Pictogram ditemukan</p>
                <p className="mt-1 text-sm text-steel">{captureStatus}</p>
              </motion.div>

              <motion.div
                animate={{
                  scale: [0.96, 1.03, 1],
                  opacity: [0.15, 0.45, 0.15],
                }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-4 rounded-[1.5rem] border border-safe/35"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-steel text-sm">
            <Loader2 className="animate-spin mr-2" size={16} /> Starting camera...
          </div>
        )}
      </motion.div>

      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-corrosive text-sm mt-2">{error}</p>}

      <Button onClick={handleCapture} disabled={!ready || scanning} className="w-full mt-4" size="lg">
        {scanning ? (
          <>
            <Loader2 className="animate-spin" size={16} /> {captureStatus || "Analyzing..."}
          </>
        ) : (
          <>
            <ScanSearch size={16} /> Scan Product
          </>
        )}
      </Button>
    </div>
  );
}
