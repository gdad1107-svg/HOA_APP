# REQ-020: Send the next notice in the escalation

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-005 Collections and notices](../epics/EPIC-005-collections-and-notices.md) |
| Backlog story | [20 Send the next notice in the escalation](../backlog/BACKLOG.md#20-send-the-next-notice-in-the-escalation) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 20A–20G of the R2 collect-and-account mockup. Repo copy: [req-018-027-mockup.html](../mockups/req-018-027-mockup.html). Not yet published as an artifact (main session to publish and put the link here) |
| Architecture | SA-001 §3 (notices and letters are a function), §4.3 Flow 4 (`sendNotices`: recompute aging in a transaction, `notices/{id}`, PDF to `notices/{noticeId}.pdf`, mail doc), §4.2 Storage paths, §11.2 (repeat-trigger safety), ADR-002, Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-018 (delinquent list and overdue figures), REQ-019 (email), REQ-011 (notifications), REQ-009 (homeowner's statement shows notices), REQ-013 (server PDF tooling, reused) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft. r2, 2026-11-28: reconciled with SA-001 (conflict C5): treasurer-only sending kept as the BA recommendation; the divergence from SA-001 §8.1 is recorded under Sol Arch review for Sol Arch to confirm or reject |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation; the owner decides. Wording and signatory are for the board (Open questions).

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (preview, then a server-made letter sent in the portal and by email, printed where nobody is linked), B (record only, as in the mock-up) or C (automatic notices on a schedule) | **A.** C can follow for Reminders only, once the board has seen a few months of A (SA-001 Q9) |
| 2 | **Restart the sequence** when a household returns to good standing | **Yes.** The mock-up continues from the last notice ever sent, so a household that fell behind once in 2026 would get a Final Demand as its *first* letter in 2027. That is unfair and hard to defend |
| 3 | **Wait for the deadline** before the next step | **Yes.** The next notice can be sent only after the previous notice's deadline has passed. A 2nd Notice two days after a 1st Notice with a 15-day deadline contradicts the first letter |
| 4 | **What the letter states** as owed | **The overdue amount and each overdue period**, not the total balance. The mock-up's letter states the total, which includes the current month that isn't due yet. A demand for money not yet due is unfair and may not hold up |
| 5 | A payment is **waiting for approval** | **Warn in the preview; the treasurer may "Send anyway".** Better: decide the payment first. The warning links to it |
| 6 | **Withdraw a notice** sent in error (for example, the household had paid at the office) | **Yes, with a reason.** The letter stays on record marked "Withdrawn", the homeowner is told, and the sequence ignores it. About +0.5 day |
| 7 | Who may send notices | **Treasurer only in R2** (the glossary; REQ-021 bulk notices says the same). A demand letter states what a household owes and may be cited to counsel, so it should come from the officer who checks the money; the admin office reads the history and can hand-deliver printed letters. **Diverges from SA-001 §8.1**, which lets the admin office send notices: recorded under Sol Arch review (point 4) to confirm or reject. If the owner prefers the admin office to send too, the change is the role check and the "Roles" scenarios |
| 8 | The 1st Notice line "Members with overdue dues cannot book the pool…" | **Leave it out until the booking pause exists and is switched on** (story 34, R3). A letter mustn't threaten a sanction the HOA isn't applying |

## Problem

Collection follow-up today is slow and inconsistent (EPIC-005), at a collection rate the mock-up's sample puts near 51%. The mock-up models the right sequence (`NOTICE_TYPES`, line 374: Reminder → 1st Notice → 2nd Notice → Final Demand) but in the browser: `sendNotice()` (line 1412) only adds a record, the letter is rebuilt from today's data each time it is viewed (`letterHTML()`, line 811), and nothing stops a second press. A letter that may be cited to counsel under R.A. 9904 (Magna Carta for Homeowners and Homeowners' Associations) and the by-laws has to be fixed when sent, numbered, and provably sent.

Who has the problem: the [Treasurer](../product/PERSONAS.md#treasurer), monthly; and every delinquent [Homeowner](../product/PERSONAS.md#homeowner), who deserves a clear, correct, fairly worded letter.

**Fair collection (BA note).** Philippine fair debt collection rules issued by the SEC and BSP are written for lenders and financial institutions. The BA has not verified whether any applies to an HOA, and assumes not. This REQ still follows their spirit: no threats beyond what the by-laws allow, no disclosure of the debt to anyone but the household, a clear deadline, and a way to say "I already paid".

## Options

### Option A: Preview, then a numbered letter made by the server (recommended)

- **How it works:** on each delinquent row (REQ-018) the button names the next step ("Send 1st Notice"). It opens a preview of the exact letter: overdue amount, each overdue period, deadline, notice number. On "Send", the server re-checks the household, stores the letter as a PDF that never changes, notifies and emails each linked person (REQ-019), and records it in Notice history. Households with nobody linked get "Print the letter" instead.
- **Where it lives:** Collections → Delinquent accounts (button) and Notice history; the homeowner sees it under Dues & Payments → Notices received.
- **Cost:** moderate to project (backlog M; the BA expects 3–4 days). Server PDF tooling is reused from receipts (REQ-013); the escalation rules, re-check, withdraw and four templates are the work.
- **Excludes:** nothing by device; the preview is readable on a phone.
- **Honest downside:** the four letter texts must be approved by the board or counsel before launch, which can take weeks.

### Option B: Record only, letters printed outside the portal

- **How it works:** as in the mock-up: the portal records "1st Notice sent" and the office prints its own Word letter.
- **Cost:** cheap.
- **Honest downside:** the record and the letter can disagree, nothing reaches homeowners electronically, and there is no fixed copy if the notice is disputed.

### Option C: Automatic notices on a schedule

- **How it works:** a scheduled job sends each household its next notice on set days after the due date.
- **Cost:** moderate (Option A plus a job and safeguards).
- **Honest downside:** a Final Demand with legal weight would go out without a person looking at it. Reasonable for Reminders only, later.

### Recommendation

**Option A**, with decisions 2–6. Each one closes a gap where the mock-up would send an unfair or wrong letter.

## Story

As a treasurer, I want to send the next letter in the sequence (Reminder, 1st Notice, 2nd Notice, Final Demand), so that follow-up is consistent and on record.

## Acceptance criteria (Option A)

```gherkin
Feature: Collection notices

  Background:
    Given the treasurer is signed in
    And dues are ₱1,800.00 a month
    And the deadline is 15 days after the notice date for a Reminder, 1st Notice and 2nd Notice, and 10 days for a Final Demand

  Scenario: The first step is a Reminder
    Given Blk 3 Lot 2 is delinquent and has never received a notice
    Then its button reads "Send Reminder"

  Scenario: The next step follows the last notice
    Given Blk 3 Lot 2 received a 2nd Notice on Nov 1, 2026 with the deadline Nov 16, 2026
    When the treasurer opens Delinquent accounts on Nov 28, 2026
    Then its button reads "Send Final Demand"

  Scenario: The next step waits for the deadline (decision 3)
    Given Blk 3 Lot 2 received a 1st Notice on Dec 1, 2026 with the deadline Dec 16, 2026
    When the treasurer opens Delinquent accounts on Dec 10, 2026
    Then its button is disabled and reads "2nd Notice after Dec 16"

  Scenario: Preview before sending
    Given Blk 3 Lot 2 has not paid October or November 2026 and today is Dec 3, 2026
    When the treasurer presses "Send 1st Notice" for Blk 3 Lot 2
    Then a preview shows the letter titled "1st Notice of Unpaid Dues"
    And it lists October 2026 and November 2026 at ₱1,800.00 each
    And it states the overdue amount ₱3,600.00 and the deadline "on or before Dec 18, 2026"
    And it does not include December 2026, which is not yet due

  Scenario: Sending records a fixed letter
    Given the treasurer is previewing a 1st Notice for Blk 3 Lot 2
    When they press "Send 1st Notice"
    Then the button reads "Sending…" and is disabled until the send finishes
    And they see "1st Notice N-0042 sent to Blk 3 Lot 2. Email queued to 2 people."
    And Notice history lists N-0042 for Blk 3 Lot 2 with overdue ₱3,600.00
    And Blk 3 Lot 2's last notice reads "1st Notice · Dec 3, 2026"

  Scenario: The homeowner sees the notice
    Given N-0042 was sent to Blk 3 Lot 2
    When Ana Cruz of Blk 3 Lot 2 signs in
    Then her bell shows "You received a 1st Notice for an overdue amount of ₱3,600.00. Please pay by Dec 18, 2026."
    And Dues & Payments, Notices received lists it with "View letter"
    And an email was queued to her (REQ-019)

  Scenario: The letter never changes after sending
    Given N-0042 stated ₱3,600.00 on Dec 3, 2026
    And Blk 3 Lot 2 paid ₱1,800.00 on Dec 5, 2026
    When anyone opens N-0042
    Then it still states ₱3,600.00 and the date Dec 3, 2026

  Scenario: Pressing Send twice sends one notice
    When the treasurer presses "Send 1st Notice" twice quickly
    Then exactly one notice is recorded for Blk 3 Lot 2
    And one email per linked person is queued

  Scenario: The household paid after the preview opened
    Given the treasurer opened the preview for Blk 3 Lot 2
    And another session approves a payment that brings Blk 3 Lot 2 to good standing
    When the treasurer presses "Send 1st Notice"
    Then they see "Blk 3 Lot 2 is no longer delinquent. No notice was sent."
    And no notice is recorded

  Scenario: The overdue amount changed after the preview opened
    Given the treasurer opened the preview showing ₱3,600.00
    And a ₱1,800.00 payment from Blk 3 Lot 2 is approved in another session
    When the treasurer presses "Send 1st Notice"
    Then they see "The overdue amount changed to ₱1,800.00. Check the updated letter, then send."
    And the preview shows the updated letter
    And no notice is recorded until they press Send again

  Scenario: A payment is waiting for approval (decision 5)
    Given Blk 3 Lot 2 has a ₱1,800.00 payment pending approval
    When the treasurer opens the preview
    Then they see "Blk 3 Lot 2 has a payment of ₱1,800.00 waiting for approval. Review it before sending." with "Review payment"
    And the send button reads "Send anyway"

  Scenario: The sequence restarts after good standing (decision 2)
    Given Blk 8 Lot 4 received a Final Demand in March 2026, then paid everything in April 2026
    And Blk 8 Lot 4 became delinquent again on Dec 1, 2026
    Then its button reads "Send Reminder"

  Scenario: Final Demand is the last step
    Given Blk 3 Lot 2 received a Final Demand whose deadline has passed
    Then its button reads "Resend Final Demand"
    And sending it records a new Final Demand with today's date, the current overdue amount and a new deadline

  Scenario: Final Demand asks for one more confirmation
    When the treasurer presses "Send Final Demand" in the preview
    Then they see "Send a Final Demand to Blk 3 Lot 2? This letter says the board may refer the account to legal counsel."
    And nothing is sent until they press "Send Final Demand" again

  Scenario: Nobody in the household uses the portal
    Given Blk 9 Lot 3 is delinquent and has no linked people
    When the treasurer sends a Reminder to Blk 9 Lot 3
    Then they see "Reminder N-0043 recorded. Nobody in Blk 9 Lot 3 uses the portal. Print the letter and deliver it." with "Download PDF"
    And Notice history shows N-0043 with "Delivery: print"

  Scenario: Withdraw a notice sent in error (decision 6)
    Given N-0042 was sent to Blk 3 Lot 2
    When the treasurer presses "Withdraw" on N-0042, enters "Paid in cash at the office on Dec 2" and confirms
    Then N-0042 shows "Withdrawn" with the reason in Notice history
    And Ana Cruz's bell shows "Notice N-0042 was withdrawn. Please disregard it."
    And Blk 3 Lot 2's next step is worked out as if N-0042 had not been sent

  Scenario: Withdrawing needs a reason
    When the treasurer presses "Withdraw" on N-0042 and confirms with no reason
    Then "Say why you're withdrawing this notice" shows under Reason
    And N-0042 is not withdrawn

  Scenario: Sending fails
    Given the network drops while sending
    Then the treasurer sees "Couldn't send. Nothing was recorded. Try again."
    And the preview stays open

  Scenario: Notice history
    Given 3 notices were sent in December 2026
    When the treasurer opens Notice history
    Then they are listed newest first with date, notice no., household, notice type, overdue stated, delivery and email status

  Scenario: Only the treasurer sends (decision 7)
    Given an admin office staff member is signed in
    When they open Delinquent accounts
    Then no "Send" buttons are shown
    And their device's request to send a notice is refused

  Scenario: A homeowner sees only their own notices
    Given Ana Cruz of Blk 3 Lot 2 is signed in
    When she opens the letter address for a notice to another household
    Then she sees "This letter isn't available."
    And her device's request for that letter is refused

  Scenario: Readable on a phone
    Given a screen 375 px wide
    When the treasurer opens a preview
    Then the letter fits the width without sideways scrolling
    And "Send" stays visible at the bottom of the dialog
```

## Data changes

| Field | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Notice | `notices/{id}`: `noticeNo` (N-0042), `householdId`, `type`, `date`, `deadline`, `overdueCentavos`, `periods` (list of `{period, dueDate, unpaidCentavos}`), `delivery` (`portal` / `print`), `pdfPath`, `sentBy`, `status` (`sent` / `withdrawn`), `withdrawnReason`, `withdrawnBy`, `withdrawnAt`, `email` (REQ-019) | Created once; only the three withdraw fields can change afterwards | `sendNotice` and `withdrawNotice` functions | Notice history, homeowner's Notices received, REQ-018 |
| Notice number | `counters/notice` | Sequential, in the same transaction as the notice | `sendNotice` | Letter, history |
| Letter PDF | Storage `notices/{noticeId}.pdf` (SA-001 §4.2) | Written once by the function; never regenerated | `sendNotice` | Owning household, treasurer, admin, board |
| Last notice and sequence position | `households/{id}.lastNotice`: `{type, date, deadline, noticeId}`; `households/{id}.sequenceStart` | `sequenceStart` is set when the household returns to good standing; only notices after it count (decision 2); withdrawn notices don't count | Functions | REQ-018, next-step rule |
| Send request id | client-made `requestId` on the call | A second call with the same id returns the first result | Web app | `sendNotice` |
| Deadlines and templates | Template text and days per type in function code (not editable in R2) | Board-approved text; days 15 / 15 / 15 / 10 | Developer | `sendNotice` |

The next-step rule lives once in `shared/domain` (SA-001 §3) and is used by the list (to label buttons) and the function (to decide). The function re-reads the household's unpaid bills and pending payments inside its transaction and refuses or re-previews if they differ from what the preview showed (the call carries the overdue amount seen).

## UX/UI notes

- **Accessibility:** the preview dialog takes focus and returns it to the row's button when closed. The letter is real text, not an image, so a screen reader can read it. The Final Demand is marked by its title and the word "Final", not only red.
- **Consistency:** reuses the mock-up's `.letter` layout and `.modal`. Notice types exactly as the glossary: **Reminder**, **1st Notice**, **2nd Notice**, **Final Demand**. "Overdue", not "outstanding" (the mock-up's letters say "outstanding"; the copy below fixes it).
- **Mobile-first:** the letter reflows at 375 px; the send button is in the dialog footer, within thumb reach.
- **States:** next step available; waiting for deadline (disabled with the date); pending payment warning; sending; sent (with email count or print instruction); stale (re-preview); withdrawn; error. Notice history empty: "No notices sent yet."
- **Forms:** the withdraw reason dialog does not close on a backdrop click and keeps what was typed.
- **Safe actions:** "Sending…" disables the button; the server guard is the request id plus the in-transaction check. Final Demand has a second confirmation. Withdraw needs a reason and is recorded in the activity log (REQ-006). Nothing is deleted.
- **Stable layout:** the pending-payment warning area is reserved in the preview header so the letter doesn't jump.
- **Roles:** treasurer sends and withdraws; admin office and board read history; homeowners read only their own letters; rules and the function both enforce it.
- **Privacy (RA 10173):** the letter goes only to the household. No CC to the board. The PDF is private in Storage and opened through the portal after sign-in.
- **Tone:** each letter starts by inviting the homeowner to pay or to tell the office they already have, and the 2nd Notice offers a conversation about a payment arrangement before the deadline. Final Demand states the consequence once, plainly.

## Copy of record

| Where | Text |
|---|---|
| Row button | Send Reminder · Send 1st Notice · Send 2nd Notice · Send Final Demand · Resend Final Demand · (disabled) {next type} after {deadline} |
| Preview title | {notice type} · {lot} |
| Letter titles | Payment Reminder · 1st Notice of Unpaid Dues · 2nd Notice of Unpaid Dues · Final Demand Letter |
| Letter reference line | Notice no. {N-0042} · {date} |
| Reminder body | This is a friendly reminder that your association dues account has an overdue amount of {amount} for the periods listed below. Please settle it on or before {deadline} using the HOA QR code in the resident portal. If you have already paid, please submit your payment in the portal or tell the admin office, and disregard this reminder. |
| 1st Notice body | Our records show that your association dues account has an overdue amount of {amount} for the periods listed below. We request full settlement on or before {deadline}. If you have already paid, please submit your payment in the portal or tell the admin office. |
| 2nd Notice body | Despite our previous notice dated {date of previous notice}, your account still has an overdue amount of {amount}. Please settle the full amount on or before {deadline}. If you can't pay in full, please visit the admin office before the deadline to discuss a payment arrangement. |
| Final Demand body | This is our final demand for payment of your overdue association dues of {amount}. Previous notices have not been settled. Please pay the full amount on or before {deadline}. Otherwise, the Board of Directors may pursue the remedies allowed under the Association By-Laws and Republic Act No. 9904, including referral of your account to legal counsel. If you have already paid, please contact the admin office right away. |
| Letter table | Period · Due date · Unpaid |
| Signature | Respectfully, {signatory} · For the Board of Directors, {HOA name} (signatory: board decision) |
| Pending warning | {lot} has a payment of {amount} waiting for approval. Review it before sending. · Review payment · Send anyway |
| Final Demand confirm | Send a Final Demand to {lot}? This letter says the board may refer the account to legal counsel. |
| In flight | Sending… |
| Sent, portal | {notice type} {N-0042} sent to {lot}. Email queued to {n} people. |
| Sent, print | {notice type} {N-0042} recorded. Nobody in {lot} uses the portal. Print the letter and deliver it. · Download PDF |
| No longer delinquent | {lot} is no longer delinquent. No notice was sent. |
| Stale amount | The overdue amount changed to {amount}. Check the updated letter, then send. |
| Error | Couldn't send. Nothing was recorded. Try again. |
| Homeowner bell | You received a {notice type} for an overdue amount of {amount}. Please pay by {deadline}. |
| Withdraw dialog | Withdraw notice {N-0042}? The letter stays on record as withdrawn and the household is told to disregard it. · Reason · Withdraw notice |
| Withdraw, no reason | Say why you're withdrawing this notice |
| Homeowner bell, withdrawn | Notice {N-0042} was withdrawn. Please disregard it. |
| History columns | Date · Notice no. · Household · Notice · Overdue stated · Delivery · Email |
| History empty | No notices sent yet. |
| Letter not available | This letter isn't available. |

## Out of scope

- Penalties and interest in letters (D2).
- Payment arrangements and instalment plans (EPIC-005).
- Referral to counsel, and any record of it.
- Proof of delivery for printed letters (signed acknowledgement). See Open questions.
- Editing letter templates in the portal (templates are fixed in R2).
- Automatic sending (Option C).
- Sending to several households at once (REQ-021).

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions, rows 1–8 | Owner |
| The four letter texts, the R.A. 9904 citation and the by-law remedies | HOA board, with counsel |
| Who signs the letters (the mock-up says "HOA Treasurer, For the Board of Directors") | HOA board |
| Are 15 days and 10 days the right deadlines? | HOA board |
| Letters in Filipino as well as English? | HOA board |
| Should the office record hand delivery of printed letters (date, received by)? Useful if a Final Demand is disputed. | HOA board |
| D2: penalty and interest | HOA board |

## Sol Arch review

Not yet done. Questions for Sol Arch:

1. Transaction shape for `sendNotice`: re-read household, check next step and amount seen, take the notice number, write the notice and household fields; then PDF and mail outside the transaction, with retry. What does the history show if the PDF step fails?
2. Server PDF library: reuse from REQ-013, and Filipino characters (ñ) in names.
3. `sequenceStart` set by the payment and void functions when standing changes: confirm it fits REQ-012/014.
4. **Divergence from SA-001 (r2, C5): confirm or reject.** SA-001 §8.1 lists "notices" among the admin (office staff) role's actions; this REQ (decision 7) and REQ-021 allow only the treasurer to send or withdraw a notice, with the admin office read-only. If confirmed, SA-001 §8.1 and the `sendNotice` role check need the change; if rejected, decision 7 and the admin-office scenario here change instead.
5. Size: the BA expects 3–4 days (backlog M).
