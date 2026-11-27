// Custom test object for every UI spec: import { test, expect } from here, never from
// @playwright/test directly.
//
//   appPath          project option: which branded build to open ('/' or '/gentri-heights/')
//   networkTripwire  auto: aborts any request off the allow-list and fails the test after
//   consoleErrors    auto: page errors and console.error lines, asserted empty by default
//   portal           PortalPage, already opened and booted (sign-in pop-up acknowledged)
//   owner/admin/guard  the portal switched to that role
//
// Opt out of the console check for a test that expects an error:
//   test.use({ allowConsoleErrors: true })
const base = require('@playwright/test');
const { installTripwire } = require('../support/network-tripwire');
const { watchConsole } = require('../support/console-watch');
const { PortalPage } = require('../pages/portal-page');

const test = base.test.extend({
  appPath: ['/', { option: true }],
  allowConsoleErrors: [false, { option: true }],

  networkTripwire: [async ({ context }, use) => {
    const blocked = await installTripwire(context);
    await use(blocked);
    base.expect(blocked, 'requests to hosts outside the tripwire allow-list').toEqual([]);
  }, { auto: true }],

  consoleErrors: [async ({ page, allowConsoleErrors }, use) => {
    const errors = watchConsole(page);
    await use(errors);
    if (!allowConsoleErrors) base.expect(errors, 'page errors / console.error').toEqual([]);
  }, { auto: true }],

  portal: async ({ page, appPath }, use) => {
    const portal = new PortalPage(page, appPath);
    await portal.open();
    await use(portal);
  },

  owner: async ({ portal }, use) => { await use(await portal.asOwner()); },
  admin: async ({ portal }, use) => { await use(await portal.asAdmin()); },
  guard: async ({ portal }, use) => { await use(await portal.asGuard()); },
});

module.exports = { test, expect: base.expect };
