# REQ-033: Cancel a booking

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-010 Amenity booking](../epics/EPIC-010-amenity-booking.md) |
| Backlog story | [33 Cancel a booking](../backlog/BACKLOG.md#33-cancel-a-booking) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 33A–33B of the vehicles and amenities mockup. Repo copy: [req-028-034-mockup.html](../mockups/req-028-034-mockup.html). Not yet published as an artifact (main session to publish) |
| Architecture | SA-001 §3 (request or cancel a booking: function), §4.3 Flow 2 ("Cancel, reject and admin delete must all delete the lock in the same transaction"), §11.2 (deletes don't cascade), CODING-STANDARDS CS-5, CS-15. Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-031, REQ-011 (notifications), REQ-006 (activity log) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Nothing below is approved yet. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (cancel any time before the slot starts) or B (a cut-off per amenity, e.g. 48 hours before, after which only the office can cancel) | **A**. No cut-off rule exists today; a cut-off belongs with a forfeit policy the board hasn't set |
| 2 | The office cancelling a booking for a household (amenity closed for repairs, REQ-030; misuse) | **Include**, with a reason the homeowner sees. Not in the backlog story, but REQ-030's "close for repairs" needs it (about +0.5 day) |
| 3 | Refunds of a fee or deposit already paid | **Handled at the admin office**, outside the portal, as the mock-up says. The portal shows the cancelled booking and its payment so the treasurer can find it. Tracking refunds stays an EPIC-010 open question |
| 4 | Who in the household can cancel | **Any linked member**, the same as who can book |

## Problem

When plans change, a homeowner needs to release the slot so someone else can use it, without calling the office. In the mock-up, cancelling only changes the status (`cancelBooking`, `index.html` line 1378): it doesn't re-check the time or the status, and its dialog has two buttons that both say "Cancel". Under SA-001 Flow 2 the slot is held by a lock document, so cancelling must also delete that lock in the same step, or the slot stays blocked.

## Options

### Option A: Cancel any time before the slot starts (recommended)

- **How it works:** "Cancel" on any pending or approved booking whose slot hasn't started (Manila time). One confirm; the slot reopens at once; the office is notified.
- **Cost:** cheap.
- **Honest downside:** a household can cancel the Function Room the night before and leave it empty. The board can add a cut-off later (Option B) if that happens.

### Option B: Cancellation cut-off per amenity

- **How it works:** as A, but after a cut-off (e.g. 48 hours before) the homeowner sees "Contact the admin office to cancel".
- **Cost:** cheap (+0.5 day: one more amenity setting and message).
- **Honest downside:** without a forfeit or no-show policy, the cut-off only pushes people to call the office instead.

### Recommendation

**Option A**, plus the office's cancel (decision 2).

## Story

As a homeowner, I want to cancel a booking I no longer need, so that the slot is free for someone else.

## Acceptance criteria (Option A, recommended decisions)

```gherkin
Feature: Cancelling a booking

  Background:
    Given Juan Dela Cruz is a homeowner linked to Blk 4 Lot 12
    And it is 10:00 on Dec 3, 2026 in Manila

  Scenario: Cancel an upcoming booking
    Given Juan has an approved Swimming Pool booking on Dec 5, 14:00–16:00 with no fee submitted
    When Juan presses "Cancel" on it
    Then he sees "Cancel this booking? The slot opens up for other homeowners." with "Keep booking" and "Cancel booking"
    When he presses "Cancel booking"
    Then the button reads "Cancelling…" and is disabled until the save finishes
    And the booking reads "Cancelled"
    And the slot reads "Available" to every homeowner
    And the admin office gets the notification "Blk 4 Lot 12 cancelled Swimming Pool on Dec 5, 14:00–16:00."

  Scenario: Cancel a request that isn't approved yet
    Given Juan has a pending Pickleball Court request on Dec 6, 07:00–08:00
    When he cancels it and confirms
    Then the booking reads "Cancelled"
    And it leaves the admin office's queue

  Scenario: Cancelling after paying
    Given Juan's Function Room booking on Dec 19 has its fee paid (OR-00123) or pending approval
    When he presses "Cancel"
    Then the dialog also says "Refunds of paid fees and deposits are handled at the admin office."
    When he confirms
    Then the booking reads "Cancelled"
    And the treasurer sees "Booking cancelled" next to that payment

  Scenario: Keep booking
    When Juan presses "Cancel" and then "Keep booking"
    Then the dialog closes and nothing changes

  Scenario: Past and started bookings can't be cancelled
    Given a booking dated yesterday, and a booking today from 09:00 to 11:00
    Then neither has a "Cancel" button
    When a cancel for the booking that started at 09:00 reaches the server
    Then it is refused with "This booking has already started and can't be cancelled."

  Scenario: Already cancelled or decided elsewhere
    Given Juan has the booking open on his phone and Ana cancelled it from her phone
    When Juan presses "Cancel booking"
    Then he sees "This booking was already cancelled."
    Given instead the office rejected it meanwhile
    Then he sees "This booking was already rejected by the admin office."

  Scenario: Double tap
    When Juan taps "Cancel booking" twice quickly
    Then the booking is cancelled once and the office gets one notification

  Scenario: Cancelling while the office approves
    Given Juan cancels at the same moment the office approves the same request
    Then exactly one of the two takes effect
    And the other person sees the message for the status it found

  Scenario: Network error
    When the cancel fails because of a network error
    Then Juan sees "Couldn't cancel. Check your connection and try again."
    And the booking is unchanged

  Scenario: The office cancels a booking for a household (decision 2)
    Given Paolo Aquino has the admin role
    And Blk 4 Lot 12 has an approved Swimming Pool booking on Dec 5
    When Paolo opens Approvals → Bookings → Upcoming, presses "Cancel" on it, enters "Pool closed for pump repair" and confirms
    Then the booking reads "Cancelled by the admin office: Pool closed for pump repair" for the homeowner
    And the homeowner gets the notification "Your Swimming Pool booking on Dec 5 was cancelled by the admin office: Pool closed for pump repair."

  Scenario: The office must give a reason
    When Paolo confirms a cancel with the reason empty
    Then he sees "Enter a reason. The homeowner will see it."

  Scenario: Another household's booking is refused
    When Juan's device sends a cancel for another household's booking
    Then the request is refused

  Scenario: Every cancel is recorded
    When a booking is cancelled
    Then the activity log records who cancelled it, the booking, the reason if any, and when
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Cancel: status `cancelled`, cancelled by, cancelled at, cancelled by role (household / office), reason | `bookings/{id}` | Only pending or approved; only before the slot's start, Manila time; deletes `slotLocks/{key}` in the same transaction (Flow 2); refused if the status changed since the screen loaded | `cancelBooking(bookingId, reason?, seenUpdatedAt)` | Own household, staff |
| Payment link | `payments/{id}` (kind `amenityFee`, REQ-031) | Unchanged; the treasurer's view shows the booking's status | — | Treasurer |
| Notifications | `notifications` (REQ-011) | To the office on a household cancel; to the household on an office cancel | `cancelBooking` | Recipients |
| Change records | `auditLog` | `booking.cancelled`; ids only | Function | Board, treasurer |

The booking is never deleted (CS-15): payments and the activity log point at it.

## UX/UI notes

- **Accessibility:** the confirm dialog takes focus on "Keep booking" (the safe choice) and returns focus to the booking card; the dialog is announced with its question.
- **Consistency:** the mock-up's confirm has "Cancel" as both the dismiss and the action. Here the buttons are "Keep booking" and "Cancel booking", so no button is ambiguous. Same confirm component as every other confirm.
- **Mobile-first:** "Cancel" sits on each booking card in My bookings at 375 px, at least 44 px tall.
- **States:** success (card reads "Cancelled"), error (stale, started, network). Loading and empty are REQ-031's My bookings.
- **Forms:** the office's reason field is required and kept if the save fails; the dialog doesn't close on a backdrop click once a reason is typed.
- **Safe actions:** confirmed; "Cancelling…" disables the button; the server refuses a second cancel (CS-5). Not undoable: to undo, the homeowner requests the slot again if it's still open.
- **Stable layout:** the Cancel button keeps its space on cards that can't be cancelled (hidden with visibility), so cards line up.
- **Roles:** household members cancel their own; admin office and treasurer cancel any, with a reason; board can't.

## Copy of record

| Where | Text |
|---|---|
| Card button | Cancel |
| Confirm | Cancel this booking? The slot opens up for other homeowners. · (if fee paid or pending) Refunds of paid fees and deposits are handled at the admin office. · Keep booking · Cancel booking (in flight: Cancelling…) |
| Office confirm | Cancel {lot}'s {amenity} booking on {date}? · Reason shown to the homeowner · Keep booking · Cancel booking |
| Statuses | Cancelled · Cancelled by the admin office: {reason} |
| Errors | This booking has already started and can't be cancelled. · This booking was already cancelled. · This booking was already rejected by the admin office. · Couldn't cancel. Check your connection and try again. · Enter a reason. The homeowner will see it. |
| Notifications | (to the office) {lot} cancelled {amenity} on {date}, {slot}. · (to the household) Your {amenity} booking on {date} was cancelled by the admin office: {reason}. |
| Treasurer's payment view | Booking cancelled |
| Success toast | Booking cancelled. |

## Out of scope

- A cancellation cut-off or forfeit rule (Option B; board policy).
- Recording refunds of fees and deposits (decision 3).
- Rescheduling a booking in one step (cancel, then request again).

## Open questions

| Question | Who decides |
|---|---|
| Decisions for the owner, rows 1–4 | Owner |
| Is a late cancellation of the Function Room a problem today? If yes, what is the policy (forfeit the fee, the deposit, or nothing)? | HOA board |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. `cancelBooking` deleting the lock in the same transaction as the status change, and the race with `decideBooking` (emulator concurrency test, CS-8).
2. How the treasurer's payment row shows the linked booking's status without an extra read per row.
3. Size: BA estimate **S, about 1 person-day with Claude Code** including the office cancel.
