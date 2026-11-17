import { expect, type Page } from '@playwright/test';

/* Shared steps for the Explore the bike specs. */

export async function takeApart(page: Page) {
  await page.getByRole('button', { name: 'Take the bike apart' }).click();
  await expect(page.getByRole('slider', { name: 'How far apart the bike is' })).toHaveAttribute('aria-valuetext', 'Fully apart');
  await page.waitForTimeout(250);
}

/** Selects each part in turn from the keyboard and calls `check` with its key. */
export async function eachPart(page: Page, check: (key: string) => Promise<void>) {
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

export const viewBox = (page: Page) => page.locator('.bx-svg').getAttribute('viewBox');
