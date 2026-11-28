# REQ-012: Approve or reject a payment

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-003 Payments and receipts](../epics/EPIC-003-payments-and-receipts.md) |
| Backlog story | [12 Approve or reject a payment](../backlog/BACKLOG.md#12-approve-or-reject-a-payment) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted (REQ-013 #3 as Sol Arch proposed). Sol Arch reviewed: supports Option A with changes (applied in r3) |
| Mockup | Screens 12A–12H of the payments and announcements mockup (not yet published as an artifact). Repo copy: [req-012-017-mockup.html](../mockups/req-012-017-mockup.html) |
| Architecture | SA-001 §3 (`decidePayment`), §4.2 (`payments`, `receipts`, `paymentRefs`, `counters/or`), §4.3 Flow 1, §4.4 item 2, §8.1, R-2, R-12, R-16; CODING-STANDARDS rules 5, 9, 12. Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-002 (treasurer role), REQ-006 (activity log), REQ-010 (submitted payments), REQ-011 (notifications) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (repeat-check order, one notification per member, `kind` check, `pendingCentavos` and credit, partial-payment, stale-screen, role-removed and deactivated-household scenarios, one-treasurer fallback as decision 7, screenshot access aligned); change 4 not applied, see note · r4, 2026-11-28: owner approval recorded; recommendations accepted · r5, 2026-11-28: Sol Arch's change 4 applied after the owner decided "Sol Arch: at submission": the receipt's "Received from" is copied from the payment, not the household at approval; sale-while-pending scenario added · r6, 2026-11-28: reference reservation aligned to REQ-010: deleted on rejection (not marked "released"), never on void · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Decision 7 was added afterwards from Sol Arch's review and is still open. Questions for the HOA board, the accountant or the Data Protection Officer under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (review screen, one payment at a time, "Approve and next"), B (the mock-up's table with buttons on each row) or C (two-step: treasurer approves, a board member confirms) | **A** |
| 2 | **D4 (board decision): who approves.** Already settled for R1 by REQ-002 decision 3: the treasurer only. What is still open is **cover**: with one treasurer, payments wait whenever they are away, and the epic's target is 2 working days | The board **names a second person with the treasurer role** (for example an assistant treasurer). A process fix, no build cost: roles are set by `setRole` on the board's written request (REQ-002) |
| 3 | A treasurer who is also a homeowner approving **their own household's** payment | **Refuse it.** Another treasurer-role holder approves it. This needs decision 2: with only one treasurer, their own payment waits |
| 4 | The amount on the screenshot or in the collection account differs from what the homeowner typed. Approve the real amount, or reject | **Reject in R1** with "Amount does not match the screenshot"; the homeowner submits again with the right amount. Approving a corrected amount is about +0.5 day; revisit if more than 1 in 10 rejections are for amount |
| 5 | After a rejection, may the homeowner submit **the same reference number** again? REQ-010 reserves each reference number | **Yes.** A rejection frees the reference number (a typo in the amount should not lock the homeowner out). A void (REQ-014) does not |
| 6 | **Privacy after a sale** (REQ-004 decision 5, SA-001 R-16): who can see a payment screenshot | **Only the person who uploaded it, and treasurer-role holders**, under REQ-010 decision 3 option (b). Other household members see the payment's status, amount and receipt, not the screenshot. Admin office staff don't approve in R1, so they get no access (Sol Arch change 8). Repeated here because this screen shows screenshots |
| 7 | *Open, added after approval (Sol Arch change 7).* With only one treasurer, decision 3 means their own household's payments can never be approved | **Open.** Recommended **(a)**: the payment waits for a second treasurer, and the board names one before go-live (this follows from decisions 2 and 3). Alternative (b): self-approval allowed, marked in the activity log and notified in-app to every board member |

## Problem

In the mock-up, "Approve" changes the payment without checking it is still pending (`approvePay`, `index.html` line 1369). A second click, or a second admin, issues a second receipt number for the same money (SA-001 R-2). The approval table is 7 columns wide, so it scrolls sideways on the treasurer's phone. A rejection reason is lost if the dialog is clicked outside.

The treasurer is a volunteer who approves in bursts at the start and end of the month (PERSONAS). The portal cannot confirm money arrived: there is no bank or e-wallet link (SA-001 §5). The treasurer still opens the collection account and matches the reference number. This screen's job is to make that matching quick and make a wrong double approval impossible.

