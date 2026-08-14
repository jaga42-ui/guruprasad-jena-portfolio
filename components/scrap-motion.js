/* Scrapbook motion layer — reveal choreography, tape press, parallax, desk-lamp light, page turns.

   Ported from design/motion.js, then reworked around one idea: the page should read as a
   hand assembling a scrapbook, not as a set of animations playing at the same time. Three
   things follow from that, and they are the only places this differs from the original
   choreography.

   1. Materials move like themselves. Every recipe used to share one expo curve, so paper,
      tape and handwriting all decelerated identically. Now paper runs on a solved spring,
      tape gets a thumb-press that dips past flat, and ink is timed by stroke length — a pen
      covers a short caption faster than a long one. See components/motion-curves.js.

   2. Weight is visible. The design builds every scrap's shadow the way a real one is built
      — contact, mid, ambient — and then held it still while the paper moved, which is what
      made the scraps read as stickers. That stack is now driven by the paper's height in
      the arc: the contact shadow leaves the desk first and fades, the others lengthen and
      soften, and landing runs it backwards. Only elements the design already gave a shadow
      to get one; the alternative is paper that casts a shadow solely while in motion.

   3. Things arrive in groups. The cascade was a metronome — two elements every 110ms in
      reading order, regardless of what they were. Now items are clustered by vertical
      proximity, a cluster moves together, and there is a beat between clusters.

   Plus the page turn, which is the notebook's signature gesture, now casts the shadow a
   lifting page casts near the spine, and the arriving page flattens on the same axis.

   Scheduling changes carried over from the port:
     · the two permanent rAF loops (lamp follow + deco parallax) are now ONE loop that parks
       itself after ~10 quiet frames and restarts on the next pointer/scroll event
     · the loop also parks while the tab is hidden
     · tab clicks hand off to window.__nav (client-side router) when present, else location.href
     · scan() / rescan() are exported so a route change can re-arm new nodes                  */

import { CURVE, spring, pluckTrack } from './motion-curves';

const EXPO = CURVE.light;

/* Solved once at module load, not per element. Overshoot and settle are read off the
   choreography the design already had, so the character is unchanged — what changes is
   that a real spring gets there, with the uneven settle a three-keyframe approximation
   cannot produce.

     PAPER  the authored scrap rises 30px and overshoots by 4px: 13%, 780ms
     CARD   the authored chip pops from .78 to 1.09: 41%, which as a true spring rings
            several times. Fourteen tool chips ringing together reads as jelly, so this
            keeps the pop and drops the ring — 20%, and slightly quicker
     TAG    the authored tag had no overshoot at all; a pinned paper tag deserves a little,
            but only a little                                                            */
const PAPER = spring({ overshoot: 0.13, settle: 780 });
const CARD = spring({ overshoot: 0.20, settle: 600 });
const TAG = spring({ overshoot: 0.08, settle: 620 });
const PLUCK = pluckTrack();                     // the nav thread, when a bead is touched

/* rAF alone can latch shut in a throttled/hidden frame — race it with a timer */
function soon(fn) {
  let done = false, r = 0, t = 0;
  const run = () => { if (done) return; done = true; cancelAnimationFrame(r); clearTimeout(t); fn(); };
  r = requestAnimationFrame(run); t = setTimeout(run, 140);
}
const seen = new WeakSet();

let started = false;
let reduce = false;
let PHONE = false;

function base(el) {
  if (el.dataset.mBase === undefined) el.dataset.mBase = el.style.transform || '';
  return el.dataset.mBase;
}

function play(el, kf, opts) {
  if (el.dataset.mHid) { el.style.opacity = ''; delete el.dataset.mHid; }
  el.style.willChange = 'transform, opacity';
  const a = el.animate(kf, opts);
  a.finished.then(() => { a.cancel(); el.style.willChange = ''; }, () => { el.style.willChange = ''; });
  return a;
}

function sign(el) { return base(el).indexOf('-') > -1 ? -1 : 1; }

function unhide(el) { if (el.dataset.mHid) { el.style.opacity = ''; delete el.dataset.mHid; } }

