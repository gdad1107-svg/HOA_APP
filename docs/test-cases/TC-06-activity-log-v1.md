# TC-06: Activity log of money and record changes (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new read-only "Activity log" page for staff with filters (type, lot, person, date range), 50 entries per page; one shared audit helper that every function uses, in the same transaction as its change; no personal data in entries |
| Source | [REQ-006 Activity log of money and record changes](../requirements/REQ-006-activity-log.md), **Approved** 2026-11-28 (r4, "Approve all as shown"), Option A, Sol Arch's changes applied in r3 |
| Depends on / precedent | [REQ-002 Roles](../requirements/REQ-002-roles-and-permissions.md) (`isStaff()` with `staff/{uid}`, L-004; `role.set`; no-access page; board read-only note), [REQ-003 Household directory](../requirements/REQ-003-household-directory.md) (`household.*`, `import.completed`; contact fields kept apart in `householdContacts`), [REQ-004 Invite and link](../requirements/REQ-004-invite-and-link.md) (`invite.*`, `member.removed`). Writers added in S2: [REQ-005](../requirements/REQ-005-privacy-notice.md) (`privacy.published`), [REQ-007](../requirements/REQ-007-dues-and-payment-settings.md) (`settings.changed`, `settings.qrReplaced`), [REQ-008](../requirements/REQ-008-monthly-billing-run.md) (`billing.*`), [REQ-010](../requirements/REQ-010-submit-qr-payment.md) (`payment.submitted`). Later writers: REQ-012 / REQ-014 (S3: `payment.approved`, `rejected`, `voided`), [REQ-046](../requirements/REQ-046-adjust-or-cancel-a-bill.md) (draft: `bill.adjusted`) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (**Open**: no viewport meta; the board reads the log on a phone, see TC-06-Q1, Q2). No defect is open in this area |
| App version | **Anticipated.** No application code exists; `main` at `9ace525` holds the mock-up, whose "Recent activity" card (`index.html` line 734) is free text written by the browser (`log()`), which this REQ replaces. Approved UX: screens 6A–6C of [req-005-011-mockup.html](../mockups/req-005-011-mockup.html) |
| Source files / functions touched (anticipated) | Shared helper `functions/src/audit/audit.js` (allow-list per action code); every S1 and S2 callable that writes `auditLog` (`setRole`, household functions, invite functions, `saveDuesSettings`, `replacePaymentQr`, billing functions, the payment submit function) and the REQ-005 publish script; Firestore rules for `auditLog` (deny all client writes; read for treasurer, board, admin office); `firestore.indexes.json` (five indexes); the Activity log page, sentence builder per code, filters, `count()` summary, pagination |
| Architecture | SA-001 r3 **Final** §3 ("Audit log: function / trigger only"), §4.4 item 9, §8.2 (no personal data in free text), §8.3. The field list (`targetType`, `count`, `refLast4`, `requestRef`, homeowner `actorName` null), the helper path and the indexes come from **Sol Arch's REQ-006 review**, not yet folded into SA-001 (RELEASE-PLAN follow-ups). Cases that assert them are tagged **Provisional — design** |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions) or `hoa-portal-staging` only. Never production.** Large logs (2,300 entries) are seeded with the admin SDK in the helper's shape; entries for codes whose functions ship in S3 or later are seeded the same way (tag **Seeded entry**). Both brands |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. Layers are left for QE (`TBD — QE`). Cases tagged Gap G-n wait for the BA's answer |

**Tags used on cases**

- **Provisional — design**: asserts a field, path or index from Sol Arch's REQ-006 review, not yet in SA-001 Final.
- **Seeded entry**: the entry is written with the admin SDK in the helper's shape, because its function ships later (S3, REQ-046) or the volume is large. **Live entry**: the entry is written by the real function during the case.
- **Gap G-n**: expected result depends on a requirement gap. **Blocked — board**: depends on an open board question.
- **Staging note**: controllable server clock, browser time zone, injected function failure, admin SDK access.

**One behaviour per case.** A sentence case checks the words shown for one action code; a rule case checks one access decision; a filter case checks which entries come back. A case that needs an entry to exist names how it was written (Live or Seeded) and does not re-prove the writer.

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Treasurer** (`treasurer`) | Reads every entry; filters. Writes entries only indirectly, by acting through functions (settings, billing, approvals) |
| **Board** (`board`) | Reads every entry; sees "View only. Board members can't change records." |
| **Admin office** (`admin`) | Reads every entry (decision 2; whether payment entries too is a board question). Writes entries indirectly (households, invitations) |
| **Developer** (script) | Appears as actor of `role.set` and `privacy.published` |
| **Homeowner** | Never reads. Appears in entries as the **lot**, never by name (decision 4): `payment.submitted`, `invite.redeemed` |
| **Guard** | Never reads |

### Test fixtures (invented; QE maps them to `.env`)

| Fixture | Lot | Owner on file | Contact (staff-only) |
|---|---|---|---|
| **HH-5-1** "ZZ Test Household 5-1" | Blk 5 Lot 1 | ZZ Carlo Mendoza | zz.carlo@example.test · +63 917 000 0101 |
| **HH-4-12** "ZZ Test Household 4-12" | Blk 4 Lot 12 | ZZ Juan Dela Cruz | zz.juan@example.test · +63 917 000 0412 |
| **HH-9-3** "ZZ Test Household 9-3" | Blk 9 Lot 3 | ZZ Empty Lot | — (no entries ever) |
| **HH-8-2** "ZZ Test Household 8-2" | Blk 8 Lot 2 | ZZ Late Addition | — |

| Account | Who |
|---|---|
| S-TREAS | ZZ Carmela Cruz, `treasurer` (shown "Carmela Cruz (Treasurer)" in Gherkin) |
| S-TREAS-2 | ZZ Second Treasurer, `treasurer` |
| S-ADMIN | ZZ Paolo Aquino, `admin` ("Paolo Aquino (Admin office)") |
| S-BOARD | ZZ Board D1, `board` |
| S-GUARD | ZZ Guard G1, `guard` |
| U-CARLO | ZZ Carlo Mendoza, homeowner, member of HH-5-1 |
| U-MARIA | ZZ Maria Santos, homeowner, member of another lot |
| S-EXTREAS | ZZ Removed Treasurer: role removed, ID token still valid (L-004) |
| S-CLAIMONLY | Claim `treasurer` hand-set with no `staff/{uid}` document |

| Log set | Contents |
|---|---|
| **LOG-2300** | 2,300 seeded entries across Oct–Dec 2026 and every type; 14 about HH-5-1; 6 by S-ADMIN on Dec 3, 2026; none about HH-9-3 |
| **LOG-EDGE** | Entries at Nov 30, 2026 23:58 Manila, Dec 1, 2026 00:00:00 Manila, Dec 31, 2026 23:59:59 Manila, Jan 1, 2027 00:00:00 Manila; three entries with the same `at` to the millisecond placed across the 50th / 51st position |
| **LOG-UNKNOWN** | One entry with code `fund.closed` (not known to this screen version) between two known entries |
| **LOG-OLDSHAPE** | Entries in a pre-helper shape: `role.set` without `actorName`; `household.updated` without `type` or `targetType` |