## Options

### Option A: Review screen, one payment at a time (recommended)

- **How it works:** Approvals → Payments lists pending payments, oldest first, as cards on a phone and rows on a laptop. Opening one shows the screenshot beside the amount, reference number, lot and the household's balance. The treasurer presses "Approve" or "Reject", and the next pending payment opens. Lives under Approvals in the treasurer's menu (REQ-002).
- **Cost:** moderate (story size L, mostly the `decidePayment` function, counter and tests, which every option needs).
- **Excludes:** admin office staff and board members (REQ-002 decision 3).
- **Honest downside:** one more screen than the mock-up's table; approving 30 payments is 30 opens, not 30 clicks on one page (each still needs the account checked).

### Option B: The mock-up's table, with buttons on each row

- **How it works:** one table, Approve and Reject on every row, the screenshot in a pop-up.
- **Cost:** moderate, slightly less front-end work.
- **Honest downside:** a wide table on a phone (review finding 2); Approve sits next to the screenshot button on every row, which invites approving without looking.

### Option C: Two-step approval (treasurer, then a board member)

- **How it works:** the treasurer marks a payment "Checked", a board member presses "Confirm", and only then is the receipt issued.
- **Cost:** project-sized change to roles and status (another status, another queue, another notification).
- **Honest downside:** doubles the wait for every homeowner. REQ-002 already decided treasurer-only for R1; the activity log (REQ-006) and voids (REQ-014) catch mistakes after the fact.

### Recommendation

**Option A.** The expensive part (one transaction that checks the status, takes the next receipt number and updates the balance) is the same in every option. A one-at-a-time screen keeps the screenshot in front of the treasurer when they press Approve, and works on a phone.

## Story

As a treasurer, I want to check each submitted payment against the collection account, then approve or reject it, so that the books only count money that actually arrived.

## Acceptance criteria (Option A)

