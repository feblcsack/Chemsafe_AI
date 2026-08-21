# 🎨 Hazmon Artwork Upload Guide

## 📐 Image Specifications

### Recommended Dimensions:
- **Size:** 512x512 px (square)
- **Format:** PNG with transparent background (preferred) or JPG
- **File Size:** Max 500KB (smaller is better for loading speed)
- **Aspect Ratio:** 1:1 (square)

### Alternative Sizes (will auto-scale):
- **Minimum:** 256x256 px
- **Maximum:** 1024x1024 px
- **Web-optimized:** 512x512 px @ 72 DPI

---

## 🎴 9 Hazmon Cards to Upload

Upload custom artwork untuk masing-masing Hazmon type:

### 1. **Ignivore** (Flammable) 🔥
- **Current:** Fire icon
- **Suggested Theme:** Flame creature, fire dragon, burning monster
- **Color Palette:** Red (#FF4500), Orange (#FFA500)
- **Path:** `public/hazmon/ignivore.png`

### 2. **Oxidrax** (Oxidizing) ⚡
- **Current:** Lightning icon
- **Suggested Theme:** Electric/plasma creature, energy being
- **Color Palette:** Yellow (#FFEB3B), White
- **Path:** `public/hazmon/oxidrax.png`

### 3. **Detonyx** (Explosive) 💥
- **Current:** Warning icon
- **Suggested Theme:** Explosive character, bomb creature
- **Color Palette:** Orange (#FF6B00), Black (#1A1A1A)
- **Path:** `public/hazmon/detonyx.png`

### 4. **Corrolith** (Corrosive) 🧪
- **Current:** Droplet icon
- **Suggested Theme:** Acid slime, corrosive ooze
- **Color Palette:** Green (#7CB342), Dark Green (#558B2F)
- **Path:** `public/hazmon/corrolith.png`

### 5. **Venomask** (Acute Toxic) ☠️
- **Current:** Skull icon
- **Suggested Theme:** Poison creature, toxic monster
- **Color Palette:** Purple (#6A1B9A), Dark Purple (#4A148C)
- **Path:** `public/hazmon/venomask.png`

### 6. **Pulmonar** (Health Hazard) 🫁
- **Current:** Circle dot icon
- **Suggested Theme:** Respiratory/lung themed creature
- **Color Palette:** Gray (#546E7A), Dark Gray (#37474F)
- **Path:** `public/hazmon/pulmonar.png`

### 7. **Itchling** (Irritant) ⚠️
- **Current:** Exclamation icon
- **Suggested Theme:** Prickly/spiky character, irritating creature
- **Color Palette:** Yellow (#FFF59D), Amber (#FFEE58)
- **Path:** `public/hazmon/itchling.png`

### 8. **Aquabane** (Environment) 🐟
- **Current:** Wave icon
- **Suggested Theme:** Polluted water creature, toxic fish
- **Color Palette:** Teal (#00897B), Dark Teal (#004D40)
- **Path:** `public/hazmon/aquabane.png`

### 9. **Pressuron** (Compressed Gas) 💨
- **Current:** Wind icon
- **Suggested Theme:** Gas/wind creature, pressure monster
- **Color Palette:** Cyan (#00BCD4), Blue (#0097A7)
- **Path:** `public/hazmon/pressuron.png`

---

## 📁 Where to Upload

### Option 1: Public Folder (Static Assets) ✅ RECOMMENDED

```
frontend/
  public/
    hazmon/
      ignivore.png      (512x512px, <500KB)
      oxidrax.png       (512x512px, <500KB)
      detonyx.png       (512x512px, <500KB)
      corrolith.png     (512x512px, <500KB)
      venomask.png      (512x512px, <500KB)
      pulmonar.png      (512x512px, <500KB)
      itchling.png      (512x512px, <500KB)
      aquabane.png      (512x512px, <500KB)
      pressuron.png     (512x512px, <500KB)
```

**Usage in code:**
```tsx
<img src="/hazmon/ignivore.png" alt="Ignivore" />
```

**Pros:**
- ✅ Fast loading (CDN)
- ✅ No database needed
- ✅ Easy to update (just replace file)
- ✅ Version controlled

### Option 2: Supabase Storage (Dynamic)

```
Storage Bucket: hazmon-artwork
Path: official/{hazmon-id}.png
```

**Usage:**
```tsx
const url = supabase.storage.from('hazmon-artwork').getPublicUrl('official/ignivore.png')
```

**Pros:**
- ✅ Can update without deployment
- ✅ Supports versioning
- ⚠️ Requires database query

---

## 🎨 Design Guidelines

### Style Recommendations:

1. **Cartoon/Anime Style** (like Pokémon)
   - Friendly but dangerous looking
   - Clear silhouette
   - Vibrant colors

2. **Monster Design**
   - Incorporate hazard theme visually
   - Keep it simple (will be shown small)
   - Make it memorable

3. **Color Consistency**
   - Use the palette provided for each Hazmon
   - Maintain contrast for readability
   - Consider dark backgrounds

### Example Composition:

```
┌─────────────────────┐
│                     │
│     [CREATURE]      │  ← Main subject centered
│    ╱         ╲      │
│   ▕  ●   ●   ▏     │  ← Clear facial features
│    ╲    ▽    ╱     │
│     ─────────      │
│   [HAZARD HINT]    │  ← Visual element suggesting hazard type
│                     │
└─────────────────────┘
```

---

## 🖼️ Image Optimization

Before uploading, optimize your images:

### Tools:
- **TinyPNG** - https://tinypng.com (compress PNG/JPG)
- **Squoosh** - https://squoosh.app (Google's image optimizer)
- **ImageOptim** (Mac) - https://imageoptim.com

### Command Line (ImageMagick):
```bash
# Resize to 512x512 and optimize
magick input.png -resize 512x512 -quality 85 output.png

# Batch process all images
for file in *.png; do
  magick "$file" -resize 512x512 -quality 85 "optimized_$file"
done
```

### Photoshop Export Settings:
- Format: PNG-24 (with transparency) or JPEG
- Quality: 85%
- Dimensions: 512x512 px
- Color Profile: sRGB
- Metadata: Strip all

---

## 📦 Quick Start: Upload Your Artwork

### Step 1: Prepare Images

1. Create 9 images (one per Hazmon)
2. Name them correctly:
   - `ignivore.png`
   - `oxidrax.png`
   - `detonyx.png`
   - `corrolith.png`
   - `venomask.png`
   - `pulmonar.png`
   - `itchling.png`
   - `aquabane.png`
   - `pressuron.png`

### Step 2: Place in Public Folder

```bash
cd frontend
mkdir -p public/hazmon
cp /path/to/your/images/*.png public/hazmon/
```

### Step 3: Verify Files

```bash
ls -lh public/hazmon/
# Should show 9 .png files, each <500KB
```

### Step 4: Test Locally

```bash
npm run dev
# Open http://localhost:3000
# Scan a GHS symbol
# Card should show your custom artwork
```

### Step 5: Deploy

```bash
git add public/hazmon/*.png
git commit -m "feat: add custom Hazmon artwork"
git push origin main
# Vercel auto-deploys with new images
```

---

## 🎯 Card Display Specs

Your artwork will be displayed:

### On Card:
- **Container:** 192x224 px (h-48 sm:h-56)
- **Image:** 128x128 px to 160x160 px (w-32 h-32 sm:w-40 sm:h-40)
- **Effect:** Gentle float animation (scale + rotate)
- **Background:** Radial gradient with Hazmon colors

### In Grid:
- **Thumbnail:** 80x80 px
- **Hover:** Scale 1.05x
- **Border:** Holographic effect per rarity

### Loading:
- **Lazy loading:** Yes
- **Placeholder:** Colored background + icon
- **Fallback:** Default icon if image fails

---

## 🔧 Fallback System

If custom image not available:
1. Try: `/hazmon/{id}.png`
2. Fallback: Lucide icon (current system)
3. Color: Use Hazmon primary color

---

## 💡 Tips for Best Results

### DO:
- ✅ Use transparent PNG for flexibility
- ✅ Keep file size small (<500KB)
- ✅ Test on dark background (card uses dark theme)
- ✅ Make sure artwork is centered
- ✅ Use high contrast colors
- ✅ Include subtle hazard symbolism

### DON'T:
- ❌ Use text in the image (card has labels)
- ❌ Make it too detailed (will be small)
- ❌ Use copyrighted artwork
- ❌ Forget to optimize file size
- ❌ Use only one color (needs depth)

---

## 🎨 Where to Get Art

### Commission Custom Art:
- Fiverr - $10-50 per character
- Upwork - Professional illustrators
- ArtStation - Portfolio commission

### Use AI Generation:
- DALL-E 3 (via ChatGPT Plus)
- Midjourney
- Stable Diffusion
- Leonardo.ai

### AI Prompt Template:
```
"A cute but dangerous [HAZARD TYPE] creature character, 
Pokemon style, vibrant [PRIMARY COLOR] and [SECONDARY COLOR], 
simple design, transparent background, centered composition, 
front view, mascot style, digital art"
```

**Example for Ignivore:**
```
"A cute but dangerous fire elemental creature character,
Pokemon style, vibrant red and orange flames,
simple design, transparent background, centered composition,
front view, mascot style, digital art"
```

---

## 📸 Example Result

After uploading custom artwork:

**Before (Icon):**
```
┌──────────────┐
│      🔥      │  ← Lucide icon
│              │
└──────────────┘
```

**After (Custom Art):**
```
┌──────────────┐
│   [ARTWORK]  │  ← Your custom creature!
│   ╱▔▔▔▔▔╲    │
│  ▕ ●   ● ▏   │
│   ╲  ▽  ╱    │
│    ▔▔▔▔▔     │
└──────────────┘
```

---

## 🚀 Ready to Upload!

1. Prepare 9 images (512x512 px each)
2. Place in `frontend/public/hazmon/`
3. Test locally
4. Push to GitHub
5. Vercel auto-deploys!

**Need help with artwork?** DM me your requirements and I can generate AI art prompts for you! 🎨
