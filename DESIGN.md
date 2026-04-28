# Design System — ivan.es

The current state of the system. CLAUDE.md holds the immutable constraints; this file documents the implemented choices that satisfy them.

## Personality
Dark, classical, restrained. The name is the anchor, not the spectacle. Typography-driven, low-saturation, generous negative space.

## Pages
- `index.html` — Home. **Two panels only: Hero + Aromazla doorway.** No footer, no copyright, no contact links — contact lives on aromazla.html. **Desktop (≥1024px):** the two panels sit on a horizontal track that GSAP ScrollTrigger pins and translates left as the user scrolls vertically. Once the pin distance is consumed, scrolling stops because there's nothing else in the document. **Mobile (<1024px):** sticky-stack — the doorway rises up and buries the hero.
- `aromazla.html` — Jewelry. Sticky-stack of four panels: page-head (single-word title) → gallery (six placeholder pieces) → commission CTA → footer (the site's only footer — coordinates, email, social links).

## Colors
| Token             | Value                            | Usage                                    |
|-------------------|----------------------------------|------------------------------------------|
| `--ink`           | `#0A0A0A`                        | Page background                          |
| `--ink-2`         | `#111111`                        | Hero gradient stop, card front face      |
| `--ink-3`         | `#15140F`                        | Reserved (warm ink variant)              |
| `--ink-card`     | `#18171A`                        | Door + piece card surface                |
| `--bone`          | `#F5F0E8`                        | Primary text                             |
| `--bone-soft`     | `rgba(245,240,232,0.72)`         | Secondary text                           |
| `--bone-faint`    | `rgba(245,240,232,0.42)`         | Tertiary / meta                          |
| `--bone-line`     | `rgba(245,240,232,0.10)`         | Hairlines, dividers                      |
| `--gold`          | `#C9A84C`                        | Accent — used sparingly                  |
| `--gold-soft`     | `rgba(201,168,76,0.72)`          | Corner brackets, emblem strokes          |

No bright colors. No gradients except subtle dark radial glows.

## Typography
| Family               | Variable        | Usage                                                     |
|----------------------|-----------------|-----------------------------------------------------------|
| Cinzel               | `--f-display`   | All headings, body display copy, doorway names, footer    |
| Inter                | `--f-body`      | Card descriptions, lede paragraphs, body text             |
| JetBrains Mono       | `--f-mono`      | Eyebrows, labels, breadcrumbs, footer h4, motto, meta     |

**Sizing** — all heading sizes are clamped:
- Hero name (SVG path) — `max-width: 460px`, anchored at the top of the viewport with `clamp(120px, 18vh, 200px)` of breathing room above. Empty canvas below is intentional.
- Hero motto — `clamp(0.78rem, 0.95vw, 0.9rem)`, mono italic, lowercase, letter-spacing 0.42em.
- Page title (Aromazla) — `clamp(2.8rem, 9vw, 7rem)`, single line, `white-space: nowrap`.
- Section h2 — `clamp(1.4rem, 2.4vw, 2rem)`, uppercase, letter-spacing 0.18em.
- Door name — `clamp(2.4rem, 4.6vw, 3.6rem)`, uppercase, letter-spacing 0.06em.
- Body — 16px / 1.65 line-height, weight 300.

## Spacing
Section vertical rhythm: `clamp(60px, 10vw, 132px)`.
Container max-width: 1280px.
Side gutter: `clamp(20px, 4vw, 48px)`.
Stack tokens (8-grid): 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128.

## Components

### Nav (shared)
Fixed top, transparent over hero, gains `rgba(10,10,10,0.78)` + 14px blur after 30px scroll. Left mark `I·A` in Cinzel with gold middle-dot. Right side: 5 mono-caps links with gold underline-on-hover. Below 768px the link list is replaced by the card-flip button.

### Card-flip mobile nav
56×36 button. Front face: dark `--ink-2` with `IA` mark. Back face: white `--bone` with three black hamburger lines. Flips on Y axis 720ms, custom cubic-bezier `(0.7, -0.1, 0.3, 1.1)` for slight overshoot. Open state reveals a full-screen `--ink` sheet with five Cinzel uppercase links and a `Madrid · 40°25′N 3°42′W` mono caption.

### Hero (index)
Full viewport, dark canvas, radial glow biased toward the top (`50% 18%`). Hero is `flex-direction: column` with `justify-content: flex-start` and `padding-top: clamp(120px, 18vh, 200px)`, so the name sits near the top and the bottom 60–70% of the viewport is intentional negative space (canvas for a future ASCII piece). Inline SVG path for "IVAN ALZAMORA". GSAP timeline:
1. **Stroke draw** — `getTotalLength` → `strokeDashoffset` 0 over 4s, `power1.inOut`, starting at 0.6s
2. **Crossfade** — `fill-opacity` 0→1 + `stroke-opacity` 1→0 over 1.6s, `sine.inOut`, starting at `-=3.4` (catches the tail of the draw, no perceptible pause)
3. **Carve** — fill darkens from `#F5F0E8` to `#A89F90` over 1.0s `sine.inOut`; the `#carved` SVG filter's two `feFlood` nodes raise their `flood-opacity` over the same window (shadow → 0.92, light → 0.42)

The Latin motto `aut viam inveniam aut faciam` rides phase 2 with `sine.out` over 1.2s. **Nothing else** in the hero — no eyebrow, no meta, no location, no number, no date.

### Page hero (aromazla)
Padding `clamp(140px, 18vh, 220px)` top. Breadcrumb in mono caps. Two-column grid: title `AROMAZLA` left (single line, `white-space: nowrap`, font scales via clamp), lede right (Cinzel display, max 36ch).

### Doorway (single, visual)
One image-bed doorway only — no section title, no Visuanza card, no descriptions. 16:9 aspect on desktop, 4:3 on mobile. Background is a layered radial+linear dark gradient + SVG fractal-noise overlay (mix-blend-mode `overlay`) + an outer radial vignette. The wordmark `AROMAZLA` is centered horizontally near the bottom (Cinzel 500, letter-spacing 0.32em, drop-shadow). Hover: card lifts 3px and the inner image scales 1.02 → 1.05 over 1400ms. Links to `aromazla.html`.

### Piece (gallery card)
4:5 aspect ratio dark plate with subtle SVG geometric emblem in `--gold-soft` stroke (no fill). `.span-2` variant takes 16:10 aspect across two columns. Hover lifts and brightens the emblem. Number + name labels bottom-left.

### Commission section
Centered between gold corner brackets. Mono eyebrow, Cinzel uppercase h2, body line, ghost CTA with arrow.

### Footer
3-column grid (Coordinates / Write / Elsewhere). Mono gold h4s, Cinzel display body links, Inter `.quiet` annotations. Base line: copyright only.

## Animations
- SVG name draw: 4s stroke + 1.5s fill, total ~5.4s
- Section reveals: opacity 0 + translateY(14px) → 0, 900ms `cubic-bezier(0.22, 1, 0.36, 1)`, IntersectionObserver-triggered
- Door hover: translateY(-3px) + border tint to `rgba(201,168,76,0.32)` over 600ms
- Card flip: 720ms 3D rotateY with overshoot easing
- Grain overlay: SVG fractal noise at 3.5% opacity, fixed, mix-blend-mode screen
- `prefers-reduced-motion`: all transitions/animations clamped to 0.01ms; SVG name lands fully filled

## Layout patterns

### Sticky stack (mobile + aromazla.html all viewports)
Each top-level section in `<main class="stack">` carries a `.panel` class and a `--z` custom property (1, 2, 3, …). The CSS rule:
```
.stack .panel {
  position: sticky;
  top: 0;
  min-height: 100vh;
  z-index: var(--z, 1);
  background: var(--ink); /* opaque — this is what does the covering */
}
```
As the user scrolls, panel N reaches `top:0` and sticks. Panel N+1 (lower in the document) eventually reaches `top:0` too; because its `z-index` is higher, it covers panel N. No JS for the core mechanic. Panel content sits inside a `.panel-inner` wrapper that holds the max-width and horizontal centering, so the panel itself can stay full-bleed and its background covers the panel beneath at any viewport width.

### Horizontal scroll (index.html, desktop ≥1024px)
The hero and doorway panels live inside `.hpanels > .hpanels-track`. On mobile, both wrappers use `display: contents` so the panels behave as direct children of `.stack` and stack vertically. On desktop, `.hpanels` becomes `height: 100vh; overflow: hidden` and `.hpanels-track` becomes a `display: flex` row of `100vw`-wide panels. GSAP's `gsap.matchMedia('(min-width: 1024px)', ...)` registers a ScrollTrigger that pins the wrapper, sets `end: '+=' + (slides − 1) × innerWidth`, and tweens the track's `x` from 0 to that distance with `scrub: 0.4` and `invalidateOnRefresh: true`. After the pin releases, scrolling returns to normal vertical flow and the footer rises up — no jarring jump because the wrapper occupies its natural 100vh in the document.

## Hard rules (from CLAUDE.md, mirrored)
- "Aromazla" is one word — no separator, no break
- Hero contains only the name + Latin motto
- Madrid may appear in the footer only (no bio section currently exists on the home page)
- No Tailwind, no React, no build tools
- All CSS inline; GSAP via CDN only

## Assets
- `assets/name-paths.svg` — Cinzel-rendered "IVAN ALZAMORA" as a single path; inlined into `index.html` for stroke animation.