```gherkin
Feature: Payment approval

  Background:
    Given Carlo Reyes of Blk 2 Lot 7 submitted ₱1,800.00 with reference "4012883219554" on Nov 27, 2026
    And his balance is ₱1,800.00
    And the last receipt issued is OR-00092

  Scenario: The treasurer sees what is waiting
    Given 3 payments are pending approval
    When the treasurer opens Approvals
    Then the menu badge reads "3"
    And the payments are listed oldest first, each with the lot, amount, reference number and date submitted

  Scenario: Approve a payment
    When the treasurer opens Carlo's payment, views the screenshot and presses "Approve"
    Then the button reads "Approving…" and is disabled until the save finishes
    And they see "Approved. Receipt OR-00093 issued to Blk 2 Lot 7."
    And the next pending payment opens
    And Carlo's payment history shows ₱1,800.00 "Approved" with OR-00093
    And Carlo's balance reads ₱0.00
    And the bell of every member linked to Blk 2 Lot 7 shows "Payment approved: ₱1,800.00, OR-00093"
    And the activity log records who approved it, the receipt number and when

  Scenario: A partial payment is applied to the oldest bill
    Given Roberto of Blk 6 Lot 4 owes October and November 2026 at ₱1,800.00 each
    And he submitted ₱1,000.00
    When the treasurer approves it as OR-00093
    Then his receipt shows "Association dues · October 2026  ₱1,000.00"
    And his balance reads ₱2,600.00
    And his statement shows October 2026 with ₱800.00 still owing

  Scenario: The lot is sold while the payment is pending
    Given the owner on file for Blk 2 Lot 7 was "Ana Reyes" when Carlo submitted his payment
    And the office changed it to "Ben Cruz" before approval
    When the treasurer approves the payment as OR-00093
    Then the receipt OR-00093 shows "Received from: Ana Reyes · Blk 2 Lot 7"

  Scenario: The same treasurer acts on a stale screen
    Given Liza approved Carlo's payment as OR-00093 on her laptop
    When she presses "Reject" on her phone, which still shows it pending
    Then she sees "You already approved this payment as OR-00093. Nothing was changed."

  Scenario: Pressing Approve twice issues one receipt
    When the treasurer presses "Approve" twice quickly
    Then exactly one receipt number, OR-00093, is issued

  Scenario: Two treasurers approve the same payment at once
    Given two people with the treasurer role have Carlo's payment open
    When both press "Approve"
    Then exactly one receipt number is issued
    And the second sees "This payment was already approved by Liza Santos. Nothing was changed."

  Scenario: A payment rejected by someone else while it was open
    Given Liza rejected Carlo's payment after Mark opened it
    When Mark presses "Approve"
    Then he sees "This payment was rejected by Liza Santos while you had it open. Nothing was changed."
    And no receipt number is issued

  Scenario: Receipt numbers have no gaps
    Given 200 payments are approved by two treasurers over a month, some at the same moment
    Then the receipt numbers run from OR-00093 to OR-00292 with none skipped or repeated

  Scenario: A dropped connection does not issue a second receipt
    Given the treasurer pressed "Approve" and the connection dropped before the answer came back
    When they press "Approve" again
    Then they see "Approved. Receipt OR-00093 issued to Blk 2 Lot 7."
    And no second receipt number is issued

  Scenario: Rejecting needs a reason
    When the treasurer presses "Reject" on Carlo's payment
    Then "Reject payment" stays disabled until a reason is picked or typed
    When they pick "Amount does not match the screenshot" and press "Reject payment"
    Then Carlo's payment history shows "Rejected: Amount does not match the screenshot"
    And his balance still reads ₱1,800.00
    And the bell of every member linked to Blk 2 Lot 7 shows "Payment not approved: ₱1,800.00. Reason: Amount does not match the screenshot. Please submit it again."
    And Carlo's "awaiting approval" amount goes down by ₱1,800.00
    And no receipt number is used

  Scenario: Other reason, typed
    When the treasurer picks "Other" and leaves the box empty
    Then "Reject payment" stays disabled
    When they type "Paid to the old GCash number"
    Then "Reject payment" is enabled

  Scenario: A typed rejection reason is not lost
    Given the treasurer has typed a rejection reason
    When they click outside the dialog or press Escape
    Then the dialog stays open with the reason still typed
    And it closes only with "Cancel" or "Reject payment"

  Scenario: A rejected reference number can be submitted again
    Given Carlo's payment with reference "4012883219554" was rejected, which removed its reference reservation
    When Carlo submits ₱1,500.00 with reference "4012883219554"
    Then it is accepted as a new pending payment

  Scenario: The treasurer can't approve their own household's payment
    Given the treasurer Liza Santos is also a member of Blk 9 Lot 3
    When she opens a pending payment from Blk 9 Lot 3
    Then "Approve" and "Reject" are not shown
    And she sees "This is your own household's payment. Another treasurer must decide it."
    And if her browser sends the approval anyway, the server refuses it

  Scenario: The treasurer's own household's payment waits too long (decision 7)
    Given a payment from Blk 9 Lot 3, Liza's own household, has been pending for more than 2 working days
    When any treasurer opens Approvals
    Then that payment is marked "Needs another treasurer" in the list

  Scenario: The treasurer role is removed while a payment is open
    Given Mark's treasurer role was removed while he had Carlo's payment open
    When he presses "Approve"
    Then it is refused, nothing changes and no receipt number is issued

  Scenario: A payment from a deactivated household
    Given Blk 2 Lot 7 was deactivated after Carlo submitted his payment
    When the treasurer approves it
    Then it is approved as usual and a receipt number is issued, because the money arrived

  Scenario: Only dues payments in R1
    Given a payment record whose kind is not dues
    When the treasurer's browser asks the server to approve it
    Then it is refused and nothing changes

  Scenario: Admin office staff can't approve payments
    Given Paolo has the admin role
    Then his menu has no payment approvals
    And if his browser asks the server to approve a payment, it is refused and nothing changes

  Scenario: Nothing waiting
    Given no payments are pending
    When the treasurer opens Approvals
    Then they see "All payments are reviewed. New ones appear here as homeowners submit them."

  Scenario: The list is loading
    When the treasurer opens Approvals on a slow connection
    Then placeholder rows show until the list arrives, never a blank page

  Scenario: The screenshot won't load
    Given Carlo's screenshot can't be loaded
    When the treasurer opens his payment
    Then the screenshot area reads "Couldn't load the screenshot. Try again."
    And "Approve" and "Reject" still work, because the collection account is the proof

  Scenario: The save fails
    Given the connection is lost
    When the treasurer presses "Approve"
    Then they see "Couldn't save. Nothing was approved. Check your connection and try again."
    And the payment is still pending
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Payment decision: status (`approved` / `rejected`), `orNo`, `decidedBy`, `decidedByName` (copied at the decision, for the conflict message), `decidedAt`, `reason` | `payments/{id}` | Changed only from `pending`; refused if the payment changed since the screen loaded (`seenUpdatedAt`); refused if the caller does not hold the treasurer role (claim **and** `staff/{uid}`, read in the transaction), is a member of the payment's household, or is its submitter; refused if `kind` isn't `dues` (R1, REQ-010 decision 6). A payment from a deactivated household (REQ-003) is still decided as usual | `decidePayment` | Treasurer; the household (status, amount, receipt, reason) |
| Receipt record: number, payment, household, amount, payment date, issue date, received-from name, lines applied (snapshot), balance after (snapshot), approved by | `receipts/{orNo}` | Created in the same transaction as the approval; never edited except by a void (REQ-014). The snapshot is what REQ-013 prints. Received-from name: copied from the payment's `paymentPrivate.receivedFromName`, which `submitPayment` took from the owner on file **at submission** (REQ-013 decision 6, REQ-010), never from the household at approval | `decidePayment` | REQ-013 (staff and functions only) |
| Receipt counter and series | `counters/or` (`prefix`, `next`, `width`, optional `rangeEnd`, REQ-013 decision 3) | Next number taken inside the approval transaction; never decremented; refused past `rangeEnd` | `decidePayment`; series set once by a developer script | Same |
| Reference number reservation | `paymentRefs/{normalisedRef}` `{paymentId, householdId}`, no status (REQ-010) | **Freed on rejection** (decision 5, matching REQ-010 decision 2): the record is **deleted** in the same transaction, only if it still points at this payment. Kept unchanged on approval and **never deleted on void** (REQ-014) | `decidePayment` | `submitPayment` (REQ-010) |
| Bills | each open bill's `paidCentavos` (REQ-009) | The household's bills with an amount owing are read oldest first in the transaction; `allocate(amount, openBills)` from `shared/domain/ledger.js` sets what each changed bill has paid | `decidePayment` | REQ-009, REQ-015 |
| Household totals | `households/{id}` `paidCentavos`, `balanceCentavos`, `pendingCentavos`, `openBills` (REQ-015) | Updated in the approval transaction using the shared oldest-bill-first rule. `pendingCentavos` goes down by the amount on approve **and** on reject. **Credit** is a negative `balanceCentavos`, shown as "₱0.00" plus "₱x credit" (REQ-013 decision 4). Overdue figures are worked out when read (C4), not stored | `decidePayment` | REQ-009, REQ-015 |
| Monthly totals | `monthlyTotals/{period}` (approval date, Asia/Manila) | Dues collected. Refused with "Try again" if the period is closed (no build cost: the document is read anyway) | `decidePayment` | R2 reports |
| Notification | `notifications` (REQ-011) | **One per linked member** of the payment's household (REQ-011 decision 2), written in the same transaction | `decidePayment` | Homeowner bell |
| Payment screenshot | Storage (REQ-010 owns the rule) | Readable only by the person who uploaded it and treasurer-role holders (decision 6) | `submitPayment` | Treasurer review screen |
| Activity log | `auditLog` (REQ-006) | `payment.approved` / `payment.rejected`, ids and receipt number only, no names; the rejection reason stays on the payment, never in the log | `decidePayment` | Board, treasurer |

The function checks in this order, so a retry after a dropped connection works: (1) the caller holds the treasurer role and is neither a member of the household nor the submitter, otherwise refuse; (2) the payment already carries this caller's same decision: return the existing result (for an approval, the original `orNo`) and write nothing; (3) the status isn't `pending`: return a conflict with the status and `decidedByName`; (4) `updatedAt` differs from `seenUpdatedAt`: refuse as "changed since you opened it"; (5) decide. Money in centavos throughout.

## UX/UI notes

- **Accessibility:** the screenshot has alt text "Payment screenshot from {lot}, submitted {date}" and opens full size with a keyboard; Approve and Reject are real buttons at least 44 px tall; the reject reason uses a labelled radio group plus a labelled text box; "Approving…" is announced; the decision toast is a live region; focus moves into the reject dialog and returns to the payment when it closes.
- **Consistency:** glossary terms only: payment, pending approval, approved, rejected, reference number, proof of payment (on screen "screenshot"), official receipt. Reuses the mock-up's `.modal`, `.pill`, `.kv` and toast; the same reject dialog shape later serves bookings and vehicles.
- **Mobile-first:** cards at 375 px (lot, amount, reference number, date, one "Review" button); the review screen stacks the screenshot above the details; Approve and Reject sit at the bottom within thumb reach. Desktop shows the screenshot and details side by side.
- **States:** empty ("All payments are reviewed…"), loading (placeholder rows), error (screenshot can't load; save failed), success (toast naming the receipt number and lot), conflict (already decided by someone else, with their name).
- **Forms:** the reject dialog never closes on a backdrop click or Escape once anything is picked or typed; "Other" reason up to 200 characters, with a counter and the hint "The homeowner sees this. Don't include other people's names or account numbers."; a reason being typed is kept in `sessionStorage` so switching to the collection-account app and back doesn't lose it. The review route carries the payment id (`#/approvals/payments/{id}`), so a reload reopens the same payment.
- **Safe actions:** Approve and Reject each show an in-flight label and are disabled until the server answers; the server refuses anything not pending (two guards, CODING-STANDARDS rule 5). Approve is not confirmed by a second dialog: it is reversible by a void (REQ-014) and a confirm on every approval would slow batch work. Reject is confirmed by its reason dialog.
- **Stable layout:** the screenshot area keeps its height while loading; the "your own household" note replaces the buttons in the same space.
- **Roles:** treasurer only (REQ-002 decision 3). Hidden for admin and board, **and** refused by `decidePayment` and by rules on `payments`. Self-approval refused by the function (decision 3), which also re-reads the role in the transaction, so a role removed while the screen is open is refused. Screenshots: uploader and treasurer-role holders only (decision 6).
- **Copy honesty:** "Approved" means the treasurer matched it, never "paid" by the portal's own knowledge (SA-001 R-12). The toast says "Receipt OR-00093 issued", not "Receipt sent".

