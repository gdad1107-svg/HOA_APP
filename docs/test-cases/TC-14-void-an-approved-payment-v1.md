# TC-14: Void an approved payment (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature (treasurer voids an approved payment with a reason; balance recalculated; receipt kept, stamped and never reused; void counted in the month it is made) |
| Source | [REQ-014 Void an approved payment](../requirements/REQ-014-void-an-approved-payment.md), **Approved** 2026-11-28 (r6), Option A. Decisions 7 (reinstating a mistaken void) and 8 (board notified of every void) are **open** |
| Depends on / precedent | [REQ-012](../requirements/REQ-012-approve-or-reject-a-payment.md) (approval transaction, self-decision refusal, stale-screen messages, `paymentRefs`), [REQ-013](../requirements/REQ-013-official-receipt-pdf.md) (receipt files, `getReceiptUrl`, `pdfStatus`), [REQ-009](../requirements/REQ-009-statement-of-account.md) (oldest-first ledger, void not counted), [REQ-010](../requirements/REQ-010-submit-qr-payment.md) (reference reservation messages), [REQ-011](../requirements/REQ-011-in-app-notifications.md) (one notification per linked person), [REQ-006](../requirements/REQ-006-activity-log.md) (`payment.voided`, reasons never in the log), [REQ-015](../requirements/REQ-015-homeowner-dashboard.md) (`openBills`, balance tile), [REQ-023](../requirements/REQ-023-collections-by-month.md) and [REQ-024](../requirements/REQ-024-fund-summary-and-close-month.md) (C1: minus line in the month of the void; R2 screens) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open: the dialog must fit 375 px, TC-14-M3). No defect is open in this area (no code yet) |
| App version | **Anticipated.** No application code exists; the mock-up has no void. Approved UX: screens 14A–14C of [req-012-017-mockup.html](../mockups/req-012-017-mockup.html). **14A–14C still show the pre-C1 wording** (REQ-014 Sol Arch change 9, not applied): where they disagree with REQ-014 r6, REQ-014 wins |
| Source files / functions touched (anticipated) | `voidReceipt` callable; `shared/domain/ledger.js` (full recalculation); receipt PDF trigger (void branch, `void.pdf`); `getReceiptUrl` (void version for homeowners); Firestore rules for `payments`, `receipts`, `households`, `bills`, `monthlyTotals`, `paymentRefs`, `notifications`, `auditLog`; treasurer payment detail and void dialog; Dues & Payments payment row; dashboard balance tile |
| Architecture | SA-001 r3 **Final** (§3 `voidReceipt`, §4.2, Flow 1 point 2, §4.4 item 12, R-1, R-11). S3 follow-ups from REQ-014's review not yet written into SA-001 (`voidPeriod`, `voidedByName`, the closed-period check, `void.pdf`, recalculation from scratch) are tagged **Provisional — SA-001 follow-up** |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions, Storage) or `hoa-portal-staging` only. Never production.** Month-boundary cases need a controllable server clock (Staging note). Both brands |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. |

**Tags used on cases**

- **Provisional — SA-001 follow-up**: asserts a design detail from REQ-014's Sol Arch review not yet in SA-001.
- **Blocked — decision 7** / **Blocked — decision 8**: owner decisions added after approval, still open. **Blocked — D5**: the accountant's answer on "stamp VOID, keep the number". **Blocked — R2**: needs a screen from story 23 or 24.
- **Gap G-n**: expected result depends on a requirement gap (listed at the end).
- **Staging note**: controllable server clock, admin SDK reads, two sessions at once, seeded closed month.

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Treasurer** (`treasurer`) | The only role that voids, and not their own household's payment (decision 4). Sees the conflict, failure and own-household messages. Downloads either receipt file |
| **Second treasurer** | Voids the first treasurer's household payments; the "two treasurers at once" partner |
| **Homeowner, member of the household** | Reads "Void" and the reason on payment history; gets the bell notification; downloads the stamped receipt; sees the balance go back up |
| **New owner after a sale** | Sees pre-link voided payments as date, amount, status only (reason: Gap G-8) |
| **Admin office staff**, **board**, **guard** | Can't void. Board: in-app notice of every void only if decision 8 is accepted |
| **Developer** | Reinstates a mistaken void with `reinstatePayment`, only if decision 7 (a) is accepted |

### Test fixtures (invented; QE maps them to `.env`)

| Fixture | Lot | Members | Starting state |
|---|---|---|---|
| **HH-A** "ZZ Test Household A" | Blk 2 Lot 7 | U-ANA, U-CARLO (both linked) | R-93: ₱1,800.00 approved Manila today, reference "9000000000093"; balance ₱0.00 |
| **HH-A2** (variant of HH-A) | Blk 2 Lot 7 | as HH-A | R-93 and a later R-94 (₱1,800.00), each covering one month |
| **HH-B** "ZZ Test Household B" | Blk 4 Lot 12 | U-JUAN | Paid ₱2,000.00 against ₱1,800.00 (₱200.00 credit), then a ₱1,800.00 bill: ₱1,600.00 due |
| **HH-C** "ZZ Test Household C" | Blk 6 Lot 4 | U-ROBERTO | Partial ₱1,000.00 approved against October |
| **HH-K** "ZZ Test Household K" | Blk 8 Lot 8 | U-KAREN | Large credit: ₱5,000.00 overpaid; one ₱1,800.00 receipt to void |
| **HH-T** "ZZ Test Household T" | Blk 9 Lot 3 | S-TREAS-HO | Treasurer's own household, one approved payment |
| **HH-M** "ZZ Test Household M" | Blk 5 Lot 1 | U-MARIA | Untouched; checks that other households don't change |

| Account | Who |
|---|---|
| S-TREAS | ZZ Liza Santos, treasurer, no household |
| S-TREAS-2 | ZZ Mark Treasurer, treasurer, no household |
| S-TREAS-HO | Treasurer and member of HH-T |
| S-ADMIN, S-BOARD, S-BOARD-2, S-GUARD | ZZ Paolo Admin, ZZ Rosa Board, ZZ Second Board, guard |
| U-BEN | New owner of HH-A, linked after the sale |

