'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HazmonCard, RARITY_DESCRIPTIONS, HAZMON_TOTAL, getWeaknessFor } from '@/types/hazmon';
import HazmonImageUploader from '@/components/HazmonImageUploader';
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
  allowImageUpload?: boolean;
}

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
  allowImageUpload = false,
}: HazmonCardRevealProps) {
  const [localCard, setLocalCard] = useState<HazmonCard>(hazmonCard);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const HazmonIcon = getHazmonIcon(localCard.ghsCategory);
  const holo = RARITY_HOLO[hazmonCard.rarity];
  const weakness = getWeaknessFor(hazmonCard.ghsCategory);
  const WeaknessIcon = weakness ? getHazmonIcon(weakness.ghsCategory) : null;
  const powerScore = hazmonCard.powerLevel * 20;
  const dexNumber = (hazmonCard as any).dexNumber ?? 0;

  const artworkSrc = (hazmonCard as any).artworkPath || localCard.customImageUrl;

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
          // PERUBAHAN 1: Lebar dibikin proporsional (max 360px), dikasih max-h 90vh biar nggak bablas
          className="relative w-[90vw] max-w-[340px] sm:max-w-[360px] max-h-[90vh] mx-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {isNew && (
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
            >
              <Badge className="bg-gradient-to-r from-hazard to-yellow-300 text-ink px-4 py-1.5 font-display font-bold text-sm shadow-lg animate-pulse whitespace-nowrap">
                <Sparkles size={14} className="mr-1 inline-block" />
                New Discovery!
              </Badge>
            </motion.div>
          )}

          <div
            // PERUBAHAN 2: Frame dipaksa pakai h-full biar adaptif sama flex container
            className="hazmon-holo-frame rounded-[22px] p-[3px] shadow-2xl h-full flex flex-col min-h-0"
            style={
              {
                '--holo-a': holo.a,
                '--holo-b': holo.b,
                '--holo-c': holo.c,
              } as CSSProperties
            }
          >
            <div className="relative rounded-[19px] bg-ink overflow-hidden border border-black/40 flex flex-col h-full min-h-0">
              
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-20 bg-ink/80 hover:bg-ink/60 rounded-full p-2 transition-colors border border-white/10 hover:border-white/20 group"
              >
                <X className="w-4 h-4 text-steel group-hover:text-paper transition-colors" />
              </button>

              {/* PERUBAHAN 3: Area konten utama dikasih overflow-y-auto & scrollbar diumpetin */}
              <div className="overflow-y-auto flex-1 flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {/* Header */}
                <div className="flex items-start justify-between px-4 pt-4 pb-2 flex-shrink-0">
                  <div className="min-w-0 pr-8">
                    <p className="text-steel text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">
                      Basic Hazmon
                    </p>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-paper leading-tight truncate">
                      {hazmonCard.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2"
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
                <p className="text-steel text-[11px] sm:text-xs px-4 -mt-2 pb-3 flex-shrink-0">
                  {hazmonCard.subtitle}
                </p>

                {/* Art Panel - Tinggi dikurangin dikit biar nggak makan tempat */}
                <div
                  className="relative h-40 sm:h-44 mx-3 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `radial-gradient(circle at 50% 40%, ${hazmonCard.primaryColor}35, ${hazmonCard.secondaryColor}25 70%, transparent 100%)`,
                  }}
                >
                  <div className="absolute inset-0 hazmon-sparkle-field" />
                  
                  {artworkSrc && !imageError ? (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative z-10 w-full h-full"
                    >
                      <img
                        src={artworkSrc}
                        alt={hazmonCard.name}
                        className="w-full h-full object-cover drop-shadow-2xl"
                        onError={() => setImageError(true)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative z-10"
                    >
                      <HazmonIcon
                        className="w-16 h-16 sm:w-20 sm:h-20"
                        style={{ color: hazmonCard.primaryColor }}
                        strokeWidth={1.5}
                      />
                    </motion.div>
                  )}

                  <div className="absolute bottom-2 right-2 bg-ink/70 backdrop-blur-sm rounded-md px-2 py-1 border border-white/10">
                    <span className="text-paper/80 text-[9px] font-display font-bold tracking-wider">
                      HAZDEX
                    </span>
                  </div>

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
                        <Trophy size={11} className="mr-1 inline-block" />
                        Mastered
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Details Section - Gap dirapetin dari space-y-3 jadi space-y-2 */}
                <div className="p-4 space-y-2.5 flex-shrink-0">
                  
                  {/* Safety Information */}
                  <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-steel/30 to-transparent px-3 py-1 border-b border-white/10">
                      <Shield className="w-3 h-3 text-steel" />
                      <span className="text-steel text-[10px] font-bold uppercase tracking-widest">
                        Safety Info
                      </span>
                    </div>
                    <p className="text-paper text-xs sm:text-sm font-medium px-3 py-2 leading-relaxed">
                      {hazmonCard.subtitle} - A chemical hazard requiring proper safety protocols.
                    </p>
                  </div>

                  {/* Hazard Profile */}
                  <div className="rounded-lg border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between bg-black/30 px-3 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: hazmonCard.primaryColor }}
                        >
                          <HazmonIcon className="w-3 h-3 text-ink" strokeWidth={2.5} />
                        </div>
                        <span className="font-display font-bold text-paper text-xs sm:text-sm truncate">
                          {hazmonCard.typeLabel}
                        </span>
                      </div>
                      <span className="font-display font-bold text-base sm:text-lg text-paper tabular-nums flex-shrink-0">
                        {powerScore}
                        <span className="text-[9px] text-steel font-normal ml-0.5">PWR</span>
                      </span>
                    </div>
                    <div className="px-3 py-2 bg-corrosive/10 border-t border-corrosive/20">
                      <p className="text-steel text-[11px] sm:text-xs leading-relaxed">{hazmonCard.ghsFact}</p>
                    </div>
                  </div>

                  {/* Weakness / Resistance / Retreat */}
                  <div className="grid grid-cols-3 divide-x divide-white/10 rounded-lg border border-white/10 bg-white/5 overflow-hidden text-center">
                    <div className="px-1 py-2">
                      <p className="text-steel text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1">
                        Weakness
                      </p>
                      {weakness && WeaknessIcon ? (
                        <div className="flex flex-col items-center gap-1">
                          <WeaknessIcon className="w-3.5 h-3.5" style={{ color: weakness.primaryColor }} />
                          <span className="text-paper text-[9px] sm:text-[10px] font-medium truncate w-full px-1">
                            {weakness.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-steel text-[9px]">None</span>
                      )}
                    </div>
                    <div className="px-1 py-2">
                      <p className="text-steel text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1">
                        Resistance
                      </p>
                      <div className="flex flex-col items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-safe" />
                        <span className="text-paper text-[9px] sm:text-[10px] font-medium">
                          PPE Lv.{hazmonCard.powerLevel}
                        </span>
                      </div>
                    </div>
                    <div className="px-1 py-2">
                      <p className="text-steel text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1">
                        Retreat
                      </p>
                      <div className="flex flex-col items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5 text-hazard" />
                        <span className="text-paper text-[9px] sm:text-[10px] font-medium">Evacuate</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {allowImageUpload && !showImageUpload && (
                      <Button onClick={() => setShowImageUpload(true)} variant="outline" className="w-full h-8 text-xs">
                        {localCard.customImageUrl ? '🖼️ Change Image' : '📷 Add Custom Image'}
                      </Button>
                    )}
                    {showImageUpload && allowImageUpload && (
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <HazmonImageUploader
                          hazmonId={localCard.id}
                          currentImageUrl={localCard.customImageUrl}
                          onImageUpdated={(newUrl) => {
                            setLocalCard({ ...localCard, customImageUrl: newUrl });
                            setShowImageUpload(false);
                          }}
                        />
                        <Button onClick={() => setShowImageUpload(false)} variant="ghost" size="sm" className="w-full mt-1 text-xs h-7">
                          Cancel
                        </Button>
                      </div>
                    )}

                    <Button
                      onClick={onViewSafety}
                      className="w-full bg-gradient-to-r from-safe to-green-600 hover:from-safe/90 hover:to-green-600/90 text-ink font-display font-semibold h-10"
                    >
                      <Shield className="w-4 h-4 mr-1.5" />
                      View Safety Guide
                    </Button>

                    <button
                      onClick={onClose}
                      className="w-full text-steel hover:text-paper text-xs sm:text-sm font-medium transition-colors pb-1"
                    >
                      Continue Scanning
                    </button>
                  </div>
                </div>
              </div>

              {/* PERUBAHAN 4: Bottom strip dibikin sticky di bawah, nggak ikut ke-scroll */}
              <div className="bg-black/40 border-t border-white/10 px-4 py-2 text-center mt-auto flex-shrink-0">
                <p className="text-steel text-[9px] sm:text-[10px] leading-snug">
                  {hazmonCard.isMastered ? (
                    <>
                      <span className="text-hazard font-bold">MASTERED —</span> safety points earned.
                    </>
                  ) : (
                    <>
                      <span className="text-paper font-bold">HAZMON RULE:</span> complete the guide to mark as Mastered.
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