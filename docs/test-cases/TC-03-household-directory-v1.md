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
| Status | Draft v1, for owner approval. Not ready for QE until approved |

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
| Active | Allowed after confirm; hidden from default list, listed under Inactive, records kept | Not offered; a direct call is refused or is a no-op (assumption — pending BA, Q9) | Confirm promises: "won't be billed" (not verifiable in R1, billing REQ), "won't be shown in the list" (H2), "unused invitation stops working" (H4), "records are kept" (H3) | H1–H5, H9 |
| Inactive | Not offered; a direct call is refused or is a no-op (assumption — pending BA, Q9) | Allowed; back in the default list | "Reactivate" restores the list entry; does not resurrect a cancelled invitation (assumption — pending BA, Q10) | H6–H8, H10 |

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
| 1 | Import the household list | A1, A2, A3, A4 |
| 2 | Rows with problems are shown, not imported | A5, A6, A7, A8 |
| 3 | Importing a lot that already exists does not duplicate it | A9, A10, A11 |
| 4 | Pressing Import twice imports once | D2, D3, D4 |
| 5 | Two admins import the same file at the same time | D5, D6 |
| 6 | Add one household | F1, F2 |
| 7 | The same lot can't be added twice | F3, F4, F5, F6 |
| 8 | Correct a contact number | G1, G2, G3 |
| 9 | Two admins edit the same household | G6, G7 |
| 10 | A household is deactivated, not deleted | H1, H2, H3, H4 |
| 11 | Typing in a half-filled form is not lost | K9, K10 |
| 12 | Search by block | J1, J2, J3 |
| 13 | Search by name | J4, J5 |
| 14 | Readable on a phone | K1, K2, K3, K4 |
| 15 | Only the office and the treasurer can change households | M1, M2 |

Unhappy paths are included in every row above; the rest of the plan widens them.

### 3. Regression

**What else could break, and why**

| Area | Why it is at risk | Cases / re-run |
|---|---|---|
| `households/{id}` shape | Every later feature (billing, payments, bookings, vehicles, passes) reads it; homeowners read their own. Contacts must never land on it | N1, N2, M5 |
| Rules helpers `isStaff()`, `hasRole()`, `isMember()` (prov.) | Shared with every collection in REQ-002; adding household rules can widen or break them | M-block; re-run TC-02 rules matrix |
| REQ-004 invitations | Read `displayName`, `contactEmail`, `active`; write `linkStatus`, `memberCount`. A rename of a field or an edit that rewrites the household doc could wipe `linkStatus` | P1–P5; re-run TC-04 invite and redeem cases |
| Shared modal (`ui/modal.js`, mock-up `.modal`) | REQ-003 says no close on backdrop; existing NAV-06 says Escape closes any modal. One change to the shared modal moves every dialog in the app | K9–K11; re-run NAV-06 |
| Shared table and pills (`ui/table.js`, `.pill`) | Link status reuses payment pill colours; a change ripples to Approvals and Dues | K13; re-run SMK-admin-approvals |
| Phone layout | DEF-001 is open: no viewport meta, so cards never appear on a real phone | K1–K4 under phone emulation; re-run NAV-07, NAV-08 |
| Household count shown elsewhere | Mock-up's admin Dashboard ("{n} households"), Announcements ("Seen by x of N households"), Collections, Reports read the household list | P6, P7 (derived figure) |
| Mock-up Homeowners screen | `aHo()` is replaced; its free-text `contact` column and detail pop-up go away | Q1; re-run SMK-admin-homeowners |
| Audit log | Written by every privileged action; a household write without audit breaks accountability | N5–N8 |

**Known failure patterns applied**

| Pattern | Applies? | Where |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Import 619 households", "Imported {n}…", "Skipped, not changed", Deactivate confirm, "{lot} is already in the directory." | A4, A8, A11, D6, H1–H4, F3; "won't be billed" flagged as unverifiable in R1 |
| A value written for one role, never shown back | Yes: phase, contacts, audit | Round-trip register R3, R6, R7, R12 |
| Status-gated rule checked for one transition only | Yes: active, link status, import run status, edit freshness | S1–S4 tables |
| Same concept, different word on another screen | Yes: "Import households" vs mobile "Import"; "Homeowners" page vs "households" count; "Inactive" chip vs "Deactivate"; link status words in REQ-003 vs REQ-004 | K18 |
| Dates computed in UTC where the user means local | Low: no due dates here; audit "when" and the 30-day retention cut-off; invite expiry date | N10, H12 (build dates from Asia/Manila local today) |
| A derived figure doesn't refresh after a related write | Yes: heading count, chip counts, search tokens after rename | P6, P7, G4 |
| Zero and "not set" look the same | Yes: empty directory vs search with no match; "—" balance vs ₱0; phase "Not set"; no email vs invalid email; 0 valid rows | J8, J9, K3, C12, C18, B4 |
| A write silently refused by security rules | Yes: every direct client write and refused callable | M-block asserts the refusal, never "nothing changed" |
| Double-tap / two devices create duplicates | Yes: Import, Save (add), Save (edit), Deactivate | D2–D5, F5, F6, G10, H9 |
| Stale reference | Yes: stale edit, preview then lot added, edit of a household deactivated meanwhile, import vs form on the same lot | G6–G9, D8, D9 |
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

### Block A — Import: preview and happy path

#### TC-03-A1 — A clean 623-row file previews as "623 households ready to import"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** empty directory; ZZ Test Admin 1; `ZZ-import-623-clean.csv`.
- **Action:** Homeowners → Import households → choose the file.
- **Expected:** preview heading reads "623 households ready to import"; no list of rows that won't be imported; button reads "Import 623 households".
- **Don't assert:** time taken; the import id.

#### TC-03-A2 — The preview alone saves no household
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** as A1, preview shown.
- **Action:** press Cancel on the preview.
- **Expected:** Homeowners shows the empty state; no `households`, `lots` or `householdContacts` documents exist (prov.).
- **Don't assert:** whether the import-run record is deleted on Cancel (gap Q13).

#### TC-03-A3 — Committing the clean file makes the page read "623 households"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A1.
- **Action:** press "Import 623 households"; wait for it to finish.
- **Expected:** finished banner starts "Imported 623 households."; heading "Homeowners · 623 households".
- **Don't assert:** whether the banner's "{m} rows were not imported" part is absent or reads 0 (gap Q5); row order on page 1.

#### TC-03-A4 — Every imported household shows the link status "Not invited"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after A3.
- **Action:** choose the "Not invited" chip; open the first and last page.
- **Expected:** chip reads "Not invited (623)"; every row's pill reads "Not invited" in words.
- **Don't assert:** the pill colour value.

