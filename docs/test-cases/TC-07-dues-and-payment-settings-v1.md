# TC-07: Dues rate and QR payment settings (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: Settings → "Dues and payment" card (monthly dues, payee name, account label, payment instructions) and "Payment QR code" card, written by two callables; typed confirmation and officer alerts on a QR replacement; advisory QR read-back; homeowner Pay card reads the result |
| Source | [REQ-007 Dues rate and QR payment settings](../requirements/REQ-007-dues-and-payment-settings.md), **Approved** 2026-11-28 (r4, "Approve all as shown"), Option A; decisions 2 (all three QR protections), 3 (read-back, advisory), 4 (treasurer only); Sol Arch's changes applied in r3 |
| Depends on / precedent | [REQ-002 Roles](../requirements/REQ-002-roles-and-permissions.md) (treasurer only, `staff/{uid}` check, L-004; admin "non-financial Settings"), [REQ-006 Activity log](../requirements/REQ-006-activity-log.md) (`settings.changed`, `settings.qrReplaced`), [REQ-011 Notifications](../requirements/REQ-011-in-app-notifications.md) (QR alerts). Readers: [REQ-008 Billing](../requirements/REQ-008-monthly-billing-run.md) (rate snapshot, stale-preview refusal: TC-08), [REQ-009 Statement](../requirements/REQ-009-statement-of-account.md) (Dues & Payments), [REQ-010 Submit payment](../requirements/REQ-010-submit-qr-payment.md) (QR shown, `qrUploadId` recorded, `maxPaymentCentavos`), [REQ-004](../requirements/REQ-004-invite-and-link.md) (invitation expiry lives on `config/settings`, not here) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (**Open**: no viewport meta; the homeowner Pay card and the treasurer's card must work at 375 px, see TC-07-Q1, Q2). No defect is open in this area |
| App version | **Anticipated.** No application code exists; `main` at `9ace525` holds the mock-up, whose settings form (`index.html` lines 870–877, handler line 1469) writes `S.settings` in the browser, offers "Use sample QR" (`clearQr`, line 1409) and shows "SAMPLE QR" (line 607). This REQ replaces all of that. Approved UX: screens 7A–7E of [req-005-011-mockup.html](../mockups/req-005-011-mockup.html) |
| Source files / functions touched (anticipated) | Callables `saveDuesSettings({changes, seenUpdatedAt})`, `replacePaymentQr({uploadId, seenUpdatedAt})`; Firestore document `config/payment` (read by every signed-in user, written only by functions); `config/settings` (admin cards, unchanged); Storage path `config/payment-qr/{uploadId}` with `uploaderUid` metadata and create-only rules (cross-service `firestore.get()` on `staff/{uid}`); QR decoder (jsQR / `BarcodeDetector`) and the EMVCo tag-59 / CRC parser; `notifications` writes; `auditLog` through the shared helper; the daily job that deletes orphaned uploads; Settings card, QR dialog, homeowner Pay card on Dues & Payments |
| Architecture | SA-001 r3 **Final** §3, §4.2 (`config/settings`, Storage `config/payment-qr.png`), §8.3. **REQ-007 departs from SA-001**: settings move to `config/payment`, written by callables; the QR path gains an upload id. These come from **Sol Arch's REQ-007 review**, not yet folded into SA-001; cases that assert them are tagged **Provisional — design** |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions, Storage) or `hoa-portal-staging` only. Never production.** Every QR image is a test image; staging's sample QR is marked "TEST, DO NOT PAY". No real HOA, bank or e-wallet QR code is used in any case. Both brands |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. Layers are left for QE (`TBD — QE`). Cases tagged Gap G-n wait for the BA's answer |

**Tags used on cases**

- **Provisional — design**: asserts a name or shape from Sol Arch's REQ-007 review, not yet in SA-001 Final.
- **Gap G-n**: expected result depends on a requirement gap. **Blocked — spike**: depends on the QR Ph tag-59 spike (REQ-007 open question).
- **Staging note**: controllable server clock, two sessions at once, injected failure, admin SDK access, a direct Storage upload.

**One behaviour per case.** A validation case checks one rule; a permission case one decision; a screen case one display. Callable cases state the stored outcome and name no screen wording.

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Treasurer** (`treasurer`) | Edits dues, payee name, account label, instructions; uploads and replaces the QR code. Gets the self-alert. Other treasurers get the officer alert |
| **Board** (`board`) | Doesn't see the card. Gets the officer alert. Reads the activity log entries |
| **Admin office** (`admin`) | Sees the card read-only with "Only the treasurer can change dues and payment settings." Edits other Settings cards (`config/settings`). Reads the activity log |
| **Homeowner** | Reads the result on Dues & Payments: QR with "SCAN TO PAY", "QR code updated {date}", payee name, account label, instructions; or "Online payment isn't set up yet…" |
| **Guard** | Reads `config/payment` as a signed-in user (see M10); no screen |
| **Developer** (script) | Sets `maxPaymentCentavos` |

### Test fixtures (invented; QE maps them to `.env`)

| Account | Who |
|---|---|
| S-TREAS | ZZ Carmela Cruz, `treasurer` |
| S-TREAS-2 | ZZ Second Treasurer, `treasurer` |
| S-TREAS-HO | ZZ Treasurer Homeowner, `treasurer` and member of HH-C |
| S-ADMIN | ZZ Paolo Aquino, `admin` |
| S-BOARD-1, S-BOARD-2 | ZZ Board D1, ZZ Board D2, `board` |
| S-GUARD | ZZ Guard G1 |
| S-EXTREAS | ZZ Removed Treasurer (role removed, ID token still valid, L-004) |
| U-JUAN | ZZ Juan Dela Cruz, homeowner, member of HH-A (Blk 4 Lot 12) |
| U-MARIA | ZZ Maria Santos, homeowner, member of HH-B |

| Settings state | Contents |
|---|---|
| **SET-NONE** | No `config/payment` document (never saved) |
| **SET-RATE** | Dues ₱1,800.00, payee "ZZ Greenfield Homes HOA", account label "ZZ HOA Collection Account", instructions set; no QR |
| **SET-FULL** | SET-RATE plus a current QR (QR-HOA), uploaded by S-TREAS on Dec 2, 2026 |
| **BILLED-NOV** | November 2026 billed at ₱1,800.00 for the fixture households (TC-08 fixtures) |

| Image | What it is |
|---|---|
| **QR-HOA** | Generated EMVCo test payload with tag 59 = "ZZ GREENFIELD HOA", valid CRC, PNG 40 KB |
| **QR-HOA-2** | Different valid test payload, tag 59 = "ZZ GREENFIELD HOA INC", JPEG 60 KB |
| **QR-P2P** | Valid test payload with no tag 59 |
| **QR-NOQR** | A photo with no QR code |
| **QR-DAMAGED** | QR-HOA with the CRC (tag 63) altered |
| **QR-LONGNAME** | Tag 59 at the profile's maximum length (cut-off name) |
| **QR-MARKUP** | Tag 59 = `<img src=x onerror=alert(1)>` |
| **QR-TWO** | One image containing two different QR codes |
| **FILE-9MB**, **FILE-PDF**, **FILE-HEIC**, **FILE-WEBP**, **FILE-SVG**, **FILE-GIF** | Wrong size or type |
| **FILE-2MB-EXACT**, **FILE-2MB-PLUS1** | PNG of exactly the limit, and one byte over (Gap G-9) |
| **FILE-SPOOF** | PDF bytes with a `.png` name and `image/png` content type |
| **QR-TEST** | Staging sample QR marked "TEST, DO NOT PAY" |

All payloads are generated test strings, not any real account's code. "Today" is built from local Manila today; dates show the arithmetic, reproduced with a controllable server clock.

### Round-trip register

Treasurer writes → homeowners, billing, other officers and staff read. One row per field.

| # | Field | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | `config/payment.monthlyDuesCentavos` | `saveDuesSettings`, treasurer | Settings card field (treasurer; admin read-only) after reload; saved toast "{period} will bill {amount}"; billing card "Rate {amount} per household" and preview (treasurer, TC-08); every new bill's amount (homeowner statement, TC-08 / REQ-009); Dues & Payments header "Monthly dues {amount}" (homeowner); activity log "from {old} to {new}" (staff) | A1, A2, A4, A6, J1 |
| 2 | `payeeName` | `saveDuesSettings` | Homeowner Pay card "Pay to {payee}"; QR alt text "Payment QR code for {payee name}"; activity log (staff) | A8, F4, F7, J2 |
| 3 | `accountLabel` | `saveDuesSettings` | Homeowner Pay card under the payee | A9 |
| 4 | `instructions` | `saveDuesSettings` | Homeowner Pay card; statement PDF footer (REQ-009, the mock-up's line 1029 shows it there) | A10 |
| 5 | `qrPath`, `qrUploadId` | `replacePaymentQr` | Homeowner Pay card image (every signed-in homeowner); REQ-010 payment records `qrUploadId` → treasurer's Approvals "Paid using the QR code replaced on {date}" (S3, REQ-012) | D1, F2, F8 |
| 6 | `qrUpdatedAt` | `replacePaymentQr`, server time | Homeowner "QR code updated {date}"; notification text "…on {date}" (officers, replacer) | F3, E1, E2, T3 |
| 7 | `qrUpdatedBy` | `replacePaymentQr` | Officer alert "replaced by {name}" (other treasurers, board); activity log actor (staff). **Deliberately not shown** to homeowners | E1, J3 |
| 8 | `updatedAt` | Both callables | **Deliberately not shown**; the stale-edit refusal "Someone else changed these settings…" (treasurer) | G1 |
| 9 | `maxPaymentCentavos` | Developer script | REQ-010 amount validation (homeowner payment form; TC for REQ-010). **Not shown** on this card | S5 |
| 10 | Storage `config/payment-qr/{uploadId}` (previous images kept) | Treasurer upload, create only | Current: homeowner Pay card. Previous: **deliberately not shown** (no history screen, out of scope); kept for put-back and the audit entry | D9, K2 |
| 11 | `notifications` QR alert (other treasurers, every board member) | `replacePaymentQr`, same transaction | Bell of each recipient (REQ-011) | E1, E3, E4 |
| 12 | `notifications` self-alert (the replacer) | `replacePaymentQr` | Bell of the replacer | E2 |
| 13 | `auditLog` `settings.changed` (field, before, after), `settings.qrReplaced` | Both callables, same transaction | Activity log (treasurer, board, admin office; TC-06-A13–A16) | J1–J4 |
| 14 | QR read-back name (tag 59) | Nothing stored (screen only) | The treasurer's preview "This QR code says it pays: {name}" | D5 |

No read-back cell is empty.

### QR state enumeration

Rule under test: `replacePaymentQr` makes an upload current only if the object exists at `config/payment-qr/{uploadId}`, is PNG or JPEG, ≤ 2 MB, uploaded by the caller, and `updatedAt` hasn't moved. One row per prior state of the QR setting; one column per event.

| Prior state ↓ / event → | Upload a valid image and confirm | Cancel the dialog after upload | Confirm with someone else's uploadId | Confirm with an uploadId that doesn't exist | Confirm with an older, previously current uploadId of one's own | Daily clean-up job | Homeowner opens Dues & Payments |
|---|---|---|---|---|---|---|---|
| **No QR** (SET-NONE / SET-RATE) | Becomes current; first-time alerts: **Gap G-1** (D1, E6) | Stays "No QR"; upload orphaned (D11) | **Refused** (H6) | **Refused** (H7) | n/a | Orphan > 7 days deleted (K1) | "Online payment isn't set up yet…" (F1) |
| **Current QR A** | B current, A kept, alerts sent (D2, E1) | A stays current; upload orphaned (D11) | **Refused**; A stays (H6) | **Refused**; A stays (H7) | Not offered on screen; by call: allowed if own upload, else refused (H8) | A kept (current) (K2) | A with "SCAN TO PAY" and A's date (F2, F3) |
| **Current B, previous A** (A named in an audit entry) | C current; A and B kept (D9) | B stays | **Refused** | **Refused** | Put-back by uploading A's image again (D10) | A kept (in audit), B kept (current) (K2) | B (F2) |
| **Upload made but never confirmed** (orphan, ≤ 7 days) | n/a | n/a | n/a | n/a | n/a | Kept (K3) | Not shown |
| **Orphan, > 7 days** | n/a | n/a | n/a | n/a | n/a | Deleted (K1) | Not shown |

**Dues amount enumeration** (B-block): empty · 0 · 0.01 · 1,800.00 · 1,850.50 · 1,850.555 · 100,000.00 · 100,000.01 · 150,000 · −1 · "1e3" · "18OO" · leading and trailing spaces. **25% check:** 1,800 → 2,250.00 (exactly 25%), 2,250.01, 1,350.00, 1,349.99, first-ever save.

---

## Test plan

### 1. Smoke

No new menu item: the cards live in Settings, which smoke already opens for the treasurer (SMK-admin-settings, mock-up). **Smoke additions for QE:**

1. Settings shows the **"Dues and payment"** and **"Payment QR code"** cards for the treasurer (fields and buttons present, no page error).
2. The same cards render **read-only** for the admin office with "Only the treasurer can change dues and payment settings."
3. The homeowner's **Dues & Payments** shows either the QR with "SCAN TO PAY" or "Online payment isn't set up yet. Pay at the admin office for now." and never "SAMPLE QR" (the mock-up's sample canvas must be gone).

### 2. Acceptance

| REQ-007 scenario | Cases |
|---|---|
| A new rate applies from the next billing run only | A1, A2, A3, A4; stale preview refusal: TC-08-B9 |
| A large change is confirmed first | B10, B11, B12 |
| An invalid rate is not saved | B1, B2, B3 |
| Centavos are kept exactly | B5, B6 |
| A rate above the sanity cap is refused | B8, B9 |
| Uploading the real QR code | D1, F2, F3, F5 |
| Replacing the QR code alerts the other officers | E1, E2, J3, E5, D9 |
| No other officer has an account to alert | E7, E8 |
| Shows what the QR code says it pays to | D5, D6, D7, D8 |
| A file that is too big or not an image | D12, D13 |
| Before any QR code is set up | F1 |
| Two treasurers edit at once | G1, G2 |
| Pressing Save twice saves once | G3, G4 |
| The admin office sees the settings read-only | P3, M3, M4, H3 |
| A homeowner cannot change settings | M1, M5, H4 |
| Every settings change is logged | J2 |

No acceptance criterion is without a case.

### 3. Regression

- **Billing (REQ-008, TC-08)** reads `config/payment.monthlyDuesCentavos` for the card, the preview and the run's rate snapshot, and refuses a stale preview. A wrong rate here bills 623 households wrong. Run TC-08's A, B and G blocks after any change to this card.
- **Homeowner Dues & Payments (REQ-009 / REQ-010)**: the Pay card, the "not set up" state, the payment form being hidden without a QR, and REQ-010's `qrUploadId` recording. The mock-up's `qrwrap` block (`index.html` 607–608) and the payment form must be re-checked once ported.
- **`config/settings` vs `config/payment` split.** REQ-004's invitation-expiry card and the booking pause (story 34) stay on `config/settings`, which the admin office edits. Re-run TC-04's expiry-settings cases (E11–E15) to prove the split didn't break them, and M7 here to prove no admin rule widens into dues.
- **Storage rules** gain a cross-service `firestore.get()` for the first time. A mistake could block every other Storage path (payment proofs in REQ-010). Re-run REQ-010's upload rules once they exist.
- **Notifications (REQ-011)**: officer alerts are the first staff-to-staff notifications; REQ-011's "Staff get notifications for their role" and "A removed staff member gets no new notifications" apply.
- **Activity log (TC-06)**: A13–A16 depend on this TC's writes.
- **Shared money formatting** (`shared/domain/money.js`): centavos ↔ pesos conversion is new here (1850.50 → 185050). Every peso figure in the app uses the same module.
- **Open defect DEF-001**: the homeowner Pay card at 375 px.

**Existing specs and screens QE should re-run:** `smoke.spec.js` SMK-admin-settings, SMK-owner-dues; `navigation.spec.js` NAV-06 (Escape closes a modal: conflicts with "QR dialog does not close on a backdrop click", see Q5), NAV-07 / NAV-08; TC-04 E11–E15; TC-02 rules matrix rows for `config/*` (new rows for `config/payment` and Storage `config/payment-qr/`).

**Not affected:** invitations themselves, the household directory, bookings, vehicles, guard screens.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "The next billing run (December 2026) will bill ₱2,000.00"; "The other treasurers and the board will be told"; "the previous image is kept"; "Bills already created keep their amount" | A2, A3, E1, D9, A4 |
| A value written for one role, never shown back | Yes: account label, instructions, `qrUpdatedBy`, previous images | Register rows 3, 4, 7, 10 |
| Status-gated rule checked for one transition only | Yes: QR replacement from each prior state | QR state enumeration; D, H blocks |
| Same concept, different word on another screen | Yes: "Payee name shown to homeowners" vs the mock-up's "Payee name shown on the QR"; "Upload QR code" vs "Replace QR code"; "Monthly dues" | R1, R2 |
| Dates computed in UTC where the user means local | Yes: "QR code updated {date}" and alert dates near Manila midnight; the toast's "next billing run" period on the 1st | T1, T2, T3, A5 |
| A derived figure doesn't refresh after a related write | Yes: billing card rate, Dues & Payments header, homeowner QR image after replace | A6, F6, F8 |
| Zero and "not set" look the same | Yes: no rate vs ₱0 (refused); no QR vs a QR | B2, S1, F1 |
| A write silently refused by security rules | Yes: admin and homeowner writes; stale edit | M-block, H-block, G1 |
| Double-tap / two devices create duplicates | Yes: Save twice; "Use this QR code" twice; two treasurers | G3, G4, G5 |
| Stale reference | Yes: settings changed since opened; QR replaced while a homeowner's page is open | G1, F8 |
| Backdrop click loses work or leaves stale state | Yes: QR dialog holds an upload; large-change dialog | Q5, B12, D11 |
| A modal appearing mid-flow blocks the next action | Low: announcement pop-up during the QR dialog | P6 |
| Assumed SDK/network behaviour baked into a case | Yes: `BarcodeDetector` availability, offline save | D15, Q8 |
| Data leaking across households or roles | Yes: guard and signed-out reads of `config/payment`; QR alert recipients | M8, M10, E4 |

### Scenario list by mandatory type

- **Negative**: empty, zero, negative, non-numeric, 3 decimals, over the cap; payee empty or 81 characters; instructions 501; wrong file types and sizes, spoofed type, SVG; no QR found, damaged QR; wrong typed confirmation; stale edit; admin, board, guard, homeowner and removed-treasurer writes; someone else's or a missing upload id; overwrite and delete in Storage. B, C, D, G, H, M blocks.
- **Boundary**: ₱0.01, ₱100,000.00 vs ₱100,000.01; 25% exactly vs just over, both directions; payee 1 and 80 characters; instructions 500; file exactly at the limit and one byte over; orphan at 7 days; alert and "updated" date at 23:59 / 00:00 Manila; toast on the 1st vs the 2nd; first-ever save. B, C, D12, K, T blocks.
- **Usability**: labels and hints, ₱ prefix outside the field, decimal keypad, errors under the field and announced, validate on blur, typing kept on error, dialog focus, typed confirmation labelled, alt text, 375 px, loading and empty states, tap targets. Q-block.
- **Navigation**: Settings for treasurer and admin; board has no card; homeowner and guard can't open Settings; dialog Cancel, Escape and backdrop; after save; reload with unsaved typing; notification link to the right page. P-block.

---

## A. Dues rate: save and what it applies to

#### TC-07-A1: Saving 2000 stores ₱2,000.00 as 200000 centavos
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (S-TREAS). **Tags:** Provisional — design
- **Setup:** SET-RATE, BILLED-NOV.
- **Action:** Change "Monthly dues" to 2000; "Save settings"; read `config/payment`.
- **Expected:** `monthlyDuesCentavos` = 200000; the field reads "2,000.00" after reload.
- **Don't assert:** `updatedAt` value.

#### TC-07-A2: The rate-change toast names the next period and the new amount
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Setup:** As A1; November 2026 is the last billed period; today Nov 28, 2026.
- **Expected:** "Saved. The next billing run (December 2026) will bill ₱2,000.00 per household."
- **Don't assert:** toast duration.

#### TC-07-A3: The toast's promise holds: the next billing preview uses the new rate
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Action:** After A1, open Collections → Monthly billing and "Generate December 2026 billing".
- **Expected:** Card sub-line "Rate ₱2,000.00 per household"; preview "… bills of ₱2,000.00 each …".
- **Don't assert:** totals (TC-08).

#### TC-07-A4: Bills already created keep their amount after a rate change
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; data check. **Tags:** —
- **Setup:** BILLED-NOV.
- **Action:** Save ₱2,000.00; read every November 2026 bill; U-JUAN opens Dues & Payments.
- **Expected:** Every November bill's `amountCentavos` is still 180000; U-JUAN's November line still reads ₱1,800.00.
- **Don't assert:** —

#### TC-07-A5: The toast names the period correctly on the 1st, before that period is billed
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: controllable server clock · Gap G-2
- **Setup:** Today Dec 1, 2026 08:00 Manila; November billed, December not yet.
- **Expected:** "…The next billing run (December 2026)…". With no period ever billed (first run), which period the toast names: G-2.
- **Don't assert:** the first-run case until G-2.

#### TC-07-A6: The billing card's rate line updates after a save
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Action:** Save ₱2,000.00; open Collections.
- **Expected:** "Rate ₱2,000.00 per household" without signing out.
- **Don't assert:** live update of an already-open Collections tab.

#### TC-07-A7: The homeowner's Dues & Payments header shows the new monthly dues
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Gap G-3
- **Action:** After A1, U-JUAN opens Dues & Payments.
- **Expected:** The header shows ₱2,000.00 (REQ-007 "Read by: Dues & Payments header"), while his November line shows ₱1,800.00. Whether the header should say "from the next bill" to avoid confusion: G-3.
- **Don't assert:** header wording.

#### TC-07-A8: A payee name change is shown on the homeowner's Pay card
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer saves; Homeowner (U-JUAN) reads. **Tags:** —
- **Setup:** SET-FULL.
- **Action:** Payee "ZZ Greenfield Homes HOA Inc."; save; U-JUAN opens Dues & Payments.
- **Expected:** "Pay to ZZ Greenfield Homes HOA Inc."; toast "Saved." (no rate wording).
- **Don't assert:** —

#### TC-07-A9: An account label change is shown on the Pay card
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Homeowner. **Tags:** —
- **Expected:** The new label under the payee name.
- **Don't assert:** —

#### TC-07-A10: An instructions change is shown on the Pay card
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Homeowner. **Tags:** —
- **Expected:** The new instructions, with line breaks kept or collapsed consistently.
- **Don't assert:** line-break handling.

#### TC-07-A11: Saving a rate and the payee together shows the rate toast and saves both
**Priority** P3 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-4
- **Expected:** Both stored; the rate toast. How many activity-log entries (one per field or one per save): G-4.
- **Don't assert:** entry count.

#### TC-07-A12: Saving with nothing changed
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-5
- **Action:** Open the card; press "Save settings" with no edits.
- **Expected:** No change to `config/payment` values. Whether a no-op save writes an audit entry, moves `updatedAt` or shows "Saved.": G-5 (recommended: no entry, no write).
- **Don't assert:** toast and `updatedAt`.

## B. Dues: validation and boundaries

#### TC-07-B1: An empty rate shows "Enter the monthly dues in pesos, more than ₱0"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** Clear "Monthly dues"; "Save settings".
- **Expected:** That message under the field; no call to the server.
- **Don't assert:** —

#### TC-07-B2: A rate of 0 is refused like an empty one
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** Enter 0; save. Then call `saveDuesSettings` with `monthlyDuesCentavos: 0`.
- **Expected:** The same message on screen; the call refused; the saved rate unchanged.
- **Don't assert:** error code.

#### TC-07-B3: An invalid rate keeps the other fields as typed
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** Change payee and instructions, clear dues, save.
- **Expected:** Payee and instructions still show what she typed; the saved values unchanged.
- **Don't assert:** —

#### TC-07-B4: The smallest rate, ₱0.01, is accepted
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** Stored as 1 centavo (after the large-change confirm, B10).
- **Don't assert:** —

#### TC-07-B5: 1850.50 is kept exactly and shown "1,850.50"
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — design
- **Expected:** `monthlyDuesCentavos` = 185050; the field reads "1,850.50" after reload (no 1850.4999 drift).
- **Don't assert:** —

#### TC-07-B6: 1850.555 shows "Use at most 2 decimal places"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** That message; nothing saved; no rounding to 1,850.56.
- **Don't assert:** —

#### TC-07-B7: A non-integer centavo value sent straight to the callable is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct call. **Tags:** Provisional — design
- **Action:** `saveDuesSettings` with `monthlyDuesCentavos` 185050.5; "185050" (string); −100; null.
- **Expected:** All refused; saved rate unchanged.
- **Don't assert:** —

#### TC-07-B8: ₱100,000.00 is accepted; ₱100,000.01 is refused with the cap message
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Action:** Save 100000 (confirm the large change); then 100000.01.
- **Expected:** 100000 stored as 10000000; 100000.01 shows "Monthly dues can't be more than ₱100,000.00. Check the amount." and the rate stays ₱100,000.00.
- **Don't assert:** whether the cap message comes from the screen or the server.

#### TC-07-B9: 150000 is refused by the server even if the screen check is bypassed
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct call. **Tags:** Provisional — design
- **Action:** `saveDuesSettings` with 15000000 centavos.
- **Expected:** Refused; saved rate unchanged; no audit entry.
- **Don't assert:** —

#### TC-07-B10: A change of more than 25% asks "Is that right?" before saving
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Setup:** Rate ₱1,800.00.
- **Action:** Enter 18000; save.
- **Expected:** Dialog "You're changing monthly dues from ₱1,800.00 to ₱18,000.00. Is that right?" with "Yes, save ₱18,000.00" and "Go back"; nothing saved yet.
- **Don't assert:** —

#### TC-07-B11: "Yes, save ₱18,000.00" saves; "Go back" saves nothing and keeps the typed value
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** "Go back": dialog closes, field still reads 18000, rate still ₱1,800.00. "Yes, save": stored ₱18,000.00 and the rate toast.
- **Don't assert:** —

#### TC-07-B12: Dismissing the large-change dialog by backdrop or Escape saves nothing
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Dialog closes (or stays); rate unchanged; the typed value kept.
- **Don't assert:** whether backdrop closes it.

#### TC-07-B13: The 25% threshold, up and down
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-6
- **Setup:** Rate ₱1,800.00.
- **Action:** 2250.00 (exactly +25%); 2250.01; 1350.00 (exactly −25%); 1349.99.
- **Expected (recommended):** No dialog at exactly ±25%; dialog at 2250.01 and 1349.99. Whether decreases count and how "more than 25%" is measured: G-6.
- **Don't assert:** until G-6.

#### TC-07-B14: The first-ever rate save
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-6
- **Setup:** SET-NONE.
- **Action:** Enter 1800; save.
- **Expected:** Saved and stored; no "from {old}" dialog with an empty or ₱0.00 old value. Whether any confirm applies: G-6.
- **Don't assert:** confirm until G-6.

#### TC-07-B15: Non-numeric input is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-7
- **Action:** "18OO" (letter O), "1e3", "1,800.00" (with comma), " 1800 ".
- **Expected:** "18OO" refused with the dues error. "1e3" never saved as ₱1,000.00 without the person seeing it. Comma and surrounding spaces: accepted as 1800 or refused with a clear message: G-7.
- **Don't assert:** comma and spaces handling until G-7.

#### TC-07-B16: A negative rate is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** −1800 shows the dues error; nothing saved.
- **Don't assert:** —

## C. Payee name, account label, instructions

#### TC-07-C1: An empty payee name is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer; direct call. **Tags:** Gap G-8
- **Expected:** The screen refuses with a message under the field; the callable refuses `payeeName: ""`; saved payee unchanged. Message copy is not in the REQ: G-8.
- **Don't assert:** wording.

#### TC-07-C2: A payee name of only spaces is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer; direct call. **Tags:** Gap G-8
- **Expected (recommended):** Treated as empty (trimmed). G-8.
- **Don't assert:** until G-8.

#### TC-07-C3: Payee names of 1 and 80 characters are accepted; 81 is refused
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; direct call for 81. **Tags:** —
- **Expected:** 1 and 80 stored; 81 refused by the screen and by the callable.
- **Don't assert:** wording (G-8).

#### TC-07-C4: Instructions of 500 characters are accepted; 501 is refused
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; direct call. **Tags:** —
- **Expected:** 500 stored; 501 refused by both.
- **Don't assert:** wording (G-8).

#### TC-07-C5: Empty instructions are accepted
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** Saved; the homeowner Pay card shows no empty instruction block or placeholder text.
- **Don't assert:** —

#### TC-07-C6: Account label limits
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-8
- **Expected:** Empty and very long labels are handled with a stated rule (none in the REQ): G-8.
- **Don't assert:** until G-8.

#### TC-07-C7: A 100,000-character payee sent straight to the callable is refused quickly
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, direct call. **Tags:** Provisional — design
- **Expected:** Refused on length before any pattern check; the call returns within normal time.
- **Don't assert:** exact time.

#### TC-07-C8: Markup in the payee name or instructions is shown as text on the Pay card
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer saves; Homeowner reads. **Tags:** —
- **Action:** Payee `ZZ <img src=x onerror=alert(1)>`; instructions `<script>alert(1)</script>`.
- **Expected:** Shown literally on the Pay card, the QR alt text and the activity log; no script runs; no element created from them.
- **Don't assert:** —

#### TC-07-C9: "ñ" and other accented characters are stored and shown unchanged
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Homeowner. **Tags:** —
- **Expected:** "ZZ Asociación de Peñafrancia HOA" round-trips exactly.
- **Don't assert:** —

## D. Uploading and replacing the QR code

#### TC-07-D1: The first QR upload with "REPLACE" typed becomes the current QR
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — design
- **Setup:** SET-RATE (no QR).
- **Action:** "Upload QR code"; choose QR-HOA; type REPLACE; "Use this QR code".
- **Expected:** `config/payment.qrPath` = `config/payment-qr/{uploadId}`, `qrUploadId` set, `qrUpdatedAt` server time, `qrUpdatedBy` S-TREAS.
- **Don't assert:** uploadId format.

#### TC-07-D2: Replacing makes the new image current
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — design
- **Setup:** SET-FULL (QR-HOA current).
- **Action:** "Replace QR code"; QR-HOA-2; REPLACE; confirm.
- **Expected:** `qrUploadId` is QR-HOA-2's id; `qrUpdatedAt` moved.
- **Don't assert:** —

#### TC-07-D3: "Use this QR code" stays disabled until REPLACE is typed
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-10
- **Action:** Leave empty; type "REPLAC"; "REPLACE".
- **Expected:** Disabled for empty and "REPLAC"; enabled for "REPLACE". Lower case "replace" and " REPLACE " with spaces: G-10.
- **Don't assert:** case and spaces until G-10.

#### TC-07-D4: The dialog carries the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "Replace the payment QR code? Every homeowner will pay into the account in the new code. The other treasurers and the board will be told." · field labelled "Type REPLACE to confirm" · "Use this QR code" · "Cancel".
- **Don't assert:** —

#### TC-07-D5: A code with a merchant name shows "This QR code says it pays: {name}" next to the entered payee
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Blocked — spike (whether real QR Ph codes carry tag 59; test payloads do)
- **Action:** Choose QR-HOA.
- **Expected:** "This QR code says it pays: ZZ GREENFIELD HOA" shown beside "Payee name shown to homeowners: ZZ Greenfield Homes HOA".
- **Don't assert:** layout.

#### TC-07-D6: A code without a merchant name can still be saved, with a warning
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Action:** QR-P2P; REPLACE; confirm.
- **Expected:** "We couldn't read a name from this code. Scan it with your own e-wallet app and check the name before saving." shown; saving still allowed and succeeds.
- **Don't assert:** —

#### TC-07-D7: An image with no QR code is refused and the current QR is unchanged
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Setup:** SET-FULL.
- **Action:** Choose QR-NOQR.
- **Expected:** "We couldn't find a QR code in this image. Upload the QR image from your bank or e-wallet."; "Use this QR code" not available; `qrUploadId` unchanged.
- **Don't assert:** —

#### TC-07-D8: A damaged QR (CRC fails) is refused like no QR
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** QR-DAMAGED.
- **Expected:** The "couldn't find a QR code" message; current QR unchanged.
- **Don't assert:** —

#### TC-07-D9: After a replacement the previous image is still in Storage
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Data check after D2. **Tags:** Staging note: admin SDK read
- **Expected:** QR-HOA's object still exists at its path, unchanged; QR-HOA-2's object exists.
- **Don't assert:** —

#### TC-07-D10: A mistaken replacement is put back by uploading the old image again
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Action:** After D2, upload QR-HOA's image again; REPLACE; confirm.
- **Expected:** A new upload id becomes current showing the QR-HOA code; alerts and log entry as for any replacement.
- **Don't assert:** —

#### TC-07-D11: Cancelling the dialog after choosing an image leaves the current QR unchanged
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Action:** Choose QR-HOA-2; "Cancel".
- **Expected:** `qrUploadId` unchanged; no alert; no log entry. (The uploaded object may remain as an orphan, K-block.)
- **Don't assert:** whether the object was uploaded before confirm.

#### TC-07-D12: A 9 MB file or a PDF shows "Upload a PNG or JPG image under 2 MB."
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** FILE-9MB; FILE-PDF.
- **Expected:** That message for each; current QR unchanged.
- **Don't assert:** —

#### TC-07-D13: HEIC, WebP, GIF and SVG are refused with the same message
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "Upload a PNG or JPG image under 2 MB." for each (SVG especially: it can carry script).
- **Don't assert:** —

#### TC-07-D14: A file exactly at the size limit is accepted; one byte over is refused
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-9
- **Expected:** FILE-2MB-EXACT accepted; FILE-2MB-PLUS1 refused. Whether "2 MB" is 2,000,000 or 2,097,152 bytes (screen, Storage rule and callable must agree): G-9.
- **Don't assert:** the byte count until G-9.

#### TC-07-D15: The QR is read in browsers with and without `BarcodeDetector`
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer in Chromium, Firefox and WebKit. **Tags:** Assumption: Chromium has `BarcodeDetector`, others fall back to jsQR
- **Expected:** QR-HOA's name is read in each.
- **Don't assert:** which decoder ran.

#### TC-07-D16: A cut-off merchant name is shown as read, not padded or guessed
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** QR-LONGNAME.
- **Expected:** The name as encoded; no "…" added as if it were complete; saving allowed.
- **Don't assert:** —

#### TC-07-D17: A merchant name containing markup is shown as text
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Action:** QR-MARKUP.
- **Expected:** "This QR code says it pays: <img src=x onerror=alert(1)>" literally; no script.
- **Don't assert:** —

#### TC-07-D18: An image with two QR codes
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-11
- **Action:** QR-TWO.
- **Expected:** Not silently saved as if one code; behaviour (refuse, or read the first and warn): G-11.
- **Don't assert:** until G-11.

#### TC-07-D19: The QR button reads "Upload QR code" the first time and "Replace QR code" after
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** SET-RATE: "Upload QR code" with "No QR code yet. Homeowners see 'Pay at the admin office' until you upload one."; SET-FULL: "Replace QR code".
- **Don't assert:** —

#### TC-07-D20: There is no control to go back to a sample QR or remove the QR
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** No "Use sample QR" (mock-up `clearQr`) or delete control on the card.
- **Don't assert:** —

## E. Officer alerts

#### TC-07-E1: Every other treasurer and every board member gets the replacement alert
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer replaces; S-TREAS-2, S-BOARD-1, S-BOARD-2 read. **Tags:** —
- **Setup:** SET-FULL; replace on Dec 2, 2026 (Manila).
- **Expected:** Each of the three has one notification "The payment QR code was replaced by ZZ Carmela Cruz on Dec 2, 2026. If you didn't expect this, contact the board."
- **Don't assert:** unread badge count (exclusive lane elsewhere).

#### TC-07-E2: The person who replaced it gets the self-alert
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (S-TREAS). **Tags:** —
- **Expected:** One notification "You replaced the payment QR code on Dec 2, 2026. If this wasn't you, contact the board now." and not the officer alert.
- **Don't assert:** —

#### TC-07-E3: The admin office does not get an alert
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office. **Tags:** —
- **Expected:** No new notification for S-ADMIN.
- **Don't assert:** —

#### TC-07-E4: Homeowners and guards do not get an alert
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner, Guard. **Tags:** —
- **Expected:** No new notification for U-JUAN, U-MARIA or S-GUARD.
- **Don't assert:** —

#### TC-07-E5: The QR, the log entry and the alerts are saved together or not at all
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: inject a failure on the notification write · Provisional — design
- **Expected:** With the failure: `qrUploadId` unchanged, no `settings.qrReplaced` entry, no notifications. Without: all three present.
- **Don't assert:** error text.

#### TC-07-E6: The first-ever upload and alerts
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; other officers. **Tags:** Gap G-1
- **Setup:** SET-RATE.
- **Action:** First upload (D1).
- **Expected:** The QR is current and the activity log records it. Whether officers are alerted, whether the self-alert is sent, and whether the log reads "replaced" for a first upload: G-1 (recommended: alert and self-alert as for a replacement).
- **Don't assert:** alerts until G-1.

#### TC-07-E7: With no other officer, the dialog says "No other officer will be alerted. Ask the board to set up accounts."
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, the only treasurer, no board accounts. **Tags:** Staging note: environment with one treasurer
- **Expected:** That line inside the QR dialog.
- **Don't assert:** —

#### TC-07-E8: With no other officer, the replacer still gets the self-alert
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, alone. **Tags:** —
- **Expected:** After confirming, one self-alert; no officer alerts.
- **Don't assert:** —

#### TC-07-E9: With another officer present, the no-officer line is not shown
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer with S-BOARD-1 present. **Tags:** —
- **Expected:** No "No other officer will be alerted" line.
- **Don't assert:** —

#### TC-07-E10: A removed board member or treasurer gets no alert
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-EXTREAS (removed). **Tags:** —
- **Expected:** No new notification for the removed account (REQ-011 "A removed staff member gets no new notifications").
- **Don't assert:** —

#### TC-07-E11: A treasurer who is also a homeowner gets the officer alert once
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS-HO. **Tags:** —
- **Expected:** One officer alert, visible in the treasurer view; not duplicated in "My household".
- **Don't assert:** which view shows the bell.

#### TC-07-E12: Every QR replacement raises the owner's alert
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Staging note: alerting policy on staging
- **Expected:** One owner alert per `settings.qrReplaced`.
- **Don't assert:** channel.

## F. What homeowners see

#### TC-07-F1: Before any QR, Dues & Payments says "Online payment isn't set up yet. Pay at the admin office for now." and hides the payment form
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** SET-RATE.
- **Expected:** That line in place of the QR; no payment form (REQ-010) and no reference-number field.
- **Don't assert:** —

#### TC-07-F2: With a QR set, the homeowner sees it labelled "SCAN TO PAY"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** SET-FULL.
- **Expected:** The current image with "SCAN TO PAY" under it; the payment form shown.
- **Don't assert:** —

#### TC-07-F3: Under the QR: "QR code updated Dec 2, 2026"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "QR code updated Dec 2, 2026"; no name of who replaced it.
- **Don't assert:** —

#### TC-07-F4: The QR image's alt text is "Payment QR code for {payee name}"
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, screen reader. **Tags:** —
- **Expected:** "Payment QR code for ZZ Greenfield Homes HOA".
- **Don't assert:** —

#### TC-07-F5: "SAMPLE QR" appears nowhere in the portal
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, Treasurer, Admin office. **Tags:** —
- **Expected:** No "SAMPLE QR" label or sample canvas on any screen, with or without a QR set.
- **Don't assert:** —

#### TC-07-F6: After a replacement, the homeowner sees the new QR and date on the next open
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** —
- **Action:** After D2, U-JUAN opens (or reloads) Dues & Payments.
- **Expected:** The QR-HOA-2 image (decoding it gives QR-HOA-2's payload, never the old cached image) and the new date.
- **Don't assert:** —

#### TC-07-F7: The Pay card shows payee, account label and instructions as saved
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** "Pay to {payee}", the account label, and the instructions, all from `config/payment`.
- **Don't assert:** —

#### TC-07-F8: A homeowner with Dues & Payments open while the QR is replaced
**Priority** P2 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-12 · Staging note: two sessions
- **Expected:** At the latest after a reload the new QR shows. Whether the open page updates by itself or warns: G-12. REQ-010's "records which QR code was shown" covers the payment itself.
- **Don't assert:** live update until G-12.

#### TC-07-F9: Staging shows the "TEST, DO NOT PAY" sample
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner on `hoa-portal-staging`. **Tags:** Staging only
- **Expected:** The staging QR is QR-TEST with "TEST, DO NOT PAY" visible in the image.
- **Don't assert:** —

## G. Two treasurers, double taps, stale screens

#### TC-07-G1: A save after someone else's save is refused with the stale-edit message
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer and second treasurer. **Tags:** Staging note: two sessions
- **Action:** Both open Settings; S-TREAS-2 saves; S-TREAS changes dues and saves.
- **Expected:** "Someone else changed these settings since you opened them. Reload to see the latest, then make your change again."; S-TREAS-2's values stay.
- **Don't assert:** —

#### TC-07-G2: After a stale refusal, the typing is kept and nothing typed is saved
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** S-TREAS's typed values still on screen; `config/payment` holds S-TREAS-2's values; no audit entry for S-TREAS's attempt.
- **Don't assert:** —

#### TC-07-G3: Pressing "Save settings" twice saves and logs once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** Button reads "Saving…" and is disabled in flight; one `settings.changed` entry for the change; no stale-edit message from the second tap.
- **Don't assert:** —

#### TC-07-G4: Pressing "Use this QR code" twice replaces once and alerts once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** One `settings.qrReplaced` entry; each officer has one alert; the replacer one self-alert.
- **Don't assert:** —

#### TC-07-G5: Two treasurers replacing the QR at once leave one winner
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer and second treasurer. **Tags:** Staging note: two sessions, confirm within a second
- **Expected:** One replacement succeeds; the other gets the stale-edit message; one set of alerts.
- **Don't assert:** which wins.

#### TC-07-G6: A dues save after a QR replacement in another session is refused as stale
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer and second treasurer. **Tags:** —
- **Expected:** Stale-edit message (both share `updatedAt`); the dues change is not saved.
- **Don't assert:** —

#### TC-07-G7: A save that fails to reach the server shows the save error and keeps the typing
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Staging note: block the callable
- **Expected:** "We couldn't save. Check your connection and try again."; fields kept; button enabled again.
- **Don't assert:** —

## H. Storage rules and server checks on the QR

#### TC-07-H1: The treasurer can create an object under `config/payment-qr/` with her own `uploaderUid`
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct upload. **Tags:** Provisional — design
- **Expected:** Allowed.
- **Don't assert:** —

#### TC-07-H2: The treasurer cannot overwrite or delete an existing QR object
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct Storage calls. **Tags:** Provisional — design
- **Expected:** Upload to an existing path refused; delete refused; the object unchanged.
- **Don't assert:** —

#### TC-07-H3: The admin office cannot upload to the QR path
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office. **Tags:** —
- **Expected:** Refused explicitly.
- **Don't assert:** —

#### TC-07-H4: Homeowner, board and guard cannot upload to the QR path
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner, Board, Guard. **Tags:** —
- **Expected:** Each refused explicitly.
- **Don't assert:** —

#### TC-07-H5: An upload whose `uploaderUid` names someone else is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — design
- **Action:** Upload with `uploaderUid` = S-TREAS-2's uid; and with no `uploaderUid`.
- **Expected:** Both refused.
- **Don't assert:** —

#### TC-07-H6: `replacePaymentQr` refuses another treasurer's upload id
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct call. **Tags:** Provisional — design
- **Setup:** S-TREAS-2 uploaded an object but didn't confirm.
- **Action:** S-TREAS calls `replacePaymentQr` with that id.
- **Expected:** Refused; current QR unchanged; no alert, no entry.
- **Don't assert:** —

#### TC-07-H7: `replacePaymentQr` refuses an upload id with no object
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct call. **Tags:** Provisional — design
- **Expected:** Refused; unchanged.
- **Don't assert:** —

#### TC-07-H8: `replacePaymentQr` with an older upload of one's own
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct call. **Tags:** Gap G-13
- **Action:** After D2, call with QR-HOA's original upload id (hers).
- **Expected:** Either allowed as a normal replacement (alerts, log) or refused; never a replacement without alerts and a log entry. G-13.
- **Don't assert:** which until G-13.

#### TC-07-H9: `replacePaymentQr` refuses an object over the size limit or of the wrong type, even if Storage accepted it
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, direct calls. **Tags:** Staging note: object placed with the admin SDK · Provisional — design
- **Action:** Objects of 3 MB PNG and of type `application/pdf` at the QR path; call with each id.
- **Expected:** Both refused; current QR unchanged.
- **Don't assert:** —

#### TC-07-H10: A PDF named and typed as PNG is refused
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-14
- **Action:** FILE-SPOOF through the dialog.
- **Expected:** Refused at the "no QR code found" step on screen. Whether the server checks content, not just the declared type: G-14.
- **Don't assert:** server-side content check until G-14.

#### TC-07-H11: Any signed-in user can read the current QR; a signed-out visitor can't
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, Guard; Signed-out. **Tags:** —
- **Expected:** Signed-in reads allowed; signed-out refused.
- **Don't assert:** —

## M. Who can change settings

#### TC-07-M1: Firestore refuses every client write to `config/payment`, including the treasurer's
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, Admin office, Board, Homeowner, Guard. **Tags:** Provisional — design
- **Action:** Each tries set, update and delete on `config/payment`.
- **Expected:** All refused explicitly; document unchanged.
- **Don't assert:** —

#### TC-07-M2: The treasurer's callables succeed
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** —
- **Expected:** `saveDuesSettings` and `replacePaymentQr` allowed (covered by A1, D2; this case asserts the role decision only).
- **Don't assert:** —

#### TC-07-M3: The admin office's callable requests are refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office. **Tags:** —
- **Expected:** Both callables refused; nothing changes; no entry; no alert.
- **Don't assert:** error code.

#### TC-07-M4: Board, homeowner and guard callable requests are refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Board, Homeowner, Guard. **Tags:** —
- **Expected:** All refused.
- **Don't assert:** —

#### TC-07-M5: A homeowner cannot change settings by any route
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-MARIA). **Tags:** —
- **Expected:** Firestore write refused (M1), callables refused (M4), Storage upload refused (H4): this case runs the three in one sitting from her account as the acceptance proof.
- **Don't assert:** —

#### TC-07-M6: A removed treasurer with a valid token, and a claim without a staff document, are refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-EXTREAS; claim-only account. **Tags:** L-004
- **Expected:** Callables refused; Storage upload refused (rule's `firestore.get()` on `staff/{uid}`).
- **Don't assert:** —

#### TC-07-M7: An admin write to `config/settings` can't change the dues
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office. **Tags:** Gap G-15 · Provisional — design
- **Action:** Write `monthlyDuesCentavos: 1` and `qrPath` into `config/settings`.
- **Expected:** Refused by a closed field list (recommended), or, if accepted, the billing card and Pay card still read `config/payment` unchanged. Whether `config/settings` has a closed field list: G-15.
- **Don't assert:** refusal until G-15.

#### TC-07-M8: A signed-out visitor cannot read `config/payment`
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Signed-out. **Tags:** —
- **Expected:** Refused explicitly.
- **Don't assert:** —

#### TC-07-M9: Every signed-in homeowner can read `config/payment`
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner; not-linked account. **Tags:** Gap G-16
- **Expected:** Linked homeowner allowed. A not-linked account (no household): "every signed-in user" says allowed; whether that is intended: G-16.
- **Don't assert:** not-linked until G-16.

#### TC-07-M10: A guard's read of `config/payment`
**Priority** P3 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Guard. **Tags:** Gap G-16
- **Expected:** Allowed by "every signed-in user". The document holds the dues rate and payment cap (HOA data, not a household's finances). Confirm intended: G-16.
- **Don't assert:** until G-16.

## J. Activity log entries

#### TC-07-J1: A dues change writes `settings.changed` with field, before and after
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; data check. **Tags:** Provisional — design
- **Expected:** One entry: field monthly dues, before 180000, after 200000, actor S-TREAS (Treasurer). (Sentence: TC-06-A13.)
- **Don't assert:** —

#### TC-07-J2: A payee change is logged
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Board reads the log. **Tags:** Gap G-4 (TC-06 G-4)
- **Expected:** "ZZ Carmela Cruz (Treasurer) changed the payee name" in the log; the entry holds the old and new value (REQ-007) or not (REQ-006): G-4.
- **Don't assert:** values until G-4.

#### TC-07-J3: A QR replacement writes `settings.qrReplaced`
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; data check. **Tags:** Provisional — design
- **Expected:** One entry with actor S-TREAS and the new upload id (so the clean-up job keeps the image, K2); log reads "ZZ Carmela Cruz (Treasurer) replaced the payment QR code".
- **Don't assert:** —

#### TC-07-J4: A refused save writes no entry
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer (stale), Admin office (refused). **Tags:** —
- **Expected:** No `settings.*` entry from either attempt.
- **Don't assert:** —

## K. Daily clean-up of orphaned uploads

#### TC-07-K1: An orphaned upload older than 7 days is deleted
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Daily job. **Tags:** Staging note: controllable clock, admin SDK · Provisional — design
- **Setup:** An object uploaded 8 days ago, never current, not in any audit entry.
- **Expected:** Deleted after the job runs.
- **Don't assert:** job schedule.

#### TC-07-K2: The current image and every image named in an audit entry are kept
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Daily job. **Tags:** Provisional — design
- **Setup:** Current QR-HOA-2 (uploaded 30 days ago); previous QR-HOA (in a `settings.qrReplaced` entry, 60 days ago).
- **Expected:** Both kept.
- **Don't assert:** —

#### TC-07-K3: An orphan of 6 days is kept; the 7-day edge
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Daily job. **Tags:** Gap G-17
- **Expected:** 6 days kept; 8 days deleted; exactly 7 days: G-17.
- **Don't assert:** the 7-day case.

#### TC-07-K4: An upload in an open dialog isn't deleted from under the treasurer
**Priority** P3 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; daily job. **Tags:** —
- **Setup:** Upload chosen just now; job runs; confirm.
- **Expected:** The confirm succeeds (the object is younger than 7 days).
- **Don't assert:** —

## P. Navigation

#### TC-07-P1: The treasurer reaches Settings → Dues and payment from the menu
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Settings highlighted (one `aria-current`); both cards visible.
- **Don't assert:** card order.

#### TC-07-P2: The board has no Dues and payment card
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Board. **Tags:** —
- **Expected:** No Settings item in the board menu (REQ-002 R1); opening the Settings address shows the no-access page or no payment card.
- **Don't assert:** which.

#### TC-07-P3: The admin office sees the card read-only with the note
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office (S-ADMIN). **Tags:** —
- **Expected:** Values shown; "Only the treasurer can change dues and payment settings."; no editable field; no "Save settings" or "Upload/Replace QR code".
- **Don't assert:** styling of read-only fields.

#### TC-07-P4: Homeowner and guard opening the Settings address see the no-access page
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, Guard. **Tags:** —
- **Expected:** "You don't have access to this page".
- **Don't assert:** —

#### TC-07-P5: Leaving with unsaved typing
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-18
- **Action:** Type a new rate; navigate to Homeowners; come back. Reload with unsaved typing.
- **Expected:** Nothing saved. Whether a "discard changes?" prompt appears (REQ-003 has one for the household dialog): G-18.
- **Don't assert:** prompt.

#### TC-07-P6: An announcement pop-up appearing while the QR dialog is open doesn't lose the upload
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Depends on REQ-017 (S3)
- **Expected:** After the pop-up, the dialog still holds the chosen image and typed REPLACE; confirm works.
- **Don't assert:** stacking.

#### TC-07-P7: The officer alert opens a page inside the portal
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Board (S-BOARD-1). **Tags:** Gap G-19
- **Action:** Open the QR alert.
- **Expected:** Marked read; opens a page the board can see (it can't open Settings). Target page: G-19.
- **Don't assert:** target until G-19.

## Q. Usability and accessibility (WCAG 2.2 AA, 375 px)

#### TC-07-Q1: The card is one column at 375 px and every control is usable
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer on a phone. **Tags:** DEF-001
- **Expected:** No horizontal scroll; dialogs fit; typed confirmation reachable above the keyboard.
- **Don't assert:** —

#### TC-07-Q2: The homeowner Pay card at 375 px
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner on a phone. **Tags:** DEF-001
- **Expected:** QR large enough to scan from another phone or to save; "SCAN TO PAY" and "QR code updated" visible; no horizontal scroll.
- **Don't assert:** pixel size.

#### TC-07-Q3: "Monthly dues" opens the decimal keypad, with "₱" outside the field
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer on a phone. **Tags:** —
- **Expected:** `inputmode="decimal"`; the ₱ prefix is not part of the value.
- **Don't assert:** —

#### TC-07-Q4: Errors sit under their field, are announced, and validate on blur
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, screen reader. **Tags:** —
- **Expected:** Leaving an empty dues field shows the error under it, linked to the field and announced.
- **Don't assert:** —

#### TC-07-Q5: The QR dialog does not close on a backdrop click
**Priority** P1 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Gap G-20
- **Action:** Choose an image, type REPLACE, click the backdrop; then press Escape.
- **Expected:** Backdrop: dialog stays with image and typing. Escape: the app-wide rule (NAV-06) closes modals; whether this dialog is an exception: G-20.
- **Don't assert:** Escape until G-20.

#### TC-07-Q6: Focus moves into the dialogs and returns to the button afterwards
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, keyboard. **Tags:** —
- **Expected:** On open, focus in the dialog; on close, back on "Replace QR code" or "Save settings".
- **Don't assert:** —

#### TC-07-Q7: Loading shows a skeleton card
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Skeleton card, not empty fields that could be saved.
- **Don't assert:** —

#### TC-07-Q8: Saving while offline doesn't leave "Saving…" forever
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Assumption: callables fail when offline rather than queue
- **Expected:** The save error shows; fields kept.
- **Don't assert:** timeout.

#### TC-07-Q9: Labels and hints are visible and contrast meets 4.5:1
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** Each field has a visible label and the dues hint "Applies to the next billing run. Bills already created keep their amount."
- **Don't assert:** —

## R. Copy consistency

#### TC-07-R1: Field labels match the copy of record, not the mock-up
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Expected:** "Monthly dues per household (₱)", "Payee name shown to homeowners" (not the mock-up's "Payee name shown on the QR"), "Account label", "Payment instructions"; dues hint as Q9 (not the mock-up's "Past bills stay the same.").
- **Don't assert:** —

#### TC-07-R2: Dates read "Dec 2, 2026" in the alert, the self-alert and "QR code updated"
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, Board, Homeowner. **Tags:** —
- **Expected:** The same date in the same format in all three.
- **Don't assert:** —

## S. Back-compat and environments

#### TC-07-S1: Before the first save, the card shows its "no rate" and "no QR" states
**Priority** P1 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** —
- **Setup:** SET-NONE.
- **Expected:** Dues field empty (not "0.00"); "No QR code yet…"; the billing card shows "Set the monthly dues in Settings before billing." (TC-08).
- **Don't assert:** —

#### TC-07-S2: Before the first save, the homeowner sees the "not set up" state, not an error
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Setup:** SET-NONE (no `config/payment` document at all).
- **Expected:** "Online payment isn't set up yet. Pay at the admin office for now."; no load error.
- **Don't assert:** header dues line (G-3).

#### TC-07-S3: Saving the first rate before any payee
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-8
- **Setup:** SET-NONE.
- **Action:** Enter dues only; save.
- **Expected:** Either refused for the missing payee (required), with a message, or saved. G-8.
- **Don't assert:** until G-8.

#### TC-07-S4: No production QR is ever in staging data, and staging's QR is never in production
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Go-live checklist (manual). **Tags:** Staging only
- **Expected:** Staging's `config/payment-qr/` holds only test images; the go-live checklist has the line "the treasurer uploads the production QR in production only".
- **Don't assert:** production contents (never read).

#### TC-07-S5: The payment cap set by the developer script isn't changed by a settings save
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Provisional — design
- **Action:** Save dues; read `maxPaymentCentavos`; call `saveDuesSettings` with `maxPaymentCentavos` in `changes`.
- **Expected:** Unchanged after the save; the call carrying it is refused or ignores it.
- **Don't assert:** which.

## T. Dates in Manila

#### TC-07-T1: A replacement at 11:30 PM Manila is dated that day everywhere
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Board; Homeowner. **Tags:** Staging note: controllable clock, server in UTC
- **Setup:** Dec 2, 2026 23:30 Manila (15:30 UTC).
- **Expected:** Alerts and "QR code updated" say Dec 2, 2026.
- **Don't assert:** —

#### TC-07-T2: A replacement at 12:30 AM Manila is dated the new day, though UTC is the day before
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; Board; Homeowner. **Tags:** Staging note: controllable clock
- **Setup:** Dec 3, 2026 00:30 Manila (Dec 2 16:30 UTC).
- **Expected:** Dec 3, 2026 in the alert, the self-alert and "QR code updated".
- **Don't assert:** —

#### TC-07-T3: A homeowner on a phone in another time zone sees the Manila date
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, browser zone America/Los_Angeles. **Tags:** —
- **Setup:** As T2.
- **Expected:** "QR code updated Dec 3, 2026".
- **Don't assert:** —

## X. Exploratory charters

#### TC-07-X1: 20 minutes trying to swap the QR without anyone noticing
**Priority** P1 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, admin office and homeowner with devtools. **Tags:** —
- **Charter:** Upload under other paths, reuse ids, race confirm and cancel, call callables with crafted payloads, upload from the admin account, try a replacement that skips the alert or the log. Any route that changes what homeowners scan without an entry and an alert is a P1 finding. Time-box 20 min.

#### TC-07-X2: 15 minutes with real-looking QR images from phones
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer on a phone and a laptop. **Tags:** Blocked — spike (needs sample test codes from GCash, Maya and a bank, generated for testing, never a live account)
- **Charter:** Screenshots with borders, rotated, low light, compressed by chat apps, cropped. Note which read, which give a name, which are refused. Time-box 15 min.

---

## Cases that hinge on open decisions

| Open item | Who decides | Cases |
|---|---|---|
| Do QR Ph person-to-person codes carry tag 59? (15-minute spike) | Developer, with the treasurer's QR | D5, X2 (test payloads exercise the parser either way) |
| Staff two-step verification before the real QR is uploaded | Owner | None here (TC-01/TC-02 scope); X1 notes the risk |
| More than one collection account | Treasurer | None (one QR in R1) |
| Rate change needs a board resolution reference | HOA board | None until decided |
| Charges other than monthly dues | Treasurer | None (out of scope) |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Dues rate: save and what it applies to | 12 | 5 |
| B | Dues validation and boundaries | 16 | 9 |
| C | Payee, account label, instructions | 9 | 2 |
| D | Upload and replace the QR | 20 | 11 |
| E | Officer alerts | 12 | 5 |
| F | What homeowners see | 9 | 5 |
| G | Two treasurers, double taps, stale | 7 | 4 |
| H | Storage rules and server checks | 11 | 8 |
| M | Who can change settings | 10 | 8 |
| J | Activity log entries | 4 | 3 |
| K | Orphan clean-up | 4 | 1 |
| P | Navigation | 7 | 2 |
| Q | Usability, WCAG 2.2 AA, 375 px | 9 | 2 |
| R | Copy consistency | 2 | 0 |
| S | Back-compat, environments | 5 | 1 |
| T | Dates in Manila | 3 | 1 |
| X | Exploratory charters | 2 | 1 |
| **Total** | | **142** | **68** |

By stated type: security / role 27 · boundary 25 · negative 19 · happy path 14 · integration 14 · usability, UI/UX and responsive 16 · data integrity 9 · concurrency / stale reference 8 · navigation 6 · back-compat 2 · exploratory 2.

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | The first-ever QR upload: are other officers alerted, is the self-alert sent, and is it logged as `settings.qrReplaced` ("replaced the payment QR code") although nothing was replaced? The "Uploading the real QR code" scenario mentions none of these | D1, E6 |
| G-2 | Which period the rate-change toast names before the first billing run (no run yet; `config/billing.firstPeriod` may not be set) | A5 |
| G-3 | The Dues & Payments header shows the new rate at once while the homeowner's current bills show the old one; should it say "from {next period}"? | A7, S2 |
| G-4 | One `settings.changed` entry per field or per save; does a payee change store old and new values (REQ-007) or the field only (REQ-006)? | A11, J2 |
| G-5 | A save with no change: entry, `updatedAt`, toast? | A12 |
| G-6 | The 25% check: decreases too? Exactly 25%? First-ever save (no old rate)? | B13, B14 |
| G-7 | Dues input with a comma ("1,800.00"), surrounding spaces, exponent ("1e3") | B15 |
| G-8 | No copy of record for an empty or too-long payee name, too-long instructions, or account label limits; is the payee required on the very first save? Is the payee trimmed? | C1–C4, C6, S3 |
| G-9 | "2 MB": 2,000,000 or 2,097,152 bytes; the screen, the Storage rule and the callable must agree | D14 |
| G-10 | Typed confirmation: case-sensitive? Spaces trimmed? | D3 |
| G-11 | An image holding two QR codes | D18 |
| G-12 | A homeowner page open during a QR replacement: live update, warning, or only on reload? | F8 |
| G-13 | `replacePaymentQr` pointing back at an older upload id of one's own (not offered on screen): allowed with alerts, or refused? | H8 |
| G-14 | Does the server check the file's content, or only the declared type and size? | H10 |
| G-15 | Does `config/settings` have a closed field list, so an admin can't add `monthlyDuesCentavos` or `qrPath` there? | M7 |
| G-16 | "Every signed-in user reads `config/payment`" includes not-linked accounts and guards (dues rate, payment cap). Intended? | M9, M10 |
| G-17 | Orphan clean-up at exactly 7 days | K3 |
| G-18 | Unsaved changes when leaving the card: prompt or silent discard? | P5 |
| G-19 | Where the officer QR alert opens for a board member who can't open Settings | P7 |
| G-20 | Escape on the QR dialog: NAV-06 (Escape closes a modal) vs "does not close on a backdrop click (it holds an upload)" | Q5 |

**No new failure pattern** beyond the owner's table was found.
