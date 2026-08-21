'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hazmonService } from '@/lib/hazmonService';
import HazmonCardReveal from '@/components/HazmonCardReveal';
import { HazmonCard } from '@/types/hazmon';

export default function HazmonTestPage() {
  const [hazmon, setHazmon] = useState<HazmonCard | null>(null);
  const [isNew, setIsNew] = useState(false);
  const supabase = createClient();

  async function testFlammableScan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      const result = await hazmonService.processGHSScan({
        userId: user.id,
        ghsCategory: 'flammable',
        productName: 'Test Ethanol 95%',
        ghsFact: 'H225: Cairan dan uap sangat mudah terbakar.',
        safetyRecommendation: 'P210: Jauhkan dari panas/api. Gunakan sarung tangan nitrile.',
        safetyScore: 3,
      });

      setHazmon(result.hazmonCard);
      setIsNew(result.isNewDiscovery);
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error as Error).message);
    }
  }

  async function testCombination() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Scan 1: Flammable
    await hazmonService.processGHSScan({
      userId: user.id,
      ghsCategory: 'flammable',
      productName: 'Ethanol',
      ghsFact: 'H225: Highly flammable',
      safetyRecommendation: 'P210: Keep away from heat',
      safetyScore: 3,
    });

    // Scan 2: Oxidizing (should trigger alert!)
    const result = await hazmonService.processGHSScan({
      userId: user.id,
      ghsCategory: 'oxidizing',
      productName: 'Hydrogen Peroxide',
      ghsFact: 'H272: May intensify fire',
      safetyRecommendation: 'P220: Keep away from combustible materials',
      safetyScore: 4,
    });

    if (result.combinationAlert) {
      alert('⚠️ COMBINATION ALERT!\n\n' + result.combinationAlert.warningMessage);
    }

    setHazmon(result.hazmonCard);
    setIsNew(result.isNewDiscovery);
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-white text-3xl font-bold mb-2">🧪 Hazmon Test</h1>
        <p className="text-gray-400 mb-6">Test Hazmon system without real scanner</p>
        
        <div className="space-y-3">
          <button
            onClick={testFlammableScan}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-lg font-semibold text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div>
                <div className="font-bold">Test: Ignivore (Flammable)</div>
                <div className="text-sm text-orange-200">Simulate ethanol scan</div>
              </div>
            </div>
          </button>

          <button
            onClick={testCombination}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg font-semibold text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <div className="font-bold">Test: Dangerous Combination</div>
                <div className="text-sm text-red-200">Flammable + Oxidizing alert</div>
              </div>
            </div>
          </button>

          <a
            href="/worker/hazdex"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-semibold text-center"
          >
            🎴 View My Hazdex
          </a>

          <a
            href="/worker/dashboard"
            className="block w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-lg font-semibold text-center"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {hazmon && (
        <HazmonCardReveal
          hazmonCard={hazmon}
          isNew={isNew}
          onClose={() => setHazmon(null)}
          onViewSafety={() => alert('Safety detail page (to be implemented)')}
        />
      )}
    </div>
  );
}