#### TC-03-A5 — Problem rows are listed with row number and reason, the header counted as row 1
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** empty directory; Admin 1; `ZZ-import-623-problems.csv`.
- **Action:** upload the file.
- **Expected:** exactly four rows listed: 14 "Lot number is missing"; 31 and 32 "Blk 2 Lot 7 appears more than once in the file"; 57 "\"zz-ana@\" is not a valid email address".
- **Don't assert:** list order beyond ascending row number.

#### TC-03-A6 — The import button counts only the rows that will be added
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** as A5.
- **Action:** read the preview heading and button.
- **Expected:** "619 households ready to import · 4 rows won't be imported"; button "Import 619 households".
- **Don't assert:** tile layout.

#### TC-03-A7 — Neither copy of an in-file duplicate lot is imported
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A5.
- **Action:** commit; search "blk 2".
- **Expected:** no Blk 2 Lot 7 in the directory; 619 households in total.
- **Don't assert:** which of rows 31/32 the system saw first.

#### TC-03-A8 — After a partial import the banner states both counts and offers the download
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A7, committed.
- **Action:** read the banner.
- **Expected:** "Imported 619 households. 4 rows were not imported. Download them to fix and import again." with a working download (content in block E).
- **Don't assert:** banner position.

#### TC-03-A9 — A lot already in the directory previews as "Already in the directory, skipped"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A (Blk 4 Lot 12) exists; Admin 1; `ZZ-import-with-B04-L12.csv`.
- **Action:** upload.
- **Expected:** the Blk 4 Lot 12 row reads "Already in the directory, skipped"; button "Import 3 households".
- **Don't assert:** whether that row counts in "{m} rows won't be imported" (gap Q5).

#### TC-03-A10 — The import leaves exactly one Blk 4 Lot 12
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A9.
- **Action:** commit; search "blk 4".
- **Expected:** one Blk 4 Lot 12 row; one lot entry for it (prov.).
- **Don't assert:** total page count.

#### TC-03-A11 — The existing household's name and contacts are unchanged by the import
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A10.
- **Action:** open Blk 4 Lot 12's edit form.
- **Expected:** "ZZ Test Owner Alpha", zz-owner-a@example.test, 0900 000 0001; pill still "Linked".
- **Don't assert:** that the file's different values appear anywhere.

#### TC-03-A12 — The template downloads with the six columns in order
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1 on Import households.
- **Action:** press "Download template".
- **Expected:** a CSV whose header is Block, Lot, Owner name, Email, Mobile, Phase; the page hint reads "Fill in the template and save it as CSV UTF-8."
- **Don't assert:** file name.

#### TC-03-A13 — A treasurer can import end to end
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** Yes
- **Setup:** empty directory; ZZ Test Treasurer; a 3-row clean file.
- **Action:** preview and commit.
- **Expected:** "Imported 3 households."; heading shows 3.
- **Don't assert:** audit record contents (N6).

### Block B — Import: file-level boundaries and negatives

#### TC-03-B1 — A 0-byte file is refused with a message saying what to do
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-empty.csv`.
- **Action:** upload.
- **Expected:** a text message naming the problem and the fix; no preview; no Import button. **Assumption — pending BA (Q2).**
- **Don't assert:** exact wording.

#### TC-03-B2 — A header-only file offers no working Import button
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-header-only.csv`.
- **Action:** upload.
- **Expected:** zero rows ready; Import absent or disabled. **Assumption — pending BA (Q2).**
- **Don't assert:** whether the text says "0 households" or "No rows".

#### TC-03-B3 — A file with one valid row imports one household
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** empty directory; header + 1 valid row.
- **Action:** preview and commit.
- **Expected:** one household listed.
- **Don't assert:** "household" vs "households" in the copy (gap Q3).

#### TC-03-B4 — A file where every row has a problem offers no working Import button
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** header + 3 rows, each with no owner name.
- **Action:** upload.
- **Expected:** 3 rows listed "Owner name is missing"; Import absent or disabled. **Assumption — pending BA (Q2).**
- **Don't assert:** tile values.

