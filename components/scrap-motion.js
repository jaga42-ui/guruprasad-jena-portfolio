/* Scrapbook motion — the JavaScript half.

   The choreography this replaces was right about what the page should feel like and
   wrong about who should run it. Every arrival was a Web Animations keyframe list built
   in JS, sampled from a solved spring into 49 steps, and — for the paper — a second
   animation on a second node interpolating a `filter` string. That last part is the
   whole story: filter is a paint property, so a 780ms shadow lift was 780ms of forced
   repaints, on up to fourteen scraps at once, triggered by exactly the thing that made
   them visible. Scrolling.

   Measured on the home page before this rewrite: 131 running animations, 59 of them
   infinite, 37 of those inside a single [data-motion-deco] container that the parallax
   loop wrote style.transform onto every scroll frame. The JS itself was never the
   problem — the scan passes clocked 0.7ms and 0.9ms. It was all paint.

   So the arrivals moved to CSS scroll-driven animations (see app/motion.css) where the
   compositor owns them, and what is left here is the work that genuinely needs a
   script:

     · deciding which recipe each element gets, and how deep it sits
     · the four recipes that are paint-bound and therefore fire once instead of scrubbing
     · the page turn, which is a navigation event
     · the desk lamp, which follows a pointer
     · parking decoration that has scrolled out of sight

   ── what went away ─────────────────────────────────────────────────────────────────

   MutationObserver on document.body/subtree. The home page runs a terminal that types
   itself character by character via setState, so the observer fired roughly forty times
   during boot and each firing re-ran a full autotag pass. Route changes are the only
   thing that actually needs a re-arm, and Motion.jsx already knows when those happen.

   The 400ms sweep interval and the scroll-debounced sweep behind it. Both existed to
   catch elements the IntersectionObserver missed while they sat at opacity:0 — a
   failure mode created entirely by holding elements at opacity:0 in the first place.
   Nothing here hides anything, so there is nothing to rescue. (The old scheme's failure
   was not hypothetical: a backgrounded tab left 29 elements invisible, because rAF does
   not fire when hidden and the cascade never ran.)

   The spring solver. motion-curves.js is still there and still correct, but a solved
   spring baked into 49 keyframes is a main-thread animation, and the arrival curves now
   live in @keyframes where a browser can run them off-thread. The overshoot survives as
   authored percentages; see m-paper and m-tape in app/motion.css.                     */

import { CURVE, pluckTrack } from './motion-curves';

/* Scroll-driven animation is the fast path and the good path — motion that tracks the
   scrubber rather than firing and forgetting. Where it is missing, app/motion.css falls
   back to a one-shot transition and this file drives it from an observer. */
const SCRUB = typeof CSS !== 'undefined' &&
  CSS.supports && CSS.supports('animation-timeline', 'view()');

/* Which data-motion values are pure translate/rotate/scale/opacity, and therefore belong
   to the compositor. Everything not in here is paint-bound and handled below. */
const SCRUBBED = {
  scrap: 1, mat: 1, chip: 1, tag: 1, tape: 1,
  line: 1, head: 1, kicker: 1, stamp: 1, plot: 1,
};

/* How far off the desk each kind of thing floats, 0 (flat) to 1 (well above it). This is
   the entire depth system: app/motion.css multiplies every parallax distance by it, so
   one number per element decides how much a scrap separates from the page as it scrolls.

   The ordering is the physical one. A mat is the backing board and barely moves; a scrap
   is pinned to it; tape and tags sit on top of the scrap; a stamp is ink pressed into
   the paper and so belongs almost flat, despite arriving with the most force. */
const DEPTH = {
  mat: 0.08, stamp: 0.12, line: 0.2, kicker: 0.26,
  scrap: 0.42, head: 0.5, chip: 0.3, tape: 0.62, tag: 0.7,
  /* A plot section is the sheet itself, not something resting on it, so it sits nearly
     flat — enough separation to feel like paper moving under glass, not enough to drift
     away from the drawing it contains. */
  plot: 0.16,
};

/* A little scatter, so two scraps side by side do not drift in lockstep. Deterministic in
   the element's position in the document, because a random depth that changes on every
   client-side navigation would make the same page feel different each visit. */
function jitter(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 0.3 - 0.15;
}

let started = false;
let reduce = false;
let io = null;        // one-shot recipes
let idleIo = null;    // decoration parking

