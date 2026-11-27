# TC-01: Sign in to the portal (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new sign-in, account creation, password reset, sign-out and the "not linked" screen. Replaces the mock-up's open role switch and "Viewing as" picker |
| Source | [REQ-001 Sign in to the portal](../requirements/REQ-001-sign-in.md), **Approved** by the owner 2026-11-28 (r3), Option A: email and password, or Google |
| Feature area | `AU` sign-in & roles |
| Related requirements | [REQ-002](../requirements/REQ-002-roles-and-permissions.md) roles (staff landing, no-access page) · [REQ-003](../requirements/REQ-003-household-directory.md) directory (reads `users` name and email) · [REQ-004](../requirements/REQ-004-invite-and-link.md) invites (where "Create account" lands; invite code kept through sign-in) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open): no viewport meta, so phones never get the phone layout. Sign-in is the first page every homeowner sees on a phone, so block O re-checks it |
| App version | **Anticipated.** Planned ahead of the build. Today `main` holds only the browser mock-ups (`index.html`, `gentri-heights/index.html`), which have no sign-in |
| Mockup | Screens 1A, 1D, 1E, 1F, 1G (and 2C for "no access") of [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html). 1B and 1C are the rejected options and are not tested |
| Architecture | **Provisional.** [SA-001](../architecture/SA-001-hoa-portal-firebase-architecture.md) §4.2, §8.1, §8.4, §9, §10 and [ADR-004](../architecture/adr/ADR-004-roles-and-household-linking.md) / ADR-005 are **Draft** on branch `docs/sa-001-architecture` (r2). Every case tagged *(provisional: SA-001)* depends on that draft and is re-checked when SA-001 is approved |
| Source files / functions touched (anticipated, per SA-001 §9) | `web/src/main.js` (boot, auth listener, role router), the sign-in / create-account / reset / not-linked views, the route guard, `firestore.rules` (`users/{uid}`, deny by default), Firebase Auth project settings (§8.4). No Cloud Function is added by REQ-001 |
| Environment | Firebase **Emulator Suite** (Auth + Firestore) for everything that can run there. **`hoa-portal-staging`** only for the project-settings cases in block R and the real-Google and real-email cases marked so. **Never production** |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). QE may start triage. Gaps G-1 to G-14 sent to the BA; cases that depend on a gap record what the build does until the BA answers |

## Roles and what crosses between them

REQ-001 is about one person proving who they are, but four values it writes are read by another role or another screen.

### Round-trip register

| Field / value | Written where, by whom | Read back where, by whom | Case |
|---|---|---|---|
| `users/{uid}.name` | "Create an account" form, by the person | Dashboard greeting "Welcome back, {first name}" (the person); household detail "People with portal access" (admin office, REQ-004 4E); directory (REQ-003) | F1, F7, Q5 |
| `users/{uid}.name` for a **Google** account | **Not stated.** No name field on the Google path (1A, 1F) | Same readers as above | F8 → gap G-2 |
| `users/{uid}.email` | Account creation, by the person; rules require it to equal the token email | Not-linked screen "Signed in as {email}" (the person, 1G); household detail (admin office, REQ-004 4E) | F7, I4, J6 |
| `users/{uid}.phone` (optional) | **Not stated where.** REQ-001 Data says "at account creation", but 1F has no phone field | Admin office (REQ-003 / REQ-004) | → gap G-3 |
| Email verified (Firebase Auth) | Firebase, when the person opens the verification link | The person: "Check your email to verify your address" banner. Admin office: **not shown** (no screen in REQ-002–004 shows it; BA to confirm this is deliberate) | F3, F4, F5 → gap G-6 |
| Sign-in provider (password / Google) | Firebase, at sign-in or on Google takeover | The person only, indirectly (old password stops working). Nobody else reads it — deliberately not shown | H1–H3 |
| Signed-in state | Firebase Auth (persisted on the device) | Every screen's route guard | K, L, M |

No household or membership data is written by REQ-001 (REQ-001 Data: "No household data is created by signing in"). Case F6 asserts that.

### Status enumeration: where a signed-in person lands

The route guard is a status-gated rule: what the person sees depends on the state of their account. One row per state the account can hold, cross-checked against the copy.

| Account state | Lands on | Copy that promises it | Case |
|---|---|---|---|
| Signed out | Sign-in page (1A) | "Sign in to {HOA name}" | M1 |
| Signed in, no household, no staff role | Not-linked screen (1G) | "Your account isn't linked to a household yet. Enter the invite code from the admin office." | I1 |
| Signed in, just created (no household yet) | "Enter your invite code" (REQ-004 4B) | Gherkin "Creating an account" | F2 |
| Signed in, linked to one household | That household's dashboard | "Welcome back, {first name}" · header lot label | A1, B1 |
| Signed in, staff role only | Staff dashboard (REQ-002) | REQ-002 | Q3 |
| Signed in, staff role **and** a household | Staff view, with the REQ-002 view switch | REQ-002 2B | Q3 |
| Signed in, email **not verified** (any of the above) | Same landing as the row it belongs to, plus the unverified banner | "Check your email to verify your address. · Send again" | F3 |
| Signed in, household membership **removed** while signed in (REQ-004 sale) | Not-linked screen on the next read | REQ-004 | Q6 |
| Account **disabled or deleted** in Firebase while signed in | **Not stated** | No copy of record | D6 → gap G-5 |
| Signed in on a deep link to another household's page | "You don't have access to this page" (2C) | Copy of record "No access" | J1 |

Email-verified has two values (verified, not verified). A Google account is always verified, so the banner case is password-only (F3, F4).

## Test plan

### 1. Smoke

**Smoke changes.** REQ-001 adds a gate in front of every screen, so the standing smoke pass (SMK-owner-\*, SMK-admin-\*, SMK-guard-\*, which today open the mock-up with no sign-in) cannot reach any screen without a signed-in fixture once the real app exists. QE needs:

- **New smoke item: the sign-in page loads** signed out, with its heading, the Google button and the email form, no page error (A-block happy path, M1).
- **New smoke item: the not-linked screen loads** for the not-linked fixture (I1).
- **Every existing role smoke item now starts from a signed-in fixture** (homeowner, admin, guard) instead of the role switch. The role switch itself (NAV-02) and "Viewing as" are removed by REQ-001/REQ-002; their smoke and NAV rows retire or move (see Regression).

### 2. Acceptance

Every Gherkin scenario in REQ-001 has at least one case. Unhappy paths are included.

