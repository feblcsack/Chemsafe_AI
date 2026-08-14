"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";

interface PPEDetection {
  timestamp: string;
  compliant: boolean;
  violations: string[];
  detections: Array<{
    class: string;
    confidence: number;
    box: number[];
  }>;
  inference_ms: number;
}

interface CameraPPEOverlayProps {
  stationId: string;
  stationName: string;
  cameraUrl: string;
  requiredPPE?: string[];
}

export default function CameraPPEOverlay({ stationId, stationName, cameraUrl, requiredPPE = [] }: CameraPPEOverlayProps) {
  const [detection, setDetection] = useState<PPEDetection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawOverlay = useCallback(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !detection || !image.naturalWidth || !image.naturalHeight) return;

    const container = canvas.getBoundingClientRect();
    if (container.width === 0 || container.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(container.width * dpr);
    canvas.height = Math.round(container.height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, container.width, container.height);

    // Match the displayed <img> geometry (object-cover inside an aspect-video box).
    const scale = Math.max(container.width / image.naturalWidth, container.height / image.naturalHeight);
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    const offsetX = (container.width - drawnWidth) / 2;
    const offsetY = (container.height - drawnHeight) / 2;

    detection.detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.box;
      const left = offsetX + x1 * scale;
      const top = offsetY + y1 * scale;
      const width = (x2 - x1) * scale;
      const height = (y2 - y1) * scale;
      const isViolation = det.class.startsWith("no_");

      ctx.strokeStyle = isViolation ? "rgba(239, 68, 68, 0.95)" : "rgba(34, 197, 94, 0.95)";
      ctx.fillStyle = isViolation ? "rgba(239, 68, 68, 0.12)" : "rgba(34, 197, 94, 0.12)";
      ctx.lineWidth = 2;
      ctx.fillRect(left, top, width, height);
      ctx.strokeRect(left, top, width, height);

      const label = `${det.class.replace(/_/g, " ")} ${Math.round(det.confidence * 100)}%`;
      ctx.font = "bold 10px ui-sans-serif, system-ui, sans-serif";
      const textWidth = ctx.measureText(label).width;
      const labelPaddingX = 6;
      const labelHeight = 16;
      const labelTop = Math.max(0, top - labelHeight - 4);
      const labelWidth = textWidth + labelPaddingX * 2;

      ctx.fillStyle = isViolation ? "rgba(239, 68, 68, 0.95)" : "rgba(34, 197, 94, 0.95)";
      ctx.fillRect(left, labelTop, labelWidth, labelHeight);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, left + labelPaddingX, labelTop + 11);
    });
  }, [detection]);

  useEffect(() => {
    // Poll for latest detection every 2 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/camera/station/${stationId}/latest`);
        
        if (response.ok) {
          const data = await response.json();
          setDetection(data);
          setError(null);
          setLoading(false);
        } else if (response.status === 404) {
          // No detection data yet
          setError("Waiting for detection data...");
          setLoading(false);
        } else {
          setError("Failed to load detection data");
          setLoading(false);
        }
      } catch (err) {
        setError("Connection error");
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [stationId]);

  useEffect(() => {
    drawOverlay();
    const handleResize = () => drawOverlay();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawOverlay]);

  const getDetectedPPE = () => {
    if (!detection) return [];
    return detection.detections
      .filter(d => ['Helmet', 'Gloves', 'Vest', 'Boots', 'Goggles'].includes(d.class))
      .map(d => d.class);
  };

  const getViolationDetails = () => {
    if (!detection || detection.violations.length === 0) return null;

    const violationMap: Record<string, string> = {
      'no_helmet': '⚠️ Helmet Missing',
      'no_gloves': '⚠️ Gloves Missing',
      'no_boots': '⚠️ Safety Boots Missing',
      'no_goggle': '⚠️ Goggles Missing'
    };

    return detection.violations.map(v => violationMap[v] || v);
  };

  return (
    <div className="space-y-3">
      {/* Camera Feed with Live Detection Overlay */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {/* Camera Stream */}
        <img
          ref={imageRef}
          src={cameraUrl}
          alt={`${stationName} live feed`}
          className="w-full h-full object-cover"
          onLoad={() => {
            setLoading(false);
            drawOverlay();
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />

        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        
        {/* LIVE Badge */}
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>

        {/* PPE Detection Status Overlay */}
        {detection && (
          <div className="absolute top-2 right-2 space-y-2">
            {/* Compliance Badge */}
            <div className={`px-3 py-2 rounded-lg backdrop-blur-sm ${
              detection.compliant 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {detection.compliant ? (
                  <>
                    <CheckCircle2 size={16} />
                    PPE Compliant
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    PPE Violation
                  </>
                )}
              </div>
            </div>

            {/* Person Count */}
            {detection.detections.filter(d => d.class === 'Person').length > 0 && (
              <div className="bg-blue-500/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                👤 {detection.detections.filter(d => d.class === 'Person').length} Person(s) Detected
              </div>
            )}
          </div>
        )}

        {/* Loading/Error Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-sm">
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
              Starting detection...
            </div>
          </div>
        )}

        {error && !detection && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-sm text-center px-4">
              <Shield size={24} className="mx-auto mb-2 opacity-50" />
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Detection Details Panel */}
      {detection && (
        <Card className="border-white/10">
          <CardContent className="pt-4">
            {/* Detected Objects */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-steel mb-2">Detected Objects:</h4>
              <div className="flex flex-wrap gap-2">
                {detection.detections.length === 0 ? (
                  <span className="text-xs text-steel">No objects detected</span>
                ) : (
                  detection.detections.map((det, idx) => (
                    <Badge 
                      key={idx}
                      variant={
                        det.class === 'Person' ? 'default' :
                        ['Helmet', 'Gloves', 'Vest', 'Boots', 'Goggles'].includes(det.class) ? 'safe' :
                        det.class.startsWith('no_') ? 'danger' : 'muted'
                      }
                      className="text-xs"
                    >
                      {det.class} ({Math.round(det.confidence * 100)}%)
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* PPE Status */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-steel mb-2">PPE Equipment:</h4>
              <div className="flex flex-wrap gap-2">
                {getDetectedPPE().length === 0 ? (
                  <span className="text-xs text-steel">No PPE detected</span>
                ) : (
                  getDetectedPPE().map((ppe, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs bg-safe/20 text-safe px-2 py-1 rounded">
                      ✓ {ppe}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Violations */}
            {detection.violations.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-corrosive mb-2">⚠️ Safety Violations:</h4>
                <div className="space-y-1">
                  {getViolationDetails()?.map((violation, idx) => (
                    <div key={idx} className="text-xs bg-corrosive/10 text-corrosive px-2 py-1 rounded">
                      {violation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required PPE */}
            {requiredPPE.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-steel mb-2">Required PPE:</h4>
                <div className="flex flex-wrap gap-2">
                  {requiredPPE.map((ppe, idx) => (
                    <span key={idx} className="text-xs bg-white/5 px-2 py-1 rounded">
                      {ppe.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-steel pt-2 border-t border-white/10">
              <span>
                Last updated: {new Date(detection.timestamp).toLocaleTimeString()}
              </span>
              <span>
                Inference: {detection.inference_ms}ms
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
