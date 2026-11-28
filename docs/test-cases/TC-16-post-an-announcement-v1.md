# TC-16: Post an announcement (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature (staff post, edit and soft-delete announcements; homeowners see the newest live one as a dismissible banner and all live ones on an Announcements page) |
| Source | [REQ-016 Post an announcement](../requirements/REQ-016-post-an-announcement.md), **Approved** 2026-11-28 (r4), Option A. **Open:** decision 6 (editing an important announcement after "Got it"), decision 7 (payment-account footer and staff notification of every post), and the **90-day** limit on "Show banner until" (Sol Arch's proposal) |
| Depends on / precedent | [REQ-002](../requirements/REQ-002-roles-and-permissions.md) (admin and treasurer post; board read-only; R1 menus), [REQ-006](../requirements/REQ-006-activity-log.md) (audit entries; trigger rule), [REQ-004](../requirements/REQ-004-invite-and-link.md) (`redeemInvite` and `removeMember` keep `memberOf`), [REQ-017](../requirements/REQ-017-important-announcement-on-sign-in.md) (Important tick, `reads`, `seenHouseholdCount`), [REQ-015](../requirements/REQ-015-homeowner-dashboard.md) (dashboard card, shared fetch), [REQ-011](../requirements/REQ-011-in-app-notifications.md) decision 5 (announcements are not in the bell) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open: the banner must wrap at 375 px with × reachable, TC-16-M3). No other defect in the area |
| App version | **Anticipated.** No application code exists. Approved UX: screens 16A–16F of [req-012-017-mockup.html](../mockups/req-012-017-mockup.html). The mock-up's `FORMS.announce` fan-out (one notification per household) and hard delete (line 1408) are **not** expected |
| Source files / functions touched (anticipated) | Staff Announcements page and form; homeowner Announcements page; banner component on every homeowner page; shared announcement fetch (with REQ-015 card and REQ-017 pop-up); audit trigger `onDocumentWritten(announcements/{id})`; Firestore rules for `announcements`, `announcements/{id}/reads/{uid}`, `memberOf/{uid}`; indexes (`status`, `bannerUntil`) and (`status`, `postedAt` desc); shared confirm dialog |
| Architecture | SA-001 r3 **Final** (§3 client write, no fan-out; §4.2; §4.4 items 8, 11, 12; §8.2). `memberOf/{uid}`, the actor fields and the "read by id after an error" guard are S3 follow-ups **not yet in SA-001**: tagged **Provisional — SA-001 follow-up** |
| Environment | **Firebase Emulator Suite or `hoa-portal-staging` only. Never production.** Staging posts never reach production (separate projects). Offline cases need network control in the browser; banner-end cases need the browser clock (Staging note). Both brands |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. |

**Tags used on cases**

- **Blocked — decision 6** / **Blocked — decision 7** / **Blocked — 90-day limit**: owner questions open. The case stays in the plan; QE must not automate its expected result until answered.
- **Provisional — SA-001 follow-up**: asserts `memberOf`, actor fields or the retry guard before SA-001 carries them.
- **Assumption — offline SDK**: the Firestore web SDK queues writes offline and loses them when the tab closes (Sol Arch, to be confirmed by Dev with an emulator test, CS-12). Cases assert what the screen says, not what the SDK does internally.
- **Gap G-n**: requirement gap (listed at the end).
- **Staging note**: browser clock, network control, two sessions, admin SDK.

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Admin office staff** (`admin`) | Posts, edits, deletes |
| **Treasurer** (`treasurer`) | Posts, edits, deletes (same as admin) |
| **Board** (`board`) | Reads every announcement (including deleted? Gap G-6); no post, edit or delete |
| **Homeowner** (member of a household, via `memberOf/{uid}`) | Reads live announcements: banner, list, dashboard card; dismisses the banner for themselves |
| **Signed-in person with no household**, **guard**, **signed out** | Denied |
| **Staff who is also a homeowner** | Staff controls in the staff view; banner in "My household" |

### Test fixtures (invented; QE maps them to `.env`)

| Account | Who | Notes |
|---|---|---|
| S-ADMIN | ZZ Paolo Admin, zz.admin1@example.test | `admin`, no household |
| S-ADMIN-2 | ZZ Second Admin | `admin`, for two-session cases |
| S-TREAS | ZZ Liza Santos | `treasurer`, no household |
| S-TREAS-HO | Treasurer, member of HH-T (Blk 9 Lot 3) | "My household" view |
| S-BOARD | ZZ Rosa Board | `board` |
| S-GUARD | guard | — |
| U-JUAN, U-ELENA | Members of HH-B "ZZ Test Household B" (Blk 4 Lot 12) | Same household, two people |
| U-MARIA | Member of HH-M (Blk 5 Lot 1) | Other household |
| U-ANA | Member of HH-A, removed during J9 | — |
| U-DINA | ZZ Dina Stranger, signed in, no household, no role | — |

Announcement texts are invented, prefixed "ZZ" (for example "ZZ Christmas party sign-ups are open"). Never paste real resident names, balances or numbers into a test announcement. "Today" is **local Manila today**; the REQ's dates (Nov 28, Dec 12, 2026; Mar 1, 2027) show the arithmetic.

