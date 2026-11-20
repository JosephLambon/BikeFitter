import { describe, expect, it } from 'vitest';
import { caughtUp, explodeOffset, fitViewBox, headBlend, reelProgress, sliderText, tuckProgress } from './explode';

describe('explodeOffset', () => {
  const part = { v: [100, 200] as [number, number], w: [0.2, 0.6] as [number, number] };
  it.each([
    [0, 0, 0],
    [0.2, 0, 0], // window not started
    [0.4, 50, -100], // halfway through the window, eased to exactly half; y flips into SVG space
    [0.6, 100, -200],
    [1, 100, -200], // clamps after the window
  ])('at progress %s moves by (%s, %s)', (p, x, y) => {
    expect(explodeOffset(part, p)).toEqual({ x, y });
  });
  it('eases in, so a quarter of the window moves less than a quarter of the way', () => {
    expect(explodeOffset(part, 0.3).x).toBeLessThan(25);
  });
});

describe('fitViewBox', () => {
  it('pads the drawing and widens it to the stage aspect ratio', () => {
    const [x, y, w, h] = fitViewBox({ x: 0, y: 0, width: 100, height: 100 }, 0, 2)!;
    expect(h).toBe(148); // 24 px padding top and bottom
    expect(w).toBe(296);
    expect(x).toBe(-98);
    expect(y).toBe(-24);
  });
  it('heightens a wide drawing to fit a tall stage', () => {
    const [, y, w, h] = fitViewBox({ x: 0, y: 0, width: 400, height: 100 }, 0, 1)!;
    expect(w).toBe(448);
    expect(h).toBe(448);
    expect(y).toBe(-174);
  });
  it('puts the extra height above the drawing when anchored to the bottom', () => {
    const [, y, , h] = fitViewBox({ x: 0, y: 0, width: 400, height: 100 }, 0, 1, true)!;
    expect(h).toBe(448);
    expect(y + h).toBe(124); // bottom edge stays 24 px below the drawing
  });
  it('adds more room as the bike comes apart', () => {
    expect(fitViewBox({ x: 0, y: 0, width: 100, height: 100 }, 1, 1)![2]).toBe(220);
  });
  it('returns null for an empty drawing', () => {
    expect(fitViewBox({ x: 0, y: 0, width: 0, height: 0 }, 0, 1)).toBeNull();
  });
});

describe('reelProgress', () => {
  // Reel 3000 px tall from y = 0, viewport 1000 px: 2000 px of travel.
  it.each([
    [0, 0],
    [200, 0], // first 10% of travel holds the bike together
    [900, 0.5],
    [1600, 1],
    [2000, 1], // last 20% holds it apart
  ])('scrollY %s gives %s', (y, p) => {
    expect(reelProgress(y, 0, 3000, 1000, 0.3)).toBeCloseTo(p);
  });
  it('keeps the current progress when the reel cannot scroll', () => {
    expect(reelProgress(0, 0, 800, 1000, 0.3)).toBe(0.3);
  });
});

describe('tuckProgress', () => {
  // Reel 3000 px tall from y = 0, viewport 1000 px: 2000 px of travel.
  it.each([
    [0, 0],
    [1100, 0], // the heading stays while the bike comes apart (55% of travel)
    [1400, 0.5], // halfway through the tuck, eased
    [1700, 1], // gone by 85% of travel
    [2000, 1],
  ])('scrollY %s gives %s', (y, t) => {
    expect(tuckProgress(y, 0, 3000, 1000)).toBeCloseTo(t);
  });
  it('eases in, so the first stretch moves less than its share', () => {
    expect(tuckProgress(1160, 0, 3000, 1000)).toBeLessThan(0.1);
  });
  it('stays put when the reel cannot scroll', () => {
    expect(tuckProgress(500, 0, 800, 1000)).toBe(0);
  });
});

describe('caughtUp', () => {
  it('is true once scroll crosses the bike’s current state', () => {
    expect(caughtUp(0.6, 0.4, 0.5)).toBe(true);
    expect(caughtUp(0.4, 0.6, 0.5)).toBe(true);
  });
  it('is true when scroll lands exactly on it', () => {
    expect(caughtUp(0.5, 0.2, 0.5)).toBe(true);
  });
  it('is false while scroll is still on one side', () => {
    expect(caughtUp(0.2, 0.3, 0.5)).toBe(false);
    expect(caughtUp(0.9, 0.8, 0.5)).toBe(false);
  });
});

describe('headBlend', () => {
  it.each([[0, 0], [0.02, 0], [0.11, 0.5], [0.2, 1], [1, 1]])('progress %s blends %s', (p, t) => {
    expect(headBlend(p, false)).toBeCloseTo(t);
  });
  it('never crossfades with reduced motion', () => {
    expect(headBlend(1, true)).toBe(0);
  });
});

describe('sliderText', () => {
  it.each([[0, 'Together'], [0.005, 'Together'], [0.42, '42% apart'], [1, 'Fully apart']])('%s reads "%s"', (p, t) => {
    expect(sliderText(p)).toBe(t);
  });
});
