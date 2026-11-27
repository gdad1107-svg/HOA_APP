// Shared behaviour of the three role portals: the screen list a role should offer, and
// navigation to each. VIEWS mirrors the app's NAV map on purpose: a screen added, renamed
// or removed in the app makes the smoke spec fail until this list is updated deliberately.
const { BasePage } = require('./base-page');

class RolePortal extends BasePage {
  /** @returns {{ view: string, label: string }[]} */
  static get VIEWS() { throw new Error('RolePortal subclasses define static VIEWS'); }

  get views() { return this.constructor.VIEWS; }

  async goTo(view) { await this.shell.goTo(view); return this; }
}

module.exports = { RolePortal };
