# Gap answers: TC-05 to TC-11

| | |
|---|---|
| Raised by | QA, "Requirement gaps for the BA" in TC-05 to TC-11 (S2/S3 test plans, approved by the owner 2026-11-28: "Approve, send gaps") |
| Answered by | Business Analyst (owner of REQ-001 to REQ-011 and REQ-046), 2026-11-28 |
| Result | 108 gaps: **105 answered** in the REQ text, **3 sent to the owner** as new numbered decisions (REQ-008 #7, REQ-010 #7, REQ-010 #8), all **approved as recommended** ("Approve all", 2026-11-28; REQ-010 #7 still for the DPO to confirm). REQ-008 r6, REQ-010 r9 |
| REQ revisions | REQ-005 r5 · REQ-006 r5 · REQ-007 r5 · REQ-008 r5 · REQ-009 r5 · REQ-010 r8 · REQ-011 r5. Follow-ups: REQ-001 r5 · REQ-002 r4 · REQ-003 r5 · REQ-004 r4 |

Each REQ has an "r5 gap answers" section (REQ-010: "r8 gap answers") with the full rule, and its Gherkin carries the new scenarios tagged `@r5-new` (`@r8-new` in REQ-010) and changed ones `@r5-changed`. "Sol Arch" marks an answer that needs a technical confirmation on Sol Arch's next pass. REQ-046 needed no change from these gaps (TC-09 G-8 and G-13 are answered in REQ-009 with REQ-046's existing copy).

## TC-05: Privacy notice (REQ-005 r5)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | REQ-001's create-only rule stands; one update clause for `privacyAck` only; `privacyAck` never in the create; `phone` dropped; create-if-missing runs before the gate. Treasurer reads `users` | REQ-005 r5, REQ-001 r5 |
| G-2 | Rule checks `privacyAck` holds only `seq`, `label`, `at`, and `label` equals the version's label (Sol Arch) | r5 |
| G-3 | Footer names the version actually read ("You read version 1 on …; version 1.1 corrects small details…"); optional "I've read version {label}" button | r5 |
| G-4 | Minor-behind keeps "v{ack} read {date}"; material-behind "v{ack} read {date} · v{label} not read yet"; never "not read yet"; approved scenario reworded to "never acknowledged" | r5 |
| G-5 | First-time heading "Privacy notice", no "What changed" | r5 |
| G-6 | Bullets of every material version after the acknowledged one, newest first; minor bullets not shown; never on the account menu view | r5 |
| G-7 | New public field `privacyNotices/{seq}.officeContact`, per project, so per HOA | r5 |
| G-8 | Re-acknowledging the same version is refused; the first date stands; the app treats it as success | r5 |
| G-9 | Next open or reload; no mid-session interruption | r5 |
| G-10 | "What's your name?" (when needed) → notice → asked-for page | r5, REQ-001 r5 |
| G-11 | Publish script refuses an effective date after today; published on the effective day | r5 |
| G-12 | Script refuses existing seq, gaps, reused label, future date, empty sections, material without 2–5 bullets, empty contact | r5 |
| G-13 | REQ-001 wins: back to the page asked for | r5 |
| G-14 | Privacy notice first, then REQ-017's pop-up (for the REQ-017 BA to mirror) | r5 |
| G-15 | 15-second limit with its own message; later retry counts as success | r5 |
| G-16 | Banner shows on the signed-in notice page, not the signed-out view | r5, REQ-001 r5 |
| G-17 | No version published: no gate, "not published yet" line, no directory line, monitoring event; go-live checklist publishes v1 before the first invitation | r5 |

## TC-06: Activity log (REQ-006 r5)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | Board R1 menu: Dashboard, Collections, Announcements (S3), Activity log | REQ-006 r5, REQ-002 r4 |
| G-2 | Sentence and type table for every R1 code | r5 |
| G-3 | One `invite.created` per household ("printed an invite slip for {lot}") | r5 |
| G-4 | Payee name and account label with old and new values (REQ-007 wins) | r5 |
| G-5 | Payment instructions: field name only | r5 |
| G-6 | "1 entry"; "No activity for {lot} yet."; "No activity matches these filters." | r5 |
| G-7 | Type fixed per code (member/redeem: Invitations; import: Households; opening, start-at-zero, corrections, go-live: Billing) | r5 |
| G-8 | `auditActors/{uid}` kept by the audit helper, includes former staff and the developer (Sol Arch) | r5 |
| G-9 | Three indexes added; no combination refused | r5 |
| G-10 | Suggestions from `lots` (no names), now readable by the board; typed lot looked up, refused if missing | r5, REQ-003 r5 |
| G-11 | Manila whole days, inclusive; one end allowed; nothing after today; From-after-To message | r5 |
| G-12 | Audit helper built in S1 with `setRole`, so no old-shape entries; staging reset before S2 | r5 |
| G-13 | Filter by household id: both labels' entries under the current label; each keeps its own label | r5 |
| G-14 | Filters in memory for the visit, cleared on reload, never in the address | r5 |
| G-15 | "Recent activity" card not built in R1 (story 25, R2) | r5 |
| G-16 | No live updates; read on open, filter, paging, retry | r5 |

