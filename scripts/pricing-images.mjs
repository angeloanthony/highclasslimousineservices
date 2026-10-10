// One-off: resized/cropped variants for the pricing-guide redesign
// (src/content/articles/how-much-does-a-limo-cost-in-vernal.mdx).
// Sources are existing site images; crops trim baked-in headline text from
// the marketing graphics so only the photograph shows. Re-run with
// `node scripts/pricing-images.mjs` if a source image changes.
import sharp from 'sharp';

const OUT = 'public/images/pricing';
const jobs = [
  // [output, source, width, extract {left, top, width, height} | null]
  ['hero-1600', '4', 1586, null],
  ['hero-800', '4', 800, null],
  ['interior', 'hero-poster', 1000, null],
  ['stretch', '3', 720, null],
  ['stretch-xl', 'gallery-10', 720, { left: 0, top: 120, width: 1402, height: 880 }],
  ['wedding', 'wedding-1', 720, null],
  ['prom', 'service-prom', 720, { left: 330, top: 325, width: 1100, height: 500 }],
  ['airport', 'airport-2', 720, { left: 60, top: 300, width: 1300, height: 640 }],
  ['party', 'Limousine Rides', 720, null],
  ['gorge', 'tour-1a', 720, { left: 340, top: 390, width: 1000, height: 500 }],
  ['dinosaur', '5', 720, { left: 990, top: 170, width: 550, height: 600 }],
  ['funeral', 'page-header', 720, { left: 0, top: 0, width: 900, height: 769 }],
  ['wine', 'gallery-6', 720, { left: 0, top: 160, width: 1402, height: 880 }],
  ['quote', '3', 900, null],
];

for (const [out, src, width, extract] of jobs) {
  let img = sharp(`public/images/${src}.webp`);
  if (extract) img = img.extract(extract);
  const info = await img.resize({ width }).webp({ quality: 74 }).toFile(`${OUT}/${out}.webp`);
  console.log(`${out}.webp`.padEnd(18), `${info.width}x${info.height}`, `${(info.size / 1024) | 0}K`);
}
