# Mock-up reuse map: index.html → REQ-001 to REQ-046

| | |
|---|---|
| Raised by | Owner, 2026-11-28: "you are using the current front end right? I mean no need to build what's already built there? index.html" |
| Author | BA, 2026-11-28 |
| Source read | `index.html` (repo root, 1,502 lines). `gentri-heights/index.html` has the same screens and actions (checked: identical `data-act` set); it differs only in branding |
| Basis | ADR-003 (approved): keep the mock-up's CSS and markup, move them into Vite + ES modules + lit-html, rewrite the data layer. LEARNINGS: "Port the mock-up's screens and copy, never its data handling" |
| Revision | r1, 2026-11-28: first version |

**What "reuse" means here.** The mock-up's look, layout, components (`.tile`, `.card`, `.tbl`, `.pill`, `.alert`, `.modal`, `.news`, `.ann`, `.letter`, `.vcard`, `.pass`, `.qrbig`, `.timeline`, `.fund`, `.hbar`, tabs, chips, toast, confirm dialog, side drawer) and its wording carry over. Its code does not: every screen is an `innerHTML` string built from browser-local fake data (`S`, saved to `localStorage`), with actions in one `ACT`/`FORMS` table. Each screen's template is translated to lit-html and wired to Firestore and Functions. So "Reuse as is" means *no design change*, not *no work*.

- **Reuse as is:** same layout and copy; only the data source changes.
- **Reuse with changes:** same screen and components, with the changes listed (each from an approved or drafted REQ decision).
- **Not used:** dropped from the real portal.
- **New:** a screen the REQs need that the mock-up doesn't have.

## 1. Screen-by-screen map

### App frame (all roles)

| Mock-up screen / element | REQ | Verdict | Changes and why |
|---|---|---|---|
| Top bar, side nav, phone drawer, cards, tiles, pills, tabs, chips, toast, modal, confirm dialog, focus return | All | **Reuse as is** | The design system for every REQ. Built once in S1 as the Vite app shell (SA-001 §12 phase 1) |
| "Homeowner · Admin · Guard" role switch | REQ-002 | **Reuse with changes** | Same place, but shown only to a person who holds two roles (REQ-002 UX notes); menus come from the server-checked role |
| "Viewing as {household}" picker | REQ-001, REQ-004 | **Not used** | It lets anyone see any household. The household comes from sign-in plus invite code |
| "Signed in as HOA Treasurer" / "Guard on duty" label | REQ-001, REQ-002 | **Reuse with changes** | Shows the signed-in person's name and role, plus "Sign out" |
| Notification bell and panel | REQ-011 | **Reuse with changes** | Same dropdown on desktop; fills the screen at 375 px; bounded live listener; message catalogue from REQ-011 |

### Homeowner view

