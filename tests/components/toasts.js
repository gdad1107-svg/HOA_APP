// Toasts in #toasts (aria-live). The app keeps at most two and removes each after ~3.2 s,
// so assert promptly after the action and never on the count.
const { expect } = require('@playwright/test');

class Toasts {
  constructor(page) {
    this.region = page.locator('#toasts');
    this.items = this.region.locator('.toast');
    this.errors = this.region.locator('.toast.bad');
  }

  /** @param {string|RegExp} text */
  async expectMessage(text) { await expect(this.items.filter({ hasText: text })).toHaveCount(1); }

  /** @param {string|RegExp} text */
  async expectError(text) { await expect(this.errors.filter({ hasText: text })).toHaveCount(1); }
}

module.exports = { Toasts };
