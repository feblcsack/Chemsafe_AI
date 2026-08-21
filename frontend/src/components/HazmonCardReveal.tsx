'use client';

import type { CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HazmonCard, RARITY_DESCRIPTIONS, HAZMON_TOTAL, getWeaknessFor } from '@/types/hazmon';
import {
  X,
  Shield,
  AlertTriangle,
  Sparkles,
  Zap,
  Trophy,
  Flame,
  Droplet,
  Wind,
  Skull,
  CircleDot,
  Eye,
  ScanLine,
  Waves,
  ShieldCheck,
  DoorOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HazmonCardRevealProps {
  hazmonCard: HazmonCard;
  isNew: boolean;
  onClose: () => void;
  onViewSafety: () => void;
}

// Map GHS categories to lucide icons
const getHazmonIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    'flammable': Flame,
    'oxidizing': Zap,
    'explosive': AlertTriangle,
    'corrosive': Droplet,
    'acute-toxic': Skull,
    'health-hazard': CircleDot,
    'irritant': Eye,
    'environment': Waves,
    'compressed-gas': Wind,
  };
  return iconMap[category] || ScanLine;
};

// Holo frame theme per rarity — feeds the .hazmon-holo-frame CSS variables
const RARITY_HOLO: Record<HazmonCard['rarity'], { a: string; b: string; c: string }> = {
  common: { a: '#64748b', b: '#cbd5e1', c: '#94a3b8' },
  uncommon: { a: '#16a34a', b: '#bbf7d0', c: '#22c55e' },
  rare: { a: '#2563eb', b: '#c4b5fd', c: '#7c3aed' },
  epic: { a: '#f2b707', b: '#fff7cc', c: '#f59e0b' },
};

