# EPIC-009: Vehicles

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R3 |
| Stories | 28, 29 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Homeowner](../product/PERSONAS.md#homeowner), [Admin office staff](../product/PERSONAS.md#admin-office-staff), [Guard](../product/PERSONAS.md#guard) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

Residents need HOA stickers for gate entry, and the admin office keeps the sticker register by hand.

## Goal and success metrics

Every sticker matches exactly one approved vehicle.

| Measure | Baseline | Proposed target |
|---|---|---|
| Stickers in use that match an approved vehicle in the portal | to measure at launch | 100% after the first renewal cycle |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Registering a vehicle with an optional OR/CR photo
- Approving with the next sticker number, or rejecting with a reason

## Out of scope

- Paying sticker fees online
- RFID or automatic plate reading at the gate

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 28 | [Register a vehicle](../backlog/BACKLOG.md#28-register-a-vehicle) | Should | S | R3 | 01 |
| 29 | [Approve a vehicle and assign a sticker](../backlog/BACKLOG.md#29-approve-a-vehicle-and-assign-a-sticker) | Should | S | R3 | 28, 11 |

## Dependencies on other epics

- Story 01 Sign in to the portal (Access and households)
- Story 11 In-app notifications (Announcements and notifications)

## Risks

- A plate registered to two households. Mitigation: story 28 refuses a plate that is already approved elsewhere.

## Open questions

| Question | Who decides |
|---|---|
| Is there a sticker fee? | HOA board |
| Do stickers expire and renew every year? | HOA board |
| Is there a limit on vehicles per household? | HOA board |

## Release slicing

Stories 28 and 29 ship together.