/* ---- shadow ----
   The single cue that separates a piece of paper from a sticker is that its shadow changes
   as it moves. The design already builds each scrap's shadow the way a real one is built —
   a stack of three drop-shadows, contact then mid then ambient:

     drop-shadow(0 1px .5px .55)  drop-shadow(0 4px 4px .3)  drop-shadow(0 10px 12px .2)

   which appears on fourteen elements across the five pages. So nothing needs inventing:
   lift the paper and that stack should behave the way light makes it behave — the contact
   shadow leaves the desk first and fades, while the others lengthen and soften. Landing
   runs it backwards. Inventing a shadow for the elements the design gave none to would be
   worse than leaving them alone: they would cast one only while moving. */

/* A filter is a list of fn(...) calls, and the arguments can themselves contain brackets —
   drop-shadow(rgba(0, 0, 0, .55) 0 1px .5px). Splitting has to track depth. */
function splitFilter(filter) {
  const out = [];
  let i = 0;
  while (i < filter.length) {
    const m = /([a-zA-Z][\w-]*)\(/.exec(filter.slice(i));
    if (!m) break;
    const open = i + m.index + m[0].length;
    let j = open, depth = 1;
    while (j < filter.length && depth) {
      if (filter[j] === '(') depth++;
      else if (filter[j] === ')') depth--;
      j++;
    }
    out.push({ name: m[1], body: filter.slice(open, j - 1) });
    i = j;
  }
  return out;
}

function fadeAlpha(color, k) {
  const m = /^rgba?\(([^)]+)\)$/.exec(color.trim());
  if (!m) return color;
  const p = m[1].split(',').map((s) => s.trim());
  const a = p.length > 3 ? parseFloat(p[3]) : 1;
  return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + (a * k).toFixed(3) + ')';
}

/* Returns a function of height-off-the-desk (1 at the top of the arc, 0 at rest), or null
   when there is no shadow stack here to modulate.

   Lengths and colour are separated by stripping the lengths rather than by position: CSS is
   authored colour-last with a unitless zero, `drop-shadow(0 1px .5px rgba(0,0,0,.55))`, but
   reading the same declaration back off element.style returns the CSSOM's colour-first
   normalisation, `drop-shadow(rgba(0, 0, 0, 0.55) 0px 1px 0.5px)`. Both have to parse to
   the same numbers, and a filter containing anything that is not a drop-shadow — an
   feTurbulence reference, say — is refused outright. */
function shadowStack(filter) {
  const fns = splitFilter(filter);
  if (!fns.length || fns.some((f) => f.name !== 'drop-shadow')) return null;
  const parsed = [];
  for (const { body } of fns) {
    const nums = [];
    const color = body
      .replace(/(^|\s)(-?[\d.]+)(px)?(?=\s|$)/g, (m0, pre, n) => { nums.push(parseFloat(n)); return ' '; })
      .replace(/\s+/g, ' ').trim();
    if (nums.length < 3 || !color) return null;
    parsed.push({ x: nums[0], y: nums[1], blur: nums[2], color });
  }
  return (h) => parsed.map((p, i) => {
    const spread = 1 + h * 1.7;                    // higher up: longer throw, softer edge
    const fade = i === 0 ? 1 - h * 0.8 : 1;        // the contact shadow is the first to go
    return 'drop-shadow(' + p.x + 'px ' + (p.y * spread).toFixed(2) + 'px ' +
      (p.blur * spread).toFixed(2) + 'px ' + fadeAlpha(p.color, fade) + ')';
  }).join(' ');
}

/* The paper is not always the element carrying data-motion — about a third of the scrap
   tags sit on a layout wrapper. Find whoever actually holds the shadow. */
function shadowBearer(el, depth) {
  const f = el.style.filter || '';
  if (f.indexOf('url(') < 0 && f.indexOf('drop-shadow(') > -1) {
    const fn = shadowStack(f);
    if (fn) return { el, fn };
  }
  if (depth <= 0) return null;
  for (const c of el.children) {
    const hit = shadowBearer(c, depth - 1);
    if (hit) return hit;
  }
  return null;
}

/* Runs the paper's shadow stack alongside its arrival. The bearer is often a child of the
   moving element, so this is a second animation on a second node, started in step.

   Distance from the resting plane is what sets the shadow, so the displacement is taken as
   an absolute value: the spring's overshoot carries the paper a few pixels past its resting
   position, and there the shadow should swell again rather than sit at rest while the sheet
   is still moving. It is the last thing to settle, which is what settling looks like. */
function liftShadow(el, { track, duration }, delay) {
  const bearer = shadowBearer(el, 2);
  if (!bearer) return;
  const kf = track.map(({ offset, v }) => ({ offset, filter: bearer.fn(Math.abs(1 - v)) }));
  const a = bearer.el.animate(kf, { duration, delay, easing: 'linear', fill: 'backwards' });
  a.finished.then(() => a.cancel(), () => {});
}

