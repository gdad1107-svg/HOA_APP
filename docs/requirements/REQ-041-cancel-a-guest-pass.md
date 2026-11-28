# REQ-041: Cancel a guest pass

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-013 Guest passes and gate](../epics/EPIC-013-guest-passes-and-gate.md) |
| Backlog story | [41 Cancel a guest pass](../backlog/BACKLOG.md#41-cancel-a-guest-pass) |
| Status | **Draft for owner review**. Sol Arch review not yet done. Blocked by D9. |
| Mockup | Screens 41A–41B of the gate mockup (not yet published as an artifact; ready for the main session to publish). Repo copy: [req-040-045-mockup.html](../mockups/req-040-045-mockup.html) |
| Architecture | SA-001 §3 (`createPass` covers cancel; a separate `cancelPass` is proposed below), §4.2 (`guestPasses.status`), §4.3 Flow 3 (notify the homeowner when a cancelled pass is tried). Draft on branch `docs/sa-001-architecture` (r3, `e28d9bc`) |
| Depends on | REQ-040, REQ-042 (the guard's verdict), REQ-011 (in-app notifications), REQ-006 (activity log) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

> **Blocked by D9.** The whole gate add-on (REQ-040 to REQ-045, release R4) waits on the HOA board's decision **D9: is the gate add-on in scope?** (+6–10 person-days, backend-plan.md). Nothing here is built until the board says yes.

## Owner decisions

None of these is approved yet.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (homeowner cancels in the app), B (homeowner phones the office or guardhouse, staff cancel) or C (no cancel: passes simply end) | **A** |
| 2 | Can admin office staff also cancel a household's pass (for example after a security incident, or when a homeowner phones in)? | **Yes**, with a reason, recorded in the activity log. Same function, one extra role check |
| 3 | Undo a cancellation | **No.** A cancelled pass stays cancelled; create a new pass. Reviving a pass whose image may already be forwarded is the riskier path |
| 4 | Notify the homeowner each time a cancelled pass is tried | **Yes, in-app (REQ-011), at most one notification per pass every 10 minutes**, so a guard rescanning doesn't flood the homeowner |

## Problem

Plans change: a party is called off, a contractor is let go, a pass image was sent to the wrong chat. The pass image is already out there and can't be recalled, so the only control is on the server: the pass must stop working at the gate. Without a cancel, a homeowner who wants to stop a guest has to phone the guardhouse, which is the call this add-on exists to remove.

## Options

### Option A: Cancel in the app (recommended)

- **How it works:** on the pass, the homeowner presses "Cancel pass" and confirms. The pass reads "Cancelled" and the guard's next scan shows "Pass cancelled" (REQ-042).
- **Where it lives:** the pass view under **Guest Passes** (REQ-040).
- **Cost:** cheap. One function, a confirm dialog, a status pill.
- **Honest downside:** a guard who opened the pass a moment before the cancellation could already be letting guests in. Check-in re-checks the pass, which closes most of that gap (scenario below).

### Option B: Phone the office or guardhouse

- **How it works:** the homeowner calls; staff cancel on their behalf.
- **Cost:** about the same to build (staff still need a cancel), plus a call each time.
- **Honest downside:** slower, only in office hours, and brings back the call.

### Option C: No cancel

- **How it works:** nothing. Passes end on their own within 3 days (REQ-040 decision 2).
- **Cost:** nothing.
- **Honest downside:** for up to 3 days anyone with the image can use it. The homeowner's only remedy is calling the gate.

### Recommendation

**Option A**, with staff able to cancel too (decision 2). It is small, it is the homeowner's only real control over an image they've already shared, and the guard and log behaviour it relies on is built in REQ-042 anyway.

## Story

As a homeowner, I want to cancel a pass I no longer want used, so that nobody gets in with it.

## Acceptance criteria (Option A)

```gherkin
Feature: Cancelling a guest pass

  Background:
    Given Juan Dela Cruz is a signed-in homeowner linked to Blk 4 Lot 12
    And Blk 4 Lot 12 has pass GP-1043 for Dec 5, 2026, which is "Upcoming"

  Scenario: Cancel a pass
    When Juan opens GP-1043 and presses "Cancel pass"
    Then he sees "Cancel guest pass GP-1043? Your guests won't be able to use it at the gate. This can't be undone."
    When he presses "Yes, cancel pass"
    Then GP-1043 reads "Cancelled" and moves to "Past passes"
    And the QR on GP-1043 is no longer shown
    And the activity log records who cancelled it and when

  Scenario: Changing his mind
    When Juan presses "Cancel pass" and then "Keep pass"
    Then GP-1043 is still "Upcoming"

  Scenario: Someone uses a cancelled pass
    Given GP-1043 was cancelled
    When the guard scans GP-1043 at 4:12 PM
    Then the guard sees "Pass cancelled" and "The homeowner cancelled this pass. Do not let the guests in without calling the homeowner."
    And the scan is recorded with the result "Cancelled"
    And Juan's notifications show "Someone tried to use your cancelled guest pass GP-1043 at the gate at 4:12 PM."

  Scenario: Repeated scans don't flood the homeowner (if decision 4 is yes)
    Given GP-1043 was cancelled
    When the guard scans GP-1043 three times between 4:12 PM and 4:15 PM
    Then three scans are recorded as "Cancelled"
    And Juan gets one notification

  Scenario: Pressing "Yes, cancel pass" twice
    When Juan presses "Yes, cancel pass" twice quickly
    Then GP-1043 is cancelled once
    And the activity log has one cancellation
    And the button reads "Cancelling…" and is disabled until the save finishes

  Scenario: Another member of the household sees the cancellation
    Given Ana Dela Cruz is also linked to Blk 4 Lot 12
    When Juan cancels GP-1043
    Then Ana sees GP-1043 as "Cancelled"

  Scenario: Cancelling while a guest is inside
    Given GP-1041 is valid today and Rosa Dela Cruz is inside since 9:12 AM
    When Juan presses "Cancel pass" on GP-1041
    Then he sees "Cancel guest pass GP-1041? 1 guest is inside now. The guard can still check them out, but nobody else can come in with this pass. This can't be undone."
    When he confirms
    Then Rosa still shows "Inside since 9:12 AM" in Visitors Inside
    And the guard can still check her out

  Scenario: The pass is cancelled after the guard opened it
    Given the guard has GP-1041's result open and showing "Valid pass"
    And Juan then cancels GP-1041
    When the guard presses "Let in" for Miguel Dela Cruz
    Then the guard sees "This pass was cancelled a moment ago. Do not let the guests in without calling the homeowner."
    And Miguel stays "Not yet arrived"

  Scenario: An ended pass can't be cancelled
    Given GP-1044 ended on Nov 25, 2026
    When Juan opens GP-1044
    Then there is no "Cancel pass" button
    And a direct call to cancel GP-1044 is refused with "This pass has already ended."

  Scenario: Admin office cancels a pass (if decision 2 is yes)
    Given Paolo Aquino is signed in as admin office staff
    When he opens GP-1043 from the visitor log, presses "Cancel pass", enters the reason "Homeowner called: party cancelled" and confirms
    Then GP-1043 reads "Cancelled"
    And Juan's notifications show "The admin office cancelled your guest pass GP-1043."
    And the activity log records Paolo, the time and the reason

  Scenario: Another household can't cancel the pass
    Given Ana Reyes is linked to Blk 2 Lot 7
    When she calls cancel on GP-1043 directly
    Then the server refuses
    And GP-1043 is still "Upcoming"

  Scenario: Losing the connection while cancelling
    Given Juan's phone loses its connection
    When he presses "Yes, cancel pass"
    Then he sees "Couldn't cancel the pass. Check your connection and try again. Until it's cancelled, the pass still works at the gate."
    And GP-1043 is still "Upcoming"
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Cancellation: status `cancelled`, cancelled by, cancelled at, reason (staff only) | `guestPasses/GP-nnnn` | Only from `active`, only before the pass ends; a second cancel is a no-op that returns success; never back to `active` | `cancelPass` function (proposed; SA-001 §3 folds cancel into `createPass`) | Household members, `verifyPass`, `checkIn` |
| Last "cancelled pass tried" notification time | on the pass, or a small `passAlerts` doc (Sol Arch) | One notification per pass per 10 minutes | `verifyPass` | `verifyPass` |
| Notification | `notifications` (REQ-011) | Text as in the copy of record | `verifyPass`, `cancelPass` | The household |
| Change record | `auditLog` (REQ-006) | `pass.cancelled`, ids and actor only | `cancelPass` | Board, treasurer |

## UX/UI notes

- **Accessibility:** the confirm dialog takes focus on open and returns it to "Cancel pass" on close; "Yes, cancel pass" and "Keep pass" are at least 44 px tall; "Cancelled" is a pill with the word, not only red.
- **Consistency:** reuse the one confirm dialog from REQ-004 (Remove). Labels: "Cancel pass", "Yes, cancel pass", "Keep pass". Never "Delete": the pass and its history stay.
- **Mobile-first:** the button sits at the bottom of the pass view, below the share buttons, in the danger style so it isn't tapped by mistake instead of "Share pass".
- **States:** loading ("Cancelling…"), error (connection message that says the pass still works), success (toast "Pass GP-1043 cancelled" and the pill changes).
- **Safe actions:** confirmed, not reversible by design (decision 3); the dialog does not close on a backdrop click while saving; the staff version requires a reason.
- **Stable layout:** when the QR is hidden after cancelling, the card keeps its size and shows "Cancelled on {date}" in its place.
- **Roles:** household members for their own passes; admin office staff and treasurer if decision 2 is yes. Guards cannot cancel.

## Copy of record

| Where | Text |
|---|---|
| Button | Cancel pass |
| Confirm | Cancel guest pass {GP-n}? Your guests won't be able to use it at the gate. This can't be undone. · Yes, cancel pass (in flight: Cancelling…) · Keep pass |
| Confirm, guest inside | Cancel guest pass {GP-n}? {n} guest(s) inside now. The guard can still check them out, but nobody else can come in with this pass. This can't be undone. |
| Staff confirm | Reason (required) · e.g. Homeowner called: party cancelled |
| Toast | Pass {GP-n} cancelled |
| Card after cancelling | Cancelled on {date} |
| Guard verdict | Pass cancelled · The homeowner cancelled this pass. Do not let the guests in without calling the homeowner. |
| Guard, at Let in | This pass was cancelled a moment ago. Do not let the guests in without calling the homeowner. |
| Notifications | Someone tried to use your cancelled guest pass {GP-n} at the gate at {time}. · The admin office cancelled your guest pass {GP-n}. |
| Errors | This pass has already ended. · Couldn't cancel the pass. Check your connection and try again. Until it's cancelled, the pass still works at the gate. |

The backlog's guard wording "without calling them" is changed to "without calling the homeowner", so the guard knows who to call.

## Out of scope

- Undoing a cancellation (decision 3).
- Cancelling one guest from a pass while keeping the others (cancel and create a new pass).
- Push or SMS alerts. The notification is in-app (REQ-011), and an email only if REQ-019 adds this event.

## Open questions

| Question | Who decides |
|---|---|
| D9: is the gate add-on in scope? | HOA board |
| Decisions 1–4 above | Owner |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. A separate `cancelPass` function, or a mode of `createPass`?
2. Confirm `checkIn` re-reads the pass status in its transaction, so a cancellation between scan and "Let in" is caught.
3. Where to keep the 10-minute notification throttle.
4. Size. BA's read: **0.5–1 person-day**.
