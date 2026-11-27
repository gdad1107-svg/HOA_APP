# EPIC-008: Requests and complaints

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R2 |
| Stories | 26, 27 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Homeowner](../product/PERSONAS.md#homeowner), [Admin office staff](../product/PERSONAS.md#admin-office-staff) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

Maintenance problems, security concerns and neighbour complaints are reported verbally or in group chats, so nobody can see whether they were handled.

## Goal and success metrics

Every request is tracked from report to resolution, and the homeowner can see progress.

| Measure | Baseline | Proposed target |
|---|---|---|
| Requests with a first update within 2 working days | to measure after launch | 90% |
| Median days to resolve | to measure after launch | set after 3 months of data |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Logging a request with category, details and photo
- Assigning, updating and resolving, with notifications to the homeowner

## Out of scope

- Automatic escalation and service-level timers
- Work orders sent to outside contractors
- Anonymous complaints: see the open question below

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 26 | [Log a request or complaint](../backlog/BACKLOG.md#26-log-a-request-or-complaint) | Should | S | R2 | 01, 11 |
| 27 | [Assign, update and resolve a request](../backlog/BACKLOG.md#27-assign-update-and-resolve-a-request) | Should | S | R2 | 26 |

## Dependencies on other epics

- Story 01 Sign in to the portal (Access and households)
- Story 11 In-app notifications (Announcements and notifications)

## Risks

- A neighbour complaint reveals who complained. Mitigation: only the admin office sees the household that filed it.

## Open questions

| Question | Who decides |
|---|---|
| Should homeowners be able to file a complaint anonymously? | HOA board |
| Are the six categories (Maintenance, Security, Noise / Neighbor, Garbage, Billing, Others) right? | Admin office |

## Release slicing

Stories 26 and 27 ship together; one is useless without the other.