| # | Gherkin scenario | Cases |
|---|---|---|
| S1 | A linked homeowner signs in with Google | A1, A2 |
| S2 | A linked homeowner signs in with email and password | B1 |
| S3 | A wrong password does not reveal whether the email exists | C1, C2, C3, C4 |
| S4 | Resetting a forgotten password | E1, E2, E3 |
| S5 | Firebase refuses a sign-in because of too many attempts | D1, D2 |
| S6 | Creating an account | F1, F2, F3, F6 |
| S7 | Creating an account with an email that already has one | G1, G2 |
| S8 | A password that is too short | G3, G4, G5 |
| S9 | Google sign-in on an unverified account with the same address | H1, H2, H3 |
| S10 | Signed in but not linked to any household | I1, I2, I3, J3 |
| S11 | A homeowner cannot open another household's page | J1, J2 |
| S12 | Signing out on a shared phone | K1, K2, K3, K4 |
| S13 | Staying signed in on her own phone | L1, L2 |
| Background | Email enumeration protection on; password policy Require, min 8 | R1, R2 (and C3, G4 prove them at the server) |
| UX/UI notes | Accessibility, forms, consistency, mobile-first, states, safe actions | N1–N14, O1–O5, D3, D4, P1–P3 |

### 3. Regression

What else could break, and why:

- **The whole existing UI suite assumes no sign-in.** `tests/specs/ui/` (smoke, navigation, vehicle-registration) opens `index.html` and uses the role switch. Once the real app has a sign-in gate, every spec needs a signed-in start. NAV-01 ("Opens as Homeowner on the dashboard"), NAV-02 (role switch), NAV-04 ("Role and screen survive a reload") change meaning: role now comes from the account, and a reload must keep the **session** (L2), not a `localStorage` role. QE to re-baseline these rather than let them fail for the wrong reason. **Top regression risk.**
- **DEF-001 (open).** Neither mock-up has the viewport meta tag. If the real app's shell is lifted from `index.html` without it, the sign-in page renders as a shrunk desktop on every phone. Re-run NAV-07 and NAV-08 under the `mobile` project, and O1 here.
- **Important-announcement pop-up (NAV-05).** The mock-up's Announcements screen promises a pop-up "when they sign in". After REQ-001 it must appear only after sign-in, on the dashboard, and never on the sign-in page or the not-linked screen (Q1, Q2). Failure patterns: *a modal appearing mid-flow blocks the next action*; *copy promises what the code doesn't do*.
- **`users/{uid}` is shared with REQ-003 and REQ-004.** The admin directory and household detail read name and email written here. A rules change that lets a person write a role field, or read another person's `users` doc, breaks REQ-002's isolation (J5, J6, J7).
- **The route guard is shared by every screen of every role.** A guard bug leaks data on every page, not just sign-in (J1–J4, K3, M4).
- **Invite code kept through sign-in (REQ-004).** The `/join#code` link stores the code in `sessionStorage` through sign-in, including the Google popup. Sign-in changes can drop it (Q4).
- **Mock-up `localStorage` state.** The mock-up persists `{S, UI}` including `UI.role`. If the real app is served on an origin that a device used for the demo, a stale `UI.role` must not pick the role (S1, provisional).
- **Failure patterns that plausibly apply** (from `qa.md`): copy promises what the code doesn't do (E1, F1, F4); a value written for one role never shown back (register above, F8, G-3); a status-gated rule checked for one transition only (status enumeration above); same concept different word (N12); zero vs "not set" (F8: no name on a Google profile); a write silently refused by rules (J5, J6 assert the refusal explicitly); double-tap duplicates (P1, P2); two devices / two tabs (P3, K5); stale reference (Q6, D6); modal mid-flow (Q1); assumed SDK/network behaviour (D3, L1: marked as assumptions); data leaking across households (J1, K4).

**Re-run list for QE:** `smoke.spec.js` (all roles, from signed-in fixtures), `navigation.spec.js` NAV-01 to NAV-08 (re-baselined), `vehicle-registration.spec.js` VEH-J1 (homeowner and admin now sign in), and TC-02 to TC-04 cases that start "Given … is signed in".

## All scenarios, by type

Listed before the steps, as the owner's rule requires. Each is one behaviour.

- **Happy path:** Google sign-in lands on the linked dashboard (A1); password sign-in lands on the linked dashboard (B1); account creation lands on invite-code entry (F1, F2); reset email sent for an existing account (E1); reset completes and the new password works (E3); sign-out lands on sign-in (K1); session kept the next day (L1).
- **Negative:** wrong password (C1); unknown email (C2); server refuses a wrong password with the page check bypassed (C3); empty email or password (C5, C6); malformed email (C7); too many attempts (D1); Google popup closed or blocked (D4, D5); offline (D3); disabled account (D6); duplicate email at sign-up (G1); short password (G3); short password with the page check skipped (G4); empty name (G6); reset for unknown email (E2); not-linked reads refused (J3); another household's page (J1); writes to someone else's `users` doc or a role field (J5, J6).
- **Boundary:** password of exactly 7 / 8 characters (G3, G5); a long passphrase with spaces and non-ASCII characters (G7); email with surrounding spaces or upper-case letters (C8, G8); name of one character and a very long name (G9); Google profile with no display name (F8); first name taken from a multi-word name (A2); session across a day boundary and after the browser is closed (L1, L2).
- **Usability:** visible labels and the Show password toggle (N1, N2); errors announced and placed under the field (N3); typing never cleared by an error (C1, G1, G3); tap targets 44 × 44 (N5); Google button contrast and text (N6); autocomplete values and email keyboard (N7, N8); loading state "Signing in…" (N9); keyboard-only completion and Enter to submit (N10); paste and password managers allowed (WCAG 2.2 3.3.8) (N11); same words everywhere (N12); reflow at 320 px and 200 % zoom (N13); focus moves to the error or new heading (N14).
- **Navigation:** signed-out deep link goes to sign-in with no data shown (M1); after sign-in, where the deep link goes (M2, gap); sign-in ↔ create account ↔ forgot password and back (M3); signed-in person opening the sign-in address goes to their landing (M4); refresh on each screen keeps it (M5); Back after sign-out (K2); Sign out reachable at 375 px (M6); not-linked person can reach only "Enter invite code" and "Sign out" (I2); no-access page's "Go to my dashboard" (J2).
- **Role / security:** another household's page refused and no data loaded (J1); not-linked person refused every household and staff read (J3); unauthenticated reads refused (J4); `users/{uid}` writable only by its owner, only allowed fields (J5, J6, J7); no household data in browser storage or the Firestore cache after sign-out (K3, K4); enumeration not leaked by sign-in or reset (C1–C4, E2); Google takeover keeps the uid and household (H2, H3).
- **Integration:** create account → invite code (F2, REQ-004); invite link code kept through Google sign-in (Q4); announcement pop-up after sign-in (Q1); staff landing and view switch (Q3); name read back by the admin office (Q5); membership removed while signed in (Q6).
- **Concurrency:** double-tap "Sign in" → one request (P1); double-tap "Create account" → one account (P2); same email signed up in two tabs → one account (P3); sign out in one tab while another is open (K5).
- **Back-compat:** stale mock-up `localStorage` role ignored (S1); an account whose password predates the 8-character policy (S2, gap).
- **Responsive:** sign-in at 375 px on a real phone profile (O1); no horizontal scroll (O2); primary button within thumb reach with the keyboard open (O3); landscape (O4); desktop single card (O5).
- **UI/UX:** states (loading N9, error C1, success A1, offline D3, unverified F3); consistent green top bar and card (N12); Google button text (N6).
- **Data integrity:** one `users` doc per account, holding only allowed fields (F7); no household or `members` doc created by sign-up (F6); takeover keeps one uid (H2).
- **Exploratory:** in-app browsers on phones (T1); shared phone, two homeowners (T2); slow network (T3).

