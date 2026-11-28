# TC-09: Statement of account (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature (Dues & Payments statement for homeowners: balance summary, periods as cards on phones and a table from 760 px, payments list, "Show earlier periods", PDF built in the browser; staff "Statement" on a household) |
| Source | [REQ-009 Statement of account](../requirements/REQ-009-statement-of-account.md), **Approved** 2026-11-28 (r4), **Option A** (cards on phone, table on desktop, PDF in the browser) |
| Depends on / precedent | [REQ-008 Monthly billing run](../requirements/REQ-008-monthly-billing-run.md) (bills, opening balance, opening credit, due date = last day of the period, Manila), [REQ-010 Submit a QR payment](../requirements/REQ-010-submit-qr-payment.md) (payment summary, `pendingCentavos`, decision 3 (b) sale privacy), [REQ-012 Approve or reject](../requirements/REQ-012-approve-or-reject-a-payment.md) (`paidCentavos`, rejected status and reason), [REQ-014 Void](../requirements/REQ-014-void-an-approved-payment.md) (void status, balance back up), [REQ-046 Adjust or cancel a bill](../requirements/REQ-046-adjust-or-cancel-a-bill.md) (**Draft**, not approved: correction lines), [REQ-013 Official receipt](../requirements/REQ-013-official-receipt-pdf.md) decision 5 (sale rule by `submittedAt` against `linkedAt`, "unless that member submitted it"), [REQ-015 Homeowner dashboard](../requirements/REQ-015-homeowner-dashboard.md) (balance tile must equal the statement), [REQ-004](../requirements/REQ-004-invite-and-link.md) (`members.linkedAt`), [REQ-003](../requirements/REQ-003-household-directory.md) (household detail, where staff press "Statement"), [REQ-002](../requirements/REQ-002-roles-and-permissions.md) (treasurer and admin office read; board not in R1) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (**Open**: no viewport meta, so the phone layout never applies on a real phone; the statement's 375 px cards depend on it, see TC-09-M1). No other defect exists in this area (it has no code yet) |
| App version | **Anticipated.** No application code exists; `main` holds the single-file mock-up only. Approved UX: screens 9A–9D of [req-005-011-mockup.html](../mockups/req-005-011-mockup.html). The mock-up's `ledger()` (`index.html` lines 414–425) recomputes the balance in the browser and its PDF uses jsPDF 2.5.1 from a CDN; both are replaced, not ported (L-002) |
| Source files / functions touched (anticipated) | `shared/domain/ledger.js` (oldest-bill-first allocation, period status), `shared/domain/dates.js` (Asia/Manila "today", overdue), `shared/domain/money.js`; the Dues & Payments page and its statement component (shared by the homeowner and staff views); the lazily imported PDF module (jsPDF + jspdf-autotable from npm, embedded Noto Sans subset); Firestore rules and indexes for `bills`, `payments`, `households`; the live listener on `households/{id}`; the mismatch report to error monitoring |
| Architecture | SA-001 **Final** (r3): §4.4 item 1, §4.2, §9, R-11, R-15, R-16. The REQ's Sol Arch review changes the design beyond SA-001 (one stored paid total and no per-bill paid amounts; `paymentPrivate` split). SA-001 has not yet absorbed these follow-ups, so cases that name a field, collection or function from REQ-009's Data changes are tagged **Provisional — SA-001 follow-up** |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions, Storage) or `hoa-portal-staging` only. Never production.** Both brands (Greenfield Homes HOA, Gentri Heights HOA). Error monitoring in the emulator is a stub sink QE can read |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. |

**Tags used on cases**

- **Provisional — SA-001 follow-up**: asserts a field, collection, index or function named in REQ-009's Data changes (approved) that SA-001 Final does not yet describe. Re-check when Sol Arch updates SA-001.
- **Blocked — REQ-046 draft**: the expected result depends on REQ-046, which is not yet approved. The case stays in the plan; QE must not automate it until REQ-046 is approved.
- **Blocked — DPO**: decision 5 follows REQ-010 decision 3 (b), approved "with the DPO's agreement". Cases stand; re-check if the DPO changes the rule.
- **Gap G-n**: the expected result depends on a requirement gap listed at the end. QE must not automate an expected result marked as a gap until the BA answers.
- **Staging note**: the scenario needs special set-up (controllable clock, two sessions at once, data seeded through the Admin SDK because no R1 screen can create it, a real low-end phone).

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Homeowner** (linked member of the lot) | Reads their own lot's statement, payments and balance; downloads the PDF. Read-only |
| **Second member of the same lot** (spouse, family) | Same statement and balance; sees the other member's payments as summary rows (date, amount, ref …last 4, status) |
| **New owner after a sale** (linked after earlier payments) | Same bills and balance; payments **submitted** before their `linkedAt` show date, amount and status only, labelled "Made before you joined" (decision 5) |
| **Treasurer** (`treasurer`) | Opens any household's statement from the directory ("Statement"); read-only here. REQ-046 (draft) would add "Correct this bill" on this view |
| **Admin office staff** (`admin`) | Opens any household's statement from the directory; read-only |
| **Board** (`board`) | **No access in R1** (REQ-002 open question on board access to household data) |
| **Guard** (`guard`) | No access |
| **Homeowner of another lot** | Must be refused every read of this lot |

### Test fixtures (invented; QE maps them to `.env`)

The same fixture set is used in TC-09 to TC-12 so QE maps it once. Lots are invented; every person's name carries the `ZZ` prefix. Each case says which bills and payments to seed; the "starting state" column is the default.

| Fixture | Lot | Owner on file | Members (accounts) | Starting state |
|---|---|---|---|---|
| **HH-P** "ZZ Test Household P" | Blk 5 Lot 1 | ZZ Carlo Reyes | U-CARLO, U-CARLO-2 | Nov 2026 bill ₱1,800.00 unpaid |
| **HH-L** "ZZ Test Household L" | Blk 3 Lot 9 | ZZ Roberto Lim | U-ROBERTO | Bills Jun–Nov 2026, ₱1,800.00 each (ledger account; variants per case) |
| **HH-CR** "ZZ Test Household CR" | Blk 6 Lot 4 | ZZ Rosa Credit | U-ROSA | Credit account (variants per case) |
| **HH-A** "ZZ Test Household A" | Blk 2 Lot 7 | ZZ Ana Reyes, later ZZ Ben Torres | U-ANA (removed in the sale cases), U-BEN, U-BEN-2 | Sale fixture |
| **HH-B** "ZZ Test Household B" | Blk 4 Lot 12 | ZZ Juan Dela Cruz | U-JUAN, U-JUAN-2 | One bill, paid |
| **HH-M** "ZZ Test Household M" | Blk 1 Lot 3 | ZZ Maria Santos | U-MARIA | The "other lot" for leak cases |
| **HH-X** "ZZ Test Household X" | Blk 9 Lot 3 | ZZ Xavier Other | U-XAVIER | A payment with reference REF-X |
| **HH-F** "ZZ Test Household F" | Blk 2 Lot 10 | ZZ Carmela Cruz | S-TREAS-HO | Treasurer's own household |
| **HH-Z** "ZZ Test Household Z" | Blk 8 Lot 2 | ZZ Zero Bills | U-ZERO | No bills, no payments |
| **HH-LONG** "ZZ Test Household Long" | Blk 3 Lot 11 | ZZ Long History | U-LONG | 20 or 24 periods billed (per case) |
| **HH-D** "ZZ Test Household D" | Blk 7 Lot 1 | ZZ Dora Deactivated | U-DORA | Active; deactivated during the case |

| Account | Who | Notes |
|---|---|---|
| U-CARLO, U-CARLO-2 | zz.carlo@ / zz.carlo2@example.test | Members of HH-P |
| U-ROBERTO, U-ROSA, U-JUAN, U-JUAN-2, U-MARIA, U-XAVIER, U-ZERO, U-LONG, U-DORA | zz.…@example.test | Members of their lot only |
| U-ANA | zz.owner.a@example.test | Member of HH-A until removed |
| U-BEN | zz.newowner.a@example.test | Linked to HH-A after the sale |
| U-BEN-2 | zz.newowner.a2@example.test | Linked to HH-A after U-BEN |
| U-STRANGER | zz.stranger1@example.test | No household, no role |
| S-TREAS | ZZ Liza Santos, zz.treasurer@example.test | Treasurer, no household |
| S-TREAS-2 | ZZ Mark Tan, zz.treasurer2@example.test | Second treasurer, no household |
| S-TREAS-HO | ZZ Carmela Cruz, zz.treasurer.ho@example.test | Treasurer and member of HH-F |
| S-ADMIN | ZZ Paolo Aquino, zz.admin1@example.test | Admin office |
| S-BOARD | zz.board@example.test | Board |
| S-GUARD | zz.guard@example.test | Guard |

