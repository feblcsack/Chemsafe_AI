# Hazmon Quick Integration Guide

## 🚀 Add Hazmon to Your Existing Worker Dashboard in 3 Steps

### Step 1: Apply Database Schema (5 minutes)

```bash
# If using Supabase CLI
supabase db push HAZMON_DATABASE_SCHEMA.sql

# Or via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of HAZMON_DATABASE_SCHEMA.sql
# 3. Run
```

### Step 2: Update Worker Dashboard Navigation (2 minutes)

In your `frontend/src/app/worker/dashboard/page.tsx`, add a Hazdex button:

```tsx
// Add this import at the top
import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';

// Inside your dashboard component, add this navigation card:
<button
  onClick={() => router.push('/worker/hazdex')}
  className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl p-6 text-left transition-all hover:scale-105 shadow-lg"
>
  <div className="flex items-center justify-between mb-4">
    <div className="text-white text-4xl">🎴</div>
    <Trophy className="w-6 h-6 text-yellow-300" />
  </div>
  <h3 className="text-white text-xl font-bold mb-2">My Hazdex</h3>
  <p className="text-purple-200 text-sm">
    Lihat koleksi Hazmon dari scan GHS kamu
  </p>
  
  {/* Optional: Show live stats */}
  {hazdexStats && (
    <div className="mt-4 flex gap-4 text-xs">
      <div className="text-white">
        <span className="font-bold">{hazdexStats.totalCollected}/9</span> Collected
      </div>
      <div className="text-yellow-300">
        <span className="font-bold">{hazdexStats.masteredCount}</span> Mastered
      </div>
    </div>
  )}
</button>
```

### Step 3: Update Your Scan Flow (10 minutes)

#### Option A: Minimal Integration (Recommended for Quick Start)

Replace your existing GHSScanner with the Hazmon-enabled version:

```tsx
// In your scan page (e.g., frontend/src/app/worker/scan/page.tsx)

// OLD:
import GHSScanner from '@/components/GHSScanner';

<GHSScanner onResult={handleScanResult} />

// NEW:
import GHSScannerWithHazmon from '@/components/GHSScannerWithHazmon';

<GHSScannerWithHazmon 
  userId={user.id}
  onScanComplete={(hazmon) => {
    // Optional: show toast notification
    toast.success(`${hazmon.name} ditemukan! 🎴`);
  }}
/>
```

#### Option B: Custom Integration (More Control)

If you want to keep your existing scan flow and add Hazmon manually:

```tsx
import { hazmonService } from '@/lib/hazmonService';
import { useState } from 'react';
import HazmonCardReveal from '@/components/HazmonCardReveal';

// Inside your scan component:
const [hazmonCard, setHazmonCard] = useState<HazmonCard | null>(null);
const [isNewDiscovery, setIsNewDiscovery] = useState(false);

// After your existing GHS detection logic:
async function handleGHSDetection(detection: Detection, ocrText: string) {
  // Your existing scan logic here...
  
  // Then add Hazmon processing:
  try {
    const result = await hazmonService.processGHSScan({
      userId: currentUser.id,
      ghsCategory: mapToGHSCategory(detection.label),
      productName: extractProductName(ocrText),
      ghsFact: getGHSFact(detection.label),
      safetyRecommendation: getSafetyRec(detection.label),
      safetyScore: calculateScore(detection.confidence),
      scanId: savedScan.id, // Your existing scan record ID
    });
    
    setHazmonCard(result.hazmonCard);
    setIsNewDiscovery(result.isNewDiscovery);
    
    // Handle combination alert if exists
    if (result.combinationAlert) {
      // Show warning modal or toast
    }
  } catch (error) {
    console.error('Hazmon processing error:', error);
    // Non-critical error - continue with normal scan flow
  }
}

// Add to your JSX:
{hazmonCard && (
  <HazmonCardReveal
    hazmonCard={hazmonCard}
    isNew={isNewDiscovery}
    onClose={() => setHazmonCard(null)}
    onViewSafety={() => {
      // Your existing safety detail logic
    }}
  />
)}
```

