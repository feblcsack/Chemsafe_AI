"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import GHSScanner from "@/components/GHSScanner";
import type { Detection } from "@/lib/onnx/inference";
import { resolveCurrentUserContext } from "../../../../lib/supabase/userContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const SUGGESTED_PPE: Record<string, string[]> = {
  GHS_Symbol_CORROSION: ["gloves", "goggles"],
  GHS_Symbol_FLAME: ["fire-resistant suit"],
  GHS_Symbol_HEALTH_HAZARD: ["mask", "gloves"],
  GHS_Symbol_SKULL_AND_CROSSBONES: ["mask", "gloves", "goggles"],
  GHS_Symbol_GAS_CYLINDER: ["goggles"],
};

export default function NewZonePage() {
  const [step, setStep] = useState<"scan" | "confirm" | "done">("scan");
  const [zoneName, setZoneName] = useState("");
  const [detections, setDetections] = useState<Detection[]>([]);
  const [ppe, setPpe] = useState<string[]>([]);
  const [createdZoneId, setCreatedZoneId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const router = useRouter();

  function handleScanResult(dets: Detection[], text: string, confidence: number) {
    setDetections(dets);
    setOcrText(text);
    
    // Enhanced PPE recommendations
    const suggested = new Set<string>();
    dets.forEach((d) => {
      const recommendations = SUGGESTED_PPE[d.class] || [];
      recommendations.forEach((p) => suggested.add(p));
      
      // Additional smart recommendations based on GHS classes
      switch (d.class) {
        case "GHS_Symbol_01": // Explosive
        case "GHS_Symbol_02": // Flammable  
          suggested.add("safety_boots");
          suggested.add("helmet");
          break;
        case "GHS_Symbol_05": // Corrosive
        case "GHS_Symbol_06": // Toxic
          suggested.add("respirator");
          suggested.add("face_shield");
          break;
        case "GHS_Symbol_08": // Health hazard
          suggested.add("gloves");
          suggested.add("respirator");
          break;
      }
    });
    
    // Always recommend basic PPE for chemical environments
    if (dets.length > 0) {
      suggested.add("safety_goggles");
      suggested.add("gloves");
    }
    
    setPpe(Array.from(suggested));
    setStep("confirm");
  }

  async function handleConfirm() {
    setIsLoading(true);
    try {
      const context = await resolveCurrentUserContext();

      if (!context.user) {
        router.push("/login");
        return;
      }

      if (!context.orgId) {
        alert("Gagal mengambil data organisasi. Coba muat ulang.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: context.orgId,
          name: zoneName,
          hazard_types: detections.map((d) => d.class),
          required_ppe: ppe,
          created_by: context.user.id,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.detail || errorBody?.message || `API Error: ${res.statusText}`);
      }

      const data = await res.json();
      setCreatedZoneId(data.zone.id);
      setStep("done");
    } catch (error) {
      console.error("Error creating zone:", error);
      alert("Terjadi kesalahan saat menyimpan zone.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6">New Zone — Assessment</h1>

      {step === "scan" && (
        <>
          <Input
            placeholder="Zone name (e.g. Chemical Storage Warehouse)"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            className="mb-4"
            required
          />
          <GHSScanner onResult={(dets, text, conf) => handleScanResult(dets, text, conf)} />
        </>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <p className="font-display font-bold mb-2">Detected hazards</p>
              <ul className="text-sm text-steel space-y-1">
                {detections.map((d, i) => (
                  <li key={i}>• {d.class.replace("GHS_Symbol_", "")}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div>
            <p className="font-display font-bold text-sm mb-2">Required PPE (edit if needed)</p>
            <Input
              value={ppe.join(", ")}
              onChange={(e) => setPpe(e.target.value.split(",").map((s) => s.trim()))}
            />
          </div>

          <Button 
            onClick={handleConfirm} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Zone & Generate QR"}
          </Button>
        </div>
      )}

      {step === "done" && createdZoneId && (
        <div className="text-center space-y-4">
          <p className="font-display font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="text-safe" size={18} /> Zone created successfully
          </p>
          <div className="bg-white p-4 inline-block rounded-lg">
            <QRCodeSVG value={createdZoneId} size={200} />
          </div>
          <p className="text-sm text-steel">
            Print or display this QR code at the work zone. Workers scan it to check in.
          </p>
          <Button variant="link" onClick={() => router.push("/admin/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      )}
    </main>
  );
}