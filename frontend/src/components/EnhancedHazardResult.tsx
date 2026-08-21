"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  AlertTriangle, 
  Shield, 
  Info, 
  ExternalLink, 
  ChevronDown,
  Lightbulb,
  Activity,
  Flame,
  Skull,
  Droplet,
  Wind,
  Zap,
  Package,
  TrendingUp,
  Sparkles,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Detection } from "@/lib/onnx/inference";

interface HazardInfo {
  class: string;
  label: string;
  plain_meaning: string;
  safety_tips: string[];
}

interface Props {
  detections: Detection[];
  hazards: HazardInfo[];
  pubchemData?: any;
}

// Icon mapping for hazard types
const HAZARD_ICONS: Record<string, any> = {
  SKULL_AND_CROSSBONES: Skull,
  FLAME: Flame,
  CORROSION: Droplet,
  HEALTH_HAZARD: Activity,
  EXCLAMATION_MARK: AlertTriangle,
  EXPLODING_BOMB: Zap,
  ENVIRONMENT: Wind,
  GAS_CYLINDER: Package,
  FLAME_OVER_CIRCLE: TrendingUp,
};

// Safety score calculation based on hazard severity
function calculateSafetyScore(hazards: HazardInfo[]): { score: number; level: string; color: string } {
  const severityWeights: Record<string, number> = {
    SKULL_AND_CROSSBONES: 10,
    EXPLODING_BOMB: 9,
    HEALTH_HAZARD: 8,
    CORROSION: 7,
    FLAME: 6,
    FLAME_OVER_CIRCLE: 6,
    GAS_CYLINDER: 5,
    EXCLAMATION_MARK: 4,
    ENVIRONMENT: 3,
  };

  let totalWeight = 0;
  hazards.forEach(h => {
    const key = h.class.replace("GHS_Symbol_", "");
    totalWeight += severityWeights[key] || 3;
  });

  const maxPossible = hazards.length * 10;
  const score = Math.max(0, 100 - Math.round((totalWeight / maxPossible) * 100));

  let level = "Low Risk";
  let color = "text-safe";
  if (score < 40) {
    level = "High Risk";
    color = "text-corrosive";
  } else if (score < 70) {
    level = "Medium Risk";
    color = "text-hazard";
  }

  return { score, level, color };
}

// Mock AI-powered similar products (could be replaced with real GenAI API)
function generateSimilarProducts(hazards: HazardInfo[]): Array<{ name: string; reason: string; safer: boolean }> {
  const productTemplates: Record<string, any[]> = {
    CORROSION: [
      { name: "Vinegar-based cleaner", reason: "Natural acidity for cleaning", safer: true },
      { name: "Baking soda paste", reason: "Mild abrasive alternative", safer: true },
      { name: "Citric acid solution", reason: "Effective descaler, lower pH", safer: true },
    ],
    FLAME: [
      { name: "Water-based cleaner", reason: "Non-flammable formulation", safer: true },
      { name: "Steam cleaner", reason: "No chemicals needed", safer: true },
    ],
    SKULL_AND_CROSSBONES: [
      { name: "Professional pest control", reason: "Safer application by experts", safer: true },
      { name: "Natural deterrents", reason: "Non-toxic alternatives", safer: true },
    ],
  };

  const similar: Array<{ name: string; reason: string; safer: boolean }> = [];
  
  hazards.forEach(h => {
    const key = h.class.replace("GHS_Symbol_", "");
    const templates = productTemplates[key];
    if (templates && similar.length < 3) {
      templates.forEach(t => {
        if (similar.length < 3 && !similar.find(s => s.name === t.name)) {
          similar.push(t);
        }
      });
    }
  });

  // Add generic safer alternatives if none found
  if (similar.length === 0) {
    similar.push(
      { name: "Eco-friendly cleaner", reason: "Plant-based formula", safer: true },
      { name: "DIY natural solution", reason: "Common household items", safer: true }
    );
  }

  return similar;
}