/* ── the paint-bound four ─────────────────────────────────────────────────────────────

   clip-path, stroke-dashoffset and textContent cannot be composited. Scrubbing them
   against scroll position would repaint on every frame of every scroll, which is the
   mistake this rewrite exists to undo. They fire once, on first entry, and are then
   inert for the life of the page. */

const ONESHOT = {
  /* Handwriting is drawn, never faded — and a pen moves at a pen's speed, so the
     duration comes from how far it has to travel. A fixed duration made a three-word
     margin note take as long as a full line, which is the tell that it is a wipe and
     not a hand. */
  ink(el) {
    const w = el.getBoundingClientRect().width || 180;
    el.style.setProperty('--m-ink-ms',
      Math.max(360, Math.min(1500, Math.round(360 + w * 3.2))) + 'ms');
    el.classList.add('m-fired');
  },

  /* An ink line stitches itself along its own length. Short strokes are left alone —
     below about 110px the draw is over before it registers as one. */
  thread(el) {
    let L = 0;
    try { L = el.getTotalLength(); } catch (e) { L = 0; }
    if (L < 110) { el.classList.remove('m-thread'); return; }
    el.style.strokeDasharray = L;
    el.style.setProperty('--m-len', L);
    el.style.setProperty('--m-thread-ms', Math.min(1600, 380 + L * 1.4) + 'ms');
    el.classList.add('m-fired');
  },

  mark(el) { el.classList.add('m-fired'); },

  /* Figures count up to the printed number and land on the literal text, so a "4" that
     is really "4 live" or "1,200+" keeps its prefix and suffix.

     The hidden-document guard matters more than it looks. This is the one recipe that
     rewrites the element's text, and it is driven by rAF — which does not fire in a
     backgrounded tab. Without the guard the first step writes the value at q=0, which is
     zero, and then nothing ever runs again: an IntersectionObserver still fires in a
     hidden tab, so "11,500 postings the filter was tested on" would quietly become "0"
     and stay there until the reader focused the tab. A number that reads as a real claim
     about someone's work is the worst possible thing to leave holding a wrong value, so
     when there is no one watching it simply lands on the literal text. */
  count(el) {
    const raw = el.dataset.mTo || (el.textContent || '').trim();
    const m = /^(\D*)([\d,]+)(\D*)$/.exec(raw);
    if (!m) return;
    el.dataset.mTo = raw;
    if (document.hidden) { el.textContent = raw; return; }
    const target = parseInt(m[2].replace(/,/g, ''), 10);
    const grouped = m[2].indexOf(',') > -1;
    const t0 = performance.now(), ms = 900;
    (function step() {
      if (document.hidden) { el.textContent = raw; return; }   // tab left mid-count
      const q = Math.min(1, (performance.now() - t0) / ms);
      const v = Math.round(target * (1 - Math.pow(1 - q, 3)));
      el.textContent = m[1] + (grouped ? v.toLocaleString('en-US') : v) + m[3];
      if (q < 1) requestAnimationFrame(step);
      else el.textContent = raw;
    })();
  },
};

/* Elements whose one-shot came due while the tab was backgrounded, waiting for someone
   to actually be there to see it. See the note in the observer below. */
let deferred = [];

function fire(el) {
  const fn = ONESHOT[el.dataset.motion];
  if (fn) { try { fn(el); } catch (err) { /* a recipe must never block the page */ } }
  else el.classList.add('m-in');            // the no-scroll-timeline fallback
}

function flushDeferred() {
  if (document.hidden || !deferred.length) return;
  const q = deferred;
  deferred = [];
  q.forEach(fire);
}

/* ── tagging ──────────────────────────────────────────────────────────────────────── */

/* The pages do not spell out every motion hook, so a few are inferred. This runs once per
   element ever — the __m latch is why it can afford getComputedStyle at all, and why the
   old MutationObserver re-entry was so costly: it paid this repeatedly. */
