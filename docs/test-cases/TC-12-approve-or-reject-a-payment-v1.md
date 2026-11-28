# TC-12: Approve or reject a payment (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature (Approvals → Payments queue for treasurers, oldest first; one-at-a-time review with the screenshot; "Approve" issues a gap-free receipt number and updates the household's totals in one `decidePayment` transaction; "Reject" with a reason frees the reference number; self-approval, stale-screen and concurrency guards) |
| Source | [REQ-012 Approve or reject a payment](../requirements/REQ-012-approve-or-reject-a-payment.md), **Approved** 2026-11-28 (r4; r5 and r6 applied after approval), **Option A** (review screen, one payment at a time). Decision 7 (one-treasurer fallback) is **open** |
| Depends on / precedent | [REQ-002](../requirements/REQ-002-roles-and-permissions.md) (treasurer only, decision 3; removal "at once"), [REQ-006](../requirements/REQ-006-activity-log.md) (activity log, ids only), [REQ-010](../requirements/REQ-010-submit-qr-payment.md) (submitted payments, `paymentRefs`, `receivedFromName`, `qrUploadId`, screenshot rule), [REQ-011](../requirements/REQ-011-in-app-notifications.md) (one per linked member), [REQ-009](../requirements/REQ-009-statement-of-account.md) (ledger, credit, live balance), [REQ-013](../requirements/REQ-013-official-receipt-pdf.md) (receipt record and series `counters/or`, decisions 3, 4, 6), [REQ-014](../requirements/REQ-014-void-an-approved-payment.md) (a void never frees the reference; voids queue on the household), [REQ-015](../requirements/REQ-015-homeowner-dashboard.md) (reads `pendingCentavos`, `openBills`), [REQ-003](../requirements/REQ-003-household-directory.md) (deactivated households), [REQ-004](../requirements/REQ-004-invite-and-link.md) (members; sale), [REQ-023](../requirements/REQ-023-collections-by-month.md) (monthly totals by approval date, Manila) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (**Open**: no viewport meta; the treasurer's phone cards and thumb-reach buttons depend on it, see TC-12-K1). No other defect exists in this area |
| App version | **Anticipated.** No application code exists. Approved UX: screens 12A–12H of [req-012-017-mockup.html](../mockups/req-012-017-mockup.html). The mock-up's `approvePay` (`index.html` line 1369) never checks the current status, so a second click issues a second receipt number (SA-001 R-2, L-002); not ported |
| Source files / functions touched (anticipated) | Callable `decidePayment` (steps `assertCanDecide`, `resolveRepeat`, `allocate`, `buildReceipt`, `applyTotals`); `shared/domain/ledger.js` `allocate()`; `counters/or`; `receipts/{orNo}`; `monthlyTotals/{period}`; `paymentRefs` delete on reject; `notify()`; `auditLog`; Firestore rules for `payments`, `paymentPrivate`, `receipts`, `counters`, `paymentRefs`, `monthlyTotals`; Storage read of `proofs/…` for treasurers; the Approvals list, review route `#/approvals/payments/{id}`, reject dialog (`sessionStorage` for a typed reason) |
| Architecture | SA-001 **Final** (r3) §3, §4.2, Flow 1, §4.4 item 2, §8.1, R-2, R-11, R-12, R-16; CODING-STANDARDS CS-5, CS-8, CS-9, CS-12; LEARNINGS L-002, L-004. REQ-012's Sol Arch review and REQ-010's split document are not yet in SA-001: cases naming those fields or orders are tagged **Provisional — SA-001 follow-up** |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions, Storage) or `hoa-portal-staging` only. Never production.** Each project keeps its own `counters/or` (separate counters per project); receipt numbers below (OR-00092 …) are fixture values set by the developer script in the test project only. Screenshots are invented images |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. |

**Tags used on cases**

- **Provisional — SA-001 follow-up**: asserts a field, order of checks or document named in REQ-012 / REQ-010 Data changes that SA-001 Final does not yet describe.
- **Blocked — decision 7**: the one-treasurer fallback is open (recommended (a): the payment waits). The case stays in the plan; QE must not automate its expected result until the owner decides.
- **Blocked — DPO**: decision 6 (screenshots to the uploader and treasurer-role holders only) awaits the DPO.
- **Gap G-n**: expected result depends on a requirement gap at the end.
- **Staging note**: special set-up (two treasurer sessions, parallel callers, dropped replies, controllable clock, Admin SDK reads and seeds).

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Treasurer** (`treasurer`) | Sees Approvals with the pending count; reviews each payment with its screenshot; approves or rejects; can't decide their own household's or their own submitted payment |
| **Second treasurer** | Same; decides the first treasurer's household payments; races the first on the same payment |
| **Treasurer who is also a homeowner** (S-TREAS-HO) | Decides other households' payments; sees "This is your own household's payment…" on hers |
| **Treasurer whose role is removed mid-review** | Refused at once (role re-read in the transaction) |
| **Homeowner** (submitter) and **other members** | Read the outcome: status, receipt number, balance, reason, notification |
| **New owner after a sale** | Reads the outcome of a payment submitted before they joined, without its details (option (b)) |
| **Admin office** (`admin`) | No payment approvals in R1: no menu, server refuses; no screenshot access |
| **Board** (`board`) | No approvals; reads the activity log; would be notified under decision 7 (b) only |
| **Guard** | Nothing |

### Test fixtures (invented; QE maps them to `.env`)

