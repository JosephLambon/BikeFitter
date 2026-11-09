import { describe, expect, it } from 'vitest';
import { cablePath, COIL, CoilMotion, coilPaths, INVITE, MIN_SPAN, nextTug, PAD, span } from './scrubber';

const W = 400, H = 56;
const pts = (d: string) => [...d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));

describe('span', () => {
  it('runs from bunched up to the full track', () => {
    expect(span(0, W)).toMatchObject({ x0: PAD, len: MIN_SPAN });
    expect(span(1, W).x1).toBe(W - PAD);
    expect(span(2, W).x1).toBe(W - PAD); // clamps
  });
});

describe('cablePath', () => {
  it('loops while slack and pulls straight when apart', () => {
    const slack = pts(cablePath(0, W, H).d).map((p) => p.y);
    expect(Math.max(...slack) - Math.min(...slack)).toBeGreaterThan(20);
    expect(new Set(pts(cablePath(1, W, H).d).map((p) => p.y))).toEqual(new Set([H / 2]));
  });

  it.each([0, 0.3, 1])('keeps both ends on the centre line and inside the span at %s', (p) => {
    const { x0, x1 } = span(p, W);
    const ps = pts(cablePath(p, W, H).d);
    const last = ps[ps.length - 1];
    expect(ps[0]).toEqual({ x: x0, y: H / 2 });
    expect(last.x).toBeCloseTo(x1, 1);
    expect(last.y).toBe(H / 2);
    for (const q of ps) {
      expect(q.x).toBeGreaterThanOrEqual(x0);
      expect(q.x).toBeLessThanOrEqual(x1 + 0.05);
      expect(Math.abs(q.y - H / 2)).toBeLessThanOrEqual(14);
    }
  });
});

describe('coilPaths', () => {
  const all = (c: ReturnType<typeof coilPaths>) => [...pts(c.back), ...pts(c.front)];

  it.each([[0, 0], [0.4, 0], [1, 0], [0, INVITE.pull], [1, -INVITE.pull]])('runs from the anchor to the grip on the centre line at %s (tug %s px)', (p, tug) => {
    const c = coilPaths(p, W, H, { tug });
    expect(c.x1).toBeCloseTo(span(p, W).x1 + tug, 5);
    const xs = all(c).map((q) => q.x);
    expect(Math.min(...xs)).toBeCloseTo(COIL.x0, 0);
    const tang = pts(c.tang);
    expect(tang[tang.length - 1]).toEqual({ x: Math.round(c.x1 * 10) / 10, y: H / 2 });
    for (const q of all(c)) {
      expect(q.x).toBeLessThanOrEqual(c.x1);
      expect(Math.abs(q.y - H / 2)).toBeLessThanOrEqual(COIL.radius);
    }
  });

  it('draws every turn in front and behind', () => {
    const c = coilPaths(0.5, W, H);
    const turns = (d: string) => (d.match(/M/g) ?? []).length;
    expect(turns(c.front)).toBeGreaterThanOrEqual(COIL.turns);
    expect(turns(c.back)).toBeGreaterThanOrEqual(COIL.turns);
  });

  it('lets a wave shift the middle coils but never the ends', () => {
    const still = all(coilPaths(0.5, W, H)), waved = all(coilPaths(0.5, W, H, { wave: 0.1 }));
    const xs = (q: { x: number }[]) => q.map((r) => r.x);
    expect(Math.max(...xs(waved))).toBeCloseTo(Math.max(...xs(still)), 0);
    expect(Math.min(...xs(waved))).toBeCloseTo(Math.min(...xs(still)), 0);
    expect(xs(waved)).not.toEqual(xs(still));
  });
});

