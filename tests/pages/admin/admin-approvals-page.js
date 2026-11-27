// Admin → Approvals: three tabs (payments, bookings, vehicles). Only the vehicles tab is
// modelled so far; add the others when a spec needs them, with locators checked in the app.
const { expect } = require('@playwright/test');
const { BasePage } = require('../base-page');

class AdminApprovalsPage extends BasePage {
  constructor(page) {
    super(page);
    this.vehiclesCard = this.card('Vehicle registrations');
    this.pendingVehicleRows = this.vehiclesCard.locator('tbody tr');
    this.rejectForm = this.modal.dialog.locator('form[data-form="reject"]');
    this.rejectReason = this.rejectForm.locator('#rejReason');
    this.rejectPresets = this.rejectForm.locator('[data-act="preset"]');
    this.rejectSubmit = this.modal.footer.locator('button[type="submit"][form="rejForm"]');
  }

  async openTab(key /* 'pay' | 'book' | 'veh' */) {
    await this.tab('appr', key).click();
    await expect(this.tab('appr', key)).toHaveAttribute('aria-selected', 'true');
  }

  pendingVehicleRow(plate) {
    return this.shell.main.locator('tbody tr').filter({ has: this.page.locator('td b.num', { hasText: plate.toUpperCase() }) });
  }

  async approveVehicle(plate) {
    await this.openTab('veh');
    await this.pendingVehicleRow(plate).locator('[data-act="approveVeh"]').click();
    await this.toasts.expectMessage(/Approved\. Sticker #\d+ assigned\./);
    await expect(this.pendingVehicleRow(plate)).toHaveCount(0);
  }

  /** @param {string} plate @param {{ reason?: string, preset?: number }} how */
  async rejectVehicle(plate, how) {
    await this.openTab('veh');
    await this.pendingVehicleRow(plate).locator('[data-act="reject"][data-k="veh"]').click();
    await this.modal.expectOpen('Reject request');
    if (how.preset !== undefined) await this.rejectPresets.nth(how.preset).click();
    else await this.rejectReason.fill(how.reason);
    await this.rejectSubmit.click();
    await this.modal.expectClosed();
    await expect(this.pendingVehicleRow(plate)).toHaveCount(0);
  }
}

module.exports = { AdminApprovalsPage };
