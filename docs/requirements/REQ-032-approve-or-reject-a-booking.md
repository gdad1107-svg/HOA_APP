# REQ-032: Approve or reject a booking

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-010 Amenity booking](../epics/EPIC-010-amenity-booking.md) |
| Backlog story | [32 Approve or reject a booking](../backlog/BACKLOG.md#32-approve-or-reject-a-booking) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 32A–32D of the vehicles and amenities mockup. Repo copy: [req-028-034-mockup.html](../mockups/req-028-034-mockup.html). Not yet published as an artifact (main session to publish) |
| Architecture | SA-001 §3 (`decideBooking`: function), §4.3 Flow 2 (decide in a transaction; reject deletes the slot lock; fees to `monthlyTotals` only when approved), §4.4 item 2 (status check before deciding), §3 scheduler jobs (`Asia/Manila`), CODING-STANDARDS CS-5, CS-12. Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-031, REQ-011 (notifications), REQ-002, REQ-006 (activity log), REQ-018 (household standing). With D7 Option B: REQ-012 (fee payment approval), REQ-023 (collections by month) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft. r2, 2026-11-28: reconciled with REQ-023 and REQ-031 (conflict C3): a fee counts as collections when the treasurer approves its payment, whichever D7 option is chosen; booking approval never adds to collections |

## Owner decisions

Nothing below is approved yet. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (the office approves every request, as in the mock-up) or B (a per-amenity "Approve automatically" setting) | **A for the first release.** Measure how long requests wait; turn to B for the courts and pool if the wait is the complaint |
| 2 | When a fee counts as collections | **In the month its payment is approved** by the treasurer (REQ-012), fee part only, under D7 Option A or B. Approving the booking adds nothing to collections. The backlog scenario said "in the month the booking was approved"; that would count money no one has checked. Same rule as REQ-023 decision 5 and REQ-031 decision 7 (r2, C3) |
| 3 | (D7 Option B) A booking whose fee isn't submitted by the pay-by time | **Cancelled automatically** by an hourly check, slot reopened, homeowner and office notified. A reminder is sent on the morning of the pay-by day |
| 4 | A request still pending when its slot starts | **Rejected automatically** with "The admin office didn't review this request in time." so it doesn't read "Pending approval" forever |
| 5 | Approving a request from a household that became delinquent after requesting | **Allowed, with the warning shown.** REQ-034 stops new requests; existing ones are the office's call |
| 6 | Who decides bookings | **Admin office and treasurer** (REQ-002 role table) |

## Problem

The office needs one queue of booking requests, decided once, with the homeowner told the outcome and why. In the mock-up, `approveBook` (`index.html` line 1371) changes the status without checking it is still pending, so two staff can both decide the same request, and nothing happens to requests nobody decides.

The backlog story asks for a "Slot conflict" warning with a disabled Approve button. **With REQ-031's slot hold, a conflict can't exist**: the server keeps at most one active booking per slot, so there is never a second request for the same slot to warn about. This REQ drops the warning and tests the guarantee instead, which makes the story smaller.

## Options

### Option A: The office approves every request (recommended)

- **How it works:** Approvals → Bookings lists pending requests, soonest first, with the household's standing. "Approve" confirms the slot (and with D7 Option B, starts the pay-by time); "Reject" asks for a reason. An "Upcoming" view lists approved bookings by amenity and date for key handover and closures.
- **Cost:** moderate: the decide function, two scheduled checks (pay-by and unreviewed), notifications, the queue and the upcoming list.
- **Honest downside:** every ₱150 pool slot waits for a person during office hours.

### Option B: Approve automatically, per amenity

- **How it works:** as A, plus a "Needs approval" tick per amenity in Settings (REQ-030). Untick it for the courts and the request is approved the moment it is made.
- **Cost:** cheap on top of A (about +0.5 day).
- **Honest downside:** nobody asked for it yet, and the office loses the chance to reject, for example, a court slot it wanted for an HOA event (REQ-030 leaves event reservations out of scope).

### Recommendation

**Option A**, as the board's current process. Option B is a ready next step with a clear trigger: if requests wait more than a day on average.

## Story

As an admin office staff member, I want to approve or reject booking requests, seeing each household's standing, so that every slot is decided once and the homeowner knows the outcome.

## Acceptance criteria (Option A, D7 Option B)

```gherkin
Feature: Booking approval

  Background:
    Given Paolo Aquino has the admin role
    And Carmela Cruz has the treasurer role

  Scenario: The queue
    Given 2 pending requests: Basketball Court Nov 28, 17:00–18:00 (Blk 5 Lot 1) and Function Room Dec 19, 13:00–17:00 (Blk 6 Lot 3)
    When Paolo opens Approvals → Bookings
    Then the tab reads "Bookings 2"
    And the Basketball Court request is listed first
    And each row shows amenity, date and slot, household, guests, purpose, fee + deposit and the household's standing

  Scenario: Approve a booking with a fee
    Given it is Dec 7, 2026 in Manila
    When Paolo approves the Function Room booking for Blk 6 Lot 3 on Dec 19, 13:00–17:00
    Then the button reads "Approving…" and is disabled until the save finishes
    And Paolo sees "Booking approved. The household has until Dec 9 to pay ₱3,500.00."
    And the homeowner gets the notification "Booking approved: Function Room, Dec 19, 13:00–17:00. Pay ₱3,500.00 by Dec 9 to keep it."
    And other homeowners see the slot as "Booked"

  Scenario: Approve a free booking
    When Paolo approves the Basketball Court booking with no fee
    Then the homeowner gets the notification "Booking approved: Basketball Court, Nov 28, 17:00–18:00."

  Scenario: The fee counts when its payment is approved (decision 2)
    Given the Function Room booking was approved on Nov 30
    And its ₱3,500.00 fee payment was approved by Carmela on Dec 2
    Then ₱2,500.00 counts in December's amenity fee collections
    And ₱1,000.00 is recorded as a deposit, not collections
    And November's collections don't include it

  Scenario: Approving a booking adds nothing to collections (decision 2)
    Given it is Dec 7, 2026 in Manila
    When Paolo approves the Function Room booking for Blk 6 Lot 3
    Then December's amenity fee collections are unchanged until the fee payment is approved

  Scenario: A slot can never be held twice
    Given an approved booking holds the Function Room on Dec 19, 13:00–17:00
    When any second request for that slot reaches the server
    Then it is refused
    And Approvals never shows two active bookings for one slot

  Scenario: Two staff decide the same request
    Given Paolo and Carmela both have the Function Room request on screen
    When Carmela rejects it and then Paolo presses "Approve"
    Then Paolo sees "Already rejected by Carmela Cruz."
    And the booking stays "Rejected"

  Scenario: The homeowner cancelled meanwhile
    Given the homeowner cancelled the request after Paolo opened the queue
    When Paolo presses "Approve"
    Then he sees "This request was cancelled by the homeowner."
    And the row leaves the queue

  Scenario: Double tap
    When Paolo taps "Approve" twice quickly
    Then the booking is approved once and one notification is sent

  Scenario: Overdue account warning (decision 5)
    Given Blk 9 Lot 4 has 2 overdue bills (REQ-018)
    Then its request shows "Delinquent · 2 months overdue"
    And Paolo can still approve or reject it
    And a household with no overdue bills shows "Good standing"

  Scenario: Reject with a reason
    When Paolo presses "Reject" on the Function Room request, picks "Slot is reserved for an HOA event" and presses "Reject"
    Then the homeowner sees "Rejected: Slot is reserved for an HOA event" under the booking
    And the homeowner gets the notification "Booking not approved: Function Room, Dec 19, 13:00–17:00. Slot is reserved for an HOA event."
    And the slot reads "Available" to every homeowner

  Scenario: A reason is required, and the dialog keeps it
    When Paolo presses "Reject" in the dialog with the reason empty
    Then he sees "Enter a reason. The homeowner will see it."
    Given he has typed a reason
    When he clicks outside the dialog
    Then the dialog stays open with his reason

  Scenario: A pay-by reminder
    Given an approved booking must be paid by Dec 9 and no fee has been submitted
    When it is 08:00 on Dec 9 in Manila
    Then the homeowner gets the notification "Reminder: pay ₱3,500.00 today to keep your Function Room booking on Dec 19."

  Scenario: Unpaid by the pay-by time (decision 3)
    Given an approved Function Room booking must be paid by Dec 9 and no fee has been submitted
    When the hourly booking check runs after 23:59 on Dec 9, Manila time
    Then the booking reads "Cancelled: Fee not submitted by Dec 9"
    And the slot reads "Available"
    And the homeowner gets the notification "Your Function Room booking on Dec 19 was cancelled because the fee wasn't submitted by Dec 9."
    And the admin office gets a notification

  Scenario: A fee submitted in time keeps the booking
    Given the homeowner submitted the fee on Dec 9 and the treasurer hasn't approved it yet
    When the hourly booking check runs after the pay-by time
    Then the booking stays "Approved" with "Fee pending approval"

  Scenario: A request nobody reviewed (decision 4)
    Given a Pickleball Court request for Nov 29, 07:00–08:00 is still pending
    When the hourly booking check runs after 07:00 on Nov 29, Manila time
    Then the booking reads "Rejected: The admin office didn't review this request in time."
    And the homeowner is notified

  Scenario: Upcoming approved bookings
    When Paolo opens Approvals → Bookings → Upcoming and picks "Function Room"
    Then he sees each approved Function Room booking from today on, with date, slot, household, guests and fee status

  Scenario: Nothing waiting
    Given no booking requests are pending
    Then the Bookings tab shows "No booking requests."

  Scenario: Board members and homeowners can't decide
    When a board member's or a homeowner's device sends an approval
    Then the request is refused
    And the booking stays "Pending approval"

  Scenario: Every decision is recorded
    When a booking is approved, rejected or cancelled by a check
    Then the activity log records who (or which check), which booking, the reason, and when
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Decision: status, decided by, decided at, reason, pay-by (Manila date and time), fee status `due` | `bookings/{id}` | Refused unless still pending (`seenUpdatedAt`); reject deletes the slot lock in the same transaction; approve sets the lock's state to `booked` | `decideBooking(bookingId, decision, reason, seenUpdatedAt)` | Own household, staff |
| Automatic cancel and reject | `bookings/{id}`, `slotLocks/{key}` | Hourly scheduled job, `Asia/Manila`; only bookings with fee status `due` past pay-by, or pending past slot start; each in its own transaction, re-checking status | `bookingChecks` job | — |
| Reminder | `notifications` (REQ-011) | Once per booking, at 08:00 Manila on the pay-by day | `bookingChecks` job | Household members |
| Fee collections | `monthlyTotals/{period}.feesCentavos` | Added by `decidePayment` for kind `amenityFee` (extension owned by REQ-031), fee part only, in the period of the payment's approval; deposit kept separately. `decideBooking` never writes it | `decidePayment` | Reports (REQ-023) |
| Change records | `auditLog` | `booking.approved` / `rejected` / `autoCancelled` / `autoRejected`; ids only; actor is the staff uid or the job name | Functions | Board, treasurer |

## UX/UI notes

- **Accessibility:** standing shown as a pill with words ("Delinquent · 2 months overdue", "Good standing"), never colour alone; the reject dialog takes focus and returns it to the row; preset reasons are buttons that fill the reason field, which stays editable.
- **Consistency:** the same Approvals tabs, row layout, "Approve" / "Reject" labels and reject dialog as payments and vehicles; the homeowner sees the reason the same way as a rejected payment.
- **Mobile-first:** admins use desktops, but at phone width each request becomes a card with Approve and Reject at the bottom.
- **States:** empty ("No booking requests."), loading (row placeholders), error (stale decision, network), success toasts that say what happens next ("…has until Dec 9 to pay").
- **Forms:** the reject dialog doesn't close on a backdrop click and keeps the text on error.
- **Safe actions:** Approve and Reject show "Approving…" / "Rejecting…" and are disabled until done; the server refuses anything not still pending (CS-5). Messages say "notification", not "sent by SMS" (CS-12).
- **Stable layout:** the standing pill keeps its column width so rows don't shift as standings load.
- **Roles:** admin office and treasurer decide; board read-only; the function checks the role.

## Copy of record

| Where | Text |
|---|---|
| Tab and heading | Bookings {n} · Booking requests · Soonest first. · Upcoming |
| Row | {amenity} · {purpose} · {date} · {slot} · {name} · {lot} · {n} guests · ₱{fee + deposit} · Free · Delinquent · {n} months overdue · Good standing |
| Buttons | Approve (in flight: Approving…) · Reject (in flight: Rejecting…) |
| Success toasts | Booking approved. The household has until {date} to pay ₱{total}. · Booking approved. · Booking rejected. The slot is open again. |
| Reject dialog | Reject request · Reason shown to the homeowner · Reject · Cancel |
| Reject presets | Slot is reserved for an HOA event · Account has overdue dues · Guest count exceeds the limit |
| Errors | Already approved by {name}. · Already rejected by {name}. · This request was cancelled by the homeowner. · Enter a reason. The homeowner will see it. |
| Notifications to the homeowner | Booking approved: {amenity}, {date}, {slot}. Pay ₱{total} by {pay-by} to keep it. · Booking approved: {amenity}, {date}, {slot}. · Booking not approved: {amenity}, {date}, {slot}. {reason} · Reminder: pay ₱{total} today to keep your {amenity} booking on {date}. · Your {amenity} booking on {date} was cancelled because the fee wasn't submitted by {pay-by}. |
| Automatic reasons | Fee not submitted by {pay-by} · The admin office didn't review this request in time. |
| Empty | No booking requests. · No upcoming bookings for {amenity}. |

## Out of scope

- "Approve automatically" per amenity (Option B).
- Reserving slots for HOA events (REQ-030 out of scope).
- Email or SMS for booking decisions (backlog story 19 may add email).
- Refunds and deposit tracking.

## Open questions

| Question | Who decides |
|---|---|
| Decisions for the owner, rows 1–6 (row 3 depends on D7) | Owner, HOA board for D7 |
| Is the "Account has overdue dues" preset still wanted if REQ-034's pause is on? | Admin office |
| Office review time: is next working day realistic for every request, including weekends? This sets REQ-030's "requests close" hours | Admin office |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. One hourly `bookingChecks` job for reminders, unpaid cancels and unreviewed rejects, each booking in its own transaction: query shapes and indexes (status + payBy; status + slot start).
2. Is "within the hourly check after the pay-by time" acceptable wording for the test, or should the job run more often?
3. Fee collections booked by `decidePayment` for kind `amenityFee` (decision 2) rather than by `decideBooking` as SA-001 §4.3 Flow 2 says ("fees to `monthlyTotals` only when approved"). This diverges from SA-001: confirm or reject (same point in REQ-023 and REQ-031).
4. Size: BA estimate **M, 2–3 person-days with Claude Code** (function, job, notifications, queue and upcoming list, rules and concurrency tests).