describe('CoilMotion', () => {
  const run = (m: CoilMotion, secs: number, p: (t: number) => number = () => 0.3) => {
    const seen: { tug: number; wave: number; busy: boolean }[] = [];
    for (let t = 0; t < secs; t += 1 / 60) { const busy = m.step(1 / 60, p(t), 300); seen.push({ tug: m.tug.x, wave: m.wave.x, busy }); }
    return seen;
  };

  it('is still until something moves', () => {
    const m = new CoilMotion();
    expect(run(m, 0.5).every((f) => !f.busy && f.tug === 0 && f.wave === 0)).toBe(true);
    expect(m.step(0, 0.3, 300)).toBe(false); // a zero-length frame changes nothing
  });

  it('keeps a tug alive through a frame with no time in it, so the frame loop never stops before it plays', () => {
    // Chrome stamps a frame with the time it began, which can be before the timer that asked
    // for it ran: the first frame after a tug can arrive with no time, or less than none.
    const m = new CoilMotion();
    m.kick(1);
    expect(m.step(0, 0.3, 300)).toBe(true);
    expect(m.step(-0.004, 0.3, 300)).toBe(true);
    expect(m.tug.x).toBe(0); // nothing moved yet
    expect(Math.max(...run(m, 1).map((f) => f.tug))).toBeGreaterThan(INVITE.pull * 0.6);
  });

  it.each([0.14, 0.2, 0.25])('still plays a tug whose first frame is slow (%s s, longer than the hold)', (dt) => {
    // A busy phone: the frame after the tug's timer arrives late. The pull must happen within
    // that frame, not be spent waiting out the hold, or the loop stops and the beat is lost.
    const m = new CoilMotion();
    m.kick(1);
    expect(m.step(dt, 0.3, 300)).toBe(true);
    expect(Math.abs(m.tug.x)).toBeGreaterThan(0.5);
  });

  it.each([1, -1])('a tug pulls out slightly in direction %s, springs back past rest, then settles', (dir) => {
    const m = new CoilMotion();
    m.kick(dir);
    const seen = run(m, 1);
    const peak = Math.max(...seen.map((f) => f.tug * dir));
    expect(peak).toBeGreaterThan(INVITE.pull * 0.6);
    expect(peak).toBeLessThanOrEqual(INVITE.pull * 1.3);
    expect(Math.min(...seen.map((f) => f.tug * dir))).toBeLessThan(0); // the wobble: it overshoots rest
    expect(seen.some((f) => f.wave !== 0)).toBe(true); // and the coils ripple with it
    const end = seen[seen.length - 1];
    expect(end).toEqual({ tug: 0, wave: 0, busy: false });
  });

  it('pulls as far as asked: further on touch screens, where pixels are smaller', () => {
    const m = new CoilMotion();
    m.kick(1, INVITE.touchPull);
    const peak = Math.max(...run(m, 1).map((f) => f.tug));
    expect(peak).toBeGreaterThan(INVITE.touchPull * 0.6);
    expect(peak).toBeGreaterThan(INVITE.pull * 1.1);
  });

  it('ripples the coils against a fast pull, within bounds, and settles once it stops', () => {
    const m = new CoilMotion();
    const seen = run(m, 1.2, (t) => Math.min(1, t * 4));
    const moving = seen.slice(5, 14).map((f) => f.wave);
    expect(Math.max(...moving)).toBeLessThan(0); // middle coils lag behind a grip moving right
    expect(Math.min(...seen.map((f) => f.wave))).toBeGreaterThanOrEqual(-COIL.maxWave);
    expect(seen[seen.length - 1]).toEqual({ tug: 0, wave: 0, busy: false });
  });
});

describe('nextTug', () => {
  it('keeps the invitation on one beat: first after INVITE.first, then every INVITE.every, from when it began', () => {
    expect(nextTug(0, 0)).toBe(INVITE.first);
    expect(nextTug(500, 0)).toBe(INVITE.first);
    expect(nextTug(INVITE.first, 0)).toBe(INVITE.first + INVITE.every); // strictly after
    expect(nextTug(INVITE.first + 1, 0)).toBe(INVITE.first + INVITE.every);
    expect(nextTug(10_000, 1000)).toBe(1000 + INVITE.first + 2 * INVITE.every);
    // A late timer, or a scrubber mounted again part-way through, rejoins the same beat.
    expect(nextTug(1000 + INVITE.first + 2 * INVITE.every + 3999, 1000)).toBe(1000 + INVITE.first + 3 * INVITE.every);
  });
});
