# REQ-027: Assign, update and resolve a request

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-008 Requests and complaints](../epics/EPIC-008-requests-and-complaints.md) |
| Backlog story | [27 Assign, update and resolve a request](../backlog/BACKLOG.md#27-assign-update-and-resolve-a-request) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 27A–27F of the R2 collect-and-account mockup. Repo copy: [req-018-027-mockup.html](../mockups/req-018-027-mockup.html). Not yet published as an artifact (main session to publish and put the link here) |
| Architecture | SA-001 §3 (ticket replies are client writes checked by rules), §4.2 (`tickets` + `tickets/{id}/updates`), §11.2 (stale references: `seenUpdatedAt`), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-026 (ships with it), REQ-011 (notifications), REQ-006 (activity log) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation; the owner decides.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (manage each request: assign, status, reply, office-only notes), B (status only, no written replies) or C (the office replies by text message outside the portal and only sets the status) | **A** |
| 2 | **Office-only notes** | **Yes, about +0.5 day.** Neighbour complaints need notes like "spoke to Blk 5 Lot 3" that the filer shouldn't read either |
| 3 | **Homeowner comments** on their own request | **Yes**, while Open or In Progress ("It's still flooding"). Each comment shows on the office's list as "New comment" |
| 4 | **Reopening** a resolved request | **The homeowner can press "This isn't fixed" within 14 days** of it being resolved, with a comment. After that they file a new request |
| 5 | "Assign to" | **A team label** (Admin office, Maintenance team, Security, Board of Directors), as in the mock-up. Teams have no portal accounts, so assigning notifies nobody; it tells the homeowner who is handling it |

## Problem

Residents ask the office for updates it has already given, and nobody can see whether a problem was handled (EPIC-008). The mock-up's Manage dialog (`manageTicket`, line 1396; `FORMS.ticketUpdate`, line 1462) has the right parts: status, assign to, and a reply. But it lets a request be resolved with no word to the homeowner, it closes when the admin clicks outside it and loses the reply (BACKLOG finding 5), and two staff updating the same request at once silently overwrite each other's status.

Who has the problem: [Admin office staff](../product/PERSONAS.md#admin-office-staff), every working day; [Homeowners](../product/PERSONAS.md#homeowner) waiting on a fix. EPIC-008's target: 90% of requests get a first reply within 2 working days.

## Options

### Option A: Manage each request with replies and office-only notes (recommended)

- **How it works:** Requests & Complaints lists requests with chips by status and counts, oldest Open first, with a "No reply yet · 3 days" flag. "Manage" opens the request with its photos and timeline, and a form: status, assign to, reply to homeowner, and an "Office only" tick for internal notes. Saving a visible reply or status change posts it to the homeowner's timeline and notifies them. Resolving needs a note saying how.
- **Cost:** cheap (backlog S), plus about 0.5 day for office-only notes.
- **Honest downside:** the office must write replies; a status change alone tells the homeowner little.

### Option B: Status only

- **How it works:** the office changes Open → In Progress → Resolved with no text.
- **Cost:** cheap.
- **Honest downside:** "Resolved" with no explanation is what makes residents phone the office.

### Option C: Replies by text message outside the portal

- **How it works:** the office texts the resident and only updates the status in the portal.
- **Cost:** none.
- **Honest downside:** the conversation is lost from the record and lives on staff phones.

### Recommendation

**Option A.** The written reply on the homeowner's timeline is the feature.

## Story

As an admin office staff member, I want to assign a request, post progress updates and resolve it, so that homeowners can see their problem is being handled.

## Acceptance criteria (Option A)

```gherkin
Feature: Managing requests

  Background:
    Given Paolo Aquino of the admin office is signed in
    And T-103 "Videoke past 10 PM on Blk 5" was filed by Blk 5 Lot 6 and is Open

  Scenario: Assign and update
    When Paolo opens T-103, assigns it to "Security", sets "In Progress", writes "Guard will check on Saturday night" and presses "Save update"
    Then the button reads "Saving…" and is disabled until it finishes
    And the homeowner's timeline shows "Guard will check on Saturday night · Assigned to Security · Status changed to In Progress" with today's date and "Admin office"
    And the homeowner gets the notification "T-103 update: Guard will check on Saturday night"
    And T-103 shows "In Progress" and "Security" in the list

  Scenario: Resolving needs a note
    When Paolo sets T-103 to "Resolved" with no reply
    Then "Say how it was resolved" shows under Reply to homeowner
    And the status does not change

  Scenario: Resolve with a note
    When Paolo sets T-103 to "Resolved" with "Spoke to the household; music ends by 10 PM from now on"
    Then T-103 shows "Resolved" and the homeowner is notified with that text
    And the homeowner sees "This isn't fixed" on T-103 for 14 days

  Scenario: Office-only note (decision 2)
    When Paolo writes "Spoke to the owner of Blk 5 Lot 3 at the gate", ticks "Office only" and saves
    Then the note shows on the office's timeline marked "Office only"
    And the homeowner's timeline does not show it
    And the homeowner gets no notification
    And the homeowner's device's request for that note is refused

  Scenario: Nothing changed
    When Paolo opens T-103 and presses "Save update" without changing anything
    Then he sees "Nothing to save. Change the status, assign it, or write a reply."

  Scenario: The homeowner adds a comment (decision 3)
    Given T-103 is In Progress
    When the homeowner writes "It happened again last night" and presses "Add comment"
    Then the comment shows on both timelines
    And T-103 shows "New comment" in the office's list
    And the Requests & Complaints badge goes up by 1

  Scenario: The homeowner reopens within 14 days (decision 4)
    Given T-103 was resolved on Dec 1, 2026
    When on Dec 10, 2026 the homeowner presses "This isn't fixed" and writes "Still loud after 11 PM on Friday"
    Then T-103 is Open again with that comment on the timeline
    And the office's list shows "Reopened"

  Scenario: Too late to reopen
    Given T-103 was resolved on Dec 1, 2026
    When the homeowner views T-103 on Dec 16, 2026
    Then there is no "This isn't fixed" button
    And it reads "Resolved Dec 1, 2026. Still a problem? File a new request."

  Scenario: Filter by status
    Given 4 requests are Open, 2 In Progress and 9 Resolved
    When Paolo picks "Open"
    Then only the 4 Open requests are listed, oldest first
    And the chips read "All (15)", "Open (4)", "In Progress (2)", "Resolved (9)"

  Scenario: Requests waiting for a first reply
    Given T-101 was filed 3 working days ago and has no visible reply from the office
    Then T-101 shows "No reply yet · 3 days" in the list

  Scenario: Find a request by number
    When Paolo types "T-103" in "Search number or subject"
    Then only T-103 is listed

  Scenario: Two staff update the same request
    Given Paolo and another staff member opened T-103
    When the other saves "Resolved" first and then Paolo saves "In Progress"
    Then Paolo sees "Someone else updated T-103. Reload to see the latest, then make your change again."
    And T-103 stays Resolved
    And Paolo's typed reply is kept in the form

  Scenario: Pressing Save twice saves once
    When Paolo presses "Save update" twice quickly
    Then the timeline has one new entry and the homeowner gets one notification

  Scenario: A typed reply isn't lost
    Given Paolo has typed a reply in the Manage dialog
    When he clicks outside the dialog or presses Escape
    Then he sees "Discard your reply?" with "Keep editing" and "Discard"

  Scenario: Withdrawn requests
    Given the homeowner withdrew T-105 (REQ-026)
    Then T-105 shows "Withdrawn" under "All" and not under "Open"
    And the Manage form is read-only

  Scenario: Nothing in a filter
    When Paolo picks "In Progress" and there are none
    Then the list reads "No requests In Progress."

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then each request shows as a card with number, subject, lot, status and age
    And the Manage form is one column with "Save update" at the bottom
    And the page does not scroll sideways

  Scenario: Homeowners can't change status or assignment
    Given the homeowner of Blk 5 Lot 6 is signed in
    Then T-103 shows no status or assignment controls
    And their device's request to set T-103 to Resolved is refused

  Scenario: Board members and guards can't see requests
    Given a board member or a guard is signed in
    When they open the Requests & Complaints address directly
    Then they see "You don't have access to this page"
```

## Data changes

| Field | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Status, assignee | `tickets/{id}.status`, `.assignee`, `.updatedAt` | Staff only; Open ↔ In Progress → Resolved; Resolved → Open only by the homeowner's "This isn't fixed" within 14 days, or by staff; refused if `updatedAt` differs from what the staff member loaded | Staff (rules or function) | Lists, timelines |
| Resolved time | `tickets/{id}.resolvedAt` | Set on Resolved; drives the 14-day reopen window | Same | Homeowner view |
| Timeline entry | `tickets/{id}/updates/{id}`: `at`, `by`, `byRole` (`homeowner` / `staff`), `text` (≤ 1,000), `visibility` (`household` / `office`), `kind` (`reply` / `comment` / `status` / `assign` / `reopen` / `withdraw`) | Append-only; homeowners can only add `comment` or `reopen` with `visibility: household`; `office` entries are readable only by staff | Staff, household members | By visibility |
| First reply | `tickets/{id}.lastStaffReplyAt` | Set on a staff entry with `visibility: household` | Same write | REQ-025 "no reply", list flag |
| Unread for office | `tickets/{id}.officeUnread` (bool) | True on a homeowner comment or reopen; false when staff open the request | Writes above | Badge, "New comment" |
| Notification | `notifications` (REQ-011) | One per visible staff entry, to each linked person of the household | Trigger or function | Bell |
| Change record | `auditLog` | Status and assignment changes; ids only, no reply text | Trigger or function | Board, admin |

**BA note for Sol Arch.** Office-only notes must be unreadable by the household **at the database**, not just hidden on screen. If `updates` documents are read by the household with a rule on `visibility`, every household query must filter on it, or rules will refuse the whole query. A separate `tickets/{id}/officeNotes` subcollection may be simpler. Sol Arch to choose.

## UX/UI notes

- **Accessibility:** the Manage dialog takes focus and returns it; status and assignment are labelled selects; "Office only" is a labelled tick box, and office-only timeline entries carry the words "Office only", not just a grey background; chip counts are in the button text.
- **Consistency:** reuses the mock-up's chips, table, `.modal`, `.timeline` and pills. Status words from the glossary: **Open**, **In Progress**, **Resolved**, plus **Withdrawn** (REQ-026; add to the glossary). The same stale-edit message shape as REQ-003.
- **Mobile-first:** cards at 375 px; the office mostly works at a desktop, but the treasurer and staff can reply from a phone.
- **States:** empty filter; loading; saving; saved toast "T-103 updated."; stale; nothing to save; read-only for Withdrawn.
- **Forms:** the Manage dialog does **not** close on a backdrop click or Escape while a reply is typed (BACKLOG finding 5); the reply keeps its text on any error.
- **Safe actions:** "Saving…" disables the button; the server refuses a stale save (`updatedAt` check) and a duplicate (client-made entry id).
- **Stable layout:** the "Say how it was resolved" error area is reserved under the reply box.
- **Roles:** admin office manages all requests; treasurer manages Billing requests (REQ-026 decision 3); homeowners comment and reopen their own; board and guards are refused.
- **Privacy:** replies to a neighbour complaint must not name the household complained about. A hint under the reply box reads "The homeowner will see this. Don't name other households here; use an office-only note."

## Copy of record

| Where | Text |
|---|---|
| Page heading | Requests & Complaints |
| Chips | All ({n}) · Open ({n}) · In Progress ({n}) · Resolved ({n}) |
| Search | Search number or subject |
| List flags | No reply yet · {n} days · New comment · Reopened |
| Manage title | {T-103} · {subject} |
| Fields | Status · Assign to · Reply to homeowner · Office only |
| Assign options | Unassigned · Admin office · Maintenance team · Security · Board of Directors |
| Reply hint | The homeowner will see this. Don't name other households here; use an office-only note. |
| Save | Save update (in flight: Saving…) |
| Saved | {T-103} updated. |
| Resolve without note | Say how it was resolved |
| Nothing changed | Nothing to save. Change the status, assign it, or write a reply. |
| Stale | Someone else updated {T-103}. Reload to see the latest, then make your change again. |
| Discard | Discard your reply? · Keep editing · Discard |
| Timeline, generated parts | Assigned to {team} · Status changed to {status} · Office only |
| Homeowner bell | {T-103} update: {reply} |
| Homeowner comment | Add a comment · Add comment |
| Reopen | This isn't fixed · Tell the office what's still wrong · Reopen request |
| Too late | Resolved {date}. Still a problem? File a new request. |
| Empty filter | No requests {status}. |

## Out of scope

- Email for request updates (in-app notifications only; REQ-019 covers other events).
- Accounts or notifications for the teams in "Assign to" (decision 5).
- Service-level timers and automatic escalation (EPIC-008).
- Requests summary report (story 35, R3).

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions, rows 1–5 | Owner |
| Is 14 days right for "This isn't fixed"? | Admin office |
| Should staff see who in the office replied (each person's name) or just "Admin office" on the homeowner's timeline? This REQ shows "Admin office" to homeowners and the person's name to staff. | Admin office |

## Sol Arch review

Not yet done. Questions for Sol Arch:

1. Office-only notes: `visibility` field with filtered queries, or a separate subcollection (BA note above).
2. Status changes as client writes with rules (stale check on `updatedAt`) or a callable `updateRequest`.
3. Notification fan-out to each linked person: trigger on `updates`.
4. Size: S plus 0.5 day for office-only notes.
