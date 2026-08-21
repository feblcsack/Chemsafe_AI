"use client";

/**
 * Streams webcam frames to the FastAPI WebSocket endpoint for server-side
 * PPE detection. Unlike GHSScanner (fully client-side), this genuinely
 * sends video frames off-device — that trade-off is intentional here
 * because the PPE model runs too slow in-browser for continuous
 * monitoring; see README for the reasoning and expected frame rate.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, WifiOff, Loader2 } from "lucide-react";

interface Detection {
  class: string;
  confidence: number;
  box: [number, number, number, number];
}

interface StreamResult {
  detections: Detection[];
  violations: string[];
  compliant: boolean;
  inference_ms: number;
}

interface Props {
  workerId: string;
  zoneId: string;
  requiredPpe: string[];
}

const VIOLATION_CLASSES = new Set(["no_helmet", "no_goggle", "no_gloves", "no_boots"]);

export default function PPELiveMonitor({ workerId, zoneId, requiredPpe }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<"connecting" | "live" | "disconnected">("connecting");
  const [result, setResult] = useState<StreamResult | null>(null);

  const sendFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
          blob.arrayBuffer().then((buf) => wsRef.current?.send(buf));
        }
      },
      "image/jpeg",
      0.7
    );
  }, []);

  useEffect(() => {
    let stream: MediaStream;

    (async () => {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      
      // PERBAIKAN: Otomatis deteksi kalau pakai https jadi wss, kalau http jadi ws
      const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
      const wsUrl = apiUrl.replace(/^https?/, wsProtocol) + `/ppe/stream/${workerId}/${zoneId}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setStatus("live");
      ws.onclose = () => setStatus("disconnected");
      ws.onerror = () => setStatus("disconnected");
      ws.onmessage = (event) => setResult(JSON.parse(event.data));

      // Client-side throttle matches the server's MIN_FRAME_INTERVAL_S —
      // sending faster than the server processes just wastes bandwidth.
      intervalRef.current = setInterval(sendFrame, 500);
    })();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      wsRef.current?.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [workerId, zoneId, sendFrame]);

  const missingPpe = result?.violations.filter((v) => VIOLATION_CLASSES.has(v)) ?? [];
  const requiredPpeStatus = requiredPpe.map(ppe => {
    const ppeMapping: Record<string, string> = {
      "helmet": "Helmet",
      "safety_goggles": "Goggles", 
      "goggles": "Goggles",
      "gloves": "Gloves",
      "safety_boots": "Boots",
      "boots": "Boots",
      "high_vis_vest": "Vest",
      "vest": "Vest",
    };
    
    const detectedClass = ppeMapping[ppe.toLowerCase()];
    const isDetected = result?.detections.some(d => d.class === detectedClass) ?? false;
    const violationClass = `no_${detectedClass?.toLowerCase()}`;
    const hasViolation = result?.violations.includes(violationClass) ?? false;
    
    return {
      name: ppe,
      detected: isDetected,
      missing: hasViolation || (!isDetected && result !== null)
    };
  });

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <div className="relative aspect-video bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {result?.detections.map((d, i) => (
          <div
            key={i}
            className={`absolute border-2 rounded-sm ${
              VIOLATION_CLASSES.has(d.class) ? "border-corrosive bg-corrosive/10" : "border-safe bg-safe/10"
            }`}
            style={{
              left: `${(d.box[0] / (videoRef.current?.videoWidth || 1)) * 100}%`,
              top: `${(d.box[1] / (videoRef.current?.videoHeight || 1)) * 100}%`,
              width: `${((d.box[2] - d.box[0]) / (videoRef.current?.videoWidth || 1)) * 100}%`,
              height: `${((d.box[3] - d.box[1]) / (videoRef.current?.videoHeight || 1)) * 100}%`,
            }}
          >
            <span className="absolute -top-5 left-0 text-[10px] px-1 py-0.5 rounded font-display font-bold bg-ink/80">
              {d.class}
            </span>
          </div>
        ))}

        <div className="absolute top-3 left-3 flex gap-2">
          {status === "connecting" && (
            <Badge variant="muted">
              <Loader2 size={11} className="animate-spin" /> Connecting
            </Badge>
          )}
          {status === "disconnected" && (
            <Badge variant="danger">
              <WifiOff size={11} /> Disconnected
            </Badge>
          )}
          {status === "live" && result && (
            <Badge variant={result.compliant ? "safe" : "danger"}>
              {result.compliant ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
              {result.compliant ? "Compliant" : "PPE violation"}
            </Badge>
          )}
        </div>

        {result && (
          <div className="absolute bottom-3 right-3 text-[10px] text-steel font-display">
            {result.inference_ms}ms/frame
          </div>
        )}
      </div>

      {requiredPpeStatus.length > 0 && (
        <div className="p-3 bg-ink/50 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2">
            {requiredPpeStatus.map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                  item.detected
                    ? "bg-safe/20 text-safe"
                    : item.missing
                    ? "bg-corrosive/20 text-corrosive"
                    : "bg-white/5 text-steel"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                <span className="capitalize">{item.name.replace(/_/g, ' ')}</span>
                <span className="ml-auto text-[10px]">
                  {item.detected ? "✓" : item.missing ? "✗" : "?"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {missingPpe.length > 0 && (
        <div className="p-3 bg-corrosive/10 border-t border-corrosive/20">
          <p className="text-sm text-corrosive font-display font-semibold">
            Missing: {missingPpe.map((v) => v.replace("no_", "")).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}