# REQ-018: Delinquent accounts list

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-005 Collections and notices](../epics/EPIC-005-collections-and-notices.md) |
| Backlog story | [18 Delinquent accounts list](../backlog/BACKLOG.md#18-delinquent-accounts-list) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 18A–18E of the R2 collect-and-account mockup. Repo copy: [req-018-027-mockup.html](../mockups/req-018-027-mockup.html). Not yet published as an artifact (main session to publish and put the link here) |
| Architecture | SA-001 §4.2 (`households` totals: `balanceCentavos`, `overdueCount`, `standing`), §4.4 item 1 (totals kept by functions, `shared/domain/ledger.js`), §7 (50 rows per page, indexed queries), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-008 (billing run), REQ-009 (statement and allocation), REQ-012 (payment approval), REQ-014 (void) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft. r2, 2026-11-28: reconciled with REQ-034 (conflict C4): standing is worked out when read, from the stored unpaid due dates and today's Manila date, by one shared rule; no stored standing is relied on |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation; the owner decides. Board questions stay under Open questions.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (Delinquent accounts page in Collections), B (a "Delinquent" filter on the Homeowners page) or C (a weekly spreadsheet export) | **A.** Story 20 needs a place for the next-notice button, and B's columns are the wrong ones for collections |
| 2 | **D2 grace period.** Until the board decides, when does an unpaid bill become overdue? | **The day after the due date (grace 0 days)**, with "Grace period (days)" as a setting so the board's answer is a setting change, not a rebuild. Penalties and interest stay out until D2 is decided |
| 3 | Who sees the list | **Treasurer and admin office** see it in full. **Board members** see it read-only (they decide on endorsement to counsel). Homeowners and guards never see it |
| 4 | Deactivated households (REQ-003) that still owe | **Not listed by default**; shown under a "Deactivated" filter so the debt is not forgotten |
| 5 | How standing stays right as the calendar moves (r2, conflict C4 with REQ-034) | **Worked out when read, never stored as the answer.** Functions keep only the dates (`oldestUnpaidDue`, `unpaidBills`); "Delinquent" or "Good standing" is decided at the moment of reading by one rule in `shared/domain` (`oldestUnpaidDue` earlier than today in Manila minus the grace period). This list, the Homeowners pill, statements (REQ-009), the dashboard (REQ-025), the booking pause (REQ-034) and later certificates all call that rule. No midnight job, so nothing to go stale or to monitor. If Sol Arch keeps a stored `standing` for other reasons, it is a display hint only and no decision reads it |

## Problem

The treasurer has to know who is behind, by how much, and what was last sent to them. The mock-up's Collections page (`aColl()`, line 797) works this out in the browser by re-running every household's ledger on every view (`ledger()`, line 414), which SA-001 §4.4 item 1 rules out at 623+ households. It also shows the *total* balance, which includes the current month that is not yet due, and it doesn't warn that a household already has a payment waiting for approval, so the treasurer may chase someone who has paid (EPIC-005 risk).

The mock-up's board report sample puts collection at 51% of billing (EPIC-005). At that rate, a large share of 623 households may be delinquent in any month, so the list must be quick to work through, not just correct.

Who has the problem: the [Treasurer](../product/PERSONAS.md#treasurer), weekly, and daily in collection weeks.

## Options

### Option A: Delinquent accounts page in Collections (recommended)

- **How it works:** Collections → "Delinquent accounts". One row per delinquent household, furthest behind first: lot, owner, months overdue, overdue amount, total balance, last notice, and a flag when a payment is waiting for approval. Chips filter by "1 month", "2–3 months", "4+ months". A search box finds a lot or owner. A summary line counts households and the overdue total. Story 20 adds the next-notice button to each row.
- **Where it lives:** staff navigation, Collections (the mock-up's "Collections & Notices").
- **Cost:** cheap to moderate. The page is cheap; the work is in keeping each household's overdue figures right as time passes (see Data changes).
- **Excludes:** nothing by device; it becomes cards on a phone.
- **Honest downside:** another page to maintain alongside the Homeowners list.

### Option B: A "Delinquent" filter on the Homeowners page

- **How it works:** the REQ-003 directory gains a standing pill and a "Delinquent only" filter, sorted by months overdue.
- **Cost:** cheap.
- **Honest downside:** the directory shows contacts and link status, not the last notice or a pending payment, and it has nowhere natural for the notice actions in story 20. It would grow into Option A anyway.

### Option C: Weekly spreadsheet export, worked outside the portal

- **How it works:** the treasurer downloads a CSV of balances and works the list in Excel, as many HOAs do today.
- **Cost:** cheap.
- **Honest downside:** names and debts in a spreadsheet that gets emailed and copied (RA 10173 security of personal information), already out of date by the next approval, and no link to notices. The reports in story 35 (R3) will offer a delinquency CSV for the board; it shouldn't be the treasurer's working tool.

### Recommendation

**Option A.** The overdue figures it needs are required by statements (REQ-009), notices (REQ-020), the dashboard (REQ-025) and certificates (R3) anyway, so the page itself is the cheap part. Showing the overdue amount separately from the total balance, and flagging pending payments, are what stop wrong or unfair follow-ups.

## Story

As a treasurer, I want a list of households with overdue bills, the furthest behind first, so that I know who to follow up and how far behind they are.

## Acceptance criteria (Option A)

```gherkin
Feature: Delinquent accounts

  Background:
    Given dues are ₱1,800.00 a month
    And each period's due date is its last day, in Manila time
    And the grace period is 0 days

  Scenario: An unpaid bill becomes overdue the day after its due date
    Given November 2026 is billed with a due date of Nov 30, 2026
    And Blk 3 Lot 2 has not paid November and owes nothing else
    And nothing has been billed, approved or voided for Blk 3 Lot 2 since Nov 30, 2026
    When the treasurer opens Delinquent accounts on Dec 1, 2026 at 12:01 AM Manila time
    Then Blk 3 Lot 2 is listed with months overdue 1 and overdue ₱1,800.00
    And on the Homeowners page Blk 3 Lot 2 shows "Delinquent"

  Scenario: A bill is not overdue on its due date
    Given Blk 3 Lot 2 has not paid November 2026 and owes nothing else
    When the treasurer opens Delinquent accounts on Nov 30, 2026 at 11:00 PM Manila time
    Then Blk 3 Lot 2 is not listed
    And on the Homeowners page Blk 3 Lot 2 shows "Good standing"

  Scenario: A grace period delays overdue (once the board sets one, D2)
    Given the treasurer has set the grace period to 5 days
    And Blk 3 Lot 2 has not paid November 2026
    When the treasurer opens Delinquent accounts on Dec 5, 2026
    Then Blk 3 Lot 2 is not listed
    And on Dec 6, 2026 it is listed

  Scenario: Paying the overdue amount removes the household
    Given Blk 3 Lot 2 is listed with overdue ₱1,800.00
    When the treasurer approves a ₱1,800.00 payment from Blk 3 Lot 2
    Then Blk 3 Lot 2 is no longer listed
    And on the Homeowners page it shows "Good standing"

  Scenario: A partial payment pays the oldest bill first
    Given Blk 6 Lot 9 has not paid September, October or November 2026
    When a ₱2,000.00 payment from Blk 6 Lot 9 is approved on Dec 2, 2026
    Then Blk 6 Lot 9 is listed with months overdue 2 and overdue ₱3,400.00
    And its oldest overdue period reads "October 2026"

  Scenario: Overdue amount and total balance are shown separately
    Given Blk 3 Lot 2 has not paid November 2026
    And December 2026 is billed but not yet due
    When the treasurer opens Delinquent accounts on Dec 3, 2026
    Then Blk 3 Lot 2 shows overdue ₱1,800.00 and total balance ₱3,600.00

  Scenario: A payment waiting for approval is flagged
    Given Blk 3 Lot 2 is delinquent by ₱1,800.00
    And Blk 3 Lot 2 has submitted a ₱1,800.00 payment that is pending approval
    When the treasurer opens Delinquent accounts
    Then Blk 3 Lot 2 is still listed
    And its row reads "Payment pending approval: ₱1,800.00" with a link "Review payment"

  Scenario: Furthest behind first
    Given Blk 3 Lot 2 is 3 months overdue, Blk 1 Lot 3 is 1 month overdue and Blk 8 Lot 4 is 3 months overdue
    When the treasurer opens Delinquent accounts
    Then the order is Blk 3 Lot 2, Blk 8 Lot 4, Blk 1 Lot 3
    And households with the same oldest overdue period are in lot order

  Scenario: A household with an advance payment is never listed
    Given Blk 2 Lot 7 paid ₱5,400.00 in October 2026 and has a credit of ₱1,800.00
    When November 2026 becomes overdue
    Then Blk 2 Lot 7 is not listed

  Scenario: Voiding a payment puts the household back on the list
    Given Blk 5 Lot 1 is in good standing because OR-00093 for ₱1,800.00 paid November 2026
    When the treasurer voids OR-00093 on Dec 4, 2026 (REQ-014)
    Then Blk 5 Lot 1 is listed with months overdue 1 and overdue ₱1,800.00

  Scenario: Filter by how far behind
    Given 30 households are 1 month overdue, 9 are 2 to 3 months and 4 are 4 or more months
    When the treasurer picks "4+ months"
    Then only those 4 households are listed
    And the chips read "All (43)", "1 month (30)", "2–3 months (9)", "4+ months (4)"

  Scenario: Search by lot or name
    When the treasurer types "blk 3" in "Search name or lot"
    Then only delinquent Block 3 households are listed, not Blocks 30 to 39

  Scenario: Summary line
    Given 43 households are delinquent with ₱135,000.00 overdue in total
    Then the page reads "43 delinquent households · ₱135,000.00 overdue"

  Scenario: Deactivated households are kept apart
    Given Blk 7 Lot 1 is deactivated and has 2 overdue months
    When the treasurer opens Delinquent accounts
    Then Blk 7 Lot 1 is not in the default list
    And it is listed under the "Deactivated" filter

  Scenario: Nobody is delinquent
    Given every household is in good standing
    Then the page reads "No delinquent accounts. Every household is in good standing."

  Scenario: Before the first bill is overdue
    Given no billed period has passed its due date
    Then the page reads "No bills are overdue yet. Households appear here the day after a due date passes."

  Scenario: The list can't load
    Given the network drops while the list is loading
    Then the page reads "Couldn't load delinquent accounts. Check your connection and try again." with a "Try again" button

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then each household shows as a card with lot, owner, months overdue, overdue amount and last notice
    And the page does not scroll sideways

  Scenario: A board member sees the list but can't act on it
    Given a board member is signed in
    When they open Delinquent accounts
    Then they see the list
    And no "Send" buttons or tick boxes are shown

  Scenario: Homeowners and guards are refused
    Given a homeowner is signed in
    When they open the Delinquent accounts address directly
    Then they see "You don't have access to this page"
    And their device's request for other households' balances is refused
```

## Data changes

| Field | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Oldest unpaid due date | `households/{id}.oldestUnpaidDue` (`YYYY-MM-DD` or null) | Due date of the oldest bill not fully paid, after oldest-first allocation (`shared/domain/ledger.js`) | The functions that bill, approve and void (REQ-008, REQ-012, REQ-014) | This list; standing |
| Unpaid bills summary | `households/{id}.unpaidBills`: list of `{period, dueDate, unpaidCentavos}` | Only bills not fully paid; a few entries at most | Same functions | Months overdue and overdue amount, worked out against today |
| Pending payment total | `households/{id}.pendingCentavos` | Sum of this household's pending payments | REQ-010 submit and REQ-012 decide | "Payment pending approval" flag |
| Last notice | `households/{id}.lastNotice`: `{type, date, noticeId}` | Written when a notice is sent (REQ-020) | `sendNotice` | Last-notice column |
| Grace period | settings `graceDays` (Sol Arch to name) | Whole days, 0–60, default 0 (D2) | Treasurer, in Settings | Overdue rule, statements (REQ-009) |
| Standing | Not stored as the answer (decision 5). Worked out on read from `oldestUnpaidDue`, `graceDays` and today in Manila by one `shared/domain` rule. SA-001 §4.2's `standing` and `overdueCount`, if kept, are display hints only | — | This list, Homeowners pill, REQ-009, REQ-025, REQ-034 |

**Why on read (decision 5).** Overdue changes with the calendar, not with a write: a bill becomes overdue at midnight with nothing saved, so a stored `standing` or `overdueCount` goes stale unless a daily job rewrites it. Working it out on read avoids that:

- **The list:** query `active == true and oldestUnpaidDue < (today − graceDays)`, ordered by `oldestUnpaidDue` then `lotKey`. That order *is* "furthest behind first". Months overdue and the overdue amount come from `unpaidBills` against today.
- **A single household** (pill, statement, booking pause): the same rule applied to that household's `oldestUnpaidDue`, in the browser for display and inside the function's transaction wherever a decision depends on it (REQ-034).

The alternative, a daily job at 00:15 Manila rewriting `standing` and `overdueCount`, leaves a 15-minute window, a job to monitor, and a stale answer if the job fails. It is not recommended.

The summary line ("43 delinquent households · ₱135,000.00 overdue") needs a count and a sum over the query: Sol Arch to confirm an aggregation query or a kept total. The list reads 50 households per page.

## UX/UI notes

- **Accessibility:** months overdue is a number in its own column, not only a colour. The "Payment pending approval" flag is text with an icon, not just a tint. Chips are buttons with `aria-pressed` and counts in the label. Table has a caption.
- **Consistency:** reuses the mock-up's table, chips, `.pill` and search box. Terms from the glossary: **Delinquent**, **Good standing**, **Overdue**, **Balance**. The column is "Overdue", not "Past due" or "Arrears".
- **Mobile-first:** cards below 640 px with lot and overdue amount first; the treasurer approves on the phone and may check the list there. Primary action (story 20) sits at the bottom of each card.
- **States:** empty (all paid), empty (nothing overdue yet), loading skeleton of 5 rows, error with retry, filtered-empty ("No households 4+ months overdue").
- **Forms:** search is debounced (200 ms) and re-renders only the list.
- **Safe actions:** none on this page by itself (sending is REQ-020).
- **Stable layout:** the pending-payment flag line reserves its space on every card, so cards don't change height as data loads.
- **Roles:** treasurer and admin office full; board read-only (no tick boxes, no send buttons, enforced by the send function too); homeowners and guards refused by rules. Hidden is not protected: Sol Arch to confirm rules deny other households' totals to homeowners.
- **Privacy (RA 10173):** the list never leaves the staff screens. No "print the delinquent list" button. There are NPC cases about HOAs posting delinquent lists (for example NPC 21-010 to 21-015); the BA has not verified their outcome, so the DPO should advise before anyone shares this list outside the treasurer, office and board.

## Copy of record

| Where | Text |
|---|---|
| Page heading | Delinquent accounts |
| Summary | {n} delinquent households · {amount} overdue |
| Columns | Household · Months overdue · Overdue · Total balance · Last notice |
| Chips | All ({n}) · 1 month ({n}) · 2–3 months ({n}) · 4+ months ({n}) · Deactivated ({n}) |
| Oldest overdue | Oldest overdue: {period} |
| Pending flag | Payment pending approval: {amount} · Review payment |
| Last notice none | None sent |
| Standing pills | Delinquent · Good standing |
| Empty, all paid | No delinquent accounts. Every household is in good standing. |
| Empty, nothing overdue yet | No bills are overdue yet. Households appear here the day after a due date passes. |
| Empty, filter | No households {filter} overdue. |
| Error | Couldn't load delinquent accounts. Check your connection and try again. · Try again |
| No access | You don't have access to this page |

## Out of scope

- Penalties and interest (D2). Overdue is shown without them until the board decides.
- Payment arrangements and instalment plans (EPIC-005 out of scope).
- Sending notices (REQ-020, REQ-021).
- The delinquency and aging report with CSV for the board (story 35, R3).
- Showing delinquency to homeowners (their own standing is on their statement, REQ-009, and dashboard, REQ-015).

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions, rows 1–5 | Owner |
| D2: grace period, penalty and interest | HOA board |
| May the list (or a count) be shown at the general assembly? | HOA board, with the DPO |
| Is a household with only a partly paid overdue month "Delinquent"? This REQ says yes (any unpaid amount after the due date). | HOA board |

## Sol Arch review

Not yet done. Questions for Sol Arch:

1. **Diverges from SA-001 (r2, C4): confirm or reject.** SA-001 §4.2 has `households.standing` and `overdueCount` kept by functions, and §4.3 Flow 2 has `requestBooking` read `standing`. This REQ (decision 5) works standing out on read from `oldestUnpaidDue` by one `shared/domain` rule, with no daily job, and REQ-034 uses the same rule in `requestBooking`. If rejected in favour of a daily job, REQ-018 and REQ-034 both need revising.
2. Aggregation for the summary line and chip counts at 623 households: count/sum queries or kept totals, and the read cost per page open.
3. Indexes for `active`, `oldestUnpaidDue`, `lotKey`, and for the "Deactivated" filter.
4. Size: the backlog says S. With the overdue fields threaded through REQ-008/012/014, the BA expects S for the page plus about 1 day in the ledger functions.