/* Builds the keyframes for a sprung arrival: a rise, a rotation that unwinds, and a scale
   that grows into place. `away` is 1 at the start and 0 at rest, going slightly negative on
   the overshoot — that sign flip is the spring passing its target. */
function sprung(el, spec, { rise, spin, shrink }, opts) {
  const { track, duration } = spec;
  const b = base(el), s = sign(el);
  const kf = track.map(({ offset, v }) => {
    const away = 1 - v;
    return {
      offset,
      opacity: Math.min(1, v * 2.4),
      transform: b +
        ' translate3d(0,' + (away * rise).toFixed(2) + 'px,0)' +
        ' rotate(' + (away * s * spin).toFixed(2) + 'deg)' +
        ' scale(' + (1 - away * shrink).toFixed(4) + ')',
    };
  });
  liftShadow(el, spec, (opts && opts.delay) || 0);
  return play(el, kf, { duration, easing: 'linear', fill: 'backwards', ...opts });
}

/* figures count up to the printed number and land on the literal text */
function roll(el) {
  unhide(el);
  const raw = el.dataset.mTo || (el.textContent || '').trim();
  const m = /^(\D*)([\d,]+)(\D*)$/.exec(raw);
  if (!m) return;
  el.dataset.mTo = raw;
  const target = parseInt(m[2].replace(/,/g, ''), 10), grouped = m[2].indexOf(',') > -1;
  const t0 = performance.now(), ms = 900;
  (function step() {
    const q = Math.min(1, (performance.now() - t0) / ms);
    const v = Math.round(target * (1 - Math.pow(1 - q, 3)));
    el.textContent = m[1] + (grouped ? v.toLocaleString('en-US') : v) + m[3];
    if (q < 1) requestAnimationFrame(step); else el.textContent = raw;
  })();
}

/* an ink line stitches itself along its own length */
function drawPath(el, d) {
  unhide(el);
  let L = 0;
  try { L = el.getTotalLength(); } catch (e) { L = 0; }
  if (L < 110) return;
  el.style.strokeDasharray = L;
  const a = el.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
    { duration: Math.min(1600, 380 + L * 1.4), delay: d, easing: 'cubic-bezier(.32,.72,.28,1)', fill: 'backwards' });
  a.finished.then(() => { el.style.strokeDasharray = ''; a.cancel(); }, () => {});
  return a;
}

/* Each recipe takes its own start delay and returns its animation, so the cascade can hand
   out a schedule and let the browser hold everything until its turn. */
