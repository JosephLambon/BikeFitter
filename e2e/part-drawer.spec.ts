import { expect, test, type Page } from '@playwright/test';

/* The part drawer on portrait phones (bikeDrawer on, bikeThumbLabel off; AGENTS.md §5.1). Runs on
   the flags-off server, where the label at the thumb is off, so the drawer it replaces keeps its tests. */

test.describe('Phone, portrait: the part drawer (bikeThumbLabel off)', () => {
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
});

test.describe('Phone, portrait: the build tray', () => {
  test.use({ hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const box = async (page: Page, id: string) => (await page.getByTestId(id).boundingBox())!;

  // iPhone 14 in browser dev tools, iPhone 14 with Safari's bars, iPhone SE; each with and
  // without reduced motion, which must not change a phone's screen.
  for (const [w, h, reduced] of [[390, 844, false], [390, 664, false], [375, 667, false], [390, 844, true], [375, 667, true]] as const) {
    test(`opens between the bike and the dock, never over the bike or the Part details tab, at ${w}×${h}${reduced ? ', reduced motion' : ''}`, async ({ page }) => {
      if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/bike');
      const stage = await box(page, 'stage'), dock = await box(page, 'dock');
      // The page is one screen: the header, the bike, the drawer's space and the dock all fit.
      expect(dock.y + dock.height, 'the dock is on screen').toBeLessThanOrEqual(h);
      expect(await page.evaluate(() => document.querySelector('#reel')!.getBoundingClientRect().bottom), 'the bench ends at the screen\'s edge').toBeLessThanOrEqual(h);
      expect(stage.y, 'the bike sits below the header').toBeGreaterThanOrEqual((await page.locator('header').boundingBox())!.height);
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
