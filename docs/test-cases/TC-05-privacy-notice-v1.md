# TC-05: Privacy notice and acknowledgement (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature (privacy notice gate after sign-in, acknowledgement per person and per version, re-shown on a material change, read-any-time view, staff "read / not read yet" status, developer publish script) |
| Source | [REQ-005 Privacy notice and acknowledgement](../requirements/REQ-005-privacy-notice.md), **Approved** 2026-11-28 (r4, "Approve all as shown"), Option A worded as an acknowledgement, Sol Arch's changes applied in r3 |
| Depends on / precedent | [REQ-001 Sign in](../requirements/REQ-001-sign-in.md) (sign-in page, account menu, "Enter your invite code", "What's your name?", `users/{uid}` create-if-missing, sign-out, verification banner, deep links), [REQ-002 Roles](../requirements/REQ-002-roles-and-permissions.md) (staff dashboards, guard holding page, treasurer-who-is-a-homeowner switch, L-004), [REQ-003 Household directory](../requirements/REQ-003-household-directory.md) and [REQ-004 Invite and link](../requirements/REQ-004-invite-and-link.md) (household detail "People with portal access", where the "read / not read yet" status appears), [REQ-006 Activity log](../requirements/REQ-006-activity-log.md) (`privacy.published` entry, Privacy filter) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (**Open**: no viewport meta, so the phone layout never applies on a real phone; the notice page and its sticky footer are phone-first, see TC-05-Q1, Q2). No defect is open in this area (it has no code yet) |
| App version | **Anticipated.** No application code exists; `main` at `9ace525` holds the single-file mock-up only (`index.html`, `gentri-heights/index.html`), which has no privacy notice. The approved UX is screens 5A–5D of [req-005-011-mockup.html](../mockups/req-005-011-mockup.html). Screen 5E is Option B, not approved, not planned |
| Source files / functions touched (anticipated) | Web app gate route between sign-in and the first page (REQ-001 router), the notice page, account menu item, sign-in page footer link, household detail member row (REQ-004 4E); Firestore rules for `users/{uid}` (new `privacyAck` update; treasurer read), `config/privacy`, `privacyNotices/{seq}` (public read, no client write); developer publish script (batch: version, pointer, `auditLog` `privacy.published`); `lit-html` rendering of `sections[]` (CS-10) |
| Architecture | SA-001 r3 **Final** (approved 2026-11-28) §4.2 (`users`), §8.2 (privacy, RA 10173), §8.3 (App Check); LEARNINGS L-003 (prod confirmation), L-004. The collection and field names `config/privacy {currentSeq, lastMaterialSeq}`, `privacyNotices/{seq}`, `users/{uid}.privacyAck {seq, label, at}` come from **Sol Arch's REQ-005 review**, not yet folded into SA-001 (RELEASE-PLAN follow-ups). Cases that assert them are tagged **Provisional — design** |
| Environment | **Firebase Emulator Suite (Auth, Firestore) or `hoa-portal-staging` only. Never production.** Staging and emulator use placeholder notice text from the staging text file (the DPO's text does not exist yet). The one case about the publish script's production prompt (H6) uses an emulator project id ending in `-prod`; it never touches a real project. Both brands (Greenfield Homes HOA, Gentri Heights HOA) |
| Author / date | QA, 2026-11-28 |
| Status | **Approved** by the owner, 2026-11-28 ("Approve, send gaps"). Ready for QE triage. Cases tied to the G-n gaps wait for the BA's answers. Layers are left for QE (`TBD — QE`). Cases tagged Gap G-n wait for the BA's answer; their expected result must not be automated until then |

**Tags used on cases**

- **Provisional — design**: asserts a name or shape from Sol Arch's REQ-005 review that is not yet in SA-001 Final.
- **Gap G-n**: expected result depends on a requirement gap (listed at the end). The case stays in the plan; QE must not automate an expected result marked as a gap until the BA answers.
- **Blocked — DPO**: depends on the DPO's text or decision; staging uses placeholder text.
- **Staging note**: the scenario needs special set-up (controllable server clock, publishing a version mid-case with the script, two devices or sessions at once, admin SDK / console access, a blocked network).

**One behaviour per case.** Each case checks one kind of behaviour: a rule (what the security rules accept), a stored outcome, a gate decision, or what the screen shows. Rule cases name no screen wording; screen cases do not re-prove the rule.

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Homeowner** (linked member) | Sees the notice at first sign-in and after a material change; ticks, continues or presses "I don't agree"; reads it any time from the account menu. Writes only their own `privacyAck` |
| **Not-linked account** (no role, no household) | Same gate as a homeowner; after "Continue" lands on "Enter your invite code" |
| **Admin office staff** (`admin`) | Same gate before the staff dashboard. Reads every person's "read / not read yet" status on household detail |
| **Treasurer** (`treasurer`) | Same gate. Reads the status on household detail (new: the treasurer may now read `users/{uid}`, a rules change to REQ-001). Reads the `privacy.published` entry in the activity log |
| **Board** (`board`) | Same gate. No directory access, so never sees anyone's status. Reads the activity log |
| **Guard** (`guard`) | Same gate before the guard holding page. Never sees anyone's status |
| **Signed-out visitor** | Reads the current notice from the sign-in page link. Reads nothing else |
| **Developer** (script, not an app role) | Publishes versions on the DPO's written request (decision 3) |

### Test fixtures (invented; QE maps them to `.env`)

| Fixture | Lot | Notes |
|---|---|---|
| **HH-A** "ZZ Test Household A" | Blk 4 Lot 12 | Stands in for Juan's lot |
| **HH-B** "ZZ Test Household B" | Blk 2 Lot 7 | Stands in for Ana's lot |
| **HH-C** "ZZ Test Household C" | Blk 2 Lot 10 | The treasurer's own lot |

| Account | Who | Starting state |
|---|---|---|
| U-JUAN | ZZ Juan Dela Cruz, member of HH-A, zz.owner.a@example.test | No `privacyAck` |
| U-ANA | ZZ Ana Reyes, member of HH-B | No `privacyAck` |
| U-MARIA | ZZ Maria Santos, member of HH-B | Acknowledged the current version |
| U-NEW | ZZ New Account, no household, no role | Just created; `users/{uid}` exists, no `privacyAck` |
| U-NOREC | ZZ No Record, no household | Auth account with **no** `users/{uid}` document (REQ-001 create-if-missing path) |
| U-LEGACY | ZZ Legacy Member, member of HH-A | Created in S1 before REQ-005 shipped: `users/{uid}` has `name`, `email`, `createdAt` only |
| S-TREAS | ZZ Treasurer T1, `treasurer` and member of HH-C | No `privacyAck` |
| S-TREAS-2 | ZZ Treasurer T2, `treasurer` only | Acknowledged |
| S-ADMIN | ZZ Admin S1, `admin` | Acknowledged |
| S-BOARD | ZZ Board D1, `board` | Acknowledged |
| S-GUARD | ZZ Guard G1, `guard` | No `privacyAck` |
| S-EXTREAS | ZZ Removed Treasurer, role removed, ID token still valid (L-004) | — |

| Notice versions (published with the script into the emulator/staging) | `seq` | `label` | `material` | Effective |
|---|---|---|---|---|
| N1 | 1 | 1 | yes (first) | Dec 1, 2026 |
| N1.1 | 2 | 1.1 | no (minor correction) | Dec 1, 2026 |
| N2 | 3 | 2 | yes, with 3 "What changed" bullets | Jan 1, 2027 |
| N-XSS | test-only seq | 9.9 | no | A section paragraph containing `<img src=x onerror=alert(1)>` and `<b>bold</b>` as plain text |

"Today" in every case is built from **local Manila today** in the test, not hard-coded; the dates (Dec 1, 2026 and so on) show the arithmetic and are reproduced with a controllable server clock (Staging note). Fixture names are invented and carry the ZZ prefix; no real homeowner appears.

### Round-trip register

Developer publishes → every person reads and acknowledges → staff read the status. One row per field or status value.

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | `privacyNotices/{seq}.sections[]` (headings, paragraphs) | Publish script, developer | Gate page (every signed-in role), account menu "Privacy notice" (every signed-in role), sign-in page link (signed-out visitor) | A1, D1, D6, M9 |
| 2 | `label` ("1.1") | Publish script | Sub-heading "Version {n} · effective {date}" on the gate and account menu view; directory row "Privacy notice v{n} read {date}" (admin, treasurer); activity log entry (REQ-006) | A3, D2, E1, H8 |
| 3 | `effectiveDate` | Publish script | Sub-heading "effective {date}" on the gate, account menu view and signed-out view | A3, D2, F6 |
| 4 | `material` | Publish script (raises `lastMaterialSeq` when true) | Gate decision (shown again or not); heading "We've updated our privacy notice"; activity log "(material change)" | B1, B4, H8 |
| 5 | `whatChanged[]` | Publish script, from the DPO's bullets | "What changed" above the full text on the gate after a material change. On the account menu view and for a first-time reader: **Gap G-6** | B2, B9 |
| 6 | `publishedBy`, `dpoRequestRef`, `publishedAt` | Publish script | **Deliberately not shown** on any notice screen. `dpoRequestRef` and the developer appear in the activity log entry (REQ-006 `requestRef`, actor "Developer {name}") | H7, H8 |
| 7 | `config/privacy.currentSeq` | Publish script, same batch as the version | Which version the gate, account menu and sign-in link load; the rule that refuses an acknowledgement of any other version | A1, C2, G1 |
| 8 | `config/privacy.lastMaterialSeq` | Publish script (material change only) | Gate decision: shown when `privacyAck` is missing or `privacyAck.seq < lastMaterialSeq` | B1, B4, B5 |
| 9 | `users/{uid}.privacyAck.seq` and `.label` | The person, pressing "Continue" | Gate decision on every open (the person); account menu "You read this on {date}" (the person); household detail row "Privacy notice v{label} read {date}" (admin office, treasurer) | A5, E1, C6 |
| 10 | `users/{uid}.privacyAck.at` (server time) | The person's write; rules force `request.time` | Directory row date (admin, treasurer); account menu "You read this on {date}" (the person) | A6, C4, F1, F2 |
| 11 | No `privacyAck` (never acknowledged) | Nobody | Gate shows the notice (the person); directory row "Privacy notice not read yet" (admin, treasurer) | A1, E2 |
| 12 | "I don't agree" pressed | Nothing is written (no acknowledgement, no refusal record) | The person: "You've been signed out. To ask about how your data is used, contact the admin office at {office contact}." The directory keeps showing "not read yet" or the previous version. **Deliberately** no record of the refusal (REQ-005 scenario) | A9, A10, E2 |
| 13 | `auditLog` `privacy.published` (seq, label, material) | Publish script, same batch | Activity log, Privacy filter: "Developer published privacy notice version 2 (material change)" (board, treasurer, admin office; REQ-006) | H7, H8 |

No read-back cell is empty.

### Gate decision: status enumeration

Rule under test: the gate shows the notice "when `privacyAck` is missing or `privacyAck.seq < lastMaterialSeq`", and the acknowledgement is accepted only when `privacyAck.seq == config/privacy.currentSeq` and `at == request.time`. One row per prior state of the person's acknowledgement; one column per event. **Refused** cells are cases too.

| Prior `privacyAck` ↓ / event → | Sign in / open the portal | Press Continue (names current seq) | Write naming an older seq | Write naming a higher seq | Minor correction published | Material change published | Account menu view | Directory row |
|---|---|---|---|---|---|---|---|---|
| **Missing** (never acknowledged) | Gate shown, heading "Privacy notice" (A1) | Accepted, lands on next page (A5) | **Refused** (C2) | **Refused** (C3) | Gate still shown, now the new label (B6) | Gate still shown; heading **Gap G-5** (B9) | Current version, no "You read this on" (D3) | "not read yet" (E2) |
| **seq == currentSeq** (up to date) | No gate (A7) | Accepted again; `at` may move: **Gap G-8** (C8) | **Refused** (C2) | **Refused** (C3) | No gate (B3) | Gate shown, "We've updated…" (B1) | "You read this on {date}" (D2) | "v{n} read {date}" (E1) |
| **currentSeq > seq ≥ lastMaterialSeq** (behind by a minor correction only) | No gate (B3) | Accepted (records the new seq) (C9) | **Refused** (C2) | **Refused** (C3) | No gate (B3) | Gate shown (B1) | New label shown; "You read this on" wording **Gap G-3** (D4) | Which version is named: **Gap G-4** (E3) |
| **seq < lastMaterialSeq** (behind a material change) | Gate shown, "We've updated…" with What changed (B1, B2) | Accepted, gate gone (B4) | **Refused** (C2) | **Refused** (C3) | Gate still shown, new label; which What changed **Gap G-6** (B8) | Gate still shown, newest version (B8) | Current version; "You read this on" **Gap G-3** (D4) | "not read yet" or "v1 read": **Gap G-4** (E4) |
| **seq > currentSeq** (data in an impossible shape: pointer rolled back by hand) | Treated as up to date, no crash (S4) | Accepted for current seq (S4) | **Refused** | **Refused** | n/a | Gate if below lastMaterialSeq | No crash (S4) | No crash (S4) |

**Acknowledgement write: field enumeration** (all **Refused** unless stated; C-block)

| Write by the person to `users/{own uid}` | Expected |
|---|---|
| Only `privacyAck {seq: currentSeq, label, at: request.time}` | **Allowed** (C1) |
| `privacyAck` plus `name` (or `email`, `createdAt`, `role`, `staffRole`) | Refused (C5) |
| `privacyAck.at` = phone clock, 2 minutes behind or ahead | Refused (C4) |
| `privacyAck.seq` = currentSeq − 1, or currentSeq + 1, or a string "3" | Refused (C2, C3, C7) |
| `privacyAck.label` not matching the version's label (e.g. "99") with the right seq | **Gap G-2**: rules don't check the label, and the directory shows it (C6) |
| Missing `privacyAck.seq` or `.at`; extra keys inside `privacyAck` | Refused / **Gap G-2** (C7) |
| `privacyAck` on another person's `users/{uid}` | Refused (C10) |
| Deleting `privacyAck` (to be asked again, or to erase the record) | Refused (C11) |
| `privacyAck` when `users/{uid}` doesn't exist yet | **Gap G-1** (create vs update; REQ-001 r4 allows create only) (C12) |

---

## Test plan

### 1. Smoke

The standing smoke pass (`smoke.spec.js`) runs on the mock-up's role menus and has no notice. This change adds a page every role must pass through, which would block every existing smoke check once the gate ships. **Smoke additions for QE:**

1. The **gate page** opens after sign-in for an account with no acknowledgement (heading "Privacy notice", tick box, disabled "Continue", "I don't agree"; no page error), and "Continue" leads on to that role's first page.
2. **Account menu → "Privacy notice"** opens the current version for a signed-in person.
3. The **sign-in page "Privacy notice" link** opens the notice without signing in.
4. Smoke fixture accounts must hold a current acknowledgement (or pass the gate in a setup step), or every other smoke check stops at the gate. QE to decide how; flagged here because it touches the whole suite.

### 2. Acceptance

Every Gherkin scenario in REQ-005 maps to at least one case:

| REQ-005 scenario | Cases |
|---|---|
| A homeowner sees the notice at first sign-in | A1, A2, A4 |
| The acknowledgement is recorded | A5, A6, A7, A8, E1 |
| Pressing Continue twice records once | G1, G2, G3 |
| A material change asks again | B1, B2, B4 |
| A minor correction does not ask again | B3, D4 |
| A person who does not agree is signed out | A9, A10, A11 |
| Staff see the notice too | A12, A13, A14 |
| The notice can be read at any time | D1, D2, D6 |
| The notice fails to load | Q5, Q6, P9 |
| A person who has not read the notice yet, seen by staff | E2 |
| Only the server time is recorded | C1, C4, C2 |
| The notice changes while the page is open | G4, G5 |
| The treasurer sees who has read the notice | E1, M5 |

No acceptance criterion is without a case.

### 3. Regression

What else could break, and why:

- **Every signed-in route now passes through the gate.** REQ-001's landing rules (Enter your invite code, What's your name?, dashboard, the page asked for by a deep link, the guard holding page) and REQ-002's role router are all re-entered after "Continue". A gate bug either locks everyone out (a load error with no way past) or lets nobody past on a new version. Re-run TC-01's landing and deep-link cases and TC-02's menu-per-role cases with the gate in place.
- **`users/{uid}` rules change twice** (REQ-001 r4 made it create-only; REQ-005 adds an update of `privacyAck` and a treasurer read). TC-01's `users` rules cases and TC-02-B8 ("adding `role` or `staffRole` to `users/{own uid}` is refused") must be re-run: the new update clause must not open any other field. TC-02's rules matrix needs two new rows (treasurer reads `users` → allowed; board, guard read `users` → refused).
- **First public Firestore reads** (`config/privacy`, `privacyNotices`). A rules mistake that widens public read to `config/*` would expose `config/settings` and `config/payment` (REQ-007) to signed-out visitors. M-block re-checks every neighbouring `config` document.
- **Household detail (REQ-004 4E, TC-04)** gains a status line per person. Re-run TC-04's 4E cases (People with portal access, Remove) at 375 px.
- **Sign-out (REQ-001)**: "I don't agree" signs out; the shared-phone and back-forward cache cases in TC-01 apply to it.
- **Activity log (REQ-006, TC-06)**: `privacy.published` is the first entry written by a script rather than a callable; TC-06's Privacy filter and sentence cases depend on it.
- **Important announcement pop-up (REQ-017, S3; mock-up NAV-05)**: a pop-up on sign-in could cover the notice or appear before it (failure pattern: a modal mid-flow).
- **Open defect DEF-001**: the notice page and sticky footer are phone-first; Q1, Q2 must pass on the `mobile` project.

