# REQ-045: Delete ID photos automatically after the retention period

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-013 Guest passes and gate](../epics/EPIC-013-guest-passes-and-gate.md) |
| Backlog story | [45 Delete ID photos automatically after the retention period](../backlog/BACKLOG.md#45-delete-id-photos-automatically-after-the-retention-period) |
| Status | **Draft for owner review**. Sol Arch review not yet done. Blocked by D9. |
| Mockup | Screens 45A–45C of the gate mockup (not yet published as an artifact; ready for the main session to publish). Repo copy: [req-040-045-mockup.html](../mockups/req-040-045-mockup.html) |
| Architecture | SA-001 §4.1 (`settings.guard.retentionDays`), §4.2 (Storage `guest-ids/`), §4.3 Flow 3 note (daily job), §4.4 row 7 (daily job plus lifecycle backstop), §8.2 (guest ID photos), §8.3 (alert if the retention job hasn't run in 26 hours), §11.2, R-4, Q10. Draft on branch `docs/sa-001-architecture` (r3, `e28d9bc`) |
| Depends on | REQ-043 (Option B, ID photos); REQ-005 (privacy notice states the period); REQ-006 (activity log); REQ-044 (shows "Deleted") |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

> **Blocked by D9.** The whole gate add-on (REQ-040 to REQ-045, release R4) waits on the HOA board's decision **D9: is the gate add-on in scope?** (+6–10 person-days, backend-plan.md). Nothing here is built until the board says yes.
>
> **Also depends on REQ-043 decision 1.** If the board chooses no ID photos (REQ-043 Option A, recommended for the first slice), the photo part of this REQ is not built, and only decision 3 here (how long visit and scan records are kept) remains. If photos are chosen, **this REQ must be live before the first ID photo is kept** (EPIC-013).

## Owner decisions

None of these is approved yet.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (daily cleanup job with a storage backstop), B (storage lifecycle rule only) or C (a "Delete old ID photos" button, as in the mock-up) | **A** |
| 2 | Retention period for ID photos | **30 days by default** (mock-up), changeable in Settings **between 7 and 90 days**. The board and DPO set the policy; the setting follows it |
| 3 | How long visit and scan records are kept (SA-001 Q10). Names, plates and times are personal data too | **12 months**, a setting, deleted by the same daily job. DPO to confirm |
| 4 | Deleted means gone: Cloud Storage keeps deleted files recoverable for 7 days by default ("soft delete") | **Turn soft delete off for ID photos**, so a deleted photo can't be restored by anyone (Sol Arch to confirm the setup) |
| 5 | Keeping one photo past the period for an incident (a "hold") | **Not in this slice.** Until the DPO sets a procedure, the office reports the incident within the retention period. Raise it as its own story if needed |

## Problem

A photo of a government ID is the most sensitive data the portal would hold, and it belongs to guests who never agreed to the HOA's portal. RA 10173 requires keeping personal data no longer than its purpose needs, and the National Privacy Commission has asked organisations that photograph IDs to delete them once the purpose is fulfilled and to check that deletion happens ([Philstar, Aug 2023](https://philstar.com/headlines/2023/08/06/2286615/businesses-taking-photos-clients-ids-endangers-data-npc)). The mock-up deletes old photos only when an admin remembers to press a button (backlog review finding 10). A rule that depends on someone remembering will be missed.

## Options

### Option A: Daily cleanup job, with a storage backstop (recommended)

- **How it works:** every night at 2:00 AM Manila time a scheduled job deletes ID photos older than the retention period, marks each visit "Deleted", and records how many it removed. A storage rule deletes any photo older than 91 days as a backstop, in case the job ever stops. The admin sees when the cleanup last ran.
- **Where it lives:** no screen of its own. The period is under **Settings → Gate**; the result shows on **Visitor Log**.
- **Cost:** cheap (S). One scheduled function, one setting, one alert, the storage rule.
- **Honest downside:** a photo lives up to about a day past its period (the job runs nightly).

### Option B: Storage lifecycle rule only

- **How it works:** the bucket deletes photos by age.
- **Cost:** cheapest: configuration, no code.
- **Honest downside:** the period can only be changed by the developer; Google says lifecycle actions are asynchronous and applications "shouldn't rely on lifecycle actions occurring within a certain amount of time" ([Cloud Storage lifecycle](https://docs.cloud.google.com/storage/docs/lifecycle)); and visit records keep pointing at photos that no longer exist.

### Option C: A button (mock-up)

- **How it works:** the admin presses "Delete old ID photos" when the warning appears.
- **Cost:** exists.
- **Honest downside:** depends on someone remembering. Not acceptable for this data.

### Recommendation

**Option A**, which is SA-001's design (§4.4 row 7). B is kept as the backstop inside A rather than as the only control.

## Story

As a board member, I want guests' ID photos deleted on schedule, so that the HOA keeps personal data no longer than its privacy policy says.

## Acceptance criteria (Option A)

```gherkin
Feature: ID photo retention

  Background:
    Given ID photos are kept for 30 days
    And the daily cleanup runs at 2:00 AM Manila time

  Scenario: Old photos are deleted on schedule
    Given Pedro Santos's visit was at 10:00 AM on Oct 12, 2026, with an ID photo
    When the daily cleanup runs on Nov 12, 2026
    Then Pedro's ID photo is deleted
    And his visit record stays, with the ID column reading "Deleted"

  Scenario: A photo inside the period is kept
    Given Pedro Santos's visit was at 10:00 AM on Oct 12, 2026
    When the daily cleanup runs on Nov 11, 2026
    Then Pedro's ID photo is kept

  Scenario: A deleted photo can't be restored (if decision 4 is yes)
    Given Pedro's ID photo was deleted on Nov 12, 2026
    Then nobody, including staff, can open or restore it
    And no soft-deleted copy of it exists in storage

  Scenario: Shortening the retention period
    Given Paolo Aquino is signed in as admin office staff
    When he changes the ID photo period from 30 days to 14 days and presses "Save"
    Then he sees "Shorten to 14 days? ID photos older than 14 days will be deleted at the next cleanup, tonight at 2:00 AM. Deleted photos can't be recovered."
    When he presses "Yes, shorten"
    Then photos older than 14 days are deleted at the next cleanup
    And the activity log records Paolo, the old and new period, and the time

  Scenario: Lengthening the retention period
    Given Pedro's photo was deleted when the period was 30 days
    When the admin changes the period to 60 days
    Then Pedro's photo stays deleted
    And photos not yet deleted are kept until they are 60 days old
    And the admin sees "Photos already deleted can't be brought back. Newer photos will be kept for 60 days."

  Scenario: A period outside the allowed range
    When the admin enters 120 days
    Then they see "Choose between 7 and 90 days" and nothing is saved

  Scenario: A missed night is caught up
    Given the cleanup did not run on Nov 12
    When it runs on Nov 13
    Then every photo older than 30 days is deleted, including those due on Nov 12

  Scenario: The cleanup runs twice
    When the cleanup runs twice on the same night
    Then each photo is deleted once
    And the second run reports "0 photos deleted" and no errors

  Scenario: The cleanup stops running
    Given the cleanup last ran at 2:00 AM on Nov 10
    When the admin opens Visitor Log at 9:00 AM on Nov 11
    Then they see "The daily ID photo cleanup hasn't run since Nov 10, 2:00 AM. Tell the developer. Photos are still deleted by a backstop after 91 days."
    And the developer's alert has fired (SA-001 §8.3)

  Scenario: The backstop
    Given the cleanup has not run for 100 days
    Then no ID photo older than 91 days remains in storage

  Scenario: When the cleanup last ran
    Given the cleanup ran at 2:00 AM on Nov 12 and deleted 3 photos
    When the admin opens Visitor Log
    Then they see "Last ID photo cleanup: Nov 12, 2:00 AM · 3 deleted"

  Scenario: A guest still inside after the period
    Given a visit with an ID photo was checked in 31 days ago and never checked out
    When the cleanup runs
    Then the photo is deleted and the visit still shows "Inside"

  Scenario: Photos can't be switched on before the cleanup is set up
    Given the cleanup has never run in this environment
    When the admin opens Settings → Gate
    Then "Require an ID photo at check-in" is off and disabled
    And the hint reads "Available once the daily ID photo cleanup is running."

  Scenario: The period shown to people matches the setting
    Given the ID photo period is 14 days
    Then the guest pass form (REQ-040) and the privacy notice (REQ-005) say ID photos are kept for 14 days

  Scenario: Old visit and scan records are deleted (if decision 3 is yes)
    Given visit and scan records are kept for 12 months
    And a visit and a scan from Nov 20, 2025 exist
    When the daily cleanup runs on Nov 28, 2026
    Then both records are deleted
    And the Visitor Log no longer lists them

  Scenario: Other roles can't change the period
    Given a guard, a homeowner or a board member is signed in
    When they try to change the retention settings
    Then the rules refuse
    And the settings are unchanged
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| ID photo period | `config/settings.guard.retentionDays` (SA-001 §4.1) | Whole days, 7–90, default 30 | Admin office, treasurer | Cleanup job; REQ-040 hint; REQ-005 notice |
| Visit and scan record period (decision 3) | `config/settings.guard.recordRetentionMonths` | 1–36, default 12 | Admin office, treasurer | Cleanup job |
| Photo deleted | `visits/{id}.idPhotoPath` cleared to null, `idPhotoDeletedAt` set | Cleared only after the Storage delete succeeds; never set back. REQ-044 shows "Deleted" from `idPhotoDeletedAt` (SA-001 §11.2 round trip) | Cleanup job | REQ-044 |
| Cleanup runs | `jobRuns/idPhotoCleanup_{yyyy-mm-dd}` (Sol Arch to name) | Started, finished, photos deleted, records deleted, errors | Cleanup job | Visitor Log ("Last ID photo cleanup"); alert |
| Settings changes | `auditLog` (REQ-006) | `settings.retention.changed`: actor, old, new, time | Settings save | Board, treasurer |
| Storage | `guest-ids/` | Lifecycle rule: delete at age 91 days (backstop). Soft delete off for this data (decision 4): likely a separate bucket for ID photos, since soft delete is set per bucket | Infrastructure | — |

The photo's age counts from its check-in time. "Older than 30 days" means more than 30 × 24 hours old when the job runs, which gives the backlog's example: an Oct 12, 10:00 AM photo is kept at the Nov 11 run and deleted at the Nov 12 run.

## UX/UI notes

This REQ adds one settings section (**Settings → Gate**) and two lines on Visitor Log.

- **Accessibility:** each setting has a visible label and a hint with the allowed range; the number fields use the numeric keyboard; errors are announced; the confirm dialog takes focus.
- **Consistency:** glossary term **ID photo** and "retention period"; the settings section reuses the existing Settings card layout. The other gate settings from REQ-040 (longest pass, how far ahead, most guests and vehicles) and REQ-043 (require an ID photo) live in the same section.
- **Mobile-first:** single-column form at 375 px; "Save" full-width at the bottom.
- **States:** success toast "Gate settings saved"; error "Couldn't save the settings. Check your connection and try again." with values kept; the cleanup health line on Visitor Log is a plain line when healthy and a warning alert when the job is late.
- **Safe actions:** shortening the period is confirmed and says it can't be undone; lengthening isn't confirmed but says deleted photos don't come back; "Save" shows "Saving…" and is disabled while saving.
- **Roles:** admin office and treasurer change settings; everyone else is refused by rules.
- **Privacy:** the period is written in the gate notice and the portal privacy notice from the same setting, so they can't drift.

## Copy of record

| Where | Text |
|---|---|
| Settings section | Gate |
| Fields | Longest guest pass (days) · How far ahead a pass can start (days) · Most guests per pass · Most vehicles per pass · Require an ID photo at check-in · Keep ID photos for (days) (hint: 7 to 90. Photos are deleted automatically after this.) · Keep visit and scan records for (months) (hint: 1 to 36) |
| Disabled photo toggle | Available once the daily ID photo cleanup is running. |
| Save | Save (in flight: Saving…) · Toast: Gate settings saved |
| Shorten confirm | Shorten to {n} days? ID photos older than {n} days will be deleted at the next cleanup, tonight at 2:00 AM. Deleted photos can't be recovered. · Yes, shorten · Keep {old} days |
| Lengthen note | Photos already deleted can't be brought back. Newer photos will be kept for {n} days. |
| Range error | Choose between {min} and {max} days. · Choose between 1 and 36 months. |
| Visitor Log, healthy | Last ID photo cleanup: {date}, {time} · {n} deleted |
| Visitor Log, late | The daily ID photo cleanup hasn't run since {date}, {time}. Tell the developer. Photos are still deleted by a backstop after 91 days. |
| ID column | Deleted |
| Pass form hint (REQ-040) | The guard photographs each guest's ID at the gate. ID photos are kept for {n} days, then deleted. (shown only when ID photos are required) |
| Errors | Couldn't save the settings. Check your connection and try again. |

## Out of scope

- Holding a photo past the period for an incident (decision 5).
- A manual "delete now" button (the mock-up's). The job replaces it.
- Deleting a single photo on a guest's request; under RA 10173 a guest may ask. Until a procedure exists, the office passes the request to the developer (open question).
- Retention of payment proofs and other documents (other REQs, SA-001 Q10).

## Open questions

| Question | Who decides |
|---|---|
| D9: is the gate add-on in scope? | HOA board |
| REQ-043 decision 1: are ID photos kept at all? | HOA board with the DPO |
| Decisions 1–5 above | Owner, with the DPO for 2, 3 and 5 |
| How does a guest ask for their photo or record to be deleted early, and who handles it? | HOA's Data Protection Officer |
| Who puts up the privacy notice at the gate, and what does it say? (Signage, not software; REQ-005 provides the wording.) | HOA board |

## Sol Arch review

*Not yet done.* Questions for Sol Arch:

1. A separate bucket for ID photos with soft delete off ([Cloud Storage soft delete](https://docs.cloud.google.com/storage/docs/soft-delete): on by default with 7 days, billed while kept; 0 disables it), and its lifecycle backstop at 91 days.
2. Confirm photos are not in any Firestore backup (they are in Storage) and that PITR and backups hold only the cleared path.
3. Batch size and retries for the job at 50 visits a day × 90 days (about 4,500 photos at most).
4. Size. BA's read: **0.5–1 person-day** with photos; about 0.25 if only decision 3 is built.
