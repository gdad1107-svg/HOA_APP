# REQ-025: Admin operations dashboard

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-007 Admin dashboard and reports](../epics/EPIC-007-admin-dashboard-and-reports.md) |
| Backlog story | [25 Admin operations dashboard](../backlog/BACKLOG.md#25-admin-operations-dashboard) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 25A–25D of the R2 collect-and-account mockup. Repo copy: [req-018-027-mockup.html](../mockups/req-018-027-mockup.html). Not yet published as an artifact (main session to publish and put the link here) |
| Architecture | SA-001 §4.2 (`monthlyTotals`, household totals), §4.4 item 1 (dashboards read totals, not history), §7 (read-count tests; "biggest cost risk: a dashboard that reads history"), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-018 (delinquent figures), REQ-023 (collections), REQ-024 (fund summary), REQ-012 (pending payments), REQ-006 (activity log), REQ-026/027 (open requests) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation; the owner decides.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (figures plus a "Needs attention" list, by role), B ("Needs attention" list only) or C (no dashboard; staff land on their main queue) | **A**, but small: four tiles, one chart, one list. Nothing on it that isn't a link to the page it summarises |
| 2 | What each role sees | **Treasurer:** all tiles. **Board:** money tiles and chart, read-only. **Admin office:** "Needs attention" for their own work (requests; bookings and vehicles from R3) and no money tiles (they don't see payments, REQ-002 decision 3) |
| 3 | "Receivables": every positive balance, or only the overdue part | **Show both on the tile:** "Receivables ₱X" with "₱Y overdue · n delinquent households". The mock-up shows only the total, which includes the month not yet due |
| 4 | Recent activity panel (from the activity log, REQ-006) | **Treasurer and board only**, the last 7 entries, each linking to its record |

## Problem

The treasurer opens four or five pages to answer "where do we stand this month?" ([Treasurer](../product/PERSONAS.md#treasurer)), and board papers are retyped into spreadsheets (EPIC-007). The mock-up's dashboard (`aDashOps()`, line 722) has the right tiles, but each is recomputed in the browser from every bill, payment and expense ever recorded (`ledger()` per household, `fundFor()` from the start of time). At 623+ households that is thousands of reads per page open, which SA-001 §7 calls the biggest cost risk.

**Is it worth building?** Yes, if it stays small. Its value is the "Needs attention" list (what is waiting for me) and figures that agree with the detailed pages. A dashboard with figures that don't match destroys trust in both (EPIC-007 risk).

## Options

### Option A: Four tiles, a chart and "Needs attention", by role (recommended)

- **How it works:** Dashboard is the first staff page after sign-in. Tiles: Collected this month (with % of billed), Receivables (with overdue and delinquent count), Expenses this month (with fund balance), Pending approvals. Below: collections vs expenses for the last 6 months, "Needs attention" (payments waiting, notices ready to send, requests with no reply for 2 working days, a month ready to close), and recent activity. Every figure links to its page.
- **Cost:** cheap (backlog S), as long as every figure is read from a kept total.
- **Honest downside:** another place figures must agree; each tile needs a test against its source page.

### Option B: "Needs attention" list only

- **How it works:** no figures; just the to-do list with counts and links.
- **Cost:** cheap.
- **Honest downside:** the board and treasurer still go to three pages for the month's figures.

### Option C: No dashboard

- **How it works:** the treasurer lands on Approvals, the office on Requests.
- **Cost:** none.
- **Honest downside:** nothing tells the treasurer a month is ready to close or notices are due.

### Recommendation

**Option A**, kept to what is listed here.

## Story

As a treasurer, I want one page with this month's collections, receivables, expenses and pending approvals, so that I can see where things stand without opening every page.

## Acceptance criteria (Option A)

```gherkin
Feature: Admin dashboard

  Scenario: Tiles match the pages they summarise
    Given the treasurer is signed in on Nov 28, 2026
    When they open the Dashboard
    Then "Collected · November 2026" equals the total in Accounting, Collections for November 2026
    And "Expenses · November 2026" equals the total in Accounting, Expenses for November 2026
    And "Fund balance" equals the closing figure in the November 2026 fund summary
    And "Receivables" equals the sum of every active household's positive balance
    And its overdue figure and delinquent count equal the Delinquent accounts summary line

  Scenario: Collection rate on the tile
    Given ₱56,070.00 was billed and ₱30,600.00 collected for November 2026
    Then the "Collected · November 2026" tile reads "₱30,600" with "55% of ₱56,070 billed"

  Scenario: Pending approvals in R2
    Given 3 payments are waiting for approval
    Then the "Pending approvals" tile reads 3 with "3 payments" and "Review"

  Scenario: Pending approvals once R3 ships
    Given 3 payments, 3 bookings and 2 vehicles are waiting
    Then the "Pending approvals" tile reads 8 with "3 payments · 3 bookings · 2 vehicles"

  Scenario: Needs attention
    Given 3 payments are waiting, 12 households are ready for their next notice, 2 requests have had no reply for 2 working days, and it is Dec 2, 2026 with November 2026 open
    Then "Needs attention" lists "3 payments to review", "12 households ready for their next notice", "2 requests with no reply for 2 working days" and "November 2026 is ready to close"
    And each item opens its page

  Scenario: Nothing needs attention
    Given nothing is waiting
    Then "Needs attention" reads "You're up to date."

  Scenario: Collections vs expenses chart
    Given monthly totals exist for June to November 2026
    Then the chart shows collections and expenses for each of those 6 months
    And each bar's value can be read as text, not only from its height

  Scenario: A new portal
    Given nothing has been collected yet
    Then the chart shows "No collections recorded yet" instead of empty bars
    And the money tiles read "₱0"

  Scenario: The page reads totals, not history
    Given 700 households and 12 months of bills, payments and expenses in the test data
    When the treasurer opens the Dashboard
    Then the page reads no more than 30 documents (checked by an automated read-count test)

  Scenario: The dashboard is current when opened
    When the treasurer approves a payment and returns to the Dashboard
    Then "Collected · November 2026" includes it
    And the page shows "As of 10:42 AM" with "Refresh"

  Scenario: Part of the page can't load
    Given the activity log can't be read because of a network error
    Then the tiles and chart still show
    And the activity panel reads "Couldn't load recent activity. Try again."

  Scenario: A board member's dashboard (decision 2)
    Given a board member is signed in
    When they open the Dashboard
    Then they see the money tiles, the chart and recent activity
    And they see no "Review" buttons and no "Needs attention" list

  Scenario: An admin office staff member's dashboard (decision 2)
    Given an admin office staff member is signed in
    When they open the Dashboard
    Then they see "Needs attention" with requests (and, from R3, bookings and vehicles)
    And they see no money tiles
    And their device's request for monthly totals is refused

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then the tiles stack in one column with "Needs attention" first for the treasurer
    And the page does not scroll sideways
```

## Data changes

None new, if REQ-018, REQ-023 and REQ-024 keep their totals. The page reads:

| Figure | From |
|---|---|
| Collected, billed, expenses, fund balance; chart | `monthlyTotals/{period}` for the current month and the 5 before it (6 reads) |
| Receivables, overdue, delinquent count | A kept total, e.g. `totals/receivables`: `balanceCentavos`, `overdueCentavos`, `delinquentCount` (Sol Arch: a kept document, or an aggregation query; overdue changes with the calendar, see REQ-018) |
| Pending approvals | Count queries on `payments` (status pending); from R3 `bookings` and `vehicles` |
| Notices ready | Count from REQ-018's query (next notice can be sent now) |
| Requests with no reply | Count query on `tickets` (`status == Open`, `lastStaffReplyAt == null`, `createdAt` older than 2 working days), REQ-027 |
| Recent activity | `auditLog`, newest 7 |

## UX/UI notes

- **Accessibility:** each tile is a heading, a value and a link with a full name ("Review 3 payments"), not only "Review". The chart has a table alternative ("Show as table") and bar values as text; colour is not the only way to tell collections from expenses (legend plus pattern or label).
- **Consistency:** reuses the mock-up's `.tiles`, hero tile, chart and `.news` activity list. Tile names use glossary terms: **Collections** ("Collected"), **Balance**, **Overdue**, **Fund balance**.
- **Mobile-first:** one column at 375 px. For the treasurer, "Needs attention" comes first on a phone (that's why they open it there).
- **States:** new portal (zeros and the chart's empty message); loading skeleton per tile; a failure in one panel doesn't blank the page; "As of {time}" with Refresh.
- **Safe actions:** none; read-only.
- **Stable layout:** tiles have fixed heights; the second line ("55% of … billed") reserves its space while loading.
- **Roles:** tiles are chosen by role, and rules refuse the data behind tiles a role shouldn't see (admin office can't read `monthlyTotals`).

## Copy of record

| Where | Text |
|---|---|
| Tiles | Collected · {Month YYYY} · {p}% of {billed} billed |
| | Receivables · {amount} overdue · {n} delinquent households · Collections |
| | Expenses · {Month YYYY} · Fund balance {amount} · Accounting |
| | Pending approvals · {a} payments · {b} bookings · {c} vehicles · Review |
| Chart | Collections vs expenses · Last 6 months · Show as table |
| Chart empty | No collections recorded yet |
| Needs attention | {n} payments to review · {n} households ready for their next notice · {n} requests with no reply for 2 working days · {Month YYYY} is ready to close |
| Nothing waiting | You're up to date. |
| Freshness | As of {time} · Refresh |
| Panel error | Couldn't load recent activity. Try again. |
| Activity heading | Recent activity |

## Out of scope

- Standard reports and CSV downloads (story 35, R3).
- Custom tiles, date ranges or a report builder (EPIC-007).
- Live-updating tiles (the page refreshes on open and on "Refresh").

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions, rows 1–4 | Owner |
| Is "2 working days" right for a first reply? It is the EPIC-008 target. Which days are working days at the office? | Admin office |

## Sol Arch review

Not yet done. Questions for Sol Arch:

1. Receivables and delinquent count: a kept document or aggregation queries, given overdue changes with the calendar (REQ-018 note).
2. A read budget for the dashboard (the BA proposed 30 documents); is it right?
3. "Requests with no reply" needs `lastStaffReplyAt` on tickets (REQ-027).
4. Size: S confirmed, if REQ-018/023/024 keep their totals?