export default function HazmonCardReveal({
  hazmonCard,
  isNew,
  onClose,
  onViewSafety,
}: HazmonCardRevealProps) {
  const HazmonIcon = getHazmonIcon(hazmonCard.ghsCategory);
  const holo = RARITY_HOLO[hazmonCard.rarity];
  const weakness = getWeaknessFor(hazmonCard.ghsCategory);
  const WeaknessIcon = weakness ? getHazmonIcon(weakness.ghsCategory) : null;
  const powerScore = hazmonCard.powerLevel * 20; // 20–100, "threat power" stat
  const dexNumber = (hazmonCard as any).dexNumber ?? 0;

  const rarityTextColors: Record<HazmonCard['rarity'], string> = {
    common: 'text-steel',
    uncommon: 'text-safe',
    rare: 'text-blue-400',
    epic: 'text-hazard',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/95 backdrop-blur-lg z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* New Discovery Badge */}
          {isNew && (
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
            >
              <Badge className="bg-gradient-to-r from-hazard to-yellow-300 text-ink px-4 py-1.5 font-display font-bold text-sm shadow-lg animate-pulse">
                <Sparkles size={14} className="mr-1" />
                New Discovery!
              </Badge>
            </motion.div>
          )}

          {/* Holo Border Frame */}
          <div
            className="hazmon-holo-frame rounded-[22px] p-[3px] shadow-2xl"
            style={
              {
                '--holo-a': holo.a,
                '--holo-b': holo.b,
                '--holo-c': holo.c,
              } as CSSProperties
            }
          >
            <div className="relative rounded-[19px] bg-ink overflow-hidden border border-black/40">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-20 bg-ink/80 hover:bg-ink/60 rounded-full p-2 transition-colors border border-white/10 hover:border-white/20 group"
              >
                <X className="w-4 h-4 text-steel group-hover:text-paper transition-colors" />
              </button>

              {/* --- Top bar: Basic tag / Name / Dex number & type chip --- */}
              <div className="flex items-start justify-between px-4 pt-4 pb-2">
                <div className="min-w-0 pr-2">
                  <p className="text-steel text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">
                    Basic Hazmon
                  </p>
                  <h3 className="font-display text-2xl font-bold text-paper leading-tight truncate">
                    {hazmonCard.name}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center border-2"
                    style={{
                      backgroundColor: `${hazmonCard.primaryColor}25`,
                      borderColor: hazmonCard.primaryColor,
                    }}
                  >
                    <HazmonIcon
                      className="w-4 h-4"
                      style={{ color: hazmonCard.primaryColor }}
                      strokeWidth={2}
                    />
                  </div>
                  <span className="text-steel text-[10px] font-bold font-display tabular-nums">
                    N&deg;{String(dexNumber).padStart(2, '0')}/{HAZMON_TOTAL}
                  </span>
                </div>
              </div>
              <p className="text-steel text-xs px-4 -mt-2 pb-3">{hazmonCard.subtitle}</p>

              {/* --- Art Panel --- */}
              <div
                className="relative h-40 mx-3 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 50% 40%, ${hazmonCard.primaryColor}35, ${hazmonCard.secondaryColor}25 70%, transparent 100%)`,
                }}
              >
                <div className="absolute inset-0 hazmon-sparkle-field" />
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    rotate: [0, 4, -4, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="relative z-10"
                >
                  <HazmonIcon
                    className="w-16 h-16"
                    style={{ color: hazmonCard.primaryColor }}
                    strokeWidth={1.5}
                  />
                </motion.div>

                {/* Collection stamp */}
                <div className="absolute bottom-2 right-2 bg-ink/70 backdrop-blur-sm rounded-md px-2 py-1 border border-white/10">
                  <span className="text-paper/80 text-[9px] font-display font-bold tracking-wider">
                    HAZDEX
                  </span>
                </div>

                {/* Rarity chip */}
                <div className="absolute top-2 left-2">
                  <Badge
                    variant="muted"
                    className={`${rarityTextColors[hazmonCard.rarity]} text-[10px] uppercase tracking-wider font-bold border border-white/10`}
                  >
                    {hazmonCard.rarity}
                  </Badge>
                </div>
                {hazmonCard.isMastered && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-hazard/90 text-ink border-0 text-[10px] font-bold">
                      <Trophy size={11} className="mr-1" />
                      Mastered
                    </Badge>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                {/* --- "Ability" banner: field report / source --- */}
                <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-steel/30 to-transparent px-3 py-1 border-b border-white/10">
                    <ScanLine className="w-3 h-3 text-steel" />
                    <span className="text-steel text-[10px] font-bold uppercase tracking-widest">
                      Field Report
                    </span>
                  </div>
                  <p className="text-paper text-sm font-medium px-3 py-2">
                    {hazmonCard.discoveredFrom}
                  </p>
                </div>

                {/* --- Hazard profile bar (attack-row analogue) --- */}
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between bg-black/30 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: hazmonCard.primaryColor }}
                      >
                        <HazmonIcon className="w-3.5 h-3.5 text-ink" strokeWidth={2.5} />
                      </div>
                      <span className="font-display font-bold text-paper text-sm truncate">
                        {hazmonCard.typeLabel} Hazard
                      </span>
                    </div>
                    <span className="font-display font-bold text-lg text-paper tabular-nums flex-shrink-0">
                      {powerScore}
                      <span className="text-[10px] text-steel font-normal ml-0.5">PWR</span>
                    </span>
                  </div>
                  <div className="px-3 py-2 bg-corrosive/10 border-t border-corrosive/20">
                    <p className="text-steel text-xs leading-relaxed">{hazmonCard.ghsFact}</p>
                    <p className="text-corrosive/80 text-[10px] italic mt-1.5">
                      Full PPE must be confirmed before this Hazmon can be safely handled.
                    </p>
                  </div>
                </div>

                {/* --- Weakness / Resistance / Retreat footer --- */}
                <div className="grid grid-cols-3 divide-x divide-white/10 rounded-lg border border-white/10 bg-white/5 overflow-hidden text-center">
                  <div className="px-2 py-2.5">
                    <p className="text-steel text-[9px] font-bold uppercase tracking-wider mb-1.5">
                      Weakness
                    </p>
                    {weakness && WeaknessIcon ? (
                      <div className="flex flex-col items-center gap-1">
                        <WeaknessIcon
                          className="w-4 h-4"
                          style={{ color: weakness.primaryColor }}
                        />
                        <span className="text-paper text-[10px] font-medium truncate w-full">
                          {weakness.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-steel text-[10px]">None known</span>
                    )}
                  </div>
                  <div className="px-2 py-2.5">
                    <p className="text-steel text-[9px] font-bold uppercase tracking-wider mb-1.5">
                      Resistance
                    </p>
                    <div className="flex flex-col items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-safe" />
                      <span className="text-paper text-[10px] font-medium">
                        PPE Lv.{hazmonCard.powerLevel}
                      </span>
                    </div>
                  </div>
                  <div className="px-2 py-2.5">
                    <p className="text-steel text-[9px] font-bold uppercase tracking-wider mb-1.5">
                      Retreat
                    </p>
                    <div className="flex flex-col items-center gap-1">
                      <DoorOpen className="w-4 h-4 text-hazard" />
                      <span className="text-paper text-[10px] font-medium">Evacuate</span>
                    </div>
                  </div>
                </div>

                {/* Rarity Description */}
                <p className="text-steel text-xs italic leading-relaxed text-center">
                  {RARITY_DESCRIPTIONS[hazmonCard.rarity]}
                </p>

                {/* Collection Stats */}
                {hazmonCard.timesEncountered > 1 && (
                  <div className="text-center">
                    <Badge variant="muted" className="text-xs">
                      <Trophy size={12} className="mr-1" />
                      Encountered {hazmonCard.timesEncountered}x
                    </Badge>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <Button
                    onClick={onViewSafety}
                    className="w-full bg-gradient-to-r from-safe to-green-600 hover:from-safe/90 hover:to-green-600/90 text-ink font-display font-semibold"
                    size="lg"
                  >
                    <Shield className="w-4 h-4" />
                    View Safety Guide
                  </Button>

                  <button
                    onClick={onClose}
                    className="w-full text-steel hover:text-paper text-sm font-medium transition-colors py-2"
                  >
                    Continue Scanning
                  </button>
                </div>
              </div>

              {/* Bottom rule strip */}
              <div className="bg-black/40 border-t border-white/10 px-4 py-2 text-center">
                <p className="text-steel text-[10px] leading-snug">
                  {hazmonCard.isMastered ? (
                    <>
                      <span className="text-hazard font-bold">MASTERED —</span> safety points
                      earned for this Hazmon.
                    </>
                  ) : (
                    <>
                      <span className="text-paper font-bold">HAZMON RULE:</span> complete the
                      safety guide to mark this card as Mastered.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
