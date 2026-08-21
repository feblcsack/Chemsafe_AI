"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Shield, Camera } from "lucide-react";

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

interface SmoothedBox {
  current: number[];
  target: number[];
  class: string;
  confidence: number;
}

interface DeviceCameraStreamProps {
  stationId: string;
  stationName: string;
  deviceId: string;
  deviceLabel?: string;
  requiredPPE?: string[];
}

// Linear interpolation helper
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export default function DeviceCameraStream({
  stationId,
  stationName,
  deviceId,
  deviceLabel,
  requiredPPE = []
}: DeviceCameraStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detection, setDetection] = useState<PPEDetection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [debugMode, setDebugMode] = useState(true); // Show console logs
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Smoothed box positions untuk interpolasi
  const smoothedBoxesRef = useRef<Map<string, SmoothedBox>>(new Map());

  console.log(`🎥 DeviceCameraStream mounted:`, {
    stationId,
    stationName,
    deviceId,
    deviceLabel,
    requiredPPE
  });

  useEffect(() => {
    console.log(`🚀 Starting camera stream for device: ${deviceId}`);
    startCameraStream();
    return () => {
      console.log(`🛑 Stopping camera stream for device: ${deviceId}`);
      stopCameraStream();
      // Clean up animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [deviceId]);

  async function startCameraStream() {
    console.log(`📷 Requesting camera access for device: ${deviceId || 'default'}`);
    
    try {
      // Request camera access with specific device
      const constraints = {
        video: deviceId ? {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log(`🎬 getUserMedia constraints:`, constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log(`✅ Camera stream obtained:`, {
        tracks: stream.getTracks().length,
        videoTrack: stream.getVideoTracks()[0]?.label,
        settings: stream.getVideoTracks()[0]?.getSettings()
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log(`🎞️ Video metadata loaded, starting playback`);
          videoRef.current?.play();
          setStreaming(true);
          setLoading(false);
          setError(null);
          console.log(`🎯 Starting frame capture for PPE detection`);
          startFrameCapture();
        };
      } else {
        console.error(`❌ videoRef.current is null!`);
        setError("Video element not ready");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("❌ Failed to access camera:", err);
      console.error("   Error name:", err.name);
      console.error("   Error message:", err.message);
      setError(err.name === "NotAllowedError" 
        ? "Camera permission denied" 
        : `Failed to access camera: ${err.message}`);
      setLoading(false);
    }
  }

  function stopCameraStream() {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setStreaming(false);
  }

  function startFrameCapture() {
    // Capture and send frames every 1 second for PPE detection
    // Optimized from 2000ms untuk responsiveness lebih baik
    // Masih aman untuk CPU shared Railway dengan JPEG quality 0.7
    frameIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !streaming) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to match video dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(`📹 Canvas sized to ${canvas.width}x${canvas.height}`);
      }

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob with optimized quality
      // Quality 0.7 = good balance antara file size dan detection accuracy
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.warn("⚠️ Failed to create blob from canvas");
          return;
        }

        console.log(`📤 Sending frame to backend (${Math.round(blob.size / 1024)}KB)`);

        try {
          // Send frame to backend for PPE detection
          const formData = new FormData();
          formData.append("image", blob, "frame.jpg");
          formData.append("station_id", stationId);
          formData.append("required_ppe", JSON.stringify(requiredPPE));

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/camera/detect-frame`,
            {
              method: "POST",
              body: formData
            }
          );

          console.log(`📥 Backend response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Detection result:`, data);
            console.log(`   - Compliant: ${data.compliant ? '✅ YES' : '❌ NO'}`);
            console.log(`   - Detections: ${data.detections.length} objects`);
            console.log(`   - Violations: ${data.violations.length > 0 ? data.violations.join(', ') : 'None'}`);
            console.log(`   - Inference: ${data.inference_ms}ms`);
            
            setDetection(data);
            setError(null);
            
            // Update target positions untuk smoothing
            updateSmoothedBoxTargets(data);
            
            // Animation loop akan handle drawing secara continuous
          } else {
            const errorText = await response.text();
            console.error(`❌ Backend error ${response.status}:`, errorText);
            setError(`Detection failed: ${response.status}`);
          }
        } catch (error: any) {
          console.error("❌ Failed to process frame:", error);
          setError(`Network error: ${error.message}`);
        }
      }, "image/jpeg", 0.7); // Optimized quality: 0.7 = smaller size, faster upload, still accurate
    }, 1000); // Send frame every 1 second (optimized from 2000ms)
    
    // Start continuous animation loop untuk smooth box movement
    startSmoothAnimation();
  }

  function updateSmoothedBoxTargets(detectionData: PPEDetection) {
    const newBoxes = new Map<string, SmoothedBox>();
    
    detectionData.detections.forEach((det, idx) => {
      // Create unique key based on class and approximate position
      const key = `${det.class}-${Math.round(det.box[0] / 50)}-${Math.round(det.box[1] / 50)}`;
      
      const existing = smoothedBoxesRef.current.get(key);
      
      if (existing) {
        // Update target, keep current for interpolation
        newBoxes.set(key, {
          current: existing.current,
          target: det.box,
          class: det.class,
          confidence: det.confidence
        });
      } else {
        // New detection, start at target (no smoothing on first appearance)
        newBoxes.set(key, {
          current: det.box,
          target: det.box,
          class: det.class,
          confidence: det.confidence
        });
      }
    });
    
    smoothedBoxesRef.current = newBoxes;
  }

  function startSmoothAnimation() {
    if (animationFrameRef.current) return; // Already running
    
    const animate = () => {
      if (!detection || !videoRef.current || !canvasRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Interpolate all boxes towards their targets
      const smoothingFactor = 0.2; // 0.2 = smooth but not too laggy
      let needsUpdate = false;
      
      smoothedBoxesRef.current.forEach((box, key) => {
        const [cx1, cy1, cx2, cy2] = box.current;
        const [tx1, ty1, tx2, ty2] = box.target;
        
        // Check if close enough to target (threshold: 2 pixels)
        const dist = Math.max(
          Math.abs(cx1 - tx1),
          Math.abs(cy1 - ty1),
          Math.abs(cx2 - tx2),
          Math.abs(cy2 - ty2)
        );
        
        if (dist > 2) {
          needsUpdate = true;
          box.current = [
            lerp(cx1, tx1, smoothingFactor),
            lerp(cy1, ty1, smoothingFactor),
            lerp(cx2, tx2, smoothingFactor),
            lerp(cy2, ty2, smoothingFactor)
          ];
        } else {
          // Snap to target when close enough
          box.current = box.target;
        }
      });
      
      // Draw with smoothed positions
      drawSmoothedOverlay();
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }

  function drawSmoothedOverlay() {
    if (!canvasRef.current || !videoRef.current || !detection) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get container dimensions (displayed size, not native video resolution)
    const container = canvas.getBoundingClientRect();
    if (container.width === 0 || container.height === 0) return;

    // Use lower DPR on slower devices for performance
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(container.width * dpr);
    canvas.height = Math.round(container.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, container.width, container.height);

    // Calculate object-cover transformation (same logic as CameraPPEOverlay.tsx)
    const scale = Math.max(
      container.width / video.videoWidth,
      container.height / video.videoHeight
    );
    const drawnWidth = video.videoWidth * scale;
    const drawnHeight = video.videoHeight * scale;
    const offsetX = (container.width - drawnWidth) / 2;
    const offsetY = (container.height - drawnHeight) / 2;

    // Draw bounding boxes with smoothed positions
    smoothedBoxesRef.current.forEach((smoothedBox) => {
      const [x1, y1, x2, y2] = smoothedBox.current;
      
      // Transform coordinates from native video space to displayed canvas space
      const left = offsetX + x1 * scale;
      const top = offsetY + y1 * scale;
      const width = (x2 - x1) * scale;
      const height = (y2 - y1) * scale;

      // Color based on detection type
      const isPPE = ["Helmet", "Gloves", "Vest", "Boots", "Goggles", "Mask"].includes(smoothedBox.class);
      const isMissing = smoothedBox.class.startsWith("no_");
      const isPerson = smoothedBox.class === "Person";
      
      const color = isMissing ? "#ef4444" : // Red for violations
                    isPPE ? "#22c55e" :      // Green for PPE
                    isPerson ? "#3b82f6" :   // Blue for Person
                    "#f59e0b";               // Amber for other

      // Draw corner accents (modern style)
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      const cornerLen = Math.min(20, width * 0.15, height * 0.15);
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(left, top + cornerLen);
      ctx.lineTo(left, top);
      ctx.lineTo(left + cornerLen, top);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(left + width - cornerLen, top);
      ctx.lineTo(left + width, top);
      ctx.lineTo(left + width, top + cornerLen);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(left + width, top + height - cornerLen);
      ctx.lineTo(left + width, top + height);
      ctx.lineTo(left + width - cornerLen, top + height);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(left + cornerLen, top + height);
      ctx.lineTo(left, top + height);
      ctx.lineTo(left, top + height - cornerLen);
      ctx.stroke();

      // Draw label background with shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = color;
      const label = `${smoothedBox.class} ${Math.round(smoothedBox.confidence * 100)}%`;
      ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
      const textMetrics = ctx.measureText(label);
      const padding = 6;
      const labelWidth = textMetrics.width + padding * 2;
      const labelHeight = 20;
      
      // Position label above box, or inside if no room
      const labelY = top - labelHeight - 4 > 0 ? top - labelHeight - 4 : top + 4;
      
      ctx.fillRect(left, labelY, labelWidth, labelHeight);
      
      // Draw label text
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, left + padding, labelY + 14);
    });
  }

  function getDetectedPPE() {
    if (!detection) return [];
    const ppeClasses = ["Helmet", "Gloves", "Vest", "Boots", "Goggles", "Mask"];
    return detection.detections
      .filter(d => ppeClasses.includes(d.class))
      .map(d => d.class);
  }

  function getViolationDetails() {
    if (!detection || detection.violations.length === 0) return null;
    return detection.violations.map(v => {
      const ppe = v.replace("missing_", "").replace("_", " ");
      return `Missing: ${ppe}`;
    });
  }

  return (
    <div className="space-y-3">
      {/* Camera Feed with Live Detection Overlay */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {/* Video Stream */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Detection Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
        />

        {/* LIVE Badge */}
        {streaming && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}

        {/* Camera Info */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm font-mono">
          <Camera size={12} className="inline mr-1" />
          {deviceLabel || "Device Camera"}
          {detection && (
            <div className="text-[10px] opacity-75 mt-0.5">
              {detection.inference_ms}ms • {detection.detections.length} obj
            </div>
          )}
        </div>

        {/* PPE Detection Status Overlay */}
        {detection && (
          <div className="absolute bottom-2 right-2 space-y-2">
            {/* Compliance Badge */}
            <div className={`px-3 py-2 rounded-lg backdrop-blur-sm ${
              detection.compliant 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <div className="flex items-center gap-2 text-sm font-medium">
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
                👤 {detection.detections.filter(d => d.class === 'Person').length} person(s)
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-sm text-center">
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
              Starting camera...
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && streaming && (
          <div className="absolute bottom-2 left-2 bg-red-500/90 text-white text-xs px-3 py-2 rounded backdrop-blur-sm max-w-xs">
            ⚠️ {error}
          </div>
        )}

        {/* Error Overlay (no stream) */}
        {error && !streaming && (
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
              <h4 className="text-xs font-semibold text-steel mb-2">DETECTED OBJECTS</h4>
              <div className="flex flex-wrap gap-2">
                {detection.detections.length === 0 ? (
                  <span className="text-xs text-steel">No objects detected</span>
                ) : (
                  detection.detections.map((det, idx) => (
                    <Badge 
                      key={idx}
                      variant={
                        det.class === 'Person' ? 'default' :
                        ['Helmet', 'Gloves', 'Vest', 'Boots', 'Goggles', 'Mask'].includes(det.class) ? 'safe' :
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
              <h4 className="text-xs font-semibold text-steel mb-2">PPE EQUIPPED</h4>
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
                <h4 className="text-xs font-semibold text-corrosive mb-2">⚠️ VIOLATIONS</h4>
                <div className="space-y-1">
                  {getViolationDetails()?.map((violation, idx) => (
                    <div key={idx} className="text-xs bg-corrosive/20 text-corrosive px-2 py-1 rounded">
                      {violation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required PPE */}
            {requiredPPE.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-steel mb-2">REQUIRED PPE</h4>
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
