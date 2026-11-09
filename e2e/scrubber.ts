import { expect, type Page } from '@playwright/test';

/* Scrubber alignment checks shared by the coil (bike-layout.spec.ts) and cable
   (cable-scrubber.spec.ts) runs. */

/** Where the scrubber's end (the coil's or the cable's), its grip (the slider thumb) and the cable's nudge arrow sit, in
    page px. The grip and the arrow belong on the end, on the track's centre line. */
export function scrubberEnds(page: Page) {
  return page.evaluate(() => {
    const box = document.querySelector<HTMLElement>('[data-scrubber]')!;
    const svg = box.querySelector('svg')!;
    const path = svg.querySelector<SVGPathElement>('[data-end]') ?? svg.querySelector('path')!;
    const p = path.getPointAtLength(path.getTotalLength()).matrixTransform(svg.getScreenCTM()!);
    const mid = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    const t = box.querySelector('.MuiSlider-thumb')!.getBoundingClientRect();
    const nudge = box.querySelector('[data-testid="scrubber-nudge"]');
    const b = box.getBoundingClientRect();
    return { cable: { x: p.x, y: p.y }, grip: mid(t), nudge: nudge ? mid(nudge.getBoundingClientRect()) : null, centreY: b.top + b.height / 2 };
  });
}

export async function expectScrubberAligned(page: Page, { nudge = false } = {}) {
  const slider = page.getByRole('slider', { name: 'How far apart the bike is' });
  for (const v of [0, 40, 100]) {
    await slider.evaluate((el, n) => {
      const input = el as HTMLInputElement;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, String(n));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, v);
    await expect(slider).toHaveAttribute('aria-valuenow', String(v));
    const e = await scrubberEnds(page);
    expect(Math.abs(e.cable.y - e.centreY), `cable end on the centre line at ${v}%`).toBeLessThanOrEqual(1);
    expect(Math.abs(e.grip.y - e.cable.y), `grip level with the cable end at ${v}%`).toBeLessThanOrEqual(1);
    expect(Math.abs(e.grip.x - e.cable.x), `grip on the cable end at ${v}%`).toBeLessThanOrEqual(2);
    if (v === 0 && nudge) expect(e.nudge, 'the nudge arrow shows while together').not.toBeNull();
    if (v === 0 && e.nudge) {
      expect(Math.abs(e.nudge!.y - e.cable.y), 'nudge arrow level with the cable end').toBeLessThanOrEqual(1);
    }
  }
}
