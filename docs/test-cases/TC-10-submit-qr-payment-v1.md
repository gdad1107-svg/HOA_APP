# TC-10: Submit a QR payment for approval (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature ("Pay with QR" on Dues & Payments: amount, reference number, date paid and screenshot, all required; `submitPayment` with the reference reservation, client-made payment id, treasurer notifications and activity log in one transaction; screenshot compression and Storage rules; privacy after a sale, option (b)) |
| Source | [REQ-010 Submit a QR payment for approval](../requirements/REQ-010-submit-qr-payment.md), **Approved** 2026-11-28 (r5; r6 and r7 applied after approval), **Option A**; decision 3 **option (b)**, DPO to confirm; decision 5 the **₱100,000.00** cap; decision 6 `kind` always `dues` in R1 |
| Depends on / precedent | [REQ-007](../requirements/REQ-007-dues-and-payment-settings.md) (QR image, payee, `config/payment`, "QR not set up" message, `qrUploadId`), [REQ-009](../requirements/REQ-009-statement-of-account.md) (payment list, awaiting note, credit), [REQ-011](../requirements/REQ-011-in-app-notifications.md) (`paysub_{paymentId}_{uid}` notification, current role holders), [REQ-006](../requirements/REQ-006-activity-log.md) (activity entry names the lot, not the person), [REQ-012](../requirements/REQ-012-approve-or-reject-a-payment.md) (rejection frees the reference; decision 6 screenshot access), [REQ-013](../requirements/REQ-013-official-receipt-pdf.md) decision 6 ("Received from" = owner on file **at submission**), [REQ-014](../requirements/REQ-014-void-an-approved-payment.md) (a void does **not** free the reference), [REQ-003](../requirements/REQ-003-household-directory.md) (`displayName`, deactivation), [REQ-004](../requirements/REQ-004-invite-and-link.md) (membership, removal after a sale), [REQ-002](../requirements/REQ-002-roles-and-permissions.md) (staff can't use the form; treasurer-who-is-homeowner switch) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (**Open**: no viewport meta; the form is phone-first, see TC-10-N1). No other defect exists in this area |
| App version | **Anticipated.** No application code exists. Approved UX: screens 10A–10E of [req-005-011-mockup.html](../mockups/req-005-011-mockup.html). The mock-up's `FORMS.pay` (`index.html` line 1444) has no in-flight guard and accepts a used reference (backlog review finding 3); not ported (L-002) |
| Source files / functions touched (anticipated) | Callable `submitPayment`; the daily orphan clean-up job; Firestore rules for `payments`, `paymentPrivate`, `paymentRefs`, `notifications`, `auditLog`, `households` (`pendingCentavos`); Storage rules for `proofs/{householdId}/{paymentId}.jpg` (create-only, `uploaderUid` metadata, treasurer-role read); `config/payment.maxPaymentCentavos`; the Pay with QR form (compression to JPEG ≤ 1,000 px, HEIC fallback, upload progress, client-made id); `shared/domain/money.js`, `dates.js`, the reference normaliser; `notify()` helper |
| Architecture | SA-001 **Final** (r3) Flow 1, §4.2, §4.3 point 5, R-12, R-16; CODING-STANDARDS CS-5, CS-8, CS-12, CS-14. REQ-010's Sol Arch review changes Flow 1 (payment split into `payments` / `paymentPrivate`; `paymentRefs` without status, deleted on rejection; client-made id). SA-001 has not absorbed these, so cases naming them are tagged **Provisional — SA-001 follow-up** |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions, Storage) or `hoa-portal-staging` only. Never production.** Screenshots are invented images (a fixture "ZZ TEST PAYMENT" confirmation), never a real payment screenshot. Both brands. Real-device cases (iPhone Safari and Chrome, Android) on staging |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. |

**Tags used on cases**

- **Provisional — SA-001 follow-up**: asserts a field, collection, function or rule named in REQ-010's Data changes (approved) that SA-001 Final does not yet describe.
- **Blocked — provider question**: REQ-010 Open questions, "before build": if reference numbers repeat across e-wallets, the key becomes `{provider}_{ref}` and the form gains a provider field. The case stands for the single-key design; re-check when the treasurer answers.
- **Blocked — DPO**: decision 3 (b) awaits the DPO's confirmation (including a removed owner keeping her own screenshots).
- **Gap G-n**: expected result depends on a requirement gap listed at the end; QE must not automate it until the BA answers.
- **Staging note**: special set-up (controllable clock, two sessions or devices at once, network throttling or a dropped reply, Admin SDK reads of function-only collections, a real phone).

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Homeowner** (linked member) | Submits payments for their own lot; sees the payment list; sees their own screenshot and full reference |
| **Second member of the same lot** | Sees the payment's date, amount, "ref …last 4" and status; **not** the screenshot or full reference (decision 3 (b), r6) |
| **New owner after a sale** | Sees earlier payments as date, amount, status, "Made before you joined"; no screenshot, reference or receipt |
| **Removed previous owner** | Keeps access to her **own** screenshots (DPO to confirm); no access to the lot |
| **Treasurer** (`treasurer`) | Receives "{lot} submitted a payment of {amount}."; reads every screenshot and `paymentPrivate`; can't submit through the form for a lot they're not a member of |
| **Admin office** (`admin`) | Reads payment summaries and `paymentPrivate` (staff); **no screenshot access**; can't submit; gets no submission notification |
| **Board** (`board`) | No `paymentPrivate`, no screenshots in R1; reads the activity log |
| **Guard** (`guard`) | Nothing |

### Test fixtures (invented; QE maps them to `.env`)

Same fixture set as TC-09 to TC-12 (see [TC-09](TC-09-statement-of-account-v1.md#test-fixtures-invented-qe-maps-them-to-env) for the full table). Used here:

| Fixture | Lot | Owner on file | Members | Starting state |
|---|---|---|---|---|
| **HH-P** | Blk 5 Lot 1 | ZZ Carlo Reyes | U-CARLO, U-CARLO-2 | Owes ₱1,800.00 (November 2026) |
| **HH-A** | Blk 2 Lot 7 | ZZ Ana Reyes → ZZ Ben Torres | U-ANA (removed in sale cases), U-BEN, U-BEN-2 | Sale fixture |
| **HH-M** | Blk 1 Lot 3 | ZZ Maria Santos | U-MARIA | The other lot |
| **HH-X** | Blk 9 Lot 3 | ZZ Xavier Other | U-XAVIER | Owns a payment with REF-X |
| **HH-F** | Blk 2 Lot 10 | ZZ Carmela Cruz | S-TREAS-HO | Treasurer's own household |
| **HH-Z** | Blk 8 Lot 2 | ZZ Zero Bills | U-ZERO | Balance ₱0.00 |
| **HH-D** | Blk 7 Lot 1 | ZZ Dora Deactivated | U-DORA | Deactivated during the case |

Staff: S-TREAS (ZZ Liza Santos), S-TREAS-2 (ZZ Mark Tan), S-TREAS-HO (ZZ Carmela Cruz, member of HH-F), S-TREAS-REMOVED (treasurer role removed during the case), S-ADMIN (ZZ Paolo Aquino), S-BOARD, S-GUARD. U-STRANGER: no household, no role. U-RACE-01…10: ten sessions of members of HH-P for parallel submits (or ten tokens for U-CARLO).

References: **REF-1** `4012883219554` (typed `4012 8832 1955 4`); **REF-2** `GCASH-77ZZ01`; **REF-X** `ZZTEST990011` (HH-X). Images: **IMG-OK** 1,200 × 2,400 PNG 800 KB; **IMG-BIG** JPEG 15.1 MB; **IMG-15** JPEG exactly 15 MB (15 × 1,048,576 bytes; G-6); **IMG-HEIC** a HEIC file; **IMG-PDF** a PDF; **IMG-BROKEN** a `.jpg` with corrupt data. "Today" is built from local Manila today; Dec 3, 2026 below shows the arithmetic (controllable clock).

### Round-trip register

Homeowner submits → treasurer reviews (REQ-012) → household reads. One row per field or status value.

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | `payments.amountCentavos` | `submitPayment`, homeowner's form | Homeowner: list row "₱1,800.00"; treasurer: Approvals card and review (REQ-012); treasurer notification "{amount}" | B2, B6 |
| 2 | `payments.refLast4` | `submitPayment` | Homeowner and other members: "ref …9554"; activity log "ref ending 9554"; notifications (REQ-012) | B2, B9 |
| 3 | Full reference (as typed and normalised) in `paymentPrivate` | `submitPayment` | Treasurer: review screen "Reference number" (REQ-012). Submitter: "full number shown to the submitter" (where: Gap G-3). Other members: **deliberately not shown** | K5, K6 |
| 4 | `payments.datePaid` | `submitPayment` | Treasurer: review "Date paid"; homeowner list row date (Gap G-10 in TC-09) | B2 |
| 5 | `payments.status = pending` | `submitPayment` | Homeowner: "Pending approval"; treasurer: Approvals queue | B2 |
| 6 | `payments.submittedAt` (server) | `submitPayment` | Treasurer: "Submitted {date}"; the screen's "Made before you joined" rule; REQ-012 "Needs another treasurer" age | B4, K-block |
| 7 | `payments.submittedBy` (uid) | `submitPayment` | Treasurer: review "Submitted by" (name resolved, REQ-012); `paymentPrivate` read rule; screenshot is matched via Storage metadata instead | B4, K3 |
| 8 | `payments.kind = dues` | `submitPayment` (allow-list) | Treasurer: Approvals shows it applied to dues, oldest bill first (REQ-012); `decidePayment` refuses other kinds | B7, J9 |
| 9 | `paymentPrivate.receivedFromName` (owner on file at submission) | `submitPayment`, copied from `households.displayName` | Homeowner and treasurer: receipt "Received from" (REQ-013, via REQ-012's receipt snapshot) | B8, I6 |
| 10 | `paymentPrivate.qrUploadId` | `submitPayment`, from the QR the form showed | Treasurer: "Paid using the QR code replaced on {date}" when not current (REQ-012) | I3, I4 |
| 11 | `paymentPrivate.proofPath` and the Storage object (`uploaderUid` metadata) | Homeowner's upload; `submitPayment` stores the path | Treasurer: review screenshot; uploader: own screenshot (where shown: Gap G-3). Other members, admin, board, guard: **refused** | G-block, K1–K4 |
| 12 | `paymentRefs/{normalisedRef}` `{paymentId, householdId}` | `submitPayment`; deleted by `decidePayment(reject)` | Functions only: next `submitPayment` reads it to choose the duplicate message. **Deliberately not readable** by clients | C-block, J6 |
| 13 | `households.pendingCentavos` | `submitPayment` (+), `decidePayment` (−) | Homeowner: "₱1,800.00 awaiting approval" (REQ-009), dashboard (REQ-015) | B3 |
| 14 | Notification `paysub_{paymentId}_{uid}` per current treasurer | `submitPayment`, same transaction | Each treasurer: bell "{lot} submitted a payment of {amount}." opening Approvals (REQ-011) | B5, B6 |
| 15 | `auditLog` `payment.submitted` (amount, last 4) | `submitPayment` | Treasurer, board, admin office: activity log "Blk 5 Lot 1 submitted ₱1,800.00 (ref ending 9554)" (REQ-006) | B9 |
| 16 | Typed values kept after an error | The form (browser state) | Homeowner: fields still filled after any error | D-block, H2 |

No read-back cell is empty.

### Reference reservation: status enumeration

Rule under test: a normalised reference is refused while its reservation exists; the payment it points to decides the message (dated only for the same household); rejection deletes it; approval and void keep it.

| Reservation state ↓ / submitter → | Same household, other member | Same household, same person, **same payment id** (retry) | Different household | Message |
|---|---|---|---|---|
| None | Accepted (B1) | n/a | Accepted (B1) | Success toast |
| Points at a **pending** payment | Refused, dated "…waiting for the treasurer" (C2) | **Success**, same payment returned (H4) | Refused, undated (C3) | C2 / C3 |
| Points at an **approved** payment | Refused, dated "Check the number on your screenshot" (C1) | Success (H4 variant, P3) | Refused, undated (C3) | C1 / C3 |
| Points at a **void** payment (REQ-014: not freed) | Refused (C5; which dated message, Gap G-1) | n/a | Refused, undated (C5) | G-1 |
| **Deleted** because its payment was rejected | Accepted as a new pending payment (C4) | n/a | Accepted (C4) | Success |
| Points at a payment id that does not exist (orphan, failed write) | Gap G-2 (C12) | — | Gap G-2 | G-2 |

---

## Test plan

### 1. Smoke

The standing smoke pass loads the mock-up's Dues & Payments only. **Smoke additions for QE:**

1. A linked homeowner sees **"Pay with QR"** on Dues & Payments with the QR labelled "SCAN TO PAY", the payee line, the three steps and the four fields, when a QR is set up.
2. With no QR set up, Dues & Payments shows "Online payment isn't set up yet. Pay at the admin office for now." and no form.
3. A fixture payment submitted through the form appears in the homeowner's list as "Pending approval" (the one write in smoke; uses a unique fixture reference per run).

### 2. Acceptance

| REQ-010 scenario | Cases |
|---|---|
| Submit a payment | A1, A5, B1, B2, B3, B4, B5, B6, B8, B10, B11 |
| Pressing twice creates one payment | H1, H2 |
| A reference number already submitted and approved for the same lot | C1, C10 |
| A reference number waiting for approval for the same lot | C2 |
| A reference number used by another lot reveals nothing about it | C3 |
| Two people submit the same reference at the same moment | C6, C7, C8 |
| A rejected payment's reference can be used again | C4 |
| Spaces and dashes in the reference don't matter | C9 |
| A missing screenshot keeps what was typed | G1 |
| An unusable file | G2, G3 |
| Invalid amounts | D1–D8 |
| Paying more than is owed | A6, A7 |
| Nothing is owed | A3 |
| A date in the future or too far back | E1–E6 |
| Reference number format | F1–F7 |
| An image type the phone can't read | G5, G6 |
| The connection drops while sending | H3, H5 |
| The payment was saved but the reply was lost | H4 |
| A lot that is no longer active | I1 |
| The QR code isn't set up | A8 |
| Only members of the household can submit for it | J1, J2 |
| Staff can't submit a payment through the homeowner form | J3, J4 |
| Every payment from this form is a dues payment (decision 6) | B7, J9 |
| A submission is logged | B9 |
| The payment records which QR code was shown | I3, I4 |
| A new owner sees the lot's balance but not the previous owner's payment details | K7, TC-09-E5, TC-09-E6 |
| Screenshots are seen only by the uploader and the treasurer | K1, K2, K3 |
| Other staff can't open a screenshot | K4 |

### 3. Regression

- **`paymentRefs` is one shared index** for dues and, from R3, amenity fees (REQ-031). The normaliser and reservation logic are reused by REQ-012 (free on reject) and REQ-014 (keep on void); re-run TC-12 block E and TC-14's "reference stays used".
- **Household totals**: `pendingCentavos` feeds REQ-009's awaiting note and REQ-015's dashboard tile; re-run TC-09 B2/B3 and the dashboard pending scenario.
- **Notifications**: `submitPayment` is the first writer of staff notifications through `notify()`; re-run TC-11 blocks C (catalogue), D (recipients) and H (deterministic ids).
- **Storage rules**: first user-uploaded files in the project. The QR image path (REQ-007, `config/payment-qr.png`) shares the rules file; re-run TC-07's "Storage refuses an upload to the QR image path" for admin and homeowner.
- **Membership checks** (`isMember`, `members/{hh}_{uid}`) from TC-04: removal after a sale must also stop submits and Storage uploads (I2, J7).
- **Activity log**: new action `payment.submitted`; REQ-006's "homeowner's own action names the lot, not the person" (TC-06).
- **QR settings**: `qrUploadId` ties a payment to the QR shown; REQ-007's replace flow (TC-07) must keep the previous image so the treasurer's "replaced on {date}" line can be worked out.
- **Open defect DEF-001**: phone layout.

**Existing specs and screens QE should re-run:** `smoke.spec.js` SMK-owner-dues (or its successor); `navigation.spec.js` NAV-03, NAV-05 (important announcement pop-up over the form), NAV-06 (Escape on modals), NAV-07/08 (375 px); TC-04 K-block (removal) and M-block; TC-07 QR upload and replace; TC-09 B, E; TC-11 C, D, H.

**Not affected:** sign-in methods (TC-01), invitation codes (TC-04 B–I), billing run (TC-08) except through `pendingCentavos` not being touched by billing, guard screens.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Payment submitted for checking", "We'll notify you…", "Nothing was saved", "Your details are kept", "You don't need to send it again" | B1, H3, D9, C2, P1 |
| A value written for one role, never shown back | Yes: `receivedFromName`, `qrUploadId`, full reference, `submittedBy` | Register rows 3, 7, 9, 10 |
| Status-gated rule checked for one transition only | Yes: reservation against pending, approved, void, rejected, orphan | Reservation enumeration; C-block |
| Same concept, different word on another screen | Yes: "Pending approval" vs "awaiting approval"; "Proof of payment" vs "screenshot"; never "paid" | P1, P2 |
| Dates computed in UTC where the user means local | Yes: "Date paid" default, future and 90-day limits | A5, E1–E6 |
| A derived figure doesn't refresh after a related write | Yes: `pendingCentavos`, Approvals badge, treasurer bell | B3, B10, B5 |
| Zero and "not set" look the same | Yes: balance ₱0.00 vs no QR; amount 0 vs empty | A3, A8, D1, D2 |
| A write silently refused by security rules | Yes: Storage and Firestore refusals asserted explicitly | J-block, K-block |
| Double-tap / two devices create duplicates | Yes: double press, retry, two members, ten parallel | H1, H4, C6, C7 |
| Stale reference | Yes: lot deactivated, member removed, QR replaced while the form is open | I1, I2, I3 |
| Backdrop click loses work or leaves stale state | Yes: switching to the e-wallet app and back; the file picker cancelled | H6, G9 |
| A modal appearing mid-flow blocks the next action | Yes: important announcement pop-up while the form is filled | M6 |
| Assumed SDK/network behaviour baked into a case | Yes: offline upload, lost reply, HEIC decoding per browser | H3, H4, G5, G7 (assumptions marked) |
| Data leaking across households or roles | Yes: duplicate message across lots, screenshots, full reference, previous owner | C3, K-block, J-block |

### Scenario list by mandatory type

- **Negative**: used, pending, void and another lot's references; missing screenshot; wrong file types and sizes; unreadable images; invalid amounts, dates and reference formats; inactive lot; removed member; non-member, staff, board, guard, signed-out submitters; non-dues kind; direct client writes; screenshot reads by spouse, admin, board, new owner. C1–C5, D-block, E-block, F-block, G1–G6, I1, I2, J-block, K-block.
- **Boundary**: amount ₱0.01 and ₱100,000.00 vs ₱100,000.01; 2 vs 3 decimals; date today vs tomorrow, 90 vs 91 days back, Manila midnight; reference 5/6 and 40/41 characters (typed vs normalised); image exactly 15 MB; 24-hour orphan boundary; ₱0.00 owed; owed minus pending. D3–D6, E1–E5, F1–F4, G4, S4, A3, A4.
- **Usability**: labels, input modes, attach button with name and thumbnail, upload progress, errors under each field and announced, typing kept after every error, 44 px targets, single column at 375 px, long-press save of the QR, stable layout for the over-payment hint. N-block.
- **Navigation**: Dues & Payments from the menu and the dashboard; success stays on the page with the row; switching apps and back; refresh mid-form; treasurer-who-is-homeowner switch; staff can't reach the form; deep link. M-block.

---

## A. Form, pre-fill and QR

#### TC-10-A1: Amount is pre-filled with what is owed and Date paid with Manila today
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: controllable clock
- **Setup:** HH-P owes ₱1,800.00, nothing pending; QR set up; today Dec 3, 2026 Manila.
- **Expected:** "Amount" reads "1,800.00"; "Date paid" reads Dec 3, 2026.
- **Don't assert:** the date control's native format.

#### TC-10-A2: Amount pre-fill subtracts what is already awaiting approval
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** HH-P owes ₱3,600.00 with ₱1,800.00 pending.
- **Expected:** "Amount" is pre-filled with "1,800.00" (never more than balance minus pending).
- **Don't assert:** —

#### TC-10-A3: Nothing owed pre-fills the monthly dues and says so
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ZERO). **Tags:** —
- **Setup:** HH-Z balance ₱0.00 (or in credit); monthly dues ₱1,800.00.
- **Expected:** "Amount" reads "1,800.00"; the form reads "You don't owe anything right now. You can still pay ahead."
- **Don't assert:** —

#### TC-10-A4: Owed amount fully covered by pending payments pre-fills what
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Gap G-4
- **Setup:** HH-P owes ₱1,800.00 with ₱1,800.00 pending.
- **Expected (pending G-4):** balance minus pending is ₱0.00; the pre-fill is either the monthly dues or empty, and the "You don't owe anything" line does not show (the homeowner does owe).
- **Don't assert:** until G-4 is answered.

#### TC-10-A5: Date paid defaults to the Manila date just after midnight
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: controllable clock; device time zone UTC
- **Setup:** Dec 4, 2026 00:30 Manila (Dec 3 in UTC).
- **Expected:** "Date paid" defaults to Dec 4, 2026.
- **Don't assert:** —

#### TC-10-A6: Paying more than owed shows the credit hint and still submits
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** HH-P owes ₱1,800.00.
- **Action:** Enter 3600, complete the form, submit.
- **Expected:** The hint "That's ₱1,800.00 more than you owe. Once approved, the extra is kept as credit for your next bills." shows; the submit succeeds as Pending approval.
- **Don't assert:** —

#### TC-10-A7: The over-payment hint reserves its line so the button doesn't move
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Action:** Type 1800, then 3600, then 1800.
- **Expected:** The "Submit for approval" button's position does not change as the hint appears and disappears.
- **Don't assert:** —

#### TC-10-A8: With no QR set up, the form is hidden and the office message shows
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** No QR uploaded (REQ-007).
- **Expected:** "Online payment isn't set up yet. Pay at the admin office for now."; no amount, reference, date or attach controls.
- **Don't assert:** —

#### TC-10-A9: The QR, payee line and steps show first, in order
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Card "Pay with QR": the QR labelled "SCAN TO PAY", "Pay to · {payee name} · {account label}", the three steps, then the fields; no "SAMPLE QR" anywhere.
- **Don't assert:** —

#### TC-10-A10: The QR image can be saved with a long press
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: real phone (Android Chrome, iPhone Safari)
- **Expected:** A long press on the QR offers "Save image" (it is a real `img`, not a CSS background or canvas).
- **Don't assert:** the browser's menu wording.

## B. Submit and what it saves

#### TC-10-B1: A complete form submits and shows the "submitted for checking" toast
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Action:** Enter reference "4012 8832 1955 4", attach IMG-OK, press "Submit for approval".
- **Expected:** "Payment submitted for checking. We'll notify you when the treasurer has checked it."
- **Don't assert:** toast duration.

#### TC-10-B2: The new payment shows in the list as pending with the last four digits
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup / Action:** As B1.
- **Expected:** The list shows "Dec 3, 2026 · ₱1,800.00 · ref …9554 · Pending approval" without a reload.
- **Don't assert:** —

#### TC-10-B3: The balance is unchanged and the awaiting note appears
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup / Action:** As B1.
- **Expected:** Balance still ₱1,800.00, with "₱1,800.00 awaiting approval" (REQ-009); `households/HH-P.pendingCentavos` rose by 180000.
- **Don't assert:** —

#### TC-10-B4: The payment summary holds the approved fields, with a server time and uid only
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (Admin SDK read after B1). **Tags:** Provisional — SA-001 follow-up
- **Expected:** `payments/{id}` has `householdId` HH-P, `kind` `dues`, `amountCentavos` 180000, `refLast4` "9554", `datePaid` 2026-12-03, `status` `pending`, `submittedAt` a server timestamp, `submittedBy` U-CARLO's uid; no name, email, full reference or proof path on the summary.
- **Don't assert:** the id's format.

#### TC-10-B5: Each current treasurer gets the submission notification
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS, S-TREAS-2, S-TREAS-HO. **Tags:** —
- **Setup / Action:** As B1.
- **Expected:** Each of the three treasurers has exactly one notification "Blk 5 Lot 1 submitted a payment of ₱1,800.00." with id `paysub_{paymentId}_{uid}`; S-ADMIN and S-BOARD have none.
- **Don't assert:** bell timing (TC-11).

#### TC-10-B6: Payment, reservation and notifications are saved together or not at all
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: fault injected in the notification write · Provisional — SA-001 follow-up
- **Action:** Submit with the notification write forced to fail inside the transaction.
- **Expected:** No `payments`, `paymentPrivate`, `paymentRefs` or notification document exists; `pendingCentavos` unchanged; the homeowner sees "We couldn't submit your payment. Nothing was saved. Try again." with typing kept.
- **Don't assert:** the server error code.

#### TC-10-B7: The payment is a dues payment
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Setup / Action:** As B1.
- **Expected:** `kind` is `dues`; the treasurer's Approvals shows it applied to dues, oldest bill first (REQ-012).
- **Don't assert:** the Approvals layout (TC-12).

#### TC-10-B8: The owner on file at submission is saved as the receipt name
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO-2 (a family member) submits. **Tags:** Provisional — SA-001 follow-up
- **Setup:** HH-P's owner on file "ZZ Carlo Reyes".
- **Action:** U-CARLO-2 submits.
- **Expected:** `paymentPrivate/{id}.receivedFromName` = "ZZ Carlo Reyes" (the owner on file), not U-CARLO-2's account name.
- **Don't assert:** —

#### TC-10-B9: The submission is logged by lot and last four digits
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer reads the activity log. **Tags:** —
- **Setup / Action:** As B1.
- **Expected:** One activity entry "Blk 5 Lot 1 submitted ₱1,800.00 (ref ending 9554)", action `payment.submitted`; it carries no person's name, full reference or proof path.
- **Don't assert:** the entry's timestamp format (TC-06).

#### TC-10-B10: The treasurer's Approvals count goes up by one
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (S-TREAS) with Approvals open. **Tags:** Gap G-5 · Staging note: two sessions
- **Setup:** Badge reads n.
- **Action:** U-CARLO submits.
- **Expected:** The badge reads n + 1 (after a reload at least; live update is G-5).
- **Lane:** exclusive — asserts the project-wide pending count on the Approvals badge.
- **Don't assert:** live update until G-5 is answered.

#### TC-10-B11: The payment records the QR code the form showed
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Provisional — SA-001 follow-up
- **Expected:** `paymentPrivate/{id}.qrUploadId` equals the id of the QR image the form rendered.
- **Don't assert:** —

#### TC-10-B12: A second payment with a different reference on the same day is accepted
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Action:** Submit REF-1, then REF-2 for ₱500.00.
- **Expected:** Two pending payments; awaiting note "₱2,300.00 awaiting approval"; two notifications per treasurer.
- **Don't assert:** —

## C. Reference reservation and duplicates

#### TC-10-C1: A reference already approved for the same lot is refused with its date
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** REF-1 belongs to an approved HH-P payment submitted Nov 25, 2026.
- **Action:** Submit "4012 8832 1955 4".
- **Expected:** Under the reference field: "This reference number was already submitted on Nov 25, 2026. Check the number on your screenshot."; no payment, reservation or notification created.
- **Don't assert:** —

#### TC-10-C2: A reference pending for the same lot is refused with "waiting for the treasurer"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Second member (U-CARLO-2). **Tags:** —
- **Setup:** REF-1 on an HH-P payment pending since Dec 2, 2026 (submitted by U-CARLO).
- **Action:** U-CARLO-2 submits REF-1.
- **Expected:** "This reference number was already submitted on Dec 2, 2026 and is waiting for the treasurer. You don't need to send it again."; nothing saved.
- **Don't assert:** —

#### TC-10-C3: A reference used by another lot is refused without date, lot or status
**Priority** P1 · **Type** Security (cross-household) · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** REF-X belongs to an HH-X payment (try with it pending, then approved).
- **Action:** U-CARLO submits "ZZTEST990011".
- **Expected:** "This reference number was already used. Check the number on your screenshot, or contact the treasurer."; the message and the function response contain no date, lot, household id or status; nothing saved.
- **Don't assert:** —

#### TC-10-C4: A rejected payment's reference can be used again
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO); Treasurer rejects. **Tags:** —
- **Setup:** REF-1 on an HH-P payment the treasurer rejected (REQ-012), so its reservation was deleted.
- **Action:** Submit REF-1 with the right amount.
- **Expected:** A new payment, "Pending approval"; the reservation now points at the new payment id; the rejected payment is unchanged.
- **Don't assert:** —

#### TC-10-C5: A void payment's reference stays used
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO); another lot (U-MARIA). **Tags:** Gap G-1
- **Setup:** REF-1 on an approved HH-P payment, then voided (REQ-014).
- **Action:** U-CARLO submits REF-1; U-MARIA submits REF-1.
- **Expected:** Both refused; nothing saved. U-MARIA sees the undated "already used" message. U-CARLO sees a dated message (REQ-014 expects the "approved" wording; REQ-010 defines none for void, G-1).
- **Don't assert:** U-CARLO's exact wording until G-1 is answered.

#### TC-10-C6: Two members submitting the same reference at once create exactly one payment
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO and U-CARLO-2. **Tags:** Staging note: two sessions at once
- **Action:** Both submit REF-1 at the same moment with different payment ids.
- **Expected:** Exactly one payment and one reservation; the other sees the "already submitted … waiting for the treasurer" message; `pendingCentavos` rose once; each treasurer has one notification.
- **Don't assert:** which member wins.

#### TC-10-C7: Ten parallel submits of one reference create one payment
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-RACE-01…10 (members of HH-P). **Tags:** Staging note: parallel callers
- **Action:** Ten `submitPayment` calls with REF-1 and ten different payment ids at once.
- **Expected:** Exactly one `payments` document with REF-1; nine refusals; one reservation; `pendingCentavos` up by one amount.
- **Don't assert:** which call wins.

#### TC-10-C8: Negative control: ten parallel submits of ten different references all succeed
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** As C7. **Tags:** —
- **Expected:** Ten payments, ten reservations, `pendingCentavos` up by the sum.
- **Don't assert:** order.

#### TC-10-C9: Spaces, dashes and letter case don't make a new reference
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Setup:** "4012883219554" already submitted; "GCASH-77ZZ01" already submitted.
- **Action:** Submit "4012-8832-1955-4", " 4012 8832 1955 4 ", "gcash 77zz01".
- **Expected:** Each is treated as the existing reference and refused.
- **Don't assert:** —

#### TC-10-C10: A refused duplicate keeps amount, date and screenshot
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** As C1.
- **Expected:** After the refusal the amount, date and attached screenshot (name and thumbnail) are still there; only the reference field shows the error.
- **Don't assert:** —

#### TC-10-C11: An approval leaves the reservation in place
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (data check after a REQ-012 approval). **Tags:** Provisional — SA-001 follow-up
- **Expected:** `paymentRefs/4012883219554` still exists and points at the approved payment.
- **Don't assert:** —

#### TC-10-C12: A reservation pointing at a payment that doesn't exist
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-2 · Staging note: orphan reservation seeded by the Admin SDK
- **Expected (pending G-2):** the submit is not refused forever with a misleading message; either it is accepted (stale reservation replaced) or refused with the undated message and logged.
- **Don't assert:** until G-2 is answered.

#### TC-10-C13: Reference collisions across providers
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO) and another lot (U-MARIA). **Tags:** Blocked — provider question
- **Setup:** Two different e-wallets issue the same reference number to two lots.
- **Expected (single-key design):** the second is refused with the undated message. If the treasurer says references repeat across providers, this case is rewritten for `{provider}_{ref}` and a provider field.
- **Don't assert:** until the treasurer answers.

