// Navigation and usability of the app shell: role switching, the current-screen marker,
// state across reload, the sign-in announcement pop-up, modals and the 375 px menu.
// Written against: HOA mock-up at commit c079503, 2026-11-27.
// Writes: only the fresh context's localStorage (UI state, acknowledged announcement).
// Run: npx playwright test navigation   (the @mobile cases run under the "mobile" project)
// Concurrency: parallel-safe — own browser context and seeded localStorage per test
const { test, expect } = require('../../fixtures/test');
const { PortalPage } = require('../../pages/portal-page');

test.describe('Navigation — role switch', () => {
  test('NAV-01: the app opens as Homeowner on the dashboard', async ({ portal }) => {
    await portal.shell.expectRole('owner');
    expect(await portal.shell.currentView()).toBe('dashboard');
    await expect(portal.shell.navLabel).toHaveText('Homeowner');
  });

  test("NAV-02: switching role lands on that role's dashboard and relabels the nav", async ({ portal }) => {
    const owner = await portal.asOwner();
    await owner.goTo('vehicles');

    await portal.asAdmin();
    expect(await portal.shell.currentView()).toBe('dashboard');
    await expect(portal.shell.navLabel).toHaveText('Administration');

    await portal.asGuard();
    expect(await portal.shell.currentView()).toBe('dashboard');
    await expect(portal.shell.navLabel).toHaveText('Main gate');
  });

  test('NAV-03: only the current screen carries aria-current', async ({ admin }) => {
    await admin.goTo('reports');
    await expect(admin.shell.nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(admin.shell.navItem('reports')).toHaveAttribute('aria-current', 'page');
  });

  test('NAV-04: role and screen survive a reload', async ({ page, portal }) => {
    const admin = await portal.asAdmin();
    await admin.goTo('collections');
    await page.reload();
    await portal.shell.waitForBoot();
    await portal.shell.expectRole('admin');
    expect(await portal.shell.currentView()).toBe('collections');
  });
});

test.describe('Navigation — sign-in announcement pop-up', () => {
  test('NAV-05: an unread important announcement opens on load; "Got it" clears it for good', async ({ page, appPath }) => {
    const portal = new PortalPage(page, appPath);
    await portal.open({ keepSignInPopup: true });
    await portal.modal.expectOpen(/important announcement/i);
    await portal.acknowledgeSignInPopup();

    await page.reload();
    await portal.shell.waitForBoot();
    await portal.modal.expectClosed();
  });
});

test.describe('Navigation — modals', () => {
  test('NAV-06: Escape closes an open modal', async ({ portal }) => {
    const approvals = await (await portal.asAdmin()).approvals();
    await approvals.openTab('veh');
    await approvals.pendingVehicleRows.first().locator('[data-act="reject"]').click();
    await approvals.modal.expectOpen('Reject request');
    await approvals.modal.pressEscape();
    await approvals.modal.expectClosed();
  });
});

test.describe('Navigation — phone layout', { tag: '@mobile' }, () => {
  test('NAV-07: at 375 px the nav sits behind the menu button, and Escape closes it', async ({ portal }) => {
    await expect(portal.shell.menuButton).toBeVisible();
    await portal.shell.openMenu();
    await expect(portal.shell.navItem('dues')).toBeVisible();
    await portal.shell.closeMenuWithEscape();
  });

  test('NAV-08: choosing a screen from the phone menu navigates and closes the menu', async ({ owner }) => {
    await owner.goTo('dues');
    await expect(owner.shell.menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(owner.shell.heading).toBeVisible();
  });
});
