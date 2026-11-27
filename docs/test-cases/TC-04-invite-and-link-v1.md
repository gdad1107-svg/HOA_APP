# TC-04: Invite a homeowner and link them to a lot (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature (invite codes, code entry and confirm, redeem, printed slips, emailed invitations, bulk invite, remove after a sale) |
| Source | [REQ-004 Invite a homeowner and link them to a lot](../requirements/REQ-004-invite-and-link.md), **Approved** 2026-11-28 (r3), Option A in two steps |
| Depends on / precedent | [REQ-001 Sign in](../requirements/REQ-001-sign-in.md) (not-linked screen, Google popup, sign-out), [REQ-002 Roles](../requirements/REQ-002-roles-and-permissions.md) (who may invite and remove, "at once" removal, no-access page), [REQ-003 Household directory](../requirements/REQ-003-household-directory.md) (link-status pills, deactivate cancels the unused invitation, owner name and contact email) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open: no viewport meta, so the phone layout never applies; the join screens must work at 375 px, see TC-04-Q6). No defect is open in the invite area (it has no code yet) |
| App version | **Anticipated.** No application code exists; `main` holds the single-file mock-up only (`index.html`, `gentri-heights/index.html`). The approved UX is screens 4A–4G of [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html) (4H is Option C, not approved, not planned) |
| Source files / functions touched (anticipated) | Callable functions `createInvites`, `checkInvite`, `redeemInvite`, `removeMember`, `cancelInvite`; REQ-003's `setHouseholdActive` (deactivation cancels invites); the mail function (ADR-002); Firestore rules for `invites`, `inviteAttempts`, `mail`, `members`, `households`, `householdContacts`, `auditLog`; `config/settings.inviteExpiryDays.email` / `.print`; the `/join` route and code entry, confirm screen, Homeowners directory and household detail (4E), bulk invite (4F), slip PDF (4G) |
| Architecture | SA-001 §8.1, §4.2, §10; ADR-002 (r3), ADR-004 (r3), ADR-005; LEARNINGS L-004, L-005. **All Draft** on branch `docs/sa-001-architecture`. Every case that depends on a design detail found only there (function names, field names, the keyed hash, the attempt window shape, audit action codes, the staging mail allow-list, bounce events) is tagged **Provisional — SA-001 Draft** and must be re-checked when SA-001 is approved |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions) or `hoa-portal-staging` only. Never production.** Emulator runs use a test HMAC key, never the production Secret Manager key. Email is never delivered: the provider is a stub in the emulator, and staging mail goes only to the allow-list (ADR-005, SA-001 §10). Both brands (Greenfield Homes HOA, Gentri Heights HOA) |
| Author / date | QA, 2026-11-28 |
| Status | Draft for owner approval. Not ready for QE until approved |

**Tags used on cases**

- **Step 1**: ships with printed slips, no email provider needed. **Step 2**: needs the email provider (SA-001 Q7); run only once step 2 ships.
- **Provisional — SA-001 Draft**: asserts a design detail from the Draft architecture.
- **Blocked — decision N** / **Blocked — board** / **Gap G-n**: expected result depends on an open decision or a requirement gap (listed at the end). The case stays in the plan; QE must not automate an expected result marked as a gap until the BA answers.
- **Staging note**: the scenario needs special set-up (controllable server clock, two devices or sessions at once, data in an old shape, admin SDK / console access to read function-only collections).

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Admin office staff** (`admin`) | Invites (one, many, another person), resends, prints slips, removes people. Reads the directory and household detail |
| **Treasurer** (`treasurer`) | Everything the admin office does here, plus the invitation-expiry settings (REQ-004 Data changes). Reads the activity log (backlog story 06) |
| **Board** (`board`) | No access to the Homeowners page (REQ-003). Reads the activity log (story 06). Cannot invite or remove |
| **Guard** (`guard`) | No access to any of this. Must not see households, invitations or members |
| **Homeowner / invitee** (signed-in account) | Enters a code (or follows the email link), confirms the lot, redeems for themselves only. Once linked, a household member |
| **No-role, no-household account** | Sees only the not-linked screen and code entry (REQ-001) |

### Test fixtures (invented; QE maps them to `.env`)

| Fixture | Lot | Owner on file | Contact email (staff-only) | Starting state |
|---|---|---|---|---|
| **HH-A** "ZZ Test Household A" | Blk 2 Lot 7 | ZZ Ana Reyes | zz.owner.a@example.test | Not invited |
| **HH-B** "ZZ Test Household B" | Blk 4 Lot 12 | ZZ Juan Dela Cruz | zz.owner.b@example.test | Linked · 1 person (U-JUAN) |
| **HH-C** "ZZ Test Household C" | Blk 4 Lot 5 | ZZ Miguel Ramos | *(none)* | Not invited, no email |
| **HH-D** "ZZ Test Household D" | Blk 7 Lot 1 | ZZ Dora Deactivated | zz.owner.d@example.test | Active; deactivated during the case |
| **HH-E** "ZZ Test Household E" | Blk 4 Lot 15 | ZZ Dennis Bounce | zz.owner.e@exmaple.test (typo domain) | Not invited |
| **HH-F** "ZZ Test Household F" | Blk 2 Lot 10 | ZZ Carmela Cruz | zz.treasurer.ho@example.test | Linked · 1 person (S-TREAS-HO) |
| **HH-LEGACY** "ZZ Legacy Household" | Blk 9 Lot 1 | ZZ Legacy Owner | zz.legacy@example.test | Created before the invite functions existed: no `linkStatus`, no `memberCount` |
| **HH-BULK-001 … 400** "ZZ Bulk Household nnn" | Blk 90–99 | ZZ Bulk Owner nnn | zz.bulk.nnn@example.test for 380; none for 20 | Not invited |

| Account | Who | Notes |
|---|---|---|
| U-ANA | ZZ Ana Reyes, email+password, zz.owner.a@example.test | No household at start |
| U-ANA-G | Google emulator account zz.google.a@example.test | For the Google popup path |
| U-CARLO | zz.family.a2@example.test | Second person for HH-A |
| U-JUAN | zz.owner.b@example.test | Member of HH-B only |
| U-NEW | zz.newowner.a@example.test | New owner of HH-A after the sale |
| U-STRANGER, U-STRANGER-2 | zz.stranger1@ / zz.stranger2@example.test | No household, no role |
| U-RACE-01 … 10 | zz.race.nn@example.test | Parallel redeem |
| S-ADMIN, S-ADMIN-2 | zz.admin1@ / zz.admin2@example.test | Role `admin` (two, for concurrency) |
| S-TREAS | zz.treasurer@example.test | Role `treasurer`, no household |
| S-TREAS-HO | zz.treasurer.ho@example.test | Treasurer and member of HH-F (REQ-002 switch) |
| S-BOARD | zz.board@example.test | Role `board` |
| S-GUARD | zz.guard@example.test | Role `guard` |

`.test` is a reserved top-level domain, so no fixture address can reach a real mailbox even if the allow-list failed. "Today" in every case is built from **local Manila today** in the test, not from a hard-coded date; the dates below (Nov 28, 2026 and so on) show the arithmetic and are reproduced with a controllable server clock (Staging note).

### Round-trip register

Staff invite → homeowner accepts → staff sees "Linked · n people". One row per field or status value.

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | Invitation `status = active` | `createInvites`, from Invite / Resend invitation / Invite selected / Print invite slips / Print slip / Invite another person, by admin or treasurer | Staff: directory pill "Invited · expires {date}" (3A, 3B) and the Invitations list on household detail (4E). Homeowner: the confirm screen "You're joining {lot} ({owner name})" (4C) | E1, E2, C1, H4 |
| 2 | `status = used`, `usedBy`, `usedAt` | `redeemInvite`, by the homeowner pressing "Yes, link my account" | Staff: 4E Invitations "Used {date}" and People with portal access "{name} · linked {date}" (who linked). Another homeowner: "This invitation was already used…". The same homeowner: lands on the dashboard | C6, F1, F3, K12 |
| 3 | `status = replaced`, `replacedBy` | `createInvites` on Resend or Print, by staff | Homeowner holding the old code: "This invitation was replaced by a newer one…". Staff: **not shown** in the 4E mock-up (Gap G-18 asks whether replaced rows are listed); audit `invite.replaced` (row 15) | G6, I7 |
| 4 | `status = cancelled` | `cancelInvite`, `removeMember`, `setHouseholdActive` (deactivate), by staff | Homeowner holding the code: "This invitation is no longer valid. Ask the admin office." (assumed for every cancel cause, Gap G-5). Staff: deliberately no pill; audit `invite.cancelled` | J13, K4, A5 |
| 5 | Expired (derived from `expiresAt`, never stored) | Nobody writes it; `createInvites` writes `expiresAt` from settings | Staff: directory pill "Invite expired" (Gap G-3: how it appears with nothing written). Homeowner: "This invitation has expired…" | E4, E6 |
| 6 | `expiresAt` (end of the date shown, Asia/Manila) | `createInvites`, from `config/settings.inviteExpiryDays` (treasurer) | Staff: pill "Invited · expires {date}", 4F "Expire on {date}". Homeowner: email body "expires on {date}", slip "Expires {date}" | E1, E2, E10 |
| 7 | `channel`, `sentTo` | `createInvites`, by staff | Staff: 4E Invitations "Sent to" column (address or "Printed slip"). Homeowner: deliberately not shown | G1, I2 |
| 8 | `relation` (Owner / Family / …) chosen by the admin | `createInvites` (Invite another person picker; first invite default, Gap G-17), copied to `members.relation` by `redeemInvite` | Staff: 4E People "Owner · linked …", "Family · linked …". Homeowner: deliberately not shown on any 4A–4G screen | J3 |
| 9 | Membership `members/{householdId}_{uid}`: `linkedAt`, `inviteId`, `invitedBy` | `redeemInvite` (only writer) | `linkedAt`: staff, 4E "linked {date}". Rules (`isMember`): the homeowner's household screens. `invitedBy`, `inviteId`: deliberately not shown on a screen; read by audit/data checks only | C6, S7 |
| 10 | `households.memberCount` | `redeemInvite`, `removeMember` | Staff: pill "Linked · 1 person" / "Linked · 2 people" in the directory and the 4E header | C7, J2, K7 |
| 11 | `households.linkStatus` | Invite functions, mail function (failed), `removeMember` | Staff: directory pills, phone cards (3B), filter chips "Not invited (n)" etc., page header counts (3A) | S5, S10 |
| 12 | Mail document `status`: queued → sent / failed | `createInvites` writes queued; the mail function writes sent / failed | Staff: "Email failed" pill with Resend and Print slip; queued and sent shown as "each household shows its email status" (exact words undefined, Gap G-14). Never "delivered" | G1, G8, G9 |
| 13 | Mail document code and body cleared | Mail function, after sent or failed | Deliberately not shown anywhere; proven by a data check | B5, B6 |
| 14 | Bounce (step 2, decision 3) | Mail function from the provider's bounce event | Staff: "Email failed" with Resend and Print slip | G12 |
| 15 | `auditLog` `invite.created` / `replaced` / `cancelled` / `redeemed`, `member.removed` (ids only) | The functions | Board, treasurer: activity log screen, **backlog story 06 (R1, not yet a REQ)**. In TC-04 proven at data level only (Gap G-6) | K6, S8 |
| 16 | `inviteAttempts/{uid}` (failures, window start) | `checkInvite`, `redeemInvite` | Homeowner: "Too many wrong codes. Try again in 15 minutes." Staff: deliberately not shown (project alert only) | D2, D16 |
| 17 | Household owner name (`displayName`, REQ-003) | Household functions, by staff | Homeowner: confirm screen "({owner name})", email "Hi {owner name}" | C15, K14 |
| 18 | Contact email (`householdContacts`, REQ-003) | Household functions, by staff | `createInvites` as the recipient; staff: 4E "Sent to". Homeowner: deliberately never (staff-only, privacy after sale) | G1, K13 |
| 19 | Pending code in `sessionStorage` | The app, from the `/join#CODE` fragment | The app after sign-in (confirm screen without typing). Cleared after redeem | P2, P7 |

No read-back cell is empty.

### Invite lifecycle: status enumeration

Rule under test: `redeemInvite` "refuses a used, replaced, cancelled or expired code"; one active invitation per household and recipient; "expired" is derived. One row per prior state; one column per transition. **Refused** cells are cases too.

**Table 1: invitation document**

| Prior state ↓ / transition → | Invite (same slot, not a resend) | Resend invitation | Print slip(s) | Redeem by a new person | Redeem by the person who used it | Expiry time passes | Cancel (`cancelInvite`) | Remove a member of the household | Deactivate household | Bounce event |
|---|---|---|---|---|---|---|---|---|---|---|
| **active, unexpired** | Skipped: no new code, no mail (A1, H5) | Old → replaced, new active, new mail queued, one transaction (G5, G6, N1) | Old → replaced per print copy (I7; email slot Gap G-4, I8) | → used, member created, Linked (C5–C7) | n/a (not used yet) | Becomes expired, nothing written (E4, E6) | → cancelled, code "no longer valid" (A5) | → cancelled, "no longer valid" (K4) | → cancelled, "no longer valid" (J13, J14) | Mail → failed, pill Email failed (G12) |
| **active, expired (derived)** | **Gap G-1**: expected new active invite (A3) | New active; old code still refused (G7) | New print code; old refused (I7 variant, A3) | **Refused** "expired", no member, not counted (E4, D7) | n/a | No change | No visible change; code still refused (A7) | No change; code refused (K4) | Code refused (message precedence Gap G-24) (J13) | n/a |
| **used** | **Gap G-12**: Linked household re-invited? (H7) | **Refused** / not offered; stays used, member kept (A4) | New print code allowed; used stays used, member kept (I10) | **Refused** "already used", no member (F1, F2) | Lands on dashboard, no second member (F3, F4); after removal **refused** (K11) | No change; member kept (A8); re-entry Gap G-31 (F11) | **Refused**; stays used (A6) | Stays used; the removed person cannot re-link (K11) | Stays used; members' access Gap G-27 | Late bounce must not unlink (G14) |
| **replaced** | n/a (new active exists) | Applies to the newest only (N1) | Applies to the newest only | **Refused** "replaced", not counted (G6, D9) | n/a | No change | No change (A7) | No change | No change | Must not flip a healthy newer invite (G13) |
| **cancelled** | New invite allowed (K12) | n/a | New print code allowed | **Refused** "no longer valid" (K4, J13), not counted (D9) | n/a | No change | No change, no second audit entry (A7) | No change | No change; reactivation does not revive it (J16) | n/a |
| **household deactivated** (any invite) | **Refused** / not offered (J17) | **Refused** / not offered (J17) | **Refused** / not offered (J17) | **Refused** "no longer valid" (J13, J15) | Gap G-27 | No change | n/a | Allowed from the Inactive list (K-block, Gap G-27) | n/a | n/a |

