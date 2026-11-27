# Architecture learnings — HOA portal

Owner: Sol Arch. Read before every review; cite by `L-NNN`.

### L-001 — "Use Firebase for email" needs an outside provider, and the Extensions platform is ending (2026-11-27)
- **What happened:** SA-001 review of the owner's stack ("If emails are needed, let's use Firebase as well"). Firebase sends only its own Auth emails; the "Trigger Email from Firestore" extension needs the customer's own SMTP provider, and the extension page and Firebase Extensions FAQ (fetched 2026-11-27) state the Extensions service shuts down on 31 March 2027.
- **Why it happened:** "Firebase" is read as one product; email delivery is a separate service in every Firebase design.
- **The rule now:** Email goes through our own Cloud Function and a named provider, keys in Secret Manager; no new Firebase Extensions. Lives in ADR-002 and CODING-STANDARDS CS-6.
- **Applies to:** any notification, statement, receipt or letter feature.

### L-002 — A mock-up's code is a prototype, not a specification (2026-11-27)
- **What happened:** Reading `index.html` for SA-001 found approval handlers that never check the current status (`approvePay` line 1369 — a second click issues a second OR number), a booking conflict check that exists only on screen (`slotPanel` line 667 vs `FORMS.book` line 1446), and guest-pass lookup by sequential id without its secret token (`lookupPass` line 1142).
- **Why it happened:** single-device, single-user prototypes never meet concurrency or an attacker, so the shortcuts are invisible in a demo.
- **The rule now:** Port the mock-up's screens and copy, never its data handling. Every write it contains is re-designed against the risk checklist (SA-001 §4.4); two guards per CS-5; concurrency tests per CS-8.
- **Applies to:** every feature built from the mock-up.

### L-003 — Name projects by role, never infer a role from a name (2026-11-27)
- **What happened:** The owner's other Firebase app runs a live client on a project named `…testenv` and its test site on the `default` alias — names that invite a wrong deploy.
- **Why it happened:** project ids are permanent and were chosen before their roles settled.
- **The rule now:** HOA projects are named `hoa-portal-staging` and `hoa-<client>-prod`; aliases match; deploy workflows print the target project and require approval for any `-prod`. Lives in ADR-005 and CS-6.
- **Applies to:** project creation, `.firebaserc`, CI/CD.