function autotag(root) {
  /* Handwriting is whatever is actually set in Caveat. Anything already carrying its own
     CSS loop (the deco sparkles) must not be seized. */
  root.querySelectorAll('p,span,div,h2,h3,h4,li,blockquote').forEach((el) => {
    if (el.__mTag) return;
    el.__mTag = 1;
    if (el.dataset.motion || el.closest('nav') || el.closest('[data-motion-tab]') ||
        el.closest('[data-plot]')) return;
    if (el.parentElement && el.parentElement.closest('[data-motion="ink"]')) return;
    const t = (el.textContent || '').trim();
    if (!t || t.length < 3 || t.length > 240) return;
    if ((el.style.animation || '').length) return;
    if (el.querySelector('p,div,svg,img,button')) return;
    const f = getComputedStyle(el).fontFamily || '';
    if (!/^["']?Caveat/.test(f)) return;
    el.dataset.motion = 'ink';
  });

  /* A lone large number is a figure worth counting up to. */
  root.querySelectorAll('span,div,p,strong,dd').forEach((el) => {
    if (el.__mCnt) return;
    el.__mCnt = 1;
    if (el.dataset.motion || el.children.length ||
        el.closest('[data-plotter]') || el.closest('nav')) return;
    const t = (el.textContent || '').trim();
    if (!/^\D{0,2}[\d,]{1,7}\D{0,3}$/.test(t) || !/\d/.test(t)) return;
    if (parseFloat(getComputedStyle(el).fontSize) < 24) return;
    el.dataset.motion = 'count';
  });

  /* The Projects sheet carries no data-motion hooks of its own — the design draws it as a
     plotter bed of [data-plot] sections rather than as scraps on a page, so none of the
     scrapbook vocabulary applied and it ended up the one route with no motion at all.
     Its sections are the obvious unit: they are the blocks a reader scrolls between.

     The sections sit at [data-plotter] > [data-r=plotgrid] > main > [data-plot], so this
     matches on [data-plot] alone rather than on a child combinator. The [data-plotter]
     wrapper carries no [data-plot] of its own and so cannot be caught by this — which
     matters, because it spans the whole sheet and animating it would move the page rather
     than anything on it. */
  root.querySelectorAll('[data-plot]').forEach((el) => {
    if (el.__mPlot) return;
    el.__mPlot = 1;
    if (el.dataset.motion || el.hasAttribute('data-plotter')) return;
    el.dataset.motion = 'plot';
  });

  /* Strokes are tagged on shape alone; their length is measured only when they fire. */
  root.querySelectorAll('svg path,svg polyline,svg line').forEach((el) => {
    if (el.__mThr) return;
    el.__mThr = 1;
    if (el.dataset.motion || el.closest('[data-motion-deco]') ||
        el.closest('nav') || el.closest('[data-plotter]')) return;
    if ((el.style.animation || '').length) return;
    if (el.getAttribute('fill') !== 'none' || !el.getAttribute('stroke')) return;
    el.dataset.motion = 'thread';
  });
}

/* The highlighter band swept behind one phrase per page, taken from the underline the
   design already draws rather than invented. */
function markSetup() {
  const host = document.querySelector('[data-mark]') ||
    document.querySelector('[data-motion="line"] span[style*="border-bottom"]') ||
    document.querySelector('[data-screen-label] p span[style*="border-bottom"]');
  if (!host || host.querySelector('.m-mark')) return;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.style.isolation = 'isolate';
  const band = document.createElement('span');
  band.setAttribute('aria-hidden', 'true');
  band.className = 'm-mark';
  band.dataset.motion = 'mark';
  band.style.cssText = 'position:absolute;left:-.2em;right:-.2em;top:.1em;bottom:-.04em;' +
    'z-index:-1;background:rgba(232,182,74,.32);pointer-events:none';
  host.insertBefore(band, host.firstChild);
}

/* Assigns the recipe and the depth. Scrubbed recipes are handed to CSS and never touched
   again; paint-bound ones get an observer that fires them once and disconnects them. */
function arm(el, i) {
  if (el.__mArm) return;
  el.__mArm = 1;
  const kind = el.dataset.motion;

  if (SCRUBBED[kind]) {
    el.setAttribute(SCRUB ? 'data-m-scrub' : 'data-m-fallback', kind);
    const d = Math.max(0, Math.min(1, DEPTH[kind] + jitter(i)));
    el.style.setProperty('--m-d', d.toFixed(3));
    /* Without scroll-driven animation the fallback needs a trigger; with it, CSS has
       everything it needs and no observer is involved at all. */
    if (!SCRUB) io.observe(el);
    return;
  }

  if (ONESHOT[kind]) {
    if (kind === 'ink') el.classList.add('m-ink');
    if (kind === 'thread') el.classList.add('m-thread');
    io.observe(el);
  }
}

/* ── the cascade, restored ────────────────────────────────────────────────────────────

   A view() timeline is a function of the element's own position, so two scraps at the
   same height share a progress value at every scroll offset and arrive in exact lockstep.
   A row of five cards snapping in as a single object is more mechanical than the
   metronome the original engine was rewritten to escape — its argument was that a hand
   puts down a group of things, pauses, then reaches for the next group. Moving the
   arrivals onto the compositor quietly threw that away, and this puts it back: each item
   in a row starts its arrival a little later than the one to its left.

   Rows separate themselves — different heights already mean different progress — so only
   the across-a-row case needs anything added.

   Measured with offsetTop rather than getBoundingClientRect, and that is the whole trick.
   A rect is the *animated* position: at load every element below the fold is sitting up
   to 60px from where it belongs, which is the same order as the 44px gap used to decide
   what counts as one row. Clustering on rects would group elements by where the animation
   currently has them. offsetTop is layout, untouched by transforms, so it reports where
   the element actually lives. */
const ROW_GAP = 44;      // px of vertical clearance that starts a new row
const STAG_STEP = 3;     // % of its own traversal each item waits behind the last
const STAG_MAX = 12;     // beyond four across, further delay stops reading as a cascade

function layoutTop(el) {
  let y = 0;
  for (let e = el; e; e = e.offsetParent) y += e.offsetTop;
  return y;
}

function layoutLeft(el) {
  let x = 0;
  for (let e = el; e; e = e.offsetParent) x += e.offsetLeft;
  return x;
}

function cascade(root) {
  const els = [];
  root.querySelectorAll('[data-m-scrub],[data-m-fallback]').forEach((el) => {
    if (!el.__mStag) els.push(el);
  });
  if (!els.length) return;

  const boxes = els.map((el) => ({ el, top: layoutTop(el), left: layoutLeft(el) }));
  boxes.sort((a, b) => (a.top - b.top) || (a.left - b.left));

  let rowTop = -Infinity, i = 0;
  for (const b of boxes) {
    b.el.__mStag = 1;
    if (b.top > rowTop + ROW_GAP) { i = 0; rowTop = b.top; }
    else i++;
    const stag = Math.min(i * STAG_STEP, STAG_MAX);
    if (stag) b.el.style.setProperty('--m-stag', stag);
  }
}

/* The corner curl. The lift itself is hover.css's job — see the note in app/motion.css. */
function liftSetup(root) {
  root.querySelectorAll('[data-motion="scrap"]').forEach((el) => {
    if (el.__mLift) return;
    el.__mLift = 1;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.setAttribute('data-m-lift', '');
  });
}

/* ── decoration parking ───────────────────────────────────────────────────────────────

   The sparkle field is 86 elements deep on the home page and 37 of them animate forever.
   Most are off-screen at any moment, and an off-screen sparkle still costs the compositor
   a layer update every frame. Parking them is invisible and close to free — one observer,
   one attribute, and app/motion.css does the rest with animation-play-state. */
function parkDeco(root) {
  root.querySelectorAll('[data-motion-deco] > *').forEach((el) => {
    if (!el.__mPark) {
      el.__mPark = 1;
      /* A note carries a sentence; a sparkle carries one glyph. Only the first kind can
         collide with anything in a way a reader would notice. */
      if (!el.children.length && (el.textContent || '').trim().length >= 8) el.__mNote = 1;
      el.setAttribute('data-m-idle', '');
      idleIo.observe(el);
    }
    /* Deliberately outside the latch: queue any note that is on screen and still
       unjudged, on every scan rather than only the first. The observer is the general
       mechanism, but its callbacks run as part of the rendering steps, so a tab that is
       not painting yet delivers none at all — and the notes visible at load are the
       conspicuous ones. scan() runs at 0, 400 and 1400ms, which covers the load case
       without an observer and without a scroll listener. The rect read is guarded
       behind __mNote, so it costs six or nine elements, not fifty. */
    if (el.__mNote && !el.__mChecked) {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) queueNote(el);
    }
  });
}

/* ── decluttering the marginalia ──────────────────────────────────────────────────────

   The scattered handwritten notes — "three hours for one margin", "renamed the variable
   for the ninth time" — are absolutely positioned at percentages of the full page height
   inside the deco layer. That places them against a page whose content reflows with
   viewport width, so whether any given note lands in empty space or on top of a card is
   decided by arithmetic nobody performed. At 1536px, "renamed the variable for the ninth
   time" sits entirely underneath "Future HR," and "three hours for one margin" entirely
   underneath a "Vercel" chip.

   Fixing the two coordinates that happen to collide at the width I measured would leave
   every other width exactly as fragile, so this checks at runtime instead: when a note
   first scrolls into view, hit-test it, and if something legible is sitting on top of it,
   take it out.

   Hidden rather than nudged, deliberately. A nudge has to land somewhere, and somewhere
   is another coordinate nobody chose — it trades a collision you can see for one you have
   not measured yet. These are marginalia scattered ten to a page; one absent at one
   viewport width is imperceptible, while one shoved into a new position is a note that
   looks misplaced. Losing the note is the smaller loss.

   Hit-testing rather than comparing rectangles, because the notes are rotated and the
   cards are rotated, and an axis-aligned box around rotated text overlaps things the
   glyphs never touch. Rect comparison reported three collisions on Home that were not
   there.

   pointer-events has to be forced on for the probe: the deco layers set it to none, so
   elementFromPoint looks straight through them and would never see one note covering
   another. */
let noteQueue = [], noteScheduled = 0;

function isLegible(el) {
  return el && !el.children.length && (el.textContent || '').trim().length >= 3;
}

function declutter() {
  noteScheduled = 0;
  const batch = noteQueue.filter((el) => !el.__mChecked);
  noteQueue = [];
  if (!batch.length) return;

  const probe = document.createElement('style');
  probe.textContent = '[data-motion-deco],[data-motion-deco] *{pointer-events:auto!important}';
  document.head.appendChild(probe);

  let requeued = 0;
  for (const el of batch) {
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) { el.__mChecked = 1; continue; }

    /* elementFromPoint is a viewport function, so points outside it yield nothing and a
       note straddling an edge is judged on whatever part happens to be showing. What
       matters is having enough of it testable to trust the answer — not having all of
       it, which was the first version of this check and was wrong: a note sitting across
       the fold never becomes wholly visible at that scroll position, so it burned every
       retry and was written off unexamined. "three hours for one margin" is exactly such
       a note, 35px tall with its last 8px below the fold, and it scores 9 blocked points
       the moment it is actually measured. */
    let blocked = 0, tested = 0;
    for (let i = 1; i <= 5; i++) {
      for (let j = 1; j <= 5; j++) {
        const x = r.left + (r.width * i) / 6;
        const y = r.top + (r.height * j) / 6;
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
        tested++;
        const hit = document.elementFromPoint(x, y);
        if (!hit || hit === el || el.contains(hit) || hit.contains(el)) continue;
        if (isLegible(hit)) blocked++;
      }
    }

    /* Under a third of the grid is too thin a sample to convict on. Put it back and
       look again once scrolling settles; the cap keeps that bounded for a note that is
       never going to be more visible than it already is. */
    if (tested < 8) {
      el.__mTries = (el.__mTries || 0) + 1;
      if (el.__mTries < 6) { noteQueue.push(el); requeued = 1; }
      else el.__mChecked = 1;
      continue;
    }
    el.__mChecked = 1;
    /* Three of twelve sample points is enough to mean the note is unreadable where it
       is; below that it is a corner clipping a descender, which the design does on
       purpose all over the page. */
    if (blocked >= 3) {
      el.style.opacity = '0';
      el.setAttribute('data-m-decluttered', '');
    }
  }
  probe.remove();
  /* Anything put back is waiting on a scroll to finish, so a plain timer rather than
     another idle callback — idle time is exactly when scrolling has stopped, which is
     the moment the note's position is finally worth reading. */
  if (requeued) schedule(260);
}

