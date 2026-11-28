# TC-11: In-app notifications (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature (bell in the top bar for every role with a live unread count, panel of the newest 30, mark one read by opening it, "Mark all read"; per-person notifications written only by functions through `notify()`; clean-up on removal and after 12 months) |
| Source | [REQ-011 In-app notifications](../requirements/REQ-011-in-app-notifications.md), **Approved** 2026-11-28 (r4), **Option A** (bell with a panel; the panel fills the screen on phones). Decisions: each linked person separately (2); deleted on removal, within a minute (3); kept 12 months, newest 30 shown (4); no announcements in the bell (5) |
| Depends on / precedent | [REQ-002](../requirements/REQ-002-roles-and-permissions.md) (roles; a removed role at once), [REQ-004](../requirements/REQ-004-invite-and-link.md) (`members`, `removeMember`), and each writer in the catalogue: [REQ-007](../requirements/REQ-007-dues-and-payment-settings.md) (QR replaced, self-alert), [REQ-008](../requirements/REQ-008-monthly-billing-run.md) (statement ready, billing not run, resumed run), [REQ-010](../requirements/REQ-010-submit-qr-payment.md) (payment submitted), [REQ-012](../requirements/REQ-012-approve-or-reject-a-payment.md) (approved, rejected), [REQ-013](../requirements/REQ-013-official-receipt-pdf.md) (receipt ready), [REQ-046](../requirements/REQ-046-adjust-or-cancel-a-bill.md) (**Draft**: bill corrected), [REQ-014](../requirements/REQ-014-void-an-approved-payment.md) (payment voided, not in the catalogue: Gap G-2). Precedent: [REQ-016/017](../requirements/REQ-016-post-an-announcement.md) (announcements stay out of the bell) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (**Open**: no viewport meta; the full-screen phone panel depends on it, see TC-11-J6). No other defect exists in this area |
| App version | **Anticipated.** No application code exists. Approved UX: screens 11A–11D of [req-005-011-mockup.html](../mockups/req-005-011-mockup.html). The mock-up's `notify()` (`index.html` line 409) sends to `'admin'` or `'guard'` as a group and stores in the browser; not ported (L-002) |
| Source files / functions touched (anticipated) | `functions/src/notify/` (shared `notify()`: deterministic ids `{eventCode}_{sourceId}_{uid}`, route allow-list, current members and role holders); the `onDocumentDeleted('members/{id}')` clean-up trigger; the daily job (12-month retention); Firestore rules and indexes for `notifications`; the bell and panel component in the top bar (two bounded listeners); the event-code → text renderer |
| Architecture | SA-001 **Final** (r3) §3, §4.1 (`notifs` → `notifications`), §4.4 item 8, ADR-002. REQ-011's Sol Arch review adds the bounded listener, deterministic ids, route codes and the removal trigger, which SA-001 has not absorbed: cases naming them are tagged **Provisional — SA-001 follow-up** |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions) or `hoa-portal-staging` only. Never production.** Both brands |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. |

**Tags used on cases**

- **Provisional — SA-001 follow-up**: asserts an id format, field, listener shape, trigger or rule from REQ-011's Data changes that SA-001 Final does not yet describe.
- **Writer REQ-NNN**: the case needs that REQ's event to fire; until it is built, QE seeds the notification through `notify()` in the emulator.
- **Blocked — REQ-046 draft**: the bill-corrected event is from a REQ not yet approved.
- **Gap G-n**: expected result depends on a requirement gap at the end.
- **Staging note**: special set-up (controllable clock, two sessions, Admin SDK seeding, trigger retry injection).

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Homeowner** (linked member) | Receives household events (statement ready, payment approved / rejected, receipt ready, bill corrected); reads and marks only their own |
| **Second member of the same lot** | Gets their own copy of each household event; reading one never marks the other's (decision 2) |
| **Removed previous owner** | Loses that lot's notifications within a minute of removal; gets nothing new about it |
| **Treasurer** | Receives "payment submitted", "billing not run", "QR replaced" (other treasurers) and the self-alert |
| **Board** | Receives "QR replaced" |
| **Admin office** | Has a bell; in R1 no catalogue event targets the admin office |
| **Guard** | Has a bell; no events in R1 |
| **No household, no role** | Sees an empty bell |
| **Staff whose role was removed** | Keeps old notifications; gets no new ones; can't open staff pages |

### Test fixtures (invented; QE maps them to `.env`)

