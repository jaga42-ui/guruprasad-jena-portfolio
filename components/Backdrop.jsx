/* The air in the room.

   ── what this replaced, and why ─────────────────────────────────────────────────────

   The first version of this file put three large coloured radial washes behind the page.
   Two things were wrong with that. It is the single most recognisable background effect
   of the past five years, so it reads as a template rather than as this notebook — and
   globals.css already paints three nebula washes of its own into the body stack, so it
   was colour laid over colour, which muddies both.

   The replacement follows one rule: make the room feel occupied, not decorated. A
   background earns attention by rewarding a second look, not by competing for the first
   one. So there is exactly one gesture with any reach — the stars gaining depth — and
   everything else is quieter than the painting it sits behind.

   ── the gesture ─────────────────────────────────────────────────────────────────────

   Stars are the furthest thing in the composition and currently the only thing moving at
   exactly the speed of the notebook: the Starfield canvas lives inside the page, so it
   scrolls at rate 1 along with the paper on top of it. That is a depth error you can feel
   without being able to name — infinity keeping pace with a scrap of tape.

   The fix is in motion.css and it is one rule: hold the canvas back as the page scrolls,
   so the stars lag and read as distant. Nothing is added to the screen at all; a wrong
   relationship becomes a right one. That is the whole eye-catching half, and it costs one
   composited layer.

   ── the quiet half ──────────────────────────────────────────────────────────────────

   Dust in lamplight. Fourteen motes, one to two and a half pixels, at alphas between .10
   and .22, drifting on periods long enough that no two ever pair up. On a desk lit by a
   single lamp this is what the air actually looks like, and it is the detail that makes a
   rendered room feel like a photographed one.

   One wisp, replacing the three washes: elongated rather than circular, .06 alpha, and
   three and a half minutes to cross. It should never be something you notice arriving.

   One meteor, on a 47-second period, visible for under a second of it. Rare enough to be
   a reward rather than a feature.                                                       */

/* Deterministic scatter. Math.random() would re-place every mote on each client render
   and, worse, differ between the server pass and hydration; a fixed seed keeps the
   composition identical everywhere and makes it something that can be art-directed. */
function scatter(n, seed) {
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  return Array.from({ length: n }, () => ({
    top: +(rnd() * 96 + 2).toFixed(2),
    left: +(rnd() * 96 + 2).toFixed(2),
    size: +(rnd() * 1.5 + 1).toFixed(2),
    /* 34–61s. Wide enough that the field never develops a beat. */
    ms: Math.round(rnd() * 27000 + 34000),
    delay: Math.round(rnd() * -46000),
    alpha: +(rnd() * 0.12 + 0.1).toFixed(3),
    /* Which of the three drift paths this mote takes, so they do not all trace the
       same shape at different speeds. */
    path: Math.floor(rnd() * 3) + 1,
    warm: rnd() > 0.72,
  }));
}

const MOTES = scatter(14, 20260823);

export default function Backdrop() {
  return (
    <div className="m-sky" aria-hidden="true">
      {/* Two wrappers per layer, and the nesting is not incidental. The outer one
          answers the pointer, the inner one answers scroll, and both do it by writing
          `translate` — which cannot be shared, because two animations on one property
          do not blend. Splitting them across parent and child is what lets a layer
          respond to the cursor and the scrollbar at the same time.

          --m-ptr is how far this layer travels with the pointer, in px. It carries the
          sign, so the dust and the stars pull against each other rather than sliding
          together; opposed travel is what the eye reads as separation. */}
      <div className="m-sky-ptr" style={{ '--m-ptr': 10 }}>
        {/* The wisp. One, elongated, and fainter than anything else here. */}
        <div className="m-sky-par" style={{ '--m-sky-rate': 1 }}>
          <div className="m-wisp" />
        </div>
      </div>

      {/* Dust is the nearest thing in the composition, so it moves most. */}
      <div className="m-sky-ptr" style={{ '--m-ptr': -22 }}>
        <div className="m-sky-par" style={{ '--m-sky-rate': -0.4 }}>
        {MOTES.map((m, i) => (
          <span
            key={'d' + i}
            className={'m-mote m-mote-' + m.path}
            style={{
              top: m.top + '%',
              left: m.left + '%',
              width: m.size + 'px',
              height: m.size + 'px',
              /* --m-a, not opacity: the keyframes reference it so each mote keeps its
                 own brightness through the fade. See the note in motion.css. */
              '--m-a': m.alpha,
              background: m.warm ? 'rgba(255, 228, 186, 1)' : 'rgba(226, 236, 245, 1)',
              animationDuration: m.ms + 'ms',
              animationDelay: m.delay + 'ms',
            }}
          />
        ))}
        </div>
      </div>

      <span className="m-meteor" />
    </div>
  );
}
