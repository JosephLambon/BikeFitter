import { expect, test, type Page } from '@playwright/test';

/* Regressions for the exploded layout, the info-card rule, the build swaps, zoom and the phone
   layouts (AGENTS.md §5.1). */

/** Every point on the stage where two different pieces are drawn on top of each other. Parts in
    one unit (data-unit) count as one piece: the frame's tubes, and each wheel's tyre, rim,
    spokes, hub and valve. */
function overlaps(page: Page) {
  return page.evaluate(() => {
    const svg = document.querySelector('.bx-svg')!.getBoundingClientRect();
    const st = document.querySelector('[data-testid="stage"]')!.getBoundingClientRect();
    const top = Math.max(svg.top, st.top, 0), bottom = Math.min(svg.bottom, st.bottom, innerHeight);
    const left = Math.max(svg.left, st.left, 0), right = Math.min(svg.right, st.right, innerWidth);
    const bad = new Set<string>();
    for (let y = top + 1; y < bottom; y += 4) {
      for (let x = left + 1; x < right; x += 4) {
        const ids = new Set<string>();
        for (const el of document.elementsFromPoint(x, y)) {
          const g = el.closest<SVGGElement>('.bx-part:not(.is-leaving)');
          if (g) ids.add(g.dataset.unit!);
        }
        if (ids.size > 1) bad.add([...ids].sort().join(' + '));
      }
    }
    return [...bad];
  });
}

async function takeApart(page: Page) {
  await page.getByRole('button', { name: 'Take the bike apart' }).click();
  await expect(page.getByRole('slider', { name: 'How far apart the bike is' })).toHaveAttribute('aria-valuetext', 'Fully apart');
  await page.waitForTimeout(250);
}

test.describe('Exploded layout', () => {
  test('no two parts overlap when the bike is fully apart', async ({ page }) => {
    await page.goto('/bike');
    await takeApart(page);
    expect(await overlaps(page)).toEqual([]);
  });

  test('no two parts overlap for a different build either', async ({ page }) => {
    await page.goto('/bike');
    await page.getByRole('button', { name: /^Build/ }).click();
    for (const [o, c] of [['Gears', 'Electronic'], ['Brakes', 'Rim'], ['Rims', 'Deep'], ['Chainrings', 'One (1×)'], ['Mudguards', 'On']]) {
      await page.getByRole('radiogroup', { name: o }).getByRole('radio', { name: c }).click();
    }
    await page.getByRole('button', { name: /^Build/ }).click();
    await page.waitForTimeout(1500); // swaps and the rim spin settle
    await takeApart(page);
    expect(await overlaps(page)).toEqual([]);
  });
});

/** Selects each part in turn from the keyboard and calls `check` with its key. */
async function eachPart(page: Page, check: (key: string) => Promise<void>) {
  const n = await page.locator('.bx-part[role="button"]').count();
  await page.locator('.bx-part[role="button"][tabindex="0"]').focus();
  const seen = new Set<string>();
  for (let i = 0; i < n; i++) {
    if (i) await page.keyboard.press('ArrowRight');
    const key = await page.evaluate(() => document.activeElement!.getAttribute('data-part')!);
    await expect(page.locator(`.bx-part.is-active[data-part="${key}"]`).first()).toBeAttached();
    seen.add(key);
    await check(key);
  }
  expect(seen.size).toBe(n); // every part was checked
}

/** Is every copy of the part (one per fragment: a tyre on each wheel) under the card? */
const cardHidesPart = (page: Page, key: string) => page.evaluate((k) => {
  const card = document.querySelector('.bx-card')!.getBoundingClientRect();
  const byFrag = new Map<string, boolean>();
  for (const g of document.querySelectorAll<SVGGElement>(`.bx-part[data-part="${k}"]`)) {
    const r = g.getBoundingClientRect();
    const hit = card.left < r.right && card.right > r.left && card.top < r.bottom && card.bottom > r.top;
    byFrag.set(g.dataset.frag!, (byFrag.get(g.dataset.frag!) ?? false) || hit);
  }
  return [...byFrag.values()].every(Boolean);
}, key);

const viewBox = (page: Page) => page.locator('.bx-svg').getAttribute('viewBox');