---

## 🎯 Helper Functions You'll Need

### Map AI Detection to GHS Category

```typescript
// Add to your scan processing file
import { GHSCategory } from '@/types/hazmon';

function mapToGHSCategory(detectionLabel: string): GHSCategory {
  const mapping: Record<string, GHSCategory> = {
    'flame': 'flammable',
    'flammable': 'flammable',
    'oxidizing': 'oxidizing',
    'oxidizer': 'oxidizing',
    'exploding_bomb': 'explosive',
    'explosive': 'explosive',
    'corrosion': 'corrosive',
    'corrosive': 'corrosive',
    'skull_crossbones': 'acute-toxic',
    'toxic': 'acute-toxic',
    'health_hazard': 'health-hazard',
    'silhouette': 'health-hazard',
    'exclamation': 'irritant',
    'irritant': 'irritant',
    'environment': 'environment',
    'aquatic_pollutant': 'environment',
    'gas_cylinder': 'compressed-gas',
    'compressed_gas': 'compressed-gas',
  };
  
  const normalized = detectionLabel.toLowerCase().replace(/[^a-z_]/g, '');
  return mapping[normalized] || 'irritant'; // fallback to least severe
}
```

### Get GHS Facts (Real Data)

```typescript
function getGHSFact(category: GHSCategory): string {
  // These are real GHS hazard statements
  const facts: Record<GHSCategory, string> = {
    'flammable': 'H225: Cairan dan uap sangat mudah terbakar. Dapat menyebabkan kebakaran jika terkena panas, percikan, atau api.',
    'oxidizing': 'H272: Dapat mempercepat atau menyebabkan kebakaran. Oksidator kuat dapat bereaksi hebat dengan bahan organik.',
    'explosive': 'H201: Bahan peledak tidak stabil. Sensitif terhadap benturan, gesekan, api, atau pemanasan.',
    'corrosive': 'H314: Menyebabkan luka bakar kulit parah dan kerusakan mata. Korosif pada logam.',
    'acute-toxic': 'H300: Fatal jika tertelan. H310: Fatal jika terkena kulit. H330: Fatal jika terhirup.',
    'health-hazard': 'H350: Dapat menyebabkan kanker. H360: Dapat merusak kesuburan atau janin. H370: Menyebabkan kerusakan organ.',
    'irritant': 'H315: Menyebabkan iritasi kulit. H319: Menyebabkan iritasi mata parah. H335: Dapat menyebabkan iritasi saluran pernapasan.',
    'environment': 'H400: Sangat beracun bagi kehidupan akuatik. H410: Sangat beracun bagi kehidupan akuatik dengan efek jangka panjang.',
    'compressed-gas': 'H280: Mengandung gas di bawah tekanan. Dapat meledak jika dipanaskan. H281: Mengandung gas dingin.',
  };
  return facts[category];
}
```

### Get Safety Recommendations (Real PPE)

