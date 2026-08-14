# Handoff: Guruprasad Jena — scrapbook portfolio (5 pages)

Paste this file into your repo and point Claude Code at it. Everything it needs is in this folder.

---

## 0. What you are looking at

A five-page personal portfolio built as a **physical notebook / scrapbook**: dark desk background,
torn paper scraps, tape, spiral rings down the left edge, a beaded "INDEX" nav thread down the right
edge, handwritten marginalia, and a page footer stamped `NO. 0x / REV 1.0x`.

```
design_handoff_scrapbook_portfolio/
  README.md                 ← this file (the whole spec)
  design/                   ← the five design sources + their runtime helpers
    Home.dc.html   About.dc.html   Skills.dc.html   Projects.dc.html   Contact.dc.html
    support.js              (design-tool runtime — DO NOT ship)
    motion.js               (choreography reference — port it, don't ship it as-is)
    image-slot.js           (drag-and-drop photo placeholders — used by Skills + Projects)
    projects-plot.js        (self-drawing schematic engine for Projects sheets)
    projects-data.json      (all four project case files as data)
  assets/photos/            ← every image the pages reference (5 webp + 14 tool PNGs)
  reference/                ← a PROVEN working Next.js port of these exact pages
    dc2next.js  harness.html  layout.jsx  globals.css  hover.css
    Starfield.jsx  scrap-motion.js  Motion.jsx  InstantNav.jsx
    package.json  next.config.mjs  jsconfig.json
```

### Fidelity: **high**

These are not wireframes. Every colour, font size, rotation, offset, keyframe and easing curve in the
`.dc.html` files is final. **Do not redesign, do not "improve", do not substitute a component
library.** The target is a zero-visual-diff port.

### About the design files

`*.dc.html` are **design references authored in a prototyping tool**, not production code. They are
plain HTML with inline styles, plus three tool-specific things you must strip:

| In the source | Meaning | What to do |
|---|---|---|
| `<x-dc>…</x-dc>` | component root wrapper | delete the tags, keep the contents |
| `<helmet>…</helmet>` | head content (fonts, `<style>`, script tags) | move into `app/layout.jsx` + `globals.css` |
| `<script type="text/x-dc" data-dc-script>` | the page's logic class | becomes a React component class |
| `{{ hole }}` | a value from that logic class | becomes `{V.hole}` |
| `style-hover="…"` / `style-active` / `style-focus` | pseudo-state styles | becomes a generated CSS class (see §6) |
| `ref="{{ f }}"`, `onClick="{{ f }}"` | React ref / handler | becomes `ref={V.f}`, `onClick={V.f}` |
| `support.js` | the prototyping runtime | **never ship it** |

Everything else — markup, inline styles, SVG filters, clip-paths, gradients — transfers verbatim.

---

## 1. Target stack

Next.js App Router, JavaScript (not TS — the port is JSX; convert if you want), React 18/19,
**no CSS framework, no UI library, no animation library.** Styling is 100% inline styles plus one
global stylesheet. Static export (`output: 'export'`) — no server, no env vars, no API routes.

`reference/package.json`, `next.config.mjs`, `jsconfig.json` are the exact configs of the working
port. Copy them.

```
app/
  layout.jsx            fonts, globals.css, hover.css, <Motion/>, <InstantNav/>, image-slot script
  globals.css           union of the five pages' <helmet><style> blocks (resets + every @keyframes)
  hover.css             GENERATED — one rule per style-hover/active/focus attribute
  page.jsx              /            Home
  about/page.jsx        /about
  skills/page.jsx       /skills
  projects/page.jsx     /projects
  contact/page.jsx      /contact
components/
  Starfield.jsx         canvas starfield (replaces 120 animated <span>s)
  scrap-motion.js       ported motion layer (initScrapMotion / scan / rescan)
  Motion.jsx            mounts it, re-arms on route change
  InstantNav.jsx        route prefetch + window.__nav (page-turn hand-off)
public/
  image-slot.js  projects-plot.js
  photos/               profile.webp, polaroid.webp, about-polaroid.webp,
                        about-ghost.webp, contact-ghost.webp, photos/tools/*.png
```

---

## 2. Page map

