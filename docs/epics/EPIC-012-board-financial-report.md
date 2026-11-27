# EPIC-012: Board financial report

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R3 |
| Stories | 39 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Board member](../product/PERSONAS.md#board-member) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

The board presents finances at the general assembly. The mock-up’s report uses typed-in figures, and its August dues-by-phase total is ₱17,184 short of August’s monthly collections.

## Goal and success metrics

The board presents a financial report whose figures agree with each other.

| Measure | Baseline | Proposed target |
|---|---|---|
| Figures in the report that disagree with each other | one mismatch in the mock-up sample | 0, or flagged before it is shared |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Revenue, collections by month and by phase, spending, and a PDF for the assembly

## Out of scope

- Audited financial statements (prepared by the external auditor)

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 39 | [Board financial report](../backlog/BACKLOG.md#39-board-financial-report) | Could | M | R3 | 24 |

## Dependencies on other epics

- Story 24 Fund summary and closing a month (Accounting and fund)

## Risks

- Calculated figures differ from what the board reported before the portal existed. Mitigation: show the first calculated report beside the last manual one.

## Open questions

| Question | Who decides |
|---|---|
| D6 Typed in, or calculated from portal records | HOA board |
| What do "Phase 1–4" and "CM" mean in the report, and does every lot belong to one phase? | Treasurer |

## Release slicing

Single story (39). If D6 is "calculated", it waits for story 24.