**Table 2: invitation email (`mail` document), Step 2**

| Prior mail state ↓ / event → | Provider accepts hand-off | Provider refuses hand-off | Bounce event later (decision 3) | Resend invitation | Print slip | Redeem |
|---|---|---|---|---|---|---|
| **queued** | → sent; code and body cleared (B5) | → failed; code cleared; pill "Email failed" with Resend, Print slip (B6, G9) | n/a | New mail queued; the old queued mail with a now-dead code: Gap G-15 (G17) | New print code; email code stops working (G11) | Possible if the code is known; household Linked |
| **sent** | n/a | n/a | → failed; pill "Email failed" (G12) | New mail queued; old code "replaced" (G5, G6) | Email code stops working (G11) | → Linked |
| **failed** (hand-off) | n/a | n/a | Duplicate signal ignored (G14) | New mail queued; pill Invited (G10) | New print code; pill Invited (G11) | n/a in practice |
| **failed** (bounced) | n/a | n/a | Repeat event ignored, one state (G14) | As above (G10) | As above (G11) | If the person redeemed before the bounce arrived: member kept, pill stays Linked (G14) |

**Table 3: household link-status pill**

| From ↓ | Event | To | Case |
|---|---|---|---|
| Not invited (or field missing) | Invite / Print slip | Invited · expires {date} | E1, E2, S1 |
| Invited | Redeem | Linked · 1 person | C7 |
| Invited | Expiry passes | Invite expired | E6 |
| Invited (email) | Refused at hand-off / bounced | Email failed | G9, G12 |
| Invite expired | Resend / Print slip | Invited · expires {new date} | G7 |
| Email failed | Resend / Print slip | Invited · expires {new date} | G10, G11 |
| Linked · 1 person | Invite another person (pending, failed or expired) | Stays "Linked · 1 person" (precedence Gap G-2) | J1 |
| Linked · 1 person | Second redeem | Linked · 2 people | J2 |
| Linked · 2 people | Remove one | Linked · 1 person | K7 |
| Linked · 1 person | Remove the last | **Gap G-9**; never "Linked · 0 people" | K7, S9 |
| Any | Deactivate | Shown under "Inactive" (REQ-003) | J14 |

---

## Test plan

### 1. Smoke

The standing smoke pass (`smoke.spec.js`) covers the mock-up's role menus only. This change adds role-visible areas it doesn't cover. **Smoke additions for QE:**

1. A signed-in account with no household and no role lands on the not-linked screen and can open **"Enter your invite code"** (heading, hint, field; no page error).
2. **`/join#{code}`** with a fixture code opens the **confirm screen** "You're joining … Is this your lot?" for a signed-in account with no household.
3. **Household detail (4E)** opens for admin office staff and for the treasurer, showing "People with portal access" and "Invitations".
4. The Homeowners directory shows a **Portal** (link-status) column with a pill on every row, and the "Invite selected" and "Print invite slips" actions. If TC-03 already adds the directory to smoke, add only the pill and the two actions.

### 2. Acceptance

Every Gherkin scenario in REQ-004 maps to at least one case:

| REQ-004 scenario | Cases |
|---|---|
| Send an invitation | G1, E1, G8 |
| Accept an emailed invitation (incl. Google) | P2, P3, P4, C5, C7 |
| Enter a printed code | C1, C2, C3 |
| A wrong code | C12 |
| Guessing codes is stopped | D1–D6, D11 |
| An expired code | E3, E4, E6 |
| A code can be used only once | F1, F2 |
| The person who used a code enters it again | F3, F4 |
| Two people redeem the same code at the same moment | F8, F9 |
| Resending replaces the old invitation | G5, G6, N1 |
| A second person in the same household | J1, J2, J3 |
| A person already linked to another lot | J7, J8 |
| A code for a deactivated household | J13, J14 |
| Invite many households at once | H1–H5 |
| Print code slips | I1–I6 |
| Removing a person after a sale | K1–K8 |
| An email the provider refuses is shown, not hidden | G9 |
| An email that bounces later is shown (decision 3) | G12 |

### 3. Regression

What else could break, and why:

- **Household access is now decided by `members` documents** (ADR-004). Every homeowner read in the app depends on `isMember`. A redeem or remove bug either leaks one family's finances to another (SA-001 R-6) or locks a family out. Re-run TC-02's rules matrix (every collection × every role) after the `members` rules land, and the cross-household read refusals.
- **Directory (REQ-003 / TC-03)**: link-status pills, filter chips, header counts, phone cards (3B), deactivate ("its unused invitation stops working"), edit owner name and contact email. REQ-004 functions are the only writers of `linkStatus` and `memberCount`.
- **Sign-in (REQ-001 / TC-01)**: not-linked screen, Google popup, sign-out on a shared phone and the back-forward cache. The join flow carries a code across sign-in, so these paths now hold state.
- **Roles (REQ-002 / TC-02)**: no-access page for homeowners and board on Homeowners; treasurer-who-is-also-a-homeowner switch (S-TREAS-HO); a removed staff role with a stale token must not invite or remove.
- **Shared code style and normalisation**: invite codes must look like guest-pass codes (`.code`, `XXXX-XXXX`, same alphabet, mock-up `token()` / `fmtCode` / `lookupPass` lines 1093–1142). If Dev shares a code-input or normaliser component, re-run the guest pass display and the guard's manual pass-code entry.
- **Mail queue (ADR-002)** is shared with every later email feature (statements, demand letters). Status words and code clearing must not regress there.
- **Open defect DEF-001** (no viewport meta): the join screens are phone-first; NAV-07/NAV-08 and TC-04-Q6 must pass on the `mobile` project.

**Existing specs and screens QE should re-run:** `tests/specs/ui/smoke.spec.js` (SMK-admin-nav, SMK-admin-homeowners, SMK-owner-*), `tests/specs/ui/navigation.spec.js` NAV-03 (one `aria-current`), NAV-05 (important announcement pop-up), NAV-06 (Escape closes a modal), NAV-07 / NAV-08 (375 px, DEF-001), `tests/specs/ui/vehicle-registration.spec.js` VEH-J1 (homeowner data scoped to the household); TC-01, TC-02 and TC-03 once written; guest pass and guard Scan Pass screens.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "invitations queued", "will stop working", "She will no longer see this lot", "Each household shows its email status", "Delete this file after printing" | G8, H3, H4, H10, I7, I11, K2 |
| A value written for one role, never shown back | Yes: relation, who linked, linkedAt, audit, email status | Register rows 2, 8, 9, 12, 15; J3, K6 |
| Status-gated rule checked for one transition only | Yes: redeem, resend, cancel, remove | Status enumeration, A-block |
| Same concept, different word on another screen | Yes: "Resend" vs "Resend invitation", "Sent" vs "queued", pill words | R2, R3, G8 |
| Dates computed in UTC where the user means local | Yes: expiry end of day Manila, creation after Manila midnight | E3, E4, E5, E7 |
| A derived figure doesn't refresh after a related write | Yes: linkStatus, memberCount, header counts, 4E | C7, K7, N8, S4, S5, S10 |
| Zero and "not set" look the same | Yes: memberCount 0 vs missing; expiry setting missing | S1, S9, E13 |
| A write silently refused by security rules | Yes: every refused role and client write | M-block (explicit refusal asserted) |
| Double-tap / two devices create duplicates | Yes: Yes-link, Invite, Resend, Print, Invite selected, Remove | F5, F6, F7, H2, I12, K8, K9, N1, N2 |
| Stale reference | Yes: confirm screen open while code replaced, expired, deactivated; stale 4E | E16, J15, N6, N8 |
| Backdrop click loses work or leaves stale state | Yes: Invite another person modal, Remove and print confirms | J5, K10, I11 |
| A modal appearing mid-flow blocks the next action | Yes: announcement pop-up after redeem | P16 |
| Assumed SDK/network behaviour baked into a case | Yes: offline redeem, sessionStorage across Google popup, provider events | P4, H11, G12 (assumptions marked) |
| Data leaking across households or roles | Yes, the core risk | C8, K11, K14, M-block, L-block |

### Scenario list by mandatory type

- **Negative**: wrong, malformed, expired, used, replaced, cancelled, deactivated and already-linked codes; locked account; refused roles; refused direct writes; Resend on used; cancel on used; double remove. C12–C14, D2, D3, E4, F1, G6, J7, J13, K8, K11, A4, A6, M-block.
- **Boundary**: the 5th vs 6th wrong code; 14:59 vs 15:00 after the first refusal; 23:59:59 vs 00:00:00 Manila; created after Manila midnight; year end; leap day; 7 vs 30 days; settings 0 / 1 / max; bulk m = 0 and n = 1; 1 person vs 2 people; last member removed. D1, D2, D4, D5, D14, E3–E8, E14, H8, R4, K7.
- **Usability**: labelled monospaced code field, paste, errors announced, Checking… state, 375 px single cards, tap targets, focus, pills with text, printed slip legibility, error messages say what to do. Q-block, I13, R1.
- **Navigation**: not-linked landing, `/join#CODE` through each sign-in method, refresh mid-flow, code cleared, wrong-lot exit, after-save landing, Back, staff detail and back, homeowner blocked from Homeowners by URL. P-block.

---

## A. Lifecycle transitions not covered elsewhere

#### TC-04-A1: A second Invite for a household and recipient with an active invitation makes no new code
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff (S-ADMIN). **Tags:** Step 2 · Provisional — SA-001 Draft
- **Setup:** HH-A has one active, unexpired email invitation to zz.owner.a@example.test.
- **Action:** Call `createInvites` for HH-A, not as a resend (as "Invite" would).
- **Expected:** The household is reported as skipped; HH-A still has exactly one active invitation, the original one; no new `mail` document; the original code still opens the confirm screen.
- **Don't assert:** the exact wording of the skip reason in the function response.

#### TC-04-A2: A household with an active invitation offers "Resend invitation", not "Invite"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2
- **Setup:** HH-A invited by email (active).
- **Action:** Open the directory row and household detail for HH-A.
- **Expected:** "Resend invitation" is offered; "Invite" is not.
- **Don't assert:** button position or colour.

#### TC-04-A3: A household whose only invitation expired can be invited again
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2 · Gap G-1
- **Setup:** HH-A's only invitation is active but past its expiry (pill "Invite expired").
- **Action:** Include HH-A in "Invite selected" (Step 2) or "Print invite slips" (Step 1).
- **Expected (pending G-1):** HH-A gets a new active invitation and its pill becomes "Invited · expires {new date}"; it is not skipped as "already has an unused invitation". The old code is still refused.
- **Don't assert:** which refusal message the old code gives (expired or replaced) until G-24 is answered.

#### TC-04-A4: Resend is refused for a used invitation, and the member stays linked
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Setup:** U-ANA linked to HH-A with her email invitation (status used).
- **Action:** Check that 4E shows no Resend on the used row; then call `createInvites` as a resend for that used invitation's slot.
- **Expected:** No Resend control on the used row. The call does not change the used invitation (still `used`, same `usedBy`); U-ANA's membership still exists; `memberCount` unchanged.
- **Don't assert:** whether the call errors or returns "skipped".

#### TC-04-A5: Cancelling an active invitation makes its code invalid
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · Provisional — SA-001 Draft · Gap G-5
- **Setup:** HH-A has an active printed invitation.
- **Action:** Call `cancelInvite` for it (no UI defined, G-5); then U-STRANGER enters the code.
- **Expected:** The invitation is `cancelled`; U-STRANGER sees "This invitation is no longer valid. Ask the admin office." (assumed message, G-5); no member is created; one `invite.cancelled` audit entry.
- **Don't assert:** any UI for cancelling.

#### TC-04-A6: Cancelling a used invitation is refused and the member stays linked
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · Provisional — SA-001 Draft
- **Setup:** U-ANA linked to HH-A.
- **Action:** Call `cancelInvite` on her used invitation.
- **Expected:** Refused; invitation stays `used`; U-ANA can still read HH-A.
- **Don't assert:** error code text.

#### TC-04-A7: Cancelling an already replaced, cancelled or expired invitation changes nothing
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Provisional — SA-001 Draft
- **Setup:** Three HH-A invitations: one replaced, one cancelled, one active-but-expired.
- **Action:** Call `cancelInvite` on each.
- **Expected:** Replaced stays `replaced`, cancelled stays `cancelled`, no second `invite.cancelled` audit entry for the already-cancelled one; every code is still refused.
- **Don't assert:** whether the expired one becomes `cancelled` (either is acceptable).

#### TC-04-A8: When a used invitation's expiry date passes, the member stays linked
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA). **Tags:** Step 1 · Staging note: controllable server clock
- **Setup:** U-ANA linked to HH-A with an invitation expiring Dec 5, 2026.
- **Action:** Move server time to Dec 6, 2026 00:00:01 Manila; U-ANA opens her dashboard.
- **Expected:** U-ANA sees HH-A's dashboard; her membership is unchanged; HH-A's pill is still "Linked · 1 person", not "Invite expired".
- **Don't assert:** dashboard content beyond the lot.

#### TC-04-A9: Stored invitation status only ever holds active, used, replaced or cancelled
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** none (data check after the A–K blocks). **Tags:** Provisional — SA-001 Draft
- **Setup:** Run after the other blocks on the emulator.
- **Action:** Read every `invites` document created by this run.
- **Expected:** Every `status` is one of `active`, `used`, `replaced`, `cancelled`; none is `expired`; every one has `expiresAt`.
- **Don't assert:** counts of each status.