#### TC-03-B5 — A file that is not valid UTF-8 is refused with the re-save instruction
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-ansi.csv`.
- **Action:** upload.
- **Expected:** "Save the file as CSV UTF-8 and upload it again."; no preview rows. Copy is from the Sol Arch review, not REQ-003's copy table (gap Q4).
- **Don't assert:** that a garbled name is shown anywhere.

#### TC-03-B6 — A UTF-8 file with a BOM is read correctly, first column included
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** 3 valid rows saved as Excel "CSV UTF-8" (with BOM).
- **Action:** upload.
- **Expected:** "3 households ready to import"; no row says "Block is missing". **Assumption — pending BA (Q4).**
- **Don't assert:** how the BOM is stripped.

#### TC-03-B7 — A UTF-8 file without a BOM is read correctly
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** the same 3 rows with no BOM (as Google Sheets exports).
- **Action:** upload.
- **Expected:** "3 households ready to import".
- **Don't assert:** file name shown.

#### TC-03-B8 — "ñ" in an owner name survives import
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** UTF-8 row with owner "ZZ Test Peña".
- **Action:** preview, commit, search "peña".
- **Expected:** preview and directory show "ZZ Test Peña" exactly.
- **Don't assert:** search with "pena" (J7).

#### TC-03-B9 — CRLF, LF and mixed line endings give the same rows and row numbers
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** one 5-row file saved three ways (CRLF, LF, mixed); row 4 has no lot.
- **Action:** upload each.
- **Expected:** each shows 4 ready and row 4 "Lot number is missing". **Assumption — pending BA (Q4).**
- **Don't assert:** CR-only files until Q4 is answered.

#### TC-03-B10 — A last row with no final newline is read; trailing blank lines are not rows
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** two copies of a 3-row file: no final newline; two blank lines at the end.
- **Action:** upload each.
- **Expected:** both show 3 ready; no "Block is missing" rows. **Assumption — pending BA (Q4).**
- **Don't assert:** row numbers of blank lines.

#### TC-03-B11 — A quoted field containing a comma stays in one column
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner `"ZZ Test Santos, Jr."` with email and mobile.
- **Action:** preview and commit.
- **Expected:** owner "ZZ Test Santos, Jr."; email and mobile in their own fields.
- **Don't assert:** quote characters in the display.

#### TC-03-B12 — A missing required column is reported once for the file
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** template without the Lot column, 3 rows.
- **Action:** upload.
- **Expected:** one file-level message naming the Lot column; no import offered. **Assumption — pending BA (Q2).**
- **Don't assert:** wording.

#### TC-03-B13 — An extra unknown column doesn't block the import and isn't stored
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
- **Setup:** template + a "Notes" column holding "ZZ note text".
- **Action:** preview and commit.
- **Expected:** rows import; "ZZ note text" is in no household or contact record. **Assumption — pending BA (Q2).**
- **Don't assert:** whether the preview warns about the column.

#### TC-03-B14 — Reordered columns are matched by header, never shifted
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** columns in the order Owner name, Block, Lot, Mobile, Email, Phase.
- **Action:** upload.
- **Expected:** rows read correctly, or one file-level message; never a name in the Lot field. **Assumption — pending BA (Q2).**
- **Don't assert:** which of the two outcomes.

#### TC-03-B15 — A semicolon-separated file is refused, not read as one column
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** template saved with `;` separators.
- **Action:** upload.
- **Expected:** a file-level message; no row whose Block holds a whole line. **Assumption — pending BA (Q2).**
- **Don't assert:** wording.

#### TC-03-B16 — An .xlsx file is refused with a CSV instruction
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** the template saved as `.xlsx`.
- **Action:** choose it.
- **Expected:** a message to save as CSV UTF-8; no preview (CSV only in R1).
- **Don't assert:** whether the file picker filters it out first.

#### TC-03-B17 — A file at the row limit previews; one row over is refused, stating the limit
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** files with exactly the limit and limit + 1 valid rows (limit: gap Q1).
- **Action:** upload each.
- **Expected:** limit: preview. Limit + 1: a message stating the limit, no preview. **Assumption — pending BA (Q1).**
- **Don't assert:** a number until Q1 is answered.

#### TC-03-B18 — A multi-megabyte file is refused and the page stays responsive
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** a CSV padded to about 5 MB.
- **Action:** choose it.
- **Expected:** a size message; page usable. **Assumption — pending BA (Q1).**
- **Don't assert:** the size threshold.

### Block C — Field validation and lot-key normalisation

The rules apply to the import and the form alike (one validation function, Sol Arch review).
Each case uses a small import file of new rows plus one control row that is valid.

#### TC-03-C1 — A row with no block is rejected "Block is missing"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** row: Block blank, Lot 3, owner "ZZ Test Owner C1".
- **Action:** upload.
- **Expected:** that row listed "Block is missing"; control row ready.
- **Don't assert:** column order in the preview.

#### TC-03-C2 — A row with no owner name is rejected "Owner name is missing"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** row: Block 30, Lot 1, owner blank.
- **Action:** upload.
- **Expected:** "Owner name is missing".
- **Don't assert:** other columns' display.

#### TC-03-C3 — An owner name of spaces only is rejected "Owner name is missing"
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** owner "   ".
- **Action:** upload.
- **Expected:** "Owner name is missing".
- **Don't assert:** how spaces are displayed.

#### TC-03-C4 — An owner name of exactly 80 characters is accepted and shown in full
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner "ZZ Test " padded to 80 characters.
- **Action:** preview, commit, open the edit form.
- **Expected:** all 80 characters stored and shown.
- **Don't assert:** line-wrap position.

#### TC-03-C5 — An owner name of 81 characters is rejected with a length reason
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** the C4 name plus one character.
- **Action:** upload.
- **Expected:** row rejected with a reason naming the 80-character limit. **Assumption — pending BA (Q7).**
- **Don't assert:** wording.

#### TC-03-C6 — Every accepted mobile shape is accepted and shown in one display format
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** six rows with mobiles `9000000011`, `09000000012`, `639000000013`, `+639000000014`, `0900-000-0015`, `0900 000 0016`.
- **Action:** preview, commit.
- **Expected:** all ready; directory shows "0900 000 0011" … "0900 000 0016".
- **Don't assert:** the stored string (N3).

#### TC-03-C7 — A mobile one digit short is rejected quoting the value
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** mobile `0900000001` (10 digits).
- **Action:** upload.
- **Expected:** "\"0900000001\" is not a valid mobile number".
- **Don't assert:** whether spaces in the value are echoed.

#### TC-03-C8 — A mobile one digit long is rejected
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** mobile `090000000123`.
- **Action:** upload.
- **Expected:** the mobile reason quoting the value.
- **Don't assert:** wording beyond the copy of record.

#### TC-03-C9 — A mobile in scientific notation is rejected, not guessed
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** mobile `9.00E+09`.
- **Action:** upload.
- **Expected:** the mobile reason quoting "9.00E+09".
- **Don't assert:** any reconstructed number.

#### TC-03-C10 — A 5,000-digit mobile is rejected promptly
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** one row with a 5,000-digit mobile.
- **Action:** upload.
- **Expected:** rejected; preview returns in normal time (length capped before matching, S8786).
- **Don't assert:** a timing figure.

#### TC-03-C11 — An invalid email is rejected quoting the value
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** three rows with emails `zz-ana@`, `zz@@example.test`, `zz example@example.test`.
- **Action:** upload.
- **Expected:** each listed "\"{value}\" is not a valid email address".
- **Don't assert:** acceptance of unusual-but-valid addresses (library decides).

#### TC-03-C12 — A row with no email and no mobile is accepted
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Block 31, Lot 1, owner "ZZ Test Owner C12", no email, no mobile.
- **Action:** preview, commit.
- **Expected:** imported; directory shows no email for it.
- **Don't assert:** placeholder text for the missing contact.

#### TC-03-C13 — Two households may share one contact email
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** two new lots, both zz-family@example.test.
- **Action:** preview, commit.
- **Expected:** both imported (shared family emails are expected, SA-001 §8.1).
- **Don't assert:** any warning text.

#### TC-03-C14 — Lot "12-A" is accepted and distinct from Lot 12
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A (Blk 4 Lot 12) exists; row Blk 4 Lot 12-A.
- **Action:** preview, commit.
- **Expected:** ready, then listed as "Blk 4 Lot 12-A" beside Blk 4 Lot 12.
- **Don't assert:** the key string.

#### TC-03-C15 — Block "04" and block "4" are the same lot
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; row Block "04", Lot "12".
- **Action:** upload.
- **Expected:** "Already in the directory, skipped".
- **Don't assert:** the key string.

#### TC-03-C16 — Lot values "012", " 12 " and "12-a" resolve to existing lots by one rule
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Households A (Blk 4 Lot 12) and F (Blk 12 Lot 12-A) exist; rows Blk 4 Lot "012", Blk 4 Lot " 12 ", Blk 12 Lot "12-a".
- **Action:** upload.
- **Expected:** QA assumes trim, case-insensitive, leading zeros ignored: all three "Already in the directory, skipped". **Assumption — pending BA (Q8).** Never two households a person would read as the same lot.
- **Don't assert:** the key string.

#### TC-03-C17 — A non-numeric, zero or negative block is rejected
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** rows with Block "4A", "0", "-1".
- **Action:** upload.
- **Expected:** each rejected with a block reason. **Assumption — pending BA (Q8):** no copy exists for an invalid (not missing) block.
- **Don't assert:** wording.

#### TC-03-C18 — Phase blank becomes "Not set"; an unknown phase is handled by one rule
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** rows with Phase blank, "Phase 2", "2", "Phase 9".
- **Action:** preview, commit; open each edit form.
- **Expected:** blank → "Not set"; "Phase 2" → Phase 2; "2" and "Phase 9" per BA. **Assumption — pending BA (Q8).**
- **Don't assert:** outcomes for "2" and "Phase 9" until Q8.

#### TC-03-C19 — Three copies of one lot in a file are all listed as duplicates
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** rows 2, 3, 4 all Blk 32 Lot 1.
- **Action:** upload.
- **Expected:** all three listed "Blk 32 Lot 1 appears more than once in the file".
- **Don't assert:** order.

#### TC-03-C20 — A lot duplicated in the file and already in the directory gets one reason per row
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; two rows for Blk 4 Lot 12.
- **Action:** upload.
- **Expected:** each row shows one reason; neither imported. **Assumption — pending BA (Q5):** which reason.
- **Don't assert:** which reason until Q5.

#### TC-03-C21 — A row with two problems is reported by one consistent rule
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** one row with no lot and email `zz@`.
- **Action:** upload.
- **Expected:** both reasons, or the first only, the same way for every such row. **Assumption — pending BA (Q7).**
- **Don't assert:** which until Q7.

#### TC-03-C22 — Markup in an owner name is shown as text and never runs
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner `ZZ <img src=x onerror=alert(1)>`.
- **Action:** preview, commit, open list and edit form.
- **Expected:** the literal text shows; no script runs; no page error.
- **Don't assert:** how the text is escaped internally.

### Block D — Commit, idempotency, re-import, partial failure, concurrency

#### TC-03-D1 — While committing, the page shows "Importing…" with a progress count, then the banner
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** empty directory; `ZZ-import-623-clean.csv` previewed.
- **Action:** press Import; watch.
- **Expected:** a progress count during the run (UX notes); then the finished banner.
- **Don't assert:** intermediate counts.

#### TC-03-D2 — Pressing Import twice quickly imports each row once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D1.
- **Action:** double-press "Import 623 households".
- **Expected:** heading "623 households"; one lot entry per lot (prov.).
- **Don't assert:** whether the second press reached the server.

#### TC-03-D3 — A second commit call for a running import is refused by the server
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D1; special staging: a second tab, or a direct second call with the same import id while the first runs.
- **Action:** send the second commit.
- **Expected:** refused explicitly; 623 households at the end.
- **Don't assert:** error text.

#### TC-03-D4 — While importing, the button reads "Importing…" and is disabled
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D1.
- **Action:** press Import; inspect the button before it finishes.
- **Expected:** label "Importing…", disabled until the run finishes.
- **Don't assert:** whether Cancel is also disabled (not stated).

#### TC-03-D5 — Two admins importing the same file at once end with 623 households
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions at once (Admin 1, Admin 2); empty directory; each has previewed the same file.
- **Action:** both press Import at the same moment.
- **Expected:** 623 households; one lot entry per lot (prov.).
- **Don't assert:** which run wrote which row.

#### TC-03-D6 — The import that finished second lists its rows "Already in the directory, skipped"
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D5.
- **Action:** read the second-finishing session's results.
- **Expected:** each of its rows "Already in the directory, skipped". If rows interleave, totals across both runs add to exactly 623. **Assumption — pending BA (Q6).**
- **Don't assert:** which admin finishes second.

#### TC-03-D7 — An import interrupted part-way can be finished without duplicates
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: stop the commit function mid-run on the emulator.
- **Action:** rerun as the BA defines.
- **Expected:** remaining rows written; rows already written skipped; 623 in total. **Assumption — pending BA (Q6).** Resume behaviour comes from the Sol Arch review only.
- **Don't assert:** how the screen describes the stuck run.

#### TC-03-D8 — A lot added by the form between preview and commit is skipped at commit
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Setup:** two sessions. Admin 1 previews a file with Blk 9 Lot 1 (shown ready); Admin 2 then adds Blk 9 Lot 1 as "ZZ Test Owner Golf".
- **Action:** Admin 1 commits.
- **Expected:** Blk 9 Lot 1 reported "Already in the directory, skipped"; one Blk 9 Lot 1, owner "ZZ Test Owner Golf".
- **Don't assert:** the count tiles from the original preview.

#### TC-03-D9 — Form save and import commit on the same new lot at once produce one household
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions timed together; Blk 9 Lot 2 in Admin 1's previewed file; Admin 2 has the Add form filled for Blk 9 Lot 2.
- **Action:** commit and Save at the same moment.
- **Expected:** exactly one Blk 9 Lot 2; the loser sees "Blk 9 Lot 2 is already in the directory." or "Already in the directory, skipped".
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
- **Expected:** refused explicitly; directory unchanged.
- **Don't assert:** error text.

#### TC-03-D12 — Committing a completed run again is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3.
- **Action:** call commit again for the same id.
- **Expected:** refused explicitly; 623 households; no second import-completed audit record.
- **Don't assert:** error text.

#### TC-03-D13 — Uploading the same file again skips every row
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3.
- **Action:** upload `ZZ-import-623-clean.csv` again.
- **Expected:** 0 ready; 623 "Already in the directory, skipped"; Import absent or disabled; heading still 623.
- **Don't assert:** whether the button is hidden or disabled (Q2).

#### TC-03-D14 — A fixed rejected-rows file imports only the fixed rows
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after A8; downloaded 4 rows; fix row 14 (add Lot 99), change one of 31/32 to Blk 2 Lot 70, leave 57.
- **Action:** upload the fixed file (with or without the reason column), commit.
- **Expected:** 3 ready (fixed 14, Blk 2 Lot 70, the remaining Blk 2 Lot 7), 1 rejected (57); 622 households.
- **Don't assert:** whether the extra reason column is ignored silently (B13).

#### TC-03-D15 — A re-import with changed names updates no existing household
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3; the clean file with every owner name changed.
- **Action:** upload.
- **Expected:** 0 ready, all skipped; directory names unchanged (R1 never updates from import).
- **Don't assert:** preview order.

#### TC-03-D16 — An inactive household's lot is skipped by the import
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C deactivated; a file with Blk 7 Lot 1.
- **Action:** upload.
- **Expected:** "Already in the directory, skipped"; one Blk 7 Lot 1, still inactive. **Assumption — pending BA (Q9).**
- **Don't assert:** any mention of "inactive" in the reason.

### Block E — Rejected-rows report and download

#### TC-03-E1 — The download holds exactly the rejected rows with their reasons
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8.
- **Action:** press "Download them".
- **Expected:** 4 data rows (from rows 14, 31, 32, 57) with the template columns plus row number and reason; no valid row.
- **Don't assert:** file name; the position of the extra columns.

#### TC-03-E2 — Skipped existing lots follow one stated rule in the download
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** after A9 committed.
- **Action:** download the rows.
- **Expected:** Blk 4 Lot 12 included or excluded per BA. **Assumption — pending BA (Q5).**
- **Don't assert:** either outcome until Q5.

#### TC-03-E3 — Cells starting with "=", "+", "-" or "@" are escaped in the download
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** four rejected rows (no lot) with owner names `=HYPERLINK("http://example.test")`, `+1+1`, `-2+3`, `@SUM(1)`.
- **Action:** download; open in a spreadsheet app.
- **Expected:** each cell starts with `'` in the raw file; none evaluates as a formula.
- **Don't assert:** how the app displays the apostrophe.

