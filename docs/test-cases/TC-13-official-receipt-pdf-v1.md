# TC-13: Official receipt PDF (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature (server-made receipt PDF, kept once and served by a short-lived link; receipt series with an optional registered range; sale privacy on receipts) |
| Source | [REQ-013 Official receipt PDF](../requirements/REQ-013-official-receipt-pdf.md), **Approved** 2026-11-28 (r5), Option A; decision 3 in Sol Arch's version, decision 6 "at submission" |
| Depends on / precedent | [REQ-012 Approve or reject a payment](../requirements/REQ-012-approve-or-reject-a-payment.md) (receipt record, snapshot, `counters/or`, gap-free numbers), [REQ-010 Submit a QR payment](../requirements/REQ-010-submit-qr-payment.md) (decision 3 (b), `submittedAt`, `paymentPrivate.receivedFromName`), [REQ-009 Statement of account](../requirements/REQ-009-statement-of-account.md) (credit display, "Made before you joined", shared PDF stack), [REQ-007 Dues and payment settings](../requirements/REQ-007-dues-and-payment-settings.md) (HOA name, payee), [REQ-011 In-app notifications](../requirements/REQ-011-in-app-notifications.md) ("Receipt ready" catalogue row), [REQ-004](../requirements/REQ-004-invite-and-link.md) (`members.linkedAt`, removal), [REQ-002](../requirements/REQ-002-roles-and-permissions.md) (treasurer only; admin office not in payments in R1) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open: no viewport meta; the Dues & Payments receipt button must work at 375 px, see TC-13-J9). No defect is open in the receipt area (it has no code yet) |
| App version | **Anticipated.** No application code exists. The approved UX is screens 13A–13E of [req-012-017-mockup.html](../mockups/req-012-017-mockup.html). The mock-up's `receiptPDF` (`index.html` line 1049) draws live data and prints "PHP": it is **not** the expected behaviour |
| Source files / functions touched (anticipated) | `decidePayment` (receipt record, snapshot, `counters/or`, range check); receipt PDF trigger `onDocumentCreated(receipts/{orNo})` and the hourly sweep job; `getReceiptUrl(orNo)` callable; `shared/pdf/` layout module (shared with REQ-009's statement PDF); `money.toWords`; Firestore rules for `receipts`, `counters`, `payments`; Storage rules for `receipts/`; `config/settings` receipt title, `hoaTin`, `hoaAddress`; Dues & Payments payment row (shared with REQ-015), treasurer payment detail, Settings |
| Architecture | SA-001 r3 **Final** (§3, §4.2, §4.3 Flow 1 points 2 and 4, §8.2, R-1, R-16). The S3 follow-ups named in REQ-013's Sol Arch review (`getReceiptUrl`, `issued.pdf` / `void.pdf`, `receiptPdfStatus` on the payment, `pdfStatus`, the sweep job, `rangeEnd`) are **not yet written into SA-001**: cases asserting them are tagged **Provisional — SA-001 follow-up** |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions, Storage) or `hoa-portal-staging` only. Never production.** Signed URLs need the functions' service account to sign blobs (IAM `signBlob`): the 15-minute expiry cases run on staging (Staging note). Both brands (Greenfield Homes HOA, Gentri Heights HOA) |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. |

**Tags used on cases**

- **Provisional — SA-001 follow-up**: asserts a design detail from REQ-013's Sol Arch review that SA-001 does not carry yet.
- **Blocked — D5**: the board's accountant has not answered (decision 2); the build goes ahead, go-live waits. The case stays in the plan; QE must not automate its expected result until answered.
- **Gap G-n**: expected result depends on a requirement gap (listed at the end).
- **Staging note**: needs special set-up (controllable server clock, admin SDK or console access to read `receipts`, Storage or logs, two sessions at once, a developer script run, a forced render failure).

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Treasurer** (`treasurer`) | Approves (REQ-012), which creates the receipt. Downloads any receipt from the payment's detail. Changes the receipt **title**, TIN and address in Settings. Sees the 95% and "run out" messages |
| **Homeowner, member of the payment's household** | Downloads the receipt from Dues & Payments, subject to decision 5 (linked on or before the payment's `submittedAt`, or the submitter) |
| **Homeowner, member of another household** | Must be refused every receipt of this lot |
| **New owner after a sale** | Sees the lot's balance; payments submitted before their link date show date, amount and status only, no receipt |
| **Admin office staff** (`admin`) | No access in R1 (REQ-002 decision 3): no button, `getReceiptUrl` refuses |
| **Board** (`board`) | No access in R1 (payments are not on the board's R1 menu; "read-only, if the board role sees payments in R2") |
| **Guard** (`guard`) | No access |
| **Developer** (script, not a screen) | Sets the series `{prefix, next, width, rangeEnd}` in `counters/or` once, on the treasurer's written instruction |

### Test fixtures (invented; QE maps them to `.env`)

| Fixture | Lot | Owner on file | Members (account, linked) | Starting state |
|---|---|---|---|---|
| **HH-A** "ZZ Test Household A" | Blk 2 Lot 7 | ZZ Ana Reyes | U-ANA (owner, linked before any payment), U-CARLO (family, linked before any payment) | Owes October 2026, ₱1,800.00 |
| **HH-B** "ZZ Test Household B" | Blk 4 Lot 12 | ZZ Juan Dela Cruz | U-JUAN | Owes ₱1,800.00 |
| **HH-C** "ZZ Test Household C" | Blk 6 Lot 4 | ZZ Roberto Peña (the "ñ" is deliberate) | U-ROBERTO | Owes October and November 2026 |
| **HH-M** "ZZ Test Household M" | Blk 5 Lot 1 | ZZ Maria Santos | U-MARIA | Fully paid; the "other household" for leak checks |
| **HH-T** "ZZ Test Household T" | Blk 9 Lot 3 | ZZ Liza Santos | S-TREAS-HO | The treasurer's own household |

| Account | Who | Notes |
|---|---|---|
| U-ANA, U-CARLO, U-JUAN, U-ROBERTO, U-MARIA | zz.*@example.test | Homeowners as above |
| U-BEN | zz.newowner.a@example.test | Linked to HH-A **after** the sale (REQ-004 removal of U-ANA first) |
| U-ELLA | zz.family.a3@example.test | Linked to HH-A after U-BEN (the "spouse linked later" consequence) |
| U-STRANGER | zz.stranger1@example.test | Signed in, no household, no role |
| S-TREAS | ZZ Liza Santos, zz.treasurer@example.test | Treasurer, no household |
| S-TREAS-HO | zz.treasurer.ho@example.test | Treasurer and member of HH-T |
| S-TREAS-2 | ZZ Mark Treasurer, zz.treasurer2@example.test | Second treasurer, no household |
| S-ADMIN | ZZ Paolo Admin | `admin` |
| S-BOARD | ZZ Rosa Board | `board` |
| S-GUARD | zz.guard@example.test | `guard` |

Reference numbers are invented test values (for example "ZZ4012883219554" is not usable; use digit-only fixtures such as "9000000000001"). Screenshots are a generated placeholder image, never a real transfer. "Today" in every case is built from **local Manila today** in the test; the dates below (Nov 27–28, Dec 10, 2026) show the arithmetic only.

### Round-trip register

Treasurer approves → receipt and file are made → household and treasurer download it. One row per field or status value.

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | `receipts/{orNo}` record and snapshot (number, amount, date paid, date issued, received-from, lines applied, balance after, approved by, title, TIN, address) | `decidePayment`, by the treasurer pressing Approve | The PDF (homeowner and treasurer, through `getReceiptUrl`); staff and functions only read the record itself | A1–A12, C1 |
| 2 | Received-from name (`paymentPrivate.receivedFromName`, copied at **submission**) | `submitPayment` (REQ-010) copies `households.displayName`; `decidePayment` copies it into the receipt | PDF "Received from: {name} · {lot}" | A3, C6, C7 |
| 3 | `counters/or` `{prefix, next, width, rangeEnd}` | Developer script (on the treasurer's written instruction); `decidePayment` takes numbers | Receipt number on the PDF, file name, payment row "Approved · OR-nnnnn"; the treasurer's 95% and run-out messages | H1–H7, H12 |
| 4 | Receipt title (`config/settings`) | Treasurer, in Settings | PDF title on receipts issued **after** the change (through the snapshot); never on earlier receipts | A17, A18, H10 |
| 5 | `hoaTin`, `hoaAddress` (optional) | Treasurer, in Settings | PDF header line, only when set, only on receipts issued after setting | A15, A16 |
| 6 | Storage `receipts/{orNo}/issued.pdf` | Receipt PDF trigger, sweep job | Homeowner and treasurer via `getReceiptUrl` (until a void, REQ-014) | A1, C2, C4 |
| 7 | `receipts/{orNo}.pdfPath`, `pdfStatus` (`preparing` / `ready` / `failed`) | Trigger, sweep job | Staff (treasurer payment detail states); the sweep job | D1–D6 |
| 8 | `payments/{id}.receiptPdfStatus` (mirror) | Trigger, sweep job | Homeowner: "Preparing receipt…" / "Receipt PDF" / failed message on Dues & Payments and the dashboard (REQ-015) | D1, D2, D3, K4 |
| 9 | Structured log `receipt.pdf_failed` (`orNo` only) | Trigger, final failure | Developer alert (§8.3); deliberately not shown to any role | D5 |
| 10 | Signed URL (15 minutes) | `getReceiptUrl` on each press | The caller's browser or PDF viewer; deliberately never logged or stored | E1–E4, E10 |
| 11 | `members.linkedAt` vs `payments.submittedAt` (decision 5) | `redeemInvite` (REQ-004); `submitPayment` (REQ-010) | Dues & Payments row (receipt button shown or not, "Made before you joined"); `getReceiptUrl` refusal "You don't have access to this receipt." | G1–G9 |
| 12 | "Receipt ready" notification (REQ-011 catalogue row, written by REQ-013) | **Not specified in REQ-013** (Gap G-1) | Homeowner bell "Receipt {OR no.} is ready to download." | K1 |
| 13 | 95% warning / run-out refusal | `decidePayment` | Treasurer, on the approval screen (where and how often: Gap G-4) | H3–H6 |

No read-back cell is empty; row 12's writer is missing (G-1).

### Status enumeration: what the receipt button shows

Rule under test: a receipt download exists only for an **approved** payment whose file is `ready`, for a caller allowed by decision 5. One row per state the payment can hold.

| Payment status ↓ / `receiptPdfStatus` → | (none) | `preparing` | `ready` | `failed` |
|---|---|---|---|---|
| **pending** | No button (D7); `getReceiptUrl` has no receipt to serve | n/a | n/a | n/a |
| **rejected** | No button (D8) | n/a | n/a | n/a |
| **approved** | n/a (a receipt always exists after approval) | "Approved · OR-nnnnn", disabled "Preparing receipt…" (D1) | "Receipt PDF" (A1) | Failed message with the number (D3) |
| **approved, submitted before viewer's link date** (not submitter) | Date, amount, status only, no button (G2) | Same, no button | Same, no button; direct call refused (G3) | Same, no button |
| **voided** (REQ-014) | n/a | Void file preparing: Gap G-9, see TC-14 | Homeowner gets the void version, treasurer either (TC-14) | Gap G-9 |

Plus the role axis: admin, board, guard, other household, no household: refused in every row (F-block).

---

## Test plan

### 1. Smoke

The standing smoke pass (`smoke.spec.js`) loads each mock-up screen; it doesn't cover receipts. **Smoke additions for QE:**

1. A homeowner with one approved fixture payment opens **Dues & Payments** and sees the payment row with an enabled **"Receipt PDF"**, and pressing it returns a PDF (no page error).
2. The treasurer opens an **approved payment's detail** and sees "Receipt PDF".
3. Settings shows the **receipt title** field for the treasurer (and no prefix or first-number field).

### 2. Acceptance

| REQ-013 scenario | Cases |
|---|---|
| Download a receipt | A1–A8 |
| The lot is sold while the payment is pending | C6 |
| Centavos are written out | B2 |
| One payment covers several months, oldest first | B8 |
| An overpayment becomes a credit | B10, B11 |
| The same receipt every time | C1, C2 |
| The PDF is still being prepared | D1, D2 |
| The PDF can't be prepared | D3 |
| No receipt for a payment that isn't approved | D7, D8 |
| Another household's receipt | F1, F2, F3 |
| A new owner after a sale (decision 5) | G1, G2, G3 |
| The sale rule uses when the payment was submitted | G4 |
| Receipt numbers run out in a registered range | H3 |
| The treasurer is warned before the range runs out | H5 |
| The receipt number series can't be changed in Settings | H8, H10 |
| The treasurer downloads any receipt | F4 |
| TIN and address print only when set | A15, A16 |
| The download link doesn't last | E1, E3 |
| Download on a weak connection | E6 |

### 3. Regression

What else could break, and why:

- **Approval transaction (REQ-012 / TC-12).** The receipt record, snapshot, `counters/or` and the range check all sit inside `decidePayment`. A range refusal must leave the payment pending **and** the counter untouched, or the gap-free promise breaks. Re-run TC-12's gap-free and concurrency cases (two treasurers, double press, dropped connection) after the range check lands.
- **Shared PDF stack (`shared/pdf/`) with REQ-009's statement PDF (TC-09).** Font embedding, header and footer are shared: re-run the statement PDF cases (₱ and ñ print, "This statement is not an official receipt.").
- **Shared payment row (REQ-010 / REQ-015).** The receipt button, "Made before you joined" and the sale rule live in one component used by Dues & Payments and the dashboard: re-run TC-10's payment-history cases and TC-15's recent payments.
- **`members.linkedAt` (REQ-004 / TC-04).** Decision 5 now reads it. Re-run TC-04's K-block (removal after a sale) and TC-04-L1..L6, which were blocked on this decision and now have an answer (option (b)).
- **Settings (REQ-007 / TC-07).** New title, TIN and address fields; the treasurer-only financial settings boundary (admin office edits non-financial settings only).
- **Notifications (REQ-011 / TC-11)**: "Receipt ready" row (G-1) and the approval notification's "is being prepared" promise.
- **Void (REQ-014 / TC-14)** reuses the trigger, `pdfStatus` handling and `getReceiptUrl`; TC-14's E-block covers the void file.

**Existing specs and screens QE should re-run:** `tests/specs/ui/smoke.spec.js` (SMK-owner-* for Dues & Payments, SMK-admin-* for Settings), `navigation.spec.js` NAV-07 / NAV-08 (375 px, DEF-001); TC-09, TC-10, TC-12, TC-15 once written.

**Not affected:** sign-in (TC-01), the household directory and import (TC-03), invite codes and slips (TC-04 except linkedAt), billing run generation (REQ-008), announcements (TC-16, TC-17).

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Receipt PDF" must yield the file; "Preparing receipt…" must become ready without reload; "issued electronically after the treasurer matched the reference number" | A8, D2, D3 |
| A value written for one role, never shown back | Yes: title, TIN, address, received-from, `receiptPdfStatus`, the "Receipt ready" notification | Register; A3, A15–A17, D2, K1 |
| Status-gated rule checked for one transition only | Yes: button by status × file status × sale rule | Status enumeration; D1–D8, G2 |
| Same concept, different word on another screen | Yes: "official receipt", "receipt OR-nnnnn", never "e-receipt"; "Made before you joined" (REQ-009) vs "date, amount and status only" | J10, G10 |
| Dates computed in UTC where the user means local | Yes: date issued, date of payment, balance-line "as of", link date vs submission | A2, A9, G5 |
| A derived figure doesn't refresh after a related write | Yes: button state after the file is ready; balance line snapshot | D2, A9 |
| Zero and "not set" look the same | Yes: TIN unset vs empty; `rangeEnd` unset vs set; balance "Fully paid" vs credit | A10, A11, A15, H7 |
| A write silently refused by security rules | Yes: client reads and writes of `receipts`, Storage, `counters/or` | E7, E8, F11, F12, H9 |
| Double-tap / two devices create duplicates | Downloads only (harmless); approval duplicates are TC-12 | E5 |
| Stale reference | Yes: receipt opened, then voided (TC-14); treasurer role removed | F13 |
| Backdrop click loses work or leaves stale state | No modal holds input here (Settings title is a page form) | n/a, see H10 |
| A modal appearing mid-flow blocks the next action | Yes: the important-announcement pop-up (REQ-017) on opening Dues & Payments | J14 |
| Assumed SDK/network behaviour baked into a case | Yes: signed URL expiry, signBlob, PDF viewers, `pdf-lib` tagging | E1, J5 (assumptions marked) |
| Data leaking across households or roles | Yes, the core privacy risk: previous owner's name after a sale | F-block, G-block |

### Scenario list by mandatory type

- **Negative**: pending and rejected payments; other household; no household; admin, board, guard; signed out; direct Firestore and Storage access; past `rangeEnd`; stale treasurer token; pre-link payment for a new owner; expired link. D7, D8, E1, F1–F13, G3, H3, H9.
- **Boundary**: ₱0.01, ₱1.00, ₱1,850.50, ₱100,000.00 in words; last number in range and one past; 95% exactly and one below; `linkedAt` equal to `submittedAt` and one second after; 15 minutes exactly; sweep at 15 minutes "preparing"; 5th failed retry. B1–B7, D5, D6, E2, G5, G6, H4–H6.
- **Usability**: button accessible name, 44 px, "Preparing receipt…" keeps width, phone viewer, real text and reading order, 9 pt, contrast, A4 and Letter, plain error messages. J-block.
- **Navigation**: Dues & Payments to the PDF and back; treasurer detail to PDF; deep link to a receipt route; refresh while preparing; admin and board can't reach the button. J1, J2, J11–J13, F6, F7.

---

## A. Receipt content

#### TC-13-A1: Pressing "Receipt PDF" on an approved payment opens a file named after the receipt number
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO, HH-A). **Tags:** Provisional — SA-001 follow-up
- **Setup:** U-CARLO submitted ₱1,800.00 on Manila today − 1; S-TREAS approved it today; `receiptPdfStatus` is `ready`.
- **Action:** U-CARLO opens Dues & Payments and presses "Receipt PDF" on that payment.
- **Expected:** A PDF opens or downloads; its file name is `{receipt number}.pdf` (for example `OR-00093.pdf`), the same number shown on the row.
- **Don't assert:** the exact number (it depends on the counter); whether the browser opens or downloads.

#### TC-13-A2: The receipt shows the title, number, date of payment and date issued
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** As A1; date paid typed as Manila today − 1; approved Manila today; title setting "Official Receipt".
- **Action:** Read the PDF text.
- **Expected:** "Official Receipt", "{title} No. OR-nnnnn", "Date of payment" = the date paid typed, "Date issued" = the Manila approval date, both in "Nov 27, 2026" format.
- **Don't assert:** layout positions.

#### TC-13-A3: "Received from" is the owner on file at submission, with the lot, not the submitter
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO submits; U-CARLO reads). **Tags:** —
- **Setup:** HH-A's owner on file is ZZ Ana Reyes; U-CARLO (a family member) submits and S-TREAS approves.
- **Action:** Read the PDF.
- **Expected:** "Received from: ZZ Ana Reyes · Blk 2 Lot 7"; U-CARLO's name does not appear anywhere on the receipt.
- **Don't assert:** punctuation spacing around "·".