Fixture names carry the ZZ prefix and are invented; the mobile numbers are in the reserved test range used across TC-03 and TC-04. "Today" is built from local Manila today; listed dates show the arithmetic, reproduced with a controllable server clock.

### Round-trip register

Functions write → staff read. One row per entry field.

| # | Field | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | `action` (code) | Each function, through the helper | The sentence built for the code; unknown code shown as "{actor} made a change ({code})" (treasurer, board, admin office) | A-block, J1 |
| 2 | `type` (filter group) | Helper, from the code | Type filter (All, Payments, Billing, Households, Invitations, Roles, Settings, Privacy) | E5, E6 |
| 3 | `targetType`, `targetId` | Helper | **Deliberately not shown** in R1 (kept for later per-record panels, Option B). Data check only | S3 |
| 4 | `actorUid` | Helper, from the caller | Person filter | E8, E9 |
| 5 | `actorName`, `actorRole` (staff and developer; copied at write time) | Helper | Sentence "Carmela Cruz (Treasurer) …", "Developer {name} …" | A1, J4, J5 |
| 6 | `actorName` null, `actorRole` homeowner | Helper, for homeowner actions | Sentence starts with the lot: "Blk 5 Lot 1 submitted …" | A20, H2 |
| 7 | `householdId` | Helper | Lot filter; "{lot} · {n} entries" | E1, E2 |
| 8 | `lotLabel` | Helper, copied at write time | The lot in the sentence | A-block, J6 |
| 9 | `before`, `after` (non-personal only) | Helper allow-list | Sentence "from ₱1,800.00 to ₱2,000.00"; contact edits name the field only | A13, H3 |
| 10 | `amountCentavos` | Helper | "₱1,800.00" in the sentence | A17, R2 |
| 11 | `count` | Helper (bulk) | "623 bills", "imported 623 households" | A9, A17 |
| 12 | `refLast4` | Payment functions | "(ref ending 9554)" | A20, H4 |
| 13 | `requestRef` | `setRole`, publish script | "(board request {ref})" | A1 |
| 14 | `at` (server time) | Helper | "Dec 3, 2026 · 9:14 AM" in Manila; date filters | G-block |

No read-back cell is empty.

### Write paths: who may write an entry (enumeration)

| Path | Expected |
|---|---|
| A callable, through the helper, inside the change's transaction | Allowed (the only path) (B1) |
| A callable writing `auditLog` directly, not through the helper | Not possible by construction; checked by code search in review (B6) |
| The helper given an unknown code | Refused, and the whole transaction fails (B3) |
| The helper given a known code with an unlisted field (e.g. `ownerName`, `contactMobile` value, `reason`) | Refused, transaction fails (B4) |
| Client create / update / delete, any role including treasurer | Refused (C-block) |
| A trigger | None in R1 (B7) |

---

## Test plan

### 1. Smoke

New staff page. **Smoke additions for QE:**

1. **"Activity log"** appears in the treasurer's and admin office's staff menu after Settings and opens with its heading, sub-heading and a first page of entries (or the empty-log line); no page error.
2. The board's Activity log opens with "View only. Board members can't change records." (where it appears in the board menu is Gap G-1).
3. Smoke's **homeowner and guard menus** must not show "Activity log" (add to the existing SMK-owner-nav and SMK-guard-nav assertions).

### 2. Acceptance

| REQ-006 scenario | Cases |
|---|---|
| An approval is recorded with person and time | A21, G1 |
| A change and its entry are saved together | B1, B2 |
| No one can edit or delete the log | C1–C6, Q9 |
| Filter by lot to settle a dispute | E1, E2 |
| Filter by type and date | E5, G4 |
| A long log loads in pages | F1, F2, F3 |
| Nothing matches the filters | K3 |
| The log does not show homeowners' personal data | H1, H4, S1 |
| A homeowner cannot read the log | D5, P4 |
| A board member reads but cannot change anything | D2, Q9, R4 |
| Times show in Manila time | G1, G2 |
| Filter by person for an audit | E8 |
| A homeowner's own action names the lot, not the person | A20, H2 |
| A contact change does not copy the number into the log | A6, H3 |
| An entry the screen doesn't recognise still shows | J1, J2 |
| The log fails to load | K4, K5 |

No acceptance criterion is without a case.

### 3. Regression

- **Every S1 function changes how it writes audit entries** (Sol Arch "Fit to S1"): `role.set` gains `actorName` and `requestRef`; REQ-003's contact edits drop the old and new numbers; all move onto the helper. Re-run TC-02-H3 (grant entry), TC-03's audit cases (add, edit, deactivate, reactivate, relot, import), TC-04-K6 and TC-04-S8 (invite and member entries). **Their expected entry shape changes**: QE should update those cases' assertions to the helper's fields, not run them unchanged.
- **The helper fails the whole transaction on a refused field.** A wrong allow-list breaks the function it belongs to (households, invites, roles, settings, billing). Every S1 and S2 callable's happy path is therefore a regression target: re-run each one's main write case once after the helper lands.
- **Rules change for `auditLog`**: read widens to the admin office (decision 2). TC-02's rules matrix has rows for treasurer (B29) and board (B32) reading `auditLog` but none for the admin office; add one (allowed). TC-02-B6 (homeowner refused), B17 (admin create refused), B39 (guard refused), B51 (claim without `staff` document refused) stay.
- **Staff dashboard "Recent activity" card**: the mock-up's free-text card (`index.html` line 734) must not survive into R1 reading the browser log; its R2 replacement (story 25) reads this log. Whether R1 shows anything there: Gap G-15.
- **Shared formatting** (`shared/domain/money.js`, `dates.js`): the log is another reader of peso and Manila-date formatting; a change there moves every screen.
- **Open defect DEF-001**: the phone layout of the log (filters collapsed behind "Filter").

**Existing specs and screens QE should re-run:** `smoke.spec.js` SMK-admin-nav, SMK-owner-nav, SMK-guard-nav; `navigation.spec.js` NAV-03 (one `aria-current`), NAV-06, NAV-07 / NAV-08 (DEF-001); TC-02 B6, B17, B29, B32, B39, B51 and H3; TC-03 audit cases; TC-04 K6, S8.

