# REQ-037: Fulfil or decline a record request

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-011 Records and certificates](../epics/EPIC-011-records-and-certificates.md) |
| Backlog story | [37 Fulfil or decline a record request](../backlog/BACKLOG.md#37-fulfil-or-decline-a-record-request) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 37A–37E of the records and reports mockup (not yet published as an artifact). Repo copy: [req-035-039-mockup.html](../mockups/req-035-039-mockup.html) |
| Architecture | SA-001 §3 (official PDFs made by functions), §4.2 Storage path `reports/{rrId}.{ext}` (functions only; read by owning household and admin), §9 ("official documents … are made by functions and stored, so the same file is always reproduced"), §8.2 (RA 10173), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-036 (the request), REQ-009 (statement of account), REQ-011 (notifications), REQ-006 (activity log), REQ-022 (expenses, for the itemized expense report), REQ-035 (shared report rows). REQ-038 (certificate) and REQ-039 (board report) add two generated types |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (documents made by a function and stored once) or B (made in the browser each time someone downloads, as in the mock-up) | **A.** The HOA can show exactly what it released and when, and every download is the same file |
| 2 | Largest file the office may upload | **10 MB, PDF, JPG or PNG.** The mock-up's 3 MB is too small for a scanned set of minutes; storage at this volume is negligible |
| 3 | Before uploading a record, the office confirms it has removed personal data the requester shouldn't see (for example names of delinquent members in minutes) | **Yes, a required checkbox.** Cheap, and it puts the RA 10173 check at the moment it matters |
| 4 | Who may fulfil or decline | **Admin office and treasurer.** Board members don't (REQ-002: board is read-only) |

## Problem

Requests from REQ-036 need an answer by their expected date (EPIC-011 target: 90% on time). The mock-up's Record Requests page (`aRrq()`, `index.html` line 1270) and its dialog (`rrModal()`, line 1278) let the office mark a request in review, generate it, upload a file or decline. In the mock-up:

- "Generate from portal records" only changes the status; the document is drawn in the browser **each time it is downloaded**, so a statement downloaded next month shows next month's figures, and the HOA has no copy of what it released;
- clicking outside the dialog closes it and loses a typed decline reason (backlog finding 5);
- the upload limit is 3 MB, and files are stored inside the data (SA-001 §4.4 item 6);
- two staff can answer the same request at once.

Who has the problem: [Admin office staff](../product/PERSONAS.md#admin-office-staff), daily; the [Homeowner](../product/PERSONAS.md#homeowner) waiting for the record.

## Options

### Option A: The office generates, uploads or declines; generated documents are made once by a function and stored (recommended)

- **How it works:** staff menu → Record Requests, filtered Open / Ready / Declined / All, oldest expected date first, "Past due" flagged. "Process" opens the request with the household's standing, the purpose, notes and history, and three ways to answer:
  1. **Generate from portal records** (certified statement, itemized expense report, certificate of good standing (REQ-038), board financial report (REQ-039, if calculated)). A function makes the PDF, stores it and marks the request Ready.
  2. **Upload the document** (any type), with the personal-data check.
  3. **Decline** with a reason, chosen from presets or typed.
- **Cost:** moderate: a queue page, a dialog, one `fulfilRecordRequest` function with a PDF template per generated type, an upload path, rules tests.
- **Honest downside:** a stored document is a snapshot. If the office generates a statement and a payment is approved an hour later, the statement is still the earlier one. That is correct for a certified document, but the office should generate on the day it hands it over.

### Option B: Documents made in the browser at download time (mock-up)

- **How it works:** "Generate" only marks the request Ready; the homeowner's browser draws the PDF when they press Download.
- **Cost:** cheap.
- **Honest downside:** two downloads can differ; the HOA can't prove what it released; a "certified" document isn't fixed. SA-001 §9 rules this out for official documents.

### Recommendation

**Option A.** A certified statement or certificate that changes after it is issued is not certified. The extra cost is one function and stored files, which the receipt PDF (REQ-013) already needs.

## Story

As an admin office staff member, I want to generate the record from portal data, upload a file, or decline with a reason, so that every request is answered on time.

## Acceptance criteria (Option A)

```gherkin
Feature: Processing record requests

  # Paolo Aquino (admin office) is signed in on Record Requests unless a scenario says otherwise.

  Scenario: Open requests, oldest due first
    Given RR-102 is expected by Dec 2, 2026 and RR-103 by Dec 3, 2026, both open
    Then the "Open (2)" filter lists RR-102 above RR-103
    And each row shows the number, household, record type, purpose, delivery, status and "Due {date}"

  Scenario: Late requests stand out
    Given RR-101 is "In review" and was expected by Nov 25, 2026
    And today is Nov 28, 2026
    Then RR-101's row reads "Past due" in red, with a warning icon
    And the page heading reads "1 past due"

  Scenario: Mark a request in review
    Given RR-103 reads "Submitted"
    When Paolo presses "Mark in review"
    Then RR-103 reads "In review"
    And the homeowner gets the notification "RR-103 Minutes of board meetings: In review."

  Scenario: Generate a certified statement from portal records
    Given RR-104 asks for a "Certified statement of account" for Blk 4 Lot 12, to download
    When Paolo presses "Generate from portal records" on Nov 28, 2026
    Then the button reads "Generating…" and is disabled
    And RR-104 then reads "Ready"
    And the homeowner can download "Certified-Statement_Blk-4-Lot-12_2026-11-28.pdf"
    And the PDF lists the same periods, payments and balance as Blk 4 Lot 12's statement of account on Nov 28, 2026
    And downloading it again on Dec 15, 2026 gives the same file

  Scenario: Generating twice makes one document
    When Paolo presses "Generate from portal records" twice quickly
    Then exactly one document is stored for RR-104
    And the history shows one "Generated from portal records" entry

  Scenario: Generate an itemized expense report
    Given RR-106 asks for an "Itemized expense report" for October 2026
    When Paolo presses "Generate from portal records"
    Then the PDF lists every expense dated in October 2026 that is not void, with date, category, vendor, description and amount
    And its total equals the expenses total on Accounting for October 2026

  Scenario: A board financial report can be generated only when REQ-039 provides it
    Given RR-107 asks for a "Board financial report" for April–October 2026
    And the board financial report is not yet built
    Then "Generate from portal records" is not shown for RR-107
    And Paolo can upload the document instead

  Scenario: Upload a document the portal can't make
    Given RR-103 asks for "Minutes of board meetings"
    When Paolo chooses "Minutes-2026.pdf" (2 MB), ticks "I have removed personal data the requester shouldn't see", and presses "Upload and mark ready"
    Then the button reads "Uploading…" and is disabled until the upload finishes
    And RR-103 reads "Ready" with that file
    And the homeowner gets the notification "RR-103 Minutes of board meetings: Ready to download."

  Scenario: The personal-data check is required
    When Paolo chooses a file and presses "Upload and mark ready" without ticking the check
    Then he sees "Confirm you have removed personal data the requester shouldn't see."
    And nothing is uploaded

  Scenario: A file that is too large or the wrong type
    When Paolo chooses a 12 MB file, or a ".docx" file
    Then he sees "Upload a PDF, JPG or PNG up to 10 MB." under the file field
    And the status does not change

  Scenario: An upload that fails part-way
    Given the connection drops while "Minutes-2026.pdf" is uploading
    Then Paolo sees "The upload didn't finish. Nothing was changed. Try again."
    And RR-103 still reads "In review"

  Scenario: Replace a wrong file
    Given RR-103 reads "Ready" with "Minutes-2025.pdf", the wrong year
    When Paolo presses "Replace file", uploads "Minutes-2026.pdf" and gives the reason "Wrong year attached"
    Then the homeowner can download only "Minutes-2026.pdf"
    And the history reads "File replaced: Wrong year attached"
    And the homeowner gets the notification "RR-103 Minutes of board meetings: The file was updated."

  Scenario: Decline with a reason
    When Paolo presses "Decline" on RR-108, picks "The requested records are not available for that period.", and presses "Decline request"
    Then RR-108 reads "Declined"
    And the homeowner sees that reason on RR-108
    And gets the notification "RR-108 Audited financial statements: Declined."

  Scenario: A reason is required
    When Paolo presses "Decline request" with no reason chosen or typed
    Then he sees "Give the homeowner a reason." and RR-108 is unchanged

  Scenario: Typing in the decline dialog is not lost
    Given Paolo has typed a reason in the Decline dialog
    When he clicks outside the dialog
    Then the dialog stays open with the reason still typed

  Scenario: Two staff answer the same request
    Given Paolo and the treasurer both opened RR-103
    When the treasurer uploads a file and Paolo then presses "Decline request"
    Then Paolo sees "RR-103 was already answered (Ready). Reload to see it."
    And RR-103 still reads "Ready"

  Scenario: Answered requests can't be answered again
    Given RR-108 reads "Declined"
    When Paolo opens it
    Then it shows the reason and history, and no Generate, Upload or Decline controls

  Scenario: Only staff can answer
    Given a board member, or a homeowner, is signed in
    When their device asks to generate, upload to or decline RR-103
    Then the request is refused

  Scenario: Every answer is in the activity log
    When Paolo generates RR-104
    Then the activity log shows "RR-104: Generated from portal records" with Paolo's name and the time

  Scenario: No open requests
    Given no request is open
    Then the Open filter reads "No open requests."

  Scenario: Readable on a phone
    Given the treasurer opens Record Requests on a screen 375 px wide
    Then each request is a card with number, household, record type, status and due date
    And the page does not scroll sideways
```

## Data changes

| What | Where | Written by | Read by |
|---|---|---|---|
| Status after `Submitted`: `In review`, `Ready`, `Declined`; `answeredBy`, `answeredAt`, `declineReason`, `history[]` entries `{at, by, text}` | `reportRequests/{id}` | `fulfilRecordRequest` function only (one transaction checks the status hasn't changed) | Own household; admin; treasurer |
| Stored document: path, file name, content type, size, `source: 'generated' / 'uploaded'`, `generatedAt` | `reportRequests/{id}.file` | Function only | As above |
| The file | Storage `reports/{rrId}/{fileName}` (SA-001 has `reports/{rrId}.{ext}`; a folder allows a replaced file to be kept for the record) | Function only. Office uploads go to a staging path that the function checks (type, size) and moves (Sol Arch) | Owning household (Ready only), admin, treasurer |
| Replaced file: kept, not shown to the homeowner | `reports/{rrId}/replaced/{fileName}` | Function only | Admin, treasurer |
| Audit entries: `rr.review`, `rr.generate`, `rr.upload`, `rr.replace`, `rr.decline` with ids only | `auditLog` | Function only | Treasurer, board (REQ-006) |
| Decline presets | `config/settings.rrDeclineReasons` | Treasurer | Staff |

## UX/UI notes

- **Accessibility:** filter chips are a button group with `aria-pressed` and counts. "Past due" is text plus an icon, not only red. The dialog takes focus on open and returns it to the row's "Process" button on close. The file field has a visible label with the limits; errors are announced.
- **Consistency:** reuses the mock-up's chips, table, `.kv` list, timeline and modal. "Decline" uses the danger button and the one confirm pattern. Statuses and the "record request" term follow the glossary.
- **Mobile-first:** the office uses a desktop, but a treasurer may answer on a phone: cards at 375 px; the dialog becomes full-width.
- **States:** empty (above); loading (skeleton rows); generating ("Generating…", then "RR-104 is ready. The homeowner was notified."); upload progress with percentage; upload failure (above); PDF still being made ("Ready. Document preparing…" until the file exists, as SA-001 Flow 1 does for receipts).
- **Forms:** decline reason is a preset select plus a text box, at least one required. A dialog holding a typed reason or chosen file **does not close on a backdrop click**.
- **Safe actions:** generate, upload and decline each show a busy label and are disabled until done; the function refuses an answer to a request that is already answered. Declining is confirmed in the dialog.
- **Stable layout:** Generate, Upload and Decline sit in fixed places; a type that can't be generated shows the Upload section where Generate would be, so the dialog doesn't change shape between requests.
- **Roles:** admin and treasurer only; rules and the function both check. Board and homeowners are refused (rules tests).
- **Privacy (RA 10173):** the personal-data check before any upload; the itemized expense report lists vendors, which may be individuals (counsel, open questions); generated documents never include contact details.

## Copy of record

| Where | Text |
|---|---|
| Page heading | Record Requests · Records and certificates requested by homeowners. |
| Filters | Open ({n}) · Ready ({n}) · Declined ({n}) · All ({n}) |
| Due and late | Due {Dec 2, 2026} · Past due |
| Dialog title | {RR-104} · {Certified statement of account} |
| Buttons | Mark in review · Generate from portal records · Generating… · Upload and mark ready · Uploading… · Replace file · Decline · Decline request |
| Upload label | Upload the document (PDF, JPG or PNG, up to 10 MB) |
| Personal-data check | I have removed personal data the requester shouldn't see. |
| Check missing | Confirm you have removed personal data the requester shouldn't see. |
| File error | Upload a PDF, JPG or PNG up to 10 MB. |
| Upload failed | The upload didn't finish. Nothing was changed. Try again. |
| Reason missing | Give the homeowner a reason. |
| Decline presets | The requested records are not available for that period. · Please visit the admin office to inspect these records in person. · Account has {₱3,600.00} in overdue dues. Settle the balance and request again. (certificate only) |
| Already answered | {RR-103} was already answered ({Ready}). Reload to see it. |
| Success toasts | {RR-104} is ready. The homeowner was notified. · {RR-108} was declined. The homeowner was notified. |
| Preparing | Ready. Document preparing… |
| Empty | No open requests. |
| PDF footer (generated) | Generated from {HOA name} portal records on {Nov 28, 2026} · {RR-104} |

## Out of scope

- Electronic signatures and notarisation (EPIC-011).
- Tracking whether a printed copy was collected.
- Reopening a declined request; the homeowner uses "Request again" (REQ-036).
- Redacting files inside the portal; the office redacts before upload.

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions 1–4 | Owner |
| Is a downloaded, unsigned certified statement acceptable, or must "certified" documents always be signed copies? Recommended: the PDF names the certifying officer and says "A signed copy is available at the admin office." | HOA board |
| Does the itemized expense report given to members show vendor names, including individuals? | HOA board with counsel and the DPO |
| How long are released documents kept? | HOA board with the DPO |

## Sol Arch review

Not yet done. Points for Sol Arch:

1. **Upload path.** SA-001 has `reports/` written by functions only. Staff upload to a staging path and a function checks and moves the file, or rules allow staff to write `reports/` directly with type and size checks?
2. **PDF engine** shared with receipts (REQ-013) and notices: one template per generated type, rendered by a retry-safe trigger after the status commit.
3. **Concurrency:** answering checks the current status inside a transaction (the two-staff scenario).
4. **Download:** signed URL from a function, or a Storage rule that checks household membership and `status == 'Ready'`?
5. **Size:** the backlog says M. The BA's read: 2.5–3 days (queue, dialog, function, two generated templates, upload, replace, rules tests). The certificate and board report templates belong to REQ-038 and REQ-039.
