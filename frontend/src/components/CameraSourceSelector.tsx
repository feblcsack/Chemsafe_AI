"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Smartphone, 
  Wifi, 
  Monitor, 
  Video,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type CameraSourceType = "device" | "ip_camera" | "rtsp" | "mjpeg" | "http";

interface CameraSource {
  type: CameraSourceType;
  url?: string;
  deviceId?: string;
  label?: string;
}

interface Props {
  onSourceSelected: (source: CameraSource) => void;
  currentSource?: CameraSource;
}

export default function CameraSourceSelector({ onSourceSelected, currentSource }: Props) {
  const [selectedType, setSelectedType] = useState<CameraSourceType | null>(
    currentSource?.type || null
  );
  const [cameraUrl, setCameraUrl] = useState(currentSource?.url || "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [enumeratingDevices, setEnumeratingDevices] = useState(false);

  const cameraTypes = [
    {
      type: "device" as CameraSourceType,
      icon: Camera,
      title: "Device Camera",
      description: "Use laptop/computer built-in camera or USB webcam",
      gradient: "from-blue-500/20 to-cyan-500/10",
      recommended: true
    },
    {
      type: "ip_camera" as CameraSourceType,
      icon: Wifi,
      title: "IP Camera",
      description: "Network camera with HTTP/HTTPS stream",
      gradient: "from-green-500/20 to-emerald-500/10"
    },
    {
      type: "rtsp" as CameraSourceType,
      icon: Video,
      title: "RTSP Stream",
      description: "Professional security camera with RTSP protocol",
      gradient: "from-purple-500/20 to-pink-500/10"
    },
    {
      type: "mjpeg" as CameraSourceType,
      icon: Monitor,
      title: "MJPEG Stream",
      description: "Motion JPEG stream (common in older IP cameras)",
      gradient: "from-orange-500/20 to-red-500/10"
    },
    {
      type: "http" as CameraSourceType,
      icon: Smartphone,
      title: "Phone Camera",
      description: "Use phone as IP camera with apps like IP Webcam",
      gradient: "from-indigo-500/20 to-blue-500/10"
    }
  ];

  const exampleUrls: Record<CameraSourceType, string[]> = {
    device: [],
    ip_camera: [
      "http://192.168.1.100/video",
      "https://camera.local:8080/stream"
    ],
    rtsp: [
      "rtsp://192.168.1.100:554/stream",
      "rtsp://admin:password@camera.local/h264"
    ],
    mjpeg: [
      "http://192.168.1.100/mjpeg",
      "http://camera.local:8080/video.mjpg"
    ],
    http: [
      "http://192.168.1.50:8080/video",
      "http://phone.local:4747/video"
    ]
  };

  async function enumerateDevices() {
    setEnumeratingDevices(true);
    try {
      // Request permission first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Get devices after permission granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Stop the stream after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error("Failed to enumerate devices:", error);
      // Show helpful error message
      setAvailableDevices([]);
    } finally {
      setEnumeratingDevices(false);
    }
  }

  async function testCameraUrl() {
    if (!cameraUrl.trim()) return;
    
    setTesting(true);
    setTestResult(null);

    try {
      // Test if the URL is accessible
      const response = await fetch(cameraUrl, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      // For no-cors mode, any response means the URL is reachable
      setTestResult("success");
    } catch (error) {
      console.error("Camera URL test failed:", error);
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  }

  function handleSelectType(type: CameraSourceType) {
    setSelectedType(type);
    setTestResult(null);
    
    if (type === "device") {
      enumerateDevices();
    }
  }

  function handleConfirmSelection() {
    if (!selectedType) return;

    if (selectedType === "device") {
      onSourceSelected({
        type: "device",
        deviceId: selectedDevice,
        label: availableDevices.find(d => d.deviceId === selectedDevice)?.label
      });
    } else {
      onSourceSelected({
        type: selectedType,
        url: cameraUrl.trim()
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-lg mb-2">Select Camera Source</h3>
        <p className="text-steel text-sm">Choose how you want to stream video for PPE monitoring</p>
      </div>

      {/* Camera Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cameraTypes.map((camera) => {
          const Icon = camera.icon;
          const isSelected = selectedType === camera.type;
          
          return (
            <motion.div
              key={camera.type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? "border-hazard/50 bg-hazard/10" 
                    : "border-white/10 hover:border-white/20"
                }`}
                onClick={() => handleSelectType(camera.type)}
              >
                <CardContent className="pt-5">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${camera.gradient} mb-3 inline-block`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-display font-semibold text-sm">{camera.title}</h4>
                    {camera.recommended && (
                      <Badge className="bg-safe/20 text-safe border-safe/30 text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-steel text-xs">{camera.description}</p>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3"
                    >
                      <CheckCircle size={20} className="text-hazard" />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Configuration Section */}
      <AnimatePresence>
        {selectedType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-hazard/30 bg-hazard/5">
              <CardHeader>
                <CardTitle className="text-base">
                  Configure {cameraTypes.find(c => c.type === selectedType)?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedType === "device" ? (
                  // Device Camera Configuration
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Camera Device
                      </label>
                      <select
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="w-full p-2 rounded border border-white/20 bg-white/5"
                        disabled={enumeratingDevices}
                      >
                        {enumeratingDevices ? (
                          <option>Requesting camera access...</option>
                        ) : availableDevices.length === 0 ? (
                          <option>No cameras detected</option>
                        ) : (
                          availableDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {enumeratingDevices && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        <p className="text-blue-400">
                          Requesting camera permission...
                        </p>
                      </div>
                    )}

                    {!enumeratingDevices && availableDevices.length === 0 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm space-y-2">
                        <p className="text-red-400 font-medium">
                          ⚠️ No cameras detected or permission denied
                        </p>
                        <p className="text-steel text-xs">
                          Please check:
                        </p>
                        <ul className="text-steel text-xs space-y-1 ml-4 list-disc">
                          <li>Camera is connected and working</li>
                          <li>Browser has permission to access camera</li>
                          <li>No other app is using the camera</li>
                        </ul>
                        <Button
                          onClick={enumerateDevices}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                        >
                          Retry Camera Access
                        </Button>
                      </div>
                    )}

                    {!enumeratingDevices && availableDevices.length > 0 && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        <p className="text-green-400">
                          ✓ {availableDevices.length} camera{availableDevices.length > 1 ? 's' : ''} detected
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Network Camera Configuration
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Camera URL
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={cameraUrl}
                          onChange={(e) => {
                            setCameraUrl(e.target.value);
                            setTestResult(null);
                          }}
                          placeholder={exampleUrls[selectedType][0]}
                          className="flex-1"
                        />
                        <Button
                          onClick={testCameraUrl}
                          disabled={!cameraUrl.trim() || testing}
                          variant="outline"
                          size="sm"
                        >
                          {testing ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            "Test"
                          )}
                        </Button>
                      </div>
                    </div>

                    {testResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded border flex items-center gap-2 text-sm ${
                          testResult === "success"
                            ? "bg-safe/10 border-safe/20 text-safe"
                            : "bg-corrosive/10 border-corrosive/20 text-corrosive"
                        }`}
                      >
                        {testResult === "success" ? (
                          <>
                            <CheckCircle size={16} />
                            <span>Camera URL is accessible!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} />
                            <span>Cannot reach camera. Check URL and network connection.</span>
                          </>
                        )}
                      </motion.div>
                    )}

                    {/* Example URLs */}
                    <div className="p-3 bg-white/5 rounded">
                      <p className="text-xs font-semibold mb-2">Example URLs:</p>
                      <div className="space-y-1">
                        {exampleUrls[selectedType].map((example, i) => (
                          <button
                            key={i}
                            onClick={() => setCameraUrl(example)}
                            className="block text-xs text-steel hover:text-hazard font-mono bg-black/20 px-2 py-1 rounded hover:bg-black/30 transition-colors w-full text-left"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Setup Tips */}
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs space-y-1">
                      <p className="font-semibold text-blue-400 mb-1">Setup Tips:</p>
                      {selectedType === "http" && (
                        <>
                          <p className="text-steel">• Install "IP Webcam" on Android or "EpocCam" on iOS</p>
                          <p className="text-steel">• Connect phone to same WiFi network</p>
                          <p className="text-steel">• Start server and use displayed URL</p>
                        </>
                      )}
                      {selectedType === "rtsp" && (
                        <>
                          <p className="text-steel">• Format: rtsp://[username]:[password]@[ip]:[port]/[path]</p>
                          <p className="text-steel">• Default port is usually 554</p>
                          <p className="text-steel">• Check camera documentation for exact path</p>
                        </>
                      )}
                      {(selectedType === "ip_camera" || selectedType === "mjpeg") && (
                        <>
                          <p className="text-steel">• Find camera IP using router admin panel</p>
                          <p className="text-steel">• Check camera's web interface for stream URL</p>
                          <p className="text-steel">• Ensure camera and server are on same network</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Confirm Button */}
                <Button
                  onClick={handleConfirmSelection}
                  disabled={
                    selectedType === "device" 
                      ? !selectedDevice
                      : !cameraUrl.trim()
                  }
                  className="w-full"
                >
                  <CheckCircle size={16} />
                  Use This Camera Source
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
