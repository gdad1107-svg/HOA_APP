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
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (reads limited to staff and household members via `memberOf/{uid}`, actor fields, retry-safe double-post check, offline "not posted yet" wording, rendering rule, banner date range); editing after "Got it" and the payment-account footer added as open decisions 6 and 7 · r4, 2026-11-28: owner approval recorded; recommendations accepted · r5, 2026-11-28: answers TC-16 gaps G-1 to G-14 (and TC-17 G-1, G-2): banner end date in the staff list; "Edited" in the list only; trimmed text checked by rules; form clears after posting and warns before losing a draft; where the banner shows; staff list hides deleted ones; activity-log entries; board menu; banner and pop-up selection rule (query for Sol Arch to confirm); edit range for the banner date; edit-after-delete copy and last save wins; `memberOf` backfill at release; "Show more" and load-failure copy; important announcements appear as the pop-up, not the banner. Banner refresh for people already signed in is open decision 8 · r6, 2026-11-28: decisions 6 (a), 7 (footer plus in-app alert to the other staff) and 8 (b) approved (owner: "Approve all"); edit-block, footer, staff-alert and live-banner scenarios, rules and copy made unconditional · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Decisions 6 and 7 were added afterwards from Sol Arch's review, and decision 8 from the test plan; all three were approved as recommended on 2026-11-28 ("Approve all"). Questions for the HOA board or admin office under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (post in the portal: banner plus Announcements page), B (A plus a bell notification to every homeowner) or C (no portal announcements: keep the group chat) | **A** |
| 2 | How long the banner shows | **Until a "Show banner until" date the poster picks, defaulting to 14 days after posting.** The announcement stays on the Announcements page after that. Without an end date, a month-old notice sits on top of every page until each person dismisses it |
| 3 | Fixing a typo after posting | **Allow "Edit"** of title and message, shown as "Edited {date}". Deleting and reposting would lose the seen-by count (REQ-017) |
| 4 | Who can post | **Admin office staff and the treasurer** (REQ-002). Board members read only; the board asks the office to post |
| 5 | Dismissing the banner: per person on every device, or per device | **Per person, every device** (a small write when they press ×). Per device would show it again on their laptop |
| 6 | *Added after approval (Sol Arch change 5).* Editing an important announcement after people pressed "Got it" (REQ-017) can change what they confirmed they read | **(a)**, approved 2026-11-28 ("Approve all"): once anyone has pressed "Got it", block edits to the title and message of an important announcement, with "Post a correction instead" (a cheap rules check). Not chosen: (b) allow the edit and show staff "Edited after {n} households pressed Got it"; under (b) the edited text does **not** pop up again for people who already pressed "Got it" (a change everyone must re-read is posted as a new important announcement) (r5, TC-17 G-9) |
| 7 | *Added after approval (Sol Arch risk).* A compromised staff account could post "pay to this new GCash number" to every resident | **Footer plus alert to the other staff**, approved 2026-11-28 ("Approve all"): every announcement shows the fixed footer "The HOA never changes its payment account by announcement. Pay only through Pay with QR.", and every post notifies the other staff in-app (REQ-011). Staff 2-step verification (SA-001 §8.4) stays the main control |
| 8 | *Added 2026-11-28 from the test plan (TC-16 G-12).* The banner is fetched once per session, so a homeowner already signed in keeps seeing a deleted or edited announcement until they next open the portal. That matters most for a wrong or fraudulent post (decision 7) | **(b)**, approved 2026-11-28 ("Approve all"): the banner and pop-up results are kept live while the portal is open, so a delete or edit shows within seconds (about 0 days; a few extra reads only when an announcement changes; Sol Arch to confirm the read cost). Not chosen: (a) accept it; a deleted announcement disappears at the person's next open |

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
    And the form is cleared, with "Show banner until" back to 14 days ahead (G-4)
    And every homeowner sees it as a banner at the top of their pages
    And it is listed first under Announcements, with "Banner until Dec 12, 2026" in the staff list (G-1)
    And the activity log shows "Paolo Aquino posted an announcement" with the time, under the type "Announcements" (G-7)

  Scenario: Title and message are required
    When Paolo presses "Post to all homeowners" with an empty title
    Then "Add a title" shows under the title field
    And the message he typed is still there

  Scenario: Spaces alone are not a title (G-3)
    When Paolo types only spaces in the title and leaves the field
    Then "Add a title" shows under the title field
    And if his browser writes a title of only spaces anyway, the server refuses it
    And a title typed with spaces around it is saved without them

  Scenario: Leaving with an unposted draft (G-4)
    Given Paolo has typed a title but not posted it
    When he opens another page of the portal
    Then he sees "Leave without posting? What you typed will be lost." with "Stay" and "Leave"
    And pressing "Stay" keeps him on the form with his text

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

  Scenario: The newest one is shown even when many are live (G-9)
    Given 12 announcements have live banners, the newest posted Nov 28 with the earliest end date
    Then the banner shows the Nov 28 one

  Scenario: Important announcements appear as the pop-up, not the banner (TC-17 G-1)
    Given the newest live announcement is important and a normal one was posted the day before
    Then the important one shows as the pop-up (REQ-017)
    And the banner shows the normal one

  Scenario: Where the banner shows (G-5)
    Given Juan hasn't dismissed the Nov 28 banner
    Then it shows at the top of every homeowner page, including Pay with QR, without covering the form
    And Liza, the treasurer, doesn't see it in the treasurer view
    And she sees it when she switches to "My household"

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
    Then homeowners see the new title in the banner and the list
    And the list item shows "Edited Nov 28, 2026"; the banner shows the posting date only (G-2)
    And people who dismissed the banner don't see it again

  Scenario: Changing the banner end date when editing (G-10)
    Given the announcement was posted on Nov 28, 2026 and today is Dec 5, 2026
    When Paolo edits "Show banner until"
    Then he can pick any date from Dec 5, 2026 up to Feb 26, 2027 (90 days after posting)
    And picking Dec 5, 2026 ends the banner after today
    And a date before today shows "Pick a date from today up to 90 days after it was posted."

  Scenario: Editing an announcement someone else deleted (G-11)
    Given Mark deleted the announcement while Paolo had it open to edit
    When Paolo saves his edit
    Then he sees "This announcement was deleted, so your changes weren't saved."

  Scenario: Two staff edit at once (G-11)
    Given Paolo and Mark both opened the announcement to edit
    When Paolo saves, then Mark saves
    Then Mark's text is the one shown, with "Edited" by Mark
    And the activity log records both edits

  Scenario: Deleting asks first
    When Paolo presses "Delete" on an announcement
    Then he sees "Delete this announcement? Homeowners will no longer see it."
    And nothing is deleted until he presses "Delete"

  Scenario: A deleted announcement disappears for homeowners but stays on record
    When Paolo confirms the delete
    Then homeowners no longer see it as a banner or in the list
    And staff no longer see it in the Announcements list either (G-6)
    And the activity log records who deleted it and when

  Scenario: Homeowners linked before this release still see announcements (G-13)
    Given Juan was linked to Blk 4 Lot 12 before announcements were released
    When he opens Announcements after the release
    Then he sees the live announcements

  Scenario: Editing an important announcement after "Got it" (decision 6 (a))
    Given an important announcement that at least one household has pressed "Got it" on
    When Paolo opens it to edit
    Then he can't change the title or message, and sees "Post a correction instead"
    And he can still change "Show banner until"
    And if his browser sends a title or message edit anyway, the server refuses it

  Scenario: Every announcement carries the payment-account footer (decision 7)
    When a homeowner sees any announcement, as the banner, the pop-up or in the list
    Then it ends with "The HOA never changes its payment account by announcement. Pay only through Pay with QR."
    And the footer is added by the portal, not typed by staff, so no post can leave it out

  Scenario: The other staff are told of every post (decision 7)
    When Paolo posts "Christmas party sign-ups are open"
    Then the bell of every other admin office staff member and treasurer shows "Paolo Aquino posted an announcement: Christmas party sign-ups are open. If you didn't expect this, contact the board."
    And Paolo's own bell shows nothing for it

  Scenario: A deleted announcement disappears for people already signed in (decision 8 (b))
    Given Juan has the portal open with the banner showing
    When Paolo deletes that announcement
    Then within a few seconds the banner is gone from Juan's screen without a reload
    And an edit to it shows on Juan's screen the same way

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
    When she opens Announcements from her menu (G-8)
    Then she sees every live announcement and no post, edit or delete controls

  Scenario: Nothing posted yet
    Given no announcements exist
    When a homeowner opens Announcements
    Then they see "No announcements yet. News from the HOA will appear here."
    And no banner shows

  Scenario: More than 20 announcements (G-14)
    Given 25 live announcements exist
    When a homeowner opens Announcements
    Then the 20 newest show, then "Show more announcements"
    And pressing it adds the other 5 below without moving what is on screen

  Scenario: The list can't load (G-14)
    Given the connection is lost
    When a homeowner opens Announcements
    Then they see "Couldn't load announcements. Check your connection and try again." with "Try again"

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
| Announcement: title (1–100 characters after trimming; the form trims before saving and rules refuse a title or message whose trimmed length is 0, G-3; Sol Arch to confirm the rules' string `trim()`), message (1–2,000), `important` (REQ-017), `postedAt`, `postedBy`, `bannerUntil` (`YYYY-MM-DD`, Asia/Manila), `editedAt`, `editedBy`, `deletedAt`, `deletedBy`, `status` (`live` / `deleted`), `seenHouseholdCount` (REQ-017) | `announcements/{id}` | Client write by admin or treasurer (claim **and** `staff/{uid}`), checked by rules. **Create:** keys limited to `title, message, important, bannerUntil, status, postedAt, postedBy`; lengths as stated; `status == 'live'`, `postedBy` is the signed-in person, `postedAt` is the server time. **Edit:** only `title, message, bannerUntil, editedAt, editedBy` change, with `editedBy` the signed-in person and `editedAt` the server time, and only while `live`. **Delete:** `status` from `live` to `deleted` with `deletedAt` and `deletedBy` checked the same way; no hard delete. `important`, `postedAt`, `postedBy` and `seenHouseholdCount` are never changeable by clients. Decision 6 (a): no title or message edit when `important` and `seenHouseholdCount > 0` | Staff | Staff (admin, treasurer, board): everything. **Members of a household** (checked through `memberOf/{uid}`): `live` only, and their query must ask for `live`. Signed-in people with no household, and guards: denied |
| Household membership index | `memberOf/{uid}`: `householdIds` (new; new SA-001 item) | Server-written only, because `users/{uid}` is written by the person themselves. **Backfill (G-13):** people linked before this release have none, so a one-off developer script creates `memberOf/{uid}` from the existing `members` records, run in staging and then production **before** the announcement rules are deployed; the release checklist confirms the number of `memberOf` documents equals the number of distinct linked people. `redeemInvite` and `removeMember` keep it from then on (REQ-004 to say so) | `redeemInvite`, `removeMember` (REQ-004); backfill script | Rules here, in REQ-017 and for `config/features` (REQ-015) |
| Banner dismissal: `dismissedAt` | `announcements/{id}/reads/{uid}` (shared with REQ-017's `ackAt`) | A person writes only their own document (rules in REQ-017) | Homeowner | Their own banner query |
| Activity log | `auditLog` | `announcement.posted` / `edited` / `deleted`, ids only, actor from `postedBy`, `editedBy` or `deletedBy`. Written by a trigger (`onDocumentWritten(announcements/{id})`), since the post itself is a client write. REQ-006's rule for trigger-written entries applies: entry id = the trigger's event id (a repeat delivery writes nothing new), and the nightly missing-entry check covers announcements. **Shown (G-7)** under a new type filter "Announcements" as "{name} posted an announcement", "{name} edited an announcement", "{name} deleted an announcement", each opening the announcement for staff (REQ-006 to add the type, filter and sentences) | Trigger | Board, treasurer, admin office (REQ-006 decision 2) |
| Double-post guard | Announcement id made in the browser before the first press (CODING-STANDARDS rule 5) | A repeat write to the same id is refused as an update. **If saving reports an error, the app reads the announcement by its id; if it exists and was posted by this person, it shows "Posted"** | Web app | — |
| Indexes | (`status`, `bannerUntil`) for the banner and pop-up query; (`status`, `postedAt` desc) for the page and dashboard card | Banner query: `live`, `bannerUntil >= todayManila`, at most 10, sorted by `postedAt` in the client; shared with REQ-015 and REQ-017. **Decision 8 (b):** started once per session and **kept live** (a listener) while the portal is open, so a delete or edit reaches people already signed in within seconds; later pages add no reads | — | — |
| Staff alert of a post (decision 7) | `notifications` (REQ-011), id `annpost_{announcementId}_{uid}` | One per other admin and treasurer, written by the audit trigger on `announcement.posted` (the post itself is a client write). Not to the poster. Row to add to REQ-011's catalogue | Trigger | Staff bell |
| Payment-account footer (decision 7) | Not stored | Drawn by the portal under every announcement (banner, pop-up, list, dashboard card); staff can't remove it | — | — |
| Banner and pop-up selection (r5, G-9; TC-17 G-1, G-2) | Same queries | **The rule the query must meet, whatever its shape:** the banner is the newest (`postedAt`) live, **non-important** announcement whose banner hasn't ended and that the person hasn't dismissed; the pop-up holds **every** live important announcement whose banner hasn't ended and that the person hasn't acknowledged. Neither may drop an announcement because more than 10 are live. The approved query (ordered by `bannerUntil` ascending, limit 10) can drop the newest. **Sol Arch to confirm the shape**; one that meets the rule: two queries, `important == false` and `important == true`, each `status == 'live'` and `postedAt >= today − 90 days` (every live banner was posted within 90 days, G-10), ordered by `postedAt` descending, filtered by `bannerUntil` in the client, paging on only in the rare case a page holds no usable result | — | — |
| Banner date on edit (G-10) | `bannerUntil` | From today up to 90 days after **posting** (not after the edit), so an edit can shorten or extend a banner but never keep it beyond 90 days from posting; today ends it at midnight | Staff | — |
| Staff list | Same page query | Shows live announcements only, newest first, each with "Banner until {date}" or "Banner ended" (G-1) and the "Pop-up on sign-in" pill when important. Deleted ones are not listed (G-6); their record is the activity log and, for the developer, the document | — | Staff |
| Concurrent edits (G-11) | `announcements/{id}` | Last save wins (a small office; both edits are in the activity log). An edit of a deleted announcement is refused by the rules (`status == 'live'`) and shows "This announcement was deleted, so your changes weren't saved." | Staff | — |

## UX/UI notes

- **Accessibility:** title and message have visible labels; errors sit under the field and are announced; the banner is a labelled region with a "Dismiss announcement" button of 44 px; the banner end date uses a native date input with its label.
- **Consistency:** "Announcement" (glossary), never "post" or "news" as nouns on screen; reuses the mock-up's `.ann` banner and `.news` list; delete uses the shared confirm dialog.
- **Mobile-first:** the banner wraps at 375 px with × reachable; the post form is one column. Staff post mostly from a desktop (PERSONAS), but the form works on a phone.
- **States:** empty (list and no banner), loading (list placeholders), error (post failed, text kept), success (toast that says when homeowners see it, not that they did).
- **Forms:** inline validation on blur; character counters at 100 and 2,000; "Show banner until" from today to 90 days ahead (Sol Arch's proposal, the owner can change the 90), default 14 days (decision 2); a draft being typed is not lost by navigating within the page; the form is not in a modal. After a successful post the form clears and the date returns to the default. Leaving for another portal page with unposted text asks "Leave without posting? What you typed will be lost." (shared confirm dialog, "Stay" first); closing the tab uses the browser's own "leave site?" prompt (G-4).
- **Where the banner shows (G-5):** at the top of every homeowner page in the household view, including Pay with QR, above the page content and never over a form; never in the staff views (treasurer, admin, board). A staff member who is also a homeowner sees it under "My household", as REQ-017 does for the pop-up.
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
| Validation | Add a title · Add a message · Title can be up to 100 characters · Message can be up to 2,000 characters · Pick a date from today up to 90 days ahead. · (editing) Pick a date from today up to 90 days after it was posted. |
| Leave with a draft | Leave without posting? What you typed will be lost. · Stay · Leave |
| Staff list item | {date} · {title} · Banner until {date} / Banner ended · Pop-up on sign-in · Edited {date} · Edit · Delete |
| Edit conflict | This announcement was deleted, so your changes weren't saved. |
| Activity log (REQ-006 type "Announcements") | {name} posted an announcement · {name} edited an announcement · {name} deleted an announcement |
| List paging and errors | Show more announcements · Couldn't load announcements. Check your connection and try again. · Try again |
| Offline | Not posted yet: waiting for a connection. Keep this page open. |
| Edit blocked (decision 6 (a)) | Post a correction instead |
| Footer on every announcement (decision 7) | The HOA never changes its payment account by announcement. Pay only through Pay with QR. |
| Staff alert (decision 7; row for REQ-011's catalogue: each other admin and treasurer, opens Announcements) | {name} posted an announcement: {title}. If you didn't expect this, contact the board. |
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
| The banner and pop-up query shape that meets the selection rule (r5, G-9), and the rules' `trim()` check (G-3) | Sol Arch |
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
