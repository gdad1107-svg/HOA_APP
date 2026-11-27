# TC-03 — Household directory: add, edit and import (v1)

| Field | Value |
|---|---|
| Enhancement / fix | Enhancement: household directory with CSV import (preview, then commit), add and edit forms, deactivate and reactivate, indexed search, phone cards |
| Source | [REQ-003 Household directory: add, edit and import](../requirements/REQ-003-household-directory.md), r3, **approved** by the owner 2026-11-28. Approved UX option: **Option A, CSV only in R1** |
| Depends on | REQ-002 (roles; who may read households and contacts). Precedent read: REQ-001 (sign-in, "not linked" screen), REQ-004 (invitations read `displayName`, `contactEmail`, `active`; write `linkStatus`, `memberCount`) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open): no viewport meta, so the phone layout never applies on a real phone. Folded into block K (responsive). No other defects exist |
| App version | **anticipated** (the app is still the browser-only mock-up; `aHo()` at `index.html` line 758 has no add, edit or import) |
| Source files / functions touched | **Anticipated, provisional (SA-001 Draft)**: callables `previewHouseholdImport`, `commitHouseholdImport`, `createHousehold`, `updateHousehold` (with `seenUpdatedAt`), `setHouseholdActive` (SA-001 §3); collections `households`, `lots/{lotKey}`, `householdContacts/{householdId}`, `importRuns/{importId}`, `auditLog` (§4.2); Firestore rules helpers `isStaff()`, `hasRole()`, `isMember()` (§8.1); indexes `households (active, block, lot)` and `(active, searchTokens array-contains, lotKey)`; web module `web/src/features/households/` and shared `web/src/ui/modal.js`, `table.js` (§9) |
| Environment | **Emulator Suite or the test project `hoa-portal-staging` only** (SA-001 §10, ADR-005, provisional). Never a `-prod` project. Invented data only; staging mail allow-list applies to any invitation a case triggers |
| Author / date | QA, 2026-11-28 |
| Status | Draft v1, for owner approval. Not ready for QE until approved. v1 r2: cases split by behaviour for layer push-down |

> **Provisional (SA-001 Draft).** SA-001 and its ADRs are still Draft on branch
> `docs/sa-001-architecture`. Every statement below that names a collection, field,
> function, index or rules helper is marked **(prov.)** and may change when SA-001 is
> finalised. The behaviour each case asserts comes from REQ-003, which is approved.
>
> **Lot key format is not settled** (REQ-003 owner decision 2: do block numbers repeat
> across phases?). Cases speak of "the lot key" and the label "Blk 4 Lot 12", never the
> literal key string (`B04-L12` or `P1-B04-L12`).

## Roles and what crosses between them

| Role | Fixture user | What they do here |
|---|---|---|
| Admin office staff (`admin`) | ZZ Test Admin 1, ZZ Test Admin 2 | Import, add, edit, deactivate, reactivate, search; read contacts |
| Treasurer (`treasurer`) | ZZ Test Treasurer | Same as admin for households (REQ-003 "office and the treasurer"); reads the activity log record |
| Treasurer who is also a homeowner | ZZ Test Treasurer-Homeowner (treasurer + member of ZZ Test Household E) | Role switch: staff view vs "My household" (REQ-002) |
| Board (`board`) | ZZ Test Board Member | Refused the directory (REQ-003); reads the activity log record (REQ-003 data table) |
| Guard (`guard`) | ZZ Test Guard | Refused households and contacts (REQ-002) |
| Homeowner | ZZ Test Homeowner A (member of Household A), ZZ Test Homeowner B (member of Household B) | Reads own `households/{id}` only (prov.); never contacts |
| Signed in, no role, no household | ZZ Test No-Role User | REQ-001 "not linked" screen; refused everything here |
| Removed admin with a stale token | ZZ Test Removed Admin | Admin role removed after sign-in; still holds an ID token with `role: admin` (REQ-002 "at once") |

### Round-trip register

One row per field or status value that this REQ writes. Staff write; every role that
reads it is listed. "Deliberately not shown" is the stated rule, not a gap.