#### TC-13-A4: The amount appears in figures with the ₱ sign and in words
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** ₱1,800.00 approved.
- **Expected:** "Amount received ₱1,800.00" and "The sum of One Thousand Eight Hundred Pesos Only"; "Total ₱1,800.00".
- **Don't assert:** letter case of the words beyond the copy of record.

#### TC-13-A5: "Applied to" lists the period and amount the payment covered
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** HH-A owes October 2026 only; ₱1,800.00 approved.
- **Expected:** One line "Association dues · October 2026 ₱1,800.00".
- **Don't assert:** column alignment.

#### TC-13-A6: The receipt shows the payment method, the full reference number and the payee
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** Reference "9000000000001"; payee set in REQ-007 settings.
- **Expected:** "Payment method: QR Ph transfer", "Reference no. 9000000000001" (full, not last 4), "Paid to {payee}".
- **Don't assert:** the payee text value (fixture-dependent).

#### TC-13-A7: The signature block names the approving treasurer, with no signature image
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** S-TREAS (ZZ Liza Santos) approved.
- **Expected:** "Approved by ZZ Liza Santos, Treasurer"; the PDF contains no image object in the signature area.
- **Don't assert:** font weight.

#### TC-13-A8: The note says the receipt was issued after the treasurer matched the reference, not that the portal verified it
**Priority** P2 · **Type** UI/UX (copy honesty) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "This receipt was issued electronically by the {HOA name} portal after the treasurer matched the reference number with the collection account. Keep it for your records." No text claims the portal verified or confirmed the payment.
- **Don't assert:** line wrapping.