Same fixture set as TC-09 to TC-12 ([TC-09 fixtures](TC-09-statement-of-account-v1.md#test-fixtures-invented-qe-maps-them-to-env)). Used here: HH-B (Blk 4 Lot 12, U-JUAN and U-JUAN-2), HH-P (Blk 5 Lot 1, U-CARLO, U-CARLO-2), HH-A (Blk 2 Lot 7, U-ANA removed in the clean-up cases, U-BEN), HH-M (U-MARIA), U-STRANGER (no household, no role); S-TREAS (ZZ Liza Santos), S-TREAS-2 (ZZ Mark Tan), S-TREAS-HO (ZZ Carmela Cruz, member of HH-F), S-TREAS-REMOVED, S-ADMIN, S-BOARD, S-BOARD-2, S-GUARD. **U-BULK**: a homeowner seeded with 45 notifications (createdAt spread over 40 days) and 14 unread. **U-OLD**: a homeowner with notifications 11, 12 and 13 months old. "Today" is built from local Manila today; the dates below show the arithmetic (controllable clock).

### Round-trip register

Functions write notifications; the recipient reads and marks them. One row per field or value.

| # | Field / value | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | `recipientUid` | `notify()`, looked up from current members / role holders at write time | The recipient's bell (listener filters on it); rules allow only them | D1, F1 |
| 2 | `householdId` (or null for staff notices) | `notify()` | The removal trigger (which to delete); **deliberately not shown** on screen | G1, G4 |
| 3 | Event code + text parameters (amount, period, lot, OR no., reason) | `notify()` called by each writer REQ | Recipient: the item text, built on screen from the catalogue | C-block |
| 4 | `link` route code (from the allow-list) | `notify()` | Recipient: pressing the item opens that page; an unknown code opens nothing | E-block |
| 5 | `createdAt` (server) | `notify()` | Recipient: item time "{Mon D, YYYY} · {h:mm AM}" or "Today · {h:mm AM}"; ordering newest first; the 12-month job | B3, B4, I1 |
| 6 | `readAt` (null → time) | The recipient's client: pressing an item, or "Mark all read" | Recipient: unread highlight and "Unread" marker gone; bell count and label | A3, A4, A5 |
| 7 | Deterministic id `{eventCode}_{sourceId}_{uid}` | `notify()` | Nobody sees it; proves no duplicates on retry or resume | H-block |
| 8 | Deletion on member removal | `onDocumentDeleted('members/{id}')` trigger | The removed person's bell no longer lists them | G1 |
| 9 | Deletion after 12 months | Daily job | The recipient's bell no longer lists them | I1, I2 |

No read-back cell is empty.

### Notification state: enumeration

| Prior state ↓ / action → | Press the item | "Mark all read" | Client sets `readAt` back to null | Client changes text / recipient | Member removed from the lot | 12 months pass | Role removed (staff) |
|---|---|---|---|---|---|---|---|
| **unread** | → read, page opens (A3) | → read (A4) | n/a | **Refused** (F5) | Deleted within a minute (G1) | Deleted (I1) | Kept, unread (D6) |
| **read** | Page opens; `readAt` unchanged (A6) | Unchanged; not rewritten (A7) | **Refused** (F4) | **Refused** (F5) | Deleted (G1) | Deleted (I1) | Kept (D6) |
| **unread, unknown link** | → read, stays on page (E2) | → read | n/a | Refused | Deleted | Deleted | Kept |
| **staff notice (`householdId` null)** | → read, opens staff page (E4) | → read | Refused | Refused | **Not** deleted by a member removal (G4) | Deleted (I1) | Kept; page shows no-access (E5) |

---

## Test plan

### 1. Smoke

**Smoke additions for QE:** the standing pass has no bell for the real app.

1. For each role (homeowner, treasurer, admin office, board, guard) the **bell** is in the top bar and opens its panel without a page error.
2. A seeded unread notification makes the bell show "1" and the label "Notifications, 1 unread".

### 2. Acceptance

| REQ-011 scenario | Cases |
|---|---|
| Unread notifications are counted | A1, A2, A4, A8 |
| Opening a notification marks it read and goes to the page | A3, E1 |
| A new notification arrives while the portal is open | A9 |
| Many unread | A10, A11 |
| Notifications are private | F1, F2 |
| Each person in a household has their own | D1, D2 |
| Staff get notifications for their role | D3, D4 |
| Nothing yet | B6 |
| Only the newest 30 show | B1, B2 |
| Notifications fail to load | B8, B9 |
| Nobody can write a notification from the browser | F3, F4, F5, F6 |
| A removed person loses the lot's notifications (decision 3) | G1, G2, G3 |
| A notification is never duplicated by a retry | H1, H2 |
| A notification opens only pages inside the portal | E2, E3 |
| A removed staff member gets no new notifications | D6, D7, E5 |
| Old notifications are cleared (decision 4) | I1, I2 |
| Keyboard and screen reader | J1, J2, J3 |
| On a phone the panel fills the screen | J5, J6 |

Catalogue rows (not Gherkin, but the copy of record for every event) map to block C.

### 3. Regression

- **Every writer REQ** calls `notify()`: REQ-007 (QR replace, TC-07), REQ-008 (billing run and resume, TC-08), REQ-010 (submit, TC-10), REQ-012 (decide, TC-12), REQ-013 (receipt ready, TC-13), REQ-046 (corrections). A change to `notify()`'s id, recipient lookup or allow-list affects all of them; re-run each TC's notification cases.
- **Transactions**: notifications are written inside the writer's transaction (REQ-010, REQ-012, REQ-007). A `notify()` failure must fail the writer's whole change (TC-10-B6).
- **Membership (TC-04 block K)**: `removeMember` now has a follow-on trigger; re-run removal and confirm nothing else of the household is touched.
- **Roles (TC-02)**: rules matrix gains `notifications`; stale-token cases for removed staff.
- **Top bar**: the bell is added to the shared top bar on every page; re-run `navigation.spec.js` NAV-03 (one `aria-current`), NAV-06 (Escape closes a modal: the bell panel on phones is a dialog), NAV-07/08 (375 px menu button must not collide with the bell), and the role switch for staff who are homeowners (REQ-002).
- **Announcements (REQ-016/017)**: must **not** appear in the bell (decision 5); the important pop-up must not be blocked by an open panel.
- **Open defect DEF-001**.

**Existing specs and screens QE should re-run:** `smoke.spec.js` SMK-*-nav (top bar), `navigation.spec.js` NAV-03, NAV-05, NAV-06, NAV-07, NAV-08; TC-04 K-block; TC-02 B-block (rules) and I-block (removed role).

**Not affected:** invitation codes and email (TC-04 B–I), the statement ledger (TC-09 A–D), receipt numbering.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Receipt {OR no.} is being prepared", "is ready to download", "has been notified in the portal" (REQ-012) | C4, C6, C11 |
| A value written for one role, never shown back | Yes: every catalogue event must reach a bell | Register; C-block |
| Status-gated rule checked for one transition only | Yes: `readAt` only null → time; every state × action | Enumeration; F4, A6, A7 |
| Same concept, different word on another screen | Yes: REQ-011 catalogue vs REQ-012 wording for approved and rejected | C4, C5, Gap G-1 |
| Dates computed in UTC where the user means local | Yes: "Today" label, item dates, 12-month boundary | B3, B4, I2 |
| A derived figure doesn't refresh after a related write | Yes: live unread count, count after read and "Mark all read" | A3, A4, A9 |
| Zero and "not set" look the same | Yes: 0 unread (no badge) vs listener failed; empty vs error | A1, B6, B8 |
| A write silently refused by security rules | Yes: assert refusals explicitly | F-block |
| Double-tap / two devices create duplicates | Yes: resumed run, retried trigger, double "Mark all read", two tabs | H-block, A12 |
| Stale reference | Yes: notification about a payment already decided; removed member; removed staff | E6, G1, E5 |
| Backdrop click loses work or leaves stale state | Panel holds no input. Backdrop/Escape closes and returns focus | J2 |
| A modal appearing mid-flow blocks the next action | Yes: important announcement pop-up vs open panel | K4 |
| Assumed SDK/network behaviour baked into a case | Yes: offline message, listener reconnect | B10 (assumption marked) |
| Data leaking across households or roles | Yes: other people's notifications; removed owner; contact details in parameters | F-block, G-block, C12 |

### Scenario list by mandatory type

- **Negative**: reading another's notification; list query without own filter; client create, delete, un-read, text change; off-portal link; removed staff gets nothing; announcements not in the bell; load failure. F-block, E2, E3, D6, B11, B8.
- **Boundary**: 0, 1, 9, 10 and 14 unread ("9+"); exactly 30 vs 31 notifications; "Today" around Manila midnight; exactly 12 months old; "Mark all read" over 500 unread; removal "within a minute". A1, A10, A11, B1, B2, B4, I2, A13, G2.
- **Usability**: bell label with count, count is a number not colour, unread marked for screen readers, 44 px items, focus to heading and back, dialog on phone, disclosure on desktop, stable top bar width, loading skeleton, offline message. J-block, B7, B10.
- **Navigation**: each event's link for each role; unknown link; staff link after role removal; closing the panel; Back after opening a notification; bell on every page; treasurer-who-is-homeowner switch. E-block, K-block.

---

## A. Count, read and "Mark all read"

#### TC-11-A1: No unread notifications shows no badge and the plain label
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** All of U-JUAN's notifications read.
- **Expected:** No count on the bell; its label is "Notifications".
- **Don't assert:** —

#### TC-11-A2: Two unread show "2" and the label "Notifications, 2 unread"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Expected:** The bell shows "2"; `aria-label` is "Notifications, 2 unread".
- **Don't assert:** badge colour.

#### TC-11-A3: Pressing an unread notification marks it read and lowers the count by one
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Writer REQ-008
- **Setup:** Unread "Your December 2026 statement is ready: ₱1,800.00 due Dec 31, 2026." and one other unread.
- **Action:** Press the statement notification.
- **Expected:** Its `readAt` is set; the bell shows "1".
- **Don't assert:** the page it opens (E1).

#### TC-11-A4: "Mark all read" clears the count and keeps every notification listed
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** 2 unread.
- **Action:** Open the bell, press "Mark all read".
- **Expected:** The count is gone; both notifications are still listed, no longer highlighted and without the "Unread" marker.
- **Don't assert:** —

#### TC-11-A5: Read notifications are no longer highlighted or marked "Unread"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Expected:** After A3 the read item has the normal background and no screen-reader "Unread" text; unread items keep both.
- **Don't assert:** colours.

#### TC-11-A6: Pressing an already read notification opens its page and leaves `readAt` unchanged
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Provisional — SA-001 follow-up
- **Expected:** The page opens; `readAt` keeps its first value (the rule allows only null → time, so no refused write is attempted or, if attempted, it is harmless and shows no error).
- **Don't assert:** whether the client attempts the write.

#### TC-11-A7: "Mark all read" with nothing unread changes nothing and shows no error
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** No error; `readAt` of read notifications unchanged.
- **Don't assert:** whether the button is hidden or disabled when nothing is unread.

#### TC-11-A8: The count is a number, not colour alone
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** The badge shows a digit; in greyscale it is still readable; contrast ≥ 4.5:1 (or ≥ 3:1 as a graphic with the label carrying the count).
- **Don't assert:** —

#### TC-11-A9: A notification arriving while the portal is open updates the count without a reload
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN); Treasurer runs billing. **Tags:** Writer REQ-008 · Staging note: two sessions
- **Setup:** U-JUAN has the portal open with no unread notifications.
- **Action:** His December 2026 statement becomes ready.
- **Expected:** The bell shows "1" without a reload.
- **Don't assert:** how many seconds it takes.

#### TC-11-A10: Nine unread show "9"; ten show "9+"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** 9 → "9"; 10 → "9+". The label reads "Notifications, 9 unread" and, for 10, a wording that does not claim exactly 9 (G-3).
- **Don't assert:** the label for 10+ until G-3 is answered.

#### TC-11-A11: Fourteen unread show "9+"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-BULK). **Tags:** —
- **Expected:** "9+".
- **Don't assert:** —

#### TC-11-A12: "Mark all read" pressed twice, or in two tabs, leaves every notification read once
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: two tabs
- **Expected:** No error shown; every notification read; no notification's `readAt` changed after its first value.
- **Don't assert:** —

#### TC-11-A13: "Mark all read" over more than 500 unread marks them all
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: 501 unread seeded · Provisional — SA-001 follow-up
- **Expected:** All 501 are read (batches of up to 500); the count is gone.
- **Don't assert:** batch count.

#### TC-11-A14: The count updates in a second tab after reading in the first
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: two tabs or devices
- **Action:** Read one notification in tab 1.
- **Expected:** Tab 2's count drops by one without a reload.
- **Don't assert:** timing.

## B. Panel list, limit and states

#### TC-11-B1: With 45 notifications, the 30 newest show and the limit note ends the panel
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-BULK). **Tags:** —
- **Expected:** Exactly 30 items, newest first; the panel ends with "Showing your 30 most recent notifications."
- **Don't assert:** —

