# TC-17: Important announcement shown on sign-in (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature (an announcement ticked Important pops up when a homeowner opens the portal until they press "Got it"; staff see how many households have seen it) |
| Source | [REQ-017 Important announcement shown on sign-in](../requirements/REQ-017-important-announcement-on-sign-in.md), **Approved** 2026-11-28 (r4), Option A. Editing after "Got it" is [REQ-016](../requirements/REQ-016-post-an-announcement.md) decision 6, **open** |
| Depends on / precedent | [REQ-016](../requirements/REQ-016-post-an-announcement.md) (posting, `important`, banner end date, shared banner query, `memberOf`, `reads` dismissals, soft delete, 90-day limit open), [REQ-001](../requirements/REQ-001-sign-in.md) (sign-in), [REQ-004](../requirements/REQ-004-invite-and-link.md) (`linkStatus`, `redeemInvite`, `removeMember`), [REQ-005](../requirements/REQ-005-privacy-notice.md) (privacy notice at first sign-in: another blocking screen), [REQ-002](../requirements/REQ-002-roles-and-permissions.md) ("My household" switch), [REQ-015](../requirements/REQ-015-homeowner-dashboard.md) (dashboard behind the pop-up) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open: the pop-up must fit 375 px with "Got it" visible, TC-17-K4). The mock-up's pop-up is covered by `navigation.spec.js` NAV-05 against mock-up storage; its "seenBy" list is **not** the expected design |
| App version | **Anticipated.** No application code exists. Approved UX: screens 17A, 17B, 17C, 17E of [req-012-017-mockup.html](../mockups/req-012-017-mockup.html). **17D is Option B (sticky banner), not approved, not planned** |
| Source files / functions touched (anticipated) | Pop-up dialog on homeowner pages; shared banner query (REQ-016) filtered to `important`; `reads/{uid}.ackAt` write (fire-and-forget); counting trigger `onDocumentWritten(announcements/{id}/reads/{uid})`; `householdReads/{householdId}` (functions only); `seenHouseholdCount`; two `count()` queries on `households` when staff open an announcement; Firestore rules for `reads`, `householdReads`, `announcements` |
| Architecture | SA-001 r3 **Final** (§4.2 `reads/{uid}`, §4.4 item 8, §8.2). `householdReads`, the counting trigger, `memberOf` and the count queries are S3 follow-ups **not yet in SA-001**: tagged **Provisional — SA-001 follow-up** |
| Environment | **Firebase Emulator Suite or `hoa-portal-staging` only. Never production.** Count cases seed households in bulk (340 linked of 623) in the emulator; never in production. End-date cases need the browser clock; "at the same moment" cases need two sessions (Staging note). Both brands |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. |

**Tags used on cases**

- **Blocked — decision 6** (REQ-016): editing an important announcement after "Got it". **Blocked — 90-day limit** (REQ-016): only where the end date range matters.
- **Provisional — SA-001 follow-up**: asserts `householdReads`, the trigger, `memberOf` or the count queries before SA-001 carries them.
- **Assumption — offline SDK**: the write is queued offline and lost if the tab closes (CS-4, CS-12, Dev to confirm).
- **Gap G-n**: requirement gap (listed at the end).
- **Staging note**: browser clock, two sessions, bulk seeding, admin SDK reads of function-only collections.

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Admin office staff**, **treasurer** | Tick Important when posting (REQ-016); see the pill "Pop-up on sign-in" and the seen-by count |
| **Board** | Sees the seen-by count (read only) |
| **Homeowner** (household member) | Sees the pop-up until pressing "Got it", once per person on every device; never sees counts |
| **Staff who is also a homeowner** | No pop-up in the staff view; pop-up in "My household" |
| **Staff with no household**, **guard**, **no-household account** | No pop-up; a "Got it" record from them is never counted |
| **Counting trigger** (server) | Turns a person's first "Got it" into at most one count per household |

### Test fixtures (invented; QE maps them to `.env`)

| Fixture | Notes |
|---|---|
| **HH-B** "ZZ Test Household B" (Blk 4 Lot 12) | Members U-JUAN ("ZZ Juan") and U-ELENA ("ZZ Elena") |
| **HH-M** (Blk 5 Lot 1) | Member U-MARIA |
| **HH-A** (Blk 2 Lot 7) | Member U-ANA, unlinked during E4 |
| **HH-T** (Blk 9 Lot 3) | Member S-TREAS-HO (treasurer) |
| **HH-BULK-001 … 623** "ZZ Bulk Household nnn" | 623 active households; 340 linked (`linkStatus` linked), 283 not; plus HH-X1 "ZZ Inactive Linked" (linked, `active` false, Gap G-3) |
| **ANN-W** "ZZ Water interruption, Phase 2" | Important, posted Manila today − 2, banner end today + 3 |
| **ANN-R** "ZZ Road repair, Gate 2" | Important, posted Manila today − 1, banner end today + 5 |
| **ANN-N** "ZZ Christmas party" | Not important, live |

