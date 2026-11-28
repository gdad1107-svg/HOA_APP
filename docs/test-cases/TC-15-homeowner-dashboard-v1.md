# TC-15: Homeowner dashboard (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new screen (homeowner landing page: greeting, overdue warning, balance tile, last 3 payments, latest 3 announcements) |
| Source | [REQ-015 Homeowner dashboard](../requirements/REQ-015-homeowner-dashboard.md), **Approved** 2026-11-28 (r4), Option A |
| Depends on / precedent | [REQ-009](../requirements/REQ-009-statement-of-account.md) (stored balance, overdue rule, credit, "Made before you joined"), [REQ-010](../requirements/REQ-010-submit-qr-payment.md) (pending payments, "Pay with QR"), [REQ-011](../requirements/REQ-011-in-app-notifications.md) (bell, lazy list), [REQ-013](../requirements/REQ-013-official-receipt-pdf.md) (receipt button states, sale rule), [REQ-014](../requirements/REQ-014-void-an-approved-payment.md) (void changes balance and `openBills`), [REQ-016](../requirements/REQ-016-post-an-announcement.md) / [REQ-017](../requirements/REQ-017-important-announcement-on-sign-in.md) (shared announcement fetch, pop-up before the dashboard), [REQ-001](../requirements/REQ-001-sign-in.md) / [REQ-004](../requirements/REQ-004-invite-and-link.md) (land on the dashboard), [REQ-002](../requirements/REQ-002-roles-and-permissions.md) ("My household" view), [REQ-046](../requirements/REQ-046-adjust-or-cancel-a-bill.md) (bill corrections change the balance) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open: no viewport meta, so the one-column phone layout never applies; the dashboard is phone-first, see TC-15-K1). No other defect in the area |
| App version | **Anticipated.** No application code exists. Approved UX: screens 15A–15E of [req-012-017-mockup.html](../mockups/req-012-017-mockup.html). **15F is Option B, not approved, not planned.** The mock-up dashboard's booking, request and vehicle tiles and its sideways-scrolling payments table are not expected |
| Source files / functions touched (anticipated) | Dashboard route and view; shared payment-row component (with Dues & Payments); `shared/domain/aging.js` (shared with REQ-009, REQ-018, REQ-034); shared announcement fetch (with REQ-016 banner and REQ-017 pop-up); `config/features` read; `households/{id}` live listener (`balanceCentavos`, `pendingCentavos`, `openBills`); Firestore rules for `households`, `payments`, `announcements`, `config/features` |
| Architecture | SA-001 r3 **Final** (§4.2 `households` totals, §4.4 item 1, §7, R-11, R-16). `openBills`, `config/features` and `memberOf/{uid}` come from the S3 reviews and are **not yet in SA-001**: cases asserting them are tagged **Provisional — SA-001 follow-up** |
| Environment | **Firebase Emulator Suite or `hoa-portal-staging` only. Never production.** "Today" for the overdue warning comes from the **phone's clock** (REQ-015 Out of scope), so the midnight cases set the browser clock (Playwright clock) rather than the server clock (Staging note). Both brands |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. |

**Tags used on cases**

- **Provisional — SA-001 follow-up**: asserts `openBills`, `config/features` or `memberOf` before SA-001 carries them.
- **Blocked — D2**: penalties and grace period (board). The dashboard follows the statement, so a D2 answer changes what "overdue" means for the C-block; cases are written for R1's "no grace period, overdue the day after the due date".
- **Blocked — owner question**: "Does the overdue alert mention notices before notices exist?" (REQ-015 Open questions).
- **Gap G-n**: expected result depends on a requirement gap.
- **Staging note**: browser clock control, network throttling, two sessions, admin SDK.

---

## Roles and what crosses between them

The dashboard only reads, but every figure on it is written by another role. The register traces each one back.

| Role | In this feature |
|---|---|
| **Homeowner** (member of a household) | Sees the dashboard for their own household only |
| **Staff who is also a homeowner** | Sees it under "My household" (REQ-002 switch); the staff view shows no homeowner dashboard |
| **Treasurer** | Writes the figures (approve, reject, void); doesn't read this screen as staff |
| **Admin office staff** | Posts announcements; changes the owner on file; doesn't read this screen as staff |
| **Signed-in person with no household**, **guard**, **board** (no household) | No homeowner dashboard |
| **Developer** | Sets `config/features` per project |

### Test fixtures (invented; QE maps them to `.env`)

