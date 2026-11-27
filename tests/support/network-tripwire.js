// Network tripwire: the backstop for "never send real email/SMS, never call a live payment
// provider". Every request from the page is checked against an allow-list; anything else is
// aborted and recorded, and the fixture fails the test if the list is non-empty.
//
// Allowed: the loopback app server, the four CDN libraries the mock-up loads (jsPDF,
// jsPDF-AutoTable, qrcode-generator, jsQR) and Google Fonts. Add a host here only with a
// reason in the comment.
// data: and blob: URLs never reach the network and are always allowed.

const ALLOWED_HOSTS = new Set([
  '127.0.0.1',
  'localhost',
  'cdnjs.cloudflare.com', // jsPDF + AutoTable: statements, receipts, letters
  'cdn.jsdelivr.net',     // qrcode-generator, jsQR: pay-by-QR and guest passes
  'fonts.googleapis.com', // Inter + Plus Jakarta Sans stylesheet
  'fonts.gstatic.com',    // the font files that stylesheet points at
]);

async function installTripwire(context) {
  const blocked = [];
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    let host = '';
    try { host = new URL(url).hostname; } catch { /* unparseable → blocked */ }
    if (ALLOWED_HOSTS.has(host)) return route.continue();
    blocked.push(`${route.request().method()} ${url}`);
    return route.abort('blockedbyclient');
  });
  return blocked;
}

module.exports = { ALLOWED_HOSTS, installTripwire };