## D. Amount validation

#### TC-10-D1: Amount 0 is refused with the amount message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Enter the amount you paid, more than ₱0, with at most 2 decimal places" under Amount; nothing uploaded or saved.
- **Don't assert:** —

#### TC-10-D2: An empty amount is refused with the same message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** As D1.
- **Don't assert:** —

#### TC-10-D3: Three decimal places are refused; two are accepted
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "1800.555" refused with the amount message; "1800.55" and "1800.5" accepted (as 180055 and 180050 centavos).
- **Don't assert:** —

#### TC-10-D4: ₱0.01 is the smallest accepted amount
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Expected:** "0.01" is accepted and saved as 1 centavo.
- **Don't assert:** —

#### TC-10-D5: ₱100,000.00 is accepted; ₱100,000.01 is refused with the limit message
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Expected:** "100000" and "100,000.00" accepted; "100000.01" and "180000" show "That's more than ₱100,000.00. Check the amount, or pay at the admin office."
- **Don't assert:** —

#### TC-10-D6: The limit comes from `config/payment.maxPaymentCentavos`
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: config value changed by the developer script · Provisional — SA-001 follow-up
- **Setup:** Set the limit to ₱50,000.00.
- **Expected:** ₱50,000.01 is refused on screen and by the function, and the message reads "That's more than ₱50,000.00…".
- **Don't assert:** —

