# REQ-002: Roles and permissions enforced on the server

| | |
|---|---|
| Raised by | Owner: "draft req-001 to 004 and have SA review it. I'll approve it tomorrow" (2026-11-28) |
| Epic | [EPIC-001 Access and households](../epics/EPIC-001-access-and-households.md) |
| Backlog story | [02 Roles and permissions enforced on the server](../backlog/BACKLOG.md#02-roles-and-permissions-enforced-on-the-server) |
| Status | **Draft: options for owner approval.** Sol Arch reviewed: supports Option B with changes (applied in r2) |
| Mockup | Screens 2A–2D of the [access and households mockup](https://claude.ai/artifact/KaNMpY53cLTtrk8HARZgUr). Repo copy: [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html) |
| Architecture | SA-001 §8.1 and ADR-004, Draft on branch `docs/sa-001-architecture`. Sol Arch recommends revising both (see its review) |
| Depends on | REQ-001 |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch's corrections applied; removal promise made an owner decision; R1 admin menu depends on D4 |

## Decisions for the owner

| # | Decision | Recommendation |
|---|---|---|
| 1 | How fast a removed staff role stops working. **"At once"**: Firestore rules also check a staff record only the server writes (`staff/{uid}`), costing about one extra read per staff request. **"Within 1 hour"**: rules check only the role in the sign-in token, which stays valid for up to an hour after removal. SA-001 currently says "within the hour or at once", which Sol Arch says is wrong. | **At once.** The cost is small, and an ex-treasurer keeping access to approvals for an hour is not acceptable for money |
| 2 | Option A (Staff and roles page now) or Option B (developer sets roles on the board's written request; read-only staff list) | **B for R1**, A with the gate add-on |
| 3 | D4: may the admin office approve payments? This decides whether admins see Approvals in R1 | Treasurer only in R1; admins don't see payment approvals |

## Problem

In the mock-up anyone can press "Admin" and approve payments, change settings or reset the data. The real portal needs each person to see and do only what their role allows, and the server must refuse the rest: a button hidden on screen is not protection.

## Roles

A **staff role** is held by a few people (SA-001: a custom claim set by a Cloud Function, plus the server-written `staff/{uid}` record if decision 1 is "at once"). Being a **homeowner** is not a role: it means being a member of a household (REQ-004). One person can be both, for example a treasurer who lives in the subdivision.

| Role | Who | Menu (from the mock-up's `NAV`, line 546) | Can't |
|---|---|---|---|
| Homeowner | Member of a household | Dashboard, Dues & Payments, Book Amenities, My Vehicles, Requests & Complaints, Guest Passes, Request a Report, Announcements (each only once released) | See other households or any staff page |
| Admin office staff (`admin`) | Office staff | Dashboard, Approvals (bookings and vehicles once released; payments only if D4 allows), Homeowners, Requests & Complaints, Report Requests, Visitor Log, Announcements, Settings (non-financial) | Approve or void payments; record expenses; close months (unless D4 says otherwise) |
| Treasurer (`treasurer`) | Elected treasurer | Everything an admin has, plus payment approvals, Accounting, Collections & Notices, Reports, dues and QR settings | Change receipt numbers or edit a closed month (no one can) |
| Board member (`board`) | Elected directors | Dashboard, Accounting, Collections & Notices, Reports, Announcements: **read-only** | Any change |
| Guard (`guard`) | Security agency staff | Scan Pass, Visitors Inside, Today's Log (R4 only) | See households, balances or past ID photos. Whether a guard sees the homeowner's number on a pass is decided in the gate REQ: the mock-up tells guards to call the homeowner |

Only menus for released features appear. **In R1:** Homeowner: Dashboard, Dues & Payments, Announcements. Treasurer: Dashboard, Approvals (payments), Homeowners, Announcements, Settings. Admin office: the same without Approvals unless D4 lets them approve payments. Board: Dashboard (Reports and Accounting arrive in R2).

## Options

The rules and roles above are the same in every option. The options differ only in **how a person gets a staff role**.

### Option A: A "Staff and roles" page in Settings

- **How it works:** a treasurer opens Settings → Staff and roles, enters a person's email, picks a role, and saves. Removing a role works the same way. Every change is logged.
- **Cost:** moderate: a screen, the `setRole` Cloud Function and rules tests.
- **Honest downside:** another screen that controls access and so needs careful testing; and someone must hold the right to change roles, which the board has not decided (D4).

### Option B: Roles set by the developer on the board's written request; read-only staff list (recommended for R1)

- **How it works:** the board president sends the developer a written request ("Make Carmela Cruz treasurer from Dec 1"). The developer runs the same `setRole` function from a script, citing the request. Settings → Staff shows the current staff and their roles, read-only, to staff.
- **Cost:** cheap: the function and rules are needed anyway; no management screen.
- **Honest downside:** each change waits for the developer. That is fine for roughly 5–10 staff who change at elections, and not fine once the security agency's guards change every month.

### Recommendation

**Option B for R1, then Option A with the gate add-on (R4)**, when guards make role changes frequent. It ships the same protection sooner, and the board can decide D4 (who may grant roles) before anyone gets a screen to do it.

## Story

As the treasurer, I want each person to see and do only what their role allows, so that homeowners, guards and board members can't change records that aren't theirs.

## Acceptance criteria (Option B, removal "at once")

```gherkin
Feature: Roles and permissions

  Scenario Outline: Each role sees only its own menu
    Given a person whose only access is <access>
    When they sign in
    Then the menu shows "<shown>"
    And the menu does not show "<hidden>"

    Examples:
      | access                 | shown           | hidden     |
      | member of Blk 4 Lot 12 | Dues & Payments | Homeowners |
      | the admin role         | Homeowners      | Accounting |
      | the treasurer role     | Approvals       | Scan Pass  |
      | the board role         | Dashboard       | Homeowners |

  Scenario: A refused action is refused by the server, not only hidden
    Given a board member is signed in
    When their device sends a request to approve a pending payment
    Then the request is refused
    And the payment still reads "Pending approval"

  Scenario: A homeowner's device cannot read another household
    Given Juan is a member of Blk 4 Lot 12 only
    When his device asks for the bills of Blk 1 Lot 3
    Then the request is refused

  Scenario: A board member sees figures but no controls that change them
    Given a board member opens Accounting
    Then they see the collections and expenses
    And there is no "Save expense", "Delete" or "Approve" control on the page

  Scenario: A treasurer who is also a homeowner switches views
    Given Carmela Cruz has the treasurer role and is a member of Blk 2 Lot 10
    When she signs in
    Then the top bar shows a switch with "Treasurer" and "My household"
    When she chooses "My household"
    Then she sees only Blk 2 Lot 10's homeowner pages

  Scenario: Opening a staff page without the role
    Given Juan is a homeowner with no staff role
    When he opens the address of the Approvals page
    Then he sees "You don't have access to this page"

  Scenario: Granting a role
    Given the board president asked in writing for Carmela Cruz to be treasurer
    When the developer grants Carmela the treasurer role, citing that request
    Then Settings → Staff lists "Carmela Cruz · Treasurer"
    And the activity log records the developer who ran it, the board request it cites, and when
    And the next time Carmela opens the portal she sees the treasurer menu, without signing out

  Scenario: Removing a role
    Given Paolo Aquino has the admin role and is signed in on the Homeowners page
    When the developer removes his admin role
    Then any staff read or approval his device sends from then on is refused
    And while his device is online, the Homeowners page changes to "You don't have access to this page" within a minute
    And Settings → Staff no longer lists him

  Scenario: The last treasurer can't be removed
    Given Carmela Cruz is the only treasurer
    When the developer removes her treasurer role
    Then the change is refused with "Carmela Cruz is the only treasurer. Make someone else treasurer first."
    And Settings → Staff still lists "Carmela Cruz · Treasurer"
```

If the owner picks "within 1 hour" (decision 1), the first Then of "Removing a role" becomes: *Then within 1 hour any staff read or approval his device sends is refused*.

## Data changes

| What | Where | Written by | Read by |
|---|---|---|---|
| Staff role | Firebase Auth custom claim `role` (SA-001, ADR-004) | `setRole` Cloud Function only | Firestore and Storage rules; the app's menu |
| Staff record (only if decision 1 is "at once") | `staff/{uid}`: role, granted by, request reference, since | `setRole` only; deleted on removal | Firestore and Storage rules, alongside the claim |
| Mirror of the role, for listing staff | `users/{uid}.staffRole` | `setRole` only | Settings → Staff |
| Role change record: who ran it, whom, old role, new role, board request reference, when | `auditLog` (SA-001 §8.3) | `setRole` only | Board, treasurer (activity log UI is backlog story 06) |

`setRole` revokes the person's sessions only on removal or downgrade, never on a grant.

## UX/UI notes

- **Accessibility:** the role switch is a labelled button group with `aria-pressed`, reusing the mock-up's `.seg` control; the no-access page has a heading and a way back ("Go to my dashboard").
- **Consistency:** the switch replaces the mock-up's "Homeowner | Admin | Guard" switch, in the same place; it appears only for people who hold both.
- **Mobile-first:** menus already collapse into the mock-up's side drawer at phone width.
- **States:** no-access page (above); a signed-in person with no role and no household sees REQ-001's "not linked" screen; while roles load, the menu shows a skeleton, never a staff menu that then disappears.
- **Safe actions:** role changes go through one function that refuses to remove the last treasurer.
- **Roles:** every rule is deny-by-default and tested against every role (SA-001 §8.1), including a token that still carries a removed role. Hidden is not protected.

## Copy of record

| Where | Text |
|---|---|
| Role switch buttons | Treasurer · My household (or Admin, Board), shown as two buttons |
| No-access page | You don't have access to this page · If you think you should, contact the admin office. · Go to my dashboard |
| Settings → Staff heading | Staff and roles |
| Settings → Staff note (Option B) | To add, change or remove a staff role, the board president asks the developer in writing. |
| Last treasurer refusal | {name} is the only treasurer. Make someone else treasurer first. |
| Board read-only note | View only. Board members can't change records. |

## Out of scope

- The "Staff and roles" management screen (Option A) until R4, unless the owner picks it now.
- Guard accounts: one per guard or one per gate post (SA-001 Q8), and whether guards see homeowners' numbers; decided with the gate REQ.
- Tenant access (D3).
- The activity log screen (backlog story 06). This REQ only writes the record.

## Open questions

| Question | Who decides |
|---|---|
| Decisions for the owner, rows 1–3 | Owner |
| Who may ask for a role change: the president only, or any two directors? | HOA board |
| Should board members see the household directory (names and contacts)? Recommended no, to keep personal data to the people who need it. | HOA board |

## Sol Arch review

> **BA note (r2):** the corrections Sol Arch asks for under "Criteria to change" are already applied to the criteria, copy and data above. What needs the owner is listed under "Decisions for the owner" at the top.

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r1 and ADR-004 (Draft, `origin/docs/sa-001-architecture` at `b020b40`). Mock-up `index.html` `NAV` at line 546, read.

**Verdict: Supports with changes.** Option B for R1 is right. "Within 1 hour" is what SA-001's design delivers today, and SA-001 wrongly says "or at once". I recommend one design change: rules also check a staff record that only the server writes. With it, a removed role is refused on the person's very next request. The owner should choose which promise to make.

#### Options

| Option | Feasible? | Cost (BA's read) | Sol Arch |
|---|---|---|---|
| A: "Staff and roles" page | Yes | Moderate | **Agree, moderate.** `setRole` becomes a callable that checks the caller's own authority (D4), refuses to remove the last treasurer, and finds the person by email with the Admin SDK. Needs the in-flight flag and a server-side refusal (CS-5). |
| B: developer runs `setRole` from a script; read-only staff list | Yes | Cheap | **Agree, cheap**, with four conditions. (1) The script calls the same `setRole` module; nobody edits claims by hand. (2) It runs with the developer's own credentials, never a key file in the repo, prints the target project, and asks for typed confirmation on any `-prod` project (L-003). (3) The audit entry records the developer as the actor *and* a reference to the board's written request. Otherwise "who granted it" just shows a service account. (4) It refuses to remove the last treasurer, the same as Option A. Option B is needed anyway: the first treasurer can only be created this way. |

**I support Option B for R1, and Option A when guards arrive (R4).**

**What Firebase does when a role is removed:**
- "Firebase ID tokens are short lived and last for an hour." Revoking refresh tokens signs the user out and makes them sign in again. A token, though, is a "stateless JWT", so a revocation is visible "only by requesting the token's status from the Firebase Authentication backend" ([manage sessions](https://firebase.google.com/docs/auth/admin/manage-sessions)). New claims reach the user only "the next time a new one is issued" ([custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)).
- So with SA-001 as drafted (role in the claim, plus revoke), Firestore and Storage rules keep accepting Paolo's current token as admin until it expires, **up to about 60 minutes**. Our callable functions can re-check, but rules cannot.
- **Recommended fix:** a staff permission requires both the claim **and** a matching server-written `staff/{uid}` document. In plain terms: `hasRole(r)` is true only when `request.auth.token.role == r` and `staff/{uid}.role == r`. `setRole` updates or deletes `staff/{uid}` in the same call, so the next request is refused at once. Cost: one extra document read per staff request, billed even when refused, within the limit of 10 per request ([rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)). With about 10 staff that is negligible. Homeowner checks are unaffected. Callables read `staff/{uid}` rather than trusting the token.
- The app listens to its own `staff/{uid}` document. When it changes, the app refreshes the token (`getIdToken(true)`, per the custom-claims page) and re-routes, so an open page changes within seconds while the device is online.
- Firebase's documented alternative compares the token's `auth_time` with a stored revocation time, but its example is for Realtime Database ([manage sessions](https://firebase.google.com/docs/auth/admin/manage-sessions)), and `auth_time` is not listed in the Firestore rules reference I fetched ([Request reference](https://firebase.google.com/docs/reference/rules/rules.firestore.Request)). **Uncertain.** The `staff/{uid}` check doesn't depend on it.

#### Criteria to change (quoted, then corrected)

1. **"Then within 1 hour, and at the latest when he next signs in, his staff pages show "You don't have access to this page""**. "At the latest when he next signs in" adds nothing, because revocation forces a new sign-in anyway. Corrected, **with the recommended fix**:
   ```gherkin
   Then any staff read or approval his device sends from then on is refused
   And while his device is online, the Approvals page changes to "You don't have access to this page" within a minute
   And Settings → Staff no longer lists him
   ```
   **Without the fix**, the honest wording is: `Then within 1 hour any staff read or approval his device sends is refused`.
2. **"Granting a role … And the activity log records who granted it and when"**. Corrected: `And the activity log records the developer who ran it, the board request it cites, and when`. Add `And the next time Carmela opens the portal she sees the treasurer menu, without signing out`. To make that true, `setRole` revokes tokens only on **removal or downgrade**. Revoking on a grant would sign her out for nothing.
3. **Missing scenario.** The UX notes say the function "refuses to remove the last treasurer", but no criterion tests it:
   ```gherkin
   Scenario: The last treasurer can't be removed
     Given Carmela Cruz is the only treasurer
     When the developer removes her treasurer role
     Then the change is refused with "Carmela Cruz is the only treasurer. Make someone else treasurer first."
     And Settings → Staff still lists "Carmela Cruz · Treasurer"
   ```
4. **"Then the top bar shows "Treasurer | My household""**. The copy of record says "Treasurer · My household". Pick one.
5. **"A refused action is refused by the server, not only hidden"**. Can be met as written (`decidePayment` re-checks the role). Add a new rules test: a token that still carries the claim after `staff/{uid}` was deleted is refused.

**Gaps for the BA (no Gherkin change yet):**
- **R1 admin menu.** The R1 staff menu lists "Approvals (payments)", but admins can't approve payments unless D4 says so. In R1 an admin would open a page with nothing they may do. Show Approvals to admins only if D4 allows.
- **Guard and contact numbers.** The table says guards can't see "contact numbers", but the mock-up's pass result tells the guard to "Call the homeowner at {contact}" (`index.html` line 1199), and SA-001 Flow 3 returns pass details. Decide this with the R4 gate REQ.

#### Data

- Claim `role` (one string, so one staff role per person): **confirmed** (SA-001 §8.1, ADR-004).
- **Change:** replace `users/{uid}.staffRole` with a collection `staff/{uid}` holding `{role, displayName, grantedBy, requestRef, grantedAt, updatedAt}`. Only `setRole` writes it. Staff may read it (Settings → Staff); no client writes. Why: `users/{uid}` is written by the person themselves (REQ-001). A role field there leaves one rules mistake between a homeowner and staff access, and the removal check needs a document only the server writes.
- `auditLog`: `{action: 'role.set', actor, targetUid, before, after, requestRef, at}`. Ids only, no names in free text (SA-001 §8.2).
- Rules: `isStaff()` and `hasRole()` as above. The rules test matrix covers every R1 collection against homeowner, admin, treasurer, board, guard, no-role, and **removed role with a stale token**.
- Functions: `setRole` (SA-001 §3). Index: none, since the staff list is a small collection.

#### Risks not covered

- **The script is a production write path.** It runs with Admin SDK rights from a laptop. Mitigate with the four conditions above, and alert the owner on every `setRole` call (rare, so every one is worth seeing).
- **Two role changes at once** (two scripts, or later two treasurers on Option A) could both pass the "not the last treasurer" check. Count treasurers inside a transaction over `staff`.
- **Menu flicker** while the claim and membership load. Covered by the skeleton state in the UX notes.
- **Privacy.** Board access to the directory: keep the default deny in rules unless the board decides otherwise (consistent with REQ-003).
- **Guard turnover** makes Option B unworkable by R4. Also decide one account per guard or per post (SA-001 Q8) before R4.

#### SA-001 follow-ups (recommended revisions; I have not edited SA-001)

- §8.1: "a removed admin loses access within the hour or at once" is not accurate for rules. Revise to describe the `staff/{uid}` double check, and revise ADR-004's decision line with it (ADR-004 is still Draft, so a revision, not a superseding ADR).
- §4.2: replace `USERS.staffRole` with a `STAFF` collection.
- §3 names the function `linkHousehold`, while §8.1 and ADR-004 say `redeemInvite`. Use `redeemInvite` throughout.
- `setRole`: revoke refresh tokens on removal and downgrade only.

#### Size

Option B: **3–4 person-days with Claude Code**. That covers `setRole` plus the script and audit, the rules helpers and the full role-by-collection rules matrix for R1 (most of the effort, and it grows with every later REQ), the stale-token tests, the role router and menus, the no-access page, the role switch, and the read-only Settings → Staff list. Option A later: +2–3.

#### Sources (fetched 2026-11-28)

[Manage sessions / revoke tokens](https://firebase.google.com/docs/auth/admin/manage-sessions) · [Custom claims](https://firebase.google.com/docs/auth/admin/custom-claims) · [Rules conditions (get/exists limits, billing)](https://firebase.google.com/docs/firestore/security/rules-conditions) · [Rules Request reference](https://firebase.google.com/docs/reference/rules/rules.firestore.Request)
