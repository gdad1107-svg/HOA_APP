// The environment guard from the QE agent definition, reproduced verbatim. Every
// write-capable spec calls it in beforeAll with the run's baseURL. Never weaken it, make it
// a warning, or add an env-var escape hatch. When Sol Arch names the designated test
// project's host, add it to ALLOWED (and nothing else).

const ALLOWED = ['localhost', '127.0.0.1' /* designated test host, from the design */];

function assertTestEnvironment(baseURL) {
  if (!baseURL || !ALLOWED.some((h) => new URL(baseURL).hostname === h)) {
    throw new Error(
      `REFUSING TO RUN: this suite writes data and baseURL is "${baseURL}". ` +
      `It may only run against: ${ALLOWED.join(', ')}.`
    );
  }
}

module.exports = { ALLOWED, assertTestEnvironment };
