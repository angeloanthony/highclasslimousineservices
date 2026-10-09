/**
 * ONE-OFF: lift the repeated, hand-duplicated data out of the legacy pages
 * into JSON data collections (FAQ items, testimonials, gallery slides).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';

const LEGACY = 'legacy';
const read = (f) => parse(readFileSync(join(LEGACY, f), 'utf8'));
const clean = (s) => s.replace(/\s+/g, ' ').trim();
const slug = (s) =>
  clean(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

/* ---- FAQ ---- */
const faqDoc = read('faq.html');
const faqs = faqDoc.querySelectorAll('.faq-item').map((d) => ({
  id: slug(d.querySelector('summary').textContent),
  q: clean(d.querySelector('summary').textContent),
  a: clean(d.querySelector('.faq-answer').textContent),
  schema: true,
}));
writeFileSync('src/content/faqs.json', JSON.stringify(faqs, null, 2) + '\n');

/* ---- Testimonials ---- */
const home = read('index.html');
const testimonials = home.querySelectorAll('.testimonial').map((t) => {
  const authorEl = t.querySelector('.testimonial__author');
  const roleEl = t.querySelector('.testimonial__role');
  const role = clean(roleEl?.textContent || '');
  // The author name is the text node before the nested role span.
  const author = clean(authorEl.textContent.replace(role, ''));
  return {
    id: slug(author),
    quote: clean(t.querySelector('.testimonial__text').textContent),
    author,
    role,
    stars: (t.querySelector('.testimonial__stars')?.textContent.match(/★/g) || []).length || 5,
  };
});
writeFileSync('src/content/testimonials.json', JSON.stringify(testimonials, null, 2) + '\n');

/* ---- Gallery ---- */
const gal = read('gallery.html');
const galleryImages = gal.querySelectorAll('.carousel__slide').map((s, i) => {
  const img = s.querySelector('img');
  const src = '/' + img.getAttribute('src').replace(/^\.?\//, '').replace(/\.(jpg|jpeg|png)$/i, '.webp');
  return {
    id: `slide-${String(i + 1).padStart(2, '0')}`,
    src,
    alt: clean(img.getAttribute('alt')),
    category: s.getAttribute('data-cat'),
    categoryLabel: clean(s.querySelector('.carousel__cat').textContent),
    caption: clean(s.querySelector('.carousel__title').textContent),
  };
});
writeFileSync('src/content/gallery.json', JSON.stringify(galleryImages, null, 2) + '\n');

console.log(
  `faqs: ${faqs.length}, testimonials: ${testimonials.length}, gallery: ${galleryImages.length}`
);
