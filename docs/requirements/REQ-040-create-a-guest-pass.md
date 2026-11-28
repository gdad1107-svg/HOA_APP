# REQ-040: Create a guest pass

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-013 Guest passes and gate](../epics/EPIC-013-guest-passes-and-gate.md) |
| Backlog story | [40 Create a guest pass](../backlog/BACKLOG.md#40-create-a-guest-pass) |
| Status | **Draft for owner review**. Sol Arch review not yet done. Blocked by D9. |
| Mockup | Screens 40A–40E of the gate mockup (not yet published as an artifact; ready for the main session to publish). Repo copy: [req-040-045-mockup.html](../mockups/req-040-045-mockup.html) |
| Architecture | SA-001 §3 (`createPass`), §4.2 (`guestPasses`, `counters/gp`), §4.3 Flow 3, §5 (pass card PNG), §8.2 (guest names and plates), R-3. Draft on branch `docs/sa-001-architecture` (r3, `e28d9bc`) |
| Depends on | REQ-001 (sign-in), REQ-002 (roles), REQ-004 (household link), REQ-005 (privacy notice) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

> **Blocked by D9.** The whole gate add-on (REQ-040 to REQ-045, release R4) waits on the HOA board's decision **D9: is the gate add-on in scope?** backend-plan.md prices it separately at +6–10 person-days. Nothing in this REQ is built until the board says yes. If the answer is no, these six REQs are parked, not deleted.

## Owner decisions

None of these is approved yet. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (QR pass with a pass code), B (expected-guest list, no QR) or C (no app: the guardhouse phone and logbook) | **A**. B is the honest fallback if the board wants a cheaper add-on (see Options) |
| 2 | Longest a pass can cover | **3 days**, a setting (mock-up default), counted inclusively: Nov 27 to Nov 29 is 3 days |
| 3 | How far ahead a pass can start | **30 days**, a setting |
| 4 | Most guests and vehicles on one pass | **10 guests, 5 vehicles**, settings. Larger events go through the admin office |
| 5 | Whether the pass carries a mobile number the guard can call (REQ-002 left this to the gate REQ: the mock-up shows the guard the household's contact number) | **Yes, typed or confirmed by the homeowner on each pass**, shown to the guard only on that pass's result. Guards never see `householdContacts` |

## Problem

Today the guard calls the resident about each visitor (EPIC-013). Residents miss calls, cars queue at the gate, and the HOA has no reliable record of who was expected. The homeowner already knows who is coming; the problem is getting that to the guard in a form the guard can trust in seconds.

## Options

### Option A: QR pass with a pass code, shared as an image (recommended)

- **How it works:** under **Guest Passes**, the homeowner enters dates, guests' full names and any vehicles. The portal creates pass GP-1041 with a secret 8-character pass code and shows a QR. The homeowner shares the pass image by chat. At the gate, the guard scans the QR or types the code (REQ-042).
- **Where it lives:** homeowner menu, **Guest Passes** (new item, R4 only).
- **Cost:** moderate. `createPass` function, the form and list, and the pass image drawn on the phone. The scanner is REQ-042.
- **Excludes:** guests whose host has no smartphone (open question: the office creates passes for them).
- **Honest downside:** an image can be forwarded to anyone. The pass is only as strong as the ID check at check-in (REQ-043), which compares the guest to the names on the pass.

### Option B: Expected-guest list, no QR

- **How it works:** the homeowner registers guests the same way, but no QR or code is made. The guard opens **Expected today**, finds the lot, and matches the guest's ID to a name.
- **Cost:** cheap to moderate. Removes the camera scanner and the pass image; REQ-042 drops from L to about M.
- **Honest downside:** the guard searches a list for every car, which is slower at the morning queue, and the only check is the guard's reading of the ID. Nothing the guest carries proves the homeowner sent them.

### Option C: No app, the guardhouse phone and logbook

- **How it works:** homeowners text the guardhouse phone with expected guests; the guard writes arrivals in the logbook.
- **Cost:** nothing to build.
- **Honest downside:** this is roughly today. Texts get lost between shifts, the logbook can't be searched after an incident, and the guardhouse phone holds residents' numbers and guests' names with no control.

### Recommendation

**Option A.** It is the only option where the guest carries something the guard can check without judgement, and it is what the board saw in the mock-up. The QR holds only the pass id and secret code; everything else is looked up on the server at the gate, so a cancelled pass stops working at once (REQ-041). If the board wants the add-on for less, Option B is a real alternative, not a straw man: it keeps most of the value (fewer calls) and gives up speed at peak times and proof of invitation.

## Story

As a homeowner, I want to create a QR pass listing my guests and their vehicles, so that my visitors get through the gate without the guard calling me.

## Acceptance criteria (Option A)

```gherkin
Feature: Creating a guest pass

  Background:
    Given Juan Dela Cruz is a signed-in homeowner linked to Blk 4 Lot 12
    And today is Nov 27, 2026, Manila time
    And a pass can cover up to 3 days, start up to 30 days ahead, and list up to 10 guests and 5 vehicles

  Scenario: Create a pass
    When Juan opens Guest Passes and presses "New guest pass"
    And he enters visit date Nov 27, 2026, valid until Nov 27, 2026, guests "Rosa Dela Cruz" and "Miguel Dela Cruz", and vehicle "NDA 4471" "Gray Toyota Innova"
    And he presses "Create pass"
    Then he sees pass "GP-1041" with a QR code and the pass code in the form "K7QX-M9TA"
    And GP-1041 is listed under "Active and upcoming" with the status "Valid"

  Scenario: Share the pass image
    Given Juan has just created GP-1041
    When he presses "Share pass" on a phone that supports sharing
    Then his phone's share sheet opens with the image "GP-1041.png"
    When he presses "Download pass image" instead
    Then "GP-1041.png" downloads
    And the image shows the QR, the pass code, "Blk 4 Lot 12", the dates and the guests' names
    And the image shows no phone number and no owner name

  Scenario: Reopen a pass later
    Given Juan created GP-1041 yesterday
    When he taps GP-1041 in his list
    Then he sees the same QR and the same pass code

  Scenario: Pressing Create twice makes one pass
    When Juan presses "Create pass" twice quickly
    Then exactly one pass is created
    And the button reads "Creating…" and is disabled until the save finishes

  Scenario: Longer than allowed
    When Juan sets the visit date to Nov 27, 2026 and valid until Dec 2, 2026
    Then he sees "A guest pass can cover up to 3 days" under "Valid until"
    And nothing is created

  Scenario: End before start
    When Juan sets valid until Nov 26, 2026 for a visit on Nov 27, 2026
    Then he sees "The end date can't be before the visit date"

  Scenario: A date in the past
    When Juan sets the visit date to Nov 26, 2026
    Then he sees "The visit date can't be in the past"

  Scenario: Too far ahead
    When Juan sets the visit date to Jan 5, 2027
    Then he sees "A pass can start up to 30 days from today"

  Scenario: At least one guest
    When Juan presses "Create pass" with no guest names
    Then he sees "Add at least one guest's full name, as on their ID"
    And nothing is created

  Scenario: The same guest twice
    When Juan lists "Rosa Dela Cruz" twice on one pass
    Then he sees "Rosa Dela Cruz is listed twice"

  Scenario: Too many guests
    Given Juan has listed 10 guests
    Then "+ Add guest" is disabled with the hint "Up to 10 guests per pass. For a larger event, contact the admin office."

  Scenario: Plate numbers are tidied, not rejected
    When Juan enters the plate "nda4471"
    Then the pass shows the plate "NDA4471"

  Scenario: A number for the guard (if decision 5 is yes)
    When Juan enters "0917 555 0101" in "Number the guard can call"
    Then the guard sees that number only on GP-1041's result at the gate (REQ-042)

  Scenario: What Juan is told about his guests' data
    When Juan opens "New guest pass"
    Then he sees "Your guests' names and plates are shared with the HOA's guards. Let your guests know the guard will check their ID at the gate."
    And a link "How the HOA uses visitor information" opens the privacy notice (REQ-005)

  Scenario: Losing the connection while creating
    Given Juan's phone loses its connection
    When he presses "Create pass"
    Then he sees "Couldn't create the pass. Check your connection and try again."
    And everything he typed is still in the form
    And no pass is created

  Scenario: First visit to Guest Passes
    Given Blk 4 Lot 12 has never had a pass
    When Juan opens Guest Passes
    Then he sees "No guest passes yet. Create one before your visitor arrives, then send them the pass image."

  Scenario: Another role cannot create a pass
    Given a guard is signed in
    When they call `createPass` directly
    Then the server refuses
    And no pass is created

  Scenario: Only Juan's household sees its passes
    Given Ana Reyes is linked to Blk 2 Lot 7
    When Ana opens Guest Passes
    Then she does not see GP-1041
    And a direct read of GP-1041 from her account is refused by the rules

  Scenario: Changing the settings does not change existing passes
    Given GP-1042 covers Nov 27 to Nov 29
    When the admin changes the longest pass to 2 days
    Then GP-1042 still covers Nov 27 to Nov 29
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Guest pass: household, pass code (token), from, until, purpose, guests [name], vehicles [plate, description], note for the guard, number for the guard (decision 5), status (`active` / `cancelled`), created by, created at | `guestPasses/GP-nnnn` (SA-001 §4.2) | Number from `counters/gp` in a transaction; token from a CSPRNG, 8 characters from the 32-character alphabet with no 0/O or 1/I; dates as Manila calendar dates; "Valid / Upcoming / Expired" worked out from the dates, never stored | `createPass` function | Household members (rules); `verifyPass` |
| Pass settings: longest pass (days), how far ahead, most guests, most vehicles | `config/settings.guard` (SA-001 §4.1 has `maxDays`; the rest are new) | Read at creation only | Admin office, treasurer (REQ-045 settings screen) | `createPass`, the form |
| Change record | `auditLog` (REQ-006) | `pass.created`, ids only | `createPass` | Board, treasurer |

**Note for Sol Arch.** Unlike invite codes (REQ-004), the homeowner must be able to reopen a pass and see its code, so the token can't be stored only as a hash. Members of the household may read it; guards and staff may not (they only ever see verdicts from `verifyPass`). Please confirm this is acceptable or propose an alternative. The QR content is `GHOA|GP-n|token` (SA-001 Flow 3); the `GHOA` prefix should come from configuration so each HOA's passes are distinct.

## UX/UI notes

- **Accessibility:** every field has a visible label (the mock-up's guest and plate rows rely on `aria-label` and placeholders: give the group a visible legend and each row a numbered label, "Guest 1"); the remove (×) buttons are at least 44×44 px with "Remove guest 2" as their name; errors sit under their field and are announced; the QR image has alt text "QR code for guest pass GP-1041"; status pills use words, not colour alone.
- **Consistency:** one term per concept from the glossary: **guest pass**, **pass code**, **guest**. The pass code is written `XXXX-XXXX` in the same monospaced style as invite codes (REQ-004). Reuse the mock-up's `.pass` card and `.qrbig` pass view.
- **Mobile-first:** at 375 px, the list comes first and "New guest pass" is a full-width primary button that opens the form as a page, not a side panel; the date fields use the native date picker; the plate field uses `autocapitalize="characters"`.
- **States:** empty (copy above); loading (card skeletons); error (connection message, form kept); success (the pass opens with its QR, and a toast "Pass GP-1041 created"). "Share pass" appears only where the browser supports sharing files; "Download pass image" always appears.
- **Forms:** validate dates on change and names on blur; defaults are today to today; purpose defaults to "Family visit"; the form is a page, so nothing is lost to a backdrop click.
- **Safe actions:** "Create pass" shows "Creating…" and is disabled until done; Sol Arch to confirm the server-side guard (a request id so a retry returns the same pass).
- **Stable layout:** the error line under each field reserves its space.
- **Roles:** homeowners only, for their own household. Hidden menus are not protection: rules and `createPass` refuse other roles.
- **Privacy:** the pass image shows the lot, not the owner's name or number, because pass images get forwarded. The homeowner is told guests' data goes to the guards (SA-001 §8.2).

## Copy of record

| Where | Text |
|---|---|
| Menu item | Guest Passes |
| Page heading | Guest Passes · Create a pass for your visitors. The guard checks it at the gate. |
| Empty state | No guest passes yet. Create one before your visitor arrives, then send them the pass image. |
| Sections | Active and upcoming · Past passes |
| Button | New guest pass |
| Form labels | Visit date · Valid until (hint: Up to {n} days) · Purpose · Guests' full names (hint: As on their ID) · Guest {n} · + Add guest · Vehicles (hint: Leave blank if arriving on foot or by taxi) · Plate number · Colour and model · + Add vehicle · Note for the guard (Optional) · Number the guard can call (Optional) |
| Purposes | Family visit · Friends · Party or event · Contractor or repair · Delivery · Household help · Other |
| Data notice | Your guests' names and plates are shared with the HOA's guards. Let your guests know the guard will check their ID at the gate. · How the HOA uses visitor information |
| Submit | Create pass (in flight: Creating…) |
| Toast | Pass {GP-n} created |
| Pass view | Guest pass {GP-n} · Pass code, if the QR can't be scanned · Visiting · Valid · Guests · Vehicles · None listed · Send the pass image to your guests. They show it at the gate. · Share pass · Download pass image · Copy code |
| Pass image | {HOA name} · GUEST PASS · {GP-n} · {code} · Pass code, if the QR can't be scanned · Visiting {lot} · Valid {dates} · Guests · Vehicles · Show this at the gate. Each guest needs a valid ID. |
| Errors | Add at least one guest's full name, as on their ID. · {name} is listed twice. · A guest pass can cover up to {n} days. · The end date can't be before the visit date. · The visit date can't be in the past. · A pass can start up to {n} days from today. · Up to {n} guests per pass. For a larger event, contact the admin office. · Up to {n} vehicles per pass. · Couldn't create the pass. Check your connection and try again. |

## Out of scope

- Editing a pass after it is created (cancel and create a new one). A later "Add a guest" would be cheap, because the QR doesn't change; raise it if homeowners ask.
- Recurring passes for household help, drivers or tutors.
- Passes created by the admin office for homeowners without a smartphone (open question).
- Sending the pass by SMS or email from the portal. The homeowner shares the image with their own chat app.
- Blocking passes for overdue dues. Story 34 pauses amenity bookings only; refusing guests at the gate is a safety and legal question, not a feature.
- Tenants creating passes (D3).

## Open questions

| Question | Who decides |
|---|---|
| D9: is the gate add-on in scope? | HOA board |
| Decisions 1–5 above | Owner |
| Should the admin office be able to create a pass for a homeowner who phones in (elderly residents, no smartphone)? | Admin office, then owner |
| Will the guardhouse accept the pass on a guest's phone screen, or must it also accept a printout? (Both work with the QR; the printout needs good print contrast.) | Admin office |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. Can members read the pass token (needed to reopen a pass), given guards must never read `guestPasses` directly?
2. The repeat-press guard for `createPass`: a client request id, or a transaction keyed on it?
3. Is `navigator.share` with a file reliable enough on the Android and iOS browsers in A-9 to show "Share pass", with download as the fallback?
4. Size. BA's read, not yet Sol Arch's: **1.5–2 person-days** with Claude Code (function, rules and rules tests, form, list, pass view, image).
