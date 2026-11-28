# REQ-042: Guard verifies a pass at the gate

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-013 Guest passes and gate](../epics/EPIC-013-guest-passes-and-gate.md) |
| Backlog story | [42 Guard verifies a pass at the gate](../backlog/BACKLOG.md#42-guard-verifies-a-pass-at-the-gate) |
| Status | **Draft for owner review**. Sol Arch review not yet done. Blocked by D9. |
| Mockup | Screens 42A–42E of the gate mockup (not yet published as an artifact; ready for the main session to publish). Repo copy: [req-040-045-mockup.html](../mockups/req-040-045-mockup.html) |
| Architecture | SA-001 §3 (`verifyPass`), §4.2 (`gateScans`), §4.3 Flow 3 and its security finding, §8.1 (Guard role), §9 (guard device, `BarcodeDetector` with jsQR fallback, online only), R-3 (forged passes), R-10 (gate offline), Q8 (guard accounts), A-7 (2 s verify), A-9, A-12 (one gate). Draft on branch `docs/sa-001-architecture` (r3, `e28d9bc`) |
| Depends on | REQ-040, REQ-002 (guard role; and its Option A staff-and-roles page, which REQ-002 deferred to R4), REQ-011 (notifications) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

> **Blocked by D9.** The whole gate add-on (REQ-040 to REQ-045, release R4) waits on the HOA board's decision **D9: is the gate add-on in scope?** (+6–10 person-days, backend-plan.md). Nothing here is built until the board says yes.

## Owner decisions

None of these is approved yet.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (live camera and code entry, online only, paper fallback), B (A plus an offline mode) or C (photo of the QR, as in the mock-up) | **A**. Revisit B only if the admin office reports the guardhouse signal drops often (measure first) |
| 2 | Guard accounts (SA-001 Q8): one per guard, or one shared account per gate post | **One per guard**, signed in on the gate phone at the start of each shift, so every scan and check-in names a person. It needs REQ-002's staff-and-roles page (Option A) in R4, because the agency's guards change often |
| 3 | What a non-valid verdict shows | **The verdict, pass id, lot, dates and the number the guard can call (REQ-040 decision 5). No guest names.** Guest names and vehicles show only for a valid pass (SA-001 Flow 3) |
| 4 | Limit on pass codes that don't match, per guard account | **10 in 10 minutes**, then a 10-minute wait (Sol Arch to confirm). Codes typed are 1 in about 1.1 × 10¹² |
| 5 | Is "Expected today" (open a pass without its QR or code, for a guest whose phone died) allowed? | **Yes**, listing lot, guest count and plates only. Every open from the list is recorded as a scan with the method "Expected today" |

## Problem

The guard needs a yes or no in seconds, with cars queuing, glare on the screen and sometimes weak signal (Guard persona). The mock-up reads a photo of the QR, which costs several taps per guest, and it accepts a pass number without its secret code (SA-001 Flow 3, R-3): anyone who guesses the next GP number gets a valid pass. Every check, including refusals and fakes, must be recorded so the office can answer "who tried to get in?" (REQ-044).

## Options

### Option A: Live camera and code entry, online only, with a paper fallback (recommended)

- **How it works:** the guard's **Scan Pass** screen opens the rear camera in the page. Pointing it at the QR shows the verdict without pressing anything. Below it the guard can type the pass code, or open a pass from **Expected today**. If the connection drops, the screen says so and the guard uses the paper log and calls the homeowner (R-10).
- **Where it lives:** the guard menu: **Scan Pass**, **Visitors Inside**, **Today's Log** (REQ-002). The portal is installed on the gate phone as an app icon (PWA).
- **Cost:** a project-sized story (L). Live camera with a fallback decoder, `verifyPass` with rate limit, the scan log, the verdict screen, Expected today.
- **Excludes:** working without a connection.
- **Honest downside:** when the signal drops, the gate is back on paper until it returns.

### Option B: Option A plus an offline mode

- **How it works:** the gate phone keeps today's passes (with their codes in a form it can check) and verifies them without a connection, queueing scans and check-ins to send later.
- **Cost:** a project on top of A (BA's read: +2–4 person-days; Sol Arch to price). Sync, conflict handling, and a device that holds working credentials.
- **Honest downside:** a pass cancelled while the phone is offline is still accepted, and a lost or stolen gate phone holds the day's valid codes and guests' names. That is a new privacy and security risk, to solve a problem nobody has measured yet.

### Option C: Photo of the QR (as in the mock-up)

- **How it works:** the guard presses "Scan QR", the phone's camera app takes a photo, and the page decodes it.
- **Cost:** cheap: it exists in the mock-up.
- **Honest downside:** three or four taps per guest and blurry photos in glare. backend-plan.md already says the real app needs a live view.

### Recommendation

**Option A.** It is the speed the guard needs and what backend-plan.md priced. Before choosing B, ask the admin office how often the guardhouse loses signal; if it is rare, paper for those minutes is cheaper and safer than an offline copy of every valid pass.

**Forgery and replay, covered in A:**
- **Guessing:** a typed code must match the secret pass code, and a QR must match both the pass id and its code. A pass number alone never works. Wrong codes are rate-limited per guard account (decision 4).
- **Altered or fake QR:** the server looks the pass up; nothing in the QR is trusted except as a lookup key. Any QR that isn't one of this HOA's passes reads "not a valid guest pass".
- **Screenshot shared beyond the guests (replay):** passes are meant to be shared, so a copy scans as valid. The defence is at check-in (REQ-043): the guard lets in only named guests after checking their ID, and a guest already inside can't be let in again.
- **Guards browsing passes:** guards never read the pass list. `verifyPass` returns one pass per check, and Expected today returns no codes.

## Story

As a guard, I want to scan a guest's QR with the phone camera, or type the pass code, so that I know in seconds whether to let them in.

## Acceptance criteria (Option A)

```gherkin
Feature: Verifying a guest pass

  Background:
    Given Ramil Santos is signed in as a guard on the gate phone
    And today is Nov 27, 2026, Manila time

  Scenario Outline: The verdict the guard sees
    Given a pass that is <state>
    When the guard points the camera at its QR
    Then the guard sees "<verdict>" with the pass id and the lot, without pressing anything
    And the scan is recorded with the method "QR" and the result "<result>"

    Examples:
      | state                     | verdict        | result    |
      | valid today               | Valid pass     | Valid     |
      | starting on Dec 5, 2026   | Not valid yet  | Upcoming  |
      | ended on Nov 25, 2026     | Pass expired   | Expired   |
      | cancelled                 | Pass cancelled | Cancelled |

  Scenario: A valid pass shows the guests
    Given GP-1041 is valid today for Blk 4 Lot 12 with guests "Rosa Dela Cruz" and "Miguel Dela Cruz" and vehicle "NDA 4471"
    When the guard scans GP-1041
    Then the guard sees "Valid pass · GP-1041" and "Check each guest's ID before letting them in."
    And the guests are listed as "Not yet arrived", with the vehicle "NDA 4471 · Gray Toyota Innova"

  Scenario: A pass that isn't valid shows no guest names
    Given GP-1043 starts on Dec 5, 2026
    When the guard scans GP-1043
    Then the guard sees "Not valid yet · GP-1043" and "This pass starts on Sat, Dec 5. Call the homeowner before letting anyone in."
    And the guard sees the lot, the dates and the number to call
    And no guest names or vehicles are shown

  Scenario: A fake or altered QR
    When the guard scans a QR that is not one of this HOA's passes
    Then the guard sees "Not a valid pass" and "This QR is not a valid guest pass for this subdivision. It may be fake or altered."
    And the scan is recorded as "Invalid"

  Scenario: A real pass id with the wrong code
    Given GP-1041 exists with pass code "K7QX-M9TA"
    When the guard scans a QR reading "GHOA|GP-1041|K7QXM9TB"
    Then the guard sees "Not a valid pass"
    And the scan is recorded as "Invalid"

  Scenario: Typing the pass code
    When the guard types "k7qx m9ta" in "Or type the pass code" and presses "Check code"
    Then the guard sees "Valid pass · GP-1041"
    And the scan is recorded with the method "Code"

  Scenario: Typing a pass number is not enough
    When the guard types "GP-1041" and presses "Check code"
    Then the guard sees "No guest pass matches GP-1041. Ask the guest for the 8-character pass code under the QR, or call the homeowner."
    And the scan is recorded as "Invalid"

  Scenario: Too many codes that don't match
    Given the guard's account has had 10 codes that don't match in the last 10 minutes
    When the guard checks another code
    Then the guard sees "Too many codes that don't match. Wait 10 minutes, or call the homeowner."
    And the code is not checked
    And the QR camera still works

  Scenario: The guest's phone is dead
    Given GP-1041 is valid today
    When the guard taps Blk 4 Lot 12 under "Expected today"
    Then GP-1041 opens as "Valid pass" without scanning
    And the scan is recorded with the method "Expected today"

  Scenario: Expected today shows no codes or names
    When the guard opens "Expected today"
    Then each row shows the lot, the number of guests, the plates and how many have arrived
    And no pass codes or guest names are shown until a pass is opened

  Scenario: Nothing expected today
    Given no pass is valid today
    When the guard opens "Expected today"
    Then the guard sees "No passes for today. A guest without a pass: call the homeowner and use the paper log."

  Scenario: A pass ends at midnight, Manila time
    Given GP-1042 is valid until Nov 27, 2026
    When the guard scans it at 11:59 PM on Nov 27
    Then the guard sees "Valid pass"
    When the guard scans it at 12:01 AM on Nov 28
    Then the guard sees "Pass expired"

  Scenario: Checking takes a moment
    When the guard scans a QR
    Then "Checking pass…" shows at once, with the camera paused
    And the verdict replaces it within 2 seconds on the gate phone over 4G (budget A-7, checked in the performance test)

  Scenario: No connection
    Given the gate phone has no connection
    When the guard scans a QR
    Then the guard sees "No connection. The pass could not be checked. Use the paper log and call the homeowner."
    And the guard never sees "Valid pass" for a pass that was not checked
    And "Try again" checks the same QR again

  Scenario: A weak signal
    Given the check has not answered after 10 seconds
    Then the guard sees "Still checking. If the signal is weak, use the paper log and call the homeowner." with "Try again"

  Scenario: The camera is blocked
    Given the browser has been refused camera access
    When the guard opens Scan Pass
    Then the guard sees "The camera is blocked. Allow camera access for this app in the phone's settings, or type the pass code."
    And the code field is ready to type in

  Scenario: Scanning the next guest
    Given the guard has a verdict open
    When the guard presses "Scan next"
    Then the camera view returns, ready to scan

  Scenario: Other roles cannot verify
    Given Juan Dela Cruz is signed in as a homeowner
    When he calls `verifyPass` directly
    Then the server refuses
    And no scan is recorded

  Scenario: Guards cannot list passes
    Given a guard is signed in
    When they read the guest pass collection directly
    Then the rules refuse

  Scenario: A guard account that was removed
    Given the admin office removed Ramil's guard role at 2:00 PM
    When Ramil scans a pass at 2:05 PM on the gate phone
    Then the server refuses with "Your guard access was removed. Ask the admin office."
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Scan: pass id (if matched), household, method (`qr` / `code` / `list`), result (`Valid` / `Upcoming` / `Expired` / `Cancelled` / `Invalid`), guard, gate, at, detail | `gateScans/{id}` (SA-001 §4.2, plus `gate`, `householdId`, `detail`) | Written by the server on every check, including refusals; never by clients; never edited. `detail` holds at most the typed code (not raw QR content, which could be anything) | `verifyPass` | Admin office, treasurer (REQ-044); the guard's Today's Log |
| Wrong-code attempts | `verifyAttempts/{uid}` | 10 per 10 minutes per guard account | `verifyPass` | `verifyPass` |
| Verdict returned to the guard | not stored | Valid: lot, dates, guests with today's arrival state, vehicles, note, number to call. Others: lot, dates, number to call. Status worked out in Asia/Manila time | `verifyPass` | Guard's screen |
| Expected today | not stored | Today's valid passes: pass id, lot, guest count, plates, arrived count. No codes, no names | `expectedToday` function (SA-001 Flow 3 note) | Guard |
| Gate name | `config/settings.guard.gates` | One gate, "Main Gate" (A-12); a field, so more gates is not a redesign | Admin office | Scans, visits |

## UX/UI notes

- **Accessibility:** the verdict is colour **plus** an icon **plus** the word (✓ Valid pass / ! Not valid yet / ✕ Pass expired, Pass cancelled, Not a valid pass), at least 1.4 rem, with contrast of at least 4.5:1 on its background; the verdict is announced (`role="status"` for valid, `role="alert"` for refusals); the code field has a visible label and accepts lower case, spaces and hyphens; every button is at least 48 px tall for gloved or wet hands.
- **Consistency:** glossary terms **scan**, **pass code**, **guest pass**; statuses Valid, Upcoming, Expired, Cancelled, Invalid in the log, and the verdict phrases above on screen. The pass code style matches REQ-040 and REQ-004.
- **Mobile-first:** designed for the gate phone held one-handed. The camera view fills the top half; the code field and "Expected today" sit below within thumb reach. No sideways scrolling.
- **States:** empty Expected today (copy above); loading ("Checking pass…", camera paused so the same QR isn't read twice); error (no connection, weak signal, camera blocked, too many codes), each saying what to do next; success (the verdict). The camera resumes only on "Scan next", so one QR makes one scan.
- **Outdoors:** high-contrast verdict colours that read in sunlight; screen kept awake while Scan Pass is open (Sol Arch: Screen Wake Lock where supported).
- **Safe actions:** verifying changes nothing except the log, so it needs no confirm. A repeated read of the same QR within a few seconds is one scan (Sol Arch to define).
- **Stable layout:** the verdict area reserves its height under the camera, so buttons don't jump when it appears.
- **Roles:** guard, and staff for testing in staging only. Rules refuse direct reads of `guestPasses` by guards (hidden is not protection).
- **Privacy:** non-valid verdicts show no guest names (decision 3); the guard sees the homeowner's number only if the homeowner put it on the pass (REQ-040 decision 5), never from `householdContacts`.

## Copy of record

| Where | Text |
|---|---|
| Guard menu | Scan Pass · Visitors Inside · Today's Log |
| Scan heading | Scan Guest Pass · Point the camera at the guest's QR. |
| Code entry | Or type the pass code · e.g. K7QX-M9TA · Check code |
| Checking | Checking pass… |
| Valid | Valid pass · {GP-n} · Check each guest's ID before letting them in. |
| Not valid yet | Not valid yet · {GP-n} · This pass starts on {date}. Call the homeowner before letting anyone in. |
| Expired | Pass expired · {GP-n} · It was valid for {dates}. Ask the homeowner to create a new pass. |
| Cancelled | Pass cancelled · {GP-n} · The homeowner cancelled this pass. Do not let the guests in without calling the homeowner. |
| Invalid QR | Not a valid pass · This QR is not a valid guest pass for this subdivision. It may be fake or altered. |
| Invalid code | No guest pass matches {typed}. Ask the guest for the 8-character pass code under the QR, or call the homeowner. |
| Pass details | Visiting · Valid · Purpose · Vehicles · None listed · Note · Number to call · Guest or car not on this list? Call the homeowner before letting them in. |
| Buttons | Scan next · Try again · Call {number} |
| Expected today | Expected today · {n} passes · {n} guests · {a}/{n} in · On foot · Tap a row to open the pass without scanning, for example when the guest's phone is dead. |
| Expected today, empty | No passes for today. A guest without a pass: call the homeowner and use the paper log. |
| Errors | No connection. The pass could not be checked. Use the paper log and call the homeowner. · Still checking. If the signal is weak, use the paper log and call the homeowner. · The camera is blocked. Allow camera access for this app in the phone's settings, or type the pass code. · Too many codes that don't match. Wait 10 minutes, or call the homeowner. · Your guard access was removed. Ask the admin office. |

## Out of scope

- Offline gate mode (Option B), unless decision 1 changes.
- Scanning residents' vehicle stickers; boom barrier or turnstile control; delivery-rider flows (EPIC-013).
- Walk-in visitors without a pass (see REQ-043 open questions).
- More than one gate in the first slice (A-12: a field, added when needed).
- Auto sign-out at shift change (open question).

## Open questions

| Question | Who decides |
|---|---|
| D9: is the gate add-on in scope? | HOA board |
| Decisions 1–5 above | Owner |
| How often does the guardhouse lose signal, and is there Wi-Fi? (Decides whether Option B is ever needed.) | Admin office |
| Shared HOA gate phone, or guards' own phones? A shared phone is recommended: the HOA controls it and guests' data doesn't land on personal phones. | HOA board |
| Does the paper log stay at the guardhouse as the fallback, and who copies it into the portal, if anyone? | Admin office |
| Should the gate phone sign the guard out automatically at the end of a shift? | Admin office |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. `BarcodeDetector` coverage on the gate phone's browser (A-9), and jsQR as the fallback in a live video loop: acceptable decode speed in glare?
2. Rate limit per guard account (decision 4): value, and whether a project-wide alert on Invalid scans (for example more than 20 an hour) is worth adding.
3. A single "same QR within N seconds is one scan" rule, server or client side?
4. Screen Wake Lock and installing as a PWA on the gate phone.
5. Removed-role behaviour: does `verifyPass` re-read the role from `users` (as REQ-002 does for revocation) rather than trusting the token?
6. Size. BA's read: **2.5–3.5 person-days**, plus REQ-002 Option A (staff and roles page) if decision 2 is one account per guard, which REQ-002 deferred to R4 and has no estimate yet.