## TC-07: Dues and payment settings (REQ-007 r5)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | First upload alerts like a replacement, self-alert, logged `settings.qrReplaced` with `before: null` ("set up the payment QR code") | r5 |
| G-2 | Toast names `config/billing.firstPeriod`, else "the first billing run" | r5 |
| G-3 | Homeowner sub-heading shows the latest billed rate plus "{new} from {next period}" | r5, REQ-009 r5 |
| G-4 | One entry per changed field, same transaction | r5 |
| G-5 | "No changes to save."; nothing written | r5 |
| G-6 | Both directions; strictly more than 25%; first save always asks | r5 |
| G-7 | Shared `parsePesos()`: thousands commas, "₱", spaces accepted; exponent refused | r5 |
| G-8 | Payee required every save (1–80), label ≤ 60, instructions ≤ 500, trimmed; copy added | r5 |
| G-9 | 2 MB = 2,097,152 bytes, inclusive, everywhere | r5 |
| G-10 | Trimmed, case-insensitive | r5 |
| G-11 | Not detected; whole image shown with a hint; read-back uses the first code | r5 |
| G-12 | No live update; next open; payment records the QR shown | r5 |
| G-13 | Allowed with alerts (the undo path); refused if current or someone else's | r5 |
| G-14 | Callable checks the PNG/JPEG signature (Sol Arch) | r5 |
| G-15 | `config/settings` has a closed key list; dues and QR never read from it | r5 |
| G-16 | Intended: no personal data, given to every household | r5 |
| G-17 | Exactly 168 hours is kept | r5 |
| G-18 | In-app "Leave without saving?" prompt; browser warning on close | r5 |
| G-19 | Board alert opens the Activity log, type Settings | r5, REQ-011 r5 |
| G-20 | Escape closes only while nothing is chosen or typed; then only Cancel | r5 |

## TC-08: Monthly billing run (REQ-008 r5)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | Board R1 menu gains Collections (read-only) | r5, REQ-002 r4 |
| G-2 | Stale household count refused; worker bills only households with `activeSince` before the run (Sol Arch) | r5, REQ-003 r5 |
| G-3 | Next run refused until each late addition is decided; preview lists them | r5 |
| G-4 | **Owner decision #7 in REQ-008, approved** ( keep the period's due date, warn in the preview) | r5 |
| G-5 | Reminder also on a stopped run, own text and id | r5 |
| G-6 | Yes, the same "statement is ready", once | r5 |
| G-7 | The period's run snapshot rate | r5 |
| G-8 | Yes, same transaction; credit lowers the balance only; not in month totals | r5 |
| G-9 | CSV only, REQ-003 file rules; columns Block, Lot, Amount, Months owed | r5 |
| G-10 | 0.00 accepted (no line); shared parser with minus; cap ₱1,000,000.00; months owed whole 0–999, not with credit; deactivated loaded, marked | r5 |
| G-11 | Disabled with a reason; server refuses the first run without the choice | r5 |
| G-12 | Refused by the server too, no run record | r5 |
| G-13 | Developer script on the owner's written approval, audited `billing.goLive`; guard covers runs, continue, late bills, skip | r5 |
| G-14 | Singular, plural and zero copy given | r5 |
| G-15 | Confirmed: no billing notification | r5 |
| G-16 | Runs and month totals: treasurer, board; config: + admin office; homeowners and guards none | r5 |
| G-17 | Back-fill script plus a zero-missing data check; QA's "field added for a query" pattern passed to Sol Arch | r5, REQ-003 r5 |
| G-18 | Late bill increments the month total in its transaction (Sol Arch) | r5 |

