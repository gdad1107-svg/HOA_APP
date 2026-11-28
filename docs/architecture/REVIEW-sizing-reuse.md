# REVIEW: Build sizes re-done to reuse the mock-up (REQ-001 to REQ-046)

| | |
|---|---|
| Author | Sol Arch |
| Date | 2026-11-28 |
| Status | **Draft.** Nothing here changes an approved REQ, SA-001 or the release plan until the owner writes "APPROVED — FINAL" |
| Owner request | "ensure that when we plan for the effort of building the requirements, reuse what's already on the repo ex, the index html given that UI are mostly built already there" (2026-11-28) |
| Rule applied | Sol Arch agent, "Sizing: reuse what is already in the repo"; `LEARNINGS.md` L-006 (both on `main` from `docs/sa-reuse-estimates`, `04f813f`) |
| Baseline | `main` at `31daa84` |

## 1. Summary

| | Before | After | Change |
|---|---|---|---|
| Release plan headline total, as written today | about 60–96 days | — | stale (see note 1) |
| Release plan sprint rows, added up | 77.5–112 days | — | S1 and S4–S7 use backlog sizes |
| **All 46 REQs, each REQ's own size** | **96–127 days** | **83.75–111 days** | **−12.25 to −16 days (about 13%)** |
| R1 (S1–S3, 20 REQs) | 52.5–67.5 days | 47–61.5 days | −5.5 to −6 |
| Gate add-on R4 (S7) | 7.5–11 days | 6.25–8.5 days | −1.25 to −2.5 |

What this means:

1. **The reuse saving is real but small: about 13%.** Most of every size is back end: functions, transactions, rules, rules tests, concurrency tests and jobs. The mock-up has none of that we can use (L-002), so it stays at full size. The UI is where the mock-up helps, and the UI was already the smaller part.
2. **The release plan's total is too low, not too high.** It says "about 60–96". Its own sprint rows add up to 77.5–112, because the headline was not updated after S2 and S3 were re-sized. S1 is listed at 6–10 (backlog sizes). Sol Arch's reviewed S1 sizes add up to 17–23.5. That one row is out by more than the whole reuse saving.
3. **S4 to S7 are still BA estimates.** Sol Arch has not reviewed them. When Sol Arch reviewed S2 and S3, the sizes went up. Expect some of S4 to S7 to go up too when they are reviewed, which could cancel out the reuse saving there.

Proposed new release plan total: **about 84–111 build days** for all 46 REQs (R1 47–61.5).

## 2. What was read

- `index.html` (1,502 lines): every view function and dialog. It has 95 named functions. The view table is `VIEWS` at line 968. The nav is `NAV` at 546. Dialogs are `modal(...)`/`confirmBox(...)` calls, 23 of them, at lines 577–1410. Handlers are in `ACT` from line 1333.
- `docs/mockups/` (7 pages): every screen the BA drew, listed by REQ. That is 213 screens across REQ-001 to REQ-045. REQ-046 has none yet (its REQ says 46A–46C are still to be drawn).
- The Size section or Sol Arch review of each of the 46 REQs. Also `BACKLOG.md` (S/M/L), `RELEASE-PLAN.md`, `release-plan.html`, and SA-001 §9 and §12.
- `gentri-heights/index.html` was not re-read line by line. SA-001 §4.1 says it differs only in branding, so the line numbers here are for `index.html`.

## 3. How each size was redone

Every old size was split into five parts, using the REQ's own Size text where it lists what the days cover:

- **Port UI**: the screen is in `index.html`. Move its markup, `:root` CSS tokens, layout and copy into `lit-html` templates and wire them to real data. Sized at about a third of building it new.
- **Extend UI**: the screen is in `index.html`, but the REQ adds states or rules (loading, empty, error, offline, phone cards, role checks, stale edits). Only the additions are sized. Most of these extra states are drawn in `docs/mockups/`, so the design is done. The code is not.
- **New UI**: not in `index.html`. Sized in full, even when `docs/mockups/` draws it. The BA's mock-up pages are pictures with sample copy, not app code. They settle the design and wording, which the old Claude Code sizes barely counted anyway.
- **Back end**: unchanged from the old size. The mock-up's handlers write to `localStorage` and trust the browser (L-002), so none of it is used.
- **Tests**: unchanged, except where a test only existed for UI work that has been removed.

