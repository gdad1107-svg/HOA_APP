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