Reasons are invented ("ZZ Duplicate of R-90"). Receipt numbers below are written R-93, R-94 for the fixture's numbers; the real prefix comes from the series fixture. "Today" is built from **local Manila today**; dates in the REQ (Nov 28, Dec 3, 2026) show the arithmetic.

### Round-trip register

Treasurer voids → household, statement, receipt files, totals and log change. One row per field or status value.

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | `payments.status = voided` | `voidReceipt`, treasurer pressing "Void payment" | Treasurer payment detail "Void"; household payment history "Void" (Dues & Payments, dashboard recent payments) | A1, A2, P2 |
| 2 | `voidReason` | `voidReceipt` from the dialog | Household history "Void: {reason}"; the notification; the PDF stamp; treasurer detail. **Never** in `auditLog` | A2, A6, E1, A8 |
| 3 | `voidedBy`, `voidedByName`, `voidedAt` | `voidReceipt` | `voidedByName`: the second treasurer's conflict message. `voidedAt`: PDF stamp date, "Voided {date}" marker (REQ-023, R2). `voidedBy`: audit entry actor | H2, E8, A8 |
| 4 | `receipts.voided`, `voidReason`, `voidedAt`, `voidedBy`; number and snapshot unchanged | `voidReceipt` | Receipt PDF trigger (void branch); staff | A9, E2 |
| 5 | `receipts.voidPeriod` (`YYYY-MM`, Manila) | `voidReceipt` | REQ-023 collections (R2); proven at data level in R1 | G1, G2 |
| 6 | Storage `void.pdf` (beside the kept `issued.pdf`) | Receipt PDF trigger | Homeowner via `getReceiptUrl` (void version); treasurer either | E1–E7 |
| 7 | Bills' paid amounts (recalculated) | `voidReceipt` via `ledger.js` | Statement periods (REQ-009), oldest-first. **Conflict:** REQ-009 r3 says per-bill paid amounts are not stored (Gap G-1) | F2, F9 |
| 8 | `households.balanceCentavos`, `paidCentavos`, `openBills` | `voidReceipt` | Statement balance, dashboard tile and overdue warning, toast | A3, A4, F8, P1 |
| 9 | `households.pendingCentavos` (must **not** change) | — | Dashboard "awaiting approval" | A11 |
| 10 | `monthlyTotals/{voidPeriod}.duesCentavos` (−amount) | `voidReceipt` | REQ-023/024 (R2); proven at data level in R1 | G1, G3 |
| 11 | `paymentRefs/{ref}` (kept) | — (never deleted by a void) | `submitPayment`: "This reference number was already submitted on {date}…" | K1, K2 |
| 12 | Notification, one per linked member | `voidReceipt` | Each member's bell "Payment voided: {amount}, {OR no.}. Reason: {reason}." | A6, A7 |
| 13 | Board notification (decision 8) | `voidReceipt`, only if accepted | Each board member's bell | A12 |
| 14 | `auditLog` `payment.voided` (ids only) | `voidReceipt` | Board, treasurer: activity log (REQ-006) "{staff} voided OR-nnnnn" | A8 |
| 15 | `payments.reinstatedFrom` (decision 7 (a)) | `reinstatePayment` developer script | Treasurer: Approvals shows the new pending payment | N1–N3 |

No read-back cell is empty.

### Status enumeration: "Only approved payments can be voided"

One row per status a payment can hold; columns are what the treasurer sees and what the server does.