**Existing specs and screens QE should re-run:** `tests/specs/ui/smoke.spec.js` (all SMK-*; see smoke item 4), `tests/specs/ui/navigation.spec.js` NAV-01, NAV-02, NAV-04 (reload keeps the screen), NAV-05 (announcement pop-up on load), NAV-06 (Escape), NAV-07 / NAV-08 (375 px, DEF-001); TC-01 landing, deep-link, sign-out and `users` rules cases; TC-02 B8 and the rules matrix; TC-04 4E cases.

**Not affected:** billing, payments, settings, bookings, vehicles, guest passes and the guard's scan flow beyond the one-time gate. No financial figure is read or written by this feature.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "You read this on {date}" after a minor correction; "no acknowledgement is recorded"; "his account and his household's records are unchanged"; "anyone can open without signing in" | D4, A10, A11, D6 |
| A value written for one role, never shown back | Yes: `privacyAck.label` and `.at` (directory, account menu), `dpoRequestRef` (activity log), `whatChanged` | Register rows 2, 5, 6, 9, 10; E1, H8 |
| Status-gated rule checked for one transition only | Yes: the gate and the write rule | Status enumeration; B-block, C-block |
| Same concept, different word on another screen | Yes: "Privacy notice" never "privacy policy" or "consent"; "v{n}" vs "Version {n}" | R1, R2 |
| Dates computed in UTC where the user means local | Yes: acknowledgement date near Manila midnight; effective date shown on a laptop in another zone | F1, F2, F3, F6 |
| A derived figure doesn't refresh after a related write | Yes: the gate decision and the directory row after an acknowledgement or a new version | E5, B10 |
| Zero and "not set" look the same | Yes: no `privacyAck` vs an old one; no `config/privacy` (nothing published) vs a load error | E2, E4, S2, S3 |
| A write silently refused by security rules | Yes: a stale-version save must say why, not just stay on the page | G4, C-block (explicit refusal asserted) |
| Double-tap / two devices create duplicates | Yes: Continue twice, two devices | G2, G3, G6 |
| Stale reference | Yes: version published while the page is open; while signed in elsewhere | G4, G5, B11 |
| Backdrop click loses work or leaves stale state | Not a modal (full page). Back button from the gate: P5 | P5 |
| A modal appearing mid-flow blocks the next action | Yes: important announcement pop-up at sign-in | P10 |
| Assumed SDK/network behaviour baked into a case | Yes: offline detection and a queued offline write | Q7, Q8 (assumptions marked) |
| Data leaking across households or roles | Yes: public reads must stop at the notice; `users` read by treasurer only among new roles | M-block |

