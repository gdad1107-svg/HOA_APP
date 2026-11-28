# TC-08: Monthly billing run and opening balances (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: Collections → "Monthly billing" card (treasurer runs the period with a preview; progress, stopped and done states; resume), per-household bills with deterministic ids, late additions (bill or don't bill), a reminder on the 1st, "statement ready" notifications, the production go-live guard; one-time opening balances (check a file, commit, or start everyone at ₱0.00) |
| Source | [REQ-008 Monthly billing run and opening balances](../requirements/REQ-008-monthly-billing-run.md), **Approved** 2026-11-28 (r4, "Approve all as shown"): D8 = manual run in R1 (decision 1), from the 1st Manila (2), opening balances loaded (3), treasurer decides late additions (4), corrections as REQ-046 (5), no penalties in R1 (6). Sol Arch's changes applied in r3 |
| Depends on / precedent | [REQ-003 Household directory](../requirements/REQ-003-household-directory.md) (active / deactivated, `createHousehold`, import pattern, balance "—" until the first run; **must now set `billedThrough: ""`**), [REQ-007 Dues and payment settings](../requirements/REQ-007-dues-and-payment-settings.md) (rate in `config/payment`; stale-preview refusal, TC-07), [REQ-006 Activity log](../requirements/REQ-006-activity-log.md) (`billing.*`), [REQ-011 Notifications](../requirements/REQ-011-in-app-notifications.md), [REQ-009 Statement](../requirements/REQ-009-statement-of-account.md) (reads bills, opening line, credit), [REQ-004](../requirements/REQ-004-invite-and-link.md) (who is linked, for notifications), [REQ-002](../requirements/REQ-002-roles-and-permissions.md) (treasurer only; board read-only). **[REQ-046 Adjust or cancel a bill](../requirements/REQ-046-adjust-or-cancel-a-bill.md) is a draft and is not planned here**; see "REQ-046 plug-in points" |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (**Open**: no viewport meta; the treasurer may run billing from a phone, see TC-08-Q1). No defect is open in this area. The mock-up's own billing (`genBilling`, `index.html` line 1387) bills every homeowner including inactive ones, can be pressed twice and toasts "billing created for {n} households"; none of that may survive (L-002) |
| App version | **Anticipated.** No application code exists; `main` at `9ace525`. Approved UX: screens 8A–8C of [req-005-011-mockup.html](../mockups/req-005-011-mockup.html). Screen 8D is Option B (automatic billing), not approved, not planned |
| Source files / functions touched (anticipated) | Callables `startBillingRun({period, expectedRateCentavos})`, `continueBillingRun({period})`, `billHousehold`, `skipLateBill`, `previewOpeningBalances`, `commitOpeningBalances`, `startAtZero`; the task-queue billing worker (pages of 100, one transaction per household); the reminder `onSchedule` at `0 9 1 * *` `Asia/Manila`; collections `bills/{period}_{householdId}`, `bills/opening_{householdId}`, `billingRuns/{period}`, `households/{id}` totals and `billedThrough`, `monthlyTotals/{period}`, `config/billing {firstPeriod, openingClosed, goLive}`, `importRuns/{id}`, `notifications` (ids `stmt_{period}_{householdId}_{uid}`, `billrem_{period}_{uid}`), `auditLog`; index `households (active, billedThrough)`; `shared/domain/dates.js` (Asia/Manila periods and due dates), `money.js`; REQ-003's `createHousehold` and `commitHouseholdImport` (new default field) |
| Architecture | SA-001 r3 **Final** Flow 4 (`billingRun`, deterministic `bills/{period}_{hh}`), §3, §4.4 item 1 (totals kept by functions), §7 (700-household seed), §8.3 (observability), R-8, R-15 (time zone). The callables, lease and heartbeat, `billedThrough`, `config/billing`, opening-credit kind and notification ids come from **Sol Arch's REQ-008 review**, not yet folded into SA-001; cases that assert them are tagged **Provisional — design** |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions with task queues and scheduler) or `hoa-portal-staging` only. Never production.** The production guard cases (L-block) use an emulator project id ending in `-prod`; they never touch a real project. All households are invented fixtures. Both brands |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. Layers are left for QE (`TBD — QE`). Cases tagged Gap G-n wait for the BA's answer; cases tagged Blocked wait for the named decision |

**Tags used on cases**

- **Provisional — design**: asserts a callable, field, id shape or lease rule from Sol Arch's REQ-008 review, not yet in SA-001 Final.
- **Gap G-n**: expected result depends on a requirement gap. **Blocked — treasurer**: depends on an open treasurer question (opening "as of" date, first period). **Blocked — REQ-046**: depends on the draft correction story.
- **Staging note**: controllable server clock (server in UTC), task-queue control (pause or kill the worker), two sessions at once, admin SDK access, a 700-household seed.

**One behaviour per case.** A run case checks one stored outcome (bills, totals, run record, notifications, audit) or one screen state. Screen cases don't re-prove counts; data cases name no screen wording.

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Treasurer** (`treasurer`) | Opens Collections → Monthly billing; previews and generates; continues a stopped run; bills or skips late additions; loads opening balances or starts at ₱0.00. Gets the reminder on the 1st |
| **Board** (`board`) | Sees the billing card read-only with the last result and "View only. Board members can't change records." Reads the activity log |
| **Admin office** (`admin`) | Doesn't see Collections in R1. Adds, deactivates and reactivates households (REQ-003), which feeds late additions. Reads bills through a household's statement |
| **Homeowner** (linked member) | Gets "Your {period} statement is ready…"; reads the new bill and balance on Dues & Payments (REQ-009) |
| **Guard** | No access |
| **System** | Billing worker (task queue), reminder schedule |

### Test fixtures (invented; QE maps them to `.env`)

| Fixture set | Contents |
|---|---|
| **HH-623** | 623 active households "ZZ Bill Household 001 … 623" (Blk 60–89), plus 2 deactivated "ZZ Bill Inactive 1, 2". Linked people: 400 households with 1 person, 50 with 2 people, 173 with nobody |
| **HH-5-1** | Blk 5 Lot 1, inside HH-623, linked U-CARLO |
| **HH-4-12** | Blk 4 Lot 12, inside HH-623, linked U-JUAN and U-SPOUSE (two people) |
| **HH-8-2** | Blk 8 Lot 2: added at a set time per case (late addition) |
| **HH-7-1** | Blk 7 Lot 1: deactivated in October 2026, reactivated per case |
| **HH-6-4** | Blk 6 Lot 4: opening credit ₱1,200.00 |
| **HH-3-9** | Blk 3 Lot 9: opening balance ₱9,000.00, months owed 5 |
| **HH-C** | Blk 2 Lot 10, linked S-TREAS-HO (treasurer who is a homeowner) |
| **BILL-1 / BILL-100 / BILL-101 / BILL-0** | Separate emulator projects with 1, 100, 101 and 0 active households (page-edge cases) |
| **SEED-700** | 700 households and 12 months of history (SA-001 §7 load seed) |
| **OB-623.csv** | Opening-balance file: 623 rows; 610 ready; 13 problems including "Blk 99 Lot 1" (not in the directory), amount "1,8OO", one lot listed twice, months owed "2.5"; Blk 6 Lot 4 at −1200.00; Blk 3 Lot 9 at 9000.00 with months owed 5 |

| Account | Who |
|---|---|
| S-TREAS | ZZ Carmela Cruz, `treasurer` |
| S-TREAS-2 | ZZ Second Treasurer, `treasurer` |
| S-TREAS-HO | ZZ Treasurer Homeowner, `treasurer` and member of HH-C |
| S-ADMIN | ZZ Paolo Aquino, `admin` |
| S-BOARD | ZZ Board D1, `board` |
| S-GUARD | ZZ Guard G1 |
| S-EXTREAS | ZZ Removed Treasurer (role removed, ID token still valid, L-004) |
| U-CARLO, U-JUAN, U-SPOUSE, U-MARIA | Homeowners; U-MARIA is in a household outside HH-5-1 and HH-4-12 |

Rate ₱1,800.00 unless a case says otherwise. "Today" is built from **local Manila today** with a controllable server clock running in UTC (R-15); the dates in cases (Dec 1, 2026 = Nov 30, 2026 16:00 UTC) show the arithmetic. Fixture names carry the ZZ prefix; no real homeowner, lot or balance is used.

### Round-trip register