| Account | Notes |
|---|---|
| S-ADMIN "ZZ Paolo Admin" | `admin`, no household |
| S-TREAS, S-TREAS-HO, S-BOARD, S-GUARD | Staff roles |
| U-DINA | Signed in, no household, no role |
| U-NEW | Linked to HH-M during B5 (after ANN-W was posted) |

"Today" is **local Manila today**; the REQ's dates (Nov 26–Dec 2, 2026) show the arithmetic.

### Round-trip register

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | `announcements.important` | Staff, at posting only (REQ-016 form tick) | Homeowner: pop-up. Staff: pill "Pop-up on sign-in" | A1, E10, D5 |
| 2 | `bannerUntil` | Staff (REQ-016) | Pop-up stops after that date (decision 4) | D1–D3 |
| 3 | `reads/{uid}.ackAt` (set once, server time) | Homeowner pressing "Got it" (fire-and-forget) | The same person's pop-up query on every device; the counting trigger. Deliberately not readable by staff | B1, F3, F6 |
| 4 | `householdReads/{householdId}` | Counting trigger only | Functions only (future "not yet seen" list, out of scope). Deliberately not shown in R1 | E2, F4 |
| 5 | `seenHouseholdCount` | Counting trigger only | Staff (admin, treasurer, board): "Seen by {n} of …" | E1–E9 |
| 6 | Linked total and all-households total | Not stored: two `count()` queries when staff open the announcement (`linkStatus == 'linked'`; `active == true`) | Staff count "{linked} linked households ({total} in total)" | E1, E4, E7 |
| 7 | `memberOf/{uid}` | `redeemInvite`, `removeMember` (REQ-004) | Counting trigger (which household); rules | E5, B5 |
| 8 | `status = deleted` (REQ-016) | Staff delete | Pop-up query excludes it | D4 |

No read-back cell is empty.

### Status enumeration: does the pop-up show?

| Announcement ↓ / person → | Hasn't pressed Got it | Pressed Got it (this or another device) | Got it queued, tab closed before it saved |
|---|---|---|---|
| **live, important, within banner date** | **Shows** (A1) | No (B1, B3) | Shows again next open (G2) |
| **live, important, after banner date** | No (D1) | No | No |
| **live, important, dismissed as a banner with ×** (if the banner shows it, G-1) | Gap G-1 | No | — |
| **live, not important** | No (D6) | n/a | n/a |
| **deleted, important** | No (D4) | No | No |
| **important, posted during the person's session** | Next open (D8) | — | — |

And by viewer: staff view, staff with no household, guard, no-household account: **never** (H-block, J6).

---

## Test plan

### 1. Smoke

The standing `navigation.spec.js` NAV-05 already checks a pop-up against the mock-up's storage. **Smoke changes for QE:**

1. A homeowner fixture with an unread important fixture announcement sees the pop-up "Important announcement" on opening the portal, presses "Got it", and reaches the dashboard (no page error). NAV-05's mock-up assumptions (one `seenBy` array) are replaced.
2. Staff opening that announcement see the pill "Pop-up on sign-in" and a "Seen by … linked households (… in total)" line.

### 2. Acceptance

| REQ-017 scenario | Cases |
|---|---|
| A must-read pop-up | A1, A4, A5, A6 |
| Shown once per person, on every device | B1 |
| Each member of a household sees it | B2 |
| Several important announcements at once | C1, C2 |
| No pop-up after the end date | D1, D2 |
| The admin sees who has read it | E1 |
| Two people in one household count once | E2 |
| A household that saw it and later unlinked stays counted | E4 |
| A staff member with no household isn't counted | E5 |
| Got it doesn't hold the homeowner up | G1, G2 |
| Pressing Got it twice | E3 |
| A deleted important announcement | D4 |
| Staff are not interrupted | H1, H2 |
| Keyboard and screen reader | K1, K2, K3 |
| Homeowners can't see the count or who read it | F1, F2 |
| Staff see only the count, not who read it | F3, F4, E1 |
| A read record can't be changed once set | F6 |

### 3. Regression

