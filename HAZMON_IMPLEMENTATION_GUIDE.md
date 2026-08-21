# Hazmon Collection System - Implementation Guide

## 🎴 Overview

The **Hazmon** (Hazard Monster) system is a gamification layer for ChemSafe that transforms GHS chemical hazard detection into a collectible card game experience. This makes chemical safety awareness engaging and memorable without compromising the accuracy of safety information.

---

## 🎯 Core Concept

**Every GHS pictogram = 1 unique Hazmon creature**

When users scan a chemical label:
1. AI detects the GHS pictogram
2. System "hatches" the corresponding Hazmon
3. User receives a collectible card with:
   - **Fictional elements**: Character name, artwork, element type, rarity
   - **Real safety data**: Actual product name, GHS hazard statements, PPE recommendations

This separation ensures gamification doesn't dilute real safety information.

---

## 📁 Files Created

### 1. Type Definitions
**`frontend/src/types/hazmon.ts`**
- Defines all Hazmon types and interfaces
- Contains master database of 9 Hazmons (one per GHS category)
- Includes dangerous chemical combination definitions
- Rarity system (common, uncommon, rare, epic)

### 2. UI Components

**`frontend/src/components/HazmonCardReveal.tsx`**
- Animated card reveal after successful scan
- Shows Hazmon character with real safety data
- "New Discovery" badge for first-time encounters
- "Mastered" badge for completed safety quizzes
- CTA to view full safety recommendations

**`frontend/src/components/HazdexGrid.tsx`**
- User's complete Hazmon collection display
- Grid layout with locked/unlocked states
- Filter by: All, Collected, Mastered
- Progress tracking and statistics
- Empty state with encouragement to scan

**`frontend/src/components/CombinationAlert.tsx`**
- Warning modal for dangerous chemical combinations
- Shows when user scans incompatible chemicals in same session
- Real safety procedures for handling combinations
- Severity levels: warning, danger, critical

**`frontend/src/components/GHSScannerWithHazmon.tsx`**
- Integration wrapper for existing GHSScanner
- Processes scan results through Hazmon service
- Orchestrates card reveals and combination alerts

### 3. Business Logic

**`frontend/src/lib/hazmonService.ts`**
- `processGHSScan()` - Main entry point for scan processing
- `getUserHazdex()` - Fetch user's collection
- `masterHazmon()` - Mark as mastered after quiz completion
- `getHazdexStats()` - Collection statistics
- `getHabitatMap()` - Geographic hazard heatmap data
- `checkCombinations()` - Detect dangerous chemical pairs

### 4. Database Schema

**`HAZMON_DATABASE_SCHEMA.sql`**

Three main tables:

1. **`hazdex_entries`** - User's Hazmon collection
   - One row per user per Hazmon type
   - Tracks first discovery, encounter count, mastery status

2. **`hazmon_scan_records`** - Individual scan instances
   - Links to hazdex entries
   - Stores real product data and safety info
   - Optional geolocation for habitat mapping

3. **`hazmon_fusion_alerts`** - Combination warnings log
   - Tracks when users were warned about dangerous combos
   - Useful for safety auditing

Includes RLS policies and helper functions.

### 5. Pages

**`frontend/src/app/worker/hazdex/page.tsx`**
- Full Hazdex collection viewer
- Statistics dashboard (completion %, mastered count, total scans)
- Achievement badges
- Recent discoveries showcase

---

## 🔄 Integration Flow

### Current Flow (Before Hazmon):
```
User scans label → AI detects GHS → Show results → Save to database
```

### New Flow (With Hazmon):
```
User scans label
  ↓
AI detects GHS pictogram
  ↓
Map to Hazmon type (e.g., Flame → Ignivore)
  ↓
Check if user already has this Hazmon
  ↓
Create/update hazdex_entry
  ↓
Create hazmon_scan_record with real product data
  ↓
Check for dangerous combinations (recent scans)
  ↓
Show HazmonCardReveal with animation
  ↓
(Optional) Show CombinationAlert if dangerous pair detected
  ↓
User can view full safety details or continue scanning
```

---

## 🎨 The 9 Hazmons

| GHS Category | Hazmon Name | Element | Rarity | Icon | Power Level |
|--------------|-------------|---------|--------|------|-------------|
| Flammable | **Ignivore** | Fire | Common | 🔥 | 3 |
| Oxidizing | **Oxidrax** | Plasma | Uncommon | ⚡ | 4 |
| Explosive | **Detonyx** | Blast | Rare | 💥 | 5 |
| Corrosive | **Corrolith** | Acid | Uncommon | 🧪 | 4 |
| Acute Toxic | **Venomask** | Toxin | Rare | ☠️ | 5 |
| Health Hazard | **Pulmonar** | Bio | Epic | 🫁 | 4 |
| Irritant | **Itchling** | Sting | Common | ⚠️ | 2 |
| Environment | **Aquabane** | Nature-corrupt | Rare | 🐟 | 3 |
| Compressed Gas | **Pressuron** | Pressure | Uncommon | 💨 | 3 |