| Mock-up screen (`index.html` function) | REQ | Verdict | Changes and why |
|---|---|---|---|
| Announcement banner (`bannerHTML`) | REQ-016 | **Reuse with changes** | Shows the newest live non-important announcement until its "Show banner until" date (REQ-016 decision 2); dismissals stored per person |
| Important announcement pop-up (`signInPopup`) | REQ-017 | **Reuse as is** | Same dialog and "Got it"; acknowledgements move from the `seenBy` list to per-person reads (data only) |
| Dashboard (`oDash`) | REQ-015 | **Reuse with changes** | R1 keeps the overdue warning, balance tile with "Pay with QR", recent payments and announcements. Booking, request and vehicle tiles are hidden until those features ship (feature flags, REQ-015). Recent payments become cards on phones |
| Dues & Payments: Statement of account card (`oDues`) | REQ-009 | **Reuse with changes** | Cards at 375 px instead of a sideways-scrolling table; "Partly paid" replaces "Partial"; figures from server-kept totals; Download PDF stays in the browser (SA-001 §9) |
| Dues & Payments: Pay with QR (`qrBlock`, `FORMS.pay`) | REQ-010 | **Reuse with changes** | Adds "Date paid"; amount capped at balance minus pending; "Saving…" and disabled button; duplicate reference number refused; screenshot compressed and stored in Storage; records which QR was shown |
| Dues & Payments: Payment history, receipt button | REQ-010, REQ-013, REQ-014 | **Reuse with changes** | Receipt button follows the server PDF's status; voided payments read "Void" with the reason |
| Dues & Payments: Notices received, View letter | REQ-009, REQ-020 | **Reuse with changes** | Letter PDF comes from the server; wording "overdue", not "outstanding" |
| Book Amenities: amenity picker, calendar, slot panel (`oAmen`, `calendarHTML`, `slotPanel`) | REQ-031 | **Reuse with changes** | Layout kept. Under Option B the request no longer asks for a payment reference; payment comes after approval ("Pay fee" by a date). Availability checked on the server |
| Book Amenities: My bookings, Cancel (`cancelBooking`) | REQ-031, REQ-033 | **Reuse with changes** | Cards on phones; the cancel dialog's two "Cancel" buttons renamed; time and status re-checked |
| Book Amenities: "Booking is paused" alert | REQ-034 | **Reuse as is** | Same alert and "Go to Dues". The rule moves to the server; the setting defaults to Off (REQ-034 decision 2) |
| My Vehicles: vehicle cards and register form (`oVeh`) | REQ-028 | **Reuse with changes** | Duplicate-plate check; withdrawing keeps the record instead of deleting it; OR/CR photo goes to Storage; plate field upper-case |
| Requests & Complaints: my requests and form (`oReq`) | REQ-026 | **Reuse with changes** | Adds "Withdrawn"; photo button opens the camera; one column at 375 px |
| Guest Passes: list, form, pass view (`oPass`, `passModal`) | REQ-040, REQ-041 | **Reuse with changes** | Pass carries a contact number the homeowner confirms (REQ-040 decision 5); on phones the form opens as a page; "Cancel pass" / "Keep pass" labels; pass and history kept after cancel |
| Request a Report: list, form, stepper (`oRec`) | REQ-036 | **Reuse with changes** | Server-assigned number, duplicate check, working-day "Expected by", phone layout (REQ-036 problem statement) |
| Announcements page (`oNews`) | REQ-016 | **Reuse as is** | Same list |

### Admin (staff) view