### Scenario list by mandatory type

- **Negative**: acknowledgement naming a stale, future or malformed version; phone clock; extra fields; another person's record; deleting the record; Continue unticked; publish script with a wrong confirmation; client write to `privacyNotices` or `config/privacy`; signed-out reads of anything but the notice; board and guard reading `users`. C-block, A2, H4, H6, M-block.
- **Boundary**: first version vs later; minor vs material; two versions skipped; acknowledgement at 11:59 PM and 12:00 AM Manila; effective date shown across zones; effective date in the future; nothing published yet; `seq` 9 vs 10 compared as numbers, not strings. B5, B8, F1–F6, S2, S5.
- **Usability**: 16 px text, real headings, tick box 44 × 44 px with visible label, hint not colour alone, focus on heading, sticky footer at 375 px, no forced scroll, Saving…, loading skeleton, error and offline lines, keyboard only. Q-block.
- **Navigation**: gate before each role's first page; deep link kept through the gate; refresh and Back on the gate; account menu and sign-in link and back; after "I don't agree"; the treasurer switch; homeowner can't reach staff status. P-block.

---

## A. First sign-in, acknowledge, decline

#### TC-05-A1: An account with no acknowledgement sees the notice before any other signed-in page
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** N1 published; U-JUAN has no `privacyAck`.
- **Action:** Sign in with email and password.
- **Expected:** The first signed-in page is headed "Privacy notice", with the full N1 text. No dashboard, Dues & Payments or "Enter your invite code" content is shown before it.
- **Don't assert:** the notice text itself (placeholder; Blocked — DPO).

#### TC-05-A2: "Continue" is disabled until the box is ticked
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** U-JUAN on the gate page.
- **Action:** Press "Continue" without ticking; then tick; then untick.
- **Expected:** Unticked: "Continue" is disabled and pressing it records nothing; the hint "Tick the box to continue" is shown. Ticked: "Continue" is enabled and the hint is gone. Unticked again: disabled again.
- **Don't assert:** the disabled styling.

#### TC-05-A3: The sub-heading shows the version label and the effective date
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** N1 current.
- **Action:** Open the gate.
- **Expected:** "Version 1 · effective Dec 1, 2026".
- **Don't assert:** placement on the page.

#### TC-05-A4: The tick box carries the copy of record
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Action:** Read the gate's controls.
- **Expected:** Tick box "I have read and understood the privacy notice"; primary "Continue"; secondary "I don't agree". The word "agree" appears only on the decline button (decision 2: acknowledgement, not consent).
- **Don't assert:** button order.

#### TC-05-A5: Ticking and pressing Continue stores an acknowledgement of the current version
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Provisional — design
- **Setup:** N1 current (`currentSeq` 1).
- **Action:** Tick, press "Continue"; read `users/{U-JUAN}`.
- **Expected:** `privacyAck` = `{seq: 1, label: "1", at: <server time>}`; no other field of the document changed.
- **Don't assert:** the exact timestamp.

#### TC-05-A6: The stored date is Manila's date of the acknowledgement
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN); Admin office reads. **Tags:** Staging note: controllable server clock
- **Setup:** Server time Dec 1, 2026, 10:00 AM Manila.
- **Action:** U-JUAN acknowledges; S-ADMIN opens HH-A household detail.
- **Expected:** U-JUAN's row reads "Privacy notice v1 read Dec 1, 2026".
- **Don't assert:** time of day (not shown).

#### TC-05-A7: After acknowledging, the next sign-in skips the notice
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** U-JUAN acknowledged N1.
- **Action:** Sign out; sign in again.
- **Expected:** He lands on his dashboard with no notice page in between.
- **Don't assert:** dashboard content.

#### TC-05-A8: "Continue" lands a linked homeowner on the dashboard and a not-linked account on "Enter your invite code"
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN) and not-linked account (U-NEW). **Tags:** —
- **Action:** Each acknowledges from the gate.
- **Expected:** U-JUAN lands on his dashboard; U-NEW lands on "Enter your invite code".
- **Don't assert:** any toast (none is specified).

#### TC-05-A9: "I don't agree" signs the person out and shows the office contact
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** Gap G-7
- **Action:** On the gate, press "I don't agree".
- **Expected:** He is signed out (a signed-in page opened by URL afterwards goes to sign-in) and sees "You've been signed out. To ask about how your data is used, contact the admin office at {office contact}." with the office contact filled in, never a blank or a placeholder token.
- **Don't assert:** the contact value (source undefined, G-7).

#### TC-05-A10: "I don't agree" records no acknowledgement
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** Provisional — design
- **Action:** Tick the box, then press "I don't agree"; read `users/{U-JUAN}`.
- **Expected:** No `privacyAck` field; the document is byte-for-byte unchanged.
- **Don't assert:** —

#### TC-05-A11: "I don't agree" leaves the account and the household's records unchanged
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** Staging note: admin SDK read
- **Setup:** Snapshot `users/{U-JUAN}`, `members/{HH-A}_{U-JUAN}`, `households/{HH-A}`.
- **Action:** Press "I don't agree"; re-read the snapshot documents and the Auth account.
- **Expected:** The Auth account still exists and is enabled; the member link, household and user documents are unchanged; no `auditLog` entry is written.
- **Don't assert:** `updatedAt` fields that the platform touches for unrelated reasons.