| Fixture | Lot | Member | State |
|---|---|---|---|
| **HH-B** "ZZ Test Household B" | Blk 4 Lot 12 | U-JUAN ("ZZ Juan") | Owes the current month ₱1,800.00, due the last day of this month |
| **HH-C** "ZZ Test Household C" | Blk 6 Lot 4 | U-ROBERTO | Two past months unpaid, ₱3,600.00, both overdue |
| **HH-M** "ZZ Test Household M" | Blk 5 Lot 1 | U-MARIA | Balance ₱0.00, all bills paid |
| **HH-CR** "ZZ Test Household CR" | Blk 4 Lot 14 | U-JUAN-CR | ₱200.00 credit |
| **HH-A** "ZZ Test Household A" | Blk 2 Lot 7 | U-CARLO | Owes ₱1,800.00; ₱1,800.00 pending approval; 5 payments in history (approved, approved preparing, rejected, voided, pending) |
| **HH-N** "ZZ Test Household N" | Blk 1 Lot 1 | U-NEWLY | Newly linked; no bills, no payments |
| **HH-P** "ZZ Test Household P" | Blk 3 Lot 3 | U-PART | Last month partly paid (₱800.00 outstanding, overdue) and the current month unpaid, not yet due |
| **HH-OB** "ZZ Imported Household" | Blk 9 Lot 9 | U-OB | Opening balance imported (R-8), no billing run yet |
| **HH-T** "ZZ Test Household T" | Blk 9 Lot 3 | S-TREAS-HO | Treasurer's own household |
| HH-A after sale | Blk 2 Lot 7 | U-BEN linked after the sale | Pre-link payments in history |

| Account | Notes |
|---|---|
| U-STRANGER | Signed in, no household, no role |
| S-ADMIN (no household), S-BOARD, S-GUARD, S-TREAS-HO | Staff roles |
| U-NONAME | Member of HH-M whose account has no first name (Gap G-1) |

"Today" is built from **local Manila today** on the device clock; the REQ's dates (Nov 30, Dec 1, 2026) show the arithmetic only.

### Round-trip register

| # | Figure / item on the dashboard | Written where, by whom | Read back here, by whom | Cases |
|---|---|---|---|---|
| 1 | First name in "Welcome back, {first name}" | `users/{uid}` by the person at sign-up (REQ-001) | Homeowner | A1, A2 |
| 2 | Lot "{lot}" | `households/{id}` by the office (REQ-003) | Homeowner | A1 |
| 3 | Balance (`balanceCentavos`; negative = credit) | Billing run (REQ-008), `decidePayment` (REQ-012), `voidReceipt` (REQ-014), bill corrections (REQ-046) | Balance tile; must equal the statement (REQ-009) | B1–B4, B10, L1–L5 |
| 4 | "Due {date}" and "{n} months overdue · {amount}" (from `openBills`, worked out on read by `aging.js`) | Billing run, `decidePayment`, `voidReceipt`, opening-balance import | Balance tile and overdue warning | B9, C1–C16 |
| 5 | "{amount} awaiting approval" (`pendingCentavos`) | `submitPayment` adds; `decidePayment` subtracts on approve and reject; void doesn't touch | Balance tile | B5–B8, L2 |
| 6 | Recent payments (3 newest `payments`) with status and receipt state (`receiptPdfStatus`) | REQ-010, REQ-012, REQ-013, REQ-014 | Recent payments card | D1–D13 |
| 7 | Announcements (3 newest live) | Staff (REQ-016) | Announcements card | E1–E7 |
| 8 | `config/features` | Developer | Which tiles appear | G1–G3 |
| 9 | "No dues billed yet" vs "You are fully paid" | Derived from the bills existing or not | Balance tile | B2, B4 |

No read-back cell is empty.

### Balance tile: state enumeration

One row per combination the tile can be in; each needs its own case because two can look alike.

| Balance | Pending | Bills exist | Tile shows | Case |
|---|---|---|---|---|
| > 0, nothing overdue | none | yes | "₱x" · "Due {date}" · Pay with QR | B1 |
| > 0, some overdue | none | yes | Warning above; "₱x" · "Due {date}" (which date: G-2) | C1, B9 |
| > 0 | > 0 | yes | "₱x" · "₱y awaiting approval" | B5, B6 |
| 0 | none | yes | "₱0.00" · "You are fully paid", no warning | B2 |
| 0 | > 0 | yes | "₱0.00" · "₱y awaiting approval" (fully paid line too? G-3) | B7 |
| < 0 (credit) | none | yes | "₱0.00" · "₱x credit" | B3 |
| < 0 | > 0 | yes | "₱0.00" · "₱x credit" · "₱y awaiting approval" | B8 |
| 0 | none | **no** | "₱0.00" · "No dues billed yet" | B4 |
| < 0 (opening credit) | none | no | Gap G-4 | B15 |
| load failed | — | — | Error text and "Try again", no figure | F2 |

---

## Test plan

### 1. Smoke

The standing smoke pass already opens the mock-up's homeowner dashboard (SMK-owner-*). This change **replaces** its contents. **Smoke changes for QE:**

