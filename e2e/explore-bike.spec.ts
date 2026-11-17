import { expect, test } from '@playwright/test';

test.describe('Explore the bike', () => {
  test('take the bike apart in place, then select a part to learn what it does', async ({ page }) => {
    await page.goto('/bike');
    await expect(page.getByRole('heading', { level: 1, name: 'Explore your bike’s anatomy.' })).toBeVisible();

    // The button explodes the bike without moving the page.
    const before = await page.evaluate(() => window.scrollY);
    await page.getByRole('button', { name: 'Take the bike apart' }).click();
    const slider = page.getByRole('slider', { name: 'How far apart the bike is' });
    await expect(slider).toHaveAttribute('aria-valuetext', 'Fully apart');
    await expect(page.getByRole('button', { name: 'Put the bike back together' })).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(before);

    // Select a part: it goes amber and the label above the bike says what it is.
    await page.getByRole('button', { name: 'Pedals, Contact points' }).click();
    const label = page.getByRole('status').filter({ has: page.getByRole('heading', { name: 'Pedals' }) });
    await expect(label).toBeVisible();
    await expect(label).toContainText('Clipless road pedals');
    await expect(page.locator('.bx-part.is-active[data-part="pedals"]').first()).toBeVisible();
  });

  test('scrolling through the stage takes the bike apart', async ({ page }) => {
    await page.goto('/bike');
    const slider = page.getByRole('slider', { name: 'How far apart the bike is' });
    await expect(slider).toHaveAttribute('aria-valuetext', 'Together');
    await page.mouse.wheel(0, 1600);
    await expect(slider).not.toHaveAttribute('aria-valuetext', 'Together');
  });

  test('near the end of the reel the heading scrolls away and the bench wall grows into its space', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/bike');
    const title = page.locator('#bike-h'), stage = page.getByTestId('stage');
    const headH = await page.locator('header.site-head').evaluate((h) => h.getBoundingClientRect().height);
    const start = (await stage.boundingBox())!;
    await expect(title).toBeInViewport();
    expect(start.y).toBeGreaterThan(headH + 100); // the heading sits above the wall

    // Scroll through the reel in steps: the wall's top only ever rises, and its bottom never moves.
    const reel = await page.locator('#reel').evaluate((r: HTMLElement) => ({ top: r.offsetTop, h: r.offsetHeight }));
    const end = reel.top + reel.h - 900;
    let lastTop = start.y;
    for (let i = 1; i <= 20; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((end * i) / 20));
      await page.evaluate(() => new Promise(requestAnimationFrame));
      const b = (await stage.boundingBox())!;
      expect(b.y).toBeLessThanOrEqual(lastTop + 0.5);
      expect(Math.abs(b.y + b.height - (start.y + start.height))).toBeLessThan(1);
      if (i <= 10) expect(b.y, 'the heading stays for the first half').toBeCloseTo(start.y, 0);
      lastTop = b.y;
    }
    // At the end the wall sits just under the header, and the heading has gone.
    expect(lastTop).toBeCloseTo(headH + 16, 0);
    expect(await title.evaluate((h) => Number(getComputedStyle(h.parentElement!).opacity))).toBe(0);
    expect((await title.boundingBox())!.y + (await title.boundingBox())!.height).toBeLessThanOrEqual(headH);

    // Scrolling back brings it all back.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(title).toBeInViewport();
    await expect.poll(async () => (await stage.boundingBox())!.y).toBeCloseTo(start.y, 0);
  });

  test('works from the keyboard alone', async ({ page }) => {
    await page.goto('/bike');
    const first = page.getByRole('button', { name: 'Chainstays, Frame' });
    await first.focus();
    await expect(page.getByRole('status')).toContainText('Chainstays');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('status')).toContainText('Seat stays');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('part-label-window')).toBeHidden(); // the window fades away
  });
});

test.describe('Explore the bike: build tray', () => {
  test('open the tray, swap to rim brakes and see the bike change without the page moving', async ({ page }) => {
    await page.goto('/bike');
    const toggle = page.getByRole('button', { name: /^Build/ });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    const before = await page.evaluate(() => window.scrollY);
    await page.getByRole('radiogroup', { name: 'Brakes' }).getByRole('radio', { name: 'Rim' }).click();

    await expect(page.getByRole('button', { name: 'Rim brake calliper, Brakes' })).toBeVisible();
    await expect(page.locator('[data-frag="rotor-f"]')).toHaveCount(0); // rolled away, then removed
    await expect(toggle).toHaveAccessibleName('Build, 1 changed');
    expect(await page.evaluate(() => window.scrollY)).toBe(before);

    await page.getByRole('button', { name: 'Rim brake calliper, Brakes' }).click();
    await expect(page.getByRole('status')).toContainText('sides of the rim');
  });

  test('deep rims redraw the wheels once the spin settles', async ({ page }) => {
    await page.goto('/bike');
    await page.getByRole('button', { name: /^Build/ }).click();
    const rim = page.locator('[data-frag="rim-f"] .bx-lift');
    const shallow = await rim.innerHTML();
    await page.getByRole('radiogroup', { name: 'Rims' }).getByRole('radio', { name: 'Deep' }).click();
    await expect.poll(() => rim.innerHTML()).not.toBe(shallow);
  });
});