| Prior status | "Void" shown? | Server on `voidReceipt` | Cases |
|---|---|---|---|
| **pending** | No | Refused, nothing changes | D1 |
| **rejected** | No | Refused, nothing changes | D2 |
| **approved** (another household) | **Yes** | Voids | A1 |
| **approved**, caller's own household | No; note "This is your own household's payment. Another treasurer must void it." | Refused | J5, J6 |
| **approved**, caller is the submitter | No (Gap G-9: which note) | Refused | J7 |
| **approved**, household deactivated | Gap G-10 | Gap G-10 | D5 |
| **approved**, receipt PDF still preparing or failed | Yes | Voids; void file made from the snapshot | E9 |
| **voided**, by someone else, screen stale | Stale screen still shows Void | Refused: "{OR no.} was already voided by {name}. Nothing was changed." | H2, H7 |
| **voided**, same treasurer retrying | n/a | "Already voided", writes nothing (copy: Gap G-4) | H3 |
| **voided** (fresh screen) | No | Refused | D3 |
| **reinstated** (new pending linked by `reinstatedFrom`) | No (it's pending) | Refused as pending | N1 |

---

## Test plan

### 1. Smoke

Adds a control on an existing treasurer screen. **Smoke additions for QE:**

1. The treasurer opens an approved fixture payment's detail and sees **"Void"**; pressing it opens the dialog with the reason box and "Void payment" disabled (no page error). Cancel closes it.
2. A homeowner's Dues & Payments shows a fixture **voided** payment with the pill "Void" and its reason.

### 2. Acceptance

| REQ-014 scenario | Cases |
|---|---|
| Void a payment approved by mistake | A1–A8, A5 |
| Board members are told of every void (decision 8) | A12 (Blocked — decision 8) |
| The number is never reused | B1, B2 |
| A voided receipt is marked | E1, E2, E3 |
| Voiding needs a reason | C2, C3 |
| The dialog says what will happen | C1, C9 |
| Pressing twice voids once | H1 |
| Two treasurers void the same receipt | H2 |
| Only approved payments can be voided | D1, D2, D3 |
| The reference number stays used | K1, K2 |
| A void with a later payment already on the account | F1–F4 |
| Voiding an overpayment whose credit was already used | F5 |
| The treasurer role is removed while the receipt is open | H6 |
| A void at the month boundary | G5 |
| Admin office staff and board members can't void | J1, J2 |
| The treasurer can't void their own household's payment | J5, J6 |
| A void counts in the month it is made | G1, G2 |
| Voiding a receipt from a closed month | G4 |
| The save fails | L1, L2 |

### 3. Regression

- **Ledger (`shared/domain/ledger.js`).** A void recalculates every bill of the household from scratch. Any change to the shared rule moves REQ-009's statement, REQ-012's allocation, REQ-015's overdue warning and REQ-018's delinquency (R2). Re-run TC-09 (statement periods, credit, "void payments are not counted"), TC-12 (partial and multi-month allocation) and TC-15's overdue cases after the void lands. **Top risk:** the per-bill paid amounts REQ-014 rewrites are said by REQ-009 r3 not to exist (G-1); whichever is built, the statement and the stored balance must agree after a void (F9).
- **Receipt files and `getReceiptUrl` (TC-13).** A void adds the second file and switches what homeowners get. Re-run TC-13's D-block (file states) and F-block (access) with a voided receipt in the fixture.
- **Gap-free numbering (TC-12, TC-13-H2).** A void must not touch `counters/or`.
- **Reference reservation (TC-10, TC-12).** A rejection deletes `paymentRefs`; a void must not. Re-run TC-12's "rejected reference can be submitted again" to prove the two paths stay distinct.
- **Notifications (TC-11)**: per-member fan-out; removed members get none (REQ-011 decision 3).
- **Monthly totals and C1** feed R2's collections and month close: data-level cases in R1; REQ-023/024 test plans will reuse G-block fixtures.
- **Treasurer-who-is-a-homeowner switch (TC-02)**: the own-household rule now exists on two actions.

**Existing specs and screens QE should re-run:** `smoke.spec.js` (SMK-admin-* for Approvals and the payment detail, SMK-owner-* for Dues & Payments), `navigation.spec.js` NAV-06 (Escape on modals: the void dialog is an exception once text is typed) and NAV-07/NAV-08 (375 px, DEF-001); TC-09, TC-10, TC-12, TC-13, TC-15 once written.

**Not affected:** sign-in (TC-01), directory and import (TC-03), invitations (TC-04), announcements (TC-16, TC-17), billing run generation (REQ-008) other than reading recalculated bills.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "balance is back to {amount}", "goes back up by", "kept and never reused", "Nothing was changed" | A4, C1, B1, H2, L2 |
| A value written for one role, never shown back | Yes: reason, `voidedByName`, `voidPeriod`, board notice | Register; A2, H2, G1, A12 |
| Status-gated rule checked for one transition only | Yes: pending, rejected, voided, own household, submitter, deactivated | Status enumeration; D-block, J5–J7 |
| Same concept, different word on another screen | Yes: "Void" vs "Voided" vs "reverse/delete"; notification copy vs REQ-011 catalogue | M10, P4 |
| Dates computed in UTC where the user means local | Yes, sharply: `voidPeriod` near midnight Manila (16:00 UTC) and year end | G2, G6 |
| A derived figure doesn't refresh after a related write | Yes: balance, `openBills` overdue warning, dashboard tile, statement periods | A3, F8, H4, P1 |
| Zero and "not set" look the same | Yes: balance ₱0.00 vs credit after a void; empty reason vs whitespace | F6, C8 |
| A write silently refused by security rules | Yes: client writes to `payments`, `receipts`, totals | J8, J9 |
| Double-tap / two devices create duplicates | Yes: double press, two treasurers, retry after drop | H1, H2, H3 |
| Stale reference | Yes: stale screen after another's void; role removed; month closed mid-save | H6, H7, G5 |
| Backdrop click loses work or leaves stale state | Yes: the reason dialog | C9, C10 |
| A modal appearing mid-flow blocks the next action | Low: the treasurer view gets no pop-up (REQ-017) | M11 |
| Assumed SDK/network behaviour baked into a case | Yes: dropped connection during a callable | L1, H3 (assumption marked) |
| Data leaking across households or roles | Yes: reason shown to a new owner; other households untouched | E10, F10 |

### Scenario list by mandatory type

- **Negative**: void of pending, rejected, voided; own household; submitter; admin, board, guard, homeowner; direct client writes; blank, short, long reason; resubmitting the reference; role removed; closed period. D1–D3, J-block, C2, C4, C7, C12, K1, H6, G5.
- **Boundary**: reason 4/5/200/201 characters; void at 23:59:59 vs 00:00:00 Manila; Dec 31 vs Jan 1; credit already used; still in credit after a void; same-month void; void of the only and of the last payment. C4–C7, G2, G3, G6, F5, F6, F7.
- **Usability**: dialog states the money effect, labelled reason box with counter and hint, focus in and back, pill not colour alone, 375 px dialog, Void away from other buttons, errors keep the typed reason. C-block, M-block, L1.
- **Navigation**: Approvals → payment detail → Void → back to the same detail; Cancel; Escape with and without typing; refresh after void; non-treasurers can't reach the dialog; homeowner from the notification to Dues & Payments. M6–M9, P6.

---

## A. Void a payment (happy path)

#### TC-14-A1: Voiding an approved payment marks it "Void" in the treasurer's payment detail
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (S-TREAS). **Tags:** —
- **Setup:** HH-A, R-93 approved, balance ₱0.00.
- **Action:** Open R-93, press "Void", type "ZZ Duplicate of R-90", press "Void payment".
- **Expected:** The detail now reads "Void" with the reason; "Void" is no longer offered.
- **Don't assert:** the pill's colour.

#### TC-14-A2: The household's payment history shows "Void: {reason}"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO, HH-A). **Tags:** —
- **Setup:** A1.
- **Expected:** On Dues & Payments the payment reads "Void" and "Void: ZZ Duplicate of R-90"; the amount is struck through and still readable.
- **Don't assert:** strike-through style details.

#### TC-14-A3: The household's balance goes back up by the voided amount
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO); treasurer. **Tags:** —
- **Setup:** A1.
- **Expected:** Statement and dashboard read ₱1,800.00 for HH-A; the treasurer's view of HH-A agrees.
- **Don't assert:** —

#### TC-14-A4: The success toast states the new balance from the save
**Priority** P1 · **Type** UI/UX (copy honesty) · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** "R-93 is void. Blk 2 Lot 7's balance is back to ₱1,800.00." The figure equals the stored balance after the transaction, not a figure worked out in the browser.
- **Don't assert:** toast duration.

#### TC-14-A5: While saving, the button reads "Voiding…" and is disabled
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: slow the function
- **Expected:** "Voiding…", disabled, until the result returns; Cancel can't undo a save in flight.
- **Don't assert:** spinner.