1. A homeowner fixture lands on the dashboard after sign-in and sees "Welcome back", the balance tile with a figure and "Pay with QR", "Recent payments" and "Announcements" (no page error).
2. The dashboard shows **no** "Next booking", "Open requests" or "Vehicles" tile (the mock-up's SMK assumptions about those tiles must be dropped).

### 2. Acceptance

| REQ-015 scenario | Cases |
|---|---|
| An account with an amount due | A1, B1 |
| An account with overdue dues | C1 |
| A fully paid account | B2 |
| A credit | B3 |
| A payment waiting for approval | B5, D3 |
| The dashboard agrees with the statement | B10, B11 |
| Recent payments | D1, D2, D7 |
| Nothing billed yet | B4, D8 |
| Only tiles for released features | G1 |
| No announcements | E2 |
| Loading | F1 |
| The balance can't load | F2 |
| A bill falls due overnight | C3, C4, C5 |
| A new owner after a sale | D10, B12 |

### 3. Regression

- **Shared aging helper (`aging.js`)** with the statement (REQ-009), delinquency (REQ-018, R2) and booking pause (REQ-034, R3). Any fix here moves "overdue" on every screen: re-run TC-09's overdue and midnight cases alongside the C-block.
- **Shared payment row** with Dues & Payments: re-run TC-10's history cases, TC-13's receipt-state and sale-rule cases, TC-14-P2.
- **Shared announcement fetch** with the banner and pop-up: re-run TC-16's banner cases and TC-17's pop-up cases; a fetch error must not blank the dashboard.
- **Landing route** after sign-in and invite redemption (REQ-001, REQ-004): re-run TC-01's post-sign-in landing, TC-04's "lands on the dashboard" (C5, F3) and the not-linked screen for people with no household.
- **Role switch** (REQ-002 / TC-02): "My household" for staff who are homeowners.
- **Writers of the figures**: TC-08 billing run, TC-12 approve/reject, TC-14 void, TC-46 bill correction: each must refresh the tile (L-block).

**Existing specs and screens QE should re-run:** `smoke.spec.js` SMK-owner-nav and SMK-owner-dashboard (update for removed tiles), `navigation.spec.js` NAV-01 (opens as homeowner on the dashboard), NAV-05 (important pop-up on load), NAV-07 / NAV-08 (375 px, DEF-001); TC-01, TC-04, TC-09 to TC-14, TC-16, TC-17.

**Not affected:** staff screens (Approvals, Homeowners directory, Settings), the guard app, invite slips and email.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "You are fully paid", "awaiting approval", "Please settle your balance to avoid further notices" | B2, B5, C10 |
| A value written for one role, never shown back | Yes: every figure here is written by staff or functions | Register |
| Status-gated rule checked for one transition only | Yes: payment statuses in recent payments; tile states | Enumeration; D2–D6 |
| Same concept, different word on another screen | Yes: "Balance due", "credit", "awaiting approval", "overdue", status words vs Dues & Payments | D13, K6 |
| Dates computed in UTC where the user means local | **Yes, the main risk**: overdue at Manila midnight (16:00 UTC), month and year end | C3–C5, C17 |
| A derived figure doesn't refresh after a related write | **Yes**: balance, pending, overdue after approve, reject, void, correction, billing run | L1–L5, C9 |
| Zero and "not set" look the same | **Yes**: ₱0.00 fully paid vs no dues billed; no payments vs payments failed to load; error vs ₱0.00 | B2, B4, D8, F2, F5 |
| A write silently refused by security rules | Read-only screen; `config/features` client write | G2 |
| Double-tap / two devices create duplicates | n/a: no writes (Pay with QR and Receipt PDF are covered by TC-10 and TC-13) | — |
| Stale reference | Yes: a payment approved or voided while the dashboard is open | L1, L3 |
| Backdrop click loses work or leaves stale state | n/a: no modal with input on this screen | — |
| A modal appearing mid-flow blocks the next action | Yes: the REQ-017 pop-up shows before the dashboard | J7 |
| Assumed SDK/network behaviour baked into a case | Yes: offline cache may show last figures rather than an error | F2 (assumption marked) |
| Data leaking across households or roles | Yes: household document readable by all members; previous owner's data | H1, H2, H8 |

### Scenario list by mandatory type

- **Negative**: other household's figures; no household; guard; staff without household; balance or payments fail to load; `config/features` write. H-block, F2, F5, G2.
- **Boundary**: 23:59:59 vs 00:00:00 Manila on the due date; Dec 31 → Jan 1; exactly 1 month overdue; partly paid overdue month; 0, 1, 2, 3 and 5 payments; balance exactly ₱0.00 vs −₱0.01 credit; pending equal to and greater than the balance. C2–C6, C17, D1, D11, B2, B3, B6.
- **Usability**: one column at 375 px, "Pay with QR" in the first screenful, labelled balance, alert with words, 44 px, contrast, placeholders keep size, errors say what to do, zoom. K-block, F1, F6.
- **Navigation**: landing after sign-in and after redeeming an invite; menu highlight; Pay with QR and back; See all payments; See all announcements; Pay now; staff "My household"; refresh; role without a household can't reach it. J-block.

---

## A. Greeting and layout

#### TC-15-A1: The greeting shows the person's first name and their lot
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN, HH-B). **Tags:** —
- **Expected:** "Welcome back, ZZ Juan" and "Blk 4 Lot 12" (and the HOA name, per the copy of record).
- **Don't assert:** greeting font size.

