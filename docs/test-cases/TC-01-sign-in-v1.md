# TC-01: Sign in to the portal (v1.2)

| | |
|---|---|
| Enhancement / fix | Enhancement: new sign-in, account creation, password reset, sign-out and the "not linked" screen. Replaces the mock-up's open role switch and "Viewing as" picker |
| Source | [REQ-001 Sign in to the portal](../requirements/REQ-001-sign-in.md), **r4**, approved by the owner 2026-11-28 ("Approve r4"): answers QA's gaps G-1 to G-21 and adds owner decisions 3–5. Option A: email and password, or Google |
| Feature area | `AU` sign-in & roles |
| Related requirements | [REQ-002](../requirements/REQ-002-roles-and-permissions.md) roles (staff landing, no-access page, stale staff role) · [REQ-003](../requirements/REQ-003-household-directory.md) directory (reads `users` name and email) · [REQ-004](../requirements/REQ-004-invite-and-link.md) invites (where "Create account" lands; invite code kept through sign-in; membership removal) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open): no viewport meta, so phones never get the phone layout. Sign-in is the first page every homeowner sees on a phone, so block O re-checks it |
| App version | **Anticipated.** Planned ahead of the build. Today `main` holds only the browser mock-ups (`index.html`, `gentri-heights/index.html`), which have no sign-in |
| Mockup | Screens 1A, 1D–1M of [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html) (r4: 1G is now the single "Enter your invite code" page; new 1H sign-in states, 1I in-app browser, 1J create-account field errors, 1K "What's your name?", 1L verification banner, 1M guard holding page), plus 2C "no access" and 4B / 4C. 1B and 1C are the rejected options and are not tested. The published claude.ai copy has not been republished with r4 yet; the repo copy is the reference |
| Architecture | **Provisional.** [SA-001](../architecture/SA-001-hoa-portal-firebase-architecture.md) **r3** (`e28d9bc`) §3, §4.2, §8.1–§8.4, §9, §10, §11.2 and [ADR-004](../architecture/adr/ADR-004-roles-and-household-linking.md) / ADR-005 are **Draft** on branch `docs/sa-001-architecture`. REQ-001 r4's Sol Arch review adds rules and settings SA-001 doesn't carry yet: the `users` rule (create only; fields `name`, `email`, `createdAt`; name 1–80 characters and trimmed; **no update in R1**; `phone` dropped), refreshing the account once on every open, `GUARD_ROLE_ENABLED`, and "one account per email address". Every case tagged *(provisional: …)* names what it depends on and is re-checked when SA-001 is approved |
| Source files / functions touched (anticipated, per SA-001 §9) | `web/src/main.js` (boot, auth listener, role router), the sign-in / create-account / reset / not-linked views, the route guard, `firestore.rules` (`users/{uid}`, `members` self-read, deny by default), Firebase Auth project settings (§8.4). No Cloud Function is added by REQ-001 |
| Environment | Firebase **Emulator Suite** (Auth + Firestore) by default. **Emulator gaps** (Sol Arch review, 2026-11-28): the Auth emulator does not copy console settings; it has **email enumeration protection off** unless the seed turns it on (R9), **does not enforce the password policy**, may not reproduce the **Google takeover** of an unverified account, and does not model **token expiry** realistically. Cases that depend on those say **Env: staging only** and run on **`hoa-portal-staging`**. Block R inspects production projects **read-only, in the console, by the owner**. No sign-ins and no test data ever go to production |
| Author / date | QA, 2026-11-28 |
| Revision | **v1**, 2026-11-28: first version, approved by the owner ("Approve, send gaps"), gaps G-1 to G-14 sent to the BA. **v1.1**, 2026-11-28: Sol Arch and QA peer reviews applied (emulator limits and staging-only cases; Gmail-only Google takeover; stale token after disabling; `members` self-read; `users` rule matrix; sign-up write failure and email case; App Check and account-linking settings; XSS through the name; full per-case format; disposable fixtures; split cases; status enumeration per staff role; gaps G-15 to G-21), approved ("Approve and merge"); QE triaged it the same day. **v1.2**, 2026-11-28: aligned to **REQ-001 r4** (owner: "Yes, write v1.2"). The 16 blocked cases now have expected results; changed cases follow r4's wording; about 90 new cases cover r4's new scenarios; QE's findings for QA answered. See **v1.2 change log** near the end |
| Status | v1 and v1.1 **approved** by the owner, 2026-11-28; QE triaged v1.1. **v1.2 is awaiting the owner's approval.** New cases carry Layer `TBD — QE`; changed cases keep QE's layer unless the change log says otherwise. QE re-triages only the delta |

## Roles and what crosses between them

REQ-001 is about one person proving who they are, but several values it writes are read by another role or another screen.

### Round-trip register

