# EPIC-006: Accounting and fund

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R2 |
| Stories | 22, 23, 24 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Treasurer](../product/PERSONAS.md#treasurer), [Board member](../product/PERSONAS.md#board-member) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

The treasurer needs the association’s money in one place: what came in, what went out, and the fund balance. In the mock-up an expense can be deleted for good, leaving no trail, and a reported month can still change.

## Goal and success metrics

The fund balance in the portal matches the bank, and a month reported to the board doesn’t change afterwards.

| Measure | Baseline | Proposed target |
|---|---|---|
| Months closed within 10 days of month end | not applicable | every month |
| Difference between portal fund balance and bank balance at close | to measure | ₱0, or explained in a note |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Recording expenses with a receipt photo; voiding instead of deleting
- Collections by month, with deposits kept out of income
- Fund summary and closing a month

## Out of scope

- A full general ledger or double-entry accounting
- Bank feeds and automatic reconciliation
- Budgets, payroll and tax filing

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 22 | [Record an expense](../backlog/BACKLOG.md#22-record-an-expense) | Must | M | R2 | 02, 06 |
| 23 | [Collections by month](../backlog/BACKLOG.md#23-collections-by-month) | Must | S | R2 | 12 |
| 24 | [Fund summary and closing a month](../backlog/BACKLOG.md#24-fund-summary-and-closing-a-month) | Should | M | R2 | 22, 23 |

## Dependencies on other epics

- Story 02 Roles and permissions enforced on the server (Access and households)
- Story 06 Activity log of money and record changes (Access and households)
- Story 12 Approve or reject a payment (Payments and receipts)

## Risks

- A wrong opening fund balance makes every month wrong. Mitigation: the opening balance is entered once at setup and approved by the board.
- Deposits counted as income overstate the fund. Mitigation: story 23 keeps deposits separate.

## Open questions

| Question | Who decides |
|---|---|
| What opening fund balance should the portal start from, and as of which date? | Treasurer |
| Who may reopen a closed month? | HOA board |
| Do expenses need a second person to approve them? | HOA board |

## Release slicing

Stories 22 and 23 first. Story 24 (close a month) once two months of data have been entered.