#### TC-14-A6: Every linked member of the household gets the void notification
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowners U-ANA and U-CARLO. **Tags:** Gap G-3
- **Expected:** Each bell shows "Payment voided: ₱1,800.00, R-93. Reason: ZZ Duplicate of R-90."; one notification per person (two documents); reading one doesn't mark the other's read.
- **Don't assert:** exact wording until G-3 (REQ-011's catalogue has no void row).

#### TC-14-A7: People not linked to the household at the void get no notification
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-MARIA (other household), U-ANA after removal. **Tags:** —
- **Setup:** Remove U-ANA from HH-A, then void a HH-A payment.
- **Expected:** Only current members are notified; U-ANA and U-MARIA get nothing.
- **Don't assert:** —

#### TC-14-A8: The activity log records who voided which receipt and when, without the reason
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Board (S-BOARD) reads; treasurer acted. **Tags:** —
- **Expected:** One `payment.voided` entry with the actor, receipt number, payment and household ids and time; the activity log shows "ZZ Liza Santos voided R-93"; the reason text appears nowhere in `auditLog`.
- **Don't assert:** entry layout on the log page.

#### TC-14-A9: The receipt record is marked voided while its number and snapshot stay the same
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (data check). **Tags:** Staging note: admin SDK read of `receipts`
- **Expected:** `receipts/R-93` has `voided` true, `voidReason`, `voidedAt`, `voidedBy`, `voidPeriod`; every snapshot field equals its value before the void.
- **Don't assert:** —

#### TC-14-A10: The voider's name is stored with the void
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** Provisional — SA-001 follow-up
- **Expected:** `payments.voidedByName` = "ZZ Liza Santos" at the time of the void, unchanged if her display name changes later.
- **Don't assert:** —

#### TC-14-A11: A void doesn't change the household's "awaiting approval" amount
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** HH-A also has a ₱500.00 pending payment.
- **Action:** Void R-93.
- **Expected:** Dashboard still shows "₱500.00 awaiting approval"; `pendingCentavos` unchanged.
- **Don't assert:** —

#### TC-14-A12: Every board member is told of every void
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-BOARD, S-BOARD-2. **Tags:** Blocked — decision 8
- **Expected (if decision 8 accepted):** Each board bell shows "Payment voided by ZZ Liza Santos: ₱1,800.00, R-93, Blk 2 Lot 7."; no board notification if decision 8 is declined.
- **Don't assert:** until decision 8.

## B. Number never reused

#### TC-14-B1: The next approval after a void takes the next number, not the voided one
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** R-93 is the last issued; void it.
- **Action:** Approve another payment.
- **Expected:** R-94; R-93 still exists as voided.
- **Don't assert:** —

#### TC-14-B2: A void doesn't touch the receipt counter
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** Staging note: admin SDK
- **Expected:** `counters/or.next` is the same before and after the void.
- **Don't assert:** —

#### TC-14-B3: Voided receipts stay in the gap-free run
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (data check after the run). **Tags:** —
- **Expected:** All receipt numbers from the first to the last are present, voided ones included; none missing, none repeated.
- **Don't assert:** —

## C. The void dialog and the reason

#### TC-14-C1: The dialog states the amount, the balance effect, and that the number is kept
**Priority** P1 · **Type** UI/UX (copy honesty) · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** Press "Void" on R-93.
- **Expected:** "Void R-93 for ₱1,800.00? The balance of Blk 2 Lot 7 goes back up by ₱1,800.00. The receipt number is kept and never reused. The homeowner will see this reason."; a labelled "Reason" box; "Cancel" and "Void payment".
- **Don't assert:** line breaks.

#### TC-14-C2: "Void payment" stays disabled while the reason is blank
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Disabled with an empty box; pressing it (keyboard or click) does nothing.
- **Don't assert:** —

#### TC-14-C3: The reason box carries the privacy hint
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "The homeowner sees this reason. Don't include other people's names or account numbers." is visible and tied to the box (`aria-describedby`).
- **Don't assert:** —

#### TC-14-C4: A reason of 1–4 characters
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-2
- **Action:** Type "Dup".
- **Expected (pending G-2):** "Void payment" stays disabled, or a message says the minimum; never a server refusal shown as "Couldn't void".
- **Don't assert:** which, until G-2.

#### TC-14-C5: A reason of exactly 5 characters is accepted
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Action:** Type "Dupli"; void.
- **Expected:** Saved; reason shown as "Void: Dupli".
- **Don't assert:** —

#### TC-14-C6: A reason of exactly 200 characters is accepted and shown whole
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; homeowner reads. **Tags:** —
- **Expected:** Saved; the homeowner's history, the notification and the PDF stamp show all 200 characters (wrapped, not cut).
- **Don't assert:** wrap points.

#### TC-14-C7: A reason over 200 characters can't be entered or saved
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-2
- **Expected:** The counter shows 200 as the limit; a 201st character is not accepted (or a message shows, G-2); no save.
- **Don't assert:** the message text.

#### TC-14-C8: A reason of only spaces counts as blank
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "Void payment" stays disabled; the server also refuses a whitespace-only reason.
- **Don't assert:** —

#### TC-14-C9: Clicking outside the dialog doesn't close it
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** Open the dialog, type a reason, click the backdrop; repeat with an empty box.
- **Expected:** The dialog stays open both times, reason kept.
- **Don't assert:** —

#### TC-14-C10: Escape doesn't close the dialog once a reason is typed
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** With text typed, Escape leaves it open with the text; with nothing typed, Escape closes it (UX note) and nothing is saved.
- **Don't assert:** —

#### TC-14-C11: Cancel closes the dialog, saves nothing and returns focus to "Void"
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Payment still Approved; balance unchanged; focus on the "Void" button; reopening shows an empty reason.
- **Don't assert:** —

#### TC-14-C12: The server refuses a reason under 5 or over 200 characters sent directly
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer's browser bypassing the form. **Tags:** —
- **Action:** Call `voidReceipt` with a 4-character and a 201-character reason.
- **Expected:** Both refused; payment still approved.
- **Don't assert:** error code.

