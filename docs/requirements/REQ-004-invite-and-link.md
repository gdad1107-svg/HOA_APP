# REQ-004: Invite a homeowner and link them to a lot

| | |
|---|---|
| Raised by | Owner: "draft req-001 to 004 and have SA review it. I'll approve it tomorrow" (2026-11-28) |
| Epic | [EPIC-001 Access and households](../epics/EPIC-001-access-and-households.md) |
| Backlog story | [04 Invite a homeowner and link them to a lot](../backlog/BACKLOG.md#04-invite-a-homeowner-and-link-them-to-a-lot) |
| Status | **Approved** by the owner, 2026-11-28 ("approve it"), with every recommendation accepted. Sol Arch reviewed: supports Option A in two steps, with changes (applied in r2) |
| Mockup | Screens 4A–4H of the [access and households mockup](https://claude.ai/artifact/KaNMpY53cLTtrk8HARZgUr). Repo copy: [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html) |
| Architecture | SA-001 §8.1 (household linking), ADR-004 and ADR-002 (email), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-001, REQ-003 |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch's corrections applied (codes stored hashed, per-account guess limit, queued not sent); expiry, bounces, D3 and sale privacy listed as owner decisions | · r3, 2026-11-28: owner approval recorded; recommendations accepted

## Owner decisions

Approved by the owner on 2026-11-28 ("approve it"): every recommendation in the right-hand column is accepted. Questions for the HOA board or the admin office under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (email plus printed slips, in two steps), B (printed slips only) or C (self-registration with proof) | **A in two steps**: slips first, email once the provider is chosen |
| 2 | Invitation expiry | **Settings, defaulting to 7 days for emailed invitations and 30 days for printed slips**, ending at the end of the day shown, Manila time |
| 3 | Emails that bounce after they were handed to the provider (for example a typo like "exmaple.com"). Showing these needs the provider's bounce reports | **Include in step 2** (about 0.5–1 extra day once the provider is chosen). Typos in 623 addresses are likely |
| 4 | D3 for R1: a person already linked to one lot enters a code for another | **Refuse in R1** with a message to ask the office; revisit with D3 |
| 5 | **Privacy after a sale** (RA 10173): once linked, a new owner would see the lot's history, including the previous owner's receipts and payment screenshots. Doesn't block this REQ | Decide **before the payments REQ**. Sol Arch's options: members see records from their link date only, or screenshots are visible only to the uploader and staff |

## Problem

A signed-in person must be linked to the right lot before they see anything. Getting this wrong shows one family's finances to another (SA-001 R-6). Matching by email or phone is ruled out because families share them (ADR-004), so the link is an **invite code**: single-use, with an expiry, redeemed by the person.

The office also has to reach 623+ households, some with no email on file, and handle sales, where the old owner loses access and the new owner gains it.

## Options

### Option A: Emailed invitation with a one-tap link, plus printed code slips (recommended)

- **How it works:** the admin presses "Invite" on a household, or selects many and presses "Invite selected". Each gets an email with a button that opens the portal with the code filled in. Households with no email get a printed slip with the code. After signing in (REQ-001), the person sees "You're joining Blk 2 Lot 7", confirms, and is linked.
- **Cost:** moderate. The `redeemInvite` function and code entry are needed in every option; email adds the mail function and an email provider (ADR-002, provider not yet chosen).
- **Honest downside:** depends on the email provider and the HOA's sending domain being ready (SA-001 Q7); some invitations will land in spam.

### Option B: Printed code slips only

- **How it works:** the office prints a slip per household and hands it out (at the clubhouse, with the paper statement, or in person). The person types the code.
- **Cost:** cheap. No email provider needed in R1.
- **Honest downside:** slow: 623 slips to distribute, some lost, and every reprint makes a new code. Nothing reminds people who don't sign up.

### Option C: Self-registration, approved by the office

- **How it works:** the person signs up, picks their lot, and uploads proof (title, contract or ID). The office reviews and approves.
- **Cost:** a project, not moderate (Sol Arch review): document storage, a review queue and privacy controls.
- **Honest downside:** the office reviews hundreds of documents; the portal stores copies of titles and IDs (Data Privacy Act exposure); anyone can claim any lot, so a tired reviewer can link the wrong person.

### Recommendation

**Option A, built in two steps.** Step 1 is Option B: codes, code entry and printed slips, which needs no email provider. Step 2 adds email delivery once the owner picks a provider (SA-001 Q7). The code and the redemption are the same in both steps, so nothing is thrown away.

**How codes are kept:** the portal stores only a keyed hash of each code, so a code can be seen only at the moment it is made. That means printing always makes new codes (there is no "reprint"), and the code is removed from the email record once the email is handed over (Sol Arch review).

## Story

As an admin office staff member, I want to send each household an invitation, so that the right person is linked to the right lot.

## Acceptance criteria (Option A)

```gherkin
Feature: Linking an account to a lot

  Background:
    Given Blk 2 Lot 7 is in the directory with owner "Ana Reyes" and email "ana@example.com"
    And emailed invitations expire after 7 days and printed slips after 30 days

  Scenario: Send an invitation
    Given today is Nov 28, 2026
    When the admin presses "Invite" on Blk 2 Lot 7
    Then an invitation email to "ana@example.com" is queued with the subject "Your invitation to the Greenfield Homes HOA portal"
    And Blk 2 Lot 7 shows "Invited · expires Dec 5, 2026"

  Scenario: Accept an emailed invitation
    Given Ana received the invitation
    When she presses "Join the portal" in the email and signs in or creates an account, including with "Continue with Google"
    Then the code is kept through sign-in without her typing it
    And she sees "You're joining Blk 2 Lot 7 (Ana Reyes). Is this your lot?"
    When she presses "Yes, link my account"
    Then she lands on the Blk 2 Lot 7 dashboard
    And the directory shows Blk 2 Lot 7 as "Linked · 1 person"

  Scenario: Enter a printed code
    Given a printed slip for Blk 2 Lot 7 with code "K7QX-M9TA"
    When a signed-in person with no household enters "k7qx m9ta" on "Enter your invite code"
    Then they see "You're joining Blk 2 Lot 7 (Ana Reyes). Is this your lot?"

  Scenario: A wrong code
    When someone enters a code that does not exist
    Then they see "That code doesn't match an invitation. Check it, or ask the admin office for a new one."

  Scenario: Guessing codes is stopped
    Given Ana's account has had 5 codes refused as not matching in the last 15 minutes
    When she enters another code, right or wrong
    Then she sees "Too many wrong codes. Try again in 15 minutes."
    And the code is not checked
    And 15 minutes after her first refused code she can try again

  Scenario: An expired code
    Given the invitation for Blk 2 Lot 7 expired at the end of yesterday, Manila time
    When Ana enters its code
    Then she sees "This invitation has expired. Ask the admin office to send a new one."
    And Blk 2 Lot 7 shows "Invite expired" in the directory

  Scenario: A code can be used only once
    Given Ana already used code "K7QX-M9TA"
    When anyone else enters "K7QX-M9TA"
    Then they see "This invitation was already used. Ask the admin office for a new one."

  Scenario: The person who used a code enters it again
    Given Ana linked her account with "K7QX-M9TA"
    When Ana enters "K7QX-M9TA" again
    Then she lands on the Blk 2 Lot 7 dashboard

  Scenario: Two people redeem the same code at the same moment
    When two people submit the same unused code at the same time
    Then exactly one of them is linked
    And the other sees "This invitation was already used. Ask the admin office for a new one."

  Scenario: Resending replaces the old invitation
    Given an unused invitation for Blk 2 Lot 7
    When the admin presses "Resend invitation"
    Then a new invitation to "ana@example.com" is queued
    When anyone enters the old code
    Then they see "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."

  Scenario: A second person in the same household
    Given Ana is linked to Blk 2 Lot 7
    When the admin presses "Invite another person", enters "carlo@example.com" and picks "Family"
    Then Carlo gets his own code
    And after he redeems it, the directory shows "Linked · 2 people"

  Scenario: A person already linked to another lot
    Given Juan is linked to Blk 4 Lot 12
    When he enters a code for Blk 2 Lot 7
    Then he sees "Your account is already linked to Blk 4 Lot 12. Ask the admin office if you need access to another lot."

  Scenario: A code for a deactivated household
    Given Blk 7 Lot 1 was deactivated after its code was printed
    When someone enters that code
    Then they see "This invitation is no longer valid. Ask the admin office."

  Scenario: Invite many households at once
    Given 400 households are "Not invited" and 380 of them have an email
    When the admin selects them and presses "Invite selected"
    Then they see "Send 380 invitations? 20 households have no email. Print their slips instead."
    When they confirm
    Then the button reads "Queuing…" and is disabled until all 380 are queued
    And they see "380 invitations queued. Each household shows its email status."
    When the admin presses "Invite selected" again for the same households
    Then households that already have an unused invitation are skipped, not re-invited

  Scenario: Print code slips
    When the admin selects 20 households with no email and presses "Print invite slips"
    Then they see "Printing makes new codes. Any earlier unused code for these 20 households will stop working."
    When they confirm
    Then a PDF downloads with one slip per household showing the lot, the code, the expiry date and how to join
    And the slips show no balance, email or phone number
    And the PDF shows "Delete this file after printing."

  Scenario: Removing a person after a sale
    Given Ana is linked to Blk 2 Lot 7 and the lot is sold
    When the admin presses "Remove" next to Ana and confirms "Remove Ana Reyes from Blk 2 Lot 7? She will no longer see this lot. Its bills and payments stay with the lot."
    Then Ana no longer sees Blk 2 Lot 7
    And the lot's bills and payments stay on the lot
    And any unused invitation for Blk 2 Lot 7 stops working
    And the activity log records who removed her and when

  Scenario: An email the provider refuses is shown, not hidden
    Given the email provider refused the invitation to "ana@example.com" when it was handed over
    Then Blk 2 Lot 7 shows "Email failed" with "Resend" and "Print slip"

  Scenario: An email that bounces later is shown (if decision 3 is yes)
    Given the provider reports that the invitation to "ana@exmaple.com" bounced
    Then Blk 2 Lot 7 shows "Email failed" with "Resend" and "Print slip"
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Invitation: household, channel (email / print), sent to, relation (chosen by the admin), created, expires, status (active / used / replaced / cancelled), used by, used at | `invites/{codeHash}` (keyed hash of the code) | Single use; expiry from settings; "expired" is worked out from the expiry date, not stored; one active invitation per household and recipient | `createInvites` function | `checkInvite`, `redeemInvite`; staff read by household |
| Membership: household, person, relation, invite, invited by, linked at | `members/{householdId}_{uid}` (ADR-004) | Created only by `redeemInvite`, in a transaction that refuses a used, replaced, cancelled or expired code | `redeemInvite` | Rules (`isMember`); household screens |
| Wrong-code attempts | `inviteAttempts/{uid}` | 5 refused codes per 15 minutes per account | `checkInvite`, `redeemInvite` | Same functions |
| Link status and member count | `households/{id}.linkStatus`, `memberCount` | — | Invite functions | Directory (REQ-003) |
| Invitation email | `mail` queue (ADR-002) | Code removed after hand-off; status queued / sent / failed, never "delivered" | `createInvites` | Mail function; directory |
| Invitation expiry settings | settings (SA to name) | Days for email and for print | Treasurer, in Settings | `createInvites` |
| Change records | `auditLog` | Every invite, replacement, cancellation, redemption and removal; ids only | Functions | Board, treasurer |

The email link carries the code after `#`, so it never reaches server logs. Clients never read `invites`, `inviteAttempts` or `mail` except staff reading invitations by household.

## UX/UI notes

- **Accessibility:** the code field has a visible label, accepts lower case, spaces and hyphens, and uses a large monospaced font like the mock-up's pass code (`.code`); errors are announced.
- **Consistency:** codes look like the mock-up's guest pass codes (8 characters, `XXXX-XXXX`, no 0/O or 1/I); "Invite", "Resend invitation", "Remove" are the only labels used.
- **Mobile-first:** the join screens are single cards at 375 px; the email button is large enough to tap.
- **States:** "Not invited" (empty) → "Invited" → "Linked" or "Invite expired" or "Email failed", each a pill with text; loading on code check ("Checking…"); success lands on the dashboard.
- **Safe actions:** "Yes, link my account", "Invite selected" and "Remove" are disabled while in flight; "Remove" and "Print invite slips" are confirmed; the join screen shows the lot so the person can stop if it's the wrong one ("No, this isn't my lot" ends the join flow and tells them to contact the office).
- **Roles:** only admin office staff and the treasurer can invite or remove; a person can only redeem a code for themselves.
- **Privacy:** the confirmation screen shows the lot and the owner name on file, nothing else; slips show no balance or contact details; slips work like keys, so the office hands them over in person or in a sealed envelope.

## Copy of record

| Where | Text |
|---|---|
| Email subject | Your invitation to the {HOA name} portal |
| Email body | Hi {owner name}, the {HOA name} admin office has invited you to the resident portal for {lot}. Press the button to join. This invitation expires on {date}. · Button: Join the portal · If the button doesn't work, sign in at {portal address} and enter this code: {code} |
| Code entry heading | Enter your invite code |
| Code entry hint | You'll find it in your invitation email or on the slip from the admin office. |
| Confirm screen | You're joining {lot} ({owner name}). Is this your lot? · Yes, link my account · No, this isn't my lot |
| Wrong lot | Please contact the admin office to get the right invitation. |
| Errors | That code doesn't match an invitation. Check it, or ask the admin office for a new one. · This invitation has expired. Ask the admin office to send a new one. · This invitation was already used. Ask the admin office for a new one. · This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office. · This invitation is no longer valid. Ask the admin office. · Your account is already linked to {lot}. Ask the admin office if you need access to another lot. · Too many wrong codes. Try again in 15 minutes. |
| Directory buttons | Invite · Invite selected · Resend invitation · Invite another person · Print invite slips · Print slip · Remove |
| Bulk confirm | Send {n} invitations? {m} households have no email. Print their slips instead. |
| Bulk done | {n} invitations queued. Each household shows its email status. (in flight: Queuing…) |
| Print confirm | Printing makes new codes. Any earlier unused code for these {n} households will stop working. |
| Remove confirm | Remove {name} from {lot}? They will no longer see this lot. Its bills and payments stay with the lot. |
| Slip | {HOA name} resident portal · {lot} · Your invite code: {code} · Expires {date} · 1. Go to {portal address} 2. Sign in or create an account 3. Enter the code |
| PDF footer | Delete this file after printing. |

## Out of scope

- Tenants and owners with several lots (D3). R1: each person is linked as owner, co-owner or family of one lot, and an account already linked elsewhere is refused.
- Self-registration with proof documents (Option C).
- Moving a person's account from one lot to another in one step (remove, then invite).
- Reminder emails for invitations not yet accepted.
- Bounce reports, if the owner says no to decision 3.
- What a new owner can see of the lot's history (decision 5, settled before the payments REQ).

## Open questions

| Question | Who decides |
|---|---|
| Decisions for the owner, rows 1–5 | Owner (row 5 with the HOA's Data Protection Officer) |
| Email provider and sending domain (SA-001 Q7). Until chosen, only step 1 (printed slips) can ship. | Owner |
| Is there a limit on people per household? | HOA board |
| How will the office learn about sales, so the old owner is removed? (Nothing removes them automatically.) | Admin office |

## Sol Arch review

> **BA note (r2):** the corrections Sol Arch asks for under "Criteria to change" are already applied to the criteria, copy and data above. What needs the owner is listed under "Decisions for the owner" at the top.

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r1 §8.1, ADR-004 and ADR-002 (Draft, `origin/docs/sa-001-architecture` at `b020b40`).

**Verdict: Supports with changes.** Option A, built in two steps, is right. Storing codes hashed is correct, and it means a code can be seen **only at the moment it is made**. That changes how slips are printed and how a double "Invite selected" behaves. The rate limit must be per account. The "Email failed" scenario only covers refusals at hand-off.

#### Options

| Option | Feasible? | Cost (BA's read) | Sol Arch |
|---|---|---|---|
| A: email link + printed slips (two steps) | Yes | Moderate | **Agree.** Step 2 depends on ADR-002's provider and the HOA's sending domain (SA-001 Q7). |
| B: printed slips only | Yes | Cheap | Agree. It is step 1 of A. |
| C: self-registration with proof | Yes | Moderate | **Disagree: a project.** It needs a document upload, a review queue, retention and deletion of copies of titles and IDs, and a DPO sign-off. It also brings back R-6 (wrong linking) through human judgement. Not supported. |

**I support Option A in two steps.**

**Design answers to the BA's questions:**
1. **Codes stored hashed: confirmed, with a secret key.** Store `HMAC-SHA256(key, normalisedCode)` as the invitation's document id (`invites/{codeHash}`). That gives a direct lookup with uniqueness built in. The key is kept in Secret Manager. A plain unkeyed hash is not enough: 8 characters from a 32-character alphabet is about 1.1 × 10¹² codes, few enough to try every one offline if the database or a backup leaked. **Consequences:**
   - **Printing makes new codes.** "Print invite slips" creates (or replaces) the invitations at that moment, and the browser builds the PDF from the response. Nothing can "reprint" an old code.
   - **The email needs the code.** The `mail` document holds it in plain text until it is sent. The mail function clears the code and body once the status is `sent` or `failed`, and only functions can access `mail` (ADR-002).
   - **The link carries the code in the URL fragment** (`…/join#K7QXM9TA`). Browsers don't send the fragment to the server, so the code stays out of Hosting logs and referrers. The app keeps it in `sessionStorage` through sign-in, including the Google popup, and clears it after redeeming.
2. **Wrong-code limit: per account (uid), enforced in `redeemInvite`.** A document `inviteAttempts/{uid}` holding `{windowStart, failures}` is updated in the same transaction as the lookup. At 5 failures in 15 minutes, the function refuses without looking the code up. Creating extra accounts gets around a per-account limit, but that is still enough here. Firebase limits new accounts to 100 per hour per IP address ([Auth limits](https://firebase.google.com/docs/auth/limits)), App Check is on (SA-001 §8.3), and with about 1,000 live codes among 1.1 × 10¹², each guess has roughly a 1-in-a-billion chance. Add a project-wide alert on wrong codes (for example more than 50 an hour). Only "doesn't match" counts as a failure. "Expired" and "already used" tell a guesser nothing useful.
3. **Expiry: I support the BA's 7 days for email and 30 days for printed slips**, as settings (`config/settings.inviteExpiryDays.email` / `.print`), not constants. The risk of the longer life: whoever finds a lost slip can redeem it, and seeing the owner name on the confirm screen stops honest mistakes, not theft. Mitigations: the directory shows who linked, the activity log records it, and the office can Remove. In step 2, send a notice to the household's contact email when someone links. An invitation expires at the **end of the date shown, Asia/Manila time**.
4. **Two people redeeming at once: feasible as written.** `redeemInvite` does everything in one Firestore transaction. It reads the invitation, refuses unless it is `active` and not expired, then marks it `used` and creates `members/{householdId}_{uid}`. Server libraries on the Standard edition use pessimistic locks, so the second transaction waits and then sees `used` ([contention](https://firebase.google.com/docs/firestore/transaction-data-contention)). Prove it with an emulator test of 10 parallel calls plus a negative control (CS-8).

#### Criteria to change (quoted, then corrected)

1. **"Guessing codes is stopped: Given someone has entered 5 wrong codes in 15 minutes"**. "Someone" can't be enforced. A function cannot reliably tell devices or people apart, but it can tell accounts apart. Corrected:
   ```gherkin
   Scenario: Guessing codes is stopped
     Given Ana's account has had 5 codes refused as not matching in the last 15 minutes
     When she enters another code, right or wrong
     Then she sees "Too many wrong codes. Try again in 15 minutes."
     And the code is not checked
     And 15 minutes after her first refused code she can try again
   ```
2. **"A code can be used only once"**. Add the case of the same person entering the code again (a double tap, a second device). They should be let in, not refused:
   ```gherkin
   Scenario: The person who used a code enters it again
     Given Ana linked her account with "K7QX-M9TA"
     When Ana enters "K7QX-M9TA" again
     Then she lands on the Blk 2 Lot 7 dashboard
   ```
3. **"Then the old code shows "This invitation was replaced by a newer one." if used"**. Reword so it is testable and the message says what to do next (CS-4):
   ```gherkin
   Scenario: Resending replaces the old invitation
     Given an unused invitation for Blk 2 Lot 7
     When the admin presses "Resend invitation"
     Then a new invitation to "ana@example.com" is queued
     When anyone enters the old code
     Then they see "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."
   ```
   Update the copy of record to match. The replacement happens in one transaction: the old code is marked `replaced` and the new one created together, so two staff pressing Resend at once leave exactly one active code.
4. **"Then 380 invitations are queued and the button reads "Sending…" until it finishes"**. The button finishes when the invitations are *queued*, not sent (CS-12). Also, a second press would replace all 380 codes just emailed and make the first emails useless. Corrected:
   ```gherkin
   When they confirm
   Then the button reads "Queuing…" and is disabled until all 380 are queued
   And they see "380 invitations queued. Each household shows its email status."
   When the admin presses "Invite selected" again for the same households
   Then households that already have an unused invitation are skipped, not re-invited
   ```
5. **"Print code slips … Then a PDF downloads with one slip per household"**. Because codes are hashed, printing makes new codes. Add before the download: `Then they see "Printing makes new codes. Any earlier unused code for these 20 households will stop working." and confirm`, plus `And the PDF shows "Delete this file after printing."` (the file holds live codes).
6. **"A failed email is shown, not hidden: Given the mail service reports the invitation to "ana@example.com" failed"**. ADR-002 records failure only when the provider refuses the message at hand-off. A later bounce (the mailbox doesn't exist) is reported only through provider events, which ADR-002 doesn't include. Corrected: `Given the email provider refused the invitation to "ana@example.com" when it was handed over`. Either add "bounces reported after hand-off" to Out of scope, or add the provider's bounce events to step 2 (+0.5–1 day once the provider is chosen).
7. **"Accept an emailed invitation … signs in or creates an account"**. Add `including with "Continue with Google"`, and `And the code is kept through sign-in without her typing it`.
8. **"Removing a person after a sale … Then Ana no longer sees Blk 2 Lot 7"**. This can be met at once, because rules check that the `members` document exists, with no token involved. Add `And any unused invitation for Blk 2 Lot 7 stops working` (the office must re-invite the new owner).

**Missing scenarios (BA to word, owner to decide):**
- **A person already linked to another lot enters a code (D3).** Recommended for R1: refuse with "Your account is already linked to {lot}. Ask the admin office if you need access to another lot."
- **A code for a deactivated household:** refuse with "This invitation is no longer valid. Ask the admin office."

#### Data

- `invites/{codeHash}`: `householdId`, `channel` (`email` / `print`), `sentTo` (email or null), `relation` (chosen by the admin, as the BA recommends), `createdBy`, `createdAt`, `expiresAt`, `status` (`active` / `used` / `replaced` / `cancelled`), `usedBy`, `usedAt`, `replacedBy`, `mailId`. **Change:** don't store `expired` as a status, because nothing would write it on time. Work it out from `expiresAt`. "One active invitation per person slot": define the slot as the household plus the recipient (an email, or "print"). Staff may read invitations for a household; homeowners never.
- `members/{householdId}_{uid}`: **confirmed** (ADR-004). Fields: `householdId`, `uid`, `relation`, `inviteId`, `invitedBy` (the REQ's "added by"), `linkedAt`. SA-001's `canPay` has no writer or reader in this REQ. Drop it until the payments REQ needs it, or default it to true for owner and co-owner.
- `inviteAttempts/{uid}`: functions only; the daily job deletes old windows.
- `mail/{id}`: per ADR-002, with the code removed after send.
- `households/{id}.linkStatus` and `memberCount`: kept by these functions, so the directory needs no lookup per row (see the REQ-003 review).
- **Functions** (SA-001 §3 names only `linkHousehold`): `createInvites` (one or many; skips households with an unused invitation unless it is a resend), `checkInvite` (returns the lot and owner name for the confirm screen and counts towards the limit), `redeemInvite`, `removeMember` (transaction; "already removed" if the document is gone), `cancelInvite`.
- **Rules:** no client access to `invites`, `inviteAttempts` or `mail` except staff reading `invites` by household. `members` can be read by the member and by staff; no client writes.
- **Index:** `invites` on (`householdId`, `status`, `createdAt` desc).
- `auditLog`: `invite.created` / `replaced` / `cancelled` / `redeemed`, `member.removed`. Ids only.

#### Risks not covered

- **Privacy after a sale (RA 10173): the biggest open risk.** "Its bills and payments stay with the lot" means the new owner, once linked, sees the lot's history. That includes the previous owner's receipts with their name and their uploaded payment screenshots, which can show their e-wallet name and number. Options: members see records from their `linkedAt` date only, or proofs are visible only to the uploader and staff. This doesn't block REQ-004, but **it must be decided before the payments REQ (EPIC-003)**. Maps to proportionality; requester and DPO to confirm.
- **Shared family mailboxes.** Anyone who opens the email can join. This is accepted by design (ADR-004). The confirm screen and Remove are the safeguards.
- **The office knows about a sale only if told.** Nothing removes the old owner automatically, so put it in the office procedure.
- **Provider sending limits are unknown** until the provider is chosen. 623 invitations in a day may exceed a free tier, so the mail function paces sending and statuses stay "queued" meanwhile. Staging mail goes only to the allow-list (ADR-005).
- **Printed slips work like cash.** Anyone holding one can link to the lot. Hand them over in person or in a sealed envelope.
- **Observability:** alerts on wrong-code spikes and `mail` failures, plus a weekly count of invitations that expired unused.
- **Cost:** about 4 writes per invitation, so about 2,500 for all 623 households. Trivial.

#### SA-001 follow-ups (recommended revisions; I have not edited SA-001)

- §8.1 "single-use code, 7-day expiry": change to per-channel expiry settings (7 email, 30 print, if the owner agrees); codes stored as a keyed hash used as the document id; the plain code exists only at creation; `mail` documents cleared after send.
- §3: rename `linkHousehold` to `redeemInvite`, and add `createInvites`, `checkInvite`, `removeMember`, `cancelInvite`.
- §4.2: add `INVITES` and `INVITE_ATTEMPTS`, add the `members` fields above, and decide `canPay`.
- ADR-002: say that "failed" covers refusal at hand-off only; bounces need provider events.
- §11.1: add the risk of the previous owner's history being visible after a sale.
- §12: phase 1 estimates B at 4–6 days for sign-in, invites, roles and rules. These four REQs come to about 16–23 days (below), and the import was excluded from SA-001's estimates (R-8). Revise the roadmap.

#### Size

Step 1 (codes, print slips, code entry, confirm, redeem, remove, rate limit, directory status, concurrency tests): **4–5 person-days with Claude Code**. Step 2 (email): **2–3**, of which the mail function itself (about 1.5) is shared with every later email feature (SA-001 area H).

#### Sources (fetched 2026-11-28)

[Auth limits (100 accounts/hour per IP)](https://firebase.google.com/docs/auth/limits) · [Transaction data contention (pessimistic locking on server libraries)](https://firebase.google.com/docs/firestore/transaction-data-contention) · [Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
