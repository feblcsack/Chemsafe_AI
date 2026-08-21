# 🎨 Setup Custom Hazmon Artwork - Quick Guide

## 📋 TL;DR

1. **Buat 9 gambar** (512x512 px, PNG/JPG, <500KB each)
2. **Simpan di:** `frontend/public/hazmon/`
3. **Naming:** `ignivore.png`, `oxidrax.png`, dst.
4. **Deploy:** Git push → auto-deploy ke Vercel

---

## 🎯 Spesifikasi Gambar

### Ukuran & Format:

```
✅ Recommended: 512x512 px (square)
✅ Format: PNG (transparent) atau JPG
✅ File size: <500KB per file
✅ Aspect ratio: 1:1 (square)
✅ Resolution: 72 DPI untuk web
```

### Kenapa 512x512 px?

Card akan display gambar di:
- **Large view:** 160x160 px (max)
- **Grid view:** 80x80 px (thumbnail)
- **512x512** memberi quality bagus dengan retina displays (2x scaling)
- Tidak terlalu besar (loading cepat)

---

## 📁 9 Hazmon Yang Harus Dibuat

### File yang dibutuhkan:

| File Name | Hazmon | Theme | Colors |
|-----------|---------|-------|--------|
| `ignivore.png` | Ignivore | 🔥 Fire creature | Red, Orange |
| `oxidrax.png` | Oxidrax | ⚡ Plasma/Electric | Yellow, White |
| `detonyx.png` | Detonyx | 💥 Explosive bomb | Orange, Black |
| `corrolith.png` | Corrolith | 🧪 Acid slime | Green, Dark Green |
| `venomask.png` | Venomask | ☠️ Poison skull | Purple, Dark Purple |
| `pulmonar.png` | Pulmonar | 🫁 Lung/Bio hazard | Gray, Dark Gray |
| `itchling.png` | Itchling | ⚠️ Spiky irritant | Yellow, Amber |
| `aquabane.png` | Aquabane | 🐟 Toxic water | Teal, Dark Teal |
| `pressuron.png` | Pressuron | 💨 Gas pressure | Cyan, Blue |

---

## 🎨 Cara Generate Artwork

### Option 1: AI Generation (Fastest) ⭐

**Recommended Tools:**
- ChatGPT (DALL-E 3) - $20/month
- Midjourney - $10/month
- Leonardo.ai - Free tier available

**Prompt Template:**
```
Create a cute but dangerous [HAZARD] creature character in Pokemon/monster collection style.
- Theme: [FIRE/POISON/ACID/etc]
- Colors: Vibrant [PRIMARY] and [SECONDARY]
- Style: Simple, bold design with clear silhouette
- Background: Transparent or solid color
- Composition: Centered, front-facing
- Format: Digital illustration, mascot style
- Mood: Friendly but hints at danger
```

**Example untuk Ignivore (Fire):**
```
Create a cute but dangerous fire elemental creature character in Pokemon style.
- Theme: Living flames, fire spirit
- Colors: Vibrant red (#FF4500) and orange (#FFA500)
- Style: Simple, bold design with flame-like features
- Background: Transparent
- Composition: Centered, front-facing, full body visible
- Format: Digital illustration, mascot character
- Mood: Energetic and playful but hints at burning danger
Make it memorable and easy to recognize even at small sizes.
```

### Option 2: Commission Artist

**Where to find:**
- **Fiverr:** $15-50 per character
- **Upwork:** Professional rates
- **ArtStation:** Browse portfolios

**What to tell artist:**
```
I need 9 Pokemon-style creature characters for a safety app:
- Style: Simple, bold, colorful (like Pokemon or Digimon)
- Size: 512x512 px each
- Format: PNG with transparency
- Theme: Chemical hazard creatures (fire, poison, acid, etc.)
- Budget: $[your budget]
- Delivery: Individual PNG files, optimized for web
```

### Option 3: Use Stock/Icon Packs

**Sources:**
- IconScout - Monster icon packs
- Flaticon - Creature collections
- Freepik - Character illustrations

**Make sure:**
- ✅ Commercial license included
- ✅ Can modify/recolor
- ✅ High enough resolution (min 256x256)

---

## 📂 Cara Upload ke Project

### Step 1: Prepare Files

```bash
# Make sure semua 9 files ready:
ignivore.png    (512x512, <500KB)
oxidrax.png     (512x512, <500KB)
detonyx.png     (512x512, <500KB)
corrolith.png   (512x512, <500KB)
venomask.png    (512x512, <500KB)
pulmonar.png    (512x512, <500KB)
itchling.png    (512x512, <500KB)
aquabane.png    (512x512, <500KB)
pressuron.png   (512x512, <500KB)
```

### Step 2: Place in Public Folder

```bash
cd /Users/resti/Documents/testerchem/frontend

# Copy your artwork files
cp /path/to/your/artwork/*.png public/hazmon/

# Or manually drag & drop files to:
# frontend/public/hazmon/
```