#### TC-14-C13: A reason containing markup is shown as plain text everywhere
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; homeowner reads. **Tags:** —
- **Action:** Void with the reason "<b>ZZ test</b> & more".
- **Expected:** History, bell and PDF show the literal characters; nothing renders bold; no script runs.
- **Don't assert:** —

## D. Status gating

#### TC-14-D1: A pending payment has no "Void", and the server refuses to void it
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** No "Void" on the pending payment's detail; `voidReceipt` refused; payment still pending, `pendingCentavos` unchanged.
- **Don't assert:** —

#### TC-14-D2: A rejected payment has no "Void", and the server refuses to void it
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** No "Void"; refused; status and reason unchanged; its reference stays free (not re-reserved).
- **Don't assert:** —

#### TC-14-D3: A voided payment has no "Void", and a second void is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (a fresh screen). **Tags:** —
- **Expected:** No "Void"; `voidReceipt` returns already voided; balance did not go up a second time.
- **Don't assert:** —

#### TC-14-D4: An approved payment from another household shows "Void" at the bottom of the detail
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "Void" is the last control on the page, separated from other buttons.
- **Don't assert:** pixel spacing.

#### TC-14-D5: Voiding a payment from a deactivated household
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-10
- **Setup:** HH-A deactivated (REQ-003) after R-93 was approved.
- **Expected (pending G-10):** Allowed (as REQ-012 allows approval) or refused with a message; balance consistent with whichever.
- **Don't assert:** until G-10.

## E. Voided receipt files

#### TC-14-E1: After a void, the household downloads a receipt stamped "VOID" with the date and reason
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Provisional — SA-001 follow-up · Blocked — D5 (go-live only)
- **Expected:** "Receipt PDF" returns a file with "VOID · {date voided} · ZZ Duplicate of R-90".
- **Don't assert:** stamp position or angle.

#### TC-14-E2: Everything else on the voided receipt is unchanged
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Number, dates, received-from, amounts, lines, balance line and signature match the issued file's text exactly; only the stamp is added.
- **Don't assert:** —

#### TC-14-E3: The treasurer can still download the original as issued, without the stamp
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Provisional — SA-001 follow-up · Gap G-7
- **Expected:** A way to get the issued file (same hash as before the void); it has no "VOID" text.
- **Don't assert:** how the choice is offered (G-7).

#### TC-14-E4: The treasurer can also get the void version
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-7
- **Expected:** The same stamped file the household gets.
- **Don't assert:** control wording.

#### TC-14-E5: The issued file is not overwritten by the void
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** Provisional — SA-001 follow-up · Staging note: Storage access
- **Expected:** `issued.pdf` keeps its generation and hash; `void.pdf` is a new object.
- **Don't assert:** —

#### TC-14-E6: While the void file is being made, the household sees a defined state
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-6 · Staging note: pause render
- **Expected (pending G-6):** The row shows "Void" and a disabled preparing state (or no button); it never offers the unstamped file.
- **Don't assert:** copy until G-6.

#### TC-14-E7: A homeowner can never get the unstamped file after a void
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO, U-ANA). **Tags:** Provisional — SA-001 follow-up
- **Action:** Call `getReceiptUrl` for R-93 before `void.pdf` is ready and after; ask for the issued version explicitly if the call takes a parameter.
- **Expected:** Never a link to `issued.pdf`; before the void file is ready, a refusal or "not ready" (G-6).
- **Don't assert:** the message.

#### TC-14-E8: The stamp's date is the Manila date of the void
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: controllable server clock
- **Setup:** Void at 00:30 Manila (16:30 UTC the previous day).
- **Expected:** The stamp shows the Manila date, not the UTC date.
- **Don't assert:** —

#### TC-14-E9: Voiding a receipt whose issued file failed still produces a void file
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: force render failure
- **Setup:** R-93 `pdfStatus` `failed`.
- **Action:** Void it; let renders succeed.
- **Expected:** `void.pdf` is made from the snapshot; the household gets the stamped file; the sweep job may still make `issued.pdf` for the treasurer.
- **Don't assert:** order of the two renders.

#### TC-14-E10: A new owner sees a pre-link voided payment as date, amount and status only
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN. **Tags:** Gap G-8
- **Setup:** R-93 (submitted before U-BEN linked) voided.
- **Expected:** Row shows date, amount, "Void"; no receipt; whether "Void: {reason}" shows is pending G-8.
- **Don't assert:** the reason's visibility until G-8.

## F. Balance recalculation

#### TC-14-F1: Voiding an earlier receipt when a later one exists raises the balance by the voided amount
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; homeowner reads. **Tags:** —
- **Setup:** HH-A2: R-93 (October) then R-94 (November), balance ₱0.00.
- **Action:** Void R-93.
- **Expected:** Balance ₱1,800.00.
- **Don't assert:** —

#### TC-14-F2: After the void, the remaining payment covers the oldest bill
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (statement). **Tags:** Gap G-1
- **Setup:** F1.
- **Expected:** Statement shows October "Paid" and November unpaid (or overdue by date); never November paid while October is unpaid.
- **Don't assert:** status words beyond REQ-009's.

#### TC-14-F3: The later receipt's file is unchanged
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** R-94 still reads "Association dues · November 2026"; same hash as before the void.
- **Don't assert:** —

#### TC-14-F4: The statement explains that receipts show how a payment was applied on the day it was issued
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Gap G-5
- **Expected:** "Receipts show how a payment was applied on the day it was issued." on the statement (when it shows: G-5).
- **Don't assert:** placement.

#### TC-14-F5: Voiding an overpayment whose credit was already used
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; homeowner (U-JUAN). **Tags:** —
- **Setup:** HH-B: ₱2,000.00 paid against ₱1,800.00; December ₱1,800.00 billed, ₱1,600.00 due.
- **Action:** Void the ₱2,000.00 payment.
- **Expected:** Balance ₱3,600.00; no credit shown.
- **Don't assert:** —

#### TC-14-F6: A void that leaves the household still in credit shows the credit, not a due amount
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; homeowner (U-KAREN). **Tags:** Gap G-11
- **Setup:** HH-K has ₱5,000.00 credit made of several receipts; void a ₱1,800.00 one.
- **Expected:** Statement "₱3,200.00 credit"; dashboard "₱0.00" with "₱3,200.00 credit"; the toast and dialog wording for a credit result pending G-11.
- **Don't assert:** toast text until G-11.

