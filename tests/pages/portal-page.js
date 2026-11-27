// The entry point: opens the branded build named by the project's appPath, waits for boot,
// clears the homeowner sign-in announcement pop-up, and hands out a role portal.
//
// Boot order in the app is load() → render() → signInPopup(), all synchronous, so once the
// role switch is visible the pop-up is either already open or will not open at all.
const { expect } = require('@playwright/test');
const { BasePage } = require('./base-page');
const { OwnerPortal } = require('./owner/owner-portal');
const { AdminPortal } = require('./admin/admin-portal');
const { GuardPortal } = require('./guard/guard-portal');

class PortalPage extends BasePage {
  constructor(page, appPath) {
    super(page);
    this.appPath = appPath;
    this.signInPopupAck = this.modal.dialog.locator('[data-act="ackNews"]');
  }

  /** @param {{ keepSignInPopup?: boolean }} [opts] */
  async open(opts = {}) {
    await this.page.goto(this.appPath);
    await this.shell.waitForBoot();
    if (!opts.keepSignInPopup) await this.acknowledgeSignInPopup();
    return this;
  }

  async acknowledgeSignInPopup() {
    if (await this.signInPopupAck.isVisible()) {
      await this.signInPopupAck.click();
      await this.modal.expectClosed();
    }
  }

  async asOwner() { await this.#switch('owner'); await this.acknowledgeSignInPopup(); return new OwnerPortal(this.page); }
  async asAdmin() { await this.#switch('admin'); return new AdminPortal(this.page); }
  async asGuard() { await this.#switch('guard'); return new GuardPortal(this.page); }

  async #switch(role) {
    if ((await this.shell.roleButton(role).getAttribute('aria-pressed')) !== 'true') await this.shell.switchRole(role);
    await expect(this.shell.roleButton(role)).toHaveAttribute('aria-pressed', 'true');
  }
}

module.exports = { PortalPage };