**Not affected:** homeowner and guard screens (beyond the menu check), statements, payments' own screens.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Entries can't be edited or deleted" (true for app users only; the developer's console is not covered); "{lot} · {n} entries" | C1–C6, E2, R3 |
| A value written for one role, never shown back | Yes: `targetType`/`targetId` (deliberately), `count`, `requestRef`, `refLast4` | Register rows 3, 11, 12, 13 |
| Status-gated rule checked for one transition only | Not status-gated; the write-path enumeration plays the same role | B-block, C-block |
| Same concept, different word on another screen | Yes: "Activity log" not "audit trail"; "Admin office"; lot, money and date formats | R1, R2 |
| Dates computed in UTC where the user means local | Yes: entry times and date-range filters at Manila midnight, month and year end | G-block |
| A derived figure doesn't refresh after a related write | Yes: the "{n} entries" count after a new entry; a page opened before a new entry | E3, F5 |
| Zero and "not set" look the same | Yes: empty log vs empty filter; `amountCentavos` 0 vs null | K1, K3, J7 |
| A write silently refused by security rules | Yes: every client write must fail explicitly | C-block |
| Double-tap / two devices create duplicates | Writers' concern (each writer's TC); here: one entry per change | S2 |
| Stale reference | Yes: an actor renamed or removed after writing; a lot relabelled | J4, J5, J6 |
| Backdrop click loses work or leaves stale state | Yes: the phone "Filter" panel | Q4 |
| A modal appearing mid-flow blocks the next action | Low: announcement pop-up over the log | P7 |
| Assumed SDK/network behaviour baked into a case | Yes: offline load | K5 |
| Data leaking across households or roles | Yes: personal data in a permanent log; homeowner and guard reads | H-block, D-block |

### Scenario list by mandatory type

- **Negative**: client writes by every role; reads by homeowner, guard, removed treasurer, claim without staff document, signed-out; helper given unknown codes and unlisted fields; filter combinations with no index; From after To. B3, B4, C-block, D5–D9, E12, E14.
- **Boundary**: 0, 1, 50, 51, 100 and 2,300 entries; equal timestamps across a page edge; Manila midnight, month end, year end; single-day range; lot with zero entries; ₱0.00 amounts. F-block, G-block, K1, K3, J7.
- **Usability**: one sentence per entry at 375 px, filters behind a button, labelled selects and dates, debounced lot search, "Show older entries" keeps focus, loading skeleton, errors keep filters, contrast. Q-block.
- **Navigation**: menu item per role, URL access for homeowner and guard, Back after filtering, refresh keeps or clears filters, aria-current. P-block.

---

## A. One sentence per action code

Each case: the entry is created as tagged, then the treasurer opens the Activity log. **Expected** is the sentence; date and time are checked in block G. **Don't assert** for every A case: position on the page beyond "newest first" where stated.

#### TC-06-A1: A role grant reads "Developer {name} made {staff} Treasurer (board request {ref})"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer reads; developer script writes. **Tags:** Live entry (`setRole`) · Provisional — design
- **Setup:** Run `setRole` granting S-TREAS-2 `treasurer`, request ref REF-TEST-001.
- **Expected:** "Developer {developer name} made ZZ Second Treasurer Treasurer (board request REF-TEST-001)".
- **Don't assert:** developer name value.

#### TC-06-A2: A role removal reads "…removed the Treasurer role from {staff}"
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer reads. **Tags:** Live entry (`setRole`)
- **Expected:** "Developer {name} removed the Treasurer role from ZZ Second Treasurer".
- **Don't assert:** —

#### TC-06-A3: Adding a household reads "{staff} added Blk 8 Lot 2"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office writes; Treasurer reads. **Tags:** Live entry (`createHousehold`)
- **Expected:** "ZZ Paolo Aquino (Admin office) added Blk 8 Lot 2".
- **Don't assert:** —

#### TC-06-A4: Importing households reads "{staff} imported {n} households"
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office writes. **Tags:** Live entry (`commitHouseholdImport`)
- **Setup:** Import a 3-row fixture file.
- **Expected:** "ZZ Paolo Aquino (Admin office) imported 3 households".
- **Don't assert:** —

#### TC-06-A5: Deactivating reads "{staff} deactivated Blk 7 Lot 1"
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office writes. **Tags:** Live entry
- **Expected:** "ZZ Paolo Aquino (Admin office) deactivated Blk 7 Lot 1".
- **Don't assert:** —

#### TC-06-A6: A contact mobile edit reads "{staff} changed the contact mobile of Blk 4 Lot 12"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office writes; Board reads. **Tags:** Live entry (`updateHousehold`)
- **Action:** S-ADMIN changes HH-4-12's contact mobile from +63 917 000 0412 to +63 917 000 0499.
- **Expected:** "ZZ Paolo Aquino (Admin office) changed the contact mobile of Blk 4 Lot 12". (The absence of the numbers is H3.)
- **Don't assert:** —

#### TC-06-A7: Reactivating, changing a lot and other household edits have a sentence
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office writes. **Tags:** Live entry · Gap G-2
- **Action:** Reactivate Blk 7 Lot 1; change HH-8-2's lot to Blk 8 Lot 3; change HH-4-12's owner name.
- **Expected:** Each shows a sentence naming the staff and the lot, never "made a change (…)". Wording for `household.reactivated`, `household.relotted` and an owner-name edit is not in the REQ: G-2.
- **Don't assert:** wording until G-2.

#### TC-06-A8: An invitation reads "{staff} invited Blk 2 Lot 7"
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office writes. **Tags:** Live entry (`createInvites`)
- **Expected:** "ZZ Paolo Aquino (Admin office) invited Blk 2 Lot 7".
- **Don't assert:** —

#### TC-06-A9: Printing slips reads "{staff} printed {n} invite slips"
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office writes. **Tags:** Live entry · Gap G-3
- **Action:** Print slips for 20 households.
- **Expected:** "ZZ Paolo Aquino (Admin office) printed 20 invite slips" as **one** entry, or 20 `invite.created` entries: which code and how many entries: G-3.
- **Don't assert:** entry count until G-3.

#### TC-06-A10: Replacing and cancelling an invitation have a sentence
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office writes. **Tags:** Live entry · Gap G-2
- **Action:** Resend an invitation (old one replaced); deactivate a household with an active invitation (cancelled).
- **Expected:** Each `invite.replaced` / `invite.cancelled` entry shows a sentence with staff and lot (or is shown only as the action that caused it). Wording: G-2.
- **Don't assert:** wording.

#### TC-06-A11: Removing a person reads "{staff} removed a person from Blk 2 Lot 7"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office writes. **Tags:** Live entry (`removeMember`)
- **Expected:** "ZZ Paolo Aquino (Admin office) removed a person from Blk 2 Lot 7"; the removed person's name is not in the sentence.
- **Don't assert:** —

#### TC-06-A12: A person linking reads "A person linked their account to Blk 2 Lot 7"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner redeems; Treasurer reads. **Tags:** Live entry (`redeemInvite`)
- **Expected:** "A person linked their account to Blk 2 Lot 7"; no name, no email.
- **Don't assert:** —

#### TC-06-A13: A dues change reads "{staff} changed monthly dues from ₱1,800.00 to ₱2,000.00"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer writes; Board reads. **Tags:** Live entry (`saveDuesSettings`)
- **Expected:** "ZZ Carmela Cruz (Treasurer) changed monthly dues from ₱1,800.00 to ₱2,000.00".
- **Don't assert:** —

