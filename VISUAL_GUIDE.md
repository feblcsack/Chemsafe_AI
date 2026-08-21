# ChemSafe UI/UX Visual Guide 🎨

## Preview URL
```
http://localhost:3000
```

---

## 🏠 Landing Page (/)

### Hero Section
```
┌─────────────────────────────────────────────┐
│  [C] ChemSafe                 [Navbar]      │
├─────────────────────────────────────────────┤
│                                             │
│     🎯 AI-Powered Chemical Safety           │
│                                             │
│   Recognize chemical hazards                │
│   the instant your camera sees them         │
│                                             │
│   [Start Scanning Free] [Workplace Safety]  │
│                                             │
│   ┌──────────────┐  ┌──────────────┐       │
│   │ 🔍 Household │  │ 🛡️ Workplace │       │
│   │   Scanner    │  │ Safety Suite │       │
│   └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────┘
```

### Features Section (6 cards)
- 👁️ Real-time Detection
- 🔒 Privacy First  
- ⚡ Lightning Fast
- 🛡️ Workplace Safety
- 🌍 Works Everywhere
- 🏆 Gamified Learning

### Hazmon Collection Section
```
┌─────────────────────────────────────────────┐
│  🏆 Collect Hazmons, Master Chemical Safety │
│                                             │
│  [🔥]  [⚡]  [💥]  [🧪]  [☠️]              │
│  Igni  Oxi  Deto  Corro  Veno              │
│  vore  drax nyx   lith   mask              │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │1. Scan  │  │2. Unlock│  │3. Learn │    │
│  │  Label  │  │  Hazmon │  │  Safety │    │
│  └─────────┘  └─────────┘  └─────────┘    │
└─────────────────────────────────────────────┘
```

---

## 📱 Navbar

### Desktop View
```
┌────────────────────────────────────────────┐
│ [C] ChemSafe  [Home][Scanner][Hazdex][Login]│
└────────────────────────────────────────────┘
```

### Mobile View (Collapsed)
```
┌────────────────────────────────────────────┐
│ [C] ChemSafe                      [☰]      │
└────────────────────────────────────────────┘
```

### Mobile View (Expanded)
```
┌────────────────────────────────────────────┐
│ [C] ChemSafe                      [✕]      │
├────────────────────────────────────────────┤
│  🏠 Home                                   │
│  🔍 Scanner                                │
│  🏆 Hazdex                                 │
│  ───────────────────────────────           │
│  [🛡️ Workplace Login]                     │
└────────────────────────────────────────────┘
```

---

## 🔍 Scanner Page (/scan)

### Before Scan
```
┌─────────────────────────────────────────────┐
│  [← Back to Home]                           │
│                                             │
│  ✨ AI-Enhanced Analysis                    │
│  Household Chemical Safety Scanner          │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🎴 My Hazdex Collection             │   │
│  │ 3/9 Hazmons • 33% Complete   🏆     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────┐ ┌─────────────┐          │
│  │ 🏠 Safe     │ │ ⚠️ Never    │          │
│  │   Storage   │ │   Mix These │          │
│  │   Tips      │ │   Products  │          │
│  └─────────────┘ └─────────────┘          │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │    📷 CAMERA VIEW                   │   │
│  │                                     │   │
│  │    [Scan] [Capture]                 │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### After Detection (Card Reveal)
```
┌─────────────────────────────────────────────┐
│         ✨ NEW HAZMON DISCOVERED! ✨        │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ ╔══════════════════════════════════╗ │  │
│  │ ║ EPIC        🔥        [Master] ✕ ║ │  │
│  │ ╠══════════════════════════════════╣ │  │
│  │ ║                                  ║ │  │
│  │ ║            🔥 (floating)         ║ │  │
│  │ ║                                  ║ │  │
│  │ ║           IGNIVORE               ║ │  │
│  │ ║      "The Flame Devourer"        ║ │  │
│  │ ║                                  ║ │  │
│  │ ║   Power: ●●●○○                   ║ │  │
│  │ ║                                  ║ │  │
│  │ ║ 🛡️ From: Gasoline Can            ║ │  │
│  │ ║                                  ║ │  │
│  │ ║ ⚠️ Hazard Info:                  ║ │  │
│  │ ║ Bahan mudah terbakar...          ║ │  │
│  │ ║                                  ║ │  │
│  │ ║ [🛡️ View Complete Safety Guide] ║ │  │
│  │ ║ Continue Scanning                ║ │  │
│  │ ╚══════════════════════════════════╝ │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🏆 Hazdex Page (/hazdex)

### Collection Grid
```
┌─────────────────────────────────────────────┐
│  My Hazmon Collection                       │
│  3/9 Collected • 33% Complete               │
│                                             │
│  [All] [Collected] [Locked]                 │
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 🔥  │ │ ⚡  │ │ ??? │ │ ??? │           │
│  │Igni │ │Oxi  │ │ ??? │ │ ??? │           │
│  │vore │ │drax │ │     │ │     │           │
│  │✓    │ │✓    │ │ 🔒  │ │ 🔒  │           │
│  └─────┘ └─────┘ └─────┘ └─────┘           │
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 🧪  │ │ ??? │ │ ??? │ │ ??? │           │
│  │Corro│ │ ??? │ │ ??? │ │ ??? │           │
│  │lith │ │     │ │     │ │     │           │
│  │✓    │ │ 🔒  │ │ 🔒  │ │ 🔒  │           │
│  └─────┘ └─────┘ └─────┘ └─────┘           │
│                                             │
│  [← Back to Scanner]                        │
└─────────────────────────────────────────────┘
```