#### TC-13-A9: The balance line shows the amount still due as of the date issued
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO, HH-C). **Tags:** —
- **Setup:** HH-C owes October and November (₱3,600.00); ₱1,800.00 approved.
- **Expected:** "Account balance after this payment, as of {date issued}: ₱1,800.00 due".
- **Don't assert:** that this equals today's balance (it is a snapshot).

#### TC-13-A10: The balance line reads "Fully paid" when the payment clears the account
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** HH-A owes ₱1,800.00; ₱1,800.00 approved.
- **Expected:** "…as of {date issued}: Fully paid"; not "₱0.00 due" and not "₱0.00 credit".
- **Don't assert:** —

#### TC-13-A11: The balance line reads "₱x credit" after an overpayment
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN, HH-B). **Tags:** —
- **Setup:** HH-B owes ₱1,800.00; ₱2,000.00 approved.
- **Expected:** "…as of {date issued}: ₱200.00 credit".
- **Don't assert:** —

#### TC-13-A12: The footer carries the HOA name, the receipt number and the lot
**Priority** P3 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "{HOA name} · OR-nnnnn · Blk 2 Lot 7" on every page of the PDF; the HOA name matches the brand under test (Greenfield Homes HOA or Gentri Heights HOA).
- **Don't assert:** page count (one page expected, but not asserted).

#### TC-13-A13: The peso sign prints as "₱" and reads back as U+20B1, never "PHP"
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** Any approved receipt.
- **Action:** Extract the PDF text.
- **Expected:** Every amount starts with the character U+20B1; the string "PHP " appears nowhere; no box or missing-glyph character appears when the PDF is rendered.
- **Don't assert:** which font is embedded.

