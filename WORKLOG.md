# ivan-es — worklog, 2026-08-31 → 2026-09-01

A record of what changed and what it was built with. **This is a log, not a spec** — where it
disagrees with the code, the code is right. Every claim below was measured or read out of a file
at the time of writing; nothing here is inferred.

Related: [[DESIGN|DESIGN.md]] · [[alpha-video|../_pipeline/alpha-video.py]] ·
[[reference-alpha-video-pipeline]] in memory.

---

## 1 · The toolchain (rebuild this first, nothing else works without it)

None of it survives an OS reinstall, and it did not survive the P15→L14 migration — which is what
cost an hour on 2026-08-31 before any of the work below started.

| Tool | Where | Why it has to be this one |
|---|---|---|
| **x265 4.2**, built `-DENABLE_ALPHA=ON` | `~/.local/x265` | Distros ship 3.5, and even a self-built 4.x has alpha **OFF** by default. Built without it, `--alpha` is not even listed in `--help` — that absence is the tell |
| **GPAC / MP4Box 2.2.1** | `sudo apt install gpac` | **ffmpeg's mov muxer silently drops the alpha layer.** This is the step that wastes the day, because the encode looks fine |
| **`.venv-img`** (numpy · pillow · scipy · fontTools) | `WEB/.venv-img` | Keying, matte work, and the wordmark outlines |
| ffmpeg (system) | `/usr/bin/ffmpeg` | Everything except HEVC-alpha. Untouched — the x265 build lives beside it, not over it |

```bash
git clone --depth 1 --branch 4.2 https://bitbucket.org/multicoreware/x265_git.git
cd x265_git/build/linux && cmake ../../source \
  -DCMAKE_INSTALL_PREFIX=$HOME/.local/x265 -DENABLE_SHARED=ON -DENABLE_ALPHA=ON
make -j$(nproc) && make install          # needs cmake + nasm + yasm
```

> **ffmpeg can neither encode, DECODE, nor mux HEVC alpha.** The decode blindness is the dangerous
> one: pulling frames out of a perfectly good alpha `.mov` returns *fully opaque* alpha, so ffmpeg
> will tell you a working file has no transparency. Read the x265 parameter string inside the file
> instead — `strings file.mov | grep alpha`. Its *"missing picture in access unit"* warnings are
> confirmation the alpha layer is present, not an error.

**How the format was reproduced at all:** the previously-shipped `sap.mov` carries its own
provenance — `x265 (build 216) - 4.2:[Linux][GCC 13.3.0]` and `GPAC 2.2.1`. So it was made on this
toolchain, not on a Mac, which is what every write-up online assumes. Read the provenance out of a
working artefact before believing the internet about how it was made.

---

## 2 · The piece clips

One tool builds all of them: **`_pipeline/alpha-video.py`**. Its docstring is the real
documentation; this is the summary. Run it with `WEB/.venv-img/bin/python`.

```bash
EASE="--boomerang --interpolate 4 --ease-start 0.72 --ease-window 30"

# index doorway — the only clip that still uses real alpha
.venv-img/bin/python _pipeline/alpha-video.py ~/Downloads/p1new2.mp4 ivan-es/assets/p1 equinoccio \
  --auto-crop $EASE

# p1 / p2 heroes — opaque, tight crop, sat on a plate
.venv-img/bin/python _pipeline/alpha-video.py ~/Downloads/p1new2.mp4 ivan-es/assets/p1 equinoccio-hero \
  --auto-crop --matte $EASE
.venv-img/bin/python _pipeline/alpha-video.py ~/Downloads/p2.mp4    ivan-es/assets/p2 lacrimosa-hero \
  --auto-crop --matte $EASE

# aromazla cards — opaque, cropped 4:5 so `cover` fits the card exactly
.venv-img/bin/python _pipeline/alpha-video.py ~/Downloads/p1new2.mp4 ivan-es/assets/p1 equinoccio-card \
  --crop 358,234,720,902 --matte $EASE
.venv-img/bin/python _pipeline/alpha-video.py ~/Downloads/p2.mp4    ivan-es/assets/p2 lacrimosa-card \
  --crop 402,324,618,772 --matte $EASE

# a gallery clip (not a piece animation) — just re-encode it for the web
ffmpeg -i SRC.mp4 -c:v libvpx-vp9 -pix_fmt yuv420p -b:v 0 -crf 36 -row-mt 1 -an OUT.webm
ffmpeg -i SRC.mp4 -c:v libx264 -pix_fmt yuv420p -crf 25 -preset slow -movflags +faststart -an OUT.mp4
ffmpeg -i OUT.webm -frames:v 1 -vf scale=400:-1 -q:v 3 OUT-frame.jpg
```