#### TC-06-A14: A payee name change reads "{staff} changed the payee name", with or without values
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer writes. **Tags:** Live entry · Gap G-4
- **Action:** Change payee from "ZZ Greenfield Homes HOA" to "ZZ Greenfield Homes HOA Inc.".
- **Expected:** One entry starting "ZZ Carmela Cruz (Treasurer) changed the payee name". REQ-007 says "with the old and new value"; REQ-006's table shows no values: G-4.
- **Don't assert:** values until G-4.

#### TC-06-A15: Changes to the account label and payment instructions have a sentence
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer writes. **Tags:** Live entry · Gap G-5
- **Expected:** Each change shows a sentence naming the field. Whether the 500-character instructions are copied into `before`/`after` (free text in a permanent log): G-5.
- **Don't assert:** values.

#### TC-06-A16: Replacing the QR code reads "{staff} replaced the payment QR code"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer writes; Board reads. **Tags:** Live entry (`replacePaymentQr`)
- **Expected:** "ZZ Carmela Cruz (Treasurer) replaced the payment QR code".
- **Don't assert:** —

#### TC-06-A17: A billing run reads "{staff} generated December 2026 billing: 623 bills, ₱1,121,400.00"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer writes; Board reads. **Tags:** Live entry (billing worker, TC-08)
- **Expected:** Exactly that sentence, once per run.
- **Don't assert:** —

#### TC-06-A18: A late bill and a skip read as the REQ says
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer writes. **Tags:** Live entry (`billHousehold`, `skipLateBill`)
- **Expected:** "ZZ Carmela Cruz (Treasurer) billed Blk 8 Lot 2 for December 2026" and "ZZ Carmela Cruz (Treasurer) chose not to bill Blk 8 Lot 2 for December 2026".
- **Don't assert:** —

#### TC-06-A19: Loading opening balances and starting at zero have a sentence
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer writes. **Tags:** Live entry · Gap G-2
- **Expected:** "ZZ Carmela Cruz (Treasurer) loaded opening balances for 610 households" for `billing.opening`. `billing.startAtZero` has no sentence in the REQ: G-2 (must not fall back to "made a change").
- **Don't assert:** start-at-zero wording.

#### TC-06-A20: A homeowner's submission names the lot: "Blk 5 Lot 1 submitted ₱1,800.00 (ref ending 9554)"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO) writes; Treasurer reads. **Tags:** Live entry (REQ-010 submit function, S2)
- **Action:** U-CARLO submits ₱1,800.00 with reference "0012349554".
- **Expected:** "Blk 5 Lot 1 submitted ₱1,800.00 (ref ending 9554)".
- **Don't assert:** —

#### TC-06-A21: An approval reads "Carmela Cruz (Treasurer) approved ₱1,800.00 from Blk 5 Lot 1 (OR-00093)"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Board reads. **Tags:** Seeded entry until REQ-012 (S3) ships; then Live
- **Expected:** "ZZ Carmela Cruz (Treasurer) approved ₱1,800.00 from Blk 5 Lot 1 (OR-00093)" as the newest entry.
- **Don't assert:** OR number value (Live).

#### TC-06-A22: Rejections and voids have a sentence without their reason
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer reads. **Tags:** Seeded entry until REQ-012 / REQ-014 (S3)
- **Expected:** "…rejected ₱1,800.00 from Blk 5 Lot 1" and "…voided OR-00093"; no reason text.
- **Don't assert:** exact rejection wording (REQ-006 shows "rejected …").

#### TC-06-A23: A privacy notice publish reads "Developer published privacy notice version 2 (material change)"
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Board reads. **Tags:** Live entry (REQ-005 script, TC-05-H8)
- **Expected:** As stated; a minor correction has no "(material change)".
- **Don't assert:** —

#### TC-06-A24: The bill correction entry (REQ-046) is a placeholder
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer reads. **Tags:** Seeded entry · REQ-046 is a draft: not planned
- **Expected:** A seeded `bill.adjusted` entry reads "…corrected the December 2026 bill of Blk 5 Lot 1 by −₱200.00" (REQ-006 table). Final wording comes with REQ-046's test plan.
- **Don't assert:** anything beyond "a sentence, not the unknown-code fallback".

## B. Saved together; the shared helper