| Route | Source | Footer stamp | Character |
|---|---|---|---|
| `/` | `Home.dc.html` | `NO. 01 · REV 1.01` | Portrait card + marginalia + **working terminal** |
| `/about` | `About.dc.html` | `NO. 02` | Editorial long-form + polaroid + education card |
| `/skills` | `Skills.dc.html` | `NO. 03` | Skill stickers, proficiency scraps, 14-icon tools grid |
| `/projects` | `Projects.dc.html` | `NO. 04` | Blueprint drawer: 4 plotted "sheets", self-drawing diagrams |
| `/contact` | `Contact.dc.html` | `NO. 07` | Quiet editorial page — **no form**, one mailto + 3 links |

Nav order is Home · About · Skills · Projects · Contact. In the sources the links are
`href="Home.dc.html"` etc. — **rewrite to `/`, `/about`, `/skills`, `/projects`, `/contact`** in both
the markup and inside the logic strings (Home's terminal `CMDS.projects` mentions the tab; `ls`
output must list only these five).

Sibling design files in the sandbox — `Notes.dc.html`, `Journey.dc.html`, `Contact (postcard v2)`,
`Projects (case files v2)`, `About explorations` — are **abandoned explorations and are not
included.** Ignore any reference to them.

---

## 3. Design tokens

### Palette

```
ink / paper (dark)
  page text            #ede4d8      headings           #f5efe7
  body dim             #ccbba8      dimmer             #b3a894  #baa792
  meta / stamps        #9c8f7c      #a89e8d   #b0a08c
  card dark            linear-gradient(180deg,#1c1e1f,#121313)   border rgba(255,255,255,0.09)
  desk base            linear-gradient(158deg,#242c31 0%,#1b2328 56%,#101619 100%)

kraft / torn paper (light scraps)
  kraft                linear-gradient(180deg,#e2d5b8,#d1c09a)     text #2c2113 / #3d3220
  photo stock          linear-gradient(180deg,#f2e9d8,#e4d8c2)
  kraft ring           linear-gradient(135deg,#c06a24,#8f4a20 52%,#5a3113)

accents
  orange   #e58d55   warm #da8b52  #e0ae81  #ec6a4a  #e0654a  #c2543a
  magenta  #d080cc   #ce72c0
  violet   #b58ce8   #9a6be0   #c4a2ea
  teal     #6fb8ae   #9fd6cb
  green    #7daa76   #8fb57a   #a9c58a
  brass    #e8b64a   #d9a441   #ecc35a
  red      #d0566b   #c14a2f

per-page accent (foil frame + focus ring)
  Home #e58d55 · About #c4a2ea · Skills #7daa76 · Projects #f0a563 · Contact #e58d55

link  a #e58d55   a:hover #fbcfa6
selection  rgba(232,137,74,0.4) on #fbf5ec
focus-visible  2.5px dashed #6fb8ae, offset 3px  (Projects overrides to #f0a563)
```

### Type

Google Fonts, `display=swap`, loaded in `layout.jsx`:

```
Playfair Display   400..800 + italic   display headings, h1/h2, nav labels
Caveat             400..700            handwriting: marginalia, kraft-scrap copy
Patrick Hand                           body default (body font-family)
JetBrains Mono     400..700            meta, kickers, terminal, stamps
Special Elite                          typewriter stamps ("PAGE 01", ticket text)
Spectral                               Contact + Projects editorial body
Saira Condensed    600                 Projects blueprint labels / CTA
Abril Fatface                          only if you also port the postcard variant
```

Scale in use: `0.44 · 0.48 · 0.55 · 0.56 · 0.58 · 0.6 · 0.62 · 0.66 · 0.7 · 0.72 · 0.78 · 0.82 ·
0.9 · 0.95 · 1 · 1.05 · 1.15 · 1.25 · 1.3 · 1.45 · 1.5 · 2 rem`, headings
`clamp(2.4rem, 4.6–6.5vw, 3.5–5rem)`. Mono meta always carries `letter-spacing` between `0.08em`
and `0.4em`. Handwriting is Caveat at `1.05–1.5rem`, `line-height 1.15–1.3`.

### Geometry