Treasurer runs → worker writes → homeowners, staff and reports read. One row per field or status value.

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | Bill `amountCentavos` (rate snapshot) | Worker / `billHousehold`, from the run's snapshot | Homeowner statement "billed ₱1,800.00" (REQ-009); preview and done line (treasurer); "statement ready" notification amount | B7, H1, N2 |
| 2 | Bill `dueDate` (last day, Asia/Manila) | Worker | Statement due date; notification "due Dec 31, 2026"; preview "due Dec 31, 2026"; overdue from the next day (REQ-009) | B4, C6, C7, H1 |
| 3 | Bill `period` | Worker | Statement period "December 2026"; card "Last billed: December 2026" | B7, A2 |
| 4 | Bill `adjustedCentavos` (0) | Worker; only REQ-046 changes it | Statement "Corrected: …" (REQ-009, REQ-046). In this TC always 0, **deliberately not shown** | B8 |
| 5 | Bill `kind` (`dues` / `opening`), `runId` | Worker, `commitOpeningBalances` | `opening`: statement line "Balance before {first period}". `runId`: **deliberately not shown**; data check | J8, S4 |
| 6 | Bill `monthsOwed` (opening only) | `commitOpeningBalances` | **Deliberately not shown in R1**; R2 collection notices (story 20) read it. Data check here | J11 |
| 7 | `openingCredit` record (positive credit amount) | `commitOpeningBalances` | Statement "Credit before {first period} · ₱1,200.00", applied to the first bills (REQ-009) | J10 |
| 8 | `billingRuns/{period}` `status`, `createdCount`, `heartbeatAt`, `leaseUntil`, `cursor` | `startBillingRun`, worker, `continueBillingRun` | Card: "Billing {period}… {x} of {n}"; "stopped at {x} of {n}" (derived from `heartbeatAt`); done line (treasurer; board read-only). `cursor`, `leaseUntil`: **deliberately not shown** | D1, F1, A7, A10 |
| 9 | Run `startedBy`, `finishedAt`, total | Worker | Done line "Done Dec 1, 2026 at 9:05 AM by Carmela Cruz" (treasurer, board) | D2 |
| 10 | `households.billedCentavos`, `balanceCentavos` | Worker, `billHousehold`, `commitOpeningBalances` (Gap G-8) | Directory balance (REQ-003, shows "—" before the first run); statement summary (REQ-009) | D3, N1, N6 |
| 11 | `households.billedThrough` | Worker, `billHousehold`, `skipLateBill`; `""` from `createHousehold` and import | Late-additions list on the card (treasurer). **Deliberately not shown** as a value | D4, I8, S1 |
| 12 | `monthlyTotals/{period}.billedCentavos` | Worker at finish (set from `sum()`) | Reports (R2, story 23/24). In R1 **not shown**; data check reconciles it | D5, S6 |
| 13 | `config/billing.firstPeriod`, `openingClosed` | `commitOpeningBalances`, `startAtZero` | Card: "Load opening balances" hidden; first "Generate {firstPeriod} billing" offered; opening lines named "before {first period}" | J13, J16, C11 |
| 14 | `config/billing.goLive` | Developer / office, outside the app (Gap G-13) | `startBillingRun` refusal "Billing isn't switched on for this portal yet. Ask the developer." (treasurer) | L1, L2 |
| 15 | `importRuns/{id}` check results | `previewOpeningBalances` | Check result "623 rows: 610 ready, 13 with problems" and the problem rows (treasurer) | J1, J4 |
| 16 | `notifications` `stmt_{period}_{hh}_{uid}` | Worker, per linked person | Bell of each linked person (homeowner), opens Dues & Payments | H1, H5, P7 |
| 17 | `notifications` `billrem_{period}_{uid}` | Reminder schedule | Bell of each treasurer, opens Collections | H9, P7 |
| 18 | `auditLog` `billing.run`, `billing.lateBill`, `billing.skip`, `billing.opening`, `billing.startAtZero` | The functions | Activity log (treasurer, board, admin office; TC-06-A17–A19) | M-block |

No read-back cell is empty.

### Status enumerations

**Table 1: run record × action** (rule: `startBillingRun` refuses "a run that exists; a period that isn't the month after the last completed run; today before the 1st; a stale rate; `-prod` without `goLive`"; `continueBillingRun` refuses "if a live lease is held")

| Prior state of `billingRuns/{period}` ↓ / action → | Generate (start) this period | Generate the next period | Continue billing | Card shows |
|---|---|---|---|---|
| **Doesn't exist**, period = month after last completed, on/after the 1st | Created, worker starts (B6) | **Refused**: not the next period (C4) | **Refused** (E8) | Ready (A2) |
| **Doesn't exist**, before the 1st | **Refused** "Available from…" (C1, C2, C3) | **Refused** (C4) | **Refused** | Too early (C1) |
| **running**, heartbeat fresh | **Refused** "already being billed" (E2) | **Refused** (C9) | **Refused**: live lease (E7) | Progress (D1) |
| **running**, heartbeat older than 5 minutes ("stopped", derived) | **Refused** "already being billed" (E10) | **Refused** (C9) | Lease taken, resumes from cursor (F2) | Stopped (F1) |
| **running**, stale heartbeat, two Continues at once | n/a | n/a | One worker (E6) | Progress |
| **completed** | **Refused** "already billed" (E3) | Allowed on/after the next 1st (C10) | **Refused** (E8) | Done (A7) |

**Table 2: household × late-addition action** (query `active == true && billedThrough < latestPeriod`; only the latest billed period is offered)

| Household state at the time ↓ / event → | Run for period P | Shown in late additions for P? | "Bill for P" | "Don't bill" | Next run P+1 |
|---|---|---|---|---|---|
| Active, `billedThrough` = P−1 (normal) | Billed (B7) | No | n/a | n/a | Billed |
| Added before the run (`billedThrough` = "") | Billed (I12) | No | n/a | n/a | Billed |
| Added after P was billed (`""`) | n/a | **Yes** (I2) | One bill, `billedThrough` = P (I4) | No bill, `billedThrough` = P (I8) | Billed (I9) |
| Reactivated after P was billed, last billed P−3 | n/a | **Yes**, P only (I11) | One bill for P only (I11) | `billedThrough` = P | Billed |
| Deactivated and reactivated after P was billed, already billed P | n/a | **No** (I16) | **Refused** if called (I19) | n/a | Billed |
| Deactivated during the run | At most one bill (D12) | If reactivated without one: Yes | — | — | Not billed while inactive (S5) |
| Added during the run | **Gap G-2** (D11) | Gap G-2 | — | — | Billed |
| Still listed when P+1 is billed (no decision made) | n/a | **Gap G-3** (I14) | Gap G-3 | Gap G-3 | Billed for P+1 |
| Lacking the `billedThrough` field (old shape) | Billed | **Never** (range filter skips it): defect if any exist (S2) | — | — | — |

**Table 3: opening balances × state** (rule: "loaded once"; "refused once any run exists")

| State ↓ / action → | Check file | Load (commit) | Start with everyone at ₱0.00 | Generate first period |
|---|---|---|---|---|
| Nothing loaded, no run | Allowed (J1) | Allowed (J8) | Allowed (J15) | **Disabled**: "Load opening balances, then generate your first billing." (A1, Gap G-11) |
| Opening loaded | Not shown (J13) | **Refused** (J13) | Not shown / **Refused** (J27) | Allowed (J16) |
| Started at ₱0.00 | Not shown | **Refused** (J17) | **Refused** second time (J27) | Allowed (J16) |
| Any run exists | Not shown | **Refused** (J17) | **Refused** | n/a |

---

## Test plan

### 1. Smoke

The mock-up's Collections screen exists in smoke (SMK-admin-collections) but its contents change completely. **Smoke additions for QE:**

1. **Collections → "Monthly billing"** card opens for the treasurer with "Last billed: … · Rate … per household · {n} active households" and the generate button or its disabled reason; no page error.
2. **Opening balances** card appears before the first run ("Load opening balances, then generate your first billing." with "Start with everyone at ₱0.00").
3. The board sees the card read-only with "View only. Board members can't change records."; the admin office's menu has no Collections.

### 2. Acceptance

| REQ-008 scenario | Cases |
|---|---|
| Preview, then bill the next period | B1, D1, D2, B7, C10 |
| A period is never billed twice | E1, E2, E3, E4 |
| Too early to bill a period | C1, C2, C3 |
| The rate changed after the preview opened | B9, B10 |
| The run uses the rate at the moment it starts | G1, G2 |
| An interrupted run is finished, not repeated | F1, F2, F3, F4, E6 |
| Homeowners are told their statement is ready | H1, H2, H3 |
| A household deactivated during the run | D12 |
| Reminder when the period isn't billed | H9, H10, H11 |
| A household added after the period was billed | I1, I2, I3, I4, I5, I6 |
| Choosing not to bill a late addition | I7, I8, I9, I10 |
| A household reactivated later | I11 |
| A household added before the run is billed with everyone | I12 |
| No households to bill | A4 |
| The rate isn't set | A5 |
| A production run before go-live is refused | L1 |
| Only the treasurer can bill | K2, K3, K4 |
| The run is logged | M1 |
| Load opening balances from a spreadsheet | J1, J2, J3 |
| Problem rows are explained | J4, J5 |
| Commit the opening balances | J8, J9, J10, J11, J12 |
| First billing without opening balances | J15, J16 |
| Opening balances are loaded once | J13, J17 |
| Loading twice by double tap loads once | J14 |

No acceptance criterion is without a case.

### 3. Regression

- **REQ-003 cross-impact (approved S1 work).** `createHousehold` and `commitHouseholdImport` must now set `billedThrough: ""` (Sol Arch); Firestore range filters skip documents without the field, so a household created without it never appears in late additions. **TC-03 has no case for this**: S1 is added here and QE should add it to TC-03's regression. Re-run TC-03's add, import, deactivate and reactivate cases with the field checked.
- **Directory balance (REQ-003 / TC-03-K3)** shows "—" until the first run; after it, the stored `balanceCentavos`. Re-run TC-03-K3 and the phone-card balance after a run.
- **Settings (REQ-007 / TC-07)**: the card reads the rate from `config/payment`; a stale preview is refused (B9). TC-07-A3 and A6 depend on this card.
- **Statement (REQ-009)**: the first consumer of bills, opening lines and credit; "No bills yet" disappears after the first run.
- **Notifications (REQ-011)**: the run is the largest fan-out in R1 (up to about 1,250 per run). REQ-011's unread count, "only the newest 30" and "never duplicated by a retry" are hit here first.
- **Activity log (TC-06-A17–A19)** reads this TC's entries.
- **Invitations and members (REQ-004)**: who gets a notification depends on `members`; a person removed after a sale must get none for later periods.
- **Shared date module** (`shared/domain/dates.js`): periods, due dates and "Available from" are the first heavy users of Manila dates on the server; a bug shifts every due date by a day.
- **REQ-046 (draft)** will reuse the worker, the run-record pattern and the bill fields; see plug-in points.
- **Open defect DEF-001**: the card at 375 px.

**Existing specs and screens QE should re-run:** `smoke.spec.js` SMK-admin-collections, SMK-admin-homeowners, SMK-owner-dues; `navigation.spec.js` NAV-03, NAV-06, NAV-07 / NAV-08; TC-03 add, import, deactivate, reactivate and K3 (balance) cases; TC-04 removal cases (no notification after removal); TC-07 A3, A6.

