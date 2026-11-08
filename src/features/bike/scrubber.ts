/* Geometry for the explode scrubber's cable fill. Pure functions, so they can be unit-tested
   away from the DOM. All values are in px, inside a track `width` × `height`.
   At progress 0 the cable is bunched up at the left; at 1 it runs the full track. */
import { clamp } from './explode';

/** Inset from the track ends, and the shortest the cable gets when fully bunched up. */
export const PAD = 14;
export const MIN_SPAN = 44;
/** How far the tinted fill runs past the cable's end, so the grip sits inside it. */
export const FILL_LEAD = 10;

/** Where the cable starts and ends for a given progress. */
export function span(progress: number, width: number) {
  const full = Math.max(MIN_SPAN, width - PAD * 2);
  const len = MIN_SPAN + clamp(progress) * (full - MIN_SPAN);
  return { x0: PAD, x1: PAD + len, len, full };
}

const f = (v: number) => Math.round(v * 10) / 10;

/** A kinked gear cable (a trochoid): loops while slack, a straight line once pulled taut.
    The loops ease in over the first and last turn, and never reach past either end, so both
    ends sit on the centre line, exactly at x0 and x1, whatever the progress. */
export function cablePath(progress: number, width: number, height: number, loops = 5, steps = 240) {
  const { x0, x1, len } = span(progress, width);
  const u1 = Math.PI * 2 * loops, a = len / u1, turn = Math.PI * 2;
  const b = Math.min(height * 0.3, 14) * (1 - clamp(progress));
  const cy = height / 2;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const u = (u1 * i) / steps;
    const edge = Math.min(u, u1 - u);
    const env = Math.sin((Math.PI / 2) * Math.min(1, edge / turn)) ** 2;
    const bx = Math.min(b * env, a * edge); // never past the ends
    const x = i === steps ? x1 : x0 + a * u - bx * Math.sin(u);
    d += (i ? 'L' : 'M') + f(x) + ' ' + f(cy - b * env * Math.cos(u));
  }
  return { d, end: x1 };
}

/* ---------- The coil spring scrubber ---------- */

/** The coil's shape. `x0` is where the coil leaves its anchor cap; `maxWave` caps the ripple. */
export const COIL = { turns: 13, radius: 12, tilt: 1.4, x0: PAD + 4, endGap: 3, maxWave: 0.12 } as const;

/** The idle "try me" tug: `first` ms after it appears, then every `every` ms, pull `pull` px
    (`touchPull` on touch screens, whose CSS pixels are physically smaller: 12 px on a phone is
    about 8 px on a desktop) for `hold` s, then let the spring go. */
export const INVITE = { first: 1200, every: 4000, pull: 8, touchPull: 12, hold: 0.14 } as const;

/** When the next tug is due after time `t` (ms), for an invitation that began at `since`: the
    tugs keep one beat, at since + first, then every `every` ms, so a late timer, a re-run effect
    or a scrubber mounted again rejoins the same rhythm instead of starting a new one. */
export function nextTug(t: number, since: number) {
  const due = since + INVITE.first;
  if (t < due) return due;
  return due + (Math.floor((t - due) / INVITE.every) + 1) * INVITE.every;
}

/** A steel coil seen almost side-on, from its anchor to the grip at the end of the span.
    `back` is the half of each turn behind the axis (drawn lighter), `front` the half in front,
    `shine` a highlight along the front, `tang` the short straight leg into the grip.
    `wave` (−0.12…0.12) shifts the middle coils along the axis, never the ends; `tug` (px)
    moves the grip end only. Both ends taper onto the centre line. */