/* Nothing may be judged until the webfonts have landed. The page is set in Caveat, a
   script face whose metrics differ enormously from the fallback, so text measured during
   the swap wraps to a different number of lines and sits at a different height — a note
   tested then is being tested against a layout that is about to stop existing. Judged
   too early, "three hours for one margin" reads as clear and is marked clean for good;
   the observer only reports a note once, so there is no second chance.

   Idle after that, because this forces layout and none of it is urgent. */
function schedule(delay) {
  if (noteScheduled) return;
  noteScheduled = 1;
  const run = () => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(declutter, { timeout: 800 });
    else setTimeout(declutter, 0);
  };
  const fonts = (document.fonts && document.fonts.ready) || Promise.resolve();
  fonts.then(() => setTimeout(run, delay), () => setTimeout(run, delay));
}

function queueNote(el) {
  if (el.__mChecked) return;
  noteQueue.push(el);
  schedule(180);
}

/* ── the page turn ────────────────────────────────────────────────────────────────────

   The notebook's signature gesture, kept as it was. A page lifting off the spine darkens
   along the gutter as it goes, and that gradient is the whole reason a real turn reads as
   paper rather than as a rotating rectangle.

   This one is deliberately still a main-thread Web Animation: it is a single element, it
   runs for 460ms while the router swaps the route, and there is nothing to scrub it to. */