#### TC-15-A2: A person with no first name on their account still gets a sensible greeting
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** U-NONAME. **Tags:** Gap G-1
- **Expected (pending G-1):** No "Welcome back, " with a blank, "undefined" or the email address.
- **Don't assert:** the fallback text.

#### TC-15-A3: At 375 px the dashboard is one column in the order warning, balance, recent payments, announcements
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO), 375 px. **Tags:** DEF-001
- **Expected:** That order top to bottom; no sideways scroll.
- **Don't assert:** spacing.

#### TC-15-A4: "Pay with QR" is visible without scrolling on a phone
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner with an overdue warning, 375 × 667. **Tags:** DEF-001
- **Expected:** "Pay with QR" (and "Pay now" in the warning) inside the first screenful.
- **Don't assert:** —

#### TC-15-A5: The dashboard is the first item in the homeowner menu
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** R1 homeowner menu: Dashboard, Dues & Payments, Announcements, in that order (REQ-002).
- **Don't assert:** icons.

## B. Balance tile

#### TC-15-B1: An amount due shows the figure, the due date and "Pay with QR"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Expected:** "Balance due", "₱1,800.00", "Due {last day of this month}" in "Nov 30, 2026" format, and a "Pay with QR" button.
- **Don't assert:** tile colour.

#### TC-15-B2: A fully paid account reads "₱0.00" and "You are fully paid", with no warning
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA). **Tags:** —
- **Expected:** "₱0.00", "You are fully paid"; no overdue warning; no "Due" line.
- **Don't assert:** whether "Pay with QR" shows (G-5).

#### TC-15-B3: A credit reads "₱0.00" and "₱200.00 credit"
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN-CR). **Tags:** —
- **Expected:** "₱0.00" and "₱200.00 credit"; never "−₱200.00"; no "You are fully paid".
- **Don't assert:** —

#### TC-15-B4: A household with no bills reads "No dues billed yet", not "You are fully paid"
**Priority** P1 · **Type** Boundary (not set) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-NEWLY). **Tags:** —
- **Expected:** "₱0.00" and "No dues billed yet"; "You are fully paid" is not shown.
- **Don't assert:** —

#### TC-15-B5: A pending payment shows "awaiting approval" without changing the balance
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Expected:** "₱1,800.00" and "₱1,800.00 awaiting approval"; the balance is not reduced and nothing says "paid".
- **Don't assert:** —

#### TC-15-B6: Pending larger than the balance is shown as submitted
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** Balance ₱1,800.00; ₱2,000.00 pending.
- **Expected:** "₱1,800.00" and "₱2,000.00 awaiting approval".
- **Don't assert:** —

#### TC-15-B7: A fully paid household with a pending payment
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA with ₱1,800.00 pending). **Tags:** Gap G-3
- **Expected:** "₱0.00" and "₱1,800.00 awaiting approval"; whether "You are fully paid" also shows is G-3.
- **Don't assert:** the fully paid line until G-3.

#### TC-15-B8: A credit and a pending payment show together
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN-CR with ₱500.00 pending). **Tags:** —
- **Expected:** "₱0.00", "₱200.00 credit", "₱500.00 awaiting approval".
- **Don't assert:** line order.

#### TC-15-B9: With several unpaid bills, "Due {date}" shows a defined date
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-PART). **Tags:** Gap G-2
- **Setup:** Last month partly paid and overdue; this month unpaid, not yet due.
- **Expected (pending G-2):** The date shown is the one G-2 defines (earliest unpaid, or next not-yet-due); the same date the statement highlights.
- **Don't assert:** which date until G-2.

#### TC-15-B10: The dashboard balance equals the statement balance for every fixture household
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Each fixture homeowner. **Tags:** —
- **Expected:** For HH-A, B, C, M, CR, N, P, OB: dashboard figure and credit/due wording equal the statement of account's.
- **Don't assert:** —

#### TC-15-B11: When bills and the stored balance disagree, the dashboard shows the stored balance, as the statement does
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Staging note: seed a mismatch with the admin SDK
- **Setup:** Stored balance ₱5,400.00; bills add to ₱3,600.00 (REQ-009's mismatch scenario).
- **Expected:** Dashboard and statement both show ₱5,400.00.
- **Don't assert:** the mismatch report's content.

#### TC-15-B12: A new owner after a sale sees the lot's full balance
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN. **Tags:** —
- **Expected:** The same balance the treasurer sees for HH-A, including bills from before the sale.
- **Don't assert:** —

#### TC-15-B13: "Pay with QR" opens the payment screen
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Expected:** The REQ-010 pay screen opens; Back returns to the dashboard.
- **Don't assert:** pay-screen content.

#### TC-15-B14: The balance is labelled text, not only a large number
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner with a screen reader. **Tags:** —
- **Expected:** The figure is read with its label "Balance due" (or "credit" wording).
- **Don't assert:** —

#### TC-15-B15: A household with only an imported opening credit and no bills
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-OB with an opening credit). **Tags:** Gap G-4
- **Expected (pending G-4):** Either "₱x credit" or "No dues billed yet", not both, and never "You are fully paid".
- **Don't assert:** until G-4.

