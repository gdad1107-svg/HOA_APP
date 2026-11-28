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

Triaged by QE 2026-11-28 from [TC-01 v1.1](TC-01-sign-in-v1.md) (owner-approved), and re-triaged the same day for **v1.2** (aligned to REQ-001 r4, owner-approved): 71 new rows, F12 and Q6 moved from Unit to UI, 15 rows unblocked, scenario titles refreshed to v1.2's wording. Development is on hold until the owner closes the client deal; triage wrote no test code. Unlike the rows above, these target the **real app** (Firebase Auth + Firestore on the Emulator Suite), which doesn't exist yet, so nothing is automated and every row is **Planned** or **Blocked** on the gap it names. Reasons, locator contract and automation order are in TC-01's **QE triage** section. Unit files are Dev's, under `web/src/` (paths anticipated from SA-001); API specs live in `tests/specs/api/`, staging specs in `tests/specs/staging/`, UI specs in `tests/specs/ui/`. *(staging)* rows run on `hoa-portal-staging`; *(console)* rows are console reads, and on production only the owner does them.

| Layer | Cases | Share of automated | Blocked |
|---|---|---|---|
| Unit | 47 | 21% | 0 |
| API | 55 (4 on staging) | 24% | 2 (F20, J22) |
| UI | 123 | 55% | 0 |
| Manual | 27 (15 staging, 6 console) | — | 0 |
| **Total** | **252** | | **2** |

**Gaps:** none. Every case has a layer and a named test or manual run. **Overlaps:** none; where a case's message is the same copy another layer proves (C1's message is C6's mapping), the UI row asserts only what the browser adds. J26 is one API row: its rules test fixes how the page counts 80 characters, and G15's unit test reuses that string (not a second row). **Shape:** UI is well above the 10% target; raised with Sol Arch in TC-01's QE triage, with the cases that could move down.

**Effect on the rows above:** when the real app's sign-in gate lands, SMK-\* start from signed-in fixtures, NAV-02 retires, NAV-01 and NAV-04 are re-baselined (NAV-04's meaning moves to TC-01-L2), and VEH-J1 signs both people in. Those rows are left as they are until then.

| Scenario id | Scenario | Type | Layer | Test file::test name | Status |
|---|---|---|---|---|---|
| TC-01-A1 | A linked homeowner signing in with Google lands on her dashboard, greeted by her first name | happy | UI | sign-in.spec.js::TC-01-A1 | Planned |
| TC-01-A2 | After Google sign-in, the header shows the linked lot | happy | UI | sign-in.spec.js::TC-01-A2 | Planned |
| TC-01-A3 | The greeting uses the first word of the stored name | boundary | Unit | greeting.test.js::TC-01-A3 | Planned |
| TC-01-A4 | Google sign-in uses the popup flow, not a redirect | security | Manual *(staging)* | Manual: staging Google session::TC-01-A4 | Planned |
| TC-01-A5 | A one-word name is greeted in full | boundary | Unit | greeting.test.js::TC-01-A5 | Planned |
| TC-01-A6 | A homeowner with no stored name is greeted without a name | boundary | Unit | greeting.test.js::TC-01-A6 | Planned |
| TC-01-A7 | A name starting with an abbreviation greets with it (accepted limitation) | boundary | Unit | greeting.test.js::TC-01-A7 | Planned |
| TC-01-B1 | A linked homeowner signing in with email and password lands on his dashboard | happy | UI | sign-in.spec.js::TC-01-B1 | Planned |
| TC-01-C1 | A wrong password shows the shared message above the form | negative | UI | sign-in.spec.js::TC-01-C1 | Planned |
| TC-01-C2 | After a wrong password the email stays in the field | usability | UI | sign-in.spec.js::TC-01-C2 | Planned |
| TC-01-C3 | An email with no account shows the same message as a wrong password | security | UI | sign-in.spec.js::TC-01-C3 | Planned |
| TC-01-C4 | After an unknown email, the email stays in the field | usability | UI | sign-in.spec.js::TC-01-C4 | Planned |
| TC-01-C5 | The server refuses a wrong password and an unknown email identically | security | API | auth-credentials.spec.js::TC-01-C5 | Planned |
| TC-01-C6 | The page shows the shared message for every credential error code | security | Unit | auth-messages.test.js::TC-01-C6 | Planned |
| TC-01-C7 | An empty email is refused before any request | negative | Unit | auth-controller.test.js::TC-01-C7 | Planned |
| TC-01-C8 | An empty password is refused before any request | negative | Unit | auth-controller.test.js::TC-01-C8 | Planned |
| TC-01-C9 | A malformed email is flagged when the person leaves the field | negative | Unit | auth-controller.test.js::TC-01-C9 | Planned |
| TC-01-C10 | An email typed with capitals still signs in | boundary | API | auth-credentials.spec.js::TC-01-C10 | Planned |
| TC-01-C11 | An email typed with spaces around it still signs in | boundary | Unit | validate.test.js::TC-01-C11 | Planned |
| TC-01-C12 | A Google-only account using the email form gets the shared message | negative | API | auth-credentials.spec.js::TC-01-C12 | Planned |
| TC-01-C13 | No page decides what to show by asking Firebase which sign-in methods an email has | security | Unit | source-checks.test.js::TC-01-C13 | Planned |
| TC-01-C14 | The wrong-password alert's second line points to Google, in the same alert | usability | UI | sign-in.spec.js::TC-01-C14 | Planned |
| TC-01-C15 | A password ending in a space signs in only with the space | boundary | Unit | auth-controller.test.js::TC-01-C15 | Planned |
| TC-01-C16 | An email with a space inside it is refused as malformed | negative | Unit | validate.test.js::TC-01-C16 | Planned |
| TC-01-D1 | "Too many attempts" shows its message | negative | Unit | auth-messages.test.js::TC-01-D1 | Planned |
| TC-01-D2 | After "Too many attempts" the email stays in the field | usability | UI | sign-in.spec.js::TC-01-D2 | Planned |
| TC-01-D3 | "Forgot password?" opens the reset page from the error state | navigation | UI | sign-in.spec.js::TC-01-D3 | Planned |
| TC-01-D4 | Signing in while offline shows the offline message | negative | UI | sign-in.spec.js::TC-01-D4 | Planned |
| TC-01-D5 | "Continue with Google" while offline shows the offline message | negative | UI | sign-in.spec.js::TC-01-D5 | Planned |
| TC-01-D6 | After the offline message, the button is ready again and typing is kept | usability | UI | sign-in.spec.js::TC-01-D6 | Planned |
| TC-01-D7 | Creating an account while offline shows the create-account offline message | negative | UI | create-account.spec.js::TC-01-D7 | Planned |
| TC-01-D8 | Asking for a reset link while offline shows the reset offline message | negative | UI | password-reset.spec.js::TC-01-D8 | Planned |
| TC-01-D9 | Closing the Google window returns to a usable sign-in page within 10 seconds, with no message | negative | UI | sign-in.spec.js::TC-01-D9 | Planned |
| TC-01-D10 | A blocked Google window tells the person how to continue | negative | UI | sign-in.spec.js::TC-01-D10 | Planned |
| TC-01-D11 | A turned-off account is refused at sign-in and sees no household data | negative | API | auth-credentials.spec.js::TC-01-D11 | Planned |
| TC-01-D12 | A homeowner turned off while signed in is signed out on the next open or reload | stale reference | UI | sign-in.spec.js::TC-01-D12 | Planned |
| TC-01-D13 | Google sign-in on a turned-off account is refused with no household data | negative | API | google-account.spec.js::TC-01-D13 | Planned |
| TC-01-D14 | With the portal left open, a turned-off account is signed out within an hour | security | Manual *(staging)* | Manual: staging go-live checks::TC-01-D14 | Planned |
| TC-01-D15 | While the Google window is open, its button reads "Opening Google…" and is disabled | usability | UI | sign-in.spec.js::TC-01-D15 | Planned |
| TC-01-D16 | While the Google window is open, the email form's button is disabled too | concurrency | UI | sign-in.spec.js::TC-01-D16 | Planned |
| TC-01-D17 | Any other Google sign-in failure shows the generic Google message | negative | Unit | auth-messages.test.js::TC-01-D17 | Planned |
| TC-01-D18 | "Continue with Google" while offline on the create-account page shows the create-account offline message | negative | UI | create-account.spec.js::TC-01-D18 | Planned |
| TC-01-D19 | In an app's built-in browser, a notice sits above the Google button | usability | UI | in-app-browser.spec.js::TC-01-D19 | Planned |
| TC-01-D20 | In an app's built-in browser, the Google button stays and email sign-in works | usability | UI | in-app-browser.spec.js::TC-01-D20 | Planned |
| TC-01-D21 | "Copy link" copies the full page address, including an invite code | integration | UI | in-app-browser.spec.js::TC-01-D21 | Planned |
| TC-01-D22 | "Link copied" shows only once the copy has worked | usability | Unit | in-app-browser.test.js::TC-01-D22 | Planned |
| TC-01-D23 | When copying is blocked, the address shows selected with "Press and hold to copy" | usability | UI | in-app-browser.spec.js::TC-01-D23 | Planned |
| TC-01-D24 | In a normal browser, no in-app notice shows | negative | Unit | in-app-browser.test.js::TC-01-D24 | Planned |
| TC-01-E1 | Asking for a reset for an existing email shows the reset message | happy | UI | password-reset.spec.js::TC-01-E1 | Planned |
| TC-01-E2 | Asking for a reset for an existing email creates exactly one reset link | happy | UI | password-reset.spec.js::TC-01-E2 | Planned |
| TC-01-E3 | Asking for a reset for an unknown email shows the same message | security | UI | password-reset.spec.js::TC-01-E3 | Planned |
| TC-01-E4 | Asking for a reset for an unknown email sends nothing | security | API | auth-reset.spec.js::TC-01-E4 | Planned |
| TC-01-E5 | Following the reset link sets a new password that signs in | happy | API | auth-reset.spec.js::TC-01-E5 | Planned |
| TC-01-E6 | After a reset the old password no longer signs in | security | API | auth-reset.spec.js::TC-01-E6 | Planned |
| TC-01-E7 | A password reset ends the account's other signed-in sessions | security | API | auth-reset.spec.js::TC-01-E7 | Planned |
| TC-01-E8 | The reset page refuses a new password under 8 characters | boundary | API *(staging)* | auth-policy.staging.spec.js::TC-01-E8 | Planned |
| TC-01-E9 | "Back to sign in" on the reset page returns to the sign-in page | navigation | UI | password-reset.spec.js::TC-01-E9 | Planned |
| TC-01-E10 | A Google-only account asking for a reset sees the usual message and gets a reset link | negative | API | auth-reset.spec.js::TC-01-E10 | Planned |
| TC-01-E11 | After a reset adds a password to a Google-only account, the password signs in to the same account | security | Manual *(staging)* | Manual: staging Google session::TC-01-E11 | Planned |
| TC-01-E12 | After that reset, Google sign-in still works | security | Manual *(staging)* | Manual: staging Google session::TC-01-E12 | Planned |
| TC-01-E13 | A reset asked with spaces around the email names the email without them | boundary | Unit | auth-controller.test.js::TC-01-E13 | Planned |
| TC-01-E14 | Sending a reset with an empty email is refused under the field | negative | Unit | validate.test.js::TC-01-E14 | Planned |
| TC-01-E15 | Sending a reset with a malformed email is refused under the field | negative | Unit | validate.test.js::TC-01-E15 | Planned |
| TC-01-E16 | While the reset link is being sent, the button reads "Sending…" and is disabled | usability | UI | password-reset.spec.js::TC-01-E16 | Planned |
| TC-01-F1 | Creating an account sends a verification email | happy | UI | create-account.spec.js::TC-01-F1 | Planned |
| TC-01-F2 | A new account lands on "Enter your invite code" | happy | UI | create-account.spec.js::TC-01-F2 | Planned |
| TC-01-F3 | A new account sees no household data on its landing screen | security | UI | create-account.spec.js::TC-01-F3 | Planned |
| TC-01-F4 | An unverified account sees the verification banner under the top bar | usability | UI | create-account.spec.js::TC-01-F4 | Planned |
| TC-01-F5 | "Send again" creates a new verification email | happy | UI | create-account.spec.js::TC-01-F5 | Planned |
| TC-01-F6 | The banner is gone once the email is verified | happy | UI | create-account.spec.js::TC-01-F6 | Planned |
| TC-01-F7 | Creating an account creates no membership for the new account | data integrity | API | account-creation.spec.js::TC-01-F7 | Planned |
| TC-01-F8 | The new person record holds the trimmed typed name, the account email and the creation time, nothing else | data integrity | API | account-creation.spec.js::TC-01-F8 | Planned |
| TC-01-F9 | Signing up with capitals in the email stores the account's email, and the write succeeds | data integrity | API | account-creation.spec.js::TC-01-F9 | Planned |
| TC-01-F10 | Signing up with spaces around the email stores the account's email without them | boundary | API | account-creation.spec.js::TC-01-F10 | Planned |
| TC-01-F11 | If the person record didn't save, "Continue" offline shows the save message within 15 seconds and keeps the code | data integrity | API | account-creation.spec.js::TC-01-F11 | Planned |
| TC-01-F12 | A Google account with no profile name is asked "What's your name?" | boundary | UI | name-page.spec.js::TC-01-F12 | Planned |
| TC-01-F13 | "Continue with Google" on the create-account page lands a new person on invite-code entry | happy | UI | create-account.spec.js::TC-01-F13 | Planned |
| TC-01-F14 | A new Google account arrives verified and shows no verification banner | usability | Manual *(staging)* | Manual: staging Google session::TC-01-F14 | Planned |
| TC-01-F15 | The verification banner never shows on signed-out pages | usability | Unit | shell-state.test.js::TC-01-F15 | Planned |
| TC-01-F16 | The verification banner can't be dismissed | usability | UI | verify-banner.spec.js::TC-01-F16 | Planned |
| TC-01-F17 | "Send again" reads "Sending…", then the banner reads "Sent. Check your inbox." in place | usability | UI | verify-banner.spec.js::TC-01-F17 | Planned |
| TC-01-F18 | When Firebase refuses another verification email, the banner says to wait | negative | Unit | auth-messages.test.js::TC-01-F18 | Planned |
| TC-01-F19 | The banner shows on every signed-in page for an unverified account | usability | UI | verify-banner.spec.js::TC-01-F19 | Planned |
| TC-01-F20 | A missing person record stops the invite code being used up | data integrity | API | account-creation.spec.js::TC-01-F20 | Blocked on REQ-004 (the r4 follow-up is not in REQ-004 r5) |
| TC-01-F21 | Pressing "Continue" again once online creates the record, then checks the code | data integrity | API | account-creation.spec.js::TC-01-F21 | Planned |
| TC-01-F22 | If the portal was closed before the record saved, the next open asks "What's your name?" first | data integrity | Unit | landing.test.js::TC-01-F22 | Planned |
| TC-01-F23 | A Google sign-up whose record is missing is not asked for a name | data integrity | API | google-account.spec.js::TC-01-F23 | Planned |
| TC-01-F24 | Entering a name on "What's your name?" saves it and opens "Enter your invite code" | happy | UI | name-page.spec.js::TC-01-F24 | Planned |
| TC-01-F25 | While saving the name, "Continue" reads "Saving…" and is disabled | usability | UI | name-page.spec.js::TC-01-F25 | Planned |
| TC-01-F26 | If the name doesn't save within 15 seconds, the save message shows and "Continue" works again | negative | Unit | auth-controller.test.js::TC-01-F26 | Planned |
| TC-01-F27 | The name page applies the same name checks as create-account | negative | Unit | validate.test.js::TC-01-F27 | Planned |
| TC-01-F28 | Signing up with Google takes the name from the Google profile | happy | API | google-account.spec.js::TC-01-F28 | Planned |
| TC-01-F29 | A later Google profile name change doesn't overwrite the stored name | data integrity | API | google-account.spec.js::TC-01-F29 | Planned |
| TC-01-F30 | A Google profile name longer than 80 characters is cut to 80, then trimmed | boundary | Unit | person-name.test.js::TC-01-F30 | Planned |
| TC-01-F31 | A Google profile name of only spaces counts as no name | boundary | Unit | person-name.test.js::TC-01-F31 | Planned |
| TC-01-F32 | A name typed with spaces around it is stored without them | boundary | Unit | person-name.test.js::TC-01-F32 | Planned |
| TC-01-F33 | While creating the account, the button reads "Creating account…" and is disabled | usability | UI | create-account.spec.js::TC-01-F33 | Planned |
| TC-01-G1 | Signing up with an email that already has an account shows the message | negative | UI | create-account.spec.js::TC-01-G1 | Planned |
| TC-01-G2 | After the duplicate-email message, name and email are kept | usability | UI | create-account.spec.js::TC-01-G2 | Planned |
| TC-01-G3 | The duplicate sign-up creates no second account | data integrity | API | auth-credentials.spec.js::TC-01-G3 | Planned |
| TC-01-G4 | "Sign in" in the duplicate-email message opens sign-in with the email filled in | navigation | UI | create-account.spec.js::TC-01-G4 | Planned |
| TC-01-G5 | "Reset your password" in the duplicate-email message opens reset with the email filled in | navigation | UI | create-account.spec.js::TC-01-G5 | Planned |
| TC-01-G6 | A 7-character password shows "Use at least 8 characters" | boundary | Unit | validate.test.js::TC-01-G6 | Planned |
| TC-01-G7 | After a short password, name and email are kept | usability | UI | create-account.spec.js::TC-01-G7 | Planned |
| TC-01-G8 | A short password in the page creates no account | negative | Unit | auth-controller.test.js::TC-01-G8 | Planned |
| TC-01-G9 | Firebase refuses a 7-character password when the page check is skipped | security | API *(staging)* | auth-policy.staging.spec.js::TC-01-G9 | Planned |
| TC-01-G10 | An 8-character password is accepted | boundary | Unit | validate.test.js::TC-01-G10 | Planned |
| TC-01-G11 | A long passphrase with spaces and non-ASCII characters signs up and signs in | boundary | API | auth-credentials.spec.js::TC-01-G11 | Planned |
| TC-01-G12 | Creating an account with no name shows "Enter your name" | negative | Unit | validate.test.js::TC-01-G12 | Planned |
| TC-01-G13 | Signing up with an existing email in capitals shows the duplicate message | boundary | API | auth-credentials.spec.js::TC-01-G13 | Planned |
| TC-01-G14 | Signing up with an existing email plus spaces around it shows the duplicate message | boundary | API | auth-credentials.spec.js::TC-01-G14 | Planned |
| TC-01-G15 | A name of 80 characters is accepted; 81 shows "Use 80 characters or fewer" | boundary | Unit | validate.test.js::TC-01-G15 | Planned |
| TC-01-G16 | A name containing markup shows as plain text in the greeting | security | UI | create-account.spec.js::TC-01-G16 | Planned |
| TC-01-G17 | An 80-character name doesn't break the greeting or header at 375 px | responsive | UI | auth-phone.spec.js::TC-01-G17 | Planned |
| TC-01-G18 | A malformed email on the create-account page is flagged when the person leaves the field | negative | Unit | validate.test.js::TC-01-G18 | Planned |
| TC-01-G19 | A name of only spaces shows "Enter your name" | boundary | Unit | validate.test.js::TC-01-G19 | Planned |
| TC-01-G20 | Creating an account with no password shows "Use at least 8 characters" | negative | Unit | validate.test.js::TC-01-G20 | Planned |
| TC-01-G21 | A one-character name is accepted | boundary | Unit | validate.test.js::TC-01-G21 | Planned |
| TC-01-H1 | Google sign-in on an unverified Gmail password account signs in with Google | security | Manual *(staging)* | Manual: staging Google session::TC-01-H1 | Planned |
| TC-01-H2 | After the Google takeover, the old password no longer signs in | security | Manual *(staging)* | Manual: staging Google session::TC-01-H2 | Planned |
| TC-01-H3 | After the Google takeover, the account keeps its household | security | Manual *(staging)* | Manual: staging Google session::TC-01-H3 | Planned |
| TC-01-H4 | After the Google takeover, the uid is the same | data integrity | Manual *(staging)* | Manual: staging Google session::TC-01-H4 | Planned |
| TC-01-H5 | A verified Gmail password account signing in with Google lands on its own household as one account | security | Manual *(staging)* | Manual: staging Google session::TC-01-H5 | Planned |
| TC-01-H6 | Google sign-in on a non-Gmail address that has a password account doesn't sign in or create a second account | security | Manual *(staging)* | Manual: staging Google session::TC-01-H6 | Planned |
| TC-01-H7 | That refusal says the email has a password and fills it in on the sign-in form | usability | Unit | auth-messages.test.js::TC-01-H7 | Planned |
| TC-01-H8 | If Firebase refuses without saying why, the generic Google message shows and still no second account | negative | Unit | auth-messages.test.js::TC-01-H8 | Planned |
| TC-01-I1 | A signed-in person with no household and no role lands on "Enter your invite code" with the not-linked line | happy | UI | not-linked.spec.js::TC-01-I1 | Planned |
| TC-01-I2 | The not-linked person sees only the code field, "Continue" and "Sign out" | navigation | UI | not-linked.spec.js::TC-01-I2 | Planned |
| TC-01-I3 | "Enter your invite code" stays after a reload | navigation | UI | not-linked.spec.js::TC-01-I3 | Planned |
| TC-01-I4 | The invite-code page shows "Signed in as {email}" under the form | usability | UI | not-linked.spec.js::TC-01-I4 | Planned |
| TC-01-I5 | A not-linked person opening a household page address lands on "Enter your invite code" and sees no household data | security | UI | not-linked.spec.js::TC-01-I5 | Planned |
| TC-01-I6 | The next day, a not-linked person still lands on "Enter your invite code" | navigation | UI | not-linked.spec.js::TC-01-I6 | Planned |
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
| TC-01-J17 | A person cannot update their own person record in R1 | security | API | rules-users.spec.js::TC-01-J17 | Planned |
| TC-01-J18 | A person cannot delete their own person record | security | API | rules-users.spec.js::TC-01-J18 | Planned |
| TC-01-J19 | Nobody signed in as a homeowner can list the people collection | security | API | rules-users.spec.js::TC-01-J19 | Planned |
| TC-01-J20 | A homeowner cannot read another household's person's record | security | API | rules-users.spec.js::TC-01-J20 | Planned |
| TC-01-J21 | A homeowner cannot write another person's record | security | API | rules-users.spec.js::TC-01-J21 | Planned |
| TC-01-J22 | A member of the same household reading your person record | security | API | rules-users.spec.js::TC-01-J22 | Blocked on Sol Arch (SA-001 §8.2) |
| TC-01-J23 | A guard or board account cannot read any person record | security | API | rules-users.spec.js::TC-01-J23 | Planned |
| TC-01-J24 | The rules refuse a name with spaces around it | security | API | rules-users.spec.js::TC-01-J24 | Planned |
| TC-01-J25 | The rules accept a name of 1 to 80 characters and refuse empty or 81 | boundary | API | rules-users.spec.js::TC-01-J25 | Planned |
| TC-01-J26 | The page and the rules count "ñ" and an emoji the same way at the 80 limit | boundary | API | rules-users.spec.js::TC-01-J26 | Planned |
| TC-01-J27 | A guard-only account cannot read household data or anyone else's staff record | security | API | rules-access.spec.js::TC-01-J27 | Planned |
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
| TC-01-M3 | After signing in from a deep link, the person lands on the page they asked for | navigation | UI | auth-routing.spec.js::TC-01-M3 | Planned |
| TC-01-M4 | Sign-in and create-account link to each other | navigation | UI | auth-routing.spec.js::TC-01-M4 | Planned |
| TC-01-M5 | Sign-in and the reset page link to each other | navigation | UI | auth-routing.spec.js::TC-01-M5 | Planned |
| TC-01-M6 | The browser's Back button moves back through sign-in, create-account and reset | navigation | UI | auth-routing.spec.js::TC-01-M6 | Planned |
| TC-01-M7 | A signed-in homeowner opening the sign-in address goes to the dashboard | navigation | UI | auth-routing.spec.js::TC-01-M7 | Planned |
| TC-01-M8 | A signed-in not-linked person opening the sign-in address goes to the not-linked screen | navigation | UI | not-linked.spec.js::TC-01-M8 | Planned |
| TC-01-M9 | Reloading the sign-in, create-account and reset pages keeps the person there | navigation | UI | auth-routing.spec.js::TC-01-M9 | Planned |
| TC-01-M10 | "Sign out" can be reached at 375 px | navigation | UI | sign-out.spec.js::TC-01-M10 | Planned |
| TC-01-M11 | While the role loads, no staff menu appears and then disappears | usability | UI | auth-routing.spec.js::TC-01-M11 | Planned |
| TC-01-M12 | Signing in from a link to another household's page shows "You don't have access to this page" | security | UI | auth-routing.spec.js::TC-01-M12 | Planned |
| TC-01-M13 | A return address added to the sign-in address is ignored | security | UI | auth-routing.spec.js::TC-01-M13 | Planned |
| TC-01-M14 | The portal never puts a return address in the page address | security | UI | auth-routing.spec.js::TC-01-M14 | Planned |
| TC-01-M15 | A not-linked person who signs in from a dashboard link lands on "Enter your invite code" | navigation | UI | not-linked.spec.js::TC-01-M15 | Planned |
| TC-01-M16 | The typed email goes from sign-in to the reset page, where it can be edited | navigation | UI | auth-routing.spec.js::TC-01-M16 | Planned |
| TC-01-M17 | "Back to sign in" carries the email now on the reset page | navigation | UI | auth-routing.spec.js::TC-01-M17 | Planned |
| TC-01-M18 | The password is never carried between pages | security | UI | auth-routing.spec.js::TC-01-M18 | Planned |
| TC-01-M19 | A carried email never appears in the address bar or saved storage | security | UI | auth-routing.spec.js::TC-01-M19 | Planned |
| TC-01-M20 | The asked-for page survives "Continue with Google" | navigation | UI | auth-routing.spec.js::TC-01-M20 | Planned |
| TC-01-N1 | Every field has a visible label | usability | UI | auth-a11y.spec.js::TC-01-N1 | Planned |
| TC-01-N2 | "Show password" reveals the password and reads "Hide password" while it shows | usability | UI | auth-a11y.spec.js::TC-01-N2 | Planned |
| TC-01-N3 | The password toggle is labelled in text and announces its state | usability | UI | auth-a11y.spec.js::TC-01-N3 | Planned |
| TC-01-N4 | Errors are announced | usability | UI | auth-a11y.spec.js::TC-01-N4 | Planned |
| TC-01-N5 | Field errors sit under their field, which is marked invalid and linked to the message | usability | UI | auth-a11y.spec.js::TC-01-N5 | Planned |
| TC-01-N6 | Errors about the whole form sit above it, inside the card, and focus stays put | usability | UI | auth-a11y.spec.js::TC-01-N6 | Planned |
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
| TC-01-N20 | After a failed submit, focus goes to the first field with an error | usability | UI | auth-a11y.spec.js::TC-01-N20 | Planned |
| TC-01-N21 | Tabbing past an empty field shows no error until submit | usability | Unit | validate.test.js::TC-01-N21 | Planned |
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
| TC-01-P7 | Double-tapping "Continue" on "What's your name?" saves once | concurrency | Unit | auth-controller.test.js::TC-01-P7 | Planned |
| TC-01-Q1 | The important-announcement pop-up does not appear on the sign-in page | integration | UI | auth-integration.spec.js::TC-01-Q1 | Planned |
| TC-01-Q2 | After sign-in the pop-up shows once on the dashboard and doesn't block "Sign out" | integration | UI | auth-integration.spec.js::TC-01-Q2 | Planned |
| TC-01-Q3 | A not-linked person never sees the announcement pop-up | integration | UI | not-linked.spec.js::TC-01-Q3 | Planned |
| TC-01-Q4 | Each staff sub-role lands on the staff view, not the not-linked screen | integration | Unit | landing.test.js::TC-01-Q4 | Planned |
| TC-01-Q5 | A treasurer who is also a homeowner gets the view switch | integration | Unit | landing.test.js::TC-01-Q5 | Planned |
| TC-01-Q6 | A guard-only account in R1 lands on the guard holding page | integration | UI | auth-routing.spec.js::TC-01-Q6 | Planned |
| TC-01-Q7 | An invite link's code survives Google sign-in | integration | UI | auth-integration.spec.js::TC-01-Q7 | Planned |
| TC-01-Q8 | An invite link's code survives creating an account by email | integration | UI | auth-integration.spec.js::TC-01-Q8 | Planned |
| TC-01-Q9 | The name typed at sign-up is the one the admin office sees | integration | UI | auth-integration.spec.js::TC-01-Q9 | Planned |
| TC-01-Q10 | A name containing markup shows as plain text to the admin office | security | UI | auth-integration.spec.js::TC-01-Q10 | Planned |
| TC-01-Q11 | A homeowner whose membership is removed while signed in loses the household on the next read *(provisional: ADR-004 `exists(members/...)`)* | stale reference | UI | auth-integration.spec.js::TC-01-Q11 | Planned |
| TC-01-Q13 | A guard who is also linked to a household lands on that household's dashboard with no gate menu | integration | Unit | landing.test.js::TC-01-Q13 | Planned |
| TC-01-R1 | Email enumeration protection is on | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R1 | Planned |
| TC-01-R2 | The password policy is Require, with force upgrade on sign-in, minimum 8 | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R2 | Planned |
| TC-01-R3 | Authorised domains list only that project's own domains | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R3 | Planned |
| TC-01-R4 | The Google provider is enabled | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R4 | Planned |
| TC-01-R5 | "One account per email address" is set | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R5 | Planned |
| TC-01-R6 | With App Check enforced, sign-in and the first dashboard read still work | security | Manual *(staging)* | Manual: staging go-live checks::TC-01-R6 | Planned |
| TC-01-R7 | With App Check enforced, a request with no App Check token is refused | security | API *(staging)* | app-check.staging.spec.js::TC-01-R7 | Planned |
| TC-01-R8 | Reset and verification emails arrive in a test inbox on staging | integration | Manual *(staging)* | Manual: staging go-live checks::TC-01-R8 | Planned |
| TC-01-R9 | The emulator seed turns email enumeration protection on | security | API | auth-emulator-seed.spec.js::TC-01-R9 | Planned |
| TC-01-R10 | The guard role is turned off on production until the gate release | security | Manual *(console)* | Manual: console checklist (owner read-only on production)::TC-01-R10 | Planned |
| TC-01-S1 | A role left in browser storage by the mock-up does not choose the role in the real app | back-compat | UI | auth-routing.spec.js::TC-01-S1 | Planned |
| TC-01-S2 | A password set before the 8-character policy is refused with the reset message | back-compat | Manual *(staging)* | Manual: staging go-live checks::TC-01-S2 | Planned |
| TC-01-S3 | "Reset your password" in that message opens the reset page with the email filled in | navigation | Manual *(staging)* | Manual: staging go-live checks::TC-01-S3 | Planned |
| TC-01-S4 | On the same project, a wrong password of 8 or more characters still gets the shared message | negative | API *(staging)* | auth-policy.staging.spec.js::TC-01-S4 | Planned |
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