**Rarity meanings:**
- **Common**: Frequently encountered in workplaces
- **Uncommon**: Less common but significant
- **Rare**: Specialized chemicals, extra caution needed
- **Epic**: Long-term health hazards, highest concern

---

## 🚀 Setup Instructions

### 1. Database Setup
```bash
# Apply the Hazmon schema to your Supabase database
psql $DATABASE_URL -f HAZMON_DATABASE_SCHEMA.sql
```

### 2. Update Your Existing GHS Scanner

Replace your current scanner implementation with the Hazmon-enabled version:

```tsx
// Before:
<GHSScanner onResult={handleScanResult} />

// After:
<GHSScannerWithHazmon 
  userId={currentUser.id}
  onScanComplete={(hazmon) => {
    console.log('New Hazmon discovered:', hazmon);
  }}
/>
```

### 3. Add Hazdex Navigation

In your worker dashboard navigation:

```tsx
<Link href="/worker/hazdex">
  <button className="...">
    🎴 My Hazdex
  </button>
</Link>
```

### 4. Integration with Existing Scan Flow

In your `backend/main.py` or scan processing logic, you'll need to:

1. After GHS detection, call the Hazmon service:
```python
# Python example (adapt to your backend)
hazmon_result = await create_hazmon_entry(
    user_id=user_id,
    ghs_category=detected_category,
    product_name=ocr_extracted_name,
    scan_id=scan_record_id
)
```

2. Return Hazmon data along with scan results to frontend

---

## 🎮 Unique Features

### 1. **Fusion Alerts** (Combination Detection)
Real chemical safety feature disguised as game mechanic:
- System tracks recent scans (within 1 hour window)
- Detects dangerous chemical combinations
- Shows urgent warning modal
- Examples:
  - Corrolith (corrosive) + Oxidrax (oxidizing) = CRITICAL
  - Ignivore (flammable) + Oxidrax (oxidizing) = CRITICAL
  - Venomask (toxic) + Corrolith (corrosive) = DANGER

### 2. **Habitat Map** (Geographic Heatmap)
- Clusters Hazmon discoveries by location
- Shows which hazard types concentrate where
- Useful for admin dashboard: "warehouse has high Ignivore density"
- Real safety insight from gamified data

### 3. **Mastery System** (Quiz Integration)
- Cards start "unmastered"
- User must complete safety quiz about that hazard type
- Quiz covers: proper PPE, storage, emergency response
- Mastered cards get gold border + bonus points
- Forces active learning, not passive collection

### 4. **Zero-Incident Streak**
- Track days since last high-danger scan without reported incident
- Combines with your existing PPE monitoring system
- Encourages proactive safety awareness

---

## 🎨 Visual Design Notes

### Card Layout (3:4 ratio)
```
┌─────────────────────────┐
│ [Rarity]      [GHS Icon]│ ← Header with gradient
│                          │
│    ┌──────────────┐     │
│    │  HAZMON ART  │     │ ← Character illustration
│    │   (emoji for │     │   (Use emoji now, custom 
│    │    now)      │     │    artwork later)
│    └──────────────┘     │
│                          │
│ IGNIVORE         🔥🔥🔥 │ ← Name + Power level
│ "Si Pemantik Liar"      │
│                          │
│ Ditemukan dari:          │
│ [Nama Produk Real]       │ ← REAL scan data
│                          │
│ ⚠ Fakta Bahaya:          │
│ [GHS Statement Real]     │ ← REAL hazard info
│                          │
│ [Lihat cara aman →]      │ ← CTA to safety guide
└─────────────────────────┘
```

### Color System
- **Fire (Ignivore)**: Red-orange gradient
- **Plasma (Oxidrax)**: Yellow-white gradient
- **Blast (Detonyx)**: Orange-black gradient
- **Acid (Corrolith)**: Green-moss gradient
- **Toxin (Venomask)**: Purple-dark gradient
- **Bio (Pulmonar)**: Gray-blue gradient
- **Sting (Itchling)**: Pale yellow gradient
- **Nature-corrupt (Aquabane)**: Murky blue-green
- **Pressure (Pressuron)**: Silver-cyan gradient

---

## 📊 Landing Page Copy (No Fake Stats!)

### Tagline
> **Scan. Kenali. Kumpulkan.**  
> Setiap label kimia yang lo scan bukan cuma dapet skor keamanan — tapi juga karakter Hazmon yang mewakili jenis bahayanya. Belajar GHS jadi kebiasaan, bukan tugas.

### How It Works Section
```markdown
## Hazmon: Belajar Safety Sambil Koleksi

1. **Scan Label Kimia**  
   Arahkan kamera ke pictogram GHS di label produk

2. **Temukan Hazmon**  
   Setiap bahaya punya karakter unik yang kamu unlock

3. **Pelajari Cara Aman**  
   Setiap Hazmon dilengkapi fakta bahaya real & rekomendasi APD

4. **Lengkapi Koleksi**  
   Kumpulkan semua 9 Hazmon sambil makin aware sama lingkungan kerja
```

