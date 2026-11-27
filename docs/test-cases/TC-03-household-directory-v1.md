# TC-03 — Household directory: add, edit and import (v1)

| Field | Value |
|---|---|
| Enhancement / fix | Enhancement: household directory with CSV import (preview, then commit), add and edit forms (Block / Lot editable, decision 3), deactivate and reactivate, indexed search, phone cards |
| Source | [REQ-003 Household directory: add, edit and import](../requirements/REQ-003-household-directory.md), **r4** (commit `79fc906`), **approved** by the owner 2026-11-28 ("Approve, apply r4"). Approved UX option: **Option A, CSV only in R1**. r4 answers TC-03 gaps Q1–Q21, records decision 2's rule (pick still waits on the admin office) and adds decision 3 (B: Block / Lot editable, lot key moved by the server) |
| Depends on | REQ-002 (roles; who may read households and contacts). Precedent read: REQ-001 (sign-in, "not linked" screen), REQ-004 (invitations read `displayName`, `contactEmail`, `active`; write `linkStatus`, `memberCount`) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open): no viewport meta, so the phone layout never applies on a real phone. Folded into block K (responsive). No other defects exist |
| App version | **anticipated** (the app is still the browser-only mock-up; `aHo()` at `index.html` line 758 has no add, edit or import) |
| Source files / functions touched | **Anticipated, provisional (SA-001 Draft)**: callables `previewHouseholdImport`, `commitHouseholdImport`, `createHousehold`, `updateHousehold` (with `seenUpdatedAt`; lot-key move, decision 3), `setHouseholdActive` (SA-001 §3); REQ-004's `createInvites` (refuses an inactive household, r4); the daily job (interrupted runs, rejected-row deletion); the shared validation / normalisation module used by the import, the form and the lot-key builder; collections `households`, `lots/{lotKey}`, `householdContacts/{householdId}`, `importRuns/{importId}`, `auditLog` (§4.2); Firestore rules helpers `isStaff()`, `hasRole()`, `isMember()` (§8.1); indexes `households (active, block, lot)` and `(active, searchTokens array-contains, lotKey)`; web module `web/src/features/households/` and shared `web/src/ui/modal.js`, `table.js` (§9) |
| Environment | **Emulator Suite or the test project `hoa-portal-staging` only** (SA-001 §10, ADR-005, provisional). Never a `-prod` project. Invented data only; staging mail allow-list applies to any invitation a case triggers |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Yes, approve TC-03"), as v1 r3 aligned to REQ-003 r4. **Ready for QE triage.** v1 r2: cases split by behaviour for layer push-down. v1 r3: aligned to REQ-003 r4. Not covered by the approval: new gaps NG1–NG15 (see Requirement gaps for the BA) were found after the owner's review and are open for the BA; cases citing them assert only what holds under every reading. Decision 2 (admin office) and the "(prov., pending Sol Arch)" items also stay open |

