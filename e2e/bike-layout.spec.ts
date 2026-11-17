import { expect, test, type Page } from '@playwright/test';
import { expectScrubberAligned } from './scrubber.js';
import { eachPart, takeApart, viewBox } from './bike.js';

/* Regressions for the exploded layout, the part label, the build swaps, zoom and the phone
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

test.describe('Part label (bikeLabel on)', () => {
  /** Waits for the window to finish fading in. */
  const settled = (page: Page) => page.getByTestId('part-label-window').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  /** The label window's box, its text, and every drawn part its band overlaps. */
  const read = (page: Page) => page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('[data-testid="part-label-window"]')!;
    const band = document.querySelector<HTMLElement>('[data-testid="part-label"]')!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const hits = new Set<string>();
    for (const g of document.querySelectorAll<SVGGElement>('.bx-part:not(.is-leaving)')) {
      const b = g.getBoundingClientRect();
      if (b.width && band.left < b.right && band.right > b.left && band.top < b.bottom && band.bottom > b.top) hits.add(g.dataset.part!);
    }
    return { box: [r.left, r.top, r.width, r.height].map(Math.round).join(' '), text: el.textContent!, hits: [...hits], align: getComputedStyle(el).textAlign };
  });

  test('is a white window with a 1 px Bike-amber hairline, in light and dark', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/bike');
      await page.getByRole('button', { name: 'Saddle, Contact points' }).click();
      const look = await page.getByTestId('part-label-window').evaluate((el) => {
        const root = getComputedStyle(document.documentElement), s = getComputedStyle(el);
        const probe = document.createElement('i');
        document.body.append(probe);
        probe.style.color = root.getPropertyValue('--bike'); const bike = getComputedStyle(probe).color;
        probe.style.color = root.getPropertyValue('--bg'); const bg = getComputedStyle(probe).color;
        probe.remove();
        return { fill: s.backgroundColor, bg, edge: s.boxShadow.startsWith(bike + ' 0px 0px 0px 1px inset') };
      });
      expect(look.fill, scheme).toBe(look.bg);
      expect(look.edge, `${scheme}: amber hairline`).toBe(true);
    }
  });

  for (const [w, h] of [[820, 900], [1280, 800], [1920, 1080]]) {
    test(`stays in one place above the bike, names every part there and never covers the drawing (${w}×${h})`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/bike');
      await expect(page.locator('.bx-card')).toHaveCount(0);
      await expect(page.getByTestId('part-label-window')).toBeHidden();
      await page.locator('.bx-part[role="button"][tabindex="0"]').focus();
      await expect(page.getByTestId('part-label-window')).toBeVisible();
      await settled(page);
      const first = await read(page);
      const vb = await viewBox(page);
      await eachPart(page, async (key) => {
        const name = await page.locator(`.bx-part[data-part="${key}"][role="button"]`).getAttribute('aria-label');
        await expect(page.getByTestId('part-label')).toContainText(name!.split(',')[0]);
        const now = await read(page);
        expect(now.box).toBe(first.box);
        expect(now.hits).toEqual([]);
        expect(now.align).toBe('center');
        expect(await viewBox(page)).toBe(vb);
      });
      const box = (await page.getByTestId('part-label').boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(w);
    });
  }

  test('never covers the drawing when the bike is apart', async ({ page }) => {
    await page.goto('/bike');
    await takeApart(page);
    await eachPart(page, async () => { expect((await read(page)).hits).toEqual([]); });
  });

  test('the window shows only while a part is hovered or picked, and hovering changes only the words', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/bike');
    const win = page.getByTestId('part-label-window');
    await expect(win).toBeHidden();
    await page.locator('.bx-part[data-part="saddle"]').first().hover();
    await expect(win).toBeVisible();
    await settled(page);
    const before = await read(page);
    await expect(page.getByTestId('part-label')).toContainText('Saddle');
    await expect(page.getByTestId('part-label')).toContainText('Where you sit');
    await page.locator('.bx-part[data-part="fork"]').first().hover();
    await expect(page.getByTestId('part-label')).toContainText('Fork');
    expect((await read(page)).box).toBe(before.box);
    await page.mouse.move(2, 2);
    await expect(win).toBeHidden();
    await page.locator('.bx-part[data-part="saddle"]').first().click();
    await page.mouse.move(2, 2);
    await expect(win).toBeVisible();
    await expect(win).toContainText('Saddle');
  });
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