#### TC-13-A14: A name with "ñ" prints correctly
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO, HH-C, owner on file "ZZ Roberto Peña"). **Tags:** —
- **Expected:** "Received from: ZZ Roberto Peña · Blk 6 Lot 4" with "ñ" in both the rendered page and extracted text.
- **Don't assert:** —

#### TC-13-A15: With TIN and address unset, the receipt has no TIN or address line
**Priority** P2 · **Type** Boundary (not set) · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer sets nothing; homeowner reads. **Tags:** —
- **Setup:** `hoaTin` and `hoaAddress` absent from settings.
- **Expected:** No "TIN" text and no address line; no empty label such as "TIN " or a blank header row.
- **Don't assert:** header height.

#### TC-13-A16: TIN and address set later print on new receipts only
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (S-TREAS). **Tags:** —
- **Setup:** Receipt R1 issued with TIN and address unset.
- **Action:** S-TREAS sets an invented TIN ("000-000-000-000") and address ("ZZ Test Address"); approves another payment, receipt R2.
- **Expected:** R2 shows "TIN 000-000-000-000 · ZZ Test Address"; R1, downloaded again, still has no TIN or address line.
- **Don't assert:** TIN format validation (not specified).

#### TC-13-A17: The receipt title comes from the title setting in force at issue
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** Title "Official Receipt".
- **Action:** Change the title to "Acknowledgement Receipt"; approve a payment.
- **Expected:** The new receipt's title and number label read "Acknowledgement Receipt" / "Acknowledgement Receipt No.".
- **Don't assert:** —

#### TC-13-A18: Changing the title doesn't change receipts already issued
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** R1 issued as "Official Receipt"; title then changed (A17).
- **Action:** Download R1 again.
- **Expected:** R1 still reads "Official Receipt".
- **Don't assert:** —

#### TC-13-A19: When D5 says the document isn't the BIR document, the receipt carries "This is not a BIR official receipt or invoice."
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Blocked — D5 · Gap G-2
- **Setup:** (pending D5 and G-2: what switches the line on).
- **Expected:** Receipts issued after the switch carry the line; earlier ones don't.
- **Don't assert:** until D5 and G-2 are answered.

## B. Amount in words and allocation

#### TC-13-B1: Whole pesos are written "… Pesos Only"
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** none (amount-to-words rule). **Tags:** —
- **Expected:** ₱1,800.00 → "One Thousand Eight Hundred Pesos Only"; ₱2,000.00 → "Two Thousand Pesos Only"; ₱1,000,00… not applicable (cap ₱100,000.00).
- **Don't assert:** —

#### TC-13-B2: Centavos are written as "and nn/100"
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer approves; homeowner reads. **Tags:** —
- **Setup:** HH-B pays ₱1,850.50; approved.
- **Expected:** "One Thousand Eight Hundred Fifty Pesos and 50/100 Only".
- **Don't assert:** —

#### TC-13-B3: Single-digit centavos keep two digits
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** none. **Tags:** —
- **Expected:** ₱1,001.05 → "One Thousand One Pesos and 05/100 Only"; ₱1,800.10 → "… and 10/100 Only".
- **Don't assert:** —

#### TC-13-B4: The largest accepted payment, ₱100,000.00, is written correctly
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** none. **Tags:** —
- **Expected:** "One Hundred Thousand Pesos Only"; ₱99,999.99 → "Ninety-Nine Thousand Nine Hundred Ninety-Nine Pesos and 99/100 Only" (hyphen per G-3).
- **Don't assert:** hyphenation until G-3.

#### TC-13-B5: Teens, tens and hundreds are written without gaps or doubled words
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** none. **Tags:** —
- **Expected:** ₱11,111.11, ₱10,010.00, ₱19,000.00, ₱100.00 each read correctly; no "Zero" inside a number, no double spaces.
- **Don't assert:** —

#### TC-13-B6: One peso, and amounts under one peso
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** none. **Tags:** Gap G-3
- **Expected (pending G-3):** ₱1.00 reads "One Peso Only" (singular); ₱0.50 has a defined wording, not "Pesos and 50/100" with no leading number. Only applies if REQ-010's minimum allows it.
- **Don't assert:** exact text until G-3.

#### TC-13-B7: The amount in words never disagrees with the figure
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none. **Tags:** —
- **Setup:** A table of at least 50 amounts from ₱0.01 to ₱100,000.00 including every boundary above.
- **Expected:** Converting the words back gives the same centavos for every row.
- **Don't assert:** —

#### TC-13-B8: A payment covering several months lists each month, oldest first
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer approves; homeowner (U-ROBERTO) reads. **Tags:** —
- **Setup:** HH-C owes October and November 2026 at ₱1,800.00 each; pays ₱3,600.00.
- **Expected:** "Association dues · October 2026 ₱1,800.00" then "Association dues · November 2026 ₱1,800.00"; Total ₱3,600.00.
- **Don't assert:** —

#### TC-13-B9: A partial payment is applied to the oldest bill only
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; homeowner. **Tags:** —
- **Setup:** HH-C owes October and November; pays ₱1,000.00.
- **Expected:** One line "Association dues · October 2026 ₱1,000.00"; no November line; balance line "₱2,600.00 due".
- **Don't assert:** —

#### TC-13-B10: An overpayment adds an "Advance payment (credit)" line
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; homeowner (U-JUAN). **Tags:** —
- **Setup:** HH-B owes ₱1,800.00; pays ₱2,000.00.
- **Expected:** "Association dues · {period} ₱1,800.00" and "Advance payment (credit) ₱200.00"; Total ₱2,000.00.
- **Don't assert:** —

#### TC-13-B11: After the overpayment, the statement reads "₱200.00 credit"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** B10.
- **Action:** Open Dues & Payments (statement, REQ-009) and the dashboard (REQ-015).
- **Expected:** Statement balance "₱200.00 credit"; dashboard "₱0.00" with "₱200.00 credit"; the receipt's balance line "₱200.00 credit". The same word "credit" in all three.
- **Don't assert:** layout.

#### TC-13-B12: A payment made entirely in advance, with nothing owed, is all credit
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; homeowner (U-MARIA, HH-M, fully paid). **Tags:** —
- **Setup:** HH-M owes nothing; pays ₱1,800.00.
- **Expected:** One line "Advance payment (credit) ₱1,800.00"; no "Association dues" line; balance line "₱1,800.00 credit".
- **Don't assert:** —

#### TC-13-B13: Lines applied always add up to the receipt total
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (data check over every receipt the run created). **Tags:** Staging note: admin SDK read of `receipts`
- **Expected:** For every receipt, the sum of lines equals the amount received, in centavos.
- **Don't assert:** —

## C. The same receipt every time

#### TC-13-C1: A receipt downloaded after the dues rate changed and the owner was renamed shows the same content
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (S-TREAS). **Tags:** —
- **Setup:** R1 downloaded; then the dues rate changed (REQ-007) and HH-A's owner on file renamed (REQ-003).
- **Action:** S-TREAS downloads R1 again (a later day on the staging clock, or simply later).
- **Expected:** Receipt number, received-from name, amounts, lines applied, balance line and date issued are the same as the first download.
- **Don't assert:** download time.

#### TC-13-C2: Two downloads of the same receipt return the same file
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner and treasurer. **Tags:** Provisional — SA-001 follow-up
- **Action:** Download R1 as U-CARLO and as S-TREAS; compare.
- **Expected:** Byte-identical files (same hash); the PDF's creation and modification dates equal the receipt's `issuedAt`, not the download time.
- **Don't assert:** the hash value.