| Mock-up screen (`index.html` function) | REQ | Verdict | Changes and why |
|---|---|---|---|
| Dashboard · Operations tab (`aDashOps`) | REQ-025 | **Reuse with changes** | Same four tiles and chart. Receivables shows "₱Y overdue · n delinquent" (decision 3); adds a "Needs attention" list; tiles depend on role |
| Dashboard · Financial report tab (`finReport`) | REQ-039 | **Reuse with changes** | Same tiles, chart, phase heat-map and bars. Figures calculated from closed months (Option B) instead of the typed-in `FIN` block; the two spending sections become one "Spending by category"; range picker and PDF. Waits on D6 |
| Approvals · Payments table (`aAppr`, `approvePay`) | REQ-012 | **Reuse with changes** | The biggest change: the 7-column table with Approve/Reject on each row becomes a queue (cards on phones, rows on laptops) that opens a one-at-a-time review screen (see New). Server transaction checks the payment is still pending |
| Approvals · Recently reviewed, receipt button | REQ-012, REQ-013 | **Reuse with changes** | Receipt from the server PDF |
| Approvals · Bookings tab | REQ-032 | **Reuse with changes** | Decided once (status check); cards on phones; no payment reference at request time under REQ-031 Option B |
| Approvals · Vehicles tab (`approveVeh`) | REQ-029 | **Reuse with changes** | Approve dialog offers "New sticker #0460" or "Already has sticker" (Option C); server-side counter and uniqueness |
| Reject dialog with preset reasons | REQ-012, REQ-029, REQ-032 | **Reuse as is** | One shape for all three, as in the mock-up |
| Proof / OR-CR / receipt image viewer | REQ-012, REQ-022, REQ-029 | **Reuse as is** | Image read through a short-lived link |
| Homeowners table and search (`aHo`) | REQ-003 | **Reuse with changes** | Adds "Add household", "Import households", link status pill, paging; cards below 640 px |
| Household detail dialog (`hoDetail`) | REQ-003, REQ-004, REQ-009 | **Reuse with changes** | Becomes edit plus "Invite" and the staff view of the statement |
| Accounting · Collections tab (`aAcct`) | REQ-023 | **Reuse with changes** | Same month picker, tabs and table; month counted by receipt date; voids shown; CSV; cards on phones |
| Accounting · Expenses tab and form | REQ-022 | **Reuse with changes** | Same form and table; "Void" with a reason replaces "Delete"; receipt photo from the camera |
| Accounting · Fund summary tab | REQ-024 | **Reuse with changes** | Same strip and bars; adds "Close a month" and a closed state |
| Collections & Notices · Monthly billing card (`aColl`, `genBilling`) | REQ-008 | **Reuse with changes** | Same card and button; button opens a preview, then a progress line; late additions list; opening balances import (see New) |
| Collections & Notices · Delinquent accounts table and "Send next notice to selected" | REQ-018, REQ-021 | **Reuse with changes** | Adds chips (1 / 2–3 / 4+ months), search, overdue separate from balance, "payment waiting" flag; cards on phones with a sticky selection bar |
| Notice preview dialog (`letterHTML`, `previewNotice`) | REQ-020 | **Reuse with changes** | Same letter layout; re-check before sending; PDF made on the server; copy fixes |
| Notice history | REQ-020 | **Reuse as is** | Adds a withdrawn state only |
| Requests & Complaints admin list and manage dialog (`aTix`) | REQ-027 | **Reuse with changes** | Same chips, table and timeline; "Withdrawn"; stale-edit message; cards on phones |
| Report Requests list and dialog (`aRrq`, `rrModal`) | REQ-037, REQ-038 | **Reuse with changes** | Generation and file checks on the server; "Replace file" with reason |
| Visitor Log: arrivals and gate scan log (`aVis`) | REQ-044 | **Reuse with changes** | No photo thumbnails, no download (privacy decision 1); every ID-photo view logged; paging; cards below 640 px |
| Reports page (`aRep`) | REQ-035 | **Reuse with changes** | Same picker and table; per-bill aging; CSV formula guard; report names spelled out ("and", "utilisation") |
| Announcements admin: list and post form (`aNews`) | REQ-016, REQ-017 | **Reuse with changes** | Adds "Show banner until", character counters; "seen by" from count queries; no notification per household |
| Settings · Dues & billing, Payment QR (`aSet`) | REQ-007, REQ-034 | **Reuse with changes** | Saved through callables with audit; replacing the QR needs typed "REPLACE", alerts other officers, keeps the old image; the "block booking" box is audited and Off at launch |
| Settings · Amenity pricing | REQ-030 | **Reuse with changes** | Same table on desktop, a card per amenity on phones; slots stay developer-set (Option A) |
| Settings · Gate and guest passes | REQ-040, REQ-043, REQ-045 | **Reuse with changes** | Adds how far ahead, most guests and vehicles per pass |
| "Delete ID photos now" button (`purgeIds`) | REQ-045 | **Not used** | A scheduled job replaces it (REQ-045 out of scope) |
| Settings · Demo data, "Reset demo data" | none | **Not used** | Demo only |

### Guard view

| Mock-up screen (`index.html` function) | REQ | Verdict | Changes and why |
|---|---|---|---|
| Scan Pass: code entry and "Expected today" (`gScan`) | REQ-042 | **Reuse with changes** | Layout kept; camera view fills the top half; "connection lost" state with the paper fallback |
| Scan Pass: "take a photo of the QR" decode (jsQR on a captured image) | REQ-042 | **Not used** | Replaced by a live camera that reads the QR without a button (Option A) |
| Pass result and guest check-in rows (`passResult`, `.gst`) | REQ-042, REQ-043 | **Reuse with changes** | Contact number only from the pass, not the household (REQ-040 decision 5); ID photo required by setting; the 4-column row stacks at 375 px; "Let in" / "Check out" labels |
| Visitors Inside (`gInside`) | REQ-043 | **Reuse with changes** | Card list on the phone instead of a table |
| Today's Log (`gLog`) | REQ-044 | **Reuse with changes** | Today only, same result words as the scan |
| ID photo dialog (`viewId`) | REQ-043, REQ-044 | **Reuse with changes** | Each view logged; link expires within minutes |

