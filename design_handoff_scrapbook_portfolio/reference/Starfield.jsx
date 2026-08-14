'use client';
import { useEffect, useRef } from 'react';

/* The original layer was 120 absolutely-positioned <span>s, each with its own
   CSS keyframe animation AND an animated box-shadow — 120 composited layers
   repainting every frame. This draws the identical field (same seed, same
   palette, same twinkle timing) into one canvas, so the cost is one paint of
   one element, throttled to ~30fps and suspended when the tab is hidden. */

const COLORS = ['#cdbcff', '#ffd9a8', '#dfe6ff', '#a8e6d8', '#ffc0e0', '#ffffff'];

function build() {
  let seed = 20260726;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  return Array.from({ length: 120 }, () => {
    const s = Math.round(rnd() * 3 + 2);
    const c = COLORS[Math.floor(rnd() * COLORS.length)];
    const top = rnd() * 96 + 2;
    const left = rnd() * 96 + 2;
    const dur = rnd() * 3.5 + 2.8;
    const delay = rnd() * 5;
    return { s, c, top, left, dur, delay };
  });
}

export default function Starfield() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const stars = build();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, last = 0, w = 0, h = 0, dpr = 1;

    const size = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        // matches @keyframes tw: opacity .3 -> 1, scale .82 -> 1.15
        const p = reduce ? 0.5 : (Math.sin(((t / 1000 - st.delay) / st.dur) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
        const a = 0.3 + 0.7 * p;
        const r = (st.s / 2) * (0.82 + 0.33 * p);
        const x = (st.left / 100) * w, y = (st.top / 100) * h;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4.2);
        glow.addColorStop(0, st.c); glow.addColorStop(0.28, st.c); glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = a * 0.5; ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, r * 4.2, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = a; ctx.fillStyle = st.c;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 33) return;          // ~30fps is plenty for a twinkle
      last = t;
      draw(t);
    };

    size(); draw(0);
    if (!reduce) raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => { size(); draw(last); });
    ro.observe(cv);
    const vis = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf && !reduce) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', vis);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, []);

  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}