**Not affected:** sign-in, privacy notice, invitations' own flows, bookings, vehicles, guard screens.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "a wrong bill can only be corrected afterwards" (needs REQ-046); "Bills already created won't be made again"; "2 deactivated households are not billed"; "It will be billed with everyone from January 2027" | R3, F3, B2, I9 |
| A value written for one role, never shown back | Yes: `monthsOwed`, `monthlyTotals`, `runId`, `billedThrough` | Register rows 5, 6, 11, 12 (deliberately not shown, data checks) |
| Status-gated rule checked for one transition only | Yes: start and continue against every run state; late additions against every household state | Tables 1–3 |
| Same concept, different word on another screen | Yes: "Monthly billing", "Generate {period} billing", "statement", period and money formats; mock-up toast | R1, R2 |
| Dates computed in UTC where the user means local | Yes, the core risk: "Available from", the server's 1st check, due dates, reminder time, done time | C-block, H13, D2 |
| A derived figure doesn't refresh after a related write | Yes: household totals, directory balance, card sub-line, late-additions list | D3, N1, A2, I8 |
| Zero and "not set" look the same | Yes: no rate vs ₱0; no households; opening ₱0.00 row vs no row; `billedThrough` "" vs missing | A4, A5, J18, S2 |
| A write silently refused by security rules | Yes: every client write to bills, runs, totals | K4, K5 |
| Double-tap / two devices create duplicates | Yes, the core risk: start, continue, late bill, skip, commit, start at zero | E-block, J14, J27 |
| Stale reference | Yes: stale rate; household added or deactivated during the run; late-addition decided by two treasurers | B9, D11, D12, I21 |
| Backdrop click loses work or leaves stale state | Yes: preview, late-bill and start-at-zero confirms; opening check result | B5, J28 |
| A modal appearing mid-flow blocks the next action | Yes: announcement pop-up during the run | P8 |
| Assumed SDK/network behaviour baked into a case | Yes: worker crash and task-queue retry; offline press | F6, Q10 (assumptions marked) |
| Data leaking across households or roles | Yes: bills of other households; board and admin access; notifications to the wrong household | K11, H5, H16 |

### Scenario list by mandatory type

- **Negative**: too early; wrong period; already running; already billed; stale rate; `-prod` without go-live; no rate; no households; admin, board, homeowner, guard and removed-treasurer requests; client writes to bills, runs, totals, `config/billing`; second opening load; commit after a run; bad file rows. C1–C4, E2–E8, B9, L1, A4, A5, K-block, J4–J7, J13, J17.
- **Boundary**: 23:59:59 vs 00:00:00 Manila on the 1st; year rollover; February 28 and leap-year 29; 30-day months; 0, 1, 100, 101 and 623 households; heartbeat 4:59 vs 5:01; reminder 8:59 vs 9:00; centavo rates; opening amount 0, negative, very large; months owed 0. C-block, D6, F1, H13, B11, J18.
- **Usability**: progress as announced text, disabled reasons visible, preview figures as text, full-width button at 375 px, late-additions rows, problem rows readable, in-flight labels, stable layout, focus in confirms. Q-block.
- **Navigation**: Collections for treasurer and board, refused for admin, homeowner and guard; reload and leave during a run; notification links to Collections and Dues & Payments; Cancel in each confirm; what's highlighted. P-block.

---

## A. Card states

#### TC-08-A1: Before the first run the card says "Load opening balances, then generate your first billing." with "Start with everyone at ₱0.00"
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-11
- **Setup:** HH-623, rate set, no run, nothing loaded.
- **Expected:** That line, the Opening balances card ("Upload spreadsheet", "Check file") and "Start with everyone at ₱0.00". Whether "Generate {period} billing" is shown disabled, hidden, or enabled before a choice is made: G-11 (J16 says it "becomes available" after starting at zero).
- **Don't assert:** the generate button until G-11.

#### TC-08-A2: The ready card shows last period, rate and active households
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Setup:** November 2026 billed; today Dec 1, 2026; HH-623.
- **Expected:** "Last billed: November 2026 · Rate ₱1,800.00 per household · 623 active households" and an enabled "Generate December 2026 billing".
- **Don't assert:** —

#### TC-08-A3: The active-household count excludes deactivated households
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Admin office deactivates. **Tags:** —
- **Action:** Deactivate one more household; reload the card.
- **Expected:** "622 active households".
- **Don't assert:** —

#### TC-08-A4: With no active households, generate is disabled with "Add households in Homeowners before billing."
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** — (BILL-0)
- **Expected:** Button disabled; that line visible as text next to it; a direct `startBillingRun` call refused or creates no bill (Gap G-12 for which).
- **Don't assert:** whether the call errors or completes with 0 bills.

#### TC-08-A5: With no rate saved, generate is disabled with "Set the monthly dues in Settings before billing."
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Setup:** No `config/payment` (TC-07 SET-NONE).
- **Expected:** Button disabled; that line; a direct `startBillingRun` call refused.
- **Don't assert:** —

#### TC-08-A6: While running, the progress line replaces the button
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: slowed worker
- **Expected:** "Billing December 2026… {x} of 623" in the button's place; no generate button.
- **Don't assert:** update frequency.

#### TC-08-A7: After the run the card shows the done line and the next period disabled with its date
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** "December 2026 billed: 623 bills, ₱1,121,400.00. Done Dec 1, 2026 at 9:05 AM by Carmela Cruz." and "Generate January 2027 billing" disabled with "Available from Jan 1, 2027".
- **Don't assert:** the time (taken from the run).

#### TC-08-A8: A start that fails says "We couldn't start billing. Nothing was created. Try again."
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: block the callable
- **Expected:** That line; no run record and no bill; button enabled again.
- **Don't assert:** —

#### TC-08-A9: Before any opening decision, the "Start with everyone at ₱0.00" choice is shown only once nothing is billed
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Present before the first run; absent afterwards.
- **Don't assert:** —

#### TC-08-A10: The board sees the card read-only with the last result
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** Gap G-1
- **Expected:** Last result line and "View only. Board members can't change records."; no generate, continue, late-addition or opening controls. How the board reaches Collections (R1 board menu is Dashboard only): G-1.
- **Don't assert:** navigation path until G-1.

## B. Preview and start

#### TC-08-B1: The preview states count, rate, total, due date and deactivated households
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** "Generate December 2026 billing".
- **Expected:** "Generate December 2026 billing? This creates 623 bills of ₱1,800.00 each, a total of ₱1,121,400.00, due Dec 31, 2026. 2 deactivated households are not billed. Check the figures: a wrong bill can only be corrected afterwards, with a reason, one household or one period at a time." with "Generate billing" and "Cancel".
- **Don't assert:** dialog layout.

#### TC-08-B2: No deactivated household gets a bill
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; data check. **Tags:** —
- **Expected:** After the run, "ZZ Bill Inactive 1" and "2" have no December 2026 bill.
- **Don't assert:** —

#### TC-08-B3: With 0 deactivated households the preview doesn't claim any
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-14
- **Setup:** No deactivated households.
- **Expected:** Count and total correct. Whether "0 deactivated households are not billed." is shown or the sentence dropped, and "1 deactivated household" singular: G-14.
- **Don't assert:** wording until G-14.

#### TC-08-B4: The due date is the last day of the period in Manila
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; data check. **Tags:** Provisional — design
- **Expected:** Every December 2026 bill has `dueDate` "2026-12-31".
- **Don't assert:** —

#### TC-08-B5: Cancel (or dismissing the preview) creates nothing
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** Cancel; reopen and dismiss by backdrop; reopen and press Escape.
- **Expected:** No `billingRuns/2026-12`, no bill; the card unchanged.
- **Don't assert:** whether backdrop closes it.

#### TC-08-B6: "Generate billing" creates the run with the rate snapshot
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — design
- **Expected:** `billingRuns/2026-12` with rate 180000, households to bill 623, `status` running then completed, `startedBy` S-TREAS.
- **Don't assert:** timings.

#### TC-08-B7: Each active household has exactly one December 2026 bill of ₱1,800.00 due Dec 31, 2026
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check after the run. **Tags:** Provisional — design
- **Expected:** 623 documents `bills/2026-12_{householdId}`, one per active household, each `amountCentavos` 180000, `kind` dues, `period` "2026-12", `dueDate` "2026-12-31", same `runId`.
- **Don't assert:** document order.

#### TC-08-B8: New bills carry `adjustedCentavos` 0
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** Provisional — design · Blocked — REQ-046 (only REQ-046 changes it)
- **Expected:** Every new bill has `adjustedCentavos: 0`.
- **Don't assert:** —

#### TC-08-B9: If the dues changed since the preview opened, "Generate billing" is refused and nothing is created
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; second treasurer changes the rate. **Tags:** Staging note: two sessions
- **Setup:** S-TREAS opens the December preview at ₱1,800.00; S-TREAS-2 saves ₱2,000.00 (TC-07).
- **Action:** S-TREAS presses "Generate billing".
- **Expected:** "The monthly dues changed since you opened this preview. Check the new figures."; no run record, no bill; the preview reloads showing ₱2,000.00 and the new total.
- **Don't assert:** reload mechanism.

#### TC-08-B10: `startBillingRun` with a stale expected rate is refused by the server
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct call. **Tags:** Provisional — design
- **Action:** Call with `expectedRateCentavos` 180000 while `config/payment` holds 200000.
- **Expected:** Refused; no run, no bill.
- **Don't assert:** —

#### TC-08-B11: A centavo rate is totalled exactly
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** Rate ₱1,850.50.
- **Expected:** Preview and done line total "₱1,152,861.50" (623 × 185050 centavos); each bill 185050.
- **Don't assert:** —

#### TC-08-B12: The preview total uses the same household count as the run
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-2
- **Action:** Open preview; admin adds a household; press "Generate billing".
- **Expected:** The run's households-to-bill and the preview agree, or the run is refused as stale like the rate (recommended). G-2.
- **Don't assert:** which until G-2.

