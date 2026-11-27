// Smoke: every screen loads for every role, with no page error and no off-list network call.
// Written against: HOA mock-up at commit c079503 (the mock-up has no APP_VERSION yet), 2026-11-27.
// Writes: nothing beyond the fresh browser context's own localStorage (discarded per test).
// Accommodates: the homeowner sign-in announcement pop-up (acknowledged by the portal fixture).
// Prerequisites: none; the app seeds its demo data on first load.
// Run: npx playwright test smoke   (both brands) — or npm run test:smoke
// Concurrency: parallel-safe — each test runs in its own browser context with its own seeded localStorage; nothing is shared
const { test, expect } = require('../../fixtures/test');
const { OwnerPortal } = require('../../pages/owner/owner-portal');
const { AdminPortal } = require('../../pages/admin/admin-portal');
const { GuardPortal } = require('../../pages/guard/guard-portal');

const ROLES = [
  { role: 'owner', Portal: OwnerPortal, enter: (portal) => portal.asOwner() },
  { role: 'admin', Portal: AdminPortal, enter: (portal) => portal.asAdmin() },
  { role: 'guard', Portal: GuardPortal, enter: (portal) => portal.asGuard() },
];

for (const { role, Portal, enter } of ROLES) {
  test.describe(`Smoke — ${role}`, { tag: '@smoke' }, () => {
    test(`SMK-${role}-nav: the side nav offers exactly the expected screens, in order`, async ({ portal }) => {
      const p = await enter(portal);
      await expect(p.shell.navItemLabels()).toHaveText(Portal.VIEWS.map((v) => v.label));
    });

    for (const { view, label } of Portal.VIEWS) {
      test(`SMK-${role}-${view}: "${label}" loads with a heading`, async ({ portal }) => {
        const p = await enter(portal);
        await p.goTo(view);
        await expect(p.shell.heading).toBeVisible();
        await expect(p.shell.heading).not.toBeEmpty();
      });
    }
  });
}