const RECIPE = {
  /* Handwriting is drawn, never faded — and a pen moves at a pen's speed, so the duration
     comes from how far it has to travel. A fixed 1000ms made a three-word margin note take
     as long as a full line, which is the tell that it is a wipe and not a hand.
     The vertical inset is negative so Caveat's ascenders are never clipped mid-stroke. */
  ink(el, d) {
    const w = el.getBoundingClientRect().width || 180;
    const duration = Math.max(360, Math.min(1500, Math.round(360 + w * 3.2)));
    return play(el, [
      { clipPath: 'inset(-12% 100% -12% 0)', opacity: .55 },
      { clipPath: 'inset(-12% 0 -12% 0)', opacity: 1 }
    ], { duration, delay: d, easing: CURVE.ink, fill: 'backwards' });
  },
  /* the highlighter band swept behind one phrase per page */
  mark(el, d) {
    el.style.transformOrigin = '0% 50%';
    return play(el, [
      { transform: 'scaleX(0) skewX(-6deg)', opacity: .25 },
      { transform: 'scaleX(1.03) skewX(-2deg)', opacity: 1, offset: .8 },
      { transform: 'scaleX(1)', opacity: 1 }
    ], { duration: 620, delay: d + 240, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'backwards' });
  },
  count(el, d) { setTimeout(() => roll(el), d); },
  thread(el, d) { return drawPath(el, d); },
  /* Paper: the solved spring, with the shadow spreading at the top of the rise and
     contracting as it lands. The overshoot is the spring's, not a hand-placed keyframe. */
  scrap(el, d) {
    return sprung(el, PAPER, { rise: 30, spin: 2.6, shrink: 0.038 }, { delay: d });
  },
  mat(el, d) {
    const b = base(el);
    return play(el, [
      { opacity: 0, transform: b + ' scale(.982)' },
      { opacity: 1, transform: b }
    ], { duration: 700, delay: d, easing: EXPO, fill: 'backwards' });
  },
  /* Tape is pressed on by a thumb: it comes in off-angle, lands wide, and is pushed briefly
     past flat before it settles. The sub-1 beat at 76% is the press — without it the strip
     only grows into place, which reads as a sticker appearing.

     The easing is per-segment and the overall timing is linear, deliberately. An
     overshooting curve like CURVE.press as the *overall* easing drives eased progress past
     1 well before the end, which clamps playback to the last keyframe and quietly deletes
     every intermediate one — the press beat measured 1.004 instead of 1.075 that way.
     Applied per keyframe it shapes each segment and every offset is still hit exactly.

     The filter is left alone: every tape strip carries filter:url(#rough-tape). */
  tape(el, d) {
    const b = base(el), s = sign(el);
    el.style.transformOrigin = '50% 50%';
    return play(el, [
      { offset: 0, opacity: 0, transform: b + ' scale(.35) rotate(' + (s * -7) + 'deg)', easing: CURVE.press },
      { offset: .5, opacity: 1, transform: b + ' scale(1.075) rotate(' + (s * 1.4) + 'deg)', easing: 'cubic-bezier(.45,0,.55,1)' },
      { offset: .76, opacity: 1, transform: b + ' scale(.988)', easing: 'cubic-bezier(.3,0,.35,1)' },
      { offset: 1, opacity: 1, transform: b }
    ], { duration: 520, delay: d + 200, easing: 'linear', fill: 'backwards' });
  },
  /* Chips are small and light: less travel, quicker to rest, a livelier overshoot. */
  chip(el, d) {
    return sprung(el, CARD, { rise: 12, spin: 0, shrink: 0.22 }, { delay: d });
  },
  /* A pinned tag swings in from the pin rather than rising, so it travels sideways. */
  tag(el, d) {
    const b = base(el), s = sign(el);
    liftShadow(el, TAG, d);
    return play(el, TAG.track.map(({ offset, v }) => {
      const away = 1 - v;
      return {
        offset,
        opacity: Math.min(1, v * 2.4),
        transform: b +
          ' translate3d(' + (away * -14).toFixed(2) + 'px,' + (away * 6).toFixed(2) + 'px,0)' +
          ' rotate(' + (away * s * 5).toFixed(2) + 'deg)' +
          ' scale(' + (1 - away * 0.1).toFixed(4) + ')',
      };
    }), { duration: TAG.duration, delay: d, easing: 'linear', fill: 'backwards' });
  },
  head(el, d) {
    return play(el, [
      { opacity: 0, transform: 'translate3d(0,18px,0)', clipPath: 'inset(0 0 102% 0)' },
      { opacity: 1, transform: 'none', clipPath: 'inset(0 0 -22% 0)' }
    ], { duration: 980, delay: d, easing: EXPO, fill: 'backwards' });
  },
  kicker(el, d) {
    return play(el, [
      { opacity: 0, transform: 'translate3d(-10px,0,0)', letterSpacing: '0.5em' },
      { opacity: 1, transform: 'none' }
    ], { duration: 900, delay: d, easing: EXPO, fill: 'backwards' });
  },
  stamp(el, d) {
    const b = base(el);
    return play(el, [
      { opacity: 0, transform: b + ' scale(1.7) rotate(-16deg)' },
      { opacity: .9, transform: b + ' scale(.93)', offset: .5 },
      { opacity: 1, transform: b + ' scale(1.02)', offset: .74 },
      { opacity: 1, transform: b }
    ], { duration: 680, delay: d + 120, easing: 'cubic-bezier(.3,1.5,.4,1)', fill: 'backwards' });
  },
  line(el, d) {
    return play(el, [
      { opacity: 0, transform: 'translate3d(0,14px,0)' },
      { opacity: 1, transform: 'none' }
    ], { duration: 760, delay: d, easing: EXPO, fill: 'backwards' });
  }
};

/* ---- reveal on scroll: a clustered cascade ---- */
let queue = [], collecting = 0, io = null;