---

## Test data (fixtures)

All in the emulator seed or the staging test data. Never a real homeowner. QE maps them to `.env`. The REQ's personas (Maria, Juan, Ana) map to these fixtures; the lot labels are seed data, not personal data.

| Fixture | Account | Linked to | Used for |
|---|---|---|---|
| **U-G** "ZZ Test Owner Maria" | Google provider (emulator fake Google user; a test Google account on staging) | ZZ Test Household A, label "Blk 1 Lot 3" | A, K, L, J1 |
| **U-P** "ZZ Test Owner Juan" | Email + password, verified, address `zz-owner-juan@<test domain>` | ZZ Test Household B, label "Blk 4 Lot 12" | B, C, D, E, J |
| **U-N** "ZZ Test Unlinked Ana" | Email + password, verified, no household, no role | — | I, J3 |
| **U-UV** "ZZ Test Unverified" | Email + password, **never verified**, address on a Google-hosted test domain so the same address can sign in with Google | ZZ Test Household C (for H3) or none (for H1) | H, F3 |
| **U-S** "ZZ Test Admin" | Email + password, verified, staff role `admin` (REQ-002) | — (and a variant linked to Household A for the view switch) | Q3 |
| **U-NONE** | No account. Address `zz-nobody@<test domain>` | — | C2, E2 |
| **U-NEW** | Created by the case. Address `zz-new-<run id>@<test domain>` | — | F, G, P |

`<test domain>` is a domain the team controls. **Staging note:** Firebase sends verification and reset emails itself, so SA-001 §10's mail allow-list (a check in our mail function) does **not** cover them. On staging, never type an address you don't control. On the emulator, emails are not sent; their links are read from the emulator's out-of-band codes.

---

## Block A — Sign in with Google (S1)

### TC-01-A1 — A linked homeowner signs in with Google and lands on her household dashboard
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G signed out. Role: Homeowner.
- **Action:** Open the portal. Press "Continue with Google". Choose U-G's account in the popup.
- **Expected:** The dashboard opens with the heading "Welcome back, Maria". The header shows "Blk 1 Lot 3". No sign-in page remains in view.
- **Don't assert:** balances or any dashboard figure; the popup's own Google screens.

### TC-01-A2 — The greeting uses the first word of the stored name
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G's `users` name is a multi-word name whose first word is "Maria" (keep the "ZZ Test" prefix in the household name and email, not as the first word of the person's name, or the greeting reads "Welcome back, ZZ").
- **Action:** Sign in as U-G.
- **Expected:** The greeting reads "Welcome back, Maria", not the full name.
- **Note:** REQ-001 shows "Welcome back, Maria" for "Maria Santos" but does not state the rule. See gap G-2.

### TC-01-A3 — Google sign-in uses the popup flow, not a redirect *(provisional: SA-001 §8.4)*
**Priority** P2 · **Type** Security / config · **Layer** TBD — QE · **Writes** No

- **Setup:** Staging, a browser that blocks third-party storage (current Chrome, Firefox, Safari defaults). Role: Homeowner (U-G).
- **Action:** Press "Continue with Google".
- **Expected:** A popup opens; after choosing the account the person is signed in on the portal page. If the build uses a redirect, it is served from the project's own `authDomain` and still signs in.
- **Needs:** real browser on staging; cannot be proven on the emulator.

## Block B — Sign in with email and password (S2)

### TC-01-B1 — A linked homeowner signs in with email and password and lands on his dashboard
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No

- **Setup:** U-P signed out. Role: Homeowner.
- **Action:** Type U-P's email and password. Press "Sign in".
- **Expected:** The dashboard for "Blk 4 Lot 12" opens.
- **Don't assert:** dashboard figures.

### TC-01-B2 — Pressing Enter in the password field signs in
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No

- **Setup:** U-P signed out.
- **Action:** Type email and password, press Enter.
- **Expected:** Same result as B1, one sign-in request.

## Block C — Wrong credentials do not reveal accounts (S3)

### TC-01-C1 — A wrong password shows the shared message and keeps the email
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No

- **Setup:** U-P exists. Signed out. Role: anyone.
- **Action:** Type U-P's email and a wrong password. Press "Sign in".
- **Expected:** "That email and password don't match. Try again, or reset your password." shows. The email field still holds U-P's email. The person is not signed in.

### TC-01-C2 — An email with no account shows the same message as a wrong password
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** No

- **Setup:** U-NONE.
- **Action:** Type U-NONE's address and any password. Press "Sign in".
- **Expected:** Exactly the same message as C1, in the same place, with no extra hint (no "no account", no "create one" prompt that differs from C1).
- **Don't assert:** response timing.

### TC-01-C3 — The server gives the same answer for a wrong password and an unknown email *(provisional: SA-001 §8.4)*
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No

- **Setup:** Email enumeration protection on (R1).
- **Action:** Call sign-in for U-P with a wrong password, and for U-NONE, bypassing the page.
- **Expected:** Both are refused with the same error code (`INVALID_LOGIN_CREDENTIALS` per SA-001). Neither reveals whether the email exists.

### TC-01-C4 — The page does not branch on a different error for unknown emails
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No

- **Setup:** Mock the auth error as the legacy `user-not-found` and as `wrong-password`.
- **Action:** Submit the form for each.
- **Expected:** Both show the C1 message. (Guards against a page that maps old codes to different copy if enumeration protection is ever off.)

### TC-01-C5 — An empty email is refused before any request
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No

