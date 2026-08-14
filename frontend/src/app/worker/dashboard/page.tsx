"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, MapPin, Shield, ArrowLeft, CheckCircle2, AlertTriangle, Users, Camera } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  hazard_types: string[];
  required_ppe: string[];
  additional_requirements?: string;
}

interface Alert {
  id: string;
  message: string;
  type: "warning" | "danger" | "info";
  timestamp: string;
}

export default function WorkerDashboard() {
  const [zone, setZone] = useState<Zone | null>(null);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const qrStoppingRef = useRef(false);

  useEffect(() => {
    loadWorkerData();
  }, []);

  useEffect(() => {
    if (!workerId) return;

    const supabase = createClient();
    const topic = `worker-alerts-${workerId}`;

    // Guard: Remove stale channel with same topic from previous mount/Fast Refresh
    // This prevents "cannot add postgres_changes callbacks after subscribe()" error
    const staleChannels = supabase.getChannels().filter((ch) => ch.topic === `realtime:${topic}`);
    staleChannels.forEach((ch) => {
      console.log('Removing stale channel:', ch.topic);
      supabase.removeChannel(ch);
    });

    console.log('Setting up alert subscription for worker:', workerId);
    
    // Create fresh channel
    const channel = supabase.channel(topic);

    // Add event listener BEFORE subscribe
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "worker_alerts",
        filter: `worker_id=eq.${workerId}`,
      },
      (payload) => {
        console.log('🚨 ALERT RECEIVED:', payload);
        const newAlert = payload.new as any;
        console.log('Alert details:', {
          id: newAlert.id,
          message: newAlert.message,
          type: newAlert.alert_type,
          timestamp: newAlert.created_at
        });
        
        // Map database column names to interface
        const formattedAlert: Alert = {
          id: newAlert.id,
          message: newAlert.message,
          type: newAlert.alert_type as "warning" | "danger" | "info",
          timestamp: newAlert.created_at
        };
        
        console.log('Adding alert to state:', formattedAlert);
        setAlerts((prev) => {
          const updated = [formattedAlert, ...prev.slice(0, 4)];
          console.log('New alerts array:', updated);
          return updated;
        });
      }
    );

    // Subscribe after adding listeners
    channel.subscribe((status) => {
      console.log("Alert subscription status:", status);
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up alert subscription');
      supabase.removeChannel(channel);
    };
  }, [workerId]);

  async function loadWorkerData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setWorkerId(user.id);

    // Get worker profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    
    setWorkerName(profile?.name || "Worker");

    // Check if worker is already assigned to a zone
    const { data: assignment } = await supabase
      .from("worker_zone_map")
      .select("zone_id")
      .eq("worker_id", user.id)
      .maybeSingle();

    if (assignment?.zone_id) {
      const zoneRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones/${assignment.zone_id}`);
      if (zoneRes.ok) {
        const zoneData = await zoneRes.json();
        setZone(zoneData);
        setCheckedIn(true);
      }
    }
  }

  async function joinZoneById(zoneId: string) {
    setCheckingIn(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User authentication failed");
      }

      console.log("Starting check-in process for zone:", zoneId);

      // Step 1: Delete any existing check-ins for this worker (clean slate)
      console.log("Removing old check-ins...");
      await supabase
        .from("worker_zone_map")
        .delete()
        .eq("worker_id", user.id);

      // Step 2: Wait a bit to ensure delete completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 3: Insert new check-in (simple insert, no upsert)
      console.log("Creating new check-in...");
      const { data: newCheckIn, error: insertError } = await supabase
        .from("worker_zone_map")
        .insert({ 
          worker_id: user.id, 
          zone_id: zoneId,
          checked_in_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert failed:", insertError);
        throw new Error(`Could not check in: ${insertError.message}`);
      }

      console.log("Check-in created successfully:", newCheckIn);

      // Step 4: Fetch zone details
      console.log("Loading zone information...");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones/${zoneId}`);
      if (!res.ok) {
        throw new Error(`Failed to load zone information`);
      }

      const zoneData = await res.json();
      console.log("Zone loaded:", zoneData.name);
      
      setZone(zoneData);
      setCheckedIn(true);
      setAcknowledged(false);
      
      console.log("✅ Check-in completed successfully!");
      
    } catch (error) {
      console.error("Check-in failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to check into zone: ${errorMessage}\n\nPlease try again.`);
    } finally {
      setCheckingIn(false);
    }
  }

  async function checkOut() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("worker_zone_map")
      .delete()
      .eq("worker_id", user.id);

    setZone(null);
    setCheckedIn(false);
    setAcknowledged(false);
    setAlerts([]);
  }

  async function acknowledgeRequirements() {
    setAcknowledged(true);
    
    // Log acknowledgment
    const supabase = createClient();
    await supabase.from("worker_acknowledgments").insert({
      worker_id: workerId,
      zone_id: zone?.id,
      acknowledged_at: new Date().toISOString(),
      requirements_version: zone?.required_ppe.join(",") || ""
    });
  }

  function dismissAlert(alertId: string) {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }

  // QR Scanner logic (same as before)
  async function stopScanner() {
    const scanner = qrRef.current;
    if (!scanner || qrStoppingRef.current) return;

    qrStoppingRef.current = true;
    try {
      await scanner.stop();
    } catch {
      // Ignore errors
    } finally {
      try {
        await scanner.clear();
      } catch {
        // Ignore errors
      }
      qrRef.current = null;
      qrStoppingRef.current = false;
    }
  }

  useEffect(() => {
    if (!scanning || !qrContainerRef.current || qrRef.current) return;

    const scanner = new Html5Qrcode(qrContainerRef.current.id);
    qrRef.current = scanner;
    let cancelled = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          if (cancelled) return;
          await stopScanner();
          setScanning(false);
          await joinZoneById(decodedText);
        },
        () => {}
      )
      .catch(() => {
        if (cancelled) return;
        qrRef.current = null;
        setScanning(false);
      });

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [scanning]);

  async function startQRScan() {
    setScanning(true);
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`border-2 ${
              alert.type === 'danger' ? 'border-corrosive bg-corrosive/10' :
              alert.type === 'warning' ? 'border-hazard bg-hazard/10' :
              'border-blue-500 bg-blue-500/10'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className={
                      alert.type === 'danger' ? 'text-corrosive' :
                      alert.type === 'warning' ? 'text-hazard' : 'text-blue-500'
                    } />
                    <div>
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-steel">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => dismissAlert(alert.id)}
                    className="text-steel hover:text-paper text-xs"
                  >
                    ✕
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold mb-2">
          Hello, {workerName}
        </h1>
        <p className="text-steel text-sm">Your workplace safety dashboard</p>
      </div>

      {/* Check-in Flow */}
      {!zone && !scanning && !checkingIn && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode size={20} />
              Check Into Work Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-steel text-sm mb-4">
              Scan the QR code posted at your work zone to check in and receive safety briefing.
            </p>
            <Button onClick={startQRScan} size="lg" className="w-full">
              <QrCode size={16} /> Scan Zone QR Code
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Scanner */}
      <div
        id="qr-reader"
        ref={qrContainerRef}
        className={scanning ? "w-full rounded-xl overflow-hidden mb-4" : "hidden"}
      />

      {scanning && (
        <Card className="mb-4">
          <CardContent className="pt-5">
            <p className="text-center text-steel text-sm mb-3">
              Point your camera at the zone QR code
            </p>
            <Button onClick={() => setScanning(false)} variant="outline" className="w-full">
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Checking In Status */}
      {checkingIn && (
        <Card className="mb-6">
          <CardContent className="pt-5 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-hazard border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-steel">Checking into zone...</p>
          </CardContent>
        </Card>
      )}

      {/* Zone Information & Safety Briefing */}
      {zone && checkedIn && (
        <div className="space-y-6">
          {/* Check-in Confirmation */}
          <Card className="border-safe/30 bg-safe/5">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 size={20} className="text-safe" />
                <div>
                  <p className="text-xs uppercase text-steel font-display tracking-wide">
                    Checked in to
                  </p>
                  <p className="font-display font-bold text-lg">{zone.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={checkOut} variant="outline" size="sm" className="flex-1">
                  <ArrowLeft size={14} /> Check Out
                </Button>
                <Badge variant="safe" className="px-3 py-1">
                  <Users size={12} /> Monitored
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Monitoring Notice */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <Camera size={18} className="text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-display font-semibold text-sm mb-1">Live Safety Monitoring</h3>
                  <p className="text-xs text-steel">
                    This zone is monitored by safety cameras. Ensure all required PPE is worn. 
                    You will receive alerts if safety violations are detected.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PPE Requirements & Safety Briefing */}
          {!acknowledged && (
            <Card className="border-hazard/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield size={18} />
                  Safety Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {zone.required_ppe.length > 0 && (
                  <div>
                    <p className="font-display font-semibold text-sm mb-3">Required PPE:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {zone.required_ppe.map((ppe, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-hazard/10 rounded-lg">
                          <span className="text-xs">🛡️</span>
                          <span className="text-sm font-medium capitalize">
                            {ppe.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {zone.additional_requirements && (
                  <div>
                    <p className="font-display font-semibold text-sm mb-2">Additional Requirements:</p>
                    <p className="text-sm p-3 bg-ink/50 rounded-lg">
                      {zone.additional_requirements}
                    </p>
                  </div>
                )}

                {zone.hazard_types.length > 0 && (
                  <div>
                    <p className="font-display font-semibold text-sm mb-2">Workplace Hazards:</p>
                    <div className="flex flex-wrap gap-2">
                      {zone.hazard_types.map((hazard, i) => (
                        <span 
                          key={i} 
                          className="px-2 py-1 bg-corrosive/10 text-corrosive text-xs rounded-full"
                        >
                          {hazard.replace("GHS_Symbol_", "Symbol ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-hazard/20 pt-4">
                  <div className="bg-hazard/10 p-3 rounded-lg mb-4">
                    <h4 className="font-display font-semibold text-sm mb-2 text-hazard">
                      ⚠️ Safety Acknowledgment Required
                    </h4>
                    <p className="text-xs text-steel">
                      By clicking "I Understand", you confirm that you have:
                    </p>
                    <ul className="text-xs text-steel mt-2 space-y-1">
                      <li>• Equipped all required PPE listed above</li>
                      <li>• Read and understand the safety requirements</li>
                      <li>• Will follow all safety protocols in this zone</li>
                      <li>• Understand you are being monitored for compliance</li>
                    </ul>
                  </div>
                  
                  <Button onClick={acknowledgeRequirements} className="w-full" size="lg">
                    <CheckCircle2 size={16} />
                    I Understand - Start Work
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Status - After Acknowledgment */}
          {acknowledged && (
            <div className="space-y-4">
              <Card className="border-safe/30 bg-safe/5">
                <CardContent className="pt-5 text-center">
                  <CheckCircle2 size={32} className="mx-auto mb-3 text-safe" />
                  <h3 className="font-display font-bold text-lg mb-2">Ready to Work</h3>
                  <p className="text-steel text-sm">
                    You are now cleared for work in {zone.name}. Stay safe and follow all protocols.
                  </p>
                </CardContent>
              </Card>

              {/* Quick Reference */}
              <Card className="bg-ink/50">
                <CardContent className="pt-5">
                  <h3 className="font-display font-semibold text-sm mb-3">💡 Quick Safety Reference</h3>
                  <ul className="text-xs text-steel space-y-1">
                    <li>• Keep all required PPE on during work</li>
                    <li>• Report any safety concerns immediately</li>
                    <li>• You are being monitored - alerts will be sent if needed</li>
                    <li>• Remember to check out when leaving the area</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
