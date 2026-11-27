# EPIC-007: Admin dashboard and reports

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R2, R3 |
| Stories | 25, 35 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Treasurer](../product/PERSONAS.md#treasurer), [Board member](../product/PERSONAS.md#board-member) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

The treasurer prepares board papers by retyping figures into spreadsheets. The mock-up has an operations dashboard and six standard reports with CSV download.

## Goal and success metrics

Monthly board papers come straight out of the portal.

| Measure | Baseline | Proposed target |
|---|---|---|
| Hours to prepare the monthly board report | to measure before launch | under 1 hour |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Operations dashboard tiles that match the pages they summarise
- Six standard reports with CSV download

## Out of scope

- A custom report builder
- Scheduled reports sent by email

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 25 | [Admin operations dashboard](../backlog/BACKLOG.md#25-admin-operations-dashboard) | Should | S | R2 | 18, 23, 24 |
| 35 | [Standard reports with CSV download](../backlog/BACKLOG.md#35-standard-reports-with-csv-download) | Should | M | R3 | 18, 23, 24 |

## Dependencies on other epics

- Story 18 Delinquent accounts list (Collections and notices)
- Story 23 Collections by month (Accounting and fund)
- Story 24 Fund summary and closing a month (Accounting and fund)

## Risks

- Dashboard figures that don’t match the detailed pages destroy trust in both. Mitigation: story 25 tests each tile against its source page.

## Open questions

| Question | Who decides |
|---|---|
| Which reports does the board use today? Collect a sample of each. | Treasurer |

## Release slicing

Story 25 in R2. Story 35 in R3, once vehicles, bookings and requests exist to report on.
