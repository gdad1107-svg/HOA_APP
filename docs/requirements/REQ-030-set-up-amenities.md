# REQ-030: Set up amenities

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-010 Amenity booking](../epics/EPIC-010-amenity-booking.md) |
| Backlog story | [30 Set up amenities](../backlog/BACKLOG.md#30-set-up-amenities) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 30A–30B of the vehicles and amenities mockup. Repo copy: [req-028-034-mockup.html](../mockups/req-028-034-mockup.html). Not yet published as an artifact (main session to publish) |
| Architecture | SA-001 §3 ("Expenses, settings, amenity prices": client write, admin-only by rules), §4.2 (`amenities`: fee, deposit, max guests, active, slots), §4.3 Flow 2 (fee copied at request time), §11.2 (stale references). Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-002 (roles), REQ-006 (activity log) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Nothing below is approved yet. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (staff edit prices and rules; slots and the list of amenities set by the developer on written request) or B (a full editor, including slots and new amenities) | **A**. Slots change perhaps once a year, and changing them touches existing bookings |
| 2 | Who may change what | **Treasurer**: everything on the page. **Admin office**: "Bookable" and the note only (closing the pool for repairs is an office job; prices are money) |
| 3 | Booking window, per amenity: how far ahead a slot can be requested, and how soon before it starts requests close | **Up to 60 days ahead** (Function Room 180); **requests close 24 hours before** the slot starts, Manila time, so the office can review during working hours. Board to confirm the numbers (EPIC-010 open question) |
| 4 | Slot keys | Slots are identified by their **start time** (e.g. `0700`), not by their position in the list. SA-001 Flow 2 uses `slotIndex`, which would point at a different slot if a slot is ever added or removed. Sol Arch to confirm |

## Problem

Each amenity has its own fee, deposit, guest limit and slots, and the board changes prices and closes amenities for repairs. In the mock-up, Settings → Amenity pricing edits fee, deposit, maximum guests and "Bookable" (`aSet`, `index.html` line 860), but slots are fixed in the sample data and there is no booking window, so a homeowner could request a slot for tonight that nobody will review in time, or one two years away. Unticking "Bookable" leaves existing bookings with nobody told.

The backlog story also lists "time slots". The challenge: a slot editor is the expensive part of this story and the least used. The office would use it at launch and then rarely.

## Options

### Option A: Edit prices and rules; slots by the developer (recommended)

- **How it works:** Settings → Amenities shows one row per amenity: fee per slot, deposit, maximum guests, booking window (days ahead, hours' notice), Bookable, and a note shown to homeowners ("Lifeguard on duty 8 AM–6 PM"). Slots are listed read-only under each amenity. Adding an amenity or changing its slots is done by the developer from the board's written request, the same way roles are set (REQ-002 Option B).
- **Where it lives:** staff menu → Settings → Amenities.
- **Cost:** cheap: one form, rules with field-level checks, an audit trigger.
- **Honest downside:** a slot change waits for the developer. Fine at a few changes a year.

### Option B: Full amenity editor

- **How it works:** as A, plus add or remove slots and amenities, with photos.
- **Cost:** moderate: the editor itself, plus rules for what happens to pending and approved bookings in a slot that is removed or moved.
- **Honest downside:** most of its cost is handling existing bookings for a screen used once or twice a year.

### Recommendation

**Option A.** It covers the frequent changes (prices, closures) and keeps the rare, risky one (slots) out of a screen.

## Story

As a treasurer, I want to set each amenity's fee, deposit, guest limit, booking window and whether it can be booked, so that bookings follow the board's rules.

## Acceptance criteria (Option A)

```gherkin
Feature: Amenity setup

  Background:
    Given Carmela Cruz has the treasurer role
    And Paolo Aquino has the admin role

  Scenario: The settings page
    When Carmela opens Settings → Amenities
    Then each amenity shows its fee per slot, deposit, maximum guests, booking window, Bookable, note and its slots
    And the Function Room shows slots "08:00–12:00", "13:00–17:00" and "18:00–22:00"

  Scenario: A price change applies to new bookings only
    Given a pending Function Room booking at ₱2,500.00
    When Carmela changes the Function Room fee to ₱3,000 and presses "Save amenities"
    Then she sees "Amenities saved. New fees apply to new booking requests."
    And the pending booking still reads ₱2,500.00
    And new Function Room requests show ₱3,000.00

  Scenario: Invalid values
    When Carmela enters "-50" as the Swimming Pool fee
    Then she sees "Enter ₱0 or more." under that field
    When she enters "0" as the maximum guests
    Then she sees "Allow at least 1 guest."
    And "Save amenities" saves nothing until the errors are fixed

  Scenario: A free amenity
    When Carmela sets the Basketball Court fee and deposit to ₱0 and saves
    Then homeowners see "Free" for the Basketball Court

  Scenario: Close an amenity for repairs
    Given the Swimming Pool has 3 upcoming bookings (2 approved, 1 pending)
    When Paolo unticks "Bookable" for the Swimming Pool and presses "Save amenities"
    Then he sees "The Swimming Pool has 3 upcoming bookings. Closing it stops new requests only. These bookings stay until you cancel them."
    And the dialog lists each booking's date, slot, lot and status, with "Cancel bookings" leading to REQ-033's admin cancel
    When he presses "Close for new bookings"
    Then homeowners no longer see the Swimming Pool when booking
    And the 3 bookings are unchanged

  Scenario: Reopen an amenity
    Given the Swimming Pool is not bookable
    When Paolo ticks "Bookable" and saves
    Then homeowners see the Swimming Pool when booking again

  Scenario: The admin office can't change prices
    When Paolo opens Settings → Amenities
    Then the fee, deposit, guest limit and booking window fields are read-only for him
    And a fee change sent from his device is refused

  Scenario: Booking window
    Given the Pickleball Court allows requests up to 60 days ahead and closes requests 24 hours before
    Then homeowners can request Pickleball Court slots from 24 hours to 60 days ahead, Manila time (REQ-031)

  Scenario: Two staff save at the same time
    Given Carmela and Paolo both have Settings → Amenities open
    When Paolo saves a change and then Carmela saves hers
    Then Carmela sees "Someone else changed the amenity settings while you were editing. Reload to see their changes, then save again."
    And Paolo's change is kept

  Scenario: Leaving with unsaved changes
    Given Carmela has changed a fee and not saved
    When she opens another page
    Then she is asked "Leave without saving? Your changes to amenities will be lost."

  Scenario: Every change is recorded
    When Carmela saves a fee change from ₱2,500 to ₱3,000
    Then the activity log records who, which amenity, the old and new values, and when

  Scenario: Homeowners and board members can't change settings
    When a homeowner's or a board member's device sends an amenity change
    Then the request is refused
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Amenity: name, fee (centavos), deposit (centavos), max guests, bookable (`active`), note, slots (each with a key such as `0700`, a label "07:00–08:00", start and end), days ahead, notice hours, updated at, updated by | `amenities/{id}` (SA-001 §4.2) | Fee and deposit ≥ 0, whole pesos; max guests ≥ 1; days ahead 1–365; notice 0–168 hours. Treasurer may change any field except slots and name; admin office only `active` and `note` (decision 2); refused if `updatedAt` changed since the page loaded | Treasurer, admin office (client write checked by rules) | All signed-in members and staff |
| Slots and new amenities | same | Not writable by any client | Developer script, from a board request (decision 1) | — |
| Fee and deposit on a booking | `bookings/{id}.feeCentavos`, `depositCentavos` | Copied when the request is made, never changed by a later price change (Flow 2) | `requestBooking` (REQ-031) | — |
| Change records | `auditLog` | `amenity.updated` with before and after values; ids only | Trigger | Board, treasurer |

Seed data at go-live (from the mock-up, `index.html` line 484, for the board to confirm): Swimming Pool ₱150, 10 guests; Function Room ₱2,500 + ₱1,000 deposit, 80 guests; Pickleball Court ₱200, 8 guests; Basketball Court ₱250, 20 guests.

## UX/UI notes

- **Accessibility:** each input is labelled with the amenity and the field ("Function Room fee per slot (₱)"), not just a column heading; the Bookable checkbox has a visible label; errors sit under the field and are announced.
- **Consistency:** "Fee", "Deposit", "Slot" and "Bookable" as in the glossary; amounts show as ₱2,500.00 everywhere a homeowner sees them; one "Save amenities" button, the same pattern as "Save settings".
- **Mobile-first:** the mock-up's pricing table needs a desktop; at phone width each amenity becomes a card with its fields stacked.
- **States:** loading (placeholder rows), error (inline, stale save), success ("Amenities saved…"). Empty doesn't apply: amenities are seeded.
- **Forms:** numeric keyboard for amounts, guests and window; amounts in whole pesos; the closing dialog does not close on a backdrop click.
- **Safe actions:** "Save amenities" shows "Saving…" and is disabled until done; closing an amenity with upcoming bookings is confirmed and lists them; nothing here changes an existing booking.
- **Roles:** fields the admin office can't change are shown read-only, and rules refuse them anyway.

## Copy of record

| Where | Text |
|---|---|
| Section | Amenities · New fees apply to new booking requests. Existing bookings keep their fee. |
| Field labels | Fee per slot (₱) · Deposit (₱) · Max guests · Book up to (days ahead) · Requests close (hours before) · Bookable · Note for homeowners · Slots |
| Slots note | To add or change slots, the board asks the developer in writing. |
| Save | Save amenities (in flight: Saving…) · Amenities saved. New fees apply to new booking requests. |
| Errors | Enter ₱0 or more. · Allow at least 1 guest. · Someone else changed the amenity settings while you were editing. Reload to see their changes, then save again. |
| Close confirm | The {amenity} has {n} upcoming bookings. Closing it stops new requests only. These bookings stay until you cancel them. · Cancel bookings · Close for new bookings · Keep it open |
| Leave confirm | Leave without saving? Your changes to amenities will be lost. |
| Homeowner, free amenity | Free |

## Out of scope

- Adding amenities, editing slots and photos (Option B).
- Closing an amenity for a date range only (for example Dec 1–15), and reserving a slot for an HOA event. Today: untick Bookable, or reject the request with "Slot is reserved for an HOA event" (REQ-032). Worth revisiting if the office does this often.
- Different prices for weekends, holidays or non-residents.
- Recording deposit refunds (EPIC-010 open question for the treasurer).

## Open questions

| Question | Who decides |
|---|---|
| Decisions for the owner, rows 1–4 | Owner |
| Booking window numbers (decision 3) and whether any amenity is booked further ahead | HOA board |
| Are the seed prices, guest limits and slots above current? | HOA board, admin office |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. Decision 4: slot key by start time instead of `slotIndex` in `slotLocks` ids (SA-001 Flow 2).
2. Field-level rules (`affectedKeys`) for the admin office's two fields, and `updatedAt` as the stale-save guard on a client write.
3. Size: BA estimate **S, about 1 person-day with Claude Code**.