References: **REF-1** `4012883219554` (typed as `4012 8832 1955 4`), **REF-X** `ZZTEST990011`. "Today" in every case is built from **local Manila today** in the test; the dates below (Dec 5, 2026 and so on) show the arithmetic and are reproduced with a controllable clock (Staging note). Monthly dues ₱1,800.00 unless a case says otherwise.

### Round-trip register

Billing, payment and correction functions write; the homeowner and staff read the statement. One row per field or status value.

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | Bill `amountCentavos`, `period`, `dueDate` | Billing worker / `billHousehold` (REQ-008), treasurer starts the run | Homeowner and staff: period card or row "Period · Due date · Billed"; PDF rows | A1, D1, H2 |
| 2 | Bill `adjustedCentavos` and correction reason | `adjustBill` (REQ-046 draft), treasurer | Homeowner and staff: "Corrected: {amount} ({reason})" on the period; balance counts `amount + adjusted`. The treasurer's note: **deliberately not shown** to homeowners | C5, C6, C7 |
| 3 | Opening balance bill (`kind: opening`) | `commitOpeningBalances` (REQ-008), treasurer | Homeowner and staff: oldest line "Balance before {first period} · {amount} · Overdue" | C1, C2 |
| 4 | Opening credit (`kind: openingCredit`) | `commitOpeningBalances` | Homeowner and staff: oldest line "Credit before {first period} · {amount}"; pays the first bills | C3, C4 |
| 5 | `households.paidCentavos` (approved dues payments) | `decidePayment` (REQ-012), void function (REQ-014) | Homeowner and staff: each period's "Paid" and status (prefix sum in `ledger.js`); summary | A1–A8 |
| 6 | `households.balanceCentavos` | Billing, `decidePayment`, void, `adjustBill` | Homeowner and staff: summary "Balance {amount}" or "{amount} credit"; shown in place of the worked-out figure on a mismatch | B1, B5, F4 |
| 7 | `households.billedCentavos` | Billing, `adjustBill` | Developer: the mismatch report's figures. **Deliberately not shown** on screen | F4, F5 |
| 8 | `households.pendingCentavos` | `submitPayment` (REQ-010), `decidePayment` | Homeowner and staff: "{amount} awaiting approval. Your balance updates once the treasurer has checked it." | B2, B3 |
| 9 | Payment `status` pending / approved / rejected / void | `submitPayment`, `decidePayment`, void | Homeowner and staff: Payments list row status | E1, E2, E3 |
| 10 | Payment `refLast4` | `submitPayment` | Homeowner (submitter, other member): "ref …9554" in the list. New owner for a payment before joining: **deliberately not shown** | E1, E5 |
| 11 | Payment `orNo` | `decidePayment` | Homeowner: payment row "Approved" with the receipt number (REQ-012 "Approved with OR-00093") | E4 |
| 12 | Rejection reason | `decidePayment` | Homeowner: "Rejected: {reason}" (REQ-012). Where it is stored is Gap G-1 | E3 |
| 13 | `members.linkedAt` | `redeemInvite` (REQ-004) | The screen, compared with `submittedAt`, decides "Made before you joined" | E5–E9 |
| 14 | `config/payment.monthlyDuesCentavos` | `saveDuesSettings` (REQ-007), treasurer | Homeowner: sub-heading "{lot} · Monthly dues {amount}, due on the last day of each month" | K6 |
| 15 | Mismatch report (household id, both figures) | The statement screen, to error monitoring | Developer: error monitoring. **Deliberately not shown** to the homeowner beyond the stored balance | F4, F5 |
| 16 | Payment `kind` (`dues`, later `amenityFee`) | `submitPayment` (REQ-010; REQ-031 later) | Only `dues` reduces the balance; how a non-dues payment appears in the list is Gap G-9 | B6 |
| 17 | Lot label and HOA name | REQ-003 (`households`), brand config | Homeowner: sub-heading; staff: heading "Blk 3 Lot 9"; PDF header and file name | H1, I1 |

No read-back cell is empty.

### Period status: enumeration

Status is worked out when read, never stored (C4). "Due" below means today (Manila) is on or before the due date; "past due" means today is at least the day after.

| Paid against this period's due amount ↓ / Today → | On or before the due date | Day after the due date or later |
|---|---|---|
| Nothing paid | **Unpaid** (A3, D1) | **Overdue** (A1, D2) |
| Some paid | **Partly paid** · "₱x left" (A2) | **Overdue · ₱x left** (A4) |
| Fully paid | **Paid** (A1) | **Paid** (A5) |
| Due amount is ₱0.00 (bill cancelled by correction, REQ-046 draft) | **Paid** with ₱0.00 left (C7) | **Paid** (C7) |
| Opening balance line (due = "as of" date, already past) | n/a | **Overdue** or **Paid** (C1, C2) |

### Payment status: effect on the statement

| Payment status ↓ | Lowers the balance? | Shown in Payments list | Pending note | Cases |
|---|---|---|---|---|
| pending (dues) | No | Yes, "Pending approval" | Counted in "{amount} awaiting approval" | B2, E1 |
| approved (dues) | Yes, oldest bill first | Yes, "Approved" | No | A1, E4 |
| rejected | No | Yes, with "Rejected: {reason}" | No | B4, E3 |
| void | No (no longer) | Yes, "Void" | No | B4, E2 |
| approved, `kind` not `dues` (seeded) | **No** | Gap G-9 | No | B6 |

---

## Test plan

### 1. Smoke

The standing smoke pass checks the mock-up's homeowner and admin screens load (`SMK-owner-*`, `SMK-admin-*`). This change adds role-visible areas it doesn't cover. **Smoke additions for QE:**

1. A linked homeowner opens **Dues & Payments** and sees the "Statement of account" card with a balance summary (no page error, no "₱0.00" placeholder while loading).
2. A treasurer and an admin office account open a household from the directory and press **"Statement"**, and the statement headed with the lot opens.
3. **"Download PDF"** produces a file for a fixture household with at least one bill.

### 2. Acceptance

Every Gherkin scenario in REQ-009 maps to at least one case:

| REQ-009 scenario | Cases |
|---|---|
| Payments apply to the oldest period first | A1, A6 |
| A partly paid period | A2 |
| A payment waiting for approval does not lower the balance | B2, B3 |
| Rejected and void payments are not counted | B4, E2, E3 |
| Paying more than is billed leaves credit (decision 2) | B5, A7 |
| The opening balance is the first line | C1, C2 |
| A period becomes overdue at midnight, Manila time | D1, D2, D3 |
| A corrected bill shows its correction | C5, C6 |
| An amenity fee does not pay dues | B6 |
| Credit from before the portal pays the first bills | C3, C4 |
| A new owner sees earlier payments without their details | E5, E6 |
| The balance updates while the page is open | F1, F2 |
| Nothing billed yet | K1 |
| Readable on a phone | M1, M2, M3 |
| Older periods load on request | G1, G3, G4 |
| Download the statement | H1, H2, H3, H4, H5 |
| The PDF can't be made | H8 |
| Staff open a household's statement | I1, I2, I3 |
| A homeowner cannot see another lot's statement | J1, J2, J3 |
| The statement fails to load | K3, K4 |
| The stored balance and the worked-out balance disagree | F4, F5 |

### 3. Regression

What else could break, and why:

- **`shared/domain/ledger.js` is shared** with `decidePayment` (REQ-012), the void function (REQ-014), the billing worker's totals (REQ-008), the dashboard (REQ-015) and, in R2, the delinquent list (REQ-018). Any change to allocation or status here changes their figures. Re-run every ledger unit suite and TC-12's allocation and receipt-lines cases.
- **Household totals** (`billedCentavos`, `paidCentavos`, `balanceCentavos`, `pendingCentavos`) are written by four REQs and read here. The dashboard's balance tile (REQ-015) must equal this statement (TC-09-S1).
- **Payment rows are one shared component** (REQ-015 Sol Arch: "one shared payment-row component"), used by this page, the dashboard's recent payments and the receipt link (REQ-013). The "Made before you joined" rule must hold on all three.
- **Directory household detail (TC-03)** gains the "Statement" button; the household detail layout and the Back path must still work.
- **Linking (TC-04)**: `linkedAt` now drives what a member sees. TC-04's block L (privacy after a sale) was blocked on decision 5; it is answered by option (b) and its cases are re-expressed here as block E. TC-04's removal cases (K) should be re-run with payments present.
- **Roles (TC-02)**: the rules matrix gains `bills`, `payments`, `households` totals reads; re-run TC-02 block B for these collections and the stale-token case.
- **Dates**: `dates.js` is shared with REQ-004 invite expiry (TC-04 block E) and REQ-010's 90-day limit. Re-run their midnight cases.
- **Open defect DEF-001**: the phone layout depends on it; M1 fails until it is fixed.