#### TC-05-A12: The treasurer sees the notice before the staff dashboard
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer (S-TREAS). **Tags:** —
- **Action:** Sign in.
- **Expected:** The gate is the first page; after "Continue" the treasurer dashboard opens.
- **Don't assert:** dashboard content.

#### TC-05-A13: Admin office and board accounts see the notice before their first page
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Admin office, Board (fresh accounts with no `privacyAck`). **Tags:** —
- **Action:** Each signs in.
- **Expected:** The gate is shown first; after "Continue" each lands on its own dashboard.
- **Don't assert:** menus (TC-02).

#### TC-05-A14: A guard sees the notice before the guard page
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Guard (S-GUARD). **Tags:** —
- **Action:** Sign in; acknowledge.
- **Expected:** The gate is shown first; after "Continue" the guard lands on its own first page (holding page or Scan Pass).
- **Don't assert:** guard screens' content.

#### TC-05-A15: A treasurer who is also a homeowner acknowledges once, for both views
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer and member of HH-C (S-TREAS). **Tags:** —
- **Action:** Acknowledge on sign-in; switch to "My household"; switch back.
- **Expected:** No second gate on either switch; one `privacyAck` on her `users` record.
- **Don't assert:** the switch control (TC-02).

#### TC-05-A16: Signing in again after "I don't agree" shows the notice again
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** U-JUAN pressed "I don't agree".
- **Action:** Sign in again.
- **Expected:** The gate is shown again, box unticked.
- **Don't assert:** —

## B. New versions: material change and minor correction

#### TC-05-B1: After a material change, a person who acknowledged the previous version sees "We've updated our privacy notice"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Staging note: publish N2 with the script mid-case
- **Setup:** U-JUAN acknowledged N1 (seq 1). Publish N2 (material).
- **Action:** U-JUAN opens the portal.
- **Expected:** The gate is shown with heading "We've updated our privacy notice" before any other page; box unticked; "Continue" disabled.
- **Don't assert:** text body.

#### TC-05-B2: The material-change gate shows "What changed" above the full text
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** —
- **Setup:** As B1.
- **Expected:** "What changed" with N2's 3 bullets appears above the first section of the full text; the full text follows in the same page.
- **Don't assert:** bullet wording (Blocked — DPO).

#### TC-05-B3: After a minor correction, an up-to-date person is not asked again
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Staging note: publish N1.1
- **Setup:** U-JUAN acknowledged N1. Publish N1.1 (minor).
- **Action:** U-JUAN opens the portal.
- **Expected:** He lands on his dashboard with no gate.
- **Don't assert:** —

#### TC-05-B4: Acknowledging the material change clears the gate
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Provisional — design
- **Setup:** As B1.
- **Action:** Tick, Continue; sign out and in.
- **Expected:** `privacyAck.seq` = 3, label "2"; no gate on the next sign-in.
- **Don't assert:** —

#### TC-05-B5: Versions compare as numbers: seq 10 is newer than seq 9
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Provisional — design
- **Setup:** Emulator: `currentSeq` 10, `lastMaterialSeq` 10, labels "9" and "10"; U-JUAN's `privacyAck.seq` = 9.
- **Action:** Open the portal.
- **Expected:** The gate is shown (9 < 10). With `privacyAck.seq` = 10 instead: no gate. (Guards against string comparison, where "10" < "9".)
- **Don't assert:** —

#### TC-05-B6: A person who never acknowledged sees the corrected version after a minor correction
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA). **Tags:** —
- **Setup:** U-ANA has no `privacyAck`; N1.1 published.
- **Action:** Open the portal.
- **Expected:** Gate shown with "Version 1.1"; acknowledging stores seq 2.
- **Don't assert:** heading wording.

#### TC-05-B7: A person behind only by a minor correction can still be asked to acknowledge after the next material change
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-MARIA). **Tags:** —
- **Setup:** U-MARIA acknowledged N1 (seq 1); N1.1 (minor) then N2 (material) published.
- **Action:** Open the portal.
- **Expected:** Gate shown for version 2.
- **Don't assert:** —

#### TC-05-B8: A person who skipped several versions sees only the newest, once
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Gap G-6
- **Setup:** U-JUAN at seq 1; publish N2 (material) and then a minor 2.1.
- **Action:** Open the portal; acknowledge.
- **Expected:** One gate, for label 2.1 (the current version); acknowledging stores the current seq; no second gate follows. Which "What changed" bullets show (N2's, 2.1's, or both): G-6.
- **Don't assert:** the bullets shown.

#### TC-05-B9: A first-time reader when a later material version is current
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Not-linked account (U-NEW). **Tags:** Gap G-5
- **Setup:** N2 current; U-NEW has no `privacyAck`.
- **Action:** Sign in.
- **Expected:** Gate shown for version 2. Heading ("Privacy notice" or "We've updated…") and whether "What changed" shows: G-5.
- **Don't assert:** the heading until G-5 is answered.

#### TC-05-B10: Staff see the directory row change after a person acknowledges a material change
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN) acknowledges; Admin office reads. **Tags:** —
- **Setup:** As B4.
- **Action:** S-ADMIN reopens HH-A household detail after U-JUAN acknowledges version 2.
- **Expected:** "Privacy notice v2 read {Manila date of the acknowledgement}".
- **Don't assert:** whether an already-open detail page updates without a reload (not specified).

#### TC-05-B11: A person already signed in when a material change is published
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA). **Tags:** Gap G-9 · Staging note: publish mid-session
- **Setup:** U-MARIA signed in on her dashboard, up to date; publish N2 (material).
- **Action:** She navigates to Dues & Payments; then reloads.
- **Expected:** At the latest after the reload (next open of the portal), the gate is shown before any page. Whether navigation inside the open session triggers it: G-9.
- **Don't assert:** behaviour before the reload.

## C. Acknowledgement rules (the person's own write)

#### TC-05-C1: An acknowledgement naming the current version with server time is accepted
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN), direct write. **Tags:** Provisional — design
- **Action:** Update `users/{U-JUAN}` setting only `privacyAck {seq: currentSeq, label, at: serverTimestamp()}`.
- **Expected:** Allowed.
- **Don't assert:** —

#### TC-05-C2: An acknowledgement naming an older version is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN), direct write. **Tags:** Provisional — design
- **Setup:** `currentSeq` 2.
- **Action:** Write `privacyAck.seq` = 1.
- **Expected:** Refused explicitly (permission error); the document re-read with rules disabled is unchanged.
- **Don't assert:** error text.

#### TC-05-C3: An acknowledgement naming a version not yet published is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN), direct write. **Tags:** Provisional — design
- **Action:** Write `privacyAck.seq` = currentSeq + 1.
- **Expected:** Refused explicitly; unchanged.
- **Don't assert:** —

#### TC-05-C4: An acknowledgement carrying the phone's clock instead of server time is refused
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN), direct write. **Tags:** Provisional — design
- **Action:** Write `privacyAck.at` as a client timestamp 2 minutes behind; repeat 2 minutes ahead.
- **Expected:** Both refused explicitly.
- **Don't assert:** —

#### TC-05-C5: An acknowledgement that also changes another field is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN), direct write. **Tags:** Provisional — design
- **Action:** Four writes, each `privacyAck` (valid) plus one of `name`, `email`, `role`, `staffRole`.
- **Expected:** All four refused explicitly; the document is unchanged; the next staff-only read by U-JUAN is still refused.
- **Don't assert:** —

#### TC-05-C6: An acknowledgement with a label that doesn't match its version
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN), direct write; Admin office reads. **Tags:** Gap G-2
- **Action:** Write `privacyAck {seq: currentSeq, label: "99", at: request.time}`; S-ADMIN opens HH-A detail.
- **Expected (recommended, G-2):** either the write is refused, or the directory shows the label of `privacyNotices/{seq}`, never "v99".
- **Don't assert:** which of the two until G-2 is answered.

#### TC-05-C7: A malformed acknowledgement is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN), direct write. **Tags:** Provisional — design · Gap G-2
- **Action:** Writes with `seq` as the string "2"; with `seq` missing; with `at` missing; with `privacyAck` as a string.
- **Expected:** All refused explicitly. (Extra keys inside `privacyAck`: G-2.)
- **Don't assert:** —

