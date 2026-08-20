"use client";

import { useState } from "react";
import Link from "next/link";
import GHSScanner from "@/components/GHSScanner";
import HazardResultCard from "@/components/HazardResultCard";
import type { Detection } from "@/lib/onnx/inference";
import { ScanGrid } from "@/components/ui/scan-grid";
import { ArrowLeft, Loader2, BookOpen, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HazardInfo {
  class: string;
  label: string;
  plain_meaning: string;
  safety_tips: string[];
}

// Educational content for household chemical safety
const SAFETY_EDUCATION = {
  storage: {
    title: "🏠 Safe Storage Practices",
    tips: [
      "Store chemicals in original containers with labels intact",
      "Keep hazardous products in locked cabinets away from children",
      "Never store chemicals near food or in food containers",
      "Separate incompatible chemicals (acids away from bases)",
      "Store in cool, dry, well-ventilated areas away from heat sources"
    ]
  },
  mixing: {
    title: "⚠️ Never Mix These Common Products",
    dangers: [
      "Bleach + Ammonia → Toxic chloramine gas",
      "Bleach + Vinegar → Toxic chlorine gas",
      "Bleach + Rubbing Alcohol → Chloroform (toxic)",
      "Hydrogen Peroxide + Vinegar → Corrosive peracetic acid",
      "Drain Cleaner + Drain Cleaner (different brands) → Explosive reaction"
    ]
  },
  emergency: {
    title: "🚨 Emergency Response",
    actions: [
      "Skin contact: Remove contaminated clothing, rinse with water for 15+ minutes",
      "Eye contact: Flush eyes with water for 15+ minutes, seek medical attention",
      "Inhalation: Move to fresh air immediately, call poison control if symptoms persist",
      "Ingestion: DO NOT induce vomiting, call poison control immediately",
      "Spill: Ventilate area, wear protective gear, follow product cleanup instructions"
    ]
  },
  disposal: {
    title: "♻️ Proper Disposal",
    guidelines: [
      "Never pour chemicals down the drain (can damage pipes/environment)",
      "Check local hazardous waste collection programs",
      "Small amounts: Follow product label disposal instructions",
      "Large amounts: Contact local waste management authority",
      "Empty containers: Rinse thoroughly before recycling if allowed"
    ]
  }
};

export default function ScanPage() {
  const [detections, setDetections] = useState<Detection[] | null>(null);
  const [hazards, setHazards] = useState<HazardInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEducation, setShowEducation] = useState(true);

  async function handleResult(dets: Detection[], text: string, conf: number) {
    setDetections(dets);
    setShowEducation(false);
    await lookupHazards(dets.map((d) => d.class));

    // Log scan (no OCR needed anymore)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/household`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hazard_detected: dets.map((d) => d.class),
        session_id: crypto.randomUUID(),
      }),
    }).catch(() => {});
  }

  async function lookupHazards(classes: string[]) {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pubchem/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ghs_classes: classes, product_name_text: null }),
      });
      const data = await res.json();
      setHazards(data.hazards || []);
    } finally {
      setLoading(false);
    }
  }

  function getSeverityLevel(hazardClasses: string[]) {
    const highRisk = ["SKULL_AND_CROSSBONES", "EXPLODING_BOMB", "HEALTH_HAZARD"];
    const mediumRisk = ["CORROSION", "FLAME", "FLAME_OVER_CIRCLE"];
    
    if (hazardClasses.some(h => highRisk.some(r => h.includes(r)))) {
      return { level: "High Risk", color: "text-red-500", bgColor: "bg-red-500/10" };
    } else if (hazardClasses.some(h => mediumRisk.some(r => h.includes(r)))) {
      return { level: "Medium Risk", color: "text-yellow-500", bgColor: "bg-yellow-500/10" };
    }
    return { level: "Low Risk", color: "text-blue-500", bgColor: "bg-blue-500/10" };
  }

  return (
    <main className="relative min-h-screen px-6 py-10 overflow-hidden">
      <ScanGrid />
      <div className="relative z-10 max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-paper transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Household Chemical Safety Scanner
          </h1>
          <p className="text-steel text-sm max-w-xl mx-auto">
            Scan hazard labels on household products to learn about risks and safe handling. 
            All detection runs privately on your device.
          </p>
        </div>

        {/* Safety Education - Show before scan */}
        {showEducation && !detections && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Storage */}
            <Card className="border-blue-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield size={18} className="text-blue-500" />
                  {SAFETY_EDUCATION.storage.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {SAFETY_EDUCATION.storage.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-500 flex-shrink-0">✓</span>
                      <span className="text-steel">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Never Mix */}
            <Card className="border-red-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500" />
                  {SAFETY_EDUCATION.mixing.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {SAFETY_EDUCATION.mixing.dangers.map((danger, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-red-500 flex-shrink-0">⚠️</span>
                      <span className="text-steel">{danger}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Emergency */}
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen size={18} className="text-yellow-500" />
                  {SAFETY_EDUCATION.emergency.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {SAFETY_EDUCATION.emergency.actions.map((action, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-yellow-500 flex-shrink-0">•</span>
                      <span className="text-steel">{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Disposal */}
            <Card className="border-green-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen size={18} className="text-green-500" />
                  {SAFETY_EDUCATION.disposal.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {SAFETY_EDUCATION.disposal.guidelines.map((guideline, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-green-500 flex-shrink-0">♻</span>
                      <span className="text-steel">{guideline}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Emergency Numbers Card */}
        {showEducation && !detections && (
          <Card className="border-hazard/30 bg-hazard/5 mb-8">
            <CardContent className="pt-5">
              <div className="flex items-center justify-center gap-6 flex-wrap text-center">
                <div>
                  <p className="text-sm text-steel mb-1">Poison Control (US)</p>
                  <a href="tel:18002221222" className="text-lg font-display font-bold text-hazard hover:underline">
                    1-800-222-1222
                  </a>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <p className="text-sm text-steel mb-1">Emergency Services</p>
                  <a href="tel:911" className="text-lg font-display font-bold text-corrosive hover:underline">
                    911
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <GHSScanner onResult={handleResult} />

        {loading && (
          <div className="text-center mt-6">
            <div className="inline-flex items-center justify-center gap-2 text-steel">
              <Loader2 className="animate-spin" size={16} />
              <span>Analyzing hazard information...</span>
            </div>
          </div>
        )}

        {detections && !loading && (
          <div className="mt-6 space-y-4">
            {/* Severity Badge */}
            {(() => {
              const severity = getSeverityLevel(detections.map(d => d.class));
              return (
                <div className="flex justify-center">
                  <Badge className={`${severity.bgColor} ${severity.color} text-sm px-4 py-2`}>
                    {severity.level} • {detections.length} hazard{detections.length > 1 ? 's' : ''} detected
                  </Badge>
                </div>
              );
            })()}

            <HazardResultCard
              detections={detections}
              hazards={hazards}
              ocrText=""
              ocrConfidence={0}
              onSearchByName={() => {}}
            />

            {/* Educational Footer */}
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <BookOpen size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-display font-semibold mb-2">Safety Reminders</h3>
                    <ul className="space-y-1 text-sm text-steel">
                      <li>• Always read product labels before use</li>
                      <li>• Keep products in original containers</li>
                      <li>• Store chemicals away from children and pets</li>
                      <li>• Never mix different chemical products</li>
                      <li>• Use in well-ventilated areas</li>
                      <li>• Dispose of products properly at hazardous waste facilities</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <button
                onClick={() => {
                  setDetections(null);
                  setHazards([]);
                  setShowEducation(true);
                }}
                className="text-sm text-hazard hover:underline"
              >
                ← Scan Another Product
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