**Existing specs and screens QE should re-run:** `tests/specs/ui/smoke.spec.js` (SMK-owner-dues or its successor, SMK-admin-homeowners), `tests/specs/ui/navigation.spec.js` NAV-03 (one `aria-current`), NAV-05 (important announcement pop-up must not block the statement), NAV-07 / NAV-08 (375 px, DEF-001); TC-02 block B and D (household isolation); TC-03 household detail; TC-04 blocks K and M.

**Not affected:** sign-in methods (TC-01), invitation codes and email (TC-04 blocks B–I), guard screens, amenity and vehicle screens. The statement is read-only and writes nothing.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "Your balance updates once the treasurer has checked it", "This statement is not an official receipt", "As of {date}" | F1, H3, D6 |
| A value written for one role, never shown back | Yes: correction reason, rejection reason, `orNo`, monthly dues sub-heading | Register rows 2, 11, 12, 14 |
| Status-gated rule checked for one transition only | Yes: every period status and every payment status | Enumeration tables; A-block, B4, B6 |
| Same concept, different word on another screen | Yes: "Partly paid" vs mock-up "Partial"; "awaiting approval" on dashboard and here; "Balance" vs "Amount due" | N1, N2, S1 |
| Dates computed in UTC where the user means local | Yes: overdue at Manila midnight, "As of" date, PDF file name | D1–D6, H6 |
| A derived figure doesn't refresh after a related write | Yes: live balance after approval, void, correction; bills read once while totals are live | F1, F2, F3, F6 |
| Zero and "not set" look the same | Yes: no bills vs ₱0.00 paid up; ₱0.00 vs credit; loading must not show ₱0.00 | K1, K2, B7, K5 |
| A write silently refused by security rules | Yes: no client writes; cross-household reads | J4, J1 |
| Double-tap / two devices create duplicates | Only the PDF button (no writes) | H7 |
| Stale reference | Yes: payment approved, voided or bill corrected while the page is open | F1, F2, F3 |
| Backdrop click loses work or leaves stale state | No modal holds input on this page. Not applicable | — |
| A modal appearing mid-flow blocks the next action | Yes: important announcement pop-up (REQ-017) over Dues & Payments | L7 |
| Assumed SDK/network behaviour baked into a case | Yes: offline behaviour of the live listener; PDF on low-end phones | K4, H9 (assumptions marked) |
| Data leaking across households or roles | Yes, the core risk: other lots, board, guard, previous owner's details, PDF contents | J-block, E-block, H5 |

### Scenario list by mandatory type

- **Negative**: another lot's statement by address and by query; board, guard, stranger, signed-out reads; client writes to bills, payments, totals; rejected, void and amenity payments not counted; PDF build failure; load failure. J1–J8, B4, B6, H8, K3.
- **Boundary**: 11:59 PM vs 12:00 AM Manila on the due date; 00:00–07:59 Manila (UTC still the previous day); year end; February; exactly ₱0.00, ₱0.01 left, ₱0.01 credit; exactly 12 vs 13 periods; 20 and 24 periods; `submittedAt` equal to `linkedAt`; 759 vs 760 px. D1–D5, A8, B7, B8, G1–G3, E7, M4.
- **Usability**: balance first, status words not colour alone, tabular right-aligned amounts, skeletons not ₱0.00, error that says what to do, PDF button full-width, 375 px with no sideways scroll, screen reader order, tap targets. M-block, K5.
- **Navigation**: homeowner menu to Dues & Payments and back; staff directory to household to Statement and back; deep link and reload; board and guard by URL; notification "statement ready" lands here; treasurer-who-is-homeowner switch. L-block.

---

## A. Ledger: allocation and period status

#### TC-09-A1: Approved payments pay the oldest periods first
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** Staging note: controllable clock
- **Setup:** HH-L billed ₱1,800.00 for each period June–November 2026 (due the last day of each month); ₱5,400.00 of approved dues payments; today Dec 5, 2026 Manila.
- **Action:** U-ROBERTO opens Dues & Payments.
- **Expected:** June, July and August 2026 read "Paid"; September, October and November 2026 read "Overdue"; the summary reads "Balance ₱5,400.00 · 3 periods overdue".
- **Don't assert:** colours, card order beyond newest first.

#### TC-09-A2: A period not yet due with some paid reads "Partly paid" with what is left
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** Staging note: controllable clock
- **Setup:** HH-L billed every period up to December 2026 (due Dec 31, 2026); approved payments cover everything before December plus ₱1,200.00; today Dec 5, 2026.
- **Expected:** December 2026 reads "Partly paid" with "₱600.00 left".
- **Don't assert:** layout of the "left" amount.

#### TC-09-A3: A period not yet due with nothing paid reads "Unpaid"
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: controllable clock
- **Setup:** HH-P has only a December 2026 bill, nothing paid; today Dec 5, 2026.
- **Expected:** December 2026 reads "Unpaid"; summary "Balance ₱1,800.00 · Nothing overdue".
- **Don't assert:** —

#### TC-09-A4: An overdue period that is partly paid reads "Overdue · ₱600.00 left"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** Staging note: controllable clock
- **Setup:** HH-L billed June–November; approved ₱6,600.00 (three periods plus ₱1,200.00); today Dec 5, 2026.
- **Expected:** September 2026 reads "Overdue · ₱600.00 left"; October and November read "Overdue"; the summary counts 3 periods overdue.
- **Don't assert:** —

#### TC-09-A5: A fully paid period stays "Paid" after its due date
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** HH-B's November 2026 bill fully paid; today after Nov 30, 2026.
- **Expected:** November 2026 reads "Paid", never "Overdue".
- **Don't assert:** —

#### TC-09-A6: No later period ever shows paid while an earlier one is not
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (ledger rule). **Tags:** —
- **Setup:** A table of seeded accounts: 1–60 bills with mixed amounts (including corrected amounts and an opening line), paid totals from ₱0.00 to more than billed, in centavos.
- **Action:** Work out every period's paid amount and status.
- **Expected:** For every account, paid amounts are non-increasing from oldest to newest except where a bill's due amount differs; no period has any paid amount while an older period still has an amount left; the sum of per-period paid equals the smaller of the paid pool and the total due.
- **Don't assert:** specific figures beyond the invariant.

#### TC-09-A7: Credit left after paying everything is applied to a bill created later
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ROSA); Treasurer runs billing (S-TREAS). **Tags:** Staging note: controllable clock
- **Setup:** HH-CR billed ₱1,800.00 in total; ₱3,000.00 approved (summary "₱1,200.00 credit").
- **Action:** Bill January 2027 at ₱1,800.00 (REQ-008); U-ROSA reopens Dues & Payments.
- **Expected:** January 2027 reads "Partly paid" with "₱600.00 left"; the summary reads "Balance ₱600.00".
- **Don't assert:** the "Nothing overdue" part (depends on the clock chosen).

#### TC-09-A8: One centavo left keeps a period from reading "Paid"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** none (ledger rule). **Tags:** —
- **Setup:** One ₱1,800.00 bill; paid pool ₱1,799.99; then ₱1,800.00; then ₱1,800.01.
- **Expected:** ₱1,799.99 → "Partly paid" (or "Overdue · ₱0.01 left" after the due date) with "₱0.01 left"; ₱1,800.00 → "Paid", balance ₱0.00; ₱1,800.01 → "Paid" and "₱0.01 credit". Amounts are exact; no rounding to whole pesos.
- **Don't assert:** —

#### TC-09-A9: Amounts with centavos add up exactly across many periods
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (ledger rule). **Tags:** —
- **Setup:** 36 bills of ₱1,833.33 and a paid pool of ₱20,000.00.
- **Expected:** Balance equals 36 × 183,333 centavos − 2,000,000 centavos exactly; every displayed amount has two decimals; no floating-point residue (for example "₱0.00" never shows as "-₱0.00").
- **Don't assert:** —

