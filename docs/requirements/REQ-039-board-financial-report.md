# REQ-039: Board financial report

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-012 Board financial report](../epics/EPIC-012-board-financial-report.md) |
| Backlog story | [39 Board financial report](../backlog/BACKLOG.md#39-board-financial-report) |
| Status | **Draft for owner review**. Sol Arch review not yet done. **Waits on board decision D6** (typed in, or calculated from portal records) |
| Mockup | Screens 39A–39D of the records and reports mockup (not yet published as an artifact). Repo copy: [req-035-039-mockup.html](../mockups/req-035-039-mockup.html) |
| Architecture | SA-001 §4.2 `monthlyTotals/{period}` (`billedCentavos`, `duesCentavos`, `feesCentavos`, `expensesCentavos`, `closed`), §4.4 item 1 (reports read totals), R-11 (totals drift), §9 (PDFs by functions), §11.3 Q5 (typed or calculated), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-024 (fund summary and closing a month), REQ-023 (collections by month), REQ-022 (expenses and categories), REQ-003 (each household's phase), REQ-002 (board read-only). REQ-037 uses this report to answer homeowners' "Board financial report" requests |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation. Decision 1 is the board's **D6**.

| # | Decision | Recommended |
|---|---|---|
| 1 | **D6**: Option A (typed in by the treasurer), B (calculated from portal records, closed months only), C (B plus typed figures for months before the portal), or D (no in-portal report; the board's spreadsheet uses REQ-035's CSVs) | **B.** Figures can't disagree when they come from the same records. For the first general assembly, if most months are before launch, use **D** for that year rather than building C |
| 2 | Which months the report may cover | **Closed months only** (REQ-024). Once the board presents a report, its figures don't change |
| 3 | "Dues collection rate" | **Dues collected in the range ÷ dues billed in the range**, with a note that it can pass 100% when arrears are paid. This is the same rule as REQ-024's collection rate, so the two pages agree. Drop the mock-up's "Below 70% target" pill unless the board sets a target |
| 4 | Spending sections. The mock-up has two ("How funds were spent", including debt payments and equipment, and "Cost and expenses", excluding them) with categories the portal doesn't have | **One section, "Spending by category"**, using REQ-022's expense categories. A split between operating and other spending waits until REQ-022's categories carry that flag |
| 5 | What the mock-up calls "Others" income | **"Amenity fees"**, the only other income the portal records (glossary: collections are dues and amenity fees). Other income, if any, is out of scope until REQ-023 records it |

## Problem

The board presents the association's finances at the general assembly, and figures that disagree destroy trust (EPIC-012). The mock-up's report (`finReport()`, `index.html` line 915, shown on the Dashboard's "Financial report" tab) uses **typed-in figures** (`FIN`, line 891), and its August dues by phase add up to ₱97,456 while August's monthly collections show ₱114,640: ₱17,184 apart. The mock-up spots the gap but can't explain it.

Who has the problem: the [Board member](../product/PERSONAS.md#board-member), monthly at board meetings and yearly at the assembly; the [Treasurer](../product/PERSONAS.md#treasurer), who prepares the figures today.

**Challenge.** This is a *Could*. REQ-035's Income and expense statement and REQ-024's fund summary already give the board correct numbers as CSV. What this REQ adds is the visual summary and a single PDF for the assembly. If the board is happy to build its slides from CSVs, Option D costs nothing. A calculated report also has nothing to show until the HOA has closed a few months on the portal, so it should be built no earlier than about three closed months after launch.

## Options

### Option A: Typed in by the treasurer (mock-up)

- **How it works:** Settings → Board report. The treasurer types each month's dues, other income, dues by phase, revenue and spending. The report checks that phase totals equal each month's dues and flags any gap.
- **Cost:** moderate: an entry form with checks, the report and the PDF.
- **Excludes:** nothing; works for months before the portal.
- **Honest downside:** the treasurer enters every figure twice (once in the books, once here). Typed figures can disagree with the portal's own pages, and the check catches only one kind of disagreement.

### Option B: Calculated from portal records, closed months only (recommended)

- **How it works:** Dashboard → Financial report (board, treasurer and admin office). Pick a range of closed months. Every figure comes from the server-kept monthly totals and expenses: revenue (dues billed plus amenity fees), cash collected, collection rate, spending by category, net cash flow, fund balance, monthly collections chart and dues collected by phase. "Download PDF" makes the assembly copy.
- **Cost:** moderate: the report screen (the mock-up's charts carry over), dues by phase added to the monthly totals trigger, a PDF function, rules tests.
- **Excludes:** months before the portal went live.
- **Honest downside:** each household needs its phase on file (the REQ-003 import template has a Phase column), and "Others" income narrows to amenity fees.

### Option C: Calculated, plus typed figures for months before the portal

- **How it works:** B, plus an entry form for pre-launch months. Typed months are labelled "Entered by the treasurer" on screen and in the PDF.
- **Cost:** B plus about 1–1.5 days.
- **Honest downside:** brings back typed figures and their risk, for months that will matter only for the first year.

### Option D: No in-portal report

- **How it works:** the treasurer downloads REQ-035's Income and expense statement and REQ-023's collections, and the board keeps its spreadsheet and slides.
- **Cost:** none.
- **Honest downside:** no charts or phase view in the portal; the treasurer still assembles the presentation by hand, though from correct figures.

### Recommendation

**Option B**, built once the HOA has about three closed months on the portal. Use **D** for the first assembly if most of its months are before launch. C is not worth the risk for one year of history.

## Story

As a board member, I want a visual report of revenue, collections by month and by phase, and spending, so that I can present the association's finances at the general assembly.

## Acceptance criteria (Option B)

```gherkin
Feature: Board financial report

  # A board member is signed in and has opened Dashboard, Financial report, unless a scenario says otherwise.
  # Figures are invented sample data.

  Scenario: Only closed months can be picked
    Given December 2026 to February 2027 are closed and March 2027 is not
    When the board member opens the range picker
    Then the months offered are December 2026 to February 2027
    And March 2027 is not offered

  Scenario: The summary agrees with the fund summary
    Given the range is December 2026 to February 2027
    Then "Fund balance" shows the opening balance of December 2026 and the closing balance of February 2027 from Accounting, Fund summary
    And "Cash collected" equals the sum of the three months' collections on Accounting, Collections
    And "Spending" equals the sum of the three months' expenses, leaving out voided expenses

  Scenario: Revenue and the collection rate
    Given ₱3,364,200.00 in dues was billed and ₱2,860,200.00 in dues was collected over the range, and ₱18,500.00 in amenity fees was collected
    Then "Total revenue" reads ₱3,382,700.00
    And "Dues collection rate" reads 85% with "₱2,860,200 collected of ₱3,364,200 billed"

  Scenario: Monthly collections match each month
    Then the monthly collections chart has one bar per month split into "Association dues" and "Amenity fees"
    And each month's total equals that month's total on Accounting, Collections

  Scenario: Chart has a table for screen readers
    When the board member opens "View as table"
    Then every month's association dues, amenity fees and total are listed

  Scenario: Dues by phase add up to each month's dues
    Then "Dues collected by phase" has a row for each phase and a "Total" row
    And each month's Total equals that month's association dues in the monthly collections table
    And dues from households with no phase on file are in a row "No phase"

  Scenario: Figures that don't agree are flagged
    Given a fault makes dues by phase add up to ₱97,456 for August while monthly collections show ₱114,640
    Then the report shows "Aug figures don't match" with the ₱17,184 difference
    And the August total is highlighted with a warning icon and the words "doesn't match"
    And the downloaded PDF carries the same note

  Scenario: Spending by category
    Then "Spending by category" lists each expense category with its amount and share
    And each category amount equals the category totals on Accounting for the same months

  Scenario: Download for the assembly
    When the board member presses "Download PDF"
    Then the button reads "Preparing PDF…" and is disabled until the file is ready
    And the PDF has the summary, monthly collections, dues by phase and spending by category tables, with the same figures as the screen
    And its footer reads "{HOA name} · Board financial report · December 2026–February 2027 · Generated Mar 10, 2027"

  Scenario: The same range gives the same PDF
    Given a PDF was made for December 2026 to February 2027
    When the treasurer downloads the same range a week later
    Then the figures are identical

  Scenario: A reopened month leaves the picker
    Given the treasurer reopened January 2027 on Accounting, Fund summary (REQ-024)
    When the board member opens the range picker
    Then January 2027 is not offered, and a range across it can't be picked
    And the picker reads "January 2027 was reopened. It returns here when it is closed again."

  Scenario: Months before the portal
    Given the portal's first billed month is December 2026
    Then the picker starts at December 2026
    And the page reads "The portal has figures from December 2026. For earlier months, use the HOA's own records."

  Scenario: No closed months yet
    Given no month has been closed
    Then the Financial report reads "No closed months yet. This report covers closed months only. The treasurer closes a month on Accounting, Fund summary."

  Scenario: Board members can't change anything
    Then the page has no edit, delete or settings controls
    And a homeowner's device asking for the report's monthly totals is refused

  Scenario: Loading and errors
    When the board member picks a range
    Then skeleton tiles and charts show until the figures arrive
    Given the connection drops
    Then the page reads "Couldn't load the report. Check your connection and try again." with "Try again", and "Download PDF" is disabled

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then the summary tiles stack in one column
    And "Dues collected by phase" shows one card per month listing each phase's amount
    And the page does not scroll sideways
```

## Figures and where they come from

| Figure | Definition | Source |
|---|---|---|
| Total revenue | Dues billed + amenity fees, over the range | `monthlyTotals.billedCentavos` + `feesCentavos` |
| Cash collected | Dues collected + amenity fees | `duesCentavos` + `feesCentavos` (REQ-023) |
| Dues collection rate | Dues collected ÷ dues billed, whole percent | as above |
| Spending | Non-void expenses | `expensesCentavos`; categories from `expenses` (REQ-022) |
| Net cash flow | Cash collected − spending | — |
| Fund balance | Opening of the first month, closing of the last | REQ-024 |
| Dues collected by phase | Dues collected per phase per month | **New:** `monthlyTotals.duesByPhaseCentavos` |

## Data changes

| What | Where | Written by | Read by |
|---|---|---|---|
| Dues collected by phase per month, e.g. `{P1: 1010000, P2: 2995600, none: 0}` | `monthlyTotals/{period}.duesByPhaseCentavos` | **The same trigger and transaction** that writes `duesCentavos`, so the two always agree | Board, treasurer, admin |
| Each household's phase | `households/{id}.phase` (REQ-003 import has a Phase column; edit in the household form) | REQ-003 functions | Ledger trigger |
| The phase at the time of payment | `receipts/{orNo}.phase` (copied at approval) | `decidePayment` | Ledger trigger, reconciliation job (R-11) |
| Expense totals by category per month | `monthlyTotals/{period}.expensesByCategoryCentavos` (if REQ-024 doesn't keep it already) | Expense trigger | As above |
| Stored PDF per range | Storage `board-reports/{from}_{to}.pdf`, deleted when any month in the range is reopened | Function | Board, treasurer, admin; homeowners only through REQ-037 |
| Download record | `auditLog` `{action: 'boardReport.download', actor, from, to, at}` | Function | Treasurer, board |

## UX/UI notes

- **Accessibility:** every chart has "View as table" and a text `aria-label` with the figures; colour is never the only signal (the mismatch has an icon and words; bars have a legend and labels). Tiles are headings with values. The range picker is two labelled selects (From, To).
- **Consistency:** the mock-up's "Others" becomes "Amenity fees"; "Cost and expenses" and "How funds were spent" merge into "Spending by category" (decisions 4 and 5). "Revenue" is the board report's term (glossary); "Collections" keeps its glossary meaning. The mock-up's note "Figures as reported by the HOA board" becomes "Calculated from portal records for closed months."
- **Mobile-first:** tiles stack; the chart scales to the screen width; the phase heat-map becomes a card per month at 375 px.
- **States:** no closed months (above); months before the portal (above); loading (skeletons); error (above); PDF preparing ("Preparing PDF…").
- **Forms:** none, other than the range picker. It defaults to the last three closed months.
- **Safe actions:** read-only. The PDF button is disabled while it prepares, so one press makes one file.
- **Stable layout:** tiles and the range picker keep their size between ranges. The mismatch warning, a rare fault message, appears above the phase table and moves only what is below it.
- **Roles:** board, treasurer and admin office read it; guards and homeowners can't (rules). It holds no personal data: no names, lots or balances.

## Copy of record

| Where | Text |
|---|---|
| Tab | Financial report |
| Lead | Board financial report · {December 2026–February 2027} · Calculated from portal records for closed months. |
| Range picker | From · To |
| Tiles | Total revenue · Cash collected · Dues collection rate · Spending · Net cash flow · Fund balance |
| Rate sub-line | {₱2,860,200} collected of {₱3,364,200} billed. Can pass 100% when overdue dues are paid. |
| Sections | Monthly collections · Dues collected by phase · Spending by category |
| Legend | Association dues · Amenity fees |
| Mismatch | {Aug} figures don't match · Dues by phase add up to {₱97,456}, but monthly collections show {₱114,640} for {Aug}, a difference of {₱17,184}. Please check this with the treasurer before sharing the report. |
| No-phase row | No phase |
| Before the portal | The portal has figures from {December 2026}. For earlier months, use the HOA's own records. |
| Reopened month | {January 2027} was reopened. It returns here when it is closed again. |
| Empty | No closed months yet. This report covers closed months only. The treasurer closes a month on Accounting, Fund summary. |
| Error | Couldn't load the report. Check your connection and try again. · Try again |
| Buttons | Download PDF · Preparing PDF… · View as table |

## Out of scope

- Audited financial statements (prepared by the external auditor, EPIC-012).
- Months before the portal (unless Option C is chosen).
- Budgets and targets, including the mock-up's 70% collection target, unless the board sets one.
- Separating operating costs from debt payments and equipment (decision 4).
- Editing or annotating the report in the portal.

## Open questions

| Question | Who decides |
|---|---|
| D6 and owner decisions 2–5 | HOA board (D6), owner |
| What do "Phase 1–4" and "CM" mean, and does every lot belong to one phase? (EPIC-012) | Treasurer |
| When is the next general assembly, and how many of its months will be on the portal? Decides between B and D for the first year | HOA board |
| Should the first calculated report be shown beside the last manual one (EPIC-012 risk)? Recommended yes, done outside the portal | Treasurer |

## Sol Arch review

Not yet done. Points for Sol Arch:

1. **Phase totals** in the same transaction as `duesCentavos`, so they can't drift (R-11); the nightly reconciliation job also recounts them.
2. **Reads:** a 12-month range reads 12 `monthlyTotals` documents. Confirm no history is read.
3. **PDF:** function-rendered, cached per range, invalidated when REQ-024 reopens a month.
4. **Is "Revenue = dues billed + amenity fees" right** with REQ-024's fund formula, and does D2's penalty income belong in it?
5. **Size:** the backlog says M. The BA's read for Option B: about 3 days (report screen reusing the mock-up's charts, phase totals in the trigger, PDF function, rules tests). C adds 1–1.5 days.