## Copy of record

| Where | Text |
|---|---|
| Menu | Approvals (badge: number pending) |
| Page heading | Payments to approve · Check each reference number in the collection account before you approve. |
| Card | {lot} · {amount} · Ref {reference number} · Submitted {date} · Review |
| Review details | Lot · Submitted by · Amount · Reference number · Date paid · Balance before this payment |
| Buttons | Approve · Reject · (in flight) Approving… · Rejecting… |
| Approve toast | Approved. Receipt {OR no.} issued to {lot}. |
| Reject dialog | Reject this payment? · Reason the homeowner will see · Reference number not found in the collection account · Amount does not match the screenshot · Screenshot is unreadable · Other · The homeowner sees this. Don't include other people's names or account numbers. · Cancel · Reject payment |
| Reject toast | Payment rejected. {lot} has been notified in the portal. |
| Homeowner history | Rejected: {reason} |
| Notifications | Payment approved: {amount}, {OR no.} · Payment not approved: {amount}. Reason: {reason}. Please submit it again. |
| Conflict | This payment was already approved by {name}. Nothing was changed. · This payment was rejected by {name} while you had it open. Nothing was changed. · You already approved this payment as {OR no.}. Nothing was changed. |
| Own household | This is your own household's payment. Another treasurer must decide it. · (queue marker) Needs another treasurer |
| Empty | All payments are reviewed. New ones appear here as homeowners submit them. |
| Errors | Couldn't load the screenshot. Try again. · Couldn't save. Nothing was approved. Check your connection and try again. |