Same fixture set as TC-09 to TC-12 ([TC-09 fixtures](TC-09-statement-of-account-v1.md#test-fixtures-invented-qe-maps-them-to-env)). Default for this document:

| Fixture | Lot | Owner on file | Members | Default state |
|---|---|---|---|---|
| **HH-P** | Blk 5 Lot 1 | ZZ Carlo Reyes | U-CARLO, U-CARLO-2 | U-CARLO submitted ₱1,800.00 with REF-1 on Nov 27, 2026 (**PAY-1**); balance ₱1,800.00 (November 2026) |
| **HH-CR** | Blk 6 Lot 4 | ZZ Rosa Credit | U-ROSA | Owes October and November 2026 at ₱1,800.00 each |
| **HH-A** | Blk 2 Lot 7 | ZZ Ana Reyes → ZZ Ben Torres | U-ANA, U-BEN | Sale fixture |
| **HH-F** | Blk 2 Lot 10 | ZZ Carmela Cruz | S-TREAS-HO | A pending payment submitted by S-TREAS-HO (**PAY-F**) |
| **HH-D** | Blk 7 Lot 1 | ZZ Dora Deactivated | U-DORA | A pending payment, household deactivated after submission |

Staff: **S-TREAS** ZZ Liza Santos, **S-TREAS-2** ZZ Mark Tan, **S-TREAS-HO** ZZ Carmela Cruz (member of HH-F), **S-TREAS-REMOVED** (role removed mid-case), **S-ADMIN** ZZ Paolo Aquino, **S-BOARD**, **S-GUARD**. `counters/or`: prefix "OR-", width 5, next 93 (last issued **OR-00092**). REF-1 `4012883219554`. "Today" from local Manila today; dates show the arithmetic (controllable clock). **The REQ's Liza-as-homeowner scenario is played by S-TREAS-HO** (Carmela), so the two treasurer names in conflict messages stay distinct.

### Round-trip register

Treasurer decides → household and treasurer read it back. One row per field or status value.

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | `payments.status = approved` | `decidePayment`, treasurer "Approve" | Household: payment history "Approved" (REQ-009); dashboard recent payments (REQ-015); treasurer: no longer in the queue | C3, C4 |
| 2 | `payments.status = rejected` | `decidePayment`, treasurer "Reject payment" | Household: "Rejected: {reason}"; treasurer: no longer in the queue | D7 |
| 3 | `payments.orNo` | `decidePayment` | Household: history "Approved" with OR-00093; approve toast; notification; receipt (REQ-013) | C2, C4 |
| 4 | `decidedBy`, `decidedByName`, `decidedAt` | `decidePayment` | Other treasurer: conflict message "…already approved by ZZ Liza Santos…"; activity log (who, when) | F3, F4, C10 |
| 5 | Rejection `reason` | `decidePayment` | Household: "Rejected: {reason}"; bell. Where it is stored is Gap G-1 (payment vs `paymentPrivate`) | D7, D8 |
| 6 | `receipts/{orNo}` (number, payment, household, amount, payment date, issue date, received-from, lines, balance after, approved by) | `decidePayment`, same transaction | REQ-013 receipt PDF (homeowner, treasurer). In TC-12 checked at data level; the PDF is TC-13 | C6, C7, C8 |
| 7 | `counters/or.next` | `decidePayment` | Next approval's number; reconciliation (receipts run first to `next − 1`) | F6, N1 |
| 8 | `households.paidCentavos`, `balanceCentavos` | `decidePayment` (approve) | Household: statement and dashboard balance, live (REQ-009) | C5, C11 |
| 9 | `households.pendingCentavos` (− on approve **and** reject) | `decidePayment` | Household: "awaiting approval" note | C12, D9 |
| 10 | `monthlyTotals/{period}.duesCentavos` (approval date, Manila) | `decidePayment` | Collections by month (REQ-023, R2). In R1 checked at data level | C13, F10 |
| 11 | `paymentRefs/{ref}` deleted on reject | `decidePayment` | `submitPayment` accepts the same reference again (REQ-010) | E1, E2 |
| 12 | Notification per linked member (approved / rejected) | `decidePayment`, same transaction | Each member's bell (REQ-011) | C9, D10 |
| 13 | `auditLog` `payment.approved` / `payment.rejected` (ids, receipt number) | `decidePayment` | Board, treasurer: activity log (REQ-006) | C10, D11 |
| 14 | Queue marker "Needs another treasurer" | Worked out on the list from `submittedAt` and the household | Every treasurer: Approvals list | G4 |
| 15 | `paymentPrivate.qrUploadId` (from REQ-010) | `submitPayment` | Treasurer: "Paid using the QR code replaced on {date}" | B4, B5 |
| 16 | `paymentPrivate.receivedFromName` (from REQ-010) | `submitPayment` at submission | `receipts/{orNo}` received-from; receipt PDF (REQ-013) | C7, H3 |

No read-back cell is empty.

### Payment status: enumeration for `decidePayment`

Rule under test: a payment can be decided only while `pending`; the checks run in the order (1) role / not member / not submitter, (2) same caller's same decision → return the existing result, (3) not pending → conflict with status and name, (4) changed since opened → refuse, (5) decide. One row per prior state; **refused** cells are cases too.

| Prior state ↓ / request → | Approve, by another treasurer | Approve, by the treasurer who already approved it | Reject, by another treasurer | Reject, by the treasurer who already rejected it | Approve or reject by the household's own treasurer / submitter | Approve or reject by admin, board, guard, homeowner, removed treasurer |
|---|---|---|---|---|---|---|
| **pending, `kind: dues`** | Approved, next OR (C1–C13) | n/a | Rejected, ref freed (D7–D12) | n/a | **Refused** (G1, G2, G3) | **Refused** (G5–G9) |
| **pending, changed since the screen loaded** (`seenUpdatedAt` differs) | **Refused** "changed since you opened it" (F8) | n/a | **Refused** (F8) | n/a | Refused (step 1) | Refused (step 1) |
| **approved** | Conflict "already approved by {name}" (F3) | **Same OR returned, nothing written** (F2, F5) | Conflict (F3 variant) | Same caller, different decision: "You already approved this payment as OR-00093. Nothing was changed." (F1) | Refused (step 1 first) | Refused |
| **rejected** | Conflict "rejected by {name} while you had it open" (F4) | n/a | Conflict (F4 variant) | **Same result returned, nothing written** (F5 variant) | Refused | Refused |
| **void** (REQ-014) | Conflict, status void (F9; wording Gap G-6) | Conflict (G-6) | Conflict (G-6) | n/a | Refused | Refused |
| **pending, `kind` not `dues`** (seeded) | **Refused**, nothing changes (H2) | n/a | **Refused** (H2; Gap G-7 for reject) | n/a | Refused | Refused |
| **pending, household deactivated** | Approved as usual, OR issued (H1) | n/a | Rejected as usual (H1 variant) | n/a | Refused | Refused |
| **pending, month of approval closed** (`monthlyTotals.closed`) | **Refused** "Try again" (F10) | n/a | Gap G-8 (reject writes no monthly total) | n/a | Refused | Refused |
| **pending, receipt range exhausted** (`rangeEnd`, REQ-013) | **Refused**, nothing written (F11) | n/a | Rejected as usual (F11 variant) | n/a | Refused | Refused |

---

## Test plan

### 1. Smoke

**Smoke additions for QE:**

1. A treasurer sees **Approvals** in the menu with a numeric badge, opens it, and sees "Payments to approve · Check each reference number in the collection account before you approve." with the pending list or the empty message.
2. Opening one pending payment shows the review screen with the screenshot area, the details and **Approve** / **Reject**.
3. An admin office account has **no** payment approvals in its menu.

### 2. Acceptance

| REQ-012 scenario | Cases |
|---|---|
| The treasurer sees what is waiting | A1, A2, A3 |
| Approve a payment | C1, C2, C3, C4, C5, C9, C10 |
| A partial payment is applied to the oldest bill | C14, C15, C16 |
| The lot is sold while the payment is pending | H3 |
| The same treasurer acts on a stale screen | F1 |
| Pressing Approve twice issues one receipt | F2 |
| Two treasurers approve the same payment at once | F3, F6 |
| A payment rejected by someone else while it was open | F4 |
| Receipt numbers have no gaps | F7, N1 |
| A dropped connection does not issue a second receipt | F5 |
| Rejecting needs a reason | D1, D2, D7, D9, D10, D12 |
| Other reason, typed | D3, D4 |
| A typed rejection reason is not lost | D13, D14, D15 |
| A rejected reference number can be submitted again | E1 |
| The treasurer can't approve their own household's payment | G1, G2 |
| The treasurer's own household's payment waits too long (decision 7) | G4, G5 |
| The treasurer role is removed while a payment is open | G6 |
| A payment from a deactivated household | H1 |
| Only dues payments in R1 | H2 |
| Admin office staff can't approve payments | G7, G8 |
| Nothing waiting | A4 |
| The list is loading | A5 |
| The screenshot won't load | B6, B7 |
| The save fails | L1 |

### 3. Regression

- **`shared/domain/ledger.js` `allocate()`** is shared with REQ-009 (statement), REQ-014 (void) and REQ-018 (R2). Re-run every ledger suite and TC-09 blocks A–C. **REQ-012 and REQ-009 disagree on per-bill paid amounts** (Gap G-2): whichever wins, TC-09-A6 and TC-12-C14–C16 must agree.
- **Household totals** feed the statement (TC-09 B, F), the dashboard (REQ-015) and the directory. Re-run TC-09-F1 (live balance) and S3 (reconciliation).
- **Receipt series** (`counters/or`) is shared with REQ-013 (PDF, `rangeEnd`) and REQ-014 (void never reuses a number). Re-run TC-13's numbering and range cases and TC-14's "number never reused".
- **`paymentRefs`** delete on reject is the other half of REQ-010's reservation; re-run TC-10 block C, especially C4 (reuse after reject) and C5 (void stays used).
- **Notifications** (TC-11 C4, C5, D1, G3): approval and rejection go to current members only.
- **Roles (TC-02)**: Approvals hidden for admin and board; `decidePayment` and rules refuse them; stale-token removal (L-004).
- **Activity log (TC-06)**: new actions `payment.approved` / `payment.rejected`, ids only, no reason.
- **Shared reject dialog**: "the same reject dialog shape later serves bookings and vehicles". The mock-up's vehicle rejection (VEH-02) uses the existing modal; if Dev builds a shared component, re-run VEH-02 and NAV-06.
- **Open defect DEF-001**.

**Existing specs and screens QE should re-run:** `smoke.spec.js` SMK-admin-nav and SMK-admin-* (menu changes for treasurer vs admin), `navigation.spec.js` NAV-03, NAV-04 (reload keeps the screen; here the review route), NAV-05, NAV-06 (Escape: the reject dialog must **not** close once a reason is typed), NAV-07/08; `vehicle-registration.spec.js` VEH-02 if the reject dialog is shared; TC-09 A–C, F; TC-10 C; TC-11 C–D; TC-13 numbering; TC-14 void.

**Not affected:** sign-in methods (TC-01), invitations (TC-04 B–I), billing run creation of bills (TC-08) other than reading bills, announcements.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Receipt OR-00093 issued", "{lot} has been notified in the portal", "Nothing was changed", "Nothing was approved" | C2, D12, F1, L1 |
| A value written for one role, never shown back | Yes: `decidedByName`, reason, `orNo`, `monthlyTotals`, `qrUploadId` | Register rows 4, 5, 10, 15 |
| Status-gated rule checked for one transition only | Yes, the core rule | Enumeration table; F-block, H-block |
| Same concept, different word on another screen | Yes: notification texts REQ-011 vs REQ-012; "Payment not approved" vs "Rejected" | M1, M2, Gap G-3 |
| Dates computed in UTC where the user means local | Yes: approval month for monthly totals, "2 working days", date submitted | C13, F10, G4 |
| A derived figure doesn't refresh after a related write | Yes: menu badge, queue, household balance, pending note | A6, C5, C12 |
| Zero and "not set" look the same | Yes: empty queue vs failed load; credit shown as "₱0.00" plus credit | A4, A7, C17 |
| A write silently refused by security rules | Yes: assert every refusal | G-block, N2 |
| Double-tap / two devices create duplicates | Yes, the core risk (R-2) | F2, F3, F5, F6, F7 |
| Stale reference | Yes: decided by another while open; role removed; household deactivated; sold while pending | F1, F4, G6, H1, H3 |
| Backdrop click loses work or leaves stale state | Yes: reject dialog | D13, D14 |
| A modal appearing mid-flow blocks the next action | Yes: important announcement pop-up during review | K7 |
| Assumed SDK/network behaviour baked into a case | Yes: dropped connection, `sessionStorage` across app switch | F5, D15 (assumptions marked) |
| Data leaking across households or roles | Yes: screenshot to admin; notification "ref …" to a new owner; reason in the log | B8, B9, C10, Gap G-4 |

### Scenario list by mandatory type

- **Negative**: own household, own submission, admin, board, guard, homeowner, removed role, signed out; not pending (approved, rejected, void); changed since opened; non-dues kind; closed month; exhausted range; reject without a reason; "Other" empty; direct client writes. G-block, F-block, H2, D1, D3, N2.
- **Boundary**: first and last receipt in a range; 200 approvals gap-free; reason 200 vs 201 characters; exactly 2 working days pending; approval at 23:59:59 vs 00:00:00 Manila on the last day of the month; partial, exact and over-payment allocation; last pending payment approved. F7, F11, D5, G4, F10, C14–C17, A8.
- **Usability**: cards at 375 px with one Review button; screenshot above details on phone, side by side on desktop; Approve and Reject within thumb reach and ≥ 44 px; alt text; full-size screenshot by keyboard; reject dialog focus in and back; live-region toast; in-flight labels announced; stable layout. K-block.
- **Navigation**: Approvals from the menu with the badge; review route with the payment id and reload; Back to the list; after approve the next payment opens; after the last, the empty state; admin and board can't reach Approvals by URL; treasurer-who-is-homeowner switch; notification "payment submitted" lands here. I-block.

---

## A. Queue

#### TC-12-A1: The menu badge shows the number of pending payments
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer (S-TREAS). **Tags:** Gap G-9
- **Setup:** 3 pending payments project-wide (one of them PAY-F).
- **Expected:** "Approvals" in the menu shows "3".
- **Lane:** exclusive — asserts the project-wide pending count.
- **Don't assert:** whether S-TREAS-HO's badge counts PAY-F, her own household's (G-9).

#### TC-12-A2: Pending payments are listed oldest first
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Setup:** Three payments submitted Nov 25, Nov 27 and Dec 1, 2026.
- **Expected:** Listed Nov 25, Nov 27, Dec 1.
- **Don't assert:** —

#### TC-12-A3: Each card shows the lot, amount, reference number and date submitted
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "Blk 5 Lot 1 · ₱1,800.00 · Ref 4012883219554 · Submitted Nov 27, 2026 · Review" (full reference for the treasurer).
- **Don't assert:** whether the reference shows typed or normalised (G-10).

#### TC-12-A4: No pending payments shows the empty message
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "All payments are reviewed. New ones appear here as homeowners submit them."; the badge shows no number.
- **Lane:** exclusive — asserts that no payment is pending project-wide.
- **Don't assert:** —

#### TC-12-A5: On a slow connection, placeholder rows show, never a blank page
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: throttled network
- **Expected:** Placeholder rows until the list arrives; never the empty message while loading.
- **Don't assert:** —

#### TC-12-A6: The badge and list update after a decision
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-9
- **Action:** Approve one of three.
- **Expected:** The list and badge show 2 (on return to the list at least; live update across sessions is G-9).
- **Don't assert:** live update in another treasurer's session.

#### TC-12-A7: A list load failure is not shown as "All payments are reviewed"
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-11 · Staging note: list query forced to fail
- **Expected:** An error with a way to retry; never the empty message (wording undefined, G-11).
- **Don't assert:** the wording.

#### TC-12-A8: Approving the last pending payment shows the empty message
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** One pending payment.
- **Action:** Approve it.
- **Expected:** The toast, then the empty message (no "next payment" error).
- **Don't assert:** —

## B. Review screen

#### TC-12-B1: The review shows lot, submitter, amount, reference, date paid and balance before this payment
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-12
- **Expected:** "Lot Blk 5 Lot 1 · Submitted by {U-CARLO's name} · Amount ₱1,800.00 · Reference number 4012883219554 · Date paid Nov 27, 2026 · Balance before this payment ₱1,800.00".
- **Don't assert:** how "Balance before this payment" treats other pending payments of the same lot (G-12).

#### TC-12-B2: The screenshot is shown with its alt text and opens full size by keyboard
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Alt text "Payment screenshot from Blk 5 Lot 1, submitted Nov 27, 2026"; Enter on it opens it full size; Escape closes the full view.
- **Don't assert:** —

#### TC-12-B3: The submitter's name shows, not the owner on file, when a family member submitted
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Setup:** U-CARLO-2 submitted.
- **Expected:** "Submitted by" shows U-CARLO-2's name; the receipt name (C7) still uses the owner on file.
- **Don't assert:** —

#### TC-12-B4: A payment made with a replaced QR shows "Paid using the QR code replaced on {date}"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Setup:** The payment's `qrUploadId` is the QR replaced on Dec 2, 2026 (TC-10-I3).
- **Expected:** "Paid using the QR code replaced on Dec 2, 2026".
- **Don't assert:** —

#### TC-12-B5: A payment made with the current QR shows no "replaced" line
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** No such line.
- **Don't assert:** —

#### TC-12-B6: A screenshot that won't load says so in its area
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: Storage object missing or read blocked
- **Expected:** "Couldn't load the screenshot. Try again." in the screenshot area, which keeps its height.
- **Don't assert:** —

#### TC-12-B7: Approve and Reject still work when the screenshot won't load
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** As B6.
- **Action:** Approve.
- **Expected:** Approved as usual with a receipt number.
- **Don't assert:** —

#### TC-12-B8: The admin office can't open a payment screenshot
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** Blocked — DPO
- **Expected:** Storage refuses S-ADMIN's read of `proofs/HH-P/{PAY-1}.jpg`; no screen offers it.
- **Don't assert:** —

#### TC-12-B9: Board and guard can't open a payment screenshot
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-BOARD, S-GUARD. **Tags:** —
- **Expected:** Storage refuses both.
- **Don't assert:** —

#### TC-12-B10: Every treasurer can open the screenshot, including a second treasurer
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS, S-TREAS-2. **Tags:** —
- **Expected:** Both can read it.
- **Don't assert:** —

## C. Approve

#### TC-12-C1: "Approve" reads "Approving…" and is disabled until the save finishes
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (S-TREAS). **Tags:** Staging note: slow function
- **Expected:** While in flight, Approve reads "Approving…" and both buttons are disabled.
- **Don't assert:** —

#### TC-12-C2: Approving shows the toast naming the receipt number and lot
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** Last issued OR-00092.
- **Expected:** "Approved. Receipt OR-00093 issued to Blk 5 Lot 1."
- **Don't assert:** toast duration.

#### TC-12-C3: After approving, the next pending payment opens
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-13
- **Setup:** Two more pending payments.
- **Expected:** The oldest remaining payment's review opens.
- **Don't assert:** what opens when the next oldest is the treasurer's own household's (G-13).

#### TC-12-C4: The household's payment history shows "Approved" with the receipt number
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Expected:** PAY-1 reads "₱1,800.00 · Approved" with OR-00093.
- **Don't assert:** —

#### TC-12-C5: The household's balance reads ₱0.00 after approval
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Expected:** Statement and dashboard read ₱0.00; the period reads "Paid".
- **Don't assert:** —

#### TC-12-C6: One receipt record is created with the approved fields
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none (Admin SDK read). **Tags:** Provisional — SA-001 follow-up
- **Expected:** `receipts/OR-00093` with payment PAY-1, household HH-P, amount 180000, payment date Nov 27, 2026, issue date today (Manila), lines applied, balance after 0, approved by S-TREAS; `counters/or.next` = 94.
- **Don't assert:** field names beyond these.

#### TC-12-C7: The receipt's received-from is the name copied at submission
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** —
- **Expected:** `receipts/OR-00093` received-from equals `paymentPrivate/PAY-1.receivedFromName` ("ZZ Carlo Reyes"), never the submitter's account name.
- **Don't assert:** —

#### TC-12-C8: The payment records who decided, their name and when
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** Provisional — SA-001 follow-up
- **Expected:** `decidedBy` S-TREAS's uid, `decidedByName` "ZZ Liza Santos", `decidedAt` server time, `orNo` "OR-00093".
- **Don't assert:** —

#### TC-12-C9: Every linked member's bell gets the approval notification
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, U-CARLO-2. **Tags:** Gap G-3
- **Expected:** Each has exactly one approval notification with ₱1,800.00 and OR-00093, written in the same transaction.
- **Don't assert:** exact text (REQ-011 vs REQ-012, G-3).

#### TC-12-C10: The activity log records who approved, the receipt number and when, with ids only
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Board reads the log. **Tags:** —
- **Expected:** One `payment.approved` entry with S-TREAS as actor, OR-00093 and the time; no homeowner name, no reference number.
- **Don't assert:** the log's display wording (TC-06).

#### TC-12-C11: An open statement updates live after the approval
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO with Dues & Payments open; S-TREAS approves. **Tags:** Staging note: two sessions
- **Expected:** "Balance ₱0.00 · Nothing overdue" without a reload (REQ-009 live listener).
- **Don't assert:** the payment row (TC-09 G-4).

#### TC-12-C12: The awaiting amount goes down by the approved amount
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Setup:** HH-P with PAY-1 (₱1,800.00) and another pending ₱500.00.
- **Expected:** After approving PAY-1, "₱500.00 awaiting approval"; `pendingCentavos` = 50000.
- **Don't assert:** —

#### TC-12-C13: The month's dues collected rise in the approval month, Manila
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** none (data). **Tags:** Provisional — SA-001 follow-up
- **Setup:** PAY-1 dated paid Nov 27; approved Dec 3, 2026.
- **Expected:** `monthlyTotals/2026-12.duesCentavos` rises by 180000; November's does not.
- **Don't assert:** —

#### TC-12-C14: A partial payment pays the oldest bill
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Homeowner (U-ROSA). **Tags:** Gap G-2
- **Setup:** HH-CR owes October and November 2026 at ₱1,800.00; U-ROSA submitted ₱1,000.00.
- **Action:** Approve as OR-00093.
- **Expected:** The receipt's lines read "Association dues · October 2026 ₱1,000.00".
- **Don't assert:** whether per-bill paid amounts are stored (G-2).

#### TC-12-C15: After a partial payment the balance reads ₱2,600.00
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ROSA. **Tags:** —
- **Expected:** Balance ₱2,600.00.
- **Don't assert:** —

#### TC-12-C16: After a partial payment October shows ₱800.00 still owing
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ROSA. **Tags:** —
- **Expected:** October 2026 shows ₱800.00 left; November unchanged.
- **Don't assert:** status word (depends on the clock).

#### TC-12-C17: A payment larger than owed leaves credit and a credit line on the receipt
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Homeowner. **Tags:** Gap G-5 (TC-09 G-7)
- **Setup:** HH-P owes ₱1,800.00; submitted ₱3,600.00.
- **Expected:** Receipt lines "Association dues · November 2026 ₱1,800.00" and "Advance payment (credit) ₱1,800.00"; `balanceCentavos` = −180000; the homeowner sees credit, not a negative balance.
- **Don't assert:** the summary wording ("₱0.00" plus credit or "₱1,800.00 credit", G-5).

#### TC-12-C18: A payment covering several months lists each month oldest first
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** HH-CR owes October and November; submitted ₱3,600.00.
- **Expected:** Lines October 2026 ₱1,800.00, then November 2026 ₱1,800.00; balance ₱0.00.
- **Don't assert:** —

#### TC-12-C19: An approval applies to the opening balance before billed periods
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** A household with an opening balance ₱9,000.00 and December 2026 billed; ₱1,800.00 approved.
- **Expected:** The receipt's line is the opening balance ("Balance before December 2026"), not December.
- **Don't assert:** the line's label wording (TC-13).

#### TC-12-C20: An approval doesn't touch another household's figures
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** —
- **Expected:** Every other fixture household's totals, bills and payments are unchanged.
- **Don't assert:** —

## D. Reject

#### TC-12-D1: "Reject payment" stays disabled until a reason is picked
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** Press "Reject".
- **Expected:** The dialog "Reject this payment?" opens with "Reason the homeowner will see" and the reasons; "Reject payment" is disabled.
- **Don't assert:** —

#### TC-12-D2: The preset reasons are listed
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-14
- **Expected:** "Reference number not found in the collection account", "Amount does not match the screenshot", "Screenshot is unreadable", "Other". ("Submitted by mistake", REQ-010 decision 4, is not a preset: G-14.)
- **Don't assert:** order beyond the copy of record.

#### TC-12-D3: "Other" with an empty box keeps "Reject payment" disabled
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Disabled with "Other" picked and nothing typed, or only spaces typed.
- **Don't assert:** the spaces case wording.

#### TC-12-D4: Typing an "Other" reason enables "Reject payment"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** Type "Paid to the old GCash number".
- **Expected:** Enabled.
- **Don't assert:** —

#### TC-12-D5: "Other" accepts 200 characters and stops at 200, with a counter
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** A counter shows characters used; 200 accepted; a 201st character can't be entered (or is refused by the function if sent directly).
- **Don't assert:** counter format.

#### TC-12-D6: The "Other" box shows the privacy hint
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "The homeowner sees this. Don't include other people's names or account numbers."
- **Don't assert:** —

#### TC-12-D7: The household's history shows "Rejected: {reason}"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Action:** Reject with "Amount does not match the screenshot".
- **Expected:** PAY-1 reads "Rejected: Amount does not match the screenshot".
- **Don't assert:** —

#### TC-12-D8: The other member sees the rejection reason too
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO-2. **Tags:** Gap G-1
- **Expected (pending G-1):** "Rejected: Amount does not match the screenshot".
- **Don't assert:** until G-1 (reason on `payments` or `paymentPrivate`) is answered.

#### TC-12-D9: Rejection leaves the balance unchanged and lowers the awaiting amount
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO. **Tags:** —
- **Expected:** Balance still ₱1,800.00; awaiting amount down by ₱1,800.00; `paidCentavos` unchanged.
- **Don't assert:** —

#### TC-12-D10: Every linked member's bell gets the rejection with the reason
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, U-CARLO-2. **Tags:** Gap G-3
- **Expected:** One rejection notification each, with ₱1,800.00 and the reason.
- **Don't assert:** exact text (G-3).

#### TC-12-D11: Rejection uses no receipt number, and the log holds no reason
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** —
- **Expected:** `counters/or.next` unchanged; no `receipts` document; one `payment.rejected` log entry with ids only and **no** reason text.
- **Don't assert:** —

#### TC-12-D12: The reject toast says the lot was notified in the portal
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** "Payment rejected. Blk 5 Lot 1 has been notified in the portal."; true because D10's notifications exist.
- **Don't assert:** —

#### TC-12-D13: With a reason typed, clicking outside or Escape keeps the dialog and the text
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** The dialog stays open with the reason; it closes only with "Cancel" or "Reject payment".
- **Don't assert:** —

#### TC-12-D14: Before anything is picked, Escape closes the dialog
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** With nothing picked or typed, Escape (and a backdrop click) closes it and focus returns to "Reject".
- **Don't assert:** —

#### TC-12-D15: A typed reason survives switching to the collection-account app
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer on a phone. **Tags:** Staging note: real phone; tab unloaded by the OS, or a reload · Assumption: `sessionStorage` survives a tab reload, not a closed tab
- **Expected:** After returning (or a reload of `#/approvals/payments/{id}`), the same payment opens and the reject dialog's reason is still typed.
- **Don't assert:** behaviour after the tab is closed.

#### TC-12-D16: "Cancel" clears the kept reason
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** After Cancel and reopening Reject, the box is empty.
- **Don't assert:** —

#### TC-12-D17: "Rejecting…" shows in flight and both buttons are disabled
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** "Reject payment" reads "Rejecting…"; disabled until the answer.
- **Don't assert:** —

#### TC-12-D18: The function refuses a reject with no reason sent directly
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS, scripted. **Tags:** —
- **Action:** Call `decidePayment(reject)` with no reason, an empty reason, and 201 characters.
- **Expected:** All refused; the payment stays pending.
- **Don't assert:** —

## E. Reference number freed on reject, kept on approve and void

#### TC-12-E1: A rejected payment's reference can be submitted again
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Homeowner (U-CARLO). **Tags:** —
- **Setup:** PAY-1 rejected.
- **Action:** U-CARLO submits ₱1,500.00 with REF-1.
- **Expected:** Accepted as a new pending payment.
- **Don't assert:** —

#### TC-12-E2: Rejecting deletes the reservation in the same transaction
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** Provisional — SA-001 follow-up
- **Expected:** `paymentRefs/4012883219554` no longer exists after the reject.
- **Don't assert:** —

#### TC-12-E3: A reservation already pointing at a newer payment is not deleted
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** Staging note: reservation re-pointed by the Admin SDK · Provisional — SA-001 follow-up
- **Setup:** REF-1's reservation points at payment PAY-NEW, not PAY-1 (pending).
- **Action:** Reject PAY-1.
- **Expected:** The reservation still exists and points at PAY-NEW.
- **Don't assert:** —

#### TC-12-E4: Approving keeps the reservation
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** none. **Tags:** —
- **Expected:** After approval, REF-1's reservation exists; submitting REF-1 again is refused (TC-10-C1).
- **Don't assert:** —

#### TC-12-E5: Voiding an approved payment keeps the reservation
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer voids (REQ-014). **Tags:** —
- **Expected:** REF-1's reservation exists after the void; resubmitting REF-1 is refused (TC-10-C5).
- **Don't assert:** the refusal wording (TC-10 G-1).

#### TC-12-E6: Two members resubmitting a freed reference at once create one payment
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO and U-CARLO-2. **Tags:** Staging note: two sessions
- **Setup:** PAY-1 rejected.
- **Expected:** Exactly one new payment; the other gets the "already submitted … waiting" message.
- **Don't assert:** which wins.

## F. Repeats, stale screens and concurrency

#### TC-12-F1: The same treasurer rejecting on a stale screen after approving is told so
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS on laptop and phone. **Tags:** Staging note: two sessions
- **Setup:** S-TREAS approved PAY-1 as OR-00093 on her laptop; her phone still shows it pending.
- **Action:** Press "Reject" and confirm a reason on the phone.
- **Expected:** "You already approved this payment as OR-00093. Nothing was changed."; status still approved; no extra notification or log entry.
- **Don't assert:** —

#### TC-12-F2: Pressing Approve twice issues one receipt number
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Action:** Double-tap "Approve".
- **Expected:** Exactly one receipt (OR-00093); `counters/or.next` = 94; one notification per member; one log entry.
- **Don't assert:** —

#### TC-12-F3: Two treasurers approving at once issue one receipt, and the second is told who
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS and S-TREAS-2. **Tags:** Staging note: two sessions at once
- **Expected:** Exactly one receipt; the loser sees "This payment was already approved by {winner's name}. Nothing was changed."
- **Don't assert:** which treasurer wins.

#### TC-12-F4: Approving a payment someone rejected while it was open is refused
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-2 (Mark) has PAY-1 open; S-TREAS (Liza) rejects it. **Tags:** Staging note: two sessions
- **Action:** Mark presses "Approve".
- **Expected:** "This payment was rejected by ZZ Liza Santos while you had it open. Nothing was changed."; no receipt number issued.
- **Don't assert:** —

#### TC-12-F5: A retry after a dropped reply returns the same receipt and writes nothing
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: callable response dropped after commit
- **Action:** Press "Approve" again.
- **Expected:** "Approved. Receipt OR-00093 issued to Blk 5 Lot 1."; no OR-00094; no second notification or log entry. A repeated reject by the same treasurer likewise returns success without writing.
- **Don't assert:** —

#### TC-12-F6: Ten parallel approvals of one payment issue one receipt
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS and S-TREAS-2, scripted, 10 calls. **Tags:** Staging note: parallel callers
- **Expected:** One receipt, counter +1, one set of notifications; every other call returns either the same OR (same caller) or the conflict (other caller).
- **Don't assert:** which call wins.

#### TC-12-F7: 200 approvals by two treasurers, some at once, run OR-00093 to OR-00292 with no gaps
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS and S-TREAS-2, scripted. **Tags:** Staging note: 200 pending payments seeded; bursts of parallel calls
- **Expected:** Exactly 200 receipts numbered OR-00093…OR-00292, none skipped or repeated; `counters/or.next` = 293; each receipt matches one payment.
- **Don't assert:** which payment got which number.

#### TC-12-F8: A payment changed since the screen loaded is refused
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-15 · Staging note: `updatedAt` changed by the Admin SDK
- **Expected:** Refused as "changed since you opened it"; nothing written. (What can change a pending payment, and the copy, are G-15.)
- **Don't assert:** the message wording.

#### TC-12-F9: Deciding a payment that was voided
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-2 with a stale screen. **Tags:** Gap G-6
- **Setup:** PAY-1 approved and voided while S-TREAS-2's screen showed it pending.
- **Expected:** Refused; nothing written; no new receipt (message wording G-6).
- **Don't assert:** wording.

#### TC-12-F10: An approval at the month boundary counts in the Manila month; a closed month is refused
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: controllable clock; `monthlyTotals/2026-11.closed` seeded
- **Expected:** Approved at Nov 30, 23:59:59 Manila → counted in 2026-11; at Dec 1, 00:00:00 Manila (Nov 30 UTC) → 2026-12. With 2026-11 closed, the 23:59:59 approval is refused with "Try again", nothing written, no number used.
- **Don't assert:** the full "Try again" sentence (not in the copy of record, G-8).

#### TC-12-F11: An approval when the receipt range has run out is refused and writes nothing
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: `rangeEnd` = 93, `next` = 94
- **Expected:** The approval is refused (REQ-013 message); the payment stays pending; the counter unchanged. A rejection still works.
- **Don't assert:** the message (TC-13).

#### TC-12-F12: An approval and a void on the same household at once both apply, in order
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS approves PAY-2 while S-TREAS-2 voids OR-00093 on HH-P. **Tags:** Staging note: two sessions
- **Expected:** Both succeed (queued on the household document); final totals equal the result of applying both.
- **Don't assert:** order.

## G. Self-approval and roles

#### TC-12-G1: The treasurer's own household's payment shows the note instead of the buttons
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO (member of HH-F). **Tags:** —
- **Action:** Open PAY-F.
- **Expected:** No Approve or Reject; "This is your own household's payment. Another treasurer must decide it." in the same space.
- **Don't assert:** —

#### TC-12-G2: The server refuses a self-approval sent anyway
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO, scripted. **Tags:** —
- **Action:** Call `decidePayment` approve and reject on PAY-F.
- **Expected:** Both refused; PAY-F pending; no number used.
- **Don't assert:** —

#### TC-12-G3: The server refuses a decision by the payment's submitter even after leaving the lot
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO, who submitted PAY-F and was then removed from HH-F. **Tags:** —
- **Expected:** Refused (submitter check).
- **Don't assert:** —

#### TC-12-G4: A treasurer's own-household payment pending more than 2 working days is marked
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Any treasurer. **Tags:** Blocked — decision 7 · Gap G-16 · Staging note: controllable clock
- **Setup:** PAY-F submitted Friday Nov 27, 2026; check Tuesday Dec 1 (2 working days) and Wednesday Dec 2.
- **Expected (pending decision 7 and G-16):** marked "Needs another treasurer" once more than 2 working days have passed; not before.
- **Don't assert:** until decision 7 is made and "working days" (weekends, holidays) is defined.

#### TC-12-G5: Another treasurer can decide the first treasurer's household payment
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS (not a member of HH-F). **Tags:** —
- **Expected:** S-TREAS approves PAY-F normally.
- **Don't assert:** —

#### TC-12-G6: A role removed while the payment is open is refused at once
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-REMOVED (ZZ Mark Tan in REQ-012). **Tags:** —
- **Setup:** PAY-1 open; role removed (REQ-002), old ID token still valid.
- **Action:** Press "Approve".
- **Expected:** Refused; nothing changes; no receipt number issued.
- **Don't assert:** the message (G-17).

#### TC-12-G7: The admin office has no payment approvals in the menu
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** No payment approvals entry; the review route shows "You don't have access to this page".
- **Don't assert:** whether "Approvals" shows for other kinds later.

#### TC-12-G8: The server refuses an approval from the admin office
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN, scripted. **Tags:** —
- **Expected:** `decidePayment` refused; nothing changes.
- **Don't assert:** —

#### TC-12-G9: Board, guard, homeowners and signed-out callers are refused
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-BOARD, S-GUARD, U-CARLO (own payment), anonymous. **Tags:** —
- **Expected:** All refused; no menu entry; review route shows no-access.
- **Don't assert:** —

#### TC-12-G10: With only one treasurer, her own household's payment
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO as the only treasurer. **Tags:** Blocked — decision 7
- **Expected:** (a) it waits, marked after 2 working days; or (b) she may approve, the log marks it and every board member is notified.
- **Don't assert:** until decision 7 is made.

## H. Special payments

#### TC-12-H1: A payment from a deactivated household is approved as usual
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** HH-D deactivated after U-DORA submitted.
- **Expected:** Approved with a receipt number; HH-D's totals updated.
- **Don't assert:** who is notified (HH-D's members, TC-04 G-27).

#### TC-12-H2: A payment whose kind isn't dues is refused and nothing changes
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, scripted. **Tags:** Staging note: `kind: amenityFee` payment seeded · Gap G-7
- **Expected:** Approve refused; no number used; totals unchanged. Whether reject is also refused is G-7.
- **Don't assert:** the reject outcome.

#### TC-12-H3: A lot sold while the payment was pending names the earlier owner on the receipt
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Admin office changes the owner. **Tags:** —
- **Setup:** Owner on file "ZZ Ana Reyes" at submission; changed to "ZZ Ben Torres" before approval.
- **Action:** Approve as OR-00093.
- **Expected:** `receipts/OR-00093` received-from "ZZ Ana Reyes"; the receipt shows "Received from: ZZ Ana Reyes · Blk 2 Lot 7" (TC-13).
- **Don't assert:** —

#### TC-12-H4: After a sale, approval notifications go to the members linked at the decision
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA (removed), U-BEN (linked). **Tags:** Gap G-4
- **Setup:** U-ANA's payment pending; she is removed; U-BEN linked.
- **Action:** Approve.
- **Expected:** U-ANA gets no notification; U-BEN gets one. Whether U-BEN's text may include "ref …{last 4}" for a payment made before he joined is G-4.
- **Don't assert:** the reference part.

## I. Navigation

#### TC-12-I1: Approvals is reached from the menu and highlighted
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "Approvals" opens "Payments to approve…"; one `aria-current` item.
- **Don't assert:** —

#### TC-12-I2: The review route carries the payment id and a reload reopens it
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** The address is `#/approvals/payments/{id}`; reloading opens the same payment.
- **Don't assert:** —

#### TC-12-I3: Opening the review route of an already decided payment
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-18
- **Expected (pending G-18):** the payment shows its decided state (approved with OR, or rejected with reason) and no Approve / Reject, or the list opens.
- **Don't assert:** which.

#### TC-12-I4: Back from the review returns to the list
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Browser Back (and any on-screen back) returns to the list in the same order.
- **Don't assert:** —

#### TC-12-I5: The "payment submitted" notification lands on Approvals
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** Pressing it opens Approvals.
- **Don't assert:** whether it opens the payment itself.

#### TC-12-I6: A treasurer who is also a homeowner sees Approvals only in the Treasurer view
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO. **Tags:** —
- **Expected:** In "My household", no Approvals in the menu; the review route redirects or shows the staff view switch (REQ-002).
- **Don't assert:** which.

## K. Usability and accessibility (WCAG 2.2 AA, 375 px)

#### TC-12-K1: At 375 px the queue is cards with one "Review" button each, no sideways scroll
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** DEF-001 must be fixed first
- **Expected:** Cards with lot, amount, reference, date and "Review"; page width ≤ viewport.
- **Don't assert:** —

#### TC-12-K2: On a phone the screenshot is above the details and the buttons are at the bottom
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer at 375 px. **Tags:** —
- **Expected:** Screenshot, then details, then Approve and Reject within thumb reach at the bottom; desktop shows screenshot and details side by side.
- **Don't assert:** —

#### TC-12-K3: Approve and Reject are real buttons at least 44 px tall
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** `button` elements, ≥ 44 px tall, with ≥ 8 px between them.
- **Don't assert:** —

#### TC-12-K4: The reject dialog takes focus and returns it to the payment when closed
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer (keyboard). **Tags:** —
- **Expected:** Focus moves into the dialog (the reason group); the reasons are a labelled radio group; the "Other" box is labelled; on close focus returns to the payment (the Reject button).
- **Don't assert:** —

#### TC-12-K5: "Approving…" and the decision toast are announced
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (screen reader). **Tags:** —
- **Expected:** The in-flight label is announced; the toast is in a live region.
- **Don't assert:** —

#### TC-12-K6: The screenshot area keeps its height while loading
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** The details and buttons don't move when the screenshot finishes loading.
- **Don't assert:** —

#### TC-12-K7: An important announcement pop-up mid-review doesn't lose a typed reason
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** If a pop-up appears, after acknowledging it the reject dialog and reason are still there.
- **Don't assert:** whether it appears mid-session.

#### TC-12-K8: Approving 30 payments in a row is practical on a phone
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: real phone
- **Expected:** Each approve lands on the next payment with the screenshot visible; note time per payment and any scroll needed to reach the buttons.
- **Don't assert:** a time target.

## L. Errors

#### TC-12-L1: A failed save says nothing was approved and leaves the payment pending
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: connection cut before the call reaches the server
- **Expected:** "Couldn't save. Nothing was approved. Check your connection and try again."; the payment is still pending; no number used; buttons enabled again.
- **Don't assert:** —

#### TC-12-L2: A failed reject keeps the dialog and the reason
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-11
- **Expected:** The dialog stays open with the reason; an error says nothing was rejected (wording undefined, G-11).
- **Don't assert:** wording.

## M. Copy consistency

#### TC-12-M1: Decision words are "Approved", "Rejected" and "issued", never "paid" or "sent"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, homeowner. **Tags:** —
- **Expected:** Toasts, history and notifications say "Approved", "Rejected", "Receipt … issued"; none says "paid", "Receipt sent" or "emailed".
- **Don't assert:** —

#### TC-12-M2: The treasurer's names in conflict messages match the decider
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurers. **Tags:** —
- **Expected:** The name shown is `decidedByName` copied at the decision (it doesn't change if the treasurer's name is later edited).
- **Don't assert:** —

## N. Data integrity and rules

#### TC-12-N1: Receipts run from the first number to `next − 1` with none missing
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (data check after the run). **Tags:** —
- **Expected:** Every number from the series start to `counters/or.next − 1` has exactly one receipt; every approved payment has one; no rejected payment has one.
- **Don't assert:** —

#### TC-12-N2: No client can write payments, receipts, counters or reservations, treasurer included
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS, S-ADMIN, U-CARLO. **Tags:** Provisional — SA-001 follow-up
- **Action:** Set a payment's status; create `receipts/OR-99999`; change `counters/or.next`; delete `paymentRefs/…`; edit `monthlyTotals`.
- **Expected:** All refused.
- **Don't assert:** —

#### TC-12-N3: Household totals reconcile after the approve and reject cases
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none. **Tags:** —
- **Expected:** For each fixture household, `paidCentavos` = Σ approved non-void dues payments; `pendingCentavos` = Σ pending; `balanceCentavos` = billed − paid − opening credit.
- **Don't assert:** —

#### TC-12-N4: The decision transaction writes all or nothing
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: fault injected in the notification or log write
- **Expected:** With a failure mid-transaction, no receipt, no counter change, no status change, no totals change, no reservation delete, no notification.
- **Don't assert:** —

#### TC-12-N5: Function logs hold ids and receipt numbers only
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** none (log read). **Tags:** Staging note: function log access
- **Expected:** No names, full references, proof paths or rejection reasons in logs.
- **Don't assert:** —

## X. Exploratory charters

#### TC-12-X1: 20 minutes trying to get two receipts for one payment
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Two treasurers on two phones and a laptop. **Tags:** —
- **Charter:** Double-tap, airplane mode at each step, reload mid-approve, approve and reject from different devices, approve during a void, switch to another app and back. Time-box 20 min; check receipts and counter after each attempt.

#### TC-12-X2: 15 minutes as a treasurer who is also a homeowner
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO. **Tags:** —
- **Charter:** Use the switch, deep links, the "Approve and next" flow and direct calls to try to decide your own household's payment. Time-box 15 min.

---

## Cases that hinge on open decisions or drafts

| Open item | Who decides | Cases |
|---|---|---|
| Decision 7 (one-treasurer fallback) | Owner | G4, G10 |
| Decision 2: the board names a second treasurer before go-live | HOA board | Process only; G5 assumes two treasurers |
| Decision 6 DPO confirmation (screenshot access) | DPO | B8 |
| D5 (BIR receipt vs invoice): the title, not the numbering | Accountant via the board | None here (TC-13) |
| SA-001 follow-up (check order, `decidedByName`, `paymentRefs` delete, `monthlyTotals`) | Sol Arch | Every Provisional case |
| Gaps G-1 to G-18 | BA | As tagged |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Queue | 8 | 4 |
| B | Review screen | 10 | 7 |
| C | Approve | 20 | 14 |
| D | Reject | 18 | 9 |
| E | Reference freed or kept | 6 | 5 |
| F | Repeats, stale screens, concurrency | 12 | 7 |
| G | Self-approval and roles | 10 | 8 |
| H | Special payments | 4 | 4 |
| I | Navigation | 6 | 1 |
| K | Usability, WCAG 2.2 AA, 375 px | 8 | 1 |
| L | Errors | 2 | 1 |
| M | Copy consistency | 2 | 0 |
| N | Data integrity, rules | 5 | 3 |
| X | Exploratory | 2 | 0 |
| **Total** | | **113** | **64** |

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | **Where the rejection reason is stored.** REQ-012 Data changes put `reason` on `payments/{id}` (household-readable); REQ-010 puts it in `paymentPrivate` (submitter and staff only). With the latter, the spouse's history can't show "Rejected: {reason}" | D8; TC-09-E3 |
| G-2 | **Per-bill paid amounts.** REQ-012 Data changes and Sol Arch's answer 4 have `decidePayment` write each open bill's `paidCentavos`; REQ-009 r3 (later, Sol Arch's S2 answer) says no per-bill paid amounts, only `households.paidCentavos` and a prefix sum. REQ-012 still lists "Bills" as written. Align REQ-012 (and REQ-015's `openBills`) | C14; TC-09 A-block |
| G-3 | **Notification texts disagree** with REQ-011's catalogue (approved: "(ref …{last 4}). Receipt {OR no.} is being prepared."; rejected: "wasn't approved: {reason}") vs REQ-012 ("Payment approved: {amount}, {OR no.}"; "Payment not approved: … Please submit it again."). REQ-011 says its catalogue is the copy of record | C9, D10; TC-11 G-1 |
| G-4 | After a sale, the approval notification goes to members linked at the decision, so a new owner can receive "ref …{last 4}" for a payment submitted before they joined, which option (b) hides on screen. Should the text drop the reference for those recipients, or should they not be notified? | H4 |
| G-5 | Credit display: "₱0.00" plus "₱x credit" (REQ-012, REQ-013 decision 4) vs "₱x credit" alone (REQ-009) | C17 |
| G-6 | No conflict copy for deciding a payment that is already **void** | F9 |
| G-7 | Is a non-dues payment refused for **reject** too, or only for approve? A seeded amenity-fee payment could otherwise never leave the queue | H2 |
| G-8 | Copy for the closed-month refusal ("Try again" only; no full sentence in the copy of record). And does a reject touch the closed-month check? | F10 |
| G-9 | Does the menu badge count the treasurer's own household's payments she can't decide, and does it update live? | A1, A6 |
| G-10 | Reference on the treasurer's card and review: as typed (with spaces) or normalised? Matching in the collection account is easier one way | A3 |
| G-11 | No copy for a queue load failure or a failed reject | A7, L2 |
| G-12 | "Balance before this payment": the current balance, or the balance minus other pending payments of the same lot that would be decided first? | B1 |
| G-13 | "The next pending payment opens": does it skip the treasurer's own household's payments she can't decide? | C3 |
| G-14 | REQ-010 decision 4 says the treasurer rejects a mistaken submission with the reason "Submitted by mistake"; it isn't in the reason list (only via "Other") | D2 |
| G-15 | What can change a pending payment's `updatedAt` between load and decision (nothing in R1 writes a pending payment besides the decision itself)? And the copy for "changed since you opened it" | F8 |
| G-16 | "More than 2 working days": are weekends and Philippine public holidays excluded, and in Manila time? | G4 |
| G-17 | No copy for a decision refused because the treasurer's role was removed (REQ-002's no-access page, or a message on the review?) | G6 |
| G-18 | What the review route shows for a payment that is no longer pending (opened from history, a notification or a stale bookmark) | I3 |