## C. Periods and dates (Asia/Manila)

#### TC-08-C1: Before the 1st, generate is disabled with "Available from Dec 1, 2026"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: clock Nov 28, 2026
- **Setup:** November billed.
- **Expected:** "Generate December 2026 billing" disabled; "Available from Dec 1, 2026" as visible text.
- **Don't assert:** —

#### TC-08-C2: The server refuses a December run requested before Dec 1 Manila
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct call. **Tags:** Provisional — design
- **Expected:** Refused; no run.
- **Don't assert:** —

#### TC-08-C3: 23:59:59 on Nov 30 Manila is refused; 00:00:00 Dec 1 Manila is allowed, with the server clock in UTC
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct call. **Tags:** Staging note: controllable clock, server in UTC
- **Action:** Call at Nov 30, 2026 15:59:59 UTC; then at 16:00:00 UTC.
- **Expected:** First refused; second accepted.
- **Don't assert:** —

#### TC-08-C4: Only the month after the last completed run can be started
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct calls. **Tags:** Provisional — design
- **Setup:** November completed; today Dec 15.
- **Action:** Start "2026-11", "2027-01", "2026-10".
- **Expected:** All refused; only "2026-12" can start.
- **Don't assert:** —

#### TC-08-C5: A missed month is billed first, with its past due date
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-4
- **Setup:** October completed; November never run; today Dec 5.
- **Expected:** The card offers "Generate November 2026 billing" (not December); its bills are due Nov 30, 2026, already overdue. Whether the preview warns that the bills are already overdue: G-4.
- **Don't assert:** warning until G-4.

#### TC-08-C6: December rolls over to January 2027, due Jan 31, 2027
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: clock Jan 1, 2027
- **Expected:** "Generate January 2027 billing"; bills `period` "2027-01", `dueDate` "2027-01-31"; "Last billed: December 2026" before, "January 2027" after.
- **Don't assert:** —

#### TC-08-C7: February is due on the 28th, and on the 29th in a leap year
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: clock
- **Expected:** February 2027 due "Feb 28, 2027"; February 2028 due "Feb 29, 2028".
- **Don't assert:** —

#### TC-08-C8: A 30-day month is due on the 30th
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** April 2027 due "Apr 30, 2027"; never May 1.
- **Don't assert:** —

#### TC-08-C9: The next period can't start while the current run is running or stopped
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct call. **Tags:** Staging note: paused worker
- **Setup:** December running (or stopped); clock Jan 1, 2027.
- **Expected:** Starting "2027-01" refused; the card shows the December progress or stopped state, not a January button.
- **Don't assert:** —

#### TC-08-C10: After a completed run the next period opens on its 1st
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: clock Jan 1, 2027 00:00 Manila
- **Expected:** "Generate January 2027 billing" enabled at 00:00:00 Manila Jan 1 (Dec 31 16:00 UTC), disabled one second earlier.
- **Don't assert:** —

#### TC-08-C11: The first period is the one set by the opening-balance step
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Blocked — treasurer (which period is billed first) · Provisional — design
- **Setup:** `config/billing.firstPeriod` = "2026-12".
- **Expected:** The first offer is "Generate December 2026 billing"; starting any other first period is refused.
- **Don't assert:** how `firstPeriod` is chosen (open question).

#### TC-08-C12: The done time shows in Manila on a laptop in another zone
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, browser zone America/Los_Angeles. **Tags:** —
- **Expected:** "Done Dec 1, 2026 at 9:05 AM" (not Nov 30, 5:05 PM).
- **Don't assert:** —

## D. The run itself

#### TC-08-D1: Progress counts up from "0 of 623"
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: slowed worker
- **Expected:** "Billing December 2026… 0 of 623", then increasing values, never decreasing, never above 623.
- **Don't assert:** step size.

#### TC-08-D2: The done line names the period, count, total, date, time and treasurer
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** "December 2026 billed: 623 bills, ₱1,121,400.00. Done {Manila date} at {Manila time} by Carmela Cruz."
- **Don't assert:** the time value.

#### TC-08-D3: Each billed household's billed total and balance rise by exactly ₱1,800.00
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** Provisional — design
- **Setup:** Snapshot `billedCentavos` and `balanceCentavos` of 20 sampled households and HH-5-1.
- **Expected:** Each rose by 180000 exactly; `paidCentavos` and `pendingCentavos` unchanged.
- **Don't assert:** —

#### TC-08-D4: Each billed household's `billedThrough` becomes "2026-12"
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** Provisional — design
- **Expected:** All 623; the 2 deactivated keep their previous value.
- **Don't assert:** —

#### TC-08-D5: `monthlyTotals/2026-12.billedCentavos` equals the sum of the period's bills
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** Provisional — design
- **Expected:** 112140000 centavos; equal to the run's total and to the sum over `bills` where `period == "2026-12"`.
- **Don't assert:** —

#### TC-08-D6: Page edges: 1, 100, 101 and 623 households
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: BILL-1, BILL-100, BILL-101 projects
- **Expected:** Exactly 1, 100, 101 and 623 bills; each run completed; no household billed twice at the 100/101 edge.
- **Don't assert:** —

#### TC-08-D7: The run record ends `completed` with created count and total
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** Provisional — design
- **Expected:** `status` completed, `createdCount` 623, total 112140000, `finishedAt` set.
- **Don't assert:** —

#### TC-08-D8: Bill ids are `{period}_{householdId}`
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** Provisional — design
- **Expected:** Every new bill's id is "2026-12_" + its `householdId`.
- **Don't assert:** —

#### TC-08-D9: The worker updates the heartbeat after each page
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check while running. **Tags:** Provisional — design · Staging note: slowed worker
- **Expected:** `heartbeatAt` and `cursor` move after each page of 100; `createdCount` matches the bills present.
- **Don't assert:** intervals.

#### TC-08-D10: Leaving the page during a run doesn't stop it
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Action:** Start; close the tab; reopen Collections after a minute.
- **Expected:** The run continued on the server; progress or done line shown.
- **Don't assert:** —

#### TC-08-D11: A household added during the run is billed at most once and progress never exceeds the total
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Admin office adds. **Tags:** Gap G-2 · Staging note: paused worker
- **Action:** Pause after page 3; add HH-8-2 with an id that sorts after the cursor; resume.
- **Expected:** HH-8-2 has at most one December bill; the card never reads "624 of 623". Whether it is billed in the run or listed as a late addition: G-2.
- **Don't assert:** which until G-2.

#### TC-08-D12: A household deactivated during the run has at most one bill
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Admin office deactivates. **Tags:** Staging note: paused worker
- **Action:** Deactivate one household before its page and one after its page.
- **Expected:** Each has 0 or 1 December bill, never 2; the "after" one has 1. The run completes.
- **Don't assert:** the "before" one's result (REQ: "may or may not").

#### TC-08-D13: A run that bills fewer than planned still completes and says what it did
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-2
- **Setup:** As D12, the "before" household skipped.
- **Expected:** `status` completed; the done line's count equals the bills created (622), never a stuck "stopped at 622 of 623".
- **Don't assert:** wording if G-2 adds one.

#### TC-08-D14: 700 households finish within one task's time
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: SEED-700
- **Expected:** Completed well within 30 minutes; reads and writes near Sol Arch's estimate (about 3 reads and 3–4 writes per household plus notifications).
- **Don't assert:** exact time or counts.

## E. Never billed twice

#### TC-08-E1: Pressing "Generate billing" twice quickly makes 623 bills
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** "Saving…" and disabled while in flight; exactly 623 December bills; one run record.
- **Don't assert:** —

#### TC-08-E2: Two treasurers pressing at once start one run; the second sees "December 2026 is already being billed."
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer and second treasurer. **Tags:** Staging note: two sessions
- **Expected:** One run; 623 bills; the second press shows "December 2026 is already being billed." (or "…already billed." if it finished first).
- **Don't assert:** which message.

#### TC-08-E3: Starting a completed period is refused with "December 2026 is already billed."
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, stale tab and direct call. **Tags:** —
- **Action:** From a tab opened before the run, press "Generate billing"; also call directly.
- **Expected:** "December 2026 is already billed."; still 623 bills.
- **Don't assert:** —

#### TC-08-E4: Ten parallel starts create one run and 623 bills
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, 10 parallel calls. **Tags:** Provisional — design
- **Expected:** One `billingRuns/2026-12`; 9 refusals; 623 bills; every household's balance up by 180000 once.
- **Don't assert:** which call won.

#### TC-08-E5: A notification is not duplicated by parallel starts
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check after E4. **Tags:** Provisional — design
- **Expected:** One `stmt_2026-12_{hh}_{uid}` per linked person.
- **Don't assert:** —

#### TC-08-E6: Two treasurers pressing "Continue billing" at once start one worker
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer and second treasurer. **Tags:** Staging note: stopped run, two sessions
- **Expected:** One lease taken; one worker; exactly 623 bills at the end; each total raised once.
- **Don't assert:** —

#### TC-08-E7: "Continue" while a live worker holds the lease is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct call. **Tags:** Provisional — design
- **Setup:** Running, fresh heartbeat.
- **Expected:** `continueBillingRun` refused; no second worker.
- **Don't assert:** —

#### TC-08-E8: "Continue" on a completed or non-existent run is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct call. **Tags:** —
- **Expected:** Both refused; nothing changes.
- **Don't assert:** —

#### TC-08-E9: A stale tab showing "Continue billing" after someone else continued
**Priority** P3 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** Pressing it is refused or shows the progress; never a second worker.
- **Don't assert:** message.

#### TC-08-E10: "Generate" on a stopped run is refused as already being billed
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct call. **Tags:** —
- **Expected:** "December 2026 is already being billed."; the only way forward is Continue.
- **Don't assert:** —

