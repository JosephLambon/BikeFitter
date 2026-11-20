import { expect, type Page } from '@playwright/test';

/* Scrubber alignment checks for the coil scrubber (bike-layout.spec.ts). */

/** Where the coil's end and its grip (the slider thumb) sit, in page px. The grip belongs on
    the end, on the track's centre line. */
export function scrubberEnds(page: Page) {
  return page.evaluate(() => {
    const box = document.querySelector<HTMLElement>('[data-scrubber]')!;
    const svg = box.querySelector('svg')!;
    const path = svg.querySelector<SVGPathElement>('[data-end]') ?? svg.querySelector('path')!;
    const p = path.getPointAtLength(path.getTotalLength()).matrixTransform(svg.getScreenCTM()!);
    const mid = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    const t = box.querySelector('.MuiSlider-thumb')!.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    return { end: { x: p.x, y: p.y }, grip: mid(t), centreY: b.top + b.height / 2 };
  });
}

export async function expectScrubberAligned(page: Page) {
  const slider = page.getByRole('slider', { name: 'How far apart the bike is' });
  for (const v of [0, 40, 100]) {
    await slider.evaluate((el, n) => {
      const input = el as HTMLInputElement;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, String(n));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, v);
    await expect(slider).toHaveAttribute('aria-valuenow', String(v));
    const e = await scrubberEnds(page);
    expect(Math.abs(e.end.y - e.centreY), `coil end on the centre line at ${v}%`).toBeLessThanOrEqual(1);
    expect(Math.abs(e.grip.y - e.end.y), `grip level with the coil end at ${v}%`).toBeLessThanOrEqual(1);
    expect(Math.abs(e.grip.x - e.end.x), `grip on the coil end at ${v}%`).toBeLessThanOrEqual(2);
  }
}
