# REQ-043: Check guests in and out

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-013 Guest passes and gate](../epics/EPIC-013-guest-passes-and-gate.md) |
| Backlog story | [43 Check guests in and out](../backlog/BACKLOG.md#43-check-guests-in-and-out) |
| Status | **Draft for owner review**. Sol Arch review not yet done. Blocked by D9. |
| Mockup | Screens 43A–43D of the gate mockup (not yet published as an artifact; ready for the main session to publish). Repo copy: [req-040-045-mockup.html](../mockups/req-040-045-mockup.html) |
| Architecture | SA-001 §3 (`checkIn`, `checkOut`), §4.2 (`visits`, Storage `guest-ids/{yyyy-mm-dd}/{visitId}.jpg`), §4.3 Flow 3, §8.2 (guest ID photos), §11.2 (offline: resumable uploads), R-4 (ID photos), Q10 (retention). Draft on branch `docs/sa-001-architecture` (r3, `e28d9bc`) |
| Depends on | REQ-042; REQ-005 (privacy notice); REQ-045 **before any ID photo is kept** (Option B only); REQ-011 (arrival notification, decision 3) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

> **Blocked by D9.** The whole gate add-on (REQ-040 to REQ-045, release R4) waits on the HOA board's decision **D9: is the gate add-on in scope?** (+6–10 person-days, backend-plan.md). Nothing here is built until the board says yes.

## Owner decisions

None of these is approved yet. Decision 1 is the big one: it decides whether REQ-045 is built at all.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (guard checks the ID and records its type, no photo), B (guard photographs each guest's ID, as in the backlog and mock-up) or C (paper logbook for arrivals; the app only verifies passes) | **A for the first slice.** B only if the board and the HOA's Data Protection Officer decide a photo is needed, and only once REQ-045 and the gate privacy notice are live. A setting (`requireId` photo) lets the board switch B on later without a rebuild |
| 2 | Arrived in a vehicle not on the pass (a Grab car, a borrowed car) | **Allowed: "Other vehicle", plate typed by the guard**, recorded on the visit |
| 3 | Tell the homeowner when a guest arrives | **Yes, in-app (REQ-011)**: "Rosa Dela Cruz arrived at the gate at 9:12 AM (GP-1041)." It also lets the homeowner spot a pass being misused |
| 4 | Guests still marked inside after their pass ended | **Shown to the guard as "Pass ended: check if still inside"**; nothing checks them out automatically |

## Problem

After the verdict, the guard has to confirm that the person in the car is a guest on the pass, let them in, and later record that they left, so that "who is inside right now?" and "who came in on Saturday night?" have answers. The backlog asks for a photo of every guest's ID. That is the costliest and riskiest part of the add-on:

- A government ID can show the ID number, birth date and address. Under RA 10173 the HOA must collect only what its purpose needs, tell guests why, protect it and delete it on schedule (SA-001 §8.2, R-4).
- The National Privacy Commission has publicly warned businesses and associations against photographing IDs without safeguards or a privacy notice, and asked for deletion once the purpose is fulfilled ([Philstar, Aug 2023](https://philstar.com/headlines/2023/08/06/2286615/businesses-taking-photos-clients-ids-endangers-data-npc)). I found no NPC opinion specific to subdivision gates; the closest is Advisory Opinion 2018-003 "Visitor Logbook", which I have not read in full (listed in the [NPC 2018 compendium](https://privacy.gov.ph/wp-content/uploads/2023/05/compendium_2018_1519.pdf)). **The DPO should confirm.**
- Photos need a capture step per guest (slow at the queue), uploads over a weak signal, a logged viewer (REQ-044) and the deletion job (REQ-045).

The purpose, "who came in", is met by the guest's name from the pass, the type of ID the guard checked, the time, the plate and the guard's name. A photo adds proof of which ID was shown, which matters only after an incident.

## Options

### Option A: Check the ID, record its type, no photo (recommended for the first slice)

- **How it works:** for each guest on the valid pass, the guard looks at the ID, picks its type, picks the vehicle and presses "Let in". The guest shows "Inside since 9:12 AM". Later the guard presses "Check out".
- **Where it lives:** under the verdict on **Scan Pass**, and on **Visitors Inside**.
- **Cost:** moderate. `checkIn` and `checkOut`, the guest rows, Visitors Inside.
- **Honest downside:** after an incident there is no image proving which ID was shown, and a careless guard could pick a type without looking.

### Option B: Photograph each guest's ID (backlog and mock-up)

- **How it works:** as A, plus a photo of the ID before "Let in". The photo is uploaded to private storage, seen only through the logged viewer (REQ-044), and deleted after the retention period (REQ-045).
- **Cost:** moderate plus: capture and compress on the phone, resumable upload, Storage rules, and REQ-044's viewer and REQ-045 become required (BA's read: +2–3 person-days over A, counting REQ-045).
- **Excludes:** guests who refuse to have their ID photographed (the guard calls the homeowner).
- **Honest downside:** holds sensitive personal data of non-residents; slower at the queue; a privacy notice must be posted at the gate; a breach would be the HOA's to report.

### Option C: Paper logbook for arrivals

- **How it works:** the app verifies passes (REQ-042); the guard writes arrivals in the logbook as today.
- **Cost:** nothing beyond REQ-042.
- **Honest downside:** no "Visitors Inside", no searchable log (REQ-044 can show scans only), and the logbook itself holds guests' names with no control.

### Recommendation

**Option A for the first slice**, with the photo as a setting the board can switch on later. It answers "who came in" at a fraction of the privacy risk and cost, and it doesn't slow the queue. If the board wants photos, build B, but only together with REQ-045 and the gate privacy notice, and with the DPO's sign-off. I'm raising this once; if the owner prefers B from the start, the criteria marked "(Option B)" below apply as written.

## Story

As a guard, I want to check each guest's ID, let them in, and check them out when they leave, so that the HOA knows who is inside the subdivision.

## Acceptance criteria

```gherkin
Feature: Check-in and check-out

  Background:
    Given Ramil Santos is signed in as a guard
    And GP-1041 is valid today for Blk 4 Lot 12 with guests "Rosa Dela Cruz" and "Miguel Dela Cruz" and vehicle "NDA 4471"
    And the guard has scanned GP-1041 and sees "Valid pass"

  Scenario: Let a guest in (Option A)
    When the guard picks "PhilSys National ID" for Rosa Dela Cruz, picks "NDA 4471" and presses "Let in"
    Then Rosa shows "Inside since 9:12 AM"
    And she is listed under Visitors Inside with "Blk 4 Lot 12" and "NDA 4471"
    And the visit is recorded with Ramil as the guard

  Scenario: The homeowner is told (if decision 3 is yes)
    When the guard lets Rosa Dela Cruz in at 9:12 AM
    Then Juan Dela Cruz's notifications show "Rosa Dela Cruz arrived at the gate at 9:12 AM (GP-1041)."

  Scenario: No ID type chosen
    When the guard presses "Let in" for Rosa without picking an ID type
    Then the guard sees "Pick the ID the guest showed"
    And Rosa stays "Not yet arrived"

  Scenario: Let a guest in with an ID photo (Option B)
    Given ID photos are required
    When the guard picks "PhilSys National ID", takes a photo of Rosa's ID, picks "NDA 4471" and presses "Let in"
    Then the guard sees a preview of the photo and "Uploading ID photo…" until it is saved
    And Rosa shows "Inside since 9:12 AM"
    And the ID photo can't be opened again from the gate phone

  Scenario: No ID photo (Option B)
    Given ID photos are required
    When the guard presses "Let in" without a photo
    Then the guard sees "Take a photo of the guest's ID"
    And Rosa stays "Not yet arrived"

  Scenario: The photo doesn't upload (Option B)
    Given ID photos are required and the signal drops during the upload
    When the guard presses "Let in"
    Then the guard sees "The ID photo didn't upload. Try again, or use the paper log and call the homeowner."
    And Rosa stays "Not yet arrived"
    And "Try again" resends the same photo without retaking it

  Scenario: A guest refuses an ID photo (Option B)
    Given ID photos are required
    When Rosa refuses to have her ID photographed
    Then the guard has no way to let her in without a photo
    And the screen says "Guest won't allow an ID photo? Call the homeowner."

  Scenario: Pressing Let in twice
    When the guard presses "Let in" for Rosa twice quickly
    Then exactly one visit is recorded
    And the button reads "Letting in…" and is disabled until the save finishes

  Scenario: The same guest can't be let in twice
    Given Rosa Dela Cruz is inside since 9:12 AM
    When the guard scans GP-1041 again at 10:30 AM
    Then Rosa shows "Inside since 9:12 AM" with no "Let in" button
    And the guard sees "Already inside. If someone else is using this name, check their ID and call the homeowner."

  Scenario: Two guards let the same guest in at once
    When two gate phones press "Let in" for Rosa at the same moment
    Then exactly one visit is recorded
    And the other guard sees "Rosa Dela Cruz was let in a moment ago by another guard."

  Scenario: The pass stops being valid before Let in
    Given the guard opened GP-1042 at 11:58 PM on its last day
    When the guard presses "Let in" at 12:01 AM
    Then the guard sees "This pass has expired. Do not let the guests in without calling the homeowner."
    And no visit is recorded

  Scenario: Another vehicle (if decision 2 is yes)
    When the guard picks "Other vehicle", types "nbc 1234" and lets Miguel in
    Then the visit shows the plate "NBC1234" marked "Not on pass"

  Scenario: Arriving on foot
    When the guard picks "On foot or taxi" and lets Miguel in
    Then the visit shows no plate

  Scenario: Check out
    Given Rosa Dela Cruz is inside since 9:12 AM
    When the guard presses "Check out" for Rosa at 1:20 PM
    Then she shows "Left 1:20 PM" and leaves Visitors Inside

  Scenario: Checking out twice
    Given Rosa was checked out at 1:20 PM
    When another guard presses "Check out" for Rosa on a screen opened earlier
    Then they see "Rosa Dela Cruz was already checked out at 1:20 PM."

  Scenario: Coming back the same day
    Given Rosa left at 1:20 PM and GP-1041 is still valid
    When the guard scans GP-1041 at 3:00 PM and lets Rosa in
    Then a second visit is recorded for Rosa
    And the first visit still reads "Left 1:20 PM"

  Scenario: Visitors Inside
    Given 3 guests are checked in and not checked out
    When the guard opens Visitors Inside
    Then the guard sees 3 guests, each with the lot, the time in, the plate and "Check out"
    And no ID photos

  Scenario: Nobody inside
    Given no guest is checked in
    When the guard opens Visitors Inside
    Then the guard sees "No guests inside right now."

  Scenario: A guest still inside after the pass ended (decision 4)
    Given Ramon Bautista was let in on Nov 27 with a pass that ended on Nov 27
    And he has not been checked out
    When the guard opens Visitors Inside on Nov 28
    Then Ramon shows "Inside since Nov 27, 8:05 AM" and "Pass ended: check if still inside"

  Scenario: No connection at Let in
    Given the gate phone has no connection
    When the guard presses "Let in"
    Then the guard sees "No connection. Nothing was saved. Write this guest in the paper log and try again when the signal returns."
    And Rosa stays "Not yet arrived"

  Scenario: Only guards check guests in
    Given Juan Dela Cruz is signed in as a homeowner
    When he calls `checkIn` directly
    Then the server refuses
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Visit: pass id, household, guest index and name (copied from the pass), ID type, ID checked (true), ID photo path (Option B), plate, plate not on pass (true/false), gate, in at, in guard, out at, out guard | `visits/{id}` (SA-001 §4.2, plus `guestIndex`, `gate`, `plateNotOnPass`, `outGuardUid`) | Created only by `checkIn` in a transaction that re-reads the pass (still valid and active) and refuses a guest already inside on that pass; closed only by `checkOut`, which refuses a visit already out | `checkIn`, `checkOut` | Guard (today and inside now), admin office and treasurer (REQ-044), household (counts and times only, REQ-044) |
| ID photo (Option B) | Storage `guest-ids/{yyyy-mm-dd}/{visitId}.jpg` | Guard claim, image, ≤ 2 MB, compressed on the phone; no read rule (only through REQ-044's logged viewer); deleted by REQ-045 | Guard's phone (upload), path confirmed by `checkIn` | `getIdPhotoUrl` (REQ-044) |
| ID photo setting | `config/settings.guard.requireId` (SA-001 §4.1) | **Default off under Option A**; can be switched on only once REQ-045's job is live | Admin office, treasurer (REQ-045 screen) | `checkIn`, the guard screen |
| ID types | constant list | PhilSys National ID · Driver's license · UMID · Passport · Postal ID · PRC ID · Company or school ID · Other (from the mock-up) | — | Guard screen |
| Arrival notification | `notifications` (REQ-011) | Decision 3 | `checkIn` | Household |

The ID number itself is **never** typed or stored in either option.

## UX/UI notes

- **Accessibility:** each guest is a row with a visible heading (the name); "ID type" and "Arrived by" are labelled selects; "Let in" and "Check out" are at least 48 px tall; statuses are pills with words ("Not yet arrived", "Inside since 9:12 AM", "Left 1:20 PM").
- **Consistency:** glossary terms **visit**, **guest**, **ID photo**; "Let in" and "Check out" are the only labels for these actions, on Scan Pass and on Visitors Inside alike. Reuse the mock-up's `.gst` guest row.
- **Mobile-first:** guest rows stack at 375 px (the mock-up's 4-column form collapses to one); the "Let in" button is full-width at the bottom of each row; Visitors Inside is a card list on the phone, not a table.
- **Speed at the queue:** the ID type remembers nothing between guests (each must be picked, so a guard can't let a carload in without looking), but the vehicle defaults to the pass's only vehicle when there is just one.
- **States:** empty (Visitors Inside copy); loading ("Letting in…", "Uploading ID photo…"); errors (no ID type, no photo, upload failed, no connection, already inside, expired), each with a next step; success (the pill changes and a short toast "Rosa Dela Cruz let in").
- **Safe actions:** "Let in" and "Check out" disabled while saving; the server refuses duplicates (two guards). Check-out has no confirm, because a mistaken check-out is fixed by letting the guest in again; a "Checked out by mistake" undo is out of scope.
- **Stable layout:** when a guest is let in, the form in their row is replaced by the pill and "Check out" in the same space, so the next guest's row doesn't jump.
- **Roles:** guards only. Homeowners never see ID types or photos.
- **Privacy (Option B):** the photo preview shows only until the upload finishes; the gate phone keeps no copy in its gallery (capture inside the page, not through the camera app, where possible: Sol Arch); a notice at the gate tells guests why their ID is photographed and for how long (REQ-005 and the HOA's signage).

## Copy of record

| Where | Text |
|---|---|
| Guest row | {name} · Not yet arrived · Inside since {time} · Left {time} · Already inside. If someone else is using this name, check their ID and call the homeowner. |
| Fields | ID type · Photo of ID (Option B) · Take photo · Retake · Arrived by · {plate} · Other vehicle · Plate number · On foot or taxi |
| Buttons | Let in (in flight: Letting in…) · Check out · Try again |
| Toast | {name} let in · {name} checked out |
| Visitors Inside | Visitors Inside · {n} guests inside now · Pass ended: check if still inside · No guests inside right now. |
| Plate note | Not on pass |
| Notification | {name} arrived at the gate at {time} ({GP-n}). |
| Errors | Pick the ID the guest showed. · Take a photo of the guest's ID. · Uploading ID photo… · The ID photo didn't upload. Try again, or use the paper log and call the homeowner. · Guest won't allow an ID photo? Call the homeowner. · {name} was let in a moment ago by another guard. · {name} was already checked out at {time}. · This pass has expired. Do not let the guests in without calling the homeowner. · This pass was cancelled a moment ago. Do not let the guests in without calling the homeowner. · No connection. Nothing was saved. Write this guest in the paper log and try again when the signal returns. |

## Out of scope

- **Walk-in visitors without a pass** (deliveries, unannounced guests). They stay in the paper log, so the portal's visitor log covers pass guests only. If the office needs one complete log, "Log a walk-in visitor" is a separate story: raise it after the first slice.
- Adding a guest at the gate who isn't on the pass (the homeowner creates or edits a pass).
- Typing or storing ID numbers.
- Automatic check-out.
- Undo of a mistaken check-out.

## Open questions

| Question | Who decides |
|---|---|
| D9: is the gate add-on in scope? | HOA board |
| Decision 1 (ID photo or not), with the DPO | HOA board and Data Protection Officer |
| Decisions 2–4 | Owner |
| Who is the HOA's Data Protection Officer, and is there a gate privacy notice today? | HOA board |
| Is "who came in" needed for walk-ins too? If yes, the log is incomplete without a walk-in story. | Admin office |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. `checkIn` transaction: one open visit per pass and guest index; how to make it deterministic (for example a lock doc `insideNow/{passId}_{guestIndex}`) so two guards can't both succeed.
2. Option B: upload first then `checkIn` with the path (SA-001 Flow 3), or `checkIn` first and upload to a path it returns? What happens to a photo uploaded when `checkIn` is then refused (an orphan to delete)?
3. In-page capture (`getUserMedia`) versus `<input capture>`, which can leave a copy in the phone's gallery on some Android versions.
4. Size. BA's read: Option A **1.5–2 person-days**; Option B **+1–1.5** here, plus REQ-045 and the viewer in REQ-044.
