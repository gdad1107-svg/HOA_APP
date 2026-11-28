# REQ-011: In-app notifications

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-004 Announcements and notifications](../epics/EPIC-004-announcements-and-notifications.md) |
| Backlog story | [11 In-app notifications](../backlog/BACKLOG.md#11-in-app-notifications) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted. Sol Arch reviewed: supports Option A with changes (applied in r3) |
| Mockup | Screens 11A–11D of the [REQ-005 to REQ-011 mockup](../mockups/req-005-011-mockup.html). Not yet published as an artifact: ready for the main session to publish |
| Architecture | SA-001 §4.1 (`notifs` → `notifications`), §3 and §4.4 item 8 (no fan-out for announcements), ADR-002 (email is separate); Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-002 (roles), REQ-004 (members) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (bounded live listener for the count, deterministic ids, route codes not URLs, no contact details in parameters, removal clean-up by a retried trigger within a minute, removed staff, catalogue additions for the QR self-alert and bill corrections) · r4, 2026-11-28: owner approval recorded; recommendations accepted · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Decision 3's "with the removal" is met within a minute of the removal, not in the same instant (Sol Arch answer 2); new notifications go only to people linked at that moment. Questions under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (bell with a panel, as in the mock-up), B (bell opening a Notifications page) or C (phone push notifications) | **A**, with the panel filling the screen on phones. Push (C) is a later add-on |
| 2 | Who gets a notification about a household: each linked person, or the household as one | **Each linked person, separately.** Reading one doesn't mark it read for the spouse |
| 3 | When a person is removed from a household (REQ-004, after a sale), their notifications about that lot | **Deleted** with the removal, so the previous owner doesn't keep the lot's payment news |
| 4 | How long notifications are kept | **12 months**, then deleted by the daily job. The panel shows the newest 30 |
| 5 | Announcements in the bell | **No.** Announcements stay as the banner (story 16), one document for everyone (SA-001 §4.4 item 8). The bell is only for things about you or your household |

## Problem

Things change about a homeowner's account while they aren't looking: a statement is ready, a payment is approved or rejected, a receipt is ready. Without a signal they keep checking pages or call the office ("Admin office" persona frustration: residents asking for updates the office already gave). Staff need the same for work waiting on them (a payment to check). The mock-up has a bell, but its notifications go to `'admin'` or `'guard'` as a group and live in the browser.

Who has the problem: every [Homeowner](../product/PERSONAS.md#homeowner), the [Treasurer](../product/PERSONAS.md#treasurer) and [Admin office staff](../product/PERSONAS.md#admin-office-staff).

**Limit to be honest about:** an in-app notification is seen only when the person opens the portal. It does not reach anyone's phone lock screen. That is what email (story 19, R2) or push (Option C) are for.

## Options

### Option A: Bell with a panel (recommended)

- **How it works:** the bell in the top bar shows the unread count. Pressing it opens a panel, newest first; unread ones are highlighted. Pressing a notification marks it read and opens the related page. "Mark all read" clears the count. On phones the panel fills the screen with a "Close" button.
- **Where it lives:** the top bar, on every page, for every role.
- **Cost:** cheap: a per-person list written only by functions, a live count, and two client updates (read, all read).
- **Honest downside:** only seen inside the portal.

### Option B: Bell opening a Notifications page

- **How it works:** the bell goes to a full page instead of a panel.
- **Cost:** cheap, about the same.
- **Honest downside:** leaves the page the person was on; more back-and-forth on desktop for the treasurer working a queue.

### Option C: Phone push notifications (web push)

- **How it works:** the portal asks permission to send notifications to the phone, and sends one for each event.
- **Cost:** moderate: Firebase Cloud Messaging, permission prompts, token management. On iPhones, web push works only when the portal is added to the Home Screen (iOS and iPadOS 16.4 and later), and permission may be asked only after a tap (confirmed by Sol Arch: [WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
- **Honest downside:** many people refuse the permission prompt; uneven on iPhones.

### Recommendation

**Option A** for R1. It's what the mock-up shows, it is cheap, and every later notification (payments, bookings, requests) reuses it. Email in R2 covers people who don't open the portal; push can follow if the board wants it.

## Story

As a homeowner, I want a bell that tells me when something about my account changes, so that I don't have to keep checking each page.

## Notifications in R1

Each REQ writes its own notifications, from the server. This list is the catalogue so wording stays consistent.

| Event | Who gets it | Text | Opens | Written by |
|---|---|---|---|---|
| Statement ready | Each linked person of each billed household | Your {period} statement is ready: {amount} due {due date}. | Dues & Payments | REQ-008 |
| Billing not run | Each treasurer | {period} isn't billed yet. Open Collections to generate it. | Collections | REQ-008 |
| Payment submitted | Each treasurer | {lot} submitted a payment of {amount}. | Approvals | REQ-010 |
| Payment approved | Each linked person of the household | Payment approved: {amount} (ref …{last 4}). Receipt {OR no.} is being prepared. | Dues & Payments | REQ-012 |
| Payment rejected | Each linked person of the household | Payment of {amount} (ref …{last 4}) wasn't approved: {reason} | Dues & Payments | REQ-012 |
| Receipt ready | Each linked person of the household | Receipt {OR no.} is ready to download. | Dues & Payments | REQ-013 |
| QR code replaced | Each other treasurer and each board member | The payment QR code was replaced by {name} on {date}. If you didn't expect this, contact the board. | Settings | REQ-007 |
| QR code replaced (self-alert) | The treasurer who replaced it | You replaced the payment QR code on {date}. If this wasn't you, contact the board now. | Settings | REQ-007 |
| Bill corrected | Each linked person of the household | Your {period} bill was corrected: {amount}. | Dues & Payments | REQ-046 |

No notification copy says "paid", "received" or "sent to your email" unless that is what happened. **Parameters never include contact details.** The one free text in the collection is REQ-012's rejection **reason**, which is the recipient's own matter and is deleted at 12 months or on removal (for the DPO's information).

## Acceptance criteria (Option A)

```gherkin
Feature: Notifications

  Scenario: Unread notifications are counted
    Given Juan Dela Cruz has 2 unread notifications
    Then the bell shows "2" and its label reads "Notifications, 2 unread"
    When he opens the bell and presses "Mark all read"
    Then the count is gone
    And both notifications are still listed, no longer highlighted

  Scenario: Opening a notification marks it read and goes to the page
    Given Juan has the unread notification "Your December 2026 statement is ready: ₱1,800.00 due Dec 31, 2026."
    When he presses it
    Then he lands on Dues & Payments
    And the bell count goes down by 1

  Scenario: A new notification arrives while the portal is open
    Given Juan has the portal open with no unread notifications
    When his December 2026 statement becomes ready
    Then the bell shows "1" without him reloading the page

  Scenario: Many unread
    Given Juan has 14 unread notifications
    Then the bell shows "9+"

  Scenario: Notifications are private
    Given Juan has a notification "Payment approved: ₱1,800.00 (ref …9554). Receipt OR-00093 is being prepared."
    When Maria Santos opens her bell
    Then she does not see Juan's notification
    And Firestore refuses her read of it

  Scenario: Each person in a household has their own
    Given Juan and his spouse are both linked to Blk 4 Lot 12
    When December 2026 is billed
    Then each of them gets the "statement is ready" notification
    When Juan reads his
    Then his spouse's is still unread

  Scenario: Staff get notifications for their role
    Given two people hold the treasurer role
    When Blk 5 Lot 1 submits a payment
    Then both treasurers get "Blk 5 Lot 1 submitted a payment of ₱1,800.00."
    And the admin office does not

  Scenario: Nothing yet
    Given a new homeowner with no notifications
    When they open the bell
    Then it reads "No notifications yet. We'll let you know here when something about your account changes."

  Scenario: Only the newest 30 show
    Given Juan has 45 notifications
    When he opens the bell
    Then the 30 newest show
    And the panel ends with "Showing your 30 most recent notifications."

  Scenario: Notifications fail to load
    Given notifications cannot be loaded
    When Juan opens the bell
    Then the panel reads "We couldn't load your notifications. Try again." with "Try again"
    And the rest of the page still works

  Scenario: Nobody can write a notification from the browser
    Given Juan is signed in
    Then Firestore refuses his creating a notification for anyone, including himself
    And Firestore lets him change only the "read" mark on his own notifications

  Scenario: A removed person loses the lot's notifications (decision 3)
    Given Ana Reyes had 6 notifications about Blk 2 Lot 7
    When the admin removes her from Blk 2 Lot 7
    Then within a minute her bell no longer lists those 6 notifications
    And new notifications about Blk 2 Lot 7 go only to people linked at that moment

  Scenario: A notification is never duplicated by a retry
    Given the December 2026 billing run is resumed after stopping part-way (REQ-008)
    When it finishes
    Then Juan has exactly one "Your December 2026 statement is ready" notification

  Scenario: A notification opens only pages inside the portal
    Given a notification stored with a link that isn't on the portal's list of pages
    When Juan presses it
    Then it is marked read and he stays on the page he was on
    And no other site opens

  Scenario: A removed staff member gets no new notifications
    Given Carmela Cruz's treasurer role was removed (REQ-002)
    When Blk 5 Lot 1 submits a payment
    Then Carmela gets no notification about it
    And her earlier notifications are kept, though she can no longer open staff pages

  Scenario: Old notifications are cleared (decision 4)
    Given Juan has a notification from 13 months ago
    When the daily job runs
    Then that notification is deleted

  Scenario: Keyboard and screen reader
    Given Juan uses a keyboard
    When he presses Enter on the bell
    Then the panel opens and focus moves to its heading
    When he presses Escape
    Then the panel closes and focus returns to the bell

  Scenario: On a phone the panel fills the screen
    Given a screen 375 px wide
    When Juan opens the bell
    Then the panel fills the screen with "Close" at the top
    And the page behind does not scroll
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Notification: `recipientUid`, `householdId` (or null for staff notices), event code, text parameters (amount, period, lot, OR no.; **never contact details**), `link` (a route code such as `dues`, from an allow-list, **never a URL**), `createdAt` (server), `readAt` (or null) | `notifications/{id}` (SA-001 §4.1). **Deterministic id `{eventCode}_{sourceId}_{uid}`**, for example `stmt_2026-12_{hh}_{uid}`, `paysub_{paymentId}_{uid}` | Read: `resource.data.recipientUid == request.auth.uid`; list queries filter on `recipientUid ==`. Update: only `readAt`, only from null to `request.time`. No client create or delete | Functions only, through the shared `notify()` helper (`functions/src/notify/`), which enforces the id, the route allow-list and looks up the **current** members or role holders when it writes | The recipient |
| Unread count | **A bounded live listener**, not a count query (counts can't update live): `recipientUid == me && readAt == null`, newest first, limit 10 (enough for "9+"). A second listener for the newest 30 runs only while the panel is open. About 40 reads a session at most | Capped display at "9+" | — | The bell |
| Indexes | (`recipientUid`, `readAt`, `createdAt` desc); (`recipientUid`, `createdAt` desc) | — | — | — |
| Mark all read | A client batch over the unread query, up to 500 per batch | Same update rule | The recipient | — |
| Clean-up | The daily job deletes notifications older than 12 months. **A trigger on the `members` delete** (`onDocumentDeleted('members/{id}')`, retried) deletes the removed person's notifications for that household in batches, within about a minute of the removal (REQ-004 `removeMember`) | Idempotent | Functions | — |

The text is built on screen from the event code and parameters, so wording can be corrected without rewriting stored notifications (the same approach as REQ-006).

**Changed from the mock-up:** notifications go to a person (`recipientUid`), never to `'admin'` or `'guard'` as a group. A function looks up the current holders of a role (`staff`) when it writes. A staff member whose role is removed (REQ-002) keeps their old notifications but gets no new ones; they can't reach staff pages anyway. This is expected, not a defect.

## UX/UI notes

- **Accessibility:** the bell is a button with `aria-label="Notifications, {n} unread"` and `aria-expanded`; the count is not colour alone (it is a number); the panel is a dialog on phones (focus trapped, Escape closes, focus returns to the bell) and a disclosure panel on desktop; unread items are marked "Unread" for screen readers, not only by background colour; each item is a 44 px tall button.
- **Consistency:** "Notification" (glossary), "Mark all read", "No notifications yet." from the mock-up; dates "Dec 3, 2026"; times "9:14 AM"; amounts "₱1,800.00". The catalogue above is the copy of record for every event.
- **Mobile-first:** the panel fills the screen at 375 px; on desktop it is the mock-up's 360 px dropdown.
- **States:** empty (above); loading (three skeleton rows); error (above); offline ("You're offline. New notifications will show when you reconnect."); success of "Mark all read" is the count disappearing.
- **Stable layout:** the count badge sits on the bell without changing the top bar's width.
- **Safe actions:** "Mark all read" is reversible in effect (nothing is lost) and needs no confirmation.
- **Roles:** every signed-in role has a bell. A person with no household and no role (REQ-001 "not linked") sees an empty bell.

## Copy of record

| Where | Text |
|---|---|
| Bell label | Notifications, {n} unread (none: Notifications) |
| Count | {n} (more than 9: 9+) |
| Panel heading | Notifications |
| Panel button | Mark all read |
| Close (phone) | Close |
| Item time | {Mon D, YYYY} · {h:mm AM} (today: "Today · {h:mm AM}") |
| Unread marker (screen reader) | Unread |
| Empty | No notifications yet. We'll let you know here when something about your account changes. |
| Limit note | Showing your 30 most recent notifications. |
| Error | We couldn't load your notifications. Try again. · Try again |
| Offline | You're offline. New notifications will show when you reconnect. |
| Event texts | See "Notifications in R1" above |

## Out of scope

- Email (story 19, R2) and phone push (Option C).
- Announcements in the bell (decision 5; stories 16 and 17).
- Notification settings (turning kinds off).
- Notifications for bookings, vehicles, requests, record requests and guest passes; each later REQ adds its row to the catalogue.

## Open questions

| Question | Who decides |
|---|---|
| Confirm the 12-month retention (decision 4) and the rejection reason as the one free text in notifications | DPO |
| Is phone push wanted later, given the iPhone limits? | HOA board |

## Sol Arch review

Questions for Sol Arch (from the BA, r1):

1. A live listener for the newest 30 plus a count query for unread: acceptable read cost per session (SA-001 §7 estimate of about 60 reads a session)?
2. `removeMember` deleting the person's notifications for that household (decision 3) in the same transaction, or after it?
3. Rules: recipient reads own; update only `readAt` from null to `request.time`; no create or delete.
4. iPhone web push limits in Option C (unverified by the BA).

**BA size estimate (Sol Arch to confirm):** S, about 1.5–2 person-days with Claude Code: the bell and panel, the shared `notify()` helper for functions with the role lookup, rules and rules tests, the clean-up job, Playwright journeys.

### Sol Arch findings (2026-11-28, draft)

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 §3, §4.1 (`notifs` → `notifications`), §4.4 item 8, §7 (about 60 reads per session) and ADR-002; approved REQ-004 (`removeMember`). Baselines: `docs/sa-001-architecture` at `e28d9bc`, `docs/req-005-045` (uncommitted).

**Verdict: Supports Option A, with changes.** Three of them matter:

- the live unread count can't be a count query;
- the removed person's notifications are deleted by a retried trigger, not inside `removeMember`'s transaction;
- every notification needs a deterministic id, so retries and resumed jobs don't duplicate it.

#### Options

| Option | Feasible? | Cost (BA) | Sol Arch |
|---|---|---|---|
| A: bell with a panel | Yes | Cheap | **Agree** |
| B: bell to a page | Yes | Cheap | Agree |
| C: web push | Yes, with limits | Moderate | Agree it comes later. **iPhone limit confirmed:** iOS and iPadOS 16.4 added Web Push for Home Screen web apps only, and permission may be requested only after a user tap ([WebKit: Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)) |

#### Answers to the BA's questions

1. **The unread count must come from a bounded live listener, not a count query.** Aggregation queries can't be used with real-time listeners ([aggregation queries](https://firebase.google.com/docs/firestore/query-data/aggregation-queries)), so a count query wouldn't update "without reloading". Design:
   - one listener for the life of the session, `recipientUid == me && readAt == null`, ordered by `createdAt desc`, **limit 10** (enough to show "9+"): at most 10 reads at start, plus 1 per new notification;
   - a second listener for the newest 30, **only while the panel is open**.

   That is at most about 40 reads per session, within SA-001 §7's 60 per session (which I'll revise, follow-up). Indexes: (`recipientUid`, `readAt`, `createdAt desc`) and (`recipientUid`, `createdAt desc`).
2. **After, not in the same transaction: a trigger on the `members` delete.** One person can have about 50–100 notifications for a lot over 12 months. A transaction would have to read them all, and could exceed the 500-write batch limit with other writes. An `onDocumentDeleted('members/{id}')` trigger with retry on deletes `notifications where recipientUid == uid && householdId == hh` in batches. It is idempotent, so a retry is harmless. **The window is seconds,** and it only exposes notifications the person already received. **What actually stops new leakage** is that every `notify()` call looks up the *current* members when it writes.
3. **Rules: agree, written exactly.**
   - Read: `resource.data.recipientUid == request.auth.uid`. List queries must filter on `recipientUid ==`.
   - Update: only if `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readAt'])`, `resource.data.readAt == null` and `request.resource.data.readAt == request.time`.
   - No create or delete.
   - "Mark all read" is a client batch over the unread query, in batches of up to 500.
4. **iPhone web push:** confirmed above. Home Screen apps on iOS 16.4+ only.

#### Required changes (for the BA to apply)

> **BA note (r3):** all seven are applied above: 1, 2 and 3 in Data changes (with scenarios for duplicates and off-site links); 4 under the catalogue; 5 in the removal scenario (and the Owner decisions note, since decision 3 said "with the removal"; the minute's delay keeps the decision's intent, so it isn't a conflict); 6 as a note and a scenario; 7 as two catalogue rows (bill corrections from REQ-046, now in S2). The iPhone limit is recorded as confirmed in Option C.

1. **Data changes:** replace "Unread count: count query" with the bounded listener (answer 1). Add the index (`recipientUid`, `readAt`, `createdAt desc`).
2. **Deterministic ids:** every notification id is `{eventCode}_{sourceId}_{uid}` (for example `stmt_2026-12_{hh}_{uid}`, `paysub_{paymentId}_{uid}`). The billing worker resumes and triggers retry; without this, people get duplicates. State it in Data changes. The shared `notify()` helper (`functions/src/notify/`) enforces it.
3. **The link is a route code, not a URL.** Store `link: 'dues'` (from an allow-list in the helper), never a free URL. That rules out a crafted link sending someone off-site.
4. **Parameters never include contact details.** Note one exception the DPO should know about: REQ-012's rejection notification carries the treasurer's free-text **reason** in its parameters. That is acceptable, because it is the recipient's own matter and is deleted at 12 months or on removal. It is the only free text in the collection.
5. **Scenario "A removed person loses the lot's notifications":** change "Then her bell no longer lists" to "Then within a minute her bell no longer lists". Add "And new notifications about Blk 2 Lot 7 go only to people linked at that moment".
6. **Staff recipients:** "a function looks up the current holders of a role (`staff`)". Add that a staff member who is removed (REQ-002) keeps their old notifications but gets no new ones. Their bell is unreachable anyway, because they lose access. Mention it so QA doesn't log it as a defect.
7. **Catalogue additions** from the S2 reviews: the QR self-alert to the treasurer who replaced it (REQ-007 change 3) and, if the correction story is added, "Your {period} bill was corrected: {amount}".

#### Risks not covered

- **Repeat-trigger safety:** deterministic ids (change 2). "Mark all read" is idempotent.
- **Stale recipient (sale):** answer 2.
- **Roles and leakage:** recipient-only reads. Guards get none in R1.
- **Existing data:** none.
- **Scale and cost:** about 1,500–2,500 notifications a month (statements, payments, approvals). The 12-month clean-up keeps it at about 30K documents. The daily job deletes about 100 a day.
- **Copy promising outcomes:** "Receipt {OR no.} is being prepared" is correct per Flow 1 point 4. The catalogue avoids "paid" and "sent". Good.
- **Observability:** an error count from the `notify()` helper. A failed notification fails its owner's transaction, so it shows in that function's errors.

#### Size

**S, 2 person-days with Claude Code (BA: 1.5–2).** It includes the `onDocumentDeleted` trigger and the `notify()` helper with deterministic ids and the route allow-list.

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**1.75 person-days with Claude Code** (was 2). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0.25 · 0.25 · 0 · 1 · 0.25
- **Reuses:** Port: bell and panel in `headerHTML()` 557–559, `readAll` 1339. Extend: empty and error (623). BE: `notify()` helper, delete trigger, route allow-list