"Has been notified in the portal" is true because the notification is written in the same transaction. It does not claim the homeowner read it.

## Out of scope

- Approving a corrected amount (decision 4), partial approvals, splitting one payment across households.
- Two-step approval (Option C).
- Cash or cheque payments recorded by the office (EPIC-003 open question).
- Automatic matching against a bank or e-wallet statement.
- Email for decisions: story 19 (R2). R1 is the bell only.
- Approving several payments with one press. Each payment needs its own account check.

## Open questions

| Question | Who decides |
|---|---|
| Decision 7 (one-treasurer fallback), added after approval | Owner |
| Who is the second treasurer-role holder (decision 2)? Needed before go-live under decision 7 (a) | HOA board |
| Who is the HOA's Data Protection Officer, to confirm decision 6? | HOA board |
| How long are payment screenshots kept after approval? (SA-001 Q10) | HOA board, with the Data Protection Officer |
| The receipt series' prefix and first number, for the developer script (REQ-013 decision 3): the last number of any paper booklet | Treasurer, in writing |

*Answered:* switching to the collection-account app on the same phone is handled; the route carries the payment id and a typed reason is kept (Sol Arch).

## Sol Arch review

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 (`docs/sa-001-architecture` at `e28d9bc`): §3, §4.2, Flow 1, §4.4 item 2, §8.1, §8.2, R-2, R-11, R-16. Also CODING-STANDARDS (CS) 4, 5, 8, 9, 12, 14, LEARNINGS L-002 and L-004, and the S2 drafts REQ-006, 009, 010 and 011. Those S2 drafts are being reviewed in parallel and are not settled input. The app has no code yet. The only code read is the mock-up's `approvePay` (`index.html` line 1369).