Pure formatting helpers with no data handling may be ported with unit tests: `inWords()` at 1042 (amount in words on the receipt) and the PDF layouts (`pdfStart()` 1004, `statementPDF()` 1014, `receiptPDF()` 1049, `letterPDF()` 1074, `clearancePDF()` 1294, `finPDF()` 1308). The *data* those functions read (`ledger()` 414, `allocation()` 1034, `fundFor()` 433, `nextNoticeType()` 427) is rebuilt on the server, per L-002. SA-001 §9 says official PDFs are made by functions. jsPDF also runs in Node, so the layouts move to the function and the browser code does not.

## 4. Shared pieces, counted once

| Piece | In `index.html` | Counted in | Later REQs |
|---|---|---|---|
| App shell: header, brand, bell, side nav, menu on phones | CSS `:root` and layout 5–353; `headerHTML()` 548; `navHTML()` 561 | REQ-002 (port 0.5, with the router) | No cost |
| Role router and menus | `NAV` 546; `VIEWS` 968; `render()` 971 | REQ-002 | No cost |
| UI kit: dialog, confirm, toast, status pill, table, tabs, chips, tiles, empty state | `modal()` 982; `confirmBox()` 989; `toast()` 408; `pill()` 403; `.tbl`/`.tabs`/`.chips`/`.tiles`/`.empty` in the CSS | REQ-002 (with the shell) | No cost |
| Data layer (Firestore, callable wrappers, Storage upload with compression) | None usable (`load()` 536 and `save()` 539 are `localStorage`) | REQ-001 (Firestore and auth) and REQ-010 (upload with compression) | No cost |
| Mail function and provider | None | REQ-004 step 2 (about 1.5 days) | REQ-019 and later emails |
| PDF base (fonts, header, footer, page numbers) | `pdfStart()` 1004; `pdfFooter()` 1013 | REQ-009 | REQ-013, 014, 020, 038, 039 |
| CSV export | `toCSV()` 1003; `saveFile()` 995; `copyCSV` fallback 1403–1405 | REQ-023 | REQ-035, 037 |
| Calendar | `calendarHTML()` 654 | REQ-031 | — |
| QR draw and scan | `drawQR()` 455; `qrCanvas()` 1119; `decodeQR()` 1145 (jsQR) | REQ-007 (draw); REQ-042 (scan) | REQ-040 |

SA-001 §12 also has area J, "connecting the frontend to the backend" (4–7 days, spread across phases). After this review, that work is inside each REQ's port and extend lines. Counting J as well would count it twice (see §7).

## 5. The table

Days are build days with Claude Code. "Old" is the size in the REQ: Sol Arch's for S1–S3, the BA's reading for S4–S7 (marked BA). Parts: **P** port UI · **E** extend UI · **N** new UI · **BE** back end · **T** tests. "in BE" means the tests are too small to split out.

### S1 · R1 (approved REQs)

| REQ | Old | New | P · E · N · BE · T | Reuses |
|---|---|---|---|---|
| 001 Sign in | 3–4.5 (2–3 r1 + 1–1.5 r4; staff 2-step +1–1.5 not counted) | **3–4.5** | 0 · 0 · 1–1.5 · 1–1.5 · 1–1.5 | Nothing in `index.html`: the mock-up has no sign-in, only the demo role switch at 554. The form CSS `.f`/`.fl` and `.alert` come with the shell (REQ-002). Screens drawn in `req-001-004-access-mockup.html` 497–532. New: everything |
| 002 Roles | 3–4 | **2.75–3.75** | 0.5 · 0.25 · 0.25–0.5 · 1.5–2 · 0.25–0.5 | Port: `NAV` 546, `navHTML()` 561, `VIEWS` 968, `render()` 971, `headerHTML()` 548, role switch 554 (now for a treasurer who is also a homeowner), plus the shell and UI kit (§4). Extend: nav badges from real counts 563, the no-access page. New: Settings → Staff list (drawn at 539) |
| 003 Household directory | 5–7 | **4.5–6.25** | 0.25 · 0.5 · 1–1.25 · 2.25–3.25 · 0.5–1 | Port: `aHo()` 758 (list, search, status pills) and the `hoDetail` dialog 1383. Extend: paging and server search for 623+ households, phone cards (drawn at 547), link status. New: import preview (548) and the add/edit form (554). The mock-up has no add or edit |
| 004 Invite and link | 6–8 (step 1 4–5 + step 2 2–3) | **5.75–7.75** | 0 · 0.25 · 1–1.25 · 3.5–4.75 · 1–1.5 | Extend: an invite status column in `aHo()` 760, invitations in `hoDetail` 1383. New: code entry, confirm lot, code errors, printed slips, invite many (drawn 557–565). BE includes the shared mail function (about 1.5) |
| **S1** | **17–23.5** | **16–22.25** | | Saves 1–1.25 |