/* The original cascade was a metronome: two starts every 110ms in reading order, whatever
   the elements were. Evenly spaced motion is what makes a page feel machine-assembled —
   a hand puts down a group of things, pauses, and reaches for the next group. So items
   whose boxes sit within CLUSTER_GAP of each other vertically are treated as one group and
   step through quickly; a new group costs a beat. Delays are handed to the recipes and the
   browser schedules them, so nothing is in flight while it waits. */
const CLUSTER_GAP = 44;    // px of vertical clearance that starts a new group
const IN_GROUP = 40;       // ms between items inside a group
const BETWEEN = 155;       // ms of beat between groups
const MAX_DELAY = 1150;    // no element waits longer than this, however deep the batch

function enqueue(el) {
  if (seen.has(el)) return;
  seen.add(el);
  queue.push(el);
  if (!collecting) { collecting = 1; soon(collect); }
}

function collect() {
  collecting = 0;
  const items = [];
  queue.forEach((el) => {
    if (RECIPE[el.dataset.motion]) items.push(el); else unhide(el);
  });
  queue.length = 0;
  if (!items.length) return;

  const box = new Map();
  items.forEach((el) => box.set(el, el.getBoundingClientRect()));
  // reading order: down the page, then across
  items.sort((a, b) => (box.get(a).top - box.get(b).top) || (box.get(a).left - box.get(b).left));

  let cursor = 0, groupBottom = -Infinity;
  items.forEach((el, i) => {
    const r = box.get(el);
    if (i === 0) {
      groupBottom = r.bottom;
    } else if (r.top > groupBottom + CLUSTER_GAP) {
      cursor += BETWEEN;
      groupBottom = r.bottom;
    } else {
      cursor += IN_GROUP;
      groupBottom = Math.max(groupBottom, r.bottom);
    }
    try { RECIPE[el.dataset.motion](el, Math.min(MAX_DELAY, cursor)); }
    catch (e) { unhide(el); }
  });
}

/* ---- notebook tabs: deal in from the edge, page-turn out on click ---- */
let tabsDone = false;

/* A page lifting off the spine darkens along the gutter as it goes — that gradient is the
   whole reason a real page turn reads as paper rather than as a rotating rectangle. The
   overlay is created for the turn and removed after it, so nothing is left in the tree. */
const TURN_MS = 460;

function curlShade(dir, ms) {
  const sh = document.createElement('div');
  sh.setAttribute('aria-hidden', 'true');
  const angle = dir === 'out' ? '96deg' : '276deg';
  sh.style.cssText = 'position:fixed;inset:0;z-index:70;pointer-events:none;opacity:0;' +
    'background:linear-gradient(' + angle + ',rgba(0,0,0,.58) 0%,rgba(0,0,0,.3) 16%,' +
    'rgba(0,0,0,.08) 34%,transparent 56%)';
  document.body.appendChild(sh);
  const a = sh.animate(
    dir === 'out'
      ? [{ opacity: 0 }, { opacity: 1, offset: .72 }, { opacity: 1 }]
      : [{ opacity: .85 }, { opacity: 0 }],
    { duration: ms, easing: dir === 'out' ? CURVE.turn : EXPO, fill: 'forwards' }
  );
  const drop = () => sh.remove();
  a.finished.then(drop, drop);
  setTimeout(drop, ms + 900);   // belt and braces: never leave a scrim over the page
  return sh;
}

/* The sheet tips away from the spine, then hands the href to the client router.
   Bound to the nav beads and to any in-copy link that points at a sibling sheet. */
function turnOut(el, ev) {
  const href = el.getAttribute('href');
  if (!href || href === '#' || el.hasAttribute('aria-current')) return;
  if (!/^\/(?:$|[a-z])/.test(href)) return;              // internal routes only
  if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
  ev.preventDefault();
  const root = document.querySelector('[data-screen-label]') || document.body;
  document.documentElement.style.perspective = '1500px';
  root.style.transformOrigin = 'left center';
  if (!reduce) curlShade('out', TURN_MS);
  play(root, [
    { opacity: 1, transform: 'none' },
    { opacity: .97, transform: 'rotateY(-7deg) translate3d(-16px,0,0)', offset: .42 },
    { opacity: 0, transform: 'rotateY(-17deg) translate3d(-64px,0,0) scale(.988)' }
  ], { duration: TURN_MS, easing: CURVE.turn, fill: 'forwards' });
  setTimeout(() => {
    if (typeof window.__nav === 'function') window.__nav(href);
    else location.href = href;
  }, TURN_MS - 60);
}