**Verdict: Supports Option A, with changes.** The whole decision fits in one Firestore transaction. My changes are:
- the order of the repeat and conflict checks, so a retry after a dropped connection works
- one notification per linked person, as REQ-011 says
- the "Received from" name captured when the payment is submitted
- a partial-payment scenario
- a `kind` check
- a fallback for when only one treasurer exists, which decision 3 currently assumes away

#### Options

| Option | Feasible? | BA's cost | Sol Arch |
|---|---|---|---|
| A: review one at a time | Yes | Moderate (L) | **Agree.** The back end is the same for A and B. A is only a better screen. |
| B: table with row buttons | Yes | Moderate | Agree it is feasible. Not preferred, for the BA's UX reasons. |
| C: two-step approval | Yes | Project | **Agree: a project.** It needs a `checked` status, a second queue, a write permission for the board (read-only under REQ-002), and a "different second person" check in `decidePayment`. Not supported for R1. |

#### Answers to the BA's points

1. **Self-approval: confirmed.** `members/{householdId}_{callerUid}` has a fixed id, so `decidePayment` reads it with `tx.get()` inside the transaction and refuses if it exists. It also refuses when `payment.submittedBy == callerUid`. That covers a treasurer who submitted a payment and was then removed from the lot. It reads `staff/{callerUid}` in the same transaction and requires the role `treasurer` (L-004), so a role removed while the screen is open is refused.
2. **Freeing the reference on rejection: confirmed**, in the same transaction. `paymentRefs/{ref}` gets `status: 'released'` and `releasedAt`. `submitPayment` treats `released` as free and overwrites the document with the new payment id and `status: 'active'` inside its own transaction. If two people resubmit a freed number at the same moment, exactly one succeeds. Approved and voided payments keep `active`. The S2 review of REQ-010 owns the field names.
3. **A repeat by the same decider: confirmed, but only if the checks run in this order.** The first approval changes `updatedAt`, so a `seenUpdatedAt` check placed first would refuse the retry as a conflict:
   1. The caller holds the treasurer role (claim and `staff` document), is not a member of the household and is not the submitter. Otherwise, refuse.
   2. The status is `approved`, `decidedBy` is the caller and the request is "approve": return the existing `orNo` and write nothing. The same applies to a repeated reject.
   3. The status is anything other than `pending`: return a conflict, with the status and `decidedByName`.
   4. `updatedAt` is not equal to `seenUpdatedAt`: refuse with "changed since you opened it".
   5. Otherwise, decide.

   `decidedByName` is copied at the time of the decision, because REQ-006 decision 4 shows staff by name. This order is what makes "A dropped connection does not issue a second receipt" pass.
4. **Allocation inside the transaction: feasible, if bills carry a server-kept `paidCentavos`.** That is REQ-009's open question. I recommend it, and the S2 reviewer is to confirm. The transaction:
   - queries the household's bills that still have an amount owing, oldest first (server transactions allow queries)
   - runs the pure `allocate(amount, openBills)` from `shared/domain/ledger.js`
   - writes each changed bill's `paidCentavos`
   - writes the receipt's `lines[]` and `balanceAfterCentavos` snapshot

   Anything paid beyond the open bills becomes credit, shown as the line "Advance payment (credit)". The billing run (REQ-008) must apply the credit to the next bill, which is an S2 dependency. Without per-bill paid amounts, every approval would have to read all of the household's bills and payments. That works, but the cost grows with the lot's history, so I don't recommend it.