- **Action:** Leave Email empty, type a password, press "Sign in".
- **Expected:** An error under the Email field says what to do; no sign-in request is sent; the password field is not cleared.
- **Note:** Copy is not in the copy of record (gap G-1).

### TC-01-C6 — An empty password is refused before any request
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No

- **Action:** Type an email, leave Password empty, press "Sign in".
- **Expected:** An error under the Password field; no request; email kept. Copy: gap G-1.

### TC-01-C7 — A malformed email is refused with a field error
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No

- **Action:** Type `zz-owner-juan@` and a password. Press "Sign in".
- **Expected:** An error under Email; no request; typing kept. Copy: gap G-1.

### TC-01-C8 — An email typed with a trailing space or capitals still signs in
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No

- **Setup:** U-P.
- **Action:** Type U-P's email as `ZZ-Owner-Juan@<test domain> ` (capitals, trailing space, as phone keyboards add) and the right password.
- **Expected:** Signs in as U-P. **Assumption:** Firebase compares emails case-insensitively; whether the page trims spaces is not stated (gap G-4).

## Block D — Refusals from Firebase and the network (S5 and UX states)

### TC-01-D1 — "Too many attempts" shows its message and keeps the email
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No

- **Setup:** Firebase's too-many-attempts error **mocked** for U-P's email (it cannot be triggered on demand, per Sol Arch).
- **Action:** Press "Sign in".
- **Expected:** "Too many attempts. Wait a while, or reset your password." shows; the email stays in the field.
- **Don't assert:** how many tries trigger it or how long it lasts.

### TC-01-D2 — The "reset your password" route from the too-many-attempts message works
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No

- **Setup:** As D1.
- **Action:** Press "Forgot password?".
- **Expected:** The reset page opens; whether the email is carried over is not stated (gap G-7), so assert only that the page opens.

### TC-01-D3 — Offline shows the offline message instead of a generic error
**Priority** P2 · **Type** Negative / UI-UX · **Layer** TBD — QE · **Writes** No

- **Setup:** Browser offline. U-P.
- **Action:** Press "Sign in" (and, separately, "Continue with Google").
- **Expected:** "You're offline. Connect to the internet to sign in." The button is enabled again; typing kept.
- **Assumption:** the SDK reports a network error rather than hanging. Don't assert any retry behaviour.

### TC-01-D4 — Closing the Google popup returns to the sign-in page with no error and the button ready
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No

- **Action:** Press "Continue with Google", close the popup without choosing an account.
- **Expected:** The sign-in page is usable; the Google button is enabled; no "Signing in…" state is stuck. Copy (if any): gap G-8.

### TC-01-D5 — A blocked Google popup tells the person what to do
**Priority** P2 · **Type** Negative / usability · **Layer** TBD — QE · **Writes** No

- **Setup:** Popups blocked for the site.
- **Action:** Press "Continue with Google".
- **Expected:** A message says how to continue (allow popups, or use email). Copy: gap G-8.

### TC-01-D6 — A disabled account is refused with a message that sends the person to the office
**Priority** P2 · **Type** Negative / stale reference · **Layer** TBD — QE · **Writes** No

- **Setup:** U-P's account disabled in the Auth emulator; once signed out, once while signed in.
- **Action:** Sign in (signed-out variant); reload the dashboard (signed-in variant).
- **Expected:** Not signed in / signed out; no household data shows. Copy and landing not stated (gap G-5): record what the build shows for the owner.

## Block E — Resetting a forgotten password (S4)

### TC-01-E1 — Asking for a reset for an existing email shows the message and actually sends the email
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No

- **Setup:** U-P. Emulator.
- **Action:** Press "Forgot password?", type U-P's email, press "Send reset link".
- **Expected:** "If there's an account for {U-P's email}, we've sent a link to reset the password. Check your spam folder too." **And** the emulator holds exactly one password-reset code for U-P (the copy promises an email; the case proves it).

### TC-01-E2 — Asking for a reset for an unknown email shows the same message and sends nothing
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** No

- **Setup:** U-NONE.
- **Action:** As E1 with U-NONE's address.
- **Expected:** The same message as E1 with that address in it; no reset code exists for that address; no error.

### TC-01-E3 — Following the reset link sets a new password that signs in; the old one no longer does
**Priority** P1 · **Type** Happy path / integration · **Layer** TBD — QE · **Writes** Yes (Auth password)

- **Setup:** After E1. Use a disposable copy of U-P.
- **Action:** Open the reset link, set a new 8+ character password, return to the portal and sign in with it; then try the old password.
- **Expected:** The new password signs in to Blk 4 Lot 12; the old one shows the C1 message.
- **Don't assert:** the wording of Firebase's own reset page (not in our copy of record); link expiry time.

### TC-01-E4 — The reset page refuses a new password under 8 characters *(provisional: SA-001 §8.4)*
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No

- **Action:** On the reset link page, set a 7-character password.
- **Expected:** Refused by Firebase (password policy Require, 8). Wording is Firebase's.

### TC-01-E5 — "Back to sign in" from the reset page returns to the sign-in page
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No

- **Action:** From the reset page, press "Back to sign in".
- **Expected:** The sign-in page opens.

## Block F — Creating an account (S6)

### TC-01-F1 — Creating an account sends a verification email
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes

- **Setup:** U-NEW. Emulator. Role: new homeowner.
- **Action:** Press "New here? Create an account". Type a name, U-NEW's email and an 8+ character password. Press "Create account".
- **Expected:** The emulator holds exactly one verification code for U-NEW's address.

### TC-01-F2 — A new account lands on "Enter your invite code" and sees no household data
**Priority** P1 · **Type** Happy path / security · **Layer** TBD — QE · **Writes** Yes

- **Setup:** As F1.
- **Action:** Complete F1's action.
- **Expected:** "Enter your invite code" (REQ-004 4B) opens. No lot label, balance, announcement or menu other than the invite-code entry and "Sign out".

### TC-01-F3 — An unverified account sees the verification banner with "Send again"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No

- **Setup:** U-UV signed in (or U-NEW right after F1).
- **Action:** Look at the landing screen.
- **Expected:** "Check your email to verify your address." with a "Send again" control. Where the banner sits on each landing (invite-code screen, not-linked screen, dashboard) is not stated (gap G-6).

### TC-01-F4 — "Send again" actually sends a new verification email
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No

- **Setup:** As F3. Emulator.
- **Action:** Press "Send again".
- **Expected:** A new verification code exists for that address. A confirmation shows (copy not stated, gap G-6). Pressing it twice quickly sends one (see P-block shape); the response to Firebase's own rate limit is not stated (gap G-6).

