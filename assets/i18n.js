/* ivan.es — bilingual EN/ES toggle
 * ─────────────────────────────────
 * Architecture:
 *   • Strings dictionary keyed by string ID, indexed by language (en/es).
 *   • Elements declare keys via data-i18n attributes:
 *       data-i18n="key"               → updates textContent
 *       data-i18n-html="key"          → updates innerHTML (for strings with markup)
 *       data-i18n-attr="attr:key,..." → updates one or more attributes
 *   • <html data-i18n-title="key">    → updates document.title
 *   • <meta data-i18n-content="key">  → updates the meta's content attribute
 *   • localStorage persists the user's choice; navigator.language seeds the
 *     default on first visit (Spain audience → es). The user's explicit
 *     toggle always overrides browser language.
 *   • <html lang> updated on every render; an inline bootstrap script in
 *     each page <head> sets lang BEFORE first paint (anti-FOUC).
 *   • Language toggle UI — desktop nav has a dropdown trigger; mobile
 *     menu-sheet has two pill buttons. Both share data-set-lang="X" hook.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'ivanes.lang';
  const SUPPORTED = ['en', 'es'];
  const FALLBACK = 'en';

  /* ═══════════════════════ STRINGS DICTIONARY ═══════════════════════ */
  const STRINGS = {
    en: {
      // ─── nav (shared across pages) ───
      'nav.aromazla': 'Aromazla',
      'nav.visuanza': 'Visuanza',
      'nav.contact': 'Contact',
      'nav.home.aria': 'Home',
      'nav.openMenu.aria': 'Open navigation',
      'nav.changeLanguage.aria': 'Change language',
      'nav.lang.english': 'English',
      'nav.lang.spanish': 'Español',

      // ─── index ───
      'index.meta.title': 'Iván Alzamora — Madrid',
      'index.meta.description': 'Iván Alzamora — freelancer, builder, operations at Visuanza, jewelry under Aromazla. Madrid, Spain.',
      'index.meta.ogTitle': 'Iván Alzamora',
      'index.meta.ogDescription': 'Builder. Operations at Visuanza. Jewelry under Aromazla. Madrid.',
      'index.heroCue.aromazla': 'Aromazla',

      // ─── aromazla ───
      'aroma.meta.title': 'Aromazla — Jewellery by Iván Alzamora',
      'aroma.meta.description': 'Aromazla — symbolic jewellery forged in gold, set with certified stones. Made once. By Iván Alzamora, Madrid.',
      'aroma.meta.ogTitle': 'Aromazla — Jewellery by Iván Alzamora',
      'aroma.meta.ogDescription': 'Symbolic art forged in gold and set with certified precious stones. Made once.',
      'aroma.pageCue.pieces': 'Pieces',
      'aroma.pageLede': 'Symbolic art forged in gold and set with certified precious stones. <em>Wearable meaning, made once.</em>',
      'aroma.pieces.heading': 'Pieces',
      'aroma.pieces.num': 'selected · ongoing',
      'aroma.piece.p1.name': 'Yellow Sapphire <em>·</em> pendant',
      'aroma.stones.heading': 'Stones',
      'aroma.stones.num': 'loose · certified',
      'aroma.stones.diamond.name': 'Diamond',
      'aroma.stones.ruby.name': 'Ruby',
      'aroma.stones.aquamarine.name': 'Aquamarine',
      'aroma.stones.diamond.pill': '4 photos · 1 video · IGI',
      'aroma.stones.ruby.pill': '4 photos · 1 video · GIA',
      'aroma.stones.aquamarine.pill': '1 photo · 1 video · IGE',
      'aroma.commission.eyebrow.a': 'Commission',
      'aroma.commission.eyebrow.b': 'per request',
      'aroma.commission.heading': '<span class="commission-h2-line">Custom pieces,</span> <span class="commission-h2-line">made <em>to order</em>.</span>',
      'aroma.commission.body': 'If you want a custom piece, get in touch. Commissions usually take six to eight weeks.',
      'aroma.lightbox.close.aria': 'Close gallery',
      'aroma.lightbox.prev.aria': 'Previous image',
      'aroma.lightbox.next.aria': 'Next image',
      'aroma.lightbox.thumbs.aria': 'Gallery thumbnails',

      // ─── contact ───
      'contact.meta.title': 'Contact — Iván Alzamora',
      'contact.meta.description': 'Reach Iván Alzamora directly — Instagram @ivan.alzam, WhatsApp +34 646 853 773.',
      'contact.meta.ogTitle': 'Contact — Iván Alzamora',
      'contact.meta.ogDescription': "Let's talk. Instagram @ivan.alzam · WhatsApp +34 646 853 773.",
      'contact.eyebrow': 'Contact · direct',
      'contact.title': "Let's talk",
      'contact.lede': "For commissions, collaborations, or just to say hi — <em>I'm here</em>.",
      'contact.card.instagram': 'Instagram',
      'contact.card.whatsapp': 'WhatsApp',
      'contact.card.directMessages': 'Direct messages',
      'contact.card.directReply': 'Direct reply',

      // ─── p1 (Equinoccio) ───
      'p1.meta.title': 'Equinoccio — Yellow Sapphire Pendant — Aromazla',
      'p1.meta.description': 'No. 001 — Equinoccio. A natural yellow sapphire of 2.08 carats, set in 18k white gold and finished in rhodium. By Iván Alzamora.',
      'p1.meta.ogTitle': 'Equinoccio — Yellow Sapphire Pendant — Aromazla',
      'p1.meta.ogDescription': 'No. 001 — Equinoccio. Yellow sapphire pendant, 2.08 ct, 18k white gold rhodium plated. Made once.',
      'p1.hero.eyebrow': 'No. 001 · Pendant',
      'p1.hero.title.aria': 'Equinoccio',
      'p1.hero.sub': 'Yellow Sapphire · 2.08 ct · Sri Lanka · GIA',
      'p1.hero.lede': 'A natural yellow sapphire of 2.08 carats, set in 18k white gold and finished in rhodium.',
      'p1.scroll.cue': 'scroll',
      'p1.story.eyebrow': 'Story',
      'p1.story.line1': 'Winter dies for days of spring —<br>and what stands between is held.',
      'p1.story.line2': 'A cradle of white gold petals, in the line of art nouveau, holds the paradox.<br>Named <em>Equinoccio</em> for the threshold of the rebirth of nature — what was crystallized, now beginning to flow.',
      'p1.story.line3': '<em>Made once.</em>',
      'p1.specs.eyebrow': 'Specifications',
      'p1.specs.heading': 'Equinoccio',
      'p1.specs.label.stone': 'Stone',
      'p1.specs.value.stone': 'Yellow Sapphire',
      'p1.specs.label.carat': 'Carat',
      'p1.specs.value.carat': '2.08 ct',
      'p1.specs.label.cut': 'Cut',
      'p1.specs.value.cut': 'Oval',
      'p1.specs.label.setting': 'Setting',
      'p1.specs.value.setting': '18k white gold · rhodium plated',
      'p1.specs.label.origin': 'Origin',
      'p1.specs.value.origin': 'Sri Lanka',
      'p1.specs.note.origin': 'Per maker · origin not certified on report',
      'p1.specs.label.cert': 'Certificate',
      'p1.specs.value.cert': 'GIA',
      'p1.cert.eyebrow': 'Certificate',
      'p1.cert.aria': 'GIA report — Yellow Sapphire 2.08 ct',
      'p1.cert.fallback': 'Open GIA Report (PDF) — Yellow Sapphire, 2.08 ct',
      'p1.cert.meta': 'GIA · 2.08 ct',
      'p1.cert.openDownload': 'Open / download',
      'p1.cta.numero': 'No. 001',
      'p1.cta.eyebrow': 'A note on the chain',
      'p1.cta.note': '<em>Pendant only.</em> The chain is yours to choose — its length, its weight, the way it sits — and is priced alongside the piece.',
      'p1.cta.enquire': 'Enquire',
      'p1.cta.contact': 'Contact',
      'p1.cta.back': 'Back to pieces',
      'p1.cta.whatsappUrl': 'https://wa.me/34646853773?text=Hello%2C%20I%27m%20interested%20in%20Equinoccio%20(Yellow%20Sapphire%20pendant)',
    },

    es: {
      // ─── nav ───
      'nav.aromazla': 'Aromazla',
      'nav.visuanza': 'Visuanza',
      'nav.contact': 'Contacto',
      'nav.home.aria': 'Inicio',
      'nav.openMenu.aria': 'Abrir navegación',
      'nav.changeLanguage.aria': 'Cambiar idioma',
      'nav.lang.english': 'English',
      'nav.lang.spanish': 'Español',

      // ─── index ───
      'index.meta.title': 'Iván Alzamora — Madrid',
      'index.meta.description': 'Iván Alzamora — freelance, constructor, operaciones en Visuanza, joyería bajo Aromazla. Madrid, España.',
      'index.meta.ogTitle': 'Iván Alzamora',
      'index.meta.ogDescription': 'Constructor. Operaciones en Visuanza. Joyería bajo Aromazla. Madrid.',
      'index.heroCue.aromazla': 'Aromazla',

      // ─── aromazla ───
      'aroma.meta.title': 'Aromazla — Joyería de Iván Alzamora',
      'aroma.meta.description': 'Aromazla — joyería simbólica forjada en oro, engastada con piedras certificadas. Pieza única. Por Iván Alzamora, Madrid.',
      'aroma.meta.ogTitle': 'Aromazla — Joyería de Iván Alzamora',
      'aroma.meta.ogDescription': 'Arte simbólico forjado en oro y engastado con piedras preciosas certificadas. Pieza única.',
      'aroma.pageCue.pieces': 'Piezas',
      'aroma.pageLede': 'Arte simbólico forjado en oro y engastado con piedras preciosas certificadas. <em>Significado vestible, pieza única.</em>',
      'aroma.pieces.heading': 'Piezas',
      'aroma.pieces.num': 'selección · en curso',
      'aroma.piece.p1.name': 'Zafiro Amarillo <em>·</em> colgante',
      'aroma.stones.heading': 'Piedras',
      'aroma.stones.num': 'sueltas · certificadas',
      'aroma.stones.diamond.name': 'Diamante',
      'aroma.stones.ruby.name': 'Rubí',
      'aroma.stones.aquamarine.name': 'Aguamarina',
      'aroma.stones.diamond.pill': '4 fotos · 1 vídeo · IGI',
      'aroma.stones.ruby.pill': '4 fotos · 1 vídeo · GIA',
      'aroma.stones.aquamarine.pill': '1 foto · 1 vídeo · IGE',
      'aroma.commission.eyebrow.a': 'Encargo',
      'aroma.commission.eyebrow.b': 'a petición',
      'aroma.commission.heading': '<span class="commission-h2-line">Piezas a medida,</span> <span class="commission-h2-line">hechas <em>por encargo</em>.</span>',
      'aroma.commission.body': 'Si quieres una pieza a medida, escríbeme. Los encargos suelen tardar de seis a ocho semanas.',
      'aroma.lightbox.close.aria': 'Cerrar galería',
      'aroma.lightbox.prev.aria': 'Imagen anterior',
      'aroma.lightbox.next.aria': 'Imagen siguiente',
      'aroma.lightbox.thumbs.aria': 'Miniaturas de la galería',

      // ─── contact ───
      'contact.meta.title': 'Contacto — Iván Alzamora',
      'contact.meta.description': 'Contacta directamente con Iván Alzamora — Instagram @ivan.alzam, WhatsApp +34 646 853 773.',
      'contact.meta.ogTitle': 'Contacto — Iván Alzamora',
      'contact.meta.ogDescription': 'Hablemos. Instagram @ivan.alzam · WhatsApp +34 646 853 773.',
      'contact.eyebrow': 'Contacto · directo',
      'contact.title': 'Hablemos',
      'contact.lede': 'Para encargos, colaboraciones, o simplemente para saludar — <em>aquí estoy</em>.',
      'contact.card.instagram': 'Instagram',
      'contact.card.whatsapp': 'WhatsApp',
      'contact.card.directMessages': 'Mensajes directos',
      'contact.card.directReply': 'Respuesta directa',

      // ─── p1 (Equinoccio) ───
      'p1.meta.title': 'Equinoccio — Colgante de Zafiro Amarillo — Aromazla',
      'p1.meta.description': 'Nº 001 — Equinoccio. Un zafiro amarillo natural de 2,08 quilates, engastado en oro blanco de 18k con acabado en rodio. Por Iván Alzamora.',
      'p1.meta.ogTitle': 'Equinoccio — Colgante de Zafiro Amarillo — Aromazla',
      'p1.meta.ogDescription': 'Nº 001 — Equinoccio. Colgante de zafiro amarillo, 2,08 ct, oro blanco 18k con acabado en rodio. Pieza única.',
      'p1.hero.eyebrow': 'Nº 001 · Colgante',
      'p1.hero.title.aria': 'Equinoccio',
      'p1.hero.sub': 'Zafiro Amarillo · 2,08 ct · Sri Lanka · GIA',
      'p1.hero.lede': 'Un zafiro amarillo natural de 2,08 quilates, engastado en oro blanco de 18k con acabado en rodio.',
      'p1.scroll.cue': 'desliza',
      'p1.story.eyebrow': 'Historia',
      // STRICT — preserved verbatim per the README's translation note.
      // "morirá" (will die) gives Spanish prophetic weight that the literal
      // present tense "muere" would flatten.
      'p1.story.line1': 'El invierno morirá por días de primavera —<br>y lo que está entre medio queda sostenido.',
      'p1.story.line2': 'Un cáliz de pétalos de oro blanco, en la línea del art nouveau, sostiene la paradoja.<br>Llamado <em>Equinoccio</em> por el umbral del renacer de la naturaleza — lo que fue cristal, ahora comienza a fluir.',
      'p1.story.line3': '<em>Pieza única.</em>',
      'p1.specs.eyebrow': 'Especificaciones',
      'p1.specs.heading': 'Equinoccio',
      'p1.specs.label.stone': 'Piedra',
      'p1.specs.value.stone': 'Zafiro Amarillo',
      'p1.specs.label.carat': 'Quilates',
      'p1.specs.value.carat': '2,08 ct',
      'p1.specs.label.cut': 'Talla',
      'p1.specs.value.cut': 'Ovalada',
      'p1.specs.label.setting': 'Engaste',
      'p1.specs.value.setting': 'Oro blanco 18k · acabado en rodio',
      'p1.specs.label.origin': 'Origen',
      'p1.specs.value.origin': 'Sri Lanka',
      'p1.specs.note.origin': 'Según el creador · origen no certificado en informe',
      'p1.specs.label.cert': 'Certificado',
      'p1.specs.value.cert': 'GIA',
      'p1.cert.eyebrow': 'Certificado',
      'p1.cert.aria': 'Informe GIA — Zafiro Amarillo 2,08 ct',
      'p1.cert.fallback': 'Abrir informe GIA (PDF) — Zafiro Amarillo, 2,08 ct',
      'p1.cert.meta': 'GIA · 2,08 ct',
      'p1.cert.openDownload': 'Abrir / descargar',
      'p1.cta.numero': 'Nº 001',
      'p1.cta.eyebrow': 'Nota sobre la cadena',
      'p1.cta.note': '<em>Sólo el colgante.</em> Tú eliges la cadena — su longitud, su peso, su caída — y se cotiza junto con la pieza.',
      'p1.cta.enquire': 'Consultar',
      'p1.cta.contact': 'Contacto',
      'p1.cta.back': 'Volver a las piezas',
      'p1.cta.whatsappUrl': 'https://wa.me/34646853773?text=Hola%2C%20me%20interesa%20Equinoccio%20(colgante%20de%20zafiro%20amarillo)',
    },
  };

  /* ═══════════════════════ DETECT + APPLY ═══════════════════════ */

  function detectInitialLang() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    } catch (e) {
      // localStorage may throw (private mode, disabled cookies). Fall through.
    }
    const browser = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (browser.indexOf('es') === 0) return 'es';
    return FALLBACK;
  }

  function getString(lang, key) {
    const dict = STRINGS[lang] || STRINGS[FALLBACK];
    return dict[key];
  }

  function applyLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = FALLBACK;
    const html = document.documentElement;
    html.setAttribute('lang', lang);

    // <title> via data-i18n-title on <html>
    const titleKey = html.getAttribute('data-i18n-title');
    if (titleKey) {
      const v = getString(lang, titleKey);
      if (v !== undefined) document.title = v;
    }

    // <meta data-i18n-content="key">
    document.querySelectorAll('meta[data-i18n-content]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-content');
      const v = getString(lang, key);
      if (v !== undefined) el.setAttribute('content', v);
    });

    // textContent
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      const v = getString(lang, key);
      if (v !== undefined) el.textContent = v;
    });

    // innerHTML (for strings with <em>, <br>, etc.)
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-html');
      const v = getString(lang, key);
      if (v !== undefined) el.innerHTML = v;
    });

    // Attributes — format "attr1:key1,attr2:key2"
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      const spec = el.getAttribute('data-i18n-attr');
      spec.split(',').forEach(function (pair) {
        const parts = pair.split(':');
        const attr = (parts[0] || '').trim();
        const key = (parts[1] || '').trim();
        if (!attr || !key) return;
        const v = getString(lang, key);
        if (v !== undefined) el.setAttribute(attr, v);
      });
    });

    // Toggle UI state — current language pill / trigger highlights
    document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
      const isCurrent = btn.getAttribute('data-set-lang') === lang;
      btn.setAttribute('aria-current', isCurrent ? 'true' : 'false');
    });

    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));

    // i18n.js is deferred so it runs AFTER the non-deferred GSAP scripts
    // at the bottom of <body>. ScrollTrigger has already computed scroll
    // distances against the (English) initial text. Changing textContent
    // can shift element heights → ScrollTrigger's positions become stale.
    // Refresh nudges it to recompute. Skip if ScrollTrigger isn't loaded
    // (e.g., contact.html doesn't use it).
    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
      // Wait one frame so the layout actually reflects the new text before
      // ScrollTrigger reads element bounding boxes.
      requestAnimationFrame(function () { window.ScrollTrigger.refresh(); });
    }
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // ignore
    }
    applyLang(lang);
  }

  /* ═══════════════════════ BOOTSTRAP ═══════════════════════ */

  // The inline <head> bootstrap script in each page already sets <html lang>
  // pre-paint. This call applies the full string substitution after the DOM
  // is parsed — runs on DOMContentLoaded since we're loaded with `defer`.
  applyLang(detectInitialLang());

  /* ═══════════════════════ TOGGLE / DROPDOWN HANDLERS ═══════════════════════ */

  document.addEventListener('click', function (e) {
    // Desktop dropdown trigger — toggle dropdown panel
    const trigger = e.target.closest('[data-lang-trigger]');
    if (trigger) {
      e.preventDefault();
      const switcher = trigger.closest('.lang-switcher');
      if (!switcher) return;
      const dropdown = switcher.querySelector('.lang-dropdown');
      if (!dropdown) return;
      const open = !dropdown.classList.contains('open');
      // Close any other open dropdowns first
      document.querySelectorAll('.lang-dropdown.open').forEach(function (d) {
        if (d !== dropdown) d.classList.remove('open');
      });
      dropdown.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }

    // Set-lang button (in dropdown OR mobile menu)
    const setter = e.target.closest('[data-set-lang]');
    if (setter) {
      e.preventDefault();
      const newLang = setter.getAttribute('data-set-lang');
      setLang(newLang);
      // Close any open dropdowns
      document.querySelectorAll('.lang-dropdown.open').forEach(function (d) {
        d.classList.remove('open');
      });
      document.querySelectorAll('[data-lang-trigger]').forEach(function (t) {
        t.setAttribute('aria-expanded', 'false');
      });
      return;
    }

    // Click outside any switcher closes any open dropdowns
    if (!e.target.closest('.lang-switcher')) {
      document.querySelectorAll('.lang-dropdown.open').forEach(function (d) {
        d.classList.remove('open');
      });
      document.querySelectorAll('[data-lang-trigger]').forEach(function (t) {
        t.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Escape closes any open dropdown
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const opened = document.querySelector('.lang-dropdown.open');
    if (!opened) return;
    opened.classList.remove('open');
    const trigger = opened.closest('.lang-switcher')?.querySelector('[data-lang-trigger]');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  });

  // Expose for manual control / debugging
  window.__i18n = { setLang: setLang, applyLang: applyLang };
})();