## TC-09: Statement of account (REQ-009 r5)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | Reason on `payments/{id}` (household-visible), as REQ-012 and REQ-014 say | r5, REQ-010 r8 |
| G-2 | Not applied to the viewer's own submissions (REQ-013 decision 5) | r5 |
| G-3 | "Show older payments"; "No payments yet. Payments you submit appear here." | r5 |
| G-4 | A totals change re-reads the first page of payments | r5 |
| G-5 | Same refresh for bills and corrections; mismatch reported only if it survives a second refresh; midnight timer (Sol Arch) | r5 |
| G-6 | "1 period overdue"; months only; opening line is "an earlier balance" | r5 |
| G-7 | Statement keeps "₱x credit"; tile and receipt keep their own copy (agreed with the S3 BA) | r5 |
| G-8 | One "Corrected: {signed amount} ({reason})" line per correction from `billAdjustments`; approved scenario now shows the reason | r5 |
| G-9 | Dues list queries `kind == dues` only | r5 |
| G-10 | Date paid | r5 |
| G-11 | Opening line counts as one line | r5 |
| G-12 | PDF lists periods and balance only, no payments, no names | r5 |
| G-13 | Treasurer sees "Correct this bill" (REQ-046); nobody changes a payment from it | r5 |
| G-14 | Staff see full details within their role, no label | r5 |
| G-15 | `#/dues` and `#/homeowners/{householdId}/statement` (opaque id); homeowners refused on the staff route | r5 |
| G-16 | **Owner decision #7 in REQ-010, approved: accept** (DPO to confirm) | REQ-010 r8 |

## TC-10: Submit a QR payment (REQ-010 r8)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | Void: same dated message as approved for the same lot | r8 |
| G-2 | Refused with the undated message, not repaired, reported | r8 |
| G-3 | **Owner decision #8 in REQ-010, approved**: no R1 submitter detail screen; promise dropped | r8 |
| G-4 | Empty amount, "{amount} is already awaiting approval…"; no "don't owe" line | r8 |
| G-5 | REQ-012's to decide; REQ-010 now asserts only Approvals lists it and the bell is live | r8 |
| G-6 | 15,728,640 bytes, inclusive | r8 |
| G-7 | Accepted through the shared parser | r8 |
| G-8 | Exactly 90 days accepted | r8 |
| G-9 | Counted after normalising; 60 typed characters at most | r8 |
| G-10 | Amount, reference, date kept in `sessionStorage`; screenshot asked again | r8 |
| G-11 | "You're no longer linked to this lot…" | r8 |
| G-12 | "Online payment isn't set up right now…" | r8 |
| G-13 | Submitter not notified of her own payment | r8 |
| G-14 | No route and, from r8, no access (TC-04-L5) | r8 |

## TC-11: In-app notifications (REQ-011 r5)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | REQ-011's catalogue wins (REQ-012 r7 aligned to it); later-joined members get the "made before you joined" approval and no rejection | r5 |
| G-2 | Voided rows added: members, later-joined members, board (if REQ-014 #8) | r5 |
| G-3 | "Notifications, more than 9 unread" | r5 |
| G-4 | Note only when more than 30 exist (listener limit 31) | r5 |
| G-5 | "There's an update about your account."; marked read; reported | r5 |
| G-6 | One bell; pressing an item switches to its view | r5 |
| G-7 | Same Manila date 12 months on is kept; deleted the next day | r5 |

## S1 follow-ups

| Follow-up | Done |
|---|---|
| REQ-001 makes `users` create-only, but REQ-005 needs an update and a treasurer read | REQ-001 r5 "Follow-up from REQ-005": one `privacyAck`-only update clause, treasurer read, page order, banner on the notice page. REQ-005 r5 Data changes reconciled (no `phone`) |
| REQ-003 must set `billedThrough: ""` on households (REQ-008) | REQ-003 r5: `createHousehold` and `commitHouseholdImport` set it; plus `activeSince` (create, import, reactivate) and board read of `lots`. Add to TC-03 |

## Changes requested by the S3 BA (GAP-ANSWERS-TC-12-17)

| REQ | Change | Done |
|---|---|---|
| REQ-010 | Rejection reason from `paymentPrivate` to `payments/{id}` | r8 |
| REQ-010 | `updatedAt` on the payment summary, set by every writer | r8 |
| REQ-010 | Drop "a removed owner keeps own screenshots"; submitter reads need a current membership (TC-04-L5) | r8 |
| REQ-011 | Rows: approved and voided "made before you joined", voided (members), voided (board, if REQ-014 #8); who gets "Receipt ready" and rejections | r5 |
| REQ-009 | Receipts note only once the lot has a void; "Rejected: / Void: {reason}" rows, hidden on "Made before you joined" rows | r5 |
| REQ-006 | "Announcements" type, filter and three sentences | r5 |
| REQ-002 | Board R1 menu: Announcements (read-only) and Activity log | r4 |
| REQ-011 | Catalogue row for the staff alert of a new announcement (REQ-016 decision 7, approved): "{name} posted an announcement: {title}. If you didn't expect this, contact the board.", to the other admins and treasurers, opens Announcements | r6 |
| REQ-004 | `redeemInvite` and `removeMember` keep `memberOf/{uid}`; owner on file updated before inviting a new owner (if REQ-013 #8 (a)) | r4 |