### Round-trip register

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | `title`, `message` | Staff form (admin, treasurer) | Homeowner banner, Announcements page, dashboard card (REQ-015), pop-up (REQ-017); staff list; board list | A1, A3, A4, F1 |
| 2 | `bannerUntil` (`YYYY-MM-DD`, Manila) | Staff form ("Show banner until", default today + 14) | Homeowner banner shows until the end of that date; staff list (shown? Gap G-1) | A6, C6, G4 |
| 3 | `status = live` | Create | Homeowner queries (`live` only) | J6 |
| 4 | `status = deleted`, `deletedAt`, `deletedBy` | Staff "Delete" (soft) | Homeowners: gone from banner, list and card. Staff: Gap G-6. Audit `announcement.deleted` actor from `deletedBy` | H3, H5, H4 |
| 5 | `postedAt`, `postedBy` | Create (server time, the signed-in person) | List and banner "{date}"; audit actor; the retry guard ("posted by this person") | A7, D2 |
| 6 | `editedAt`, `editedBy` | Staff "Edit" | Homeowner list "Edited {date}"; banner (shown? Gap G-2); audit actor | G1, G10 |
| 7 | `important` | Create only (REQ-017) | Pop-up (TC-17); staff pill "Pop-up on sign-in" | A10, G9 |
| 8 | `seenHouseholdCount` | Trigger only (REQ-017) | Staff count (TC-17); decision 6 rule | G8 |
| 9 | `reads/{uid}.dismissedAt` | Homeowner pressing × (their own document) | Their own banner query, on every device | F2, F3, F10 |
| 10 | `memberOf/{uid}.householdIds` | `redeemInvite`, `removeMember` (REQ-004) | Rules: who may read announcements | J5, J9, J12 |
| 11 | `auditLog` `announcement.posted` / `edited` / `deleted` | Trigger | Board, treasurer: activity log (REQ-006; type list has no "Announcements", Gap G-7) | A5, G10, H4 |
| 12 | Footer "The HOA never changes its payment account…" and staff notification (decision 7) | — (open) | Every homeowner; other staff's bell | N1, N2 |

No read-back cell is empty; rows 2, 4 and 6 have open questions on the staff side (G-1, G-2, G-6).

### Status enumeration: actions by announcement state

| State ↓ / action → | Edit (title, message, banner end) | Delete | Homeowner read | Staff read | Banner |
|---|---|---|---|---|---|
| **live**, banner end today or later | Allowed (G1) | Allowed, confirmed (H3) | Yes | Yes | Yes, unless dismissed (F1) |
| **live**, banner end passed | Allowed (G5 for the date range) | Allowed | Yes, list only | Yes | No (C6) |
| **live**, important, nobody pressed Got it | Allowed | Allowed | Yes | Yes | Yes |
| **live**, important, `seenHouseholdCount > 0` | **Blocked — decision 6** (G8) | Allowed | Yes | Yes | Yes |
| **deleted** | **Refused** by rules (G6, H8) | **Refused** / no change (H9) | **Refused** (J7) | Gap G-6 | No |
| (hard delete, any state) | — | **Refused** by rules (H6) | — | — | — |

---

## Test plan

### 1. Smoke

The mock-up smoke pass opens an admin "Announcements" screen and the homeowner one, but against mock-up data. **Smoke additions for QE:**

1. **Staff Announcements** (admin and treasurer) shows the "Post an announcement" form (Title, Message, Show banner until, Important tick, "Post to all homeowners") and the list.
2. A homeowner with a live fixture announcement sees the **banner** at the top of the dashboard with "Dismiss announcement", and the **Announcements** page lists it.
3. A board member opens Announcements and sees the list with **no** form, Edit or Delete (pending G-8 on whether the board menu has Announcements in R1).

### 2. Acceptance

| REQ-016 scenario | Cases |
|---|---|
| Post an announcement | A1–A5 |
| Title and message are required | B1, B2 |
| Pressing twice posts once | D1 |
| A retry after the post already saved | D2, D3 |
| The banner end date must be in range | C1, C3, C4, C5 (upper bound Blocked — 90-day limit) |
| Line breaks and characters are kept as typed | E1, E2 |
| The newest live announcement is the banner | F1, F2 |
| A homeowner dismisses the banner | F3, F4, F5 |
| The banner ends on its date | C6, C7 |
| Edit a typo | G1, G2 |
| Deleting asks first | H1, H2 |
| A deleted announcement disappears for homeowners but stays on record | H3, H4, H5 |
| Editing an important announcement after "Got it" (decision 6) | G8 (Blocked — decision 6) |
| A signed-in person with no household can't read announcements | J5 |
| Homeowners can't post | J1 |
| Board members read only | J2, J3 |
| Nothing posted yet | K1 |
| Posting while offline | D4, D5 |
| The server refuses the post | D7 |

### 3. Regression

- **`memberOf/{uid}` is new and written by REQ-004's `redeemInvite` and `removeMember`.** If either misses it, homeowners silently see no announcements, or a removed owner keeps reading them. Re-run TC-04's C-block (redeem) and K-block (remove) with a `memberOf` assertion added, and TC-04 S-block back-compat for households linked before `memberOf` existed (J13 here).
- **Client-write-plus-trigger audit.** REQ-006's review set the rule "if a trigger is unavoidable, entry id = event id, retry on, nightly missing-entry check". Re-run TC-06's audit cases for announcement entries; P3 here.
- **Shared announcement fetch** with REQ-015's dashboard card and REQ-017's pop-up: TC-15 E-block, TC-17.
- **Shared confirm dialog** (delete) with other confirm dialogs (TC-04 remove, TC-14 void): backdrop and Escape behaviour must stay per-dialog.
- **Rendering rule (CS-10)**: any shared text component change affects every free-text display (rejection and void reasons, request text later).
- **R1 menus (REQ-002 / TC-02)**: Announcements for homeowner, admin, treasurer, board (G-8).

**Existing specs and screens QE should re-run:** `smoke.spec.js` SMK-owner-announcements and SMK-admin-announcements (replace mock-up assumptions), `navigation.spec.js` NAV-03 (one `aria-current`), NAV-05 (important pop-up; see TC-17), NAV-06 (Escape on modals: the delete confirm), NAV-07/NAV-08 (375 px, DEF-001); TC-02, TC-04, TC-06, TC-15, TC-17.

