# REQ-022: Record an expense

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-006 Accounting and fund](../epics/EPIC-006-accounting-and-fund.md) |
| Backlog story | [22 Record an expense](../backlog/BACKLOG.md#22-record-an-expense) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 22A–22E of the R2 collect-and-account mockup. Repo copy: [req-018-027-mockup.html](../mockups/req-018-027-mockup.html). Not yet published as an artifact (main session to publish and put the link here) |
| Architecture | SA-001 §3 (expenses: admin-only client write plus a trigger for monthly totals), §4.2 (`monthlyTotals/{period}.expensesCentavos`, Storage `expenses/{expenseId}.jpg`), §4.4 item 12 (soft delete, closed months refuse edits), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-002 (roles), REQ-006 (activity log). REQ-024 adds the closed-month rule |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft. r2, 2026-11-28: reconciled with SA-001 (conflict C5): callable-function saves kept as the BA recommendation; the divergence from SA-001 §3 (client write plus trigger) and the role divergence are recorded under Sol Arch review to confirm or reject |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation; the owner decides.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (expense form with receipt photo, void with reason), B (monthly expense totals by category only) or C (keep expenses in the HOA's spreadsheet; type the month's total into the fund summary) | **A** |
| 2 | **Receipt photo** required? | **Required, unless "No receipt" is ticked with a reason** (for example "Petty cash, no OR issued"). The mock-up makes it optional; the board and auditors will ask for it |
| 3 | **Correcting a saved expense** | **Edit is allowed while the month is open, and every change is in the activity log with before and after.** Void is for an expense that shouldn't exist at all. Void-and-re-enter for a vendor typo is clumsy |
| 4 | Who records expenses | **Treasurer only.** Board members can read expenses and receipts. Admin office can't see them |
| 5 | Warn about a likely duplicate (same amount, vendor and date) | **Yes, warn and allow "Save anyway".** The backlog's own void example is "Entered twice" |
| 6 | A second person approves expenses (EPIC-006 open question) | **Not in R2.** The activity log plus the board's monthly review covers it for now; a two-step approval is a separate story if the board asks |

## Problem

The fund balance is only as good as the expenses behind it. The mock-up's Accounting, Expenses tab (`aAcct()`, line 765) records date, category, vendor, description, amount and an optional receipt, but **Delete** removes the record for good (`delExpense`, line 1407) and the fund summary silently changes. Money records need a trail ([Board member](../product/PERSONAS.md#board-member): "figures that don't agree with each other").

Who has the problem: the [Treasurer](../product/PERSONAS.md#treasurer), several times a month, often from a phone with a paper receipt in hand.

## Options

### Option A: Expense form with a receipt photo; void with a reason (recommended)

- **How it works:** Accounting → Expenses → "Record an expense". Date, category, vendor, description, amount and a receipt photo taken with the phone camera. Saved expenses list by month with a total. A mistake is edited (open months) or voided with a reason; voided expenses stay visible, crossed out, and are left out of every total.
- **Cost:** moderate (backlog M). Form, upload, list, void, edit with audit, and the monthly total kept in step.
- **Excludes:** nothing by device; built for a phone.
- **Honest downside:** someone has to photograph every receipt.

### Option B: Monthly totals by category only

- **How it works:** at month end the treasurer types one figure per category.
- **Cost:** cheap.
- **Honest downside:** no vendor, no receipt, nothing the board can check; the expense side of the fund becomes a typed number.

### Option C: Keep expenses outside the portal

- **How it works:** the HOA keeps its expense spreadsheet; the portal's fund summary takes one typed monthly expense figure.
- **Cost:** cheap.
- **Honest downside:** two places for the books, and the fund summary (REQ-024) can't show where the money went.

### Recommendation

**Option A.** The receipt photo and the void trail are what make the fund summary believable to the board.

## Story

As a treasurer, I want to record each expense with its date, category, vendor, amount and a photo of the receipt, so that the fund balance shows what was actually spent.

## Acceptance criteria (Option A)

```gherkin
Feature: Expenses

  Background:
    Given the treasurer is signed in
    And the categories are Security, Utilities, Garbage collection, Landscaping, Repairs & maintenance, Admin & payroll, Events, Others

  Scenario: Record an expense
    Given September 2026 is open
    When the treasurer enters Sep 18, 2026, "Repairs & maintenance", vendor "AquaFix Pool Services", description "Pool pump repair", amount 7500, attaches a receipt photo
    Then the save button reads "Save ₱7,500.00 expense"
    When they press it
    Then the button reads "Saving…" and is disabled until the save finishes
    And they see "Expense saved."
    And it appears under Expenses for September 2026
    And the September 2026 expenses total goes up by ₱7,500.00
    And the activity log records who saved it and when

  Scenario: Take the receipt photo on a phone
    Given the treasurer is on a phone
    When they press "Add receipt photo"
    Then they can take a photo with the camera or choose one from the phone
    And a 9 MB photo is resized on the phone before upload and the expense is saved

  Scenario: No receipt (decision 2)
    When the treasurer ticks "No receipt" and enters "Petty cash, vendor issued no OR"
    Then the expense saves without a photo
    And the list shows "No receipt: Petty cash, vendor issued no OR"

  Scenario: A receipt is required unless "No receipt" is ticked
    When the treasurer saves without a photo and without ticking "No receipt"
    Then "Add a photo of the receipt, or tick No receipt and say why" shows under Receipt
    And the other fields keep what was typed

  Scenario: A required field is missing
    When the treasurer saves without a vendor
    Then "Enter who was paid" shows under Vendor
    And the other fields keep what was typed
    And nothing is saved

  Scenario: An amount that isn't valid
    When the treasurer enters 0, -50 or 12.345 as the amount and leaves the field
    Then "Enter an amount above ₱0.00, with up to 2 decimal places" shows under Amount

  Scenario: A date in the future
    When the treasurer enters a date after today
    Then "The date can't be after today" shows under Date

  Scenario: A likely duplicate (decision 5)
    Given an expense of ₱7,500.00 to "AquaFix Pool Services" dated Sep 18, 2026 exists
    When the treasurer saves another with the same amount, vendor and date
    Then they see "An expense of ₱7,500.00 to AquaFix Pool Services on Sep 18, 2026 is already recorded. Save this one too?"
    And nothing is saved until they press "Save anyway"

  Scenario: Pressing Save twice saves once
    When the treasurer presses "Save ₱7,500.00 expense" twice quickly
    Then exactly one expense is saved

  Scenario: Edit an expense in an open month (decision 3)
    Given the AquaFix expense was saved with the amount ₱7,500.00
    When the treasurer edits the amount to ₱7,050.00 and saves
    Then the list shows ₱7,050.00
    And the September 2026 expenses total goes down by ₱450.00
    And the activity log records "Amount ₱7,500.00 → ₱7,050.00", who changed it and when

  Scenario: Void instead of delete
    When the treasurer presses "Void" on the AquaFix expense, enters "Entered twice" and confirms
    Then it shows crossed out as "Void" with the reason "Entered twice"
    And it is left out of the September 2026 total and the fund summary
    And the activity log records who voided it

  Scenario: Voiding needs a reason
    When the treasurer confirms "Void" with no reason
    Then "Say why you're voiding this expense" shows under Reason
    And the expense is not voided

  Scenario: There is no delete
    Then no expense shows a "Delete" button
    And the treasurer's device's request to delete an expense is refused

  Scenario: A closed month can't be changed (with REQ-024)
    Given October 2026 is closed
    When the treasurer saves, edits or voids an expense dated in October 2026
    Then they see "October 2026 is closed. Date this in an open month, or reopen October first."
    And nothing is saved

  Scenario: Upload fails
    Given the network drops while the receipt is uploading
    Then the treasurer sees "The receipt didn't upload. Check your connection and try again."
    And the form keeps everything typed and the chosen photo
    And no expense is saved without its receipt

  Scenario: An empty month
    Given no expenses are recorded for December 2026
    Then the Expenses tab reads "No expenses recorded for December 2026."

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then each expense shows as a card with date, vendor, category and amount
    And the month total stays visible above the list
    And the page does not scroll sideways

  Scenario: A board member can read but not change
    Given a board member is signed in
    When they open Accounting, Expenses
    Then they see the expenses and can open the receipt photos
    And no "Record an expense", "Edit" or "Void" buttons are shown
    And their device's request to save an expense is refused

  Scenario: Admin office and homeowners can't see expenses (decision 4)
    Given an admin office staff member is signed in
    When they open the Accounting address directly
    Then they see "You don't have access to this page"
```

## Data changes

| Field | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Expense | `expenses/{id}`: `date` (`YYYY-MM-DD`), `period` (`YYYY-MM`), `category`, `vendor` (≤ 80), `description` (≤ 200), `amountCentavos` (> 0), `receiptPath` or `noReceiptReason`, `status` (`recorded` / `voided`), `voidReason`, `createdBy`, `createdAt`, `updatedAt`, `voidedBy`, `voidedAt` | Date not in the future; category from the fixed list; never deleted | Treasurer (see note) | Treasurer, board |
| Category list | settings `expenseCategories` or fixed in code (Sol Arch) | The eight above; renaming later must not change old expenses | Developer or treasurer | Form, fund summary |
| Monthly expense total | `monthlyTotals/{period}.expensesCentavos` (SA-001 §4.2) | Changes in the same transaction as the save, edit or void | Function or trigger | REQ-024, REQ-025 |
| Receipt photo | Storage `expenses/{expenseId}.jpg` | Image, resized on device to about 1000 px (as the mock-up's `readImage`), ≤ 5 MB | Treasurer, by Storage rules | Treasurer, board |
| Change record | `auditLog` | Every save, edit (with before and after of changed fields) and void; ids and amounts, no free text from the description | Function or trigger | Board, treasurer |

**BA note for Sol Arch (BA recommendation, diverges from SA-001).** SA-001 §3 makes expenses a client write with a trigger keeping totals. The BA recommends a callable function instead, for three reasons: the closed-month refusal (REQ-024) has to be checked in the same transaction as the total; a trigger updates the total after the save, so a month could be closed between the expense and its total; and the duplicate warning needs a query before saving. Sol Arch to confirm or reject (Sol Arch review, point 1); the criteria above hold either way.

Should PDF receipts (e-invoices) be accepted as well as photos? The BA thinks yes; Sol Arch to confirm the Storage rule.

## UX/UI notes

- **Accessibility:** every field has a visible label; errors are text under the field and announced; the amount field shows the peso sign outside the input, not as placeholder text. Void shows the word "Void", not only a strike-through.
- **Consistency:** reuses the mock-up's expense form, table and `.modal`; **Void** and **Expense** as in the glossary; the same void dialog shape as payment voids (REQ-014).
- **Mobile-first:** a single-column form at 375 px; amount uses the decimal keypad (`inputmode="decimal"`); the photo button opens the camera (`capture` hint) with a choose-file fallback; Save is at the bottom within thumb reach.
- **States:** empty month; loading skeleton; saving; saved toast "Expense saved."; upload failure keeps the form; closed month message.
- **Forms:** inline validation on blur; date defaults to today; category has no default (a wrong default is how "Others" fills up), so it must be chosen; the dialog does not close on a backdrop click.
- **Safe actions:** "Saving…" disables Save; the server refuses a repeat (Sol Arch to confirm the guard). Void is confirmed, needs a reason, and is recorded. No delete.
- **Stable layout:** the "No receipt" reason field reserves its space under the tick box.
- **Roles:** treasurer writes; board reads; admin office, guards and homeowners are refused by rules.

## Copy of record

| Where | Text |
|---|---|
| Tab and button | Expenses · Record an expense |
| Fields | Date · Category · Vendor · Description · Amount (₱) · Receipt · No receipt · Reason |
| Photo button | Add receipt photo · Change photo |
| Save button | Save {amount} expense (in flight: Saving…) |
| Saved | Expense saved. |
| Errors | Enter who was paid · Choose a category · Describe what was paid for · Enter an amount above ₱0.00, with up to 2 decimal places · The date can't be after today · Add a photo of the receipt, or tick No receipt and say why |
| Duplicate | An expense of {amount} to {vendor} on {date} is already recorded. Save this one too? · Save anyway · Cancel |
| Upload failed | The receipt didn't upload. Check your connection and try again. |
| No receipt in list | No receipt: {reason} |
| Void dialog | Void this expense? It stays on record, crossed out, and is left out of every total. · Reason · Void expense |
| Void, no reason | Say why you're voiding this expense |
| Void in list | Void · {reason} |
| Closed month | {Month YYYY} is closed. Date this in an open month, or reopen {Month} first. |
| Empty | No expenses recorded for {Month YYYY}. |
| Month total | Expenses · {Month YYYY} · {total} |

## Out of scope

- Second-person approval of expenses (decision 6).
- Budgets, payroll, tax and BIR filing, bank feeds (EPIC-006 out of scope).
- Recurring expenses (for example the monthly security agency bill).
- Editing the category list in the portal.

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions, rows 1–6 | Owner |
| Are the eight categories right, and do they match the board report's lines (story 39)? | Treasurer |
| How long must receipt photos be kept? | Treasurer, with the DPO and the HOA's accountant |

## Sol Arch review

Not yet done. Questions for Sol Arch:

1. **Divergence from SA-001 (r2, C5): confirm or reject.** SA-001 §3 has expenses as a client write ("admin-only by rules") with a trigger keeping `monthlyTotals`; the BA recommends a callable function so the closed-month check, the total and the duplicate query share one transaction (BA note above). Also: SA-001 §3 says "admin-only", while this REQ (decision 4) and SA-001 §8.1 give recording to the treasurer only, with the admin office unable to see expenses. If the function is confirmed, SA-001 §3 needs the change; if rejected, rules must still refuse writes into a closed month and the data table's "Function or trigger" becomes "trigger".
2. Guard against a double save: client-made id as the document id?
3. PDF receipts in Storage rules.
4. Size: M (2–3 days) confirmed?