### TC-01-F5 — The banner disappears once the email is verified
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No

- **Setup:** U-NEW after F1.
- **Action:** Open the verification link; return to the portal and reload.
- **Expected:** The banner no longer shows.
- **Don't assert:** whether it disappears without a reload (token refresh timing).

### TC-01-F6 — Creating an account creates no household or membership record
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes

- **Setup:** As F1.
- **Action:** After F1, inspect Firestore.
- **Expected:** No `members` document with U-NEW's uid; no `households` or `staff` document created or changed by the sign-up.

### TC-01-F7 — The account's person record holds the typed name and the account email, and nothing else
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes

- **Setup:** As F1.
- **Action:** Read `users/{uid}`.
- **Expected:** `name` = the typed name, `email` = U-NEW's address (matching the Auth token), optional `phone`, `createdAt`. No role, status or household field. *(provisional: SA-001 §4.2 field list)*

### TC-01-F8 — A Google account with no display name still gets a usable greeting and person record
**Priority** P2 · **Type** Boundary (zero vs not set) · **Layer** TBD — QE · **Writes** Yes

- **Setup:** Emulator fake Google user with no display name, linked to a test household.
- **Action:** Sign in with Google.
- **Expected:** The greeting reads naturally (not "Welcome back, " or "Welcome back, undefined"). How `users/{uid}.name` is filled on the Google path is not stated (gap G-2): record what the build does.

### TC-01-F9 — "Continue with Google" on the create-account page signs a new person up and lands on invite-code entry
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes

- **Setup:** A new emulator Google user with no account.
- **Action:** On "Create an account", press "Continue with Google".
- **Expected:** Lands on "Enter your invite code"; no household data. No verification banner (Google addresses are verified).

## Block G — Account-creation validation (S7, S8)

### TC-01-G1 — Signing up with an email that already has an account shows the message and keeps name and email
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No

- **Setup:** U-P exists.
- **Action:** On "Create an account", type a name, U-P's email, a valid password. Press "Create account".
- **Expected:** "There's already an account for this email. Sign in, or reset your password." Name and email kept. No second account.
- **Note:** This reveals that the email exists. Accepted limitation (REQ-001 Story).

### TC-01-G2 — The "Sign in" and "reset your password" routes from the duplicate-email message work
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No

- **Action:** From G1's state, follow "Sign in"; then return and follow the reset route.
- **Expected:** Each opens its page. Whether the email is carried over: gap G-7.

### TC-01-G3 — A 7-character password shows "Use at least 8 characters" and keeps name and email
**Priority** P1 · **Type** Boundary / negative · **Layer** TBD — QE · **Writes** No

- **Action:** On "Create an account", type a name, U-NEW's email and a 7-character password. Press "Create account".
- **Expected:** "Use at least 8 characters" under the password field; name and email kept; no account created.

### TC-01-G4 — Firebase refuses a 7-character password when the page check is skipped *(provisional: SA-001 §8.4)*
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No

- **Setup:** Password policy Require, minimum 8 (R2).
- **Action:** Call account creation directly with a 7-character password.
- **Expected:** Refused; no account exists afterwards.

### TC-01-G5 — An 8-character password is accepted
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes

- **Action:** As G3 with exactly 8 characters.
- **Expected:** Account created; lands on invite-code entry.

### TC-01-G6 — Creating an account with no name is refused with a field error
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No

- **Action:** Leave "Your name" empty; fill the rest; press "Create account".
- **Expected:** An error under the name field; no account. Whether the name is required, and its copy, is not stated (gap G-1).

### TC-01-G7 — A long passphrase with spaces and non-ASCII characters works for sign-up and sign-in
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes

- **Action:** Sign up with a 64-character passphrase containing spaces and "ñ"; sign out; sign in with it.
- **Expected:** Both succeed. **Don't assert** Firebase's maximum length.

### TC-01-G8 — Signing up with capitals or a trailing space in the email does not create a second account for the same address
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No

- **Setup:** U-P exists.
- **Action:** Sign up with U-P's email in different case, with a trailing space.
- **Expected:** The G1 message; no second account. Trimming not stated (gap G-4).

### TC-01-G9 — A one-character name and a very long name are handled
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes

- **Action:** Sign up with a one-character name; separately with a 200-character name.
- **Expected:** Either accepted and shown without breaking the layout (dashboard greeting at 375 px), or refused with a field error. Limits not stated (gap G-1).

## Block H — Google sign-in takes over an unverified password account (S9)

### TC-01-H1 — Google sign-in on an unverified password account signs in with Google
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes

- **Setup:** U-UV (unverified password account) and an emulator Google user with the same address.
- **Action:** Press "Continue with Google" and choose that account.
- **Expected:** Signed in. Later sign-ins with Google work.

### TC-01-H2 — After the takeover the old password no longer signs in, and the uid is unchanged
**Priority** P2 · **Type** Security / data integrity · **Layer** TBD — QE · **Writes** No

- **Setup:** After H1.
- **Action:** Sign out; sign in with U-UV's old password. Compare the uid before and after H1.
- **Expected:** The C1 message; the uid is the same one.

### TC-01-H3 — After the takeover the account keeps its household
**Priority** P1 · **Type** Security / integration · **Layer** TBD — QE · **Writes** No

- **Setup:** U-UV linked to ZZ Test Household C before H1.
- **Action:** Run H1.
- **Expected:** Lands on Household C's dashboard; the `members` document is unchanged.

## Block I — Signed in, not linked (S10)

### TC-01-I1 — A signed-in person with no household and no role sees the not-linked message
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No

- **Setup:** U-N signed out.
- **Action:** Sign in as U-N.
- **Expected:** "Your account isn't linked to a household yet. Enter the invite code from the admin office."

### TC-01-I2 — The not-linked person sees only "Enter invite code" and "Sign out"
**Priority** P1 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No

- **Setup:** As I1, at 375 px and at desktop width.
- **Action:** Look for menus, the ☰ button, the notification bell, any role switch.
- **Expected:** No menu, bell or switch; only the invite-code entry and "Sign out".

### TC-01-I3 — The not-linked screen stays after a reload
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No

- **Action:** Reload on I1's screen.
- **Expected:** The same screen; no flash of a dashboard.

### TC-01-I4 — The not-linked screen says which account is signed in
**Priority** P3 · **Type** Usability / round-trip · **Layer** TBD — QE · **Writes** No

- **Expected:** "Signed in as {U-N's email}" (1G). Not in the copy of record (gap G-1), so assert the email shows, not the exact words.

## Block J — Access control (S10, S11, security)