**Not affected:** payments, receipts, voids, billing, invite slips and email, the guard app (guards get no announcements in R1).

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Posted. Homeowners see it the next time they open the portal."; "Homeowners will no longer see it."; "Not posted yet…" | A3, F12, H3, H10, D4 |
| A value written for one role, never shown back | Yes: `bannerUntil` and edits on the staff side; deleted ones for staff; audit | Register rows 2, 4, 6, 11 |
| Status-gated rule checked for one transition only | Yes: edit and delete on live, deleted, important-and-seen | Status enumeration |
| Same concept, different word on another screen | Yes: "Announcement" never "post" or "news" as a noun | M6 |
| Dates computed in UTC where the user means local | **Yes**: banner end at Manila midnight; "today" for the range; "Edited {date}" | C2, C6, C7, C8 |
| A derived figure doesn't refresh after a related write | Yes: banner after dismiss, edit, delete; dashboard card | F2, G2, H3, P1 |
| Zero and "not set" look the same | Yes: no announcements vs list failed to load; no banner vs banner dismissed | K1, K4 |
| A write silently refused by security rules | **Yes**: homeowner, board, guard writes; rules-only fields; dismissals of others | J-block, B10–B12, G9 |
| Double-tap / two devices create duplicates | Yes: double press, retry after error, two staff editing | D1, D2, G11 |
| Stale reference | Yes: edit or delete of an announcement another staff member deleted; role removed mid-form | G6, D7, H8 |
| Backdrop click loses work or leaves stale state | The form is a page, not a modal; delete confirm only | H11, L5 |
| A modal appearing mid-flow blocks the next action | REQ-017 pop-up covers important ones (TC-17) | F6 |
| Assumed SDK/network behaviour baked into a case | **Yes**: offline queueing; tab closed while queued | D4–D6, F11 (Assumption — offline SDK) |
| Data leaking across households or roles | Yes: no-household and guard denied; announcement text carries security details | J4, J5, J9 |

### Scenario list by mandatory type

- **Negative**: empty title or message, over-length, whitespace only, past banner end, homeowner/board/guard/no-household writes and reads, extra keys, wrong `postedBy`, client-set `postedAt`, `seenHouseholdCount` change, edit or delete of a deleted one, hard delete, server refusal mid-form. B-block, C1, J-block, G6, G9, H6–H9, D7.
- **Boundary**: title 100/101, message 2,000/2,001; banner end today, today + 90, today + 91 (blocked); banner end 23:59:59 vs 00:00:00 Manila; Dec 31 banner end; 10 vs 11 live announcements; list page 20 vs 21; default today + 14 across month end. B3–B6, C2–C8, F9, K3, A6.
- **Usability**: labels, inline errors on blur and announced, counters, native date input, banner wraps at 375 px with a 44 px ×, form works on a phone, success toast says when homeowners see it, privacy hint, plain text. M-block, A9, E-block.
- **Navigation**: staff and homeowner menu entries, banner "All announcements", draft kept within the page, after post, after delete, refresh, Back, homeowner can't reach the staff form, board sees no controls. L-block, J2.

---

## A. Post an announcement

#### TC-16-A1: Posting shows the toast that says when homeowners will see it
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff (S-ADMIN). **Tags:** —
- **Action:** Enter title "ZZ Christmas party sign-ups are open", a message, keep the default banner end, press "Post to all homeowners".
- **Expected:** "Posted. Homeowners see it the next time they open the portal." One `announcements` document with `status` live.
- **Don't assert:** toast duration.

#### TC-16-A2: While saving, the button reads "Posting…" and is disabled
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Staging note: slow the write
- **Expected:** "Posting…", disabled, until the write settles.
- **Don't assert:** —

#### TC-16-A3: Every homeowner sees it as the banner the next time they open the portal
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN, U-ELENA, U-MARIA (fresh sessions). **Tags:** —
- **Expected:** Each sees the banner "Announcement · {date} · {title} · {message}" at the top of the dashboard.
- **Don't assert:** banner colour.

#### TC-16-A4: The new announcement is first on the Announcements page
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner; staff. **Tags:** —
- **Expected:** Listed first, newest first, on the homeowner page and the staff list.
- **Don't assert:** —

#### TC-16-A5: The activity log records who posted it and when
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-BOARD reads. **Tags:** Provisional — SA-001 follow-up · Gap G-7
- **Expected:** One `announcement.posted` entry with the actor = `postedBy`, the announcement id and time; no title or message text in the entry.
- **Don't assert:** how the log page labels the entry (G-7).

#### TC-16-A6: "Show banner until" defaults to 14 days after today
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** Staging note: browser clock
- **Expected:** On Nov 28 the field shows Dec 12; on Dec 20 it shows Jan 3 of the next year (month and year rollover in Manila).
- **Don't assert:** date input display format (native).

#### TC-16-A7: The server records the poster and the server time
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** —
- **Expected:** `postedBy` = S-ADMIN's uid; `postedAt` = server time of the write.
- **Don't assert:** —

#### TC-16-A8: The treasurer can post
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS. **Tags:** —
- **Expected:** As A1.
- **Don't assert:** —

#### TC-16-A9: The form carries the privacy hint
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** "Don't include residents' names, balances or contact details." visible near the message field.
- **Don't assert:** placement.

#### TC-16-A10: The form offers the Important tick with its hint
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** Cross-reference TC-17
- **Expected:** "Important: show as a pop-up when homeowners sign in", unticked by default, with "Use for water, power, road or safety notices. Every homeowner must press Got it."
- **Don't assert:** pop-up behaviour (TC-17).

#### TC-16-A11: A post creates no notification documents
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** —
- **Expected:** No `notifications` document is written for homeowners (no fan-out; REQ-011 decision 5). (Staff notification is decision 7, N2.)
- **Lane:** exclusive — asserts the notification count is unchanged.

## B. Validation

#### TC-16-B1: An empty title shows "Add a title" and keeps the message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** "Add a title" under the title field; the typed message still there; nothing posted.
- **Don't assert:** —

#### TC-16-B2: An empty message shows "Add a message" and keeps the title
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** "Add a message"; title kept; nothing posted.
- **Don't assert:** —

