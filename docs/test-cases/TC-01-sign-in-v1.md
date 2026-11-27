# TC-01: Sign in to the portal (v1.1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new sign-in, account creation, password reset, sign-out and the "not linked" screen. Replaces the mock-up's open role switch and "Viewing as" picker |
| Source | [REQ-001 Sign in to the portal](../requirements/REQ-001-sign-in.md), **Approved** by the owner 2026-11-28 (r3), Option A: email and password, or Google |
| Feature area | `AU` sign-in & roles |
| Related requirements | [REQ-002](../requirements/REQ-002-roles-and-permissions.md) roles (staff landing, no-access page, stale staff role) · [REQ-003](../requirements/REQ-003-household-directory.md) directory (reads `users` name and email) · [REQ-004](../requirements/REQ-004-invite-and-link.md) invites (where "Create account" lands; invite code kept through sign-in; membership removal) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open): no viewport meta, so phones never get the phone layout. Sign-in is the first page every homeowner sees on a phone, so block O re-checks it |
| App version | **Anticipated.** Planned ahead of the build. Today `main` holds only the browser mock-ups (`index.html`, `gentri-heights/index.html`), which have no sign-in |
| Mockup | Screens 1A, 1D, 1E, 1F, 1G (and 2C "no access", 4B "Enter your invite code") of [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html). 1B and 1C are the rejected options and are not tested |
| Architecture | **Provisional.** [SA-001](../architecture/SA-001-hoa-portal-firebase-architecture.md) **r3** (`e28d9bc`) §3, §4.2, §8.1–§8.4, §9, §10, §11.2 and [ADR-004](../architecture/adr/ADR-004-roles-and-household-linking.md) / ADR-005 are **Draft** on branch `docs/sa-001-architecture`. The rules for `users` come from REQ-001's Sol Arch review (Data). Every case tagged *(provisional: …)* names the section it depends on and is re-checked when SA-001 is approved |
| Source files / functions touched (anticipated, per SA-001 §9) | `web/src/main.js` (boot, auth listener, role router), the sign-in / create-account / reset / not-linked views, the route guard, `firestore.rules` (`users/{uid}`, `members` self-read, deny by default), Firebase Auth project settings (§8.4). No Cloud Function is added by REQ-001 |
| Environment | Firebase **Emulator Suite** (Auth + Firestore) by default. **Emulator gaps** (Sol Arch review, 2026-11-28): the Auth emulator does not copy console settings; it has **email enumeration protection off** unless the seed turns it on (R9), **does not enforce the password policy**, may not reproduce the **Google takeover** of an unverified account, and does not model **token expiry** realistically. Cases that depend on those say **Env: staging only** and run on **`hoa-portal-staging`**. Block R inspects production projects **read-only, in the console, by the owner**. No sign-ins and no test data ever go to production |
| Author / date | QA, 2026-11-28 |
| Revision | **v1**, 2026-11-28: first version, approved by the owner ("Approve, send gaps"), gaps G-1 to G-14 sent to the BA. **v1.1**, 2026-11-28: owner asked for Sol Arch and QA reviews ("have SA and QA review it"). Applied both: emulator limits and staging-only cases; Gmail-only Google takeover; stale token after disabling; `members` self-read; `users` rule matrix; sign-up write failure and email case; App Check and account-linking settings; XSS through the name; every case now names its role and has setup, action, expected and don't-assert; fixtures split so no case changes a shared fixture; mixed cases split; status enumeration per staff role; gaps G-9 and G-10 withdrawn (answered), G-15 to G-21 added |
| Status | **Approved** by the owner, 2026-11-28: v1 ("Approve, send gaps") and v1.1 ("Approve and merge"). QE may start triage. The 16 blocked cases wait for the BA's answers to their gaps |

## Roles and what crosses between them

REQ-001 is about one person proving who they are, but several values it writes are read by another role or another screen.

### Round-trip register

