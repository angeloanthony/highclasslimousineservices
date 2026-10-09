import type { APIRoute } from 'astro';
import { SITE } from '../lib/site.js';

/**
 * @astrojs/sitemap emits /sitemap-index.xml, but the legacy site published
 * /sitemap.xml — that's the URL submitted to Search Console and referenced by
 * robots.txt. Keep it alive as a sitemap index so nothing has to be
 * re-submitted and no external reference breaks.
 */
export const GET: APIRoute = () => {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE.origin}/sitemap-0.xml</loc></sitemap>
</sitemapindex>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
