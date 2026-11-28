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

### L-006 — Size requirements against what the repo already has, starting with the mock-up's screens (2026-11-28)
- **What happened:** The owner asked that build estimates reuse what is already on the repo, "the index html given that UI are mostly built already there". The REQ-001 to REQ-004 sizes listed UI items, such as the role router and menus and the household list with search, as work without saying which already exist in `index.html` (for example `NAV` at line 546 and `aHo()` at line 758).
- **Why it happened:** L-002 ("port the screens, never the data handling") was applied to design but not to sizing, so porting a screen and building it new were sized alike.
- **The rule now:** Every Size section splits the work into port UI, extend UI, new UI, back end and tests, and names the mock-up function and line it reuses. Shared pieces (shell, ui kit, router, data layer, mail function) are counted once. The back end is always full size, because the mock-up's handlers are not reusable. This lives in the Sol Arch agent ("Sizing: reuse what is already in the repo").
- **Applies to:** every requirement review, change-impact analysis, roadmap and release-plan check.

### L-007 — With one SonarQube scan per release batch, findings pile up until the Demo deploy (2026-11-28)
- **What happened:** The owner moved the SonarQube scan from before every merge to once per release batch, before the Demo deploy ("let's run the scanner only before going to Demo"). Merges are no longer stopped by the gate.
- **Why it matters:** issues from many stories now surface together, late, on `main`, and a failing gate blocks the whole batch's Demo deploy. A cognitive-complexity or duplication finding in a shared helper may touch several stories at once, and each fix needs its own retest.
- **The rule now:** Dev follows the CODING-STANDARDS rules and the adopted Sonar rule table while writing code, and keeps unit coverage at ≥ 80% on every merge (Vitest), so the batch scan finds little. Leave time in the batch plan for fixing scan findings before Demo. Re-run the scan after the fixes and before the deploy. A finding is never waived to make a Demo date; that needs an ADR and the owner's approval (CODING-STANDARDS). Lives in CODING-STANDARDS ("SonarQube quality gate") and SA-001 §10.
- **Applies to:** every release batch, and Dev's and QE's Demo readiness checks.