const TURN_MS = 460;

function curlShade(dir, ms) {
  const sh = document.createElement('div');
  sh.setAttribute('aria-hidden', 'true');
  sh.className = 'm-curl m-curl-' + dir;
  document.body.appendChild(sh);
  const a = sh.animate(
    dir === 'out'
      ? [{ opacity: 0 }, { opacity: 1, offset: 0.72 }, { opacity: 1 }]
      : [{ opacity: 0.85 }, { opacity: 0 }],
    { duration: ms, easing: dir === 'out' ? CURVE.turn : CURVE.light, fill: 'forwards' }
  );
  const drop = () => sh.remove();
  a.finished.then(drop, drop);
  setTimeout(drop, ms + 900);   // belt and braces: never leave a scrim over the page
  return sh;
}

function turnOut(el, ev) {
  const href = el.getAttribute('href');
  if (!href || href === '#' || el.hasAttribute('aria-current')) return;
  if (!/^\/(?:$|[a-z])/.test(href)) return;                    // internal routes only
  if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
  ev.preventDefault();

  const go = () => {
    if (typeof window.__nav === 'function') window.__nav(href);
    else location.href = href;
  };
  if (reduce) { go(); return; }

  const root = document.querySelector('[data-screen-label]') || document.body;
  document.documentElement.style.perspective = '1500px';
  root.style.transformOrigin = 'left center';
  curlShade('out', TURN_MS);
  root.animate([
    { opacity: 1, transform: 'none' },
    { opacity: 0.97, transform: 'rotateY(-7deg) translate3d(-16px,0,0)', offset: 0.42 },
    { opacity: 0, transform: 'rotateY(-17deg) translate3d(-64px,0,0) scale(.988)' }
  ], { duration: TURN_MS, easing: CURVE.turn, fill: 'forwards' });
  setTimeout(go, TURN_MS - 60);
}