## C. Overdue warning

Cases assume R1's rule: overdue from the day after the due date, Manila time, no grace period (Blocked — D2 if the board adds one).

#### TC-15-C1: Two overdue months show "2 months overdue · ₱3,600.00" with "Pay now" above the tiles
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** —
- **Expected:** The warning above the balance tile reads "2 months overdue · ₱3,600.00" with a "Pay now" button.
- **Don't assert:** colour.

#### TC-15-C2: One overdue month uses the singular
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "1 month overdue · ₱1,800.00", not "1 months".
- **Don't assert:** —

#### TC-15-C3: A bill falls due overnight with no save or billing run
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** Staging note: browser clock
- **Setup:** Bill due the last day of the month, unpaid; no writes after midnight.
- **Action:** Open the dashboard at 00:00:05 Manila on the 1st.
- **Expected:** "1 month overdue · ₱1,800.00" with "Pay now".
- **Don't assert:** —

#### TC-15-C4: On the due date itself, until 23:59:59 Manila, there is no warning
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** Staging note: browser clock
- **Expected:** At 23:59:59 Manila on the due date: no warning; "Due {date}" shown.
- **Don't assert:** —

#### TC-15-C5: Overdue follows Manila midnight, not UTC midnight
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: browser clock and time zone
- **Setup:** Device clock at 00:30 Manila on the 1st (16:30 UTC the day before); separately at 07:30 Manila on the due date (23:30 UTC the day before).
- **Expected:** Overdue in the first; not overdue in the second.
- **Don't assert:** —

#### TC-15-C6: A partly paid overdue month counts as one month with its outstanding amount
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-PART). **Tags:** —
- **Expected:** "1 month overdue · ₱800.00" (the current month is not yet due).
- **Don't assert:** —

#### TC-15-C7: The overdue amount when the balance also includes a bill not yet due
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-PART). **Tags:** Gap G-6
- **Expected:** Warning amount ₱800.00 (overdue only) while the tile shows the full ₱2,600.00 balance (pending G-6 confirming the warning shows overdue only).
- **Don't assert:** until G-6.

#### TC-15-C8: No warning when a credit covers the overdue bill
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN-CR). **Tags:** —
- **Expected:** No warning: a credit is applied to bills, so nothing is outstanding.
- **Don't assert:** —

#### TC-15-C9: The warning disappears when the overdue bills are paid, without reloading
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ROBERTO) with the dashboard open; treasurer approves ₱3,600.00. **Tags:** —
- **Expected:** Through the household listener, the warning goes and the tile updates.
- **Don't assert:** delay.

#### TC-15-C10: The warning's text
**Priority** P3 · **Type** UI/UX (copy honesty) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Blocked — owner question (notices before R2)
- **Expected:** "Please settle your balance to avoid further notices." only if the owner keeps it in R1; REQ-015 recommends no mention of notices until R2 (story 20).
- **Don't assert:** the second line until the owner answers.

#### TC-15-C11: "Pay now" opens the payment screen
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** —
- **Expected:** The REQ-010 pay screen; Back returns to the dashboard.
- **Don't assert:** —

#### TC-15-C12: The warning is a labelled alert with words, not colour alone
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner with a screen reader. **Tags:** —
- **Expected:** Role alert (or a labelled region) whose text carries the meaning; readable in greyscale.
- **Don't assert:** ARIA role choice.

#### TC-15-C13: The warning doesn't push the page down after it has rendered
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, slow network. **Tags:** Staging note: throttling
- **Expected:** No layout shift of the balance tile after first paint (the warning is placed before the tiles render).
- **Don't assert:** CLS figure.

#### TC-15-C14: The dashboard and the statement agree on overdue months and amount
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowners U-ROBERTO, U-PART, U-JUAN. **Tags:** —
- **Expected:** Same months marked Overdue on the statement as counted in the warning; same amount.
- **Don't assert:** —

#### TC-15-C15: No penalty or interest is added to the overdue amount in R1
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ROBERTO). **Tags:** Blocked — D2 (if penalties are added)
- **Expected:** Warning amount = sum of unpaid dues only.
- **Don't assert:** —

#### TC-15-C16: An imported opening balance produces the right overdue warning before any billing run
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-OB). **Tags:** Provisional — SA-001 follow-up
- **Setup:** Opening balance with a past due date imported (R-8 fills `openBills`).
- **Expected:** The warning and tile match the statement.
- **Don't assert:** —

#### TC-15-C17: A December bill becomes overdue on Jan 1 Manila
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: browser clock
- **Expected:** Dec 31 23:59:59 Manila: not overdue; Jan 1 00:00:05: "1 month overdue".
- **Don't assert:** —

## D. Recent payments

#### TC-15-D1: With 5 payments, the 3 newest show, newest first
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Expected:** 3 cards ordered by submission, newest first, each with date, amount and status.
- **Don't assert:** the date field used on the card (date paid vs submitted; same as Dues & Payments).

#### TC-15-D2: An approved payment's card has "Receipt PDF"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Approved", the receipt number, and an enabled "Receipt PDF" that opens the file (TC-13).
- **Don't assert:** —