Source renders live in `~/Downloads` (`p1new2.mp4`, `p2.mp4`) — **move them somewhere permanent.**
They are the only inputs; the assets cannot be regenerated without them.

### What the tool does, and why each step exists

- **Auto-crop to the union bbox over EVERY frame**, never one frame, or the piece clips on the
  frames you did not look at. Cut ~86% of the pixels and roughly halved per-visitor bytes.
- **Enclosed holes are classified, not blanket-filled.** A hole whose median luma matches the frame
  border is background seen through a real opening — the pendant's **bail**, median 1/255 — and
  stays clear. A brighter one is shadowed metal — a shadow band on the ring, 12/255 — and is
  filled. Blanket-filling seals the bail shut.
- **The render's baked-in reflection is culled.** A render on black bakes the piece's reflection
  into the frame; those pixels are dim but non-zero, so a luma ramp gives them real alpha and they
  composite as a dark smudge on any ground lighter than black. Measured on the ring: 6–20px out,
  the glow *below* the piece is **5.1× brighter than above**, because it rests on a surface. A
  hanging pendant barely shows it. Partial alpha survives only within ~3px of the solid subject.
- **Colour is un-premultiplied** (`F = C/α`, floored) or every feathered edge keeps its black.
- **Boomerang = N + (N−2)**, both endpoints dropped. Measured first-vs-last frame distance at 38
  and 64 against a consecutive-frame delta of ~10 and ~7, so these renders cannot hard-loop.
- **`--interpolate 4` invents the frames the slow-down needs.** Without it the ease is a lie:
  slowing a 97-frame render to 28% does not create information, it repeats each image ~3.6× — a
  measured **167 ms hold**, which reads as a stutter, not slow motion. Interpolating ×4 first and
  stepping 4 dense frames per output frame keeps normal speed identical and drops the longest hold
  to **42 ms (one frame)**. Motion-compensated (`minterpolate mci/aobmc`) survives a rotating
  specular object cleanly — checked frame by frame against the real ones either side.
- **`--ease-start` dwells on frame 0**, where the piece faces the camera and the stone flares. In a
  boomerang that frame is the **loop seam**, so the slow-down is reached from both directions and
  reads as easing into the pose and out again, with no visible turn. At `0.72 / 30` the clip runs
  28% speed there, and 381 interpolated frames become 244 output frames → **10.17s**.

### Quality settings

x265 **crf 26** · VP9 **crf 40** · x264 **crf 23**. Chosen by eye on a 2× crop of the busiest
detail. **SSIM was useless here** — it moved only .915→.900 across a 5× size range because the dark
background dominates and dilutes it. VP9 degrades far more gracefully than HEVC.

### Alpha vs black matte — the ground decides

| Ground behind the clip | Use |
|---|---|
| Index doorway — sits directly on the page gradient | real alpha — `.mov` + `.webm` + matte `.mp4` |
| Everywhere else (aromazla cards, p1/p2 heroes) | **black matte + `mix-blend-mode: lighten`** |

⚠ **A blend can only reach the backdrop inside its own stacking context.** The p1/p2 heroes went
black the moment they switched to a matte, because `.hero-media` (transform, from `.reveal`) and
`.hpanels-track` (transform, from the horizontal scrub) each form one and neither painted anything
— so `lighten` had nothing to lighten against. The aromazla cards never hit this because the card
paints its own ground inside that context. Both heroes now carry the same plate, which is also the
look Ivan asked for.