/* The counterpart: the new sheet settles flat on the same hinge the old one left by, and
   the gutter shadow it arrived under lifts off it. Two halves of one gesture. */
/* The hidden-tab guard is load-bearing, not defensive garnish.

   The document timeline does not advance while a tab is backgrounded, so an entrance
   started there does not play — it parks on its first keyframe and stays there. That
   keyframe is `rotateY(5deg) translate3d(22px,0,0)`, and a 3D transform on the sheet root
   makes every ViewTimeline beneath it inactive: the whole scrubbed layer goes dead and
   the page sits visibly rotated until someone focuses the tab.

   Opening a link in a background tab is ordinary behaviour, so this was not an edge case.
   Skipping the entrance outright is also the honest answer to it — there is no one
   watching an animation in a tab that is not on screen, and the first thing they will see
   when they do switch to it is the page already assembled. */
function pageIn() {
  const root = document.querySelector('[data-screen-label]');
  if (!root || root.__mIn || reduce) return;
  if (document.hidden) {
    /* Do not latch: a later rescan (or the visibility handler) may still want to run this
       for real if the reader arrives before the route changes. */
    return;
  }
  root.__mIn = 1;
  document.documentElement.style.perspective = '1500px';
  root.style.transformOrigin = 'left center';
  curlShade('in', 560);
  const a = root.animate([
    { opacity: 0, transform: 'rotateY(5deg) translate3d(22px,0,0) scale(1.004)' },
    { opacity: 1, transform: 'rotateY(0deg) translate3d(0,0,0) scale(1)' }
  ], { duration: 620, easing: CURVE.light, fill: 'backwards' });
  /* A lingering perspective or transform-origin would change how the scrubbed transforms
     underneath compose, so both are cleared the moment the turn is done. */
  const clear = () => {
    document.documentElement.style.perspective = '';
    root.style.transformOrigin = '';
  };
  a.finished.then(clear, clear);
}