#### TC-10-D7: The submit function refuses the same bad amounts sent directly
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, scripted call. **Tags:** Provisional — SA-001 follow-up
- **Action:** Call `submitPayment` with `amountCentavos` 0, −100, 1800.5 (not an integer), 10000001, a string, and missing.
- **Expected:** Every call refused; no payment, reservation, Storage reference or notification remains.
- **Don't assert:** error codes.

#### TC-10-D8: Commas, a peso sign and spaces in the amount
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Gap G-7
- **Action:** Type "1,800.00", "₱1800", " 1800 ".
- **Expected (pending G-7):** "1,800.00" is accepted (the pre-fill itself uses a comma); the others either accepted as 1800 or refused with the amount message.
- **Don't assert:** the "₱" and space handling until G-7 is answered.

#### TC-10-D9: Every amount error keeps the reference, date and screenshot
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** After D1, D3 or D5 errors, reference, date and screenshot stay filled.
- **Don't assert:** —

## E. Date paid validation (Asia/Manila)

#### TC-10-E1: Today is accepted
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: controllable clock
- **Expected:** Dec 3, 2026 accepted when today is Dec 3, 2026 Manila.
- **Don't assert:** —

#### TC-10-E2: Tomorrow is refused as a future date
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: controllable clock
- **Expected:** Dec 4, 2026 shows "The date paid can't be in the future."
- **Don't assert:** —

