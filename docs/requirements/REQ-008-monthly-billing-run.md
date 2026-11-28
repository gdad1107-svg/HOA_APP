# REQ-008: Monthly billing run and opening balances

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-002 Billing and statement](../epics/EPIC-002-billing-and-statement.md) |
| Backlog story | [08 Monthly billing run](../backlog/BACKLOG.md#08-monthly-billing-run) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted. Sol Arch reviewed: supports Option A with changes (applied in r3) |
| Mockup | Screens 8A–8D of the [REQ-005 to REQ-011 mockup](../mockups/req-005-011-mockup.html). Not yet published as an artifact: ready for the main session to publish |
| Architecture | SA-001 Flow 4 (`billingRun`, `billingRuns/{period}`, deterministic `bills/{period}_{householdId}`), §3, §4.4 item 1 (totals kept by functions), R-8 (onboarding and opening balances), R-15 (time zone); Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-003 (households), REQ-007 (dues rate), REQ-006 (activity log), REQ-011 (notifications). Bill corrections: [REQ-046](REQ-046-adjust-or-cancel-a-bill.md) (added to S2 by decision 5) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (`households.billedThrough` replaces `skipped[]`, no stored overdue count, start without opening balances, stale-rate refusal, stopped run derived from a heartbeat, one worker on Continue, credit and months owed in opening balances, preview copy now that corrections exist, deactivation during a run, deterministic notification ids, production guard) · r4, 2026-11-28: owner approval recorded; recommendations accepted; decision 5 points to REQ-046 |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. D8 is a manual run in R1; opening balances are loaded; **"Adjust or cancel a bill" is added to S2 as [REQ-046](REQ-046-adjust-or-cancel-a-bill.md)**, built as adjustment lines in the month they're made (matching conflict C1), never edits, including the bulk correction by period; D2 is none in R1. Questions for the treasurer, the HOA board and the admin office under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | **D8**: Option A (treasurer runs it, with a preview and a reminder), B (automatic on the 1st) or C (automatic, with the treasurer able to run it early) | **A for R1.** The same server job runs either way, so switching to B later is a setting, not a rebuild (about +0.5 day) |
| 2 | Earliest date a period can be billed | **From the 1st of that period, Manila time.** Stops January being billed in November by mistake |
| 3 | Opening balances (story 08b below): load what each household owed before the portal, or start everyone at ₱0.00 | **Load them**, as one "Balance before {first period}" line per household. Starting at zero shows households in arrears as in good standing |
| 4 | A household added after its period was billed | **The treasurer decides**, from a "Not billed for {period}" list on the billing card. The admin office adds households; it doesn't create bills |
| 5 | Correcting a wrong bill. Without a correction story, a wrong rate billed to 623 households would stay wrong | **Add a story "Adjust or cancel a bill, with a reason"** to S2: [REQ-046](REQ-046-adjust-or-cancel-a-bill.md). Adjustment lines in the month they're made, never edits; bulk by period included. Sol Arch: M, 2.5–3.5 days, bulk +1 day |
| 6 | **D2**: late penalty, interest and grace period | **None in R1** until the board decides. Bills are dues only, due on the last day of the period |

## Problem

Every household must be billed once a month at the right rate, so that its statement is current. In the mock-up, "Generate December 2026 billing" is a button that can be pressed twice, creating two bills for the month (backlog review finding 8). It also has no starting point: the real HOA's households already owe money from before the portal, and REQ-003 deferred opening balances to this REQ.

Who has the problem: the [Treasurer](../product/PERSONAS.md#treasurer), a volunteer who runs it monthly, and every [Homeowner](../product/PERSONAS.md#homeowner), whose balance depends on it.

**How often:** once a month, 623+ bills each time. One mistake touches every household, so the run must be impossible to repeat and easy to check before it happens.

## Options

### Option A: Treasurer runs it, with a preview and a reminder (recommended)

- **How it works:** Collections → Monthly billing shows the next period, the rate and the number of active households. "Generate December 2026 billing" opens a preview ("623 bills of ₱1,800.00, total ₱1,121,400.00, due Dec 31, 2026"). After "Generate billing", a server job creates the bills; the card shows progress and then the result. On the 1st, if the period isn't billed yet, every treasurer gets a reminder notification.
- **Where it lives:** Collections → Monthly billing (treasurer). In R1 Collections holds only this card; the delinquent list arrives in R2 (story 18).
- **Cost:** moderate: the job, the preview, progress, and late-addition handling.
- **Honest downside:** statements are only current once the treasurer acts. If they're away on the 1st, homeowners wait.

### Option B: Automatic on the 1st

- **How it works:** a scheduled job bills the period at 00:10 on the 1st, Manila time (SA-001 Flow 4). The treasurer sees the result.
- **Cost:** moderate, about +0.5 day over A.
- **Honest downside:** no check moment. If the general assembly approved a new rate and nobody entered it in time, every household is billed the old rate and has to be corrected afterwards (REQ-046).

### Option C: Automatic, with the treasurer able to run it early

- Both A and B. Most flexible; the most to test and explain.

### Recommendation

**Option A for R1**, because it gives the treasurer one look at the rate and count before 623 bills are created. A correction afterwards (REQ-046) is possible but touches every household's statement, so prevention is still worth the click. Switching to B later is a setting. Choosing A answers **D8** for R1.

## Stories

**08a.** As a treasurer, I want to bill one period's dues to every active household in one step, so that every statement is current at the start of the month.

**08b.** As a treasurer, I want to load each household's balance from before the portal, once, before the first billing run, so that statements start from what households really owe.

## Acceptance criteria (Option A)

```gherkin
Feature: Monthly billing

  Background:
    Given Carmela Cruz holds the treasurer role
    And monthly dues are ₱1,800.00
    And there are 623 active households and 2 deactivated ones

  Scenario: Preview, then bill the next period
    Given the last billed period is November 2026 and today is Dec 1, 2026 in Manila
    When Carmela presses "Generate December 2026 billing"
    Then she sees "Generate December 2026 billing? This creates 623 bills of ₱1,800.00 each, a total of ₱1,121,400.00, due Dec 31, 2026. 2 deactivated households are not billed. Check the figures: a wrong bill can only be corrected afterwards, with a reason, one household or one period at a time."
    When she presses "Generate billing"
    Then the card reads "Billing December 2026… 0 of 623" and counts up
    And then "December 2026 billed: 623 bills, ₱1,121,400.00. Done Dec 1, 2026 at 9:05 AM by Carmela Cruz."
    And each of the 623 households has one bill for December 2026 of ₱1,800.00, due Dec 31, 2026
    And the button now reads "Generate January 2027 billing" and is disabled with "Available from Jan 1, 2027"

  Scenario: A period is never billed twice
    When Carmela presses "Generate billing" twice quickly, or she and a second treasurer press it on two devices at once
    Then exactly 623 bills exist for December 2026
    And the second press shows "December 2026 is already being billed." or "December 2026 is already billed."
    And the button reads "Saving…" and is disabled while the first request is in flight

  Scenario: Too early to bill a period
    Given today is Nov 28, 2026 and November 2026 is billed
    Then "Generate December 2026 billing" is disabled
    And it shows "Available from Dec 1, 2026"
    And the server refuses a December 2026 run requested before Dec 1, 2026, Manila time

  Scenario: The rate changed after the preview opened
    Given Carmela opened the December 2026 preview at ₱1,800.00
    And the dues were then changed to ₱2,000.00 (REQ-007)
    When she presses "Generate billing"
    Then she sees "The monthly dues changed since you opened this preview. Check the new figures."
    And no bill is created
    And the preview reloads showing ₱2,000.00

  Scenario: The run uses the rate at the moment it starts
    Given the December 2026 run has started at ₱1,800.00
    When the dues are changed to ₱2,000.00 during the run
    Then every December 2026 bill is ₱1,800.00
    And January 2027's preview shows ₱2,000.00

  Scenario: An interrupted run is finished, not repeated
    Given the December 2026 run has made no progress for 5 minutes after 410 of 623 bills
    When Carmela opens Collections
    Then she sees "December 2026 billing stopped at 410 of 623. Press Continue to finish it. Bills already created won't be made again."
    When she presses "Continue billing"
    Then 213 more bills are created
    And exactly 623 bills exist for December 2026
    And each household's balance went up by ₱1,800.00 exactly once
    And two treasurers pressing "Continue billing" at once start one worker

  Scenario: Homeowners are told their statement is ready
    When the December 2026 run finishes
    Then each linked person in each billed household gets the notification "Your December 2026 statement is ready: ₱1,800.00 due Dec 31, 2026."
    And households with nobody linked get no notification, and their bill is still created
    And a resumed run gives nobody a second notification

  Scenario: A household deactivated during the run
    Given the December 2026 run is in progress
    When the admin deactivates Blk 7 Lot 1
    Then Blk 7 Lot 1 may or may not have a December 2026 bill, depending on whether the run had already reached it
    And either way it has at most one

  Scenario: Reminder when the period isn't billed
    Given December 2026 is not billed by 9:00 AM on Dec 1, 2026, Manila time
    Then every treasurer gets the notification "December 2026 isn't billed yet. Open Collections to generate it."
    And the reminder is sent once per period

  Scenario: A household added after the period was billed
    Given December 2026 is billed
    When the admin adds Blk 8 Lot 2 on Dec 10, 2026
    Then no bill is created for Blk 8 Lot 2
    And the billing card shows "1 household added since December 2026 was billed: Blk 8 Lot 2" with "Bill for December 2026" and "Don't bill"
    When Carmela presses "Bill for December 2026" and confirms "Bill Blk 8 Lot 2 ₱1,800.00 for December 2026, due Dec 31, 2026?"
    Then Blk 8 Lot 2 has one December 2026 bill
    And pressing it again does not create a second one
    And the activity log records "Carmela Cruz (Treasurer) billed Blk 8 Lot 2 for December 2026"

  Scenario: Choosing not to bill a late addition
    Given Blk 8 Lot 2 is listed as added since December 2026 was billed
    When Carmela presses "Don't bill" and confirms
    Then Blk 8 Lot 2 leaves the list and has no December 2026 bill
    And it is billed with everyone from January 2027
    And the activity log records "Carmela Cruz (Treasurer) chose not to bill Blk 8 Lot 2 for December 2026"

  Scenario: A household reactivated later
    Given Blk 7 Lot 1 was deactivated in October 2026 and is reactivated on Dec 10, 2026, after December 2026 was billed
    Then it is listed under households added since December 2026 was billed
    And only December 2026 is offered, never October or November

  Scenario: A household added before the run is billed with everyone
    Given Blk 8 Lot 2 is added on Nov 20, 2026
    When the December 2026 run finishes
    Then Blk 8 Lot 2 has a December 2026 bill like every other active household

  Scenario: No households to bill
    Given there are no active households
    Then "Generate December 2026 billing" is disabled
    And the card reads "Add households in Homeowners before billing."

  Scenario: The rate isn't set
    Given monthly dues have never been saved
    Then "Generate December 2026 billing" is disabled
    And the card reads "Set the monthly dues in Settings before billing."

  Scenario: A production run before go-live is refused
    Given the production portal has not been marked as live by the office
    When anyone starts a billing run in production
    Then it is refused with "Billing isn't switched on for this portal yet. Ask the developer."
    And no bill is created

  Scenario: Only the treasurer can bill
    Given Paolo Aquino holds the admin office role
    When he opens Collections
    Then he does not see "Generate billing"
    And the billing function refuses a request from his account
    And Firestore refuses any bill written from any browser

  Scenario: The run is logged
    When the December 2026 run finishes
    Then the activity log records "Carmela Cruz (Treasurer) generated December 2026 billing: 623 bills, ₱1,121,400.00"

Feature: Opening balances

  Scenario: Load opening balances from a spreadsheet
    Given no period has been billed yet
    When Carmela uploads a spreadsheet with a lot, an amount and an optional "Months owed" on each row and presses "Check file"
    Then she sees "623 rows: 610 ready, 13 with problems" and each problem row with its reason
    And a row with a negative amount reads "Blk 6 Lot 4: credit of ₱1,200.00"
    And nothing is saved yet

  Scenario: Problem rows are explained
    Given the file has a row for "Blk 99 Lot 1", which isn't in the directory, and a row with amount "1,8OO"
    Then they show "Blk 99 Lot 1 isn't in the directory." and "Amount must be a number, like 5400.00"

  Scenario: Commit the opening balances
    When Carmela presses "Load 610 opening balances" and confirms
    Then each household with a positive amount shows one line "Balance before December 2026" with its amount
    And a positive amount counts as overdue from the "as of" date
    And a household with a negative amount shows "Credit before December 2026" with the amount, which pays its first bills
    And "Months owed", where given, is stored for the collection notices in R2
    And households not in the file start at ₱0.00

  Scenario: First billing without opening balances
    Given no period has been billed and no opening balances are loaded
    When Carmela presses "Start with everyone at ₱0.00"
    Then she sees "Start every household at ₱0.00? You won't be able to load opening balances afterwards."
    When she confirms
    Then "Load opening balances" is no longer shown
    And "Generate December 2026 billing" becomes available

  Scenario: Opening balances are loaded once
    Given opening balances are loaded, or any period has been billed
    Then "Load opening balances" is no longer shown
    And the server refuses a second load

  Scenario: Loading twice by double tap loads once
    When Carmela presses "Load 610 opening balances" twice quickly
    Then each household has exactly one opening balance line
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Bill: household, period `YYYY-MM`, `amountCentavos` (copied from the rate when the run started; never changed), `adjustedCentavos` (0; only REQ-046 changes it), due date `YYYY-MM-DD` (last day of the period, Asia/Manila), run id, kind (`dues` / `opening`), optional `monthsOwed` (opening only) | `bills/{period}_{householdId}`; opening balance above zero as `bills/opening_{householdId}`, with `period` the month before the first billed period and `dueDate` the "as of" date | Deterministic id, so a rerun or double tap skips existing bills. Never edited or deleted (CS-15). No client writes | Billing worker, `billHousehold`, `commitOpeningBalances` | Statement (REQ-009); treasurer and admin office |
| Credit before the portal (negative opening amount) | `bills/opening_{householdId}` with `kind: openingCredit` and a positive credit amount. Not a bill: the ledger adds it to the payment pool (REQ-009 decision 2, keep credit) | Same id rules | `commitOpeningBalances` | Same |
| Run record: period, rate snapshot, households to bill, `createdCount`, `cursor`, total, `status` (`running` / `completed`), `leaseUntil`, `heartbeatAt`, started by, started at, finished at | `billingRuns/{period}` | Created by `startBillingRun({period, expectedRateCentavos})`, treasurer only, in a transaction that refuses: a run that exists; a period that isn't the month after the last completed run (or `config/billing.firstPeriod`); today before the 1st (Asia/Manila); `config/payment.monthlyDuesCentavos != expectedRateCentavos`; a `-prod` project without `config/billing.goLive`. **"Stopped" is not stored:** the screen shows it when `status == running` and `heartbeatAt` is older than 5 minutes. `continueBillingRun({period})` takes the lease in a transaction, refusing if a live lease is held | `startBillingRun`, `continueBillingRun`, the task-queue worker (only writer while running) | Billing card (treasurer, board read-only) |
| Per-household billing | One transaction per household: read `bills/{period}_{hh}`; if absent, create it, raise `households.billedCentavos` and `balanceCentavos`, set `households.billedThrough = period`, and write that household's notifications. **Totals rise exactly once per bill, even on a resume.** No batched writes without the existence check | — | Task-queue worker, pages of 100 households from `cursor` | — |
| Household totals: `billedCentavos`, `paidCentavos`, `balanceCentavos`, `pendingCentavos` | `households/{id}` (SA-001 §4.4 item 1) | Updated in the same transaction as each bill. **No stored overdue count** (conflict C4: worked out when read) | Functions | Statement, directory |
| Billed-through marker | `households/{id}.billedThrough` (`YYYY-MM`, or `""` if never billed) | Written only by the billing functions. "Don't bill" sets it to the period | Billing worker, `billHousehold`, `skipLateBill` | Late additions query |
| Monthly totals: billed | `monthlyTotals/{period}.billedCentavos` | **Set** (not incremented) from a `sum()` over the period's bills when the run finishes, so it is idempotent | Billing worker | Reports (R2) |
| Late additions | Query `active == true && billedThrough < latestPeriod` (index `active, billedThrough`) | Only the latest billed period is offered (no back-billing) | — | Billing card |
| First period | `config/billing` `{firstPeriod, openingClosed, goLive}` | Set by committing opening balances or by "Start with everyone at ₱0.00"; either closes the opening-balance load | `commitOpeningBalances`, `startAtZero` | Billing card |
| Opening balance import: file check results | `importRuns/{id}` (REQ-003 pattern: preview, then commit) | Staff only; deleted after 30 days. Commit refused once any run exists | `previewOpeningBalances`, `commitOpeningBalances` | Treasurer |
| Notifications | `notifications` (REQ-011), ids `stmt_{period}_{householdId}_{uid}` and `billrem_{period}_{uid}` | One per linked person per billed household; one reminder per treasurer per period, by construction | Billing worker; a separate reminder `onSchedule` at `0 9 1 * *`, `timeZone: Asia/Manila` | Those people |
| Change records | `auditLog` (shared helper, REQ-006) | `billing.run`, `billing.lateBill`, `billing.skip`, `billing.opening`, `billing.startAtZero` (counts and totals) | Functions | Treasurer, board, admin office |

**Cross-REQ impact on approved S1 work:** REQ-003's `createHousehold` and `commitHouseholdImport` must set `billedThrough: ""` on every household, because Firestore range filters skip documents that lack the field. Add to the S1 test plan (TC-03).

**Observability:** alert on a run that is `running` with a heartbeat older than 10 minutes, and on a period not billed by the 5th. Time-zone tests at 23:59 and 00:00 Manila, on a server clock in UTC (R-15).

## UX/UI notes

- **Accessibility:** progress is text ("410 of 623"), announced politely, not only a bar; the disabled button has its reason as visible text next to it; the preview dialog's numbers are text, not an image.
- **Consistency:** "Billing run" in documents; on screen "Generate {period} billing", as in the mock-up. Period written "December 2026", due date "Dec 31, 2026", money "₱1,121,400.00". The preview uses the one confirm dialog.
- **Mobile-first:** the card works at 375 px (the treasurer may run it from a phone): the button is full-width; the late-additions list is one row per lot with its two buttons.
- **States:** before first run ("Load opening balances, then generate your first billing." with "Start with everyone at ₱0.00"); ready; too early (disabled with date); running (progress); stopped (Continue); completed (result line); no households or no rate (disabled with reason); error ("We couldn't start billing. Nothing was created. Try again.").
- **Safe actions:** "Generate billing", "Continue billing", "Bill for {period}", "Don't bill", "Start with everyone at ₱0.00" and "Load opening balances" are disabled while in flight, and the server refuses repeats (deterministic ids plus the run record and its lease). The preview states the count, rate and total before anything is created, and is refused if the rate changed since it opened. A bill is never undone; a wrong one is corrected afterwards with an adjustment line (REQ-046), which the preview says.
- **Stable layout:** the progress line replaces the button in the same space.
- **Roles:** treasurer runs; board sees the card read-only with the last result; admin office doesn't see Collections in R1.

## Copy of record

| Where | Text |
|---|---|
| Card heading | Monthly billing |
| Card sub-line | Last billed: {period} · Rate {amount} per household · {n} active households |
| Button | Generate {period} billing |
| Too early | Available from {date} |
| Preview dialog | Generate {period} billing? This creates {n} bills of {amount} each, a total of {total}, due {due date}. {m} deactivated households are not billed. Check the figures: a wrong bill can only be corrected afterwards, with a reason, one household or one period at a time. · Generate billing (in flight: Saving…) · Cancel |
| Stale rate | The monthly dues changed since you opened this preview. Check the new figures. |
| Not live (production) | Billing isn't switched on for this portal yet. Ask the developer. |
| Progress | Billing {period}… {x} of {n} |
| Done | {period} billed: {n} bills, {total}. Done {date} at {time} by {name}. |
| Stopped | {period} billing stopped at {x} of {n}. Press Continue to finish it. Bills already created won't be made again. · Continue billing |
| Already running / done | {period} is already being billed. · {period} is already billed. |
| Start error | We couldn't start billing. Nothing was created. Try again. |
| No households | Add households in Homeowners before billing. |
| No rate | Set the monthly dues in Settings before billing. |
| Late additions | {n} household(s) added since {period} was billed: {lots} · Bill for {period} · Don't bill |
| Late bill confirm | Bill {lot} {amount} for {period}, due {due date}? |
| Don't bill confirm | Don't bill {lot} for {period}? It will be billed with everyone from {next period}. |
| Start at zero | Start with everyone at ₱0.00 · Start every household at ₱0.00? You won't be able to load opening balances afterwards. |
| Statement ready notification | Your {period} statement is ready: {amount} due {due date}. |
| Reminder notification | {period} isn't billed yet. Open Collections to generate it. |
| Opening balances card | Opening balances · Load what each household owed before the portal, once, before the first billing. · Upload spreadsheet · Check file |
| Check result | {n} rows: {r} ready, {p} with problems |
| Row problems | {lot} isn't in the directory. · Amount must be a number, like 5400.00 · {lot} appears twice in the file. · Months owed must be a whole number. |
| Credit row (check result) | {lot}: credit of {amount} |
| Commit button | Load {r} opening balances (in flight: Loading…) |
| Statement line | Balance before {first period} · Credit before {first period} |
| Board note | View only. Board members can't change records. |

## Out of scope

- Correcting or cancelling a bill: [REQ-046](REQ-046-adjust-or-cancel-a-bill.md) (decision 5, in S2).
- Late penalties, interest and grace periods (D2).
- Emailing statements (story 19, R2).
- Month-by-month history from before the portal; the opening balance is one line.
- Different rates by lot, and one-off charges.
- Billing a deactivated household, or back-billing more than the latest period for a late addition.

## Open questions

| Question | Who decides |
|---|---|
| Does a household added mid-month owe the full month? (Recommended: full month or nothing, the treasurer's choice; no pro-rating) | HOA board |
| What date are opening balances "as of", and which period is billed first (`config/billing.firstPeriod`)? | Treasurer |
| Will the office fill the optional "Months owed" column? (Stored now; R2 collection notices use it) | Treasurer |
| Who keeps the current records of what each household owes, and in what format? | Admin office and treasurer |

## Sol Arch review

Questions for Sol Arch (from the BA, r1):

1. Confirm the run record and deterministic ids make double-press, two devices and a resumed run safe, and that totals are updated exactly once per bill on a resume.
2. Opening balance as a `bills` document with kind `opening` (so the statement and aging treat it like any bill) versus a separate field.
3. Notification fan-out: about 623–1,200 notification writes per run. Acceptable, given SA-001 §4.4 item 8 avoids fan-out for announcements?
4. The reminder needs a small daily scheduled job on the 1st; is that within the same `onSchedule` function as Option B?

**BA size estimate (Sol Arch to confirm):** M. Billing run about 3 person-days with Claude Code; opening balances +1.5–2 days (reuses REQ-003's import pattern). Bill correction (decision 5), if added: M, sized separately.

### Sol Arch findings (2026-11-28, draft)

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 Flow 4, §3, §4.2 (`bills`, `billingRuns`, `monthlyTotals`, household totals), §4.4 item 1, R-8, R-11 and R-15; approved REQ-003 (import pattern, `createHousehold`); RELEASE-PLAN conflicts C1 and C4. Baselines: `docs/sa-001-architecture` at `e28d9bc`, `docs/req-005-045` (uncommitted).

**Verdict: Supports Option A (D8 = manual in R1), with changes.** Deterministic bill ids plus a run record make double presses and two devices safe, as the BA expects. Four design gaps remain:

1. "Stopped" is a status nobody writes when a function crashes.
2. Totals must be raised in the same transaction as each bill, or a resumed run counts some bills twice.
3. "Late additions" needs a field to query on.
4. Negative opening balances don't fit as bills.

Separately, **deterministic ids mean a wrong bill can never be "re-run"**. This is why the correction story is needed, and why it must be built as adjustments (see the view at the end).

#### Options

| Option | Feasible? | Cost (BA) | Sol Arch |
|---|---|---|---|
| A: treasurer runs it with a preview and a reminder | Yes | Moderate | **Agree** for R1, while no correction exists |
| B: automatic on the 1st | Yes | +0.5 day | Agree. The same worker on a schedule; switching later is a setting |
| C: both | Yes | Most | Agree with the downside |

#### Answers to the BA's questions

1. **Double press, two devices, resume: safe, with this design.**
   - **Start:** callable `startBillingRun({period, expectedRateCentavos})`, treasurer only. In one transaction it:
     - refuses if `billingRuns/{period}` exists;
     - refuses if `period` isn't exactly the month after the last completed run (or the first period, below);
     - refuses if today (Asia/Manila, `shared/domain/dates.js`) is before the 1st;
     - refuses if `config/payment.monthlyDuesCentavos != expectedRateCentavos` (the preview went stale);
     - otherwise creates the run with the rate snapshot, `status: running`, `leaseUntil` and `cursor: null`.

     It then enqueues a **task-queue worker**. Scheduled and task-queue functions may run for up to 30 minutes, callables up to 60 ([manage functions](https://firebase.google.com/docs/functions/manage-functions)). 623 households take a few minutes.
   - **Worker:** reads active households in pages of 100, ordered by id from `cursor`. For **each household, one transaction** reads `bills/{period}_{hh}`, then:
     - if the bill exists, it skips the household;
     - otherwise it creates the bill, raises `households.billedCentavos` / `balanceCentavos`, sets `households.billedThrough = period`, and writes that household's notifications (deterministic ids, below).

     **Totals therefore rise exactly once per bill, even on a resume,** because the bill's existence and the increment are one atomic step. After each page, the worker (the only writer to the run) updates `createdCount`, `cursor` and `heartbeatAt`. A batched write without the existence check would double-count on a resume; don't use one.
   - **Finish:** `monthlyTotals/{period}.billedCentavos` is **set** (not incremented) from a `sum()` aggregation over the period's bills, so it is idempotent. Then come `status: completed`, `auditLog`, and the "Done" line.
   - **"Stopped" is derived, not stored.** A crashed worker writes nothing, so the screen shows "stopped" when `status == running` and `heartbeatAt` is older than 5 minutes. `continueBillingRun({period})` takes the lease in a transaction (refusing if another worker holds a live lease) and re-enqueues from `cursor`. It is the same principle as "expired" invites (REQ-004 review).
2. **Opening balance as a bill: yes for amounts above zero; no for credit.**
   - `bills/opening_{householdId}`, `kind: opening`. `period` is the month before the first billed period, so ordering by `period` works (a literal "opening" would sort wrongly). `dueDate` is the "as of" date, so it is overdue at once, as decision 3 says. It also carries an optional `monthsOwed` for R2 aging.
   - **A negative opening amount is not a bill.** A "bill" of −₱1,200.00 breaks the oldest-first allocation and the status words. Store it as `kind: openingCredit`, which the ledger adds to the payment pool, shown as "Credit before {first period}". This depends on REQ-009 decision 2 (SA-001 Q12, keep credit). If the owner refuses credit, refuse negative rows in the import.
   - Commit is a callable in the REQ-003 pattern: preview, then commit, with `importRuns/{id}` and an idempotent `opening_{hh}` id. It is refused once any run exists.
3. **Fan-out: acceptable.** That is about 623–1,250 notification writes a month, against a free allowance of 20K writes a day (SA-001 §7). Announcements avoid fan-out because they would multiply per post, and the reads array risks the 1 MiB limit. A monthly per-person statement doesn't. **Notification ids must be deterministic** (`stmt_{period}_{householdId}_{uid}`), or a resumed page creates duplicates.
4. **Reminder: a separate tiny `onSchedule`** at `0 9 1 * *`, `timeZone: Asia/Manila`. If `billingRuns/{period}` doesn't exist, it notifies each treasurer with id `billrem_{period}_{uid}` (sent once by construction). Option B would be a second schedule at 00:10 calling the same start logic. Keep them as two small functions, not one with branches (S3776).

#### Required changes (for the BA to apply)

> **BA note (r3):** all eight are applied above: 1 and 2 in Data changes, with the S1 cross-REQ impact on REQ-003 called out; 3 as "First billing without opening balances" and the first-period open question; 4 as "The rate changed after the preview opened"; 5 in the interrupted-run scenario; 6 in the opening-balance scenarios and copy ("{lot}: credit of {amount}", reworded from Sol Arch's draft copy for plain English); 7 using the bulk wording, because the owner approved REQ-046 with bulk by period; 8 as the deactivation and reactivation scenarios. Answers 1–4 (start/continue callables, lease, worker, deterministic notifications, reminder schedule) and the production guard are in Data changes. None conflicts with an approved decision.

1. **Data changes: add `households.billedThrough`** (`YYYY-MM`, or `""` for never billed), written only by the billing functions. "Late additions" becomes the query `active == true && billedThrough < latestPeriod` (index `active, billedThrough`). **"Don't bill" sets `billedThrough = period`** with audit `billing.skip`. Drop `billingRuns.skipped[]`. **Cross-REQ impact:** REQ-003's `createHousehold` and `commitHouseholdImport` (approved) must set `billedThrough: ""`, because Firestore range filters skip documents that lack the field. List this for the BA and the S1 test plan (TC-03).
2. **Remove "overdue count" from the household totals this REQ writes.** It goes stale with the calendar, not with writes. This is conflict C4; I support the rule "worked out when read". Totals stored: `billedCentavos`, `paidCentavos`, `balanceCentavos`, `pendingCentavos` (REQ-010).
3. **Add scenario "First billing without opening balances".** The card says "Load opening balances, then generate your first billing", but some HOAs have none to load. Add a choice "Start with everyone at ₱0.00", with a confirm. It sets `config/billing.firstPeriod` and closes the opening-balance load, exactly as committing a load would. Also add "Choose the first period to bill" (open question, treasurer).
4. **Add scenario "The rate changed after the preview opened".** The run is refused with "The monthly dues changed since you opened this preview. Check the new figures." Nothing is created.
5. **Scenario "An interrupted run…":** reword the Given as "Given the December 2026 run has made no progress for 5 minutes after 410 of 623 bills". Add "And two treasurers pressing Continue at once start one worker".
6. **Scenario "Opening balances":** amounts below zero follow answer 2. Add "{lot} owes credit of {amount}" to the preview. Add an optional "Months owed" column (stored; R2 aging needs it, per the BA's own open question).
7. **Copy:** "Bills can't be changed after they're created" is true only until the correction story ships. If the owner adds it, change it to "Check the figures: a wrong bill can only be corrected one household at a time, with a reason." (or to the bulk form, if bulk is built).
8. **A household deactivated during a run** may or may not be billed, depending on whether its page was read before the change. Say so under the scenario. A household reactivated later appears under late additions for the latest period only (no back-billing; already out of scope).

#### Risks not covered

- **A wrong rate across 623 households with no correction.** See the view below. While no correction exists, the preview and the stale-rate refusal are the only guards.
- **Stale references:** the preview's rate (change 4) and the household list (change 8). Both covered.
- **Deletes:** a bill is never deleted (CS-15). It is referenced by allocation, aging, notices (R2) and `monthlyTotals`.
- **Existing data:** opening balances (answer 2). Which office records they come from is the BA's open question. Without it, R1 can't go live with real balances.
- **Identity keys:** `{period}_{householdId}` is unique by construction, and so is `opening_{householdId}`.
- **Time zone (R-15):** "Available from Dec 1" and the due date are computed in Asia/Manila. Tests at 23:59 / 00:00 Manila, and on a server clock in UTC.
- **Multiple environments:** staging runs bill fake households only. The worker refuses to start if the project id ends in `-prod` and `config/billing.goLive` isn't set. That prevents a test run against production before the office has checked the opening balances.
- **Scale and cost:** about 623 transactions (about 3 reads and 3–4 writes each) plus up to 1,250 notifications: about 2K reads and 3.5K writes a month. At 10× households it is still within one 30-minute task.
- **Observability:** SA-001 §8.3's alert ("not completed by 02:00") suits Option B. For Option A, alert on "running with a heartbeat older than 10 minutes" and "period not billed by the 5th".

#### Size

**L, 5–6 person-days with Claude Code (BA: about 4.5–5).** That is: start/continue callables with the lease and the stale-rate check (1); the worker with per-household transactions, deterministic notifications, the resume test and a concurrency test of 10 parallel starts (1.5); late additions and skip (0.5); the reminder job (0.25); opening-balance preview and commit with credit rows and months owed (1.5); card states and Playwright (0.75–1.25).

#### View on the BA's proposed gap: "Correct or cancel a bill" (for S2)

> **BA note (r4):** the owner approved this on 2026-11-28 (decision 5). It is [REQ-046 Adjust or cancel a bill](REQ-046-adjust-or-cancel-a-bill.md), in S2, with the bulk correction by period.

**Recommendation: add it to R1 as a new REQ (next free number), size M, 2.5–3.5 person-days. Ship it before the first production billing run, so in S2 or at the latest S3.** Without it, the only fix for a wrong bill is a developer editing the database by hand. That bypasses the audit log (REQ-006), and the owner has already been told no one can edit records.

**Design constraints I would hold it to:**

- **A bill is never edited or deleted, and never re-created.** Its id `{period}_{householdId}` is deterministic, so a cancelled bill would block re-billing the period anyway. A correction is an **adjustment line**: `billAdjustments/{id}` with `billId`, `householdId`, `amountCentavos` (negative reduces; "cancel" is minus the bill's full amount), a reason code plus a note, `by`, `at`, and **the month in which it is made**. That matches conflict C1's rule for voids (a minus line in the month it is made; closed months untouched), so REQ-023/024 treat corrections and voids alike.
- **Callable `adjustBill({billId, amountCentavos, reason, seenUpdatedAt})`**, treasurer only, with two guards (CS-5). In one transaction it:
  - refuses if the bill changed since the screen loaded;
  - refuses if the adjustment takes the bill below ₱0.00;
  - adds to `bills.adjustedCentavos` (the original `amountCentavos` stays);
  - updates the household totals;
  - writes `auditLog` `bill.adjusted`.

  The ledger uses `amount + adjusted`. If the bill was already paid, the reduction becomes credit automatically, under REQ-009 decision 2.
- **Bulk "correct every {period} bill by {amount}"** is the case that matters most: a wrong rate billed to every household. It reuses the billing worker (its own run record, per-household transactions, a deterministic adjustment id `adj_{period}_{runNo}_{hh}`). It adds about 1 day. I recommend including it; otherwise the treasurer makes 623 single corrections.
- **Homeowner side:** the statement shows "Corrected: −₱200.00 ({reason})", and each linked person gets a notification. Free-text notes are staff-only; homeowners see the reason code's wording.