| Field / value | Written where, by whom | Read back where, by whom | Case |
|---|---|---|---|
| `users/{uid}.name`, email path | "Create an account" form, by the person; trimmed, 1–80 characters (r4) | Dashboard greeting "Welcome back, {first word}" (the person); household detail "People with portal access" (admin office, REQ-004 4E); directory (REQ-003) | F8, F32, A3, A5–A7, Q9, G16, Q10 |
| `users/{uid}.name`, Google path | The Google profile name, cut to 80 and trimmed (r4, G-2); if Google has none, the "What's your name?" page (1K). Written once, never overwritten by later Google changes | Same readers as above | F28–F31, F12, F24 |
| `users/{uid}.email` | The app, from the **Auth account's** email, never the typed value (rule: `email == request.auth.token.email`); typed emails are trimmed first (r4, G-4) | Household detail (admin office, REQ-004 4E); directory (REQ-003) | F8, F9, F10, J14 |
| Signed-in email shown on "Enter your invite code", "What's your name?" and the guard holding page | Firebase Auth (the account's email, not `users.email`) | The person: "Signed in as {email}" under the form | I4, F24, Q6 |
| `users/{uid}.phone` | **Not collected** (r4, G-3). The household's mobile is the office-entered `householdContacts.contactMobile` (REQ-003) | — | J11 (a `phone` field is refused) |
| `users/{uid}.createdAt` | The app at account creation; must equal server time *(provisional: Sol Arch to add to SA-001 §4.2)* | **Deliberately not shown** in R1 | J15 |
| Email verified (Firebase Auth) | Firebase, when the person opens the verification link; the app refreshes the account once on every open (r4) | The person: the banner under the top bar on every signed-in page. Admin office: **deliberately not shown** (r4 Out of scope) | F4, F5, F6, F15–F19 |
| Pending invite code (`sessionStorage`, from a `…/join#code` link) | The app, when a signed-out person opens an invite link (REQ-004) | REQ-004 4C "You're joining {lot}" after sign-in or account creation; cleared after redeeming (TC-04) | Q7, Q8, D21 |
| Typed email carried between pages (r4, G-7) | The sign-in, reset and create-account pages, in the page's memory only | The next page's Email field (reset ↔ sign-in; duplicate-email message → sign-in or reset; Google "already has a password" → sign-in) | M16–M19, G4, G5, H7, S3 |
| Page asked for before sign-in (r4, G-11) | The route guard, in memory, as a portal route (never a web address, never in the page address) | The landing after sign-in | M3, M12–M15, M20 |
| Sign-in provider (password / Google) | Firebase, at sign-in, on Google takeover, or when a reset adds a password (r4, owner decision 5b) | The person only, indirectly. Deliberately not shown to anyone | H1–H8, E10–E12 |
| Signed-in state | Firebase Auth (persisted on the device, synced across tabs) | Every screen's route guard | K, L, M |

No household or membership data is written by REQ-001 (REQ-001 Data: "No household data is created by signing in"). F7 asserts that.

### Status enumeration: where a signed-in person lands

The route guard is a status-gated rule: what the person sees depends on the state of their account. One row per state the account can hold, cross-checked against the copy (r4).

| Account state | Lands on | Copy that promises it | Case |
|---|---|---|---|
| Signed out | Sign-in page (1A) | "Sign in to {HOA name}" | M1, M2 |
| Signed out, opened a portal link first | Sign-in page, then the page asked for after sign-in (REQ-002's access check still applies) | r4 "Signing in from a link…" | M3, M12, M13 |
| No household, no role: just created, reloaded, next day, or opened a household address | **"Enter your invite code"**, with the not-linked line above the code field (r4, G-18: one page) | "Your account isn't linked to a household yet. Enter the invite code from the admin office." | F2, I1, I3, I5, I6, M15 |
| No household, no role, signed in from an invitation link | REQ-004's lot confirmation (4C) | r4 "A not-linked person who signs in from a link" | Q7, Q8 |
| No stored name (Google profile with no name, or the record failed to save and the name is lost) | **"What's your name?"** (1K), then the next row that applies | "What's your name?" | F12, F22, F31 |
| Linked to one household | That household's dashboard, or the page asked for | "Welcome back, {first word}" (or "Welcome back" with no name) · header lot label | A1, A2, A5–A7, B1 |
| Staff: treasurer, admin office or board only | Staff dashboard (REQ-002) | REQ-002 | Q4 |
| Staff role and a household | Staff view with the REQ-002 view switch | REQ-002 2B | Q5 |
| **Guard only, R1** (gate screens not released) | **Guard holding page** (1M), no menu (owner decision 4) | "Gate screens aren't open yet" | Q6, J27 |
| **Guard and a household, R1** | That household's dashboard with the homeowner menu; no gate menu, no "Guard" in the view switch | r4 "A guard who is also linked to a household, in R1" | Q13 |
| Email not verified (any row above) | Same landing, plus the banner under the top bar | "Check your email to verify your address. · Send again" | F4, F19 |
| Household membership removed while signed in (REQ-004) | "Enter your invite code" on the next read | REQ-004 | Q11 (UI), TC-04-K2 (rules) |
| Staff role removed while signed in | Refused on the next request, re-routed | REQ-002 | Owned by TC-02 (cross-reference, Q12) |
| Account turned off, signed out | Refused; "This account is turned off. Contact the admin office." if Firebase reports it, otherwise the message for that failure | Copy of record "Turned-off account" | D11, D13 |
| Account turned off while signed in | Signed out on the **next open or reload** (the app refreshes the account on every open), with the turned-off message; within an hour if the portal stays open | Same | D12, D14 |
| Password older than the 8-character policy (test projects only) | Refused at sign-in, with a link to reset (owner decision 3) | Copy of record "Password older than the policy" | S2–S4 |
| Signed in, deep link to another household's page | "You don't have access to this page" (2C) | Copy of record "No access" | J1, J2, M12 |

Email-verified has two values. Google accounts normally arrive verified; F14 asserts `emailVerified` on staging rather than assuming it.

## Test plan

### 1. Smoke

**Smoke changes.** REQ-001 adds a gate in front of every screen, so the standing smoke pass (SMK-owner-\*, SMK-admin-\*, SMK-guard-\*, which today open the mock-up with no sign-in) cannot reach any screen without a signed-in fixture once the real app exists. QE needs:

- **New smoke item: the sign-in page loads** signed out, with its heading (HOA name filled in), the Google button and the email form, no page error (M1, M2).
- **New smoke item: the not-linked screen loads** for the not-linked fixture (I1).
- **Every existing role smoke item now starts from a signed-in fixture** (homeowner, treasurer, admin office, board, guard) instead of the role switch. The role switch (NAV-02) and "Viewing as" are removed by REQ-001/REQ-002; their rows retire or move (see Regression).

### 2. Acceptance

Every Gherkin scenario in REQ-001 r4 has at least one case.

| # | Gherkin scenario (REQ-001 r4) | Cases |
|---|---|---|
| S1 | A linked homeowner signs in with Google | A1, A2 |
| S2 | A linked homeowner signs in with email and password | B1 |
| S3 | A wrong password does not reveal whether the email exists *(r4-changed)* | C1–C6, C12, C14, N6 |
| S4 | Resetting a forgotten password | E1–E4 |
| S5 | Firebase refuses a sign-in because of too many attempts | D1, D2 |
| S6 | Creating an account | F1, F2, F3, F7 |
| S7 | Creating an account with an email that already has one | G1, G2, G3 |
| S8 | A password that is too short | G6, G7, G8, G9 |
| S9 | Google sign-in on an unverified account with the same address | H1, H2, H3 |
| S10 | Signed in but not linked to any household *(r4-changed, outline)* | I1–I6, F2, J4–J9 |
| S11 | A homeowner cannot open another household's page | J1, J2 |
| S12 | Signing out on a shared phone | K1, K2, K3, K6 |
| S13 | Staying signed in on her own phone | L1 |
| S14 | Field checks on the sign-in, create-account and reset pages (outline, 10 rows) | C7, C8, C9, G18, E15, G12, G19, G15, G20, E14 |
| S15 | After a failed check, focus goes to the first field with an error | N20 |
| S16 | Errors about the whole form sit above it | N6 |
| S17 | The name is stored without surrounding spaces | F32 |
| S18 | Spaces around the email are ignored (outline: sign-in, reset, create-account) | C11, E13, G14 |
| S19 | Spaces in a password are kept | C15 |
| S20 | Signing up with Google takes the name from Google | F28 |
| S21 | A Google account with no name is asked for one | F12, F24, F25, F26, F27 |
| S22 | The greeting uses the first word of the name (outline) | A3, A5, A6 |
| S23 | Later Google name changes don't overwrite the stored name | F29 |
| S24 | The person record could not be saved when the account was made | F11, F20, F21, F22, F23 |
| S25 | While Google sign-in is open | D15, D16, P4 |
| S26 | Closing the Google window without choosing an account | D9 |
| S27 | The browser blocks the Google window | D10 |
| S28 | Google sign-in fails for another reason | D17 |
| S29 | Opening the portal inside an app's own browser | D19–D24, T1 |
| S30 | Google sign-in on an address that already has a password account | H6, H7, H8 |
| S31 | Google sign-in on a verified Gmail address that already has a password | H5 |
| S32 | The typed email goes with the person to the reset page and back | M16, M17, M18 |
| S33 | From "There's already an account" to signing in | G4, G5 |
| S34 | The carried email never appears in the page address | M19 |
| S35 | Offline on each signed-out page (outline, 5 rows) | D4, D5, D7, D18, D8 |
| S36 | Where the "verify your email" banner shows | F4, F15, F16, F19 |
| S37 | Sending the verification email again | F5, F17, P6 |
| S38 | Firebase refuses another verification email | F18 |
| S39 | The banner goes once the email is verified | F6 |
| S40 | A turned-off account at sign-in (outline: password, Google) | D11, D13 |
| S41 | An account turned off while signed in | D12 |
| S42 | An account turned off while the portal stays open | D14 |
| S43 | Signing in from a link returns to the page asked for | M3, M20 |
| S44 | A link to a page the person may not open | M12 |
| S45 | A return address in the page address is ignored (outline) | M13, M14 |
| S46 | A not-linked person who signs in from a link | M15, Q7, Q8 |
| S47 | A password set before the 8-character policy (owner decision 3) | S2, S3, S4 |
| S48 | A Google-only account asks for a password reset (owner decision 5b) | E10, E11, E12 |
| S49 | A guard account in R1 (owner decision 4) | Q6, J27 |
| S50 | A guard who is also linked to a household, in R1 | Q13 |
| Background | Email enumeration protection on; password policy Require (enforcement and force upgrade), min 8 | R1, R2, R9 (and C5, G9 prove them at the server) |
| UX/UI notes | Accessibility, where errors go, when fields are checked, forms, consistency, mobile-first, states, verification banner, Google window, safe actions, roles | N1–N21, O1–O5, D15, D16, P1–P7, F33, E16, F25 |
| Copy of record | Every line | N19 (static strings), plus the case for each message |

### 3. Regression

What else could break, and why:

- **The whole existing UI suite assumes no sign-in.** `tests/specs/ui/` (smoke, navigation, vehicle-registration) opens `index.html` and uses the role switch. Once the real app has a sign-in gate, every spec needs a signed-in start. NAV-01 ("Opens as Homeowner on the dashboard"), NAV-02 (role switch), NAV-04 ("Role and screen survive a reload") change meaning: role now comes from the account, and a reload must keep the **session** (L2), not a `localStorage` role. QE to re-baseline these rather than let them fail for the wrong reason. **Top regression risk.**
- **Tests that pass on the emulator for the wrong reason.** The Auth emulator does not apply enumeration protection unless seeded, and never applies the password policy. A suite that runs only on the emulator would "prove" C5, E3, E4, G9 against settings production has and the emulator lacks, or fail them for reasons unrelated to the app. R9 makes the seed explicit; staging-only cases cover the rest.
- **DEF-001 (open).** Neither mock-up has the viewport meta tag. If the real app's shell is lifted from `index.html` without it, the sign-in page renders as a shrunk desktop on every phone. Re-run NAV-07 and NAV-08 under the `mobile` project, and O1 here.
- **Important-announcement pop-up (NAV-05).** The mock-up's Announcements screen promises a pop-up "when they sign in". After REQ-001 it must appear only after sign-in, on the dashboard, and never on the sign-in page or the not-linked screen (Q1–Q3).
- **`users/{uid}` is shared with REQ-003 and REQ-004.** The admin directory and household detail read name and email written here. A rules change that lets a person write a role field, or read another person's `users` doc, breaks REQ-002's isolation (J12–J23). A name with markup written here renders in the admin office's screens (Q10).
- **The route guard is shared by every screen of every role.** A guard bug leaks data on every page (J1, J2, I5, K3, M1, M11). It depends on an own-uid `members` query that rules must allow (J4).
- **Invite code kept through sign-in (REQ-004).** Sign-in changes can drop the `sessionStorage` code (Q7, Q8); "Copy link" in an in-app browser must carry it too (D21).
- **r4 adds three more shared pieces.** The person record must exist before `redeemInvite` (REQ-004 follow-up; F20), so a sign-up failure now blocks linking unless the app repairs it. The route guard keeps the asked-for page (M3, M13), which every later requirement's email links rely on. And a guard account now has a landing of its own (Q6, Q13), which REQ-002's view switch must not undo.
- **`users` can no longer be updated in R1** (r4 rule). Anything later that wants "edit my name" needs a rules change; J17 proves the refusal today.
- **Mock-up `localStorage` state.** The mock-up persists `{S, UI}` including `UI.role`. SA-001 §11.2 says mock-up browser data is never migrated (S1).
- **Failure patterns** (from `qa.md`), each applied or ruled out:
  - Copy promises what the code doesn't do: E2, F1, F5 prove the email exists, not just the message.
  - A value written for one role, never shown back: round-trip register; r4 settled the two rows that were blocked (Google-path name, phone).
  - A status-gated rule checked for one transition only: status enumeration above; H1–H6 cover each provider / verified combination.
  - Same concept, different word: N15.
  - Dates in UTC where the user means local: L1 builds "the next day" from the local date (Asia/Manila).
  - A derived figure doesn't refresh after a related write: the banner after verifying (F6); the not-linked screen after redeeming a code is TC-04's.
  - Zero vs "not set": F12 (no name on a Google profile).
  - A write silently refused by rules: J12–J21 assert each refusal explicitly; F11 covers the `users` write refused after the Auth account exists.
  - Double-tap / two devices: P1–P6, K8.
  - Stale reference: D12 (disabled account's token), Q11 (membership removed), Q12 (staff role, TC-02).
  - Backdrop click loses work: **does not apply**; REQ-001 has no modal that holds input.
  - A modal appearing mid-flow: Q1–Q3.
  - Assumed SDK / network behaviour: D4, H4, H5, K8, L1 are marked as assumptions; emulator gaps in the header.
  - Data leaking across households or roles: J1, J2, K6, K7, J20, J23.

**Re-run list for QE:** `smoke.spec.js` (all roles, from signed-in fixtures), `navigation.spec.js` NAV-01 to NAV-08 (re-baselined), `vehicle-registration.spec.js` VEH-J1 (homeowner and admin now sign in), and TC-02 to TC-04 cases that start "Given … is signed in".

## All scenarios, by type

Listed before the steps, as the owner's rule requires. Each is one behaviour.

- **Happy path:** Google sign-in lands on the linked dashboard (A1) with the lot in the header (A2); password sign-in (B1); account creation sends a verification email (F1) and lands on "Enter your invite code" (F2); Google sign-up takes the Google name (F28); a no-name Google account names itself (F24); reset email created (E2); new password signs in (E5); deep link returns to the page asked for (M3); sign-out lands on sign-in (K1); session kept the next day (L1).
- **Negative:** wrong password (C1, C14); unknown email (C3); server refuses both alike (C5); field checks (C7–C9, C16, E14, E15, G12, G18–G20); Google-only account using the email form (C12); too many attempts (D1); offline on every page (D4, D5, D7, D8, D18); Google window closed, blocked or failing (D9, D10, D17); turned-off account (D11–D14); duplicate email (G1); short password (G6, G9); unknown email reset (E3, E4); Google on an address with a password (H6–H8); record not saved (F11, F26); open redirect (M13); guard-only account (Q6, J27); every rules refusal in block J.
- **Boundary:** 7 / 8 characters (G6, G10); 80 / 81-character name (G15, J25, J26); one-character name (G21); long passphrase (G11); password ending in a space (C15); email capitals (C10, F9, G13) and surrounding spaces (C11, E13, F10, G14); name with surrounding spaces (F32, J24); Google name over 80 or only spaces (F30, F31); first word, one word, no name, "Ma." (A3, A5–A7); session across a local day boundary (L1); 15-second save limit (F11, F26); 10-second Google close (D9).
- **Usability:** N1–N21, D19–D23.
- **Navigation:** M1–M20, K2, K3, I2, I3, I6, J3, D3, E9, G4, G5, S3.
- **Role / security:** J1–J27; K4–K7; C5, C6, C13, E3, E4; H2, H3, H6; G16; M13, M14, M18, M19; Q6, Q13; R1–R10.
- **Integration:** F2, F20, Q1–Q13, E10–E12.
- **Concurrency:** P1–P7; K8.
- **Back-compat:** S1, S2–S4.
- **Responsive:** O1–O5, G17.
- **UI/UX:** states (N12, D15, F25, F33, E16, F17 loading; C1 error; A1 success; D4 offline; F4 unverified); N15, N16, N19.
- **Data integrity:** F7, F8, F9, F11, F20, F21, F23, H4, P2.
- **Exploratory:** T1–T4.

---

## Test data (fixtures)

All in the emulator seed or the staging test data. Never a real homeowner, never production. QE maps them to `.env`. The REQ's personas map to these fixtures. People carry a "ZZTest" **surname** so the greeting's first word stays "Maria", "Juan" and so on; households and emails carry the "ZZ Test" prefix. The lot labels "Blk 1 Lot 3" and "Blk 4 Lot 12" are seed data for the emulator and staging only and are never imported into a production project.

**Shared fixtures are read-only.** A case that changes an account or a membership (disable, takeover, reset, removal) uses a **disposable copy** made for that run, named in its setup.

| Fixture | Account | Linked to | Used for |
|---|---|---|---|
| **U-G** "Maria ZZTest" | Google provider (emulator fake Google user; a team test Google account on staging) | ZZ Test Household A, "Blk 1 Lot 3" | A, K, L, J1, J2 |
| **U-P** "Juan ZZTest" | Email + password, verified, `zz-owner-juan@<test domain>` | ZZ Test Household B, "Blk 4 Lot 12" | B, C, D, J, K6 |
| **U-N** "Ana ZZTest" | Email + password, verified, no household, no role | — | I, J4–J9, Q3 |
| **U-GM-UV** | Email + password, **never verified**, on a **team-owned `@gmail.com`** address, so the same address can sign in with Google. **Staging only.** Disposable: recreated each run | ZZ Test Household C | H1–H4 |
| **U-GM-V** | Email + password, **verified**, team-owned `@gmail.com`. Staging only. Disposable | ZZ Test Household F | H5 |
| **U-DOM-UV** | Email + password, unverified, on the team's own (non-Gmail) domain, which also has a Google account. Staging only. Disposable | — | H6 |
| **U-TR** "Carmela ZZTest" | Verified, staff role `treasurer` | — | Q4 |
| **U-TRH** "Paolo ZZTest" | Verified, `treasurer`, and linked to ZZ Test Household D | Household D | Q5 |
| **U-AD** "Rina ZZTest" | Verified, staff role `admin` (admin office) | — | Q4, Q9, Q10 |
| **U-BD** "Teresa ZZTest" | Verified, staff role `board` | — | Q4, J23 |
| **U-GD** "Gardo ZZTest" | Verified, staff role `guard`, no household (on a project where the guard role can be granted, i.e. the emulator or staging) | — | Q6, J23, J27 |
| **U-GD-H** "Rodel ZZTest" | Verified, staff role `guard`, and linked to ZZ Test Household G | Household G | Q13 |
| **U-GC** "Carlo ZZTest" | **No account yet**; an emulator fake Google user whose profile name is "Carlo ZZTest". Disposable | — | F28, F29 |
| **U-GN** | **No account yet**; an emulator fake Google user with **no** profile name (and a variant whose name is only spaces). Disposable | — | F12, F24–F27, F31 |
| **U-OLDPW** "Teo ZZTest" | **Staging only.** Email + password with a 6-character password, created before the policy was set on a disposable staging test project or by an admin script that bypasses the policy | ZZ Test Household B copy | S2–S4 |
| **U-NONE** | No account. `zz-nobody@<test domain>` | — | C3, C4, E3, E4 |
| **U-NEW** | Created by the case. `zz-new-<run id>@<test domain>` | — | F, G, P |

`<test domain>` is a domain the team controls. The Gmail fixtures are the one exception: they are `@gmail.com` accounts the team owns, because Firebase trusts Google as a provider only for Gmail addresses. **Staging note:** Firebase sends verification and reset emails itself, so SA-001 §10's mail allow-list (a check in our mail function) does **not** cover them. On staging, never type an address the team doesn't control. On the emulator, emails are not sent; their links are read from the emulator's out-of-band codes.

**Writes convention:** **Yes** when the case changes Auth or Firestore state, or makes Firebase create an email (out-of-band code). **No** otherwise.

---

## Layer legend (QE)

QE filled in each case's **Layer** at triage on 2026-11-28. Nothing else in a case was changed. The reasoning, locator contract, spec list, automation order and findings are in **QE triage** at the end. Rows are in [COVERAGE-MAP.md](COVERAGE-MAP.md).

| Layer | Meaning here | Owner |
|---|---|---|
| **Unit** | Vitest on a plain module (no DOM, no Firebase, no network): copy mapping, validation, greeting, landing choice, the in-flight guard behind an injected auth port | Dev writes, QE reviews |
| **API** | The Auth and Firestore emulators, called directly (SDK, REST, `@firebase/rules-unit-testing`) or through the app's own data modules in Node. No browser | QE |
| **API (staging)** | The same kind of test, run on `hoa-portal-staging` because the emulator can't prove it (password policy, App Check). Read-only, or a disposable account only | QE |
| **UI** | Playwright against the emulator-backed app: what only a browser shows, plus the wiring from a click to Auth | QE |
| **Manual (staging)** | Run by hand on staging: real Google accounts, real inboxes, App Check with a real browser | QE |
| **Manual (console)** | Read-only settings check in the Firebase console. On production, **only the owner** does it | Owner (production), QE (staging) |
| **Manual** | A judgement call, a real phone keyboard, or an exploratory charter | QE |

No **Journey** row is added for REQ-001. Sign-in is a gate in front of every other journey, so the existing journeys (VEH-J1 and the planned ones) prove it once they start from signed-in fixtures.

---

## Block A — Sign in with Google (S1)

### TC-01-A1 — A linked homeowner signing in with Google lands on her dashboard, greeted by her first name
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G, signed out.
- **Action:** Open the portal. Press "Continue with Google". Choose U-G's account.
- **Expected:** The dashboard opens with the heading "Welcome back, Maria".
- **Don't assert:** dashboard figures; Google's own popup screens.

### TC-01-A2 — After Google sign-in, the header shows the linked lot
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G, signed out.
- **Action:** As A1.
- **Expected:** The header reads "Blk 1 Lot 3".
- **Don't assert:** any other header content.

### TC-01-A3 — The greeting uses the first word of the stored name
**Priority** P3 · **Type** Boundary · **Layer** Unit · **Writes** No
- **Role / setup:** Homeowner, U-G ("Maria ZZTest").
- **Action:** Sign in.
- **Expected:** "Welcome back, Maria", not the full name (REQ-001 r4, "The greeting uses the first word of the name").
- **Don't assert:** one-word and missing names (A5, A6).

### TC-01-A4 — Google sign-in uses the popup flow, not a redirect *(provisional: SA-001 §8.4)*
**Priority** P2 · **Type** Security / config · **Layer** Manual (staging) · **Writes** No
- **Role / setup:** Homeowner, U-G. **Env: staging only**, in a browser that blocks third-party storage (current Chrome, Firefox, Safari defaults).
- **Action:** Press "Continue with Google" and choose the account.
- **Expected:** A popup opens and the portal page is signed in afterwards. If the build uses a redirect, it is served from the project's own `authDomain` and still signs in.
- **Don't assert:** popup size or Google's screens.

### TC-01-A5 — A one-word name is greeted in full
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner whose stored name is one word ("Bong"), linked to a test household.
- **Action:** Sign in.
- **Expected:** "Welcome back, Bong".
- **Don't assert:** the header.

### TC-01-A6 — A homeowner with no stored name is greeted without a name
**Priority** P2 · **Type** Boundary (zero vs not set) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner linked to a test household whose `users` doc has no name (seeded directly).
- **Action:** Sign in.
- **Expected:** "Welcome back", with no comma or blank after it; never "undefined" or "null".
- **Don't assert:** whether "What's your name?" appears first (F22 covers a missing record).

### TC-01-A7 — A name starting with an abbreviation greets with it (accepted limitation)
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner whose stored name is "Ma. Cristina ZZTest".
- **Action:** Sign in.
- **Expected:** "Welcome back, Ma." (REQ-001 r4 accepts this; a preferred name is out of scope).
- **Don't assert:** anything else on the dashboard.

## Block B — Sign in with email and password (S2)

### TC-01-B1 — A linked homeowner signing in with email and password lands on his dashboard
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-P, signed out.
- **Action:** Type U-P's email and password. Press "Sign in".
- **Expected:** The dashboard for "Blk 4 Lot 12" opens.
- **Don't assert:** dashboard figures.

## Block C — Wrong credentials do not reveal accounts (S3)

### TC-01-C1 — A wrong password shows the shared message above the form
**Priority** P1 · **Type** Negative · **Layer** UI · **Writes** No
- **Role / setup:** Anyone, signed out. U-P exists.
- **Action:** Type U-P's email and a wrong password. Press "Sign in".
- **Expected:** "That email and password don't match. Try again, or reset your password." above the form, inside the card, not under a field. Not signed in.
- **Don't assert:** the second line (C14); the error code.

### TC-01-C2 — After a wrong password the email stays in the field
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Role / setup:** As C1.
- **Action:** As C1.
- **Expected:** The email field still holds U-P's email.
- **Don't assert:** the password field (N7).

### TC-01-C3 — An email with no account shows the same message as a wrong password
**Priority** P1 · **Type** Security / negative · **Layer** UI · **Writes** No
- **Role / setup:** Anyone, signed out. U-NONE. Enumeration protection on (R9 seed, or staging).
- **Action:** Type U-NONE's address and any password. Press "Sign in".
- **Expected:** Exactly the C1 message, in the same place, with no extra hint.
- **Don't assert:** response timing.

### TC-01-C4 — After an unknown email, the email stays in the field
**Priority** P3 · **Type** Usability · **Layer** UI · **Writes** No
- **Role / setup:** As C3.
- **Action:** As C3.
- **Expected:** The email field still holds U-NONE's address.
- **Don't assert:** the password field.

### TC-01-C5 — The server refuses a wrong password and an unknown email identically *(provisional: SA-001 §8.4)*
**Priority** P1 · **Type** Security · **Layer** API · **Writes** No
- **Role / setup:** No app role (direct Auth call). Enumeration protection on: **staging**, or the emulator with R9's seed asserted first.
- **Action:** Call sign-in for U-P with a wrong password, and for U-NONE, bypassing the page.
- **Expected:** Both refusals are identical (same error, same shape). Neither says whether the email exists.
- **Don't assert:** the error code's name (it differs between the REST API and SDK versions).

### TC-01-C6 — The page shows the shared message for every credential error code
**Priority** P2 · **Type** Security · **Layer** Unit · **Writes** No
- **Role / setup:** Anyone, signed out. Auth error mocked, one at a time, as `auth/invalid-credential`, `auth/invalid-login-credentials`, `auth/user-not-found`, `auth/wrong-password`.
- **Action:** Submit the sign-in form for each.
- **Expected:** Each shows the C1 message. (Guards against a page that maps old codes to different copy if enumeration protection is ever off.)
- **Don't assert:** which code the live SDK returns.

### TC-01-C7 — An empty email is refused before any request
**Priority** P2 · **Type** Negative · **Layer** Unit · **Writes** No
- **Role / setup:** Anyone, signed out, on the sign-in page.
- **Action:** Leave Email empty, type a password, press "Sign in".
- **Expected:** "Enter your email address" under the Email field; the field is marked invalid; no sign-in request is sent; the password is not cleared.
- **Don't assert:** focus (N20).

### TC-01-C8 — An empty password is refused before any request
**Priority** P2 · **Type** Negative · **Layer** Unit · **Writes** No
- **Role / setup:** Anyone, signed out, on the sign-in page.
- **Action:** Type an email, leave Password empty, press "Sign in".
- **Expected:** "Enter your password" under the Password field; no request; email kept.
- **Don't assert:** focus (N20).

### TC-01-C9 — A malformed email is flagged when the person leaves the field
**Priority** P3 · **Type** Negative · **Layer** Unit · **Writes** No
- **Role / setup:** Anyone, signed out, on the sign-in page.
- **Action:** Type `juan.example.com` in Email and move to the next field.
- **Expected:** "Enter an email address like name@example.com" under Email; the field is marked invalid; typing kept; nothing sent.
- **Don't assert:** which validator library is used.

### TC-01-C10 — An email typed with capitals still signs in
**Priority** P2 · **Type** Boundary · **Layer** API · **Writes** No
- **Role / setup:** Homeowner, U-P, signed out.
- **Action:** Type U-P's email with capitals (`ZZ-Owner-Juan@…`) and the right password.
- **Expected:** Signs in as U-P. **Assumption:** Firebase compares emails case-insensitively, and the emulator matches production here (QE finding 5); if not, QE moves it to staging.
- **Don't assert:** how the email is displayed afterwards.

### TC-01-C11 — An email typed with spaces around it still signs in
**Priority** P2 · **Type** Boundary · **Layer** Unit · **Writes** No
- **Role / setup:** Homeowner, U-P, signed out.
- **Action:** Type " " + U-P's email + " " (a space before and after) and the right password; press "Sign in".
- **Expected:** Signs in as U-P and lands on Household B's dashboard (REQ-001 r4: spaces around every typed email are removed).
- **Don't assert:** what the field shows after trimming.

### TC-01-C12 — A Google-only account using the email form gets the shared message
**Priority** P2 · **Type** Negative · **Layer** API · **Writes** No
- **Role / setup:** Homeowner, U-G (Google only, no password), signed out.
- **Action:** Type U-G's email and any password. Press "Sign in".
- **Expected:** The same alert as C1 and C14, both lines: nothing that says this account uses Google only.
- **Don't assert:** the error code.

### TC-01-C13 — No page decides what to show by asking Firebase which sign-in methods an email has
**Priority** P3 · **Type** Security · **Layer** Unit · **Writes** No
- **Role / setup:** Code review; no app role.
- **Action:** Search the web app for `fetchSignInMethodsForEmail`.
- **Expected:** Not used to branch any page (with enumeration protection on it returns nothing).
- **Don't assert:** anything about Firebase's internals.

### TC-01-C14 — The wrong-password alert's second line points to Google, in the same alert
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As C1.
- **Action:** As C1.
- **Expected:** Under the first line, in the **same** `role="alert"` region (announced once): "Signed up with Google? Use Continue with Google." It shows for a wrong password, an unknown email and a Google-only account alike (owner decision 5a).
- **Don't assert:** styling of the second line.

### TC-01-C15 — A password ending in a space signs in only with the space
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. A disposable copy of U-P whose password ends with a space.
- **Action:** Sign in with the password including the space; then sign out and try it without the space.
- **Expected:** With the space: signs in. Without: the C1 message. Passwords are never trimmed (REQ-001 r4).
- **Don't assert:** what the field shows.

### TC-01-C16 — An email with a space inside it is refused as malformed
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out, on the sign-in page.
- **Action:** Type `zz owner@example.com` and leave the field.
- **Expected:** "Enter an email address like name@example.com"; nothing sent.
- **Don't assert:** the validator library.

## Block D — Refusals from Firebase and the network (S5 and UX states)

### TC-01-D1 — "Too many attempts" shows its message
**Priority** P1 · **Type** Negative · **Layer** Unit · **Writes** No
- **Role / setup:** Anyone, signed out. Firebase's too-many-attempts error **mocked** for U-P's email (it cannot be triggered on demand).
- **Action:** Press "Sign in".
- **Expected:** "Too many attempts. Wait a while, or reset your password."
- **Don't assert:** how many tries trigger it or how long it lasts.

### TC-01-D2 — After "Too many attempts" the email stays in the field
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Role / setup:** As D1.
- **Action:** As D1.
- **Expected:** U-P's email is still in the field.
- **Don't assert:** the password field.

### TC-01-D3 — "Forgot password?" opens the reset page from the error state
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** As D1, after the message shows.
- **Action:** Press "Forgot password?".
- **Expected:** The reset page opens.
- **Don't assert:** the carried email (M16).

### TC-01-D4 — Signing in while offline shows the offline message
**Priority** P2 · **Type** Negative / UI-UX · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-P, signed out; browser offline.
- **Action:** Press "Sign in".
- **Expected:** "You're offline. Connect to the internet to sign in." **Assumption:** the SDK reports a network error rather than hanging.
- **Don't assert:** retry behaviour.

### TC-01-D5 — "Continue with Google" while offline shows the offline message
**Priority** P3 · **Type** Negative · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G, signed out; browser offline.
- **Action:** Press "Continue with Google".
- **Expected:** The D4 message; no popup stuck open.
- **Don't assert:** whether a popup briefly opens.

### TC-01-D6 — After the offline message, the button is ready again and typing is kept
**Priority** P3 · **Type** Usability · **Layer** UI · **Writes** No
- **Role / setup:** As D4.
- **Action:** As D4, then reconnect.
- **Expected:** "Sign in" is enabled; email and password are still typed; pressing it signs in.
- **Don't assert:** automatic retry.

### TC-01-D7 — Creating an account while offline shows the create-account offline message
**Priority** P3 · **Type** Negative · **Layer** UI · **Writes** No
- **Role / setup:** New homeowner, U-NEW details typed; browser offline.
- **Action:** Press "Create account".
- **Expected:** "You're offline. Connect to the internet to create your account." above the form; no account; everything typed kept.
- **Don't assert:** retry behaviour.

### TC-01-D8 — Asking for a reset link while offline shows the reset offline message
**Priority** P3 · **Type** Negative · **Layer** UI · **Writes** No
- **Role / setup:** Anyone, signed out, on the reset page with an email typed; browser offline.
- **Action:** Press "Send reset link".
- **Expected:** "You're offline. Connect to the internet to send the reset link." — not the "If there's an account…" message; email kept.
- **Don't assert:** retry behaviour.

### TC-01-D9 — Closing the Google window returns to a usable sign-in page within 10 seconds, with no message
**Priority** P2 · **Type** Negative · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G, signed out, with an email typed in the form.
- **Action:** Press "Continue with Google"; close the window without choosing.
- **Expected:** Within 10 seconds the button reads "Continue with Google" again and can be pressed; no message shows; the typed email is still there; not signed in.
- **Don't assert:** the exact delay under 10 seconds.

### TC-01-D10 — A blocked Google window tells the person how to continue
**Priority** P2 · **Type** Negative / usability · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G, signed out; pop-ups blocked for the site.
- **Action:** Press "Continue with Google".
- **Expected:** "Your browser blocked the Google sign-in window. Allow pop-ups for this site, or sign in with your email." above the form; the Google button can be pressed again.
- **Don't assert:** the browser's own pop-up indicator.

### TC-01-D11 — A turned-off account is refused at sign-in and sees no household data
**Priority** P2 · **Type** Negative · **Layer** API · **Writes** Yes
- **Role / setup:** Homeowner. A **disposable copy** of U-P, linked to Household B, turned off (disabled) in Auth.
- **Action:** Sign in with its email and any password.
- **Expected:** Not signed in; no household data. If Firebase reports the account as turned off: "This account is turned off. Contact the admin office." above the form; otherwise the message for that failure. **Assumption (emulator parity, QE finding 5):** the emulator reports it before checking the password (Sol Arch); production is Uncertain. That this reveals the account exists is an **accepted limitation** in REQ-001 r4.
- **Don't assert:** the error code.

### TC-01-D12 — A homeowner turned off while signed in is signed out on the next open or reload
**Priority** P2 · **Type** Stale reference · **Layer** UI · **Writes** Yes
- **Role / setup:** Homeowner. A disposable copy of U-P, signed in on the dashboard; then turned off in Auth.
- **Action:** Reload the portal.
- **Expected:** Signed out; the sign-in page with "This account is turned off. Contact the admin office."; no household data after that. (REQ-001 r4: the app refreshes the account once on every open.) **Assumption (emulator parity):** the emulator's refresh reports the disabled account as production does.
- **Don't assert:** timing beyond "on that reload". **Owner note:** removing the `members` doc (Q11) is still the instant cut-off.

### TC-01-D13 — Google sign-in on a turned-off account is refused with no household data
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. A disposable copy of U-G (Google), linked to Household A, turned off.
- **Action:** Press "Continue with Google" and choose that account.
- **Expected:** Not signed in; no household data; the turned-off message if Firebase reports it, otherwise the Google failure message (D17).
- **Don't assert:** the error code.

### TC-01-D14 — With the portal left open, a turned-off account is signed out within an hour
**Priority** P3 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner, a disposable copy of U-P signed in on the dashboard. **Env: staging only** (real token expiry). Then turned off in Auth.
- **Action:** Leave the portal open, untouched, for up to an hour; then try to sign in again.
- **Expected:** Within an hour, the sign-in page; no household data after that; signing in again shows "This account is turned off. Contact the admin office."
- **Don't assert:** the minute it happens.

### TC-01-D15 — While the Google window is open, its button reads "Opening Google…" and is disabled
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G, signed out.
- **Action:** Press "Continue with Google" and look at the button before choosing an account.
- **Expected:** "Opening Google…", disabled.
- **Don't assert:** the popup's content.

### TC-01-D16 — While the Google window is open, the email form's button is disabled too
**Priority** P3 · **Type** Safe actions · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out, on the sign-in page; separately on the create-account page.
- **Action:** Press "Continue with Google"; look at "Sign in" (or "Create account").
- **Expected:** Disabled until the Google window closes or finishes.
- **Don't assert:** styling.

### TC-01-D17 — Any other Google sign-in failure shows the generic Google message
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out. Google sign-in error **mocked** as one not covered elsewhere (e.g. a network error inside the popup, an internal error).
- **Action:** Press "Continue with Google".
- **Expected:** "Google sign-in didn't work. Try again, or sign in with your email." above the form; the button can be pressed again.
- **Don't assert:** which codes map here beyond the mocked one.

### TC-01-D18 — "Continue with Google" while offline on the create-account page shows the create-account offline message
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** New homeowner, on "Create an account"; browser offline.
- **Action:** Press "Continue with Google".
- **Expected:** "You're offline. Connect to the internet to create your account."; typing kept.
- **Don't assert:** whether a popup briefly opens.

### TC-01-D19 — In an app's built-in browser, a notice sits above the Google button
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out; the page opened with a user agent from the in-app list (e.g. Facebook Messenger's in-app browser).
- **Action:** Open the sign-in page.
- **Expected:** Above "Continue with Google": "Google sign-in doesn't work inside this app. Open this page in Chrome or Safari, or sign in with your email." and a "Copy link" button.
- **Don't assert:** which apps are on the list (T1 checks real apps).

### TC-01-D20 — In an app's built-in browser, the Google button stays and email sign-in works
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As D19, homeowner U-P.
- **Action:** Look for the Google button; then sign in with email and password.
- **Expected:** The Google button is still shown; email sign-in lands on Household B's dashboard.
- **Don't assert:** what Google does if pressed there (Google's own refusal page, accepted).

### TC-01-D21 — "Copy link" copies the full page address, including an invite code
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As D19, having opened an invite link `…/join#<code>`.
- **Action:** Press "Copy link".
- **Expected:** The clipboard holds the full address including `#<code>`.
- **Don't assert:** clipboard permission prompts.

### TC-01-D22 — "Link copied" shows only once the copy has worked
**Priority** P3 · **Type** UI/UX (copy promises an outcome) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As D19. Clipboard write mocked to succeed, then to fail.
- **Action:** Press "Copy link" in each case.
- **Expected:** Success: "Link copied. Paste it into Chrome or Safari." Failure: that text does **not** show (D23 applies).
- **Don't assert:** how long the confirmation stays.

### TC-01-D23 — When copying is blocked, the address shows selected with "Press and hold to copy"
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As D19, with clipboard writes blocked.
- **Action:** Press "Copy link".
- **Expected:** The page address shows in a box, selected, with "Press and hold to copy".
- **Don't assert:** the box's styling.

### TC-01-D24 — In a normal browser, no in-app notice shows
**Priority** P2 · **Type** Negative (false positive) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out, in current Chrome on Android and Safari on iPhone user agents.
- **Action:** Open the sign-in page.
- **Expected:** No in-app notice and no "Copy link".
- **Don't assert:** the detection method.

## Block E — Resetting a forgotten password (S4)

### TC-01-E1 — Asking for a reset for an existing email shows the reset message
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** Yes
- **Role / setup:** Homeowner, U-P, signed out.
- **Action:** Press "Forgot password?", type U-P's email, press "Send reset link".
- **Expected:** "If there's an account for {U-P's email}, we've sent a link to reset the password. Check your spam folder too."
- **Don't assert:** whether the email arrived (E2).

### TC-01-E2 — Asking for a reset for an existing email creates exactly one reset link
**Priority** P1 · **Type** Happy path (copy promises an outcome) · **Layer** UI · **Writes** Yes
- **Role / setup:** As E1, emulator.
- **Action:** As E1.
- **Expected:** The emulator holds exactly one password-reset code for U-P.
- **Don't assert:** the email's wording.

### TC-01-E3 — Asking for a reset for an unknown email shows the same message
**Priority** P1 · **Type** Security / negative · **Layer** UI · **Writes** No
- **Role / setup:** Anyone, signed out. U-NONE. Enumeration protection on (R9 seed, or staging).
- **Action:** As E1 with U-NONE's address.
- **Expected:** The E1 message with that address in it; no error.
- **Don't assert:** response timing.

### TC-01-E4 — Asking for a reset for an unknown email sends nothing
**Priority** P1 · **Type** Security · **Layer** API · **Writes** No
- **Role / setup:** As E3.
- **Action:** As E3.
- **Expected:** No reset code exists for that address.
- **Don't assert:** server logs.

### TC-01-E5 — Following the reset link sets a new password that signs in
**Priority** P1 · **Type** Happy path / integration · **Layer** API · **Writes** Yes
- **Role / setup:** Homeowner. A disposable copy of U-P, linked to Household B; reset link from E2.
- **Action:** Open the link, set a new 8+ character password, sign in to the portal with it.
- **Expected:** Household B's dashboard.
- **Don't assert:** the wording of Firebase's reset page (not ours); link expiry.

### TC-01-E6 — After a reset the old password no longer signs in
**Priority** P1 · **Type** Security · **Layer** API · **Writes** No
- **Role / setup:** After E5, signed out.
- **Action:** Sign in with the old password.
- **Expected:** The C1 message.
- **Don't assert:** the error code.

### TC-01-E7 — A password reset ends the account's other signed-in sessions
**Priority** P2 · **Type** Security · **Layer** API · **Writes** Yes
- **Role / setup:** Homeowner. A disposable copy of U-P signed in on a second browser; then E5 runs in the first.
- **Action:** In the second browser, force a token refresh, then open a screen.
- **Expected:** The second browser is signed out (a reset revokes refresh tokens).
- **Don't assert:** when it happens without a forced refresh.

### TC-01-E8 — The reset page refuses a new password under 8 characters *(provisional: SA-001 §8.4)*
**Priority** P2 · **Type** Boundary · **Layer** API (staging) · **Writes** No
- **Role / setup:** Homeowner, disposable copy of U-P. **Env: staging only** (the emulator does not enforce the password policy).
- **Action:** Open a reset link; set a 7-character password.
- **Expected:** Refused.
- **Don't assert:** Firebase's wording.

### TC-01-E9 — "Back to sign in" on the reset page returns to the sign-in page
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** Anyone, signed out, on the reset page.
- **Action:** Press "Back to sign in".
- **Expected:** The sign-in page.
- **Don't assert:** carried-over values (M16, M17).

### TC-01-E10 — A Google-only account asking for a reset sees the usual message and gets a reset link
**Priority** P2 · **Type** Happy path (owner decision 5b) · **Layer** API · **Writes** Yes
- **Role / setup:** Homeowner, a disposable copy of U-G (Google only), signed out.
- **Action:** Ask for a reset for its email.
- **Expected:** The usual "If there's an account for {email}…" message, and a reset code exists for that address.
- **Don't assert:** what happens after the link is used (E11, E12).

### TC-01-E11 — After a reset adds a password to a Google-only account, the password signs in to the same account
**Priority** P2 · **Type** Security / data integrity · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner, a disposable copy of U-G linked to Household A; note its uid. **Env: staging only** (Sol Arch: confirmed on staging before go-live).
- **Action:** Open E10's link, set an 8+ character password, sign in with email and that password.
- **Expected:** Household A's dashboard; the same uid; no second account for the address.
- **Don't assert:** Firebase's reset page wording.

### TC-01-E12 — After that reset, Google sign-in still works
**Priority** P3 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** After E11, signed out. **Env: staging only.**
- **Action:** Press "Continue with Google" and choose the account.
- **Expected:** Household A's dashboard, same uid.
- **Don't assert:** provider order in the account record.

### TC-01-E13 — A reset asked with spaces around the email names the email without them
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner, U-P, on the reset page.
- **Action:** Type " " + U-P's email + " "; press "Send reset link".
- **Expected:** The message reads "If there's an account for {U-P's email}…" with no spaces; one reset code for U-P.
- **Don't assert:** the field's display.

### TC-01-E14 — Sending a reset with an empty email is refused under the field
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out, on the reset page.
- **Action:** Press "Send reset link" with the email empty.
- **Expected:** "Enter your email address" under Email; nothing sent.
- **Don't assert:** focus.

### TC-01-E15 — Sending a reset with a malformed email is refused under the field
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As E14.
- **Action:** Type `juan.example.com`; press "Send reset link".
- **Expected:** "Enter an email address like name@example.com" under Email; nothing sent.
- **Don't assert:** the validator library.

### TC-01-E16 — While the reset link is being sent, the button reads "Sending…" and is disabled
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** U-P on the reset page; response slowed.
- **Action:** Press "Send reset link".
- **Expected:** "Sending…", disabled, until the message shows.
- **Don't assert:** timing.

## Block F — Creating an account (S6)

### TC-01-F1 — Creating an account sends a verification email
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW, emulator.
- **Action:** Press "New here? Create an account". Type a name, U-NEW's email and an 8+ character password. Press "Create account".
- **Expected:** The emulator holds exactly one verification code for U-NEW's address.
- **Don't assert:** the email's wording.

### TC-01-F2 — A new account lands on "Enter your invite code"
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** Yes
- **Role / setup:** As F1.
- **Action:** As F1.
- **Expected:** "Enter your invite code" (REQ-004 4B) opens.
- **Don't assert:** the not-linked line (I1).

### TC-01-F3 — A new account sees no household data on its landing screen
**Priority** P1 · **Type** Security · **Layer** UI · **Writes** Yes
- **Role / setup:** As F1.
- **Action:** As F1, then look at the whole screen.
- **Expected:** No lot label, balance, announcement, bell or menu other than invite-code entry and "Sign out".
- **Don't assert:** the banner (F4).

### TC-01-F4 — An unverified account sees the verification banner under the top bar
**Priority** P2 · **Type** UI/UX · **Layer** UI · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW right after F1 (unverified), on "Enter your invite code".
- **Action:** Look at the page.
- **Expected:** Directly under the top bar: "Check your email to verify your address." with "Send again".
- **Don't assert:** other pages (F19); dismissing (F16).

### TC-01-F5 — "Send again" creates a new verification email
**Priority** P2 · **Type** Happy path · **Layer** UI · **Writes** Yes
- **Role / setup:** As F4, emulator.
- **Action:** Press "Send again" once.
- **Expected:** One more verification code exists for that address.
- **Don't assert:** the banner's wording (F17, F18).

### TC-01-F6 — The banner is gone once the email is verified
**Priority** P2 · **Type** Happy path (derived state refreshes) · **Layer** UI · **Writes** Yes
- **Role / setup:** U-NEW after F1.
- **Action:** Open the verification link; return to the portal and reload.
- **Expected:** No banner.
- **Don't assert:** whether it disappears without a reload (token refresh timing).

### TC-01-F7 — Creating an account creates no membership for the new account *(provisional: SA-001 §3, members only via `redeemInvite`)*
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** Yes
- **Role / setup:** As F1.
- **Action:** After F1, query `members` where `uid` = U-NEW's uid, and read `staff/{U-NEW uid}`.
- **Expected:** No `members` document and no `staff` document for that uid.
- **Don't assert:** counts across the whole database.

### TC-01-F8 — The new person record holds the trimmed typed name, the account email and the creation time, nothing else *(provisional: REQ-001 r4 Data + SA-001 §4.2)*
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** Yes
- **Role / setup:** As F1.
- **Action:** Read `users/{uid}`.
- **Expected:** `name` = the typed name; `email` = the Auth account's email; `createdAt` set. No `phone`, role, status or household field.
- **Don't assert:** the `createdAt` value.

### TC-01-F9 — Signing up with capitals in the email stores the account's email, and the write succeeds
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW typed as `ZZ-New-<run id>@<test domain>`.
- **Action:** Create the account.
- **Expected:** `users/{uid}` exists and its `email` equals the Auth token's email (the rule would refuse the typed value if it differed).
- **Don't assert:** the letter case Firebase stores (Uncertain).

### TC-01-F10 — Signing up with spaces around the email stores the account's email without them
**Priority** P3 · **Type** Boundary · **Layer** API · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW typed with a space before and after.
- **Action:** Create the account.
- **Expected:** The Auth account's email and `users/{uid}.email` have no spaces and match each other.
- **Don't assert:** letter case (F9).

### TC-01-F11 — If the person record didn't save, "Continue" offline shows the save message within 15 seconds and keeps the code
**Priority** P2 · **Type** Negative / data integrity · **Layer** API · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW. Make the `users` write fail after the Auth account is created (go offline between the two calls); stay on "Enter your invite code", still offline, with a code typed.
- **Action:** Press "Continue".
- **Expected:** Within 15 seconds: "We couldn't save your details. Check your connection and try again."; the code is still typed; "Continue" can be pressed again.
- **Don't assert:** the exact second.

### TC-01-F12 — A Google account with no profile name is asked "What's your name?"
**Priority** P2 · **Type** Boundary (zero vs not set) · **Layer** Unit · **Writes** Yes
- **Role / setup:** New homeowner, U-GN (fake Google user with no profile name).
- **Action:** Sign up with "Continue with Google".
- **Expected:** The page headed "What's your name?" with "The admin office sees this name next to your lot.", one field "Your name", "Continue", and "Signed in as {email}"; no household data.
- **Don't assert:** what happens after "Continue" (F24).

### TC-01-F13 — "Continue with Google" on the create-account page lands a new person on invite-code entry
**Priority** P2 · **Type** Happy path · **Layer** UI · **Writes** Yes
- **Role / setup:** New homeowner. A new emulator Google user with no account.
- **Action:** On "Create an account", press "Continue with Google".
- **Expected:** "Enter your invite code"; no household data.
- **Don't assert:** the banner (F14).

### TC-01-F14 — A new Google account arrives verified and shows no verification banner
**Priority** P3 · **Type** UI/UX · **Layer** Manual (staging) · **Writes** Yes
- **Role / setup:** New homeowner, a real team test Google account with no portal account. **Env: staging only** (the emulator lets the tester choose "verified", so it would only test the tester — QE finding 1).
- **Action:** Sign up with "Continue with Google"; read the Auth user.
- **Expected:** `emailVerified` is true; no banner.
- **Don't assert:** this for non-Gmail Google accounts (normally verified, not guaranteed).

### TC-01-F15 — The verification banner never shows on signed-out pages
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Role / setup:** An unverified account (U-NEW after F1), signed out.
- **Action:** Open the sign-in, create-account and reset pages.
- **Expected:** No banner on any of them.
- **Don't assert:** other page content.

### TC-01-F16 — The verification banner can't be dismissed
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As F4.
- **Action:** Look for a close control; press Escape.
- **Expected:** No close control; the banner stays.
- **Don't assert:** styling.

### TC-01-F17 — "Send again" reads "Sending…", then the banner reads "Sent. Check your inbox." in place
**Priority** P2 · **Type** UI/UX (copy promises an outcome) · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F4; response slowed.
- **Action:** Press "Send again".
- **Expected:** "Sending…", disabled; then the banner text is "Sent. Check your inbox." in the same place, with nothing below it moving.
- **Don't assert:** that the email arrived (F5).

### TC-01-F18 — When Firebase refuses another verification email, the banner says to wait
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As F4; "Send again" mocked to return Firebase's too-many-requests error.
- **Action:** Press "Send again".
- **Expected:** The banner reads "Too many emails sent. Wait a while, then try again."
- **Don't assert:** how long to wait.

### TC-01-F19 — The banner shows on every signed-in page for an unverified account
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Unverified email-and-password accounts on each page: "What's your name?" (an unverified account whose record has no name, as in F22), REQ-004's lot confirmation, a linked homeowner's dashboard, a staff page, the guard holding page.
- **Action:** Open each page.
- **Expected:** The banner directly under the top bar on each.
- **Don't assert:** the page content below it.

### TC-01-F20 — A missing person record stops the invite code being used up *(provisional: REQ-001 r4 Follow-up for REQ-004)*
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Role / setup:** An account with no `users` doc (seeded), a valid unused invite code for a disposable household.
- **Action:** Call `redeemInvite` directly.
- **Expected:** Refused; the invitation is still unused; no `members` doc created.
- **Don't assert:** the error text. (TC-04 owns `redeemInvite`; this case proves REQ-001's dependency.)

### TC-01-F21 — Pressing "Continue" again once online creates the record, then checks the code
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** After F11, back online.
- **Action:** Press "Continue" again.
- **Expected:** `users/{uid}` now exists with the account's email and the name typed at sign-up; then the code is checked (REQ-004 4C opens for a valid code).
- **Don't assert:** REQ-004's screens beyond 4C opening.

### TC-01-F22 — If the portal was closed before the record saved, the next open asks "What's your name?" first
**Priority** P2 · **Type** Data integrity / navigation · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New email-and-password account whose `users` write failed; the tab then closed (the typed name is lost).
- **Action:** Open the portal again, online.
- **Expected:** "What's your name?" before "Enter your invite code"; after a name is entered, the record exists and the invite-code page opens.
- **Don't assert:** the banner.

### TC-01-F23 — A Google sign-up whose record is missing is not asked for a name
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** U-GC's account with its `users` doc deleted (the Google profile has a name).
- **Action:** Sign in with Google.
- **Expected:** No "What's your name?" page; `users/{uid}` is recreated with the Google profile name and the account email.
- **Don't assert:** the landing beyond "not the name page".

### TC-01-F24 — Entering a name on "What's your name?" saves it and opens "Enter your invite code"
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F12.
- **Action:** Type "Lito ZZTest" and press "Continue".
- **Expected:** `users/{uid}.name` is "Lito ZZTest"; "Enter your invite code" opens.
- **Don't assert:** the greeting (not linked yet).

### TC-01-F25 — While saving the name, "Continue" reads "Saving…" and is disabled
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F12; the save slowed.
- **Action:** Press "Continue".
- **Expected:** "Saving…", disabled, until the save finishes.
- **Don't assert:** timing.

### TC-01-F26 — If the name doesn't save within 15 seconds, the save message shows and "Continue" works again
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As F12; offline before pressing "Continue".
- **Action:** Press "Continue".
- **Expected:** Within 15 seconds: "We couldn't save your details. Check your connection and try again."; the name still typed; "Continue" enabled.
- **Don't assert:** the exact second.

### TC-01-F27 — The name page applies the same name checks as create-account
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As F12.
- **Action:** Press "Continue" with the field empty; then paste 81 characters and leave the field.
- **Expected:** "Enter your name"; then "Use 80 characters or fewer"; nothing saved.
- **Don't assert:** focus.

### TC-01-F28 — Signing up with Google takes the name from the Google profile
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-GC (Google profile name "Carlo ZZTest"). Once from the create-account page, once from the sign-in page (separate disposable users).
- **Action:** Press "Continue with Google" and choose the account.
- **Expected:** `users/{uid}.name` is "Carlo ZZTest"; no name page; "Enter your invite code" opens.
- **Don't assert:** the banner.

### TC-01-F29 — A later Google profile name change doesn't overwrite the stored name
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** After F28; change the fake Google user's profile name to "CJ"; sign out.
- **Action:** Sign in with Google.
- **Expected:** `users/{uid}.name` is still "Carlo ZZTest".
- **Don't assert:** Firebase Auth's own `displayName`.

### TC-01-F30 — A Google profile name longer than 80 characters is cut to 80, then trimmed
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New fake Google user whose profile name is 79 letters, a space, then more letters (over 80 in total).
- **Action:** Sign up with Google.
- **Expected:** The stored name is the first 80 characters with the trailing space removed (79 characters); the `users` rule accepts it.
- **Don't assert:** how the greeting shows it.

### TC-01-F31 — A Google profile name of only spaces counts as no name
**Priority** P3 · **Type** Boundary (zero vs not set) · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** U-GN's variant whose profile name is only spaces.
- **Action:** Sign up with Google.
- **Expected:** "What's your name?" opens (as F12).
- **Don't assert:** anything stored before the name is entered.

### TC-01-F32 — A name typed with spaces around it is stored without them
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW.
- **Action:** Create an account with the name "  Lito ZZTest  ".
- **Expected:** `users/{uid}.name` is "Lito ZZTest".
- **Don't assert:** what the field shows.

### TC-01-F33 — While creating the account, the button reads "Creating account…" and is disabled
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW; response slowed.
- **Action:** Press "Create account".
- **Expected:** "Creating account…", disabled, until the next page opens or an error shows.
- **Don't assert:** timing.

## Block G — Account-creation validation (S7, S8)

### TC-01-G1 — Signing up with an email that already has an account shows the message
**Priority** P1 · **Type** Negative · **Layer** UI · **Writes** No
- **Role / setup:** New homeowner. U-P exists.
- **Action:** On "Create an account", type a name, U-P's email and a valid password. Press "Create account".
- **Expected:** "There's already an account for this email. Sign in, or reset your password." (This reveals the email exists — accepted limitation, REQ-001 Story.)
- **Don't assert:** the error code.

### TC-01-G2 — After the duplicate-email message, name and email are kept
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Role / setup:** As G1.
- **Action:** As G1.
- **Expected:** The name and email fields still hold what was typed.
- **Don't assert:** the password field.

### TC-01-G3 — The duplicate sign-up creates no second account
**Priority** P2 · **Type** Data integrity · **Layer** API · **Writes** No
- **Role / setup:** As G1.
- **Action:** As G1, then list Auth users with U-P's email.
- **Expected:** One account, unchanged.
- **Don't assert:** anything about U-P's `users` doc beyond "unchanged".

### TC-01-G4 — "Sign in" in the duplicate-email message opens sign-in with the email filled in
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** As G1, after the message shows.
- **Action:** Follow "Sign in" in the message.
- **Expected:** The sign-in page with U-P's email filled in; the password empty.
- **Don't assert:** focus.

### TC-01-G5 — "Reset your password" in the duplicate-email message opens reset with the email filled in
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** As G1, after the message shows.
- **Action:** Follow "reset your password" in the message.
- **Expected:** The reset page with U-P's email filled in.
- **Don't assert:** focus.

### TC-01-G6 — A 7-character password shows "Use at least 8 characters"
**Priority** P1 · **Type** Boundary / negative · **Layer** Unit · **Writes** No
- **Role / setup:** New homeowner, U-NEW details.
- **Action:** On "Create an account", type a name, U-NEW's email and a 7-character password. Press "Create account".
- **Expected:** "Use at least 8 characters" under the password field.
- **Don't assert:** whether a request was sent (G8).

### TC-01-G7 — After a short password, name and email are kept
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Role / setup:** As G6.
- **Action:** As G6.
- **Expected:** Name and email still typed.
- **Don't assert:** the password field.

### TC-01-G8 — A short password in the page creates no account
**Priority** P2 · **Type** Negative · **Layer** Unit · **Writes** No
- **Role / setup:** As G6.
- **Action:** As G6, then look up U-NEW's email in Auth.
- **Expected:** No account.
- **Don't assert:** whether the page or the server stopped it.

### TC-01-G9 — Firebase refuses a 7-character password when the page check is skipped *(provisional: SA-001 §8.4)*
**Priority** P1 · **Type** Security · **Layer** API (staging) · **Writes** No
- **Role / setup:** No app role (direct Auth call). **Env: staging only** (the emulator does not enforce the policy; a 7-character sign-up succeeds there).
- **Action:** Call account creation directly with a 7-character password.
- **Expected:** Refused; no account exists afterwards.
- **Don't assert:** the error code.

### TC-01-G10 — An 8-character password is accepted
**Priority** P1 · **Type** Boundary · **Layer** Unit · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW.
- **Action:** As G6 with exactly 8 characters.
- **Expected:** Account created; lands on invite-code entry.
- **Don't assert:** the banner.

### TC-01-G11 — A long passphrase with spaces and non-ASCII characters signs up and signs in
**Priority** P3 · **Type** Boundary · **Layer** API · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW.
- **Action:** Sign up with a 64-character passphrase containing spaces and "ñ"; sign out; sign in with it.
- **Expected:** Both succeed.
- **Don't assert:** the maximum length (4096 per Firebase's password policy).

### TC-01-G12 — Creating an account with no name shows "Enter your name"
**Priority** P2 · **Type** Negative · **Layer** Unit · **Writes** No
- **Role / setup:** New homeowner, U-NEW details.
- **Action:** Leave "Your name" empty; fill the rest; press "Create account".
- **Expected:** "Enter your name" under the name field; no account; everything else kept.
- **Don't assert:** focus (N20).

### TC-01-G13 — Signing up with an existing email in capitals shows the duplicate message
**Priority** P2 · **Type** Boundary · **Layer** API · **Writes** No
- **Role / setup:** New homeowner. U-P exists.
- **Action:** Sign up with U-P's email in capitals.
- **Expected:** The G1 message; no second account.
- **Don't assert:** the error code.

### TC-01-G14 — Signing up with an existing email plus spaces around it shows the duplicate message
**Priority** P3 · **Type** Boundary · **Layer** API · **Writes** No
- **Role / setup:** New homeowner. U-P exists.
- **Action:** Sign up with " " + U-P's email + " ".
- **Expected:** "There's already an account for this email. Sign in, or reset your password."; no second account.
- **Don't assert:** the error code.

### TC-01-G15 — A name of 80 characters is accepted; 81 shows "Use 80 characters or fewer"
**Priority** P3 · **Type** Boundary · **Layer** Unit · **Writes** No
- **Role / setup:** New homeowner on "Create an account".
- **Action:** Paste an 80-character name and leave the field; then paste an 81-character name and leave the field.
- **Expected:** 80: no error. 81: "Use 80 characters or fewer" under the name field, checked on paste and on leaving the field.
- **Don't assert:** how the 80-character name looks on the dashboard (G17).

### TC-01-G16 — A name containing markup shows as plain text in the greeting
**Priority** P1 · **Type** Security (stored XSS) · **Layer** UI · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW named `<img src=x onerror=alert(1)>`, then linked to a test household.
- **Action:** Sign in and open the dashboard.
- **Expected:** The greeting shows the characters as text; no script runs; no image element is created.
- **Don't assert:** how the text is truncated.

### TC-01-G17 — An 80-character name doesn't break the greeting or header at 375 px
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner whose stored first word is long (an 80-character single word), linked to a test household; phone profile.
- **Action:** Sign in.
- **Expected:** The greeting wraps or truncates without horizontal scroll; the header and "Sign out" stay usable. (Split from G15 per QE finding 2.)
- **Don't assert:** whether it wraps or truncates.

### TC-01-G18 — A malformed email on the create-account page is flagged when the person leaves the field
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** New homeowner on "Create an account".
- **Action:** Type `ana@` in Email and move on.
- **Expected:** "Enter an email address like name@example.com" under Email; typing kept.
- **Don't assert:** the validator library.

### TC-01-G19 — A name of only spaces shows "Enter your name"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Role / setup:** New homeowner on "Create an account".
- **Action:** Type three spaces as the name; fill the rest; press "Create account".
- **Expected:** "Enter your name"; no account.
- **Don't assert:** focus.

### TC-01-G20 — Creating an account with no password shows "Use at least 8 characters"
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** New homeowner on "Create an account".
- **Action:** Fill name and email; leave Password empty; press "Create account".
- **Expected:** "Use at least 8 characters" under Password; no account.
- **Don't assert:** focus.

### TC-01-G21 — A one-character name is accepted
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW.
- **Action:** Create an account with the name "Q".
- **Expected:** Account created; `users/{uid}.name` is "Q".
- **Don't assert:** the greeting.

## Block H — Google sign-in and existing password accounts (S9)

All of block H is **Env: staging only**. Firebase trusts Google as a provider only for `@gmail.com` addresses, and the emulator may not reproduce the takeover. Each case uses a fresh disposable fixture.

### TC-01-H1 — Google sign-in on an unverified Gmail password account signs in with Google
**Priority** P1 · **Type** Security · **Layer** Manual (staging) · **Writes** Yes
- **Role / setup:** Homeowner. Fresh U-GM-UV (unverified password account, team-owned Gmail, linked to Household C).
- **Action:** Press "Continue with Google" and choose that Gmail account.
- **Expected:** Signed in.
- **Don't assert:** Google's screens.

### TC-01-H2 — After the Google takeover, the old password no longer signs in
**Priority** P1 · **Type** Security · **Layer** Manual (staging) · **Writes** Yes
- **Role / setup:** Homeowner. Fresh U-GM-UV; run H1's action as setup; sign out.
- **Action:** Sign in with U-GM-UV's old password.
- **Expected:** The C1 message.
- **Don't assert:** the error code.

### TC-01-H3 — After the Google takeover, the account keeps its household
**Priority** P1 · **Type** Security / integration · **Layer** Manual (staging) · **Writes** Yes
- **Role / setup:** Homeowner. Fresh U-GM-UV linked to Household C.
- **Action:** Run H1's action.
- **Expected:** Lands on Household C's dashboard.
- **Don't assert:** how Firebase links the account internally (H4).

### TC-01-H4 — After the Google takeover, the uid is the same
**Priority** P2 · **Type** Data integrity · **Layer** Manual (staging) · **Writes** Yes
- **Role / setup:** Fresh U-GM-UV; note its uid.
- **Action:** Run H1's action; read the uid.
- **Expected:** The same uid. **Uncertain:** Firebase's docs don't say so; H3 is the check that matters. A different uid is reported to Sol Arch.
- **Don't assert:** provider data beyond Google being present.

### TC-01-H5 — A verified Gmail password account signing in with Google lands on its own household as one account
**Priority** P2 · **Type** Security / data integrity · **Layer** Manual (staging) · **Writes** Yes
- **Role / setup:** Homeowner. Fresh U-GM-V (verified password account, team-owned Gmail, linked to ZZ Test Household F). **Env: staging only.**
- **Action:** Press "Continue with Google" and choose that Gmail account; sign out; try the old password.
- **Expected:** Signed in to the same account, landing on Household F's dashboard; no second account for the address. **Uncertain:** whether the password still works afterwards; QE records the result for Sol Arch (REQ-001 r4 says so).
- **Don't assert:** the password result.

### TC-01-H6 — Google sign-in on a non-Gmail address that has a password account doesn't sign in or create a second account
**Priority** P2 · **Type** Security / negative · **Layer** Manual (staging) · **Writes** Yes
- **Role / setup:** Homeowner. Fresh U-DOM-UV (password account on the team's own domain, whose mail is not hosted by Google, registered as a Google account). **Env: staging only.**
- **Action:** Press "Continue with Google" and choose that address.
- **Expected:** Not signed in; still exactly one account for the address (setting R5).
- **Don't assert:** the message (H7, H8).

### TC-01-H7 — That refusal says the email has a password and fills it in on the sign-in form
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As H6, where Firebase reports that the email already has another sign-in method.
- **Action:** As H6.
- **Expected:** "This email already has a password. Sign in with your email and password." above the form; the sign-in form's Email reads that address; the password field empty.
- **Don't assert:** the error code.

### TC-01-H8 — If Firebase refuses without saying why, the generic Google message shows and still no second account
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As H6, with the Google error mocked as one that doesn't name the existing method.
- **Action:** Press "Continue with Google".
- **Expected:** "Google sign-in didn't work. Try again, or sign in with your email."; one account for the address.
- **Don't assert:** the error code.

## Block I — Signed in, not linked (S10)

### TC-01-I1 — A signed-in person with no household and no role lands on "Enter your invite code" with the not-linked line
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
- **Role / setup:** Not-linked account, U-N, signed out.
- **Action:** Sign in as U-N.
- **Expected:** The page headed "Enter your invite code"; above the code field: "Your account isn't linked to a household yet. Enter the invite code from the admin office." (REQ-001 r4: one page for every not-linked arrival.)
- **Don't assert:** the banner (U-N is verified).

### TC-01-I2 — The not-linked person sees only the code field, "Continue" and "Sign out"
**Priority** P1 · **Type** Navigation / security · **Layer** UI · **Writes** No
- **Role / setup:** As I1, at 375 px and at desktop width.
- **Action:** Look for menus, the ☰ button, the notification bell, any role switch.
- **Expected:** None of them; only the code field, "Continue" and "Sign out".
- **Don't assert:** layout details.

### TC-01-I3 — "Enter your invite code" stays after a reload
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** As I1.
- **Action:** Reload.
- **Expected:** The same page with the not-linked line; no dashboard or menu flashes first.
- **Don't assert:** load time.

### TC-01-I4 — The invite-code page shows "Signed in as {email}" under the form
**Priority** P3 · **Type** Usability / round-trip · **Layer** UI · **Writes** No
- **Role / setup:** As I1.
- **Action:** Read the page.
- **Expected:** "Signed in as {U-N's account email}" under the form.
- **Don't assert:** the email's letter case.

### TC-01-I5 — A not-linked person opening a household page address lands on "Enter your invite code" and sees no household data
**Priority** P2 · **Type** Security (UI) · **Layer** UI · **Writes** No
- **Role / setup:** As I1; the address of a Household B page.
- **Action:** Open that address directly.
- **Expected:** "Enter your invite code" with the not-linked line; no Household B data at any moment.
- **Don't assert:** the final URL.

### TC-01-I6 — The next day, a not-linked person still lands on "Enter your invite code"
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As I1, signed in; device clock moved past local midnight.
- **Action:** Reopen the portal.
- **Expected:** "Enter your invite code" with the not-linked line, still signed in.
- **Don't assert:** token lifetimes.

## Block J — Access control and rules (S10, S11)

### TC-01-J1 — A homeowner opening another household's page sees "You don't have access to this page"
**Priority** P1 · **Type** Security (UI) · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G (Household A only); the address of a Household B page.
- **Action:** Open that address directly.
- **Expected:** "You don't have access to this page"; no Household B lot, name, balance or row at any moment.
- **Don't assert:** network traffic (J2).

### TC-01-J2 — While on another household's page, no Household B document is read *(provisional: SA-001 §8.1 `isMember`)*
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** As J1, with U-G's token.
- **Action:** Read Household B's documents and sub-records directly.
- **Expected:** Every read is refused with a permission error.
- **Don't assert:** the page's wording.

### TC-01-J3 — "Go to my dashboard" on the no-access page returns to her own household
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** As J1.
- **Action:** Press "Go to my dashboard".
- **Expected:** Household A's dashboard.
- **Don't assert:** dashboard figures.

### TC-01-J4 — A not-linked account may query its own memberships and gets none *(provisional: Sol Arch to add the self-read to SA-001 §8.1)*
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-N's token.
- **Action:** Query `members` where `uid == ` U-N's uid.
- **Expected:** **Allowed**, returning no documents. (The route guard needs this; a permission error must not be what tells the app "not linked".)
- **Don't assert:** query performance.

### TC-01-J5 — A not-linked account may read its own staff record and finds none *(provisional: ADR-004)*
**Priority** P2 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-N's token.
- **Action:** Read `staff/{U-N uid}`.
- **Expected:** Allowed; the document does not exist.
- **Don't assert:** anything about other `staff` docs (J8).

### TC-01-J6 — A not-linked account cannot read other people's membership documents *(provisional: SA-001 §8.1)*
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-N's token; Household A's membership for U-G.
- **Action:** Read that `members` doc; query `members` for Household A.
- **Expected:** Both refused.
- **Don't assert:** error text.

### TC-01-J7 — A not-linked account cannot read any household or its records *(provisional: SA-001 §8.1)*
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-N's token; Households A and B with sub-records.
- **Action:** Read a `households` doc and a household sub-record.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J8 — A not-linked account cannot read other people's staff records *(provisional: ADR-004)*
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-N's token; `staff/{U-TR uid}`.
- **Action:** Read it; list `staff`.
- **Expected:** Both refused.
- **Don't assert:** error text.

### TC-01-J9 — A not-linked account cannot read announcements *(provisional: SA-001 §8.1, "rules deny everything else")*
**Priority** P2 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-N's token; a published announcement.
- **Action:** Read it.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J10 — Signed-out requests are refused *(provisional: SA-001 §8.1)*
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** No auth token.
- **Action:** Read `users`, `households`, `members`, `staff`, `config/settings`.
- **Expected:** All refused.
- **Don't assert:** `config/branding` (it may be public; see M2 and the Sol Arch list).

### TC-01-J11 — A person can create their own person record with the allowed fields *(provisional: REQ-001 r4 Data, Sol Arch r4)*
**Priority** P1 · **Type** Security (rules, allowed cell) · **Layer** API · **Writes** Yes
- **Role / setup:** A new account's token.
- **Action:** Create `users/{own uid}` with `name` (trimmed, 1–80), `email` (= token email), `createdAt` (= server time). Then, separately for another new account, the same plus `phone`.
- **Expected:** The first is allowed; the one with `phone` is refused (r4 dropped `phone`).
- **Don't assert:** the stored timestamp's value.

### TC-01-J12 — Creating one's own person record with an extra field is refused
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** A new account's token.
- **Action:** Create `users/{own uid}` with the allowed fields plus `role` (and, separately, `householdId`).
- **Expected:** Refused; no document exists afterwards.
- **Don't assert:** error text.

### TC-01-J13 — Adding a role field to one's own existing person record is refused
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-N's token; `users/{U-N uid}` exists.
- **Action:** Update it, adding `role: "treasurer"` (and, separately, `staffRole`).
- **Expected:** Refused; the stored doc is unchanged (assert the refusal, not "nothing changed").
- **Don't assert:** error text.

### TC-01-J14 — Setting a different email than the account's is refused
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-N's token.
- **Action:** Update `users/{own uid}.email` to U-P's address.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J15 — A `createdAt` that isn't the server time is refused *(provisional: Sol Arch to add to SA-001)*
**Priority** P2 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** A new account's token.
- **Action:** Create `users/{own uid}` with `createdAt` a year ago.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J16 — A person can read their own person record
**Priority** P2 · **Type** Security (rules, allowed cell) · **Layer** API · **Writes** No
- **Role / setup:** U-P's token.
- **Action:** Read `users/{U-P uid}`.
- **Expected:** Allowed.
- **Don't assert:** field values.

### TC-01-J17 — A person cannot update their own person record in R1 *(provisional: REQ-001 r4 Data)*
**Priority** P2 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-P's token; `users/{U-P uid}` exists.
- **Action:** Update `name` to another valid name.
- **Expected:** Refused; the doc is unchanged. (v1.1 expected "allowed"; REQ-001 r4 makes `users` create-only in R1.)
- **Don't assert:** error text.

### TC-01-J18 — A person cannot delete their own person record
**Priority** P2 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-P's token.
- **Action:** Delete `users/{U-P uid}`.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J19 — Nobody signed in as a homeowner can list the people collection
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-P's token and U-N's token.
- **Action:** List `users`.
- **Expected:** Refused for both.
- **Don't assert:** admin office reads (TC-03).

### TC-01-J20 — A homeowner cannot read another household's person's record
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-G's token (Household A); U-P's uid (Household B).
- **Action:** Read `users/{U-P uid}`.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J21 — A homeowner cannot write another person's record
**Priority** P1 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** U-G's token; U-P's uid.
- **Action:** Update `users/{U-P uid}`; separately, create over it.
- **Expected:** Both refused; U-P's doc unchanged.
- **Don't assert:** error text.

### TC-01-J22 — A member of the same household reading your person record
**Priority** P3 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Blocked on Sol Arch:** SA-001 §8.2 ("visible to own household and staff") and REQ-001's Data table (the person and the admin office) still disagree; REQ-001 r4 did not settle it.
- **Role / setup:** Two members of Household A.
- **Action:** One reads the other's `users` doc.
- **Expected:** As Sol Arch decides.
- **Don't assert:** anything until decided.

### TC-01-J23 — A guard or board account cannot read any person record *(provisional: SA-001 §8.1)*
**Priority** P2 · **Type** Security (rules) · **Layer** API · **Writes** No
- **Role / setup:** Guard (U-GD) and Board (U-BD) tokens.
- **Action:** Read `users/{U-P uid}`.
- **Expected:** Refused for both.
- **Don't assert:** admin office or treasurer reads (TC-03).

A removed staff member's stale token is covered by **TC-02** (REQ-002 decision 1, ADR-004 `staff/{uid}` check).

### TC-01-J24 — The rules refuse a name with spaces around it *(provisional: REQ-001 r4 Data)*
**Priority** P2 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** A new account's token.
- **Action:** Create `users/{own uid}` with `name: " Ana ZZTest"`.
- **Expected:** Refused (`name` must equal its trimmed self).
- **Don't assert:** error text.

### TC-01-J25 — The rules accept a name of 1 to 80 characters and refuse empty or 81
**Priority** P2 · **Type** Security (rules, boundary) · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New accounts' tokens.
- **Action:** Create `users/{own uid}` with names of 0, 1, 80 and 81 characters (one account each).
- **Expected:** 1 and 80 allowed; 0 and 81 refused.
- **Don't assert:** error text.

### TC-01-J26 — The page and the rules count "ñ" and an emoji the same way at the 80 limit
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW.
- **Action:** On "Create an account", enter a name of exactly 80 characters that includes "ñ" and one emoji, and create the account.
- **Expected:** The page and the rule agree: either both accept it, or the page refuses it with "Use 80 characters or fewer" before any write. Never a page that accepts and a rule that refuses. (REQ-001 r4: letters vs bytes is settled in the rules tests.)
- **Don't assert:** which way they agree.

### TC-01-J27 — A guard-only account cannot read household data or anyone else's staff record *(provisional: SA-001 §8.1, REQ-001 r4)*
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Guard, U-GD's token (no household).
- **Action:** Read a `households` doc, a household sub-record, another person's `members` doc and `staff/{U-TR uid}`.
- **Expected:** All refused.
- **Don't assert:** the guard's own `staff` doc (J5's self-read question).

## Block K — Signing out (S12)

### TC-01-K1 — "Sign out" lands on the sign-in page
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G, signed in on the dashboard.
- **Action:** Choose "Sign out" in the account menu.
- **Expected:** The sign-in page.
- **Don't assert:** any toast.

### TC-01-K2 — Pressing Back after signing out shows the sign-in page
**Priority** P1 · **Type** Navigation / security · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G; visited two screens, then signed out (desktop browser).
- **Action:** Press Back several times.
- **Expected:** The sign-in page each time.
- **Don't assert:** the URL shown.

### TC-01-K3 — On a phone browser, Back after signing out never shows household data, even briefly
**Priority** P1 · **Type** Security · **Layer** UI · **Writes** No
- **Role / setup:** As K2 in a mobile browser with the back-forward cache (real phone or emulation that keeps bfcache).
- **Action:** Press Back.
- **Expected:** No household data at any moment; the sign-in page.
- **Needs:** a real or emulated mobile browser.
- **Don't assert:** animation timing.

### TC-01-K4 — After signing out, no household data is left in browser storage
**Priority** P1 · **Type** Security · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G signed in, dashboard loaded.
- **Action:** Sign out; inspect `localStorage`, `sessionStorage`, IndexedDB and Cache Storage for the origin.
- **Expected:** No lot label, balance or household name anywhere.
- **Don't assert:** Firebase's own auth keys (removed by sign-out; not household data).

### TC-01-K5 — Firestore uses its memory-only cache *(provisional: SA-001 §8.4)*
**Priority** P2 · **Type** Security / config · **Layer** UI · **Writes** No
- **Role / setup:** Code review and a signed-in session.
- **Action:** Check the Firestore initialisation; look for a Firestore IndexedDB database after loading the dashboard.
- **Expected:** No persistent cache is enabled; no Firestore IndexedDB database exists.
- **Don't assert:** cache size.

### TC-01-K6 — A second homeowner signing in on the same tab, without a reload, never sees the first one's data
**Priority** P1 · **Type** Security (data leak across households) · **Layer** UI · **Writes** No
- **Role / setup:** Two homeowners, U-G then U-P, same tab. U-G signs in, opens the dashboard, signs out.
- **Action:** Without reloading, U-P signs in.
- **Expected:** At no moment (including while loading) does Household A's lot, name or any figure show; only Blk 4 Lot 12.
- **Don't assert:** how the app clears its memory (a reload or a Firestore shutdown on sign-out are both fine).

### TC-01-K7 — The same, with a reload between the two people
**Priority** P2 · **Type** Security · **Layer** UI · **Writes** No
- **Role / setup:** As K6, with a page reload after U-G signs out.
- **Action:** U-P signs in.
- **Expected:** As K6.
- **Don't assert:** as K6.

### TC-01-K8 — Signing out in one tab signs out the other open tab
**Priority** P2 · **Type** Concurrency · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G signed in, two tabs on the dashboard.
- **Action:** Sign out in tab 1; click a menu item in tab 2.
- **Expected:** Tab 2 shows the sign-in page and loads no further household data. (Firebase's default `local` persistence syncs tabs — confirm on the emulator.)
- **Don't assert:** how fast tab 2 reacts without an action.

## Block L — Staying signed in (S13)

### TC-01-L1 — A homeowner who did not sign out lands on her dashboard the next day
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G signs in; the browser is closed. Move the device clock past midnight **local time (Asia/Manila)**, built from the local date, not UTC.
- **Action:** Reopen the browser; open the portal.
- **Expected:** Household A's dashboard; no sign-in page. **Assumption:** Firebase local persistence.
- **Don't assert:** token lifetimes; behaviour after a week (T4).

### TC-01-L2 — Reloading any screen keeps the session and the screen
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G, on a dashboard sub-screen.
- **Action:** Reload.
- **Expected:** Same screen, still signed in, no sign-in page flash. (Replaces NAV-04's meaning.)
- **Don't assert:** load time.

## Block M — Navigation and routing

### TC-01-M1 — A signed-out person opening any portal address sees the sign-in page and no data
**Priority** P1 · **Type** Navigation / security · **Layer** UI · **Writes** No
- **Role / setup:** Signed out.
- **Action:** Open the root, a dashboard address and an admin address.
- **Expected:** The sign-in page each time; no screen content or staff menu flashes first.
- **Don't assert:** the final URL.

### TC-01-M2 — The sign-in heading shows the HOA's name while signed out *(provisional: SA-001 §9 branding)*
**Priority** P2 · **Type** UI/UX · **Layer** UI · **Writes** No
- **Role / setup:** Signed out, each brand build (Greenfield-style and Gentri Heights).
- **Action:** Open the sign-in page.
- **Expected:** "Sign in to {that HOA's name}", with the name filled in, never a placeholder or blank.
- **Don't assert:** where the branding comes from (public read or bundled; Sol Arch to decide).

### TC-01-M3 — After signing in from a deep link, the person lands on the page they asked for
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-P signed out; the portal address of Household B's Dues & Payments page.
- **Action:** Open the address; the sign-in page shows; sign in.
- **Expected:** Dues & Payments for Blk 4 Lot 12.
- **Don't assert:** the page's figures.

### TC-01-M4 — Sign-in and create-account link to each other
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** Signed out.
- **Action:** "New here? Create an account" → "Already have an account? Sign in".
- **Expected:** Each opens the named page; nothing is submitted.
- **Don't assert:** carried-over values.

### TC-01-M5 — Sign-in and the reset page link to each other
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** Signed out.
- **Action:** "Forgot password?" → "Back to sign in".
- **Expected:** Each opens the named page; nothing is submitted.
- **Don't assert:** carried-over values (M16, M17).

### TC-01-M6 — The browser's Back button moves back through sign-in, create-account and reset
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** Signed out, after M4 and M5's steps.
- **Action:** Press Back repeatedly.
- **Expected:** Each previous page in turn; nothing submitted.
- **Don't assert:** history length.

### TC-01-M7 — A signed-in homeowner opening the sign-in address goes to the dashboard
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G, signed in.
- **Action:** Open the sign-in address.
- **Expected:** Household A's dashboard.
- **Don't assert:** whether the sign-in page flashes first for a moment (it holds no data).

### TC-01-M8 — A signed-in not-linked person opening the sign-in address goes to the not-linked screen
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** Not-linked account, U-N, signed in.
- **Action:** Open the sign-in address.
- **Expected:** The not-linked screen.
- **Don't assert:** as M7.

### TC-01-M9 — Reloading the sign-in, create-account and reset pages keeps the person there
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** No
- **Role / setup:** Signed out, on each page in turn.
- **Action:** Reload.
- **Expected:** The same page.
- **Don't assert:** typed values after a reload.

### TC-01-M10 — "Sign out" can be reached at 375 px
**Priority** P2 · **Type** Navigation / responsive · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G on the dashboard, phone profile.
- **Action:** Find and use "Sign out".
- **Expected:** Reachable in at most two taps; signs out.
- **Don't assert:** whether it sits inside the ☰ menu (not stated).

### TC-01-M11 — While the role loads, no staff menu appears and then disappears
**Priority** P3 · **Type** UI/UX / security · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner (U-G) and not-linked (U-N), slow network.
- **Action:** Sign in; watch the menu area.
- **Expected:** A skeleton (or nothing) until the role is known; never a staff menu that then disappears (REQ-002 States).
- **Don't assert:** the skeleton's look.

### TC-01-M12 — Signing in from a link to another household's page shows "You don't have access to this page"
**Priority** P2 · **Type** Security / navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G signed out; the address of a Household B page.
- **Action:** Open it; sign in.
- **Expected:** "You don't have access to this page"; no Household B data loaded.
- **Don't assert:** network detail (J2).

### TC-01-M13 — A return address added to the sign-in address is ignored
**Priority** P1 · **Type** Security (open redirect) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-P signed out.
- **Action:** Open the sign-in address with each of `?next=https://evil.example`, `?next=//evil.example` and `#next=https://evil.example`; sign in each time.
- **Expected:** Each time Household B's dashboard; never a request to or a navigation away to `evil.example`.
- **Don't assert:** whether the extra text stays in the address bar.

### TC-01-M14 — The portal never puts a return address in the page address
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As M3.
- **Action:** Watch the address bar from opening the deep link to landing.
- **Expected:** No `next=`, `return=`, `redirect=` or similar, and no portal path as a parameter, at any point.
- **Don't assert:** the final path's format.

### TC-01-M15 — A not-linked person who signs in from a dashboard link lands on "Enter your invite code"
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-N, signed out; a dashboard address.
- **Action:** Open it; sign in.
- **Expected:** "Enter your invite code" with the not-linked line. (An invitation link lands on 4C instead: Q7, Q8.)
- **Don't assert:** the final URL.

### TC-01-M16 — The typed email goes from sign-in to the reset page, where it can be edited
**Priority** P2 · **Type** Navigation / usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out; U-P's email typed on the sign-in page.
- **Action:** Press "Forgot password?"; change the email.
- **Expected:** The reset page's Email reads U-P's email and can be edited.
- **Don't assert:** focus.

### TC-01-M17 — "Back to sign in" carries the email now on the reset page
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** After M16, with the email edited to U-N's.
- **Action:** Press "Back to sign in".
- **Expected:** The sign-in page's Email reads U-N's email.
- **Don't assert:** focus.

### TC-01-M18 — The password is never carried between pages
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out; email and password typed on the sign-in page.
- **Action:** Press "Forgot password?", then "Back to sign in".
- **Expected:** The password field is empty on return; no password was present on the reset page.
- **Don't assert:** the email (M16, M17).

### TC-01-M19 — A carried email never appears in the address bar or saved storage
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As M16, then G4's route and H7's route.
- **Action:** After each carry, read the address bar, `localStorage`, `sessionStorage` and IndexedDB.
- **Expected:** The email is in none of them.
- **Don't assert:** Firebase's own auth keys (they hold no typed email before sign-in).

### TC-01-M20 — The asked-for page survives "Continue with Google"
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G signed out; the address of a Household A sub-page.
- **Action:** Open it; sign in with Google.
- **Expected:** That sub-page, not the dashboard.
- **Don't assert:** the popup's screens.

## Block N — Usability and accessibility (WCAG 2.2 AA)

Role for this block: **anyone, signed out**, on the sign-in, create-account and reset pages, unless stated.

### TC-01-N1 — Every field has a visible label
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Each page.
- **Action:** Inspect Email, Password and "Your name".
- **Expected:** A visible label tied to each field (not a placeholder alone).
- **Don't assert:** label styling.

### TC-01-N2 — "Show password" reveals the password and reads "Hide password" while it shows
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Sign-in page, a password typed.
- **Action:** Press "Show password"; then press it again.
- **Expected:** The password shows and the control reads "Hide password"; then it hides and reads "Show password".
- **Don't assert:** icon.

### TC-01-N3 — The password toggle is labelled in text and announces its state
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** As N2, with a screen reader or the accessibility tree.
- **Action:** Press the toggle.
- **Expected:** A visible text label (not an icon only) and an exposed state (pressed, or the label change to "Hide password").
- **Don't assert:** the screen reader's phrasing.

### TC-01-N4 — Errors are announced
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Trigger C1, G1 and G6.
- **Action:** Listen with a screen reader, or inspect the role.
- **Expected:** Each error is in a `role="alert"` region and is read out.
- **Don't assert:** placement (N5, N6).

### TC-01-N5 — Field errors sit under their field, which is marked invalid and linked to the message
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Trigger G6 and C7.
- **Action:** Inspect each field.
- **Expected:** The message sits directly under its field; the field has `aria-invalid="true"` and `aria-describedby` pointing at the message.
- **Don't assert:** colours.

### TC-01-N6 — Errors about the whole form sit above it, inside the card, and focus stays put
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Trigger, one at a time: wrong email or password (C1), too many attempts (D1), offline (D4), a blocked Google window (D10), a turned-off account (D11), an email that already has an account (G1).
- **Action:** Look at the page; note focus before and after.
- **Expected:** Each message is above the form, inside the card, in a `role="alert"` region; focus stays where it was.
- **Don't assert:** colours.

### TC-01-N7 — The password stays typed after a wrong-password error
**Priority** P3 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Trigger C1.
- **Action:** Look at the password field.
- **Expected:** Still filled (REQ-001: "typing is never cleared by an error"; mock-up 1D). Security note for the owner: some sites clear it; REQ-001 chose not to.
- **Don't assert:** the masked characters.

### TC-01-N8 — Every tap target is at least 44 × 44 px
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Each page at 375 px.
- **Action:** Measure Continue with Google, Sign in, Show password, Forgot password?, Create an account, Create account, Send reset link, Back to sign in, Send again.
- **Expected:** Each is at least 44 × 44 px.
- **Don't assert:** exact sizes.

### TC-01-N9 — The Google button meets 4.5:1 contrast and says "Continue with Google" in text
**Priority** P3 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Sign-in and create-account pages.
- **Action:** Check contrast and the button's text.
- **Expected:** Text contrast at least 4.5:1; the words "Continue with Google" in text, not only the logo.
- **Don't assert:** Google's logo colours.

### TC-01-N10 — Fields carry the autocomplete values password managers need
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Sign-in and create-account pages.
- **Action:** Inspect the fields.
- **Expected:** Sign-in: `email`, `current-password`. Create account: `name`, `email`, `new-password`.
- **Don't assert:** other attributes.

### TC-01-N11 — The email field opens the email keyboard on phones
**Priority** P3 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Each page with an email field.
- **Action:** Inspect the field (or tap it on a phone).
- **Expected:** `type="email"` (and `inputmode="email"`).
- **Don't assert:** the keyboard layout itself.

### TC-01-N12 — While signing in, the button reads "Signing in…" and is disabled
**Priority** P2 · **Type** UI/UX · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-P; auth response slowed.
- **Action:** Press "Sign in".
- **Expected:** "Signing in…", disabled, announced; back to "Sign in" after an error.
- **Don't assert:** the other in-flight labels (D15, E16, F25, F33).

### TC-01-N13 — Sign-in and account creation work with the keyboard alone
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-P; a new U-NEW for the create path.
- **Action:** Tab through each form and press Enter to submit.
- **Expected:** Logical order (Google → Email → Password → Show password → Forgot password? → Sign in → Create an account); visible focus; no trap; Enter submits once.
- **Don't assert:** focus ring styling.

### TC-01-N14 — Pasting into the email and password fields is allowed (WCAG 2.2 SC 3.3.8)
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Sign-in page.
- **Action:** Paste an email and a password.
- **Expected:** Both are pasted.
- **Don't assert:** clipboard behaviour of the browser.

### TC-01-N15 — The same words are used everywhere
**Priority** P3 · **Type** UI/UX (same concept, different word) · **Layer** Unit · **Writes** No
- **Setup:** Every page in REQ-001, signed in and out.
- **Action:** Read every button, link, menu item and message.
- **Expected:** "Sign in" / "Sign out", never "Log in" / "Log out"; "invite code" spelled the same on 1G and 4B.
- **Don't assert:** wording outside REQ-001's pages.

### TC-01-N16 — The sign-in pages use the mock-up's green top bar and card
**Priority** P3 · **Type** UI/UX · **Layer** Manual · **Writes** No
- **Setup:** Sign-in, create-account, reset, "Enter your invite code", "What's your name?" and the guard holding page.
- **Action:** Compare with mock-up 1A, 1G, 1K and 1M.
- **Expected:** The same top bar and card style on all six.
- **Don't assert:** pixel values.

### TC-01-N17 — The sign-in page reflows at 320 px and at 200 % zoom
**Priority** P3 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Sign-in page.
- **Action:** View at 320 px wide; then at 200 % zoom on desktop.
- **Expected:** No content lost; no horizontal scroll.
- **Don't assert:** layout details.

### TC-01-N18 — After an error or a page change, focus moves to the error or the new heading
**Priority** P3 · **Type** Usability · **Layer** UI · **Writes** No
- **Setup:** Trigger C1; then move from sign-in to create account.
- **Action:** Note where focus is.
- **Expected:** On the error, then on the new page's heading.
- **Don't assert:** scroll position.

### TC-01-N19 — Every static string in the copy of record appears as written
**Priority** P2 · **Type** UI/UX (copy) · **Layer** UI · **Writes** No
- **Setup:** Sign-in, create-account and reset pages.
- **Action:** Read them.
- **Expected:** Sign-in: "Sign in to {HOA name}", "Pay dues, see your statement and get HOA news.", "Continue with Google", "or use your email", "Email", "Password", "Show password", "Sign in", "Forgot password?", "New here? Create an account". Create-account: "Create an account", "Your name", "Create account", "Already have an account? Sign in". Reset: "Reset your password", "Send reset link", "Back to sign in". Exactly as in REQ-001 r4's copy of record.
- **Don't assert:** messages (each has its own case).

### TC-01-N20 — After a failed submit, focus goes to the first field with an error
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** "Create an account" with the name and email empty.
- **Action:** Press "Create account".
- **Expected:** "Enter your name" and "Enter your email address" under their fields; keyboard focus in "Your name".
- **Don't assert:** scroll position.

### TC-01-N21 — Tabbing past an empty field shows no error until submit
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Each signed-out page, fields empty.
- **Action:** Tab through every field without typing.
- **Expected:** No error appears; errors for empty fields appear only on submit (REQ-001 r4, "When fields are checked").
- **Don't assert:** focus styling.

## Block O — Phones (DEF-001)

Role for this block: **anyone, signed out**, unless stated.

### TC-01-O1 — On a real phone profile, the sign-in page uses the phone layout
**Priority** P1 · **Type** Responsive · **Layer** UI · **Writes** No
- **Setup:** Phone emulation with `isMobile` (Pixel 5, 375 × 812), **not** a narrowed desktop window (that hides DEF-001).
- **Action:** Open the sign-in page; read `innerWidth`.
- **Expected:** Layout width 375; one card; readable text without zoom; the viewport meta tag is present.
- **Don't assert:** font sizes.

### TC-01-O2 — No horizontal scroll at 375 px
**Priority** P2 · **Type** Responsive · **Layer** UI · **Writes** No
- **Setup:** As O1, on the sign-in, create-account, reset, "Enter your invite code" (U-N), "What's your name?" (U-GN) and guard holding (U-GD) pages, including the in-app notice (D19) and the banner (F4).
- **Action:** Check the page's scroll width.
- **Expected:** No wider than the screen on any of them.
- **Don't assert:** vertical length.

### TC-01-O3 — With the keyboard open, the primary button can be reached
**Priority** P3 · **Type** Responsive · **Layer** Manual · **Writes** No
- **Setup:** A real phone or simulator with an on-screen keyboard.
- **Action:** Focus the password field; try to reach "Sign in".
- **Expected:** Reachable without closing the keyboard (scroll is fine).
- **Don't assert:** exact position.

### TC-01-O4 — The sign-in page works in landscape on a phone
**Priority** P3 · **Type** Responsive · **Layer** UI · **Writes** No
- **Setup:** Phone profile rotated to landscape.
- **Action:** Sign in as U-P.
- **Expected:** All controls usable; no horizontal scroll; signs in.
- **Don't assert:** layout details.

### TC-01-O5 — On a desktop the sign-in page shows a single centred card
**Priority** P3 · **Type** Responsive · **Layer** UI · **Writes** No
- **Setup:** 1280 px wide.
- **Action:** Open the sign-in page.
- **Expected:** One card, centred.
- **Don't assert:** card width.

## Block P — Double taps and two sessions

### TC-01-P1 — Double-tapping "Sign in" sends exactly one request
**Priority** P2 · **Type** Concurrency · **Layer** Unit · **Writes** No
- **Role / setup:** Homeowner, U-P.
- **Action:** Double-tap "Sign in".
- **Expected:** One sign-in request.
- **Don't assert:** the disabled state (N12).

### TC-01-P2 — Double-tapping "Create account" creates exactly one account and one person record
**Priority** P1 · **Type** Concurrency / data integrity · **Layer** UI · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW.
- **Action:** Double-tap "Create account".
- **Expected:** One Auth user, one `users` doc, one verification code; no "already an account" message shown.
- **Don't assert:** timing.

### TC-01-P3 — The same email signed up in two tabs at once creates one account
**Priority** P2 · **Type** Concurrency · **Layer** API · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW, two tabs or two devices.
- **Action:** Press "Create account" in both at about the same time.
- **Expected:** One account; the other tab shows the G1 message.
- **Don't assert:** which tab wins.

### TC-01-P4 — Double-tapping "Continue with Google" opens one popup
**Priority** P3 · **Type** Concurrency · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G.
- **Action:** Double-tap "Continue with Google"; complete the popup.
- **Expected:** One popup; signed in; no "popup closed" style error left on the page.
- **Don't assert:** the in-flight label (D15).

### TC-01-P5 — Double-tapping "Send reset link" sends one request
**Priority** P3 · **Type** Concurrency · **Layer** Unit · **Writes** Yes
- **Role / setup:** Homeowner, U-P, on the reset page.
- **Action:** Double-tap "Send reset link".
- **Expected:** One reset request; one reset code.
- **Don't assert:** the message's timing.

### TC-01-P6 — Double-tapping "Send again" sends one verification request
**Priority** P3 · **Type** Concurrency · **Layer** Unit · **Writes** Yes
- **Role / setup:** As F4.
- **Action:** Double-tap "Send again".
- **Expected:** One new verification code.
- **Don't assert:** the banner's wording (F17).

### TC-01-P7 — Double-tapping "Continue" on "What's your name?" saves once
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F12.
- **Action:** Type a name; double-tap "Continue".
- **Expected:** One `users` write; "Enter your invite code" opens once.
- **Don't assert:** the disabled state (F25).

## Block Q — Integration with the other REQs and the existing app

### TC-01-Q1 — The important-announcement pop-up does not appear on the sign-in page
**Priority** P2 · **Type** Integration (modal mid-flow) · **Layer** UI · **Writes** No
- **Role / setup:** Signed out; an unacknowledged important announcement exists (as NAV-05).
- **Action:** Open the portal.
- **Expected:** No pop-up; the sign-in form is usable.
- **Don't assert:** the banner.

### TC-01-Q2 — After sign-in the pop-up shows once on the dashboard and doesn't block "Sign out"
**Priority** P2 · **Type** Integration · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G; as Q1.
- **Action:** Sign in; then sign out while the pop-up is up (or after closing it).
- **Expected:** The pop-up shows once on the dashboard; "Sign out" still works.
- **Don't assert:** the pop-up's wording.

### TC-01-Q3 — A not-linked person never sees the announcement pop-up
**Priority** P2 · **Type** Integration / security · **Layer** UI · **Writes** No
- **Role / setup:** Not-linked, U-N; as Q1.
- **Action:** Sign in.
- **Expected:** No pop-up on the not-linked or invite-code screens.
- **Don't assert:** anything else on the screen.

### TC-01-Q4 — Each staff sub-role lands on the staff view, not the not-linked screen
**Priority** P2 · **Type** Integration · **Layer** Unit · **Writes** No
- **Role / setup:** Treasurer (U-TR), admin office (U-AD), board (U-BD), each signed out.
- **Action:** Sign in as each.
- **Expected:** The staff dashboard for that role (REQ-002); never the not-linked screen.
- **Don't assert:** the staff menus (TC-02).

### TC-01-Q5 — A treasurer who is also a homeowner gets the view switch
**Priority** P3 · **Type** Integration · **Layer** Unit · **Writes** No
- **Role / setup:** Treasurer + homeowner, U-TRH.
- **Action:** Sign in.
- **Expected:** The staff view with the "Treasurer | My household" switch (2B).
- **Don't assert:** the switch's behaviour (TC-02).

### TC-01-Q6 — A guard-only account in R1 lands on the guard holding page
**Priority** P2 · **Type** Integration (owner decision 4) · **Layer** Unit · **Writes** No
- **Role / setup:** Guard, U-GD (no household), before the gate screens are released.
- **Action:** Sign in.
- **Expected:** The page headed "Gate screens aren't open yet", with "Keep using the gate's logbook until the admin office tells you they are ready.", "Signed in as {email}" and "Sign out"; no menu, no household and no staff page.
- **Don't assert:** that `setRole` refuses the guard role (TC-02, REQ-002 follow-up).

### TC-01-Q7 — An invite link's code survives Google sign-in
**Priority** P1 · **Type** Integration · **Layer** UI · **Writes** Yes
- **Role / setup:** New homeowner (a new emulator Google user); a REQ-004 invite link `…/join#<code>` for a test household.
- **Action:** Open the link signed out; press "Continue with Google"; complete the popup.
- **Expected:** The confirm-lot screen (4C) opens with the code filled in, without typing it.
- **Don't assert:** redeeming (TC-04).

### TC-01-Q8 — An invite link's code survives creating an account by email
**Priority** P1 · **Type** Integration · **Layer** UI · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW; an invite link as Q7.
- **Action:** Open the link signed out; "Create an account" by email.
- **Expected:** 4C opens with the code filled in.
- **Don't assert:** redeeming (TC-04).

### TC-01-Q9 — The name typed at sign-up is the one the admin office sees
**Priority** P2 · **Type** Integration / round-trip · **Layer** UI · **Writes** Yes
- **Role / setup:** New homeowner U-NEW signs up as "Lito ZZTest" and redeems an invite for ZZ Test Household E; admin office U-AD.
- **Action:** U-AD opens Household E's detail.
- **Expected:** "Lito ZZTest" under "People with portal access", same spelling.
- **Don't assert:** other detail fields.

### TC-01-Q10 — A name containing markup shows as plain text to the admin office
**Priority** P2 · **Type** Security (stored XSS) · **Layer** UI · **Writes** Yes
- **Role / setup:** As G16's account, linked to Household E; admin office U-AD.
- **Action:** U-AD opens Household E's detail and the directory.
- **Expected:** The name shows as text in both; no script runs.
- **Don't assert:** truncation.

### TC-01-Q11 — A homeowner whose membership is removed while signed in loses the household on the next read *(provisional: ADR-004 `exists(members/...)`)*
**Priority** P2 · **Type** Stale reference · **Layer** UI · **Writes** Yes
- **Role / setup:** Homeowner. A disposable account linked to a disposable household, signed in on the dashboard; admin removes the membership (REQ-004).
- **Action:** The homeowner opens another screen.
- **Expected:** The read is refused; the not-linked screen; no household data after the removal.
- **Don't assert:** a message about the removal (not stated).

**Q12 (cross-reference, not a case) — A staff member whose role is removed while signed in.**
Cross-reference only: owned by **TC-02** (REQ-002 decision 1, "at once"; ADR-004 `staff/{uid}` check). Not counted here.

### TC-01-Q13 — A guard who is also linked to a household lands on that household's dashboard with no gate menu
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Guard + homeowner, U-GD-H (linked to Household G), before the gate screens are released.
- **Action:** Sign in.
- **Expected:** Household G's dashboard with the homeowner menu; no gate menu, no guard holding page, no "Guard" in any view switch.
- **Don't assert:** the dashboard figures.

## Block R — Project settings (go-live checklist) *(provisional: SA-001 §8.4, §8.3, ADR-005)*

These check settings, not code. Each runs on **`hoa-portal-staging`** and on the emulator seed where stated. On each **production** project they are **read-only console inspections by the owner** before it takes real users: no sign-ins, no test data. Role for this block: **Firebase console operator** (not an app role).

### TC-01-R1 — Email enumeration protection is on
**Priority** P1 · **Type** Security / config · **Layer** Manual (console) · **Writes** No
- **Setup:** Console access to each project.
- **Action:** Open Authentication settings.
- **Expected:** Email enumeration protection is on.
- **Don't assert:** other settings.

### TC-01-R2 — The password policy is Require, with force upgrade on sign-in, minimum 8
**Priority** P1 · **Type** Security / config · **Layer** Manual (console) · **Writes** No
- **Setup:** As R1.
- **Action:** Open the password policy.
- **Expected:** Enforcement on (Require); "force upgrade on sign-in" on; minimum length 8 (owner decision 3). The policy was set before the project's first account.
- **Don't assert:** other character requirements (REQ-001 sets none). A later tightening is a new owner decision.

### TC-01-R3 — Authorised domains list only that project's own domains
**Priority** P1 · **Type** Security / config · **Layer** Manual (console) · **Writes** No
- **Setup:** As R1.
- **Action:** Open Authorised domains.
- **Expected:** No staging or `localhost` domain on a production project; no production domain on staging.
- **Don't assert:** Firebase's default domains for that same project.

### TC-01-R4 — The Google provider is enabled
**Priority** P2 · **Type** Config · **Layer** Manual (console) · **Writes** No
- **Setup:** As R1.
- **Action:** Open Sign-in providers.
- **Expected:** Email/Password and Google enabled; no other provider (no phone).
- **Don't assert:** the support email shown.

### TC-01-R5 — "One account per email address" is set
**Priority** P1 · **Type** Security / config · **Layer** Manual (console) · **Writes** No
- **Setup:** As R1.
- **Action:** Open the account-linking setting.
- **Expected:** One account per email address (H1–H6 and P3 depend on it). Sol Arch is adding it to SA-001 §8.4.
- **Don't assert:** anything else.

### TC-01-R6 — With App Check enforced, sign-in and the first dashboard read still work *(provisional: SA-001 §8.3)*
**Priority** P2 · **Type** Security / integration · **Layer** Manual (staging) · **Writes** No
- **Setup:** Staging, App Check registered and enforced; homeowner U-P. (Emulator runs use the App Check debug provider.)
- **Action:** Sign in and load the dashboard.
- **Expected:** Both work.
- **Don't assert:** App Check metrics.

### TC-01-R7 — With App Check enforced, a request with no App Check token is refused
**Priority** P2 · **Type** Security · **Layer** API (staging) · **Writes** No
- **Setup:** As R6.
- **Action:** Read a Firestore document with a valid sign-in token but no App Check token.
- **Expected:** Refused.
- **Don't assert:** the error text.

### TC-01-R8 — Reset and verification emails arrive in a test inbox on staging
**Priority** P2 · **Type** Integration (copy promises an email) · **Layer** Manual (staging) · **Writes** Yes
- **Setup:** Staging; a real test inbox on the team's domain.
- **Action:** Ask for a reset; create an account.
- **Expected:** Both emails arrive. Note whether they land in the inbox or spam (SA-001 Q7, sending domain, is open).
- **Don't assert:** delivery time.

### TC-01-R9 — The emulator seed turns email enumeration protection on
**Priority** P1 · **Type** Config (test precondition) · **Layer** API · **Writes** No
- **Setup:** The emulator's Auth config or exported `config.json` (`enableImprovedEmailPrivacy`).
- **Action:** Start the emulator from the seed; sign in with U-NONE and any password.
- **Expected:** The refusal is the same as for a wrong password (not "email not found"). C3, C5, E3, E4 run on the emulator only after this passes.
- **Don't assert:** the setting's name if the emulator version renames it.

### TC-01-R10 — The guard role is turned off on production until the gate release
**Priority** P2 · **Type** Security / config · **Layer** TBD — QE · **Writes** No
- **Setup:** Each production project's function configuration (read-only; the owner on production).
- **Action:** Read `GUARD_ROLE_ENABLED`.
- **Expected:** Off until the gate screens are released (owner decision 4).
- **Don't assert:** the setting on staging (it may be on for tests).

## Block S — Back-compat

### TC-01-S1 — A role left in browser storage by the mock-up does not choose the role in the real app *(provisional: SA-001 §11.2)*
**Priority** P2 · **Type** Back-compat / security · **Layer** UI · **Writes** No
- **Role / setup:** Homeowner, U-G. On the real app's origin, pre-seed `localStorage` with the mock-up's stored state including `UI.role = "admin"`.
- **Action:** Sign in.
- **Expected:** Household A's homeowner dashboard; no admin screen or menu.
- **Don't assert:** whether the old key is deleted. Applies only if the real app is ever served on an origin that hosted the mock-up.

### TC-01-S2 — A password set before the 8-character policy is refused with the reset message
**Priority** P3 · **Type** Back-compat (owner decision 3) · **Layer** Manual (staging) · **Writes** No
- **Role / setup:** Homeowner, U-OLDPW. **Env: staging only** (the emulator doesn't copy the policy).
- **Action:** Sign in with its email and its 6-character password.
- **Expected:** Not signed in; "Your password is shorter than we now allow. Reset your password to choose a new one of at least 8 characters."
- **Don't assert:** the error code.

### TC-01-S3 — "Reset your password" in that message opens the reset page with the email filled in
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** After S2. **Env: staging only.**
- **Action:** Press "Reset your password" in the message.
- **Expected:** The reset page with U-OLDPW's email filled in.
- **Don't assert:** focus.

### TC-01-S4 — On the same project, a wrong password of 8 or more characters still gets the shared message
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-OLDPW and U-NONE. **Env: staging only.**
- **Action:** Sign in with U-OLDPW's email and a wrong 9-character password; then with U-NONE.
- **Expected:** Both show the C1 / C14 alert, not the policy message.
- **Don't assert:** what a wrong password **shorter** than 8 shows (Sol Arch: may get the policy message, Uncertain).

## Block T — Exploratory charters

### TC-01-T1 — 20 minutes: signing in from links opened inside phone apps
**Priority** P2 · **Type** Exploratory · **Layer** Manual · **Writes** No
- **Role / setup:** Homeowner, U-G and U-P, on a real Android phone. Staging.
- **Charter:** Open the portal link from Facebook Messenger, Gmail, Viber and SMS. Try "Continue with Google" and email sign-in in each app's built-in browser. Look for: Google refusing to sign in inside an embedded browser, a popup that never returns, the session landing in the app's browser instead of Chrome, the invite code lost.
- **Don't assert:** pass/fail; report findings (which apps the in-app notice must cover, D19).

### TC-01-T2 — 15 minutes: one shared family phone, two homeowners
**Priority** P2 · **Type** Exploratory · **Layer** Manual · **Writes** No
- **Role / setup:** Homeowners U-G and U-P, one phone.
- **Charter:** Take turns: sign in, browse, sign out, switch to Google, use Back, the app switcher, and a home-screen shortcut. Look for any glimpse of the other household's data or a session that didn't end.
- **Don't assert:** pass/fail; report findings.

### TC-01-T3 — 15 minutes: slow and flaky network
**Priority** P3 · **Type** Exploratory · **Layer** Manual · **Writes** No
- **Role / setup:** Homeowner U-P and new U-NEW accounts.
- **Charter:** Throttle to slow 3G and toggle offline mid-request on sign-in, create account, reset and "Send again". Look for stuck "Signing in…", duplicate accounts, a missing `users` doc, lost typing, and errors that don't say what to do.
- **Don't assert:** pass/fail; report findings.

### TC-01-T4 — 15 minutes: staying signed in on an iPhone over weeks
**Priority** P3 · **Type** Exploratory · **Layer** Manual · **Writes** No
- **Role / setup:** Homeowner U-G on an iPhone (Safari), once as a normal tab and once added to the home screen. Staging.
- **Charter:** Safari deletes script-written storage (where the session lives) after 7 days of Safari use without visiting the site, unless the app is on the home screen. Homeowners sign in once or twice a month. Check what a homeowner sees after more than 7 days away, in both set-ups. Report to Sol Arch (SA-001 risk).
- **Don't assert:** pass/fail; report findings.

---

## Requirement gaps for the BA

**All of G-1 to G-21 are answered by REQ-001 r4** (G-9 and G-10 were withdrawn in v1.1). Where each answer lands:

| # | Answer in r4 | Cases now unblocked or added |
|---|---|---|
| G-1 Copy | Every missing line added; name required, 1–80 trimmed | C7–C9, G12, G15, I4, N2, N3, N19, F33, E14, E15, G18–G20 |
| G-2 Google name | From the Google profile, else "What's your name?"; first word; "Welcome back" with none; never overwritten | A3, A5–A7, F12, F24–F31 |
| G-3 Phone | Not collected | F8, J11 |
| G-4 Trimming | Emails and names trimmed; passwords never | C11, C15, C16, E13, F10, F32, G14 |
| G-5 Turned-off | Message of record; signed out on the next open; within an hour if left open | D11–D14 |
| G-6 Banner | Under the top bar on every signed-in page; not dismissible; "Sent…"; rate-limit line | F4, F15–F19 |
| G-7 Carry the email | Memory only, editable, never in the address | M16–M19, G4, G5, H7, S3 |
| G-8 Google closed / blocked | Closed: silent within 10 s; blocked: message; other: generic | D9, D10, D17 |
| G-11 Deep link | Return to the page asked for; `?next=` ignored | M3, M12–M15, M20 |
| G-12 Error placement | Field errors under the field; form errors above the form | N5, N6, N20, N21 |
| G-13 Old passwords | Require + force upgrade; reset message | S2–S4, R2 |
| G-14 In-app browsers | Notice, "Copy link", "Press and hold to copy" | D19–D24, T1 |
| G-15 Offline | One line per page | D7, D8, D18 |
| G-16 Google vs password account | Message with the email filled in; generic fallback; verified Gmail → same account | H5–H8 |
| G-17 Google-only accounts | Second line on the wrong-password alert; reset may add a password | C12, C14, E10–E12 |
| G-18 Landing | One "Enter your invite code" page | I1–I6, F2, M15 |
| G-19 Guard in R1 | Holding page; guard + household → household dashboard | Q6, Q13, J27, R10 |
| G-20 Google in flight | "Opening Google…"; email button disabled too | D15, D16, P4 |
| G-21 Record not saved | 15-second message; code not used up; repaired on retry or next open | F11, F20–F23, F26 |

**New gaps from v1.2** (small; for the BA's next REQ-001 revision):

| # | Gap | Cases affected |
|---|---|---|
| G-22 | **A linked homeowner whose person record went missing and whose name is lost.** r4 sends them to "What's your name?". After it, do they land on the page they asked for, or the dashboard? | F22 (variant) |
| G-23 | **The in-app notice on the create-account page.** r4 puts it "above Continue with Google" on the sign-in page. The create-account page has the same button: does the notice show there too? QA expects yes | D19 (variant) |

## Open with Sol Arch (not BA gaps)

| Item | Status after REQ-001 r4 | Cases |
|---|---|---|
| `createdAt` on `users` and the rule that it equals server time | Still an SA-001 follow-up; r4's rule lists `createdAt` | F8, J11, J15 |
| The own-uid self-read rule for `members` and `staff` | Still open in SA-001 §8.1 | J4, J5 |
| Whether a co-member of the same household may read your `users` doc | Still open (§8.2 vs REQ-001 Data) | J22 |
| "One account per email address" in §8.4 | In r4's go-live list; SA-001 follow-up | R5, H1–H8 |
| Branding while signed out | Still open | M2, J10 |
| iPhone Safari deleting the session after 7 days | Still an SA-001 risk to add | T4 |
| Forcing a token refresh at boot | **Answered by r4:** the app refreshes the account once on every open | D12, F6 |
| `users` create-only, name 1–80 trimmed, no `phone`, no update in R1 | From r4's Sol Arch review; SA-001 §4.2 to follow | J11, J17, J24–J26 |
| Letters vs bytes for "80 characters" | Settled by rules tests (r4) | J26 |
| `redeemInvite` refuses without a `users` record | REQ-004 follow-up | F20 |
| `GUARD_ROLE_ENABLED` and `setRole` refusing the guard role | REQ-002 follow-up; TC-02 owns `setRole` | R10, Q6 |
| New learning: the emulator does not copy console Auth settings | Still to record in LEARNINGS | header, R9 |

## QA response to QE's findings (v1.1 triage)

| # | QE finding | QA response |
|---|---|---|
| 1 | F14 can't be proven on the emulator | **Accepted.** F14 is now **Env: staging only**, with a real Google account |
| 2 | G15 holds two behaviours | **Accepted.** G15 is the 80 / 81 rule; G17 is the 375 px layout |
| 3 | Q11 mixes a rules refusal with a re-route | **Accepted as is.** TC-04-K2 already proves the rules refusal at API after a removal; TC-01 Q11 stays the UI re-route |
| 4 | C7–C9 rely on G7 for "typing kept" | **Accepted.** No extra UI case: r4 uses one field-check rule for all three pages |
| 5 | Emulator parity assumed in C10, D11, D12, E7 | **Accepted.** C10, D11 and D12 now say *Assumption (emulator parity)*; E7 already forces a refresh. QE moves any that differ to staging |
| 6 | K3 relies on Chromium keeping the back-forward cache | **Accepted.** If Playwright can't keep it, K3 becomes Manual on a real phone |
| 7 | R6 is Manual | **Accepted** |

## v1.2 change log (for QE)

**Changed cases (QE's layer kept; re-check if the change moves it):** A3, C1, C7, C8, C9, C10, C11, C12, D3, D7, D8, D9, D10, D11, D12, E10, F4, F8, F10, F11, F12, F14 (now staging only), G4, G5, G12, G14, G15, H5, H6, I1, I2, I3, I4, I5, J11, J17 (**now a refusal**), J22, M3, N2, N3, N5, N6, N16, N19, O2, Q6, R2, S2.

**Unblocked** (had "Blocked on G-n" in v1.1): C11, D7, D8, D10, E10, F10, F12, G12, G14, G15, H6, M3, N6, Q6, S2. J22 stays blocked, on Sol Arch.

**New cases (Layer `TBD — QE`):** A5–A7; C14–C16; D13–D24; E11–E16; F15–F33; G17–G21; H7, H8; I6; J24–J27; M12–M20; N20, N21; P7; Q13; R10; S3, S4.

**Fixtures added:** U-GD-H, U-GC, U-GN, U-OLDPW; U-GM-V now linked to Household F. `COVERAGE-MAP.md` is QE's to update.

## Coverage summary

"Blocked" cases have no expected result until what they name is settled. "New" cases carry Layer `TBD — QE`.

| Block | Scenario | Cases | P1 | Blocked | New in v1.2 |
|---|---|---|---|---|---|
| A | Sign in with Google | 7 | 2 | 0 | 3 |
| B | Sign in with email and password | 1 | 1 | 0 | 0 |
| C | Wrong credentials and sign-in field checks | 16 | 3 | 0 | 3 |
| D | Refusals, Google states, in-app browsers | 24 | 1 | 0 | 12 |
| E | Password reset | 16 | 6 | 0 | 6 |
| F | Creating an account, names, banner | 33 | 7 | 0 | 19 |
| G | Account-creation validation | 21 | 5 | 0 | 5 |
| H | Google and existing password accounts | 8 | 3 | 0 | 2 |
| I | Signed in, not linked | 6 | 2 | 0 | 1 |
| J | Access control and rules | 27 | 15 | 1 | 4 |
| K | Signing out | 8 | 5 | 0 | 0 |
| L | Staying signed in | 2 | 1 | 0 | 0 |
| M | Navigation, deep links, carried email | 20 | 2 | 0 | 9 |
| N | Usability and accessibility | 21 | 0 | 0 | 2 |
| O | Phones (DEF-001) | 5 | 1 | 0 | 0 |
| P | Double taps and two sessions | 7 | 1 | 0 | 1 |
| Q | Integration | 12 | 2 | 0 | 1 |
| R | Project settings (provisional) | 10 | 5 | 0 | 1 |
| S | Back-compat and older passwords | 4 | 0 | 0 | 2 |
| T | Exploratory charters | 4 | 0 | 0 | 0 |
| **Total** | | **252** | **62** | **1** | **71** |

Every Gherkin scenario in REQ-001 r4 (S1–S50) has at least one runnable case (Acceptance table). Every mandatory type is covered: negative (C, D, E, G, J), boundary (A5–A7, C10, C11, C15, F30–F32, G6, G10, G15, G21, J25, L1), usability (N, D19–D23), navigation (M, K2, I2, J3).

---

## QE triage

*QE-owned. Written at triage, 2026-11-28, against TC-01 v1.1 (owner-approved, `db9245e`). QA owns everything above this line; QE changed only each case's **Layer** field and added the layer legend.*

### Shape

| Layer | Cases | Of the 159 automated | Notes |
|---|---|---|---|
| Unit | 21 | 13% | 5 blocked: C11, F12 (partly runnable), G12, G15, Q6 |
| API | 44 | 28% | 41 on the emulator, 3 on staging (E8, G9, R7). 4 blocked: E10, F10, G14, J22 |
| UI | 94 | 59% | 5 blocked: D7, D8, D10, M3, N6 |
| Manual | 22 | — | 11 on staging, 5 console, 6 judgement / real phone / exploratory. 2 blocked: H6, S2 |
| **Total** | **181** | | 16 blocked, as in QA's summary |

**The UI share is far above the 70 / 20 / 10 target**, and that is expected for this requirement: REQ-001 is mostly pages, focus, labels, routing and what a signed-out browser can see (blocks K, M, N, O). Its logic is thin and lives in Firebase. QE is raising it with Sol Arch anyway, with the cases that can move down (see *For Sol Arch* below). Keep the UI suite fast by batching: most UI cases are short assertions after one sign-in, and the specs group them so one page load serves several cases.

### Where each case went, and why

- **Unit (21).** Everything that is a rule about inputs: the copy for each Auth error code (C6, D1), field validation and its "no request is sent" half (C7–C9, G6, G8, G10, and blocked C11, G12, G15), the greeting's first name (A3, F12), the landing choice for each staff role (Q4–Q6), the in-flight guard for double taps (P1, P5, P6), and two source scans (C13 no `fetchSignInMethodsForEmail`; N15 no "Log in" / "Log out" and one spelling of "invite code"). These need Dev to build the seams listed under *Unit scenarios for Dev*.
- **API (44).** What Firebase or the rules decide: identical refusals (C5), case-insensitive email (C10, G13), Google-only account on the email form (C12), disabled account (D11), duplicate and concurrent sign-up (G3, P3), unicode passphrase (G11), reset effects (E4–E7, E10), what account creation writes (F7–F11), and every rules cell in block J. R9 runs **first**, as a Playwright project dependency: C3, C5, E3 and E4 do not start unless the emulator seed's enumeration protection is proven on.
- **UI (94).** What only the browser shows or does: every page's messages and kept typing, offline, the Google popup (emulator fake Google user), routing and Back, storage after sign-out, two tabs, focus and keyboard, tap targets, the phone profile, the pop-up and invite-link integration. **E2, F1, F5 stay UI on purpose:** they guard the "copy promises what the code doesn't do" failure shape, so the click must be real and the proof is the emulator's out-of-band code store.
- **Manual (22), with reasons:**
  - **A4, H1–H6, F14 (staging, real Google).** Google blocks automated browsers and the team Gmail accounts carry 2-step verification, so real Google sign-in is never scripted. One staging session runs all eight. Disposable fixtures are recreated before it.
  - **R6 (staging).** App Check with reCAPTCHA scores an automated browser as a bot; a CI debug token would prove nothing about real users. A person signs in on staging with App Check enforced.
  - **R8 (staging).** Needs real email delivered to a real test inbox.
  - **S2 (staging, blocked on G-13).** Needs an account made before the policy was set to Require; making one means changing staging's policy and back, which is a console change, not a test step.
  - **R1–R5 (console).** Settings, not behaviour. On production these are the owner's read-only console checks before go-live; on staging QE does the same read.
  - **N16** is a look-and-feel judgement; **O3** needs a real on-screen keyboard; **T1–T4** are exploratory charters.

### Staging and the emulator

- **Tagged Env: staging only by QA (10):** A4, E8, G9, H1–H6, S2. Kept as tagged. E8 and G9 are automated on staging (E8 builds its reset link with the Admin SDK's `generatePasswordResetLink`, so no email is sent); the other 8 are manual.
- **Also on staging by their setup:** R6, R7, R8, T1, T4, and R1–R5's staging read. R7 is automated, read-only.
- **R9 is the emulator seed precondition** for C3, C5, E3, E4 (above).
- **Block R on production:** owner only, console only, read-only. No QE spec ever has a production host in its allow-list.
- **Staging specs** live in `tests/specs/staging/`, get their own Playwright project, and their environment guard lists only the staging host. That host comes from SA-001 / ADR-005 (Draft); the guard is not written until it is approved.

### Unit scenarios for Dev

Dev writes these with the auth feature; QE reviews them against this list. Each needs a seam the code must have:

| Module (anticipated, SA-001 §9) | Cases | Seam it needs |
|---|---|---|
| `web/src/features/auth/auth-messages.js` | C6, D1 | `authErrorMessage(code)`: every credential code → the shared C1 copy; `auth/too-many-requests` → D1's copy |
| `web/src/features/auth/validate.js` | C11, G6, G10, G12, G15 | `validateSignIn(form)`, `validateSignUp(form)` returning field errors. C11, G12, G15 wait on G-4 / G-1 |
| `web/src/features/auth/auth-controller.js` | C7, C8, C9, G8, P1, P5, P6 | Submit handlers taking an **injected auth port**: no port call when validation fails; one call when invoked twice while in flight |
| `web/src/features/auth/greeting.js` | A3, F12 | `greetingName(user, person)`: first word; never "", "undefined" or "null" |
| `web/src/app/landing.js` | Q4, Q5, Q6 | `resolveLanding({ signedIn, memberships, staff, verified })` → screen id, plus whether the view switch shows |
| `web/src/features/auth/source-checks.test.js` | C13, N15 | Scans `web/src/`; needs the user-visible copy kept in one copy module |

### Locator contract (asked of Dev)

Ship these on the real app's auth screens. If a name changes, tell QE.

| Screen | Element | Hook |
|---|---|---|
| Every screen | Heading | `data-testid="screen-<view>"` on the `<h1>` (already asked in `tests/README.md`) |
| Every screen | Footer build id | `data-testid="app-version"` showing `APP_VERSION` |
| Sign in (1A) | Heading "Sign in to {HOA}" | `data-testid="screen-sign-in"` |
| | Continue with Google | `data-action="google-sign-in"` (same hook on create-account) |
| | Email, Password | `data-testid="signin-email"`, `data-testid="signin-password"` |
| | Show password | `data-action="toggle-password"` |
| | Forgot password? | `data-action="go-reset"` |
| | Sign in | `data-action="sign-in"` |
| | New here? Create an account | `data-action="go-create-account"` |
| All auth forms | Form-level error (`role="alert"`) | `data-testid="form-error"` |
| | Field error under a field | `data-testid="error-<field>"` (`error-email`, `error-password`, `error-name`) |
| Create account (1F) | Your name, Email, Password | `data-testid="signup-name"`, `signup-email`, `signup-password` |
| | Create account | `data-action="create-account"` |
| | Already have an account? Sign in | `data-action="go-sign-in"` |
| | Links inside the duplicate-email message | `data-action="dup-sign-in"`, `data-action="dup-reset"` |
| Reset (1E) | Email, Send reset link | `data-testid="reset-email"`, `data-action="send-reset"` |
| | Confirmation message | `data-testid="reset-confirmation"` |
| | Back to sign in | `data-action="back-to-sign-in"` |
| Not linked (1G) | Screen, "Signed in as {email}" | `data-testid="screen-not-linked"`, `data-testid="signed-in-as"` |
| Invite code (4B), confirm lot (4C) | Screen, code field | `data-testid="screen-invite-code"`, `data-testid="screen-confirm-lot"`, `data-testid="invite-code"` (REQ-004 may own the names) |
| No access (2C) | Screen, Go to my dashboard | `data-testid="screen-no-access"`, `data-action="go-my-dashboard"` |
| Signed-in shell | Verification banner, Send again | `data-testid="verify-banner"`, `data-action="resend-verification"` |
| | Greeting, header lot label | `data-testid="greeting"`, `data-testid="header-lot"` |
| | Account menu, Sign out | `data-action="account-menu"`, `data-action="sign-out"` |
| | Nav while the role loads; staff nav | `data-testid="nav-skeleton"`, `data-testid="nav-staff"` |
| Routes | Sign-in, create-account, reset, not-linked | Stable paths, named by Dev (for M1, M7–M9) |

### Spec files

**New (planned, none written yet):**

| File | Layer | Cases |
|---|---|---|
| `tests/specs/api/auth-emulator-seed.spec.js` | API | R9 (runs first; others depend on it) |
| `tests/specs/api/auth-credentials.spec.js` | API | C5, C10, C12, D11, G3, G11, G13, G14, P3 |
| `tests/specs/api/auth-reset.spec.js` | API | E4, E5, E6, E7, E10 |
| `tests/specs/api/account-creation.spec.js` | API | F7, F8, F9, F10, F11 |
| `tests/specs/api/rules-access.spec.js` | API | J2, J4–J10 |
| `tests/specs/api/rules-users.spec.js` | API | J11–J23 |
| `tests/specs/staging/auth-policy.staging.spec.js` | API (staging) | E8, G9 |
| `tests/specs/staging/app-check.staging.spec.js` | API (staging) | R7 |
| `tests/specs/ui/sign-in.spec.js` | UI | A1, A2, B1, C1–C4, D2–D6, D9, D10, D12, P4 |
| `tests/specs/ui/password-reset.spec.js` | UI | E1, E2, E3, E9, D8 |
| `tests/specs/ui/create-account.spec.js` | UI | F1–F6, F13, G1, G2, G4, G5, G7, G16, D7, P2 |
| `tests/specs/ui/not-linked.spec.js` | UI | I1–I5, M8, Q3 |
| `tests/specs/ui/auth-routing.spec.js` | UI | J1, J3, M1–M7, M9, M11, L2, S1 |
| `tests/specs/ui/sign-out.spec.js` | UI | K1–K8, L1, M10 |
| `tests/specs/ui/auth-a11y.spec.js` | UI | N1–N14, N17–N19 |
| `tests/specs/ui/auth-phone.spec.js` | UI (`mobile` project) | O1, O2, O4, O5 |
| `tests/specs/ui/auth-integration.spec.js` | UI | Q1, Q2, Q7–Q11 |

**Smoke:** B1, I1, M1 and M2 carry the `@smoke` tag in their own specs (the TC's two new smoke items), rather than being copied into `smoke.spec.js`.

**Changed (when the real app exists):**

- `smoke.spec.js`: every role item starts from a signed-in fixture (homeowner, treasurer, admin office, board, guard) instead of the role switch.
- `navigation.spec.js`: NAV-02 (role switch) retires; NAV-01 becomes "a homeowner fixture lands on the dashboard"; NAV-04's reload check is replaced by L2. NAV-07 / NAV-08 re-run under `mobile` with O1 (DEF-001).
- `vehicle-registration.spec.js`: VEH-J1 signs the homeowner and admin in.
- Support: signed-in fixtures per role in `tests/fixtures/test.js`; an emulator helper (out-of-band codes, Admin SDK for disposable accounts); `playwright.config.js` gains `api` and `staging` projects; `.env.example` gains every fixture's email and password variable (names only).

### Automation order (highest consequence first)

1. **Harness:** environment guard per project, emulator helpers, signed-in fixtures, **R9**.
2. **Data isolation in rules:** J2, J4–J23 (13 of the 59 P1s).
3. **Data visible to the wrong person in the browser:** K3, K4, K6, J1, M1, I5, F3, G16.
4. **Account enumeration:** C5, C6, C3, E3, E4.
5. **Core paths, with the existing suite re-baselined at the same time** (the TC's top regression risk): B1, A1, A2, I1, M2, F1, F2, K1, K2, L1, L2.
6. **Account data integrity:** F7–F9, F11, P2, P3, G3, Q10.
7. **Reset:** E1, E2, E5, E6, E7.
8. **Integration:** Q7, Q8, Q1–Q3, Q9, Q11.
9. **Error and offline states, validation units:** blocks C, D, G remainder.
10. **Usability, phones, navigation:** blocks N, O, M remainder.
11. **Staging:** G9, E8, R7, then the manual staging session (A4, H1–H6, F14, R6, R8) and the owner's console checklist (R1–R5) before go-live.

### Implementation status

2026-11-28: **nothing automated.** The real app doesn't exist (only the mock-ups `index.html` and `gentri-heights/index.html`, which have no sign-in), and Dev waits on SA-001 approval. Every row is **Planned**, or **Blocked** on the gap it names. No spec, fixture or config was written at triage.

### Findings for QA

These are QE's reading of the cases, for QA to accept or reject. QE did not change the cases.

1. **F14 can't be proven on the emulator.** The emulator's fake Google sign-in lets the tester tick "email verified" or not, so "a new Google account arrives verified" would only test the tester. QE placed F14 in the manual staging Google session; QA may want to tag it **Env: staging only**.
2. **G15 holds two behaviours:** the name-length rule (Unit, once G-1 is answered) and "the greeting doesn't break at 375 px" (UI). Split it when G-1 is answered; QE has it at Unit for now.
3. **Q11 mixes a rules refusal with a re-route.** QE took it at UI (a disposable account and household prove both). The rule on its own, a stale token refused after a `members` doc is removed, belongs at API; check that TC-04, which owns membership removal, has that case.
4. **C7–C9 each add "typing kept" to a validation rule.** QE proves the rule and "no request" at Unit, and relies on G7 (UI) for "fields kept after a client-side error". If QA sees a reason sign-in's form would behave differently from create-account's, add a UI case.
5. **Emulator parity is assumed in four API / UI cases:** C10 (email case), D11 (disabled account's code), D12 (disabled account on a forced refresh), E7 (refresh tokens revoked by a reset). If the emulator doesn't match production on any of them, QE reports it and the case moves to staging. Consider marking them *Assumption*, as D4 and L1 are.
6. **K3 relies on Playwright's Chromium keeping the back-forward cache.** The spec will assert that the page really came from bfcache (`pageshow` with `persisted`), so it can't pass vacuously. If Playwright can't keep it, K3 becomes Manual on a real phone.
7. **R6 is Manual, not automated:** App Check's reCAPTCHA marks an automated browser as a bot, and a debug token would bypass what R6 is meant to prove.

### For Sol Arch

- **The UI share (59%).** Candidates to move down if templates can be unit-tested without a browser (for example, `lit-html` rendered to a string): N1, N3, N10, N11, N19, I2, I4. That would bring UI to about 55%. Sign-in will stay UI-heavy; later requirements (dues, ledger, passes) should bring the overall shape back toward 70 / 20 / 10.
- **Test folders.** SA-001 r3 (components table, "Tests" row) names `tests/rules/` and `tests/e2e/`; the repo's suite already uses `tests/specs/ui/`. QE planned `tests/specs/api/`, `tests/specs/staging/` and `tests/specs/ui/`. Settle one layout in SA-001.
- **The staging host** for the staging environment guard's allow-list (ADR-005).
- **The API runner:** Playwright's test runner (one runner for the suite) or Vitest with `@firebase/rules-unit-testing` (SA-001 §8). QE has no preference beyond one coverage map.
