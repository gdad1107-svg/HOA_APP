# Coverage map

One row per scenario, one layer per row (plus at most one `Journey` row per critical flow).
A row with no test file is a **gap**; two rows proving the same thing at different layers is an
**overlap**. Layers: **Unit** (Vitest, Dev), **API** (emulator: rules and functions, QE),
**UI** (Playwright, QE), **Journey**, **Manual**.

The app is still the browser-only mock-up: it has no plain modules to unit-test and no backend,
so only the UI layer exists today. Everything below is UI by necessity, not by choice; each row
marked *(moves down)* belongs at a lower layer once the real app splits logic out of the page.

## Shape

| Layer | Tests | Notes |
|---|---|---|
| Unit | 0 | No modules yet (mock-up is one HTML file) |
| API | 0 | No backend yet |
| UI | 34 scenarios × 2 brands, plus 2 phone cases | `tests/specs/ui/` |

## Scenarios

| Scenario id | Scenario | Type | Layer | Test file::test name | Status |
|---|---|---|---|---|---|
| SMK-owner-nav | Homeowner nav lists the 8 screens in order | navigation | UI | smoke.spec.js::SMK-owner-nav | Automated |
| SMK-owner-* (8) | Each homeowner screen loads with a heading, no page error | happy | UI | smoke.spec.js::SMK-owner-&lt;view&gt; | Automated |
| SMK-admin-nav | Admin nav lists the 11 screens in order | navigation | UI | smoke.spec.js::SMK-admin-nav | Automated |
| SMK-admin-* (11) | Each admin screen loads with a heading, no page error | happy | UI | smoke.spec.js::SMK-admin-&lt;view&gt; | Automated |
| SMK-guard-nav | Guard nav lists the 3 screens in order | navigation | UI | smoke.spec.js::SMK-guard-nav | Automated |
| SMK-guard-* (3) | Each guard screen loads with a heading, no page error | happy | UI | smoke.spec.js::SMK-guard-&lt;view&gt; | Automated |
| NAV-01 | Opens as Homeowner on the dashboard | navigation | UI | navigation.spec.js::NAV-01 | Automated |
| NAV-02 | Role switch lands on that role's dashboard, relabels nav | navigation | UI | navigation.spec.js::NAV-02 | Automated |
| NAV-03 | Exactly one nav item carries aria-current | usability | UI | navigation.spec.js::NAV-03 | Automated |
| NAV-04 | Role and screen survive a reload | navigation | UI | navigation.spec.js::NAV-04 | Automated |
| NAV-05 | Important announcement pop-up on load; acknowledged once, gone for good | happy | UI | navigation.spec.js::NAV-05 | Automated |
| NAV-06 | Escape closes an open modal | usability | UI | navigation.spec.js::NAV-06 | Automated |
| NAV-07 | 375 px: nav behind the menu button; Escape closes it | usability | UI | navigation.spec.js::NAV-07 | **Failing: DEF-001** |
| NAV-08 | 375 px: choosing a screen from the menu navigates and closes it | navigation | UI | navigation.spec.js::NAV-08 | Automated (re-check after DEF-001) |
| VEH-J1 | Register vehicle → admin approves → homeowner sees sticker | happy | Journey | vehicle-registration.spec.js::VEH-J1 | Automated |
| VEH-02 | Rejected registration shows the admin's reason to the homeowner | happy | UI | vehicle-registration.spec.js::VEH-02 | Automated |
| VEH-03 | Pending registration withdrawn leaves the admin queue | happy | UI | vehicle-registration.spec.js::VEH-03 | Automated |
| VEH-04 | Register form refuses empty required fields | negative | UI *(moves down: validation → Unit)* | vehicle-registration.spec.js::VEH-04 | Automated |

## Gaps (no test yet)

Dues and payments (pay by QR → approve → official receipt Journey), amenity booking and its
conflict check, requests and complaints, guest pass → guard check-in Journey, report requests,
collections and notices, accounting, settings and Reset demo data.

## TC-01 Sign in (REQ-001): planned for the real app

Triaged by QE 2026-11-28 from [TC-01 v1.1](TC-01-sign-in-v1.md) (owner-approved). Unlike the rows above, these target the **real app** (Firebase Auth + Firestore on the Emulator Suite), which doesn't exist yet, so nothing is automated and every row is **Planned** or **Blocked** on the gap it names. Reasons, locator contract and automation order are in TC-01's **QE triage** section. Unit files are Dev's, under `web/src/` (paths anticipated from SA-001); API specs live in `tests/specs/api/`, staging specs in `tests/specs/staging/`, UI specs in `tests/specs/ui/`. *(staging)* rows run on `hoa-portal-staging`; *(console)* rows are console reads, and on production only the owner does them.

| Layer | Cases | Share of automated | Blocked |
|---|---|---|---|
| Unit | 21 | 13% | 5 |
| API | 44 (3 on staging) | 28% | 4 |
| UI | 94 | 59% | 5 |
| Manual | 22 (11 staging, 5 console) | — | 2 |
| **Total** | **181** | | **16** |

**Gaps:** none. Every case has a layer and a named test or manual run. **Overlaps:** none; where a case's message is the same copy another layer proves (C1's message is C6's mapping), the UI row asserts only what the browser adds. **Shape:** UI is well above the 10% target; raised with Sol Arch in TC-01's QE triage, with the cases that could move down.

**Effect on the rows above:** when the real app's sign-in gate lands, SMK-\* start from signed-in fixtures, NAV-02 retires, NAV-01 and NAV-04 are re-baselined (NAV-04's meaning moves to TC-01-L2), and VEH-J1 signs both people in. Those rows are left as they are until then.