### TC-01-J1 — A homeowner opening another household's page sees "You don't have access to this page" and none of its data
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G signed in (Household A only). The address of a Household B page.
- **Action:** Open that address directly.
- **Expected:** "You don't have access to this page". No Household B lot label, name, balance or row appears at any point, and no Household B document was read successfully (network or rules log).

### TC-01-J2 — "Go to my dashboard" from the no-access page returns to her own household
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No

- **Action:** From J1, press "Go to my dashboard".
- **Expected:** Household A's dashboard.

### TC-01-J3 — Firestore refuses every household and staff read from a not-linked account
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No

- **Setup:** U-N's token. Seeded Households A and B, a `staff` doc, an announcement.
- **Action:** Read a `households` doc, `members`, `staff`, and a household's sub-records directly (bypassing the page).
- **Expected:** Every read is **explicitly refused** (permission denied), not just empty. Whether announcements are readable by a not-linked account is not stated: record it (gap G-9).

### TC-01-J4 — Signed-out requests are refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No

- **Action:** With no auth token, read `users`, `households`, `members`, `staff`.
- **Expected:** All refused.

### TC-01-J5 — A person cannot write a role or any field outside the allowed list on their own `users` doc *(provisional: SA-001 §4.2)*
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No

- **Setup:** U-N's token.
- **Action:** Create or update `users/{own uid}` adding `role`, `staffRole`, `householdId`, or any field other than `name`, `email`, `phone`, `createdAt`.
- **Expected:** Refused, and the stored doc is unchanged (assert the refusal, not "nothing changed").

### TC-01-J6 — A person cannot set a different email than their account's on their own `users` doc
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No

- **Action:** Write `users/{own uid}.email` = another fixture's address.
- **Expected:** Refused (rule: `email == request.auth.token.email`).

### TC-01-J7 — A person cannot read or write another person's `users` doc
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G's token; U-P's uid.
- **Action:** Read, create over and update `users/{U-P uid}`.
- **Expected:** All refused. (Admin office reads are REQ-003/TC-03 scope.)

## Block K — Signing out (S12)

### TC-01-K1 — "Sign out" lands on the sign-in page
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G signed in on the dashboard.
- **Action:** Choose "Sign out" in the account menu.
- **Expected:** The sign-in page.

### TC-01-K2 — Pressing Back after signing out shows the sign-in page, not the dashboard
**Priority** P1 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No

- **Setup:** After K1, having visited two screens before signing out.
- **Action:** Press the browser Back button (several times), including on a phone browser (back-forward cache).
- **Expected:** The sign-in page each time. No household data shows, even briefly.
- **Needs:** a real or emulated mobile browser for the bfcache variant.

### TC-01-K3 — No household data stays in browser storage or the Firestore cache after sign-out *(provisional: SA-001 §8.4)*
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G signed in, dashboard loaded.
- **Action:** Sign out; inspect `localStorage`, `sessionStorage`, IndexedDB and Cache Storage for the origin.
- **Expected:** No household data (lot label, balance, name of the household). Firestore is not using a persistent cache. Firebase's own auth keys may remain only until sign-out removes them.

### TC-01-K4 — A second homeowner signing in on the same phone never sees the first one's data
**Priority** P1 · **Type** Security (data leak across households) · **Layer** TBD — QE · **Writes** No

- **Setup:** Same browser. U-G signs in, opens the dashboard, signs out.
- **Action:** U-P signs in.
- **Expected:** At no point (including while loading) does Household A's lot, name or any figure show; only Blk 4 Lot 12.

### TC-01-K5 — Signing out in one tab signs out the other open tab
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G signed in, two tabs on the dashboard.
- **Action:** Sign out in tab 1; act in tab 2 (click a menu item or reload).
- **Expected:** Tab 2 shows the sign-in page and no further household data loads. Not stated in REQ-001; expected from "no household data shows" (gap G-10 if the BA disagrees).

## Block L — Staying signed in (S13)

### TC-01-L1 — A homeowner who did not sign out lands on her dashboard the next day without signing in
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G signs in; the browser is closed; reopened after the device clock moves past midnight local time (or a stored session from a previous day).
- **Action:** Open the portal.
- **Expected:** Household A's dashboard, no sign-in page.
- **Assumption:** Firebase's local persistence (SA-001 cites "even after the user closes the browser"). Don't assert token lifetimes.

