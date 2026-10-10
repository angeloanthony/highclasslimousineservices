/**
 * Single source of truth for business facts that were previously duplicated
 * across 34 hand-maintained HTML files (phone number appeared 100+ times).
 */
export const SITE = {
  origin: 'https://highclasslimousineservices.com',
  name: 'High Class Limousine Services',
  shortName: 'High Class',
  tagline: "Class Isn't Extinct.",
  phone: '(435) 219-9447',
  phoneHref: 'tel:+14352199447',
  phoneSchema: '+1-435-219-9447',
  email: 'info@highclasslimousineservices.com',
  themeColor: '#0f1626',
  locale: 'en_US',
  defaultOgImage: '/images/og-home.webp',
  address: {
    locality: 'Vernal',
    region: 'UT',
    postalCode: '84078',
    country: 'US',
  },
  areaServed: [
    'Vernal',
    'Uintah Basin',
    'Roosevelt',
    'Duchesne',
    'Jensen',
    'Dinosaur National Monument',
  ],

  /** Primary nav — was copy-pasted into every page. */
  nav: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    {
      label: 'Services',
      href: '/services',
      children: [
        { label: 'Weddings', href: '/weddings' },
        { label: 'Proms & School Events', href: '/prom' },
        { label: 'Airport Transportation', href: '/airport' },
        { label: 'Corporate Travel', href: '/corporate' },
        { label: 'Parties & Events', href: '/parties' },
        { label: 'Scenic Utah Tours', href: '/tours' },
      ],
    },
    { label: 'Gallery', href: '/gallery' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ],

  footerExplore: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ],

  footerServices: [
    { label: 'Weddings', href: '/weddings' },
    { label: 'Proms', href: '/prom' },
    { label: 'Airport', href: '/airport' },
    { label: 'Corporate', href: '/corporate' },
    { label: 'Parties', href: '/parties' },
    { label: 'Tours', href: '/tours' },
  ],

  /** Carried over verbatim from the legacy sitemap.xml so crawl priorities don't shift. */
  sitemapPriority: {
    '/': 1.0,
    '/limousine-service-vernal-utah': 1.0,
    '/services': 0.9,
    '/weddings': 0.9,
    '/prom': 0.9,
    '/airport': 0.9,
    '/corporate': 0.9,
    '/parties': 0.9,
    '/tours': 0.9,
    '/vernal-to-slc-airport-limo': 0.9,
    '/medical-appointment-transportation-vernal': 0.85,
    '/bachelorette-party-limo-vernal': 0.85,
    '/bachelor-party-limo-vernal': 0.85,
    '/oilfield-executive-transportation-vernal': 0.85,
    '/wine-tour-limo-vernal-utah': 0.85,
    '/funeral-limousine-vernal': 0.85,
    '/limo-near-dinosaur-national-monument': 0.85,
    '/limo-service-flaming-gorge': 0.85,
    '/limo-service-roosevelt-utah': 0.85,
    '/limo-service-duchesne-utah': 0.85,
    '/prom-limo-uintah-high-school': 0.85,
    '/wedding-limo-uintah-basin': 0.85,
    '/how-much-does-a-limo-cost-in-vernal': 0.85,
    '/things-to-do-in-vernal-utah': 0.75,
    '/vernal-wedding-venues-guide': 0.75,
    '/how-to-plan-a-prom-night-vernal': 0.75,
    '/flaming-gorge-scenic-drive-guide': 0.75,
    '/about': 0.7,
    '/gallery': 0.7,
    '/faq': 0.7,
    '/contact': 0.7,
    '/privacy': 0.3,
    '/terms': 0.3,
  },

  sitemapChangefreq: {
    '/': 'weekly',
    '/limousine-service-vernal-utah': 'weekly',
    '/about': 'yearly',
    '/contact': 'yearly',
    '/privacy': 'yearly',
    '/terms': 'yearly',
  },
};

/** LimousineService node reused by every per-page schema graph. */
export const providerNode = {
  '@type': 'LimousineService',
  name: SITE.name,
  telephone: SITE.phoneSchema,
  address: {
    '@type': 'PostalAddress',
    addressLocality: SITE.address.locality,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postalCode,
    addressCountry: SITE.address.country,
  },
  url: SITE.origin,
};

export const abs = (path) => new URL(path, SITE.origin).href;
