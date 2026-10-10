// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/lib/site.js';

export default defineConfig({
  site: SITE.origin,

  trailingSlash: 'never',

  // No code samples anywhere on the site, and Shiki's inline styles fight the
  // CSP below.
  markdown: { syntaxHighlight: false },

  integrations: [
    mdx(),
    sitemap({
      // Legacy sitemap.xml listed exactly these pages. 404 was never indexed.
      filter: (page) => !page.includes('/404'),

      serialize(item) {
        // URLs match the canonicals: extensionless, homepage as "/". A
        // sitemap that disagrees with the canonical tag is a wasted crawl.
        const { pathname } = new URL(item.url);
        const path = pathname.replace(/\/$/, '') || '/';

        return {
          ...item,
          url: new URL(path, SITE.origin).href,
          changefreq: SITE.sitemapChangefreq[path] ?? 'monthly',
          priority: SITE.sitemapPriority[path] ?? 0.7,
        };
      },
    }),
  ],

  // URLS: format 'file' writes dist/weddings.html. Cloudflare Pages serves it
  // at /weddings and 308-redirects /weddings.html there, exactly as the legacy
  // site behaved, so old links keep working with no redirect map.
  build: { format: 'file' },

  // CSP lives in public/_headers, not Astro's security.csp. Astro's CSP adds
  // hashes for its own inline styles, and with any hash present browsers
  // ignore 'unsafe-inline' — which blocked every style="" attribute and the
  // styles Leaflet applies to the maps.
});