#### TC-16-B3: A 100-character title posts
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** —
- **Expected:** Posted; shown whole (wrapped) in banner and list.
- **Don't assert:** —

#### TC-16-B4: A 101-character title is refused with the limit
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** "Title can be up to 100 characters"; not posted.
- **Don't assert:** whether the field blocks the 101st character instead.

#### TC-16-B5: A 2,000-character message posts
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** —
- **Expected:** Posted; the whole message on the Announcements page.
- **Don't assert:** whether the banner truncates it.

#### TC-16-B6: A 2,001-character message is refused with the limit
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** "Message can be up to 2,000 characters"; not posted.
- **Don't assert:** —

#### TC-16-B7: A title of only spaces counts as empty
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** Gap G-3
- **Expected (pending G-3):** "Add a title"; nothing posted. (Rules accept any 1–100-character string, so a blank title sent directly would be stored: G-3.)
- **Don't assert:** the rule's behaviour until G-3.

#### TC-16-B8: Character counters show 100 and 2,000
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** Each field has a counter that updates while typing and is announced politely.
- **Don't assert:** format.

#### TC-16-B9: Errors appear on leaving a field and are announced
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN with a screen reader. **Tags:** —
- **Expected:** Blur an empty title: "Add a title" appears and is read out; the field is marked invalid (`aria-invalid`, `aria-describedby`).
- **Don't assert:** —

#### TC-16-B10: The server refuses a title or message outside the lengths
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN's browser bypassing the form. **Tags:** —
- **Action:** Create with an empty title, a 101-character title, a 2,001-character message.
- **Expected:** Each refused by rules.
- **Don't assert:** —

#### TC-16-B11: The server refuses extra or rules-only keys on create
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN's browser. **Tags:** —
- **Action:** Create with `seenHouseholdCount: 500`, with `editedAt`, with an unknown key.
- **Expected:** Each refused.
- **Don't assert:** —

#### TC-16-B12: The server refuses a wrong poster, a client-chosen time or a non-live status
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN's browser. **Tags:** —
- **Action:** Create with `postedBy` = S-TREAS's uid; with `postedAt` a past client time; with `status: deleted`; with `bannerUntil` "2026-1-5" (not 10 characters).
- **Expected:** Each refused.
- **Don't assert:** —

## C. Banner end date

#### TC-16-C1: A banner end date before today is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** Blocked — 90-day limit (message text only) · Staging note: browser clock
- **Action:** Set "Show banner until" to yesterday; press "Post to all homeowners".
- **Expected:** A message under the field (REQ text "Pick a date from today up to 90 days ahead."); not posted.
- **Don't assert:** the "90 days" wording until the owner confirms the limit.

#### TC-16-C2: Today is accepted as the banner end date
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Staging note: browser clock
- **Expected:** Posted; the banner shows today and is gone tomorrow at 00:00 Manila.
- **Don't assert:** —

#### TC-16-C3: Today + 90 days is accepted
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Blocked — 90-day limit
- **Expected:** Posted.
- **Don't assert:** until the owner confirms 90.

#### TC-16-C4: Today + 91 days is refused
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** Blocked — 90-day limit
- **Expected:** "Pick a date from today up to 90 days ahead."; not posted.
- **Don't assert:** until the owner confirms 90.

#### TC-16-C5: The REQ's example (Mar 1, 2027 from Nov 28, 2026) is refused
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** Blocked — 90-day limit
- **Expected:** Refused (93 days ahead).
- **Don't assert:** until the owner confirms 90.

#### TC-16-C6: The banner shows through its end date and is gone the next day, Manila time
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** Staging note: browser clock
- **Setup:** Banner end Dec 12.
- **Expected:** Dec 12 23:59:59 Manila: banner shows. Dec 13 00:00:01: no banner; still listed under Announcements.
- **Don't assert:** —

#### TC-16-C7: The end of the banner follows Manila midnight, not UTC
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: browser clock and time zone
- **Setup:** Banner end Dec 12; device clock Dec 13 07:00 Manila (Dec 12 23:00 UTC).
- **Expected:** No banner.
- **Don't assert:** —

#### TC-16-C8: A banner ending Dec 31 is gone on Jan 1
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: browser clock
- **Expected:** Shows Dec 31; gone Jan 1 Manila.
- **Don't assert:** —

#### TC-16-C9: The date field is a labelled native date input
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, desktop and phone. **Tags:** —
- **Expected:** `type=date` with the visible label "Show banner until"; min and max set so the picker greys out out-of-range dates (max: Blocked — 90-day limit).
- **Don't assert:** picker appearance.

## D. Double post, retry and offline

#### TC-16-D1: Pressing "Post to all homeowners" twice posts once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** —
- **Expected:** One announcement; one audit entry; one banner for homeowners.
- **Don't assert:** —

#### TC-16-D2: A retry after the post had saved shows "Posted" and makes no second announcement
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Provisional — SA-001 follow-up · Staging note: inject an error after commit
- **Expected:** The app reads the announcement by its id, finds it posted by S-ADMIN, shows "Posted. Homeowners see it the next time they open the portal."; exactly one document.
- **Don't assert:** —

#### TC-16-D3: The id check doesn't claim success for someone else's announcement
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN-2. **Tags:** Provisional — SA-001 follow-up · Staging note: seed an id collision
- **Setup:** An announcement exists with the id S-ADMIN-2's form is about to use, posted by S-ADMIN.
- **Expected:** S-ADMIN-2 doesn't see "Posted"; sees "Couldn't post. Your text is still here."; S-ADMIN's announcement unchanged.
- **Don't assert:** —

#### TC-16-D4: Offline, after 10 seconds the form says it isn't posted yet and keeps the text
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Assumption — offline SDK · Staging note: network control
- **Expected:** "Not posted yet: waiting for a connection. Keep this page open."; title and message still in the form; no "Posted" toast.
- **Don't assert:** SDK internals; exactly 10.0 s.

