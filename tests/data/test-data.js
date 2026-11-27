// Test data. The mock-up has no accounts or credentials yet, so there is no .env; when the
// real app arrives, identifying values move to process.env (listed in .env.example) per the
// QE rules. Disposable records use the "Automation " prefix so they are recognisable in any
// screenshot or trace, even though a fresh browser context discards them anyway.

const DISPOSABLE_PREFIX = 'Automation ';

/** A plate unique to this test run and worker, in the app's "ABC 1234" shape. */
function disposablePlate(workerIndex = 0) {
  const n = (Date.now() + workerIndex * 7919) % 10000;
  return `ZZA ${String(n).padStart(4, '0')}`;
}

function disposableVehicle(workerIndex) {
  return { plate: disposablePlate(workerIndex), type: 'SUV', make: `${DISPOSABLE_PREFIX}Fortuner`, color: 'Silver' };
}

module.exports = { DISPOSABLE_PREFIX, disposablePlate, disposableVehicle };