#### TC-11-B2: With exactly 30, all show; with 31, 30 show with the note
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Gap G-4
- **Expected:** 31 → 30 items and the note. 30 → 30 items; whether the note shows at exactly 30 is G-4.
- **Don't assert:** the note at exactly 30.

#### TC-11-B3: A notification from today shows "Today · {time}" in Manila time
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: controllable clock; device time zone UTC
- **Setup:** Created Dec 3, 2026 09:14 Manila.
- **Expected:** On Dec 3 (Manila) it reads "Today · 9:14 AM".
- **Don't assert:** —

#### TC-11-B4: Around Manila midnight the label switches from "Today" to the date
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: controllable clock
- **Setup:** Created Dec 3, 2026 23:50 Manila; view at Dec 4, 00:05 Manila (still Dec 3 in UTC).
- **Expected:** "Dec 3, 2026 · 11:50 PM", not "Today".
- **Don't assert:** —

#### TC-11-B5: Unread items look different from read items, and are marked for screen readers
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Unread items have the highlight and an accessible "Unread" text; read ones neither.
- **Don't assert:** —

#### TC-11-B6: No notifications shows the empty message
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** New homeowner (no notifications). **Tags:** —
- **Expected:** "No notifications yet. We'll let you know here when something about your account changes."
- **Don't assert:** —