#### TC-03-E4 — A "+639…" mobile in the download survives a fix-and-reimport
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a rejected row (no lot) with mobile `+639000000099`.
- **Action:** download, add the lot, upload.
- **Expected:** the mobile is accepted and shown "0900 000 0099". **Assumption — pending BA (Q7):** the import strips a leading `'`.
- **Don't assert:** the raw cell text.

#### TC-03-E5 — The download is UTF-8 and keeps "ñ"
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** a rejected row with owner "ZZ Test Peña".
- **Action:** download; open as UTF-8.
- **Expected:** "ZZ Test Peña" intact.
- **Don't assert:** BOM presence.

#### TC-03-E6 — Board, Guard and Homeowner can't read an import run's rejected rows
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8; ZZ Test Board Member, ZZ Test Guard, ZZ Test Homeowner A each hold the import id.
- **Action:** each reads `importRuns/{id}` (prov.).
- **Expected:** each refused explicitly.
- **Don't assert:** another admin's access (gap Q12).

### Block F — Add household

#### TC-03-F1 — Adding Block 8 Lot 2 lists it with "Not invited"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Blk 8 Lot 2 absent; Admin 1.
- **Action:** Add household → Block 8, Lot 2, owner "ZZ Test Owner Delta", email zz-owner-d@example.test → Save.
- **Expected:** dialog closes; Blk 8 Lot 2 listed with pill "Not invited".
- **Don't assert:** list position.