## B. Code generation, storage and secrecy

#### TC-04-B1: Generated codes are 8 characters from the 32-character alphabet, shown as XXXX-XXXX
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** 1,000 fixture households (or repeated print runs).
- **Action:** Print slips (or create invitations) and collect every displayed code.
- **Expected:** Every code is `XXXX-XXXX`; every character is in `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`; none contains 0, O, 1 or I.
- **Don't assert:** any particular code value.

#### TC-04-B2: 1,000 generated codes are all different
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Setup / Action:** As B1.
- **Expected:** No two codes are equal after normalisation; each opens the confirm screen for the lot it was printed with.
- **Don't assert:** distribution or randomness statistics.

#### TC-04-B3: No invitation document holds the plain code
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff creates; QE reads with admin SDK. **Tags:** Step 1 · Provisional — SA-001 Draft · Staging note: console / admin SDK access
- **Setup:** Print a slip for HH-A; note the code shown.
- **Action:** Read the new `invites` document (id and every field).
- **Expected:** Neither the id nor any field equals the code, its normalised form (`K7QXM9TA`) or its displayed form; `householdId`, `channel`, `status`, `expiresAt` are present.
- **Don't assert:** the hash value.

#### TC-04-B4: The invitation id is a keyed hash, not a plain hash of the code
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** QE data check. **Tags:** Provisional — SA-001 Draft
- **Setup:** As B3.
- **Action:** Compute unkeyed SHA-256 (hex and base64url) of the normalised code and compare with the document id.
- **Expected:** No match. The emulator/staging key is not the production key (separate secret).
- **Don't assert:** the key value or HMAC output.

#### TC-04-B5: The email's code and body are removed from the mail document once it is sent
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff invites; stub provider accepts. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Setup:** Stub provider set to accept.
- **Action:** Invite HH-A; read the `mail` document while queued and after the mail function runs.
- **Expected:** While `queued`, the document holds the recipient, subject and body with the code. Once `sent`, the code and the body are gone; status, recipient and timestamps remain.
- **Don't assert:** the provider message id format.

#### TC-04-B6: The email's code and body are removed from the mail document when hand-off fails
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** As B5. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Setup:** Stub provider set to refuse.
- **Action:** Invite HH-A; let the mail function run.
- **Expected:** Status `failed`; code and body gone.
- **Don't assert:** the provider's error text.

#### TC-04-B7: Invitation audit entries hold ids only
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** QE data check after A–K. **Tags:** Provisional — SA-001 Draft
- **Action:** Read every `auditLog` entry with an `invite.*` or `member.removed` action.
- **Expected:** No entry contains a code, an email address, a phone number or a person's name; each has actor id, household id, action and time.
- **Don't assert:** the field names beyond those.

#### TC-04-B8: Function logs contain no code and no email address
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** QE reads emulator function logs. **Tags:** Provisional — SA-001 Draft (CS-14)
- **Action:** Run create, check (right and wrong code), redeem and the mail function; collect logs.
- **Expected:** No log line contains a code (any form) or a recipient email address.
- **Don't assert:** log format.

#### TC-04-B9: The email link carries the code after `#`, never in the path or query
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff invites; homeowner opens the link. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Setup:** Read the queued mail body for HH-A.
- **Action:** Inspect the "Join the portal" link; open it and capture the requests sent to Hosting.
- **Expected:** The link is `{portal}/join#{code}`; no request URL, query string or `Referer` header carries the code.
- **Don't assert:** whether the fragment includes the hyphen.

#### TC-04-B10: Printing stores no slip PDF on the server
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · Provisional — SA-001 Draft
- **Action:** Print slips for HH-C; then list Storage and any new Firestore documents.
- **Expected:** No PDF or code list is stored in Storage or Firestore; the PDF is built in the browser from the function response.
- **Don't assert:** PDF library or file name.

#### TC-04-B11: Staff cannot see an existing code again after it is made
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff and treasurer. **Tags:** Step 1
- **Setup:** HH-A has an active printed invitation.
- **Action:** Open 4E for HH-A; read HH-A's invitations as staff through the allowed query.
- **Expected:** No screen and no readable field shows the code. The only way to get a code is a new print or resend.
- **Don't assert:** layout of the invitation list.

## C. Code entry, confirm and redeem (Step 1 core)

#### TC-04-C1: A printed code typed in lower case with a space opens the confirm screen
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household (U-ANA). **Tags:** Step 1
- **Setup:** A printed slip for HH-A; note its code, e.g. `K7QX-M9TA`.
- **Action:** On "Enter your invite code" type `k7qx m9ta` and submit.
- **Expected:** "You're joining Blk 2 Lot 7 (ZZ Ana Reyes). Is this your lot?" with "Yes, link my account" and "No, this isn't my lot".
- **Don't assert:** the specific code value.

#### TC-04-C2: The code is accepted in its printed form with the hyphen
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Enter `K7QX-M9TA`.
- **Expected:** Confirm screen for HH-A.
- **Don't assert:** —

#### TC-04-C3: The code is accepted with no separator
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Enter `K7QXM9TA`.
- **Expected:** Confirm screen for HH-A.
- **Don't assert:** —

#### TC-04-C4: Leading, trailing and mixed spaces and hyphens are ignored
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Enter `  k7qx - m9ta  ` and `K7-QX-M9-TA`.
- **Expected:** Both open the confirm screen for HH-A.
- **Don't assert:** that other punctuation is accepted (not specified).

#### TC-04-C5: "Yes, link my account" lands the person on the lot's dashboard
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household (U-ANA). **Tags:** Step 1
- **Setup:** Confirm screen for HH-A (C1).
- **Action:** Press "Yes, link my account".
- **Expected:** U-ANA lands on HH-A's dashboard (lot shown as Blk 2 Lot 7); the homeowner menu replaces the not-linked menu.
- **Don't assert:** dashboard figures.

#### TC-04-C6: Redeeming marks the invitation used and creates one membership with the invite's details
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA); QE reads data. **Tags:** Step 1 · Provisional — SA-001 Draft
- **Action:** After C5, read the invitation and `members/{HH-A}_{U-ANA uid}`.
- **Expected:** Invitation `used`, `usedBy` = U-ANA's uid, `usedAt` set. One membership with `householdId` = HH-A, `uid` = U-ANA, `relation` = the invite's relation, `inviteId`, `invitedBy` = the staff uid who created it, `linkedAt` set. One `invite.redeemed` audit entry.
- **Don't assert:** timestamp values.

#### TC-04-C7: After a redeem, staff see "Linked · 1 person"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** After C5.
- **Action:** Open the directory and HH-A's detail (fresh load).
- **Expected:** Pill "Linked · 1 person" on the row and the 4E header; People with portal access lists U-ANA's name with "Owner · linked {today}".
- **Don't assert:** which name source is used (G-18).

#### TC-04-C8: Checking a code returns only the lot and the owner name on file
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 · Provisional — SA-001 Draft
- **Action:** Call `checkInvite` with HH-A's valid code; inspect the full response.
- **Expected:** Contains the lot label and owner name (and whatever id the redeem needs); no email, mobile, balance, member names, other invitations or the expiry settings.
- **Don't assert:** response field names.

#### TC-04-C9: The confirm screen shows the lot and the owner on file, nothing else
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Open the confirm screen for HH-A.
- **Expected:** Lot "Blk 2 Lot 7" and "Owner on file ZZ Ana Reyes" (4C); no balance, contact, people or history.
- **Don't assert:** card styling.

#### TC-04-C10: "No, this isn't my lot" ends the join flow with the contact-office message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household (U-STRANGER). **Tags:** Step 1
- **Action:** On the HH-A confirm screen press "No, this isn't my lot".
- **Expected:** "Please contact the admin office to get the right invitation."; U-STRANGER is not linked and still sees only the not-linked menu.
- **Don't assert:** what the next screen is beyond the message (G-30).

#### TC-04-C11: After "No, this isn't my lot" the code is still unused and works for the right person
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER then U-ANA. **Tags:** Step 1
- **Action:** After C10, staff open HH-A; U-ANA enters the same code and confirms.
- **Expected:** HH-A still "Invited · expires {date}" before U-ANA redeems; U-ANA is linked; U-STRANGER's attempt did not count towards her guess limit.
- **Don't assert:** —

#### TC-04-C12: A code that doesn't exist shows the "doesn't match" message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes (attempt counter)
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Enter a well-formed code that no invitation has, e.g. `ZZZZ-2222`.
- **Expected:** "That code doesn't match an invitation. Check it, or ask the admin office for a new one." under the field; no confirm screen.
- **Don't assert:** —

#### TC-04-C13: Submitting an empty code field does not call the server
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 · Gap G-22
- **Action:** Press the submit button with the field empty.
- **Expected:** No `checkInvite` call; a field message (copy not defined, G-22); the attempt counter is unchanged.
- **Don't assert:** message wording.

#### TC-04-C14: A malformed code (wrong length or letters O, I, 0, 1) is refused clearly
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Maybe
**Role:** Homeowner without a household. **Tags:** Step 1 · Gap G-22
- **Action:** Enter `K7QX-M9T` (7), `K7QX-M9TAA` (9), `K7QX-M9T0` (zero).
- **Expected:** Refused without linking. Whether this shows "doesn't match" and counts towards the limit, or a local format message that doesn't, is G-22.
- **Don't assert:** the message or the counter until G-22 is answered.

#### TC-04-C15: The confirm screen shows the owner name on file at the time of the check
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff, then homeowner without a household. **Tags:** Step 1
- **Setup:** Print a slip for HH-A; then staff change HH-A's owner name to "ZZ Ana Reyes-Santos" (REQ-003 edit).
- **Action:** Enter the slip's code.
- **Expected:** "You're joining Blk 2 Lot 7 (ZZ Ana Reyes-Santos)…".
- **Don't assert:** —

## D. Wrong-code limit (per account)

All D cases: **Staging note:** controllable server clock; fresh account per case.

#### TC-04-D1: The 5th wrong code in 15 minutes is still checked and shows "doesn't match"
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household (U-STRANGER). **Tags:** Step 1
- **Action:** Enter five different non-existent codes starting 10:00:00 Manila.
- **Expected:** Each of the five shows "That code doesn't match an invitation…".
- **Don't assert:** response time.

#### TC-04-D2: The 6th attempt in the window shows "Too many wrong codes. Try again in 15 minutes."
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1
- **Setup:** D1 done (5 refused from 10:00:00).
- **Action:** Enter a 6th non-existent code at 10:05.
- **Expected:** "Too many wrong codes. Try again in 15 minutes."
- **Don't assert:** —

#### TC-04-D3: A right code entered while locked is not checked and reveals nothing
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER (locked). **Tags:** Step 1 · Provisional — SA-001 Draft
- **Setup:** Locked as in D2; HH-A has an active code.
- **Action:** Enter HH-A's valid code; inspect the response.
- **Expected:** "Too many wrong codes…"; no confirm screen; the response holds no lot or owner name; the invitation is still active and HH-A still "Invited".
- **Don't assert:** —

#### TC-04-D4: 14:59 after the first refused code the account is still locked
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER. **Tags:** Step 1
- **Setup:** First refusal 10:00:00, fifth at 10:04.
- **Action:** At 10:14:59 enter HH-A's valid code.
- **Expected:** "Too many wrong codes…".
- **Don't assert:** —

#### TC-04-D5: 15 minutes after the first refused code the account can try again
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1
- **Setup:** As D4.
- **Action:** At 10:15:00 enter HH-A's valid code.
- **Expected:** Confirm screen for HH-A.
- **Don't assert:** —

#### TC-04-D6: Attempts refused while locked don't extend the lock
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1 · Gap G-23 (confirm)
- **Setup:** Locked from 10:00:00; three more attempts at 10:06, 10:10, 10:14.
- **Action:** At 10:15:00 enter a valid code.
- **Expected:** Confirm screen (the window still ends 15 min after the first refusal).
- **Don't assert:** —

#### TC-04-D7: Expired codes don't count towards the limit
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1
- **Setup:** Five expired fixture codes; one valid HH-A code.
- **Action:** Enter the five expired codes, then the valid one, within 5 minutes.
- **Expected:** Five "This invitation has expired…" messages, then the confirm screen.
- **Don't assert:** —

#### TC-04-D8: Already-used codes don't count towards the limit
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1
- **Action:** Enter five codes used by other accounts, then a valid code.
- **Expected:** Five "already used" messages, then the confirm screen.
- **Don't assert:** —

#### TC-04-D9: Replaced, cancelled, deactivated-household and already-linked refusals don't count
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER for the first three; U-JUAN for the already-linked refusal. **Tags:** Step 1
- **Action:** Enter at least five codes made of these refusal kinds, then a valid code.
- **Expected:** Each kind shows its own message; the valid code then opens the confirm screen (U-JUAN: the already-linked message, not "Too many").
- **Don't assert:** —

#### TC-04-D10: Non-counting refusals in between don't reset or skip the count
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1
- **Action:** 4 wrong, 1 expired, 1 wrong (the 5th wrong), then a valid code, all within 10 minutes.
- **Expected:** The 5th wrong shows "doesn't match"; the next attempt shows "Too many wrong codes…".
- **Don't assert:** —

#### TC-04-D11: Another account is not locked when one account is
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER (locked) and U-STRANGER-2. **Tags:** Step 1
- **Action:** While U-STRANGER is locked, U-STRANGER-2 enters HH-A's valid code.
- **Expected:** U-STRANGER-2 sees the confirm screen.
- **Don't assert:** —

#### TC-04-D12: The lock follows the account across sign-out and a second device
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER (locked). **Tags:** Step 1 · Staging note: two sessions
- **Action:** Sign out and back in; and sign in on a second browser context; enter a valid code in each.
- **Expected:** "Too many wrong codes…" in both.
- **Don't assert:** —

#### TC-04-D13: Wrong codes sent straight to redeemInvite count and lock the same way
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER with a scripted client. **Tags:** Provisional — SA-001 Draft
- **Action:** Call `redeemInvite` directly with 5 non-existent codes, then `checkInvite` and `redeemInvite` with a valid code.
- **Expected:** The 6th call of either function is refused as too many; no membership is created; the valid invitation stays active.
- **Don't assert:** error code names.