## F. An interrupted run is finished, not repeated

#### TC-08-F1: With no progress for 5 minutes after 410 of 623, the card shows the stopped line with "Continue billing"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: kill the worker after 410
- **Expected:** "December 2026 billing stopped at 410 of 623. Press Continue to finish it. Bills already created won't be made again." with "Continue billing".
- **Don't assert:** —

#### TC-08-F2: "Continue billing" creates the remaining 213 bills
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** 213 new bills; run completed; done line shows 623.
- **Don't assert:** —

#### TC-08-F3: After resuming, exactly 623 bills exist
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** —
- **Expected:** 623 December bills; none duplicated.
- **Don't assert:** —

#### TC-08-F4: After resuming, each balance went up by ₱1,800.00 exactly once
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** Provisional — design
- **Expected:** For all 623, `balanceCentavos` after − before = 180000; especially the households of the page that was in progress when the worker died.
- **Don't assert:** —

#### TC-08-F5: A resumed run gives nobody a second notification
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** —
- **Expected:** Each linked person has exactly one December statement notification.
- **Don't assert:** —

#### TC-08-F6: A worker killed in the middle of one household leaves that household all-or-nothing
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** Staging note: kill inside a transaction · Assumption: the emulator rolls back an interrupted transaction
- **Expected:** That household has either the bill, the raised totals, `billedThrough` and its notifications, or none of them.
- **Don't assert:** which.

#### TC-08-F7: The heartbeat threshold: 4 minutes 59 seconds is still running; 5 minutes 1 second is stopped
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: controllable clock
- **Expected:** Progress line at 4:59; stopped line at 5:01. `status` stays `running` in both (stopped is not stored).
- **Don't assert:** the 5:00 exact case.

#### TC-08-F8: A stale heartbeat older than 10 minutes raises the owner's alert
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Observability (staging). **Tags:** Staging note: alerting policy
- **Expected:** One alert; also an alert if a period isn't billed by the 5th.
- **Don't assert:** channel.

## G. The rate at the moment the run starts

#### TC-08-G1: A rate change during the run doesn't change any of its bills
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; second treasurer changes the rate mid-run. **Tags:** Staging note: paused worker
- **Expected:** All 623 December bills ₱1,800.00, including those created after the change.
- **Don't assert:** —

#### TC-08-G2: The next period's preview uses the new rate
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** January 2027 preview "bills of ₱2,000.00 each".
- **Don't assert:** —

#### TC-08-G3: A resumed run uses the snapshot, not the current rate
**Priority** P1 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** Run stops at 410; rate changed to ₱2,000.00; Continue.
- **Expected:** The remaining 213 bills are ₱1,800.00.
- **Don't assert:** —

## H. Notifications and the reminder

#### TC-08-H1: Each linked person gets "Your December 2026 statement is ready: ₱1,800.00 due Dec 31, 2026."
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Expected:** One notification with that text in his bell.
- **Don't assert:** unread badge (H17).

#### TC-08-H2: A household with nobody linked gets a bill and no notification
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** —
- **Expected:** The 173 unlinked households each have a bill and no `stmt_` notification.
- **Don't assert:** —

#### TC-08-H3: A resumed run sends no second notification
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check (as F5, from the notification side). **Tags:** Provisional — design
- **Expected:** Notification ids `stmt_2026-12_{hh}_{uid}`; one per person.
- **Don't assert:** —

#### TC-08-H4: Two people in one household each get their own notification
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN and U-SPOUSE. **Tags:** —
- **Expected:** Each has one; reading one leaves the other unread (REQ-011).
- **Don't assert:** —

#### TC-08-H5: Nobody gets a notification about another household
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-MARIA). **Tags:** —
- **Expected:** U-MARIA has exactly one statement notification, for her own household's amount; none naming HH-5-1 or HH-4-12.
- **Don't assert:** —

#### TC-08-H6: Deactivated households' people get no notification
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** Gap G-15 (people still linked to a deactivated household, REQ-004 G-27)
- **Expected:** None for people linked to "ZZ Bill Inactive 1, 2".
- **Don't assert:** —

#### TC-08-H7: A treasurer who is a homeowner gets her household's statement notification
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO. **Tags:** —
- **Expected:** One `stmt_` notification for HH-C, seen in "My household".
- **Don't assert:** which view shows the bell.

#### TC-08-H8: A person removed from a household before the run gets no notification
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Former member of HH-5-1 (removed after a sale). **Tags:** —
- **Expected:** No December notification for the removed person; the current members get one.
- **Don't assert:** —

#### TC-08-H9: At 9:00 AM Manila on Dec 1, every treasurer gets "December 2026 isn't billed yet. Open Collections to generate it."
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS, S-TREAS-2, S-TREAS-HO. **Tags:** Staging note: trigger the schedule with a controllable clock
- **Setup:** No `billingRuns/2026-12` at 9:00 Manila.
- **Expected:** One reminder per treasurer with that text.
- **Don't assert:** —

#### TC-08-H10: The reminder is sent once per period
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurers. **Tags:** Provisional — design
- **Action:** Run the reminder job twice for December.
- **Expected:** One `billrem_2026-12_{uid}` per treasurer.
- **Don't assert:** —

#### TC-08-H11: No reminder when the run already exists
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurers. **Tags:** Gap G-5
- **Setup:** Run started at 8:30 AM Dec 1 (running or completed).
- **Expected:** No reminder at 9:00. A run that exists but is stopped also suppresses the reminder (the rule checks existence only): whether a stopped run should still remind: G-5.
- **Don't assert:** the stopped case until G-5.

#### TC-08-H12: The admin office, board and homeowners get no reminder
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office, Board, Homeowner. **Tags:** —
- **Expected:** None.
- **Don't assert:** —

#### TC-08-H13: The reminder runs at 9:00 Manila, not 9:00 UTC
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurers. **Tags:** Staging note: schedule time zone
- **Expected:** Schedule `0 9 1 * *` with `timeZone: Asia/Manila`: fires at 01:00 UTC on the 1st. A run started at 8:59 Manila suppresses it; one started at 9:01 doesn't.
- **Don't assert:** —

#### TC-08-H14: A removed treasurer gets no reminder
**Priority** P3 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-EXTREAS. **Tags:** —
- **Expected:** None.
- **Don't assert:** —

#### TC-08-H15: A late bill sends its household a statement notification
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner linked to HH-8-2. **Tags:** Gap G-6
- **Expected (recommended):** One "Your December 2026 statement is ready…" after "Bill for December 2026". Not stated in the REQ: G-6.
- **Don't assert:** until G-6.

