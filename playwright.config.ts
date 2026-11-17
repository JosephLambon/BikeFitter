import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
/** A second server with the coil scrubber's, the part label's and the phone label's flags off, so the
    cable scrubber, the floating info card and the part drawer they replace keep their tests. */
const CABLE_PORT = 4174;
const FLAGS = { VITE_FLAG_EXPLORE_BIKE: 'true', VITE_FLAG_BIKE_BUILD: 'true', VITE_FLAG_BIKE_DRAWER: 'true' };
const OFF = /cable-scrubber|info-card|part-drawer/;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', testIgnore: OFF, use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORT}` } },
    { name: 'flags-off', testMatch: OFF, use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${CABLE_PORT}` } },
  ],
  webServer: [
    {
      command: `npx vite --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      env: { ...FLAGS, VITE_FLAG_BIKE_COIL: 'true', VITE_FLAG_BIKE_LABEL: 'true', VITE_FLAG_BIKE_TUCK: 'true', VITE_FLAG_BIKE_THUMB_LABEL: 'true' },
    },
    {
      command: `npx vite --port ${CABLE_PORT} --strictPort`,
      url: `http://localhost:${CABLE_PORT}`,
      reuseExistingServer: !process.env.CI,
      env: { ...FLAGS, VITE_FLAG_BIKE_COIL: 'false', VITE_FLAG_BIKE_LABEL: 'false', VITE_FLAG_BIKE_TUCK: 'false', VITE_FLAG_BIKE_THUMB_LABEL: 'false' },
    },
  ],
});