`lighten` takes a per-channel max, so on a card ground of ~33/255 it discards the matte *and* the
render's reflection (~12) while the bright piece passes through untouched. The alpha route on that
card needed three compounding fixes — `contain` instead of `cover`, a damping scrim to win back the
saturation `lighten` stole against a non-black ground, and a reflection cull. The matte route
needed none of them.

---

## 3 · Page by page

### `index.html`

- **The doorway was folded into the hero.** It used to be a second 100vw horizontal panel; the bust
  now anchors left and the piece anchors right on the same baseline. The page is one viewport.
- **Scroll cue removed** — markup, CSS and its GSAP beat. With nothing below it, it pointed nowhere.
- The horizontal-scroll system **bails out below two panels**; pinning with zero distance reads as
  a stutter at the top of the page. It restores itself if a panel is added.
- **AROMAZLA is now an outline path, not `<text>`.** Generated from Cinzel 500 at the same size,
  letter-spacing and anchor, verified against the live text at **0.7px**. It draws → fills → carves
  on the hero name's own beats (draw 0.6–4.6s, fill 1.2–2.8s, carve 2.0–3.0s), added at **absolute**
  timeline positions — the existing tweens use `-=` and `<`, which resolve against the timeline end
  as it stands, so anything appended relatively lands somewhere unintended.
  *(A `<text>` element **can** be stroke-drawn — the old aromazla page did it with a fixed
  dasharray overestimate of 3000. A path is better because `getTotalLength()` is exact and the
  letters draw in sequence rather than all at once.)*
- **The piece fades in on the bust's curve** (0.4–4.4s, `sine.out`) and stays **paused until 2.4s**,
  so it materialises rather than arriving already spinning. Everything that could start it early —
  the offscreen-resume observer, the tap-to-play net — respects that gate.
- The **Low Power Mode still is now frame 0 of the clip itself**, same crop and key, so the swap
  cannot jump. That deleted three CSS rules that existed only to correct for a still framed at 96%
  standing in for a video framed at 61%.
- **M-18 · `moire-rays` is the hero's ground** — two radial gratings of the same ray
  count with the second centre offset, `assets/moire-rays.js` from the library. Ink is bone at
  `alpha .022` (the part is authored dark-on-paper; on black the demo page even swaps to a
  `#d8ccae` ground, so it had to be inverted), and `orbit: 0` freezes the drift. Desktop only.
  **Count is the dial that makes it read as M-18**: ray spacing at radius R is `2πR/count`, and on
  a 1440×900 canvas the far corner sits at R≈890 — 130 rays space out to ~43px and you see
  individual diagonals, 340 brings it to ~16px and the set reads as a field with fringes.
  ⚠ **Watch the ID.** `catalogue/PROGRESS.md` named M-18 `marquee-bands`, and a photo strip was
  built on this hero before `catalogue/pages/M-18.html` turned out to be `moire-rays`. **9 of 35
  catalogue IDs name the wrong part in that file.** The pages are the truth; PROGRESS.md now
  carries a warning and a regenerated map. `catalogue/pages/M-18.html` gained Animated/Static and
  paper/black toggles plus sliders, because the default drift is slow enough to look static.
- **The hero name is now an `<h1>`.** It was a `<div>`, so the home page had no heading at all.
- The piece's CSS height was rescaled by the measured **0.620** framing change, so it renders at
  257px desktop / 208px mobile against 253 / 207 before the recrop.

### `aromazla.html`

- **The AROMAZLA title panel was removed** — the page opens on Pieces. Its `<h1>` was the document's
  only one, so the heading survives as a visually-hidden `.a11y-title` (`clip-path`, not
  `display:none`, which most screen readers skip).
- **Lacrimosa added as No. 002**, linking to `p2.html`. Both galleries use a centred two-up track
  sized with `calc((200% - 20px) / 3)` so a card stays exactly a stone card's width.
- Piece cards use the **opaque** clips with `object-fit: cover` + `lighten`. `cover` was near-harmless
  with the old 0.805-aspect clips and crops badly at 0.58 — it was cutting the pendant's bail and the
  ring's shank off-card.