#### TC-09-A10: The summary counts overdue periods, including the opening balance line
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** Gap G-6 · Staging note: controllable clock
- **Setup:** HH-L with an unpaid opening balance and two overdue billed periods; then one overdue period only.
- **Expected (pending G-6):** the summary counts the overdue periods; with one, it reads "1 period overdue" (singular wording, G-6); with the opening line overdue it is counted (G-6).
- **Don't assert:** the singular form or whether the opening line counts until G-6 is answered.

## B. Balance, pending, rejected, void, credit, amenity fees

#### TC-09-B1: The balance equals everything billed minus approved dues payments minus opening credit
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (ledger rule). **Tags:** —
- **Setup:** Accounts combining bills, corrections (adjusted), an opening balance, an opening credit and approved payments.
- **Expected:** Balance = Σ(amount + adjusted) of bills − approved dues payments − opening credit, in centavos, for every account.
- **Don't assert:** —

#### TC-09-B2: A pending payment does not lower the balance
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** HH-P balance ₱3,600.00; one pending ₱3,600.00 dues payment.
- **Expected:** The balance still reads ₱3,600.00; no period changes status because of the pending payment.
- **Don't assert:** —

#### TC-09-B3: A pending amount shows the "awaiting approval" note
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** As B2.
- **Expected:** The statement shows "₱3,600.00 awaiting approval. Your balance updates once the treasurer has checked it."; with two pending payments (₱1,800.00 and ₱500.00) the note reads "₱2,300.00 awaiting approval…"; with none pending, no note.
- **Don't assert:** the note's position.

#### TC-09-B4: Rejected and void payments don't change the balance
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** HH-P balance ₱1,800.00; one ₱1,800.00 payment rejected; another ₱1,800.00 payment approved then voided (seeded or through REQ-012 and REQ-014).
- **Expected:** Balance ₱1,800.00; both payments are listed under Payments with "Rejected" and "Void".
- **Don't assert:** row order.

#### TC-09-B5: Paying more than billed shows credit, not a negative balance
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROSA). **Tags:** —
- **Setup:** HH-CR billed ₱1,800.00 in total, ₱3,000.00 approved.
- **Expected:** The summary reads "₱1,200.00 credit"; it never shows "−₱1,200.00" or "Balance −₱1,200.00".
- **Don't assert:** whether "Balance ₱0.00" also appears beside the credit (REQ-012 says "₱0.00" plus "₱x credit", REQ-009 shows "₱1,200.00 credit": Gap G-7).

#### TC-09-B6: An approved amenity fee payment does not reduce dues
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** Staging note: `kind: amenityFee` payment seeded by the Admin SDK (no R1 screen can create it) · Gap G-9
- **Setup:** HH-L owes ₱1,800.00 for November 2026; one approved ₱500.00 payment with `kind: amenityFee` and `paidCentavos` unchanged.
- **Expected:** November 2026 still reads "Overdue" with ₱1,800.00 left; balance ₱1,800.00.
- **Don't assert:** whether or how the fee payment is listed (G-9).

#### TC-09-B7: Exactly paid up reads "Balance ₱0.00 · Nothing overdue", not credit
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** HH-B billed ₱1,800.00, ₱1,800.00 approved.
- **Expected:** "Balance ₱0.00 · Nothing overdue"; no "credit" wording; no "awaiting approval" note.
- **Don't assert:** —

#### TC-09-B8: One centavo of credit reads "₱0.01 credit"
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** none (summary wording). **Tags:** —
- **Setup:** Billed ₱1,800.00, approved ₱1,800.01.
- **Expected:** "₱0.01 credit".
- **Don't assert:** —

#### TC-09-B9: A payment the treasurer rejected after it was pending removes the awaiting note
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO); Treasurer (S-TREAS). **Tags:** —
- **Setup:** HH-P balance ₱1,800.00, ₱1,800.00 pending; U-CARLO has the page open.
- **Action:** S-TREAS rejects the payment (REQ-012).
- **Expected:** The awaiting note disappears without a reload (it comes from the live `pendingCentavos`); the balance still reads ₱1,800.00.
- **Don't assert:** whether the Payments list row changes without a reload (G-4).

## C. Opening balance, opening credit and corrections

#### TC-09-C1: The opening balance is the oldest line and reads overdue
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** —
- **Setup:** HH-L has an opening balance of ₱9,000.00 and periods from December 2026, nothing paid.
- **Expected:** The oldest line reads "Balance before December 2026 · ₱9,000.00 · Overdue".
- **Don't assert:** the due date shown on the opening line.

#### TC-09-C2: Payments pay off the opening balance before the first billed period
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** —
- **Setup:** As C1, with ₱10,000.00 approved.
- **Expected:** The opening line reads "Paid"; December 2026 reads "Partly paid" (or "Overdue · …") with "₱800.00 left".
- **Don't assert:** —

#### TC-09-C3: Credit from before the portal is the oldest line
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROSA). **Tags:** —
- **Setup:** HH-CR opening credit ₱1,200.00; December 2026 billed ₱1,800.00; no payments.
- **Expected:** The oldest line reads "Credit before December 2026 · ₱1,200.00".
- **Don't assert:** —

#### TC-09-C4: Opening credit pays the first bill like a payment
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROSA). **Tags:** —
- **Setup:** As C3.
- **Expected:** December 2026 reads "Partly paid" with "₱600.00 left"; the balance reads ₱600.00; the opening credit line is not counted as a billed period.
- **Don't assert:** —

#### TC-09-C5: A corrected bill shows the original amount and the correction
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Blocked — REQ-046 draft · Gap G-8
- **Setup:** HH-P's December 2026 bill ₱1,800.00 with a correction of −₱200.00, reason "Wrong rate" (seeded or via REQ-046).
- **Expected:** December 2026 shows billed ₱1,800.00 and "Corrected: −₱200.00 (Wrong rate)" (copy of record includes the reason; the Gherkin omits it, G-8).
- **Don't assert:** whether the reason appears until G-8 is answered.

#### TC-09-C6: The balance counts the corrected amount
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Blocked — REQ-046 draft
- **Setup:** As C5, nothing paid.
- **Expected:** The balance counts ₱1,600.00 for December 2026; "₱1,600.00 left" on the period.
- **Don't assert:** —

#### TC-09-C7: A cancelled bill reads "Paid" with ₱0.00 left and is still listed
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Blocked — REQ-046 draft
- **Setup:** HH-P's December 2026 bill corrected by −₱1,800.00 ("Billed in error").
- **Expected:** December 2026 is listed, shows "Corrected: −₱1,800.00 (Billed in error)" and reads "Paid"; it is not counted as overdue after its due date; balance unaffected by it.
- **Don't assert:** —

#### TC-09-C8: The treasurer's correction note is never shown to the homeowner
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Blocked — REQ-046 draft
- **Setup:** A correction with reason "Waived by the board" and note "ZZ Board resolution 2026-07".
- **Expected:** The homeowner's statement and PDF show the reason only; the note text appears nowhere on the page or PDF.
- **Don't assert:** —

#### TC-09-C9: Two corrections on one bill both show
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Blocked — REQ-046 draft · Gap G-8
- **Setup:** December 2026 corrected by −₱200.00 then +₱200.00 (undo, REQ-046 decision 5).
- **Expected (pending G-8):** both corrections are shown and ₱1,800.00 is due (REQ-046 "Undo" scenario).
- **Don't assert:** layout of multiple correction lines (G-8: the bill stores one `adjustedCentavos` sum).

## D. Dates and overdue (Asia/Manila)

#### TC-09-D1: At 11:59 PM Manila on the due date the period reads "Unpaid"
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: controllable clock
- **Setup:** HH-P December 2026 bill due Dec 31, 2026, unpaid.
- **Action:** Open the statement at Dec 31, 2026 23:59:59 Manila.
- **Expected:** December 2026 reads "Unpaid"; summary "Nothing overdue".
- **Don't assert:** —

#### TC-09-D2: At 12:00 AM Manila the next day the period reads "Overdue"
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: controllable clock
- **Setup:** As D1.
- **Action:** Open the statement at Jan 1, 2027 00:00:00 Manila.
- **Expected:** December 2026 reads "Overdue"; summary "1 period overdue" (wording G-6).
- **Don't assert:** the singular wording.

#### TC-09-D3: Between midnight and 8 AM Manila (still the previous day in UTC) the period is overdue
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: controllable clock
- **Setup:** As D1.
- **Action:** Open the statement at Jan 1, 2027 07:59 Manila (Dec 31, 2026 23:59 UTC).
- **Expected:** "Overdue". The UTC date is not used.
- **Don't assert:** —