5. **Size: L confirmed, at the upper half: 5–6 days.**

   | Part | Days |
   |---|---|
   | `decidePayment` with `allocate` and unit tests | 2 |
   | List, review screen and reject dialog | 1.5 |
   | Rules matrix, plus concurrency tests (200 approvals from 2 callers; 10 parallel calls on one payment; a negative control, CS-8) | 1 |
   | Notifications and activity log wiring | 0.5 |
   | Playwright journey | 0.5–1 |

**Open question, switching apps on the same phone: yes, it can survive.** The route carries the payment id (`#/approvals/payments/{id}`). A phone browser may unload a tab left in the background, and a reload reopens the same payment. A reject reason being typed is kept in `sessionStorage` until "Cancel" or "Reject payment".

#### What the transaction reads and writes (for Dev)

| | Documents |
|---|---|
| Reads | `payments/{id}`, `staff/{uid}`, `members/{hh}_{uid}`, `households/{hh}`, `counters/or`, the open bills (query), `monthlyTotals/{period}`, `paymentRefs/{ref}`, the household's `members` (who to notify), `config/settings` |
| Writes | Payment; `receipts/{orNo}`; `counters/or`; household (`paidCentavos`, `balanceCentavos`, `pendingCentavos` minus the amount, credit); changed bills; `monthlyTotals/{period}.duesCentavos`; `paymentRefs` (on reject); one notification per linked member; `auditLog` |

That is about 15–25 operations, far below Firestore's limit of 500 writes per transaction. The period is the approval date in Asia/Manila (REQ-023 decision 2). **Also refuse, with "Try again", if `monthlyTotals/{period}.closed` is true.** That document is read anyway, so the check is free, and it closes the race between an approval at 23:59 on the last day and a month closed at 00:00 (see the REQ-014 review). The counter is one document, which is fine at human pace (SA-001 Flow 1, point 1). It also holds the series settings (REQ-013 review, change 1).

#### Required changes (BA to apply)

1. **Data changes, Notification row:** "One per decision, to the payment's household" becomes **one per linked member of the household**, per REQ-011 decision 2.
2. **Add the `kind` check:** `decidePayment` refuses any payment whose `kind` isn't `dues` in R1 (C2, REQ-010 decision 6).
3. **Add to Household totals:** `pendingCentavos` goes down on approve **and** on reject (REQ-010 writes it, REQ-015 decision 2 reads it), and credit is recorded. Define credit once: I recommend letting `balanceCentavos` go below zero, with the screen showing "credit".
4. **"Received from" (REQ-013 decision 6):** taking the owner's name at the moment of approval goes wrong if the lot is sold while the payment is pending. The receipt would then name the new owner for the old owner's money. Instead, copy `households.displayName` into the payment at **submission** (`submitPayment`, REQ-010) and print that copy. Raise it in REQ-013 decision 6 and with the S2 review of REQ-010.
5. **Add a partial-payment scenario.** Roberto owes October and November at ₱1,800.00 each and pays ₱1,000.00. His receipt shows "Association dues · October 2026 ₱1,000.00", his balance reads ₱2,600.00, and October shows ₱800.00 still owing.
6. **Add a scenario for a stale screen held by the same person.** "Given Liza approved Carlo's payment as OR-00093 on her laptop, When she presses Reject on her phone, which still shows it pending, Then she sees 'You already approved this payment as OR-00093. Nothing was changed.'"
7. **Decision 3 needs a fallback, because decision 2 may not happen.** With one treasurer, that treasurer's own household's payments can never be approved. They would show as overdue and, from R2, trigger notices against the treasurer. Add an owner decision with two choices:
   - (a) Payments wait for a second treasurer. **This is my recommendation**, and with it the second treasurer must be named before go-live.
   - (b) Self-approval is allowed, but marked in the activity log, with an in-app notification to every board member.

   Add a scenario: a pending payment from the treasurer's own household that is older than 2 working days shows "Needs another treasurer" in the queue.