#### TC-10-E3: Exactly 90 days back is accepted; 91 days back is refused
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: controllable clock · Gap G-8
- **Setup:** Today Dec 3, 2026.
- **Expected (pending G-8 on whether day 90 is inside):** Sep 4, 2026 (90 days back) accepted; Sep 3, 2026 (91 days back) shows "For payments older than 90 days, contact the treasurer."
- **Don't assert:** the day-90 outcome until G-8 is answered; assert 91 refused and 89 accepted.

#### TC-10-E4: Just after Manila midnight, the new Manila day is "today" for the server too
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: controllable clock
- **Setup:** Dec 4, 2026 00:10 Manila (Dec 3, 16:10 UTC).
- **Action:** Submit with Date paid Dec 4, 2026.
- **Expected:** Accepted by the screen and by `submitPayment` (not refused as future by a UTC check).
- **Don't assert:** —

#### TC-10-E5: The submit function refuses future and too-old dates sent directly
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, scripted. **Tags:** Provisional — SA-001 follow-up
- **Action:** Call with `datePaid` tomorrow (Manila), 91 days back, an invalid date ("2026-02-30"), and missing.
- **Expected:** All refused; nothing saved.
- **Don't assert:** —

#### TC-10-E6: A form opened before midnight and submitted after keeps a valid date
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: controllable clock
- **Setup:** Open the form Dec 3, 23:58 Manila (default Dec 3).
- **Action:** Submit at Dec 4, 00:01.
- **Expected:** Accepted; `datePaid` is Dec 3 as shown.
- **Don't assert:** —

