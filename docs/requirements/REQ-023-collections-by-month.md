# REQ-023: Collections by month

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-006 Accounting and fund](../epics/EPIC-006-accounting-and-fund.md) |
| Backlog story | [23 Collections by month](../backlog/BACKLOG.md#23-collections-by-month) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 23A–23C of the R2 collect-and-account mockup. Repo copy: [req-018-027-mockup.html](../mockups/req-018-027-mockup.html). Not yet published as an artifact (main session to publish and put the link here) |
| Architecture | SA-001 §4.2 (`receipts`, `monthlyTotals/{period}.duesCentavos` and `feesCentavos`), §4.4 item 1 (reports read totals, not history), §11.1 R-11 (nightly reconciliation), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-012 (approval), REQ-013 (official receipts), REQ-014 (void) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft. r2, 2026-11-28: reconciled with REQ-014 (conflict C1: void counted in the month of the void, now agreed by REQ-014 decision 5) and with REQ-031 and REQ-032 (conflict C3: an amenity fee counts when the treasurer approves its payment, not when the booking is approved) |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation; the owner decides.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (month list of receipts with totals and a CSV), B (totals only) or C (wait for the R3 reports, story 35) | **A** |
| 2 | **Which month a payment counts in**: the date on the official receipt (the approval date), or the date the homeowner says they paid | **The receipt date.** The receipt is the HOA's own record, and it never lands in a month that is already closed (REQ-024). The payment date is shown alongside for matching to the bank |
| 3 | **A receipt voided in a later month** | **Counted as a minus line in the month of the void.** The original month keeps its total; a void in the same month nets to zero and the receipt shows "Void". This is what keeps closed months closed. REQ-014 decision 5 uses the same rule (r2, C1) |
| 4 | CSV download of the month's list now, rather than waiting for the R3 reports | **Yes, about 0.5 day.** Reconciling against the bank statement is the reason this page exists, and it happens in a spreadsheet |
| 5 | **When an amenity fee counts** (R3) | **In the month the treasurer approves the fee payment** (REQ-012, REQ-031), by the same approval-date rule as dues (decision 2). Not when the admin office approves the booking: a booking approval is not money received. Only the fee part counts; the deposit never does. A voided fee payment is a minus line in the month of the void (decision 3). Agrees with REQ-031 and REQ-032 decision 2. *Changed in r2 from "booking fees on booking approval"* |

## Problem

Every month the treasurer reconciles what the portal says was collected against the HOA's bank or e-wallet account ([Treasurer](../product/PERSONAS.md#treasurer): "screenshots that don't match the account"). The mock-up's Accounting, Collections tab (`aAcct()`, line 765) lists approved payments by `p.date` and sums them in the browser, and amenity fees by approval date (`feesIn()`, line 430). It doesn't say which date it uses, and its total would change if an old receipt were voided after the month was reported.

The case that decides the design: a homeowner pays on **Nov 30**, the treasurer approves on **Dec 2**. The bank shows November; the official receipt is dated December. If November is reported on Dec 1 and closed, counting by payment date would change a closed month. Counting by receipt date doesn't.

Amenity fees arrive with booking in R3. In R2 the page shows dues only; the fees section appears once bookings exist (REQ-031), listing fee payments in the month the treasurer approved them (decision 5), with deposits never counted as collections (glossary).

## Options

### Option A: Month list of receipts, totals and a CSV (recommended)

- **How it works:** Accounting → Collections, with a month picker. Lists every official receipt dated in the month: receipt date, OR no., household, payment date, reference number, amount, with a total. Voids show as minus lines. "Download CSV" exports exactly what is listed. The total is the same figure the fund summary and dashboard use.
- **Cost:** cheap (backlog S), plus about 0.5 day for the CSV.
- **Honest downside:** the treasurer still matches each line to the bank by eye or in a spreadsheet; the portal has no bank feed (EPIC-006 out of scope).

### Option B: Totals only

- **How it works:** one number per month.
- **Cost:** cheap.
- **Honest downside:** a total that doesn't match the bank can't be traced to the payment that caused it.

### Option C: Wait for the R3 reports (story 35)

- **Cost:** none in R2.
- **Honest downside:** the fund summary (REQ-024) has nothing to stand on until R3, and the first months of the portal go unreconciled.

### Recommendation

**Option A** with the receipt-date rule. It makes the month's total traceable, stable once closed, and easy to reconcile.

## Story

As a treasurer, I want to see every dues receipt and amenity fee collected in a month, with totals, so that I can reconcile the month against the bank account.

## Acceptance criteria (Option A)

```gherkin
Feature: Monthly collections

  Background:
    Given the treasurer is signed in

  Scenario: The month's total matches its receipts
    Given 17 dues payments totalling ₱30,600.00 were approved with receipts dated in November 2026
    When the treasurer opens Accounting, Collections for November 2026
    Then 17 receipts are listed, newest first
    And the total reads "₱30,600.00"
    And the heading reads "Dues collected · November 2026 · 17 receipts"

  Scenario: A payment made in one month and approved in the next (decision 2)
    Given Blk 4 Lot 12 paid on Nov 30, 2026 and the receipt OR-00101 is dated Dec 2, 2026
    When the treasurer opens Collections for December 2026
    Then OR-00101 is listed with receipt date "Dec 2, 2026" and paid "Nov 30, 2026"
    And it is marked "Paid in November"
    And it is not in November 2026's list

  Scenario: A receipt voided in the same month
    Given OR-00093 for ₱1,800.00 is dated Nov 10, 2026
    And it was voided on Nov 20, 2026
    When the treasurer opens Collections for November 2026
    Then OR-00093 shows as "Void" and is left out of the total

  Scenario: A receipt voided in a later month (decision 3)
    Given OR-00093 for ₱1,800.00 is dated Nov 10, 2026
    And it was voided on Dec 3, 2026 with the reason "Payment reversed by the bank"
    When the treasurer opens Collections for November 2026
    Then OR-00093 is listed normally and counted in November's total
    And it is marked "Voided Dec 3, 2026"
    When the treasurer opens Collections for December 2026
    Then a line reads "Void of OR-00093 · −₱1,800.00" with the reason
    And December's total is reduced by ₱1,800.00

  Scenario: An amenity fee counts when its payment is approved (decision 5, R3)
    Given amenity booking has shipped
    And Blk 6 Lot 3's Function Room booking was approved by the admin office on Nov 30, 2026
    And its ₱3,500.00 payment (₱2,500.00 fee, ₱1,000.00 deposit) was approved by the treasurer on Dec 2, 2026
    When the treasurer opens Collections for December 2026
    Then the Amenity fees section lists ₱2,500.00 for the Function Room booking
    And the ₱1,000.00 deposit is not in any collections total
    And November 2026's Amenity fees section does not list it

  Scenario: The total here is the total everywhere
    When the treasurer opens Collections for November 2026
    Then the total equals "Dues" in the November 2026 fund summary (REQ-024)
    And it equals "Collected · November 2026" on the dashboard (REQ-025)

  Scenario: An advance payment counts in full
    Given Blk 2 Lot 7 paid ₱5,400.00 in October 2026, of which ₱3,600.00 is credit for later months
    When the treasurer opens Collections for October 2026
    Then the receipt is listed at ₱5,400.00 and counted in full

  Scenario: Pending and rejected payments are not collections
    Given Blk 6 Lot 9 has a pending payment and Blk 1 Lot 3 a rejected one in November 2026
    Then neither appears in Collections for November 2026

  Scenario: Download the month as CSV (decision 4)
    When the treasurer presses "Download CSV" for November 2026
    Then a file named "collections-2026-11.csv" downloads
    And it has the columns Receipt date, OR no., Lot, Payment date, Reference number, Amount, Status
    And its rows and total match the screen
    And a cell starting with "=", "+", "-" or "@" is prefixed so a spreadsheet doesn't run it

  Scenario: A month with no collections
    Given no receipts are dated in January 2027
    Then the page reads "No collections recorded for January 2027."
    And "Download CSV" is disabled

  Scenario: Open a receipt from the list
    When the treasurer presses "OR-00093"
    Then the official receipt PDF opens (REQ-013)

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then each receipt shows as a card with OR no., lot, receipt date and amount
    And the month total stays visible above the list
    And the page does not scroll sideways

  Scenario: The list can't load
    Given the network drops while the list is loading
    Then the page reads "Couldn't load collections. Check your connection and try again." with "Try again"

  Scenario: A board member can read collections
    Given a board member is signed in
    When they open Accounting, Collections
    Then they see the list, totals and CSV download

  Scenario: Admin office and homeowners can't see collections
    Given an admin office staff member is signed in
    When they open the Collections address directly
    Then they see "You don't have access to this page"
    And their device's request for receipts is refused
```

## Data changes

| Field | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Receipt date and period | `receipts/{orNo}.date`, `.period` (`YYYY-MM`) | The approval date in Manila time; the period the receipt counts in | `decidePayment` (REQ-012) | This page |
| Payment date | `receipts/{orNo}.paidDate` | Copied from the payment as reported by the homeowner | `decidePayment` | This page (match to bank) |
| Void line | `receipts/{orNo}.voidedAt`, `.voidPeriod`, `.voidReason` | `voidPeriod` is the month of the void | `voidReceipt` (REQ-014) | This page |
| Monthly dues total | `monthlyTotals/{period}.duesCentavos` | Plus the receipt amount in the receipt's period; minus it in the void's period. Same transaction as the approval or void | `decidePayment`, `voidReceipt` | This page, REQ-024, REQ-025 |
| Monthly fees total | `monthlyTotals/{period}.feesCentavos` | Plus the fee part of an `amenityFee` payment in the period of its approval; minus it in the period of a void (decisions 3 and 5). **Deposits are never added**. Nothing is added when a booking is approved | `decidePayment`, `voidReceipt` (R3 extension owned by REQ-031) | REQ-024 |

The list is read by `period` with an index on (`period`, `date` desc), and void lines by `voidPeriod`. The nightly reconciliation job (SA-001 R-11) recounts each open month from receipts and alerts if `monthlyTotals` differs.

## UX/UI notes

- **Accessibility:** the table has a caption with the month; void lines say "Void" and show the minus sign, not only red; the month picker is a labelled select.
- **Consistency:** reuses the mock-up's month picker, tabs (Collections · Expenses · Fund summary), table with `tfoot` total. **Collections**, **Official receipt**, **Reference number**, **Void** as in the glossary. Peso amounts with two decimals everywhere on this page.
- **Mobile-first:** cards at 375 px; the CSV button is on the page header and still works on a phone, though reconciling is a laptop task.
- **States:** empty month; loading skeleton; error with retry; R2 has no fees section (it appears with R3, not as an empty card).
- **Safe actions:** read-only page.
- **Stable layout:** the "Paid in {month}" and "Voided {date}" markers sit in a reserved second line under the amount.
- **Roles:** treasurer and board read; admin office (who don't approve payments in R1, REQ-002 decision 3), guards and homeowners are refused by rules.
- **Privacy:** the CSV holds lot and reference numbers, not owner names or contacts. The download is the treasurer's responsibility; the screen says "Contains household payment details. Keep it private."

## Copy of record

| Where | Text |
|---|---|
| Heading | Dues collected · {Month YYYY} · {n} receipts |
| Columns | Receipt date · OR no. · Household · Paid · Reference no. · Amount |
| Markers | Paid in {Month} · Voided {date} · Void |
| Void line | Void of {OR no.} · −{amount} · {reason} |
| Total row | Total · {amount} |
| CSV button | Download CSV |
| CSV note | Contains household payment details. Keep it private. |
| CSV file name | collections-{YYYY-MM}.csv |
| Empty | No collections recorded for {Month YYYY}. |
| Error | Couldn't load collections. Check your connection and try again. · Try again |
| Fees heading (R3) | Amenity fees · {Month YYYY} · Deposits are held separately and are not collections. |

## Out of scope

- Amenity fees and deposits on this page until bookings ship (R3, REQ-031 and REQ-032).
- Bank feeds and automatic reconciliation (EPIC-006).
- Payment method breakdown (GCash, Maya, bank). The portal doesn't record the method.
- The six standard reports (story 35, R3).

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions, rows 1–5 | Owner |
| Does the HOA's accountant accept receipt-date (approval-date) reporting for the monthly figures? | Treasurer, with the accountant |

## Sol Arch review

Not yet done. Questions for Sol Arch:

1. Confirm `receipts` carries `period`, `paidDate`, `voidPeriod` from REQ-012/014, so this page needs no join to `payments`.
2. A month with several hundred receipts: page size, and whether the CSV is built in the browser from the paged reads or by a function.
3. Size: S plus 0.5 day for the CSV.
4. (r2, C3) Fees are added to `feesCentavos` by `decidePayment` for kind `amenityFee`, not by `decideBooking` as SA-001 §4.3 Flow 2 says ("fees to `monthlyTotals` only when approved" refers to the booking). Confirm or reject; SA-001 would need the matching change.
