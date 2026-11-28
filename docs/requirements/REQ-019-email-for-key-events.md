# REQ-019: Email for key events

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-004 Announcements and notifications](../epics/EPIC-004-announcements-and-notifications.md) |
| Backlog story | [19 Email for key events](../backlog/BACKLOG.md#19-email-for-key-events) *(not in mock-up)* |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 19A–19E of the R2 collect-and-account mockup. Repo copy: [req-018-027-mockup.html](../mockups/req-018-027-mockup.html). Not yet published as an artifact (main session to publish and put the link here) |
| Architecture | ADR-002 r3 (own mail function, `mail` queue, queued / sent / failed, provider bounce events), SA-001 §5 (email provider, SPF/DKIM/DMARC), §8.2 (no personal data in email subjects), §11.1 R-5 and R-12, Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-004 step 2 (mail function and bounce events), REQ-011 (in-app notifications), REQ-012 (payment decisions), REQ-013 (receipt PDF) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation; the owner decides.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (an email per event), B (a weekly digest) or C (no email; in-app plus printed letters) | **A** |
| 2 | Who gets the email: each **linked person** (their sign-in email) or the **contact email on file** (REQ-003) | **Each linked person.** After a sale the contact email may still be the previous owner's, and only linked people can open the portal to act on it. Households with nobody linked get printed letters (REQ-020) |
| 3 | Add a monthly **"Your {period} bill"** email after each billing run? About 623 emails a month | **Yes, as the one category a homeowner can turn off.** It is the email most likely to raise collections. About +0.5 day. Sol Arch to check the count against the chosen provider's free tier |
| 4 | Announcement emails (the backlog's draft scenario mentions them) | **Not in R2.** EPIC-004 scopes email to payment decisions, notices and records. 623 emails per announcement is the fastest way into spam folders. Revisit after R2 |
| 5 | Notice emails: the letter as a **PDF attachment**, or a **"View the letter" link** that needs sign-in | **Link.** The body states the notice type, deadline and amount so the homeowner can act; the letter stays in the portal. An attachment puts a second copy of the debt and name in every mailbox it is forwarded to |
| 6 | Which events can a homeowner turn off | **Only the bill email (row 3).** Payment decisions and notices are about the household's own account and always send |

## Problem

Homeowners open the portal once or twice a month ([Homeowner](../product/PERSONAS.md#homeowner)). A rejected payment ("the reference number doesn't match") or a 1st Notice with a 15-day deadline sits unseen in the bell until they next sign in, and the deadline may pass. ADR-002 already chose the mail function and provider pattern, and REQ-004 step 2 builds it for invitations, so this REQ adds events to an existing pipe rather than building one.

What the app can and can't promise (ADR-002, SA-001 R-12): it knows an email was **queued**, then **sent** (handed to the provider) or **failed** (refused at hand-off), and later whether it **bounced** (provider event, REQ-004 decision 3). It never knows an email was read or arrived in an inbox rather than spam. No screen says "delivered".

## Options

### Option A: One email per event, alongside the in-app notification (recommended)

- **How it works:** when a payment is approved, a payment is rejected, a notice is sent, or (R3) a record request is ready, each linked person in the household gets an email as well as the bell notification. The email says what happened and has one button into the portal. Staff see each email's status where the event lives (payment, notice). A bounced address shows on the household so the office can fix it.
- **Cost:** moderate (backlog M). Templates, event hooks, a "Notifications" settings card for the homeowner, and per-person bounce display. Less if REQ-004 step 2 is already built (about 2–3 days); about 1.5 days more if it isn't.
- **Excludes:** households with no linked person (no email address the portal trusts).
- **Honest downside:** some emails land in spam until the HOA's sending domain is set up (SA-001 §5, Q7).

### Option B: Weekly digest

- **How it works:** one email a week: "This week: your payment was approved; you received a 1st Notice."
- **Cost:** moderate (same templates plus a scheduled job).
- **Honest downside:** a notice with a 10-day deadline may be 6 days old when the homeowner hears of it. That is not fair collection.

### Option C: No email; in-app notifications plus printed letters

- **How it works:** as today, letters are printed and delivered by hand; the portal only shows the bell.
- **Cost:** cheap.
- **Honest downside:** office time printing and delivering hundreds of letters, and homeowners still miss rejected payments.

### Recommendation

**Option A.** The mail function is already being built; the extra cost is templates and hooks. Email is what makes REQ-020's notices reach people in time.

## Story

As a homeowner, I want an email when a payment is approved or rejected, a notice is sent to my household, or a record I asked for is ready, so that I hear about it even if I don't open the portal.

## Acceptance criteria (Option A)

```gherkin
Feature: Email for key events

  Background:
    Given Blk 5 Lot 1 has two linked people, Carlo Mendoza (carlo@example.com) and Lia Mendoza (lia@example.com)
    And both addresses are verified sign-in emails

  Scenario: Payment approved
    When the treasurer approves Blk 5 Lot 1's ₱1,800.00 payment and receipt OR-00093 is issued
    Then an email to carlo@example.com and one to lia@example.com are queued with the subject "Payment received: OR-00093"
    And each email has the button "View your receipt"
    And on the payment the treasurer sees "Email: queued", then "Email: sent to 2 people" once the provider accepts both

  Scenario: Payment rejected
    When the treasurer rejects Blk 5 Lot 1's payment with the reason "The reference number doesn't match our account"
    Then an email with the subject "Your payment needs attention" is queued to each linked person
    And its body includes the reason and the button "Submit again"

  Scenario: Notice sent
    When the treasurer sends a 1st Notice to Blk 5 Lot 1 (REQ-020)
    Then an email with the subject "Greenfield Homes HOA: a notice about your dues account" is queued to each linked person
    And the body states the notice type, the overdue amount and the deadline
    And the body has the button "View the letter", which opens it after sign-in
    And the email has no attachment

  Scenario: Subjects carry no names or amounts
    When any email in this REQ is queued
    Then its subject contains no person's name, lot or peso amount

  Scenario: The in-app notification is always created
    Given the email provider is down
    When the treasurer approves Blk 5 Lot 1's payment
    Then Carlo and Lia each see the notification in the bell (REQ-011)
    And the email shows "Email: queued" until the provider accepts it

  Scenario: The provider refuses an email
    Given the provider refuses the email to lia@example.com at hand-off, after the retries
    Then the payment shows "Email: sent to 1 of 2 people · 1 failed"
    And Blk 5 Lot 1's household page shows "Email failed" next to Lia Mendoza

  Scenario: A bounced email is flagged
    Given the provider reports that the email to carlo@example.com bounced
    Then Blk 5 Lot 1's household page shows "Email bounced" next to Carlo Mendoza
    And the Homeowners list shows "Email bounced" on Blk 5 Lot 1
    And the "Email problems" filter on the Homeowners page lists Blk 5 Lot 1

  Scenario: Each event emails once
    Given the payment approval is retried by the server after a timeout
    Then Carlo gets one "Payment received: OR-00093" email, not two

  Scenario: Households with nobody linked
    Given Blk 9 Lot 3 has no linked people
    When the treasurer approves a payment from Blk 9 Lot 3 entered at the office
    Then no email is queued
    And the payment shows "No email: nobody in this household uses the portal"

  Scenario: Homeowners can turn off bill emails but not account emails (decisions 3 and 6)
    Given Carlo opens Profile, Notifications
    Then "Bill emails" has an on/off switch, on by default
    And "Payment and notice emails" reads "Always on. These are about your account."
    When Carlo turns off "Bill emails"
    Then he gets no "Your December 2026 bill" email
    And he still gets emails for payment decisions and notices

  Scenario: Monthly bill email (decision 3)
    Given the December 2026 billing run completes (REQ-008)
    Then each linked person with "Bill emails" on gets "Your December 2026 bill is ready"
    And the body states the amount due and the due date "Dec 31, 2026"

  Scenario: Record ready (R3)
    Given a record request becomes Ready (REQ-037)
    Then an email "Your requested record is ready" is queued to the person who asked
    And it carries no attachment

  Scenario: Staging never emails real people
    Given the app is running in the staging project
    When any email in this REQ is queued to an address not on the staging allow-list
    Then it is not handed to the provider
    And it shows "Email: blocked (staging)"

  Scenario: Wording never claims delivery
    When a staff member looks at any email status
    Then it reads one of "queued", "sent", "failed", "bounced" or "blocked (staging)"
    And never "delivered" or "read"

  Scenario: Only staff see email status
    Given a homeowner is signed in
    Then they see no email status on their payments or notices
    And their device's request for the mail queue is refused
```

## Data changes

| Field | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Mail document per recipient per event | `mail/{eventId}_{uid}` (ADR-002 queue) | Deterministic id, so a retried event emails once. Status `queued → sent / failed / bounced / blocked`. No personal data beyond the address | Event functions (`decidePayment`, `sendNotice`, `billingRun`, record functions) | Mail function |
| Email summary on the event | `payments/{id}.email`, `notices/{id}.email`: `{queued, sent, failed, bounced}` counts | Updated by the mail function | Mail function | Staff screens |
| Person's email problem | `members/{householdId}_{uid}.emailStatus`: `ok / failed / bounced`, with time | Set on failure or bounce; cleared when the person changes their email or a later email is sent | Mail function, bounce webhook | Household page, Homeowners filter |
| Household email-problem flag | `households/{id}.emailProblem` (bool) | True if any member's status is not `ok` | Mail function | Homeowners list and filter |
| Bill-email preference | `users/{uid}.prefs.billEmails` (bool, default true) | Only this preference exists in R2 | The person, by rules (own document, this field only) | `billingRun` |

The mail function, provider secret, pacing and bounce webhook come from ADR-002 and REQ-004 step 2. Templates live with the functions, not in Firestore, so a homeowner can't change their wording. Email links go to portal pages that need sign-in; they carry no tokens.

## UX/UI notes

- **Accessibility:** emails are plain HTML with a text alternative, at least 16 px body text, a button at least 44 px tall, and the link written out under the button for mail apps that block buttons.
- **Consistency:** subjects and bodies use glossary terms: **Payment**, **Official receipt**, **Notice**, **Balance**, **Due date**. The email status words match ADR-002 and REQ-004 ("queued", "sent", "failed", "bounced").
- **Mobile-first:** single column, under 600 px wide; most homeowners read on Android phones.
- **States (staff):** queued, sent to n people, sent to n of m with failures, no email (nobody linked), blocked (staging). Each status is text, not only a colour.
- **States (homeowner):** the Notifications card shows the switch's saved state, "Saving…" while it saves, and "Couldn't save. Try again." on failure, restoring the previous position.
- **Forms:** one switch, saved on change.
- **Safe actions:** none destructive.
- **Roles:** only staff see email statuses. Homeowners see only their own preferences.
- **Privacy (RA 10173):** no names, lots or amounts in subjects (they show in lock-screen previews and shared inboxes); no attachments; body contains only the recipient household's own information. The privacy notice (REQ-005) must say the portal emails account updates.
- **Tone:** neutral and plain. "Your payment needs attention", not "Payment REJECTED".

## Copy of record

| Where | Text |
|---|---|
| Payment approved, subject | Payment received: {OR no.} |
| Payment approved, body | We received your payment of {amount} on {date}. Your official receipt is {OR no.}. · Button: View your receipt |
| Payment rejected, subject | Your payment needs attention |
| Payment rejected, body | We couldn't approve the payment you submitted on {date} for {amount}. Reason: {reason}. Please check it and submit it again, or contact the admin office. · Button: Submit again |
| Notice, subject | {HOA name}: a notice about your dues account |
| Notice, body | A {notice type} was issued for your household on {date}. Overdue amount: {amount}. Please pay on or before {deadline}. If you have already paid, submit your payment in the portal so we can match it. · Button: View the letter |
| Bill, subject | Your {period} bill is ready |
| Bill, body | Your {period} dues of {amount} are due on {due date}. Balance including earlier months: {balance}. · Button: Pay now |
| Record ready, subject | Your requested record is ready |
| Footer, every email | You're getting this because you're linked to {lot} in the {HOA name} portal. |
| Footer, bill email only | Turn off bill emails in Profile, Notifications. |
| Staff status | Email: queued · Email: sent to {n} people · Email: sent to {n} of {m} people · {k} failed · No email: nobody in this household uses the portal · Email: blocked (staging) |
| Person status | Email failed · Email bounced |
| Homeowner settings | Bill emails · Payment and notice emails: Always on. These are about your account. |

## Out of scope

- Announcement emails (decision 4).
- SMS and phone push notifications (EPIC-004 out of scope).
- Email for requests and complaints updates (REQ-027 uses in-app notifications only).
- Read receipts or proof of delivery. Not possible with email.
- Choosing the provider and sending domain (SA-001 Q7, owner and board).

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions, rows 1–6 | Owner |
| Which address and domain do emails come from? | HOA board (EPIC-004) |
| English only, or English and Filipino templates? | HOA board |
| Should the office be able to correct a bounced address for a person? Today only the person can change their sign-in email. | Owner |

## Sol Arch review

Not yet done. Questions for Sol Arch:

1. Recipients from `members` plus `users.email`: confirm the read path and that unverified emails are skipped.
2. Per-recipient mail documents vs one per event with a recipient list, given the bounce webhook maps back to one person.
3. Monthly volume (about 623 bill emails plus notices) against the free tier of the providers being considered.
4. Size: M; about 2–3 days if REQ-004 step 2 is built.
