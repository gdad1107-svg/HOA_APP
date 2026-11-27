# REQ-003: Household directory: add, edit and import

| | |
|---|---|
| Raised by | Owner: "draft req-001 to 004 and have SA review it. I'll approve it tomorrow" (2026-11-28) |
| Epic | [EPIC-001 Access and households](../epics/EPIC-001-access-and-households.md) |
| Backlog story | [03 Household directory: add, edit and import](../backlog/BACKLOG.md#03-household-directory-add-edit-and-import) |
| Status | **Draft: options for owner approval.** Sol Arch reviewed: supports Option A, CSV only in R1, with changes (applied in r2) |
| Mockup | Screens 3A–3E of the [access and households mockup](https://claude.ai/artifact/KaNMpY53cLTtrk8HARZgUr). Repo copy: [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html) |
| Architecture | SA-001 §4.2 (`households`, `lots`) and R-8 (onboarding), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-002 |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch's corrections applied; CSV only in R1; contacts moved to a staff-only record; concurrency and stale-edit cases added |

## Decisions for the owner

| # | Decision | Recommendation |
|---|---|---|
| 1 | Option A (import with preview, plus forms), B (one at a time) or C (developer loads the list) | **A**, CSV only in R1 (`.xlsx` later, about 1 extra day) |
| 2 | Before the import is **built** (not before approval): do block numbers repeat across phases? If yes, every lot key includes the phase (`P1-B04-L12`). Changing the key after import means rewriting every record | Ask the admin office this week |

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
    And the import that finished second lists each of its rows as "Already in the directory, skipped"

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
    And the activity log records who changed it and when

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
| Lot key, e.g. `B04-L12` (or `P1-B04-L12`, decision 2) | `lots/{lotKey}` (SA-001 §4.2) | Unique; the import and the form refuse a lot that exists | Import and household functions only | Rules; import |
| Lot label "Blk 4 Lot 12", block (number), lot (text, allows "12-A"), phase | `households/{id}` | Block and lot required; phase optional until the board confirms phases | Functions only | Every household screen |
| Owner display name | `households/{id}.displayName` | Required, up to 80 characters | Functions | Directory; invitations (REQ-004); letters |
| Search words | `households/{id}.searchTokens` | Lower-case words of the name, for indexed search | Functions | Search |
| Link status and member count | `households/{id}.linkStatus`, `memberCount` | Kept by the REQ-004 functions | Functions | Directory |
| **Contact email and mobile** | **`householdContacts/{householdId}`**: `contactEmail`, `contactMobile` | Email optional but valid; mobile optional, Philippine format. **Staff-only**, so after a sale the new owner never sees the previous owner's contacts | Functions | Admin office, treasurer; REQ-004 invitations |
| Active | `households/{id}.active` | Deactivate, never delete (SA-001 §11.2) | Functions | Directory, billing |
| Import run: status, counts, rejected rows | `importRuns/{id}` | Staff only; rejected rows deleted after 30 days (DPO to confirm) | Import functions | Import screen |
| Change record | `auditLog` | Every add, edit, deactivate, import; ids only | Functions | Board, treasurer |

Clients never write households directly. Edits carry the time the admin loaded the record, so a stale save is refused. The list is read 50 at a time with indexed queries, not by loading all 623 (cost: Sol Arch review).

The contact email is where invitations are sent. It does **not** give anyone access: access comes only from redeeming an invite (REQ-004, ADR-004).

## UX/UI notes

- **Accessibility:** the preview table has a caption and row numbers; errors are text, not only red; the file input has a visible label.
- **Consistency:** reuses the mock-up's table, search box, `.modal` and `.pill`; link status uses the same pill colours as payment status.
- **Mobile-first:** the list becomes cards below 640 px. Import is a desktop task; on a phone the import page says "Import works best on a computer" but still works.
- **States:** empty directory ("No households yet. Import your list or add the first household."); loading skeleton; import in progress with a count; import finished ("Imported 619 households. 4 rows were not imported." with a link to download them); network error keeps the preview.
- **Forms:** the add/edit dialog does not close on a backdrop click; inline validation on blur; the Lot field shows the duplicate message as soon as it is known.
- **Template guidance:** the template says "Save as CSV UTF-8" so names with ñ survive, and keeps the Mobile column as text so Excel doesn't drop the leading 0. The rejected-rows download escapes cells starting with `=`, `+`, `-` or `@`.
- **Safe actions:** Import and Save are disabled while in flight; Deactivate asks "Deactivate Blk 7 Lot 1? It won't be billed or shown in the list, and its unused invitation stops working. Its records are kept." and can be undone with "Reactivate".
- **Live search:** debounced at 200 ms and re-renders only the list.
- **Roles:** admin office staff and treasurer only; board, guard and homeowners are refused by rules.

## Copy of record

| Where | Text |
|---|---|
| Page heading | Homeowners · {n} households |
| Buttons | Import households · Add household · Download template |
| Import hint | Fill in the template and save it as CSV UTF-8. |
| Preview heading | {n} households ready to import · {m} rows won't be imported |
| Row reasons | Lot number is missing · Block is missing · Owner name is missing · {lot} appears more than once in the file · Already in the directory, skipped · "{value}" is not a valid email address · "{value}" is not a valid mobile number |
| Import button | Import {n} households (in flight: Importing…) |
| Import done | Imported {n} households. {m} rows were not imported. Download them to fix and import again. |
| Duplicate lot | {lot} is already in the directory. |
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

## Open questions

| Question | Who decides |
|---|---|
| Decisions for the owner, rows 1–2 | Owner; admin office for row 2 |
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

#### Size

Option A, CSV only: **5–7 person-days with Claude Code**. That covers the preview and commit functions with validation and tests (encoding, phone formats, duplicates, concurrency), the preview UI, the add/edit/deactivate form and its functions, the paginated list with search and phone cards, and rules plus rules tests. `.xlsx` adds about 1. Option C as a stopgap: 2–3 (the form is still needed).

#### Sources (fetched 2026-11-28)

[Firestore transactions and batched writes (limits, retries)](https://firebase.google.com/docs/firestore/manage-data/transactions). Free daily read and write allowances as quoted in SA-001 §7 from [Firebase pricing](https://firebase.google.com/pricing) (fetched 2026-11-27 by SA-001).