#### TC-06-B1: A change that fails part-way leaves no entry
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: injected failure after the audit write, inside the transaction · Provisional — design
- **Action:** Make `saveDuesSettings` fail after it has staged its `auditLog` write.
- **Expected:** `config/payment` unchanged and no `settings.changed` entry. (REQ-006's payment-approval example is re-run with REQ-012 in S3.)
- **Don't assert:** error message.

#### TC-06-B2: An entry the helper refuses stops the change it belongs to
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office. **Tags:** Staging note: helper configured to refuse the code · Provisional — design
- **Action:** `createHousehold` with the helper refusing `household.created`.
- **Expected:** No household created and no entry; the function returns an error.
- **Don't assert:** error text.

#### TC-06-B3: The helper refuses an unknown action code
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** none (helper unit). **Tags:** Provisional — design
- **Action:** Call the helper with `fund.closed`, an empty code and `PAYMENT.APPROVED`.
- **Expected:** Each refused; nothing returned for writing.
- **Don't assert:** error type.

#### TC-06-B4: The helper refuses a field not on its code's allow-list
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** none (helper unit). **Tags:** Provisional — design
- **Action:** `household.updated` with `before.contactMobile: "+63 917 000 0412"`; `payment.rejected` with `reason`; `payment.submitted` with `actorName: "ZZ Carlo Mendoza"`; `payment.submitted` with a full reference number.
- **Expected:** Each refused.
- **Don't assert:** —

#### TC-06-B5: The helper accepts every code each S1 and S2 function writes, with its listed fields
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** none (helper unit). **Tags:** Provisional — design
- **Action:** For each code in the write-path list (`role.set`, `household.*`, `import.completed`, `invite.*`, `member.removed`, `settings.changed`, `settings.qrReplaced`, `billing.run`, `billing.lateBill`, `billing.skip`, `billing.opening`, `billing.startAtZero`, `payment.submitted`, `privacy.published`), call the helper with the fields that function sends.
- **Expected:** Each accepted, with `type`, `targetType` and server `at` filled.
- **Don't assert:** field order.

#### TC-06-B6: No function writes `auditLog` except through the helper
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Code review check. **Tags:** —
- **Action:** Search `functions/src` for writes to the `auditLog` collection.
- **Expected:** Only `functions/src/audit/audit.js` references the collection for writing.
- **Don't assert:** —

#### TC-06-B7: No R1 entry is written by a trigger
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Code review check. **Tags:** —
- **Expected:** No Firestore-triggered function writes `auditLog`.
- **Don't assert:** —

#### TC-06-B8: An entry's time is the server's time
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer on a device with a wrong clock. **Tags:** —
- **Action:** Save a setting from a laptop set two days ahead.
- **Expected:** The entry shows today's Manila date and time.
- **Don't assert:** seconds.

## C. Nobody can change the log

#### TC-06-C1: The treasurer cannot create an entry from the browser
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct write. **Tags:** —
- **Action:** Create `auditLog/x` with a valid-looking entry.
- **Expected:** Refused explicitly; no document exists afterwards.
- **Don't assert:** —

#### TC-06-C2: The treasurer cannot update an entry
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct write. **Tags:** —
- **Action:** Change `amountCentavos` of an existing entry.
- **Expected:** Refused explicitly; entry re-read unchanged.
- **Don't assert:** —

#### TC-06-C3: The treasurer cannot delete an entry
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct write. **Tags:** —
- **Expected:** Refused explicitly; entry still exists.
- **Don't assert:** —

#### TC-06-C4: Board, admin office, guard and homeowner cannot create, update or delete an entry
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Board, Admin office, Guard, Homeowner (U-CARLO). **Tags:** —
- **Expected:** Every one of the 12 attempts refused explicitly; entries unchanged.
- **Don't assert:** —

#### TC-06-C5: A signed-out visitor cannot write or read the log
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Signed-out. **Tags:** —
- **Expected:** Create, update, delete, get and list all refused explicitly.
- **Don't assert:** —

#### TC-06-C6: A batch that hides an entry write among allowed writes is refused
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Action:** One batch: an allowed write (own `privacyAck`, TC-05) plus an `auditLog` create.
- **Expected:** The whole batch refused; neither write lands.
- **Don't assert:** —

## D. Who can read the log

#### TC-06-D1: The treasurer can list the log
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Query on `at` desc, limit 50, allowed.
- **Don't assert:** —

#### TC-06-D2: The board can list the log
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** —
- **Expected:** Allowed.
- **Don't assert:** —

#### TC-06-D3: The admin office can list the log
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Admin office. **Tags:** Blocked — board (whether payment entries are visible to the admin office; recommended all)
- **Expected:** Allowed, including payment entries (recommended answer).
- **Don't assert:** payment entries' visibility until the board answers.

#### TC-06-D4: The guard cannot read the log
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Guard. **Tags:** —
- **Expected:** Get and list refused explicitly.
- **Don't assert:** —

#### TC-06-D5: A homeowner cannot read any entry, including one about her own lot
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Action:** List with `householdId == HH-5-1`; get one HH-5-1 entry.
- **Expected:** Both refused explicitly.
- **Don't assert:** —

#### TC-06-D6: A removed treasurer whose token is still valid cannot read the log
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** S-EXTREAS. **Tags:** L-004
- **Expected:** Refused explicitly on the next request.
- **Don't assert:** —

#### TC-06-D7: A hand-set claim without a staff document cannot read the log
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** S-CLAIMONLY. **Tags:** —
- **Expected:** Refused explicitly.
- **Don't assert:** —

#### TC-06-D8: A staff document whose role differs from the claim is refused
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Claim `treasurer`, `staff/{uid}.role` = `guard`. **Tags:** —
- **Expected:** Refused explicitly.
- **Don't assert:** —

#### TC-06-D9: A no-role, no-household account cannot read the log
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Not-linked account. **Tags:** —
- **Expected:** Refused explicitly.
- **Don't assert:** —

## E. Filters

#### TC-06-E1: Filtering by lot shows only that lot's entries, newest first
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Seeded entry (LOG-2300)
- **Action:** Lot "Blk 5 Lot 1".
- **Expected:** Exactly the 14 HH-5-1 entries, in descending time; no entry about another lot.
- **Don't assert:** —

#### TC-06-E2: The lot filter summary reads "Blk 5 Lot 1 · 14 entries"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Seeded entry
- **Expected:** "Blk 5 Lot 1 · 14 entries".
- **Don't assert:** placement.

#### TC-06-E3: The entry count includes a new entry after reapplying the filter
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Live entry
- **Action:** With Blk 5 Lot 1 filtered, U-CARLO submits a payment; reapply the filter (or reload).
- **Expected:** "Blk 5 Lot 1 · 15 entries" and the new entry on top.
- **Don't assert:** live update without reapplying (not specified).

#### TC-06-E4: "1 entry" and "0 entries"
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Gap G-6
- **Expected:** A lot with one entry: "{lot} · 1 entry" (singular, recommended). Zero: the empty-filter line (K3). Singular form not in copy: G-6.
- **Don't assert:** singular wording until G-6.

#### TC-06-E5: Type "Settings" with Dec 1–Dec 31, 2026 shows only December's settings changes
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry
- **Expected:** Every row is a settings entry dated in December 2026 (Manila); none from November or January; none of another type.
- **Don't assert:** —

#### TC-06-E6: Each type option returns only its own entries
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry · Gap G-7
- **Action:** Pick each of Payments, Billing, Households, Invitations, Roles, Settings, Privacy.
- **Expected:** Each returns only codes of its group. Which group `member.removed`, `invite.redeemed`, `import.completed` and `billing.opening` belong to: G-7.
- **Don't assert:** groups of the codes named in G-7.

#### TC-06-E7: Lot and type together
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Seeded entry
- **Action:** Lot Blk 5 Lot 1, type Payments.
- **Expected:** Only Blk 5 Lot 1's payment entries; no index error.
- **Don't assert:** —

#### TC-06-E8: Person "Paolo Aquino" with Dec 3–Dec 3 shows his 6 entries, newest first
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Seeded entry
- **Expected:** Exactly the 6 entries by S-ADMIN on Dec 3, 2026 (Manila), newest first.
- **Don't assert:** —

#### TC-06-E9: The Person list offers staff and the developer, never homeowners
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Gap G-8
- **Expected:** Options are staff names with roles (and the developer); no homeowner name appears. Whether removed staff (no longer in `staff/{uid}`) can be picked, so their past actions can be audited: G-8.
- **Don't assert:** removed staff in the list until G-8.

#### TC-06-E10: Person with Type, and Person with Lot
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Gap G-9 · Provisional — design
- **Action:** Person Paolo + type Households; Person Paolo + lot Blk 4 Lot 12.
- **Expected:** Either correct results, or the screen prevents the combination with a reason. Never an unhandled "index required" error. The five indexes don't cover `actorUid` with `type` or `householdId`: G-9.
- **Don't assert:** which of the two until G-9.

#### TC-06-E11: The lot search offers matching lots as the person types, without reloading on each key
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer; Board. **Tags:** Gap G-10
- **Action:** Type "Blk 5 L".
- **Expected:** Matching lots offered after a short pause; the list isn't re-queried per keystroke. The board can't read `households` (REQ-003 default deny), so where the board's lot suggestions come from: G-10.
- **Don't assert:** debounce timing; the board's suggestions until G-10.

#### TC-06-E12: A date range with "From" after "To"
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-11
- **Action:** From Dec 31, To Dec 1.
- **Expected:** No crash and no misleading empty list; a message saying how to fix it (copy not in REQ: G-11).
- **Don't assert:** wording.

#### TC-06-E13: "Clear filters" returns to the full newest-first log
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** —
- **Expected:** All filters reset; the first 50 entries of the whole log show.
- **Don't assert:** —

#### TC-06-E14: Only "From" or only "To" set
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-11
- **Expected:** "From Dec 1" alone returns entries from Dec 1 onward; "To Nov 30" alone returns entries up to Nov 30 (recommended). G-11.
- **Don't assert:** until G-11.

## F. Pages

#### TC-06-F1: The first page shows 50 entries
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry (LOG-2300)
- **Expected:** Exactly 50 entries, newest first, and "Show older entries".
- **Don't assert:** —

#### TC-06-F2: "Show older entries" adds the next 50 below and keeps the first 50 in place
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry
- **Expected:** 100 entries; entries 1–50 unchanged in order and position; 51–100 are the next older ones.
- **Don't assert:** scroll position.

#### TC-06-F3: Paging to the end shows every entry exactly once
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry (LOG-2300, LOG-EDGE)
- **Action:** Press "Show older entries" until it disappears.
- **Expected:** 2,300 + LOG-EDGE entries, each once; the three entries with equal timestamps each appear once although they straddle the page edge; the button disappears on the last page.
- **Don't assert:** —

#### TC-06-F4: Exactly 50, 51 and 0 entries
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry
- **Expected:** 50 entries: no "Show older entries" (or one that loads nothing and then disappears; recommended none). 51: the button shows and loads 1. 0: the empty-log line (K1).
- **Don't assert:** the 50 case's button until confirmed with Dev (one extra read).

#### TC-06-F5: A new entry written while reading doesn't duplicate or drop older entries
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer reads; Admin office writes. **Tags:** Live entry
- **Action:** Open page 1; S-ADMIN adds a household; press "Show older entries".
- **Expected:** Page 2 starts with the entry after the last one on page 1; no entry repeated or skipped.
- **Don't assert:** whether the new entry appears at the top without reload.

#### TC-06-F6: "Show older entries" reads "Loading…" and is disabled while in flight
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: slowed network
- **Expected:** "Loading…", disabled; a second tap loads one page, not two.
- **Don't assert:** —

#### TC-06-F7: Paging keeps the filters
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Seeded entry
- **Action:** Type Billing (60+ seeded entries); "Show older entries".
- **Expected:** Every loaded entry is still Billing.
- **Don't assert:** —

## G. Manila time

#### TC-06-G1: An entry written at 9:14 AM Manila shows "Dec 3, 2026 · 9:14 AM"
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Board. **Tags:** Staging note: controllable server clock
- **Expected:** "Dec 3, 2026 · 9:14 AM".
- **Don't assert:** —

#### TC-06-G2: An entry at 11:58 PM Manila on Nov 30 shows that date on a laptop in another zone
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, browser zone America/Los_Angeles and UTC. **Tags:** Seeded entry (LOG-EDGE)
- **Expected:** "Nov 30, 2026 · 11:58 PM" in both.
- **Don't assert:** —

#### TC-06-G3: 12:00 AM and 12:xx PM show correctly
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry
- **Expected:** An entry at 00:00 Manila shows "12:00 AM"; at 12:30 Manila "12:30 PM".
- **Don't assert:** —

#### TC-06-G4: A December range includes Dec 1 00:00:00 and Dec 31 23:59:59 Manila, and nothing either side
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, browser zone UTC. **Tags:** Seeded entry (LOG-EDGE)
- **Action:** From Dec 1 to Dec 31, 2026.
- **Expected:** Includes the Dec 1 00:00:00 and Dec 31 23:59:59 entries; excludes Nov 30 23:58 and Jan 1, 2027 00:00:00.
- **Don't assert:** —

#### TC-06-G5: A single-day range includes the whole Manila day
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Seeded entry
- **Action:** Dec 3 to Dec 3.
- **Expected:** Entries from 00:00:00 to 23:59:59 Dec 3 Manila; none from Dec 2 16:00–23:59 UTC wrongly excluded or Dec 3 16:00+ UTC wrongly included.
- **Don't assert:** —

#### TC-06-G6: A range across year end
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry
- **Action:** Dec 31, 2026 to Jan 1, 2027.
- **Expected:** Both days' entries, newest (January) first.
- **Don't assert:** —

## H. No personal data in the log

#### TC-06-H1: An entry about Blk 5 Lot 1 shows the lot and never the owner's name, email or mobile
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Live entries from blocks A
- **Expected:** Every Blk 5 Lot 1 entry's text contains "Blk 5 Lot 1" and none of "ZZ Carlo Mendoza", "zz.carlo@example.test", "+63 917 000 0101".
- **Don't assert:** —

#### TC-06-H2: The homeowner's own action stores no name
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check after A20. **Tags:** Provisional — design
- **Expected:** The `payment.submitted` entry has `actorName` null and `actorRole` homeowner; no field holds the payer's name or email.
- **Don't assert:** —

#### TC-06-H3: A contact edit stores the field name and neither number
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check after A6. **Tags:** Provisional — design
- **Expected:** `before`/`after` hold `{field: 'contactMobile'}` only; no field of the entry holds "+63 917 000 0412", "+63 917 000 0499" or any part of them.
- **Don't assert:** —

#### TC-06-H4: A payment entry stores and shows only the last 4 digits of the reference
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check after A20; Treasurer reads. **Tags:** —
- **Expected:** `refLast4` = "9554"; the full reference "0012349554" appears in no field and on no screen of the log.
- **Don't assert:** —

#### TC-06-H5: A rejection or void reason is not copied into the log
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** Seeded entry until S3 (then Live)
- **Expected:** No `reason` or note field; the sentence has no reason text.
- **Don't assert:** —

#### TC-06-H6: An owner-name edit doesn't copy the old or new name
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office edits HH-4-12's owner name; data check. **Tags:** Gap G-2
- **Expected:** `before`/`after` hold the field name only; neither "ZZ Juan Dela Cruz" nor the new name appears in the entry (homeowner names are personal, decision 4).
- **Don't assert:** sentence wording (G-2).

#### TC-06-H7: A removed person's name is not in the removal entry
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check after A11. **Tags:** —
- **Expected:** No field holds the removed person's name or email (uid only, if any).
- **Don't assert:** —

## J. Unknown codes, old shapes, stale names

#### TC-06-J1: An entry with an unknown code reads "{actor} made a change ({code})"
**Priority** P1 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry (LOG-UNKNOWN)
- **Expected:** "ZZ Carmela Cruz (Treasurer) made a change (fund.closed)" with its date and time.
- **Don't assert:** —

#### TC-06-J2: An unknown code doesn't stop the other entries showing
**Priority** P1 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry
- **Expected:** The entries before and after it render normally; no console error stops rendering.
- **Don't assert:** —

#### TC-06-J3: An entry in the pre-helper shape still shows
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry (LOG-OLDSHAPE) · Gap G-12
- **Expected:** A `role.set` without `actorName` and a `household.updated` without `type` render a sentence or the fallback, never a blank row or "undefined". Whether S1 ships entries in the old shape before S2 (and whether any of them hold contact numbers that must be cleaned): G-12.
- **Don't assert:** wording.

#### TC-06-J4: A staff member's later rename doesn't rewrite old entries
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Live entry
- **Action:** S-ADMIN writes an entry; his `staff` display name is changed by `setRole`; he writes another.
- **Expected:** The first shows the old name, the second the new.
- **Don't assert:** —

#### TC-06-J5: A staff member's later role change doesn't rewrite old entries
**Priority** P3 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Live entry
- **Expected:** Entries written as "(Admin office)" stay "(Admin office)" after the person becomes treasurer.
- **Don't assert:** —

#### TC-06-J6: A relabelled lot's old entries keep the old label and still filter under the household
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Board. **Tags:** Live entry · Gap G-13
- **Action:** Entries for Blk 8 Lot 2; relot it to Blk 8 Lot 3 (REQ-003 decision 3); filter by "Blk 8 Lot 3".
- **Expected:** Filtering by the household returns old and new entries (same `householdId`). Old entries show "Blk 8 Lot 2" (copied at write time). Whether the summary and the search find it under either label: G-13.
- **Don't assert:** search under the old label.

#### TC-06-J7: An amount of ₱0.00 shows as ₱0.00, and a null amount shows no amount
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Seeded entry
- **Expected:** `amountCentavos: 0` → "₱0.00" in the sentence; `null` → no peso figure and never "₱NaN" or "₱0.00".
- **Don't assert:** —

## K. States

#### TC-06-K1: An empty log reads "No activity yet. Changes to money and records will appear here."
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer on an empty emulator. **Tags:** —
- **Expected:** That line; filters present; no "Show older entries".
- **Don't assert:** —

#### TC-06-K2: Loading shows skeleton rows
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: slowed network
- **Expected:** Skeleton rows, not the empty-log line, while loading.
- **Don't assert:** —

#### TC-06-K3: A lot with no entries reads "No activity for Blk 9 Lot 3 in this period." with "Clear filters"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Seeded entry
- **Expected:** That line and a "Clear filters" control that works.
- **Don't assert:** —

#### TC-06-K4: A load failure shows the error with "Try again"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: block the query
- **Expected:** "We couldn't load the activity log. Check your connection and try again." with "Try again".
- **Don't assert:** —

#### TC-06-K5: The filters picked are kept after a load failure and "Try again"
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Assumption: the failure is produced by blocking the network, not by Firestore's offline cache
- **Action:** Pick lot Blk 5 Lot 1 and type Payments; fail the load; unblock; "Try again".
- **Expected:** Both filters still set; results are the filtered ones.
- **Don't assert:** —

#### TC-06-K6: Empty results for a type or person filter without a lot
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Gap G-6
- **Action:** Type Privacy with a range that has none; Person with no entries.
- **Expected:** An empty-filter line that makes sense without a lot ("No activity for {lot}…" has no lot to name): G-6.
- **Don't assert:** wording.

## P. Navigation

#### TC-06-P1: "Activity log" sits after Settings in the treasurer's and admin office's menu
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, Admin office. **Tags:** —
- **Expected:** Menu item present, after Settings; selecting it highlights it (one `aria-current`, NAV-03).
- **Don't assert:** —

#### TC-06-P2: The board can reach the Activity log
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Gap G-1
- **Expected:** The board has a menu path to the log. REQ-002's R1 board menu is "Dashboard" only and has no Settings to sit after: G-1.
- **Don't assert:** placement until G-1.

#### TC-06-P3: Homeowner and guard menus don't show "Activity log"
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, Guard. **Tags:** —
- **Expected:** Absent from both menus, at desktop width and in the phone drawer.
- **Don't assert:** —

#### TC-06-P4: A homeowner opening the log's address sees the no-access page
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA). **Tags:** —
- **Expected:** "You don't have access to this page" with "Go to my dashboard"; no entry rendered first.
- **Don't assert:** —

