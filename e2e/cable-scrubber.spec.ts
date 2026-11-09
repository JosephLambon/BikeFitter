import { expect, test } from '@playwright/test';
import { expectScrubberAligned } from './scrubber.js';

/* The cable explode scrubber, which ships while the `bikeCoil` flag is off. Runs in the
   "cable" project (playwright.config.ts), against a server with that flag off. */

test.describe('Cable scrubber (bikeCoil off)', () => {
  test('the grip and nudge arrow sit on the cable’s end, level with it, on a desktop', async ({ page }) => {
    await page.goto('/bike');
    await expect(page.locator('[data-scrubber="cable"]')).toBeAttached();
    await expectScrubberAligned(page, { nudge: true });
  });

  test.describe('phone, portrait', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

    test('in the dock, the grip and nudge arrow sit on the cable’s end, level with it', async ({ page }) => {
      await page.goto('/bike');
      await expect(page.locator('[data-scrubber="cable"]')).toBeAttached();
      await expectScrubberAligned(page, { nudge: true });
    });
  });
});