#### TC-14-F7: Voiding a partial payment restores the full bill
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; homeowner (U-ROBERTO). **Tags:** —
- **Setup:** HH-C: ₱1,000.00 against October.
- **Expected:** October owing ₱1,800.00 again; balance up by ₱1,000.00.
- **Don't assert:** —

#### TC-14-F8: The overdue warning reflects the void at once
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** R-93 paid a bill whose due date has passed.
- **Action:** Void R-93; open the dashboard.
- **Expected:** "1 month overdue · ₱1,800.00" appears (from the recalculated `openBills`), with no billing run.
- **Don't assert:** —

#### TC-14-F9: After any void, the statement's worked-out balance equals the stored balance
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (data check over F1–F7). **Tags:** Gap G-1 · Staging note: admin SDK
- **Expected:** For every household touched, `ledger.js` over bills and remaining approved payments equals `balanceCentavos`; `openBills` matches the unpaid periods; no "mismatch" report (REQ-009).
- **Don't assert:** which fields hold per-bill amounts (G-1).

#### TC-14-F10: A void changes no other household
**Priority** P1 · **Type** Security (data integrity) · **Layer** TBD — QE · **Writes** No
**Role:** none. **Tags:** —
- **Expected:** HH-M's bills, totals and notifications are byte-for-byte unchanged across the run.
- **Lane:** exclusive — asserts that nothing else changed.

## G. Which month a void counts in (decision 5, C1)

#### TC-14-G1: A void made in a later month reduces that month's total, not the receipt's month
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — SA-001 follow-up · Staging note: controllable server clock
- **Setup:** R-93 dated Nov 28; clock moved to Dec 3.
- **Action:** Void R-93.
- **Expected:** `voidPeriod` = 2026-12; `monthlyTotals/2026-12.duesCentavos` down by 180000; `monthlyTotals/2026-11` unchanged.
- **Don't assert:** the R2 collections screen (Blocked — R2).

#### TC-14-G2: A void at 23:59:59 Manila on the last day counts in that month; at 00:00:00 in the next
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: controllable server clock
- **Setup:** Two receipts; voids at Nov 30 23:59:59 and Dec 1 00:00:00 Manila (15:59:59 and 16:00:00 UTC).
- **Expected:** `voidPeriod` 2026-11 and 2026-12 respectively.
- **Don't assert:** —

#### TC-14-G3: A void in the same month as the receipt nets that month to zero
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** That month's `duesCentavos` is the same as before the approval.
- **Don't assert:** how REQ-023 displays it (R2).

#### TC-14-G4: A receipt from a closed month can be voided without reopening it
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Blocked — R2 (month closing, story 24) · Staging note: seed a closed `monthlyTotals/2026-10`
- **Setup:** October 2026 seeded closed with Dues ₱30,600.00; R-90 dated Oct 12; clock Nov 8.
- **Expected:** Void saved; October still ₱30,600.00 and closed; November down by ₱1,800.00.
- **Don't assert:** R2 screens.

#### TC-14-G5: A void whose month closes while it is saving is refused, and the retry counts in the new month
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — SA-001 follow-up · Staging note: seed November closed between read and commit
- **Expected:** First attempt: "Couldn't void. Try again."; nothing changed. Retry: saved with `voidPeriod` 2026-12.
- **Don't assert:** —

#### TC-14-G6: A void just after midnight on Jan 1 counts in January of the new year
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: controllable server clock
- **Expected:** Jan 1, 2027 00:00:05 Manila → `voidPeriod` 2027-01; Dec 31, 2026 23:59:55 → 2026-12.
- **Don't assert:** —

## H. Concurrency and stale screens

#### TC-14-H1: Pressing "Void payment" twice voids once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** One void; balance up by ₱1,800.00 once; one notification per member; one audit entry; one `monthlyTotals` decrement.
- **Don't assert:** —

#### TC-14-H2: When two treasurers void the same receipt, the second is told who did it
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS and S-TREAS-2, two sessions. **Tags:** Staging note: two sessions at once
- **Expected:** One void. The second sees "R-93 was already voided by ZZ Liza Santos. Nothing was changed." (or the other name if Mark won); totals moved once.
- **Don't assert:** which treasurer wins.

#### TC-14-H3: The same treasurer retrying after a dropped connection doesn't void twice
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-4 · Assumption: the callable's reply is lost after commit
- **Setup:** First call committed, reply dropped.
- **Action:** Press "Void payment" again.
- **Expected:** Nothing written a second time; the message is pending G-4 (success toast as in REQ-012's retry, or "already voided by ZZ Liza Santos").
- **Don't assert:** copy until G-4.

#### TC-14-H4: A homeowner with Dues & Payments open sees the void without reloading
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO) with the page open; treasurer voids. **Tags:** —
- **Expected:** Balance and the row update through the household listener; "Receipt PDF" then gives the void version.
- **Don't assert:** delay.

#### TC-14-H5: A void and an approval for the same household at the same moment both land correctly
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS voids R-93; S-TREAS-2 approves a new HH-A payment. **Tags:** Staging note: two sessions
- **Expected:** Final balance and bills equal a fresh recalculation over the remaining approved payments; `pendingCentavos` down only by the approved one.
- **Don't assert:** order of commit.

#### TC-14-H6: A treasurer whose role was removed while the receipt was open is refused
**Priority** P1 · **Type** Security (stale reference) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-2. **Tags:** —
- **Setup:** Detail open; role removed by `setRole`; token not yet refreshed.
- **Expected:** "Void payment" refused; nothing changes.
- **Don't assert:** message wording (not specified beyond "refused").

#### TC-14-H7: A stale screen still showing "Void" gets the conflict message
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-2 with R-93 open from before S-TREAS voided it. **Tags:** —
- **Expected:** "R-93 was already voided by ZZ Liza Santos. Nothing was changed."; the screen then shows "Void".
- **Don't assert:** —

## J. Roles and rules

All J cases assert the refusal explicitly.

#### TC-14-J1: Admin office staff see no "Void" and the server refuses them
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** —
- **Expected:** No payment detail with "Void" reachable; `voidReceipt` refused; nothing changes.
- **Don't assert:** —