#### TC-05-C8: Acknowledging the same version again
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-MARIA), direct write. **Tags:** Gap G-8
- **Setup:** U-MARIA acknowledged the current version on Dec 1.
- **Action:** On Dec 5, write a new valid acknowledgement of the same version.
- **Expected:** Exactly one `privacyAck` remains. Whether the date moves to Dec 5 (the rule allows it) or the first date stands: G-8.
- **Don't assert:** the stored date until G-8.

#### TC-05-C9: A person behind by a minor correction can acknowledge the current version
**Priority** P3 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-MARIA), from the account menu view. **Tags:** Gap G-3
- **Setup:** U-MARIA at seq 1; N1.1 current.
- **Action:** Write a valid acknowledgement of seq 2.
- **Expected:** Allowed; seq 2 stored. Whether the account menu view offers a way to do this: G-3.
- **Don't assert:** any control on the account menu view.

#### TC-05-C10: A person cannot write an acknowledgement on another person's record
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN), direct write. **Tags:** —
- **Action:** Write a valid `privacyAck` on `users/{U-ANA}`.
- **Expected:** Refused explicitly; U-ANA's record unchanged.
- **Don't assert:** —

#### TC-05-C11: A person cannot delete their acknowledgement
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-MARIA), direct write. **Tags:** Provisional — design
- **Action:** Update removing `privacyAck` (field delete); then delete `users/{own uid}`.
- **Expected:** Both refused explicitly.
- **Don't assert:** —

#### TC-05-C12: An account with no person record acknowledges the notice
**Priority** P2 · **Type** Back-compat · **Layer** TBD — QE · **Writes** Yes
**Role:** Account with no `users` document (U-NOREC). **Tags:** Gap G-1 · Gap G-10
- **Action:** Sign in; reach the gate; acknowledge.
- **Expected:** The acknowledgement is stored and the person ends up with exactly one `users` record holding `name`, `email`, `createdAt` and `privacyAck`. Whether "What's your name?" comes before or after the gate (G-10), and whether the rules allow a create that includes `privacyAck` or require create then update (G-1): open.
- **Don't assert:** page order; write sequence.

## D. Reading the notice at any time

#### TC-05-D1: The account menu opens the current notice
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA). **Tags:** —
- **Action:** Account menu → "Privacy notice".
- **Expected:** The current version's full text with "Version {label} · effective {date}".
- **Don't assert:** text body.

#### TC-05-D2: The account menu view says when the person read it
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA). **Tags:** —
- **Setup:** U-MARIA acknowledged the current version on Dec 1, 2026 (Manila).
- **Expected:** "You read this on Dec 1, 2026."
- **Don't assert:** —

#### TC-05-D3: The account menu view for someone who never acknowledged
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner with no `privacyAck` who skipped the gate (see M10). **Tags:** —
- **Expected:** The notice shows; no "You read this on" line, and never "You read this on" with an empty or invalid date.
- **Don't assert:** any replacement line (none specified).

#### TC-05-D4: After a minor correction the account menu shows the new version
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** Gap G-3
- **Setup:** U-JUAN acknowledged N1; N1.1 published.
- **Expected:** "Version 1.1" is shown. The "You read this on {date}" line must not claim he read 1.1 when he read 1: wording G-3.
- **Don't assert:** the read line until G-3.

#### TC-05-D5: Staff and the guard can open the notice from their account menu
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer, Admin office, Board, Guard. **Tags:** —
- **Expected:** "Privacy notice" is in each account menu and opens the current version.
- **Don't assert:** —

#### TC-05-D6: The sign-in page link opens the notice without signing in
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Signed-out visitor. **Tags:** —
- **Action:** On the sign-in page, press "Privacy notice".
- **Expected:** The current version opens with label and effective date; no sign-in is asked; no "You read this on" line and no tick box.
- **Don't assert:** whether it opens in place or in a new view.

#### TC-05-D7: The signed-out view shows the current version after a new one is published
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Signed-out visitor. **Tags:** Staging note: publish mid-case
- **Action:** Publish N1.1; reload the signed-out view.
- **Expected:** "Version 1.1".
- **Don't assert:** —

## E. Staff see who has read the notice

#### TC-05-E1: The admin office sees "Privacy notice v1 read Dec 1, 2026" on the person's row
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Admin office (S-ADMIN). **Tags:** —
- **Setup:** U-JUAN acknowledged N1 on Dec 1, 2026.
- **Action:** Open Blk 4 Lot 12 (HH-A) household detail.
- **Expected:** U-JUAN's row under "People with portal access" reads "Privacy notice v1 read Dec 1, 2026".
- **Don't assert:** row layout.

#### TC-05-E2: A person who has not acknowledged shows "Privacy notice not read yet"
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Admin office (S-ADMIN). **Tags:** —
- **Setup:** U-ANA linked to HH-B with no `privacyAck`.
- **Expected:** Her row reads "Privacy notice not read yet".
- **Don't assert:** colour or badge.

#### TC-05-E3: The row for a person behind only by a minor correction
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Admin office. **Tags:** Gap G-4
- **Setup:** U-JUAN at seq 1; N1.1 current.
- **Expected (recommended):** "Privacy notice v1 read Dec 1, 2026", never "not read yet" (he isn't asked again). Rule: G-4.
- **Don't assert:** until G-4.

#### TC-05-E4: The row for a person behind a material change
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Admin office. **Tags:** Gap G-4
- **Setup:** U-JUAN at seq 1; N2 (material) current; he hasn't signed in since.
- **Expected:** The row is distinguishable from an up-to-date person (REQ-005: "has not acknowledged the current version" → "not read yet"). Whether it reads "not read yet" or "v1 read Dec 1, 2026": G-4.
- **Don't assert:** wording until G-4.

#### TC-05-E5: The row changes after the person acknowledges
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA) then Admin office. **Tags:** —
- **Action:** U-ANA acknowledges; S-ADMIN opens (or reloads) HH-B detail.
- **Expected:** "not read yet" becomes "Privacy notice v{n} read {today}".
- **Don't assert:** live update of an open page.

#### TC-05-E6: Two people on one lot each show their own status
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Admin office. **Tags:** —
- **Setup:** HH-B has U-ANA (not read) and U-MARIA (read Dec 1).
- **Expected:** Each row shows its own line; neither is copied to the other (the record is per person, not per household).
- **Don't assert:** row order.

#### TC-05-E7: The status line on a 375 px phone
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Admin office on a phone. **Tags:** DEF-001
- **Expected:** "Privacy notice v1 read Dec 1, 2026" wraps inside the person's card without horizontal scroll or truncation.
- **Don't assert:** line breaks.

## F. Dates and time zone

#### TC-05-F1: An acknowledgement at 11:59 PM Manila is dated that day
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA); Admin office reads. **Tags:** Staging note: controllable server clock, server in UTC
- **Setup:** Server time Dec 1, 2026 23:59:30 Manila (15:59:30 UTC).
- **Action:** Acknowledge; read HH-B detail.
- **Expected:** "read Dec 1, 2026".
- **Don't assert:** —

#### TC-05-F2: An acknowledgement at 12:00 AM Manila is dated the new day, though UTC is still the day before
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA); Admin office reads. **Tags:** Staging note: controllable server clock
- **Setup:** Server time Dec 2, 2026 00:00:30 Manila (Dec 1 16:00:30 UTC).
- **Expected:** "read Dec 2, 2026".
- **Don't assert:** —

#### TC-05-F3: Staff on a laptop in another time zone see the Manila date
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Admin office, browser time zone America/Los_Angeles. **Tags:** —
- **Setup:** As F2.
- **Expected:** "read Dec 2, 2026" (not Dec 1).
- **Don't assert:** —

#### TC-05-F4: "You read this on" uses the Manila date
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA), browser zone UTC. **Tags:** —
- **Setup:** As F2.
- **Expected:** "You read this on Dec 2, 2026."
- **Don't assert:** —

#### TC-05-F5: A phone with a wrong clock still records the server's date
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA), device clock set to Jan 15, 2027. **Tags:** —
- **Action:** Acknowledge through the app on Dec 1, 2026 (server).
- **Expected:** The directory shows "read Dec 1, 2026".
- **Don't assert:** —

#### TC-05-F6: The effective date is shown as the same calendar date in every time zone
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, browser zones Asia/Manila and America/Los_Angeles. **Tags:** —
- **Expected:** Both show "effective Dec 1, 2026" (never Nov 30, 2026).
- **Don't assert:** —

