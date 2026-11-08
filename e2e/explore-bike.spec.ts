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

    // Select a part: it goes amber and the info card explains it, with its source.
    await page.getByRole('button', { name: 'Pedals, Contact points' }).click();
    const card = page.getByRole('status');
    await expect(card.getByRole('heading', { name: 'Pedals' })).toBeVisible();
    await expect(card.getByText('Why it matters for fit.')).toBeVisible();
    await expect(card.getByRole('link', { name: /Cyclefit/ })).toBeVisible();
    await expect(page.locator('.bx-part.is-active[data-part="pedals"]').first()).toBeVisible();
  });

  test('scrolling through the stage takes the bike apart', async ({ page }) => {
    await page.goto('/bike');
    const slider = page.getByRole('slider', { name: 'How far apart the bike is' });
    await expect(slider).toHaveAttribute('aria-valuetext', 'Together');
    await page.mouse.wheel(0, 1600);
    await expect(slider).not.toHaveAttribute('aria-valuetext', 'Together');
  });

  test('works from the keyboard alone', async ({ page }) => {
    await page.goto('/bike');
    const first = page.getByRole('button', { name: 'Chainstays, Frame' });
    await first.focus();
    await expect(page.getByRole('status')).toContainText('Chainstays');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('status')).toContainText('Seat stays');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('status')).toBeEmpty();
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