#### TC-14-J2: Board members see no "Void" and the server refuses them
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-BOARD. **Tags:** —
- **Expected:** As J1.
- **Don't assert:** —

#### TC-14-J3: Guards and homeowners are refused
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-GUARD, U-CARLO. **Tags:** —
- **Expected:** `voidReceipt` refused for both.
- **Don't assert:** —

#### TC-14-J4: A signed-out or no-household caller is refused
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** anonymous, U-STRANGER. **Tags:** —
- **Expected:** Refused.
- **Don't assert:** —

#### TC-14-J5: The treasurer's own household's payment shows the note instead of "Void"
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO, treasurer view. **Tags:** —
- **Expected:** "This is your own household's payment. Another treasurer must void it." in place of "Void", same position.
- **Don't assert:** —

#### TC-14-J6: The server refuses a void of the caller's own household's payment
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO. **Tags:** —
- **Action:** Call `voidReceipt` for HH-T's payment directly.
- **Expected:** Refused; nothing changes. S-TREAS can void it.
- **Don't assert:** —

#### TC-14-J7: The server refuses a void by the payment's submitter
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** A treasurer who submitted the payment while a member and has since been removed from that household. **Tags:** Gap G-9 · Staging note: seed `submittedBy`
- **Expected:** Refused; which note the screen shows is G-9.
- **Don't assert:** the note.

#### TC-14-J8: No client can set a payment to voided
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS, U-CARLO. **Tags:** —
- **Action:** Client update of `payments/{id}` `status: voided` and `voidReason`.
- **Expected:** Refused; document unchanged.
- **Don't assert:** —

#### TC-14-J9: No client can change receipts, bills, household totals or monthly totals
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS. **Tags:** —
- **Expected:** Writes to `receipts`, `bills`, `households` totals and `monthlyTotals` refused.
- **Don't assert:** —

## K. The reference number stays used

#### TC-14-K1: Resubmitting a voided payment's reference is refused with the original date
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO, HH-A). **Tags:** —
- **Setup:** R-93 with reference "9000000000093" submitted on Manila today − 1, voided.
- **Action:** Submit a payment with reference "9000000000093".
- **Expected:** "This reference number was already submitted on {date}. Check the number on your screenshot."; no payment created.
- **Don't assert:** —

#### TC-14-K2: A void leaves the reference reservation in place
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none. **Tags:** Staging note: admin SDK
- **Expected:** `paymentRefs/9000000000093` still exists and points at R-93's payment.
- **Don't assert:** —

#### TC-14-K3: Another household submitting the voided reference is refused without the date
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-MARIA. **Tags:** —
- **Expected:** Refused with REQ-010's other-household message, which shows no date, lot or status.
- **Don't assert:** —

## L. Save failures

#### TC-14-L1: A lost connection shows how to recover, and keeps the reason
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: network cut before the call
- **Expected:** "Couldn't void. Nothing was changed. Check your connection and try again."; the dialog stays open with the typed reason.
- **Don't assert:** —

#### TC-14-L2: After a failed void nothing changed
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** none (data check). **Tags:** —
- **Expected:** Payment approved; balance, bills, totals, notifications and audit as before.
- **Don't assert:** —

#### TC-14-L3: Retrying after the connection returns voids once
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** One void with the kept reason.
- **Don't assert:** —

## M. Navigation and usability (WCAG 2.2 AA, 375 px)

#### TC-14-M1: Focus moves into the dialog and returns to the payment after closing
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, keyboard only. **Tags:** —
- **Expected:** On open, focus in the dialog (heading or reason box); Tab stays inside; after Cancel focus is on "Void"; after a void, on the payment's status or heading.
- **Don't assert:** —

#### TC-14-M2: The reason box has a visible label and a character counter
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Label "Reason"; a counter announcing characters used of 200.
- **Don't assert:** counter format.

#### TC-14-M3: The dialog fits 375 px with both buttons reachable
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer on a phone. **Tags:** DEF-001
- **Expected:** No sideways scroll; "Void payment" and "Cancel" visible with the on-screen keyboard open (scrolling within the dialog is fine).
- **Don't assert:** —

#### TC-14-M4: "Void" is shown with text and a strike-through amount, not colour alone
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner and treasurer. **Tags:** —
- **Expected:** A pill with the word "Void"; the amount struck through and still readable; meets 4.5:1 contrast.
- **Don't assert:** —

#### TC-14-M5: Buttons in the dialog and "Void" are at least 44 px
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Each target ≥ 44 × 44 px.
- **Don't assert:** —

#### TC-14-M6: After a void the treasurer stays on the payment detail showing "Void"
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** No jump to another payment (unlike "Approve and next"); Back returns to the list it came from.
- **Don't assert:** —

#### TC-14-M7: Refreshing after a void shows "Void", not "Void" offered again
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Status "Void"; no "Void" button.
- **Don't assert:** —

#### TC-14-M8: A non-treasurer can't open the void dialog by address
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-BOARD, U-CARLO. **Tags:** —
- **Action:** Open the treasurer's payment-detail address directly.
- **Expected:** The no-access page; no dialog.
- **Don't assert:** —

#### TC-14-M9: The "own household" note keeps the layout stable
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO. **Tags:** —
- **Expected:** The note sits where "Void" would be; nothing else shifts.
- **Don't assert:** —

#### TC-14-M10: Every screen uses "Void", never "delete" or "reverse"
**Priority** P3 · **Type** UI/UX (consistency) · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer and homeowner. **Tags:** —
- **Expected:** Dialog, toast, pill, history, notification and stamp say "Void"/"voided"; none says "delete", "deleted", "reverse" or "cancelled".
- **Don't assert:** —

#### TC-14-M11: No announcement pop-up interrupts the treasurer view mid-void
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO with an unread important announcement. **Tags:** —
- **Expected:** In the treasurer view no pop-up appears while voiding (REQ-017 "Staff are not interrupted").
- **Don't assert:** —

## N. Reinstating a mistaken void (decision 7, open)