### S2 · R1 (005–011 approved; 046 draft)

| REQ | Old | New | P · E · N · BE · T | Reuses |
|---|---|---|---|---|
| 005 Privacy notice | 1–1.5 | **1–1.5** | 0 · 0 · 0.25–0.5 · 0.5 · 0.25–0.5 | Nothing in `index.html`. Drawn at `req-005-011-mockup.html` 583–586. The page uses the shell |
| 006 Activity log | 2–2.5 | **1.75–2.25** | 0.25 · 0 · 0–0.25 · 1.25 · 0.25–0.5 | Port: the "Recent activity" list in `aDashOps()` 734 and the `.tbl` table. New: filters (drawn 590–592). BE: the log helper and its allow-list |
| 007 Dues and QR settings | 2.5–3 | **2.25–2.75** | 0.25 · 0.25 · 0 · 1.25–1.5 · 0.5–0.75 | Port: `aSet()` 865, "Dues & billing" form 869–875, "Payment QR code" card 876–877, `qrBlock()` 605. Extend: confirm a large change, replace the QR, read-only for the admin office, stale edit (drawn 595–599) |
| 008 Monthly billing run | 5–6 | **4.5–5.5** | 0.25 · 0.25–0.5 · 0.5 · 3–3.5 · 0.5–0.75 | Port: "Monthly billing" card in `aColl()` 801–802 and the `genBilling` confirm 1387–1388. Extend: the card states (603). New: opening balances, built on REQ-003's import preview (604). The billing worker, lease and resume are all BE |
| 009 Statement of account | 3 | **2–2.5** | 0.5 · 0.25–0.5 · 0 · 0.75–1 · 0.5 | Port: the statement table in `oDues()` 616–621, `dlButtons()` 994, `statementPDF()` 1014 layout with `pdfStart()` 1004, `statementCSV()` 1070. Extend: empty, loading, credit, part-paid and staff view (608–611). BE: the aging helper, embedded font, lazy PDF module |
| 010 Submit a QR payment | 4–5 | **3.75–4.75** | 0.25 · 0.75–1 · 0 · 2–2.5 · 0.75–1 | Port: "Pay with QR" form in `oDues()` 622–630, `qrBlock()` 605. Extend: compression, HEIC, retry, duplicate reference, saving and offline states (614–617). BE: callable, reservation, idempotency, rules, orphan job |
| 011 In-app notifications | 2 | **1.75** | 0.25 · 0.25 · 0 · 1 · 0.25 | Port: bell and panel in `headerHTML()` 557–559, `readAll` 1339. Extend: empty and error (623). BE: `notify()` helper, delete trigger, route allow-list |
| 046 Adjust or cancel a bill (draft) | 3.5–4.5 | **3.5–4.5** | 0 · 0.25 · 0.75–1 · 1.75–2.25 · 0.75–1 | Nothing in `index.html`. Extend: correction lines on REQ-009's statement. New: correct one bill, bulk preview and progress (46A–46C, not drawn yet). Uses the UI kit dialogs |
| **S2** | **23–27.5** | **20.5–25.5** | | Saves 2–2.5 |

### S3 · R1 (approved)