## TC-04 Invite and link (REQ-004): planned for the real app

Triaged by QE 2026-11-28 from [TC-04 v1](TC-04-invite-and-link-v1.md) (owner-approved, `e0cb23d`), and refreshed before merging for SA-001 r3 (Final) and TC-03. Like TC-01's rows, these target the **real app** (Firebase Auth, Firestore and Functions on the Emulator Suite), which doesn't exist yet. Nothing is automated. Each row is:

- **Planned**;
- **Deferred: Step 2**, waiting for the email provider, which the owner hasn't picked yet (ADR-002);
- or **Blocked** on the gap or decision it names. A Gap-blocked row keeps its layer but isn't automated until the BA answers the gap.

*provisional* marks a row whose case QA wrote against the Draft SA-001. SA-001 r3 is now Final, and a spot check found no layer change; the flag stays until QA re-checks the case against r3. Email is asserted at the `mail` queue, never as delivered mail.

Reasons, the Unit list for Dev, the locator contract and the automation order are in TC-04's **QE triage** section. Unit files are Dev's, under `shared/domain/`, `web/src/features/invites/` and `functions/src/mail/` (paths anticipated from SA-001 §9). API specs live in `tests/specs/api/`, the staging spec in `tests/specs/staging/`, and UI specs in `tests/specs/ui/`.

| Layer | Cases | Share of automated | Blocked | Deferred: Step 2 |
|---|---|---|---|---|
| Unit | 40 | 17% | 11 | 3 |
| API | 121 (1 on staging) | 52% | 30 | 26 |
| UI | 70 (3 `mobile`) | 30% | 11 | 15 |
| Journey | 1 | <1% | 0 | 0 |
| Manual | 7 (1 staging) | — | 0 | 1 |
| **Total** | **239** | | **52** | **45** |

142 rows are runnable once the app exists; 9 of them have a Step 2 half that waits. 68 rows are *provisional*.

**Gaps:** none. Every case has a layer and a named test or manual run.

**Overlaps:** two, both at API, with TC-02 rows that have since merged:

- TC-04-K2 with TC-02-D5 (a removed member refused at once);
- TC-04-M2 with TC-02-C13 (non-staff can't create invitations).

The proposal is that TC-04 keeps both tests and the TC-02 rows become cross-references once QA agrees (TC-04 finding 10).

**Smoke additions** (new rows, not TC-04 cases), reconciled with TC-03. TC-03's smoke already loads the directory for admin and treasurer, so SMK-admin-homeowners-portal checks only the pills and the two actions. Item 1 is TC-04-P1 tagged `@smoke` in its own spec (its row is under **Cases**), so it has no row here.

| Scenario id | Scenario | Type | Layer | Test file::test name | Status |
|---|---|---|---|---|---|
| SMK-join-link | `/join#{fixture code}` opens the confirm screen (Yes never pressed) | happy | UI | smoke.spec.js::SMK-join-link | Deferred: Step 2 (the `/join` link) |
| SMK-admin-household-detail | Household detail (4E) opens for admin office staff with People and Invitations | happy | UI | smoke.spec.js::SMK-admin-household-detail | Planned |
| SMK-treasurer-household-detail | Household detail (4E) opens for the treasurer with People and Invitations | happy | UI | smoke.spec.js::SMK-treasurer-household-detail | Planned |
| SMK-admin-homeowners-portal | On the directory TC-03's smoke loads: a link-status pill on every row, plus "Invite selected" and "Print invite slips" | happy | UI | smoke.spec.js::SMK-admin-homeowners-portal | Planned |

**Cases**

| Scenario id | Scenario | Type | Layer | Test file::test name | Status |
|---|---|---|---|---|---|
| TC-04-A1 | A second Invite for a household and recipient with an active invitation makes no new code | negative | API | invites-create.spec.js::TC-04-A1 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-A2 | A household with an active invitation offers "Resend invitation", not "Invite" | usability | Unit | shared/domain/linkStatus.test.js::TC-04-A2 | Deferred: Step 2 (email provider) |
| TC-04-A3 | A household whose only invitation expired can be invited again | negative | API | invites-create.spec.js::TC-04-A3 | Blocked on G-1 |
| TC-04-A4 | Resend is refused for a used invitation, and the member stays linked | negative | API | invites-create.spec.js::TC-04-A4 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-A5 | Cancelling an active invitation makes its code invalid | happy | API | invites-cancel.spec.js::TC-04-A5 | Blocked on G-5 · *provisional* |
| TC-04-A6 | Cancelling a used invitation is refused and the member stays linked | negative | API | invites-cancel.spec.js::TC-04-A6 | Planned · *provisional* |
| TC-04-A7 | Cancelling an already replaced, cancelled or expired invitation changes nothing | negative | API | invites-cancel.spec.js::TC-04-A7 | Planned · *provisional* |
| TC-04-A8 | When a used invitation's expiry date passes, the member stays linked | boundary | API | invites-redeem.spec.js::TC-04-A8 | Planned |
| TC-04-A9 | Stored invitation status only ever holds active, used, replaced or cancelled | data integrity | API | invites-integrity.spec.js::TC-04-A9 | Planned · *provisional* |
| TC-04-B1 | Generated codes are 8 characters from the 32-character alphabet, shown as XXXX-XXXX | data integrity | Unit | shared/domain/inviteCode.test.js::TC-04-B1 | Planned |
| TC-04-B2 | 1,000 generated codes are all different | data integrity | Unit | shared/domain/inviteCode.test.js::TC-04-B2 | Planned |
| TC-04-B3 | No invitation document holds the plain code | security | API | invites-secrecy.spec.js::TC-04-B3 | Planned · *provisional* |
| TC-04-B4 | The invitation id is a keyed hash, not a plain hash of the code | security | API | invites-secrecy.spec.js::TC-04-B4 | Planned · *provisional* |
| TC-04-B5 | The email's code and body are removed from the mail document once it is sent | security | API | mail-queue.spec.js::TC-04-B5 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-B6 | The email's code and body are removed from the mail document when hand-off fails | security | API | mail-queue.spec.js::TC-04-B6 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-B7 | Invitation audit entries hold ids only | security | API | invites-audit-logs.spec.js::TC-04-B7 | Planned · *provisional* |
| TC-04-B8 | Function logs contain no code and no email address | security | API | invites-audit-logs.spec.js::TC-04-B8 | Planned · *provisional* |
| TC-04-B9 | The email link carries the code after `#`, never in the path or query | security | UI | join-deep-link.spec.js::TC-04-B9 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-B10 | Printing stores no slip PDF on the server | security | UI | print-slips.spec.js::TC-04-B10 | Planned · *provisional* |
| TC-04-B11 | Staff cannot see an existing code again after it is made | security | API | invites-secrecy.spec.js::TC-04-B11 | Planned |
| TC-04-C1 | A printed code typed in lower case with a space opens the confirm screen | happy | UI | join-code-entry.spec.js::TC-04-C1 | Planned |
| TC-04-C2 | The code is accepted in its printed form with the hyphen | boundary | Unit | shared/domain/inviteCode.test.js::TC-04-C2 | Planned |
| TC-04-C3 | The code is accepted with no separator | boundary | Unit | shared/domain/inviteCode.test.js::TC-04-C3 | Planned |
| TC-04-C4 | Leading, trailing and mixed spaces and hyphens are ignored | boundary | Unit | shared/domain/inviteCode.test.js::TC-04-C4 | Planned |
| TC-04-C5 | "Yes, link my account" lands the person on the lot's dashboard | happy | UI | join-code-entry.spec.js::TC-04-C5 | Planned |
| TC-04-C6 | Redeeming marks the invitation used and creates one membership with the invite's details | integration | API | invites-redeem.spec.js::TC-04-C6 | Planned · *provisional* |
| TC-04-C7 | After a redeem, staff see "Linked · 1 person" | integration | Journey | invite-link.journey.spec.js::TC-04-C7 | Planned |
| TC-04-C8 | Checking a code returns only the lot and the owner name on file | security | API | invites-secrecy.spec.js::TC-04-C8 | Planned · *provisional* |
| TC-04-C9 | The confirm screen shows the lot and the owner on file, nothing else | usability | UI | join-code-entry.spec.js::TC-04-C9 | Planned |
| TC-04-C10 | "No, this isn't my lot" ends the join flow with the contact-office message | negative | UI | join-code-entry.spec.js::TC-04-C10 | Planned |
| TC-04-C11 | After "No, this isn't my lot" the code is still unused and works for the right person | integration | UI | join-code-entry.spec.js::TC-04-C11 | Planned |
| TC-04-C12 | A code that doesn't exist shows the "doesn't match" message | negative | UI | join-code-entry.spec.js::TC-04-C12 | Planned |
| TC-04-C13 | Submitting an empty code field does not call the server | negative | Unit | web/src/features/invites/join-controller.test.js::TC-04-C13 | Blocked on G-22 |
| TC-04-C14 | A malformed code (wrong length or letters O, I, 0, 1) is refused clearly | negative | Unit | shared/domain/inviteCode.test.js::TC-04-C14 | Blocked on G-22 |
| TC-04-C15 | The confirm screen shows the owner name on file at the time of the check | integration | API | invites-redeem.spec.js::TC-04-C15 | Planned |
| TC-04-D1 | The 5th wrong code in 15 minutes is still checked and shows "doesn't match" | boundary | Unit | shared/domain/inviteAttempts.test.js::TC-04-D1 | Planned |
| TC-04-D2 | The 6th attempt in the window shows "Too many wrong codes. Try again in 15 minutes." | boundary | Unit | shared/domain/inviteAttempts.test.js::TC-04-D2 | Planned |
| TC-04-D3 | A right code entered while locked is not checked and reveals nothing | security | API | invites-attempts.spec.js::TC-04-D3 | Planned · *provisional* |
| TC-04-D4 | 14:59 after the first refused code the account is still locked | boundary | Unit | shared/domain/inviteAttempts.test.js::TC-04-D4 | Planned |
| TC-04-D5 | 15 minutes after the first refused code the account can try again | boundary | Unit | shared/domain/inviteAttempts.test.js::TC-04-D5 | Planned |
| TC-04-D6 | Attempts refused while locked don't extend the lock | boundary | Unit | shared/domain/inviteAttempts.test.js::TC-04-D6 | Blocked on G-23 |
| TC-04-D7 | Expired codes don't count towards the limit | negative | Unit | shared/domain/inviteAttempts.test.js::TC-04-D7 | Planned |
| TC-04-D8 | Already-used codes don't count towards the limit | negative | Unit | shared/domain/inviteAttempts.test.js::TC-04-D8 | Planned |
| TC-04-D9 | Replaced, cancelled, deactivated-household and already-linked refusals don't count | negative | Unit | shared/domain/inviteAttempts.test.js::TC-04-D9 | Planned |
| TC-04-D10 | Non-counting refusals in between don't reset or skip the count | boundary | Unit | shared/domain/inviteAttempts.test.js::TC-04-D10 | Planned |
| TC-04-D11 | Another account is not locked when one account is | security | API | invites-attempts.spec.js::TC-04-D11 | Planned |
| TC-04-D12 | The lock follows the account across sign-out and a second device | security | API | invites-attempts.spec.js::TC-04-D12 | Planned |
| TC-04-D13 | Wrong codes sent straight to redeemInvite count and lock the same way | security | API | invites-attempts.spec.js::TC-04-D13 | Planned · *provisional* |
| TC-04-D14 | Wrong codes spread over more than 15 minutes don't lock | boundary | Unit | shared/domain/inviteAttempts.test.js::TC-04-D14 | Planned · *provisional* |
| TC-04-D15 | Whether a successful link resets the wrong-code count | boundary | Unit | shared/domain/inviteAttempts.test.js::TC-04-D15 | Blocked on G-23 |
| TC-04-D16 | A spike of wrong codes across the project raises the alert | security | Manual *(staging)* | Manual: staging go-live checks::TC-04-D16 | Planned · *provisional* |
| TC-04-D17 | Pressing "No, this isn't my lot" doesn't count as a wrong code | negative | UI | join-code-entry.spec.js::TC-04-D17 | Planned |
| TC-04-E1 | An emailed invitation made Nov 28 shows "Invited · expires Dec 5, 2026" | happy | UI | invite-directory.spec.js::TC-04-E1 | Deferred: Step 2 (email provider) |
| TC-04-E2 | A slip printed Nov 28 expires Dec 28, 2026 | happy | UI | invite-directory.spec.js::TC-04-E2 | Planned |
| TC-04-E3 | A code is still accepted at 23:59:59 Manila on its expiry date | boundary | Unit | shared/domain/inviteExpiry.test.js::TC-04-E3 | Planned |
| TC-04-E4 | At 00:00:00 Manila the next day the code is refused as expired | boundary | Unit | shared/domain/inviteExpiry.test.js::TC-04-E4 | Planned |
| TC-04-E5 | An invitation made just after Manila midnight takes its date from Manila, not UTC | boundary | Unit | shared/domain/inviteExpiry.test.js::TC-04-E5 | Planned (Step 2 half deferred) |
| TC-04-E6 | The directory shows "Invite expired" once the date has passed, with no staff action | integration | Unit | shared/domain/linkStatus.test.js::TC-04-E6 | Blocked on G-3 |
| TC-04-E7 | An invitation spanning the year end shows the new year | boundary | Unit | shared/domain/inviteExpiry.test.js::TC-04-E7 | Planned (Step 2 half deferred) |
| TC-04-E8 | An invitation ending on a leap day shows Feb 29 | boundary | Unit | shared/domain/inviteExpiry.test.js::TC-04-E8 | Planned |
| TC-04-E9 | A device clock set back does not make an expired code work | security | UI | join-code-entry.spec.js::TC-04-E9 | Planned |
| TC-04-E10 | The same expiry date appears everywhere it is shown | integration | UI | invite-directory.spec.js::TC-04-E10 | Planned (Step 2 half deferred) |
| TC-04-E11 | A changed expiry setting applies to invitations made after the change | integration | API | invites-create.spec.js::TC-04-E11 | Blocked on G-7; Step 2 · *provisional* |
| TC-04-E12 | Invitations made before a settings change keep their original expiry | back-compat | API | invites-create.spec.js::TC-04-E12 | Blocked on G-7 |
| TC-04-E13 | With no expiry setting stored, the defaults 7 and 30 days apply | boundary | Unit | shared/domain/inviteExpiry.test.js::TC-04-E13 | Planned · *provisional* |
| TC-04-E14 | Expiry settings outside a sensible range are refused | boundary | Unit | shared/domain/inviteExpiry.test.js::TC-04-E14 | Blocked on G-7 |
| TC-04-E15 | Only the treasurer can change invitation expiry | security | API | rules-invites.spec.js::TC-04-E15 | Blocked on G-7 · *provisional* |
| TC-04-E16 | A confirm screen left open past midnight on the expiry day refuses the link | stale reference | API | invites-redeem.spec.js::TC-04-E16 | Planned |
| TC-04-F1 | A code someone else used is refused as already used | negative | API | invites-redeem.spec.js::TC-04-F1 | Planned |
| TC-04-F2 | That refusal creates no membership and leaves the first member linked | data integrity | API | invites-redeem.spec.js::TC-04-F2 | Planned |
| TC-04-F3 | The person who used a code enters it again and lands on the dashboard | happy | UI | join-code-entry.spec.js::TC-04-F3 | Planned |
| TC-04-F4 | Re-entering one's own code creates no second membership and no extra audit entry | data integrity | API | invites-redeem.spec.js::TC-04-F4 | Planned · *provisional* |
| TC-04-F5 | "Yes, link my account" is disabled while the link is in flight | concurrency | Unit | web/src/features/invites/join-controller.test.js::TC-04-F5 | Planned |
| TC-04-F6 | Two rapid redeem calls from the same account make one membership | concurrency | API | invites-redeem-race.spec.js::TC-04-F6 | Planned · *provisional* |
| TC-04-F7 | The same account redeeming on two devices at once ends up linked once | concurrency | API | invites-redeem-race.spec.js::TC-04-F7 | Planned |
| TC-04-F8 | Two people submitting the same unused code at once: exactly one is linked | concurrency | API | invites-redeem-race.spec.js::TC-04-F8 | Planned |
| TC-04-F9 | Ten parallel redeems of one code create exactly one membership | concurrency | API | invites-redeem-race.spec.js::TC-04-F9 | Planned · *provisional* |
| TC-04-F10 | Negative control: ten parallel redeems of ten different codes all succeed | concurrency | API | invites-redeem-race.spec.js::TC-04-F10 | Planned · *provisional* |
| TC-04-F11 | The person who used a code re-enters it after its expiry date | boundary | API | invites-redeem.spec.js::TC-04-F11 | Blocked on G-31 |
| TC-04-G1 | "Invite" queues one email to the contact address with the subject of record | happy | API | invites-create.spec.js::TC-04-G1 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-G2 | The email subject carries no lot or person's name | security | Unit | functions/src/mail/invite-email.test.js::TC-04-G2 | Deferred: Step 2 (email provider) |
| TC-04-G3 | The email body follows the copy of record | usability | Unit | functions/src/mail/invite-email.test.js::TC-04-G3 | Blocked on G-8, G-20; Step 2 |
| TC-04-G4 | Resend queues a new email to the same address | happy | UI | invite-directory.spec.js::TC-04-G4 | Deferred: Step 2 (email provider) |
| TC-04-G5 | Resend leaves exactly one active invitation, marking the old one replaced | data integrity | API | invites-create.spec.js::TC-04-G5 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-G6 | The old code after a resend shows the "replaced" message | negative | API | invites-redeem.spec.js::TC-04-G6 | Deferred: Step 2 (email provider) |
| TC-04-G7 | Resending an expired invitation gives a working new code | happy | API | invites-create.spec.js::TC-04-G7 | Deferred: Step 2 (email provider) |
| TC-04-G8 | No screen says an invitation was sent or delivered while it is only queued | usability | UI | invite-directory.spec.js::TC-04-G8 | Blocked on G-14; Step 2 |
| TC-04-G9 | An email the provider refuses at hand-off shows "Email failed" with Resend and Print slip | negative | API | mail-queue.spec.js::TC-04-G9 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-G10 | Resend from "Email failed" queues a new email and shows Invited | happy | API | invites-create.spec.js::TC-04-G10 | Deferred: Step 2 (email provider) |
| TC-04-G11 | "Print slip" from "Email failed" makes a print code and the email code stops working | integration | API | invites-create.spec.js::TC-04-G11 | Deferred: Step 2 (email provider) |
| TC-04-G12 | A bounce reported later shows "Email failed" with Resend and Print slip | negative | API | mail-queue.spec.js::TC-04-G12 | Blocked on the email provider (decision 3); Step 2 · *provisional* |
| TC-04-G13 | A bounce for a replaced invitation doesn't mark a household with a newer invitation as failed | stale reference | API | mail-queue.spec.js::TC-04-G13 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-G14 | A late or repeated bounce never unlinks a member or duplicates state | data integrity | API | mail-queue.spec.js::TC-04-G14 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-G15 | A recipient outside the staging allow-list is never handed to the provider | security | API *(staging)* | mail-allow-list.staging.spec.js::TC-04-G15 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-G16 | A household with no email offers "Print slip", and an email invite for it is refused | negative | API | invites-create.spec.js::TC-04-G16 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-G17 | Resending while the earlier email is still queued | concurrency | API | mail-queue.spec.js::TC-04-G17 | Blocked on G-15; Step 2 |
| TC-04-G18 | After the contact email is corrected, Resend goes to the new address and the old code stops working | integration | API | mail-queue.spec.js::TC-04-G18 | Blocked on G-16; Step 2 |
| TC-04-G19 | Before the email provider exists, the email controls are not usable | usability | UI | invite-directory.spec.js::TC-04-G19 | Blocked on G-21 |
| TC-04-H1 | Selecting 400 households, 20 without email, shows the bulk confirm of record | happy | UI | bulk-invite.spec.js::TC-04-H1 | Deferred: Step 2 (email provider) |
| TC-04-H2 | After confirming, the button reads "Queuing…" and is disabled until all are queued | concurrency | Unit | web/src/features/invites/staff-actions.test.js::TC-04-H2 | Deferred: Step 2 (email provider) |
| TC-04-H3 | When done, "380 invitations queued. Each household shows its email status." | happy | UI | bulk-invite.spec.js::TC-04-H3 | Deferred: Step 2 (email provider) |
| TC-04-H4 | Exactly 380 emails are queued and the 20 without email are untouched | data integrity | API | invites-create.spec.js::TC-04-H4 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-H5 | Pressing "Invite selected" again skips households with an unused invitation | negative | API | invites-create.spec.js::TC-04-H5 | Deferred: Step 2 (email provider) |
| TC-04-H6 | The counts in the confirm and done messages equal what is actually queued | usability | UI | bulk-invite.spec.js::TC-04-H6 | Blocked on G-13; Step 2 |
| TC-04-H7 | Linked households in a bulk selection are not invited again | negative | API | invites-create.spec.js::TC-04-H7 | Blocked on G-12; Step 2 |
| TC-04-H8 | The bulk confirm reads correctly at m = 0, n = 1 and n = 0 | boundary | Unit | web/src/features/invites/bulk-summary.test.js::TC-04-H8 | Blocked on G-13; Step 2 |
| TC-04-H9 | Cancelling the bulk confirm queues nothing | navigation | UI | bulk-invite.spec.js::TC-04-H9 | Deferred: Step 2 (email provider) |
| TC-04-H10 | After a bulk run, each household shows its email status | usability | UI | bulk-invite.spec.js::TC-04-H10 | Blocked on G-14; Step 2 |
| TC-04-H11 | A bulk run interrupted and retried makes no duplicates | concurrency | API | invites-create.spec.js::TC-04-H11 | Deferred: Step 2 (email provider) |
| TC-04-H12 | "Print their slips instead" leads to printing for the households without email | navigation | UI | bulk-invite.spec.js::TC-04-H12 | Blocked on G-20 |
| TC-04-I1 | "Print invite slips" for 20 households shows the print confirm of record | happy | UI | print-slips.spec.js::TC-04-I1 | Planned |
| TC-04-I2 | Confirming downloads one PDF with one slip per household | happy | UI | print-slips.spec.js::TC-04-I2 | Planned |
| TC-04-I3 | Each slip shows the copy of record: HOA, lot, code, expiry, how to join | usability | Unit | web/src/features/invites/slip-pdf.test.js::TC-04-I3 | Planned |
| TC-04-I4 | Slips show no balance, email or phone number | security | UI | print-slips.spec.js::TC-04-I4 | Planned |
| TC-04-I5 | The PDF shows "Delete this file after printing." | usability | Unit | web/src/features/invites/slip-pdf.test.js::TC-04-I5 | Planned |
| TC-04-I6 | Every printed code links to the lot printed beside it | data integrity | UI | print-slips.spec.js::TC-04-I6 | Planned |
| TC-04-I7 | Printing again makes the earlier unused print code show "replaced" | negative | API | invites-create.spec.js::TC-04-I7 | Planned |
| TC-04-I8 | Printing a slip for a household with an unused email invitation stops the email code | integration | API | invites-create.spec.js::TC-04-I8 | Blocked on G-4 |
| TC-04-I9 | Printing a slip for a household with a pending second-person invitation | integration | API | invites-create.spec.js::TC-04-I9 | Blocked on G-4 |
| TC-04-I10 | Printing for a linked household doesn't change the member or the used invitation | integration | API | invites-create.spec.js::TC-04-I10 | Blocked on G-12 |
| TC-04-I11 | Cancelling the print confirm keeps the earlier codes working | negative | UI | print-slips.spec.js::TC-04-I11 | Planned |
| TC-04-I12 | Pressing Print twice quickly leaves one active print code per household | concurrency | Unit | web/src/features/invites/staff-actions.test.js::TC-04-I12 | Blocked on G-33 |
| TC-04-I13 | A printed slip is legible and cut-able | usability | Manual | Manual: printed-slip check (A4 and Letter)::TC-04-I13 | Planned |
| TC-04-I14 | "Print slip" on a single no-email row downloads a one-slip PDF | happy | UI | print-slips.spec.js::TC-04-I14 | Planned |
| TC-04-J1 | "Invite another person" with Family gives the second person their own code | happy | API | invites-create.spec.js::TC-04-J1 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-J2 | After the second person redeems, the directory shows "Linked · 2 people" | integration | API | invites-integrity.spec.js::TC-04-J2 | Deferred: Step 2 (email provider) |
| TC-04-J3 | The relation the admin picked is what the household detail shows | integration | UI | invite-directory.spec.js::TC-04-J3 | Deferred: Step 2 (email provider) |
| TC-04-J4 | Inviting the same address twice for one household makes one active invitation | negative | API | invites-create.spec.js::TC-04-J4 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-J5 | A click outside "Invite another person" keeps what was typed | usability | UI | household-detail.spec.js::TC-04-J5 | Deferred: Step 2 (email provider) |
| TC-04-J6 | The relation picker offers only the R1 relations | usability | Unit | shared/domain/relations.test.js::TC-04-J6 | Blocked on G-17 |
| TC-04-J7 | A person linked to another lot sees the already-linked message | negative | API | invites-redeem.spec.js::TC-04-J7 | Planned |
| TC-04-J8 | That refusal leaves the code unused and Juan's single membership unchanged | data integrity | API | invites-redeem.spec.js::TC-04-J8 | Planned |
| TC-04-J9 | The already-linked refusal holds when redeemInvite is called directly | security | API | invites-redeem.spec.js::TC-04-J9 | Planned · *provisional* |
| TC-04-J10 | A treasurer who is also a homeowner can't redeem a code for a second lot | security | API | invites-redeem.spec.js::TC-04-J10 | Planned |
| TC-04-J11 | A staff member with no household can link to their own lot and gets the view switch | integration | API | invites-redeem.spec.js::TC-04-J11 | Planned |
| TC-04-J12 | A member entering another code for their own household | negative | API | invites-redeem.spec.js::TC-04-J12 | Blocked on G-19 |
| TC-04-J13 | A code for a household deactivated after printing shows "no longer valid" | negative | API | invites-redeem.spec.js::TC-04-J13 | Planned |
| TC-04-J14 | Deactivating a household cancels its active invitations | integration | API | invites-integrity.spec.js::TC-04-J14 | Planned · *provisional* |
| TC-04-J15 | A confirm screen open when the household is deactivated refuses the link | stale reference | API | invites-redeem.spec.js::TC-04-J15 | Planned |
| TC-04-J16 | Reactivating a household does not revive its old code | negative | API | invites-redeem.spec.js::TC-04-J16 | Blocked on G-5 |
| TC-04-J17 | A deactivated household can't be invited, resent or printed | negative | API | invites-create.spec.js::TC-04-J17 | Planned · *provisional* |
| TC-04-J18 | Inviting beyond the people-per-household limit | boundary | API | invites-integrity.spec.js::TC-04-J18 | Blocked on the board (people-per-household limit) |
| TC-04-K1 | "Remove" asks the confirm of record | happy | UI | household-detail.spec.js::TC-04-K1 | Blocked on G-20 |
| TC-04-K2 | After removal, the removed person's next household read is refused | security | API | members-remove.spec.js::TC-04-K2 | Planned |
| TC-04-K3 | The removed person sees the not-linked screen on her next load | navigation | UI | join-access.spec.js::TC-04-K3 | Blocked on G-26 |
| TC-04-K4 | Removal makes every unused invitation for the lot stop working | negative | API | members-remove.spec.js::TC-04-K4 | Blocked on G-5 |
| TC-04-K5 | The lot's bills, payments and totals stay with the lot | data integrity | API | members-remove.spec.js::TC-04-K5 | Planned |
| TC-04-K6 | The activity log records who removed her and when | integration | API | invites-audit-logs.spec.js::TC-04-K6 | Blocked on G-6 · *provisional* |
| TC-04-K7 | Removal deletes the membership and the pill counts down | integration | API | members-remove.spec.js::TC-04-K7 | Blocked on G-9 |
| TC-04-K8 | Removing someone already removed says "already removed" and changes nothing | concurrency | API | members-remove.spec.js::TC-04-K8 | Blocked on G-10 · *provisional* |
| TC-04-K9 | "Remove" is disabled while in flight | concurrency | Unit | web/src/features/invites/staff-actions.test.js::TC-04-K9 | Planned |
| TC-04-K10 | Cancelling the remove confirm keeps the person linked | navigation | UI | household-detail.spec.js::TC-04-K10 | Planned |
| TC-04-K11 | A removed person re-entering her own used code does not regain access | security | API | members-remove.spec.js::TC-04-K11 | Blocked on G-11 |
| TC-04-K12 | The new owner can be invited and linked after the old owner is removed | happy | API | members-remove.spec.js::TC-04-K12 | Planned |
| TC-04-K13 | The new owner cannot see the previous owner's contact details | security | API | members-remove.spec.js::TC-04-K13 | Planned |
| TC-04-K14 | After the office edits the owner name, the new owner's confirm screen shows the new name | integration | API | invites-redeem.spec.js::TC-04-K14 | Blocked on G-28 |
| TC-04-K15 | Removing the owner leaves other members linked | integration | API | members-remove.spec.js::TC-04-K15 | Blocked on G-29 |
| TC-04-K16 | Editing the owner name alone doesn't unlink anyone | regression | API | members-remove.spec.js::TC-04-K16 | Planned |
| TC-04-K17 | Treasurer can remove a person | security | API | members-remove.spec.js::TC-04-K17 | Planned |
| TC-04-L1 | [Option 1] The new owner sees no receipts or bills dated before they linked | security | API | privacy-after-sale.spec.js::TC-04-L1 | Blocked on decision 5 and the payments REQ |
| TC-04-L2 | [Option 1] A record on the link date itself | boundary | API | privacy-after-sale.spec.js::TC-04-L2 | Blocked on decision 5 |
| TC-04-L3 | [Option 2] The new owner can't open the previous owner's payment screenshots | security | API | privacy-after-sale.spec.js::TC-04-L3 | Blocked on decision 5 and the payments REQ |
| TC-04-L4 | [Option 2] What the new owner sees of earlier receipts | security | UI | privacy-after-sale.spec.js::TC-04-L4 | Blocked on decision 5 |
| TC-04-L5 | [Either] The removed owner can't open any of the lot's records, including her own uploads | security | API | privacy-after-sale.spec.js::TC-04-L5 | Blocked on the payments REQ |
| TC-04-L6 | [Either] Staff still see the lot's full history after a sale | integration | API | privacy-after-sale.spec.js::TC-04-L6 | Blocked on decision 5 |
| TC-04-M1 | Treasurer can invite, resend and print | security | API | rules-invites.spec.js::TC-04-M1 | Planned (Step 2 half deferred) |
| TC-04-M2 | createInvites is refused for board, guard, homeowner, no-role and signed-out callers | security | API | rules-invites.spec.js::TC-04-M2 | Planned · *provisional* |
| TC-04-M3 | removeMember is refused for the same callers | security | API | rules-invites.spec.js::TC-04-M3 | Planned · *provisional* |
| TC-04-M4 | cancelInvite is refused for the same callers | security | API | rules-invites.spec.js::TC-04-M4 | Planned · *provisional* |
| TC-04-M5 | checkInvite and redeemInvite are refused when signed out | security | API | rules-invites.spec.js::TC-04-M5 | Planned · *provisional* |
| TC-04-M6 | A person can only redeem for themselves | security | API | rules-invites.spec.js::TC-04-M6 | Planned · *provisional* |
| TC-04-M7 | Non-staff cannot read invitations, even for their own household | security | API | rules-invites.spec.js::TC-04-M7 | Planned · *provisional* |
| TC-04-M8 | Staff can read a household's invitations by household | security | API | rules-invites.spec.js::TC-04-M8 | Planned · *provisional* |
| TC-04-M9 | No client can write an invitation, staff included | security | API | rules-invites.spec.js::TC-04-M9 | Planned · *provisional* |
| TC-04-M10 | No client can read or reset its wrong-code counter | security | API | rules-invites.spec.js::TC-04-M10 | Planned · *provisional* |
| TC-04-M11 | No client can read or write the mail queue, staff included | security | API | rules-invites.spec.js::TC-04-M11 | Planned · *provisional* |
| TC-04-M12 | No client can create a membership | security | API | rules-invites.spec.js::TC-04-M12 | Planned · *provisional* |
| TC-04-M13 | A member can't read another household's memberships | security | API | rules-invites.spec.js::TC-04-M13 | Planned · *provisional* |
| TC-04-M14 | A newly linked member reads only their own household | security | API | rules-invites.spec.js::TC-04-M14 | Planned |
| TC-04-M15 | Clients can't change link status or member count | security | API | rules-invites.spec.js::TC-04-M15 | Planned · *provisional* |
| TC-04-M16 | A guard sees no households, invitations or people | security | API | rules-invites.spec.js::TC-04-M16 | Planned |
| TC-04-M17 | A staff member whose role was just removed can't invite or remove | security | API | rules-invites.spec.js::TC-04-M17 | Planned · *provisional* |
| TC-04-N1 | Two staff pressing Resend at once leave exactly one active code | concurrency | API | invites-staff-race.spec.js::TC-04-N1 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-N2 | Two staff running "Invite selected" on the same households make one invitation each | concurrency | API | invites-staff-race.spec.js::TC-04-N2 | Deferred: Step 2 (email provider) |
| TC-04-N3 | Two staff printing the same household at once leave one active print code | concurrency | API | invites-staff-race.spec.js::TC-04-N3 | Blocked on G-32 |
| TC-04-N4 | Redeem and Resend at the same moment end in one consistent state | concurrency | API | invites-staff-race.spec.js::TC-04-N4 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-N5 | Redeem and Remove in the same household at once keep the count right | concurrency | API | invites-staff-race.spec.js::TC-04-N5 | Planned · *provisional* |
| TC-04-N6 | A confirm screen open while staff resend refuses the old code | stale reference | API | invites-redeem.spec.js::TC-04-N6 | Deferred: Step 2 (email provider) |
| TC-04-N7 | An open household detail shows the link after a reload | integration | UI | invite-directory.spec.js::TC-04-N7 | Planned |
| TC-04-N8 | Resend from a stale screen on a household that just linked creates no active invitation | stale reference | API | invites-staff-race.spec.js::TC-04-N8 | Deferred: Step 2 (email provider) · *provisional* |
| TC-04-P1 | A signed-in account with no household lands on the not-linked screen | navigation | UI | join-code-entry.spec.js::TC-04-P1 | Planned |
| TC-04-P2 | The email link survives email-and-password sign-in without typing the code | navigation | UI | join-deep-link.spec.js::TC-04-P2 | Deferred: Step 2 (email provider) |
| TC-04-P3 | The email link survives creating a new account | navigation | UI | join-deep-link.spec.js::TC-04-P3 | Deferred: Step 2 (email provider) |
| TC-04-P4 | The email link survives "Continue with Google" | navigation | UI | join-deep-link.spec.js::TC-04-P4 | Deferred: Step 2 (email provider) |
| TC-04-P5 | Refreshing the sign-in page mid-flow keeps the code | navigation | UI | join-deep-link.spec.js::TC-04-P5 | Deferred: Step 2 (email provider) |
| TC-04-P6 | Refreshing the confirm screen keeps the lot and the link still works | navigation | UI | join-deep-link.spec.js::TC-04-P6 | Planned (Step 2 half deferred) |
| TC-04-P7 | After linking, the code is cleared from session storage and the address bar | security | UI | join-deep-link.spec.js::TC-04-P7 | Planned (Step 2 half deferred) · *provisional* |
| TC-04-P8 | After "No, this isn't my lot", the code is cleared too | security | UI | join-deep-link.spec.js::TC-04-P8 | Blocked on G-30 |
| TC-04-P9 | Signing out with a pending code leaves no code on the device | security | UI | join-deep-link.spec.js::TC-04-P9 | Deferred: Step 2 (email provider) |
| TC-04-P10 | Back after linking doesn't create a second link | navigation | UI | join-deep-link.spec.js::TC-04-P10 | Planned |
| TC-04-P11 | A homeowner can't open the Homeowners directory or a household detail by URL | navigation | UI | join-access.spec.js::TC-04-P11 | Planned |
| TC-04-P12 | A no-household account opening a household URL sees no data | navigation | UI | join-access.spec.js::TC-04-P12 | Planned |
| TC-04-P13 | Staff move from the directory to household detail and back with the Homeowners menu highlighted | navigation | UI | invite-directory.spec.js::TC-04-P13 | Planned |
| TC-04-P14 | After Remove, staff stay on the household detail with the list updated | navigation | UI | household-detail.spec.js::TC-04-P14 | Planned |
| TC-04-P15 | An important announcement doesn't block the join flow | navigation | UI | join-deep-link.spec.js::TC-04-P15 | Planned |
| TC-04-P16 | `/join` with no code opens empty code entry | navigation | UI | join-deep-link.spec.js::TC-04-P16 | Deferred: Step 2 (email provider) |
| TC-04-Q1 | The code field has a visible label and the hint is tied to it | usability | UI | join-code-entry.spec.js::TC-04-Q1 | Planned |
| TC-04-Q2 | The code field uses the large monospaced code style | usability | UI | join-code-entry.spec.js::TC-04-Q2 | Planned |
| TC-04-Q3 | A code can be pasted into the field | usability | UI | join-code-entry.spec.js::TC-04-Q3 | Planned |
| TC-04-Q4 | Errors are announced and tied to the field, with focus kept there | usability | UI | join-code-entry.spec.js::TC-04-Q4 | Planned |
| TC-04-Q5 | While a code is being checked the button reads "Checking…" and is disabled | usability | UI | join-code-entry.spec.js::TC-04-Q5 | Planned |
| TC-04-Q6 | The join screens are single cards at 375 px with the phone layout | usability | UI *(mobile)* | join-phone.spec.js::TC-04-Q6 | Planned |
| TC-04-Q7 | Tap targets on the join screens and the email button are large enough | usability | UI *(mobile)* | join-phone.spec.js::TC-04-Q7 | Planned (Step 2 half deferred) |
| TC-04-Q8 | The on-screen keyboard doesn't hide the focused field or the error | usability | Manual | Manual: real phone keyboard::TC-04-Q8 | Planned |
| TC-04-Q9 | Link-status pills carry text and enough contrast | usability | UI | invite-directory.spec.js::TC-04-Q9 | Planned |
| TC-04-Q10 | The Remove dialog traps focus, Escape cancels, and focus returns | usability | UI | household-detail.spec.js::TC-04-Q10 | Planned |
| TC-04-Q11 | "Queuing…" and the bulk result are announced | usability | UI | bulk-invite.spec.js::TC-04-Q11 | Deferred: Step 2 (email provider) |
| TC-04-Q12 | The whole join flow works with a keyboard only | usability | UI | join-code-entry.spec.js::TC-04-Q12 | Planned |
| TC-04-Q13 | Phone directory cards show the pill and the invite action | usability | UI *(mobile)* | join-phone.spec.js::TC-04-Q13 | Planned |
| TC-04-R1 | Every join error matches the copy of record exactly | usability | Unit | web/src/features/invites/invite-messages.test.js::TC-04-R1 | Planned |
| TC-04-R2 | Directory and detail buttons use only the labels of record | usability | UI | invite-directory.spec.js::TC-04-R2 | Blocked on G-20 |
| TC-04-R3 | The same pill words appear on the table, phone cards, filter chips and household detail | usability | UI | invite-directory.spec.js::TC-04-R3 | Planned |
| TC-04-R4 | "Linked · 1 person" and "Linked · 2 people" use the right number word | boundary | Unit | shared/domain/linkStatus.test.js::TC-04-R4 | Planned |
| TC-04-R5 | Code entry, confirm and wrong-lot texts match the copy of record | usability | UI | join-code-entry.spec.js::TC-04-R5 | Planned |
| TC-04-R6 | The HOA name follows the brand in email, slip and screens | usability | UI | invite-directory.spec.js::TC-04-R6 | Planned (Step 2 half deferred) |
| TC-04-S1 | A household created before invitations existed shows "Not invited" | back-compat | UI | invite-directory.spec.js::TC-04-S1 | Planned |
| TC-04-S2 | Inviting a legacy household works and fills in its link fields | back-compat | API | invites-redeem.spec.js::TC-04-S2 | Planned · *provisional* |
| TC-04-S3 | A freshly imported household shows "Not invited" and can be invited | integration | API | invites-redeem.spec.js::TC-04-S3 | Planned |
| TC-04-S4 | Member count always equals the number of memberships | data integrity | API | invites-integrity.spec.js::TC-04-S4 | Planned · *provisional* |
| TC-04-S5 | Link status always agrees with the invitations and memberships | data integrity | API | invites-integrity.spec.js::TC-04-S5 | Blocked on G-2, G-3, G-9 · *provisional* |
| TC-04-S6 | There is never more than one active invitation per household and recipient | data integrity | API | invites-integrity.spec.js::TC-04-S6 | Planned · *provisional* |
| TC-04-S7 | Every used invitation has exactly one matching membership, and every membership one invitation | data integrity | API | invites-integrity.spec.js::TC-04-S7 | Planned · *provisional* |
| TC-04-S8 | Every lifecycle action writes exactly one audit entry of the right kind | data integrity | API | invites-audit-logs.spec.js::TC-04-S8 | Planned · *provisional* |
| TC-04-S9 | Zero members and "never linked" read differently | boundary | Unit | shared/domain/linkStatus.test.js::TC-04-S9 | Blocked on G-9 |
| TC-04-S10 | Directory header counts and filter chips add up | data integrity | UI | invite-directory-counts.exclusive.spec.js::TC-04-S10 | Blocked on G-3 |
| TC-04-X1 | 20 minutes breaking the join flow on a phone | exploratory | Manual | Manual: exploratory charter::TC-04-X1 | Deferred: Step 2 (email provider) |
| TC-04-X2 | 20 minutes trying to link to a lot you don't own | exploratory | Manual | Manual: exploratory charter::TC-04-X2 | Planned |
| TC-04-X3 | 15 minutes looking for directory status drift | exploratory | Manual | Manual: exploratory charter::TC-04-X3 | Planned (Step 2 half deferred) |
| TC-04-X4 | 15 minutes reading and typing codes from a printed slip | exploratory | Manual | Manual: exploratory charter::TC-04-X4 | Planned |

## TC-03 Household directory (REQ-003): planned for the real app

Triaged by QE 2026-11-28 from [TC-03 v1 r3](TC-03-household-directory-v1.md) (owner-approved, on `main`), against REQ-003 r4 and SA-001 r3 (Final). Like the TC-01, TC-02 and TC-04 rows, these target the **real app** (Firebase Auth, Firestore, Functions and Storage on the Emulator Suite), which doesn't exist yet. Nothing is automated. Each row is:

- **Planned**;
- **Planned (… part not asserted)**: the case cites an open BA gap (NG*n*) only under *Don't assert*, so it runs now without that part;
- **Deferred: Step 2**, waiting for REQ-004's email provider;
- **Blocked** on decision 2 (the lot key, waiting on the admin office) or NG8, with no layer guessed;
- or **Covered by** a TC-02 or TC-04 row that already proves the same thing. That row's test is reported for both ids, and no second test is written.

Reasons, the Unit list for Dev, the locator contract, the spec list, the automation order and the findings are in TC-03's **QE triage** section. Unit files are Dev's, under `shared/domain/` and `web/src/features/households/` (paths anticipated from SA-001 r3 §9). API specs live in `tests/specs/api/`, the staging spec in `tests/specs/staging/`, UI specs in `tests/specs/ui/`.

| Layer | Cases | Share of new automated | Blocked | Deferred: Step 2 |
|---|---|---|---|---|
| Unit | 103 | 32% | 0 | 0 |
| API | 128 (1 on staging) | 40% | 0 | 2 |
| UI | 89 (8 `mobile`, 3 `exclusive`) | 28% | 0 | 0 |
| Journey | 1 | <1% | 0 | 0 |
| Manual | 5 | — | 0 | 0 |
| Blocked, no layer yet | 5 | — | 5 | 0 |
| Covered by another plan | 19 (2 Unit, 13 API, 4 UI) | — | — | — |
| **Total** | **350** | | **5** | **2** |

21 Planned rows run without an open part; 5 UI rows fail until DEF-001 is fixed.

**Gaps:** none. Every case has a layer, a named test or manual run, a cross-reference, or a stated block.

**Overlaps:** none by layer. 19 TC-03 cases are cross-references to TC-02 and TC-04 rows (listed in TC-03's QE triage), and 8 more are scoped to the part those rows don't cover (the scope is in the Scenario column). One possible overlap is left for TC-04's owner: TC-04-S3's "shows Not invited" half is also TC-03-A4 (TC-03 finding, "For QE TC-04").

**Effect on the rows above:** the mock-up's `SMK-admin-homeowners` (in `SMK-admin-* (11)`) retires with `aHo()` and is replaced by the smoke rows below. It's left as it is until then.

**Smoke additions** (new rows, not TC-03 cases). TC-04's `SMK-admin-homeowners-portal` shares the directory page load with `SMK-admin-directory`.

| Scenario id | Scenario | Type | Layer | Test file::test name | Status |
|---|---|---|---|---|---|
| SMK-admin-directory | Real directory loads for admin office staff: heading with a count, Import households, Add household, search, chips | happy | UI | smoke.spec.js::SMK-admin-directory | Planned |
| SMK-treasurer-directory | The same directory loads for the treasurer | happy | UI | smoke.spec.js::SMK-treasurer-directory | Planned |
| SMK-admin-import-step1 | Import households step 1: Download template and the labelled file input (no preview: a preview writes a run) | happy | UI | smoke.spec.js::SMK-admin-import-step1 | Planned |
| SMK-admin-add-household | The Add household dialog opens and closes with Cancel | happy | UI | smoke.spec.js::SMK-admin-add-household | Planned |
| SMK-admin-household-dialog | A fixture household's dialog opens from its lot label button with Deactivate, Cancel and Save (never pressed) | happy | UI | smoke.spec.js::SMK-admin-household-dialog | Planned |
| SMK-admin-inactive-filter | The Inactive chip lists the inactive fixture; its dialog shows the Inactive pill and Reactivate | happy | UI | smoke.spec.js::SMK-admin-inactive-filter | Planned |

**Cases**

| Scenario id | Scenario | Type | Layer | Test file::test name | Status |
|---|---|---|---|---|---|
| TC-03-A1 | The preview of a clean 623-row file classifies every row as ready and none as rejected | happy path | API | api/households-import-preview.spec.js::TC-03-A1 | Planned |
| TC-03-A2 | The preview alone saves no household | data integrity | API | api/households-import-preview.spec.js::TC-03-A2 | Planned |
| TC-03-A3 | Committing the clean file stores exactly 623 households | happy path | API | api/households-import-commit.spec.js::TC-03-A3 | Planned |
| TC-03-A4 | Every imported household is stored with link status "Not invited" and no members | happy path | API | api/households-import-commit.spec.js::TC-03-A4 | Planned |
| TC-03-A5 | The preview rejects exactly rows 14, 31, 32 and 57, counting the header as row 1 | negative | Unit | shared/domain/householdPreview.test.js::TC-03-A5 | Planned |
| TC-03-A6 | The preview counts only the rows that will be added | negative | Unit | shared/domain/householdPreview.test.js::TC-03-A6 | Planned |
| TC-03-A7 | Neither copy of an in-file duplicate lot is stored | data integrity | API | api/households-import-commit.spec.js::TC-03-A7 | Planned |
| TC-03-A8 | After a partial import the run record holds 619 imported and the 4 rejected rows | happy path | API | api/households-import-commit.spec.js::TC-03-A8 | Planned |
| TC-03-A9 | The preview classifies a lot already in the directory as skipped, counted as already, not as won't be imported | negative | API | api/households-import-preview.spec.js::TC-03-A9 | Planned |
| TC-03-A10 | The import leaves exactly one Blk 4 Lot 12 | data integrity | API | api/households-import-commit.spec.js::TC-03-A10 | Planned |
| TC-03-A11 | The existing household's name and contacts are unchanged by the import | data integrity | API | api/households-import-commit.spec.js::TC-03-A11 | Planned |
| TC-03-A12 | The template file's header is the six columns in order | happy path | Unit | shared/domain/householdCsv.test.js::TC-03-A12 | Planned |
| TC-03-A13 | A treasurer's import preview and commit calls are allowed | security / role | API | api/households-callables-roles.spec.js::TC-03-A13 | Planned |
| TC-03-A14 | A treasurer's commit stores the file's households | data integrity | API | api/households-import-commit.spec.js::TC-03-A14 | Planned |
| TC-03-A15 | Ready, won't be imported and already in the directory add up to the file's data rows | data integrity | Unit | shared/domain/householdPreview.test.js::TC-03-A15 | Planned |
| TC-03-B1 | A 0-byte file is refused with a file message before any preview | negative | Unit | shared/domain/householdCsv.test.js::TC-03-B1 | Planned |
| TC-03-B2 | A header-only file is refused with a file message, not previewed with zero rows | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B2 | Planned |
| TC-03-B3 | A file with one valid row stores one household | boundary | API | api/households-import-commit.spec.js::TC-03-B3 | Planned |
| TC-03-B4 | A file where every row has a problem is previewed with zero ready rows | boundary | Unit | shared/domain/householdPreview.test.js::TC-03-B4 | Planned |
| TC-03-B5 | A file that is not valid UTF-8 is refused at file level | negative | Unit | shared/domain/householdCsv.test.js::TC-03-B5 | Planned |
| TC-03-B6 | A UTF-8 file with a BOM is read correctly, first column included | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B6 | Planned |
| TC-03-B7 | A UTF-8 file without a BOM is read correctly | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B7 | Planned |
| TC-03-B8 | "ñ" in an owner name is stored unchanged | data integrity | Unit | shared/domain/householdCsv.test.js::TC-03-B8 | Planned |
| TC-03-B9 | CRLF, LF, CR-only and mixed line endings give the same rows and row numbers | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B9 | Planned |
| TC-03-B10 | A last row with no final newline is read; trailing blank lines are not rows | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B10 | Planned |
| TC-03-B11 | A quoted field containing a comma stays in one column | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B11 | Planned |
| TC-03-B12 | A file with no Lot column is refused at file level naming Lot | negative | Unit | shared/domain/householdCsv.test.js::TC-03-B12 | Planned |
| TC-03-B13 | An extra unknown column causes no row to be rejected | negative | Unit | shared/domain/householdCsv.test.js::TC-03-B13 | Planned |
| TC-03-B14 | Reordered columns are matched by heading, never shifted | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B14 | Planned |
| TC-03-B15 | A semicolon-separated file is refused as the wrong separator | negative | Unit | shared/domain/householdCsv.test.js::TC-03-B15 | Planned |
| TC-03-B16 | An .xlsx file is refused before any preview | negative | Unit | shared/domain/householdCsv.test.js::TC-03-B16 | Planned |
| TC-03-B17 | A file of exactly 2,000 data rows is previewed as normal | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B17 | Planned |
| TC-03-B18 | A file of 1,048,577 bytes is refused for size | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B18 | Planned (NG1 part not asserted) |
| TC-03-B19 | Each file message reads the copy of record | ui/ux | UI | ui/households-import.spec.js::TC-03-B19 | Planned |
| TC-03-B20 | The not-UTF-8 file message reads the copy of record | ui/ux | UI | ui/households-import.spec.js::TC-03-B20 | Planned |
| TC-03-B21 | With zero ready rows the Import button is replaced by a sentence saying why | ui/ux | UI | ui/households-import.spec.js::TC-03-B21 | Planned (NG11 part not asserted) |
| TC-03-B22 | An owner name with "ñ" is shown unchanged in the preview and directory | ui/ux | UI | ui/households-directory.spec.js::TC-03-B22 | Planned |
| TC-03-B23 | An extra column's values are stored in no record | data integrity | API | api/households-import-commit.spec.js::TC-03-B23 | Planned |
| TC-03-B24 | The page stays usable while an over-size file is refused | usability | UI | ui/households-import.spec.js::TC-03-B24 | Planned |
| TC-03-B25 | A file of 2,001 data rows is refused at file level | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B25 | Planned |
| TC-03-B26 | The server refuses a preview call carrying more than 2,000 rows | security / role | API | api/households-import-preview.spec.js::TC-03-B26 | Planned |
| TC-03-B27 | A file of 1,000,000 bytes is not refused for size | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B27 | Planned (NG1 part not asserted) |
| TC-03-B28 | A file over both the size and the row limit gets the size refusal | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B28 | Planned |
| TC-03-B29 | A quoted cell containing a line break stays one row | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B29 | Planned |
| TC-03-B30 | Blank rows anywhere in the file are neither listed nor counted | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B30 | Planned |
| TC-03-B31 | Row numbers count the header and blank rows, matching the spreadsheet | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B31 | Planned |
| TC-03-B32 | A header followed only by blank rows is refused like a header-only file | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B32 | Planned |
| TC-03-B33 | Several missing required columns are reported together, in template order | negative | Unit | shared/domain/householdCsv.test.js::TC-03-B33 | Planned |
| TC-03-B34 | A renamed required column counts as missing | negative | Unit | shared/domain/householdCsv.test.js::TC-03-B34 | Planned |
| TC-03-B35 | A missing optional column leaves that value blank for every row | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B35 | Planned |
| TC-03-B36 | Headings are matched trimmed and case-insensitive | boundary | Unit | shared/domain/householdCsv.test.js::TC-03-B36 | Planned |
| TC-03-B37 | A tab-separated file is refused as the wrong separator | negative | Unit | shared/domain/householdCsv.test.js::TC-03-B37 | Planned |
| TC-03-B38 | A heading that appears twice is refused at file level | negative | Unit | shared/domain/householdCsv.test.js::TC-03-B38 | Planned |
| TC-03-B39 | A file message is announced, shown as text with an icon, and leaves focus on the file input | usability | UI | ui/households-import.spec.js::TC-03-B39 | Planned |
| TC-03-B40 | A file-level refusal sends no rows to the server | data integrity | UI | ui/households-import.spec.js::TC-03-B40 | Planned |
| TC-03-C1 | A row with no block is rejected for a missing block | negative | Unit | shared/domain/householdFields.test.js::TC-03-C1 | Planned |
| TC-03-C2 | A row with no owner name is rejected for a missing owner name | negative | Unit | shared/domain/householdFields.test.js::TC-03-C2 | Planned |
| TC-03-C3 | An owner name of spaces only is treated as missing | negative | Unit | shared/domain/householdFields.test.js::TC-03-C3 | Planned |
| TC-03-C4 | An owner name of exactly 80 characters is accepted and stored in full | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C4 | Planned |
| TC-03-C5 | An owner name of 81 characters is rejected as longer than 80 | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C5 | Planned |
| TC-03-C6 | Each of the six accepted mobile shapes passes validation | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C6 | Planned |
| TC-03-C7 | A mobile one digit short is rejected as invalid, quoting the value | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C7 | Planned |
| TC-03-C8 | A mobile one digit long is rejected as invalid | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C8 | Planned |
| TC-03-C9 | A mobile in scientific notation is rejected, not guessed | negative | Unit | shared/domain/householdFields.test.js::TC-03-C9 | Planned |
| TC-03-C10 | A 5,000-digit mobile is rejected promptly | negative | Unit | shared/domain/householdFields.test.js::TC-03-C10 | Planned |
| TC-03-C11 | Three malformed emails are each rejected as invalid, quoting the value | negative | Unit | shared/domain/householdFields.test.js::TC-03-C11 | Planned |
| TC-03-C12 | A row with no email and no mobile is stored with both contacts empty | boundary | API | api/households-import-commit.spec.js::TC-03-C12 | Planned |
| TC-03-C13 | Two households may share one contact email | boundary | API | api/households-import-commit.spec.js::TC-03-C13 | Planned |
| TC-03-C14 | Lot "12-A" is stored as a lot distinct from Lot 12 | boundary | Unit | shared/domain/lotKey.test.js::TC-03-C14 | Planned |
| TC-03-C15 | Block "04" and block "4" resolve to the same lot | data integrity | Unit | shared/domain/householdPreview.test.js::TC-03-C15 | Planned |
| TC-03-C16 | Lot values "012", " 12 " and "12-a" resolve to the existing lots | data integrity | Unit | shared/domain/householdPreview.test.js::TC-03-C16 | Planned |
| TC-03-C17 | Invalid block values are rejected with the block reason | negative | Unit | shared/domain/householdFields.test.js::TC-03-C17 | Planned |
| TC-03-C18 | Accepted phase forms are stored as "Phase N" | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C18 | Planned |
| TC-03-C19 | Three copies of one lot in a file are all rejected as duplicates | boundary | Unit | shared/domain/householdPreview.test.js::TC-03-C19 | Planned |
| TC-03-C20 | Every row of a lot duplicated in the file and already in the directory is classified already | negative | Unit | shared/domain/householdPreview.test.js::TC-03-C20 | Planned |
| TC-03-C21 | A row with several problems lists all of them, in column order, joined by "; " | negative | Unit | shared/domain/householdPreview.test.js::TC-03-C21 | Planned |
| TC-03-C22 | Markup in an owner name is shown as text and never runs | security / role | UI | ui/households-directory.spec.js::TC-03-C22 | Planned |
| TC-03-C23 | An 80-character owner name is shown in full in the list and household dialog | ui/ux | UI | ui/households-directory.spec.js::TC-03-C23 | Planned |
| TC-03-C24 | Stored mobiles are shown in the "0900 000 0000" display format | ui/ux | Unit | shared/domain/householdFields.test.js::TC-03-C24 | Planned |
| TC-03-C25 | A household with no email shows no email in the list and an empty Email field | ui/ux | UI | ui/households-directory.spec.js::TC-03-C25 | Planned |
| TC-03-C26 | A suffixed lot's label reads "Blk 4 Lot 12-A" | ui/ux | Unit | shared/domain/lotKey.test.js::TC-03-C26 | Planned |
| TC-03-C27 | A household with no phase shows "Not set" in the household dialog | ui/ux | Blocked | — | Blocked on decision 2 (admin office) |
| TC-03-C28 | A blank phase is handled by decision 2's rule | boundary | Blocked | — | Blocked on decision 2 (admin office) |
| TC-03-C29 | The same Block and Lot in two different phases is handled by decision 2's rule | boundary | Blocked | — | Blocked on decision 2 (admin office) |
| TC-03-C30 | A leading apostrophe before an ordinary character is kept | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C30 | Planned |
| TC-03-C31 | A value that starts with "=" after the apostrophe is removed is stored as plain text | security / role | Unit | shared/domain/householdFields.test.js::TC-03-C31 | Planned |
| TC-03-C32 | An 80-character name with spaces around it is accepted after trimming | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C32 | Planned |
| TC-03-C33 | The in-file duplicate reason comes after the row's field problems | negative | Unit | shared/domain/householdPreview.test.js::TC-03-C33 | Planned |
| TC-03-C34 | An already-in-directory row with other problems shows only the already reason | negative | Unit | shared/domain/householdPreview.test.js::TC-03-C34 | Planned |
| TC-03-C35 | Block prefixes "Blk" and "Block" in any case resolve to the plain block number | data integrity | Unit | shared/domain/householdPreview.test.js::TC-03-C35 | Planned |
| TC-03-C36 | Lot forms "12A", "12 a" and "Lot 12-A" resolve to Lot 12-A | data integrity | Unit | shared/domain/householdPreview.test.js::TC-03-C36 | Planned |
| TC-03-C37 | Blocks 1 and 999 are accepted | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C37 | Planned |
| TC-03-C38 | Invalid lot values are rejected with the lot reason | negative | Unit | shared/domain/householdFields.test.js::TC-03-C38 | Planned |
| TC-03-C39 | Lots 1, 9999 and a two-letter suffix are accepted and stored normalised | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C39 | Planned |
| TC-03-C40 | A lot value over 10 characters is refused before matching | boundary | Unit | shared/domain/householdPreview.test.js::TC-03-C40 | Planned |
| TC-03-C41 | Block "04" with Lot "12a" is the existing Blk 4 Lot 12-A | data integrity | Unit | shared/domain/householdPreview.test.js::TC-03-C41 | Planned |
| TC-03-C42 | The stored label is built from the normalised values | data integrity | Unit | shared/domain/lotKey.test.js::TC-03-C42 | Planned |
| TC-03-C43 | Out-of-range phase values are rejected with the phase reason | negative | Unit | shared/domain/householdFields.test.js::TC-03-C43 | Planned |
| TC-03-C44 | Phase 1 and Phase 4 are accepted | boundary | Unit | shared/domain/householdFields.test.js::TC-03-C44 | Planned |
| TC-03-D1 | While committing, the page shows a progress count, then the finished banner *(the one import Journey: choose file, preview, Import, banner, listed)* | happy path | Journey | ui/households-import.journey.spec.js::TC-03-D1 | Planned |
| TC-03-D2 | Pressing Import twice quickly imports each row once | concurrency | Unit | web/src/features/households/import-controller.test.js::TC-03-D2 | Planned |
| TC-03-D3 | A second commit call for a running import is refused by the server | concurrency | API | api/households-race.spec.js::TC-03-D3 | Planned |
| TC-03-D4 | While importing, the button reads "Importing…" and is disabled | usability | UI | ui/households-import.spec.js::TC-03-D4 | Planned (NG12 part not asserted) |
| TC-03-D5 | Two admins importing the same file at once store 623 households | concurrency | API | api/households-race.spec.js::TC-03-D5 | Planned |
| TC-03-D6 | Two racing imports' "Imported" counts add up to exactly 623 | concurrency | API | api/households-race.spec.js::TC-03-D6 | Planned |
| TC-03-D7 | Re-uploading the file after an interrupted import previews only the unwritten rows as ready | data integrity | API | api/households-import-preview.spec.js::TC-03-D7 | Planned |
| TC-03-D8 | A lot added by the form between preview and commit is counted as already at commit | stale reference | API | api/households-import-commit.spec.js::TC-03-D8 | Planned |
| TC-03-D9 | Form save and import commit on the same new lot at once store one household | concurrency | API | api/households-race.spec.js::TC-03-D9 | Planned |
| TC-03-D10 | Committing another staff member's previewed run is refused | security / role | API | api/households-import-runs.spec.js::TC-03-D10 | Planned |
| TC-03-D11 | Committing an unknown import id is refused | negative | API | api/households-import-runs.spec.js::TC-03-D11 | Planned |
| TC-03-D12 | Committing a completed run again is refused | negative | API | api/households-import-runs.spec.js::TC-03-D12 | Planned |
| TC-03-D13 | Uploading the same file again classifies every row as already in the directory | data integrity | API | api/households-import-preview.spec.js::TC-03-D13 | Planned |
| TC-03-D14 | A fixed rejected-rows file previews only the fixed rows as ready | integration | Unit | shared/domain/householdPreview.test.js::TC-03-D14 | Planned |
| TC-03-D15 | A re-import with changed names updates no existing household | data integrity | API | api/households-import-commit.spec.js::TC-03-D15 | Planned |
| TC-03-D16 | An inactive household's lot is classified as already in the directory (inactive) | data integrity | API | api/households-import-preview.spec.js::TC-03-D16 | Planned |
| TC-03-D17 | A household added by the form survives a later import of its lot unchanged | data integrity | API | api/households-import-commit.spec.js::TC-03-D17 | Planned |
| TC-03-D18 | The losing write of a form-versus-import race is refused as a duplicate | concurrency | API | api/households-race.spec.js::TC-03-D18 | Planned |
| TC-03-D19 | Committing the fixed file adds exactly the three fixed rows | integration | API | api/households-import-commit.spec.js::TC-03-D19 | Planned |
| TC-03-D20 | A re-import with changed names classifies every row as already in the directory | data integrity | Unit | shared/domain/householdPreview.test.js::TC-03-D20 | Planned |
| TC-03-D21 | An import never creates or reactivates a household on an inactive lot | data integrity | API | api/households-import-commit.spec.js::TC-03-D21 | Planned |
| TC-03-D22 | Each racing import reports every row it did not write as already in the directory | concurrency | API | api/households-race.spec.js::TC-03-D22 | Planned |
| TC-03-D23 | Committing the re-upload after an interruption leaves exactly 623 households | data integrity | API | api/households-import-runs.spec.js::TC-03-D23 | Planned |
| TC-03-D24 | Rows written before an interruption stay written | data integrity | API | api/households-import-runs.spec.js::TC-03-D24 | Planned |
| TC-03-D25 | A running import with no progress for 15 minutes is marked interrupted | boundary | API | api/households-import-runs.spec.js::TC-03-D25 | Planned (NG9 part not asserted) |
| TC-03-D26 | A running import with progress in the last 15 minutes is not marked interrupted | boundary | API | api/households-import-runs.spec.js::TC-03-D26 | Planned (NG9 part not asserted) |
| TC-03-D27 | Committing an interrupted run is refused | negative | API | api/households-import-runs.spec.js::TC-03-D27 | Planned |
| TC-03-D28 | Committing a cancelled run is refused | negative | API | api/households-import-runs.spec.js::TC-03-D28 | Planned |
| TC-03-D29 | A previewed run 59 minutes old can still be committed | boundary | API | api/households-import-runs.spec.js::TC-03-D29 | Planned (NG9 part not asserted) |
| TC-03-D30 | A previewed run 61 minutes old can't be committed | boundary | API | api/households-import-runs.spec.js::TC-03-D30 | Planned (NG9, NG13 part not asserted) |
| TC-03-D31 | Cancel on the preview marks the run cancelled and deletes its rejected rows at once | data integrity | API | api/households-import-runs.spec.js::TC-03-D31 | Planned |
| TC-03-D32 | "Choose a different file" cancels the run the same way | data integrity | UI | ui/households-import.spec.js::TC-03-D32 | Planned |
| TC-03-D33 | The run's progress count rises while it commits | data integrity | API | api/households-import-runs.spec.js::TC-03-D33 | Planned |
| TC-03-E1 | The download holds exactly the rejected rows with their reasons | happy path | Unit | shared/domain/rejectedRowsCsv.test.js::TC-03-E1 | Planned |
| TC-03-E2 | Already-in-directory rows are not in the download | negative | Unit | shared/domain/rejectedRowsCsv.test.js::TC-03-E2 | Planned |
| TC-03-E3 | Cells starting with "=", "+", "-" or "@" are escaped in the download file | security / role | Unit | shared/domain/rejectedRowsCsv.test.js::TC-03-E3 | Planned |
| TC-03-E4 | A "+639…" mobile in the download is accepted again after a fix | usability | Unit | shared/domain/rejectedRowsCsv.test.js::TC-03-E4 | Planned |
| TC-03-E5 | The download is UTF-8 and keeps "ñ" | data integrity | Unit | shared/domain/rejectedRowsCsv.test.js::TC-03-E5 | Planned |
| TC-03-E6 | Board, Guard and Homeowner can't read an import run's rejected rows | security / role | API | api/rules-households.spec.js::TC-03-E6 | Planned |
| TC-03-E7 | Escaped cells don't evaluate as formulas when the download is opened in a spreadsheet app | security / role | Manual | Manual: open the download in Excel and Google Sheets::TC-03-E7 | Planned |
| TC-03-E8 | The download's Reason column joins a row's reasons with "; " as the preview does | data integrity | Unit | shared/domain/rejectedRowsCsv.test.js::TC-03-E8 | Planned |
| TC-03-E9 | Another staff member can't read an import run they didn't start | security / role | API | api/rules-households.spec.js::TC-03-E9 | Planned |
| TC-03-E10 | The staff member who ran an import can read it | security / role | API | api/rules-households.spec.js::TC-03-E10 | Planned |
| TC-03-E11 | Step 1 shows each staff member only their own last import | security / role | API | api/households-import-runs.spec.js::TC-03-E11 | Planned |
| TC-03-E12 | A value stored as "=…" is escaped again on the next download | security / role | Unit | shared/domain/rejectedRowsCsv.test.js::TC-03-E12 | Planned |
| TC-03-F1 | Adding Block 8 Lot 2 stores one household with link status "Not invited" | happy path | API | api/households-create.spec.js::TC-03-F1 | Planned |
| TC-03-F2 | Mobile and phase from the Add form are stored | integration | API | api/households-create.spec.js::TC-03-F2 | Planned |
| TC-03-F3 | The form's lot check reports an existing lot as taken before Save | negative | API | api/households-create.spec.js::TC-03-F3 | Planned |
| TC-03-F4 | A forced save of a duplicate lot is refused by the server | data integrity | API | api/households-create.spec.js::TC-03-F4 | Planned |
| TC-03-F5 | Double-tapping Save creates one household | concurrency | Unit | web/src/features/households/household-dialog-controller.test.js::TC-03-F5 | Planned |
| TC-03-F6 | Two admins saving a new Blk 9 Lot 1 at once store exactly one household | concurrency | API | api/households-race.spec.js::TC-03-F6 | Planned |
| TC-03-F7 | Leaving an empty required field shows a text message under it | usability | UI | ui/household-dialog.spec.js::TC-03-F7 | Planned |
| TC-03-F8 | The form's email check rejects an invalid email by the import's rule | negative | API | api/households-create.spec.js::TC-03-F8 | Planned |
| TC-03-F9 | Adding the lot of an inactive household is refused with the inactive result | negative | API | api/households-create.spec.js::TC-03-F9 | Planned |
| TC-03-F10 | After Save the Add dialog closes and the new household is listed | ui/ux | UI | ui/households-directory.spec.js::TC-03-F10 | Planned |
| TC-03-F11 | The edit form shows back the mobile and phase entered on Add | ui/ux | UI | ui/household-dialog.spec.js::TC-03-F11 | Planned |
| TC-03-F12 | Save is disabled while an add is in flight | usability | Unit | web/src/features/households/household-dialog-controller.test.js::TC-03-F12 | Planned |
| TC-03-F13 | The losing add of two simultaneous saves is refused as a duplicate | concurrency | API | api/households-race.spec.js::TC-03-F13 | Planned |
| TC-03-F14 | A household with no block, lot or owner name is refused by validation | negative | API | api/households-create.spec.js::TC-03-F14 | Planned |
| TC-03-F15 | An invalid email on the form shows the import's reason under Email | ui/ux | UI | ui/household-dialog.spec.js::TC-03-F15 | Planned |
| TC-03-F16 | The form applies the import's normalisation when checking for a duplicate | data integrity | API | api/households-create.spec.js::TC-03-F16 | Planned |
| TC-03-F17 | The form stores normalised block, lot and label | data integrity | API | api/households-create.spec.js::TC-03-F17 | Planned |
| TC-03-F18 | An 81-character owner name is refused by the server on add | boundary | API | api/households-create.spec.js::TC-03-F18 | Planned (NG15 part not asserted) |
| TC-03-F19 | The form rejects invalid block and lot values by the import's rule | negative | API | api/households-create.spec.js::TC-03-F19 | Planned |
| TC-03-G1 | A mobile edit stores the new number on the contact record | happy path | API | api/households-update.spec.js::TC-03-G1 | Planned |
| TC-03-G2 | The edit writes one activity record with who and when | data integrity | API | api/households-update.spec.js::TC-03-G2 | Planned |
| TC-03-G3 | The edit's audit record holds ids only | data integrity | API | api/households-update.spec.js::TC-03-G3 | Planned |
| TC-03-G4 | Renaming the owner makes the new name searchable and the old one not | integration | API | api/households-queries.spec.js::TC-03-G4 | Planned |
| TC-03-G5 | Clearing the email removes it from the contact record | boundary | API | api/households-update.spec.js::TC-03-G5 | Planned |
| TC-03-G6 | The second of two edits loaded at the same time is refused as stale | concurrency | API | api/households-update.spec.js::TC-03-G6 | Planned |
| TC-03-G7 | The first editor's change is kept after a stale save | data integrity | API | api/households-update.spec.js::TC-03-G7 | Planned |
| TC-03-G8 | The same admin editing in two tabs is refused as stale on the second save | stale reference | API | api/households-update.spec.js::TC-03-G8 | Planned |
| TC-03-G9 | Saving an edit on a household deactivated meanwhile is refused | stale reference | API | api/households-update.spec.js::TC-03-G9 | Planned |
| TC-03-G10 | Double-tapping Save on an edit writes one change | concurrency | Unit | web/src/features/households/household-dialog-controller.test.js::TC-03-G10 | Planned |
| TC-03-G11 | A confirmed lot change stores the household under the new lot with the same id | happy path | API | api/households-update.spec.js::TC-03-G11 | Planned |
| TC-03-G12 | An edit request without the loaded time is refused | security / role | API | api/households-update.spec.js::TC-03-G12 | Planned |
| TC-03-G13 | The list shows the edited mobile without a reload | ui/ux | UI | ui/households-directory.spec.js::TC-03-G13 | Planned |
| TC-03-G14 | A double-tapped edit shows its author no stale-edit message | usability | Unit | web/src/features/households/household-dialog-controller.test.js::TC-03-G14 | Planned |
| TC-03-G15 | A lot change keeps the household's members and link status | data integrity | API | api/households-update.spec.js::TC-03-G15 | Planned |
| TC-03-G16 | A lot change keeps an unused invitation working for the same household | integration | API | api/households-invites.spec.js::TC-03-G16 | Planned (NG7 part not asserted) |
| TC-03-G17 | A lot change writes one `household.relotted` record and keeps the household's earlier history | data integrity | API | api/households-update.spec.js::TC-03-G17 | Planned |
| TC-03-G18 | After a lot change the old lot can be added again | happy path | API | api/households-create.spec.js::TC-03-G18 | Planned |
| TC-03-G19 | A lot change leaves exactly one lot entry for the household, at the new lot | data integrity | API | api/households-update.spec.js::TC-03-G19 | Planned |
| TC-03-G20 | A lot change to a lot already in the directory is refused and moves nothing | negative | API | api/households-update.spec.js::TC-03-G20 | Planned |
| TC-03-G21 | Cancel on the "Change lot" confirm leaves the lot unchanged | negative | UI | ui/household-dialog.spec.js::TC-03-G21 | Planned |
| TC-03-G22 | A lot change saved after someone else's edit is refused as stale and moves nothing | stale reference | API | api/households-update.spec.js::TC-03-G22 | Planned |
| TC-03-G23 | An edit loaded before someone else's lot change is refused as stale | stale reference | API | api/households-update.spec.js::TC-03-G23 | Planned |
| TC-03-G24 | Two households moved to the same free lot at once: exactly one moves | concurrency | API | api/households-race.spec.js::TC-03-G24 | Planned |
| TC-03-G25 | Changing the block moves the lot the same way | happy path | API | api/households-update.spec.js::TC-03-G25 | Planned |
| TC-03-G26 | A lot change to an inactive household's lot is refused | negative | API | api/households-update.spec.js::TC-03-G26 | Planned (NG6 part not asserted) |
| TC-03-G27 | A lot change that normalises to the current lot moves nothing | boundary | API | api/households-update.spec.js::TC-03-G27 | Planned (NG6 part not asserted) |
| TC-03-G28 | An inactive household's edit is saved and it stays inactive | happy path | API | api/households-update.spec.js::TC-03-G28 | Planned |
| TC-03-G29 | After a lot change the list shows the new label without a reload | ui/ux | UI | ui/households-directory.spec.js::TC-03-G29 | Planned |
| TC-03-H1 | The Deactivate confirm reads the copy of record | ui/ux | UI | ui/household-dialog.spec.js::TC-03-H1 | Planned |
| TC-03-H2 | Confirming Deactivate stores the household as inactive | happy path | API | api/households-active.spec.js::TC-03-H2 | Planned |
| TC-03-H3 | A deactivated household's records are kept | data integrity | API | api/households-active.spec.js::TC-03-H3 | Planned |
| TC-03-H4 | Deactivating stops the household's unused invitation | integration | API | api/invites-redeem.spec.js::TC-04-J13 | Covered by TC-04-J13: no new test · Planned |
| TC-03-H5 | Deactivate writes one `household.deactivated` record | data integrity | API | api/households-active.spec.js::TC-03-H5 | Planned |
| TC-03-H6 | After Reactivate the default list includes the household and the Inactive filter doesn't | happy path | API | api/households-active.spec.js::TC-03-H6 | Planned |
| TC-03-H7 | Reactivate keeps the name, contacts and members | data integrity | API | api/households-active.spec.js::TC-03-H7 | Planned |
| TC-03-H8 | Reactivate doesn't bring a cancelled invitation back | integration | API | api/invites-redeem.spec.js::TC-04-J16 | Covered by TC-04-J16: no new test · Blocked on TC-04 G-5 (see TC-03 QE findings) |
| TC-03-H9 | Double-tapping Deactivate's confirm writes one change | concurrency | Unit | web/src/features/households/household-dialog-controller.test.js::TC-03-H9 | Planned |
| TC-03-H10 | Deactivate on an inactive household or Reactivate on an active one is refused with no record | negative | API | api/households-active.spec.js::TC-03-H10 | Planned |
| TC-03-H11 | Deactivating a "Not invited" household changes only its active state | boundary | API | api/households-active.spec.js::TC-03-H11 | Planned |
| TC-03-H12 | Deactivating an "Invite expired" household keeps the code refused | boundary | API | api/households-active.spec.js::TC-03-H12 | Planned |
| TC-03-H13 | An inactive household's row offers only Reactivate | ui/ux | UI | ui/households-directory.spec.js::TC-03-H13 | Planned |
| TC-03-H14 | Deactivating a "Linked" household leaves its member records in place | boundary | API | api/households-active.spec.js::TC-03-H14 | Planned |
| TC-03-H15 | Cancel on the Deactivate confirm leaves the household active | negative | UI | ui/household-dialog.spec.js::TC-03-H15 | Planned |
| TC-03-H16 | The default list excludes an inactive household and the Inactive filter includes it | integration | API | api/households-queries.spec.js::TC-03-H16 | Planned |
| TC-03-H17 | After a deactivation the Inactive chip rises by one and All falls by one, without a reload | ui/ux | UI | ui/households-directory.spec.js::TC-03-H17 | Planned |
| TC-03-H18 | Reactivate writes one `household.reactivated` record | data integrity | API | api/households-active.spec.js::TC-03-H18 | Planned |
| TC-03-H19 | A reactivated household that still has members gets link status "Linked" | integration | API | api/households-active.spec.js::TC-03-H19 | Planned |
| TC-03-H20 | A reactivated household with no members gets link status "Not invited" | integration | API | api/households-active.spec.js::TC-03-H20 | Planned |
| TC-03-H21 | An invitation for an inactive household is refused by the server | security / role | API | api/invites-create.spec.js::TC-04-J17 | Covered by TC-04-J17: no new test · Planned · *provisional* |
| TC-03-H22 | An inactive household can't be selected for "Invite selected" | negative | UI | ui/households-directory.spec.js::TC-03-H22 | Planned |
| TC-03-H23 | Undo on the deactivate toast within 10 seconds makes the household active again | happy path | Blocked | — | Blocked on NG8 |
| TC-03-H24 | Cancel on the Reactivate confirm leaves the household inactive | negative | UI | ui/household-dialog.spec.js::TC-03-H24 | Planned |
| TC-03-H25 | Deactivate and Reactivate each update the household's last-changed time | data integrity | API | api/households-active.spec.js::TC-03-H25 | Planned |
| TC-03-J1 | A search for "blk 4" returns every Block 4 household | happy path | API | api/households-queries.spec.js::TC-03-J1 | Planned |
| TC-03-J2 | A search for "blk 4" returns no household from Blocks 40 to 49 or Blk 14 | boundary | Unit | shared/domain/householdSearch.test.js::TC-03-J2 | Planned |
| TC-03-J3 | Typing re-renders only the list, keeping focus and text | usability | UI | ui/households-directory.spec.js::TC-03-J3 | Planned |
| TC-03-J4 | A search for "santos" returns every owner with the word Santos in the name | happy path | Unit | shared/domain/householdSearch.test.js::TC-03-J4 | Planned |
| TC-03-J5 | A search for "santos" also returns "Santoson", a word starting with it | boundary | Unit | shared/domain/householdSearch.test.js::TC-03-J5 | Planned |
| TC-03-J6 | Search ignores letter case | boundary | Unit | shared/domain/householdSearch.test.js::TC-03-J6 | Planned |
| TC-03-J7 | "peña", "pena" and "PENA" all return "ZZ Test Peña" | boundary | Unit | shared/domain/householdSearch.test.js::TC-03-J7 | Planned |
| TC-03-J8 | A search with no match reads the copy of record, distinct from the empty directory | ui/ux | UI | ui/households-directory.spec.js::TC-03-J8 | Planned |
| TC-03-J9 | The empty directory shows the empty state and its three actions | ui/ux | UI | ui/households-directory.spec.js::TC-03-J9 | Planned |
| TC-03-J10 | The first page holds 50 households and the 51st is on the next page | boundary | API | api/households-queries.spec.js::TC-03-J10 | Planned |
| TC-03-J11 | Opening the directory reads about one page, not every household | data integrity | API | api/households-queries.spec.js::TC-03-J11 | Planned |
| TC-03-J12 | Search results over 50 page the same way | boundary | API | api/households-queries.spec.js::TC-03-J12 | Planned |
| TC-03-J13 | An inactive household is excluded from search under All and found under Inactive | integration | API | api/households-queries.spec.js::TC-03-J13 | Planned |
| TC-03-J14 | Each filter chip's count matches the rows it lists | integration | UI | ui/invite-directory-counts.exclusive.spec.js::TC-04-S10 | Covered by TC-04-S10: no new test · Blocked on TC-04 G-3 |
| TC-03-J15 | With exactly 50 households no next-page control is offered | ui/ux | UI | ui/households-directory.spec.js::TC-03-J15 | Planned |
| TC-03-J16 | A search for "tos" returns no Santos (no match inside a word) | boundary | Unit | shared/domain/householdSearch.test.js::TC-03-J16 | Planned |
| TC-03-J17 | A search for "san" returns every name with a word starting "San" | boundary | Unit | shared/domain/householdSearch.test.js::TC-03-J17 | Planned |
| TC-03-J18 | A search for "peña" also returns a name typed without the ñ | boundary | Unit | shared/domain/householdSearch.test.js::TC-03-J18 | Planned |
| TC-03-J19 | The lot forms "block 4", "b4" and "4" return the same Block 4 set as "blk 4" | boundary | Unit | shared/domain/householdSearch.test.js::TC-03-J19 | Planned |
| TC-03-J20 | The lot forms "blk 4 lot 12", "b4 l12" and "4-12" return Blk 4 Lot 12 and no other Block 4 lot | boundary | Unit | shared/domain/householdSearch.test.js::TC-03-J20 | Planned (NG5 part not asserted) |
| TC-03-J21 | A two-word name search returns the owner whose words start with both | boundary | Unit | shared/domain/householdSearch.test.js::TC-03-J21 | Planned (NG4 part not asserted) |
| TC-03-J22 | The All chip and the heading count active households only; Inactive counts its own | integration | API | api/households-queries.spec.js::TC-03-J22 | Planned |
| TC-03-J23 | "Clear search" restores the unfiltered list within the chosen chip | usability | UI | ui/households-directory.spec.js::TC-03-J23 | Planned |
| TC-03-K1 | On a 375 px phone each household shows as a card with lot, owner, link status and balance | responsive | UI *(mobile)* | ui/households-phone.spec.js::TC-03-K1 | Planned · fails until DEF-001 is fixed |
| TC-03-K2 | The phone directory doesn't scroll sideways | responsive | UI *(mobile)* | ui/households-phone.spec.js::TC-03-K2 | Planned · fails until DEF-001 is fixed |
| TC-03-K3 | Balance shows "—" before the first billing run, not ₱0 | boundary | Unit | shared/domain/money.test.js::TC-03-K3 | Planned |
| TC-03-K4 | 640 px shows cards; 641 px shows the table | responsive | UI *(mobile)* | ui/households-phone.spec.js::TC-03-K4 | Planned · fails until DEF-001 is fixed |
| TC-03-K5 | On a phone the import page says "Import works best on a computer" | responsive | UI *(mobile)* | ui/households-phone.spec.js::TC-03-K5 | Planned |
| TC-03-K6 | The Add dialog is usable at 375 px | responsive | Manual | Manual: real phone keyboard::TC-03-K6 | Planned |
| TC-03-K7 | Loading shows a skeleton, never a flash of the empty state | ui/ux | UI | ui/households-directory.spec.js::TC-03-K7 | Planned |
| TC-03-K8 | A network error on Import keeps the preview | ui/ux | UI | ui/households-import.spec.js::TC-03-K8 | Planned |
| TC-03-K9 | A click outside the Add dialog keeps it open with the typed name | usability | UI | ui/household-dialog.spec.js::TC-03-K9 | Planned |
| TC-03-K10 | A click outside the Edit dialog keeps unsaved changes | usability | UI | ui/household-dialog.spec.js::TC-03-K10 | Planned |
| TC-03-K11 | Escape on a half-filled dialog asks "Discard your changes to this household?" with "Keep editing" focused | usability | UI | ui/household-dialog.spec.js::TC-03-K11 | Planned (NG14 part not asserted) |
| TC-03-K12 | An important-announcement pop-up doesn't break the preview or Add dialog | usability | UI | ui/household-dialog.spec.js::TC-03-K12 | Planned |
| TC-03-K13 | Link status pills carry words and meet AA contrast | ui/ux | UI | ui/invite-directory.spec.js::TC-04-Q9 | Covered by TC-04-Q9: no new test · Planned |
| TC-03-K14 | The preview table has a caption, row numbers and text reasons | ui/ux | UI | ui/households-import.spec.js::TC-03-K14 | Planned |
| TC-03-K15 | The whole import works by keyboard with a visible file-input label | usability | UI | ui/households-import.spec.js::TC-03-K15 | Planned |
| TC-03-K16 | Form errors are announced and Save moves focus to the first error | usability | UI | ui/household-dialog.spec.js::TC-03-K16 | Planned |
| TC-03-K17 | Buttons and chips are at least 24 × 24 px on a phone | usability | UI *(mobile)* | ui/households-phone.spec.js::TC-03-K17 | Planned |
| TC-03-K18 | The same concept uses the same word on every screen size *(scope: button labels; pill words are TC-04-R3)* | ui/ux | UI | ui/households-directory.spec.js::TC-03-K18 | Planned |
| TC-03-K19 | The page heading reads "Homeowners · {n} households" with the stored count | ui/ux | UI | ui/households-counts.exclusive.spec.js::TC-03-K19 | Planned |
| TC-03-K20 | The preview heading and Import button read the copy of record with the preview's counts | ui/ux | UI | ui/households-import.spec.js::TC-03-K20 | Planned |
| TC-03-K21 | Each preview row reason reads the copy of record | ui/ux | Unit | shared/domain/householdMessages.test.js::TC-03-K21 | Planned |
| TC-03-K22 | The finished banner reads the copy of record with the run's counts | ui/ux | UI | ui/households-import.spec.js::TC-03-K22 | Planned (NG2 part not asserted) |
| TC-03-K23 | The duplicate-lot message reads "{lot} is already in the directory." under Lot and Save is disabled | ui/ux | UI | ui/household-dialog.spec.js::TC-03-K23 | Planned |
| TC-03-K24 | The stale-edit message reads the copy of record and the dialog keeps the typing | ui/ux | UI | ui/household-dialog.spec.js::TC-03-K24 | Planned |
| TC-03-K25 | The import hint and the directory buttons read the copy of record | ui/ux | UI | ui/households-directory.spec.js::TC-03-K25 | Planned |
| TC-03-K26 | An import run from a phone stores the file's households | responsive | UI *(mobile)* | ui/households-phone.spec.js::TC-03-K26 | Planned |
| TC-03-K27 | Ignored columns are named above the tiles, except our own Row and Reason | ui/ux | UI | ui/households-import.spec.js::TC-03-K27 | Planned |
| TC-03-K28 | Adding an inactive household's lot shows the inactive duplicate message under Lot | ui/ux | UI | ui/household-dialog.spec.js::TC-03-K28 | Planned |
| TC-03-K29 | The lot change confirm reads the copy of record | ui/ux | UI | ui/household-dialog.spec.js::TC-03-K29 | Planned |
| TC-03-K30 | The Reactivate confirm reads the copy of record, with and without linked members | ui/ux | UI | ui/household-dialog.spec.js::TC-03-K30 | Planned (NG2 part not asserted) |
| TC-03-K31 | A stale Deactivate or Reactivate says the household is already in that state and refreshes the list | ui/ux | UI | ui/household-dialog.spec.js::TC-03-K31 | Planned |
| TC-03-K32 | A stale invite on an inactive household reads the copy of record | ui/ux | UI | ui/households-directory.spec.js::TC-03-K32 | Planned |
| TC-03-K33 | The deactivate and reactivate toasts read the copy of record | ui/ux | UI | ui/households-directory.spec.js::TC-03-K33 | Planned |
| TC-03-K34 | The household dialog shows the lot as its title and the r4 buttons, active and inactive | ui/ux | UI | ui/household-dialog.spec.js::TC-03-K34 | Planned |
| TC-03-K35 | Escape on a dialog with no changes closes it | navigation | UI | ui/household-dialog.spec.js::TC-03-K35 | Planned |
| TC-03-K36 | The × button on a dialog with unsaved changes asks the same as Escape | usability | UI | ui/household-dialog.spec.js::TC-03-K36 | Planned |
| TC-03-K37 | Cancel on a dialog with unsaved changes closes it without asking | usability | UI | ui/household-dialog.spec.js::TC-03-K37 | Planned |
| TC-03-K38 | Discard on the discard confirm closes the dialog and saves nothing | usability | UI | ui/household-dialog.spec.js::TC-03-K38 | Planned |
| TC-03-K39 | "Keep editing" returns to the dialog with the typing intact | usability | UI | ui/household-dialog.spec.js::TC-03-K39 | Planned |
| TC-03-K40 | At 320 px the two directory buttons fit side by side or stack full width with Add household first | responsive | UI *(mobile)* | ui/households-phone.spec.js::TC-03-K40 | Planned · fails until DEF-001 is fixed |
| TC-03-K41 | Counts follow the count rule: singular for 1, zero parts dropped, a comma from 1,000 | ui/ux | Unit | shared/domain/householdMessages.test.js::TC-03-K41 | Planned (NG2 part not asserted) |
| TC-03-K42 | Already-in-directory rows are listed in row order with muted reasons that are words, not colour alone | ui/ux | UI | ui/households-import.spec.js::TC-03-K42 | Planned |
| TC-03-K43 | During a commit the page shows "Importing… {x} of {n}" and asks to keep the page open | ui/ux | UI | ui/households-import.spec.js::TC-03-K43 | Planned (NG12 part not asserted) |
| TC-03-K44 | A failed commit call shows how many households were imported and how to finish | ui/ux | UI | ui/households-import.spec.js::TC-03-K44 | Planned |
| TC-03-K45 | If the run can't be read after a failure, the page says the import may not have finished | ui/ux | UI | ui/households-import.spec.js::TC-03-K45 | Planned |
| TC-03-K46 | After an interrupted import, step 1 shows the stopped message the next time | ui/ux | UI | ui/households-import.spec.js::TC-03-K46 | Planned |
| TC-03-K47 | Step 1 shows "Your last import" with a download link within 30 days | ui/ux | UI | ui/households-import.spec.js::TC-03-K47 | Planned (NG10 part not asserted) |
| TC-03-K48 | After 30 days "Your last import" drops the download | ui/ux | UI | ui/households-import.spec.js::TC-03-K48 | Planned (NG10 part not asserted) |
| TC-03-L1 | Admin reaches Homeowners from the menu with that item highlighted | navigation | UI | ui/households-access.spec.js::TC-03-L1 | Planned |
| TC-03-L2 | Treasurer reaches Homeowners from the menu | navigation | UI | ui/households-access.spec.js::TC-03-L2 | Planned |
| TC-03-L3 | "Choose a different file" returns to step 1 | navigation | UI | ui/households-import.spec.js::TC-03-L3 | Planned |
| TC-03-L4 | Cancel on the preview returns to Homeowners | navigation | UI | ui/households-import.spec.js::TC-03-L4 | Planned |
| TC-03-L5 | After the import finishes, the admin is on Homeowners with the banner | navigation | UI | ui/households-import.spec.js::TC-03-L5 | Planned |
| TC-03-L6 | Browser Back after a finished import doesn't import again | navigation | UI | ui/households-import.spec.js::TC-03-L6 | Planned |
| TC-03-L7 | Reloading on the preview returns to step 1 with an empty file input and no message | navigation | UI | ui/households-import.spec.js::TC-03-L7 | Planned |
| TC-03-L8 | After Save in Add, the list keeps its search and filter | navigation | UI | ui/households-directory.spec.js::TC-03-L8 | Planned |
| TC-03-L9 | A board member opening the Homeowners address gets the no-access page, with no rows shown first *(scope: no rows rendered before the no-access page; the route rule is TC-02-G7)* | navigation | UI | ui/households-access.spec.js::TC-03-L9 | Planned |
| TC-03-L10 | A guard opening the Homeowners or Import address gets the no-access page *(scope: Import address; the Homeowners address is TC-02-G8)* | navigation | Unit | route-access.test.js::TC-03-L10 | Planned |
| TC-03-L11 | A homeowner opening the Homeowners or Import address gets the no-access page *(scope: Import address; the Homeowners address is TC-04-P11)* | navigation | Unit | route-access.test.js::TC-03-L11 | Planned |
| TC-03-L12 | A user with no role or household gets the "not linked" screen, never the directory | navigation | Unit | route-access.test.js::TC-03-L12 | Planned |
| TC-03-L13 | In "My household" view the treasurer-homeowner has no Homeowners item | navigation | Unit | menu.test.js::TC-02-F3 | Covered by TC-02-F3: no new test · Planned |
| TC-03-L14 | Homeowners is absent from the Board, Guard and Homeowner menus | navigation | Unit | menu.test.js::TC-02-A2, TC-02-A8, TC-02-A9 | Covered by TC-02-A2, A8, A9: no new test · Planned |
| TC-03-L15 | Reloading on the preview stores no household and leaves the run previewed | data integrity | API | api/households-import-runs.spec.js::TC-03-L15 | Planned |
| TC-03-L16 | The lot label button opens the household dialog, by mouse and by keyboard | navigation | UI | ui/households-directory.spec.js::TC-03-L16 | Planned |
| TC-03-L17 | Clicking elsewhere on a row opens the same household dialog | navigation | UI | ui/households-directory.spec.js::TC-03-L17 | Planned |
| TC-03-L18 | On a phone the card's "Open" opens the household dialog | navigation | UI *(mobile)* | ui/households-phone.spec.js::TC-03-L18 | Planned · fails until DEF-001 is fixed |
| TC-03-L19 | After a confirmed Deactivate the dialog closes and the list refreshes in place | navigation | UI | ui/households-directory.spec.js::TC-03-L19 | Planned |
| TC-03-M1 | A board member's request for the household list is refused | security / role | API | rules-roles.spec.js::TC-02-B30 | Covered by TC-02-B30: no new test · Planned |
| TC-03-M2 | A board member's request for a household's contacts is refused | security / role | API | rules-roles.spec.js::TC-02-B31 | Covered by TC-02-B31: no new test · Planned |
| TC-03-M3 | A guard's request for the household list is refused | security / role | API | rules-roles.spec.js::TC-02-B37 | Covered by TC-02-B37: no new test · Planned |
| TC-03-M4 | A guard's request for any household's contacts is refused | security / role | API | api/rules-households.spec.js::TC-03-M4 | Planned |
| TC-03-M5 | A homeowner's request for their own household's contacts is refused | security / role | API | api/members-remove.spec.js::TC-04-K13 | Covered by TC-04-K13: no new test · Planned |
| TC-03-M6 | A homeowner's request for another household is refused | security / role | API | rules-roles.spec.js::TC-02-B2 | Covered by TC-02-B2: no new test · Planned |
| TC-03-M7 | A homeowner's query for the household list is refused | security / role | API | rules-roles.spec.js::TC-02-B3 | Covered by TC-02-B3: no new test · Planned |
| TC-03-M8 | Create, update and set-active calls are refused for Board, Guard, Homeowner and No-role *(scope: Guard, Homeowner, No-role; Board is TC-02-C12)* | security / role | API | api/households-callables-roles.spec.js::TC-03-M8 | Planned |
| TC-03-M9 | Import preview and commit calls are refused for Board, Guard, Homeowner and No-role | security / role | API | api/households-callables-roles.spec.js::TC-03-M9 | Planned |
| TC-03-M10 | A direct client write to a household is refused, even for an admin | security / role | API | api/rules-households.spec.js::TC-03-M10 | Planned |
| TC-03-M11 | Direct client writes to lots, contacts and import runs are refused for every role | security / role | API | api/rules-households.spec.js::TC-03-M11 | Planned |
| TC-03-M12 | A removed admin holding a valid token is refused the list and contacts *(scope: contacts half; the list half is TC-02-B44)* | security / role | API | api/rules-households.spec.js::TC-03-M12 | Planned |
| TC-03-M13 | Admin and treasurer may read the list and contacts *(scope: treasurer contacts half; admin list and contacts and treasurer list are TC-02-B13, B14, B23)* | security / role | API | api/rules-households.spec.js::TC-03-M13 | Planned |
| TC-03-M14 | A signed-out request for any household collection is refused | security / role | API | rules-roles.spec.js::TC-02-B50 | Covered by TC-02-B50: no new test · Planned |
| TC-03-M15 | Board, Guard and Homeowner reads of import runs are refused | security / role | API | api/rules-households.spec.js::TC-03-M15 | Planned |
| TC-03-M16 | Household audit records are readable by treasurer and board | security / role | API | rules-roles.spec.js::TC-02-B29, TC-02-B32 | Covered by TC-02-B29, B32: no new test · Planned |
| TC-03-M17 | Admin office staff and guards can't read household audit records *(scope: admin office half; the guard half is TC-02-B39)* | security / role | API | api/rules-households.spec.js::TC-03-M17 | Planned |
| TC-03-N1 | No household document holds an email or mobile | data integrity | API | api/households-privacy.spec.js::TC-03-N1 | Planned |
| TC-03-N2 | A homeowner's own household record carries no contacts | data integrity | API | api/households-privacy.spec.js::TC-03-N2 | Planned |
| TC-03-N3 | Every mobile is stored in one format | data integrity | Unit | shared/domain/householdFields.test.js::TC-03-N3 | Planned |
| TC-03-N4 | Each imported household has one lot entry and one contact record | data integrity | API | api/households-integrity.spec.js::TC-03-N4 | Planned |
| TC-03-N5 | Adding a household writes one `household.created` record | data integrity | API | api/households-create.spec.js::TC-03-N5 | Planned |
| TC-03-N6 | An import writes one completion record carrying its three counts | data integrity | API | api/households-import-commit.spec.js::TC-03-N6 | Planned |
| TC-03-N7 | Household audit records hold no names, emails or mobiles | data integrity | API | api/households-privacy.spec.js::TC-03-N7 | Planned |
| TC-03-N8 | Function logs after an import hold no row data | data integrity | API | api/households-privacy.spec.js::TC-03-N8 | Planned |
| TC-03-N9 | The uploaded file itself is not stored | data integrity | API | api/households-privacy.spec.js::TC-03-N9 | Planned |
| TC-03-N10 | Rejected rows are deleted from an import run after 30 days | data integrity | API | api/households-import-runs.spec.js::TC-03-N10 | Planned |
| TC-03-N11 | Personal data never appears in the address bar | data integrity | UI | ui/households-directory.spec.js::TC-03-N11 | Planned |
| TC-03-N12 | A homeowner's read of their own household is allowed | security / role | API | rules-roles.spec.js::TC-02-B1 | Covered by TC-02-B1: no new test · Planned |
| TC-03-P1 | An invitation for an imported household goes to its contact email | integration | API | api/households-invites.spec.js::TC-03-P1 | Deferred: Step 2 (email provider) |
| TC-03-P2 | An edited contact email is used by the next invitation | integration | API | api/households-invites.spec.js::TC-03-P2 | Deferred: Step 2 (email provider) |
| TC-03-P3 | The join screen shows the current owner name after an edit | integration | API | api/invites-redeem.spec.js::TC-04-C15 | Covered by TC-04-C15: no new test · Planned |
| TC-03-P4 | Editing a household doesn't reset its link status or member count | integration | API | api/households-update.spec.js::TC-03-P4 | Planned |
| TC-03-P5 | A household with no email counts in REQ-004's "have no email" figure | integration | UI | ui/bulk-invite.spec.js::TC-04-H1 | Covered by TC-04-H1: no new test · Deferred: Step 2 (email provider) |
| TC-03-P6 | The heading count updates after add, import, deactivate and reactivate without a reload | integration | UI | ui/households-counts.exclusive.spec.js::TC-03-P6 | Planned |
| TC-03-P7 | The admin dashboard's household count matches the directory after an import | integration | UI | ui/households-counts.exclusive.spec.js::TC-03-P7 | Planned |
| TC-03-Q1 | The real directory holds none of the mock-up's 20 sample households | back-compat | API (staging) | staging/households-empty.staging.spec.js::TC-03-Q1 | Planned |
| TC-03-Q2 | An edit to a household with no phase saves and leaves the phase not set | back-compat | Blocked | — | Blocked on decision 2 (admin office) |
| TC-03-Q3 | A household doc without link status or member count renders as "Not invited" | back-compat | UI | ui/invite-directory.spec.js::TC-04-S1 | Covered by TC-04-S1: no new test · Planned |
| TC-03-Q4 | A household doc without link status is counted under "Not invited" | back-compat | API | api/households-queries.spec.js::TC-03-Q4 | Planned |
| TC-03-X1 | Charter: break the import with messy spreadsheets (45 min) | exploratory | Manual | Manual: exploratory charter::TC-03-X1 | Planned |
| TC-03-X2 | Charter: two staff, one directory (30 min) | exploratory | Manual | Manual: exploratory charter::TC-03-X2 | Planned |
| TC-03-X3 | Charter: phone directory one-handed (20 min) | exploratory | Manual | Manual: exploratory charter::TC-03-X3 | Planned |
