# EPIC-002: Billing and statement

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R1 |
| Stories | 07, 08, 09, 15 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Homeowner](../product/PERSONAS.md#homeowner), [Treasurer](../product/PERSONAS.md#treasurer) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

Homeowners need to know what they owe and since when, and the treasurer needs every household billed the same way each month. In the mock-up billing is a button that can run twice for the same month, and the statement is a wide table that is hard to read on a phone.

## Goal and success metrics

Every household sees a current, correct statement on the 1st of each month, on a phone.

| Measure | Baseline | Proposed target |
|---|---|---|
| Balance enquiries to the admin office per month | to measure before launch | down by half within 3 months |
| Months billed twice | not applicable | 0 |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Monthly dues rate and QR payment settings
- Monthly billing run that never bills a month twice
- Statement of account with payments applied to the oldest month first, downloadable as PDF
- Homeowner dashboard with balance and overdue warning

## Out of scope

- Late penalties and interest until D2 is decided
- Different dues rates by lot size or phase
- Special assessments and one-off charges (raise as a new story if needed)

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 07 | [Dues rate and QR payment settings](../backlog/BACKLOG.md#07-dues-rate-and-qr-payment-settings) | Must | S | R1 | 02 |
| 08 | [Monthly billing run](../backlog/BACKLOG.md#08-monthly-billing-run) | Must | M | R1 | 03, 07 |
| 09 | [Statement of account](../backlog/BACKLOG.md#09-statement-of-account) | Must | M | R1 | 08 |
| 15 | [Homeowner dashboard](../backlog/BACKLOG.md#15-homeowner-dashboard) | Should | S | R1 | 09, 11 |

## Dependencies on other epics

- Story 02 Roles and permissions enforced on the server (Access and households)
- Story 03 Household directory: add, edit and import (Access and households)
- Story 11 In-app notifications (Announcements and notifications)

## Risks

- Payments applied in the wrong order make an account look overdue when it isn’t. Mitigation: the oldest-first rule in story 09 is tested with the sample accounts.
- A household added mid-month is billed twice or not at all. Mitigation: story 08 asks the admin before billing a late addition.

## Open questions

| Question | Who decides |
|---|---|
| D2 Late penalty, interest and grace period | HOA board |
| D8 Manual or automatic monthly billing | HOA board |
| Are there charges other than monthly dues (assessments, sticker fees)? | Treasurer |

## Release slicing

Stories 07, 08 and 09 make a working statement. Story 15 (dashboard) follows in the same release.
