import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
/** A second server with the coil scrubber's flag off, so the cable scrubber it replaces keeps its tests. */
const CABLE_PORT = 4174;
const FLAGS = { VITE_FLAG_EXPLORE_BIKE: 'true', VITE_FLAG_BIKE_BUILD: 'true', VITE_FLAG_BIKE_DRAWER: 'true' };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', testIgnore: /cable-scrubber/, use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORT}` } },
    { name: 'cable', testMatch: /cable-scrubber/, use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${CABLE_PORT}` } },
  ],
  webServer: [
    {
      command: `npx vite --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      env: { ...FLAGS, VITE_FLAG_BIKE_COIL: 'true' },
    },
    {
      command: `npx vite --port ${CABLE_PORT} --strictPort`,
      url: `http://localhost:${CABLE_PORT}`,
      reuseExistingServer: !process.env.CI,
      env: { ...FLAGS, VITE_FLAG_BIKE_COIL: 'false' },
    },
  ],
});
