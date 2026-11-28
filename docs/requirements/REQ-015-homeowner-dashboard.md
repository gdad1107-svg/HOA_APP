# REQ-015: Homeowner dashboard

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-002 Billing and statement](../epics/EPIC-002-billing-and-statement.md) |
| Backlog story | [15 Homeowner dashboard](../backlog/BACKLOG.md#15-homeowner-dashboard) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted (REQ-013 #3 as Sol Arch proposed). Sol Arch reviewed: supports Option A with changes (applied in r3) |
| Mockup | Screens 15A–15F of the payments and announcements mockup (not yet published as an artifact). Repo copy: [req-012-017-mockup.html](../mockups/req-012-017-mockup.html) |
| Architecture | SA-001 §4.2 (`households` totals), §4.4 item 1, §7 (reads per screen), R-11, R-16; CODING-STANDARDS rule 11. Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-009 (statement and balance rules; the statement must show the **stored** balance, not one recalculated in the browser, for the two to agree), REQ-010 (pending payments), REQ-011 (bell), REQ-013 (receipt button), REQ-016 (announcements). Landing page already named by REQ-001 and REQ-004 |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (overdue and due date from a server-kept `openBills` summary and a shared aging helper, stored balance in REQ-009, credit as a negative balance, phone-clock note, sale rule by submission time, `config/features`) · r4, 2026-11-28: owner approval recorded; recommendations accepted · r5, 2026-11-28: answers TC-15 gaps G-1 to G-9 (and TC-12 G-2, TC-14 G-12): `openBills` recalculated from bills and the household's paid total, no per-bill paid amounts; first-name fallback; which due date shows; fully paid, credit and awaiting-approval combinations; "Pay with QR" always shown; overdue alert counts overdue bills only; payment-row statuses and reasons; per-card error copy; `config/features` not read by people with no household · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Questions for the HOA board under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (a small R1 dashboard: balance, overdue warning, recent payments, announcements) or B (no dashboard in R1: sign-in lands on Dues & Payments) | **A** |
| 2 | Show money waiting for approval on the balance tile | **Yes**: "₱1,800.00 awaiting approval", so nobody pays twice while they wait |
| 3 | **D2 (board decision): penalties and grace period.** Changes what "overdue" means | The dashboard shows exactly what the statement (REQ-009) shows; no rule of its own |
| 4 | Privacy after a sale (REQ-010 decision 3, REQ-013 decision 5) | **REQ-010 option (b):** recent payments follow exactly the same rule as the payment history (payments **submitted** before the member's link date show date, amount and status only, no receipt), through one shared payment-row component, so the rule lives in one place |

## Problem

A homeowner opens the portal once or twice a month, on a phone, to answer one question: "Do I owe anything, and did my payment go through?" (PERSONAS). The mock-up's dashboard answers it but also shows booking, request and vehicle tiles for features that won't exist in R1, and its recent-payments table scrolls sideways on a phone (review finding 2).

**Challenge:** in R1 the only features are dues and announcements. A dashboard that repeats the top of the statement is one more screen to build and test. Option B is a fair choice. I recommend A only because REQ-001 and REQ-004 (approved) already land people on "the dashboard", and it is where the overdue warning and pending status sit before the homeowner looks for them.

## Options

### Option A: A small R1 dashboard (recommended)

- **How it works:** after sign-in the homeowner sees a greeting with their lot, an overdue warning if any, a balance tile with "Pay with QR", the last 3 payments as cards with status and receipt button, and the latest 3 announcements. Tiles for bookings, requests and vehicles appear only when those features ship. First item in the homeowner menu.
- **Cost:** cheap (story size S). Reads the household's totals, 3 payments and 3 announcements: about 7 document reads.
- **Honest downside:** duplicates the statement's summary; a second place where figures must agree.

### Option B: No dashboard in R1

- **How it works:** sign-in lands on Dues & Payments; the dashboard arrives in R3 when there are several features to summarise.
- **Cost:** none now; REQ-001/REQ-004's "lands on the dashboard" changes to "lands on Dues & Payments".
- **Honest downside:** announcements are one tap further away; the R3 dashboard is a bigger change later.

### Recommendation

**Option A**, kept to what R1 has. Both tiles read the same server-kept totals as the statement, so the figures can't disagree.

## Story

As a homeowner, I want a home page with my balance, anything overdue, and links to what I do most, so that I see what needs my attention as soon as I sign in.

## Acceptance criteria (Option A)

```gherkin
Feature: Homeowner dashboard

  Scenario: An account with an amount due
    Given Juan of Blk 4 Lot 12 owes ₱1,800.00 for November 2026, due Nov 30, 2026
    When he opens the dashboard
    Then he sees "Welcome back, Juan" and "Blk 4 Lot 12"
    And the balance tile reads "₱1,800.00" and "Due Nov 30, 2026" with a "Pay with QR" button

  Scenario: An account with overdue dues
    Given Roberto has 2 months overdue totalling ₱3,600.00
    When he opens the dashboard
    Then he sees "2 months overdue · ₱3,600.00" with a "Pay now" button above the tiles

  Scenario: The overdue alert counts overdue bills only; the tile shows the next due date (G-2, G-6)
    Given today is Dec 5, 2026 in Manila
    And Roberto owes October and November 2026, each ₱1,800.00 and past due, and December 2026, ₱1,800.00 due Dec 31, 2026
    When he opens the dashboard
    Then he sees "2 months overdue · ₱3,600.00"
    And the balance tile reads "₱5,400.00" and "Due Dec 31, 2026"

  Scenario: Everything owed is overdue (G-2)
    Given today is Dec 5, 2026 in Manila
    And Roberto owes only October and November 2026, both past due
    Then the balance tile reads "₱3,600.00" and "Was due Oct 31, 2026"

  Scenario: A fully paid account
    Given Maria's balance is ₱0.00
    Then the balance tile reads "₱0.00" and "You are fully paid"
    And there is no overdue warning
    And "Pay with QR" is shown, because paying ahead is allowed (G-5)

  Scenario: Fully paid with a payment waiting (G-3)
    Given Maria's balance is ₱0.00 and she has ₱1,800.00 awaiting approval
    Then the balance tile reads "₱0.00", "You are fully paid" and "₱1,800.00 awaiting approval"

  Scenario: A credit
    Given Juan has ₱200.00 credit
    Then the balance tile reads "₱0.00" and "₱200.00 credit"
    And "Pay with QR" is shown (G-5)

  Scenario: Credit from before the portal and nothing billed yet (G-4)
    Given Blk 6 Lot 4 has ₱1,200.00 credit from before the portal and no bills
    Then the balance tile reads "₱0.00" and "₱1,200.00 credit"
    And it does not read "No dues billed yet"

  Scenario: No name on the account (G-1)
    Given Juan's account has no name, because his Google profile had none
    When he opens the dashboard
    Then the heading reads "Welcome back" with no name

  Scenario: A payment waiting for approval
    Given Carlo owes ₱1,800.00 and submitted ₱1,800.00 that is pending approval
    Then the balance tile reads "₱1,800.00" and "₱1,800.00 awaiting approval"
    And his recent payments show ₱1,800.00 "Pending approval"

  Scenario: The dashboard agrees with the statement
    Given any household
    Then the balance on the dashboard equals the balance on its statement of account

  Scenario: Recent payments
    Given Carlo has 5 payments
    Then the dashboard shows the 3 newest, each with date, amount, status, and "Receipt PDF" when approved
    And "See all payments" opens Dues & Payments

  Scenario: Rejected and void payments show their reason (G-7, TC-14 G-12)
    Given Carlo's 3 newest payments are one rejected for "Screenshot is unreadable", one voided for "Duplicate of OR-00090" and one approved as OR-00093
    Then recent payments read "Rejected: Screenshot is unreadable", "Void: Duplicate of OR-00090" and "Approved · OR-00093"
    And the same rows on Dues & Payments read the same

  Scenario: Nothing billed yet
    Given a newly linked household with no bills and no payments
    Then the balance tile reads "₱0.00" and "No dues billed yet"
    And recent payments read "No payments yet."
    And "Pay with QR" is shown (G-5)

  Scenario: Only tiles for released features
    Given amenity booking, requests and vehicles are not released
    Then the dashboard shows no "Next booking", "Open requests" or "Vehicles" tile

  Scenario: No announcements
    Given no announcements have been posted
    Then the announcements card reads "No announcements yet."

  Scenario: Loading
    When the dashboard is opening on a slow connection
    Then placeholder tiles show where the balance and payments will be

  Scenario: The balance can't load
    Given the connection is lost
    When Juan opens the dashboard
    Then the balance tile reads "Couldn't load your balance. Check your connection and try again." with "Try again"
    And no figure is shown in its place

  Scenario: The payments or announcements card can't load (G-8)
    Given the balance loaded but the payments and announcements didn't
    Then the payments card reads "Couldn't load your payments. Try again." with "Try again"
    And the announcements card reads "Couldn't load announcements. Try again." with "Try again"
    And the balance tile still shows the balance

  Scenario: A person with no household doesn't reach the dashboard (G-9)
    Given Dina has signed in but isn't linked to a household
    Then she sees the not-linked screen (REQ-004)
    And her browser does not read the released-features settings, which the server refuses her

  Scenario: A bill falls due overnight
    Given Juan owes ₱1,800.00 for November 2026, due Nov 30, 2026, and has paid nothing
    When he opens the dashboard on Dec 1, 2026, Manila time
    Then he sees "1 month overdue · ₱1,800.00" with a "Pay now" button
    And no save or billing run was needed for the warning to appear

  Scenario: A new owner after a sale (REQ-013 decision 5)
    Given Ben was linked to Blk 2 Lot 7 on Dec 10, 2026
    Then the balance tile shows the lot's balance
    And recent payments submitted before Dec 10, 2026 show date, amount and status only, with no "Receipt PDF"
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Balance | `households/{id}.balanceCentavos` | The stored balance; the statement (REQ-009) shows the same stored figure. Negative means **credit**; on this tile it is shown as "₱0.00" plus "₱x credit" (the statement's summary reads "₱x credit", REQ-009). Credit wins over "No dues billed yet" (G-4) | `decidePayment`, `voidReceipt`, billing run | Dashboard, statement |
| Open bills summary | `households/{id}.openBills`: `[{period, dueDate, outstandingCentavos}]` (new) | Server-kept on the household document only, sized for the worst case (60 entries, a few KB). **Not a per-bill paid amount** (REQ-009 r3 stores none): each writer recalculates the whole summary from all the household's bills and `households.paidCentavos` with `shared/domain/ledger.js`, in its own transaction (TC-12 G-2). "{n} months overdue · {amount}" and the next due date are **worked out when read** against today in Manila (C4), by one shared helper, `shared/domain/aging.js`, also used by REQ-009, REQ-018 and REQ-034. No stored `overdueCount`, which would go stale at midnight. **Alert amount** = the outstanding amounts of overdue bills only (G-6). **Tile date** = the earliest due date among open bills not yet due; when every open bill is overdue, "Was due {earliest unpaid due date}" (G-2) | Billing run (REQ-008), `decidePayment`, `voidReceipt`, REQ-046 corrections; the opening-balance import fills it (R-8) | Dashboard |
| First name | `users/{uid}.name` (REQ-001) | The first word of the name typed at account creation, or of the Google profile name. If there is none, the heading reads "Welcome back" (G-1) | REQ-001 | Dashboard, REQ-017 pop-up |
| Awaiting approval | `households/{id}.pendingCentavos` | Server-kept: `submitPayment` adds, `decidePayment` subtracts on approve and on reject, a void doesn't change it; the nightly reconciliation recounts it. Never summed in the browser | REQ-010, REQ-012 | Dashboard |
| Recent payments | the 3 newest `payments` for the household | Shared payment-row component and sale rule (decision 4) | — | Dashboard |
| Announcements | the 3 newest live `announcements` (REQ-016) | One shared fetch with the banner and the pop-up (REQ-016, REQ-017) | — | Dashboard |
| Released features | `config/features` (new), e.g. `{bookings: false, requests: false, vehicles: false, guestPasses: false}` | Readable by members of a household (via `memberOf/{uid}`, REQ-016) and staff; no client writes; the developer sets it per project. Hides tiles only; unreleased features are denied by rules anyway. **A signed-in person with no household doesn't read it**: the not-linked screen (REQ-004) shows no feature tiles (G-9) | Developer | Dashboard, once per session |

Reads per open: about 9–13; **under 10 holds only if** the announcement data is fetched once and shared, and the bell (REQ-011) runs an unread count on page open and loads its list only when opened (for the S2 review of REQ-011).

## UX/UI notes

- **Accessibility:** the balance is real text with a label ("Balance due"), not only a large number; the overdue warning is a labelled alert with words, not just red; contrast of white on the green tile is 5.3:1 (mock-up colours, to be checked); every button 44 px.
- **Consistency:** "Balance due", "credit", "awaiting approval", "overdue" from the glossary; tiles, alert and announcement items reuse the mock-up's `.tile`, `.alert`, `.news`.
- **Mobile-first:** one column at 375 px: warning, balance tile, recent payments as cards (no table), announcements. "Pay with QR" sits in the first screenful.
- **States:** empty (no bills, no payments, no announcements), loading (placeholders), error (no fake zero), success n/a, partial (balance loaded but announcements failed: each card fails on its own).
- **Stable layout:** the overdue warning area doesn't reserve space when absent (it appears on load, before the tiles render, so nothing jumps); tiles keep size while loading.
- **Roles:** homeowners only; a staff member who is also a homeowner sees it under "My household" (REQ-002). Rules limit reads to the member's household.

## Copy of record

| Where | Text |
|---|---|
| Heading | Welcome back, {first name} · (no name on the account) Welcome back · {lot} · {HOA name} |
| Overdue alert | {n} month(s) overdue · {amount of overdue bills} · Please settle your balance to avoid further notices. · Pay now |
| Balance tile | Balance due · {amount} · Due {date} / Was due {date} / You are fully paid / {amount} credit / No dues billed yet · {amount} awaiting approval (shown with any of these) · Pay with QR (always shown, unless the QR isn't set up or the lot is inactive, REQ-010) |
| Recent payments (shared payment row, same as Dues & Payments) | Recent payments · {date} · {amount} · Pending approval / Approved · {OR no.} / Rejected: {reason} / Void: {reason} · (made before you joined) {status} · Made before you joined, with no reason or receipt number · Receipt PDF · See all payments · No payments yet. |
| Announcements | Announcements · See all · No announcements yet. |
| Errors | Couldn't load your balance. Check your connection and try again. · Couldn't load your payments. Try again. · Couldn't load announcements. Try again. · Try again |

## Out of scope

- Booking, request, vehicle and guest-pass tiles (appear with stories 26, 28, 31, 40).
- Charts or payment trends.
- Staff dashboards (story 25, R2).
- Correcting for a wrong phone clock. "Today" for the overdue warning comes from the phone; a wrong clock can show a bill as overdue a day early or late. Accepted as low impact (Sol Arch change 4).

## Open questions

| Question | Who decides |
|---|---|
| D2: penalties and grace period (decision 3 follows whatever is decided) | HOA board |
| Who is the HOA's Data Protection Officer, to confirm decision 4? | HOA board |
| REQ-009 shows the stored balance, and REQ-011's bell loads lazily (Sol Arch changes 2 and the reads note) | S2 review of REQ-009 and REQ-011 |
| Does the overdue alert mention notices before notices exist (story 20, R2)? Recommended: no, until R2 | Owner |

## Sol Arch review

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 (`docs/sa-001-architecture` at `e28d9bc`): §4.2 `households`, §4.4 item 1, §7, R-11, R-16. Also CS-11, conflict C4 (RELEASE-PLAN), and the S2 drafts REQ-009, 010 and 011, which are under review in parallel. Greenfield.

**Verdict: Supports Option A, with changes.** It is cheap if it reads only stored summaries. Two changes go beyond this screen:
- The overdue figures can't come from a stored `overdueCount` if C4 ("worked out when read") is approved.
- The read target holds only if the bell loads its list lazily (REQ-011).

#### Options

| Option | Feasible? | BA's cost | Sol Arch |
|---|---|---|---|
| A: small R1 dashboard | Yes | S | **Agree, 1–1.5 days.** |
| B: no dashboard | Yes | None | Agree. REQ-001 and REQ-004's landing copy would change. |

#### Answers to the BA's points

1. **`pendingCentavos`: confirmed, server-kept.** `submitPayment` adds to it. `decidePayment` subtracts on approve and on reject. A void doesn't change it. The nightly reconciliation job (R-11) recounts it from pending payments. Never sum pending payments in the browser.
2. **Reads per open (target under 10).**

   | Read | Reads |
   |---|---|
   | `households/{id}` | 1 |
   | `users/{uid}` (first name) | 1 |
   | `members` check inside rules (billed, cached within one request) | about 1 |
   | 3 newest payments | 3 |
   | Announcements: one shared query for banner, pop-up and card (REQ-016 and 017 reviews) | 1–3 |
   | The person's `reads/{uid}` for live banners | 1–3 |
   | `config/features`, once per session | 1 |

   That is about 9–13. **Under 10 holds if:**
   - (a) the announcement data is fetched once and shared by the banner, the pop-up and this card
   - (b) the bell (REQ-011) runs only an unread **count** query on page open, which is billed as one read per batch of up to 1,000 index entries, and loads its newest 30 only when the panel opens. REQ-011's draft has a live listener for 30. **That is for the S2 review to change.**

   At 300 sessions a day this is about 3,000–4,000 reads a day, against a free allowance of 50,000 (SA-001 §7).
3. **Released features: a `config/features` document.** For example `{bookings: false, requests: false, vehicles: false, guestPasses: false}`. Members and staff can read it. No client can write it: the developer sets it per project. Staging can then switch a feature on before production without a rebuild. It only hides tiles. Unreleased features have no rules allowing access, so they are denied by default anyway.

#### Required changes (BA to apply)

1. **Overdue warning and "Due {date}" (Data changes):** with C4, "overdue" is worked out from unpaid due dates against today in Manila. A stored `overdueCount` goes stale at midnight when a bill falls due, because nothing writes then.
   - **Design:** `households/{id}` carries a small server-kept `openBills` summary: `[{period, dueDate, outstandingCentavos}]`. It is written by the billing run, approvals and voids. The screen works out "{n} months overdue · {amount}" and the next due date with one shared helper (`shared/domain/aging.js`), the same one REQ-009, REQ-018 and REQ-034 use. Still one read. Size the array for the worst case: 60 entries is a few KB.
   - **Wording:** replace "Reads `households/{id}` totals" with this.
2. **"The dashboard agrees with the statement"** is true only if REQ-009 also shows the **stored** balance, not one recalculated in the browser. Add REQ-009's choice to Depends on. The S2 review is to confirm.
3. **Credit:** define it once, as REQ-012 review change 3: a negative `balanceCentavos`, shown as "₱0.00" plus "₱200.00 credit".
4. **"Today" comes from the phone's clock.** A wrong clock could show a bill as overdue a day early or late. Accept it (low impact), or say so in Out of scope.
5. **Sale privacy:** recent payments use exactly the rule REQ-010 decision 3 and the REQ-013 review settle (`submittedAt` against `linkedAt`, or `ownerSince`). There is one shared payment-row component, so the rule lives in one place.

**BA, r3: how the changes were applied.** All five are applied: 1 in Data changes and a new scenario, 2 in Depends on and Open questions, 3 in Data changes, 4 under Out of scope, 5 in decision 4 and the sale scenario. On 5, the owner approved REQ-010 option (b) everywhere, so the rule is `submittedAt` against `linkedAt`, not `ownerSince`.

#### Risks not covered

- **Figures drifting (R-11):** one stored balance and one aging helper. The reconciliation job alerts on a difference.
- **Privacy:** `households/{id}` is readable by every member. It must hold nothing about a previous owner beyond `displayName`, which the office updates at a sale (REQ-003). Contacts are already separate.
- **Cost at 10× (6,000 households):** reads per open don't grow with the number of households. Fine.

**Risk checklist** (each item answered):

| Item | Answer |
|---|---|
| Repeat trigger | n/a: the screen only reads |
| Stale reference | Live listener on the household document |
| Deletes | n/a |
| Field written and never read | `pendingCentavos` and `openBills` both have readers here |
| Schema and rules as a pair | No new rules beyond `config/features` (read only) |
| Shared helper | `aging.js` and the payment row are shared. Run all suites |
| Copy | "awaiting approval", not "paid" |
| Existing data | The import must fill `openBills` (R-8) |
| Identity | n/a |
| Roles | Members only. Staff see it under "My household" |
| Environments | `config/features` per project |
| Secrets and PII | None new |
| Network | Each card fails on its own |
| Scale and cost | As above |
| Dependencies | None |
| Observability | Reconciliation |

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**0.75–1 person-days with Claude Code** (was 1–1.5). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0.25 · 0.25 · 0 · 0–0.25 · 0.25
- **Reuses:** Port: `oDash()` 584–603 (overdue alert 592, tiles 593–598, announcements and recent payments 599–602). R1 shows the dues tiles only. Extend: credit, nothing yet, loading (588–591). The `openBills` summary is written by 008/012/014
