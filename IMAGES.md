# IMAGE & VIDEO PLACEMENT GUIDE

Drop your real images into the `/images/` folder using these exact filenames. Everything will "just work" — no code changes needed.

All placeholder images are cinematic black + gold so you can see the site before you swap them in.

---

## 🎥 VIDEO (optional but amazing)

| File | Location on site | What to put there |
|------|------------------|-------------------|
| `/videos/hero.mp4` | Homepage hero background | 10–30 sec cinematic clip, MUTED, LOOPING. Limo rolling through Vernal at sunset works perfectly. If you skip the video, `hero-poster.jpg` is shown instead. |

**Specs:** MP4, 1920×1080, under 10 MB ideally (compress at handbrake.fr). Keep it subtle — it sits behind dark overlay text.

---

## 🖼 CRITICAL IMAGES (do these first)

### Hero / Main branding
| Filename | Used on | Size | What goes here |
|----------|---------|------|----------------|
| `images/logo.png` | Nav + footer | ~200×200, transparent PNG | Your HC logo or dinosaur mascot mark |
| `images/favicon.png` | Browser tab icon | 64×64 PNG | Simplified logo |
| `images/hero-poster.jpg` | Homepage hero (behind video, or shown alone if no video) | 1920×1080 | **Your best shot.** Tuxedo dinosaur OR giant limo sunset shot |
| `images/og-home.jpg` | Social media share preview | 1200×630 | Same vibe as hero — this is what shows when people share your site on Facebook/iMessage |

### Page headers (every non-home page)
| Filename | Used on | Size | What goes here |
|----------|---------|------|----------------|
| `images/page-header.jpg` | About, Services, Gallery, FAQ, Contact, all service pages | 1920×600 | Cinematic wide shot of the limo. Gets darkened by overlay, so any dramatic shot works |
| `images/cta-bg.jpg` | Bottom CTA banner (every page) | 1920×700 | Another cinematic wide shot — can be same as page-header or different |
| `images/fleet-bg.jpg` | Homepage "The Fleet" showcase | 1920×1080 | Wide dramatic shot of the limo (sunset, wet pavement, etc.) |

---

## 🚗 SERVICE CARD THUMBNAILS (homepage + /services page)

All 6 are **800×1067** (3:4 portrait). Pick the image that best represents each service:

| Filename | Service |
|----------|---------|
| `images/service-wedding.jpg` | Weddings — bride at limo, elegant shot |
| `images/service-prom.jpg` | Proms — students in formal wear |
| `images/service-airport.jpg` | Airport — limo at airport / sunrise road |
| `images/service-corporate.jpg` | Corporate — executive boarding limo |
| `images/service-party.jpg` | Parties — limo with mood lighting / night scene |
| `images/service-tours.jpg` | Tours — limo with dinosaur country / scenic Utah |

---

## 📖 ABOUT / EXPERIENCE SECTION

| Filename | Size | What goes here |
|----------|------|----------------|
| `images/experience-limo.jpg` | 900×1125 (4:5) | Interior shot — leather, gold lighting, dramatic |
| `images/about-owner.jpg` | 900×1125 (4:5) | You standing beside the limo, or another strong brand image |

---

## 📄 SERVICE LANDING PAGES (3 images each)

Each service page has 3 feature blocks. You need **3 photos per service** — 900×675 each (4:3 landscape).

### Weddings (`/weddings.html`)
- `images/wedding-1.jpg` → Bride arriving at venue (the arrival)
- `images/wedding-2.jpg` → Couple inside limo (between ceremony & reception)
- `images/wedding-3.jpg` → Limo driving away at sunset (grand exit)

### Proms (`/prom.html`)
- `images/prom-1.jpg` → Students in formalwear with limo
- `images/prom-2.jpg` → Friends laughing inside limo
- `images/prom-3.jpg` → Limo outside school / at drop-off

### Airport (`/airport.html`)
- `images/airport-1.jpg` → Limo on highway at sunrise
- `images/airport-2.jpg` → Passenger using laptop in interior
- `images/airport-3.jpg` → Chauffeur waiting at terminal

### Corporate (`/corporate.html`)
- `images/corporate-1.jpg` → Executive boarding limo outside office
- `images/corporate-2.jpg` → Group / event shuttle scene
- `images/corporate-3.jpg` → Remote / field location shot

### Parties (`/parties.html`)
- `images/party-1.jpg` → Friends celebrating inside (mood lighting)
- `images/party-2.jpg` → Group boarding limo (night)
- `images/party-3.jpg` → Limo outside concert / venue

### Tours (`/tours.html`)
- `images/tour-1.jpg` → Limo at Dinosaur National Monument
- `images/tour-2.jpg` → Flaming Gorge or scenic overlook
- `images/tour-3.jpg` → Sunset / golden hour scenery

---

## 🎞 GALLERY PAGE (12 images, varied sizes)

Gallery uses a mosaic grid — each image gets an automatic filter tag. Recommended size: **800×600** minimum, larger is fine.

| Filename | Suggested category | Suggested shot |
|----------|-------------------|----------------|
| `images/gallery-1.jpg` | Exterior (large tile) | Your strongest sunset exterior |
| `images/gallery-2.jpg` | Interior | Gold mood lighting closeup |
| `images/gallery-3.jpg` | Brand | Dinosaur mascot shot |
| `images/gallery-4.jpg` | Vernal (tall tile) | Limo on open Basin road |
| `images/gallery-5.jpg` | Events | Wedding shot |
| `images/gallery-6.jpg` | Events | Prom group shot |
| `images/gallery-7.jpg` | Interior | Leather detail / seating |
| `images/gallery-8.jpg` | Vernal (large tile) | Dinosaur country scenic |
| `images/gallery-9.jpg` | Exterior | Wet pavement reflection |
| `images/gallery-10.jpg` | Interior | Champagne / glassware detail |
| `images/gallery-11.jpg` | Brand | "Class Isn't Extinct" signage |
| `images/gallery-12.jpg` | Events | Birthday / party arrival |

The gallery auto-filters by category using the buttons. If you want to re-tag an image, edit the `data-cat="..."` attribute on the corresponding tile inside `gallery.html`.

---

## 🗺 CONTACT PAGE

| Filename | Size | What goes here |
|----------|------|----------------|
| `images/map-placeholder.jpg` | 1200×750 | Screenshot of your Google Maps service area, or a branded "Service Area" graphic. You can also replace the `.map-placeholder` div with a real Google Maps embed later. |

---

## 📝 QUICK ASSET CHECKLIST

**Minimum to launch with real photos (10 images):**
1. `logo.png`
2. `hero-poster.jpg` ← most important
3. `page-header.jpg`
4. `service-wedding.jpg` through `service-tours.jpg` (6 total)
5. `experience-limo.jpg`

**Full buildout: ~45 images total** (all listed above).

**Don't have all 45?** The placeholders are cinematic on purpose. You can launch with partial imagery and fill in the gaps weekly. Service landing pages can share photos (e.g., your best interior shot can be `wedding-2`, `prom-2`, and `party-1` — just copy the file).

---

## 📐 IMAGE PREP TIPS

- **Format:** JPG for photos, PNG for logos/graphics with transparency
- **Compress:** Run everything through tinypng.com or squoosh.app before uploading — cuts file size 60–80% with no visible quality loss
- **Consistency:** Keep the dark cinematic + gold aesthetic. If a photo is too bright/daytime, a quick Instagram-style darken + warm filter will match the site's mood
- **Dimensions:** The exact pixel sizes above aren't mandatory — just keep the **aspect ratio** similar so nothing gets stretched
