/* moire-rays.js — radial gratings whose overlap breathes. A quiet ambient
 * ground made of nothing but straight lines.
 *
 * After 2Mogs, CodePen 2Mogs/mdNmobp ("Star maker - moiré"). Teardown:
 * techniques/moire-rays.md.
 *
 * ⭐ THE SOURCE IS TWENTY LINES AND ONE OF THEM IS A TRICK
 *
 *     radiusInner: 1,  radiusOuter: h,  numPoints: 500
 *
 * It draws a "star" by alternating between an inner and an outer radius as it
 * steps round the circle. With the inner radius set to **1**, every inner point
 * collapses onto the centre — so the star degenerates into 500 rays from the
 * middle to the edge. A sunburst, written as a star polygon. Nice.
 *
 * ⭐ AND THE MOIRÉ IS AN ACCIDENT — which matters, because accidents do not ship
 * Those 500 rays converge toward the centre. Past the radius where their
 * spacing drops below one pixel they can no longer be resolved, and the
 * interference you see in that middle band is **aliasing**. That is not a
 * figure of speech: the pattern is a sampling artefact, so it changes with
 * canvas size, with devicePixelRatio, and with the browser's line antialiasing.
 * On a 2× phone the band moves inward and half of it disappears.
 *
 * It is the same failure as the Fibonacci texture in kaleido-field
 * ([[shader-atmospheres]] §3): beautiful on the machine it was made on,
 * undefined everywhere else.
 *
 * So ours makes the interference REAL — in the geometry, where it is the same
 * at every resolution. But NOT the way I first wrote it, and the wrong version
 * is worth recording because it sounds more plausible than the right one:
 *
 *   ✗ **Two gratings of different ray counts.** The reasoning — 180 rays
 *     against 186 beat at |180−186| = 6, so six arms — is how linear gratings
 *     work and it does not transfer. Radial rays all pass through their own
 *     centre, so a "coincidence" between the two sets happens at fixed ANGLES,
 *     not at fixed radii: you get six very slightly darker rays among 360,
 *     which at any usable line weight is invisible. Swept it at Δ = 3, 6, 14
 *     and 40 against a static reference. **No arms at any of them.** All four
 *     render as a plain denser sunburst.
 *
 *   ✓ **Two gratings with OFFSET CENTRES.** Same ray count, second origin
 *     moved a few percent of the box. Now the angular offset between the sets
 *     varies with POSITION, so the coincidences sweep out curves rather than
 *     sitting on rays, and you get the broad hyperbolic fringes that everyone
 *     means by "moiré". Strong and obvious from about 2% offset; best around
 *     4–10%.
 *
 * Which makes the motion different too: the good version animates by drifting
 * the second centre in a small orbit, and the fringes flow across the frame.
 * Spinning the sets — the obvious thing — does almost nothing, because a
 * radial grating rotated about its own centre maps onto itself.
 *
 *   moireRays(canvas, { sets: [
 *     { count: 200 },
 *     { count: 200, origin: [.5, .5], orbit: .03, spin: .05 },
 *   ]});
 */

