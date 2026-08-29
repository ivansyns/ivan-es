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
 * so the field EVOLVES — lobes form, open and close in place. Sliding a static
 * texture past instead gives moving wallpaper, which is what the CSS-mask
 * version did.
 *
 * ⭐ QUARTER RES, like the source's half. Fog has no hard edges to lose, and
 *   the cost is per-pixel fbm — 4 octaves x 3 calls x every pixel.
 */
(() => {
  const statue = document.getElementById('heroStatue');
  const mark = document.getElementById('heroMark');
  if (!statue || !mark) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── where the fog opens FIRST. In the mark's own texture space, before the
     page's scaleX(-1). The eyes and the bridge of the nose, not the chin. */
  const FOCUS_X = 0.38, FOCUS_Y = 0.21, FOCUS_R = 0.30;

  const cv = document.createElement('canvas');
  cv.className = 'markfog';
  cv.setAttribute('aria-hidden', 'true');
  mark.parentNode.insertBefore(cv, mark.nextSibling);
  const ctx = cv.getContext('2d');

  /* the mark is drawn into the canvas and then erased through, so the <img>
     itself is only the source */
  mark.style.visibility = 'hidden';

  const img = new Image();
  img.onload = () => { ready = true; };
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

  const SCALE = 0.25;
  const fog = document.createElement('canvas');
  const fctx = fog.getContext('2d');
  let fw = 0, fh = 0, imgData = null;

  /* cobalt shaped BY the fog field: fill, then destination-in against the fog
     so the colour exists only where the vapour is. Drawn source-atop, it
     therefore tints the fringe of every opening — the mark going cold where
     the fog touches it — and cannot spill outside the silhouette. */
  const tint = document.createElement('canvas');
  const tctx = tint.getContext('2d');
  const COBALT = '#0047AB';

  /* film grain. One tile, drawn at a random offset every frame so it dances
     the way real grain does — a fixed grain pattern reads as a filter sitting
     still over the picture. */
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
    const r = mark.getBoundingClientRect();
    if (!r.width) return false;
    const host = cv.offsetParent || mark.parentNode;
    const pr = host.getBoundingClientRect();
    cv.style.left = (r.left - pr.left) + 'px';
    cv.style.top = (r.top - pr.top) + 'px';
    cv.style.width = r.width + 'px';
    cv.style.height = r.height + 'px';
    /* ⚠ ONLY WHEN IT CHANGES. Assigning canvas.width CLEARS the canvas even if
       the value is identical — doing it every frame wipes the drawing, and the
       throttle below then returns without repainting, so the canvas is blank
       most of the time. */
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const cw = Math.round(r.width * dpr), ch = Math.round(r.height * dpr);
    if (cw !== cv.width || ch !== cv.height) { cv.width = cw; cv.height = ch; }
    const nw = Math.max(8, Math.round(r.width * SCALE));
    const nh = Math.max(8, Math.round(r.height * SCALE));
    if (nw !== fw || nh !== fh) {
      fw = fog.width = nw; fh = fog.height = nh;
      tint.width = nw; tint.height = nh;
      imgData = fctx.createImageData(fw, fh);
    }
    return true;
  }

  function field(t) {
    const d = imgData.data;
    for (let y = 0; y < fh; y++) {
      const v = y / fh;
      for (let x = 0; x < fw; x++) {
        const u = x / fw;
        /* aspect-corrected so lobes stay round on a tall silhouette */
        const qx = u * 2.4, qy = v * 2.4 * (fh / fw) * (fw / fh) * 1.55;
        const wx = fbm(qx * 1.25 + t, qy * 1.25 + t);
        const wy = fbm(qx * 1.25 - t * 0.7, qy * 1.25 - t * 0.7);
        let n = fbm(qx * 1.55 + 2.7 * wx - t * 0.4, qy * 1.55 + 2.7 * wy - t * 0.4);
        /* the opening is biased toward the eyes and nose — it starts there and
           spreads, rather than beginning at the chin */
        const dx = (u - FOCUS_X), dy = (v - FOCUS_Y) * 0.75;
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / FOCUS_R);
        n += near * 0.11;
        let a = (n - 0.58) / 0.22;
        a = a < 0 ? 0 : a > 1 ? 1 : a;
        a = a * a * (3 - 2 * a);
        const i = (y * fw + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 0;
        d[i + 3] = (a * 255) | 0;          /* alpha = how much to erase */
      }
    }
    fctx.putImageData(imgData, 0, 0);
    tctx.globalCompositeOperation = 'source-over';
    tctx.clearRect(0, 0, fw, fh);
    tctx.fillStyle = COBALT;
    tctx.fillRect(0, 0, fw, fh);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(fog, 0, 0);
  }

  let last = 0;
  const t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!ready || !layout()) return;
    if (now - last < 55) {               /* ~18fps: the fog is slow, nobody sees it */
      return;
    }
    last = now;
    field(reduce ? 0 : (now - t0) / 1000 * 0.045);
    /* ⚠ MIRROR. .hero-statue carries transform: scaleX(-1), so the <img>
       renders flipped while a canvas drawing the same file does not — which
       lands the mark beside the bust instead of on it. Flipping the whole
       canvas transform keeps the fog in the mark's own texture space too, so
       FOCUS_X stays meaningful. */
    ctx.setTransform(-1, 0, 0, 1, cv.width, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(fog, 0, 0, cv.width, cv.height);

    /* cobalt on the fringe. source-atop paints only where the mark survives,
       so the tint lands on the vapour's edge and never on the ground. */
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.34;
    ctx.drawImage(tint, 0, 0, cv.width, cv.height);

    /* grain, still source-atop so it stays inside the silhouette */
    ctx.globalAlpha = 0.085;
    const ox = -Math.random() * GN, oy = -Math.random() * GN;
    for (let x = ox; x < cv.width; x += GN)
      for (let y = oy; y < cv.height; y += GN)
        ctx.drawImage(grain, x, y);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    /* follow the bust's own fade — the hero timeline takes it to 0.88, and a
       canvas sitting at 1 would read as a brighter object stuck on top */
    cv.style.opacity = getComputedStyle(mark).opacity;
  }
  requestAnimationFrame(frame);
})();
