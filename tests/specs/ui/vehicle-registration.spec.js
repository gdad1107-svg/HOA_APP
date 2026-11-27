// Vehicle registration across Homeowner and Admin: register → approve (Journey), reject with a
// reason the homeowner sees, withdraw while pending, and the form's required fields.
// Written against: HOA mock-up at commit c079503, 2026-11-27.
// Writes: yes, to the fresh context's localStorage only. Safety: (1) assertTestEnvironment in
// beforeAll; (2) the network tripwire fixture; (3) disposable "Automation " vehicles with a
// per-run ZZA plate. The context, and every record in it, is discarded after each test.
// Roles cross inside one browser: the mock-up shares state between roles through localStorage.
// Run: npx playwright test vehicle-registration
// Concurrency: parallel-safe — own browser context and seeded localStorage per test
const { test, expect } = require('../../fixtures/test');
const { assertTestEnvironment } = require('../../support/environment-guard');
const { disposableVehicle } = require('../../data/test-data');

test.beforeAll(({ baseURL }) => assertTestEnvironment(baseURL));

test.describe('Vehicle registration', () => {
  test('VEH-J1 (Journey): homeowner registers, admin approves, homeowner sees the sticker', { tag: '@journey' }, async ({ portal }, testInfo) => {
    const vehicle = disposableVehicle(testInfo.workerIndex);

    let vehicles = await (await portal.asOwner()).vehicles();
    await vehicles.register(vehicle);
    await expect(vehicles.statusOf(vehicle.plate)).toHaveText('Pending approval');

    await (await (await portal.asAdmin()).approvals()).approveVehicle(vehicle.plate);

    vehicles = await (await portal.asOwner()).vehicles();
    await expect(vehicles.statusOf(vehicle.plate)).toHaveText('Approved');
    await expect(vehicles.stickerOf(vehicle.plate)).toHaveText(/^Sticker #\d{4}$/);
  });

  test("VEH-02: a rejected registration shows the admin's reason to the homeowner", async ({ portal }, testInfo) => {
    const vehicle = disposableVehicle(testInfo.workerIndex);
    const reason = 'Automation: plate does not match the OR/CR';

    await (await (await portal.asOwner()).vehicles()).register(vehicle);
    await (await (await portal.asAdmin()).approvals()).rejectVehicle(vehicle.plate, { reason });

    const vehicles = await (await portal.asOwner()).vehicles();
    await expect(vehicles.statusOf(vehicle.plate)).toHaveText('Rejected');
    await expect(vehicles.vehicleCard(vehicle.plate)).toContainText(reason);
  });

  test('VEH-03: a pending registration can be withdrawn and leaves the admin queue', async ({ portal }, testInfo) => {
    const vehicle = disposableVehicle(testInfo.workerIndex);
    const vehicles = await (await portal.asOwner()).vehicles();
    await vehicles.register(vehicle);
    await vehicles.withdraw(vehicle.plate);

    const approvals = await (await portal.asAdmin()).approvals();
    await approvals.openTab('veh');
    await expect(approvals.pendingVehicleRow(vehicle.plate)).toHaveCount(0);
  });

  test('VEH-04: the register form will not submit with required fields empty', async ({ owner }) => {
    const vehicles = await owner.vehicles();
    const before = await vehicles.vehicleCards.count();
    await vehicles.submitButton.click();
    expect(await vehicles.plateInput.evaluate((el) => el.validity.valueMissing)).toBe(true);
    await expect(vehicles.vehicleCards).toHaveCount(before);
  });
});
