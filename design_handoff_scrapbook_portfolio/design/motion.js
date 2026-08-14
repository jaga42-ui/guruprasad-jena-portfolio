/* Scrapbook motion layer — cascade entrance, tape press, parallax, desk-lamp light, page turns.
   Reads data-motion="..." hooks placed in the page markup.
   No-ops for reduced motion, print, and phones (entrance motion is off on small/coarse screens). */
(function () {
  if (window.__scrapMotion) return;
  window.__scrapMotion = true;
  window.__scrapMotionRev = 3;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var PHONE = matchMedia('(max-width: 700px)').matches || matchMedia('(pointer: coarse)').matches;
  var EXPO = 'cubic-bezier(.16,1,.3,1)';

  function soon(fn) {
    var done = false, r = 0, t = 0;
    var run = function () { if (done) return; done = true; cancelAnimationFrame(r); clearTimeout(t); fn(); };
    r = requestAnimationFrame(run); t = setTimeout(run, 140);
  }
  var seen = new WeakSet();

  function base(el) {
    if (el.dataset.mBase === undefined) el.dataset.mBase = el.style.transform || '';
    return el.dataset.mBase;
  }
  function play(el, kf, opts) {
    if (el.dataset.mHid) { el.style.opacity = ''; delete el.dataset.mHid; }
    el.style.willChange = 'transform, opacity';
    var a = el.animate(kf, opts);
    a.finished.then(function () { a.cancel(); el.style.willChange = ''; }, function () { el.style.willChange = ''; });
    return a;
  }
  function sign(el) { return (base(el).indexOf('-') > -1) ? -1 : 1; }
  function unhide(el) { if (el.dataset.mHid) { el.style.opacity = ''; delete el.dataset.mHid; } }

  /* figures count up to the printed number and land on the literal text */
  function roll(el) {
    unhide(el);
    var raw = el.dataset.mTo || (el.textContent || '').trim();
    var m = /^(\D*)([\d,]+)(\D*)$/.exec(raw);
    if (!m) return;
    el.dataset.mTo = raw;
    var target = parseInt(m[2].replace(/,/g, ''), 10), grouped = m[2].indexOf(',') > -1;
    var t0 = performance.now(), ms = 900;
    (function step() {
      var q = Math.min(1, (performance.now() - t0) / ms);
      var v = Math.round(target * (1 - Math.pow(1 - q, 3)));
      el.textContent = m[1] + (grouped ? v.toLocaleString('en-US') : v) + m[3];
      if (q < 1) requestAnimationFrame(step); else el.textContent = raw;
    })();
  }

  /* an ink line stitches itself along its own length — measured only when it is its turn */
  function drawPath(el, d) {
    unhide(el);
    var L = 0;
    try { L = el.getTotalLength(); } catch (e) { L = 0; }
    if (L < 110) return;
    el.style.strokeDasharray = L;
    var a = el.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
      { duration: Math.min(1600, 380 + L * 1.4), delay: d, easing: 'cubic-bezier(.32,.72,.28,1)', fill: 'backwards' });
    a.finished.then(function () { el.style.strokeDasharray = ''; a.cancel(); }, function () {});
    return a;
  }

  var RECIPE = {
    ink: function (el, d) {
      return play(el, [
        { clipPath: 'inset(0 100% 0 0)', opacity: .5 },
        { clipPath: 'inset(0 0 0 0)', opacity: 1 }
      ], { duration: 1000, delay: d, easing: 'cubic-bezier(.42,.2,.36,1)', fill: 'backwards' });
    },
    mark: function (el, d) {
      el.style.transformOrigin = '0% 50%';
      return play(el, [
        { transform: 'scaleX(0) skewX(-6deg)', opacity: .25 },
        { transform: 'scaleX(1.03) skewX(-2deg)', opacity: 1, offset: .8 },
        { transform: 'scaleX(1)', opacity: 1 }
      ], { duration: 620, delay: d + 120, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'backwards' });
    },
    count: function (el, d) { setTimeout(function () { roll(el); }, d); },
    thread: function (el, d) { return drawPath(el, d); },
    scrap: function (el, d) {
      var b = base(el), s = sign(el);
      return play(el, [
        { opacity: 0, transform: b + ' translate3d(0,30px,0) rotate(' + (s * 2.6) + 'deg) scale(.962)' },
        { opacity: 1, transform: b + ' translate3d(0,-4px,0) rotate(' + (s * -0.6) + 'deg) scale(1.006)', offset: .68 },
        { opacity: 1, transform: b }
      ], { duration: 780, delay: d, easing: EXPO, fill: 'backwards' });
    },
    mat: function (el, d) {
      var b = base(el);
      return play(el, [
        { opacity: 0, transform: b + ' scale(.982)' },
        { opacity: 1, transform: b }
      ], { duration: 700, delay: d, easing: EXPO, fill: 'backwards' });
    },
    tape: function (el, d) {
      var b = base(el);
      el.style.transformOrigin = '50% 50%';
      return play(el, [
        { opacity: 0, transform: b + ' scale(.35)' },
        { opacity: 1, transform: b + ' scale(1.07)', offset: .58 },
        { opacity: 1, transform: b }
      ], { duration: 460, delay: d, easing: EXPO, fill: 'backwards' });
    },
    chip: function (el, d) {
      var b = base(el);
      return play(el, [
        { opacity: 0, transform: b + ' translate3d(0,12px,0) scale(.78)' },
        { opacity: 1, transform: b + ' scale(1.09)', offset: .62 },
        { opacity: 1, transform: b }
      ], { duration: 520, delay: d, easing: EXPO, fill: 'backwards' });
    },
    tag: function (el, d) {
      var b = base(el), s = sign(el);
      return play(el, [
        { opacity: 0, transform: b + ' translate3d(-14px,6px,0) rotate(' + (s * 5) + 'deg) scale(.9)' },
        { opacity: 1, transform: b }
      ], { duration: 620, delay: d, easing: EXPO, fill: 'backwards' });
    },
    head: function (el, d) {
      return play(el, [
        { opacity: 0, transform: 'translate3d(0,18px,0)', clipPath: 'inset(0 0 102% 0)' },
        { opacity: 1, transform: 'none', clipPath: 'inset(0 0 -22% 0)' }
      ], { duration: 980, delay: d, easing: EXPO, fill: 'backwards' });
    },
    kicker: function (el, d) {
      return play(el, [
        { opacity: 0, transform: 'translate3d(-10px,0,0)', letterSpacing: '0.5em' },
        { opacity: 1, transform: 'none' }
      ], { duration: 900, delay: d, easing: EXPO, fill: 'backwards' });
    },
    stamp: function (el, d) {
      var b = base(el);
      return play(el, [
        { opacity: 0, transform: b + ' scale(1.7) rotate(-16deg)' },
        { opacity: .9, transform: b + ' scale(.93)', offset: .5 },
        { opacity: 1, transform: b + ' scale(1.02)', offset: .74 },
        { opacity: 1, transform: b }
      ], { duration: 680, delay: d, easing: 'cubic-bezier(.3,1.5,.4,1)', fill: 'backwards' });
    },
    line: function (el, d) {
      return play(el, [
        { opacity: 0, transform: 'translate3d(0,14px,0)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 760, delay: d, easing: EXPO, fill: 'backwards' });
    }
  };

  /* ---- cascade scheduler ----
     Waves of two starts every 110ms, never more than six animations in flight.
     Order is visual: top-left first, so the eye is always led downward. */
  var MAX_LIVE = 6, WAVE_GAP = 110, WAVE_SIZE = 2;
  var queue = [], collecting = 0, pending = [], live = 0, pumping = 0;

  function enqueue(el) {
    if (seen.has(el)) return;
    seen.add(el);
    queue.push(el);
    if (!collecting) { collecting = 1; soon(collect); }
  }
  function collect() {
    collecting = 0;
    queue.sort(function (a, b) {
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (ra.top - rb.top) || (ra.left - rb.left);
    });
    for (var i = 0; i < queue.length; i++) {
      var el = queue[i], fn = RECIPE[el.dataset.motion];
      if (fn) pending.push([el, fn]);
      else unhide(el);
    }
    queue.length = 0;
    if (!pumping) { pumping = 1; pump(); }
  }
  function pump() {
    var started = 0;
    while (live < MAX_LIVE && pending.length && started < WAVE_SIZE) {
      var it = pending.shift();
      started++; live++;
      release(it[0], it[1]);
    }
    if (pending.length || live) setTimeout(pump, WAVE_GAP);
    else pumping = 0;
  }
  function release(el, fn) {
    var settled = false;
    var done = function () { if (settled) return; settled = true; live--; };
    var a;
    try { a = fn(el, 0); } catch (e) { done(); return; }
    if (a && a.finished) a.finished.then(done, done);
    else setTimeout(done, 700);
    setTimeout(done, 1800);
  }

  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (e) {
      if (e.isIntersecting) { enqueue(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });

  /* ---- hooks the pages don't have to spell out — one pass per element, ever ---- */
  function isHand(el) {
    var f = getComputedStyle(el).fontFamily || '';
    return f.indexOf('Caveat') === 0 || f.indexOf('"Caveat"') === 0 || f.indexOf("'Caveat'") === 0;
  }
  function autotag(root) {
    root.querySelectorAll('p,span,div,h2,h3,h4,li,blockquote').forEach(function (el) {
      if (el.__mTag) return;
      el.__mTag = 1;
      if (el.dataset.motion || el.closest('nav') || el.closest('[data-motion-tab]') || el.closest('[data-plot]')) return;
      if (el.parentElement && el.parentElement.closest('[data-motion="ink"]')) return;
      var t = (el.textContent || '').trim();
      if (!t || t.length < 3 || t.length > 240) return;
      if ((el.style.animation || '').length) return;
      if (el.querySelector('p,div,svg,img,button')) return;
      if (!isHand(el)) return;
      el.dataset.motion = 'ink';
    });
    root.querySelectorAll('span,div,p,strong,dd').forEach(function (el) {
      if (el.__mCnt) return;
      el.__mCnt = 1;
      if (el.dataset.motion || el.children.length || el.closest('[data-plotter]') || el.closest('nav')) return;
      var t = (el.textContent || '').trim();
      if (!/^\D{0,2}[\d,]{1,7}\D{0,3}$/.test(t) || !/\d/.test(t)) return;
      if (parseFloat(getComputedStyle(el).fontSize) < 24) return;
      el.dataset.motion = 'count';
    });
    /* strokes are tagged on shape alone — their length is measured only when they animate */
    root.querySelectorAll('svg path,svg polyline,svg line').forEach(function (el) {
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

  function markSetup() {
    var host = document.querySelector('[data-mark]') ||
      document.querySelector('[data-motion="line"] span[style*="border-bottom"]') ||
      document.querySelector('[data-screen-label] p span[style*="border-bottom"]');
    if (!host || host.querySelector('[data-motion="mark"]')) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.style.isolation = 'isolate';
    var band = document.createElement('span');
    band.setAttribute('aria-hidden', 'true');
    band.dataset.motion = 'mark';
    band.style.cssText = 'position:absolute;left:-.2em;right:-.2em;top:.1em;bottom:-.04em;z-index:-1;' +
      'background:rgba(232,182,74,.32);transform:scaleX(0);transform-origin:0 50%;pointer-events:none';
    host.insertBefore(band, host.firstChild);
  }

  var curlCSS;
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
    document.querySelectorAll('[data-motion="scrap"]').forEach(function (el) {
      if (el.__peel) return;
      el.__peel = 1;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.__f = el.style.filter || '';
      el.style.transition = 'transform .26s cubic-bezier(.2,.8,.25,1), filter .26s ease';
      el.addEventListener('pointerenter', function () {
        if (el.getAnimations && el.getAnimations().length) return;
        el.style.transform = base(el) + ' translate3d(0,-7px,0) scale(1.012)';
        el.style.filter = (el.__f ? el.__f + ' ' : '') + 'drop-shadow(0 14px 18px rgba(0,0,0,.42))';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = base(el);
        el.style.filter = el.__f;
      });
    });
  }

  function scan() {
    var root = document.querySelector('[data-screen-label]') || document.body;
    autotag(root);
    document.querySelectorAll('[data-motion]').forEach(function (el) {
      if (el.__mObs) return;
      el.__mObs = 1;
      base(el);
      /* held at zero until its turn in the cascade, so nothing pops in half-animated */
      if (el.dataset.motion !== 'count') { el.style.opacity = '0'; el.dataset.mHid = '1'; }
      io.observe(el);
    });
    tabsIn();
    lamp();
  }

  /* ---- notebook tabs: deal in from the edge, page-turn out on click ---- */
  var tabsDone = false;
  function tabsIn() {
    var tabs = document.querySelectorAll('[data-motion-tab]');
    if (!tabs.length || tabsDone) return;
    tabsDone = true;
    tabs.forEach(function (el, i) {
      var b = base(el);
      play(el, [
        { opacity: 0, transform: b + ' translate3d(115%,0,0)' },
        { opacity: 1, transform: b + ' translate3d(-6px,0,0)', offset: .78 },
        { opacity: 1, transform: b }
      ], { duration: 820, delay: 120 + i * 78, easing: EXPO, fill: 'backwards' });
      el.addEventListener('click', function (ev) {
        var href = el.getAttribute('href');
        if (!href || href === '#' || el.hasAttribute('aria-current')) return;
        ev.preventDefault();
        var root = document.querySelector('[data-screen-label]') || document.body;
        document.documentElement.style.perspective = '1500px';
        root.style.transformOrigin = 'left center';
        play(root, [
          { opacity: 1, transform: 'none' },
          { opacity: .97, transform: 'rotateY(-7deg) translate3d(-16px,0,0)', offset: .42 },
          { opacity: 0, transform: 'rotateY(-17deg) translate3d(-64px,0,0) scale(.988)' }
        ], { duration: 460, easing: 'cubic-bezier(.5,0,.85,.4)', fill: 'forwards' });
        setTimeout(function () { location.href = href; }, 400);
      });
    });
  }

  /* ---- desk-lamp light: built on first pointer move, asleep whenever the pointer is still ---- */
  var lampEl, lampArmed = false;
  function lamp() {
    if (lampArmed || !matchMedia('(hover: hover)').matches || matchMedia('(pointer: coarse)').matches) return;
    lampArmed = true;
    var tx = 0, ty = 0, cx = 0, cy = 0, awake = false, idle;
    function build() {
      lampEl = document.createElement('div');
      lampEl.setAttribute('aria-hidden', 'true');
      lampEl.style.cssText = 'position:fixed;inset:0;z-index:60;pointer-events:none;opacity:0;transition:opacity .6s ease;mix-blend-mode:soft-light;background:radial-gradient(420px circle at var(--lx,50%) var(--ly,40%), rgba(255,231,186,.55), rgba(255,214,150,.18) 42%, transparent 72%)';
      document.body.appendChild(lampEl);
    }
    function loop() {
      if (!awake) return;
      cx += (tx - cx) * .09; cy += (ty - cy) * .09;
      lampEl.style.setProperty('--lx', cx + 'px');
      lampEl.style.setProperty('--ly', cy + 'px');
      requestAnimationFrame(loop);
    }
    addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!lampEl) { build(); cx = tx; cy = ty; }
      if (!awake) { awake = true; lampEl.style.opacity = '1'; requestAnimationFrame(loop); }
      clearTimeout(idle);
      idle = setTimeout(function () { awake = false; lampEl.style.opacity = '0'; }, 1500);
    }, { passive: true });
  }

  /* ---- parallax on the decoration layers — only while the page is actually scrolling ---- */
  var layers = [], paraAwake = false, paraIdle, lastY = -1;
  function collectLayers() { layers = [].slice.call(document.querySelectorAll('[data-motion-deco]')); }
  function paraFrame() {
    if (!paraAwake) return;
    var y = scrollY;
    if (y !== lastY && layers.length) {
      lastY = y;
      for (var i = 0; i < layers.length; i++) {
        var rate = [0.10, -0.06, 0.055, -0.035][i % 4];
        var raw = y * rate, cap = 74;
        layers[i].style.transform = 'translate3d(0,' + (cap * Math.tanh(raw / cap)).toFixed(2) + 'px,0)';
      }
    }
    requestAnimationFrame(paraFrame);
  }
  addEventListener('scroll', function () {
    if (!paraAwake) { paraAwake = true; requestAnimationFrame(paraFrame); }
    clearTimeout(paraIdle);
    paraIdle = setTimeout(function () { paraAwake = false; }, 220);
  }, { passive: true });

  var moPending = 0;
  var mo = new MutationObserver(function () {
    if (moPending) return;
    moPending = 1;
    setTimeout(function () { moPending = 0; scan(); collectLayers(); }, 220);
  });

  /* IntersectionObserver is the fast path, not the only path: anything still held at zero
     inside the viewport gets swept into the cascade regardless. */
  var sweepDebounce, sweeps = 0, sweepTimer;
  function sweep() {
    var vh = innerHeight;
    document.querySelectorAll('[data-m-hid]').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom > -80 && r.top < vh + 80) { try { io.unobserve(el); } catch (e) {} enqueue(el); }
    });
  }

  function boot() {
    collectLayers();
    if (PHONE) return;              /* phones: content is simply there */
    scan();
    sweepTimer = setInterval(function () { sweep(); if (++sweeps > 24) clearInterval(sweepTimer); }, 400);
    addEventListener('scroll', function () {
      clearTimeout(sweepDebounce);
      sweepDebounce = setTimeout(sweep, 120);
    }, { passive: true });
    setTimeout(scan, 900);          /* one safety pass after streaming settles */
    setTimeout(function () {        /* nothing may stay invisible */
      document.querySelectorAll('[data-m-hid]').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight * 1.4) { el.style.opacity = ''; delete el.dataset.mHid; }
      });
    }, 3200);
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