#### TC-11-B7: While loading, three skeleton rows show
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: slow network
- **Expected:** Three skeleton rows; never the empty message while loading.
- **Don't assert:** —

#### TC-11-B8: A load failure shows the error with "Try again"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: notifications query forced to fail
- **Expected:** "We couldn't load your notifications. Try again." with a "Try again" button; not the empty message.
- **Don't assert:** —

#### TC-11-B9: The rest of the page still works when notifications fail
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: as B8
- **Expected:** The page behind (for example Dues & Payments) loads and works; the menu works; no blocking error.
- **Don't assert:** —

#### TC-11-B10: Offline shows the offline line
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Assumption: Firestore SDK offline detection; not asserted beyond the copy
- **Expected:** "You're offline. New notifications will show when you reconnect."; after reconnecting, a notification created meanwhile appears.
- **Don't assert:** whether cached items show while offline.

#### TC-11-B11: Announcements never appear in the bell
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner; Admin office posts. **Tags:** Writer REQ-016
- **Action:** Post a normal and an important announcement.
- **Expected:** No notification document is created for anyone; the bell count is unchanged (decision 5).
- **Don't assert:** the banner (TC-16).

## C. Catalogue: each R1 event

Each case checks one event's recipients, text and link. Text is rendered from the event code and parameters.

#### TC-11-C1: "Statement ready" goes to each linked person with period, amount and due date
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN, U-JUAN-2. **Tags:** Writer REQ-008
- **Expected:** Each has "Your December 2026 statement is ready: ₱1,800.00 due Dec 31, 2026."; it opens Dues & Payments; a household with nobody linked gets none.
- **Don't assert:** —

#### TC-11-C2: "Billing not run" goes to each treasurer and opens Collections
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS, S-TREAS-2. **Tags:** Writer REQ-008
- **Expected:** "December 2026 isn't billed yet. Open Collections to generate it."; opens Collections; admin office and board get none.
- **Don't assert:** when the reminder fires (TC-08).

#### TC-11-C3: "Payment submitted" goes to each treasurer and opens Approvals
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS, S-TREAS-2. **Tags:** Writer REQ-010
- **Expected:** "Blk 5 Lot 1 submitted a payment of ₱1,800.00."; opens Approvals; S-ADMIN, S-BOARD and household members get none.
- **Don't assert:** —

#### TC-11-C4: "Payment approved" goes to each linked person of the household
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, U-CARLO-2. **Tags:** Writer REQ-012 · Gap G-1
- **Expected:** Each has one approval notification naming the amount and receipt number, opening Dues & Payments. Exact text pending G-1: REQ-011 "Payment approved: ₱1,800.00 (ref …9554). Receipt OR-00093 is being prepared." vs REQ-012 "Payment approved: ₱1,800.00, OR-00093".
- **Don't assert:** the exact text until G-1 is answered.