#### TC-09-D4: A device set to another time zone sees the same status
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: browser time zone set to America/Los_Angeles
- **Setup:** As D1; Manila time Jan 1, 2027 06:00 (Dec 31 afternoon in Los Angeles).
- **Expected:** "Overdue"; due dates still print "Dec 31, 2026".
- **Don't assert:** —

#### TC-09-D5: February's due date is the last day of February, including a leap year
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-LONG). **Tags:** —
- **Setup:** Bills for February 2027 and February 2028 (seeded by the billing worker's due-date rule).
- **Expected:** Due dates read "Feb 28, 2027" and "Feb 29, 2028"; overdue starts Mar 1 in both years.
- **Don't assert:** —

#### TC-09-D6: "As of" shows the Manila date the statement was read
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: controllable clock
- **Setup:** Open the statement at Dec 6, 2026 00:30 Manila (Dec 5 UTC).
- **Expected:** "As of Dec 6, 2026".
- **Don't assert:** —

#### TC-09-D7: A page left open across the due-date midnight
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Gap G-5 · Staging note: controllable clock
- **Setup:** Open the statement at Dec 31, 2026 23:58 Manila and leave it open past midnight.
- **Expected (pending G-5):** after a reload, December reads "Overdue". Whether it flips without a reload is G-5.
- **Don't assert:** the no-reload behaviour.

#### TC-09-D8: The period label and due date use the glossary formats
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Expected:** Periods read "November 2026"; due dates "Nov 30, 2026"; never "2026-11" or "11/30/2026".
- **Don't assert:** —

## E. Payments list and privacy after a sale

#### TC-09-E1: A pending payment row shows date, amount, last four of the reference and status
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** U-CARLO submitted ₱1,800.00 with REF-1 on Dec 3, 2026, pending.
- **Expected:** "Dec 3, 2026 · ₱1,800.00 · ref …9554 · Pending approval"; the full reference number is not shown in the row.
- **Don't assert:** whether the date is the date paid or submitted beyond what the copy of record shows (REQ-010 list row uses {date}; Gap G-10).

#### TC-09-E2: A void payment is listed as "Void"
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** An approved HH-P payment voided (REQ-014).
- **Expected:** Its row reads "Void" (REQ-014 wording), and it is still listed.
- **Don't assert:** whether the void reason shows here (REQ-014's notification carries it; the row is not specified).

#### TC-09-E3: A rejected payment is listed with its reason
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO-2, the member who did not submit). **Tags:** Gap G-1
- **Setup:** U-CARLO's payment rejected with "Amount does not match the screenshot".
- **Expected (pending G-1):** U-CARLO-2 sees the row "Rejected: Amount does not match the screenshot" (REQ-012 says every member sees the reason; REQ-010 stores it in `paymentPrivate`, which only the submitter reads: G-1).
- **Don't assert:** the reason for U-CARLO-2 until G-1 is answered; assert it for U-CARLO.

#### TC-09-E4: An approved payment row shows its receipt number
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** U-CARLO's payment approved as a fixture receipt number.
- **Expected:** The row reads "Approved" with that receipt number.
- **Don't assert:** the receipt link (REQ-013, TC-13).

#### TC-09-E5: A payment submitted before the viewer joined shows date, amount and status only
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** New owner (U-BEN). **Tags:** Blocked — DPO
- **Setup:** U-ANA submitted ₱1,800.00 with REF-1 on Dec 3, 2026, approved; U-ANA removed; U-BEN linked to HH-A on Jan 10, 2027.
- **Expected:** The row reads "Dec 3, 2026 · ₱1,800.00 · Approved · Made before you joined"; no reference number (not even "…9554"), no screenshot, no payer name, no receipt link.
- **Don't assert:** —

#### TC-09-E6: Payments from before the sale still count in the new owner's balance
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** New owner (U-BEN). **Tags:** —
- **Setup:** As E5, with HH-A billed ₱3,600.00 in total.
- **Expected:** U-BEN's balance reads ₱1,800.00 (U-ANA's payment counted); the periods it paid read "Paid".
- **Don't assert:** —

#### TC-09-E7: A payment submitted at the exact moment of linking is not "before you joined"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** New owner (U-BEN). **Tags:** Staging note: timestamps seeded by the Admin SDK
- **Setup:** Three HH-A payments with `submittedAt` 1 ms before, equal to, and 1 ms after U-BEN's `linkedAt`.
- **Expected:** Only the payment 1 ms before is labelled "Made before you joined"; the equal one shows full summary details (REQ-013: visible when `linkedAt` is on or before `submittedAt`).
- **Don't assert:** —

#### TC-09-E8: The rule uses when the payment was submitted, not the date paid typed in
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** New owner (U-BEN). **Tags:** —
- **Setup:** A payment submitted after U-BEN's link with a "Date paid" 10 days before his link.
- **Expected:** It is **not** labelled "Made before you joined"; its ref …last 4 shows.
- **Don't assert:** —

#### TC-09-E9: A member linked after the owner also sees the owner's earlier payments as "before you joined"
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** Second member (U-BEN-2). **Tags:** Blocked — DPO
- **Setup:** U-BEN submitted a payment on Jan 15, 2027; U-BEN-2 linked on Feb 1, 2027.
- **Expected:** U-BEN-2 sees U-BEN's payment labelled "Made before you joined" with no reference (REQ-013 decision 5 consequence); U-BEN sees it in full.
- **Don't assert:** —

#### TC-09-E10: A member who submitted a payment before re-joining still sees its details
**Priority** P3 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA, removed then linked again). **Tags:** Gap G-2
- **Setup:** U-ANA submitted a payment, was removed, and later re-linked to HH-A (later `linkedAt`).
- **Expected (pending G-2):** her own payment shows full summary details (REQ-013 "unless that member submitted the payment"); REQ-009 does not state the exception (G-2).
- **Don't assert:** until G-2 is answered.

#### TC-09-E11: The payments list shows 10 at a time, newest first
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-LONG). **Tags:** Gap G-3
- **Setup:** HH-LONG with 11 and then 25 payments.
- **Expected:** The 10 newest show first; the remaining ones can be reached (control and wording undefined, G-3); the balance is the same whichever page is shown.
- **Don't assert:** the "more" control's wording.

#### TC-09-E12: No payments yet shows the statement without an empty list error
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Gap G-3
- **Setup:** HH-P has bills but no payments.
- **Expected:** The periods and balance show; the Payments section shows an empty state, not an error or a spinner (wording undefined, G-3).
- **Don't assert:** the empty wording.

## F. Live balance and the mismatch report

#### TC-09-F1: An approval made while the page is open updates the summary without a reload
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO); Treasurer (S-TREAS). **Tags:** Staging note: two sessions at once
- **Setup:** HH-P balance ₱3,600.00, ₱3,600.00 pending; U-CARLO has Dues & Payments open.
- **Action:** S-TREAS approves the payment.
- **Expected:** Without a reload, the summary changes to "Balance ₱0.00 · Nothing overdue" and the awaiting note disappears.
- **Don't assert:** how fast (seconds), the payment row's status (G-4).

#### TC-09-F2: A void made while the page is open raises the balance without a reload
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO); Treasurer (S-TREAS). **Tags:** Staging note: two sessions
- **Setup:** HH-P balance ₱0.00 after an approved ₱1,800.00 payment; page open.
- **Action:** S-TREAS voids it (REQ-014).
- **Expected:** The summary reads "Balance ₱1,800.00" without a reload.
- **Don't assert:** period statuses until G-5 is answered.

#### TC-09-F3: The period cards agree with the live summary after an approval
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ROBERTO); Treasurer. **Tags:** Gap G-5 · Staging note: two sessions
- **Setup:** HH-L with three overdue periods; page open; a pending ₱1,800.00 payment.
- **Action:** Treasurer approves it.
- **Expected (pending G-5):** the oldest overdue period reads "Paid" and the summary "2 periods overdue", without a reload. The summary and the cards never disagree on screen.
- **Don't assert:** the no-reload card update until G-5 is answered; after a reload both must agree.

#### TC-09-F4: When stored and worked-out balances differ, the stored balance is shown
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** Staging note: totals seeded inconsistent by the Admin SDK · Provisional — SA-001 follow-up
- **Setup:** HH-L's stored `balanceCentavos` is ₱5,400.00 while its bills and paid total work out to ₱3,600.00.
- **Expected:** The summary shows ₱5,400.00.
- **Don't assert:** the period cards' figures (they are worked out from the bills).

