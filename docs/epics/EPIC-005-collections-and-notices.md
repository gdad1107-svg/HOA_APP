# EPIC-005: Collections and notices

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R2 |
| Stories | 18, 20, 21 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Treasurer](../product/PERSONAS.md#treasurer) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

Following up unpaid dues is slow and inconsistent. The mock-up already models a four-step letter sequence (Reminder, 1st Notice, 2nd Notice, Final Demand); the real app has to send it reliably and keep a record.

## Goal and success metrics

Every overdue account gets the next notice on time, and every notice is on record.

| Measure | Baseline | Proposed target |
|---|---|---|
| Dues collection rate | 51% in the mock-up’s board report sample (April–October 2026: ₱789,266 collected of ₱1,552,207 billed); real figure to confirm | at or above the board’s 70% target every month |
| Overdue households with no notice in the last 30 days | to measure after launch | 0 |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Delinquent accounts list, furthest behind first
- Next notice with a letter preview, deadline and PDF
- Sending notices to several households at once

## Out of scope

- Computing penalties and interest (D2)
- Payment arrangements and instalment plans
- Endorsing accounts to legal counsel

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 18 | [Delinquent accounts list](../backlog/BACKLOG.md#18-delinquent-accounts-list) | Must | S | R2 | 09, 12 |
| 20 | [Send the next notice in the escalation](../backlog/BACKLOG.md#20-send-the-next-notice-in-the-escalation) | Must | M | R2 | 18 |
| 21 | [Send notices to several households at once](../backlog/BACKLOG.md#21-send-notices-to-several-households-at-once) | Should | S | R2 | 20 |

## Dependencies on other epics

- Story 09 Statement of account (Billing and statement)
- Story 12 Approve or reject a payment (Payments and receipts)

## Risks

- A notice goes to a household whose payment is waiting for approval. Mitigation: the preview shows any pending payment before sending.
- Letter wording that cites R.A. 9904 and the by-laws must be correct. Mitigation: the board or counsel approves the four letter texts before launch.

## Open questions

| Question | Who decides |
|---|---|
| D2 Penalties, interest and grace period | HOA board |
| Who signs the letters, and are the 15-day and 10-day deadlines right? | HOA board |
| Should the portal record payment arrangements agreed at the office? | Treasurer |

## Release slicing

Stories 18 and 20 first. Story 21 (bulk) after the treasurer has sent single notices for a month.
