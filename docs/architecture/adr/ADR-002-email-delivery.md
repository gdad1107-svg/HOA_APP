# ADR-002 — Email via our own Cloud Function and an outside provider

**Status:** Proposed (Draft, with SA-001). **Date:** 2026-11-27.

**Context.** The owner asked to "use Firebase" for email. Firebase sends only Auth emails (verification, password reset, sign-in link). The "Trigger Email from Firestore" extension requires the customer's own SMTP provider, and the Firebase Extensions service shuts down on 31 March 2027 (extensions.dev/extensions/firebase/firestore-send-email and firebase.google.com/docs/extensions/faq-and-troubleshooting, fetched 2026-11-27). See L-001.

**Options.**
1. Own Cloud Function reading a Firestore `mail` queue, sending via the provider's SMTP or HTTP API; key in Secret Manager; status `queued → sent | failed` with retry; staging allow-list.
2. Install the Trigger Email extension now. Rejected: same provider needed, platform ending in 2027, migration work later.
3. No email; in-app notifications only. Rejected: statements and demand letters must reach people who do not open the app.

**Decision (proposed).** Option 1. Provider chosen by the owner on cost; the HOA's sending domain needs SPF/DKIM/DMARC.

**Consequences.** ~100 lines of function code and tests; a small provider bill or free tier; admin screens show "queued / sent / failed", never "delivered".

**Revision r2 (2026-11-28, after the REQ-004 review).** "Failed" covers only a refusal by the provider when the message is handed over. A later bounce, such as a mailbox that does not exist, is reported only through the provider's events (a webhook), and this decision does not include them. Adding them costs about 0.5–1 extra day once the provider is chosen; **r3: the owner decided on 2026-11-28 to include them in invite step 2 (REQ-004 decision 3),** so the mail design adds the provider's bounce events, and an invite that bounces shows as failed. When a mail document carries a secret, such as an invite code, the secret is removed after hand-off. The function paces sending to the provider's limits, and the status stays "queued" in the meantime.
