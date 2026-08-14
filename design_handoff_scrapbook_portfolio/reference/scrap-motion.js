/* Scrapbook motion layer — reveal choreography, tape press, parallax, desk-lamp light, page turns.
   Ported from the hand-built motion.js. Every keyframe, duration, delay and easing is verbatim;
   only the scheduling changed:
     · the two permanent rAF loops (lamp follow + deco parallax) are now ONE loop that parks
       itself after ~600ms of no pointer/scroll movement and restarts on the next event
     · the loop also parks while the tab is hidden
     · tab clicks hand off to window.__nav (client-side router) when present, else location.href
     · scan() is exported so a route change can re-arm new nodes                                */

const EXPO = 'cubic-bezier(.16,1,.3,1)';

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
  a.finished.then(() => { a.cancel(); el.style.willChange = ''; }, () => {});
  return a;
}

function sign(el) { return base(el).indexOf('-') > -1 ? -1 : 1; }

function unhide(el) { if (el.dataset.mHid) { el.style.opacity = ''; delete el.dataset.mHid; } }

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
}

const RECIPE = {
  /* handwriting is drawn, never faded */
  ink(el, d) {
    play(el, [
      { clipPath: 'inset(0 100% 0 0)', opacity: .5 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1 }
    ], { duration: 1000, delay: d, easing: 'cubic-bezier(.42,.2,.36,1)', fill: 'backwards' });
  },
  /* the highlighter band swept behind one phrase per page */
  mark(el, d) {
    el.style.transformOrigin = '0% 50%';
    play(el, [
      { transform: 'scaleX(0) skewX(-6deg)', opacity: .25 },
      { transform: 'scaleX(1.03) skewX(-2deg)', opacity: 1, offset: .8 },
      { transform: 'scaleX(1)', opacity: 1 }
    ], { duration: 620, delay: d + 240, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'backwards' });
  },
  count(el, d) { setTimeout(() => roll(el), d); },
  thread(el, d) { drawPath(el, d); },
  scrap(el, d) {
    const b = base(el), s = sign(el);
    play(el, [
      { opacity: 0, transform: b + ' translate3d(0,30px,0) rotate(' + (s * 2.6) + 'deg) scale(.962)' },
      { opacity: 1, transform: b + ' translate3d(0,-4px,0) rotate(' + (s * -0.6) + 'deg) scale(1.006)', offset: .68 },
      { opacity: 1, transform: b }
    ], { duration: 780, delay: d, easing: EXPO, fill: 'backwards' });
  },
  mat(el, d) {
    const b = base(el);
    play(el, [
      { opacity: 0, transform: b + ' scale(.982)' },
      { opacity: 1, transform: b }
    ], { duration: 700, delay: d, easing: EXPO, fill: 'backwards' });
  },
  tape(el, d) {
    const b = base(el);
    el.style.transformOrigin = '50% 50%';
    play(el, [
      { opacity: 0, transform: b + ' scale(.35)' },
      { opacity: 1, transform: b + ' scale(1.07)', offset: .58 },
      { opacity: 1, transform: b }
    ], { duration: 460, delay: d + 200, easing: EXPO, fill: 'backwards' });
  },
  chip(el, d) {
    const b = base(el);
    play(el, [
      { opacity: 0, transform: b + ' translate3d(0,12px,0) scale(.78)' },
      { opacity: 1, transform: b + ' scale(1.09)', offset: .62 },
      { opacity: 1, transform: b }
    ], { duration: 520, delay: d, easing: EXPO, fill: 'backwards' });
  },
  tag(el, d) {
    const b = base(el), s = sign(el);
    play(el, [
      { opacity: 0, transform: b + ' translate3d(-14px,6px,0) rotate(' + (s * 5) + 'deg) scale(.9)' },
      { opacity: 1, transform: b }
    ], { duration: 620, delay: d, easing: EXPO, fill: 'backwards' });
  },
  head(el, d) {
    play(el, [
      { opacity: 0, transform: 'translate3d(0,18px,0)', clipPath: 'inset(0 0 102% 0)' },
      { opacity: 1, transform: 'none', clipPath: 'inset(0 0 -22% 0)' }
    ], { duration: 980, delay: d, easing: EXPO, fill: 'backwards' });
  },
  kicker(el, d) {
    play(el, [
      { opacity: 0, transform: 'translate3d(-10px,0,0)', letterSpacing: '0.5em' },
      { opacity: 1, transform: 'none' }
    ], { duration: 900, delay: d, easing: EXPO, fill: 'backwards' });
  },
  stamp(el, d) {
    const b = base(el);
    play(el, [
      { opacity: 0, transform: b + ' scale(1.7) rotate(-16deg)' },
      { opacity: .9, transform: b + ' scale(.93)', offset: .5 },
      { opacity: 1, transform: b + ' scale(1.02)', offset: .74 },
      { opacity: 1, transform: b }
    ], { duration: 680, delay: d + 120, easing: 'cubic-bezier(.3,1.5,.4,1)', fill: 'backwards' });
  },
  line(el, d) {
    play(el, [
      { opacity: 0, transform: 'translate3d(0,14px,0)' },
      { opacity: 1, transform: 'none' }
    ], { duration: 760, delay: d, easing: EXPO, fill: 'backwards' });
  }
};

