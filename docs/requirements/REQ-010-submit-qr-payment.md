# REQ-010: Submit a QR payment for approval

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-003 Payments and receipts](../epics/EPIC-003-payments-and-receipts.md) |
| Backlog story | [10 Submit a QR payment for approval](../backlog/BACKLOG.md#10-submit-a-qr-payment-for-approval) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted. Sol Arch reviewed: supports Option A with changes (applied in r4) |
| Mockup | Screens 10A–10E of the [REQ-005 to REQ-011 mockup](../mockups/req-005-011-mockup.html). Not yet published as an artifact: ready for the main session to publish |
| Architecture | SA-001 Flow 1 (`submitPayment`, `paymentRefs`, Storage `proofs/{householdId}/{paymentId}.jpg`), §4.3 point 5 ("submitted for checking", not "paid"), R-16 (sale privacy), CODING-STANDARDS rules 5 and 12; Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-007 (QR and payee), REQ-009 (statement and payment list), REQ-011 (notifications), REQ-006 (activity log) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft. r2, 2026-11-28: reconciled with REQ-031 (conflict C2): every payment carries a `kind` (always `dues` in R1) so REQ-031 can add amenity-fee payments without changing this flow; REQ-031 owns that extension · r3, 2026-11-28: Sol Arch review recorded · r4, 2026-11-28: Sol Arch's changes applied (`payments` / `paymentPrivate` split, Storage `uploaderUid` metadata, `paymentRefs` without status and deleted on rejection, client-made payment id with retry returning success, no dated duplicate message across households, server validation, `qrUploadId`, notification ids, HEIC fallback, orphan clean-up, inactive lot refused) · r5, 2026-11-28: owner approval recorded; recommendations accepted · r6, 2026-11-28: screenshots readable by the uploader and treasurer-role holders only, not all staff, to match approved REQ-012 #6 (raised by the S3 BA) · r7, 2026-11-28: `paymentPrivate` gains `receivedFromName`, the owner on file copied at submission, for the receipt's "Received from" (owner: "Sol Arch: at submission", REQ-013 decision 6) · **r8, 2026-11-28: answers TC-10 gaps G-1 to G-14** (see [r8 gap answers](#r8-gap-answers-tc-10)), and the S3 BA's requests (GAP-ANSWERS-TC-12-17): rejection reason moves from `paymentPrivate` to `payments/{id}`; `updatedAt` added; "a removed owner keeps own screenshots" dropped and the submitter's reads need a current membership (TC-04-L5). **New owner decisions 7 (pre-join data in the SDK, from TC-09 G-16) and 8 (no submitter detail screen), ** New scenarios tagged `@r8-new` · r9, 2026-11-28: owner approved decisions 7 (DPO still to confirm) and 8 as recommended ("Approve all") · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Decision 3 is **option (b), with the DPO to confirm**; decision 5 is the ₱100,000.00 cap. **Before build:** the treasurer must say whether e-wallet and bank reference numbers repeat across providers (Sol Arch change 6), because the answer changes the reference key. That and the DPO's confirmation stay under Open questions.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (amount, reference number, date paid and screenshot, all required), B (screenshot optional) or C (screenshot only; the treasurer types the reference) | **A** |
| 2 | A reference number already used: refuse it while it belongs to a payment that is pending or approved; allow it again once that payment is rejected | **Yes.** A rejected payment frees its reference number (REQ-012 does the freeing), so a homeowner who typed the wrong amount can resubmit |
| 3 | **Privacy after a sale (REQ-004 decision 5, SA-001 R-16).** Bills and balance stay with the lot. What may a new owner see of payments made before they were linked? (a) everything; (b) payments before their link date show date, amount and status only, and screenshots are visible only to the person who uploaded them and to treasurer-role holders (r6, to match approved REQ-012 #6); (c) nothing from before their link date, only the balance | **(b)**, with the DPO's agreement. The balance stays complete and correct, the previous owner's screenshots (which can show their e-wallet name and number) and receipts stay private |
| 4 | Let a homeowner withdraw their own pending payment (for example a wrong amount) | **Not in R1.** The treasurer rejects it with the reason "Submitted by mistake", and the reference number is freed (decision 2). Revisit if it happens often |
| 5 | Largest amount accepted in one payment | **₱100,000.00**, to catch typing errors (about 55 months of dues). Stored as `config/payment.maxPaymentCentavos`; a treasurer setting for it can come later if needed |
| 6 | Amenity fees through this flow (r2, conflict C2 with REQ-031) | **Designed for, not built here.** Every payment record carries a `kind`; in R1 it is always `dues` and `submitPayment` refuses anything else. **REQ-031 (R3) owns the amenity-fee extension**: the "Pay fee" entry point, kind `amenityFee` with a booking id and fixed amount, and the matching changes to approval (REQ-012) and collections (REQ-023). The reference-number check, screenshot, notifications and `paymentRefs` here are shared by both kinds unchanged, so one reference number can't be used for dues and a fee |
| 7 | **(r8, TC-09 G-16)** Option (b) hides a previous owner's payment details **on screen**, but the household-visible summary still holds `refLast4`, `submittedBy` (a uid) and `reason` for every payment, so a new owner could read them through the SDK. Accept, or move them? | **Approved: accept** (owner, "Approve all", 2026-11-28, relayed by the coordinator). *Note: DPO to confirm.* The last 4 digits of a reference can't move or claim money (`paymentRefs` checks the full number, and only for the same household is anything dated); a uid names nobody to a homeowner (they can't read `users`); reasons are standard phrases or a short text the treasurer is warned about ("Don't include other people's names or account numbers"). Moving them to `paymentPrivate` would hide the reference ending and the reason from the spouse, which REQ-010 and REQ-012 show on purpose, or need one copy per member (a project). |
| 8 | **(r8, TC-10 G-3)** The REQ said the submitter sees the full reference number and their screenshot, but no homeowner screen shows them. Add one, or drop the promise? | **Approved: drop it for R1** (owner, "Approve all", 2026-11-28, relayed by the coordinator). The person who paid already has the screenshot and the number in their own e-wallet; the treasurer's screen has both. Rows show "ref …{last 4}". Alternative: a "Details" link on the submitter's own rows with the full number and "View screenshot", about 0.5 day plus a mockup screen, not chosen. |

## Problem

Homeowners pay dues by scanning the HOA's QR Ph code in their e-wallet or bank app, outside the portal. The treasurer then has to match each payment to the collection account. Today that proof arrives by chat, in person or not at all (Treasurer persona). In the mock-up, the payment form has no "Saving…" guard and accepts a reference number already used, so the treasurer could approve the same money twice (backlog review finding 3).

**The portal cannot confirm money arrived.** There is no bank or e-wallet connection (SA-001 §5, A-2). A submission is a claim, checked by the treasurer against the account statement; the screenshot alone is never proof (EPIC-003 risk). Every word on screen must say "submitted for checking", never "paid" (SA-001 §4.3 point 5).

Who has the problem: the [Homeowner](../product/PERSONAS.md#homeowner), on a phone, once a month, often right after paying in another app; the [Treasurer](../product/PERSONAS.md#treasurer), who matches payments in batches.

## Options

### Option A: Amount, reference number, date paid and screenshot, all required (recommended)

- **How it works:** under the QR on Dues & Payments: amount (filled with what's due), reference number, date paid (today by default), screenshot, then "Submit for approval". The payment shows at once in the payment list as "Pending approval".
- **Where it lives:** Dues & Payments → Pay with QR (homeowner).
- **Cost:** moderate: upload with compression and retry, the duplicate-reference check on the server, two guards against double submits.
- **Honest downside:** four fields on a phone; the screenshot means switching apps to pick an image.

### Option B: Screenshot optional

- **How it works:** the same, but the screenshot can be skipped.
- **Cost:** the same.
- **Honest downside:** when a reference number is mistyped the treasurer has nothing to check against, and has to message the homeowner. Fewer screenshots stored is a privacy gain.

### Option C: Screenshot only; the treasurer types the reference

- **Cost:** the same build.
- **Honest downside:** moves typing from 623 homeowners to one volunteer treasurer, and the duplicate check happens only at approval, after the fact.

### Recommendation

**Option A.** The screenshot is what the treasurer falls back on when a reference number doesn't match, and homeowners already take one. The reference number is checked for duplicates at the moment of submission, which is when a mistake is cheapest to fix.

## Story

As a homeowner, I want to send the amount, reference number and screenshot after I pay by QR, so that the treasurer can match it to the collection account and my balance is updated.

## Acceptance criteria (Option A)

```gherkin
Feature: Submitting a payment

  Background:
    Given Carlo is linked to Blk 5 Lot 1, which owes ₱1,800.00
    And the HOA's QR code is set up (REQ-007)
    And today is Dec 3, 2026 in Manila

  Scenario: Submit a payment
    When Carlo opens Dues & Payments
    Then "Amount" is filled with "1,800.00" and "Date paid" with Dec 3, 2026
    When he enters reference "4012 8832 1955 4", attaches the screenshot and presses "Submit for approval"
    Then he sees "Payment submitted for checking. We'll notify you when the treasurer has checked it."
    And his payment list shows "Dec 3, 2026 · ₱1,800.00 · ref …9554 · Pending approval"
    And his balance still reads ₱1,800.00, with "₱1,800.00 awaiting approval" (REQ-009)
    And each treasurer gets the notification "Blk 5 Lot 1 submitted a payment of ₱1,800.00."
    And the payment, its reference reservation and the treasurers' notifications are saved together, or none of them is
    And the payment is listed the next time a treasurer opens Approvals (whether the Approvals badge updates live is REQ-012's; each treasurer's bell updates live, REQ-011)
    And the owner on file for Blk 5 Lot 1 at this moment is saved with the payment as the name its receipt will show (REQ-013)

  Scenario: Pressing twice creates one payment
    When Carlo presses "Submit for approval" twice quickly
    Then exactly one payment is created
    And the button reads "Saving…" and is disabled until the save finishes

  Scenario: A reference number already submitted and approved for the same lot
    Given reference "4012883219554" belongs to an approved Blk 5 Lot 1 payment submitted on Nov 25, 2026
    When Carlo submits "4012 8832 1955 4" again
    Then he sees "This reference number was already submitted on Nov 25, 2026. Check the number on your screenshot."
    And nothing is saved
    And the amount, date and screenshot he entered are kept

  Scenario: A reference number waiting for approval for the same lot
    Given reference "4012883219554" belongs to a Blk 5 Lot 1 payment pending approval, submitted on Dec 2, 2026
    When another member of Blk 5 Lot 1 submits it again
    Then they see "This reference number was already submitted on Dec 2, 2026 and is waiting for the treasurer. You don't need to send it again."
    And nothing is saved

  Scenario: A reference number used by another lot reveals nothing about it
    Given reference "4012883219554" belongs to a payment for Blk 9 Lot 3
    When Carlo submits "4012883219554" for Blk 5 Lot 1
    Then he sees "This reference number was already used. Check the number on your screenshot, or contact the treasurer."
    And the message shows no date, lot or status
    And nothing is saved

  Scenario: Two people submit the same reference at the same moment
    When two household members submit "4012883219554" at the same time
    Then exactly one payment is created
    And the other sees the "already submitted" message

  Scenario: A rejected payment's reference can be used again
    Given reference "4012883219554" belongs to a payment the treasurer rejected
    When Carlo submits it again with the right amount
    Then a new payment is created as "Pending approval"

  Scenario: Spaces and dashes in the reference don't matter
    Given "4012883219554" was already submitted
    When anyone submits "4012-8832-1955-4"
    Then it is treated as the same reference and refused

  Scenario: A missing screenshot keeps what was typed
    When Carlo presses "Submit for approval" without a screenshot
    Then "Attach the screenshot of your payment confirmation" shows under that field
    And the amount, reference and date he entered are still there

  Scenario: An unusable file
    When Carlo attaches a PDF, or an image larger than 15 MB
    Then he sees "Attach a photo or screenshot (JPG or PNG)." or "That image is too large. Take a screenshot instead of a photo."
    And nothing is uploaded

  Scenario: Invalid amounts
    When Carlo enters "0", leaves the amount empty, or enters "1800.555"
    Then he sees "Enter the amount you paid, more than ₱0, with at most 2 decimal places"
    When he enters "180000"
    Then he sees "That's more than ₱100,000.00. Check the amount, or pay at the admin office."
    And the submit function refuses the same amounts if sent directly

  Scenario: Paying more than is owed
    When Carlo enters ₱3,600.00 while he owes ₱1,800.00
    Then he sees the hint "That's ₱1,800.00 more than you owe. Once approved, the extra is kept as credit for your next bills."
    And he can still submit

  Scenario: Nothing is owed
    Given Blk 5 Lot 1's balance is ₱0.00
    When Carlo opens Dues & Payments
    Then "Amount" is filled with the monthly dues, ₱1,800.00
    And the form reads "You don't owe anything right now. You can still pay ahead."

  Scenario: A date in the future or too far back
    When Carlo picks Dec 4, 2026 as "Date paid"
    Then he sees "The date paid can't be in the future."
    When he picks a date more than 90 days ago
    Then he sees "For payments older than 90 days, contact the treasurer."
    And the submit function refuses the same dates, worked out in Manila time

  Scenario: Reference number format
    When Carlo enters a reference with fewer than 6 or more than 40 characters, or with characters other than letters, numbers, spaces and dashes
    Then he sees "Enter the reference number exactly as it appears on your confirmation (at least 6 characters)."
    And the submit function refuses the same

  Scenario: An image type the phone can't read
    Given Carlo attaches an image his browser can't decode (for example HEIC on a desktop browser)
    Then he sees "We can't read this image type. Take a screenshot of your confirmation and attach that."
    And nothing is uploaded

  Scenario: The connection drops while sending
    Given Carlo's upload stops because the phone went offline
    Then he sees "You're offline. Your details are kept. Press Submit again when you're back online."
    And no payment is created
    When he presses "Submit for approval" again online
    Then exactly one payment is created

  Scenario: The payment was saved but the reply was lost
    Given Carlo's payment was saved but his phone lost the reply
    When Carlo presses "Submit for approval" again
    Then he sees "Payment submitted for checking. We'll notify you when the treasurer has checked it."
    And exactly one payment exists, not an "already submitted" message

  Scenario: A lot that is no longer active
    Given Blk 5 Lot 1 was deactivated after Carlo opened the form
    When he presses "Submit for approval"
    Then he sees "This lot is no longer active. Contact the admin office."
    And nothing is saved

  Scenario: The QR code isn't set up
    Given no QR code has been uploaded (REQ-007)
    Then the form is not shown
    And Dues & Payments reads "Online payment isn't set up yet. Pay at the admin office for now."

  Scenario: Only members of the household can submit for it
    Given Maria Santos is linked only to Blk 1 Lot 3
    Then the submit function refuses a payment from her account for Blk 5 Lot 1
    And Storage refuses her upload to Blk 5 Lot 1's proof folder

  Scenario: Staff can't submit a payment through the homeowner form
    Given Carmela Cruz holds the treasurer role and is not a member of Blk 5 Lot 1
    Then the submit function refuses a payment from her account for Blk 5 Lot 1

  Scenario: Every payment from this form is a dues payment (decision 6)
    When Carlo's payment is created
    Then the treasurer's Approvals shows it applied to dues, oldest bill first (REQ-012)
    And a request to the submit function for any other kind of payment is refused in R1

  Scenario: A submission is logged
    When Carlo's payment is created
    Then the activity log records "Blk 5 Lot 1 submitted ₱1,800.00 (ref ending 9554)"

  Scenario: The payment records which QR code was shown
    Given the payment QR code was replaced on Dec 2, 2026
    And Carlo's form was opened before the replacement
    When his payment is created
    Then the payment records the QR code he was shown
    And the treasurer's Approvals (REQ-012) shows "Paid using the QR code replaced on Dec 2, 2026"

Feature: Payments after a sale (decision 3, option b)

  Scenario: A new owner sees the lot's balance but not the previous owner's payment details
    Given Ana Reyes was removed from Blk 2 Lot 7 on Dec 10, 2026 and Ben Torres was linked on Dec 12, 2026
    And Ana submitted a ₱1,800.00 payment on Nov 25, 2026 that was approved
    When Ben opens Dues & Payments
    Then the statement and balance include Ana's payment
    And the payment list shows "Nov 25, 2026 · ₱1,800.00 · Approved · Made before you joined"
    And it shows no reference number, screenshot or receipt for it
    And Storage refuses Ben's request for Ana's screenshot

  Scenario: Screenshots are seen only by the uploader and the treasurer
    Given Ben and his spouse are both linked to Blk 2 Lot 7
    And Ben submitted a payment with a screenshot
    Then Storage allows Ben's read while he is linked, and the read of anyone holding the treasurer role, and the treasurer's Approvals shows it (no R1 homeowner screen shows it, r8 and decision 8)
    And his spouse sees the payment's date, amount, "ref …{last 4}" and status, but not the screenshot
    And Storage refuses the spouse's request for the screenshot

  Scenario: Other staff can't open a screenshot
    Given Paolo Aquino holds the admin office role
    When he opens Ben's payment
    Then he sees no screenshot
    And Storage refuses his request for it
```

### New in r8: answers to TC-10 gaps

```gherkin
Feature: Submitting a payment (r8 answers to TC-10 gaps)

  Background:
    Given Carlo is linked to Blk 5 Lot 1, which owes ₱1,800.00
    And the HOA's QR code is set up (REQ-007)
    And today is Dec 3, 2026 in Manila

  @r8-new
  Scenario: A voided payment's reference stays used (G-1)
    Given reference "4012883219554" belongs to a Blk 5 Lot 1 payment submitted on Nov 25, 2026 and later voided
    When Carlo submits it again
    Then he sees "This reference number was already submitted on Nov 25, 2026. Check the number on your screenshot."
    And from another lot the undated "already used" message shows

  @r8-new
  Scenario: A reservation whose payment is missing (G-2)
    Given "4012883219554" is reserved but the payment it points to doesn't exist
    When anyone submits it
    Then they see "This reference number was already used. Check the number on your screenshot, or contact the treasurer."
    And nothing is saved and the reservation is not changed
    And the developer's error monitoring records the payment id and reference ending only

  @r8-new
  Scenario: Everything owed is already awaiting approval (G-4)
    Given Blk 5 Lot 1 owes ₱1,800.00 and ₱1,800.00 is awaiting approval
    When Carlo opens Dues & Payments
    Then "Amount" is empty
    And the form reads "₱1,800.00 is already awaiting approval. You don't need to pay it again."
    And "You don't owe anything right now" is not shown

  @r8-new
  Scenario Outline: Limits are exact (G-6, G-8, G-9)
    When Carlo <does>
    Then <outcome>

    Examples:
      | does                                                        | outcome                                                  |
      | attaches an image of exactly 15,728,640 bytes (15 MB)       | it is accepted and compressed                            |
      | attaches an image of 15,728,641 bytes                       | he sees "That image is too large. Take a screenshot instead of a photo." |
      | picks a date paid exactly 90 days before today              | it is accepted                                           |
      | picks a date paid 91 days before today                      | he sees "For payments older than 90 days, contact the treasurer." |
      | enters "40-12 88" (6 characters once spaces and dashes go)  | it is accepted                                           |
      | enters "40 12 8" (5 characters once spaces go)              | he sees the reference format message                     |

  @r8-new
  Scenario Outline: How a typed amount is read (G-7)
    When Carlo types "<typed>" in "Amount"
    Then <outcome>

    Examples:
      | typed     | outcome                         |
      | 1,800.00  | it is read as ₱1,800.00         |
      | ₱1,800    | it is read as ₱1,800.00         |
      |  1800     | it is read as ₱1,800.00         |
      | 1,80,0    | he sees the amount message      |

  @r8-new
  Scenario: Typing survives the phone unloading the tab (G-10)
    Given Carlo typed the amount, reference and date and attached a screenshot
    And his phone unloaded the portal while he was in his e-wallet app
    When he returns and the page reloads
    Then the amount, reference and date are filled in again
    And under "Proof of payment" he sees "We kept what you typed. Attach the screenshot again."
    And after a successful submit, or when he closes the tab, nothing typed is kept

  @r8-new
  Scenario: Removed from the lot after opening the form (G-11)
    Given the admin removed Carlo from Blk 5 Lot 1 after he opened the form
    When he presses "Submit for approval"
    Then he sees "You're no longer linked to this lot, so this payment wasn't submitted. Contact the admin office."
    And nothing is saved

  @r8-new
  Scenario: The QR code setup disappeared after the form opened (G-12)
    Given the payment QR configuration is missing when Carlo presses "Submit for approval"
    Then he sees "Online payment isn't set up right now. Nothing was saved. Pay at the admin office, or try again later."
    And nothing is saved

  @r8-new
  Scenario: A treasurer paying for her own lot isn't told about her own payment (G-13)
    Given Carmela holds the treasurer role and is linked to Blk 6 Lot 2, and Liza is the other treasurer
    When Carmela submits a payment for Blk 6 Lot 2
    Then Liza gets "Blk 6 Lot 2 submitted a payment of ₱1,800.00."
    And Carmela gets no such notification

  @r8-new
  Scenario: A removed person can't read their old screenshots (G-14, TC-04-L5)
    Given Ana submitted a payment for Blk 2 Lot 7 and was then removed from it
    Then Storage refuses her read of that screenshot
    And Firestore refuses her read of that payment's details
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Payment summary: `householdId`, **`kind`** (`dues`), `amountCentavos`, `refLast4`, `datePaid`, `status` (`pending`), `submittedAt` (server), `submittedBy` (uid only), `orNo` (once approved, REQ-012), **(r8)** `reason` (rejection or void reason, written by `decidePayment` / the void function, REQ-012 and REQ-014: household-visible, as every member is already notified of it), **(r8)** `updatedAt` (server time, set by every function that writes the payment, so REQ-012 can refuse a stale decision) | `payments/{id}`. **The id is made by the browser** before uploading, because the screenshot path needs it | Created only by `submitPayment`, create-only: a retry with the same id by the same person returns the existing payment as success. Status always `pending`; kind checked against an allow-list (`['dues']` in R1; REQ-031 adds `amenityFee`) | `submitPayment` | Every member of the household; treasurer; admin office |
| Payment details: reference as typed and normalised, `proofPath`, `qrUploadId` (which QR the payer was shown, REQ-007), **`receivedFromName`** (a copy of `households/{id}.displayName`, the owner on file, taken by `submitPayment` at submission and printed as "Received from" on the receipt, REQ-013 decision 6). ~~rejection reason (REQ-012)~~ **(r8)** the rejection reason moves to `payments/{id}` (see the summary row) | `paymentPrivate/{id}` | **Readable only by the submitter (`submittedBy == request.auth.uid`) and staff.** **(r8, TC-04-L5, S3 BA TC-13 G-8)** The submitter's read also requires a **current** membership of the payment's household (`exists(members/{householdId}_{uid})`), so a removed person loses it. Board doesn't read it in R1. No client writes | `submitPayment`, `decidePayment` | The submitter; treasurer; admin office |
| Reference reservation | `paymentRefs/{normalisedRef}` `{paymentId, householdId}`, **no status** | Read in the submit transaction; if it exists, the payment it points to decides the message (dated only when it is the same household). Deleted by `decidePayment(reject)` (REQ-012) in the same transaction, only if it still points at that payment. **A void (REQ-014) does not free it.** One shared index for dues and amenity fees | `submitPayment`, `decidePayment` | Functions only |
| Screenshot | Storage `proofs/{householdId}/{paymentId}.jpg` | Storage rules: **create only** (no overwrite, no delete) when the caller is a member of the household, `contentType == 'image/jpeg'`, size ≤ 5 MB after compression on the phone (1,000 px), and `metadata.uploaderUid == request.auth.uid`. Read if `resource.metadata.uploaderUid == request.auth.uid` **and (r8) the caller is still a member of `{householdId}`** (`firestore.exists` on `members/{householdId}_{uid}`, TC-04-L5), or for the treasurer role (`firestore.get` on `staff/{uid}`, role `treasurer`). Admin office, board and guards are refused | The homeowner | The uploader and treasurer-role holders (decision 3; REQ-012 #6) |
| Orphaned screenshots | Storage `proofs/` | Deleted on the submit refusal path (best effort), and by a daily job for any object older than 24 hours with no `payments/{id}` | `submitPayment`, daily job | — |
| Pending total on the household | `households/{id}.pendingCentavos` | — | `submitPayment`, `decidePayment` | Statement note (REQ-009) |
| Notifications | `notifications` (REQ-011), id `paysub_{paymentId}_{uid}` | One per treasurer, written by `submitPayment` **in the same transaction** as the payment, so exactly once | `submitPayment` | Treasurers |
| Change record | `auditLog` (shared helper, REQ-006) | `payment.submitted`, with amount and the reference's last 4 digits | `submitPayment` | Treasurer, board, admin office |
| Payment limit | `config/payment.maxPaymentCentavos` (REQ-007) | ₱100,000.00 (decision 5) | Developer script | `submitPayment`, form |

**Server validation (mirrors the screen):** amount an integer number of centavos, > 0 and ≤ the limit; `datePaid` no later than today and no more than 90 days back, Asia/Manila; reference 6–40 characters, **length checked before any pattern**, then `[A-Z0-9]` after normalising; the caller is still a member and the household is active, re-checked in the transaction.

**r8 rules (TC-10 gaps):**

- **G-1 Void:** a reservation whose payment is void gives the same dated "approved" message for the same household (REQ-014 decision 3), undated for another.
- **G-2 Missing payment:** never repaired automatically: refused with the undated message, reported to error monitoring (ids and reference ending only). Payments are never deleted (CS-15), so this only follows a manual edit, which the developer investigates.
- **G-4 Pre-fill:** amount = balance − awaiting approval, if above ₱0.00; if that is ₱0.00 but the balance isn't, empty with the "already awaiting" line; if the balance is ₱0.00 or credit, the monthly dues with "You don't owe anything right now…" (as approved).
- **G-6 Size:** "15 MB" is 15,728,640 bytes (15 × 1024 × 1024), inclusive, checked on the phone before compression; the uploaded file stays ≤ 5 MB (5,242,880 bytes) in the Storage rule.
- **G-7 Amount:** REQ-007's shared `parsePesos()` (commas as thousands separators, "₱" and spaces removed), the same on the server.
- **G-8 Date:** accepted from today − 90 days to today, both inclusive, Manila dates.
- **G-9 Reference:** the field takes at most 60 typed characters; the 6–40 limit counts the **normalised** reference (spaces and dashes removed, upper case), on the screen and the server alike.
- **G-10 Kept typing:** amount, reference and date are kept in `sessionStorage` (this tab only), as REQ-012 keeps a reason; cleared on success, on leaving Dues & Payments, and when the tab closes. A file can't be kept, so the screenshot is asked for again.
- **G-11 Removed member:** `submitPayment`'s membership re-check refuses with its own message.
- **G-12 No QR:** `submitPayment` refuses when `config/payment.qrUploadId` is missing.
- **G-13 Own payment:** the treasurer notifications skip the submitter (`notify()` excludes `submittedBy`). If she is the only treasurer, REQ-012 decision 7 applies.
- **G-14 Removed person's screenshots:** no route and, from r8, no access (TC-04-L5).

**Normalising a reference:** upper case, spaces and dashes removed. **Changed from SA-001 Flow 1:** the payment is split into `payments` and `paymentPrivate` (decision 3 (b)); `paymentRefs` has no status and is deleted when a payment is rejected (decision 2). **Logs** carry the payment id and `refLast4` only, never the full reference or proof path (CS-14). **Pending:** if reference numbers repeat across providers (Open questions), the key becomes `{provider}_{ref}` and the form gains a provider field.

## UX/UI notes

- **Accessibility:** each field has a visible label (placeholder is only an example); "Reference number" uses `inputmode="text"` because some banks use letters; "Amount" uses `inputmode="decimal"`; the file field is a large labelled button ("Attach screenshot") with the chosen file's name and a thumbnail shown after; errors are under each field and announced; tap targets 44 × 44 px.
- **Consistency:** "Reference number", "Proof of payment", "Pending approval", "Submit for approval" (glossary). The toast and list never say "paid" or "received".
- **Mobile-first:** single column at 375 px; the QR and payee name first, then the three steps, then the form; "Submit for approval" full-width at the bottom. The QR image can be saved with a long press so the homeowner can scan it from their gallery in the e-wallet app when paying from the same phone (mock-up instruction to keep).
- **States:** QR not set up (form hidden, message); ready; uploading ("Uploading screenshot… 60%"); saving; success (toast + list row); offline (message, typing kept); duplicate (message under the reference field; dated only for the same lot); unreadable image type (message, nothing uploaded); lot no longer active (message); error ("We couldn't submit your payment. Nothing was saved. Try again.").
- **Forms:** amount pre-filled with what's due, never more than the balance minus what's awaiting approval (or the monthly dues if nothing is owed); date defaults to today; inline validation on blur; all typing and the chosen screenshot kept after any error.
- **Safe actions:** three guards: "Submit for approval" disabled while in flight; the payment id is made once by the browser and created create-only, so a retry returns the same payment; and the server refuses a second payment with the same reference (CODING-STANDARDS rule 5). Concurrency test: 10 parallel submits with one reference give one payment, plus a negative control.
- **Images:** the screenshot is re-encoded to JPEG on the phone. If the browser can't decode it (HEIC on some browsers), the person is asked for a screenshot; a raw image is never uploaded. QA tests a real iPhone (Safari and Chrome) and Android.
- **Stable layout:** the over-payment hint reserves its line so the button doesn't jump.
- **Roles:** household members submit; staff can't use this form (office payments are a separate, not-yet-written story).
- **Privacy:** reference numbers show as "…9554" in the homeowner's payment list; the full number is shown only to the submitter and staff; the screenshot is shown only to the uploader and treasurer-role holders, never to other household members or other staff (decision 3; REQ-012 #6). A duplicate-reference message never reveals another lot's payment date. ~~A removed owner keeps access to their own screenshots (DPO to confirm).~~ **(r8)** A removed person loses access to their own screenshots and payment details, as to everything else of the lot (approved TC-04-L5; S3 BA, TC-13 G-8). **(r8, TC-10 G-3)** No R1 homeowner screen shows the full reference or the screenshot: rows show "ref …{last 4}" for everyone, and the full number and screenshot appear on the treasurer's screens; the submitter's rule access exists for decision 8.

## Copy of record

| Where | Text |
|---|---|
| Card heading | Pay with QR |
| QR label | SCAN TO PAY |
| Payee | Pay to · {payee name} · {account label} |
| Steps | 1. Scan the QR with your e-wallet or bank app. 2. Pay the amount shown. 3. Enter the reference number and attach the screenshot. |
| Fields | Amount (₱) · Reference number · Date paid · Proof of payment (screenshot) |
| Reference hint | Exactly as it appears on your confirmation, e.g. 4012 8832 1955 4 |
| Attach button | Attach screenshot (after: Change screenshot) |
| Button | Submit for approval (in flight: Saving…; uploading: Uploading screenshot… {n}%) |
| Success toast | Payment submitted for checking. We'll notify you when the treasurer has checked it. |
| List row | {date} · {amount} · ref …{last 4} · Pending approval |
| List row (before joining, decision 3) | {date} · {amount} · {status} · Made before you joined |
| Duplicate (approved) | This reference number was already submitted on {date}. Check the number on your screenshot. |
| Duplicate (pending) | This reference number was already submitted on {date} and is waiting for the treasurer. You don't need to send it again. |
| Duplicate (another lot) | This reference number was already used. Check the number on your screenshot, or contact the treasurer. |
| Unreadable image | We can't read this image type. Take a screenshot of your confirmation and attach that. |
| Lot inactive | This lot is no longer active. Contact the admin office. |
| Old QR (treasurer, REQ-012) | Paid using the QR code replaced on {date} |
| No screenshot | Attach the screenshot of your payment confirmation |
| Bad file | Attach a photo or screenshot (JPG or PNG). |
| File too large | That image is too large. Take a screenshot instead of a photo. |
| Amount error | Enter the amount you paid, more than ₱0, with at most 2 decimal places |
| Amount over limit | That's more than {limit}. Check the amount, or pay at the admin office. |
| Over-payment hint | That's {extra} more than you owe. Once approved, the extra is kept as credit for your next bills. |
| Nothing owed | You don't owe anything right now. You can still pay ahead. |
| Future date | The date paid can't be in the future. |
| Old date | For payments older than 90 days, contact the treasurer. |
| Reference format | Enter the reference number exactly as it appears on your confirmation (at least 6 characters). |
| Offline | You're offline. Your details are kept. Press Submit again when you're back online. |
| Error | We couldn't submit your payment. Nothing was saved. Try again. |
| No QR | Online payment isn't set up yet. Pay at the admin office for now. |
| Treasurer notification | {lot} submitted a payment of {amount}. |
| All awaiting approval **(r8, G-4)** | {amount} is already awaiting approval. You don't need to pay it again. |
| Typing restored **(r8, G-10)** | We kept what you typed. Attach the screenshot again. |
| No longer linked **(r8, G-11)** | You're no longer linked to this lot, so this payment wasn't submitted. Contact the admin office. |
| QR missing at submit **(r8, G-12)** | Online payment isn't set up right now. Nothing was saved. Pay at the admin office, or try again later. |

## r8 gap answers (TC-10)

Answers to QA's gaps in [TC-10](../test-cases/TC-10-submit-qr-payment-v1.md). One went to the owner (G-3, decision 8). Log: [GAP-ANSWERS-TC-05-11](../test-cases/GAP-ANSWERS-TC-05-11.md).

| Gap | Answer | Where |
|---|---|---|
| G-1 Void reference message | Same dated "approved" message for the same lot; undated for another | r8 rules; scenario G-1 |
| G-2 Reservation without a payment | Refused (undated), not repaired, reported | r8 rules; scenario G-2 |
| G-3 Where the submitter sees the full number and screenshot | **Owner decision 8, approved**: no R1 screen; promise dropped | Owner decisions; Privacy note |
| G-4 Pre-fill when all is awaiting | Empty, with "already awaiting approval"; no "don't owe" line | r8 rules; copy; scenario G-4 |
| G-5 Approvals badge live? | REQ-012's to say; this REQ now asserts only that Approvals lists it and the bell is live | Scenario "Submit a payment" (changed) |
| G-6 15 MB | 15,728,640 bytes, inclusive | r8 rules; outline G-6 |
| G-7 Comma, ₱, spaces | Accepted through the shared parser | r8 rules; outline G-7 |
| G-8 Exactly 90 days | Accepted; 91 refused | r8 rules; outline |
| G-9 Reference length | Counted after normalising; 60 typed characters at most | r8 rules; outline |
| G-10 Tab unloaded | Amount, reference, date restored from `sessionStorage`; screenshot asked again | r8 rules; copy; scenario G-10 |
| G-11 Removed after opening | Own message | Copy; scenario G-11 |
| G-12 QR config missing at submit | Refused with its own message | Copy; scenario G-12 |
| G-13 Treasurer submits for her own lot | Not notified of her own payment | r8 rules; scenario G-13 |
| G-14 Removed owner's screenshots | No route, and no access from r8 (TC-04-L5, S3 BA) | Data changes; scenario G-14 |

## Out of scope

- Approving or rejecting (REQ-012, story 12), receipts (story 13), voids (story 14).
- Withdrawing a pending payment (decision 4).
- Cash or cheque payments recorded by the office (EPIC-003 open question; needs its own story).
- Automatic confirmation from a bank or e-wallet (EPIC-003 out of scope).
- Choosing which period a payment is for; payments always apply oldest first (REQ-009).
- Paying amenity fees. REQ-031 (R3) owns that extension; this REQ only stores `kind: dues` so it can be added without reworking submit or approval (decision 6).

## Open questions

| Question | Who decides |
|---|---|
| Confirm decision 3 option (b) (P1), and decision 7 (r8) | DPO |
| How long are payment screenshots kept? (SA-001 Q10) | DPO with the treasurer |
| **Before build:** do e-wallet and bank reference numbers ever repeat across providers? If yes, the key becomes `{provider}_{ref}` and the form gains a provider field | Treasurer (from the collection account's statements) |
| For S3: receipts (REQ-013) carry the payer's name and need the same "before you joined" treatment; rejection deletes `paymentRefs`, a void doesn't (REQ-012, REQ-014) | S3 BA and Sol Arch |
| Do some households pay cash or cheque at the office? | Treasurer |

## Sol Arch review

Questions for Sol Arch (from the BA, r1):

1. Decision 3 option (b): how Storage rules restrict a screenshot to its uploader and staff (custom metadata with the uploader's uid, or a `firestore.get` on the payment), and how the payment list hides details of payments before the viewer's `linkedAt` (field-level hiding isn't possible in rules, so perhaps a separate staff-only `paymentDetails` document).
2. `paymentRefs` with a status so a rejected payment frees its reference, and the transaction in `decidePayment` that releases it.
3. Upload-then-callable: an orphaned screenshot when the callable fails or is refused. Delete it in the callable's refusal path, or a daily clean-up of proofs with no payment?
4. HEIC images from iPhones: does on-device compression to JPEG work in Safari and Chrome?
5. (r2, C2) A `kind` field on `payments` from R1 (`dues` only), so REQ-031's `amenityFee` is additive. SA-001 §4.2 doesn't list it yet: confirm or reject, and whether `paymentRefs` stays one shared index for both kinds.

**BA size estimate (Sol Arch to confirm):** M, about 3 person-days with Claude Code; +1 day for decision 3 option (b).

### Sol Arch findings (2026-11-28, draft)

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 Flow 1 (`submitPayment`, `paymentRefs`, `proofs/{householdId}/{paymentId}.jpg`), §4.2, §8.1 rules approach, R-16, CODING-STANDARDS CS-5 and CS-12; RELEASE-PLAN conflict C2 and decision P1. Baselines: `docs/sa-001-architecture` at `e28d9bc`, `docs/req-005-045` (uncommitted).

**Verdict: Supports Option A and decision 3 option (b), with changes.** Option (b) can't be done with field-level rules, so it needs the payment split into two documents. **C2 `kind`: confirmed.** The other changes:

- the client chooses the payment id, so a retry after a dropped connection is safe;
- `paymentRefs` is deleted on rejection rather than given a status;
- a duplicate-reference message must not reveal another household's payment date.

**Build is blocked only by P1 (decision 3) and the DPO**, as the header says.

#### Options

| Option | Feasible? | Cost (BA) | Sol Arch |
|---|---|---|---|
| A: amount, reference, date and screenshot, all required | Yes | Moderate | **Agree** |
| B: screenshot optional | Yes | Same | Agree. It is a privacy gain, but the treasurer loses the fallback |
| C: screenshot only | Yes | Same | Agree with the downside |
| Decision 3 (a) everything / (b) details hidden / (c) nothing before the link date | (a) yes; (b) yes, with a split document; (c) yes | — | **I support (b).** (c) hides the payments that explain the balance, which is a new enquiry for the office |

#### Answers to the BA's questions

1. **Option (b): split the payment, and use Storage metadata for the screenshot.**
   - `payments/{id}`: what any member of the household may read: `householdId`, `kind`, `amountCentavos`, `refLast4`, `datePaid`, `status`, `submittedAt`, `submittedBy` (uid only), `orNo` (once approved).
   - `paymentPrivate/{id}`: the full reference (as typed and normalised), `proofPath`, `qrUploadId` (which QR the payer saw, from the REQ-007 review) and the rejection reason. **Readable only by the submitter (`resource.data.submittedBy == request.auth.uid`) and staff.** Written only by functions.
   - "Made before you joined" is worked out on screen by comparing `submittedAt` with the viewer's `members.linkedAt`. The summary hides nothing a later owner may not see. **Receipts (REQ-013, S3)** need the same treatment: their PDF carries the payer's name. Flag this to the S3 review.
   - **Screenshot:** Storage rules allow **create only** (no overwrite, no delete) at `proofs/{householdId}/{paymentId}.jpg` when the caller is a member, `contentType == 'image/jpeg'`, size ≤ 5 MB, and `request.resource.metadata.uploaderUid == request.auth.uid`. Read is allowed if `resource.metadata.uploaderUid == request.auth.uid`, or for staff (`firestore.get` on `staff/{uid}`). No `firestore.get` on the payment is needed. Note that Ana keeps access to *her own* screenshot after she is removed from the lot. That is her own data; the DPO should confirm it is acceptable.
2. **`paymentRefs`: no status field. Delete the reservation on rejection.** `paymentRefs/{normalisedRef}` holds `{paymentId, householdId}`. `submitPayment` reads it in the transaction. If it exists, it reads the payment it points to, to choose the "approved" or "pending" message. That avoids a status copy that can disagree. `decidePayment(reject)` (REQ-012, S3) deletes it in the same transaction, **only if it still points at this payment**. A **void (REQ-014) does not free the reference**, because the money was real or the reference was misused. Flag both rules to the S3 review.
3. **Orphaned screenshots: both clean-ups.** Delete on the refusal path, best effort and inside `try` (CS-4). Also run a daily job that deletes any `proofs/` object older than 24 hours with no `payments/{id}`. That also covers a homeowner who uploads and then closes the app. Listing about 700 objects a month is trivial.
4. **HEIC: Uncertain, so design for failure.**
   - iOS Safari usually hands a file input JPEG when `accept="image/*"`, so the canvas re-encode works.
   - Desktop Chrome cannot decode HEIC into a canvas.
   - If `createImageBitmap` or image decode fails, show "We can't read this image type. Take a screenshot of your confirmation and attach that." The image is never uploaded raw.
   - QA tests on a real iPhone (Safari and Chrome) and on Android.
5. **C2 `kind`: confirmed, and `paymentRefs` stays one shared index for both kinds.** One reference number is one transfer of money, so it must not count as both dues and a fee. Two consequences to write down now:
   - `households.paidCentavos` counts `kind == dues` only. Amenity fees never reduce the dues balance (REQ-009 review).
   - `submitPayment` validates `kind` against an allow-list (`['dues']` in R1), so REQ-031 extends a list rather than rewriting the function.

#### Required changes (for the BA to apply)

> **BA note (r6):** screenshot reads narrowed from "uploader and staff" to "uploader and treasurer-role holders", to match approved REQ-012 #6 (raised by the S3 BA). This tightens Sol Arch's answer 1 rule (`staff/{uid}` with role `treasurer`, not any staff role); Sol Arch to confirm on the next pass.

> **BA note (r4):** all seven are applied above: 1, 2 and 7 in Data changes and the scenarios (saved together; reply lost); 3 as the "another lot" scenario and copy; 4 as server-validation lines in the amount, date and format scenarios; 5 as the QR scenario and copy; 6 by marking the provider question "before build" in Open questions and in the Owner decisions note. HEIC, orphan clean-up and the inactive-lot refusal from the answers and risks are added too. None conflicts with an approved decision. The S3 items (receipts, `paymentRefs` on reject and void) are listed for the S3 review, not edited here.

1. **Data changes:** split into `payments` (summary) and `paymentPrivate` (details) as in answer 1. `paymentRefs` has no status, and is deleted on rejection by REQ-012. Add `qrUploadId`. Move `maxPaymentCentavos` to `config/payment` (REQ-007 review). Remove "Sol Arch to confirm how Storage rules check uploader": it is the metadata rule above.
2. **The client makes the payment id, so a retry is safe.** The browser creates the id before uploading, because the screenshot's path needs it. `submitPayment` creates `payments/{id}` with a create-only write. On a retry with the same id by the same person, it **returns the existing payment as success** rather than the "already submitted" message. Add to scenario "The connection drops while sending": "Given the payment was saved but the phone lost the reply. When Carlo presses Submit again, he sees the success message and exactly one payment exists."
3. **A duplicate reference from another household must not reveal the date.** Today "This reference number was already submitted on Nov 25, 2026" tells anyone who types a guessed reference that it exists, and when it was paid. Keep the dated messages **only when the existing payment belongs to the same household**. Otherwise show: "This reference number was already used. Check the number on your screenshot, or contact the treasurer." Add this as a scenario.
4. **Server validation, mirroring the screen:**
   - amount is an integer number of centavos, > 0 and ≤ the limit;
   - `datePaid` is no later than today and no more than 90 days back (Asia/Manila);
   - the reference is 6–40 characters **with the length checked before any pattern** (S8786), using `[A-Z0-9]` after normalising.

   Add "And the submit function refuses the same" to the amount, date and format scenarios.
5. **Record which QR the payer saw (`qrUploadId`).** In the treasurer's Approvals (REQ-012), show "Paid using the QR code replaced on {date}" when it isn't the current one.
6. **The provider question (open questions) must be answered before build,** not just before release. If references repeat across e-wallets, the key becomes `{provider}_{ref}` and the form gains a provider field. That is a data-model change, cheap now and a migration later.
7. **Treasurer notification:** say "Each treasurer's notification is written by `submitPayment` in the same transaction", which makes it exactly-once with a deterministic id `paysub_{paymentId}_{uid}`.

#### Risks not covered

- **Privacy (RA 10173):** screenshots show the payer's e-wallet name and number. They are visible to the submitter and staff only (answer 1). Retention is still `NOT PROVIDED` (SA-001 Q10). Maps to proportionality and retention limitation; the requester and DPO must confirm.
- **Repeat-trigger safety:** in-flight flag, client-chosen id (create-only) and the reference reservation. That is three guards. Concurrency test: 10 parallel submits with the same reference give one payment; plus a negative control (CS-8).
- **Stale references:** the household is re-checked in the transaction (the caller is still a member; the household is active). A payment for a household that was deactivated is refused with "This lot is no longer active. Contact the admin office."
- **Roles and leakage:** staff cannot submit (the REQ already says so). The board doesn't read `paymentPrivate` in R1.
- **Offline, partial failure:** the upload succeeds but the callable fails. Covered by answer 3 and change 2.
- **Secrets and PII in logs:** log the payment id and `refLast4` only, never the full reference or the proof path (CS-14).
- **Scale and cost:** about 700 submissions a month at about 150 KB, which is about 100 MB a month of Storage (SA-001 §7). The Storage bucket region (free tier only in US regions) is already flagged in SA-001.
- **Observability:** alert on the rate of `submitPayment` errors, and on orphan clean-ups above a threshold (it would mean the callable is failing after uploads).

#### Size

**M+, 4–5 person-days with Claude Code (BA: 3 + 1 for option b).** That covers the form with compression, HEIC handling and retry; the callable with the reservation, the id idempotency and the household-scoped messages; the split document and Storage metadata rules with rules tests; the orphan job; the concurrency tests; and Playwright.

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**3.75–4.75 person-days with Claude Code** (was 4–5). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0.25 · 0.75–1 · 0 · 2–2.5 · 0.75–1
- **Reuses:** Port: "Pay with QR" form in `oDues()` 622–630, `qrBlock()` 605. Extend: compression, HEIC, retry, duplicate reference, saving and offline states (614–617). BE: callable, reservation, idempotency, rules, orphan job
