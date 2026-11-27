// The chrome shared by every role: header (role switch, menu button, notifications bell),
// side navigation (#nav) and the main region (#main). Everything here is keyed on the app's
// own data-act / data-role / data-view hooks, never on visible brand text.
const { expect } = require('@playwright/test');

const ROLE_LABELS = { owner: 'Homeowner', admin: 'Admin', guard: 'Guard' };

class AppShell {
  constructor(page) {
    this.page = page;
    this.header = page.locator('#top');
    this.roleSwitch = this.header.getByRole('group', { name: 'Switch role' });
    this.menuButton = this.header.locator('[data-act="menu"]');
    this.bellButton = this.header.locator('[data-act="bell"]');
    this.nav = page.locator('#nav');
    this.navLabel = this.nav.locator('.navlbl');
    this.main = page.locator('#main');
    this.heading = this.main.locator('.ph h1').first();
    this.announcementBanner = this.main.getByRole('region', { name: 'Latest announcement' });
  }

  roleButton(role) { return this.roleSwitch.locator(`[data-act="role"][data-role="${role}"]`); }
  navItem(view) { return this.nav.locator(`[data-act="nav"][data-view="${view}"]`); }
  navItems() { return this.nav.locator('[data-act="nav"]'); }
  /** Each nav item's label alone: admin and guard items also carry a count badge (.badge). */
  navItemLabels() { return this.navItems().locator('> span:not(.badge)'); }
  navBadge(view) { return this.navItem(view).locator('.badge'); }

  async waitForBoot() { await expect(this.roleSwitch).toBeVisible(); }

  async switchRole(role) {
    await this.roleButton(role).click();
    await expect(this.roleButton(role)).toHaveAttribute('aria-pressed', 'true');
  }

  async expectRole(role) {
    await expect(this.roleButton(role)).toHaveAttribute('aria-pressed', 'true');
    await expect(this.roleButton(role)).toHaveText(ROLE_LABELS[role]);
  }

  /** Opens a screen from the side nav, opening the phone menu first when the nav is collapsed. */
  async goTo(view) {
    const item = this.navItem(view);
    if (!(await item.isVisible()) && (await this.menuButton.isVisible())) await this.openMenu();
    await item.click();
    await expect(this.navItem(view)).toHaveAttribute('aria-current', 'page');
  }

  async currentView() {
    return this.nav.locator('[data-act="nav"][aria-current="page"]').getAttribute('data-view');
  }

  async openMenu() {
    await this.menuButton.click();
    await expect(this.menuButton).toHaveAttribute('aria-expanded', 'true');
  }

  async closeMenuWithEscape() {
    await this.page.keyboard.press('Escape');
    await expect(this.menuButton).toHaveAttribute('aria-expanded', 'false');
  }
}

module.exports = { AppShell, ROLE_LABELS };
