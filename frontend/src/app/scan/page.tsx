"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import GHSScanner from "@/components/GHSScanner";
import EnhancedHazardResult from "@/components/EnhancedHazardResult";
import HazmonCardReveal from "@/components/HazmonCardReveal";
import CombinationAlert from "@/components/CombinationAlert";
import { householdHazmonService } from "@/lib/hazmonService.household";
import { GHSCategory, HazmonCard, CombinationAlert as CombinationAlertType } from "@/types/hazmon";
import type { Detection } from "@/lib/onnx/inference";
import { ScanGrid } from "@/components/ui/scan-grid";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { ArrowLeft, Loader2, BookOpen, Shield, AlertTriangle, Sparkles, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const [pubchemData, setPubchemData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showEducation, setShowEducation] = useState(true);
  
  // Hazmon states
  const [hazmonCard, setHazmonCard] = useState<HazmonCard | null>(null);
  const [isNewDiscovery, setIsNewDiscovery] = useState(false);
  const [combinationAlert, setCombinationAlert] = useState<CombinationAlertType | null>(null);
  const [hazdexStats, setHazdexStats] = useState(householdHazmonService.getHazdexStats());

  // Map GHS class to category
  function mapGHSToCategory(ghsClass: string): GHSCategory | null {
    const mapping: Record<string, GHSCategory> = {
      'GHS_Symbol_FLAME': 'flammable',
      'GHS_Symbol_FLAME_OVER_CIRCLE': 'oxidizing',
      'GHS_Symbol_EXPLODING_BOMB': 'explosive',
      'GHS_Symbol_CORROSION': 'corrosive',
      'GHS_Symbol_SKULL_AND_CROSSBONES': 'acute-toxic',
      'GHS_Symbol_HEALTH_HAZARD': 'health-hazard',
      'GHS_Symbol_EXCLAMATION_MARK': 'irritant',
      'GHS_Symbol_ENVIRONMENT': 'environment',
      'GHS_Symbol_GAS_CYLINDER': 'compressed-gas',
    };
    return mapping[ghsClass] || null;
  }

  // Get GHS fact
  function getGHSFact(category: GHSCategory): string {
    const facts: Record<GHSCategory, string> = {
      'flammable': 'H225: Cairan dan uap sangat mudah terbakar. Dapat menyebabkan kebakaran jika terkena panas, percikan, atau api.',
      'oxidizing': 'H272: Dapat mempercepat atau menyebabkan kebakaran. Oksidator kuat dapat bereaksi hebat dengan bahan organik.',
      'explosive': 'H201: Bahan peledak tidak stabil. Sensitif terhadap benturan, gesekan, api, atau pemanasan.',
      'corrosive': 'H314: Menyebabkan luka bakar kulit parah dan kerusakan mata. Korosif pada logam.',
      'acute-toxic': 'H300/H310/H330: Fatal jika tertelan, terkena kulit, atau terhirup. Racun akut yang sangat berbahaya.',
      'health-hazard': 'H350/H360/H370: Dapat menyebabkan kanker, merusak kesuburan atau janin, atau menyebabkan kerusakan organ.',
      'irritant': 'H315/H319/H335: Menyebabkan iritasi kulit, mata parah, atau saluran pernapasan.',
      'environment': 'H400/H410: Sangat beracun bagi kehidupan akuatik dengan efek jangka panjang.',
      'compressed-gas': 'H280/H281: Gas di bawah tekanan. Dapat meledak jika dipanaskan.',
    };
    return facts[category];
  }

  // Get safety recommendation
  function getSafetyRec(category: GHSCategory): string {
    const recs: Record<GHSCategory, string> = {
      'flammable': 'P210: Jauhkan dari panas, percikan, api. Gunakan sarung tangan nitrile, kacamata safety.',
      'oxidizing': 'P220: Jauhkan dari bahan mudah terbakar. Gunakan sarung tangan neoprene, face shield.',
      'explosive': 'P250: Hindari gesekan, benturan. Hanya personel terlatih. Simpan di tempat sejuk.',
      'corrosive': 'P260/P280: Jangan hirup uap. Gunakan sarung tangan neoprene, face shield, apron tahan asam.',
      'acute-toxic': 'P264/P270/P271: Cuci tangan, jangan makan/minum saat menggunakan. Gunakan respirator, sarung tangan ganda.',
      'health-hazard': 'P201/P281/P308: Dapatkan instruksi khusus. Gunakan APD sesuai. Jika terpajan, hubungi dokter.',
      'irritant': 'P264/P280/P302: Cuci tangan. Gunakan sarung tangan, kacamata. Jika terkena kulit, cuci dengan banyak air.',
      'environment': 'P273/P391/P501: Hindari pelepasan ke lingkungan. Kumpulkan tumpahan. Buang sesuai regulasi B3.',
      'compressed-gas': 'P410/P403: Lindungi dari panas. Simpan di tempat berventilasi. Gunakan kacamata safety.',
    };
    return recs[category];
  }

  async function handleResult(dets: Detection[], text: string, conf: number) {
    setDetections(dets);
    setShowEducation(false);
    
    // Process Hazmon for the primary detection
    if (dets.length > 0) {
      const primaryDetection = dets.reduce((prev, current) =>
        current.confidence > prev.confidence ? current : prev
      );
      
      const ghsCategory = mapGHSToCategory(primaryDetection.class);
      
      if (ghsCategory) {
        try {
          const result = await householdHazmonService.processGHSScan({
            ghsCategory,
            productName: text || 'Household Chemical',
            ghsFact: getGHSFact(ghsCategory),
            safetyRecommendation: getSafetyRec(ghsCategory),
            safetyScore: Math.min(5, Math.ceil(primaryDetection.confidence * 5)),
          });
          
          setHazmonCard(result.hazmonCard);
          setIsNewDiscovery(result.isNewDiscovery);
          
          if (result.combinationAlert) {
            // Show combination alert after a short delay
            setTimeout(() => {
              setCombinationAlert(result.combinationAlert!);
            }, 1500);
          }
          
          // Update stats
          setHazdexStats(householdHazmonService.getHazdexStats());
        } catch (error) {
          console.error('Hazmon processing error:', error);
        }
      }
    }
    
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
      setPubchemData(data.pubchem_compound);
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
    <main className="relative min-h-screen px-6 py-10 pt-24 overflow-hidden">{/* Added pt-24 for navbar */}
      <ScanGrid />
      <AnimatedGradient />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-paper transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-3">
            <Sparkles size={14} className="mr-1" />
            AI-Enhanced Analysis
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Household Chemical Safety Scanner
          </h1>
          <p className="text-steel text-sm max-w-xl mx-auto">
            Scan hazard labels on household products to learn about risks and safe handling. 
            All detection runs privately on your device with AI-powered insights.
          </p>
        </motion.div>

        {/* Hazdex Stats Widget */}
        {hazdexStats.totalCollected > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link href="/hazdex">
              <Card className="border-hazard/30 bg-gradient-to-r from-hazard/10 to-safe/10 hover:border-hazard/50 transition-all cursor-pointer group">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🎴</div>
                      <div>
                        <p className="font-display font-bold text-paper mb-0.5">My Hazdex Collection</p>
                        <p className="text-steel text-xs">
                          {hazdexStats.totalCollected}/{hazdexStats.totalPossible} Hazmons • {hazdexStats.completionPercent}% Complete
                        </p>
                      </div>
                    </div>
                    <Trophy className="w-5 h-5 text-hazard group-hover:scale-110 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Safety Education - Show before scan */}
        <AnimatePresence>
          {showEducation && !detections && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Storage */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border-blue-500/30 bg-blue-500/5 h-full">
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
                </motion.div>

                {/* Never Mix */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="border-red-500/30 bg-red-500/5 h-full">
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
                </motion.div>

                {/* Emergency */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="border-yellow-500/30 bg-yellow-500/5 h-full">
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
                </motion.div>

                {/* Disposal */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="border-green-500/30 bg-green-500/5 h-full">
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
                </motion.div>
              </div>

              {/* Emergency Numbers Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <GHSScanner onResult={handleResult} />

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8"
          >
            <div className="inline-flex items-center justify-center gap-2 text-steel">
              <Loader2 className="animate-spin" size={20} />
              <span>Analyzing hazard information with AI...</span>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {detections && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              <EnhancedHazardResult 
                detections={detections}
                hazards={hazards}
                pubchemData={pubchemData}
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-8"
              >
                <button
                  onClick={() => {
                    setDetections(null);
                    setHazards([]);
                    setPubchemData(null);
                    setShowEducation(true);
                  }}
                  className="text-sm text-hazard hover:underline font-display font-semibold"
                >
                  ← Scan Another Product
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Hazmon Card Reveal */}
        {hazmonCard && (
          <HazmonCardReveal
            hazmonCard={hazmonCard}
            isNew={isNewDiscovery}
            onClose={() => {
              setHazmonCard(null);
              setIsNewDiscovery(false);
            }}
            onViewSafety={() => {
              setHazmonCard(null);
              // Scroll to safety info
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Combination Alert */}
        {combinationAlert && (
          <CombinationAlert
            combination={combinationAlert}
            onClose={() => setCombinationAlert(null)}
            onViewProcedure={() => {
              setCombinationAlert(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>
    </main>
  );
}