| Scenario id | Scenario | Type | Layer | Test file::test name | Status |
|---|---|---|---|---|---|
| TC-01-A1 | A linked homeowner signing in with Google lands on her dashboard, greeted by her first name | happy | UI | sign-in.spec.js::TC-01-A1 | Planned |
| TC-01-A2 | After Google sign-in, the header shows the linked lot | happy | UI | sign-in.spec.js::TC-01-A2 | Planned |
| TC-01-A3 | The greeting uses the first word of the stored name | boundary | Unit | greeting.test.js::TC-01-A3 | Planned |
| TC-01-A4 | Google sign-in uses the popup flow, not a redirect | security | Manual *(staging)* | Manual: staging Google session::TC-01-A4 | Planned |
| TC-01-B1 | A linked homeowner signing in with email and password lands on his dashboard | happy | UI | sign-in.spec.js::TC-01-B1 | Planned |
| TC-01-C1 | A wrong password shows the shared message | negative | UI | sign-in.spec.js::TC-01-C1 | Planned |
| TC-01-C2 | After a wrong password the email stays in the field | usability | UI | sign-in.spec.js::TC-01-C2 | Planned |
| TC-01-C3 | An email with no account shows the same message as a wrong password | security | UI | sign-in.spec.js::TC-01-C3 | Planned |
| TC-01-C4 | After an unknown email, the email stays in the field | usability | UI | sign-in.spec.js::TC-01-C4 | Planned |
| TC-01-C5 | The server refuses a wrong password and an unknown email identically | security | API | auth-credentials.spec.js::TC-01-C5 | Planned |
| TC-01-C6 | The page shows the shared message for every credential error code | security | Unit | auth-messages.test.js::TC-01-C6 | Planned |
| TC-01-C7 | An empty email is refused before any request | negative | Unit | auth-controller.test.js::TC-01-C7 | Planned |
| TC-01-C8 | An empty password is refused before any request | negative | Unit | auth-controller.test.js::TC-01-C8 | Planned |
| TC-01-C9 | A malformed email is refused with a field error | negative | Unit | auth-controller.test.js::TC-01-C9 | Planned |
| TC-01-C10 | An email typed with capitals still signs in | boundary | API | auth-credentials.spec.js::TC-01-C10 | Planned |
| TC-01-C11 | An email typed with a trailing space still signs in | boundary | Unit | validate.test.js::TC-01-C11 | Blocked on G-4 |
| TC-01-C12 | A Google-only account using the email form gets the shared message | negative | API | auth-credentials.spec.js::TC-01-C12 | Planned |
| TC-01-C13 | No page decides what to show by asking Firebase which sign-in methods an email has | security | Unit | source-checks.test.js::TC-01-C13 | Planned |
| TC-01-D1 | "Too many attempts" shows its message | negative | Unit | auth-messages.test.js::TC-01-D1 | Planned |
| TC-01-D2 | After "Too many attempts" the email stays in the field | usability | UI | sign-in.spec.js::TC-01-D2 | Planned |
| TC-01-D3 | "Forgot password?" opens the reset page from the error state | navigation | UI | sign-in.spec.js::TC-01-D3 | Planned |
| TC-01-D4 | Signing in while offline shows the offline message | negative | UI | sign-in.spec.js::TC-01-D4 | Planned |
| TC-01-D5 | "Continue with Google" while offline shows the offline message | negative | UI | sign-in.spec.js::TC-01-D5 | Planned |
| TC-01-D6 | After the offline message, the button is ready again and typing is kept | usability | UI | sign-in.spec.js::TC-01-D6 | Planned |
| TC-01-D7 | Creating an account while offline shows an offline message | negative | UI | create-account.spec.js::TC-01-D7 | Blocked on G-15 |
| TC-01-D8 | Asking for a reset link while offline shows an offline message | negative | UI | password-reset.spec.js::TC-01-D8 | Blocked on G-15 |
| TC-01-D9 | Closing the Google popup returns to a usable sign-in page | negative | UI | sign-in.spec.js::TC-01-D9 | Planned |
| TC-01-D10 | A blocked Google popup tells the person how to continue | negative | UI | sign-in.spec.js::TC-01-D10 | Blocked on G-8 |
| TC-01-D11 | A disabled account is refused at sign-in and sees no household data | negative | API | auth-credentials.spec.js::TC-01-D11 | Planned |
| TC-01-D12 | A homeowner disabled while signed in is signed out once the token refreshes | stale reference | UI | sign-in.spec.js::TC-01-D12 | Planned |
| TC-01-E1 | Asking for a reset for an existing email shows the reset message | happy | UI | password-reset.spec.js::TC-01-E1 | Planned |
| TC-01-E2 | Asking for a reset for an existing email creates exactly one reset link | happy | UI | password-reset.spec.js::TC-01-E2 | Planned |
| TC-01-E3 | Asking for a reset for an unknown email shows the same message | security | UI | password-reset.spec.js::TC-01-E3 | Planned |
| TC-01-E4 | Asking for a reset for an unknown email sends nothing | security | API | auth-reset.spec.js::TC-01-E4 | Planned |
| TC-01-E5 | Following the reset link sets a new password that signs in | happy | API | auth-reset.spec.js::TC-01-E5 | Planned |
| TC-01-E6 | After a reset the old password no longer signs in | security | API | auth-reset.spec.js::TC-01-E6 | Planned |
| TC-01-E7 | A password reset ends the account's other signed-in sessions | security | API | auth-reset.spec.js::TC-01-E7 | Planned |
| TC-01-E8 | The reset page refuses a new password under 8 characters | boundary | API *(staging)* | auth-policy.staging.spec.js::TC-01-E8 | Planned |
| TC-01-E9 | "Back to sign in" on the reset page returns to the sign-in page | navigation | UI | password-reset.spec.js::TC-01-E9 | Planned |
| TC-01-E10 | A Google-only account asking for a password reset | negative | API | auth-reset.spec.js::TC-01-E10 | Blocked on G-17 |
| TC-01-F1 | Creating an account sends a verification email | happy | UI | create-account.spec.js::TC-01-F1 | Planned |
| TC-01-F2 | A new account lands on "Enter your invite code" | happy | UI | create-account.spec.js::TC-01-F2 | Planned |
| TC-01-F3 | A new account sees no household data on its landing screen | security | UI | create-account.spec.js::TC-01-F3 | Planned |
| TC-01-F4 | An unverified account sees the verification banner with "Send again" | usability | UI | create-account.spec.js::TC-01-F4 | Planned |
| TC-01-F5 | "Send again" creates a new verification email | happy | UI | create-account.spec.js::TC-01-F5 | Planned |
| TC-01-F6 | The banner is gone once the email is verified | happy | UI | create-account.spec.js::TC-01-F6 | Planned |
| TC-01-F7 | Creating an account creates no membership for the new account | data integrity | API | account-creation.spec.js::TC-01-F7 | Planned |
| TC-01-F8 | The new person record holds the typed name and the account email, and only allowed fields | data integrity | API | account-creation.spec.js::TC-01-F8 | Planned |
| TC-01-F9 | Signing up with capitals in the email stores the account's email, and the write succeeds | data integrity | API | account-creation.spec.js::TC-01-F9 | Planned |
| TC-01-F10 | Signing up with a trailing space in the email stores the account's email | boundary | API | account-creation.spec.js::TC-01-F10 | Blocked on G-4 |
| TC-01-F11 | If the person record can't be written after the account is created, the next sign-in repairs it | data integrity | API | account-creation.spec.js::TC-01-F11 | Planned |
| TC-01-F12 | A Google account with no display name gets a sensible greeting | boundary | Unit | greeting.test.js::TC-01-F12 | Blocked on G-2 (partial) |
| TC-01-F13 | "Continue with Google" on the create-account page lands a new person on invite-code entry | happy | UI | create-account.spec.js::TC-01-F13 | Planned |
| TC-01-F14 | A new Google account arrives verified and shows no verification banner | usability | Manual *(staging)* | Manual: staging Google session::TC-01-F14 | Planned |
| TC-01-G1 | Signing up with an email that already has an account shows the message | negative | UI | create-account.spec.js::TC-01-G1 | Planned |
| TC-01-G2 | After the duplicate-email message, name and email are kept | usability | UI | create-account.spec.js::TC-01-G2 | Planned |
| TC-01-G3 | The duplicate sign-up creates no second account | data integrity | API | auth-credentials.spec.js::TC-01-G3 | Planned |
| TC-01-G4 | "Sign in" from the duplicate-email message opens the sign-in page | navigation | UI | create-account.spec.js::TC-01-G4 | Planned |
| TC-01-G5 | "Reset your password" from the duplicate-email message opens the reset page | navigation | UI | create-account.spec.js::TC-01-G5 | Planned |
| TC-01-G6 | A 7-character password shows "Use at least 8 characters" | boundary | Unit | validate.test.js::TC-01-G6 | Planned |
| TC-01-G7 | After a short password, name and email are kept | usability | UI | create-account.spec.js::TC-01-G7 | Planned |
| TC-01-G8 | A short password in the page creates no account | negative | Unit | auth-controller.test.js::TC-01-G8 | Planned |
| TC-01-G9 | Firebase refuses a 7-character password when the page check is skipped | security | API *(staging)* | auth-policy.staging.spec.js::TC-01-G9 | Planned |
| TC-01-G10 | An 8-character password is accepted | boundary | Unit | validate.test.js::TC-01-G10 | Planned |
| TC-01-G11 | A long passphrase with spaces and non-ASCII characters signs up and signs in | boundary | API | auth-credentials.spec.js::TC-01-G11 | Planned |
| TC-01-G12 | Creating an account with no name is refused with a field error | negative | Unit | validate.test.js::TC-01-G12 | Blocked on G-1 |
| TC-01-G13 | Signing up with an existing email in capitals shows the duplicate message | boundary | API | auth-credentials.spec.js::TC-01-G13 | Planned |
| TC-01-G14 | Signing up with an existing email plus a trailing space shows the duplicate message | boundary | API | auth-credentials.spec.js::TC-01-G14 | Blocked on G-4 |
| TC-01-G15 | A one-character name and a very long name are handled | boundary | Unit | validate.test.js::TC-01-G15 | Blocked on G-1 |
| TC-01-G16 | A name containing markup shows as plain text in the greeting | security | UI | create-account.spec.js::TC-01-G16 | Planned |
| TC-01-H1 | Google sign-in on an unverified Gmail password account signs in with Google | security | Manual *(staging)* | Manual: staging Google session::TC-01-H1 | Planned |
| TC-01-H2 | After the Google takeover, the old password no longer signs in | security | Manual *(staging)* | Manual: staging Google session::TC-01-H2 | Planned |
| TC-01-H3 | After the Google takeover, the account keeps its household | security | Manual *(staging)* | Manual: staging Google session::TC-01-H3 | Planned |
| TC-01-H4 | After the Google takeover, the uid is the same | data integrity | Manual *(staging)* | Manual: staging Google session::TC-01-H4 | Planned |
| TC-01-H5 | A verified Gmail password account signing in with Google stays one account | security | Manual *(staging)* | Manual: staging Google session::TC-01-H5 | Planned |
| TC-01-H6 | Google sign-in on a non-Gmail address that has a password account doesn't sign into it silently | security | Manual *(staging)* | Manual: staging Google session::TC-01-H6 | Blocked on G-16 |
| TC-01-I1 | A signed-in person with no household and no role sees the not-linked message | happy | UI | not-linked.spec.js::TC-01-I1 | Planned |
| TC-01-I2 | The not-linked person sees only invite-code entry and "Sign out" | navigation | UI | not-linked.spec.js::TC-01-I2 | Planned |
| TC-01-I3 | The not-linked screen stays after a reload | navigation | UI | not-linked.spec.js::TC-01-I3 | Planned |
| TC-01-I4 | The not-linked screen shows which account is signed in | usability | UI | not-linked.spec.js::TC-01-I4 | Planned |
| TC-01-I5 | A not-linked person opening a household page address sees no household data | security | UI | not-linked.spec.js::TC-01-I5 | Planned |
| TC-01-J1 | A homeowner opening another household's page sees "You don't have access to this page" | security | UI | auth-routing.spec.js::TC-01-J1 | Planned |
| TC-01-J2 | While on another household's page, no Household B document is read | security | API | rules-access.spec.js::TC-01-J2 | Planned |
| TC-01-J3 | "Go to my dashboard" on the no-access page returns to her own household | navigation | UI | auth-routing.spec.js::TC-01-J3 | Planned |
| TC-01-J4 | A not-linked account may query its own memberships and gets none | security | API | rules-access.spec.js::TC-01-J4 | Planned |
| TC-01-J5 | A not-linked account may read its own staff record and finds none | security | API | rules-access.spec.js::TC-01-J5 | Planned |
| TC-01-J6 | A not-linked account cannot read other people's membership documents | security | API | rules-access.spec.js::TC-01-J6 | Planned |
| TC-01-J7 | A not-linked account cannot read any household or its records | security | API | rules-access.spec.js::TC-01-J7 | Planned |
| TC-01-J8 | A not-linked account cannot read other people's staff records | security | API | rules-access.spec.js::TC-01-J8 | Planned |
| TC-01-J9 | A not-linked account cannot read announcements | security | API | rules-access.spec.js::TC-01-J9 | Planned |
| TC-01-J10 | Signed-out requests are refused | security | API | rules-access.spec.js::TC-01-J10 | Planned |
| TC-01-J11 | A person can create their own person record with the allowed fields | security | API | rules-users.spec.js::TC-01-J11 | Planned |
| TC-01-J12 | Creating one's own person record with an extra field is refused | security | API | rules-users.spec.js::TC-01-J12 | Planned |
| TC-01-J13 | Adding a role field to one's own existing person record is refused | security | API | rules-users.spec.js::TC-01-J13 | Planned |
| TC-01-J14 | Setting a different email than the account's is refused | security | API | rules-users.spec.js::TC-01-J14 | Planned |
| TC-01-J15 | A `createdAt` that isn't the server time is refused | security | API | rules-users.spec.js::TC-01-J15 | Planned |
| TC-01-J16 | A person can read their own person record | security | API | rules-users.spec.js::TC-01-J16 | Planned |
| TC-01-J17 | A person can update their own name and phone | security | API | rules-users.spec.js::TC-01-J17 | Planned |
| TC-01-J18 | A person cannot delete their own person record | security | API | rules-users.spec.js::TC-01-J18 | Planned |
| TC-01-J19 | Nobody signed in as a homeowner can list the people collection | security | API | rules-users.spec.js::TC-01-J19 | Planned |
| TC-01-J20 | A homeowner cannot read another household's person's record | security | API | rules-users.spec.js::TC-01-J20 | Planned |
| TC-01-J21 | A homeowner cannot write another person's record | security | API | rules-users.spec.js::TC-01-J21 | Planned |
| TC-01-J22 | A member of the same household reading your person record | security | API | rules-users.spec.js::TC-01-J22 | Blocked on Sol Arch (SA-001 §8.2) |
| TC-01-J23 | A guard or board account cannot read any person record | security | API | rules-users.spec.js::TC-01-J23 | Planned |
| TC-01-K1 | "Sign out" lands on the sign-in page | happy | UI | sign-out.spec.js::TC-01-K1 | Planned |
| TC-01-K2 | Pressing Back after signing out shows the sign-in page | navigation | UI | sign-out.spec.js::TC-01-K2 | Planned |
| TC-01-K3 | On a phone browser, Back after signing out never shows household data, even briefly | security | UI | sign-out.spec.js::TC-01-K3 | Planned |
| TC-01-K4 | After signing out, no household data is left in browser storage | security | UI | sign-out.spec.js::TC-01-K4 | Planned |
| TC-01-K5 | Firestore uses its memory-only cache | security | UI | sign-out.spec.js::TC-01-K5 | Planned |
| TC-01-K6 | A second homeowner signing in on the same tab, without a reload, never sees the first one's data | security | UI | sign-out.spec.js::TC-01-K6 | Planned |
| TC-01-K7 | The same, with a reload between the two people | security | UI | sign-out.spec.js::TC-01-K7 | Planned |
| TC-01-K8 | Signing out in one tab signs out the other open tab | concurrency | UI | sign-out.spec.js::TC-01-K8 | Planned |
| TC-01-L1 | A homeowner who did not sign out lands on her dashboard the next day | happy | UI | sign-out.spec.js::TC-01-L1 | Planned |
| TC-01-L2 | Reloading any screen keeps the session and the screen | navigation | UI | auth-routing.spec.js::TC-01-L2 | Planned |
| TC-01-M1 | A signed-out person opening any portal address sees the sign-in page and no data | navigation | UI | auth-routing.spec.js::TC-01-M1 | Planned |
| TC-01-M2 | The sign-in heading shows the HOA's name while signed out | usability | UI | auth-routing.spec.js::TC-01-M2 | Planned |
| TC-01-M3 | After signing in from a deep link, the person reaches the page they asked for | navigation | UI | auth-routing.spec.js::TC-01-M3 | Blocked on G-11 |
| TC-01-M4 | Sign-in and create-account link to each other | navigation | UI | auth-routing.spec.js::TC-01-M4 | Planned |
| TC-01-M5 | Sign-in and the reset page link to each other | navigation | UI | auth-routing.spec.js::TC-01-M5 | Planned |
| TC-01-M6 | The browser's Back button moves back through sign-in, create-account and reset | navigation | UI | auth-routing.spec.js::TC-01-M6 | Planned |
| TC-01-M7 | A signed-in homeowner opening the sign-in address goes to the dashboard | navigation | UI | auth-routing.spec.js::TC-01-M7 | Planned |
| TC-01-M8 | A signed-in not-linked person opening the sign-in address goes to the not-linked screen | navigation | UI | not-linked.spec.js::TC-01-M8 | Planned |
| TC-01-M9 | Reloading the sign-in, create-account and reset pages keeps the person there | navigation | UI | auth-routing.spec.js::TC-01-M9 | Planned |
| TC-01-M10 | "Sign out" can be reached at 375 px | navigation | UI | sign-out.spec.js::TC-01-M10 | Planned |
| TC-01-M11 | While the role loads, no staff menu appears and then disappears | usability | UI | auth-routing.spec.js::TC-01-M11 | Planned |
| TC-01-N1 | Every field has a visible label | usability | UI | auth-a11y.spec.js::TC-01-N1 | Planned |
| TC-01-N2 | "Show password" reveals the password and hides it again | usability | UI | auth-a11y.spec.js::TC-01-N2 | Planned |
| TC-01-N3 | The password toggle is labelled in text and announces its state | usability | UI | auth-a11y.spec.js::TC-01-N3 | Planned |
| TC-01-N4 | Errors are announced | usability | UI | auth-a11y.spec.js::TC-01-N4 | Planned |
| TC-01-N5 | Field errors sit under their field | usability | UI | auth-a11y.spec.js::TC-01-N5 | Planned |
| TC-01-N6 | Errors that concern two fields are placed where the BA decides | usability | UI | auth-a11y.spec.js::TC-01-N6 | Blocked on G-12 |
| TC-01-N7 | The password stays typed after a wrong-password error | usability | UI | auth-a11y.spec.js::TC-01-N7 | Planned |
| TC-01-N8 | Every tap target is at least 44 × 44 px | usability | UI | auth-a11y.spec.js::TC-01-N8 | Planned |
| TC-01-N9 | The Google button meets 4.5:1 contrast and says "Continue with Google" in text | usability | UI | auth-a11y.spec.js::TC-01-N9 | Planned |
| TC-01-N10 | Fields carry the autocomplete values password managers need | usability | UI | auth-a11y.spec.js::TC-01-N10 | Planned |
| TC-01-N11 | The email field opens the email keyboard on phones | usability | UI | auth-a11y.spec.js::TC-01-N11 | Planned |
| TC-01-N12 | While signing in, the button reads "Signing in…" and is disabled | usability | UI | auth-a11y.spec.js::TC-01-N12 | Planned |
| TC-01-N13 | Sign-in and account creation work with the keyboard alone | usability | UI | auth-a11y.spec.js::TC-01-N13 | Planned |
| TC-01-N14 | Pasting into the email and password fields is allowed (WCAG 2.2 SC 3.3.8) | usability | UI | auth-a11y.spec.js::TC-01-N14 | Planned |
| TC-01-N15 | The same words are used everywhere | usability | Unit | source-checks.test.js::TC-01-N15 | Planned |
| TC-01-N16 | The sign-in pages use the mock-up's green top bar and card | usability | Manual | Manual: look-and-feel / real phone::TC-01-N16 | Planned |
| TC-01-N17 | The sign-in page reflows at 320 px and at 200 % zoom | usability | UI | auth-a11y.spec.js::TC-01-N17 | Planned |
| TC-01-N18 | After an error or a page change, focus moves to the error or the new heading | usability | UI | auth-a11y.spec.js::TC-01-N18 | Planned |
| TC-01-N19 | Every static string in the copy of record appears as written | usability | UI | auth-a11y.spec.js::TC-01-N19 | Planned |
| TC-01-O1 | On a real phone profile, the sign-in page uses the phone layout | usability | UI | auth-phone.spec.js::TC-01-O1 | Planned |
| TC-01-O2 | No horizontal scroll at 375 px | usability | UI | auth-phone.spec.js::TC-01-O2 | Planned |
| TC-01-O3 | With the keyboard open, the primary button can be reached | usability | Manual | Manual: look-and-feel / real phone::TC-01-O3 | Planned |
| TC-01-O4 | The sign-in page works in landscape on a phone | usability | UI | auth-phone.spec.js::TC-01-O4 | Planned |
| TC-01-O5 | On a desktop the sign-in page shows a single centred card | usability | UI | auth-phone.spec.js::TC-01-O5 | Planned |
| TC-01-P1 | Double-tapping "Sign in" sends exactly one request | concurrency | Unit | auth-controller.test.js::TC-01-P1 | Planned |
| TC-01-P2 | Double-tapping "Create account" creates exactly one account and one person record | concurrency | UI | create-account.spec.js::TC-01-P2 | Planned |
| TC-01-P3 | The same email signed up in two tabs at once creates one account | concurrency | API | auth-credentials.spec.js::TC-01-P3 | Planned |
| TC-01-P4 | Double-tapping "Continue with Google" opens one popup | concurrency | UI | sign-in.spec.js::TC-01-P4 | Planned |
| TC-01-P5 | Double-tapping "Send reset link" sends one request | concurrency | Unit | auth-controller.test.js::TC-01-P5 | Planned |
| TC-01-P6 | Double-tapping "Send again" sends one verification request | concurrency | Unit | auth-controller.test.js::TC-01-P6 | Planned |
| TC-01-Q1 | The important-announcement pop-up does not appear on the sign-in page | integration | UI | auth-integration.spec.js::TC-01-Q1 | Planned |
| TC-01-Q2 | After sign-in the pop-up shows once on the dashboard and doesn't block "Sign out" | integration | UI | auth-integration.spec.js::TC-01-Q2 | Planned |
| TC-01-Q3 | A not-linked person never sees the announcement pop-up | integration | UI | not-linked.spec.js::TC-01-Q3 | Planned |
| TC-01-Q4 | Each staff sub-role lands on the staff view, not the not-linked screen | integration | Unit | landing.test.js::TC-01-Q4 | Planned |
| TC-01-Q5 | A treasurer who is also a homeowner gets the view switch | integration | Unit | landing.test.js::TC-01-Q5 | Planned |
| TC-01-Q6 | A guard account's landing in R1 | integration | Unit | landing.test.js::TC-01-Q6 | Blocked on G-19 |
| TC-01-Q7 | An invite link's code survives Google sign-in | integration | UI | auth-integration.spec.js::TC-01-Q7 | Planned |
| TC-01-Q8 | An invite link's code survives creating an account by email | integration | UI | auth-integration.spec.js::TC-01-Q8 | Planned |
| TC-01-Q9 | The name typed at sign-up is the one the admin office sees | integration | UI | auth-integration.spec.js::TC-01-Q9 | Planned |
| TC-01-Q10 | A name containing markup shows as plain text to the admin office | security | UI | auth-integration.spec.js::TC-01-Q10 | Planned |
| TC-01-Q11 | A homeowner whose membership is removed while signed in loses the household on the next read *(provisional: ADR-004 `exists(members/...)`)* | stale reference | UI | auth-integration.spec.js::TC-01-Q11 | Planned |
| TC-01-R1 | Email enumeration protection is on | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R1 | Planned |
| TC-01-R2 | The password policy is Require with a minimum of 8 | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R2 | Planned |
| TC-01-R3 | Authorised domains list only that project's own domains | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R3 | Planned |
| TC-01-R4 | The Google provider is enabled | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R4 | Planned |
| TC-01-R5 | "One account per email address" is set | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R5 | Planned |
| TC-01-R6 | With App Check enforced, sign-in and the first dashboard read still work | security | Manual *(staging)* | Manual: staging go-live checks::TC-01-R6 | Planned |
| TC-01-R7 | With App Check enforced, a request with no App Check token is refused | security | API *(staging)* | app-check.staging.spec.js::TC-01-R7 | Planned |
| TC-01-R8 | Reset and verification emails arrive in a test inbox on staging | integration | Manual *(staging)* | Manual: staging go-live checks::TC-01-R8 | Planned |
| TC-01-R9 | The emulator seed turns email enumeration protection on | security | API | auth-emulator-seed.spec.js::TC-01-R9 | Planned |
| TC-01-S1 | A role left in browser storage by the mock-up does not choose the role in the real app | back-compat | UI | auth-routing.spec.js::TC-01-S1 | Planned |
| TC-01-S2 | An account whose password predates the 8-character policy | back-compat | Manual *(staging)* | Manual: staging go-live checks::TC-01-S2 | Blocked on G-13 |
| TC-01-T1 | 20 minutes: signing in from links opened inside phone apps | exploratory | Manual | Manual: exploratory charter::TC-01-T1 | Planned |
| TC-01-T2 | 15 minutes: one shared family phone, two homeowners | exploratory | Manual | Manual: exploratory charter::TC-01-T2 | Planned |
| TC-01-T3 | 15 minutes: slow and flaky network | exploratory | Manual | Manual: exploratory charter::TC-01-T3 | Planned |
| TC-01-T4 | 15 minutes: staying signed in on an iPhone over weeks | exploratory | Manual | Manual: exploratory charter::TC-01-T4 | Planned |

