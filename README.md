# Guruprasad Jena — scrapbook portfolio

A five-page personal portfolio built as a physical notebook: dark desk background, torn
paper scraps, tape, spiral rings down the left edge, a beaded `INDEX` nav thread down the
right edge, handwritten marginalia, and a page footer stamped `NO. 0x / REV 1.0x`.

Next.js App Router, JavaScript, React 19. No CSS framework, no UI library, no animation
library — styling is inline styles plus two global stylesheets. Static export, so every
route is fully pre-rendered HTML.

```bash
npm install
npm run dev
```

| Route | Source | Stamp | Character |
|---|---|---|---|
| `/` | `Home.dc.html` | `NO. 01` | Portrait card, marginalia, working terminal |
| `/about` | `About.dc.html` | `NO. 03` | Editorial long-form + education card |
| `/skills` | `Skills.dc.html` | `NO. 05` | Skill stickers, proficiency scraps, 14-icon tools grid |
| `/projects` | `Projects.dc.html` | `NO. 04` | Blueprint drawer, four plotted sheets, self-drawing diagrams |
| `/contact` | `Contact.dc.html` | `NO. 07` | Quiet editorial page — no form, one mailto + 3 links |

## The pages are generated, not hand-written

`app/*/screen.jsx`, `app/globals.css` and `app/hover.css` are **build output**. Do not edit
them — edit the `.dc.html` design source and re-run:

```bash
npm run pages
```

The converter (`tools/dc2next.mjs`, `tools/build.mjs`) is re-runnable and makes no design
decisions: every colour, offset, rotation, keyframe and easing curve transfers verbatim.
It only strips the prototyping-tool scaffolding — `<x-dc>`, `<helmet>`, `{{ hole }}`,
`style-hover`, `support.js` — and rewrites `Home.dc.html`-style links to real routes.

```
design_handoff_scrapbook_portfolio/design/*.dc.html   ← source of truth
  ↓ npm run pages
app/                screen.jsx per route + globals.css + hover.css
```

Each route is a server `page.jsx` (which owns the route's `metadata`) rendering a client
`screen.jsx` (which owns state: the terminal, the deploy ticker, the active sheet).

## Layout

```
app/
  layout.jsx          fonts, globals.css, hover.css, <Motion/>, <InstantNav/>
  globals.css         GENERATED — union of the five pages' <helmet><style> blocks
  hover.css           GENERATED — one rule per style-hover/active/focus attribute
  page.jsx + screen.jsx          and the same pair under about/ skills/ projects/ contact/
  projects/projects-plot.js      all four case files as data; the sheet imports it lazily
components/
  Starfield.jsx       canvas starfield — replaces 120 animated <span>s with one paint
  motion-curves.js    the motion vocabulary: material curves and the spring solver
  scrap-motion.js     the motion layer (initScrapMotion / scan / rescan)
  Motion.jsx          mounts it, re-arms on route change
  InstantNav.jsx      route prefetch + window.__nav (page-turn hand-off)
public/photos/        5 webp + 14 tool PNGs
tools/                dc2next.mjs (converter), build.mjs (runner)
```

## Motion

The page arrives; it doesn't just appear. The rule the motion layer works to is that it
should read as **a hand assembling a scrapbook**, not as a set of animations playing at the
same time — so the work went into making fewer, truer movements rather than more of them.
`components/motion-curves.js` holds the vocabulary, `components/scrap-motion.js` applies it.

**Materials move like themselves.** Every recipe used to share one expo curve, which is why
the page read as busy but weightless: torn kraft, washi tape and handwriting all
decelerated identically.

| | behaviour | how |
|---|---|---|
| paper | mass and air: one soft overshoot, then a settle | a damped spring, solved and sampled into keyframes |
| tape | a thumb pressing it down: fast, dips past flat | per-segment easing, with a beat below its resting scale |
| ink | a pen at a pen's speed | duration derived from stroke length |
| type | no mass, so nothing to overshoot | the original expo |

Springs are specified as `overshoot` and `settle` — what you actually art-direct — and
solved back to stiffness and damping. That solver settled a discrepancy in the handoff: it
documents stiffness ≈170 / damping ≈22 for the scraps, but the keyframes it ships overshoot
a 30px rise by 4px. Feeding that 13% back through returns **stiffness 169** — the documented
stiffness was right and only the damping figure was loose. At damping 22 the overshoot is
0.7%, about 0.2px, which is no settle at all.

**Weight is visible.** The design already builds each scrap's shadow the way a real one is
built — contact, mid, ambient — and then held it still while the paper moved, which is what
made the scraps read as stickers. That stack is now driven by the paper's height in the arc:
the contact shadow leaves the desk first and fades, the others lengthen and soften, and
landing runs it backwards. Measured on Home's scraps, the ambient shadow travels 10px → 27px
offset and 12px → 32px blur while the contact layer drops from 0.55 to 0.11 alpha, then
returns to exactly the authored values. Because displacement is taken as an absolute value,
the shadow swells once more during the spring's overshoot and is the last thing to settle.

Only elements the design already gave a shadow to get one. Inventing shadows for the rest
would produce paper that casts a shadow solely while in motion, and would mean animating
`filter` on the tape strips, whose `url(#rough-tape)` turbulence would then re-rasterise
every frame.

**Things arrive in groups.** The cascade was a metronome — two elements every 110ms in
reading order, regardless of what they were, capped at six in flight. Evenly spaced motion
is a large part of what makes a page feel machine-assembled. Items whose boxes sit within
44px of each other vertically are now treated as one group and step through at 40ms; a new
group costs a 155ms beat; nothing waits longer than 1150ms. Delays are handed to the
recipes and the browser holds each animation until its turn, so nothing is in flight while
it waits.

**The page turn is the signature gesture**, and it now looks like paper: the sheet tipping
away from the spine casts the shadow a lifting page casts along the gutter, and the
arriving sheet flattens on the same hinge instead of fading in on a different axis. The
scrim is created for the turn and removed after it, with a timer backstop so a failed
navigation can never leave one over the page.

One thing was added purely for delight: the `INDEX` rail is drawn as beads strung on a
thread, so touching a bead plucks it — a 1.8px ring-down, solved with the same spring
machinery. Everything else here replaces a motion with a truer one.

Trade-off worth knowing: dropping the six-in-flight cap in favour of cluster pacing raises
peak concurrency to ~28 transform/opacity animations on Home. Those are compositor-cheap;
the repaint-heavy shadow animations peak at 5. Tune `IN_GROUP` / `BETWEEN` in
`scrap-motion.js` if you want it sparser.

Reduced motion still switches all of it off — the JS layer returns before it binds anything
and the CSS layer stops the loops.

## Verification

The port was checked against the `.dc.html` sources rendered in the same browser at the
same viewport, comparing every element's box, colour, font, weight, style, alignment and
text — 1,648 elements across the five pages, with animations cancelled so both sides rest
in the same state. The motion rework above changes nothing at rest, and this check is what
holds it to that: it was re-run afterwards and returned the same two differences.

**Result: 2 differences, and in both the port is the correct side.**

1. Home's "Deploying ideas…" progress meter is a live ticker that stutters through
   `[8,19,27,41,44,58,71,74,88,93,96,100]%` and resets. Two independently-loaded pages are
   never on the same step.
2. Projects' sheet tagline. `styleName()` paints it with the sheet's accent
   (`#ef8a4a` on Umbrix); in the design tool a re-render drops that inline colour and it
   falls back to the base `#e58d55`. The port keeps the accent, which is what the code asks
   for — and matches the sibling elements (status, stat figures, step numbers), which are
   accent-coloured on both sides.

Also verified: the terminal boots, takes input, walks history and `clear`s; all four
Projects sheets switch and re-plot with their own display face; Contact has zero form
controls and every link resolves; each route renders exactly one nav rail, foil, spiral
and footer; nothing overlaps the nav rail's box; no horizontal overflow at 1440 or 375;
`npm run build` and `npm run lint` are clean with no console errors or hydration warnings.

## Three bugs in the design sources, and what was done about them

**`Contact.dc.html` never loads Spectral.** Its body copy asks for
`font-family: Spectral, serif`, but the page's `<helmet>` font link omits Spectral, so the
original renders that page in the browser's default serif. The port loads it (as the
handoff spec and every sibling page do), so Contact's intro wraps to three lines instead of
two and the content below sits ~45px lower. Adding the missing font link to the original
makes the two match exactly. **This is the one place the port deliberately differs from
what the source file renders.**

