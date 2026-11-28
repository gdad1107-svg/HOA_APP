# REQ-029: Approve a vehicle and assign a sticker

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-009 Vehicles](../epics/EPIC-009-vehicles.md) |
| Backlog story | [29 Approve a vehicle and assign a sticker](../backlog/BACKLOG.md#29-approve-a-vehicle-and-assign-a-sticker) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 29A–29D of the vehicles and amenities mockup. Repo copy: [req-028-034-mockup.html](../mockups/req-028-034-mockup.html). Not yet published as an artifact (main session to publish) |
| Architecture | SA-001 §3 ("Approve a vehicle, assign a sticker number": function, sequential counter), §4.2 (`counters/sticker`, `vehicles`), §11.2 (repeat-trigger safety, stale references), CODING-STANDARDS CS-5, CS-8. Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-028, REQ-002 (admin office role), REQ-011 (notifications), REQ-006 (activity log) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Nothing below is approved yet. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (always the next number), B (the admin always types the number) or C (next number by default, or record the number of a sticker the vehicle already has) | **C**. Hundreds of vehicles already carry paper-register stickers. With A, every one of them gets a new sticker when it is registered in the portal |
| 2 | Starting number for new stickers | **Set once at go-live** to one more than the highest sticker in the paper register (the admin office tells the developer). The mock-up's sample is #0460 |
| 3 | Who may approve vehicles | **Admin office and treasurer** (REQ-002 role table). Board read-only |
| 4 | Removing an approved vehicle from the admin side (sticker returned, car sold, sticker misused) | **Include**, with a reason; the sticker number is retired, never reused |

## Problem

Every sticker should match exactly one approved vehicle (EPIC-009 goal). In the mock-up, approving takes the next number from a counter in the browser (`approveVeh`, `index.html` line 1373), so two admins approving at the same moment could hand out the same number, and nothing stops the same plate being approved for two households. There is also no way to record that a vehicle already has a sticker from the paper register, and no way to retire a sticker.

## Options

### Option A: Always the next number (mock-up)

- **How it works:** "Approve" gives the vehicle the next number, e.g. #0460; the next approval gets #0461.
- **Cost:** cheap.
- **Honest downside:** existing stickers can't be carried over. When the HOA moves to the portal, every vehicle already on the paper register gets a new number and a new sticker (cost, a queue at the office, and two valid-looking stickers per car until the old ones are scraped off).

### Option B: The admin types the number every time

- **How it works:** the admin types the number on the sticker in their hand; the portal refuses a number already in use.
- **Cost:** cheap.
- **Honest downside:** typos become permanent records; there is no "next number", so the office keeps its own count. Fits only if the HOA buys pre-numbered stickers.

### Option C: Next number by default, or record an existing sticker (recommended)

- **How it works:** the approve dialog offers "New sticker #0460" (selected) or "Already has sticker" with a number field. The portal refuses a number already given to another approved vehicle, and the counter only moves when a new number is used.
- **Cost:** cheap to moderate (about +0.5 day over A).
- **Honest downside:** one more choice in the dialog; an admin could record a wrong existing number. The activity log shows who did it.

### Recommendation

**Option C.** It handles the move from the paper register and pre-numbered sticker stock, with the same uniqueness guarantee as A.

## Story

As an admin office staff member, I want to approve a vehicle and give it a sticker number, either the next one or the one it already has, so that every sticker matches exactly one approved vehicle.

## Acceptance criteria (Option C)

```gherkin
Feature: Approving vehicles and assigning stickers

  Background:
    Given Paolo Aquino has the admin role
    And the next new sticker number is #0460

  Scenario: The queue
    Given "NFT 3390" (Blk 6 Lot 3) and "312 QWE" (Blk 9 Lot 4) are pending approval
    When Paolo opens Approvals → Vehicles
    Then the tab reads "Vehicles 2"
    And each row shows the plate, the vehicle, the household, the date submitted and the OR/CR

  Scenario: Approve with a new sticker
    When Paolo presses "Approve" on "NFT 3390" and confirms with "New sticker #0460" selected
    Then the button reads "Approving…" and is disabled until the save finishes
    And Paolo sees "Approved. Sticker #0460 assigned to NFT 3390."
    And the homeowner sees "Approved · Sticker #0460"
    And the homeowner gets the notification "Vehicle NFT 3390 approved. Pick up sticker #0460 at the admin office."
    And the next new sticker number is #0461

  Scenario: Approve a vehicle that already has a sticker
    When Paolo presses "Approve" on "NFT 3390", chooses "Already has sticker" and enters "0137"
    Then the homeowner sees "Approved · Sticker #0137"
    And the homeowner gets the notification "Vehicle NFT 3390 approved with your existing sticker #0137."
    And the next new sticker number is still #0460

  Scenario: An existing sticker number already in use
    Given sticker #0137 belongs to approved vehicle "DAE 7781"
    When Paolo approves "NFT 3390" with existing sticker "0137"
    Then he sees "Sticker #0137 is already assigned to DAE 7781 (Blk 2 Lot 10)."
    And "NFT 3390" stays "Pending approval"

  Scenario: Two approvals at once never share a sticker
    When two admins approve two different vehicles with "New sticker" at the same moment
    Then the vehicles get different sticker numbers
    And the next new sticker number has moved by two

  Scenario: Two admins decide the same vehicle
    Given Paolo and Carmela both have "NFT 3390" on screen
    When Carmela approves it first and then Paolo presses "Approve"
    Then Paolo sees "Already approved by Carmela Cruz. Sticker #0460."
    And no second sticker number is used

  Scenario: Double tap
    When Paolo taps "Approve" twice quickly in the dialog
    Then exactly one sticker number is used

  Scenario: The homeowner withdrew it meanwhile
    Given the homeowner withdrew "NFT 3390" after Paolo opened the queue
    When Paolo presses "Approve"
    Then he sees "This registration was withdrawn by the homeowner."
    And the row leaves the queue

  Scenario: The same plate pending at two households
    Given "KLM 2290" is pending for Blk 7 Lot 2 and for Blk 3 Lot 8
    Then both rows show "Same plate pending at another lot"
    When Paolo approves the one for Blk 7 Lot 2
    Then the row for Blk 3 Lot 8 shows "Plate approved for another lot" and its "Approve" button is disabled

  Scenario: A plate already approved elsewhere is refused
    Given "KLM 2290" is approved for Blk 7 Lot 2
    When an approval of "KLM 2290" for Blk 3 Lot 8 reaches the server
    Then it is refused with "KLM 2290 is already approved for Blk 7 Lot 2. Reject this registration or remove the other vehicle first."

  Scenario: View the OR/CR
    When Paolo presses "View" in the OR/CR column
    Then the photo opens in a dialog with its alt text "OR/CR for NFT 3390"
    And a registration without a photo reads "Not attached"

  Scenario: OR/CR photos are deleted after 30 days (REQ-028 decision 3)
    Given "NFT 3390" was approved 31 days ago
    Then its OR/CR column reads "Deleted after 30 days"

  Scenario: Reject with a reason
    When Paolo presses "Reject" on "312 QWE", picks "Plate does not match the OR/CR" and presses "Reject"
    Then the homeowner sees "Rejected: Plate does not match the OR/CR" under the vehicle
    And the homeowner gets the notification "Vehicle 312 QWE was not approved: Plate does not match the OR/CR."
    And no sticker number is used

  Scenario: A reason is required
    When Paolo presses "Reject" in the dialog with the reason empty
    Then he sees "Enter a reason. The homeowner will see it."
    And the dialog stays open

  Scenario: The reject dialog keeps what was typed
    Given Paolo has typed a reason
    When he clicks outside the dialog
    Then the dialog stays open with his reason

  Scenario: Remove an approved vehicle (decision 4)
    Given "DAE 7781" is approved with sticker #0438
    When Paolo opens Approvals → Vehicles → Approved, presses "Remove" on it, enters "Sticker returned, car sold" and confirms
    Then "DAE 7781" reads "Removed" for the homeowner, with the reason
    And sticker #0438 is never assigned again

  Scenario: Nothing waiting
    Given no vehicle registrations are pending
    Then the Vehicles tab shows "No vehicle registrations waiting."

  Scenario: A board member can look but not decide
    Given Teresa has the board role
    When her device sends an approval of "NFT 3390"
    Then the request is refused
    And "NFT 3390" stays "Pending approval"

  Scenario: Every decision is recorded
    When Paolo approves, rejects or removes a vehicle
    Then the activity log records who, which vehicle, the sticker number or reason, and when
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Next new sticker number | `counters/sticker` (SA-001 §4.2) | Moves by one only when a new number is used, inside the approval transaction; set once at go-live (decision 2) | `decideVehicle` | Approve dialog (through the function's response or a staff-readable field) |
| Sticker index: number → vehicle, household, status (active / retired) | `stickers/{number}` | Created in the approval transaction; refusing if it exists makes a duplicate impossible; retired on remove, never deleted | `decideVehicle`, `removeVehicle` | Staff |
| Plate index | `plates/{plateKey}` (REQ-028) | Created on approval in the same transaction; refused if it exists for another household; deleted on remove | Functions only | Functions only |
| Vehicle decision: status, sticker number, sticker source (new / existing), reason, decided by, decided at | `vehicles/{vehicleId}` | Refused unless still pending (`seenUpdatedAt`) | `decideVehicle(vehicleId, decision, sticker, reason, seenUpdatedAt)` | Own household, staff |
| Notification | `notifications` (REQ-011) | One per decision | Functions | Household members |
| Change records | `auditLog` | `vehicle.approved` / `rejected` / `removed`, with sticker number; ids only | Functions | Board, treasurer |

## UX/UI notes

- **Accessibility:** the sticker choice is a labelled radio group ("New sticker #0460" / "Already has sticker"); the number field is enabled only for the second choice and is labelled; dialog focus moves in and returns to the row's button; the OR/CR image has alt text.
- **Consistency:** reuses the mock-up's Approvals tabs (Payments · Bookings · Vehicles), its reject dialog with preset reasons, and the same "Approve" / "Reject" labels and positions as payments and bookings. Sticker numbers always show as "#" plus four digits.
- **Mobile-first:** admins mostly use a desktop (PERSONAS.md), but at phone width the queue becomes one card per registration, with Approve and Reject at the bottom of each card.
- **States:** empty ("No vehicle registrations waiting."), loading (row placeholders), error (stale, duplicate sticker, duplicate plate), success toast naming the sticker.
- **Forms:** existing sticker number uses a numeric keyboard and accepts "137", "0137" or "#0137"; validated on blur.
- **Safe actions:** Approve, Reject and Remove are disabled with "Approving…" / "Rejecting…" / "Removing…" while in flight; the server refuses anything not still pending (CS-5). The dialog doesn't close on a backdrop click.
- **Stable layout:** the "Same plate pending at another lot" pill keeps its space in the status column.
- **Roles:** admin office and treasurer decide; board sees nothing it can change; homeowners never see the queue. Enforced in the function, not just the menu.

## Copy of record

| Where | Text |
|---|---|
| Tab and heading | Vehicles {n} · Vehicle registrations · New stickers start at #{next}. |
| Approve dialog | Approve {plate}? · New sticker #{next} · Already has sticker · Sticker number · Approve (in flight: Approving…) · Cancel |
| Success toast | Approved. Sticker #{number} assigned to {plate}. |
| Homeowner card | Approved · Sticker #{number} · Rejected: {reason} · Removed: {reason} |
| Notifications | Vehicle {plate} approved. Pick up sticker #{number} at the admin office. · Vehicle {plate} approved with your existing sticker #{number}. · Vehicle {plate} was not approved: {reason}. · Vehicle {plate} was removed by the admin office: {reason}. |
| Warnings | Same plate pending at another lot · Plate approved for another lot |
| Errors | Sticker #{number} is already assigned to {plate} ({lot}). · Already approved by {name}. Sticker #{number}. · This registration was withdrawn by the homeowner. · {plate} is already approved for {lot}. Reject this registration or remove the other vehicle first. · Enter a reason. The homeowner will see it. |
| Reject presets | Plate does not match the OR/CR · OR/CR is not under a household member |
| OR/CR column | View · Not attached · Deleted after 30 days |
| Empty | No vehicle registrations waiting. |

## Out of scope

- Printing stickers, sticker fees and renewal (board questions in EPIC-009).
- Importing the paper register in bulk. Existing stickers are recorded one by one at approval (Option C).
- The vehicle registry report (story 35) and gate plate lookup (R4).

## Open questions

| Question | Who decides |
|---|---|
| Decisions for the owner, rows 1–4 | Owner |
| Are stickers numbered when issued, or bought pre-numbered? Highest number in the paper register today? | Admin office |
| Should an existing sticker number from the paper register be checked against that register before it's accepted? (The portal can't see the paper register.) | Admin office |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. Confirm `stickers/{number}` as the uniqueness guard alongside `counters/sticker`, and that a refused transaction leaves no gap.
2. Counter contention: two approvals at once serialise on `counters/sticker`. Acceptable at office volumes? (Emulator concurrency test with a negative control, CS-8.)
3. How the dialog shows the next number without letting clients read `counters` broadly.
4. Size: BA estimate **S–M, 1.5–2 person-days with Claude Code** (function, two indexes, queue, dialogs, remove, rules and concurrency tests).
