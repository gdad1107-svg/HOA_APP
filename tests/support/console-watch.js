// Collects uncaught page errors and console.error lines so a spec can assert "no halting
// console error" (a smoke criterion). Messages the mock-up is known to emit harmlessly go
// in IGNORED with the reason; keep it empty unless a real, accepted case appears.

const IGNORED = [];

function watchConsole(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED.some((re) => re.test(text))) return;
    errors.push(`console.error: ${text}`);
  });
  return errors;
}

module.exports = { watchConsole };