```
page padding   clamp(1.4rem,3.2vw,2.5rem) clamp(9.25rem,6.6vw,10rem)
               clamp(3.5rem,6vw,5rem)     clamp(4rem,4.4vw,5.5rem)
               max-width 96rem            ← right padding is reserved for the nav thread
radii          0 (torn paper) · 6px (dark cards) · 8px (tool chips) · 50% (beads, portrait)
rotations      −14 −8 −7 −6 −3 −2 −1 +2 +5 +6 deg — every scrap is off-axis, none is 0
gaps           0.2 0.35 0.55 0.75 1 1.25 1.5 1.75 2 2.25 3 3.5 4.5 rem
```

### The three paper recipes (reuse, don't re-derive)

**1. Torn kraft scrap** — 30-point deckle silhouette + aged edge burn + drop-shadow lift:

```css
background:
  radial-gradient(84px 34px at 6% 0%, rgba(24,11,4,.55), transparent 72%),
  radial-gradient(74px 30px at 94% 3%, rgba(24,11,4,.5), transparent 74%),
  radial-gradient(70px 30px at 2% 90%, rgba(24,11,4,.52), transparent 74%),
  radial-gradient(88px 34px at 97% 97%, rgba(24,11,4,.55), transparent 72%),
  radial-gradient(64px 24px at 50% 100%, rgba(24,11,4,.42), transparent 76%),
  radial-gradient(116% 126% at 50% 46%, transparent 44%, rgba(128,74,30,.36) 70%,
    rgba(88,46,18,.62) 86%, rgba(46,22,9,.82) 95%, rgba(20,10,4,.92) 100%),
  linear-gradient(180deg,#e2d5b8,#d1c09a);
clip-path: polygon(1% 5%,8% 1%,17% 4%,29% 1%,41% 4%,54% 1%,65% 4%,78% 1%,90% 3%,99% 2%,
  99% 12%,100% 27%,98% 42%,100% 58%,99% 74%,100% 89%,97% 99%,85% 97%,71% 100%,56% 97%,
  42% 100%,28% 97%,14% 100%,4% 98%,1% 91%,2% 75%,0% 58%,1% 41%,0% 24%);
filter: drop-shadow(0 1px .5px rgba(0,0,0,.55)) drop-shadow(0 4px 4px rgba(0,0,0,.3))
        drop-shadow(0 10px 12px rgba(0,0,0,.2));
```

`clip-path` clips `box-shadow`, so the lift **must** be `filter: drop-shadow(...)`. Same rule
everywhere.

**2. Sketchy gradient ring** — an inset absolute span, masked to a 1.5–3px border, wobbled by an SVG
filter:

```html
<span aria-hidden="true" style="position:absolute;inset:0;z-index:3;border-radius:inherit;
  padding:1.5px;background:linear-gradient(135deg,#e58d55 0%,#d080cc 34%,#7daa76 68%,#6fb8ae 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  filter:url(#sketch-edge);opacity:.85;pointer-events:none"></span>
```

**3. Washi tape** — a rotated clip-pathed span with a striped translucent fill:

```css
background:
  linear-gradient(178deg, rgba(255,255,255,.34) 0%, rgba(255,255,255,.05) 26%,
    rgba(255,255,255,.02) 74%, rgba(255,255,255,.22) 100%),
  repeating-linear-gradient(94deg, rgba(255,255,255,.14) 0 2px, transparent 2px 7px),
  rgba(214,168,96,.48);            /* or rgba(244,240,232,.5) / rgba(168,216,234,.5) */
clip-path: polygon(3% 0%,97% 5%,100% 34%,97% 63%,100% 95%,4% 100%,0% 66%,2% 32%);
filter: url(#rough-tape) drop-shadow(0 1px 1px rgba(0,0,0,.45))
        drop-shadow(0 3px 4px rgba(0,0,0,.28));
```

### SVG filter defs — keep the ids exactly

Each page opens with a hidden `<svg>` holding five `feTurbulence + feDisplacementMap` filters:
`torn-edge-1`, `torn-edge-2`, `torn-edge-3`, `rough-tape`, `sketch-edge`. Inline styles reference
them by id (`filter:url(#sketch-edge)`), so **the defs must be in the same document as the element**
— put them in each page component (or in `layout.jsx` once, which is what the port does). Copy the
`<defs>` block verbatim from any source file; the `baseFrequency`/`seed`/`scale` numbers matter.

