# REQ-036: Request a record or certificate

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-011 Records and certificates](../epics/EPIC-011-records-and-certificates.md) |
| Backlog story | [36 Request a record or certificate](../backlog/BACKLOG.md#36-request-a-record-or-certificate) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 36A–36C of the records and reports mockup (not yet published as an artifact). Repo copy: [req-035-039-mockup.html](../mockups/req-035-039-mockup.html) |
| Architecture | SA-001 §3 ("create a report request": client write checked by rules; `RR-nnn` numbers from a counter), §4.2 (`reportRequests`, `counters/rr`), §8.1 (clients create only in the starting status), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-001 (sign-in), REQ-002 (roles), REQ-011 (in-app notifications), REQ-018 (overdue status, for the certificate warning). REQ-037 is the staff side and ships with this one |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (all seven record types, as in the mock-up), B (certificate of good standing and certified statement only; other records asked for at the office) or C (no form: use Requests & Complaints) | **A**, shipped with REQ-037. Fall back to **B** if the office reports fewer than about 3 record requests a month (see open questions) |
| 2 | Which record types homeowners may request | **The mock-up's seven**, pending counsel's list (open questions): Board financial report, Certified statement of account, Certificate of good standing, Itemized expense report, Audited financial statements, Minutes of board meetings, Other association records |
| 3 | How "Expected by" is counted | **Working days, Monday to Friday**, from the day after the request, per record type (2, 3 or 7 days, from the mock-up). Public holidays are not counted in R3; the office can tell the homeowner if a holiday delays a request. The mock-up adds calendar days but says "working days" |
| 4 | A homeowner with overdue dues asks for a certificate of good standing | **Warn and allow.** They may be paying now; REQ-038 refuses to issue it while dues are overdue |

## Problem

Homeowners selling a lot or applying for a loan need a certificate of good standing; members may also ask for the association's records. Today requests are made in person and tracked informally (EPIC-011), so nobody can say when a request was made or when it is due.

Under R.A. 9904, members have the right "to inspect association books and records during office hours and to be provided upon request with annual reports, including financial statements" (Section 7(b), as quoted in secondary sources; [RA 9904, Senate copy](https://issuances-library.senate.gov.ph/sites/default/files/2023-02/ra%25209904.pdf), not read in full by the BA, so **counsel to confirm the section and its reach**).

The mock-up's "Request a Report" page (`oRec()`, `index.html` line 1244) already has the form, the status stepper and "Expected by". It needs a server-assigned number, a duplicate check, correct working-day dates and phone layout.

Who has the problem: the [Homeowner](../product/PERSONAS.md#homeowner), a few times a year at most; the [Admin office staff](../product/PERSONAS.md#admin-office-staff), who answer the requests (REQ-037).

**Challenge.** No one has counted record requests. With 623 households, clearances for sales and loans may be only a few a month. If so, Option B gets most of the value: a homeowner selling a lot asks for a certificate without a trip, and rarer records stay at the office counter. Ask the office for last year's count before building.

## Options

### Option A: Request form for all record types, with tracked status (recommended)

- **How it works:** homeowner menu → Request a Record. Pick a record type, a period where it applies, the purpose and how to receive it (download, or a signed printed copy to pick up at the office), and add optional notes. The request gets a number (RR-104), shows "Submitted" and "Expected by Dec 2, 2026", and moves through **Submitted → In review → Ready** or **Declined**. A notification arrives at each change.
- **Cost:** cheap for this REQ (one form and one list; the staff side is REQ-037).
- **Excludes:** guests, guards. Works on a phone.
- **Honest downside:** some record types (minutes, audited statements) still need the office to find and scan a file, so "Expected by" depends on people, not the portal.

### Option B: Certificate of good standing and certified statement only

- **How it works:** the same form with two types. Other records: "Ask the admin office" with its hours.
- **Cost:** cheap; slightly less staff work in REQ-037 (no upload path needed at first).
- **Honest downside:** members asking for records under R.A. 9904 still go in person, with no record of when they asked.

### Option C: No new form; use Requests & Complaints (REQ-026)

- **How it works:** a "Records" category on the existing request form.
- **Cost:** cheapest.
- **Honest downside:** no record type, period or delivery choice, no "Expected by", no download of the result, and no good-standing check. Records would mix with garbage and noise complaints.

### Recommendation

**Option A.** It costs little more than B, the form already exists in the mock-up, and a dated record of each request protects the HOA if a member says they were refused records. If the office's count is very low, ship B first.

## Story

As a homeowner, I want to ask the association for a financial report, certified statement, certificate of good standing or other record, so that I can get what I need for a sale, a loan or a general assembly.

## Acceptance criteria (Option A)

```gherkin
Feature: Record requests

  # Maria Santos is a member of Blk 4 Lot 12, signed in, in good standing. Today is Friday, Nov 27, 2026.

  Scenario: Request a certificate of good standing
    When Maria opens Request a Record, chooses "Certificate of good standing", purpose "Sale or transfer of property" and "Signed printed copy (pick up at the admin office)", and presses "Submit request"
    Then My record requests lists a new request with its number, for example "RR-104", reading "Submitted"
    And it reads "Expected by Wed, Dec 2, 2026 (3 working days)"
    And the admin office's Record Requests list shows RR-104 under "Open"

  Scenario: Expected dates skip weekends
    When Maria requests a "Certified statement of account" on Friday, Nov 27, 2026
    Then it reads "Expected by Tue, Dec 1, 2026 (2 working days)"

  Scenario: A period is asked for only where it applies
    When Maria chooses "Minutes of board meetings"
    Then a "Period" field appears with "Year to date 2026" selected
    When she chooses "Certificate of good standing"
    Then the Period field is hidden and its space is kept

  Scenario: Notes are required only for "Other association records"
    When Maria chooses "Other association records" and presses "Submit request" without notes
    Then she sees "Describe the record you need." under Notes
    And nothing is submitted
    And for every other record type, notes are optional

  Scenario: Warning for an overdue account
    Given Grace Lim's household, Blk 1 Lot 3, has ₱3,600.00 overdue
    When she chooses "Certificate of good standing"
    Then she sees "Your account has ₱3,600.00 in overdue dues, so this request will likely be declined until you settle the balance."
    And she can still submit the request

  Scenario: The same open request can't be made twice
    Given Maria has RR-104 "Certificate of good standing" reading "Submitted"
    When she submits another "Certificate of good standing"
    Then she sees "You already have this request open: RR-104, expected by Wed, Dec 2, 2026."
    And no new request is created

  Scenario: Pressing Submit twice creates one request
    When Maria presses "Submit request" twice quickly
    Then exactly one request is created
    And the button reads "Submitting…" and is disabled until the save finishes

  Scenario: Notified when the request changes
    Given RR-104 reads "Submitted"
    When the admin office marks it "In review"
    Then Maria gets the notification "RR-104 Certificate of good standing: In review."
    When it is marked Ready for download
    Then she gets the notification "RR-104 Certificate of good standing: Ready to download."
    And My record requests shows a "Download" button on RR-104

  Scenario: Ready for pickup
    Given RR-104 asked for a signed printed copy
    When it is marked Ready
    Then My record requests reads "A signed printed copy is ready for pickup at the admin office."

  Scenario: A declined request shows the reason
    Given RR-105 was declined with "The requested records are not available for that period."
    Then My record requests shows RR-105 as "Declined" with that reason
    And a "Request again" button opens the form with the same type, period and purpose filled in

  Scenario: Another household's requests are private
    Given Juan is a member of Blk 2 Lot 10 only
    When his device asks for Blk 4 Lot 12's record requests or their files
    Then the request is refused

  Scenario: A homeowner can't set the status
    When Maria's device tries to create a request already reading "Ready", or change RR-104 to "Ready"
    Then the server refuses it

  Scenario: No requests yet
    Given Maria has never requested a record
    Then My record requests reads "No requests yet. Use the form to ask for a record."

  Scenario: Submitting while offline
    Given Maria's phone has lost its connection
    When she presses "Submit request"
    Then she sees "You're offline. Your request wasn't sent. Try again when you're connected."
    And what she chose and typed is still in the form

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then the form shows first, then My record requests as cards with number, type, status, stepper and expected date
    And the page does not scroll sideways
```

## Record types

| Type | Period | Working days | How the office answers (REQ-037) |
|---|---|---|---|
| Board financial report | Yes (closed months, REQ-039) | 3 | Generated from portal records if REQ-039 is built as calculated; otherwise upload |
| Certified statement of account | No | 2 | Generated from portal records |
| Certificate of good standing | No | 3 | Generated, numbered (REQ-038) |
| Itemized expense report | Yes | 3 | Generated from portal records |
| Audited financial statements | Yes | 7 | Upload |
| Minutes of board meetings | Yes | 7 | Upload |
| Other association records | No (described in notes, required) | 7 | Upload |

Purposes (from the mock-up): Personal reference · Sale or transfer of property · Bank or loan application · Permit or government requirement · General assembly or board matter · Other.

## Data changes

| What | Where | Written by | Read by |
|---|---|---|---|
| Record request: `householdId`, `requestedBy` (uid), `type`, `period` (or empty), `purpose`, `delivery` (`download` / `pickup`), `notes` (≤ 500 characters), `status: 'Submitted'`, `createdAt`, `expectedBy` (`YYYY-MM-DD`), `number` (`RR-104`), `history[]` | `reportRequests/{id}` | Homeowner creates, in `Submitted` only, with a closed list of fields (SA-001 §8.1). `number`, `expectedBy` and every later status are server-written | Own household; admin; treasurer |
| Request number | `counters/rr` | Trigger or callable (Sol Arch) | — |
| Duplicate guard: one open request per household, type and period | Checked by the creating function, or by a key document `rrOpen/{householdId}_{type}_{period}` | Function only | — |
| Working days per type | `config/settings.recordTypes` | Treasurer (settings) | Everyone signed in |

The glossary's term is **record request** (the mock-up says both "report request" and "record"). The collection keeps SA-001's name `reportRequests`; screens say "record request".

## UX/UI notes

- **Accessibility:** record types are a radio group in a `fieldset` with a legend; the overdue warning is linked to the certificate option with `aria-describedby` and is text, not only red. Errors are announced (`role="alert"`) and say how to fix them. The stepper has text for each step ("Submitted, done. In review, current."), not only colour.
- **Consistency:** menu and page are renamed from the mock-up's "Request a Report" to **"Request a Record"**, and the staff page to "Record Requests" (glossary: record request). Statuses use the glossary: Submitted, In review, Ready, Declined. Notification wording matches REQ-011.
- **Mobile-first:** at 375 px, the form comes first and the list below as cards. Radio rows are at least 44 px tall. Submit is full width at the bottom of the form.
- **States:** empty list (above); loading (skeleton cards); error and offline (above, typing kept); success (toast "Request RR-104 submitted. Expected by Wed, Dec 2, 2026." and the new card at the top).
- **Forms:** purpose required with a default of "Personal reference"; notes required only for "Other association records"; period defaults to the newest closed period. No backdrop-close issue: this is a page, not a dialog.
- **Safe actions:** "Submitting…" and disabled until saved; duplicate guard on the server, not only in the form.
- **Stable layout:** the Period field and the overdue warning reserve their space (visibility, not mount and unmount), so the radio list doesn't jump.
- **Roles:** only household members create requests for their own household. Staff answer in REQ-037. A treasurer who is also a homeowner requests as "My household" (REQ-002 switch).
- **Privacy (RA 10173):** notes may hold personal data; they are shown only to the household and staff, never in notifications or emails. Notifications name the record type, not the purpose or notes.

## Copy of record

| Where | Text |
|---|---|
| Menu and heading | Request a Record · Ask the association for financial reports, certificates and other records. |
| Form heading | New request |
| Fields | Record · Period (if it applies) · Purpose · How to receive it · Notes (optional) |
| Delivery options | Download from the portal · Signed printed copy (pick up at the admin office) |
| Button | Submit request · Submitting… |
| Legal hint | Members may request the association's books and records under R.A. 9904. You'll get a notification when your record is ready. |
| Overdue warning | Your account has {₱3,600.00} in overdue dues, so this request will likely be declined until you settle the balance. |
| Notes required | Describe the record you need. |
| Duplicate | You already have this request open: {RR-104}, expected by {Wed, Dec 2, 2026}. |
| Expected | Expected by {Wed, Dec 2, 2026} ({3} working days) |
| Pickup ready | A signed printed copy is ready for pickup at the admin office. |
| Empty list | No requests yet. Use the form to ask for a record. |
| Offline | You're offline. Your request wasn't sent. Try again when you're connected. |
| Success toast | Request {RR-104} submitted. Expected by {Wed, Dec 2, 2026}. |
| Notifications | {RR-104} {Certificate of good standing}: In review. · …: Ready to download. · …: Ready for pickup at the admin office. · …: Declined. {reason} |
| Declined action | Request again |

## Out of scope

- Fees for records or certificates, and paying them in the portal (EPIC-011 open question).
- Cancelling a request by the homeowner. If wanted, it is a small follow-up; for now the homeowner asks the office.
- Public holidays in "Expected by".
- Email for record request changes: comes with REQ-019 if released.

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions 1–4 | Owner |
| How many record requests did the office get last year, by type? | Admin office |
| Which records must members be given under R.A. 9904, and may the HOA decline records (not certificates) to members with unpaid dues? Secondary sources say the protection covers a homeowner "who has paid the required fees and charges" | HOA board with counsel |
| May a tenant (D3) request records, or only owners? | HOA board |

## Sol Arch review

Not yet done. Points for Sol Arch:

1. **Client write or callable.** SA-001 lists record requests as a client write checked by rules, with the number from a trigger. The duplicate guard and the server-computed `expectedBy` suggest a small callable `createRecordRequest` instead. Which?
2. **Working-day calculation** in `shared/domain/dates.js`, Asia/Manila, unit-tested across weekends and month ends.
3. **Rules tests:** create only in `Submitted`, own household only, closed field list; no client update after create.
4. **Size:** the backlog says S. The BA agrees: about 1 day with the duplicate guard and working days.