#### TC-09-F5: The mismatch report carries the household id and both figures, and nothing else
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** Developer (error monitoring sink). **Tags:** Staging note: as F4 · Provisional — SA-001 follow-up
- **Setup:** As F4.
- **Expected:** Exactly one report per page open with the household id, 540000 and 360000 as numbers; no name, lot label, email, uid of the viewer, or reference number.
- **Don't assert:** the report's event name.

#### TC-09-F6: A bill created while the page is open does not raise a false mismatch
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO); Treasurer runs billing. **Tags:** Gap G-5 · Staging note: two sessions
- **Setup:** U-CARLO has the statement open; the bills were read once when it opened.
- **Action:** The treasurer bills the next period; the live listener receives the higher `billedCentavos` / `balanceCentavos`.
- **Expected (pending G-5):** no mismatch report is sent because of the page's stale bill list; the screen either re-reads bills or shows the stored balance consistently.
- **Don't assert:** which of the two until G-5 is answered.

#### TC-09-F7: Agreeing figures send no report
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** Every fixture household with consistent totals.
- **Expected:** No mismatch report after opening each statement.
- **Lane:** exclusive — asserts the error-monitoring sink holds no mismatch reports.
- **Don't assert:** —

## G. Older periods on request

#### TC-09-G1: Exactly 12 periods show without "Show earlier periods"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-LONG). **Tags:** Gap G-11
- **Setup:** HH-LONG with 12 billed periods.
- **Expected:** All 12 show; no "Show earlier periods" control.
- **Don't assert:** whether an opening line counts among the 12 (G-11).

#### TC-09-G2: 13 periods show 12 and "Show earlier periods (1)"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-LONG). **Tags:** —
- **Setup:** 13 periods.
- **Expected:** The 12 newest; "Show earlier periods (1)".
- **Don't assert:** —

#### TC-09-G3: 20 periods show 12, and the rest appear below without moving the screen
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-LONG). **Tags:** —
- **Setup:** 20 periods.
- **Action:** Press "Show earlier periods (8)".
- **Expected:** The 8 older periods appear below the 12; what was on screen does not move (no scroll jump); the control disappears.
- **Don't assert:** animation.

#### TC-09-G4: The balance covers all periods whether or not the earlier ones are shown
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-LONG). **Tags:** —
- **Setup:** 20 periods, the oldest 3 unpaid.
- **Expected:** The balance and overdue count include the 3 hidden periods before "Show earlier periods" is pressed, and are unchanged after.
- **Don't assert:** —

#### TC-09-G5: "Show earlier periods" makes no new request for bills
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-LONG). **Tags:** Provisional — SA-001 follow-up
- **Expected:** Pressing it performs no Firestore read of `bills` (display only).
- **Don't assert:** read counts for the payments list.

## H. PDF

#### TC-09-H1: "Download PDF" downloads a file named with the lot and the Manila date
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** Staging note: controllable clock
- **Setup:** HH-L, today Dec 5, 2026 Manila.
- **Expected:** A PDF named "Statement-Blk-3-Lot-9-2026-12-05.pdf" downloads.
- **Don't assert:** file size.

#### TC-09-H2: The PDF lists every period with the same amounts, statuses and balance as the screen
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-LONG). **Tags:** —
- **Setup:** HH-LONG with 20 periods, an opening line and a partly paid period, earlier periods **not** expanded on screen.
- **Expected:** The PDF lists all 20 periods and the opening line; each period's billed, paid and status equal the screen's; the balance equals the summary.
- **Don't assert:** page breaks.

#### TC-09-H3: The PDF shows "As of" and the not-a-receipt line
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** The PDF shows "As of Dec 5, 2026. This statement is not an official receipt."
- **Don't assert:** position.

#### TC-09-H4: Amounts print with the peso sign, and "ñ" prints
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: a brand or correction reason containing "ñ" (for example HOA name "ZZ Peñafrancia Test HOA")
- **Expected:** Amounts print as "₱1,800.00", never "1,800.00", "P1,800.00" or a box in place of "₱"; "ñ" prints as "ñ".
- **Don't assert:** the font name.

#### TC-09-H5: The PDF carries the lot and HOA name only, no contact details or references
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** HH-P with a contact email and mobile on file, approved and pending payments with REF-1.
- **Expected:** The PDF text contains the lot and the HOA name; it contains no email address, no mobile number, no reference number (full or last 4) and no correction note. The file name contains the lot, not a person's name.
- **Don't assert:** whether the owner's name appears (not specified; G-12).

#### TC-09-H6: The file name and "As of" use the Manila date just after midnight
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: controllable clock
- **Setup:** Dec 6, 2026 00:30 Manila.
- **Expected:** "Statement-Blk-…-2026-12-06.pdf" and "As of Dec 6, 2026".
- **Don't assert:** —

#### TC-09-H7: Pressing "Download PDF" twice makes one file, with "Preparing…" in flight
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Action:** Press "Download PDF" twice quickly.
- **Expected:** The button reads "Preparing…" and is disabled while building; one file downloads.
- **Don't assert:** build time.

#### TC-09-H8: A PDF that fails to build shows the fallback message and leaves the screen unchanged
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: PDF module load blocked or forced to throw
- **Expected:** "We couldn't make the PDF. Try again, or take a screenshot of this page."; the statement on screen is unchanged; the button is usable again; the error goes to error monitoring without personal data.
- **Don't assert:** the error's stack.

#### TC-09-H9: A 24-period PDF builds on a real low-end Android phone
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-LONG). **Tags:** Staging note: real low-end Android device (Sol Arch: "Uncertain but likely fine"; QA to test on a device)
- **Setup:** HH-LONG with 24 periods.
- **Expected:** The PDF builds and downloads; the page stays responsive; amounts and "₱" print correctly. Note the time taken.
- **Don't assert:** a time limit (none is set; record it for the owner).

#### TC-09-H10: The PDF library is not part of the first page load
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Opening Dues & Payments fetches no PDF library or font file; pressing "Download PDF" fetches them once.
- **Don't assert:** bundle sizes.

#### TC-09-H11: A new owner's PDF does not show earlier payments' details
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** New owner (U-BEN). **Tags:** Gap G-12 · Blocked — DPO
- **Setup:** As E5.
- **Expected (pending G-12):** if the PDF lists payments, U-ANA's payment shows date, amount and status only.
- **Don't assert:** whether payments are listed in the PDF at all (G-12).

#### TC-09-H12: The PDF prints in both brands
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Greenfield Homes HOA and Gentri Heights HOA builds each print their own HOA name on the PDF.
- **Don't assert:** logos.

## I. Staff view

#### TC-09-I1: Admin office staff open a household's statement from the directory
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Admin office (S-ADMIN). **Tags:** —
- **Action:** Open HH-L in the directory, press "Statement".
- **Expected:** The statement headed "Blk 3 Lot 9" opens, with the same periods, statuses, balance and awaiting note as U-ROBERTO sees.
- **Don't assert:** the homeowner sub-heading wording on the staff view.

#### TC-09-I2: The treasurer opens a household's statement from the directory
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer (S-TREAS). **Tags:** —
- **Expected:** As I1.
- **Don't assert:** REQ-046 controls (I4).

#### TC-09-I3: The admin office's statement has no way to change a bill or payment
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office (S-ADMIN). **Tags:** —
- **Expected:** No edit, correct, cancel, approve, reject or void control anywhere on the statement.
- **Don't assert:** —

#### TC-09-I4: The treasurer's statement view and REQ-046's "Correct this bill"
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer (S-TREAS). **Tags:** Blocked — REQ-046 draft · Gap G-13
- **Expected (pending G-13):** REQ-009 says "no way to change a bill or payment from it"; REQ-046 (draft) adds "Correct this bill" and "Cancel this bill" on this view for the treasurer only. Expected once G-13 is answered.
- **Don't assert:** until REQ-046 is approved and G-13 answered.

#### TC-09-I5: Staff see the full payment list for a sold lot
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, admin office. **Tags:** Gap G-14
- **Setup:** HH-A after the sale (E5).
- **Expected (pending G-14):** staff see U-ANA's payment with its ref …last 4 and no "Made before you joined" label (staff are not members, so the label has no meaning for them).
- **Don't assert:** until G-14 is answered.

#### TC-09-I6: Statement works for a deactivated household
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Admin office. **Tags:** —
- **Setup:** HH-D deactivated (REQ-003), with bills and payments.
- **Expected:** "Statement" opens from the Inactive list and shows its bills and balance.
- **Don't assert:** what HH-D's members see (TC-04 Gap G-27).