#### TC-08-H16: The statement notification amount is the household's bill, not the household's balance
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner linked to HH-3-9 (opening ₱9,000.00). **Tags:** —
- **Expected:** "Your December 2026 statement is ready: ₱1,800.00 due Dec 31, 2026." (the period's bill), not ₱10,800.00.
- **Don't assert:** —

#### TC-08-H17: The unread count rises by one per new notification
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Expected:** Bell count up by exactly 1 after the run.
- **Lane:** exclusive — asserts U-CARLO's unread badge.

## I. Late additions

#### TC-08-I1: A household added after the period was billed gets no bill automatically
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office adds HH-8-2 on Dec 10, 2026. **Tags:** —
- **Expected:** No `bills/2026-12_{HH-8-2}`; `billedThrough` "".
- **Don't assert:** —

#### TC-08-I2: The card lists it: "1 household added since December 2026 was billed: Blk 8 Lot 2"
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** That line with "Bill for December 2026" and "Don't bill".
- **Don't assert:** —

#### TC-08-I3: "Bill for December 2026" asks "Bill Blk 8 Lot 2 ₱1,800.00 for December 2026, due Dec 31, 2026?"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** That confirm; Cancel creates nothing.
- **Don't assert:** —

#### TC-08-I4: Confirming creates one December bill and updates the household
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — design
- **Expected:** One `bills/2026-12_{HH-8-2}` of 180000 due 2026-12-31; totals up by 180000; `billedThrough` "2026-12"; it leaves the list.
- **Don't assert:** —

#### TC-08-I5: Pressing it again does not create a second bill
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (double tap; and a direct second call). **Tags:** —
- **Expected:** Still one bill; totals raised once.
- **Don't assert:** —

#### TC-08-I6: The late bill is logged
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Board reads the log. **Tags:** —
- **Expected:** "Carmela Cruz (Treasurer) billed Blk 8 Lot 2 for December 2026".
- **Don't assert:** —

#### TC-08-I7: "Don't bill" asks "Don't bill Blk 8 Lot 2 for December 2026? It will be billed with everyone from January 2027."
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** That confirm.
- **Don't assert:** —

#### TC-08-I8: Confirming "Don't bill" removes it from the list with no bill
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — design
- **Expected:** No December bill; `billedThrough` "2026-12"; not listed after reload.
- **Don't assert:** —

#### TC-08-I9: A skipped household is billed with everyone the next month
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** The January 2027 run creates its bill; still no December bill.
- **Don't assert:** —

#### TC-08-I10: The skip is logged
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Board reads the log. **Tags:** —
- **Expected:** "Carmela Cruz (Treasurer) chose not to bill Blk 8 Lot 2 for December 2026".
- **Don't assert:** —

#### TC-08-I11: A household reactivated after the period was billed is listed for that period only
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Admin office reactivates HH-7-1 on Dec 10. **Tags:** —
- **Setup:** HH-7-1 deactivated in October (last billed September or October).
- **Expected:** Listed under late additions; only "Bill for December 2026" offered; no October or November bill can be created by any button or call.
- **Don't assert:** —

#### TC-08-I12: A household added before the run is billed with everyone
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office adds HH-8-2 on Nov 20. **Tags:** —
- **Expected:** A December bill from the run; not listed as a late addition.
- **Don't assert:** —

#### TC-08-I13: Several late additions are listed together
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-14
- **Setup:** Three added after December was billed.
- **Expected:** "3 households added since December 2026 was billed: …" with each lot and its own two buttons. Wording for one vs many ("household(s)"): G-14.
- **Don't assert:** plural wording.

#### TC-08-I14: A late addition still undecided when the next period is billed
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-3
- **Setup:** HH-8-2 listed for December; nobody decides; the January run bills it.
- **Expected:** It has a January bill; December is never billed and nothing records that nobody decided. Whether the December decision is lost silently, kept on the list, or logged: G-3.
- **Don't assert:** the list after the January run until G-3.

#### TC-08-I15: A late bill after the rate changed
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-7
- **Setup:** December billed at ₱1,800.00; rate changed to ₱2,000.00 for January; HH-8-2 added Dec 20.
- **Expected:** The confirm and the bill show the same amount. Whether a late December bill uses December's run snapshot (₱1,800.00, recommended) or the current rate: G-7.
- **Don't assert:** amount until G-7.

#### TC-08-I16: A household deactivated and reactivated after it was already billed is not listed again
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office; Treasurer. **Tags:** —
- **Setup:** HH-5-1 billed for December; deactivated Dec 15; reactivated Dec 20.
- **Expected:** Not in late additions; still one December bill.
- **Don't assert:** —

#### TC-08-I17: The late-additions list appears only after a period is billed
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Before the first run, no late-additions list even though every household has `billedThrough` "".
- **Don't assert:** —

#### TC-08-I18: `billHousehold` refuses any period but the latest billed one
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct calls. **Tags:** Provisional — design
- **Action:** Bill HH-7-1 for "2026-10" and "2027-01".
- **Expected:** Both refused.
- **Don't assert:** —

#### TC-08-I19: `billHousehold` refuses a household that already has the bill, or is inactive
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct calls. **Tags:** —
- **Expected:** Refused (or a no-op) for HH-5-1 (already billed); refused for "ZZ Bill Inactive 1"; totals unchanged.
- **Don't assert:** which of refusal or no-op for the first.

#### TC-08-I20: `skipLateBill` refuses an already-billed household
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct call. **Tags:** —
- **Expected:** No change to its bill or totals; no `billing.skip` entry.
- **Don't assert:** —

#### TC-08-I21: Two treasurers choose "Bill" and "Don't bill" at once
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer and second treasurer. **Tags:** Staging note: two sessions
- **Expected:** One outcome only: either one bill with `billing.lateBill`, or no bill with `billing.skip`; never a bill **and** a skip entry.
- **Don't assert:** which.

## J. Opening balances

#### TC-08-J1: Checking the file reports "623 rows: 610 ready, 13 with problems" with each problem row
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-9 (file format)
- **Action:** Upload OB-623.csv; "Check file".
- **Expected:** That summary; each of the 13 rows listed with its lot and reason.
- **Don't assert:** file formats other than CSV until G-9.

#### TC-08-J2: Checking saves nothing to households or bills
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** —
- **Expected:** No `opening_` bill; household totals and `config/billing` unchanged (only `importRuns/{id}`).
- **Don't assert:** —

#### TC-08-J3: A negative row reads "Blk 6 Lot 4: credit of ₱1,200.00"
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** That line in the check result, counted as ready.
- **Don't assert:** —

#### TC-08-J4: A lot not in the directory reads "Blk 99 Lot 1 isn't in the directory."
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** That reason on its row.
- **Don't assert:** —

#### TC-08-J5: A bad amount reads "Amount must be a number, like 5400.00"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "1,8OO" → that reason.
- **Don't assert:** —

#### TC-08-J6: A lot listed twice reads "{lot} appears twice in the file."
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** That reason; neither row loaded (recommended, matching REQ-003's in-file duplicate rule).
- **Don't assert:** whether one copy loads.

#### TC-08-J7: A non-whole months owed reads "Months owed must be a whole number."
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "2.5" → that reason; "−1": Gap G-10.
- **Don't assert:** negative months.

#### TC-08-J8: Loading creates one "Balance before December 2026" line per positive amount
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Homeowner linked to HH-3-9 reads. **Tags:** Provisional — design · Blocked — treasurer (first period)
- **Action:** "Load 610 opening balances"; confirm.
- **Expected:** `bills/opening_{HH-3-9}` with `kind` opening, 900000 centavos, `period` "2026-11" (the month before the first billed period), `dueDate` the "as of" date; the statement shows "Balance before December 2026 · ₱9,000.00".
- **Don't assert:** the "as of" date (Blocked — treasurer).

#### TC-08-J9: An opening balance counts as overdue from the "as of" date
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner linked to HH-3-9. **Tags:** Blocked — treasurer (as-of date)
- **Expected:** The opening line reads "Overdue" (REQ-009 "The opening balance is the first line").
- **Don't assert:** —

#### TC-08-J10: A negative amount is stored as credit, not as a bill
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check; Homeowner linked to HH-6-4 reads. **Tags:** Provisional — design · depends on REQ-009 decision 2 (keep credit)
- **Expected:** `bills/opening_{HH-6-4}` with `kind` openingCredit and a positive amount 120000; no bill with a negative amount; the statement shows "Credit before December 2026 · ₱1,200.00".
- **Don't assert:** —

#### TC-08-J11: Months owed, where given, is stored
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** —
- **Expected:** HH-3-9's opening record has `monthsOwed` 5; rows without the column have none (not 0).
- **Don't assert:** —

#### TC-08-J12: Households not in the file start at ₱0.00
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner of a household not in OB-623. **Tags:** —
- **Expected:** No opening record; statement has no opening line; balance ₱0.00 before the first bill.
- **Don't assert:** —

#### TC-08-J13: After loading, "Load opening balances" is gone and the server refuses a second load
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; direct call. **Tags:** —
- **Expected:** Card hidden; `commitOpeningBalances` with a new file refused; existing opening records unchanged.
- **Don't assert:** —

#### TC-08-J14: Pressing "Load 610 opening balances" twice loads once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** Button reads "Loading…" and is disabled in flight; one opening record per household; one `billing.opening` entry.
- **Don't assert:** —

#### TC-08-J15: "Start with everyone at ₱0.00" asks "Start every household at ₱0.00? You won't be able to load opening balances afterwards."
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** That confirm; Cancel changes nothing.
- **Don't assert:** —

#### TC-08-J16: Confirming start-at-zero hides the load and makes the first billing available
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — design
- **Expected:** `config/billing.openingClosed` true and `firstPeriod` set; "Load opening balances" gone; "Generate December 2026 billing" available (on/after Dec 1).
- **Don't assert:** how `firstPeriod` is chosen (Blocked — treasurer).

#### TC-08-J17: Opening balances can't be loaded once any period is billed
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct call. **Tags:** —
- **Setup:** Started at zero, December billed.
- **Expected:** `commitOpeningBalances` refused; no opening record.
- **Don't assert:** —

#### TC-08-J18: An amount of 0.00 in the file
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-10
- **Expected:** Not stored as a ₱0.00 bill that shows "Balance before December 2026 · ₱0.00 · Overdue". Ready-and-skipped, or a problem row: G-10.
- **Don't assert:** until G-10.

#### TC-08-J19: Amounts with a comma, a peso sign or three decimals
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-10
- **Action:** "5,400.00", "₱5400", "5400.555", "  5400.00 ".
- **Expected:** "5400.555" is a problem row (never rounded silently). The others: accepted or "Amount must be a number, like 5400.00": G-10.
- **Don't assert:** comma, sign and spaces until G-10.

#### TC-08-J20: A row for a deactivated household
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-10
- **Expected:** Either loaded (it's in the directory) or a problem row: G-10.
- **Don't assert:** until G-10.

#### TC-08-J21: Loading raises the household's balance by the opening amount
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check; Admin office reads the directory. **Tags:** Gap G-8
- **Expected (recommended):** HH-3-9 `balanceCentavos` +900000; HH-6-4 −120000 (credit); the directory and statement summary agree. The REQ's Data changes don't say opening balances update the stored totals: G-8.
- **Don't assert:** until G-8.

#### TC-08-J22: An amount above any sane limit
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-10
- **Action:** A row with 999999999.99.
- **Expected:** Flagged, not silently loaded (no cap stated): G-10.
- **Don't assert:** until G-10.

#### TC-08-J23: The check result is kept for 30 days then deleted
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Daily job. **Tags:** Staging note: controllable clock
- **Expected:** `importRuns/{id}` present at 29 days, gone after 30.
- **Don't assert:** —

#### TC-08-J24: Only the treasurer can check, load or start at zero
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office, Board, Homeowner, removed treasurer. **Tags:** —
- **Expected:** `previewOpeningBalances`, `commitOpeningBalances`, `startAtZero` refused for each.
- **Don't assert:** —

#### TC-08-J25: The opening entry is logged once with its count
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Board reads the log. **Tags:** —
- **Expected:** "Carmela Cruz (Treasurer) loaded opening balances for 610 households".
- **Don't assert:** —

#### TC-08-J26: The commit button reads "Load {r} opening balances" from the check result
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "Load 610 opening balances"; with 0 ready rows the button isn't offered (or is disabled with a reason).
- **Don't assert:** the 0-ready wording.

#### TC-08-J27: "Start with everyone at ₱0.00" twice, or after a load, changes nothing more
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (double tap; direct call after a load). **Tags:** —
- **Expected:** One `billing.startAtZero` entry; after a load, `startAtZero` refused; `firstPeriod` unchanged.
- **Don't assert:** —

#### TC-08-J28: Loading and starting at zero at the same time from two sessions
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer and second treasurer. **Tags:** Staging note: two sessions
- **Expected:** Exactly one succeeds; never both opening records **and** a start-at-zero entry.
- **Don't assert:** which.

## K. Roles and rules

#### TC-08-K1: The treasurer's start, continue, late-bill and skip calls are allowed
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** Allowed (role decision only; outcomes are in B–I).
- **Don't assert:** —

#### TC-08-K2: The admin office doesn't see Collections or "Generate billing"
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Admin office (S-ADMIN). **Tags:** —
- **Expected:** No Collections in the menu; opening the address shows "You don't have access to this page".
- **Don't assert:** —

#### TC-08-K3: The billing functions refuse the admin office
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office. **Tags:** —
- **Expected:** `startBillingRun`, `continueBillingRun`, `billHousehold`, `skipLateBill` all refused; nothing created.
- **Don't assert:** —

#### TC-08-K4: Firestore refuses any bill written from any browser
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, Admin office, Board, Homeowner, Guard. **Tags:** —
- **Action:** Each creates `bills/2026-12_{hh}`, updates an existing bill's amount, deletes a bill.
- **Expected:** All refused explicitly; bills unchanged.
- **Don't assert:** —

#### TC-08-K5: No client can write runs, totals, `billedThrough` or billing config
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, Admin office, Homeowner. **Tags:** Provisional — design
- **Action:** Write `billingRuns/2026-12`, `monthlyTotals/2026-12`, `households/{id}.balanceCentavos`, `.billedThrough`, `config/billing.goLive`, `.openingClosed`.
- **Expected:** All refused explicitly.
- **Don't assert:** —

#### TC-08-K6: The board's calls are refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Board. **Tags:** —
- **Expected:** All billing and opening callables refused.
- **Don't assert:** —

#### TC-08-K7: Homeowner and guard calls are refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner, Guard. **Tags:** —
- **Expected:** All refused.
- **Don't assert:** —

#### TC-08-K8: A removed treasurer with a valid token, and a claim without a staff document, are refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-EXTREAS; claim-only account. **Tags:** L-004
- **Expected:** `startBillingRun` refused for both.
- **Don't assert:** —

#### TC-08-K9: A homeowner reads her own household's bills and not another's
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA). **Tags:** —
- **Expected:** Read of her own `bills/2026-12_{hh}` allowed; HH-5-1's refused; a list query over all bills refused.
- **Don't assert:** —

#### TC-08-K10: Run records and monthly totals are not readable by homeowners or guards
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, Guard. **Tags:** Gap G-16
- **Expected (recommended):** `billingRuns` and `monthlyTotals` refused (HOA-wide figures). Read rules for these are not stated: G-16.
- **Don't assert:** until G-16.

#### TC-08-K11: The board can read the run record for the card
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** —
- **Expected:** `billingRuns/2026-12` readable (card read-only, Data changes "Read by: board").
- **Don't assert:** whether board can read individual bills (not stated).

## L. Production guard

#### TC-08-L1: In a "-prod" project without go-live, a run is refused with "Billing isn't switched on for this portal yet. Ask the developer."
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: emulator project id ending `-prod`, never a real project · Provisional — design
- **Expected:** That message; no run, no bill.
- **Don't assert:** —

#### TC-08-L2: With `config/billing.goLive` set, the same project bills
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: emulator `-prod` id
- **Expected:** The run starts.
- **Don't assert:** —

#### TC-08-L3: Staging and emulator projects bill without go-live
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** `hoa-portal-staging` and `demo-…` ids run without `goLive`.
- **Don't assert:** —

#### TC-08-L4: The guard also stops a late bill and an opening load in a "-prod" project without go-live
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-13
- **Expected (recommended):** `billHousehold`, `commitOpeningBalances` and `startAtZero` refused the same way. The REQ names only "a billing run": G-13. Who sets `goLive`, and how: G-13.
- **Don't assert:** until G-13.

## M. Activity log entries

#### TC-08-M1: The run is logged once with count and total
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Board reads the log. **Tags:** —
- **Expected:** One entry "Carmela Cruz (Treasurer) generated December 2026 billing: 623 bills, ₱1,121,400.00".
- **Don't assert:** —

#### TC-08-M2: A resumed run writes no second run entry
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check after F2. **Tags:** —
- **Expected:** One `billing.run` for December; its count is 623.
- **Don't assert:** whether "Continue" writes its own entry (not specified).

#### TC-08-M3: Start at zero is logged
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** —
- **Expected:** One `billing.startAtZero` entry (sentence: TC-06 G-2).
- **Don't assert:** wording.

#### TC-08-M4: No per-bill entries are written
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check. **Tags:** —
- **Expected:** The run adds exactly one `auditLog` entry, not 623.
- **Lane:** exclusive — asserts the total `auditLog` count across the run.

## N. Integration with statements and the directory

#### TC-08-N1: The directory balance changes from "—" after the first run
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office. **Tags:** —
- **Expected:** Before: "—" (REQ-003). After: "₱1,800.00" for a household with no opening balance and no payments.
- **Don't assert:** —

#### TC-08-N2: The homeowner's statement shows the December line
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-CARLO). **Tags:** —
- **Expected:** "December 2026", due Dec 31, 2026, billed ₱1,800.00, status Unpaid.
- **Don't assert:** layout (REQ-009).

#### TC-08-N3: Before any run, the statement reads "No bills yet…"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "No bills yet. Your first statement appears when the HOA bills the next period." and "₱0.00".
- **Don't assert:** —

#### TC-08-N4: Stored household totals equal the sum of the household's bills
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Data check after B–J. **Tags:** —
- **Expected:** For every household: `billedCentavos` = sum of its bills (plus opening, G-8); `balanceCentavos` = billed − paid − credit.
- **Don't assert:** pending (REQ-010).

#### TC-08-N5: An opening balance and the first bill add up on the statement
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner linked to HH-3-9. **Tags:** —
- **Expected:** "Balance before December 2026 · ₱9,000.00" and December ₱1,800.00; balance ₱10,800.00.
- **Don't assert:** —

#### TC-08-N6: Opening credit pays the first bill
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner linked to HH-6-4. **Tags:** —
- **Expected:** December "Partly paid" with "₱600.00 left" (REQ-009 "Credit from before the portal pays the first bills").
- **Don't assert:** —

## P. Navigation

#### TC-08-P1: Collections opens on the Monthly billing card for the treasurer
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Collections highlighted (one `aria-current`); in R1 only the billing card (and opening balances before the first run); no delinquent list.
- **Don't assert:** —

#### TC-08-P2: Homeowner and guard opening the Collections address see the no-access page
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, Guard. **Tags:** —
- **Expected:** "You don't have access to this page".
- **Don't assert:** —

#### TC-08-P3: Reloading during a run shows the server's progress
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** After reload: progress line from the run record (not the ready button, not 0 of 623 again).
- **Don't assert:** —

#### TC-08-P4: A second treasurer opening Collections mid-run sees the progress, not a button
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Second treasurer. **Tags:** —
- **Expected:** Progress line; no "Generate" button.
- **Don't assert:** —

#### TC-08-P5: The reminder opens Collections; the statement notification opens Dues & Payments
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Homeowner. **Tags:** —
- **Expected:** Each marks read and opens that page inside the portal.
- **Don't assert:** —

#### TC-08-P6: Cancel in each confirm returns focus to the button that opened it
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, keyboard. **Tags:** —
- **Expected:** Preview, late-bill, don't-bill, start-at-zero and load confirms each return focus on Cancel.
- **Don't assert:** —

#### TC-08-P7: After "Generate billing" the treasurer stays on the card
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** No navigation away; the progress line appears where the button was.
- **Don't assert:** —

#### TC-08-P8: An announcement pop-up during a run doesn't stop the run or the progress
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Depends on REQ-017 (S3)
- **Expected:** After dismissing it, the card shows current progress; the run continued.
- **Don't assert:** —

## Q. Usability and accessibility (WCAG 2.2 AA, 375 px)

#### TC-08-Q1: The card works at 375 px with a full-width button
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer on a phone. **Tags:** DEF-001
- **Expected:** Full-width generate button; preview dialog fits without horizontal scroll; figures readable.
- **Don't assert:** —

#### TC-08-Q2: Progress is text and is announced politely
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer with a screen reader. **Tags:** —
- **Expected:** "410 of 623" as text in a polite live region; not a bar alone; not announced on every single bill.
- **Don't assert:** announcement frequency.

#### TC-08-Q3: Every disabled button shows its reason as visible text beside it
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "Available from …", "Add households…", "Set the monthly dues…" visible and associated with the button.
- **Don't assert:** —

#### TC-08-Q4: Late-addition rows at 375 px: one row per lot with two tappable buttons
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer on a phone. **Tags:** —
- **Expected:** Each button at least 44 × 44 px; the lot visible on the row.
- **Don't assert:** —

#### TC-08-Q5: Problem rows are readable on a phone
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer on a phone. **Tags:** —
- **Expected:** Lot and reason readable without horizontal scroll.
- **Don't assert:** —

#### TC-08-Q6: Every action button shows its in-flight label and is disabled
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: slowed network
- **Expected:** "Generate billing" → "Saving…"; "Load {r} opening balances" → "Loading…"; "Continue billing", "Bill for {period}", "Don't bill", "Start with everyone at ₱0.00" disabled while in flight.
- **Don't assert:** in-flight labels other than those in copy.

#### TC-08-Q7: The preview figures are text
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, screen reader. **Tags:** —
- **Expected:** Count, rate, total and due date read out; none is an image.
- **Don't assert:** —

#### TC-08-Q8: The layout stays stable when the progress line replaces the button
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** Content below the card doesn't jump.
- **Don't assert:** pixel measures.

#### TC-08-Q9: Contrast is at least 4.5:1
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Card text, disabled reason, progress and problem rows meet 4.5:1.
- **Don't assert:** —

#### TC-08-Q10: Pressing "Generate billing" while offline
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Assumption: callables fail offline rather than queue
- **Expected:** "We couldn't start billing. Nothing was created. Try again."; no run.
- **Don't assert:** timeout.

## R. Copy consistency

#### TC-08-R1: Period, date and money formats match the rest of the app
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, Homeowner. **Tags:** —
- **Expected:** "December 2026", "Dec 31, 2026", "₱1,121,400.00" on the card, preview, done line, notification and statement.
- **Don't assert:** —

#### TC-08-R2: The mock-up's wording is gone
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** No "billing created for {n} households" toast, no "Every homeowner gets a notification" (only linked people do), no "This creates {n} bills at …" mock-up preview.
- **Don't assert:** —

#### TC-08-R3: The preview promises corrections that REQ-046 provides
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Blocked — REQ-046
- **Expected:** The preview says "a wrong bill can only be corrected afterwards, with a reason, one household or one period at a time." This is true only if REQ-046 (one bill and bulk by period) ships with or before REQ-008. If REQ-008 ships first, the copy promises something not built.
- **Don't assert:** the correction itself (REQ-046's own test plan).

