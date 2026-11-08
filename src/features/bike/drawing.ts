/* Exploded-bike drawing: geometry and SVG path builders.
   Ported from designs/shared/bike.js (original BikeFitter artwork, drawn from first principles).
   Geometry is in millimetres (y up) with the bottom bracket centre at the origin, based on a
   mid-size endurance road bike: stack 570, reach 390, 73° head angle, 73.5° seat angle,
   410 mm chainstays, 172.5 mm cranks, 50/34 chainset, 11-34 cassette.
   Never change this geometry for styling: theme the drawing through the --bx-* tokens. */

export interface Pt { x: number; y: number }

/* ---------- maths ---------- */
const RAD = Math.PI / 180;
export const pt = (x: number, y: number): Pt => ({ x, y });
export const add = (a: Pt, b: Pt): Pt => pt(a.x + b.x, a.y + b.y);
export const sub = (a: Pt, b: Pt): Pt => pt(a.x - b.x, a.y - b.y);
export const mul = (a: Pt, k: number): Pt => pt(a.x * k, a.y * k);
const len = (a: Pt) => Math.sqrt(a.x * a.x + a.y * a.y);
export const unit = (a: Pt): Pt => { const l = len(a) || 1; return pt(a.x / l, a.y / l); };
export const perp = (a: Pt): Pt => pt(-a.y, a.x);
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
export const dir = (deg: number): Pt => pt(Math.cos(deg * RAD), Math.sin(deg * RAD));
export const along = (p: Pt, d: Pt, k: number): Pt => add(p, mul(d, k));
export const polar = (c: Pt, r: number, deg: number): Pt => along(c, dir(deg), r);
export const r1 = (v: number) => Math.round(v * 10) / 10;
/** To SVG space (y down). */
export const S = (p: Pt) => r1(p.x) + ' ' + r1(-p.y);

/* ---------- path builders ---------- */
export function capsule(a: Pt, b: Pt, wa: number, wb: number = wa): string {
  const n = perp(unit(sub(b, a))), ra = wa / 2, rb = wb / 2;
  return 'M' + S(along(a, n, ra)) + 'L' + S(along(b, n, rb)) +
    'A' + r1(rb) + ' ' + r1(rb) + ' 0 0 1 ' + S(along(b, n, -rb)) +
    'L' + S(along(a, n, -ra)) +
    'A' + r1(ra) + ' ' + r1(ra) + ' 0 0 1 ' + S(along(a, n, ra)) + 'Z';
}
export function slab(a: Pt, b: Pt, wa: number, wb: number = wa): string {
  const n = perp(unit(sub(b, a)));
  return 'M' + S(along(a, n, wa / 2)) + 'L' + S(along(b, n, wb / 2)) +
    'L' + S(along(b, n, -wb / 2)) + 'L' + S(along(a, n, -wa / 2)) + 'Z';
}
export function circle(c: Pt, r: number): string {
  return 'M' + S(pt(c.x - r, c.y)) + 'A' + r + ' ' + r + ' 0 1 0 ' + S(pt(c.x + r, c.y)) +
    'A' + r + ' ' + r + ' 0 1 0 ' + S(pt(c.x - r, c.y)) + 'Z';
}
export const annulus = (c: Pt, ro: number, ri: number) => circle(c, ro) + circle(c, ri);
export function sector(c: Pt, ri: number, ro: number, a1: number, a2: number): string {
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return 'M' + S(polar(c, ro, a1)) + 'A' + ro + ' ' + ro + ' 0 ' + large + ' 0 ' + S(polar(c, ro, a2)) +
    'L' + S(polar(c, ri, a2)) + 'A' + ri + ' ' + ri + ' 0 ' + large + ' 1 ' + S(polar(c, ri, a1)) + 'Z';
}
export const poly = (pts: Pt[]) => 'M' + pts.map(S).join('L') + 'Z';

/* ---------- element builders (static markup from our own constants, never user input) ---------- */
export const P = (d: string, cls: string, attrs = '') => '<path class="' + cls + '" d="' + d + '"' + attrs + '/>';
export const fillShape = (d: string, mat: string) => P(d, 'm-' + mat, ' fill-rule="evenodd"');
const LIGHT = unit(pt(-0.35, 1));
export function tube(a: Pt, b: Pt, wa: number, wb: number = wa, mat = 'frame'): string {
  const d = unit(sub(b, a));
  let n = perp(d);
  if (dot(n, LIGHT) < 0) n = mul(n, -1);
  const a2 = along(along(a, n, wa * 0.2), d, wa * 0.25), b2 = along(along(b, n, wb * 0.2), d, -wb * 0.25);
  return fillShape(capsule(a, b, wa, wb), mat) + P(capsule(a2, b2, wa * 0.2, wb * 0.2), 'hl m-' + mat + '-hi');
}
/** A stroked path with an outline drawn underneath (for bars, rails, chain). */
export function thick(d: string, w: number, mat: string, extra = ''): string {
  return '<path class="o" d="' + d + '" stroke-width="' + r1(w + 4.4) + '"/>' +
    '<path class="t-' + mat + '" d="' + d + '" stroke-width="' + w + '"' + extra + '/>';
}
export const hit = (d: string) => '<path class="hit" d="' + d + '"/>';