#### TC-13-C3: A re-render of the same receipt produces the same file
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (trigger). **Tags:** Provisional — SA-001 follow-up · Staging note: force a retry
- **Setup:** Force the trigger to run twice for one receipt (a retried event), on a copy of the receipt in the emulator.
- **Expected:** Both renders give byte-identical output; `pdfStatus` ends `ready` once.
- **Don't assert:** retry timing.

#### TC-13-C4: The issued file is never overwritten
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (trigger, sweep job). **Tags:** Provisional — SA-001 follow-up · Staging note: Storage access
- **Setup:** R1 `ready`, `issued.pdf` stored with a known generation number.
- **Action:** Run the sweep job; replay the create event.
- **Expected:** `issued.pdf` keeps its generation and hash.
- **Don't assert:** —

#### TC-13-C5: A settings change between approval and a late render doesn't reach the receipt
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-5 · Staging note: force render failure
- **Setup:** Approve R1 while rendering is forced to fail; then change the receipt title, the payee (REQ-007), the HOA name and the approving treasurer's display name; let the sweep job render R1.
- **Expected:** R1 shows the values in force at issue for every field (title, TIN and address are snapshotted; payee, HOA name and treasurer name pending G-5).
- **Don't assert:** payee, HOA name and treasurer name until G-5.

#### TC-13-C6: A sale while the payment is pending doesn't change "Received from"
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner submits; admin office changes owner; treasurer approves. **Tags:** —
- **Setup:** U-CARLO submits when the owner on file is ZZ Ana Reyes; S-ADMIN then changes it to ZZ Ben Cruz (REQ-003).
- **Action:** S-TREAS approves.
- **Expected:** The receipt reads "Received from: ZZ Ana Reyes · Blk 2 Lot 7".
- **Don't assert:** —

#### TC-13-C7: A rename after approval doesn't change an issued receipt
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office; treasurer downloads. **Tags:** —
- **Setup:** R1 issued to ZZ Ana Reyes; S-ADMIN renames the owner on file.
- **Expected:** R1 still reads ZZ Ana Reyes; the next receipt for a payment **submitted** after the rename uses the new name.
- **Don't assert:** —

## D. File states

#### TC-13-D1: While the file is being made, the row shows "Approved · OR-nnnnn" and a disabled "Preparing receipt…"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Provisional — SA-001 follow-up
- **Setup:** Payment approved; `receiptPdfStatus` held at `preparing` (render paused in the emulator).
- **Expected:** "Approved · OR-nnnnn" and a disabled control reading "Preparing receipt…" where "Receipt PDF" will be; pressing it does nothing.
- **Don't assert:** spinner presence.

#### TC-13-D2: "Preparing receipt…" turns into "Receipt PDF" without reloading
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** Provisional — SA-001 follow-up
- **Setup:** D1 with the page open.
- **Action:** Let the render finish.
- **Expected:** Within a few seconds the control becomes an enabled "Receipt PDF" with no reload; pressing it opens the file.
- **Don't assert:** exact delay.

#### TC-13-D3: A failed file shows the issued number and a plain message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** Provisional — SA-001 follow-up · Staging note: force render failure
- **Setup:** Render forced to fail past its retries; `receiptPdfStatus` `failed`.
- **Expected:** "Your receipt OR-nnnnn is issued, but the file isn't ready yet. Try again later, or contact the admin office."; the payment still reads Approved; the balance is reduced; the receipt record and number exist unchanged.
- **Don't assert:** where on the row the message sits.

#### TC-13-D4: The sweep job re-renders a failed receipt and the button becomes available
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** none (sweep job); homeowner reads. **Tags:** Provisional — SA-001 follow-up · Staging note
- **Setup:** D3, then remove the forced failure.
- **Action:** Run the sweep job.
- **Expected:** `pdfStatus` and `receiptPdfStatus` become `ready`; the homeowner sees "Receipt PDF".
- **Don't assert:** the hourly schedule itself.

#### TC-13-D5: After five failed sweep tries the receipt stays failed and one alert log carries the number only
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** Provisional — SA-001 follow-up · Staging note: log access
- **Setup:** Render always fails.
- **Action:** Run the sweep job six times.
- **Expected:** Renders are tried up to 5 times by the sweep, not a 6th; status stays `failed`; the structured log `receipt.pdf_failed` carries `orNo` and no name, lot, amount or reference.
- **Don't assert:** alert delivery.

#### TC-13-D6: A receipt stuck in "preparing" for over 15 minutes is picked up by the sweep job
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** Provisional — SA-001 follow-up · Staging note: seed `issuedAt`
- **Setup:** Two receipts `preparing`, one created 14 minutes ago and one 16 minutes ago (lost trigger event simulated).
- **Action:** Run the sweep job.
- **Expected:** The 16-minute one is rendered and becomes `ready`; the 14-minute one is left alone.
- **Don't assert:** —

#### TC-13-D7: A pending payment has no "Receipt PDF" button
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** A payment "Pending approval".
- **Expected:** No "Receipt PDF" and no "Preparing receipt…" on its row.
- **Don't assert:** —

#### TC-13-D8: A rejected payment has no "Receipt PDF" button
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** A payment "Rejected" with a reason.
- **Expected:** No receipt control on its row; no receipt number shown.
- **Don't assert:** —

#### TC-13-D9: The treasurer's payment detail shows the same file states
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer (S-TREAS). **Tags:** Provisional — SA-001 follow-up
- **Setup:** Three approved payments: preparing, ready, failed.
- **Expected:** "Preparing receipt…" disabled, "Receipt PDF" enabled, and the failed message respectively, each with its receipt number.
- **Don't assert:** wording of any extra staff-only detail.

## E. Download link

#### TC-13-E1: A copied download address stops working after 15 minutes
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Provisional — SA-001 follow-up · Staging note: signed URLs need staging (signBlob)
- **Setup:** Press "Receipt PDF"; copy the address the browser opened.
- **Action:** Open the address again after 15 minutes and a few seconds.
- **Expected:** Refused by Storage (no PDF content returned).
- **Don't assert:** the exact error page.

#### TC-13-E2: The address works within 15 minutes
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Provisional — SA-001 follow-up · Staging note
- **Action:** Open the copied address at about 14 minutes.
- **Expected:** The same PDF is returned.
- **Don't assert:** second-level precision of the expiry.

#### TC-13-E3: Pressing "Receipt PDF" again after expiry gives a fresh working link
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Provisional — SA-001 follow-up · Staging note
- **Setup:** E1.
- **Action:** Press "Receipt PDF" again.
- **Expected:** The file opens; the new address differs from the expired one.
- **Don't assert:** URL format.

#### TC-13-E4: The link is a time-limited signed address, not a permanent token link
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Provisional — SA-001 follow-up
- **Action:** Inspect the address returned by `getReceiptUrl`.
- **Expected:** It carries an expiry (V4 signature with a 900-second lifetime); it is not a Firebase `getDownloadURL()` token address (`…?alt=media&token=…`).
- **Don't assert:** the signing key id.