export function coilPaths(progress: number, width: number, height: number, { wave = 0, tug = 0 } = {}) {
  const x1 = span(progress, width).x1 + tug;
  const x0 = COIL.x0, xe = x1 - COIL.endGap, L = xe - x0, cy = height / 2;
  const N = COIL.turns, T = N * Math.PI * 2, steps = N * 24;
  let back = '', front = '', shine = '', prevFront: boolean | null = null, prevShine = false;
  for (let i = 0; i <= steps; i++) {
    const fr = i / steps, t = fr * T;
    const ff = fr + wave * Math.sin(Math.PI * fr);
    const env = Math.min(1, Math.min(fr, 1 - fr) * N * 1.5); // taper into the end caps
    const x = x0 + L * ff + COIL.tilt * Math.sin(t) * env, y = cy - COIL.radius * Math.cos(t) * env;
    const isFront = Math.sin(t) >= 0, pt = f(x) + ' ' + f(y);
    if (prevFront !== null && prevFront !== isFront) { // close the half-turn so the halves meet
      if (prevFront) front += 'L' + pt; else back += 'L' + pt;
    }
    if (isFront) front += (prevFront === true ? 'L' : 'M') + pt; else back += (prevFront === false ? 'L' : 'M') + pt;
    const lit = isFront && Math.cos(t) > 0.15;
    if (lit) shine += (prevShine ? 'L' : 'M') + f(x - 0.6) + ' ' + f(y - 0.9);
    prevShine = lit; prevFront = isFront;
  }
  return { back, front, shine, tang: 'M' + f(xe) + ' ' + f(cy) + 'L' + f(x1) + ' ' + f(cy), x1 };
}

type Spring = { x: number; v: number };
const STEP = 1 / 240;
function spring(s: Spring, target: number, k: number, c: number, dt: number, eps: number) {
  for (let t = 0; t < dt; t += STEP) { const a = -k * (s.x - target) - c * s.v; s.v += a * STEP; s.x += s.v * STEP; }
  if (Math.abs(s.x - target) < eps && Math.abs(s.v) < eps * 10) { s.x = target + 0; s.v = 0; return false; }
  return true;
}

/** The coil's secondary motion, stepped once a frame. `wave` makes the middle coils lag a
    moving grip and wobble when it stops; `tug` is the invitation's small pull on the grip.
    Both are under-damped springs, so they overshoot a little and settle. Pure: no DOM. */
export class CoilMotion {
  wave: Spring = { x: 0, v: 0 };
  tug: Spring = { x: 0, v: 0 };
  private hold = 0;
  private dir = 0;
  private pull: number = INVITE.pull;
  private last: number | null = null;

  /** Start one tug of `pull` px: `dir` +1 pulls the grip out, −1 pushes it in. */
  kick(dir: number, pull: number = INVITE.pull) { this.dir = dir; this.pull = pull; this.hold = INVITE.hold; }

  /** Advance by `dt` seconds with the bike at `progress` over a span of `spanPx`. True while moving. */
  step(dt: number, progress: number, spanPx: number) {
    // A frame with no time in it moves nothing, but must not end a tug that is still to play:
    // Chrome can stamp the first frame after a timer with a time before the timer ran.
    if (dt <= 0) return this.hold > 0 || this.tug.x !== 0 || this.tug.v !== 0 || this.wave.x !== 0 || this.wave.v !== 0;
    const moved = this.last === null ? 0 : progress - this.last;
    this.last = progress;
    this.hold = Math.max(0, this.hold - dt);
    const tugV = this.tug.v;
    const pulling = spring(this.tug, this.hold > 0 ? this.dir * this.pull : 0, 260, 14, dt, 0.05); // settles well inside a second
    const v = moved / dt + tugV / Math.max(1, spanPx); // grip speed, in spans per second
    const target = Math.max(-COIL.maxWave, Math.min(COIL.maxWave, -v * 0.035));
    const waving = spring(this.wave, target + 0, 260, 13, dt, 1e-3);
    this.wave.x = Math.max(-COIL.maxWave, Math.min(COIL.maxWave, this.wave.x));
    return pulling || waving || this.hold > 0 || moved !== 0;
  }
}