/* The INDEX rail is drawn as beads strung on a thread, and touching a bead ought to
   disturb the thread. It is decoration rather than correction — the one thing in this
   file that exists purely because the metaphor deserves it — but it is a single
   translateX on a single node, so it survived the rewrite unchanged. Kept under 2px so it
   registers as a tremor rather than a bounce. */
const PLUCK = pluckTrack();
let plucking = null;

function pluckThread() {
  const thread = document.querySelector('[data-r="thread"]');
  if (!thread || reduce) return;
  if (matchMedia('(pointer: coarse)').matches) return;
  if (plucking && plucking.playState === 'running') return;
  plucking = thread.animate(
    PLUCK.track.map(({ offset, v }) => ({
      offset, transform: 'translateX(' + (v * 1.8).toFixed(2) + 'px)',
    })),
    { duration: PLUCK.duration, easing: 'linear' }
  );
}

function turnSetup() {
  document.querySelectorAll('[data-r="beadlink"],[data-motion-tab]').forEach((el) => {
    if (el.__mTurn) return;
    el.__mTurn = 1;
    el.addEventListener('click', (ev) => turnOut(el, ev));
    if (el.closest('[data-r="nav"]')) el.addEventListener('pointerenter', pluckThread);
  });
}

/* ── the desk lamp ────────────────────────────────────────────────────────────────────

   Was a full-viewport div under mix-blend-mode:soft-light whose gradient centre moved by
   rewriting --lx/--ly. Both halves of that are paint: the blend re-composites everything
   underneath it, and moving a gradient stop repaints the gradient — over a page carrying
   25 turbulence filters, on every pointer move.

   It is now a fixed-size sprite with a static gradient that is only ever translated, so
   it is rasterised once and moved by the compositor. The easing that used to need a rAF
   loop chasing the pointer is a CSS transition instead, which is the same effect with no
   loop to park, no idle-frame counter, and no scroll listener feeding it. */
let lamp = null, lampIdle = 0;

function lampSetup() {
  if (lamp || reduce) return;
  if (!matchMedia('(hover: hover)').matches) return;
  if (matchMedia('(pointer: coarse)').matches) return;

  lamp = document.createElement('div');
  lamp.setAttribute('aria-hidden', 'true');
  lamp.className = 'm-lamp';
  document.body.appendChild(lamp);

  addEventListener('pointermove', (e) => {
    lamp.style.translate = e.clientX + 'px ' + e.clientY + 'px';
    lamp.classList.add('m-on');
    clearTimeout(lampIdle);
    lampIdle = setTimeout(() => lamp.classList.remove('m-on'), 1500);
  }, { passive: true });
}

/* ── pointer depth ────────────────────────────────────────────────────────────────────

   Move the cursor and the sky moves behind the notebook: dust one way, stars the other,
   the wisp somewhere between. Scroll parallax only pays off while you are scrolling —
   this is the half that works while the page is standing still, and it is the moment
   that says the notebook is sitting in a space rather than pasted onto a picture of one.

   Two decisions keep it honest.

   The variables are written to specific hosts, never to :root. A custom property on the
   document element invalidates every descendant that could inherit it — on a sheet of
   450 elements that is a style recalc per pointer frame, which is exactly the class of
   cost this rewrite exists to remove. Written to the sky container and the starfield
   wrapper instead, the invalidation is bounded to about twenty nodes.

   And the easing is a CSS transition, not a loop. The old desk lamp ran a rAF chase with
   an idle-frame counter and a scroll listener to restart it; a transition gets the same
   weight with nothing to schedule. rAF here is used only to coalesce pointer events down
   to one write per frame. */
let ptrHosts = null, ptrPending = 0, ptrX = 0, ptrY = 0;

function writePointer() {
  ptrPending = 0;
  for (const el of ptrHosts) {
    el.style.setProperty('--m-mx', ptrX.toFixed(4));
    el.style.setProperty('--m-my', ptrY.toFixed(4));
  }
}

