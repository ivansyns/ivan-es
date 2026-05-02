# ivan.es — Constraints

## Hard Rules
- The number 33 must NEVER appear on the site — not in text, not in footers, not as decoration, nowhere
- No references to numerology, Pythagorean calculations, or "trinta & três" anywhere in content
- No mystical/esoteric copy — keep all text grounded and direct
- No fortune-cookie phrasing like "a memory, a stone, a number"
- No dates like "EST. MMXXVI" or "EST. 2026"
- "Aromazla" is one word — no hyphen, no middle dot, not "ARO·MAZLA" or "ARO-MAZLA"
- No Tailwind — all CSS inline in the HTML files
- No frameworks, no React, no build tools
- GSAP via CDN only for animations

## Identity
- Name: Ivan Alzamora
- Subtitle/motto: "aut viam inveniam aut faciam" (Latin: "I shall either find a way or make one")
- Jewelry brand: Aromazla (anagram of Alzamora — that's all that needs to be said about it)
- Location: Madrid, Spain (can appear in intro/footer, NOT in hero)
- No logo — the name is the identity

## Design Constraints
- Dark aesthetic — base #0A0A0A to #111111, text #F5F0E8, accent gold #C9A84C used sparingly
- Typography: classical serif for headings (Cinzel), clean sans for body (Inter/DM Sans/Outfit)
- The hero name should NOT be oversized/dominant — the name anchors, it doesn't scream
- Grain/noise texture overlay (~3% opacity)
- Restraint over spectacle — every element earns its place

## Pages
- index.html — Home. Two full-viewport panels only: Hero + Aromazla doorway. **No footer**, no copyright, no social links, no coordinates. Desktop scrolls horizontally; mobile vertical.
- aromazla.html — Jewelry showcase, portfolio, commissions contact. **All contact info lives here** — email, location, social. The site's only footer is on this page.
- contact.html — Direct-contact page. Instagram + WhatsApp gradient cards.
- Subpages — only **pieces** get dedicated subpages: `p1.html`, `p2.html`, `p3.html` … (incremental, in the order pieces enter the collection — `p1` = the Equinoccio yellow-sapphire pendant, etc.). The piece *name* lives in `<title>`, page copy, and the gallery card label on `aromazla.html` — never in the URL.
- Stones do **not** have subpages. Loose stones live entirely on `aromazla.html` as gallery cards (Diamond / Ruby / Aquamarine, with `data-gallery="s1"|"s2"|"s3"` keys for the lightbox). Each stone's media + cert opens in the in-page lightbox. Why no subpages: stones are commission inputs, not finished pieces — there's nothing to write a story panel about until the piece is made. The lightbox + cert PDF is the full surface.

## Piece subpages — 4-panel horizontal-scroll convention
Every piece subpage (p#) follows the same 4-panel structure. Desktop (≥1024px) scrolls horizontally with GSAP ScrollTrigger pinned panels (mirrors aromazla.html / index.html). Mobile (<1024px) stacks vertically.

Panels in order:
1. **Hero** — `panel--hero`. Pendant video on the left, copy on the right: eyebrow (`No. XXX · Pendant`), Cinzel title (the piece name, e.g. EQUINOCCIO), italic subtitle (`Stone · ct · Cert`), one-sentence lede, scroll cue.
2. **Story** — `panel--story`. Centered narrow column (max ~760px). Eyebrow `Story`, optional Cinzel uppercase title with one italic gold phrase, short poetic body in Cinzel italic. No fortune-cookie phrasing.
3. **Specs + Certificate** — `panel--specs`. Two-column grid: specs on the left (2-col grid of label/value pairs), GIA/IGI/IGE PDF embedded on the right inside `.cert-frame` (per-PDF aspect via `--pdf-aspect`, bone background, gold-line border) using `<object>` with `<a>` fallback. A `.cert-actions` row shows certificate meta + open/download link.
4. **Chain note + CTA** — `panel--cta`. Eyebrow + a single-paragraph chain-selection note in Cinzel, then CTA row: WhatsApp `Enquire`, `Contact`, `Back to pieces`.

Shared subpage rules:
- All four panels share the same `.panel.hpanel` skeleton with `.panel-inner` content.
- Mobile collapses `.hpanels` and `.hpanels-track` to `display: contents` so panels lay out as a normal vertical stack.
- GSAP + ScrollTrigger via CDN — same `gsap.matchMedia('(min-width: 1024px)')` pattern as aromazla.html (scrub 0.4, anticipatePin 1, invalidateOnRefresh).
- Nav, mobile menu sheet, and IG/WhatsApp gradient SVG defs are mirrored verbatim from aromazla.html.
- Spec values that are not certified on the report (e.g., origin) get a `.spec-note` italic disclaimer below the value.
- Reveal pattern: `.reveal` opacity/translate-Y, IntersectionObserver hands out `.visible`. Same observer rules as aromazla.html.

## Sun-glyph "back to home" — `.nav-back` convention
Every page that is NOT `index.html` carries a quiet bookmark to home in the top-left of the nav: a 22×22 sun-alchemical glyph (a circle ring + centered dot). It replaces the prior chevron back-arrow site-wide.

```html
<a class="nav-back" href="index.html" aria-label="Home">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/>
    <circle class="sun-dot" cx="12" cy="12" r="1.6"/>
  </svg>
</a>
```

```css
.nav-back svg circle { stroke: currentColor; stroke-width: 2; fill: none; }
.nav-back svg .sun-dot { fill: currentColor; stroke: none; }
.nav-back:hover svg { transform: scale(1.08); }
```

Rules:
- Always `href="index.html"` and `aria-label="Home"` (or `"Inicio"` if the page is Spanish-localized) — the glyph always returns to the top of the site, never to a parent section.
- Always gold (`var(--gold)`) — same color as the mobile cross/hamburger.
- 22×22 inside a 36×36 hit target, absolute-positioned at the nav's left edge, vertically centered. Mirrors `.nav-card` on the right edge so the optical balance reads.
- Hover: scale 1.08, no rotation, no horizontal shift (the glyph is non-directional, unlike the prior chevron).
- Index.html (the home itself) does NOT carry `.nav-back`.

## Assets
Per-piece / per-stone assets are stored in their own subfolder so each item's media + certificate live together. The folder name matches the page filename (`p1/`, `s1/`, `s2/`, …). Shared assets (favicon, SVGs used across pages) stay at the `assets/` root.

```
assets/
├── name-paths.svg          # SVG path data for hero stroke-draw animation
├── noise.svg               # grain overlay
├── p1/                     # Equinoccio (yellow sapphire pendant)
│   ├── sap.{mov,webm,mp4,webp}     # multi-format alpha pendant footage (hero source picker)
│   ├── sap1.mov, sap2.mp4, sap3.mov  # additional pendant footage (raw / future use)
│   ├── sap4.jpeg, sap5.jpeg, sap6.png  # pendant stills
│   └── yellow sapphire - GIA.pdf   # GIA certificate, embedded in Specs panel
├── s1/                     # GIA Ruby
│   ├── ru1.mov                     # ruby footage
│   ├── ru2.png … ru7.png           # cropped ruby stills (black UI margins removed)
│   └── Ruby - GIA.pdf              # GIA certificate
├── s2/                     # Aquamarine
│   ├── aq1.jpeg, aq2.mov           # aquamarine media
│   └── Aquamarina_IGE.pdf          # IGE certificate
└── s3/                     # Diamond
    ├── dia1.mov                    # diamond footage
    ├── dia2.png … dia5.png         # cropped diamond stills (X icon + page indicator chopped)
    └── Diamond_IGI_report_764657982.pdf   # IGI certificate
```

Path convention in code: every reference uses `assets/<folder>/<file>` — never the bare `assets/<file>` form, even for the pendant videos that originally lived at the root. URL-encode spaces (`%20`) for filenames with spaces (e.g. `Ruby - GIA.pdf` → `assets/s1/Ruby%20-%20GIA.pdf`). When adding a new piece or stone, create its `p#/` or `s#/` folder before placing media — keep the per-item locality.