## S. Back-compat and data integrity

#### TC-08-S1: Households created by `createHousehold` and by import have `billedThrough` ""
**Priority** P1 · **Type** Back-compat · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office. **Tags:** REQ-003 cross-impact (not in TC-03) · Provisional — design
- **Action:** Add one household; import a 3-row file.
- **Expected:** Each new `households` document has `billedThrough: ""`.
- **Don't assert:** —

#### TC-08-S2: No active household lacks the `billedThrough` field
**Priority** P1 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Data check (before the first run in every environment). **Tags:** Gap G-17
- **Expected:** Every active household has the field. One without it is skipped by the late-additions query for ever. Whether households created before this change get a back-fill: G-17.
- **Don't assert:** the back-fill method.

#### TC-08-S3: Bills are never changed or deleted after creation
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Data check after every block. **Tags:** —
- **Expected:** Every December bill's `amountCentavos`, `period`, `dueDate` and `kind` equal their values right after the run; none deleted.
- **Don't assert:** `adjustedCentavos` once REQ-046 ships.

#### TC-08-S4: Each household has at most one bill per period
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Data check. **Tags:** —
- **Expected:** Grouping bills by (`householdId`, `period`) gives no count above 1; at most one `opening_` record per household.
- **Lane:** exclusive — asserts every `bills` document in the environment.