#### TC-13-E5: Repeated presses change nothing
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Action:** Press "Receipt PDF" five times quickly.
- **Expected:** At most five downloads; no Firestore document is created or changed; no audit entry (downloads aren't logged in R1).
- **Don't assert:** how many viewer tabs open.

#### TC-13-E6: A dropped connection during download shows how to recover
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: network throttling
- **Action:** Press "Receipt PDF" with the connection cut before the link returns.
- **Expected:** "Couldn't download the receipt. Check your connection and try again."; the row keeps "Receipt PDF" enabled; pressing again after reconnecting works.
- **Don't assert:** behaviour of a download already handed to the phone's viewer (outside the app).

#### TC-13-E7: No client can read `receipts/` in Storage directly
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-CARLO, S-TREAS, S-ADMIN. **Tags:** —
- **Action:** Each tries a Storage client read of `receipts/{orNo}/issued.pdf`.
- **Expected:** Every read refused, the treasurer's included (downloads go only through `getReceiptUrl`).
- **Don't assert:** error code names.

#### TC-13-E8: No client can write or delete in `receipts/` in Storage
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, S-TREAS. **Tags:** —
- **Action:** Upload a file to `receipts/{orNo}/issued.pdf`; delete it.
- **Expected:** Both refused; the stored file is unchanged (same hash).
- **Don't assert:** —

#### TC-13-E9: File name, Storage path and link carry no personal data
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** File name is the receipt number only; the path is `receipts/{orNo}/…`; neither contains a name, lot, email or reference number.
- **Don't assert:** —

#### TC-13-E10: Signed links never appear in logs
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** none (log check after E1–E6). **Tags:** Staging note: log access
- **Expected:** No function log line contains a signed URL or its signature parameter.
- **Don't assert:** —

## F. Access and roles

All F cases assert the refusal explicitly ("no button" alone is not proof).

#### TC-13-F1: A member of another household is refused a receipt by number
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA, HH-M). **Tags:** —
- **Action:** Call `getReceiptUrl` with HH-A's receipt number.
- **Expected:** Refused; the screen shows "You don't have access to this receipt."; no URL returned.
- **Don't assert:** error code.

#### TC-13-F2: Guessing neighbouring receipt numbers is refused for each one
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA. **Tags:** —
- **Action:** Request the 10 receipt numbers before and after her own.
- **Expected:** Only HH-M's receipts succeed; every other is refused with the same message, whether the number exists or not (no difference that reveals which numbers exist).
- **Don't assert:** —

#### TC-13-F3: Opening another household's receipt by link is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA. **Tags:** —
- **Action:** Open the app route a "Receipt PDF" press uses for an HH-A receipt (if the app has one), and a fresh HH-A signed link expired by E1's wait.
- **Expected:** "You don't have access to this receipt." for the route; the expired link refused.
- **Don't assert:** whether the app has a receipt route at all.

#### TC-13-F4: The treasurer can download any household's receipt from the payment detail
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer (S-TREAS). **Tags:** —
- **Action:** Open HH-A's approved payment; press "Receipt PDF".
- **Expected:** The same file the household gets (same hash as C2).
- **Don't assert:** —

#### TC-13-F5: A treasurer who is also a homeowner can download receipts in the treasurer view
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO. **Tags:** —
- **Expected:** In "Treasurer" view, any household's receipt downloads; in "My household" view, HH-T's own receipts download as for any member.
- **Don't assert:** —

#### TC-13-F6: Admin office staff see no receipt button and are refused by the server
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff (S-ADMIN). **Tags:** —
- **Expected:** No payment detail with "Receipt PDF" in the admin menu; `getReceiptUrl` for any receipt refused.
- **Don't assert:** —

#### TC-13-F7: Board members are refused receipts in R1
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-BOARD. **Tags:** —
- **Expected:** No receipt button reachable; `getReceiptUrl` refused.
- **Don't assert:** R2 behaviour.

#### TC-13-F8: Guards are refused receipts
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-GUARD. **Tags:** —
- **Expected:** `getReceiptUrl` refused; no payments screen reachable.
- **Don't assert:** —

#### TC-13-F9: A signed-in person with no household is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER. **Tags:** —
- **Expected:** `getReceiptUrl` refused for every fixture receipt.
- **Don't assert:** —

#### TC-13-F10: A signed-out caller is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** anonymous. **Tags:** —
- **Expected:** `getReceiptUrl` refused as unauthenticated.
- **Don't assert:** —

#### TC-13-F11: Homeowners can't read `receipts/{orNo}` in Firestore, even their own
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-CARLO, U-ANA. **Tags:** Provisional — SA-001 follow-up
- **Action:** Client read of their own receipt document and a query on `receipts` by household.
- **Expected:** Both refused (homeowners read status only through `payments.receiptPdfStatus`).
- **Don't assert:** —

#### TC-13-F12: No client can write a receipt or the counter
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, S-TREAS, S-ADMIN. **Tags:** —
- **Action:** Create, update or delete a `receipts` document; update `counters/or`; set `receiptPdfStatus` on a payment.
- **Expected:** Every write refused; documents unchanged.
- **Don't assert:** —

#### TC-13-F13: A treasurer whose role was removed is refused, even with a still-valid token
**Priority** P1 · **Type** Security (stale reference) · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-2 after `setRole` removal. **Tags:** —
- **Setup:** S-TREAS-2 has a payment detail open; the developer removes the treasurer role (`staff/{uid}` gone, token not yet refreshed).
- **Action:** Press "Receipt PDF".
- **Expected:** Refused with "You don't have access to this receipt."
- **Don't assert:** —

#### TC-13-F14: A household member who didn't submit, linked before submission, can download
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA, HH-A). **Tags:** —
- **Setup:** U-CARLO submitted; U-ANA was linked before that.
- **Expected:** U-ANA sees "Receipt PDF" and gets the same file.
- **Don't assert:** —

## G. Privacy after a sale (decision 5, option (b))

#### TC-13-G1: A new owner sees the lot's full current balance
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN, linked to HH-A after U-ANA's removal. **Tags:** —
- **Setup:** HH-A has receipts from before the sale and an unpaid bill.
- **Expected:** Dues & Payments shows the same balance the treasurer sees for HH-A.
- **Don't assert:** the figure.

#### TC-13-G2: Payments submitted before the new owner's link date show date, amount and status only
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN. **Tags:** —
- **Expected:** Each pre-link approved payment shows its date, amount and "Approved"; no receipt number link, no "Receipt PDF", no "Preparing receipt…".
- **Don't assert:** whether the receipt number text itself is hidden (Gap G-6).

#### TC-13-G3: A new owner asking for a pre-link receipt directly is refused
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN. **Tags:** —
- **Action:** Call `getReceiptUrl` with a pre-link HH-A receipt number.
- **Expected:** Refused; "You don't have access to this receipt."
- **Don't assert:** —

#### TC-13-G4: The rule uses submission time, not the typed date paid
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** U-BEN. **Tags:** Staging note: seed `submittedAt`
- **Setup:** U-BEN linked on Dec 10; a payment submitted Dec 8 with a typed date paid of Dec 12, approved.
- **Expected:** That payment shows date, amount and status only, no "Receipt PDF"; `getReceiptUrl` refused.
- **Don't assert:** —

#### TC-13-G5: A payment submitted at exactly the link time is visible
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** U-BEN. **Tags:** Staging note: seed timestamps
- **Setup:** `members.linkedAt` equals the payment's `submittedAt` to the millisecond.
- **Expected:** Receipt available ("linkedAt on or before submittedAt").
- **Don't assert:** —

#### TC-13-G6: A payment submitted one second before the link time is not
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** U-BEN. **Tags:** Staging note
- **Setup:** `submittedAt` = `linkedAt` − 1 s.
- **Expected:** No receipt; direct request refused.
- **Don't assert:** —

#### TC-13-G7: Payments submitted after the new owner linked have receipts
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** U-BEN. **Tags:** —
- **Setup:** U-BEN submits after linking; approved.
- **Expected:** "Receipt PDF" available; received-from is the owner on file at submission (ZZ Ben Cruz if the office updated it, Gap G-7 otherwise).
- **Don't assert:** the name until G-7.