#### TC-15-D3: A pending payment's card reads "Pending approval" with no receipt
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Pending approval"; no receipt control.
- **Don't assert:** —

#### TC-15-D4: A rejected payment's card reads "Rejected" with no receipt
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Rejected" (and the reason as on Dues & Payments); no receipt control.
- **Don't assert:** reason placement.

#### TC-15-D5: A voided payment's card reads "Void"
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Gap G-7
- **Expected:** "Void" with the struck-through amount, as on Dues & Payments; receipt control gives the void version (TC-14).
- **Don't assert:** copy until G-7.

#### TC-15-D6: A payment whose receipt is still being made shows "Preparing receipt…"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Disabled "Preparing receipt…", becoming "Receipt PDF" without reload (TC-13-D2).
- **Don't assert:** —

#### TC-15-D7: "See all payments" opens Dues & Payments
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Dues & Payments opens; its menu item is highlighted; Back returns to the dashboard.
- **Don't assert:** —

#### TC-15-D8: No payments reads "No payments yet."
**Priority** P1 · **Type** Boundary (not set) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-NEWLY). **Tags:** —
- **Expected:** "No payments yet."; no empty card frames.
- **Don't assert:** —

#### TC-15-D9: Payments are cards on a phone, with no sideways scroll
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, 375 px. **Tags:** DEF-001
- **Expected:** Cards, not a table; nothing scrolls sideways (the mock-up's review finding 2).
- **Don't assert:** —

#### TC-15-D10: A new owner's pre-link payments show date, amount and status only
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN. **Tags:** —
- **Expected:** Pre-link cards show date, amount, status and "Made before you joined" (shared row); no "Receipt PDF"; post-link cards behave normally.
- **Don't assert:** —

#### TC-15-D11: With 1 or 2 payments, only those show
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** 1 and 2 cards respectively; no placeholders left; "See all payments" still offered.
- **Don't assert:** —

#### TC-15-D12: A new submission appears at the top
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Action:** Submit a payment (REQ-010); return to the dashboard.
- **Expected:** It is the first card, "Pending approval"; the oldest of the previous three drops off.
- **Don't assert:** —

#### TC-15-D13: Status words match Dues & Payments exactly
**Priority** P3 · **Type** UI/UX (consistency) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Pending approval", "Approved", "Rejected", "Void" identical on both screens for the same payment.
- **Don't assert:** —

## E. Announcements card

#### TC-15-E1: The 3 newest live announcements show, newest first
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** 5 live announcements.
- **Expected:** The 3 newest by posting time, each with date and title (and message preview).
- **Don't assert:** preview length.

#### TC-15-E2: No announcements reads "No announcements yet."
**Priority** P2 · **Type** Boundary (not set) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "No announcements yet."
- **Don't assert:** —

#### TC-15-E3: "See all" opens the Announcements page
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Announcements opens and its menu item is highlighted.
- **Don't assert:** —

#### TC-15-E4: A deleted announcement isn't on the card
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin deletes; homeowner reads. **Tags:** —
- **Expected:** On the next open, the deleted one is gone and the next newest takes its place.
- **Don't assert:** whether an already-open session updates (session fetch).

#### TC-15-E5: An announcement whose banner ended still shows on the card
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** The card lists live announcements by posting date regardless of banner end date.
- **Don't assert:** —

#### TC-15-E6: Dismissing the banner doesn't remove the announcement from the card
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Expected:** After × on the banner, the card still lists it.
- **Don't assert:** —

#### TC-15-E7: Announcement text on the card is shown as text, not HTML
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** A live announcement with "<b>Pool closed</b>".
- **Expected:** Literal text; nothing bold; no script runs.
- **Don't assert:** —

## F. Loading and error states

#### TC-15-F1: While loading, placeholders show where the balance and payments will be
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, throttled network. **Tags:** Staging note: throttling
- **Expected:** Placeholder tiles; no "₱0.00" or "No payments yet." shown while still loading.
- **Don't assert:** placeholder style.

#### TC-15-F2: When the balance can't load, the tile says so and shows no figure
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN), offline before first load. **Tags:** Assumption: no cached household document from an earlier session
- **Expected:** "Couldn't load your balance. Check your connection and try again." with "Try again"; no ₱ figure, no "You are fully paid".
- **Don't assert:** what shows if the SDK serves a cached figure (assumption).

#### TC-15-F3: "Try again" loads the balance once the connection is back
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** The tile fills in; the error goes.
- **Don't assert:** —

#### TC-15-F4: If announcements fail, the balance and payments still show
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: fault injection on the announcements query · Gap G-8
- **Expected:** Balance and recent payments render; the announcements card shows its own error (copy: G-8), not "No announcements yet."
- **Don't assert:** the error text.

#### TC-15-F5: If payments fail, the card doesn't claim "No payments yet."
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Gap G-8
- **Expected:** An error on the payments card (copy: G-8); the balance still shows.
- **Don't assert:** the text.