- **Shared banner query (REQ-016)**: the pop-up filters the same result. A change to the query, its limit of 10 or its index moves both. Re-run TC-16's F-block and C-block; G-2 here and TC-16 G-9 are the same risk seen twice.
- **`reads/{uid}` rules are shared** by the banner dismissal (`dismissedAt`) and "Got it" (`ackAt`). Each set once; one must not overwrite or block the other (F7).
- **Landing after sign-in (REQ-001 / TC-01), privacy notice (REQ-005 / TC-05), invite redemption (REQ-004 / TC-04)**: three things now compete to be first on screen. Re-run TC-05's first-sign-in and material-change cases and TC-04-P16 (pop-up after redeem) with an important announcement live.
- **`linkStatus` and `active` (REQ-003, REQ-004)** now feed a staff figure. Re-run TC-03's deactivate/reactivate and TC-04's link and remove cases with E-block counts asserted.
- **Modal behaviour**: NAV-06 says Escape closes an open modal; this dialog is the exception. Make sure the shared modal component keeps both behaviours.
- **Role switch (TC-02)**: staff view vs "My household".

**Existing specs and screens QE should re-run:** `navigation.spec.js` NAV-05 (rewrite), NAV-06 (Escape: exception here), NAV-01 (opens on the dashboard), NAV-07/NAV-08 (375 px, DEF-001); `smoke.spec.js` SMK-owner-*; TC-01, TC-03, TC-04, TC-05, TC-15, TC-16.

**Not affected:** payments, receipts, voids, billing, the guard app.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Seen by", never "notified"; "Every homeowner must press Got it" (form hint) | E11, K9 |
| A value written for one role, never shown back | Yes: `ackAt` read back by the person's devices; count by staff; `householdReads` deliberately hidden | Register |
| Status-gated rule checked for one transition only | Yes: live/deleted, important/not, before/after end, acknowledged/queued | Status enumeration |
| Same concept, different word on another screen | Yes: "Important announcement", "Got it", "Pop-up on sign-in" | K10 |
| Dates computed in UTC where the user means local | **Yes**: the end date at Manila midnight | D2, D3 |
| A derived figure doesn't refresh after a related write | Yes: count after Got it; linked total after link or unlink | E12, E4 |
| Zero and "not set" look the same | Yes: "Seen by 0 of …" vs count not loaded; 0 linked households | E8, E13 |
| A write silently refused by security rules | **Yes**: Got it refused would leave the pop-up forever; client writes to counts | F-block, G3 |
| Double-tap / two devices create duplicates | **Yes**: double Got it; two members at once; trigger delivered twice | E2, E3, E6 |
| Stale reference | Yes: deleted while the pop-up is open; unlinked after Got it | D9, E4 |
| Backdrop click loses work or leaves stale state | Yes: backdrop must not close it | A6 |
| A modal appearing mid-flow blocks the next action | **Yes, this is the feature**: pop-up vs privacy notice, deep link to Pay, after invite redeem | J1, J2, J7 |
| Assumed SDK/network behaviour baked into a case | **Yes**: queued Got it | G1–G3 (Assumption — offline SDK) |
| Data leaking across households or roles | Yes: who read what; staff must see counts only | F-block |

### Scenario list by mandatory type

- **Negative**: Escape, backdrop and Back don't close it; deleted, not important, past end date; staff and guards not shown; homeowner reads of counts and others' reads; staff reads of individual reads and `householdReads`; client writes of counts; changing `ackAt`; extra keys; no-household "Got it" not counted. A5, A6, J5, D1, D4, D6, H-block, F-block, E5.
- **Boundary**: end date 23:59:59 vs 00:00:00 Manila; 1 vs 2 vs 10 vs 11 important; two members at the same instant; trigger twice; 0 seen; count above linked after unlinks; message 599 vs 601 characters and 2,000; household of 1 vs many members. D2, D3, C-block, E2, E6, E8, E9, K4, K5.
- **Usability**: real modal with labelled heading, focus moves in and stays, message read out, "Got it" first and 44 px, 16 px text, fits 375 px, long message scrolls inside with button fixed, focus to main heading on close. K-block, A7.
- **Navigation**: shown before the dashboard; after the privacy notice; on a deep link; after an invite redemption; refresh and Back while open; where the person lands after "Got it"; staff switch. J-block, H2.

---

## A. The pop-up

#### TC-17-A1: An unread important announcement pops up before the dashboard
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN), ANN-W only. **Tags:** —
- **Expected:** On opening the portal, a dialog titled "Important announcement" shows ANN-W before the dashboard is usable.
- **Don't assert:** animation.

#### TC-17-A2: The pop-up greets the person by first name
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** Cross-reference TC-15 G-1 (no first name)
- **Expected:** "Hi ZZ Juan, please read before continuing."
- **Don't assert:** —

#### TC-17-A3: Each item shows its date, title and full message
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** —
- **Expected:** "{posted date} · ZZ Water interruption, Phase 2 · {message}", message shown as text with line breaks (TC-16-E1/E2 rules).
- **Don't assert:** —

#### TC-17-A4: Only "Got it" closes it
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Expected:** No × or other close control; "Got it" closes it and the dashboard shows.
- **Don't assert:** —