### Counts

| Verdict | Count |
|---|---|
| Reuse as is | 7 |
| Reuse with changes | 42 |
| Not used | 4 |
| New (section 2) | 23 |

Most "with changes" rows are small: a server check behind the same button, a card layout at phone width, or a renamed label. The screens whose layout changes noticeably are listed in section 4.

## 2. Screens the REQs need that the mock-up doesn't have (New)

| # | New screen | REQ |
|---|---|---|
| N1 | Sign in (Google, email and password), Create account, Forgot password | REQ-001 |
| N2 | "What's your name?", guard holding page, no-access page | REQ-001, REQ-002 |
| N3 | Enter your invite code (also the not-linked page) and lot confirmation | REQ-001, REQ-004 |
| N4 | Invite a homeowner: dialog, printable invitation, resend and cancel | REQ-004 |
| N5 | Add / edit household form | REQ-003 |
| N6 | Import households: upload, preview with problems, progress, result | REQ-003 |
| N7 | Read-only staff list (Settings → Staff) | REQ-002 (Option B for R1) |
| N8 | Privacy notice and acknowledgement gate | REQ-005 |
| N9 | Activity log page with filters (the mock-up only has "Recent activity" on the dashboard) | REQ-006 |
| N10 | Replace QR code confirmation (typed "REPLACE") and officer alert | REQ-007 |
| N11 | Billing run preview dialog, progress and late additions | REQ-008 |
| N12 | Opening balances import | REQ-008 |
| N13 | Correct one bill, bulk correction preview and progress, correction line on the statement (mockup not yet made) | REQ-046 |
| N14 | Payment review screen, one payment at a time | REQ-012 |
| N15 | Void a payment dialog and VOID receipt copy | REQ-014 |
| N16 | Close a month dialog and closed-month state | REQ-024 |
| N17 | "Needs attention" list on the staff dashboard | REQ-025 |
| N18 | Withdraw a notice | REQ-020 |
| N19 | Booking "Pay fee" step and pay-by / lapsed states | REQ-031 |
| N20 | Admin office cancels a booking with a reason | REQ-033 |
| N21 | Admin removes an approved vehicle, sticker retired | REQ-029 |
| N22 | Certificate of good standing register and Cancel certificate | REQ-038 |
| N23 | Email messages (key events, notices) | REQ-019, REQ-020 |

Also new in every screen: **loading, error, empty-after-filter and offline states.** The mock-up reads local data instantly, so it has none of them, and every REQ's UX notes asks for them.

## 3. Never in the mock-up: must be built regardless

- **Sign-in and identity:** Firebase Authentication, staff 2-step verification, account and membership records, invite codes and `redeemInvite` (REQ-001, 002, 004).
- **Data:** the Firestore data model, server-kept totals (`households/{id}` balances, `openBills`), the shared ledger and aging modules, pagination and indexes. The mock-up's `S` object and `localStorage` go entirely.
- **Rules:** Firestore and Storage security rules and the rules test matrix. Hidden in the menu is not protected (REQ-002).
- **Functions (server logic):** `setRole`, payment submit with duplicate check, approve with gap-free receipt number, void, billing worker and correction, notice escalation, booking slot locks, sticker and certificate counters, pass verification, QR replacement, notification helper, audit-log writer.
- **Official documents on the server:** receipt and VOID receipt, notice letters, certificate of good standing, board report PDF. The mock-up draws these in the browser with jsPDF from live data, so they would change on every download.
- **Email:** provider, mail function, templates (REQ-019).
- **Scheduled jobs:** billing reminder, booking pay-by lapse, ID-photo retention, notification clean-up.
- **File storage:** screenshots, OR/CR photos, expense receipts, ID photos, record-request files, QR uploads (the mock-up keeps them as text inside the data).
- **Platform:** Vite build, PWA manifest for the gate phone, App Check, backups and restore drill, monitoring, CI, emulator, SonarQube, Playwright journeys, concurrency tests.

