# REQ-014: Void an approved payment

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-003 Payments and receipts](../epics/EPIC-003-payments-and-receipts.md) |
| Backlog story | [14 Void an approved payment](../backlog/BACKLOG.md#14-void-an-approved-payment) *(not in mock-up)* |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted (REQ-013 #3 as Sol Arch proposed). Sol Arch reviewed: supports Option A with changes (applied in r4). Go-live gated with REQ-013 on D5 |
| Mockup | Screens 14A–14C of the payments and announcements mockup (not yet published as an artifact). Repo copy: [req-012-017-mockup.html](../mockups/req-012-017-mockup.html) |
| Architecture | SA-001 §3 (`voidReceipt`), §4.2 (`receipts.voided`, `voidReason`), §4.3 Flow 1 point 2, §4.4 item 12, R-1, R-11; CODING-STANDARDS rules 5, 12, 15. Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-012, REQ-013, REQ-006 (activity log), REQ-011 (notifications) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft. r2, 2026-11-28: reconciled with REQ-023 and REQ-024 (conflict C1): a void counts in the month it is made, and a receipt from a closed month can be voided without reopening it. r3, 2026-11-28: Sol Arch review recorded. r4, 2026-11-28: Sol Arch's changes applied (recalculated allocation, closed-month check, void file kept beside the issued one, one notification per member, reason hint, overpayment, role-removed and month-boundary scenarios, `voidedByName`); reinstating a void and board notification added as open decisions 7 and 8. r5, 2026-11-28: owner approval recorded; recommendations accepted. r6, 2026-11-28: reference reservation row aligned to REQ-010 (no status; a void never deletes it). r7, 2026-11-28: answers TC-14 gaps G-1 to G-12: no per-bill paid amounts (a void lowers the household's paid total and recalculates the balance and `openBills`, REQ-009 r3); reason-length copy; "Payment voided" notification rows and routes for REQ-011, with a variant for people who joined after the payment; a retry by the same treasurer shows the success toast; statement note only once a lot has a void; void-file states and the treasurer's two files; "Made before you joined" rows hide the reason; submitter note; deactivated household; credit wording in the toast. r8, 2026-11-28: activity-log scenario aligned to REQ-006 (the log records who and when and points to the payment; the void reason lives on the payment only). r9, 2026-11-28: decisions 7 (a, `reinstatePayment` script) and 8 (yes) approved (owner: "Approve all"); board notice and reinstated-payment data made unconditional; reinstatement scenario added · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Decisions 7 and 8 were added afterwards from Sol Arch's review and approved as recommended on 2026-11-28 ("Approve all"): 7 (a), 8 yes. Questions for the HOA board or its accountant under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (the treasurer voids with a reason), B (a void needs a second person to confirm) or C (no void screen: the developer voids on the board's written request) | **A** |
| 2 | Does the homeowner see the void reason? | **Yes**, on their payment history and in the notification. The dialog warns the treasurer: "The homeowner will see this reason." |
| 3 | After a void, may the same reference number be submitted again? | **No.** The reference stays reserved, so money that never arrived can't be approved twice. **No undo screen for a mistaken void:** the board asks the developer in writing (rare). How the developer then acts is decision 7 |
| 4 | Self-void: a treasurer voiding their own household's payment | **Refused**, as for approval (REQ-012 decision 3) |
| 5 | Which month a void counts in, and voiding a receipt dated in a closed month (story 24, R2) | **The void counts in the month it is made** (Manila time), as a minus line; the receipt's own month keeps its total. So a receipt from a closed month **can** be voided without reopening that month, and the closed month never changes. The month of a void is always the current month, which can't be closed until it ends (REQ-024 decision 5). Same rule as REQ-023 decision 3 and REQ-024. *Changed in r2 from "refused once month closing exists; reversed in the original month". Refusing would leave a receipt known to be wrong standing until the board reopened a month it has already been shown. Recording the reversal in the current period is the usual bookkeeping practice; the HOA's accountant to confirm (open questions).* In R1, `voidReceipt` writes the void's period from the start, so nothing changes when month closing arrives |
| 6 | **D5:** does the BIR allow a voided receipt to be kept and stamped, rather than cancelled in another way? | **Open with the board's accountant**, with REQ-013 decision 2; blocks go-live, not the build. Built as "stamp VOID, keep the number", which fits common practice but is **unverified** for BIR |
| 7 | *Added after approval (Sol Arch change 1).* Decision 3 has the board ask the developer to reverse a mistaken void, but nothing can reverse one without the manual database edit the Problem rules out | **(a)**, approved 2026-11-28 ("Approve all"): a developer script, `reinstatePayment`, run on the board's written request. It creates a new **pending** payment linked to the voided one (`reinstatedFrom`), reusing its reference number as a recorded exception; that payment goes through normal approval and gets a **new** receipt number. +0.5 day. Not chosen: (b) no reversal in R1, accepting that the homeowner's money stays unrecorded until a manual process exists |
| 8 | *Added after approval (Sol Arch change 2).* Notify every board member in-app of each void, to cover "one person reverses money on their own" | **Yes**, approved 2026-11-28 ("Approve all") (about 0 days, REQ-011's notify helper), on top of the R2 monthly void list |

## Problem

The mock-up has no way to undo an approval. Mistakes will happen: a screenshot later found to be fake, money that never reached the collection account, a payment approved for the wrong amount. Without a void the treasurer can only leave the books wrong or ask the developer to edit the database, which destroys the record. Deleting a receipt would leave a gap in the numbers (EPIC-003 target: zero skipped or repeated).

How often: unknown, probably a few times a year. That is why the recommendation is a small, careful screen rather than a workflow.

## Options

### Option A: The treasurer voids with a reason (recommended)

- **How it works:** on an approved payment's detail, the treasurer presses "Void", types a reason and confirms. The payment and receipt read "Void", the household's balance goes back up, and a copy of the receipt stamped "VOID" is added beside the original. The number is never reused.
- **Cost:** moderate (story size M; much of it reuses REQ-012's transaction and totals).
- **Excludes:** admin office staff and board members.
- **Honest downside:** one person can reverse money on their own. The activity log and the board's review of voids are the check.

### Option B: Void with a second person's confirmation

- **How it works:** the treasurer requests a void; a board member or second treasurer confirms.
- **Cost:** moderate plus: another status, queue and notification.
- **Honest downside:** the books stay wrong until the second person acts; the board role is read-only in R1 (REQ-002).

### Option C: No void screen; the developer voids on request

- **How it works:** as REQ-002 Option B: the board asks in writing, the developer runs the same `voidReceipt` function from a script.
- **Cost:** cheap.
- **Honest downside:** days of delay while a homeowner's balance is wrong; depends on the developer being available.

### Recommendation

**Option A.** The function is needed in every option; the screen is a small addition, and the treasurer can correct the books the day the mistake is found. If the board wants a second pair of eyes, ask it to review the void list monthly (a process, not software) before paying for Option B.

## Story

As a treasurer, I want to void a payment I approved by mistake, with a reason, so that the books are corrected without losing or reusing the receipt number.

## Acceptance criteria (Option A)

```gherkin
Feature: Voiding a payment

  Background:
    Given OR-00093 for ₱1,800.00 from Blk 2 Lot 7 was approved on Nov 28, 2026
    And Blk 2 Lot 7's balance is ₱0.00
    And the last receipt issued is OR-00093

  Scenario: Void a payment approved by mistake
    When the treasurer opens OR-00093, presses "Void", types "Duplicate of OR-00090" and presses "Void payment"
    Then the button reads "Voiding…" and is disabled until the save finishes
    And they see "OR-00093 is void. Blk 2 Lot 7's balance is back to ₱1,800.00."
    And OR-00093 reads "Void" in the treasurer's payment detail and in the household's payment history
    And Blk 2 Lot 7's balance reads ₱1,800.00
    And the bell of every member linked to Blk 2 Lot 7 shows "Payment voided: ₱1,800.00, OR-00093. Reason: Duplicate of OR-00090."
    And the activity log records who voided it and when, pointing to the payment; the reason stays on the payment, not in the log (REQ-006)

  Scenario: A member who joined after the payment is told without the details (G-3, G-8)
    Given Ben Cruz was linked to Blk 2 Lot 7 after OR-00093's payment was submitted
    When the treasurer voids OR-00093
    Then Ben's bell shows "A payment of ₱1,800.00 made before you joined was voided. Your balance is updated."
    And Ben's payment history shows it as "Void · Made before you joined", with no reason and no receipt number

  Scenario: The void leaves a credit (G-11)
    Given Blk 6 Lot 4 has ₱2,000.00 credit, including a ₱1,800.00 payment approved as OR-00095
    When the treasurer voids OR-00095
    Then they see "OR-00095 is void. Blk 6 Lot 4 now has ₱200.00 credit."

  Scenario: Board members are told of every void (decision 8)
    When the treasurer voids OR-00093
    Then every board member's bell shows "Payment voided by Liza Santos: ₱1,800.00, OR-00093, Blk 2 Lot 7."
    And pressing it opens the Activity log filtered to Payments

  Scenario: The number is never reused
    Given OR-00093 is void
    When the next payment is approved
    Then it gets OR-00094

  Scenario: A mistaken void is reinstated by the developer (decision 7 (a))
    Given OR-00093 is void and the board asked in writing for the void to be reversed
    When the developer runs the reinstatement script for OR-00093
    Then a new ₱1,800.00 payment from Blk 2 Lot 7 with reference "4012883219554" is pending approval, marked "Reinstated from OR-00093"
    And OR-00093 stays void with its number kept
    And when the treasurer approves the new payment, it gets a new receipt number

  Scenario: A voided receipt is marked
    When a member of Blk 2 Lot 7 downloads OR-00093 after it is voided
    Then the PDF is stamped "VOID" with the date voided and the reason
    And everything else on it is unchanged
    And the treasurer can still download the original as issued, without the stamp, with "Original as issued" beside "Receipt PDF (void copy)" (G-7)

  Scenario: While the stamped file is being made (G-6, REQ-013)
    Given OR-00093 was voided a moment ago
    When a member of Blk 2 Lot 7 opens Dues & Payments
    Then the payment shows "Void" and a disabled "Preparing receipt…"
    And the unstamped file is never offered to them

  Scenario: Voiding needs a reason
    When the treasurer presses "Void" and leaves the reason blank
    Then "Void payment" stays disabled
    And the reason box shows the hint "The homeowner sees this reason. Don't include other people's names or account numbers."

  Scenario: The reason must be 5 to 200 characters (G-2)
    When the treasurer types "Dup" and leaves the reason box
    Then "Void payment" stays disabled
    And "Write at least 5 characters." shows under the box
    When they type a reason of 200 characters
    Then the counter reads "200/200" and the box accepts no more

  Scenario: The dialog says what will happen
    When the treasurer presses "Void"
    Then they see "Void OR-00093 for ₱1,800.00? The balance of Blk 2 Lot 7 goes back up by ₱1,800.00. The receipt number is kept and never reused. The homeowner will see this reason."
    And clicking outside the dialog does not close it

  Scenario: Pressing twice voids once
    When the treasurer presses "Void payment" twice quickly
    Then the payment is voided once and the balance goes up by ₱1,800.00 once

  Scenario: A dropped connection does not void twice (G-4)
    Given Liza pressed "Void payment" and the connection dropped before the answer came back
    When she presses "Void payment" again
    Then she sees "OR-00093 is void. Blk 2 Lot 7's balance is back to ₱1,800.00."
    And the balance went up by ₱1,800.00 once

  Scenario: Two treasurers void the same receipt
    Given two treasurers have OR-00093 open
    When both void it
    Then it is voided once
    And the second sees "OR-00093 was already voided by Liza Santos. Nothing was changed."

  Scenario: Only approved payments can be voided
    Given a payment is "Pending approval", "Rejected" or "Void"
    Then it has no "Void" button
    And the server refuses a void request for it

  Scenario: The reference number stays used
    Given OR-00093 with reference "4012883219554" is void
    When anyone submits reference "4012883219554" again
    Then they see "This reference number was already submitted on Nov 27, 2026. Check the number on your screenshot."

  Scenario: A void with a later payment already on the account
    Given OR-00094 for ₱1,800.00 was approved for Blk 2 Lot 7 after OR-00093
    When OR-00093 is voided
    Then Blk 2 Lot 7's balance goes up by ₱1,800.00
    And the statement applies the remaining payments to the oldest bills first, so no later month shows paid while an earlier one is unpaid
    And OR-00094's receipt is unchanged
    And the statement notes "Receipts show how a payment was applied on the day it was issued."

  Scenario: The statement note shows only once the lot has a void (G-5)
    Given Blk 8 Lot 2 has never had a payment voided
    When a member opens Dues & Payments
    Then the note "Receipts show how a payment was applied on the day it was issued." is not shown

  Scenario: Voiding an overpayment whose credit was already used
    Given Juan paid ₱2,000.00 against ₱1,800.00 owed, leaving ₱200.00 credit
    And December's ₱1,800.00 bill then left ₱1,600.00 due
    When that payment is voided
    Then Juan's balance reads ₱3,600.00

  Scenario: The treasurer role is removed while the receipt is open
    Given Mark's treasurer role was removed while he had OR-00093 open
    When he presses "Void payment"
    Then it is refused and nothing changes

  Scenario: A void at the month boundary
    Given November 2026 was closed at 00:00 on Dec 1, 2026 while a void started on Nov 30 was being saved
    Then the void is refused with "Couldn't void. Try again."
    When the treasurer tries again
    Then the void is saved and counts in December 2026

  Scenario: Admin office staff and board members can't void
    Given Paolo has the admin role and Rosa has the board role
    Then neither sees "Void"
    And the server refuses a void request from either

  Scenario: The treasurer can't void their own household's payment
    Given the treasurer Liza Santos is a member of Blk 9 Lot 3
    When she opens an approved payment from Blk 9 Lot 3
    Then "Void" is not shown and she sees "This is your own household's payment. Another treasurer must void it."

  Scenario: The treasurer can't void a payment they submitted (G-9)
    Given Mark submitted a payment for Blk 4 Lot 1 while he was a member, and was later removed from the lot
    When he opens that approved payment as treasurer
    Then "Void" is not shown and he sees "You submitted this payment. Another treasurer must void it."
    And if his browser sends the void anyway, the server refuses it

  Scenario: A payment from a deactivated household can be voided (G-10)
    Given Blk 2 Lot 7 was deactivated after OR-00093 was approved
    When the treasurer voids OR-00093
    Then it is voided as usual and the lot's balance goes back up by ₱1,800.00

  Scenario: A void counts in the month it is made (decision 5)
    Given OR-00093 for ₱1,800.00 is dated Nov 28, 2026
    When the treasurer voids it on Dec 3, 2026
    Then November 2026 collections still count OR-00093, marked "Voided Dec 3, 2026"
    And December 2026 collections show "Void of OR-00093 · −₱1,800.00" (REQ-023)

  Scenario: Voiding a receipt from a closed month (decision 5, once month closing exists)
    Given October 2026 is closed with Dues ₱30,600.00
    And OR-00090 for ₱1,800.00 is dated Oct 12, 2026
    When the treasurer voids OR-00090 on Nov 8, 2026
    Then the void is saved without reopening October 2026
    And October 2026 still shows Dues ₱30,600.00
    And November 2026 collections show "Void of OR-00090 · −₱1,800.00"

  Scenario: The save fails
    Given the connection is lost
    When the treasurer presses "Void payment"
    Then they see "Couldn't void. Nothing was changed. Check your connection and try again."
    And the reason they typed is still there
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Payment status `voided`, `voidedBy`, `voidedByName` (copied at the void, for the conflict message), `voidedAt`, `voidReason` | `payments/{id}` | Only from `approved`; reason 5–200 characters after trimming (the screen keeps "Void payment" disabled under 5 and stops input at 200, G-2); refused unless the caller holds the treasurer role (`staff/{uid}`, read in the transaction), is not a member of the payment's household (`members/{hh}_{uid}` must not exist) and is not its submitter. **A repeat by the same voider returns the original result (the balance after the void) and writes nothing; the screen shows the success toast, as REQ-012 does for a repeated approval** (G-4). A void by someone else first returns the conflict with `voidedByName`. A payment from a deactivated household (REQ-003) is voided as usual (G-10). `voidReason` is on the household-readable payment, shown as "Void: {reason}", except on "Made before you joined" rows, which show "Void" only (G-8) | `voidReceipt` | Treasurer; the household |
| Receipt void: `voided`, `voidReason`, `voidedAt`, `voidedBy` | `receipts/{orNo}` | Number and snapshot never change | `voidReceipt` | PDF function, REQ-013 (staff and functions only) |
| Receipt files | Storage `receipts/{orNo}/issued.pdf` (kept) and `receipts/{orNo}/void.pdf` (added) | A trigger fires when `voided` goes from false to true and renders the original layout from the snapshot plus the stamp (built from `voidedAt` and `voidReason` only), with the same "same output every run" rule and status handling as REQ-013 (`voidPdfStatus`; `voidReceipt` sets the payment's `receiptPdfStatus` back to `preparing` in the void transaction). The issued file is never overwritten | Receipt PDF trigger | `getReceiptUrl`: homeowners get the void version only, and are refused while it is preparing or failed, never served the unstamped file (G-6); the treasurer sees "Receipt PDF (void copy)" and "Original as issued" (G-7) |
| Bills | **Read only, never written** (r7, G-1; REQ-009 r3, Sol Arch's S2 design) | No per-bill paid amount is stored, so nothing on a bill changes. Oldest-first holds automatically: every screen works out each bill's paid amount from the bills and the household's paid total (REQ-009), so after a void the remaining payments fall on the oldest bills and no later month shows paid while an earlier one is unpaid | — | REQ-009, REQ-015, REQ-018 |
| Household totals | `households/{id}` `paidCentavos`, `balanceCentavos` (negative = credit), `openBills` | **Recalculated** in the void transaction: `paidCentavos` down by the payment's amount; `balanceCentavos` and the `openBills` summary worked out again by `shared/domain/ledger.js` from all the household's bills and the new paid total (never by subtracting the voided receipt's lines). `pendingCentavos` is **not** touched by a void | `voidReceipt` | REQ-009, REQ-015 |
| Monthly totals | `monthlyTotals/{period}.duesCentavos` | Reduced in the **period of the void** (server time, Asia/Manila), never in the receipt's own period (decision 5, REQ-023 decision 3); same transaction as the void. **If that period is closed, refused with "Couldn't void. Try again."** (free: the document is read anyway; covers a void that commits just after a midnight close) | `voidReceipt` | REQ-023, REQ-024, R2 reports |
| Void period | `receipts/{orNo}.voidPeriod` (`YYYY-MM`) | The month of the void, Manila time | `voidReceipt` | REQ-023 |
| Reference reservation | `paymentRefs/{normalisedRef}` (REQ-010, no status) | **Never deleted by a void** (decision 3); only a rejection deletes it (REQ-012) | — | REQ-010 |
| Notifications | `notifications` (REQ-011), ids `payvoid_{paymentId}_{uid}` | **One per linked member** of the household (REQ-011 decision 2), opening Dues & Payments; members linked after the payment was submitted get the "made before you joined" text with no receipt number or reason (G-3, G-8); and (decision 8) one per board member, opening the Activity log filtered to Payments (the board has no payment screens in R1). The rows to add to REQ-011's catalogue are in Copy of record | `voidReceipt` | Homeowner bell; board bell |
| Statement note | REQ-009's statement | "Receipts show how a payment was applied on the day it was issued." shows only when the lot has at least one `voided` payment (G-5): before any void, every receipt matches the statement | — | REQ-009 |
| Activity log | `auditLog` (REQ-006) | `payment.voided`, ids only; the reason stays on the payment and the receipt, never in the log | `voidReceipt` | Board, treasurer |
| Reinstated payment (decision 7 (a)) | `payments/{id}.reinstatedFrom` | A new **pending** payment linked to the voided one, reusing its reference number as a recorded exception; approved normally, with a new receipt number | `reinstatePayment` developer script, on the board's written request | Treasurer |

## UX/UI notes

- **Accessibility:** the "VOID" state is a pill with text and a strike-through amount, never colour alone; the dialog has a labelled reason box with a character counter; focus moves into the dialog and back to the payment.
- **Consistency:** "Void" (glossary), not "delete" or "reverse"; reuses REQ-012's dialog shape and danger button.
- **Mobile-first:** "Void" is at the bottom of the payment detail, away from other buttons; the dialog fits 375 px.
- **States:** loading, success toast with the new balance, conflict (already voided), failure with typed reason kept.
- **Forms:** the dialog doesn't close on a backdrop click or Escape once anything is typed; the reason box carries the hint "The homeowner sees this reason. Don't include other people's names or account numbers."
- **Safe actions:** confirmed (the dialog is the confirmation and states the money effect); in-flight label; server refusal of anything not `approved` (two guards). Not undoable in the app (decision 3).
- **Stable layout:** the "Void" button is replaced in place by the "own household" note.
- **Roles:** treasurer only, refused by `voidReceipt` and rules; the role is re-read inside the transaction, so a role removed while the receipt is open is refused. Not the treasurer's own household (decision 4).

## Copy of record

| Where | Text |
|---|---|
| Button | Void · Void payment · (in flight) Voiding… |
| Dialog | Void {OR no.} for {amount}? · The balance of {lot} goes back up by {amount}. The receipt number is kept and never reused. The homeowner will see this reason. · Reason · The homeowner sees this reason. Don't include other people's names or account numbers. · {n}/200 · (under 5 characters, on leaving the box) Write at least 5 characters. · Cancel · Void payment |
| Toast | {OR no.} is void. {lot}'s balance is back to {balance}. · (when the lot is still in credit) {OR no.} is void. {lot} now has {amount} credit. |
| Status | Void |
| History | Void: {reason} · (made before you joined) Void · Made before you joined |
| Notification (rows for REQ-011's catalogue) | **Payment voided** · each linked person of the household · Payment voided: {amount}, {OR no.}. Reason: {reason}. · opens Dues & Payments · **Payment voided (joined after it was made)** · each person linked after the payment was submitted · A payment of {amount} made before you joined was voided. Your balance is updated. · opens Dues & Payments · **Payment voided (board, decision 8)** · each board member · Payment voided by {name}: {amount}, {OR no.}, {lot}. · opens Activity log (Payments) |
| Statement note (only once the lot has a void) | Receipts show how a payment was applied on the day it was issued. |
| PDF stamp | VOID · {date voided} · {reason} |
| Treasurer's files | Receipt PDF (void copy) · Original as issued |
| Conflict | {OR no.} was already voided by {name}. Nothing was changed. |
| Own household / submitter | This is your own household's payment. Another treasurer must void it. · You submitted this payment. Another treasurer must void it. |
| Error | Couldn't void. Nothing was changed. Check your connection and try again. · (closed period) Couldn't void. Try again. |

## Out of scope

- Undoing a void in the app (decision 3). A developer-run reinstatement is decision 7.
- Voiding part of a payment, or changing the amount of an approved payment.
- Refunding money to the homeowner (outside the portal).
- Voiding expenses (story 22, R2).
- Month closing (story 24, R2). Under decision 5 a void never writes into a past month; the free closed-period check in Data changes only guards the moment a month closes.

## Open questions

| Question | Who decides |
|---|---|
| **D5 (decision 6):** does the BIR accept "stamp VOID, keep the number"? Blocks go-live, not the build | HOA board, with its accountant |
| Who is the second treasurer-role holder? Without one, a treasurer's own household's mistaken approval can't be voided (decision 4) | HOA board |
| Does the HOA's accountant accept that a void is counted in the month it is made, leaving the receipt's own (possibly closed) month unchanged? (Decision 5; the same rule as REQ-023 decision 3) | Treasurer, with the accountant |
| Should the board see a monthly list of voids? (Recommended, as part of R2 reports) | HOA board |

*Answered:* printed receipts show what was true when issued, with a note on the statement (BA and Sol Arch agree; scenario "A void with a later payment").

## Sol Arch review

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 (`docs/sa-001-architecture` at `e28d9bc`): §3 `voidReceipt`, Flow 1 point 2, §4.4 item 12, R-1, R-11. Also CS-5, 8, 12 and 15, the REQ-012 and REQ-013 reviews, conflict C1 (RELEASE-PLAN), and REQ-023 decision 3 and REQ-024 (r2). Greenfield: no application code. The mock-up has no void.

**Verdict: Supports Option A, with changes.** The C1 rule (a void is a minus line in the month it is made) is sound, and it is the simpler design. Even so, I recommend a closed-month check that costs nothing. A void must **recalculate** the household's allocation rather than subtract the voided lines. There is also no way to undo a mistaken void (decision 3), and that needs an owner decision.

#### Options

| Option | Feasible? | BA's cost | Sol Arch |
|---|---|---|---|
| A: treasurer voids with a reason | Yes | M | **Agree, 2–2.5 days.** |
| B: second-person confirmation | Yes | Moderate plus | Agree. A pending-void status and a queue, and the board can't write in R1. |
| C: developer voids from a script | Yes | Cheap | Agree. The same function. Days of delay. |

I support A. To cover A's "one person alone" downside at no build cost, I recommend **every void also sends an in-app notification to each board member** (REQ-011's notify helper). Owner to decide (required change 2).

#### Answers to the BA's points

1. **Re-allocation after a void.**
   - **How:** `voidReceipt` recalculates the household's allocation from scratch, inside the transaction. It runs `shared/domain/ledger.js` over all of the household's bills and its remaining approved payments, then rewrites only the bills whose `paidCentavos` changed. Voids are rare and the reads are bounded by one lot's history, a few hundred documents at most after many years.
   - **Why not subtract:** subtracting the voided lines would leave October unpaid while November shows paid. That breaks oldest-first, and with it the overdue and aging rules (REQ-018, C4).
   - **Printed receipts:** after the recalculation, OR-00094 may count against October while its printed receipt says November. **Accept that printed receipts show what was true when issued** (I agree with the BA). Add the statement note "Receipts show how a payment was applied on the day it was issued."
2. **`monthlyTotals` in the void's period: confirmed.** In one transaction, `voidPeriod` is taken from the server time in Asia/Manila, and `monthlyTotals/{voidPeriod}.duesCentavos` goes down by the amount. **Challenge to "needs no closed-month check": add it anyway.** The transaction reads `monthlyTotals/{voidPeriod}` already, so the check is free. It covers a void that starts at 23:59:59 on the last day and commits after a close made at midnight, and any later change to the closing rule. If the period is closed, refuse with "Couldn't void. Try again." The retry then lands in the new month. `decidePayment` gets the same check (REQ-012 review).
3. **Self-void: confirmed**, the same as REQ-012. The caller's `members/{hh}_{uid}` must not exist, the caller must not be `submittedBy`, and the caller's `staff/{uid}` role must be `treasurer`, all read inside the transaction (L-004).
4. **The "VOID" PDF: confirmed, as a second file.** A trigger on `receipts/{orNo}` fires when `voided` changes from false to true. It renders the original layout from the snapshot plus the stamp, built from `voidedAt` and `voidReason` only, to `receipts/{orNo}/void.pdf`, and keeps `issued.pdf` (REQ-013 review, change 4). It reuses the same output rule and the same `pdfStatus` handling.
5. **Size: M at its low end, 2–2.5 days.** The recalculation and its tests are about 1 day. The screen, dialog and rules are about 0.5. The concurrency test (two voids at once), the void PDF and the e2e test are about 0.5–1. Not S: the recalculation is new logic, not a reuse of REQ-012.

#### Required changes (BA to apply)

1. **Decision 3, "the board asks the developer in writing to reverse it": there is no way to reverse a void.** A manual database edit is exactly what the Problem rules out. Add an owner decision with two choices:
   - (a) A developer script, `reinstatePayment`, run on the board's written request. It creates a new **pending** payment linked to the voided one (`reinstatedFrom`), reusing its reference number as a recorded exception. That payment then goes through normal approval and gets a **new** receipt number. +0.5 day. **This is my recommendation.**
   - (b) No reversal in R1, and the consequence is written down: the homeowner's money stays unrecorded until a manual process exists.
2. **New owner decision:** send every void as an in-app notification to each board member (recommended, about 0 days), on top of the monthly list in R2.
3. **Notification row:** one per linked member of the household (REQ-011 decision 2), not one per household. Board notifications per change 2.
4. **Reason hint in the dialog:** "The homeowner sees this reason. Don't include other people's names or account numbers." The reason stays on the payment and the receipt. `auditLog` keeps ids only (REQ-006).
5. **Add a scenario: void of an overpayment whose credit was already used.** "Given Juan paid ₱2,000.00 against ₱1,800.00 owed (₱200.00 credit), and December's ₱1,800.00 bill then left ₱1,600.00 due, When the payment is voided, Then his balance reads ₱3,600.00."
6. **Add a scenario: role removed while the receipt is open** (as REQ-012 change 9).
7. **Add a scenario: a void at the month boundary.** "Given November 2026 was closed at 00:00 on Dec 1 while a void dated Nov 30 was being saved, Then the void is refused with 'Couldn't void. Try again.', and when it is retried it counts in December 2026."
8. **Data changes, Reference reservation row:** stays `active`, so no new `paymentRefs` status is needed. `pendingCentavos` is not touched by a void.
9. Mock-up screens 14A–14C still show the pre-C1 wording (RELEASE-PLAN follow-up). Fix them before publishing.

**BA, r7:** answer 1's "rewrites only the bills whose `paidCentavos` changed", and the drift risk about recounting bills' `paidCentavos`, are superseded by Sol Arch's S2 answer in REQ-009 r3: bills carry no paid amount; the void lowers `households.paidCentavos` and recalculates the balance and `openBills` from all bills (TC-14 G-1). The "recalculate, never subtract" principle stands.

**BA, r4: how the changes were applied.** Changes 3–8 are applied in the scenarios, Data changes, UX notes and copy, with the closed-period check and the recalculated allocation from the answers above. Changes 1 and 2 are decisions 7 and 8, still open; they extend, and don't contradict, approved decision 3 ("no undo screen; the board asks the developer in writing"). **Change 9 is not applied here:** the mock-up file is outside this pass, and screens 14A–14C must be corrected before the mock-up is published.

#### Risks not covered

- **One person reverses money on their own.** Mitigated by required change 2, the activity log, and the R2 void list.
- **The accountant on C1 and on D5 "stamp VOID, keep the number":** both unverified. Go-live is gated with REQ-013.
- **Concurrency.** Void and approval on the same household queue up on `households/{hh}`. Two voids queue on the receipt's status. Covered by a CS-8 test.
- **Drift (R-11).** The nightly reconciliation job must also recount bills' `paidCentavos` against a fresh allocation, since voids rewrite them.
- **Cost.** A void of a lot with long history reads a few hundred documents, a few times a year. Negligible.

**Risk checklist** (each item answered):

| Item | Answer |
|---|---|
| Repeat trigger | In-flight flag, plus a status check (`approved` only). A repeat by the same voider returns "already voided" |
| Stale reference | Status re-read in the transaction |
| Deletes | None. Soft status only. The number is kept |
| Field written and never read | `voidPeriod` is read by REQ-023. `voidedByName` is read by the conflict copy (add it to the data) |
| Schema and rules as a pair | No client writes |
| Shared helper | `ledger.js`. Run REQ-009, 012 and 018 suites |
| Copy | The toast states the new balance from the transaction's result |
| Existing data | n/a |
| Identity | OR number |
| Roles | Treasurer only, not their own household |
| Environments | n/a |
| Secrets and PII | Reason hint, ids in logs |
| Network | Reason kept on failure |
| Scale and cost | As above |
| Dependencies | None new |
| Observability | A void notification to the board (change 2) |

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**2–2.25 person-days with Claude Code** (was 2–2.5). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0 · 0.25 · 0.25 · 1 · 0.5–0.75
- **Reuses:** Nothing to port: the mock-up has no void. The void dialog uses `confirmBox()` 989. The voided PDF reuses REQ-013's layout. The recalculation is BE