#### TC-13-G8: A family member linked after the owner loses the earlier receipts (accepted consequence)
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ELLA, linked to HH-A after U-BEN. **Tags:** —
- **Setup:** U-BEN submitted a payment before U-ELLA linked; approved.
- **Expected:** U-ELLA sees that payment as date, amount, status only, no receipt; U-BEN still sees its receipt.
- **Don't assert:** —

#### TC-13-G9: The submitter keeps access to their own payment's receipt
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO. **Tags:** Gap G-8
- **Setup:** U-CARLO submitted and the payment was approved; U-CARLO is removed from HH-A and later re-linked (new `linkedAt` after the submission).
- **Expected:** After re-linking he still gets the receipt (submitter exception). **While removed** (not a member at all): pending G-8.
- **Don't assert:** the removed-state outcome until G-8.

#### TC-13-G10: The pre-link row uses the label "Made before you joined", as on the statement
**Priority** P3 · **Type** UI/UX (consistency) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN. **Tags:** Gap G-6
- **Expected:** The payment row on Dues & Payments reads "{date} · {amount} · {status} · Made before you joined" (REQ-009, REQ-010 copy), the same on the dashboard (TC-15).
- **Don't assert:** until G-6 confirms REQ-013 uses the same label.

#### TC-13-G11: The removed previous owner can't download any of the lot's receipts
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA after removal. **Tags:** Gap G-8
- **Setup:** U-ANA was the owner and a member; she submitted one payment herself; then she was removed.
- **Expected:** Receipts she didn't submit: refused. The one she submitted: pending G-8 (REQ-013's submitter exception vs TC-04-L5's "including her own uploads").
- **Don't assert:** the own-submission outcome until G-8.

#### TC-13-G12: Staff still download every receipt of the lot after a sale
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS. **Tags:** —
- **Expected:** Every HH-A receipt, before and after the sale, downloads.
- **Don't assert:** —

## H. Receipt number series

#### TC-13-H1: The receipt number is the prefix plus the next number, padded to the set width
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Developer script sets the series; treasurer approves. **Tags:** Staging note: developer script run
- **Setup:** Series `{prefix: "OR-", next: 93, width: 5}`.
- **Action:** Approve one payment.
- **Expected:** OR-00093; the next approval gives OR-00094.
- **Don't assert:** —

#### TC-13-H2: Approvals take consecutive numbers with none skipped or repeated
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Two treasurers. **Tags:** Cross-reference TC-12 (gap-free under concurrency)
- **Setup:** 50 approvals, some at the same moment, plus some rejections between them.
- **Expected:** Receipt numbers form a consecutive run; rejections use none; every receipt has a file once `ready`.
- **Don't assert:** which treasurer got which number.

#### TC-13-H3: Past the end of a registered range the approval is refused and the payment stays pending
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (S-TREAS). **Tags:** Provisional — SA-001 follow-up · Staging note: developer script
- **Setup:** `rangeEnd` = 5000; OR-05000 already issued; one payment pending.
- **Action:** Approve it.
- **Expected:** "Receipt numbers have run out. Ask the developer to add the next registered range."; the payment stays "Pending approval"; no receipt created; `counters/or.next` unchanged; balance and `pendingCentavos` unchanged; no notification.
- **Don't assert:** —

#### TC-13-H4: The last number in the range can be issued
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — SA-001 follow-up · Staging note
- **Setup:** `rangeEnd` = 5000; `next` = 5000.
- **Expected:** Approval succeeds as OR-05000.
- **Don't assert:** —

#### TC-13-H5: At 95% of the range the treasurer is warned
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — SA-001 follow-up · Gap G-4 · Staging note
- **Setup:** Range OR-00001 to OR-05000; `next` = 4750.
- **Action:** Approve one payment (OR-04750).
- **Expected:** "95% of receipt numbers in this range are used. Ask the developer to add the next registered range."
- **Don't assert:** where it shows and whether it repeats on later approvals (G-4).

#### TC-13-H6: Below 95% there is no warning
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-4 · Staging note
- **Setup:** As H5 with `next` = 4749.
- **Expected:** OR-04749 issued with no warning. (How 95% is computed when the range doesn't start at 1, for example a paper booklet ending at 1250: G-4.)
- **Don't assert:** —

#### TC-13-H7: With no range end set there is no warning and no refusal
**Priority** P2 · **Type** Boundary (not set) · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note
- **Setup:** `rangeEnd` absent; `next` = 99990.
- **Expected:** Approvals succeed with no warning.
- **Don't assert:** what happens past the width (H13).

#### TC-13-H8: Settings has no field for the receipt prefix or first number
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** Open Settings.
- **Expected:** A receipt title field; no prefix, first number, width or range field anywhere in Settings.
- **Don't assert:** —

#### TC-13-H9: A treasurer's browser can't change the series
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS. **Tags:** —
- **Action:** Client write to `counters/or` (`next`, `prefix`, `rangeEnd`); a settings write with an extra `prefix` key.
- **Expected:** Refused; the series is unchanged.
- **Don't assert:** —

#### TC-13-H10: The treasurer can change the receipt title, and an empty title isn't saved
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-10
- **Action:** Clear the title and save; then save "Official Receipt".
- **Expected:** The empty title is refused with a message under the field (wording: G-10); the valid one saves.
- **Don't assert:** the message text until G-10.

#### TC-13-H11: Admin office staff can't change the receipt title, TIN or address
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** —
- **Expected:** The fields are not offered to admin office staff (financial setting); a direct write is refused.
- **Don't assert:** —

#### TC-13-H12: A series set to start after a paper booklet issues that number first
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** Yes
**Role:** Developer script; treasurer. **Tags:** Staging note: developer script
- **Setup:** Script sets `next` = 1251 (booklet ended at 1250).
- **Expected:** First approval gives OR-01251; no lower number is ever issued.
- **Don't assert:** —

#### TC-13-H13: A number longer than the width
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-11 · Staging note
- **Setup:** `width` 5, `next` 100000, no `rangeEnd`.
- **Expected (pending G-11):** Either "OR-100000" or a refusal; never a truncated or repeated number.
- **Don't assert:** which, until G-11.

## J. Navigation and usability (WCAG 2.2 AA, 375 px)

#### TC-13-J1: From Dues & Payments a homeowner opens the receipt and returns to the same place
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Action:** Open Dues & Payments, scroll to a payment, press "Receipt PDF", close the viewer or press Back.
- **Expected:** Back on Dues & Payments, the menu item "Dues & Payments" still highlighted, no sign-out, no lost state.
- **Don't assert:** scroll position to the pixel.

#### TC-13-J2: From Approvals the treasurer opens an approved payment's receipt and returns
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Payment detail → "Receipt PDF" → back to the same payment detail.
- **Don't assert:** —

#### TC-13-J3: The receipt button names the receipt for screen readers
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Accessible name "Download receipt OR-nnnnn"; the disabled state is announced as unavailable with "Preparing receipt…".
- **Don't assert:** —

#### TC-13-J4: The button is at least 44 px and "Preparing receipt…" keeps its width
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, 375 px. **Tags:** —
- **Expected:** Target ≥ 44 × 44 px; switching from preparing to ready moves nothing else on the row (no layout shift).
- **Don't assert:** colours.

#### TC-13-J5: The PDF has real, selectable text in the reading order number → date → received from → amount → lines
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Assumption: `pdf-lib` may not write tagged PDF (Sol Arch, uncertain)
- **Expected:** Text extracts in that order; the PDF has a document title; no page is a single image.
- **Don't assert:** PDF tags (not promised).

#### TC-13-J6: Type is at least 9 pt and text contrast at least 4.5:1
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** No text run below 9 pt; all text colours against their background ≥ 4.5:1.
- **Don't assert:** —

#### TC-13-J7: The receipt prints on A4 and US Letter without clipping
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Printed (or print-previewed) on both paper sizes, every line, the footer and the signature block are inside the printable area.
- **Don't assert:** margins.

#### TC-13-J8: On a phone the PDF opens in the phone's viewer
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner on an Android and an iPhone. **Tags:** —
- **Expected:** The file opens in the built-in viewer or browser PDF view, readable without horizontal scrolling at fit-to-width.
- **Don't assert:** which app opens it.

#### TC-13-J9: The payment row with its receipt control fits 375 px
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, 375 px. **Tags:** DEF-001 (re-check once fixed)
- **Expected:** "Approved · OR-nnnnn" and the button fit in one card with no sideways scroll.
- **Don't assert:** wrap points.

#### TC-13-J10: Screens say "official receipt" or "receipt OR-nnnnn", never "e-receipt"
**Priority** P3 · **Type** UI/UX (consistency) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner and treasurer. **Tags:** —
- **Expected:** No "e-receipt", "E-Receipt" or "OR PDF" in any receipt-related screen, toast or message.
- **Don't assert:** —

#### TC-13-J11: Refreshing while "Preparing receipt…" shows the current state
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Action:** Refresh during D1; then after the file is ready.
- **Expected:** Preparing state after the first refresh, "Receipt PDF" after the second; never a missing row.
- **Don't assert:** —

#### TC-13-J12: An admin or board member can't reach a receipt by typing a payment address
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-BOARD. **Tags:** —
- **Action:** Open the treasurer's payment-detail address directly.
- **Expected:** The no-access page (REQ-002) "You don't have access to this page"; no receipt control.
- **Don't assert:** —

#### TC-13-J13: The failed-file message tells the homeowner what to do, in plain words
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** D3's message is text (not only an icon or colour), is announced to screen readers when it appears, and keeps the receipt number visible.
- **Don't assert:** —

#### TC-13-J14: The important-announcement pop-up doesn't block downloading a receipt afterwards
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner with an unread important announcement (REQ-017). **Tags:** —
- **Action:** Open the portal, press "Got it", go to Dues & Payments, press "Receipt PDF".
- **Expected:** The receipt opens; no leftover overlay intercepts the press.
- **Don't assert:** —

## K. Integration

#### TC-13-K1: The household is told when the receipt is ready
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO, U-ANA). **Tags:** Gap G-1
- **Expected (pending G-1):** Each linked member's bell shows "Receipt OR-nnnnn is ready to download." (REQ-011 catalogue) once the file is `ready`, and not before; a failed file sends no "ready" notification.
- **Don't assert:** until G-1.