/* The five sheets carry no [data-motion-tab]; their nav rows are the INDEX beads,
   which run their own navbead/navlabel entrance in CSS. So the beads get the page
   turn only — the deal-in entrance stays reserved for a real tab, if one is added. */
/* The INDEX rail is drawn as beads strung on a thread. Touching a bead ought to disturb
   the thread — it is a one-line reward that makes the metaphor land, and the only thing
   added here that is decoration rather than correction. Kept under 2px so it registers
   as a tremor rather than a bounce. */
let plucking = null;
function pluckThread() {
  const thread = document.querySelector('[data-r="thread"]');
  if (!thread || reduce || PHONE) return;
  if (plucking && plucking.playState === 'running') return;
  plucking = thread.animate(
    PLUCK.track.map(({ offset, v }) => ({ offset, transform: 'translateX(' + (v * 1.8).toFixed(2) + 'px)' })),
    { duration: PLUCK.duration, easing: 'linear' }
  );
}

function turnSetup() {
  document.querySelectorAll('[data-r="beadlink"]').forEach((el) => {
    if (el.__turn) return;
    el.__turn = 1;
    el.addEventListener('click', (ev) => turnOut(el, ev));
    if (el.closest('[data-r="nav"]')) el.addEventListener('pointerenter', pluckThread);
  });
}

function tabsIn() {
  turnSetup();
  const tabs = document.querySelectorAll('[data-motion-tab]');
  if (!tabs.length || tabsDone) return;
  tabsDone = true;
  tabs.forEach((el, i) => {
    const b = base(el);
    play(el, [
      { opacity: 0, transform: b + ' translate3d(115%,0,0)' },
      { opacity: 1, transform: b + ' translate3d(-6px,0,0)', offset: .78 },
      { opacity: 1, transform: b }
    ], { duration: 820, delay: 120 + i * 78, easing: EXPO, fill: 'backwards' });

    if (el.__turn) return;
    el.__turn = 1;
    el.addEventListener('click', (ev) => turnOut(el, ev));
  });
}

/* ---- desk lamp + deco parallax, sharing one idle-parking rAF ---- */
let lampEl = null, layers = [];
let tx = 0, ty = 0, cx = 0, cy = 0, lampOn = false, lampArmed = false, lampIdle = 0;
let lastY = -1, raf = 0, idleFrames = 0;

function frame() {
  raf = 0;
  let busy = false;

  if (lampEl && lampOn) {
    const dx = tx - cx, dy = ty - cy;
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      cx += dx * .09; cy += dy * .09;
      lampEl.style.setProperty('--lx', cx + 'px');
      lampEl.style.setProperty('--ly', cy + 'px');
      busy = true;
    }
  }

  const y = scrollY;
  if (y !== lastY && layers.length) {
    lastY = y;
    for (let i = 0; i < layers.length; i++) {
      const rate = [0.10, -0.06, 0.055, -0.035][i % 4];
      const raw = y * rate, cap = 74;
      const off = cap * Math.tanh(raw / cap);
      layers[i].style.transform = 'translate3d(0,' + off.toFixed(2) + 'px,0)';
    }
    busy = true;
  }

  // park after ~10 quiet frames instead of spinning forever
  idleFrames = busy ? 0 : idleFrames + 1;
  if (idleFrames < 10 && !document.hidden) raf = requestAnimationFrame(frame);
}

function kick() {
  idleFrames = 0;
  if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
}

function lamp() {
  if (lampArmed || !matchMedia('(hover: hover)').matches || matchMedia('(pointer: coarse)').matches) return;
  lampArmed = true;

  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!lampEl) {
      lampEl = document.createElement('div');
      lampEl.setAttribute('aria-hidden', 'true');
      lampEl.style.cssText = 'position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;' +
        'transition:opacity .6s ease;mix-blend-mode:soft-light;will-change:opacity;' +
        'background:radial-gradient(420px circle at var(--lx,50%) var(--ly,40%), ' +
        'rgba(255,231,186,.55), rgba(255,214,150,.18) 42%, transparent 72%)';
      document.body.appendChild(lampEl);
      cx = tx; cy = ty;
    }
    if (!lampOn) { lampOn = true; cx = tx; cy = ty; lampEl.style.opacity = '1'; }
    // the lamp sleeps whenever the pointer is still
    clearTimeout(lampIdle);
    lampIdle = setTimeout(() => { lampOn = false; lampEl.style.opacity = '0'; }, 1500);
    kick();
  }, { passive: true });
}

