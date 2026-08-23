/* The motion vocabulary.

   Everything on this page used to move on one curve — cubic-bezier(.16,1,.3,1) — which is
   why it read as busy rather than physical: a torn kraft scrap, a strip of washi tape and a
   line of handwriting all decelerated identically. A scrapbook only works if its objects
   behave like the things they are made of, so each material gets its own behaviour and
   nothing shares a curve by accident.

     paper   mass, and air under it: one soft overshoot, then a settle
     press   a thumb pushing tape down: fast, dips past flat, no float
     ink     a pen moving at a pen's speed — duration comes from stroke length
     light   type, rules, kickers: no mass, so nothing to overshoot
     turn    a page accelerating away from the spine                                  */

export const CURVE = {
  press: 'cubic-bezier(.3,1.5,.4,1)',
  ink: 'cubic-bezier(.35,.55,.25,1)',
  light: 'cubic-bezier(.16,1,.3,1)',
  turn: 'cubic-bezier(.55,0,.85,.4)',
};

/* ------------------------------------------------------------------ springs

   There used to be a damped-spring solver here — the ODE integrated up front and sampled
   into 49 keyframes, so that paper could overshoot and settle asymmetrically in a way no
   cubic-bezier expresses. The physics was right and the reasoning behind it still holds;
   what was wrong was where the result ran.

   Keyframes built in JavaScript are a main-thread animation. The arrivals are now CSS
   scroll-driven animations instead (app/motion.css), which the compositor runs off-thread
   and scrubs against scroll position rather than firing on a timer. That trade is only
   available to animations declared in a stylesheet, so the solved curves had to become
   authored percentages to make the trip.

   They did make the trip. The paper spring's 13% overshoot is the 18%/100% pair in
   @keyframes m-paper; the tape press — the beat that dips to .986 before settling, which
   is the difference between a thumb pushing a strip down and a sticker appearing — is the
   9%/15%/22% run in @keyframes m-tape. Same shapes, no solver, no main thread.

   pluckTrack stays, because the thread it moves is a single element responding to a single
   pointer event: there is no scroll position to scrub it against, and 40 keyframes of
   translateX on one node is a composited animation either way.                          */

/* A damped spring starting at rest and knocked sideways — a plucked string rather than a
   released one. Displacement starts at 0, swings out, and rings down to nothing. */
export function pluckTrack({ stiffness = 520, damping = 11, mass = 1, steps = 40 } = {}) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const settle = -Math.log(0.01) / (zeta * w0);

  const track = [];
  let peak = 0;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * settle;
    const v = Math.exp(-zeta * w0 * t) * Math.sin(wd * t);
    peak = Math.max(peak, Math.abs(v));
    track.push({ offset: i / steps, v });
  }
  for (const k of track) k.v /= peak || 1;   // normalise so the first swing reaches 1
  track[track.length - 1].v = 0;
  return { track, duration: Math.round(settle * 1000) };
}