function pointerDepth() {
  if (reduce || matchMedia('(pointer: coarse)').matches) return;
  if (!matchMedia('(hover: hover)').matches) return;

  /* The starfield canvas already carries the scroll rule on itself, so its pointer
     travel has to live on the wrapper — same reason the sky layers are nested. */
  const stars = document.querySelector('[data-screen-label] canvas');
  const starWrap = stars && stars.parentElement;
  if (starWrap) starWrap.classList.add('m-star-ptr');

  const sky = document.querySelector('.m-sky');
  const hosts = [sky, starWrap].filter(Boolean);
  if (!hosts.length) return;
  ptrHosts = hosts;

  if (pointerDepth.armed) return;
  pointerDepth.armed = 1;
  addEventListener('pointermove', (e) => {
    /* -1 … 1 from the centre of the viewport, so a layer's --m-ptr reads directly as
       its travel in pixels at the edges of the screen. */
    ptrX = (e.clientX / innerWidth) * 2 - 1;
    ptrY = (e.clientY / innerHeight) * 2 - 1;
    if (ptrPending) return;
    ptrPending = 1;
    requestAnimationFrame(writePointer);
  }, { passive: true });
}

/* ── entry points ─────────────────────────────────────────────────────────────────── */

export function scan() {
  const root = document.querySelector('[data-screen-label]') || document.body;
  autotag(root);
  markSetup();
  liftSetup(root);
  parkDeco(root);
  document.querySelectorAll('[data-motion]').forEach(arm);
  cascade(root);
  turnSetup();
  lampSetup();
  pointerDepth();
}

/* Re-arm after a client-side route change: the previous sheet's nodes are gone, so the
   per-element latches are gone with them and scan() starts clean. */
export function rescan() {
  if (!started) { initScrapMotion(); return; }
  scan();
  pageIn();
}

export function initScrapMotion() {
  if (started || typeof window === 'undefined') return;
  started = true;
  reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* One observer for the paint-bound recipes, and it unobserves as it fires — every
     element here runs exactly once, ever. */
  io = new IntersectionObserver((ents) => {
    for (const e of ents) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      io.unobserve(el);
      if (reduce) continue;
      /* Every one-shot below is a time-based animation, and the document timeline does
         not advance in a backgrounded tab — but IntersectionObserver still fires there.
         Start one then and it parks on whatever keyframe it had reached: the ink wipe
         freezes mid-stroke, so "Deploying ideas…" renders as "Deplo". Half the
         handwriting on the sheet is an ink element, so this is not a corner of the page,
         it is the page.

         Deferred rather than skipped, which is where this differs from pageIn(). A
         stalled wipe does resume when the tab is focused, so skipping outright would
         trade "plays late" for "never plays" — and the wipes arriving together as the
         reader switches to the tab is a better first look than text that is simply
         already there. count() is the exception and still skips: it rewrites textContent,
         so a stall leaves a real figure reading zero. */
      if (document.hidden) { deferred.push(el); continue; }
      fire(el);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });

  /* And one for decoration, which keeps observing — sparkles park and unpark as they
     leave and re-enter the viewport. */
  idleIo = new IntersectionObserver((ents) => {
    for (const e of ents) {
      if (e.isIntersecting) {
        e.target.removeAttribute('data-m-idle');
        /* First time on screen is also the first time its position can be hit-tested
           against real laid-out content — off-screen there is nothing to test against. */
        if (e.target.__mNote) queueNote(e.target);
      } else {
        e.target.setAttribute('data-m-idle', '');
      }
    }
  }, { rootMargin: '15% 0px' });

  /* If the page loaded in a background tab, pageIn() declined to run — see the note on
     it. Give the entrance one chance when the reader actually arrives, then stop
     listening. Anything later than that first look is a route change, which rescan()
     already covers. */
  if (document.hidden) {
    const onShow = () => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onShow);
      pageIn();
    };
    document.addEventListener('visibilitychange', onShow);
  }

  /* Stays for the life of the page: a reader can background the tab at any point, not
     only during load, and anything that came due meanwhile is owed its one shot. */
  document.addEventListener('visibilitychange', flushDeferred);

  scan();
  pageIn();
  /* Two catch-up passes for anything React mounts after hydration — the home page's
     terminal, chiefly. Cheap because every pass is latched per element. */
  setTimeout(scan, 400);
  setTimeout(scan, 1400);
}
