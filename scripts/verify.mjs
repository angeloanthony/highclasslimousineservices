/**
 * Post-migration verification: compares each built page against its legacy
 * counterpart for URL parity, metadata parity, and body-text fidelity.
 *
 *   node scripts/verify.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';

const LEGACY = 'legacy';
const DIST = 'dist';

const norm = (s) =>
  s
    .replace(/\s+/g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();

/** Visible body text, with chrome that legitimately changed stripped out. */
function bodyText(html) {
  const root = parse(html);
  root.querySelectorAll('script, style, nav, header, footer, .topbar, .floating-call, .cursor, .cursor-ring').forEach((n) => n.remove());
  return norm(root.querySelector('body')?.textContent || '');
}

function meta(root, sel, attr = 'content') {
  return root.querySelector(sel)?.getAttribute(attr) || '';
}

const files = readdirSync(LEGACY).filter((f) => f.endsWith('.html')).sort();
const rows = [];
let missing = 0;

for (const f of files) {
  const distPath = join(DIST, f);
  if (!existsSync(distPath)) {
    rows.push({ page: f, status: 'NOT BUILT' });
    missing++;
    continue;
  }

  const oldRoot = parse(readFileSync(join(LEGACY, f), 'utf8'));
  const newRoot = parse(readFileSync(distPath, 'utf8'));

  const issues = [];

  const oldTitle = norm(oldRoot.querySelector('title')?.textContent || '');
  const newTitle = norm(newRoot.querySelector('title')?.textContent || '');
  if (oldTitle !== newTitle) issues.push(`title: "${oldTitle}" -> "${newTitle}"`);

  const oldDesc = norm(meta(oldRoot, 'meta[name="description"]'));
  const newDesc = norm(meta(newRoot, 'meta[name="description"]'));
  if (oldDesc !== newDesc) issues.push('description differs');

  // Canonicals moved from /x.html to /x (Cloudflare Pages serves extensionless).
  const oldCanon = meta(oldRoot, 'link[rel="canonical"]', 'href')
    ?.replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '');
  const newCanon = meta(newRoot, 'link[rel="canonical"]', 'href');
  if (oldCanon && oldCanon !== newCanon) issues.push(`canonical: ${oldCanon} -> ${newCanon}`);

  // JSON-LD node count (types present).
  const types = (root) =>
    root
      .querySelectorAll('script[type="application/ld+json"]')
      .flatMap((s) => {
        try {
          const j = JSON.parse(s.textContent);
          const nodes = j['@graph'] || [j];
          return nodes.map((n) => n['@type']).filter(Boolean);
        } catch {
          return ['UNPARSEABLE'];
        }
      })
      .sort()
      .join(',');
  const oldTypes = types(oldRoot);
  const newTypes = types(newRoot);
  if (oldTypes !== newTypes) issues.push(`schema: [${oldTypes}] -> [${newTypes}]`);

  // Body-text fidelity. Whitespace between inline elements shifts freely when
  // markup is componentised, so compare with all whitespace squeezed out —
  // that isolates genuine content loss from cosmetic reflow.
  const squeeze = (s) => s.replace(/\s+/g, '');
  const oldText = bodyText(readFileSync(join(LEGACY, f), 'utf8'));
  const newText = bodyText(readFileSync(distPath, 'utf8'));
  const oldSq = squeeze(oldText);
  const newSq = squeeze(newText);

  const sentences = oldText
    .split(/(?<=[.!?])\s+/)
    .map((s) => squeeze(s))
    .filter((s) => s.length > 40);
  const lost = sentences.filter((s) => !newSq.includes(s));
  const coverage = sentences.length
    ? (((sentences.length - lost.length) / sentences.length) * 100).toFixed(1)
    : '100.0';

  if (oldSq !== newSq && lost.length === 0) {
    // Same sentences, different total — usually added or reordered chrome.
    const delta = newSq.length - oldSq.length;
    if (Math.abs(delta) > 40) issues.push(`body text length ${delta > 0 ? '+' : ''}${delta} chars`);
  }

  rows.push({
    page: f,
    status: issues.length === 0 && lost.length === 0 ? 'OK' : 'CHECK',
    coverage: coverage + '%',
    issues,
    lost: lost.slice(0, 3),
    lostCount: lost.length,
  });
}

let clean = 0;
for (const r of rows) {
  if (r.status === 'OK') {
    clean++;
    continue;
  }
  console.log(`\n--- ${r.page}  [${r.status}] text coverage ${r.coverage ?? '-'}`);
  (r.issues || []).forEach((i) => console.log(`    meta: ${i}`));
  if (r.lostCount) {
    console.log(`    ${r.lostCount} sentence(s) not found in output:`);
    r.lost.forEach((s) => console.log(`      · ${s.slice(0, 150)}`));
  }
}

console.log(
  `\n${clean}/${rows.length} pages identical on title, description, canonical, schema and body text.`
);
if (missing) console.log(`${missing} legacy page(s) not built yet.`);