#### TC-04-D14: Wrong codes spread over more than 15 minutes don't lock
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1 · Provisional — SA-001 Draft (fixed window from first failure)
- **Action:** Wrong codes at 10:00, 10:04, 10:08, 10:12, then 10:16, then a valid code at 10:17.
- **Expected:** The 10:16 entry shows "doesn't match" (a new window); the valid code opens the confirm screen.
- **Don't assert:** —

#### TC-04-D15: Whether a successful link resets the wrong-code count
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Gap G-23
- **Action:** 4 wrong, then redeem a valid code; then (as a now-linked account) any further code.
- **Expected:** Pending G-23. Whatever the rule, a linked account entering another lot's code sees the already-linked message, not a lock caused by earlier failures, unless the BA decides otherwise.
- **Don't assert:** until G-23 is answered.

#### TC-04-D16: A spike of wrong codes across the project raises the alert
**Priority** P3 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Lane:** exclusive — asserts the project-wide wrong-code count and alert
**Role:** 11 no-household accounts. **Tags:** Provisional — SA-001 Draft (observability, staging only)
- **Action:** 51 wrong codes within an hour across accounts.
- **Expected:** The wrong-code alert fires once.
- **Don't assert:** alert channel or exact threshold if Sol Arch changes it.

#### TC-04-D17: Pressing "No, this isn't my lot" doesn't count as a wrong code
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER. **Tags:** Step 1
- **Action:** Open the confirm screen and press "No" six times with valid codes; then enter a valid code.
- **Expected:** Confirm screen, never "Too many".
- **Don't assert:** —

## E. Expiry

All E cases: **Staging note:** controllable server clock; build dates from local Manila today.

#### TC-04-E1: An emailed invitation made Nov 28 shows "Invited · expires Dec 5, 2026"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Setup:** Defaults (7 email / 30 print); today Nov 28, 2026 Manila.
- **Action:** Press "Invite" on HH-A.
- **Expected:** HH-A shows "Invited · expires Dec 5, 2026".
- **Don't assert:** pill colour.

#### TC-04-E2: A slip printed Nov 28 expires Dec 28, 2026
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Print a slip for HH-C on Nov 28, 2026.
- **Expected:** The slip reads "Expires Dec 28, 2026"; HH-C shows "Invited · expires Dec 28, 2026".
- **Don't assert:** —

#### TC-04-E3: A code is still accepted at 23:59:59 Manila on its expiry date
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** HH-A invitation expiring Dec 5, 2026.
- **Action:** At Dec 5, 2026 23:59:59 Manila (15:59:59 UTC) enter the code.
- **Expected:** Confirm screen.
- **Don't assert:** —

#### TC-04-E4: At 00:00:00 Manila the next day the code is refused as expired
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** As E3.
- **Action:** At Dec 6, 2026 00:00:00 Manila (Dec 5, 16:00:00 UTC, still "Dec 5" in UTC) enter the code.
- **Expected:** "This invitation has expired. Ask the admin office to send a new one."; no confirm screen; not counted towards the limit.
- **Don't assert:** —

#### TC-04-E5: An invitation made just after Manila midnight takes its date from Manila, not UTC
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2
- **Action:** At Nov 29, 2026 00:30 Manila (Nov 28, 16:30 UTC) print a slip and send an email invite.
- **Expected:** Email invite "expires Dec 6, 2026"; slip "Expires Dec 29, 2026" (not Dec 5 / Dec 28).
- **Don't assert:** —

#### TC-04-E6: The directory shows "Invite expired" once the date has passed, with no staff action
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 · Gap G-3
- **Setup:** HH-A invitation expiring Dec 5, 2026.
- **Action:** At Dec 6, 2026 00:00:01 Manila open the directory and HH-A's detail.
- **Expected:** HH-A shows "Invite expired" in both places.
- **Don't assert:** whether a job or the reader derives it (G-3); how long after midnight it may take until G-3 is answered.

#### TC-04-E7: An invitation spanning the year end shows the new year
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2
- **Action:** On Dec 25, 2026 send an email invite; on Dec 2, 2026 print a slip.
- **Expected:** Both expire "Jan 1, 2027"; the code works at Jan 1, 2027 23:59:59 Manila.
- **Don't assert:** —

#### TC-04-E8: An invitation ending on a leap day shows Feb 29
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Print a slip on Jan 30, 2028.
- **Expected:** "Expires Feb 29, 2028".
- **Don't assert:** —

#### TC-04-E9: A device clock set back does not make an expired code work
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** HH-A code expired (server time Dec 6, 2026).
- **Action:** Set the browser clock to Dec 1, 2026 and enter the code.
- **Expected:** "This invitation has expired…".
- **Don't assert:** —

#### TC-04-E10: The same expiry date appears everywhere it is shown
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; homeowner reads the email. **Tags:** Step 2 (email), Step 1 (slip)
- **Action:** Invite HH-A by email and print a slip for HH-C; compare the email body, directory pill, 4E, 4F "Expire on" and the slip.
- **Expected:** Each place shows the same date for the same invitation, formatted "Dec 5, 2026".
- **Don't assert:** time-of-day wording (G-8).

#### TC-04-E11: A changed expiry setting applies to invitations made after the change
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer changes the setting; admin office staff invite. **Tags:** Step 2 · Provisional — SA-001 Draft · Gap G-7
- **Action:** Treasurer sets email expiry to 14 days on Nov 28, 2026; admin invites HH-A.
- **Expected:** HH-A "Invited · expires Dec 12, 2026".
- **Don't assert:** the settings screen layout (not in the mock-up).

#### TC-04-E12: Invitations made before a settings change keep their original expiry
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; admin office staff. **Tags:** Gap G-7
- **Setup:** HH-E invited Nov 28 with 7 days (Dec 5).
- **Action:** Treasurer changes email expiry to 14 days.
- **Expected (pending G-7):** HH-E still expires Dec 5, 2026; its code is refused on Dec 6.
- **Don't assert:** until G-7 is answered.

#### TC-04-E13: With no expiry setting stored, the defaults 7 and 30 days apply
**Priority** P2 · **Type** Boundary (zero vs not set) · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Provisional — SA-001 Draft · Staging note: settings document absent
- **Setup:** `config/settings.inviteExpiryDays` absent.
- **Action:** Invite by email and print a slip on Nov 28, 2026.
- **Expected:** Dec 5, 2026 and Dec 28, 2026; never "expires today" or an error.
- **Don't assert:** —

#### TC-04-E14: Expiry settings outside a sensible range are refused
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Gap G-7 · Blocked until the BA sets limits
- **Action:** Try 0, 1, a negative number and a very large number of days.
- **Expected:** Pending G-7 (min, max, and whether 0 means "end of today").
- **Don't assert:** anything until G-7 is answered.

#### TC-04-E15: Only the treasurer can change invitation expiry
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff, board, guard, homeowner. **Tags:** Provisional — SA-001 Draft · Gap G-7
- **Action:** Each tries to write the expiry settings.
- **Expected:** Refused explicitly for each (admin office: pending G-7, since REQ-002 gives admins non-financial Settings). The stored value is unchanged.
- **Don't assert:** "nothing visibly changed" as proof; assert the refusal.

#### TC-04-E16: A confirm screen left open past midnight on the expiry day refuses the link
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** HH-A expiring Dec 5; confirm screen opened at 23:59:30 Manila.
- **Action:** Press "Yes, link my account" at Dec 6 00:00:05 Manila.
- **Expected:** "This invitation has expired…"; no membership.
- **Don't assert:** —

## F. Single use and redeem concurrency

#### TC-04-F1: A code someone else used is refused as already used
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household (U-STRANGER). **Tags:** Step 1
- **Setup:** U-ANA linked with HH-A's code.
- **Action:** U-STRANGER enters it.
- **Expected:** "This invitation was already used. Ask the admin office for a new one."
- **Don't assert:** —

#### TC-04-F2: That refusal creates no membership and leaves the first member linked
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER; QE reads. **Tags:** Step 1
- **Action:** After F1, read HH-A's members and U-STRANGER's memberships.
- **Expected:** HH-A has only U-ANA; U-STRANGER has none; `memberCount` 1.
- **Don't assert:** —

#### TC-04-F3: The person who used a code enters it again and lands on the dashboard
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA, linked). **Tags:** Step 1
- **Action:** U-ANA enters her used code again (code entry or `/join#code`).
- **Expected:** She lands on HH-A's dashboard; no error.
- **Don't assert:** —

#### TC-04-F4: Re-entering one's own code creates no second membership and no extra audit entry
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA; QE reads. **Tags:** Provisional — SA-001 Draft
- **Action:** After F3, read members and audit.
- **Expected:** One membership; `memberCount` 1; still one `invite.redeemed` entry; `usedAt` unchanged.
- **Don't assert:** —

#### TC-04-F5: "Yes, link my account" is disabled while the link is in flight
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Press "Yes, link my account" and press it again at once (double tap).
- **Expected:** The button is disabled after the first press until the result; she lands on the dashboard once.
- **Don't assert:** spinner design.

#### TC-04-F6: Two rapid redeem calls from the same account make one membership
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household, scripted. **Tags:** Provisional — SA-001 Draft
- **Action:** Send two `redeemInvite` calls with the same code from the same account at once.
- **Expected:** Both succeed or the second returns "already yours"; exactly one membership; `memberCount` 1.
- **Don't assert:** which call wins.

#### TC-04-F7: The same account redeeming on two devices at once ends up linked once
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA on two browser contexts. **Tags:** Step 1 · Staging note: two sessions
- **Action:** Both press "Yes, link my account" together.
- **Expected:** Both land on HH-A's dashboard; one membership.
- **Don't assert:** —

#### TC-04-F8: Two people submitting the same unused code at once: exactly one is linked
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA and U-STRANGER. **Tags:** Step 1 · Staging note: two sessions
- **Action:** Both press "Yes, link my account" for HH-A's code at the same moment.
- **Expected:** One lands on the dashboard; the other sees "This invitation was already used. Ask the admin office for a new one."
- **Don't assert:** which one wins.

#### TC-04-F9: Ten parallel redeems of one code create exactly one membership
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-RACE-01 … 10, scripted. **Tags:** Provisional — SA-001 Draft
- **Action:** 10 parallel `redeemInvite` calls with HH-A's code.
- **Expected:** 1 success, 9 "already used"; one membership; `memberCount` 1; invitation `used` by the winner; one `invite.redeemed` entry.
- **Don't assert:** which account wins.

