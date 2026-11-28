# REQ-009: Statement of account

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-002 Billing and statement](../epics/EPIC-002-billing-and-statement.md) |
| Backlog story | [09 Statement of account](../backlog/BACKLOG.md#09-statement-of-account) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted. Sol Arch reviewed: supports Option A with changes (applied in r3) |
| Mockup | Screens 9A–9D of the [REQ-005 to REQ-011 mockup](../mockups/req-005-011-mockup.html). Not yet published as an artifact: ready for the main session to publish |
| Architecture | SA-001 §4.4 item 1 (oldest-bill-first allocation in `shared/domain/ledger.js`, totals kept by functions), §4.2 (`bills`, `payments`, `households` totals), R-11 (drift), R-16 (sale privacy); Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-008 (bills and opening balances). Payments appear once REQ-010 and REQ-012 ship. Corrections appear once REQ-046 ships |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (all bills plus one stored paid total, no per-bill paid amounts; ledger rules for dues-only payments, adjustments, opening credit and Manila overdue; midnight scenario; mismatch report carries both figures; embedded ₱ font, lazy PDF; "Made before you joined" rows; live balance) · r4, 2026-11-28: owner approval recorded; recommendations accepted · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Decision 2 keeps overpayments as credit (answers SA-001 Q12); decision 5 follows REQ-010 decision 3, approved as option (b). Questions for the treasurer under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (cards on phone, table on desktop, PDF made in the browser), B (same screen, PDF made on the server and stored) or C (screen only, no PDF in R1) | **A** |
| 2 | SA-001 Q12: a payment larger than what is billed. Keep the extra as credit, or refuse it | **Keep it as credit**, applied to the next bills automatically (as the mock-up does) |
| 3 | How many periods the statement shows | **The last 12, with "Show earlier periods"**. The balance always covers everything |
| 4 | **D2**: penalties and interest on the statement | **None in R1** (see REQ-008 decision 6) |
| 5 | What a new owner sees after a sale | **Decided with REQ-010 decision 3** (REQ-004 decision 5): option (b). Bills and balance stay with the lot; payments from before the viewer joined show date, amount and status only, labelled "Made before you joined" |

## Problem

A homeowner wants to know what they owe and since when, without calling the office. The treasurer and office want to answer "what does Blk 4 Lot 12 owe?" from the same page the homeowner sees. The mock-up's statement is a wide table that scrolls sideways on a phone (backlog review finding 2), and its balance is recomputed in the browser from every bill and payment (SA-001 §4.4 item 1).

Who has the problem: every [Homeowner](../product/PERSONAS.md#homeowner), mostly on a phone, once or twice a month; the [Treasurer](../product/PERSONAS.md#treasurer) and [Admin office staff](../product/PERSONAS.md#admin-office-staff) answering balance enquiries.

**Success (EPIC-002):** balance enquiries to the office down by half within 3 months. The baseline is still to be measured before launch.

## Options

### Option A: Balance first, periods as cards on phones and a table on desktop, PDF made in the browser (recommended)

- **How it works:** Dues & Payments opens with a summary ("Balance ₱5,400.00 · 2 periods overdue"), then the periods, newest first: on a phone each period is a card (period, due date, billed, paid, status); from 760 px wide it is a table. A payment awaiting approval shows as a note, not in the balance. "Download PDF" builds the statement in the browser from the same data.
- **Where it lives:** the homeowner's Dues & Payments page; for staff, "Statement" on a household in the directory.
- **Cost:** moderate: the ledger rule is shared and tested; the PDF uses a bundled library.
- **Honest downside:** the PDF is a printout of the screen, not an official document; it carries "This statement is not an official receipt."

### Option B: Same screen, PDF made on the server and stored

- **Cost:** moderate to high: a function, a stored file per request, and a way to show "preparing".
- **Benefit:** the same file can be emailed in R2 (story 19).
- **Honest downside:** a wait for every download, and stored copies of personal financial data to retain and delete.

### Option C: Screen only, no PDF in R1

- **Cost:** cheapest. **Honest downside:** homeowners who need a statement for a bank, a sale or a dispute must ask the office, which is the enquiry we're trying to remove.

### Recommendation

**Option A.** The screen and PDF come from one ledger module, so they can't disagree. If emailed statements in R2 need a server copy, the same layout can move to a function then.

## Story

As a homeowner, I want to see each period billed, what I paid, and my balance, on my phone, so that I know exactly what I owe and since when.

## How the statement is worked out

- **Payments apply to the oldest unpaid bill first**, including the opening balance line (REQ-008), across all approved payments for the lot. The ledger needs only the lot's bills in date order and **one stored number, the total of approved dues payments** (`households.paidCentavos`); each bill's paid amount is a running sum worked out in `ledger.js`.
- **Only dues payments count** (`kind == dues`). Amenity fees (REQ-031) never reduce dues.
- **A bill's due amount is `amount + adjusted`**: the original amount plus any correction lines (REQ-046). The original amount is never changed.
- **Credit before the portal** (`openingCredit`, REQ-008) joins the payment pool, like an approved payment.
- **Status of each period:** **Paid** (fully covered) · **Partly paid** (some paid, not yet due) · **Unpaid** (nothing paid, not yet due) · **Overdue** (not fully paid after its due date, glossary). "Overdue" starts the day after the due date, Asia/Manila time, and is worked out when the statement is read, never stored (RELEASE-PLAN conflict C4). An overdue period that is partly paid reads "Overdue · ₱600.00 left".
- **Balance** = everything billed (with corrections) − approved dues payments − credit before the portal. Below zero it reads "₱1,200.00 credit" (decision 2).
- **Pending, rejected and void payments** never change the balance. Pending ones show as "₱3,600.00 awaiting approval".
- The rule lives in one shared module used by the screen, the PDF and the functions that keep the household's totals. The screen's balance must equal the household's stored balance; if they ever differ, the screen shows the stored one and the mismatch is reported (SA-001 R-11).
- **The balance stays live:** the page listens to the household's totals only, so an approval made while the page is open updates the summary without a reload.

## Acceptance criteria (Option A)

```gherkin
Feature: Statement of account

  Background:
    Given today is Dec 5, 2026 in Manila

  Scenario: Payments apply to the oldest period first
    Given Roberto's lot, Blk 3 Lot 9, was billed ₱1,800.00 for each period from June to November 2026
    And ₱5,400.00 of his payments are approved
    When he opens Dues & Payments
    Then June, July and August 2026 read "Paid"
    And September, October and November 2026 read "Overdue"
    And the summary reads "Balance ₱5,400.00 · 3 periods overdue"

  Scenario: A partly paid period
    Given Blk 3 Lot 9 was billed ₱1,800.00 for December 2026, due Dec 31, 2026
    And approved payments cover everything before December and ₱1,200.00 of December
    Then December 2026 reads "Partly paid" with "₱600.00 left"

  Scenario: A payment waiting for approval does not lower the balance
    Given Grace's lot has a balance of ₱3,600.00
    And she has ₱3,600.00 awaiting approval
    Then the balance still reads ₱3,600.00
    And the statement shows "₱3,600.00 awaiting approval. Your balance updates once the treasurer has checked it."

  Scenario: Rejected and void payments are not counted
    Given a ₱1,800.00 payment for the lot was rejected and another was voided
    Then neither changes the balance
    And both appear under Payments with their status

  Scenario: Paying more than is billed leaves credit (decision 2)
    Given Blk 6 Lot 4 was billed ₱1,800.00 in total and ₱3,000.00 is approved
    Then the summary reads "₱1,200.00 credit"
    And when January 2027 is billed at ₱1,800.00, January reads "Partly paid" with "₱600.00 left"

  Scenario: The opening balance is the first line
    Given Blk 3 Lot 9 has an opening balance of ₱9,000.00 and periods from December 2026
    Then the oldest line reads "Balance before December 2026 · ₱9,000.00 · Overdue"
    And payments pay it off before December 2026

  Scenario: A period becomes overdue at midnight, Manila time
    Given December 2026 is due Dec 31, 2026 and unpaid
    When the homeowner opens the statement at 11:59 PM on Dec 31, 2026, Manila time
    Then December 2026 reads "Unpaid"
    When they open it at 12:00 AM on Jan 1, 2027, Manila time
    Then December 2026 reads "Overdue"

  Scenario: A corrected bill shows its correction
    Given Blk 5 Lot 1 was billed ₱1,800.00 for December 2026
    And the treasurer corrected it by −₱200.00 (REQ-046)
    Then December 2026 shows billed ₱1,800.00 and "Corrected: −₱200.00"
    And the balance counts ₱1,600.00 for December 2026

  Scenario: An amenity fee does not pay dues
    Given Blk 3 Lot 9 owes ₱1,800.00 for November 2026
    And an amenity booking fee of ₱500.00 from the lot is approved
    Then November 2026 still reads "Overdue" with ₱1,800.00 left

  Scenario: Credit from before the portal pays the first bills
    Given Blk 6 Lot 4 had credit of ₱1,200.00 before December 2026
    When December 2026 is billed at ₱1,800.00
    Then the oldest line reads "Credit before December 2026 · ₱1,200.00"
    And December 2026 reads "Partly paid" with "₱600.00 left"

  Scenario: A new owner sees earlier payments without their details
    Given Ana Reyes linked to Blk 2 Lot 7 on Jan 10, 2027
    And a ₱1,800.00 payment for the lot was approved on Dec 3, 2026
    When Ana opens Dues & Payments
    Then that payment shows "Dec 3, 2026 · ₱1,800.00 · Approved · Made before you joined"
    And no reference number, screenshot or payer name is shown for it

  Scenario: The balance updates while the page is open
    Given Grace has Dues & Payments open with ₱3,600.00 awaiting approval
    When the treasurer approves it
    Then her summary changes to "Balance ₱0.00 · Nothing overdue" without a reload

  Scenario: Nothing billed yet
    Given no period has been billed for Blk 8 Lot 2
    When a linked homeowner opens Dues & Payments
    Then the statement reads "No bills yet. Your first statement appears when the HOA bills the next period."
    And the balance reads "₱0.00"

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then each period shows as a card with period, due date, billed, paid and status
    And the page does not scroll sideways
    And the summary with the balance is the first thing on the page

  Scenario: Older periods load on request
    Given Blk 3 Lot 9 has 20 periods billed
    Then the 12 newest show
    And "Show earlier periods (8)" shows the rest below without moving what is on screen
    And the balance covers all 20 periods either way

  Scenario: Download the statement
    When the homeowner presses "Download PDF"
    Then a PDF named "Statement-Blk-3-Lot-9-2026-12-05.pdf" downloads
    And it lists every period, with the same amounts, statuses and balance as the screen
    And it shows "As of Dec 5, 2026" and "This statement is not an official receipt."
    And amounts print as "₱1,800.00", not "1,800.00" or a box in place of "₱"
    And it shows no email, mobile number or reference numbers

  Scenario: The PDF can't be made
    Given the PDF fails to build on the phone
    Then the homeowner sees "We couldn't make the PDF. Try again, or take a screenshot of this page."
    And the statement on screen is unchanged

  Scenario: Staff open a household's statement
    Given Paolo Aquino holds the admin office role
    When he opens Blk 3 Lot 9 in the directory and presses "Statement"
    Then he sees the same statement the homeowner sees, headed "Blk 3 Lot 9"
    And there is no way to change a bill or payment from it

  Scenario: A homeowner cannot see another lot's statement
    Given Maria Santos is linked only to Blk 1 Lot 3
    When she opens the statement address for Blk 3 Lot 9
    Then she sees "You don't have access to this page"
    And Firestore refuses her read of Blk 3 Lot 9's bills and payments

  Scenario: The statement fails to load
    Given the statement cannot be loaded
    Then the homeowner sees "We couldn't load your statement. Check your connection and try again." with "Try again"
    And no balance is shown rather than a wrong one

  Scenario: The stored balance and the worked-out balance disagree
    Given the household's stored balance is ₱5,400.00 and the periods add up to ₱3,600.00
    Then the summary shows ₱5,400.00
    And the mismatch is reported to the developer's error monitoring with the household id and both figures as numbers, and nothing else
```

## Data changes

No new collections. This REQ reads what REQ-008 and the payment REQs write.

| What | Where | Read by | Rule |
|---|---|---|---|
| All bills for the lot, oldest first | `bills` where `householdId == X`, ordered by period | Members of X; treasurer and admin office (`isStaff()`); board not in R1 | Index (`householdId`, `period` asc). Member queries must filter on their own `householdId`. No client writes |
| Payments for the lot, 10 at a time, for display | `payments` where `householdId == X`, newest first | Same | Indexes (`householdId`, `submittedAt` desc) and (`householdId`, `status`) for the pending note. What a member sees of each payment follows REQ-010 decision 3 (b): the household-visible summary only |
| Stored totals: `billedCentavos`, `paidCentavos`, `balanceCentavos`, `pendingCentavos` | `households/{id}` | Same; the page keeps a live listener on this document | Written only by functions. **No stored overdue count** (C4: worked out when read) |
| Ledger rule | `shared/domain/ledger.js` | Screen, PDF, functions | Unit-tested with the sample accounts in the scenarios above |

**Read cost (Sol Arch's answer):** the statement reads **all** the lot's bills (about 12 a year, so about 60 for a five-year-old lot) plus the totals, and never reads payment history to work out the balance. "Show earlier periods" is a display choice only, with no extra query. Per-bill paid amounts are **not** stored: a void or correction would have to rewrite many bills. Revisit if a lot passes about 60 bills.

**PDF library:** jsPDF and jspdf-autotable from npm, pinned to the current release after `npm audit` (not the mock-up's 2.5.1), loaded with a dynamic `import()` only when "Download PDF" is pressed, with an embedded subset of an open-licence font (for example Noto Sans) so "₱" and "ñ" print.

## UX/UI notes

- **Accessibility:** the status is always a word ("Overdue"), with colour as a second signal; amounts are right-aligned with tabular figures; the summary is an `h2`-led region so a screen reader reaches the balance first; the card list is a list (`ul`), the desktop view a real table with headers.
- **Consistency:** "Statement of account" as the card heading; "Balance", "Overdue", "credit", "awaiting approval" from the glossary; periods "November 2026"; due date "Nov 30, 2026"; "Partly paid" replaces the mock-up's "Partial" (to add to the glossary).
- **Mobile-first:** cards at 375 px; "Download PDF" is a full-width secondary button below the summary; no horizontal scroll (fixes backlog review finding 2).
- **States:** empty (above); loading (skeleton summary and three skeleton cards; never "₱0.00" while loading, which would look like good news); error (above, no balance shown); partial (older periods on demand).
- **Safe actions:** none: read-only.
- **Roles:** household members, treasurer, admin office. Board: not in R1 (REQ-002 open question on board access to household data).
- **Privacy:** the PDF has the lot and the HOA name but no contact details or reference numbers, since it may be printed and handed to a bank or buyer. After a sale, payments made before the viewer joined show date, amount and status only, labelled "Made before you joined" (REQ-010 decision 3 (b)).
- **PDF:** uses an embedded font so "₱" and "ñ" print correctly; the library loads only when "Download PDF" is pressed, keeping it out of the first page load. QA tests 24+ periods on a real low-end Android phone.
- **Live balance:** the summary updates when the stored totals change, so "my balance didn't change" after an approval isn't a reason to call the office.

## Copy of record

| Where | Text |
|---|---|
| Page heading (homeowner) | Dues & Payments |
| Page sub-heading | {lot} · Monthly dues {amount}, due on the last day of each month |
| Card heading | Statement of account |
| As-of line | As of {date} |
| Summary | Balance {amount} · {n} periods overdue · (no overdue: "Nothing overdue") · (credit: "{amount} credit") |
| Period card fields | Period · Due date · Billed · Paid · Status |
| Statuses | Paid · Partly paid · Unpaid · Overdue · ({amount} left) |
| Opening line | Balance before {first period} · Credit before {first period} |
| Correction note | Corrected: {amount} ({reason}) |
| Payment before joining | Made before you joined |
| Awaiting approval | {amount} awaiting approval. Your balance updates once the treasurer has checked it. |
| Show more | Show earlier periods ({n}) |
| Button | Download PDF (in flight: Preparing…) |
| PDF footer | As of {date}. This statement is not an official receipt. |
| PDF error | We couldn't make the PDF. Try again, or take a screenshot of this page. |
| Empty | No bills yet. Your first statement appears when the HOA bills the next period. |
| Load error | We couldn't load your statement. Check your connection and try again. · Try again |
| Staff button | Statement |

## Out of scope

- The homeowner dashboard's balance tile and overdue warning (story 15).
- Penalties and interest (D2).
- Emailing the statement (story 19, R2).
- Statements for a date range or a past "as of" date.
- Cash or cheque payments recorded at the office (EPIC-003 open question).

## Open questions

| Question | Who decides |
|---|---|
| Mismatch alerts feed a nightly reconciliation later (R-11); not in this REQ | Sol Arch, later |
| Does a buyer or bank need the statement on HOA letterhead with a signature? If so, that is a certificate (story 38), not this PDF | Treasurer |
| Add "Partly paid" to the glossary in place of "Partial" | BA, with the owner's approval |

## Sol Arch review

Questions for Sol Arch (from the BA, r1):

1. Per-bill paid amounts kept by functions versus allocating in the browser on each open (Data changes, read cost).
2. PDF library bundled from npm (CODING-STANDARDS rule 7); confirm it works on low-end Android phones for 24+ periods.
3. Rules for staff reads of `bills` and `payments` across households (treasurer and admin office), and the index.

**BA size estimate (Sol Arch to confirm):** M, about 2.5–3 person-days with Claude Code: ledger module and tests, responsive statement, PDF, staff view, rules tests.

### Sol Arch findings (2026-11-28, draft)

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 §4.4 item 1 (`shared/domain/ledger.js`), §4.2, §9 (official PDFs are made on the server; others in the browser), R-11 and R-16; RELEASE-PLAN conflict C4. The mock-up's PDF libraries were read at `index.html` lines 367–368 (jsPDF 2.5.1 and jspdf-autotable 3.8.2 from a CDN). Baselines: `docs/sa-001-architecture` at `e28d9bc`, `docs/req-005-045` (uncommitted).

**Verdict: Supports Option A, with changes.** A browser PDF fits SA-001 §9, because this statement is explicitly not an official document. The read-cost question has a simpler answer than per-bill paid amounts, and the PDF has one trap: the standard PDF fonts can't print "₱".

#### Options

| Option | Feasible? | Cost (BA) | Sol Arch |
|---|---|---|---|
| A: cards and table, PDF in the browser | Yes | Moderate | **Agree** |
| B: server PDF, stored | Yes | Moderate to high | Agree. Revisit only if R2's emailed statement needs a stored copy |
| C: screen only | Yes | Cheapest | Agree with the downside |

#### Answers to the BA's questions

1. **Neither per-bill paid amounts nor a full payment scan. Read all the household's bills plus one stored total.** Oldest-first allocation needs only:
   - the bills in date order (amount plus any adjustment), and
   - **one number, the total of approved dues payments** (`households.paidCentavos`, kept by `decidePayment` and the void function).

   The paid amount on each bill falls out of a prefix sum in `ledger.js`. Bills grow by 12 a year, so a five-year-old lot is about 60 reads per open, with no reads of payment history at all. **Per-bill paid amounts, which I reject,** would make every void (REQ-014) or correction rewrite the paid amount on many bills: write amplification and a new drift source (R-11). Revisit if a lot passes about 60 bills, by storing a running "billed before" figure on each bill. The payment list is a separate, paginated query (10 at a time) for display only.
2. **The PDF library: jsPDF + jspdf-autotable from npm, pinned to the current release, not the mock-up's 2.5.1.** jsPDF has published advisories since 2.5.1: a ReDoS fixed in 3.0.1, and more fixed in the 4.x line ([GitLab advisory database, jsPDF CVE-2025-29907](https://advisories.gitlab.com/pkg/npm/jspdf/CVE-2025-29907/); [jsPDF releases](https://github.com/parallax/jsPDF/releases)). Pin the version at build time after `npm audit` (CS-7). **Load it with a dynamic `import()` only when "Download PDF" is pressed**, so it stays out of the first-load bundle (CS-11 budget). **Font trap:** jsPDF's built-in standard fonts use WinAnsi encoding, which has no "₱" (U+20B1). Embed a subset of an open-licence font (for example Noto Sans, SIL OFL) and load it lazily with the library. Otherwise every amount prints with a broken glyph. **Low-end Android with 24+ periods: Uncertain but likely fine** (2–3 pages of table). QA must test it on a real low-end device; add to the test plan.
3. **Rules:**
   - `bills` and `payments`: read for `isMember(resource.data.householdId)`, or for `isStaff()` with role `treasurer` or `admin`. Board: no in R1, as the REQ says. No client writes.
   - Member queries must filter `householdId ==` their own lot. That is how rules can evaluate a list query.
   - Indexes: `bills (householdId, period asc)`, and `payments (householdId, submittedAt desc)` for the list. `payments (householdId, status)` for the pending note.
   - What a member may see of `payments` follows the REQ-010 review: the summary document is household-visible; details are not.

#### Required changes (for the BA to apply)

> **BA note (r3):** all six are applied above: 1 in Data changes; 2 in "How the statement is worked out", with scenarios for corrections (REQ-046, now in S2), amenity fees and opening credit; 3 as the midnight scenario; 4 by reporting both figures; 5 in UX/UI notes and the download scenario; 6 as the "Made before you joined" scenario and copy, following the approved REQ-010 decision 3 (b). Sol Arch's recommended live listener on `households/{id}` is adopted. None conflicts with an approved decision.

1. **Data changes:** replace the "Read cost" paragraph with answer 1. Bills are read all at once (bounded), totals come from `households/{id}`, and payments are paginated separately. "Show earlier periods" becomes a display choice only, with no extra query.
2. **Ledger rules to add to "How the statement is worked out":**
   - Only `kind == dues` payments count (amenity fees, REQ-031, never reduce dues).
   - A bill's due amount is `amount + adjusted` (if the correction story is added).
   - `openingCredit` joins the payment pool (REQ-008 review).
   - "Overdue" means the day after the due date, Asia/Manila (C4: worked out when read).
3. **Add a scenario at midnight:** "Given December 2026 is due Dec 31, 2026 and unpaid. When the homeowner opens the statement at 11:59 PM on Dec 31 Manila time, it reads 'Unpaid'. At 12:00 AM on Jan 1 it reads 'Overdue'." (R-15.)
4. **Scenario "The stored balance and the worked-out balance disagree":** keep it. Note that the two can differ only if the bills don't sum to `billedCentavos`, so the report should carry both figures (as numbers, with the household id only), to make the nightly reconciliation (R-11) easy later.
5. **PDF:** add to UX/UI notes "the PDF uses an embedded font so ₱ and ñ print correctly", and a scenario that the PDF shows "₱1,800.00", not "1,800.00" or a box.
6. **Payments list after a sale:** align with REQ-010 decision 3 (b). The statement's payment rows for payments before the viewer joined show date, amount and status only, labelled "Made before you joined".

#### Risks not covered

- **Sale privacy (R-16, P1):** governed by REQ-010 decision 3. The statement itself (bills, balance) staying with the lot is fine. Bills carry no personal data.
- **The PDF leaves the portal.** It may be given to a bank or buyer. It carries the lot and the HOA name only (already in the REQ). The file name contains the lot, not a person's name. Good.
- **Stale data on screen:** the statement is a snapshot. If the treasurer approves a payment while it is open, the homeowner sees the change on the next open (no live listener needed). Say so, or add a live listener on `households/{id}` only (1 read per change). I recommend the listener: it is cheap, and "my balance didn't change" is exactly the enquiry we want to avoid.
- **Repeat-trigger safety, concurrency:** not applicable; the screen is read-only.
- **Scale and cost:** about 15–60 reads per open (bills plus totals plus 10 payments). At 300 sessions a day this stays inside SA-001 §7's estimate.
- **Observability:** the mismatch report (scenario) plus PDF build errors to error monitoring, with no personal data.

#### Size

**M, 3 person-days with Claude Code (BA: 2.5–3).** The extra is the embedded font and the lazy-loaded PDF module.

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**2–2.5 person-days with Claude Code** (was 3). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0.5 · 0.25–0.5 · 0 · 0.75–1 · 0.5
- **Reuses:** Port: the statement table in `oDues()` 616–621, `dlButtons()` 994, `statementPDF()` 1014 layout with `pdfStart()` 1004, `statementCSV()` 1070. Extend: empty, loading, credit, part-paid and staff view (608–611). BE: the aging helper, embedded font, lazy PDF module