#### TC-17-A5: Escape doesn't close it
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN, keyboard. **Tags:** —
- **Expected:** Still open after Escape; no `ackAt` written.
- **Don't assert:** —

#### TC-17-A6: Clicking or tapping outside doesn't close it
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN, desktop and phone. **Tags:** —
- **Expected:** Still open; the page behind can't be clicked or scrolled into use.
- **Don't assert:** —

#### TC-17-A7: After "Got it", focus goes to the page's main heading
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN, keyboard. **Tags:** —
- **Expected:** Focus on the dashboard's main heading; the next Tab goes to the first control on the page.
- **Don't assert:** —

#### TC-17-A8: The important announcement is also listed under Announcements
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** —
- **Expected:** ANN-W on the Announcements page and the dashboard card, before and after "Got it".
- **Don't assert:** any "Important" marking in the list (not specified).

## B. Once per person, on every device

#### TC-17-B1: After "Got it" on the phone, the laptop doesn't show it
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN on two devices. **Tags:** Staging note: two sessions
- **Expected:** The laptop's next open shows no pop-up for ANN-W.
- **Don't assert:** an already-open laptop session.

#### TC-17-B2: Another member of the same household still sees it
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** U-ELENA after U-JUAN pressed "Got it". **Tags:** —
- **Expected:** The pop-up shows for U-ELENA.
- **Don't assert:** —

#### TC-17-B3: Reopening on the same device after "Got it" shows no pop-up
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** —
- **Expected:** No pop-up on reload, on a new tab, or after signing out and in.
- **Don't assert:** —

#### TC-17-B4: Leaving without pressing "Got it" shows it again next time
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA. **Tags:** —
- **Action:** Open the portal, close the tab with the pop-up open; open again.
- **Expected:** Pop-up shows again; no `ackAt` exists.
- **Don't assert:** —

#### TC-17-B5: A person linked after the announcement was posted sees it
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-NEW, linked to HH-M after ANN-W was posted. **Tags:** —
- **Expected:** Pop-up on their first dashboard open (after the join flow).
- **Don't assert:** —

## C. Several important announcements

#### TC-17-C1: Two unread important announcements show in one pop-up, newest first
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN with ANN-W and ANN-R unread. **Tags:** —
- **Expected:** Title "2 important announcements"; ANN-R (newer) above ANN-W.
- **Don't assert:** —

#### TC-17-C2: One "Got it" marks both as seen
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Expected:** Both `reads/{uid}` documents get `ackAt`; next open shows no pop-up; both counts go up by one for HH-B.
- **Don't assert:** —

#### TC-17-C3: With one already acknowledged, only the other shows, under the singular title
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN acknowledged ANN-W only. **Tags:** —
- **Expected:** "Important announcement" with ANN-R only.
- **Don't assert:** —

#### TC-17-C4: Three or more unread show in one scrollable pop-up with "Got it" reachable
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner, 375 px. **Tags:** —
- **Expected:** "{n} important announcements", all listed newest first; "Got it" visible without scrolling the page.
- **Don't assert:** —

#### TC-17-C5: With more than 10 live announcements, an important one isn't silently missed
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-2
- **Setup:** 11 live announcements; the important one has the latest banner end date.
- **Expected (pending G-2):** It pops up. The shared query takes at most 10 ordered by `bannerUntil`, so it can be left out.
- **Don't assert:** until G-2.

#### TC-17-C6: If one of two acknowledgements fails to save, that one shows again next time
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** Staging note: fault injection on one write
- **Expected:** The saved one is gone for good; the failed one pops up on the next open; the homeowner was not blocked.
- **Don't assert:** —

## D. When it stops popping up

#### TC-17-D1: No pop-up after the banner end date
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner who never pressed "Got it". **Tags:** Staging note: browser clock
- **Setup:** ANN-W banner end Dec 1.
- **Expected:** Dec 2 Manila: no pop-up; ANN-W still listed under Announcements.
- **Don't assert:** —

#### TC-17-D2: On the end date itself, until 23:59:59 Manila, it still pops up
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: browser clock
- **Expected:** Dec 1 23:59:59 Manila: pop-up; Dec 2 00:00:01: none.
- **Don't assert:** —

#### TC-17-D3: The end follows Manila midnight, not UTC
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: browser clock and time zone
- **Setup:** Device at Dec 2 07:00 Manila (Dec 1 23:00 UTC).
- **Expected:** No pop-up.
- **Don't assert:** —

#### TC-17-D4: A deleted important announcement doesn't pop up
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner who hadn't seen it; S-ADMIN deletes. **Tags:** —
- **Expected:** No pop-up on the next open.
- **Don't assert:** —

