import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

/**
 * Shared page-level SEO + chrome fields. Validated at build time so a bad
 * canonical or a missing description fails the build instead of shipping.
 */
const crumb = z.object({
  label: z.string(),
  href: z.string().optional(),
});

const relatedItem = z.object({
  href: z.string(),
  title: z.string(),
  blurb: z.string(),
});

const pageBase = {
  /**
   * Becomes the <title> and the og/twitter title.
   *
   * The bounds are deliberately the hard ceilings, not the ideal targets
   * (~60 for titles, ~160 for descriptions). Several live pages already run
   * longer, and this migration is an infrastructure port — rewriting ranking
   * pages' metadata is a separate, deliberate decision. These limits exist to
   * catch a genuinely broken entry, not to enforce copy style.
   */
  title: z.string().min(10).max(80),
  description: z.string().min(50).max(220),
  /** Extensionless live URL path, e.g. "/weddings". */
  path: z.string().regex(/^\/[a-z0-9-]+$/, 'must be an extensionless /slug path'),
  ogImage: z.string().startsWith('/images/').optional(),

  h1: z.string(),
  h1Script: z.string().optional(),
  tagline: z.string().optional(),
  crumbs: z.array(crumb).default([]),

  related: z.array(relatedItem).default([]),

  cta: z
    .object({
      title: z.string(),
      titleScript: z.string().optional(),
      sub: z.string().optional(),
      primaryLabel: z.string().optional(),
      primaryHref: z.string().optional(),
      secondaryLabel: z.string().optional(),
      secondaryHref: z.string().optional(),
    })
    .optional(),

  /** Raw JSON-LD nodes, carried over verbatim from the legacy pages. */
  schema: z.array(z.record(z.string(), z.any())).default([]),

  /** Extra stylesheets / scripts a bespoke page needs (Leaflet, Cal.com). */
  leaflet: z.boolean().default(false),
};

/** The six core service pages linked from the nav dropdown. */
const services = defineCollection({
  loader: glob({ base: './src/content/services', pattern: '**/*.mdx' }),
  schema: z.object({
    ...pageBase,
    /** Nav/card ordering, 01–06. */
    order: z.number().int().min(1).max(6),
    /** Card copy reused on the services hub and the homepage. */
    cardTitle: z.string(),
    cardBlurb: z.string(),
    cardImage: z.string().startsWith('/images/'),
    badge: z.string().optional(),
    featured: z.boolean().default(false),
    occasionsTitle: z.string().default('Perfect'),
    occasionsTitleScript: z.string().default('for'),
    occasions: z
      .array(z.object({ title: z.string(), body: z.string() }))
      .default([]),
  }),
});

/**
 * Everything long-form: the pillar page, location pages, intent pages,
 * and the visitor guides.
 */
const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.mdx' }),
  schema: z.object({
    ...pageBase,
    kind: z.enum(['pillar', 'location', 'intent', 'guide']),
  }),
});

/** Privacy policy and terms. */
const legal = defineCollection({
  loader: glob({ base: './src/content/legal', pattern: '**/*.mdx' }),
  schema: z.object(pageBase),
});

/**
 * Data-only collections. These were duplicated as hand-written HTML *and*
 * hand-written JSON-LD on the legacy site — the two drifted apart. Now one
 * source feeds both.
 */
const faqs = defineCollection({
  loader: file('./src/content/faqs.json'),
  schema: z.object({
    id: z.string(),
    q: z.string(),
    a: z.string(),
    /** Included in the FAQPage JSON-LD graph. */
    schema: z.boolean().default(true),
  }),
});

const testimonials = defineCollection({
  loader: file('./src/content/testimonials.json'),
  schema: z.object({
    id: z.string(),
    quote: z.string(),
    author: z.string(),
    role: z.string(),
    stars: z.number().int().min(1).max(5).default(5),
  }),
});

const galleryImages = defineCollection({
  loader: file('./src/content/gallery.json'),
  schema: z.object({
    id: z.string(),
    src: z.string().startsWith('/images/'),
    alt: z.string(),
    category: z.enum(['exterior', 'interior', 'events', 'vernal', 'brand']),
    categoryLabel: z.string(),
    caption: z.string(),
  }),
});

export const collections = { services, articles, legal, faqs, testimonials, galleryImages };