export function moireRays(canvas, opts = {}) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const o = {
    /* ⭐ SAME count, OFFSET centre. See the long note above: differing counts
       do nothing visible, offsetting the centre is the whole effect. `orbit`
       is the radius of the second centre's drift as a fraction of the box;
       `spin` is how fast it goes round. Set orbit to 0 for a static fringe.
       ⚠ Keep orbit small (~.03). The fringes get stronger as it grows, but past
       about .04 the two convergence points separate far enough to read as two
       dark blemishes rather than one soft core — which looks like a mistake,
       not a design. Strength comes from `count` and `alpha`, not from offset. */
    sets: [
      { count: 200, alpha: .17, width: 1 },
      { count: 200, alpha: .17, width: 1, orbit: .03, spin: .05 },
    ],
    ink:    '#2b2b2b',
    inner:  .02,     // fraction of the outer radius. The source's `1px` in disguise
    core:   .18,     // radius of the erased convergence core, × R. See step().
    outer:  1.05,    // >1 so the rays run past the corners and never end mid-air
    origin: [.5, .5],
    dpr:    Math.min(2, globalThis.devicePixelRatio || 1),
    still:  4200,
    ...opts,
  };

  let w = 0, h = 0, R = 0;
  function resize() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    w = Math.max(1, Math.round(cw * o.dpr));
    h = Math.max(1, Math.round(ch * o.dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    /* reach the far CORNER, not the far edge — otherwise the rays stop short on
       the diagonals and the sunburst reads as a circle sitting on a rectangle */
    const ox = o.origin[0] * w, oy = o.origin[1] * h;
    R = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy)) * o.outer;
    ctx.lineCap = 'butt';
  }

  function step(t) {
    ctx.clearRect(0, 0, w, h);
    const r0 = o.inner * R;

    for (const s of o.sets) {
      /* ⭐ per-set origin. Two gratings with DIFFERENT CENTRES is the strong
         form of radial moiré — much stronger than differing ray counts, which
         is what the first version of this only supported. See the teardown. */
      const org = s.origin || o.origin;
      /* the drift that makes the fringes flow. A tiny orbit — a few percent of
         the box — sweeps the whole interference pattern across the frame. */
      const ob = s.orbit || 0;
      const oa = t * (s.spin ?? 0) * 0.001;
      const ox = (org[0] + Math.cos(oa) * ob) * w;
      const oy = (org[1] + Math.sin(oa) * ob) * h;
      const n = Math.max(2, Math.round(s.count));
      ctx.strokeStyle = s.ink || o.ink;
      ctx.globalAlpha = s.alpha ?? .16;
      ctx.lineWidth = (s.width ?? 1) * o.dpr;
      ctx.beginPath();
      /* ⚠ NOT spun by `spin` — that drives the orbit above. Rotating a radial
         grating about its own centre maps it onto itself every 360/n degrees,
         so it is motion you cannot see. `phase` is here only to de-align two
         sets that share a centre. */
      const phase = s.phase || 0;
      for (let i = 0; i < n; i++) {
        const a = phase + (i / n) * Math.PI * 2;
        const c = Math.cos(a), sn = Math.sin(a);
        ctx.moveTo(ox + c * r0, oy + sn * r0);
        ctx.lineTo(ox + c * R,  oy + sn * R);
      }
      /* ⚠ ONE stroke for the whole grating, not one per ray. A path of 180
         disjoint segments strokes as fast as one, and — unlike rose-tracer,
         where the accumulation at crossings IS the effect — here the rays only
         cross at the centre, so there is nothing to accumulate and batching
         would buy nothing. Different pen, opposite answer, same question. */
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* ⭐ ERASE THE CONVERGENCE CORES. Two hundred rays meeting at a point make a
       dense black disc, and with two offset gratings you get TWO of them —
       which read as a pair of eyes staring out of the pattern. Ivan called it
       immediately: "2 circles in the center that must be removed."
       Raising `inner` does not fix it; that just makes the discs bigger and
       cleaner-edged. The fix is to erase each core with a soft radial falloff,
       so the rays fade out before they can pile up. destination-out punches
       alpha, which works whatever colour the rays are. */
    ctx.globalCompositeOperation = 'destination-out';
    for (const s of o.sets) {
      const org = s.origin || o.origin;
      const ob = s.orbit || 0, oa = t * (s.spin ?? 0) * 0.001;
      const ox = (org[0] + Math.cos(oa) * ob) * w;
      const oy = (org[1] + Math.sin(oa) * ob) * h;
      const rr = o.core * R;
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, rr);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.55, 'rgba(0,0,0,0.75)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ox, oy, rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  let raf = 0, dead = false, visible = true, t0 = 0;
  function frame(ms) {
    if (dead) { raf = 0; return; }
    if (visible) { if (!t0) t0 = ms; step(ms - t0); }
    raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(() => { resize(); if (!raf) step(o.still); });
  ro.observe(canvas);
  const io = new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { rootMargin: '150px' });
  io.observe(canvas);

  resize();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) step(o.still);
  else raf = requestAnimationFrame(frame);

  return function destroy() {
    dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    ctx.clearRect(0, 0, w, h);
  };
}
