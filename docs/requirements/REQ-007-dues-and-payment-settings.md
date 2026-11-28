# REQ-007: Dues rate and QR payment settings

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-002 Billing and statement](../epics/EPIC-002-billing-and-statement.md) |
| Backlog story | [07 Dues rate and QR payment settings](../backlog/BACKLOG.md#07-dues-rate-and-qr-payment-settings) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted. Sol Arch reviewed: supports Option A with changes (applied in r3) |
| Mockup | Screens 7A–7E of the [REQ-005 to REQ-011 mockup](../mockups/req-005-011-mockup.html). Not yet published as an artifact: ready for the main session to publish |
| Architecture | SA-001 §3, §4.2 (`config/settings`, Storage `config/payment-qr.png`), §8.3 (settings changes audited); Draft on branch `docs/sa-001-architecture`. **Departs from SA-001 §3:** dues and QR settings are written by callables into `config/payment`, not by a client write (Sol Arch review) |
| Depends on | REQ-002 (roles), REQ-006 (activity log), REQ-011 (notifications, for the QR-change alert) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (`config/payment` written only by callables `saveDuesSettings` / `replacePaymentQr`, audit and alert in the same transaction, self-alert and no-officer warning, "QR code updated {date}" for homeowners, advisory read-back wording, stale billing preview, ₱100,000.00 dues cap) · r4, 2026-11-28: owner approval recorded; recommendations accepted · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Sol Arch confirmed the read-back is cheap (+0.5 day), so decision 3 is **yes**, as an advisory check that never blocks a save. Questions for the treasurer or the HOA board under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (one settings card, new rate applies from the next billing run), B (rates with a start month) or C (no screen; the developer changes settings on request) | **A** |
| 2 | Replacing the payment QR code is the one change that could send every household's money to the wrong account. Extra protection: typed confirmation, an in-app alert to every other treasurer and board member, and the old image kept | **Yes, all three** |
| 3 | Check that an uploaded image really is a QR code, and show the payee name read from it so the treasurer can compare. Feasibility not yet confirmed (Sol Arch) | **Yes if Sol Arch confirms it is cheap**; otherwise the typed confirmation alone |
| 4 | Who may change dues and QR settings | **Treasurer only**, as REQ-002 says. The admin office sees the card read-only |

## Problem

Every bill and every QR payment depends on three facts: the monthly dues, the QR code homeowners scan, and the payee name they expect to see in their e-wallet. In the mock-up these are a free settings form anyone can change, the QR is a sample, and nothing records who changed what. A wrong rate bills 623 households the wrong amount; a replaced QR code sends their money to someone else's account.

Who has the problem: the [Treasurer](../product/PERSONAS.md#treasurer), who sets them, and every [Homeowner](../product/PERSONAS.md#homeowner), who pays into what is shown.

**How often:** the rate changes rarely (typically when the general assembly approves a new rate); the QR code changes only when the HOA changes bank or e-wallet account. This is a small, rarely used screen, so it should be simple and very hard to get wrong, not feature-rich.

## Options

### Option A: One "Dues and payment" card in Settings; a new rate applies from the next billing run (recommended)

- **How it works:** Settings shows one card with monthly dues, payee name, account label, payment instructions and the QR image. Saving a new rate affects only bills not yet created; existing bills keep their amount. A rate change of more than 25% asks "Is that right?" to catch an extra zero.
- **Where it lives:** Settings → Dues and payment (treasurer); read-only for the admin office.
- **Cost:** cheap.
- **Excludes:** different rates by lot size or phase (EPIC-002 out of scope).
- **Honest downside:** to change the rate from January, the treasurer must save it after the December run and before the January run. The billing preview (REQ-008) shows the rate it will use, which is the check.

### Option B: Rates with a start month

- **How it works:** the treasurer enters "₱2,000.00 from January 2027" ahead of time; the billing run picks the rate for its period.
- **Cost:** moderate: a small rate history, plus validation that periods don't overlap or skip.
- **Honest downside:** more to understand for a change made about once a year. Worth it only if rates change often or must be entered well in advance.

### Option C: No screen; the developer changes settings on the treasurer's written request

- **Cost:** cheapest.
- **Honest downside:** if the HOA's account changes, homeowners keep paying into the old QR until the developer is free. The treasurer can't fix a typo in the instructions.

### Recommendation

**Option A,** with the QR protections in decision 2. It covers a once-a-year change with one field and a confirmation; Option B can be added later without changing bills, because each bill already stores its own amount.

## Story

As a treasurer, I want to set the monthly dues, upload the HOA's QR Ph code, and set the payee name and payment instructions, so that homeowners pay the right amount into the right account.

## Acceptance criteria (Option A)

```gherkin
Feature: Dues and payment settings

  Background:
    Given Carmela Cruz holds the treasurer role

  Scenario: A new rate applies from the next billing run only
    Given monthly dues are ₱1,800.00 and November 2026 is already billed
    When Carmela changes "Monthly dues" to 2000 and presses "Save settings"
    Then she sees "Saved. The next billing run (December 2026) will bill ₱2,000.00 per household."
    And every November 2026 bill still reads ₱1,800.00
    And the December 2026 billing preview (REQ-008) shows "₱2,000.00 per household"
    And if a billing preview was already open at ₱1,800.00, generating it is refused with "The monthly dues changed since you opened this preview. Check the new figures."

  Scenario: A large change is confirmed first
    Given monthly dues are ₱1,800.00
    When Carmela enters 18000 and presses "Save settings"
    Then she sees "You're changing monthly dues from ₱1,800.00 to ₱18,000.00. Is that right?"
    And nothing is saved until she presses "Yes, save ₱18,000.00"

  Scenario: An invalid rate is not saved
    When Carmela clears "Monthly dues" and presses "Save settings"
    Then the field shows "Enter the monthly dues in pesos, more than ₱0"
    And the saved rate is unchanged
    And the other fields keep what she typed

  Scenario: Centavos are kept exactly
    When Carmela saves monthly dues of 1850.50
    Then the field reads "1,850.50" after saving
    And entering 1850.555 shows "Use at most 2 decimal places"

  Scenario: A rate above the sanity cap is refused
    When Carmela enters 150000 and confirms the large change
    Then she sees "Monthly dues can't be more than ₱100,000.00. Check the amount."
    And the saved rate is unchanged

  Scenario: Uploading the real QR code
    Given no QR code has been uploaded yet
    When Carmela uploads the HOA's QR Ph image, types "REPLACE" and presses "Use this QR code"
    Then homeowners see it on Dues & Payments labelled "SCAN TO PAY"
    And under it "QR code updated Dec 2, 2026"
    And no "SAMPLE QR" label appears anywhere in the portal

  Scenario: Replacing the QR code alerts the other officers
    Given a QR code is already in use
    When Carmela uploads a new image, types "REPLACE" and confirms
    Then every other treasurer and every board member gets the notification "The payment QR code was replaced by Carmela Cruz on Dec 2, 2026. If you didn't expect this, contact the board."
    And Carmela gets the notification "You replaced the payment QR code on Dec 2, 2026. If this wasn't you, contact the board now."
    And the activity log records "Carmela Cruz (Treasurer) replaced the payment QR code"
    And the QR code, the log entry and the notifications are saved together, or none of them is
    And the previous image is kept, not deleted

  Scenario: No other officer has an account to alert
    Given Carmela is the only treasurer and no board member has an account
    When she uploads a new QR image
    Then the confirm dialog also says "No other officer will be alerted. Ask the board to set up accounts."
    And after she confirms, she still gets her own notification

  Scenario: Shows what the QR code says it pays to
    When Carmela uploads a QR code whose data carries a merchant name
    Then the preview shows "This QR code says it pays: {name read from the code}" next to the payee name she entered
    When she uploads a QR code with no merchant name in it
    Then she sees "We couldn't read a name from this code. Scan it with your own e-wallet app and check the name before saving."
    And she can still save it
    When she uploads an image with no QR code in it, or a damaged one
    Then she sees "We couldn't find a QR code in this image. Upload the QR image from your bank or e-wallet."
    And the current QR code is unchanged

  Scenario: A file that is too big or not an image
    When Carmela uploads a 9 MB file or a PDF
    Then she sees "Upload a PNG or JPG image under 2 MB."
    And the current QR code is unchanged

  Scenario: Before any QR code is set up
    Given no QR code has been uploaded
    When Juan Dela Cruz, a homeowner, opens Dues & Payments
    Then he sees "Online payment isn't set up yet. Pay at the admin office for now." in place of the QR
    And the payment form (REQ-010) is not shown

  Scenario: Two treasurers edit at once
    Given Carmela and a second treasurer both opened Settings
    And the second treasurer saved a change first
    When Carmela presses "Save settings"
    Then she sees "Someone else changed these settings since you opened them. Reload to see the latest, then make your change again."
    And her typing is kept on screen
    And nothing she typed is saved

  Scenario: Pressing Save twice saves once
    When Carmela presses "Save settings" twice quickly
    Then the change is saved and logged once
    And the button reads "Saving…" and is disabled until the save finishes

  Scenario: The admin office sees the settings read-only
    Given Paolo Aquino holds the admin office role
    When he opens Settings → Dues and payment
    Then he sees the values with "Only the treasurer can change dues and payment settings."
    And no field is editable
    And the settings functions refuse a change from his account
    And Storage refuses an upload to the QR image path from his account

  Scenario: A homeowner cannot change settings
    Given Maria Santos, a homeowner, is signed in
    Then Firestore refuses any write to the payment settings from her account
    And the settings functions refuse a change from her account
    And Storage refuses an upload to the QR image path

  Scenario: Every settings change is logged
    When Carmela changes the payee name from "Greenfield Homes HOA" to "Greenfield Homes HOA Inc."
    Then the activity log records "Carmela Cruz (Treasurer) changed the payee name" with the old and new value
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Monthly dues | `config/payment.monthlyDuesCentavos` (integer) | Integer centavos > 0 and ≤ ₱100,000.00 (server sanity cap); at most 2 decimals on screen | `saveDuesSettings` callable, treasurer only (`staff/{uid}`, L-004) | Billing run (REQ-008), Dues & Payments header |
| Payee name, account label, payment instructions | `config/payment.payeeName`, `accountLabel`, `instructions` | Payee name required, 1–80 characters; instructions up to 500; lengths capped before any pattern check | `saveDuesSettings` | Every signed-in person (Pay card) |
| QR image | Storage `config/payment-qr/{uploadId}`; current path in `config/payment.qrPath` and `qrUploadId` | PNG or JPEG, ≤ 2 MB. Storage rules: the treasurer may **create** only (no overwrite, no delete), with custom metadata `uploaderUid` equal to the caller; any signed-in user may read | Treasurer uploads; `replacePaymentQr` callable makes it current after checking the object exists, its type and size, and its `uploaderUid` | Every signed-in person |
| QR change details | `config/payment.qrUpdatedAt`, `qrUpdatedBy` | Server time | `replacePaymentQr` | Every signed-in person (date only, "QR code updated {date}"); staff |
| Payment cap | `config/payment.maxPaymentCentavos` | ₱100,000.00 (REQ-010 decision 5) | Developer script | REQ-010 |
| Concurrency check | `config/payment.updatedAt`; each callable takes `seenUpdatedAt` | Refused in the transaction if it changed since the screen loaded | The callables | — |
| Change records | `auditLog` (shared helper, REQ-006) | `settings.changed` with field, before and after; `settings.qrReplaced` | The callables, **in the same transaction as the change** | Treasurer, board, admin office |
| QR alert | `notifications` (REQ-011) | One per other treasurer and board member, plus one to the person who replaced it | `replacePaymentQr`, same transaction | Those people |
| Orphaned uploads | Storage `config/payment-qr/` | The daily job deletes uploads older than 7 days that aren't the current `qrPath` and aren't named in an audit entry. Previous images stay (decision 2) | Daily job | — |

**`config/payment` is its own document.** Every signed-in user reads it and **only functions write it**. `config/settings` keeps the cards the admin office edits (invitation expiry, booking pause), so an admin rule can never widen into dues. **Changed from SA-001 §3 and §4.2:** the settings are written by callables, not client writes, so the audit entry and alert are saved with the change; the QR image path gains an upload id (`config/payment-qr/{uploadId}` instead of one fixed `config/payment-qr.png`), so the previous image is kept and a cached old image is never shown under the new name (Sol Arch confirmed).

**Environments:** staging uses a sample QR marked "TEST, DO NOT PAY". Go-live checklist: the treasurer uploads the production QR in production only; it is never copied from staging. An owner alert fires on every `settings.qrReplaced`.

Invitation expiry settings (REQ-004) and the booking pause (story 34) live on other Settings cards and are not part of this REQ.

## UX/UI notes

- **Accessibility:** every field has a visible label and a hint; "Monthly dues" uses `inputmode="decimal"` with a "₱" prefix outside the field; errors sit under the field and are announced; the QR image has alt text "Payment QR code for {payee name}"; the typed-confirmation field is labelled "Type REPLACE to confirm".
- **Consistency:** "Monthly dues", "Payee name", "Save settings" as in the mock-up; "SCAN TO PAY" under the QR. The confirmation dialog is the app's one confirm dialog.
- **Mobile-first:** the card is a single column at 375 px. The treasurer will usually do this on a laptop, but a phone must work.
- **States:** loading (skeleton card); empty QR ("No QR code yet. Homeowners see 'Pay at the admin office' until you upload one."); error on save (field kept, "We couldn't save. Check your connection and try again."); success toast says what will happen ("Saved. The next billing run (December 2026) will bill ₱2,000.00 per household.").
- **Forms:** validate on blur; keep everything typed on any error; the QR dialog does **not** close on a backdrop click (it holds an upload).
- **Safe actions:** "Save settings" and "Use this QR code" are disabled while in flight, and the server refuses a stale save (`seenUpdatedAt`); the QR replacement needs typed confirmation; the old image is kept so a mistaken replacement can be put back by uploading it again. The person who replaced the QR is alerted too, so a stolen login can't swap it in silence.
- **QR read-back is advisory:** the name read from the code is what the code *says*, not who owns the account, and may be cut short. It never blocks a save; only "no QR found" or a damaged code does.
- **Homeowner reassurance:** "QR code updated {date}" under "SCAN TO PAY" lets someone who saved the old QR in their gallery notice the change.
- **Stable layout:** the large-change warning appears in a dialog, so the form doesn't jump.
- **Roles:** treasurer edits; admin office reads; board doesn't see the card (they get the QR alert instead); rules enforce all of it.

## Copy of record

| Where | Text |
|---|---|
| Card heading | Dues and payment |
| Fields | Monthly dues per household (₱) · Payee name shown to homeowners · Account label · Payment instructions |
| Dues hint | Applies to the next billing run. Bills already created keep their amount. |
| Button | Save settings (in flight: Saving…) |
| Saved toast | Saved. The next billing run ({period}) will bill {amount} per household. |
| Saved toast (non-rate change) | Saved. |
| Large change confirm | You're changing monthly dues from {old} to {new}. Is that right? · Yes, save {new} · Go back |
| Dues error | Enter the monthly dues in pesos, more than ₱0 |
| Decimals error | Use at most 2 decimal places |
| QR card heading | Payment QR code |
| QR button | Replace QR code (first time: Upload QR code) |
| QR dialog | Replace the payment QR code? Every homeowner will pay into the account in the new code. The other treasurers and the board will be told. · Type REPLACE to confirm · Use this QR code (in flight: Saving…) · Cancel |
| QR read-back (decision 3) | This QR code says it pays: {name} |
| QR read-back, no name | We couldn't read a name from this code. Scan it with your own e-wallet app and check the name before saving. |
| No other officer (in QR dialog) | No other officer will be alerted. Ask the board to set up accounts. |
| Self-alert notification | You replaced the payment QR code on {date}. If this wasn't you, contact the board now. |
| QR updated (homeowner) | QR code updated {date} |
| Dues above cap | Monthly dues can't be more than ₱100,000.00. Check the amount. |
| QR not found | We couldn't find a QR code in this image. Upload the QR image from your bank or e-wallet. |
| File error | Upload a PNG or JPG image under 2 MB. |
| QR label (homeowner) | SCAN TO PAY |
| No QR yet (homeowner) | Online payment isn't set up yet. Pay at the admin office for now. |
| No QR yet (treasurer) | No QR code yet. Homeowners see "Pay at the admin office" until you upload one. |
| QR alert notification | The payment QR code was replaced by {name} on {date}. If you didn't expect this, contact the board. |
| Stale edit | Someone else changed these settings since you opened them. Reload to see the latest, then make your change again. |
| Admin read-only note | Only the treasurer can change dues and payment settings. |
| Save error | We couldn't save. Check your connection and try again. |

## Out of scope

- Rates with a start month (Option B).
- Different rates by lot size or phase; special assessments (EPIC-002).
- Late penalty and interest settings (D2).
- Amenity prices (story 30) and the booking pause (story 34).
- Showing homeowners the history of QR changes.

## Open questions

| Question | Who decides |
|---|---|
| Do QR Ph person-to-person codes carry a merchant name (tag 59)? A 15-minute spike decoding the HOA's real QR, or GCash, Maya and bank samples, before build | Developer, with the treasurer's QR |
| Adopt staff two-step verification before the real QR is uploaded? (Sol Arch recommends it; SA-001 §8.4) | Owner |
| Is there more than one collection account (for example GCash and a bank)? The mock-up has one QR | Treasurer |
| Does a rate change need a board resolution reference recorded with it? | HOA board |
| Are there charges other than monthly dues (assessments, sticker fees)? (EPIC-002) | Treasurer |

## Sol Arch review

Questions for Sol Arch (from the BA, r1):

1. Reading a QR code from an uploaded image in the browser and showing its merchant or account name (decision 3). QR Ph is understood to follow the EMVCo merchant-presented format, which carries a merchant name field; **unverified by the BA**. Is it cheap and reliable, and does it work for both person-to-merchant and person-to-person QR Ph codes?
2. Settings as a client write checked by rules, with the audit entry and the QR alert from a trigger, or a small `saveSettings` callable? The 25% check and typed confirmation are screen-only either way.
3. The QR path with an upload id (see Data changes), and Storage rules restricting writes to the treasurer.

**BA size estimate (Sol Arch to confirm):** S, about 1.5–2 person-days with Claude Code; +0.5 day for the QR read-back if decision 3 is yes.

### Sol Arch findings (2026-11-28, draft)

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 §3 (settings as an admin-only client write), §4.2 (`config/settings`, Storage `config/payment-qr.png`) and §8.3. Baselines: `docs/sa-001-architecture` at `e28d9bc`, `docs/req-005-045` (uncommitted).

**Verdict: Supports Option A, with changes.** It departs from SA-001 §3: dues and the QR code become **callables, not client writes**. A replaced QR code is the highest-impact single action in R1, because it redirects every household's money. Its audit entry and its alert must therefore be saved in the same transaction as the change, not by a trigger afterwards (see REQ-006 question 2). Two more changes: dues and payment settings move to their own document, and the decision 3 read-back is cheap but only advisory.

#### Options

| Option | Feasible? | Cost (BA) | Sol Arch |
|---|---|---|---|
| A: one card; the new rate applies from the next run | Yes | Cheap | **Agree**, with callables (about +0.5 day) |
| B: rates with a start month | Yes | Moderate | Agree. It can be added later, because each bill stores its own amount |
| C: developer changes settings | Yes | Cheapest | Agree with the downside. A changed account would be stuck until the developer is free |

#### Answers to the BA's questions

1. **QR read-back (decision 3): cheap (+0.5 day), but advisory only.** The mock-up already bundles a decoder (jsQR 1.4.0; the browser's `BarcodeDetector` where it is available). The payload of an EMVCo merchant-presented QR is a tag-length-value string. Tag `59` is the merchant name and tag `63` is a CRC (cyclic redundancy check) over the payload ([EMVCo MPM specification v1.1](https://mvallim.github.io/emv-qrcode/docs/EMVCo-Merchant-Presented-QR-Specification-v1-1.pdf)). A 40-line parser can verify the CRC and read tag 59. **Limits:**
   - Tag 59 is what the *code says*, not who owns the account. A fraudster's QR can say "Greenfield Homes HOA".
   - National profiles cap it short. Malaysia's DuitNow, for example, allows up to 25 characters ([DuitNow QR data object](https://docs.developer.paynet.my/docs/duitNow-QR/integration/QR-generation-specification/merchant-presented-mode/qr-data-object)), so names may be cut off.
   - **Whether QR Ph person-to-person codes carry tag 59 is Uncertain.** I could not find the BSP's QR Ph technical specification. Resolve it by decoding the HOA's real QR, or one from GCash, Maya and a bank, in a 15-minute spike before build.

   So: show "This QR code says it pays: {name}" when tag 59 is present. When it is absent, show "We couldn't read a name from this code. Scan it with your own e-wallet app and check the name before saving." **Never block on it.** Refuse only when no QR code is found, or when the CRC fails (a damaged image).
2. **Callables `saveDuesSettings({changes, seenUpdatedAt})` and `replacePaymentQr({uploadId, seenUpdatedAt})`**, treasurer only (`staff/{uid}`, L-004). Each runs one transaction:
   - refuse if `updatedAt` changed (the stale-edit scenario);
   - validate (dues an integer number of centavos > 0; payee name 1–80 characters; instructions ≤ 500; lengths capped before any regex, S8786);
   - write the settings, the `auditLog` entry and the alert notifications together.

   `replacePaymentQr` also checks that the Storage object exists at `config/payment-qr/{uploadId}`, is `image/png` or `image/jpeg`, is ≤ 2 MB, and was uploaded by the caller (custom metadata `uploaderUid`, enforced on create by Storage rules). The 25% check and the typed REPLACE stay screen-only, as the BA says. The server also refuses dues above a sanity cap (₱100,000.00, the same limit as payments) to catch a pasted number.
3. **Path with an upload id: confirmed.** Storage rules: the treasurer may **create** `config/payment-qr/{uploadId}` (no overwrite, no delete), and any signed-in user may read it. Storage rules check `staff/{uid}` through `firestore.get()` (a cross-service read; it costs one Firestore read per upload). Images from dialogs that were cancelled stay orphaned. They are tiny, and the daily job deletes any upload older than 7 days that isn't the current `qrPath` and isn't named in an audit entry. Previous images are kept, as decision 2 requires.

#### Required changes (for the BA to apply)

> **BA note (r3):** all six are applied above: 1 and 2 in Data changes (and the role scenarios now name the functions, not Firestore rules); 3 as the self-alert line and the "No other officer" scenario; 4 as "QR code updated {date}" in the upload scenario, UX notes and copy (REQ-010 records `qrUploadId`); 5 in the read-back scenario and copy; 6 in the first scenario. The ₱100,000.00 dues cap from answer 2 is added as a scenario. None conflicts with an approved decision.

1. **Move these fields to their own document, `config/payment`** (dues, payee, account label, instructions, `qrPath`, `qrUploadId`, `qrUpdatedAt`, `qrUpdatedBy`, `updatedAt`, `maxPaymentCentavos`). Every signed-in user reads it, and **only functions write it**. `config/settings` holds other cards that the admin office edits (invite expiry, booking pause) and that homeowners must not need to read. Keeping them apart keeps the rules simple and stops an admin rule widening into dues.
2. **Data changes:** "Written by" becomes `saveDuesSettings` / `replacePaymentQr`, not a client write. Delete "Trigger on `config/settings`". The concurrency check is in the transaction, not in rules. Delete "rules check `request.time`".
3. **Scenario "Replacing the QR code alerts the other officers": add the case where there are no other officers.** In R1 there may be one treasurer and no board accounts (S3 is already blocked on "second treasurer cover"). Then the alert reaches nobody, and a stolen treasurer login could swap the QR in silence. Add: "And Carmela gets a notification too: 'You replaced the payment QR code on {date}. If this wasn't you, contact the board now.'" Also add: "And if no other treasurer or board member has an account, the confirm dialog says: 'No other officer will be alerted. Ask the board to set up accounts.'" Once email exists (R2, story 19), the alert also goes to the HOA's official contact email.
4. **Homeowner side: show when the QR last changed.** Under "SCAN TO PAY", add "QR code updated {date}". A homeowner who saved the old QR in their gallery can then notice. REQ-010 should record which QR the payer saw (see the REQ-010 review).
5. **Decision 3 copy:** replace "This QR code pays: {name}" with "This QR code says it pays: {name}", and add the "couldn't read a name" text above.
6. **Scenario "A new rate applies from the next billing run only":** add "And if a billing preview was already open at the old rate, generating it is refused" (REQ-008 review, stale rate).

#### Risks not covered

- **Account takeover → QR swap (fraud, high impact).** The mitigations are the alerts (change 3), the activity log, and staff two-step verification (SA-001 §8.4, an owner decision still open). **I recommend the owner adopts staff 2-step before the real QR is uploaded.** Otherwise one phished password redirects the HOA's income.
- **Stale QR in homeowners' galleries:** change 4, plus REQ-010 recording `qrUploadId`.
- **Repeat-trigger safety:** in-flight flag plus `seenUpdatedAt` in the transaction (CS-5). Covered.
- **Existing data:** none. Before the first save, the card shows its "no rate" and "no QR" states (REQ-008 relies on "Set the monthly dues").
- **Multiple environments:** staging must use a sample QR marked "TEST, DO NOT PAY". Add a go-live checklist item: the production QR is uploaded by the treasurer in production only, never copied from staging.
- **Secrets and PII:** the payee name is HOA data, so it is fine in the log. The QR image may show an account number. That is by design, because every homeowner needs it.
- **Observability:** an alert to the owner on every `settings.qrReplaced`, as with `setRole` (rare, so each one is worth seeing).

#### Size

**2–2.5 person-days with Claude Code, plus 0.5 for the QR read-back (BA: 1.5–2 + 0.5).** The extra covers the two callables, Storage rules with the cross-service check, and the officer alerts with the no-officer case.

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**2.25–2.75 person-days with Claude Code** (was 2.5–3). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0.25 · 0.25 · 0 · 1.25–1.5 · 0.5–0.75
- **Reuses:** Port: `aSet()` 865, "Dues & billing" form 869–875, "Payment QR code" card 876–877, `qrBlock()` 605. Extend: confirm a large change, replace the QR, read-only for the admin office, stale edit (drawn 595–599)
