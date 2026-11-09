import { expect, test, type Page } from '@playwright/test';
import { expectScrubberAligned } from './scrubber.js';

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
      // The card, or (on phones) the drawer it scrolls in, is wholly on screen.
      const drawer = page.getByTestId('drawer');
      const box = (await drawer.count()) ? (await drawer.boundingBox())! : c;
      expect(box.y + box.height).toBeLessThanOrEqual(900);
      // Nothing clips it: every ancestor that clips its overflow contains the whole card.
      const clipped = await card.evaluate((el) => {
        const r = el.getBoundingClientRect(), out: string[] = [];
        for (let a = el.parentElement; a; a = a.parentElement) {
          const cs = getComputedStyle(a);
          if (cs.display === 'none' || cs.visibility === 'hidden') out.push('hidden ' + a.className);
          if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
          // In the phone drawer the card scrolls inside the drawer's own scroll box, by design.
          if (a.dataset.testid === 'card-slot' && cs.overflowY === 'auto') break;
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
  /** A thumb swipe on the drawer's grab handle: negative dy is up. */
  const swipeTab = async (page: Page, dy: number) => {
    const cdp = await page.context().newCDPSession(page);
    const t = (await page.getByTestId('drawer-tab').boundingBox())!;
    const x = t.x + t.width / 2, y = t.y + 10;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    for (let k = 1; k <= 5; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (dy * k) / 5, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  };
  const drawerHeight = async (page: Page) => (await page.getByTestId('drawer').boundingBox())!.height;
  const noScroll = (page: Page) => page.evaluate(() => {
    const st = document.querySelector('[data-testid="stage"]') as HTMLElement;
    return {
      pageX: document.documentElement.scrollWidth <= innerWidth,
      stage: st.scrollWidth === st.clientWidth && st.scrollHeight === st.clientHeight,
      zoom: window.visualViewport ? window.visualViewport.scale : 1,
    };
  });

  test('title on white, then the bench wall with the bike near the top, the drawer tab, and the dock along the bottom', async ({ page }) => {
    await page.goto('/bike');
    await expect(page.locator('[data-layout="drawer"]')).toBeAttached();
    const title = (await page.locator('#bike-h').boundingBox())!;
    const stage = (await page.getByTestId('stage').boundingBox())!;
    const dock = (await page.getByTestId('dock').boundingBox())!;
    const slider = (await page.getByRole('slider', { name: 'How far apart the bike is' }).boundingBox())!;
    expect(title.y + title.height).toBeLessThanOrEqual(stage.y);
    expect(stage.height / stage.width).toBeCloseTo(0.75, 1); // in the bike's proportions, not the leftover height
    const titleBg = await page.locator('#bike-h').evaluate((h) => getComputedStyle(h.parentElement!.parentElement!).backgroundColor);
    expect(titleBg).toBe('rgb(255, 255, 255)');
    expect(Math.abs(dock.y + dock.height - 844)).toBeLessThanOrEqual(1); // along the bottom of the screen
    expect(slider.y).toBeGreaterThanOrEqual(dock.y);
    // Open on load, on the guide, between the bike and the dock; no Show/Hide button.
    await expect(page.getByTestId('drawer')).toHaveAttribute('data-open', 'true');
    await expect(page.getByTestId('drawer-idle')).toBeInViewport();
    await expect(page.getByTestId('part-hint')).toContainText('Tap a part to learn more.');
    await expect(page.getByTestId('drawer').getByText(/^(Show|Hide)$/)).toHaveCount(0);
    await page.waitForTimeout(600);
    const d = (await page.getByTestId('drawer').boundingBox())!;
    expect(d.y).toBeGreaterThanOrEqual(stage.y + stage.height);
    expect(d.y + d.height).toBeLessThanOrEqual(dock.y);
    const guide = await page.getByTestId('drawer-idle').evaluate((g) => g.scrollHeight <= g.clientHeight);
    expect(guide).toBe(true); // the whole guide fits, nothing scrolls
    await expect(page.getByTestId('scroll-cue')).toHaveCount(0); // scroll does nothing on a phone
    await expect(page.getByTestId('rotate-invite')).toHaveCount(0);
    expect(await noScroll(page)).toEqual({ pageX: true, stage: true, zoom: 1 });
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
    await expect(page.locator('[data-layout="drawer"]')).toBeAttached();
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

  test('on a short phone the guide still fits the drawer, with nothing cut off', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/bike');
    await page.waitForTimeout(600);
    await expect(page.getByTestId('part-hint')).toBeInViewport();
    expect(await page.getByTestId('drawer-idle').evaluate((g) => g.scrollHeight <= g.clientHeight)).toBe(true);
    await expect(page.getByTestId('drawer-idle')).toContainText('Drag this panel down to hide it.');
  });

  test('tapping a thin part opens the drawer between the bike and the dock; a swipe down leaves a tab', async ({ page }) => {
    await page.goto('/bike');
    await page.getByRole('button', { name: 'Saddle, Contact points' }).tap();
    const card = page.getByRole('status');
    await expect(card).toContainText('Saddle');
    await expect(page.getByTestId('drawer')).toHaveAttribute('data-open', 'true');
    await page.waitForTimeout(600); // the drawer and stage settle
    // The card scrolls inside the drawer, which fits between the stage and the dock.
    const d = (await page.getByTestId('drawer').boundingBox())!, stage = (await page.getByTestId('stage').boundingBox())!, dock = (await page.getByTestId('dock').boundingBox())!;
    expect(d.y).toBeGreaterThanOrEqual(stage.y + stage.height); // never over the drawing
    expect(d.y + d.height).toBeLessThanOrEqual(dock.y);
    await expect(page.getByRole('button', { name: 'Take the bike apart' })).toBeInViewport();
    await expect(page.getByTestId('rotate-invite')).toHaveCount(0);

    const startY: number = await page.evaluate(() => window.scrollY);
    await swipeTab(page, 80);
    await expect(page.getByRole('button', { name: 'Show details: Saddle' })).toBeVisible();
    await expect.poll(() => drawerHeight(page)).toBeLessThan(70);
    expect(await page.evaluate(() => window.scrollY)).toBe(startY);
  });

  test('the tab moves only by the thumb: a tap on it does nothing', async ({ page }) => {
    await page.goto('/bike');
    await page.waitForTimeout(600);
    await page.getByTestId('drawer-tab').tap();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('drawer')).toHaveAttribute('data-open', 'true');
    await swipeTab(page, 80);
    await expect(page.getByTestId('drawer')).toHaveAttribute('data-open', 'false');
    await page.waitForTimeout(600);
    await page.getByTestId('drawer-tab').tap();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('drawer')).toHaveAttribute('data-open', 'false');
  });

  test('the bike never moves as the drawer opens and hides, and the drawing still zooms', async ({ page }) => {
    await page.goto('/bike');
    const before = await page.getByTestId('stage').boundingBox();
    await page.getByRole('button', { name: 'Saddle, Contact points' }).tap();
    await page.waitForTimeout(600);
    expect(await page.getByTestId('stage').boundingBox()).toEqual(before);
    await swipeTab(page, 80);
    await page.waitForTimeout(600);
    expect(await page.getByTestId('stage').boundingBox()).toEqual(before);
    const b = (await page.locator('.bx-svg').boundingBox())!;
    const whole = await viewBoxWidth(page);
    await page.touchscreen.tap(b.x + 20, b.y + 20); await page.touchscreen.tap(b.x + 20, b.y + 20);
    await expect.poll(() => viewBoxWidth(page)).toBeLessThan(whole / 2);
  });

  test('a thumb swipe on the tab hides the drawer, and a swipe up opens it, without scrolling the page', async ({ page }) => {
    await page.goto('/bike');
    await page.getByRole('button', { name: 'Saddle, Contact points' }).tap();
    await page.waitForTimeout(600); // the drawer settles before the thumb finds the tab
    const startY: number = await page.evaluate(() => window.scrollY);
    await swipeTab(page, 80);
    await expect(page.getByTestId('drawer')).toHaveAttribute('data-open', 'false');
    await page.waitForTimeout(600);
    await swipeTab(page, -80);
    await expect(page.getByTestId('drawer')).toHaveAttribute('data-open', 'true');
    await expect(page.getByRole('status')).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBe(startY);
  });

  test('with nothing selected, a swipe down hides the guide and a swipe up brings it back', async ({ page }) => {
    await page.goto('/bike');
    await page.waitForTimeout(600);
    await swipeTab(page, 80);
    await expect(page.getByTestId('drawer')).toHaveAttribute('data-open', 'false');
    await expect.poll(() => drawerHeight(page)).toBeLessThan(70);
    await swipeTab(page, -80);
    await expect(page.getByTestId('drawer')).toHaveAttribute('data-open', 'true');
    await expect(page.getByTestId('drawer-body').getByTestId('part-hint')).toBeInViewport();
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

test.describe('Phone, portrait: the build tray', () => {
  test.use({ hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const box = async (page: Page, id: string) => (await page.getByTestId(id).boundingBox())!;

  // iPhone 14 in browser dev tools, iPhone 14 with Safari's bars, iPhone SE.
  for (const [w, h] of [[390, 844], [390, 664], [375, 667]]) {
    test(`opens between the bike and the dock, never over the bike or the Part details tab, at ${w}×${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/bike');
      const stage = await box(page, 'stage'), dock = await box(page, 'dock');
      await page.getByRole('button', { name: /^Build/ }).click();
      await expect(page.getByTestId('build-tray')).toHaveAttribute('data-open', 'true');
      await page.waitForTimeout(600);
      const tray = await box(page, 'build-tray');
      const stage2 = await box(page, 'stage'), dock2 = await box(page, 'dock');
      expect(stage2, 'the bike never moves').toEqual(stage);
      expect(dock2.height, 'the dock never grows').toBeCloseTo(dock.height, 0);
      expect(tray.y, 'tray starts below the bike').toBeGreaterThanOrEqual(stage.y + stage.height - 1);
      if (h > 720) {
        const tab = await box(page, 'drawer-tab');
        expect(tray.y + tray.height, 'tray ends above the Part details tab').toBeLessThanOrEqual(tab.y + 1);
        expect(tab.y + tab.height, 'the tab stays above the dock').toBeLessThanOrEqual(dock2.y + 1);
        await expect(page.getByTestId('drawer-tab')).toBeInViewport({ ratio: 1 });
      } else {
        // Too short for both: the tab steps aside while the tray is open, and comes back after.
        await expect(page.getByTestId('drawer-tab')).toBeHidden();
        expect(tray.y + tray.height, 'tray ends above the dock').toBeLessThanOrEqual(dock2.y + 1);
      }
      // Room for at least two whole options before it scrolls.
      for (const name of ['Gears', 'Brakes']) {
        const r = (await page.getByTestId('build-tray').locator('[data-changed]').filter({ hasText: name }).boundingBox())!;
        expect(r.y + r.height, `${name} fits without scrolling`).toBeLessThanOrEqual(tray.y + tray.height + 1);
      }
      // Nothing draws over the tray.
      const onTop = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[data-testid="build-tray"]'), [tray.x + tray.width / 2, tray.y + Math.min(30, tray.height / 2)]);
      expect(onTop, 'the tray is on top where it sits').toBe(true);
      // Every option can be reached inside the tray, without the page scrolling.
      const last = page.getByTestId('build-tray').getByText('Mudguards');
      await last.scrollIntoViewIfNeeded();
      const l = (await last.boundingBox())!;
      expect(l.y).toBeGreaterThanOrEqual(tray.y - 1);
      expect(l.y + l.height).toBeLessThanOrEqual(tray.y + tray.height + 1);
      expect(await page.evaluate(() => scrollY)).toBe(0);
      expect(await box(page, 'stage')).toEqual(stage);
      await page.getByRole('button', { name: /^Build/ }).click();
      await expect(page.getByTestId('drawer-tab')).toBeInViewport({ ratio: 1 });
    });
  }
});
