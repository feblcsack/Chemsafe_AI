"use client";

/**
 * Admin-side view of a worker's PPE compliance status.
 *
 * IMPORTANT: this does NOT open a camera or show live video. The backend's
 * WebSocket sends detection results back only to the connection that sent
 * the frame (the worker's own device) — there is no video relay to admin
 * in this MVP. Building that would mean either re-broadcasting frames
 * through the backend (extra bandwidth + latency) or WebRTC (real
 * infrastructure work) — flagged as a future enhancement, not silently
 * faked here.
 *
 * Instead, this subscribes to Supabase Realtime on `ppe_events`, which the
 * WebSocket handler writes to on every compliant/violation transition —
 * so admin sees status changes within ~1-2s, without needing the video.
 */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Circle } from "lucide-react";

interface Props {
  workerId: string;
  workerName?: string;
  zoneName?: string;
}

interface PpeEvent {
  compliance_status: "compliant" | "violation" | "resolved";
  detected_ppe: { class: string }[];
  detected_at: string;
}

export default function AdminPPEStatusCard({ workerId, workerName, zoneName }: Props) {
  const [latest, setLatest] = useState<PpeEvent | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Load the most recent event on mount
    supabase
      .from("ppe_events")
      .select("compliance_status, detected_ppe, detected_at")
      .eq("worker_id", workerId)
      .order("detected_at", { ascending: false })
      .limit(1)
      .then(({ data }) => data?.[0] && setLatest(data[0] as PpeEvent));

    // Then stay live via Realtime
    const channel = supabase
      .channel(`ppe-events-${workerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ppe_events", filter: `worker_id=eq.${workerId}` },
        (payload) => setLatest(payload.new as PpeEvent)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId]);

  const violations = (latest?.detected_ppe || [])
    .map((d) => d.class)
    .filter((c) => c.startsWith("no_"));

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-display font-bold text-sm">{workerName || `Worker ${workerId.slice(0, 8)}`}</p>
            {zoneName && <p className="text-xs text-steel">{zoneName}</p>}
          </div>
          {!latest ? (
            <Badge variant="muted">
              <Circle size={9} /> No data yet
            </Badge>
          ) : latest.compliance_status === "compliant" ? (
            <Badge variant="safe">
              <ShieldCheck size={11} /> Compliant
            </Badge>
          ) : (
            <Badge variant="danger">
              <ShieldAlert size={11} /> Violation
            </Badge>
          )}
        </div>

        {violations.length > 0 && (
          <p className="text-xs text-corrosive mt-2">
            Missing: {violations.map((v) => v.replace("no_", "")).join(", ")}
          </p>
        )}

        {latest && (
          <p className="text-[11px] text-steel mt-2">
            Last update: {new Date(latest.detected_at).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