#### TC-15-F6: Tiles keep their size while loading
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, throttled. **Tags:** —
- **Expected:** No visible jump when content replaces placeholders.
- **Don't assert:** —

## G. Released features

#### TC-15-G1: With bookings, requests and vehicles unreleased, their tiles don't appear
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Provisional — SA-001 follow-up
- **Setup:** `config/features` all false.
- **Expected:** No "Next booking", "Open requests", "Vehicles" or guest-pass tile; no empty frames where they were in the mock-up.
- **Don't assert:** —

#### TC-15-G2: No client can change `config/features`
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner, S-ADMIN, S-TREAS. **Tags:** Provisional — SA-001 follow-up
- **Expected:** Every write refused; the document unchanged.
- **Don't assert:** —

#### TC-15-G3: Members and staff can read `config/features`; a person with no household can't
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN, S-ADMIN, U-STRANGER. **Tags:** Provisional — SA-001 follow-up · Gap G-9
- **Expected:** Readable by the first two; for U-STRANGER pending G-9 ("members and staff").
- **Don't assert:** —

## H. Roles and privacy

All H cases assert refusals explicitly.

#### TC-15-H1: A homeowner sees only their own household's figures
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA (HH-M). **Tags:** —
- **Expected:** The dashboard shows HH-M only.
- **Don't assert:** —

#### TC-15-H2: A homeowner's direct read of another household's document and payments is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-MARIA. **Tags:** —
- **Action:** Client read of `households/{HH-B}` and a `payments` query for HH-B.
- **Expected:** Both refused.
- **Don't assert:** —

#### TC-15-H3: A treasurer who is also a homeowner sees the dashboard under "My household"
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO. **Tags:** —
- **Expected:** "My household" shows HH-T's dashboard; the "Treasurer" view shows the staff dashboard, not this one.
- **Don't assert:** staff dashboard content.

#### TC-15-H4: A staff member with no household has no homeowner dashboard
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN. **Tags:** —
- **Expected:** No "My household" switch; the homeowner dashboard address shows the staff dashboard or the no-access page, never another household's data.
- **Don't assert:** which of the two.

#### TC-15-H5: A guard can't open the homeowner dashboard
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-GUARD. **Tags:** —
- **Expected:** No-access page; household reads refused.
- **Don't assert:** —

#### TC-15-H6: A signed-in person with no household lands on the not-linked screen
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER. **Tags:** —
- **Expected:** "Enter your invite code" flow (REQ-001); no dashboard, no figures.
- **Don't assert:** —

#### TC-15-H7: The household document holds nothing about a previous owner except the owner name on file
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-BEN (reads `households/{HH-A}`). **Tags:** —
- **Expected:** No contact details, no previous owner's uid, email or payment details in the readable document.
- **Don't assert:** field names.

#### TC-15-H8: A removed member loses the dashboard
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA, removed from HH-A while the dashboard is open. **Tags:** —
- **Expected:** Within a minute (REQ-011 decision 3 timing) reads are refused and the screen stops showing HH-A's figures; on next open, the not-linked screen.
- **Don't assert:** exact delay.

## J. Navigation

#### TC-15-J1: After sign-in a homeowner lands on the dashboard
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, each sign-in method (REQ-001). **Tags:** —
- **Expected:** The dashboard, with "Dashboard" highlighted in the menu (one `aria-current`).
- **Don't assert:** —

#### TC-15-J2: After redeeming an invite the new member lands on the dashboard
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Newly linked homeowner (REQ-004). **Tags:** —
- **Expected:** Dashboard with "No dues billed yet" or the lot's balance.
- **Don't assert:** —

#### TC-15-J3: Refreshing the dashboard keeps the person on it
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Same screen, still signed in.
- **Don't assert:** —

#### TC-15-J4: Back from Dues & Payments, Announcements and the pay screen returns to the dashboard
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Dashboard, menu highlight back on "Dashboard".
- **Don't assert:** —

#### TC-15-J5: The important-announcement pop-up opens before the dashboard and the dashboard works after "Got it"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner with an unread important announcement. **Tags:** Cross-reference TC-17
- **Expected:** Pop-up first; after "Got it", "Pay with QR" and "See all payments" respond to the first tap (no overlay left).
- **Don't assert:** —

## K. Usability (WCAG 2.2 AA)

#### TC-15-K1: The dashboard has no sideways scroll at 375 px and 320 px
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** DEF-001
- **Expected:** No horizontal scroll at either width; long lot names and amounts wrap.
- **Don't assert:** —

#### TC-15-K2: Text on the balance tile meets 4.5:1 contrast
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** White on the tile's green (mock-up claims 5.3:1) and every other text ≥ 4.5:1, in both brands.
- **Don't assert:** —

#### TC-15-K3: Every button on the dashboard is at least 44 px
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Pay with QR", "Pay now", "Receipt PDF", "See all payments", "See all", "Try again" ≥ 44 × 44 px.
- **Don't assert:** —

