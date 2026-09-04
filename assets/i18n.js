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
      'nav.work': 'Web work',
      'legal.notice': 'Legal notice',
      'legal.privacy': 'Privacy',
      'work.eyebrow': 'Web · direct',
      'work.title': 'Sites, end to end',
      'work.lede': 'From what a client asks for to a site that is <em>live and working</em> — design, build, deploy.',
      'work.a.h': 'Design and build',
      'work.a.p': 'Hand-written HTML, CSS and JavaScript. No page builder, no template — nothing to keep updated, and nothing that breaks when a plugin is abandoned.',
      'work.b.h': 'Fast, and private by default',
      'work.b.p': 'Self-hosted fonts, no cookies, no third-party requests — so there is nothing to consent to. This site is built that way.',
      'work.c.h': 'Three languages',
      'work.c.p': 'Spanish, English and Swedish, written rather than machine-translated.',
      'work.d.h': 'Found, not just built',
      'work.d.p': 'Google Business Profile, structured data and the technical groundwork a small business is usually missing.',
      'work.cta': 'Working on something? <em>Tell me about it.</em>',
      'work.cta.btn': 'Get in touch',
      'index.work.lede': 'From a brief to a site that is live and working.',
      'nav.contact': 'Contact',
      'nav.home.aria': 'Home',
      'nav.openMenu.aria': 'Open navigation',
      'nav.changeLanguage.aria': 'Change language',
      'nav.lang.english': 'English',
      'nav.lang.spanish': 'Español',

      // ─── index ───
      'index.meta.title': 'Iván Alzamora — Madrid',
      'index.meta.description': 'Iván Alzamora — freelancer, builder, operations at Visuanza, jewellery under Aromazla. Madrid, Spain.',
      'index.meta.ogTitle': 'Iván Alzamora',
      'index.meta.ogDescription': 'Builder. Operations at Visuanza. Jewellery under Aromazla. Madrid.',
      'index.heroCue.aromazla': 'Aromazla',

      // ─── aromazla ───
      'aroma.meta.title': 'Aromazla — Jewellery by Iván Alzamora',
      'aroma.meta.description': 'Aromazla — symbolic jewellery forged in gold, set with certified stones. Made once. By Iván Alzamora, Madrid.',
      'aroma.meta.ogTitle': 'Aromazla — Jewellery by Iván Alzamora',
      'aroma.meta.ogDescription': 'Symbolic art forged in gold and set with certified precious stones. Made once.',
      'aroma.pageCue.pieces': 'Pieces',
      'aroma.pageLede': 'Symbolic art forged in gold and set with certified precious stones. <em>Wearable meaning, made once.</em>',
      'p1.avail': 'Available',
      'p2.avail': 'Not for sale',
      'aroma.pieces.heading': 'Pieces',
      'aroma.pieces.num': 'selected · ongoing',
      'aroma.piece.p1.name': 'Yellow Sapphire',
      'aroma.piece.p2.name': 'Natural Diamond',
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
      'spec.label.metalweight': 'Metal weight',
      'spec.label.stone': 'Stone',
      'spec.label.cut': 'Cut',
      'spec.label.weight': 'Weight',
      'spec.label.origin': 'Origin',
      'spec.label.colour': 'Colour',
      'spec.label.clarity': 'Clarity',
      'spec.label.cert': 'Certificate',
      'spec.label.metal': 'Metal',
      'spec.label.finish': 'Finish',
      'p1.spec.metalweight': '1.6&nbsp;<span class="unit">g</span>',
      'p1.spec.stone': 'Untreated<br>Yellow sapphire',
      'p1.spec.cut': 'Oval',
      'p1.spec.weight': '2.08 ct',
      'p1.spec.origin': 'Sri Lanka',
      'p1.spec.cert': 'GIA',
      'p1.spec.metal': '18k white gold',
      'p1.spec.finish': 'Rhodium plated',
      'p2.spec.metalweight': '10.5&nbsp;<span class="unit">g</span>',
      'p2.spec.stone': 'Natural diamond',
      'p2.spec.cut': 'Pear modified brilliant',
      'p2.spec.weight': '0.90 ct',
      'p2.spec.colour': 'Fancy light greenish gray',
      'p2.spec.clarity': 'VS2',
      'p2.spec.cert': 'IGI',
      'p2.spec.metal': '18k white gold',
      'p2.spec.finish': 'Brushed · unrhodiumed',
      'p1.meta.title': 'Equinoccio — Yellow Sapphire Pendant — Aromazla',
      'p1.meta.description': 'No. 001 — Equinoccio. A natural yellow sapphire of 2.08 carats, set in 18k white gold and finished in rhodium. By Iván Alzamora.',
      'p1.meta.ogTitle': 'Equinoccio — Yellow Sapphire Pendant — Aromazla',
      'p1.meta.ogDescription': 'No. 001 — Equinoccio. Yellow sapphire pendant, 2.08 ct, 18k white gold rhodium plated. Made once.',
      'p1.hero.eyebrow': 'No. 001 · Pendant',
      'p1.hero.title.aria': 'Equinoccio',
      'p1.status': 'Available',
      'p1.scroll.cue': 'scroll',
      'p1.story.eyebrow': 'Story',
      'p1.story.line1': 'Winter dies for days of spring —<br>and what stands between is held.',
      'p1.story.line2': 'A cradle of white gold petals, in the line of art nouveau, <br class="br-lg">holds the paradox.<br>Named <em>Equinoccio</em> for the threshold of the rebirth of nature — <br class="br-lg">what was crystallized, now beginning to flow.',
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
      'p1.cert.openDownload': 'Open PDF',
      'p1.cta.numero': 'No. 001',
      'p1.cta.eyebrow': 'A note on the chain',
      'p1.cta.note': '<em>Pendant only.</em> The chain is yours to choose — its length, its weight, the way it sits — and is priced alongside the piece.',
      'p1.cta.enquire': 'Enquire',
      'p1.cta.contact': 'Contact',
      'p1.cta.back': 'Back to pieces',
      'p1.cta.whatsappUrl': 'https://wa.me/34646853773?text=Hello%2C%20I%27m%20interested%20in%20Equinoccio%20(Yellow%20Sapphire%20pendant)',
      // ─── p2 · Lacrimosa ───
      // Every stone figure here is read off the IGI report in assets/s3
      // (764657982, 11 Feb 2026). The metal is deliberately not stated
      // anywhere on this page — it has not been confirmed.
      'p2.meta.title': 'Lacrimosa — Natural Diamond Ring — Aromazla',
      'p2.meta.description': 'No. 002 — Lacrimosa. A natural pear-cut diamond of 0.90 carats, fancy light greenish gray, certified by IGI. By Iván Alzamora.',
      'p2.meta.ogTitle': 'Lacrimosa — Natural Diamond Ring — Aromazla',
      'p2.meta.ogDescription': 'No. 002 — Lacrimosa. Natural pear diamond, 0.90 ct, fancy light greenish gray, VS2, IGI. Made once.',
      'p2.hero.eyebrow': 'No. 002 · Ring',
      'p2.hero.title.aria': 'Lacrimosa',
      'p2.status': "Maker's own · not for sale",
      'p2.scroll.cue': 'scroll',
      'p2.story.eyebrow': 'Story',
      'p2.story.line1': 'The tear, alchemized — <br class="br-lg">the weight that was once a burden turned out to be more valuable than gold.',
      'p2.story.line2': 'Sand-coloured, its form after the Eye of the Sahara, <br class="br-lg">where beauty is found in the harshest conditions. <br class="br-lg">Named <em>Lacrimosa</em> for the requiem Mozart never finished — <br class="br-lg">the silence left behind after the music reached its purest harmony.',
      'p2.story.line3': '<em>Made once.</em>',
      'p2.cert.eyebrow': 'Certificate',
      'p2.cert.aria': 'IGI report — Natural Diamond 0.90 ct',
      'p2.cert.meta': 'IGI · 0.90 ct',
      'p2.cert.openDownload': 'Open PDF',
      'p2.cta.numero': 'No. 002',
      'p2.cta.eyebrow': 'A note on this piece',
      'p2.cta.note': '<em>My own ring.</em><br>Lacrimosa is not for sale.<br>A piece in its spirit can be commissioned.',
      'p2.cta.enquire': 'Commission a piece',
      'p2.cta.contact': 'Contact',
      'p2.cta.back': 'Back to pieces',
      'p2.cta.whatsappUrl': 'https://wa.me/34646853773?text=Hello%2C%20I%27m%20interested%20in%20Lacrimosa%20(Natural%20Diamond%20ring)',
    },

    es: {
      // ─── nav ───
      'nav.aromazla': 'Aromazla',
      'nav.work': 'Proyectos web',
      'legal.notice': 'Aviso legal',
      'legal.privacy': 'Privacidad',
      'work.eyebrow': 'Web · directo',
      'work.title': 'Webs, de principio a fin',
      'work.lede': 'De lo que pide el cliente a una web <em>publicada y funcionando</em> — diseño, desarrollo y despliegue.',
      'work.a.h': 'Diseño y desarrollo',
      'work.a.p': 'HTML, CSS y JavaScript escritos a mano. Sin maquetador ni plantilla — nada que actualizar y nada que se rompa cuando un plugin deja de mantenerse.',
      'work.b.h': 'Rápida y privada de serie',
      'work.b.p': 'Fuentes autoalojadas, sin cookies y sin peticiones a terceros — así no hay nada que consentir. Esta web está hecha así.',
      'work.c.h': 'Tres idiomas',
      'work.c.p': 'Español, inglés y sueco, redactados y no traducidos a máquina.',
      'work.d.h': 'Que además se encuentre',
      'work.d.p': 'Perfil de Empresa en Google, datos estructurados y la base técnica que suele faltar a un negocio pequeño.',
      'work.cta': '¿Tienes algo en marcha? <em>Cuéntamelo.</em>',
      'work.cta.btn': 'Hablemos',
      'index.work.lede': 'Del encargo a una web publicada y funcionando.',
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
      'p1.avail': 'Disponible',
      'p2.avail': 'No está en venta',
      'aroma.pieces.heading': 'Piezas',
      'aroma.pieces.num': 'selección · en curso',
      'aroma.piece.p1.name': 'Zafiro Amarillo',
      'aroma.piece.p2.name': 'Diamante Natural',
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
      'spec.label.metalweight': 'Peso del metal',
      'spec.label.stone': 'Piedra',
      'spec.label.cut': 'Talla',
      'spec.label.weight': 'Peso',
      'spec.label.origin': 'Origen',
      'spec.label.colour': 'Color',
      'spec.label.clarity': 'Pureza',
      'spec.label.cert': 'Certificado',
      'spec.label.metal': 'Metal',
      'spec.label.finish': 'Acabado',
      'p1.spec.metalweight': '1,6&nbsp;<span class="unit">g</span>',
      'p1.spec.stone': 'Sin tratamiento<br>Zafiro amarillo',
      'p1.spec.cut': 'Ovalada',
      'p1.spec.weight': '2,08 ct',
      'p1.spec.origin': 'Sri Lanka',
      'p1.spec.cert': 'GIA',
      'p1.spec.metal': 'Oro blanco de 18k',
      'p1.spec.finish': 'Rodiado',
      'p2.spec.metalweight': '10,5&nbsp;<span class="unit">g</span>',
      'p2.spec.stone': 'Diamante natural',
      'p2.spec.cut': 'Pera brillante modificada',
      'p2.spec.weight': '0,90 ct',
      'p2.spec.colour': 'Fancy light greenish gray',
      'p2.spec.clarity': 'VS2',
      'p2.spec.cert': 'IGI',
      'p2.spec.metal': 'Oro blanco de 18k',
      'p2.spec.finish': 'Cepillado · sin rodiar',
      'p1.meta.title': 'Equinoccio — Colgante de Zafiro Amarillo — Aromazla',
      'p1.meta.description': 'Nº 001 — Equinoccio. Un zafiro amarillo natural de 2,08 quilates, engastado en oro blanco de 18k con acabado en rodio. Por Iván Alzamora.',
      'p1.meta.ogTitle': 'Equinoccio — Colgante de Zafiro Amarillo — Aromazla',
      'p1.meta.ogDescription': 'Nº 001 — Equinoccio. Colgante de zafiro amarillo, 2,08 ct, oro blanco 18k con acabado en rodio. Pieza única.',
      'p1.hero.eyebrow': 'Nº 001 · Colgante',
      'p1.hero.title.aria': 'Equinoccio',
      'p1.status': 'Disponible',
      'p1.scroll.cue': 'desliza',
      'p1.story.eyebrow': 'Historia',
      // STRICT — preserved verbatim per the README's translation note.
      // "morirá" (will die) gives Spanish prophetic weight that the literal
      // present tense "muere" would flatten.
      'p1.story.line1': 'El invierno morirá por días de primavera —<br>y lo que está entre medio queda sostenido.',
      'p1.story.line2': 'Un cáliz de pétalos de oro blanco, en la línea del art nouveau, <br class="br-lg">sostiene la paradoja.<br>Llamado <em>Equinoccio</em> por el umbral del renacer de la naturaleza — <br class="br-lg">lo que estaba cristalizado, ahora comienza a fluir.',
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
      'p1.cert.openDownload': 'Abrir PDF',
      'p1.cta.numero': 'Nº 001',
      'p1.cta.eyebrow': 'Nota sobre la cadena',
      'p1.cta.note': '<em>Sólo el colgante.</em> Tú eliges la cadena — su longitud, su peso, su caída — y se cotiza junto con la pieza.',
      'p1.cta.enquire': 'Consultar',
      'p1.cta.contact': 'Contacto',
      'p1.cta.back': 'Volver a las piezas',
      'p1.cta.whatsappUrl': 'https://wa.me/34646853773?text=Hola%2C%20me%20interesa%20Equinoccio%20(colgante%20de%20zafiro%20amarillo)',
      // ─── p2 · Lacrimosa ───
      'p2.meta.title': 'Lacrimosa — Anillo de Diamante Natural — Aromazla',
      'p2.meta.description': 'Nº 002 — Lacrimosa. Un diamante natural talla pera de 0,90 quilates, color fancy light greenish gray, certificado por IGI. Por Iván Alzamora.',
      'p2.meta.ogTitle': 'Lacrimosa — Anillo de Diamante Natural — Aromazla',
      'p2.meta.ogDescription': 'Nº 002 — Lacrimosa. Diamante natural talla pera, 0,90 ct, fancy light greenish gray, VS2, IGI. Pieza única.',
      'p2.hero.eyebrow': 'Nº 002 · Anillo',
      'p2.hero.title.aria': 'Lacrimosa',
      'p2.status': 'Pieza del autor · no está en venta',
      'p2.scroll.cue': 'desliza',
      'p2.story.eyebrow': 'Historia',
      'p2.story.line1': 'La lágrima, alquimizada — <br class="br-lg">el peso que un día fue carga resultó valer más que el oro.',
      'p2.story.line2': 'Color arena, con la forma del Ojo del Sáhara, <br class="br-lg">donde la belleza se encuentra en las condiciones más duras. <br class="br-lg">Llamado <em>Lacrimosa</em> por el réquiem que Mozart nunca terminó — <br class="br-lg">el silencio que quedó tras alcanzar la música su armonía más pura.',
      'p2.story.line3': '<em>Pieza única.</em>',
      'p2.cert.eyebrow': 'Certificado',
      'p2.cert.aria': 'Informe IGI — Diamante Natural 0,90 ct',
      'p2.cert.meta': 'IGI · 0,90 ct',
      'p2.cert.openDownload': 'Abrir PDF',
      'p2.cta.numero': 'Nº 002',
      'p2.cta.eyebrow': 'Una nota sobre esta pieza',
      'p2.cta.note': '<em>Mi propio anillo.</em><br>Lacrimosa no está en venta.<br>Se puede encargar una pieza en su espíritu.',
      'p2.cta.enquire': 'Encargar una pieza',
      'p2.cta.contact': 'Contacto',
      'p2.cta.back': 'Volver a piezas',
      'p2.cta.whatsappUrl': 'https://wa.me/34646853773?text=Hola%2C%20me%20gustar%C3%ADa%20encargar%20una%20pieza%20en%20el%20esp%C3%ADritu%20de%20Lacrimosa',
    },
  };

  /* ═══════════════════════ DETECT + APPLY ═══════════════════════ */

  function detectInitialLang() {
    // ⚠ ?lang= WINS OVER EVERYTHING, including a previous manual choice. It is
    // how a printed QR can land a Spanish-speaking reader on Spanish copy
    // regardless of what their phone's browser is set to — the card is handed
    // out in Madrid, the phone might be in any language. It is also remembered,
    // so the rest of the visit stays in that language.
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q && SUPPORTED.indexOf(q) !== -1) {
        try { localStorage.setItem(STORAGE_KEY, q); } catch (e) {}
        return q;
      }
    } catch (e) {}
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