#### TC-03-F2 — Mobile and phase from the form are shown back in the edit form
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as F1, also mobile 0900 000 0004 and Phase 3.
- **Action:** Save; reopen the household.
- **Expected:** "0900 000 0004" and Phase 3 (register R3, R7).
- **Don't assert:** the stored mobile string.

#### TC-03-F3 — Adding an existing lot shows "Blk 8 Lot 2 is already in the directory." under Lot
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household D (Blk 8 Lot 2) exists.
- **Action:** Add household → Block 8, Lot 2, then leave the Lot field.
- **Expected:** the message under Lot, tied to the field for screen readers; Save disabled (mock-up 3E).
- **Don't assert:** the delay before it appears.

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
- **Expected:** one Blk 9 Lot 1; Save disabled while in flight.
- **Don't assert:** whether a duplicate message flashes.

#### TC-03-F6 — Two admins saving a new Blk 9 Lot 1 at once save exactly one
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions (Admin 1, Admin 2); both forms filled for Blk 9 Lot 1 with different owners.
- **Action:** both press Save together.
- **Expected:** one household; the other admin sees "Blk 9 Lot 1 is already in the directory." (assumption: same copy as F3).
- **Don't assert:** which owner name wins.

#### TC-03-F7 — Empty required fields show inline messages and block Save
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Add household open, all empty.
- **Action:** tab through Block, Lot and Owner name; press Save.
- **Expected:** each of the three shows a text message on blur; nothing saved.
- **Don't assert:** wording (copy table lists the import reasons only).

#### TC-03-F8 — An invalid email on the form shows the import's reason
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Add household; email `zz@`.
- **Action:** leave the Email field.
- **Expected:** "\"zz@\" is not a valid email address" under Email.
- **Don't assert:** trailing punctuation.

#### TC-03-F9 — Adding the lot of an inactive household is refused as a duplicate
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C inactive.
- **Action:** Add household → Block 7, Lot 1.
- **Expected:** "Blk 7 Lot 1 is already in the directory." **Assumption — pending BA (Q9).**
- **Don't assert:** a pointer to Reactivate.

### Block G — Edit household and stale edits

#### TC-03-G1 — Changing a mobile shows the new number in the list
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A mobile 0900 000 0001.
- **Action:** edit to 0900 000 0099; Save.
- **Expected:** list shows "0900 000 0099" for Blk 4 Lot 12.
- **Don't assert:** the stored string.

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
- **Expected:** no "0900 000 0001", "0900 000 0099", name or email in it.
- **Don't assert:** field names.

#### TC-03-G4 — Renaming the owner makes the new name searchable and the old one not
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household B "ZZ Test Owner Bravo".
- **Action:** rename to "ZZ Test Owner Kilo"; search "kilo", then "bravo".
- **Expected:** "kilo" finds Blk 1 Lot 3; "bravo" does not.
- **Don't assert:** debounce timing.

#### TC-03-G5 — Clearing the email removes it from the directory
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household B with email.
- **Action:** clear Email; Save.
- **Expected:** list shows no email for Blk 1 Lot 3; edit form Email empty.
- **Don't assert:** placeholder text.

#### TC-03-G6 — The second of two editors sees the stale-edit message
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions (Admin 1, Admin 2) both open Household A's edit form.
- **Action:** Admin 1 saves mobile 0900 000 0091; then Admin 2 saves 0900 000 0092.
- **Expected:** Admin 2 sees "Someone else changed this household. Reload to see the latest, then make your change again."; dialog stays open with Admin 2's typing.
- **Don't assert:** message placement.

#### TC-03-G7 — The first editor's change is kept after a stale save
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as G6.
- **Action:** reload as either admin.
- **Expected:** mobile "0900 000 0091"; one `household.updated` record from this pair, not two.
- **Don't assert:** audit times.

#### TC-03-G8 — The same admin editing in two tabs gets the stale message on the second save
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Admin 1 opens Household A's edit form in two tabs.
- **Action:** save in tab 1, then in tab 2.
- **Expected:** tab 2 shows the stale-edit message; tab 1's value kept.
- **Don't assert:** tab 1's refresh behaviour.

