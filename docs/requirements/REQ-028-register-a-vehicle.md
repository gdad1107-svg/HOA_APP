# REQ-028: Register a vehicle

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-009 Vehicles](../epics/EPIC-009-vehicles.md) |
| Backlog story | [28 Register a vehicle](../backlog/BACKLOG.md#28-register-a-vehicle) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 28A–28D of the vehicles and amenities mockup. Repo copy: [req-028-034-mockup.html](../mockups/req-028-034-mockup.html). Not yet published as an artifact (main session to publish) |
| Architecture | SA-001 §3 (operations table: "register a vehicle" as a client write), §4.2 (`vehicles`, Storage `vehicles/{householdId}/{vehicleId}.jpg`), §4.4 item 12 (soft delete), §8.2 (OR/CR retention). Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-001, REQ-002, REQ-004 (a person linked to a household), REQ-011 (in-app notifications), REQ-006 (activity log) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Nothing below is approved yet. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (homeowners register online), B (the office registers vehicles at the counter) | **A**. The homeowner submits once from their phone; the office checks it before the visit, and the visit becomes a quick sticker pick-up |
| 2 | A plate that is **pending** (not yet approved) at another household | **Accept it** and warn the admin office when it reviews (REQ-029). Refuse only a plate already **approved** elsewhere. Otherwise a mistaken or false entry at one lot blocks the real owner |
| 3 | How long the OR/CR photo is kept. It shows the registered owner's name and address (RA 10173) | **Delete it 30 days after the admin decides**; keep the vehicle record. DPO to confirm |
| 4 | A car that is sold or no longer used. Not in the backlog or the mock-up: only a pending registration can be withdrawn | **Include it**: "Remove" on an approved vehicle retires its sticker (about +0.5 day). Without it, the epic's goal "every sticker matches exactly one approved vehicle" fails at the first car sale |
| 5 | Check the plate with a server function (`registerVehicle`) instead of the client write SA-001 §3 describes | **Function**. Rules can refuse a duplicate but can't say why, and homeowners must not be able to read which household holds a plate. Sol Arch to confirm |

## Problem

Residents need an HOA sticker on each vehicle to enter at the gate. Today the admin office keeps the sticker register by hand (EPIC-009), so it can't easily tell whether a plate already has a sticker at another lot, and a resident who asks "is my sticker ready?" has to call or visit.

The mock-up has the form, but it has no duplicate-plate check, deletes a withdrawn registration outright (`removeVeh`, `index.html` line 1379; SA-001 §4.4 item 12), and keeps the OR/CR photo inside the data as text.

## Options

### Option A: Homeowners register online (recommended)

- **How it works:** My Vehicles has a "Register a vehicle" form: plate, type, make and model, colour, optional OR/CR photo. It is saved as "Pending approval" and the admin office is notified. The homeowner sees the status, and later the sticker number (REQ-029).
- **Where it lives:** homeowner menu → My Vehicles (REQ-002 table).
- **Cost:** cheap: one form, one function, one upload path, plus withdraw and remove.
- **Excludes:** nothing by device; needs a connection to submit.
- **Honest downside:** the office still checks the original OR/CR at pick-up, so the photo is a convenience, and storing it is a privacy cost (decision 3).

### Option B: The office registers vehicles at the counter

- **How it works:** the homeowner brings the OR/CR to the office; staff type the vehicle in and hand over the sticker. My Vehicles is read-only for homeowners.
- **Cost:** cheap, slightly cheaper than A: no homeowner form, no upload, no stored OR/CR.
- **Honest downside:** every vehicle costs a visit during office hours and the office does all the typing (about 600+ households, several vehicles each). Homeowners can't see status before they come.

### Recommendation

**Option A.** Homeowners have to visit only once, to pick up a sticker that is already approved, and the office stops retyping. Option B is a fair fallback if the board wants no OR/CR photos stored at all; the plate check and statuses are the same in both.

## Story

As a homeowner, I want to register my vehicle with its plate and an optional OR/CR photo, so that the admin office can approve it and have my sticker ready when I come to pick it up.

## Acceptance criteria (Option A, recommended decisions)

```gherkin
Feature: Registering a vehicle

  Background:
    Given Juan Dela Cruz is a homeowner linked to Blk 4 Lot 12

  Scenario: Register a vehicle
    When Juan registers plate "ABC 1234", type "Car", make and model "Toyota Vios", colour "White"
    And presses "Submit for approval"
    Then the button reads "Submitting…" and is disabled until the save finishes
    And he sees "Vehicle submitted. The admin office will review it."
    And Registered vehicles lists "ABC 1234" as "Pending approval"
    And the admin office gets the notification "Blk 4 Lot 12 registered vehicle ABC 1234."

  Scenario: Register with an OR/CR photo
    When Juan attaches a photo of the OR/CR and submits
    Then the photo is shrunk on his phone before upload
    And the registration shows "OR/CR attached"

  Scenario: The photo is not an image
    When Juan attaches a PDF file as the OR/CR photo
    Then he sees "Choose a photo (JPG or PNG) of the OR/CR."
    And everything else he typed stays in the form

  Scenario: Submitting twice does not register twice
    When Juan taps "Submit for approval" twice quickly
    Then exactly one registration for "ABC 1234" is created

  Scenario: Plates are matched however they are typed
    Given Blk 4 Lot 12 has "ABC 1234" pending approval
    When Juan registers "abc-1234"
    Then he sees "ABC 1234 is already registered to your household."
    And no new registration is created

  Scenario: A plate approved for another household
    Given "NFT 3390" is approved for another household
    When Juan registers "NFT 3390"
    Then he sees "This plate is already registered to another household. Contact the admin office."
    And he is not told which household

  Scenario: A plate pending at another household
    Given "KLM 2290" is pending approval for another household
    When Juan registers "KLM 2290"
    Then it is saved as "Pending approval"
    And the admin office sees both registrations marked "Same plate pending at another lot" (REQ-029)

  Scenario: Required fields
    When Juan leaves "Plate number" empty and moves to the next field
    Then he sees "Enter the plate number, for example ABC 1234."
    When he enters "A" as the plate
    Then he sees "That plate is too short. Enter it as it appears on the vehicle, for example ABC 1234."

  Scenario: A new vehicle without a plate yet
    When Juan enters the conduction sticker number "C3 F421" as the plate
    Then it is accepted like any plate

  Scenario: Network error
    Given Juan's phone loses its connection
    When he presses "Submit for approval"
    Then he sees "Couldn't submit. Check your connection and try again."
    And everything he typed stays in the form
    And no registration is listed

  Scenario: Withdraw a pending registration
    Given "ABC 1234" is pending approval for Blk 4 Lot 12
    When Juan presses "Withdraw" and confirms "Withdraw ABC 1234? The admin office won't review it."
    Then "ABC 1234" is no longer listed
    And it no longer appears in the admin office's queue
    And its OR/CR photo is deleted

  Scenario: Withdraw after it was already decided
    Given Juan has My Vehicles open and the admin approves "ABC 1234" meanwhile
    When Juan presses "Withdraw" and confirms
    Then he sees "This vehicle was already approved. Its sticker number is shown below."
    And "ABC 1234" reads "Approved · Sticker #0460"

  Scenario: Remove an approved vehicle (decision 4)
    Given "ABC 1234" is approved with sticker #0451
    When Juan presses "Remove" and confirms "Remove ABC 1234? Sticker #0451 stops being valid. Please return it to the admin office."
    Then "ABC 1234" is listed under Past vehicles as "Removed"
    And sticker #0451 is never given to another vehicle
    And the admin office gets the notification "Blk 4 Lot 12 removed vehicle ABC 1234 (sticker #0451)."

  Scenario: A rejected vehicle can be registered again
    Given "312 QWE" was rejected with "Plate does not match the OR/CR"
    Then the reason is shown under "312 QWE"
    When Juan registers "312 QWE" again with a new photo
    Then a new registration is "Pending approval"

  Scenario: Another member of the household sees the same vehicles
    Given Ana is also linked to Blk 4 Lot 12
    When she opens My Vehicles
    Then she sees "ABC 1234" and can withdraw or remove it

  Scenario: No vehicles yet
    Given Blk 4 Lot 12 has no vehicles
    When Juan opens My Vehicles
    Then he sees "No vehicles yet. Register one with the form."

  Scenario: Loading
    When Juan opens My Vehicles on a slow connection
    Then placeholder cards show until his vehicles load, never an empty list first

  Scenario: Another household's vehicles are refused
    When Juan's device asks for the vehicles of another household
    Then the request is refused

  Scenario: Staff without a household can't register
    Given Teresa has only the board role
    Then her menu does not show "My Vehicles"
    And a registration sent from her device is refused
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Vehicle registration: household, plate as typed (upper case), plate key (letters and digits only), type, make and model, colour, OR/CR path, status (pending / approved / rejected / withdrawn / removed), sticker number, reason, created by, created at, decided by, decided at, updated at | `vehicles/{vehicleId}` (SA-001 §4.2) | Starting status pending; one open registration (pending or approved) per plate key per household; withdraw only while pending; remove only while approved. Soft delete only (§4.4 item 12) | `registerVehicle`, `withdrawVehicle`, `removeVehicle` functions (decision 5) | Own household; admin office; treasurer |
| Plate index: plate key → household, vehicle | `plates/{plateKey}` | Exists only for an approved vehicle; created by approval (REQ-029), deleted by remove | Functions only | Functions only |
| OR/CR photo | Storage `vehicles/{householdId}/{vehicleId}.jpg` | Image, ≤ 5 MB after shrinking; own household writes; deleted on withdraw and 30 days after a decision (decision 3) | Homeowner (upload), daily job (delete) | Own household, admin office, treasurer |
| Change records | `auditLog` | `vehicle.registered` / `withdrawn` / `removed`; ids only | Functions | Board, treasurer |

Vehicle types: Car, SUV, Van, Pickup, Motorcycle (mock-up `VEH_TYPES`, line 377). Plate key: upper case, spaces and hyphens removed, 2–8 letters or digits.

## UX/UI notes

- **Accessibility:** every field has a visible label (the mock-up's placeholders "ABC 1234" are examples, not labels); errors appear under the field and are announced; the plate card shows the plate as text, not only as an image; status pills carry words, not colour alone.
- **Consistency:** statuses use the glossary's vehicle registration terms; "Withdraw" (pending) and "Remove" (approved) are the only two removal words, each with one meaning. Proposed glossary addition: **Withdrawn** and **Removed** statuses.
- **Mobile-first:** at 375 px the list is the mock-up's vehicle cards (`.vcard`), one per row, with the form below; plate field uses `autocapitalize="characters"`; the photo field opens the camera or gallery.
- **States:** empty ("No vehicles yet…"), loading (placeholder cards), error (network, plate taken), success ("Vehicle submitted…"). Past vehicles (rejected older than 90 days, withdrawn hidden, removed) sit in a collapsed "Past vehicles" section so the main list shows what matters now.
- **Forms:** validate on blur; keep what was typed on any error; the photo is optional and says why it helps ("The admin office uses it to check ownership.").
- **Safe actions:** "Submit for approval" shows "Submitting…" and is disabled until done; "Withdraw" and "Remove" are confirmed; Remove is not undoable in the app (the office can re-approve a new registration).
- **Stable layout:** the "Withdraw" / "Remove" button keeps its space on every card so cards don't change height when a status changes.
- **Roles:** only members of the household register, withdraw or remove; staff can't register for a household in this REQ (Option B would add that). Hidden is not protected: functions check membership.
- **Privacy:** the "already registered" message never names the other household.

## Copy of record

| Where | Text |
|---|---|
| Page heading and intro | My Vehicles · Registered vehicles get an HOA sticker for gate entry. |
| Form | Register a vehicle · Plate number · Type · Make and model · Colour · OR/CR photo (optional) · The admin office uses it to check ownership. · Submit for approval (in flight: Submitting…) |
| Success | Vehicle submitted. The admin office will review it. |
| Card | {plate} · {make and model} · {colour} · {type} · Pending approval · Approved · Sticker #{number} · Rejected: {reason} · OR/CR attached |
| Errors | Enter the plate number, for example ABC 1234. · That plate is too short. Enter it as it appears on the vehicle, for example ABC 1234. · {plate} is already registered to your household. · This plate is already registered to another household. Contact the admin office. · Choose a photo (JPG or PNG) of the OR/CR. · Couldn't submit. Check your connection and try again. · This vehicle was already approved. Its sticker number is shown below. |
| Withdraw confirm | Withdraw {plate}? The admin office won't review it. · Keep it · Withdraw |
| Remove confirm | Remove {plate}? Sticker #{number} stops being valid. Please return it to the admin office. · Keep it · Remove |
| Empty | No vehicles yet. Register one with the form. |
| Section | Past vehicles |
| Notifications to the admin office | {lot} registered vehicle {plate}. · {lot} removed vehicle {plate} (sticker #{number}). |

## Out of scope

- Sticker fees, yearly renewal and a limit per household (EPIC-009 open questions; board).
- Staff registering a vehicle for a household (Option B).
- Guards looking up plates at the gate (R4, EPIC-013).
- Importing the office's existing paper register. Existing stickers are recorded when the vehicle is approved (REQ-029 decision 1).
- The vehicle registry report (backlog story 35).

## Open questions

| Question | Who decides |
|---|---|
| Decisions for the owner, rows 1–5 | Owner (row 3 with the HOA's Data Protection Officer) |
| Is there a sticker fee? Do stickers expire yearly? Is there a limit per household? | HOA board |
| Can a tenant register a vehicle (D3)? Until D3 is decided, any person linked to the household can | HOA board |
| Should the portal accept a vehicle registered to a company or a relative outside the household (OR/CR name differs)? Today the admin decides case by case | Admin office |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. Decision 5: `registerVehicle` as a callable instead of a client write (SA-001 §3), so the duplicate-plate refusal can name the reason without exposing `plates`.
2. Is the 30-day OR/CR deletion best done by the daily job, a Storage lifecycle rule, or both (as for ID photos, §4.4 item 7)?
3. Confirm the plate key normalisation and where it lives (`shared/domain/`).
4. Size: BA estimate **S, 1–1.5 person-days with Claude Code** (function, upload, withdraw, remove, list, rules tests).
