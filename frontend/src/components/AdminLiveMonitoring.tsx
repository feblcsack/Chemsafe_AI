"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveCurrentUserContext } from "@/lib/supabase/userContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Camera, AlertTriangle, Send, 
  CheckCircle2, Clock, MapPin, Eye, EyeOff, Shield
} from "lucide-react";

import CameraPPEOverlay from "@/components/CameraPPEOverlay";

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-white/5 rounded w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-white/5 rounded" />
        ))}
      </div>
      <div className="h-64 bg-white/5 rounded" />
    </div>
  );
}

interface Worker {
  worker_id: string;
  zone_id: string;
  worker_name?: string;
  zone_name?: string;
  checked_in_at?: string;
}

interface MonitoringStation {
  id: string;
  zone_id: string;
  station_name: string;
  camera_url?: string;
  status: "active" | "inactive" | "maintenance";
}

interface ComplianceStatus {
  worker_id: string;
  compliance_status: "compliant" | "violation" | "resolved";
  detected_ppe: any[];
  detected_at: string;
}

export default function AdminLiveMonitoring() {
  const [activeWorkers, setActiveWorkers] = useState<Worker[]>([]);
  const [monitoringStations, setMonitoringStations] = useState<MonitoringStation[]>([]);
  const [complianceData, setComplianceData] = useState<Record<string, ComplianceStatus>>({});
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"warning" | "danger" | "info">("warning");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [startingMonitoring, setStartingMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await Promise.all([loadMonitoringData(), checkMonitoringStatus()]);
      setIsLoading(false);
    }
    init();
    
    const supabase = createClient();
    const topic = 'admin-live-monitoring';
    
    // Guard: Remove stale channel with same topic
    const staleChannels = supabase.getChannels().filter((ch) => ch.topic === `realtime:${topic}`);
    staleChannels.forEach((ch) => {
      console.log('Removing stale channel:', ch.topic);
      supabase.removeChannel(ch);
    });
    
    console.log('Setting up admin real-time subscriptions');
    
    // Create fresh channel
    const realtimeChannel = supabase.channel(topic);
    
    // Add event listeners BEFORE subscribe
    realtimeChannel
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'worker_zone_map' },
        () => {
          console.log('Worker movement detected');
          loadMonitoringData();
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ppe_events' },
        (payload) => {
          console.log('PPE event detected');
          const event = payload.new as any;
          setComplianceData(prev => ({
            ...prev,
            [event.worker_id]: {
              worker_id: event.worker_id,
              compliance_status: event.compliance_status,
              detected_ppe: event.detected_ppe,
              detected_at: event.detected_at
            }
          }));
        }
      )
      .subscribe((status) => {
        console.log('Admin monitoring subscription status:', status);
      });

    return () => {
      console.log('Cleaning up admin monitoring subscription');
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  async function loadMonitoringData() {
    try {
      const supabase = createClient();
      const context = await resolveCurrentUserContext();
      
      console.log('Loading monitoring data for context:', context);
      
      if (!context.orgId) {
        console.warn("No organization ID found");
        return;
      }

      // First, get all zones (for debugging - will filter by org later in production)
      const { data: allZones } = await supabase
        .from("zones")
        .select("id, name, org_id");

      console.log("ALL zones in database:", allZones);
      console.log("Current admin org_id:", context.orgId);

      // Get zones for this org
      const { data: orgZones, error: zoneError } = await supabase
        .from("zones")
        .select("id, name")
        .eq("org_id", context.orgId);

      if (zoneError) {
        console.error("Error loading zones:", zoneError);
        return;
      }

      console.log("Organization zones for this admin:", orgZones);

      if (!orgZones || orgZones.length === 0) {
        console.warn("No zones found for this organization. Admin org_id:", context.orgId);
        console.warn("Create a zone in 'Assess Hazards' tab first!");
        setActiveWorkers([]);
        return;
      }

      const zoneIds = orgZones.map(z => z.id);
      console.log("Looking for workers in these zone IDs:", zoneIds);

      // Load ALL worker check-ins first (for debugging)
      const { data: allWorkers } = await supabase
        .from("worker_zone_map")
        .select(`
          worker_id,
          zone_id,
          checked_in_at,
          profiles!worker_zone_map_worker_id_fkey (name),
          zones!worker_zone_map_zone_id_fkey (name, org_id)
        `);
      
      console.log("ALL workers in database:", allWorkers);

      // Load active workers with zone info (filtered by org zones)
      const { data: workers, error: workersError } = await supabase
        .from("worker_zone_map")
        .select(`
          worker_id,
          zone_id,
          checked_in_at,
          profiles!worker_zone_map_worker_id_fkey (name),
          zones!worker_zone_map_zone_id_fkey (name)
        `)
        .in("zone_id", zoneIds)
        .not("worker_id", "is", null)
        .not("checked_in_at", "is", null);

      if (workersError) {
        console.error("Error loading workers:", {
          error: workersError,
          message: workersError.message,
          details: workersError.details,
          hint: workersError.hint
        });
        return;
      }

      console.log("Workers in YOUR organization's zones:", workers);

      const formattedWorkers = (workers || []).map((w: any) => ({
        worker_id: w.worker_id,
        zone_id: w.zone_id,
        worker_name: w.profiles?.name || `Worker ${w.worker_id.slice(0, 8)}`,
        zone_name: w.zones?.name || "Unknown Zone",
        checked_in_at: w.checked_in_at
      }));
      
      console.log("Formatted workers for display:", formattedWorkers);
      console.log("Total active workers found:", formattedWorkers.length);
      
      setActiveWorkers(formattedWorkers);

      // Load monitoring stations
      const { data: stations, error: stationsError } = await supabase
        .from("monitoring_stations")
        .select("*")
        .in("zone_id", formattedWorkers.map(w => w.zone_id));
      
      if (!stationsError) {
        setMonitoringStations(stations || []);
      }

      // Load latest compliance data for each worker
      const compliancePromises = formattedWorkers.map(async (worker) => {
        const { data } = await supabase
          .from("ppe_events")
          .select("compliance_status, detected_ppe, detected_at")
          .eq("worker_id", worker.worker_id)
          .order("detected_at", { ascending: false })
          .limit(1);
        
        return { workerId: worker.worker_id, data: data?.[0] };
      });

      const complianceResults = await Promise.all(compliancePromises);
      const complianceMap: Record<string, ComplianceStatus> = {};
      complianceResults.forEach(result => {
        if (result.data) {
          complianceMap[result.workerId] = {
            worker_id: result.workerId,
            ...result.data
          };
        }
      });
      setComplianceData(complianceMap);
    } catch (error) {
      console.error("Error in loadMonitoringData:", error);
    }
  }

  async function checkMonitoringStatus() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/camera/monitoring-status`);
      if (response.ok) {
        const data = await response.json();
        setMonitoringActive(data.active_monitors > 0);
        console.log('📹 Camera monitoring status:', data);
      }
    } catch (error) {
      console.error('Failed to check monitoring status:', error);
    }
  }

  async function startCameraMonitoring() {
    setStartingMonitoring(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/camera/start-monitoring`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to start monitoring');
      }
      
      const data = await response.json();
      console.log('✅ Camera monitoring started:', data);
      setMonitoringActive(true);
      alert(`Camera monitoring started!\n\n${data.count} stations now actively monitoring for PPE compliance.`);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      alert('Failed to start camera monitoring. Check console for details.');
    } finally {
      setStartingMonitoring(false);
    }
  }

  async function stopCameraMonitoring() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/camera/stop-monitoring`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop monitoring');
      }
      
      const data = await response.json();
      console.log('⏸️ Camera monitoring stopped:', data);
      setMonitoringActive(false);
      alert('Camera monitoring stopped.');
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
      alert('Failed to stop camera monitoring. Check console for details.');
    }
  }

  async function sendAlert() {
    if (!selectedWorker || !alertMessage.trim()) {
      alert("Please select a worker and enter an alert message");
      return;
    }
    
    setSendingAlert(true);
    try {
      const supabase = createClient();
      const context = await resolveCurrentUserContext();
      
      const worker = activeWorkers.find(w => w.worker_id === selectedWorker);
      
      console.log("📤 Sending alert to worker:", {
        worker_id: selectedWorker,
        worker_name: worker?.worker_name,
        zone_id: worker?.zone_id,
        message: alertMessage,
        alert_type: alertType,
        sent_by: context.user?.id
      });

      const { data, error } = await supabase.from("worker_alerts").insert({
        worker_id: selectedWorker,
        zone_id: worker?.zone_id,
        message: alertMessage,
        alert_type: alertType,
        sent_by: context.user?.id
      }).select();

      if (error) {
        console.error("❌ Failed to insert alert:", error);
        throw error;
      }

      console.log("✅ Alert sent successfully:", data);
      console.log("Worker should receive real-time notification now!");
      
      setAlertMessage("");
      setSelectedWorker(null);
      alert(`Alert sent successfully to ${worker?.worker_name}!\n\nThe worker should see the alert immediately on their dashboard.`);
    } catch (error) {
      console.error("Failed to send alert:", error);
      alert("Failed to send alert. Please try again.");
    } finally {
      setSendingAlert(false);
    }
  }

  function getComplianceStatus(workerId: string) {
    const status = complianceData[workerId];
    if (!status) return { status: "unknown", color: "text-steel", bg: "bg-steel/20" };
    
    switch (status.compliance_status) {
      case "compliant":
        return { status: "Compliant", color: "text-safe", bg: "bg-safe/20" };
      case "violation":
        return { status: "Violation", color: "text-corrosive", bg: "bg-corrosive/20" };
      default:
        return { status: "Unknown", color: "text-steel", bg: "bg-steel/20" };
    }
  }

  function getStationForZone(zoneId: string) {
    return monitoringStations.find(station => station.zone_id === zoneId);
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
      {/* Camera Monitoring Control */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera size={24} className="text-blue-500" />
              <div>
                <h3 className="font-display font-semibold">
                  PPE Detection Status
                </h3>
                <p className="text-xs text-steel">
                  {monitoringActive 
                    ? '✅ Cameras actively monitoring for PPE compliance'
                    : '⏸️ Monitoring paused - Click Start to begin PPE detection'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!monitoringActive ? (
                <Button 
                  onClick={startCameraMonitoring}
                  disabled={startingMonitoring || monitoringStations.length === 0}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {startingMonitoring ? 'Starting...' : '▶️ Start Monitoring'}
                </Button>
              ) : (
                <Button 
                  onClick={stopCameraMonitoring}
                  variant="outline"
                  className="border-red-500 text-red-500"
                >
                  ⏸️ Stop Monitoring
                </Button>
              )}
              <Button 
                onClick={() => { loadMonitoringData(); checkMonitoringStatus(); }}
                variant="outline"
                size="sm"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
          {monitoringStations.length === 0 && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
              ⚠️ No camera stations configured. Add cameras in the "Camera Setup" tab first.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 text-center">
            <Users size={24} className="mx-auto mb-2 text-hazard" />
            <p className="text-2xl font-display font-bold">{activeWorkers.length}</p>
            <p className="text-xs text-steel">Active Workers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <Camera size={24} className="mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-display font-bold">{monitoringStations.length}</p>
            <p className="text-xs text-steel">Camera Stations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <CheckCircle2 size={24} className="mx-auto mb-2 text-safe" />
            <p className="text-2xl font-display font-bold">
              {Object.values(complianceData).filter(c => c.compliance_status === 'compliant').length}
            </p>
            <p className="text-xs text-steel">Compliant</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <AlertTriangle size={24} className="mx-auto mb-2 text-corrosive" />
            <p className="text-2xl font-display font-bold">
              {Object.values(complianceData).filter(c => c.compliance_status === 'violation').length}
            </p>
            <p className="text-xs text-steel">Violations</p>
          </CardContent>
        </Card>
      </div>

      {/* Worker List & Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Workers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Active Workers
              <Badge variant="muted" className="ml-auto">
                {activeWorkers.length} checked in
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeWorkers.length === 0 ? (
              <div className="text-center py-8 text-steel">
                <Users size={32} className="mx-auto mb-3 opacity-50" />
                <p>No workers currently checked in</p>
                <p className="text-xs mt-1">Workers will appear here when they scan QR codes and check into zones</p>
                <Button 
                  onClick={loadMonitoringData} 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                >
                  Refresh Worker List
                </Button>
                
                {/* Debug Info */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-left">
                  <p className="font-semibold mb-2">🔍 Troubleshooting:</p>
                  <p>• Make sure workers have scanned QR codes</p>
                  <p>• Check browser console (F12) for errors</p>
                  <p>• Verify database has worker_zone_map entries</p>
                  <p>• Try clicking Refresh button above</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeWorkers.map((worker) => {
                  const compliance = getComplianceStatus(worker.worker_id);
                  const station = getStationForZone(worker.zone_id);
                  
                  return (
                    <div
                      key={worker.worker_id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedWorker === worker.worker_id 
                          ? "border-hazard bg-hazard/10" 
                          : "border-white/10 hover:border-white/20"
                      }`}
                      onClick={() => setSelectedWorker(
                        selectedWorker === worker.worker_id ? null : worker.worker_id
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-semibold">
                          {worker.worker_name}
                        </h3>
                        <Badge 
                          variant={compliance.status === "Compliant" ? "safe" : 
                                  compliance.status === "Violation" ? "danger" : "muted"}
                        >
                          {compliance.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-steel mb-1">
                        <MapPin size={14} />
                        {worker.zone_name}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-steel">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {worker.checked_in_at 
                            ? new Date(worker.checked_in_at).toLocaleTimeString()
                            : "Just now"
                          }
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {station?.status === "active" ? (
                            <>
                              <Eye size={12} className="text-blue-500" />
                              <span className="text-blue-500">Monitored</span>
                            </>
                          ) : (
                            <>
                              <Camera size={12} />
                              <span>No Camera</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send size={20} />
              Send Safety Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedWorker ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">
                    Selected Worker: {activeWorkers.find(w => w.worker_id === selectedWorker)?.worker_name}
                  </p>
                  <p className="text-xs text-steel">
                    Zone: {activeWorkers.find(w => w.worker_id === selectedWorker)?.zone_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Alert Type</label>
                  <div className="flex gap-2">
                    {[
                      { type: "info", label: "Info", color: "bg-blue-500/20 text-blue-500" },
                      { type: "warning", label: "Warning", color: "bg-hazard/20 text-hazard" },
                      { type: "danger", label: "Danger", color: "bg-corrosive/20 text-corrosive" }
                    ].map(({ type, label, color }) => (
                      <button
                        key={type}
                        onClick={() => setAlertType(type as any)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          alertType === type ? color : "bg-white/5 text-steel"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    placeholder="Enter alert message..."
                    className="w-full p-3 rounded border border-white/20 bg-white/5 text-sm min-h-20"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={sendAlert}
                    disabled={!alertMessage.trim() || sendingAlert}
                    className="flex-1"
                  >
                    {sendingAlert ? "Sending..." : "Send Alert"}
                  </Button>
                  <Button 
                    onClick={() => setSelectedWorker(null)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-steel">
                <Send size={32} className="mx-auto mb-3 opacity-50" />
                <p>Select a worker above to send an alert</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Camera Monitoring Stations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera size={20} />
            Live PPE Monitoring Stations
            {monitoringActive && (
              <Badge variant="safe" className="ml-auto">
                🔴 ACTIVE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monitoringStations.length === 0 ? (
            <div className="text-center py-8 text-steel">
              <Camera size={32} className="mx-auto mb-3 opacity-50" />
              <p>No monitoring stations configured</p>
              <p className="text-sm mt-1">Set up cameras in the "Camera Setup" tab</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {monitoringStations.map((station) => {
                const zoneData = activeWorkers.find(w => w.zone_id === station.zone_id);
                // Get zone's required PPE
                const requiredPPE: string[] = []; // Will be populated from zone data
                
                return (
                  <div key={station.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-display font-semibold">{station.station_name}</h3>
                      <Badge 
                        variant={station.status === "active" && monitoringActive ? "safe" : "muted"}
                      >
                        {station.status === "active" && monitoringActive ? "Monitoring" : station.status}
                      </Badge>
                    </div>
                    
                    {station.camera_url && station.status === "active" && monitoringActive ? (
                      <CameraPPEOverlay
                        stationId={station.id}
                        stationName={station.station_name}
                        cameraUrl={station.camera_url}
                        requiredPPE={requiredPPE}
                      />
                    ) : (
                      <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-steel">
                        {!station.camera_url ? (
                          <div className="text-center text-sm">
                            <Camera size={24} className="mx-auto mb-2 opacity-50" />
                            <p>No camera configured</p>
                          </div>
                        ) : !monitoringActive ? (
                          <div className="text-center text-sm">
                            <Shield size={24} className="mx-auto mb-2 opacity-50" />
                            <p>Monitoring Paused</p>
                            <p className="text-xs mt-1">Click "Start Monitoring" to begin</p>
                          </div>
                        ) : (
                          <div className="text-center text-sm">
                            <Camera size={24} className="mx-auto mb-2 opacity-50" />
                            <p>Camera Offline</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-steel mt-2">
                      Zone: {zoneData?.zone_name || "Unknown"}
                      {zoneData && ` • ${activeWorkers.filter(w => w.zone_id === station.zone_id).length} worker(s) in zone`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}