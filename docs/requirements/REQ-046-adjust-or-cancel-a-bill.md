# REQ-046: Adjust or cancel a bill

| | |
|---|---|
| Raised by | Owner decision REQ-008 #5: "YES add the 'Adjust or cancel a bill' story to S2" ("Approve all as shown", 2026-11-28) |
| Epic | [EPIC-002 Billing and statement](../epics/EPIC-002-billing-and-statement.md) |
| Backlog story | New: not in the backlog's numbered list. Raised as a gap in REQ-008 (decision 5) and RELEASE-PLAN ("No story to correct or cancel a wrong bill") |
| Status | **Draft for owner review**. Added to S2 by owner decision (REQ-008 #5, 2026-11-28). Sol Arch full review not yet done. |
| Mockup | Not yet made. Screens needed: 46A correct one bill, 46B bulk correction preview and progress, 46C homeowner statement line, plus the refused states. To be added to the [REQ-005 to REQ-011 mockup](../mockups/req-005-011-mockup.html) before approval |
| Architecture | Sol Arch's view in [REQ-008 review](REQ-008-monthly-billing-run.md#view-on-the-bas-proposed-gap-correct-or-cancel-a-bill-for-s2): adjustment lines, never edits; RELEASE-PLAN conflict C1 (a minus line in the month it is made); SA-001 §4.4 item 1 (totals kept by functions), R-11; Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-008 (bills, billing worker), REQ-009 (statement and ledger, credit), REQ-006 (activity log). Also uses REQ-011 (notifications) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft, from the owner's decision and Sol Arch's design constraints |

## Owner decisions

**Not yet approved.** The right-hand column is the BA's recommendation. The approach (adjustment lines in the month they're made, never edits, bulk by period included) is already decided by the owner (REQ-008 #5).

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (one bill or a whole period, as adjustment lines), B (one bill at a time only) or C (no screen; the developer runs an audited script on the treasurer's written request) | **A**, as the owner already chose bulk by period |
| 2 | May a correction **raise** a bill (under-billed), or only lower or cancel it? | **Both.** A rate entered too low is as likely as too high. The same limit (₱100,000.00 per correction) applies |
| 3 | Reasons the treasurer picks from (the homeowner sees the reason's wording, never the note) | **Wrong rate · Billed in error · Waived by the board · Other**. A note is required for "Other" and "Waived by the board" (the resolution reference) |
| 4 | Who may correct | **Treasurer only**. Admin office and board see corrections read-only |
| 5 | Undoing a mistaken correction | **A second correction the other way**, with reason "Other" and a note. Nothing is ever deleted |

## Problem

Bills are created by the billing run (REQ-008) with a fixed id per household and period, so a wrong bill can't be re-run, edited or deleted. A wrong rate billed to 623 households, or a lot billed that shouldn't have been, would otherwise stay wrong. The only fix would be a developer editing the database by hand, which bypasses the activity log (REQ-006) and breaks the promise that no one edits records.

Who has the problem: the [Treasurer](../product/PERSONAS.md#treasurer), who must fix the mistake, and every [Homeowner](../product/PERSONAS.md#homeowner) whose balance shows money they don't owe, which is exactly the enquiry the statement is meant to remove.

**How often:** rarely, perhaps a few times a year for single bills, and hopefully never for a whole period. When it happens it is urgent, because it is visible on every affected statement at once.

**What "correct" means here:** the original bill stays as it was. A correction is a separate line, dated in the month it is made, that adds to or takes away from the bill. "Cancel" is a correction of minus the bill's full due amount. A closed month (REQ-024) is never touched, which is the same rule as voids (conflict C1).

## Options

### Option A: Correct one bill or a whole period, as adjustment lines (recommended)

- **How it works:** on a household's statement, staff press "Correct this bill" on a period, enter the amount of the correction (or press "Cancel this bill"), pick a reason and confirm. For a wrong rate across a period, Collections → Monthly billing shows "Correct every {period} bill" with an amount per bill, a preview ("623 bills, −₱200.00 each, −₱124,600.00 in total") and progress, like the billing run.
- **Where it lives:** Statement (staff view of a household, REQ-009) for one bill; the Monthly billing card for a period.
- **Cost:** moderate. Single correction 2.5–3.5 days; bulk +1 day (Sol Arch's sizing, REQ-008 review).
- **Excludes:** homeowners and the admin office (read-only).
- **Honest downside:** the statement shows the original amount and the correction, not one clean figure. It is more honest, but a little more to read.

### Option B: One bill at a time only

- **How it works:** the single-bill part of A.
- **Cost:** 2.5–3.5 days.
- **Honest downside:** a wrong rate across 623 households means 623 separate corrections by a volunteer. The owner has already ruled this out by approving bulk.

### Option C: No screen; the developer runs an audited script on written request

- **Cost:** about 1 day (a script writing the same adjustment lines and log entries).
- **Honest downside:** the treasurer waits for the developer while homeowners see wrong balances, and it depends on one person.

### Recommendation

**Option A.** It is what the owner approved, and the bulk path covers the case that matters most: a wrong rate on every bill of one period. It reuses the billing worker, so its safety (one transaction per household, resumable, never twice) is already designed.

## Stories

**46a.** As a treasurer, I want to correct or cancel one household's bill with a reason, so that its statement shows what it really owes without anyone editing records.

**46b.** As a treasurer, I want to correct every bill of one period by the same amount in one step, so that a wrong rate is fixed for all households at once.

## Acceptance criteria (Option A)

```gherkin
Feature: Correcting a bill

  Background:
    Given Carmela Cruz holds the treasurer role
    And today is Dec 8, 2026 in Manila
    And Blk 5 Lot 1 was billed ₱1,800.00 for December 2026, due Dec 31, 2026

  Scenario: Lower one bill
    When Carmela opens Blk 5 Lot 1's statement and presses "Correct this bill" on December 2026
    And she enters -200, picks "Wrong rate" and presses "Save correction"
    Then she sees "Correct Blk 5 Lot 1's December 2026 bill by −₱200.00? It will be ₱1,600.00." and confirms
    Then the statement shows December 2026 billed ₱1,800.00 with "Corrected: −₱200.00 (Wrong rate)"
    And the balance is ₱200.00 lower
    And the original ₱1,800.00 is unchanged

  Scenario: Cancel one bill
    When Carmela presses "Cancel this bill" on December 2026, picks "Billed in error" and confirms "Cancel Blk 5 Lot 1's December 2026 bill of ₱1,800.00?"
    Then December 2026 shows "Corrected: −₱1,800.00 (Billed in error)" and reads "Paid" with ₱0.00 left
    And the bill still exists and is listed

  Scenario: Raise a bill that was under-billed (decision 2)
    When Carmela corrects December 2026 by 200 with reason "Wrong rate"
    Then December 2026 shows "Corrected: +₱200.00 (Wrong rate)" and ₱2,000.00 is due

  Scenario: A correction on a bill already paid becomes credit
    Given December 2026 is fully paid by an approved ₱1,800.00 payment
    When Carmela corrects it by −₱200.00
    Then the summary reads "₱200.00 credit"
    And the credit pays the next bill, oldest first (REQ-009 decision 2)

  Scenario: A correction can't take a bill below zero
    Given December 2026 was already corrected by −₱1,000.00
    When Carmela enters -1000
    Then she sees "That would take the bill below ₱0.00. The most you can take off is ₱800.00."
    And nothing is saved
    And the function refuses the same if sent directly

  Scenario: Missing or invalid amount and reason
    When Carmela leaves the amount empty, enters 0, or enters "200.555"
    Then she sees "Enter the correction in pesos, not ₱0, with at most 2 decimal places. Use a minus sign to lower the bill."
    When she enters 150000
    Then she sees "A correction can't be more than ₱100,000.00."
    When she picks "Other" or "Waived by the board" and leaves the note empty
    Then she sees "Add a note explaining the correction."
    And everything she typed is kept

  Scenario: Pressing Save twice saves one correction
    When Carmela presses "Save correction" twice quickly
    Then exactly one correction exists
    And the button reads "Saving…" and is disabled until the save finishes

  Scenario: The bill changed while the dialog was open
    Given a second treasurer corrected the same bill after Carmela opened the dialog
    When Carmela presses "Save correction"
    Then she sees "This bill was changed since you opened it. Reload to see the latest, then correct it again."
    And her correction is not saved

  Scenario: Undo a mistaken correction (decision 5)
    Given December 2026 was corrected by −₱200.00 by mistake
    When Carmela corrects it by 200 with reason "Other" and note "Reverses the correction of Dec 8"
    Then the statement shows both corrections and ₱1,800.00 is due
    And neither correction is deleted

  Scenario: The homeowner is told
    When the December 2026 bill of Blk 5 Lot 1 is corrected by −₱200.00
    Then each linked person of Blk 5 Lot 1 gets the notification "Your December 2026 bill was corrected: −₱200.00."
    And their statement shows the reason "Wrong rate" but not the treasurer's note

  Scenario: Corrections are logged and dated in the month they are made
    Given the December 2026 bill is corrected on Jan 4, 2027
    Then the activity log records "Carmela Cruz (Treasurer) corrected the December 2026 bill of Blk 5 Lot 1 by −₱200.00"
    And the correction counts in January 2027's collections totals, not December 2026's
    And a closed December 2026 (REQ-024) is not changed

  Scenario: Correcting an opening balance
    Given Blk 3 Lot 9's "Balance before December 2026" is ₱9,000.00
    When Carmela corrects it by −₱1,800.00 with reason "Billed in error" and a note
    Then the opening line shows "Corrected: −₱1,800.00 (Billed in error)"

  Scenario: Only the treasurer can correct
    Given Paolo Aquino holds the admin office role
    When he opens Blk 5 Lot 1's statement
    Then he sees the corrections but no "Correct this bill" or "Cancel this bill"
    And the correction function refuses a request from his account
    And Firestore refuses any correction or bill written from any browser

  Scenario: A homeowner cannot correct
    Given Carlo is linked to Blk 5 Lot 1
    Then his statement has no correction controls
    And the correction function refuses a request from his account

  Scenario: The correction fails to save
    Given the connection drops while saving
    Then Carmela sees "We couldn't save the correction. Nothing was changed. Try again."
    And the amount, reason and note she entered are kept

Feature: Correcting every bill of a period

  Background:
    Given Carmela Cruz holds the treasurer role
    And December 2026 was billed to 623 households at ₱2,000.00 when the approved rate was ₱1,800.00

  Scenario: Preview, then correct the whole period
    When Carmela presses "Correct every December 2026 bill", enters -200 and picks "Wrong rate"
    Then she sees "Correct 623 December 2026 bills by −₱200.00 each, −₱124,600.00 in total? Each household is told. This can't be undone except by another correction."
    When she presses "Correct bills"
    Then the card reads "Correcting December 2026… 0 of 623" and counts up
    And then "December 2026 corrected: 623 bills, −₱124,600.00. Done Dec 8, 2026 at 10:12 AM by Carmela Cruz."
    And every December 2026 bill shows "Corrected: −₱200.00 (Wrong rate)"

  Scenario: Bills that would go below zero are left out and listed
    Given Blk 5 Lot 1's December 2026 bill was already cancelled
    When the bulk correction of −₱200.00 runs
    Then Blk 5 Lot 1 is not corrected again
    And the result reads "622 bills corrected. 1 left out because it would go below ₱0.00: Blk 5 Lot 1"

  Scenario: An interrupted bulk correction is finished, not repeated
    Given the bulk correction has made no progress for 5 minutes after 300 of 623 bills
    When Carmela presses "Continue correcting"
    Then 323 more bills are corrected
    And each bill has exactly one correction from this run
    And two treasurers pressing "Continue correcting" at once start one worker

  Scenario: Pressing Correct bills twice runs once
    When Carmela presses "Correct bills" twice quickly, or on two devices at once
    Then one bulk correction runs
    And the second press shows "A correction of December 2026 is already running."

  Scenario: The period has changed since the preview opened
    Given a late bill for Blk 8 Lot 2 was added to December 2026 after the preview opened
    When Carmela presses "Correct bills"
    Then she sees "December 2026's bills changed since you opened this preview. Check the new figures."
    And nothing is corrected

  Scenario: Nothing to correct
    Given no period has been billed yet
    Then "Correct every bill" is not shown on the Monthly billing card

  Scenario: The bulk correction is logged once
    When the December 2026 bulk correction finishes
    Then the activity log records "Carmela Cruz (Treasurer) corrected 623 December 2026 bills by −₱200.00 each"
    And each household's log entries show its own correction
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Correction line: `billId`, `householdId`, `amountCentavos` (negative lowers; cancel is minus the bill's full due amount), `reasonCode` (`wrongRate`, `billedInError`, `waived`, `other`), `note` (staff-only, required for `waived` and `other`, up to 300 characters), `monthMade` (`YYYY-MM`, Asia/Manila), `runId` (or null), `by`, `at` (server) | `billAdjustments/{id}`. Single: id made by the browser, create-only, so a retry returns the same correction. Bulk: deterministic `adj_{period}_{runNo}_{householdId}` | Never edited or deleted (CS-15). No client writes | `adjustBill`, bulk worker | Treasurer, admin office, board (all fields); household members (all but `note`, through a household-visible summary; Sol Arch to confirm whether the note moves to a staff-only document as REQ-010 does) |
| Bill's corrected total | `bills/{id}.adjustedCentavos` (starts at 0, REQ-008). The original `amountCentavos` never changes. Due = `amount + adjusted`, never below 0 | Changed only in the same transaction as a correction | `adjustBill`, bulk worker | Statement ledger (REQ-009) |
| Household totals | `households/{id}.billedCentavos`, `balanceCentavos` | Same transaction as the correction | Same | Statement, directory |
| Month totals | `monthlyTotals/{monthMade}.adjustedCentavos` | Raised in the same transaction, in the month the correction is **made** (C1). Closed months are never touched | Same | Collections and fund summary (REQ-023, REQ-024) |
| Bulk run record: period, `runNo`, amount per bill, reason, note, bills in scope, `createdCount`, `skipped[]` (lots that would go below 0), `cursor`, `status`, `leaseUntil`, `heartbeatAt`, started by and at, finished at | `billAdjustmentRuns/{period}_{runNo}` | Created by `startBulkAdjustment({period, amountCentavos, reason, note, expectedBillCount})`, treasurer only; refused if another run for the period is `running` or the count changed since the preview. "Stopped" is derived from the heartbeat, as in REQ-008 | `startBulkAdjustment`, `continueBulkAdjustment`, task-queue worker | Billing card |
| Notifications | `notifications` (REQ-011), id `adj_{adjustmentId}_{uid}` | One per linked person per corrected household | Same transaction | Those people |
| Change records | `auditLog` (shared helper, REQ-006) | `bill.adjusted` per correction (amount, reason code, no note); `billing.bulkAdjusted` per run (count, total) | Functions | Treasurer, board, admin office |

**Guards on `adjustBill({adjustmentId, billId, amountCentavos, reason, note, seenUpdatedAt})`** (CS-5), in one transaction: refuse if the bill changed since the screen loaded; refuse if the result would be below ₱0.00; refuse amounts of 0 or more than ₱100,000.00 either way; then write the correction, raise `adjustedCentavos`, update household and month totals, write the notification and the log entry.

## UX/UI notes

- **Accessibility:** the amount field has a visible label and the hint "Use a minus sign to lower the bill", with `inputmode` allowing a minus sign (`text` with a pattern, since some phone number pads have no minus); the result ("It will be ₱1,600.00") is text and announced; reasons are a labelled radio group; errors under each field are announced; the bulk progress is text, announced politely; tap targets 44 × 44 px.
- **Consistency:** "Correction" and "Corrected" on screen, never "adjustment" (add "Correction" to the glossary: a line that changes what a bill asks for, dated when made; the bill itself is never changed). Amounts with a sign, "−₱200.00" and "+₱200.00". The confirm dialog is the app's one confirm dialog; the bulk card reuses the billing run's progress pattern.
- **Mobile-first:** "Correct this bill" sits in each period card's overflow on phones and as a row action on desktop; the dialog is a single column at 375 px.
- **States:** empty (no corrections: nothing extra shows); loading (the dialog's "It will be" line waits for the bill); error (above, typing kept); success (the statement updates; toast "Correction saved."); bulk running, stopped (Continue), completed with any left-out lots; refused states as in the scenarios.
- **Forms:** validate on blur; keep everything typed on any error; the dialog does **not** close on a backdrop click.
- **Safe actions:** every correction is confirmed with its result in words; "Save correction" and "Correct bills" show "Saving…" and are disabled in flight; the server guards are the client-made id (single), the deterministic id and lease (bulk) and `seenUpdatedAt`. Reversible by a correction the other way; nothing is deleted.
- **Stable layout:** the "It will be {amount}" line reserves its space so the buttons don't jump.
- **Roles:** treasurer corrects; admin office and board see corrections read-only; homeowners see the correction and its reason on their statement, never the note. Hidden buttons are not protection: the functions check the role.
- **Privacy:** the note is free text and may name people, so it is staff-only and never copied into the activity log or notifications.

## Copy of record

| Where | Text |
|---|---|
| Period action | Correct this bill · Cancel this bill |
| Dialog heading | Correct {lot}'s {period} bill |
| Fields | Correction (₱) · Reason · Note |
| Amount hint | Use a minus sign to lower the bill. |
| Reasons | Wrong rate · Billed in error · Waived by the board · Other |
| Result line | It will be {amount}. |
| Confirm (correct) | Correct {lot}'s {period} bill by {signed amount}? It will be {amount}. · Save correction (in flight: Saving…) · Go back |
| Confirm (cancel) | Cancel {lot}'s {period} bill of {amount}? · Cancel bill (in flight: Saving…) · Go back |
| Statement line | Corrected: {signed amount} ({reason}) |
| Saved toast | Correction saved. |
| Below zero | That would take the bill below ₱0.00. The most you can take off is {amount}. |
| Amount error | Enter the correction in pesos, not ₱0, with at most 2 decimal places. Use a minus sign to lower the bill. |
| Over limit | A correction can't be more than ₱100,000.00. |
| Note required | Add a note explaining the correction. |
| Stale bill | This bill was changed since you opened it. Reload to see the latest, then correct it again. |
| Save error | We couldn't save the correction. Nothing was changed. Try again. |
| Homeowner notification | Your {period} bill was corrected: {signed amount}. |
| Bulk button | Correct every {period} bill |
| Bulk preview | Correct {n} {period} bills by {signed amount} each, {signed total} in total? Each household is told. This can't be undone except by another correction. · Correct bills (in flight: Saving…) · Cancel |
| Bulk progress | Correcting {period}… {x} of {n} |
| Bulk done | {period} corrected: {n} bills, {signed total}. Done {date} at {time} by {name}. |
| Bulk left out | {n} left out because it would go below ₱0.00: {lots} |
| Bulk stopped | {period} correction stopped at {x} of {n}. Press Continue to finish it. Bills already corrected won't be corrected again. · Continue correcting |
| Bulk already running | A correction of {period} is already running. |
| Bulk stale | {period}'s bills changed since you opened this preview. Check the new figures. |
| Read-only note (admin office, board) | Only the treasurer can correct bills. |

## Out of scope

- Editing or deleting a bill, or re-running a period (never; adjustment lines only).
- Changing a closed month (C1: the correction is dated in the month it is made).
- Late penalties, interest and waivers of them (D2, none in R1).
- Correcting a payment (voids are REQ-014, S3) or "Credit before {first period}" lines.
- One-off charges not tied to a bill (assessments, sticker fees; EPIC-002 open question).
- Bulk corrections of a subset of households (for example one phase): one bill at a time, or a later story if it happens.
- Emailing the correction (story 19, R2).

## Open questions

| Question | Who decides |
|---|---|
| Decisions 1–5 above | Owner |
| Does a waiver need a board resolution reference, and in what format? | HOA board |
| Should corrections show separately in the board financial report (REQ-039) and fund summary (REQ-024), or net against billed? | Treasurer, with the accountant |
| Does the note move to a staff-only document (as REQ-010's `paymentPrivate`), so household members can't read it through rules? | Sol Arch |
| Mockup screens 46A–46C before approval | BA |

## Sol Arch review

**Not yet done.** The design constraints below are Sol Arch's, from the REQ-008 review ("View on the BA's proposed gap"), and this draft follows them:

- A bill is never edited, deleted or re-created; a correction is an **adjustment line** in `billAdjustments`, dated in the month it is made, matching C1, so REQ-023/024 treat corrections and voids alike.
- `adjustBill` is treasurer only, with two guards (stale bill; not below ₱0.00), adds to `bills.adjustedCentavos`, updates household totals and writes `bill.adjusted`, all in one transaction. The ledger uses `amount + adjusted`; a reduction on a paid bill becomes credit (REQ-009 decision 2).
- The bulk correction reuses the billing worker, with its own run record, per-household transactions and deterministic id `adj_{period}_{runNo}_{hh}`.
- Homeowners see the reason code's wording; free-text notes are staff-only; each linked person is notified.

**Sol Arch's sizing:** M, **2.5–3.5 person-days** with Claude Code for single corrections; **bulk by period +1 day**. Total **3.5–4.5 days**. Recommended to ship before the first production billing run.

Questions for Sol Arch (from the BA, r1):

1. The note's privacy: a field on `billAdjustments` that rules hide from members, or a staff-only `billAdjustmentPrivate/{id}`?
2. `monthlyTotals/{monthMade}.adjustedCentavos` raised per correction: confirm it fits REQ-023/024's closing rule and that a closed month can't receive a late write.
3. Bulk "left out" lots and a stale preview (`expectedBillCount`): enough, or should the preview carry a hash of the bill ids?
4. Confirm the ₱100,000.00 limit per correction and allowing increases (decision 2).
