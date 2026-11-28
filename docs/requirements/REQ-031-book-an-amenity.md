# REQ-031: Book an amenity

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-010 Amenity booking](../epics/EPIC-010-amenity-booking.md) |
| Backlog story | [31 Book an amenity](../backlog/BACKLOG.md#31-book-an-amenity) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 31A–31F of the vehicles and amenities mockup. Repo copy: [req-028-034-mockup.html](../mockups/req-028-034-mockup.html). Not yet published as an artifact (main session to publish) |
| Architecture | SA-001 §3 (`requestBooking`: function), §4.2 (`amenities`, `bookings`, `slotLocks`), §4.3 Flow 2 (conflict-safe slot reservation), §4.4 item 3, R-7 (double booking), R-15 (time zone), CODING-STANDARDS CS-5, CS-8, CS-9. Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-030 (amenities), REQ-002, REQ-004, REQ-011 (notifications). With D7 Option B also REQ-007 (QR settings), REQ-010 (submit a QR payment) and REQ-012 (approve a payment). REQ-034 adds the booking pause to this screen |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft. r2, 2026-11-28: reconciled with REQ-010 (conflict C2: this REQ owns the amenity-fee extension of the payment flow; REQ-010 provides the `kind` field) and with REQ-023 and REQ-032 (conflict C3: a fee counts as collections when the treasurer approves its payment) |

## Owner decisions

Nothing below is approved yet. The right-hand column is the BA's recommendation. Row 1 is board decision **D7** (BACKLOG.md).

| # | Decision | Recommended |
|---|---|---|
| 1 | **D7: when the fee is paid.** Option A: with the request (mock-up). Option B: after the admin office approves. Option C: at the admin office | **B**. No refund is ever needed for a rejected request, and the money is checked by the treasurer like every other payment (REQ-002 decision 3: only the treasurer approves payments) |
| 2 | (Option B) Pay-by time | **End of the second day after approval, Manila time, or the slot's start if that is sooner.** A fee submitted before then keeps the booking while the treasurer checks it. Unpaid bookings are cancelled by REQ-032 |
| 3 | Fee and deposit in one payment | **Yes, one QR payment** for fee + deposit, recorded as two amounts. Only the fee counts as collections (glossary: deposits are never income) |
| 4 | What other homeowners see of a held slot | **Only "On hold" or "Booked"**: never the lot, name or purpose (RA 10173 proportionality) |
| 5 | Limits per household (number of upcoming bookings, slots per day) | **None in the app** until the board sets a rule (EPIC-010 open question) |
| 6 | Who owns the fee payment (r2, conflict C2 with REQ-010) | **This REQ owns it.** REQ-010 (R1) stores a `kind` on every payment (`dues` only) and refuses other kinds. This REQ adds, in R3: kind `amenityFee` in `submitPayment`, with booking id and a fixed fee + deposit amount; the "Pay fee" entry point on My bookings; the "Amenity fee" label and no dues allocation in the treasurer's Approvals (`decidePayment`, REQ-012); the fee total in collections (REQ-023 decision 5). REQ-010's reference-number check, screenshot and notifications are reused unchanged. REQ-010 and REQ-012 are not reopened for this |
| 7 | When a fee counts as collections (r2, conflict C3 with REQ-023 and REQ-032) | **In the month the treasurer approves the fee payment**, fee part only; the deposit never counts. This holds for D7 Option A and Option B, since in both the money is checked by the treasurer. Booking approval adds nothing to collections. Agrees with REQ-023 decision 5 and REQ-032 decision 2 |

## Problem

Booking the pool, function room or courts means visiting or messaging the office, and a slot can be promised twice. The mock-up greys out taken slots on screen only (`slotPanel`, `index.html` line 664) and its submit (`FORMS.book`, line 1446) doesn't check again, so two phones can hold the same slot (SA-001 R-7). It asks for the fee before approval, with no refund path when a request is rejected (backlog finding 7, D7). Since REQ-002 decided that only the treasurer approves payments, the mock-up's flow would also have the admin office accepting money it isn't allowed to check.

## Options

The slot hold is the same in every option: the server saves at most one active booking per amenity, date and slot (SA-001 Flow 2).

### Option A: Pay with the request (mock-up)

- **How it works:** the homeowner pays fee + deposit by QR, enters the reference number and requests the slot. The admin office approves the slot; the treasurer separately checks the money.
- **Cost:** moderate (S less than B: no pay-by step).
- **Honest downside:** every rejection or cancellation means a refund handled by hand, which the portal doesn't track. Two people check one booking (office for the slot, treasurer for the money), and a booking can be approved before anyone knows the payment arrived.

### Option B: Request first, pay after approval (recommended)

- **How it works:** the request holds the slot at no charge. When the admin office approves (REQ-032), the booking shows "Pay ₱3,500.00 by Dec 9" with a "Pay fee" button. The homeowner pays by the HOA QR code, enters the reference number and screenshot, and the payment goes to the treasurer's Approvals like any other payment, marked "Amenity fee" (REQ-010, REQ-012). A booking whose fee isn't submitted by the pay-by time is cancelled and the slot reopens (REQ-032).
- **Cost:** moderate to project (L): the request flow plus a pay-by state and an hourly check. The payment screen and approval are reused from R1.
- **Honest downside:** two steps for the homeowner, and a slot can sit held by someone who never pays until the pay-by time. A ₱150 pool slot goes through the same steps as the Function Room.

### Option C: Pay at the admin office

- **How it works:** the portal books the slot; the homeowner pays in cash or by QR at the office when they collect the key or before use; the treasurer records it.
- **Cost:** cheap in the app.
- **Honest downside:** brings back the office visit the story is meant to remove, adds cash handling, and fees don't reach collections unless someone types them in.

### Recommendation

**Option B.** It removes the refund problem at its source and keeps one place where money is checked. If the board later finds the two steps heavy for the courts and pool, a per-amenity "approve automatically" setting (REQ-032 Option B) makes them one step without changing how payment works.

## Story

As a homeowner, I want to pick an amenity, a date and an open slot and request it, then pay the fee once it's approved, so that I can reserve the pool, function room or courts without going to the office.

## Acceptance criteria (Option B, recommended decisions)

```gherkin
Feature: Booking an amenity

  Background:
    Given Juan Dela Cruz is a homeowner linked to Blk 4 Lot 12
    And it is 10:00 on Nov 27, 2026 in Manila
    And the Pickleball Court costs ₱200.00 per slot, allows 8 guests, takes requests up to 60 days ahead and closes requests 24 hours before a slot starts

  Scenario: Request an open slot
    Given the Pickleball Court has 07:00–08:00 open on Nov 29, 2026
    When Juan picks it, enters 4 guests and presses "Request booking"
    Then the button reads "Requesting…" and is disabled until the save finishes
    And he sees "Booking requested. The slot is on hold until the admin office approves it. You'll pay the fee after approval."
    And My bookings shows it as "Pending approval"
    And other homeowners see that slot as "On hold"
    And the admin office gets the notification "Blk 4 Lot 12 requested Pickleball Court on Nov 29, 07:00–08:00."

  Scenario: Two homeowners request the same slot
    Given Juan and Ana Reyes (Blk 2 Lot 7) both have 07:00–08:00 on Nov 29 open on screen
    When both press "Request booking" at the same moment
    Then exactly one booking is saved
    And the other sees "Someone just requested this slot. Pick another one."
    And that slot now shows "On hold" on their screen

  Scenario: Two people in the same household request the same slot
    Given Juan's household already requested 07:00–08:00 on Nov 29
    When another member of Blk 4 Lot 12 requests the same slot
    Then they see "Your household already requested this slot. See My bookings."
    And no second booking is created

  Scenario: Pressing twice, or again after the connection dropped
    When Juan taps "Request booking" twice quickly
    Then exactly one booking is created
    When his connection drops before the confirmation and he presses "Request booking" again
    Then he sees the same confirmation and still only one booking exists

  Scenario: Past dates, full days and the booking window
    Then dates before Nov 27, 2026 cannot be picked
    And dates after Jan 26, 2027 cannot be picked and read "Bookings open 60 days ahead"
    And a day with every slot taken reads "Fully booked"

  Scenario: Requests close 24 hours before the slot
    When Juan picks Nov 28
    Then 06:00–07:00 and 07:00–08:00 read "Closed for requests"
    And 16:00–17:00 reads "Available"

  Scenario: The calendar uses Manila time wherever the phone is
    Given Juan's phone is set to Dubai time, where it is 06:00 on Nov 27
    And it is 16:00 on Nov 26 on a phone set to Honolulu time
    Then on both phones the calendar treats today as Nov 27, 2026, as in Manila
    And slots are shown and checked in Manila time

  Scenario: Too many guests
    When Juan enters 12 guests for the Pickleball Court
    Then he sees "The Pickleball Court allows up to 8 guests."
    And "Request booking" saves nothing until he changes it
    When he enters 0 guests
    Then he sees "Enter at least 1 guest."

  Scenario: The fee is shown before requesting
    When Juan picks a Function Room slot
    Then he sees "Fee ₱2,500.00 + ₱1,000.00 refundable deposit = ₱3,500.00. You pay after the admin office approves."
    When he picks a free amenity
    Then he sees "No fee for this amenity."

  Scenario: The fee changed while the page was open
    Given Juan opened the Function Room at ₱2,500.00 and the treasurer has since changed it to ₱3,000.00
    When he presses "Request booking"
    Then he sees "The fee for the Function Room changed to ₱3,000.00. Check it and request again."
    And no booking is created

  Scenario: The amenity was closed while the page was open
    Given the Swimming Pool was made not bookable after Juan opened it
    When he presses "Request booking"
    Then he sees "The Swimming Pool isn't taking bookings right now. Pick another amenity."

  Scenario: Other households' bookings stay private
    Given Blk 6 Lot 3 holds the Function Room on Dec 19, 13:00–17:00
    When Juan views Dec 19
    Then the slot reads "On hold" with no name, lot or purpose
    And his device cannot read Blk 6 Lot 3's booking

  Scenario: Pay the fee after approval
    Given Juan's Function Room booking for Dec 19, 13:00–17:00 was approved on Dec 7
    Then My bookings shows "Approved" with "Pay ₱3,500.00 by Dec 9" and a "Pay fee" button
    When he presses "Pay fee", pays with the HOA QR code, enters reference number "4021 778 1190", attaches the screenshot and presses "Submit payment"
    Then he sees "Fee submitted. The treasurer will confirm it."
    And the booking shows "Fee pending approval"
    And the treasurer's Approvals lists a ₱3,500.00 payment marked "Amenity fee · Function Room, Dec 19"
    When the treasurer approves it (REQ-012)
    Then the booking shows "Fee paid · OR-00123"
    And ₱2,500.00 counts in amenity fee collections for the month of the treasurer's approval, and ₱1,000.00 as a deposit, not collections (decision 7, REQ-023)

  Scenario: Booking approval alone adds nothing to collections (decision 7)
    Given Juan's Function Room booking was approved on Dec 7
    And no fee payment for it has been approved
    When the treasurer opens Collections for December 2026
    Then the booking's fee is not listed

  Scenario: The amount can't be changed
    When Juan opens "Pay fee"
    Then the amount reads ₱3,500.00 and can't be edited

  Scenario: A reference number already used
    Given reference number "4021 778 1190" was already submitted for another payment
    When Juan submits it for his booking fee
    Then he sees the same refusal as a dues payment (REQ-010)
    And the booking still shows "Pay ₱3,500.00 by Dec 9"

  Scenario: The treasurer rejects the fee payment
    Given Juan's fee payment is rejected with "Amount does not match the screenshot"
    Then the booking shows "Fee rejected: Amount does not match the screenshot. Pay again by Dec 9."
    And "Pay fee" is available again

  Scenario: A free amenity needs no payment
    Given Juan's Basketball Court booking with no fee is approved
    Then the booking shows "Approved" with no "Pay fee" button

  Scenario: My bookings on a phone
    When Juan opens Book Amenities on a 375 px screen
    Then My bookings shows one card per booking with the amenity, date, slot, guests, amount and status
    And nothing on the page scrolls sideways

  Scenario: No bookings yet
    Given Blk 4 Lot 12 has never booked
    Then My bookings shows "No bookings yet. Pick an amenity above to start."

  Scenario: Loading
    When Juan opens Book Amenities on a slow connection
    Then the calendar and slots show placeholders until availability loads
    And no slot reads "Available" before availability has loaded

  Scenario: Offline
    Given Juan's phone has no connection
    Then "Request booking" is disabled and reads "You're offline. Connect to request a booking."

  Scenario: Network error
    When "Request booking" fails because of a network error
    Then he sees "Couldn't send your request. Check your connection and try again."
    And his slot, guests and purpose stay filled in

  Scenario: Only household members can book
    Given Teresa has only the board role
    Then her menu does not show "Book Amenities"
    And a booking request from her device, or from a person not linked to a household, is refused
```

**If the owner picks Option A** instead: the fee box reads "Pay with the HOA QR code on the Dues page, then enter the reference number here.", the request form gains a required reference number and screenshot, and the pay-by scenarios are replaced by "the fee payment appears in the treasurer's Approvals with the request". The fee still counts as collections only when the treasurer approves that payment (decision 7).

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Booking: household, amenity, date (`YYYY-MM-DD`, Manila), slot key and label, guests, purpose (optional, up to 80 characters), fee and deposit (centavos, copied at request), status (pending / approved / rejected / cancelled), requested by, requested at, decided by, decided at, reason, pay-by, fee status (none / due / pending / paid / rejected), payment id, updated at | `bookings/{id}` (SA-001 §4.2) | Created only by `requestBooking`; refused if the amenity isn't bookable, guests are over the limit, the slot doesn't exist, the slot is outside the booking window (REQ-030), the fee differs from what the screen showed, or the slot is held | `requestBooking`; later REQ-032, REQ-033 functions; payment approval (REQ-012) sets fee status | Own household; admin office; treasurer |
| Slot hold | `slotLocks/{amenityId}_{date}_{slotKey}` (Flow 2; slot key per REQ-030 decision 4) | Created in the same transaction as the booking; the id **is** the slot, so a second create fails; holds amenity, date, slot key, state (held / booked) and booking id, **no household** (decision 4); deleted in the same transaction as any reject or cancel | Booking functions only | All signed-in members (availability); query by amenity and month |
| Amenity fee payment | `payments/{id}` (REQ-010) with kind `amenityFee` (**added by this REQ**; REQ-010 provides the `kind` field, decision 6), booking id, fee and deposit amounts | Not applied to dues bills; approval adds the fee part to `monthlyTotals/{period}.feesCentavos` in the approval's period and keeps the deposit separately (decision 7, REQ-023 decision 5); a void subtracts it in the void's period (REQ-014 decision 5) | Homeowner (`submitPayment`, extended here), `decidePayment` (REQ-012, extended here) | As REQ-010 |
| Notifications | `notifications` (REQ-011) | One per request to the admin office | `requestBooking` | Admin office |
| Change records | `auditLog` | `booking.requested`; ids only | Functions | Board, treasurer |

Proposed glossary change: **Fee** "counted as collections when its payment is approved" (instead of "when the booking is approved"), if Option B is chosen. New pills: **Fee due**, **Fee pending approval**, **Fee paid**, **Fee rejected**; booking statuses stay as the glossary lists them.

## UX/UI notes

- **Accessibility:** amenity choice is a labelled button group with `aria-pressed` (mock-up `.amen`); each calendar day has a label such as "Nov 29, 3 of 6 slots open" (mock-up `calendarHTML`); slots are a radio group whose state is in words ("Available", "On hold", "Booked", "Your booking", "Closed for requests"), not only grey; tap targets ≥ 44 px on the calendar at 375 px; errors announced.
- **Consistency:** "Booking", "Slot", "On hold", "Fee", "Deposit" from the glossary; the fee payment reuses REQ-010's payment screen and QR, not a second design; the same reject-reason display as payments.
- **Mobile-first:** steps run top to bottom at 375 px (amenity → date → slot and details → Request booking); the primary button is full width at the bottom of the form; My bookings is a card list on phones (backlog finding 2: the mock-up's table scrolls sideways).
- **States:** empty (no date picked: "Pick a date on the calendar to see open slots."; no bookings), loading (placeholders, never "Available" before data), error (taken, closed, fee changed, network), success (confirmation that says the slot is on hold, not booked), offline (button disabled with the reason).
- **Forms:** guests uses a numeric keyboard with the limit in the label ("Guests (up to 8)"); purpose optional; validate on blur; keep everything on error.
- **Safe actions:** "Request booking" and "Submit payment" show "Requesting…" / "Submitting…" and are disabled until done; the server refuses a second hold for the slot (CS-5, deterministic id).
- **Stable layout:** the fee box and the reference fields keep their space when switching between amenities with and without fees (hide with visibility, don't remove), so the button doesn't jump.
- **Roles:** only household members book; availability shows no other household's details. The function checks membership; the menu hiding it is not the protection.

## Copy of record

| Where | Text |
|---|---|
| Page heading and intro | Book Amenities · Pick an amenity, a date and an open slot. The admin office approves each request. |
| Steps | 1 · Choose an amenity · 2 · Pick a date · 3 · Choose a slot and confirm |
| Amenity button | {name} · ₱{fee} per slot (+ ₱{deposit} deposit) · Free · Up to {n} guests |
| Slot states | Available · On hold · Booked · Your booking · Closed for requests |
| Day states | Fully booked · Bookings open {n} days ahead |
| Form | Guests (up to {n}) · Purpose (optional) · Request booking (in flight: Requesting…) |
| Fee box | Fee ₱{fee} + ₱{deposit} refundable deposit = ₱{total}. You pay after the admin office approves. · Fee ₱{fee}. You pay after the admin office approves. · No fee for this amenity. |
| Success | Booking requested. The slot is on hold until the admin office approves it. You'll pay the fee after approval. |
| Errors | Someone just requested this slot. Pick another one. · Your household already requested this slot. See My bookings. · The {amenity} allows up to {n} guests. · Enter at least 1 guest. · The fee for the {amenity} changed to ₱{fee}. Check it and request again. · The {amenity} isn't taking bookings right now. Pick another amenity. · Couldn't send your request. Check your connection and try again. · You're offline. Connect to request a booking. |
| My bookings | Pending approval · Approved · Pay ₱{total} by {date} · Pay fee · Fee pending approval · Fee paid · {OR number} · Fee rejected: {reason}. Pay again by {date}. · Rejected: {reason} · Cancelled |
| Fee payment | Pay the booking fee · {amenity}, {date}, {slot} · Amount ₱{total} · Reference number · Screenshot of the confirmation · Submit payment (in flight: Submitting…) · Fee submitted. The treasurer will confirm it. |
| Treasurer's Approvals label | Amenity fee · {amenity}, {date} |
| Empty | Pick a date on the calendar to see open slots. · No bookings yet. Pick an amenity above to start. |
| Notification to the admin office | {lot} requested {amenity} on {date}, {slot}. |

## Out of scope

- Booking several slots in one request (each slot is its own booking, as in the glossary), recurring bookings and waitlists (EPIC-010).
- Limits per household (decision 5).
- Paying online through a payment gateway (EPIC-010).
- Recording deposit refunds (EPIC-010 open question).
- Booking pause for overdue accounts (REQ-034) and cancelling (REQ-033).

## Open questions

| Question | Who decides |
|---|---|
| D7 (decision 1) and the pay-by time (decision 2) | HOA board, with the owner |
| Decisions 3–7 | Owner |
| Is an official receipt issued for amenity fees, and how is the deposit acknowledged (D5)? | Treasurer, HOA board |
| What happens to a booking if its fee payment is rejected after the pay-by time has passed? Recommended: it is cancelled at that moment, with the reason, and the homeowner is notified | HOA board |
| Can tenants book (D3)? | HOA board |
| *Resolved in r2:* the conflict with REQ-010 and REQ-023 over amenity fees. REQ-010 now stores `kind` and points here (decision 6); REQ-023 decision 5 and REQ-032 decision 2 count the fee on payment approval (decision 7). REQ-012 is not revised: this REQ states the `amenityFee` behaviour of `decidePayment` | Owner (decisions 6–7) |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. `slotLocks` readable by every member for availability, holding no household id (decision 4), queried by amenity and month: index and read cost per calendar open.
2. Idempotency when the same household retries: return the existing booking when the lock already points at it, rather than an error.
3. Passing the fee the screen showed (or the amenity's `updatedAt`) so `requestBooking` refuses a changed price.
4. Payment kind `amenityFee` in `payments`, `submitPayment` and `decidePayment` without touching dues allocation; this REQ owns the change (decision 6), REQ-010 provides `kind` from R1. Fees reach `feesCentavos` through `decidePayment`, not `decideBooking` as SA-001 §4.3 Flow 2 has it (decision 7): confirm or reject.
5. Manila "today" and the notice and window checks in `shared/domain/dates.js`, with tests around midnight (R-15).
6. Size: BA estimate **L, 4–5 person-days with Claude Code** for Option B (calendar and availability, function and concurrency tests, My bookings cards, fee payment reuse); Option A about 3.5–4.