## F. Reference number format

#### TC-10-F1: Five characters are refused; six are accepted
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Expected:** "ZZ123" shows "Enter the reference number exactly as it appears on your confirmation (at least 6 characters)."; "ZZ1234" accepted.
- **Don't assert:** —

#### TC-10-F2: Forty characters are accepted; forty-one are refused
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Expected:** A 40-character alphanumeric reference accepted; 41 refused with the format message.
- **Don't assert:** —

#### TC-10-F3: Characters other than letters, numbers, spaces and dashes are refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Action:** "4012/8832", "REF#12345", "4012.8832.19", "ñ12345", an emoji.
- **Expected:** Each shows the format message; nothing uploaded.
- **Don't assert:** —

#### TC-10-F4: Length is counted on the typed or the normalised reference
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-9
- **Action:** "12-3-45" (7 typed, 5 normalised); a 40-character reference with 4 spaces (44 typed).
- **Expected (pending G-9):** screen and server agree with each other on both.
- **Don't assert:** which is accepted until G-9 is answered.

#### TC-10-F5: A reference of only spaces and dashes is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Action:** "------" and "      ".
- **Expected:** Refused with the format message (screen) and by the server.
- **Don't assert:** —

#### TC-10-F6: The submit function refuses bad references sent directly, length checked first
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, scripted. **Tags:** Provisional — SA-001 follow-up
- **Action:** Call with a 10,000-character reference, a 5-character one, one with "/" and a missing one.
- **Expected:** All refused; the 10,000-character call returns promptly (length checked before any pattern, no slow regex).
- **Don't assert:** exact timings.

#### TC-10-F7: Letters are accepted in a reference and the field allows them
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Expected:** "Reference number" has `inputmode="text"` (a phone shows a full keyboard); "GCASH-77ZZ01" is accepted.
- **Don't assert:** —

## G. Screenshot

#### TC-10-G1: Submitting without a screenshot shows the message and keeps the typing
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Attach the screenshot of your payment confirmation" under the attach field; amount, reference and date still filled; nothing saved.
- **Don't assert:** —

#### TC-10-G2: A PDF is refused before upload
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Action:** Attach IMG-PDF.
- **Expected:** "Attach a photo or screenshot (JPG or PNG)."; no Storage request is made.
- **Don't assert:** —

#### TC-10-G3: An image over 15 MB is refused before upload
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Action:** Attach IMG-BIG (15.1 MB).
- **Expected:** "That image is too large. Take a screenshot instead of a photo."; no Storage request.
- **Don't assert:** —

#### TC-10-G4: An image of exactly 15 MB
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-6
- **Action:** Attach IMG-15.
- **Expected (pending G-6: MB = 1,000,000 or 1,048,576 bytes, and "larger than"):** accepted and compressed.
- **Don't assert:** until G-6 is answered.

