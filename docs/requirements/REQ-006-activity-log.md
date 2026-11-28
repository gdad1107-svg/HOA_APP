# REQ-006: Activity log of money and record changes

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-001 Access and households](../epics/EPIC-001-access-and-households.md) |
| Backlog story | [06 Activity log of money and record changes](../backlog/BACKLOG.md#06-activity-log-of-money-and-record-changes) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted. Sol Arch reviewed: supports Option A with changes (applied in r3) |
| Mockup | Screens 6A–6C of the [REQ-005 to REQ-011 mockup](../mockups/req-005-011-mockup.html). Not yet published as an artifact: ready for the main session to publish |
| Architecture | SA-001 §3 ("Audit log: function / trigger only"), §4.4 item 9, §8.2 (no personal data in free text), §8.3; Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-002 (roles). Entries are already written by REQ-002, REQ-003 and REQ-004; this REQ adds the screen and the common format |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (shared audit helper with allow-list, homeowner actor null, no personal values in before/after, `targetType` and `count`, functions only, Person filter, unknown-code fallback, billing skip / late bill / bill adjusted entries) · r4, 2026-11-28: owner approval recorded; recommendations accepted · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Questions for the HOA board, the treasurer or the DPO under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (one Activity log page with filters), B (a history panel on each record only) or C (a monthly CSV export only) | **A**. Per-record history panels can be added by the payment and household REQs later, reading the same log |
| 2 | Who may read the log | **Treasurer and board (all entries); admin office staff too**. Homeowners and guards never |
| 3 | How long entries are kept | **Never deleted by the portal** until the DPO and treasurer set a period (see Open questions) |
| 4 | What the log shows about homeowners | **The lot ("Blk 5 Lot 1"), never the homeowner's name, email or phone**. Staff are shown by name, because who did it is the point |

## Problem

When a homeowner says "I paid in October and you never recorded it", the board needs to see who approved, rejected or changed what, and when. The mock-up's "Recent activity" list is free text written by the browser, has dates but no person or time, and anyone could clear it (SA-001 §4.4 item 9). The real portal already writes structured entries for role changes (REQ-002), household edits and imports (REQ-003) and invitations and removals (REQ-004), but nobody can read them yet.

Who has the problem: the [Board member](../product/PERSONAS.md#board-member) and the [Treasurer](../product/PERSONAS.md#treasurer), when settling a dispute or preparing for an audit.

## Options

### Option A: One Activity log page with filters (recommended)

- **How it works:** a read-only list, newest first, 50 entries per page. Each entry reads as one sentence: who, did what, to which lot or record, with the date and time (Manila). Filters: type (Payments, Billing, Households, Invitations, Roles, Settings, Privacy), lot, person (staff) and date range.
- **Where it lives:** "Activity log" in the staff menu, after Settings.
- **Cost:** cheap. The entries exist; this is a query, a sentence for each entry type, and rules.
- **Excludes:** homeowners and guards.
- **Honest downside:** one more page; to answer "what happened to this payment" the treasurer filters by lot instead of clicking from the payment.

### Option B: A history panel on each record only

- **How it works:** a payment, a household or a setting shows "History" with the entries about it. No separate page.
- **Cost:** moderate: every screen that owns a record needs its own panel.
- **Honest downside:** no way to see "everything Paolo did on Dec 3" or "every settings change", which is what an audit asks.

### Option C: Monthly CSV export only

- **How it works:** the treasurer downloads the month's entries as a spreadsheet.
- **Cost:** cheap.
- **Honest downside:** disputes are handled by searching a spreadsheet on a laptop; the board on a phone can't.

### Recommendation

**Option A.** It serves the dispute ("filter by Blk 5 Lot 1"), the audit ("filter by Settings") and "everything Paolo did on Dec 3" (filter by person). Option B's panels can come later, reading the same entries, once the payment screens exist (REQ-012).

## Story

As a board member, I want every approval, rejection, void and edit recorded with who did it and when, and a page where I can find them, so that disputes can be settled from the record.

## What is logged in R1

Each REQ that changes money or records writes its own entries from a callable function, through one shared audit helper, in the same server transaction as the change. If the change is saved, its entry is saved; if not, neither is. No entry in R1 is written by a trigger.

| Type | Entry (as shown) | Written by |
|---|---|---|
| Roles | Developer {name} made Carmela Cruz Treasurer (board request {ref}) · …removed the Treasurer role from … | REQ-002 `setRole` |
| Households | {staff} added Blk 8 Lot 2 · {staff} changed the contact mobile of Blk 4 Lot 12 (the entry names the field only, never the old or new number) · {staff} deactivated Blk 7 Lot 1 · {staff} imported 623 households | REQ-003 |
| Invitations | {staff} invited Blk 2 Lot 7 · printed 20 invite slips · removed a person from Blk 2 Lot 7 · A person linked their account to Blk 2 Lot 7 | REQ-004 |
| Settings | {staff} changed monthly dues from ₱1,800.00 to ₱2,000.00 · replaced the payment QR code · changed the payee name | REQ-007 (callables `saveDuesSettings`, `replacePaymentQr`) |
| Billing | {staff} generated December 2026 billing: 623 bills, ₱1,121,400.00 · billed Blk 8 Lot 2 for December 2026 (`billing.lateBill`) · chose not to bill Blk 8 Lot 2 for December 2026 (`billing.skip`) · loaded opening balances for 623 households · corrected the December 2026 bill of Blk 5 Lot 1 by −₱200.00 (`bill.adjusted`, REQ-046) | REQ-008, REQ-046 |
| Payments | Blk 5 Lot 1 submitted ₱1,800.00 (ref ending 9554) · {staff} approved ₱1,800.00 from Blk 5 Lot 1 (OR-00093) · rejected … · voided OR-00093 | REQ-010, REQ-012, REQ-014 |
| Privacy | Developer published privacy notice version 2 (material change) | REQ-005 |

A reference number is shown by its last 4 digits only. Rejection and void **reasons** are shown on the payment, not copied into the log, because reasons are free text that may contain personal data (SA-001 §8.2).

## Acceptance criteria (Option A)

```gherkin
Feature: Activity log

  Scenario: An approval is recorded with person and time
    Given Carmela Cruz, Treasurer, approves the ₱1,800.00 payment from Blk 5 Lot 1 at 9:14 AM Manila time on Dec 3, 2026
    When a board member opens the Activity log
    Then the newest entry reads "Carmela Cruz (Treasurer) approved ₱1,800.00 from Blk 5 Lot 1 (OR-00093)"
    And it shows "Dec 3, 2026 · 9:14 AM"

  Scenario: A change and its entry are saved together
    Given the approval of a payment fails part-way on the server
    Then the payment is still "Pending approval"
    And no "approved" entry exists for it

  Scenario: No one can edit or delete the log
    Given the treasurer is signed in
    When she opens the Activity log
    Then no entry has an edit or delete control
    And Firestore refuses any create, update or delete of a log entry from any signed-in account, including the treasurer's

  Scenario: Filter by lot to settle a dispute
    Given Blk 5 Lot 1 has 14 entries and the log has 2,300
    When the board member picks Lot "Blk 5 Lot 1"
    Then only the 14 entries about Blk 5 Lot 1 show, newest first
    And the filter reads "Blk 5 Lot 1 · 14 entries"

  Scenario: Filter by type and date
    When the treasurer picks type "Settings" and dates Dec 1 to Dec 31, 2026
    Then only settings changes in December 2026 show

  Scenario: A long log loads in pages
    Given the log has 2,300 entries
    When the treasurer opens the Activity log
    Then the first 50 entries show
    When she presses "Show older entries"
    Then the next 50 show below, and the first 50 stay where they were

  Scenario: Nothing matches the filters
    When the board member filters by a lot with no entries
    Then the list reads "No activity for Blk 9 Lot 3 in this period." with "Clear filters"

  Scenario: The log does not show homeowners' personal data
    Given Blk 5 Lot 1's owner on file is "Carlo Mendoza"
    When the board member reads any entry about Blk 5 Lot 1
    Then it shows "Blk 5 Lot 1" and not "Carlo Mendoza", his email or his mobile
    And a payment's reference shows only its last 4 digits

  Scenario: A homeowner cannot read the log
    Given Maria Santos, a homeowner, is signed in
    When she opens the Activity log's address
    Then she sees "You don't have access to this page"
    And Firestore refuses her read of any log entry

  Scenario: A board member reads but cannot change anything
    Given a board member is signed in
    When they open the Activity log
    Then they see the entries and the filters
    And the page shows "View only. Board members can't change records."

  Scenario: Times show in Manila time
    Given an entry was written at 11:58 PM Manila time on Nov 30, 2026
    When the treasurer opens the log on a laptop set to another time zone
    Then it shows "Nov 30, 2026 · 11:58 PM"

  Scenario: Filter by person for an audit
    Given Paolo Aquino (Admin office) made 6 changes on Dec 3, 2026
    When the board member picks Person "Paolo Aquino" and dates Dec 3 to Dec 3, 2026
    Then only Paolo's 6 entries from Dec 3, 2026 show, newest first

  Scenario: A homeowner's own action names the lot, not the person
    Given Carlo Mendoza submits ₱1,800.00 for Blk 5 Lot 1
    When the treasurer opens the Activity log
    Then the entry reads "Blk 5 Lot 1 submitted ₱1,800.00 (ref ending 9554)"

  Scenario: A contact change does not copy the number into the log
    Given the admin changes the contact mobile of Blk 4 Lot 12
    When the board member reads the entry
    Then it reads "Paolo Aquino (Admin office) changed the contact mobile of Blk 4 Lot 12"
    And neither the old nor the new number appears in the entry

  Scenario: An entry the screen doesn't recognise still shows
    Given an entry was written with a code this version of the screen doesn't know, "fund.closed"
    When the treasurer opens the Activity log
    Then the entry reads "Carmela Cruz (Treasurer) made a change (fund.closed)" with its date and time
    And every other entry still shows

  Scenario: The log fails to load
    Given the log cannot be loaded
    When the treasurer opens the Activity log
    Then she sees "We couldn't load the activity log. Check your connection and try again." with "Try again"
    And the filters she picked are kept
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Log entry: `action` (code, e.g. `payment.approved`), `type` (filter group), `targetType` (`payment`, `bill`, `household`, `settings`, `invite`, `role`, `privacy`), `targetId`, `actorUid`, `actorName` and `actorRole` (copied at the time for staff and the developer, so a later name change doesn't rewrite history; for a homeowner's action `actorName` is null and `actorRole` is `homeowner`), `householdId` and `lotLabel` (or null), `before`, `after`, `amountCentavos` (or null), `count` (bulk actions such as an import or a billing run, or null), `refLast4` (or null), `requestRef` (or null), `at` (server time) | `auditLog/{id}` (SA-001 §3, §8.3) | No client writes at all. Ids, codes and amounts only; no free text, no homeowner names, contacts or full reference numbers. **`before` / `after` hold only non-personal values**: statuses, amounts, HOA settings values (dues, payee name) and field names. A contact edit is `{field: 'contactMobile'}` with no old or new number | **Functions only, through the shared audit helper `functions/src/audit/audit.js`, in the same transaction as the change.** The helper has an allow-list of fields per action code and refuses unknown codes and unlisted fields (unit-tested). No function writes `auditLog` any other way | Treasurer, board, admin office (decision 2) |
| Indexes | `firestore.indexes.json` | (`at` desc); (`householdId`, `at` desc); (`type`, `at` desc); (`householdId`, `type`, `at` desc); (`actorUid`, `at` desc). "{n} entries" uses a `count()` aggregation | — | — |

The screen builds each sentence from the codes, so wording can change without rewriting entries. An entry whose code the screen doesn't know reads "{actor} made a change ({code})". **Fit to S1:** the functions approved in REQ-002 to REQ-004 (`role.set`, `household.*`, `import.completed`, `invite.*`, `member.removed`) move onto the shared helper; REQ-002's `role.set` gains `actorName` and `requestRef`, and REQ-003's contact edits drop the old and new values. **Rules:** deny every client write; read for `isStaff()` (the claim **and** `staff/{uid}`, L-004) with role treasurer, board or admin office; rules tests include a removed treasurer whose token is still valid.

**What "nobody can edit" means.** No app user, including the treasurer, can change an entry: rules deny it and no function edits one. People with owner access to the Firebase project (the developer) could still change data through the console or the Admin SDK. That is true of any database. It is made visible, not prevented, by point-in-time recovery and daily backups (SA-001 §7) and by keeping production owner access to as few people as possible (ADR-005). The board should know this rather than be told "nobody can ever change it".

## UX/UI notes

- **Unknown codes:** an entry written by a newer function shows "{actor} made a change ({code})" rather than breaking the list.
- **Accessibility:** a list of entries, each a short sentence with the date and time as text (not only an icon); filters are labelled selects and date inputs; "Show older entries" is a real button, focus stays on the first new entry after loading; contrast 4.5:1.
- **Consistency:** "Activity log" (not "audit trail" on screen). Lot written "Blk 5 Lot 1", money "₱1,800.00", dates "Dec 3, 2026", time "9:14 AM", as everywhere else. Staff shown as "Name (Role)".
- **Mobile-first:** entries are already one sentence each, so the list works at 375 px with no table. Filters collapse into a "Filter" button that opens a panel.
- **States:** loading (skeleton rows); empty log ("No activity yet. Changes to money and records will appear here."); empty filter (above); error (above); partial (older pages load on demand).
- **Live filtering:** the lot filter is a search box, debounced, that offers matching lots; it doesn't reload the page on every key.
- **Safe actions:** none: the page is read-only.
- **Roles:** treasurer, board, admin office (decision 2). The menu item is hidden for others, and rules refuse the read (a hidden menu is not protection).

## Copy of record

| Where | Text |
|---|---|
| Menu item and page heading | Activity log |
| Page sub-heading | Every change to money and records, with who made it and when. Entries can't be edited or deleted. |
| Filters | Type · Lot · Person · From · To · Clear filters |
| Unknown entry | {actor} made a change ({code}) |
| Type options | All · Payments · Billing · Households · Invitations · Roles · Settings · Privacy |
| Filter summary | {lot} · {n} entries |
| Entry time | {Mon D, YYYY} · {h:mm AM} |
| Load more | Show older entries (in flight: Loading…) |
| Empty log | No activity yet. Changes to money and records will appear here. |
| Empty filter | No activity for {lot} in this period. |
| Board note | View only. Board members can't change records. |
| Error | We couldn't load the activity log. Check your connection and try again. · Try again |
| Entry sentences | See "What is logged in R1" above |

## Out of scope

- History panels on individual records (Option B), until the payment screens exist.
- CSV or PDF export of the log (could join story 35, standard reports).
- The admin dashboard's "Recent activity" card (story 25, R2). It will read the same log.
- Logging every read (who looked at which household). Only ID-photo views are logged by read, in R4 (SA-001 §8.2).
- Deleting old entries (decision 3).

## Open questions

| Question | Who decides |
|---|---|
| Is Cloud Audit Logs *Data Access* logging (records console and Admin SDK writes) worth its cost? Not priced (Sol Arch: Uncertain) | Owner, later |
| How long must the HOA keep these records? Financial records are often kept for years; the period should come from the treasurer's accountant and the DPO | Treasurer and DPO |
| Should the admin office see payment entries, or only household and invitation entries? (Recommended: all; they're ids and amounts) | HOA board |

## Sol Arch review

Questions for Sol Arch (from the BA, r1):

1. Confirm the shared `auditLog` field list above against what REQ-002 to REQ-004 already write, and the four indexes.
2. For client writes checked by rules (for example settings, REQ-007), the entry has to come from a trigger, which runs after the write rather than in the same transaction. Is "written by a trigger, retried until it succeeds" acceptable there, and how is a missing entry detected?
3. Rules: deny all writes; read for `isStaff()` with role treasurer, board or admin.

**BA size estimate (Sol Arch to confirm):** S, about 1.5–2 person-days with Claude Code: the page, sentence builder for each code, filters and indexes, rules tests, and a Playwright journey.

### Sol Arch findings (2026-11-28, draft)

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 §3, §4.4 item 9, §8.2 and §8.3, and against the `auditLog` entries already specified in approved REQ-002 (`role.set`), REQ-003 (`household.*`, `import.completed`) and REQ-004 (`invite.*`, `member.removed`). Baselines: `docs/sa-001-architecture` at `e28d9bc`, `docs/req-005-045` (uncommitted).

**Verdict: Supports Option A, with changes.** The page itself is cheap. The real work is one shared `audit()` helper that every function uses, so that the entries REQ-002 to REQ-004 already write and the ones S2 adds share one format, and no personal data gets in by accident.

#### Options

| Option | Feasible? | Cost (BA) | Sol Arch |
|---|---|---|---|
| A: one page with filters | Yes | Cheap | **Agree**, plus about 0.5 day to fit the shared helper to REQ-002 to REQ-004 |
| B: history panel per record | Yes | Moderate | Agree. Later, reading the same entries by `targetId` |
| C: monthly CSV only | Yes | Cheap | Agree with the downside |

#### Answers to the BA's questions

1. **Shared field list: confirmed, with these corrections.**
   - `actorName` / `actorRole` are copied **for staff and the developer only**. For a homeowner action (`payment.submitted`, `invite.redeemed`) they are `null` and `actorRole` is `homeowner`. The sentence then reads "Blk 5 Lot 1 submitted…", as the REQ's own examples already do. REQ-002's `role.set` entry gains `actorName` and `requestRef` (the developer is the actor).
   - **`before` / `after` hold only non-personal values:** statuses, amounts, settings values such as dues or the payee name (HOA data), and *field names*. For a household contact edit (REQ-003), the entry is `{field: 'contactMobile'}` with **no old or new number**. Otherwise the log would copy contacts that are kept apart in `householdContacts` for privacy, and would keep them for ever (decision 3). Add this to the Data changes rule.
   - Add `targetType` (`payment`, `bill`, `household`, `settings`, `invite`, `role`, `privacy`) so Option B's panels can query by target later. Add `count` for bulk actions (an import, a billing run).
   - **One helper, `functions/src/audit/audit.js`**, with an allow-list of fields per action code. It refuses unknown codes and unlisted fields, and is unit-tested (CS-1, CS-8, CS-14). A function cannot write `auditLog` any other way.
   - **Indexes: the four are right.** Each supports a date range on `at` with the equality filters. "{n} entries" uses a `count()` aggregation, which costs one read per batch of up to 1,000 index entries ([aggregation queries](https://firebase.google.com/docs/firestore/query-data/aggregation-queries)). Trivial.
2. **Don't use triggers for audit in S2. Make the audited writes callables.** A trigger runs after the write, so "saved together" stops being true. It also needs retries, an idempotent entry id and a missing-entry check. The only client-write-plus-trigger case in S2 is REQ-007 settings, and its review moves those writes to callables (`saveDuesSettings`, `replacePaymentQr`), so every S2 entry is written in the same transaction as its change. **Rule for later REQs:** if a trigger is ever unavoidable, the entry id is the event id, retry is turned on, and a nightly check compares the record's `updatedAt` with its latest entry. Record this as a CODING-STANDARDS rule (follow-up).
3. **Rules: agree.** Deny every client write. Read is allowed for `isStaff()` (the claim **and** `staff/{uid}`, L-004) with role `treasurer`, `board` or `admin`. Guards and homeowners are denied. Rules tests cover each role, including a removed treasurer whose token is still valid.

#### Required changes (for the BA to apply)

> **BA note (r3):** all five are applied above: 1 in Data changes; 2 in "What is logged in R1" (with `bill.adjusted` from REQ-046, which the owner added to S2); 3 by **adding** the Person filter and its index, with a scenario; 4 as a scenario, a UX note and copy; 5 by adding Privacy to Option A's filter list. The CODING-STANDARDS rule for unavoidable triggers is a Sol Arch follow-up. None conflicts with an approved decision.

1. **Data changes:** apply the field corrections above (homeowner actor is null; `before`/`after` exclude personal values; add `targetType` and `count`). Change "Written by" to "functions only, through the shared audit helper, in the same transaction". Remove "and triggers".
2. **"What is logged in R1":** the Settings row should come from callables (REQ-007 review). The Households row "changed the contact mobile of Blk 4 Lot 12" is correct, but it must not carry the number (state this). Add Billing `billing.skip` and `billing.lateBill` (REQ-008) and, if the correction story is added, `bill.adjusted`.
3. **Filters:** the Option B downside mentions "everything Paolo did on Dec 3", but Option A has no person filter. Either add a "Person (staff)" filter (index `actorUid, at desc`, cheap) or list it under Out of scope. BA to choose; I recommend adding it, because audits ask exactly that.
4. **Unknown codes:** add a scenario or a UX note. An entry whose code the screen doesn't know (written by a newer function) shows "{actor} made a change ({code})" rather than breaking the list.
5. **Type filter copy:** the type list includes "Privacy", but Option A's description omits it. Align the two.

#### Risks not covered

- **Personal data creeping into a permanent log (RA 10173).** Decision 3 keeps entries for ever, so anything personal that gets in stays. The helper's allow-list is the control. Maps to proportionality and retention limitation; the DPO must confirm the retention period.
- **Admin-console edits.** The BA's "What 'nobody can edit' means" is honest and right. Optionally, Cloud Audit Logs *Data Access* logging for Firestore would record console and Admin SDK writes. Whether it is worth its cost at this scale is **Uncertain** (not priced). It is an owner choice, not part of this REQ.
- **Stale actor names:** handled. Names are copied at write time.
- **Scale and cost:** about 2,000–3,000 entries a month (bills, payments, approvals), so about 30K a year. Storage is trivial; each page read is 50 reads.
- **Repeat-trigger safety, deletes, concurrency:** not applicable. The page is read-only and entries are written inside each owner's transaction.
- **Observability:** an error from the audit helper fails the whole transaction, so it surfaces as that function's error rate (SA-001 §8.3).

#### Size

**2–2.5 person-days with Claude Code (BA: 1.5–2).** The extra 0.5 is the shared helper with its allow-list, fitted to the REQ-002 to REQ-004 functions, with unit tests.

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**1.75–2.25 person-days with Claude Code** (was 2–2.5). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0.25 · 0 · 0–0.25 · 1.25 · 0.25–0.5
- **Reuses:** Port: the "Recent activity" list in `aDashOps()` 734 and the `.tbl` table. New: filters (drawn 590–592). BE: the log helper and its allow-list