test.describe('Info card rule', () => {
  /** Returns the parts the card hid completely. */
  async function hiddenParts(page: Page) {
    const hidden: string[] = [];
    await eachPart(page, async (key) => {
      await page.waitForTimeout(60); // the card is placed after selection
      if (await cardHidesPart(page, key)) hidden.push(key);
    });
    return hidden;
  }

  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    test(`never hides the selected part when the bike is together (${w}×${h})`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/bike');
      expect(await hiddenParts(page)).toEqual([]);
    });
  }

  test('never hides the selected part when the bike is apart', async ({ page }) => {
    await page.goto('/bike');
    await takeApart(page);
    expect(await hiddenParts(page)).toEqual([]);
  });

  test('selecting a part never zooms or moves the drawing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/bike');
    const before = await viewBox(page);
    await eachPart(page, async () => {
      await page.waitForTimeout(40);
      expect(await viewBox(page)).toBe(before);
    });
    await page.waitForTimeout(500);
    expect(await viewBox(page)).toBe(before);
  });

  // Between phone and desktop widths the card once docked into nothing and vanished.
  for (const w of [600, 640, 680, 720, 761, 780, 800, 840]) {
    test(`the card is on screen and readable at ${w} px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto('/bike');
      await page.getByRole('button', { name: 'Saddle, Contact points' }).focus();
      const card = page.getByRole('status');
      await expect(card).toContainText('Where you sit');
      await card.evaluate((el) => Promise.all(el.getAnimations().map((x) => x.finished))); // the card rises into place
      const c = (await card.boundingBox())!;
      expect(c.width).toBeGreaterThan(240);
      expect(c.height).toBeGreaterThan(120);
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x + c.width).toBeLessThanOrEqual(w);
      expect(c.y + c.height).toBeLessThanOrEqual(900);
      // Nothing clips it: every ancestor that clips its overflow contains the whole card.
      const clipped = await card.evaluate((el) => {
        const r = el.getBoundingClientRect(), out: string[] = [];
        for (let a = el.parentElement; a; a = a.parentElement) {
          const cs = getComputedStyle(a);
          if (cs.display === 'none' || cs.visibility === 'hidden') out.push('hidden ' + a.className);
          if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
          const b = a.getBoundingClientRect();
          if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1) out.push(a.className);
        }
        return out;
      });
      expect(clipped).toEqual([]);
    });
  }
});

test.describe('Build swaps', () => {
  test('changing rim depth spins the wheels without the bike jumping', async ({ page }) => {
    await page.goto('/bike');
    await page.getByRole('button', { name: /^Build/ }).click();
    await page.waitForTimeout(600);
    const before = await viewBox(page);
    await page.evaluate(() => {
      const w = window as unknown as { vbs: string[]; spins: number };
      w.vbs = []; w.spins = 0;
      const svg = document.querySelector('.bx-svg')!, t0 = performance.now();
      const tick = () => {
        w.vbs.push(svg.getAttribute('viewBox')!);
        w.spins = Math.max(w.spins, document.querySelectorAll('.bx-part[data-frag="tyre-f"] > .bx-swap').length
          && document.querySelector('.bx-part[data-frag="tyre-f"] > .bx-swap')!.getAnimations().length);
        if (performance.now() - t0 < 1400) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.getByRole('radiogroup', { name: 'Rims' }).getByRole('radio', { name: 'Deep' }).click();
    await page.waitForTimeout(1500);
    const { vbs, spins } = await page.evaluate(() => { const w = window as unknown as { vbs: string[]; spins: number }; return { vbs: w.vbs, spins: w.spins }; });
    expect(spins).toBeGreaterThan(0); // the wheels did spin
    expect(vbs.length).toBeGreaterThan(20);
    expect([...new Set(vbs)]).toEqual([before]); // and the view held still every frame
  });
});

test.describe('Zoom on desktop', () => {
  test('once zoomed, dragging with the mouse pans the drawing and selects nothing', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/bike');
    const b = (await page.locator('.bx-svg').boundingBox())!;
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    const whole = await viewBox(page);
    await page.mouse.move(cx, cy);
    await page.keyboard.down('Control');
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -60);
    await page.keyboard.up('Control');
    await expect(page.getByRole('button', { name: 'Reset zoom' })).toBeVisible();
    const zoomed = (await viewBox(page))!.split(' ').map(Number);
    expect(zoomed[2]).toBeLessThan(+whole!.split(' ')[2]);

    await page.mouse.move(b.x + 40, b.y + 40); // empty bench wall
    await page.mouse.down();
    await page.mouse.move(b.x + 140, b.y + 90, { steps: 8 });
    await page.mouse.up();
    const panned = (await viewBox(page))!.split(' ').map(Number);
    expect(panned[0]).toBeLessThan(zoomed[0]); // dragged right: the view moved left
    expect(panned[2]).toBe(zoomed[2]); // panning never changes the zoom
    // The drag pinned nothing: leaving the drawing clears the hover selection.
    await page.mouse.move(b.x + b.width / 2, b.y + b.height + 60);
    await expect(page.locator('.bx-part.is-active')).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe('Phone, portrait', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

  const viewBoxWidth = (page: Page) => page.locator('.bx-svg').evaluate((s) => +s.getAttribute('viewBox')!.split(' ')[2]);
  const noScroll = (page: Page) => page.evaluate(() => {
    const st = document.querySelector('[data-testid="stage"]') as HTMLElement;
    return {
      pageX: document.documentElement.scrollWidth <= innerWidth,
      stage: st.scrollWidth === st.clientWidth && st.scrollHeight === st.clientHeight,
      zoom: window.visualViewport ? window.visualViewport.scale : 1,
    };
  });

  test('title, stage in proportion to the bike, controls, then the panel with the cue and an invitation to turn the phone', async ({ page }) => {
    await page.goto('/bike');
    const title = (await page.locator('#bike-h').boundingBox())!;
    const stage = (await page.getByTestId('stage').boundingBox())!;
    const slider = (await page.getByRole('slider', { name: 'How far apart the bike is' }).boundingBox())!;
    const panel = (await page.getByTestId('panel').boundingBox())!;
    expect(stage.height / stage.width).toBeGreaterThan(0.6);
    expect(stage.height / stage.width).toBeLessThan(0.9);
    expect(title.y + title.height).toBeLessThanOrEqual(stage.y);
    expect(stage.y + stage.height).toBeLessThanOrEqual(slider.y);
    expect(slider.y + slider.height).toBeLessThanOrEqual(panel.y + 1);
    expect(panel.height).toBeGreaterThan(200); // room for the card
    await expect(page.getByTestId('panel').getByTestId('scroll-cue')).toBeVisible();
    await expect(page.getByTestId('rotate-invite')).toHaveText('Turn your phone sideways for a bigger bike.');
    expect(await noScroll(page)).toEqual({ pageX: true, stage: true, zoom: 1 });
  });

  test('pinching zooms the drawing only: no page zoom, no scroll, no scrollbars', async ({ page }) => {
    await page.goto('/bike');
    const cdp = await page.context().newCDPSession(page);
    const b = (await page.locator('.bx-svg').boundingBox())!;
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    const before = await viewBoxWidth(page), startY: number = await page.evaluate(() => window.scrollY);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', d: number) => cdp.send('Input.dispatchTouchEvent', {
      type, touchPoints: type === 'touchEnd' ? [] : [{ x: cx - d, y: cy, id: 1 }, { x: cx + d, y: cy, id: 2 }],
    });
    await touch('touchStart', 30);
    for (const d of [45, 60, 75, 90]) await touch('touchMove', d);
    await touch('touchEnd', 0);

    await expect.poll(() => viewBoxWidth(page)).toBeLessThan(before / 2);
    expect(await noScroll(page)).toEqual({ pageX: true, stage: true, zoom: 1 });
    expect(await page.evaluate(() => window.scrollY)).toBe(startY);

    await page.getByRole('button', { name: 'Reset zoom' }).tap();
    await expect.poll(() => viewBoxWidth(page)).toBe(before);
    await expect(page.getByRole('button', { name: 'Reset zoom' })).toHaveCount(0);
  });

  test('double-tapping zooms in, and again zooms back out', async ({ page }) => {
    await page.goto('/bike');
    const b = (await page.locator('.bx-svg').boundingBox())!;
    const before = await viewBoxWidth(page);
    const tap = () => page.touchscreen.tap(b.x + 20, b.y + 20); // empty bench wall, not a part
    await tap(); await tap();
    await expect.poll(() => viewBoxWidth(page)).toBeLessThan(before / 2);
    expect(await noScroll(page)).toEqual({ pageX: true, stage: true, zoom: 1 });
    await tap(); await tap();
    await expect.poll(() => viewBoxWidth(page)).toBe(before);
  });

  test('tapping a thin part selects it, and the card docks in the panel below the controls', async ({ page }) => {
    await page.goto('/bike');
    await page.getByRole('button', { name: 'Saddle, Contact points' }).tap();
    const card = page.getByRole('status');
    await expect(card).toContainText('Saddle');
    const c = (await card.boundingBox())!, stage = (await page.getByTestId('stage').boundingBox())!;
    expect(c.y).toBeGreaterThanOrEqual(stage.y + stage.height);
    expect(c.y).toBeLessThan(844);
    await expect(page.getByTestId('rotate-invite')).toHaveCount(0);
  });
});

test.describe('Phone, landscape', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

  test('the bike takes the left, the title and card a column on the right', async ({ page }) => {
    await page.goto('/bike');
    await expect(page.locator('[data-layout="landscape"]')).toBeAttached();
    await expect(page.getByTestId('rotate-invite')).toHaveCount(0);
    const stage = (await page.getByTestId('stage').boundingBox())!, title = (await page.locator('#bike-h').boundingBox())!;
    expect(title.x).toBeGreaterThanOrEqual(stage.x + stage.width);
    expect(stage.height).toBeGreaterThan(200);
    expect(stage.y + stage.height).toBeLessThanOrEqual(390);

    await page.getByRole('button', { name: 'Saddle, Contact points' }).tap();
    const c = (await page.getByRole('status').boundingBox())!;
    expect(c.x).toBeGreaterThanOrEqual(stage.x + stage.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});