#### TC-03-G9 — Saving an edit on a household deactivated meanwhile is refused
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Setup:** two sessions; Admin 1's edit form open on Household A; Admin 2 deactivates it.
- **Action:** Admin 1 saves.
- **Expected:** stale-edit message; household stays inactive. **Assumption — pending BA (Q9).**
- **Don't assert:** wording if the BA defines a separate message.

#### TC-03-G10 — Double-tapping Save on an edit writes one change and no stale message
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A edit form, mobile changed.
- **Action:** double-tap Save.
- **Expected:** one update, one audit record; Admin 1 is not shown the stale-edit message for their own second tap.
- **Don't assert:** whether the second tap reached the server.

#### TC-03-G11 — Changing block or lot on edit follows one stated rule
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F edit form.
- **Action:** try to change Lot 12-A to 12-B; Save.
- **Expected:** Block/Lot read-only on edit, or the change saves and the old lot key is freed (a new add of Blk 12 Lot 12-A then succeeds). **Assumption — pending BA (Q14).**
- **Don't assert:** either outcome until Q14.

#### TC-03-G12 — An edit request without the loaded time is refused
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1.
- **Action:** call `updateHousehold` (prov.) for Household A without `seenUpdatedAt`.
- **Expected:** refused explicitly; record unchanged.
- **Don't assert:** error text.

### Block H — Deactivate and reactivate

#### TC-03-H1 — Deactivate asks for confirmation with the copy of record; Cancel keeps it active
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C active.
- **Action:** press Deactivate; read; press Cancel.
- **Expected:** "Deactivate Blk 7 Lot 1? It won't be billed or shown in the list, and its unused invitation stops working. Its records are kept."; after Cancel, still active.
- **Don't assert:** "won't be billed" (billing REQ; not verifiable in R1).

#### TC-03-H2 — A deactivated household leaves the default list and appears under Inactive
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household C active.
- **Action:** Deactivate, confirm.
- **Expected:** not under All; listed under "Inactive"; the Inactive chip count rises by one.
- **Don't assert:** the All count (gap Q18).

#### TC-03-H3 — A deactivated household's records are kept
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H2.
- **Action:** open Blk 7 Lot 1 from Inactive; check the test project.
- **Expected:** same name and contacts; household, lot and contact documents still exist (prov.).
- **Don't assert:** fields other than `active` beyond these.

#### TC-03-H4 — Deactivating stops the household's unused invitation
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household C "Invited" with an unused email invitation (REQ-004 fixture); deactivate it.
- **Action:** ZZ Test No-Role User enters that code.
- **Expected:** "This invitation is no longer valid. Ask the admin office."; no membership created.
- **Don't assert:** the invite's stored status value.

#### TC-03-H5 — Deactivate writes one `household.deactivated` record
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H2.
- **Action:** read audit records for Household C.
- **Expected:** one `household.deactivated` (prov.) with Admin 1's uid; ids only.
- **Don't assert:** time.

#### TC-03-H6 — Reactivate returns the household to the default list
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H2.
- **Action:** Inactive → Blk 7 Lot 1 → Reactivate.
- **Expected:** listed under All; gone from Inactive; one `household.reactivated` record (prov.).
- **Don't assert:** whether Reactivate asks for confirmation (not stated).

#### TC-03-H7 — Reactivate keeps the name, contacts and members
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A (Linked) deactivated, then reactivated.
- **Action:** open its edit form; check `members`.
- **Expected:** same name, contacts; member record still present.
- **Don't assert:** link status (Q10).

#### TC-03-H8 — Reactivate doesn't bring a cancelled invitation back
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H4, reactivate Household C.
- **Action:** No-Role User enters the old code.
- **Expected:** still refused. **Assumption — pending BA (Q10).**
- **Don't assert:** the link status pill.

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
- **Expected:** refused or a no-op; no new audit record. **Assumption — pending BA (Q9).**
- **Don't assert:** refused vs no-op.

#### TC-03-H11 — Deactivating a "Not invited" household changes only its active state
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F (Not invited).
- **Action:** deactivate.
- **Expected:** inactive; name, contacts, link status unchanged.
- **Don't assert:** pill shown under Inactive.

#### TC-03-H12 — Deactivating an "Invite expired" household keeps the code refused
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a household with an expired invitation (REQ-004 fixture, expiry in the past by Asia/Manila date).
- **Action:** deactivate; No-Role User enters the code.
- **Expected:** refused.
- **Don't assert:** whether the message says "expired" or "no longer valid".

#### TC-03-H13 — A deactivated "Email failed" household has no working code
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a household in "Email failed" (REQ-004 fixture).
- **Action:** deactivate; look for Resend / Print slip under Inactive.
- **Expected:** not offered, or any code they produce is refused. **Assumption — pending BA (Q11).**
- **Don't assert:** which of the two.

#### TC-03-H14 — Deactivating a "Linked" household leaves its member records in place
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A (Linked).
- **Action:** deactivate.
- **Expected:** its `members` record unchanged (prov.).
- **Don't assert:** what Homeowner A sees afterwards (out of scope).

### Block J — Directory list, search and paging

#### TC-03-J1 — "blk 4" lists the Block 4 households
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set and Household A.
- **Action:** type "blk 4" in "Search name or lot".
- **Expected:** Blk 4 Lots 1–6 and Blk 4 Lot 12 listed.
- **Don't assert:** order.

#### TC-03-J2 — "blk 4" lists none of Blocks 40 to 49 nor Blk 14
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** as J1.
- **Expected:** no row from Blocks 40–49 or Blk 14 Lot 4.
- **Don't assert:** the "Showing x of y" text.

#### TC-03-J3 — Typing re-renders only the list, keeping focus and text
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** type "blk 4" one key at a time.
- **Expected:** focus stays in the box; heading and chips don't re-render; no page reload.
- **Don't assert:** the 200 ms figure.

#### TC-03-J4 — "santos" lists owners whose name contains the word Santos
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set.
- **Action:** type "santos".
- **Expected:** "ZZ Test Santos" and "ZZ Test Dos Santos" listed.
- **Don't assert:** order.

#### TC-03-J5 — "santos" does not list "Santoson"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as J4.
- **Action:** type "santos".
- **Expected:** "ZZ Test Santoson" absent (whole-word rule). **Assumption — pending BA (Q17).**
- **Don't assert:** results for partial words ("san").

#### TC-03-J6 — Search ignores letter case
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** type "BLK 4", then "SANTOS".
- **Expected:** same results as J1 and J4.
- **Don't assert:** order.

#### TC-03-J7 — "pena" and "peña" find "ZZ Test Peña" by one stated rule
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set.
- **Action:** type "peña", then "pena".
- **Expected:** "peña" finds it; "pena" per BA. **Assumption — pending BA (Q17).**
- **Don't assert:** "pena" until Q17.