test.describe('Reset zoom', () => {
  test('zooms back out with a short animation, not a jump', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/bike');
    const b = (await page.locator('.bx-svg').boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(300); // fonts and layout settle
    const whole = await viewBox(page);
    await page.keyboard.down('Control');
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -60);
    await page.keyboard.up('Control');
    const reset = page.getByRole('button', { name: 'Reset zoom' });
    await expect(reset).toBeVisible();
    const zoomedW = +(await viewBox(page))!.split(' ')[2];

    await page.evaluate(() => {
      const w = window as unknown as { frames: [number, number][] };
      w.frames = [];
      const svg = document.querySelector('.bx-svg')!, t0 = performance.now();
      const tick = () => {
        w.frames.push([performance.now() - t0, +svg.getAttribute('viewBox')!.split(' ')[2]]);
        if (performance.now() - t0 < 800) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    // A real mouse click: Playwright's click() can scroll the sticky reel, which explodes the bike.
    const rb = (await reset.boundingBox())!;
    await page.mouse.click(rb.x + rb.width / 2, rb.y + rb.height / 2);
    await expect(reset).toHaveCount(0); // the chip goes at once
    await page.waitForTimeout(850);
    const frames = await page.evaluate(() => (window as unknown as { frames: [number, number][] }).frames);
    const widths = frames.map(([, w]) => w);
    const wholeW = +whole!.split(' ')[2];
    const between = widths.filter((x) => x > zoomedW + 1 && x < wholeW - 1);
    expect(between.length).toBeGreaterThanOrEqual(3); // several frames in between: an animation
    for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1]); // only ever zooms out
    const first = frames.find(([, w]) => w > zoomedW + 1)!, last = frames.find(([, w]) => w >= wholeW - 0.1)!;
    expect(last).toBeDefined();
    expect(last[0] - first[0]).toBeLessThan(400); // and snappy
    expect(await viewBox(page)).toBe(whole);
  });

  test('is instant with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/bike');
    const b = (await page.locator('.bx-svg').boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(300); // fonts and layout settle
    const whole = await viewBox(page);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -120);
    await page.keyboard.up('Control');
    await page.getByRole('button', { name: 'Reset zoom' }).click();
    expect(await viewBox(page)).toBe(whole);
  });
});

/** Long enough to see an invitation from any moment: its interval (INVITE.every, 4 s) plus a tug. */
const INVITE_WAIT = 5200;

/** The biggest sideways shift of the grip from its resting place over `ms`, in px. */
function gripTravel(page: Page, ms: number) {
  return page.evaluate((span) => new Promise<number>((done) => {
    const thumb = document.querySelector<HTMLElement>('[data-scrubber] .MuiSlider-thumb')!;
    let most = 0;
    const t0 = performance.now();
    const look = () => {
      most = Math.max(most, Math.abs(parseFloat(getComputedStyle(thumb).marginLeft) || 0));
      if (performance.now() - t0 < span) requestAnimationFrame(look); else done(most);
    };
    requestAnimationFrame(look);
  }), ms);
}

