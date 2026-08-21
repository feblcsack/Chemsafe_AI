'use client';

import { motion } from 'framer-motion';
import { HazmonCard, HAZMON_DATABASE, HAZMON_TOTAL } from '@/types/hazmon';
import { Lock, Sparkles, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface HazdexGridProps {
  collectedHazmons: HazmonCard[];
  onCardClick: (hazmon: HazmonCard) => void;
}

export default function HazdexGrid({ collectedHazmons, onCardClick }: HazdexGridProps) {
  const [filter, setFilter] = useState<'all' | 'collected' | 'mastered'>('all');

  // Create a map of collected hazmons by ID
  const collectedMap = new Map(collectedHazmons.map((h) => [h.id, h]));

  // Get all possible hazmons, sorted by their fixed Hazdex number
  const allHazmons = Object.values(HAZMON_DATABASE).sort((a, b) => a.dexNumber - b.dexNumber);

  const filteredHazmons = allHazmons
    .map((hazmonData) => {
      const collected = collectedMap.get(hazmonData.id);
      return collected || { ...hazmonData, isLocked: true };
    })
    .filter((hazmon) => {
      if (filter === 'collected') return !('isLocked' in hazmon);
      if (filter === 'mastered') return 'isMastered' in hazmon && hazmon.isMastered;
      return true;
    });

  const collectedCount = collectedHazmons.length;
  const totalCount = HAZMON_TOTAL;
  const masteredCount = collectedHazmons.filter((h) => h.isMastered).length;
  const completionPercent = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  const rarityBorderColors: Record<string, string> = {
    common: 'border-steel/40',
    uncommon: 'border-safe/40',
    rare: 'border-blue-500/40',
    epic: 'border-hazard/40',
  };

  const rarityTextColors: Record<string, string> = {
    common: 'text-steel',
    uncommon: 'text-safe',
    rare: 'text-blue-400',
    epic: 'text-hazard',
  };

  const rarityFillColors: Record<string, string> = {
    common: 'bg-steel',
    uncommon: 'bg-safe',
    rare: 'bg-blue-400',
    epic: 'bg-hazard',
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-br from-ink to-ink/60 rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-paper mb-1">Hazdex</h2>
            <p className="text-steel text-sm">Your Hazmon collection</p>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold text-paper tabular-nums">
              {collectedCount}/{totalCount}
            </div>
            <div className="text-sm text-steel">{completionPercent}% Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>

        {/* Sub Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-hazard tabular-nums">
              {masteredCount}
            </div>
            <div className="text-xs text-steel">Mastered</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-safe tabular-nums">
              {collectedHazmons.reduce((sum, h) => sum + h.timesEncountered, 0)}
            </div>
            <div className="text-xs text-steel">Total Scans</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold text-blue-400 tabular-nums">
              {new Set(collectedHazmons.map((h) => h.ghsCategory)).size}
            </div>
            <div className="text-xs text-steel">Categories</div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all' as const, label: 'All', count: allHazmons.length },
          { key: 'collected' as const, label: 'Collected', count: collectedCount },
          { key: 'mastered' as const, label: 'Mastered', count: masteredCount },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`
              px-4 py-2 rounded-lg font-display font-semibold text-sm transition-all
              ${
                filter === f.key
                  ? 'bg-hazard text-ink shadow-lg shadow-hazard/20'
                  : 'bg-white/5 text-steel hover:bg-white/10 hover:text-paper'
              }
            `}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredHazmons.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredHazmons.map((hazmon, index) => (
            <HazmonGridCard
              key={hazmon.id}
              hazmon={hazmon}
              index={index}
              onClick={() => !('isLocked' in hazmon) && onCardClick(hazmon as HazmonCard)}
              rarityBorderColor={rarityBorderColors[hazmon.rarity]}
              rarityTextColor={rarityTextColors[hazmon.rarity]}
              rarityFillColor={rarityFillColors[hazmon.rarity]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HazmonGridCardProps {
  hazmon: any;
  index: number;
  onClick: () => void;
  rarityBorderColor: string;
  rarityTextColor: string;
  rarityFillColor: string;
}

function HazmonGridCard({
  hazmon,
  index,
  onClick,
  rarityBorderColor,
  rarityTextColor,
  rarityFillColor,
}: HazmonGridCardProps) {
  const isLocked = 'isLocked' in hazmon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.04, 0.6) }}
      whileHover={!isLocked ? { scale: 1.04, y: -2 } : {}}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer transition-shadow
        ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-black/30'}
      `}
      onClick={onClick}
    >
      <div
        className={`
          relative aspect-[3/4] p-3 flex flex-col
          bg-gradient-to-br from-ink to-black/40
          border-2 ${isLocked ? 'border-white/10' : rarityBorderColor}
          ${hazmon.isMastered ? 'ring-2 ring-hazard' : ''}
        `}
      >
        {/* Dex number */}
        <span className="absolute top-1.5 left-2 text-steel/70 text-[9px] font-display font-bold tabular-nums z-10">
          #{String(hazmon.dexNumber).padStart(2, '0')}
        </span>

        {/* Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-2 text-center px-2">
            <Lock className="w-7 h-7 text-steel" />
            <p className="text-steel text-[11px] font-medium leading-snug">Not yet discovered</p>
          </div>
        )}

        {/* Mastered Badge */}
        {hazmon.isMastered && (
          <div className="absolute top-1.5 right-1.5 z-20">
            <Sparkles className="w-4 h-4 text-hazard" />
          </div>
        )}

        {/* Artwork Area */}
        <div
          className="relative flex-1 rounded-lg mb-2 flex items-center justify-center"
          style={{
            background: isLocked
              ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 100%)'
              : `linear-gradient(135deg, ${hazmon.primaryColor}22 0%, ${hazmon.secondaryColor}33 100%)`,
          }}
        >
          <div className="text-4xl">
            {isLocked ? <HelpCircle className="w-8 h-8 text-steel/60" /> : hazmon.iconEmoji}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-0.5">
          <h4 className={`font-display font-bold text-sm truncate ${isLocked ? 'text-paper' : rarityTextColor}`}>
            {isLocked ? '???' : hazmon.name}
          </h4>
          <p className={`text-xs truncate ${isLocked ? 'text-steel/60' : 'text-steel'}`}>
            {isLocked ? 'Scan to discover' : hazmon.subtitle}
          </p>

          {/* Power Level */}
          {!isLocked && (
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-3 rounded-full ${
                    i < hazmon.powerLevel ? rarityFillColor : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Times Encountered */}
          {!isLocked && hazmon.timesEncountered > 1 && (
            <div className="text-steel/70 text-[10px] mt-1">
              Encountered {hazmon.timesEncountered}x
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  const messages: Record<string, string> = {
    all: 'No Hazmons in the database yet.',
    collected: "You haven't collected any Hazmons yet. Scan your first chemical label to start your collection.",
    mastered: 'No Hazmons mastered yet. Complete a safety guide quiz to master a Hazmon.',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border-2 border-dashed border-white/10 rounded-xl p-12 text-center"
    >
      <div className="text-6xl mb-4">📦</div>
      <p className="text-steel text-lg max-w-sm mx-auto">{messages[filter]}</p>
    </motion.div>
  );
}