#### TC-16-D5: When the connection returns, the form says "Posted"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Assumption — offline SDK · Staging note
- **Expected:** "Posted. Homeowners see it the next time they open the portal."; one announcement.
- **Don't assert:** —

#### TC-16-D6: Closing the tab while the post is waiting loses it
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Assumption — offline SDK
- **Expected:** After closing and reconnecting, no announcement exists; the copy "Keep this page open" was shown first (that is the promise under test).
- **Don't assert:** SDK behaviour if persistence is ever turned on.

#### TC-16-D7: If the server refuses the post, the text stays
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN whose admin role is removed after opening the form. **Tags:** —
- **Expected:** "Couldn't post. Your text is still here."; title and message in the form; no announcement.
- **Don't assert:** —

#### TC-16-D8: Posting two announcements in a row creates two
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Gap G-4
- **Action:** Post one, then type and post another without reloading.
- **Expected:** Two announcements (the form gets a fresh id after a success, so the second isn't refused as an update). Whether the form clears after posting: G-4.
- **Don't assert:** form state after posting.

## E. Rendering

#### TC-16-E1: Two paragraphs show as two paragraphs
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN posts; homeowner reads. **Tags:** —
- **Expected:** Banner, list and dashboard card keep the line breaks.
- **Don't assert:** paragraph spacing.

#### TC-16-E2: Markup is shown as literal text
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN posts "<b>ZZ Pool closed</b>"; homeowner reads. **Tags:** —
- **Expected:** The literal characters, not bold text, everywhere it appears (banner, list, card, pop-up, staff list).
- **Don't assert:** —

#### TC-16-E3: A script or event-handler payload does nothing
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN posts `<img src=x onerror=alert(1)>` and `<script>alert(1)</script>` in title and message. **Tags:** —
- **Expected:** Shown as text; no dialog, no network request, no console error from the payload.
- **Don't assert:** —

#### TC-16-E4: Links are shown as text and aren't clickable
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Setup:** Message contains "https://example.test/pay".
- **Expected:** Plain text; no anchor element.
- **Don't assert:** —

#### TC-16-E5: A long unbroken string wraps at 375 px
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner, 375 px. **Tags:** DEF-001
- **Expected:** A 100-character word in the title doesn't push the × off screen or cause sideways scroll.
- **Don't assert:** —

#### TC-16-E6: "ñ", "₱" and emoji display correctly
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Expected:** Characters round-trip unchanged; counters count them as the server counts them (no false over-limit).
- **Don't assert:** emoji rendering style.

## F. Banner for homeowners

#### TC-16-F1: With two live announcements, the newer one is the banner
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** Live announcements posted 8 days ago and today, both within their banner dates.
- **Expected:** Banner shows today's.
- **Don't assert:** —

#### TC-16-F2: Dismissing the banner shows the next newest live one
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Expected:** After ×, the banner shows the older one; after × again, no banner.
- **Don't assert:** animation.

#### TC-16-F3: A dismissal holds on the person's other devices
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN on a phone and a laptop. **Tags:** Staging note: two sessions
- **Expected:** After × on the phone, the laptop's next session shows no banner for it.
- **Don't assert:** whether an already-open laptop session updates.

#### TC-16-F4: Other people, including others in the same household, still see it
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** U-ELENA (same household), U-MARIA. **Tags:** —
- **Expected:** Both still see the banner after U-JUAN dismissed it.
- **Don't assert:** —

#### TC-16-F5: A dismissed announcement is still listed
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** —
- **Expected:** Listed on the Announcements page and the dashboard card.
- **Don't assert:** —

#### TC-16-F6: The banner shows at the top of every homeowner page
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Dashboard, Dues & Payments, Announcements and the pay screen each show it at the top (or G-5 if some pages are excluded); it doesn't cover the "Pay with QR" or submit controls.
- **Don't assert:** —

#### TC-16-F7: "All announcements" on the banner opens the Announcements page
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** The page opens, its menu item highlighted; the banner still shows there unless dismissed.
- **Don't assert:** —

#### TC-16-F8: The dismiss control is labelled and at least 44 px
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, 375 px. **Tags:** —
- **Expected:** Accessible name "Dismiss announcement"; ≥ 44 × 44 px; the banner is a labelled region; focus moves sensibly after dismissing (to the next banner or the main heading).
- **Don't assert:** —

#### TC-16-F9: With more than 10 live banners, the banner query still returns the newest
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-9
- **Setup:** 11 live announcements; the newest has the latest banner end date.
- **Expected (pending G-9):** The banner shows the newest. The query takes at most 10 ordered by `bannerUntil` ascending, then sorts by `postedAt`: the newest one can be cut off.
- **Don't assert:** until G-9.

#### TC-16-F10: A person can only write their own dismissal
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Action:** Write `reads/{U-ELENA uid}.dismissedAt`; read U-ELENA's read document.
- **Expected:** Both refused; U-ELENA still sees the banner.
- **Don't assert:** —

#### TC-16-F11: A dismissal made offline is kept once the connection returns
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** Assumption — offline SDK
- **Expected:** The banner goes at once; after reconnecting with the tab open, the dismissal is saved; if the tab was closed first, the banner may show again next session (by design, as REQ-017).
- **Don't assert:** SDK internals.

#### TC-16-F12: An announcement posted while a homeowner is signed in shows on their next open
**Priority** P2 · **Type** UI/UX (copy honesty) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN signed in; S-ADMIN posts. **Tags:** —
- **Expected:** Not necessarily in the current session (the banner query runs once per session); shown after the next open. The staff toast promises exactly this.
- **Don't assert:** that it does or doesn't appear mid-session.

#### TC-16-F13: A staff member's "My household" view shows the banner; the staff view doesn't
**Priority** P3 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO. **Tags:** Gap G-5
- **Expected (pending G-5):** Banner in "My household"; no banner in the staff view.
- **Don't assert:** until G-5.

## G. Edit

#### TC-16-G1: Editing the title shows the new title with "Edited {date}"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN; homeowner reads. **Tags:** —
- **Action:** Edit to "ZZ Christmas party sign-ups are now open"; save.
- **Expected:** Homeowners' list shows the new title and "Edited {Manila date}"; `editedBy` = S-ADMIN, `editedAt` = server time.
- **Don't assert:** whether the banner shows "Edited" (G-2).

#### TC-16-G2: People who dismissed the banner don't see it again after an edit
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN (dismissed); S-ADMIN edits. **Tags:** —
- **Expected:** No banner for U-JUAN; U-ELENA (not dismissed) sees the edited text.
- **Don't assert:** —

#### TC-16-G3: Editing the message keeps line breaks and the rendering rule
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** —
- **Expected:** As E1–E2 for the edited message.
- **Don't assert:** —

#### TC-16-G4: Extending the banner end date brings the banner back for people who hadn't dismissed it
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN; homeowner. **Tags:** Staging note: browser clock
- **Setup:** Banner ended yesterday.
- **Action:** Edit "Show banner until" to today + 7.
- **Expected:** Homeowners who never dismissed it see the banner on next open.
- **Don't assert:** —

#### TC-16-G5: The banner end date range on edit
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Gap G-10 · Blocked — 90-day limit
- **Expected (pending G-10):** Range counted from the edit day (or the posting day); whether a past date may be set to end the banner early.
- **Don't assert:** until G-10.

#### TC-16-G6: Editing an announcement another staff member just deleted is refused
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN-2 with the edit open; S-ADMIN deletes. **Tags:** Staging note: two sessions · Gap G-11
- **Expected:** Save refused by rules (`status` must be live); the deleted announcement isn't revived; the message shown is G-11.
- **Don't assert:** message text.

#### TC-16-G7: The treasurer can edit an announcement the admin office posted
**Priority** P3 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS. **Tags:** —
- **Expected:** Allowed; `editedBy` = S-TREAS; `postedBy` unchanged.
- **Don't assert:** —

#### TC-16-G8: An important announcement that someone has pressed "Got it" on can't have its title or message edited
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Blocked — decision 6
- **Expected (if decision 6 (a)):** Title and message not editable, "Post a correction instead" shown; a direct write refused by rules. (If (b): edit allowed and staff see "Edited after {n} households pressed Got it".)
- **Don't assert:** until decision 6.

#### TC-16-G9: An edit can't change `important`, `postedAt`, `postedBy`, `seenHouseholdCount` or `status`
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN's browser. **Tags:** —
- **Action:** Updates that change each of those, one at a time, and one with `editedBy` = another uid.
- **Expected:** Each refused.
- **Don't assert:** —

#### TC-16-G10: The activity log records each edit with its actor
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-BOARD reads. **Tags:** Provisional — SA-001 follow-up · Gap G-7
- **Expected:** One `announcement.edited` per save, actor = `editedBy`.
- **Don't assert:** log-page wording.

#### TC-16-G11: Two staff editing at once
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN and S-ADMIN-2. **Tags:** Gap G-11 · Staging note: two sessions
- **Expected (pending G-11):** The outcome G-11 defines (last write wins, or the second is told); never a mix of the two edits in one field.
- **Don't assert:** until G-11.

## H. Delete

#### TC-16-H1: "Delete" asks first
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** "Delete this announcement? Homeowners will no longer see it." with "Cancel" and "Delete"; nothing deleted yet.
- **Don't assert:** —

#### TC-16-H2: Cancel deletes nothing
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** Still live; focus back on "Delete".
- **Don't assert:** —

#### TC-16-H3: After the delete, homeowners no longer see it as a banner, in the list or on the dashboard
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN; U-JUAN reads in a fresh session. **Tags:** —
- **Expected:** Gone from banner, Announcements page and dashboard card.
- **Don't assert:** an already-open session (H10).

#### TC-16-H4: The activity log records who deleted it and when
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-BOARD reads. **Tags:** Provisional — SA-001 follow-up · Gap G-7
- **Expected:** One `announcement.deleted`, actor = `deletedBy`.
- **Don't assert:** —

#### TC-16-H5: A deleted announcement stays on record
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (data check). **Tags:** —
- **Expected:** The document still exists with `status` deleted, `deletedAt`, `deletedBy`; title, message and its `reads` kept.
- **Don't assert:** —

#### TC-16-H6: No client can hard-delete an announcement
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN, S-TREAS. **Tags:** —
- **Expected:** Firestore delete refused.
- **Don't assert:** —

#### TC-16-H7: What staff see of deleted announcements
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-BOARD. **Tags:** Gap G-6
- **Expected (pending G-6):** Either hidden from the staff list or shown labelled "Deleted" with no Edit or Delete; never shown as live.
- **Don't assert:** until G-6.

#### TC-16-H8: Editing a deleted announcement directly is refused
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN's browser. **Tags:** —
- **Expected:** Refused; it stays deleted.
- **Don't assert:** —

#### TC-16-H9: Deleting twice changes nothing the second time
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN and S-ADMIN-2. **Tags:** Staging note: two sessions
- **Expected:** The second is refused or no-op; `deletedBy` stays the first; one audit entry.
- **Don't assert:** message.

#### TC-16-H10: A homeowner already signed in when it is deleted
**Priority** P2 · **Type** UI/UX (copy honesty) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN signed in with the banner showing; S-ADMIN deletes. **Tags:** Gap G-12
- **Expected (pending G-12):** The banner disappears (or stays until next open) as G-12 decides; opening it from the list after deletion shows nothing, not the deleted text.
- **Don't assert:** until G-12.

#### TC-16-H11: Clicking outside the delete confirm doesn't delete
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** Closes (or stays) without deleting.
- **Don't assert:** whether it closes.

## J. Roles and rules

All J cases assert the refusal explicitly.

#### TC-16-J1: Homeowners see no form and their direct write is refused
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Expected:** No "Post an announcement" form; a client create refused.
- **Don't assert:** —

#### TC-16-J2: Board members see every announcement with no post, edit or delete controls
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-BOARD. **Tags:** Gap G-8
- **Expected:** The list of all live announcements; no form, Edit or Delete.
- **Don't assert:** menu placement (G-8).

#### TC-16-J3: A board member's direct create, edit or delete is refused
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-BOARD. **Tags:** —
- **Expected:** All three refused.
- **Don't assert:** —

#### TC-16-J4: Guards can't read announcements
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** S-GUARD. **Tags:** —
- **Expected:** Any announcements read refused; no banner in the guard app.
- **Don't assert:** —

#### TC-16-J5: A signed-in person with no household can't read announcements
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-DINA. **Tags:** Provisional — SA-001 follow-up
- **Expected:** Query and get both refused; she sees none (on the not-linked screen too).
- **Don't assert:** —

#### TC-16-J6: A member's query that doesn't ask for live only is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** —
- **Action:** Query `announcements` with no status filter.
- **Expected:** Refused (rules don't filter results); the app's own queries ask for `live`.
- **Don't assert:** —

#### TC-16-J7: A member can't read a deleted announcement by id
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** —
- **Expected:** Get by id refused.
- **Don't assert:** —

#### TC-16-J8: A signed-out visitor can't read announcements
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** anonymous. **Tags:** —
- **Expected:** Refused.
- **Don't assert:** —

#### TC-16-J9: A member removed from their household loses access
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA removed by `removeMember`. **Tags:** Provisional — SA-001 follow-up
- **Expected:** `memberOf/{uid}` no longer lists HH-A; her reads refused.
- **Don't assert:** delay.

#### TC-16-J10: A newly linked member gains access at once
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** New homeowner after `redeemInvite`. **Tags:** Provisional — SA-001 follow-up
- **Expected:** `memberOf/{uid}` lists the household; the banner shows on the first dashboard open.
- **Don't assert:** —

#### TC-16-J11: Staff with no household read every announcement
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-TREAS, S-BOARD. **Tags:** —
- **Expected:** Reads allowed through the staff check.
- **Don't assert:** —

#### TC-16-J12: No client can write `memberOf`
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-DINA, U-JUAN, S-ADMIN. **Tags:** Provisional — SA-001 follow-up
- **Action:** Create or update `memberOf/{own uid}` with a household id.
- **Expected:** Refused; U-DINA still can't read announcements.
- **Don't assert:** —

#### TC-16-J13: Members linked before `memberOf` existed can read announcements
**Priority** P1 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** A homeowner linked by S1's `redeemInvite` before the S3 change. **Tags:** Gap G-13 · Staging note: data in the old shape
- **Expected:** After the S3 release, they read announcements (a backfill creates `memberOf`, G-13).
- **Don't assert:** how the backfill runs.

## K. Empty, loading and error states

#### TC-16-K1: Nothing posted yet
**Priority** P2 · **Type** Boundary (not set) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "No announcements yet. News from the HOA will appear here."; no banner.
- **Don't assert:** —

#### TC-16-K2: The list shows placeholders while loading
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, throttled. **Tags:** —
- **Expected:** Placeholders, not the empty message.
- **Don't assert:** —

#### TC-16-K3: More than 20 announcements page correctly
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-14
- **Setup:** 21 live announcements.
- **Expected:** 20 on the first page, newest first; the 21st reachable (control wording: G-14).
- **Don't assert:** the control's label.

#### TC-16-K4: A failed list load isn't shown as "No announcements yet."
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Gap G-14
- **Expected:** An error with a way to retry (copy: G-14); never the empty message.
- **Don't assert:** the text.

## L. Navigation

#### TC-16-L1: Staff reach the form from the Announcements menu item, on a page, not a modal
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-TREAS. **Tags:** —
- **Expected:** "Announcements" in the staff menu; the page heading "Announcements" with "Post an announcement" on it; the menu item highlighted.
- **Don't assert:** —

#### TC-16-L2: Homeowners reach the page from the menu
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Announcements · News from the HOA board and admin office."; menu item highlighted.
- **Don't assert:** —

#### TC-16-L3: A draft survives moving around within the page
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Action:** Type a title and message; scroll to the list, open an older announcement's Edit and cancel it.
- **Expected:** The draft is still in the form.
- **Don't assert:** —

#### TC-16-L4: Leaving the page with a draft
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** Gap G-4
- **Expected (pending G-4):** A warning before leaving, or the draft is lost silently, as G-4 decides.
- **Don't assert:** until G-4.

#### TC-16-L5: A homeowner can't reach the staff form by address
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** —
- **Expected:** The staff Announcements address shows the no-access page or the homeowner page; no form.
- **Don't assert:** which.

#### TC-16-L6: Refreshing the staff page keeps the person there
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** Same page; list reloaded.
- **Don't assert:** draft persistence across refresh.

## M. Usability (WCAG 2.2 AA, 375 px)

#### TC-16-M1: Title and message have visible labels
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** "Title", "Message", "Show banner until" labels tied to their fields.
- **Don't assert:** —

#### TC-16-M2: After a refused post, focus goes to the first field in error
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, keyboard. **Tags:** —
- **Expected:** Focus on the title (or message) with its error read out.
- **Don't assert:** —

#### TC-16-M3: The banner wraps at 375 px with × reachable
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, 375 px. **Tags:** DEF-001
- **Expected:** Text wraps; × visible without sideways scroll; banner doesn't cover the page heading.
- **Don't assert:** —

#### TC-16-M4: The post form works on a phone
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN, 375 px. **Tags:** —
- **Expected:** One column; date input usable; post succeeds.
- **Don't assert:** —

#### TC-16-M5: The banner and list meet contrast
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** ≥ 4.5:1 for text in both brands.
- **Don't assert:** —

#### TC-16-M6: Screens say "Announcement", never "post" or "news" as a noun
**Priority** P3 · **Type** UI/UX (consistency) · **Layer** TBD — QE · **Writes** No
**Role:** Staff and homeowner. **Tags:** —
- **Expected:** Headings, buttons, toasts and banner use "Announcement(s)"; "Post" appears only as a verb ("Post to all homeowners").
- **Don't assert:** the page subtitle "News from the HOA…" (copy of record).

## N. Open decision 7

#### TC-16-N1: Every announcement shows the fixed payment-account footer
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Blocked — decision 7
- **Expected (if accepted):** "The HOA never changes its payment account by announcement. Pay only through Pay with QR." under every announcement in banner, list, card and pop-up; not editable by staff.
- **Don't assert:** until decision 7.

#### TC-16-N2: Each post notifies the other staff
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN posts; S-ADMIN-2, S-TREAS read their bells. **Tags:** Blocked — decision 7
- **Expected (if accepted):** One notification per other staff member; none to the poster; none to homeowners.
- **Don't assert:** until decision 7.

## P. Integration

#### TC-16-P1: The dashboard card shows the new announcement
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Cross-reference TC-15-E1
- **Expected:** First on the card on the next open.
- **Don't assert:** —

#### TC-16-P2: The banner, card and pop-up share one fetch per session
**Priority** P3 · **Type** Data integrity (cost) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: emulator request log
- **Expected:** One banner query per session (plus one `reads` get per candidate); moving between pages adds no announcement queries.
- **Don't assert:** exact read count.

#### TC-16-P3: A retried audit trigger writes one entry
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (trigger). **Tags:** Provisional — SA-001 follow-up · Staging note: replay the event
- **Expected:** Replaying the same write event leaves one `announcement.posted` entry (entry id = event id, REQ-006 rule).
- **Don't assert:** —

## X. Exploratory charters

#### TC-16-X1: 20 minutes trying to read announcements you shouldn't
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
**Role:** U-DINA, S-GUARD, a removed homeowner, with devtools. **Tags:** —
- **Charter:** Queries without filters, by id, deleted ones, `reads` of others, `memberOf` writes, cached pages after removal or sign-out. Time-box 20 min.

#### TC-16-X2: 15 minutes breaking the post form
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** —
- **Charter:** Paste huge and odd text, flip offline and online mid-post, double and triple press, two tabs, back button mid-post, date picker on phone. Time-box 15 min.

---

## Cases that hinge on open decisions

| Open item | Who decides | Cases |
|---|---|---|
| Decision 6: editing an important announcement after "Got it" | Owner | G8 |
| Decision 7: payment-account footer and staff notification | Owner | N1, N2 |
| 90-day limit on "Show banner until" | Owner | C1 (message text), C3, C4, C5, C9 (max), G5 |
| Guards and announcements (D9 gate add-on) | Admin office | J4 runs as R1 ("guards denied") |
| Announcements as "notice to members" under the by-laws | HOA board | No case: process, not software |
| `memberOf`, actor fields, retry guard not in SA-001 | Sol Arch | Provisional cases |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Post | 11 | 6 |
| B | Validation | 12 | 5 |
| C | Banner end date | 9 | 3 |
| D | Double post, retry, offline | 8 | 5 |
| E | Rendering | 6 | 3 |
| F | Banner for homeowners | 13 | 6 |
| G | Edit | 11 | 5 |
| H | Delete | 11 | 5 |
| J | Roles and rules | 13 | 12 |
| K | Empty, loading, error | 4 | 0 |
| L | Navigation | 6 | 0 |
| M | Usability | 6 | 0 |
| N | Decision 7 (blocked) | 2 | 0 |
| P | Integration | 3 | 0 |
| X | Exploratory | 2 | 0 |
| **Total** | | **117** | **50** |

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | Does the staff list show each announcement's banner end date (and whether its banner is still showing)? Otherwise staff can't see what they set | Register row 2 |
| G-2 | Does the banner show "Edited {date}", or only the list? | G1 |
| G-3 | Whitespace-only title or message: the form should refuse it, but the rules check length only, so a direct write stores a blank title | B7 |
| G-4 | After a successful post, does the form clear? Leaving the page with an unsent draft: warn, or lose it? | D8, L4 |
| G-5 | "At the top of their pages": every homeowner page, including the pay screen mid-payment? And does a staff member in the staff view see the banner? | F6, F13 |
| G-6 | Do staff (admin, treasurer, board) see deleted announcements in their list, labelled, or not at all? Data changes says staff read "everything" | H7, status enumeration |
| G-7 | REQ-006's activity-log types and filters have no "Announcements" row, and its review says S2 audit is written by callables, with a rule for any later trigger (entry id = event id, nightly missing-entry check). Confirm the announcement entries, their display text, and that the rule applies | A5, G10, H4, P3 |
| G-8 | REQ-002 lists the board's R1 menu as "Dashboard" only (Announcements not listed for R1), but REQ-016 has the board open Announcements. Which? | J2, smoke item 3 |
| G-9 | The banner query takes at most 10 live announcements ordered by `bannerUntil` ascending, then sorts by `postedAt`. With more than 10 live, the newest (often with the latest end date) can be left out of the banner and the REQ-017 pop-up | F9 |
| G-10 | Editing "Show banner until": is the range counted from the edit day or the posting day, and can it be set to a past date to end the banner early? | G5 |
| G-11 | No copy for an edit refused because the announcement was deleted meanwhile, and no rule for two staff editing at once (last write wins?) | G6, G11 |
| G-12 | "Homeowners will no longer see it": the banner query runs once per session, so a homeowner already signed in keeps the deleted banner until their next open. Is that acceptable, or must the banner re-check? | H10 |
| G-13 | `memberOf/{uid}` is new in S3; homeowners linked in S1/S2 have none. Who backfills it, and when, so they don't lose announcements at release? | J13 |
| G-14 | No copy for the list's "more" control (20 per page) or for a list that fails to load | K3, K4 |