#### TC-11-C5: "Payment rejected" goes to each linked person with the reason
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, U-CARLO-2. **Tags:** Writer REQ-012 · Gap G-1
- **Expected:** Each has one rejection notification with the amount and the treasurer's reason, opening Dues & Payments. Exact text pending G-1: REQ-011 "Payment of ₱1,800.00 (ref …9554) wasn't approved: {reason}" vs REQ-012 "Payment not approved: ₱1,800.00. Reason: {reason}. Please submit it again."
- **Don't assert:** exact text.

#### TC-11-C6: "Receipt ready" goes to each linked person and opens Dues & Payments
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, U-CARLO-2. **Tags:** Writer REQ-013
- **Expected:** "Receipt OR-00093 is ready to download."; sent only once the PDF exists (the copy promises it); opens Dues & Payments.
- **Don't assert:** PDF timing.

#### TC-11-C7: "QR code replaced" goes to every other treasurer and every board member
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-2, S-BOARD, S-BOARD-2; S-TREAS replaces. **Tags:** Writer REQ-007
- **Expected:** Each has "The payment QR code was replaced by ZZ Liza Santos on Dec 2, 2026. If you didn't expect this, contact the board."; opens Settings; S-TREAS does not get this one; S-ADMIN gets none.
- **Don't assert:** —

#### TC-11-C8: The treasurer who replaced the QR gets the self-alert
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS. **Tags:** Writer REQ-007
- **Expected:** "You replaced the payment QR code on Dec 2, 2026. If this wasn't you, contact the board now."; opens Settings.
- **Don't assert:** —

#### TC-11-C9: "Bill corrected" goes to each linked person
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, U-CARLO-2. **Tags:** Writer REQ-046 · Blocked — REQ-046 draft
- **Expected:** "Your December 2026 bill was corrected: −₱200.00."; opens Dues & Payments; no treasurer's note in the text.
- **Don't assert:** until REQ-046 is approved.

#### TC-11-C10: "Payment voided" is delivered as REQ-014 describes
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Household members; board members (REQ-014 decision 8). **Tags:** Writer REQ-014 · Gap G-2
- **Expected (pending G-2):** REQ-014 sends "Payment voided: ₱1,800.00, OR-00093. Reason: …" to members and "Payment voided by …" to the board; neither row is in REQ-011's catalogue.
- **Don't assert:** until G-2 is answered.

#### TC-11-C11: No notification says "paid", "received" or "sent to your email" unless it happened
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Every recipient. **Tags:** —
- **Expected:** Across C1–C10 no text says "paid", "received" or "sent to your email" (the statement-ready text says "due", not "paid").
- **Don't assert:** —

#### TC-11-C12: Notification parameters never carry contact details
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** none (Admin SDK read of every notification created by C1–C10). **Tags:** Provisional — SA-001 follow-up
- **Expected:** No parameter holds an email address, a mobile number or a full reference number; the rejection reason is the only free text.
- **Don't assert:** —

#### TC-11-C13: Text is built on screen from the event code, so a wording fix applies to stored notifications
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Provisional — SA-001 follow-up
- **Setup:** A notification stored before a catalogue wording change.
- **Expected:** It renders with the new wording.
- **Don't assert:** —

#### TC-11-C14: An event code the screen doesn't know still shows something sensible
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Gap G-5 · Staging note: unknown event code seeded
- **Expected (pending G-5):** the item renders with a fallback (not blank, not a raw code, no crash) and can be marked read (REQ-006 has an equivalent rule for unknown log entries).
- **Don't assert:** the fallback wording.

## D. Recipients

#### TC-11-D1: Each linked person gets their own copy of a household event
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN, U-JUAN-2. **Tags:** Writer REQ-008
- **Expected:** Two notification documents, one per `recipientUid`.
- **Don't assert:** —

#### TC-11-D2: Reading one person's copy leaves the other's unread
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN, U-JUAN-2. **Tags:** —
- **Action:** U-JUAN reads his.
- **Expected:** U-JUAN-2's copy is still unread and her count unchanged.
- **Don't assert:** —

#### TC-11-D3: Both treasurers get a payment-submitted notification
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS, S-TREAS-2. **Tags:** Writer REQ-010
- **Expected:** One each.
- **Don't assert:** —

#### TC-11-D4: The admin office gets no payment-submitted notification
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Writer REQ-010
- **Expected:** No notification for S-ADMIN.
- **Don't assert:** —

#### TC-11-D5: Guards and no-role accounts have an empty bell
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** S-GUARD; U-STRANGER. **Tags:** —
- **Expected:** Both see a bell with the empty message after every C-block event.
- **Don't assert:** —

#### TC-11-D6: A staff member whose role was removed gets no new staff notifications
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-REMOVED. **Tags:** Writer REQ-010
- **Setup:** Role removed (REQ-002).
- **Action:** HH-P submits a payment.
- **Expected:** No notification for S-TREAS-REMOVED; the others get theirs.
- **Don't assert:** —

#### TC-11-D7: Her earlier notifications are kept
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-REMOVED. **Tags:** —
- **Expected:** The notifications she had before the removal are still listed in her bell (expected behaviour, not a defect, per REQ-011).
- **Don't assert:** —

#### TC-11-D8: A person linked after an event does not receive it
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-BEN, linked to HH-A after the December statement was sent. **Tags:** —
- **Expected:** U-BEN has no December statement notification; he receives the next household event.
- **Don't assert:** —

