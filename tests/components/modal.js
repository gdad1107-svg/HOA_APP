// The app's single modal host, #modal. Every dialog (forms, confirms, the sign-in
// announcement pop-up, proofs) renders into it with role="dialog" and an aria-label equal to
// its title. It is not window.confirm: page.on('dialog') never fires for it.

class Modal {
  constructor(page) {
    this.page = page;
    this.host = page.locator('#modal');
    this.dialog = this.host.getByRole('dialog');
    this.title = this.dialog.locator('.modal-h h2');
    this.body = this.dialog.locator('.modal-b');
    this.footer = this.dialog.locator('.modal-f');
    this.closeButton = this.dialog.locator('[data-act="close"][aria-label="Close"]');
  }

  /** @param {string|RegExp} [title] */
  async expectOpen(title) {
    await this.dialog.waitFor({ state: 'visible' });
    if (title !== undefined) {
      const { expect } = require('@playwright/test');
      await expect(this.title).toHaveText(title);
    }
  }

  async expectClosed() {
    const { expect } = require('@playwright/test');
    await expect(this.host).toBeHidden();
  }

  isOpen() { return this.host.isVisible(); }

  async close() { await this.closeButton.click(); await this.expectClosed(); }

  async pressEscape() { await this.page.keyboard.press('Escape'); }

  /** Clicks the backdrop (the #modal host itself, outside the dialog box). */
  async clickBackdrop() { await this.host.click({ position: { x: 5, y: 5 } }); }
}

module.exports = { Modal };