---

## 4. Shared page chrome (identical on all five pages)

Build these once and reuse; the sources repeat them per page.

1. **Desk background** — on `body` in `globals.css`: an inline SVG fractal-noise data-URI (opacity
   .06), then ~8 stacked radial gradients (two faint concentric "coffee ring" circles at 86%/85% and
   13%/90%), a vignette, then the `158deg` base gradient. `background-attachment: fixed`.
2. **Foil frame** (`data-r="foil"`) — `position:fixed;inset:0`, 9px padding, gradient border-box
   masked with `exclude`, `filter:url(#torn-edge-2)`. Per-page gradient (Home
   `#3f4e58→#26323a→#35454f→#212b33`; About/Skills/Projects/Contact use the brass
   `#6b5638→#40331f→#5a4426→#382a18`).
3. **Spiral binding** (`data-r="spiral"`) — fixed strip `left:-16px;width:64px`, an inline-SVG ring
   tiled `repeat-y` at `64px 46px`.
4. **Index nav** (`data-r="nav"`) — fixed right rail, vertically centred: a 1px vertical
   "thread" gradient (`data-r="thread"`) with a travelling highlight (`data-r="shine"`,
   `threadshine 9.5s`), the word `INDEX` (`data-r="index"`, mono 0.6rem/0.22em), then five
   `data-r="beadlink"` rows (`height:2.75rem`, label + bead). The **current page's** bead is brass
   `radial-gradient(circle at 32% 26%,#f0dda6,#9c8149 62%,#4e3d1a)` at `0.72rem` with a glow +
   `beadbreathe 4.6s`; other beads are `0.5rem` and material-coded (pearl / green / rose / pearl).
   Labels: current `0.74rem/700/#f0dda6`, others `0.68rem/500/#b3a894`. Hover slides the row
   `translateX(-7px)` over 300ms. Entrance: thread `scaleY 0→1` 900ms, then beads pop and labels
   slide in from `+11px`, staggered ~110ms per row.
5. **Footer** — a hairline rule at `bottom:1.55rem;left:6rem;right:2rem`, plus `NO. 0x` bottom-left
   and `REV 1.0x · 4f2a9c1` bottom-right, mono `0.6rem/0.08em`, `rgba(224,214,188,0.45)`.
6. **Decoration layers** (`data-motion-deco`) — two absolutely-positioned `aria-hidden` layers of
   percentage-placed sparkles (`✦ ✧ ✚`), self-drawing SVG doodles (stars, hearts, squiggles, zigzags
   via `pathLength="1"` + `stroke-dashoffset` and the `dw` keyframe), and handwritten margin jokes
   ("renamed the variable for the ninth time", "three hours for one margin"). Plus the starfield
   layer (`{{ stars }}`).

---

## 5. Per-page content notes