```typescript
function getSafetyRecommendation(category: GHSCategory): string {
  // Real PPE and handling recommendations
  const recommendations: Record<GHSCategory, string> = {
    'flammable': 'P210: Jauhkan dari panas/percikan/api. P233: Simpan dalam wadah tertutup rapat. P243: Gunakan peralatan anti-percikan. APD: Sarung tangan nitrile, kacamata safety, jas lab tahan api.',
    'oxidizing': 'P220: Jauhkan dari pakaian dan bahan mudah terbakar. P283: Gunakan pakaian pelindung tahan api. APD: Sarung tangan neoprene, face shield, jas lab.',
    'explosive': 'P250: Hindari gesekan, benturan, dan guncangan. P280: Gunakan sarung tangan/pakaian/pelindung mata/wajah. Hanya personel terlatih yang boleh menangani.',
    'corrosive': 'P260: Jangan hirup uap/kabut. P280: Gunakan sarung tangan/pakaian pelindung/pelindung mata/wajah. P301+P330+P331: JIKA TERTELAN: Bilas mulut, jangan paksakan muntah. APD: Sarung tangan neoprene, face shield, apron tahan asam.',
    'acute-toxic': 'P264: Cuci tangan menyeluruh setelah penanganan. P270: Jangan makan/minum/merokok saat menggunakan. P271: Gunakan hanya di luar ruangan atau di area berventilasi baik. APD: Respirator full-face, sarung tangan nitrile ganda, jas lab.',
    'health-hazard': 'P201: Dapatkan instruksi khusus sebelum digunakan. P281: Gunakan APD sesuai persyaratan. P308+P313: Jika terpajan: Hubungi dokter. APD: Respirator P100, sarung tangan, jas lab, bekerja dalam fume hood.',
    'irritant': 'P264: Cuci tangan menyeluruh setelah penanganan. P280: Gunakan sarung tangan/pelindung mata. P302+P352: Jika terkena kulit: Cuci dengan banyak air. APD: Sarung tangan nitrile, kacamata safety.',
    'environment': 'P273: Hindari pelepasan ke lingkungan. P391: Kumpulkan tumpahan. P501: Buang sesuai regulasi limbah B3. Jangan buang ke saluran air atau tanah.',
    'compressed-gas': 'P410+P403: Lindungi dari sinar matahari. Simpan di tempat berventilasi baik. P410: Lindungi dari panas. APD: Kacamata safety, sarung tangan saat menangani tabung.',
  };
  return recommendations[category];
}
```

---

## 📱 Add to Mobile App (If Applicable)

If you have a React Native or mobile version:

1. The same TypeScript types work cross-platform
2. Use React Native Animated instead of Framer Motion
3. Database calls remain the same (Supabase JS client works on mobile)
4. Adjust card layout for smaller screens (consider vertical card layout)

---

## 🧪 Test Your Integration

### Manual Test Checklist:

1. **First Scan Test**
   - [ ] Scan a GHS label
   - [ ] Hazmon card appears with animation
   - [ ] "NEW DISCOVERY" badge shows
   - [ ] Card shows correct product name from OCR
   - [ ] Real GHS fact displays
   - [ ] Safety recommendation is accurate
   - [ ] "Lihat cara aman" button works

2. **Repeat Scan Test**
   - [ ] Scan the same GHS type again
   - [ ] Card shows "Ditemui 2x" counter
   - [ ] No "NEW DISCOVERY" badge this time
   - [ ] Database entry updated (not duplicated)

3. **Collection Test**
   - [ ] Navigate to `/worker/hazdex`
   - [ ] See collected Hazmon in grid
   - [ ] Locked Hazmons show "???" state
   - [ ] Click collected card → detail view opens
   - [ ] Stats are accurate (X/9 collected)

4. **Combination Test**
   - [ ] Scan a flammable product (Ignivore)
   - [ ] Within 1 hour, scan an oxidizing product (Oxidrax)
   - [ ] Combination alert modal appears
   - [ ] Warning message is appropriate
   - [ ] Safe procedure displays

### Automated Test (Optional):

```typescript
// tests/hazmon.test.ts
import { hazmonService } from '@/lib/hazmonService';

describe('Hazmon Service', () => {
  it('should create new Hazmon on first scan', async () => {
    const result = await hazmonService.processGHSScan({
      userId: 'test-user-id',
      ghsCategory: 'flammable',
      productName: 'Test Ethanol',
      ghsFact: 'H225: Highly flammable liquid and vapor',
      safetyRecommendation: 'P210: Keep away from heat',
      safetyScore: 3,
    });
    
    expect(result.isNewDiscovery).toBe(true);
    expect(result.hazmonCard.name).toBe('Ignivore');
  });
  
  it('should detect dangerous combinations', async () => {
    // Scan flammable
    await hazmonService.processGHSScan({
      userId: 'test-user-id',
      ghsCategory: 'flammable',
      // ...
    });
    
    // Scan oxidizing (should trigger alert)
    const result = await hazmonService.processGHSScan({
      userId: 'test-user-id',
      ghsCategory: 'oxidizing',
      // ...
    });
    
    expect(result.combinationAlert).toBeDefined();
    expect(result.combinationAlert?.severity).toBe('critical');
  });
});
```

