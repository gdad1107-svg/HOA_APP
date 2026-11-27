// Every page object extends this. It owns the shared components so a page object only
// describes its own screen. Page objects are built by the fixtures (tests/fixtures/test.js),
// never by a spec, and specs never hold a raw selector.
const { AppShell } = require('../components/app-shell');
const { Modal } = require('../components/modal');
const { ConfirmDialog } = require('../components/confirm-dialog');
const { Toasts } = require('../components/toasts');

class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.shell = new AppShell(page);
    this.modal = new Modal(page);
    this.confirmDialog = new ConfirmDialog(page);
    this.toasts = new Toasts(page);
  }

  /** The section of #main whose card heading (h2) matches. */
  card(heading) {
    return this.shell.main.locator('section.card').filter({ has: this.page.getByRole('heading', { level: 2, name: heading }) });
  }

  /** A tab in a [role=tablist] by its group (data-g) and key (data-t). */
  tab(group, key) { return this.shell.main.locator(`[data-act="tab"][data-g="${group}"][data-t="${key}"]`); }
}

module.exports = { BasePage };
