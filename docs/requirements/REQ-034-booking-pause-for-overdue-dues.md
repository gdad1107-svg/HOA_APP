# REQ-034: Pause booking for accounts with overdue dues

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-010 Amenity booking](../epics/EPIC-010-amenity-booking.md) |
| Backlog story | [34 Pause booking for accounts with overdue dues](../backlog/BACKLOG.md#34-pause-booking-for-accounts-with-overdue-dues) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 34A–34B of the vehicles and amenities mockup. Repo copy: [req-028-034-mockup.html](../mockups/req-028-034-mockup.html). Not yet published as an artifact (main session to publish) |
| Architecture | SA-001 §4.3 Flow 2 (`requestBooking` reads `households/{hh}.standing` and refuses if delinquent and the setting is on), §4.2 (`households.standing`, `overdueCount` kept by functions; `config/settings`). Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-031, REQ-018 (delinquent accounts: what "overdue" means and the shared on-read standing rule, decision 5), REQ-012 (payment approval updates standing), REQ-007 (settings page), REQ-006 (activity log). Board decision D2 (grace period) changes when an account becomes overdue |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft. r2, 2026-11-28: reconciled with REQ-018 (conflict C4): the pause uses REQ-018's on-read standing rule (unpaid due dates against today in Manila), not a stored standing that goes stale at midnight |

## Owner decisions

Nothing below is approved yet. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (a setting the server enforces on new requests) or B (no setting: the office rejects by hand, using REQ-032's standing pill and the "Account has overdue dues" preset) | **A, if the board confirms the rule exists** in the by-laws or a board resolution. If not, B costs nothing more and this REQ is dropped (as EPIC-010's slicing already allows) |
| 2 | Default when the portal goes live | **Off.** The mock-up has it on (`blockDelinquent:true`, line 527); turning it on is the board's act, done by the treasurer, and recorded |
| 3 | Bookings made before the household became overdue | **Kept.** The pause stops new requests only; the office sees the standing on pending requests (REQ-032 decision 5) |
| 4 | A payment that is submitted but not yet approved | **Does not lift the pause.** The page says so, so the homeowner knows to wait rather than pay twice |
| 5 | How "delinquent" is decided at the moment of a request (r2, conflict C4 with REQ-018) | **REQ-018 decision 5's rule, worked out at that moment**: `requestBooking` reads the household's `oldestUnpaidDue` inside its transaction and compares it with today in Manila minus the grace period, using the same `shared/domain` rule as the delinquent list. The banner uses the same rule in the browser. A stored `standing` is not read, so the pause starts the day a bill falls overdue and lifts the moment a payment approval clears it, with no daily job |

## Problem

Some HOAs suspend amenity use for members with unpaid dues. Applied by hand, the rule is uneven: one household gets rejected after requesting, another slips through. In the mock-up the check exists (`FORMS.book`, `index.html` line 1447) but only in the browser, so it can be bypassed, and it reads a balance the browser computes itself.

Whether this HOA has the rule, and what "overdue" means with a grace period (D2), is not yet known. The legal basis for suspending amenity use is **not verified** here; the board should confirm it against its by-laws.

## Options

### Option A: A setting enforced by the server (recommended if the rule exists)

- **How it works:** Settings → Dues & billing has "Pause amenity booking for households with overdue dues". When it's on, a delinquent household (REQ-018) sees "Booking is paused for your account" on Book Amenities, can still look at the calendar, and can't request; the server refuses a request from a delinquent household regardless of what the screen shows.
- **Cost:** cheap: SA-001 Flow 2 already reads the standing in `requestBooking`; this adds the setting, the banner and tests.
- **Honest downside:** depends on standing being right. If a payment is approved late, the household stays paused until it is.

### Option B: No setting; the office decides

- **How it works:** delinquent households can request; the office sees "Delinquent" on the request (REQ-032) and rejects with the preset reason if the board's rule applies.
- **Cost:** nothing beyond REQ-032.
- **Honest downside:** homeowners learn after requesting; the rule depends on who is on duty.

### Recommendation

**Option A, defaulted off**, built only once the board confirms the rule. It applies the rule the same way to everyone and tells the homeowner before they try.

## Story

As a treasurer, I want a setting that pauses amenity booking for households with overdue dues, so that the board's rule is applied the same way to everyone.

## Acceptance criteria (Option A)

```gherkin
Feature: Booking pause for overdue accounts

  Background:
    Given Carmela Cruz has the treasurer role
    And Grace Lim is a homeowner linked to Blk 9 Lot 4

  Scenario: Turn the pause on
    Given "Pause amenity booking for households with overdue dues" is off
    When Carmela ticks it and presses "Save settings"
    Then she sees "Settings saved. Households with overdue dues can't request bookings until they're current."
    And the activity log records who turned it on and when

  Scenario: A delinquent household sees the pause
    Given the pause is on
    And Blk 9 Lot 4 has a bill that is overdue (REQ-018)
    When Grace opens Book Amenities
    Then she sees "Booking is paused for your account" with "Your account has overdue dues. Settle the balance to book amenities again." and "Go to Dues"
    And she can still look at the calendar and slots
    And "Request booking" is disabled

  Scenario: The server refuses even if the screen didn't
    Given the pause is on and Blk 9 Lot 4 is delinquent
    When a booking request from Grace's device reaches the server
    Then it is refused with "Booking is paused for your account. Settle your overdue dues to book."
    And no slot is held

  Scenario: The pause starts the day a bill falls overdue, with nothing else saved (decision 5)
    Given the pause is on and the grace period is 0 days
    And Blk 9 Lot 4's only unpaid bill is November 2026, due Nov 30, 2026
    And nothing has been billed, approved or voided for Blk 9 Lot 4 since
    When Grace requests a booking at 11:00 PM on Nov 30, 2026 Manila time
    Then it is saved as "Pending approval"
    When she requests another booking at 12:01 AM on Dec 1, 2026 Manila time
    Then it is refused with "Booking is paused for your account. Settle your overdue dues to book."

  Scenario: A payment waiting for approval
    Given the pause is on and Grace submitted a payment that covers her overdue bills
    And the treasurer hasn't approved it yet
    When Grace opens Book Amenities
    Then she also sees "Your payment is waiting for approval. Booking resumes once it's approved."

  Scenario: Booking resumes after payment
    Given the pause is on and Blk 9 Lot 4 is delinquent
    When the treasurer approves a payment that leaves no bill overdue
    And Grace opens Book Amenities
    Then she sees no pause message and can request a booking

  Scenario: A partial payment leaves the pause on
    Given Blk 9 Lot 4 has two overdue bills
    When a payment covering only the older bill is approved
    Then Grace still sees "Booking is paused for your account"

  Scenario: Existing bookings are kept (decision 3)
    Given Blk 9 Lot 4 has an approved Function Room booking on Dec 19
    When Blk 9 Lot 4 becomes delinquent with the pause on
    Then the Dec 19 booking stays "Approved"
    And Grace can still cancel it

  Scenario: The pause is off
    Given the pause is off and Blk 9 Lot 4 is delinquent
    When Grace requests a booking
    Then it is saved as "Pending approval"
    And the office sees "Delinquent" on the request (REQ-032)

  Scenario: Turning the pause off
    Given the pause is on and Grace is paused
    When Carmela unticks the setting and saves
    Then Grace can request a booking the next time she opens Book Amenities

  Scenario: Only the treasurer changes the setting
    When an admin office or board member's device sends a change to the pause setting
    Then the request is refused
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Pause setting, on its own "Amenity booking" card in Settings | `config/settings.blockDelinquentBooking` (boolean; SA-001 Flow 2 calls it `blockDelinquent`) | Default false (decision 2); treasurer only | Treasurer (client write checked by rules) | `requestBooking`; household members (to show the banner) |
| Household standing | `households/{id}.oldestUnpaidDue` (REQ-018) and settings `graceDays` | Kept by the bill, approve and void functions (REQ-008, REQ-012, REQ-014); not written here. Delinquent is worked out at read time against today in Manila by REQ-018's shared rule (decision 5). `standing` / `overdueCount` (SA-001 §4.2) are not read | Functions | `requestBooking` (in its transaction), household members (banner) |
| Pending payment hint | Existing `payments` query for the household (REQ-010) | — | — | Book Amenities |
| Change records | `auditLog` | `settings.updated` with before and after; ids only | Trigger | Board, treasurer |

## UX/UI notes

- **Accessibility:** the pause banner is a status message with a heading, read before the calendar; "Request booking" is disabled with its reason in text next to it, not only greyed.
- **Consistency:** on screen the words are "Booking is paused for your account" (glossary: **booking pause**). The setting's label changes from the mock-up's "Block amenity booking…" to "Pause amenity booking…" to match. The R1 dashboard's overdue alert (REQ-015) uses the same phrase when the pause is on.
- **Mobile-first:** the banner sits at the top of Book Amenities at 375 px with "Go to Dues" as a full-width button.
- **States:** paused, paused with a payment waiting, not paused. Loading: the banner area keeps its space until standing loads, so the page doesn't jump.
- **Safe actions:** the setting is a single checkbox on its own "Amenity booking" card in Settings (the mock-up had it under Dues & billing; REQ-007 leaves it to this REQ); "Save settings" shows "Saving…".
- **Roles:** treasurer changes it; everyone else is refused by rules. The server check is the protection, not the disabled button.

## Copy of record

| Where | Text |
|---|---|
| Setting | Pause amenity booking for households with overdue dues · Households with overdue dues can look at the calendar but can't request bookings. Existing bookings stay. |
| Saved | Settings saved. Households with overdue dues can't request bookings until they're current. |
| Banner | Booking is paused for your account · Your account has overdue dues. Settle the balance to book amenities again. · Go to Dues |
| Payment waiting | Your payment is waiting for approval. Booking resumes once it's approved. |
| Server refusal | Booking is paused for your account. Settle your overdue dues to book. |

## Out of scope

- Pausing other services (vehicle stickers, guest passes, certificates) for delinquent households.
- Cancelling existing bookings when a household becomes delinquent (decision 3).
- Defining "overdue" and the grace period (REQ-018, D2).

## Open questions

| Question | Who decides |
|---|---|
| Decisions for the owner, rows 1–5 | Owner |
| Does the HOA's by-laws or a board resolution allow suspending amenity use for unpaid dues? (Not verified by the BA.) | HOA board |
| D2: grace period before a bill counts as overdue | HOA board |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. **Diverges from SA-001 (r2, C4): confirm or reject.** SA-001 §4.3 Flow 2 has `requestBooking` read the stored `households/{hh}.standing`. This REQ (decision 5) has it read `oldestUnpaidDue` inside its transaction and apply REQ-018's shared rule against today in Manila, so a bill that fell overdue at midnight, or a payment approved a second earlier, is honoured with no daily job. Same point as REQ-018 Sol Arch question 1.
2. Setting name: `blockDelinquent` (Flow 2) or `blockDelinquentBooking`; pick one in SA-001.
3. Size: BA estimate **S, 0.5–1 person-day with Claude Code**.