---

## 🎨 Optional: Add Hazdex Preview to Dashboard

Show a mini Hazdex preview on the main dashboard:

```tsx
// In your worker dashboard page
import { hazmonService } from '@/lib/hazmonService';
import { useEffect, useState } from 'react';

export default function WorkerDashboard() {
  const [hazdexStats, setHazdexStats] = useState<any>(null);
  
  useEffect(() => {
    async function loadStats() {
      const stats = await hazmonService.getHazdexStats(user.id);
      setHazdexStats(stats);
    }
    loadStats();
  }, []);
  
  return (
    <div className="dashboard-container">
      {/* Your existing dashboard content */}
      
      {/* Add this Hazdex preview card */}
      {hazdexStats && (
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-bold">🎴 Hazdex Progress</h3>
            <button
              onClick={() => router.push('/worker/hazdex')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              View All →
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {hazdexStats.totalCollected}/9
              </div>
              <div className="text-xs text-gray-400">Collected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {hazdexStats.masteredCount}
              </div>
              <div className="text-xs text-gray-400">Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {hazdexStats.completionPercent}%
              </div>
              <div className="text-xs text-gray-400">Complete</div>
            </div>
          </div>
          
          {/* Recent discoveries */}
          <div className="flex gap-2 overflow-x-auto">
            {hazdexStats.recentDiscoveries.map((hazmon: any) => (
              <div
                key={hazmon.id}
                className="flex-shrink-0 w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-2xl"
              >
                {hazmon.iconEmoji}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: "Hazmon card doesn't show after scan"

**Check:**
1. Is `userId` prop correctly passed?
2. Is the detection label mapping correct? (Add console.log to `mapToGHSCategory`)
3. Database connection working? (Check Supabase logs)
4. RLS policies applied? (Test with Supabase SQL editor)

### Issue: "Same Hazmon shows as new every time"

**Cause:** Database entry not being created or user_id mismatch

**Fix:**
```typescript
// Verify user ID matches between scan and database
console.log('Current user:', user.id);
console.log('Scan userId:', scanUserId);
// They must be identical
```

### Issue: "Combination alerts not triggering"

**Check:**
1. Are both scans within 1 hour window?
2. Are the Hazmon IDs in `HAZARDOUS_COMBINATIONS` array?
3. Check database table `hazmon_fusion_alerts` for logged entries

### Issue: "Performance slow on mobile"

**Optimize:**
1. Reduce animation duration in `HazmonCardReveal.tsx`
2. Use `will-change: transform` CSS hint
3. Lazy load Hazdex grid (paginate if >100 entries)
4. Consider using React.memo for card components

---

## 📊 Analytics to Track

Add these events to your analytics (Mixpanel/Amplitude/etc.):

```typescript
// Example with Mixpanel
import mixpanel from 'mixpanel-browser';

// When Hazmon discovered
mixpanel.track('Hazmon Discovered', {
  hazmon_id: hazmon.id,
  hazmon_name: hazmon.name,
  is_new_discovery: isNewDiscovery,
  user_completion_percent: completionPercent,
});

// When collection viewed
mixpanel.track('Hazdex Viewed', {
  total_collected: collectedCount,
  mastered_count: masteredCount,
});

// When combination alert shown
mixpanel.track('Combination Alert Shown', {
  hazmon_1: combo.hazmon1.id,
  hazmon_2: combo.hazmon2.id,
  severity: combo.severity,
});
```

**Key metrics to monitor:**
- Average time to first Hazmon (onboarding effectiveness)
- % of users who collect 3+ Hazmons (engagement)
- Combination alert acknowledgment rate (safety compliance)
- Hazdex page return visits (retention)

---

## ✅ You're Done!

Your ChemSafe app now has:
- ✅ Gamified GHS detection
- ✅ Collectible Hazmon cards
- ✅ Real-time combination warnings
- ✅ User progress tracking
- ✅ Engagement incentives

**Next:** Test with real users and gather feedback on which Hazmons resonate most!