function collectLayers() {
  layers = [].slice.call(document.querySelectorAll('[data-motion-deco]'));
}

/* ---- page entrance ----
   The counterpart to the turn. It used to be a scale(1.012) fade, which meant the outgoing
   page left on the Y axis and the incoming one arrived on a different one — two gestures
   instead of one. Now the new sheet settles flat on the same hinge, and the gutter shadow
   it arrived under lifts off it. */
function pageIn() {
  const root = document.querySelector('[data-screen-label]');
  if (!root || root.__in) return;
  root.__in = 1;
  if (reduce) return;
  document.documentElement.style.perspective = '1500px';
  root.style.transformOrigin = 'left center';
  curlShade('in', 560);
  const a = play(root, [
    { opacity: 0, transform: 'rotateY(5deg) translate3d(22px,0,0) scale(1.004)' },
    { opacity: 1, transform: 'rotateY(0deg) translate3d(0,0,0) scale(1)' }
  ], { duration: 620, easing: EXPO, fill: 'backwards' });
  // a lingering perspective/transform-origin would change how later transforms compose
  const clear = () => {
    document.documentElement.style.perspective = '';
    root.style.transformOrigin = '';
  };
  a.finished.then(clear, clear);
}

/* ---- hooks the pages don't have to spell out — one pass per element, ever ---- */
function isHand(el) {
  const f = getComputedStyle(el).fontFamily || '';
  return f.indexOf('Caveat') === 0 || f.indexOf('"Caveat"') === 0 || f.indexOf("'Caveat'") === 0;
}

function autotag(root) {
  root.querySelectorAll('p,span,div,h2,h3,h4,li,blockquote').forEach((el) => {
    if (el.__mTag) return;
    el.__mTag = 1;
    if (el.dataset.motion || el.closest('nav') || el.closest('[data-motion-tab]') || el.closest('[data-plot]')) return;
    if (el.parentElement && el.parentElement.closest('[data-motion="ink"]')) return;
    const t = (el.textContent || '').trim();
    if (!t || t.length < 3 || t.length > 240) return;
    // a glyph already running its own CSS loop (the deco sparkles) must not be seized
    if ((el.style.animation || '').length) return;
    if (el.querySelector('p,div,svg,img,button')) return;
    if (!isHand(el)) return;
    el.dataset.motion = 'ink';
  });
  root.querySelectorAll('span,div,p,strong,dd').forEach((el) => {
    if (el.__mCnt) return;
    el.__mCnt = 1;
    if (el.dataset.motion || el.children.length || el.closest('[data-plotter]') || el.closest('nav')) return;
    const t = (el.textContent || '').trim();
    if (!/^\D{0,2}[\d,]{1,7}\D{0,3}$/.test(t) || !/\d/.test(t)) return;
    if (parseFloat(getComputedStyle(el).fontSize) < 24) return;
    el.dataset.motion = 'count';
  });
  /* strokes are tagged on shape alone — their length is measured only when they animate */
  root.querySelectorAll('svg path,svg polyline,svg line').forEach((el) => {
    if (el.__mThr) return;
    el.__mThr = 1;
    if (el.dataset.motion || el.closest('[data-motion-deco]') || el.closest('nav') || el.closest('[data-plotter]')) return;
    if ((el.style.animation || '').length) return;
    if (el.getAttribute('fill') !== 'none' || !el.getAttribute('stroke')) return;
    el.dataset.motion = 'thread';
  });
  markSetup();
  peelSetup();
}

/* ---- highlighter: one phrase per page, taken from the existing underline ---- */
function markSetup() {
  const host = document.querySelector('[data-mark]') ||
    document.querySelector('[data-motion="line"] span[style*="border-bottom"]') ||
    document.querySelector('[data-screen-label] p span[style*="border-bottom"]');
  if (!host || host.querySelector('[data-motion="mark"]')) return;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.style.isolation = 'isolate';
  const band = document.createElement('span');
  band.setAttribute('aria-hidden', 'true');
  band.dataset.motion = 'mark';
  band.style.cssText = 'position:absolute;left:-.2em;right:-.2em;top:.1em;bottom:-.04em;z-index:-1;' +
    'background:rgba(232,182,74,.32);transform:scaleX(0);transform-origin:0 50%;pointer-events:none';
  host.insertBefore(band, host.firstChild);
}