/* ---------- geometry ---------- */
export const BB = pt(0, 0);
export const RA = pt(-404, 70);                 // rear axle
export const FA = pt(590, 70);                  // front axle (45 mm fork offset)
export const HTT = pt(390, 570);                // head-tube top: stack 570, reach 390
export const sDown = dir(-73);
export const seatDir = dir(106.5);
export const fwd = dir(17);
export const AX = (l: number) => along(HTT, sDown, l);
export const ST = (l: number) => along(BB, seatDir, l);
export const STEM = AX(-50);
export const BAR = along(STEM, dir(11), 100);
export const TYRE_R = 339, RIM_R = 311;
/** Inner edge of the rim: shallow (the original drawing) and deep-section. */
export const RIM_IN = 276, RIM_IN_DEEP = 251;
export const GROUND = 70 - TYRE_R;
const CRANK_DEG = -32, CRANK_L = 172.5;
export const CRANK = CRANK_DEG;
export const PEDAL = polar(BB, CRANK_L, CRANK_DEG);
export const PEDAL_ND = polar(BB, CRANK_L, CRANK_DEG + 180);
export const RING = 101.1, RING_S = 68.7;
const COG = 34.4;
export const J1 = pt(-410, -24), J2 = pt(-396, -100), JR = 20;
export const B = (dx: number, dy: number) => add(BAR, pt(dx, dy));

/* ---------- chain (true tangent path around rings, jockey wheels and sprocket) ---------- */
interface Pulley { c: Pt; r: number; s: number }
function tangent(A: Pulley, Bc: Pulley): [Pt, Pt] {
  const D = sub(Bc.c, A.c), L = len(D), u = mul(D, 1 / L);
  const ra = A.s * A.r, rb = Bc.s * Bc.r, h = (rb - ra) / L, k = Math.sqrt(Math.max(0, 1 - h * h));
  const n = add(mul(u, h), mul(perp(u), k));
  return [sub(A.c, mul(n, ra)), sub(Bc.c, mul(n, rb))];
}
const ang = (c: Pt, p: Pt) => Math.atan2(p.y - c.y, p.x - c.x);
function arcPts(c: Pt, r: number, a0: number, a1: number, s: number): Pt[] {
  let da = a1 - a0;
  if (s > 0) { while (da <= 0) da += 2 * Math.PI; } else { while (da >= 0) da -= 2 * Math.PI; }
  const n = Math.max(2, Math.ceil(Math.abs(da) / 0.1)), out: Pt[] = [];
  for (let i = 1; i < n; i++) out.push(pt(c.x + r * Math.cos(a0 + da * i / n), c.y + r * Math.sin(a0 + da * i / n)));
  return out;
}
export function chainPath(): string {
  // Travel order: ring (clockwise) -> lower jockey (cw) -> upper jockey (anticlockwise) -> sprocket (cw)
  const C: Pulley[] = [{ c: BB, r: RING, s: -1 }, { c: J2, r: JR, s: -1 }, { c: J1, r: JR, s: 1 }, { c: RA, r: COG, s: -1 }];
  const segs = C.map((c, i) => tangent(c, C[(i + 1) % C.length]));
  let pts: Pt[] = [];
  C.forEach((c, i) => {
    const inP = segs[(i + C.length - 1) % C.length][1], outP = segs[i][0];
    pts.push(inP);
    pts = pts.concat(arcPts(c.c, c.r, ang(c.c, inP), ang(c.c, outP), c.s));
    pts.push(outP);
  });
  return 'M' + pts.map(S).join('L') + 'Z';
}

