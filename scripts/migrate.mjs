/**
 * ONE-OFF MIGRATION SCRIPT
 *
 * Converts the legacy hand-written HTML pages into MDX content-collection
 * entries. Run once against the pre-migration files; kept in the repo as the
 * audit trail for how content was moved (Phase B of the migration guide).
 *
 *   node scripts/migrate.mjs <legacy-dir> <out-dir>
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';

const [, , LEGACY = 'legacy', OUT = 'src/content'] = process.argv;

/* ------------------------------------------------------------------ */
/* Page routing table: which collection each legacy file lands in.     */
/* ------------------------------------------------------------------ */
const SERVICES = {
  'weddings.html': { order: 1, image: '/images/service-wedding.webp', badge: 'Most Requested', featured: true },
  'prom.html': { order: 2, image: '/images/service-prom.webp' },
  'airport.html': { order: 3, image: '/images/service-airport.webp' },
  'corporate.html': { order: 4, image: '/images/service-corporate.webp' },
  'parties.html': { order: 5, image: '/images/service-party.webp' },
  'tours.html': { order: 6, image: '/images/service-tours.webp' },
};

const ARTICLES = {
  'limousine-service-vernal-utah.html': 'pillar',
  'limo-near-dinosaur-national-monument.html': 'location',
  'limo-service-flaming-gorge.html': 'location',
  'limo-service-roosevelt-utah.html': 'location',
  'limo-service-duchesne-utah.html': 'location',
  'bachelor-party-limo-vernal.html': 'intent',
  'bachelorette-party-limo-vernal.html': 'intent',
  'oilfield-executive-transportation-vernal.html': 'intent',
  'vernal-to-slc-airport-limo.html': 'intent',
  'wine-tour-limo-vernal-utah.html': 'intent',
  'funeral-limousine-vernal.html': 'intent',
  'prom-limo-uintah-high-school.html': 'intent',
  'wedding-limo-uintah-basin.html': 'intent',
  'how-much-does-a-limo-cost-in-vernal.html': 'intent',
  'things-to-do-in-vernal-utah.html': 'guide',
  'vernal-wedding-venues-guide.html': 'guide',
  'how-to-plan-a-prom-night-vernal.html': 'guide',
  'flaming-gorge-scenic-drive-guide.html': 'guide',
};

const LEGAL = ['privacy.html', 'terms.html'];

/* Widgets that were inline <script>/<style> blobs; each becomes an island. */
const WIDGETS = {
  'hc-calc': 'PriceCalculator',
  'hc-tl': 'PromTimeline',
  'hc-itin': 'Itinerary',
  'hc-map': 'BasinMap',
};

/**
 * Islands that render their own <section> and heading. For these the whole
 * legacy section collapses to a single component tag — otherwise the section
 * head would be emitted twice, once by the MDX and once by the island.
 */
const WIDGETS_OWNING_SECTION = new Set(['PriceCalculator', 'Itinerary', 'BasinMap']);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});
// Keep <br> as a hard break rather than dropping it.
td.addRule('br', { filter: 'br', replacement: () => '\\\n' });
// Turndown's default emits "-   item" (3 trailing spaces). Inside an MDX
// component that extra indentation can tip a list into a code block, so use a
// single space.
td.addRule('listItem', {
  filter: 'li',
  replacement(content, node) {
    const body = content
      .replace(/^\n+/, '')
      .replace(/\n+$/, '\n')
      .replace(/\n/gm, '\n  ');
    const parent = node.parentNode;
    const prefix =
      parent.nodeName === 'OL'
        ? `${Array.prototype.indexOf.call(parent.children, node) + 1}. `
        : '- ';
    return prefix + body + (node.nextSibling && !/\n$/.test(body) ? '\n' : '');
  },
});