#### TC-17-D5: An announcement can't be made important after posting
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN's browser. **Tags:** —
- **Action:** Update ANN-N's `important` to true; update ANN-W's to false.
- **Expected:** Both refused; no edit form offers the tick for an existing announcement.
- **Don't assert:** —

#### TC-17-D6: A non-important announcement never pops up
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner with only ANN-N live. **Tags:** —
- **Expected:** Banner only; no dialog.
- **Don't assert:** —

#### TC-17-D7: How the important announcement relates to the banner
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-1
- **Expected (pending G-1):** Whether ANN-W also shows as the banner, whether "Got it" also clears that banner, and whether × on its banner stops the pop-up.
- **Don't assert:** until G-1.

#### TC-17-D8: An important announcement posted during a homeowner's session pops up on their next open
**Priority** P2 · **Type** UI/UX (copy honesty) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN signed in; S-ADMIN posts. **Tags:** —
- **Expected:** Pops up on the next open (the query runs once per session); it doesn't interrupt the current session mid-task.
- **Don't assert:** current-session behaviour.

#### TC-17-D9: Deleted while the pop-up is open
**Priority** P3 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN with the pop-up open; S-ADMIN deletes. **Tags:** —
- **Expected:** "Got it" still closes the pop-up without an error; nothing blocks the homeowner; whether the `ackAt` is kept doesn't matter (no count assertion).
- **Don't assert:** the count.

## E. The seen-by count

#### TC-17-E1: Staff see "Seen by {n} of {linked} linked households ({total} in total)"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Provisional — SA-001 follow-up · Staging note: bulk seed
- **Setup:** 623 active households, 340 linked; members of 120 households pressed "Got it" on ANN-W.
- **Expected:** "Seen by 120 of 340 linked households (623 in total)".
- **Don't assert:** —

#### TC-17-E2: Two members of one household pressing "Got it" at the same moment count once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN and U-ELENA. **Tags:** Provisional — SA-001 follow-up · Staging note: two sessions at once
- **Expected:** One `householdReads/HH-B`; `seenHouseholdCount` up by exactly 1.
- **Don't assert:** which member's trigger created it.

#### TC-17-E3: Pressing "Got it" twice counts the household once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Expected:** One `ackAt`; count up by 1.
- **Don't assert:** —

#### TC-17-E4: A household that saw it and then unlinked stays counted
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN; HH-A unlinked after U-ANA pressed "Got it". **Tags:** Staging note: bulk seed
- **Setup:** E1, with HH-A among the 120; then its only member removed.
- **Expected:** "Seen by 120 of 339 linked households (623 in total)".
- **Don't assert:** —

#### TC-17-E5: A staff member with no household isn't counted
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN (a `reads` record with `ackAt` saved for him). **Tags:** Provisional — SA-001 follow-up
- **Expected:** `seenHouseholdCount` unchanged; no `householdReads` created.
- **Don't assert:** —

#### TC-17-E6: A trigger delivered twice counts once
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (trigger). **Tags:** Provisional — SA-001 follow-up · Staging note: replay the event
- **Expected:** Count up by 1; one `householdReads`.
- **Don't assert:** —

#### TC-17-E7: Which households count as "linked" and "in total"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** Gap G-3 · Staging note: HH-X1 linked but inactive
- **Expected (pending G-3):** Whether a linked but deactivated household is in the linked figure, and whether "in total" is active households only.
- **Don't assert:** until G-3.

#### TC-17-E8: Before anyone presses "Got it", the count reads "Seen by 0 of …"
**Priority** P2 · **Type** Boundary (zero) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** "Seen by 0 of 340 linked households (623 in total)"; not blank, not "—".
- **Don't assert:** —

#### TC-17-E9: The count may exceed the current linked figure after unlinks
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Staging note
- **Setup:** 3 linked households, all pressed "Got it"; then 1 unlinked.
- **Expected:** "Seen by 3 of 2 linked households ({total} in total)", shown as is (accepted, Out of scope); no error.
- **Don't assert:** —

#### TC-17-E10: Important announcements carry the pill "Pop-up on sign-in" for staff
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-BOARD. **Tags:** —
- **Expected:** Pill on ANN-W and ANN-R; none on ANN-N; text, not colour alone.
- **Don't assert:** —

#### TC-17-E11: Staff copy says "Seen by", never "notified" or "read by everyone"
**Priority** P2 · **Type** UI/UX (copy honesty) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** No "notified", "delivered" or "received" wording anywhere on the staff announcement.
- **Don't assert:** —

#### TC-17-E12: The count is current when staff open the announcement again
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN; U-MARIA presses "Got it" in between. **Tags:** —
- **Expected:** On reopening, the count is one higher.
- **Don't assert:** live update while open.

