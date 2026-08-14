"use client";

import { useState } from "react";
import Link from "next/link";
import GHSScanner from "@/components/GHSScanner";
import HazardResultCard from "@/components/HazardResultCard";
import type { Detection } from "@/lib/onnx/inference";
import { ScanGrid } from "@/components/ui/scan-grid";
import { ArrowLeft, Loader2 } from "lucide-react";

interface HazardInfo {
  class: string;
  label: string;
  plain_meaning: string;
  safety_tips: string[];
}

export default function ScanPage() {
  const [detections, setDetections] = useState<Detection[] | null>(null);
  const [hazards, setHazards] = useState<HazardInfo[]>([]);
  const [ocrText, setOcrText] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleResult(dets: Detection[], text: string, conf: number) {
    setDetections(dets);
    setOcrText(text);
    setOcrConfidence(conf);
    await lookupHazards(dets.map((d) => d.class));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/household`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hazard_detected: dets.map((d) => d.class),
        ocr_text: text,
        session_id: crypto.randomUUID(),
      }),
    }).catch(() => {});
  }

  async function lookupHazards(classes: string[], productName?: string) {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pubchem/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ghs_classes: classes, product_name_text: productName || null }),
      });
      const data = await res.json();
      setHazards(data.hazards || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen px-6 py-10 overflow-hidden">
      <ScanGrid />
      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-paper transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back
        </Link>

        <h1 className="text-center font-display text-2xl font-bold mb-1">
          Scan a Household Product
        </h1>
        <p className="text-center text-steel text-sm mb-8">
          Point your camera at a hazard label — everything runs on your device.
        </p>

        <GHSScanner onResult={handleResult} />

        {loading && (
          <p className="text-center text-steel mt-6 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={14} /> Looking up hazard info...
          </p>
        )}

        {detections && !loading && (
          <HazardResultCard
            detections={detections}
            hazards={hazards}
            ocrText={ocrText}
            ocrConfidence={ocrConfidence}
            onSearchByName={(correctedText) =>
              lookupHazards(
                detections.map((d) => d.class),
                correctedText
              )
            }
          />
        )}
      </div>
    </main>
  );
}
