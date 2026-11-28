# REQ-016: Post an announcement

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-004 Announcements and notifications](../epics/EPIC-004-announcements-and-notifications.md) |
| Backlog story | [16 Post an announcement](../backlog/BACKLOG.md#16-post-an-announcement) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted (REQ-013 #3 as Sol Arch proposed). Sol Arch reviewed: supports Option A with changes (applied in r3) |
| Mockup | Screens 16A–16F of the payments and announcements mockup (not yet published as an artifact). Repo copy: [req-012-017-mockup.html](../mockups/req-012-017-mockup.html) |
| Architecture | SA-001 §3 (announcements: client write, no fan-out), §4.2 (`announcements`, `announcements/{id}/reads/{uid}`), §4.4 items 8, 11 and 12, §8.2; CODING-STANDARDS rules 10, 15. Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-002 (roles), REQ-006 (activity log) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (reads limited to staff and household members via `memberOf/{uid}`, actor fields, retry-safe double-post check, offline "not posted yet" wording, rendering rule, banner date range); editing after "Got it" and the payment-account footer added as open decisions 6 and 7 · r4, 2026-11-28: owner approval recorded; recommendations accepted · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Decisions 6 and 7 were added afterwards from Sol Arch's review and are still open. Questions for the HOA board or admin office under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (post in the portal: banner plus Announcements page), B (A plus a bell notification to every homeowner) or C (no portal announcements: keep the group chat) | **A** |
| 2 | How long the banner shows | **Until a "Show banner until" date the poster picks, defaulting to 14 days after posting.** The announcement stays on the Announcements page after that. Without an end date, a month-old notice sits on top of every page until each person dismisses it |
| 3 | Fixing a typo after posting | **Allow "Edit"** of title and message, shown as "Edited {date}". Deleting and reposting would lose the seen-by count (REQ-017) |
| 4 | Who can post | **Admin office staff and the treasurer** (REQ-002). Board members read only; the board asks the office to post |
| 5 | Dismissing the banner: per person on every device, or per device | **Per person, every device** (a small write when they press ×). Per device would show it again on their laptop |
| 6 | *Open, added after approval (Sol Arch change 5).* Editing an important announcement after people pressed "Got it" (REQ-017) can change what they confirmed they read | **Open.** Recommended **(a)**: once anyone has pressed "Got it", block edits to the title and message of an important announcement, with "Post a correction instead" (a cheap rules check). Alternative (b): allow the edit and show staff "Edited after {n} households pressed Got it" |
| 7 | *Open, added after approval (Sol Arch risk).* A compromised staff account could post "pay to this new GCash number" to every resident | **Open.** Sol Arch recommends: every announcement shows the fixed footer "The HOA never changes its payment account by announcement. Pay only through Pay with QR.", and every post notifies the other staff in-app (REQ-011). Staff 2-step verification (SA-001 §8.4) stays the main control |

## Problem

The HOA needs to reach households with news (party sign-ups, a guard change, a meeting). Today that goes through group chats, which not every household is in and where messages scroll away (EPIC-004). The mock-up posts an announcement and writes one notification per household (`FORMS.announce`, `index.html` line 1468): 623+ writes per post, which SA-001 §4.4 item 8 rules out. Its delete removes the record outright (line 1408).

**Challenge:** a portal announcement only reaches people who open the portal, once or twice a month for most (PERSONAS). It does not replace the group chat or the gate notice board for anything time-sensitive. Its value is a single, permanent, searchable record that reaches households who aren't in the chats. The office should keep posting urgent news in the chats too, and link to the portal.

## Options

### Option A: Banner plus Announcements page (recommended)

- **How it works:** staff open Announcements, type a title and message, pick a banner end date, and press "Post to all homeowners". Homeowners see the newest live announcement as a banner at the top of their pages until they dismiss it or it ends; every announcement is listed under Announcements, newest first.
- **Cost:** cheap (story size S). One document per announcement; no fan-out.
- **Excludes:** homeowners who don't sign in (see the challenge).
- **Honest downside:** no reminder outside the portal until email (story 19, R2).

### Option B: A plus a bell notification to every homeowner

- **How it works:** the bell also shows "New announcement: …".
- **Cost:** moderate if written per household (623 writes per post); cheap if the bell compares the newest announcement with the person's last visit, which REQ-011 would need to support.
- **Honest downside:** the banner already does the same job on the same screens; two signals for one message.

### Option C: No portal announcements

- **How it works:** keep using the group chat; drop stories 16 and 17.
- **Cost:** none.
- **Honest downside:** no record; households outside the chats keep missing news; REQ-017's important notices have nowhere to live.

### Recommendation

**Option A.** It is cheap and gives the HOA a record that every portal user sees. Revisit Option B with REQ-011's owner only if the banner proves easy to miss.

## Story

As an admin office staff member, I want to post an announcement that every homeowner sees as a banner, so that news reaches everyone without a group chat.

## Acceptance criteria (Option A)

```gherkin
Feature: Announcements

  Scenario: Post an announcement
    Given today is Nov 28, 2026
    When Paolo of the admin office enters the title "Christmas party sign-ups are open" and a message, keeps the banner end date Dec 12, 2026 and presses "Post to all homeowners"
    Then the button reads "Posting…" and is disabled until the save finishes
    And he sees "Posted. Homeowners see it the next time they open the portal."
    And every homeowner sees it as a banner at the top of their pages
    And it is listed first under Announcements
    And the activity log records who posted it and when

  Scenario: Title and message are required
    When Paolo presses "Post to all homeowners" with an empty title
    Then "Add a title" shows under the title field
    And the message he typed is still there

  Scenario: Pressing twice posts once
    When Paolo presses "Post to all homeowners" twice quickly
    Then one announcement is posted

  Scenario: A retry after the post already saved
    Given Paolo's announcement was saved but the app reported an error
    When the app checks the announcement by its id and finds it posted by Paolo
    Then he sees "Posted. Homeowners see it the next time they open the portal."
    And no second announcement exists

  Scenario: The banner end date must be in range
    Given today is Nov 28, 2026
    When Paolo sets "Show banner until" to Nov 27, 2026 or to Mar 1, 2027
    Then he sees "Pick a date from today up to 90 days ahead."
    And "Post to all homeowners" does not post

  Scenario: Line breaks and characters are kept as typed
    Given a message with two paragraphs and the text "<b>Pool closed</b>"
    When it is posted
    Then homeowners see two paragraphs and the literal text "<b>Pool closed</b>", not bold text

  Scenario: The newest live announcement is the banner
    Given two live announcements, posted Nov 20 and Nov 28
    Then the banner shows the Nov 28 one
    When Juan dismisses it
    Then the banner shows the Nov 20 one

  Scenario: A homeowner dismisses the banner
    When Juan presses × on the banner
    Then the banner is gone for Juan on his phone and on his laptop
    And other homeowners, including others in his household, still see it
    And the announcement is still listed under Announcements

  Scenario: The banner ends on its date
    Given an announcement's banner end date is Dec 12, 2026
    When a homeowner opens the portal on Dec 13, 2026, Manila time
    Then no banner shows for it
    And it is still listed under Announcements

  Scenario: Edit a typo
    When Paolo edits the title to "Christmas party sign-ups are now open" and saves
    Then homeowners see the new title with "Edited Nov 28, 2026"
    And people who dismissed the banner don't see it again

  Scenario: Deleting asks first
    When Paolo presses "Delete" on an announcement
    Then he sees "Delete this announcement? Homeowners will no longer see it."
    And nothing is deleted until he presses "Delete"

  Scenario: A deleted announcement disappears for homeowners but stays on record
    When Paolo confirms the delete
    Then homeowners no longer see it as a banner or in the list
    And the activity log records who deleted it and when

  Scenario: Editing an important announcement after "Got it" (if decision 6 (a) is accepted)
    Given an important announcement that at least one household has pressed "Got it" on
    When Paolo opens it to edit
    Then he can't change the title or message, and sees "Post a correction instead"
    And if his browser sends the edit anyway, the server refuses it

  Scenario: A signed-in person with no household can't read announcements
    Given Dina has signed in but hasn't been linked to a household and has no staff role
    When her browser asks for announcements
    Then the server refuses it and she sees none

  Scenario: Homeowners can't post
    Given Juan is a homeowner with no staff role
    Then he sees no "Post an announcement" form
    And if his browser writes an announcement anyway, the server refuses it

  Scenario: Board members read only
    Given Rosa has the board role
    When she opens Announcements
    Then she sees every announcement and no post, edit or delete controls

  Scenario: Nothing posted yet
    Given no announcements exist
    When a homeowner opens Announcements
    Then they see "No announcements yet. News from the HOA will appear here."
    And no banner shows

  Scenario: Posting while offline
    Given the connection is lost
    When Paolo presses "Post to all homeowners"
    Then after 10 seconds he sees "Not posted yet: waiting for a connection. Keep this page open."
    And the title and message are still in the form
    When the connection returns
    Then he sees "Posted. Homeowners see it the next time they open the portal."

  Scenario: The server refuses the post
    Given Paolo's admin role was removed after he opened the form
    When he presses "Post to all homeowners"
    Then he sees "Couldn't post. Your text is still here."
    And the title and message are still in the form
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Announcement: title (1–100 characters), message (1–2,000), `important` (REQ-017), `postedAt`, `postedBy`, `bannerUntil` (`YYYY-MM-DD`, Asia/Manila), `editedAt`, `editedBy`, `deletedAt`, `deletedBy`, `status` (`live` / `deleted`), `seenHouseholdCount` (REQ-017) | `announcements/{id}` | Client write by admin or treasurer (claim **and** `staff/{uid}`), checked by rules. **Create:** keys limited to `title, message, important, bannerUntil, status, postedAt, postedBy`; lengths as stated; `status == 'live'`, `postedBy` is the signed-in person, `postedAt` is the server time. **Edit:** only `title, message, bannerUntil, editedAt, editedBy` change, with `editedBy` the signed-in person and `editedAt` the server time, and only while `live`. **Delete:** `status` from `live` to `deleted` with `deletedAt` and `deletedBy` checked the same way; no hard delete. `important`, `postedAt`, `postedBy` and `seenHouseholdCount` are never changeable by clients. If decision 6 (a): no title or message edit when `important` and `seenHouseholdCount > 0` | Staff | Staff (admin, treasurer, board): everything. **Members of a household** (checked through `memberOf/{uid}`): `live` only, and their query must ask for `live`. Signed-in people with no household, and guards: denied |
| Household membership index | `memberOf/{uid}`: `householdIds` (new; new SA-001 item) | Server-written only, because `users/{uid}` is written by the person themselves | `redeemInvite`, `removeMember` (REQ-004) | Rules here and in REQ-017 |
| Banner dismissal: `dismissedAt` | `announcements/{id}/reads/{uid}` (shared with REQ-017's `ackAt`) | A person writes only their own document (rules in REQ-017) | Homeowner | Their own banner query |
| Activity log | `auditLog` | `announcement.posted` / `edited` / `deleted`, ids only, actor from `postedBy`, `editedBy` or `deletedBy`. Written by a trigger (`onDocumentWritten(announcements/{id})`), since the post itself is a client write | Trigger | Board, treasurer |
| Double-post guard | Announcement id made in the browser before the first press (CODING-STANDARDS rule 5) | A repeat write to the same id is refused as an update. **If saving reports an error, the app reads the announcement by its id; if it exists and was posted by this person, it shows "Posted"** | Web app | — |
| Indexes | (`status`, `bannerUntil`) for the banner and pop-up query; (`status`, `postedAt` desc) for the page and dashboard card | Banner query: `live`, `bannerUntil >= todayManila`, at most 10, sorted by `postedAt` in the client; run once per session and shared with REQ-015 and REQ-017 | — | — |

## UX/UI notes

- **Accessibility:** title and message have visible labels; errors sit under the field and are announced; the banner is a labelled region with a "Dismiss announcement" button of 44 px; the banner end date uses a native date input with its label.
- **Consistency:** "Announcement" (glossary), never "post" or "news" as nouns on screen; reuses the mock-up's `.ann` banner and `.news` list; delete uses the shared confirm dialog.
- **Mobile-first:** the banner wraps at 375 px with × reachable; the post form is one column. Staff post mostly from a desktop (PERSONAS), but the form works on a phone.
- **States:** empty (list and no banner), loading (list placeholders), error (post failed, text kept), success (toast that says when homeowners see it, not that they did).
- **Forms:** inline validation on blur; character counters at 100 and 2,000; "Show banner until" from today to 90 days ahead (Sol Arch's proposal, the owner can change the 90), default 14 days (decision 2); a draft being typed is not lost by navigating within the page; the form is not in a modal.
- **Offline:** the Firestore web SDK queues a write while offline instead of failing it, and loses it if the tab closes. After 10 seconds the form says "Not posted yet: waiting for a connection. Keep this page open." and switches to "Posted…" when the write lands. Dev confirms the behaviour with an emulator test (CS-12).
- **Safe actions:** delete is confirmed and soft; posting has an in-flight label and a fixed id.
- **Rendering:** title and message are shown as text, never as HTML (CODING-STANDARDS rule 10, SA-001 §4.4 item 11): line breaks kept with CSS `white-space: pre-line` and a lit-html text binding; links are not made clickable. Any `innerHTML` or `unsafeHTML` here is a review finding.
- **Privacy:** the form carries the hint "Don't include residents' names, balances or contact details." Posting a list of delinquent households would expose personal data to every resident (RA 10173, SA-001 §8.2).
- **Roles:** post, edit, delete for admin and treasurer only, refused by rules for everyone else; board read-only; homeowners read only if they are a member of a household (`memberOf/{uid}`), so a signed-in person with no invite sees nothing (SA-001 §8.1); guards don't see announcements in R1.

## Copy of record

| Where | Text |
|---|---|
| Staff page | Announcements · Post an announcement |
| Form | Title · Message · Show banner until · Important: show as a pop-up when homeowners sign in (REQ-017) · Don't include residents' names, balances or contact details. · Post to all homeowners · (in flight) Posting… |
| Validation | Add a title · Add a message · Title can be up to 100 characters · Message can be up to 2,000 characters · Pick a date from today up to 90 days ahead. |
| Offline | Not posted yet: waiting for a connection. Keep this page open. |
| Edit blocked (if decision 6 (a)) | Post a correction instead |
| Footer (if decision 7) | The HOA never changes its payment account by announcement. Pay only through Pay with QR. |
| Toast | Posted. Homeowners see it the next time they open the portal. |
| Banner | Announcement · {date} · {title} · {message} · All announcements · Dismiss announcement (×) |
| List item | {date} · {title} · {message} · Edited {date} |
| Staff actions | Edit · Delete |
| Delete confirm | Delete this announcement? Homeowners will no longer see it. · Cancel · Delete |
| Homeowner page | Announcements · News from the HOA board and admin office. |
| Empty | No announcements yet. News from the HOA will appear here. |
| Error (server refused) | Couldn't post. Your text is still here. |

## Out of scope

- Email or bell notification of new announcements (story 19, R2; Option B).
- Scheduled posts, attachments, images and links that open (links show as text).
- Announcements for one phase or block only.
- Comments or reactions (EPIC-004).
- Posting to Facebook or group chats.

## Open questions

| Question | Who decides |
|---|---|
| Decisions 6 (editing after "Got it") and 7 (payment-account footer and staff notification), added after approval | Owner |
| `memberOf/{uid}` is a new SA-001 item | Sol Arch, in SA-001 |
| The 90-day limit on "Show banner until" (Sol Arch's proposal) | Owner, if a different limit is wanted |
| Should guards see announcements (for example a gate procedure change)? | Admin office, with the gate add-on (D9) |
| Is any announcement legally a "notice to members" under the HOA's by-laws (for example a meeting call)? If so, the portal alone isn't enough | HOA board |

## Sol Arch review

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 (`docs/sa-001-architecture` at `e28d9bc`): §3 (client write, no fan-out), §4.2 `announcements` and `reads`, §4.4 items 8, 11 and 12, §8.1, §8.2. Also CS-4, 5, 10, 12 and 15, and the S2 draft REQ-006 (question 2, audit by trigger). Mock-up read: `index.html` has 5 `innerHTML` uses (SA-001 §4.4 item 11). Greenfield.

**Verdict: Supports Option A, with changes.** A client write checked by rules is right here. My changes:
- Reading must require household membership, not just being signed in.
- Add the actor fields the audit trigger needs.
- Make the double-post guard survive a retry.
- Replace "Couldn't post" with honest wording, because the Firestore web SDK **queues** writes while offline rather than failing them.

#### Options

| Option | Feasible? | BA's cost | Sol Arch |
|---|---|---|---|
| A: banner plus page | Yes | S | **Agree, 1–1.5 days.** |
| B: A plus the bell | Yes | Moderate / cheap | Agree with the BA. Writing one notification per household (623+ writes) is ruled out by SA-001 §4.4 item 8. The "compare with last visit" variant is cheap, but it belongs to REQ-011. |
| C: none | Yes | None | Agree. REQ-017 would lose its home. |

#### Answers to the BA's points

1. **Rules for a client-written announcement**, in outline (Dev writes them, and rules tests prove each line):

   | Action | Rule |
   |---|---|
   | **Create** | `hasRole('admin')` or `hasRole('treasurer')` (claim **and** `staff/{uid}`, REQ-002). Keys limited to `title, message, important, bannerUntil, status, postedAt, postedBy`. `title` is a string of 1–100 characters and `message` of 1–2,000. `important` is a bool. `bannerUntil` is a 10-character `YYYY-MM-DD` string (a simple fixed-width pattern, no nested quantifiers). `status == 'live'`, `postedBy == request.auth.uid`, `postedAt == request.time` |
   | **Update by staff (edit)** | Changed keys limited to `title, message, bannerUntil, editedAt, editedBy`, with `editedAt == request.time` and `editedBy == uid`. `status` stays `live` |
   | **Update by staff (delete)** | `status` from `live` to `deleted`, with `deletedAt` and `deletedBy` |
   | **Never changeable by clients** | `important`, `postedAt`, `postedBy`, `seenHouseholdCount` (REQ-017) |
   | **Delete** | Denied: soft delete only |
   | **Read** | Staff (admin, treasurer, board) read everything. Members read only `status == 'live'`, and their query must say so, because rules don't filter results. Guards: denied |

   Rules can't check that `bannerUntil` is today or later in Manila time. The form checks the range, and the banner query ignores past dates anyway.
2. **Audit by trigger: confirmed.** `onDocumentWritten(announcements/{id})` writes `announcement.posted`, `edited` or `deleted` with the actor taken from `postedBy`, `editedBy` or `deletedBy`. Those fields don't exist yet (required change 2). How a missing entry is detected is REQ-006 question 2, for the S2 review.
3. **The banner query and its index.**
   - **Query:** `announcements` where `status == 'live'` and `bannerUntil >= todayManila`, ordered by `bannerUntil` (Firestore needs the first order to be on the field with the range), limit 10. The client then sorts by `postedAt`, newest first.
   - **Index:** composite on (`status`, `bannerUntil`).
   - **Dismissals:** for each result, the app gets the person's `reads/{uid}` document (one read each) to drop dismissed ones.
   - **The same result also drives REQ-017's pop-up**, filtered to `important`. Run it once per session, not per page.
   - **The page and dashboard card** use `status == 'live'` ordered by `postedAt` desc, limit 3 for the card and 20 per page, with an index on (`status`, `postedAt` desc).
4. **Reads per page open.** Once per session: 1 query (1–3 documents) plus 1–3 `reads` gets. Each later page costs nothing extra. The Announcements page costs up to 20 reads per page of results.

#### Required changes (BA to apply)

1. **Data changes, "Read by": "every signed-in homeowner" isn't a safe boundary.** Anyone can create an account (REQ-001), and a signed-in person with no invite must see nothing (SA-001 §8.1). Announcements can carry security details, such as a guard change. Rules must require **staff, or a member of a household**. Rules can't check "a member of any household" without its id. **Design:** a server-written `memberOf/{uid}` document (`householdIds`), kept by `redeemInvite` and `removeMember`. It is a new SA-001 item, because `users/{uid}` is written by the person themselves and can't hold it.
2. **Add the fields `editedBy`, `deletedAt` and `deletedBy`**, and say the rules check them against the signed-in person and the server time.
3. **Double-post guard:** a fixed id is right, but a second write to the same id is checked as an *update* and refused, because `postedAt` would change. The screen would say "Couldn't post" after it had posted. Add: "If saving reports an error, the app reads the announcement by its id. If it exists and was posted by this person, it shows 'Posted'."
4. **"Posting fails" scenario:** while offline, the Firestore web SDK **queues** the write ("Write operations are queued until network access is re-enabled", [Access data offline](https://firebase.google.com/docs/firestore/manage-data/enable-offline), fetched 2026-11-28). The write doesn't fail, so "Couldn't post" never appears and the button would sit at "Posting…". Corrected:
   ```gherkin
   Scenario: Posting while offline
     Given the connection is lost
     When Paolo presses "Post to all homeowners"
     Then after 10 seconds he sees "Not posted yet: waiting for a connection. Keep this page open."
     And the title and message are still in the form
     When the connection returns
     Then he sees "Posted. Homeowners see it the next time they open the portal."
   ```
   Persistence is off by default on the web, so a queued write is lost if the tab closes. The copy says "Keep this page open" for that reason. Dev to confirm the promise behaviour with an emulator test (CS-12). **The same applies to every client write in the app**, including REQ-017's "Got it", REQ-007's settings and REQ-011's read marks.
5. **Editing an important announcement after people pressed "Got it" (REQ-017):** an edit can change what people confirmed they read. Add an owner decision with two choices:
   - (a) Once anyone has pressed "Got it", block message edits on an important announcement, with the copy "Post a correction instead". A rules check on `important == false || seenHouseholdCount == 0`, cheap. **This is my recommendation.**
   - (b) Allow the edit and show staff "Edited after {n} households pressed Got it".
6. **Rendering:** say "line breaks kept with CSS `white-space: pre-line` and a lit-html text binding. Links are not made clickable". It matches the scenario and CS-10.
7. **`bannerUntil` checks on the form:** from today to 90 days ahead, with the copy "Pick a date from today up to 90 days ahead." The 90 days is my proposal. The owner can change it.

**BA, r3: how the changes were applied.** Changes 1–4, 6 and 7 are applied in Data changes, scenarios, UX notes and copy. Change 5 is decision 6, still open; the payment-account footer from the risks is decision 7, still open. None contradicts an approved decision. The "Couldn't post" wording is kept only for a server refusal, which does still fail.

#### Risks not covered

- **A compromised staff account posting "pay to this new GCash number" to every resident: high impact.** Recommend, for the owner to decide: every announcement shows the fixed footer "The HOA never changes its payment account by announcement. Pay only through Pay with QR." Also, every post sends an in-app notification to the other staff (REQ-011), so a post they didn't expect is noticed. Staff 2-step verification (SA-001 §8.4) is the main control.
- **Personal data in the text:** the hint is the only control. Office procedure and training cover the rest (RA 10173, DPO to confirm). A soft-deleted announcement stays readable by staff. A real removal (for example a posted list of delinquent households) needs the developer. Name that in the office procedure.
- **XSS:** covered by lit-html bindings. Any `innerHTML` or `unsafeHTML` in this feature is a review finding (CS-10). SonarQube Community does not trace it.

**Risk checklist** (each item answered):

| Item | Answer |
|---|---|
| Repeat trigger | In-flight flag, fixed id, and the "exists, then posted" check |
| Stale reference | An edit of a deleted announcement is refused by rules (`status == 'live'`) |
| Deletes | Soft. `reads` stay |
| Field written and never read | `editedAt` is read by the list. `deletedBy` is read by the audit |
| Schema and rules as a pair | Rules and index ship with the screen |
| Shared helper | The confirm dialog |
| Copy | "Homeowners see it the next time they open the portal" is honest |
| Existing data | n/a |
| Identity | Id made in the browser |
| Roles | As in point 1 |
| Environments | Staging posts never reach production (separate projects) |
| Secrets and PII | Hint, ids in the audit |
| Network | Change 4 |
| Scale and cost | No fan-out |
| Dependencies | None |
| Observability | Audit trigger failures alert (REQ-006) |

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**0.75–1 person-days with Claude Code** (was 1–1.5). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0.25 · 0–0.25 · 0 · 0.25 · 0.25
- **Reuses:** Port: `aNews()` 860–863, `oNews()` 710, `newsItem()` 604, `bannerHTML()` 566, `delNews` confirm 1408. Extend: "Show banner until", counters, failed post (595)