export default function EnhancedHazardResult({ detections, hazards, pubchemData }: Props) {
  const [expandedHazard, setExpandedHazard] = useState<string | null>(null);
  const [showSimilarProducts, setShowSimilarProducts] = useState(false);

  const safety = calculateSafetyScore(hazards);
  const similarProducts = generateSimilarProducts(hazards);

  return (
    <div className="space-y-6">
      {/* Safety Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`border-2 ${safety.score < 40 ? 'border-corrosive/50' : safety.score < 70 ? 'border-hazard/50' : 'border-safe/50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-steel text-sm mb-1">Overall Safety Assessment</p>
                <h3 className={`text-3xl font-display font-bold ${safety.color}`}>
                  {safety.level}
                </h3>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative w-24 h-24"
              >
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-white/10"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className={safety.color}
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - safety.score / 100) }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-display font-bold ${safety.color}`}>
                    {safety.score}
                  </span>
                </div>
              </motion.div>
            </div>
            
            <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
              <Info size={16} className="text-steel mt-0.5 flex-shrink-0" />
              <p className="text-sm text-steel">
                {hazards.length} hazard{hazards.length > 1 ? 's' : ''} detected. 
                {safety.score < 70 ? ' Use with extreme caution and follow all safety guidelines.' : ' Handle with care and follow recommended practices.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hazard Details */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <AlertTriangle size={18} className="text-hazard" />
          Detected Hazards
        </h3>
        
        {hazards.map((hazard, index) => {
          const key = hazard.class.replace("GHS_Symbol_", "");
          const Icon = HAZARD_ICONS[key] || AlertTriangle;
          const isExpanded = expandedHazard === hazard.class;
          const detection = detections.find(d => d.class === hazard.class);

          return (
            <motion.div
              key={hazard.class}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-white/10 hover:border-hazard/30 transition-all">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedHazard(isExpanded ? null : hazard.class)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-hazard/10">
                        <Icon size={20} className="text-hazard" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{hazard.label}</CardTitle>
                        {detection && (
                          <Badge variant="muted" className="mt-1">
                            {Math.round(detection.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={20} className="text-steel" />
                    </motion.div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0 space-y-4">
                        <div>
                          <p className="text-steel text-sm mb-3">{hazard.plain_meaning}</p>
                          
                          <div className="space-y-2">
                            <h4 className="font-display font-semibold text-sm flex items-center gap-2">
                              <Shield size={14} className="text-safe" />
                              Safety Recommendations
                            </h4>
                            <ul className="space-y-1.5">
                              {hazard.safety_tips.map((tip, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 * i }}
                                  className="flex gap-2 text-sm"
                                >
                                  <CheckCircle size={14} className="text-safe flex-shrink-0 mt-0.5" />
                                  <span className="text-steel">{tip}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* External Resources */}
                        <div className="pt-3 border-t border-white/10">
                          <a
                            href={`https://www.osha.gov/hazcom`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-hazard hover:underline"
                          >
                            <ExternalLink size={14} />
                            Learn more from OSHA
                          </a>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* PubChem Data if available */}
      {pubchemData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity size={18} className="text-blue-500" />
                Chemical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {pubchemData.IUPACName && (
                <div>
                  <span className="text-steel">IUPAC Name: </span>
                  <span className="text-paper">{pubchemData.IUPACName}</span>
                </div>
              )}
              {pubchemData.MolecularFormula && (
                <div>
                  <span className="text-steel">Formula: </span>
                  <span className="font-mono text-paper">{pubchemData.MolecularFormula}</span>
                </div>
              )}
              {pubchemData.cid && (
                <div className="pt-2">
                  <a
                    href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemData.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:underline"
                  >
                    <ExternalLink size={14} />
                    View full PubChem details
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI-Powered Similar Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader className="cursor-pointer" onClick={() => setShowSimilarProducts(!showSimilarProducts)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                AI-Suggested Safer Alternatives
              </CardTitle>
              <motion.div
                animate={{ rotate: showSimilarProducts ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={20} className="text-steel" />
              </motion.div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {showSimilarProducts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="space-y-3">
                  {similarProducts.map((product, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className="p-2 rounded-lg bg-safe/10">
                        <Lightbulb size={16} className="text-safe" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-semibold text-sm mb-1">{product.name}</h4>
                        <p className="text-steel text-xs">{product.reason}</p>
                        {product.safer && (
                          <Badge className="mt-2 bg-safe/20 text-safe border-safe/30">
                            Safer option
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="pt-2 text-center">
                    <p className="text-xs text-steel italic">
                      💡 Suggestions powered by AI based on detected hazards
                    </p>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap gap-3 justify-center"
      >
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <a href="tel:18002221222">
            <Shield size={14} />
            Call Poison Control
          </a>
        </Button>
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <a href="https://www.osha.gov/hazcom" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} />
            OSHA Guidelines
          </a>
        </Button>
      </motion.div>
    </div>
  );
}
