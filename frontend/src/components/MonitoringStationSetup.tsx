"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveCurrentUserContext } from "@/lib/supabase/userContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Camera, Plus, Settings, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";

interface Zone {
  id: string;
  name: string;
}

interface MonitoringStation {
  id: string;
  zone_id: string;
  station_name: string;
  camera_url?: string;
  stream_key?: string;
  status: "active" | "inactive" | "maintenance";
  zone_name?: string;
}

export default function MonitoringStationSetup() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [stationName, setStationName] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [cameraUrl, setCameraUrl] = useState("");
  const [streamKey, setStreamKey] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const context = await resolveCurrentUserContext();
    if (!context.orgId) return;

    try {
      // Load zones
      const { data: zonesData } = await supabase
        .from("zones")
        .select("id, name")
        .eq("org_id", context.orgId);
      setZones(zonesData || []);

      // Load monitoring stations
      const { data: stationsData } = await supabase
        .from("monitoring_stations")
        .select(`
          id, zone_id, station_name, camera_url, stream_key, status,
          zones!monitoring_stations_zone_id_fkey (name)
        `)
        .in("zone_id", (zonesData || []).map(z => z.id));

      const formattedStations = (stationsData || []).map((station: any) => ({
        ...station,
        zone_name: (station.zones && Array.isArray(station.zones) ? station.zones[0]?.name : station.zones?.name) || "Unknown Zone"
      }));
      setStations(formattedStations);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveStation() {
    if (!stationName.trim() || !selectedZone) return;

    const supabase = createClient();
    const context = await resolveCurrentUserContext();

    try {
      const stationData = {
        zone_id: selectedZone,
        station_name: stationName,
        camera_url: cameraUrl.trim() || null,
        stream_key: streamKey.trim() || null,
        status: cameraUrl.trim() ? "active" : "inactive",
        created_by: context.user?.id
      };

      if (editingStation) {
        // Update existing station
        const { error } = await supabase
          .from("monitoring_stations")
          .update(stationData)
          .eq("id", editingStation);

        if (error) throw error;
      } else {
        // Create new station
        const { error } = await supabase
          .from("monitoring_stations")
          .insert(stationData);

        if (error) throw error;
      }

      // Reset form
      setStationName("");
      setSelectedZone("");
      setCameraUrl("");
      setStreamKey("");
      setIsAddingStation(false);
      setEditingStation(null);
      
      await loadData();
    } catch (error) {
      console.error("Failed to save station:", error);
      alert("Failed to save monitoring station. Please try again.");
    }
  }

  async function deleteStation(stationId: string) {
    if (!confirm("Are you sure you want to delete this monitoring station?")) return;

    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from("monitoring_stations")
        .delete()
        .eq("id", stationId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error("Failed to delete station:", error);
      alert("Failed to delete monitoring station. Please try again.");
    }
  }

  async function toggleStationStatus(stationId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("monitoring_stations")
        .update({ status: newStatus })
        .eq("id", stationId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error("Failed to update station status:", error);
    }
  }

  function startEdit(station: MonitoringStation) {
    setStationName(station.station_name);
    setSelectedZone(station.zone_id);
    setCameraUrl(station.camera_url || "");
    setStreamKey(station.stream_key || "");
    setEditingStation(station.id);
    setIsAddingStation(true);
  }

  function cancelEdit() {
    setStationName("");
    setSelectedZone("");
    setCameraUrl("");
    setStreamKey("");
    setIsAddingStation(false);
    setEditingStation(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl font-bold">Monitoring Stations</h2>
          <p className="text-steel text-sm">Set up external cameras for automated PPE monitoring</p>
        </div>
        {!isAddingStation && (
          <Button onClick={() => setIsAddingStation(true)}>
            <Plus size={16} />
            Add Station
          </Button>
        )}
      </div>

      {/* Add/Edit Station Form */}
      {isAddingStation && (
        <Card className="border-hazard/30">
          <CardHeader>
            <CardTitle>
              {editingStation ? "Edit Monitoring Station" : "Add Monitoring Station"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Station Name</label>
                <Input
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="e.g., Chemical Storage Camera 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Zone</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full p-2 rounded border border-white/20 bg-white/5"
                >
                  <option value="">Select a zone</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Camera URL</label>
              <Input
                value={cameraUrl}
                onChange={(e) => setCameraUrl(e.target.value)}
                placeholder="Example: http://192.168.1.100:8080/video"
              />
              <p className="text-xs text-steel mt-1">
                For phone IP camera: http://[phone-ip]:8080/video
              </p>
              <p className="text-xs text-steel mt-1">
                For RTSP camera: rtsp://[camera-ip]:554/stream
              </p>
              <p className="text-xs text-steel mt-1">
                For MJPEG: http://[camera-ip]/mjpeg
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Stream Key (Optional)</label>
              <Input
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                placeholder="Authentication key or token"
                type="password"
              />
              <p className="text-xs text-steel mt-1">
                Authentication key if required by your camera system
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={saveStation}
                disabled={!stationName.trim() || !selectedZone}
                className="flex-1"
              >
                {editingStation ? "Update Station" : "Add Station"}
              </Button>
              <Button onClick={cancelEdit} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stations.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-8 text-center">
              <Camera size={32} className="mx-auto mb-3 text-steel opacity-50" />
              <p className="text-steel">No monitoring stations configured yet.</p>
              <p className="text-sm text-steel mt-1">
                Add external cameras to automatically monitor worker safety.
              </p>
            </CardContent>
          </Card>
        ) : (
          stations.map((station) => (
            <Card key={station.id} className="border-white/10">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold">{station.station_name}</h3>
                    <p className="text-sm text-steel">{station.zone_name}</p>
                  </div>
                  <Badge 
                    variant={
                      station.status === "active" ? "safe" : 
                      station.status === "maintenance" ? "muted" : "danger"
                    }
                  >
                    {station.status}
                  </Badge>
                </div>

                {station.camera_url && (
                  <div className="mb-3">
                    <div className="aspect-video bg-black rounded overflow-hidden relative">
                      {station.status === "active" ? (
                        <>
                          <img
                            src={station.camera_url}
                            alt={`${station.station_name} preview`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.error-message')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'error-message absolute inset-0 flex flex-col items-center justify-center text-steel text-sm';
                                errorDiv.innerHTML = `
                                  <EyeOff size={24} className="mb-2 opacity-50" />
                                  <p>Camera feed unavailable</p>
                                  <p class="text-xs mt-1">Check camera URL and network</p>
                                `;
                                parent.appendChild(errorDiv);
                              }
                            }}
                          />
                          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <Eye size={12} />
                            Active
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-steel">
                          <div className="flex flex-col items-center gap-2">
                            <EyeOff size={24} className="opacity-50" />
                            <span className="text-sm">Camera Offline</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleStationStatus(station.id, station.status)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {station.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  
                  <Button
                    onClick={() => startEdit(station)}
                    variant="outline"
                    size="sm"
                  >
                    <Settings size={14} />
                  </Button>
                  
                  <Button
                    onClick={() => deleteStation(station.id)}
                    variant="outline"
                    size="sm"
                    className="text-corrosive hover:text-corrosive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Camera Feed Preview */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-blue-500">Camera Access Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2 text-blue-500">🎥 How to Access Camera Stations:</h4>
            <div className="bg-white/5 p-3 rounded-lg space-y-2">
              <p><strong>Option 1 - Local Network Camera:</strong></p>
              <p className="text-steel ml-4">• Connect laptop to same WiFi as camera</p>
              <p className="text-steel ml-4">• Access camera web interface: http://[camera-ip]</p>
              <p className="text-steel ml-4">• Use RTSP URL: rtsp://[camera-ip]:554/stream</p>
              
              <p className="mt-3"><strong>Option 2 - USB Camera Setup:</strong></p>
              <p className="text-steel ml-4">• Connect USB camera to laptop/computer</p>
              <p className="text-steel ml-4">• Use OBS Studio or similar to create RTMP stream</p>
              <p className="text-steel ml-4">• Stream to: http://localhost:8080/stream</p>
              
              <p className="mt-3"><strong>Option 3 - Phone as IP Camera:</strong></p>
              <p className="text-steel ml-4">• Install "IP Webcam" app on Android phone</p>
              <p className="text-steel ml-4">• Start server, get IP address</p>
              <p className="text-steel ml-4">• Use URL: http://[phone-ip]:8080/video</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-blue-500">🔧 Quick Setup Commands:</h4>
            <div className="bg-black/20 p-3 rounded font-mono text-xs space-y-1">
              <p># Find cameras on network</p>
              <p className="text-green-400">nmap -sn 192.168.1.0/24</p>
              <p className="mt-2"># Test RTSP stream</p>
              <p className="text-green-400">ffplay rtsp://192.168.1.100:554/stream</p>
              <p className="mt-2"># Create USB camera stream</p>
              <p className="text-green-400">ffmpeg -f v4l2 -i /dev/video0 -f rtsp rtsp://localhost:8554/stream</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Recommended Camera Placement:</h4>
            <ul className="text-steel space-y-1 ml-4">
              <li>• Position cameras to capture full-body view of workers</li>
              <li>• Ensure good lighting and minimal obstructions</li>
              <li>• Cover all entry/exit points and work areas</li>
              <li>• Mount at appropriate height (8-12 feet recommended)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Supported Camera Types:</h4>
            <ul className="text-steel space-y-1 ml-4">
              <li>• IP cameras with RTSP streaming</li>
              <li>• MJPEG cameras with HTTP access</li>
              <li>• USB cameras connected to local servers</li>
              <li>• Mobile phones with IP camera apps</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Privacy & Compliance:</h4>
            <ul className="text-steel space-y-1 ml-4">
              <li>• Video is processed for safety monitoring only</li>
              <li>• No recording or storage of video streams</li>
              <li>• Only compliance status is logged and shared</li>
              <li>• Follow your organization's privacy policies</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}