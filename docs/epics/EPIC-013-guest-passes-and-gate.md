# EPIC-013: Guest passes and gate

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R4 |
| Stories | 40, 41, 42, 43, 44, 45 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Homeowner](../product/PERSONAS.md#homeowner), [Guard](../product/PERSONAS.md#guard), [Admin office staff](../product/PERSONAS.md#admin-office-staff) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

Guards call residents to confirm every visitor, and the gate keeps no reliable record of who came in. backend-plan.md prices this as a separate add-on (+6–10 days).

## Goal and success metrics

Guards let expected guests in without calling the resident, and the HOA can answer "who came in?" after an incident.

| Measure | Baseline | Proposed target |
|---|---|---|
| Calls from the guardhouse to residents about expected guests | to measure before launch | down by 70% |
| Median time to verify a pass at the gate | to measure | under 30 seconds |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Guest passes with QR and pass code
- Cancelling a pass
- Live camera scanning and code entry by the guard, with every check logged
- Checking guests in with an ID photo, and out
- Visitor and scan logs for the admin office
- Deleting ID photos automatically after the retention period

## Out of scope

- Scanning residents’ vehicle stickers at the gate
- Boom barrier or turnstile control
- Delivery-rider flows

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 40 | [Create a guest pass](../backlog/BACKLOG.md#40-create-a-guest-pass) | Could | M | R4 | 01 |
| 41 | [Cancel a guest pass](../backlog/BACKLOG.md#41-cancel-a-guest-pass) | Could | S | R4 | 40 |
| 42 | [Guard verifies a pass at the gate](../backlog/BACKLOG.md#42-guard-verifies-a-pass-at-the-gate) | Could | L | R4 | 40, 02 |
| 43 | [Check guests in and out](../backlog/BACKLOG.md#43-check-guests-in-and-out) | Could | M | R4 | 42 |
| 44 | [Visitor log and gate scan log](../backlog/BACKLOG.md#44-visitor-log-and-gate-scan-log) | Could | S | R4 | 43 |
| 45 | [Delete ID photos automatically after the retention period](../backlog/BACKLOG.md#45-delete-id-photos-automatically-after-the-retention-period) | Could | S | R4 | 43, 05 |

## Dependencies on other epics

- Story 01 Sign in to the portal (Access and households)
- Story 02 Roles and permissions enforced on the server (Access and households)
- Story 05 Privacy notice and consent (Access and households)

## Risks

- The guardhouse loses internet and the guard can’t verify anyone. Mitigation: check connectivity first; Sol Arch to decide whether an offline list of today’s passes is needed.
- ID photos are sensitive personal data. Mitigation: story 45 deletes them on schedule and story 44 logs every view.

## Open questions

| Question | Who decides |
|---|---|
| D9 Is the gate add-on in scope? | HOA board |
| Is the internet at the guardhouse reliable? | Admin office |
| Does the guard use a shared HOA phone or their own? | HOA board |
| How many gates are there? | Admin office |

## Release slicing

Stories 40, 42 and 43 are the smallest useful slice. 41, 44 and 45 complete it; 45 must ship before any ID photo is kept.