## 4. Answer to the owner

**Yes. We are building on the current front end, not redesigning it.** Every REQ was written against `index.html` and names the mock-up components it reuses, and ADR-003 keeps its CSS and markup. Of 53 mock-up screens and elements, 49 carry over and 4 are dropped (the "Viewing as" picker, the demo reset, the manual ID-photo delete and the photo-based QR scan).

**What that does and doesn't save.** It saves the design work and most of the HTML and CSS. It doesn't remove front-end work. Each screen still has to be moved into the new code structure, connected to real data, and given the loading, error and offline states and phone layouts the mock-up never needed. The bigger cost was never the screens. It is the sign-in, data, rules, server logic, PDFs and email in section 3, which the mock-up doesn't have at all.

### Do the S2/S3 sizes assume reuse? Flag for Sol Arch

- The S2 (23–27.5 days) and S3 (12.5–16.5 days) sizes in `RELEASE-PLAN.md` are Sol Arch's per-REQ estimates. Several include a screen share ("the screen, dialog and rules are about 0.5", REQ-014; "responsive statement", REQ-009). None says whether it assumes porting the mock-up's template or building the screen fresh. **Sol Arch to confirm they assume porting.**
- **Possible double count:** SA-001 §12 and `backend-plan.md` also carry area J, "Connecting the frontend to the backend", 4–7 days "spread across phases 1–4". If the R1 total adds J on top of per-REQ sizes that already include their screens, up to 4–7 days are counted twice. **Sol Arch to say whether J is inside the per-REQ sizes or on top.**
- **Repeated phone-card work:** at least 14 REQs specify "cards at 375 px" for a table (003, 009, 012, 015, 018, 023, 027, 029, 031, 032, 035, 037, 038, 044). Built once in the S1 shell as one shared "table becomes cards" pattern, each REQ only applies it. If each REQ priced its own card layout, the sizes are high. **Sol Arch to confirm.**
- Unrelated inconsistency seen while checking: the S1 row says 6–10 days, but SA-001 §12 r2 re-sized REQ-001 to 004 at about 16–23.

### Where we redesigned a working mock-up screen and a smaller change might do

These are for the owner to weigh. REQ-012 is already approved, so I am raising it once and not reopening it.

1. **REQ-012 payment approval (approved, Option A).** It replaces the mock-up's table (Option B) with a new one-at-a-time review screen. A smaller change would get most of the value: keep the table on a laptop and cards on a phone, and put Approve and Reject inside the existing screenshot dialog. The screenshot is then still on screen when the treasurer approves. The REQ itself says the costly part, the server transaction, is the same either way, so the saving is front-end only, probably under a day. Sol Arch to price before S3 starts.
2. **REQ-031 booking (draft, Option B).** It changes the mock-up's working "pay with the request" flow into "request, then pay after approval", which adds a pay-by state and an hourly job. The BA's own estimate makes Option A (the mock-up's flow) about 1 day cheaper (3.5–4 days against 4–5). B removes refunds of rejected requests, which is a real gain, so I still recommend it. The mock-up's flow is the cheaper fallback if the board doesn't see refunds as a problem.
3. **REQ-042 guard scan (draft, Option A).** It replaces the mock-up's photo-of-the-QR scan with a live camera. That is justified: guard speed at the gate is the point, and `backend-plan.md` priced the live camera. The mock-up's path would be the cheaper fallback.
4. **REQ-039 board report (draft).** The screen layout is kept. The change is where the figures come from, which is a data decision (D6), not a redesign. No smaller screen change applies.

No other REQ changes a mock-up layout beyond phone cards, labels and the server checks behind its buttons.