| Field / value | Written where, by whom | Read back where, by whom | Case |
|---|---|---|---|
| `users/{uid}.name` | "Create an account" form, by the person | Dashboard greeting "Welcome back, {first name}" (the person); household detail "People with portal access" (admin office, REQ-004 4E); directory (REQ-003) | F8, A3, Q9, G16, Q10 |
| `users/{uid}.name` for a **Google** account | **Not stated** (gap G-2). No name field on the Google path (1A, 1F) | Same readers as above | F12 (blocked on G-2) |
| `users/{uid}.email` | Account creation, by the app on the person's behalf; must be the **Auth account's** email, never the typed value (rule: `email == request.auth.token.email`) | Household detail (admin office, REQ-004 4E); directory (REQ-003) | F8, F9, J14 |
| Signed-in email shown on 1G | Firebase Auth (the account's email, not `users.email`) | Not-linked screen "Signed in as {email}" (the person) | I4 |
| `users/{uid}.phone` (optional) | **Not stated where** (gap G-3). REQ-001 Data says "at account creation", but 1F has no phone field | Admin office (REQ-003 / REQ-004) | **Row blocks sign-off until G-3 is answered** |
| `users/{uid}.createdAt` | The app at account creation; must equal server time *(provisional: Sol Arch to add to SA-001 §4.2)* | **Deliberately not shown** in R1 (no screen in REQ-001 to REQ-004 shows it) | J15 |
| Email verified (Firebase Auth) | Firebase, when the person opens the verification link | The person: "Check your email to verify your address" banner. Admin office: **not shown** (BA to confirm in G-6) | F4, F5, F6 |
| Pending invite code (`sessionStorage`, from a `…/join#code` link) | The app, when a signed-out person opens an invite link (REQ-004) | REQ-004 4C "You're joining {lot}" after sign-in or account creation; cleared after redeeming | Q7, Q8 |
| Sign-in provider (password / Google) | Firebase, at sign-in or on Google takeover | The person only, indirectly (old password stops working). Deliberately not shown to anyone | H1–H6 |
| Signed-in state | Firebase Auth (persisted on the device, synced across tabs) | Every screen's route guard | K, L, M |

No household or membership data is written by REQ-001 (REQ-001 Data: "No household data is created by signing in"). F7 asserts that.

### Status enumeration: where a signed-in person lands

The route guard is a status-gated rule: what the person sees depends on the state of their account. One row per state the account can hold, cross-checked against the copy.

| Account state | Lands on | Copy that promises it | Case |
|---|---|---|---|
| Signed out | Sign-in page (1A) | "Sign in to {HOA name}" | M1, M2 |
| No household, no role, **right after creating the account** | "Enter your invite code" (REQ-004 4B) | Gherkin "Creating an account" | F2 |
| No household, no role, **any later visit** (reload, next sign-in) | Not-linked screen (1G), which also takes the code. QA expects 1G; the route guard can't tell this apart from the row above after a reload (gap G-18) | "Your account isn't linked to a household yet. Enter the invite code from the admin office." | I1, I3 |
| Linked to one household | That household's dashboard | "Welcome back, {first name}" · header lot label | A1, A2, B1 |
| Staff: treasurer only | Staff dashboard (REQ-002) | REQ-002 | Q4 |
| Staff: admin office only | Staff dashboard (REQ-002) | REQ-002 | Q4 |
| Staff: board only | Staff dashboard, read-only (REQ-002) | REQ-002 | Q4 |
| Staff: guard only | **Not stated for R1**: REQ-002 releases no guard screens in R1 (gap G-19) | — | Q6 (blocked on G-19) |
| Staff role **and** a household | Staff view, with the REQ-002 view switch | REQ-002 2B | Q5 |
| Email **not verified** (any row above) | Same landing as its row, plus the unverified banner | "Check your email to verify your address. · Send again" | F4 |
| Household membership **removed** while signed in (REQ-004) | Not-linked screen on the next read | REQ-004 | Q11 |
| Staff role **removed** while signed in (REQ-002 decision 1: "at once") | Refused on the next request, re-routed | REQ-002 | Owned by TC-02 (cross-reference, Q12) |
| Account **disabled** in Firebase, signed out | Refused at sign-in | No copy of record (gap G-5) | D11 |
| Account **disabled** while signed in | Keeps working until the ID token refreshes (up to an hour); then signed out | No copy of record (gap G-5) | D12 |
| Signed in, deep link to another household's page | "You don't have access to this page" (2C) | Copy of record "No access" | J1, J2 |

Email-verified has two values. Google accounts normally arrive verified; F14 asserts `emailVerified` rather than assuming it.

## Test plan

### 1. Smoke

**Smoke changes.** REQ-001 adds a gate in front of every screen, so the standing smoke pass (SMK-owner-\*, SMK-admin-\*, SMK-guard-\*, which today open the mock-up with no sign-in) cannot reach any screen without a signed-in fixture once the real app exists. QE needs:

- **New smoke item: the sign-in page loads** signed out, with its heading (HOA name filled in), the Google button and the email form, no page error (M1, M2).
- **New smoke item: the not-linked screen loads** for the not-linked fixture (I1).
- **Every existing role smoke item now starts from a signed-in fixture** (homeowner, treasurer, admin office, board, guard) instead of the role switch. The role switch (NAV-02) and "Viewing as" are removed by REQ-001/REQ-002; their rows retire or move (see Regression).

### 2. Acceptance

Every Gherkin scenario in REQ-001 has at least one case.

| # | Gherkin scenario | Cases |
|---|---|---|
| S1 | A linked homeowner signs in with Google | A1, A2 |
| S2 | A linked homeowner signs in with email and password | B1 |
| S3 | A wrong password does not reveal whether the email exists | C1–C6 |
| S4 | Resetting a forgotten password | E1–E4 |
| S5 | Firebase refuses a sign-in because of too many attempts | D1, D2 |
| S6 | Creating an account | F1, F2, F3, F7 |
| S7 | Creating an account with an email that already has one | G1, G2, G3 |
| S8 | A password that is too short | G6, G7, G8, G9 |
| S9 | Google sign-in on an unverified account with the same address | H1, H2, H3 |
| S10 | Signed in but not linked to any household | I1, I2, J4–J9 |
| S11 | A homeowner cannot open another household's page | J1, J2 |
| S12 | Signing out on a shared phone | K1, K2, K3, K6 |
| S13 | Staying signed in on her own phone | L1 |
| Background | Email enumeration protection on; password policy Require, min 8 | R1, R2, R9 (and C5, G9 prove them at the server) |
| UX/UI notes | Accessibility, forms, consistency, mobile-first, states, safe actions | N1–N19, O1–O5, D4–D10, P1–P6 |
| Copy of record | Every line | N19 (static strings), plus the case for each message |

### 3. Regression

What else could break, and why:

- **The whole existing UI suite assumes no sign-in.** `tests/specs/ui/` (smoke, navigation, vehicle-registration) opens `index.html` and uses the role switch. Once the real app has a sign-in gate, every spec needs a signed-in start. NAV-01 ("Opens as Homeowner on the dashboard"), NAV-02 (role switch), NAV-04 ("Role and screen survive a reload") change meaning: role now comes from the account, and a reload must keep the **session** (L2), not a `localStorage` role. QE to re-baseline these rather than let them fail for the wrong reason. **Top regression risk.**
- **Tests that pass on the emulator for the wrong reason.** The Auth emulator does not apply enumeration protection unless seeded, and never applies the password policy. A suite that runs only on the emulator would "prove" C5, E3, E4, G9 against settings production has and the emulator lacks, or fail them for reasons unrelated to the app. R9 makes the seed explicit; staging-only cases cover the rest.
- **DEF-001 (open).** Neither mock-up has the viewport meta tag. If the real app's shell is lifted from `index.html` without it, the sign-in page renders as a shrunk desktop on every phone. Re-run NAV-07 and NAV-08 under the `mobile` project, and O1 here.
- **Important-announcement pop-up (NAV-05).** The mock-up's Announcements screen promises a pop-up "when they sign in". After REQ-001 it must appear only after sign-in, on the dashboard, and never on the sign-in page or the not-linked screen (Q1–Q3).
- **`users/{uid}` is shared with REQ-003 and REQ-004.** The admin directory and household detail read name and email written here. A rules change that lets a person write a role field, or read another person's `users` doc, breaks REQ-002's isolation (J12–J23). A name with markup written here renders in the admin office's screens (Q10).
- **The route guard is shared by every screen of every role.** A guard bug leaks data on every page (J1, J2, I5, K3, M1, M11). It depends on an own-uid `members` query that rules must allow (J4).
- **Invite code kept through sign-in (REQ-004).** Sign-in changes can drop the `sessionStorage` code (Q7, Q8).
- **Mock-up `localStorage` state.** The mock-up persists `{S, UI}` including `UI.role`. SA-001 §11.2 says mock-up browser data is never migrated (S1).
- **Failure patterns** (from `qa.md`), each applied or ruled out:
  - Copy promises what the code doesn't do: E2, F1, F5 prove the email exists, not just the message.
  - A value written for one role, never shown back: round-trip register; G-2, G-3 block two rows.
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

- **Happy path:** Google sign-in lands on the linked dashboard (A1) with the lot in the header (A2); password sign-in (B1); account creation sends a verification email (F1) and lands on invite-code entry (F2); reset email created (E2); new password signs in (E5); sign-out lands on sign-in (K1); session kept the next day (L1).
- **Negative:** wrong password (C1); unknown email (C3); server refuses both alike (C5); empty email / password (C7, C8); malformed email (C9); Google-only account using the email form (C12); too many attempts (D1); offline (D4, D5, D7, D8); Google popup closed or blocked (D9, D10); disabled account (D11, D12); duplicate email at sign-up (G1); short password (G6) and at the server (G9); empty name (G12); reset for unknown email (E3, E4); different-credential Google sign-in (H6); every rules refusal in block J.
- **Boundary:** 7 / 8 characters (G6, G10); long passphrase (G11); email capitals (C10, F9, G13) and trailing space (C11, G14); one-character and very long name (G15); Google profile with no name (F12); first word of a multi-word name (A3); session across a local day boundary (L1).
- **Usability:** N1–N19.
- **Navigation:** M1–M11, K2, K3, I2, I3, J3, D3, E9, G4, G5.
- **Role / security:** J1–J23; K4–K7; C5, C6, C13, E3, E4; H2, H3; G16; R1–R9.
- **Integration:** F2, Q1–Q12.
- **Concurrency:** P1–P6; K8.
- **Back-compat:** S1, S2.
- **Responsive:** O1–O5.
- **UI/UX:** states (N12 loading, C1 error, A1 success, D4 offline, F4 unverified); N15, N16, N19.
- **Data integrity:** F7, F8, F9, F11, H4, P2.
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
| **U-GM-V** | Email + password, **verified**, team-owned `@gmail.com`. Staging only. Disposable | — | H5 |
| **U-DOM-UV** | Email + password, unverified, on the team's own (non-Gmail) domain, which also has a Google account. Staging only. Disposable | — | H6 |
| **U-TR** "Carmela ZZTest" | Verified, staff role `treasurer` | — | Q4 |
| **U-TRH** "Paolo ZZTest" | Verified, `treasurer`, and linked to ZZ Test Household D | Household D | Q5 |
| **U-AD** "Rina ZZTest" | Verified, staff role `admin` (admin office) | — | Q4, Q9, Q10 |
| **U-BD** "Teresa ZZTest" | Verified, staff role `board` | — | Q4, J23 |
| **U-GD** "Gardo ZZTest" | Verified, staff role `guard` | — | Q6, J23 |
| **U-NONE** | No account. `zz-nobody@<test domain>` | — | C3, C4, E3, E4 |
| **U-NEW** | Created by the case. `zz-new-<run id>@<test domain>` | — | F, G, P |

`<test domain>` is a domain the team controls. The Gmail fixtures are the one exception: they are `@gmail.com` accounts the team owns, because Firebase trusts Google as a provider only for Gmail addresses. **Staging note:** Firebase sends verification and reset emails itself, so SA-001 §10's mail allow-list (a check in our mail function) does **not** cover them. On staging, never type an address the team doesn't control. On the emulator, emails are not sent; their links are read from the emulator's out-of-band codes.

**Writes convention:** **Yes** when the case changes Auth or Firestore state, or makes Firebase create an email (out-of-band code). **No** otherwise.

---

## Block A — Sign in with Google (S1)

### TC-01-A1 — A linked homeowner signing in with Google lands on her dashboard, greeted by her first name
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G, signed out.
- **Action:** Open the portal. Press "Continue with Google". Choose U-G's account.
- **Expected:** The dashboard opens with the heading "Welcome back, Maria".
- **Don't assert:** dashboard figures; Google's own popup screens.

### TC-01-A2 — After Google sign-in, the header shows the linked lot
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G, signed out.
- **Action:** As A1.
- **Expected:** The header reads "Blk 1 Lot 3".
- **Don't assert:** any other header content.

### TC-01-A3 — The greeting uses the first word of the stored name
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G ("Maria ZZTest").
- **Action:** Sign in.
- **Expected:** "Welcome back, Maria", not the full name. (REQ-001 shows this for "Maria Santos" without stating the rule; see G-2.)
- **Don't assert:** handling of single-word or empty names (F12, G15).

### TC-01-A4 — Google sign-in uses the popup flow, not a redirect *(provisional: SA-001 §8.4)*
**Priority** P2 · **Type** Security / config · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G. **Env: staging only**, in a browser that blocks third-party storage (current Chrome, Firefox, Safari defaults).
- **Action:** Press "Continue with Google" and choose the account.
- **Expected:** A popup opens and the portal page is signed in afterwards. If the build uses a redirect, it is served from the project's own `authDomain` and still signs in.
- **Don't assert:** popup size or Google's screens.

## Block B — Sign in with email and password (S2)

### TC-01-B1 — A linked homeowner signing in with email and password lands on his dashboard
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-P, signed out.
- **Action:** Type U-P's email and password. Press "Sign in".
- **Expected:** The dashboard for "Blk 4 Lot 12" opens.
- **Don't assert:** dashboard figures.

## Block C — Wrong credentials do not reveal accounts (S3)

### TC-01-C1 — A wrong password shows the shared message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out. U-P exists.
- **Action:** Type U-P's email and a wrong password. Press "Sign in".
- **Expected:** "That email and password don't match. Try again, or reset your password." Not signed in.
- **Don't assert:** the error code behind it.

### TC-01-C2 — After a wrong password the email stays in the field
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As C1.
- **Action:** As C1.
- **Expected:** The email field still holds U-P's email.
- **Don't assert:** the password field (N7).

### TC-01-C3 — An email with no account shows the same message as a wrong password
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out. U-NONE. Enumeration protection on (R9 seed, or staging).
- **Action:** Type U-NONE's address and any password. Press "Sign in".
- **Expected:** Exactly the C1 message, in the same place, with no extra hint.
- **Don't assert:** response timing.

### TC-01-C4 — After an unknown email, the email stays in the field
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As C3.
- **Action:** As C3.
- **Expected:** The email field still holds U-NONE's address.
- **Don't assert:** the password field.

### TC-01-C5 — The server refuses a wrong password and an unknown email identically *(provisional: SA-001 §8.4)*
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** No app role (direct Auth call). Enumeration protection on: **staging**, or the emulator with R9's seed asserted first.
- **Action:** Call sign-in for U-P with a wrong password, and for U-NONE, bypassing the page.
- **Expected:** Both refusals are identical (same error, same shape). Neither says whether the email exists.
- **Don't assert:** the error code's name (it differs between the REST API and SDK versions).

### TC-01-C6 — The page shows the shared message for every credential error code
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out. Auth error mocked, one at a time, as `auth/invalid-credential`, `auth/invalid-login-credentials`, `auth/user-not-found`, `auth/wrong-password`.
- **Action:** Submit the sign-in form for each.
- **Expected:** Each shows the C1 message. (Guards against a page that maps old codes to different copy if enumeration protection is ever off.)
- **Don't assert:** which code the live SDK returns.

### TC-01-C7 — An empty email is refused before any request
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out.
- **Action:** Leave Email empty, type a password, press "Sign in".
- **Expected:** An error under the Email field says what to do; no sign-in request is sent; the password is not cleared.
- **Don't assert:** the wording (not in the copy of record, G-1).

### TC-01-C8 — An empty password is refused before any request
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out.
- **Action:** Type an email, leave Password empty, press "Sign in".
- **Expected:** An error under the Password field; no request; email kept.
- **Don't assert:** the wording (G-1).

### TC-01-C9 — A malformed email is refused with a field error
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out.
- **Action:** Type `zz-owner-juan@` and a password. Press "Sign in".
- **Expected:** An error under Email; no request; typing kept.
- **Don't assert:** the wording (G-1).

### TC-01-C10 — An email typed with capitals still signs in
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-P, signed out.
- **Action:** Type U-P's email with capitals (`ZZ-Owner-Juan@…`) and the right password.
- **Expected:** Signs in as U-P. **Assumption:** Firebase compares emails case-insensitively.
- **Don't assert:** how the email is displayed afterwards.

### TC-01-C11 — An email typed with a trailing space still signs in
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Blocked on G-4** (trimming not stated). QA expects trimming, because phone keyboards add the space.
- **Role / setup:** Homeowner, U-P, signed out.
- **Action:** Type U-P's email followed by a space, and the right password.
- **Expected (once G-4 is answered):** Signs in as U-P.
- **Don't assert:** anything until G-4 is answered.

### TC-01-C12 — A Google-only account using the email form gets the shared message
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G (Google only, no password), signed out.
- **Action:** Type U-G's email and any password. Press "Sign in".
- **Expected:** The C1 message. Whether to also hint "use Continue with Google" is gap G-17.
- **Don't assert:** any hint until G-17 is answered.

### TC-01-C13 — No page decides what to show by asking Firebase which sign-in methods an email has
**Priority** P3 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Code review; no app role.
- **Action:** Search the web app for `fetchSignInMethodsForEmail`.
- **Expected:** Not used to branch any page (with enumeration protection on it returns nothing).
- **Don't assert:** anything about Firebase's internals.

## Block D — Refusals from Firebase and the network (S5 and UX states)

### TC-01-D1 — "Too many attempts" shows its message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out. Firebase's too-many-attempts error **mocked** for U-P's email (it cannot be triggered on demand).
- **Action:** Press "Sign in".
- **Expected:** "Too many attempts. Wait a while, or reset your password."
- **Don't assert:** how many tries trigger it or how long it lasts.

### TC-01-D2 — After "Too many attempts" the email stays in the field
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As D1.
- **Action:** As D1.
- **Expected:** U-P's email is still in the field.
- **Don't assert:** the password field.

### TC-01-D3 — "Forgot password?" opens the reset page from the error state
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As D1, after the message shows.
- **Action:** Press "Forgot password?".
- **Expected:** The reset page opens.
- **Don't assert:** whether the email is carried over (G-7).

### TC-01-D4 — Signing in while offline shows the offline message
**Priority** P2 · **Type** Negative / UI-UX · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-P, signed out; browser offline.
- **Action:** Press "Sign in".
- **Expected:** "You're offline. Connect to the internet to sign in." **Assumption:** the SDK reports a network error rather than hanging.
- **Don't assert:** retry behaviour.

### TC-01-D5 — "Continue with Google" while offline shows the offline message
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G, signed out; browser offline.
- **Action:** Press "Continue with Google".
- **Expected:** The D4 message; no popup stuck open.
- **Don't assert:** whether a popup briefly opens.

### TC-01-D6 — After the offline message, the button is ready again and typing is kept
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As D4.
- **Action:** As D4, then reconnect.
- **Expected:** "Sign in" is enabled; email and password are still typed; pressing it signs in.
- **Don't assert:** automatic retry.

### TC-01-D7 — Creating an account while offline shows an offline message
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Blocked on G-15** (the offline copy says "…to sign in", which doesn't fit this page).
- **Role / setup:** New homeowner, U-NEW details; offline.
- **Action:** Press "Create account".
- **Expected:** An offline message; no account; typing kept. Copy once G-15 is answered.
- **Don't assert:** wording.

### TC-01-D8 — Asking for a reset link while offline shows an offline message
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Blocked on G-15.**
- **Role / setup:** Anyone, signed out, on the reset page; offline.
- **Action:** Press "Send reset link".
- **Expected:** An offline message, not the "If there's an account…" message.
- **Don't assert:** wording.

### TC-01-D9 — Closing the Google popup returns to a usable sign-in page
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G, signed out.
- **Action:** Press "Continue with Google"; close the popup without choosing.
- **Expected:** The Google button is enabled; no stuck in-flight state; not signed in.
- **Don't assert:** a message (G-8).

### TC-01-D10 — A blocked Google popup tells the person how to continue
**Priority** P2 · **Type** Negative / usability · **Layer** TBD — QE · **Writes** No
- **Blocked on G-8** (no copy).
- **Role / setup:** Homeowner, U-G, signed out; popups blocked for the site.
- **Action:** Press "Continue with Google".
- **Expected:** A message says how to continue (allow popups, or use email).
- **Don't assert:** wording.

### TC-01-D11 — A disabled account is refused at sign-in and sees no household data
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. A **disposable copy** of U-P, linked to Household B, disabled in Auth.
- **Action:** Sign in with its email and password.
- **Expected:** Not signed in; no household data. Copy is gap G-5.
- **Don't assert:** the error code (it may be `user-disabled` or the generic credential error when enumeration protection is on: Uncertain).

### TC-01-D12 — A homeowner disabled while signed in is signed out once the token refreshes
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. A disposable copy of U-P, signed in on the dashboard; then disabled in Auth.
- **Action:** Force a token refresh (`getIdToken(true)`), then open another screen.
- **Expected:** Signed out; sign-in page; no household data after the refresh. Landing copy is gap G-5.
- **Don't assert:** that a plain reload signs the person out — the ID token they hold stays valid for up to an hour (Sol Arch review). **Owner note:** disabling an account is not an instant cut-off; removing the `members` doc is (Q11).

## Block E — Resetting a forgotten password (S4)

### TC-01-E1 — Asking for a reset for an existing email shows the reset message
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner, U-P, signed out.
- **Action:** Press "Forgot password?", type U-P's email, press "Send reset link".
- **Expected:** "If there's an account for {U-P's email}, we've sent a link to reset the password. Check your spam folder too."
- **Don't assert:** whether the email arrived (E2).

### TC-01-E2 — Asking for a reset for an existing email creates exactly one reset link
**Priority** P1 · **Type** Happy path (copy promises an outcome) · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As E1, emulator.
- **Action:** As E1.
- **Expected:** The emulator holds exactly one password-reset code for U-P.
- **Don't assert:** the email's wording.

### TC-01-E3 — Asking for a reset for an unknown email shows the same message
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out. U-NONE. Enumeration protection on (R9 seed, or staging).
- **Action:** As E1 with U-NONE's address.
- **Expected:** The E1 message with that address in it; no error.
- **Don't assert:** response timing.

### TC-01-E4 — Asking for a reset for an unknown email sends nothing
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As E3.
- **Action:** As E3.
- **Expected:** No reset code exists for that address.
- **Don't assert:** server logs.

### TC-01-E5 — Following the reset link sets a new password that signs in
**Priority** P1 · **Type** Happy path / integration · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. A disposable copy of U-P, linked to Household B; reset link from E2.
- **Action:** Open the link, set a new 8+ character password, sign in to the portal with it.
- **Expected:** Household B's dashboard.
- **Don't assert:** the wording of Firebase's reset page (not ours); link expiry.

### TC-01-E6 — After a reset the old password no longer signs in
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** After E5, signed out.
- **Action:** Sign in with the old password.
- **Expected:** The C1 message.
- **Don't assert:** the error code.

### TC-01-E7 — A password reset ends the account's other signed-in sessions
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. A disposable copy of U-P signed in on a second browser; then E5 runs in the first.
- **Action:** In the second browser, force a token refresh, then open a screen.
- **Expected:** The second browser is signed out (a reset revokes refresh tokens).
- **Don't assert:** when it happens without a forced refresh.

### TC-01-E8 — The reset page refuses a new password under 8 characters *(provisional: SA-001 §8.4)*
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, disposable copy of U-P. **Env: staging only** (the emulator does not enforce the password policy).
- **Action:** Open a reset link; set a 7-character password.
- **Expected:** Refused.
- **Don't assert:** Firebase's wording.

### TC-01-E9 — "Back to sign in" on the reset page returns to the sign-in page
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Anyone, signed out, on the reset page.
- **Action:** Press "Back to sign in".
- **Expected:** The sign-in page.
- **Don't assert:** carried-over values (G-7).

### TC-01-E10 — A Google-only account asking for a password reset
**Priority** P2 · **Type** Negative / security · **Layer** TBD — QE · **Writes** Yes
- **Blocked on G-17.** Following the link may quietly add a password to a Google-only account.
- **Role / setup:** Homeowner, a disposable copy of U-G (Google only).
- **Action:** Ask for a reset for its email; open the link; set a password.
- **Expected (once G-17 is answered):** what the BA decides. Until then QE reports what happens to Sol Arch and the BA.
- **Don't assert:** anything until G-17 is answered.

## Block F — Creating an account (S6)

### TC-01-F1 — Creating an account sends a verification email
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW, emulator.
- **Action:** Press "New here? Create an account". Type a name, U-NEW's email and an 8+ character password. Press "Create account".
- **Expected:** The emulator holds exactly one verification code for U-NEW's address.
- **Don't assert:** the email's wording.

### TC-01-F2 — A new account lands on "Enter your invite code"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F1.
- **Action:** As F1.
- **Expected:** "Enter your invite code" (REQ-004 4B) opens.
- **Don't assert:** the not-linked screen's wording (G-18).

### TC-01-F3 — A new account sees no household data on its landing screen
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F1.
- **Action:** As F1, then look at the whole screen.
- **Expected:** No lot label, balance, announcement, bell or menu other than invite-code entry and "Sign out".
- **Don't assert:** the banner (F4).

### TC-01-F4 — An unverified account sees the verification banner with "Send again"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW right after F1 (unverified).
- **Action:** Look at the landing screen.
- **Expected:** "Check your email to verify your address." with a "Send again" control.
- **Don't assert:** where the banner sits (G-6).

### TC-01-F5 — "Send again" creates a new verification email
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F4, emulator.
- **Action:** Press "Send again" once.
- **Expected:** One more verification code exists for that address.
- **Don't assert:** the confirmation wording or Firebase's rate-limit response (G-6).

### TC-01-F6 — The banner is gone once the email is verified
**Priority** P2 · **Type** Happy path (derived state refreshes) · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** U-NEW after F1.
- **Action:** Open the verification link; return to the portal and reload.
- **Expected:** No banner.
- **Don't assert:** whether it disappears without a reload (token refresh timing).

### TC-01-F7 — Creating an account creates no membership for the new account *(provisional: SA-001 §3, members only via `redeemInvite`)*
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F1.
- **Action:** After F1, query `members` where `uid` = U-NEW's uid, and read `staff/{U-NEW uid}`.
- **Expected:** No `members` document and no `staff` document for that uid.
- **Don't assert:** counts across the whole database.

### TC-01-F8 — The new person record holds the typed name and the account email, and only allowed fields *(provisional: REQ-001 Sol Arch review, Data + SA-001 §4.2)*
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F1.
- **Action:** Read `users/{uid}`.
- **Expected:** `name` = the typed name; `email` = the Auth account's email; `createdAt` set; optional `phone`. No role, status or household field.
- **Don't assert:** the `createdAt` value.

### TC-01-F9 — Signing up with capitals in the email stores the account's email, and the write succeeds
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW typed as `ZZ-New-<run id>@<test domain>`.
- **Action:** Create the account.
- **Expected:** `users/{uid}` exists and its `email` equals the Auth token's email (the rule would refuse the typed value if it differed).
- **Don't assert:** the letter case Firebase stores (Uncertain).

### TC-01-F10 — Signing up with a trailing space in the email stores the account's email
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Blocked on G-4.**
- **Role / setup:** New homeowner, U-NEW typed with a trailing space.
- **Action:** Create the account.
- **Expected (once G-4 is answered):** as F9.
- **Don't assert:** anything until G-4 is answered.

### TC-01-F11 — If the person record can't be written after the account is created, the next sign-in repairs it
**Priority** P2 · **Type** Data integrity / negative · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW. Make the `users` write fail after the Auth account is created (go offline between the two calls, or close the tab).
- **Action:** Sign in again later, online.
- **Expected:** After that sign-in, `users/{uid}` exists with the account's email. What the person sees at the failure is gap G-21.
- **Don't assert:** the message at the moment of failure.

### TC-01-F12 — A Google account with no display name gets a sensible greeting
**Priority** P2 · **Type** Boundary (zero vs not set) · **Layer** TBD — QE · **Writes** Yes
- **Partly blocked on G-2** (where the name comes from).
- **Role / setup:** Homeowner. Emulator fake Google user with no display name, linked to a test household.
- **Action:** Sign in with Google.
- **Expected:** The greeting never reads "Welcome back, ", "Welcome back, undefined" or "Welcome back, null".
- **Don't assert:** the exact greeting until G-2 is answered.

### TC-01-F13 — "Continue with Google" on the create-account page lands a new person on invite-code entry
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner. A new emulator Google user with no account.
- **Action:** On "Create an account", press "Continue with Google".
- **Expected:** "Enter your invite code"; no household data.
- **Don't assert:** the banner (F14).

### TC-01-F14 — A new Google account arrives verified and shows no verification banner
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F13.
- **Action:** As F13; read the Auth user.
- **Expected:** `emailVerified` is true; no banner.
- **Don't assert:** this for non-Gmail Google accounts (normally verified, not guaranteed).

## Block G — Account-creation validation (S7, S8)

### TC-01-G1 — Signing up with an email that already has an account shows the message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** New homeowner. U-P exists.
- **Action:** On "Create an account", type a name, U-P's email and a valid password. Press "Create account".
- **Expected:** "There's already an account for this email. Sign in, or reset your password." (This reveals the email exists — accepted limitation, REQ-001 Story.)
- **Don't assert:** the error code.

### TC-01-G2 — After the duplicate-email message, name and email are kept
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As G1.
- **Action:** As G1.
- **Expected:** The name and email fields still hold what was typed.
- **Don't assert:** the password field.

### TC-01-G3 — The duplicate sign-up creates no second account
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As G1.
- **Action:** As G1, then list Auth users with U-P's email.
- **Expected:** One account, unchanged.
- **Don't assert:** anything about U-P's `users` doc beyond "unchanged".

### TC-01-G4 — "Sign in" from the duplicate-email message opens the sign-in page
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As G1, after the message shows.
- **Action:** Follow "Sign in".
- **Expected:** The sign-in page.
- **Don't assert:** whether the email is carried over (G-7).

### TC-01-G5 — "Reset your password" from the duplicate-email message opens the reset page
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As G1, after the message shows.
- **Action:** Follow the reset route.
- **Expected:** The reset page.
- **Don't assert:** whether the email is carried over (G-7).

### TC-01-G6 — A 7-character password shows "Use at least 8 characters"
**Priority** P1 · **Type** Boundary / negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** New homeowner, U-NEW details.
- **Action:** On "Create an account", type a name, U-NEW's email and a 7-character password. Press "Create account".
- **Expected:** "Use at least 8 characters" under the password field.
- **Don't assert:** whether a request was sent (G8).

### TC-01-G7 — After a short password, name and email are kept
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As G6.
- **Action:** As G6.
- **Expected:** Name and email still typed.
- **Don't assert:** the password field.

### TC-01-G8 — A short password in the page creates no account
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As G6.
- **Action:** As G6, then look up U-NEW's email in Auth.
- **Expected:** No account.
- **Don't assert:** whether the page or the server stopped it.

### TC-01-G9 — Firebase refuses a 7-character password when the page check is skipped *(provisional: SA-001 §8.4)*
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** No app role (direct Auth call). **Env: staging only** (the emulator does not enforce the policy; a 7-character sign-up succeeds there).
- **Action:** Call account creation directly with a 7-character password.
- **Expected:** Refused; no account exists afterwards.
- **Don't assert:** the error code.

### TC-01-G10 — An 8-character password is accepted
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW.
- **Action:** As G6 with exactly 8 characters.
- **Expected:** Account created; lands on invite-code entry.
- **Don't assert:** the banner.

### TC-01-G11 — A long passphrase with spaces and non-ASCII characters signs up and signs in
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW.
- **Action:** Sign up with a 64-character passphrase containing spaces and "ñ"; sign out; sign in with it.
- **Expected:** Both succeed.
- **Don't assert:** the maximum length (4096 per Firebase's password policy).

### TC-01-G12 — Creating an account with no name is refused with a field error
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Blocked on G-1** (whether name is required, and its copy). QA expects it to be required: the admin office reads it.
- **Role / setup:** New homeowner, U-NEW details.
- **Action:** Leave "Your name" empty; fill the rest; press "Create account".
- **Expected (once G-1 is answered):** An error under the name field; no account.
- **Don't assert:** wording.

### TC-01-G13 — Signing up with an existing email in capitals shows the duplicate message
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Role / setup:** New homeowner. U-P exists.
- **Action:** Sign up with U-P's email in capitals.
- **Expected:** The G1 message; no second account.
- **Don't assert:** the error code.

### TC-01-G14 — Signing up with an existing email plus a trailing space shows the duplicate message
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Blocked on G-4.**
- **Role / setup:** As G13.
- **Action:** Sign up with U-P's email followed by a space.
- **Expected (once G-4 is answered):** The G1 message; no second account.
- **Don't assert:** anything until G-4 is answered.

### TC-01-G15 — A one-character name and a very long name are handled
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Blocked on G-1** (name limits).
- **Role / setup:** New homeowner, two U-NEW accounts.
- **Action:** Sign up with a one-character name; separately with a 200-character name.
- **Expected (once G-1 is answered):** Accepted names show without breaking the greeting at 375 px; refused names get a field error.
- **Don't assert:** anything until G-1 is answered.

### TC-01-G16 — A name containing markup shows as plain text in the greeting
**Priority** P1 · **Type** Security (stored XSS) · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW named `<img src=x onerror=alert(1)>`, then linked to a test household.
- **Action:** Sign in and open the dashboard.
- **Expected:** The greeting shows the characters as text; no script runs; no image element is created.
- **Don't assert:** how the text is truncated.

## Block H — Google sign-in and existing password accounts (S9)

All of block H is **Env: staging only**. Firebase trusts Google as a provider only for `@gmail.com` addresses, and the emulator may not reproduce the takeover. Each case uses a fresh disposable fixture.

### TC-01-H1 — Google sign-in on an unverified Gmail password account signs in with Google
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. Fresh U-GM-UV (unverified password account, team-owned Gmail, linked to Household C).
- **Action:** Press "Continue with Google" and choose that Gmail account.
- **Expected:** Signed in.
- **Don't assert:** Google's screens.

### TC-01-H2 — After the Google takeover, the old password no longer signs in
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. Fresh U-GM-UV; run H1's action as setup; sign out.
- **Action:** Sign in with U-GM-UV's old password.
- **Expected:** The C1 message.
- **Don't assert:** the error code.

### TC-01-H3 — After the Google takeover, the account keeps its household
**Priority** P1 · **Type** Security / integration · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. Fresh U-GM-UV linked to Household C.
- **Action:** Run H1's action.
- **Expected:** Lands on Household C's dashboard.
- **Don't assert:** how Firebase links the account internally (H4).

### TC-01-H4 — After the Google takeover, the uid is the same
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Fresh U-GM-UV; note its uid.
- **Action:** Run H1's action; read the uid.
- **Expected:** The same uid. **Uncertain:** Firebase's docs don't say so; H3 is the check that matters. A different uid is reported to Sol Arch.
- **Don't assert:** provider data beyond Google being present.

### TC-01-H5 — A verified Gmail password account signing in with Google stays one account
**Priority** P2 · **Type** Security / data integrity · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. Fresh U-GM-V (verified password account, team-owned Gmail).
- **Action:** Press "Continue with Google"; sign out; sign in with the password.
- **Expected:** One account for the address (no duplicate). **Uncertain:** whether the password still works afterwards; QE reports what happens to Sol Arch.
- **Don't assert:** the password result.

### TC-01-H6 — Google sign-in on a non-Gmail address that has a password account doesn't sign into it silently
**Priority** P2 · **Type** Security / negative · **Layer** TBD — QE · **Writes** Yes
- **Blocked on G-16** for the message.
- **Role / setup:** Homeowner. Fresh U-DOM-UV (password account on the team's own domain, which also has a Google account).
- **Action:** Press "Continue with Google" and choose that address.
- **Expected:** Not signed in to the password account; no second account created for the address (setting R5). Firebase likely returns `account-exists-with-different-credential` (Uncertain). The message is G-16.
- **Don't assert:** the error code or the message.

## Block I — Signed in, not linked (S10)

### TC-01-I1 — A signed-in person with no household and no role sees the not-linked message
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Not-linked account, U-N, signed out.
- **Action:** Sign in as U-N.
- **Expected:** "Your account isn't linked to a household yet. Enter the invite code from the admin office."
- **Don't assert:** the banner (U-N is verified).

### TC-01-I2 — The not-linked person sees only invite-code entry and "Sign out"
**Priority** P1 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As I1, at 375 px and at desktop width.
- **Action:** Look for menus, the ☰ button, the notification bell, any role switch.
- **Expected:** None of them; only the invite-code entry and "Sign out".
- **Don't assert:** layout details.

### TC-01-I3 — The not-linked screen stays after a reload
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As I1.
- **Action:** Reload.
- **Expected:** The same screen; no dashboard or menu flashes first.
- **Don't assert:** load time.

### TC-01-I4 — The not-linked screen shows which account is signed in
**Priority** P3 · **Type** Usability / round-trip · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As I1.
- **Action:** Read the screen.
- **Expected:** U-N's account email is shown (1G: "Signed in as {email}").
- **Don't assert:** exact wording (not in the copy of record, G-1).

### TC-01-I5 — A not-linked person opening a household page address sees no household data
**Priority** P2 · **Type** Security (UI) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As I1; the address of a Household B page.
- **Action:** Open that address directly.
- **Expected:** The not-linked screen or the no-access page; no Household B data at any moment.
- **Don't assert:** which of the two pages (not stated).

## Block J — Access control and rules (S10, S11)

### TC-01-J1 — A homeowner opening another household's page sees "You don't have access to this page"
**Priority** P1 · **Type** Security (UI) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G (Household A only); the address of a Household B page.
- **Action:** Open that address directly.
- **Expected:** "You don't have access to this page"; no Household B lot, name, balance or row at any moment.
- **Don't assert:** network traffic (J2).

### TC-01-J2 — While on another household's page, no Household B document is read *(provisional: SA-001 §8.1 `isMember`)*
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As J1, with U-G's token.
- **Action:** Read Household B's documents and sub-records directly.
- **Expected:** Every read is refused with a permission error.
- **Don't assert:** the page's wording.

### TC-01-J3 — "Go to my dashboard" on the no-access page returns to her own household
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As J1.
- **Action:** Press "Go to my dashboard".
- **Expected:** Household A's dashboard.
- **Don't assert:** dashboard figures.

### TC-01-J4 — A not-linked account may query its own memberships and gets none *(provisional: Sol Arch to add the self-read to SA-001 §8.1)*
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-N's token.
- **Action:** Query `members` where `uid == ` U-N's uid.
- **Expected:** **Allowed**, returning no documents. (The route guard needs this; a permission error must not be what tells the app "not linked".)
- **Don't assert:** query performance.

### TC-01-J5 — A not-linked account may read its own staff record and finds none *(provisional: ADR-004)*
**Priority** P2 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-N's token.
- **Action:** Read `staff/{U-N uid}`.
- **Expected:** Allowed; the document does not exist.
- **Don't assert:** anything about other `staff` docs (J8).

### TC-01-J6 — A not-linked account cannot read other people's membership documents *(provisional: SA-001 §8.1)*
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-N's token; Household A's membership for U-G.
- **Action:** Read that `members` doc; query `members` for Household A.
- **Expected:** Both refused.
- **Don't assert:** error text.

### TC-01-J7 — A not-linked account cannot read any household or its records *(provisional: SA-001 §8.1)*
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-N's token; Households A and B with sub-records.
- **Action:** Read a `households` doc and a household sub-record.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J8 — A not-linked account cannot read other people's staff records *(provisional: ADR-004)*
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-N's token; `staff/{U-TR uid}`.
- **Action:** Read it; list `staff`.
- **Expected:** Both refused.
- **Don't assert:** error text.

### TC-01-J9 — A not-linked account cannot read announcements *(provisional: SA-001 §8.1, "rules deny everything else")*
**Priority** P2 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-N's token; a published announcement.
- **Action:** Read it.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J10 — Signed-out requests are refused *(provisional: SA-001 §8.1)*
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** No auth token.
- **Action:** Read `users`, `households`, `members`, `staff`, `config/settings`.
- **Expected:** All refused.
- **Don't assert:** `config/branding` (it may be public; see M2 and the Sol Arch list).

### TC-01-J11 — A person can create their own person record with the allowed fields *(provisional: REQ-001 Sol Arch review, Data)*
**Priority** P1 · **Type** Security (rules, allowed cell) · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** A new account's token.
- **Action:** Create `users/{own uid}` with `name`, `email` (= token email), `phone`, `createdAt` (= server time).
- **Expected:** Allowed.
- **Don't assert:** the stored timestamp's value.

### TC-01-J12 — Creating one's own person record with an extra field is refused
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** A new account's token.
- **Action:** Create `users/{own uid}` with the allowed fields plus `role` (and, separately, `householdId`).
- **Expected:** Refused; no document exists afterwards.
- **Don't assert:** error text.

### TC-01-J13 — Adding a role field to one's own existing person record is refused
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-N's token; `users/{U-N uid}` exists.
- **Action:** Update it, adding `role: "treasurer"` (and, separately, `staffRole`).
- **Expected:** Refused; the stored doc is unchanged (assert the refusal, not "nothing changed").
- **Don't assert:** error text.

### TC-01-J14 — Setting a different email than the account's is refused
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-N's token.
- **Action:** Update `users/{own uid}.email` to U-P's address.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J15 — A `createdAt` that isn't the server time is refused *(provisional: Sol Arch to add to SA-001)*
**Priority** P2 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** A new account's token.
- **Action:** Create `users/{own uid}` with `createdAt` a year ago.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J16 — A person can read their own person record
**Priority** P2 · **Type** Security (rules, allowed cell) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-P's token.
- **Action:** Read `users/{U-P uid}`.
- **Expected:** Allowed.
- **Don't assert:** field values.

### TC-01-J17 — A person can update their own name and phone
**Priority** P2 · **Type** Security (rules, allowed cell) · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** A disposable copy of U-P's token.
- **Action:** Update `name` and `phone` on its own `users` doc.
- **Expected:** Allowed.
- **Don't assert:** which screen offers this (none in REQ-001).

### TC-01-J18 — A person cannot delete their own person record
**Priority** P2 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-P's token.
- **Action:** Delete `users/{U-P uid}`.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J19 — Nobody signed in as a homeowner can list the people collection
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-P's token and U-N's token.
- **Action:** List `users`.
- **Expected:** Refused for both.
- **Don't assert:** admin office reads (TC-03).

### TC-01-J20 — A homeowner cannot read another household's person's record
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-G's token (Household A); U-P's uid (Household B).
- **Action:** Read `users/{U-P uid}`.
- **Expected:** Refused.
- **Don't assert:** error text.

### TC-01-J21 — A homeowner cannot write another person's record
**Priority** P1 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** U-G's token; U-P's uid.
- **Action:** Update `users/{U-P uid}`; separately, create over it.
- **Expected:** Both refused; U-P's doc unchanged.
- **Don't assert:** error text.

### TC-01-J22 — A member of the same household reading your person record
**Priority** P3 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Blocked on Sol Arch:** SA-001 §8.2 ("visible to own household and staff") and REQ-001's review (person and admin office only) disagree.
- **Role / setup:** Two members of Household A.
- **Action:** One reads the other's `users` doc.
- **Expected:** As Sol Arch decides.
- **Don't assert:** anything until decided.

### TC-01-J23 — A guard or board account cannot read any person record *(provisional: SA-001 §8.1)*
**Priority** P2 · **Type** Security (rules) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Guard (U-GD) and Board (U-BD) tokens.
- **Action:** Read `users/{U-P uid}`.
- **Expected:** Refused for both.
- **Don't assert:** admin office or treasurer reads (TC-03).

A removed staff member's stale token is covered by **TC-02** (REQ-002 decision 1, ADR-004 `staff/{uid}` check).

## Block K — Signing out (S12)

### TC-01-K1 — "Sign out" lands on the sign-in page
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G, signed in on the dashboard.
- **Action:** Choose "Sign out" in the account menu.
- **Expected:** The sign-in page.
- **Don't assert:** any toast.

### TC-01-K2 — Pressing Back after signing out shows the sign-in page
**Priority** P1 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G; visited two screens, then signed out (desktop browser).
- **Action:** Press Back several times.
- **Expected:** The sign-in page each time.
- **Don't assert:** the URL shown.

### TC-01-K3 — On a phone browser, Back after signing out never shows household data, even briefly
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As K2 in a mobile browser with the back-forward cache (real phone or emulation that keeps bfcache).
- **Action:** Press Back.
- **Expected:** No household data at any moment; the sign-in page.
- **Needs:** a real or emulated mobile browser.
- **Don't assert:** animation timing.

### TC-01-K4 — After signing out, no household data is left in browser storage
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G signed in, dashboard loaded.
- **Action:** Sign out; inspect `localStorage`, `sessionStorage`, IndexedDB and Cache Storage for the origin.
- **Expected:** No lot label, balance or household name anywhere.
- **Don't assert:** Firebase's own auth keys (removed by sign-out; not household data).

### TC-01-K5 — Firestore uses its memory-only cache *(provisional: SA-001 §8.4)*
**Priority** P2 · **Type** Security / config · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Code review and a signed-in session.
- **Action:** Check the Firestore initialisation; look for a Firestore IndexedDB database after loading the dashboard.
- **Expected:** No persistent cache is enabled; no Firestore IndexedDB database exists.
- **Don't assert:** cache size.

### TC-01-K6 — A second homeowner signing in on the same tab, without a reload, never sees the first one's data
**Priority** P1 · **Type** Security (data leak across households) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Two homeowners, U-G then U-P, same tab. U-G signs in, opens the dashboard, signs out.
- **Action:** Without reloading, U-P signs in.
- **Expected:** At no moment (including while loading) does Household A's lot, name or any figure show; only Blk 4 Lot 12.
- **Don't assert:** how the app clears its memory (a reload or a Firestore shutdown on sign-out are both fine).

### TC-01-K7 — The same, with a reload between the two people
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** As K6, with a page reload after U-G signs out.
- **Action:** U-P signs in.
- **Expected:** As K6.
- **Don't assert:** as K6.

### TC-01-K8 — Signing out in one tab signs out the other open tab
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G signed in, two tabs on the dashboard.
- **Action:** Sign out in tab 1; click a menu item in tab 2.
- **Expected:** Tab 2 shows the sign-in page and loads no further household data. (Firebase's default `local` persistence syncs tabs — confirm on the emulator.)
- **Don't assert:** how fast tab 2 reacts without an action.

## Block L — Staying signed in (S13)

### TC-01-L1 — A homeowner who did not sign out lands on her dashboard the next day
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G signs in; the browser is closed. Move the device clock past midnight **local time (Asia/Manila)**, built from the local date, not UTC.
- **Action:** Reopen the browser; open the portal.
- **Expected:** Household A's dashboard; no sign-in page. **Assumption:** Firebase local persistence.
- **Don't assert:** token lifetimes; behaviour after a week (T4).

### TC-01-L2 — Reloading any screen keeps the session and the screen
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G, on a dashboard sub-screen.
- **Action:** Reload.
- **Expected:** Same screen, still signed in, no sign-in page flash. (Replaces NAV-04's meaning.)
- **Don't assert:** load time.

## Block M — Navigation and routing

### TC-01-M1 — A signed-out person opening any portal address sees the sign-in page and no data
**Priority** P1 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out.
- **Action:** Open the root, a dashboard address and an admin address.
- **Expected:** The sign-in page each time; no screen content or staff menu flashes first.
- **Don't assert:** the final URL.

### TC-01-M2 — The sign-in heading shows the HOA's name while signed out *(provisional: SA-001 §9 branding)*
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out, each brand build (Greenfield-style and Gentri Heights).
- **Action:** Open the sign-in page.
- **Expected:** "Sign in to {that HOA's name}", with the name filled in, never a placeholder or blank.
- **Don't assert:** where the branding comes from (public read or bundled; Sol Arch to decide).

### TC-01-M3 — After signing in from a deep link, the person reaches the page they asked for
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Blocked on G-11.**
- **Role / setup:** Homeowner, U-P signed out; a deep link to a Household B screen.
- **Action:** Open the link, sign in.
- **Expected (once G-11 is answered):** that page, or the dashboard, as decided. The invite link is Q7.
- **Don't assert:** anything until G-11 is answered.

### TC-01-M4 — Sign-in and create-account link to each other
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out.
- **Action:** "New here? Create an account" → "Already have an account? Sign in".
- **Expected:** Each opens the named page; nothing is submitted.
- **Don't assert:** carried-over values.

### TC-01-M5 — Sign-in and the reset page link to each other
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out.
- **Action:** "Forgot password?" → "Back to sign in".
- **Expected:** Each opens the named page; nothing is submitted.
- **Don't assert:** carried-over values (G-7).

### TC-01-M6 — The browser's Back button moves back through sign-in, create-account and reset
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out, after M4 and M5's steps.
- **Action:** Press Back repeatedly.
- **Expected:** Each previous page in turn; nothing submitted.
- **Don't assert:** history length.

### TC-01-M7 — A signed-in homeowner opening the sign-in address goes to the dashboard
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G, signed in.
- **Action:** Open the sign-in address.
- **Expected:** Household A's dashboard.
- **Don't assert:** whether the sign-in page flashes first for a moment (it holds no data).

### TC-01-M8 — A signed-in not-linked person opening the sign-in address goes to the not-linked screen
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Not-linked account, U-N, signed in.
- **Action:** Open the sign-in address.
- **Expected:** The not-linked screen.
- **Don't assert:** as M7.

### TC-01-M9 — Reloading the sign-in, create-account and reset pages keeps the person there
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out, on each page in turn.
- **Action:** Reload.
- **Expected:** The same page.
- **Don't assert:** typed values after a reload.

### TC-01-M10 — "Sign out" can be reached at 375 px
**Priority** P2 · **Type** Navigation / responsive · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G on the dashboard, phone profile.
- **Action:** Find and use "Sign out".
- **Expected:** Reachable in at most two taps; signs out.
- **Don't assert:** whether it sits inside the ☰ menu (not stated).

### TC-01-M11 — While the role loads, no staff menu appears and then disappears
**Priority** P3 · **Type** UI/UX / security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner (U-G) and not-linked (U-N), slow network.
- **Action:** Sign in; watch the menu area.
- **Expected:** A skeleton (or nothing) until the role is known; never a staff menu that then disappears (REQ-002 States).
- **Don't assert:** the skeleton's look.

## Block N — Usability and accessibility (WCAG 2.2 AA)

Role for this block: **anyone, signed out**, on the sign-in, create-account and reset pages, unless stated.

### TC-01-N1 — Every field has a visible label
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Each page.
- **Action:** Inspect Email, Password and "Your name".
- **Expected:** A visible label tied to each field (not a placeholder alone).
- **Don't assert:** label styling.

### TC-01-N2 — "Show password" reveals the password and hides it again
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Sign-in page, a password typed.
- **Action:** Press "Show password" twice.
- **Expected:** The password shows, then hides.
- **Don't assert:** the hide label's wording (G-1).

### TC-01-N3 — The password toggle is labelled in text and announces its state
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** As N2, with a screen reader or the accessibility tree.
- **Action:** Press the toggle.
- **Expected:** The control has a visible text label (not an icon only) and exposes its state (pressed, or a label change).
- **Don't assert:** wording of the hidden state (G-1).

### TC-01-N4 — Errors are announced
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Trigger C1, G1 and G6.
- **Action:** Listen with a screen reader, or inspect the role.
- **Expected:** Each error is in a `role="alert"` region and is read out.
- **Don't assert:** placement (N5, N6).

### TC-01-N5 — Field errors sit under their field
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Trigger G6 and C7.
- **Action:** Look at the page.
- **Expected:** Each message sits directly under its field.
- **Don't assert:** colours.

### TC-01-N6 — Errors that concern two fields are placed where the BA decides
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Blocked on G-12** (the mock-up puts C1 and G1 above the form; REQ-001 says "under the field").
- **Setup:** Trigger C1 and G1.
- **Action:** Look at the page.
- **Expected (once G-12 is answered):** as decided.
- **Don't assert:** anything until G-12 is answered.

### TC-01-N7 — The password stays typed after a wrong-password error
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Trigger C1.
- **Action:** Look at the password field.
- **Expected:** Still filled (REQ-001: "typing is never cleared by an error"; mock-up 1D). Security note for the owner: some sites clear it; REQ-001 chose not to.
- **Don't assert:** the masked characters.

### TC-01-N8 — Every tap target is at least 44 × 44 px
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Each page at 375 px.
- **Action:** Measure Continue with Google, Sign in, Show password, Forgot password?, Create an account, Create account, Send reset link, Back to sign in, Send again.
- **Expected:** Each is at least 44 × 44 px.
- **Don't assert:** exact sizes.

### TC-01-N9 — The Google button meets 4.5:1 contrast and says "Continue with Google" in text
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Sign-in and create-account pages.
- **Action:** Check contrast and the button's text.
- **Expected:** Text contrast at least 4.5:1; the words "Continue with Google" in text, not only the logo.
- **Don't assert:** Google's logo colours.

### TC-01-N10 — Fields carry the autocomplete values password managers need
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Sign-in and create-account pages.
- **Action:** Inspect the fields.
- **Expected:** Sign-in: `email`, `current-password`. Create account: `name`, `email`, `new-password`.
- **Don't assert:** other attributes.

### TC-01-N11 — The email field opens the email keyboard on phones
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Each page with an email field.
- **Action:** Inspect the field (or tap it on a phone).
- **Expected:** `type="email"` (and `inputmode="email"`).
- **Don't assert:** the keyboard layout itself.

### TC-01-N12 — While signing in, the button reads "Signing in…" and is disabled
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-P; auth response slowed.
- **Action:** Press "Sign in".
- **Expected:** "Signing in…", disabled, announced; back to "Sign in" after an error.
- **Don't assert:** the in-flight label for "Create account" (G-1) or Google (G-20).

### TC-01-N13 — Sign-in and account creation work with the keyboard alone
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-P; a new U-NEW for the create path.
- **Action:** Tab through each form and press Enter to submit.
- **Expected:** Logical order (Google → Email → Password → Show password → Forgot password? → Sign in → Create an account); visible focus; no trap; Enter submits once.
- **Don't assert:** focus ring styling.

### TC-01-N14 — Pasting into the email and password fields is allowed (WCAG 2.2 SC 3.3.8)
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Sign-in page.
- **Action:** Paste an email and a password.
- **Expected:** Both are pasted.
- **Don't assert:** clipboard behaviour of the browser.

### TC-01-N15 — The same words are used everywhere
**Priority** P3 · **Type** UI/UX (same concept, different word) · **Layer** TBD — QE · **Writes** No
- **Setup:** Every page in REQ-001, signed in and out.
- **Action:** Read every button, link, menu item and message.
- **Expected:** "Sign in" / "Sign out", never "Log in" / "Log out"; "invite code" spelled the same on 1G and 4B.
- **Don't assert:** wording outside REQ-001's pages.

### TC-01-N16 — The sign-in pages use the mock-up's green top bar and card
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Each page.
- **Action:** Compare with mock-up 1A.
- **Expected:** The same top bar and card style.
- **Don't assert:** pixel values.

### TC-01-N17 — The sign-in page reflows at 320 px and at 200 % zoom
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Sign-in page.
- **Action:** View at 320 px wide; then at 200 % zoom on desktop.
- **Expected:** No content lost; no horizontal scroll.
- **Don't assert:** layout details.

### TC-01-N18 — After an error or a page change, focus moves to the error or the new heading
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Trigger C1; then move from sign-in to create account.
- **Action:** Note where focus is.
- **Expected:** On the error, then on the new page's heading.
- **Don't assert:** scroll position.

### TC-01-N19 — Every static string in the copy of record appears as written
**Priority** P2 · **Type** UI/UX (copy) · **Layer** TBD — QE · **Writes** No
- **Setup:** Sign-in page and create-account page.
- **Action:** Read them.
- **Expected:** "Sign in to {HOA name}", "Continue with Google", "or use your email", "Email", "Password", "Show password", "Sign in", "Forgot password?", "New here? Create an account" exactly as in REQ-001's copy of record.
- **Don't assert:** strings not in the copy of record (G-1).

## Block O — Phones (DEF-001)

Role for this block: **anyone, signed out**, unless stated.

### TC-01-O1 — On a real phone profile, the sign-in page uses the phone layout
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** Phone emulation with `isMobile` (Pixel 5, 375 × 812), **not** a narrowed desktop window (that hides DEF-001).
- **Action:** Open the sign-in page; read `innerWidth`.
- **Expected:** Layout width 375; one card; readable text without zoom; the viewport meta tag is present.
- **Don't assert:** font sizes.

### TC-01-O2 — No horizontal scroll at 375 px
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** As O1, on the sign-in, create-account, reset and not-linked (U-N) pages.
- **Action:** Check the page's scroll width.
- **Expected:** No wider than the screen on any of them.
- **Don't assert:** vertical length.

### TC-01-O3 — With the keyboard open, the primary button can be reached
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** A real phone or simulator with an on-screen keyboard.
- **Action:** Focus the password field; try to reach "Sign in".
- **Expected:** Reachable without closing the keyboard (scroll is fine).
- **Don't assert:** exact position.

### TC-01-O4 — The sign-in page works in landscape on a phone
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** Phone profile rotated to landscape.
- **Action:** Sign in as U-P.
- **Expected:** All controls usable; no horizontal scroll; signs in.
- **Don't assert:** layout details.

### TC-01-O5 — On a desktop the sign-in page shows a single centred card
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** 1280 px wide.
- **Action:** Open the sign-in page.
- **Expected:** One card, centred.
- **Don't assert:** card width.

## Block P — Double taps and two sessions

### TC-01-P1 — Double-tapping "Sign in" sends exactly one request
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-P.
- **Action:** Double-tap "Sign in".
- **Expected:** One sign-in request.
- **Don't assert:** the disabled state (N12).

### TC-01-P2 — Double-tapping "Create account" creates exactly one account and one person record
**Priority** P1 · **Type** Concurrency / data integrity · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW.
- **Action:** Double-tap "Create account".
- **Expected:** One Auth user, one `users` doc, one verification code; no "already an account" message shown.
- **Don't assert:** timing.

### TC-01-P3 — The same email signed up in two tabs at once creates one account
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW, two tabs or two devices.
- **Action:** Press "Create account" in both at about the same time.
- **Expected:** One account; the other tab shows the G1 message.
- **Don't assert:** which tab wins.

### TC-01-P4 — Double-tapping "Continue with Google" opens one popup
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G.
- **Action:** Double-tap "Continue with Google"; complete the popup.
- **Expected:** One popup; signed in; no "popup closed" style error left on the page.
- **Don't assert:** the in-flight label (G-20).

### TC-01-P5 — Double-tapping "Send reset link" sends one request
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner, U-P, on the reset page.
- **Action:** Double-tap "Send reset link".
- **Expected:** One reset request; one reset code.
- **Don't assert:** the message's timing.

### TC-01-P6 — Double-tapping "Send again" sends one verification request
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As F4.
- **Action:** Double-tap "Send again".
- **Expected:** One new verification code.
- **Don't assert:** the confirmation (G-6).

## Block Q — Integration with the other REQs and the existing app

### TC-01-Q1 — The important-announcement pop-up does not appear on the sign-in page
**Priority** P2 · **Type** Integration (modal mid-flow) · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Signed out; an unacknowledged important announcement exists (as NAV-05).
- **Action:** Open the portal.
- **Expected:** No pop-up; the sign-in form is usable.
- **Don't assert:** the banner.

### TC-01-Q2 — After sign-in the pop-up shows once on the dashboard and doesn't block "Sign out"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G; as Q1.
- **Action:** Sign in; then sign out while the pop-up is up (or after closing it).
- **Expected:** The pop-up shows once on the dashboard; "Sign out" still works.
- **Don't assert:** the pop-up's wording.

### TC-01-Q3 — A not-linked person never sees the announcement pop-up
**Priority** P2 · **Type** Integration / security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Not-linked, U-N; as Q1.
- **Action:** Sign in.
- **Expected:** No pop-up on the not-linked or invite-code screens.
- **Don't assert:** anything else on the screen.

### TC-01-Q4 — Each staff sub-role lands on the staff view, not the not-linked screen
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Treasurer (U-TR), admin office (U-AD), board (U-BD), each signed out.
- **Action:** Sign in as each.
- **Expected:** The staff dashboard for that role (REQ-002); never the not-linked screen.
- **Don't assert:** the staff menus (TC-02).

### TC-01-Q5 — A treasurer who is also a homeowner gets the view switch
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Treasurer + homeowner, U-TRH.
- **Action:** Sign in.
- **Expected:** The staff view with the "Treasurer | My household" switch (2B).
- **Don't assert:** the switch's behaviour (TC-02).

### TC-01-Q6 — A guard account's landing in R1
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Blocked on G-19** (no guard screens released in R1).
- **Role / setup:** Guard, U-GD.
- **Action:** Sign in.
- **Expected (once G-19 is answered):** as decided; never a homeowner or admin screen.
- **Don't assert:** anything until G-19 is answered.

### TC-01-Q7 — An invite link's code survives Google sign-in
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner (a new emulator Google user); a REQ-004 invite link `…/join#<code>` for a test household.
- **Action:** Open the link signed out; press "Continue with Google"; complete the popup.
- **Expected:** The confirm-lot screen (4C) opens with the code filled in, without typing it.
- **Don't assert:** redeeming (TC-04).

### TC-01-Q8 — An invite link's code survives creating an account by email
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner, U-NEW; an invite link as Q7.
- **Action:** Open the link signed out; "Create an account" by email.
- **Expected:** 4C opens with the code filled in.
- **Don't assert:** redeeming (TC-04).

### TC-01-Q9 — The name typed at sign-up is the one the admin office sees
**Priority** P2 · **Type** Integration / round-trip · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** New homeowner U-NEW signs up as "Lito ZZTest" and redeems an invite for ZZ Test Household E; admin office U-AD.
- **Action:** U-AD opens Household E's detail.
- **Expected:** "Lito ZZTest" under "People with portal access", same spelling.
- **Don't assert:** other detail fields.

### TC-01-Q10 — A name containing markup shows as plain text to the admin office
**Priority** P2 · **Type** Security (stored XSS) · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** As G16's account, linked to Household E; admin office U-AD.
- **Action:** U-AD opens Household E's detail and the directory.
- **Expected:** The name shows as text in both; no script runs.
- **Don't assert:** truncation.

### TC-01-Q11 — A homeowner whose membership is removed while signed in loses the household on the next read *(provisional: ADR-004 `exists(members/...)`)*
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Role / setup:** Homeowner. A disposable account linked to a disposable household, signed in on the dashboard; admin removes the membership (REQ-004).
- **Action:** The homeowner opens another screen.
- **Expected:** The read is refused; the not-linked screen; no household data after the removal.
- **Don't assert:** a message about the removal (not stated).

**Q12 (cross-reference, not a case) — A staff member whose role is removed while signed in.**
Cross-reference only: owned by **TC-02** (REQ-002 decision 1, "at once"; ADR-004 `staff/{uid}` check). Not counted here.

## Block R — Project settings (go-live checklist) *(provisional: SA-001 §8.4, §8.3, ADR-005)*

These check settings, not code. Each runs on **`hoa-portal-staging`** and on the emulator seed where stated. On each **production** project they are **read-only console inspections by the owner** before it takes real users: no sign-ins, no test data. Role for this block: **Firebase console operator** (not an app role).

### TC-01-R1 — Email enumeration protection is on
**Priority** P1 · **Type** Security / config · **Layer** TBD — QE · **Writes** No
- **Setup:** Console access to each project.
- **Action:** Open Authentication settings.
- **Expected:** Email enumeration protection is on.
- **Don't assert:** other settings.

### TC-01-R2 — The password policy is Require with a minimum of 8
**Priority** P1 · **Type** Security / config · **Layer** TBD — QE · **Writes** No
- **Setup:** As R1.
- **Action:** Open the password policy.
- **Expected:** Enforcement Require; minimum length 8. Whether "force upgrade on sign-in" is on is the decision in G-13.
- **Don't assert:** other character requirements (REQ-001 sets none).

### TC-01-R3 — Authorised domains list only that project's own domains
**Priority** P1 · **Type** Security / config · **Layer** TBD — QE · **Writes** No
- **Setup:** As R1.
- **Action:** Open Authorised domains.
- **Expected:** No staging or `localhost` domain on a production project; no production domain on staging.
- **Don't assert:** Firebase's default domains for that same project.

### TC-01-R4 — The Google provider is enabled
**Priority** P2 · **Type** Config · **Layer** TBD — QE · **Writes** No
- **Setup:** As R1.
- **Action:** Open Sign-in providers.
- **Expected:** Email/Password and Google enabled; no other provider (no phone).
- **Don't assert:** the support email shown.

### TC-01-R5 — "One account per email address" is set
**Priority** P1 · **Type** Security / config · **Layer** TBD — QE · **Writes** No
- **Setup:** As R1.
- **Action:** Open the account-linking setting.
- **Expected:** One account per email address (H1–H6 and P3 depend on it). Sol Arch is adding it to SA-001 §8.4.
- **Don't assert:** anything else.

### TC-01-R6 — With App Check enforced, sign-in and the first dashboard read still work *(provisional: SA-001 §8.3)*
**Priority** P2 · **Type** Security / integration · **Layer** TBD — QE · **Writes** No
- **Setup:** Staging, App Check registered and enforced; homeowner U-P. (Emulator runs use the App Check debug provider.)
- **Action:** Sign in and load the dashboard.
- **Expected:** Both work.
- **Don't assert:** App Check metrics.

### TC-01-R7 — With App Check enforced, a request with no App Check token is refused
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Setup:** As R6.
- **Action:** Read a Firestore document with a valid sign-in token but no App Check token.
- **Expected:** Refused.
- **Don't assert:** the error text.

### TC-01-R8 — Reset and verification emails arrive in a test inbox on staging
**Priority** P2 · **Type** Integration (copy promises an email) · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Staging; a real test inbox on the team's domain.
- **Action:** Ask for a reset; create an account.
- **Expected:** Both emails arrive. Note whether they land in the inbox or spam (SA-001 Q7, sending domain, is open).
- **Don't assert:** delivery time.

### TC-01-R9 — The emulator seed turns email enumeration protection on
**Priority** P1 · **Type** Config (test precondition) · **Layer** TBD — QE · **Writes** No
- **Setup:** The emulator's Auth config or exported `config.json` (`enableImprovedEmailPrivacy`).
- **Action:** Start the emulator from the seed; sign in with U-NONE and any password.
- **Expected:** The refusal is the same as for a wrong password (not "email not found"). C3, C5, E3, E4 run on the emulator only after this passes.
- **Don't assert:** the setting's name if the emulator version renames it.

## Block S — Back-compat

### TC-01-S1 — A role left in browser storage by the mock-up does not choose the role in the real app *(provisional: SA-001 §11.2)*
**Priority** P2 · **Type** Back-compat / security · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G. On the real app's origin, pre-seed `localStorage` with the mock-up's stored state including `UI.role = "admin"`.
- **Action:** Sign in.
- **Expected:** Household A's homeowner dashboard; no admin screen or menu.
- **Don't assert:** whether the old key is deleted. Applies only if the real app is ever served on an origin that hosted the mock-up.

### TC-01-S2 — An account whose password predates the 8-character policy
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** Yes
- **Blocked on G-13.** **Env: staging only.**
- **Role / setup:** Homeowner. A staging account created with a 6-character password before the policy was set to Require.
- **Action:** Sign in.
- **Expected (once G-13 is answered):** as decided (refused, or asked to choose a new password).
- **Don't assert:** anything until G-13 is answered.

## Block T — Exploratory charters

### TC-01-T1 — 20 minutes: signing in from links opened inside phone apps
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner, U-G and U-P, on a real Android phone. Staging.
- **Charter:** Open the portal link from Facebook Messenger, Gmail, Viber and SMS. Try "Continue with Google" and email sign-in in each app's built-in browser. Look for: Google refusing to sign in inside an embedded browser, a popup that never returns, the session landing in the app's browser instead of Chrome, the invite code lost.
- **Don't assert:** pass/fail; report findings (feeds G-14).

### TC-01-T2 — 15 minutes: one shared family phone, two homeowners
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowners U-G and U-P, one phone.
- **Charter:** Take turns: sign in, browse, sign out, switch to Google, use Back, the app switcher, and a home-screen shortcut. Look for any glimpse of the other household's data or a session that didn't end.
- **Don't assert:** pass/fail; report findings.

### TC-01-T3 — 15 minutes: slow and flaky network
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner U-P and new U-NEW accounts.
- **Charter:** Throttle to slow 3G and toggle offline mid-request on sign-in, create account, reset and "Send again". Look for stuck "Signing in…", duplicate accounts, a missing `users` doc, lost typing, and errors that don't say what to do.
- **Don't assert:** pass/fail; report findings.

### TC-01-T4 — 15 minutes: staying signed in on an iPhone over weeks
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
- **Role / setup:** Homeowner U-G on an iPhone (Safari), once as a normal tab and once added to the home screen. Staging.
- **Charter:** Safari deletes script-written storage (where the session lives) after 7 days of Safari use without visiting the site, unless the app is on the home screen. Homeowners sign in once or twice a month. Check what a homeowner sees after more than 7 days away, in both set-ups. Report to Sol Arch (SA-001 risk).
- **Don't assert:** pass/fail; report findings.

---

## Requirement gaps for the BA

v1 sent G-1 to G-14 to the BA on 2026-11-28. v1.1 changes are marked.

| # | Gap | Cases affected |
|---|---|---|
| G-1 | **Copy of record is incomplete.** Missing: empty-field and malformed-email errors; "Your name" label, whether name is required, and its length limits; create-account and reset page headings ("Create an account", "Reset your password"), "Send reset link", "Back to sign in", "Already have an account? Sign in" (mock-up only); "Signed in as {email}" (1G); the hide label for "Show password"; the in-flight label for "Create account" | C7–C9, G12, G15, I4, N2, N3, N12 |
| G-2 | **Name on the Google path.** No name field when signing up with Google. Where does `users/{uid}.name` come from, what if the Google profile has none, and how is the first name for "Welcome back, Maria" chosen? | A3, F12, register |
| G-3 | **Phone.** REQ-001 Data says the phone is written at account creation, but 1F has no phone field. Drop it from REQ-001 or add the field. **Blocks sign-off of the register's phone row** | register |
| G-4 | **Trimming.** Are leading/trailing spaces trimmed from the email before sign-in and sign-up? (Letter case is already handled by Firebase.) | C11, F10, G14 |
| G-5 | **Disabled account: copy and landing.** *v1.1:* Firebase's behaviour is now known (refused at sign-in; while signed in, access lasts until the token refreshes, up to an hour). Only the copy and landing are open. Rank low: no REQ lets the office disable accounts, only console access can | D11, D12 |
| G-6 | **Unverified banner.** Where it shows on each landing; the confirmation after "Send again"; the copy when Firebase rate-limits re-sends (the SDK reports too-many-requests); and whether the admin office should see verification status | F4, F5, P6 |
| G-7 | **Carrying the email between pages.** Is the typed email carried to "Forgot password?" and from the duplicate-email message to sign-in? | D3, E9, G4, G5, M5 |
| G-8 | **Google popup closed or blocked.** No copy | D9, D10 |
| ~~G-9~~ | *Withdrawn in v1.1.* Answered by SA-001 §8.1: a not-linked account's reads, announcements included, are refused | J9 |
| ~~G-10~~ | *Withdrawn in v1.1.* Answered by Firebase's default `local` persistence, which syncs sign-out across tabs | K8 |
| G-11 | **Deep link after sign-in.** Return to the requested page, or always the dashboard? | M3 |
| G-12 | **Placement of errors that concern two fields.** "Placed under the field" does not fit C1 and G1; the mock-up shows them above the form. *v1.1:* the second half of v1's G-12 (should the password be cleared?) is dropped; REQ-001 already decided "typing is never cleared" (N7 carries it as a security note) | N6 |
| G-13 | **Passwords shorter than the policy, set before it.** *v1.1, reframed as a settings decision:* turn on Firebase's "force upgrade on sign-in" option, or refuse those sign-ins? And the copy the person sees | S2, R2 |
| G-14 | **In-app browsers.** Google does not allow its sign-in inside apps' built-in browsers. What should the page say to a homeowner who opened the link in Messenger? (T1 confirms the behaviour first) | T1 |
| G-15 | *New.* **Offline copy for the create-account and reset pages.** The copy of record's offline line says "…to sign in" | D7, D8 |
| G-16 | *New.* **Google sign-in on an address that has a password account Google isn't trusted for** (any non-Gmail address). Firebase likely refuses with "account exists with different credential". What should the person see? | H6 |
| G-17 | *New.* **A Google-only account using the email form or asking for a reset.** Hint "use Continue with Google"? And should a reset be allowed to add a password to a Google-only account? | C12, E10 |
| G-18 | *New.* **Where a new account with no household lands after a reload**: 4B "Enter your invite code" or 1G "not linked" (which also takes the code)? | F2, I1, status enumeration |
| G-19 | *New.* **Where a guard account lands in R1**, when no guard screens are released | Q6 |
| G-20 | *New.* **In-flight state for "Continue with Google"**: the copy table gives one only for "Sign in" | N12, P4 |
| G-21 | *New.* **What the person sees if their person record can't be saved** right after the account is created (offline, tab closed) | F11 |

## Open with Sol Arch (not BA gaps)

Sol Arch's review lists these as theirs to settle in SA-001; the cases that depend on them are tagged.

| Item | Cases |
|---|---|
| `createdAt` on `users` (not in §4.2) and the rule that it equals server time | F8, J11, J15 |
| The own-uid self-read rule for `members` and `staff` (§8.1) | J4, J5 |
| Whether a co-member of the same household may read your `users` doc (§8.2 vs REQ-001 review) | J22 |
| The "one account per email" account-linking setting in §8.4 | R5, H1–H6 |
| Branding while signed out: a public read of `config/branding`, or bundled at build | M2, J10 |
| iPhone Safari deleting the session after 7 days without a visit (new risk) | T4 |
| Whether to force a token refresh at boot, so a disabled account is cut off sooner | D12 |
| New learning: the emulator does not copy console Auth settings, so settings-dependent tests run on staging | header, R9 |

## Coverage summary

"Blocked" cases have no expected result until the gap they name is answered; they are not runnable yet.

| Block | Scenario | Cases | P1 | Blocked |
|---|---|---|---|---|
| A | Sign in with Google (S1) | 4 | 2 | 0 |
| B | Sign in with email and password (S2) | 1 | 1 | 0 |
| C | Wrong credentials don't reveal accounts (S3) | 13 | 3 | 1 |
| D | Firebase and network refusals (S5, states) | 12 | 1 | 3 |
| E | Password reset (S4) | 10 | 6 | 1 |
| F | Creating an account (S6) | 14 | 6 | 2 |
| G | Account-creation validation (S7, S8) | 16 | 5 | 3 |
| H | Google and existing password accounts (S9) | 6 | 3 | 1 |
| I | Signed in, not linked (S10) | 5 | 2 | 0 |
| J | Access control and rules (S10, S11) | 23 | 14 | 1 |
| K | Signing out (S12) | 8 | 5 | 0 |
| L | Staying signed in (S13) | 2 | 1 | 0 |
| M | Navigation and routing | 11 | 1 | 1 |
| N | Usability and accessibility | 19 | 0 | 1 |
| O | Phones (DEF-001) | 5 | 1 | 0 |
| P | Double taps and two sessions | 6 | 1 | 0 |
| Q | Integration | 11 | 2 | 1 |
| R | Project settings *(provisional)* | 9 | 5 | 0 |
| S | Back-compat | 2 | 0 | 1 |
| T | Exploratory charters | 4 | 0 | 0 |
| **Total** | | **181** | **59** | **16** |

Every Gherkin scenario S1–S13 has at least one runnable case (Acceptance table). Every mandatory type is covered: negative (C, D, G, J), boundary (A3, C10, F9, F12, G6, G10, G11, G13, L1), usability (N), navigation (M, K2, I2, J3).
