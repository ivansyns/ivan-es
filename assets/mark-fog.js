/* mark-fog.js — the Aromazla mark, with fog moving INSIDE it.
 *
 * Adapted from _library/motion/fog-field.js. That part paints a section
 * background; the field maths is what transfers, not the job. Two changes:
 *   · the field drives an ALPHA MASK instead of a colour ramp, so the fog is
 *     concentrated inside the silhouette and never touches the surroundings;
 *   · 2D canvas instead of WebGL — this effect does not need shaders and the
 *     alpha-blended GL path is the fragile one.
 *
 * ⭐ TIME DRIVES THE WARP, NOT THE POSITION. fog-field's line is
 *   w = (fbm(q*1.25 + t), fbm(q*1.25 - t*.7));  n = fbm(q*1.55 + 2.7*w - t*.4)
 * so the field EVOLVES — lobes form, open and close in place. Sliding a
 * static texture past instead gives moving wallpaper, which is what the
 * first CSS-mask version did.
 */
(() => {
  const statue = document.getElementById('heroStatue');
  const mark = document.getElementById('heroMark');
  if (!statue || !mark) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── where the fog opens FIRST. In the mark's own texture space, before
     the page's scaleX(-1). The eyes and the bridge of the nose, not the
     chin. */
  const FOCUS_X = 0.38, FOCUS_Y = 0.21, FOCUS_R = 0.30;

  /* the fog's own ramp — wide, because fog has no edge */
  const FOG_LO = 0.580, FOG_HI = 0.800;
  /* ⭐ THE NUANCE. One extra high-frequency octave pair perturbs the FIELD
     before the ramp, not the alpha after it — so the vapour grows internal
     filaments and torn margins instead of just acquiring a noisy outline.
     Keep the amplitude well under the ramp width: push it near the ramp and
     the field crosses from clear to solid inside one sampled pixel, which
     no downstream filtering can smooth because the transition was never
     sampled at all. */
  const FIBRE = 4.2, BLEED = 0.055;
  const COBALT = '#0047AB';
  const COBALT_ALPHA = 0.34;

  /* ── the pointer knot ────────────────────────────────────────────────
     Gravity, not a magnet: it makes ONE region denser and quicker while the
     rest keeps churning as before. */
  const PULL_R    = 0.26;
  /* ⚠ THREE DIFFERENT THINGS HERE MAKE CONCENTRIC OVALS, and each hides the
     next, so they have to be understood together. (1) A radial WARP scales
     noise-space about the pointer by a factor that itself falls off with
     radius, so past ~0.25 the map r -> r(1+k(r)) stops being monotonic, the
     same noise value lands at several radii, and the stretched frequencies
     alias into visible chunks. (2) A flat radial MASS bump makes the
     field's level sets into circles, so every ramp laid over it prints a
     ring. (3) Even a contrast gain does it, because near the pointer the
     field is locally smooth and any radially symmetric influence has
     nothing to hide behind. The cure for all three is the same and it is
     the noise on `k` below: an irregular influence region has no rim. */
  /* ⭐ DRIVE TOWARD A STATE, DO NOT ADD TO THE CURRENT ONE. Gain and a
     structure-gated mass both scale with whatever the field happens to be
     doing under the pointer, so the knot was dramatic when a lobe sat there
     and invisible when one did not — measured at 53..169, a 3.2x swing, and
     the base fog at one spot ranged 77..253 on its own. Interpolating
     toward a fixed target instead lands the same place from either end: a
     clear patch and an already-fogged one both arrive at TARGET, so the
     knot reads the same whenever you touch it.
     It cannot ring for the same reason the others could not — the contours
     follow g, and g's own boundary is raggeded by noise a few lines up.
     LERP below 1 leaves some of the base field alive inside the knot, and
     the fibre term still runs afterwards, so it is not a flat disc. */
  const PULL_TARGET = 0.85;   /* comfortably past FOG_HI */
  const PULL_LERP   = 0.88;
  /* ⚠ (4) AND NOTHING MAY VARY THE FIELD'S PHASE ACROSS THE KNOT. The
     deepest of the four, and it only shows after ~30s of holding, so a
     short test cannot find it — mine held for 1.4s and passed. The local
     clock added g*(RATE-1)*t, and t grows with how long the page has been
     open, so the added amount grew without bound. That amount is a SPATIAL
     OFFSET into noise space, so a radially varying, ever-growing offset is
     a ring generator whose gradient keeps steepening — the rings and the
     pixelation are one fault seen twice. A local warp shears identically.
     The knot now works ONLY by amplitude: an irregular influence region and
     a contrast gain. Neither displaces anything, so neither can shear.
     "Quicker" moved to the global rate, where it is uniform and harmless.

     Worth knowing why Morners never shows any of this: it runs the same
     field as a WebGL fragment shader, evaluated per screen pixel at full
     resolution, with nothing perturbing it. Here the field is CPU noise at
     ~27% resolution and upscaled — so it has a sampling limit that Morners
     does not have, and shear is what walks the frequencies past it. */
  const PULL_BOOST = 1.2;   /* hovering speeds the WHOLE field, not a region */
  let PX = 0.5, PY = 0.25;
  let PULL = 0;
  let tgtX = 0.5, tgtY = 0.25, hover = 0;

  const cv = document.createElement('canvas');
  cv.className = 'markfog';
  cv.setAttribute('aria-hidden', 'true');
  statue.parentNode.insertBefore(cv, statue.nextSibling);
  const ctx = cv.getContext('2d');

  /* ⚠ EVERY GEOMETRY QUESTION IS ASKED OF THE BUST, NOT THE MARK. The mark
     is a 1px invisible loader with no layout of its own; the bust is the
     element the page actually positions, and it changes shape completely at
     1024px — absolute and 82vh tall above, static and in-flow below. Reading
     the bust means the canvas simply follows whatever the CSS decided, at
     any width, including the mobile optical-centre translate and the GSAP
     parallax. The two assets share one 1011x1300 frame, so matching the
     bust's box matches the mark's artwork exactly. */
  const geom = statue;

  const img = new Image();
  /* ⭐ the pointer hit test is the mark's own ALPHA, not its bounding box.
     The silhouette is about half its rect — a box test lights the knot up
     while the pointer is over empty page beside the head. */
  let alpha = null, aw = 0, ah = 0;
  function buildAlphaMap() {
    aw = 160; ah = Math.max(1, Math.round(aw * img.naturalHeight / img.naturalWidth));
    const c = document.createElement('canvas');
    c.width = aw; c.height = ah;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, aw, ah);
    const d = g.getImageData(0, 0, aw, ah).data;
    alpha = new Uint8Array(aw * ah);
    for (let i = 0; i < aw * ah; i++) alpha[i] = d[i * 4 + 3];
  }
  img.onload = () => { buildAlphaMap(); ready = true; };
  let ready = false;
  img.src = mark.currentSrc || mark.src;

  /* ── the noise field, same shape as fog-field's ─────────────────────── */
  const perm = new Uint8Array(512);
  (() => { const p = [...Array(256).keys()];
    let s = 1337; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; })();
  const fade = (t) => t * t * (3 - 2 * t);
  function noise(x, y) {
    const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const a = perm[perm[xi] + yi] / 255, b = perm[perm[xi + 1] + yi] / 255;
    const c = perm[perm[xi] + yi + 1] / 255, d = perm[perm[xi + 1] + yi + 1] / 255;
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }
  function fbm(x, y) {
    let v = 0, a = 0.5;
    for (let i = 0; i < 4; i++) { v += a * noise(x, y); x *= 2.03; y *= 2.03; a *= 0.5; }
    return v;
  }
  /* two octaves only — this one exists to ragged a margin, not to build a
     shape, and the lower octaves are the ones that would smooth it back */
  function fbmDetail(x, y) {
    let v = 0, a = 0.5;
    for (let i = 0; i < 2; i++) { v += a * noise(x, y); x *= 2.03; y *= 2.03; a *= 0.5; }
    return v / 0.75;
  }
  const smooth = (a) => { a = a < 0 ? 0 : a > 1 ? 1 : a; return a * a * (3 - 2 * a); };

  /* ⚠ SMOOTH THE MASK IN JS, NOT WITH ctx.filter. A canvas filter here cost
     more than the entire noise field — it drops the blit off the fast path.
     The same 1-2-1 separable pass over the small mask is a few thousand
     integer ops and never touches the compositor. Its job is to spread any
     surviving single-pixel step across three, so the upscaler has something
     to interpolate instead of a cliff. */
  let blurBuf = null;
  function blurAlpha(data, w, h) {
    const n = w * h;
    if (!blurBuf || blurBuf.length < n) blurBuf = new Uint8Array(n);
    for (let y = 0; y < h; y++) {
      const r = y * w;
      for (let x = 0; x < w; x++) {
        const a = data[((r + (x > 0 ? x - 1 : 0)) << 2) + 3];
        const b = data[((r + x) << 2) + 3];
        const c = data[((r + (x < w - 1 ? x + 1 : x)) << 2) + 3];
        blurBuf[r + x] = (a + 2 * b + c) >> 2;
      }
    }
    for (let y = 0; y < h; y++) {
      const r = y * w, rm = (y > 0 ? y - 1 : 0) * w, rp = (y < h - 1 ? y + 1 : y) * w;
      for (let x = 0; x < w; x++)
        data[((r + x) << 2) + 3] = (blurBuf[rm + x] + 2 * blurBuf[r + x] + blurBuf[rp + x]) >> 2;
    }
  }

  /* ⭐ THE COST IS THE UPSCALE, NOT THE NOISE. The field is ~10ms; blitting
     it up to the full backing store is what costs, and it lands at raster
     time so per-call timings read as zero and lie about it. Both knobs are
     therefore pixel counts, not maths. */
  const SCALE     = 0.27;
  const DPR_CAP   = 1.5;
  const GATE_REST = 55;   /* ~18fps. The fog is slow; nobody sees the steps */
  const GATE_PULL = 45;   /* ~22fps. Measured: 34ms drops frames, 45 does not */

  const fogMask = document.createElement('canvas');
  const fmctx = fogMask.getContext('2d');
  /* cobalt shaped BY the field: fill, then destination-in against the mask,
     so the colour exists only where the vapour is. This canvas then carries
     the field's alpha AND the colour, which is why one upscale of it can
     drive both passes below. */
  const tint = document.createElement('canvas');
  const tctx = tint.getContext('2d');
  let fw = 0, fh = 0, fogData = null;

  /* ⭐ UPSCALE IN 2x STEPS, NEVER IN ONE JUMP. drawImage's smoothing is
     bilinear, and bilinear over a large ratio does not blur — it fans an
     edge out into triangular facets, which is exactly the "pixelation" that
     shows on a lobe boundary. Doubling once keeps every step at a ratio
     bilinear handles cleanly. A second rung looks no better and measured
     twice the frame cost. Raising SCALE instead would cost the square of
     the ratio in noise, which is the expensive axis. */
  const RUNG_MAX = 1;
  const rungs = [0, 1].map(() => document.createElement('canvas'));
  function upscale(src, target) {
    let cur = src, w = src.width, h = src.height, i = 0;
    while (w * 2 <= target && i < RUNG_MAX) {
      const nw = w * 2, nh = h * 2, c = rungs[i];
      if (c.width !== nw || c.height !== nh) { c.width = nw; c.height = nh; }
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = true;
      g.globalCompositeOperation = 'copy';   /* no accumulation across frames */
      g.drawImage(cur, 0, 0, nw, nh);
      cur = c; w = nw; h = nh; i++;
    }
    return cur;
  }

  /* film grain. One tile, drawn at a random offset every frame so it dances
     the way real grain does — a fixed grain pattern reads as a filter
     sitting still over the picture. */
  const GN = 128;
  const grain = document.createElement('canvas');
  grain.width = grain.height = GN;
  (() => {
    const g = grain.getContext('2d');
    const d = g.createImageData(GN, GN);
    for (let i = 0; i < GN * GN; i++) {
      const v = 90 + Math.random() * 76;
      d.data[i*4] = d.data[i*4+1] = d.data[i*4+2] = v;
      d.data[i*4+3] = 255;
    }
    g.putImageData(d, 0, 0);
  })();

  function layout() {
    const r = geom.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const host = cv.offsetParent || statue.parentNode;
    const pr = host.getBoundingClientRect();
    cv.style.left = (r.left - pr.left) + 'px';
    cv.style.top = (r.top - pr.top) + 'px';
    cv.style.width = r.width + 'px';
    cv.style.height = r.height + 'px';
    /* ⚠ ONLY WHEN IT CHANGES. Assigning canvas.width CLEARS the canvas even
       if the value is identical — doing it every frame wipes the drawing,
       and the throttle below then returns without repainting, so the canvas
       is blank most of the time. */
    const dpr = Math.min(devicePixelRatio || 1, DPR_CAP);
    const cw = Math.round(r.width * dpr), ch = Math.round(r.height * dpr);
    if (cw !== cv.width || ch !== cv.height) { cv.width = cw; cv.height = ch; }
    const nw = Math.max(8, Math.round(r.width * SCALE));
    const nh = Math.max(8, Math.round(r.height * SCALE));
    if (nw !== fw || nh !== fh) {
      fw = nw; fh = nh;
      fogMask.width = tint.width = nw;
      fogMask.height = tint.height = nh;
      fogData = fmctx.createImageData(fw, fh);
    }
    return true;
  }

  function field(t) {
    const d = fogData.data;
    const ACTIVE = PULL > 0.004;
    for (let y = 0; y < fh; y++) {
      const v = y / fh;
      for (let x = 0; x < fw; x++) {
        const u = x / fw;
        /* aspect-corrected so lobes stay round on a tall silhouette */
        const qx = u * 2.4, qy = v * 3.72;

        let g = 0;
        if (ACTIVE) {
          const px = u - PX, py = (v - PY) * 0.75;
          let k = 1 - Math.hypot(px, py) / PULL_R;
          if (k > 0) {
            /* the irregular influence region — see (3) above. One octave
               is enough; a blob has no rim to see. */
            k += (noise(qx * 2.4 + 11.3, qy * 2.4 + 7.1) - 0.5) * 0.75;
            k = smooth(k); g = k * k * PULL;
          }
        }
        const wx = fbm(qx * 1.25 + t, qy * 1.25 + t);
        const wy = fbm(qx * 1.25 - t * 0.7, qy * 1.25 - t * 0.7);
        let n = fbm(qx * 1.55 + 2.7 * wx - t * 0.4, qy * 1.55 + 2.7 * wy - t * 0.4);

        /* the opening is biased toward the eyes and nose — it starts there
           and spreads, rather than beginning at the chin */
        const dx = (u - FOCUS_X), dy = (v - FOCUS_Y) * 0.75;
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / FOCUS_R);
        n += near * 0.11;
        /* the knot pulls the field toward PULL_TARGET — see the note there
           for why this is a lerp and not an addition */
        if (g > 0) n += g * PULL_LERP * (PULL_TARGET - n);

        const nd = n + (fbmDetail(qx * FIBRE, qy * FIBRE) - 0.5) * BLEED;
        const i = (y * fw + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 0;
        d[i + 3] = (smooth((nd - FOG_LO) / (FOG_HI - FOG_LO)) * 255) | 0;
      }
    }
    blurAlpha(d, fw, fh);
    fmctx.putImageData(fogData, 0, 0);
    tctx.globalCompositeOperation = 'source-over';
    tctx.clearRect(0, 0, fw, fh);
    tctx.fillStyle = COBALT;
    tctx.fillRect(0, 0, fw, fh);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(fogMask, 0, 0);
  }

  let last = 0;
  /* ⭐ INTEGRATE THE PHASE, DO NOT DERIVE IT FROM ELAPSED TIME. The rate
     changes when you hover, and phase = elapsed * rate would jump the whole
     field the instant the rate changed. Accumulating dt * rate is
     continuous through any rate change. The clamp matters too: a
     backgrounded tab stops rAF, and the first frame back would otherwise
     advance the field by however long you were away. */
  let T = 0;
  let prev = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!ready || !layout()) return;
    if (now - last < (PULL > 0.02 ? GATE_PULL : GATE_REST)) return;
    last = now;
    /* attack faster than release: the knot should gather promptly and let
       go without snapping, which is what makes it read as mass */
    PULL += (hover - PULL) * (hover ? 0.16 : 0.06);
    /* and it TRAILS the pointer. Arriving instantly reads as a cursor
       decoration; arriving late reads as something with weight. */
    PX += (tgtX - PX) * 0.20;
    PY += (tgtY - PY) * 0.20;
    const dt = Math.min(now - prev, 100) / 1000;
    prev = now;
    T += dt * 0.045 * (1 + PULL_BOOST * PULL);
    field(reduce ? 0 : T);

    /* ⚠ MIRROR. .hero-statue carries transform: scaleX(-1), so the <img>
       renders flipped while a canvas drawing the same file does not — which
       lands the mark beside the bust instead of on it. Flipping the whole
       canvas transform keeps the field in the mark's own texture space too,
       so FOCUS_X stays meaningful. */
    ctx.setTransform(-1, 0, 0, 1, cv.width, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, cv.width, cv.height);

    /* ONE upscale, used twice. destination-out reads only the SOURCE'S
       ALPHA, and the tint carries the field's alpha as well as the colour —
       so the erase and the fringe share a chain. Upscaling the mask and the
       tint separately measured twice the frame cost for an identical
       picture. */
    const veil = upscale(tint, cv.width);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(veil, 0, 0, cv.width, cv.height);

    /* cobalt on the fringe. source-atop paints only where the mark
       survives, so the tint lands on the vapour's edge — where the erase
       was partial — and never on the ground. */
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = COBALT_ALPHA;
    ctx.drawImage(veil, 0, 0, cv.width, cv.height);

    /* grain, still source-atop so it stays inside the silhouette */
    ctx.globalAlpha = 0.085;
    const ox = -Math.random() * GN, oy = -Math.random() * GN;
    for (let x = ox; x < cv.width; x += GN)
      for (let y = oy; y < cv.height; y += GN)
        ctx.drawImage(grain, x, y);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    /* follow the bust's own fade — the hero timeline takes it to 0.88, and a
       canvas sitting at 1 would read as a brighter object stuck on top.
       Reading it back from the bust each frame means the mark needs no tween
       of its own and the two can never drift apart. */
    cv.style.opacity = getComputedStyle(geom).opacity;
  }
  requestAnimationFrame(frame);

  /* ── pointer, mouse and finger alike ────────────────────────────────────
     Listening on the window rather than the canvas on purpose: .markfog is
     pointer-events:none so it never eats a click meant for the page, and the
     rect + alpha test below is a more honest hit test than the box the
     canvas would have given us anyway. */
  if (!reduce) {
    const aim = (e) => {
      const r = geom.getBoundingClientRect();
      if (!r.width || !alpha) { hover = 0; return; }
      const sx = (e.clientX - r.left) / r.width;
      const sy = (e.clientY - r.top) / r.height;
      if (sx < 0 || sx > 1 || sy < 0 || sy > 1) { hover = 0; return; }
      /* ⚠ MIRROR AGAIN. The canvas draws through setTransform(-1,...), so a
         point on the LEFT of the box is on the RIGHT of the texture. Skip
         this and the knot appears on the far side of the face. */
      const u = 1 - sx;
      const ax = (u * aw) | 0, ay = (sy * ah) | 0;
      if (ax < 0 || ay < 0 || ax >= aw || ay >= ah) { hover = 0; return; }
      if (alpha[ay * aw + ax] < 40) { hover = 0; return; }   /* off the silhouette */
      hover = 1; tgtX = u; tgtY = sy;
    };
    const release = (e) => {
      /* a mouse has no 'up' that means 'gone' — only touch and pen do */
      if (!e || e.pointerType !== 'mouse') hover = 0;
    };
    addEventListener('pointermove', aim, { passive: true });
    addEventListener('pointerdown', aim, { passive: true });
    addEventListener('pointerup', release, { passive: true });
    addEventListener('pointercancel', release, { passive: true });
    document.addEventListener('pointerleave', () => { hover = 0; });
  }
})();
