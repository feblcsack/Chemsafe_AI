"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resolveCurrentUserContext } from "@/lib/supabase/userContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminGHSScanner from "@/components/AdminGHSScanner";
import AdminLiveMonitoring from "@/components/AdminLiveMonitoring";
import MonitoringStationSetup from "@/components/MonitoringStationSetup";
import ZoneQRDisplay from "@/components/ZoneQRDisplay";
import ErrorBoundary from "@/components/ErrorBoundary";
import SystemStatus from "@/components/SystemStatus";
import { Plus, MapPin, ScanLine, Activity, Users, QrCode, Settings } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  hazard_types: string[];
  required_ppe: string[];
}

interface WorkerInZone {
  worker_id: string;
  zone_id: string;
  worker_name?: string;
}

interface Analytics {
  total_zones: number;
  total_scans: number;
  most_common_hazard: string | null;
  hazard_breakdown: Record<string, number>;
  ppe_compliance_rate: number | null;
}

export default function AdminDashboard() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeWorkers, setActiveWorkers] = useState<WorkerInZone[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "scanner" | "monitoring" | "qrcodes" | "setup">("overview");

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates for worker assignments
    const supabase = createClient();
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'worker_zone_map' }, 
        () => loadDashboardData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ppe_events' },
        () => {} // PPE events are handled by AdminPPEStatusCard
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadDashboardData() {
    const supabase = createClient();
    const context = await resolveCurrentUserContext();
    if (!context.orgId) return;

    // Load zones
    const { data: zoneData } = await supabase
      .from("zones")
      .select("*")
      .eq("org_id", context.orgId);
    setZones(zoneData || []);

    // Load active workers with their names
    const { data: workerMapData } = await supabase
      .from("worker_zone_map")
      .select(`
        worker_id, 
        zone_id,
        profiles!worker_zone_map_worker_id_fkey (name)
      `)
      .in("zone_id", (zoneData || []).map((z) => z.id));
    
    const workersWithNames = (workerMapData || []).map((w: any) => ({
      worker_id: w.worker_id,
      zone_id: w.zone_id,
      worker_name: w.profiles?.name || `Worker ${w.worker_id.slice(0, 8)}`
    }));
    setActiveWorkers(workersWithNames);

    // Load analytics
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/org/${context.orgId}`);
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch {
      setAnalytics(null);
    }
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "scanner", label: "Assess Hazards", icon: ScanLine },
    { id: "qrcodes", label: "QR Codes", icon: QrCode },
    { id: "setup", label: "Camera Setup", icon: Settings },
    { id: "monitoring", label: "Live Monitoring", icon: Users },
  ] as const;

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Control Center</h1>
          <p className="text-steel text-sm mt-1">Workplace safety management and monitoring</p>
        </div>
        <Link href="/admin/zones/new">
          <Button>
            <Plus size={16} /> New Zone
          </Button>
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 border-b border-white/10">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-display font-semibold text-sm transition-colors border-b-2 ${
                activeTab === tab.id 
                  ? "border-hazard text-hazard" 
                  : "border-transparent text-steel hover:text-paper"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-10">
          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 text-center">
                  <p className="text-2xl font-display font-bold">{analytics.total_zones}</p>
                  <p className="text-xs text-steel mt-1">Work Zones</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 text-center">
                  <p className="text-2xl font-display font-bold">{activeWorkers.length}</p>
                  <p className="text-xs text-steel mt-1">Active Workers</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 text-center">
                  <p className="text-2xl font-display font-bold">{analytics.total_scans}</p>
                  <p className="text-xs text-steel mt-1">
                    Total Assessments
                  </p>
                  <p className="text-xs text-steel mt-1 opacity-70">
                    GHS scans performed by admins
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 text-center">
                  <p className="text-sm font-display font-bold truncate">
                    {analytics.most_common_hazard?.replace("GHS_Symbol_", "") || "—"}
                  </p>
                  <p className="text-xs text-steel mt-1">Most Common Hazard</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Work Zones */}
          <div>
            <h2 className="font-display font-bold mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-hazard" /> Work Zones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((z) => (
                <Card key={z.id}>
                  <CardContent className="pt-5">
                    <p className="font-display font-bold">{z.name}</p>
                    <p className="text-sm text-steel mt-1">
                      Required PPE: {z.required_ppe.length > 0 ? z.required_ppe.join(", ") : "None specified"}
                    </p>
                    <p className="text-xs text-steel mt-1">
                      Hazards: {z.hazard_types.length > 0 
                        ? z.hazard_types.map(h => h.replace("GHS_Symbol_", "")).join(", ")
                        : "None detected"
                      }
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        activeWorkers.some(w => w.zone_id === z.id) ? "bg-safe" : "bg-steel"
                      }`} />
                      <span className="text-xs text-steel">
                        {activeWorkers.filter(w => w.zone_id === z.id).length} worker(s) active
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {zones.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="pt-5 text-center text-steel">
                    <p>No zones created yet.</p>
                    <p className="text-sm mt-1">Use the "Assess Hazards" tab to scan products and create your first zone.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* System Status */}
          <div>
            <h2 className="font-display font-bold mb-4 flex items-center gap-2">
              <Activity size={16} className="text-hazard" /> System Health
            </h2>
            <ErrorBoundary>
              <SystemStatus />
            </ErrorBoundary>
          </div>
        </div>
      )}

      {activeTab === "scanner" && (
        <div>
          <h2 className="font-display font-bold mb-4">Workplace Hazard Assessment</h2>
          <ErrorBoundary>
            <AdminGHSScanner />
          </ErrorBoundary>
        </div>
      )}

      {activeTab === "qrcodes" && (
        <div>
          <h2 className="font-display font-bold mb-4">Zone QR Codes</h2>
          <p className="text-steel text-sm mb-6">
            Download, print, or display QR codes for workers to scan and check into zones.
          </p>
          
          <ErrorBoundary>
            {zones.length === 0 ? (
              <Card>
                <CardContent className="pt-5 text-center">
                  <QrCode size={32} className="mx-auto mb-3 text-steel" />
                  <p className="text-steel">No zones created yet.</p>
                  <p className="text-sm text-steel mt-1">
                    Create zones using the "Assess Hazards" tab first.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zones.map((zone) => (
                  <ZoneQRDisplay
                    key={zone.id}
                    zoneId={zone.id}
                    zoneName={zone.name}
                    requiredPpe={zone.required_ppe}
                    hazardTypes={zone.hazard_types}
                  />
                ))}
              </div>
            )}
          </ErrorBoundary>
        </div>
      )}

      {activeTab === "setup" && (
        <div>
          <h2 className="font-display font-bold mb-4 flex items-center gap-2">
            <Settings size={16} className="text-hazard" /> Camera Setup & Configuration
          </h2>
          <p className="text-steel text-sm mb-6">
            Configure external cameras for automated PPE monitoring in your work zones.
          </p>
          <ErrorBoundary>
            <MonitoringStationSetup />
          </ErrorBoundary>
        </div>
      )}

      {activeTab === "monitoring" && (
        <div>
          <h2 className="font-display font-bold mb-4 flex items-center gap-2">
            <Users size={16} className="text-hazard" /> Live Worker Monitoring & Alerts
          </h2>
          <p className="text-xs text-steel mb-6">
            Monitor worker safety via external cameras and send real-time alerts. Workers receive notifications on their devices.
          </p>
          <ErrorBoundary>
            <AdminLiveMonitoring />
          </ErrorBoundary>
        </div>
      )}
    </main>
  );
}