#### TC-03-J8 — A search with no match says so, distinct from the empty directory
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** type "zzqqxx".
- **Expected:** a no-match message; not "No households yet. Import your list or add the first household."
- **Don't assert:** wording.

#### TC-03-J9 — The empty directory shows the empty state and its three actions
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** empty directory; Admin 1.
- **Action:** open Homeowners.
- **Expected:** "No households yet. Import your list or add the first household." with Import households, Add household, Download template (mock-up 3D).
- **Don't assert:** layout.

#### TC-03-J10 — 50 households fit one page; the 51st appears on the next
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** two directories: exactly 50 and exactly 51 households.
- **Action:** open Homeowners; go to the next page.
- **Expected:** 50: no next page. 51: next page lists one.
- **Don't assert:** pager control style.

#### TC-03-J11 — Opening the directory reads about one page, not every household
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Directory 623; special staging: emulator read counter.
- **Action:** open Homeowners.
- **Expected:** reads near 50 plus overhead, far below 623.
- **Don't assert:** an exact count.

#### TC-03-J12 — Search results over 50 page the same way
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Directory 623 with 60 owners named "Automation Owner".
- **Action:** search "automation".
- **Expected:** 50 then 10 on the next page.
- **Don't assert:** order.

#### TC-03-J13 — Inactive households are not found under All
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C inactive.
- **Action:** search "charlie" under All, then under Inactive.
- **Expected:** absent under All; found under Inactive (assumption: search applies within the chosen chip).
- **Don't assert:** chip counts.

#### TC-03-J14 — Each filter chip's count matches the rows it lists
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** fixtures in each link status plus one inactive.
- **Action:** choose each chip.
- **Expected:** count equals rows listed.
- **Don't assert:** whether All includes inactive (gap Q18).

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
- **Expected:** "—" (copy reads "Balance —" in mock-up 3B).
- **Don't assert:** label styling.

#### TC-03-K4 — 640 px shows cards; 641 px shows the table
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** phone emulation at 640 and 641 px.
- **Action:** open Homeowners.
- **Expected:** 640: cards. 641: table.
- **Don't assert:** pixel-perfect layout.

#### TC-03-K5 — On a phone the import page says "Import works best on a computer" and still imports
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** Yes
- **Setup:** 375 px phone emulation; empty directory; 3-row file.
- **Action:** Import → choose file → commit.
- **Expected:** the note shown; 3 households imported.
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
- **Expected:** preview or dialog intact; Import / Save works.
- **Don't assert:** when the pop-up appears.

#### TC-03-K13 — Link status pills carry words and meet AA contrast
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** one fixture in each of the five link statuses.
- **Action:** inspect pills.
- **Expected:** words "Not invited", "Invited", "Linked", "Invite expired", "Email failed"; text contrast ≥ 4.5:1.
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

#### TC-03-L3 — "Choose a different file" returns to step 1 with nothing saved
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** preview of a 3-row file.
- **Action:** press "Choose a different file".
- **Expected:** step 1; no household saved.
- **Don't assert:** whether the old run record remains (Q13).

#### TC-03-L4 — Cancel on the preview returns to Homeowners with nothing saved
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** as L3.
- **Action:** press Cancel.
- **Expected:** Homeowners; count unchanged.
- **Don't assert:** scroll position.

#### TC-03-L5 — After the import finishes, the admin is on Homeowners with the banner
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
- **Setup:** 3-row file previewed.
- **Action:** commit.
- **Expected:** Homeowners with the finished banner (mock-up 3D).
- **Don't assert:** whether the banner is dismissible.

#### TC-03-L6 — Browser Back after a finished import doesn't import again
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after L5.
- **Action:** browser Back; press any Import button shown.
- **Expected:** no extra households (pairs with D12).
- **Don't assert:** which page Back shows.

#### TC-03-L7 — Reloading on the preview never commits and follows one stated rule
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** preview shown.
- **Action:** reload.
- **Expected:** step 1 or the preview restored; nothing saved. **Assumption — pending BA (Q13).**
- **Don't assert:** which of the two.

#### TC-03-L8 — After Save or Cancel in Add / Edit, the list keeps its search and filter
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
- **Setup:** search "blk 4" active; Add dialog open.
- **Action:** add Blk 4 Lot 7; Save.
- **Expected:** list still filtered to "blk 4" and now includes Lot 7.
- **Don't assert:** scroll position.

#### TC-03-L9 — A board member opening the Homeowners address sees "You don't have access to this page"
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Board Member signed in.
- **Action:** open the Homeowners address directly.
- **Expected:** "You don't have access to this page" with "Go to my dashboard" (REQ-002); no rows flash first.
- **Don't assert:** the address format.

#### TC-03-L10 — A guard opening the Homeowners or Import address sees the no-access page
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Guard.
- **Action:** open each address directly.
- **Expected:** no-access page for both.
- **Don't assert:** the address format.

#### TC-03-L11 — A homeowner opening the Homeowners or Import address sees the no-access page
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Test Homeowner A.
- **Action:** open each address directly.
- **Expected:** no-access page for both.
- **Don't assert:** the address format.

#### TC-03-L12 — A user with no role or household sees the "not linked" screen
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

### Block M — Role and security

Each case asserts the request is refused with a permission error.

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
- **Expected:** each refused explicitly; directory unchanged when re-read as Admin.
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
- **Expected:** refused explicitly (clients never write households).
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
- **Expected:** treasurer and board allowed; guard refused; admin per BA. **Assumption — pending BA (Q15).**
- **Don't assert:** admin outcome until Q15.

### Block N — Data integrity and privacy

#### TC-03-N1 — No household document holds an email or mobile
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3, F1, G1.
- **Action:** scan `households` documents (prov.).
- **Expected:** no field holds a fixture email or mobile; those exist only in `householdContacts`.
- **Don't assert:** other field names.