#### TC-05-F7: A version whose effective date is in the future
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-JUAN). **Tags:** Gap G-11
- **Setup:** On Dec 20, 2026 publish N2 (effective Jan 1, 2027, material).
- **Expected:** Whether the gate shows N2 at once or from Jan 1: G-11. Either way the sub-heading reads "effective Jan 1, 2027".
- **Don't assert:** timing of the gate until G-11.

## G. Double tap, two devices and a stale version

#### TC-05-G1: "Continue" reads "Saving…" and is disabled while the save is in flight
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA). **Tags:** Staging note: slowed network
- **Action:** Tick, press "Continue" with the network throttled.
- **Expected:** The button reads "Saving…" and is disabled until the save finishes.
- **Don't assert:** spinner.

#### TC-05-G2: Pressing "Continue" twice quickly records one acknowledgement
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA). **Tags:** —
- **Action:** Double-tap "Continue".
- **Expected:** One `privacyAck` field; the person lands on the next page once (no double navigation, no error).
- **Don't assert:** number of network requests.

#### TC-05-G3: Acknowledging on two devices at once leaves one acknowledgement
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA) on a phone and a laptop. **Tags:** Staging note: two sessions at once
- **Action:** Press "Continue" on both within a second.
- **Expected:** One `privacyAck` of the current seq; both devices reach the next page; neither shows an error.
- **Don't assert:** which device's time is stored.

#### TC-05-G4: A save refused because the version changed reloads the new version and says why
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Staging note: publish N1.1 while the gate is open
- **Setup:** U-JUAN on the gate for N1, box ticked. Publish N1.1.
- **Action:** Press "Continue".
- **Expected:** He stays on the gate; it now shows "Version 1.1" with the box unticked and "The privacy notice was just updated. Please read it again before continuing."
- **Don't assert:** reload mechanism.

#### TC-05-G5: No acknowledgement of the old version is stored when the version changed mid-page
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-JUAN). **Tags:** Provisional — design
- **Setup / Action:** As G4; read `users/{U-JUAN}`.
- **Expected:** No `privacyAck` (or, if he had one, unchanged). After he ticks and continues on 1.1, `privacyAck.seq` = 2.
- **Don't assert:** —

#### TC-05-G6: Acknowledging on one device while the gate is open on another
**Priority** P3 · **Type** Stale reference · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA), phone and laptop. **Tags:** Staging note: two sessions
- **Action:** Acknowledge on the phone; later press "Continue" on the laptop's open gate.
- **Expected:** The laptop's save succeeds or is treated as done; one `privacyAck` remains; no error message.
- **Don't assert:** date stored (G-8).

## H. Publish script (developer, on the DPO's request)

#### TC-05-H1: Publishing a material version writes the version, both pointers and the audit entry together
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Developer (script). **Tags:** Provisional — design · Staging note: run the script against the emulator
- **Setup:** `currentSeq` 2, `lastMaterialSeq` 1.
- **Action:** Publish N2 (material) with a DPO request reference.
- **Expected:** `privacyNotices/3` exists with label "2", `material: true`, `whatChanged`, `sections`, `publishedBy`, `dpoRequestRef`, `publishedAt`; `config/privacy` = `{currentSeq: 3, lastMaterialSeq: 3}`; one `auditLog` `privacy.published` with seq 3, label "2", material yes.
- **Don't assert:** timestamps.

#### TC-05-H2: Publishing a minor correction raises only the current pointer
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Developer (script). **Tags:** Provisional — design
- **Setup:** `{currentSeq: 1, lastMaterialSeq: 1}`.
- **Action:** Publish N1.1 (minor).
- **Expected:** `{currentSeq: 2, lastMaterialSeq: 1}`; `privacyNotices/2` written; one `privacy.published` entry with material no.
- **Don't assert:** —

#### TC-05-H3: A publish that fails part-way writes nothing
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Developer (script). **Tags:** Provisional — design · Staging note: inject a failure (e.g. rules or a malformed field that fails the batch)
- **Action:** Run a publish whose batch fails.
- **Expected:** No new `privacyNotices` document, `config/privacy` unchanged, no `privacy.published` entry; the gate still shows the previous version.
- **Don't assert:** script's error text.

#### TC-05-H4: Old versions are never edited by a later publish
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Developer (script). **Tags:** Gap G-12
- **Setup:** Snapshot `privacyNotices/1`.
- **Action:** Publish N1.1 and N2; then try to publish with a `seq` that already exists.
- **Expected:** `privacyNotices/1` unchanged. Re-using an existing seq is refused by the script (recommended): G-12.
- **Don't assert:** the script's handling of a skipped seq number (G-12).

#### TC-05-H5: The script reads the text file named for the target project
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Developer (script). **Tags:** Staging note: two emulator project ids
- **Action:** Publish to the staging emulator id; then to a second id with no matching text file.
- **Expected:** The staging text is published to staging only; the second run stops without writing because its own file is missing, and never falls back to the staging file.
- **Don't assert:** file naming scheme.

#### TC-05-H6: Publishing to a "-prod" project asks for typed confirmation and stops on a wrong answer
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Developer (script). **Tags:** Staging note: emulator project id ending in `-prod`, never a real project
- **Action:** Run the script against `demo-hoa-test-prod`; answer the prompt with something other than the required confirmation; run again and give nothing (Enter).
- **Expected:** The script prints the target project id and asks for typed confirmation; on a wrong or empty answer nothing is written.
- **Don't assert:** exact prompt text.

#### TC-05-H7: The audit entry carries the developer and the DPO request reference, ids only
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Developer (script); data check. **Tags:** Provisional — design
- **Action:** After H1, read the `privacy.published` entry.
- **Expected:** `actorRole` developer, `actorName` set, `requestRef` = the DPO request reference, `targetType` privacy, `type` Privacy; no notice text or whatChanged copied into the entry.
- **Don't assert:** field order.

#### TC-05-H8: The activity log shows the publish under Privacy
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Board (S-BOARD). **Tags:** —
- **Action:** Activity log, type "Privacy".
- **Expected:** "Developer {name} published privacy notice version 2 (material change)" with its Manila date and time. (Sentence ownership: TC-06.)
- **Don't assert:** developer name.

#### TC-05-H9: Each acknowledgement is not written to the activity log
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA). **Tags:** —
- **Action:** Acknowledge; count `auditLog` entries before and after.
- **Expected:** No new entry (the `privacyAck` field is the record).
- **Lane:** exclusive — asserts the total `auditLog` count.

## M. Roles, rules and data leaks

#### TC-05-M1: A signed-out visitor can read the version pointer and the published notices
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Signed-out visitor. **Tags:** Provisional — design
- **Action:** Read `config/privacy` and `privacyNotices/{currentSeq}` with no auth.
- **Expected:** Allowed.
- **Don't assert:** —

#### TC-05-M2: A signed-out visitor cannot read any other config document
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Signed-out visitor. **Tags:** —
- **Action:** Read `config/settings`, `config/payment`, `config/billing`.
- **Expected:** All refused explicitly.
- **Don't assert:** —

#### TC-05-M3: A signed-out visitor cannot read users, households or the activity log
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Signed-out visitor. **Tags:** —
- **Action:** Read any `users/{uid}`, `households/{id}`, `auditLog` entry; list `users`.
- **Expected:** All refused explicitly.
- **Don't assert:** —

#### TC-05-M4: No account can write a notice or the version pointer from the browser
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer, Admin office, Homeowner, Signed-out. **Tags:** Provisional — design
- **Action:** Each tries to create `privacyNotices/99`, update `privacyNotices/1`, update `config/privacy`.
- **Expected:** All refused explicitly; documents unchanged.
- **Don't assert:** —

#### TC-05-M5: The treasurer can read a household member's person record
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer (S-TREAS-2). **Tags:** Provisional — design (REQ-001 rules change)
- **Action:** Read `users/{U-JUAN}`.
- **Expected:** Allowed (new in REQ-005).
- **Don't assert:** —

#### TC-05-M6: The admin office can still read person records
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Admin office. **Tags:** —
- **Expected:** Read of `users/{U-JUAN}` allowed.
- **Don't assert:** —

#### TC-05-M7: Board and guard cannot read person records
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Board (S-BOARD), Guard (S-GUARD). **Tags:** —
- **Action:** Read `users/{U-JUAN}`.
- **Expected:** Both refused explicitly.
- **Don't assert:** —

#### TC-05-M8: A homeowner cannot read another person's record, even in the same household
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA). **Tags:** —
- **Action:** Read `users/{U-MARIA}` (same HH-B) and `users/{U-JUAN}`.
- **Expected:** Both refused explicitly.
- **Don't assert:** —