---

## 🎨 Color Palette

### Primary Colors
- **Hazard Yellow:** `#F2B707` - Warnings, CTAs, new discoveries
- **Safe Green:** `#2ECC71` - Success, safety actions
- **Corrosive Red:** `#E74C3C` - Danger, critical alerts

### Neutral Colors
- **Ink (Background):** `#0F1419` - Main background
- **Paper (Text):** `#E8EAED` - Primary text
- **Steel (Muted):** `#8C959F` - Secondary text, borders

### Rarity Colors
- **Common:** Steel gray
- **Uncommon:** Safe green
- **Rare:** Blue-cyan gradient
- **Epic:** Hazard yellow gradient

---

## ✨ Animation Details

### Card Reveal Sequence (0.8s total)
1. **0.0s:** Backdrop fade in
2. **0.1s:** Card 3D flip starts (rotateY: -180° → 0°)
3. **0.4s:** "NEW HAZMON DISCOVERED" badge bounces in
4. **0.5s:** Character emoji floats
5. **0.6s:** Power level dots animate one by one
6. **0.8s:** All interactive (can close/view safety)

### Navbar Transitions
- **Slide down:** 0.3s ease-out
- **Mobile menu expand:** 0.2s height auto
- **Hover states:** 0.15s color transition

### Button Interactions
- **Hover:** Scale 1.02, glow increase
- **Click:** Scale 0.98, instant feedback
- **Loading:** Spinner rotation 1s linear infinite

---

## 📐 Spacing System

### Page Padding
- **Desktop:** `px-6` (24px horizontal)
- **Mobile:** `px-4` (16px horizontal)
- **Top (with navbar):** `pt-24` (96px)
- **Bottom:** `pb-10` (40px)

### Card Spacing
- **Card padding:** `p-6` (24px)
- **Card gap:** `gap-4` (16px) → `gap-6` (24px on desktop)
- **Section margin:** `mb-8` (32px) → `mb-12` (48px on desktop)

### Typography Scale
- **Hero (h1):** `text-5xl` (48px) → `md:text-7xl` (72px)
- **Section (h2):** `text-3xl` (30px) → `md:text-5xl` (48px)
- **Card Title (h3):** `text-xl` (20px) → `text-2xl` (24px)
- **Body:** `text-base` (16px)
- **Small:** `text-sm` (14px)
- **Tiny:** `text-xs` (12px)

---

## 🎯 Interactive Elements

### Touch Targets (Mobile)
- Minimum: **44x44px**
- Button height: `py-2.5` (40px) → `py-3` (48px for primary)
- Icon buttons: `p-2.5` (10px padding + 24px icon = 44px)

### Hover States
- **Cards:** Border color change + glow
- **Buttons:** Background darken + scale
- **Links:** Underline + color shift
- **Navbar items:** Background fade + text color

### Focus States (Keyboard)
- Ring: `focus:ring-2 focus:ring-hazard`
- Outline: `focus:outline-none` (custom ring instead)

---

## 📱 Breakpoints

```css
/* Mobile First */
base:     /* 0px+ */
sm:       640px   /* Small tablet */
md:       768px   /* Tablet */
lg:       1024px  /* Desktop */
xl:       1280px  /* Large desktop */
2xl:      1536px  /* Extra large */
```

### Key Responsive Changes
- **< 768px:** Hamburger menu, single column
- **≥ 768px:** Horizontal navbar, 2 columns
- **≥ 1024px:** 3 columns for feature cards

---

## 🧪 Testing Scenarios

### Scan Flow Test
1. Open `/scan`
2. Grant camera permission
3. Point at GHS label (use test image if needed)
4. Wait for detection (should be < 2s)
5. Card should reveal immediately
6. Click "View Safety Guide" → scroll to info
7. Click "Continue Scanning" → card closes
8. Check Hazdex → new Hazmon appears

### Navbar Test
1. Start on `/`
2. Check navbar fixed at top
3. Scroll down → navbar stays
4. Click "Scanner" → navbar highlights active
5. Resize to mobile → hamburger appears
6. Click hamburger → menu slides down
7. Click outside → menu closes
8. Click "Hazdex" → navigate + active state

### Collection Test
1. Scan 3 different GHS labels
2. Go to `/hazdex`
3. See 3 unlocked, 6 locked
4. Click collected card → modal with details
5. Click locked card → "Scan to unlock" message

---

## 🚀 Performance Targets

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

### Lighthouse Scores (Target)
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

---

## 🎬 Video Storyboard

### Landing Page → Scan → Collection (30s)
```
00:00 - Landing page loads (hero + Hazmon preview)
00:05 - Click "Start Scanning Free"
00:07 - Scanner page loads with education cards
00:10 - Point camera at bleach bottle (GHS corrosive)
00:12 - Detection success flash
00:13 - Hazmon card flips in (Corrolith)
00:18 - Read hazard info
00:20 - Click "View Safety Guide"
00:22 - Scroll through safety tips
00:25 - Click "Continue Scanning"
00:26 - Card closes smoothly
00:27 - Click Hazdex widget
00:28 - See Corrolith in collection
00:30 - End
```

---

**All visual elements are production-ready!** 🎉

Test URL: http://localhost:3000