test.describe('Explode scrubber', () => {
  test('the grip sits on the coil’s end, level with it, on a desktop', async ({ page }) => {
    await page.goto('/bike');
    await expect(page.locator('[data-scrubber="coil"]')).toBeAttached();
    await expectScrubberAligned(page);
  });

  test('the coil tugs every few seconds until it is first moved, then stays still', async ({ page }) => {
    await page.goto('/bike');
    const coil = page.locator('[data-scrubber="coil"]');
    await expect(coil).toHaveAttribute('data-invite', 'on');
    const tug = await gripTravel(page, 2000); // the first tug comes soon after the page opens
    expect(tug, 'pulls out a little').toBeGreaterThan(3);
    expect(tug, 'only a little (8 px with a mouse)').toBeLessThanOrEqual(10);
    const before = await page.evaluate(() => scrollY);
    await page.getByRole('slider', { name: 'How far apart the bike is' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(coil).toHaveAttribute('data-invite', 'off');
    await page.waitForTimeout(800); // a tug under way settles
    expect(await gripTravel(page, INVITE_WAIT)).toBe(0);
    expect(await page.evaluate(() => scrollY)).toBe(before);
  });

  test('never tugs with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/bike');
    await expect(page.locator('[data-scrubber="coil"]')).toHaveAttribute('data-invite', 'off');
    expect(await gripTravel(page, INVITE_WAIT)).toBe(0);
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

  const box = async (page: Page, id: string) => (await page.getByTestId(id).boundingBox())!;

  for (const [w, h] of [[390, 844], [375, 667]] as const) {
    test(`title, then the bike centred between it and the label's space, then the dock (${w}×${h})`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/bike');
      await expect(page.locator('[data-layout="thumb"]')).toBeAttached();
      await expect(page.getByTestId('drawer')).toHaveCount(0);
      const title = (await page.locator('#bike-h').boundingBox())!;
      const wall = await box(page, 'wall'), stage = await box(page, 'stage'), slot = await box(page, 'label-slot'), dock = await box(page, 'dock');
      expect(title.y + title.height).toBeLessThanOrEqual(wall.y);
      expect(stage.height / stage.width).toBeCloseTo(0.75, 1);
      // Equal space above and below what you see: the top of the bike and the bottom of the bench.
      const drawn = await page.evaluate(() => {
        let top = Infinity, bottom = -Infinity;
        for (const el of document.querySelectorAll('.bx-part, .bx-bench')) {
          const r = el.getBoundingClientRect();
          if (r.height) { top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom); }
        }
        return { top, bottom };
      });
      const above = drawn.top - wall.y, below = slot.y - drawn.bottom;
      expect(Math.abs(above - below), `above ${above}, below ${below}`).toBeLessThanOrEqual(2);
      expect(above).toBeGreaterThan(16);
      expect(stage.y).toBeGreaterThanOrEqual(wall.y);
      expect(stage.y + stage.height).toBeLessThanOrEqual(slot.y);
      expect(Math.abs(slot.y + slot.height - dock.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(dock.y + dock.height - h)).toBeLessThanOrEqual(1);
      await expect(page.getByTestId('part-hint')).toBeInViewport();
      await expect(page.getByTestId('part-label-window')).toBeHidden();
      await expect(page.getByTestId('scroll-cue')).toHaveCount(0);
      expect(await noScroll(page)).toEqual({ pageX: true, stage: true, zoom: 1 });
    });
  }

  test('picking a part shows its label just above the dock, without moving the bike; picking it again lets it go', async ({ page }) => {
    await page.goto('/bike');
    const stage = await box(page, 'stage'), dock = await box(page, 'dock');
    await page.getByRole('button', { name: 'Saddle, Contact points' }).tap();
    const win = page.getByTestId('part-label-window');
    await expect(win).toBeVisible();
    await expect(win).toContainText('Saddle');
    await win.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const l = (await win.boundingBox())!;
    expect(l.y).toBeGreaterThanOrEqual(stage.y + stage.height); // never over the drawing
    expect(l.y + l.height).toBeLessThanOrEqual(dock.y);
    expect(l.height).toBeCloseTo(104, 0);
    expect(await win.evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true); // nothing cut off
    await expect(page.locator('.bx-card')).toHaveCount(0);
    expect(await box(page, 'stage')).toEqual(stage);
    await page.getByRole('button', { name: 'Saddle, Contact points' }).tap();
    await expect(win).toBeHidden();
    await expect(page.getByTestId('part-hint')).toBeInViewport();
    expect(await box(page, 'stage')).toEqual(stage);
  });

  test('every part’s name and description fit the label on a short phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/bike');
    const parts = page.locator('.bx-part[role="button"]');
    await parts.first().focus();
    const seen = new Set<string>();
    for (let k = 0; k < 80; k++) {
      const name = (await page.getByTestId('part-label-window').locator('h3').textContent())!;
      if (seen.has(name)) break;
      seen.add(name);
      expect(await page.getByTestId('part-label-window').evaluate((el) => el.scrollHeight <= el.clientHeight), name).toBe(true);
      await page.keyboard.press('ArrowRight');
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  test('in the dock, the grip sits on the coil’s end, level with it', async ({ page }) => {
    await page.goto('/bike');
    await expectScrubberAligned(page);
  });

  test('in the dock, the coil keeps tugging through a stray touch, and stops once a thumb moves it', async ({ page }) => {
    await page.goto('/bike');
    const box = (await page.locator('[data-scrubber="coil"]').boundingBox())!;
    // A thumb landing on the dock to scroll or swipe: pointerdown, no change.
    await page.locator('[data-scrubber="coil"]').dispatchEvent('pointerdown', { pointerType: 'touch' });
    await expect(page.locator('[data-scrubber="coil"]')).toHaveAttribute('data-invite', 'on');
    // Touch screens pull further (12 px, not 8), so it reads at a phone's smaller pixels.
    expect(await gripTravel(page, INVITE_WAIT)).toBeGreaterThan(10);
    await page.touchscreen.tap(box.x + box.width - 30, box.y + box.height / 2);
    await expect(page.locator('[data-scrubber="coil"]')).toHaveAttribute('data-invite', 'off');
    await page.waitForTimeout(800);
    expect(await gripTravel(page, INVITE_WAIT)).toBe(0);
  });

  test('the coil tugs on every 4 s beat, even when frames are stamped before the timer that woke them (a busy phone)', async ({ page }) => {
    test.setTimeout(30_000);
    // Chrome stamps each frame with the time it began; under load, a timer often runs after a
    // frame has begun, so the frame it asks for is stamped before it asked. Make every frame so.
    await page.addInitScript(() => {
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => raf((t) => cb(Math.min(t, performance.now()) - 20));
    });
    await page.goto('/bike');
    const starts = await page.evaluate(() => new Promise<number[]>((done) => {
      const seen: number[] = [], t0 = performance.now();
      let on = false;
      const look = () => {
        const box = document.querySelector<HTMLElement>('[data-scrubber="coil"]');
        const v = Math.abs(parseFloat(box?.style.getPropertyValue('--tug') ?? '') || 0);
        if (v > 4 && !on) { on = true; seen.push(performance.now() - t0); }
        if (v < 0.5) on = false;
        if (performance.now() - t0 < 13_500) setTimeout(look, 8); else done(seen);
      };
      look();
    }));
    expect(starts.length, `tugs at ${starts.map(Math.round)}`).toBeGreaterThanOrEqual(3);
    for (let k = 1; k < starts.length; k++) expect(Math.abs(starts[k] - starts[k - 1] - 4000)).toBeLessThan(250);
  });

  test('once moved, the coil stays still when the phone turns and turns back', async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto('/bike');
    const coil = page.locator('[data-scrubber="coil"]');
    const box = (await coil.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width - 30, box.y + box.height / 2);
    await expect(coil).toHaveAttribute('data-invite', 'off');
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator('[data-layout="landscape"]')).toBeAttached();
    await expect(coil).toHaveAttribute('data-invite', 'off');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('[data-layout="thumb"]')).toBeAttached();
    await expect(coil).toHaveAttribute('data-invite', 'off');
    expect(await gripTravel(page, INVITE_WAIT)).toBe(0);
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

  test('scrolling never takes the bike apart: only the button and slider do', async ({ page }) => {
    await page.goto('/bike');
    await page.evaluate(() => { window.scrollTo(0, 2000); window.dispatchEvent(new Event('scroll')); });
    await page.waitForTimeout(100);
    await expect(page.getByRole('slider', { name: 'How far apart the bike is' })).toHaveAttribute('aria-valuetext', 'Together');
  });
});

test.describe('Phone, landscape', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

  test('the grip sits on the coil’s end, level with it', async ({ page }) => {
    await page.goto('/bike');
    await expectScrubberAligned(page);
  });

  test('scrolling never takes the bike apart, and there is no scroll cue', async ({ page }) => {
    await page.goto('/bike');
    await page.evaluate(() => { window.scrollTo(0, 2000); window.dispatchEvent(new Event('scroll')); });
    await page.waitForTimeout(100);
    await expect(page.getByRole('slider', { name: 'How far apart the bike is' })).toHaveAttribute('aria-valuetext', 'Together');
    await expect(page.getByTestId('scroll-cue')).toHaveCount(0);
  });

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

test.describe('Phone, portrait: the build tray with the label at the thumb', () => {
  test.use({ hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const box = async (page: Page, id: string) => (await page.getByTestId(id).boundingBox())!;

  for (const [w, h, reduced] of [[390, 844, false], [390, 664, false], [375, 667, false], [375, 667, true]] as const) {
    test(`opens between the bike and the dock, never over the bike, and hides the label, at ${w}×${h}${reduced ? ', reduced motion' : ''}`, async ({ page }) => {
      if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/bike');
      const stage = await box(page, 'stage'), dock = await box(page, 'dock');
      expect(dock.y + dock.height, 'the dock is on screen').toBeLessThanOrEqual(h);
      await page.getByRole('button', { name: 'Saddle, Contact points' }).tap();
      await expect(page.getByTestId('part-label-window')).toBeVisible();
      await page.getByRole('button', { name: /^Build/ }).click();
      await expect(page.getByTestId('build-tray')).toHaveAttribute('data-open', 'true');
      await expect(page.getByTestId('part-label-window')).toBeHidden();
      await page.waitForTimeout(600);
      const tray = await box(page, 'build-tray');
      expect(await box(page, 'stage'), 'the bike never moves').toEqual(stage);
      expect(tray.y, 'tray starts below the bike').toBeGreaterThanOrEqual(stage.y + stage.height - 1);
      expect(tray.y + tray.height, 'tray ends above the dock').toBeLessThanOrEqual((await box(page, 'dock')).y + 1);
      for (const name of ['Gears', 'Brakes']) {
        const r = (await page.getByTestId('build-tray').locator('[data-changed]').filter({ hasText: name }).boundingBox())!;
        expect(r.y + r.height, `${name} fits without scrolling`).toBeLessThanOrEqual(tray.y + tray.height + 1);
      }
      const last = page.getByTestId('build-tray').getByText('Mudguards');
      await last.scrollIntoViewIfNeeded();
      const l = (await last.boundingBox())!;
      expect(l.y + l.height).toBeLessThanOrEqual(tray.y + tray.height + 1);
      expect(await page.evaluate(() => scrollY)).toBe(0);
      await page.getByRole('button', { name: /^Build/ }).click();
      await expect(page.getByTestId('part-label-window')).toBeVisible();
    });
  }
});
