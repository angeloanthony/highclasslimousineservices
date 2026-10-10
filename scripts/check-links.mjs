/**
 * Post-build link/asset audit over dist/:
 *   - every internal href resolves to a built page
 *   - every referenced image/asset exists on disk
 *
 *   node scripts/check-links.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parse } from 'node-html-parser';

const DIST = 'dist';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(DIST);
const pages = allFiles.filter((f) => extname(f) === '.html');
const cssFiles = allFiles.filter((f) => extname(f) === '.css');

const brokenLinks = new Map();
const brokenAssets = new Map();

const record = (map, key, page) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(page);
};

/** Does a site-absolute path exist in dist? */
function resolves(p) {
  const clean = decodeURIComponent(p.split('#')[0].split('?')[0]);
  if (clean === '' || clean === '/') return existsSync(join(DIST, 'index.html'));
  const target = join(DIST, clean);
  if (existsSync(target)) return true;
  // extensionless route -> file.html or dir/index.html
  return existsSync(target + '.html') || existsSync(join(target, 'index.html'));
}

for (const page of pages) {
  const rel = page.replace(/\\/g, '/').replace(`${DIST}/`, '/');
  const root = parse(readFileSync(page, 'utf8'));

  for (const a of root.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (!href || /^(https?:|tel:|mailto:|#|javascript:|data:)/.test(href)) continue;
    if (!resolves(href)) record(brokenLinks, href, rel);
  }

  const assetSelectors = [
    ['img[src]', 'src'],
    ['script[src]', 'src'],
    ['link[href]', 'href'],
    ['source[src]', 'src'],
    ['video[poster]', 'poster'],
  ];
  for (const [sel, attr] of assetSelectors) {
    for (const el of root.querySelectorAll(sel)) {
      const v = el.getAttribute(attr);
      if (!v || /^(https?:|data:|#|mailto:)/.test(v)) continue;
      if (!resolves(v)) record(brokenAssets, v, rel);
    }
  }

  // Inline style="background-image:url(...)"
  for (const el of root.querySelectorAll('[style]')) {
    const m = [...el.getAttribute('style').matchAll(/url\(['"]?([^)'"]+)/g)];
    for (const [, url] of m) {
      if (/^(https?:|data:)/.test(url)) continue;
      if (!resolves(url)) record(brokenAssets, url, rel);
    }
  }
}

// Bundled CSS asset references.
for (const css of cssFiles) {
  const text = readFileSync(css, 'utf8');
  for (const [, url] of text.matchAll(/url\(['"]?([^)'"]+)/g)) {
    if (/^(https?:|data:|#)/.test(url)) continue;
    if (!resolves(url)) record(brokenAssets, url, css.replace(/\\/g, '/'));
  }
}

const report = (title, map) => {
  if (map.size === 0) {
    console.log(`${title}: none`);
    return 0;
  }
  console.log(`\n${title}: ${map.size}`);
  for (const [target, srcs] of [...map].sort()) {
    const list = [...srcs];
    console.log(`  ${target}`);
    console.log(`      on ${list.slice(0, 4).join(', ')}${list.length > 4 ? ` (+${list.length - 4} more)` : ''}`);
  }
  return map.size;
};

console.log(`Audited ${pages.length} pages and ${cssFiles.length} stylesheets in ${DIST}/\n`);
const a = report('Broken internal links', brokenLinks);
const b = report('Missing assets', brokenAssets);

if (a + b > 0) process.exitCode = 1;
