'use client';

import { useState } from 'react';
import GHSScanner from '@/components/GHSScanner';
import HazmonCardReveal from '@/components/HazmonCardReveal';
import CombinationAlert from '@/components/CombinationAlert';
import { hazmonService } from '@/lib/hazmonService';
import { HazmonCard, GHSCategory, CombinationAlert as CombinationAlertType } from '@/types/hazmon';
import { Detection } from '@/lib/onnx/inference';
import { useRouter } from 'next/navigation';

interface GHSScannerWithHazmonProps {
  userId: string;
  onScanComplete?: (hazmonCard: HazmonCard) => void;
}

/**
 * Wrapper component that integrates GHSScanner with Hazmon collection system
 */
export default function GHSScannerWithHazmon({
  userId,
  onScanComplete,
}: GHSScannerWithHazmonProps) {
  const router = useRouter();
  const [revealedHazmon, setRevealedHazmon] = useState<HazmonCard | null>(null);
  const [isNewDiscovery, setIsNewDiscovery] = useState(false);
  const [combinationAlert, setCombinationAlert] = useState<CombinationAlertType | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleScanResult = async (
    detections: Detection[],
    ocrText: string,
    ocrConfidence: number
  ) => {
    if (detections.length === 0) {
      return;
    }

    setProcessing(true);

    try {
      // Get the highest confidence detection
      const primaryDetection = detections.reduce((prev, current) =>
        current.confidence > prev.confidence ? current : prev
      );

      // Map detection class to GHS category
      const ghsCategory = mapDetectionToGHSCategory(primaryDetection.class);
      
      if (!ghsCategory) {
        console.error('Unknown GHS category:', primaryDetection.class);
        return;
      }

      // Extract product name from OCR (simplified - you may want better logic)
      const productName = extractProductName(ocrText) || 'Unknown Product';

      // Get GHS fact and safety recommendation from your existing logic
      // For now, using placeholder - integrate with your existing system
      const ghsFact = getGHSFact(ghsCategory);
      const safetyRecommendation = getSafetyRecommendation(ghsCategory);
      const safetyScore = calculateSafetyScore(primaryDetection.confidence, ghsCategory);

      // Process through Hazmon service
      const result = await hazmonService.processGHSScan({
        userId,
        ghsCategory,
        productName,
        ghsFact,
        safetyRecommendation,
        safetyScore,
        // Add scan ID if you have it from your existing scan table
        // scanId: existingScanId,
      });

      // Show Hazmon card reveal
      setRevealedHazmon(result.hazmonCard);
      setIsNewDiscovery(result.isNewDiscovery);

      // Check for dangerous combinations
      if (result.combinationAlert) {
        // Show combination alert after Hazmon reveal
        setTimeout(() => {
          setCombinationAlert(result.combinationAlert!);
        }, 2000);
      }

      // Callback
      if (onScanComplete) {
        onScanComplete(result.hazmonCard);
      }
    } catch (error) {
      console.error('Error processing Hazmon scan:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <GHSScanner onResult={handleScanResult} />

      {/* Hazmon Card Reveal */}
      {revealedHazmon && (
        <HazmonCardReveal
          hazmonCard={revealedHazmon}
          isNew={isNewDiscovery}
          onClose={() => {
            setRevealedHazmon(null);
            setIsNewDiscovery(false);
          }}
          onViewSafety={() => {
            // Navigate to safety details or show modal
            router.push(`/safety/${revealedHazmon.ghsCategory}`);
          }}
        />
      )}

      {/* Combination Alert */}
      {combinationAlert && (
        <CombinationAlert
          combination={combinationAlert}
          onClose={() => setCombinationAlert(null)}
          onViewProcedure={() => {
            // Navigate to detailed procedure
            router.push(`/safety/combinations/${combinationAlert.id}`);
          }}
        />
      )}
    </>
  );
}

// Helper functions (integrate with your existing logic)

function mapDetectionToGHSCategory(detectionClass: string): GHSCategory | null {
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

  return mapping[detectionClass] || null;
}

function extractProductName(ocrText: string): string | null {
  // Simple extraction - take first line that's not too short
  const lines = ocrText.split('\n').filter((line) => line.trim().length > 3);
  return lines[0]?.trim() || null;
}

function getGHSFact(category: GHSCategory): string {
  const facts: Record<GHSCategory, string> = {
    'flammable': 'A flammable material. It can ignite rapidly when exposed to a spark or heat source.',
    'oxidizing': 'An oxidizer that accelerates the combustion of other materials. Reacting it with flammable substances is especially dangerous.',
    'explosive': 'An explosive material that can detonate from fire, impact, friction, or heating. Highly sensitive to pressure.',
    'corrosive': 'Corrosive to metals and capable of causing serious chemical burns to skin and eyes.',
    'acute-toxic': 'An acute toxin that can cause death or severe poisoning even in small amounts if swallowed, inhaled, or absorbed through skin.',
    'health-hazard': 'A long-term health hazard including organ damage, cancer, reproductive harm, or respiratory sensitization.',
    'irritant': 'An irritant that can cause skin, eye, or respiratory irritation. Not acutely toxic, but still hazardous.',
    'environment': 'Hazardous to aquatic life and ecosystems. Can cause long-term damage to aquatic environments.',
    'compressed-gas': 'A compressed gas that can rupture or explode if heated. The cylinder can become a dangerous projectile if damaged.',
  };
  return facts[category];
}

function getSafetyRecommendation(category: GHSCategory): string {
  const recommendations: Record<GHSCategory, string> = {
    'flammable': 'Keep away from heat, sparks, open flames, and hot surfaces. Use in a well-ventilated area. PPE: nitrile gloves, safety goggles.',
    'oxidizing': 'Store separately from flammable materials. Use in a ventilated area. PPE: chemical gloves, safety goggles, lab coat.',
    'explosive': 'Avoid impact, friction, and sparks. Store in a cool, dry place. Only trained personnel should handle this material.',
    'corrosive': 'Avoid contact with skin and eyes. Use inside a fume hood. PPE: neoprene gloves, face shield, acid-resistant lab coat.',
    'acute-toxic': 'Avoid inhalation, ingestion, or skin contact. Use inside a fume hood. PPE: respirator, double nitrile gloves, lab coat.',
    'health-hazard': 'Avoid repeated exposure. Use inside a well-ventilated fume hood. PPE: P100 respirator, gloves, lab coat.',
    'irritant': 'Avoid skin and eye contact. Wash hands thoroughly after use. PPE: nitrile gloves, safety goggles.',
    'environment': "Never discharge into the environment. Contain spills immediately. Dispose of according to hazardous-waste regulations. Avoid soil or water contamination.",
    'compressed-gas': 'Secure the cylinder with a chain. Keep away from excess heat. Open the valve slowly. PPE: safety goggles, gloves when handling.',
  };
  return recommendations[category];
}

function calculateSafetyScore(confidence: number, category: GHSCategory): number {
  // Base danger level by category
  const baseDanger: Record<GHSCategory, number> = {
    'explosive': 5,
    'acute-toxic': 5,
    'health-hazard': 4,
    'corrosive': 4,
    'oxidizing': 4,
    'flammable': 3,
    'compressed-gas': 3,
    'environment': 3,
    'irritant': 2,
  };

  return baseDanger[category] || 3;
}