/* ---- hover: the scrap lifts and its corner curls ---- */
let curlCSS = null;
function peelSetup() {
  if (!curlCSS) {
    curlCSS = document.createElement('style');
    curlCSS.textContent =
      '[data-motion="scrap"]::after{content:"";position:absolute;right:0;bottom:0;width:0;height:0;z-index:9;' +
      'pointer-events:none;background:linear-gradient(315deg,rgba(206,192,163,.95) 46%,rgba(0,0,0,.34));' +
      'clip-path:polygon(100% 0,100% 100%,0 100%);transition:width .28s cubic-bezier(.2,.8,.25,1),height .28s cubic-bezier(.2,.8,.25,1)}' +
      '[data-motion="scrap"]:hover::after{width:24px;height:24px}' +
      '@media print{[data-motion="scrap"]::after{display:none}}';
    document.head.appendChild(curlCSS);
  }
  document.querySelectorAll('[data-motion="scrap"]').forEach((el) => {
    if (el.__peel) return;
    el.__peel = 1;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.__f = el.style.filter || '';
    /* Asymmetric: picking a scrap up is a quick, decisive move; putting it back down is
       the paper settling under its own weight. A single symmetric transition is what makes
       a hover feel like a CSS property changing rather than an object being handled. */
    const UP = 'transform .2s cubic-bezier(.2,.9,.25,1), filter .2s ease';
    const DOWN = 'transform .44s cubic-bezier(.16,1,.3,1), filter .44s ease';
    el.style.transition = DOWN;
    el.addEventListener('pointerenter', () => {
      if (el.getAnimations && el.getAnimations().length) return;
      el.style.transition = UP;
      el.style.transform = base(el) + ' translate3d(0,-7px,0) scale(1.012)';
      el.style.filter = (el.__f ? el.__f + ' ' : '') + 'drop-shadow(0 14px 18px rgba(0,0,0,.42))';
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = DOWN;
      el.style.transform = base(el);
      el.style.filter = el.__f;
    });
  });
}

export function scan() {
  if (reduce || PHONE) return;
  autotag(document.querySelector('[data-screen-label]') || document.body);
  document.querySelectorAll('[data-motion]').forEach((el) => {
    if (el.__mObs) return;
    el.__mObs = 1;
    base(el);
    /* held at zero until its turn in the cascade, so nothing pops in half-animated */
    if (el.dataset.motion !== 'count') { el.style.opacity = '0'; el.dataset.mHid = '1'; }
    io.observe(el);
  });
  tabsIn();
  lamp();
  collectLayers();
  lastY = -1;
  kick();
}

/* Re-arm after a client-side route change: the previous page's nodes are gone,
   so the one-shot latches have to reopen. */
export function rescan() {
  if (reduce || PHONE) return;
  tabsDone = false;
  scan();
  pageIn();
}

/* IntersectionObserver is the fast path, not the only path: anything still held at zero
   inside the viewport gets swept into the cascade regardless. */
let sweepDebounce, sweeps = 0, sweepTimer;
function sweep() {
  const vh = innerHeight;
  document.querySelectorAll('[data-m-hid]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom > -80 && r.top < vh + 80) { try { io.unobserve(el); } catch (e) {} enqueue(el); }
  });
}

export function initScrapMotion() {
  if (started || typeof window === 'undefined') return;
  started = true;
  reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  PHONE = matchMedia('(max-width: 700px)').matches || matchMedia('(pointer: coarse)').matches;
  collectLayers();
  if (PHONE) return;              /* phones: content is simply there */

  sweepTimer = setInterval(() => { sweep(); if (++sweeps > 24) clearInterval(sweepTimer); }, 400);
  addEventListener('scroll', () => { clearTimeout(sweepDebounce); sweepDebounce = setTimeout(sweep, 120); }, { passive: true });

  io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { enqueue(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });

  addEventListener('scroll', kick, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  let moPending = 0;
  const mo = new MutationObserver(() => {
    if (moPending) return;
    moPending = 1;
    soon(() => { moPending = 0; scan(); pageIn(); collectLayers(); });
  });

  scan();
  pageIn();
  setTimeout(scan, 350);
  setTimeout(scan, 1200);
  setTimeout(() => {              /* nothing may stay invisible */
    document.querySelectorAll('[data-m-hid]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight * 1.4) { el.style.opacity = ''; delete el.dataset.mHid; }
    });
  }, 3200);
  mo.observe(document.body, { childList: true, subtree: true });
}