> **Provisional (SA-001 Draft).** SA-001 and its ADRs are still Draft on branch
> `docs/sa-001-architecture`. Every statement below that names a collection, field,
> function, index or rules helper is marked **(prov.)** and may change when SA-001 is
> finalised. The behaviour each case asserts comes from REQ-003, which is approved.
>
> **(prov., pending Sol Arch)** marks a case whose behaviour is approved in REQ-003 r4 but
> sits on r4's "Pending Sol Arch confirmation (r4)" list: limits, three counts, run states
> and the 15-minute interrupted rule, restated Gherkin 5, inactive-household function
> results, `createInvites` on inactive, import-run access, Cancel and 60-minute expiry, the
> lot-key move, and prefix search. The case asserts the approved behaviour; the mechanism
> (field, function, who marks what) may change when Sol Arch confirms. r4 also records an
> open **design gap**: how `commitHouseholdImport` gets the ready rows (re-sent by the
> browser, BA preference, or held in the run). Commit cases assert outcomes only, never
> which of the two carries the rows.
>
> **Lot key format is not settled** (REQ-003 owner decision 2: r4 records the rule, key
> without the phase if block numbers don't repeat across phases, with the phase if they do,
> but the admin office has not answered). Cases speak of "the lot key" and the label
> "Blk 4 Lot 12", never the literal key string (`B04-L12` or `P1-B04-L12`). Cases whose
> result depends on the answer are marked **pending decision 2 (admin office)** and state
> both outcomes without asserting either.

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
| R1 | Block, lot, lot label ("Blk 4 Lot 12") | Import commit, Add household form, and (decision 3) Edit form with the "Change lot" confirm; Admin, Treasurer. Stored from the **normalised** values (Import file rules): block whole number 1–999, lot "12" or "12-A". `households/{id}.block`, `.lot`, `.lotLabel` (prov.) | Directory row (lot label button) and phone card, household dialog title, duplicate messages, Change lot confirm, toasts, preview table: Admin, Treasurer. REQ-004 join screen "You're joining Blk 4 Lot 12" and invite slip: invitee / Admin (after a lot move: new gap NG7). Own household pages: Homeowner of that household (prov.: SA-001 "every member reads `households/{id}`"). **Deliberately not shown** to Guard (REQ-002) and Board (REQ-003) |
| R2 | Lot key | Import commit, Add household; moved by `updateHousehold` on a lot change in one transaction (decision 3; prov., pending Sol Arch). Written by functions into `lots/{lotKey}` and `households/{id}.lotKey` (prov.). An inactive household keeps its lot | Never displayed. Read back as behaviour: "{lot} is already in the directory." / "{lot} is already in the directory but inactive. Reactivate it from the Inactive list." under Lot (Admin, Treasurer); "Already in the directory, skipped" / "Already in the directory (inactive), skipped" in the preview (Admin, Treasurer); after a move, the old lot can be added again (G18). **Deliberately not shown** to every other role |
| R3 | Phase | Import (Phase column: blank, "Phase 1"–"Phase 4", "1"–"4", "P1"–"P4", normalised to "Phase N" or null), Add / Edit form ("Not set", Phase 1–4); Admin, Treasurer. Required instead of optional if decision 2 puts the phase in the key (**pending decision 2**) | Household dialog: Admin, Treasurer. **Deliberately not shown** in the R1 directory list (mock-up 3A has no phase column), to Homeowner, Guard, Board. Future reader: board financial report groups by phase (EPIC-012) |
| R4 | Owner display name | Import, Add, Edit; Admin, Treasurer. Trimmed, up to 80 characters. `households/{id}.displayName` (prov.) | Directory row/card, search results, household dialog: Admin, Treasurer. REQ-004 join confirm screen ("owner name on file"): invitee. Own household pages: Homeowner (prov.). Future: notice letters (CN). **Deliberately not shown** to Guard, Board |
| R5 | Search words | Functions, derived from the display name on every create and edit: accent-folded, lower-case word prefixes of 2+ characters (prov., pending Sol Arch). `households/{id}.searchTokens` (prov.) | Never displayed. Read back as the result set of "Search name or lot": Admin, Treasurer. Must refresh after a name edit (G4) |
| R6 | Contact email | Import, Add, Edit; Admin, Treasurer. **`householdContacts/{id}.contactEmail` only** (prov.) | Directory Contact column, household dialog: Admin, Treasurer. REQ-004: the address the invitation is sent to; bulk-invite "{m} households have no email". **Deliberately not shown** to Homeowner (not even their own household's, so a new owner never sees the previous owner's), Guard, Board |
| R7 | Contact mobile | Import, Add, Edit; Admin, Treasurer. Accepts `9XXXXXXXXX`, `09XXXXXXXXX`, `639XXXXXXXXX`, `+639XXXXXXXXX`; one leading `'` before `+` stripped on import; stored `+639…`, shown "0900 000 0001" style (Sol Arch review). `householdContacts/{id}.contactMobile` (prov.) | Directory Contact column, household dialog: Admin, Treasurer, shown in display format. **Deliberately not shown** to Homeowner, Board, Guard (whether a guard sees a number on a pass is the R4 gate REQ's decision, REQ-002) |
| R8 | Active / inactive | Deactivate (confirm), Reactivate (confirm), Undo on the deactivate toast; Admin, Treasurer. `households/{id}.active` (prov.); each change bumps `updatedAt` (prov., pending Sol Arch). A no-op change is refused | Default list and every link-status chip exclude it; "Inactive ({n})" chip lists and counts it; household dialog shows the "Inactive" pill and Reactivate; inactive rows offer only Reactivate: Admin, Treasurer. Toasts "{lot} deactivated. Undo" / "{lot} reactivated.": Admin, Treasurer. REQ-004 code redemption: invitee sees "This invitation is no longer valid. Ask the admin office."; `createInvites` refuses with "{lot} is inactive. Reactivate it before sending an invitation." (prov., pending Sol Arch). Future: billing skips it (billing REQ). What a linked member of an inactive household sees: **deliberately not defined in R1** (REQ-003 out of scope; REQ-004 recommends read-only); the Reactivate confirm tells staff that linked members "get full access back" |
| R9 | Link status and member count | "Not invited" / 0 set on create by import commit and Add household; recomputed on Reactivate ("Linked" if members remain, otherwise "Not invited"); other values kept by REQ-004 functions (prov.) | Directory pill and filter chips ("Not invited ({n})", active only): Admin, Treasurer. A record without the fields reads "Not invited" (Q3). **Deliberately not shown** to Homeowner, Guard, Board |
| R10 | Balance placeholder "—" | Not written by REQ-003 (no balance before the first billing run) | Directory card and row: Admin, Treasurer. Homeowner balance belongs to the billing REQ |
| R11 | Import run: state, three counts (ready, rejected, already in the directory), progress, rejected rows | `previewHouseholdImport`, `commitHouseholdImport`, Cancel / "Choose a different file", started by Admin or Treasurer; marked interrupted by a function or the daily job (prov., pending Sol Arch). `importRuns/{importId}` (prov.). Rejected rows deleted at once on Cancel, otherwise after 30 days | Preview (step 2) tiles and rows table, "Importing… {x} of {n}", finished banner, "Download them" / "Download these rows", the "stopped before it finished" message, and the "Your last import, {date}: …" line on step 1: **only the staff member who ran it** (prov., pending Sol Arch). **Deliberately not shown** to any other staff member (Admin 2, Treasurer), Board, Guard, Homeowner |
| R12 | Change record (household.created, updated, deactivated, reactivated, relotted; import.completed with its counts) | Functions only. `auditLog` (prov.), ids only. Refused no-op changes write nothing | Board and Treasurer (REQ-003 roles; confirmed r4). **The activity log screen is backlog story 06, not built in R1**, so in R1 no screen reads it; QE reads the record in the test project (restated Gherkin 17). **Deliberately not shown** to Admin office staff (confirmed r4), Guard, Homeowner |
| R13 | Last-changed time (`updatedAt`) | Functions on every edit, lot move, deactivate and reactivate (prov.) | Not displayed. Read back by the household dialog as `seenUpdatedAt` for the stale-edit check: Admin, Treasurer |
| R14 | Ignored column names (extra headings in the file) | Not written: values are never stored | Preview line "Ignored columns: {names}." above the tiles: the staff member who ran the preview. "Row" and "Reason" (from our own download) are **deliberately not shown** |

No read-back cell is empty.

### Status enumeration

**S1. `active` (rule: Deactivate only an active household; Reactivate only an inactive one; a no-op is refused by the server with no change and no audit record; prov., pending Sol Arch).**

| Prior value | Deactivate | Reactivate | Edit (Save) | Add / import of the same lot | Copy cross-check | Cases |
|---|---|---|---|---|---|---|
| Active | Allowed after confirm; hidden from default list and chips, listed under Inactive, records kept; toast with Undo for 10 s | Not offered; a direct or stale call is refused, no change, no audit; stale screen shows "{lot} is already active." | Allowed | Refused: "{lot} is already in the directory." / "Already in the directory, skipped" | Deactivate confirm promises: "won't be billed" (not verifiable in R1, billing REQ), "won't be shown in the list" (H16), "unused invitation stops working" (H4), "records are kept" (H3) | H1–H5, H9, H10, H15–H17, H23, K31, K33 |
| Inactive | Not offered; a direct or stale call is refused, no change, no audit; stale screen shows "{lot} is already inactive." | Allowed after confirm; back in the default list; link status recomputed; old invitation stays cancelled | Allowed; stays inactive (G28) | Refused with the inactive variant: "{lot} is already in the directory but inactive. Reactivate it from the Inactive list." / "Already in the directory (inactive), skipped" | Reactivate confirm promises: "billed and shown in the list again" (list: H6; billing not verifiable in R1); "its {n} linked members get full access back" (member records kept: H7; access itself is REQ-004) | H6–H8, H10, H18–H20, H24, F9, D16, D21, G28, K28, K30, K31 |

**S2. Link status at the moment of Deactivate** (every value `linkStatus` can hold, REQ-003 copy of record), and what Reactivate gives back.

| Prior link status | Expected on Deactivate | Expected on Reactivate | Case |
|---|---|---|---|
| Not invited | Deactivated; no invitation exists, nothing else changes | Not invited | H11, H20 |
| Invited (unused invitation) | Deactivated; the invitation stops working (REQ-004 refusal copy) | Not invited (no members); old code still refused | H4, H8, H20 |
| Invite expired | Deactivated; the expired code still refused | Not invited (no members) | H12 |
| Email failed | Deactivated; inactive row offers only Reactivate (no Resend, Print slip or bulk select); `createInvites` refuses it (prov., pending Sol Arch) | Not invited (no members) | H13, H21, H22 |
| Linked | Deactivated; member records unaffected (their access is out of scope, REQ-004) | Linked (members remain) | H14, H7, H19 |

**S3. Import run state (rule: commit accepts only a `previewed` run of the caller's own, no older than 60 minutes; prov., pending Sol Arch).** States: previewed → running → completed, plus cancelled and interrupted.

| Prior run state | Commit by the run's creator | Commit by another staff member | Read by another staff member | Other transitions | Case |
|---|---|---|---|---|---|
| (no run / unknown id) | Refused | Refused | — | — | D11 |
| Previewed, under 60 minutes old | Allowed; run moves to running | Refused | Refused | Cancel or "Choose a different file" → cancelled, rejected rows deleted at once; reload leaves it previewed | D1, D10, D29, D31, D32, E9, L15 |
| Previewed, over 60 minutes old | Refused | Refused | Refused | Rejected rows deleted by the daily job after 30 days | D30, N10 |
| Running (second press, second tab) | Refused, no extra rows | Refused | Refused | Progress count rises; no progress for 15 minutes → interrupted | D2, D3, D33, D25, D26 |
| Completed | Refused; directory unchanged | Refused | Refused | — | D12 |
| Cancelled | Refused | Refused | Refused | — | D28 |
| Interrupted (rows already written stay written) | Refused; finished by uploading the same file again (a new run) | Refused | Refused | — | D7, D23, D24, D27, K44–K46 |

**S4. Edit freshness (rule: an edit carries the time the record was loaded; deactivate, reactivate and a lot move count as changes).**

| Record changed since load? | Expected | Case |
|---|---|---|
| No | Saved | G1 |
| Yes, edited by someone else | Refused with the stale-edit copy; first change kept | G6, G7 |
| Yes, deactivated by someone else | Refused with the stale-edit copy; stays inactive (prov., pending Sol Arch: `updatedAt` bump) | G9 |
| Yes, edited by the same admin in another tab | Refused with the stale-edit copy | G8 |
| Yes, edited by someone else, and this save changes the lot | Refused as stale; the lot is not moved | G22 |
| Yes, lot moved by someone else | Refused as stale | G23 |

**S5. Target of a lot change on edit (decision 3: the server moves the lot key in one transaction and refuses if the new lot exists; prov., pending Sol Arch).**

| Target lot | Expected | Case |
|---|---|---|
| Free | Moved after "Change lot" confirm; same household id, members, invitations, history; old lot free | G11, G15–G19, G25 |
| Held by an active household | Refused "{lot} is already in the directory."; nothing moved | G20 |
| Held by an inactive household | Refused; nothing moved (which message: new gap NG6) | G26 |
| Taken by a concurrent move of another household | Exactly one move succeeds | G24 |
| Same lot after normalisation ("12a" for 12-A) | Nothing moved (whether the confirm shows: new gap NG6) | G27 |
| Confirm cancelled | Nothing moved | G21 |

## Test plan — three lenses

### 1. Smoke

The standing smoke pass (`smoke.spec.js` SMK-admin-homeowners) only checks that the
mock-up's Homeowners heading loads. This change adds role-visible areas it does not cover.
**New for QE's smoke scope:**

1. **Homeowners directory (real data)** for Admin **and Treasurer**: heading "Homeowners · {n} households", buttons Import households / Add household, search box, filter chips, empty state when there are no households.
2. **Import households page**: step 1 (Download template, file input with label, "Your last import" line when one exists), step 2 preview, step 3 finished banner.
3. **Add household dialog** opens and closes with Cancel.
4. **Household dialog** for one fixture household, opened from the row's lot label button (desktop) and "Open" (phone): form plus Deactivate, Cancel, Save (r4 UX "Where actions live"; mock-up screen 3F still to be added).
5. **Inactive filter** lists inactive households; an inactive household's dialog shows the "Inactive" pill and Reactivate.
6. **Board, Guard and Homeowner** do not have Homeowners in the menu (overlaps TC-02; QE de-duplicates).

### 2. Acceptance mapping (REQ-003 r4 Gherkin → cases)

r4 has 24 scenarios, numbered here in r4 order. r3's Gherkin 5 ("Two admins import the same
file") is r4 #5, restated; r3's Gherkin 8 ("Correct a contact number") is r4 #17, restated.

| # | Gherkin scenario (r4) | Cases |
|---|---|---|
| 1 | Import the household list | A1, A2, A3, A4, K19, K20, K22 |
| 2 | Rows with problems are shown, not imported | A5, A6, A7, A8, A15, K20, K21, K22 |
| 3 | Importing a lot that already exists does not duplicate it | A9, A10, A11, K21, K42 |
| 4 | Pressing Import twice imports once | D2, D3, D4 |
| 5 | Two admins import the same file at the same time (**restated r4**: counts add up to 623; each run lists every row it did not write as skipped) | D5, D6, D22 |
| 6 | A file with nothing to import | D13, D20, B21 |
| 7 | A file missing a required column | B12, B33, B34, B19, B39 |
| 8 | A file over the row limit | B17, B25, B26, B19 |
| 9 | An interrupted import is finished by uploading the file again | D7, D23, D24, D25, D27, K44, K46 |
| 10 | The same lot written differently is one lot | C41, C15, C16, C35, C36 |
| 11 | Adding the lot of an inactive household | F9, K28 |
| 12 | Reactivating does not revive a cancelled invitation | H8, H20, K30 |
| 13 | Escape doesn't throw away typing | K11, K39, K38, K35, K36 |
| 14 | Correcting a mistyped lot (decision 3) | G11, G18, G19, G15, G16, G17, G20, G22, G23, G29, K29 |
| 15 | Add one household | F1, F2, F10, F11 |
| 16 | The same lot can't be added twice | F3, F4, F5, F6, F12, F13, K23 |
| 17 | Correct a contact number (**restated r4**: change record holds ids and time, no name, email or mobile) | G1, G2, G3, G13 |
| 18 | Two admins edit the same household | G6, G7, K24 |
| 19 | A household is deactivated, not deleted | H1, H2, H3, H4, H15, H16, H17 |
| 20 | Typing in a half-filled form is not lost | K9, K10 |
| 21 | Search by block | J1, J2, J3, J19 |
| 22 | Search by name | J4, J5, J17 |
| 23 | Readable on a phone | K1, K2, K3, K4 |
| 24 | Only the office and the treasurer can change households | M1, M2, M8 |

Unhappy paths are included in every row above; the rest of the plan widens them.

### 3. Regression

**What else could break, and why**

| Area | Why it is at risk | Cases / re-run |
|---|---|---|
| `households/{id}` shape | Every later feature (billing, payments, bookings, vehicles, passes) reads it; homeowners read their own. Contacts must never land on it | N1, N2, N12, M5 |
| `lots/{lotKey}` and the lot-key move (decision 3) | New write path in `updateHousehold`: create new key, free old key, relabel, in one transaction. Everything later keyed by household id must survive a relabel; a half-done move leaves two keys or none | G11, G15–G27, N4 |
| Shared validation / normalisation module | One module for import, form and lot-key builder (r4). A change for one caller changes the others; later imports (opening balances) will reuse it | C-block, F16, F17, F19 |
| Rules helpers `isStaff()`, `hasRole()`, `isMember()` (prov.) | Shared with every collection in REQ-002; adding household and run-creator rules can widen or break them | M-block, E9, E10; re-run TC-02 rules matrix |
| REQ-004 invitations | Read `displayName`, `contactEmail`, `active`; write `linkStatus`, `memberCount`. r4 adds: `createInvites` refuses an inactive household; Reactivate recomputes link status; a lot move must leave invitations attached | P1–P5, H8, H19–H22, G16; re-run TC-04 invite and redeem cases |
| Shared modal (`ui/modal.js`, mock-up `.modal`) | r4 adds a "dirty" rule: Escape and × with unsaved changes ask "Discard your changes…"; with none, Escape still closes. NAV-06 (Escape closes any modal) gains a case rather than breaking, but every dialog in the app shares the code | K9–K11, K35–K39; re-run NAV-06 |
| Shared table and pills (`ui/table.js`, `.pill`) | Link status reuses payment pill colours; a change ripples to Approvals and Dues. The row is now clickable with a lot label button | K13, L16, L17; re-run SMK-admin-approvals |
| Phone layout | DEF-001 is open: no viewport meta, so cards never appear on a real phone | K1–K4, K40 under phone emulation; re-run NAV-07, NAV-08 |
| Household count shown elsewhere | Mock-up's admin Dashboard ("{n} households"), Announcements ("Seen by x of N households"), Collections, Reports read the household list. r4: counts are active households only | P6, P7, J22, K19 (derived figure) |
| Search tokens | Change from whole words to accent-folded word prefixes (prov., pending Sol Arch); multi-word queries need a new design; read cost per keystroke | J-block, J11 |
| Daily job | Gains two duties: mark stuck runs interrupted, delete rejected rows after 30 days (and expired previewed runs') | D25, D26, N10 |
| Mock-up Homeowners screen | `aHo()` is replaced; its free-text `contact` column and detail pop-up go away | Q1; re-run SMK-admin-homeowners |
| Audit log | Written by every privileged action; r4 adds `household.relotted` and confirms no record for refused no-ops | G2, G17, H5, H10, H18, N5–N8 |

**Known failure patterns applied**

| Pattern | Applies? | Where |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Import 619 households", "Imported {n}…", "{k} lots were … left unchanged", Deactivate and Reactivate confirms ("linked members get full access back"), Change lot confirm ("keeps its members and history", "becomes free to add"), "Upload the same file again to import the rest", "{lot} is already in the directory." | Copy checked once in D4, H1, J8, J9, K3, K13, K19–K25, K27–K34, K41–K48, B19–B21, B39; each promise verified at record level by A3, A8, A11, D6, D7, D23, F3, G15–G18, H3, H4, H7, H16; "won't be billed" / "will be billed" flagged as unverifiable in R1 |
| A value written for one role, never shown back | Yes: phase, contacts, audit, ignored columns, import run | Round-trip register R3, R6, R7, R11, R12, R14 |
| Status-gated rule checked for one transition only | Yes: active, link status, import run state, edit freshness, lot-change target | S1–S5 tables |
| Same concept, different word on another screen | Yes: "Import households" on every screen size (r4); "Homeowners" page vs "households" count; "Inactive" chip vs "Deactivate"; link status words in REQ-003 vs REQ-004; "Already in the directory, skipped" in preview vs "left unchanged" in the banner | K18, K25 |
| Dates computed in UTC where the user means local | Yes (low): audit "when"; the 30-day retention cut-off; the 60-minute expiry and 15-minute interrupted rule; "Your last import, {date}" (format and time zone: new gap NG10); invite expiry date | N10, D25, D26, D29, D30, K47, H12 (build dates from Asia/Manila local today) |
| A derived figure doesn't refresh after a related write | Yes: heading count, chip counts (active only), search tokens after rename, label after a lot move, Inactive list after Undo | P6, P7, G4, G13, G29, H17, J22 |
| Zero and "not set" look the same | Yes: empty directory vs search with no match; "—" balance vs ₱0; phase "Not set" (pending decision 2); no email vs invalid email; 0 ready rows (two sentences) vs a refused file; empty file vs header-only file | J8, J9, K3, C12, C28, C25, C27, B1, B2, B4, B21 |
| A write silently refused by security rules | Yes: every direct client write and refused callable; no-op Deactivate / Reactivate is refused, not ignored | M-block, H10, E9 assert the refusal, never "nothing changed" |
| Double-tap / two devices create duplicates | Yes: Import, Save (add), Save (edit), Deactivate, Change lot | D2–D5, F5, F6, F12, F13, G10, G14, G24, H9 |
| Stale reference | Yes: stale edit, preview then lot added, edit of a household deactivated meanwhile, edit during a lot move, stale Deactivate / Reactivate / invite on an inactive household, import vs form on the same lot | G6–G9, G22, G23, D8, D9, D17, D18, H10, H21, K24, K31, K32 |
| Backdrop click loses work | Yes: Add / Edit dialog (backdrop does nothing; Escape and × ask first) | K9, K10, K11, K36 |
| A modal appearing mid-flow blocks the next action | Yes: important-announcement pop-up (NAV-05) over the Import page or Add dialog; the discard confirm and Change lot confirm inside the household dialog | K12, K39, G21 |
| Assumed SDK/network behaviour baked into a case | Yes: "network error keeps the preview"; whether the run can be read after a failed commit call (two stopped messages) | K8, K44, K45 marked as assumptions about the network only |
| Data leaking across households or roles | Yes: contacts, other households, import rejected rows (now creator-only) | M3–M15, E6, E9, E11, N1, N2 |

**Existing specs and screens QE should re-run** (QE owns the list): `smoke.spec.js` (SMK-admin-nav, SMK-admin-homeowners, SMK-owner-nav, SMK-guard-nav), `navigation.spec.js` NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07, NAV-08, and the TC-02 role matrix and TC-04 invite cases once those exist.

## Scenario list

Every scenario states one behaviour. The letter in brackets is the block where its case lives.

- **Happy path:** import a clean file into an empty directory (A); add one household (F); correct a mobile; correct a mistyped lot (G); deactivate and reactivate (H); search by block and by name (J).
- **Negative:** missing block / lot / owner name; invalid block, lot, phase, email, mobile; duplicate lot in file; lot already in directory (active or inactive); non-UTF-8 file; non-CSV file; missing, renamed, duplicated or extra columns; wrong separator; empty file; header only; zero ready rows; duplicate lot in the form; lot change to a taken lot; stale edit; commit of a run that is not previewed, expired, cancelled, interrupted or not the caller's; another staff member reading a run; no-op Deactivate / Reactivate; invite on an inactive household; every role refused (B, C, D, E, F, G, H, M).
- **Boundary:** 0, 1, 50, 51 households (paging); 623-row file; 2,000 and 2,001 data rows; 1 MB and one byte over (definition: new gap NG1); size checked before rows; owner name 80 and 81 characters, and 80 plus spaces; block 1, 999, 1000; lot 1, 9999, 10000, 10 and 11 characters; Phase 1, 4, 0, 5; mobile formats at each accepted shape and one digit short or long; block 4 vs 40–49; lot with suffix "12-A"; row numbers counting the header and blank rows; last row without a trailing newline; 59 vs 61 minutes for preview expiry; 15 minutes without progress; 29 vs 31 days for retention; singular counts and 1,000+ with a comma (B, C, D, J, K, N).
- **Usability:** errors as text with what to do; file messages announced with focus left on the file input; preview caption and row numbers; visible file label; focus to first error; inline validation on blur; discard confirm with Keep editing focused; keyboard-only import; lot label button reachable by keyboard; tap targets; empty, loading, in-progress, finished, stopped, error states; WCAG 2.2 AA contrast and non-colour pills and reasons (K).
- **Navigation:** reach Homeowners from the menu for Admin and Treasurer; highlighted menu item; open the household dialog from the lot button, the row and the phone "Open"; import steps forward, back ("Choose a different file") and Cancel; after Save / Cancel / Deactivate; reload on the preview returns to step 1; deep link refused for Board, Guard, Homeowner, No-role; treasurer-homeowner switch (L).
- **Security / role:** read and write refusals per role and per collection, asserted explicitly; removed-admin stale token; import runs readable by their creator only; audit read by board and treasurer only (M, E).
- **Integration:** REQ-004 reads name, email and active; link status starts "Not invited" and is recomputed on Reactivate; `createInvites` refuses inactive; a lot move keeps invitations; counts on other screens (P, H, G).
- **Concurrency:** double press Import; two admins import; two admins add the same lot; two admins edit; edit vs deactivate; edit vs lot move; two moves to one lot; form vs import on the same lot (D, F, G, H).
- **Back-compat:** greenfield, so no migrated records. Applies only to: the mock-up's 20 sample households are never imported (Q1); a household created with no phase (Q2, pending decision 2); a household doc without `linkStatus` / `memberCount` (Q3, Q4).
- **Responsive:** 375 px cards, 640 / 641 px breakpoint, 320 px button stacking, no sideways scroll, real phone emulation per DEF-001, import on a phone (K).
- **UI/UX:** copy of record word for word, including every r4 file message, the count rule and the household dialog; consistent words across screens; pill colours shared with payment status (K, B).
- **Data integrity:** lot key uniqueness and normalisation; lot-key move in one transaction; contacts only in the staff-only record; mobile stored in one format; ñ survives; audit per action with ids only; no personal data in logs; rejected rows deleted on Cancel and after 30 days; ignored columns never stored; formula cells escaped on download and our own escape stripped on re-import; re-import idempotent; three counts add up (C, D, E, G, N).
- **Exploratory:** three charters (X).

## Test data

All invented, test environment only. The Gherkin's sample names, emails and phone numbers
are replaced with the fixtures below; the block and lot numbers in the Gherkin
(Blk 2 Lot 7, Blk 4 Lot 12, Blk 4 Lot 12-A, Blk 7 Lot 1, Blk 8 Lot 2, Blk 9 Lot 1,
Blk 12 Lot 12-A / 12-B) are kept because they exist only in the test project. A fixture
handle such as `ZZ-B04-L12` names the fixture; the stored lot key follows whatever format
decision 2 settles.

| Fixture | Lot | Owner name | Email | Mobile | State |
|---|---|---|---|---|---|
| ZZ Test Household A (`ZZ-B04-L12`) | Blk 4 Lot 12 | ZZ Test Owner Alpha | zz-owner-a@example.test | 0900 000 0001 | Active, Linked (ZZ Test Homeowner A) |
| ZZ Test Household B (`ZZ-B01-L03`) | Blk 1 Lot 3 | ZZ Test Owner Bravo | zz-owner-b@example.test | 0900 000 0002 | Active, Linked (ZZ Test Homeowner B) |
| ZZ Test Household C (`ZZ-B07-L01`) | Blk 7 Lot 1 | ZZ Test Owner Charlie | zz-owner-c@example.test | 0900 000 0003 | Active, Invited (unused email invitation), no members |
| ZZ Test Household D (`ZZ-B08-L02`) | Blk 8 Lot 2 | ZZ Test Owner Delta | zz-owner-d@example.test | 0900 000 0004 | Created in F1; pre-seeded for F3 |
| ZZ Test Household E (`ZZ-B02-L10`) | Blk 2 Lot 10 | ZZ Test Owner Echo | — | — | Active, Linked (ZZ Test Treasurer-Homeowner) |
| ZZ Test Household F (`ZZ-B12-L12-A`) | Blk 12 Lot 12-A | ZZ Test Owner Foxtrot | — | 0900 000 0006 | Active, Not invited, phase null |
| ZZ Test Household G (`ZZ-B04-L12-A`) | Blk 4 Lot 12-A | ZZ Test Owner Juliet | zz-owner-g@example.test | 0900 000 0007 | Active, Not invited. Seeded only where a case says so (C14 needs it absent) |
| ZZ Test Household H (`ZZ-B12-L12-B`) | Blk 12 Lot 12-B | ZZ Test Owner Lima | — | — | Seeded only where a case says so (G20 needs it present; G11 needs it absent) |
| ZZ Test Household K (`ZZ-B15-L03`) | Blk 15 Lot 3 | ZZ Test Owner Kappa | — | — | **Inactive**, Not invited. Seeded only where a case says so (G26) |
| ZZ Search Set | Blk 4 Lots 1–6, Blk 40–49 Lot 1 each, Blk 14 Lot 4 | include "ZZ Test Santos", "ZZ Test Dos Santos", "ZZ Test Santoson", "ZZ Test Peña", "ZZ Test Pena" | — | — | Active |
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
| `ZZ-import-header-blank-rows.csv` | Header, then three blank rows (one empty line, one `,,,,,`, one of spaces) |
| `ZZ-import-2000.csv` / `ZZ-import-2001.csv` | Header + exactly 2,000 / 2,001 valid new data rows (Blocks 100–399), under 1 MB |
| `ZZ-import-1000000-bytes.csv` | Header + 3 valid new rows + an ignored "Notes" column padded so the file is exactly 1,000,000 bytes |
| `ZZ-import-1048577-bytes.csv` | The same, padded to exactly 1,048,577 bytes (over 1 MB under either reading of "1 MB", new gap NG1) |
| `ZZ-import-big-and-long.csv` | 2,500 data rows padded to about 1.5 MB (over both limits) |
| `ZZ-import-5-{crlf,lf,cr,mixed}.csv` | The same 5 data rows saved with each line ending; row 4 has no lot |
| `ZZ-import-semicolon.csv` / `ZZ-import-tab.csv` | The template's 3 rows separated by `;` / by tabs |
| Others | Named in the case that needs them |

**Clock control:** cases on the 15-minute, 60-minute and 30-day rules need special staging:
an emulator clock or run records seeded with past timestamps (Asia/Manila local time).

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
screen cases: D4 (Importing…), H1 (Deactivate confirm), J8 (no search match), J9 (empty
state), K3 (balance "—"), K13 (link status pills), K19 (page heading), K20 (preview
heading and Import button), K21 (row reasons), K22 (finished banner), K23 (duplicate lot),
K24 (stale edit), K25 (import hint and buttons), K27 (ignored columns), K28 (duplicate
lot, inactive), K29 (lot change confirm), K30 (Reactivate confirm), K31 (already in
state), K32 (invite on inactive), K33 (toasts), K34 (household dialog), K41 (count rule),
K43 (import in progress), K44–K46 (import stopped), K47–K48 (last import), K11 (discard
confirm), plus B19–B21 and B39 for file messages. A refusal case's "no record written" is
its proof of refusal, not a second behaviour.

**r3 (aligned to REQ-003 r4).** The 41 cases labelled "assumption — pending BA" now carry
r4's rule; the label is gone. Results that still depend on owner decision 2 are marked
**pending decision 2 (admin office)**; results on r4's Sol Arch list are marked
**(prov., pending Sol Arch)**. Results r4 leaves open are listed under "Don't assert" with a
new-gap reference (NG1–NG15).

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
- **Expected:** no `households`, `lots` or `householdContacts` documents exist (prov.). Empty-state screen: J9. What Cancel does to the run: D31.
- **Don't assert:** the run record here (D31).

#### TC-03-A3 — Committing the clean file stores exactly 623 households
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as A1.
- **Action:** commit the run; wait for it to finish.
- **Expected:** 623 household records exist, one per lot in the file; the run record (prov.) is `completed` and reports 623 imported, 0 rejected, 0 already in the directory (three counts, prov., pending Sol Arch). Banner: K22; heading: K19.
- **Don't assert:** record order; count field names.

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
- **Expected:** 619 imported, 4 rejected, 0 already in the directory (prov., pending Sol Arch); the 4 rejected rows (14, 31, 32, 57) with reasons, available to download (file content: E1). Banner: K22.
- **Don't assert:** field names.

#### TC-03-A9 — The preview classifies a lot already in the directory as skipped, counted as already, not as won't be imported
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A (Blk 4 Lot 12) exists; Admin 1; `ZZ-import-with-B04-L12.csv`.
- **Action:** run the preview.
- **Expected:** the Blk 4 Lot 12 row is classified "already in the directory, skipped"; counts 3 ready, 0 won't be imported, 1 already in the directory (r4 Import file rules: three counts). Wording: K20, K21, K42.
- **Don't assert:** tile layout.

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

#### TC-03-A15 — Ready, won't be imported and already in the directory add up to the file's data rows
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; a file of 9 data rows: 6 valid new lots, 1 with no lot, 1 with email `zz@`, 1 for Blk 4 Lot 12.
- **Action:** run the preview.
- **Expected:** 6 ready, 2 won't be imported, 1 already in the directory; 6 + 2 + 1 = 9 (r4 "Three counts").
- **Don't assert:** row order in the result.

### Block B — Import: file-level boundaries and negatives

r4 "Import file rules": a **file message** is shown on step 1 under the file input; no
preview, no Import button, nothing sent to the server, no import run written. Refusal
cases below assert "no run written" as their proof; wording is checked in B19, B20 and
presentation in B39.

#### TC-03-B1 — A 0-byte file is refused with a file message before any preview
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-empty.csv`.
- **Action:** choose the file.
- **Expected:** refused at file level as empty; no row results; no import run written. Screen: B19.
- **Don't assert:** wording here (B19).

#### TC-03-B2 — A header-only file is refused with a file message, not previewed with zero rows
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-header-only.csv`.
- **Action:** choose the file.
- **Expected:** refused at file level as having no households (r4: its own file message, distinct from B1's); no preview; no import run written. Screen: B19.
- **Don't assert:** wording here (B19).

#### TC-03-B3 — A file with one valid row stores one household
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** empty directory; header + 1 valid row.
- **Action:** preview and commit.
- **Expected:** one household record. Singular copy: K41.
- **Don't assert:** copy here (K41).

#### TC-03-B4 — A file where every row has a problem is previewed with zero ready rows
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** header + 3 rows, each with no owner name.
- **Action:** run the preview.
- **Expected:** a preview (not a file message) with 0 ready, 3 won't be imported for a missing owner name, 0 already; nothing can be committed. Footer sentence: B21.
- **Don't assert:** tile values on screen.

#### TC-03-B5 — A file that is not valid UTF-8 is refused at file level
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-ansi.csv`.
- **Action:** choose the file.
- **Expected:** refused as not UTF-8; no row results; no import run written. Wording: B20.
- **Don't assert:** that a garbled name is returned anywhere.

#### TC-03-B6 — A UTF-8 file with a BOM is read correctly, first column included
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** 3 valid rows saved as Excel "CSV UTF-8" (with BOM).
- **Action:** run the preview.
- **Expected:** 3 ready, 0 won't be imported; the BOM is removed before headings are read, so the first heading matches "Block" and no "Column missing: Block" message appears (r4 "Encoding").
- **Don't assert:** how the BOM is stripped.

#### TC-03-B7 — A UTF-8 file without a BOM is read correctly
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** the same 3 rows with no BOM (as Google Sheets exports).
- **Action:** run the preview.
- **Expected:** 3 ready, 0 won't be imported.
- **Don't assert:** file name.

#### TC-03-B8 — "ñ" in an owner name is stored unchanged
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** UTF-8 row with owner "ZZ Test Peña".
- **Action:** preview, commit; read the household record.
- **Expected:** display name is exactly "ZZ Test Peña". Display: B22.
- **Don't assert:** search with "pena" (J7).

#### TC-03-B9 — CRLF, LF, CR-only and mixed line endings give the same rows and row numbers
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-5-crlf.csv`, `-lf`, `-cr`, `-mixed` (row 4 has no lot; header is row 1).
- **Action:** run the preview for each.
- **Expected:** each: 4 ready; row 4 won't be imported for a missing lot (r4 "Lines").
- **Don't assert:** preview order beyond ascending row number.

#### TC-03-B10 — A last row with no final newline is read; trailing blank lines are not rows
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** two copies of a 3-row file: no final newline; two blank lines at the end.
- **Action:** run the preview for each.
- **Expected:** both: 3 ready, 0 won't be imported, 0 already; blank lines not listed (r4 "Lines", "Blank rows").
- **Don't assert:** anything about the blank lines' row numbers (B31 covers numbering).

#### TC-03-B11 — A quoted field containing a comma stays in one column
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner `"ZZ Test Santos, Jr."` with email and mobile.
- **Action:** preview and commit; read the records.
- **Expected:** display name "ZZ Test Santos, Jr."; email and mobile in their own contact fields.
- **Don't assert:** quote characters in any display.

#### TC-03-B12 — A file with no Lot column is refused at file level naming Lot
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** headings Block, Owner name, Email, Mobile, Phase (Gherkin 7), 3 rows.
- **Action:** choose the file.
- **Expected:** one file-level refusal identifying the missing column Lot; no preview; no import run written. Wording: B19.
- **Don't assert:** wording here (B19).

#### TC-03-B13 — An extra unknown column causes no row to be rejected
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** template + a "Notes" column holding "ZZ note text".
- **Action:** run the preview.
- **Expected:** every row ready; the preview result names "Notes" as an ignored column (r4 "Columns"). Info line wording: K27; values not stored: B23.
- **Don't assert:** column position.

#### TC-03-B14 — Reordered columns are matched by heading, never shifted
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** columns in the order Owner name, Block, Lot, Mobile, Email, Phase; 3 valid new rows.
- **Action:** preview and commit; read the records.
- **Expected:** 3 ready; each household's block, lot and name and each contact's email and mobile hold the values from the matching heading (r4: matched by heading name, any order).
- **Don't assert:** preview column order on screen.

#### TC-03-B15 — A semicolon-separated file is refused as the wrong separator
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-semicolon.csv` (header row has `;` and no comma).
- **Action:** choose the file.
- **Expected:** refused at file level as not comma-separated; no row whose block holds a whole line; no import run written. Wording: B19.
- **Don't assert:** wording here (B19).

#### TC-03-B16 — An .xlsx file is refused before any preview
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** the template saved as `.xlsx`.
- **Action:** choose it (bypassing the picker filter if needed).
- **Expected:** refused as not CSV, even though the picker also filters to `.csv` (r4); no row results; no import run written. Wording: B19.
- **Don't assert:** whether the file picker filters it out first.

#### TC-03-B17 — A file of exactly 2,000 data rows is previewed as normal
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** empty directory; `ZZ-import-2000.csv` (under 1 MB).
- **Action:** run the preview.
- **Expected:** previewed; 2,000 ready (r4 "Limits", prov., pending Sol Arch). Comma in counts: K41.
- **Don't assert:** time taken.

#### TC-03-B18 — A file of 1,048,577 bytes is refused for size
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-1048577-bytes.csv` (3 valid rows plus a padded ignored column).
- **Action:** choose the file.
- **Expected:** refused at file level for size; no row results; no import run written (prov., pending Sol Arch). Wording: B19; page responsiveness: B24.
- **Don't assert:** the refusal for any size between 1,000,000 and 1,048,576 bytes (new gap NG1).

#### TC-03-B19 — Each file message reads the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** the files from B1, B2, B12, B15, B16, B18, B25, B33, B37, B38.
- **Action:** choose each on Import households; read the message under the file input.
- **Expected:**
  - B1: "This file is empty. Choose the filled-in template and upload it again."
  - B2: "This file has no households in it. Add one row per lot under the headings, then upload it again."
  - B12: "Column missing: Lot. Use the template's headings: Block, Lot, Owner name, Email, Mobile, Phase."
  - B33: "Columns missing: Block, Lot. Use the template's headings: Block, Lot, Owner name, Email, Mobile, Phase."
  - B38: "The column "Email" appears twice. Keep one and upload it again."
  - B15 and B37: "This file isn't separated by commas. Save it as CSV UTF-8 and upload it again."
  - B16: "This isn't a CSV file. In Excel or Google Sheets, save or download it as CSV UTF-8, then upload it again."
  - B25: "This file has 2,001 rows. One import can take up to 2,000. Split it into smaller files and import each one." (Gherkin 8)
  - B18: "This file is larger than 1 MB, which is more than a household list needs. Check it's the template saved as CSV UTF-8, or split it into smaller files."
- **Don't assert:** the not-UTF-8 message (B20); presentation (B39).

#### TC-03-B20 — The not-UTF-8 file message reads the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-ansi.csv`.
- **Action:** choose it.
- **Expected:** "This file isn't saved as CSV UTF-8, so names with ñ would come out garbled. Save the file as CSV UTF-8 and upload it again."; no preview.
- **Don't assert:** presentation (B39).

#### TC-03-B21 — With zero ready rows the Import button is replaced by a sentence saying why
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** the previews from B4 (every row has a problem) and D13 (every lot already in the directory, Gherkin 6).
- **Action:** read the preview footer.
- **Expected:** no Import button. In its place, in the same footer position: B4 "Nothing to import. Fix the rows listed above and upload the file again."; D13 "Nothing to import. Every lot in this file is already in the directory." The tiles and the rows table are still shown; Cancel and "Choose a different file" stay.
- **Don't assert:** the sentence for a file that mixes problem rows and already rows with 0 ready (r4 gives two sentences without saying which wins: new gap NG11).

#### TC-03-B22 — An owner name with "ñ" is shown unchanged in the preview and directory
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as B8.
- **Action:** read the preview row, then search "peña".
- **Expected:** "ZZ Test Peña" exactly in both.
- **Don't assert:** font rendering.

#### TC-03-B23 — An extra column's values are stored in no record
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as B13.
- **Action:** commit; read the household, lot, contact and import-run records.
- **Expected:** "ZZ note text" is in none of them (r4: extra columns ignored and never stored).
- **Don't assert:** other field names.

#### TC-03-B24 — The page stays usable while an over-size file is refused
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-big-and-long.csv` (about 1.5 MB).
- **Action:** choose the file; then choose a different file.
- **Expected:** the page responds; no frozen tab (size is checked before parsing).
- **Don't assert:** a timing figure.

#### TC-03-B25 — A file of 2,001 data rows is refused at file level
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-2001.csv` (under 1 MB).
- **Action:** choose the file.
- **Expected:** refused for too many rows, the count 2,001 carried in the refusal; no preview; no import run written (Gherkin 8). Wording: B19.
- **Don't assert:** wording here (B19).

#### TC-03-B26 — The server refuses a preview call carrying more than 2,000 rows
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1; 2,001 valid rows sent straight to `previewHouseholdImport` (prov.), bypassing the browser check.
- **Action:** call the preview.
- **Expected:** refused explicitly; no import run written (r4: "checked in the browser … and again by the server"; prov., pending Sol Arch).
- **Don't assert:** error text.

#### TC-03-B27 — A file of 1,000,000 bytes is not refused for size
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-1000000-bytes.csv`.
- **Action:** run the preview.
- **Expected:** previewed; 3 ready; "Notes" ignored (prov., pending Sol Arch). Holds whether "1 MB" means 1,000,000 or 1,048,576 bytes.
- **Don't assert:** the byte-exact limit (new gap NG1).

#### TC-03-B28 — A file over both the size and the row limit gets the size refusal
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-big-and-long.csv` (2,500 rows, about 1.5 MB).
- **Action:** choose the file.
- **Expected:** the refusal is for size, not for the row count (r4: "Size is checked first").
- **Don't assert:** wording here (B19).

#### TC-03-B29 — A quoted cell containing a line break stays one row
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** 4 data rows; row 2's owner name is quoted and contains a line break; row 4 has no lot.
- **Action:** run the preview.
- **Expected:** 3 ready, 1 won't be imported; the missing-lot row is reported as row 5 (the quoted line break does not add a row).
- **Don't assert:** how the line break is shown in the name.

#### TC-03-B30 — Blank rows anywhere in the file are neither listed nor counted
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** 5 valid data rows with three blank rows between them: one empty line, one `,,,,,`, one of spaces only.
- **Action:** run the preview.
- **Expected:** 5 ready, 0 won't be imported, 0 already; no row result for any blank row (r4 "Blank rows").
- **Don't assert:** preview order.

#### TC-03-B31 — Row numbers count the header and blank rows, matching the spreadsheet
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-623-problems.csv` with one blank row inserted after row 19 (so the old row 57 is now line 58 of the file).
- **Action:** run the preview.
- **Expected:** the invalid-email row is reported as row 58, and the missing-lot row as row 14 (header = row 1; blank rows are numbered but not counted, r4 "Row numbers").
- **Don't assert:** the other rows' numbers.

#### TC-03-B32 — A header followed only by blank rows is refused like a header-only file
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-header-blank-rows.csv`.
- **Action:** choose the file.
- **Expected:** the same file-level refusal as B2 (no households in it); no preview; no import run written.
- **Don't assert:** wording here (B19).

#### TC-03-B33 — Several missing required columns are reported together, in template order
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** headings Owner name, Email, Mobile, Phase (Block and Lot both removed).
- **Action:** choose the file.
- **Expected:** one file-level refusal listing Block then Lot (template order), not two messages. Wording: B19.
- **Don't assert:** wording here (B19).

#### TC-03-B34 — A renamed required column counts as missing
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** the template with "Lot" renamed "Lot No.".
- **Action:** choose the file.
- **Expected:** refused at file level for the missing Lot column; "Lot No." is not read as Lot (r4 "Columns").
- **Don't assert:** whether "Lot No." is also reported as ignored.

#### TC-03-B35 — A missing optional column leaves that value blank for every row
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** headings Block, Lot, Owner name only; 3 valid new rows.
- **Action:** preview and commit; read the records.
- **Expected:** 3 ready; each household stored with no email, no mobile and no phase (r4: "a missing optional column means blank for every row").
- **Don't assert:** whether absent fields are missing or empty (prov.).

#### TC-03-B36 — Headings are matched trimmed and case-insensitive
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** headings " block", "LOT ", "owner NAME", "email", "Mobile", "phase"; 3 valid rows.
- **Action:** run the preview.
- **Expected:** previewed; 3 ready; no column reported missing or ignored.
- **Don't assert:** how the headings are echoed.

#### TC-03-B37 — A tab-separated file is refused as the wrong separator
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-tab.csv` (header row has tabs and no comma).
- **Action:** choose the file.
- **Expected:** the same file-level refusal as B15; no import run written.
- **Don't assert:** wording here (B19).

#### TC-03-B38 — A heading that appears twice is refused at file level
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** the template with a second "Email" column.
- **Action:** choose the file.
- **Expected:** refused at file level naming the repeated column; no preview; no import run written. Wording: B19.
- **Don't assert:** which of the two columns would have been read.

#### TC-03-B39 — A file message is announced, shown as text with an icon, and leaves focus on the file input
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** `ZZ-import-empty.csv` and `ZZ-import-ansi.csv`; keyboard and screen reader.
- **Action:** choose each file by keyboard.
- **Expected:** the message is under the file input, as text with an error icon, in a `role="alert"` region; focus stays on the file input; no preview table and no Import button appear (r4 "file message").
- **Don't assert:** icon artwork.

#### TC-03-B40 — A file-level refusal sends no rows to the server
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** the files from B1, B5, B12, B18, B25; network inspection.
- **Action:** choose each file.
- **Expected:** no call to `previewHouseholdImport` (prov.) is made and no import run is written (r4: "nothing sent to the server").
- **Don't assert:** other network traffic (auth refresh, analytics).

### Block C — Field validation and lot-key normalisation

The rules apply to the import and the form alike (r4: one normalisation "applied the same
way by the import, the Add/Edit form and the lot-key builder"). Every cell is trimmed
before checking. Each case uses a small import file of new rows plus one control row that
is valid. The expected result is the preview result for each row; reason wording is
checked once in K21.

#### TC-03-C1 — A row with no block is rejected for a missing block
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** row: Block blank, Lot 3, owner "ZZ Test Owner C1".
- **Action:** run the preview.
- **Expected:** that row won't be imported, reason block missing; control row ready.
- **Don't assert:** column order.

#### TC-03-C2 — A row with no owner name is rejected for a missing owner name
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** row: Block 30, Lot 1, owner blank.
- **Action:** run the preview.
- **Expected:** won't be imported, reason owner name missing.
- **Don't assert:** other fields.

#### TC-03-C3 — An owner name of spaces only is treated as missing
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** owner "   ".
- **Action:** run the preview.
- **Expected:** won't be imported, reason owner name missing (trimmed first).
- **Don't assert:** how spaces are echoed.

#### TC-03-C4 — An owner name of exactly 80 characters is accepted and stored in full
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner "ZZ Test " padded to 80 characters.
- **Action:** preview, commit; read the household record.
- **Expected:** row ready; display name stored with all 80 characters. Display: C23.
- **Don't assert:** anything about wrapping.

#### TC-03-C5 — An owner name of 81 characters is rejected as longer than 80
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** the C4 name plus one character.
- **Action:** run the preview.
- **Expected:** won't be imported, reason owner name longer than 80 characters (r4 "Several problems on one row"). Wording: K21.
- **Don't assert:** wording here.

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
- **Expected:** won't be imported, reason invalid mobile, carrying the value `0900000001`.
- **Don't assert:** whether spaces in the value are echoed.

#### TC-03-C8 — A mobile one digit long is rejected as invalid
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** mobile `090000000123`.
- **Action:** run the preview.
- **Expected:** won't be imported, reason invalid mobile, carrying the value.
- **Don't assert:** wording.

#### TC-03-C9 — A mobile in scientific notation is rejected, not guessed
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** mobile `9.00E+09`.
- **Action:** run the preview.
- **Expected:** won't be imported, reason invalid mobile, carrying "9.00E+09".
- **Don't assert:** any reconstructed number.

#### TC-03-C10 — A 5,000-digit mobile is rejected promptly
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** one row with a 5,000-digit mobile.
- **Action:** run the preview.
- **Expected:** won't be imported; validation returns in normal time (length capped before matching, S8786).
- **Don't assert:** a timing figure.

#### TC-03-C11 — Three malformed emails are each rejected as invalid, quoting the value
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** three rows with emails `zz-ana@`, `zz@@example.test`, `zz example@example.test`.
- **Action:** run the preview.
- **Expected:** each won't be imported, reason invalid email, carrying its value.
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
- **Setup:** Household A (Blk 4 Lot 12) exists; Household G **not** seeded; row Blk 4 Lot 12-A.
- **Action:** preview, commit; read the lot entries.
- **Expected:** row ready; two lot entries and two households, Blk 4 Lot 12 and Blk 4 Lot 12-A (r4: "Lot 12-A stays distinct from Lot 12"). Label: C26.
- **Don't assert:** the key string.

#### TC-03-C15 — Block "04" and block "4" resolve to the same lot
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; row Block "04", Lot "12".
- **Action:** run the preview.
- **Expected:** classified as already in the directory, skipped.
- **Don't assert:** the key string.

#### TC-03-C16 — Lot values "012", " 12 " and "12-a" resolve to the existing lots
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Households A (Blk 4 Lot 12) and F (Blk 12 Lot 12-A) exist; rows Blk 4 Lot "012", Blk 4 Lot " 12 ", Blk 12 Lot "12-a".
- **Action:** run the preview.
- **Expected:** all three classified as already in the directory, skipped, and counted in already (r4 normalisation: leading zeros dropped, trimmed, suffix upper-cased and joined with "-").
- **Don't assert:** the key string.

#### TC-03-C17 — Invalid block values are rejected with the block reason
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** rows with Block "4A", "0", "-1", "1000", "four".
- **Action:** run the preview.
- **Expected:** each won't be imported with the invalid-block reason carrying its value (r4 normalisation table). Wording: K21.
- **Don't assert:** wording here.

#### TC-03-C18 — Accepted phase forms are stored as "Phase N"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** five new rows with Phase "Phase 2", "2", "P2", "p 2", "PHASE2".
- **Action:** preview, commit; read the household records.
- **Expected:** all five ready; each stored with phase "Phase 2" (r4: "Phase 1"–"Phase 4", "1"–"4", "P1"–"P4", any case, with or without space).
- **Don't assert:** a blank phase (C28, pending decision 2).

#### TC-03-C19 — Three copies of one lot in a file are all rejected as duplicates
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** rows 2, 3, 4 all Blk 32 Lot 1.
- **Action:** run the preview.
- **Expected:** all three won't be imported, reason duplicated in the file, naming Blk 32 Lot 1.
- **Don't assert:** order.

#### TC-03-C20 — Every row of a lot duplicated in the file and already in the directory is classified already
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; rows 2 and 3 both Blk 4 Lot 12.
- **Action:** run the preview.
- **Expected:** both rows classified "already in the directory, skipped" with that as the only reason; both counted in already (2), none in won't be imported (r4 "Reason precedence").
- **Don't assert:** row order.

#### TC-03-C21 — A row with several problems lists all of them, in column order, joined by "; "
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** row 23 with no lot and email `zz@`.
- **Action:** run the preview.
- **Expected:** one row result with the reasons lot missing then invalid email, joined by "; " (r4 example: `Lot number is missing; "zz@" is not a valid email address`); counted once in won't be imported.
- **Don't assert:** other rows.

#### TC-03-C22 — Markup in an owner name is shown as text and never runs
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner `ZZ <img src=x onerror=alert(1)>`.
- **Action:** preview, commit, open list and household dialog.
- **Expected:** the literal text shows on each screen; no script runs; no page error.
- **Don't assert:** how the text is escaped internally.

#### TC-03-C23 — An 80-character owner name is shown in full in the list and household dialog
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** after C4.
- **Action:** open the list and the household's dialog.
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
- **Action:** read each household's Contact cell; open its dialog.
- **Expected:** no email shown; Email field empty.
- **Don't assert:** placeholder text.

#### TC-03-C26 — A suffixed lot's label reads "Blk 4 Lot 12-A"
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** after C14.
- **Action:** search "blk 4".
- **Expected:** a row labelled "Blk 4 Lot 12-A" and a separate "Blk 4 Lot 12".
- **Don't assert:** order.

#### TC-03-C27 — A household with no phase shows "Not set" in the household dialog
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F (phase null).
- **Action:** open its dialog.
- **Expected:** Phase reads "Not set". **Pending decision 2 (admin office):** r4 says "Not set" no longer applies if the phase goes into the key.
- **Don't assert:** anything until decision 2 is answered; phase list contents.

#### TC-03-C28 — A blank phase is handled by decision 2's rule
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** a new row with Phase blank.
- **Action:** run the preview.
- **Expected:** **pending decision 2 (admin office).** Key without the phase: row ready, phase stored null ("Not set"). Key with the phase: row won't be imported, reason "Phase is missing".
- **Don't assert:** either outcome until the admin office answers.

#### TC-03-C29 — The same Block and Lot in two different phases is handled by decision 2's rule
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** rows Phase 1 Blk 36 Lot 1 and Phase 2 Blk 36 Lot 1.
- **Action:** run the preview.
- **Expected:** **pending decision 2 (admin office).** Key without the phase: both rows won't be imported as appearing more than once in the file. Key with the phase: two different lots, both ready.
- **Don't assert:** either outcome until the admin office answers.

#### TC-03-C30 — A leading apostrophe before an ordinary character is kept
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner "'Nonoy ZZ Test".
- **Action:** preview, commit; read the household record.
- **Expected:** display name "'Nonoy ZZ Test", apostrophe kept (r4: one `'` removed only before `=`, `+`, `-` or `@`).
- **Don't assert:** display styling.

#### TC-03-C31 — A value that starts with "=" after the apostrophe is removed is stored as plain text
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** Yes
- **Setup:** owner "'=ZZ Test Formula".
- **Action:** preview, commit; read the record; open the list.
- **Expected:** display name stored as "=ZZ Test Formula"; shown as that text in the list; nothing evaluates. Re-escape on download: E12.
- **Don't assert:** internal escaping.

#### TC-03-C32 — An 80-character name with spaces around it is accepted after trimming
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** the C4 name with two spaces before and after (84 characters raw).
- **Action:** preview, commit; read the record.
- **Expected:** row ready; display name stored as the 80 characters without the spaces (r4: over 80 "after trimming").
- **Don't assert:** display.

#### TC-03-C33 — The in-file duplicate reason comes after the row's field problems
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** rows 2 and 3 both Blk 34 Lot 1; row 2 also has email `zz@`.
- **Action:** run the preview.
- **Expected:** row 2's reasons are the invalid email, then "Blk 34 Lot 1 appears more than once in the file", joined by "; "; row 3 has only the duplicate reason.
- **Don't assert:** other rows.

#### TC-03-C34 — An already-in-directory row with other problems shows only the already reason
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; a row for Blk 4 Lot 12 with email `zz@` and no owner name.
- **Action:** run the preview.
- **Expected:** the only reason is "already in the directory, skipped"; counted in already, not in won't be imported; not in the download (E2).
- **Don't assert:** other rows.

#### TC-03-C35 — Block prefixes "Blk" and "Block" in any case resolve to the plain block number
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; rows with Lot 12 and Block "Blk 4", "block4", "Block 4", "BLK4".
- **Action:** run the preview.
- **Expected:** each row classified as already in the directory, skipped (block normalised to 4; the four rows are also in-file duplicates, which r4's precedence rule hides).
- **Don't assert:** the key string.

#### TC-03-C36 — Lot forms "12A", "12 a" and "Lot 12-A" resolve to Lot 12-A
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F (Blk 12 Lot 12-A) exists; three files, one row each: Blk 12 Lot "12A"; Blk 12 Lot "12 a"; Blk 12 Lot "Lot 12-A".
- **Action:** run the preview for each.
- **Expected:** each classified as already in the directory, skipped.
- **Don't assert:** the key string.

#### TC-03-C37 — Blocks 1 and 999 are accepted
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** new rows Block "1" Lot 50 and Block "999" Lot 1 (1000 is rejected in C17).
- **Action:** run the preview.
- **Expected:** both ready.
- **Don't assert:** the key string.

#### TC-03-C38 — Invalid lot values are rejected with the lot reason
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** rows with Lot "0", "12-AB3", "A", "10000".
- **Action:** run the preview.
- **Expected:** each won't be imported with the invalid-lot reason carrying its value. Wording: K21.
- **Don't assert:** wording here.

#### TC-03-C39 — Lots 1, 9999 and a two-letter suffix are accepted and stored normalised
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** new rows Blk 37 Lot "1", Blk 37 Lot "9999", Blk 37 Lot "12ab".
- **Action:** preview, commit; read the records.
- **Expected:** all ready; lots stored "1", "9999", "12-AB".
- **Don't assert:** the key string.

#### TC-03-C40 — A lot value over 10 characters is refused before matching
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; rows Blk 4 Lot "0000000012" (10 characters) and Blk 4 Lot "00000000012" (11 characters).
- **Action:** run the preview.
- **Expected:** the 10-character row classified as already in the directory (Lot 12); the 11-character row won't be imported with the invalid-lot reason, never matched to Lot 12.
- **Don't assert:** how the value is echoed.

#### TC-03-C41 — Block "04" with Lot "12a" is the existing Blk 4 Lot 12-A
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household G (Blk 4 Lot 12-A) seeded; a file with a row Block "04", Lot "12a" (Gherkin 10).
- **Action:** run the preview.
- **Expected:** classified as already in the directory, skipped; 0 ready from that row; still one Blk 4 Lot 12-A.
- **Don't assert:** the key string.

#### TC-03-C42 — The stored label is built from the normalised values
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a new row Block "block 035", Lot "lot 7 b".
- **Action:** preview, commit; read the household record.
- **Expected:** block 35, lot "7-B", label "Blk 35 Lot 7-B" (r4: "The lot label is always built from the normalised values").
- **Don't assert:** the key string.

#### TC-03-C43 — Out-of-range phase values are rejected with the phase reason
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** rows with Phase "Phase 9", "5", "0", "P5".
- **Action:** run the preview.
- **Expected:** each won't be imported with the invalid-phase reason carrying its value. Wording: K21. The accepted range follows the treasurer's open answer on phases (1–4 until then).
- **Don't assert:** wording here.

#### TC-03-C44 — Phase 1 and Phase 4 are accepted
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** new rows with Phase "1" and "P4".
- **Action:** run the preview.
- **Expected:** both ready, as Phase 1 and Phase 4.
- **Don't assert:** the range beyond 4 (treasurer's open question).

### Block D — Commit, run states, idempotency, re-import, partial failure, concurrency

Run states (r4, prov., pending Sol Arch): previewed → running → completed, plus cancelled
and interrupted. Commit accepts only a previewed run of the caller's own, at most 60
minutes old. See status table S3.

#### TC-03-D1 — While committing, the page shows a progress count, then the finished banner
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** empty directory; `ZZ-import-623-clean.csv` previewed.
- **Action:** press Import; watch.
- **Expected:** a progress count during the run; then the finished banner. Wording: K43, K22.
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
- **Expected:** the button's label begins "Importing…" (Gherkin 4; copy of record "in flight: Importing…"); disabled until the run finishes.
- **Don't assert:** whether the "{x} of {n}" count sits on the button or beside it (K43; new gap NG12); whether Cancel is also disabled (not stated).

#### TC-03-D5 — Two admins importing the same file at once store 623 households
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions at once (Admin 1, Admin 2); empty directory; each has previewed the same file.
- **Action:** both commit at the same moment.
- **Expected:** 623 household records; one lot entry per lot (prov.).
- **Lane:** exclusive — asserts the directory total.
- **Don't assert:** which run wrote which row.

#### TC-03-D6 — Two racing imports' "Imported" counts add up to exactly 623
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D5.
- **Action:** read both runs' imported counts.
- **Expected:** the two counts sum to 623 (restated Gherkin 5; rows may interleave; prov., pending Sol Arch).
- **Don't assert:** either run's individual count; which admin finishes first.

#### TC-03-D7 — Re-uploading the file after an interrupted import previews only the unwritten rows as ready
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: on the emulator, stop the commit of `ZZ-import-623-clean.csv` after 300 households were written (Gherkin 9).
- **Action:** the same admin uploads the same file again; run the preview.
- **Expected:** 323 ready, 300 already in the directory, 0 won't be imported (a new run; the stuck run is not resumed). Heading wording: K20.
- **Don't assert:** which 300 rows were written.

#### TC-03-D8 — A lot added by the form between preview and commit is counted as already at commit
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Setup:** two sessions. Admin 1 previews a 3-row file with Blk 9 Lot 1 (classified ready); Admin 2 then adds Blk 9 Lot 1 as "ZZ Test Owner Golf".
- **Action:** Admin 1 commits.
- **Expected:** the commit result classifies Blk 9 Lot 1 as already in the directory, skipped, and counts it in already: 2 imported, 1 already (r4: "The commit's recount is authoritative"). Banner: K22.
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

#### TC-03-D13 — Uploading the same file again classifies every row as already in the directory
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3.
- **Action:** run the preview for `ZZ-import-623-clean.csv` again (Gherkin 6).
- **Expected:** 0 ready, 0 won't be imported, 623 already in the directory; still 623 household records. Footer sentence: B21.
- **Don't assert:** preview order.

#### TC-03-D14 — A fixed rejected-rows file previews only the fixed rows as ready
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8; downloaded 4 rows (with their Row and Reason columns); fix row 14 (add Lot 99), change one of 31/32 to Blk 2 Lot 70, leave 57.
- **Action:** run the preview for the fixed file without removing the Row and Reason columns.
- **Expected:** 3 ready (fixed 14, Blk 2 Lot 70, the remaining Blk 2 Lot 7); 1 won't be imported (57); Row and Reason are ignored and not reported as ignored columns (r4 "Columns"; screen: K27).
- **Don't assert:** row numbers in the new file's results beyond the one rejected row.

#### TC-03-D15 — A re-import with changed names updates no existing household
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3; the clean file with every owner name changed.
- **Action:** run the preview; then call commit directly for that run (no Import button is offered: B21).
- **Expected:** every household's display name equals its value before the upload (R1 never updates from import); the commit writes nothing.
- **Don't assert:** whether the direct commit is refused or completes with 0 imported.

#### TC-03-D16 — An inactive household's lot is classified as already in the directory (inactive)
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C deactivated; a file with Blk 7 Lot 1.
- **Action:** run the preview.
- **Expected:** Blk 7 Lot 1 classified with the inactive variant ("already in the directory (inactive), skipped") and counted in already (r4 "inactive household keeps its lot"; prov., pending Sol Arch). Wording: K21.
- **Don't assert:** wording here.

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
- **Expected:** exactly one of them reports Blk 9 Lot 2 as a duplicate: the form call refused as already in the directory, or the commit row counted in already. Wording: K21, K23.
- **Don't assert:** which one loses.

#### TC-03-D19 — Committing the fixed file adds exactly the three fixed rows
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after D14.
- **Action:** commit; read the records.
- **Expected:** households now exist for Blk 2 Lot 70, Blk 2 Lot 7 and the fixed row 14's lot; 622 households in total; row 57's lot absent.
- **Lane:** exclusive — asserts the directory total.
- **Don't assert:** record order.

#### TC-03-D20 — A re-import with changed names classifies every row as already in the directory
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** as D15.
- **Action:** run the preview.
- **Expected:** 0 ready, 0 won't be imported, 623 already in the directory.
- **Don't assert:** preview order.

#### TC-03-D21 — An import never creates or reactivates a household on an inactive lot
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D16 with two new valid rows added; commit the run.
- **Action:** read the records for Blk 7 Lot 1.
- **Expected:** one lot entry and one household; still inactive; name and contacts unchanged.
- **Don't assert:** the run's other rows.

#### TC-03-D22 — Each racing import reports every row it did not write as already in the directory
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D5.
- **Action:** read each run's per-row results.
- **Expected:** in each run, every row is either imported or already in the directory, skipped, so imported + already = 623 for each run; no row is in won't be imported (restated Gherkin 5; prov., pending Sol Arch).
- **Don't assert:** which rows each run wrote.

#### TC-03-D23 — Committing the re-upload after an interruption leaves exactly 623 households
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after D7.
- **Action:** commit the new run; read the records.
- **Expected:** 623 households, one lot entry per lot; the new run reports 323 imported and 300 already. Banner wording: K22.
- **Lane:** exclusive — asserts the directory total.
- **Don't assert:** record order.

#### TC-03-D24 — Rows written before an interruption stay written
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D7, before the re-upload.
- **Action:** read the records.
- **Expected:** the 300 households and their lot and contact records exist and are complete (household, lot and contact written together per row); none half-written.
- **Don't assert:** which 300.

#### TC-03-D25 — A running import with no progress for 15 minutes is marked interrupted
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: a run seeded as running whose last progress was 16 minutes ago (clock control).
- **Action:** read the run as its creator (or run the daily job).
- **Expected:** the run's state is interrupted (r4 data table; who marks it and when is prov., pending Sol Arch).
- **Don't assert:** the exact 15:00 boundary (new gap NG9); which of the function or the daily job marks it.

#### TC-03-D26 — A running import with progress in the last 15 minutes is not marked interrupted
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: a run seeded as running whose last progress was 14 minutes ago.
- **Action:** read the run as its creator; run the daily job.
- **Expected:** the run is still running (prov., pending Sol Arch).
- **Don't assert:** the 15:00 boundary (new gap NG9).

#### TC-03-D27 — Committing an interrupted run is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** a run in the interrupted state (from D25 or D7's stopped run).
- **Action:** its creator calls commit with that id.
- **Expected:** refused explicitly; no households written (r4: no resume in place; finish by uploading the file again).
- **Don't assert:** error text.

#### TC-03-D28 — Committing a cancelled run is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** after D31.
- **Action:** its creator calls commit with that id.
- **Expected:** refused explicitly; no households written (prov., pending Sol Arch).
- **Don't assert:** error text.

#### TC-03-D29 — A previewed run 59 minutes old can still be committed
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: a 3-row previewed run whose preview time is 59 minutes ago.
- **Action:** its creator commits.
- **Expected:** allowed; 3 households written (prov., pending Sol Arch).
- **Don't assert:** the exact 60:00 boundary (new gap NG9).

#### TC-03-D30 — A previewed run 61 minutes old can't be committed
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** special staging: a 3-row previewed run whose preview time is 61 minutes ago.
- **Action:** its creator commits.
- **Expected:** refused explicitly; no households written (r4: "A previewed run can't be committed after 60 minutes"; prov., pending Sol Arch).
- **Don't assert:** error text; what the screen says (not in the copy of record: new gap NG13).

#### TC-03-D31 — Cancel on the preview marks the run cancelled and deletes its rejected rows at once
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** `ZZ-import-623-problems.csv` previewed (4 rejected rows held on the run).
- **Action:** press Cancel; read the run record.
- **Expected:** state cancelled; no rejected rows held; the counts (619 / 4 / 0) kept (r4 data table; prov., pending Sol Arch). No household written (A2).
- **Don't assert:** whether the run record is later deleted.

#### TC-03-D32 — "Choose a different file" cancels the run the same way
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D31.
- **Action:** press "Choose a different file"; read the run record.
- **Expected:** state cancelled; rejected rows deleted; counts kept (prov., pending Sol Arch).
- **Don't assert:** where the page goes (L3).

#### TC-03-D33 — The run's progress count rises while it commits
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D1.
- **Action:** read the run record several times during the commit.
- **Expected:** the progress value never decreases and ends at the imported count, 623 (r4: "Counts: … progress"; prov., pending Sol Arch).
- **Don't assert:** intermediate values or step size.

### Block E — Rejected-rows report, download and import-run access

#### TC-03-E1 — The download holds exactly the rejected rows with their reasons
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8.
- **Action:** download the rejected rows.
- **Expected:** 4 data rows (from rows 14, 31, 32, 57) with the template columns plus Row and Reason; no valid row.
- **Don't assert:** file name; the position of the extra columns.

#### TC-03-E2 — Already-in-directory rows are not in the download
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists; a file with 2 valid new rows, 1 row with no lot, and 1 row for Blk 4 Lot 12; previewed and committed.
- **Action:** download from the preview ("Download these rows") and from the banner ("Download them").
- **Expected:** each file holds only the no-lot row; Blk 4 Lot 12 is in neither (r4: download holds only the {m} problem rows).
- **Don't assert:** file name.

#### TC-03-E3 — Cells starting with "=", "+", "-" or "@" are escaped in the download file
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** four rejected rows (no lot) with owner names `=HYPERLINK("http://example.test")`, `+1+1`, `-2+3`, `@SUM(1)`.
- **Action:** download; read the raw file.
- **Expected:** each of those cells starts with `'`. Spreadsheet behaviour: E7.
- **Don't assert:** quoting of other cells.

#### TC-03-E4 — A "+639…" mobile in the download is accepted again after a fix
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a rejected row (no lot) with mobile `+639000000099`.
- **Action:** download (cell becomes `'+639000000099`), add the lot, preview and commit.
- **Expected:** the row is ready; the import removed the one leading `'` (r4 "Leading apostrophe"); the contact record holds the same number as `+639000000099` would store (N3). Display: C24.
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
- **Don't assert:** error text. Other staff: E9.

#### TC-03-E7 — Escaped cells don't evaluate as formulas when the download is opened in a spreadsheet app
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** the E3 file.
- **Action:** open it in a spreadsheet app.
- **Expected:** none of the four cells evaluates as a formula or opens a link.
- **Don't assert:** how the app displays the apostrophe.

#### TC-03-E8 — The download's Reason column joins a row's reasons with "; " as the preview does
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** the C21 row (no lot, email `zz@`) in a previewed file.
- **Action:** download the rows; read the Reason cell.
- **Expected:** the same reasons, in the same order, joined by "; ", as the preview result (r4: "Same in the download's Reason column").
- **Don't assert:** quoting of the cell.

#### TC-03-E9 — Another staff member can't read an import run they didn't start
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8 (run by Admin 1); ZZ Test Admin 2 and ZZ Test Treasurer hold the import id.
- **Action:** each reads `importRuns/{id}` (prov.) and requests its rejected-rows download.
- **Expected:** each refused explicitly (r4: "Read only by the staff member who ran it"; prov., pending Sol Arch).
- **Don't assert:** error text.

#### TC-03-E10 — The staff member who ran an import can read it
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8; Admin 1.
- **Action:** read `importRuns/{id}` (prov.); download the rejected rows.
- **Expected:** both allowed (positive control for E6, E9).
- **Don't assert:** payload field names.

#### TC-03-E11 — Step 1 shows each staff member only their own last import
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8 (Admin 1's run); Admin 2 has never imported; the Treasurer ran a later 3-row import.
- **Action:** each opens Import households.
- **Expected:** Admin 1 sees a last-import line for the A8 run; the Treasurer sees one for their own run; Admin 2 sees none (r4 Copy "Last import"; Out of scope: no shared list). Wording: K47.
- **Don't assert:** wording here.

#### TC-03-E12 — A value stored as "=…" is escaped again on the next download
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** a file where a rejected row (no lot) has owner "'=ZZ Test Formula" (read as "=ZZ Test Formula" once the apostrophe is removed, C31).
- **Action:** preview; download the rows; read the raw cell.
- **Expected:** the cell starts with `'` again (r4: "escaped again on the next download").
- **Don't assert:** quoting of other cells.

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

#### TC-03-F9 — Adding the lot of an inactive household is refused with the inactive result
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C inactive.
- **Action:** add Block 7, Lot 1 (Gherkin 11).
- **Expected:** refused with the inactive variant of the duplicate result (r4 "An inactive household keeps its lot"; prov., pending Sol Arch); nothing saved; still one Blk 7 Lot 1, inactive. Wording: K28.
- **Don't assert:** wording here (K28).

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
- **Expected:** one succeeds; the other is refused as already in the directory (Gherkin 16: "exactly one is saved"). Wording: K23 (the duplicate-lot copy of record).
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

#### TC-03-F16 — The form applies the import's normalisation when checking for a duplicate
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** Household G (Blk 4 Lot 12-A) seeded.
- **Action:** add Block "04", Lot "12a" (or call `createHousehold`, prov., with those values).
- **Expected:** refused as already in the directory; still one Blk 4 Lot 12-A (r4: normalisation "applied the same way by the import, the Add/Edit form and the lot-key builder").
- **Don't assert:** wording here (K23).

#### TC-03-F17 — The form stores normalised block, lot and label
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Blk 33 Lot 5-B absent.
- **Action:** add Block "Blk 33", Lot "5 b", owner "ZZ Test Owner Mike"; Save; read the household record.
- **Expected:** block 33, lot "5-B", label "Blk 33 Lot 5-B".
- **Don't assert:** the key string.

#### TC-03-F18 — An 81-character owner name is refused by the server on add
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1; the C5 name (81 characters).
- **Action:** call `createHousehold` (prov.) directly with it.
- **Expected:** refused explicitly; no record written (r4 data table: "Required, up to 80 characters").
- **Don't assert:** whether the form field stops typing at 80 or shows a message (new gap NG15).

#### TC-03-F19 — The form rejects invalid block and lot values by the import's rule
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Add household.
- **Action:** submit Block "4A", Lot 1; then Block 4, Lot "12-AB3".
- **Expected:** each refused with the invalid-block / invalid-lot reason; no record written.
- **Don't assert:** where on the form the message shows.

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
- **Expected:** refused as stale (r4: deactivate counts as a change; `updatedAt` bump prov., pending Sol Arch); household stays inactive, values unchanged. Message: K24 (the standard stale-edit copy).
- **Don't assert:** message placement.

#### TC-03-G10 — Double-tapping Save on an edit writes one change
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A edit form, mobile changed.
- **Action:** double-tap Save; read the records.
- **Expected:** one update; one `household.updated` audit record. Screen: G14.
- **Don't assert:** whether the second tap reached the server.

#### TC-03-G11 — A confirmed lot change stores the household under the new lot with the same id
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F (Blk 12 Lot 12-A); Blk 12 Lot 12-B absent (Household H not seeded). Note F's household id.
- **Action:** open F's dialog, change Lot to 12-B, Save, confirm "Change lot" (Gherkin 14); read the household record.
- **Expected:** the same household id now has lot "12-B" and label "Blk 12 Lot 12-B"; name, contacts and phase unchanged (decision 3; prov., pending Sol Arch). Confirm wording: K29; list: G29.
- **Don't assert:** the key string.

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

Lot changes on edit (decision 3, r4): Block and Lot are editable; on Save with a changed
lot the admin confirms "Change lot", and the server moves the lot key in one transaction.
The household keeps its id, members, invitations and history. All lot-move cases are
**(prov., pending Sol Arch)** for the `updateHousehold` transaction. Target states: S5.

#### TC-03-G15 — A lot change keeps the household's members and link status
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A (Blk 4 Lot 12, Linked, one member: ZZ Test Homeowner A); Blk 4 Lot 13 absent.
- **Action:** change A's lot to 13 and confirm; read the `members` record and the household record.
- **Expected:** the member record still points to the same household id; link status still Linked; member count still 1.
- **Don't assert:** what Homeowner A's screens show (their own household pages belong to later REQs).

#### TC-03-G16 — A lot change keeps an unused invitation working for the same household
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household C (Blk 7 Lot 1, Invited, unused code); Blk 7 Lot 2 absent.
- **Action:** change C's lot to 2 and confirm; ZZ Test No-Role User redeems the code.
- **Expected:** redemption succeeds and the new member record points to Household C's id (r4: "keeps its id, members, invitations").
- **Don't assert:** which lot label the REQ-004 join screen shows (new gap NG7).

#### TC-03-G17 — A lot change writes one `household.relotted` record and keeps the household's earlier history
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after G11 (F had a `household.created` record before the move).
- **Action:** read audit records for F's household id.
- **Expected:** one `household.relotted` (prov.) with Admin 1's uid and F's household id, ids only; the earlier records still reference the same household id.
- **Don't assert:** whether the record carries the old and new lot keys.

#### TC-03-G18 — After a lot change the old lot can be added again
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after G11.
- **Action:** add Block 12, Lot 12-A, owner "ZZ Test Owner November" (Gherkin 14).
- **Expected:** saved; a new household with a different id holds Blk 12 Lot 12-A.
- **Don't assert:** the new id.

#### TC-03-G19 — A lot change leaves exactly one lot entry for the household, at the new lot
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after G11, before G18.
- **Action:** read the `lots` entries (prov.) for Blk 12 Lot 12-A and Blk 12 Lot 12-B.
- **Expected:** no entry for 12-A; the entry for 12-B points to F's household id (never both, never neither).
- **Don't assert:** the key string.

#### TC-03-G20 — A lot change to a lot already in the directory is refused and moves nothing
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F (Blk 12 Lot 12-A) and Household H (Blk 12 Lot 12-B) seeded.
- **Action:** change F's lot to 12-B and confirm.
- **Expected:** refused as already in the directory; F still Blk 12 Lot 12-A; H unchanged; one lot entry each; no `household.relotted` record. Wording under Lot: K23.
- **Don't assert:** whether the refusal comes before or after the confirm.

#### TC-03-G21 — Cancel on the "Change lot" confirm leaves the lot unchanged
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F; Blk 12 Lot 12-B absent.
- **Action:** change Lot to 12-B, Save, press Cancel on the confirm; read the record.
- **Expected:** F still Blk 12 Lot 12-A; no lot entry for 12-B; no audit record.
- **Don't assert:** whether the household dialog stays open with 12-B typed.

#### TC-03-G22 — A lot change saved after someone else's edit is refused as stale and moves nothing
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions load Household F; Admin 2 saves a new mobile.
- **Action:** Admin 1 changes Lot to 12-B, saves and confirms.
- **Expected:** refused as stale; F still Blk 12 Lot 12-A with Admin 2's mobile; no lot entry for 12-B. Message: K24.
- **Don't assert:** message placement.

#### TC-03-G23 — An edit loaded before someone else's lot change is refused as stale
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions load Household F; Admin 1 changes its lot to 12-B and confirms.
- **Action:** Admin 2 saves a new mobile.
- **Expected:** refused as stale; F is Blk 12 Lot 12-B with its old mobile. Message: K24.
- **Don't assert:** message placement.

#### TC-03-G24 — Two households moved to the same free lot at once: exactly one moves
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions; Admin 1 edits Household F, Admin 2 edits Household G; Blk 12 Lot 12-C absent.
- **Action:** both change their lot to Blk 12 Lot 12-C and confirm at the same moment.
- **Expected:** exactly one household holds Blk 12 Lot 12-C; the other keeps its old lot; one lot entry for 12-C.
- **Don't assert:** which one wins.

#### TC-03-G25 — Changing the block moves the lot the same way
**Priority** P3 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F (Blk 12 Lot 12-A); Blk 13 Lot 12-A absent.
- **Action:** change Block to 13 and confirm.
- **Expected:** same household id now Blk 13 Lot 12-A; no lot entry for Blk 12 Lot 12-A.
- **Don't assert:** the key string.

#### TC-03-G26 — A lot change to an inactive household's lot is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F; Household K (Blk 15 Lot 3, inactive) seeded.
- **Action:** change F to Block 15, Lot 3 and confirm.
- **Expected:** refused; F unchanged; K unchanged and inactive (r4: the server refuses a lot that exists; an inactive household keeps its lot).
- **Don't assert:** whether the message is the plain or the inactive duplicate copy (new gap NG6).

#### TC-03-G27 — A lot change that normalises to the current lot moves nothing
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F (Blk 12 Lot 12-A).
- **Action:** retype Lot as "12a"; Save (confirm if asked).
- **Expected:** still one lot entry for Blk 12 Lot 12-A pointing to F; lot stored "12-A".
- **Don't assert:** whether the "Change lot" confirm appears or a `household.relotted` record is written (new gap NG6).

#### TC-03-G28 — An inactive household's edit is saved and it stays inactive
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household C inactive.
- **Action:** open its dialog from the Inactive list; change the mobile; Save; read the records.
- **Expected:** the new mobile stored; `active` still false (r4 household dialog: "inactive: Reactivate · Cancel · Save").
- **Don't assert:** link status.

#### TC-03-G29 — After a lot change the list shows the new label without a reload
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as G11, list unfiltered.
- **Action:** after confirming, read the list.
- **Expected:** a row "Blk 12 Lot 12-B" for ZZ Test Owner Foxtrot; no row "Blk 12 Lot 12-A" (Gherkin 14).
- **Don't assert:** list position.

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
- **Action:** reactivate Blk 7 Lot 1 and confirm; run the default and the Inactive list queries.
- **Expected:** `active` is true; the default query returns Blk 7 Lot 1; the Inactive query doesn't. Confirm wording: K30.
- **Don't assert:** the confirm here (K30).

#### TC-03-H7 — Reactivate keeps the name, contacts and members
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household A (Linked) deactivated, then reactivated.
- **Action:** read the household, contact and `members` records.
- **Expected:** same name and contacts; member record still present.
- **Don't assert:** link status here (H19).

#### TC-03-H8 — Reactivate doesn't bring a cancelled invitation back
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H4 (Household C deactivated while its invitation was unused; no members); reactivate Household C.
- **Action:** No-Role User redeems the old code (Gherkin 12).
- **Expected:** still refused; no membership created (r4: "Reactivate never brings it back"). The refusal wording ("This invitation is no longer valid. Ask the admin office.") is REQ-004 copy and belongs to TC-04.
- **Don't assert:** the link status here (H20).

#### TC-03-H9 — Double-tapping Deactivate's confirm writes one change
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F active.
- **Action:** double-tap the confirm button.
- **Expected:** inactive; one `household.deactivated` record.
- **Don't assert:** dialog animation.

#### TC-03-H10 — Deactivate on an inactive household or Reactivate on an active one is refused with no record
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C inactive, Household F active.
- **Action:** call `setHouseholdActive` (prov.) to deactivate C and to reactivate F.
- **Expected:** each refused explicitly; `active` unchanged; `updatedAt` unchanged; no new audit record (r4: "refused by the server with no change"; "Refused no-op changes write nothing"; prov., pending Sol Arch). Stale-screen message: K31.
- **Don't assert:** error text.

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

#### TC-03-H13 — An inactive household's row offers only Reactivate
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a household in "Email failed" and one in "Invite expired" (REQ-004 fixtures), both deactivated.
- **Action:** open the Inactive list; read each row's actions.
- **Expected:** "Reactivate" is the only action; no Resend, Print slip or other invite action (r4: "Inactive rows offer only Reactivate: no invite actions").
- **Don't assert:** which link-status pill the row shows.

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
- **Don't assert:** counts (J22).

#### TC-03-H17 — After a deactivation the Inactive chip rises by one and All falls by one, without a reload
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household C active; note the Inactive and All chip counts.
- **Action:** deactivate and confirm.
- **Expected:** "Inactive" one higher; "All" one lower (r4: chip counts are active households only); Blk 7 Lot 1 gone from the visible list.
- **Don't assert:** chip styling.

#### TC-03-H18 — Reactivate writes one `household.reactivated` record
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after H6.
- **Action:** read audit records for Household C.
- **Expected:** one `household.reactivated` (prov.) with Admin 1's uid; ids only.
- **Don't assert:** time.

#### TC-03-H19 — A reactivated household that still has members gets link status "Linked"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as H7 (Household A, one member).
- **Action:** read the household record after Reactivate.
- **Expected:** link status Linked; member count 1 (r4: "worked out again").
- **Don't assert:** the stored value's spelling (prov.).

#### TC-03-H20 — A reactivated household with no members gets link status "Not invited"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as H8 (Household C was Invited, no members).
- **Action:** read the household record after Reactivate (Gherkin 12).
- **Expected:** link status Not invited; member count 0 (not "Invited"). Pill words: K13.
- **Don't assert:** the stored value's spelling (prov.).

#### TC-03-H21 — An invitation for an inactive household is refused by the server
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F deactivated; Admin 1.
- **Action:** call REQ-004's `createInvites` (prov.) for F, as a stale screen would.
- **Expected:** refused explicitly; no invitation record written; link status unchanged (r4: `createInvites` refuses an inactive household; prov., pending Sol Arch). Message: K32.
- **Don't assert:** error text.

#### TC-03-H22 — An inactive household can't be selected for "Invite selected"
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F deactivated; the list's selection mode for REQ-004's "Invite selected".
- **Action:** try to select F's row under Inactive (and under All, where it isn't listed).
- **Expected:** F can't be selected; any bulk invite started excludes it.
- **Don't assert:** how the disabled selection looks.

#### TC-03-H23 — Undo on the deactivate toast within 10 seconds makes the household active again
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F active.
- **Action:** deactivate and confirm; press Undo in the toast within 10 seconds; read the record.
- **Expected:** `active` true; F back in the default list (r4: "Deactivate shows a toast with Undo for 10 seconds"). Toast wording: K33.
- **Don't assert:** whether Undo shows the Reactivate confirm first (new gap NG8); the audit records written.

#### TC-03-H24 — Cancel on the Reactivate confirm leaves the household inactive
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C inactive.
- **Action:** press Reactivate; press Cancel on the confirm; read the record.
- **Expected:** `active` still false; no `household.reactivated` record.
- **Don't assert:** dialog animation.

#### TC-03-H25 — Deactivate and Reactivate each update the household's last-changed time
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F; note `updatedAt` (prov.).
- **Action:** deactivate; read; reactivate; read.
- **Expected:** `updatedAt` later after each step (the basis for G9; r4: setHouseholdActive bumps `updatedAt`, prov., pending Sol Arch).
- **Don't assert:** the time values.

### Block J — Directory list, search and paging

Search cases assert the result set of the directory query (prov.: `searchTokens`, `lotKey`
index; prefix and accent-folded tokens are prov., pending Sol Arch); J3, J8, J9, J14, J15
and J23 are the screen cases. r4 rule: names match word starts of 2+ characters, ignoring
case and accents; lot forms "blk 4", "block 4", "b4", "4", "blk 4 lot 12", "b4 l12", "4-12";
search applies within the chosen chip.

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

#### TC-03-J5 — A search for "santos" also returns "Santoson", a word starting with it
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as J4.
- **Action:** search "santos".
- **Expected:** "ZZ Test Santoson" is in the results (r4: word-start match; Gherkin 22's "contains the word" is met by "a word starting with").
- **Don't assert:** order.

#### TC-03-J6 — Search ignores letter case
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** search "BLK 4", then "SANTOS".
- **Expected:** same result sets as J1 and J4.
- **Don't assert:** order.

#### TC-03-J7 — "peña", "pena" and "PENA" all return "ZZ Test Peña"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set.
- **Action:** search "peña", then "pena", then "PENA".
- **Expected:** each result set includes "ZZ Test Peña" (r4: ignoring case and accents).
- **Don't assert:** order.

#### TC-03-J8 — A search with no match reads the copy of record, distinct from the empty directory
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** type "zzqqxx".
- **Expected:** "No households match "zzqqxx"." with a "Clear search" button; not the empty-directory text (J9).
- **Don't assert:** layout.

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
- **Expected:** not returned under All; returned under Inactive (r4: "Search applies within the chosen chip").
- **Don't assert:** chip counts.

#### TC-03-J14 — Each filter chip's count matches the rows it lists
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** fixtures in each link status plus one inactive; also after A3 ("Not invited (623)").
- **Action:** choose each chip.
- **Expected:** count shown equals rows listed.
- **Don't assert:** chip styling. Whether All counts inactive: J22.

#### TC-03-J15 — With exactly 50 households no next-page control is offered
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** the two directories from J10.
- **Action:** open Homeowners.
- **Expected:** 50: no next-page control. 51: a next-page control that shows the one remaining household.
- **Don't assert:** pager control style.

#### TC-03-J16 — A search for "tos" returns no Santos (no match inside a word)
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set.
- **Action:** search "tos".
- **Expected:** none of "ZZ Test Santos", "ZZ Test Dos Santos", "ZZ Test Santoson" is returned (r4 Out of scope: search inside words).
- **Don't assert:** whether other households are returned.

#### TC-03-J17 — A search for "san" returns every name with a word starting "San"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set.
- **Action:** search "san".
- **Expected:** results include "ZZ Test Santos", "ZZ Test Dos Santos" and "ZZ Test Santoson".
- **Don't assert:** order.

#### TC-03-J18 — A search for "peña" also returns a name typed without the ñ
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set ("ZZ Test Pena" and "ZZ Test Peña").
- **Action:** search "peña".
- **Expected:** both "ZZ Test Peña" and "ZZ Test Pena" returned (accent folding works both ways).
- **Don't assert:** order.

#### TC-03-J19 — The lot forms "block 4", "b4" and "4" return the same Block 4 set as "blk 4"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** search "block 4", "b4", "4" and "BLK4" in turn.
- **Expected:** each returns Blk 4 Lots 1–6 and Blk 4 Lot 12, and nothing from Blocks 40–49 or Blk 14.
- **Don't assert:** order.

#### TC-03-J20 — The lot forms "blk 4 lot 12", "b4 l12" and "4-12" return Blk 4 Lot 12 and no other Block 4 lot
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** as J1.
- **Action:** search each form in turn.
- **Expected:** each returns Blk 4 Lot 12; none returns Blk 4 Lots 1–6 or Blk 14 Lot 4.
- **Don't assert:** whether Blk 4 Lot 12-A is also returned (new gap NG5).

#### TC-03-J21 — A two-word name search returns the owner whose words start with both
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
- **Setup:** ZZ Search Set.
- **Action:** search "dos san".
- **Expected:** results include "ZZ Test Dos Santos" (multi-word design prov., pending Sol Arch).
- **Don't assert:** whether names matching only one of the words are also returned (new gap NG4).

#### TC-03-J22 — The All chip and the heading count active households only; Inactive counts its own
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
- **Setup:** a directory of exactly 10 active and 2 inactive households.
- **Action:** read the heading count and the All, Not invited and Inactive chip counts from the query results.
- **Expected:** heading 10; All 10; every link-status chip counts active households only; Inactive 2 (r4 "Live search" and copy "Page heading … (active only)").
- **Lane:** exclusive — asserts the directory totals.
- **Don't assert:** wording (K19).

#### TC-03-J23 — "Clear search" restores the unfiltered list within the chosen chip
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** Inactive chip chosen; search "zzqqxx" showing the no-match message.
- **Action:** press "Clear search".
- **Expected:** the search box is empty; the full Inactive list is shown; the Inactive chip is still chosen; focus is in the search box or on the list, not lost to the page top.
- **Don't assert:** where exactly focus lands.

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

#### TC-03-K11 — Escape on a half-filled dialog asks "Discard your changes to this household?" with "Keep editing" focused
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as K9 (owner name typed in Add household).
- **Action:** press Escape (Gherkin 13).
- **Expected:** the dialog stays open with the name still typed; the confirm "Discard your changes to this household?" with buttons "Keep editing" and "Discard" appears; focus is on "Keep editing". NAV-06 still holds for a dialog with no changes (K35).
- **Don't assert:** what a second Escape on the confirm does (new gap NG14).

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

#### TC-03-K18 — The same concept uses the same word on every screen size
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** directory, chips, phone cards at 375 px, desktop, REQ-004 screens.
- **Action:** compare link status words and button labels.
- **Expected:** identical words everywhere; the import button reads "Import households" on the phone as on desktop (r4: "all screen sizes"; mock-up 3B to be corrected).
- **Don't assert:** button layout (K40).

#### TC-03-K19 — The page heading reads "Homeowners · {n} households" with the stored count
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** after A3 (623 households); also after A14 (3); also 3 active plus 1 inactive.
- **Action:** open Homeowners.
- **Expected:** "Homeowners · 623 households"; "Homeowners · 3 households"; with one inactive: "Homeowners · 3 households" (active only). Refresh after writes: P6; singular: K41.
- **Don't assert:** heading layout.

#### TC-03-K20 — The preview heading and Import button read the copy of record with the preview's counts
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** four previews: A1 (623 clean), A5 (619 / 4), A9 (3 ready, 1 already), D7 (323 ready, 300 already).
- **Action:** read the preview heading and Import button.
- **Expected:** A1: "623 households ready to import", no list of rows that won't be imported, button "Import 623 households". A5: "619 households ready to import · 4 rows won't be imported", button "Import 619 households". A9: "3 households ready to import · 1 already in the directory", button "Import 3 households". D7: "323 households ready to import · 300 already in the directory" (Gherkin 9). Zero parts are dropped.
- **Don't assert:** tile layout.

#### TC-03-K21 — Each preview row reason reads the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A exists, Household C inactive; one file with a row for each reason: no lot, no block, no owner name, Blk 2 Lot 7 twice, Blk 4 Lot 12, Blk 7 Lot 1, email `zz-ana@`, mobile `0900000001`, an 81-character owner name, Block "4A", Lot "12-AB3", Phase "Phase 9", and row 23 with no lot and email `zz@`.
- **Action:** read each row's reason.
- **Expected:** "Lot number is missing"; "Block is missing"; "Owner name is missing"; "Blk 2 Lot 7 appears more than once in the file" (both rows); "Already in the directory, skipped"; "Already in the directory (inactive), skipped"; "\"zz-ana@\" is not a valid email address"; "\"0900000001\" is not a valid mobile number"; "Owner name is longer than 80 characters"; "Block \"4A\" isn't a block number. Use a whole number, like 4."; "Lot \"12-AB3\" isn't a lot number. Use a number like 12, or 12-A."; "Phase \"Phase 9\" isn't a phase. Use Phase 1 to Phase 4, or leave it blank."; row 23: "Lot number is missing; \"zz@\" is not a valid email address". The C-block and A5 cases rely on this case for wording.
- **Don't assert:** row styling (K42).

#### TC-03-K22 — The finished banner reads the copy of record with the run's counts
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** after A8 (619 / 4 / 0); after A3 (623 / 0 / 0); after D23 (323 / 0 / 300); after a commit of 3 ready, 2 problem and 2 already rows.
- **Action:** read the banner.
- **Expected:** A8: "Imported 619 households. 4 rows were not imported. Download them to fix and import again." with "Download them" working (content E1). A3: exactly "Imported 623 households." D23: "Imported 323 households. 300 lots were already in the directory and were left unchanged." Mixed: "Imported 3 households. 2 rows were not imported. Download them to fix and import again. 2 lots were already in the directory and were left unchanged." Each sentence is dropped when its count is 0.
- **Don't assert:** the singular of the "lots were already" sentence (new gap NG2); banner position.

#### TC-03-K23 — The duplicate-lot message reads "{lot} is already in the directory." under Lot and Save is disabled
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** as F3; also the losing session of F6; also G20 (lot change to Blk 12 Lot 12-B).
- **Action:** leave the Lot field (or read after Save); read the message.
- **Expected:** "Blk 8 Lot 2 is already in the directory." under Lot, tied to the field for screen readers; Save disabled (mock-up 3E). F6's losing session: "Blk 9 Lot 1 is already in the directory.". G20: "Blk 12 Lot 12-B is already in the directory." (r4 decision 3 refuses a lot that exists).
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
- **Don't assert:** phone layout (K18, K40).

#### TC-03-K26 — An import run from a phone stores the file's households
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** Yes
- **Setup:** 375 px phone emulation; empty directory; 3-row file.
- **Action:** choose the file and commit on the phone; read the records.
- **Expected:** 3 household records.
- **Don't assert:** preview table layout on the phone.

#### TC-03-K27 — Ignored columns are named above the tiles, except our own Row and Reason
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** two previews: B13 (extra "Notes" column); D14 (fixed download with Row and Reason columns).
- **Action:** read the area above the tiles.
- **Expected:** B13: "Ignored columns: Notes." D14: no ignored-columns line (r4: Row and Reason "are ignored silently").
- **Don't assert:** line styling.

#### TC-03-K28 — Adding an inactive household's lot shows the inactive duplicate message under Lot
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** as F9 (Household C inactive).
- **Action:** enter Block 7, Lot 1 in Add household; leave the Lot field (or press Save).
- **Expected:** "Blk 7 Lot 1 is already in the directory but inactive. Reactivate it from the Inactive list." under the Lot field, tied to it for screen readers (Gherkin 11).
- **Don't assert:** any link to the Inactive list (not in r4).

#### TC-03-K29 — The lot change confirm reads the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Household F's dialog; Lot changed to 12-B; Save pressed.
- **Action:** read the confirm.
- **Expected:** "Change Blk 12 Lot 12-A to Blk 12 Lot 12-B? The household keeps its members and history. Blk 12 Lot 12-A becomes free to add." with buttons "Cancel" and "Change lot". Each promise verified: members G15, history G17, free to add G18.
- **Don't assert:** button order.

#### TC-03-K30 — The Reactivate confirm reads the copy of record, with and without linked members
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Household C inactive, no members; Household B inactive with two members (seed a second member).
- **Action:** press Reactivate on each; read the confirm.
- **Expected:** C: "Reactivate Blk 7 Lot 1? It will be billed and shown in the list again." B: "Reactivate Blk 1 Lot 3? It will be billed and shown in the list again, and its 2 linked members get full access back." Buttons "Cancel" and "Reactivate".
- **Don't assert:** the one-member wording (new gap NG2); "will be billed" (billing REQ).

#### TC-03-K31 — A stale Deactivate or Reactivate says the household is already in that state and refreshes the list
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** two sessions on Household F's dialog; Admin 2 deactivates F first.
- **Action:** Admin 1 presses Deactivate and confirms. Repeat the other way round for Reactivate on Household C.
- **Expected:** "Blk 12 Lot 12-A is already inactive." / "Blk 7 Lot 1 is already active."; the list refreshes to the current state (r4 Copy "Already in state").
- **Don't assert:** message placement.

#### TC-03-K32 — A stale invite on an inactive household reads the copy of record
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** two sessions; Admin 1 has Household F's invite action open (REQ-004); Admin 2 deactivates F.
- **Action:** Admin 1 sends the invitation.
- **Expected:** "Blk 12 Lot 12-A is inactive. Reactivate it before sending an invitation."
- **Don't assert:** message placement.

#### TC-03-K33 — The deactivate and reactivate toasts read the copy of record
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Household F active.
- **Action:** deactivate and confirm; wait; then reactivate and confirm.
- **Expected:** "Blk 12 Lot 12-A deactivated." with an "Undo" button, gone after about 10 seconds; then "Blk 12 Lot 12-A reactivated."; both announced to screen readers.
- **Don't assert:** the exact disappearance time.

#### TC-03-K34 — The household dialog shows the lot as its title and the r4 buttons, active and inactive
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Household A (active) and Household C (inactive).
- **Action:** open each household's dialog.
- **Expected:** A: title "Blk 4 Lot 12"; buttons Deactivate (left, apart from Save), Cancel, Save. C: title "Blk 7 Lot 1" with an "Inactive" pill; buttons Reactivate (in Deactivate's place), Cancel, Save. Same fields as Add household.
- **Don't assert:** pixel layout (mock-up screen 3F not yet drawn).

#### TC-03-K35 — Escape on a dialog with no changes closes it
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** Add household open, nothing typed; also Household A's dialog opened and not changed.
- **Action:** press Escape.
- **Expected:** the dialog closes with no confirm (NAV-06 unchanged for clean dialogs).
- **Don't assert:** focus position afterwards.

#### TC-03-K36 — The × button on a dialog with unsaved changes asks the same as Escape
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as K10 (mobile changed in Household A's dialog).
- **Action:** press ×.
- **Expected:** the discard confirm appears with "Keep editing" focused; the change is still there (r4: "× behaves like Escape").
- **Don't assert:** wording here (K11).

#### TC-03-K37 — Cancel on a dialog with unsaved changes closes it without asking
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as K9.
- **Action:** press Cancel; read the records.
- **Expected:** the dialog closes with no confirm; nothing saved (r4: "Cancel closes").
- **Don't assert:** focus position afterwards.

#### TC-03-K38 — Discard on the discard confirm closes the dialog and saves nothing
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as K11.
- **Action:** press Discard; read the records.
- **Expected:** the dialog closes; no household, lot or contact record written for the typed name.
- **Don't assert:** focus position afterwards.

#### TC-03-K39 — "Keep editing" returns to the dialog with the typing intact
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Setup:** as K11.
- **Action:** press "Keep editing"; type more; press Save.
- **Expected:** the confirm closes; the dialog shows the typed name; focus is back in the form; Save then works normally.
- **Don't assert:** which field gets focus.

#### TC-03-K40 — At 320 px the two directory buttons fit side by side or stack full width with Add household first
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Setup:** phone emulation at 320 px and at 375 px.
- **Action:** read the button area on Homeowners.
- **Expected:** both labels in full ("Import households", "Add household"); at 375 px side by side; at 320 px either side by side or stacked full width with Add household first; no sideways scroll.
- **Don't assert:** which of the two at 320 px.

#### TC-03-K41 — Counts follow the count rule: singular for 1, zero parts dropped, a comma from 1,000
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** a directory of 1 household; a preview with 1 ready and 1 problem row, then its commit; the B17 preview (2,000 ready).
- **Action:** read the heading, preview heading, Import button and banner.
- **Expected:** "Homeowners · 1 household"; "1 household ready to import · 1 row won't be imported"; "Import 1 household"; "Imported 1 household. 1 row was not imported. Download it to fix and import again."; "2,000 households ready to import" and "Import 2,000 households". Never "(s)".
- **Don't assert:** the singular "lot was already" form (new gap NG2).

#### TC-03-K42 — Already-in-directory rows are listed in row order with muted reasons that are words, not colour alone
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** the A15 preview (2 problem rows, 1 already row).
- **Action:** read the "Rows that won't be imported" table; check contrast.
- **Expected:** all three rows in ascending row order; the already row's reason in muted text that still meets 4.5:1 contrast and reads "Already in the directory, skipped".
- **Don't assert:** the muted colour value.

#### TC-03-K43 — During a commit the page shows "Importing… {x} of {n}" and asks to keep the page open
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** as D1.
- **Action:** read the page during the commit.
- **Expected:** "Importing… {x} of 623" with {x} rising, and "Keep this page open until the import finishes."
- **Don't assert:** whether the count is on the button or beside it (new gap NG12); intermediate values.

#### TC-03-K44 — A failed commit call shows how many households were imported and how to finish
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: as D7 (commit stopped after 300), the run still readable.
- **Action:** read the page.
- **Expected:** "The import stopped before it finished. 300 households were imported. Upload the same file again to import the rest. Households already imported will be skipped." The promise is verified by D7 and D23.
- **Don't assert:** how the browser learns of the failure (network behaviour assumed only, not asserted).

#### TC-03-K45 — If the run can't be read after a failure, the page says the import may not have finished
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: commit cut off and the run unreadable (offline after the failure).
- **Action:** read the page.
- **Expected:** "The import may not have finished. Upload the same file again: households already imported will be skipped."
- **Don't assert:** how the SDK reports the offline read (assumption about the network, not asserted).

#### TC-03-K46 — After an interrupted import, step 1 shows the stopped message the next time
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1's latest run is interrupted (D25) with 300 imported.
- **Action:** Admin 1 opens Import households.
- **Expected:** the "The import stopped before it finished. 300 households were imported. …" message shown on step 1 (r4 UX "States"). Admin 2 opening the page sees no such message (E11).
- **Don't assert:** banner styling.

#### TC-03-K47 — Step 1 shows "Your last import" with a download link within 30 days
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8 (run today).
- **Action:** Admin 1 opens Import households.
- **Expected:** "Your last import, {date}: 619 households imported, 4 rows not imported. Download them" with "Download them" giving the E1 file.
- **Don't assert:** the {date} format or its time zone (new gap NG10).

#### TC-03-K48 — After 30 days "Your last import" drops the download
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: Admin 1's last run dated 31 Asia/Manila days ago, rejected rows deleted (N10).
- **Action:** Admin 1 opens Import households.
- **Expected:** "Your last import, {date}: 619 households imported." with no download link.
- **Don't assert:** the {date} format (new gap NG10).

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
- **Expected:** step 1 with an empty file input. That nothing is saved by a preview: A2; what happens to the run: D32.
- **Don't assert:** the run record here (D32).

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

#### TC-03-L7 — Reloading on the preview returns to step 1 with an empty file input and no message
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** preview shown.
- **Action:** reload.
- **Expected:** step 1, file input empty, no file message and no preview restored (r4 UX "States": "Reload on the preview returns to step 1"). Nothing saved: L15.
- **Don't assert:** the "Your last import" line (K47), which may show if an earlier run exists.

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

#### TC-03-L15 — Reloading on the preview stores no household and leaves the run previewed
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** as L7.
- **Action:** reload; read the records for the file's lots and the run record.
- **Expected:** no household, lot or contact record for any of them; the abandoned run is still previewed (not cancelled), and can't be committed once 60 minutes have passed (D30) (prov., pending Sol Arch).
- **Don't assert:** when the daily job removes its rejected rows (N10).

#### TC-03-L16 — The lot label button opens the household dialog, by mouse and by keyboard
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** Admin 1 on Homeowners, desktop.
- **Action:** click the "Blk 4 Lot 12" button; close; Tab to it and press Enter.
- **Expected:** both open Household A's dialog (r4 "Where actions live"); the button is announced as a button with the lot label.
- **Don't assert:** focus position after closing.

#### TC-03-L17 — Clicking elsewhere on a row opens the same household dialog
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** as L16.
- **Action:** click the owner-name cell of Household A's row.
- **Expected:** Household A's dialog opens.
- **Don't assert:** row hover styling.

#### TC-03-L18 — On a phone the card's "Open" opens the household dialog
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Setup:** 375 px phone emulation (DEF-001 applies).
- **Action:** tap "Open" on Household A's card.
- **Expected:** Household A's dialog opens, usable without sideways scroll.
- **Don't assert:** dialog animation.

#### TC-03-L19 — After a confirmed Deactivate the dialog closes and the list refreshes in place
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
- **Setup:** search "blk 7" active; Household C's dialog open.
- **Action:** Deactivate and confirm.
- **Expected:** the household dialog closes; still on Homeowners with "blk 7" in the search box; Blk 7 Lot 1 gone from the list without a page reload; the toast shows (K33).
- **Don't assert:** scroll position.

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
- **Don't assert:** error text. Other staff members: E9.

#### TC-03-M16 — Household audit records are readable by treasurer and board
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** after G2; Treasurer, Board Member.
- **Action:** each reads the `household.updated` record.
- **Expected:** both allowed (r4 Roles: "Board and treasurer read change records").
- **Don't assert:** payload field names.

#### TC-03-M17 — Admin office staff and guards can't read household audit records
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Setup:** after G2; Admin 1 (who wrote the change), Guard, Homeowner A.
- **Action:** each reads the `household.updated` record.
- **Expected:** each refused explicitly (r4: "admin office staff don't"; the office is overseen, not reviewing itself).
- **Don't assert:** error text.

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

#### TC-03-N6 — An import writes one completion record carrying its three counts
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
- **Setup:** after A8; also after A9 committed.
- **Action:** read the `import.completed` records (prov.).
- **Expected:** one record per run: A8 619 imported, 4 not imported, 0 already; A9 3 imported, 0 not imported, 1 already; each matching its run record (prov., pending Sol Arch: "import.completed carries them").
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
- **Expected:** "Homeowners · {n} households" follows each step: +1, +3, −1, +1 (active households only, r4). Wording: K19.
- **Lane:** exclusive — asserts the directory total.
- **Don't assert:** the Inactive chip here (H17).

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
- **Expected:** save accepted; phase still null (prov.). "Not set" display: C27. **Pending decision 2 (admin office):** if the phase goes into the key, phase becomes required and this edit's outcome changes.
- **Don't assert:** anything until decision 2 is answered; phase list contents.

#### TC-03-Q3 — A household doc without link status or member count renders as "Not invited"
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
- **Setup:** special staging: old-shape document seeded with no `linkStatus` or `memberCount` (as if created before the REQ-004 functions deploy).
- **Action:** open Homeowners.
- **Expected:** row renders with "Not invited"; no page error (r4 data table: "a record without them shows 'Not invited'").
- **Don't assert:** member count display.

#### TC-03-Q4 — A household doc without link status is counted under "Not invited"
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
- **Setup:** as Q3, plus a known number of other Not invited households.
- **Action:** read the "Not invited ({n})" chip and choose it.
- **Expected:** the count includes the old-shape record, and the chip's list shows it.
- **Don't assert:** the other chips.

### Block X — Exploratory

#### TC-03-X1 — Charter: break the import with messy spreadsheets (45 min)
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Admin 1; empty test directory; invented data only.
- **Action (charter):** merged header rows, hidden columns, leading apostrophes, non-breaking spaces, tabs, emoji in names, Excel-mangled mobiles, quoted newlines, CR-only files, a BOM followed by a blank first line, a 10,000-row file, lot forms r4 doesn't list ("Lot12A", "L12").
- **Expected:** look for wrong row numbers, silently dropped rows, shifted columns, frozen pages; log findings.
- **Don't assert:** anything beyond the charter notes.

#### TC-03-X2 — Charter: two staff, one directory (30 min)
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
- **Setup:** special staging: two sessions (Admin 1, Treasurer) at once.
- **Action (charter):** interleave add, edit, lot change, deactivate, Undo, reactivate and import on the same lots.
- **Expected:** look for duplicates, lost edits, wrong stale messages, counts that don't add up.
- **Don't assert:** anything beyond the charter notes.

#### TC-03-X3 — Charter: phone directory one-handed (20 min)
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
- **Setup:** Admin 1; 375 px phone emulation.
- **Action (charter):** find a household by lot and by name, correct a mobile, deactivate, all one-handed.
- **Expected:** look for sideways scroll, buttons hidden by the keyboard, small targets, lost focus.
- **Don't assert:** anything beyond the charter notes.

## Coverage summary

r2 split 43 v1 cases by behaviour into 41 new cases (196 → 237). r3 aligns to REQ-003 r4:
41 "assumption — pending BA" labels removed, 113 cases added (237 → 350). Ids from v1 and r2
are unchanged; new ids take the next free number in their block.

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Import: preview and happy path | 15 | 12 |
| B | Import: file rules, limits and file messages | 40 | 14 |
| C | Field validation and lot-key normalisation | 44 | 11 |
| D | Commit, run states, idempotency, re-import, concurrency | 33 | 22 |
| E | Rejected-rows report, download and run access | 12 | 5 |
| F | Add household | 19 | 8 |
| G | Edit, stale edits and lot change | 29 | 14 |
| H | Deactivate and reactivate | 25 | 9 |
| J | List, search, paging | 23 | 4 |
| K | Responsive, usability, UI/UX, copy of record | 48 | 6 |
| L | Navigation | 19 | 6 |
| M | Role and security | 17 | 15 |
| N | Data integrity and privacy | 12 | 5 |
| P | Integration and derived figures | 7 | 4 |
| Q | Back-compat | 4 | 0 |
| X | Exploratory | 3 | 0 |
| **Total** | | **350** | **135** |

Still open and marked, never asserted: **pending decision 2 (admin office)** in C27, C28,
C29, Q2; **(prov., pending Sol Arch)** on the r4 Sol Arch list (limits, three counts, run
states, restated Gherkin 5, inactive-household function results, `createInvites` on
inactive, run access, Cancel and expiry, lot-key move, prefix search).

## Requirement gaps for the BA

### Q1–Q21 (raised in v1): all answered by REQ-003 r4

| # | Question (short) | Resolved by (REQ-003 r4) | Cases updated |
|---|---|---|---|
| Q1 | Row and file-size limits | Import file rules "Limits" (2,000 data rows, 1 MB, size first, server re-checks); Gherkin 8; Copy "File messages". Sol Arch to confirm | B17, B18, B19, B24–B28 |
| Q2 | Empty, header-only, zero-ready, column and separator problems | Import file rules "Columns", "Empty files", "Zero rows ready"; Gherkin 6, 7; Copy "File messages", "Nothing to import", "Ignored columns" | B1, B2, B4, B12–B16, B19, B21, B23, B32–B40, D15, K27 |
| Q3 | Singular copy | Copy "Counts (rule)" | B3, K19, K41 |
| Q4 | BOM, line endings, blank rows, not-UTF-8 copy | Import file rules "Encoding", "Lines", "Blank rows", "Row numbers", "Trimming"; Copy "File messages" | B5, B6, B9, B10, B20, B29–B31 |
| Q5 | "Already in the directory" counting, banner, download, precedence | Import file rules "Three counts", "Rows table", "Reason precedence", "Download", "The commit's recount is authoritative"; Copy "Preview heading", "Import done". Sol Arch to confirm the stored counts | A3, A8, A9, A15, C20, C34, D8, E2, K20, K22, K42, N6 |
| Q6 | Run states, resume, racing imports | Data table "Import run" (states, interrupted after 15 minutes without progress); Gherkin 5 restated, Gherkin 9; Copy "Import in progress", "Import stopped"; Out of scope "Resuming a stuck import in place". Sol Arch to confirm | S3, D6, D7, D22–D27, D33, K43–K46 |
| Q7 | Name over 80; several problems on a row; leading apostrophe | Import file rules "Several problems on one row", "Leading apostrophe"; Copy "Row reasons", "Several reasons" | C5, C21, C30–C33, E4, E8, E12 |
| Q8 | Normalisation; block and phase values; decision 2 | Import file rules normalisation table; decision 2 rule recorded. **Pick still open** (admin office): C27, C28, C29, Q2 stay marked pending decision 2 | C15–C18, C35–C44, F16, F17 |
| Q9 | Inactive households: edit, lot held, no-op, stale edit | Data table (an inactive household keeps its lot); Gherkin 11; Copy "Duplicate lot, inactive", "Already in state", "Household dialog"; UX "Safe actions". Sol Arch to confirm | S1, S4, D16, D21, F9, G9, G28, H10, H25, K28, K31 |
| Q10 | Link status after Reactivate; cancelled invitation | Gherkin 12; Copy "Reactivate confirm" | H7, H8, H19, H20, K30 |
| Q11 | Invite actions on inactive "Email failed" / "Invite expired" | UX "Where actions live" (inactive rows offer only Reactivate); Copy "Invite on inactive"; Sol Arch list (`createInvites`) | S2, H13, H21, H22, K32 |
| Q12 | Can one staff member see another's import run? | Data table "Read only by the staff member who ran it"; UX "Roles"; Copy "Last import"; Out of scope (shared list). Sol Arch to confirm | E9–E11, M15, K46–K48 |
| Q13 | Cancel and reload on the preview | Data table (rejected rows deleted on Cancel; 60-minute expiry); UX "States" (reload returns to step 1). Sol Arch to confirm, plus the commit-rows design gap | A2, D28–D32, L3, L7, L15 |
| Q14 | Block / Lot on edit | Owner decision 3 (B); Gherkin 14; Data table; Copy "Lot change confirm"; audit `household.relotted`. Sol Arch to confirm the transaction and size | S5, G11, G15–G29, K23, K29 |
| Q15 | Who reads the change record; Gherkin 8 in R1 | Gherkin 17 (r3's 8) restated to record level; UX "Roles" | G2, G3, M16, M17 |
| Q16 | Where Edit, Deactivate, Reactivate live | UX "Where actions live"; Copy "Household dialog", "Toasts". Mock-up screen 3F still to be drawn (Follow-ups before build) | Smoke item 4, H23, K33, K34, L16–L19 |
| Q17 | Search matching | UX "Live search"; Data table "Search words"; Out of scope (inside words); Copy "No search match". Sol Arch to confirm tokens and multi-word design | J5, J7, J8, J13, J16–J21, J23 |
| Q18 | Do the heading and All count inactive? | UX "Live search" (active only; Inactive has its own count); Copy "Page heading … (active only)" | H17, J14, J22, K19, P6 |
| Q19 | Escape on a half-filled dialog | Gherkin 13; UX "Forms"; Copy "Discard confirm" | K11, K35–K39 |
| Q20 | Phone "Import" vs desktop "Import households" | UX "Mobile-first"; Copy "Buttons (all screen sizes)". Mock-up 3B correction pending | K18, K25, K40 |
| Q21 | Household without `linkStatus` / `memberCount` | Data table "Link status and member count" | Q3, Q4 |

### New gaps found in REQ-003 r4

Each blocks one precise expected result. The affected cases assert only what holds under
every reading and name the gap under "Don't assert"; no case assumes an answer.

| # | Question | Cases |
|---|---|---|
| NG1 | "1 MB": 1,000,000 or 1,048,576 bytes? Files between the two are untested until answered | B18, B27 |
| NG2 | The count rule names household, row, was, it. What are the singular forms of "{k} lots were already in the directory and were left unchanged" and "its {n} linked members get full access back" for 1? | K22, K30, K41 |
| NG3 | Names match word starts of 2+ characters, but "4" is a listed lot form. What does a one-character name query (e.g. "s") do: nothing, or search? | none written until answered |
| NG4 | Multi-word name queries: must every typed word match a word start (AND), or any (OR)? (Sol Arch also to design the query) | J21 |
| NG5 | Lot-form search and suffixes: does "blk 4 lot 12" / "4-12" also return Blk 4 Lot 12-A? Is a suffixed form ("blk 12 lot 12-a") searchable? | J20 |
| NG6 | Lot change edges: moving to a lot held by an inactive household gets the plain or the inactive duplicate message? A change that normalises to the current lot ("12a" on 12-A): is the confirm shown and `household.relotted` written? | G26, G27, S5 |
| NG7 | After a lot move, which label do REQ-004's join screen and already-printed slips show (old or new)? | G16 |
| NG8 | Does Undo on the deactivate toast reactivate at once, or show the Reactivate confirm that r4 says "asks first"? Which audit records does it write? | H23 |
| NG9 | Exact boundaries: is a run with exactly 15:00 without progress interrupted? Is a preview exactly 60:00 old still committable? | D25, D26, D29, D30 |
| NG10 | "Your last import, {date}": date format, and is the day taken in Asia/Manila local time? | K47, K48 |
| NG11 | Zero ready rows in a file that has both problem rows and already rows: which of the two "Nothing to import" sentences shows? | B21 |
| NG12 | Gherkin 4 says the button reads "Importing…"; copy lists "Importing… {x} of {n}". Is the count on the button or beside it? | D4, K43 |
| NG13 | No copy for a commit refused because the preview is over 60 minutes old (or was cancelled in another tab). What does the admin see, and where do they go? | D30 |
| NG14 | Escape pressed on the discard confirm itself: Keep editing or Discard? | K11 |
| NG15 | Owner name over 80 in the Add / Edit form: does the field stop typing at 80, or show "Owner name is longer than 80 characters" under it? (r4 states the import rule only) | F18 |

Not gaps, recorded for QE: mock-up screen 3F (household dialog) and the 3B label fix are
r4 follow-ups before build, so K34 and K18 have no picture to compare against yet; the
treasurer's open answer on the number of phases changes only the accepted Phase list
(C43, C44).