#### TC-03-N2 — A homeowner's read of their own household returns no contacts
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Homeowner A.
- **Action:** read `households/{A}`.
- **Expected:** allowed; payload has no email or mobile (after a sale a new owner never sees the old owner's contacts).
- **Don't assert:** which other fields are present.

#### TC-03-N3 — Every mobile is stored in one format
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after C6.
- **Action:** read the six contact records.
- **Expected:** all in the same shape (`+639…`, prov.).
- **Don't assert:** the display format here (C6 does).

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

#### TC-03-N6 — An import writes one completion record whose counts match the banner
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8.
- **Action:** read the `import.completed` record (prov.).
- **Expected:** one record: 619 imported, 4 not imported.
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

### Block P — Integration and derived figures

#### TC-03-P1 — An invitation for an imported household goes to its contact email
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after A3; staging mail allow-list includes automation addresses.
- **Action:** invite Automation Owner 001's household (REQ-004).
- **Expected:** the invitation is addressed to automation-001@example.test.
- **Don't assert:** delivery.

#### TC-03-P2 — An edited contact email is used by the next invitation
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F; set email zz-owner-f@example.test.
- **Action:** invite Household F.
- **Expected:** addressed to zz-owner-f@example.test.
- **Don't assert:** delivery.

#### TC-03-P3 — The join screen shows the current owner name after an edit
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F renamed "ZZ Test Owner India"; a printed code for it.
- **Action:** No-Role User enters the code.
- **Expected:** "You're joining Blk 12 Lot 12-A" with "ZZ Test Owner India".
- **Don't assert:** layout.

#### TC-03-P4 — Editing a household doesn't reset its link status or member count
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A "Linked", one member.
- **Action:** edit its mobile; Save.
- **Expected:** pill still "Linked"; member count unchanged.
- **Don't assert:** fields not named.

#### TC-03-P5 — A household with no email counts in REQ-004's "have no email" figure
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F (no email) and C12's household selected with one household that has an email.
- **Action:** press "Invite selected".
- **Expected:** "Send 1 invitations? 2 households have no email. Print their slips instead." (REQ-004 copy).
- **Don't assert:** singular grammar.

#### TC-03-P6 — The heading count updates after add, import, deactivate and reactivate without a reload
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a known starting directory.
- **Action:** add one; import 3; deactivate one; reactivate it.
- **Expected:** "Homeowners · {n} households" follows each step.
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

#### TC-03-Q1 — The mock-up's 20 sample households never appear in the real directory
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
- **Setup:** fresh test project.
- **Action:** Admin 1 opens Homeowners.
- **Expected:** empty state, not sample rows.
- **Don't assert:** anything about the mock-up.

#### TC-03-Q2 — A household with no phase opens and saves without choosing one
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F (phase null).
- **Action:** edit the mobile; Save.
- **Expected:** form shows "Not set"; save succeeds; phase still null.
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

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Import: preview and happy path | 13 | 11 |
| B | Import: file boundaries and negatives | 18 | 8 |
| C | Field validation and lot-key normalisation | 22 | 10 |
| D | Commit, idempotency, re-import, concurrency | 16 | 14 |
| E | Rejected-rows report and download | 6 | 3 |
| F | Add household | 9 | 6 |
| G | Edit and stale edits | 12 | 6 |
| H | Deactivate and reactivate | 14 | 5 |
| J | List, search, paging | 14 | 4 |
| K | Responsive, usability, UI/UX | 18 | 5 |
| L | Navigation | 14 | 5 |
| M | Role and security | 16 | 14 |
| N | Data integrity and privacy | 11 | 5 |
| P | Integration and derived figures | 7 | 4 |
| Q | Back-compat | 3 | 0 |
| X | Exploratory | 3 | 0 |
| **Total** | | **196** | **100** |


## Requirement gaps for the BA

Each blocks a precise expected result. Cases that assume an answer are labelled
"assumption — pending BA".

| # | Question | Cases |
|---|---|---|
| Q1 | What are the maximum rows and file size for one import, and the copy when exceeded? | B17, B18 |
| Q2 | What does the admin see for an empty file, a header-only file, a file with zero valid rows, a missing / renamed / reordered / extra column, or a non-comma separator? Is Import hidden, disabled, or "Import 0 households"? | B1, B2, B4, B12–B15 |
| Q3 | Singular copy: "Import 1 household(s)", "1 household(s) ready", heading "1 household(s)"? | B3 |
| Q4 | Encoding and line endings: is a UTF-8 BOM accepted (Excel "CSV UTF-8" writes one)? CR-only / mixed endings? Trailing blank lines? The refusal copy "Save the file as CSV UTF-8 and upload it again." is in the Sol Arch review but not REQ-003's copy table: confirm it. | B5, B6, B9, B10 |
| Q5 | Does "Already in the directory, skipped" count in "{m} rows won't be imported" and in the finished banner, and is it in the rejected-rows download? (Gherkin 2 counts 4; mock-up 3C shows a separate "Already in the directory" tile.) When a lot is duplicated in the file *and* already exists, which reason is shown? | A3, A9, C20, E2 |
| Q6 | Import run states: is there a `completed` / `failed` state, and how does an admin resume an interrupted import (SA says rerun continues; also says commit refuses unless `previewed`)? When two imports race, must the second report *every* row skipped, or may the rows interleave? | D6, D7 |
| Q7 | Missing copy: owner name over 80 characters; several problems on one row (all reasons or first); does the import strip a leading `'` added by the escaped download? | C5, C21, E4 |
| Q8 | Lot-key normalisation: are lot values trimmed, case-folded ("12-a" = "12-A") and leading zeros ignored ("012" = "12")? Block rules for "4A", 0, negatives, > 99. Accepted Phase values ("Phase 2", "2", "P2")? Plus decision 2 (phase in the key) still open. | C15–C18 |
| Q9 | Inactive households: may they be edited? Does an inactive lot still block a new add / import of that lot, and should the message point to Reactivate? Is Deactivate on an inactive household refused or a no-op? Does a stale-edit check trip on deactivation? | D16, F9, G9, H10 |
| Q10 | After Reactivate, what is the link status, and does a cancelled invitation stay cancelled? | H8 |
| Q11 | For an "Email failed" or "Invite expired" household that is deactivated, are Resend / Print slip offered? | H13 |
| Q12 | Can one staff member see or download another staff member's import run and its rejected rows? | E6 |
| Q13 | Does Cancel or a reload on the preview delete the run record, and what does reload show? | A2, L7 |
| Q14 | Can Block / Lot be changed on edit? If so, what happens to the old lot key? | G11 |
| Q15 | Audit read access: REQ-003 says board and treasurer read the change record; may admin office staff? The activity log screen is backlog story 06, so Gherkin 8's "activity log records" is verifiable only at record level in R1: confirm. | G2, M16 |
| Q16 | Where are Edit, Deactivate and Reactivate reached from (row click, detail pop-up, menu)? Not in the mock-ups. | Smoke item 4, H-block |
| Q17 | Search: does a partial word ("san") match? Do "pena" and "peña" match each other? Which forms of block search work ("block 4", "b4", "4", "blk 4 lot 12")? | J5, J7 |
| Q18 | Do "All ({n})" and the page heading count include inactive households? | J14, P6 |
| Q19 | Escape on a half-filled Add / Edit dialog: close (existing NAV-06) or keep (REQ-003's "typing is not lost")? | K11 |
| Q20 | Phone button "Import" vs desktop "Import households" (mock-up 3B): intended? | K18 |
| Q21 | Back-compat for a household doc without `linkStatus` / `memberCount`: should it render as "Not invited"? | Q3 |
