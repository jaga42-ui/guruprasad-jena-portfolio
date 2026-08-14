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

/* ------------------------------------------------------------------ springs */

/* A damped spring, solved and sampled into keyframes.

   A cubic-bezier cannot express an overshoot followed by an asymmetric settle, and that is
   precisely the part that makes paper read as paper rather than as a card sliding to a
   stop. So the ODE is solved up front and baked into the values; the animation then runs
   on `linear`, because the shape is already in the numbers.

   Returns { track, duration } where track is [{ offset, v }] with v travelling 0 → 1 and
   crossing 1 on the overshoot. */
export function springTrack({ stiffness, damping, mass = 1, steps = 48, decayTo = 0.004 } = {}) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const settle = -Math.log(decayTo) / (zeta * w0);
  const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;

  const track = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * settle;
    const decay = Math.exp(-zeta * w0 * t);
    const v = zeta < 1
      ? 1 - decay * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t))
      : 1 - decay * (1 + w0 * t);
    track.push({ offset: i / steps, v });
  }
  track[track.length - 1].v = 1;
  return { track, duration: Math.round(settle * 1000) };
}

/* Stiffness and damping are the honest units, but they are not the units anyone tunes in.
   `overshoot` is how far past the target the first swing goes (0.13 = 13%) and `settle` is
   how long until it is visually at rest — which is what you actually art-direct. This
   solves back to the physics.

   Sanity check on the conversion: the handoff specifies stiffness ≈170 / damping ≈22 for
   the paper scraps, while the keyframes it ships overshoot a 30px rise by 4px. Feeding
   that 13% back through here returns stiffness 169 — the documented stiffness is right and
   only the damping figure was an approximation (14.2, not 22). At damping 22 the overshoot
   is 0.7%, i.e. 0.2px, which is no settle at all. */
export function spring({ overshoot, settle, steps = 48 }) {
  const L = -Math.log(overshoot);
  const zeta = L / Math.sqrt(Math.PI * Math.PI + L * L);
  const decayTo = 0.004;
  const w0 = -Math.log(decayTo) / (zeta * (settle / 1000));
  return springTrack({ stiffness: w0 * w0, damping: 2 * zeta * w0, steps, decayTo });
}

/* The same solver, but starting at rest and knocked sideways — a plucked string rather than
   a released one. Displacement starts at 0, swings out, and rings down to nothing. */
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