#### TC-17-E13: When the count can't load, staff don't see a false zero
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, offline. **Tags:** Gap G-4
- **Expected:** An error or placeholder (copy: G-4), never "Seen by 0 of 0".
- **Don't assert:** text.

#### TC-17-E14: The treasurer and board see the count
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS, S-BOARD. **Tags:** —
- **Expected:** Same count line as the admin office.
- **Don't assert:** —

#### TC-17-E15: The linked total costs about two reads, with no stored counter
**Priority** P3 · **Type** Data integrity (cost) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** Provisional — SA-001 follow-up · Staging note: emulator request log
- **Expected:** Two `count()` aggregation queries per open; no kept linked-total document.
- **Don't assert:** exact billing.

## F. Privacy and rules

All F cases assert the refusal explicitly.

#### TC-17-F1: Homeowners see no count
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** —
- **Expected:** No "Seen by" anywhere on homeowner screens; `seenHouseholdCount` isn't rendered.
- **Don't assert:** whether the field is present in the document the homeowner reads (G-5).

#### TC-17-F2: A homeowner can't read other people's read records
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** —
- **Action:** Get `reads/{U-ELENA uid}`; query the `reads` collection.
- **Expected:** Both refused.
- **Don't assert:** —

#### TC-17-F3: Staff can't read an individual's read record or list them
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-TREAS, S-BOARD. **Tags:** —
- **Expected:** Get and list of `reads` refused; the count still shows.
- **Don't assert:** —

#### TC-17-F4: No client can read `householdReads`
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, U-JUAN. **Tags:** Provisional — SA-001 follow-up
- **Expected:** Refused.
- **Don't assert:** —

#### TC-17-F5: No client can write `householdReads` or `seenHouseholdCount`
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN, U-JUAN. **Tags:** —
- **Expected:** Create `householdReads/HH-M`, set `seenHouseholdCount` to 600: both refused; values unchanged.
- **Don't assert:** —

#### TC-17-F6: An acknowledgement can't be changed once set
**Priority** P1 · **Type** Security (data integrity) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Action:** Update his `ackAt` to a later time; delete his `reads` document.
- **Expected:** Both refused; the original record stands.
- **Don't assert:** —

#### TC-17-F7: Setting `ackAt` doesn't disturb `dismissedAt`, and the other way round
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Expected:** With `dismissedAt` already set, "Got it" saves `ackAt` (allowed as a first set), and `dismissedAt` is unchanged; and vice versa.
- **Don't assert:** —

#### TC-17-F8: `ackAt` must be the server time and no other key is accepted
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN's browser. **Tags:** —
- **Action:** Write `ackAt` as a client timestamp a day earlier; write with an extra `householdId`.
- **Expected:** Both refused.
- **Don't assert:** —

#### TC-17-F9: A person can't create a read record for someone else
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Expected:** Creating `reads/{U-MARIA uid}` refused; HH-M's count unchanged.
- **Don't assert:** —

