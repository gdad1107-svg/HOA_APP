# REQ-013: Official receipt PDF

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-003 Payments and receipts](../epics/EPIC-003-payments-and-receipts.md) |
| Backlog story | [13 Official receipt PDF](../backlog/BACKLOG.md#13-official-receipt-pdf) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted (REQ-013 #3 as Sol Arch proposed). Sol Arch reviewed: supports Option A with changes (applied in r3). **Go-live of receipts is gated on D5** (decision 2), not the build |
| Mockup | Screens 13A–13E of the payments and announcements mockup (not yet published as an artifact). Repo copy: [req-012-017-mockup.html](../mockups/req-012-017-mockup.html) |
| Architecture | SA-001 §3 (receipt PDF function), §4.2 (`receipts`, Storage `receipts/{orNo}/issued.pdf` and `void.pdf`), §4.3 Flow 1 points 2 and 4, §8.2, R-1, R-16, Q4, Q12; CODING-STANDARDS rules 9, 12, 14. Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-012 (receipt record and snapshot), REQ-009 (statement, credit display), REQ-007 (HOA name, payee) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (series in `counters/or` set by a developer script, optional `rangeEnd`, issued and void files kept separately, status read from the payment, sale rule by submission time, D5 "not a BIR receipt" branch, optional TIN and address); change 3 not applied, see note · r4, 2026-11-28: owner approval recorded; recommendations accepted, decision 3 as Sol Arch proposed · r5, 2026-11-28: decision 6 changed by the owner ("Sol Arch: at submission"): "Received from" is the owner on file when the payment is submitted; Sol Arch's change 3 applied, sale-while-pending scenario added |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted, **decision 3 in Sol Arch's version** rather than the BA's draft. D5 (decision 2) is the board's accountant's to answer and stays open under Open questions; it blocks go-live of receipts, not the build.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (the server makes the PDF once, at approval, and keeps it), B (the browser makes the PDF from the stored receipt each time it is downloaded) or C (BIR-registered electronic invoicing) | **A** (Sol Arch: 2.5–3.5 days, about one day more than B) |
| 2 | **D5 (board decision): must the receipt follow BIR rules?** Since RR 7-2024 (effective April 27, 2024), the BIR's primary document for services is an **invoice**, and a manual "official receipt" is treated as a supplementary document ([PwC](https://www.pwc.com/ph/en/tax/tax-publications/taxwise-or-otherwise/2024/compliance-change-on-invoicing-under-eopt.html), [KPMG](https://kpmg.com/ph/en/insights/2024/04/special-intax-april-2024-issue-1-volume-3.html)). One commentary says HOA association dues are tax-exempt under conditions but still need BIR-registered receipts ([Respicio](https://www.respicio.ph/commentaries/rules-on-issuing-official-receipts-for-homeowners-association-monthly-dues)); **that is unverified** against the primary rules | **The board asks the HOA's accountant in writing**: (a) may the portal issue this document at all, (b) what title it carries, (c) whether numbers must come from a BIR-registered range. **The build goes ahead; go-live of receipts waits for the written answer.** The **title** is a setting, and the series (prefix, next number, optional range end) is set by the developer script of decision 3, so the answer doesn't change code. If the portal's document can't be the BIR document, the title becomes something like "Acknowledgement Receipt" with the line "This is not a BIR official receipt or invoice."; the HOA keeps issuing its paper BIR receipts, and the two number series must not overlap. If the answer is "BIR-registered e-invoicing", that is Option C, a separate project. *The accountant's answer is still open.* |
| 3 | Receipt prefix and first number | **Set once by a developer script, not editable in Settings** (Sol Arch's version). The series `{prefix, next, width, rangeEnd}` lives in `counters/or` and is set on the treasurer's written instruction, the same way as `setRole` (REQ-002). If the HOA has a paper booklet, the series **starts after its last number** so the two don't overlap. Only the document **title** stays in Settings |
| 4 | **SA-001 Q12: an overpayment.** Carry it as a credit, or refuse it | **Carry as credit**, as the mock-up does: "Advance payment (credit)" on the receipt, "₱200.00 credit" on the statement. Refunds of credit are out of scope (EPIC-003) |
| 5 | **Privacy after a sale** (REQ-004 decision 5, SA-001 R-16). The previous owner's receipts carry their name | **REQ-010 decision 3 option (b):** payments **submitted** before a member's link date (server time, `submittedAt` against `members.linkedAt`) show date, amount and status only, with **no receipt PDF**, unless that member submitted the payment; screenshots are visible only to the uploader and treasurer-role holders (REQ-012 decision 6). The new owner still sees the lot's full **balance**. Data Protection Officer to confirm. *Consequence (Sol Arch): a spouse or co-owner linked after the owner also loses the earlier receipts.* |
| 6 | Whose name is printed as "Received from" | **The owner on file for the lot at the moment the payment is submitted** (REQ-003), as Sol Arch proposed. Owner: "Sol Arch: at submission" (2026-11-28). `submitPayment` copies `households.displayName` into the payment (`paymentPrivate.receivedFromName`, REQ-010); approval copies it into the receipt, so a sale while the payment is pending, or a later name change, never alters it. Not the name of the person who submitted (it may be a family member) |
| 7 | Signature block | **"Approved by {treasurer's name}, Treasurer"** with "This receipt was issued electronically by the {HOA name} portal." No image of a signature |

## Problem

The homeowner needs proof the HOA received their money: for their records, for a sale, for a certificate of good standing. In the mock-up the receipt PDF is drawn in the browser from live data (`receiptPDF`, `index.html` line 1049), so "Applied to" and the balance line change every time it is downloaded. A receipt that changes after it is issued is not proof of anything.

The open risk is legal, not technical: whether the portal's document satisfies the BIR (SA-001 R-1). The rules changed in 2024 and the HOA's accountant has not been asked.

## Options

### Option A: Server makes the PDF once and keeps it (recommended)

- **How it works:** when REQ-012 issues the receipt, a Cloud Function draws the PDF from the receipt record and stores it. Every download serves that same file. The homeowner downloads it from Dues & Payments; the treasurer from the payment's detail.
- **Cost:** moderate (story size M). A PDF library in Cloud Functions, a trigger, a short-lived download link.
- **Excludes:** nothing. Works on any phone that can open a PDF.
- **Honest downside:** a few seconds' wait after approval before the file exists ("Preparing…"); one more server component to monitor.

### Option B: Browser makes the PDF from the stored receipt

- **How it works:** as the mock-up, but drawn from the frozen receipt record, not live data.
- **Cost:** cheap. The mock-up's code already exists.
- **Honest downside:** identical content but not an identical file (it depends on the app version); story 19's email in R2 needs a server-made PDF anyway, so this work is partly redone.

### Option C: BIR-registered electronic invoicing

- **How it works:** the portal issues BIR-compliant electronic invoices through a registered system.
- **Cost:** project. Registration, accreditation and likely an outside provider. Only if decision 2's answer requires it.
- **Honest downside:** months of lead time outside the developer's control.

### Recommendation

**Option A**, because the receipt is the HOA's official record and story 19 needs it on the server in R2. Option B is acceptable for R1 if Sol Arch prices A much higher. Whatever the board's accountant says, the document's title is a setting and the number series is set by a developer script (decision 3), so the answer changes configuration, not code.

## Story

As a homeowner, I want an official receipt for every approved payment, so that I have proof of payment for my records.

## Acceptance criteria (Option A)

```gherkin
Feature: Official receipt

  Background:
    Given the receipt title setting is "Official Receipt"
    And the developer script set the receipt series prefix to "OR-"
    And Carlo Reyes of Blk 2 Lot 7 paid ₱1,800.00 on Nov 27, 2026 with reference "4012883219554"
    And the owner on file for Blk 2 Lot 7 was "Ana Reyes" when Carlo submitted the payment

  Scenario: Download a receipt
    Given the treasurer Liza Santos approved Carlo's payment on Nov 28, 2026 as OR-00093
    When Carlo presses "Receipt PDF" next to the payment in Dues & Payments
    Then a file named "OR-00093.pdf" opens or downloads
    And it shows "Official Receipt", "OR-00093", date of payment "Nov 27, 2026" and date issued "Nov 28, 2026"
    And it shows "Received from: Ana Reyes · Blk 2 Lot 7"
    And it shows "₱1,800.00" and "One Thousand Eight Hundred Pesos Only"
    And it shows "Applied to: Association dues · October 2026  ₱1,800.00"
    And it shows "QR Ph transfer", the reference number and the payee
    And it shows "Approved by Liza Santos, Treasurer"

  Scenario: The lot is sold while the payment is pending
    Given Ana Reyes was the owner on file when Carlo submitted his payment on Nov 27, 2026
    And the office changed the owner on file for Blk 2 Lot 7 to "Ben Cruz" on Nov 28, before approval
    When the treasurer approves the payment as OR-00093
    Then OR-00093 shows "Received from: Ana Reyes · Blk 2 Lot 7"

  Scenario: Centavos are written out
    Given a payment of ₱1,850.50 is approved
    Then its receipt reads "One Thousand Eight Hundred Fifty Pesos and 50/100 Only"

  Scenario: One payment covers several months, oldest first
    Given Roberto owes October and November 2026 at ₱1,800.00 each
    When his ₱3,600.00 payment is approved
    Then his receipt shows "Association dues · October 2026  ₱1,800.00" and "Association dues · November 2026  ₱1,800.00"

  Scenario: An overpayment becomes a credit
    Given Juan owes ₱1,800.00 and pays ₱2,000.00
    When his payment is approved
    Then his receipt shows "Advance payment (credit)  ₱200.00"
    And his statement balance reads "₱200.00 credit"

  Scenario: The same receipt every time
    Given OR-00093 was downloaded on Nov 28
    And since then the dues rate changed and the owner on file was renamed
    When the treasurer downloads OR-00093 on Dec 15
    Then the receipt number, name, amounts, lines applied and date issued are the same as on Nov 28

  Scenario: The PDF is still being prepared
    Given OR-00093 was issued a moment ago
    When Carlo opens Dues & Payments
    Then the payment shows "Approved · OR-00093" and a disabled "Preparing receipt…" in place of "Receipt PDF"
    And "Receipt PDF" becomes available without reloading the page once the file is ready

  Scenario: The PDF can't be prepared
    Given the receipt file for OR-00093 failed to generate
    When Carlo opens Dues & Payments
    Then he sees "Your receipt OR-00093 is issued, but the file isn't ready yet. Try again later, or contact the admin office."
    And the receipt record and number are unaffected

  Scenario: No receipt for a payment that isn't approved
    Given a payment is "Pending approval" or "Rejected"
    Then it has no "Receipt PDF" button

  Scenario: Another household's receipt
    Given Maria is a member of Blk 5 Lot 1
    When she asks for OR-00093 directly, by link or by number
    Then she is refused and sees "You don't have access to this receipt."

  Scenario: A new owner after a sale (decision 5)
    Given Ana Reyes was removed from Blk 2 Lot 7 and Ben Cruz was linked on Dec 10, 2026
    When Ben opens Dues & Payments
    Then he sees the lot's current balance
    And payments submitted before Dec 10, 2026 show date, amount and status only, with no "Receipt PDF"
    And if he asks for one of those receipts directly, he sees "You don't have access to this receipt."

  Scenario: The sale rule uses when the payment was submitted, not the date paid typed in
    Given Ben was linked to Blk 2 Lot 7 on Dec 10, 2026
    And a payment was submitted on Dec 8, 2026 with a date paid of Dec 12, 2026
    When Ben opens Dues & Payments
    Then that payment shows date, amount and status only, with no "Receipt PDF"

  Scenario: Receipt numbers run out in a registered range
    Given the developer script set the last number in the registered range to OR-05000
    And OR-05000 has been issued
    When the treasurer approves the next payment
    Then it is refused with "Receipt numbers have run out. Ask the developer to add the next registered range."
    And the payment stays pending

  Scenario: The treasurer is warned before the range runs out
    Given the registered range ends at OR-05000 and starts at OR-00001
    When OR-04750 is issued
    Then the treasurer sees "95% of receipt numbers in this range are used. Ask the developer to add the next registered range."

  Scenario: The receipt number series can't be changed in Settings
    When the treasurer opens Settings
    Then they can change the receipt title
    And they see no field for the receipt prefix or first number

  Scenario: The treasurer downloads any receipt
    When the treasurer opens a payment approved as OR-00093
    Then they can press "Receipt PDF" and get the same file

  Scenario: TIN and address print only when set
    Given the HOA's TIN and address settings are empty
    Then OR-00093 shows no TIN or address line
    When the treasurer sets the TIN and address and a new receipt OR-00094 is issued
    Then OR-00094 shows them, and OR-00093 is unchanged

  Scenario: The download link doesn't last
    Given Carlo copied the download address of OR-00093.pdf
    When it is opened more than 15 minutes later
    Then it no longer works, and pressing "Receipt PDF" again gives a fresh one

  Scenario: Download on a weak connection
    Given Carlo's connection drops while downloading
    Then he sees "Couldn't download the receipt. Check your connection and try again."
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Receipt record and snapshot | `receipts/{orNo}` (REQ-012) | Read-only here. The snapshot includes the title, TIN and address in force at issue, so a later settings change never alters an issued receipt. **Readable by staff and functions only**: homeowners never read `receipts` directly, so a previous owner's name can't be read from the database after a sale | `decidePayment` | Receipt PDF function, staff |
| Receipt files | Storage `receipts/{orNo}/issued.pdf`, and on a void `receipts/{orNo}/void.pdf` (REQ-014) | The issued file is made once and **never overwritten**; a void adds a second file. A render gives the same output every time (PDF dates set to `issuedAt`, no "now"), so a retry rebuilds the same file. After a void, homeowners get the void version; the treasurer can still get the original. No client read or write in Storage rules | Receipt PDF trigger (`onDocumentCreated(receipts/{orNo})`, retry on), hourly sweep job | `getReceiptUrl` only |
| File status: `pdfPath`, `pdfStatus` (`preparing` / `ready` / `failed`) | `receipts/{orNo}` | Upload first, then set `ready`. On the final failure, `failed` and the structured log `receipt.pdf_failed` (`orNo` only), which raises an alert. The sweep job re-renders anything `preparing` over 15 minutes or `failed` (up to 5 tries) | Receipt PDF trigger, sweep job | Staff |
| Status for homeowners: `receiptPdfStatus` | `payments/{id}` (copied) | Mirrors `pdfStatus`, so "Preparing receipt…" turns into "Receipt PDF" through the payment listener the homeowner already has | Receipt PDF trigger | Homeowner and treasurer screens |
| Receipt series: `prefix`, `next`, `width`, optional `rangeEnd` | `counters/or` (decision 3) | **Set once by a developer script** on the treasurer's written instruction, after any paper booklet's last number. Not editable in Settings. `decidePayment` refuses past `rangeEnd`; the treasurer is warned at 95% of the range | Developer script; `decidePayment` takes numbers | `decidePayment` |
| Receipt settings: title; optional `hoaTin`, `hoaAddress` | `config/settings` (SA to name fields) | Title required; TIN and address printed only when set | Treasurer, in Settings | `decidePayment` (into the snapshot) |
| Download link | `getReceiptUrl(orNo)` callable | Returns a **V4 signed URL valid for 15 minutes** (not `getDownloadURL()`, which makes a permanent link). Refused unless the caller holds the treasurer role, submitted the payment, or is a member whose `linkedAt` is on or before the payment's server `submittedAt` (decision 5) | Function | — |
| Visibility after a sale | `getReceiptUrl`; the shared payment row in REQ-010 and REQ-015 | Decision 5: no receipt download for a payment **submitted** before the member's `members.linkedAt`, unless they submitted it | Function | — |

No personal data in the file name, the Storage path or the download address (SA-001 §8.2); signed URLs are never logged. A download is not logged in R1.

## UX/UI notes

- **Accessibility:** the PDF has real text (not an image), a title and a reading order of number → date → received from → amount → lines; minimum 9 pt type; contrast meets 4.5:1. The "Receipt PDF" button names the receipt for screen readers: "Download receipt OR-00093".
- **Consistency:** the document title comes from settings (decision 2); everywhere on screen it is "official receipt" or "receipt OR-00093", never "e-receipt" (glossary). The layout follows the mock-up's receipt and statement PDFs (same header, colours, footer).
- **Mobile-first:** the button is at least 44 px; on a phone the PDF opens in the phone's viewer; the page fits A4 and US Letter printers without clipping (both are common in the Philippines).
- **States:** preparing (disabled button, text "Preparing receipt…", keeps its width), ready, failed (plain message, number still shown), not available (no button for pending or rejected payments), void (REQ-014).
- **Safe actions:** downloading changes nothing; repeated presses are harmless.
- **Roles:** the household's members (subject to decision 5), treasurer, board (read-only, if the board role sees payments in R2). Admin office staff: not in R1 (REQ-002 decision 3 keeps payments with the treasurer). Enforced by `getReceiptUrl`, not just by hiding the button. The receipt series is not a screen at all (decision 3).
- **Accessibility caveat (Sol Arch, uncertain):** `pdf-lib` may not write tagged PDF, so the drawing order is the reading order. Dev checks before the library choice is final.
- **Copy honesty:** the receipt says "issued electronically after the treasurer matched the reference number with the collection account"; it does not say the portal verified the payment.

## Copy of record

| Where | Text |
|---|---|
| Button | Receipt PDF · (preparing) Preparing receipt… |
| PDF title | {receipt title setting}, default "Official Receipt" |
| PDF fields | {title} No. · Date of payment · Date issued · Received from · Amount received · The sum of {amount in words} · Applied to · Amount · Total · Payment method: QR Ph transfer · Reference no. · Paid to |
| Lines | Association dues · {Period} · Advance payment (credit) |
| PDF balance line | Account balance after this payment, as of {date issued}: {₱x due / ₱x credit / Fully paid} |
| PDF signature | Approved by {name}, Treasurer |
| PDF note | This receipt was issued electronically by the {HOA name} portal after the treasurer matched the reference number with the collection account. Keep it for your records. |
| PDF footer | {HOA name} · {OR no.} · {lot} |
| PDF header (only when set) | TIN {hoaTin} · {hoaAddress} |
| PDF line if D5 says it isn't the BIR document | This is not a BIR official receipt or invoice. |
| Errors | Your receipt {OR no.} is issued, but the file isn't ready yet. Try again later, or contact the admin office. · You don't have access to this receipt. · Couldn't download the receipt. Check your connection and try again. |
| Series | Receipt numbers have run out. Ask the developer to add the next registered range. · 95% of receipt numbers in this range are used. Ask the developer to add the next registered range. |

## Out of scope

- Emailing the receipt: story 19 (R2).
- BIR-registered e-invoicing (Option C), unless decision 2 requires it.
- Printed paper receipts from the office, and receipts for cash payments.
- Refunding a credit.
- A public "verify this receipt" page or QR code on the receipt.
- Receipts for amenity fees (R3, EPIC-010).

## Open questions

| Question | Who decides |
|---|---|
| **D5 (decision 2): may the portal issue this document, what title, and must numbers come from a BIR-registered range?** Blocks go-live of receipts, not the build | HOA board, with its accountant, in writing |
| Who is the HOA's Data Protection Officer, to confirm decision 5? | HOA board |
| The series' prefix and first number for the developer script: the last number of any paper booklet | Treasurer, in writing |
| Does the HOA have a TIN and a BIR registration as a non-stock association, and does it currently issue BIR-registered paper receipts? | Treasurer / accountant |
| Should the receipt show the HOA's TIN and address? | Accountant (follows decision 2) |
| How long must receipts be kept? (Records law, SA-001 §8.2) | Accountant, with the Data Protection Officer |

## Sol Arch review

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 (`docs/sa-001-architecture` at `e28d9bc`): §3, §4.2 Storage paths, Flow 1 points 2 and 4, §7, §8.2, §8.3, R-1, R-16. Also CS-4, 7, 12 and 14, and the REQ-012 review. Mock-up read: `receiptPDF` (`index.html` line 1049), the CDN-loaded `jspdf` 2.5.1 (line 367), and lines 1001 and 1080, which swap "₱" for "PHP ". Greenfield: no application code yet.

**Verdict: Supports Option A, with changes.** Option A costs about one day more than B. It gives a file that never changes, and story 19 (R2) needs it on the server anyway. The changes:
- Receipt numbering moves out of editable settings.
- The "VOID" version becomes a second file instead of overwriting the original.
- Homeowners never read `receipts` directly.
- The sale rule uses the server's submission time.

**D5 does not block the build. It blocks go-live of receipts.**

#### Options

| Option | Feasible? | BA's cost | Sol Arch |
|---|---|---|---|
| A: server makes the PDF once | Yes | M | **Agree, 2.5–3.5 days.** |
| B: browser makes it from the stored record | Yes | Cheap | Agree, 1.5–2 days. Its file depends on the app version, and story 19 redoes it on the server. |
| C: BIR-registered e-invoicing | Unknown | Project | **Agree: a project**, with an outside provider and lead time. Only if the accountant's answer to D5 requires it. |

#### Answers to the BA's points

1. **Cost and library.** Use `pdf-lib` (MIT licence, plain JavaScript, runs in both Node and the browser) with `@pdf-lib/fontkit`, pinned to exact versions and bundled from npm (CS-7).
   - **Fonts:** the 14 standard PDF fonts use WinAnsi encoding, which has no ₱ (U+20B1). That is why the mock-up prints "PHP ". **Embed a subset of an open-licence font** (for example Noto Sans, SIL Open Font Licence) bundled with the function. Dev confirms the chosen font file has U+20B1, with a unit test that renders "₱1,800.00" and reads the text back.
   - **One PDF stack:** use the same library and a shared layout module (`shared/pdf/`) for REQ-009's statement, so there is one PDF stack, not two. I recommend an ADR (follow-up).
   - **Running cost:** one function run per receipt (about 700 a month). Files are probably 30–60 KB with a font subset (an estimate, to measure), so under about 50 MB of Storage a month. Negligible. The Storage free allowance depends on the bucket's region (SA-001 §7).
2. **`pdfStatus` and retry.**
   - **Trigger:** `onDocumentCreated(receipts/{orNo})`, with retry turned on.
   - **Same file every time:** the render must give the same output on every run. Set the PDF's creation and modification dates to `issuedAt`, and use no "now" anywhere. A retry then rebuilds the same file.
   - **Order:** upload, then set `pdfPath` and `pdfStatus: ready`.
   - **Failure:** on the final failure, set `failed` and write the structured log `receipt.pdf_failed` (with `orNo` only). An alert policy fires on it (§8.3).
   - **Sweep job:** an hourly job re-renders receipts stuck in `preparing` for over 15 minutes, or in `failed` (up to 5 tries). A lost trigger event then never leaves a receipt without a file.
   - **Screen updates:** copy `receiptPdfStatus` onto `payments/{id}`. Homeowners already listen to their payments, so "Preparing receipt…" turns into "Receipt PDF" with no extra listener and no read of `receipts`.
3. **Decision 5 in the download function: feasible.** `getReceiptUrl(orNo)` reads the receipt, then the payment, then `members/{hh}_{uid}`. It refuses unless the caller holds the treasurer role, or is a member whose `linkedAt` is on or before the payment's **`submittedAt`** (server time), or is the person who submitted it. Don't use the "date paid" the homeowner typed: it can be set to any date.

   **Consequence to accept:** a spouse or co-owner linked *after* the owner also loses the earlier receipts. An alternative for the owner and DPO is `households/{id}.ownerSince`, set by the office when it records a sale, so members see records from the last sale onward. That is kinder to families, but it needs a "Record a sale" action in REQ-003 or REQ-004 (+0.5–1 day). The same rule must drive REQ-010's payment list and REQ-015's recent payments.
4. **Download link: a callable with a 15-minute signed URL.** Storage rules deny all client reads of `receipts/`, and `getReceiptUrl` returns a V4 signed URL that lasts 15 minutes. **Don't use `getDownloadURL()`.** It makes a token URL that keeps working until the token is revoked: a permanent link that anyone holding it can use, which breaks both the 15-minute scenario and decision 5. Signing needs the functions' service account to be allowed to sign blobs (IAM `signBlob`). Dev to confirm in staging. A rules-based `getBlob()` read is the alternative, but it puts the sale logic into Storage rules, where it is harder to test and doesn't count towards coverage.
5. **Size: M confirmed, 2.5–3.5 days.**

   | Part | Days |
   |---|---|
   | Layout, font and amount in words | 1 |
   | Trigger, status, sweep job and alert | 0.5–1 |
   | `getReceiptUrl` and tests | 0.5–1 |
   | Screen states | 0.5 |

#### Required changes (BA to apply)

1. **Decision 3: the prefix and first number are not editable settings.** Store `{prefix, next, width, rangeEnd}` in `counters/or`, set **once** by a developer script on the treasurer's written instruction, the same way as `setRole` (REQ-002). Nothing then has to enforce "locked once the first receipt exists". Only the **title** stays in Settings. Data changes, "Receipt settings" row, changes accordingly.
2. **Add an optional `rangeEnd`.** If the BIR assigns a registered number range, `decidePayment` refuses to go past it, and the treasurer is warned when 95% of the range is used. Add the scenario: "Given the last number in the registered range is OR-05000 and OR-05000 is issued, When the next payment is approved, Then it is refused with 'Receipt numbers have run out. Ask the developer to add the next registered range.'"
3. **Decision 6:** print the name copied at **submission**, not at approval (REQ-012 review, change 4).
4. **"Receipt file" row:** keep the issued file. Store `receipts/{orNo}/issued.pdf`, and on a void add `receipts/{orNo}/void.pdf`, instead of remaking one file. Overwriting destroys the document that was actually issued. After a void, downloads serve the void version, and the treasurer can still get the original.
5. **"File status" row:** homeowners read the status from the payment (`receiptPdfStatus`), not from `receipts/{orNo}`. `receipts` becomes readable by staff and functions only, so the previous owner's name on a receipt can't be read straight from the database after a sale.
6. **Decision 5 wording:** "payments dated before the member's link date" becomes "payments **submitted** before the member's link date". Add the family consequence (point 3) to the decision, so the owner and DPO choose knowingly.
7. **Decision 2, add a branch:** if the accountant says the portal's document can't be the BIR document, the title becomes something like "Acknowledgement Receipt", with the line "This is not a BIR official receipt or invoice." The HOA then keeps issuing its paper BIR receipts, and the two number series must not overlap.
8. **Add optional `hoaTin` and `hoaAddress` settings**, printed only when set. That is cheap now, and it saves a code change after the accountant answers.

**BA, r3 and r5: how the changes were applied.** All eight changes are applied in the decisions, scenarios, Data changes, UX notes and copy; change 1 is decision 3 as the owner approved it, and change 3 is decision 6 as the owner decided it ("Sol Arch: at submission"). On change 6, Sol Arch's kinder alternative (`households.ownerSince`, members see records from the last sale onward, +0.5–1 day for a "Record a sale" action) is not what the owner approved (REQ-010 option (b) everywhere); it is recorded here only for the DPO conversation.

#### Risks not covered

- **R-1 / D5 is the top risk, and it is legal.** A configurable title does not cover every requirement the BIR might set. Requirements commonly mentioned for system-generated receipts include a registered serial range and registering the system itself with the BIR. **That is unverified here**, and it is exactly what to ask the accountant. **Go-live of receipts is gated on the written answer**, not the build.
- **Storage has no point-in-time recovery.** Firestore PITR and backups (§7) don't cover Storage. Because the render gives the same output every time from the stored snapshot, the files can be rebuilt. Keep a "rebuild receipt files" script and test it once in the restore drill.
- **PII.** The PDF holds the owner's name, the lot and the full reference number. The file name is the OR number only. Signed URLs are never logged (CS-14). A signed URL works for anyone who has it for 15 minutes, which is acceptable at this sensitivity.
- **Accessibility: Uncertain.** As far as I know, `pdf-lib` doesn't write tagged PDF, so screen readers follow the drawing order. Draw in the reading order the BA specified. If tagged PDF is required, that means a different library. Dev to check before the library choice is final.
- **Font licence.** Record the OFL licence in the PR (CS-7).
- **Retention.** "How long must receipts be kept" stays open (accountant and DPO). Nothing deletes receipts in R1.

**Risk checklist** (each item answered):

| Item | Answer |
|---|---|
| Repeat trigger | Renders give the same file every time. Downloads change nothing |
| Stale reference | Renders from the snapshot only |
| Deletes | None |
| Field written and never read | `receiptPdfStatus` is read by REQ-010 and REQ-015 screens |
| Schema and rules as a pair | Storage `receipts/` gets no client read or write, deployed before the screen |
| Shared helper | `shared/pdf` is shared with REQ-009. `money.toWords` gets unit tests up to the ₱100,000.00 limit |
| Copy | "Preparing receipt…" until the file is `ready` |
| Existing data | No receipts before go-live. A paper series continues via `counters/or` |
| Identity | OR number |
| Roles | Members per decision 5, and the treasurer. Enforced in `getReceiptUrl` |
| Environments | Separate buckets |
| Secrets and PII | As above |
| Network | The download error is covered |
| Scale and cost | As above |
| Dependencies | `pdf-lib`, `@pdf-lib/fontkit` and a font, all pinned and licence noted |
| Observability | Failed-render alert, sweep job |