#### TC-10-G5: An image the browser can't decode is refused with the screenshot advice
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: desktop Chrome with IMG-HEIC; also IMG-BROKEN
- **Expected:** "We can't read this image type. Take a screenshot of your confirmation and attach that."; nothing uploaded; the raw file is never sent.
- **Don't assert:** —

#### TC-10-G6: An iPhone screenshot or photo attaches and uploads as JPEG
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: real iPhone, Safari and Chrome; a HEIC photo from the library and a PNG screenshot · Assumption: iOS hands the page a JPEG for `accept="image/*"` (Sol Arch: uncertain)
- **Expected:** Either the image uploads as JPEG, or the G5 message shows. Never a raw HEIC upload and never a silent failure. Record which happens per browser.
- **Don't assert:** which of the two (assumption).

#### TC-10-G7: An Android screenshot attaches and uploads
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: real Android, Chrome
- **Expected:** Uploads as JPEG; the thumbnail and file name show before submit.
- **Don't assert:** —

#### TC-10-G8: The upload is a JPEG of at most 1,000 px and 5 MB, with the uploader's uid
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** Provisional — SA-001 follow-up
- **Setup:** Attach IMG-OK (1,200 × 2,400 PNG).
- **Expected:** `proofs/HH-P/{paymentId}.jpg` exists with `contentType` `image/jpeg`, longest side ≤ 1,000 px, size ≤ 5 MB, `metadata.uploaderUid` = U-CARLO's uid; `paymentPrivate.proofPath` matches.
- **Don't assert:** exact byte size or JPEG quality.

#### TC-10-G9: Cancelling the file picker keeps the chosen screenshot
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** A screenshot attached.
- **Action:** Press "Change screenshot", then cancel the picker.
- **Expected:** The earlier screenshot is still attached (name and thumbnail).
- **Don't assert:** —

#### TC-10-G10: Upload progress shows on the button
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: throttled network
- **Expected:** The button reads "Uploading screenshot… {n}%" with n rising, then "Saving…", then the toast.
- **Don't assert:** the percentages seen.

## H. Double submit, network and retries

#### TC-10-H1: Pressing "Submit for approval" twice creates one payment
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Action:** Double-tap "Submit for approval".
- **Expected:** Exactly one payment, one reservation, one notification per treasurer; one toast.
- **Don't assert:** —

#### TC-10-H2: The button reads "Saving…" and is disabled until the save finishes
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: slow function
- **Expected:** While in flight the button is disabled and reads "Saving…" (after any upload progress); enabled again after an error.
- **Don't assert:** —

#### TC-10-H3: Going offline during upload shows the offline message, keeps details and saves nothing
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: network cut mid-upload · Assumption: the Storage SDK reports the failure rather than retrying silently
- **Expected:** "You're offline. Your details are kept. Press Submit again when you're back online."; amount, reference, date and screenshot kept; no `payments` document.
- **Don't assert:** whether a partial Storage object exists (cleaned up by S3/S4).

#### TC-10-H4: A saved payment whose reply was lost returns success on retry, not "already submitted"
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: drop the callable's response after commit
- **Action:** Press "Submit for approval" again (same payment id).
- **Expected:** "Payment submitted for checking. We'll notify you when the treasurer has checked it."; exactly one payment; no second notification; `pendingCentavos` rose once.
- **Don't assert:** —

#### TC-10-H5: Submitting again once back online creates exactly one payment
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: as H3
- **Action:** After H3, reconnect and press "Submit for approval".
- **Expected:** Exactly one payment; one screenshot object referenced by it.
- **Don't assert:** —

#### TC-10-H6: Switching to the e-wallet app and back keeps the form
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: real phone; tab may be unloaded by the OS · Gap G-10
- **Action:** Fill amount and date, switch to another app for a minute, return.
- **Expected (pending G-10):** the typed values are still there if the tab was kept; if the browser unloaded the tab, what is restored is G-10.
- **Don't assert:** restore after an unload until G-10 is answered.

#### TC-10-H7: A retry with the same payment id by a different person is refused
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO-2, scripted. **Tags:** Provisional — SA-001 follow-up
- **Setup:** U-CARLO's payment id P exists.
- **Action:** U-CARLO-2 calls `submitPayment` with id P and a different reference.
- **Expected:** Refused; P unchanged (create-only; "same id by the same person" is the only success path).
- **Don't assert:** —

#### TC-10-H8: A retry with the same id but changed details does not change the saved payment
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, scripted. **Tags:** Provisional — SA-001 follow-up
- **Action:** Call again with id P and a different amount.
- **Expected:** The stored amount is unchanged; the response is the existing payment or a refusal, never an overwrite.
- **Don't assert:** which response.

#### TC-10-H9: A server error says nothing was saved and keeps the typing
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: function forced to fail
- **Expected:** "We couldn't submit your payment. Nothing was saved. Try again."; all fields kept; no payment exists.
- **Don't assert:** —

## I. Stale state while the form is open

#### TC-10-I1: A lot deactivated after the form opened is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-DORA); Admin office deactivates. **Tags:** —
- **Setup:** U-DORA opens the form; S-ADMIN deactivates HH-D.
- **Action:** U-DORA submits.
- **Expected:** "This lot is no longer active. Contact the admin office."; nothing saved; the uploaded screenshot is deleted on the refusal path or by the daily job.
- **Don't assert:** which clean-up removes it.

#### TC-10-I2: A member removed after the form opened is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA; Admin office removes her from HH-A. **Tags:** Gap G-11
- **Setup:** U-ANA opens the form; S-ADMIN removes her (REQ-004).
- **Action:** U-ANA submits.
- **Expected:** Refused (membership re-checked in the transaction); nothing saved; Storage also refuses a new upload to `proofs/HH-A/`. Message wording is G-11.
- **Don't assert:** the message.

#### TC-10-I3: A form opened before the QR was replaced records the QR it showed
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO); Treasurer replaces the QR. **Tags:** Staging note: two sessions · Provisional — SA-001 follow-up
- **Setup:** U-CARLO opens the form; S-TREAS replaces the QR on Dec 2, 2026 (REQ-007).
- **Action:** U-CARLO submits.
- **Expected:** `qrUploadId` is the old QR's id; the treasurer's Approvals shows "Paid using the QR code replaced on Dec 2, 2026" (REQ-012).
- **Don't assert:** whether the homeowner's form is told of the new QR (not specified).

#### TC-10-I4: A form opened after the replacement shows no "replaced" line to the treasurer
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner; Treasurer. **Tags:** —
- **Expected:** `qrUploadId` is the current QR; the review shows no "Paid using the QR code replaced…" line.
- **Don't assert:** —

#### TC-10-I5: A QR removed or unset after the form opened
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-12
- **Expected (pending G-12):** REQ-007 has no "remove QR" action; if config is unset, the server's behaviour on submit is undefined.
- **Don't assert:** until G-12 is answered.

#### TC-10-I6: The owner on file is copied at submission even if it changes before approval
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner; Admin office edits the owner name. **Tags:** —
- **Setup:** HH-A owner on file "ZZ Ana Reyes"; U-ANA submits.
- **Action:** S-ADMIN changes the owner on file to "ZZ Ben Torres".
- **Expected:** `paymentPrivate.receivedFromName` still "ZZ Ana Reyes" (TC-12 checks the receipt).
- **Don't assert:** —

## J. Roles and rules

All J cases assert the refusal explicitly.

#### TC-10-J1: A homeowner of another lot can't submit for this lot
**Priority** P1 · **Type** Security (cross-household) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-MARIA (HH-M only), scripted. **Tags:** —
- **Action:** Call `submitPayment` with `householdId` HH-P.
- **Expected:** Refused; nothing saved for HH-P.
- **Don't assert:** —

#### TC-10-J2: Storage refuses an upload to another lot's proof folder
**Priority** P1 · **Type** Security (cross-household) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-MARIA. **Tags:** Provisional — SA-001 follow-up
- **Action:** Upload a JPEG to `proofs/HH-P/{newId}.jpg` with her own uid in metadata.
- **Expected:** Refused.
- **Don't assert:** —