## J. Roles, rules and data leaks

All J cases assert the refusal explicitly ("nothing showed" is not proof).

#### TC-09-J1: A homeowner opening another lot's statement address sees the no-access page
**Priority** P1 · **Type** Security (cross-household) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA, HH-M only). **Tags:** Gap G-15
- **Action:** Open the statement address for HH-L (route shape G-15).
- **Expected:** "You don't have access to this page"; no HH-L figure renders, even briefly.
- **Don't assert:** the URL format.

#### TC-09-J2: Firestore refuses a homeowner's read of another lot's bills
**Priority** P1 · **Type** Security (cross-household) · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA. **Tags:** Provisional — SA-001 follow-up
- **Action:** Query `bills` where `householdId == HH-L`; get one HH-L bill by id.
- **Expected:** Both refused.
- **Don't assert:** error code text.

#### TC-09-J3: Firestore refuses a homeowner's read of another lot's payments and totals
**Priority** P1 · **Type** Security (cross-household) · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA. **Tags:** Provisional — SA-001 follow-up
- **Action:** Query `payments` where `householdId == HH-L`; get `households/HH-L`.
- **Expected:** Both refused.
- **Don't assert:** —

#### TC-09-J4: A query for bills without a household filter is refused for members
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-CARLO. **Tags:** Provisional — SA-001 follow-up
- **Action:** Query all `bills` (no `householdId` filter), and `payments` likewise.
- **Expected:** Refused; a query filtered on HH-P is allowed.
- **Don't assert:** —

#### TC-09-J5: No client can write bills, payments or household totals, staff included
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, S-TREAS, S-ADMIN. **Tags:** Provisional — SA-001 follow-up
- **Action:** Create or update a bill (`amountCentavos`, `adjustedCentavos`); update a payment's `status`; update `households/HH-P.balanceCentavos` or `paidCentavos`.
- **Expected:** All refused; values unchanged on re-read.
- **Don't assert:** —

#### TC-09-J6: The board has no statement in R1
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** Board (S-BOARD). **Tags:** —
- **Expected:** No "Statement" control and no Homeowners menu; the statement address shows "You don't have access to this page"; reads of `bills`, `payments` and household totals are refused.
- **Don't assert:** —

#### TC-09-J7: A guard has no statement and no financial reads
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** Guard (S-GUARD). **Tags:** —
- **Expected:** The statement address shows "You don't have access to this page"; reads of `bills`, `payments` and household totals are refused.
- **Don't assert:** —

#### TC-09-J8: A removed owner can no longer read the lot's statement
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA after removal from HH-A. **Tags:** —
- **Expected:** Dues & Payments shows the not-linked screen (REQ-001), not HH-A's statement; reads of HH-A bills, payments and totals are refused.
- **Don't assert:** how quickly an already open page reacts (TC-04 Gap G-26).

#### TC-09-J9: A signed-out or no-household account reads nothing
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Anonymous; U-STRANGER. **Tags:** —
- **Expected:** Reads of `bills`, `payments`, `households` refused; U-STRANGER's Dues & Payments shows the not-linked screen.
- **Don't assert:** —

#### TC-09-J10: A staff role removed with a stale token can no longer read statements
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN with role removed, old ID token. **Tags:** Provisional — SA-001 follow-up (L-004)
- **Expected:** Reads of another lot's `bills` and `payments` refused at once (rules check `staff/{uid}`).
- **Don't assert:** —

#### TC-09-J11: A new owner reading a pre-join payment document directly
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** New owner (U-BEN). **Tags:** Gap G-16 · Blocked — DPO
- **Action:** Read the `payments` summary document of U-ANA's payment, and its `paymentPrivate` document, through the SDK.
- **Expected:** `paymentPrivate` refused. The summary is readable (household-visible by design) and contains `refLast4` and `submittedBy`; whether that is acceptable when the screen hides them is G-16.
- **Don't assert:** the summary outcome until G-16 is answered.

## K. Empty, loading and error states

#### TC-09-K1: Nothing billed yet shows the empty message and ₱0.00
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ZERO). **Tags:** —
- **Setup:** HH-Z, no bills.
- **Expected:** "No bills yet. Your first statement appears when the HOA bills the next period."; the balance reads "₱0.00".
- **Don't assert:** —

#### TC-09-K2: Paid up with bills shows periods, not the "No bills yet" message
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** HH-B, one bill fully paid.
- **Expected:** The period card shows "Paid"; "No bills yet" does not appear; summary "Balance ₱0.00 · Nothing overdue".
- **Don't assert:** —

#### TC-09-K3: A load failure shows the error with "Try again" and no balance
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** Staging note: bills read forced to fail
- **Expected:** "We couldn't load your statement. Check your connection and try again." with "Try again"; no balance figure is shown (not ₱0.00, not a partial figure).
- **Don't assert:** —

#### TC-09-K4: "Try again" after the connection returns loads the statement
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Assumption: offline behaviour of the Firestore SDK cache is not asserted
- **Setup:** As K3, then restore the connection.
- **Action:** Press "Try again".
- **Expected:** The statement loads with the correct balance.
- **Don't assert:** whether cached data shows while offline.

#### TC-09-K5: While loading, skeletons show and "₱0.00" never does
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO, who owes money). **Tags:** Staging note: slow network
- **Expected:** A skeleton summary and three skeleton cards show until data arrives; no "₱0.00" or "Nothing overdue" appears at any moment before the real balance.
- **Don't assert:** skeleton shape.

#### TC-09-K6: The sub-heading shows the lot and the current monthly dues
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** `config/payment.monthlyDuesCentavos` = ₱1,800.00.
- **Expected:** "Blk 5 Lot 1 · Monthly dues ₱1,800.00, due on the last day of each month".
- **Don't assert:** —

## L. Navigation

#### TC-09-L1: A homeowner reaches the statement from the menu and the item is highlighted
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Dues & Payments" in the menu opens the page headed "Dues & Payments"; exactly one menu item carries `aria-current` (NAV-03).
- **Don't assert:** —

#### TC-09-L2: Reloading Dues & Payments reopens it
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** After a reload the same page opens with the same balance; "Show earlier periods" is collapsed again.
- **Don't assert:** —

#### TC-09-L3: Staff go directory → household → Statement → Back to the household
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Admin office. **Tags:** —
- **Expected:** Browser Back from the statement returns to the household detail, then to the directory with its filter kept (REQ-003 behaviour).
- **Don't assert:** —

#### TC-09-L4: The "statement is ready" notification lands on Dues & Payments
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Setup:** U-CARLO has the unread "Your December 2026 statement is ready…" notification (REQ-008, REQ-011).
- **Expected:** Pressing it opens Dues & Payments showing December 2026.
- **Don't assert:** marking read (TC-11).

#### TC-09-L5: A treasurer who is also a homeowner sees their own statement under "My household"
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO. **Tags:** —
- **Expected:** In "My household", Dues & Payments shows HH-F's statement; in "Treasurer", the menu shows staff items and HH-F's statement is reachable from the directory.
- **Don't assert:** —

#### TC-09-L6: A homeowner opening the staff statement route for their own lot
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-CARLO. **Tags:** Gap G-15
- **Action:** Open the staff statement address for HH-P.
- **Expected (pending G-15):** either the no-access page or a redirect to Dues & Payments; never the staff directory chrome.
- **Don't assert:** which, until G-15 is answered.

#### TC-09-L7: An important announcement pop-up does not hide the statement for good
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Setup:** An unacknowledged important announcement (REQ-017).
- **Action:** Deep-link to Dues & Payments; acknowledge the pop-up.
- **Expected:** After acknowledging, Dues & Payments is shown (not the dashboard) with its balance.
- **Don't assert:** pop-up wording.

## M. Usability, accessibility and responsive (WCAG 2.2 AA)

#### TC-09-M1: At 375 px each period is a card and the page does not scroll sideways
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** DEF-001 must be fixed first
- **Expected:** Each period is a card with Period, Due date, Billed, Paid and Status; `document.scrollingElement.scrollWidth` ≤ the viewport width.
- **Don't assert:** card spacing.

#### TC-09-M2: The summary with the balance is the first thing on the page
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** At 375 px the balance summary is above the fold and before the periods in reading order; it is an `h2`-led region a screen reader reaches first in the main content.
- **Don't assert:** pixel positions.

#### TC-09-M3: "Download PDF" is a full-width secondary button below the summary on phones
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** At 375 px the button spans the content width, sits below the summary and is at least 44 × 44 px.
- **Don't assert:** colour.