**The mobile `[style*="flex:1 1"]` rules never fire in the design tool.** They select on
the literal text of the inline `style` attribute, and the moment anything assigns to
`element.style` the browser re-serialises the whole attribute with a space after each
colon. The design tool renders entirely on the client, so its attributes are always the
spaced form and the page's own mobile rule silently does nothing there. `build.mjs` emits
both spellings so the rule fires as written — including for elements the motion layer
touches at runtime.

**Ordering inside the merged stylesheet is load-bearing.** Skills declares
`[data-r="step"]{flex:0 0 calc(33.333% - .9rem)}` under `max-width:1024px` and then
`[data-r="step"]{flex:none}` under `max-width:700px`. Both are `!important` at equal
specificity, so source order alone decides the winner below 700px. `globals.css` is
therefore emitted in source order rather than regrouped by media query.

Two smaller notes: the handoff README's page table lists About as `NO. 02` and Skills as
`NO. 03`, but the design files stamp them `NO. 03` and `NO. 05` — the files win. And on
mobile the footer stamps sit behind the fixed bottom nav bar; that is true of the original
too, so it was left alone.

## Deviations from the handoff, deliberate

- **`image-slot.js` is not shipped.** It is the prototyping tool's drag-and-drop
  placeholder runtime, and no `<image-slot>` element exists in any of the five sources —
  only `Skills.dc.html` loads the script, and nothing uses it. Shipping it would add 65KB
  of dead code to every route. Re-add it to `public/` and `layout.jsx` if you later want
  droppable slots.
- **Abril Fatface is not loaded.** Nothing uses it; it belonged to the cut postcard
  variant. Bebas Neue and Space Grotesk *are* loaded — the Projects plotter gives each
  sheet its own display face, and those two are sheets 02 and 04.
- **Nav beads drive the page turn.** The motion spec has the 420ms page-turn hand off to
  the client router via `window.__nav`, but it only bound to `[data-motion-tab]`, which no
  source uses — so nothing called it and every tab change was a full document load. The
  handler is now bound to the `INDEX` bead links.
- **Restored from `design/motion.js`, which `reference/scrap-motion.js` had dropped:** the
  recipes return their animation (the cascade counts in-flight animations off it), the
  autotag pass skips short strings and elements already running their own CSS animation
  (otherwise the Caveat sparkles get seized by the ink recipe), and the desk lamp fades
  out after 1.5s of a still pointer.

## Open items

- Fonts still load from Google Fonts. Self-hosting via `next/font` is the biggest remaining
  load win, but it renames the families, so every literal `font-family:'Saira Condensed'`
  inside an inline style would have to move to a CSS variable in the same pass.
- No OG images yet. `app/*/page.jsx` is a server component exporting `metadata`, so they
  drop in cleanly.