| # | Field / status | Written where, by whom | Read back where, by whom |
|---|---|---|---|
| R1 | Block, lot, lot label ("Blk 4 Lot 12") | Import commit, Add household form; Admin, Treasurer. `households/{id}.block`, `.lot`, `.lotLabel` (prov.) | Directory row and phone card, household edit form, duplicate message, preview table: Admin, Treasurer. REQ-004 join screen "You're joining Blk 4 Lot 12" and invite slip: invitee / Admin. Own household pages: Homeowner of that household (prov.: SA-001 "every member reads `households/{id}`"). **Deliberately not shown** to Guard (REQ-002) and Board (REQ-003) |
| R2 | Lot key | Import commit, Add household; written by functions into `lots/{lotKey}` and `households/{id}.lotKey` (prov.) | Never displayed. Read back as behaviour: "{lot} is already in the directory." under Lot (Admin, Treasurer); "Already in the directory, skipped" in the preview (Admin, Treasurer). **Deliberately not shown** to every other role |
| R3 | Phase | Import (Phase column), Add / Edit form ("Not set", Phase 1–4); Admin, Treasurer | Household edit form: Admin, Treasurer. **Deliberately not shown** in the R1 directory list (mock-up 3A has no phase column), to Homeowner, Guard, Board. Future reader: board financial report groups by phase (EPIC-012) |
| R4 | Owner display name | Import, Add, Edit; Admin, Treasurer. `households/{id}.displayName` (prov.) | Directory row/card, search results, edit form: Admin, Treasurer. REQ-004 join confirm screen ("owner name on file"): invitee. Own household pages: Homeowner (prov.). Future: notice letters (CN). **Deliberately not shown** to Guard, Board |
| R5 | Search words | Functions, derived from the display name on every create and edit. `households/{id}.searchTokens` (prov.) | Never displayed. Read back as the result set of "Search name or lot": Admin, Treasurer. Must refresh after a name edit (G-block) |
| R6 | Contact email | Import, Add, Edit; Admin, Treasurer. **`householdContacts/{id}.contactEmail` only** (prov.) | Directory Contact column, edit form: Admin, Treasurer. REQ-004: the address the invitation is sent to; bulk-invite "{m} households have no email". **Deliberately not shown** to Homeowner (not even their own household's, so a new owner never sees the previous owner's), Guard, Board |
| R7 | Contact mobile | Import, Add, Edit; Admin, Treasurer. Accepts `9XXXXXXXXX`, `09XXXXXXXXX`, `639XXXXXXXXX`, `+639XXXXXXXXX`; stored `+639…`, shown "0900 000 0001" style (Sol Arch review). `householdContacts/{id}.contactMobile` (prov.) | Directory Contact column, edit form: Admin, Treasurer, shown in display format. **Deliberately not shown** to Homeowner, Board, Guard (whether a guard sees a number on a pass is the R4 gate REQ's decision, REQ-002) |
| R8 | Active / inactive | Deactivate (confirm), Reactivate; Admin, Treasurer. `households/{id}.active` (prov.) | Default list hides it; "Inactive" filter shows it: Admin, Treasurer. REQ-004 code redemption: invitee sees "This invitation is no longer valid. Ask the admin office." Future: billing skips it (billing REQ). What a linked member of an inactive household sees: **deliberately not defined in R1** (REQ-003 out of scope; REQ-004 recommends read-only) |
| R9 | Link status "Not invited" (initial value) and member count 0 | Set on create by import commit and Add household; later values kept by REQ-004 functions (prov.) | Directory pill and filter chips ("Not invited (n)"): Admin, Treasurer. **Deliberately not shown** to Homeowner, Guard, Board |
| R10 | Balance placeholder "—" | Not written by REQ-003 (no balance before the first billing run) | Directory card and row: Admin, Treasurer. Homeowner balance belongs to the billing REQ |
| R11 | Import run: status, counts, rejected rows | `previewHouseholdImport`, `commitHouseholdImport` started by Admin or Treasurer. `importRuns/{importId}` (prov.) | Preview screen (step 2), finished banner, "Download them" rejected-rows file: the staff member who ran it. Whether another staff member can see that run: **gap Q12**. **Deliberately not shown** to Board, Guard, Homeowner |
| R12 | Change record (add, edit, deactivate, reactivate, import completed with counts) | Functions only. `auditLog` (prov.), ids only | Activity log: Treasurer, Board (REQ-003 data table). **The activity log screen is backlog story 06, not built in R1**, so in R1 no screen reads it; QE reads the record in the test project (gap Q15). **Deliberately not shown** to Admin (per REQ-003 "Read by: Board, treasurer"; gap Q15), Guard, Homeowner |
| R13 | Last-changed time (`updatedAt`) | Functions on every edit (prov.) | Not displayed. Read back by the edit form as `seenUpdatedAt` for the stale-edit check: Admin, Treasurer |

No read-back cell is empty.

### Status enumeration

**S1. `active` (rule: Deactivate only an active household; Reactivate only an inactive one).**

| Prior value | Deactivate | Reactivate | Copy cross-check | Cases |
|---|---|---|---|---|
| Active | Allowed after confirm; hidden from default list, listed under Inactive, records kept | Not offered; a direct call is refused or is a no-op (assumption — pending BA, Q9) | Confirm promises: "won't be billed" (not verifiable in R1, billing REQ), "won't be shown in the list" (H16), "unused invitation stops working" (H4), "records are kept" (H3) | H1–H5, H9, H15–H17 |
| Inactive | Not offered; a direct call is refused or is a no-op (assumption — pending BA, Q9) | Allowed; back in the default list | "Reactivate" restores the list entry; does not resurrect a cancelled invitation (assumption — pending BA, Q10) | H6–H8, H10, H18 |

**S2. Link status at the moment of Deactivate** (every value `linkStatus` can hold, REQ-003 copy of record).

| Prior link status | Expected on Deactivate | Case |
|---|---|---|
| Not invited | Deactivated; no invitation exists, nothing else changes | H11 |
| Invited (unused invitation) | Deactivated; the invitation stops working (REQ-004 refusal copy) | H4 |
| Invite expired | Deactivated; the expired code still refused, now as "no longer valid" | H12 |
| Email failed | Deactivated; "Resend" / "Print slip" no longer produce a working code for it (assumption — pending BA, Q11) | H13 |
| Linked | Deactivated; members unaffected by REQ-003 (their access is out of scope, REQ-004) | H14 |

**S3. Import run status (rule: commit refuses unless the run is `previewed` and belongs to the caller; SA review, prov.).**

| Prior run state | Commit by the run's owner | Commit by another staff member | Case |
|---|---|---|---|
| (no run / unknown id) | Refused | Refused | D11 |
| Previewed | Allowed; run moves to running | Refused | D1, D10 |
| Running (second press, second tab) | Refused, no extra rows | Refused | D2, D3 |
| Completed | Refused; directory unchanged | Refused | D12 |
| Interrupted part-way (still running, process died) | Rerun continues and skips written lots (SA review), which contradicts "refuses unless previewed": **gap Q6**, assumption — pending BA | — | D7 |

**S4. Edit freshness (rule: an edit carries the time the record was loaded).**

| Record changed since load? | Expected | Case |
|---|---|---|
| No | Saved | G1 |
| Yes, edited by someone else | Refused with the stale-edit copy; first change kept | G6, G7 |
| Yes, deactivated by someone else | Refused with the stale-edit copy (assumption — pending BA, Q9) | G9 |
| Yes, edited by the same admin in another tab | Refused with the stale-edit copy | G8 |

## Test plan — three lenses

### 1. Smoke

The standing smoke pass (`smoke.spec.js` SMK-admin-homeowners) only checks that the
mock-up's Homeowners heading loads. This change adds role-visible areas it does not cover.
**New for QE's smoke scope:**

1. **Homeowners directory (real data)** for Admin **and Treasurer**: heading "Homeowners · {n} households", buttons Import households / Add household, search box, filter chips, empty state when there are no households.
2. **Import households page**: step 1 (Download template, file input with label), step 2 preview, step 3 finished banner.
3. **Add household dialog** opens and closes with Cancel.
4. **Edit household dialog** for one fixture household (where it is opened from is not mocked: gap Q16).
5. **Inactive filter** lists inactive households.
6. **Board, Guard and Homeowner** do not have Homeowners in the menu (overlaps TC-02; QE de-duplicates).

### 2. Acceptance mapping (REQ-003 Gherkin → cases)

| # | Gherkin scenario | Cases |
|---|---|---|
| 1 | Import the household list | A1, A2, A3, A4, K19, K20, K22 |
| 2 | Rows with problems are shown, not imported | A5, A6, A7, A8, K20, K21, K22 |
| 3 | Importing a lot that already exists does not duplicate it | A9, A10, A11, K21 |
| 4 | Pressing Import twice imports once | D2, D3, D4 |
| 5 | Two admins import the same file at the same time | D5, D6 |
| 6 | Add one household | F1, F2, F10, F11 |
| 7 | The same lot can't be added twice | F3, F4, F5, F6, F12, F13, K23 |
| 8 | Correct a contact number | G1, G2, G3, G13 |
| 9 | Two admins edit the same household | G6, G7, K24 |
| 10 | A household is deactivated, not deleted | H1, H2, H3, H4, H15, H16, H17 |
| 11 | Typing in a half-filled form is not lost | K9, K10 |
| 12 | Search by block | J1, J2, J3 |
| 13 | Search by name | J4, J5 |
| 14 | Readable on a phone | K1, K2, K3, K4 |
| 15 | Only the office and the treasurer can change households | M1, M2, M8 |

Unhappy paths are included in every row above; the rest of the plan widens them.

### 3. Regression

**What else could break, and why**

| Area | Why it is at risk | Cases / re-run |
|---|---|---|
| `households/{id}` shape | Every later feature (billing, payments, bookings, vehicles, passes) reads it; homeowners read their own. Contacts must never land on it | N1, N2, N12, M5 |
| Rules helpers `isStaff()`, `hasRole()`, `isMember()` (prov.) | Shared with every collection in REQ-002; adding household rules can widen or break them | M-block; re-run TC-02 rules matrix |
| REQ-004 invitations | Read `displayName`, `contactEmail`, `active`; write `linkStatus`, `memberCount`. A rename of a field or an edit that rewrites the household doc could wipe `linkStatus` | P1–P5; re-run TC-04 invite and redeem cases |
| Shared modal (`ui/modal.js`, mock-up `.modal`) | REQ-003 says no close on backdrop; existing NAV-06 says Escape closes any modal. One change to the shared modal moves every dialog in the app | K9–K11; re-run NAV-06 |
| Shared table and pills (`ui/table.js`, `.pill`) | Link status reuses payment pill colours; a change ripples to Approvals and Dues | K13; re-run SMK-admin-approvals |
| Phone layout | DEF-001 is open: no viewport meta, so cards never appear on a real phone | K1–K4 under phone emulation; re-run NAV-07, NAV-08 |
| Household count shown elsewhere | Mock-up's admin Dashboard ("{n} households"), Announcements ("Seen by x of N households"), Collections, Reports read the household list | P6, P7, K19 (derived figure) |
| Mock-up Homeowners screen | `aHo()` is replaced; its free-text `contact` column and detail pop-up go away | Q1; re-run SMK-admin-homeowners |
| Audit log | Written by every privileged action; a household write without audit breaks accountability | G2, H5, H18, N5–N8 |

**Known failure patterns applied**

| Pattern | Applies? | Where |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Import 619 households", "Imported {n}…", "Skipped, not changed", Deactivate confirm, "{lot} is already in the directory." | Copy checked once in D4, H1, J9, K3, K13, K19–K25, B19–B21; each promise verified at record level by A3, A8, A11, D6, F3, H3, H4, H16; "won't be billed" flagged as unverifiable in R1 |
| A value written for one role, never shown back | Yes: phase, contacts, audit | Round-trip register R3, R6, R7, R12 |
| Status-gated rule checked for one transition only | Yes: active, link status, import run status, edit freshness | S1–S4 tables |
| Same concept, different word on another screen | Yes: "Import households" vs mobile "Import"; "Homeowners" page vs "households" count; "Inactive" chip vs "Deactivate"; link status words in REQ-003 vs REQ-004 | K18 |
| Dates computed in UTC where the user means local | Low: no due dates here; audit "when" and the 30-day retention cut-off; invite expiry date | N10, H12 (build dates from Asia/Manila local today) |
| A derived figure doesn't refresh after a related write | Yes: heading count, chip counts, search tokens after rename | P6, P7, G4, G13, H17 |
| Zero and "not set" look the same | Yes: empty directory vs search with no match; "—" balance vs ₱0; phase "Not set"; no email vs invalid email; 0 valid rows | J8, J9, K3, C12, C18, C25, C27, B4, B21 |
| A write silently refused by security rules | Yes: every direct client write and refused callable | M-block asserts the refusal, never "nothing changed" |
| Double-tap / two devices create duplicates | Yes: Import, Save (add), Save (edit), Deactivate | D2–D5, F5, F6, F12, F13, G10, G14, H9 |
| Stale reference | Yes: stale edit, preview then lot added, edit of a household deactivated meanwhile, import vs form on the same lot | G6–G9, D8, D9, D17, D18, K24 |
| Backdrop click loses work | Yes: Add / Edit dialog | K9, K10, K11 |
| A modal appearing mid-flow blocks the next action | Yes: important-announcement pop-up (NAV-05) appearing on the Import page or over the Add dialog | K12 |
| Assumed SDK/network behaviour baked into a case | Yes: "network error keeps the preview"; partial commit resume | D7, K8 marked as assumptions |
| Data leaking across households or roles | Yes: contacts, other households, import rejected rows | M3–M15, N1, N2 |

**Existing specs and screens QE should re-run** (QE owns the list): `smoke.spec.js` (SMK-admin-nav, SMK-admin-homeowners, SMK-owner-nav, SMK-guard-nav), `navigation.spec.js` NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07, NAV-08, and the TC-02 role matrix and TC-04 invite cases once those exist.

## Scenario list

Every scenario states one behaviour. The letter in brackets is the block where its case lives.

- **Happy path:** import a clean file into an empty directory (A); add one household (F); correct a mobile (G); deactivate and reactivate (H); search by block and by name (J).
- **Negative:** missing block / lot / owner name; invalid email; invalid mobile; duplicate lot in file; lot already in directory; non-UTF-8 file; non-CSV file; missing, renamed or extra columns; empty file; header only; zero valid rows; duplicate lot in the form; stale edit; commit of a run that is not previewed or not the caller's; every role refused (B, C, D, F, G, M).
- **Boundary:** 0, 1, 50, 51 households (paging); 623-row file; file at and over the row limit (gap Q1); owner name 80 and 81 characters; mobile formats at each accepted shape and one digit short or long; block 4 vs 40–49; lot with suffix "12-A"; row numbers counting the header as row 1; last row without a trailing newline (B, C, J).
- **Usability:** errors as text with what to do; preview caption and row numbers; visible file label; focus to first error; inline validation on blur; keyboard-only import; tap targets; empty, loading, in-progress, finished, error states; WCAG 2.2 AA contrast and non-colour pills (K).
- **Navigation:** reach Homeowners from the menu for Admin and Treasurer; highlighted menu item; import steps forward, back ("Choose a different file") and Cancel; after Save / Cancel; reload on the preview; deep link refused for Board, Guard, Homeowner, No-role; treasurer-homeowner switch (L).
- **Security / role:** read and write refusals per role and per collection, asserted explicitly; removed-admin stale token (M).
- **Integration:** REQ-004 reads name, email and active; link status starts "Not invited"; counts on other screens (P).
- **Concurrency:** double press Import; two admins import; two admins add the same lot; two admins edit; edit vs deactivate; form vs import on the same lot (D, F, G, H).
- **Back-compat:** greenfield, so no migrated records. Applies only to: the mock-up's 20 sample households are never imported (Q1); a household created before phase is set renders "Not set" (Q2); a household doc without `linkStatus` / `memberCount` (created before the REQ-004 functions deploy) still renders (Q3).
- **Responsive:** 375 px cards, 640 / 641 px breakpoint, no sideways scroll, real phone emulation per DEF-001, import on a phone (K).
- **UI/UX:** copy of record word for word; consistent words across screens; pill colours shared with payment status (K).
- **Data integrity:** lot key uniqueness and normalisation; contacts only in the staff-only record; mobile stored in one format; ñ survives; audit per action with ids only; no personal data in logs; rejected rows deleted after 30 days; formula cells escaped on download; re-import idempotent (C, D, E, N).
- **Exploratory:** three charters (X).

## Test data

All invented, test environment only. The Gherkin's sample names, emails and phone numbers
are replaced with the fixtures below; the block and lot numbers in the Gherkin
(Blk 2 Lot 7, Blk 4 Lot 12, Blk 7 Lot 1, Blk 8 Lot 2, Blk 9 Lot 1) are kept because they
exist only in the test project. A fixture handle such as `ZZ-B04-L12` names the fixture;
the stored lot key follows whatever format decision 2 settles.

| Fixture | Lot | Owner name | Email | Mobile | State |
|---|---|---|---|---|---|
| ZZ Test Household A (`ZZ-B04-L12`) | Blk 4 Lot 12 | ZZ Test Owner Alpha | zz-owner-a@example.test | 0900 000 0001 | Active, Linked (ZZ Test Homeowner A) |
| ZZ Test Household B (`ZZ-B01-L03`) | Blk 1 Lot 3 | ZZ Test Owner Bravo | zz-owner-b@example.test | 0900 000 0002 | Active, Linked (ZZ Test Homeowner B) |
| ZZ Test Household C (`ZZ-B07-L01`) | Blk 7 Lot 1 | ZZ Test Owner Charlie | zz-owner-c@example.test | 0900 000 0003 | Active, Invited (unused email invitation) |
| ZZ Test Household D (`ZZ-B08-L02`) | Blk 8 Lot 2 | ZZ Test Owner Delta | zz-owner-d@example.test | 0900 000 0004 | Created in F1; pre-seeded for F3 |
| ZZ Test Household E (`ZZ-B02-L10`) | Blk 2 Lot 10 | ZZ Test Owner Echo | — | — | Active, Linked (ZZ Test Treasurer-Homeowner) |
| ZZ Test Household F (`ZZ-B12-L12-A`) | Blk 12 Lot 12-A | ZZ Test Owner Foxtrot | — | 0900 000 0006 | Active, Not invited |
| ZZ Search Set | Blk 4 Lots 1–6, Blk 40–49 Lot 1 each, Blk 14 Lot 4 | include "ZZ Test Santos", "ZZ Test Dos Santos", "ZZ Test Santoson", "ZZ Test Peña" | — | — | Active |
| ZZ Directory 623 | 623 households from `ZZ-import-623-clean.csv` | Automation Owner 001 … 623 | automation-001@example.test … | 0900 000 1001 … | For count, paging and phone cases |

**CSV fixtures** (QE builds them; names here are the contract):

| File | Content |
|---|---|
| `ZZ-import-623-clean.csv` | Header + 623 valid rows, UTF-8 with BOM (as Excel "CSV UTF-8" saves), CRLF, mixed mobile shapes (`9…`, `09…`, `639…`, `+639…`, with spaces and dashes), one name with "ñ" |
| `ZZ-import-623-problems.csv` | Header + 623 data rows: row 14 no lot, rows 31 and 32 both Blk 2 Lot 7, row 57 email `zz-ana@`; all other rows valid and new |
| `ZZ-import-with-B04-L12.csv` | Header + 3 valid new rows + one row for Blk 4 Lot 12 with a **different** owner name and contacts |
| `ZZ-import-ansi.csv` | Header + 3 rows, saved in Windows-1252 with "ZZ Test Peña" |
| `ZZ-import-empty.csv` | 0 bytes |
| `ZZ-import-header-only.csv` | Header line only |
| Others | Named in the case that needs them |

## Cases

Unless a case says otherwise: environment is the emulator or `hoa-portal-staging`; the
directory holds Households A–F plus the ZZ Search Set; the actor is ZZ Test Admin 1 on a
desktop browser. "Refused explicitly" means the call or read returns a permission or
validation error that the case checks for, never "nothing changed on screen".

**One behaviour per case (r2).** Each case checks one kind of behaviour: a rule (parsing,
normalisation, validation, counts, uniqueness), a permission, a stored outcome, or what the
screen shows. Rule, permission and stored-outcome cases state the record or the decision
first and name no screen wording; the preview result or the run record (prov.) is the
evidence, not the preview table. The REQ-003 copy of record is checked once, in these
screen cases: D4 (Importing…), H1 (Deactivate confirm), J9 (empty state), K3 (balance
"—"), K13 (link status pills), K19 (page heading), K20 (preview heading and Import
button), K21 (row reasons), K22 (finished banner), K23 (duplicate lot), K24 (stale edit),
K25 (import hint and buttons), plus B19–B21 for file-level refusals. A refusal case's
"no record written" is its proof of refusal, not a second behaviour.

### Block A — Import: preview and happy path

#### TC-03-A1 — The preview of a clean 623-row file classifies every row as ready and none as rejected
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** empty directory; ZZ Test Admin 1; `ZZ-import-623-clean.csv`.
- **Action:** run the preview for the file.
- **Expected:** the preview result has 623 rows ready and 0 rejected; the import-run record (prov.) is `previewed` with those counts. Screen wording: K20.
- **Don't assert:** time taken; the import id.

#### TC-03-A2 — The preview alone saves no household
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** as A1, preview done.
- **Action:** cancel the preview.
- **Expected:** no `households`, `lots` or `householdContacts` documents exist (prov.). Empty-state screen: J9.
- **Don't assert:** whether the import-run record is deleted on Cancel (gap Q13).

#### TC-03-A3 — Committing the clean file stores exactly 623 households
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A1.
- **Action:** commit the run; wait for it to finish.
- **Expected:** 623 household records exist, one per lot in the file; the run record (prov.) reports 623 imported. Banner: K22; heading: K19.
- **Don't assert:** whether the run reports 0 rejected or omits the figure (gap Q5); record order.

#### TC-03-A4 — Every imported household is stored with link status "Not invited" and no members
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after A3.
- **Action:** read the 623 household records.
- **Expected:** each has link status Not invited and member count 0 (register R9, prov.). Chip count: J14; pill words: K13.
- **Don't assert:** the stored value's spelling (prov.).

#### TC-03-A5 — The preview rejects exactly rows 14, 31, 32 and 57, counting the header as row 1
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** empty directory; Admin 1; `ZZ-import-623-problems.csv`.
- **Action:** run the preview.
- **Expected:** exactly four rejected rows: 14 lot missing; 31 and 32 Blk 2 Lot 7 duplicated in the file; 57 invalid email, value `zz-ana@`. Reason wording: K21.
- **Don't assert:** order beyond ascending row number.

#### TC-03-A6 — The preview counts only the rows that will be added
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** as A5.
- **Action:** read the preview result.
- **Expected:** 619 ready, 4 rejected. Heading and button wording: K20.
- **Don't assert:** tile layout.

#### TC-03-A7 — Neither copy of an in-file duplicate lot is stored
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A5.
- **Action:** commit; read the records.
- **Expected:** no lot entry or household for Blk 2 Lot 7; 619 households from this run.
- **Don't assert:** which of rows 31/32 the system saw first.

#### TC-03-A8 — After a partial import the run record holds 619 imported and the 4 rejected rows
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A7, committed.
- **Action:** read the run record (prov.).
- **Expected:** 619 imported; the 4 rejected rows (14, 31, 32, 57) with reasons, available to download (file content: E1). Banner: K22.
- **Don't assert:** field names.

#### TC-03-A9 — The preview classifies a lot already in the directory as skipped and counts 3 ready
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A (Blk 4 Lot 12) exists; Admin 1; `ZZ-import-with-B04-L12.csv`.
- **Action:** run the preview.
- **Expected:** the Blk 4 Lot 12 row is classified "already in the directory, skipped"; 3 rows ready. Wording: K20, K21.
- **Don't assert:** whether the skipped row counts among the rows that won't be imported (gap Q5).

#### TC-03-A10 — The import leaves exactly one Blk 4 Lot 12
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A9.
- **Action:** commit; read the records for Blk 4 Lot 12.
- **Expected:** one lot entry and one household for Blk 4 Lot 12 (prov.).
- **Don't assert:** the total household count.

#### TC-03-A11 — The existing household's name and contacts are unchanged by the import
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A10.
- **Action:** read Household A's household and contact records.
- **Expected:** display name "ZZ Test Owner Alpha"; email zz-owner-a@example.test; mobile the stored form of 0900 000 0001; link status Linked.
- **Don't assert:** that the file's different values appear anywhere.

#### TC-03-A12 — The template file's header is the six columns in order
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1 on Import households.
- **Action:** download the template.
- **Expected:** a CSV whose header is Block, Lot, Owner name, Email, Mobile, Phase. Hint wording: K25.
- **Don't assert:** file name.

#### TC-03-A13 — A treasurer's import preview and commit calls are allowed
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** Yes
- **Setup:** empty directory; ZZ Test Treasurer; a 3-row clean file.
- **Action:** call preview, then commit.
- **Expected:** neither call returns a permission error.
- **Don't assert:** audit record contents (N6).

#### TC-03-A14 — A treasurer's commit stores the file's households
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after A13.
- **Action:** read the records for the file's 3 lots.
- **Expected:** 3 household records, one per lot.
- **Don't assert:** who the run record names beyond the treasurer's uid.

### Block B — Import: file-level boundaries and negatives

#### TC-03-B1 — A 0-byte file is refused before any preview
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-empty.csv`.
- **Action:** submit the file.
- **Expected:** refused at file level; no row results; no `previewed` run record. **Assumption — pending BA (Q2).** Screen: B19.
- **Don't assert:** whether the refusal happens in the browser or the function.

#### TC-03-B2 — A header-only file yields zero ready rows
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-header-only.csv`.
- **Action:** run the preview.
- **Expected:** 0 ready, 0 rejected; committing that run writes no household. **Assumption — pending BA (Q2).** Import button: B21.
- **Don't assert:** whether the preview is refused or returns empty.

#### TC-03-B3 — A file with one valid row stores one household
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** empty directory; header + 1 valid row.
- **Action:** preview and commit.
- **Expected:** one household record.
- **Don't assert:** "household" vs "households" in the copy (gap Q3).

#### TC-03-B4 — A file where every row has a problem yields zero ready rows
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** header + 3 rows, each with no owner name.
- **Action:** run the preview.
- **Expected:** 3 rejected for a missing owner name; 0 ready. **Assumption — pending BA (Q2).** Import button: B21.
- **Don't assert:** tile values.

#### TC-03-B5 — A file that is not valid UTF-8 is refused at file level
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-ansi.csv`.
- **Action:** submit the file.
- **Expected:** refused as not UTF-8; no row results. Wording: B20.
- **Don't assert:** that a garbled name is returned anywhere.

#### TC-03-B6 — A UTF-8 file with a BOM is read correctly, first column included
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** 3 valid rows saved as Excel "CSV UTF-8" (with BOM).
- **Action:** run the preview.
- **Expected:** 3 ready, 0 rejected; row 2's block parsed as its number, not rejected for a missing block. **Assumption — pending BA (Q4).**
- **Don't assert:** how the BOM is stripped.

#### TC-03-B7 — A UTF-8 file without a BOM is read correctly
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** the same 3 rows with no BOM (as Google Sheets exports).
- **Action:** run the preview.
- **Expected:** 3 ready, 0 rejected.
- **Don't assert:** file name.

#### TC-03-B8 — "ñ" in an owner name is stored unchanged
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** UTF-8 row with owner "ZZ Test Peña".
- **Action:** preview, commit; read the household record.
- **Expected:** display name is exactly "ZZ Test Peña". Display: B22.
- **Don't assert:** search with "pena" (J7).

#### TC-03-B9 — CRLF, LF and mixed line endings give the same rows and row numbers
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** one 5-row file saved three ways (CRLF, LF, mixed); row 4 has no lot.
- **Action:** run the preview for each.
- **Expected:** each: 4 ready; row 4 rejected for a missing lot. **Assumption — pending BA (Q4).**
- **Don't assert:** CR-only files until Q4 is answered.

#### TC-03-B10 — A last row with no final newline is read; trailing blank lines are not rows
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** two copies of a 3-row file: no final newline; two blank lines at the end.
- **Action:** run the preview for each.
- **Expected:** both: 3 ready, 0 rejected. **Assumption — pending BA (Q4).**
- **Don't assert:** row numbers of blank lines.

#### TC-03-B11 — A quoted field containing a comma stays in one column
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner `"ZZ Test Santos, Jr."` with email and mobile.
- **Action:** preview and commit; read the records.
- **Expected:** display name "ZZ Test Santos, Jr."; email and mobile in their own contact fields.
- **Don't assert:** quote characters in any display.

#### TC-03-B12 — A missing required column is reported once for the file
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** template without the Lot column, 3 rows.
- **Action:** submit the file.
- **Expected:** one file-level error identifying the Lot column; no row results; nothing can be committed. **Assumption — pending BA (Q2).** Screen: B19.
- **Don't assert:** wording.

#### TC-03-B13 — An extra unknown column causes no row to be rejected
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** template + a "Notes" column holding "ZZ note text".
- **Action:** run the preview.
- **Expected:** every row ready. **Assumption — pending BA (Q2).**
- **Don't assert:** whether the preview warns about the column.

#### TC-03-B14 — Reordered columns are matched by header, never shifted
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** columns in the order Owner name, Block, Lot, Mobile, Email, Phase.
- **Action:** run the preview.
- **Expected:** rows parsed with each value in its own field, or one file-level error; never a name parsed as a lot. **Assumption — pending BA (Q2).**
- **Don't assert:** which of the two outcomes.

#### TC-03-B15 — A semicolon-separated file is refused, not read as one column
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** template saved with `;` separators.
- **Action:** submit the file.
- **Expected:** a file-level error; no row whose block holds a whole line. **Assumption — pending BA (Q2).** Screen: B19.
- **Don't assert:** wording.

#### TC-03-B16 — An .xlsx file is refused before any preview
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** the template saved as `.xlsx`.
- **Action:** choose it.
- **Expected:** refused as not CSV; no row results (CSV only in R1). Screen: B19.
- **Don't assert:** whether the file picker filters it out first.

#### TC-03-B17 — A file at the row limit is accepted; one row over is refused, stating the limit
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** files with exactly the limit and limit + 1 valid rows (limit: gap Q1).
- **Action:** run the preview for each.
- **Expected:** limit: previewed. Limit + 1: refused at file level, the error carrying the limit. **Assumption — pending BA (Q1).** Screen: B19.
- **Don't assert:** a number until Q1 is answered.

#### TC-03-B18 — A multi-megabyte file is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** a CSV padded to about 5 MB.
- **Action:** submit the file.
- **Expected:** refused for size; no row results. **Assumption — pending BA (Q1).** Page responsiveness: B24.
- **Don't assert:** the size threshold.

#### TC-03-B19 — A file-level refusal is shown as a text message saying what to do, with no preview
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** the files from B1, B12, B15, B16, B17 (limit + 1) and B18.
- **Action:** choose each on Import households.
- **Expected:** each shows a text message naming the problem and the fix (B12's names the Lot column, B17's states the limit, B16's says to save as CSV UTF-8); no preview table; no Import button. **Assumption — pending BA (Q1, Q2).**
- **Don't assert:** exact wording (no copy of record exists for these).

#### TC-03-B20 — The not-UTF-8 refusal reads "Save the file as CSV UTF-8 and upload it again."
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-ansi.csv`.
- **Action:** choose it.
- **Expected:** that text; no preview rows. Copy is from the Sol Arch review, not REQ-003's copy table (gap Q4).
- **Don't assert:** message position.

#### TC-03-B21 — With zero ready rows the Import button is absent or disabled
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** the previews from B2, B4 and D13.
- **Action:** look for the Import button.
- **Expected:** absent or disabled in each. **Assumption — pending BA (Q2).**
- **Don't assert:** which of the two, or "0 households" vs "No rows".

#### TC-03-B22 — An owner name with "ñ" is shown unchanged in the preview and directory
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as B8.
- **Action:** read the preview row, then search "peña".
- **Expected:** "ZZ Test Peña" exactly in both.
- **Don't assert:** font rendering.

#### TC-03-B23 — An extra column's values are stored in no record
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as B13.
- **Action:** commit; read the household, lot and contact records.
- **Expected:** "ZZ note text" is in none of them. **Assumption — pending BA (Q2).**
- **Don't assert:** other field names.

#### TC-03-B24 — The page stays usable while a multi-megabyte file is refused
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as B18.
- **Action:** choose the file; then press Choose a different file.
- **Expected:** the page responds; no frozen tab.
- **Don't assert:** a timing figure.

### Block C — Field validation and lot-key normalisation

The rules apply to the import and the form alike (one validation function, Sol Arch review).
Each case uses a small import file of new rows plus one control row that is valid. The
expected result is the preview result for each row; reason wording is checked once in K21.

#### TC-03-C1 — A row with no block is rejected for a missing block
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** row: Block blank, Lot 3, owner "ZZ Test Owner C1".
- **Action:** run the preview.
- **Expected:** that row rejected, reason block missing; control row ready.
- **Don't assert:** column order.

#### TC-03-C2 — A row with no owner name is rejected for a missing owner name
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** row: Block 30, Lot 1, owner blank.
- **Action:** run the preview.
- **Expected:** rejected, reason owner name missing.
- **Don't assert:** other fields.

#### TC-03-C3 — An owner name of spaces only is treated as missing
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** owner "   ".
- **Action:** run the preview.
- **Expected:** rejected, reason owner name missing.
- **Don't assert:** how spaces are echoed.

#### TC-03-C4 — An owner name of exactly 80 characters is accepted and stored in full
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner "ZZ Test " padded to 80 characters.
- **Action:** preview, commit; read the household record.
- **Expected:** row ready; display name stored with all 80 characters. Display: C23.
- **Don't assert:** anything about wrapping.

#### TC-03-C5 — An owner name of 81 characters is rejected with a length reason
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** the C4 name plus one character.
- **Action:** run the preview.
- **Expected:** rejected, reason naming the 80-character limit. **Assumption — pending BA (Q7).**
- **Don't assert:** wording.

#### TC-03-C6 — Each of the six accepted mobile shapes passes validation
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** six rows with mobiles `9000000011`, `09000000012`, `639000000013`, `+639000000014`, `0900-000-0015`, `0900 000 0016`.
- **Action:** run the preview.
- **Expected:** all six ready. Stored format: N3; display format: C24.
- **Don't assert:** the stored string here.

#### TC-03-C7 — A mobile one digit short is rejected as invalid, quoting the value
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** mobile `0900000001` (10 digits).
- **Action:** run the preview.
- **Expected:** rejected, reason invalid mobile, carrying the value `0900000001`.
- **Don't assert:** whether spaces in the value are echoed.

#### TC-03-C8 — A mobile one digit long is rejected as invalid
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** mobile `090000000123`.
- **Action:** run the preview.
- **Expected:** rejected, reason invalid mobile, carrying the value.
- **Don't assert:** wording.

#### TC-03-C9 — A mobile in scientific notation is rejected, not guessed
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** mobile `9.00E+09`.
- **Action:** run the preview.
- **Expected:** rejected, reason invalid mobile, carrying "9.00E+09".
- **Don't assert:** any reconstructed number.

#### TC-03-C10 — A 5,000-digit mobile is rejected promptly
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** one row with a 5,000-digit mobile.
- **Action:** run the preview.
- **Expected:** rejected; validation returns in normal time (length capped before matching, S8786).
- **Don't assert:** a timing figure.

#### TC-03-C11 — Three malformed emails are each rejected as invalid, quoting the value
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** three rows with emails `zz-ana@`, `zz@@example.test`, `zz example@example.test`.
- **Action:** run the preview.
- **Expected:** each rejected, reason invalid email, carrying its value.
- **Don't assert:** acceptance of unusual-but-valid addresses (library decides).

#### TC-03-C12 — A row with no email and no mobile is stored with both contacts empty
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Block 31, Lot 1, owner "ZZ Test Owner C12", no email, no mobile.
- **Action:** preview, commit; read the contact record.
- **Expected:** row ready; household stored; contact record has no email and no mobile (empty, not an invalid placeholder). Display: C25.
- **Don't assert:** whether the fields are absent or empty strings (prov.).

#### TC-03-C13 — Two households may share one contact email
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** two new lots, both zz-family@example.test.
- **Action:** preview, commit; read both contact records.
- **Expected:** both rows ready; both contact records hold zz-family@example.test (shared family emails are expected, SA-001 §8.1).
- **Don't assert:** any warning text.

#### TC-03-C14 — Lot "12-A" is stored as a lot distinct from Lot 12
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A (Blk 4 Lot 12) exists; row Blk 4 Lot 12-A.
- **Action:** preview, commit; read the lot entries.
- **Expected:** row ready; two lot entries and two households, Blk 4 Lot 12 and Blk 4 Lot 12-A. Label: C26.
- **Don't assert:** the key string.

#### TC-03-C15 — Block "04" and block "4" resolve to the same lot
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; row Block "04", Lot "12".
- **Action:** run the preview.
- **Expected:** classified as already in the directory, skipped.
- **Don't assert:** the key string.

#### TC-03-C16 — Lot values "012", " 12 " and "12-a" resolve to existing lots by one rule
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Households A (Blk 4 Lot 12) and F (Blk 12 Lot 12-A) exist; rows Blk 4 Lot "012", Blk 4 Lot " 12 ", Blk 12 Lot "12-a".
- **Action:** run the preview.
- **Expected:** QA assumes trim, case-insensitive, leading zeros ignored: all three classified as already in the directory, skipped. **Assumption — pending BA (Q8).** Never two households a person would read as the same lot.
- **Don't assert:** the key string.

#### TC-03-C17 — A non-numeric, zero or negative block is rejected
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** rows with Block "4A", "0", "-1".
- **Action:** run the preview.
- **Expected:** each rejected with a block reason. **Assumption — pending BA (Q8):** no copy exists for an invalid (not missing) block.
- **Don't assert:** wording.

#### TC-03-C18 — A blank phase is stored as not set; an unknown phase is handled by one rule
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** rows with Phase blank, "Phase 2", "2", "Phase 9".
- **Action:** preview, commit; read the household records.
- **Expected:** blank → phase not set (null, prov.); "Phase 2" → Phase 2; "2" and "Phase 9" per BA. **Assumption — pending BA (Q8).** "Not set" display: C27.
- **Don't assert:** outcomes for "2" and "Phase 9" until Q8.

#### TC-03-C19 — Three copies of one lot in a file are all rejected as duplicates
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** rows 2, 3, 4 all Blk 32 Lot 1.
- **Action:** run the preview.
- **Expected:** all three rejected, reason duplicated in the file, naming Blk 32 Lot 1.
- **Don't assert:** order.

#### TC-03-C20 — A lot duplicated in the file and already in the directory gets one reason per row
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; two rows for Blk 4 Lot 12.
- **Action:** run the preview.
- **Expected:** each row carries exactly one reason; neither ready. **Assumption — pending BA (Q5):** which reason.
- **Don't assert:** which reason until Q5.

#### TC-03-C21 — A row with two problems is reported by one consistent rule
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** one row with no lot and email `zz@`.
- **Action:** run the preview.
- **Expected:** both reasons, or the first only, the same way for every such row. **Assumption — pending BA (Q7).**
- **Don't assert:** which until Q7.

#### TC-03-C22 — Markup in an owner name is shown as text and never runs
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner `ZZ <img src=x onerror=alert(1)>`.
- **Action:** preview, commit, open list and edit form.
- **Expected:** the literal text shows on each screen; no script runs; no page error.
- **Don't assert:** how the text is escaped internally.

#### TC-03-C23 — An 80-character owner name is shown in full in the list and edit form
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** after C4.
- **Action:** open the list and the household's edit form.
- **Expected:** all 80 characters visible or reachable (wrapped, not cut off).
- **Don't assert:** line-wrap position.

#### TC-03-C24 — Stored mobiles are shown in the "0900 000 0000" display format
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** C6's six rows committed.
- **Action:** read the Contact column.
- **Expected:** "0900 000 0011" … "0900 000 0016" (register R7).
- **Don't assert:** the stored string (N3).

#### TC-03-C25 — A household with no email shows no email in the list and an empty Email field
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** after C12 and after G5.
- **Action:** read each household's Contact cell; open its edit form.
- **Expected:** no email shown; Email field empty.
- **Don't assert:** placeholder text.

#### TC-03-C26 — A suffixed lot's label reads "Blk 4 Lot 12-A"
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** after C14.
- **Action:** search "blk 4".
- **Expected:** a row labelled "Blk 4 Lot 12-A" and a separate "Blk 4 Lot 12".
- **Don't assert:** order.

#### TC-03-C27 — A household with no phase shows "Not set" in the edit form
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** after C18 (blank-phase row) and Household F (phase null).
- **Action:** open each edit form.
- **Expected:** Phase reads "Not set".
- **Don't assert:** phase list contents.

### Block D — Commit, idempotency, re-import, partial failure, concurrency

#### TC-03-D1 — While committing, the page shows a progress count, then the finished banner
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** empty directory; `ZZ-import-623-clean.csv` previewed.
- **Action:** press Import; watch.
- **Expected:** a progress count during the run (UX notes); then the finished banner (wording: K22).
- **Don't assert:** intermediate counts.

#### TC-03-D2 — Pressing Import twice quickly imports each row once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D1.
- **Action:** double-press "Import 623 households".
- **Expected:** 623 household records; one lot entry per lot (prov.).
- **Don't assert:** whether the second press reached the server.

#### TC-03-D3 — A second commit call for a running import is refused by the server
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D1; special staging: a second tab, or a direct second call with the same import id while the first runs.
- **Action:** send the second commit.
- **Expected:** refused explicitly; 623 household records at the end.
- **Don't assert:** error text.

#### TC-03-D4 — While importing, the button reads "Importing…" and is disabled
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D1.
- **Action:** press Import; inspect the button before it finishes.
- **Expected:** label "Importing…" (copy of record), disabled until the run finishes.
- **Don't assert:** whether Cancel is also disabled (not stated).

#### TC-03-D5 — Two admins importing the same file at once store 623 households
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions at once (Admin 1, Admin 2); empty directory; each has previewed the same file.
- **Action:** both commit at the same moment.
- **Expected:** 623 household records; one lot entry per lot (prov.).
- **Don't assert:** which run wrote which row.

#### TC-03-D6 — The import that finished second reports each of its rows as skipped
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D5.
- **Action:** read the second-finishing run's results.
- **Expected:** each of its rows classified as already in the directory, skipped. If rows interleave, imported totals across both runs add to exactly 623. **Assumption — pending BA (Q6).**
- **Don't assert:** which admin finishes second.

#### TC-03-D7 — An import interrupted part-way can be finished without duplicates
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: stop the commit function mid-run on the emulator.
- **Action:** rerun as the BA defines.
- **Expected:** remaining rows written; rows already written skipped; 623 household records in total. **Assumption — pending BA (Q6).** Resume behaviour comes from the Sol Arch review only.
- **Don't assert:** how the screen describes the stuck run.

#### TC-03-D8 — A lot added by the form between preview and commit is reported skipped at commit
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Setup:** two sessions. Admin 1 previews a file with Blk 9 Lot 1 (classified ready); Admin 2 then adds Blk 9 Lot 1 as "ZZ Test Owner Golf".
- **Action:** Admin 1 commits.
- **Expected:** the commit result classifies Blk 9 Lot 1 as already in the directory, skipped.
- **Don't assert:** the count tiles from the original preview.

#### TC-03-D9 — Form save and import commit on the same new lot at once store one household
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions timed together; Blk 9 Lot 2 in Admin 1's previewed file; Admin 2 has the Add form filled for Blk 9 Lot 2.
- **Action:** commit and Save at the same moment.
- **Expected:** exactly one lot entry and one household for Blk 9 Lot 2.
- **Don't assert:** which one wins.

#### TC-03-D10 — Committing another staff member's previewed run is refused
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1 previews a 3-row file; Admin 2 holds its import id.
- **Action:** Admin 2 calls commit with that id.
- **Expected:** refused explicitly; no households written.
- **Don't assert:** error text.

#### TC-03-D11 — Committing an unknown import id is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1; a made-up import id.
- **Action:** call commit.
- **Expected:** refused explicitly; no households written.
- **Don't assert:** error text.

#### TC-03-D12 — Committing a completed run again is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3.
- **Action:** call commit again for the same id.
- **Expected:** refused explicitly; still 623 household records; no second import-completed audit record.
- **Don't assert:** error text.

#### TC-03-D13 — Uploading the same file again classifies every row as skipped
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3.
- **Action:** run the preview for `ZZ-import-623-clean.csv` again.
- **Expected:** 0 ready; 623 classified as already in the directory, skipped; still 623 household records. Import button: B21.
- **Don't assert:** preview order.

#### TC-03-D14 — A fixed rejected-rows file previews only the fixed rows as ready
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8; downloaded 4 rows; fix row 14 (add Lot 99), change one of 31/32 to Blk 2 Lot 70, leave 57.
- **Action:** run the preview for the fixed file (with or without the reason column).
- **Expected:** 3 ready (fixed 14, Blk 2 Lot 70, the remaining Blk 2 Lot 7); 1 rejected (57).
- **Don't assert:** whether the extra reason column is ignored silently (B13).

#### TC-03-D15 — A re-import with changed names updates no existing household
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3; the clean file with every owner name changed.
- **Action:** run the preview; commit if the run allows it.
- **Expected:** every household's display name equals its value before the upload (R1 never updates from import).
- **Don't assert:** whether the commit is offered (Q2).

#### TC-03-D16 — An inactive household's lot is classified as skipped by the import
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C deactivated; a file with Blk 7 Lot 1.
- **Action:** run the preview.
- **Expected:** Blk 7 Lot 1 classified as already in the directory, skipped. **Assumption — pending BA (Q9).**
- **Don't assert:** any mention of "inactive" in the reason.

#### TC-03-D17 — A household added by the form survives a later import of its lot unchanged
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after D8.
- **Action:** read the records for Blk 9 Lot 1.
- **Expected:** one lot entry and one household; display name "ZZ Test Owner Golf".
- **Don't assert:** the run's other rows.

#### TC-03-D18 — The losing write of a form-versus-import race is refused as a duplicate
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D9.
- **Action:** read the form call's response and the commit result.
- **Expected:** exactly one of them reports Blk 9 Lot 2 as a duplicate: the form call refused as already in the directory, or the commit row classified as skipped. Wording: K21, K23.
- **Don't assert:** which one loses.

#### TC-03-D19 — Committing the fixed file adds exactly the three fixed rows
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after D14.
- **Action:** commit; read the records.
- **Expected:** households now exist for Blk 2 Lot 70, Blk 2 Lot 7 and the fixed row 14's lot; 622 households in total; row 57's lot absent.
- **Don't assert:** record order.

#### TC-03-D20 — A re-import with changed names classifies every row as skipped
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** as D15.
- **Action:** run the preview.
- **Expected:** 0 ready; all 623 classified as already in the directory, skipped.
- **Don't assert:** preview order.

#### TC-03-D21 — An import never creates or reactivates a household on an inactive lot
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D16; commit the run.
- **Action:** read the records for Blk 7 Lot 1.
- **Expected:** one lot entry and one household; still inactive. **Assumption — pending BA (Q9).**
- **Don't assert:** the run's other rows.

### Block E — Rejected-rows report and download

#### TC-03-E1 — The download holds exactly the rejected rows with their reasons
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8.
- **Action:** download the rejected rows.
- **Expected:** 4 data rows (from rows 14, 31, 32, 57) with the template columns plus row number and reason; no valid row.
- **Don't assert:** file name; the position of the extra columns.

#### TC-03-E2 — Skipped existing lots follow one stated rule in the download
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** after A9 committed.
- **Action:** download the rows.
- **Expected:** Blk 4 Lot 12 included or excluded per BA. **Assumption — pending BA (Q5).**
- **Don't assert:** either outcome until Q5.

#### TC-03-E3 — Cells starting with "=", "+", "-" or "@" are escaped in the download file
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** four rejected rows (no lot) with owner names `=HYPERLINK("http://example.test")`, `+1+1`, `-2+3`, `@SUM(1)`.
- **Action:** download; read the raw file.
- **Expected:** each of those cells starts with `'`. Spreadsheet behaviour: E7.
- **Don't assert:** quoting of other cells.

#### TC-03-E4 — A "+639…" mobile in the download is accepted again after a fix
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a rejected row (no lot) with mobile `+639000000099`.
- **Action:** download, add the lot, preview and commit.
- **Expected:** the row is ready; the contact record holds the same number as `+639000000099` would store (N3). **Assumption — pending BA (Q7):** the import strips a leading `'`. Display: C24.
- **Don't assert:** the raw cell text.

#### TC-03-E5 — The download is UTF-8 and keeps "ñ"
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** a rejected row with owner "ZZ Test Peña".
- **Action:** download; decode as UTF-8.
- **Expected:** "ZZ Test Peña" intact.
- **Don't assert:** BOM presence.

#### TC-03-E6 — Board, Guard and Homeowner can't read an import run's rejected rows
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8; ZZ Test Board Member, ZZ Test Guard, ZZ Test Homeowner A each hold the import id.
- **Action:** each reads `importRuns/{id}` (prov.).
- **Expected:** each refused explicitly.
- **Don't assert:** another admin's access (gap Q12).

#### TC-03-E7 — Escaped cells don't evaluate as formulas when the download is opened in a spreadsheet app
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** the E3 file.
- **Action:** open it in a spreadsheet app.
- **Expected:** none of the four cells evaluates as a formula or opens a link.
- **Don't assert:** how the app displays the apostrophe.

### Block F — Add household

#### TC-03-F1 — Adding Block 8 Lot 2 stores one household with link status "Not invited"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Blk 8 Lot 2 absent; Admin 1.
- **Action:** add Block 8, Lot 2, owner "ZZ Test Owner Delta", email zz-owner-d@example.test.
- **Expected:** one lot entry, one household (link status Not invited, member count 0) and one contact record holding the email (prov.). Screen after Save: F10.
- **Don't assert:** document ids.

#### TC-03-F2 — Mobile and phase from the Add form are stored
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as F1, also mobile 0900 000 0004 and Phase 3.
- **Action:** Save; read the household and contact records.
- **Expected:** phase 3 on the household; the mobile in the stored format on the contact record (register R3, R7). Read-back on screen: F11.
- **Don't assert:** the exact stored string (N3).

#### TC-03-F3 — The form's lot check reports an existing lot as taken before Save
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household D (Blk 8 Lot 2) exists.
- **Action:** enter Block 8, Lot 2 in Add household and leave the Lot field (or run the same check directly, prov.).
- **Expected:** the check reports Blk 8 Lot 2 as already in the directory; no record written. Message and Save state: K23.
- **Don't assert:** the delay before the check returns.

#### TC-03-F4 — A forced save of a duplicate lot is refused by the server
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** as F3.
- **Action:** call `createHousehold` (prov.) directly for Blk 8 Lot 2.
- **Expected:** refused explicitly; one Blk 8 Lot 2, owner still "ZZ Test Owner Delta".
- **Don't assert:** error text.

#### TC-03-F5 — Double-tapping Save creates one household
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Blk 9 Lot 1 absent; form filled.
- **Action:** double-tap Save.
- **Expected:** one lot entry and one household for Blk 9 Lot 1. Button state: F12.
- **Don't assert:** whether a duplicate message flashes.

#### TC-03-F6 — Two admins saving a new Blk 9 Lot 1 at once store exactly one household
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions (Admin 1, Admin 2); both forms filled for Blk 9 Lot 1 with different owners.
- **Action:** both press Save together.
- **Expected:** one lot entry and one household for Blk 9 Lot 1.
- **Don't assert:** which owner name wins.

#### TC-03-F7 — Leaving an empty required field shows a text message under it
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Add household open, all empty.
- **Action:** tab through Block, Lot and Owner name.
- **Expected:** each of the three shows a text message on blur; Save does not close the dialog.
- **Don't assert:** wording (copy table lists the import reasons only).

#### TC-03-F8 — The form's email check rejects an invalid email by the import's rule
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Add household; email `zz@`.
- **Action:** submit the form (or call `createHousehold`, prov., with that email).
- **Expected:** refused, reason invalid email carrying `zz@`; no record written. Message: F15.
- **Don't assert:** trailing punctuation.

#### TC-03-F9 — Adding the lot of an inactive household is refused as a duplicate
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C inactive.
- **Action:** add Block 7, Lot 1.
- **Expected:** refused as already in the directory; still one Blk 7 Lot 1, inactive. **Assumption — pending BA (Q9).** Wording: K23.
- **Don't assert:** a pointer to Reactivate.

#### TC-03-F10 — After Save the Add dialog closes and the new household is listed
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as F1.
- **Action:** press Save.
- **Expected:** dialog closes; Blk 8 Lot 2 appears in the list without a reload. Pill: K13.
- **Don't assert:** list position.

#### TC-03-F11 — The edit form shows back the mobile and phase entered on Add
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** after F2.
- **Action:** open the household's edit form.
- **Expected:** "0900 000 0004" and Phase 3 (register R3, R7).
- **Don't assert:** field order.

#### TC-03-F12 — Save is disabled while an add is in flight
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as F5.
- **Action:** press Save once; inspect it before the call returns.
- **Expected:** Save disabled until the call returns.
- **Don't assert:** spinner style.

#### TC-03-F13 — The losing add of two simultaneous saves is refused as a duplicate
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as F6.
- **Action:** read both `createHousehold` responses (prov.).
- **Expected:** one succeeds; the other is refused as already in the directory. Wording: K23 (assumption: same copy as F3).
- **Don't assert:** which admin loses.

#### TC-03-F14 — A household with no block, lot or owner name is refused by validation
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1.
- **Action:** submit Add household empty (or call `createHousehold`, prov., with each field missing in turn).
- **Expected:** each refused with the matching missing-field reason; no lot, household or contact record written.
- **Don't assert:** wording.

#### TC-03-F15 — An invalid email on the form shows the import's reason under Email
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Add household; email `zz@`.
- **Action:** leave the Email field.
- **Expected:** "\"zz@\" is not a valid email address" under Email (copy of record row reasons, same as K21).
- **Don't assert:** trailing punctuation.

### Block G — Edit household and stale edits

#### TC-03-G1 — A mobile edit stores the new number on the contact record
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A mobile 0900 000 0001.
- **Action:** edit to 0900 000 0099; Save; read the contact record.
- **Expected:** the contact record holds the stored form of 0900 000 0099; the household record has no mobile (N1). List display: G13.
- **Don't assert:** the stored string's exact shape (N3).

#### TC-03-G2 — The edit writes one activity record with who and when
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as G1.
- **Action:** read the audit records for Household A in the test project.
- **Expected:** one `household.updated` record (prov.) with Admin 1's uid, the household id and a server time (no R1 screen, register R12).
- **Don't assert:** the exact time.

#### TC-03-G3 — The edit's audit record holds ids only
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as G2.
- **Action:** inspect the record.
- **Expected:** no "0900 000 0001", "0900 000 0099" (in any format), name or email in it.
- **Don't assert:** field names.

#### TC-03-G4 — Renaming the owner makes the new name searchable and the old one not
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household B "ZZ Test Owner Bravo".
- **Action:** rename to "ZZ Test Owner Kilo"; run the directory search for "kilo", then "bravo".
- **Expected:** "kilo" returns Blk 1 Lot 3; "bravo" does not (search words refreshed, register R5).
- **Don't assert:** debounce timing.

#### TC-03-G5 — Clearing the email removes it from the contact record
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household B with email.
- **Action:** clear Email; Save; read the contact record.
- **Expected:** no email stored. Display: C25.
- **Don't assert:** whether the field is absent or empty (prov.).

#### TC-03-G6 — The second of two edits loaded at the same time is refused as stale
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions (Admin 1, Admin 2) both load Household A for editing.
- **Action:** Admin 1 saves mobile 0900 000 0091; then Admin 2 saves 0900 000 0092.
- **Expected:** Admin 2's `updateHousehold` (prov.) is refused as stale. Message and kept typing: K24.
- **Don't assert:** error code text.

#### TC-03-G7 — The first editor's change is kept after a stale save
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as G6.
- **Action:** read the contact record and the audit records.
- **Expected:** mobile is the stored form of 0900 000 0091; one `household.updated` record from this pair, not two.
- **Don't assert:** audit times.

#### TC-03-G8 — The same admin editing in two tabs is refused as stale on the second save
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Admin 1 loads Household A for editing in two tabs.
- **Action:** save in tab 1, then in tab 2.
- **Expected:** tab 2's save refused as stale; tab 1's value remains stored. Message: K24.
- **Don't assert:** tab 1's refresh behaviour.

#### TC-03-G9 — Saving an edit on a household deactivated meanwhile is refused
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Setup:** two sessions; Admin 1 has Household A loaded for editing; Admin 2 deactivates it.
- **Action:** Admin 1 saves.
- **Expected:** refused as stale; household stays inactive, values unchanged. **Assumption — pending BA (Q9).** Message: K24.
- **Don't assert:** wording if the BA defines a separate message.

#### TC-03-G10 — Double-tapping Save on an edit writes one change
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A edit form, mobile changed.
- **Action:** double-tap Save; read the records.
- **Expected:** one update; one `household.updated` audit record. Screen: G14.
- **Don't assert:** whether the second tap reached the server.

#### TC-03-G11 — Changing block or lot on edit follows one stated rule
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F.
- **Action:** try to change Lot 12-A to 12-B; Save.
- **Expected:** Block/Lot not editable (refused), or the change saves and the old lot key is freed (a new add of Blk 12 Lot 12-A then succeeds). **Assumption — pending BA (Q14).**
- **Don't assert:** either outcome until Q14.

#### TC-03-G12 — An edit request without the loaded time is refused
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1.
- **Action:** call `updateHousehold` (prov.) for Household A without `seenUpdatedAt`.
- **Expected:** refused explicitly; record unchanged.
- **Don't assert:** error text.

#### TC-03-G13 — The list shows the edited mobile without a reload
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as G1.
- **Action:** after Save, read Blk 4 Lot 12's Contact cell.
- **Expected:** "0900 000 0099".
- **Don't assert:** the stored string.

#### TC-03-G14 — A double-tapped edit shows its author no stale-edit message
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as G10.
- **Action:** watch the dialog after the double tap.
- **Expected:** no stale-edit message for Admin 1's own second tap; dialog closes normally.
- **Don't assert:** dialog animation.

### Block H — Deactivate and reactivate

#### TC-03-H1 — The Deactivate confirm reads the copy of record
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C active.
- **Action:** press Deactivate; read.
- **Expected:** "Deactivate Blk 7 Lot 1? It won't be billed or shown in the list, and its unused invitation stops working. Its records are kept." Each promise is verified elsewhere: list H16, invitation H4, records H3.
- **Don't assert:** "won't be billed" (billing REQ; not verifiable in R1).

#### TC-03-H2 — Confirming Deactivate stores the household as inactive
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household C active.
- **Action:** deactivate and confirm (or call `setHouseholdActive`, prov.); read the record.
- **Expected:** `active` is false (prov.). List effect: H16; chip: H17.
- **Don't assert:** other fields (H3, H11).

#### TC-03-H3 — A deactivated household's records are kept
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H2.
- **Action:** read Household C's household, lot and contact records.
- **Expected:** all three still exist; same name and contacts (prov.).
- **Don't assert:** fields other than `active` beyond these.

#### TC-03-H4 — Deactivating stops the household's unused invitation
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household C "Invited" with an unused email invitation (REQ-004 fixture); deactivate it.
- **Action:** ZZ Test No-Role User redeems that code.
- **Expected:** redemption refused as no longer valid; no membership created. Screen wording is REQ-004's ("This invitation is no longer valid. Ask the admin office.") and belongs to TC-04.
- **Don't assert:** the invite's stored status value.

#### TC-03-H5 — Deactivate writes one `household.deactivated` record
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H2.
- **Action:** read audit records for Household C.
- **Expected:** one `household.deactivated` (prov.) with Admin 1's uid; ids only.
- **Don't assert:** time.

#### TC-03-H6 — After Reactivate the default list includes the household and the Inactive filter doesn't
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H2.
- **Action:** reactivate Blk 7 Lot 1; run the default and the Inactive list queries.
- **Expected:** `active` is true; the default query returns Blk 7 Lot 1; the Inactive query doesn't.
- **Don't assert:** whether Reactivate asks for confirmation (not stated).

#### TC-03-H7 — Reactivate keeps the name, contacts and members
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A (Linked) deactivated, then reactivated.
- **Action:** read the household, contact and `members` records.
- **Expected:** same name and contacts; member record still present.
- **Don't assert:** link status (Q10).

#### TC-03-H8 — Reactivate doesn't bring a cancelled invitation back
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H4, reactivate Household C.
- **Action:** No-Role User redeems the old code.
- **Expected:** still refused; no membership created. **Assumption — pending BA (Q10).**
- **Don't assert:** the link status.

#### TC-03-H9 — Double-tapping Deactivate's confirm writes one change
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F active.
- **Action:** double-tap the confirm button.
- **Expected:** inactive; one `household.deactivated` record.
- **Don't assert:** dialog animation.

#### TC-03-H10 — Deactivate on an inactive household or Reactivate on an active one adds no record
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C inactive, Household F active.
- **Action:** call `setHouseholdActive` (prov.) to deactivate C and to reactivate F.
- **Expected:** refused or a no-op; `active` unchanged; no new audit record. **Assumption — pending BA (Q9).**
- **Don't assert:** refused vs no-op.

#### TC-03-H11 — Deactivating a "Not invited" household changes only its active state
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F (Not invited).
- **Action:** deactivate; read the records.
- **Expected:** inactive; name, contacts, link status unchanged.
- **Don't assert:** pill shown under Inactive.

#### TC-03-H12 — Deactivating an "Invite expired" household keeps the code refused
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a household with an expired invitation (REQ-004 fixture, expiry in the past by Asia/Manila date).
- **Action:** deactivate; No-Role User redeems the code.
- **Expected:** refused; no membership created.
- **Don't assert:** whether the refusal says "expired" or "no longer valid".

#### TC-03-H13 — A deactivated "Email failed" household has no working code
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a household in "Email failed" (REQ-004 fixture).
- **Action:** deactivate; look for Resend / Print slip under Inactive and redeem any code they produce.
- **Expected:** not offered, or any code they produce is refused. **Assumption — pending BA (Q11).**
- **Don't assert:** which of the two.

#### TC-03-H14 — Deactivating a "Linked" household leaves its member records in place
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A (Linked).
- **Action:** deactivate; read `members`.
- **Expected:** its `members` record unchanged (prov.).
- **Don't assert:** what Homeowner A sees afterwards (out of scope).

#### TC-03-H15 — Cancel on the Deactivate confirm leaves the household active
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** as H1.
- **Action:** press Cancel; read the record.
- **Expected:** `active` still true; no `household.deactivated` record.
- **Don't assert:** dialog animation.

#### TC-03-H16 — The default list excludes an inactive household and the Inactive filter includes it
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** after H2.
- **Action:** run the default and the Inactive list queries.
- **Expected:** default query doesn't return Blk 7 Lot 1; Inactive query does.
- **Don't assert:** the All count (gap Q18).

#### TC-03-H17 — The Inactive chip count rises by one after a deactivation, without a reload
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household C active; note the Inactive chip count.
- **Action:** deactivate and confirm.
- **Expected:** "Inactive" chip count is one higher; Blk 7 Lot 1 gone from the visible list.
- **Don't assert:** the All count (gap Q18).

#### TC-03-H18 — Reactivate writes one `household.reactivated` record
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H6.
- **Action:** read audit records for Household C.
- **Expected:** one `household.reactivated` (prov.) with Admin 1's uid; ids only.
- **Don't assert:** time.

### Block J — Directory list, search and paging

Search cases assert the result set of the directory query (prov.: `searchTokens`, `lotKey`
index); J3, J8, J9, J14 and J15 are the screen cases.

#### TC-03-J1 — A search for "blk 4" returns every Block 4 household
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set and Household A.
- **Action:** search "blk 4".
- **Expected:** results include Blk 4 Lots 1–6 and Blk 4 Lot 12.
- **Don't assert:** order.

#### TC-03-J2 — A search for "blk 4" returns no household from Blocks 40 to 49 or Blk 14
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** as J1.
- **Expected:** no result from Blocks 40–49 or Blk 14 Lot 4.
- **Don't assert:** the "Showing x of y" text.

#### TC-03-J3 — Typing re-renders only the list, keeping focus and text
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** type "blk 4" one key at a time in "Search name or lot".
- **Expected:** focus stays in the box; heading and chips don't re-render; no page reload.
- **Don't assert:** the 200 ms figure.

#### TC-03-J4 — A search for "santos" returns every owner with the word Santos in the name
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set.
- **Action:** search "santos".
- **Expected:** results include "ZZ Test Santos" and "ZZ Test Dos Santos".
- **Don't assert:** order.

#### TC-03-J5 — A search for "santos" doesn't return "Santoson"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as J4.
- **Action:** search "santos".
- **Expected:** "ZZ Test Santoson" not in the results (whole-word rule). **Assumption — pending BA (Q17).**
- **Don't assert:** results for partial words ("san").

#### TC-03-J6 — Search ignores letter case
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** search "BLK 4", then "SANTOS".
- **Expected:** same result sets as J1 and J4.
- **Don't assert:** order.

#### TC-03-J7 — "pena" and "peña" find "ZZ Test Peña" by one stated rule
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set.
- **Action:** search "peña", then "pena".
- **Expected:** "peña" returns it; "pena" per BA. **Assumption — pending BA (Q17).**
- **Don't assert:** "pena" until Q17.

#### TC-03-J8 — A search with no match says so, distinct from the empty directory
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** type "zzqqxx".
- **Expected:** a no-match message; not the empty-directory text (J9).
- **Don't assert:** wording.

#### TC-03-J9 — The empty directory shows the empty state and its three actions
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** empty directory; Admin 1.
- **Action:** open Homeowners.
- **Expected:** "No households yet. Import your list or add the first household." with Import households, Add household, Download template (mock-up 3D).
- **Don't assert:** layout.

#### TC-03-J10 — The first page holds 50 households and the 51st is on the next page
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** two directories: exactly 50 and exactly 51 households.
- **Action:** run the first-page query, then the next-page query.
- **Expected:** 50: first page 50, next page empty. 51: first page 50, next page 1. Pager control: J15.
- **Don't assert:** order.

#### TC-03-J11 — Opening the directory reads about one page, not every household
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Directory 623; special staging: emulator read counter.
- **Action:** open Homeowners.
- **Expected:** reads near 50 plus overhead, far below 623.
- **Don't assert:** an exact count.

#### TC-03-J12 — Search results over 50 page the same way
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Directory 623 with 60 owners named "Automation Owner".
- **Action:** search "automation"; fetch the next page.
- **Expected:** 50 then 10.
- **Don't assert:** order.

#### TC-03-J13 — An inactive household is excluded from search under All and found under Inactive
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C inactive.
- **Action:** search "charlie" under All, then under Inactive.
- **Expected:** not returned under All; returned under Inactive (assumption: search applies within the chosen chip).
- **Don't assert:** chip counts.

#### TC-03-J14 — Each filter chip's count matches the rows it lists
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** fixtures in each link status plus one inactive; also after A3 ("Not invited (623)").
- **Action:** choose each chip.
- **Expected:** count shown equals rows listed.
- **Don't assert:** whether All includes inactive (gap Q18).

#### TC-03-J15 — With exactly 50 households no next-page control is offered
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** the two directories from J10.
- **Action:** open Homeowners.
- **Expected:** 50: no next-page control. 51: a next-page control that shows the one remaining household.
- **Don't assert:** pager control style.

### Block K — Responsive, usability and UI/UX

#### TC-03-K1 — On a 375 px phone each household shows as a card with lot, owner, link status and balance
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set; Admin 1; **phone emulation with `isMobile`** (not a narrowed desktop window: DEF-001).
- **Action:** open Homeowners.
- **Expected:** cards, not a table, each with the four items. Fails until DEF-001 is fixed; that is QE's finding to report.
- **Don't assert:** card height.

#### TC-03-K2 — The phone directory doesn't scroll sideways
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** as K1, plus the 80-character name from C4.
- **Action:** measure scroll width.
- **Expected:** equals viewport width.
- **Don't assert:** wrap points.

#### TC-03-K3 — Balance shows "—" before the first billing run, not ₱0
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as K1; no billing run exists.
- **Action:** read a card's balance.
- **Expected:** "—" (copy of record; mock-up 3B reads "Balance —").
- **Don't assert:** label styling.

#### TC-03-K4 — 640 px shows cards; 641 px shows the table
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** phone emulation at 640 and 641 px.
- **Action:** open Homeowners.
- **Expected:** 640: cards. 641: table.
- **Don't assert:** pixel-perfect layout.

#### TC-03-K5 — On a phone the import page says "Import works best on a computer"
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** 375 px phone emulation.
- **Action:** open Import households.
- **Expected:** the note shown; file input and Download template still available.
- **Don't assert:** preview table layout on the phone.

#### TC-03-K6 — The Add dialog is usable at 375 px
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** Yes
- **Setup:** 375 px phone emulation.
- **Action:** add Blk 33 Lot 1.
- **Expected:** every field and Save reachable without sideways scroll; Mobile opens a phone keypad; the focused field isn't hidden by the keyboard.
- **Don't assert:** keyboard height.

#### TC-03-K7 — Loading shows a skeleton, never a flash of the empty state
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** throttled network; a populated directory.
- **Action:** open Homeowners.
- **Expected:** skeleton, then rows; the empty-state text never appears.
- **Don't assert:** skeleton shape.

#### TC-03-K8 — A network error on Import keeps the preview
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** preview shown; go offline.
- **Action:** press Import.
- **Expected:** preview still shown with a text error; nothing shown as done. **Assumption:** how the SDK surfaces an offline callable is not asserted.
- **Don't assert:** error wording; retry timing.

#### TC-03-K9 — A click outside the Add dialog keeps it open with the typed name
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Add household open; owner "ZZ Test Owner Hotel" typed.
- **Action:** click the backdrop.
- **Expected:** dialog open; name still typed.
- **Don't assert:** any shake or animation.

#### TC-03-K10 — A click outside the Edit dialog keeps unsaved changes
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A edit form; mobile changed, not saved.
- **Action:** click the backdrop.
- **Expected:** dialog open; changed value still there.
- **Don't assert:** animation.

#### TC-03-K11 — Escape on a half-filled dialog follows one stated rule
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as K9.
- **Action:** press Escape.
- **Expected:** per BA. NAV-06 closes every modal on Escape, which would lose the typing REQ-003 protects. **Assumption — pending BA (Q19).**
- **Don't assert:** either outcome until Q19.

#### TC-03-K12 — An important-announcement pop-up doesn't break the preview or Add dialog
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
- **Setup:** an important announcement unseen by Admin 1 (NAV-05 behaviour); Admin 1 opens Import or Add.
- **Action:** dismiss the pop-up; continue.
- **Expected:** preview or dialog intact; the next press of Import / Save is accepted.
- **Don't assert:** when the pop-up appears.

#### TC-03-K13 — Link status pills carry words and meet AA contrast
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** one fixture in each of the five link statuses.
- **Action:** inspect pills.
- **Expected:** words "Not invited", "Invited", "Linked", "Invite expired", "Email failed" (copy of record); text contrast ≥ 4.5:1.
- **Don't assert:** the colour values.

#### TC-03-K14 — The preview table has a caption, row numbers and text reasons
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** as A5.
- **Action:** inspect with a screen reader or accessibility tree.
- **Expected:** a table caption (mock-up: "Row numbers match your file"); row numbers; reasons readable without colour.
- **Don't assert:** caption wording until confirmed (mock-up only).

#### TC-03-K15 — The whole import works by keyboard with a visible file-input label
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
- **Setup:** empty directory; 3-row file.
- **Action:** keyboard only from Homeowners to the finished banner.
- **Expected:** file input has a visible label; focus always visible and not hidden by sticky bars (WCAG 2.2 2.4.11).
- **Don't assert:** tab order beyond "logical".

#### TC-03-K16 — Form errors are announced and Save moves focus to the first error
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Add household, empty.
- **Action:** press Save.
- **Expected:** focus on the first invalid field; its message is announced.
- **Don't assert:** announcement wording.

#### TC-03-K17 — Buttons and chips are at least 24 × 24 px on a phone
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** 375 px phone emulation.
- **Action:** measure chips, Open, Add, Import.
- **Expected:** each ≥ 24 × 24 px (WCAG 2.2 2.5.8).
- **Don't assert:** exact sizes.

#### TC-03-K18 — The same concept uses the same word on every screen
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** directory, chips, phone cards, REQ-004 screens.
- **Action:** compare link status words and button labels.
- **Expected:** identical words; phone "Import" vs desktop "Import households" only if confirmed. **Assumption — pending BA (Q20).**
- **Don't assert:** the phone label until Q20.

#### TC-03-K19 — The page heading reads "Homeowners · {n} households" with the stored count
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3 (623 households); also after A14 (3).
- **Action:** open Homeowners.
- **Expected:** "Homeowners · 623 households"; "Homeowners · 3 households". Refresh after writes: P6.
- **Don't assert:** whether inactive households count (gap Q18); singular form (gap Q3).

#### TC-03-K20 — The preview heading and Import button read the copy of record with the preview's counts
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** three previews: A1 (623 clean), A5 (619 / 4), A9 (3 ready, one skipped).
- **Action:** read the preview heading and Import button.
- **Expected:** A1: "623 households ready to import", no list of rows that won't be imported, button "Import 623 households". A5: "619 households ready to import · 4 rows won't be imported", button "Import 619 households". A9: button "Import 3 households".
- **Don't assert:** A9's "{m} rows won't be imported" figure (gap Q5); tile layout.

#### TC-03-K21 — Each preview row reason reads the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; one file with a row for each reason: no lot, no block, no owner name, Blk 2 Lot 7 twice, Blk 4 Lot 12, email `zz-ana@`, mobile `0900000001`.
- **Action:** read each rejected row's reason.
- **Expected:** "Lot number is missing"; "Block is missing"; "Owner name is missing"; "Blk 2 Lot 7 appears more than once in the file" (both rows); "Already in the directory, skipped"; "\"zz-ana@\" is not a valid email address"; "\"0900000001\" is not a valid mobile number". The C-block and A5 cases rely on this case for wording.
- **Don't assert:** reason order on a row with two problems (C21).

#### TC-03-K22 — The finished banner reads the copy of record with the run's counts
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after A8 (619 / 4); after A3 (623 / 0).
- **Action:** read the banner.
- **Expected:** A8: "Imported 619 households. 4 rows were not imported. Download them to fix and import again." with "Download them" working (content E1). A3: starts "Imported 623 households."
- **Don't assert:** A3's "{m} rows were not imported" part (gap Q5); banner position.

#### TC-03-K23 — The duplicate-lot message reads "{lot} is already in the directory." under Lot and Save is disabled
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** as F3; also the losing session of F6.
- **Action:** leave the Lot field; read the message.
- **Expected:** "Blk 8 Lot 2 is already in the directory." under Lot, tied to the field for screen readers; Save disabled (mock-up 3E). F6's losing session shows "Blk 9 Lot 1 is already in the directory." (assumption: same copy).
- **Don't assert:** the delay before it appears.

#### TC-03-K24 — The stale-edit message reads the copy of record and the dialog keeps the typing
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as G6 (Admin 2's session); also G8 tab 2.
- **Action:** read the dialog after the refused save.
- **Expected:** "Someone else changed this household. Reload to see the latest, then make your change again."; dialog stays open with the typed 0900 000 0092.
- **Don't assert:** message placement.

#### TC-03-K25 — The import hint and the directory buttons read the copy of record
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1 on Homeowners, then on Import households.
- **Action:** read the buttons and the hint.
- **Expected:** buttons "Import households", "Add household", "Download template"; hint "Fill in the template and save it as CSV UTF-8."
- **Don't assert:** the phone label (K18).

#### TC-03-K26 — An import run from a phone stores the file's households
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** Yes
- **Setup:** 375 px phone emulation; empty directory; 3-row file.
- **Action:** choose the file and commit on the phone; read the records.
- **Expected:** 3 household records.
- **Don't assert:** preview table layout on the phone.

### Block L — Navigation

#### TC-03-L1 — Admin reaches Homeowners from the menu with that item highlighted
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1 on Dashboard.
- **Action:** choose Homeowners.
- **Expected:** Homeowners page; exactly one menu item, Homeowners, has `aria-current` (NAV-03).
- **Don't assert:** menu order (TC-02).

#### TC-03-L2 — Treasurer reaches Homeowners from the menu
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Treasurer on Dashboard.
- **Action:** choose Homeowners.
- **Expected:** Homeowners page with Import households and Add household.
- **Don't assert:** menu order.

#### TC-03-L3 — "Choose a different file" returns to step 1
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** preview of a 3-row file.
- **Action:** press "Choose a different file".
- **Expected:** step 1 with an empty file input. That nothing is saved by a preview: A2.
- **Don't assert:** whether the old run record remains (Q13).

#### TC-03-L4 — Cancel on the preview returns to Homeowners
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** as L3.
- **Action:** press Cancel.
- **Expected:** Homeowners, with Homeowners still highlighted in the menu. Nothing saved: A2.
- **Don't assert:** scroll position.

#### TC-03-L5 — After the import finishes, the admin is on Homeowners with the banner
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
- **Setup:** 3-row file previewed.
- **Action:** commit.
- **Expected:** Homeowners with the finished banner (mock-up 3D; wording K22).
- **Don't assert:** whether the banner is dismissible.

#### TC-03-L6 — Browser Back after a finished import doesn't import again
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after L5.
- **Action:** browser Back; press any Import button shown.
- **Expected:** no extra household records (pairs with D12).
- **Don't assert:** which page Back shows.

#### TC-03-L7 — Reloading on the preview shows step 1 or the restored preview, by one stated rule
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** preview shown.
- **Action:** reload.
- **Expected:** step 1 or the preview restored. **Assumption — pending BA (Q13).** Nothing saved: L15.
- **Don't assert:** which of the two.

#### TC-03-L8 — After Save in Add, the list keeps its search and filter
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
- **Setup:** search "blk 4" active; Add dialog open.
- **Action:** add Blk 4 Lot 7; Save. Repeat with Cancel.
- **Expected:** list still filtered to "blk 4" after both; after Save it includes Lot 7.
- **Don't assert:** scroll position.

#### TC-03-L9 — A board member opening the Homeowners address gets the no-access page, with no rows shown first
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Board Member signed in.
- **Action:** open the Homeowners address directly.
- **Expected:** "You don't have access to this page" with "Go to my dashboard" (REQ-002); no rows flash first. Data refusal: M1.
- **Don't assert:** the address format.

#### TC-03-L10 — A guard opening the Homeowners or Import address gets the no-access page
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Guard.
- **Action:** open each address directly.
- **Expected:** no-access page for both. Data refusal: M3.
- **Don't assert:** the address format.

#### TC-03-L11 — A homeowner opening the Homeowners or Import address gets the no-access page
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Homeowner A.
- **Action:** open each address directly.
- **Expected:** no-access page for both. Data refusal: M7.
- **Don't assert:** the address format.

#### TC-03-L12 — A user with no role or household gets the "not linked" screen, never the directory
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test No-Role User.
- **Action:** open the Homeowners address.
- **Expected:** REQ-001's "not linked" screen or the no-access page; never directory content.
- **Don't assert:** which of the two (REQ-001 / REQ-002 decide).

#### TC-03-L13 — In "My household" view the treasurer-homeowner has no Homeowners item
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Treasurer-Homeowner.
- **Action:** switch to "My household".
- **Expected:** no Homeowners menu item; switching back to Treasurer shows it.
- **Don't assert:** switch styling.

#### TC-03-L14 — Homeowners is absent from the Board, Guard and Homeowner menus
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** each role signed in.
- **Action:** read the menu.
- **Expected:** no Homeowners item. Overlaps TC-02; QE de-duplicates.
- **Don't assert:** the rest of the menu.

#### TC-03-L15 — Reloading on the preview stores no household
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** as L7.
- **Action:** reload; read the records for the file's lots.
- **Expected:** no household, lot or contact record for any of them. **Assumption — pending BA (Q13).**
- **Don't assert:** the run record's state.

### Block M — Role and security

Each case asserts the request is refused with a permission error (or, for M13 and N12,
allowed). Where a write is attempted, no record written is the proof of the refusal.

#### TC-03-M1 — A board member's request for the household list is refused
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Board Member.
- **Action:** query `households` (prov.).
- **Expected:** refused explicitly.
- **Don't assert:** error text.

#### TC-03-M2 — A board member's request for a household's contacts is refused
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Board Member.
- **Action:** read `householdContacts/{A}` (prov.).
- **Expected:** refused explicitly.
- **Don't assert:** error text.

#### TC-03-M3 — A guard's request for the household list is refused
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Guard.
- **Action:** query `households`.
- **Expected:** refused explicitly.
- **Don't assert:** error text.

#### TC-03-M4 — A guard's request for any household's contacts is refused
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Guard.
- **Action:** read `householdContacts/{A}`.
- **Expected:** refused explicitly.
- **Don't assert:** error text.

#### TC-03-M5 — A homeowner's request for their own household's contacts is refused
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Homeowner A.
- **Action:** read `householdContacts/{A}`.
- **Expected:** refused explicitly.
- **Don't assert:** error text.

#### TC-03-M6 — A homeowner's request for another household is refused
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Homeowner A.
- **Action:** read `households/{B}`.
- **Expected:** refused explicitly.
- **Don't assert:** error text.

#### TC-03-M7 — A homeowner's query for the household list is refused
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Homeowner A.
- **Action:** query `households` without a household filter.
- **Expected:** refused explicitly.
- **Don't assert:** error text.

#### TC-03-M8 — Create, update and set-active calls are refused for Board, Guard, Homeowner and No-role
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** each of the four users.
- **Action:** call `createHousehold`, `updateHousehold`, `setHouseholdActive` (prov.).
- **Expected:** each refused explicitly; no household, lot or contact record created or changed.
- **Don't assert:** error text. QE may split per role.

#### TC-03-M9 — Import preview and commit calls are refused for Board, Guard, Homeowner and No-role
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** each of the four users; a 3-row payload.
- **Action:** call `previewHouseholdImport`, `commitHouseholdImport` (prov.).
- **Expected:** each refused explicitly; no import-run record created.
- **Don't assert:** error text.

#### TC-03-M10 — A direct client write to a household is refused, even for an admin
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1, client SDK.
- **Action:** write `households/{A}.displayName`.
- **Expected:** refused explicitly (clients never write households); display name unchanged.
- **Don't assert:** error text.

#### TC-03-M11 — Direct client writes to lots, contacts and import runs are refused for every role
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1, Treasurer, Homeowner A.
- **Action:** write `lots/{new}`, `householdContacts/{A}`, `importRuns/{new}` (prov.).
- **Expected:** each refused explicitly.
- **Don't assert:** error text.

#### TC-03-M12 — A removed admin holding a valid token is refused the list and contacts
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** special staging: ZZ Test Removed Admin signs in; role removed (`staff/{uid}` deleted, prov.) while the token is still valid.
- **Action:** query `households`; read `householdContacts/{A}`.
- **Expected:** both refused explicitly.
- **Don't assert:** UI redirect timing (TC-02).

#### TC-03-M13 — Admin and treasurer may read the list and contacts
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1; Treasurer.
- **Action:** query `households`; read `householdContacts/{A}`.
- **Expected:** both allowed (positive control for M1–M12).
- **Don't assert:** payload field names.

#### TC-03-M14 — A signed-out request for any household collection is refused
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** no user.
- **Action:** read `households`, `householdContacts`, `lots`, `importRuns`.
- **Expected:** each refused explicitly.
- **Don't assert:** error text.

#### TC-03-M15 — Board, Guard and Homeowner reads of import runs are refused
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** an existing run; each of the three users.
- **Action:** query `importRuns`.
- **Expected:** each refused explicitly.
- **Don't assert:** another admin's access (Q12).

#### TC-03-M16 — Household audit records are readable by treasurer and board
**Priority** P3 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** after G2; Treasurer, Board Member, Admin 1, Guard.
- **Action:** read the `household.updated` record.
- **Expected:** treasurer and board allowed; guard refused explicitly; admin per BA. **Assumption — pending BA (Q15).**
- **Don't assert:** admin outcome until Q15.

### Block N — Data integrity and privacy

#### TC-03-N1 — No household document holds an email or mobile
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3, F1, G1.
- **Action:** scan `households` documents (prov.).
- **Expected:** no field holds a fixture email or mobile; those exist only in `householdContacts`.
- **Don't assert:** other field names.

#### TC-03-N2 — A homeowner's own household record carries no contacts
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Homeowner A.
- **Action:** read `households/{A}`.
- **Expected:** the payload has no email or mobile (after a sale a new owner never sees the old owner's contacts). Read permission: N12.
- **Don't assert:** which other fields are present.

#### TC-03-N3 — Every mobile is stored in one format
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after C6 committed.
- **Action:** read the six contact records.
- **Expected:** all in the same shape (`+639…`, prov.).
- **Don't assert:** the display format here (C24 does).

#### TC-03-N4 — Each imported household has one lot entry and one contact record
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3.
- **Action:** count `households`, `lots`, `householdContacts` (prov.).
- **Expected:** 623 each; every lot entry points to an existing household.
- **Lane:** exclusive — asserts collection-wide counts.
- **Don't assert:** document ids.

#### TC-03-N5 — Adding a household writes one `household.created` record
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after F1.
- **Action:** read audit records for Blk 8 Lot 2.
- **Expected:** one `household.created` (prov.) with Admin 1's uid.
- **Don't assert:** time.

#### TC-03-N6 — An import writes one completion record with 619 imported and 4 not imported
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8.
- **Action:** read the `import.completed` record (prov.).
- **Expected:** one record: 619 imported, 4 not imported, matching the run record (A8).
- **Don't assert:** whether per-row `household.created` records are also written.

#### TC-03-N7 — Household audit records hold no names, emails or mobiles
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8, F1, G1, H2.
- **Action:** scan the audit records they wrote.
- **Expected:** ids and action codes only.
- **Don't assert:** field names.

#### TC-03-N8 — Function logs after an import hold no row data
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** special staging: emulator or staging log access; after A5 and A8.
- **Action:** search logs for fixture names, emails and mobiles.
- **Expected:** none found (CS-14).
- **Don't assert:** log volume.

#### TC-03-N9 — The uploaded file itself is not stored
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8.
- **Action:** list Storage.
- **Expected:** no object for the upload.
- **Don't assert:** other Storage paths.

#### TC-03-N10 — Rejected rows are deleted from an import run after 30 days
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two runs dated 31 and 29 Asia/Manila days ago; trigger the daily job.
- **Action:** read both runs.
- **Expected:** the 31-day run has no rejected rows (counts kept); the 29-day run is intact. 30 days pending DPO.
- **Don't assert:** the job's run time.

#### TC-03-N11 — Personal data never appears in the address bar
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1.
- **Action:** search "santos"; open Household A; open Import.
- **Expected:** no name, email, mobile or search text in the URL (SA-001 §8.2).
- **Don't assert:** the URL format.

#### TC-03-N12 — A homeowner's read of their own household is allowed
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Homeowner A.
- **Action:** read `households/{A}` (prov.).
- **Expected:** allowed (positive control for M6; SA-001 "every member reads `households/{id}`").
- **Don't assert:** payload contents (N2).

### Block P — Integration and derived figures

#### TC-03-P1 — An invitation for an imported household goes to its contact email
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after A3; staging mail allow-list includes automation addresses.
- **Action:** invite Automation Owner 001's household (REQ-004).
- **Expected:** the invitation record (and outgoing mail) is addressed to automation-001@example.test.
- **Don't assert:** delivery.

#### TC-03-P2 — An edited contact email is used by the next invitation
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F; set email zz-owner-f@example.test.
- **Action:** invite Household F.
- **Expected:** the invitation is addressed to zz-owner-f@example.test.
- **Don't assert:** delivery.

#### TC-03-P3 — The join screen shows the current owner name after an edit
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F renamed "ZZ Test Owner India"; a printed code for it.
- **Action:** No-Role User enters the code.
- **Expected:** "You're joining Blk 12 Lot 12-A" with "ZZ Test Owner India" (REQ-004 screen).
- **Don't assert:** layout.

#### TC-03-P4 — Editing a household doesn't reset its link status or member count
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A "Linked", one member.
- **Action:** edit its mobile; Save; read the household record.
- **Expected:** link status still Linked; member count still 1.
- **Don't assert:** fields not named.

#### TC-03-P5 — A household with no email counts in REQ-004's "have no email" figure
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F (no email) and C12's household selected with one household that has an email.
- **Action:** start "Invite selected" (REQ-004).
- **Expected:** 1 household sendable by email; 2 counted as having no email. The confirm wording ("Send 1 invitations? 2 households have no email. Print their slips instead.") is REQ-004 copy and belongs to TC-04.
- **Don't assert:** singular grammar.

#### TC-03-P6 — The heading count updates after add, import, deactivate and reactivate without a reload
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a known starting directory.
- **Action:** add one; import 3; deactivate one; reactivate it.
- **Expected:** "Homeowners · {n} households" follows each step (wording: K19).
- **Lane:** exclusive — asserts the directory total.
- **Don't assert:** whether inactive counts (gap Q18).

#### TC-03-P7 — The admin dashboard's household count matches the directory after an import
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after A3; only if the R1 dashboard shows a count (the mock-up does).
- **Action:** open Dashboard.
- **Expected:** same count as Homeowners.
- **Lane:** exclusive — asserts the dashboard household total.
- **Don't assert:** other tiles.

### Block Q — Back-compat

#### TC-03-Q1 — The real directory holds none of the mock-up's 20 sample households
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
- **Setup:** fresh test project.
- **Action:** read `households` (prov.).
- **Expected:** no household records. Empty-state screen: J9.
- **Don't assert:** anything about the mock-up.

#### TC-03-Q2 — An edit to a household with no phase saves and leaves the phase not set
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F (phase null).
- **Action:** edit the mobile without choosing a phase; Save; read the record.
- **Expected:** save accepted; phase still null (prov.). "Not set" display: C27.
- **Don't assert:** phase list contents.

#### TC-03-Q3 — A household doc without link status or member count renders as "Not invited"
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
- **Setup:** special staging: old-shape document seeded with no `linkStatus` or `memberCount` (as if created before the REQ-004 functions deploy).
- **Action:** open Homeowners.
- **Expected:** row renders with "Not invited"; no page error. **Assumption — pending BA (Q21).**
- **Don't assert:** member count display.

### Block X — Exploratory

#### TC-03-X1 — Charter: break the import with messy spreadsheets (45 min)
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Admin 1; empty test directory; invented data only.
- **Action (charter):** merged header rows, hidden columns, leading apostrophes, non-breaking spaces, tabs, emoji in names, Excel-mangled mobiles, quoted newlines, a 10,000-row file.
- **Expected:** look for wrong row numbers, silently dropped rows, shifted columns, frozen pages; log findings.
- **Don't assert:** anything beyond the charter notes.

#### TC-03-X2 — Charter: two staff, one directory (30 min)
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions (Admin 1, Treasurer) at once.
- **Action (charter):** interleave add, edit, deactivate, reactivate and import on the same lots.
- **Expected:** look for duplicates, lost edits, wrong stale messages, counts that don't add up.
- **Don't assert:** anything beyond the charter notes.

#### TC-03-X3 — Charter: phone directory one-handed (20 min)
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Admin 1; 375 px phone emulation.
- **Action (charter):** find a household by lot and by name, correct a mobile, deactivate, all one-handed.
- **Expected:** look for sideways scroll, buttons hidden by the keyboard, small targets, lost focus.
- **Don't assert:** anything beyond the charter notes.

## Coverage summary

r2 split 43 v1 cases by behaviour into 41 new cases (196 → 237). Ids from v1 are unchanged; new ids take the next free number in their block.

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Import: preview and happy path | 14 | 11 |
| B | Import: file boundaries and negatives | 24 | 8 |
| C | Field validation and lot-key normalisation | 27 | 10 |
| D | Commit, idempotency, re-import, concurrency | 21 | 15 |
| E | Rejected-rows report and download | 7 | 3 |
| F | Add household | 15 | 6 |
| G | Edit and stale edits | 14 | 6 |
| H | Deactivate and reactivate | 18 | 6 |
| J | List, search, paging | 15 | 4 |
| K | Responsive, usability, UI/UX, copy of record | 26 | 5 |
| L | Navigation | 15 | 5 |
| M | Role and security | 16 | 14 |
| N | Data integrity and privacy | 12 | 5 |
| P | Integration and derived figures | 7 | 4 |
| Q | Back-compat | 3 | 0 |
| X | Exploratory | 3 | 0 |
| **Total** | | **237** | **102** |


## Requirement gaps for the BA

Each blocks a precise expected result. Cases that assume an answer are labelled
"assumption — pending BA".

| # | Question | Cases |
|---|---|---|
| Q1 | What are the maximum rows and file size for one import, and the copy when exceeded? | B17, B18, B19 |
| Q2 | What does the admin see for an empty file, a header-only file, a file with zero valid rows, a missing / renamed / reordered / extra column, or a non-comma separator? Is Import hidden, disabled, or "Import 0 households"? | B1, B2, B4, B12–B15, B19, B21, B23, D15 |
| Q3 | Singular copy: "Import 1 household(s)", "1 household(s) ready", heading "1 household(s)"? | B3, K19 |
| Q4 | Encoding and line endings: is a UTF-8 BOM accepted (Excel "CSV UTF-8" writes one)? CR-only / mixed endings? Trailing blank lines? The refusal copy "Save the file as CSV UTF-8 and upload it again." is in the Sol Arch review but not REQ-003's copy table: confirm it. | B5, B6, B9, B10, B20 |
| Q5 | Does "Already in the directory, skipped" count in "{m} rows won't be imported" and in the finished banner, and is it in the rejected-rows download? (Gherkin 2 counts 4; mock-up 3C shows a separate "Already in the directory" tile.) When a lot is duplicated in the file *and* already exists, which reason is shown? | A3, A9, C20, E2, K20, K22 |
| Q6 | Import run states: is there a `completed` / `failed` state, and how does an admin resume an interrupted import (SA says rerun continues; also says commit refuses unless `previewed`)? When two imports race, must the second report *every* row skipped, or may the rows interleave? | D6, D7 |
| Q7 | Missing copy: owner name over 80 characters; several problems on one row (all reasons or first); does the import strip a leading `'` added by the escaped download? | C5, C21, E4 |
| Q8 | Lot-key normalisation: are lot values trimmed, case-folded ("12-a" = "12-A") and leading zeros ignored ("012" = "12")? Block rules for "4A", 0, negatives, > 99. Accepted Phase values ("Phase 2", "2", "P2")? Plus decision 2 (phase in the key) still open. | C15–C18 |
| Q9 | Inactive households: may they be edited? Does an inactive lot still block a new add / import of that lot, and should the message point to Reactivate? Is Deactivate on an inactive household refused or a no-op? Does a stale-edit check trip on deactivation? | D16, D21, F9, G9, H10 |
| Q10 | After Reactivate, what is the link status, and does a cancelled invitation stay cancelled? | H8 |
| Q11 | For an "Email failed" or "Invite expired" household that is deactivated, are Resend / Print slip offered? | H13 |
| Q12 | Can one staff member see or download another staff member's import run and its rejected rows? | E6 |
| Q13 | Does Cancel or a reload on the preview delete the run record, and what does reload show? | A2, L7, L15 |
| Q14 | Can Block / Lot be changed on edit? If so, what happens to the old lot key? | G11 |
| Q15 | Audit read access: REQ-003 says board and treasurer read the change record; may admin office staff? The activity log screen is backlog story 06, so Gherkin 8's "activity log records" is verifiable only at record level in R1: confirm. | G2, M16 |
| Q16 | Where are Edit, Deactivate and Reactivate reached from (row click, detail pop-up, menu)? Not in the mock-ups. | Smoke item 4, H-block |
| Q17 | Search: does a partial word ("san") match? Do "pena" and "peña" match each other? Which forms of block search work ("block 4", "b4", "4", "blk 4 lot 12")? | J5, J7 |
| Q18 | Do "All ({n})" and the page heading count include inactive households? | J14, P6 |
| Q19 | Escape on a half-filled Add / Edit dialog: close (existing NAV-06) or keep (REQ-003's "typing is not lost")? | K11 |
| Q20 | Phone button "Import" vs desktop "Import households" (mock-up 3B): intended? | K18 |
| Q21 | Back-compat for a household doc without `linkStatus` / `memberCount`: should it render as "Not invited"? | Q3 |
