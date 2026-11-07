import { describe, expect, it } from 'vitest';
import { cablePath, MIN_SPAN, PAD, span } from './scrubber';

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
