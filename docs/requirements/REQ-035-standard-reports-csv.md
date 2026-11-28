# REQ-035: Standard reports with CSV download

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-007 Admin dashboard and reports](../epics/EPIC-007-admin-dashboard-and-reports.md) |
| Backlog story | [35 Standard reports with CSV download](../backlog/BACKLOG.md#35-standard-reports-with-csv-download) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 35A–35E of the records and reports mockup (not yet published as an artifact). Repo copy: [req-035-039-mockup.html](../mockups/req-035-039-mockup.html) |
| Architecture | SA-001 §4.2 (`monthlyTotals`, `receipts`, `expenses`), §4.4 item 1 (reports read server-kept totals, not history), §8.2 (RA 10173), §9 ("Exports that are not official (CSV) stay in the browser"), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-002 (roles), REQ-006 (activity log), REQ-018 (delinquent list and aging rule), REQ-023 (collections by month), REQ-024 (fund summary and closed months). The last three reports also need REQ-031–033 (bookings), REQ-026–027 (requests) and REQ-028–029 (vehicles) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (one Reports page with six reports), B (a "Download CSV" button on the pages that already exist) | **A**, released in two slices: the three money reports first, the other three as their features ship |
| 2 | How the Delinquency and aging report spreads an overdue balance. **Per bill:** each unpaid bill goes in the column for its own age (Blk 3 Lot 2, three months behind at ₱1,800 a month, shows ₱1,800 under "1 month" and ₱3,600 under "2–3 months"). **Per household (mock-up):** the whole overdue amount goes in one column, chosen by how many months are overdue (₱5,400 under "2–3 months") | **Per bill.** It is how accountants read aging, and it shows how much of the debt is oldest. It must use the same aging rule as REQ-018, kept in `shared/domain/aging.js` |
| 3 | Which roles see the reports that list households by name and balance (Collection, Delinquency and aging, Vehicle registry) | **Treasurer all six. Admin office: Amenity utilisation, Requests summary, Vehicle registry. Board: Income and expense, Amenity utilisation, Requests summary only.** The board sees named balances only if it decides it needs them (same principle as REQ-002's open question on the directory) |
| 4 | Keep the mock-up's "Copy as CSV" button | **Drop it.** One action ("Download CSV") is enough. Google Sheets and Excel both open the file, and a clipboard copy of personal data leaves no record |

## Problem

The treasurer prepares the board's monthly papers by retyping figures into spreadsheets (EPIC-007). The mock-up's Reports page (`aRep()`, `index.html` line 852) has six reports with "Copy as CSV" and "Download CSV". In the mock-up:

- figures are recalculated in the browser from every record (SA-001 §4.4 item 1), which the real app must not do at 623+ households;
- the CSV writer (`toCSV`, line 1003) quotes commas but does nothing about **formula injection**: a name or vendor typed as `=HYPERLINK(...)` runs as a formula when the treasurer opens the file in Excel;
- the aging report puts a household's whole overdue amount in one column;
- every report carries personal data (names, lots, balances, plates), and nothing says who may download it or records that they did.

Who has the problem: the [Treasurer](../product/PERSONAS.md#treasurer), monthly; the [Board member](../product/PERSONAS.md#board-member), who reads the result.

**Challenge.** EPIC-007's open question is still open: nobody has collected the reports the board uses today. Before this is built, the treasurer should send one month's board papers. If they use only collections and the fund summary, Option B is enough.

## Options

### Option A: One Reports page with six standard reports (recommended)

- **How it works:** staff menu → Reports. Pick a report and, where it applies, a period. The report shows on screen and "Download CSV" saves exactly the rows on screen. Reports: Collection, Delinquency and aging, Income and expense statement (slice 1); Amenity utilisation, Requests summary, Vehicle registry (slice 2, each once its feature is released).
- **Where it lives:** staff navigation, "Reports" (already in REQ-002's treasurer and board menus).
- **Cost:** moderate. One report screen and one CSV writer shared by all six; six row builders that read server-kept totals; rules tests per role.
- **Excludes:** homeowners and guards. Works on a phone, but the CSV is meant for a laptop.
- **Honest downside:** six reports to keep in step with the pages they summarise. Each one is tested against its source page.

### Option B: "Download CSV" on the pages that already exist

- **How it works:** no Reports page. Collections by month (REQ-023), the delinquent list (REQ-018), the fund summary (REQ-024), and the booking, request and vehicle lists each get a "Download CSV" button for what they show.
- **Cost:** cheap to moderate. Same CSV writer, no new screen.
- **Honest downside:** no aging columns unless they are added to the delinquent list; six different layouts; nowhere a board member goes for "the reports".

### Recommendation

**Option A**, in two slices. The board papers need the three money reports together, with the same header and period, and the aging columns exist nowhere else. The CSV writer, the formula guard and the download record are the same in both options, so B saves only the page itself.

## Story

As a treasurer, I want ready-made reports I can download as CSV for Excel or Google Sheets, so that I can prepare the board's monthly papers without retyping figures.

## Acceptance criteria (Option A, per-bill aging, roles as recommended)

```gherkin
Feature: Standard reports

  # Unless a scenario names another role, the treasurer is signed in and has opened Reports.

  Scenario: The CSV matches the screen
    Given 17 dues payments totalling ₱30,600.00 were approved in November 2026
    When the treasurer picks "Collection report" and "November 2026"
    Then the report lists 17 receipts and the total reads ₱30,600.00
    When the treasurer presses "Download CSV"
    Then a file named "Collection-report_2026-11.csv" is saved
    And opened in Excel it has a header row, 17 receipt rows and a last row "Total" with 30600.00
    And each amount is a number Excel can add up, with no peso sign or thousands separator

  Scenario: The CSV has every row, not only the page on screen
    Given the Delinquency and aging report has 120 households and the screen shows 50 at a time
    When the treasurer presses "Download CSV"
    Then the file has 120 household rows and a "Total" row

  Scenario: Voided and pending payments are not collections
    Given OR-00093 for ₱1,800.00 was voided and a ₱3,600.00 payment is pending approval in November 2026
    When the treasurer opens the Collection report for November 2026
    Then OR-00093 is not listed and neither payment is in the total
    And the total equals the total on Accounting, Collections for November 2026

  Scenario: Aging spreads each bill by its own age
    Given dues are ₱1,800.00 a month and Blk 3 Lot 2 has not paid August, September or October 2026
    And today is Nov 28, 2026
    When the treasurer opens "Delinquency and aging"
    Then Blk 3 Lot 2 shows ₱1,800.00 under "1 month", ₱3,600.00 under "2–3 months" and ₱5,400.00 under "Total overdue"
    And its unpaid November 2026 bill shows under "Not yet due"

  Scenario: Aging agrees with the delinquent list
    When the treasurer opens "Delinquency and aging"
    Then the number of households and the total overdue equal the totals on Collections, Delinquent accounts

  Scenario: The income and expense statement agrees with the fund summary
    Given the October 2026 fund summary opens at ₱185,000.00 and closes at ₱187,850.00
    When the treasurer opens "Income and expense statement" for October 2026
    Then "Opening fund balance" reads ₱185,000.00 and "Closing fund balance" reads ₱187,850.00
    And each expense category equals the category total on Accounting for October 2026

  Scenario: A month that is not closed is labelled
    Given November 2026 is not closed
    When the treasurer opens any report for November 2026
    Then the report header reads "November 2026 is not closed. Figures may still change."
    When the treasurer opens the same report for October 2026, which is closed
    Then the header reads "October 2026 is closed."

  Scenario: A period with no data
    When the treasurer picks a month with no collections
    Then the report reads "No data for this period."
    And "Download CSV" is disabled

  Scenario: Text that looks like a formula is not run
    Given a household's owner name was saved as "=HYPERLINK(""http://example.com"",""Click"")"
    And one of its November 2026 payments has the reference number "-0042 7781"
    When the treasurer downloads the Collection report for November 2026 and opens it in Excel
    Then those two cells show the text exactly as typed, with no link and no formula
    And the Amount column is still made of numbers that Excel can add up

  Scenario: Negative amounts stay numbers
    When the treasurer downloads the Income and expense statement for October 2026
    Then each expense line, such as "Expense: Utilities", has a negative number like -1500.00 that Excel can add up

  Scenario: Names with ñ and accents survive the download
    Given a homeowner named "Peñaflor" paid in November 2026
    When the treasurer downloads the Collection report and opens it in Excel by double-click
    Then the name reads "Peñaflor"

  Scenario Outline: Each role sees only its reports
    Given a person with <role> opens Reports
    Then the report picker lists "<shown>"
    And it does not list "<hidden>"

    Examples:
      | role           | shown                        | hidden                |
      | the admin role | Vehicle registry             | Collection report     |
      | the board role | Income and expense statement | Delinquency and aging |

  Scenario: The treasurer sees every released report
    Given all six reports' features are released
    When the treasurer opens the report picker
    Then it lists all six reports

  Scenario: A hidden report is also refused by the server
    Given a board member is signed in
    When their device asks for the receipts behind the Collection report
    Then the request is refused

  Scenario: A report whose feature isn't released isn't offered
    Given vehicle registration is not yet released
    When the treasurer opens the report picker
    Then "Vehicle registry" is not listed

  Scenario: Every download is recorded
    When the treasurer downloads the Delinquency and aging report
    Then the activity log shows "Downloaded Delinquency and aging, as of Nov 28, 2026" with the treasurer's name and the time
    And the log entry holds no homeowner names or amounts

  Scenario: Loading and errors
    When the treasurer picks a report
    Then a skeleton table shows until the rows arrive, and "Download CSV" is disabled
    Given the connection drops while the report loads
    Then the report reads "Couldn't load this report. Check your connection and try again." with a "Try again" button
    And "Download CSV" stays disabled

  Scenario: Readable on a phone
    Given a board member opens the Income and expense statement on a screen 375 px wide
    Then the totals show first, then one card per line item
    And the page does not scroll sideways
```

## The six reports

| Report | Period | Columns (CSV header, in order) | Source | Roles (recommended) | Slice |
|---|---|---|---|---|---|
| Collection report | Month | Date, OR no., Lot, Homeowner, Reference no., Amount | Approved, non-void receipts in the month (REQ-012, REQ-023) | Treasurer | 1 |
| Delinquency and aging | As of today | Lot, Homeowner, Not yet due, 1 month, 2–3 months, 4+ months, Total overdue, Last notice | Unpaid bills per household, aging rule from REQ-018 | Treasurer | 1 |
| Income and expense statement | Month | Line item, Amount | `monthlyTotals/{period}` and expenses by category (REQ-022, REQ-024) | Treasurer, Board | 1 |
| Amenity utilisation | Month | Amenity, Approved, Pending, Rejected or cancelled, Slot-hours booked, Fees | Bookings in the month (REQ-031–033). Deposits are not fees | Treasurer, Admin, Board | 2 |
| Requests summary | Month opened | Category, Open, In Progress, Resolved, Total | Requests opened in the month, status as of today (REQ-026–027) | Treasurer, Admin, Board | 2 |
| Vehicle registry | As of today | Sticker, Plate, Vehicle, Type, Lot, Homeowner | Approved vehicles (REQ-029) | Treasurer, Admin | 2 |

Aging columns: "Not yet due" is billed and unpaid, before its due date. "1 month" is a bill one month past its due date (October's bill on Nov 28), "2–3 months" two or three, "4+ months" four or more. If D2 adds penalties, they age with the bill they belong to (REQ-018 decides).

## Data changes

| What | Where | Written by | Read by |
|---|---|---|---|
| No new stored data for the reports themselves. Rows are built from existing collections | `receipts`, `bills`, `households` totals, `monthlyTotals`, `expenses`, `bookings`, `tickets`, `vehicles` | Existing functions and triggers | The Reports page, under each role's rules |
| No new aging field. The report reads REQ-018's unpaid bills summary, one document per delinquent household, and puts each bill in its column against today, with REQ-018's grace days (D2) | `households/{id}.unpaidBills` `[{period, dueDate, unpaidCentavos}]` (REQ-018) | REQ-018's functions | Treasurer |
| Download record: actor, report type, period, row count, time. No names, lots or amounts | `auditLog` `{action: 'report.download', actor, reportType, period, rowCount, at}` | A function (clients can't write the audit log, SA-001 §3) | Treasurer, board (REQ-006 screen) |
| Index for the Collection report | `receipts` (`period`, `approvedAt`) | — | — |

**CSV format** (shared module, `shared/domain/csv.js`, unit-tested):

- UTF-8 **with a byte-order mark**, so Excel on Windows shows ñ and ₱ correctly when the file is double-clicked; comma separator; CRLF line ends; RFC 4180 quoting (fields with a comma, quote or line break are wrapped in quotes, quotes doubled).
- Amounts as plain numbers with two decimals, no peso sign, no thousands separator; negatives as `-1500.00`, not in brackets. Dates as `2026-11-28`.
- **Formula guard:** any **text** cell starting with `=`, `+`, `-`, `@`, tab, carriage return or line feed, or a full-width `＝ ＋ － ＠`, gets a leading apostrophe. Number cells are written as numbers and never prefixed. This follows OWASP's CSV Injection guidance, which also warns that no quoting is fully reliable once a file is re-saved in Excel ([OWASP, fetched 2026-11-28](https://community.owasp.org/attacks/CSV_Injection)). So text from homeowners (names, reference numbers, notes) and from staff (vendors, descriptions) always goes through the guard.
- File name: `<Report-name>_<YYYY-MM>.csv` or `<Report-name>_as-of_<YYYY-MM-DD>.csv`. Never a person's name.
- First row is the header; the last row is "Total" where the report has totals.

## UX/UI notes

- **Accessibility:** report and period pickers are labelled selects. The table has a `<caption>` with the report title and period. Money columns are right-aligned with tabular figures. Negative amounts are shown as "(₱1,500.00)" on screen and announced as "minus" by screen readers (`aria-label`). The "not closed" note is text, not only an amber colour. Download is a button with a 44 px target.
- **Consistency:** report names use the glossary: "Collections", "Overdue", "Request", "Booking", "Fee", "Deposit". The mock-up's "Delinquency & aging" and "Income & expense statement" are spelled out with "and", and "Amenity utilization" becomes "Amenity utilisation", matching the backlog. The picker and table reuse the mock-up's `.card`, `.tbl`, `select` and `tfoot` styles.
- **Mobile-first:** at 375 px, the totals row shows first as a card, then one card per row with the first column as the heading and the other columns as label and value. No sideways scroll.
- **States:** empty ("No data for this period."), loading (skeleton rows, Download disabled), error (plain words and "Try again"), not-closed month (header note), released-later reports (not listed, so no dead end).
- **Forms:** no data entry. The period defaults to the latest closed month for monthly reports, so board papers default to figures that won't change.
- **Safe actions:** downloading is repeatable, so no "Saving…" guard. Each download is logged.
- **Stable layout:** the "not closed" note reserves its line, so switching months doesn't move the table.
- **Roles:** the picker is filtered by role, and the rules refuse the underlying reads (hidden is not protected). Every report is in the rules test matrix for every role.
- **Privacy (RA 10173):** under the Download button: "This file contains personal data. Keep it only where the HOA keeps its records, and delete copies you no longer need." Shown for reports with names; not for the Income and expense statement or Requests summary.

## Copy of record

| Where | Text |
|---|---|
| Page heading and lead | Reports · Pick a report and period. Download it as CSV for Excel or Google Sheets. |
| Report picker labels | Collection report · Delinquency and aging · Income and expense statement · Amenity utilisation · Requests summary · Vehicle registry |
| Report header line | {HOA name} · Prepared {Nov 28, 2026} by {staff name} |
| Closed month | {October 2026} is closed. |
| Open month | {November 2026} is not closed. Figures may still change. |
| Button | Download CSV |
| Empty | No data for this period. |
| Error | Couldn't load this report. Check your connection and try again. · Try again |
| Privacy note | This file contains personal data. Keep it only where the HOA keeps its records, and delete copies you no longer need. |
| Activity log line | Downloaded {report}, {period} |
| Aging column headings | Not yet due · 1 month · 2–3 months · 4+ months · Total overdue · Last notice |

## Out of scope

- A custom report builder; scheduled or emailed reports (EPIC-007 out of scope).
- Aging as of a past date. Aging is "as of today" only; the history needed for past dates isn't kept.
- PDF versions of these six reports. The board report (REQ-039) is the PDF.
- Excel `.xlsx` files. CSV opens in both Excel and Google Sheets.
- "Copy as CSV" (if owner decision 4 is accepted).

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions 1–4 | Owner |
| Which reports does the board use today? Send one month's board papers (EPIC-007) | Treasurer |
| Should the board see named balances (Collection, Delinquency and aging)? | HOA board, with the DPO |
| How long may staff keep downloaded files with personal data on their own laptops? | HOA board with the DPO |

## Sol Arch review

Not yet done. Points for Sol Arch:

1. **Where rows are built.** SA-001 §9 keeps CSV in the browser. Rows can be read in the browser under rules, with a small callable only to write the download record; or a `buildReport` callable can check the role, read, log and return rows in one place. Which, and what does each cost in reads? The aging report is the large one (up to about 150 delinquent households).
2. **Aging source.** REQ-018 keeps `households/{id}.unpaidBills` and queries delinquent households by `oldestUnpaidDue`. Confirm the aging report can use the same query and bucket each bill in `shared/domain/aging.js`, with no extra stored field.
3. **Rules for the board** (decision 3): can the board read `monthlyTotals` and expense totals without reading `receipts` and `bills`?
4. **"Matches the page" tests.** Confirm the Collection, aging and I&E totals can be asserted against REQ-023, REQ-018 and REQ-024 in end-to-end tests with seeded data.
5. **Size.** The backlog says M (2–3 days). The BA's read: slice 1 about 2–3 days, slice 2 about 1–1.5 days.