#### TC-08-S5: No inactive household gets a bill for a period it was inactive for the whole run
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Data check. **Tags:** —
- **Expected:** "ZZ Bill Inactive 1, 2" have no bills for any period run while they were inactive.
- **Don't assert:** —

#### TC-08-S6: Run total, monthly total and the sum of bills agree
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Data check. **Tags:** —
- **Expected:** For each period: run total = `monthlyTotals.billedCentavos` = sum of `dues` bills for the period, after a late bill too (Gap G-18: does a late bill update `monthlyTotals`?).
- **Don't assert:** the late-bill effect on `monthlyTotals` until G-18.

## X. Exploratory charters

#### TC-08-X1: 30 minutes trying to bill a household twice
**Priority** P1 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Two treasurers on two devices, plus the admin office. **Tags:** Staging note: worker control
- **Charter:** Double taps, two devices, kill and resume the worker, continue twice, change the rate mid-run, add, deactivate and reactivate households mid-run, late bill and skip races, reminders at the edges. Any household with two bills for one period, or a balance raised twice, is a P1 finding. Time-box 30 min.

#### TC-08-X2: 20 minutes with a messy opening-balance spreadsheet
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Charter:** Excel-exported CSV with BOM, blank rows, lots written "B5 L1", "Blk.5 Lot 1", trailing totals row, hidden columns, negative numbers in parentheses. Note what's accepted, refused and silently changed. Time-box 20 min.

#### TC-08-X3: 15 minutes running billing from a phone
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer at 375 px. **Tags:** DEF-001
- **Charter:** Preview, generate, switch apps mid-run, lock the phone, come back; late additions on a phone. Time-box 15 min.

---

## REQ-046 plug-in points (not planned in this version)

REQ-046 (Adjust or cancel a bill) is a **draft** and is not planned here. When it is approved, its test plan plugs into this document at these points; this table is for QE's regression lens and for the next revision of TC-08.

| Where in TC-08 | What REQ-046 adds |
|---|---|
| B8, S3 (`adjustedCentavos` 0; bills never edited) | Adjustments add to `adjustedCentavos`; `amountCentavos` stays; S3 must then exclude `adjustedCentavos` |
| R3 (preview copy promises corrections) | Unblocks: one-bill and bulk-by-period corrections |
| D-block worker, E-block idempotency, F-block resume | The bulk correction reuses the worker, a run record and deterministic ids `adj_{period}_{runNo}_{hh}`; its own E/F-style cases |
| D3, N4, S6 (totals reconcile) | Household totals and the ledger use `amount + adjusted`; corrections dated in the month they're made (RELEASE-PLAN C1) |
| J-block (opening balances) | "Correcting an opening balance" scenario |
| M-block | `bill.adjusted` entries (TC-06-A24) |
| H-block | The homeowner is notified of a correction |

## Cases that hinge on open decisions

| Open item | Who decides | Cases |
|---|---|---|
| Which period is billed first; the "as of" date of opening balances | Treasurer | C11, J8, J9, J16 |
| Whether the office fills "Months owed" | Treasurer | J11 (stored either way) |
| Full month or nothing for a mid-month addition (recommended; no pro-rating) | HOA board | I-block assumes full month or nothing |
| Where current balances come from, in what format | Admin office and treasurer | J1, X2 (file format G-9) |
| REQ-009 decision 2 (keep credit) | Owner (approved in S2) | J10, N6 |
| REQ-046 approval | Owner | B8, R3, plug-in points |
| D2 late penalty (none in R1) | Board | None: no case asserts a penalty; R1 bills are dues only |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Card states | 10 | 6 |
| B | Preview and start | 12 | 8 |
| C | Periods and dates | 12 | 6 |
| D | The run itself | 14 | 5 |
| E | Never billed twice | 10 | 5 |
| F | Interrupted run | 8 | 6 |
| G | Rate at the start | 3 | 3 |
| H | Notifications and reminder | 17 | 8 |
| I | Late additions | 21 | 10 |
| J | Opening balances | 28 | 15 |
| K | Roles and rules | 11 | 9 |
| L | Production guard | 4 | 1 |
| M | Activity log entries | 4 | 1 |
| N | Statements and directory | 6 | 3 |
| P | Navigation | 8 | 1 |
| Q | Usability, WCAG 2.2 AA, 375 px | 10 | 0 |
| R | Copy consistency | 3 | 0 |
| S | Back-compat, data integrity | 6 | 5 |
| X | Exploratory charters | 3 | 1 |
| **Total** | | **190** | **93** |

By stated type: boundary 29 · negative 27 · data integrity 27 · security / role 19 · integration 18 · happy path 17 · concurrency / stale reference 18 · usability, UI/UX and responsive 21 · navigation 9 · back-compat 2 · exploratory 3.

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | The board "sees the card read-only", but REQ-002's R1 board menu is Dashboard only. How does the board reach Collections? | A10 |
| G-2 | Is the run's household list a snapshot? A household added during the run (or between preview and start) may be billed by the worker, pushing progress past "of 623", or be missed and not appear as a late addition. Should start refuse a stale household count like a stale rate? | B12, D11, D13 |
| G-3 | A late addition nobody decided on before the next period is billed: the January run bills it and moves `billedThrough`, so December is dropped silently with no `billing.skip` entry. Keep it on the list, refuse the next run, or log it? | I14 |
| G-4 | Catch-up billing of a missed month: its bills are due on a date already past. Should the preview warn "These bills are already overdue"? | C5 |
| G-5 | The reminder checks only that the run exists. A run that exists but stopped before 9:00 suppresses the treasurer's reminder; the owner alert comes only at 10 minutes. Remind on a stopped run? | H11 |
| G-6 | Does a late bill send the household a "statement ready" notification? | H15 |
| G-7 | Amount of a late bill when the rate changed after the period was billed: the period's run snapshot or the current rate? | I15 |
| G-8 | Do opening balances update `households.billedCentavos` / `balanceCentavos`? The Data changes table lists only the billing worker and `billHousehold` updating totals; without it the directory and summary disagree with the statement | J21, N4 |
| G-9 | Opening-balance file: "a spreadsheet" (REQ-008) vs REQ-003's CSV-only import. Which formats, which column headings, lot format? | J1, X2 |
| G-10 | Opening-balance row rules not stated: amount 0.00; comma, peso sign, spaces; maximum amount; negative months owed; a deactivated household's row | J7, J18, J19, J20, J22 |
| G-11 | Before the opening choice is made, is "Generate {period} billing" hidden, disabled with a reason, or enabled (and does a first run without a choice close the load)? | A1 |
| G-12 | `startBillingRun` with zero active households: refused, or a completed run with 0 bills? | A4 |
| G-13 | Who sets `config/billing.goLive` and how (script, console)? Does the production guard also cover late bills, opening loads and start-at-zero? | L4, register row 14 |
| G-14 | Singular and zero forms: "1 deactivated household", "0 deactivated households…", "1 household added since…" (copy has "household(s)") | B3, I13 |
| G-15 | People still linked to a deactivated household (REQ-004 G-27): no notification, confirm | H6 |
| G-16 | Read rules for `billingRuns`, `monthlyTotals` and `config/billing` for homeowners, guards and the admin office are not stated | K10 |
| G-17 | Households created before `billedThrough` existed (S1 data in staging; any imported pilot data): back-fill, and who runs it? | S2 |
| G-18 | Does a late bill update `monthlyTotals/{period}.billedCentavos` (set from `sum()` only "when the run finishes")? | S6 |

**New failure-pattern candidate for Sol Arch (LEARNINGS):** *"A queue that skips documents missing a field"*: a Firestore range or inequality filter silently leaves out any document that lacks the field, so a new field used in a query needs a default on every writer and a back-fill (here `billedThrough`, S1, S2). Proposed table row: **Field added for a query** · every writer sets a default, old documents are back-filled, and a data check proves none is missing.
