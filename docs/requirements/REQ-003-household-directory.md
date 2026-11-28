# REQ-003: Household directory: add, edit and import

| | |
|---|---|
| Raised by | Owner: "draft req-001 to 004 and have SA review it. I'll approve it tomorrow" (2026-11-28) |
| Epic | [EPIC-001 Access and households](../epics/EPIC-001-access-and-households.md) |
| Backlog story | [03 Household directory: add, edit and import](../backlog/BACKLOG.md#03-household-directory-add-edit-and-import) |
| Status | **Approved** by the owner, 2026-11-28 ("approve it"), with every recommendation accepted. Sol Arch reviewed: supports Option A, CSV only in R1, with changes (applied in r2). r4 approved by the owner, 2026-11-28 ("Approve, apply r4") |
| Mockup | Screens 3A–3E of the [access and households mockup](https://claude.ai/artifact/KaNMpY53cLTtrk8HARZgUr). Repo copy: [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html). Screen 3F (household dialog, active and inactive) to add; 3B button label to be corrected to "Import households" (r4; both pending, see Follow-ups before build). |
| Architecture | SA-001 §4.2 (`households`, `lots`) and R-8 (onboarding), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-002 |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch's corrections applied; CSV only in R1; contacts moved to a staff-only record; concurrency and stale-edit cases added · r3, 2026-11-28: owner approval recorded; recommendations accepted · r4, 2026-11-28: answers to the 21 TC-03 (QA) gaps applied, owner-approved ("Approve, apply r4"); decision 2 pick recorded; decision 3 added (Block/Lot editable) · r5, 2026-11-28: S1 follow-ups from approved REQ-008 and REQ-006 (answers TC-08 gaps G-2, G-17 and TC-06 G-10): new households get `billedThrough: ""` and `activeSince`; reactivation sets `activeSince`; the board may read `lots`. Add to TC-03 · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("approve it"): every recommendation in the right-hand column is accepted. Questions for the HOA board or the admin office under Open questions stay open. r4 (2026-11-28, "Approve, apply r4"): decision 2's rule recorded and decision 3 added, both as the BA recommended.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (import with preview, plus forms), B (one at a time) or C (developer loads the list) | **A**, CSV only in R1 (`.xlsx` later, about 1 extra day) |
| 2 | Before the import is **built** (not before approval): do block numbers repeat across phases? If yes, every lot key includes the phase (`P1-B04-L12`). Changing the key after import means rewriting every record | Ask the admin office this week. r4: **key without the phase** (`B04-L12`, phase optional) if the admin office confirms block numbers don't repeat across phases; **key with the phase** (`P1-B04-L12`, phase required on import and form) if they do. The admin office has not answered yet; building the import waits for it |
| 3 | May Block / Lot be changed on edit? A: read-only (deactivate and add again); B: editable with confirm, the server moves the lot key (about +0.5 day, Sol Arch to confirm) | **B** (r4): editable after a confirm; the server moves the lot key in one transaction, and the household keeps its id, members, invitations and history |

## Problem

Billing, invitations and every other feature need one record per lot. The mock-up's Homeowners page (`aHo()`, line 758) lists 20 fixed sample households with search and a detail pop-up, but nothing can be added or changed. The real subdivision has 623+ households. `backend-plan.md` excludes onboarding from its estimates, and SA-001 ranks it as risk R-8.

Who has the problem: [Admin office staff](../product/PERSONAS.md#admin-office-staff), at launch and every time a lot is sold or a contact changes.

## Options

### Option A: Spreadsheet import, plus add and edit forms (recommended)

- **How it works:** Homeowners → "Import households". The admin downloads a template (Block, Lot, Owner name, Email, Mobile, Phase), fills it in or pastes from the HOA's list, saves it as CSV, and uploads it. The server checks every row and shows a preview: rows that will be added, and rows that will not be added with the reason for each. Nothing is saved until the admin presses "Import 618 households". After launch, single households are added and edited with a form.
- **Cost:** moderate. A preview function and a separate commit function with validation and tests (SA-001 R-8 already calls for an import), a preview screen, and the add/edit form.
- **Honest downside:** the HOA's current list must be cleaned into the template first. That is office work the portal can't do.

### Option B: Add households one at a time only

- **How it works:** only the add and edit form.
- **Cost:** cheap.
- **Honest downside:** about 623 × 2 minutes ≈ 20 hours of typing, with more typos and no check for duplicates across the whole list.

### Option C: The developer loads the list once by script; add and edit form for changes

- **How it works:** the HOA sends its spreadsheet; the developer checks and loads it; the office uses the form afterwards.
- **Cost:** cheap.
- **Honest downside:** the office can't see why a row was rejected, and every later bulk change goes back to the developer. Personal data passes through one more person.

### Recommendation

**Option A.** The import is needed for launch and SA-001 already plans for it. The preview stops bad data before it lands, and the office can rerun it without the developer. If R1 is short on time, Option C is an acceptable stopgap, keeping the same validation rules.

## Story

As an admin office staff member, I want to add, edit and import households with lot, owner name and contact details, so that billing reaches every lot in the subdivision.

## Acceptance criteria (Option A)

```gherkin
Feature: Household directory

  Background:
    Given an admin office staff member is signed in

  Scenario: Import the household list
    Given the directory is empty
    And the template is filled in with 623 rows of block, lot, owner name, email and mobile, saved as CSV
    When the admin uploads it
    Then the preview reads "623 households ready to import"
    When the admin presses "Import 623 households"
    Then the Homeowners page reads "623 households"
    And each imported household shows the link status "Not invited"

  Scenario: Rows with problems are shown, not imported
    Given a file of 623 data rows, in which row 14 has no lot number, rows 31 and 32 are both Blk 2 Lot 7, and row 57 has the email "ana@"
    And row numbers count the header as row 1
    When the admin uploads it
    Then the preview lists those 4 rows with the row number and the reason for each:
      | Row | Reason                                         |
      | 14  | Lot number is missing                          |
      | 31  | Blk 2 Lot 7 appears more than once in the file |
      | 32  | Blk 2 Lot 7 appears more than once in the file |
      | 57  | "ana@" is not a valid email address            |
    And the import button reads "Import 619 households"
    And no row is saved until the admin presses it

  Scenario: Importing a lot that already exists does not duplicate it
    Given Blk 4 Lot 12 is already in the directory
    When the admin imports a file that includes Blk 4 Lot 12
    Then the preview lists it as "Already in the directory, skipped"
    And the directory still has one Blk 4 Lot 12
    And Blk 4 Lot 12's owner name and contacts are unchanged

  Scenario: Pressing Import twice imports once
    Given the directory is empty
    When the admin presses "Import 623 households" twice quickly
    Then the directory has 623 households
    And the button reads "Importing…" and is disabled until the import finishes

  Scenario: Two admins import the same file at the same time
    Given the directory is empty
    When two admins each upload the same 623-row file and press Import at the same moment
    Then the directory has 623 households
    And the two imports' "Imported" counts add up to 623
    And each import lists every row it did not write as "Already in the directory, skipped"

  Scenario: A file with nothing to import
    Given every lot in the uploaded file is already in the directory
    When the admin uploads it
    Then the preview reads "Nothing to import. Every lot in this file is already in the directory."
    And no Import button is shown

  Scenario: A file missing a required column
    Given a file with the headings Block, Owner name, Email, Mobile, Phase
    When the admin uploads it
    Then they see "Column missing: Lot. Use the template's headings: Block, Lot, Owner name, Email, Mobile, Phase."
    And no preview is shown

  Scenario: A file over the row limit
    Given a file with 2,001 data rows
    When the admin uploads it
    Then they see "This file has 2,001 rows. One import can take up to 2,000. Split it into smaller files and import each one."

  Scenario: An interrupted import is finished by uploading the file again
    Given an import of 623 rows stopped after 300 households were written
    When the admin uploads the same file again
    Then the preview reads "323 households ready to import · 300 already in the directory"

  Scenario: The same lot written differently is one lot
    Given Blk 4 Lot 12-A is in the directory
    When the admin imports a row with Block "04" and Lot "12a"
    Then the preview lists it as "Already in the directory, skipped"

  Scenario: Adding the lot of an inactive household
    Given Blk 7 Lot 1 is inactive
    When the admin adds Block 7, Lot 1
    Then they see "Blk 7 Lot 1 is already in the directory but inactive. Reactivate it from the Inactive list." under the Lot field
    And nothing is saved

  Scenario: Reactivating does not revive a cancelled invitation
    Given Blk 7 Lot 1 was deactivated while its invitation was unused, and it has no members
    When the admin reactivates it
    Then it shows the link status "Not invited"
    And its old code is refused with "This invitation is no longer valid. Ask the admin office."

  Scenario: Escape doesn't throw away typing
    Given the admin has typed an owner name in "Add household"
    When they press Escape
    Then they see "Discard your changes to this household?" with "Keep editing" focused

  Scenario: Correcting a mistyped lot
    Given Blk 12 Lot 12-A exists and Blk 12 Lot 12-B does not
    When the admin changes its lot to 12-B, saves and confirms "Change lot"
    Then the list shows Blk 12 Lot 12-B
    And adding Blk 12 Lot 12-A afterwards succeeds

  Scenario: Add one household
    When the admin presses "Add household", enters Block 8, Lot 2, owner "Rina Domingo" and email "rina@example.com", and presses "Save"
    Then Blk 8 Lot 2 is listed with the link status "Not invited"

  Scenario: The same lot can't be added twice
    Given Blk 8 Lot 2 exists
    When the admin adds Block 8, Lot 2 again
    Then they see "Blk 8 Lot 2 is already in the directory." under the Lot field
    And nothing is saved
    And if two admins save a new Blk 9 Lot 1 at the same moment, exactly one is saved

  Scenario: Correct a contact number
    Given Blk 4 Lot 12 has mobile "0917 555 0101"
    When the admin changes it to "0917 555 0199" and saves
    Then the Homeowners list shows "0917 555 0199" for Blk 4 Lot 12
    And a change record holds the admin's id, the household's id and the time, and no name, email or mobile (the activity log screen is backlog story 06)

  Scenario: Two admins edit the same household
    Given two admins opened Blk 4 Lot 12 for editing
    When the first saves a new mobile number and then the second saves
    Then the second sees "Someone else changed this household. Reload to see the latest, then make your change again."
    And the first change is kept

  Scenario: A household is deactivated, not deleted
    When the admin presses "Deactivate" on Blk 7 Lot 1 and confirms
    Then Blk 7 Lot 1 is hidden from the default list and shown under "Inactive"
    And its records are kept
    And its unused invitation, if any, stops working

  Scenario: Typing in a half-filled form is not lost
    Given the admin has typed an owner name in "Add household"
    When they click outside the dialog
    Then the dialog stays open with the name still typed

  Scenario: Search by block
    Given 623 households
    When the admin types "blk 4" in "Search name or lot"
    Then only Block 4 households are listed, not Blocks 40 to 49
    And the rest of the page does not reload while typing

  Scenario: Search by name
    When the admin types "santos" in "Search name or lot"
    Then households whose owner name contains the word "Santos" are listed

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then each household shows as a card with lot, owner, link status and balance
    And the balance shows "—" until the first billing run
    And the page does not scroll sideways

  Scenario: Only the office and the treasurer can change households
    Given a board member is signed in
    When they open the Homeowners page
    Then they see "You don't have access to this page"
    And their device's request for the household list is refused
```

## Data changes

| Field | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Lot key, e.g. `B04-L12` (or `P1-B04-L12`, decision 2) | `lots/{lotKey}` (SA-001 §4.2) | Unique; the import and the form refuse a lot that exists. Built from normalised values (see [Import file rules](#import-file-rules)). An inactive household keeps its lot | Import and household functions only | Rules; import |
| Lot label "Blk 4 Lot 12", block (number), lot (text, allows "12-A"), phase | `households/{id}` | Block and lot required; phase optional until the board confirms phases (required if decision 2 puts the phase in the key). Block: whole number 1–999. Lot: number 1–9999 with an optional 1–2 letter suffix, stored "12-A". Phase: Phase 1–4 or null. Block and lot editable; the server moves the lot key in one transaction (decision 3) | Functions only | Every household screen |
| Owner display name | `households/{id}.displayName` | Required, up to 80 characters | Functions | Directory; invitations (REQ-004); letters |
| Search words | `households/{id}.searchTokens` | Accent-folded, lower-case word prefixes (2+ characters) of the name, for indexed search | Functions | Search |
| Link status and member count | `households/{id}.linkStatus`, `memberCount` | Kept by the REQ-004 functions. Set to "Not invited" / 0 on create; a record without them shows "Not invited" | Functions | Directory |
| **Contact email and mobile** | **`householdContacts/{householdId}`**: `contactEmail`, `contactMobile` | Email optional but valid; mobile optional, Philippine format. **Staff-only**, so after a sale the new owner never sees the previous owner's contacts | Functions | Admin office, treasurer; REQ-004 invitations |
| Active | `households/{id}.active` | Deactivate, never delete (SA-001 §11.2) | Functions | Directory, billing |
| Import run: status, counts, rejected rows | `importRuns/{id}` | States previewed → running → completed, plus cancelled and interrupted (no progress for 15 minutes). Counts: ready, rejected, already in the directory, progress. Read only by the staff member who ran it. Rejected rows deleted on Cancel, otherwise after 30 days (DPO to confirm). A previewed run can't be committed after 60 minutes. At most 2,000 rows and 1 MB | Import functions | Import screen |
| Change record | `auditLog` | Every add, edit, deactivate, import; ids only. Includes household.reactivated and household.relotted. Refused no-op changes write nothing | Functions | Board, treasurer |
| **(r5)** Billed-through marker | `households/{id}.billedThrough` | **`createHousehold` and `commitHouseholdImport` set `billedThrough: ""`** on every new household, because Firestore range filters skip documents without the field (REQ-008's late-additions query). After that only REQ-008's billing functions change it. Existing staging households are back-filled by a developer script before S2 testing; a data check proves none is missing (REQ-008, TC-08 G-17) | Functions | Billing (REQ-008) |
| **(r5)** Active since | `households/{id}.activeSince` (server time) | Set by `createHousehold`, `commitHouseholdImport` and on **reactivation** by `setHouseholdActive`. A billing run bills only households active since before it started (REQ-008, TC-08 G-2) | Functions | Billing (REQ-008) |
| **(r5)** Lot list for filters | `lots/{lotKey}` `{householdId, createdAt}` | **Readable by the treasurer, the admin office and the board** (no client writes), so the Activity log's lot filter can offer lots to the board (REQ-006, TC-06 G-10). It holds no names or contacts, so the board's directory question (REQ-002 open question) is unaffected | Functions | Treasurer, admin office, board |

Clients never write households directly. Edits carry the time the admin loaded the record, so a stale save is refused. The list is read 50 at a time with indexed queries, not by loading all 623 (cost: Sol Arch review).

The contact email is where invitations are sent. It does **not** give anyone access: access comes only from redeeming an invite (REQ-004, ADR-004).

## Import file rules

Added in r4 (TC-03 gaps Q1, Q2, Q4, Q5, Q7, Q8). The exact messages are under Copy of record. A "file message" is shown on step 1 under the file input, as text with an error icon, announced (`role="alert"`), with focus left on the file input; no preview, no Import button, nothing sent to the server, no import run written.

- **Limits:** at most **2,000 data rows** and **1 MB** per import, checked in the browser before parsing and again by the server. Size is checked first. Exactly 2,000 rows previews as normal; 2,001 or more is a file message.
- **Columns** are matched **by heading name**: trimmed, case-insensitive, in any order. Required: **Block, Lot, Owner name**. Optional: **Email, Mobile, Phase** (a missing optional column means blank for every row).
  - A missing required column (including a renamed one, e.g. "Lot No."): file message listing every missing column in template order.
  - A heading that appears twice: file message.
  - Extra columns are ignored and never stored; the preview shows "Ignored columns: {names}." above the tiles. "Row" and "Reason" (from our own rejected-rows download) are ignored silently, so a fixed download re-imports cleanly.
  - A header row with no comma but a `;` or a tab: wrong-separator file message. A file that isn't `.csv` (e.g. `.xlsx`): file message, even though the file picker also filters to `.csv`.
- **Empty files:** a 0-byte file, and a file with only a header (or only blank rows under it), each get their own file message.
- **Zero rows ready** (every row has a problem, is already in the directory, or both): the preview is shown with its tiles and rows table, but the Import button is replaced, in the same footer position, by a sentence saying why. Cancel and "Choose a different file" stay.
- **Encoding:** UTF-8 with or without a BOM; the BOM is removed before the headings are read. A file that isn't valid UTF-8 gets a file message.
- **Lines:** CRLF, LF, CR-only and mixed line endings all give the same rows. A last row with no final newline is read. A quoted cell containing a line break stays one row.
- **Blank rows** (every cell empty or spaces, including `,,,,,`) are ignored anywhere: not listed, not counted.
- **Row numbers** match what the admin sees in Excel or Google Sheets: header = row 1, and blank rows *are* counted in the numbering.
- **Trimming:** every cell is trimmed of leading and trailing spaces before checking.
- **Leading apostrophe:** one leading `'` is removed from a cell only when the next character is `=`, `+`, `-` or `@` (what our own download adds), so `'+639000000099` imports as `+639000000099`. Any other apostrophe is kept. A value that then starts with one of those characters is stored and shown as plain text, and escaped again on the next download.
- **Several problems on one row:** all are listed, in column order (Block, Lot, Owner name, Email, Mobile, Phase, then "appears more than once in the file"), separated by "; ". Same in the download's Reason column. Example: `Lot number is missing; "zz@" is not a valid email address`. Owner name over 80 characters (after trimming) is a problem.
- **Three counts:** **ready** `{n}` (will be added), **won't be imported** `{m}` (rows with a problem, including in-file duplicates), **already in the directory** `{k}` (skipped, nothing changed). Ready + won't + already = data rows in the file. Each part of the preview heading and the finished banner is dropped when its count is 0.
- **Rows table:** "Rows that won't be imported" lists problem rows and already-in-directory rows in row order; already rows show their reason in muted text plus the words, not colour alone.
- **Reason precedence:** if the lot (after normalisation) is already in the directory, the only reason shown is "Already in the directory, skipped" (or the inactive variant), whatever else is wrong, and the row counts in `{k}`. This includes every row of a lot that is both duplicated in the file and already in the directory. Otherwise all the row's problems are shown.
- **Download** ("Download them" / "Download these rows") holds **only the `{m}` problem rows**, each with Row and Reason. Already-in-directory rows are not in it.
- **The commit's recount is authoritative:** a lot that became "already" between preview and commit is counted in `{k}` in the banner.
- **Normalisation**, applied the same way by the import, the Add/Edit form and the lot-key builder:

| Field | Accepted | Normalised to | Rejected (reason) |
|---|---|---|---|
| Block | A whole number 1–999, optionally with leading zeros, optionally prefixed "Blk" or "Block" (any case, with or without space): "4", "04", "Blk 4", "block4" | 4 | Anything else, incl. "4A", "0", "-1", "1000", "four": `Block "{value}" isn't a block number. Use a whole number, like 4.` |
| Lot | A number 1–9999 with optional leading zeros, optionally followed by a one- or two-letter suffix with or without "-" or a space, optionally prefixed "Lot": "12", "012", " 12 ", "12-a", "12A", "12 a", "Lot 12-A" | "12", or "12-A" (suffix upper-case, joined with "-") | Anything else, incl. "0", "12-AB3", "A": `Lot "{value}" isn't a lot number. Use a number like 12, or 12-A.` Values over 10 characters are refused before matching |
| Phase | Blank; "Phase 1"–"Phase 4", "1"–"4", "P1"–"P4" (any case, with or without space) | null ("Not set"), or "Phase N" | Anything else, incl. "Phase 9", "5": `Phase "{value}" isn't a phase. Use Phase 1 to Phase 4, or leave it blank.` |

So "012" = "12"; "12-a" = "12A" = "12-A"; Block "04" = "4". Lot "12-A" stays distinct from Lot 12. The lot label is always built from the normalised values: "Blk 4 Lot 12-A". If the treasurer's answer on phases gives a number other than 4, only the accepted Phase list changes. If decision 2 puts the phase in the key, a blank Phase becomes the problem "Phase is missing" and "Not set" no longer applies.

## UX/UI notes

- **Accessibility:** the preview table has a caption and row numbers; errors are text, not only red; the file input has a visible label.
- **Consistency:** reuses the mock-up's table, search box, `.modal` and `.pill`; link status uses the same pill colours as payment status.
- **Mobile-first:** the list becomes cards below 640 px. Import is a desktop task; on a phone the import page says "Import works best on a computer" but still works. Both buttons read "Import households" / "Add household" on every screen size; if they don't fit side by side at 320 px, they stack full width, Add household first.
- **States:** empty directory ("No households yet. Import your list or add the first household."); loading skeleton; import in progress with a count; import finished ("Imported 619 households. 4 rows were not imported." with a link to download them); network error keeps the preview. Zero rows ready: the Import button is replaced by a sentence saying why (copy of record). Import in progress: "Importing… {x} of {n}" plus "Keep this page open until the import finishes." Interrupted import: the "stopped before it finished" message, also shown on step 1 the next time. Reload on the preview returns to step 1. Search with no match has its own message and "Clear search".
- **Forms:** the add/edit dialog does not close on a backdrop click; inline validation on blur; the Lot field shows the duplicate message as soon as it is known. Escape with unsaved changes asks "Discard your changes to this household?" (Keep editing focused); with none, it closes. × behaves like Escape; Cancel closes.
- **Where actions live:** the lot label in each row is a button opening the household dialog (row click does the same); on a phone, "Open". The dialog holds the form plus Deactivate (left, apart from Save) or Reactivate for an inactive household. Deactivate shows a toast with Undo for 10 seconds. Inactive rows offer only Reactivate: no invite actions.
- **Template guidance:** the template says "Save as CSV UTF-8" so names with ñ survive, and keeps the Mobile column as text so Excel doesn't drop the leading 0. The rejected-rows download escapes cells starting with `=`, `+`, `-` or `@`.
- **Safe actions:** Import and Save are disabled while in flight; Deactivate asks "Deactivate Blk 7 Lot 1? It won't be billed or shown in the list, and its unused invitation stops working. Its records are kept." and can be undone with "Reactivate". Reactivate asks first (copy of record). Deactivate on an inactive household, or Reactivate on an active one, is refused by the server with no change.
- **Live search:** debounced at 200 ms and re-renders only the list. Matches word starts, 2+ characters, ignoring case and accents; lot forms "blk 4", "block 4", "b4", "4", "blk 4 lot 12", "b4 l12", "4-12". Search applies within the chosen chip. Counts in the heading and chips are active households only; Inactive has its own count.
- **Roles:** admin office staff and treasurer only; board, guard and homeowners are refused by rules. An import run is visible only to the staff member who ran it. Board and treasurer read change records; admin office staff don't.

## Copy of record

| Where | Text |
|---|---|
| Counts (rule) | Singular for 1 (household, row, was, it); zero parts dropped; 1,000 and over with a comma |
| Page heading | Homeowners · {n} households (active only) |
| Buttons | Import households · Add household · Download template (all screen sizes) |
| Import hint | Fill in the template and save it as CSV UTF-8. |
| Preview heading | {n} households ready to import · {m} rows won't be imported · {k} already in the directory |
| Row reasons | Lot number is missing · Block is missing · Owner name is missing · {lot} appears more than once in the file · Already in the directory, skipped · "{value}" is not a valid email address · "{value}" is not a valid mobile number · Owner name is longer than 80 characters · Block "{value}" isn't a block number. Use a whole number, like 4. · Lot "{value}" isn't a lot number. Use a number like 12, or 12-A. · Phase "{value}" isn't a phase. Use Phase 1 to Phase 4, or leave it blank. · Already in the directory (inactive), skipped |
| Several reasons | {reason}; {reason} |
| Import button | Import {n} households (in flight: Importing…) |
| Import done | Imported {n} households. {m} rows were not imported. Download them to fix and import again. {k} lots were already in the directory and were left unchanged. |
| Nothing to import | Nothing to import. Fix the rows listed above and upload the file again. · Nothing to import. Every lot in this file is already in the directory. |
| File messages | This file is empty. Choose the filled-in template and upload it again. · This file has no households in it. Add one row per lot under the headings, then upload it again. · Column missing: {column}. Use the template's headings: Block, Lot, Owner name, Email, Mobile, Phase. (plural: Columns missing: {column}, {column}. …) · The column "{column}" appears twice. Keep one and upload it again. · This file isn't separated by commas. Save it as CSV UTF-8 and upload it again. · This isn't a CSV file. In Excel or Google Sheets, save or download it as CSV UTF-8, then upload it again. · This file isn't saved as CSV UTF-8, so names with ñ would come out garbled. Save the file as CSV UTF-8 and upload it again. · This file has {n} rows. One import can take up to 2,000. Split it into smaller files and import each one. · This file is larger than 1 MB, which is more than a household list needs. Check it's the template saved as CSV UTF-8, or split it into smaller files. |
| Ignored columns | Ignored columns: {names}. |
| Import in progress | Importing… {x} of {n} · Keep this page open until the import finishes. |
| Import stopped | The import stopped before it finished. {x} households were imported. Upload the same file again to import the rest. Households already imported will be skipped. · The import may not have finished. Upload the same file again: households already imported will be skipped. |
| Last import | Your last import, {date}: {n} households imported, {m} rows not imported. Download them (after 30 days: Your last import, {date}: {n} households imported.) |
| Duplicate lot | {lot} is already in the directory. |
| Duplicate lot, inactive | {lot} is already in the directory but inactive. Reactivate it from the Inactive list. |
| Already in state | {lot} is already inactive. · {lot} is already active. |
| Invite on inactive | {lot} is inactive. Reactivate it before sending an invitation. |
| Reactivate confirm | Reactivate {lot}? It will be billed and shown in the list again. (with members: … and its {n} linked members get full access back.) Buttons: Cancel · Reactivate |
| Household dialog | Title {lot}; buttons Deactivate · Cancel · Save (inactive: Reactivate · Cancel · Save); pill Inactive |
| Toasts | {lot} deactivated. Undo · {lot} reactivated. |
| Discard confirm | Discard your changes to this household? Buttons: Keep editing · Discard |
| No search match | No households match "{query}". Button: Clear search |
| Lot change confirm | Change {old lot} to {new lot}? The household keeps its members and history. {old lot} becomes free to add. Buttons: Cancel · Change lot |
| Stale edit | Someone else changed this household. Reload to see the latest, then make your change again. |
| Empty | No households yet. Import your list or add the first household. |
| Deactivate confirm | Deactivate {lot}? It won't be billed or shown in the list, and its unused invitation stops working. Its records are kept. |
| Balance before billing | — |
| Link status pills | Not invited · Invited · Linked · Invite expired · Email failed |

## Out of scope

- `.xlsx` import (about 1 extra day; CSV only in R1).
- Opening balances (what each household owed before the portal). Needed before the first billing run, so it goes with the billing REQ (SA-001 R-8).
- Owners with several lots and tenants (D3). R1 treats each lot as its own household.
- Updating existing households from a re-import. R1 skips them; edit them one at a time.
- What a deactivated household's linked members can still see (recommended: read-only until the office removes them, REQ-004), and skipping deactivated households in billing (billing REQ).
- Inviting households (REQ-004).
- A shared list of every staff member's import runs (R1 shows each staff member their own last run).
- Resuming a stuck import in place: an interrupted import is finished by uploading the same file again.
- Search inside words (e.g. "tos" finding "Santos"); R1 matches word starts.

## Open questions

| Question | Who decides |
|---|---|
| Owner decision 2: do block numbers repeat across phases? The answer picks the lot key under the approved rule, and building the import waits for it | Admin office |
| How does commitHouseholdImport get the ready rows: re-sent by the browser (BA preference) or held in the run? | Sol Arch |
| How many phases are there (accepted Phase values are 1–4 until answered)? | Treasurer (existing question, now also sets the Phase rule) |
| D3: owners with several lots; tenants | HOA board |
| What does the HOA's current list look like (columns, format, how many have email)? A sample with invented data would settle the template. | Admin office |
| Does every lot belong to one phase (Phase 1–4)? The board financial report groups dues by phase. | Treasurer |

## Sol Arch review

> **BA note (r2):** the corrections Sol Arch asks for under "Criteria to change" are already applied to the criteria, copy and data above. What needs the owner is listed under "Decisions for the owner" at the top.

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r1 §4.2 and R-8 (Draft, `origin/docs/sa-001-architecture` at `b020b40`). Mock-up `aHo()` at `index.html` line 758, read: one table of `S.homeowners` with lot, name and a free-text `contact` (seeded at line 470); the search box filters rows in the browser.

**Verdict: Supports with changes.** Option A is right. In R1 the import should take **CSV only**, run as a server-side preview step followed by a separate commit step, and keep contact details out of the household document. One question blocks *building* the import, though not approving this REQ: whether block numbers repeat across phases. The answer changes the lot key.

#### Options

| Option | Feasible? | Cost (BA's read) | Sol Arch |
|---|---|---|---|
| A: import + add/edit forms | Yes | Moderate | **Agree, upper end of moderate**, because of file encoding and phone-number clean-up (below). |
| B: one at a time only | Yes | Cheap | Agree on cost. One correction: the form still refuses duplicates through `lots/{lotKey}`, so the real loss is the typing time and typos, not duplicate checking. |
| C: developer loads by script | Yes | Cheap | Agree, as a stopgap only, and only if it uses the same validation function. It sends personal data through the developer, an extra person processing it under RA 10173 (requester and DPO to confirm). |

**I support Option A.**

**`.xlsx` or `.csv` (the BA's question): CSV only in R1.** Excel and Google Sheets both save CSV. An `.xlsx` parser is a new dependency that has to be justified, pinned and licence-checked (CS-7). It parses an uploaded file, which adds an attack surface, and it costs about +1 day. CSV has two traps the import must handle:
- **Encoding.** Excel's plain "CSV" format saves in the Windows code page, which garbles "ñ" in names such as "Peña". The template asks for "CSV UTF-8". The import refuses a file that isn't valid UTF-8 with: "Save the file as CSV UTF-8 and upload it again."
- **Mobile numbers.** Excel drops the leading zero (0917… becomes 917…) and may show a long number in scientific notation. Accept `9XXXXXXXXX`, `09XXXXXXXXX`, `639XXXXXXXXX` and `+639XXXXXXXXX` after stripping spaces and dashes. Cap the length before matching, with no nested quantifiers (S8786). Store as `+639…`, show as "0917 555 0101". Format the template column as text. Check emails with a library validator, not a home-made regex (CODING-STANDARDS, S8786).

**How the import handles 623 rows (batching and idempotency):**
1. The browser parses the CSV, makes an `importId` when the file is chosen, and sends the rows (about 100 KB) to callable `previewHouseholdImport`. The function validates every row and checks which lots exist. It writes only `importRuns/{importId}` (status `previewed`, counts, rejected rows) and returns the per-row results.
2. `commitHouseholdImport(importId)` refuses unless the run is `previewed` and belongs to the caller. In one transaction it moves the run to `running`, so a second press is refused. It then writes **one small transaction per row**: create `lots/{lotKey}`, `households/{id}` and `householdContacts/{id}` together. A lot that already exists is skipped and reported "Already in the directory, skipped". The rows run a few dozen at a time in parallel.
3. **Not one big batched write.** A batch is all-or-nothing, so one existing lot would fail all 623. Firestore also limits a transaction to 10 MiB and 270 seconds ([transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)). If the commit dies part-way, rerunning it continues: rows already written are skipped by their lot key.
4. Both guards are present (CS-5): the in-flight button, plus the run-status transaction and the per-lot create.

#### Criteria to change (quoted, then corrected)

1. **"Then the Homeowners page reads "623 households""**. Only true if the directory started empty. Add `Given the directory is empty` to the scenario.
2. **"Given the file has a row with no lot number, two rows for Blk 2 Lot 7, and a row with the email "ana@""**. The size of the file is implied but not stated. Corrected: `Given a file of 623 data rows, in which row 14 has no lot number, rows 31 and 32 are both Blk 2 Lot 7, and row 57 has the email "ana@"`, plus `And row numbers count the header as row 1`.
3. **"Importing a lot that already exists does not duplicate it"**. Add `And Blk 4 Lot 12's owner name and contacts are unchanged` (R1 never updates from an import; see Out of scope).
4. **"When the admin presses "Import 623 households" twice quickly / Then the directory has 623 households"**. Corrected, and adding the two-computer case:
   ```gherkin
   Scenario: Pressing Import twice imports once
     Given the directory is empty
     When the admin presses "Import 623 households" twice quickly
     Then the directory has 623 households
     And the button reads "Importing…" and is disabled until the import finishes

   Scenario: Two admins import the same file at the same time
     Given the directory is empty
     When two admins each upload the same 623-row file and press Import at the same moment
     Then the directory has 623 households
     And the import that finished second lists each of its rows as "Already in the directory, skipped"
   ```
5. **"The same lot can't be added twice"**. Can be met (the `lots/{lotKey}` create fails if the lot exists). Add `And if two admins save Blk 8 Lot 2 at the same moment, exactly one is saved`.
6. **"Correct a contact number … And the activity log records who changed it and when"**. Can be met if edits go through a function, since audit is written only by the server (SA-001 §3). Add the stale-edit case:
   ```gherkin
   Scenario: Two admins edit the same household
     Given two admins opened Blk 4 Lot 12 for editing
     When the first saves a new mobile number and then the second saves
     Then the second sees "Someone else changed this household. Reload to see the latest, then make your change again."
     And the first change is kept
   ```
7. **"A household is deactivated, not deleted"**. The REQ doesn't say what happens to people already linked, or to an unused invitation. Recommendation for the BA: deactivating cancels any active invitation, and linked members keep read-only access until the office removes them (REQ-004). Add `And its unused invitation, if any, stops working`. A deactivated household must also be skipped by the billing run; that belongs in the billing REQ.
8. **"When the admin types "blk 4" … Then only Block 4 households are listed"**. A plain text match on "blk 4" also matches Blk 40–49. Corrected: `Then only Block 4 households are listed, not Blocks 40 to 49`. Add `When the admin types "santos" / Then households whose owner name contains the word "Santos" are listed`. For the design, see Data: indexed queries, not loading all 623 households.
9. **"Readable on a phone … balance"**. There is no balance until the first billing run (EPIC-002). Show "—" until then, and say so in the scenario.
10. **"Only the office and the treasurer can change households"**. Add the server check: `And their device's request for the household list is refused`.

#### Data

- **Lot key `B04-L12`**: assumes block numbers are unique across the whole subdivision. The board report groups lots by Phase 1–4. If phases reuse block numbers, two different lots get the same key and the second is rejected as a "duplicate". **Ask the admin office before the import is built.** If blocks do repeat, use `P1-B04-L12`. Also allow lot suffixes ("Lot 12-A"). Re-keying after the import means rewriting every document, so this must be settled first.
- `lots/{lotKey}`: `{householdId, createdAt}`, written by functions only. **Confirmed** (SA-001 §4.2).
- `households/{id}`: `lotKey`, `lotLabel`, `block` (number), `lot` (string), `phase` (string or null), `displayName` (≤ 80), `searchTokens` (lower-case words of the name), `active`, `linkStatus` and `memberCount` (kept by the REQ-004 functions, so the list never reads invitations row by row), `createdBy`, `createdAt`, `updatedAt`. The SA-001 totals start at 0.
- **Contact fields: name them `contactEmail` and `contactMobile`, and put them in `householdContacts/{householdId}`, not on `households/{id}`.** Admin and treasurer may read them; nobody else. Why: every member of a household reads `households/{id}` (dashboard, balance). After a sale, the new owner would otherwise see the previous owner's email and mobile, and REQ-002 says guards must not see contacts.
- `importRuns/{importId}`: status, counts, rejected rows, `createdBy`, times. Staff only. The rejected rows contain personal data, so the daily job deletes them after 30 days (retention period for the DPO to confirm).
- **Functions missing from SA-001 §3:** `previewHouseholdImport`, `commitHouseholdImport`, `createHousehold`, `updateHousehold` (with `seenUpdatedAt`), and `setHouseholdActive`. Clients never write households directly: the totals and audit are server-only.
- **Indexes** (`firestore.indexes.json`): `households` on (`active`, `block`, `lot`) for the default list and block search; (`active`, `searchTokens` array-contains, `lotKey`) for name search. The list is paginated at 50 (SA-001 §7).
- `auditLog`: `household.created` / `updated` / `deactivated` / `reactivated` and `import.completed` with counts. Ids only.

#### Risks not covered

- **Cost of live search.** Loading all 623 households each time the page opens costs 623 reads. Five staff opening it 20 times a day is about 62,000 reads, above the 50,000 free daily reads SA-001 §7 quotes from the pricing page. That is why I recommend indexed queries over 50-row pages.
- **Formula injection** in the "download rejected rows" file. A cell starting with `=`, `+`, `-` or `@` runs as a formula in Excel. Prefix such cells with `'` on export.
- **Personal data in transit.** The uploaded file is not stored. Rows are never logged (CS-14). Staging gets only invented data, never the HOA's real list (ADR-005).
- **Stale preview.** A lot added between the preview and the commit is caught because the commit re-checks each row.
- **Existing data:** none (greenfield). The mock-up's 20 sample households are never imported.
- **Multi-lot owners (D3).** R1 makes one household per lot, and the `members` model handles a person on several lots later.
- **Observability:** alert on an `importRuns` run that stays `running` for more than 15 minutes.
- **Write volume:** an import makes about 2,500 writes (household, lot, contacts, audit for each row), within the free daily write allowance SA-001 §7 quotes.

#### SA-001 follow-ups (recommended revisions; I have not edited SA-001)

- §4.2: add `householdContacts`, `importRuns`, and on `households` the fields `block`, `lot`, `phase`, `searchTokens`, `linkStatus`, `memberCount`. Settle the lot-key format (with or without phase).
- §3: add the five household functions above.
- §7: "Lists paginated (50 per page)" stands. State that search uses indexed queries, not a scan in the browser.

#### Pending Sol Arch confirmation (r4)

> **BA note (r4):** the owner approved these requirements on 2026-11-28 ("Approve, apply r4"). Their design is **not yet confirmed** by Sol Arch, and SA-001 has not been edited. Each needs Sol Arch's read before build.

- **Limits:** 2,000 rows and 1 MB fit the callable request size and the commit's time budget; the server also refuses more than 2,000 rows.
- **Three counts:** `importRuns` keeps ready, rejected and already-in-the-directory counts, and `import.completed` carries them.
- **Run states:** previewed → running → completed, plus cancelled and interrupted; the 15-minute no-progress rule and who marks a run interrupted; the restated Gherkin 5 (runs may interleave). This reads step 3's "rerunning it continues" as a new preview and commit of the same file, not a second commit of the stuck run.
- **Inactive households:** `setHouseholdActive` refuses a no-op change and bumps `updatedAt`; `createHousehold` and the import return an "inactive" variant of the duplicate result.
- **Invites on inactive households:** `createInvites` refuses an inactive household (REQ-004 function notes).
- **Import run access:** `importRuns` readable only where `createdBy` is the caller and the caller is staff (SA-001 §4.2).
- **Cancel and expiry:** `cancelled` state, rejected rows deleted at once on Cancel, a previewed run not committable after 60 minutes.
- **Design gap: the commit has no rows to write.** The run stores status, counts and rejected rows, but `commitHouseholdImport(importId)` takes only the id. Either the browser re-sends the rows at commit (re-validated and compared with the run's row count or hash; BA preference, and what makes "reload returns to step 1" correct) or the run holds the ready rows until commit (more personal data at rest). Sol Arch to choose (Open questions).
- **Lot change on edit (decision 3):** lot-key move transaction in `updateHousehold`, rules tests, and the +0.5 day size.
- **Search:** `searchTokens` become accent-folded word prefixes (2+ characters); Firestore allows one `array-contains` per query, so multi-word queries need a design. Confirm the read cost stays near one page.

#### Follow-ups before build (r4)

- **Mock-up screen 3F** (household dialog, active and inactive: title, form, Deactivate / Reactivate, Inactive pill, discard confirm, lot change confirm) must be added before build. Not created yet.
- Mock-up 3B: the phone button label to read "Import households".

#### Size

Option A, CSV only: **5–7 person-days with Claude Code**. That covers the preview and commit functions with validation and tests (encoding, phone formats, duplicates, concurrency), the preview UI, the add/edit/deactivate form and its functions, the paginated list with search and phone cards, and rules plus rules tests. `.xlsx` adds about 1. Option C as a stopgap: 2–3 (the form is still needed).

#### Sources (fetched 2026-11-28)

[Firestore transactions and batched writes (limits, retries)](https://firebase.google.com/docs/firestore/manage-data/transactions). Free daily read and write allowances as quoted in SA-001 §7 from [Firebase pricing](https://firebase.google.com/pricing) (fetched 2026-11-27 by SA-001).

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**4.5–6.25 person-days with Claude Code** (was 5–7). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0.25 · 0.5 · 1–1.25 · 2.25–3.25 · 0.5–1
- **Reuses:** Port: `aHo()` 758 (list, search, status pills) and the `hoDetail` dialog 1383. Extend: paging and server search for 623+ households, phone cards (drawn at 547), link status. New: import preview (548) and the add/edit form (554). The mock-up has no add or edit