| REQ | Old | New | P · E · N · BE · T | Reuses |
|---|---|---|---|---|
| 012 Approve or reject a payment | 5–6 | **4.5–5.5** | 0.5 · 0.5 · 0 · 2.75–3.25 · 0.75–1.25 | Port: `aAppr()` 737, payments tab 741–745, the `reject` dialog with preset reasons 1374–1375, `proof` viewer 1368. Extend: phone cards, review one payment, conflicts, own household (`req-012-017-mockup.html` 568–574). BE: `decidePayment`, OR counter, totals |
| 013 Official receipt PDF | 2.5–3.5 | **2–3** | 0.25 · 0.25 · 0 · 1–1.75 · 0.5–0.75 | Port: `receiptPDF()` 1049 layout and `inWords()` 1042 to the function, `orBtn()` 1033, payment history 633. Extend: receipt errors, several months, new owner (578–581). `allocation()` 1034 is rebuilt (L-002) |
| 014 Void a payment | 2–2.5 | **2–2.25** | 0 · 0.25 · 0.25 · 1 · 0.5–0.75 | Nothing to port: the mock-up has no void. The void dialog uses `confirmBox()` 989. The voided PDF reuses REQ-013's layout. The recalculation is BE |
| 015 Homeowner dashboard | 1–1.5 | **0.75–1** | 0.25 · 0.25 · 0 · 0–0.25 · 0.25 | Port: `oDash()` 584–603 (overdue alert 592, tiles 593–598, announcements and recent payments 599–602). R1 shows the dues tiles only. Extend: credit, nothing yet, loading (588–591). The `openBills` summary is written by 008/012/014 |
| 016 Post an announcement | 1–1.5 | **0.75–1** | 0.25 · 0–0.25 · 0 · 0.25 · 0.25 | Port: `aNews()` 860–863, `oNews()` 710, `newsItem()` 604, `bannerHTML()` 566, `delNews` confirm 1408. Extend: "Show banner until", counters, failed post (595) |
| 017 Important on sign-in | 1–1.5 | **0.5–1** | 0.25 · 0–0.25 · 0 · 0–0.25 · 0.25 | Port: `signInPopup()` 572–580, `ackNews` 1365, the "Seen by n of m" line 862. Extend: several at once, Option B (602–605) |
| **S3** | **12.5–16.5** | **10.5–13.75** | | Saves 2–2.75 |

### S4 · R2 (drafts; old sizes are the BA's)

