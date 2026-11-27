// Playwright UI layer for the HOA portal (QE owns this file).
//
// The app under test is the browser-only mock-up: all state lives in localStorage, so every
// test gets a fresh browser context and therefore a freshly seeded demo. Nothing persists
// between tests, which is what makes the suite parallel-safe and self-healing by default.
//
// baseURL is loopback only. The environment guard (tests/support/environment-guard.js)
// refuses any other host for a write-capable spec. When the real Firebase app exists, the
// emulator-backed build replaces the static server here; production is never a target.

const { defineConfig, devices } = require('@playwright/test');

const PORT = Number(process.env.PORT || 4173);
const BASE_URL = `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
  testDir: './tests/specs',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // One project per branded build. `appPath` is a custom option read by the fixtures, so a
  // spec never hard-codes which file it opens. Specs must not assert brand text (HOA name,
  // colours); both brands share every control and data-act hook.
  projects: [
    { name: 'greenfield', grepInvert: /@mobile/, use: { ...devices['Desktop Chrome'], appPath: '/' } },
    { name: 'gentri-heights', grepInvert: /@mobile/, use: { ...devices['Desktop Chrome'], appPath: '/gentri-heights/' } },
    // 375 px phone layout, Greenfield only: layout is brand-independent.
    { name: 'mobile', grep: /@mobile/, use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 }, appPath: '/' } },
  ],

  webServer: {
    command: 'node scripts/serve.mjs',
    url: `${BASE_URL}/index.html`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
});
