// Homeowner → My Vehicles: the registered-vehicle list and the "Register a vehicle" form
// (data-form="vehicle"). The app upper-cases the plate on save, so lookups do too.
const { expect } = require('@playwright/test');
const { BasePage } = require('../base-page');

class OwnerVehiclesPage extends BasePage {
  constructor(page) {
    super(page);
    this.form = page.locator('form[data-form="vehicle"]');
    this.plateInput = this.form.locator('#vPlate');
    this.typeSelect = this.form.locator('#vType');
    this.makeInput = this.form.locator('#vMake');
    this.colorInput = this.form.locator('#vColor');
    this.documentInput = this.form.locator('#vDoc');
    this.submitButton = this.form.getByRole('button', { name: 'Submit for approval' });
    this.vehicleCards = this.shell.main.locator('.vcard');
    this.emptyState = this.card('Registered vehicles').locator('.empty');
  }

  vehicleCard(plate) {
    return this.vehicleCards.filter({ has: this.page.locator('.plate b', { hasText: plate.toUpperCase() }) });
  }

  /** @param {{ plate: string, type?: string, make: string, color: string }} v */
  async register(v) {
    await this.plateInput.fill(v.plate);
    if (v.type) await this.typeSelect.selectOption(v.type);
    await this.makeInput.fill(v.make);
    await this.colorInput.fill(v.color);
    await this.submitButton.click();
    await this.toasts.expectMessage('Vehicle submitted for approval.');
    await expect(this.vehicleCard(v.plate)).toHaveCount(1);
  }

  statusOf(plate) { return this.vehicleCard(plate).locator('.pill'); }
  stickerOf(plate) { return this.vehicleCard(plate).locator('.num', { hasText: 'Sticker #' }); }
  reasonOf(plate) { return this.vehicleCard(plate).locator('.sub').last(); }
  withdrawButton(plate) { return this.vehicleCard(plate).locator('[data-act="removeVeh"]'); }

  async withdraw(plate) {
    await this.withdrawButton(plate).click();
    await this.toasts.expectMessage('Registration withdrawn.');
    await expect(this.vehicleCard(plate)).toHaveCount(0);
  }
}

module.exports = { OwnerVehiclesPage };