- **Stones:** the diamond card was removed (its stone is set in Lacrimosa) and the certificate moved
  into the top label — `GIA — RUBY — 1.02 CT`. The bottom-right chip and the duplicated gem name are
  gone.
- LPM fallback now covers the **piece** cards too: they no longer autoplay off-screen, and a refused
  `play()` swaps in the poster, which is frame 0 of that same clip.

### `p1.html`

- Hero clip repointed to `equinoccio-hero.*` — the matte build, on a plate (see above). It was on
  the older `sap.*` render, which would have disagreed with index and p2.
- **Gallery rebuilt.** It was serving **`sap1.mov` (43 MB)** and **`sap3.mov` (18 MB)** — camera
  originals handed straight to the browser. That is the whole reason gallery videos crawled or came
  up as a black slide: besides the weight, a camera `.mov` keeps its metadata atom at the END of the
  file, so a browser must fetch the entire thing before it can show a single frame. Both are out,
  along with `sap5.jpeg` (a snapshot of the pendant over a laptop keyboard). Now `e1.webm` + the GIA
  tweezers shot.
- **The lightbox builds `<source>` children instead of setting `el.src`**, so a browser that cannot
  decode VP9 gets the H.264 copy rather than a black slide. Every video item lists both encodings,
  on all three pages that have a lightbox.
- **Fixed a real bug:** the LPM fallback pointed at `assets/p1/sap.webp`, which does not exist.

### Both piece pages — one ground, no container

The heroes carry an opaque clip knocked out by `lighten`, and a blend can only reach a backdrop
painted **inside its own stacking context**. `.hero-media` (transform, via `.reveal`) and
`.hpanels-track` (transform, via the scrub) each form one, so the plate has to paint its own ground
— and for its edge to disappear that ground must equal the page's *at every point*, which a
gradient cannot do because the plate samples only one slice of it. So the subpage ground is now
**flat `--plate` + tiled `--grain`, declared identically on the page and on the plate**, and the
container stops existing optically. Measured before the change: plate `#1e1d1e` against page
`#201d19` — already within 3 levels, so the tell was the border and the texture, never the colour.