### TC-01-L2 — Reloading any screen keeps the session and the screen
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G on a dashboard sub-screen.
- **Action:** Reload.
- **Expected:** Same screen, still signed in; no sign-in page flash. (Replaces NAV-04's meaning.)

## Block M — Navigation and routing

### TC-01-M1 — A signed-out person opening any portal address sees the sign-in page and no data
**Priority** P1 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No

- **Action:** Signed out, open the root, a dashboard address and an admin address.
- **Expected:** The sign-in page each time; no screen content flashes before it.

### TC-01-M2 — After signing in from a deep link, the person reaches the page they asked for
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No

- **Setup:** U-P signed out; a deep link to one of Household B's screens.
- **Action:** Open the link, sign in.
- **Expected:** Not stated (gap G-11). Record whether the person lands on the deep link or the dashboard. The REQ-004 invite link is covered separately (Q4).

### TC-01-M3 — Moving between sign-in, create account and forgot password works both ways
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No

- **Action:** Sign-in → "New here? Create an account" → "Already have an account? Sign in" → "Forgot password?" → "Back to sign in"; also with the browser Back button.
- **Expected:** Each step opens the named page; Back returns to the previous one; nothing is submitted.

### TC-01-M4 — A signed-in person opening the sign-in address goes to their landing page
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G signed in; separately U-N.
- **Action:** Open the sign-in address.
- **Expected:** U-G → Household A's dashboard; U-N → not-linked screen. Not stated explicitly; derived from the status enumeration.

### TC-01-M5 — Refreshing the sign-in, create-account and reset pages keeps the person on that page
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No

- **Expected:** Same page after reload. Whether typed values survive a reload is not required.

### TC-01-M6 — "Sign out" can be reached at 375 px
**Priority** P2 · **Type** Navigation / responsive · **Layer** TBD — QE · **Writes** No

- **Setup:** U-G on the dashboard, phone profile.
- **Action:** Find and use "Sign out".
- **Expected:** Reachable in at most two taps (account menu at top right per REQ-001). Placement inside or outside the ☰ menu is not stated; assert reachability.

## Block N — Usability and accessibility (WCAG 2.2 AA)

### TC-01-N1 — Every sign-in, create-account and reset field has a visible label
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Expected:** Email, Password, Your name: a visible label tied to the field (not placeholder only).

### TC-01-N2 — "Show password" reveals the password and its state is announced
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Action:** Press "Show password" twice.
- **Expected:** The password shows, then hides; the toggle exposes its state (pressed / label change) to a screen reader. The hide label is not in the copy of record (gap G-1).

### TC-01-N3 — Errors are announced and placed under the field they belong to
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Action:** Trigger C1, G1, G3.
- **Expected:** Each is in a `role="alert"` region. Field errors (G3) sit under their field. Form-level errors (C1, G1) appear where the mock-up shows them (above the form in 1D/1F); REQ-001's "under the field" doesn't fit a message that belongs to two fields (gap G-12).

### TC-01-N4 — The password field keeps its value after a wrong-password error
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Expected:** Mock-up 1D keeps it; REQ-001 says "typing is never cleared by an error". Assert it is kept (BA to confirm, gap G-12).

### TC-01-N5 — Every tap target on the sign-in pages is at least 44 × 44 px
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Expected:** Google button, Sign in, Show password, Forgot password?, Create an account link, Send again.

### TC-01-N6 — The Google button meets 4.5:1 contrast and says "Continue with Google" in text
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No

### TC-01-N7 — Fields carry the right autocomplete values so password managers work
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Expected:** Sign-in: `email`, `current-password`. Create account: `name`, `email`, `new-password`.

### TC-01-N8 — The email field opens the email keyboard on phones
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Expected:** `type="email"` (and `inputmode="email"`).

### TC-01-N9 — While signing in, the button reads "Signing in…" and is disabled
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Slow the auth response.
- **Expected:** "Signing in…", disabled, announced; returns to "Sign in" on error. The in-flight label for "Create account" is not stated (gap G-1).

### TC-01-N10 — Sign-in and account creation can be completed with the keyboard alone
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Expected:** Logical tab order (Google → Email → Password → Show password → Forgot password? → Sign in → Create an account), visible focus on each, no trap, Enter submits.

### TC-01-N11 — Pasting into the email and password fields is allowed (WCAG 2.2 SC 3.3.8)
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No

### TC-01-N12 — The words are the same everywhere: "Sign in", "Sign out", never "Log in"; same green top bar and card
**Priority** P3 · **Type** UI/UX (same concept, different word) · **Layer** TBD — QE · **Writes** No
- **Expected:** Every page, button, menu and error uses "Sign in" / "Sign out". "Invite code" is the same term on the not-linked screen and the invite-code screen.

### TC-01-N13 — The sign-in page reflows at 320 px and at 200 % zoom without loss
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No

### TC-01-N14 — After an error or a page change, focus goes to the error or the new heading
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No

## Block O — Phones (DEF-001)

### TC-01-O1 — On a real phone profile the sign-in page uses the phone layout
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** Phone emulation with `isMobile` (Pixel 5, 375 × 812), **not** a narrowed desktop window (that hides DEF-001).
- **Expected:** Layout width equals the screen width (375), one card, readable text without zoom. The page has the viewport meta tag.

### TC-01-O2 — No horizontal scroll on the sign-in, create-account, reset and not-linked pages at 375 px
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No

### TC-01-O3 — With the phone keyboard open, the primary button can be reached without closing it
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Needs:** a real phone or a simulator with an on-screen keyboard.

### TC-01-O4 — The sign-in page works in landscape on a phone
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No

### TC-01-O5 — On a desktop the sign-in page shows a single centred card
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No

## Block P — Double taps and two sessions

### TC-01-P1 — Double-tapping "Sign in" sends one request
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** No
- **Expected:** The button disables on the first tap; one sign-in request.

### TC-01-P2 — Double-tapping "Create account" creates exactly one account and one person record
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Expected:** One Auth user, one `users` doc, one verification email; no "already an account" error shown to the person.

### TC-01-P3 — The same email signed up in two tabs at once creates one account
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Two tabs or two devices.
- **Expected:** One account; the other tab shows the G1 message.

## Block Q — Integration with the other REQs and the existing app

### TC-01-Q1 — The important-announcement pop-up appears after sign-in on the dashboard, not on the sign-in page
**Priority** P2 · **Type** Integration (modal mid-flow) · **Layer** TBD — QE · **Writes** No
- **Setup:** An unacknowledged important announcement (as NAV-05). U-G signed out.
- **Action:** Open the portal; sign in.
- **Expected:** No pop-up on the sign-in page; the pop-up shows once on the dashboard and does not block "Sign out".

### TC-01-Q2 — A not-linked person never sees the announcement pop-up
**Priority** P2 · **Type** Integration / security · **Layer** TBD — QE · **Writes** No
- **Setup:** As Q1, with U-N.
- **Expected:** No pop-up on the not-linked or invite-code screens.

### TC-01-Q3 — A staff account lands on the staff view; one who is also a homeowner gets the view switch
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** U-S, and U-S linked to Household A.
- **Expected:** Staff landing per REQ-002; the "Treasurer | My household" switch (2B) only for the second. Details are TC-02's; this case proves sign-in routes there and not to the not-linked screen.

### TC-01-Q4 — An invite link's code survives Google sign-in and account creation
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** A REQ-004 invite link `…/join#<code>` for a test household; a new Google user.
- **Action:** Open the link signed out; press "Continue with Google"; complete the popup.
- **Expected:** The confirm-lot screen (REQ-004 4C) opens with the code filled in, without typing it. Repeat with "Create an account" by email.

### TC-01-Q5 — The name typed at sign-up is the one the admin office sees after linking
**Priority** P2 · **Type** Integration / round-trip · **Layer** TBD — QE · **Writes** Yes
- **Setup:** U-NEW signs up as "ZZ Test Newcomer", redeems an invite for Household D.
- **Action:** Admin office (U-S) opens Household D's detail.
- **Expected:** "ZZ Test Newcomer" in "People with portal access", same spelling.

### TC-01-Q6 — A homeowner whose membership is removed while signed in loses the household on the next read
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Setup:** U-G signed in on the dashboard; admin removes U-G from Household A (REQ-004).
- **Action:** U-G opens another screen or reloads.
- **Expected:** The read is refused; U-G sees the not-linked screen; no Household A data appears after the removal.

## Block R — Project settings (go-live checklist) *(provisional: SA-001 §8.4, ADR-005)*

These prove settings, not code. Each runs per Firebase project (staging now; each production project before it takes real users).

### TC-01-R1 — Email enumeration protection is on
**Priority** P1 · **Type** Security / config · **Layer** TBD — QE · **Writes** No
- **Needs:** console access to the project.

### TC-01-R2 — The password policy is Require with a minimum of 8
**Priority** P1 · **Type** Security / config · **Layer** TBD — QE · **Writes** No

### TC-01-R3 — Authorised domains list only that project's own domains
**Priority** P1 · **Type** Security / config · **Layer** TBD — QE · **Writes** No
- **Expected:** No staging or localhost domain on a production project.

### TC-01-R4 — The Google provider is enabled and the verification email is sent at account creation
**Priority** P2 · **Type** Config · **Layer** TBD — QE · **Writes** No

### TC-01-R5 — Reset and verification emails arrive in a test inbox on staging
**Priority** P2 · **Type** Integration (copy promises an email) · **Layer** TBD — QE · **Writes** No
- **Needs:** a real test inbox on the team's domain. Note where they land (inbox or spam); SA-001 Q7 (sending domain) is open.

## Block S — Back-compat

### TC-01-S1 — A role left in browser storage by the mock-up does not choose the role in the real app *(provisional)*
**Priority** P2 · **Type** Back-compat / security · **Layer** TBD — QE · **Writes** No
- **Setup:** On the real app's origin, pre-seed `localStorage` with the mock-up's stored state including `UI.role = "admin"`. Sign in as U-G.
- **Expected:** Household A's homeowner dashboard; no admin screen or menu.
- **Applies only if** the real app is ever served on an origin that hosted the mock-up.

### TC-01-S2 — An account whose password predates the 8-character policy
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
- **Setup:** An emulator or staging account created with a 6-character password before the policy was set to Require.
- **Expected:** Not stated (gap G-13). Record what Firebase and the page show, for the BA.

## Block T — Exploratory charters

### TC-01-T1 — 20 minutes: signing in from links opened inside phone apps
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
- **Charter:** On a real Android phone, open the portal link from Facebook Messenger, Gmail, Viber and SMS. Try "Continue with Google" and email sign-in in each in-app browser. Look for: Google refusing to sign in inside an embedded browser, a popup that never returns, the session landing in the in-app browser instead of Chrome, the invite code lost. Homeowners commonly share links through these apps.

### TC-01-T2 — 15 minutes: one shared family phone, two homeowners
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
- **Charter:** Two household fixtures take turns on one phone: sign in, browse, sign out, switch to Google, use Back, use the app switcher, reopen from the home-screen shortcut. Look for any glimpse of the other household's data or a session that didn't end.

### TC-01-T3 — 15 minutes: slow and flaky network
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
- **Charter:** Throttle to slow 3G and toggle offline mid-request on sign-in, create account, reset and "Send again". Look for stuck "Signing in…", duplicate accounts, lost typing, and errors that don't say what to do.

---

## Requirement gaps for the BA

| # | Gap | Cases affected |
|---|---|---|
| G-1 | **Copy of record is incomplete.** Missing: empty-field and malformed-email errors; "Your name" label and whether name is required, with limits; create-account and reset page headings ("Create an account", "Reset your password"), "Send reset link", "Back to sign in", "Already have an account? Sign in" (all in the mock-up only); "Signed in as {email}" (1G); the hide label for "Show password"; the in-flight label for "Create account" | C5–C7, G6, G9, I4, N2, N9 |
| G-2 | **Name on the Google path.** No name field when signing up with Google. Where does `users/{uid}.name` come from, what if the Google profile has none, and how is the first name for "Welcome back, Maria" chosen? | A2, F8, register |
| G-3 | **Phone.** REQ-001 Data says the phone is written at account creation, but 1F has no phone field. Drop it from REQ-001 or add the field | register |
| G-4 | **Email normalisation.** Are leading/trailing spaces trimmed before sign-in and sign-up? | C8, G8 |
| G-5 | **Disabled or deleted account.** No copy or landing for an account disabled in Firebase, either at sign-in or while signed in | D6 |
| G-6 | **Unverified banner.** Where it shows on each landing; the confirmation after "Send again"; what shows when Firebase rate-limits re-sends; and whether the admin office should see verification status (staff 2-step needs verified email) | F3, F4, register |
| G-7 | **Carrying the email between pages.** Is the typed email carried to "Forgot password?" and from the duplicate-email message to sign-in? | D2, G2 |
| G-8 | **Google popup closed or blocked.** No copy | D4, D5 |
| G-9 | **Announcements for a not-linked account.** Readable or not? (REQ-001 says "no household or staff read"; announcements are neither) | J3 |
| G-10 | **Sign-out across tabs.** Confirm a sign-out in one tab ends the session in the others (expected by QA) | K5 |
| G-11 | **Deep link after sign-in.** Return to the requested page or always the dashboard? | M2 |
| G-12 | **Form-level errors and the password field.** "Placed under the field" does not fit a message about two fields; the mock-up shows it above the form. Confirm placement, and confirm the password stays typed after a wrong-password error (security convention often clears it) | N3, N4 |
| G-13 | **Accounts with passwords shorter than the new policy** (test accounts made before the policy is switched on): what happens at sign-in? | S2 |
| G-14 | **In-app browsers.** Google does not allow its sign-in inside embedded app browsers. What should the page say to a homeowner who opened the link in Messenger? (Ask after T1 confirms it) | T1 |

## Coverage summary

| Block | Scenario | Cases | P1 |
|---|---|---|---|
| A | Sign in with Google (S1) | 3 | 1 |
| B | Sign in with email and password (S2) | 2 | 1 |
| C | Wrong credentials don't reveal accounts (S3) | 8 | 3 |
| D | Firebase and network refusals (S5, states) | 6 | 1 |
| E | Password reset (S4) | 5 | 3 |
| F | Creating an account (S6) | 9 | 4 |
| G | Account-creation validation (S7, S8) | 9 | 4 |
| H | Google takeover of an unverified account (S9) | 3 | 1 |
| I | Signed in, not linked (S10) | 4 | 2 |
| J | Access control (S10, S11) | 7 | 6 |
| K | Signing out (S12) | 5 | 4 |
| L | Staying signed in (S13) | 2 | 0 |
| M | Navigation and routing | 6 | 1 |
| N | Usability and accessibility | 14 | 0 |
| O | Phones (DEF-001) | 5 | 1 |
| P | Double taps and two sessions | 3 | 1 |
| Q | Integration | 6 | 1 |
| R | Project settings *(provisional)* | 5 | 3 |
| S | Back-compat | 2 | 0 |
| T | Exploratory charters | 3 | 0 |
| **Total** | | **107** | **37** |

Every Gherkin scenario S1–S13 has at least one case (Acceptance table). Every mandatory type is covered: negative (C, D, G, J), boundary (C8, E4, F8, G3, G5, G7–G9, A2, L1), usability (N), navigation (M, K2, I2, J2).