#### TC-11-D9: A treasurer who is also a homeowner gets household and staff notifications in one bell
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO. **Tags:** Gap G-6
- **Expected:** Her HH-F statement-ready and staff payment-submitted notifications both appear; the count is the same in "Treasurer" and "My household" views (G-6 if the bell is meant to filter by view).
- **Don't assert:** filtering by view until G-6 is answered.

#### TC-11-D10: Recipients are looked up when the event is written, not when it is read
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-2 granted the role after a submission. **Tags:** —
- **Expected:** S-TREAS-2 has no notification for the earlier submission; gets one for the next.
- **Don't assert:** —

## E. Links

#### TC-11-E1: A household notification opens Dues & Payments
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Action:** Press the statement-ready item.
- **Expected:** Dues & Payments opens; the panel closes; the menu highlights Dues & Payments.
- **Don't assert:** —

#### TC-11-E2: A link not on the allow-list marks the item read and stays on the page
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Staging note: notification with `link: 'https://zz-evil.example.test'` seeded by the Admin SDK
- **Expected:** The item is marked read; U-JUAN stays on the page he was on; no other site, tab or window opens.
- **Don't assert:** —

#### TC-11-E3: `notify()` refuses to write a link that isn't a known route code
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** none (function test). **Tags:** Provisional — SA-001 follow-up
- **Action:** Call `notify()` with `link` = a URL, `javascript:…`, and an unknown code.
- **Expected:** Each refused; nothing written.
- **Don't assert:** —

#### TC-11-E4: A staff notification opens the staff page for that role
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS. **Tags:** —
- **Expected:** "Payment submitted" opens Approvals; "QR code replaced" opens Settings; "Billing not run" opens Collections.
- **Don't assert:** —

#### TC-11-E5: A removed staff member opening an old staff notification gets the no-access page
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-REMOVED. **Tags:** —
- **Expected:** Pressing "Payment submitted" marks it read and shows "You don't have access to this page" (REQ-002), never the Approvals content.
- **Don't assert:** —

#### TC-11-E6: A notification about a payment already decided opens the current state
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-2. **Tags:** —
- **Setup:** S-TREAS approved the payment S-TREAS-2's "submitted" notification is about.
- **Expected:** Approvals opens without that payment pending; no error.
- **Don't assert:** whether the link targets the payment itself.

#### TC-11-E7: Back after opening a notification returns to the previous page
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Expected:** Browser Back returns to the page the bell was opened from, with the panel closed.
- **Don't assert:** —

#### TC-11-E8: A household link for a treasurer-who-is-homeowner opens the household view
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO in "Treasurer" view. **Tags:** Gap G-6
- **Action:** Press her HH-F "statement ready" item.
- **Expected (pending G-6):** she lands on her own Dues & Payments (switching to "My household"), not the staff directory.
- **Don't assert:** until G-6 is answered.

## F. Rules: privacy and writes

All F cases assert the refusal explicitly.

#### TC-11-F1: Another person can't see or read your notification
**Priority** P1 · **Type** Security (cross-household) · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA. **Tags:** —
- **Setup:** U-JUAN has "Payment approved: ₱1,800.00 … OR-00093 …".
- **Expected:** U-MARIA's bell doesn't list it; her `get` of its id is refused.
- **Don't assert:** —

#### TC-11-F2: A list query without the own-recipient filter is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN, S-TREAS. **Tags:** Provisional — SA-001 follow-up
- **Action:** Query all `notifications`; query with `recipientUid == ` another uid.
- **Expected:** Both refused; `recipientUid == own uid` allowed.
- **Don't assert:** —

#### TC-11-F3: Nobody can create a notification from the browser, including for themselves
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN, S-TREAS, S-ADMIN. **Tags:** —
- **Expected:** Creating a notification for self or another is refused.
- **Don't assert:** —

#### TC-11-F4: `readAt` can only go from empty to the request time, once
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN on his own notification. **Tags:** Provisional — SA-001 follow-up
- **Action:** Set `readAt` to a past time; to a future time; set it on a read one; set it back to null.
- **Expected:** All refused; setting null → `request.time` on an unread one is allowed.
- **Don't assert:** —

#### TC-11-F5: The recipient can't change any field other than `readAt`
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Action:** Update `recipientUid`, `link`, event code, parameters or `createdAt`, alone or with `readAt`.
- **Expected:** All refused.
- **Don't assert:** —

#### TC-11-F6: Nobody can delete a notification from the browser
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN (own), S-TREAS. **Tags:** —
- **Expected:** Refused.
- **Don't assert:** —

#### TC-11-F7: A guard and a board member read only their own
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-GUARD, S-BOARD. **Tags:** —
- **Expected:** Reads of any other person's notification refused.
- **Don't assert:** —

#### TC-11-F8: A signed-out caller reads nothing
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Anonymous. **Tags:** —
- **Expected:** Refused.
- **Don't assert:** —

## G. Removal clean-up (decision 3)

#### TC-11-G1: Within a minute of removal, the removed person's notifications about the lot are gone
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA; Admin office removes her. **Tags:** Provisional — SA-001 follow-up
- **Setup:** U-ANA has 6 notifications about HH-A.
- **Action:** S-ADMIN removes her from HH-A (REQ-004).
- **Expected:** Within 60 seconds none of the 6 exists and her bell lists none.
- **Don't assert:** exact seconds.

