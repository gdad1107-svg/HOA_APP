# ADR-002 — Email via our own Cloud Function and an outside provider

**Status:** Proposed (Draft, with SA-001). **Date:** 2026-11-27.

**Context.** The owner asked to "use Firebase" for email. Firebase sends only Auth emails (verification, password reset, sign-in link). The "Trigger Email from Firestore" extension requires the customer's own SMTP provider, and the Firebase Extensions service shuts down on 31 March 2027 (extensions.dev/extensions/firebase/firestore-send-email and firebase.google.com/docs/extensions/faq-and-troubleshooting, fetched 2026-11-27). See L-001.

**Options.**
1. Own Cloud Function reading a Firestore `mail` queue, sending via the provider's SMTP or HTTP API; key in Secret Manager; status `queued → sent | failed` with retry; staging allow-list.
2. Install the Trigger Email extension now. Rejected: same provider needed, platform ending in 2027, migration work later.
3. No email; in-app notifications only. Rejected: statements and demand letters must reach people who do not open the app.

**Decision (proposed).** Option 1. Provider chosen by the owner on cost; the HOA's sending domain needs SPF/DKIM/DMARC.

**Consequences.** ~100 lines of function code and tests; a small provider bill or free tier; admin screens show "queued / sent / failed", never "delivered".
