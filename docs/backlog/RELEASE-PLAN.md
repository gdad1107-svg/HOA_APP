# HOA Portal Release and Sprint Plan

| | |
|---|---|
| Owner request | "this session will monitor the backlog. I need you to plan and monitor the releases … Let's do release and sprints. R1 sprint 1 will cover 1-4, sprint 2 will cover 5-11 and so on" (2026-11-28) |
| Last updated | 2026-11-28 |
| Chart | [release-plan.html](release-plan.html) · published (private): https://claude.ai/artifact/7w7BnKMcwfgG1FnUjM9thy |
| Source of truth | This file. The chart is redrawn from it. |

Sprints are numbered straight through all releases. Each sprint is one requirement batch, as the BA wrote them.

## Stages a requirement goes through

1. **Drafted** by the BA
2. **Owner approved**
3. **Sol Arch reviewed**
4. **QA test plan** written
5. **Built** by Dev, passing the SonarQube gate
6. **Tested** by QE
7. **Released**

## Releases and sprints

Size in build days with Claude Code: S = 0.5–1, M = 2–3, L = 4–6 (from the backlog; Sol Arch has not confirmed them).

| Sprint | Release | REQs | Stories | Size (days) | Stage now | Blocked by |
|---|---|---|---|---|---|---|
| S1 | R1 Pay dues online | 001–004 | Sign in, roles, household directory, invitations | 6–10 | Owner approved, Sol Arch reviewed. **QA test plans in progress** (TC-01 to TC-04 are stubs) | — |
| S2 | R1 | 005–011, 046 | Privacy notice, activity log, dues and QR settings, billing run, statement, submit payment, notifications, adjust or cancel a bill (046) | **23–27.5** (Sol Arch, incl. REQ-046) | 005–011 **owner approved** 2026-11-28 ("Approve all as shown"), Sol Arch's changes applied. Next: QA test plans. REQ-046 is a draft | REQ-046 approval and Sol Arch review; treasurer: do e-wallet reference numbers repeat (before build); DPO confirms P1 and the notice text |
| S3 | R1 | 012–017 | Approve or reject payment, official receipt, void, homeowner dashboard, announcements, sign-in pop-up | **12.5–16.5** (Sol Arch) | **Owner approved** 2026-11-28 ("Approve all as shown"; REQ-013 #3 as Sol Arch proposed), Sol Arch's changes applied. Next: QA test plans | 6 new owner questions (REQ-012 #7, 014 #7–8, 016 #6–7, 90-day banner limit); board names the 2nd treasurer; D5 before go-live |
| S4 | R2 Collect and account | 018–027 | Delinquent list, email, notices, bulk notices, expenses, collections, fund summary and close, admin dashboard, requests | 11–18 | Drafted, awaiting owner review | D2, email provider (SA-001 Q7), board-approved letter texts |
| S5 | R3 Community services | 028–034 | Vehicles, stickers, amenities, booking, approval, cancel, pause for overdue | 8.5–14 (BA: 11–15) | Drafted, awaiting owner review | D7 |
| S6 | R3 Records and reports | 035–039 | Reports and CSV, record requests, fulfil, good standing certificate, board financial report | 7–11 | Drafted, awaiting owner review | D6 |
| S7 | R4 Gate add-on | 040–045 | Guest passes, cancel, guard verifies, check in/out, logs, ID photo deletion | 9.5–15 (BA: 7–11 plus staff page) | Drafted. **Whole release blocked** | D9, DPO on ID photos |

Total: 45 requirements, about 60–96 build days. S4 is the largest sprint. If it runs long, split it into S4a (018–021, collections) and S4b (022–027, accounting and requests).

## Conflicts between drafts

Reconciled by the BA on 2026-11-28 (r2 of each REQ). Each rule is a recommendation awaiting owner approval; C2–C5 also need Sol Arch to confirm because they depart from SA-001.

| # | Conflict | Rule now in the drafts | REQs | Still needs |
|---|---|---|---|---|
| C1 | Voiding a payment from a closed month | A void is a minus line in the month it is made; the receipt's month never changes, so no reopening | 014, 023, 024 | Owner; accountant |
| C2 | Amenity fees in the payment flow | REQ-010 adds a payment `kind` (always `dues` in R1); REQ-031 owns the `amenityFee` extension | 010, 031 | Owner; Sol Arch (SA-001 §4.2) |
| C3 | When an amenity fee counts as collected | In the month the treasurer approves the fee payment; approving a booking adds nothing | 023, 031, 032 | Owner; Sol Arch (SA-001 Flow 2) |
| C4 | Overdue standing going stale | Worked out when read, from unpaid due dates vs today in Manila; no nightly job | 018, 034 | Owner; Sol Arch (stored `standing`) |
| C5 | Notices and expenses vs SA-001 §8.1 | Notices treasurer only; expenses saved through a server function | 020, 022 | Sol Arch |

Follow-ups: the 012–017 and 018–027 mockups still show the old void and month-close wording. GLOSSARY "Fee" updated to match C3.

## Gaps the BA found

- No story to correct or cancel a wrong bill. BA recommends adding it to S2 (size M).
- A staff and roles page (deferred by REQ-002 to R4) is needed if each guard gets their own account. No REQ number yet.

## Decisions open

| # | Decision | Blocks |
|---|---|---|
| P1 | Privacy after a lot sale (REQ-004 decision 5) | S2 (REQ-010), S3 |
| D2 | Late penalty, interest and grace period | S2, S3, S4 |
| D5 | BIR official receipt vs invoice for dues | S3 (REQ-013, 014) |
| D6 | Board report typed in or calculated | S6 (REQ-039) |
| D7 | Amenity fee paid with request or after approval | S5 (REQ-031, 032) |
| D8 | Billing run manual or automatic | S2 (REQ-008) |
| D9 | Gate add-on in scope | S7 |
| DPO | Name a Data Protection Officer | S2 (REQ-005), S5 (REQ-028), S7 (REQ-043) |

## Change log

- 2026-11-28: owner decided "Received from" on receipts: "Sol Arch: at submission" (REQ-013 #6; REQ-010 r7, REQ-012 r5, REQ-013 r5). Rejected reference numbers are deleted on reject, never on void, now consistent across REQ-010, 012 and 014.

- 2026-11-28: owner approved S2 (REQ-005–011) and S3 (REQ-012–017): "Approve all as shown". The BA applied Sol Arch's changes. REQ-046 Adjust or cancel a bill added to S2 as a draft. Approved S1 REQs need small follow-ups: the treasurer reads `users` (REQ-005 → REQ-001 rules), households get `billedThrough` (REQ-008 → REQ-003), and TC-03 must cover it.

- 2026-11-28: plan created. REQ-005 to REQ-045 drafted by the BA.
- 2026-11-28: Sol Arch reviewed S2 and S3 (supports A with changes for all 13). R1 re-sized to about 38–50 days plus 3–4 for the bill-correction story. SA-001 follow-ups listed in each REQ's Sol Arch review; SA-001 not yet updated.
- 2026-11-28: BA reconciled conflicts C1–C5 (r2 of REQ-010, 014, 018, 020, 022, 023, 024, 031, 032, 034).