| REQ | Old (BA) | New | P · E · N · BE · T | Reuses |
|---|---|---|---|---|
| 018 Delinquent accounts | 1.5–2 | **1.25–1.5** | 0.25 · 0–0.25 · 0 · 0.75 · 0.25 | Port: "Delinquent accounts" table in `aColl()` 803–806, Delinquent and Good standing pills in `aHo()` 761. Extend: phone, empty, error, board read-only, grace setting (`req-018-027-mockup.html` 354–362) |
| 019 Email for key events | 2–3 | **2–3** | 0 · 0 · 0.5–0.75 · 1–1.5 · 0.5–0.75 | Nothing in `index.html`. The mail function comes from REQ-004, not counted again. New: email templates and email status (365–373) |
| 020 Send the next notice | 3–4 | **2.5–3.25** | 0.5 · 0.25–0.5 · 0 · 1.25–1.5 · 0.5–0.75 | Port: `letterHTML()` 811–826 (all four letters), `letterPDF()` 1074, preview dialog (`previewNotice` 1389), notice history 808–809, "Notices received" in `oDues()` 635, letter viewer 1394. Extend: withdraw, waiting for a deadline, stale preview (376–392). The letter text still needs the board's approval |
| 021 Bulk notices | 0.5–1 | **0.5–0.75** | 0 · 0.25 · 0 · 0.25 · 0–0.25 | Extend: select all at 805, `bulkNotice` 1392–1393, batch summary with skips (395–401) |
| 022 Record an expense | 2–3 | **1.75–2.5** | 0.25 · 0.25–0.5 · 0 · 0.75–1 · 0.5–0.75 | Port: Expenses tab in `aAcct()` 776–786 (table and form), `EXP_CATS` 375, receipt viewer 1368. Extend: void instead of delete (the mock-up's `delExpense` 1407 hard-deletes, which C5 changes), likely duplicate, closed month (404–412) |
| 023 Collections by month | 1–1.5 | **0.75–1** | 0.25 · 0–0.25 · 0 · 0.25 · 0.25 | Port: Collections tab in `aAcct()` 769–775, `monthSelect()` 764. Extend: the CSV, built on `toCSV()` 1003 and `saveFile()` 995 |
| 024 Fund summary and close | 2–3 | **1.75–2.75** | 0.25 · 0.25 · 0.25–0.5 · 0.75–1.25 · 0.25–0.5 | Port: Fund summary tab in `aAcct()` 787–793 (fund strip, "Where the money went"). New: close with a bank difference, reopen, settings (422–430). `fundFor()` 433 is rebuilt |
| 025 Admin dashboard | 0.5–1 | **0.5–0.75** | 0.25 · 0–0.25 · 0 · 0 · 0.25 | Port: `aDash()` 963, `aDashOps()` 722–735, `chartSVG()` 713. Extend: admin office view, failed panel (437–439). Reads totals kept by 018/023/024 |
| 026 Log a request | 1–1.5 | **0.75–1.25** | 0.25 · 0–0.25 · 0 · 0.25–0.5 · 0.25 | Port: `oReq()` 693–709 (list and form), `TIX_CATS` 376. Extend: withdraw, daily limit, the office logging for a household (442–450) |
| 027 Manage requests | 1–1.5 | **0.75–1.25** | 0.25 · 0–0.25 · 0 · 0.25–0.5 · 0.25 | Port: `aTix()` 827–832 (status chips and table), the `manageTicket` dialog 1396–1397. Extend: office-only notes, reopen, stale save (455–465) |
| **S4** | **14.5–21.5** | **12.5–18** | | Saves 2–3.5 |

### S5 · R3 (drafts; old sizes are the BA's)

| REQ | Old (BA) | New | P · E · N · BE · T | Reuses |
|---|---|---|---|---|
| 028 Register a vehicle | 1–1.5 | **0.75–1.25** | 0.25 · 0–0.25 · 0 · 0.25–0.5 · 0.25 | Port: `oVeh()` 676–692 (plate cards, form), `VEH_TYPES` 377, `removeVeh` 1379. Extend: plate already registered, remove an approved vehicle (`req-028-034-mockup.html` 548–551) |
| 029 Approve vehicle and sticker | 1.5–2 | **1.25–1.75** | 0.25 · 0.25 · 0 · 0.5–0.75 · 0.25–0.5 | Port: Vehicles tab in `aAppr()` 751–754, `approveVeh` 1373, reject presets 1375, OR/CR viewer 1368. Extend: new or existing sticker (559) |
| 030 Set up amenities | 1 | **0.75** | 0.25 · 0.25 · 0 · 0.25 · in BE | Port: "Amenity pricing" in `aSet()` 879–882. Extend: close an amenity with upcoming bookings (571) |
| 031 Book an amenity | 4–5 | **3.25–4.25** | 0.75 · 0.5–0.75 · 0 · 1.5–2 · 0.5–0.75 | Port: `oAmen()` 637–653, `calendarHTML()` 654, `slotPanel()` 664, fee box 672, "My bookings" 650. Extend: cards with fee states, slot just taken, loading and offline, pay the fee (574–586) |
| 032 Approve or reject a booking | 2–3 | **1.75–2.75** | 0.25 · 0.25–0.5 · 0 · 1–1.5 · 0.25–0.5 | Port: Bookings tab in `aAppr()` 746–750 (with the slot-conflict pill), `approveBook` 1371. Extend: upcoming list, someone else decided first (589–598) |
| 033 Cancel a booking | 1 | **0.75** | 0.25 · 0 · 0 · 0.25 · 0.25 | Port: Cancel button 651 and `cancelBooking` confirm 1378. The office cancel uses the same dialog from REQ-032's list |
| 034 Pause for overdue dues | 0.5–1 | **0.5–0.75** | 0.25 · 0 · 0 · 0.25 · 0–0.25 | Port: "Booking is paused" alert in `oAmen()` 644, the setting at `aSet()` 871, the dashboard line 592 |
| **S5** | **11–14.5** | **9–12.25** | | Saves 2–2.25 |

### S6 · R3 (drafts; old sizes are the BA's)

| REQ | Old (BA) | New | P · E · N · BE · T | Reuses |
|---|---|---|---|---|
| 035 Reports and CSV | 3–4.5 | **2.5–3.75** | 0.5 · 0.25–0.5 · 0 · 1.25–2 · 0.5–0.75 | Port: `aRep()` 851–858, `REPORTS` 833 and the column sets in `report()` 834–850 (six reports), `copyCSV` 1403. Extend: per-bill aging, empty, loading, error (`req-035-039-mockup.html` 503–507). The sums in `report()` are rebuilt as queries |
| 036 Request a record | 1 | **0.75** | 0.25 · 0 · 0 · 0.25 · 0.25 | Port: `oRec()` 1245–1269, `rrStepper()` 1240, `rrPill()` 1243 |
| 037 Fulfil or decline | 2.5–3 | **2–2.5** | 0.5 · 0.25 · 0 · 0.75–1.25 · 0.5 | Port: `aRrq()` 1270, `rrModal()` 1278–1290, the decline dialog (`declineRR` 1361–1362), `rrFile()` 1322, `expensesCSV()` 1320. Extend: replace a wrong file (524) |
| 038 Certificate of good standing | 1 | **0.75** | 0.25 · 0 · 0.25 · 0.25 · in BE | Port: `clearancePDF()` 1294 layout. New: the certificate register (529). The check and number are BE |
| 039 Board financial report | 3 | **3** | 0.5 · 0.5 · 0 · 1.5 · 0.5 | `finReport()` 915–962, `finCollectionsChart()` 902, `finPDF()` 1308. **No change:** the BA's 3 days already count these as reused ("report screen reusing the mock-up's charts") |
| **S6** | **10.5–12.5** | **9–10.75** | | Saves 1.5–1.75 |

### S7 · R4 gate add-on (drafts, blocked by D9; old sizes are the BA's)

| REQ | Old (BA) | New | P · E · N · BE · T | Reuses |
|---|---|---|---|---|
| 040 Create a guest pass | 1.5–2 | **1.25–1.5** | 0.25 · 0.25 · 0 · 0.5–0.75 · 0.25 | Port: `oPass()` 1146–1169, `guestRow()`/`vehRow()` 1170–1171, `passModal()` 1172, `passCardPng()` 1122, `qrCanvas()` 1119. `token()` 1093 is **not** reused: pass tokens are made on the server |
| 041 Cancel a guest pass | 0.5–1 | **0.5–0.75** | 0.25 · 0–0.25 · 0 · 0.25 · in BE | Port: the cancel confirm 1352. Extend: "someone tried to use it" (`req-040-045-mockup.html` 471) |
| 042 Guard verifies a pass | 2.5–3.5 | **2–3** | 0.5 · 0.25–0.5 · 0 · 0.75–1.25 · 0.5–0.75 | Port: `gScan()` 1177–1190, `decodeQR()` 1145, `passResult()` 1191–1209 (verdicts). Extend: `BarcodeDetector`, checking, no connection, camera blocked (475). `lookupPass()` 1139 is rebuilt as a function. Not counted: a staff page if each guard has an account (REQ-002 Option A, no size yet) |
| 043 Check guests in and out | 1.5–2 (Option A) | **1.25–1.5** | 0.25 · 0.25 · 0 · 0.5–0.75 · 0.25 | Port: check-in in `passResult()`, `checkOut` 1354, `gInside()` 1211. Extend: already inside and other refusals (479) |
| 044 Visitor and scan logs | 1–1.5 | **0.75–1** | 0.25 · 0–0.25 · 0 · 0.25 · 0.25 | Port: `aVis()` 1213–1234, `gLog()` 1212, `visitRows()` 1210, `scanRows()` 1138 |
| 045 Delete ID photos | 0.5–1 | **0.5–0.75** | 0.25 · 0 · 0 · 0.25–0.5 · in BE | Port: gate settings in `aSet()` 883–887. The manual `purgeIds` 1356 becomes a scheduled job, which is BE |
| **S7** | **7.5–11** | **6.25–8.5** | | Saves 1.25–2.5 |

## 6. Proposed change to the release plan (not applied)

When the owner approves, replace these in `docs/backlog/RELEASE-PLAN.md`:

**Size line above the table:**

> Size in build days with Claude Code. Each size reuses the mock-up's screens (L-006, `docs/architecture/REVIEW-sizing-reuse.md`). S1–S3 and REQ-046 are Sol Arch's. S4–S7 are the BA's estimates with reuse applied. Sol Arch has not reviewed those yet.

**Size column:**

| Sprint | Now | Proposed |
|---|---|---|
| S1 | 6–10 | **16–22.25** (Sol Arch, with reuse) |
| S2 | 23–27.5 (Sol Arch, incl. REQ-046) | **20.5–25.5** (Sol Arch, with reuse, incl. REQ-046) |
| S3 | 12.5–16.5 (Sol Arch) | **10.5–13.75** (Sol Arch, with reuse) |
| S4 | 11–18 | **12.5–18** (BA, with reuse) |
| S5 | 8.5–14 (BA: 11–15) | **9–12.25** (BA, with reuse) |
| S6 | 7–11 | **9–10.75** (BA, with reuse) |
| S7 | 9.5–15 (BA: 7–11 plus staff page) | **6.25–8.5** (BA, with reuse; plus staff page) |

**Total line:**

> Total: 46 requirements, about **84–111 build days** (R1 47–61.5). This counts the mock-up's screens as existing UI. S4–S7 may go up when Sol Arch reviews them. S2 is the largest sprint, then S1. S4 can still be split into S4a (018–021) and S4b (022–027) if needed.

(The current text says S4 is the largest sprint. That is true only of the backlog sizes. With the reviewed sizes, S2 and S1 are larger.)

**Change log entry:**

> 2026-11-28: Sol Arch re-sized REQ-001 to REQ-046 to reuse the mock-up (L-006): 96–127 → 84–111 days. The old headline "60–96" was stale. S1 now uses Sol Arch's reviewed sizes instead of the backlog's.

**`release-plan.html`** shows sizes in the `size:` field of each sprint (lines 120–126) and in the footer (line 106). Same values as above. Proposed footer:

> Sizes are build days with Claude Code and reuse the mock-up's screens. S1–S3 are Sol Arch's sizes. S4–S7 are the BA's estimates with reuse applied and are not yet reviewed. Source: docs/backlog/RELEASE-PLAN.md.

The published chart (artifact `7w7BnKMcwfgG1FnUjM9thy`) would be republished from the updated file.

## 7. Proposed SA-001 r4 note for §12 (not applied; SA-001 is Final)

> **r4 note on sizes (2026-11-28).** The per-REQ sizes now reuse the mock-up's screens (L-006; `REVIEW-sizing-reuse.md`). All 46 REQs add up to about **84–111 person-days** (phase 1, REQ-001 to REQ-004: 16–22.25). Before reuse they added up to 96–127. Area J ("connecting the frontend to the backend", 4–7) is now inside each REQ's port and extend lines, plus the shell port in REQ-002. Do not add J on top. Areas I (hardening, 3–5) and K (regression, pilot, onboarding, 7–10) are not in any REQ and still come on top: about **94–126** in all, excluding data migration (R-8).

## 8. Proposed "Reuses:" lines in the approved REQs (not applied)

The rule asks every Size section to carry a "Reuses:" line. REQ-001 to REQ-017 are approved, so the lines in §5 are proposed and not written into them. On the owner's OK, the BA (or Sol Arch) adds each REQ's §5 "Reuses" cell to that REQ's Size section as a new revision with the corrected size. The drafts (REQ-018 to REQ-046) can take theirs at the next revision without extra approval.

## 9. Risks and open questions

| # | Item | Effect |
|---|---|---|
| 1 | S4–S7 are BA estimates. Sol Arch reviews of S2–S3 came in above the BA | S4–S7 may go up by more than the reuse saving |
| 2 | Port UI is sized at about a third of new. That assumes `lit-html` templates keep the mock-up's markup almost as it is (SA-001 §9) | If the markup is restructured for accessibility or SonarQube, ports cost more |
| 3 | The mock-up's screens are desktop-first tables. Many REQs want phone cards | Counted as Extend. Where a REQ wants cards everywhere, port is closer to new |
| 4 | Staff page for guard accounts (REQ-002 Option A) has no size | S7 is missing it |
| 5 | REQ-046's screens are not drawn yet | Its UI is sized as new, so its size holds |
| 6 | Owner: should the release plan show Sol Arch's S1 sizes (16–22.25), not the backlog's 6–10? | This review proposes yes |

## 10. Approval

Draft. Nothing in §6, §7 or §8 is applied until the owner writes "APPROVED — FINAL".