#### TC-11-G2: Between removal and clean-up she can't read the lot's other data
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA. **Tags:** —
- **Expected:** In the window before G1 completes, her own notifications may still list (expected, REQ-011), but HH-A bills, payments and household reads are refused at once.
- **Don't assert:** the window's length.

#### TC-11-G3: New notifications about the lot go only to people linked at that moment
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA (removed), U-BEN (linked). **Tags:** —
- **Action:** After the removal, approve an HH-A payment.
- **Expected:** U-BEN gets the approval notification; U-ANA gets none, even within the minute.
- **Don't assert:** —

#### TC-11-G4: The clean-up deletes only that person's notifications for that lot
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA, U-ANA's former spouse still linked; S-TREAS-HO removed from HH-F. **Tags:** —
- **Expected:** Other members' copies are untouched; S-TREAS-HO's staff notifications (`householdId` null) are kept when she is removed from HH-F.
- **Don't assert:** —

#### TC-11-G5: A retried clean-up deletes nothing extra and leaves no error
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** none (trigger). **Tags:** Staging note: trigger forced to fail once, then retried
- **Expected:** After the retry, the same set is deleted; nothing else.
- **Don't assert:** —

#### TC-11-G6: Clean-up of more than one batch
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** Staging note: 600 notifications for one person and lot seeded
- **Expected:** All 600 deleted (batched).
- **Don't assert:** time taken beyond "within a minute" (record it).

#### TC-11-G7: A person removed and linked again starts with only new notifications
**Priority** P3 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA re-linked to HH-A. **Tags:** —
- **Expected:** Her old HH-A notifications stay deleted; she receives events after the new link.
- **Don't assert:** —

## H. No duplicates on retry or resume

#### TC-11-H1: A resumed billing run gives each person one statement notification
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** Writer REQ-008 · Staging note: run stopped part-way and resumed
- **Expected:** Exactly one "Your December 2026 statement is ready" notification for U-JUAN.
- **Don't assert:** —

#### TC-11-H2: Notification ids follow `{eventCode}_{sourceId}_{uid}`
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (Admin SDK read). **Tags:** Provisional — SA-001 follow-up
- **Expected:** For example `stmt_2026-12_{hh}_{uid}`, `paysub_{paymentId}_{uid}`; no random ids.
- **Don't assert:** event code spellings beyond the two examples.

#### TC-11-H3: Calling `notify()` twice for the same event leaves one notification, still unread or read
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** none (function test). **Tags:** Provisional — SA-001 follow-up
- **Setup:** The first copy has already been read.
- **Expected:** One document; the second call does not reset `readAt` to null or change `createdAt`.
- **Don't assert:** —

#### TC-11-H4: Two different events about the same source make two notifications
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO. **Tags:** —
- **Setup:** A payment is approved, then its receipt becomes ready.
- **Expected:** Two notifications (approved, receipt ready), not merged.
- **Don't assert:** —

## I. Retention (decision 4)

#### TC-11-I1: A notification 13 months old is deleted by the daily job
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** U-OLD. **Tags:** Staging note: controllable clock or seeded `createdAt`
- **Expected:** After the job, the 13-month-old notification is gone; the 11-month-old one stays.
- **Don't assert:** —

#### TC-11-I2: The 12-month boundary
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** U-OLD. **Tags:** Gap G-7
- **Setup:** Notifications created exactly 12 months before the job, and 12 months plus one day.
- **Expected:** 12 months + 1 day deleted. Whether exactly 12 months (same Manila date) is kept is G-7.
- **Don't assert:** the exact-12 outcome.

#### TC-11-I3: The job also deletes read and unread alike, and only notifications
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** —
- **Expected:** Old unread and old read both deleted; no other collection touched.
- **Don't assert:** —

## J. Accessibility and phone layout (WCAG 2.2 AA)

#### TC-11-J1: Enter on the bell opens the panel and moves focus to its heading
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (keyboard). **Tags:** —
- **Expected:** Panel opens; focus on the "Notifications" heading; the bell has `aria-expanded="true"`.
- **Don't assert:** —

#### TC-11-J2: Escape closes the panel and returns focus to the bell
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (keyboard). **Tags:** —
- **Expected:** Panel closes; focus on the bell; `aria-expanded="false"`.
- **Don't assert:** —

#### TC-11-J3: Each item is a button at least 44 px tall reachable by Tab
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Items are buttons (or links) in the tab order, ≥ 44 px tall, with visible focus.
- **Don't assert:** —

#### TC-11-J4: On a phone the panel is a dialog that traps focus
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner at 375 px. **Tags:** —
- **Expected:** `role="dialog"` with an accessible name; Tab cycles inside it; on desktop it is a disclosure panel (no trap).
- **Don't assert:** —

#### TC-11-J5: At 375 px the panel fills the screen with "Close" at the top
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** DEF-001 must be fixed first
- **Expected:** Full-screen panel; "Close" at the top closes it and returns focus to the bell.
- **Don't assert:** —

#### TC-11-J6: The page behind doesn't scroll while the phone panel is open
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner at 375 px. **Tags:** DEF-001
- **Expected:** Scrolling inside the panel does not scroll the page behind; after closing, the page's scroll position is where it was.
- **Don't assert:** —

#### TC-11-J7: On desktop the panel is the 360 px dropdown
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner at 1280 px. **Tags:** —
- **Expected:** A dropdown about 360 px wide under the bell.
- **Don't assert:** exact width.

#### TC-11-J8: The badge doesn't change the top bar's width
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** With 0, 1 and "9+" the top bar items don't shift.
- **Don't assert:** —