8. **Who sees screenshots: the drafts disagree.** Decision 6 here says the uploader and the treasurer. REQ-010's data table says the uploader and staff. SA-001 §4.2 says the household, admin and treasurer. I recommend **the uploader and treasurer-role holders only**, because the admin office doesn't approve in R1 and so needs no access. REQ-010 owns the Storage rule. All three documents must say the same thing.
9. **Add a scenario for a role removed while a payment is open.** "Given Mark's treasurer role was removed while Carlo's payment was open, When he presses Approve, Then it is refused and nothing changes" (REQ-002 decision 1, L-004).
10. **Gap for the BA:** is a pending payment approved after its household was deactivated (REQ-003)? I recommend yes, because the money arrived. Say so in a scenario or under Out of scope.

**BA, r3 and r5: how the changes were applied.** All ten changes are applied in the scenarios, Data changes, UX notes and copy. Change 4 follows the owner's decision "Sol Arch: at submission" (REQ-013 decision 6). Change 7 is decision 7, still open. Change 8 is now matched in REQ-010 (r6). Answer 2's `released` status is superseded by Sol Arch's S2 review of REQ-010: the reservation is deleted on rejection, never on void (r6).

#### Risks not covered

- **Gap-free numbering outside the transaction.**
  - Rules deny every client write to `receipts` and `counters`, and no function ever deletes a receipt.
  - The developer's console access can still create a gap. Keep production owner access minimal (ADR-005), and have the nightly reconciliation job (R-11) check that receipts run from the first number to `next − 1` with none missing.
  - **A restore from backup** goes to a new database (SA-001 §7) and can wind the counter back behind receipts already issued and printed. The restore runbook must set `counters/or.next` above the highest number found in Storage and the activity log.
- **Concurrency.** Approvals and voids on the same household queue up on the `households` document. That is correct and costs a short wait. The server library retries a contended transaction.
- **Privacy.** The "Other" reason is free text that the homeowner sees. Add the hint "The homeowner sees this. Don't include other people's names or account numbers." The reason lives on the payment, never in `auditLog` (REQ-006). How long screenshots are kept is still SA-001 Q10, for the DPO.
- **Reference collisions.** References are normalised into one shared index, so two different e-wallets issuing the same number would wrongly refuse the second. That is unlikely. The refusal message already tells the homeowner to check, and the office can reject and free the number.
- **Observability.** Add alerts for: any pending payment older than 3 working days (the epic's target is 2), the `decidePayment` error rate, and reconciliation mismatches.
- **Cost.** About 20 writes per approval × 700 a month is about 14,000 writes a month. Negligible.
- **SonarQube.** Write `decidePayment` as small named steps (`assertCanDecide`, `resolveRepeat`, `allocate`, `buildReceipt`, `applyTotals`) to stay at or under 15 cognitive complexity per function. `allocate` is pure, in `shared/domain`, so it counts towards coverage.

**Risk checklist** (each item answered):

| Item | Answer |
|---|---|
| Repeat trigger | In-flight flag, plus the ordered checks above |
| Stale reference | `seenUpdatedAt`. The household and bills are re-read in the transaction |
| Deletes | None |
| Field written and never read | `decidedByName` is read by the conflict copy. `pendingCentavos` is read by REQ-015 |
| Schema and rules as a pair | `payments`, `receipts`, `counters` and `paymentRefs` get no client writes, deployed before the screen |
| Shared helper | `ledger.js` is shared with REQ-009, 014 and 018. Run every suite |
| Copy | "Issued", not "sent". "Notified in the portal" is true, because the notification is written in the same transaction |
| Existing data | The opening-balance import (R-8) must create bills the allocation can read |
| Identity | The OR number is the document id |
| Roles | Treasurer only, in the function and in rules |
| Environments | Separate counters per project |
| Secrets and PII | Ids only in logs |
| Network | Covered by the repeat checks |
| Scale and cost | As above |
| Dependencies | None new |
| Observability | As above |

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**4.5–5.5 person-days with Claude Code** (was 5–6). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0.5 · 0.5 · 0 · 2.75–3.25 · 0.75–1.25
- **Reuses:** Port: `aAppr()` 737, payments tab 741–745, the `reject` dialog with preset reasons 1374–1375, `proof` viewer 1368. Extend: phone cards, review one payment, conflicts, own household (`req-012-017-mockup.html` 568–574). BE: `decidePayment`, OR counter, totals
