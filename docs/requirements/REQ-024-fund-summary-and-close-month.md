# REQ-024: Fund summary and closing a month

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-006 Accounting and fund](../epics/EPIC-006-accounting-and-fund.md) |
| Backlog story | [24 Fund summary and closing a month](../backlog/BACKLOG.md#24-fund-summary-and-closing-a-month) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 24A–24E of the R2 collect-and-account mockup. Repo copy: [req-018-027-mockup.html](../mockups/req-018-027-mockup.html). Not yet published as an artifact (main session to publish and put the link here) |
| Architecture | SA-001 §4.2 (`monthlyTotals/{period}`: `duesCentavos`, `feesCentavos`, `expensesCentavos`, `billedCentavos`, `closed`), §4.4 items 1 and 12 (reports read totals; closed months refuse edits), §8.1 (no one edits closed months), §11.1 R-11, Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-022 (expenses), REQ-023 (collections and the receipt-date rule), REQ-008 (billed totals) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft. r2, 2026-11-28: reconciled with REQ-014 (conflict C1): a receipt from a closed month can be voided, the void counts in the month it is made; close-dialog copy now says this applies to expenses |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation; the owner decides.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (fund summary plus close a month, with a bank balance check), B (summary only, no closing) or C (send the month's figures to the HOA's accountant and keep the fund outside the portal) | **A** |
| 2 | **Opening fund balance**: who enters it, and when it can change | **The treasurer enters it once at setup, with its as-of date and the date the board approved it. It can be changed only until the first month is closed**, and every change is logged |
| 3 | **Who reopens a closed month** (EPIC-006 open question; the backlog copy says "ask the board") | **The treasurer, with a reason; every board member gets a notification.** The alternative, a board member reopening, gives the read-only board role its first write permission (REQ-002) |
| 4 | **Bank balance at close** | **Asked for, optional.** The portal shows the difference from the closing fund balance, and a note is required if it isn't ₱0.00. This is the EPIC-006 success measure |
| 5 | Close in order | **Yes.** A month can be closed only after it ends and only if every earlier month is closed. Reopening a month reopens nothing else, but later months can't be re-closed until it is closed again |

## Problem

The treasurer reports the fund to the board every month. In the mock-up (`fundFor()`, line 433) the opening balance of every month is recomputed from the start of time on each view, so deleting an old expense (`delExpense`, line 1407) silently changes every month after it, including months already reported. The board's frustration is "figures that don't agree with each other" ([Board member](../product/PERSONAS.md#board-member)).

Two things fix it: totals kept per month (SA-001 §4.4 item 1), and a **closed** month that refuses changes. REQ-023's receipt-date rule and its "void in the month of the void" rule mean collections never need to change a closed month; REQ-022's expenses are the only records dated freely, and they are refused for closed months.

## Options

### Option A: Fund summary, plus close a month with a bank check (recommended)

- **How it works:** Accounting → Fund summary for a month: Opening + Dues + Amenity fees (from R3) − Expenses = Closing, the collection rate, and expenses by category. When the month has ended, "Close {month}" asks for the bank balance on the last day, shows any difference, and locks the month. A closed month shows "Closed by {name} on {date}". Reopening needs a reason and notifies the board.
- **Cost:** moderate (backlog M). Summary page, close and reopen functions, the closed check in expense saves and billing, the opening balance setting.
- **Honest downside:** if the opening balance is wrong, every month is wrong; it must be agreed with the board before the first close.

### Option B: Summary only, no closing

- **How it works:** the summary page without close or reopen.
- **Cost:** cheap.
- **Honest downside:** a reported month can still change, which is the problem.

### Option C: The accountant keeps the fund

- **How it works:** the treasurer downloads collections (REQ-023) and expenses each month and sends them to the HOA's accountant, who keeps the fund in their own books.
- **Cost:** none in the portal.
- **Honest downside:** the portal's dashboard (REQ-025) and the board report (story 39) can't show a fund balance; two sets of figures again. A sensible answer only if the HOA already pays an accountant and wants their books to be the record.

### Recommendation

**Option A.** Closing is what makes the board's figures stop changing; the bank check is what makes them right.

## Story

As a treasurer, I want the fund balance for each month and the ability to close a finished month, so that the numbers I report to the board stop changing after I report them.

## Acceptance criteria (Option A)

```gherkin
Feature: Fund summary and closing a month

  Background:
    Given the treasurer is signed in
    And the opening fund balance is ₱185,000.00 as of Oct 1, 2026

  Scenario: Closing balance
    Given October 2026 has ₱30,600.00 dues collected and ₱28,600.00 expenses
    When the treasurer opens the Fund summary for October 2026
    Then it shows Opening ₱185,000.00, Dues ₱30,600.00, Expenses ₱28,600.00 and Closing ₱187,000.00
    And the November 2026 fund summary opens at ₱187,000.00

  Scenario: Amenity fees join the formula once bookings exist (R3)
    Given amenity booking has shipped and October 2026 has ₱850.00 of amenity fees
    Then the October 2026 closing balance is ₱187,850.00
    And deposits are not part of the fund summary

  Scenario: Figures agree with their pages
    When the treasurer opens the Fund summary for October 2026
    Then Dues equals the total in Collections for October 2026 (REQ-023)
    And Expenses equals the total in Expenses for October 2026, without voided expenses (REQ-022)

  Scenario: Where the money went
    Given October 2026 expenses are ₱18,000.00 Security, ₱7,500.00 Repairs & maintenance and ₱3,100.00 Utilities
    Then "Where the money went" lists them in that order with their amounts

  Scenario: Collection rate
    Given ₱56,070.00 was billed for October 2026 and ₱30,600.00 dues were collected in October 2026
    Then the summary reads "Collection rate 55% of ₱56,070.00 billed"
    And a note reads "Includes payments for earlier months."

  Scenario: Close a month with a matching bank balance
    Given it is Nov 5, 2026 and October 2026 is open
    When the treasurer presses "Close October 2026", enters a bank balance of ₱187,000.00 on Oct 31, 2026 and presses "Close October"
    Then the button reads "Closing…" and is disabled until it finishes
    And the summary shows "Closed by Rosa Villanueva on Nov 5, 2026"
    And the activity log records the close

  Scenario: The bank balance doesn't match (decision 4)
    When the treasurer enters a bank balance of ₱186,200.00 for October 2026
    Then they see "Difference: ₱800.00 less in the bank than the portal shows."
    And "Explain the difference" is required before "Close October" works
    When they enter "Bank charges and one cheque not yet cleared" and close
    Then the closed summary shows the difference and the note

  Scenario: Closing without a bank balance
    When the treasurer leaves the bank balance empty and closes October 2026
    Then the month closes
    And the summary shows "Bank balance not entered"

  Scenario: A closed month can't be changed
    Given October 2026 is closed
    When the treasurer records, edits or voids an expense dated Oct 20, 2026
    Then they see "October 2026 is closed. Date this in an open month, or reopen October first."
    And nothing is saved

  Scenario: A billing run can't add to a closed month
    Given October 2026 is closed
    When a billing run for October 2026 is started
    Then it is refused with "October 2026 is closed."

  Scenario: Voiding an old receipt doesn't change a closed month
    Given October 2026 is closed with Dues ₱30,600.00
    When the treasurer voids OR-00090 dated Oct 12, 2026 on Nov 8, 2026
    Then the void is saved without reopening October 2026 (REQ-014 decision 5)
    And October 2026 still shows Dues ₱30,600.00
    And the void is a minus line in November 2026 (REQ-023)
    And November 2026's Dues is ₱1,800.00 lower

  Scenario: A month that hasn't ended can't be closed
    Given today is Nov 28, 2026
    Then there is no "Close November 2026" button
    And the summary reads "You can close November 2026 from Dec 1."

  Scenario: Months close in order (decision 5)
    Given September 2026 is open
    When the treasurer opens the October 2026 summary
    Then "Close October 2026" is disabled with "Close September 2026 first."

  Scenario: Reopen a closed month (decision 3)
    Given October 2026 is closed
    When the treasurer presses "Reopen October 2026", enters "Expense receipt from the electrician arrived late" and confirms
    Then October 2026 shows "Open · reopened by Rosa Villanueva on Nov 12, 2026"
    And each board member's bell shows "October 2026 was reopened by the treasurer: Expense receipt from the electrician arrived late"
    And the activity log records the reopen with the reason

  Scenario: Reopening needs a reason
    When the treasurer confirms "Reopen October 2026" with no reason
    Then "Say why you're reopening October 2026" shows under Reason
    And the month stays closed

  Scenario: Closing twice closes once
    When the treasurer presses "Close October" twice quickly
    Then October 2026 is closed once and the activity log has one close

  Scenario: Set the opening fund balance (decision 2)
    Given no month has been closed
    When the treasurer opens Settings, Fund and enters ₱185,000.00 as of Oct 1, 2026, approved by the board on Sep 25, 2026
    Then the first fund summary is October 2026 and opens at ₱185,000.00

  Scenario: The opening balance is fixed after the first close
    Given October 2026 is closed
    When the treasurer opens Settings, Fund
    Then the opening balance is read-only with "Fixed after the first month was closed."

  Scenario: No opening balance yet
    Given the opening fund balance has not been set
    When the treasurer opens the Fund summary
    Then it reads "Set the opening fund balance before the first fund summary." with "Go to Settings"

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then the Opening, Dues, Expenses and Closing figures stack in one column
    And the page does not scroll sideways

  Scenario: A board member reads but can't close or reopen
    Given a board member is signed in
    When they open the Fund summary for October 2026
    Then they see the figures, the close status and any bank difference note
    And no "Close" or "Reopen" buttons are shown
    And their device's request to close a month is refused
```

## Data changes

| Field | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Month status | `monthlyTotals/{period}.closed` (SA-001 §4.2), plus `closedBy`, `closedAt` | Set only by `closeMonth`; cleared only by `reopenMonth` | Functions | Every write that is dated in a period |
| Opening and closing | `monthlyTotals/{period}.openingCentavos`, `.closingCentavos` | Opening = previous month's closing, or the setup balance for the first month; closing written at close | `closeMonth`; open months computed on read | Summary, REQ-025 |
| Bank check | `monthlyTotals/{period}.bankBalanceCentavos`, `.bankDifferenceNote` | Optional; note required if difference ≠ 0 | `closeMonth` | Summary |
| Close history | `monthlyTotals/{period}/events/{id}`: `close` / `reopen`, by, at, reason | Append-only | Functions | Summary, audit |
| Opening fund balance | settings `openingFund`: `amountCentavos`, `asOf`, `boardApprovedOn` | Editable only while no month is closed | Treasurer (function) | Summary |
| Change record | `auditLog` | Close, reopen, opening balance changes | Functions | Board, treasurer |

**What a closed month refuses:** expense create, edit and void dated in it (REQ-022); a billing run for it (REQ-008). Receipts never fall into a past month because they take the approval date (REQ-023 decision 2), and receipt voids go to the void's month, which is always the current, open month (REQ-023 decision 3, REQ-014 decision 5), so voiding a receipt from a closed month is allowed and changes nothing in it. Sol Arch to confirm every function that writes a dated money record checks `closed` in its transaction, and that rules refuse client writes into a closed period.

## UX/UI notes

- **Accessibility:** the five fund figures are a definition list with labels, not only a styled row; "Closed" is a word with an icon, not just a lock glyph; the close dialog takes focus and returns it.
- **Consistency:** reuses the mock-up's `.fund` strip and "Where the money went" bars. **Fund balance**, **Close a month**, **Collections**, **Expense** as in the glossary. The same reason-dialog shape as voids.
- **Mobile-first:** the strip stacks at 375 px (the mock-up already does at 760 px).
- **States:** no opening balance; open month (with "You can close … from {date}" if not ended); ready to close; closing; closed (with bank check result); reopened; error ("Couldn't close October 2026. Nothing changed. Try again.").
- **Forms:** bank balance uses the decimal keypad; the difference updates as it's typed; the close and reopen dialogs don't close on a backdrop click.
- **Safe actions:** "Closing…" disables the button; the function refuses a second close. Reopen needs a reason and tells the board.
- **Stable layout:** the difference line under the bank balance field reserves its space.
- **Roles:** treasurer closes and reopens; board reads; admin office, guards and homeowners are refused.

## Copy of record

| Where | Text |
|---|---|
| Heading | Fund summary · {Month YYYY} |
| Strip | Opening · + Dues · + Amenity fees (from R3) · − Expenses · Closing |
| Collection rate | Collection rate {p}% of {billed} billed · Includes payments for earlier months. |
| Categories | Where the money went |
| Close button | Close {Month YYYY} |
| Close dialog | Close {Month YYYY}? No expense dated in {Month} can be recorded, edited or voided after this. A receipt voided later counts in the month of the void. · Bank balance on {last day} (optional) · Close {Month} (in flight: Closing…) |
| Difference | Difference: {amount} less in the bank than the portal shows. · Difference: {amount} more in the bank than the portal shows. · Explain the difference |
| Closed | Closed by {name} on {date} · Bank balance {amount}, matches · Bank balance {amount}, difference {amount}: {note} · Bank balance not entered |
| Not ended | You can close {Month YYYY} from {first day of next month}. |
| Out of order | Close {Month YYYY} first. |
| Closed refusal | {Month YYYY} is closed. Date this in an open month, or reopen {Month} first. |
| Billing refusal | {Month YYYY} is closed. |
| Reopen dialog | Reopen {Month YYYY}? Board members will be told, with your reason. · Reason · Reopen {Month} |
| Reopen, no reason | Say why you're reopening {Month YYYY} |
| Reopened | Open · reopened by {name} on {date} |
| Board bell | {Month YYYY} was reopened by the treasurer: {reason} |
| No opening balance | Set the opening fund balance before the first fund summary. · Go to Settings |
| Opening fixed | Fixed after the first month was closed. |
| Error | Couldn't close {Month YYYY}. Nothing changed. Try again. |

## Out of scope

- A general ledger, double entry, budgets, bank feeds (EPIC-006 out of scope).
- The board financial report (story 39, D6).
- Cash on hand or petty cash as a separate fund.
- Approving a close by a second person.

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions, rows 1–5 | Owner |
| What opening fund balance should the portal start from, and as of which date? | Treasurer, approved by the board |
| Who may reopen a closed month? (decision 3 recommends the treasurer, with the board told) | HOA board |
| Should the fund include more than one bank or e-wallet account, each with its own balance? | Treasurer |

## Sol Arch review

Not yet done. Questions for Sol Arch:

1. The closed check: every function writing a dated money record, and rules for any client write.
2. Opening and closing for open months worked out on read from the chain of earlier months: cost after a few years, or kept on each month?
3. Board notification on reopen through REQ-011 (one per board member).
4. Size: M (2–3 days) confirmed?