### `/` Home (`NO. 01`)
Two columns, `gap:3rem`. **Left rail, `flex:0 0 19rem`:** vertical Caveat spine text
"It's Not Over Until I Win." rotated 180°; a pinned kraft tag "still figuring things out ☆"; the
**portrait card** (circular `photos/profile.webp`, `object-position:50% 22%`, counter-rotating dashed
ring, `ringspin-rev 14s` / `ringspin 40s`), name `Guruprasad Jena` (Playfair 1.5rem/600), role
`FULL-STACK DEVELOPER` (mono 0.56rem/0.28em/#e58d55), a Caveat pull-quote, a kraft note ("I like
building things people **actually use**…" with a `<mark>`), and four circular social buttons
(GitHub ◧ / LinkedIn in / X ✕ / mail ✉, 2.4rem, hover `translateY(-3px)`); then a
`TODOS.EXE` window with three checklist rows.

**Right column:** a rotated "open to work ☀" violet tag; kicker `// get to know the person behind
the code ↓`; `h1` "Hello, I'm **Guruprasad Jena**" (Playfair `clamp(2.6rem,4.8vw,3.7rem)`, the name
in a `#e58d55→#d080cc→#b58ce8` gradient clip); a `PAGE 01` typewriter label over an italic Playfair
intro with a struck-through word; a **"Deploying ideas…" progress meter** that stutters through
`[8,19,27,41,44,58,71,74,88,93,96,100]%` then resets; the "Future HR, please act like discovering me
was entirely *your idea*" marginal note; a row of scraps — `SYSTEM.LOG` (Build/Learn/Deploy/Repeat),
kraft "What drives me" checklist (Curiosity · Impactful ideas · Continuous growth · Clean
architecture), a mono blockquote "Code is not just what I write…" — *me, to myself, at 2am*, and the
`photos/polaroid.webp` polaroid captioned "the pirate king ♛"; a **Fun facts** kraft strip (Anime
enthusiast ツ · Night-owl developer ☾ · Music heals ♫ · Overthinker by default ☁); a
`BUILT WITH ♥` stack card (React ◉ · Node.js ⬢ · MongoDB ✿ · Tailwind ≈ · Vite ⚡ · "and lots of ☕");
a "Relationship Status / Committed… / to Git ♡" block; and the **terminal**.

**Terminal** (`guru@notebook:~`) — the one genuinely interactive piece:
- Boot sequence types three commands char-by-char (45–100ms/char) then prints output:
  `whoami`, `skills --list`, `currently`.
- A `CMDS` map answers: `help whoami about skills projects stack socials contact resume currently
  joke sudo ls date echo`, `clear` empties it; unknown → `command not found: x — try "help"`.
- ↑/↓ walk a 30-entry history. Blinking block caret (`blink 1.1s steps(1,end)`).
- Clicking the body focuses the input. Copy the `CMDS`/`BOOT` tables verbatim from the source.

**Starfield** — 120 stars from a seeded PRNG (`seed = 20260726`, LCG `seed*1103515245+12345 &
0x7fffffff`), six colours `#cdbcff #ffd9a8 #dfe6ff #a8e6d8 #ffc0e0 #ffffff`, size 2–5px,
`tw 2.8–6.3s` twinkle. **Do not ship 120 animated spans** — `reference/Starfield.jsx` draws the
identical field into one DPR-aware canvas at ~30fps, parked on hidden tab / reduced motion.

### `/about` (`NO. 02`)
Kicker `// about.me.ts`; `h1` "About **me**" (`clamp(2.8rem,5vw,4rem)`); a numbered-chip `h2`
(`clamp(2.05rem,3.5vw,2.65rem)`, weight 500) over two mono long-form paragraphs
(`0.8rem/1.95`, `#b3a894`, `text-wrap:pretty`); `photos/about-polaroid.webp` in a taped photo
frame; a torn **education card** — `Fakir Mohan University` in Playfair 1.12rem/600 with a
typewriter meta row and a 2px rule; `photos/about-ghost.webp` as a large low-opacity backdrop
(`data-r="ghost"`, hidden under 900px).

### `/skills` (`NO. 03`)
Kicker `// skills.me.ts`; `h1` "My **skills**". Left hero column `flex:1 1 min(100%,20rem)`,
`max-width:27rem`. Content: skill sticker clusters, proficiency scraps, and a
**`TOOLS I REACH FOR`** grid — `repeat(auto-fill,minmax(min(100%,7.2rem),1fr))`, `gap:0.55rem`,
14 chips (`padding:0.42rem 0.5rem`, `border-radius:8px`, `1px solid rgba(255,255,255,.09)`,
`linear-gradient(170deg,…)` fill, icon + label at `gap:0.42rem`). Icons live at
**`/photos/tools/*.png`** — `vs-code, github-actions, vercel-cron, upstash, resend, cloudinary,
mongodb-compass, thunder-client, figma, eslint, prettier, pdf-js, tesseract-ocr, webassembly`.
Uses `image-slot.js` for droppable photo placeholders.

### `/projects` (`NO. 04`)
A **blueprint drawer**. Left rail: `DRAWER` label, "four sheets, four live products", four
`data-btn` sheet buttons (`data-i="0..3"`), a `BILL OF MATERIALS` stack list (`data-stack`), and
`VISIT` / `REPO` links. Right: one plotted sheet at a time — `data-slug`
(`SHEET 01 · UMBRIX.DWG`), `data-status` (`LIVE · PLOTTED AT 1:1`), an SVG `data-namebox` title with
a gradient, a Caveat tagline, then the case-file body (problem / breakthrough / what failed / what
changed / what I learned / what I'd rebuild), decisions, timeline, stats, and a **self-drawing
architecture diagram** whose nodes/sides/wires come from `projects-data.json`
(`projects-plot.js` traces the strokes; three sheets have bespoke diagrams — GetFreeTools, Sahayam,
Umbrix — the rest use the generic rail).

All four projects, their copy, stack lists, stats, decisions, timelines and diagram graphs are in
**`design/projects-data.json`** — keep it as the single source of truth:
Umbrix (`#ef8a4a`, umbrix.in) · GetFreeToolsAI (`#6fc4b8`, getfreetoolsai.com) ·
Veritas Picks (`#b98be0`) · Sahayam (`#ef6a5a`).

### `/contact` (`NO. 07`)
Deliberately the **quietest page in the book** — no form, no wax seals, no postcard. (An earlier
postcard-flip concept was cut; ignore any prompt describing it.)

- `OPEN TO WORK` status line: mono `0.66rem/0.2em/#9c8b6d` with a `6px` green `#7daa76` dot
  (`box-shadow:0 0 8px rgba(125,170,118,.8)`), on a left hairline gradient rule.
- `h1` italic Playfair `clamp(2.9rem,6.5vw,5rem)`, weight 500, `line-height:.95`.
- Spectral intro `1.08rem/1.8`, `max-width:30rem`, `#c8bba8`.
- One large **mailto** link, Spectral `clamp(1.35rem,3.4vw,2.3rem)` →
  `mailto:guruprasadjena989@gmail.com?subject=Hello%20Guru`.
- A rule, then three mono links `0.72rem/0.16em/#ccbba8` separated by 1px dividers: GitHub ·
  LinkedIn · Résumé (`?subject=R%C3%A9sum%C3%A9%20please`), and right-aligned
  `FULL-STACK · TS · NEXT · NODE · MONGO`.
- A `repeat(auto-fit,minmax(min(100%,13rem),1fr))` fact grid — **AVAILABILITY** "Immediately —
  full-time or contract." · **WHERE** "Odisha, India. Remote, or relocating." · **OVERLAP** "Six
  hours with London, four with New York." · **EVIDENCE** "Four products live — see projects".
- `photos/contact-ghost.webp` ghost art bottom-right.

### Real data (do not invent placeholders)

```
email     guruprasadjena989@gmail.com
github    https://github.com/guruprasad-jena
linkedin  https://linkedin.com/in/guruprasadjena
x         https://x.com/guruprasadjena
location  Odisha, India (UTC+5:30)
```

---

## 6. Interaction & motion

`design/motion.js` is the choreography spec. Re-implement it; `reference/scrap-motion.js` is that
implementation, already merged into **one** idle-parking `requestAnimationFrame` loop (the original
ran two forever). Recipes, keyed by `data-motion` on the element:

| `data-motion` | Entrance |
|---|---|
| `scrap` | rises 30px with slight over-rotation and settles — spring, stiffness ≈170, damping ≈22 |
| `tape` | mat fades first, then tape/staples scale from 0.35 with a snap ~200ms later |
| `tag` | pops in |
| `head` | wipes up under a `clip-path` mask |
| `kicker` | tightens from wide letter-spacing |
| `line` | fades + rises |
| `data-motion-deco` | parallaxes on scroll at its own rate, `tanh`-saturated so it never drifts >74px |

Stagger ~60ms in document order, triggered when in view (once), margin `0 0 -8% 0`.

**Hover:** scraps `translateY(-7px) scale(1.012)` **while preserving their base rotation** (the base
rotation is in the inline style — the hover rule must repeat it); chips lift with a deeper shadow;
nav rows slide `-7px`. All `260ms cubic-bezier(.2,.8,.25,1)`.

**Keyframes** (all in `globals.css`, names are referenced by inline styles — don't rename):
`ringspin ringspin-rev photobreathe blink tw fl hb tk dw sw rk navthread navthreadx navbead navlabel
navfade beadbreathe threadshine`.

**Reduced motion / print:** `prefers-reduced-motion: reduce` disables every entrance, parallax and
hover transform; print renders the pages flat.

**Hover CSS is generated, and needs `!important`.** Every element also carries an inline `style`,
which beats a plain class rule. The converter emits one class per unique `style-hover` value into
`hover.css` as `.cls:hover { … !important }` — see `reference/hover.css` for the output and
`reference/dc2next.js` for the extraction.

**Page turns:** `InstantNav.jsx` prefetches sibling routes and exposes `window.__nav`, so the 420ms
page-turn animation plays fully and then hands off to the client router instead of a document load.

---

## 7. State

Almost none. Per page:

- **Home** — terminal (`lines`, `value`, `history`, `hIdx`, `booting`, `typed`) + `deploy` percentage
  ticker. All timers collected and cleared on unmount.
- **Projects** — `activeSheet` index (0–3), driven by the four `data-btn` buttons; the diagram
  re-traces on change.
- **Skills / Projects** — `image-slot` drop state (persisted per slot id by the component).
- **About / Contact** — none.

No data fetching. `projects-data.json` is imported at build time.

---

## 8. Assets

Copy `assets/photos/` → `public/photos/`. Rewrite every image `src` to an **absolute** path
(`/photos/…`): the sources use relative paths, which resolve at `/` but 404 from any nested route in
a static export.

| File | Used by |
|---|---|
| `profile.webp` | Home portrait — **preload, `fetchpriority="high"`, not lazy** |
| `polaroid.webp` | Home polaroid |
| `about-polaroid.webp`, `about-ghost.webp` | About |
| `contact-ghost.webp` | Contact |
| `tools/*.png` (14) | Skills tools grid |

Everything else is CSS or inline SVG — there are no icon fonts and no icon library. All images
except the Home portrait are `loading="lazy" decoding="async"`. Total ~375KB.

---

## 9. Definition of done

- `npm run build` and `npm run lint` clean; zero hydration warnings in dev.
- All five routes render with **one** nav rail and **one** footer each; no duplicated chrome.
- Measured check per route: nothing overlaps the nav rail's bounding box, and no text node is covered
  by a sibling scrap. Verify by measuring, not by eye — the right page padding
  (`clamp(9.25rem,6.6vw,10rem)`) exists for this.
- No `{{ hole }}`, `.dc.html` href, `support.js`, `<x-dc>`, `<helmet>`, `<sc-for>`, `<sc-if>`,
  `style-hover` or `data-dc-*` survives anywhere under `app/`.
- Home's terminal boots, accepts input, walks history, and `ls` lists only the five live pages.
- Projects switches all four sheets and re-traces the diagram each time.
- Contact has no form controls; all links resolve to the §5 values.
- `prefers-reduced-motion: reduce` kills all motion; print is flat.
- Screenshot diff against the `.dc.html` opened in a browser: no visible difference.

## 10. Suggested order

1. Scaffold + `layout.jsx` + `globals.css` + filter defs + fonts. Verify the desk background alone.
2. Shared chrome: foil, spiral, nav rail, footer. Verify on a blank route.
3. `/about` — the simplest page. Establishes the conversion rules end to end.
4. `/contact`, then `/skills`.
5. `/` Home — the terminal and the starfield.
6. `/projects` — the data-driven sheets and the diagram engine (largest page).
7. Motion layer + `hover.css` generation, then reduced-motion and print passes.

Reusing `reference/dc2next.js` is the fastest correct route: it is a re-runnable converter (edit a
`.dc.html`, re-run, get the same page back) and `reference/harness.html` transpiles + mounts all five
outputs to catch unconverted holes and runtime errors. If you'd rather hand-write the components,
read the converter anyway — its rules list is the complete set of gotchas (entity decoding, top-level
`;` splitting so gradients survive, `--custom-props` as string keys, live values as template
literals, SVG kebab→camel, a bare `<` in copy like `<12h` treated as text, custom elements left
untouched).

## 11. Known open items (not blockers)

- Fonts still load from Google Fonts. Self-hosting via `next/font` is the biggest remaining load win
  but renames the families, so every literal `font-family:'Saira Condensed'` inside an inline style
  would have to move to a CSS variable in the same pass. Left as its own change so the visual diff
  stays at zero.
- No per-page metadata / OG images yet — `app/*/page.jsx` should stay a server component exporting
  `metadata` so this can be added cleanly.
- The Umbrix case study has no hard metrics yet (users, listings/day, uptime, latency); the sheet is
  written to accept them.