#### TC-17-F10: An acknowledgement from a person with no household doesn't count
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-DINA. **Tags:** Provisional — SA-001 follow-up · Gap G-6
- **Action:** Create her own `reads/{uid}` with `ackAt` on ANN-W.
- **Expected:** Refused (she can't read announcements, G-6) or, if allowed, no count change.
- **Don't assert:** which, until G-6.

## G. Network

#### TC-17-G1: On a slow connection the pop-up closes at once
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN, throttled. **Tags:** Assumption — offline SDK
- **Expected:** The pop-up closes on the press and the dashboard shows; no spinner blocks the homeowner.
- **Don't assert:** when the write lands.

#### TC-17-G2: A "Got it" still queued when the tab closes shows the pop-up again next time
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN offline. **Tags:** Assumption — offline SDK
- **Action:** Press "Got it" offline; close the tab; reconnect; open.
- **Expected:** The pop-up shows again; the household isn't counted.
- **Don't assert:** SDK internals.

#### TC-17-G3: A queued "Got it" saves once the connection returns with the tab open
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** Assumption — offline SDK
- **Expected:** `ackAt` saved; count up by 1; no pop-up next time.
- **Don't assert:** —

#### TC-17-G4: A refused "Got it" doesn't trap the homeowner
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner whose write is refused (for example removed from the household mid-session). **Tags:** —
- **Expected:** The pop-up closes; the error is reported (`reportError`) without a message to the homeowner; no endless pop-up loop in the same session.
- **Don't assert:** —

## H. Staff aren't interrupted

#### TC-17-H1: A treasurer in the treasurer view gets no pop-up
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO, treasurer view. **Tags:** —
- **Expected:** No pop-up on opening the portal or moving between staff pages.
- **Don't assert:** —

#### TC-17-H2: Switching to "My household" shows the pop-up if not yet acknowledged
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO. **Tags:** —
- **Expected:** Pop-up on switching; after "Got it", HH-T counted once; no pop-up on switching back and forth again.
- **Don't assert:** —

#### TC-17-H3: Staff with no household never see it
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-BOARD. **Tags:** —
- **Expected:** No pop-up anywhere.
- **Don't assert:** —

#### TC-17-H4: Guards never see it
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** S-GUARD. **Tags:** —
- **Expected:** No pop-up; announcement reads refused (TC-16-J4).
- **Don't assert:** —

## J. Flow and navigation

#### TC-17-J1: The pop-up and the privacy notice at the same sign-in
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Linked homeowner who must re-acknowledge a materially changed privacy notice (REQ-005), with ANN-W unread. **Tags:** Gap G-7
- **Expected (pending G-7):** One at a time, in the order G-7 sets (privacy notice first is the natural reading of REQ-005 "before … any dashboard"); neither hides the other's button; both are recorded.
- **Don't assert:** order until G-7.

#### TC-17-J2: Opening the portal on a deep link (Dues & Payments, Pay with QR)
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN opening a bookmarked Dues & Payments address. **Tags:** Gap G-8
- **Expected (pending G-8):** The pop-up shows on that page too (REQ says "before the dashboard"); after "Got it" the person stays on the page they opened.
- **Don't assert:** until G-8.

#### TC-17-J3: Refreshing with the pop-up open shows it again
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA. **Tags:** —
- **Expected:** Pop-up again; nothing recorded.
- **Don't assert:** —

#### TC-17-J4: Back with the pop-up open doesn't get past it
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA, phone Back button. **Tags:** —
- **Expected:** Either the pop-up stays or the person leaves the portal; never a homeowner page usable behind a dismissed pop-up without "Got it".
- **Don't assert:** which.

#### TC-17-J5: Opening another homeowner page by address doesn't bypass the pop-up
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA. **Tags:** Gap G-8
- **Expected:** Typing the Announcements or Dues & Payments address while unacknowledged still shows the pop-up (pending G-8 on which pages show it).
- **Don't assert:** until G-8.

#### TC-17-J6: A signed-in person with no household never gets the pop-up
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** U-DINA on the not-linked screen. **Tags:** —
- **Expected:** No pop-up; no announcement text visible.
- **Don't assert:** —

#### TC-17-J7: After redeeming an invite, the pop-up shows before the new member's dashboard
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** U-NEW. **Tags:** Cross-reference TC-04-P16
- **Expected:** Redeem → pop-up → "Got it" → dashboard; no double pop-up; the invite flow's own confirmation isn't hidden behind it.
- **Don't assert:** —

#### TC-17-J8: After "Got it", the dashboard's first tap works
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN. **Tags:** —
- **Expected:** "Pay with QR" responds to the first tap; no invisible overlay remains.
- **Don't assert:** —

## K. Usability (WCAG 2.2 AA, 375 px)

#### TC-17-K1: The pop-up is a real modal dialog labelled by its heading
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, screen reader. **Tags:** —
- **Expected:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at "Important announcement"; the page behind is inert.
- **Don't assert:** implementation (native `<dialog>` or not).

#### TC-17-K2: Focus moves to the heading and Tab stays inside
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, keyboard. **Tags:** —
- **Expected:** Focus on the heading at open; Tab and Shift+Tab cycle inside; "Got it" reachable and activated by Enter and Space.
- **Don't assert:** —

#### TC-17-K3: The message is read out by a screen reader
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner with NVDA and VoiceOver. **Tags:** —
- **Expected:** Heading, intro, each item's date, title and message are announced in order.
- **Don't assert:** —

#### TC-17-K4: At 375 px, "Got it" is visible without scrolling for a message under 600 characters
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, 375 × 667. **Tags:** DEF-001
- **Expected:** A 599-character message: "Got it" on screen with no scrolling.
- **Don't assert:** —

#### TC-17-K5: A long message scrolls inside the dialog with "Got it" fixed at the bottom
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, 375 px. **Tags:** DEF-001
- **Expected:** A 2,000-character message (and C4's several items) scroll inside; "Got it" stays visible; the page behind doesn't scroll.
- **Don't assert:** —

#### TC-17-K6: Text is at least 16 px on phones and "Got it" at least 44 px
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, phone. **Tags:** —
- **Expected:** Body text ≥ 16 px; "Got it" ≥ 44 × 44 px and the first action.
- **Don't assert:** —

#### TC-17-K7: Contrast meets 4.5:1 in both brands
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** All dialog text ≥ 4.5:1; the important style isn't colour alone.
- **Don't assert:** —

#### TC-17-K8: Nothing shifts under the pop-up when it closes
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** The dashboard behind is already laid out; closing reveals it without a jump.
- **Don't assert:** —

#### TC-17-K9: The staff form shows the guidance under the Important tick
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** "Use for water, power, road or safety notices. Every homeowner must press Got it."
- **Don't assert:** —

#### TC-17-K10: The same words everywhere
**Priority** P3 · **Type** UI/UX (consistency) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner and staff. **Tags:** —
- **Expected:** "Important announcement", "Got it", "Pop-up on sign-in", "Seen by" exactly; no "OK", "Acknowledge" or "Dismiss" on the pop-up.
- **Don't assert:** —

## L. Editing after "Got it" (REQ-016 decision 6, open)

#### TC-17-L1: Staff can't change the title or message once anyone pressed "Got it"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Blocked — decision 6
- **Expected (if decision 6 (a)):** Fields locked with "Post a correction instead"; direct write refused while `seenHouseholdCount > 0`; still editable at 0.
- **Don't assert:** until decision 6.

#### TC-17-L2: With option (b), staff are warned how many had already pressed "Got it"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Blocked — decision 6
- **Expected (if (b)):** "Edited after {n} households pressed Got it" shown to staff; homeowners who pressed it don't get the pop-up again (Gap G-9).
- **Don't assert:** until decision 6.

## X. Exploratory charters

#### TC-17-X1: 20 minutes trying to get past the pop-up without "Got it"
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner on desktop and phone. **Tags:** —
- **Charter:** Escape, backdrop, Back, swipe, browser zoom, devtools removal of the dialog, deep links, a second tab, rotating the phone, reader mode. Note any path to a usable page. Time-box 20 min.

#### TC-17-X2: 15 minutes trying to skew the seen-by count
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowners in one household, staff, a no-household account. **Tags:** —
- **Charter:** Simultaneous "Got it" from several members and devices, offline then online, unlink and relink, remove and re-add, staff acknowledging in "My household"; compare the count with `householdReads`. Time-box 15 min.

---

## Cases that hinge on open decisions

| Open item | Who decides | Cases |
|---|---|---|
| REQ-016 decision 6: editing an important announcement after "Got it" | Owner | L1, L2 |
| REQ-016 90-day limit on the banner end date | Owner | No case here depends on the limit itself; D-block uses dates well inside it |
| Delete `reads` and `householdReads` 12 months after the banner ends | Data Protection Officer | No case in R1 (nothing deletes them) |
| A "not yet seen" list for the office | Admin office | Out of scope; F4 proves `householdReads` stays hidden |
| `householdReads`, trigger, `memberOf`, count queries not in SA-001 | Sol Arch | Provisional cases |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | The pop-up | 8 | 4 |
| B | Once per person | 5 | 4 |
| C | Several at once | 6 | 2 |
| D | When it stops | 9 | 6 |
| E | Seen-by count | 15 | 6 |
| F | Privacy and rules | 10 | 8 |
| G | Network | 4 | 2 |
| H | Staff not interrupted | 4 | 4 |
| J | Flow and navigation | 8 | 2 |
| K | Usability | 10 | 1 |
| L | Editing after Got it (blocked) | 2 | 1 |
| X | Exploratory | 2 | 0 |
| **Total** | | **83** | **40** |

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | Does an important announcement also show as the banner? If so, does "Got it" also dismiss its banner, and does × on the banner stop the pop-up (two separate fields, `dismissedAt` and `ackAt`)? | D7, status enumeration |
| G-2 | The pop-up reuses the banner query (at most 10 live, ordered by `bannerUntil`). With more than 10 live announcements an important one can be left out and never pop up. Same as TC-16 G-9 | C5 |
| G-3 | The two count queries are `linkStatus == 'linked'` and `active == true`. Is a linked but **deactivated** household counted as linked? Is "in total" active households only? | E7 |
| G-4 | No copy for a seen-by count that fails to load | E13 |
| G-5 | `seenHouseholdCount` lives on the announcement document, which members read. Homeowners "see no seen-by count" on screen, but the figure is readable in the data. Acceptable? | F1 |
| G-6 | May a signed-in person with no household (or a guard) create a `reads` record? The `reads` rule says "a person creates only their own", with no membership check | F10 |
| G-7 | Order of blocking screens at one sign-in: privacy notice (REQ-005, including re-acknowledgement after a material change), invite confirm (REQ-004) and this pop-up | J1 |
| G-8 | "Before the dashboard": which pages show the pop-up when someone opens the portal on another homeowner page (a bookmark, a notification link), and where they land after "Got it" | J2, J5 |
| G-9 | If decision 6 (b) is chosen (edits allowed after "Got it"), does an edited important announcement pop up again for people who acknowledged the earlier text? | L2 |