#### TC-05-M9: Notice text that looks like HTML is shown as text, never run
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner; Signed-out visitor. **Tags:** Staging note: publish N-XSS on the emulator only
- **Action:** Open N-XSS on the gate and on the signed-out view.
- **Expected:** The characters `<img src=x onerror=alert(1)>` and `<b>bold</b>` appear literally; no image element is created and no script runs; no element in the notice area is set through `innerHTML` (CS-10).
- **Don't assert:** —

#### TC-05-M10: Skipping the gate in a modified browser reveals nothing beyond the person's own household
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA) with devtools. **Tags:** Accepted limitation (REQ-005)
- **Action:** Bypass the gate route on the client; read HH-B data; read HH-A data.
- **Expected:** HH-B reads succeed (accepted limitation); HH-A reads refused; her directory row still reads "Privacy notice not read yet".
- **Don't assert:** that the bypass is impossible (it is accepted).

#### TC-05-M11: A removed treasurer with a still-valid token cannot read person records
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** S-EXTREAS. **Tags:** L-004
- **Action:** Read `users/{U-JUAN}`.
- **Expected:** Refused explicitly.
- **Don't assert:** —

#### TC-05-M12: A homeowner never sees another person's acknowledgement status
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA). **Tags:** —
- **Action:** Look through every homeowner screen.
- **Expected:** No screen shows any person's "read / not read yet" line, including her household co-member's.
- **Don't assert:** —

## P. Navigation

#### TC-05-P1: A deep link opened before acknowledging leads through the gate to the page asked for
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA). **Tags:** Gap G-13
- **Action:** Signed out, open the Dues & Payments address; sign in; acknowledge.
- **Expected:** The gate comes before Dues & Payments. Whether "Continue" then opens Dues & Payments (REQ-001 deep-link rule) or the dashboard (REQ-005 wording): G-13.
- **Don't assert:** the landing page until G-13.

#### TC-05-P2: Reloading on the gate keeps the gate
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA). **Tags:** —
- **Action:** On the gate, tick the box, reload.
- **Expected:** Still on the gate; box unticked; nothing recorded.
- **Don't assert:** —

#### TC-05-P3: Typing another signed-in address while on the gate returns to the gate
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA); Treasurer (S-TREAS). **Tags:** —
- **Action:** On the gate, change the address to the dashboard, Settings, or Homeowners.
- **Expected:** The gate is shown again; no other page's content appears first.
- **Don't assert:** —

#### TC-05-P4: Back after "Continue" doesn't return to the gate
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA). **Tags:** —
- **Action:** Acknowledge; press browser Back.
- **Expected:** The gate isn't shown again (it isn't needed); Back goes to the sign-in history or stays on the page.
- **Don't assert:** exact history behaviour.

#### TC-05-P5: Back from the gate doesn't reach a signed-in page
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA). **Tags:** —
- **Action:** On the gate, press Back.
- **Expected:** Either the sign-in page or the gate again; never a dashboard.
- **Don't assert:** which of the two.

#### TC-05-P6: Back after "I don't agree" shows no signed-in data
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA) on a shared phone. **Tags:** —
- **Action:** "I don't agree", then Back (and forward).
- **Expected:** No household data or gate page from the old session is shown (REQ-001 back-forward cache rule applies).
- **Don't assert:** —

#### TC-05-P7: The account menu notice view has a way back
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-MARIA). **Tags:** —
- **Action:** Open the notice from the account menu; press Back (browser and any on-page back control).
- **Expected:** Returns to the page she came from; no tick box or "Continue" on this view.
- **Don't assert:** control name.

#### TC-05-P8: The signed-out view returns to sign-in
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Signed-out visitor. **Tags:** —
- **Expected:** Back (or the page's own control) returns to sign-in with any typed email kept or cleared consistently with REQ-001.
- **Don't assert:** typed email behaviour.

#### TC-05-P9: When the notice fails to load, no other page opens
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (U-ANA). **Tags:** Staging note: block reads of `privacyNotices`
- **Action:** Sign in with the notice read failing; then try the dashboard address.
- **Expected:** The error state is shown; the dashboard address returns to the error state; nothing else opens.
- **Don't assert:** —

#### TC-05-P10: An important announcement pop-up doesn't cover or precede the notice
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-ANA). **Tags:** Gap G-14 · Depends on REQ-017 (S3)
- **Setup:** An unacknowledged important announcement exists.
- **Action:** Sign in.
- **Expected:** The notice page is usable without first dismissing the pop-up (recommended: the pop-up waits until after "Continue"). Order: G-14.
- **Don't assert:** order until G-14.

## Q. Usability and accessibility (WCAG 2.2 AA, 375 px)

#### TC-05-Q1: At 375 px the tick box and "Continue" stay in a sticky footer within reach
**Priority** P1 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner on a phone. **Tags:** DEF-001
- **Action:** Open the gate at 375 × 812; scroll from top to bottom.
- **Expected:** The tick box and both buttons are visible at every scroll position; no horizontal scroll; the footer doesn't cover the last paragraph when scrolled to the end.
- **Don't assert:** pixel positions.

#### TC-05-Q2: The notice text is at least 16 px with real headings
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner on a phone. **Tags:** DEF-001
- **Expected:** Body text computes to ≥ 16 px; section headings are heading elements in order; the notice is text, not an image or PDF.
- **Don't assert:** fonts.

#### TC-05-Q3: The box can be ticked without scrolling to the end
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Action:** Tick the box immediately on arrival.
- **Expected:** Allowed; "Continue" enables (no forced scroll).
- **Don't assert:** —

#### TC-05-Q4: The tick box has a 44 × 44 px tap area and a visible label
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner on a phone. **Tags:** —
- **Expected:** Tapping the label text ticks the box; the target is at least 44 × 44 px; "Tick the box to continue" is text (not colour only).
- **Don't assert:** —

#### TC-05-Q5: The load error says what to do and offers "Try again"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: block the notice read
- **Expected:** "We couldn't load the privacy notice. Check your connection and try again." with "Try again"; "Continue" disabled.
- **Don't assert:** —

#### TC-05-Q6: "Try again" loads the notice once the read works
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Action:** Unblock the read; press "Try again".
- **Expected:** The notice shows; the box is unticked; no sign-in needed again.
- **Don't assert:** —

#### TC-05-Q7: Offline on the gate shows the offline line
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Assumption: offline is detected by the browser's online state; behaviour of a queued Firestore write is not asserted
- **Action:** Go offline on the gate.
- **Expected:** "You're offline. Connect to the internet to continue."
- **Don't assert:** detection mechanism.