### Step 3: Verify Files

```bash
ls -lh public/hazmon/

# Should show:
# ignivore.png
# oxidrax.png
# detonyx.png
# corrolith.png
# venomask.png
# pulmonar.png
# itchling.png
# aquabane.png
# pressuron.png
# README.md (already there)
```

### Step 4: Optimize Images (Important!)

```bash
# Install ImageOptim (Mac)
brew install --cask imageoptim

# Or use online tool:
# https://tinypng.com
# https://squoosh.app

# Drag all PNG files to optimizer
# This reduces file size WITHOUT losing quality
```

### Step 5: Test Locally

```bash
cd frontend
npm run dev

# Open http://localhost:3000
# Go to /scan
# Scan a GHS symbol
# Card should show your custom artwork! 🎉
```

### Step 6: Deploy

```bash
# Add files to git
git add public/hazmon/*.png
git commit -m "feat: add custom Hazmon artwork for all 9 characters"
git push origin main

# Vercel auto-deploys!
# Wait ~2 minutes
# Check https://your-app.vercel.app
```

---

## 🔧 Troubleshooting

### Gambar tidak muncul?

**Check:**
1. File name **harus exact match** (lowercase, .png)
2. File **ada di `public/hazmon/`** (bukan di folder lain)
3. File size **<500KB**
4. Format **PNG atau JPG** (bukan .webp atau format lain)
5. Clear browser cache (Cmd+Shift+R)

**Fallback:**
Jika gambar gagal load, card akan otomatis show icon default (🔥, ⚡, dll)

### File size terlalu besar?

```bash
# Compress dengan TinyPNG
# https://tinypng.com

# Atau gunakan ImageMagick:
magick input.png -resize 512x512 -quality 85 output.png
```

### Background tidak transparent?

```bash
# Remove background dengan:
# https://remove.bg
# https://photoscissors.com

# Atau Photoshop:
# Select Subject → Delete Background → Save as PNG
```

---

## 🎯 Design Tips

### DO:
- ✅ Keep design simple (small display size)
- ✅ Use strong silhouette (recognizable from far)
- ✅ Bold colors matching Hazmon theme
- ✅ Centered composition
- ✅ Test on dark background (card uses dark theme)
- ✅ Include subtle hints of hazard type

### DON'T:
- ❌ Add text to image (card has labels)
- ❌ Too much detail (will blur when small)
- ❌ Light colors only (hard to see on dark background)
- ❌ Off-center composition
- ❌ Use copyrighted characters

---

## 🎨 Color Palettes (untuk reference)

Copy-paste ke AI prompt atau give to artist:

```css
/* Ignivore (Flammable) */
Primary: #FF4500 (OrangeRed)
Secondary: #FFA500 (Orange)

/* Oxidrax (Oxidizing) */
Primary: #FFEB3B (Bright Yellow)
Secondary: #FFFFFF (White)

/* Detonyx (Explosive) */
Primary: #FF6B00 (Dark Orange)
Secondary: #1A1A1A (Near Black)

/* Corrolith (Corrosive) */
Primary: #7CB342 (Light Green)
Secondary: #558B2F (Dark Green)

/* Venomask (Toxic) */
Primary: #6A1B9A (Deep Purple)
Secondary: #4A148C (Dark Purple)

/* Pulmonar (Health Hazard) */
Primary: #546E7A (Blue Gray)
Secondary: #37474F (Dark Gray)

/* Itchling (Irritant) */
Primary: #FFF59D (Light Yellow)
Secondary: #FFEE58 (Yellow)

/* Aquabane (Environment) */
Primary: #00897B (Teal)
Secondary: #004D40 (Dark Teal)

/* Pressuron (Compressed Gas) */
Primary: #00BCD4 (Cyan)
Secondary: #0097A7 (Dark Cyan)
```

---

## 📊 Expected Results

### Before (Default Icons):
```
Card shows: 🔥 🧪 ⚡ (Lucide icons)
Size: Small, basic
Feel: Placeholder
```

### After (Custom Artwork):
```
Card shows: [Your amazing creature art!]
Size: Large, detailed
Feel: Professional, polished
Brand: Unique to your app
```

---

## 🚀 Quick Start Checklist

- [ ] Generate/commission 9 artwork files
- [ ] Resize to 512x512 px
- [ ] Optimize file size (<500KB each)
- [ ] Name correctly (lowercase, .png)
- [ ] Place in `frontend/public/hazmon/`
- [ ] Test locally (npm run dev)
- [ ] Commit to git
- [ ] Push to GitHub
- [ ] Verify on Vercel deployment

---

## 🎉 You're Done!

Your Hazmon cards will now show custom artwork instead of default icons!

**Questions?**
- Check `/HAZMON_ARTWORK_GUIDE.md` for full details
- See `frontend/public/hazmon/README.md` for quick reference

**Ready for Intel AI Competition with professional Hazmon artwork! 🏆**
