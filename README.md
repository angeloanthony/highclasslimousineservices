# High Class Limousine Services

Luxury limo service website for Vernal, Utah — built with [Astro 6](https://astro.build),
deployed as a static site to Cloudflare.

Migrated from 33 hand-maintained HTML files to Astro content collections. Every
public URL is unchanged.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build into `dist/` |
| `npm run build:search` | Build **and** generate the Pagefind search index |
| `npm run preview` | Serve the built site locally |
| `npm run verify` | Diff every built page against its pre-migration original |
| `npm run check:links` | Audit `dist/` for broken internal links and missing assets |

---

## How the site is organised

```
src/
  content/
    services/*.mdx      6 service pages (weddings, prom, airport, …)
    articles/*.mdx      18 long-form pages (pillar, locations, intent, guides)
    legal/*.mdx         privacy, terms
    faqs.json           FAQ items — feeds both the accordion and the JSON-LD
    testimonials.json   homepage reviews
    gallery.json        carousel slides
  content.config.ts     Zod schemas — bad frontmatter fails the build

  pages/
    [...slug].astro     renders every collection entry
    index / about / services / gallery / faq / contact / 404
    sitemap.xml.ts      keeps the legacy sitemap URL alive

  layouts/              BaseLayout (head, SEO, chrome) + ContentPage
  components/           shared UI; components/islands/ = the interactive ones
  lib/site.js           business facts (phone, address, nav, sitemap priorities)
  styles/global.css     the original stylesheet, bundled and minified
```

### Editing content

Everything on a service or article page lives in one `.mdx` file: metadata and
JSON-LD in the frontmatter, prose in Markdown below it, and components
(`<FeatureRow>`, `<StoryBlock>`, `<Card>`) for the designed sections.

`src/content.config.ts` validates every entry at build time, so a missing
description or a malformed canonical breaks the build instead of shipping.

### Islands

Interactive widgets are Astro islands — they ship JavaScript only on the pages
that use them:

| Island | Page |
| --- | --- |
| `PriceCalculator` | how-much-does-a-limo-cost-in-vernal |
| `PromTimeline` | how-to-plan-a-prom-night-vernal |
| `Itinerary` | things-to-do-in-vernal-utah |
| `BasinMap` (Leaflet) | wedding-limo-uintah-basin |
| `ServiceMap` (Leaflet) | contact |
| `GalleryCarousel` | gallery |
| `CalBooking` | contact |

28 of 33 pages ship **zero** external JavaScript. Leaflet (149 KB) now loads on
the two map pages instead of being fetched from a CDN, and the shared `main.js`
no longer carries map code onto every page.

---

## URLs

Hosting is **Cloudflare Pages** (project `highclasslimousineservices`, Git
integration on `main`). Pages serves `dist/weddings.html` at `/weddings` and
308-redirects `/weddings.html` there. That behaviour can't be turned off, and
the legacy site already worked this way, so:

- canonicals, the sitemap and every internal link use the extensionless form
  (`/weddings`, homepage `/`);
- old `.html` links keep working through Pages' built-in redirect — **no
  `_redirects` file**. Adding `/x -> /x.html` rules would loop against it.

Content frontmatter `path` must be extensionless; `content.config.ts` enforces it.

---

## Launch checklist

- [ ] Pages build settings: build command `npm run build`, output directory
      `dist`, Node 22+. Set these **before** the migration reaches `main` —
      every push to `main` deploys to production.
- [ ] `npm run check:links` → no broken links or assets.
- [ ] `npm run verify` → all pages match their originals.
- [ ] Check the branch preview deployment: `/weddings` → 200,
      `/weddings.html` → 308 to `/weddings`, `/sitemap.xml` resolves.
- [ ] Re-test the Cal.com booking embed, homepage video and both Leaflet maps
      (the CSP is the main risk).
- [ ] Paste the homepage into Google's Rich Results Test.
- [ ] Watch Search Console daily for the first 30 days: indexing, crawl errors,
      Core Web Vitals.

---

## Migration audit trail

`legacy/` holds the pre-migration HTML, and `scripts/` holds the one-off tools
that converted it:

| Script | Purpose |
| --- | --- |
| `migrate.mjs` | HTML → MDX collection entries |
| `extract-data.mjs` | FAQ / testimonial / gallery data → JSON collections |
| `gen-islands.mjs` | inline widget markup + CSS + JS → island components |
| `verify.mjs` | compares built output against the originals |
| `check-links.mjs` | broken-link and missing-asset audit |

`verify.mjs` needs `legacy/`. Once the post-migration monitoring window closes,
both `legacy/` and the three one-off scripts can be deleted — the originals
remain in git history.

---

## Known follow-ups

These were pre-existing and are **not** blockers, but they are worth a decision:

- **Missing social-card images.** 15 `og-*.jpg` files were referenced but never
  existed in the repo. Pages now fall back to `/images/og-home.webp`. Making
  per-page cards would improve link previews.
- **`gallery-8`** is the one image with no `.webp`; it was restored from git as
  a 2.3 MB JPEG. Convert it to match the rest.
- **Metadata length.** 15 titles run over 60 characters and 10 descriptions over
  160 — they'll be truncated in results. Left as-is deliberately: rewriting
  ranking pages' metadata is a content decision, not a migration one.
- **Hero video.** `videos/hero.mp4` never existed, so the `<video>` element was
  dropped in favour of the poster image it was already falling back to.
- **Search.** Pagefind is installed and `npm run build:search` generates the
  index, but no search UI is wired up yet — that's the guide's Phase 2.