#### TC-06-P5: A guard opening the log's address sees the no-access page
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Guard. **Tags:** —
- **Expected:** As P4.
- **Don't assert:** —

#### TC-06-P6: Reloading the log with filters set
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-14
- **Action:** Set filters; reload; press Back.
- **Expected:** The page reloads without error. Whether filters survive a reload or live in the address: G-14. No household id or lot appears in a server-logged URL beyond what REQ-001's deep-link rule allows.
- **Don't assert:** filter persistence until G-14.

#### TC-06-P7: An important announcement pop-up doesn't block the log
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Depends on REQ-017 (S3)
- **Expected:** After dismissing the pop-up, the log and filters work; no focus trapped behind it.
- **Don't assert:** —

## Q. Usability and accessibility (WCAG 2.2 AA, 375 px)

#### TC-06-Q1: At 375 px each entry is one readable sentence with no table or horizontal scroll
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Board on a phone. **Tags:** DEF-001
- **Expected:** Entries wrap; date and time visible as text; no horizontal scroll.
- **Don't assert:** line breaks.

#### TC-06-Q2: On a phone the filters collapse behind a "Filter" button that opens a panel
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Board on a phone. **Tags:** DEF-001
- **Expected:** "Filter" button; panel holds Type, Lot, Person, From, To, Clear filters.
- **Don't assert:** panel style.