#### TC-15-K4: A screen reader reads the dashboard in a sensible order with headings
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner with NVDA or VoiceOver. **Tags:** —
- **Expected:** Greeting, warning, balance, "Recent payments", "Announcements", each card heading navigable.
- **Don't assert:** —

#### TC-15-K5: At 200% zoom nothing is cut off
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, desktop. **Tags:** —
- **Expected:** All text and buttons usable; reflow to one column.
- **Don't assert:** —

#### TC-15-K6: Glossary words are used exactly
**Priority** P3 · **Type** UI/UX (consistency) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Balance due", "credit", "awaiting approval", "overdue" as on the statement; never "paid" for a pending payment.
- **Don't assert:** —

## L. Derived figures refresh after related writes

#### TC-15-L1: An approval while the dashboard is open updates the tile, pending amount and recent payments
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO) open; treasurer approves. **Tags:** —
- **Expected:** Without reload: balance down, "awaiting approval" gone, the card shows "Approved" and the receipt state.
- **Don't assert:** delay.

#### TC-15-L2: A rejection removes the pending amount and leaves the balance
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner open; treasurer rejects. **Tags:** —
- **Expected:** "awaiting approval" gone; balance unchanged; card "Rejected".
- **Don't assert:** —

#### TC-15-L3: A void raises the balance and may bring back the overdue warning
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner open; treasurer voids. **Tags:** Cross-reference TC-14-F8
- **Expected:** Balance up; warning appears if the restored bill is past due.
- **Don't assert:** —

#### TC-15-L4: A bill correction updates the balance
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner; treasurer corrects a bill (REQ-046). **Tags:** —
- **Expected:** Balance and, if relevant, the overdue amount follow the correction; equal to the statement.
- **Don't assert:** REQ-046 details.

#### TC-15-L5: A new billing run adds the new month and due date
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner; treasurer runs billing (REQ-008). **Tags:** —
- **Expected:** Balance up by the new bill; "Due {new date}"; "No dues billed yet" replaced for a new household.
- **Don't assert:** —

#### TC-15-L6: Opening the dashboard costs a bounded number of reads
**Priority** P3 · **Type** Data integrity (cost) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: emulator request log
- **Expected:** About 9–13 document reads per open (REQ-015); the announcement data is fetched once and shared with the banner and pop-up (one query, not three).
- **Don't assert:** an exact number.

## X. Exploratory charters

#### TC-15-X1: 20 minutes trying to make the dashboard and statement disagree
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner with a treasurer in a second session. **Tags:** —
- **Charter:** Submit, approve, reject, void and correct while switching between dashboard and statement, around a due date and with the phone clock moved; note any moment the two differ. Time-box 20 min.

#### TC-15-X2: 15 minutes on a cheap Android phone on 3G
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Charter:** Cold start, background and resume, airplane mode, rotate; watch for fake zeros, stale figures, frozen placeholders. Time-box 15 min.

---

## Cases that hinge on open decisions

| Open item | Who decides | Cases |
|---|---|---|
| D2: penalties and grace period | HOA board | C-block written for "no grace period"; C15 |
| Overdue alert mentions notices before R2 | Owner | C10 |
| DPO confirms decision 4 (sale rule) | HOA board | D10, B12 run as approved |
| `openBills`, `config/features`, `memberOf` not in SA-001 | Sol Arch | Provisional cases |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Greeting and layout | 5 | 1 |
| B | Balance tile | 15 | 8 |
| C | Overdue warning | 17 | 7 |
| D | Recent payments | 13 | 5 |
| E | Announcements card | 7 | 2 |
| F | Loading and error states | 6 | 1 |
| G | Released features | 3 | 2 |
| H | Roles and privacy | 8 | 4 |
| J | Navigation | 5 | 1 |
| K | Usability | 6 | 0 |
| L | Derived figures refresh | 6 | 3 |
| X | Exploratory | 2 | 0 |
| **Total** | | **93** | **34** |

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | "Welcome back, {first name}": where the first name comes from for a Google or email account with no name, and the fallback | A2 |
| G-2 | "Due {date}" with several unpaid bills (an overdue one and a current one): the earliest unpaid due date, or the next one not yet due? | B9 |
| G-3 | Balance ₱0.00 with a pending payment: is "You are fully paid" shown beside "₱x awaiting approval"? | B7 |
| G-4 | A household with an imported opening credit and no bills: "₱x credit" or "No dues billed yet"? | B15 |
| G-5 | Is "Pay with QR" shown when fully paid, in credit, or with nothing billed (advance payments are allowed)? | B2, B3 |
| G-6 | The overdue alert's amount: overdue bills only, or the whole balance? The scenario (₱3,600.00 for 2 months, nothing current) doesn't separate them | C7 |
| G-7 | The copy of record for recent payments lists no "Void" or "Rejected" wording, nor whether the rejection or void reason shows on the dashboard card | D4, D5 |
| G-8 | "Each card fails on its own", but only the balance error has copy; no error text for the payments or announcements card | F4, F5 |
| G-9 | `config/features` is "readable by members and staff": what a signed-in person with no household gets (the not-linked screen may need it) | G3 |
