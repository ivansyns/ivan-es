# Design System — ivan.es

*Regenerated 2026-08-04 **from the code**, not from the previous version of this file. The
prior doc was last accurate 2026-04-28 and had drifted 2½ months: it described a
`Madrid · 40°25′N 3°42′W` caption and an `I·A` gold-middle-dot mark that no longer exist, and
documented 2 pages when the site has 4.*

**Rule going forward: when this file and the code disagree, the code is right and this file
gets fixed in the same pass.** A stale design doc is worse than none — it reads as
authoritative and is confidently wrong.

`CLAUDE.md` holds the immutable constraints. This file documents what is actually implemented.

---

## Personality

Dark, classical, restrained. **The name is the anchor, not the spectacle.** Typography-driven,
low-saturation, generous negative space. Empty canvas is intentional and load-bearing — the
site's argument is that the person behind it has judgement, and crowding would contradict it.

**This site does not follow the 8-point house Formula, and should not.** The Formula is
distilled from restaurant and clinic work — a business reassuring a wary customer with
photography and warmth. A person selling judgement inverts it: there is no full-bleed
photograph to lead with, because the product *is* the taste. See `_pipeline/DIRECTION.md`.

---

## Pages — four, not two

| Page | What it is |
|------|-----------|
| `index.html` | Home. Two panels: **hero** + **Aromazla doorway**. No footer, no contact links. |
| `aromazla.html` | Jewellery. Page-head → **pieces gallery** → **stones gallery** → commission → footer (the site's only footer). |
| `p1.html` | **Product page — "Equinoccio", No. 001.** Hero → story → specs → CTA. Natural yellow sapphire 2.08 ct, 18k white gold, rhodium finish, GIA certificate. |
| `contact.html` | Direct contact. Instagram `@ivan.alzam`, WhatsApp `+34 646 853 773`. |

`p1.html` is the newest and most significant addition: **Aromazla has gone commercial.** It is
a complete single-product page with real certification, video, and a WhatsApp CTA that
pre-fills the piece name. It is the model for future pieces (`p2`, `p3`, …).

---

## Colours

Unchanged since April — these were right and stayed right.

| Token | Value | Usage |
|---|---|---|
| `--ink` | `#0A0A0A` | Page background |
| `--ink-2` | `#111111` | Hero gradient stop, card front face |
| `--ink-3` | `#15140F` | Warm ink variant |
| `--ink-card` | `#18171A` | Door and piece card surface |
| `--bone` | `#F5F0E8` | Primary text |
| `--bone-soft` | `rgba(245,240,232,0.72)` | Secondary text |
| `--bone-faint` | `rgba(245,240,232,0.42)` | Tertiary / meta |
| `--bone-line` | `rgba(245,240,232,0.10)` | Hairlines, dividers |
| `--gold` | `#C9A84C` | Accent — rationed |
| `--gold-soft` | `rgba(201,168,76,0.72)` | Emblem strokes, brackets |

No bright colour. No gradients except subtle dark radial glows.

## Typography

| Family | Token | Usage |
|---|---|---|
| **Cinzel** | `--f-display` | Headings, doorway names, footer. Roman inscriptional capitals — the classical anchor. |
| **Inter** | `--f-body` | Body, card descriptions, ledes |
| **JetBrains Mono** | `--f-mono` | Eyebrows, labels, meta, motto |

Easing: `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`.

---

## Components

### Chrome
- **`nav-links`** — desktop link row, gold underline on hover.
- **`nav-card`** — mobile card-flip button.
- **`menu-sheet`** — full-screen sheet, with `menu-sheet__icons` and `menu-sheet__lang`
  (language toggle lives in the menu, with SVG flags).

### Hero (`index.html`)
`hero-frame` · `hero-plate` · `hero-statue` · **`hero-name`** (SVG path draw from
`assets/name-paths.svg`) · `hero-tagline` · `hero-cue`.

### Doorway (`index.html`)
`door-visual-cue` · `door-visual-mark` · `door-visual-piece`.

### Galleries (`aromazla.html`)
Two `gallery-grid` instances — **pieces** and **stones**. Card parts: `piece-name`,
`piece-num`, `piece-meta`, `piece-pill`, `piece-cert`, `piece-emblem`, `piece-top-label` +
`piece-top-label__carat`, `piece-pendant-label`.

The `piece-cert` element is real — the GIA report PDF ships in `assets/p1/`. **Do not
reproduce this component on a site without a genuine certificate**
(`_library/foundations/content-truth.md`).

### Product page (`p1.html`)
`panel--hero` → `panel--story` → `panel--specs` → `panel--cta`. Hero carries a video in three
encodings (`.mov` / `.webm` / `.mp4`) with a poster frame. CTA is a WhatsApp deep link with the
piece name pre-filled.

### Contact (`contact.html`)
`contact-eyebrow` · `contact-title` · `contact-lede` · `contact-cards` with
`contact-card__icon` / `__label` / `__handle`.

---

## Motion — Class B, and deliberately so

**Desktop (≥1024px):** panels sit on a horizontal track; **GSAP ScrollTrigger** pins the
wrapper and scrubs the track on X as the user scrolls vertically (`pin: true, scrub: 0.4`,
inside `gsap.matchMedia()`). Multiple triggers share the same start/end/scrub so they stay in
lockstep.

**Mobile (<1024px):** sticky-stack — each panel rises and buries the one before.

`IntersectionObserver` drives entrance reveals. `prefers-reduced-motion` is honoured in 12
places.

This is Class B (spectacle) and it is **correct here** — a freelancer has no team, no client
logo wall and no institutional trust, so craft has to substitute for credentials and the site
must *be* the work rather than describe it. **The same motion on a clinic site would kill
conversion.**

## Internationalisation

`assets/i18n.js` — bilingual **EN/ES**:
- Strings dictionary keyed by string ID, indexed by language
- `data-i18n` → textContent · `data-i18n-html` → innerHTML · `data-i18n-attr="attr:key,…"`
- `<html data-i18n-title>` → document.title · `<meta data-i18n-content>` → meta content
- `localStorage` persists the choice; `navigator.language` seeds the default (Spain → `es`)
- `<html lang>` updated every render; an inline bootstrap prevents a flash of wrong language

**This is the most reusable thing on the site and it is not in the library.** See the harvest
debt below.

---

## Known deviations from our own ship standard

Both would fail `_pipeline/audit.mjs`. Flagged 2026-08-04, not yet fixed:

1. **Google Fonts loaded from Google's CDN** — `fonts.googleapis.com` + `fonts.gstatic.com`.
   Every EU visitor's IP reaches Google before consent. Fix: self-host per
   `_library/compliance/fonts.md`.
2. **GSAP loaded from cdnjs** — `cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/`. External origin,
   breaks `default-src 'self'`. Fix: self-host, which was already the standing decision.

Vercel Web Analytics (`/_vercel/insights/script.js`) is first-party and cookieless — fine.

## Harvest debt — polished here, missing from the library

*The library was extracted from these sites once and never re-extracted. The sites moved on.*

- [ ] **`i18n.js` → `_library/elements/i18n.md` + `.js`** — we build for DK, SE and ES and have
      no i18n module. Highest value.
- [ ] **`p1.html` → `_library/recipes/product.md`** — flagged as pending in
      `references/batch-2026-07-31-codepen.md` *"when Aromazla goes commercial."* It has.
- [ ] **`nav-card` card-flip + `menu-sheet`** → mobile nav element
- [ ] **`piece-*` card family** → a certified-object card (with the content-truth caveat)