/* ---- reveal on scroll, staggered per batch ---- */
let queue = [], collecting = 0, io = null;

/* Cascade: waves of two starts every 110ms, never more than six animations in flight,
   ordered top-left first so the eye is always led downward. */
const MAX_LIVE = 6, WAVE_GAP = 110, WAVE_SIZE = 2;
let pending = [], live = 0, pumping = 0;

function enqueue(el) {
  if (seen.has(el)) return;
  seen.add(el);
  queue.push(el);
  if (!collecting) { collecting = 1; soon(collect); }
}

function collect() {
  collecting = 0;
  queue.sort((a, b) => {
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    return (ra.top - rb.top) || (ra.left - rb.left);
  });
  queue.forEach((el) => {
    const fn = RECIPE[el.dataset.motion];
    if (fn) pending.push([el, fn]); else unhide(el);
  });
  queue.length = 0;
  if (!pumping) { pumping = 1; pump(); }
}

function pump() {
  let started = 0;
  while (live < MAX_LIVE && pending.length && started < WAVE_SIZE) {
    const it = pending.shift();
    started++; live++;
    release(it[0], it[1]);
  }
  if (pending.length || live) setTimeout(pump, WAVE_GAP);
  else pumping = 0;
}

function release(el, fn) {
  let settled = false;
  const done = () => { if (settled) return; settled = true; live--; };
  let a;
  try { a = fn(el, 0); } catch (e) { done(); return; }
  if (a && a.finished) a.finished.then(done, done); else setTimeout(done, 700);
  setTimeout(done, 1800);
}

/* ---- notebook tabs: deal in from the edge, page-turn out on click ---- */
let tabsDone = false;

function tabsIn() {
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

    el.addEventListener('click', (ev) => {
      const href = el.getAttribute('href');
      if (!href || href === '#' || el.hasAttribute('aria-current')) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
      ev.preventDefault();
      const root = document.querySelector('[data-screen-label]') || document.body;
      document.documentElement.style.perspective = '1500px';
      root.style.transformOrigin = 'left center';
      play(root, [
        { opacity: 1, transform: 'none' },
        { opacity: .97, transform: 'rotateY(-7deg) translate3d(-16px,0,0)', offset: .42 },
        { opacity: 0, transform: 'rotateY(-17deg) translate3d(-64px,0,0) scale(.988)' }
      ], { duration: 460, easing: 'cubic-bezier(.5,0,.85,.4)', fill: 'forwards' });
      setTimeout(() => {
        if (typeof window.__nav === 'function') window.__nav(href);
        else location.href = href;
      }, 400);
    });
  });
}

/* ---- desk lamp + deco parallax, sharing one idle-parking rAF ---- */
let lampEl = null, layers = [];
let tx = 0, ty = 0, cx = 0, cy = 0, lampOn = false, wantLamp = false;
let lastY = -1, raf = 0, idleFrames = 0;

