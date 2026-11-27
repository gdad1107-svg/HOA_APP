# TC-02: Roles and permissions enforced on the server (v1)

| | |
|---|---|
| Enhancement / fix | Enhancement: staff roles (admin office, treasurer, board, guard) and homeowner access, enforced by Firestore and Storage rules and by Cloud Functions, not only by hiding menus |
| Source | [REQ-002 Roles and permissions enforced on the server](../requirements/REQ-002-roles-and-permissions.md), r3, approved by the owner 2026-11-28 (Option B, removal "at once", D4 = treasurer only in R1) |
| Depends on | REQ-001 sign-in (TC-01). Cross-references REQ-003 household directory (TC-03) and REQ-004 invitations (TC-04) |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (open: phone drawer never shows on real phones; affects K7) |
| App version | **Anticipated.** No build exists. Planned against the requirement and against the mock-ups `index.html` / `gentri-heights/index.html` (`main` at `da89072`) |
| Source files / functions touched (anticipated, from SA-001 r2, **provisional: Draft**) | `firestore.rules`, `storage.rules` helpers `isStaff()`, `hasRole(r)`, `isMember(hh)`; Cloud Function module `setRole` plus the developer script that calls it; callables that re-check `staff/{uid}` (`decidePayment`, `voidReceipt`, household and invite functions); web app role router, menu (the mock-up's `NAV`, `index.html` line 546), role switch (the `.seg` control, line 554), no-access page, Settings → Staff |
| Architecture read | SA-001 §3, §4.2, §8.1, §8.3, §10 and ADR-004, both **Draft** on branch `docs/sa-001-architecture`. Every case that depends on them is marked **(provisional)** |
| Mock-up screens | [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html) screens 2A (menus per role), 2B (treasurer who is also a homeowner), 2C (no access, phone), 2D (Settings → Staff and roles, Option B) |
| Environment | Firebase Emulator Suite (local, `demo-` project id) and `hoa-portal-staging` only. **Never a `-prod` project.** The one case about the script's production guard (H8) uses an emulator project id that ends in `-prod`; it never touches a real project |
| Author / date | QA, 2026-11-28 |

---

## Roles and what crosses between them

### Test fixtures

Every case names one of these. QE maps them to `.env`. The names in REQ-002's Gherkin (Juan, Carmela Cruz, Paolo Aquino) are shown only so each case can be traced back to its scenario.

| Fixture | Access | Stands in for (REQ-002) |
|---|---|---|
| **ZZ Test Household A** | Lot "Blk 4 Lot 12" | Juan's lot |
| **ZZ Test Household B** | Lot "Blk 1 Lot 3" | the other household |
| **ZZ Test Household C** | Lot "Blk 2 Lot 10" | the treasurer's own lot |
| **ZZ Homeowner A1** | Member of Household A only, no staff role | Juan |
| **ZZ Homeowner B1** | Member of Household B only, no staff role | |
| **ZZ Treasurer T1** | `treasurer` role **and** member of Household C | Carmela Cruz |
| **ZZ Treasurer T2** | `treasurer` role only (second treasurer, for last-treasurer and downgrade cases) | |
| **ZZ Admin S1** | `admin` role only | Paolo Aquino |
| **ZZ Admin S2** | `admin` role **and** member of Household B | |
| **ZZ Board D1** | `board` role only | |
| **ZZ Board D2** | `board` role **and** member of Household A | |
| **ZZ Guard G1** | `guard` role only | |
| **ZZ No Role N1** | Signed in, no role, no household | |
| **ZZ Payment P-pending / P-approved / P-rejected / P-voided** | One payment per status, Household B *(provisional: payments are EPIC-003, no REQ yet)* | "a pending payment" |
| **Developer script runner** | The developer's own credentials, running the `setRole` script against the emulator or staging | "the developer" |
| **ZZ Board request REF-TEST-001** | A written-request reference string the script must cite | "the board president's written request" |

Emails use `@example.test`. No real homeowner's name, lot, phone number or photo appears anywhere.

### Round-trip register

One row per value that one party writes and another reads. *(provisional)* rows depend on SA-001 / ADR-004 (Draft).

| Value | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|
| Role claim `role` on the sign-in token *(provisional)* | `setRole`, run by the developer script | Rules on every staff request; the person's own menu, next time they open the portal | H4, B44–B48, I1 |
| `staff/{uid}.role` *(provisional)* | `setRole` only (no client writes) | Rules and callables (refuse at once when it no longer matches); the person's app listener (re-routes within a minute); Settings → Staff "Role" column, read by admin office staff and treasurer | H1, H2, I1, I3, I4 |
| `staff/{uid}.displayName` | `setRole` | Settings → Staff "Name" column | H1 |
| `staff/{uid}.grantedAt` | `setRole` | Settings → Staff "Since" column (mock-up 2D) | H1 |
| `staff/{uid}.grantedBy`, `.requestRef` | `setRole`, from the developer's identity and the cited board request | **Deliberately not shown in R1.** The activity log screen is backlog story 06. Read back on the emulator / in the console only | H2 |
| `auditLog` entry `role.set` (actor, target, before, after, requestRef, at) | `setRole` only | **Deliberately not shown in R1** (story 06; read by board and treasurer later). Read back on the emulator / in the console only | H3, I5, J6 |
| Mirror `users/{uid}.staffRole` | REQ-002's Data table says `setRole`; **Sol Arch's review replaces it with `staff/{uid}`** | REQ says Settings → Staff. **Conflict, see BA gap 1.** No case asserts this field until the BA settles it | — |
| Refresh-token revocation | `setRole`, on removal or downgrade only | Firebase Auth: the removed person's device is signed out when its token next refreshes | I6, I12, H4 (no revocation on grant) |
| "Only treasurer" refusal | `setRole` | The developer, in the script's output | J1 |
| Role-switch choice ("Treasurer" / "My household") | The dual-role person, on their device | The same person: which menu and pages show. **Where it is kept across a reload is not stated, see BA gap 13** | F1–F4, F11 |
| Payment status "Pending approval" *(provisional, EPIC-003)* | Homeowner creates it; only `decidePayment` (treasurer) moves it on | Homeowner: Dues & Payments. Treasurer: Approvals. A refused board / admin / homeowner request leaves it unchanged | C1–C10 |

### Status enumerations

**1. Role transitions run through `setRole`.** The rule "revoke tokens on removal or downgrade only, never on a grant" and "refuse to remove the last treasurer" are gated on the prior role, so every prior value is listed.

| Prior role → new role | Kind | Tokens revoked? | Last-treasurer guard applies? | Cases |
|---|---|---|---|---|
| none → admin / treasurer / board / guard | Grant | No | No | H1–H4, H13 |
| same role → same role | No-op | No | No | H10 |
| admin → treasurer | Upgrade (treasurer has everything admin has) | No | No | I13 |
| admin → none | Removal | Yes | No | I1–I8 |
| treasurer → admin | Downgrade | Yes | **Yes** | I10–I12, J3 |
| treasurer → board | Downgrade, or lateral? (board loses every write but gains nothing an admin lacks) | Expected yes | **Yes** | J3, **BA gap 3** |
| treasurer → none | Removal | Yes | **Yes** | J1, J2, J4, J5 |
| admin → board, board → admin, admin → guard, guard → admin | Lateral: each loses something (board has Accounting, admin has Homeowners) | **Not stated** | No | I14, **BA gap 3** |
| board → treasurer | Gains writes, loses nothing | Expected no | No | I13 (same expectations) |
| board → none, guard → none | Removal | Yes | No | I1 pattern; B-matrix rows for that role |

**2. Payment status, for "a refused action is refused by the server"** *(provisional: payment statuses come from the mock-up — `pending`, `approved`, rejected, plus receipt void from SA-001 — until the payments REQ names them).* Board, admin (D4), guard and homeowner are refused for **every** prior status, not only Pending: C2–C5 for board, C6–C8 for the other roles on Pending.

---

## Test plan

### 1. Smoke

The standing smoke pass (`smoke.spec.js` `SMK-owner-*`, `SMK-admin-*`, `SMK-guard-*`) is built on the mock-up's open role switch, which REQ-002 removes. For the real app, QE needs these additions:

- **One smoke sign-in per R1 role** (homeowner, admin office, treasurer, board), each checking that role's exact R1 menu (A1, A3, A5, A7).
- **The no-access page** (G1).
- **Settings → Staff and roles**, read-only (H15).
- **The role switch** for a dual-role person (F1).
- Guard smoke stays out of R1: guard menus ship with the R4 gate add-on.

`SMK-admin-nav` (11 screens) and `SMK-guard-nav` describe the mock-up, not R1. They stay valid for the mock-up only.

### 2. Acceptance

Every Gherkin scenario in REQ-002 has at least one case, unhappy paths included:

| REQ-002 scenario | Cases |
|---|---|
| Each role sees only its own menu (4 example rows) | A1–A8 (one per shown / hidden pair, plus the full R1 list per role) |
| A refused action is refused by the server, not only hidden | C1, plus C2–C9 (every prior status, every refused role) |
| A homeowner's device cannot read another household | D1–D3 |
| A board member sees figures but no controls that change them | E1, E2 (R1 Dashboard); E3–E5 (R2 Accounting, written now, run when Accounting ships: **BA gap 2**) |
| A treasurer who is also a homeowner switches views | F1–F4 |
| Opening a staff page without the role | G1–G5 |
| Granting a role | H1–H4 |
| Removing a role | I1–I4 |
| The last treasurer can't be removed | J1, J2 |
| UX/UI notes (skeleton, switch, no-access, drawer) and Sol Arch's conditions (script, audit, stale token, transaction) | K-block, H6–H9, B44–B48, J5 |

### 3. Regression

**Shared components this change touches**

- **The rules helpers** `isStaff()`, `hasRole()`, `isMember()` *(provisional)*. Every R1 collection's rules call them, and every later REQ adds collections to the same matrix. A mistake in one helper opens or closes every collection at once. Block B is the matrix; QE should re-run it whenever any rule changes.
- **The extra `get(staff/{uid})` read** on every staff request *(provisional)*. Combined with `exists(members/...)` checks, rules have a limit of 10 document reads per request. Watch any rule that already reads several documents (B-matrix rows on payments and bills).
- **The role router and menu.** Every screen's reachability depends on it (A-block, G-block).
- **The top-bar `.seg` control.** Today it is the open "Homeowner | Admin | Guard" switch; it becomes the dual-role switch (F-block, L1).
- **`users/{uid}`** is written by the person themself (REQ-001). Any role-like field on it is a privilege-escalation path (B8).

**Other features that read or write the same data**

- REQ-001 (TC-01): the "not linked" screen for a person with no role and no household. TC-02 checks only the rules behind it (B42, B43).
- REQ-003 (TC-03): "Only the office and the treasurer can change households" uses the same `hasRole` and the same no-access page (B30, G7, C12).
- REQ-004 (TC-04): `removeMember` makes a homeowner's removal immediate through `isMember` (D5). Invite functions re-check `staff/{uid}` (C13).
- EPIC-002 / EPIC-003 (no REQ yet): bills, payments, `decidePayment`, receipts. C- and D-block cases need fixture documents on the emulator until those REQs exist.

**Existing specs and screens QE should re-run or retire**

- `navigation.spec.js` **NAV-02** (role switch relabels the nav) and **NAV-04** (role survives a reload from browser storage) test the mock-up behaviour REQ-002 deliberately removes. In the real app they are replaced by F-block and L3.
- `navigation.spec.js` **NAV-07 / NAV-08**: the phone drawer that carries every role's menu. Still failing on DEF-001; K7 depends on it.
- `smoke.spec.js` all `SMK-*-nav` rows (see Smoke).
- Mock-up screens to compare against: `index.html` top bar (line 554), `NAV` (line 546), Approvals (line 739), Settings with "Reset demo data" (line 888), and the same lines in `gentri-heights/index.html` (+6).

**Known failure patterns that apply**

| Pattern | Where it bites here | Cases |
|---|---|---|
| A write silently refused by security rules | Every refused request must be asserted as a refusal (permission-denied), not "nothing changed" | All B and C rows, I15 |
| Copy promises what the code doesn't do | Settings → Staff stops listing a removed person while their token still works; "View only" on a board page that still has a working control | I1 vs I4, E1 vs E2 |
| A status-gated rule checked for one transition only | Board refusal on Pending only; revocation tested on removal only | Status enumerations 1 and 2, C2–C5, I10–I14 |
| Stale reference | A removed or downgraded person acting on an open page | I3, I7, I15 |
| Double-tap / two devices create duplicates | Two scripts removing the two treasurers at once; running the same grant twice | J5, H10 |
| Data leaking across households or roles | Homeowner reading another lot; guard reading balances; dual-role person's household view showing all households | B-matrix, D-block, F9, L2 |
| Same concept, different word on another screen | "Admin" (switch) vs "Admin office" (Settings → Staff, mock-up 2D) | A11, **BA gap 7** |
| A derived figure doesn't refresh after a related write | The menu after a role change | H4, I3, I11 |
| A modal appearing mid-flow blocks the next action | The important-announcement pop-up (mock-up `signInPopup`, line 573) opening when a dual-role person switches to "My household" | F12 |
| Assumed SDK / network behaviour baked into a case | Token lifetime (about one hour), `getIdToken(true)` refresh, listener behaviour offline: these are Firebase behaviours Sol Arch cited, not ours. Cases assert our outcomes (refused, page changes) with stated time limits from the REQ, and mark the Firebase assumption | I3, I6, I7 |
| Zero and "not set" look the same | A person with role `none` vs a person whose role failed to load: the skeleton must not settle on "no access" or on a homeowner menu | K1, K2 |

---

## Scenario list

All scenarios, before steps. Each states one behaviour.

- **Happy path:** each role signs in and sees its R1 menu (A1, A3, A5, A7); treasurer approves a pending payment (C10, control); granting a role (H1–H4); dual-role switch (F1–F4); second treasurer can be removed (J4).
- **Negative (mandatory):** every role refused every collection and action it shouldn't have (B-matrix, C1–C9, C11–C14); cross-household reads (D1–D3); direct URL without the role (G1, G6–G8); stale and mismatched tokens (B44–B48, I1, I2); script refusals (H6, H8, H11, H12, J1, J3); client attempts to grant itself a role (B7, B8, B16, B27).
- **Boundary (mandatory):** exactly one treasurer vs two (J1, J4); first treasurer created when there are none (H13); the "within a minute" limit for an open page (I3); a token still valid for most of its hour after removal (I1, B44); the moment between a role change and the token refresh (I13, B47, B48); one role per person (H14); a removal arriving while an action is mid-submit (I15); concurrent last-treasurer removals (J5). Not applicable: date and money edges (REQ-002 has no dates or amounts of its own; payment amounts belong to EPIC-003).
- **Usability (mandatory):** skeleton menu while roles load (K1, K2); no-access page on a phone, its heading, focus and way back (K3, K6, G3); role switch by keyboard and screen reader (K4, K5); refused-action messages say what to do (K10); contrast and reflow (K8, K11); Settings → Staff on a phone (K9).
- **Navigation (mandatory):** each role reaches its own pages and none of the others' (A-block, G-block); deep links and refresh on the no-access page (G5, G9, G10); back and "Go to my dashboard" (G3, G4); highlighted menu item (G11); after a role change the open page re-routes (I3); dual-role switch lands on the right dashboard (F2, F4).
- **Security / role:** B, C, D, E, I, J blocks.
- **Integration:** a role change updates rules, the menu and Settings → Staff alike (H1–H4, I1–I4).
- **Concurrency:** J5, I8, I15.
- **Back-compat:** L-block (mock-up behaviours that must be gone); an existing homeowner who later gets a staff role keeps household access (L8).
- **Responsive:** K3, K7, K9, F10.
- **UI/UX:** copy of record (G12, H15, H16, J1, E1, F1); consistent words (A11).
- **Data integrity:** one `staff` document per person (H10); audit entry per change, ids only (H3, I5); a refused decision consumes no receipt number (C14).
- **Exploratory:** M1–M3.

---

## A. Menus per role

Setup for the block: R1 build, emulator or staging, fixtures signed in fresh. **Don't assert** menu order beyond what is listed, icon art, or badge counts.

### TC-02-A1 Homeowner sees exactly the R1 homeowner menu
**Priority** P1 · **Type** Happy path / navigation · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1.
- **Action:** sign in.
- **Expected:** the menu shows Dashboard, Dues & Payments, Announcements, and nothing else.
- **Don't assert:** the dashboard's content.

### TC-02-A2 Homeowner's menu does not show Homeowners
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. Gherkin row "member of Blk 4 Lot 12 | Dues & Payments | Homeowners".
- **Expected:** "Dues & Payments" is shown; "Homeowners" is not, at desktop width and inside the phone drawer.

### TC-02-A3 Admin office staff see the R1 admin menu, without Approvals
**Priority** P1 · **Type** Happy path / security · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Admin S1.
- **Expected:** Dashboard, Homeowners, Announcements, Settings; **no Approvals**. *(D4-dependent: if the owner lets the admin office approve payments, Approvals appears.)*

### TC-02-A4 Admin's menu does not show Accounting
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Admin S1. Gherkin row "the admin role | Homeowners | Accounting".
- **Expected:** "Homeowners" shown, "Accounting" absent.

### TC-02-A5 Treasurer sees the R1 treasurer menu
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T2 (single role, so no switch interferes).
- **Expected:** Dashboard, Approvals, Homeowners, Announcements, Settings (mock-up 2A).

### TC-02-A6 Treasurer's menu does not show Scan Pass
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T2. Gherkin row "the treasurer role | Approvals | Scan Pass".
- **Expected:** "Approvals" shown, "Scan Pass" absent.

### TC-02-A7 Board member sees only Dashboard in R1
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Board D1.
- **Expected:** the menu shows Dashboard only (Reports and Accounting arrive in R2).

### TC-02-A8 Board member's menu does not show Homeowners
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Board D1. Gherkin row "the board role | Dashboard | Homeowners".
- **Expected:** "Homeowners" absent (matches REQ-003's board refusal).

### TC-02-A9 A guard-role account sees no household, money or staff pages in R1
**Priority** P2 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Guard G1 (R1 build, gate features not released).
- **Expected:** no Homeowners, Approvals, Dues & Payments, Accounting or Settings menu item. **What the guard does see in R1 is not stated (BA gap 5)**; until it is, assert only the absences.
- **R4 follow-up:** once the gate ships, the menu is Scan Pass, Visitors Inside, Today's Log.

### TC-02-A10 Menus for unreleased features appear for no role
**Priority** P2 · **Type** Negative / navigation · **Layer** TBD — QE · **Writes** No
- **Roles:** each of A1, S1, T2, D1, G1 in turn.
- **Expected:** none of Book Amenities, My Vehicles, Requests & Complaints, Guest Passes, Request a Report, Accounting, Collections & Notices, Report Requests, Visitor Log, Reports, Scan Pass appears in R1.

### TC-02-A11 Role names use the same word on every screen
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Roles:** ZZ Admin S2 and ZZ Treasurer T1.
- **Action:** compare the role word on the role switch, Settings → Staff "Role" column, the menu heading, and the no-access page.
- **Expected:** each role has one word everywhere. **Today the copy uses "Admin" (switch) and "Admin office" (mock-up 2D staff list): BA gap 7.**

---

## B. Server refusal matrix: every role × every R1 collection *(provisional: collection names from SA-001 §4.2 r2)*

**Shared setup:** emulator with all fixtures; each request is sent **directly from the role's signed-in client SDK** (or the rules test harness), never through a menu, because the point is that hiding is not protection.
**Shared expected for "Refused":** the request fails with a permission error **asserted explicitly**; the target document is unchanged when re-read by a privileged reader. "Nothing visibly changed" is not a pass.
**Shared expected for "Allowed":** the request succeeds and returns only the documents the role may see.
**Don't assert:** the exact error text from the SDK.

| Id | Role | Request | Expected | Priority | Type | Layer | Writes |
|---|---|---|---|---|---|---|---|
| TC-02-B1 | ZZ Homeowner A1 | Read Household A | Allowed | P1 | Security / happy | TBD — QE | No |
| TC-02-B2 | ZZ Homeowner A1 | Read Household B | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B3 | ZZ Homeowner A1 | List all households (no filter) | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B4 | ZZ Homeowner A1 | Read `members` of Household B | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B5 | ZZ Homeowner A1 | Read or list `staff` | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B6 | ZZ Homeowner A1 | Read `auditLog` | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B7 | ZZ Homeowner A1 | Create `staff/{own uid}` with `role: treasurer` | Refused; no `staff` document exists afterwards | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B8 | ZZ Homeowner A1 | Update `users/{own uid}` adding `role` or `staffRole` | Refused (closed field list); and even if a field were present, the next staff read is still refused | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B9 | ZZ Homeowner A1 | Read announcements | Allowed | P2 | Happy path | TBD — QE | No |
| TC-02-B10 | ZZ Homeowner A1 | Create an announcement | Refused | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B11 | ZZ Homeowner A1 | Write settings (any field) | Refused | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B12 | ZZ Homeowner A1 | Write `householdContacts` of Household A | Refused (households are function-only, REQ-003) | P2 | Security / negative | TBD — QE | Yes |
| TC-02-B13 | ZZ Admin S1 | List households | Allowed | P1 | Happy path | TBD — QE | No |
| TC-02-B14 | ZZ Admin S1 | Read `householdContacts` | Allowed | P2 | Happy path | TBD — QE | No |
| TC-02-B15 | ZZ Admin S1 | List `staff` (for Settings → Staff) | Allowed | P2 | Happy path | TBD — QE | No |
| TC-02-B16 | ZZ Admin S1 | Write `staff/{any uid}` | Refused (only `setRole` writes it) | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B17 | ZZ Admin S1 | Create an `auditLog` entry | Refused | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B18 | ZZ Admin S1 | Write a financial setting (dues amount, payment QR details) | Refused (treasurer only) | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B19 | ZZ Admin S1 | Write a non-financial setting | Allowed *(which fields count as non-financial in R1 is BA gap 12)* | P2 | Happy path | TBD — QE | Yes |
| TC-02-B20 | ZZ Admin S1 | Create an announcement | Allowed | P2 | Happy path | TBD — QE | Yes |
| TC-02-B21 | ZZ Admin S1 | Update a payment's `status` directly | Refused | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B22 | ZZ Admin S1 | Upload a payment QR image to Storage | Refused (dues and QR settings are treasurer only) | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B23 | ZZ Treasurer T2 | List households | Allowed (treasurer has everything admin has) | P1 | Happy path | TBD — QE | No |
| TC-02-B24 | ZZ Treasurer T2 | Write a financial setting | Allowed | P1 | Happy path | TBD — QE | Yes |
| TC-02-B25 | ZZ Treasurer T2 | Upload a payment QR image to Storage | Allowed | P2 | Happy path | TBD — QE | Yes |
| TC-02-B26 | ZZ Treasurer T2 | Update a payment's `status` directly, bypassing `decidePayment` | Refused | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B27 | ZZ Treasurer T2 | Write `staff/{own uid}` (e.g. change own role) | Refused | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B28 | ZZ Treasurer T2 | Write a receipt's number | Refused (no one can) | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B29 | ZZ Treasurer T2 | Read `auditLog` | Allowed | P3 | Happy path | TBD — QE | No |
| TC-02-B30 | ZZ Board D1 | List households | Refused (REQ-003; board directory access is an open board question, default deny) | P1 | Security / negative | TBD — QE | No |
| TC-02-B31 | ZZ Board D1 | Read `householdContacts` | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B32 | ZZ Board D1 | Read `auditLog` | Allowed | P3 | Happy path | TBD — QE | No |
| TC-02-B33 | ZZ Board D1 | Create an announcement | Refused (board is read-only) | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B34 | ZZ Board D1 | Write any setting | Refused | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B35 | ZZ Board D1 | Upload to any Storage path | Refused | P2 | Security / negative | TBD — QE | Yes |
| TC-02-B36 | ZZ Board D1 | Update a payment's `status` directly | Refused | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B37 | ZZ Guard G1 | Read or list households | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B38 | ZZ Guard G1 | Read bills or payments of any household | Refused (a guard never sees balances) | P1 | Security / negative | TBD — QE | No |
| TC-02-B39 | ZZ Guard G1 | Read `staff` or `auditLog` | Refused | P2 | Security / negative | TBD — QE | No |
| TC-02-B40 | ZZ Guard G1 | Create an announcement or write settings | Refused | P2 | Security / negative | TBD — QE | Yes |
| TC-02-B41 | ZZ Guard G1 | Read a payment proof in Storage | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B42 | ZZ No Role N1 | Read any household, bill or payment | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B43 | ZZ No Role N1 | Read `staff` | Refused | P2 | Security / negative | TBD — QE | No |
| TC-02-B44 | Stale token: ZZ Admin S1 after removal, token still carries `role: admin`, `staff/{uid}` deleted | List households | **Refused** (Sol Arch's added rules test) | P1 | Security / boundary | TBD — QE | No |
| TC-02-B45 | Stale token: ZZ Treasurer T2 after removal (with T1 still treasurer), claim still `treasurer` | Write a financial setting | **Refused** | P1 | Security / boundary | TBD — QE | Yes |
| TC-02-B46 | Claim missing, `staff/{uid}` says `treasurer` (a document without a claim) | Write a financial setting | Refused (both must match) | P1 | Security / negative | TBD — QE | Yes |
| TC-02-B47 | Claim `admin`, `staff/{uid}` says `treasurer` (upgrade before token refresh) | Write a financial setting | Refused until the token refreshes | P2 | Security / boundary | TBD — QE | Yes |
| TC-02-B48 | Claim `treasurer`, `staff/{uid}` says `admin` (downgrade before token refresh) | Write a financial setting | Refused at once | P1 | Security / boundary | TBD — QE | Yes |
| TC-02-B49 | ZZ Homeowner A1 | Read a payment proof file of Household B in Storage | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B50 | Signed out (no auth) | Read any R1 collection, including announcements | Refused | P1 | Security / negative | TBD — QE | No |
| TC-02-B51 | Claim hand-set to `treasurer` with no `staff` document (the "nobody edits claims by hand" condition) | Read `auditLog` | Refused | P2 | Security / negative | TBD — QE | No |

*B44–B48 and B51 need the token and `staff` document set up independently of `setRole` (emulator admin access to craft the state). That is special staging, not a layer decision.*

---

## C. Server-side refusal of privileged actions (callable functions) *(provisional: function names from SA-001 §3)*

### TC-02-C1 A board member's request to approve a pending payment is refused, and the payment still reads "Pending approval"
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Board D1. **Setup:** ZZ Payment P-pending on Household B.
- **Action:** the board member's device calls `decidePayment` (approve) for P-pending directly; there is no button to press.
- **Expected:** the call is refused with a permission error, asserted explicitly. Re-read as ZZ Treasurer T2: P-pending is still pending, and the treasurer's Approvals list and Household B's Dues & Payments both still say "Pending approval".
- **Don't assert:** the error's exact wording.

### TC-02-C2 Board's decide request on an approved payment is refused and changes nothing
**Priority** P2 · **Type** Security / status enumeration · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Board D1. **Setup:** ZZ Payment P-approved. **Action:** call `decidePayment` (reject).
- **Expected:** refused; status still approved; receipt unchanged.

### TC-02-C3 Board's decide request on a rejected payment is refused and changes nothing
**Priority** P2 · **Type** Security / status enumeration · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Board D1. **Setup:** ZZ Payment P-rejected. **Action:** call `decidePayment` (approve).
- **Expected:** refused; status still rejected; no receipt created.

### TC-02-C4 Board's void request on a receipt is refused
**Priority** P2 · **Type** Security / status enumeration · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Board D1. **Setup:** ZZ Payment P-approved with its receipt. **Action:** call `voidReceipt`.
- **Expected:** refused; receipt still valid.

### TC-02-C5 Board's decide request on a voided payment is refused
**Priority** P3 · **Type** Security / status enumeration · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Board D1. **Setup:** ZZ Payment P-voided. **Action:** call `decidePayment` (approve).
- **Expected:** refused; status unchanged.

### TC-02-C6 A homeowner cannot approve their own household's payment
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Homeowner B1. **Setup:** P-pending belongs to Household B. **Action:** call `decidePayment` (approve).
- **Expected:** refused; still pending.

### TC-02-C7 Admin office staff cannot approve a payment in R1
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S1. **Setup:** P-pending. **Action:** call `decidePayment` (approve).
- **Expected:** refused; still pending. *(D4-dependent: flips to allowed if the owner lets the office approve payments.)*

### TC-02-C8 A guard cannot approve a payment
**Priority** P2 · **Type** Security / negative · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Guard G1. **Setup:** P-pending. **Expected:** refused; still pending.

### TC-02-C9 A removed treasurer's stale token cannot approve a payment
**Priority** P1 · **Type** Security / boundary · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Treasurer T2, signed in; the developer then removes T2's role (T1 stays treasurer). T2's token still carries `treasurer`.
- **Action:** T2's device calls `decidePayment` (approve) on P-pending within the token's hour.
- **Expected:** refused (callables read `staff/{uid}`, not the token); still pending.

### TC-02-C10 A treasurer can approve a pending payment (control)
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Treasurer T2. **Setup:** a fresh pending payment. **Action:** approve.
- **Expected:** approved. Proves the C-block refusals are about role, not a broken function.
- **Don't assert:** the receipt number's value.

### TC-02-C11 No client can run `setRole`, whatever its role
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** Yes
- **Roles:** ZZ Treasurer T2, ZZ Admin S1, ZZ Homeowner A1.
- **Action:** if `setRole` is deployed as a callable, call it to grant the caller `treasurer`; otherwise confirm no client-callable endpoint exists for it.
- **Expected:** refused (or absent); no `staff` document or claim changes. In R1 (Option B) role changes come only from the developer script.

### TC-02-C12 A board member cannot call a household-changing function
**Priority** P2 · **Type** Security / negative · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Board D1. **Action:** call `createHousehold` / `updateHousehold`.
- **Expected:** refused (REQ-003). Detailed cases live in TC-03; this one checks the shared `hasRole` check.

### TC-02-C13 Homeowner, board and guard cannot create invitations
**Priority** P2 · **Type** Security / negative · **Layer** TBD — QE · **Writes** Yes
- **Roles:** ZZ Homeowner A1, ZZ Board D1, ZZ Guard G1, each in turn. **Action:** call `createInvites` for Household B.
- **Expected:** refused; no invite created. Detailed cases in TC-04.

### TC-02-C14 A refused decision consumes no receipt number
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Setup:** note the receipt counter. **Action:** run C1 and C7, then approve one payment as ZZ Treasurer T2.
- **Expected:** the treasurer's receipt number is the next one after the noted value: no gap from the refused calls.
- **Lane:** exclusive — asserts the receipt counter.

---

## D. Household isolation

### TC-02-D1 A homeowner's device cannot read another household's bills
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1 (Juan, Blk 4 Lot 12 only). **Setup:** Household B has bills *(provisional: bills are EPIC-002)*.
- **Action:** the device requests Household B's (Blk 1 Lot 3) bills directly.
- **Expected:** refused, asserted explicitly; no bill data returned.

### TC-02-D2 A query mixing own and another household's id is refused
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. **Action:** query bills where household is in [A, B].
- **Expected:** the whole query is refused, not filtered down to A's rows.

### TC-02-D3 A query for bills with no household filter is refused
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. **Expected:** refused.

### TC-02-D4 A homeowner can read their own household's bills (control)
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. **Expected:** Household A's bills are returned, and only those.

### TC-02-D5 A homeowner removed from a household is refused on their next read
**Priority** P2 · **Type** Security / boundary · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Homeowner B1, signed in. **Action:** admin removes B1 from Household B (REQ-004 `removeMember`); B1's device then reads Household B.
- **Expected:** refused at once (rules check the `members` document, not the token). Full journey in TC-04.

### TC-02-D6 A homeowner's notifications never show staff notifications
**Priority** P2 · **Type** Security / data leak · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1; staff notifications exist (e.g. "payment submitted" for the treasurer).
- **Expected:** A1's bell shows only A1's own notifications. *(The mock-up addresses all staff notifications to one shared `admin` key, `index.html` line 545; the real app must not carry that over.)*

---

## E. Board: figures without controls

### TC-02-E1 The board's R1 dashboard shows the view-only note
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Board D1. **Expected:** "View only. Board members can't change records." is shown. *(Which R1 page carries the note is not stated; BA gap 2.)*

### TC-02-E2 The board's R1 dashboard has no control that changes a record
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Board D1. **Expected:** no Approve, Reject, Save, Delete, Edit, Post or Reset control anywhere on the page.

### TC-02-E3 (R2) A board member opening Accounting sees collections and expenses
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Board D1, once Accounting ships (R2). **Expected:** collections and expenses are listed. **Not runnable in R1** (board's R1 menu is Dashboard only; BA gap 2).
- **Don't assert:** totals.

### TC-02-E4 (R2) Accounting has no "Save expense", "Delete" or "Approve" control for the board
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Board D1, R2. **Expected:** none of the three controls exists on the page (absent, not disabled-but-present).

### TC-02-E5 (R2) A board member's direct request to save an expense is refused
**Priority** P1 · **Type** Security / negative · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Board D1, R2. **Expected:** refused, asserted; no expense written.

### TC-02-E6 A board member opening the Settings address sees the no-access page
**Priority** P2 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Board D1. **Expected:** "You don't have access to this page"; no settings data loaded.

---

## F. A staff member who is also a homeowner

### TC-02-F1 The top bar shows a "Treasurer" / "My household" switch
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1 (treasurer and member of Household C, Blk 2 Lot 10). **Action:** sign in.
- **Expected:** two buttons, "Treasurer" and "My household", in the place of the mock-up's role switch (mock-up 2B).

### TC-02-F2 Choosing "My household" shows only Blk 2 Lot 10's homeowner pages
**Priority** P1 · **Type** Security / role · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1. **Action:** choose "My household", open Dashboard and Dues & Payments.
- **Expected:** only Household C's data; lands on the household dashboard.

### TC-02-F3 The household view's menu has no staff items
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1 in "My household". **Expected:** the homeowner R1 menu only (as A1); no Approvals, Homeowners or Settings.

### TC-02-F4 Switching back to "Treasurer" restores the staff menu
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1. **Expected:** the treasurer menu (as A5), landing on the staff dashboard.

### TC-02-F5 The switch reports its state with `aria-pressed`
**Priority** P2 · **Type** Usability / accessibility · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1. **Expected:** a labelled button group; the chosen button has `aria-pressed="true"`, the other `false`, after each switch.

### TC-02-F6 People with only one kind of access see no switch
**Priority** P2 · **Type** Negative / UI · **Layer** TBD — QE · **Writes** No
- **Roles:** ZZ Homeowner A1, ZZ Treasurer T2, ZZ Admin S1, ZZ Board D1. **Expected:** no switch in the top bar.

### TC-02-F7 An admin who is also a homeowner sees "Admin" / "My household"
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Admin S2. **Expected:** the switch reads "Admin" and "My household"; "My household" shows only Household B.

### TC-02-F8 A board member who is also a homeowner sees "Board" / "My household"
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Board D2. **Expected:** the switch reads "Board" and "My household"; "My household" shows only Household A.

### TC-02-F9 The household view has no picker for other households
**Priority** P1 · **Type** Security / data leak · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1 in "My household". **Expected:** no "Viewing as" household picker (mock-up line 556); Dues & Payments shows Household C's balance, not any other.

### TC-02-F10 The switch fits the top bar at 375 px
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1 on a 375 px phone. **Expected:** both buttons visible and tappable without horizontal page scroll. *(Real-phone layout depends on DEF-001.)*

### TC-02-F11 After a reload, the dual-role person lands in a defined view, never mixing the two
**Priority** P2 · **Type** Navigation / boundary · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1. **Action:** choose "My household", reload.
- **Expected:** the page shows one consistent view: menu, data and the pressed switch button all agree. **Which view it should be is BA gap 13**; don't assert which until it is decided.

### TC-02-F12 Switching to "My household" doesn't let an announcement pop-up block the switch
**Priority** P3 · **Type** Regression (modal mid-flow) · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1, with an unread important announcement. **Action:** switch to "My household".
- **Expected:** if the pop-up opens (mock-up `signInPopup` opens one on entering the homeowner role), it can be closed and the switch and menu then work; the pop-up doesn't reopen on every switch.

---

## G. No-access page and navigation

### TC-02-G1 A homeowner opening the Approvals address sees "You don't have access to this page"
**Priority** P1 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. **Action:** type the Approvals page address.
- **Expected:** heading "You don't have access to this page", text "If you think you should, contact the admin office.", button "Go to my dashboard" (mock-up 2C).

### TC-02-G2 No Approvals data is loaded behind the no-access page
**Priority** P1 · **Type** Security / data leak · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1, as G1. **Expected:** no payment or household data reaches the device (network shows refused reads or none); nothing flashes on screen before the no-access page.

### TC-02-G3 "Go to my dashboard" opens the homeowner dashboard
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. **Expected:** Household A's dashboard, Dashboard highlighted in the menu. *(For dual-role and staff-only people the target isn't stated: BA gap 8.)*

### TC-02-G4 Back from the no-access page returns to the previous page, not into the staff page
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1, arrived at G1 from the dashboard. **Expected:** Back shows the dashboard; Forward shows the no-access page again, never Approvals content.

### TC-02-G5 Refreshing the no-access page keeps it
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. **Expected:** still the no-access page after reload.

### TC-02-G6 Admin office staff opening the Approvals address see the no-access page
**Priority** P1 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Admin S1. **Expected:** no-access page. *(D4-dependent.)*

### TC-02-G7 A board member opening the Homeowners address sees the no-access page
**Priority** P1 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Board D1. **Expected:** no-access page; the household-list request is refused (same as REQ-003's scenario).

### TC-02-G8 A guard opening the Settings or Homeowners address sees the no-access page
**Priority** P2 · **Type** Navigation / security · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Guard G1. **Expected:** no-access page for each.

### TC-02-G9 A treasurer's deep link to Approvals opens Approvals after signing in
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T2, signed out. **Action:** open the Approvals address, sign in.
- **Expected:** lands on Approvals (or on the dashboard, if REQ-001 says sign-in always lands there; don't assert which beyond "not the no-access page").

### TC-02-G10 A signed-out visitor opening a staff address sees the sign-in page, not the no-access page
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
- **Role:** signed out. **Expected:** sign-in page; no staff data loaded. After signing in as ZZ Homeowner A1: the no-access page.

### TC-02-G11 No staff menu item is highlighted on the no-access page
**Priority** P3 · **Type** Navigation / usability · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1 on the no-access page. **Expected:** no menu item marked `aria-current` for a page the person can't open.

### TC-02-G12 The no-access page has a real heading and the copy of record
**Priority** P2 · **Type** UI/UX / accessibility · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. **Expected:** the title is a level-1 heading with the exact copy of record; the button is a button, reachable by keyboard.

---

## H. Granting a role (Option B: developer script)

### TC-02-H1 After a grant, Settings → Staff lists "ZZ Treasurer T1 · Treasurer"
**Priority** P1 · **Type** Happy path / integration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** ZZ Treasurer T1 starts as a homeowner of Household C with no role; another treasurer (T2) exists. **Role reading:** ZZ Admin S1.
- **Action:** the developer runs the script granting T1 `treasurer`, citing REF-TEST-001.
- **Expected:** Settings → Staff (heading "Staff and roles") lists T1's name with role Treasurer and a "Since" date.
- **Don't assert:** the date's exact value or list order.

### TC-02-H2 The grant writes one `staff` record with who granted it and the request it cites *(provisional)*
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **After H1, read on the emulator:** `staff/{T1 uid}` holds role `treasurer`, grantedBy = the developer's identity (not a service account), requestRef = REF-TEST-001, grantedAt set.

### TC-02-H3 The grant writes an activity log entry with ids only
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **After H1, read on the emulator:** one `auditLog` entry `role.set`: actor = developer, target = T1's uid, before = none, after = treasurer, requestRef = REF-TEST-001, a time. No names or emails in free text (SA-001 §8.2).

### TC-02-H4 The newly granted treasurer sees the treasurer menu next time, without signing out
**Priority** P1 · **Type** Happy path / boundary · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Treasurer T1, signed in on a device before H1.
- **Action:** after the grant, close and reopen the portal on the same device.
- **Expected:** T1 is still signed in (no revocation on a grant) and sees the "Treasurer" / "My household" switch and the treasurer menu.

### TC-02-H5 A grant while the person has the portal open updates their menu without a reload
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Treasurer T1, portal open and online during H1.
- **Expected:** the treasurer menu appears within a minute (the app listens to its own `staff` record, SA-001 §8.1). *(Assumption: not promised by the REQ, which promises only "the next time"; a fail here is a finding, not a REQ breach.)*

### TC-02-H6 The script refuses a grant with no board request reference
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
- **Action:** run the grant without a request reference. **Expected:** refused before any write; no `staff`, claim or audit change.

### TC-02-H7 The script prints the target project before writing
**Priority** P2 · **Type** Usability / safety · **Layer** TBD — QE · **Writes** Yes
- **Expected:** the first output names the target project id; the write happens after it.

### TC-02-H8 Against a `-prod` project id, the script asks for typed confirmation and aborts on anything else
**Priority** P1 · **Type** Negative / safety · **Layer** TBD — QE · **Writes** Yes
- **Special staging:** an emulator whose project id ends in `-prod` (e.g. `demo-hoa-test-prod`). **Never a real project.**
- **Action:** run a grant; answer the confirmation with wrong text, then run again and give the exact text.
- **Expected:** wrong text: aborts, nothing written. Exact text: proceeds.

### TC-02-H9 No service-account key file is in the repository
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
- **Expected:** the repository holds no service-account key; the script uses the developer's own credentials (Sol Arch condition 2).

### TC-02-H10 Running the same grant twice leaves one `staff` record and the same role
**Priority** P2 · **Type** Data integrity / double-run · **Layer** TBD — QE · **Writes** Yes
- **Action:** run H1 twice.
- **Expected:** one `staff/{uid}`, role unchanged; no revocation; Settings → Staff lists T1 once.
- **Don't assert:** whether the second run writes a second audit entry.

### TC-02-H11 Granting a role to an email with no account is refused clearly
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
- **Action:** grant `admin` to `nobody@example.test`. **Expected:** refused with a message naming the problem; nothing written.

### TC-02-H12 Granting an unknown role is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
- **Action:** grant role `superadmin` (or an empty role). **Expected:** refused; nothing written.

### TC-02-H13 The first treasurer can be created when there is none
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** empty `staff` collection. **Action:** grant `treasurer` to ZZ Treasurer T2.
- **Expected:** succeeds (Option B is the only way to create the first treasurer).

### TC-02-H14 A person holds one staff role at a time
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** ZZ Admin S1 is admin. **Action:** grant S1 `board`.
- **Expected:** S1 now has only `board` (claim, `staff` record and Settings → Staff all say Board); admin writes are refused. Revocation behaviour: see I14.

### TC-02-H15 Settings → Staff is read-only and shows the Option B note
**Priority** P1 · **Type** UI/UX / security · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T2. **Expected:** no add, edit or remove control; the note "To add, change or remove a staff role, the board president asks the developer in writing." is shown.

### TC-02-H16 Settings → Staff carries the heading "Staff and roles"
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Admin S1. **Expected:** the heading reads exactly "Staff and roles".

### TC-02-H17 Every `setRole` run alerts the owner *(provisional: SA-001 §8.3, not in REQ-002)*
**Priority** P3 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Expected:** one owner alert per run (H1). **BA gap 9:** not an acceptance criterion yet.

---

## I. Removing, downgrading and changing a role; stale sessions

### TC-02-I1 After removal, the next staff read from the removed person's device is refused
**Priority** P1 · **Type** Security / boundary · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S1, signed in on the Homeowners page; token fresh (well within its hour).
- **Action:** the developer removes S1's admin role; S1's device then lists households.
- **Expected:** refused on that first request, not after the token expires.

### TC-02-I2 After removal, the next staff write from the removed person's device is refused
**Priority** P1 · **Type** Security / boundary · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S1, as I1. **Action:** create an announcement.
- **Expected:** refused; no announcement exists.

### TC-02-I3 While online, the open Homeowners page changes to the no-access page within a minute
**Priority** P1 · **Type** Integration / boundary · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S1, Homeowners page open, online, no interaction.
- **Expected:** within 60 seconds of the removal the page shows "You don't have access to this page", and the household rows are gone from the screen.
- **Don't assert:** a time shorter than a minute.

### TC-02-I4 Settings → Staff no longer lists the removed person
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Role reading:** ZZ Treasurer T2. **Expected:** S1 is gone from the list.

### TC-02-I5 Removal deletes the `staff` record and logs before and after *(provisional)*
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **Expected, on the emulator:** `staff/{S1 uid}` no longer exists; one `auditLog` `role.set` with before = admin, after = none, requestRef set.

### TC-02-I6 Removal signs the person's device out when its token next refreshes
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S1. **Expected:** on the next token refresh (forced, or up to about an hour later) the device shows the sign-in page. *(Assumption: Firebase revocation behaviour as cited by Sol Arch.)*

### TC-02-I7 A device that was offline at removal is refused on reconnect, and staff data on screen is cleared
**Priority** P1 · **Type** Security / stale reference · **Layer** TBD — QE · **Writes** Yes
- **Special staging:** take S1's device offline, remove the role, reconnect.
- **Expected:** the first staff request after reconnect is refused and the page changes to the no-access page. While offline the page may still show what it already loaded *(the REQ promises the change only "while online")*; don't assert offline behaviour.

### TC-02-I8 Removal is refused on every device the person is signed in on
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Special staging:** ZZ Admin S1 signed in on two devices. **Expected:** both devices' next staff reads are refused; both change to the no-access page within a minute.

### TC-02-I9 A removed staff member who is also a homeowner keeps household access
**Priority** P1 · **Type** Security / boundary · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S2 (admin and member of Household B). **Action:** remove the admin role; S2 signs in again if signed out.
- **Expected:** S2's household reads for Household B still succeed; the switch disappears; staff reads are refused. **Whether S2 should be signed out at all is BA gap 4** (revocation signs out the whole account).

### TC-02-I10 A downgraded treasurer's treasurer actions are refused at once
**Priority** P1 · **Type** Security / status enumeration · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Treasurer T2 (T1 also treasurer). **Action:** downgrade T2 to admin; T2's device then writes a financial setting and calls `decidePayment`.
- **Expected:** both refused on the first try.

### TC-02-I11 After the token refreshes, the downgraded person has the admin menu and admin access
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Treasurer T2 after I10, signed in again. **Expected:** admin menu (as A3); listing households succeeds.

### TC-02-I12 A downgrade revokes the person's tokens
**Priority** P2 · **Type** Security / status enumeration · **Layer** TBD — QE · **Writes** Yes
- **Expected:** as I6, for the downgrade.

### TC-02-I13 An upgrade (admin → treasurer) does not sign the person out, and treasurer access works after the app refreshes the token
**Priority** P2 · **Type** Status enumeration / boundary · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S1, signed in and online. **Action:** upgrade to treasurer.
- **Expected:** S1 stays signed in; within a minute the treasurer menu appears and a financial-setting write succeeds. A write sent before the refresh may be refused (B47); don't assert either way for that window.

### TC-02-I14 A lateral change (admin → board) refuses admin writes at once
**Priority** P1 · **Type** Status enumeration · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S1. **Action:** change to board; S1's device creates an announcement.
- **Expected:** refused. **Whether a lateral change revokes tokens is BA gap 3**; don't assert sign-out.

### TC-02-I15 A staff action submitted just after removal is refused with a message, not silently
**Priority** P1 · **Type** Stale reference / usability · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S1 with a form open (e.g. new announcement). **Action:** remove S1's role, then press the form's save button.
- **Expected:** a visible message that the action wasn't allowed (or the no-access page); no partial record; the screen does not claim success.

### TC-02-I16 Re-granting a removed role restores access
**Priority** P3 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S1 after I1. **Action:** grant admin again. **Expected:** after signing in, admin menu and admin reads work; one `staff` record.

---

## J. The last treasurer

### TC-02-J1 Removing the only treasurer is refused with the copy of record
**Priority** P1 · **Type** Negative / boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** ZZ Treasurer T1 is the only treasurer. **Action:** the developer removes T1's role.
- **Expected:** the script shows "ZZ Treasurer T1 is the only treasurer. Make someone else treasurer first." (the `{name}` copy filled in).

### TC-02-J2 After the refusal, nothing about the treasurer changed
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **After J1:** Settings → Staff still lists "ZZ Treasurer T1 · Treasurer"; `staff/{T1}` unchanged; claim unchanged; T1 not signed out; a T1 treasurer action still succeeds.

### TC-02-J3 Downgrading the only treasurer is refused too
**Priority** P1 · **Type** Negative / status enumeration · **Layer** TBD — QE · **Writes** Yes
- **Setup:** T1 only treasurer. **Action:** change T1 to admin, then to board.
- **Expected:** both refused (the result would be no treasurer). **REQ-002 says only "remove"; BA gap 3.**

### TC-02-J4 With two treasurers, removing one is allowed
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
- **Setup:** T1 and T2 are treasurers. **Action:** remove T2. **Expected:** succeeds; T1 remains.

### TC-02-J5 Two removals at the same moment leave at least one treasurer
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
- **Special staging:** two script runs started together, one removing T1 and one removing T2.
- **Expected:** exactly one succeeds, the other is refused with the only-treasurer message; one treasurer remains (Sol Arch: counted in a transaction).

### TC-02-J6 A refused removal records no completed role change
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
- **After J1:** no `auditLog` `role.set` entry with after = none for T1.
- **Don't assert:** whether a refusal is logged.

---

## K. Usability, states and responsive

### TC-02-K1 While roles load, a homeowner sees a skeleton menu, never a staff menu that then disappears
**Priority** P1 · **Type** Usability / data leak · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1 on a throttled network. **Expected:** a skeleton until the role is known; no staff menu item appears at any frame.

### TC-02-K2 While roles load, a staff member never sees the homeowner or not-linked screen first
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T2, throttled. **Expected:** skeleton, then the treasurer menu; never REQ-001's "not linked" screen or a no-access page in between.

### TC-02-K3 The no-access page works at 375 px
**Priority** P2 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1, 375 px. **Expected:** heading, text and button fit with no horizontal scroll; the button is at least 24 × 24 CSS px (WCAG 2.2 target size). *(Real phones depend on DEF-001.)*

### TC-02-K4 The role switch works by keyboard
**Priority** P2 · **Type** Usability / accessibility · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1. **Expected:** Tab reaches both buttons, focus is visible, Enter and Space switch view.

### TC-02-K5 A screen reader announces the switch's group name and pressed state
**Priority** P3 · **Type** Accessibility · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1. **Expected:** the group's label and each button's pressed or not-pressed state are announced.

### TC-02-K6 Arriving on the no-access page moves focus to its content
**Priority** P3 · **Type** Accessibility · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. **Expected:** focus lands on the page heading or main region, not left on a stale element.

### TC-02-K7 At phone width each role's menu is inside the side drawer
**Priority** P2 · **Type** Responsive / navigation · **Layer** TBD — QE · **Writes** No
- **Roles:** ZZ Homeowner A1, ZZ Treasurer T2. **Expected:** the role's R1 menu (A1 / A5) opens from the menu button. **Blocked on real phones by DEF-001.**

### TC-02-K8 The switch and the no-access page meet AA contrast
**Priority** P3 · **Type** Accessibility · **Layer** TBD — QE · **Writes** No
- **Expected:** text 4.5:1, the pressed / not-pressed difference not by colour alone.

### TC-02-K9 Settings → Staff is readable on a phone
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T2, 375 px. **Expected:** names and roles readable; the page doesn't scroll sideways (a table that scrolls inside its own box is fine).

### TC-02-K10 A refused staff action tells the person what to do
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Admin S1 after removal, as I15. **Expected:** the message or page tells them to contact the admin office (copy of record), not a raw error code.

### TC-02-K11 The no-access page reflows at 320 px and 200 % zoom
**Priority** P3 · **Type** Accessibility · **Layer** TBD — QE · **Writes** No
- **Expected:** no lost content, no two-way scrolling.

---

## L. Back-compat: mock-up behaviours that must be gone

### TC-02-L1 Nobody sees the open "Homeowner | Admin | Guard" switch
**Priority** P1 · **Type** Back-compat / security · **Layer** TBD — QE · **Writes** No
- **Roles:** every fixture. **Expected:** the mock-up's three-way role switch (`index.html` line 554) exists for no one.

### TC-02-L2 A homeowner has no "Viewing as" picker
**Priority** P1 · **Type** Back-compat / data leak · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. **Expected:** no control that switches to another household.

### TC-02-L3 Editing browser storage grants no role
**Priority** P1 · **Type** Security / back-compat · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Homeowner A1. **Action:** set any role or view value in local or session storage to `admin` / `treasurer` (the mock-up keeps `UI.role` in `localStorage`, line 539), reload.
- **Expected:** still the homeowner menu; a staff address still shows the no-access page. Replaces the mock-up's NAV-04 behaviour.

### TC-02-L4 "Reset demo data" exists for no role
**Priority** P1 · **Type** Back-compat / security · **Layer** TBD — QE · **Writes** No
- **Roles:** ZZ Treasurer T2, ZZ Admin S1. **Expected:** Settings has no "Reset demo data" control (mock-up line 888).

### TC-02-L5 The top bar shows the signed-in person's name, not "HOA Treasurer"
**Priority** P3 · **Type** Back-compat / UI · **Layer** TBD — QE · **Writes** No
- **Role:** ZZ Treasurer T1. **Expected:** "Signed in as ZZ Treasurer T1" (mock-up 2B), not the mock-up's fixed "HOA Treasurer".

### TC-02-L6 Both brand builds show the same role menus
**Priority** P3 · **Type** Regression · **Layer** TBD — QE · **Writes** No
- **Roles:** A1, S1, T2, D1 on both brand configurations (Greenfield and Gentri Heights). **Expected:** identical menus; only branding differs.

### TC-02-L7 An existing homeowner who is later made staff keeps their household access
**Priority** P2 · **Type** Back-compat / integration · **Layer** TBD — QE · **Writes** Yes
- **Role:** ZZ Treasurer T1 (household member first, granted treasurer in H1). **Expected:** "My household" still shows Household C's existing data unchanged.

---

## M. Exploratory charters

### TC-02-M1 30 minutes trying to read or write past the rules as each role
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
- **Charter:** using the browser console and the client SDK, signed in as each fixture role in turn, try reads and writes the B-matrix doesn't list (sub-collections, Storage paths, queries with odd filters, fields outside the closed list). Record any success that isn't in the matrix.

### TC-02-M2 20 minutes changing roles rapidly across two devices
**Priority** P2 · **Type** Exploratory · **Layer** TBD — QE · **Writes** Yes
- **Charter:** grant, upgrade, downgrade, remove and re-grant ZZ Admin S1 in quick succession while S1 uses the portal on two devices. Look for a moment when a removed role still works, a menu that disagrees with what the server allows, or a duplicate `staff` record.

### TC-02-M3 15 minutes as a dual-role person mixing the two views
**Priority** P3 · **Type** Exploratory · **Layer** TBD — QE · **Writes** No
- **Charter:** as ZZ Treasurer T1, switch views mid-task, use Back across the switch, open notifications in each view, open staff addresses from the household view. Look for staff data shown in the household view or household data from another lot.

---

## Coverage summary

| Block | Scenario | Cases | P1 |
|---|---|---|---|
| A | Menus per role | 11 | 8 |
| B | Server refusal matrix | 51 | 36 |
| C | Privileged actions (callables), payment status enumeration | 14 | 6 |
| D | Household isolation | 6 | 4 |
| E | Board figures without controls (E3–E5 run in R2) | 6 | 3 |
| F | Staff member who is also a homeowner | 12 | 4 |
| G | No-access page and navigation | 12 | 4 |
| H | Granting a role | 17 | 7 |
| I | Removing, downgrading, changing; stale sessions | 16 | 9 |
| J | The last treasurer | 6 | 5 |
| K | Usability, states, responsive | 11 | 1 |
| L | Back-compat | 7 | 4 |
| M | Exploratory | 3 | 0 |
| **Total** | | **172** | **91** |

**Cases affected by D4** (who approves payments; recorded as "treasurer only in R1" in REQ-002 r3): A3, C7, C14, G6. If the owner reverses D4, A3 gains Approvals, C7 becomes allowed and G6 opens Approvals.

**Cases that depend on Draft architecture** (SA-001 / ADR-004, provisional): all of B, C, H2, H3, H5, H17, I5, and the stale-token cases B44–B48, B51, C9, I1, I2, I10.

**Cases that depend on requirements not yet written:** C1–C10, C14, D1–D4, B21, B26, B36, B38, B41, B49 (payments and bills: EPIC-002, EPIC-003); E3–E5 (Accounting, R2); A9 R4 follow-up (gate).

## Requirement gaps for the BA

1. **`users/{uid}.staffRole` vs `staff/{uid}`.** REQ-002's Data changes table still lists the `users` mirror; Sol Arch's review replaces it with `staff/{uid}` because `users` is self-written. Pick one; the round-trip register can't close until then.
2. **Board read-only scenario isn't testable in R1.** The Gherkin has the board opening Accounting, but the board's R1 menu is Dashboard only. Either move that scenario to R2 or give an R1 page to check, and say which page carries "View only. Board members can't change records."
3. **Downgrades and lateral changes are undefined.** Is treasurer → board a downgrade (tokens revoked)? Admin ↔ board? Does the last-treasurer guard also refuse *downgrading* the only treasurer (J3)? The REQ only says "remove".
4. **Removing a staff role from someone who is also a homeowner.** Revoking refresh tokens signs out the whole account, household view included. Intended?
5. **Guard accounts in R1.** Guard menus are R4 only. What does a person with the guard role see in R1, and can they also hold a household?
6. **Who may read Settings → Staff.** "Read-only, to staff": board and guard have no Settings in R1. Can they read the `staff` list (rules B39 assumes guard is refused; board is untested)? The list also shows emails (mock-up 2D).
7. **"Admin" vs "Admin office".** The switch uses "Admin"; Settings → Staff (mock-up 2D) uses "Admin office". One word per role.
8. **"Go to my dashboard" target** for a dual-role person and for a removed staff member with no household.
9. **Owner alert on every `setRole` run** (SA-001 §8.3) is not an acceptance criterion.
10. **Payments and bills.** The server-refusal and isolation scenarios rely on payments and bills (EPIC-002, EPIC-003), which have no REQ. The status label "Pending approval" and the full payment status list need to come from the payments REQ; C2–C5 assume pending, approved, rejected, voided.
11. **Which payment data may the admin office read in R1** when it can't approve (D4)? The mock-up's Homeowners page shows balances; Approvals is hidden.
12. **Non-financial settings in R1.** Which settings fields may the admin office write, and which are the treasurer's (dues, QR)? B18/B19 need the list.
13. **The dual-role switch after a reload.** Which view does the person land in, and is the choice remembered?

---

*Top regression risk: the rules helpers (`isStaff` / `hasRole` with the `staff/{uid}` double check) are shared by every collection, now and in every later REQ. One wrong helper either lets a removed or stale-token staff member keep approving money, or locks every staff member out of everything. Block B plus the stale-token rows must be re-run on every rules change.*