#### TC-10-J3: A treasurer who isn't a member can't submit for the lot
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS, scripted. **Tags:** —
- **Expected:** `submitPayment` for HH-P refused; no form is shown to S-TREAS in staff views.
- **Don't assert:** —

#### TC-10-J4: Admin office, board and guard can't submit
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN, S-BOARD, S-GUARD, scripted. **Tags:** —
- **Expected:** Each `submitPayment` call refused; no Storage upload allowed to any `proofs/` path.
- **Don't assert:** —

#### TC-10-J5: Signed-out and no-household callers can't submit or upload
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Anonymous; U-STRANGER. **Tags:** —
- **Expected:** Calls and uploads refused.
- **Don't assert:** —

#### TC-10-J6: No client can read or write reference reservations
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, S-TREAS. **Tags:** Provisional — SA-001 follow-up
- **Action:** Get `paymentRefs/4012883219554`; list `paymentRefs`; create or delete one.
- **Expected:** All refused (otherwise anyone could test whether a reference exists).
- **Don't assert:** —

#### TC-10-J7: No client can create or change a payment or its details
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, S-TREAS, S-ADMIN. **Tags:** Provisional — SA-001 follow-up
- **Action:** Create `payments/{id}`; update an existing payment's `status` to `approved` or `amountCentavos`; write `paymentPrivate/{id}`; change `households/HH-P.pendingCentavos`.
- **Expected:** All refused; values unchanged.
- **Don't assert:** —

#### TC-10-J8: Storage refuses overwriting or deleting a screenshot, even by its uploader
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO. **Tags:** Provisional — SA-001 follow-up
- **Action:** Upload again to his existing `proofs/HH-P/{id}.jpg`; delete it.
- **Expected:** Both refused; original unchanged.
- **Don't assert:** —

#### TC-10-J9: The submit function refuses any kind other than dues in R1
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, scripted. **Tags:** —
- **Action:** Call with `kind` `amenityFee`, `""`, `"DUES"` and an unknown value.
- **Expected:** All refused; nothing saved. A call without `kind` either defaults to `dues` or is refused (record which).
- **Don't assert:** the no-kind outcome.

#### TC-10-J10: Storage refuses an upload with someone else's uid, a non-JPEG type or over 5 MB
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO. **Tags:** Provisional — SA-001 follow-up
- **Action:** Upload to `proofs/HH-P/{newId}.jpg` with `uploaderUid` = U-CARLO-2; with `contentType` `image/png`; with a 5.1 MB JPEG.
- **Expected:** All three refused.
- **Don't assert:** —

#### TC-10-J11: A treasurer who is also a homeowner submits for their own household
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO in "My household". **Tags:** Gap G-13
- **Action:** Submit a payment for HH-F.
- **Expected:** Accepted as pending. Whether S-TREAS-HO herself also gets the "{lot} submitted…" notification is G-13.
- **Don't assert:** her own notification until G-13 is answered.

#### TC-10-J12: A removed treasurer gets no submission notification
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-REMOVED. **Tags:** —
- **Setup:** Role removed (REQ-002) before U-CARLO submits.
- **Expected:** No `paysub_…_{S-TREAS-REMOVED uid}` document; the remaining treasurers get theirs.
- **Don't assert:** —

## K. Screenshot and detail privacy (decision 3 (b))

#### TC-10-K1: The uploader can open their own screenshot
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN (uploader, HH-A). **Tags:** Gap G-3
- **Expected:** Storage allows U-BEN to read his `proofs/HH-A/{id}.jpg`. Where the app shows it to him is G-3.
- **Don't assert:** the UI location.

#### TC-10-K2: Any treasurer-role holder can open the screenshot
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS, S-TREAS-2. **Tags:** —
- **Expected:** Both can read it.
- **Don't assert:** —

#### TC-10-K3: Another member of the household can't open the screenshot
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN-2 (spouse). **Tags:** —
- **Expected:** She sees the payment's date, amount, "ref …{last 4}" and status but no screenshot control; Storage refuses her read of the file.
- **Don't assert:** —

#### TC-10-K4: Admin office, board and guard can't open the screenshot
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-BOARD, S-GUARD. **Tags:** —
- **Expected:** No screenshot shown to S-ADMIN on any payment view; Storage refuses all three.
- **Don't assert:** —

#### TC-10-K5: Payment details are readable by the submitter and staff only
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN, U-BEN-2, S-TREAS, S-ADMIN, S-BOARD. **Tags:** Provisional — SA-001 follow-up
- **Action:** Read `paymentPrivate/{id}` of U-BEN's payment.
- **Expected:** Allowed for U-BEN, S-TREAS, S-ADMIN; refused for U-BEN-2 and S-BOARD.
- **Don't assert:** —

#### TC-10-K6: Other members never see the full reference number
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN-2. **Tags:** —
- **Expected:** Every screen shows "ref …{last 4}" only; the full reference does not appear in any response she can read.
- **Don't assert:** —

#### TC-10-K7: A new owner can't open the previous owner's screenshot
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN after the sale. **Tags:** Blocked — DPO
- **Setup:** U-ANA uploaded a screenshot for HH-A on Nov 25, 2026; she was removed Dec 10; U-BEN linked Dec 12.
- **Expected:** Storage refuses U-BEN's read of U-ANA's file; `paymentPrivate` of that payment refused (statement rows: TC-09-E5).
- **Don't assert:** —

#### TC-10-K8: A removed owner keeps access to her own screenshot
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA after removal. **Tags:** Blocked — DPO · Gap G-14
- **Expected:** Storage allows her read of her own file (metadata rule). How she reaches it without access to the lot is G-14.
- **Don't assert:** any UI path.

## M. Navigation

#### TC-10-M1: A homeowner reaches Pay with QR from Dues & Payments
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Dues & Payments" in the menu shows the statement and "Pay with QR" on the same page; the menu item is highlighted.
- **Don't assert:** whether Pay with QR is above or below the statement (mock-up order).

#### TC-10-M2: After a successful submit the homeowner stays on Dues & Payments with a fresh form
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Expected:** The page stays; the new row is visible; the form is reset (reference and screenshot cleared, amount re-pre-filled).
- **Don't assert:** scroll position.

#### TC-10-M3: Reloading mid-form loses no saved data and creates nothing
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** After a reload with the form half filled, no payment exists and the page loads cleanly.
- **Don't assert:** whether typing is restored (G-10).

#### TC-10-M4: Staff views never show Pay with QR
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS, S-ADMIN on a household's Statement. **Tags:** —
- **Expected:** No Pay with QR card on the staff statement.
- **Don't assert:** —

#### TC-10-M5: The treasurer-who-is-homeowner sees the form only in "My household"
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO. **Tags:** —
- **Expected:** "My household" → Dues & Payments shows the form for HH-F; the Treasurer view has no form.
- **Don't assert:** —

#### TC-10-M6: An important announcement pop-up doesn't lose the typing
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Setup:** An important announcement is published (REQ-017) while the form is half filled.
- **Expected:** If the pop-up appears, acknowledging it returns to the form with typing intact.
- **Don't assert:** whether it appears mid-session (REQ-017 shows it on sign-in).

## N. Usability and accessibility (WCAG 2.2 AA, 375 px)

#### TC-10-N1: At 375 px the form is one column with the button full-width at the bottom
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** DEF-001 must be fixed first
- **Expected:** QR and payee first, then steps, then fields in one column; "Submit for approval" full-width; no sideways scroll.
- **Don't assert:** spacing.

#### TC-10-N2: Every field has a visible label; placeholders are examples only
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Labels "Amount (₱)", "Reference number", "Date paid", "Proof of payment (screenshot)" are visible and programmatically tied to their inputs; the reference hint "Exactly as it appears on your confirmation, e.g. 4012 8832 1955 4" shows.
- **Don't assert:** —