#### TC-11-J9: The bell and the 375 px menu button don't collide
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Every role at 375 px. **Tags:** DEF-001
- **Expected:** Both are visible, separately tappable, each ≥ 44 × 44 px with ≥ 8 px between (WCAG 2.5.8 at least 24 px).
- **Don't assert:** —

## K. Navigation and the top bar

#### TC-11-K1: Every role has the bell on every page
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, treasurer, admin office, board, guard, no-role. **Tags:** —
- **Expected:** The bell is in the top bar on each role's pages, including the not-linked screen and the no-access page.
- **Don't assert:** —

#### TC-11-K2: Opening and closing the panel doesn't change the page or the highlighted menu item
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** After open and Close, same page, same `aria-current` item (NAV-03).
- **Don't assert:** —

#### TC-11-K3: A reload with the panel open reopens the page with the panel closed
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Page reloads; panel closed; count correct.
- **Don't assert:** —

#### TC-11-K4: An open panel doesn't block the important announcement pop-up
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Setup:** An unacknowledged important announcement (REQ-017) on sign-in.
- **Expected:** The pop-up and the bell panel never stack in a way that hides the pop-up's button; the pop-up can be acknowledged and then the bell used.
- **Don't assert:** which appears on top.

#### TC-11-K5: Signing out clears the bell
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner on a shared phone. **Tags:** —
- **Action:** Sign out; sign in as another homeowner; also press Back after sign-out.
- **Expected:** The first person's notifications and count never show for the second, nor from the back-forward cache.
- **Don't assert:** —

## L. Listener shape (read cost)

#### TC-11-L1: The unread count comes from a bounded live listener
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-BULK). **Tags:** Provisional — SA-001 follow-up
- **Expected:** One listener `recipientUid == me && readAt == null`, newest first, limit 10, for the session; at most 10 documents read at start with 14 unread.
- **Don't assert:** SDK internals beyond the query shape.

#### TC-11-L2: The list listener runs only while the panel is open
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Provisional — SA-001 follow-up
- **Expected:** The newest-30 listener starts on open and stops on close.
- **Don't assert:** —

## X. Exploratory charters

#### TC-11-X1: 15 minutes looking for duplicate, missing or leaked notifications
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Two members of one lot, two treasurers, a removed owner. **Tags:** —
- **Charter:** Drive every R1 event in quick succession, resume a billing run, remove and re-link a member, remove a treasurer role mid-way; compare every bell. Time-box 15 min.

#### TC-11-X2: 10 minutes using the bell one-handed on a phone and with a screen reader
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner, TalkBack or VoiceOver. **Tags:** Staging note: real phone
- **Charter:** Open, read, mark all read, close, follow links; note anything unannounced or hard to reach. Time-box 10 min.

---

## Cases that hinge on open decisions or drafts

| Open item | Who decides | Cases |
|---|---|---|
| Writer REQs not built yet (008, 010, 012, 013, 007) | Build order | Every "Writer REQ-NNN" case: seed through `notify()` until the writer exists |
| REQ-046 draft (bill corrected) | Owner | C9 |
| DPO confirmation of 12-month retention and the rejection reason as free text | DPO | I1, I2, C5 |
| SA-001 follow-up (deterministic ids, bounded listener, removal trigger, route allow-list) | Sol Arch | Every Provisional case |
| Gaps G-1 to G-7 | BA | As tagged |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Count, read, Mark all read | 14 | 5 |
| B | Panel list, limit, states | 11 | 5 |
| C | Catalogue: each R1 event | 14 | 7 |
| D | Recipients | 10 | 6 |
| E | Links | 8 | 3 |
| F | Rules: privacy and writes | 8 | 6 |
| G | Removal clean-up | 7 | 3 |
| H | No duplicates | 4 | 1 |
| I | Retention | 3 | 1 |
| J | Accessibility, phone layout | 9 | 3 |
| K | Navigation, top bar | 5 | 1 |
| L | Listener shape | 2 | 0 |
| X | Exploratory | 2 | 0 |
| **Total** | | **97** | **41** |

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | **Approved and rejected texts disagree.** REQ-011 catalogue: "Payment approved: {amount} (ref …{last 4}). Receipt {OR no.} is being prepared." and "Payment of {amount} (ref …{last 4}) wasn't approved: {reason}". REQ-012 Gherkin and copy: "Payment approved: {amount}, {OR no.}" and "Payment not approved: {amount}. Reason: {reason}. Please submit it again." Pick one; REQ-011 says its catalogue is the copy of record. Also: the catalogue's "ref …{last 4}" reaches a new owner for a payment submitted before they joined, which option (b) hides on screen (TC-12 G-4) | C4, C5 |
| G-2 | REQ-014 sends "Payment voided" to members and board members; neither row is in REQ-011's R1 catalogue (text, recipients, link) | C10 |
| G-3 | Bell `aria-label` for 10 or more unread: "Notifications, 9+ unread", or the real number? | A10 |
| G-4 | Does "Showing your 30 most recent notifications." show at exactly 30, or only when there are more? | B2 |
| G-5 | What an item shows for an event code the screen doesn't know (a newer function writing to an older cached app) | C14 |
| G-6 | For a treasurer who is also a homeowner: one bell for both views, or filtered by the switch? Where does a household link land in the Treasurer view? | D9, E8 |
| G-7 | "12 months" boundary: is a notification exactly 12 months old (same Manila date) deleted or kept? | I2 |