The grain is faint on purpose — `baseFrequency 0.60` at `opacity 0.07`, tiled at 300px. The first
attempt ran 0.85 at 0.22 and read as **television static** at page scale: the same sprite looks
like texture on a 400px card and like noise across a whole viewport. Four settings were compared
side by side. **`grain-lab.html`** is where that comparison lives — an unlinked, `noindex` page
with the ring on the real ground, sliders for colour, opacity, frequency, tile and octaves, a
grain *tint* (an `feColorMatrix` scaling the noise's channels), an outline toggle to check the
plate still vanishes, and a copy-paste CSS block. Values changed there must go into **both**
p1.html and p2.html or the plate comes back.

**Picture-in-picture is disabled on every video**, in markup and on the ones the lightbox builds.
Chrome offers PiP on any large enough `<video>`, and one stray click detached the hero into a
floating window leaving an empty box behind.

### `p2.html` — new

Cloned from `p1.html` and adapted. **Every stone figure is read off the IGI report**
(`assets/s3/Diamond_IGI_report_764657982.pdf`, 11 Feb 2026): natural diamond, pear modified
brilliant, 7.70 × 4.87 × 3.29 mm, **0.90 ct**, **natural fancy light greenish gray**, **VS2**,
polish and symmetry very good, no fluorescence. Gallery is the four `assets/s3` diamond assets;
Gallery is two videos (`dia`, `l2`) plus two diamond photographs — four, because the mobile thumb
grid is 2 columns and four fills it cleanly.

**The certificate frame is shaped to its own document.** The IGI report is 595.44 × 351.36 pt —
landscape — where p1's GIA report is 612 × 792 pt, letter portrait. It also needs an explicit
`.cert-col` width, which p1 does not: the column is a shrink-to-fit flex item, so on p1 the
portrait frame is bound by `max-height: 78vh` and its width falls out of the ratio, while a
landscape frame is never that tall, nothing drove it, and the column collapsed to 302px — correct
in shape and unreadably small. 24 `p2.*` i18n keys added in **both** languages.

---

## 4 · Asset inventory

| File | Used by |
|---|---|
| `assets/p1/equinoccio.{mov,webm,mp4}` + `-poster.webp` | index doorway, p1 hero, p1 LPM still |
| `assets/p1/equinoccio-card.{webm,mp4}` + `-card-poster.webp` | aromazla piece card |
| `assets/p2/lacrimosa.{mov,webm,mp4}` + `-poster.webp` | p2 hero, p2 LPM still |
| `assets/p2/lacrimosa-card.{webm,mp4}` + `-card-poster.webp` | aromazla piece card |
| `assets/s3/*` | p2 gallery + certificate |

**No file any page serves is over 2 MB.** Measured transfer: index 2.1 MB · aromazla 2.3 MB ·
p1 1.9 MB · p2 0.7 MB. Every served `.mp4` was checked for `moov` at the front (faststart) — all
pass.

**Unreferenced on disk: 27 files, ~93 MB.** Left in place deliberately — several are camera
originals and deleting them is Ivan's call. The heavy ones: `sap1.mov` 42 MB, `sap3.mov` 17.7 MB,
`mm.png` 8.2 MB, `mm-cutout.png` 5.4 MB, `sap-360.gif` 2.6 MB, the old `sap.{mov,webm,mp4}` set,
`sap5.jpeg`, and the now-unused `lacrimosa.{mov,webm}` alpha build. Clear before a deploy.

**Re-run the audit any time** — it lists every asset each page references, flags anything over
2 MB, and reports what is on disk but unused:

```bash
cd ivan-es && python3 - <<'EOF'
import re, os, glob
refs={}
for pg in ['index.html','aromazla.html','p1.html','p2.html','contact.html']:
    if not os.path.exists(pg): continue
    for m in re.findall(r'''["'(]([^"'()\s]*assets/[^"'()\s]+\.(?:mp4|webm|mov|jpg|jpeg|png|webp|gif|pdf))''', open(pg,encoding='utf-8').read()):
        refs.setdefault(m.split('#')[0].replace('%20',' '), set()).add(pg)
for f in sorted(refs, key=lambda f: -(os.path.getsize(f) if os.path.exists(f) else 0)):
    sz = os.path.getsize(f)/1048576 if os.path.exists(f) else -1
    print(f"{sz:7.2f} MB  {f:<44}{'MISSING' if sz<0 else ('<-- heavy' if sz>2 else '')}")
print('unused:', sum(os.path.getsize(f) for f in set(glob.glob('assets/**/*.*',recursive=True))-set(refs) if os.path.isfile(f))/1048576, 'MB')
EOF
```

---

## 5 · Open items

1. **Verify the `.mov` on a real iPhone.** Structurally it matches the file that already plays there
   — `ftyp=qt`, alpha flag present, 391 NALUs for 192 samples (base + alpha layer per frame) — but
   no Safari exists on this machine to test it.
2. **`p2.html`'s story text is a draft.** It is factually safe and says nothing about provenance,
   but it is not Ivan's voice — replace `p2.story.*` in `assets/i18n.js`.
3. ~~`e2.mp4`~~ — it was **`l2.mp4`**, and it belongs to p2, not p1. Encoded and in p2's gallery. Asked for in the p1 gallery; it is not in `~/Downloads` and not
   anywhere under `~`. The gallery is built to take it — add the encodes and one more thumb.
4. **The metal is stated nowhere on p2**, on purpose: it has not been confirmed. p1 says
   "18k white gold · rhodium plated"; p2 says nothing until Ivan confirms.
5. `assets/i18n.js` still carries **`p1.specs.*`** keys for a specifications panel that no longer
   exists in the markup.
6. The Google Fonts `<link>` means the site is **not** self-hosting fonts, which the launch
   checklist requires. Pre-existing, untouched here.
7. `insights/script.js` 404s locally — that is Vercel injecting it in production, not a fault.