#### TC-13-K2: The payment's mirrored status always matches the receipt's file status
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (data check after D-block). **Tags:** Provisional — SA-001 follow-up · Staging note: admin SDK
- **Expected:** For every receipt, `payments/{id}.receiptPdfStatus` equals `receipts/{orNo}.pdfStatus`; `ready` only when `issued.pdf` exists.
- **Don't assert:** —

#### TC-13-K3: The statement PDF still prints "₱" after the shared PDF module lands
**Priority** P2 · **Type** Integration (regression) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** REQ-009's "Download PDF" still shows ₱ and "This statement is not an official receipt."; header and footer as before.
- **Don't assert:** —

#### TC-13-K4: The dashboard's recent payments show the same receipt states as Dues & Payments
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Cross-reference TC-15-C-block
- **Expected:** For the same three payments, preparing / ready / failed / none appear identically on both screens.
- **Don't assert:** —

## X. Exploratory charters

#### TC-13-X1: 20 minutes trying to get a receipt you shouldn't have
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA and U-BEN with devtools. **Tags:** —
- **Charter:** Replay `getReceiptUrl` calls with other numbers, share links between sessions, open links after sign-out, after removal, after the 15 minutes, in another browser; look for any path that returns a file or a name. Time-box 20 min.

#### TC-13-X2: 15 minutes with the receipt on real phones and printers
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Charter:** Open, share, save and print receipts from 2 Android and 1 iPhone, inside Messenger/Gmail in-app browsers; note anything unreadable, clipped or missing (₱, ñ, long names, long payee). Time-box 15 min.

---

## Cases that hinge on open decisions or Draft architecture

| Open item | Who decides | Cases |
|---|---|---|
| **D5** (decision 2): may the portal issue this document, what title, BIR range | HOA board with its accountant, in writing | A19; go-live of every receipt case. Build-time cases are not blocked |
| Data Protection Officer to confirm decision 5 | HOA board | G-block runs as approved; a DPO change reopens it |
| Series prefix and first number from the treasurer | Treasurer, in writing | H1, H12 use fixtures; production values are not a test input |
| S3 follow-ups not yet in SA-001 | Sol Arch | Every case tagged Provisional — SA-001 follow-up |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Receipt content | 19 | 8 |
| B | Amount in words, allocation | 13 | 5 |
| C | The same receipt every time | 7 | 3 |
| D | File states | 9 | 5 |
| E | Download link | 10 | 5 |
| F | Access and roles | 14 | 12 |
| G | Privacy after a sale | 12 | 6 |
| H | Receipt number series | 13 | 8 |
| J | Navigation, usability | 14 | 0 |
| K | Integration | 4 | 0 |
| X | Exploratory | 2 | 0 |
| **Total** | | **117** | **52** |

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | REQ-011's catalogue lists "Receipt ready: Receipt {OR no.} is ready to download.", written by REQ-013, but REQ-013 has no scenario, Data row or copy for it. Is it sent, when, and is it suppressed for a failed file? | K1, register row 12 |
| G-2 | Decision 2's D5 branch adds "This is not a BIR official receipt or invoice.", but no setting or field turns that line on; only the title is a setting | A19 |
| G-3 | Amount in words: singular "One Peso", amounts under ₱1, and hyphenation ("Ninety-Nine" or "Ninety Nine") are not defined | B4, B6 |
| G-4 | The 95% warning: where the treasurer sees it (toast after the approval, a banner, Settings), whether it repeats on every later approval, and how 95% is computed when the range doesn't start at 1 (a series continuing a paper booklet) | H5, H6 |
| G-5 | The snapshot is said to include title, TIN and address. Are the HOA name, the payee and the treasurer's display name also snapshotted? A receipt whose first render fails and is re-rendered hours later by the sweep job could otherwise pick up changed values | C5 |
| G-6 | REQ-009 and REQ-010 label pre-link payments "Made before you joined"; REQ-013 says only "date, amount and status only". Same label here? And is the receipt number itself hidden on such a row (13E)? | G2, G10 |
| G-7 | After a sale, "Received from" is the owner on file at submission. If the office hasn't updated the owner name yet (TC-04 G-28), the new owner's receipts carry the previous owner's name | G7 |
| G-8 | `getReceiptUrl` allows "the person who submitted it" with no membership check, so a removed previous owner (or family member) keeps downloading the lot's receipts they submitted. TC-04-L5 (approved) expects a removed owner to lose every record "including her own uploads". Which wins? | G9, G11 |
| G-9 | After a void, homeowners "get the void version". What does the row show while `void.pdf` is preparing or failed, and must `getReceiptUrl` refuse rather than fall back to the unstamped `issued.pdf`? (Shared with TC-14 G-6) | Status enumeration, TC-14 E-block |
| G-10 | No validation copy for an empty receipt title, and no maximum length | H10 |
| G-11 | What happens when `next` outgrows `width` with no `rangeEnd` | H13 |
