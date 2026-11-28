# Gap answers: TC-12 to TC-17

| | |
|---|---|
| Raised by | QA, "Gaps for the BA" in TC-12 to TC-17 (S2/S3 test plans, approved by the owner 2026-11-28: "Approve, send gaps") |
| Answered by | Business Analyst (owner of REQ-012 to REQ-017), 2026-11-28 |
| Result | 73 gaps: **71 answered** in the REQ text, **2 sent to the owner** as new decisions (REQ-013 #8, REQ-016 #8), both approved as recommended on 2026-11-28 ("Approve all") |
| REQ revisions | REQ-012 r7 · REQ-013 r6 · REQ-014 r7 · REQ-015 r5 · REQ-016 r5 · REQ-017 r5 |

Answers follow approved decisions, Sol Arch's design (notably REQ-009 r3: no per-bill paid amounts) and UX practice. Where an answer needs a change in REQ-001 to REQ-011, it is marked **"Other BA"** and is listed at the end. Where it needs a technical confirmation, it is marked **"Sol Arch"**.

## TC-12: Approve or reject a payment (REQ-012 r7)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | The rejection reason is stored on `payments/{id}` (household-readable), not in `paymentPrivate`. Every linked member gets it in the notification anyway, and the spouse's history shows "Rejected: {reason}". "Made before you joined" rows hide it. **Other BA:** REQ-010 to drop "rejection reason" from `paymentPrivate` | r7 |
| G-2 | No per-bill paid amounts. `decidePayment` reads all bills, raises `households.paidCentavos` and recalculates `balanceCentavos` and `openBills` with `ledger.js`. The receipt's lines are the difference between the allocation before and after. Bills are never written. REQ-015's `openBills` stays: it is a household-level summary, not a per-bill field | r7 |
| G-3 | REQ-011's catalogue wins. REQ-012's scenarios and copy now use "Payment approved: {amount} (ref …{last 4}). Receipt {OR no.} is being prepared." and "Payment of {amount} (ref …{last 4}) wasn't approved: {reason}" | r7 |
| G-4 | Members linked after the payment was submitted get "A payment of {amount} made before you joined was approved. Your balance is updated." (no reference, no receipt number), no "Receipt ready", and no rejection notice. **Other BA:** REQ-011 catalogue row | r7 |
| G-5 | Each screen uses its own copy of record: statement "₱x credit" (REQ-009), dashboard tile "₱0.00" plus "₱x credit" (REQ-015), receipt "₱x credit" (REQ-013). The wrong REQ-013 citation is removed | r7 |
| G-6 | "This payment was approved and then voided by {name}. Nothing was changed." (scenario added) | r7 |
| G-7 | Both approve and reject are refused for `kind != dues`. The queue lists only dues payments, so a seeded non-dues record never appears. It is a data error for the developer | r7 |
| G-8 | An approval in a closed month gets "Couldn't approve. The month has just closed. Try again." A rejection writes no monthly total, so it skips the check (two scenarios added) | r7 |
| G-9 | The badge counts every pending dues payment, including the treasurer's own household's, so it equals the list length. It is a count query refreshed on menu load, on page change and after each decision, not a live listener | r7 |
| G-10 | Shown as typed (it matches the screenshot). "Copy" copies the normalised form for the collection account's search | r7 |
| G-11 | Load failure: "Couldn't load the payments. Check your connection and try again." with "Try again". Reject failure: "Couldn't save. Nothing was rejected. Check your connection and try again." The dialog stays open with the reason kept | r7 |
| G-12 | The field is renamed "Balance now" (the stored balance), with "Also awaiting approval from this lot: {amount}" when other payments from the lot are pending | r7 |
| G-13 | Yes. The next screen opens the oldest payment this treasurer can decide (it skips their own household's and ones they submitted). If none is left, the list opens | r7 |
| G-14 | "Submitted by mistake" is added as a fourth preset reason | r7 |
| G-15 | In R1 only another decision changes a pending payment (that case is check 3). Check 4 guards later writers. QA tests it by seeding `updatedAt` in the emulator. Copy: "This payment changed since you opened it. Check it again, then decide." Every payment writer sets `updatedAt`. **Other BA:** REQ-010 to list `updatedAt` | r7 |
| G-16 | Monday to Friday, Asia/Manila. The marker shows from 12:00 AM on the third working day after the submission day. Public holidays are not excluded in R1 (the marker may appear early, which is harmless). Scenario added | r7 |
| G-17 | The review shows "You no longer have the treasurer role, so nothing was changed." Then REQ-002's no-access page replaces Approvals within a minute | r7 |
| G-18 | A read-only review shows the outcome line (approved, rejected or void, by whom, when, with the reason) and "Back to payments to approve". An approved payment shows "Void" (REQ-014). An unknown id shows "This payment can't be found." | r7 |

## TC-13: Official receipt PDF (REQ-013 r6)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | Sent once (id `rcpt_{orNo}_{uid}`) when the issued file first becomes ready, including after a sweep retry. It goes to each linked member who may download the receipt. It is never sent for a failed file or for the void file. Scenarios, Data row and copy added | r6 |
| G-2 | New Settings switch `printNotBirNotice` (default off), copied into the snapshot. It prints "This is not a BIR official receipt or invoice." on new receipts only | r6 |
| G-3 | "One Peso Only", "One Peso and 25/100 Only", "Zero Pesos and 50/100 Only", hyphenated 21–99 ("Ninety-Nine"), no "and" between hundreds and tens. Scenario Outline added | r6 |
| G-4 | The warning is a line on the approval toast for every approval at or above 95%, plus a banner on Approvals for every treasurer until a new range is set. It is computed as `(next − rangeStart) ≥ 0.95 × (rangeEnd − rangeStart + 1)`, with `rangeStart` added to `counters/or`. **Sol Arch:** name the staff-readable flag | r6 |
| G-5 | Yes. The snapshot also holds the HOA name, the payee and the approver's display name at approval, so a late re-render prints the same thing (scenario added) | r6 |
| G-6 | The same "Made before you joined" label as REQ-009 and REQ-010. Such rows show no receipt number, reason or reference | r6 |
| G-7 | **Owner decision #8 in REQ-013**, approved (a) 2026-11-28 | r6, r7 |
| G-8 | TC-04-L5 wins. `getReceiptUrl` requires a **current** membership even for the submitter, so a removed person loses every receipt (scenario added). **Other BA:** REQ-010's "a removed owner keeps access to their own screenshots" and its `paymentPrivate` "submitter" read rule conflict with TC-04-L5 too | r6 |
| G-9 | After a void the row shows "Void" with a disabled "Preparing receipt…" (the payment's `receiptPdfStatus` returns to `preparing`). On failure: "{OR no.} is void, but the void copy of the receipt isn't ready yet. Try again later, or contact the admin office." `getReceiptUrl` refuses homeowners and never falls back to `issued.pdf` | r6 |
| G-10 | "Add a receipt title" (also for spaces only). Maximum 60 characters: "Receipt title can be up to 60 characters" | r6 |
| G-11 | `width` is a minimum. OR-99999 is followed by OR-100000, with nothing skipped. Anything that orders receipts sorts by number, not by the document id | r6 |

## TC-14: Void an approved payment (REQ-014 r7)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | The household paid-total design is built. A void lowers `households.paidCentavos` by the amount and recalculates `balanceCentavos` and `openBills` from all bills. Bills are never written. Oldest-first holds because every screen derives each bill's paid amount from the total | r7 |
| G-2 | Under 5 characters, "Void payment" stays disabled and "Write at least 5 characters." shows on leaving the box. The counter reads "{n}/200" and input stops at 200 | r7 |
| G-3 | Rows for REQ-011: "Payment voided: {amount}, {OR no.}. Reason: {reason}." (opens Dues & Payments), the "made before you joined" variant (opens Dues & Payments), and the board row if decision 8 is accepted (opens Activity log, Payments). **Other BA:** REQ-011 catalogue; REQ-002 board menu needs Activity log | r7 |
| G-4 | The same treasurer retrying sees the success toast, as in REQ-012. Only a void by someone else shows the conflict. Scenario added | r7 |
| G-5 | Only once the lot has at least one voided payment. **Other BA:** REQ-009's statement copy should carry the note and its condition | r7 |
| G-6 | Same answer as TC-13 G-9 ("Preparing receipt…", the failure message, refusal with no fallback) | r7 |
| G-7 | Two buttons on the treasurer's payment detail: "Receipt PDF (void copy)" and "Original as issued" | r7 |
| G-8 | No. A pre-link row reads "Void · Made before you joined", with no reason and no receipt number | r7 |
| G-9 | "You submitted this payment. Another treasurer must void it." (and "…must decide it." in REQ-012) | r7 |
| G-10 | Voided as usual (the books must be corrected). Scenario added | r7 |
| G-11 | While the lot is still in credit: "{OR no.} is void. {lot} now has {amount} credit." The dialog's "goes back up by {amount}" is unchanged | r7 |
| G-12 | Yes. The shared row shows "Void: {reason}" on the dashboard (REQ-015 r5 scenario) | r7 |

## TC-15: Homeowner dashboard (REQ-015 r5)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | The first word of `users/{uid}.name` (typed at account creation, or taken from the Google profile). With no name, the heading reads "Welcome back" | r5 |
| G-2 | The earliest due date among open bills not yet due. When every open bill is overdue, "Was due {earliest unpaid due date}" | r5 |
| G-3 | Yes, both: "₱0.00", "You are fully paid" and "₱x awaiting approval" | r5 |
| G-4 | Credit wins: "₱0.00" and "₱x credit", not "No dues billed yet" | r5 |
| G-5 | Always shown (paying ahead is allowed), unless the QR isn't set up or the lot is inactive (REQ-010) | r5 |
| G-6 | Overdue bills only. Scenario: October and November overdue plus December current gives "2 months overdue · ₱3,600.00", the tile shows ₱5,400.00 and "Due Dec 31, 2026" | r5 |
| G-7 | The shared row reads "Pending approval / Approved · {OR no.} / Rejected: {reason} / Void: {reason}". Pre-link rows show the status and "Made before you joined" only | r5 |
| G-8 | "Couldn't load your payments. Try again." and "Couldn't load announcements. Try again.", each with "Try again" | r5 |
| G-9 | A person with no household doesn't read it. The not-linked screen shows no tiles, and rules allow members (`memberOf`) and staff only | r5 |

## TC-16: Post an announcement (REQ-016 r5)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | Yes. Each item in the staff list reads "Banner until {date}" or "Banner ended", and important ones show the "Pop-up on sign-in" pill | r5 |
| G-2 | "Edited {date}" shows in the list only. The banner shows the posting date | r5 |
| G-3 | The form trims and refuses blank text, it saves the text trimmed, and rules refuse a trimmed length of 0. **Sol Arch:** confirm the rules' `trim()` | r5 |
| G-4 | The form clears after a post, with the date back to 14 days ahead. Leaving for another page with a draft asks "Leave without posting? What you typed will be lost." (Stay / Leave). Closing the tab uses the browser prompt | r5 |
| G-5 | The banner shows on every homeowner page, including Pay with QR, above the content and never over a form. It never shows in staff views, and shows under "My household" | r5 |
| G-6 | Not listed for anyone. Staff see live announcements only, and a deletion's record is the activity log | r5 |
| G-7 | Type "Announcements", with "{name} posted / edited / deleted an announcement". REQ-006's trigger rule applies (entry id = event id, nightly missing-entry check). **Other BA:** REQ-006 to add the type, filter and sentences | r5 |
| G-8 | REQ-016 (approved, later) stands: the board reads Announcements. **Other BA:** REQ-002's R1 board menu to add "Announcements (read-only)" | r5 |
| G-9 | New selection rule: the banner is the newest live non-important announcement, and the pop-up holds every live important one. None may be dropped because more than 10 are live. A query shape is proposed. **Sol Arch:** confirm the shape | r5 |
| G-10 | The range runs from today to 90 days after **posting**. Picking today ends the banner at midnight. Past dates are refused | r5 |
| G-11 | "This announcement was deleted, so your changes weren't saved." When two staff edit at once, the last save wins and both edits are logged | r5 |
| G-12 | **Owner decision #8 in REQ-016**, approved (b) 2026-11-28 | r5, r6 |
| G-13 | A developer backfill script creates `memberOf` from the existing `members`, in staging and then production, before the rules are deployed. A release check compares the counts. Scenario added. **Other BA:** REQ-004 to say `redeemInvite` and `removeMember` write `memberOf` | r5 |
| G-14 | "Show more announcements" (adds 20 below). Load failure: "Couldn't load announcements. Check your connection and try again." with "Try again" | r5 |

## TC-17: Important announcement on sign-in (REQ-017 r5)

| Gap | Answer | Rev |
|---|---|---|
| G-1 | An important announcement is never the banner. It shows as the pop-up until "Got it", then only in the list (labelled "Important"). Only `ackAt` is written for it, so `dismissedAt` and × don't apply | r5 |
| G-2 | Covered by REQ-016 r5's selection rule (TC-16 G-9). Scenario added | r5 |
| G-3 | Linked = `linkStatus == 'linked'` and `active == true`. Total = `active == true`. A deactivated household is in neither figure | r5 |
| G-4 | "Seen by {n} households. Couldn't load the linked total. Try again." | r5 |
| G-5 | Accepted. It is an aggregate count with no personal data | r5 |
| G-6 | No. Creating a read record requires `memberOf` with at least one household, or the admin, treasurer or board role. Guards and people with no household are refused | r5 |
| G-7 | Privacy notice (including re-acknowledgement), then the invite confirmation, then the pop-up, then the page | r5 |
| G-8 | It shows on the first homeowner page of the session, whatever it is, and on switching to "My household". The person stays on that page after "Got it" | r5 |
| G-9 | No re-pop for people who already acknowledged. A change everyone must re-read is posted as a new important announcement (written into REQ-016 decision 6 (b)) | r5 |

## Changes needed in REQ-001 to REQ-011 (for the BA who owns them)

| REQ | Change | From |
|---|---|---|
| REQ-010 | Move the rejection reason from `paymentPrivate` to `payments/{id}` | TC-12 G-1 |
| REQ-010 | Add `updatedAt` (server time, set by every payment writer) to the payment summary | TC-12 G-15 |
| REQ-010 | Align with TC-04-L5: drop "A removed owner keeps access to their own screenshots", and make the `paymentPrivate` and screenshot "submitter" reads require a current membership | TC-13 G-8 |
| REQ-011 | Catalogue rows to add: "Payment approved (joined after it was made)", "Payment voided", "Payment voided (joined after it was made)", "Payment voided (board, if REQ-014 decision 8)" (opens Activity log). Note that "Receipt ready" goes only to members who may download the receipt, and that rejections aren't sent to members who joined after the payment | TC-12 G-4, TC-13 G-1, TC-14 G-3 |
| REQ-009 | Statement note "Receipts show how a payment was applied on the day it was issued." shown only once the lot has a voided payment. Payment rows show "Rejected: {reason}" / "Void: {reason}" except on "Made before you joined" rows | TC-14 G-5, G-8 |
| REQ-006 | Add the type "Announcements" (filter and sentences) for `announcement.posted / edited / deleted` | TC-16 G-7 |
| REQ-002 | R1 board menu: add "Announcements (read-only)" (S3) and "Activity log" (if not already added with REQ-006) | TC-16 G-8, TC-14 G-3 |
| REQ-004 | `redeemInvite` and `removeMember` write `memberOf/{uid}`. Recommended process (if REQ-013 decision 8 (a) is approved): update the owner on file before inviting a new owner | TC-16 G-13, TC-13 G-7 |

## Follow-ups from the S2 BA (2026-11-28)

| Item | Answer | Rev |
|---|---|---|
| REQ-014 said the activity log records the void reason | Aligned to REQ-006: the log records who voided and when and points to the payment; the reason lives on the payment only | REQ-014 r8 |
| REQ-017 must show the privacy notice before the pop-up | Stated: privacy notice (REQ-005) first, then invite confirmation, then the pop-up; never while the notice is pending (already in the G-7 scenario and Data changes, now in UX/UI notes too) | REQ-017 r6 |

## Owner decisions approved (2026-11-28, "Approve all")

| Decision | Approved | Rev |
|---|---|---|
| REQ-012 #7 | (a) the payment waits for a second treasurer | REQ-012 r8 |
| REQ-013 #8 (from TC-13 G-7) | (a) process rule; the review shows "Received from on the receipt" | REQ-013 r7 |
| REQ-014 #7 | (a) `reinstatePayment` developer script | REQ-014 r9 |
| REQ-014 #8 | Yes, the board is notified of every void | REQ-014 r9 |
| REQ-016 #6 | (a) title and message locked after "Got it" (TC-17 G-9 no longer arises) | REQ-016 r6, REQ-017 r7 |
| REQ-016 #7 | Footer on every announcement plus an in-app alert to the other staff (REQ-011 catalogue row for the other BA) | REQ-016 r6 |
| REQ-016 #8 (from TC-16 G-12) | (b) banner and pop-up kept live while the portal is open | REQ-016 r6, REQ-017 r7 |
