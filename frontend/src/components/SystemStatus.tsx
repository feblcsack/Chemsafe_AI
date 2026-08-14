"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveCurrentUserContext } from "@/lib/supabase/userContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface SystemCheck {
  name: string;
  status: "checking" | "success" | "error" | "warning";
  message: string;
  details?: string;
}

export default function SystemStatus() {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    runSystemChecks();
  }, []);

  async function runSystemChecks() {
    setChecking(true);
    const newChecks: SystemCheck[] = [];

    // 1. Check Supabase connection
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("profiles").select("count").limit(1);
      if (error) throw error;
      newChecks.push({
        name: "Supabase Database",
        status: "success",
        message: "Connected successfully"
      });
    } catch (error) {
      newChecks.push({
        name: "Supabase Database",
        status: "error",
        message: "Connection failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // 2. Check user authentication
    try {
      const context = await resolveCurrentUserContext();
      if (context.user) {
        newChecks.push({
          name: "User Authentication",
          status: "success",
          message: `Authenticated as ${context.user.email} (${context.role})`
        });
      } else {
        newChecks.push({
          name: "User Authentication",
          status: "warning",
          message: "Not authenticated"
        });
      }
    } catch (error) {
      newChecks.push({
        name: "User Authentication",
        status: "error",
        message: "Auth check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // 3. Check backend API
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL not configured");
      }
      
      const response = await fetch(`${apiUrl}/health`, { 
        method: "GET",
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        newChecks.push({
          name: "Backend API",
          status: "success",
          message: `Connected to ${apiUrl}`
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      newChecks.push({
        name: "Backend API",
        status: "error",
        message: "API connection failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // 4. Check required tables
    try {
      const supabase = createClient();
      const tables = ['zones', 'worker_zone_map', 'ppe_events', 'workplace_scans', 'worker_alerts', 'monitoring_stations'];
      
      for (const table of tables) {
        try {
          await supabase.from(table).select("count").limit(1);
        } catch (error) {
          throw new Error(`Table "${table}" missing or inaccessible`);
        }
      }
      
      newChecks.push({
        name: "Database Schema",
        status: "success",
        message: "All required tables exist"
      });
    } catch (error) {
      newChecks.push({
        name: "Database Schema", 
        status: "error",
        message: "Schema check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    setChecks(newChecks);
    setChecking(false);
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "success":
        return <CheckCircle2 size={16} className="text-safe" />;
      case "error":
        return <XCircle size={16} className="text-corrosive" />;
      case "warning":
        return <AlertCircle size={16} className="text-hazard" />;
      default:
        return <div className="w-4 h-4 border-2 border-steel border-t-transparent rounded-full animate-spin" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "success":
        return <Badge variant="safe">OK</Badge>;
      case "error":
        return <Badge variant="danger">ERROR</Badge>;
      case "warning":
        return <Badge variant="muted">WARNING</Badge>;
      default:
        return <Badge variant="muted">CHECKING</Badge>;
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            System Status
          </CardTitle>
          <Button
            onClick={runSystemChecks}
            disabled={checking}
            variant="outline"
            size="sm"
          >
            <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.length === 0 ? (
            <div className="text-center py-4 text-steel">
              <div className="w-6 h-6 border-2 border-steel border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Running system checks...
            </div>
          ) : (
            checks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="font-medium text-sm">{check.name}</p>
                    <p className="text-xs text-steel">{check.message}</p>
                    {check.details && (
                      <p className="text-xs text-corrosive mt-1">{check.details}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(check.status)}
              </div>
            ))
          )}
        </div>
        
        {checks.length > 0 && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-steel">
              <strong>System Health:</strong> {checks.filter(c => c.status === "success").length}/{checks.length} checks passed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}