#### TC-06-Q3: Every filter has a visible label
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, screen reader. **Tags:** —
- **Expected:** Type, Lot, Person, From, To are labelled controls (select, search box, date inputs).
- **Don't assert:** —

#### TC-06-Q4: Closing the phone filter panel by backdrop or Escape
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Board on a phone. **Tags:** —
- **Action:** Change two filters in the panel; dismiss by backdrop; reopen.
- **Expected:** The list and the panel agree: either both show the new filters or both the old ones; never a list filtered differently from what the panel shows.
- **Don't assert:** which.

#### TC-06-Q5: After "Show older entries", focus is on the first new entry
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, keyboard. **Tags:** —
- **Expected:** Focus moves to entry 51.
- **Don't assert:** —

#### TC-06-Q6: Keyboard alone can filter, page and clear
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, keyboard. **Tags:** —
- **Expected:** Every filter, lot suggestion, "Show older entries", "Clear filters" and "Try again" reachable and operable by keyboard, with visible focus.
- **Don't assert:** —

#### TC-06-Q7: The error and empty states are announced
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, screen reader. **Tags:** —
- **Expected:** Error, empty-filter and filter summary changes are in a polite live region.
- **Don't assert:** —

#### TC-06-Q8: Contrast is at least 4.5:1
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** —
- **Expected:** Entry text, date and time, board note and filter labels meet 4.5:1.
- **Don't assert:** —

#### TC-06-Q9: No entry has an edit or delete control, for any role
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, Board, Admin office. **Tags:** —
- **Expected:** No edit, delete, select-all or bulk-action control on the page.
- **Don't assert:** —

## R. Copy consistency

#### TC-06-R1: "Activity log" everywhere, never "audit trail"
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Menu item and heading "Activity log"; sub-heading "Every change to money and records, with who made it and when. Entries can't be edited or deleted."
- **Don't assert:** —

