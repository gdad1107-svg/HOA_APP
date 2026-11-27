# EPIC-010: Amenity booking

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R3 |
| Stories | 30, 31, 32, 33, 34 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Homeowner](../product/PERSONAS.md#homeowner), [Admin office staff](../product/PERSONAS.md#admin-office-staff), [Treasurer](../product/PERSONAS.md#treasurer) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

Booking the pool, function room and courts means visiting or messaging the office, and slots can be promised twice. In the mock-up the fee is paid before approval, with no refund path when a booking is rejected.

## Goal and success metrics

Homeowners book from their phone and no slot is ever double-booked.

| Measure | Baseline | Proposed target |
|---|---|---|
| Double-booked slots | unknown today | 0 |
| Bookings made through the portal | 0 (portal not live) | 80% within 3 months |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Amenity setup: fee, deposit, guest limit, slots, bookable
- Booking with conflict-safe slot holds
- Approval with conflict and overdue warnings
- Cancelling a booking
- Pausing booking for overdue accounts (board setting)

## Out of scope

- Paying fees online
- Recurring bookings and waitlists
- Tracking deposit refunds: see the open question below

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 30 | [Set up amenities](../backlog/BACKLOG.md#30-set-up-amenities) | Should | S | R3 | 02 |
| 31 | [Book an amenity](../backlog/BACKLOG.md#31-book-an-amenity) | Should | L | R3 | 30 |
| 32 | [Approve or reject a booking](../backlog/BACKLOG.md#32-approve-or-reject-a-booking) | Should | M | R3 | 31, 11 |
| 33 | [Cancel a booking](../backlog/BACKLOG.md#33-cancel-a-booking) | Should | S | R3 | 31 |
| 34 | [Pause booking for accounts with overdue dues](../backlog/BACKLOG.md#34-pause-booking-for-accounts-with-overdue-dues) | Could | S | R3 | 31, 18 |

## Dependencies on other epics

- Story 02 Roles and permissions enforced on the server (Access and households)
- Story 11 In-app notifications (Announcements and notifications)
- Story 18 Delinquent accounts list (Collections and notices)

## Risks

- Money taken for a booking that is then rejected. Mitigation: decision D7.
- Two homeowners take the same slot at the same moment. Mitigation: story 31 saves only one hold per slot on the server.

## Open questions

| Question | Who decides |
|---|---|
| D7 Pay with the request, or after approval | HOA board |
| Should the portal record when a deposit is refunded? | Treasurer |
| Limits on how far ahead, and how often, a household can book? | HOA board |

## Release slicing

Stories 30, 31 and 32 ship together. Then 33. Story 34 only if the board keeps the booking pause rule.
