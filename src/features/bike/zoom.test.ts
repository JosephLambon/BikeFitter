import { describe, expect, it } from 'vitest';
import { IDENTITY, MAX_ZOOM, panBy, zoomAt, zoomBetween, zoomViewBox } from './zoom';

const base: [number, number, number, number] = [0, 0, 400, 200];

describe('diagram zoom', () => {
  it('leaves the view alone at 1×', () => {
    expect(zoomViewBox(base, IDENTITY)).toEqual(base);
  });

  it('keeps the point under the fingers still while zooming in', () => {
    const z = zoomAt(IDENTITY, 2, 0.25, 0.5);
    const [x, y, w, h] = zoomViewBox(base, z);
    expect([w, h]).toEqual([200, 100]);
    // The point a quarter across and halfway down (100, 100) is still a quarter across and halfway down.
    expect(x + 0.25 * w).toBeCloseTo(100);
    expect(y + 0.5 * h).toBeCloseTo(100);
  });

  it('clamps the scale between 1× and the maximum', () => {
    expect(zoomAt(IDENTITY, 0.5, 0.5, 0.5).s).toBe(1);
    expect(zoomAt(IDENTITY, 99, 0.5, 0.5).s).toBe(MAX_ZOOM);
  });

  it('pans, but never past the edges of the drawing', () => {
    const z = zoomAt(IDENTITY, 2, 0.5, 0.5);
    expect(zoomViewBox(base, panBy(z, -10, 0))[0]).toBe(0);
    expect(zoomViewBox(base, panBy(z, 10, 0))[0]).toBe(200);
    expect(zoomViewBox(base, panBy(z, 0.1, 0))[0]).toBeCloseTo(120); // a tenth of the 200-wide view
  });

  it('follows the drawing when the base view changes (the bike comes apart)', () => {
    const z = zoomAt(IDENTITY, 2, 1, 1);
    expect(zoomViewBox([100, 100, 800, 400], z)).toEqual([500, 300, 400, 200]);
  });
});

describe('zooming back out', () => {
  const from = { s: 2.5, fx: 0.3, fy: 0.4 };
  it('starts where it was and ends at the whole drawing', () => {
    expect(zoomBetween(from, IDENTITY, 0)).toEqual(from);
    expect(zoomBetween(from, IDENTITY, 1)).toEqual(IDENTITY);
  });
  it('widens the view steadily, never past the whole drawing', () => {
    const widths = [0, 0.25, 0.5, 0.75, 1].map((k) => zoomViewBox(base, zoomBetween(from, IDENTITY, k))[2]);
    for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeGreaterThan(widths[i - 1]);
    expect(widths[2]).toBeCloseTo((400 / 2.5 + 400) / 2, 0); // halfway in width at halfway
  });
});
