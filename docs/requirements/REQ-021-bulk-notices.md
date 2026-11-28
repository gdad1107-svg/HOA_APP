# REQ-021: Send notices to several households at once

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-005 Collections and notices](../epics/EPIC-005-collections-and-notices.md) |
| Backlog story | [21 Send notices to several households at once](../backlog/BACKLOG.md#21-send-notices-to-several-households-at-once) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 21A–21D of the R2 collect-and-account mockup. Repo copy: [req-018-027-mockup.html](../mockups/req-018-027-mockup.html). Not yet published as an artifact (main session to publish and put the link here) |
| Architecture | SA-001 §4.3 Flow 4 (`sendNotices`: per account, transaction, next type), §11.2 (repeat-trigger safety), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-020 (every rule for a single notice applies to each household in the batch), REQ-018 |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation; the owner decides.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (tick households, send each its next notice), B (one button: "Send all notices that are due") or C (automatic Reminders on a schedule) | **A**, with a "Select all ready" shortcut that gives most of B's speed |
| 2 | **Final Demands in a batch** | **No.** Each Final Demand is previewed and sent on its own (REQ-020). The batch skips them and says so |
| 3 | Households with a **payment waiting for approval** | **Skipped by default**, with a tick box "Include households with a payment waiting for approval" |
| 4 | Batch size | **Up to 50 households** (one page of the list). Sol Arch to confirm; larger means a background job with progress |
| 5 | Ship timing | **After the treasurer has sent single notices for one month** (EPIC-005 release slicing), so the letters are proven before they go out 50 at a time |

## Problem

At the collection rate in the mock-up's sample (about 51%), a large share of 623 households may be overdue each month. One preview and send per household (REQ-020) is about a minute each, so a hundred households is an afternoon. The treasurer is a volunteer with another job ([Treasurer](../product/PERSONAS.md#treasurer)).

The mock-up's bulk send (`bulkNotice`, line 1393) loops `sendNotice` in the browser with no re-check, no progress and no record of what was skipped.

**Is it worth building?** Yes, but small. All the rules are in REQ-020; this REQ only selects many households and reports the result. If REQ-020 slips, this waits; it is not a substitute.

## Options

### Option A: Tick households, send each its next notice (recommended)

- **How it works:** tick boxes on Delinquent accounts (REQ-018). "Select all ready" ticks every household on the page whose next notice can be sent now (deadline passed, not a Final Demand, no pending payment). "Send next notice to selected" opens a summary: how many of each notice type, and which households will be skipped and why. One sample letter per type can be opened. On confirm, the server sends each one separately and reports the result.
- **Cost:** cheap (backlog S), given REQ-020.
- **Honest downside:** the treasurer reads one sample per type, not every letter.

### Option B: "Send all notices that are due"

- **How it works:** one button for every eligible household across all pages.
- **Cost:** cheap to moderate (a background job for hundreds).
- **Honest downside:** no chance to leave out a household the office knows has a payment arrangement or a dispute.

### Option C: Automatic Reminders on a schedule

- **How it works:** a scheduled job sends a Reminder to every household on, say, the 5th day overdue. 1st Notice onwards stays manual.
- **Cost:** moderate.
- **Honest downside:** needs a board decision (SA-001 Q9) and trust in the letters. A good next step after a few months of A, not a first one.

### Recommendation

**Option A.** It keeps a person choosing who gets a letter, which matters for disputes and arrangements, and "Select all ready" gets close to one-button speed.

## Story

As a treasurer, I want to send each selected household its next notice in one action, so that the monthly follow-up takes minutes instead of an afternoon.

## Acceptance criteria (Option A)

```gherkin
Feature: Bulk notices

  Background:
    Given the treasurer is signed in on Delinquent accounts
    And every rule in REQ-020 applies to each household in a batch

  Scenario: Send to the selected households
    Given 12 delinquent households are ticked: 7 are due a Reminder, 4 a 1st Notice and 1 a 2nd Notice
    When the treasurer presses "Send next notice to selected"
    Then they see "Send 12 notices?" with "7 Reminders · 4 1st Notices · 1 2nd Notice"
    And each type has "View sample letter"
    When they press "Send 12 notices"
    Then the button reads "Sending… 0 of 12" and counts up
    And each household gets its own next notice with its own amount, periods, deadline and notice number
    And they see "12 notices sent. Email queued to 19 people. 2 households need printed letters." with "Download 2 letters"

  Scenario: Select all ready
    Given the page lists 50 delinquent households
    And 6 of them are waiting for a deadline, 3 are due a Final Demand and 2 have a payment waiting for approval
    When the treasurer presses "Select all ready"
    Then 39 households are ticked
    And the bar reads "39 selected"

  Scenario: Final Demands are not sent in a batch (decision 2)
    Given 10 ticked households, 2 of them due a Final Demand
    When the treasurer presses "Send next notice to selected"
    Then the summary reads "Send 8 notices?"
    And it lists "2 skipped: Final Demands are sent one at a time" with their lots

  Scenario: Households with a pending payment are skipped by default (decision 3)
    Given 10 ticked households, 1 of them with a payment waiting for approval
    When the treasurer opens the summary
    Then it lists "1 skipped: payment waiting for approval"
    When they tick "Include households with a payment waiting for approval"
    Then the summary reads "Send 10 notices?"

  Scenario: A household that can't take a notice yet can't be ticked
    Given Blk 3 Lot 2's next notice waits for a deadline of Dec 16, 2026
    Then its tick box is disabled with "2nd Notice after Dec 16"

  Scenario: A household paid while the batch was sending
    Given 12 ticked households and the treasurer confirmed the batch
    And a payment bringing Blk 6 Lot 9 to good standing is approved during the batch
    Then they see "11 notices sent. 1 skipped: Blk 6 Lot 9 is no longer delinquent."

  Scenario: Pressing Send twice sends one batch
    When the treasurer presses "Send 12 notices" twice quickly
    Then each household gets exactly one notice

  Scenario: Leaving the page mid-batch
    Given a batch of 40 is sending
    When the treasurer closes the browser tab after 15
    Then the server finishes all 40
    And Notice history shows all 40 when the treasurer comes back

  Scenario: Some sends fail
    Given a batch of 12 in which 2 households fail to send because of a server error
    Then they see "10 notices sent. 2 couldn't be sent: Blk 1 Lot 3, Blk 4 Lot 8. Nothing was recorded for them." with "Try these 2 again"

  Scenario: Nothing selected
    When the treasurer presses "Send next notice to selected" with nothing ticked
    Then they see "Select at least one account first."

  Scenario: More than one page
    Given 120 households are delinquent
    When the treasurer presses "Select all ready" on page 1
    Then only households on page 1 are ticked
    And the bar reads "39 selected on this page. Send these, then go to the next page."

  Scenario: Only the treasurer sees bulk sending
    Given an admin office staff member or a board member is signed in
    Then Delinquent accounts shows no tick boxes and no "Send next notice to selected"
    And their device's request to send a batch is refused
```

## Data changes

| Field | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Batch | `noticeBatches/{batchId}`: `createdBy`, `createdAt`, `householdIds`, `includePending`, `status` (`running` / `done`), `results` (`sent`, `skipped` with reason, `failed`) | `batchId` made by the web app when the summary opens; a second call with the same id returns the first batch | `sendNoticeBatch` function | Progress and result screen |
| Notice | `notices/{id}` as REQ-020, plus `batchId` | Each household in its own transaction | `sendNoticeBatch` (calls the same core as `sendNotice`) | As REQ-020 |

The batch function uses the same core as REQ-020's `sendNotice` so the rules can't drift. Final Demands are refused by the batch function itself, not only hidden in the summary.

## UX/UI notes

- **Accessibility:** tick boxes have labels ("Select Blk 3 Lot 2"); "Select all ready" is a button, not a header tick box with hidden meaning; progress is announced with `aria-live="polite"`.
- **Consistency:** reuses REQ-018's list and the mock-up's confirm dialog. Same notice type names as REQ-020.
- **Mobile-first:** tick boxes on cards at 375 px; the selection bar sticks to the bottom of the screen with the count and the send button.
- **States:** nothing ticked; n selected; summary with skips; sending with count; done with sent / skipped / failed; partial failure with retry.
- **Safe actions:** "Sending… n of m", disabled; batch id guards the server. Skips are listed before sending, not discovered afterwards.
- **Stable layout:** the selection bar is always present (reads "Select households to send notices" when empty) so the list doesn't jump when the first box is ticked.
- **Roles:** treasurer only, enforced by the function.

## Copy of record

| Where | Text |
|---|---|
| Buttons | Select all ready · Send next notice to selected · Clear selection |
| Selection bar | Select households to send notices · {n} selected · {n} selected on this page. Send these, then go to the next page. |
| Nothing selected | Select at least one account first. |
| Summary title | Send {n} notices? |
| Summary counts | {a} Reminders · {b} 1st Notices · {c} 2nd Notices |
| Sample | View sample letter |
| Skips | {n} skipped: Final Demands are sent one at a time · {n} skipped: payment waiting for approval · {n} skipped: {lot} is no longer delinquent |
| Include pending | Include households with a payment waiting for approval |
| Confirm button | Send {n} notices (in flight: Sending… {k} of {n}) |
| Done | {n} notices sent. Email queued to {m} people. {p} households need printed letters. · Download {p} letters |
| Partial failure | {n} notices sent. {f} couldn't be sent: {lots}. Nothing was recorded for them. · Try these {f} again |
| Disabled tick box | {next type} after {deadline} |

## Out of scope

- Final Demands in a batch (decision 2).
- Batches over 50 or across pages (decision 4).
- Automatic Reminders (Option C, SA-001 Q9).
- One combined PDF of all printed letters, if Sol Arch prefers one file per letter.

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions, rows 1–5 | Owner |
| Automatic Reminders later (SA-001 Q9) | HOA board |

## Sol Arch review

Not yet done. Questions for Sol Arch:

1. 50 notices in one callable (each with PDF and mail docs) within function time limits, or a queued background job with a progress document?
2. "Download n letters": one ZIP, one merged PDF, or one link each?
3. Size: S, given REQ-020's core.
