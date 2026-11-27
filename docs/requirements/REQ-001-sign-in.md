# REQ-001: Sign in to the portal

| | |
|---|---|
| Raised by | Owner: "Yes, start REQ-001" and "draft req-001 to 004 and have SA review it. I'll approve it tomorrow" (2026-11-28) |
| Epic | [EPIC-001 Access and households](../epics/EPIC-001-access-and-households.md) |
| Backlog story | [01 Sign in to the portal](../backlog/BACKLOG.md#01-sign-in-to-the-portal) |
| Status | **Approved** by the owner, 2026-11-28 ("approve it"), with every recommendation accepted. Sol Arch reviewed: supports Option A with changes (applied in r2) |
| Mockup | Screens 1A–1G of the [access and households mockup](https://claude.ai/artifact/KaNMpY53cLTtrk8HARZgUr) (comment there). Repo copy: [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html) |
| Architecture | SA-001 §8.1 and ADR-004, both Draft on branch `docs/sa-001-architecture` (links work once that branch is merged) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch's corrections applied to the criteria, copy and data; owner decisions listed | · r3, 2026-11-28: owner approval recorded; recommendations accepted

## Owner decisions

Approved by the owner on 2026-11-28 ("approve it"): every recommendation in the right-hand column is accepted. Questions for the HOA board or the admin office under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | D1 sign-in method: Option A, B or C | **A**: email and password, or Google |
| 2 | 2-step verification for staff. It needs the Firebase project upgraded to "Firebase Authentication with Identity Platform" and verified staff emails. Whether that upgrade costs anything at our size is not confirmed yet (Sol Arch review). | Decide separately, before the first staff account goes live. If yes, use an authenticator app, not SMS. It does not block approving this REQ |

## Problem

The mock-up has no sign-in. A role switch and a "Viewing as" picker let anyone see every household's balance, payments and contact number. The real portal will hold that data for 623+ households, so nobody may see a household's data unless they have signed in and are linked to it (REQ-004) or hold a staff role (REQ-002).

Who has the problem: every [Homeowner](../product/PERSONAS.md#homeowner) (privacy) and the [Treasurer](../product/PERSONAS.md#treasurer) (accountable for the data). Most homeowners will sign in on a phone, once or twice a month.

## Options

All three work with SA-001's design: sign-in only proves who the person is. Which household they see comes only from an invite code (REQ-004), never from matching their email or phone number.

### Option A: Email and password, or "Continue with Google" (recommended)

- **How it works:** the sign-in page has a "Continue with Google" button, and email and password fields with "Forgot password?". New people create an account the same way, then enter their invite code.
- **Where it lives:** the first page of the portal; "Sign out" in the account menu at the top right.
- **Cost:** cheap. Built into Firebase Authentication, and it is what SA-001 §8.1 designs for. Password-reset and verification emails are sent by Firebase at no cost.
- **Excludes:** people with no email address (see Open questions).
- **Honest downside:** people forget passwords. Expect reset requests and some calls to the office in the first month.

### Option B: Email sign-in link (no password), or Google

- **How it works:** the person types their email and gets a one-time link that signs them in.
- **Cost:** cheap, also built into Firebase Authentication.
- **Excludes:** the same people as Option A.
- **Honest downside:** on phones the link often opens inside the email app's own browser, so the person is signed in there and not in the browser they normally use. Opening the link on another device asks for the email again. Every sign-in also waits on an email, which can land in spam. For people who sign in once a month, this fails more often than a forgotten password.

### Option C: Mobile number and SMS code

- **How it works:** the person types their mobile number and enters the 6-digit code sent by text.
- **Cost:** moderate and ongoing. Each code is charged per message, on every sign-in for 623+ households (SA-001 §5; Blaze plan only).
- **Reaches:** people without email.
- **Honest downside:** a running bill; changed or shared SIMs lock people out; SA-001 R-13 lists SMS as a cost risk.

### Recommendation

**Option A.** It is the cheapest to run, matches SA-001, and a forgotten password is easier to recover from than a sign-in link that opened in the wrong browser. Choosing Option A answers backlog decision **D1**.

## Story

As a homeowner, I want to sign in with my email and password or my Google account, so that only I can see my household's account.

This revises backlog story 01. Its first scenario assumed the portal finds the household by matching the email; SA-001 forbids that, so linking moves to REQ-004.

**Accepted limitation:** "Create account" tells anyone whether an email already has an account. Firebase does this even with email enumeration protection on. It is accepted because an account sees nothing until it redeems an invite code (REQ-004).

## Acceptance criteria (Option A)

```gherkin
Feature: Signing in

  Background:
    Given email enumeration protection is on for the Firebase project
    And the password policy is set to Require, with a minimum of 8 characters

  Scenario: A linked homeowner signs in with Google
    Given Maria Santos has a Google account that is linked to Blk 1 Lot 3
    When she presses "Continue with Google" and chooses that account
    Then she lands on her dashboard headed "Welcome back, Maria"
    And the header reads "Blk 1 Lot 3"

  Scenario: A linked homeowner signs in with email and password
    Given Juan Dela Cruz has an email-and-password account linked to Blk 4 Lot 12
    When he enters his email and password and presses "Sign in"
    Then he lands on his dashboard for Blk 4 Lot 12

  Scenario: A wrong password does not reveal whether the email exists
    When anyone enters "juan@example.com" with a wrong password and presses "Sign in"
    Then they see "That email and password don't match. Try again, or reset your password."
    And the same message shows for an email that has no account
    And the email they typed is still in the field

  Scenario: Resetting a forgotten password
    When Juan presses "Forgot password?" and enters "juan@example.com"
    Then he sees "If there's an account for juan@example.com, we've sent a link to reset the password. Check your spam folder too."
    And the same message shows for an email that has no account, and no email is sent

  Scenario: Firebase refuses a sign-in because of too many attempts
    Given Firebase Authentication refuses a sign-in for "juan@example.com" as too many attempts
    Then they see "Too many attempts. Wait a while, or reset your password."
    And the email they typed is still in the field

  Scenario: Creating an account
    When a new homeowner presses "Create an account", enters their name, email and a password, and presses "Create account"
    Then a verification email is sent to that address
    And they land on "Enter your invite code" (REQ-004)
    And they see no household data

  Scenario: Creating an account with an email that already has one
    When someone presses "Create account" with "juan@example.com", which already has an account
    Then they see "There's already an account for this email. Sign in, or reset your password."
    And the name and email they typed are kept

  Scenario: A password that is too short
    When they enter a password of 7 characters
    Then "Use at least 8 characters" shows under the password field
    And the name and email they typed are kept
    And Firebase Authentication also refuses a 7-character password if the page check is skipped

  Scenario: Google sign-in on an unverified account with the same address
    Given Ana created an email-and-password account with "ana.reyes@gmail.com" and never verified it
    When the owner of that Gmail address signs in with "Continue with Google"
    Then the account signs in with Google from then on, and the old password no longer works
    And the account keeps any household it was linked to

  Scenario: Signed in but not linked to any household
    Given Ana Reyes is signed in and has no household and no staff role
    When she opens the portal
    Then she sees "Your account isn't linked to a household yet. Enter the invite code from the admin office."
    And she sees no menu other than "Enter invite code" and "Sign out"
    And Firestore refuses any household or staff read from her account

  Scenario: A homeowner cannot open another household's page
    Given Maria is signed in and linked only to Blk 1 Lot 3
    When she opens the address of a page for Blk 4 Lot 12
    Then she sees "You don't have access to this page"
    And no Blk 4 Lot 12 data is loaded

  Scenario: Signing out on a shared phone
    Given Maria is signed in
    When she chooses "Sign out"
    Then she sees the sign-in page
    And pressing Back shows the sign-in page, not her dashboard
    And no household data shows, even briefly

  Scenario: Staying signed in on her own phone
    Given Maria signed in yesterday on her phone and did not sign out
    When she opens the portal today
    Then she lands on her dashboard without signing in again
```

## Data changes

| What | Where | Written by | Read by |
|---|---|---|---|
| Account (email, password hash, Google link, email verified) | Firebase Authentication | Firebase | Firebase |
| Person record: name, email, phone (optional) | `users/{uid}` (SA-001 §4.2) | the person, at account creation | the person; admin office (REQ-003, REQ-004) |
| Sign-in attempts and abuse blocking | Firebase Authentication | Firebase | Firebase |

**Project settings (go-live checklist, every Firebase project):** email enumeration protection on; password policy Require, minimum 8; verification email sent at account creation; Firestore's web cache left memory-only so no household data stays on a shared phone after sign-out; Google sign-in uses the popup flow or our own sign-in domain (Sol Arch review, redirect best practices).

No household data is created by signing in. Membership comes only from REQ-004.

## UX/UI notes

- **Accessibility:** every field has a visible label; "Show password" toggle with a text label; errors are announced (`role="alert"`) and placed under the field; tap targets at least 44 × 44 px; the Google button meets 4.5:1 contrast and says "Continue with Google" in text, not only a logo.
- **Forms:** `autocomplete="email"`, `current-password` and `new-password` so password managers work; email keyboard on phones; typing is never cleared by an error.
- **Consistency:** same green top bar and card as the mock-up; "Sign in" and "Sign out" everywhere (not "Log in").
- **Mobile-first:** a single card at 375 px; the primary button within thumb reach; no horizontal scroll.
- **States:** loading ("Signing in…" on the disabled button); error (above); success (lands on the dashboard); offline ("You're offline. Connect to the internet to sign in."); unverified email (a banner "Check your email to verify your address", with "Send again").
- **Safe actions:** "Sign in" and "Create account" are disabled while in flight, so a double tap makes one request.
- **Roles:** what a signed-in person sees depends on REQ-002 and REQ-004. A hidden menu item is not protection; Firestore rules deny by default (SA-001 §8.1).

## Copy of record

| Where | Text |
|---|---|
| Sign-in page heading | Sign in to {HOA name} |
| Google button | Continue with Google |
| Divider | or use your email |
| Fields | Email · Password · Show password |
| Primary button | Sign in (in flight: Signing in…) |
| Link | Forgot password? |
| Link | New here? Create an account |
| Wrong password | That email and password don't match. Try again, or reset your password. |
| Too many attempts | Too many attempts. Wait a while, or reset your password. |
| Reset sent | If there's an account for {email}, we've sent a link to reset the password. Check your spam folder too. |
| Email already has an account | There's already an account for this email. Sign in, or reset your password. |
| Short password | Use at least 8 characters |
| Unverified banner | Check your email to verify your address. · Send again |
| Not linked | Your account isn't linked to a household yet. Enter the invite code from the admin office. |
| No access | You don't have access to this page |
| Offline | You're offline. Connect to the internet to sign in. |

## Out of scope

- The privacy notice and consent at first sign-in (backlog story 05, its own REQ).
- SMS sign-in (Option C), unless the owner picks it.
- 2-step verification for homeowners. For staff, see Decisions for the owner.
- Locking an account after a set number of failed sign-ins. Firebase doesn't offer it; building our own is a project (Sol Arch review).
- Deleting an account, or a homeowner's request for a copy of their data (Data Privacy Act); a later REQ.
- Changing the email on an account.

## Open questions

| Question | Who decides |
|---|---|
| D1: Option A, B or C | Owner |
| 2-step verification for staff (Decisions for the owner, row 2) | Owner, with Sol Arch confirming the cost |
| Does the HOA own a domain, so reset and verification emails come from it rather than a Firebase address? (SA-001 Q7) | HOA board |
| How should a homeowner with no email sign in: a family member's email, or a Google account the office helps create? | HOA board |

## Sol Arch review

> **BA note (r2):** the corrections Sol Arch asks for under "Criteria to change" are already applied to the criteria, copy and data above. What needs the owner is listed under "Decisions for the owner" at the top.

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r1 and ADR-001 to ADR-005 (Draft, `origin/docs/sa-001-architecture` at `b020b40`). The baseline is branch `docs/req-001-004` at `72276f1`, which has no application code.

**Verdict: Supports with changes.** Option A is the right choice. Three scenarios need rewording to match what Firebase Authentication actually does, and one needs a server-side check added. 2-step verification for staff is possible, but only after a project upgrade. The owner should decide that as a separate add-on, and it does not block approving Option A.

#### Options

| Option | Feasible on this stack? | Cost (BA's read) | Sol Arch |
|---|---|---|---|
| A: email + password, or Google | Yes | Cheap | **Agree, cheap.** One build detail: "Continue with Google" must use the popup flow or our own `authDomain`. Redirect sign-in breaks in browsers that block third-party storage (Chrome M115+, Firefox 109+, Safari 16.1+) unless the app is served from `firebaseapp.com` ([redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices)). Password-reset emails are capped at 10,000 a day on Blaze and 150 on Spark ([Auth limits](https://firebase.google.com/docs/auth/limits)), which is ample. |
| B: email sign-in link | Yes | Cheap | Agree, and I agree with the BA's downside. |
| C: SMS code | Yes, Blaze only | Moderate, ongoing | Agree. "Billed per SMS sent" on Blaze, not available on Spark ([pricing](https://firebase.google.com/pricing)). SA-001 R-13 still applies. |

**2-step verification for staff (the BA's open question):**
- Multi-factor sign-in (SMS or an authenticator app, "TOTP") is available only after the project is upgraded to **Firebase Authentication with Identity Platform** ([MFA](https://firebase.google.com/docs/auth/web/multi-factor), [TOTP MFA](https://firebase.google.com/docs/auth/web/totp-mfa)).
- "MFA requires email verification" (same pages). Staff must therefore verify their email before they can enrol.
- TOTP needs Admin Node.js SDK 11.6.0+ and Web SDK 9.19.1+ (TOTP page). It sends no SMS, so it has no per-message charge. The Firebase pricing page lists Identity Platform as "No-cost up to 50K MAUs" (monthly active users) on Blaze ([pricing](https://firebase.google.com/pricing)), and 623 households is far below that. I could not load the Identity Platform pricing page on 2026-11-28, so **whether MFA itself carries a charge is Uncertain**. Check it in the console before upgrading. Also check whether the upgrade can be undone, and do it in staging first.
- Firebase does not let us say "staff must use 2-step". We would enforce it ourselves in two places. First, `setRole` refuses to grant a staff role to an account with no enrolled factor. Second, rules and functions check that the token was issued after a second factor. The token field for that (`firebase.sign_in_second_factor`) is not in the official rules reference I fetched ([Request reference](https://firebase.google.com/docs/reference/rules/rules.firestore.Request)). **Uncertain: prove it on the emulator before relying on it.**
- **Recommendation:** TOTP for staff only, as a small add-on story in R1. Not SMS.

#### Criteria to change (quoted, then corrected)

1. **"A wrong password does not reveal whether the email exists"**. This can be met, but only while *email enumeration protection* is on. It is on by default for projects created on or after 15 September 2023. With it on, a wrong password and an unknown email return the same `INVALID_LOGIN_CREDENTIALS` error ([enumeration protection](https://docs.cloud.google.com/identity-platform/docs/admin/email-enumeration-protection)). Add the precondition `Given email enumeration protection is on for the project`, and make it a go-live checklist item for every project.
   - **Gap:** account creation still reveals whether an email is registered ("Invalid sign-up cases continue to return `EMAIL_EXISTS` errors", same page). Add this scenario and say in the REQ that it is accepted. It is acceptable because an account sees nothing without an invite code (REQ-004).
     ```gherkin
     Scenario: Creating an account with an email that already has one
       When someone presses "Create account" with "juan@example.com", which already has an account
       Then they see "There's already an account for this email. Sign in, or reset your password."
       And the name and email they typed are kept
     ```
2. **"Resetting a forgotten password"**. This can be met as written: for an unknown address no email is sent and no error is shown (enumeration protection page). No change.
3. **"Given someone has entered a wrong password for "juan@example.com" many times in a row … Then they see "Too many attempts. Wait a few minutes, or reset your password.""**. Firebase does not publish a failed-sign-in limit and offers no lockout we can configure. It says only that "abuse protections may be enabled without warning on accounts that demonstrate suspicious traffic patterns" ([Auth limits](https://firebase.google.com/docs/auth/limits)). We cannot promise when it triggers or that it lasts "a few minutes". Corrected:
   ```gherkin
   Scenario: Firebase refuses a sign-in because of too many attempts
     Given Firebase Authentication refuses a sign-in for "juan@example.com" as too many attempts
     Then they see "Too many attempts. Wait a while, or reset your password."
     And the email they typed is still in the field
   ```
   Change the copy of record to match ("Wait a while"). This is tested with the error mocked in a unit test; it cannot be triggered on demand. A real "lock after N failures" would mean sign-in through our own function. That is a project, and I don't recommend it.
4. **"When they enter a password of 7 characters / Then "Use at least 8 characters" shows under the password field"**. The browser check alone is advice, not enforcement. Firebase's default minimum is 6. A password policy in **Require** mode with a minimum of 8 makes sign-up fail on the server ([password auth](https://firebase.google.com/docs/auth/web/password-auth)). The page doesn't say whether the policy needs the Identity Platform upgrade, so **check in the console**. Add: `And Firebase Authentication also refuses a 7-character password (password policy: Require, minimum 8)`.
5. **"Signing out on a shared phone … pressing Back shows the sign-in page"**. Feasible, but the app must also handle the browser's back-forward cache, which restores the page from memory. Add: `And no household data shows, even briefly`. Firestore's cache on the web is memory-only by default ([offline data](https://firebase.google.com/docs/firestore/manage-data/enable-offline)). **Keep it that way in R1.** A persistent cache would leave household data on a shared phone after sign-out.
6. **"Signed in but not linked to any household … she sees no menu other than…"**. A hidden menu is not protection (CS-3). Add a server-side line: `And Firestore refuses any household or staff read from her account`, proven by a rules test.
7. **"Staying signed in on her own phone"**. Can be met as written. Web sessions persist "even after the user closes the browser" until the person signs out ([auth state persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)).
8. **Missing scenario: Google sign-in on an unverified password account.** If someone made an email-and-password account with a Gmail address and never verified it, a later "Continue with Google" takes over the account. "The trusted provider overwrites the untrusted provider", and the old password stops working ([users](https://firebase.google.com/docs/auth/users)). To make this rarer, send the free verification email at account creation, and add a scenario for the BA to word.

#### Data

- `users/{uid}`: **confirmed** per SA-001 §4.2. Rules let a person *create* and *update* only their own document, and only the fields `name`, `email`, `phone`, `createdAt`. They may never write a role field (see REQ-002's review, which moves the staff mirror out of `users`). Firebase Auth is the source of truth for the email, so a rule checks `email == request.auth.token.email`.
- "Sign-in attempts and lockouts, Firebase": correct, but we can neither read nor configure them. Reword as "Firebase's own abuse protection (not configurable)".
- **Missing: project settings.** These are not code, so they can drift between staging and production: enumeration protection on, password policy Require/8, the Google provider, authorised domains, `authDomain`, and (if chosen) TOTP. List them in a per-project go-live checklist (ADR-005).
- No index needed.

#### Risks not covered

- **Settings drift between projects** (above). A test project's domain must not be authorised on production.
- **Shared accounts.** The open question suggests "a family member's email". That puts two people on one account, so the activity log can't tell who did what, and the family member could later be removed with the other person's access. Better: the office helps create a Google account, or the person is invited as a second member of the household (REQ-004). Owner/board decision.
- **Privacy (RA 10173).** `users` holds name, email and phone from the first sign-in. The privacy notice (backlog story 05) must ship before any real homeowner signs in. This maps to transparency; requester and DPO to confirm.
- **Reset emails from a Firebase address may land in spam** until the HOA's domain is set up (SA-001 Q7).
- **Observability.** Watch account-creation counts on the Auth usage dashboard. A spike means abuse.
- **Repeat-trigger:** covered by the in-flight button state. A second "Create account" gets `EMAIL_EXISTS`, which the new scenario handles.

#### SA-001 follow-ups (recommended revisions; I have not edited SA-001)

- §8.1 ("2-step verification (if available on the chosen auth tier)") and A-13: replace with "needs the Identity Platform upgrade; TOTP for staff; verified email required; enforced by `setRole` plus a token check (to be proven on the emulator)".
- §8: add an Auth configuration table (the settings above), Google popup or own `authDomain`, and "Firestore memory cache only in R1".

#### Size

Option A without 2-step: **2–3 person-days with Claude Code**. That covers sign-in, account creation, reset, sign-out and back-button handling, the not-linked screen, route guard, `users` rules and rules tests, and Playwright journeys on the emulator. Staff TOTP add-on: **+1–1.5 days**.

#### Sources (fetched 2026-11-28)

[Email enumeration protection](https://docs.cloud.google.com/identity-platform/docs/admin/email-enumeration-protection) · [Auth limits](https://firebase.google.com/docs/auth/limits) · [Password auth (password policy)](https://firebase.google.com/docs/auth/web/password-auth) · [Multi-factor auth](https://firebase.google.com/docs/auth/web/multi-factor) · [TOTP MFA](https://firebase.google.com/docs/auth/web/totp-mfa) · [Firebase pricing](https://firebase.google.com/pricing) · [Redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices) · [Auth state persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence) · [Offline data](https://firebase.google.com/docs/firestore/manage-data/enable-offline) · [Users and linking](https://firebase.google.com/docs/auth/users) · [Rules Request reference](https://firebase.google.com/docs/reference/rules/rules.firestore.Request) · forum note on `sign_in_second_factor` (unofficial, hence Uncertain): [firebase-talk](https://groups.google.com/g/firebase-talk/c/7EZfxETa_jk/m/4e0FRCpWAgAJ)