#### TC-09-M4: At 759 px periods are cards; at 760 px they are a table with headers
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** 759 px: card list (`ul`). 760 px: a real `table` with column headers (`th`) for Period, Due date, Billed, Paid, Status.
- **Don't assert:** —

#### TC-09-M5: Status is a word, with colour only as a second signal
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Every period shows its status as text; in greyscale the statuses are still distinguishable; status text meets 4.5:1 contrast.
- **Don't assert:** the palette.

#### TC-09-M6: Amounts are right-aligned with tabular figures
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** In the desktop table and in cards, amount columns align on the right and use tabular figures (`font-variant-numeric: tabular-nums` or equivalent).
- **Don't assert:** the font.

#### TC-09-M7: At 200% zoom (320 CSS px) the statement reflows without loss
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** WCAG 1.4.10: no sideways scroll; every amount and status is readable.
- **Don't assert:** —

#### TC-09-M8: Keyboard users reach "Show earlier periods" and "Download PDF", with focus kept
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (keyboard). **Tags:** —
- **Expected:** Both are reachable with Tab and work with Enter/Space; after "Show earlier periods", focus moves to the first newly shown period or stays on a sensible element (never lost to the top of the page); focus is visible.
- **Don't assert:** which of the two focus targets.

#### TC-09-M9: The load error and PDF error are announced
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (screen reader). **Tags:** —
- **Expected:** Both messages are in a live region or receive focus; "Try again" is a button.
- **Don't assert:** —

## N. Copy consistency

#### TC-09-N1: "Partly paid" is used everywhere; "Partial" never appears
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, staff. **Tags:** —
- **Expected:** Screen, staff view and PDF use "Partly paid"; "Partial" appears nowhere.
- **Don't assert:** —

#### TC-09-N2: The awaiting note uses the same words as the dashboard and the submit screen
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "{amount} awaiting approval" here, on the dashboard tile (REQ-015) and after submitting (REQ-010) use the same words and amount.
- **Don't assert:** the trailing sentence on the dashboard.

#### TC-09-N3: The statement never says a pending payment is "paid" or "received"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** No pending row, note or summary uses "paid" or "received" for a payment that is not approved (SA-001 §4.3 point 5).
- **Don't assert:** —

## S. Back-compat and data integrity

#### TC-09-S1: The dashboard balance equals the statement balance for every fixture household
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (each fixture). **Tags:** Depends on REQ-015 (S3)
- **Expected:** For every fixture household, the dashboard's balance tile and awaiting amount equal the statement's summary.
- **Don't assert:** —

#### TC-09-S2: Bills created before this feature (opening balance import, first run) render
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** Bills created by REQ-008 before the statement shipped (no `adjustedCentavos` field on some, if the run predates it).
- **Expected:** The statement renders them; a missing `adjustedCentavos` is treated as 0, not as a broken period.
- **Don't assert:** —

#### TC-09-S3: Stored totals reconcile with the bills and approved payments
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (data check after the other blocks). **Tags:** Provisional — SA-001 follow-up
- **Expected:** For every fixture household, `billedCentavos` = Σ(amount + adjusted) of `kind: dues` and `opening` bills; `paidCentavos` = Σ approved, non-void dues payments; `balanceCentavos` = billed − paid − opening credit; `pendingCentavos` = Σ pending payments.
- **Don't assert:** —

## X. Exploratory charters

#### TC-09-X1: 20 minutes trying to make the screen, the PDF and the dashboard disagree
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner plus a treasurer in a second session. **Tags:** —
- **Charter:** With the statement open, approve, reject, void and correct payments and bills in random order, run a billing period, expand earlier periods, download PDFs, reload. Compare summary, cards, PDF and dashboard after each step. Time-box 20 min; note every disagreement and every mismatch report.

#### TC-09-X2: 15 minutes looking for another lot's or the previous owner's data
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN and U-MARIA with devtools. **Tags:** —
- **Charter:** Change ids in routes and queries, inspect network responses and the PDF text layer, use the back-forward cache after sign-out on a shared phone. Time-box 15 min.

---

## Cases that hinge on open decisions or drafts

| Open item | Who decides | Cases |
|---|---|---|
| REQ-046 not approved (corrections, "Correct this bill" on the staff view) | Owner | C5–C9, I4 |
| DPO confirmation of decision 5 / REQ-010 decision 3 (b) | DPO | E5, E9, H11, J11 |
| SA-001 follow-up (one stored paid total, `paymentPrivate`, indexes) | Sol Arch | F4, F5, G5, J2–J5, J10, S3 |
| Gaps G-1 to G-16 | BA | As tagged |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Ledger: allocation and period status | 10 | 5 |
| B | Balance, pending, rejected, void, credit, amenity | 9 | 6 |
| C | Opening balance, opening credit, corrections | 9 | 7 |
| D | Dates and overdue (Manila) | 8 | 3 |
| E | Payments list, privacy after a sale | 12 | 5 |
| F | Live balance, mismatch report | 7 | 3 |
| G | Older periods on request | 5 | 2 |
| H | PDF | 12 | 6 |
| I | Staff view | 6 | 3 |
| J | Roles, rules, data leaks | 11 | 8 |
| K | Empty, loading, error | 6 | 3 |
| L | Navigation | 7 | 1 |
| M | Usability, WCAG 2.2 AA, responsive | 9 | 2 |
| N | Copy consistency | 3 | 0 |
| S | Back-compat, data integrity | 3 | 1 |
| X | Exploratory | 2 | 0 |
| **Total** | | **119** | **55** |

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | **Where the rejection reason lives.** REQ-010 puts it in `paymentPrivate` (submitter and staff only); REQ-012 puts `reason` on `payments/{id}` and says "the household" sees it. A spouse would see "Rejected" without the reason (though the bell tells every member). Pick one | E3; TC-12 |
| G-2 | REQ-013 decision 5 says the "before you joined" rule does not apply to payments the viewer submitted; REQ-009 and REQ-010 don't state the exception. Align the wording | E10 |
| G-3 | The payments list loads 10 at a time: no copy for the "more" control, no empty state for "no payments yet" | E11, E12 |
| G-4 | The page listens live to the household totals only. Does the Payments list row change from "Pending approval" to "Approved" without a reload? If not, the summary says ₱0.00 while the row still says pending | B9, F1 |
| G-5 | Bills are read once, totals live. After a billing run, void or correction while the page is open, do period cards refresh, and how is a false mismatch report avoided? Also, does a page open across the due-date midnight flip to "Overdue"? | D7, F2, F3, F6 |
| G-6 | Summary wording for one overdue period ("1 periods overdue"?), and whether the opening balance line counts as a period overdue | A10, D2 |
| G-7 | Credit wording: REQ-009 shows "₱1,200.00 credit"; REQ-012 and REQ-013 decision 4 say "₱0.00" plus "₱x credit". Which summary does the homeowner see? | B5 |
| G-8 | Correction line: Gherkin "Corrected: −₱200.00" vs copy "Corrected: {amount} ({reason})". Bills store one `adjustedCentavos` sum; how are two corrections and their reasons listed (REQ-046 "shows both corrections")? | C5, C9 |
| G-9 | How a non-dues (`amenityFee`) payment is shown in the dues Payments list, if at all (R3 adds them; the statement must not mislead) | B6 |
| G-10 | Payment row date: date paid (typed) or date submitted? REQ-010 list row says "{date}" | E1 |
| G-11 | Does the opening balance or opening credit line count among "the last 12" periods and in "Show earlier periods (n)"? | G1 |
| G-12 | Does the PDF list payments? If yes, the "Made before you joined" rule and "no reference numbers" both apply; and does it show the owner's name (privacy note says lot and HOA name only)? | H5, H11 |
| G-13 | REQ-009 "no way to change a bill or payment from it" vs REQ-046 (draft) "Correct this bill" on the staff statement for the treasurer | I4 |
| G-14 | What staff see for a sold lot's earlier payments: full details, or the "Made before you joined" label? | I5 |
| G-15 | Route shapes: the homeowner's Dues & Payments and the staff statement of a household (the Gherkin's "statement address for Blk 3 Lot 9"); what a homeowner sees on the staff route for their own lot | J1, L6 |
| G-16 | Option (b) hides the reference on screen, but the household-visible `payments` summary still carries `refLast4` and `submittedBy` for every member, including a new owner, through the SDK. Is that acceptable to the DPO, or should pre-join summaries omit them? | J11 |
