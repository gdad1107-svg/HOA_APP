# REQ-017: Important announcement shown on sign-in

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-004 Announcements and notifications](../epics/EPIC-004-announcements-and-notifications.md) |
| Backlog story | [17 Important announcement shown on sign-in](../backlog/BACKLOG.md#17-important-announcement-shown-on-sign-in) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted (REQ-013 #3 as Sol Arch proposed). Sol Arch reviewed: supports Option A with changes (applied in r3) |
| Mockup | Screens 17A–17E of the payments and announcements mockup (not yet published as an artifact). Repo copy: [req-012-017-mockup.html](../mockups/req-012-017-mockup.html) |
| Architecture | SA-001 §4.2 (`announcements.important`, `announcements/{id}/reads/{uid}`), §4.4 item 8; CODING-STANDARDS rule 11. Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-016 (announcements), REQ-001 (sign-in), REQ-004 (linked households, for the count) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (`reads` rules, `householdReads` functions-only, counting trigger keyed on `memberOf`, linked total by count queries, unlinked-household note, "Got it" queued not failed); editing after "Got it" points to REQ-016 decision 6 (open) · r4, 2026-11-28: owner approval recorded; recommendations accepted · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Editing an important announcement after "Got it" is REQ-016 decision 6, still open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (a pop-up on opening the portal until "Got it"), B (a banner that can't be dismissed until "Got it", no pop-up) | **A**, as the mock-up |
| 2 | The seen-by count: of all 623 households, or of households linked to the portal | **"Seen by {n} of {linked} linked households ({total} in total)"**. Counting against 623 makes the figure look worse than the reach the portal actually has; counting only linked ones hides the households the portal can't reach |
| 3 | Who must press "Got it": each person, or one per household | **Each person** sees it once. A household counts as "seen" when any of its members pressed it |
| 4 | When an important announcement stops popping up | **At its banner end date** (REQ-016 decision 2). A water-interruption notice should not pop up after the water is back |
| 5 | EPIC-004 target: 70% of households press "Got it" within 7 days | **Accept it as a measure of linked households**, not all households, until onboarding is complete |

## Problem

Some news must be read: a water interruption, a road closure, a change in gate rules. A banner is easy to dismiss without reading. The mock-up shows a pop-up on sign-in until "Got it" and counts who saw it, but stores everyone in a growing list on the announcement (`seenBy`, `index.html` line 1365), which SA-001 §4.4 item 8 replaces with one document per person.

**Challenge:** a pop-up only reaches people who open the portal. Most homeowners open it once or twice a month (PERSONAS), so a notice posted on Nov 26 for a Dec 1 interruption may not be seen by most households in time. **For anything urgent, the office must still use the group chats, the gate board, and later email (story 19).** This feature's value is the confirmation: the office can see how many households have read it, and the record shows the HOA gave notice.

## Options

### Option A: Pop-up until "Got it" (recommended)

- **How it works:** staff tick "Important" when posting (REQ-016). The next time a homeowner opens the portal, a pop-up shows the announcement before the dashboard. Only "Got it" closes it. Staff see the seen-by count on the announcement.
- **Cost:** cheap (story size S).
- **Excludes:** people who don't open the portal (the challenge).
- **Honest downside:** it interrupts someone who came to pay; misused for routine news, people learn to press "Got it" without reading. Guidance for the office: important means "affects your water, power, road or safety this week".

### Option B: A banner that stays until "Got it"

- **How it works:** the important announcement is a banner with "Got it" instead of ×, on every page until pressed.
- **Cost:** cheap, the same.
- **Honest downside:** easier to ignore; scrolls away on a phone.

### Recommendation

**Option A.** One tap costs the homeowner little, and the count gives the office something real to act on.

## Story

As an admin office staff member, I want to mark an announcement as important so it pops up when homeowners sign in, so that urgent notices like water interruptions are actually read.

## Acceptance criteria (Option A)

```gherkin
Feature: Important announcement pop-up

  Background:
    Given "Water interruption, Phase 2 on Dec 1" is posted as Important on Nov 26, 2026 with banner end date Dec 1, 2026

  Scenario: A must-read pop-up
    When Juan, who hasn't pressed "Got it", opens the portal on Nov 28
    Then a pop-up titled "Important announcement" shows it before the dashboard
    And it closes only when he presses "Got it"
    And pressing Escape or clicking outside it does not close it

  Scenario: Shown once per person, on every device
    Given Juan pressed "Got it" on his phone
    When he opens the portal on his laptop
    Then the pop-up does not appear

  Scenario: Each member of a household sees it
    Given Juan pressed "Got it" and his wife Elena, a member of the same household, has not
    When Elena opens the portal
    Then she sees the pop-up

  Scenario: Several important announcements at once
    Given two important announcements are unread by Juan
    When he opens the portal
    Then one pop-up titled "2 important announcements" lists both, newest first
    And one "Got it" marks both as seen

  Scenario: No pop-up after the end date
    When a homeowner who never pressed "Got it" opens the portal on Dec 2, 2026, Manila time
    Then no pop-up appears
    And the announcement is still listed under Announcements

  Scenario: The admin sees who has read it
    Given 340 of 623 households are linked to the portal
    And members of 120 households pressed "Got it"
    When Paolo opens the announcement
    Then he sees "Seen by 120 of 340 linked households (623 in total)"

  Scenario: Two people in one household count once
    Given Juan and Elena of Blk 4 Lot 12 both pressed "Got it" at the same moment
    Then the count for Blk 4 Lot 12 is 1

  Scenario: A household that saw it and later unlinked stays counted
    Given members of 120 households pressed "Got it"
    And one of those households was then unlinked after a sale
    When Paolo opens the announcement
    Then it reads "Seen by 120 of 339 linked households (623 in total)"

  Scenario: A staff member with no household isn't counted
    Given Paolo of the admin office belongs to no household
    When a read record with "Got it" is saved for him
    Then the seen-by count does not change

  Scenario: Got it doesn't hold the homeowner up
    Given Juan's connection is slow
    When he presses "Got it"
    Then the pop-up closes at once and the dashboard shows
    And if the save was still queued when he closed the tab, the pop-up shows again the next time he opens the portal

  Scenario: Pressing Got it twice
    When Juan presses "Got it" twice quickly
    Then his household is counted once

  Scenario: A deleted important announcement
    Given the announcement was deleted
    When a homeowner who hadn't seen it opens the portal
    Then no pop-up appears

  Scenario: Staff are not interrupted
    Given Liza is the treasurer and a member of Blk 9 Lot 3
    When she opens the portal in the treasurer view
    Then no pop-up appears
    When she switches to "My household"
    Then she sees the pop-up if she hasn't pressed "Got it"

  Scenario: Keyboard and screen reader
    When the pop-up opens
    Then focus moves to its heading, the message is read out, Tab moves only within the pop-up, and "Got it" is reachable by keyboard

  Scenario: Homeowners can't see the count or who read it
    Given Juan is a homeowner
    Then he sees no seen-by count
    And the server refuses his request to read other people's read records

  Scenario: Staff see only the count, not who read it
    Given Paolo is admin office staff
    When his browser asks for Juan's read record or the list of households that have seen it
    Then the server refuses it
    And he still sees the seen-by count

  Scenario: A read record can't be changed once set
    Given Juan pressed "Got it" on Nov 28, 2026
    When his browser tries to change his acknowledgement time
    Then the server refuses it and the Nov 28 record stands
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Important flag | `announcements/{id}.important` (REQ-016) | Set at posting; staff only; never changed after | Staff | Pop-up query |
| Acknowledgement: `ackAt` (and REQ-016's `dismissedAt`) | `announcements/{id}/reads/{uid}` | A person creates or updates only their own. Keys limited to `dismissedAt` and `ackAt`; each set once, to the server time, and never changed after. No household id from the client. **Read: own only**; staff don't read individual `reads` | Homeowner (fire-and-forget: `void setDoc(...).catch(reportError)`, CS-4; queued offline, lost if the tab closes) | Their pop-up and banner query; the counting trigger |
| Households that have seen it | `announcements/{id}/householdReads/{householdId}` | **Functions only.** A trigger, `onDocumentWritten(reads/{uid})`, acts only when `ackAt` goes from absent to set; it looks up the person's households on the server (`memberOf/{uid}`, REQ-016) and, in one transaction per household, creates the document if missing and increments the count **only when it created it**. A staff member with no household is not counted. A household that unlinks later stays counted | Trigger | A future "not yet seen" list (out of scope; staff only, DPO to confirm) |
| Seen count | `announcements/{id}.seenHouseholdCount` | Written by the trigger only; unchangeable by clients (REQ-016 rules) | Trigger | Staff |
| Linked household count | `households` | **Two `count()` queries when staff open the announcement** (`linkStatus == 'linked'`, `active == true`), about 2 reads; no kept counter, so it can't drift | — | Staff |

## UX/UI notes

- **Accessibility:** a real modal dialog (`role="dialog"`, `aria-modal`, labelled by its heading); focus moves in and is kept inside; on close, focus goes to the page's main heading; "Got it" is 44 px and the first action; text 16 px on phones.
- **Consistency:** "Important announcement" and "Got it" (glossary); reuses the mock-up's `.modal` and the `.ann.imp` style; staff see a pill "Pop-up on sign-in" on important announcements, as in the mock-up.
- **Mobile-first:** the pop-up fits 375 px with "Got it" visible without scrolling for a message under 600 characters; longer messages scroll inside the dialog with the button fixed at the bottom.
- **States:** none to show (no pop-up); one; several; save still queued when the tab closes (shown again next time, by design: the homeowner is never blocked by a network error).
- **Pop-up query:** reuses REQ-016's banner query (once per session, at most 10), filtered to `important`, plus the person's `reads/{uid}` for each candidate. Never reads every announcement.
- **Stable layout:** the pop-up opens before the dashboard renders behind it, so nothing shifts under it.
- **Safe actions:** "Got it" is idempotent; no destructive action here.
- **Roles:** homeowners see the pop-up; only admin, treasurer and board see counts; rules stop anyone, staff included, reading other people's `reads`, and `householdReads` is functions only.
- **Copy honesty:** staff see "Seen by", never "notified": a "Got it" shows the notice was displayed and acknowledged in the portal, not served under the by-laws.
- **Wording guidance for the office** (on the form, under the Important tick): "Use for water, power, road or safety notices. Every homeowner must press Got it."

## Copy of record

| Where | Text |
|---|---|
| Pop-up title | Important announcement · {n} important announcements |
| Pop-up intro | Hi {first name}, please read before continuing. |
| Pop-up item | {date} · {title} · {message} |
| Button | Got it |
| Staff pill | Pop-up on sign-in |
| Staff count | Seen by {n} of {linked} linked households ({total} in total) |
| Form hint | Use for water, power, road or safety notices. Every homeowner must press Got it. |

## Out of scope

- A list of which households haven't seen it (possible later; staff-only data).
- Sending the important announcement by email or SMS (story 19, R2; SMS out of scope in EPIC-004).
- Making an existing announcement important after posting (post a new one).
- Removing a household from the seen-by count when it later unlinks (a sale). The count can briefly exceed the current linked figure; it records reach at the time.
- Pop-ups for staff or guards.

## Open questions

| Question | Who decides |
|---|---|
| Editing an important announcement after "Got it" (REQ-016 decision 6, added after approval) | Owner |
| Delete `reads` and `householdReads` 12 months after the banner ends (Sol Arch's proposal, same period as REQ-011)? | Data Protection Officer (to be named by the HOA board) |
| Should the office get a list of households that haven't pressed "Got it", to call them? | Admin office (privacy: staff only) |

## Sol Arch review

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 (`docs/sa-001-architecture` at `e28d9bc`): §4.2 `reads/{uid}`, §4.4 item 8, §8.2. Also CS-4 and CS-11, the REQ-016 review, and REQ-004 (`linkStatus`). Greenfield.

**Verdict: Supports Option A, with changes.** The per-household count works as a trigger that is safe to run twice. The pop-up shares REQ-016's banner query, so it never reads every announcement. The linked-household total needs no kept counter.

#### Options

| Option | Feasible? | BA's cost | Sol Arch |
|---|---|---|---|
| A: pop-up until "Got it" | Yes | S | **Agree, about 1 day** on top of REQ-016. |
| B: sticky banner | Yes | S | Agree. The same data. |

#### Answers to the BA's points

1. **Per-household count by trigger: confirmed.**
   - **Trigger:** `onDocumentWritten(announcements/{id}/reads/{uid})`. It acts only when `ackAt` goes from absent to set.
   - **Which household:** it looks up the person's households **on the server** (`memberOf/{uid}`, from the REQ-016 review, change 1). It never trusts a household id sent by the client.
   - **Counting once:** in one transaction, per household, it creates `householdReads/{hh}` if it doesn't exist and increments `seenHouseholdCount` **only when it created it**. So a trigger delivered twice, or two members of one household pressing "Got it" at the same moment, still count once.
   - **Staff:** a staff member with no household is not counted.
2. **The pop-up query without reading every announcement: confirmed.** It reuses REQ-016's query (`status == 'live'`, `bannerUntil >= todayManila`, at most 10). The client filters to `important` and gets the person's `reads/{uid}` for each candidate to drop those with `ackAt`. That is 1 query plus 1–3 gets, shared with the banner, once per session.
3. **The linked-household total: no kept counter.** When staff open an announcement, run two `count()` aggregation queries on `households`: `linkStatus == 'linked'` and `active == true`. Firestore bills about one read per batch of up to 1,000 index entries, so this is about 2 reads, and it can never drift. It relies on REQ-004's functions keeping `linkStatus` correct, which they do.

#### Required changes (BA to apply)

1. **Rules for `reads/{uid}` (Data changes):**
   - A person may create or update only their own.
   - Keys are limited to `dismissedAt` and `ackAt`. Each may be set once, to `request.time`, and never changed after.
   - No household id from the client.
   - Read: own only. **Staff don't read individual `reads`.** They need only the count, so less personal data is exposed.
2. **`householdReads` (Data changes, "Read by: Staff"):** change to "functions only". Staff read `seenHouseholdCount` on the announcement. The list of households that haven't seen it is out of scope, and `householdReads` would become its source later (staff only, DPO to confirm).
3. **`seenHouseholdCount`** is written by the trigger only. REQ-016's rules must make it unchangeable by clients (REQ-016 review, point 1).
4. **"Linked household count" row:** replace "a server-kept total is preferred" with "two count queries when the announcement is opened (about 2 reads)".
5. **Add to Out of scope, or as a note:** a household that pressed "Got it" and later unlinked (a sale) stays counted, so the count can briefly exceed the current linked figure. Accept it. The count records reach at the time.
6. **Editing after "Got it":** see REQ-016 review, change 5 (recommended: block message edits once anyone has acknowledged).
7. **"Got it" is fire-and-forget:** `void setDoc(...).catch(reportError)` (CS-4). Offline, the write is queued and lost if the tab closes, so the pop-up shows again next time. That matches "if the save failed, the pop-up shows again". Say "queued" in the design note, not "failed".

**BA, r3: how the changes were applied.** Changes 1–5 and 7 are applied in Data changes, scenarios, UX notes and Out of scope. Change 6 is REQ-016 decision 6, still open. None contradicts an approved decision.

#### Risks not covered

- **Legal weight:** a "Got it" record shows the notice was displayed and acknowledged in the portal. It is not service of a notice under the by-laws. Keep REQ-016's open question with the board, and don't let the staff screen say "notified".
- **Per-person read records are personal data** (who read what, when). Propose to the DPO that `reads` and `householdReads` are deleted 12 months after the announcement's banner ends, the same period as REQ-011. Until then, nothing deletes them.
- **Misuse of "Important"** trains people to click past it. The form hint is the control. A monthly count of important posts in R2 reports would show overuse.

**Risk checklist** (each item answered):

| Item | Answer |
|---|---|
| Repeat trigger | "Got it" is idempotent (set once). The trigger counts only on creation |
| Stale reference | A deleted announcement is excluded by `status == 'live'` |
| Deletes | Soft, as REQ-016 |
| Field written and never read | `ackAt` is read by the pop-up query and the trigger. `seenHouseholdCount` is read by staff |
| Schema and rules as a pair | `reads` rules ship with the pop-up |
| Shared helper | REQ-016's query |
| Copy | "Seen by", not "notified" |
| Existing data | n/a |
| Identity | Per uid and per household id |
| Roles | Homeowners in household view. Staff see counts only |
| Environments | n/a |
| Secrets and PII | As above |
| Network | Queued write, shown again next time |
| Scale and cost | One small write per person, one trigger run per acknowledgement |
| Dependencies | None |
| Observability | Trigger error alert |

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**0.5–1 person-days with Claude Code** (was 1–1.5). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0.25 · 0–0.25 · 0 · 0–0.25 · 0.25
- **Reuses:** Port: `signInPopup()` 572–580, `ackNews` 1365, the "Seen by n of m" line 862. Extend: several at once, Option B (602–605)
