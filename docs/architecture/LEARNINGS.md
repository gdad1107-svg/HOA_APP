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

### L-004 — Revoking tokens doesn't stop Firestore rules accepting the current ID token (2026-11-28)
- **What happened:** SA-001 r1 §8.1 and ADR-004 said that `setRole` revokes refresh tokens, so a removed admin loses access "within the hour or at once". The REQ-002 review found that revoking stops new tokens, but rules keep accepting the ID token already issued until it expires, up to an hour later.
- **Why it happened:** "revoke" reads as "sign out now". Firebase checks revocation only where code asks for it (`verifyIdToken(token, true)`), and rules cannot ask.
- **The rule now:** Anything that must lose access at once is checked in rules against a server-written document (`staff/{uid}`, `members/...`), never against a claim alone. Rules tests include a removed role with a stale token. This lives in SA-001 §8.1 and ADR-004.
- **Applies to:** staff roles, and any future permission based on a claim.

### L-005 — A hashed invite code exists in plain text only when it is created (2026-11-28)
- **What happened:** In the REQ-004 review, invite codes are stored as a keyed hash used as the document id, so the system can never show or reprint an existing code.
- **Why it happened:** hashing makes a leaked database useless for joining a household. The cost is that the plain code exists only in the call that creates it, the email hand-off and the printed slip.
- **The rule now:** Printing always makes new codes, and the old unused code stops working; the screen says so. The code is removed from the `mail` document after hand-off. Email links carry it after `#`, which keeps it out of server logs. The printed PDF says "Delete this file after printing". This lives in SA-001 §4.2 and §8.1.
- **Applies to:** invites, and any future one-time code or token.