/* ---------- drawings ---------- */
export function teeth(c: Pt, r: number, count: number, w: number): string {
  const t = (2 * Math.PI * r) / count;
  return '<circle class="teeth" cx="' + r1(c.x) + '" cy="' + r1(-c.y) + '" r="' + r + '" stroke-width="' + w +
    '" stroke-dasharray="' + r1(t * 0.48) + ' ' + r1(t * 0.52) + '"/>';
}
function spokes(c: Pt, count: number, flange: number, rimIn: number): string {
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = (360 / count) * i, b = a + (i % 2 ? 1 : -1) * 18;
    d += 'M' + S(polar(c, flange, a)) + 'L' + S(polar(c, rimIn - 2, b));
  }
  return '<path class="m-spoke" d="' + d + '"/>';
}
function holes(c: Pt, r: number, count: number, size: number): string {
  let s = '';
  for (let i = 0; i < count; i++) s += P(circle(polar(c, r, i * 360 / count + 9), size), 'm-hole');
  return s;
}
export const draw = {
  tyre: (c: Pt) => fillShape(annulus(c, TYRE_R, RIM_R), 'dark') + P(annulus(c, TYRE_R - 7, TYRE_R - 9), 'hl m-dark-hi', ' fill-rule="evenodd"'),
  rim: (c: Pt, rimIn = RIM_IN) => fillShape(annulus(c, RIM_R, r1(rimIn)), 'dark') + P(annulus(c, RIM_R - 3, RIM_R - 7), 'hl m-dark-hi', ' fill-rule="evenodd"'),
  spokes: (c: Pt, rimIn = RIM_IN) => hit(annulus(c, r1(rimIn - 1), 92)) + spokes(c, 24, 24, rimIn),
  hub: (c: Pt, rear: boolean) => fillShape(circle(c, rear ? 34 : 28), 'metal') + fillShape(circle(c, rear ? 20 : 17), 'metal-hi'),
  valve: (c: Pt, deg: number, rimIn = RIM_IN) => {
    const a = polar(c, rimIn + 2, deg), b = polar(c, rimIn - 30, deg);
    return hit(capsule(a, b, 22)) + fillShape(capsule(a, b, 7), 'metal') + fillShape(capsule(polar(c, rimIn - 4, deg), polar(c, rimIn - 12, deg), 12), 'metal-hi');
  },
  thru: (c: Pt) => hit(circle(c, 16)) + fillShape(circle(c, 11), 'dark') + fillShape(circle(c, 5), 'metal-hi'),
  rotor: (c: Pt, r: number) => {
    let s = fillShape(annulus(c, r, r - 17), 'metal') + holes(c, r - 8.5, 18, 2.6);
    for (let i = 0; i < 6; i++) s += fillShape(capsule(polar(c, 16, i * 60 + 15), polar(c, r - 15, i * 60 + 35), 9, 7), 'metal-hi');
    return s + fillShape(circle(c, 18), 'dark');
  },
  /** A rim-brake calliper: mounted at `mount`, arms reaching to a pad on the rim's braking surface. */
  rimCalliper: (axle: Pt, mount: Pt) => {
    const u = unit(sub(mount, axle)), t = perp(u), pad = along(axle, u, RIM_R - 16);
    const arm = 'M' + S(along(mount, t, 22)) + 'C' + S(along(along(mount, t, 34), u, -24)) + ' ' + S(along(along(pad, t, 16), u, 30)) + ' ' + S(along(pad, t, 6));
    return hit(capsule(mount, pad, 70)) + thick(arm, 9, 'metal') +
      fillShape(capsule(along(pad, t, -14), along(pad, t, 14), 9), 'dark') +
      fillShape(capsule(along(mount, t, -18), along(mount, t, 24), 26, 22), 'metal') +
      fillShape(circle(mount, 6), 'metal-hi') + fillShape(capsule(along(mount, t, 20), along(along(mount, t, 30), u, 18), 8), 'dark');
  },
  /** A quick-release skewer: nut and cam lever at the hub. */
  qr: (c: Pt, deg: number) => hit(circle(c, 18)) + fillShape(capsule(c, polar(c, 52, deg), 13, 9), 'metal') + fillShape(circle(c, 12), 'metal-hi') + fillShape(circle(c, 4.5), 'dark'),
  /** A mudguard: a band just outside the tyre from angle a1 to a2, with a stay to the axle. */
  mudguard: (c: Pt, a1: number, a2: number, stay: number) =>
    fillShape(capsule(polar(c, 26, stay), polar(c, TYRE_R + 10, stay), 4.5), 'metal') +
    fillShape(sector(c, TYRE_R + 6, TYRE_R + 15, a1, a2), 'dark') + P(sector(c, TYRE_R + 11, TYRE_R + 13, a1 + 2, a2 - 2), 'hl m-dark-hi'),
  battery: (a: Pt, b: Pt) => fillShape(capsule(a, b, 18, 18), 'dark') + P(capsule(a, b, 6, 6), 'hl m-dark-hi'),
  calliper: (c: Pt, deg: number) => {
    const t = dir(deg + 90);
    return fillShape(capsule(along(c, t, -30), along(c, t, 30), 34, 30), 'dark') +
      fillShape(capsule(along(along(c, t, -18), dir(deg), 4), along(along(c, t, 18), dir(deg), 4), 10), 'dark-hi');
  },
};

/** Ground line and shadow under the assembled bike. */
/** The lowest point of the assembled drawing: the bottom of the ground shadow. */
export const REST_BOTTOM = -GROUND + 6 + 20;

export const groundMarkup = '<ellipse class="bx-shadow" cx="90" cy="' + (REST_BOTTOM - 20) + '" rx="820" ry="20"/>' +
  '<path class="bx-groundline" d="M-820 ' + (-GROUND) + 'H1000"/>';

/** The workbench the bike stands on: a worktop and the bench front below it. Drawn in the
   bike's own coordinates so the tyres always sit on the worktop, and drawn wide and deep so it
   runs to the edges of the stage, which clips it. */
const WORKTOP = 44;
/** How far below the ground the stage should always show (worktop plus some bench front). */
export const BENCH_BOTTOM = -GROUND + WORKTOP + 40;
export const benchMarkup = '<rect class="bx-bench-front" x="-6000" y="' + (-GROUND + WORKTOP) + '" width="12000" height="6000"/>' +
  '<rect class="bx-bench-top" x="-6000" y="' + (-GROUND) + '" width="12000" height="' + WORKTOP + '"/>';
