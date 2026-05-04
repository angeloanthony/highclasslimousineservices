/* ============================================
   HIGH CLASS LIMOUSINE — main.js
   Shared across all pages
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── CUSTOM CURSOR ──────────────────────────
  const cursor     = document.querySelector('.cursor');
  const cursorRing = document.querySelector('.cursor-ring');
  const isTouch    = window.matchMedia('(hover: none)').matches;

  if (cursor && cursorRing && !isTouch) {
    // Tell CSS it's safe to hide the native cursor.
    // If this script never runs, the native cursor stays.
    document.documentElement.classList.add('has-custom-cursor');

    let activated = false;
    document.addEventListener('mousemove', e => {
      cursor.style.left     = e.clientX + 'px';
      cursor.style.top      = e.clientY + 'px';
      cursorRing.style.left = e.clientX + 'px';
      cursorRing.style.top  = e.clientY + 'px';
      if (!activated) {
        activated = true;
        cursor.classList.add('is-active');
        cursorRing.classList.add('is-active');
      }
    }, { passive: true });

    // Hide custom cursor when mouse leaves the window
    document.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-active');
      cursorRing.classList.remove('is-active');
    });
    document.addEventListener('mouseenter', () => {
      if (activated) {
        cursor.classList.add('is-active');
        cursorRing.classList.add('is-active');
      }
    });

    document.querySelectorAll('a, button, [role="button"], summary').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hovering');
        cursorRing.classList.add('is-hovering');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hovering');
        cursorRing.classList.remove('is-hovering');
      });
    });
  }

  // ── NAV SCROLL STATE ───────────────────────
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () =>
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── MOBILE NAV — close on outside click ───
  const navMenu   = document.querySelector('.nav__menu');
  const navToggle = document.querySelector('.nav__toggle');
  if (navMenu && navToggle) {
    document.addEventListener('click', e => {
      if (navMenu.classList.contains('is-open') &&
          !navMenu.contains(e.target) &&
          !navToggle.contains(e.target)) {
        navMenu.classList.remove('is-open');
      }
    });
    // Close menu when a link is clicked
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
      });
    });
  }

  // ── SCROLL REVEAL ──────────────────────────
  const revealEls = document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger'
  );

  if (revealEls.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach(el => observer.observe(el));
  }

  // ── PARALLAX (data-parallax attr) ─────────
  const parallaxEls = document.querySelectorAll('[data-parallax]');

  if (parallaxEls.length) {
    let ticking = false;
    const handleParallax = () => {
      parallaxEls.forEach(el => {
        const speed  = parseFloat(el.dataset.parallax) || 0.3;
        const rect   = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = `translateY(${center * speed}px)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(handleParallax);
        ticking = true;
      }
    }, { passive: true });
    handleParallax();
  }

  // ── VIDEO PLACEHOLDER (play on click) ─────
  document.querySelectorAll('.video-placeholder, .video-frame__placeholder')
    .forEach(placeholder => {
      placeholder.addEventListener('click', () => {
        const wrap = placeholder.closest('.video-inner, .video-frame__inner');
        const src  = placeholder.dataset.src;
        if (!wrap || !src) return;
        const iframe = document.createElement('iframe');
        iframe.src             = src + (src.includes('?') ? '&' : '?') + 'autoplay=1&rel=0';
        iframe.allow           = 'autoplay; fullscreen';
        iframe.allowFullscreen = true;
        wrap.appendChild(iframe);
        placeholder.style.display = 'none';
      });
    });

  // ── FAQ ACCORDION (one-open-at-a-time) ────
  document.querySelectorAll('.faq-item').forEach(item => {
    const summary = item.querySelector('summary');
    if (!summary) return;

    summary.addEventListener('click', e => {
      e.preventDefault();
      const isOpen = item.hasAttribute('open');

      document.querySelectorAll('.faq-item[open]').forEach(other => {
        if (other !== item) other.removeAttribute('open');
      });

      if (isOpen) {
        item.removeAttribute('open');
      } else {
        item.setAttribute('open', '');
      }
    });
  });

  // ── SERVICE AREA MAP (contact page only) ──
  // Only runs when #serviceMap exists. Leaflet must load before main.js.
  const mapEl = document.getElementById('serviceMap');
  if (mapEl && typeof L !== 'undefined') {

    const map = L.map('serviceMap', {
      center: [40.455, -109.528],
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: false   // click map to enable
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const goldIcon = L.divIcon({
      className: 'map-marker',
      html: '<div class="map-marker__dot"></div><div class="map-marker__ring"></div>',
      iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -14]
    });
    const homeIcon = L.divIcon({
      className: 'map-marker map-marker--home',
      html: '<div class="map-marker__dot"></div><div class="map-marker__ring"></div>',
      iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -18]
    });

    const locations = [
      { name: 'Vernal, Utah',              lat: 40.4555, lng: -109.5287, note: 'Home base — High Class Limousine Services', home: true },
      { name: 'Roosevelt, Utah',            lat: 40.2997, lng: -109.9988, note: 'Uintah Basin service' },
      { name: 'Duchesne, Utah',             lat: 40.1630, lng: -110.4007, note: 'Uintah Basin service' },
      { name: 'Dinosaur, Colorado',         lat: 40.2430, lng: -109.0148, note: 'Cross-border service' },
      { name: 'Flaming Gorge',              lat: 40.9155, lng: -109.4204, note: 'Scenic tours & recreational runs' },
      { name: 'Dinosaur National Monument', lat: 40.4375, lng: -108.9869, note: 'Scenic Utah tours' },
      { name: 'Salt Lake City',             lat: 40.7608, lng: -111.8910, note: 'SLC International Airport transfers' },
      { name: 'Price, Utah',                lat: 39.5994, lng: -110.8107, note: 'Extended service area' },
      { name: 'Moab, Utah',                 lat: 38.5733, lng: -109.5498, note: 'Extended service area' }
    ];

    locations.forEach(loc => {
      L.marker([loc.lat, loc.lng], { icon: loc.home ? homeIcon : goldIcon })
        .bindPopup(
          `<div class="map-popup"><strong>${loc.name}</strong><span>${loc.note}</span></div>`,
          { className: 'map-popup-wrap', maxWidth: 220 }
        )
        .addTo(map);
    });

    // Dashed gold service area polygon
    L.polygon([
      [41.2, -110.8], [41.2, -108.5], [40.1, -108.5],
      [38.3, -109.8], [39.3, -111.6], [40.8, -112.1], [41.0, -111.5]
    ], {
      color: '#d4b97f', fillColor: '#b89d5e',
      fillOpacity: 0.07, weight: 1.5,
      dashArray: '6 4', opacity: 0.45
    }).addTo(map);

    map.on('click',    () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());
  }

});