#### TC-05-Q8: "Continue" pressed while offline doesn't leave "Saving…" forever
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner. **Tags:** Gap G-15 · Assumption: Firestore queues offline writes instead of failing (REQ-001 G-21)
- **Action:** Go offline; tick; press "Continue"; wait 20 seconds.
- **Expected:** The page leaves "Saving…" and tells the person what to do (REQ-001's 15-second give-up is the precedent; G-15). When back online, exactly one acknowledgement exists.
- **Don't assert:** the exact timeout until G-15.

#### TC-05-Q9: Focus starts on the page heading
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, keyboard and screen reader. **Tags:** —
- **Expected:** On arrival focus is on "Privacy notice" (or the updated heading); Tab reaches the box, then "Continue", then "I don't agree"; Space ticks the box; Enter on "Continue" saves.
- **Don't assert:** Tab order of links inside the notice text.

#### TC-05-Q10: The loading state shows skeleton lines, not an empty page or a flash of the dashboard
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: slowed network
- **Expected:** Skeleton lines while loading; "Continue" disabled; no dashboard content flashes.
- **Don't assert:** skeleton design.

#### TC-05-Q11: Contrast is at least 4.5:1 on text, hint and buttons
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Body, hint, disabled-state explanation and both buttons meet 4.5:1 (an automated contrast check plus a manual look at the disabled button).
- **Don't assert:** —

#### TC-05-Q12: The error and stale-version messages are announced
**Priority** P3 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner with a screen reader. **Tags:** —
- **Expected:** The load error, the offline line and "The privacy notice was just updated…" are in a live region or receive focus.
- **Don't assert:** which.

#### TC-05-Q13: The verification banner on the gate
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner with an unverified email. **Tags:** Gap G-16
- **Expected:** The banner (REQ-001 G-6) either shows on the gate without covering the sticky footer, or is absent there: G-16. Either way the tick box and buttons stay reachable at 375 px.
- **Don't assert:** presence until G-16.

## R. Copy consistency

#### TC-05-R1: "Privacy notice" is the only name used
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** All roles; signed-out. **Tags:** —
- **Expected:** The gate, account menu, sign-in link, signed-out view and directory row all say "Privacy notice"; "privacy policy", "data privacy consent" and "consent" appear nowhere.
- **Don't assert:** the DPO's own text (it may say "policy"; Blocked — DPO).

#### TC-05-R2: The version is written the same way everywhere
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, Admin office. **Tags:** —
- **Expected:** The sub-heading shows "Version {label}"; the directory row shows "v{label}" with the same label; dates are "Dec 1, 2026" in both.
- **Don't assert:** —

#### TC-05-R3: "I don't agree" is a plain secondary button, not a destructive one
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** —
- **Expected:** Styled as secondary (not red, not hidden), and pressing it opens no "are you sure" dialog.
- **Don't assert:** colour values.

## S. Back-compat and data integrity

#### TC-05-S1: An account created in S1 before the notice shipped is asked at its next sign-in
**Priority** P1 · **Type** Back-compat · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner (U-LEGACY). **Tags:** —
- **Setup:** `users/{U-LEGACY}` in the S1 shape (no `privacyAck`).
- **Action:** Sign in; acknowledge.
- **Expected:** Gate shown; acknowledgement stored; the S1 fields unchanged.
- **Don't assert:** —

#### TC-05-S2: Before any version is published, signing in doesn't crash
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, Treasurer. **Tags:** Gap G-17
- **Setup:** Emulator with no `config/privacy` and no `privacyNotices`.
- **Action:** Sign in.
- **Expected:** No unhandled error. Whether everyone is held at the load error (no way in) or let through: G-17. This is the first state of every new environment.
- **Don't assert:** the state shown until G-17.

#### TC-05-S3: "Not read yet" and "not published yet" are told apart on the directory row
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Admin office. **Tags:** Gap G-17
- **Setup:** As S2.
- **Expected:** The row doesn't claim "Privacy notice not read yet" in a way that blames the person for a notice that doesn't exist (G-17).
- **Don't assert:** wording.

#### TC-05-S4: An acknowledgement newer than the current pointer doesn't break the gate
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: data in an impossible shape (pointer lowered by console)
- **Setup:** `privacyAck.seq` 3; `config/privacy {currentSeq: 2, lastMaterialSeq: 1}`.
- **Expected:** No gate, no crash on the gate, account menu or directory row.
- **Don't assert:** wording on the account menu.

#### TC-05-S5: Every person record holds at most one acknowledgement with three keys
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** Data check after the A–G blocks. **Tags:** Provisional — design
- **Expected:** Every `privacyAck` has exactly `seq` (integer ≤ currentSeq), `label`, `at`; its label equals `privacyNotices/{seq}.label`.
- **Don't assert:** counts.

#### TC-05-S6: A load failure is reported to error monitoring
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner. **Tags:** Staging note: error monitoring access
- **Action:** Trigger the load error.
- **Expected:** One error-monitoring event per failed load, with no personal data (no email, no name).
- **Don't assert:** event format.

## X. Exploratory charters

#### TC-05-X1: 15 minutes trying to get past the gate without acknowledging
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner on a phone and a laptop. **Tags:** —
- **Charter:** Deep links, Back/Forward, two tabs, the role switch, notification links, the account menu, reloads during "Saving…", airplane mode at each step, a version published mid-session. Look for any signed-in page reached without an acknowledgement and any acknowledgement of a version not shown. Time-box 15 min.

#### TC-05-X2: 10 minutes reading the notice the way a homeowner would
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner at 375 px with a screen reader and with 200% zoom. **Tags:** —
- **Charter:** Read the whole notice and the "What changed" bullets; check headings, sticky footer overlap, zoom, landscape. Time-box 10 min.

---

## Cases that hinge on open decisions

| Open item | Who decides | Cases |
|---|---|---|
| Decision 2 (acknowledgement, not consent) and the lawful basis; the notice text and "What changed" bullets | DPO | Every case that reads the text body is written against placeholder text: A1, B2, D1, R1 (Blocked — DPO for the wording only) |
| Who the DPO is; whether storing data in Singapore must be stated | HOA board, DPO | None in this plan (text only) |
| Retention periods to state in the notice | DPO with the treasurer | None (text only) |
| REQ-017 important announcement pop-up (S3) | Already approved in S3; order vs the gate is G-14 | P10 |

## Coverage summary

| Block | Scope | Cases | P1 |
|---|---|---|---|
| A | First sign-in, acknowledge, decline | 16 | 10 |
| B | Material change and minor correction | 11 | 4 |
| C | Acknowledgement rules | 12 | 6 |
| D | Reading the notice at any time | 7 | 2 |
| E | Staff see who has read it | 7 | 2 |
| F | Dates and time zone | 7 | 2 |
| G | Double tap, two devices, stale version | 6 | 3 |
| H | Publish script | 9 | 4 |
| M | Roles, rules, data leaks | 12 | 8 |
| P | Navigation | 10 | 3 |
| Q | Usability, WCAG 2.2 AA, 375 px | 13 | 2 |
| R | Copy consistency | 3 | 0 |
| S | Back-compat, data integrity | 6 | 1 |
| X | Exploratory charters | 2 | 0 |
| **Total** | | **121** | **47** |

By stated type: happy path 22 · negative 13 · boundary 17 · security / role 17 · navigation 11 · concurrency / stale reference 5 · usability, UI/UX and responsive 17 · integration 6 · data integrity 8 · back-compat 3 · exploratory 2.

## Requirement gaps for the BA

| # | Gap | Where it bites |
|---|---|---|
| G-1 | REQ-001 r4 makes `users/{uid}` **create-only, no update in R1**, with allowed keys `name`, `email`, `createdAt`. REQ-005 adds `privacyAck` "to that closed list" as an **update**, and still lists `phone`, which REQ-001 r4 dropped. Which rule wins: an update clause for `privacyAck` only, or `privacyAck` allowed in the create? And what happens for an account whose `users` record is created by the create-if-missing path after the gate? | C1, C12, S1 |
| G-2 | The rule checks `privacyAck.seq` and `.at`, not `.label` or extra keys inside `privacyAck`. A person can store `label: "99"` against the current seq, and the directory shows the label. Should rules check the label against `privacyNotices/{seq}`, or should screens derive the label from `seq`? | C6, C7, S5 |
| G-3 | After a minor correction the account menu shows the new version and "You read this on {date}", which claims the person read text they didn't. Wording? And may a person acknowledge the newer minor version from there? | D4, C9 |
| G-4 | Directory row rule is undefined for a person behind a minor correction (v1 read, 1.1 current) and behind a material change (v1 read, 2 current). REQ-005 says "has not acknowledged the current version" → "not read yet", which would also hit the minor case | E3, E4 |
| G-5 | Heading and "What changed" for someone who never acknowledged anything when a later material version is current | B9 |
| G-6 | Which "What changed" bullets show when a person skipped several versions (material then minor), and whether "What changed" appears on the account menu view | B8, register row 5 |
| G-7 | Source of `{office contact}` in the "I don't agree" message after sign-out. `config/settings` is not readable signed out and `config/privacy` holds only pointers; per brand (Greenfield, Gentri Heights)? | A9 |
| G-8 | Re-acknowledging the same version is allowed by the rule and moves `privacyAck.at`. Should the first date stand (the record of when it was first shown and read)? | C8, G6 |
| G-9 | "When Juan next opens the portal": does a material change published during an open session take effect on the next navigation, or only on the next open or reload? | B11 |
| G-10 | Order of the gate and REQ-001's "What's your name?" page for a Google or create-if-missing account | C12 |
| G-11 | A version published with a future effective date: gate at once or from the effective date? | F7 |
| G-12 | Publish script: refuses an existing `seq`? Refuses a gap in `seq` (1 → 3)? Who checks that `label` grows? | H4 |
| G-13 | Deep link through the gate: REQ-001 returns to the page asked for; REQ-005 says Continue lands on the dashboard or "Enter your invite code" | P1 |
| G-14 | Order of the privacy gate and REQ-017's important-announcement pop-up at sign-in | P10 |
| G-15 | Offline "Continue": the write waits in memory; does REQ-001's 15-second give-up and "couldn't save" message apply here, and with what copy (none in REQ-005's copy of record)? | Q8 |
| G-16 | REQ-001's verification banner lists every signed-in page but not the notice page | Q13 |
| G-17 | What every role sees before any version is published (a new environment, staging before the publish script runs), and what the directory row says then | S2, S3 |

**No new failure pattern** beyond the owner's table was found.