### Features Grid
```
🎴 Collectible Cards  
Setiap GHS = 1 Hazmon unik

⚠️ Fusion Alerts  
Warning otomatis kalau scan 2 chemical berbahaya bersamaan

🗺️ Habitat Map  
Lihat area mana yang punya konsentrasi bahaya tinggi

⭐ Mastery System  
Jawab kuis untuk "master" Hazmon & buktikan lo paham
```

---

## 🔐 Data Integrity

**Strict separation of fiction and fact:**

✅ **Fictional (gamification layer):**
- Hazmon names (Ignivore, Oxidrax, etc.)
- Element types (Fire, Plasma, Acid)
- Rarity tiers
- Power level indicators
- Card artwork/styling

✅ **Factual (real safety data):**
- Product names (from OCR)
- GHS hazard statements (from official database)
- PPE recommendations (from safety standards)
- Chemical combination warnings (from compatibility charts)
- Safety scores (from AI analysis)

**Never mix these!** Users must always be able to distinguish game elements from real safety information.

---

## 🎯 Success Metrics

Track these to validate engagement:

1. **Collection Rate**: % of users who discover at least 3 Hazmons
2. **Mastery Rate**: % of collected Hazmons that get mastered
3. **Scan Frequency**: Increase in scans per user per week
4. **Combination Awareness**: % of users who acknowledge fusion alerts
5. **Return Rate**: Users returning to Hazdex view
6. **Safety Quiz Completion**: Conversion from card collection to quiz

---

## 🚧 Next Steps / Future Enhancements

### Phase 2 Ideas:

1. **Custom Artwork**
   - Replace emoji icons with original character illustrations
   - Hire illustrator or use Midjourney/DALL-E with consistent style
   - Ensure IP ownership (no Pokémon resemblance)

2. **Team Leaderboards**
   - Company-wide Hazdex completion rankings
   - Team vs team challenges
   - Monthly "Safety Champion" badges

3. **Evolution System**
   - Hazmons evolve after mastering + 10 encounters
   - Evolved forms have enhanced visual flair
   - Unlocks advanced safety tips

4. **Trading System** (controversial, needs safety audit)
   - Workers can "trade" mastered Hazmons
   - Encourages knowledge sharing
   - Risk: could incentivize unsafe behavior to find rare Hazmons
   - **Recommendation**: Skip this or make it cosmetic only

5. **AR Mode**
   - Use device camera to "place" Hazmons in real world
   - Instagram-worthy photos with safety mascots
   - Viral potential for brand awareness

6. **Hazmon Stories**
   - Short comic strips for each Hazmon
   - Educational + entertaining
   - Share on social media for recruitment

---

## ⚠️ Important Warnings

### 1. **Don't Gamify Danger Itself**
❌ BAD: "Collect rare Hazmons by finding dangerous chemicals!"  
✅ GOOD: "Complete your Hazdex by learning about different hazard types"

The goal is awareness, not risk-seeking behavior.

### 2. **Don't Use Fake Data**
Never show:
- "1000 users collected this Hazmon" (if you don't have real numbers)
- "Trending Hazmon this week" (if not backed by real scan data)
- Made-up chemical facts for dramatic effect

Credibility > Engagement

### 3. **IP Considerations**
- Current names (Ignivore, Oxidrax, etc.) are original
- Emoji placeholders are safe (Unicode standard)
- If adding custom artwork, ensure it's distinct from Pokémon/Digimon/Yu-Gi-Oh
- Consider trademarking "Hazmon" if this becomes core brand element

---

## 🧪 Testing Checklist

Before production deployment:

- [ ] Database schema applied without errors
- [ ] RLS policies tested for all user roles
- [ ] Hazmon cards render correctly on mobile
- [ ] Combination alerts trigger for known dangerous pairs
- [ ] Empty Hazdex state displays properly
- [ ] Mastery quiz integration works (if implemented)
- [ ] Real product names from OCR populate correctly
- [ ] No fictional data mixed with real safety info
- [ ] Animation performance tested on low-end devices
- [ ] Accessibility: screen readers can navigate Hazdex
- [ ] Translation-ready: all copy in localizable strings

---

## 📞 Support & Maintenance

**Updating Hazmon Data:**
- Edit `frontend/src/types/hazmon.ts` → `HAZMON_DATABASE` constant
- Rarity, colors, power levels can be tuned based on user feedback
- GHS facts should stay accurate (update if standards change)

**Adding New Combinations:**
- Edit `HAZARDOUS_COMBINATIONS` array in `hazmon.ts`
- Reference real chemical compatibility charts
- Consult with safety expert before adding

**Monitoring:**
- Track which Hazmons are most/least collected
- If one is never found, GHS detection might have issues
- If one is over-collected, might indicate actual workplace hazard concentration

---

## 📄 License & Attribution

This implementation is part of ChemSafe project.  
Hazmon concept © 2026 ChemSafe Team  
GHS pictogram detection uses open standards  
Chemical safety data sourced from official GHS guidelines

---

**Ready to deploy!** 🚀

This gamification layer makes chemical safety feel like an achievement, not a chore. Workers will scan more, learn more, and stay safer — all while having fun.

For questions or issues, refer to the inline code comments or contact the dev team.