#### TC-10-N3: Amount uses the decimal keypad
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** `inputmode="decimal"` on Amount.
- **Don't assert:** —

#### TC-10-N4: The attach control is a large labelled button showing the file name and a thumbnail
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Attach screenshot", at least 44 × 44 px; after choosing, the file name and a thumbnail show and the button reads "Change screenshot".
- **Don't assert:** —

#### TC-10-N5: Errors appear under their field, are announced and validate on blur
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (screen reader). **Tags:** —
- **Expected:** Leaving a bad field shows its error under it (inline on blur); errors are associated (`aria-describedby`) and announced; focus moves to the first error on submit.
- **Don't assert:** —

#### TC-10-N6: Keyboard users can complete the form
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (keyboard). **Tags:** —
- **Expected:** Tab order: amount, reference, date, attach, submit; the file chooser opens with Enter/Space; focus is visible throughout.
- **Don't assert:** —

#### TC-10-N7: The success toast is announced
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (screen reader). **Tags:** —
- **Expected:** The toast is in a polite live region and stays long enough to read (WCAG 2.2.1 adjustable or ≥ 5 s plus the list row as a lasting record).
- **Don't assert:** duration.

#### TC-10-N8: A homeowner pays and submits on one phone in under two minutes
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: real phone, fixture e-wallet screenshot in the gallery
- **Charter-style check:** save the QR, open the gallery, return, type the reference, attach, submit. Note every point of hesitation.
- **Don't assert:** a time limit.

## P. Copy consistency

#### TC-10-P1: Nothing says "paid" or "received" for a submitted payment
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner, treasurer. **Tags:** —
- **Expected:** The toast, list row, notifications and awaiting note never say "paid" or "received" for a pending payment (SA-001 §4.3 point 5).
- **Don't assert:** —

#### TC-10-P2: Glossary terms are used throughout
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Reference number", "Proof of payment", "Pending approval", "Submit for approval" exactly; "Pending approval" (row) and "awaiting approval" (balance note) are used as the copy of record assigns them.
- **Don't assert:** —

## S. Logs, clean-up and data integrity

#### TC-10-S1: Function logs carry the payment id and last four digits only
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** Yes
**Role:** none (log read after C- and H-blocks). **Tags:** Staging note: function log access
- **Expected:** No log line contains a full reference number, a proof path, an email or a name (CS-14).
- **Don't assert:** log format.

#### TC-10-S2: A refused submit deletes its uploaded screenshot (best effort)
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Provisional — SA-001 follow-up
- **Setup:** A duplicate-reference refusal after the upload.
- **Expected:** The uploaded object is gone shortly after the refusal.
- **Don't assert:** timing.

#### TC-10-S3: The daily job deletes a screenshot older than 24 hours with no payment
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (job). **Tags:** Staging note: object seeded with an old timestamp
- **Setup:** An orphan object 24 h 1 min old; another 23 h 59 min old; one with a payment and 30 days old.
- **Expected:** Only the first is deleted.
- **Don't assert:** —

#### TC-10-S4: The daily job never deletes a screenshot that has a payment
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (job). **Tags:** —
- **Expected:** Every object referenced by a `payments` document (pending, approved, rejected, void) survives the job.
- **Don't assert:** —

#### TC-10-S5: The pending total equals the sum of pending payments
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (data check after the run). **Tags:** —
- **Expected:** For every fixture household, `pendingCentavos` = Σ `amountCentavos` of its `pending` payments.
- **Don't assert:** —

#### TC-10-S6: Every reservation points at a payment with the same household and reference
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (data check). **Tags:** Provisional — SA-001 follow-up
- **Expected:** For every `paymentRefs` document, the payment exists, has that `householdId`, its normalised reference equals the document id, and its status is pending, approved or void (never rejected).
- **Don't assert:** —

## X. Exploratory charters

#### TC-10-X1: 20 minutes trying to get two payments for one transfer
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Two members of one household on two phones. **Tags:** —
- **Charter:** Double-tap, airplane mode at each step, back button during upload, two tabs, reference variants (spaces, dashes, case, look-alikes O/0, I/1), reject-then-resubmit races. Time-box 20 min; note every duplicate or stuck state.

#### TC-10-X2: 15 minutes trying to learn about another lot's payments
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** U-MARIA with devtools. **Tags:** —
- **Charter:** Probe reference messages and response bodies, Storage paths, timing differences between "used" and "unused" references. Time-box 15 min.

---

## Cases that hinge on open decisions or drafts

| Open item | Who decides | Cases |
|---|---|---|
| Do reference numbers repeat across providers (before build) | Treasurer | C13; every C case if the key changes |
| DPO confirmation of decision 3 (b) | DPO | K7, K8 |
| Screenshot retention (SA-001 Q10) | DPO with the treasurer | No case yet; S3/S4 cover orphans only |
| SA-001 follow-up (split document, `paymentRefs` without status, client-made id) | Sol Arch | Every Provisional case |
| Gaps G-1 to G-14 | BA | As tagged |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Form, pre-fill, QR | 10 | 4 |
| B | Submit and what it saves | 12 | 9 |
| C | Reference reservation, duplicates | 13 | 8 |
| D | Amount validation | 9 | 5 |
| E | Date paid validation | 6 | 5 |
| F | Reference format | 7 | 4 |
| G | Screenshot | 10 | 6 |
| H | Double submit, network, retries | 9 | 5 |
| I | Stale state | 6 | 4 |
| J | Roles and rules | 12 | 10 |
| K | Screenshot and detail privacy | 8 | 7 |
| M | Navigation | 6 | 0 |
| N | Usability, WCAG 2.2 AA | 8 | 1 |
| P | Copy consistency | 2 | 0 |
| S | Logs, clean-up, data integrity | 6 | 2 |
| X | Exploratory | 2 | 0 |
| **Total** | | **126** | **70** |

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | A reference whose payment is **void** stays reserved (REQ-012, REQ-014), but REQ-010 defines dated messages for approved and pending only. REQ-014 expects the "approved" message ("…already submitted on Nov 27, 2026. Check the number on your screenshot."). Confirm for REQ-010 | C5 |
| G-2 | A reservation whose payment doesn't exist (a failed or partial write, or a payment deleted by a developer): what does `submitPayment` do? | C12 |
| G-3 | "The full number is shown only to the submitter and staff" and "the uploader can open the screenshot": on which homeowner screen? The list row shows "ref …9554" only | Register rows 3, 11; K1 |
| G-4 | Pre-fill when balance minus pending is ₱0.00 but the balance isn't: monthly dues, empty, or ₱0.00? And does "You don't owe anything right now" show? | A4 |
| G-5 | Does the treasurer's Approvals badge update live, or on the next load? | B10 |
| G-6 | "Larger than 15 MB": 15,000,000 or 15,728,640 bytes; is exactly 15 MB accepted? | G4 |
| G-7 | Amount typed with a comma (the pre-fill shows "1,800.00"), a "₱" or spaces: accepted or refused? | D8 |
| G-8 | "More than 90 days ago": is exactly 90 days back accepted? | E3 |
| G-9 | Reference length 6–40: counted on the typed text or after removing spaces and dashes? The screen and server must agree | F4 |
| G-10 | Typed values when the phone unloads the tab while the homeowner is in the e-wallet app (REQ-012 keeps the treasurer's reason in `sessionStorage`; REQ-010 says nothing). Is anything restored? | H6, M3 |
| G-11 | No copy of record for a submit refused because the person was removed from the lot after opening the form | I2 |
| G-12 | What the form and `submitPayment` do if the QR configuration is missing at submit time (no "remove QR" in REQ-007, but a config reset or failed replace) | I5 |
| G-13 | A treasurer who is also a homeowner submits for her own lot: does she get her own "{lot} submitted a payment" notification? | J11 |
| G-14 | A removed owner keeps read access to her own screenshots (Storage metadata rule), but she has no route to them once unlinked. Is a route intended, or is the access only a side effect (DPO)? | K8 |