#### TC-06-R2: Lot, money, date and staff formats match the rest of the app
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "Blk 5 Lot 1", "₱1,800.00", "₱1,121,400.00", "Dec 3, 2026", "9:14 AM", "Name (Role)" with role words Treasurer, Admin office, Board; developer entries read "Developer {name}".
- **Don't assert:** —

#### TC-06-R3: The sub-heading's "can't be edited or deleted" is true for every app role
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** The C-block passes for every role. The developer's console access is outside the promise (REQ-006 "What nobody can edit means"); no case asserts console edits are impossible.
- **Don't assert:** console behaviour.

#### TC-06-R4: The board sees "View only. Board members can't change records."
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** —
- **Expected:** The note shows for the board; not for the treasurer or admin office.
- **Don't assert:** —

## S. Data integrity

#### TC-06-S1: No entry written in the S1 and S2 runs holds a fixture homeowner's name, email or phone
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Data check over all `auditLog` documents after the TC-03, TC-04, TC-07, TC-08 and this TC's runs. **Tags:** —
- **Expected:** No field value contains any fixture homeowner name, `@example.test` homeowner email or fixture mobile number.
- **Lane:** exclusive — asserts every `auditLog` document in the environment.

#### TC-06-S2: Each change writes exactly one entry
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Live entry
- **Action:** One dues change; one QR replace; one billing run.
- **Expected:** Exactly one entry each (the billing run is one `billing.run`, not one per bill).
- **Don't assert:** —

#### TC-06-S3: Every entry carries `type`, `targetType`, `actorRole` and `at`
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Data check. **Tags:** Provisional — design
- **Expected:** Every entry written by S2 code has the four fields; `targetType` is one of payment, bill, household, settings, invite, role, privacy.
- **Don't assert:** —

#### TC-06-S4: A page read costs about 50 document reads
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: read counter
- **Expected:** Opening the log reads about 50 entries plus the count; "Show older entries" about 50 more; the lot summary is a `count()` aggregation, not a full read.
- **Don't assert:** exact counts.

## X. Exploratory charters

#### TC-06-X1: 20 minutes settling a dispute from the log on a phone
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
**Role:** Board at 375 px. **Tags:** —
- **Charter:** "I paid in October and you never recorded it": find everything about one lot, one person, one month; try every filter combination, page deep, rotate the phone. Note anything slow, wrong or confusing. Time-box 20 min.

#### TC-06-X2: 15 minutes looking for personal data in entries
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office and treasurer making many edits; then reading raw `auditLog` documents. **Tags:** Staging note: admin SDK read
- **Charter:** Edit names, contacts, payee, instructions with personal-looking text; remove people; submit payments. Read every entry's raw fields. Time-box 15 min.

---

## Cases that hinge on open decisions

| Open item | Who decides | Cases |
|---|---|---|
| Admin office sees payment entries (recommended: all) | HOA board | D3 |
| Retention period (decision 3: never deleted until set) | Treasurer and DPO | None (nothing deletes entries in R1) |
| Cloud Audit Logs Data Access logging | Owner, later | None (R3: console edits outside the promise) |
| S3 writers (`payment.approved`, `rejected`, `voided`) | Already approved in S3 | A21, A22, H5 (Seeded until S3 ships) |
| REQ-046 `bill.adjusted` | REQ-046 is a draft | A24 (placeholder) |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | One sentence per action code | 24 | 6 |
| B | Saved together; shared helper | 8 | 5 |
| C | Nobody can change the log | 6 | 5 |
| D | Who can read the log | 9 | 6 |
| E | Filters | 14 | 4 |
| F | Pages | 7 | 2 |
| G | Manila time | 6 | 3 |
| H | No personal data | 7 | 5 |
| J | Unknown codes, old shapes, stale names | 7 | 2 |
| K | States | 6 | 3 |
| P | Navigation | 7 | 3 |
| Q | Usability, WCAG 2.2 AA, 375 px | 9 | 2 |
| R | Copy consistency | 4 | 0 |
| S | Data integrity | 4 | 1 |
| X | Exploratory charters | 2 | 0 |
| **Total** | | **120** | **47** |

By stated type: integration (sentence per code) 26 · security / role 25 · boundary 11 · happy path 10 · negative 5 · navigation 7 · usability, UI/UX and responsive 19 · data integrity 8 · back-compat 3 · stale reference / concurrency 4 · exploratory 2.

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | The board's R1 menu (REQ-002) is "Dashboard" only, and "Activity log" is placed "after Settings", which the board doesn't have. Where does the board open it? | P2, smoke 2 |
| G-2 | No sentence for several codes the S1 and S2 functions write: `household.reactivated`, `household.relotted`, an owner-name edit, `invite.replaced`, `invite.cancelled`, `billing.startAtZero`. Without one they fall back to "made a change ({code})" | A7, A10, A19, H6 |
| G-3 | "printed 20 invite slips": which code, and is it one entry with a count or one `invite.created` per household? | A9 |
| G-4 | REQ-007 says a payee change is logged "with the old and new value"; REQ-006's sentence is "changed the payee name" with no values | A14 |
| G-5 | Payment instructions (up to 500 characters of free text) in `before`/`after`: REQ-006 says "no free text" in entries. Store the values, or the field name only? | A15 |
| G-6 | Copy for "1 entry" (singular), and for an empty result when the filter is a type, person or date without a lot ("No activity for {lot}…" has no lot) | E4, K6 |
| G-7 | Type group for `member.removed`, `invite.redeemed`, `import.completed`, `billing.opening`, `billing.startAtZero` | E6 |
| G-8 | Person filter options: from `staff/{uid}`? Removed staff no longer have that document, so their past actions can't be picked for an audit. Is the developer an option? | E9 |
| G-9 | The five indexes don't cover Person with Type, Person with Lot, or all three. Should the screen disallow those combinations (with what copy), or should indexes be added? | E10 |
| G-10 | The lot filter "offers matching lots", but the board can't read `households` (REQ-003 default deny). Where do the board's suggestions come from, and is a typed lot without a suggestion accepted? | E11 |
| G-11 | Date range rules: "From" after "To" (copy), only one end set, a future date | E12, E14 |
| G-12 | If S1 ships before the helper, S1 entries exist in the old shape (possibly with contact numbers in `before`/`after`). Is there a migration or clean-up, and must the screen render the old shape? | J3 |
| G-13 | A relotted household's filter and search under the old and new labels; the summary label | J6 |
| G-14 | Do filters survive a reload, or live in the address (and if in the address, does a lot id in a URL conflict with SA-001 §8.2 "not in URLs")? | P6 |
| G-15 | The mock-up's staff dashboard "Recent activity" card reads the browser's free-text log. In R1, is the card removed, or does it read this log ahead of story 25? | Regression |
| G-16 | Does the list update live when a new entry is written while it is open, or only on reload? | E3, F5 |

**No new failure pattern** beyond the owner's table was found.
