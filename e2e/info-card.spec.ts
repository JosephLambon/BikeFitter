import { expect, test, type Page } from '@playwright/test';
import { eachPart, takeApart, viewBox } from './bike.js';

/* The floating info card, which ships while the `bikeLabel` flag is off (AGENTS.md §5.1). Runs in
   the "flags-off" project (playwright.config.ts), against a server with that flag off. */

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

test('selecting a part shows the info card, with its fit note and source', async ({ page }) => {
  await page.goto('/bike');
  await takeApart(page);
  await page.getByRole('button', { name: 'Pedals, Contact points' }).click();
  const card = page.getByRole('status');
  await expect(card.getByRole('heading', { name: 'Pedals' })).toBeVisible();
  await expect(card.getByText('Why it matters for fit.')).toBeVisible();
  await expect(card.getByRole('link', { name: /Cyclefit/ })).toBeVisible();
});

test.describe('Info card rule (bikeLabel off)', () => {
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