#### TC-04-F10: Negative control: ten parallel redeems of ten different codes all succeed
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-RACE-01 … 10. **Tags:** Provisional — SA-001 Draft (CS-8)
- **Setup:** 10 bulk fixture households, one code each.
- **Action:** 10 parallel redeems, one code per account.
- **Expected:** 10 memberships, each household "Linked · 1 person". (Proves F9 isn't passing because calls are serialised by the test.)
- **Don't assert:** timing.

#### TC-04-F11: The person who used a code re-enters it after its expiry date
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA (linked). **Tags:** Gap G-31
- **Action:** After the used invitation's expiry passes, U-ANA enters the code.
- **Expected (pending G-31):** She lands on the dashboard (she is a member), rather than seeing "expired".
- **Don't assert:** until G-31 is answered.

## G. Emailed invitations (Step 2)

**Mail rule for every G case:** assert the `mail` queue document (recipient, subject, status), never a delivered inbox. Tests must not send real mail: the emulator uses a stub provider; staging relies on the allow-list (ADR-005, SA-001 §10). All fixture addresses use `.test`.

#### TC-04-G1: "Invite" queues one email to the contact address with the subject of record
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Action:** Press "Invite" on HH-A (Greenfield brand; repeat on Gentri Heights).
- **Expected:** One `mail` document: to zz.owner.a@example.test, subject "Your invitation to the Greenfield Homes HOA portal" ("…Gentri Heights HOA portal" on that brand), status `queued`. One active email invitation with `sentTo` = that address. One `invite.created` audit entry.
- **Don't assert:** that anything was delivered.

#### TC-04-G2: The email subject carries no lot or person's name
**Priority** P3 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** QE reads the mail document. **Tags:** Step 2 (SA-001 §8.2)
- **Expected:** The subject is exactly the copy of record; no lot, name or code.
- **Don't assert:** —

#### TC-04-G3: The email body follows the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** QE reads the queued body. **Tags:** Step 2 · Gap G-8, G-20
- **Expected:** "Hi ZZ Ana Reyes, the Greenfield Homes HOA admin office has invited you to the resident portal for Blk 2 Lot 7. Press the button to join. This invitation expires on Dec 5, 2026." Button "Join the portal". "If the button doesn't work, sign in at {portal address} and enter this code: {code}".
- **Don't assert:** the extra 4A footer line until G-20 is answered; HTML structure.

#### TC-04-G4: Resend queues a new email to the same address
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Setup:** HH-A has an unused email invitation.
- **Action:** Press "Resend invitation".
- **Expected:** A second `mail` document to zz.owner.a@example.test, status `queued`; HH-A shows "Invited · expires {today + 7}".
- **Don't assert:** —

#### TC-04-G5: Resend leaves exactly one active invitation, marking the old one replaced
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Action:** After G4, read HH-A's invitations.
- **Expected:** Old `replaced` with `replacedBy` = new; new `active`; one `invite.replaced` audit entry.
- **Don't assert:** —

#### TC-04-G6: The old code after a resend shows the "replaced" message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 2
- **Action:** Enter the code from the first email.
- **Expected:** "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."; not counted towards the limit; the new code works.
- **Don't assert:** —

#### TC-04-G7: Resending an expired invitation gives a working new code
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Setup:** HH-A "Invite expired".
- **Action:** Press Resend (labelled "Resend" in mock-up 3A, G-20).
- **Expected:** New mail queued; pill "Invited · expires {new date}"; new code opens the confirm screen; old code still refused.
- **Don't assert:** which message the old code gives (G-24).

#### TC-04-G8: No screen says an invitation was sent or delivered while it is only queued
**Priority** P1 · **Type** UI/UX (copy promises) · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Gap G-14
- **Setup:** Stub provider paused, so mail stays `queued`.
- **Action:** Invite HH-A; read every toast, pill and 4E row.
- **Expected:** No "sent" or "delivered" wording; any status word shown is "queued" or the pill "Invited · expires …".
- **Don't assert:** the exact queued wording (G-14).

#### TC-04-G9: An email the provider refuses at hand-off shows "Email failed" with Resend and Print slip
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Setup:** Stub provider refuses zz.owner.a@example.test.
- **Action:** Invite HH-A; let the mail function run; reload the directory and 4E.
- **Expected:** Mail `failed`; HH-A shows "Email failed" with "Resend" and "Print slip" in both places.
- **Don't assert:** the provider's reason.

#### TC-04-G10: Resend from "Email failed" queues a new email and shows Invited
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Action:** From G9, fix nothing and press Resend with the stub now accepting.
- **Expected:** New mail queued then sent; pill "Invited · expires {date}"; one active invitation.
- **Don't assert:** —

#### TC-04-G11: "Print slip" from "Email failed" makes a print code and the email code stops working
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2
- **Action:** From G9, press "Print slip" and confirm.
- **Expected:** One-slip PDF; pill "Invited · expires {today + 30}"; the email invitation's code (known from the queued mail before clearing, captured by the test) is refused as replaced.
- **Don't assert:** —

#### TC-04-G12: A bounce reported later shows "Email failed" with Resend and Print slip
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Decision 3 (approved for step 2) · Provisional — SA-001 Draft · Blocked until the provider is chosen
- **Setup:** HH-E invited to zz.owner.e@exmaple.test; mail `sent`.
- **Action:** Deliver a simulated provider bounce event for that message.
- **Expected:** Mail `failed`; HH-E shows "Email failed" with "Resend" and "Print slip".
- **Don't assert:** the provider's event format (assumed, not known until the provider is chosen).

#### TC-04-G13: A bounce for a replaced invitation doesn't mark a household with a newer invitation as failed
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Setup:** HH-A invited, then resent; the new mail is `sent`.
- **Action:** Deliver a bounce event for the first (replaced) mail.
- **Expected:** HH-A still shows "Invited · expires {date of newer}".
- **Don't assert:** whether the old mail document is updated.

#### TC-04-G14: A late or repeated bounce never unlinks a member or duplicates state
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner linked; provider events. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Setup:** U-ANA linked via the email invite; later a bounce event arrives, twice.
- **Expected:** Membership kept; pill stays "Linked · 1 person"; at most one failure recorded.
- **Don't assert:** —

#### TC-04-G15: A recipient outside the staging allow-list is never handed to the provider
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff on `hoa-portal-staging`. **Tags:** Step 2 · Provisional — SA-001 Draft (ADR-005) · Staging only
- **Setup:** A fixture household whose contact email is a `.test` address not on the allow-list.
- **Action:** Invite it.
- **Expected:** The mail function does not call the provider for it; the mail document is not `sent`.
- **Don't assert:** whether it shows as `failed` or a separate blocked state (not specified).

#### TC-04-G16: A household with no email offers "Print slip", and an email invite for it is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Action:** Open HH-C's row; then call `createInvites` with channel email for HH-C.
- **Expected:** Row offers "Print slip", not "Invite"; the call creates no invitation and no mail.
- **Don't assert:** —

#### TC-04-G17: Resending while the earlier email is still queued
**Priority** P3 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Gap G-15
- **Setup:** Stub provider paused (pacing); HH-A's first mail `queued`.
- **Action:** Resend; resume the provider.
- **Expected (pending G-15):** The household receives a working code; whether the first, now-dead email is still handed over is G-15.
- **Don't assert:** until answered.

#### TC-04-G18: After the contact email is corrected, Resend goes to the new address and the old code stops working
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Gap G-16
- **Setup:** HH-E "Email failed" to the typo address; staff correct it to zz.owner.e@example.test (REQ-003 edit).
- **Action:** Press Resend.
- **Expected (pending G-16):** Mail queued to the corrected address; the invitation to the typo address is replaced (not left active); one active email invitation for HH-E.
- **Don't assert:** until G-16 is answered.

#### TC-04-G19: Before the email provider exists, the email controls are not usable
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 · Gap G-21
- **Action:** In a step-1 build, open the directory.
- **Expected (pending G-21):** "Invite", "Invite selected" and "Resend invitation" are hidden or disabled with a reason; printing works.
- **Don't assert:** until answered.

## H. Invite many households at once (Step 2)

#### TC-04-H1: Selecting 400 households, 20 without email, shows the bulk confirm of record
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2
- **Setup:** HH-BULK-001 … 400 "Not invited", 380 with email.
- **Action:** Select all 400; press "Invite selected".
- **Expected:** "Send 380 invitations? 20 households have no email. Print their slips instead." and "Expire on {today + 7}".
- **Don't assert:** dialog layout.

#### TC-04-H2: After confirming, the button reads "Queuing…" and is disabled until all are queued
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Action:** Confirm; press the button again during the run.
- **Expected:** "Queuing…", disabled, until the run ends; the second press does nothing.
- **Don't assert:** how long it takes.

#### TC-04-H3: When done, "380 invitations queued. Each household shows its email status."
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Expected:** That message exactly.
- **Don't assert:** toast duration.

#### TC-04-H4: Exactly 380 emails are queued and the 20 without email are untouched
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** QE reads. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Action:** Count `mail` documents and active invitations for the 400 fixture households.
- **Expected:** 380 queued mails, one per emailed household, each to that household's address; 380 active email invitations; the 20 remain "Not invited" with no invitation.
- **Don't assert:** totals outside the fixture set.

#### TC-04-H5: Pressing "Invite selected" again skips households with an unused invitation
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Action:** After H3, select the same 400 and press "Invite selected" again.
- **Expected:** No new mail and no replaced invitation for the 380; the codes from the first run still open the confirm screen.
- **Don't assert:** the exact count shown in the second confirm (G-13).

#### TC-04-H6: The counts in the confirm and done messages equal what is actually queued
**Priority** P2 · **Type** UI/UX (copy promises) · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Gap G-13
- **Setup:** Of 50 selected, 10 already have an unused invitation, 5 have no email.
- **Action:** Invite selected, confirm.
- **Expected (pending G-13):** Confirm and done say 35; 35 mails are queued.
- **Don't assert:** until answered.

#### TC-04-H7: Linked households in a bulk selection are not invited again
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Gap G-12
- **Setup:** Selection includes HH-B (Linked · 1 person, its invite used).
- **Action:** Invite selected, confirm.
- **Expected (pending G-12):** HH-B is skipped; no mail to zz.owner.b@example.test; HH-B stays Linked.
- **Don't assert:** until answered.

#### TC-04-H8: The bulk confirm reads correctly at m = 0, n = 1 and n = 0
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2 · Gap G-13
- **Action:** Select (a) 10 with email only, (b) one with email, (c) only households without email.
- **Expected (pending G-13):** No "0 households have no email" sentence; singular for one; for n = 0 a route to printing rather than "Send 0 invitations".
- **Don't assert:** wording until answered.

#### TC-04-H9: Cancelling the bulk confirm queues nothing
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2
- **Action:** Open the confirm; press "Cancel"; also try a backdrop click and Escape.
- **Expected:** No mail, no invitation; selection kept.
- **Don't assert:** whether backdrop closes the dialog.

#### TC-04-H10: After a bulk run, each household shows its email status
**Priority** P2 · **Type** UI/UX (copy promises) · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Gap G-14
- **Setup:** Stub provider accepts 370, refuses 10.
- **Action:** After the run, open the directory filtered to the fixture set.
- **Expected:** The 10 show "Email failed"; the 370 show an invited state; filter "Email failed (10)".
- **Don't assert:** the word for queued vs sent (G-14).

#### TC-04-H11: A bulk run interrupted and retried makes no duplicates
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Assumption: the network drop happens client-side after the call is sent; offline behaviour itself is not asserted
- **Action:** Drop the network during Queuing…; reconnect; press Invite selected again.
- **Expected:** Each household ends with exactly one active invitation and one queued mail.
- **Don't assert:** what the screen shows while offline.

#### TC-04-H12: "Print their slips instead" leads to printing for the households without email
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2 · Gap G-20 (4F button "Print 20 slips" not in copy of record)
- **Action:** From H1 choose the print option.
- **Expected:** The print confirm for exactly the 20 households without email (I1).
- **Don't assert:** the button label until G-20 is answered.

## I. Printed slips (Step 1)

#### TC-04-I1: "Print invite slips" for 20 households shows the print confirm of record
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** 20 bulk fixture households with no email.
- **Action:** Select them; press "Print invite slips".
- **Expected:** "Printing makes new codes. Any earlier unused code for these 20 households will stop working."
- **Don't assert:** —

#### TC-04-I2: Confirming downloads one PDF with one slip per household
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Confirm.
- **Expected:** One PDF downloads with 20 slips, one per selected lot, no lot twice.
- **Don't assert:** file name; slips per page.

#### TC-04-I3: Each slip shows the copy of record: HOA, lot, code, expiry, how to join
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** "{HOA name} resident portal", the lot, "Your invite code: XXXX-XXXX", "Expires {today + 30}", "1. Go to {portal address} 2. Sign in or create an account 3. Enter the code".
- **Don't assert:** fonts or exact layout.

#### TC-04-I4: Slips show no balance, email or phone number
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** Include a household with a seeded balance, an email and a mobile.
- **Action:** Extract all PDF text.
- **Expected:** No peso amount, no "@", no mobile number; no owner name (not in the slip copy).
- **Don't assert:** —

#### TC-04-I5: The PDF shows "Delete this file after printing."
**Priority** P1 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** The text appears in the PDF (footer).
- **Don't assert:** on which page only.

#### TC-04-I6: Every printed code links to the lot printed beside it
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household (checkInvite for each). **Tags:** Step 1
- **Action:** For each of the 20 slips, check the code.
- **Expected:** The confirm screen names the same lot as its slip, for all 20 (a mismatch links a family to the wrong lot, R-6).
- **Don't assert:** —

#### TC-04-I7: Printing again makes the earlier unused print code show "replaced"
**Priority** P1 · **Type** Negative (copy promises) · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; homeowner without a household. **Tags:** Step 1
- **Action:** Print HH-C twice; enter the first code.
- **Expected:** "This invitation was replaced by a newer one…"; the second code works.
- **Don't assert:** —

#### TC-04-I8: Printing a slip for a household with an unused email invitation stops the email code
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2 · Gap G-4
- **Setup:** HH-A active email invite (code captured by the test).
- **Action:** Print a slip for HH-A; enter the email code.
- **Expected (per the print copy; pending G-4):** Refused as replaced; one active invitation for HH-A (the print one).
- **Don't assert:** until G-4 is answered.

#### TC-04-I9: Printing a slip for a household with a pending second-person invitation
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Gap G-4
- **Setup:** HH-A linked (U-ANA); Carlo invited and unused.
- **Action:** Print a slip for HH-A.
- **Expected:** Pending G-4: whether Carlo's code stops working.
- **Don't assert:** until answered.

#### TC-04-I10: Printing for a linked household doesn't change the member or the used invitation
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · Gap G-12
- **Action:** Print a slip for HH-B.
- **Expected:** U-JUAN still linked; his invitation still `used`; HH-B pill stays "Linked · 1 person".
- **Don't assert:** whether printing for a linked household should be offered at all (G-12).

#### TC-04-I11: Cancelling the print confirm keeps the earlier codes working
**Priority** P1 · **Type** Negative (copy promises) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** HH-C has an active print code.
- **Action:** Print invite slips → Cancel (and separately: backdrop click, Escape).
- **Expected:** No PDF, no new invitation; HH-C's existing code still opens the confirm screen.
- **Don't assert:** —

#### TC-04-I12: Pressing Print twice quickly leaves one active print code per household
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · Gap G-33
- **Action:** Double-press the print confirm button.
- **Expected:** One active print invitation per household; if two PDFs result, every code in the stale one is refused as replaced (the office must be able to tell; G-33).
- **Don't assert:** number of PDFs.

#### TC-04-I13: A printed slip is legible and cut-able
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff (manual print). **Tags:** Step 1
- **Action:** Print on A4 and Letter; cut along the dashes.
- **Expected:** Two slips per page, cut lines between; the code monospaced and large enough to read at arm's length; no slip split across the cut.
- **Don't assert:** exact point size.

#### TC-04-I14: "Print slip" on a single no-email row downloads a one-slip PDF
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** On HH-C's directory row press "Print slip" and confirm.
- **Expected:** Print confirm for 1 household; one-slip PDF; HH-C "Invited · expires {today + 30}".
- **Don't assert:** singular/plural wording of the confirm (G-13).

## J. Second person, already linked elsewhere, deactivated, limits

#### TC-04-J1: "Invite another person" with Family gives the second person their own code
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (email) · Provisional — SA-001 Draft
- **Setup:** U-ANA linked to HH-A.
- **Action:** On 4E press "Invite another person", enter zz.family.a2@example.test, pick "Family", send.
- **Expected:** One queued mail to that address; a new active invitation with relation Family; U-ANA's invitation and membership unchanged; HH-A still "Linked · 1 person".
- **Don't assert:** pill precedence beyond "Linked · 1 person" (G-2).

#### TC-04-J2: After the second person redeems, the directory shows "Linked · 2 people"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO, then admin office staff. **Tags:** Step 2
- **Action:** U-CARLO redeems; staff reload the directory and 4E.
- **Expected:** "Linked · 2 people" on the row and the 4E header.
- **Don't assert:** row order of people.

#### TC-04-J3: The relation the admin picked is what the household detail shows
**Priority** P1 · **Type** Integration (round trip) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2
- **Expected:** 4E People lists Carlo as "Family · linked {date}" and Ana as "Owner · linked {date}"; `members.relation` = family.
- **Don't assert:** the source of the display name (G-18).

#### TC-04-J4: Inviting the same address twice for one household makes one active invitation
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Action:** Invite another person with zz.family.a2@example.test twice (second time without "Resend").
- **Expected:** One active invitation for that slot; one queued mail.
- **Don't assert:** the message shown on the second try.

#### TC-04-J5: A click outside "Invite another person" keeps what was typed
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2 (REQ-003 precedent)
- **Action:** Type an email and pick a relation; click the backdrop.
- **Expected:** Dialog stays open with both values; nothing sent.
- **Don't assert:** Escape behaviour (NAV-06 closes modals; confirm with BA if typed input should be kept).

#### TC-04-J6: The relation picker offers only the R1 relations
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Gap G-17
- **Expected (pending G-17):** Owner, co-owner and family; no tenant (out of scope, D3).
- **Don't assert:** order.

#### TC-04-J7: A person linked to another lot sees the already-linked message
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner U-JUAN (member of HH-B). **Tags:** Step 1 · Decision 4 (approved: refuse in R1)
- **Action:** Enter HH-A's valid code.
- **Expected:** "Your account is already linked to Blk 4 Lot 12. Ask the admin office if you need access to another lot."; no confirm screen.
- **Don't assert:** —

#### TC-04-J8: That refusal leaves the code unused and Juan's single membership unchanged
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN; QE reads. **Tags:** Step 1
- **Expected:** HH-A invitation still active; HH-A "Invited"; U-JUAN has only the HH-B membership.
- **Don't assert:** —

#### TC-04-J9: The already-linked refusal holds when redeemInvite is called directly
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-JUAN, scripted. **Tags:** Provisional — SA-001 Draft
- **Action:** Call `redeemInvite` with HH-A's code, skipping `checkInvite`.
- **Expected:** Refused; no HH-A membership; invitation still active.
- **Don't assert:** —

#### TC-04-J10: A treasurer who is also a homeowner can't redeem a code for a second lot
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** S-TREAS-HO (member of HH-F). **Tags:** Step 1
- **Action:** Enter HH-A's valid code.
- **Expected:** "Your account is already linked to Blk 2 Lot 10…"; the staff role does not bypass it.
- **Don't assert:** —

#### TC-04-J11: A staff member with no household can link to their own lot and gets the view switch
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS (no household). **Tags:** Step 1 (REQ-002 regression)
- **Action:** Redeem a fixture household's code.
- **Expected:** Linked; the top bar shows "Treasurer" and "My household".
- **Don't assert:** —

#### TC-04-J12: A member entering another code for their own household
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA (linked to HH-A). **Tags:** Gap G-19
- **Action:** Enter Carlo's unused HH-A code.
- **Expected (pending G-19):** Carlo's code is not consumed; U-ANA stays one member.
- **Don't assert:** the message until answered.

#### TC-04-J13: A code for a household deactivated after printing shows "no longer valid"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** Print a slip for HH-D; staff deactivate HH-D (REQ-003).
- **Action:** Enter the slip's code.
- **Expected:** "This invitation is no longer valid. Ask the admin office."; not counted towards the limit.
- **Don't assert:** —

#### TC-04-J14: Deactivating a household cancels its active invitations
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 1 · Provisional — SA-001 Draft
- **Expected:** HH-D's active invitation is `cancelled`; one `invite.cancelled` audit entry; HH-D listed under "Inactive".
- **Don't assert:** —

#### TC-04-J15: A confirm screen open when the household is deactivated refuses the link
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household; admin office staff. **Tags:** Step 1 · Staging note: two sessions
- **Action:** Homeowner opens HH-D's confirm screen; staff deactivate HH-D; homeowner presses Yes.
- **Expected:** "This invitation is no longer valid…"; no membership.
- **Don't assert:** —

#### TC-04-J16: Reactivating a household does not revive its old code
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · Gap G-5
- **Action:** Reactivate HH-D; enter its old code.
- **Expected:** Still refused; staff can print a new slip.
- **Don't assert:** HH-D's pill after reactivation (G-9 family).

#### TC-04-J17: A deactivated household can't be invited, resent or printed
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Provisional — SA-001 Draft
- **Action:** Open HH-D under Inactive; then call `createInvites` for it.
- **Expected:** No invite controls; the call creates nothing.
- **Don't assert:** —

#### TC-04-J18: Inviting beyond the people-per-household limit
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** **Blocked — board** (open question: is there a limit?)
- **Expected:** Pending the board. If no limit, a 10th person can be invited and the pill reads "Linked · 10 people".
- **Don't assert:** anything until decided.

## K. Removing a person after a sale

#### TC-04-K1: "Remove" asks the confirm of record
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 · Gap G-20 (pronoun)
- **Setup:** U-ANA linked to HH-A.
- **Action:** On 4E press "Remove" next to ZZ Ana Reyes.
- **Expected:** "Remove ZZ Ana Reyes from Blk 2 Lot 7? … will no longer see this lot. Its bills and payments stay with the lot." with Cancel and Remove.
- **Don't assert:** "She" vs "They" until G-20 is answered.

#### TC-04-K2: After removal, the removed person's next household read is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff removes; U-ANA reads. **Tags:** Step 1
- **Action:** Confirm Remove; U-ANA's still-open session requests HH-A's household document.
- **Expected:** Refused at once (no token refresh needed).
- **Don't assert:** —

#### TC-04-K3: The removed person sees the not-linked screen on her next load
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA. **Tags:** Step 1 · Gap G-26
- **Action:** Reload or navigate.
- **Expected:** "Your account isn't linked to a household yet. Enter the invite code from the admin office."; no HH-A data, even briefly.
- **Don't assert:** how fast an open screen changes without a reload (G-26).

#### TC-04-K4: Removal makes every unused invitation for the lot stop working
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; homeowner without a household. **Tags:** Step 1 · Gap G-5
- **Setup:** HH-A also has Carlo's unused invite and an unused print code.
- **Action:** Remove U-ANA; enter both codes.
- **Expected:** Both refused ("no longer valid" assumed, G-5); both invitations `cancelled`.
- **Don't assert:** message until G-5 is answered.

#### TC-04-K5: The lot's bills, payments and totals stay with the lot
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 1 · Staging note: seeded bill and payment documents for HH-A (no billing in R1 yet)
- **Action:** Remove U-ANA; read HH-A's totals and every seeded bill and payment.
- **Expected:** All still carry `householdId` = HH-A; billed, paid and balance unchanged; nothing deleted or moved.
- **Don't assert:** figures beyond "unchanged".

#### TC-04-K6: The activity log records who removed her and when
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** QE reads (treasurer/board screen is backlog story 06). **Tags:** Step 1 · Provisional — SA-001 Draft · Gap G-6
- **Expected:** One `member.removed` entry with actor = S-ADMIN's uid, household HH-A, target U-ANA's uid, time; ids only.
- **Don't assert:** a screen until story 06 exists.

#### TC-04-K7: Removal deletes the membership and the pill counts down
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · Gap G-9
- **Setup:** HH-A has Ana and Carlo.
- **Action:** Remove Ana; then remove Carlo.
- **Expected:** After Ana: "Linked · 1 person", `memberCount` 1. After Carlo: `memberCount` 0 and never "Linked · 0 people" (the pill shown is G-9).
- **Don't assert:** the last-member pill until G-9 is answered.

#### TC-04-K8: Removing someone already removed says "already removed" and changes nothing
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN and S-ADMIN-2 (stale 4E). **Tags:** Step 1 · Provisional — SA-001 Draft · Gap G-10
- **Action:** Both press Remove for U-ANA; the second confirms after the first.
- **Expected:** The second sees an "already removed" message (copy G-10); `memberCount` decremented once; one `member.removed` entry.
- **Don't assert:** wording.

#### TC-04-K9: "Remove" is disabled while in flight
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Double-press the confirm "Remove".
- **Expected:** Disabled after the first press; one removal.
- **Don't assert:** —

#### TC-04-K10: Cancelling the remove confirm keeps the person linked
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Remove → Cancel; also backdrop click and Escape.
- **Expected:** U-ANA still linked and listed; no audit entry.
- **Don't assert:** —

#### TC-04-K11: A removed person re-entering her own used code does not regain access
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA after removal. **Tags:** Step 1 · Gap G-11
- **Action:** Enter the code she used to join (code entry and `/join#code`).
- **Expected:** Refused; no membership created; she stays on the not-linked screen. (The "same person lands on the dashboard" rule must not apply after removal.)
- **Don't assert:** the message until G-11 is answered.

#### TC-04-K12: The new owner can be invited and linked after the old owner is removed
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; U-NEW. **Tags:** Step 1
- **Setup:** Ana removed; staff edit HH-A's owner name to "ZZ New Owner" (REQ-003).
- **Action:** Print a slip for HH-A; U-NEW redeems.
- **Expected:** U-NEW linked; HH-A "Linked · 1 person"; 4E People lists only U-NEW.
- **Don't assert:** —

#### TC-04-K13: The new owner cannot see the previous owner's contact details
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-NEW. **Tags:** Step 1
- **Action:** Request HH-A's `householdContacts` and inspect every household screen.
- **Expected:** Read refused; no previous email or mobile on any screen.
- **Don't assert:** —

#### TC-04-K14: After the office edits the owner name, the new owner's confirm screen shows the new name
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-NEW. **Tags:** Step 1 · Gap G-28
- **Action:** As K12, before redeeming.
- **Expected:** "You're joining Blk 2 Lot 7 (ZZ New Owner)…", not the previous owner's name.
- **Don't assert:** what happens if the office forgets the edit (G-28).

#### TC-04-K15: Removing the owner leaves other members linked
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · Gap G-29
- **Setup:** Ana and Carlo linked.
- **Action:** Remove Ana only.
- **Expected:** Carlo still linked and listed; "Linked · 1 person".
- **Don't assert:** whether this is the intended sale procedure (G-29).

#### TC-04-K16: Editing the owner name alone doesn't unlink anyone
**Priority** P2 · **Type** Regression · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Edit HH-A's owner name and contact email (REQ-003).
- **Expected:** Existing members stay linked; nothing removes the old owner automatically.
- **Don't assert:** —

#### TC-04-K17: Treasurer can remove a person
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS. **Tags:** Step 1
- **Action:** Remove a linked fixture member.
- **Expected:** Removed, as for admin office staff.
- **Don't assert:** —

## L. Privacy after a sale (Blocked — decision 5)

Owner decision 5 is open: decide before the payments REQ (EPIC-003). Sol Arch's options: **Option 1**, members see records from their `linkedAt` date only; **Option 2**, payment screenshots are visible only to the uploader and staff. Bills and payments don't exist in R1, so these cases also wait for the payments REQ. Keep them in the plan so the decision has test cases waiting.

#### TC-04-L1: [Option 1] The new owner sees no receipts or bills dated before they linked
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-NEW (HH-A after the sale). **Tags:** Blocked — decision 5 · Blocked — payments REQ
- **Setup:** Seeded HH-A receipts and bills before U-NEW's `linkedAt`, and one after.
- **Expected:** Only the later record is visible and readable.
- **Don't assert:** until decided.

#### TC-04-L2: [Option 1] A record on the link date itself
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** U-NEW. **Tags:** Blocked — decision 5
- **Setup:** A record the same Manila day as `linkedAt`, minutes before and after.
- **Expected:** Pending decision 5 (timestamp vs Manila date).
- **Don't assert:** until decided.

#### TC-04-L3: [Option 2] The new owner can't open the previous owner's payment screenshots
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-NEW. **Tags:** Blocked — decision 5 · Blocked — payments REQ
- **Expected:** Storage read of `proofs/HH-A/…` uploaded by U-ANA refused.
- **Don't assert:** until decided.

#### TC-04-L4: [Option 2] What the new owner sees of earlier receipts
**Priority** P2 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** U-NEW. **Tags:** Blocked — decision 5
- **Expected:** Pending decision 5 (receipts visible but the previous owner's name?).
- **Don't assert:** until decided.

#### TC-04-L5: [Either] The removed owner can't open any of the lot's records, including her own uploads
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA after removal. **Tags:** Blocked — payments REQ
- **Expected:** Every read refused, including a previously opened screenshot URL.
- **Don't assert:** signed-URL lifetime.

#### TC-04-L6: [Either] Staff still see the lot's full history after a sale
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff, treasurer. **Tags:** Blocked — decision 5
- **Expected:** All HH-A bills, payments and screenshots visible to staff.
- **Don't assert:** —

## M. Roles, rules and data leaks

All M cases assert the refusal explicitly ("nothing changed on screen" is not proof).

#### TC-04-M1: Treasurer can invite, resend and print
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS. **Tags:** Step 1 and 2
- **Expected:** Each action works as for admin office staff.
- **Don't assert:** —

#### TC-04-M2: createInvites is refused for board, guard, homeowner, no-role and signed-out callers
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-BOARD, S-GUARD, U-JUAN, U-STRANGER, anonymous. **Tags:** Provisional — SA-001 Draft
- **Expected:** Each call refused; no invitation, no mail.
- **Don't assert:** error code names.

#### TC-04-M3: removeMember is refused for the same callers
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** As M2 (U-JUAN tries to remove himself and someone in HH-A). **Tags:** Provisional — SA-001 Draft
- **Expected:** Refused; memberships unchanged.
- **Don't assert:** —

#### TC-04-M4: cancelInvite is refused for the same callers
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** As M2. **Tags:** Provisional — SA-001 Draft
- **Expected:** Refused; invitations unchanged.
- **Don't assert:** —

#### TC-04-M5: checkInvite and redeemInvite are refused when signed out
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Anonymous. **Tags:** Provisional — SA-001 Draft
- **Expected:** Both refused; nothing revealed about the code.
- **Don't assert:** —

#### TC-04-M6: A person can only redeem for themselves
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER, scripted. **Tags:** Provisional — SA-001 Draft
- **Action:** Call `redeemInvite` with HH-A's code and U-ANA's uid as a parameter.
- **Expected:** Any membership created belongs to U-STRANGER (the caller) or the call is refused; never one for U-ANA.
- **Don't assert:** which of the two.

#### TC-04-M7: Non-staff cannot read invitations, even for their own household
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN (HH-B), U-STRANGER, S-BOARD, S-GUARD. **Tags:** Provisional — SA-001 Draft
- **Expected:** Every read of `invites` refused.
- **Don't assert:** —

#### TC-04-M8: Staff can read a household's invitations by household
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-TREAS. **Tags:** Provisional — SA-001 Draft
- **Expected:** Query `invites` where `householdId` = HH-A allowed; a query without the household filter refused.
- **Don't assert:** index details.

#### TC-04-M9: No client can write an invitation, staff included
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN, U-STRANGER. **Tags:** Provisional — SA-001 Draft
- **Action:** Create an invite document; set an existing one's status to `active` or its `expiresAt` later.
- **Expected:** All refused.
- **Don't assert:** —

#### TC-04-M10: No client can read or reset its wrong-code counter
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER (locked). **Tags:** Provisional — SA-001 Draft
- **Action:** Read, delete or update `inviteAttempts/{own uid}`.
- **Expected:** All refused; still locked.
- **Don't assert:** —

#### TC-04-M11: No client can read or write the mail queue, staff included
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN, S-TREAS, U-ANA. **Tags:** Provisional — SA-001 Draft
- **Expected:** Reads and writes of `mail` refused (a queued mail holds a live code).
- **Don't assert:** —

#### TC-04-M12: No client can create a membership
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER, S-ADMIN. **Tags:** Provisional — SA-001 Draft
- **Action:** Write `members/{HH-A}_{own uid}`.
- **Expected:** Refused; no access to HH-A.
- **Don't assert:** —

#### TC-04-M13: A member can't read another household's memberships
**Priority** P1 · **Type** Security (cross-household) · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN. **Tags:** Provisional — SA-001 Draft
- **Expected:** Read of HH-A memberships refused; his own allowed.
- **Don't assert:** —

#### TC-04-M14: A newly linked member reads only their own household
**Priority** P1 · **Type** Security (cross-household) · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA just after redeeming HH-A. **Tags:** Step 1
- **Action:** Request HH-B's household document and contacts.
- **Expected:** Refused.
- **Don't assert:** —

#### TC-04-M15: Clients can't change link status or member count
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN, U-ANA. **Tags:** Provisional — SA-001 Draft
- **Action:** Update `households/HH-A.linkStatus` or `memberCount`.
- **Expected:** Refused.
- **Don't assert:** —

#### TC-04-M16: A guard sees no households, invitations or people
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-GUARD. **Tags:** Step 1
- **Expected:** No Homeowners menu; the Homeowners and household detail URLs show "You don't have access to this page"; reads of households, members and invites refused.
- **Don't assert:** —

#### TC-04-M17: A staff member whose role was just removed can't invite or remove
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN-2 with role removed, still holding the old token. **Tags:** Provisional — SA-001 Draft (REQ-002 "at once")
- **Expected:** `createInvites` and `removeMember` refused on the next call.
- **Don't assert:** —

## N. Staff concurrency and stale screens

#### TC-04-N1: Two staff pressing Resend at once leave exactly one active code
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN and S-ADMIN-2. **Tags:** Step 2 · Provisional — SA-001 Draft · Staging note: two sessions
- **Action:** Both press "Resend invitation" for HH-A together.
- **Expected:** One active invitation for that slot; every other is `replaced`; only the active one's code works.
- **Don't assert:** how many mails were queued (G-33).

#### TC-04-N2: Two staff running "Invite selected" on the same households make one invitation each
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN and S-ADMIN-2. **Tags:** Step 2 · Staging note: two sessions
- **Action:** Both confirm Invite selected for 50 fixture households at once.
- **Expected:** Each household: one active invitation, one queued mail.
- **Don't assert:** whose run did which household.

#### TC-04-N3: Two staff printing the same household at once leave one active print code
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN and S-ADMIN-2. **Tags:** Step 1 · Gap G-32
- **Expected:** One active print invitation for HH-C; the other PDF's code is refused as replaced.
- **Don't assert:** how the office is warned (G-32).

#### TC-04-N4: Redeem and Resend at the same moment end in one consistent state
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA; S-ADMIN. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Expected:** Either U-ANA is linked and that invitation is `used` (and the resend creates no second active invitation for her slot), or she sees the "replaced" message and a new active invitation exists. Never both a member and an active invitation for the same slot from this pair.
- **Don't assert:** which wins.

#### TC-04-N5: Redeem and Remove in the same household at once keep the count right
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-CARLO redeems; S-ADMIN removes U-ANA. **Tags:** Provisional — SA-001 Draft
- **Expected:** `memberCount` equals the number of memberships afterwards; if the removal ran first, Carlo's code is refused (K4).
- **Don't assert:** which wins.

#### TC-04-N6: A confirm screen open while staff resend refuses the old code
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household; S-ADMIN. **Tags:** Step 2
- **Action:** Homeowner on the confirm screen; staff resend; homeowner presses Yes.
- **Expected:** "This invitation was replaced by a newer one…"; no membership.
- **Don't assert:** —

#### TC-04-N7: An open household detail shows the link after a reload
**Priority** P2 · **Type** Integration (derived refresh) · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN with 4E open; U-ANA redeems meanwhile. **Tags:** Step 1
- **Expected:** After reload (or live update, if built), "Linked · 1 person" and Ana listed.
- **Don't assert:** live update without reload (not specified).

#### TC-04-N8: Resend from a stale screen on a household that just linked creates no active invitation
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN with a stale directory. **Tags:** Step 2 · Provisional — SA-001 Draft
- **Action:** U-ANA redeems; staff press the stale "Resend invitation" for her slot.
- **Expected:** No new active invitation and no mail for the used slot; the screen refreshes to Linked.
- **Don't assert:** message wording.

## P. Navigation and deep links

#### TC-04-P1: A signed-in account with no household lands on the not-linked screen
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER. **Tags:** Step 1 (REQ-001 regression)
- **Expected:** "Your account isn't linked to a household yet. Enter the invite code from the admin office."; menu only "Enter invite code" and "Sign out"; "Enter invite code" opens "Enter your invite code" with its hint.
- **Don't assert:** —

#### TC-04-P2: The email link survives email-and-password sign-in without typing the code
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA, signed out. **Tags:** Step 2
- **Action:** Open `/join#{code}`; sign in with email and password.
- **Expected:** Confirm screen for HH-A, without typing the code.
- **Don't assert:** —

#### TC-04-P3: The email link survives creating a new account
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** New account. **Tags:** Step 2
- **Action:** Open `/join#{code}`; "New here? Create an account"; create it.
- **Expected:** Confirm screen for the lot.
- **Don't assert:** email verification flow (TC-01).

#### TC-04-P4: The email link survives "Continue with Google"
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA-G. **Tags:** Step 2 · Assumption: popup flow on desktop and phone emulation; in-app email browsers are in the exploratory charter, not asserted
- **Action:** Open `/join#{code}`; Continue with Google; complete the popup.
- **Expected:** Confirm screen for the lot.
- **Don't assert:** popup behaviour on in-app browsers.

#### TC-04-P5: Refreshing the sign-in page mid-flow keeps the code
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Signed out. **Tags:** Step 2
- **Action:** Open `/join#{code}`; reload the sign-in page; sign in.
- **Expected:** Confirm screen for the lot.
- **Don't assert:** —

#### TC-04-P6: Refreshing the confirm screen keeps the lot and the link still works
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 1 and 2
- **Action:** Reload on the confirm screen; press Yes.
- **Expected:** The confirm screen shows the same lot after reload; Yes links.
- **Don't assert:** —

#### TC-04-P7: After linking, the code is cleared from session storage and the address bar
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA. **Tags:** Step 1 and 2 · Provisional — SA-001 Draft
- **Expected:** No `sessionStorage` key holds the code; the URL has no fragment code.
- **Don't assert:** the storage key name.

#### TC-04-P8: After "No, this isn't my lot", the code is cleared too
**Priority** P3 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER. **Tags:** Gap G-30
- **Expected (pending G-30):** No pending code in `sessionStorage`; reloading doesn't reopen the confirm screen.
- **Don't assert:** until answered.

#### TC-04-P9: Signing out with a pending code leaves no code on the device
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Shared phone: U-STRANGER opened the link, then signs out. **Tags:** Step 2 · Assumption (REQ silent)
- **Action:** Open `/join#{code}`; sign in; sign out before confirming; sign in as U-STRANGER-2.
- **Expected:** U-STRANGER-2 does not see the confirm screen for that code.
- **Don't assert:** —

#### TC-04-P10: Back after linking doesn't create a second link
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA. **Tags:** Step 1
- **Action:** After landing on the dashboard press Back (and Yes again if shown).
- **Expected:** Dashboard or confirm screen; any second Yes lands on the dashboard; one membership.
- **Don't assert:** which screen Back shows.

#### TC-04-P11: A homeowner can't open the Homeowners directory or a household detail by URL
**Priority** P1 · **Type** Navigation (security) · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA (linked) and U-STRANGER. **Tags:** Step 1
- **Action:** Open the Homeowners URL and HH-A's detail URL.
- **Expected:** "You don't have access to this page" with "Go to my dashboard" (U-STRANGER: the not-linked screen); no data requests succeed.
- **Don't assert:** —

#### TC-04-P12: A no-household account opening a household URL sees no data
**Priority** P2 · **Type** Navigation (security) · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER after "No, this isn't my lot". **Tags:** Step 1
- **Action:** Open the dashboard URL directly.
- **Expected:** Not-linked screen; no household data, even briefly.
- **Don't assert:** —

#### TC-04-P13: Staff move from the directory to household detail and back with the Homeowners menu highlighted
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (NAV-03 regression)
- **Action:** Search "blk 2", open HH-A, press Back.
- **Expected:** "Homeowners" is the one `aria-current` item on both; Back returns to the list with the search kept.
- **Don't assert:** scroll position.

#### TC-04-P14: After Remove, staff stay on the household detail with the list updated
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** Still on 4E; the person is gone; focus moves to a sensible place (the People heading or the next row).
- **Don't assert:** exact focus target.

#### TC-04-P15: An important announcement doesn't block the join flow
**Priority** P2 · **Type** Navigation (modal mid-flow) · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 1 (NAV-05 regression)
- **Setup:** An important announcement is live.
- **Action:** Enter a code, confirm, land on the dashboard.
- **Expected:** No pop-up on the code entry or confirm screens; on the dashboard the pop-up may appear and can be acknowledged; the link has already completed.
- **Don't assert:** —

#### TC-04-P16: `/join` with no code opens empty code entry
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 2
- **Expected:** "Enter your invite code" with an empty field; no check sent; attempt count unchanged.
- **Don't assert:** —

## Q. Usability and accessibility (WCAG 2.2 AA, 375 px)

#### TC-04-Q1: The code field has a visible label and the hint is tied to it
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Expected:** A visible label programmatically linked to the input; hint "You'll find it in your invitation email or on the slip from the admin office." referenced by `aria-describedby`.
- **Don't assert:** label wording beyond the copy of record.

#### TC-04-Q2: The code field uses the large monospaced code style
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Expected:** Monospaced, large, letter-spaced like the guest pass `.code`; no autocorrect or auto-capitalise errors on phones.
- **Don't assert:** exact font size.

#### TC-04-Q3: A code can be pasted into the field
**Priority** P2 · **Type** Usability (WCAG 3.3.8) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Paste "K7QX-M9TA" from the clipboard.
- **Expected:** Accepted; confirm screen after submit.
- **Don't assert:** —

#### TC-04-Q4: Errors are announced and tied to the field, with focus kept there
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household, with a screen reader. **Tags:** Step 1
- **Action:** Enter a wrong code.
- **Expected:** The error is announced (live region or `role="alert"`), shown under the field, linked by `aria-describedby`; focus stays in the field with the text kept.
- **Don't assert:** the announcement mechanism.

#### TC-04-Q5: While a code is being checked the button reads "Checking…" and is disabled
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 · Staging note: slowed network
- **Expected:** "Checking…", disabled, until the result.
- **Don't assert:** duration.

#### TC-04-Q6: The join screens are single cards at 375 px with the phone layout
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household on phone emulation (`isMobile`). **Tags:** Step 1 · DEF-001
- **Expected:** Layout width 375 (viewport meta present); code entry, confirm and error screens are single cards; no sideways scroll.
- **Don't assert:** —

#### TC-04-Q7: Tap targets on the join screens and the email button are large enough
**Priority** P2 · **Type** Usability (WCAG 2.5.8) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner at 375 px. **Tags:** Step 1; email button Step 2
- **Expected:** "Yes, link my account", "No, this isn't my lot", submit, and "Join the portal" at least 24 × 24 CSS px (target 44 px).
- **Don't assert:** exact sizes above the minimum.

#### TC-04-Q8: The on-screen keyboard doesn't hide the focused field or the error
**Priority** P3 · **Type** Usability (WCAG 2.4.11) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner at 375 px. **Tags:** Step 1
- **Expected:** With the keyboard open, the field and its error stay visible.
- **Don't assert:** —

#### TC-04-Q9: Link-status pills carry text and enough contrast
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** Every pill has words, not colour alone; text contrast ≥ 4.5:1 on both brands.
- **Don't assert:** colours.

#### TC-04-Q10: The Remove dialog traps focus, Escape cancels, and focus returns
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff, keyboard only. **Tags:** Step 1 (NAV-06 regression)
- **Expected:** Focus inside the dialog; Tab cycles within; Escape closes without removing; focus returns to the Remove button.
- **Don't assert:** which button gets first focus.

#### TC-04-Q11: "Queuing…" and the bulk result are announced
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff with a screen reader. **Tags:** Step 2
- **Expected:** The in-flight state and "380 invitations queued…" are announced.
- **Don't assert:** mechanism.

#### TC-04-Q12: The whole join flow works with a keyboard only
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 1
- **Expected:** Code entry, submit with Enter, Yes / No reachable and operable with visible focus.
- **Don't assert:** —

#### TC-04-Q13: Phone directory cards show the pill and the invite action
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff at 375 px. **Tags:** Step 1
- **Expected:** Each card (3B) shows the link-status pill and its action (Print slip, Resend, Open) without sideways scroll.
- **Don't assert:** card order.

## R. Copy consistency

#### TC-04-R1: Every join error matches the copy of record exactly
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (various fixture states). **Tags:** Step 1
- **Expected:** The seven error strings exactly as in REQ-004 Copy of record, with `{lot}` filled (e.g. "Blk 4 Lot 12"), each telling the person what to do next.
- **Don't assert:** punctuation styling (curly vs straight apostrophes) unless the BA fixes it.

#### TC-04-R2: Directory and detail buttons use only the labels of record
**Priority** P2 · **Type** UI/UX (same word everywhere) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Gap G-20
- **Expected:** "Invite", "Invite selected", "Resend invitation", "Invite another person", "Print invite slips", "Print slip", "Remove". The mock-up's "Resend" and "Manage" are G-20.
- **Don't assert:** until G-20 is answered for "Resend" / "Manage".

#### TC-04-R3: The same pill words appear on the table, phone cards, filter chips and household detail
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** "Not invited", "Invited · expires {date}", "Linked · {n} person/people", "Invite expired", "Email failed", identical in every place.
- **Don't assert:** date format inside the pill (G-8: 3A shows "Dec 5" without year).

#### TC-04-R4: "Linked · 1 person" and "Linked · 2 people" use the right number word
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** Singular at 1, plural at 2 and above.
- **Don't assert:** —

#### TC-04-R5: Code entry, confirm and wrong-lot texts match the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Expected:** "Enter your invite code", its hint, "You're joining {lot} ({owner name}). Is this your lot?", "Yes, link my account", "No, this isn't my lot", "Please contact the admin office to get the right invitation."
- **Don't assert:** —

#### TC-04-R6: The HOA name follows the brand in email, slip and screens
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff on each brand. **Tags:** Step 1 and 2
- **Expected:** "Greenfield Homes HOA" on one brand, "Gentri Heights HOA" on the other, in the subject, body and slip; never the other brand's name.
- **Don't assert:** logos.

## S. Back-compat and data integrity

#### TC-04-S1: A household created before invitations existed shows "Not invited"
**Priority** P1 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 · Staging note: HH-LEGACY written without `linkStatus` and `memberCount`
- **Expected:** "Not invited" pill; the "Not invited" filter includes it; never blank, "undefined" or "Linked · 0 people".
- **Don't assert:** —

#### TC-04-S2: Inviting a legacy household works and fills in its link fields
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · Provisional — SA-001 Draft
- **Action:** Print a slip for HH-LEGACY; a fixture account redeems.
- **Expected:** "Invited", then "Linked · 1 person"; `linkStatus` and `memberCount` now present and correct.
- **Don't assert:** —

#### TC-04-S3: A freshly imported household shows "Not invited" and can be invited
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (REQ-003 regression)
- **Expected:** After a fixture import, the household shows "Not invited" and "Print slip" / "Invite" are offered.
- **Don't assert:** import details (TC-03).

#### TC-04-S4: Member count always equals the number of memberships
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** QE runs a sequence. **Tags:** Provisional — SA-001 Draft
- **Action:** Invite, redeem, invite another, redeem, remove one, re-entry, double remove on HH-A; check after each step.
- **Expected:** `memberCount` = count of `members` for HH-A after every step.
- **Don't assert:** —

#### TC-04-S5: Link status always agrees with the invitations and memberships
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** QE runs the S4 sequence plus expiry and failure. **Tags:** Provisional — SA-001 Draft · Gap G-2, G-3, G-9
- **Expected:** Linked whenever ≥ 1 member; otherwise Invited / Invite expired / Email failed from the newest active invitation; Not invited when none.
- **Don't assert:** cells governed by G-2, G-3, G-9 until answered.

#### TC-04-S6: There is never more than one active invitation per household and recipient
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** QE data check after blocks A–N. **Tags:** Provisional — SA-001 Draft
- **Expected:** For every (household, recipient) at most one `active` invitation.
- **Don't assert:** —

#### TC-04-S7: Every used invitation has exactly one matching membership, and every membership one invitation
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** QE data check. **Tags:** Provisional — SA-001 Draft
- **Expected:** Each `used` invite's `usedBy` + household matches a membership whose `inviteId` is that invite, unless the member was removed (then a `member.removed` entry exists); no membership without an invite.
- **Don't assert:** —

#### TC-04-S8: Every lifecycle action writes exactly one audit entry of the right kind
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** QE data check. **Tags:** Provisional — SA-001 Draft
- **Expected:** One `invite.created` per created, one `invite.replaced` per replacement, one `invite.cancelled` per cancellation, one `invite.redeemed` per redeem (not per re-entry), one `member.removed` per removal (not per "already removed").
- **Don't assert:** entries outside the fixture households.

#### TC-04-S9: Zero members and "never linked" read differently
**Priority** P2 · **Type** Boundary (zero vs not set) · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · Gap G-9
- **Setup:** HH-LEGACY (field missing) and HH-A after its last member is removed (`memberCount` 0).
- **Expected:** Neither shows "Linked · 0 people"; HH-LEGACY shows "Not invited"; HH-A shows the G-9 answer.
- **Don't assert:** HH-A's pill until G-9 is answered.

#### TC-04-S10: Directory header counts and filter chips add up
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Lane:** exclusive — asserts the directory-wide counts ("{n} households · {l} linked · {i} invited · {x} not invited" and filter chips)
**Role:** Admin office staff. **Tags:** Step 1 · Gap G-3
- **Expected:** Counts equal the household documents by link status; linked + invited + not invited = total active households (how expired and failed are counted in the header is G-3).
- **Don't assert:** absolute numbers.

## X. Exploratory charters

#### TC-04-X1: 20 minutes breaking the join flow on a phone
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 2
- **Charter:** Explore `/join#code` across email-and-password, create account, Google; links opened from Gmail and other in-app browsers, a second tab, airplane mode at each step, app switch during the Google popup, rotate the phone. Look for lost codes, double links, data shown before linking. Time-box 20 min; note every path tried.

#### TC-04-X2: 20 minutes trying to link to a lot you don't own
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER with devtools. **Tags:** Step 1
- **Charter:** Tamper with fragments, replay `checkInvite` / `redeemInvite` responses, change ids in requests, use a removed owner's code, race "No" and "Yes", try lots of near-miss codes. Time-box 20 min.

#### TC-04-X3: 15 minutes looking for directory status drift
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff in two tabs plus a homeowner. **Tags:** Step 1 and 2
- **Charter:** Invite, resend, print, redeem, remove, deactivate and reactivate in random orders; compare pills, 4E, filter chips and data after each. Time-box 15 min.

#### TC-04-X4: 15 minutes reading and typing codes from a printed slip
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner with a printed slip. **Tags:** Step 1
- **Charter:** Print, cut, photograph and type codes on a phone; note look-alike characters still in the alphabet (5/S, 8/B, 2/Z) and whether errors help. Time-box 15 min.

---

## Cases that hinge on open decisions or Draft architecture

| Open item | Who decides | Cases |
|---|---|---|
| Decision 2 (approved: 7 / 30 days, settings) — settings screen, limits, effect on existing invitations not specified | BA (G-7), treasurer | E11, E12, E13, E14, E15 |
| Decision 3 (approved for step 2: bounces) — needs the provider's bounce events; provider not chosen (SA-001 Q7) | Owner (provider) | G12, G13, G14 |
| Decision 4 (approved: refuse a second lot in R1; revisit with D3) | Owner, D3 later | J7, J8, J9, J10, D9 (already-linked part) |
| Decision 5 (open: privacy after a sale) | Owner with the HOA's DPO, before the payments REQ | L1–L6 |
| People per household limit | HOA board | J18 |
| How the office learns of sales | Admin office | No case can prove a process; K15, K16 document that nothing removes the old owner automatically |
| Email provider and sending domain (SA-001 Q7) | Owner | Every Step 2 case (all of G, H; P2–P5, P9, P16; B5, B6, B9; J1, J2, J3, J4; N1, N2, N4, N6, N8) |
| **SA-001 Draft** (function names, fields, keyed hash, attempt window, audit codes, allow-list, bounce events) | Owner (`APPROVED — FINAL`) | Every case tagged Provisional — SA-001 Draft: A1, A4–A7, A9, B3–B10, C6, C8, D3, D13, D14, D16, E11, E13, E15, F4, F6, F9, F10, G1, G5, G9, G12–G16, H4, J1, J4, J9, J14, J17, K6, K8, M2–M13, M15, M17, N1, N4, N5, N8, P7, S2, S4–S8 |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | Lifecycle transitions | 9 | 4 |
| B | Code generation, storage, secrecy | 11 | 6 |
| C | Code entry, confirm, redeem | 15 | 7 |
| D | Wrong-code limit | 17 | 7 |
| E | Expiry | 16 | 6 |
| F | Single use, redeem concurrency | 11 | 8 |
| G | Emailed invitations (Step 2) | 19 | 8 |
| H | Bulk invite (Step 2) | 12 | 5 |
| I | Printed slips | 14 | 8 |
| J | Second person, already linked, deactivated, limits | 18 | 8 |
| K | Remove after a sale | 17 | 11 |
| L | Privacy after a sale (blocked, decision 5) | 6 | 2 |
| M | Roles, rules, data leaks | 17 | 12 |
| N | Staff concurrency, stale screens | 8 | 3 |
| P | Navigation, deep links | 16 | 6 |
| Q | Usability, WCAG 2.2 AA, 375 px | 13 | 0 |
| R | Copy consistency | 6 | 0 |
| S | Back-compat, data integrity | 10 | 5 |
| X | Exploratory charters | 4 | 0 |
| **Total** | | **239** | **106** |

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | Is an expired, unused invitation an "unused invitation"? If yes, "Invite selected" skips "Invite expired" households forever; mock-up 3A offers "Resend" on them | A3, H5 |
| G-2 | Which pill wins when a linked household also has a pending, failed or expired invitation for another person | J1, S5 |
| G-3 | "Expired" is never stored, but `linkStatus` is: how and when does a household turn "Invite expired" (read-time derivation or a job), and how header counts treat expired and failed | E6, S10 |
| G-4 | Print copy says "Any earlier unused code for these households will stop working", but one active invitation is per household **and recipient**: does printing kill the email invitation and a second person's invitation? | I8, I9 |
| G-5 | `cancelInvite` has no button, no copy and no named caller; which message a cancelled code gives (deactivated, removed, cancelled) | A5, K4, J16 |
| G-6 | "The activity log records who removed her": the log screen is backlog story 06 (R1), not specified; in TC-04 provable at data level only | K6 |
| G-7 | Expiry settings: does a change affect existing invitations (data design implies no, REQ doesn't say)? Min, max, 0? Who edits (treasurer per Data changes vs REQ-002's admin "non-financial Settings")? No settings screen in the mock-up | E11–E15 |
| G-8 | Manila wording: the email body, pill and slip say "expires {date}" with no "end of day, Manila time"; 3A shows "Dec 5" without year | E10, R3 |
| G-9 | What the directory shows after the last member is removed (Not invited? a new state?), and whether 4E lists removed people | K7, S9 |
| G-10 | No copy of record for "already removed" (Sol Arch's `removeMember` behaviour) | K8 |
| G-11 | "The person who used a code enters it again → dashboard" conflicts with removal: a removed owner re-entering her old code must be refused; with which message? | K11 |
| G-12 | Linked households have no unused invitation, so "Invite selected" (and Print) would invite the same owner again. Should Linked households be skipped? | H7, I10 |
| G-13 | Bulk copy at m = 0, n = 1, n = 0; and whether {n} counts households that will be skipped | H6, H8, I14 |
| G-14 | "Each household shows its email status": no defined display for queued vs sent; 4E shows "Sent Nov 28" | G8, H10 |
| G-15 | Resend while the earlier mail is still queued (paced sending): is the stale mail withdrawn, or sent with a dead code? | G17 |
| G-16 | Contact email edited after an invitation: the old invitation to the old address is a different slot, so two active invitations could exist. Should Resend replace it? | G18 |
| G-17 | Relation for the first "Invite" (default Owner?) and the choices in "Invite another person" (SA-001 lists tenant, which R1 excludes) | J6 |
| G-18 | Which name "People with portal access" shows (account name or owner on file), the main safeguard for a lost slip; and whether replaced and cancelled invitations are listed in 4E | C7, J3 |
| G-19 | A linked member entering another unused code for the **same** household: consumed? message? | J12 |
| G-20 | Copy mismatches between mock-up and copy of record: 3A "Resend" and "Manage"; 4F buttons "Send 380 invitations" and "Print 20 slips"; 4A's extra footer ("You got this email because…"); Remove confirm "She will" (Gherkin) vs "They will" (copy); 4E pill words "Used Nov 29" and "Sent" not in the pill list | G3, H12, K1, R2 |
| G-21 | Step 1 UI: what Invite, Invite selected and Resend do before the email provider exists | G19 |
| G-22 | Empty or malformed codes (wrong length, O/I/0/1): message, and whether they count towards the limit | C13, C14 |
| G-23 | Does a successful link reset the wrong-code count? Confirm refusals while locked don't extend the window | D6, D15 |
| G-24 | Message precedence when several apply (locked vs already linked; expired + replaced; expired + deactivated) | A3, G7 |
| G-25 | No copy of record for a network or server error during check or redeem | H11, X1 |
| G-26 | How quickly a removed member's open screen changes (REQ-002 says "within a minute" for staff; REQ-004 says nothing) | K3 |
| G-27 | What linked members of a deactivated household see (REQ-003 defers to REQ-004; REQ-004 is silent); whether Remove works from the Inactive list | Table 1 row 6 |
| G-28 | After a sale the new owner's confirm screen shows the owner name on file, which is the **previous owner** unless the office edits it first. Should the procedure or the screen handle this? | K14 |
| G-29 | Removing the old owner leaves her family members linked; confirm this is the intended sale procedure | K15 |
| G-30 | After "No, this isn't my lot": is the code cleared, and is there a way back to code entry? | C10, P8 |
| G-31 | The person who used a code re-entering it after its expiry date: dashboard or "expired"? | F11 |
| G-32 | Two staff printing the same households at once: one PDF holds dead codes and nothing warns the office | N3 |
| G-33 | "Invite", "Resend invitation", "Print slip" and the print confirm are not listed as disabled in flight (only "Yes, link my account", "Invite selected" and "Remove" are); a double Resend queues two emails, one useless | I12, N1 |