#### TC-14-N1: The reinstatement script creates a new pending payment linked to the voided one
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Developer script; treasurer reads. **Tags:** Blocked — decision 7 · Staging note: script run
- **Expected (if decision 7 (a)):** A new pending payment with `reinstatedFrom` = the voided payment, same reference (recorded exception), same amount; it appears in Approvals; R-93 stays void.
- **Don't assert:** until decision 7.

#### TC-14-N2: The reinstated payment gets a new receipt number when approved
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Blocked — decision 7
- **Expected:** Approval issues the next number; R-93 is never reused.
- **Don't assert:** until decision 7.

#### TC-14-N3: Without the script, a homeowner can't get a voided reference reinstated through the app
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner, treasurer. **Tags:** Blocked — decision 7
- **Expected:** No screen offers undo; resubmission refused (K1).
- **Don't assert:** until decision 7.

## P. Integration

#### TC-14-P1: The dashboard balance tile shows the new balance after a void
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Cross-reference TC-15
- **Expected:** "₱1,800.00" and its due date; equal to the statement.
- **Don't assert:** —

#### TC-14-P2: The dashboard's recent payments show the voided payment as "Void"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Cross-reference TC-15 · Gap G-12
- **Expected:** The shared payment row shows "Void" (REQ-015's copy lists no "Void" status: G-12).
- **Don't assert:** —

#### TC-14-P3: The statement doesn't count the voided payment
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Cross-reference TC-09
- **Expected:** REQ-009's "Rejected and void payments are not counted" holds with a real void.
- **Don't assert:** —

#### TC-14-P4: The void notification opens Dues & Payments
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Gap G-3
- **Expected:** Tapping it opens Dues & Payments with the voided payment visible.
- **Don't assert:** route code.

#### TC-14-P5: Nightly reconciliation finds no drift after voids
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (job). **Tags:** Staging note: run the job
- **Expected:** The reconciliation job (R-11) reports no difference in balances, `pendingCentavos`, bills or `monthlyTotals` for households and months touched by voids.
- **Don't assert:** job schedule.

## X. Exploratory charters

#### TC-14-X1: 20 minutes trying to make the books disagree
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Two treasurers and a homeowner. **Tags:** —
- **Charter:** Void, approve, reject and submit on one household in random orders across two sessions, with dropped connections; after each step compare statement, dashboard, receipt files and stored totals. Time-box 20 min.

#### TC-14-X2: 15 minutes on the void dialog with keyboard, screen reader and phone
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Charter:** Use NVDA or VoiceOver, keyboard only, and a 375 px phone with the on-screen keyboard; paste long and odd reasons. Time-box 15 min.

---

## Cases that hinge on open decisions or later releases

| Open item | Who decides | Cases |
|---|---|---|
| Decision 7: reinstating a mistaken void | Owner | N1, N2, N3 |
| Decision 8: board notified of every void | Owner | A12 |
| D5 (decision 6): BIR accepts "stamp VOID, keep the number" | HOA board with its accountant | E1 (go-live only) |
| Accountant accepts C1 (void counts in the month made) | Treasurer with the accountant | G-block runs as approved; a change reopens it |
| Second treasurer named | HOA board | J5, J6 need S-TREAS as a second fixture; in production, HH-T's payments can't be voided without one |
| Month closing (story 24, R2) | — | G4 (seeded), G5 |
| S3 follow-ups not yet in SA-001 | Sol Arch | Every case tagged Provisional — SA-001 follow-up |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Void, happy path | 12 | 9 |
| B | Number never reused | 3 | 2 |
| C | Dialog and reason | 13 | 4 |
| D | Status gating | 5 | 3 |
| E | Voided receipt files | 10 | 5 |
| F | Balance recalculation | 10 | 7 |
| G | Month of the void | 6 | 2 |
| H | Concurrency, stale screens | 7 | 4 |
| J | Roles and rules | 9 | 7 |
| K | Reference stays used | 3 | 2 |
| L | Save failures | 3 | 2 |
| M | Navigation, usability | 11 | 0 |
| N | Reinstating (blocked) | 3 | 0 |
| P | Integration | 5 | 2 |
| X | Exploratory | 2 | 0 |
| **Total** | | **102** | **49** |

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | REQ-014 (and REQ-012) rewrite each bill's `paidCentavos`; REQ-009 r3 says per-bill paid amounts are **not stored** (one `households.paidCentavos` plus a prefix sum). Which design is built? The test asserts the observable result either way, but data-level cases need the answer | F2, F9, register row 7 |
| G-2 | Reason 5–200 characters is in Data changes only: no copy for 1–4 characters or for reaching 200, and whether "Void payment" stays disabled under 5 | C4, C7 |
| G-3 | REQ-011's catalogue (the copy of record for notifications) has no "Payment voided" row, and the board notice (decision 8) isn't there either; the route it opens isn't stated | A6, A12, P4 |
| G-4 | A retry by the same treasurer after a dropped reply: Data changes says "returns 'already voided' and writes nothing", but REQ-012's equivalent shows the success message. Which does the treasurer see, and does the conflict copy then name themselves? | H3 |
| G-5 | When does the statement show "Receipts show how a payment was applied on the day it was issued."? Always, or only once a household has a void? | F4 |
| G-6 | What a homeowner sees while `void.pdf` is preparing or failed, and confirmation that `getReceiptUrl` refuses rather than serving `issued.pdf` (shared with TC-13 G-9) | E6, E7 |
| G-7 | How the treasurer chooses between the issued and the void file (two buttons? labels?) | E3, E4 |
| G-8 | A new owner seeing a pre-link voided payment: does "Void: {reason}" show? The reason is free text about the previous owner's payment | E10 |
| G-9 | The submitter refusal has no on-screen note (only the own-household note exists), for a treasurer who submitted while a member and was then removed | J7 |
| G-10 | Voiding a payment of a deactivated household: REQ-012 says approval proceeds "because the money arrived"; REQ-014 is silent | D5 |
| G-11 | The toast "{lot}'s balance is back to {balance}" and the dialog "goes back up by" when the result is still a credit: what does {balance} read ("₱3,200.00 credit"?) | F6 |
| G-12 | REQ-015's recent-payments copy lists no "Void" status; confirm the shared row shows "Void" and the reason on the dashboard | P2 |