function frame() {
  raf = 0;
  let busy = false;

  if (wantLamp && lampEl) {
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
  if (lampEl || matchMedia('(pointer: coarse)').matches) return;
  lampEl = document.createElement('div');
  lampEl.setAttribute('aria-hidden', 'true');
  lampEl.style.cssText = 'position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;transition:opacity .6s ease;mix-blend-mode:soft-light;will-change:opacity;background:radial-gradient(420px circle at var(--lx,50%) var(--ly,40%), rgba(255,231,186,.55), rgba(255,214,150,.18) 42%, transparent 72%)';
  document.body.appendChild(lampEl);
  tx = innerWidth / 2; ty = innerHeight * .4; cx = tx; cy = ty;
  wantLamp = true;

  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!lampOn) { lampOn = true; cx = tx; cy = ty; lampEl.style.opacity = '1'; }
    kick();
  }, { passive: true });
}

function collectLayers() {
  layers = [].slice.call(document.querySelectorAll('[data-motion-deco]'));
}

/* ---- page entrance ---- */
function pageIn() {
  const root = document.querySelector('[data-screen-label]');
  if (!root || root.__in) return;
  root.__in = 1;
  play(root, [
    { opacity: 0, transform: 'scale(1.012)' },
    { opacity: 1, transform: 'none' }
  ], { duration: 620, easing: EXPO, fill: 'backwards' });
}

/* ---- hooks the pages don't have to spell out ---- */
function isHand(el) {
  const f = getComputedStyle(el).fontFamily || '';
  return f.indexOf('Caveat') === 0 || f.indexOf('"Caveat"') === 0 || f.indexOf("'Caveat'") === 0;
}
function autotag() {
  document.querySelectorAll('p,span,div,h2,h3,h4,li,blockquote').forEach((el) => {
    if (el.__mTag) return;
    el.__mTag = 1;
    if (el.dataset.motion || el.closest('nav') || el.closest('[data-motion-tab]') || el.closest('[data-plot]')) return;
    if (el.parentElement && el.parentElement.closest('[data-motion="ink"]')) return;
    const t = (el.textContent || '').trim();
    if (!t || t.length > 240) return;
    if (el.querySelector('p,div,svg,img,button')) return;
    if (!isHand(el)) return;
    el.dataset.motion = 'ink';
  });
  document.querySelectorAll('span,div,p,strong,dd').forEach((el) => {
    if (el.__mCnt) return;
    el.__mCnt = 1;
    if (el.dataset.motion || el.children.length || el.closest('[data-plotter]') || el.closest('nav')) return;
    const t = (el.textContent || '').trim();
    if (!/^\D{0,2}[\d,]{1,7}\D{0,3}$/.test(t) || !/\d/.test(t)) return;
    if (parseFloat(getComputedStyle(el).fontSize) < 24) return;
    el.dataset.motion = 'count';
  });
  document.querySelectorAll('svg path,svg polyline,svg line').forEach((el) => {
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
    el.style.transition = 'transform .26s cubic-bezier(.2,.8,.25,1), filter .26s ease';
    el.addEventListener('pointerenter', () => {
      if (el.getAnimations && el.getAnimations().length) return;
      el.style.transform = base(el) + ' translate3d(0,-7px,0) scale(1.012)';
      el.style.filter = (el.__f ? el.__f + ' ' : '') + 'drop-shadow(0 14px 18px rgba(0,0,0,.42))';
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = base(el);
      el.style.filter = el.__f;
    });
  });
}

export function scan() {
  if (reduce || PHONE) return;
  autotag();
  document.querySelectorAll('[data-motion]').forEach((el) => {
    if (el.__mObs) return;
    el.__mObs = 1;
    base(el);
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
  if (!PHONE) {
    sweepTimer = setInterval(() => { sweep(); if (++sweeps > 24) clearInterval(sweepTimer); }, 400);
    addEventListener('scroll', () => { clearTimeout(sweepDebounce); sweepDebounce = setTimeout(sweep, 120); }, { passive: true });
  }

  io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { enqueue(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });

  addEventListener('scroll', kick, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  let moPending = 0;
  const mo = new MutationObserver(() => {
    if (moPending) return;
    moPending = 1;
    soon(() => { moPending = 0; scan(); pageIn(); });
  });

  scan();
  pageIn();
  setTimeout(scan, 350);
  setTimeout(scan, 1200);
  setTimeout(() => {
    document.querySelectorAll('[data-m-hid]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) { el.style.opacity = ''; delete el.dataset.mHid; }
    });
  }, 2600);
  mo.observe(document.body, { childList: true, subtree: true });
}
