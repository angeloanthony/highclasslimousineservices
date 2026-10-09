/* ============================================
   HIGH CLASS LIMOUSINE — shared site behaviour
   Ported from the legacy main.js. The Leaflet
   service-area map moved out into its own island
   (ServiceMap.astro) so only the contact page
   pays for it.
   ============================================ */

const ready = (fn) =>
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true })
    : fn();

ready(() => {
  // ── CUSTOM CURSOR ──────────────────────────
  const cursor = document.querySelector('.cursor');
  const cursorRing = document.querySelector('.cursor-ring');
  const isTouch = window.matchMedia('(hover: none)').matches;

  if (cursor && cursorRing && !isTouch) {
    // Tell CSS it's safe to hide the native cursor.
    // If this script never runs, the native cursor stays.
    document.documentElement.classList.add('has-custom-cursor');

    let activated = false;
    document.addEventListener(
      'mousemove',
      (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        cursorRing.style.left = e.clientX + 'px';
        cursorRing.style.top = e.clientY + 'px';
        if (!activated) {
          activated = true;
          cursor.classList.add('is-active');
          cursorRing.classList.add('is-active');
        }
      },
      { passive: true }
    );

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

    document
      .querySelectorAll('a, button, [role="button"], summary')
      .forEach((el) => {
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

  // ── MOBILE NAV ─────────────────────────────
  // The legacy markup opened this with an inline onclick attribute, which the
  // site's Content-Security-Policy now blocks. Same behaviour, bound properly.
  const navMenu = document.querySelector('.nav__menu');
  const navToggle = document.querySelector('.nav__toggle');
  if (navMenu && navToggle) {
    const setOpen = (open) => {
      navMenu.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!navMenu.classList.contains('is-open'));
    });

    document.addEventListener('click', (e) => {
      if (
        navMenu.classList.contains('is-open') &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        setOpen(false);
      }
    });

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        setOpen(false);
        navToggle.focus();
      }
    });
  }

  // ── SCROLL REVEAL ──────────────────────────
  const revealEls = document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger'
  );

  if (revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  // ── PARALLAX (data-parallax attr) ─────────
  const parallaxEls = document.querySelectorAll('[data-parallax]');

  if (parallaxEls.length) {
    let ticking = false;
    const handleParallax = () => {
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = `translateY(${center * speed}px)`;
      });
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(handleParallax);
          ticking = true;
        }
      },
      { passive: true }
    );
    handleParallax();
  }

  // ── VIDEO PLACEHOLDER (play on click) ─────
  document
    .querySelectorAll('.video-placeholder, .video-frame__placeholder')
    .forEach((placeholder) => {
      placeholder.addEventListener('click', () => {
        const wrap = placeholder.closest('.video-inner, .video-frame__inner');
        const src = placeholder.dataset.src;
        if (!wrap || !src) return;
        const iframe = document.createElement('iframe');
        iframe.src =
          src + (src.includes('?') ? '&' : '?') + 'autoplay=1&rel=0';
        iframe.allow = 'autoplay; fullscreen';
        iframe.allowFullscreen = true;
        wrap.appendChild(iframe);
        placeholder.style.display = 'none';
      });
    });

  // ── FAQ ACCORDION (one-open-at-a-time) ────
  document.querySelectorAll('.faq-item').forEach((item) => {
    const summary = item.querySelector('summary');
    if (!summary) return;

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = item.hasAttribute('open');

      document.querySelectorAll('.faq-item[open]').forEach((other) => {
        if (other !== item) other.removeAttribute('open');
      });

      if (isOpen) {
        item.removeAttribute('open');
      } else {
        item.setAttribute('open', '');
      }
    });
  });
});
