# REQ-038: Certificate of good standing

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-011 Records and certificates](../epics/EPIC-011-records-and-certificates.md) |
| Backlog story | [38 Certificate of good standing](../backlog/BACKLOG.md#38-certificate-of-good-standing) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 38A–38C of the records and reports mockup (not yet published as an artifact). Repo copy: [req-035-039-mockup.html](../mockups/req-035-039-mockup.html) |
| Architecture | SA-001 §3 (sequential numbers need transactions, `counters/`), Flow 1 (number committed first, PDF made after by a retry-safe trigger), §9 (certificates are official documents made by functions), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-037 (the request and the generate path), REQ-018 (overdue status), REQ-012 (pending payments), REQ-003 (owner name on file, lot) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (generated from portal records with a server check) or B (the office types it in Word and uploads it through REQ-037) | **A** |
| 2 | Certificate numbers. **Own series** (GS-00001, GS-00002 …, no gaps) or **the request number** (RR-102 becomes GS-102, as in the mock-up) | **Own series.** Reusing the request number leaves gaps (most requests aren't certificates) and gives a reissued certificate the same number as the first |
| 3 | A household with a payment **pending approval** that would clear its overdue dues | **Refuse until the payment is approved**, and say so. The certificate states a fact the treasurer has confirmed |
| 4 | A certificate issued in error (wrong person, issued too early) | **"Cancel certificate" with a reason**, kept in the register as Cancelled; never edited or deleted |

## Problem

A homeowner selling a lot or applying for a loan needs a numbered certificate stating there are no overdue dues; the buyer or bank must be able to trust it (EPIC-011). In the mock-up (`clearancePDF()`, `index.html` line 1294):

- the certificate is redrawn in the browser **on every download** with the current date, so it never has a fixed issue date;
- its number is the request number with "GS" in place of "RR";
- the good-standing check is only a disabled button on screen;
- there is no list of certificates issued, so the office can't answer a bank that calls to check one.

Who has the problem: the [Homeowner](../product/PERSONAS.md#homeowner) selling or borrowing; [Admin office staff](../product/PERSONAS.md#admin-office-staff), who issue it; the buyer or bank who relies on it.

## Options

### Option A: Generated certificate, checked and numbered by the server (recommended)

- **How it works:** on a "Certificate of good standing" request (REQ-036), "Generate from portal records" (REQ-037) runs a function that, in one transaction, checks the household has no overdue bills and no payment awaiting approval, takes the next GS number, and records the certificate. A trigger then makes the PDF. The office sees a **Certificates** register (number, lot, owner name, issued, valid until, status).
- **Cost:** cheap on top of REQ-037: one template, one counter, a register list and a cancel action.
- **Honest downside:** the certificate can only be as right as the portal's balances. Before launch, opening balances must be loaded (SA-001 R-8), or early certificates may be wrong.

### Option B: Typed by the office, uploaded through REQ-037

- **How it works:** the office keeps its Word template; REQ-037's upload path delivers it.
- **Cost:** none beyond REQ-037.
- **Honest downside:** no automatic check, no number series, no register. A certificate could be issued to a delinquent account by mistake.

### Recommendation

**Option A.** The check and the number are the reason a buyer can trust the paper; doing them by hand is where errors come from. Size stays S.

## Story

As a homeowner selling my lot, I want a numbered certificate stating I have no overdue dues, so that the buyer and the bank accept it.

## Acceptance criteria (Option A)

```gherkin
Feature: Certificate of good standing

  # Paolo Aquino (admin office) is signed in. Maria Santos is the owner on file for Blk 4 Lot 12.
  # The last certificate issued was GS-00041.

  Scenario: Issue a certificate
    Given Maria's household has no overdue dues and no payment awaiting approval
    And RR-104 asks for a "Certificate of good standing" for "Sale or transfer of property"
    When Paolo presses "Generate from portal records" on Nov 27, 2026
    Then RR-104 reads "Ready"
    And the certificate is numbered GS-00042
    And the PDF states that Maria Santos, owner of Blk 4 Lot 12, has no overdue association dues as of Nov 27, 2026
    And it reads "This certificate is valid for thirty (30) days from the date of issue, until Dec 27, 2026."
    And it names the purpose "sale or transfer of property"
    And it shows no balance, email or phone number

  Scenario: Downloading again gives the same certificate
    Given GS-00042 was issued on Nov 27, 2026
    When Maria downloads it on Dec 10, 2026
    Then the certificate still reads "as of Nov 27, 2026" and GS-00042

  Scenario: Refused while dues are overdue
    Given Grace Lim's household, Blk 1 Lot 3, has ₱3,600.00 overdue
    When Paolo opens her certificate request
    Then "Generate from portal records" is disabled
    And Paolo sees "A certificate can't be issued while the account has ₱3,600.00 overdue. Decline it, or wait for payment."

  Scenario: The server refuses even if the screen was out of date
    Given Paolo opened Maria's request while her account was in good standing
    And before he pressed "Generate from portal records", the treasurer voided her ₱1,800.00 October payment (REQ-014), so October is overdue again
    When he presses it
    Then he sees "A certificate can't be issued while the account has ₱1,800.00 overdue. Decline it, or wait for payment."
    And no certificate number is used

  Scenario: Refused while a payment awaits approval
    Given Grace's ₱3,600.00 payment that would clear her overdue dues is awaiting approval
    When Paolo opens her certificate request
    Then he sees "₱3,600.00 is awaiting approval. The treasurer must approve it before a certificate can be issued."
    And "Generate from portal records" is disabled

  Scenario: Numbers never skip or repeat
    Given two staff generate certificates for two different households at the same moment
    Then one is GS-00042 and the other GS-00043

  Scenario: A refused attempt does not use a number
    Given Grace's request was refused for overdue dues
    When the next certificate is issued
    Then it is GS-00042

  Scenario: The PDF is still being made
    Given GS-00042 has been numbered but its PDF is not yet stored
    Then RR-104 reads "Ready. Document preparing…" and shows no Download button
    And Download appears once the file is stored

  Scenario: Pickup copy
    Given RR-104 asked for a signed printed copy
    When the certificate is issued
    Then the office can print GS-00042 from the request
    And Maria sees "A signed printed copy is ready for pickup at the admin office."

  Scenario: The certificate register
    When Paolo opens Record Requests, Certificates
    Then GS-00042 is listed with Blk 4 Lot 12, Maria Santos, issued Nov 27, 2026, valid until Dec 27, 2026, "Valid"
    And on Dec 28, 2026 it reads "Expired"

  Scenario: Find a certificate when a bank calls
    When Paolo types "GS-00042" in "Search certificate number"
    Then only GS-00042 is listed, with its status

  Scenario: Cancel a certificate issued in error
    When Paolo presses "Cancel certificate" on GS-00042, gives the reason "Issued to the wrong household", and confirms
    Then the register shows GS-00042 as "Cancelled" with that reason
    And Maria can no longer download it from RR-104
    And the activity log records who cancelled it, when and why
    And no certificate number is reused

  Scenario: A cancel reason is required
    When Paolo presses "Cancel certificate" and confirms without a reason
    Then he sees "Give a reason for cancelling." and GS-00042 is still "Valid"

  Scenario: Only staff issue or cancel certificates
    Given a homeowner or a board member is signed in
    When their device asks to issue or cancel a certificate
    Then the request is refused

  Scenario: No certificates yet
    Given no certificate has been issued
    Then Certificates reads "No certificates issued yet. They appear here when you generate one from a record request."
```

## Certificate content

From the mock-up's `clearancePDF()`, with the issue date fixed and the validity date written out:

- HOA name, address and logo (`config/branding`, `config/settings.address`)
- **CERTIFICATE OF GOOD STANDING** · Certificate no. GS-00042 · Date issued Nov 27, 2026
- "TO WHOM IT MAY CONCERN:"
- "This is to certify that {owner name on file}, owner of {Blk 4 Lot 12}, {HOA address}, is a member in good standing of {HOA name} and has no overdue association dues as of {Nov 27, 2026}."
- "This certification is issued upon the request of {owner name on file} for the purpose of: {sale or transfer of property}."
- "This certificate is valid for thirty (30) days from the date of issue, until {Dec 27, 2026}."
- Signature lines for the signatories in settings (mock-up: HOA Treasurer and HOA President, "For the Board of Directors")
- Footer: {HOA name} · {GS-00042} · {RR-104} · {Blk 4 Lot 12}

The certificate names the **owner on file** (REQ-003), not the person who pressed Submit, so a spouse or co-owner asking for it gets the same certificate.

## Data changes

| What | Where | Written by | Read by |
|---|---|---|---|
| Certificate: `number` (GS-00042), `householdId`, `ownerName` (copied at issue), `lot`, `purpose`, `issuedOn`, `validUntil`, `requestId`, `pdfPath`, `status` (`valid` / `cancelled`; "Expired" is shown from `validUntil`), `cancelReason`, `cancelledBy`, `cancelledAt` | `certificates/{number}` | `issueCertificate` / `cancelCertificate` functions only | Admin, treasurer; the owning household through its request |
| Counter | `counters/gs` | `issueCertificate` in the same transaction as the check | — |
| PDF | Storage `reports/{rrId}/Certificate-of-Good-Standing_{lot}_{number}.pdf` | Trigger after the number commits (SA-001 Flow 1 pattern) | Owning household (unless cancelled), admin, treasurer |
| Signatories and validity days | `config/settings.certificate {signatories[], validDays: 30}` | Treasurer | Function |
| Audit: `cert.issue`, `cert.cancel` with ids | `auditLog` | Functions | Treasurer, board |

## UX/UI notes

- **Accessibility:** the refusal message sits next to the disabled button and is linked to it (`aria-describedby`), so a screen reader hears why it is disabled. Register statuses are text pills (Valid, Expired, Cancelled), not colour alone.
- **Consistency:** "Certificate of good standing" everywhere (glossary); "HOA clearance" appears only in brackets on the homeowner's record type list for recognition. Reuses REQ-037's dialog and the one confirm dialog for Cancel.
- **Mobile-first:** the register is cards at 375 px; search is on top.
- **States:** empty register (above); preparing ("Document preparing…"); refused (two messages above); expired (computed, no job needed).
- **Forms:** the cancel reason is required; the cancel dialog doesn't close on a backdrop click.
- **Safe actions:** issuing is a non-repeatable save: "Generating…" and disabled; the function holds the check and the number in one transaction. Cancelling is confirmed, reasoned and logged; nothing is deleted.
- **Stable layout:** the refusal message reserves its space under the button.
- **Roles:** admin and treasurer issue and cancel. The board can't. Households see only their own certificates.
- **Privacy:** the certificate carries the owner's name and lot only: no balance, contacts or payment history.

## Copy of record

| Where | Text |
|---|---|
| Refused, overdue | A certificate can't be issued while the account has {₱3,600.00} overdue. Decline it, or wait for payment. |
| Refused, pending | {₱3,600.00} is awaiting approval. The treasurer must approve it before a certificate can be issued. |
| Register heading | Certificates · Certificates of good standing issued from record requests. |
| Register search | Search certificate number |
| Statuses | Valid · Expired · Cancelled |
| Cancel dialog | Cancel certificate {GS-00042}? · The certificate stays in the register as Cancelled and can't be downloaded. Its number isn't reused. · Reason · Cancel certificate · Keep certificate |
| Reason missing | Give a reason for cancelling. |
| Empty register | No certificates issued yet. They appear here when you generate one from a record request. |
| Validity line (PDF) | This certificate is valid for thirty (30) days from the date of issue, until {Dec 27, 2026}. |

## Out of scope

- A public verification page where a bank checks a certificate number (EPIC-011 risk mitigation; a later story).
- Charging a fee for the certificate (EPIC-011 open question).
- Electronic signatures.

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions 1–4 | Owner |
| Who signs certificates (treasurer and president?) | HOA board |
| Is there a fee for a certificate? If yes, is it paid at the office (no portal change) or in the portal (a new story)? | HOA board |
| Is "good standing" only "no overdue dues", or also no unpaid amenity fees, penalties (D2) or open violations? | HOA board |
| Is a downloaded, unsigned certificate valid, or only the signed printed copy? (same as REQ-037) | HOA board |

## Sol Arch review

Not yet done. Points for Sol Arch:

1. **The check.** Read the household's overdue total and pending payments inside the `issueCertificate` transaction from server-kept totals (REQ-018), so a late change refuses the issue.
2. **Counter** `counters/gs` in the same transaction; the PDF after commit, retry-safe (Flow 1).
3. **Cancel** blocks downloads: the Storage rule or signed-URL function checks `status`.
4. **Size:** the backlog says S. The BA agrees: about 1 day on top of REQ-037.
