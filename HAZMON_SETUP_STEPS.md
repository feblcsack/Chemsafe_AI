# 🎴 Hazmon Setup - Langkah demi Langkah

## ✅ Checklist Setup

### Step 1: Database Setup (5 menit)

**Di Supabase Dashboard:**

1. Buka project Supabase kamu
2. Klik menu **"SQL Editor"** di sidebar kiri
3. Klik **"New query"**
4. Copy-paste **seluruh isi** file `HAZMON_SETUP_FIXED.sql`
5. Klik **"Run"**
6. Tunggu sampai selesai (harusnya muncul verification result di bawah)
7. ✅ Selesai! Database siap.

**Verification:**
Query terakhir di SQL file akan show tabel kosong:
```
hazdex_entries: 0 rows
hazmon_scan_records: 0 rows
hazmon_fusion_alerts: 0 rows
```

Ini normal karena belum ada user yang scan.

---

### Step 2: Install Dependencies (jika belum ada)

```bash
cd frontend

# Check apakah Framer Motion sudah installed
npm list framer-motion

# Kalau belum ada, install:
npm install framer-motion

# Check lucide-react (harusnya udah ada)
npm list lucide-react
```

---

### Step 3: Test Import (2 menit)

Buka file test sederhana untuk pastikan types bisa di-import:

```bash
# Di terminal, test TypeScript compilation
cd frontend
npx tsc --noEmit
```

Kalau ada error tentang `@/types/hazmon`, berarti path mapping belum bener.

**Fix jika ada error:**
Check `tsconfig.json` ada:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### Step 4: Tambah Route ke Hazdex (3 menit)

**Edit:** `frontend/src/app/worker/dashboard/page.tsx`

Cari bagian navigation cards, tambahkan button Hazdex:

```tsx
{/* Tambahkan ini di dashboard cards */}
<button
  onClick={() => router.push('/worker/hazdex')}
  className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl p-6 text-left transition-all hover:scale-105 shadow-lg"
>
  <div className="text-white text-4xl mb-3">🎴</div>
  <h3 className="text-white text-xl font-bold mb-2">My Hazdex</h3>
  <p className="text-purple-200 text-sm">
    Koleksi Hazmon dari scan GHS
  </p>
</button>
```

---

### Step 5: Test Hazdex Page (2 menit)

```bash
cd frontend
npm run dev
```

1. Login sebagai worker
2. Buka browser: `http://localhost:3000/worker/hazdex`
3. Harusnya muncul empty state:
   ```
   📦 Hazdex-mu masih kosong
   Scan label GHS pertamamu untuk mulai koleksi
   ```

✅ Kalau muncul ini, berarti UI component berfungsi!

---

### Step 6: Integrate dengan Scanner (PILIH SALAH SATU)

#### **Option A: Quick Test (Paling Cepat)**

Buat file test page untuk coba Hazmon tanpa ubah scanner existing:

**Buat:** `frontend/src/app/worker/hazmon-test/page.tsx`

```tsx
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

  async function testScan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Simulate scan result
    const result = await hazmonService.processGHSScan({
      userId: user.id,
      ghsCategory: 'flammable', // Test dengan Ignivore
      productName: 'Test Ethanol 95%',
      ghsFact: 'H225: Cairan dan uap sangat mudah terbakar.',
      safetyRecommendation: 'P210: Jauhkan dari panas/api. Gunakan sarung tangan nitrile.',
      safetyScore: 3,
    });

    setHazmon(result.hazmonCard);
    setIsNew(result.isNewDiscovery);
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <h1 className="text-white text-3xl font-bold mb-4">Hazmon Test</h1>
      
      <button
        onClick={testScan}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
      >
        🧪 Simulate Flammable Scan
      </button>

      {hazmon && (
        <HazmonCardReveal
          hazmonCard={hazmon}
          isNew={isNew}
          onClose={() => setHazmon(null)}
          onViewSafety={() => alert('Safety detail page')}
        />
      )}
    </div>
  );
}
```

**Test:**
1. Buka `http://localhost:3000/worker/hazmon-test`
2. Klik tombol "Simulate Flammable Scan"
3. Harusnya muncul card Ignivore dengan animasi!
4. Close card
5. Buka `/worker/hazdex` - harusnya Ignivore sudah masuk koleksi

✅ Kalau berhasil, berarti sistem berfungsi sempurna!

#### **Option B: Full Integration (Lebih Lama)**

Kalau mau langsung integrate ke scanner real, ikuti `HAZMON_QUICK_INTEGRATION.md`.

---

### Step 7: Test Combination Alert (Optional)

Di test page tadi, tambahkan button kedua:

```tsx
<button
  onClick={async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Scan 1: Flammable (Ignivore)
    await hazmonService.processGHSScan({
      userId: user.id,
      ghsCategory: 'flammable',
      productName: 'Ethanol',
      ghsFact: 'H225: Highly flammable',
      safetyRecommendation: 'P210: Keep away from heat',
      safetyScore: 3,
    });

    // Scan 2: Oxidizing (Oxidrax) - harusnya trigger alert!
    const result = await hazmonService.processGHSScan({
      userId: user.id,
      ghsCategory: 'oxidizing',
      productName: 'Hydrogen Peroxide',
      ghsFact: 'H272: May intensify fire',
      safetyRecommendation: 'P220: Keep away from combustible materials',
      safetyScore: 4,
    });

    if (result.combinationAlert) {
      alert('Combination Alert Detected! ' + result.combinationAlert.warningMessage);
    }
  }}
  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold ml-4"
>
  ⚠️ Test Dangerous Combination
</button>
```

---

## 🎯 Quick Troubleshooting

### Error: "Cannot find module '@/types/hazmon'"

**Fix:**
```bash
# Check file exists
ls frontend/src/types/hazmon.ts

# If not exists, file might be in wrong location
# It should be at: frontend/src/types/hazmon.ts
```

### Error: "Cannot find module '@/lib/hazmonService'"

**Fix:**
```bash
# Check file exists
ls frontend/src/lib/hazmonService.ts

# Restart dev server
npm run dev
```

### Error: "createClient is not a function"

**Fix:**
Check `frontend/src/lib/supabase/client.ts` exists and exports:
```typescript
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Card tidak muncul setelah scan

**Debug:**
```typescript
// Add console.log di test page
const result = await hazmonService.processGHSScan({...});
console.log('Hazmon result:', result);
console.log('Card data:', result.hazmonCard);
console.log('Is new?:', result.isNewDiscovery);
```

Check di browser console apakah ada error.

### Database error saat processGHSScan

**Check Supabase logs:**
1. Buka Supabase Dashboard
2. Klik "Logs" > "Postgres Logs"
3. Cari error message
4. Biasanya RLS policy issue - pastikan user authenticated

---

## 🎮 What to Test

### ✅ Basic Flow
- [ ] Database tables created
- [ ] Hazdex page loads (empty state)
- [ ] Test scan creates Hazmon
- [ ] Card reveals with animation
- [ ] Hazmon appears in collection
- [ ] Second scan increases counter (not duplicate)

### ✅ Edge Cases
- [ ] Scan same GHS type 2x (should update, not duplicate)
- [ ] Check stats accuracy in Hazdex
- [ ] Test with different GHS types
- [ ] Combination alert triggers correctly

### ✅ Mobile
- [ ] Card responsive on mobile screen
- [ ] Animation smooth on low-end device
- [ ] Touch interactions work

---

## 📊 Verify Database

Check di Supabase SQL Editor:

```sql
-- Check user's collection
SELECT 
  he.hazmon_id,
  he.times_encountered,
  he.is_mastered,
  COUNT(sr.id) as scan_count
FROM hazdex_entries he
LEFT JOIN hazmon_scan_records sr ON sr.hazdex_entry_id = he.id
WHERE he.user_id = 'YOUR_USER_ID_HERE'
GROUP BY he.id, he.hazmon_id, he.times_encountered, he.is_mastered;

-- Check recent scans
SELECT 
  product_name,
  ghs_category,
  safety_score,
  scanned_at
FROM hazmon_scan_records
ORDER BY scanned_at DESC
LIMIT 10;
```

---

## 🚀 Ready to Go!

Kalau semua steps di atas berhasil:

1. ✅ Database setup
2. ✅ Components render
3. ✅ Test scan berfungsi
4. ✅ Collection updates

**Next:**
- Integrate ke scanner real kamu
- Atau langsung deploy test page untuk demo!

---

## 💡 Tips

1. **Start dengan test page dulu** - jangan langsung integrate ke scanner production
2. **Test di incognito** - pastikan bukan cache browser
3. **Check Supabase logs** - kalau ada error database
4. **Gunakan console.log liberally** - track data flow
5. **Test combination alert** - ini fitur safety killer

---

## 📞 Need Help?

Check file-file ini:
- `HAZMON_IMPLEMENTATION_GUIDE.md` - Full documentation
- `HAZMON_QUICK_INTEGRATION.md` - Integration steps
- `HAZMON_SUMMARY.md` - Feature overview

Atau debug dengan:
```typescript
// Add to hazmonService.ts processGHSScan()
console.log('Processing scan:', params);
console.log('Hazmon data:', hazmonData);
console.log('Existing entry:', existingEntry);
console.log('Result:', { hazmonCard, isNewDiscovery });
```

Good luck! 🎴✨