/** .jpg/.png -> .webp, and make every image path site-absolute. */
const IMG_KEEP_AS_IS = new Set(['/images/logo.png']);
function fixImg(src) {
  if (!src) return src;
  let out = src.replace(/^\.?\//, '');
  if (!out.startsWith('images/')) return src;
  out = '/' + out;
  if (IMG_KEEP_AS_IS.has(out)) return out;
  return out.replace(/\.(jpg|jpeg|png)$/i, '.webp');
}

/** weddings.html -> /weddings.html ; index.html -> / */
const fixHref = (href) => {
  if (!href) return href;
  if (/^(https?:|tel:|mailto:|#)/.test(href)) return href;
  return href.startsWith('/') ? href : '/' + href;
};

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

/** Splits "Make an entrance <span class=italic-script>nobody forgets.</span>" */
function splitScript(el) {
  if (!el) return { main: '', script: undefined, position: 'after' };
  const span = el.querySelector('.italic-script');
  if (!span) return { main: text(el), script: undefined, position: 'after' };
  const script = text(span);
  const clone = parse(el.innerHTML);
  const s = clone.querySelector('.italic-script');
  if (s) s.remove();
  const main = clone.textContent.replace(/\s+/g, ' ').trim();
  const position = el.innerHTML.trim().startsWith('<span') ? 'before' : 'after';
  return { main, script, position };
}

function yamlStr(s) {
  if (s === undefined || s === null) return "''";
  const v = String(s);
  return `'${v.replace(/'/g, "''")}'`;
}

/** `@` is a reserved YAML indicator, so schema.org's @type/@id keys must be quoted. */
const yamlKey = (k) => (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(k) ? k : `'${k}'`);

function yaml(obj, indent = 0) {
  const pad = ' '.repeat(indent);
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const key = yamlKey(k);
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      lines.push(`${pad}${key}:`);
      for (const item of v) {
        if (item && typeof item === 'object') {
          const inner = yaml(item, indent + 4).replace(/^\s{4}/, '');
          lines.push(`${pad}  - ${inner.trimStart()}`);
        } else {
          lines.push(`${pad}  - ${yamlStr(item)}`);
        }
      }
    } else if (v && typeof v === 'object') {
      lines.push(`${pad}${key}:`);
      lines.push(yaml(v, indent + 2));
    } else if (typeof v === 'boolean' || typeof v === 'number') {
      lines.push(`${pad}${key}: ${v}`);
    } else {
      lines.push(`${pad}${key}: ${yamlStr(v)}`);
    }
  }
  return lines.join('\n');
}

/** Convert an element's inner HTML to markdown, fixing links and images. */
function md(el) {
  if (!el) return '';
  const clone = parse(el.innerHTML);
  clone.querySelectorAll('a').forEach((a) => a.setAttribute('href', fixHref(a.getAttribute('href'))));
  clone.querySelectorAll('img').forEach((i) => i.setAttribute('src', fixImg(i.getAttribute('src'))));
  // Strip the decorative corner/view-label spans; components re-emit them.
  clone.querySelectorAll('.corner, .view-label').forEach((n) => n.remove());
  return td
    .turndown(clone.toString())
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * MDX parses 4-space-indented lines inside a JSX block as a code fence, and
 * these components nest two deep. Emitting children flush-left is the only
 * indentation that is unambiguously prose at every nesting level.
 */
const indent = (s) => s;

const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== '' && v !== false)
    .map(([k, v]) => (v === true ? k : `${k}="${String(v).replace(/"/g, '&quot;')}"`))
    .join(' ');

/* ------------------------------------------------------------------ */
/* Block converters                                                    */
/* ------------------------------------------------------------------ */
const used = new Set();

function convStoryBlock(el) {
  used.add('StoryBlock');
  const dropCap = !!el.querySelector('.drop-cap');
  const body = md(el);
  return `<StoryBlock${dropCap ? ' dropCap' : ''}>\n${indent(body)}\n</StoryBlock>`;
}

/**
 * The long-form pages reuse `.feature-row` as a two-column *prose* band with
 * no image. Different markup, same grid.
 */
function convSplitRow(el) {
  used.add('SplitRow');
  const cols = el.childNodes.filter((n) => n.nodeType === 1);
  const [leftEl, rightEl] = cols;

  const eyebrow = text(leftEl.querySelector('.eyebrow'));
  const { main, script } = splitScript(leftEl.querySelector('h2'));

  const leftClone = parse(leftEl.innerHTML);
  leftClone.querySelectorAll('.eyebrow, h2').forEach((n) => n.remove());

  const a = attrs({ eyebrow, title: main, titleScript: script });
  const left = md(leftClone);
  const right = rightEl ? md(rightEl) : '';

  return (
    `<SplitRow ${a}>\n` +
    `<Fragment slot="left">\n${left}\n</Fragment>\n` +
    (right ? `<Fragment slot="right">\n${right}\n</Fragment>\n` : '') +
    `</SplitRow>`
  );
}

function convFeatureRow(el) {
  // Two markup shapes share the .feature-row class.
  if (!el.querySelector('.feature-row__text')) return convSplitRow(el);

  used.add('FeatureRow');
  const img = el.querySelector('.feature-row__img img');
  const textEl = el.querySelector('.feature-row__text');
  const eyebrow = text(textEl.querySelector('.eyebrow'));
  const h = textEl.querySelector('h2');
  const { main, script } = splitScript(h);

  const clone = parse(textEl.innerHTML);
  clone.querySelectorAll('.eyebrow, h2').forEach((n) => n.remove());
  const body = md(clone);

  const a = attrs({
    image: fixImg(img?.getAttribute('src')),
    alt: img?.getAttribute('alt') || '',
    eyebrow,
    title: main,
    titleScript: script,
    reverse: el.classList.contains('feature-row--reverse'),
  });
  return `<FeatureRow ${a}>\n${indent(body)}\n</FeatureRow>`;
}

function convSectionHead(el) {
  used.add('SectionHead');
  const eyebrow = text(el.querySelector('.eyebrow'));
  const { main, script, position } = splitScript(el.querySelector('h2'));
  const lead = text(el.querySelector('p'));
  return `<SectionHead ${attrs({
    eyebrow,
    title: main,
    titleScript: script,
    scriptPosition: position === 'before' ? 'before' : undefined,
    lead,
  })} />`;
}

function convOccasions(el) {
  used.add('OccasionList');
  const items = el.querySelectorAll('.occasion-list__item').map((i) => ({
    title: text(i.querySelector('h4')),
    body: text(i.querySelector('p')),
  }));
  return `<OccasionList items={${JSON.stringify(items)}} />`;
}

function convCardGrid(el) {
  used.add('CardGrid');
  used.add('Card');
  const cards = el.childNodes
    .filter((n) => n.nodeType === 1)
    .map((c) => {
      const num = text(c.querySelector('.service-card__num'));
      const titleEl = c.querySelector('h3');
      const title = titleEl ? titleEl.innerHTML.trim() : '';
      const href = c.rawTagName === 'a' ? fixHref(c.getAttribute('href')) : undefined;
      const imgDiv = c.querySelector('.service-card__img');
      const bg = imgDiv?.getAttribute('style')?.match(/url\(['"]?([^'")]+)/)?.[1];
      const link = text(c.querySelector('.service-card__link')).replace(/\s*→\s*$/, '');

      const inner = c.querySelector('.service-card__content') || c;
      const clone = parse(inner.innerHTML);
      clone.querySelectorAll('.service-card__num, h3, .service-card__link, .service-card__img').forEach((n) => n.remove());
      const body = md(clone);

      const a = attrs({ num, title, href, image: bg ? fixImg(bg) : undefined, linkText: link });
      return `<Card ${a}>\n${indent(body)}\n</Card>`;
    });
  const reveal = el.classList.contains('reveal-stagger');
  return `<CardGrid${reveal ? '' : ' reveal={false}'}>\n${cards.join('\n\n')}\n</CardGrid>`;
}

function convFaqDetails(nodes) {
  used.add('FaqAccordion');
  const items = nodes.map((d) => ({
    q: text(d.querySelector('summary')),
    a: d
      .querySelectorAll('p')
      .map((p) => p.innerHTML.trim())
      .join(' '),
  }));
  return `<FaqAccordion items={${JSON.stringify(items)}} />`;
}

function convCenterCta(el) {
  used.add('CenterCta');
  const a = el.querySelector('a');
  const label = text(a).replace(/\s*→\s*$/, '');
  const variant = a.classList.contains('btn--outline') ? 'outline' : 'gold';
  return `<CenterCta ${attrs({ href: fixHref(a.getAttribute('href')), label, variant })} />`;
}

function convValues(el) {
  used.add('ValueGrid');
  const items = el.querySelectorAll('.value-card').map((v) => ({
    num: text(v.querySelector('.value-card__num')),
    title: text(v.querySelector('h3')),
    body: text(v.querySelector('p')),
  }));
  return `<ValueGrid items={${JSON.stringify(items)}} />`;
}

/** Dispatch a single block element inside a section container. */
function convBlock(el, ctx) {
  const cls = el.getAttribute('class') || '';
  const has = (c) => cls.split(/\s+/).includes(c);
  const tag = el.rawTagName;

  if (has('section-head')) return convSectionHead(el);
  if (has('story-block')) return convStoryBlock(el);
  if (has('feature-row')) return convFeatureRow(el);
  if (has('occasion-list')) return convOccasions(el);
  if (has('services__grid')) return convCardGrid(el);
  if (has('values-grid')) return convValues(el);
  if (has('experience__grid')) return convExperienceGrid(el);
  if (has('experience')) return convNestedExperience(el, ctx);
  if (tag === 'style' || tag === 'script') return null; // handled as widgets
  if (has('btn') || el.querySelector(':scope > a.btn')) return convCenterCta(el);

  // A bare <div> wrapper: could be an FAQ accordion, a table, or free HTML.
  const details = el.querySelectorAll('details');
  if (details.length) return convFaqDetails(details);

  if (tag === 'p') return md(el);

  // Widget mount points.
  const id = el.getAttribute('id') || '';
  for (const [key, comp] of Object.entries(WIDGETS)) {
    if (id === key || cls.includes(key)) {
      used.add(comp);
      return `<${comp} />`;
    }
  }

  // Fallback: keep the markup, converted to markdown so nothing is lost.
  return md(el);
}

function convExperienceGrid(el) {
  used.add('MediaSplit');
  const img = el.querySelector('img');
  const textEl = el.querySelector('.experience__text');
  const eyebrow = text(textEl?.querySelector('.eyebrow'));
  const { main, script } = splitScript(textEl?.querySelector('h2'));
  const sig = text(textEl?.querySelector('.experience__sig'));
  const clone = parse(textEl?.innerHTML || '');
  clone.querySelectorAll('.eyebrow, h2, .experience__sig').forEach((n) => n.remove());
  return `<MediaSplit ${attrs({
    image: fixImg(img?.getAttribute('src')),
    alt: img?.getAttribute('alt') || '',
    eyebrow,
    title: main,
    titleScript: script,
    signature: sig,
  })}>\n${indent(md(clone))}\n</MediaSplit>`;
}

/** A .experience div nested inside a plain section (used as a callout band). */
function convNestedExperience(el, ctx) {
  const parts = [];
  for (const child of el.childNodes) {
    if (child.nodeType !== 1) continue;
    const r = convBlock(child, ctx);
    if (r) parts.push(r);
  }
  return parts.join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Page conversion                                                     */
/* ------------------------------------------------------------------ */
/** og:image targets that don't exist on disk; reported at the end. */
const missingOg = new Set();

/** Blocks whose markup shape the converter didn't recognise. */
const conversionWarnings = [];

function convertPage(file, { hoistOccasions = false } = {}) {
  const html = readFileSync(join(LEGACY, file), 'utf8');
  const root = parse(html);
  const head = root.querySelector('head');
  const body = root.querySelector('body');

  const meta = (sel, attr = 'content') =>
    head.querySelector(sel)?.getAttribute(attr) || undefined;

  const title = text(head.querySelector('title'));
  const description = meta('meta[name="description"]') || '';
  const canonical = meta('link[rel="canonical"]', 'href') || '';
  const path = canonical.replace(/^https?:\/\/[^/]+/, '') || '/' + file;
  // Several og-*.jpg social cards were referenced but never existed in the
  // repo. Drop those so the layout falls back to the site default rather than
  // shipping a link to a 404.
  let ogImage = fixImg(
    (meta('meta[property="og:image"]') || '').replace(/^https?:\/\/[^/]+/, '')
  );
  if (ogImage && !existsSync(join('public', ogImage))) {
    missingOg.add(ogImage);
    ogImage = undefined;
  }

  // JSON-LD carried over verbatim.
  const schema = [];
  for (const s of head.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const parsed = JSON.parse(s.textContent);
      if (parsed['@graph']) schema.push(...parsed['@graph']);
      else {
        const { '@context': _ctx, ...rest } = parsed;
        schema.push(rest);
      }
    } catch {
      console.warn(`  ! unparseable JSON-LD in ${file}`);
    }
  }

  // Page header.
  const ph = body.querySelector('.page-header');
  const { main: h1, script: h1Script } = splitScript(ph?.querySelector('h1'));
  const tagline = text(ph?.querySelector('p')) || undefined;
  const crumbs = [];
  const bc = ph?.querySelector('.breadcrumb');
  if (bc) {
    for (const n of bc.childNodes) {
      if (n.nodeType === 1 && n.rawTagName === 'a') {
        crumbs.push({ label: text(n), href: fixHref(n.getAttribute('href')) });
      } else if (n.nodeType === 3) {
        const t = n.textContent.replace(/[\s/]+/g, ' ').trim();
        if (t) crumbs.push({ label: t });
      }
    }
  }

  // Related reading + final CTA are chrome, not body content.
  const relatedSec = body.querySelector('section.related');
  const related = (relatedSec?.querySelectorAll('.related-card') || []).map((c) => ({
    href: fixHref(c.getAttribute('href')),
    title: text(c.querySelector('h3')),
    blurb: text(c.querySelector('p')),
  }));

  const ctaSec = body.querySelector('section.cta-final');
  let cta;
  if (ctaSec) {
    const { main, script } = splitScript(ctaSec.querySelector('h2'));
    const btns = ctaSec.querySelectorAll('.cta-final__actions a');
    cta = {
      title: main,
      titleScript: script,
      sub: text(ctaSec.querySelector('p')),
      primaryLabel: text(btns[0]).replace(/\s*→\s*$/, ''),
      primaryHref: fixHref(btns[0]?.getAttribute('href')),
      secondaryLabel: text(btns[1]),
      secondaryHref: fixHref(btns[1]?.getAttribute('href')),
    };
  }

  // Body sections.
  const chunks = [];
  const occasions = [];
  let occasionsTitle, occasionsTitleScript;

  for (const sec of body.childNodes) {
    if (sec.nodeType !== 1 || sec.rawTagName !== 'section') continue;
    const cls = sec.getAttribute('class') || '';
    if (/\b(page-header|related|cta-final)\b/.test(cls)) continue;

    const container = sec.querySelector(':scope > .container') || sec;
    const inner = container.childNodes.filter((n) => n.nodeType === 1);

    // Section owned wholesale by an island.
    const ownedBy = Object.entries(WIDGETS).find(
      ([key, comp]) =>
        WIDGETS_OWNING_SECTION.has(comp) &&
        (cls.includes(key) || sec.querySelector(`#${key}, .${key}`))
    );
    if (ownedBy) {
      used.add(ownedBy[1]);
      chunks.push(`<${ownedBy[1]} />`);
      continue;
    }

    // A service page's "Perfect for" band becomes structured frontmatter.
    //
    // Match on the *item* class, not the container: the long-form pages also
    // use `<ul class="occasion-list">` for ordinary bulleted prose, and keying
    // off the container swallowed those whole sections. Only the services
    // collection has an `occasions` field, so articles keep theirs inline.
    const occList =
      hoistOccasions && sec.querySelector('.occasion-list__item')
        ? sec.querySelector('.occasion-list')
        : null;
    if (occList) {
      const headEl = sec.querySelector('.section-head');
      const { main, script } = splitScript(headEl?.querySelector('h2'));
      occasionsTitle = main;
      occasionsTitleScript = script;
      occasions.push(
        ...occList.querySelectorAll('.occasion-list__item').map((i) => ({
          title: text(i.querySelector('h4')),
          body: text(i.querySelector('p')),
        }))
      );
      continue;
    }

    const variant = /\bexperience\b/.test(cls)
      ? 'experience'
      : /\boffers\b/.test(cls)
        ? 'offers'
        : 'plain';

    const parts = [];
    for (const el of inner) {
      let r;
      try {
        r = convBlock(el, { file });
      } catch (err) {
        // Never drop content silently: fall back to a plain markdown
        // conversion and shout, so an unhandled markup shape is visible.
        conversionWarnings.push(
          `${file}: ${el.rawTagName}.${el.getAttribute('class') || ''} — ${err.message}; kept as plain markdown`
        );
        r = md(el);
      }
      if (r) parts.push(r);
    }
    if (!parts.length) continue;

    if (variant === 'plain') {
      used.add('Section');
      chunks.push(`<Section>\n${indent(parts.join('\n\n'))}\n</Section>`);
    } else {
      used.add('Section');
      chunks.push(
        `<Section variant="${variant}">\n${indent(parts.join('\n\n'))}\n</Section>`
      );
    }
  }

  return {
    file,
    frontmatter: {
      title,
      description,
      path,
      ogImage: ogImage || undefined,
      h1,
      h1Script,
      tagline,
      crumbs,
      related,
      cta,
      schema,
    },
    occasions,
    occasionsTitle,
    occasionsTitleScript,
    body: chunks.join('\n\n'),
  };
}

/* ------------------------------------------------------------------ */
/* Emit                                                                */
/* ------------------------------------------------------------------ */
const COMPONENT_PATHS = {
  SplitRow: '../../components/SplitRow.astro',
  StoryBlock: '../../components/StoryBlock.astro',
  FeatureRow: '../../components/FeatureRow.astro',
  SectionHead: '../../components/SectionHead.astro',
  Section: '../../components/Section.astro',
  OccasionList: '../../components/OccasionList.astro',
  CardGrid: '../../components/CardGrid.astro',
  Card: '../../components/Card.astro',
  FaqAccordion: '../../components/FaqAccordion.astro',
  CenterCta: '../../components/CenterCta.astro',
  ValueGrid: '../../components/ValueGrid.astro',
  MediaSplit: '../../components/MediaSplit.astro',
  PriceCalculator: '../../components/islands/PriceCalculator.astro',
  PromTimeline: '../../components/islands/PromTimeline.astro',
  Itinerary: '../../components/islands/Itinerary.astro',
  BasinMap: '../../components/islands/BasinMap.astro',
};

function emit(page, dir, extra = {}) {
  const converted = page;
  const fm = { ...converted.frontmatter, ...extra };
  const imports = [...page.usedComponents]
    .sort()
    .map((c) => `import ${c} from '${COMPONENT_PATHS[c]}';`)
    .join('\n');

  const out = `---\n${yaml(fm)}\n---\n\n${imports}\n\n${converted.body}\n`;
  const name = basename(page.file, '.html') + '.mdx';
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), out, 'utf8');
  return name;
}

if (!existsSync(LEGACY)) {
  console.error(`Legacy directory not found: ${LEGACY}`);
  process.exit(1);
}

for (const [file, cfg] of Object.entries(SERVICES)) {
  used.clear();
  const page = convertPage(file, { hoistOccasions: true });
  page.usedComponents = new Set(used);
  emit(page, join(OUT, 'services'), {
    order: cfg.order,
    cardTitle: page.frontmatter.h1 + (page.frontmatter.h1Script ? ' ' + page.frontmatter.h1Script : ''),
    cardBlurb: page.frontmatter.description,
    cardImage: cfg.image,
    badge: cfg.badge,
    featured: cfg.featured,
    occasionsTitle: page.occasionsTitle,
    occasionsTitleScript: page.occasionsTitleScript,
    occasions: page.occasions,
  });
  console.log(`services/  ${file}`);
}

for (const [file, kind] of Object.entries(ARTICLES)) {
  used.clear();
  const page = convertPage(file);
  page.usedComponents = new Set(used);
  emit(page, join(OUT, 'articles'), { kind });
  console.log(`articles/  ${file}  (${kind})`);
}

for (const file of LEGAL) {
  used.clear();
  const page = convertPage(file);
  page.usedComponents = new Set(used);
  emit(page, join(OUT, 'legal'));
  console.log(`legal/     ${file}`);
}

if (conversionWarnings.length) {
  console.log('\nUnrecognised blocks (content preserved as plain markdown):');
  conversionWarnings.forEach((w) => console.log(`  ${w}`));
}

if (missingOg.size) {
  console.log(
    `\nog:image files referenced but not present (fell back to the site default):\n  ${[...missingOg].sort().join('\n  ')}`
  );
}

console.log('\nDone.');
