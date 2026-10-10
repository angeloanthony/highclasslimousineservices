/**
 * ONE-OFF: turn each extracted legacy widget into a self-contained Astro island.
 * Markup + CSS + JS are copied verbatim (only asset paths and internal links are
 * rewritten) so behaviour is preserved exactly.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';

const LEGACY = 'legacy';
const OUT = 'src/components/islands';
mkdirSync(OUT, { recursive: true });

const TARGETS = [
  { file: 'things-to-do-in-vernal-utah.html', sel: '.hc-itin-section', name: 'Itinerary', doc: 'Vernal day-trip itinerary builder. Filters attractions, orders the picks by location and totals the time.' },
  { file: 'wedding-limo-uintah-basin.html', sel: '.hc-map-section', name: 'BasinMap', doc: 'Leaflet map of Uintah Basin wedding venues with drive time and package range per pin.', leaflet: true },
  { file: 'gallery.html', sel: '.gallery-carousel-section', name: 'GalleryCarousel', doc: 'Filterable photo carousel with dot nav, keyboard control, swipe and autoplay.' },
];

const IMG_KEEP = new Set(['/images/logo.png']);
function fixImg(src) {
  if (!src) return src;
  let out = src.replace(/^\.?\//, '');
  if (!out.startsWith('images/')) return src;
  out = '/' + out;
  return IMG_KEEP.has(out) ? out : out.replace(/\.(jpg|jpeg|png)$/i, '.webp');
}
const fixHref = (h) =>
  !h || /^(https?:|tel:|mailto:|#)/.test(h) ? h : h.startsWith('/') ? h : '/' + h;

for (const t of TARGETS) {
  const root = parse(readFileSync(join(LEGACY, t.file), 'utf8'));
  const body = root.querySelector('body');
  const el = root.querySelector(t.sel);

  // Rewrite asset paths and internal links inside the widget markup.
  el.querySelectorAll('img').forEach((i) => i.setAttribute('src', fixImg(i.getAttribute('src'))));
  el.querySelectorAll('a').forEach((a) => a.setAttribute('href', fixHref(a.getAttribute('href'))));

  const styles = [];
  const scripts = [];
  const walk = (n) => {
    for (const c of n.childNodes) {
      if (c.nodeType !== 1) continue;
      if (c.rawTagName === 'style') styles.push(c.textContent.trim());
      else if (
        c.rawTagName === 'script' &&
        !c.getAttribute('src') &&
        c.getAttribute('type') !== 'application/ld+json'
      ) {
        const txt = c.textContent;
        if (!/getElementById\('year'\)/.test(txt)) scripts.push(txt.trim());
      } else walk(c);
    }
  };
  walk(body);

  // Same rewrites inside the widget's own JavaScript string literals.
  const js = scripts
    .join('\n\n')
    .replace(/(['"`])(images\/[^'"`]+)\1/g, (_m, q, p) => `${q}${fixImg(p)}${q}`)
    .replace(/(['"`])(contact|index|services|weddings|gallery)\.html/g, (_m, q, p) => `${q}/${p}.html`);

  const css = styles.join('\n\n');

  const out =
    `---\n/**\n * ${t.doc}\n *\n * Island: ported from the legacy inline <script> on ${t.file}.\n */\n---\n\n` +
    el.outerHTML +
    '\n\n' +
    (css
      ? `<style is:global>\n  /* Global rather than scoped: parts of this widget are rendered by JS at\n     runtime and never receive Astro's scope attribute. */\n${css
          .split('\n')
          .map((l) => (l.trim() ? '  ' + l : ''))
          .join('\n')}\n</style>\n\n`
      : '') +
    (js ? `<script>\n${js}\n</script>\n` : '');

  writeFileSync(join(OUT, `${t.name}.astro`), out, 'utf8');
  console.log(`${t.name}.astro  (${css.length}b css, ${js.length}b js)`);
}
