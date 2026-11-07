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
