# REQ-001: Sign in to the portal

| | |
|---|---|
| Raised by | Owner: "Yes, start REQ-001" and "draft req-001 to 004 and have SA review it. I'll approve it tomorrow" (2026-11-28) |
| Epic | [EPIC-001 Access and households](../epics/EPIC-001-access-and-households.md) |
| Backlog story | [01 Sign in to the portal](../backlog/BACKLOG.md#01-sign-in-to-the-portal) |
| Status | **r4 approved** by the owner, 2026-11-28 ("Approve r4"), with owner decisions 3 to 5 as recommended. Sol Arch reviewed r4: supports with changes (applied). History: r3 was **approved** by the owner, 2026-11-28 ("approve it"), with every recommendation accepted. Sol Arch reviewed r1: supports Option A with changes (applied in r2). |
| Mockup | Screens 1A–1M of the [access and households mockup](https://claude.ai/artifact/KaNMpY53cLTtrk8HARZgUr) (comment there). r4 changes 1G and adds 1H–1M; the published copy needs republishing. Repo copy: [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html) |
| Architecture | SA-001 §4.2, §8.1, §8.4 and ADR-004, all Draft on branch `docs/sa-001-architecture` (links work once that branch is merged) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch's corrections applied to the criteria, copy and data; owner decisions listed · r3, 2026-11-28: owner approval recorded; recommendations accepted · **r4, 2026-11-28: QA's requirement gaps from TC-01 v1.1 answered (G-1 to G-8, G-11 to G-21); see [r4 change log](#r4-change-log); Sol Arch's r4 changes applied; owner approval recorded** · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

**Reading r4:** new scenarios carry the tag `@r4-new` and changed ones `@r4-changed`. New or changed rows and lines elsewhere end with **(r4)**. Untagged text is unchanged from approved r3.

## Owner decisions

Rows 1 and 2 were approved by the owner on 2026-11-28 ("approve it"): every recommendation in the right-hand column is accepted. Rows 3 to 5 are new in r4 and were approved by the owner on 2026-11-28 ("Approve r4"): each recommendation is accepted, with Sol Arch's additions. Questions for the HOA board or the admin office under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | D1 sign-in method: Option A, B or C | **Approved: A**: email and password, or Google |
| 2 | 2-step verification for staff. It needs the Firebase project upgraded to "Firebase Authentication with Identity Platform" and verified staff emails. Whether that upgrade costs anything at our size is not confirmed yet (Sol Arch review). | **Approved:** decide separately, before the first staff account goes live. If yes, use an authenticator app, not SMS. It does not block approving this REQ |
| 3 | **(r4, G-13)** A password set before the 8-character policy was turned on. Firebase offers two settings. **Require** (the "force upgrade on sign-in" setting): Firebase refuses that password at sign-in, and the person must choose a new one. **Notify**: the old password still signs in, and we would have to build our own "choose a new password" screen. | **Approved: Require, as r3 already says.** On production no real account can predate the policy, because the go-live checklist sets it before the first homeowner signs up. Only test or seeded accounts could, and those are reset or recreated. So Notify would be a screen built for nobody. The rare person refused sees: "Your password is shorter than we now allow. Reset your password to choose a new one of at least 8 characters." with "Reset your password" opening the reset page, email filled in. **Sol Arch (r4):** "Require" is two settings: enforcement on, and "force upgrade on sign-in" on. **Any later tightening of the policy** (say, to 10 characters) would refuse every shorter existing password at its next sign-in. So it is a **new owner decision**, made with Notify on the table |
| 4 | **(r4, G-19)** A guard account in R1. Guard screens arrive in R4 (REQ-002), so in R1 a guard has nothing to use. | **Approved: don't grant the guard role before the gate screens are released** (the developer declines guard requests until then; REQ-002 Option B already routes every grant through the developer). **As a safety net**, an account whose only access is the guard role lands on a holding page: "Gate screens aren't open yet. Keep using the gate's logbook until the admin office tells you they are ready." with "Sign out" and no menu or household data. **Sol Arch (r4): also a server check.** `setRole` refuses the guard role while the per-project setting `GUARD_ROLE_ENABLED` is off. It stays off on production until the gate release. The process rule stays, and the holding page is the last line of defence. The `setRole` criterion belongs in REQ-002 (see [Follow-up for REQ-002](#follow-up-for-req-002-r4)). A guard who is also linked to a household sees their household dashboard and no gate menu (same section) |
| 5 | **(r4, G-17)** Two small changes for Google-only accounts. (a) Add one line to the approved wrong-password message, shown to everyone: "Signed up with Google? Use Continue with Google." (b) Let a password reset add a password to a Google-only account (what Firebase does by default, to be confirmed in testing). | **Approved: yes to both.** (a) reveals nothing, because it shows on every wrong attempt, and it answers the commonest cause of the error for people who sign in monthly. (b) the reset link goes only to that mailbox, so whoever uses it already controls the address Google trusts; blocking it would need our own reset function and gains no protection. **Sol Arch (r4):** agrees with both. That (b) keeps the same account, uid and household is expected; it is **confirmed on staging** before go-live |

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

**Accepted limitation (r4):** typing the email of a turned-off account shows that it exists and is turned off, whatever the password. Firebase reports this before it checks the password (Sol Arch: seen in the emulator, Uncertain for production). Accounts are turned off rarely, only in the Firebase console, and see no data.

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

  @r4-changed
  Scenario: A wrong password does not reveal whether the email exists
    When anyone enters "juan@example.com" with a wrong password and presses "Sign in"
    Then they see "That email and password don't match. Try again, or reset your password."
    And under it, in the same alert so it is announced once, "Signed up with Google? Use Continue with Google." (owner decision 5a)
    And the message sits above the form, not under a field
    And the same message shows for an email that has no account
    And the same message shows for an account that only uses Google
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

  @r4-changed
  Scenario Outline: Signed in but not linked to any household
    Given Ana Reyes is signed in as "ana.reyes@example.com" and has no household and no staff role
    When she <arrives>
    Then she sees the page headed "Enter your invite code"
    And above the code field "Your account isn't linked to a household yet. Enter the invite code from the admin office."
    And under the form "Signed in as ana.reyes@example.com"
    And she sees no menu, only the code field, "Continue" and "Sign out"
    And Firestore refuses any household or staff read from her account

    Examples:
      | arrives                                           |
      | has just created her account                      |
      | reloads the page                                  |
      | opens the portal the next day                     |
      | opens the address of a household page             |

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

### New in r4: field checks and wording (G-1, G-4, G-12)

```gherkin
  @r4-new
  Scenario Outline: Field checks on the sign-in, create-account and reset pages
    Given anyone is on the <page> page
    When they <do>
    Then "<message>" shows under the <field> field
    And that field is marked as having an error and the message is announced
    And nothing is sent to Firebase
    And everything they typed is kept

    Examples:
      | page           | do                                               | field    | message                                         |
      | sign-in        | press "Sign in" with the email empty              | Email    | Enter your email address                        |
      | sign-in        | press "Sign in" with the password empty           | Password | Enter your password                             |
      | sign-in        | type "juan.example.com" and leave the field       | Email    | Enter an email address like name@example.com    |
      | create-account | type "ana@" and leave the field                   | Email    | Enter an email address like name@example.com    |
      | reset          | press "Send reset link" with "juan.example.com"   | Email    | Enter an email address like name@example.com    |
      | create-account | press "Create account" with the name empty        | Your name| Enter your name                                 |
      | create-account | press "Create account" with a name of only spaces | Your name| Enter your name                                 |
      | create-account | paste a name of 81 characters and leave the field | Your name| Use 80 characters or fewer                      |
      | create-account | press "Create account" with the password empty    | Password | Use at least 8 characters                       |
      | reset          | press "Send reset link" with the email empty      | Email    | Enter your email address                        |

  @r4-new
  Scenario: After a failed check, focus goes to the first field with an error
    Given someone presses "Create account" with the name and email empty
    Then "Enter your name" and "Enter your email address" show under their fields
    And the keyboard focus is in "Your name"

  @r4-new
  Scenario: Errors about the whole form sit above it
    Given the message concerns the email and password together, or no single field
    Then it shows above the form, inside the card, as an announced alert
    And this applies to wrong email or password, too many attempts, offline, a blocked Google window, a turned-off account and an email that already has an account

  @r4-new
  Scenario: The name is stored without surrounding spaces
    When a new homeowner enters "  Ana Reyes  " as their name and creates an account
    Then their person record's name is "Ana Reyes"

  @r4-new
  Scenario Outline: Spaces around the email are ignored
    Given Juan has an email-and-password account for "juan@example.com"
    When he types " juan@example.com " (a space before and after) on the <page> page and submits
    Then the portal uses "juan@example.com"
    And <result>

    Examples:
      | page           | result                                                                 |
      | sign-in        | he lands on his dashboard                                              |
      | reset          | the message names "juan@example.com", without the spaces               |
      | create-account | he sees "There's already an account for this email. Sign in, or reset your password." |

  @r4-new
  Scenario: Spaces in a password are kept
    Given Juan's password ends with a space
    When he types it with the space and presses "Sign in"
    Then he lands on his dashboard
```

### New in r4: names and greetings (G-2, G-21)

```gherkin
  @r4-new
  Scenario: Signing up with Google takes the name from Google
    Given Carlo has no account, and his Google profile name is "Carlo Mendoza"
    When he presses "Continue with Google" on the create-account or sign-in page and chooses that account
    Then his person record's name is "Carlo Mendoza"
    And he lands on "Enter your invite code"

  @r4-new
  Scenario: A Google account with no name is asked for one
    Given Lito has no account, and his Google profile has no name
    When he signs up with "Continue with Google"
    Then he sees the page headed "What's your name?" with one field, "Your name", and "Continue"
    When he enters "Lito Garcia" and presses "Continue"
    Then the button reads "Saving…" and is disabled until the save finishes
    And if the save doesn't finish within 15 seconds, he sees "We couldn't save your details. Check your connection and try again." and "Continue" can be pressed again
    And his person record's name is "Lito Garcia"
    And he lands on "Enter your invite code"
    And the same name checks apply as on the create-account page

  @r4-new
  Scenario Outline: The greeting uses the first word of the name
    Given a linked homeowner whose person record's name is "<name>"
    When they sign in
    Then their dashboard is headed "<greeting>"

    Examples:
      | name          | greeting               |
      | Maria Santos  | Welcome back, Maria    |
      | Bong          | Welcome back, Bong     |
      | (none saved)  | Welcome back           |

  @r4-new
  Scenario: Later Google name changes don't overwrite the stored name
    Given Carlo's person record's name is "Carlo Mendoza"
    And he later changes his Google profile name to "CJ"
    When he signs in with Google
    Then his person record's name is still "Carlo Mendoza"

  @r4-new
  Scenario: The person record could not be saved when the account was made
    Given Ana created an email-and-password account, but her person record was not saved because she lost signal
    When she presses "Continue" on "Enter your invite code" while still offline
    Then within 15 seconds she sees "We couldn't save your details. Check your connection and try again."
    And the code she typed is kept, and "Continue" can be pressed again
    And her invite code is not used up
    When she presses "Continue" again once online
    Then her person record is created with her account's email and the name she typed, and then her code is checked
    But if she closed the portal first, the next time she opens it she sees "What's your name?" before "Enter your invite code"
    And someone who signed up with Google is not asked: the name comes from the Google profile again
```

### New in r4: Google sign-in states (G-8, G-14, G-16, G-20)

```gherkin
  @r4-new
  Scenario: While Google sign-in is open
    When anyone presses "Continue with Google"
    Then the button reads "Opening Google…" and is disabled
    And "Sign in" or "Create account" is also disabled
    And pressing "Continue with Google" twice opens one Google window

  @r4-new
  Scenario: Closing the Google window without choosing an account
    Given the Google window is open
    When they close it without choosing an account
    Then no message shows
    And within 10 seconds "Continue with Google" reads "Continue with Google" again and can be pressed
    And anything typed in the email form is kept

  @r4-new
  Scenario: The browser blocks the Google window
    Given the browser blocks pop-up windows for the portal
    When anyone presses "Continue with Google"
    Then they see "Your browser blocked the Google sign-in window. Allow pop-ups for this site, or sign in with your email."
    And "Continue with Google" can be pressed again

  @r4-new
  Scenario: Google sign-in fails for another reason
    Given Firebase returns a Google sign-in error not covered by another scenario
    Then they see "Google sign-in didn't work. Try again, or sign in with your email."

  @r4-new
  Scenario: Opening the portal inside an app's own browser
    Given Juan opens the portal link from Messenger, so it opens in Messenger's built-in browser
    Then above "Continue with Google" he sees "Google sign-in doesn't work inside this app. Open this page in Chrome or Safari, or sign in with your email."
    And a "Copy link" button
    And the email and password form works as usual
    When he presses "Copy link"
    Then the page address is copied, including any invite code in it
    And he sees "Link copied. Paste it into Chrome or Safari."
    And "Link copied" shows only once the copy has worked
    And if the app's browser blocks copying, the page address shows selected in a box, with "Press and hold to copy"

  @r4-new
  Scenario: Google sign-in on an address that already has a password account
    Given Ben has an email-and-password account for "ben@acme.example", a company address whose mail is not hosted by Google, and he has registered that address as a Google account
    When he presses "Continue with Google" and chooses "ben@acme.example"
    Then he is not signed in
    And no second account is created for "ben@acme.example"
    And he sees "This email already has a password. Sign in with your email and password."
    And the sign-in form has "ben@acme.example" filled in
    And if Firebase refuses without saying the email already has a password, he sees "Google sign-in didn't work. Try again, or sign in with your email." and still no second account is created

  @r4-new
  Scenario: Google sign-in on a verified Gmail address that already has a password
    Given Juan verified his email-and-password account for "juan.dc@gmail.com", which is linked to Blk 4 Lot 12
    When he presses "Continue with Google" and chooses that Gmail account
    Then he is signed in to the same account and lands on Blk 4 Lot 12's dashboard
    And no second account is created
    And whether his password still works afterwards is recorded from the staging test (Sol Arch: Uncertain)
```

### New in r4: carrying the email, offline, verification, turned-off accounts (G-5, G-6, G-7, G-15)

```gherkin
  @r4-new
  Scenario: The typed email goes with the person to the reset page and back
    Given Juan typed "juan@example.com" on the sign-in page
    When he presses "Forgot password?"
    Then the reset page's Email field reads "juan@example.com" and can be edited
    When he presses "Back to sign in"
    Then the sign-in page's Email field reads the email now on the reset page
    And the password is never carried

  @r4-new
  Scenario: From "There's already an account" to signing in
    Given someone sees "There's already an account for this email. Sign in, or reset your password." for "juan@example.com"
    When they press "Sign in" in that message
    Then the sign-in page opens with "juan@example.com" filled in
    And pressing "reset your password" in that message opens the reset page with "juan@example.com" filled in

  @r4-new
  Scenario: The carried email never appears in the page address
    When an email is carried from one page to another
    Then the address bar does not contain it

  @r4-new
  Scenario Outline: Offline on each signed-out page
    Given anyone is on the <page> page with no internet connection
    When they press "<button>"
    Then they see "<message>"
    And everything they typed is kept

    Examples:
      | page           | button               | message                                                          |
      | sign-in        | Sign in              | You're offline. Connect to the internet to sign in.              |
      | sign-in        | Continue with Google | You're offline. Connect to the internet to sign in.              |
      | create-account | Create account       | You're offline. Connect to the internet to create your account.  |
      | create-account | Continue with Google | You're offline. Connect to the internet to create your account.  |
      | reset          | Send reset link      | You're offline. Connect to the internet to send the reset link.  |

  @r4-new
  Scenario: Where the "verify your email" banner shows
    Given Ana created an email-and-password account and has not verified her email
    When she opens any signed-in page: "Enter your invite code", "What's your name?", the lot confirmation, her dashboard, a staff page or the guard holding page
    Then a banner directly under the top bar reads "Check your email to verify your address." with "Send again"
    And the banner can't be dismissed
    And it does not show on the sign-in, create-account or reset pages

  @r4-new
  Scenario: Sending the verification email again
    Given Ana sees the verification banner
    When she presses "Send again"
    Then it reads "Sending…" and is disabled
    And then the banner reads "Sent. Check your inbox." in the same place
    And pressing "Send again" twice quickly sends one request

  @r4-new
  Scenario: Firebase refuses another verification email
    Given Firebase refuses "Send again" as too many requests
    Then the banner reads "Too many emails sent. Wait a while, then try again."

  @r4-new
  Scenario: The banner goes once the email is verified
    Given Ana verified her email from the link on her phone's email app
    When she next opens or reloads the portal
    Then the verification banner does not show

  @r4-new
  Scenario Outline: A turned-off account at sign-in
    Given Juan's account has been turned off in Firebase
    When he <tries>
    Then he is not signed in and sees no household data
    And he sees "This account is turned off. Contact the admin office." if Firebase reports the account as turned off
    And otherwise he sees the message for that kind of failure

    Examples:
      | tries                                                             |
      | enters his email and any password and presses "Sign in"           |
      | presses "Continue with Google" and chooses his turned-off account |

  @r4-new
  Scenario: An account turned off while signed in
    Given Juan is signed in and his account is then turned off
    When he next opens or reloads the portal
    Then he is signed out and sees the sign-in page with "This account is turned off. Contact the admin office."
    And no household data shows after that

  @r4-new
  Scenario: An account turned off while the portal stays open
    Given Juan keeps the portal open and his account is turned off
    Then within an hour he is signed out and sees the sign-in page
    And no household data shows after that
    And if he tries to sign in again, he sees "This account is turned off. Contact the admin office."
```

### New in r4: where people land, and older passwords (G-11, G-13, G-17, G-18, G-19)

```gherkin
  @r4-new
  Scenario: Signing in from a link returns to the page asked for
    Given Juan is signed out and linked to Blk 4 Lot 12
    When he opens the portal address of his Dues & Payments page
    Then he sees the sign-in page
    When he signs in
    Then he lands on Dues & Payments for Blk 4 Lot 12

  @r4-new
  Scenario: A link to a page the person may not open
    Given Maria is signed out and linked only to Blk 1 Lot 3
    When she opens the address of a page for Blk 4 Lot 12 and signs in
    Then she sees "You don't have access to this page"
    And no Blk 4 Lot 12 data is loaded

  @r4-new
  Scenario Outline: A return address in the page address is ignored
    Given the sign-in address has "<extra>" added to it
    When Juan signs in
    Then he lands on his dashboard, not the outside address
    And the portal itself never puts a return address in the page address

    Examples:
      | extra                         |
      | ?next=https://evil.example    |
      | ?next=//evil.example          |
      | #next=https://evil.example    |

  @r4-new
  Scenario: A not-linked person who signs in from a link
    Given Ana has no household and no staff role
    When she opens the address of a dashboard page and signs in
    Then she lands on "Enter your invite code"
    But if the link was an invitation link with a code, she lands on the lot confirmation (REQ-004)

  @r4-new
  Scenario: A password set before the 8-character policy (owner decision 3)
    Given Teo's 6-character password was set on a test project before the policy was set to Require
    When he enters his email and that password and presses "Sign in"
    Then he is not signed in
    And he sees "Your password is shorter than we now allow. Reset your password to choose a new one of at least 8 characters."
    And "Reset your password" opens the reset page with his email filled in
    And an unknown email, or a wrong password of 8 or more characters, still shows the wrong email or password message
    And this is checked on a staging project, because the emulator does not copy the console's password policy

  @r4-new
  Scenario: A Google-only account asks for a password reset (owner decision 5b)
    Given Maria's account only uses Google
    When she asks for a reset for her email
    Then she sees the usual reset message
    And if she follows the link and sets a password, she can sign in with either Google or that password
    And it is the same account, and no second account is created
    And she still lands on Blk 1 Lot 3's dashboard

  @r4-new
  Scenario: A guard account in R1 (owner decision 4)
    Given Rodel Bautista holds only the guard role and has no household, before the gate screens are released
    When he signs in
    Then he sees the page headed "Gate screens aren't open yet"
    And "Keep using the gate's logbook until the admin office tells you they are ready."
    And "Signed in as" his email, and "Sign out"
    And he sees no menu, no household and no staff page
    And Firestore refuses any read of household data, or of anyone else's staff record, from his account

  @r4-new
  Scenario: A guard who is also linked to a household, in R1
    Given Rodel Bautista holds the guard role and is linked to Blk 6 Lot 9, before the gate screens are released
    When he signs in
    Then he lands on the Blk 6 Lot 9 dashboard with the homeowner menu
    And he sees no gate menu, no guard holding page and no "Guard" in the view switch
```

## Data changes

| What | Where | Written by | Read by |
|---|---|---|---|
| Account (email, password hash, Google link, email verified) | Firebase Authentication | Firebase | Firebase |
| Person record: name, email **(r4: phone dropped)** | `users/{uid}` (SA-001 §4.2) | the person, at account creation; **(r4)** created again by the app if it is missing at a later sign-in | the person; admin office (REQ-003, REQ-004) |
| Sign-in attempts and abuse blocking | Firebase Authentication | Firebase | Firebase |

**Person record rules (r4):**
- **Name:** required, 1 to 80 characters after leading and trailing spaces are removed. Any letters, including ñ, accents, apostrophes, hyphens and full stops. On the email path it comes from "Your name". On the Google path it comes from the Google profile name, cut to 80 characters and then trimmed; a Google name of only spaces counts as no name, and then the name comes from "What's your name?". It is written once and not overwritten by later Google profile changes. The `users` rule enforces this (Sol Arch r4): create only, by the owner of the uid; allowed fields `name`, `email`, `createdAt`; `name` is a string equal to its trimmed self, 1 to 80 characters; **no update in R1**. Whether "80 characters" counts letters or bytes is tested in the rules tests with "ñ" and an emoji, and the page counts the same way. (G-2, G-1)
- **First name for the greeting:** the first word of the stored name. If no name is stored, the greeting is "Welcome back" with no name. Accepted limitation: a name stored as "Ma. Cristina Lopez" greets "Welcome back, Ma."; a preferred-name field is out of scope. (G-2)
- **Email:** the account's email from Firebase Authentication (SA-001: the rule checks it equals the signed-in email). Leading and trailing spaces are removed from every email the person types, on sign-in, create-account and reset, before it is sent. Spaces inside an email make it invalid. Passwords are never trimmed or changed. (G-4)
- **Phone: not collected by REQ-001.** The create-account page (1F) has no phone field, and sign-in doesn't need one. A household's mobile number is the staff-only `householdContacts/{householdId}.contactMobile`, entered by the admin office (REQ-003). Not collecting it here also follows data minimisation (RA 10173). Sol Arch (r4) drops `phone` from SA-001 §4.2 and from the `users` rule's allowed fields (SA-001 follow-up). (G-3)
- **Missing record:** on every open the app reads `users/{uid}`. If it is missing (it failed to save, or the tab closed), the app creates it: the email from the account, and the name from what the page still holds, or the Google profile name, or else "What's your name?". Someone who signed up with Google is never asked. "Continue" on "Enter your invite code" makes sure the record exists first. On the server, `redeemInvite` refuses if the record is missing, and the invite is not used up (Sol Arch r4; an SA-001 follow-up, see also Follow-up for REQ-004). Firestore saves made offline wait instead of failing, so every save on these pages gives up after **15 seconds** and shows the "couldn't save" message. A retry that finds the record already there counts as success. (G-21)

**Carried between pages (r4, G-7, G-11):** the typed email (sign-in ↔ reset, duplicate-email message → sign-in or reset, Google "already has a password" → sign-in) is kept in the page's memory only, never in the address bar or saved storage. The page asked for before sign-in is kept the same way, as a portal route rather than a web address, so it can only ever be a portal page. **No return address is ever put in the page address**, and any `?next=` or similar is ignored (Sol Arch r4). The invite code stays after `#`, as REQ-004 designs it.

**Project settings (go-live checklist, every Firebase project):** email enumeration protection on; password policy Require **(r4: enforcement on, and "force upgrade on sign-in" on)**, minimum 8; verification email sent at account creation; Firestore's web cache left memory-only so no household data stays on a shared phone after sign-out; Google sign-in uses the popup flow or our own sign-in domain (Sol Arch review, redirect best practices). **(r4)** The password policy is set before any account is created on the project (owner decision 3). "One account per email address" (the console's account-linking setting) is on; Sol Arch is adding it to SA-001 §8.4. `GUARD_ROLE_ENABLED` is off on production until the gate release (owner decision 4). Any later tightening of the password policy needs an owner decision (owner decision 3). The emulator copies none of these settings, so the tests that depend on them run on staging. **(r4)** On every open, the app refreshes the account once, so the verified flag is current and a turned-off account is signed out (Sol Arch r4).

No household data is created by signing in. Membership comes only from REQ-004.

## UX/UI notes

- **Accessibility:** every field has a visible label; "Show password" toggle with a text label, reading "Hide password" while the password shows; errors are announced (`role="alert"`); tap targets at least 44 × 44 px; the Google button meets 4.5:1 contrast and says "Continue with Google" in text, not only a logo.
- **Where errors go (r4, G-12):** an error about one field shows under that field, which is marked invalid (`aria-invalid`) and linked to the message (`aria-describedby`). An error about the email and password together, or about no single field, shows above the form inside the card. Both kinds are `role="alert"`. After a failed check on submit, focus moves to the first field with an error; after a form-level error, focus stays where it was and the alert is announced.
- **When fields are checked (r4, G-1):** format and length are checked when the person leaves a field they typed in, and again on submit; empty fields are checked only on submit, so nobody is scolded for tabbing past. The email check uses the same library validator as REQ-003 (CODING-STANDARDS), not a home-made pattern. "Your name" allows 80 characters, and the check also runs on paste.
- **Forms:** `autocomplete="email"`, `current-password`, `new-password` and `name` so password managers and autofill work; email keyboard on phones; typing is never cleared by an error.
- **Consistency:** same green top bar and card as the mock-up; "Sign in" and "Sign out" everywhere (not "Log in"). **(r4)** The not-linked page and REQ-004's "Enter your invite code" are one page (G-18), so the glossary term is "Enter your invite code". The guard holding page and "What's your name?" reuse the same card.
- **Mobile-first:** a single card at 375 px; the primary button within thumb reach; no horizontal scroll.
- **States:** loading ("Signing in…", "Opening Google…", "Creating account…", "Sending…", "Saving…" on the disabled button); errors (copy of record); success (lands on the dashboard, the page asked for, or "Enter your invite code"); offline, one line per page (r4, G-15); unverified email (banner, below).
- **Verification banner (r4, G-6):** directly under the top bar on every signed-in page, including "Enter your invite code", "What's your name?", the lot confirmation, dashboards, staff pages and the guard holding page; never on signed-out pages. It can't be dismissed. After "Send again" the banner text changes in place to "Sent. Check your inbox.", so nothing below it jumps. It goes away on the next open or reload after the person verifies.
- **Google window (r4, G-8, G-14, G-20):** closing it is not an error, so no message; a blocked window gets a message. Google refuses its sign-in inside apps' embedded browsers ([Google Developers blog, 2021](https://developers.googleblog.com/en/upcoming-security-changes-to-googles-oauth-20-authorization-endpoint-in-embedded-webviews/); which apps are affected today is what TC-01-T1 checks). In a known in-app browser the notice sits above the Google button. The Google button stays, because detection is a guess and a wrong guess shouldn't take Google away from someone it works for. If detection misses, Google shows its own refusal page, which we can't change (accepted).
- **Safe actions:** "Sign in", "Continue with Google", "Create account", "Send reset link", "Send again" and "Continue" are disabled while in flight, so a double tap makes one request. While Google is open, the email button is disabled too.
- **Roles:** what a signed-in person sees depends on REQ-002 and REQ-004. A hidden menu item is not protection; Firestore rules deny by default (SA-001 §8.1). **(r4, G-11)** After sign-in the person returns to the page they asked for, and the normal REQ-002 access check decides whether they may see it, so there is one check, not two. Returning to the asked-for page beats "always the dashboard" because homeowners will mostly arrive from links in emails and announcements. **(r4, G-19)** A guard-only account sees the holding page in R1 (owner decision 4). A guard who is also linked to a household sees their household dashboard and the homeowner menu, with no gate menu and no "Guard" in the view switch. Their household is real and usable, and a gate menu with nothing behind it would only confuse.

## Copy of record

| Where | Text |
|---|---|
| Sign-in page heading | Sign in to {HOA name} |
| Sign-in page subline **(r4)** | Pay dues, see your statement and get HOA news. |
| Google button | Continue with Google **(r4)** (in flight: Opening Google…) |
| Divider | or use your email |
| Fields | Email · Password · Show password **(r4)** (while showing: Hide password) |
| Primary button | Sign in (in flight: Signing in…) |
| Link | Forgot password? |
| Link | New here? Create an account |
| Wrong password | That email and password don't match. Try again, or reset your password. **(r4)** Second line: Signed up with Google? Use Continue with Google. (owner decision 5a) |
| Too many attempts | Too many attempts. Wait a while, or reset your password. |
| Create-account page heading **(r4)** | Create an account |
| Create-account field **(r4)** | Your name |
| Create-account button **(r4)** | Create account (in flight: Creating account…) |
| Create-account link **(r4)** | Already have an account? Sign in |
| Reset page heading **(r4)** | Reset your password |
| Reset button **(r4)** | Send reset link (in flight: Sending…) |
| Reset page link **(r4)** | Back to sign in |
| Reset sent | If there's an account for {email}, we've sent a link to reset the password. Check your spam folder too. |
| Email already has an account | There's already an account for this email. Sign in, or reset your password. **(r4)** "Sign in" and "reset your password" are links that carry the email |
| Short password | Use at least 8 characters (also shown when the create-account password is empty) |
| Empty email **(r4)** | Enter your email address |
| Malformed email **(r4)** | Enter an email address like name@example.com |
| Empty password, sign-in **(r4)** | Enter your password |
| Empty name **(r4)** | Enter your name |
| Name too long **(r4)** | Use 80 characters or fewer |
| Name page **(r4)** | What's your name? · The admin office sees this name next to your lot. · Your name · Continue (in flight: Saving…) |
| Person record not saved **(r4)** | We couldn't save your details. Check your connection and try again. |
| Unverified banner | Check your email to verify your address. · Send again **(r4)** (in flight: Sending…) |
| Verification re-sent **(r4)** | Sent. Check your inbox. |
| Verification rate-limited **(r4)** | Too many emails sent. Wait a while, then try again. |
| Not linked | Your account isn't linked to a household yet. Enter the invite code from the admin office. **(r4)** Shown on the page headed "Enter your invite code" (REQ-004 copy) |
| Signed in as **(r4)** | Signed in as {email} (under the form on "Enter your invite code", "What's your name?" and the guard holding page) |
| No access | You don't have access to this page |
| Offline, sign-in | You're offline. Connect to the internet to sign in. |
| Offline, create-account **(r4)** | You're offline. Connect to the internet to create your account. |
| Offline, reset **(r4)** | You're offline. Connect to the internet to send the reset link. |
| Google window blocked **(r4)** | Your browser blocked the Google sign-in window. Allow pop-ups for this site, or sign in with your email. |
| Google, other failure **(r4)** | Google sign-in didn't work. Try again, or sign in with your email. |
| In-app browser **(r4)** | Google sign-in doesn't work inside this app. Open this page in Chrome or Safari, or sign in with your email. · Copy link · after copying: Link copied. Paste it into Chrome or Safari. |
| In-app browser, copy blocked **(r4)** | Press and hold to copy (under the page address, shown selected in a box) |
| Email has a password, Google tried **(r4)** | This email already has a password. Sign in with your email and password. |
| Turned-off account **(r4)** | This account is turned off. Contact the admin office. |
| Password older than the policy **(r4)** | Your password is shorter than we now allow. Reset your password to choose a new one of at least 8 characters. ("Reset your password" is a link) (owner decision 3) |
| Guard holding page **(r4)** | Gate screens aren't open yet · Keep using the gate's logbook until the admin office tells you they are ready. · Sign out (owner decision 4) |

## Out of scope

- The privacy notice and consent at first sign-in (backlog story 05, its own REQ).
- SMS sign-in (Option C), unless the owner picks it.
- 2-step verification for homeowners. For staff, see Decisions for the owner.
- Locking an account after a set number of failed sign-ins. Firebase doesn't offer it; building our own is a project (Sol Arch review).
- Deleting an account, or a homeowner's request for a copy of their data (Data Privacy Act); a later REQ.
- Changing the email on an account.
- **(r4, G-6)** Showing the admin office whether a person's email is verified. Deliberately left out: verification grants no access (the invite code does), so the office has nothing to act on. If the office later needs it, it belongs in the directory (REQ-003), not here.
- **(r4, G-2)** Editing your name after sign-up, and a separate preferred name for the greeting.
- **(r4, G-16)** Adding Google sign-in to an existing password account from inside the portal. The person keeps signing in with their password.
- **(r4, G-3)** Collecting a phone number at sign-up. The household's mobile comes from the office (REQ-003).
- **(r4, G-14)** Opening the system browser automatically from an in-app browser. Apps don't reliably allow it, so we tell the person and offer "Copy link" instead.
- **(r4, G-5)** A screen for the office to turn accounts off. Only the Firebase console can do it; removing a person from a lot (REQ-004) is the everyday tool and takes effect at once.

## Open questions

| Question | Who decides |
|---|---|
| D1: Option A, B or C | Owner |
| 2-step verification for staff (Decisions for the owner, row 2) | Owner, with Sol Arch confirming the cost |
| Does the HOA own a domain, so reset and verification emails come from it rather than a Firebase address? (SA-001 Q7) | HOA board |
| How should a homeowner with no email sign in: a family member's email, or a Google account the office helps create? | HOA board |
| ~~**(r4)** Owner decisions 3 to 5~~ | Answered: approved by the owner, 2026-11-28 |
| **(r4, G-14)** When the office shares the portal address in Facebook groups or Messenger, add "Open in Chrome or Safari". Recommended: yes, in every post and on the printed slip's step 1. No software change | Admin office |

## r4 change log

Every open gap from QA's "Requirement gaps for the BA" in TC-01 v1.1. G-9 and G-10 were withdrawn by QA and are not listed. The items under TC-01's "Open with Sol Arch" are Sol Arch's and are not settled here.

| Gap | Answer | Where in this REQ |
|---|---|---|
| G-1 Missing copy | Added every missing line: empty and malformed email, empty password, "Your name" required with 1–80 characters after trimming, page headings, "Send reset link", "Back to sign in", "Already have an account? Sign in", "Signed in as {email}", "Hide password", "Creating account…". *After Sol Arch:* the `users` rule enforces the name length, create only, no update in R1 | Copy of record (r4 rows); scenario "Field checks…"; UX "When fields are checked"; Data "Name" |
| G-2 Name on the Google path | From the Google profile name; if none, a "What's your name?" step before the invite code. Greeting = first word; "Welcome back" if no name. Not overwritten later | Scenarios "Signing up with Google…", "A Google account with no name…", "The greeting uses…", "Later Google name changes…"; Data "Person record rules" |
| G-3 Phone | Dropped from REQ-001. The mobile number is the office-entered `householdContacts.contactMobile` (REQ-003). *After Sol Arch:* also dropped from SA-001 §4.2 and the rule (SA-001 follow-up) | Data table and "Person record rules"; Out of scope |
| G-4 Trimming | Leading and trailing spaces removed from every typed email and from the name; never from the password | Scenarios "Spaces around the email…", "Spaces in a password…", "The name is stored…"; Data |
| G-5 Turned-off account | "This account is turned off. Contact the admin office." at sign-in if Firebase says so, otherwise the message for that failure. *After Sol Arch:* any password and Google both covered; reported before the password check (accepted limitation); refresh on every open signs a turned-off account out at the next open; within an hour if the portal stays open | Scenarios "A turned-off account at sign-in" (outline), "…while signed in", "…while the portal stays open"; Story "Accepted limitation (r4)"; Data settings line; Copy; Out of scope |
| G-6 Verification banner | Under the top bar on every signed-in page, not dismissible; "Sent. Check your inbox."; rate-limit copy; office view of verification left out | Scenarios (four, "verify your email" banner); UX "Verification banner"; Copy; Out of scope |
| G-7 Carrying the email | Carried, editable, to reset and back, and from the duplicate-email and Google "already has a password" messages; memory only, never in the address | Scenarios "The typed email goes…", "From 'There's already an account'…", "…never appears in the page address"; Data "Carried between pages" |
| G-8 Google window closed or blocked | Closed: silent, back to idle *within 10 seconds (after Sol Arch)*. Blocked: message to allow pop-ups or use email. Any other Google failure: a generic Google message | Scenarios "Closing the Google window…", "The browser blocks…", "Google sign-in fails…"; Copy |
| G-11 Deep link | Return to the page asked for; REQ-002's normal check decides access; not-linked people go to "Enter your invite code". *After Sol Arch:* the asked-for page is kept in memory as a portal route; no return address is ever put in the page address, and `?next=` and similar are ignored (outline with three examples) | Scenarios (four, "Signing in from a link…"); UX "Roles"; Data "Carried between pages" |
| G-12 Error placement | One-field errors under the field; two-field or form-level errors above the form; both announced; focus rules | Scenarios "After a failed check…", "Errors about the whole form…"; changed "A wrong password…"; UX "Where errors go" |
| G-13 Pre-policy passwords | **Owner decision 3:** keep Require; copy sends the person to reset. *After Sol Arch:* generic message promised only for wrong passwords of 8+ characters; tested on staging; "Require" named as both settings; a later tightening is a new owner decision | Owner decisions; scenario "A password set before…"; Copy; Data settings line |
| G-14 In-app browsers | Notice above the Google button with "Copy link"; email form still works; office adds "Open in Chrome or Safari" to shared links. *After Sol Arch:* "Link copied" only once the copy worked; if copying is blocked, the address shows selected with "Press and hold to copy" | Scenario "Opening the portal inside an app's own browser"; UX "Google window"; Copy; Open questions; Out of scope |
| G-15 Offline on other pages | One offline line per page | Scenario "Offline on each signed-out page"; Copy |
| G-16 Google on an address with a password account | Not signed in, no second account, "This email already has a password. Sign in with your email and password." with the email filled in. *After Sol Arch:* applies only to addresses whose mail is not hosted by Google, with a generic fallback; new scenario for a verified Gmail password account (same account, no second one; password outcome from staging) | Scenarios "Google sign-in on an address that already has a password account", "…on a verified Gmail address…"; Copy; Data settings line; Out of scope |
| G-17 Google-only account using email or reset | Generic message, plus a second line for everyone (same alert, announced once); reset may add a password and keeps the same account, confirmed on staging | **Owner decision 5**; changed "A wrong password…"; scenario "A Google-only account asks for a password reset" |
| G-18 Landing after reload | One page, "Enter your invite code", carrying the not-linked line, after creation and after any reload | Changed "Signed in but not linked…"; UX "Consistency"; mockup 1G |
| G-19 Guard in R1 | **Owner decision 4:** no guard role before gate screens; holding page as safety net. *After Sol Arch:* also `setRole` refuses guard while `GUARD_ROLE_ENABLED` is off (REQ-002 follow-up); the rules line now covers household data and other people's staff records | Owner decisions; scenario "A guard account in R1"; Copy; Follow-up for REQ-002 |
| Sol Arch's new gap: guard who is also linked to a household | Their household dashboard and homeowner menu, no gate menu, no "Guard" in the view switch, until the gate screens ship | Scenario "A guard who is also linked to a household, in R1"; UX "Roles"; Follow-up for REQ-002 |
| G-20 Google in flight | "Opening Google…", disabled; email button disabled too; one window on double tap | Scenario "While Google sign-in is open"; Copy; UX "Safe actions" |
| G-21 Person record not saved | Message at "Continue"; created at next load, asking the name if unknown. *After Sol Arch:* message within 15 seconds (offline saves wait, not fail); code not used up (`redeemInvite` refuses without a record); Google sign-ups never asked; same 15-second limit on "What's your name?" | Scenarios "The person record could not be saved…", "A Google account with no name…"; Data "Missing record"; Follow-up for REQ-004; Copy |

**Mockup (r4):** 1G changed to the single "Enter your invite code" page. New: 1H sign-in states (Google in flight, blocked, offline), 1I in-app browser, 1J create-account field errors, 1K "What's your name?", 1L verification banner, 1M guard holding page. *After Sol Arch:* 1I gains the "Press and hold to copy" state; no other screen was made wrong.

## Follow-up for REQ-002 (r4)

REQ-002 is not edited by this revision. The BA words these for the next REQ-002 revision:

- **Server half of owner decision 4 (Sol Arch r4, change 7):**
  ```gherkin
  Scenario: The guard role can't be granted before the gate screens are released
    Given the guard role is not enabled on this project
    When the developer runs setRole to grant Rodel Bautista the guard role
    Then setRole refuses with "The guard role is not available until the gate screens are released"
    And Rodel's account and staff record are unchanged
  ```
  `GUARD_ROLE_ENABLED` is a per-project deploy setting, off on production until the gate release.
- **Guard who is also a homeowner (Sol Arch's new gap):** until the gate screens ship, they see their household dashboard and homeowner menu, with no gate menu and no "Guard" in the view switch. REQ-001's scenario "A guard who is also linked to a household, in R1" carries it meanwhile.

## Follow-up for REQ-004 (r4)

REQ-004 is not edited by this revision. For its next revision (Sol Arch r4, question 5): `redeemInvite` refuses if the person has no `users/{uid}` record, and the invite is then not used up. Calls to `checkInvite` and `redeemInvite` give up after 15 seconds, so the offline message shows promptly.

## Sol Arch review (r4)

> **BA note (r4):** all 11 "Criteria to change" below are applied to the criteria, data and copy above. The additions to owner decisions 3 to 5 are in the Owner decisions table. The REQ-002 scenario and the guard-who-is-also-a-homeowner gap are under [Follow-up for REQ-002](#follow-up-for-req-002-r4), and the `redeemInvite` check is under Follow-up for REQ-004; neither REQ is edited. The BA recommends that a guard who is also linked to a household sees their household dashboard and no gate menu. The r4 change log marks each change "After Sol Arch".

*Sol Arch, 2026-11-28, draft.* I reviewed only the `@r4-new` and `@r4-changed` scenarios and the lines marked (r4). Baseline: branch `claude/req-001-r4-3b8cb2` at `191e740` plus the uncommitted r4 diff. Checked against SA-001 r3 (§4.2, §8.1, §8.4) on `docs/sa-001-architecture` at `e28d9bc`. There is no application code yet. Firebase behaviour comes from the official docs and the Firebase JS SDK and emulator source, all fetched 2026-11-28 (Sources, below). Where they are silent, I say **Uncertain**.

**Verdict: Supports with changes.** The r4 additions fit SA-001. Eleven criteria need rewording, mostly because Firebase does not behave quite as written: a turned-off account is reported before the password is checked, Google never raises "already has a password" for Gmail or Google Workspace addresses, and Firestore writes don't fail when offline, they wait. Two items need a server-side check added (`redeemInvite`, `setRole`). I support all three new owner recommendations (rows 3–5), with one extra note on row 3.

#### Answers to the BA's questions

| # | Question | Answer | Confidence |
|---|---|---|---|
| 1 | **G-13** Require mode and older passwords | The SDK expects Firebase to refuse such a sign-in with `auth/password-does-not-meet-requirements`: `signInWithEmailAndPassword` handles that code (SDK source). The docs don't say whether the check runs before or after the password is matched. Either way nothing leaks: the result depends on what was typed, or on knowing the right password. But if the check runs first, a wrong short password gets the "shorter than we now allow" message, not the generic one. So the scenario's last line must only claim the generic message for wrong passwords of 8 or more characters (change 4). Also, "Require" is two settings in the API: enforcement on (`enforcementState: ENFORCE`) and `forceUpgradeOnSignin: true`. The Identity Platform page says the second is what makes existing users comply. The go-live line should name both | Error code: confirmed in SDK source. Order: **Uncertain** (staging test) |
| 2 | **G-16** Google on an address that has a password account | With "one account per email address" on, Google sign-in on an address that already has a password account throws `auth/account-exists-with-different-credential` (Google sign-in page). **But not for every address.** "A user logging in with Google will never cause this error when their account is hosted at Google." Google is trusted for Gmail addresses (Users page). So Ben's case happens only for an address whose mail is *not* hosted by Google, registered as a Google account. For a Gmail address, an unverified password account is overwritten (r3 scenario). A **verified** Gmail password account is not covered by the docs, and that is the commonest case here (change 5). The enumeration-protection page doesn't mention this error. It reveals nothing new either way: only someone who controls that Google account can trigger it | Error and trusted-provider rule: confirmed in docs. Under enumeration protection: **Uncertain**. Verified Gmail case: **Uncertain** |
| 3 | **G-17** Reset on a Google-only account | With enumeration protection on, "a verification email is sent only if the email address exists". A Google-only account's email exists, so the reset email goes. Setting a password updates that same account record, so the uid and the household stay. No doc says this outright | Email sent: confirmed. Same uid: expected, **Uncertain** until tested on staging (TC-01) |
| 4 | **G-5** Turned-off account at sign-in | The docs don't say. The Auth emulator's code (firebase-tools PR #6702) returns `USER_DISABLED` with protection on, **before** it checks the password. If production matches, anyone typing that email with any password learns the account exists and is turned off. That is acceptable: accounts are turned off rarely, only in the console, and they see no data. Keep the fallback to the generic message. `signInWithPopup` for a turned-off Google account should give the same code (changes 1 and 2). How soon a signed-in account is cut off: see question 8 | **Uncertain** for production (emulator source only). Staging test |
| 5 | **G-21** Create-if-missing and `redeemInvite` | Yes to create-if-missing. On every open, the app reads `users/{uid}`. If the record is missing, the app creates it: the email from the account, the name from memory, or the Google profile name, or else "What's your name?". `redeemInvite` **should** require the record. The office directory (REQ-003) shows the person's name next to the lot from `users/{uid}`, so a member with no record shows as a blank. So `redeemInvite` reads `users/{uid}` inside its transaction and refuses with `failed-precondition` if it is missing. The invite is then not used up. The app creates the record and tries again. That is the server-side half of the BA's "Continue makes sure the record exists first". **Offline catch:** a Firestore write made offline does not fail. It waits in memory until the connection returns. So "Saving…" would never end on its own. The app must stop waiting after a set time (I suggest 15 seconds), show the error and enable the button again. The waiting write may still land later. So a retry that is refused because the record now exists counts as success: read the record again and carry on (change 10) | Design. Offline write behaviour: Firestore offline docs |
| 6 | **G-1** Name 1–80 in the rule | Yes. The `users` create rule checks `name is string`, `name == name.trim()`, and `name.size()` from 1 to 80. Rules have `trim()` and `size()` ("number of characters", rules String reference). The reference doesn't say whether "characters" means letters or bytes. So test the 80 limit with "ñ" and an emoji, and make the page count the same way | Rule functions: confirmed. Counting: **Uncertain** (rules test) |
| 7 | **G-3** `phone` in `users` | **Drop it** from SA-001 §4.2 and from the rule's allowed fields. No REQ writes it and none reads it (I searched REQ-002 to REQ-004: no reader). A field with no writer and no reader breaks the risk checklist. The household mobile is `householdContacts.contactMobile`, which is staff-only. Allowed fields become `name`, `email`, `createdAt` | Confirmed by search |
| 8 | **G-6** Refreshing the verified flag | On every open or reload, after Firebase restores the session, the app calls `user.reload()` once, inside `try` (CS-4). That fetches the account again, so `emailVerified` is current and the banner clears. It also helps question 4: if the account is turned off, the SDK signs the person out (SDK source: `user-disabled` and `user-token-expired` trigger sign-out). The app sees the `user-disabled` code, so it can show "This account is turned off". This answers the BA's "sooner only if Sol Arch adds a refresh when the portal opens": **added**. While a page stays open, Firestore still accepts the current ID token for up to an hour (L-004). Removing the person from the lot (REQ-004) is the tool that works at once | Sign-out on `user-disabled`: SDK source. That production returns it on reload: **Uncertain**, staging test |
| 9 | **G-11** Return to the page asked for | Put **no return address in the page address at all**. When a signed-out person opens a portal page, the route guard shows the sign-in page and keeps the asked-for route in memory, as a route name and its parameters, not as a web address. After sign-in the app goes to that route, and REQ-002's normal check decides access. A route name can only be a portal page, so there is nothing to redirect elsewhere. Any `?next=` or similar in the address is ignored (change 8). This works with the Google popup flow (§8.4), because the page never reloads. If the build ever switches to the redirect flow, the route goes in `sessionStorage`, which ends with the tab. Never `localStorage`. The invite code stays after `#` as SA-001 designs it (L-005) | Design |
| 10 | **G-14** Detecting in-app browsers | It is a guess, so keep it small and easy to change. One function, `isLikelyInAppBrowser(userAgent)`, takes a token list from config. It does plain substring checks, no regex (CS rule for S8786). It is unit-tested with real user-agent strings collected in TC-01-T1. Examples to verify on real phones: Facebook and Messenger add `FBAN`, `FBAV` or `FB_IAB`; Instagram adds `Instagram`; Android web views add `; wv)`; on iPhone, a web view usually lacks the `Safari/` token. Never log or store the user-agent. The BA's design already handles a miss: the Google button stays, and Google shows its own refusal page. One gap: web views often block the clipboard, so "Copy link" needs a fallback (change 9). If the app removes the invite code from the address after reading it, "Copy link" must put it back from memory | Token list: **Uncertain**, verify on devices |
| 11 | **G-19** `setRole` refusing the guard role | **Yes, add it.** A process rule alone is one tired evening from a guard account with nothing to use. `setRole` refuses `guard` while a per-project function setting, `GUARD_ROLE_ENABLED`, is off. The setting is a deploy-time parameter, not a Firestore document, so no client can switch it on. It is off on production until the R4 release, and can be on in staging to build R4. Cost: a few lines and one test. The holding page stays as the safety net. This is a REQ-002 criterion (change 7) | Design |

#### Criteria to change (quoted, then corrected)

1. **"A turned-off account at sign-in"** (G-5). *"When he enters his email and correct password and presses "Sign in""*. If production follows the emulator, the password doesn't matter. Corrected:
   ```gherkin
   Scenario Outline: A turned-off account at sign-in
     Given Juan's account has been turned off in Firebase
     When he <tries>
     Then he is not signed in and sees no household data
     And he sees "This account is turned off. Contact the admin office." if Firebase reports the account as turned off
     And otherwise he sees the message for that kind of failure

     Examples:
       | tries                                                           |
       | enters his email and any password and presses "Sign in"         |
       | presses "Continue with Google" and chooses his turned-off account |
   ```
   Add under the Story: "**Accepted limitation (r4):** typing the email of a turned-off account shows that it exists and is turned off, whatever the password. Accounts are turned off rarely, only in the Firebase console, and see no data."
2. **"An account turned off while signed in"** (G-5). *"When his sign-in next refreshes (within an hour; sooner only if Sol Arch adds a refresh when the portal opens)"*. The refresh at open is now in the design (question 8). A sign-out in the background doesn't tell the app why. Corrected:
   ```gherkin
   Scenario: An account turned off while signed in
     Given Juan is signed in and his account is then turned off
     When he next opens or reloads the portal
     Then he is signed out and sees the sign-in page with "This account is turned off. Contact the admin office."
     And no household data shows after that

   Scenario: An account turned off while the portal stays open
     Given Juan keeps the portal open and his account is turned off
     Then within an hour he is signed out and sees the sign-in page
     And no household data shows after that
     And if he tries to sign in again, he sees "This account is turned off. Contact the admin office."
   ```
3. **"A wrong password does not reveal whether the email exists"** (`@r4-changed`). Supported as written. One note for the build: the second line is part of the same alert, not a second alert, so a screen reader announces it once.
4. **"A password set before the 8-character policy"** (G-13). *"And an unknown email or a wrong password still shows the wrong email or password message"*. If Firebase checks the policy before the password, a wrong short password gets the policy message. Corrected last line, plus one line on where it is tested:
   ```gherkin
     And an unknown email, or a wrong password of 8 or more characters, still shows the wrong email or password message
     And this is checked on a staging project, because the emulator does not copy the console's password policy
   ```
   Also change the settings line *"password policy Require, minimum 8"* to *"password policy Require (enforcement on, and "force upgrade on sign-in" on), minimum 8"*.
5. **"Google sign-in on an address that already has a password account"** (G-16). *"a company address that also has a Google account"*. A company address on Google Workspace is "hosted at Google", so this error never fires for it. Corrected Given, and one fallback line:
   ```gherkin
     Given Ben has an email-and-password account for "ben@acme.example", a company address whose mail is not hosted by Google, and he has registered that address as a Google account
     ...
     And if Firebase refuses without saying the email already has a password, he sees "Google sign-in didn't work. Try again, or sign in with your email." and still no second account is created
   ```
   **Add a scenario for the commonest case**, a verified Gmail password account. Its outcome isn't documented, so the last line waits for the staging result:
   ```gherkin
   Scenario: Google sign-in on a verified Gmail address that already has a password
     Given Juan verified his email-and-password account for "juan.dc@gmail.com", which is linked to Blk 4 Lot 12
     When he presses "Continue with Google" and chooses that Gmail account
     Then he is signed in to the same account and lands on Blk 4 Lot 12's dashboard
     And no second account is created
     And whether his password still works afterwards is recorded from the staging test (Sol Arch: Uncertain)
   ```
6. **"A Google-only account asks for a password reset"** (G-17). Supported. Add one line so the test checks the account, not just the screen: `And it is the same account, and no second account is created`.
7. **"A guard account in R1"** (G-19). *"And Firestore refuses any household or staff read from his account"*. A guard has a `staff/{uid}` record, and TC-01 J4/J5 still has to settle whether a person may read their own. Corrected: `And Firestore refuses any read of household data, or of anyone else's staff record, from his account`. **Add to REQ-002** (BA to word), the server half of owner decision 4:
   ```gherkin
   Scenario: The guard role can't be granted before the gate screens are released
     Given the guard role is not enabled on this project
     When the developer runs setRole to grant Rodel Bautista the guard role
     Then setRole refuses with "The guard role is not available until the gate screens are released"
     And Rodel's account and staff record are unchanged
   ```
   **Gap:** a guard who is also linked to a household is not covered. I suggest he sees his household dashboard and no gate menu. BA to confirm in REQ-002.
8. **"A return address outside the portal is ignored"** (G-11). *"Given a link to the sign-in page asks to return to an address outside the portal"*. Make it concrete, and state that the portal never makes such links:
   ```gherkin
   Scenario Outline: A return address in the page address is ignored
     Given the sign-in address has "<extra>" added to it
     When Juan signs in
     Then he lands on his dashboard, not the outside address
     And the portal itself never puts a return address in the page address

     Examples:
       | extra                         |
       | ?next=https://evil.example    |
       | ?next=//evil.example          |
       | #next=https://evil.example    |
   ```
9. **"Opening the portal inside an app's own browser"** (G-14). After *"Then the page address is copied, including any invite code in it"*, add:
   ```gherkin
     And "Link copied" shows only once the copy has worked
     And if the app's browser blocks copying, the page address shows selected in a box, with "Press and hold to copy"
   ```
   Add the copy row: "In-app browser, copy blocked: Press and hold to copy".
10. **"The person record could not be saved when the account was made"** (G-21). *"When she presses "Continue" on "Enter your invite code" while still offline / Then she sees "We couldn't save your details…""*. Offline, the save waits instead of failing, and the Google path never needs to ask. Corrected:
    ```gherkin
    Scenario: The person record could not be saved when the account was made
      Given Ana created an email-and-password account, but her person record was not saved because she lost signal
      When she presses "Continue" on "Enter your invite code" while still offline
      Then within 15 seconds she sees "We couldn't save your details. Check your connection and try again."
      And the code she typed is kept, and "Continue" can be pressed again
      And her invite code is not used up
      When she presses "Continue" again once online
      Then her person record is created with her account's email and the name she typed, and then her code is checked
      But if she closed the portal first, the next time she opens it she sees "What's your name?" before "Enter your invite code"
      And someone who signed up with Google is not asked: the name comes from the Google profile again
    ```
    The same 15-second limit applies to "Saving…" on "What's your name?": add `And if the save doesn't finish within 15 seconds, she sees "We couldn't save your details. Check your connection and try again." and "Continue" can be pressed again` to "A Google account with no name is asked for one".
11. **"Closing the Google window without choosing an account"** (G-8). *"And "Continue with Google" reads "Continue with Google" again"*. Firebase notices a closed window only after a short delay, and the docs don't say how long. Add `within 10 seconds` so the test has a limit. If staging shows more, the BA changes the number.

**Supported as written:** the field-check outline, focus and placement (G-1, G-12), trimming (G-4), name and greeting rules (G-2), "While Google sign-in is open" (G-20; Firebase's `cancelled-popup-request` on a second press is ignored without a message), blocked and other Google failures, the email carried in memory (G-7), the offline outline (G-15; Firebase's `network-request-failed` maps to it), the four banner scenarios (G-6), the three deep-link scenarios not listed above, and the changed not-linked outline (G-18).

#### Owner decisions 3 to 5: Sol Arch view

| # | Sol Arch |
|---|---|
| 3 | **Agree: Require.** One thing to add: with Require on, **tightening the policy later** (say, to 10 characters) refuses every existing password that is too short at its next sign-in. Firebase warns against this for projects with active users. So any later change to the policy is a new owner decision, made with Notify on the table. Recorded as an SA-001 follow-up |
| 4 | **Agree, and make it a server check too.** `setRole` refuses the guard role until `GUARD_ROLE_ENABLED` is on for that project (question 11). The process rule stays, and the holding page is the last line of defence |
| 5 | **Agree with (a) and (b).** (a) shows on every wrong attempt, so it reveals nothing. (b) The reset only reaches whoever controls the mailbox, who can already use Google for that address. Same uid: expected, confirm on staging (question 3) |

#### Data

- **`users/{uid}` rule (r4):** create only, by the owner of the uid. Allowed keys: `name`, `email`, `createdAt`. `name` is a string, equal to `name.trim()`, 1 to 80 characters. `email == request.auth.token.email`. `createdAt == request.time`. **No update in R1.** That enforces "written once" for the name, and both editing the name and changing the email are out of scope. A second create, from two tabs or a delayed write, is refused; the app reads the record again and carries on.
- **Google name:** cut to 80 characters *and then* trim, so a cut doesn't leave a trailing space. A Google name of only spaces counts as no name.
- **Settings line:** add "one account per email address" (the console's account-linking setting; I believe it is the default, confirm in the console). It is TC-01 R5.
- **Email check:** REQ-003's validator must accept addresses Firebase accepts, such as `juan+hoa@gmail.com`. One shared helper, so check both callers when it changes.

#### Risks not covered

| Checklist item | Answer |
|---|---|
| Repeat-trigger | Covered. Every new button has an in-flight state. Writes are safe to repeat: the `users` create-only rule refuses a second create, and `redeemInvite` is already transactional |
| Stale references | `redeemInvite` now checks `users/{uid}` inside its transaction (question 5) |
| Field written, never read | `phone`: drop it (question 7). `createdAt` is read only by audit and support. Fine |
| Schema and rules as a pair | The `users` rule ships with the REQ-001 code. Nothing exists yet, so the deploy order doesn't matter |
| Copy that promises an outcome | "Sent. Check your inbox." means Firebase accepted the request, not that the email arrived. Acceptable, given "Check your spam folder" on reset. "Link copied" shows only after the copy works (change 9) |
| Existing data | None on production. On test projects, short passwords are refused (row 3). Tightening the policy later is the real risk (row 3) |
| Identity keys | Gmail ignores dots. Google sees `juan.dc@gmail.com` and `juandc@gmail.com` as one mailbox, but a password account treats them as two emails. So one person could end up with two accounts. Low likelihood. The office sees it as one person with two accounts in REQ-003. Accepted, noted for QA |
| Roles and leakage | Guard holding page is enforced by rules (change 7) and by `setRole` (question 11) |
| Environments | `GUARD_ROLE_ENABLED`, the password policy and account linking are per project. Add them to the §8.4 checklist. The emulator copies none of them, so those tests run on staging |
| Secrets and PII | No email in the address (G-7, good). No return address in the address (question 9). Never log the user-agent |
| Offline, timeouts | Firestore writes wait offline instead of failing (change 10). Callable functions default to a 70-second wait. Set `redeemInvite` and `checkInvite` calls to 15 seconds so the offline message shows promptly (REQ-004) |
| Scale and cost | One `users` read and one `reload()` per open. Negligible at 623 households |
| Observability | The app has no client log pipeline in R1. The Auth usage dashboard shows sign-up spikes. Accepted for R1 |
| SonarQube | Map Firebase error codes to messages with a lookup table, not a `switch`, to keep complexity at 15 or below (S3776). Every `await` goes inside `try`, including `reload()` at open (S9383). In-app detection uses substring checks, not regex (S8786). Copy and error mapping are plain modules, unit-testable without a browser, so they count towards coverage |

#### SA-001 follow-ups (recommended; I have not edited SA-001)

- **§4.2 `USERS`:** drop `phone`, add `createdAt`. State the create-only rule above. Drop "contact" from the §8.2 `users` row.
- **§3 functions:** `redeemInvite` refuses with `failed-precondition` if `users/{uid}` is missing. `setRole` refuses `guard` while `GUARD_ROLE_ENABLED` is off.
- **§8.4:** add rows for one account per email address; password policy as "enforcement on plus force upgrade on sign-in"; "any later tightening of the policy needs an owner decision"; `GUARD_ROLE_ENABLED` per project. Note that the emulator copies none of these.
- **§9 frontend:** call `user.reload()` once at open; keep the asked-for route in memory, never as a return address; use a 15-second limit on Firestore writes and callable calls on sign-in pages; one error-code lookup table; one `isLikelyInAppBrowser` module with a config token list.
- **§11.1 risks:** a turned-off account is revealed by its email (accepted); verified Gmail password account then Google (Uncertain until staging); policy tightening locks people out.
- **LEARNINGS.md** (to add with the SA-001 revision): L-006 "Firestore writes made offline wait instead of failing, so every save needs a time limit". L-007 "Google never raises account-exists for Google-hosted addresses; design that flow per address type".

#### Size

The r4 additions add about **1–1.5 person-days with Claude Code** to the r1 estimate. That covers field checks, the name page and create-if-missing, Google states, in-app notice, banner, deep links, the guard holding page, `setRole` and `redeemInvite` checks, rules tests, and the staging tests for the settings-dependent cases.

#### Sources (fetched 2026-11-28)

[Email enumeration protection](https://docs.cloud.google.com/identity-platform/docs/admin/email-enumeration-protection) · [Password policy (Identity Platform)](https://docs.cloud.google.com/identity-platform/docs/password-policy) · [Password auth, web](https://firebase.google.com/docs/auth/web/password-auth) · [Google sign-in, web](https://firebase.google.com/docs/auth/web/google-signin) · [Users and trusted providers](https://firebase.google.com/docs/auth/users) · [Auth emulator](https://firebase.google.com/docs/emulator-suite/connect_auth) · [Rules String reference](https://firebase.google.com/docs/reference/rules/rules.String) · [Offline data](https://firebase.google.com/docs/firestore/manage-data/enable-offline) ("Write operations are queued until network access is re-enabled") · [HttpsCallableOptions](https://firebase.google.com/docs/reference/js/functions.httpscallableoptions) (timeout "Default is 70000" ms) · SDK source: [email_and_password.ts](https://github.com/firebase/firebase-js-sdk/blob/main/packages/auth/src/core/strategies/email_and_password.ts), [invalidation.ts](https://github.com/firebase/firebase-js-sdk/blob/main/packages/auth/src/core/user/invalidation.ts) · Emulator source: [firebase-tools PR #6702](https://github.com/firebase/firebase-tools/pull/6702) (emulator only, hence Uncertain for production)

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**3–4.5 person-days with Claude Code** (was 3–4.5 (2–3 r1 + 1–1.5 r4; staff 2-step +1–1.5 not counted)). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0 · 0 · 1–1.5 · 1–1.5 · 1–1.5
- **Reuses:** Nothing in `index.html`: the mock-up has no sign-in, only the demo role switch at 554. The form CSS `.f`/`.fl` and `.alert` come with the shell (REQ-002). Screens drawn in `req-001-004-access-mockup.html` 497–532. New: everything

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
