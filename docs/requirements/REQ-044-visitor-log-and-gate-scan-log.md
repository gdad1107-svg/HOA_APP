# REQ-044: Visitor log and gate scan log

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-013 Guest passes and gate](../epics/EPIC-013-guest-passes-and-gate.md) |
| Backlog story | [44 Visitor log and gate scan log](../backlog/BACKLOG.md#44-visitor-log-and-gate-scan-log) |
| Status | **Draft for owner review**. Sol Arch review not yet done. Blocked by D9. |
| Mockup | Screens 44A–44F of the gate mockup (not yet published as an artifact; ready for the main session to publish). Repo copy: [req-040-045-mockup.html](../mockups/req-040-045-mockup.html) |
| Architecture | SA-001 §2b (A7 Visitor log; G4 Inside now and gate log), §3 (`getIdPhotoUrl`, every view audited), §4.2 (`visits`, `gateScans`, Storage `guest-ids/` read only through the function), §8.2, §11.2 ("photo deleted" round trip), Q10. Draft on branch `docs/sa-001-architecture` (r3, `e28d9bc`) |
| Depends on | REQ-042, REQ-043, REQ-006 (activity log), REQ-002 (roles) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

> **Blocked by D9.** The whole gate add-on (REQ-040 to REQ-045, release R4) waits on the HOA board's decision **D9: is the gate add-on in scope?** (+6–10 person-days, backend-plan.md). Nothing here is built until the board says yes.

## Owner decisions

None of these is approved yet.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (searchable on-screen log), B (CSV download only) or C (on-screen log by date, no search) | **A, without a download.** A CSV of guests' names and plates is one more uncontrolled copy; add it through the standard reports (REQ-035) only if the office asks |
| 2 | Who sees the visitor and scan logs | **Admin office staff and the treasurer.** Board members: no, unless the board asks (they are read-only finance, REQ-002). Guards: today only, on Today's Log |
| 3 | Search by guest name: exact words (cheap, indexed) or any part of a name (needs a search index) | **Whole words and plates**, the same token approach as the household directory (REQ-003): "rosa" and "nda 4471" find matches, "ros" does not |
| 4 | What a homeowner sees about their own past passes | **For each pass, how many guests arrived and when, by name** (their own guests). No ID types, no photos, no guard names |

## Problem

After an incident ("a bike went missing on Saturday night", "who came to Blk 6 yesterday?"), the admin office has to answer who came in, when, for whom, in which car, and who tried and was refused. Today that means paging through a paper logbook. The scan log also shows misuse: fake QRs, guessed codes and cancelled passes being tried. If ID photos are kept (REQ-043 Option B), every view must be recorded, because a photo of a government ID is the most sensitive thing the portal holds.

## Options

### Option A: Searchable on-screen log (recommended)

- **How it works:** **Visitor Log** in the admin menu has two tabs. **Arrivals**: one row per visit, searchable by guest name, lot, plate or pass number, filtered by date range. **Gate scans**: every check, with a "Refused only" filter. Fifty rows per page.
- **Where it lives:** admin menu, **Visitor Log** (R4). The guard's **Today's Log** shows the same for today only.
- **Cost:** cheap to moderate (S). Two indexed lists, the search tokens, the logged photo viewer if photos are kept.
- **Honest downside:** search finds whole words, not fragments (decision 3).

### Option B: CSV download only

- **How it works:** the office downloads a date range and searches it in a spreadsheet.
- **Cost:** cheap.
- **Honest downside:** every download is a file of guests' names and plates on an office computer, outside any control or retention. Slower for a quick question.

### Option C: On-screen log by date, no search

- **How it works:** pick a day, read the list.
- **Cost:** cheapest.
- **Honest downside:** "when did plate NDA 4471 come in this month?" means opening 30 days one by one.

### Recommendation

**Option A without a download.** Search is what turns a log into an answer, and keeping it on screen keeps the data inside the portal's access rules and retention.

## Story

As an admin office staff member, I want a searchable log of every arrival and every scan, including refused ones, so that I can answer "who came in?" after an incident.

## Acceptance criteria (Option A)

```gherkin
Feature: Visitor log and gate scan log

  Background:
    Given Paolo Aquino is signed in as admin office staff
    And the visits and scans below exist

  Scenario: Open the visitor log
    When Paolo opens Visitor Log
    Then he sees Arrivals for the last 7 days, newest first
    And each row shows the date, guest, lot visited, time in, time out or "Inside", vehicle, ID type, pass and guard
    And tiles show "Inside now", "Arrivals today" and "Passes valid today"

  Scenario: Search by plate
    When Paolo searches "NDA 4471"
    Then only visits with the plate "NDA4471" are listed

  Scenario: Search by guest name
    When Paolo searches "rosa"
    Then visits by "Rosa Dela Cruz" are listed

  Scenario: Search by lot
    When Paolo searches "blk 4 lot 12"
    Then only visits to Blk 4 Lot 12 are listed

  Scenario: Nothing matches
    When Paolo searches "ZZZ 0000"
    Then he sees "No visits match "ZZZ 0000" between Nov 21 and Nov 27. Try a wider date range."

  Scenario: A date range
    When Paolo sets the dates Oct 1 to Oct 31, 2026
    Then only visits in October 2026 are listed, 50 per page

  Scenario: Gate scans, refused only
    When Paolo opens the "Gate scans" tab and turns on "Refused only"
    Then he sees only scans with the results Upcoming, Expired, Cancelled and Invalid
    And each row shows the date, time, method, result, pass, lot, guard and detail
    And the tab shows the number refused in the date range

  Scenario: A guessed code shows in the scan log
    Given at 9:41 AM a guard typed "K7QX-M9TB", which matches no pass
    Then the scan log shows 9:41 AM, "Code", "Invalid", and the detail "No pass matches K7QX-M9TB"

  Scenario: Opening an ID photo is recorded (REQ-043 Option B)
    When Paolo presses "View ID" for Rosa Dela Cruz's visit on Nov 27
    Then he sees "Viewing ID photos is recorded. Open one only when you need it."
    When he presses "Show photo"
    Then the photo opens
    And the activity log records Paolo, the visit and the time

  Scenario: The photo link doesn't last (REQ-043 Option B)
    Given Paolo opened Rosa's ID photo at 10:00 AM
    When the same photo address is opened at 10:10 AM
    Then the photo does not load

  Scenario: A deleted photo (REQ-043 Option B)
    Given Pedro Santos's ID photo was deleted after the retention period
    Then his visit row shows "Deleted" in the ID column with no "View ID" button

  Scenario: No photos kept (REQ-043 Option A)
    Given ID photos are not required
    Then the ID column shows the ID type only, and there is no "View ID" button

  Scenario: Homeowners don't see ID details
    Given Juan Dela Cruz is a homeowner linked to Blk 4 Lot 12
    When he opens GP-1041 in his past passes
    Then he sees "2 of 2 guests arrived" and "Rosa Dela Cruz · in 9:12 AM · out 1:20 PM"
    And he sees no ID types, ID photos or guard names

  Scenario: The guard's Today's Log
    Given Ramil Santos is signed in as a guard
    When he opens Today's Log
    Then he sees today's arrivals and today's scans only
    And no ID photos and no "View ID" button

  Scenario: Other roles can't open the log
    Given Teresa Villanueva is signed in as a board member
    When she opens the Visitor Log address
    Then she sees "You don't have access to this page" (REQ-002)
    And a direct read of the visits is refused by the rules

  Scenario: Guards can't read old visits
    Given a guard is signed in
    When they read visits from yesterday directly
    Then the rules refuse

  Scenario: First use, nothing logged yet
    Given no guest has been checked in and no pass scanned
    When Paolo opens Visitor Log
    Then he sees "No arrivals yet. Visits appear here when the guard lets a guest in."

  Scenario: Loading and errors
    When the log is loading
    Then Paolo sees placeholder rows, not an empty table
    When the log fails to load
    Then he sees "Couldn't load the visitor log. Check your connection and try again." with "Try again"

  Scenario: The log on a phone
    Given Paolo opens Visitor Log on a 375 px wide phone
    Then each visit is a card, with no sideways scrolling
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Search words on each visit: guest name words, lot key, plate (spaces removed), pass number | `visits/{id}.searchTokens` (array) | Lower case, whole words; same approach as `households.searchTokens` (REQ-003) | `checkIn` | Visitor Log query (`array-contains`) |
| Indexes | `firestore.indexes.json` | `visits` (`searchTokens` array-contains, `inAt` desc); `visits` (`inAt` desc); `gateScans` (`at` desc); `gateScans` (`refused`, `at` desc) with a stored boolean `refused` | — | — |
| Photo view | `auditLog` (REQ-006) | `idPhoto.viewed`: viewer, visit id, time. Ids only, never the photo or the guest name | `getIdPhotoUrl` | Board, treasurer |
| Short-lived photo link | not stored | Signed URL valid for 5 minutes (Sol Arch to set), issued only to admin office and treasurer | `getIdPhotoUrl` | Admin's browser |
| Homeowner pass summary | read from `visits` by household, or a count on the pass | Names and times only for the household's own guests | `checkIn`, `checkOut` | Household |

No new collections: this REQ reads what REQ-042 and REQ-043 write.

## UX/UI notes

- **Accessibility:** search has a visible label "Search guest, lot, plate or pass", is debounced (300 ms) and updates only the table, not the page; the tabs are real tabs (`role="tablist"`, arrow keys); result pills use words; the photo viewer is a modal that takes focus and returns it to "View ID".
- **Consistency:** glossary terms **visit**, **scan**, **ID photo**; the scan results Valid / Upcoming / Expired / Cancelled / Invalid are the same words as in REQ-042; reuse the directory's search and paging (REQ-003) and the one modal.
- **Mobile-first:** cards below 640 px (the mock-up's 8-column table scrolls sideways on a phone, a finding in the backlog review); filters collapse into one "Filters" button.
- **States:** empty (first use; no match, with a wider-range hint); loading (skeleton rows); error (copy above); partial: if the photo function fails, the row still shows and "View ID" says "Couldn't open the photo. Try again."
- **Safe actions:** viewing a photo is a deliberate two-step ("View ID", then "Show photo") so a stray click doesn't create an audit entry or expose a photo on a shared office screen.
- **Roles:** admin office and treasurer (decision 2); guards today only; homeowners their own pass summary; everyone else refused by rules, not just hidden.
- **Privacy:** no download (decision 1); no photo thumbnails in the table (the mock-up shows them, which defeats the view logging); the photo link expires within minutes.

## Copy of record

| Where | Text |
|---|---|
| Admin menu | Visitor Log |
| Heading | Visitor Log · Every guest let in at the gate, and every pass check. |
| Tiles | Inside now · Arrivals today · Passes valid today |
| Tabs | Arrivals · Gate scans |
| Search | Search guest, lot, plate or pass |
| Filters | From · To · Refused only |
| Arrivals columns | Date · Guest · Visiting · In · Out · Vehicle · ID · Pass · Guard |
| Scan columns | Date · Time · Method · Result · Pass · Visiting · Guard · Detail |
| Methods | QR · Code · Expected today |
| Cells | Inside · Deleted · Not on pass · View ID |
| Refused count | {n} refused |
| Photo viewer | Viewing ID photos is recorded. Open one only when you need it. · Show photo · Close |
| Homeowner pass summary | {a} of {n} guests arrived · {name} · in {time} · out {time} · Not arrived |
| Guard Today's Log | Today's Log · {date} · {n} arrivals · {n} scans · Every check is recorded, including refused passes. |
| Empty | No arrivals yet. Visits appear here when the guard lets a guest in. · No visits match "{q}" between {from} and {to}. Try a wider date range. · No scans in this date range. |
| Errors | Couldn't load the visitor log. Check your connection and try again. · Couldn't open the photo. Try again. |

## Out of scope

- CSV or PDF download (decision 1; via REQ-035 later if asked).
- Search by part of a word (decision 3).
- Walk-in visitors not on a pass (REQ-043).
- Alerts on suspicious patterns (many refused scans); Sol Arch may add an operations alert (REQ-042).
- Board access, unless decision 2 changes.

## Open questions

| Question | Who decides |
|---|---|
| D9: is the gate add-on in scope? | HOA board |
| Decisions 1–4 above | Owner |
| How long visit and scan records are kept (SA-001 Q10). Proposed in REQ-045 decision 3. | HOA board with the DPO |
| Will the police or barangay ask for records after an incident, and who in the HOA may release them? | HOA board |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. Signed URL lifetime for `getIdPhotoUrl`, and confirming there is no other read path to `guest-ids/`.
2. The homeowner pass summary: query `visits` by household (rules must then hide ID type and guard fields, which Firestore rules can't do per field) or keep a summary on the pass written by `checkIn` / `checkOut`? I expect the second.
3. Guards reading today's visits only: a rules condition on `inAt`, or a function?
4. Size. BA's read: **1–1.5 person-days**, of which about 0.5 is the photo viewer (Option B only).