## TC-02 Roles and permissions (REQ-002): planned for the real app

Triaged by QE 2026-11-28 from [TC-02 v1](TC-02-roles-and-permissions-v1.md) (owner-approved). Like TC-01's rows, these target the **real app** (Firebase Auth, Firestore, Storage and Functions on the Emulator Suite), which doesn't exist yet, so nothing is automated and every row is **Planned** or **Blocked** on the BA gap it names (gaps are numbered as in TC-02's *Requirement gaps for the BA*). Reasons, the Unit list for Dev, the locator contract and the automation order are in TC-02's **QE triage** section. Unit files are Dev's, under `web/src/app/` and `scripts/set-role/` (paths anticipated from SA-001); API specs live in `tests/specs/api/`, UI specs in `tests/specs/ui/`. No row runs on staging. *(forced refresh)* rows force the token refresh on the emulator. Firestore and Storage rules are proven only by these API rows; SonarQube can't read them.

| Layer | Cases | Share of automated | Blocked |
|---|---|---|---|
| Unit | 19 | 11% | 1 |
| API | 93 | 55% | 28 |
| UI | 56 (2 forced refresh) | 33% | 4 |
| Manual | 4 | — | 0 |
| **Total** | **172** | | **33** |

**Gaps:** none. Every case has a layer and a named test or manual run. **Overlaps:** none by layer. A2, A4, A6 and A8 (Unit, menu model) are contained in A1, A3, A5 and A7 (UI, rendered menu), and D5 may duplicate a TC-04 rules case; both are raised with QA in TC-02's findings. **Shape:** API-heavy, as a rules requirement should be; UI is above the 10% target, mostly menus, the switch and the no-access page.

**Effect on the rows above:** NAV-02 and NAV-04 retire in the real app (replaced by TC-02-F\* and TC-02-L3); `SMK-admin-nav` and `SMK-guard-nav` stay for the mock-up only. Those rows are left as they are until then.

| Scenario id | Scenario | Type | Layer | Test file::test name | Status |
|---|---|---|---|---|---|
| TC-02-A1 | Homeowner sees exactly the R1 homeowner menu | happy | UI | role-menus.spec.js::TC-02-A1 `@smoke` | Planned |
| TC-02-A2 | Homeowner's menu does not show Homeowners | security | Unit | menu.test.js::TC-02-A2 | Planned |
| TC-02-A3 | Admin office staff see the R1 admin menu, without Approvals | happy | UI | role-menus.spec.js::TC-02-A3 `@smoke` | Planned |
| TC-02-A4 | Admin's menu does not show Accounting | security | Unit | menu.test.js::TC-02-A4 | Planned |
| TC-02-A5 | Treasurer sees the R1 treasurer menu | happy | UI | role-menus.spec.js::TC-02-A5 `@smoke` | Planned |
| TC-02-A6 | Treasurer's menu does not show Scan Pass | security | Unit | menu.test.js::TC-02-A6 | Planned |
| TC-02-A7 | Board member sees only Dashboard in R1 | happy | UI | role-menus.spec.js::TC-02-A7 `@smoke` | Planned |
| TC-02-A8 | Board member's menu does not show Homeowners | security | Unit | menu.test.js::TC-02-A8 | Planned |
| TC-02-A9 | A guard-role account sees no household, money or staff pages in R1 | security | Unit | menu.test.js::TC-02-A9 | Planned |
| TC-02-A10 | Menus for unreleased features appear for no role | negative | Unit | menu.test.js::TC-02-A10 | Planned |
| TC-02-A11 | Role names use the same word on every screen | usability | Unit | source-checks.test.js::TC-02-A11 | Blocked on BA gap 7 |
| TC-02-B1 | ZZ Homeowner A1: Read Household A, allowed | security | API | rules-roles.spec.js::TC-02-B1 | Planned |
| TC-02-B2 | ZZ Homeowner A1: Read Household B, refused | security | API | rules-roles.spec.js::TC-02-B2 | Planned |
| TC-02-B3 | ZZ Homeowner A1: List all households (no filter), refused | security | API | rules-roles.spec.js::TC-02-B3 | Planned |
| TC-02-B4 | ZZ Homeowner A1: Read `members` of Household B, refused | security | API | rules-roles.spec.js::TC-02-B4 | Planned |
| TC-02-B5 | ZZ Homeowner A1: Read or list `staff`, refused | security | API | rules-roles.spec.js::TC-02-B5 | Planned |
| TC-02-B6 | ZZ Homeowner A1: Read `auditLog`, refused | security | API | rules-roles.spec.js::TC-02-B6 | Planned |
| TC-02-B7 | ZZ Homeowner A1: Create `staff/{own uid}` with `role: treasurer`, refused | security | API | rules-roles.spec.js::TC-02-B7 | Planned |
| TC-02-B8 | ZZ Homeowner A1: Update `users/{own uid}` adding `role` or `staffRole`, refused | security | API | rules-roles.spec.js::TC-02-B8 | Planned |
| TC-02-B9 | ZZ Homeowner A1: Read announcements, allowed | happy | API | rules-roles.spec.js::TC-02-B9 | Planned |
| TC-02-B10 | ZZ Homeowner A1: Create an announcement, refused | security | API | rules-roles.spec.js::TC-02-B10 | Planned |
| TC-02-B11 | ZZ Homeowner A1: Write settings (any field), refused | security | API | rules-roles.spec.js::TC-02-B11 | Planned |
| TC-02-B12 | ZZ Homeowner A1: Write `householdContacts` of Household A, refused | security | API | rules-roles.spec.js::TC-02-B12 | Planned |
| TC-02-B13 | ZZ Admin S1: List households, allowed | happy | API | rules-roles.spec.js::TC-02-B13 | Planned |
| TC-02-B14 | ZZ Admin S1: Read `householdContacts`, allowed | happy | API | rules-roles.spec.js::TC-02-B14 | Planned |
| TC-02-B15 | ZZ Admin S1: List `staff` (for Settings → Staff), allowed | happy | API | rules-roles.spec.js::TC-02-B15 | Planned |
| TC-02-B16 | ZZ Admin S1: Write `staff/{any uid}`, refused | security | API | rules-roles.spec.js::TC-02-B16 | Planned |
| TC-02-B17 | ZZ Admin S1: Create an `auditLog` entry, refused | security | API | rules-roles.spec.js::TC-02-B17 | Planned |
| TC-02-B18 | ZZ Admin S1: Write a financial setting (dues amount, payment QR details), refused | security | API | rules-roles.spec.js::TC-02-B18 | Planned |
| TC-02-B19 | ZZ Admin S1: Write a non-financial setting, allowed | happy | API | rules-roles.spec.js::TC-02-B19 | Blocked on BA gap 12 |
| TC-02-B20 | ZZ Admin S1: Create an announcement, allowed | happy | API | rules-roles.spec.js::TC-02-B20 | Planned |
| TC-02-B21 | ZZ Admin S1: Update a payment's `status` directly, refused | security | API | rules-roles.spec.js::TC-02-B21 | Blocked on BA gap 10 (payments, bills) |
| TC-02-B22 | ZZ Admin S1: Upload a payment QR image to Storage, refused | security | API | storage-roles.spec.js::TC-02-B22 | Planned |
| TC-02-B23 | ZZ Treasurer T2: List households, allowed | happy | API | rules-roles.spec.js::TC-02-B23 | Planned |
| TC-02-B24 | ZZ Treasurer T2: Write a financial setting, allowed | happy | API | rules-roles.spec.js::TC-02-B24 | Planned |
| TC-02-B25 | ZZ Treasurer T2: Upload a payment QR image to Storage, allowed | happy | API | storage-roles.spec.js::TC-02-B25 | Planned |
| TC-02-B26 | ZZ Treasurer T2: Update a payment's `status` directly, bypassing `decidePayment`, refused | security | API | rules-roles.spec.js::TC-02-B26 | Blocked on BA gap 10 (payments, bills) |
| TC-02-B27 | ZZ Treasurer T2: Write `staff/{own uid}` (e.g. change own role), refused | security | API | rules-roles.spec.js::TC-02-B27 | Planned |
| TC-02-B28 | ZZ Treasurer T2: Write a receipt's number, refused | security | API | rules-roles.spec.js::TC-02-B28 | Blocked on BA gap 10 (payments, bills) |
| TC-02-B29 | ZZ Treasurer T2: Read `auditLog`, allowed | happy | API | rules-roles.spec.js::TC-02-B29 | Planned |
| TC-02-B30 | ZZ Board D1: List households, refused | security | API | rules-roles.spec.js::TC-02-B30 | Planned |
| TC-02-B31 | ZZ Board D1: Read `householdContacts`, refused | security | API | rules-roles.spec.js::TC-02-B31 | Planned |
| TC-02-B32 | ZZ Board D1: Read `auditLog`, allowed | happy | API | rules-roles.spec.js::TC-02-B32 | Planned |
| TC-02-B33 | ZZ Board D1: Create an announcement, refused | security | API | rules-roles.spec.js::TC-02-B33 | Planned |
| TC-02-B34 | ZZ Board D1: Write any setting, refused | security | API | rules-roles.spec.js::TC-02-B34 | Planned |
| TC-02-B35 | ZZ Board D1: Upload to any Storage path, refused | security | API | storage-roles.spec.js::TC-02-B35 | Planned |
| TC-02-B36 | ZZ Board D1: Update a payment's `status` directly, refused | security | API | rules-roles.spec.js::TC-02-B36 | Blocked on BA gap 10 (payments, bills) |
| TC-02-B37 | ZZ Guard G1: Read or list households, refused | security | API | rules-roles.spec.js::TC-02-B37 | Planned |
| TC-02-B38 | ZZ Guard G1: Read bills or payments of any household, refused | security | API | rules-roles.spec.js::TC-02-B38 | Blocked on BA gap 10 (payments, bills) |
| TC-02-B39 | ZZ Guard G1: Read `staff` or `auditLog`, refused | security | API | rules-roles.spec.js::TC-02-B39 | Planned |
| TC-02-B40 | ZZ Guard G1: Create an announcement or write settings, refused | security | API | rules-roles.spec.js::TC-02-B40 | Planned |
| TC-02-B41 | ZZ Guard G1: Read a payment proof in Storage, refused | security | API | storage-roles.spec.js::TC-02-B41 | Blocked on BA gap 10 (payments, bills) |
| TC-02-B42 | ZZ No Role N1: Read any household, bill or payment, refused | security | API | rules-roles.spec.js::TC-02-B42 | Planned |
| TC-02-B43 | ZZ No Role N1: Read `staff`, refused | security | API | rules-roles.spec.js::TC-02-B43 | Planned |
| TC-02-B44 | Stale token: ZZ Admin S1 after removal, token still carries `role: admin`, `staff/{uid}` deleted: List households, refused | security | API | rules-stale-role.spec.js::TC-02-B44 | Planned |
| TC-02-B45 | Stale token: ZZ Treasurer T2 after removal (with T1 still treasurer), claim still `treasurer`: Write a financial setting, refused | security | API | rules-stale-role.spec.js::TC-02-B45 | Planned |
| TC-02-B46 | Claim missing, `staff/{uid}` says `treasurer` (a document without a claim): Write a financial setting, refused | security | API | rules-stale-role.spec.js::TC-02-B46 | Planned |
| TC-02-B47 | Claim `admin`, `staff/{uid}` says `treasurer` (upgrade before token refresh): Write a financial setting, refused | security | API | rules-stale-role.spec.js::TC-02-B47 | Planned |
| TC-02-B48 | Claim `treasurer`, `staff/{uid}` says `admin` (downgrade before token refresh): Write a financial setting, refused | security | API | rules-stale-role.spec.js::TC-02-B48 | Planned |
| TC-02-B49 | ZZ Homeowner A1: Read a payment proof file of Household B in Storage, refused | security | API | storage-roles.spec.js::TC-02-B49 | Blocked on BA gap 10 (payments, bills) |
| TC-02-B50 | Signed out (no auth): Read any R1 collection, including announcements, refused | security | API | rules-roles.spec.js::TC-02-B50 | Planned |
| TC-02-B51 | Claim hand-set to `treasurer` with no `staff` document (the "nobody edits claims by hand" condition): Read `auditLog`, refused | security | API | rules-stale-role.spec.js::TC-02-B51 | Planned |
| TC-02-C1 | A board member's request to approve a pending payment is refused, and the payment still reads "Pending approval" | security | API | callables-roles.spec.js::TC-02-C1 | Blocked on BA gap 10 (payments, bills) |
| TC-02-C2 | Board's decide request on an approved payment is refused and changes nothing | security | API | callables-roles.spec.js::TC-02-C2 | Blocked on BA gap 10 (payments, bills) |
| TC-02-C3 | Board's decide request on a rejected payment is refused and changes nothing | security | API | callables-roles.spec.js::TC-02-C3 | Blocked on BA gap 10 (payments, bills) |
| TC-02-C4 | Board's void request on a receipt is refused | security | API | callables-roles.spec.js::TC-02-C4 | Blocked on BA gap 10 (payments, bills) |
| TC-02-C5 | Board's decide request on a voided payment is refused | security | API | callables-roles.spec.js::TC-02-C5 | Blocked on BA gap 10 (payments, bills) |
| TC-02-C6 | A homeowner cannot approve their own household's payment | security | API | callables-roles.spec.js::TC-02-C6 | Blocked on BA gap 10 (payments, bills) |
| TC-02-C7 | Admin office staff cannot approve a payment in R1 | security | API | callables-roles.spec.js::TC-02-C7 | Blocked on BA gap 10 (payments, bills) |
| TC-02-C8 | A guard cannot approve a payment | security | API | callables-roles.spec.js::TC-02-C8 | Blocked on BA gap 10 (payments, bills) |
| TC-02-C9 | A removed treasurer's stale token cannot approve a payment | security | API | callables-roles.spec.js::TC-02-C9 | Blocked on BA gap 10 (payments, bills) |
| TC-02-C10 | A treasurer can approve a pending payment (control) | happy | API | callables-roles.spec.js::TC-02-C10 | Blocked on BA gap 10 (payments, bills) |
| TC-02-C11 | No client can run `setRole`, whatever its role | security | API | callables-roles.spec.js::TC-02-C11 | Planned |
| TC-02-C12 | A board member cannot call a household-changing function | security | API | callables-roles.spec.js::TC-02-C12 | Planned |
| TC-02-C13 | Homeowner, board and guard cannot create invitations | security | API | callables-roles.spec.js::TC-02-C13 | Planned |
| TC-02-C14 | A refused decision consumes no receipt number | data integrity | API | receipt-counter.exclusive.spec.js::TC-02-C14 | Blocked on BA gap 10 (payments, bills) |
| TC-02-D1 | A homeowner's device cannot read another household's bills | security | API | rules-household-isolation.spec.js::TC-02-D1 | Blocked on BA gap 10 (payments, bills) |
| TC-02-D2 | A query mixing own and another household's id is refused | security | API | rules-household-isolation.spec.js::TC-02-D2 | Blocked on BA gap 10 (payments, bills) |
| TC-02-D3 | A query for bills with no household filter is refused | security | API | rules-household-isolation.spec.js::TC-02-D3 | Blocked on BA gap 10 (payments, bills) |
| TC-02-D4 | A homeowner can read their own household's bills (control) | happy | API | rules-household-isolation.spec.js::TC-02-D4 | Blocked on BA gap 10 (payments, bills) |
| TC-02-D5 | A homeowner removed from a household is refused on their next read | security | API | rules-household-isolation.spec.js::TC-02-D5 | Planned |
| TC-02-D6 | A homeowner's notifications never show staff notifications | security | API | rules-household-isolation.spec.js::TC-02-D6 | Planned |
| TC-02-E1 | The board's R1 dashboard shows the view-only note | usability | UI | board-view.spec.js::TC-02-E1 | Blocked on BA gap 2 |
| TC-02-E2 | The board's R1 dashboard has no control that changes a record | security | UI | board-view.spec.js::TC-02-E2 | Planned |
| TC-02-E3 | (R2) A board member opening Accounting sees collections and expenses | happy | UI | board-view.spec.js::TC-02-E3 | Blocked on BA gap 2 |
| TC-02-E4 | (R2) Accounting has no "Save expense", "Delete" or "Approve" control for the board | security | UI | board-view.spec.js::TC-02-E4 | Blocked on BA gap 2 |
| TC-02-E5 | (R2) A board member's direct request to save an expense is refused | security | API | rules-roles.spec.js::TC-02-E5 | Blocked on BA gap 2 |
| TC-02-E6 | A board member opening the Settings address sees the no-access page | navigation | Unit | route-access.test.js::TC-02-E6 | Planned |
| TC-02-F1 | The top bar shows a "Treasurer" / "My household" switch | happy | UI | dual-role.spec.js::TC-02-F1 `@smoke` | Planned |
| TC-02-F2 | Choosing "My household" shows only Blk 2 Lot 10's homeowner pages | security | UI | dual-role.spec.js::TC-02-F2 | Planned |
| TC-02-F3 | The household view's menu has no staff items | navigation | Unit | menu.test.js::TC-02-F3 | Planned |
| TC-02-F4 | Switching back to "Treasurer" restores the staff menu | navigation | UI | dual-role.spec.js::TC-02-F4 | Planned |
| TC-02-F5 | The switch reports its state with `aria-pressed` | usability | UI | dual-role.spec.js::TC-02-F5 | Planned |
| TC-02-F6 | People with only one kind of access see no switch | negative | Unit | view-switch.test.js::TC-02-F6 | Planned |
| TC-02-F7 | An admin who is also a homeowner sees "Admin" / "My household" | happy | UI | dual-role.spec.js::TC-02-F7 | Planned |
| TC-02-F8 | A board member who is also a homeowner sees "Board" / "My household" | happy | UI | dual-role.spec.js::TC-02-F8 | Planned |
| TC-02-F9 | The household view has no picker for other households | security | UI | dual-role.spec.js::TC-02-F9 | Planned |
| TC-02-F10 | The switch fits the top bar at 375 px | usability | UI | roles-phone.spec.js::TC-02-F10 | Planned |
| TC-02-F11 | After a reload, the dual-role person lands in a defined view, never mixing the two | navigation | UI | dual-role.spec.js::TC-02-F11 | Blocked on BA gap 13 |
| TC-02-F12 | Switching to "My household" doesn't let an announcement pop-up block the switch | integration | UI | dual-role.spec.js::TC-02-F12 | Planned |
| TC-02-G1 | A homeowner opening the Approvals address sees "You don't have access to this page" | navigation | UI | no-access.spec.js::TC-02-G1 `@smoke` | Planned |
| TC-02-G2 | No Approvals data is loaded behind the no-access page | security | UI | no-access.spec.js::TC-02-G2 | Planned |
| TC-02-G3 | "Go to my dashboard" opens the homeowner dashboard | navigation | UI | no-access.spec.js::TC-02-G3 | Planned |
| TC-02-G4 | Back from the no-access page returns to the previous page, not into the staff page | navigation | UI | no-access.spec.js::TC-02-G4 | Planned |
| TC-02-G5 | Refreshing the no-access page keeps it | navigation | UI | no-access.spec.js::TC-02-G5 | Planned |
| TC-02-G6 | Admin office staff opening the Approvals address see the no-access page | navigation | Unit | route-access.test.js::TC-02-G6 | Planned |
| TC-02-G7 | A board member opening the Homeowners address sees the no-access page | navigation | Unit | route-access.test.js::TC-02-G7 | Planned |
| TC-02-G8 | A guard opening the Settings or Homeowners address sees the no-access page | navigation | Unit | route-access.test.js::TC-02-G8 | Planned |
| TC-02-G9 | A treasurer's deep link to Approvals opens Approvals after signing in | navigation | UI | no-access.spec.js::TC-02-G9 | Planned |
| TC-02-G10 | A signed-out visitor opening a staff address sees the sign-in page, not the no-access page | navigation | UI | no-access.spec.js::TC-02-G10 | Planned |
| TC-02-G11 | No staff menu item is highlighted on the no-access page | navigation | UI | no-access.spec.js::TC-02-G11 | Planned |
| TC-02-G12 | The no-access page has a real heading and the copy of record | usability | UI | no-access.spec.js::TC-02-G12 | Planned |
| TC-02-H1 | After a grant, Settings → Staff lists "ZZ Treasurer T1 · Treasurer" | happy | UI | staff-settings.spec.js::TC-02-H1 | Planned |
| TC-02-H2 | The grant writes one `staff` record with who granted it and the request it cites *(provisional)* | data integrity | API | set-role-script.spec.js::TC-02-H2 | Planned |
| TC-02-H3 | The grant writes an activity log entry with ids only | data integrity | API | set-role-script.spec.js::TC-02-H3 | Planned |
| TC-02-H4 | The newly granted treasurer sees the treasurer menu next time, without signing out | happy | UI | role-change-live.spec.js::TC-02-H4 | Planned |
| TC-02-H5 | A grant while the person has the portal open updates their menu without a reload | integration | UI | role-change-live.spec.js::TC-02-H5 | Planned |
| TC-02-H6 | The script refuses a grant with no board request reference | negative | Unit | set-role.test.js::TC-02-H6 | Planned |
| TC-02-H7 | The script prints the target project before writing | usability | Unit | set-role.test.js::TC-02-H7 | Planned |
| TC-02-H8 | Against a `-prod` project id, the script asks for typed confirmation and aborts on anything else | negative | API | set-role-script.spec.js::TC-02-H8 | Planned |
| TC-02-H9 | No service-account key file is in the repository | security | Unit | source-checks.test.js::TC-02-H9 | Planned |
| TC-02-H10 | Running the same grant twice leaves one `staff` record and the same role | data integrity | API | set-role-script.spec.js::TC-02-H10 | Planned |
| TC-02-H11 | Granting a role to an email with no account is refused clearly | negative | API | set-role-script.spec.js::TC-02-H11 | Planned |
| TC-02-H12 | Granting an unknown role is refused | negative | Unit | set-role.test.js::TC-02-H12 | Planned |
| TC-02-H13 | The first treasurer can be created when there is none | boundary | API | set-role-script.spec.js::TC-02-H13 | Planned |
| TC-02-H14 | A person holds one staff role at a time | boundary | API | set-role-script.spec.js::TC-02-H14 | Planned |
| TC-02-H15 | Settings → Staff is read-only and shows the Option B note | usability | UI | staff-settings.spec.js::TC-02-H15 `@smoke` | Planned |
| TC-02-H16 | Settings → Staff carries the heading "Staff and roles" | usability | UI | staff-settings.spec.js::TC-02-H16 | Planned |
| TC-02-H17 | Every `setRole` run alerts the owner *(provisional: SA-001 §8.3, not in REQ-002)* | integration | API | set-role-script.spec.js::TC-02-H17 | Blocked on BA gap 9 |
| TC-02-I1 | After removal, the next staff read from the removed person's device is refused | security | API | role-removal.spec.js::TC-02-I1 | Planned |
| TC-02-I2 | After removal, the next staff write from the removed person's device is refused | security | API | role-removal.spec.js::TC-02-I2 | Planned |
| TC-02-I3 | While online, the open Homeowners page changes to the no-access page within a minute | integration | UI | role-change-live.spec.js::TC-02-I3 | Planned |
| TC-02-I4 | Settings → Staff no longer lists the removed person | integration | UI | staff-settings.spec.js::TC-02-I4 | Planned |
| TC-02-I5 | Removal deletes the `staff` record and logs before and after *(provisional)* | data integrity | API | set-role-script.spec.js::TC-02-I5 | Planned |
| TC-02-I6 | Removal signs the person's device out when its token next refreshes | security | UI *(forced refresh)* | role-change-live.spec.js::TC-02-I6 | Planned |
| TC-02-I7 | A device that was offline at removal is refused on reconnect, and staff data on screen is cleared | security | UI | role-change-live.spec.js::TC-02-I7 | Planned |
| TC-02-I8 | Removal is refused on every device the person is signed in on | concurrency | UI | role-change-live.spec.js::TC-02-I8 | Planned |
| TC-02-I9 | A removed staff member who is also a homeowner keeps household access | security | API | role-removal.spec.js::TC-02-I9 | Blocked on BA gap 4 (partial: the sign-out half) |
| TC-02-I10 | A downgraded treasurer's treasurer actions are refused at once | security | API | role-removal.spec.js::TC-02-I10 | Blocked on BA gap 10 (partial: the settings half runs) |
| TC-02-I11 | After the token refreshes, the downgraded person has the admin menu and admin access | integration | UI | role-change-live.spec.js::TC-02-I11 | Planned |
| TC-02-I12 | A downgrade revokes the person's tokens | security | UI *(forced refresh)* | role-change-live.spec.js::TC-02-I12 | Planned |
| TC-02-I13 | An upgrade (admin → treasurer) does not sign the person out, and treasurer access works after the app refreshes the token | status enumeration | UI | role-change-live.spec.js::TC-02-I13 | Planned |
| TC-02-I14 | A lateral change (admin → board) refuses admin writes at once | status enumeration | API | role-removal.spec.js::TC-02-I14 | Planned |
| TC-02-I15 | A staff action submitted just after removal is refused with a message, not silently | stale reference | UI | role-change-live.spec.js::TC-02-I15 | Planned |
| TC-02-I16 | Re-granting a removed role restores access | happy | API | set-role-script.spec.js::TC-02-I16 | Planned |
| TC-02-J1 | Removing the only treasurer is refused with the copy of record | negative | API | last-treasurer.spec.js::TC-02-J1 | Planned |
| TC-02-J2 | After the refusal, nothing about the treasurer changed | data integrity | API | last-treasurer.spec.js::TC-02-J2 | Planned |
| TC-02-J3 | Downgrading the only treasurer is refused too | negative | API | last-treasurer.spec.js::TC-02-J3 | Blocked on BA gap 3 |
| TC-02-J4 | With two treasurers, removing one is allowed | boundary | API | last-treasurer.spec.js::TC-02-J4 | Planned |
| TC-02-J5 | Two removals at the same moment leave at least one treasurer | concurrency | API | last-treasurer.spec.js::TC-02-J5 | Planned |
| TC-02-J6 | A refused removal records no completed role change | data integrity | API | last-treasurer.spec.js::TC-02-J6 | Planned |
| TC-02-K1 | While roles load, a homeowner sees a skeleton menu, never a staff menu that then disappears | usability | UI | roles-a11y.spec.js::TC-02-K1 | Planned |
| TC-02-K2 | While roles load, a staff member never sees the homeowner or not-linked screen first | usability | UI | roles-a11y.spec.js::TC-02-K2 | Planned |
| TC-02-K3 | The no-access page works at 375 px | usability | UI | roles-phone.spec.js::TC-02-K3 | Planned |
| TC-02-K4 | The role switch works by keyboard | usability | UI | roles-a11y.spec.js::TC-02-K4 | Planned |
| TC-02-K5 | A screen reader announces the switch's group name and pressed state | usability | Manual | Manual: real screen reader (VoiceOver, TalkBack)::TC-02-K5 | Planned |
| TC-02-K6 | Arriving on the no-access page moves focus to its content | usability | UI | no-access.spec.js::TC-02-K6 | Planned |
| TC-02-K7 | At phone width each role's menu is inside the side drawer | usability | UI | roles-phone.spec.js::TC-02-K7 | Planned |
| TC-02-K8 | The switch and the no-access page meet AA contrast | usability | UI | roles-a11y.spec.js::TC-02-K8 | Planned |
| TC-02-K9 | Settings → Staff is readable on a phone | usability | UI | roles-phone.spec.js::TC-02-K9 | Planned |
| TC-02-K10 | A refused staff action tells the person what to do | usability | Unit | access-messages.test.js::TC-02-K10 | Planned |
| TC-02-K11 | The no-access page reflows at 320 px and 200 % zoom | usability | UI | no-access.spec.js::TC-02-K11 | Planned |
| TC-02-L1 | Nobody sees the open "Homeowner \| Admin \| Guard" switch | back-compat | UI | role-menus.spec.js::TC-02-L1 | Planned |
| TC-02-L2 | A homeowner has no "Viewing as" picker | back-compat | UI | role-menus.spec.js::TC-02-L2 | Planned |
| TC-02-L3 | Editing browser storage grants no role | security | UI | role-menus.spec.js::TC-02-L3 | Planned |
| TC-02-L4 | "Reset demo data" exists for no role | back-compat | Unit | source-checks.test.js::TC-02-L4 | Planned |
| TC-02-L5 | The top bar shows the signed-in person's name, not "HOA Treasurer" | back-compat | UI | role-menus.spec.js::TC-02-L5 | Planned |
| TC-02-L6 | Both brand builds show the same role menus | regression | UI | role-menus.spec.js::TC-02-L6 | Planned |
| TC-02-L7 | An existing homeowner who is later made staff keeps their household access | back-compat | UI | role-change-live.spec.js::TC-02-L7 | Planned |
| TC-02-M1 | 30 minutes trying to read or write past the rules as each role | exploratory | Manual | Manual: exploratory charter::TC-02-M1 | Planned |
| TC-02-M2 | 20 minutes changing roles rapidly across two devices | exploratory | Manual | Manual: exploratory charter::TC-02-M2 | Planned |
| TC-02-M3 | 15 minutes as a dual-role person mixing the two views | exploratory | Manual | Manual: exploratory charter::TC-02-M3 | Planned |
