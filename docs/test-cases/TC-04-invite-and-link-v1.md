# TC-04: Invite a homeowner and link them to a lot (v1.1)

| | |
|---|---|
| Enhancement / fix | Enhancement: new feature (invite codes, code entry and confirm, redeem, printed slips, emailed invitations, bulk invite, remove after a sale). **v1.1 adds** (REQ-004 r4 to r6): withdrawing an invitation, "Change of owner", invitation expiry settings, a second person by printed slip in step 1, refusing to deactivate a household while anyone is linked, the `memberOf` index, the person-record check at linking and the 15-second limit on code calls |
| Source | [REQ-004 Invite a homeowner and link them to a lot](../requirements/REQ-004-invite-and-link.md), **r6**. r5 was **approved** by the owner on 2026-11-28 ("Approve r4 and merge"), with owner **decisions 6 to 9 approved as recommended** on 2026-11-28 ("approve decisions 6 to 9 as recommended"; row 9 = **option (c)**, refuse deactivation while anyone is linked; the option-a scenario and the "inactive household" notice are marked not adopted and are **not tested** as behaviour). r6 (the REQ-001 r4 follow-up: person record and 15-second limit, "Linking…") was added at the owner's request and merged to `main` as approved; it changes no r5 behaviour. r4 added `memberOf/{uid}`. Option A in two steps |
| Version | **v1.1** (file name unchanged) |
| Depends on / precedent | [REQ-001 Sign in](../requirements/REQ-001-sign-in.md) **r4** (the not-linked page *is* "Enter your invite code"; Google popup; missing person record; 15-second save limit), [REQ-002 Roles](../requirements/REQ-002-roles-and-permissions.md) (who may invite and remove, "at once" removal, no-access page, admin office has non-financial Settings), [REQ-003 Household directory](../requirements/REQ-003-household-directory.md) **r4** (link-status pills; deactivation stops unused invitations; `createInvites` refuses an inactive household; owner name, contacts, search tokens), [REQ-006 Activity log](../requirements/REQ-006-activity-log.md) (sentences for `invite.*` and `member.removed`), [REQ-016](../requirements/REQ-016-post-an-announcement.md) (reads `memberOf`) |
| Sibling test documents | [TC-01](TC-01-sign-in-v1.md) v1.2 (TC-01-F11, TC-01-F20, TC-01-F21: person record and the 15-second save; TC-01-Q11: removed member's next read), [TC-03](TC-03-household-directory-v1.md) (block H: deactivate and reactivate), [TC-06](TC-06-activity-log-v1.md) (TC-06-A8 to TC-06-A10: invitation log sentences), [TC-16](TC-16-post-an-announcement-v1.md) (TC-16-J9, TC-16-J10, TC-16-J12, TC-16-J13: `memberOf` read side, no client writes, back-fill). Where a sibling already owns a behaviour, this document points to it instead of repeating it |
| Related defects | [DEF-001](../defects/DEF-001-no-viewport-meta-phone-layout-never-applies.md) (Open: no viewport meta, so the phone layout never applies; the join screens and the new staff forms must work at 375 px, see TC-04-Q6, Q16). No defect is open in the invite area (it has no code yet) |
| App version | **Anticipated.** No application code exists; `main` holds the single-file mock-up only (`index.html`, `gentri-heights/index.html`). The approved UX is screens 4A–4G of [req-001-004-access-mockup.html](../mockups/req-001-004-access-mockup.html) (4H is Option C, not approved, not planned), with REQ-004 r5's listed mock-up changes (3A, 4A, 4E, 4F, 4G and new screens: Withdraw confirm, Invite another person, Change of owner, Settings → Invitations, deactivate refusal, step-1 directory). Those mock-up edits are **not made yet**; this plan follows the REQ's copy of record, not the current mock-up |
| Source files / functions touched (anticipated) | Callable functions `createInvites`, `checkInvite`, `redeemInvite` (now also reads `users/{uid}` and writes `memberOf`), `removeMember` (also `memberOf`), `cancelInvite` (screen caller: Withdraw), **`changeOwner`** (new), **`setInviteExpiry`** (new); REQ-003's `setHouseholdActive` (deactivate cancels invitations, and is refused while anyone is linked); the mail function (ADR-002; `skipped`); Firestore rules for `invites`, `inviteAttempts`, `mail`, `members`, `memberOf`, `households`, `householdContacts`, `auditLog`, `config/features`; the expiry settings (REQ-004: "SA to name"); the "Enter your invite code" page and `/join` route, confirm screen, Homeowners directory and household detail (4E), Invite another person, Withdraw confirm, Change of owner form, bulk invite (4F), print confirm and slip PDF (4G), Settings → Invitations card |
| Architecture | **[SA-001](../architecture/SA-001-hoa-portal-firebase-architecture.md) r3 and ADR-001 to ADR-005 are Final**, approved by the owner 2026-11-28 ("APPROVED — FINAL: SA-001 r3 and ADR-001 to ADR-005"). Final SA-001 carries the five invite functions (§3), the keyed-hash code and the `invites` fields and statuses (§4.2, §8.1), `members` (ADR-004), the `mail` queue with queued / sent / failed and the code cleared after hand-off (ADR-002), the staging allow-list (ADR-005) and "ids and action codes only" in `auditLog`; the v1 tag *Provisional — SA-001 Draft* is dropped wherever these carry the detail. **Still provisional, with a narrower tag:** (1) items SA-001 itself still lists as open: the lot key (§4.2), R-16 sale privacy, the §11.3 open questions (only block L rests on these); (2) REQ-004 r5/r6 Sol Arch additions **not yet in SA-001**: the invitation `slot` (SA-001 §8.1 still says "household and recipient"), `cancelReason`, `households.inviteExpiresAt`, the mail status `skipped`, `changeOwner`, `setInviteExpiry`, `config/features.emailInvites`, `members.name` / `members.email`, `memberOf/{uid}`, the removal listener, the person-record read in `redeemInvite` and the 15-second client limit. Those cases say **Provisional — not yet in SA-001: {item}** |
| Environment | **Firebase Emulator Suite (Auth, Firestore, Functions) or `hoa-portal-staging` only. Never production.** Emulator runs use a test HMAC key, never the production Secret Manager key. Email is never delivered: the provider is a stub in the emulator, and staging mail goes only to the allow-list (ADR-005, SA-001 §10). Both brands (Greenfield Homes HOA, Gentri Heights HOA) |
| Author / date | QA, 2026-11-28 (v1); QA, 2026-11-28 (v1.1) |
| Status | **v1.1 approved** by the owner, 2026-11-28 ("Approve TC-04 v1.1" in this session; "approve TC-04 v1.1 and merge it" in the orchestrator session). Ready for QE triage of the 145 new `TBD — QE` cases; new BA gaps NG-1 to NG-15 are not decided by this approval. History: v1 (against REQ-004 r3) was **approved** by the owner, 2026-11-28 ("Approve and merge"), and QE triaged it the same day. v1.1 aligns to REQ-004 r6: every G-n gap is answered (see Requirement gaps), new cases carry Layer `TBD — QE`, changed cases keep QE's layer unless the v1.1 change log says otherwise, and retired cases stay in place, struck through. QE re-triages only the delta |

**Tags used on cases**

- **Step 1**: ships with printed slips, no email provider needed. **Step 2**: needs the email provider (SA-001 Q7); run only once step 2 ships.
- **Provisional — not yet in SA-001: {item}** (v1.1): asserts a REQ-004 r5/r6 Sol Arch design detail that SA-001 Final doesn't carry yet. Re-check when SA-001 takes the follow-up. (v1's *Provisional — SA-001 Draft* is retired; see the change log.)
- **Blocked — decision N** / **Blocked — board** / **Blocked — provider**: expected result depends on an open decision or the email provider. The case stays in the plan; QE must not automate an expected result marked blocked.
- **NG-n** (v1.1): one part of the expected result depends on a new gap for the BA (listed at the end). The case says which part; everything else in it is runnable.
- **Staging note**: the scenario needs special set-up (two devices or sessions at once, data in an old shape, admin SDK / console access to read function-only collections, a seeded time in the past).
- **Retired in v1.1**: kept for the record with the reason; the id is never reused.

---

## Roles and what crosses between them

| Role | In this feature |
|---|---|
| **Admin office staff** (`admin`) | Invites (one, many, another person by email or slip), resends, prints slips, withdraws an invitation, removes people, runs "Change of owner", and (decision 6) changes the invitation expiry settings. Reads the directory and household detail |
| **Treasurer** (`treasurer`) | Everything the admin office does here, including the expiry settings (decision 6: both roles, r3 said treasurer only). Reads the activity log (REQ-006) |
| **Board** (`board`) | No access to the Homeowners page (REQ-003) or the Invitations settings. Reads the activity log. Cannot invite, withdraw, remove or change the owner |
| **Guard** (`guard`) | No access to any of this. Must not see households, invitations, members or settings |
| **Homeowner / invitee** (signed-in account) | Enters a code (or follows the email link), confirms the lot, redeems for themselves only. Once linked, a household member |
| **No-role, no-household account** | Sees only "Enter your invite code" (REQ-001 r4: the not-linked page and code entry are one page) |
| **Account with no person record** (r6) | Signed in, but `users/{uid}` was never saved (REQ-001 "Missing record"). Can check a code; linking is refused until the record exists |

### Test fixtures (invented; QE maps them to `.env`)

| Fixture | Lot | Owner on file | Contact email (staff-only) | Starting state |
|---|---|---|---|---|
| **HH-A** "ZZ Test Household A" | Blk 2 Lot 7 | ZZ Ana Reyes | zz.owner.a@example.test | Not invited |
| **HH-B** "ZZ Test Household B" | Blk 4 Lot 12 | ZZ Juan Dela Cruz | zz.owner.b@example.test | Linked · 1 person (U-JUAN) |
| **HH-C** "ZZ Test Household C" | Blk 4 Lot 5 | ZZ Miguel Ramos | *(none)* | Not invited, no email |
| **HH-D** "ZZ Test Household D" | Blk 7 Lot 1 | ZZ Dora Deactivated | zz.owner.d@example.test | Active, **no one linked**; deactivated during the case |
| **HH-E** "ZZ Test Household E" | Blk 4 Lot 15 | ZZ Dennis Bounce | zz.owner.e@exmaple.test (typo domain) | Not invited |
| **HH-F** "ZZ Test Household F" | Blk 2 Lot 10 | ZZ Carmela Cruz | zz.treasurer.ho@example.test | Linked · 1 person (S-TREAS-HO) |
| **HH-G** "ZZ Test Household G" (v1.1) | Blk 7 Lot 3 | ZZ Dora Santos | zz.owner.g@example.test | Linked · 1 person (U-DORA), for the deactivate refusal |
| **HH-LEGACY** "ZZ Legacy Household" | Blk 9 Lot 1 | ZZ Legacy Owner | zz.legacy@example.test | Created before the invite functions existed: no `linkStatus`, no `memberCount` |
| **HH-LEGACY-INACTIVE** (v1.1) | Blk 9 Lot 2 | ZZ Legacy Inactive | *(none)* | Seeded **inactive with one member** (U-LEGACY), a shape option (c) never creates; for "Remove works from the Inactive list" |
| **HH-BULK-001 … 400** "ZZ Bulk Household nnn" | Blk 90–99 | ZZ Bulk Owner nnn | zz.bulk.nnn@example.test for 380; none for 20 | Not invited |

| Account | Who | Notes |
|---|---|---|
| U-ANA | Account name **"ZZ Ana R."**, email+password, zz.owner.a@example.test | No household at start. The account name differs from the owner on file on purpose (K22) |
| U-ANA-G | Google emulator account zz.google.a@example.test | For the Google popup path |
| U-CARLO | ZZ Carlo Reyes, zz.family.a2@example.test | Second person for HH-A |
| U-LIZA (v1.1) | ZZ Liza Reyes, zz.family.a3@example.test | Links to HH-A while a Change of owner form is open (U16) |
| U-JUAN | zz.owner.b@example.test | Member of HH-B only |
| U-NEW | zz.newowner.a@example.test | New owner of HH-A after a Remove-based sale (K12) |
| U-ROSA (v1.1) | ZZ Rosa Lim, zz.rosa@example.test | New owner of HH-A after "Change of owner" |
| U-DORA (v1.1) | ZZ Dora Santos, zz.owner.g@example.test | Member of HH-G |
| U-LEGACY (v1.1) | zz.legacy.member@example.test | Member of HH-LEGACY-INACTIVE |
| U-NOREC (v1.1) | zz.norecord@example.test | Auth account with **no `users/{uid}` record** (seeded) |
| U-STRANGER, U-STRANGER-2 | zz.stranger1@ / zz.stranger2@example.test | No household, no role |
| U-RACE-01 … 10 | zz.race.nn@example.test | Parallel redeem |
| S-ADMIN, S-ADMIN-2 | "ZZ Admin One" zz.admin1@ / "ZZ Admin Two" zz.admin2@example.test | Role `admin` (two, for concurrency and the "printed by someone else" notice) |
| S-TREAS | "ZZ Treasurer" zz.treasurer@example.test | Role `treasurer`, no household |
| S-TREAS-HO | zz.treasurer.ho@example.test | Treasurer and member of HH-F (REQ-002 switch) |
| S-BOARD | zz.board@example.test | Role `board` |
| S-GUARD | zz.guard@example.test | Role `guard` |

`.test` is a reserved top-level domain, so no fixture address can reach a real mailbox even if the allow-list failed. "Today" in every case is built from **local Manila today** in the test, not from a hard-coded date; the dates below (Nov 28, 2026 and so on) show the arithmetic. Time-dependent cases seed `expiresAt`, the attempt window or the server's answer delay rather than moving a server clock (QE finding 6).

### Round-trip register

Staff invite → homeowner accepts → staff sees "Linked · n people"; staff change the owner, withdraw, remove or change the settings → homeowners and other screens read the result. One row per field or status value. **(v1.1)** marks a row added or changed for r4–r6.

| # | Field / status | Written where, by whom | Read back where, by whom | Cases |
|---|---|---|---|---|
| 1 | Invitation `status = active` | `createInvites`, from Invite / Resend invitation / Invite selected / Print invite slips / Print slip / Invite another person (Send invitation **or Print slip**, v1.1), by admin or treasurer | Staff: directory pill "Invited · expires {date}" (3A, 3B) and the Invitations line on household detail (4E). Homeowner: the confirm screen "You're joining {lot} ({owner name})" (4C) | E1, E2, C1, H4, J26 |
| 2 | `status = used`, `usedBy`, `usedAt` (**`usedBy` never cleared**, v1.1) | `redeemInvite`, by the homeowner pressing "Yes, link my account" | Staff: 4E Invitations "Used {date}" and People with portal access. Another homeowner: "This invitation was already used…". A member of the household: lands on the dashboard. **The removed person who used it: "Your access to {lot} was removed…" (step 7, needs `usedBy`)** | C6, F1, F3, K11, T7, S13 |
| 3 | `status = replaced`, `replacedBy` | `createInvites` on Resend, Print or a new invite over an expired one, by staff | Homeowner holding the old code: "This invitation was replaced by a newer one…". Staff: **deliberately not listed** on 4E (r5, G-18); audit `invite.replaced`; the second printer's notice (row 27) | G6, I7, A3, K24 |
| 4 | `status = cancelled` + **`cancelReason` withdrawn / removed / owner changed / deactivated** (v1.1) | `cancelInvite` (Withdraw), `removeMember`, `changeOwner`, `setHouseholdActive` (deactivate), by staff | Homeowner holding the code: "This invitation is no longer valid. Ask the admin office." for **every** reason (r5, G-5). Staff: the line leaves the Invitations list (deliberately no pill). `cancelReason` itself: deliberately not shown on a screen; read by the activity log (REQ-006, NG-11) and data checks | A5, A10, K4, U3, J14, T2 |
| 5 | Expired (derived from `expiresAt`, never stored) | Nobody writes it | Staff: pill "Invite expired" on row, phone card and detail; "Invite expired" chip and header count (worked out when read, r5 G-3). Homeowner: "This invitation has expired…" | E4, E6, W5, W8 |
| 6 | `expiresAt` (end of the date shown, Asia/Manila) | `createInvites`, from the expiry settings (row 25) | Staff: "Invited · expires Dec 5, 2026" (year always shown). Homeowner: email "This invitation expires at the end of Dec 5, 2026 (Philippine time).", slip "Expires at the end of Dec 28, 2026 (Philippine time)" | E1, E2, E10, G3, I3 |
| 7 | **`households.inviteExpiresAt`** (v1.1): latest expiry among unused invitations | Recomputed by every writer in the same transaction | Staff: the date in the "Invited · expires {date}" pill; the Invited / Invite expired split in chips and header | W4, W6, S11 |
| 8 | **`slot`** (owner, or `person-{id}`) (v1.1) | `createInvites` (owner slot for Invite, Invite selected, Resend, Print slip, Print invite slips; a new person slot per "Invite another person") | Staff: which invitation a Resend, Print or Withdraw replaces; each Invitations line is one slot ("Sent to … · Co-owner"). Homeowner: deliberately not shown | A11, A12, I8, I9, S6 |
| 9 | `channel`, `sentTo` | `createInvites`, by staff | Staff: 4E Invitations "Sent to: {email}" or "Printed slip". Homeowner: deliberately not shown | G1, J27 |
| 10 | `relation`: **Owner** for the owner slot; **Co-owner / Family** picked for a person slot, no default (v1.1) | `createInvites`; copied to `members.relation` by `redeemInvite` | Staff: 4E People "{relation} · linked {date}"; Invitations line " · Co-owner" / " · Family". Homeowner: deliberately not shown | G20, J3, J6, J27, J29 |
| 11 | Membership `members/{householdId}_{uid}`: `linkedAt`, `inviteId`, `invitedBy` | `redeemInvite` (only creator); deleted by `removeMember`, **`changeOwner`** | `linkedAt`: staff, 4E "linked {date}". Rules (`isMember`): the homeowner's household screens. `invitedBy`, `inviteId`: deliberately not shown; data checks only | C6, S7, U2 |
| 12 | **Membership `name`, `email`**, copied at link time (r5, C-5) (v1.1) | `redeemInvite`, from the signed-in account (source: NG-2) | Staff: "People with portal access" shows "{account name} · {account email}" (the lost-slip safeguard) | K22, K23 |
| 13 | **`memberOf/{uid}.householdIds`** (r4) (v1.1) | `redeemInvite` adds, `removeMember` and `changeOwner` remove, in the same transaction; doc deleted when empty | Rules for announcements, `config/features`, REQ-015 to REQ-017 (TC-16-J9, J10; TC-17). This document proves the writes | Z1–Z6 |
| 14 | `households.memberCount` | `redeemInvite`, `removeMember`, `changeOwner` | Staff: "Linked · 1 person" / "Linked · 2 people"; the deactivate refusal "{lot} still has {n} people linked" | C7, J2, K7, J19, J20 |
| 15 | `households.linkStatus` (linked / email failed / invited / not invited) | Recomputed from invitations and members by every writer: invite functions, `changeOwner`, deactivate and reactivate, mail function on failure (r5, C-3) | Staff: directory pills, phone cards, filter chips, the header "{total} households · {linked} linked · {invited} invited · {expired} invite expired · {failed} email failed · {not invited} not invited" | S5, S10, S11, W1–W9 |
| 16 | Mail document `status`: queued → sent / failed, **or `skipped`** (v1.1, C-4) | `createInvites` writes queued; the mail function writes sent / failed / skipped | Staff: detail line "Queued {date}" / "Sent {date}" / "Email failed"; pill "Email failed" with "Resend invitation" and "Print slip". `skipped`: **deliberately never shown or counted as Email failed**. Never "delivered" | G8, G9, G17, G22, G25 |
| 17 | Mail document code and body cleared | Mail function, after sent, failed or skipped | Deliberately not shown anywhere; proven by a data check | B5, B6, G17 |
| 18 | Bounce (step 2, decision 3) | Mail function from the provider's bounce event | Staff: "Email failed" with "Resend invitation" and "Print slip" | G12 |
| 19 | `auditLog`: `invite.created` / `replaced` / `cancelled` / `redeemed`, `member.removed`, **withdrawal, change of owner, expiry-settings change (old and new values)** (v1.1) | The functions | Board, treasurer: the activity log screen ([REQ-006](../requirements/REQ-006-activity-log.md), TC-06-A8 to TC-06-A10 for the r3 codes; the r5 actions have no code or sentence yet, NG-11). In TC-04 proven at data level | K6, S8, S12, T4, U9, V11 |
| 20 | `inviteAttempts/{uid}` (failures, window start; **set back to 0 by a successful redeem**, v1.1) | `checkInvite`, `redeemInvite` | Homeowner: "Too many wrong codes. Try again in 15 minutes." on the next code. Staff: deliberately not shown (project alert only) | D2, D15, D18, D16 |
| 21 | Household owner name (`displayName`) | REQ-003 edit, **`changeOwner`** (v1.1), by staff | Homeowner: confirm screen "({owner name})", email "Hi {owner name}". Staff: directory, Change of owner done message | C15, K14, U4, U8 |
| 22 | **`households.searchTokens`** (v1.1, C-2) | REQ-003 functions; rewritten by `changeOwner` | Staff: directory name search (REQ-003) | U6 |
| 23 | Contact email and mobile (`householdContacts`) | REQ-003 edit; **replaced by `changeOwner`, blank if not given** (v1.1) | `createInvites` as the recipient; staff: 4E "Sent to", REQ-003 dialog. Homeowner: deliberately never (staff-only) | G1, G18, K13, U4, U24 |
| 24 | Pending code in `sessionStorage` | The app, from the `/join#CODE` fragment | The app after sign-in (confirm screen without typing). Cleared after redeem **and after "No, this isn't my lot"** (v1.1) | P2, P7, P8 |
| 25 | **Expiry settings: email days, print days** (v1.1, decision 6) | `setInviteExpiry`, from Settings → Invitations, by admin office or treasurer | `createInvites` (dates of new invitations: pill, email, slip); the Settings card shows the stored values on reopen; audit holds old and new | V1, V4, V11, E11, E12 |
| 26 | **`config/features.emailInvites`** (v1.1, step 1 / step 2) | The developer (server-written, read-only to clients) | Staff: email controls shown or not shown at all; `createInvites` and the mail function refuse email while off | G19, G23, G24 |
| 27 | **Who printed in the last hour** (v1.1, G-32) | `createInvites` response, from replaced print invitations and `staff/{uid}.displayName` | The second printer: "Slips for {k} of these households were printed in the last hour by {staff name}. Those slips no longer work." | N9, N10, N11 |
| 28 | **Person record `users/{uid}` exists** (v1.1, r6) | The person / the app (REQ-001) | `redeemInvite` refuses linking while it is missing ("We couldn't save your details…") | Y1–Y5 |
| 29 | **Household `active`** (REQ-003) (v1.1) | `setHouseholdActive`, **refused while anyone is linked** (decision 9 c) | `createInvites` (refuses inactive), the code check ("no longer valid"), directory Inactive chip (not in the header total) | J13, J17, J19, W7 |

No read-back cell is empty.

### Invite lifecycle: status enumeration

Rules under test (REQ-004 r5 "Invitation rules", r6): one active invitation per **slot**; unused = active and not expired; "expired" is derived; the **eleven-step code check order** (format → locked → no match → linked to the code's household → linked elsewhere → household deactivated or invitation cancelled → used by this same person, no longer linked → used → replaced → expired → confirm); `redeemInvite` also refuses while the person record is missing, writing nothing (r6). One row per prior state; one column per transition. **Refused** cells are cases too.

**Table 1: invitation document**

| Prior state ↓ / transition → | Invite / Invite selected (owner slot, not a resend) | Resend invitation / Print slip on the **same** slot | Any action on **another** slot | Redeem: new person, no household | Redeem: a member of the code's household (incl. the person who used it) | Redeem: the person who used it, since removed | Redeem: person linked to another lot | Redeem with **no person record** (r6) | Code call gets **no answer for 15 s** (r6) | Expiry time passes | Withdraw | Remove a member | Change of owner | Deactivate household | Reactivate |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **active, unexpired, owner slot** | Skipped, no mail (A1, H5) | Old → replaced, new active, one transaction (G5, G6, I7, I8, N1) | Unaffected (A12, I9) | → used, member + `memberOf`, Linked (C5–C7, Z1) | Dashboard; code **not** consumed (J12) | n/a | **Refused** already linked; stays active (J7, J8) | **Refused** "We couldn't save your details…"; stays active; nothing written (Y1–Y4) | Stays active (check, Y11); active, or used by **this** person only (redeem, Y14, Y15) | Becomes expired, nothing written (E4, E6) | → cancelled / withdrawn (A5, T2) | → cancelled / removed (K4) | → cancelled / owner changed (U3) | Nobody linked: → cancelled / deactivated (J13, J14) | n/a |
| **active, unexpired, person slot** | Unaffected: owner slot only (A12) | Only this slot replaced (A12, J31) | Unaffected by owner print (I9) | → used, Linked · n+1 (J2) | Dashboard; not consumed (J12) | n/a | **Refused** (J7) | **Refused**; stays active (Y3) | As above | Expired | → cancelled (T2, A12) | → cancelled (K4) | → cancelled (U3) | **Refused** while anyone is linked (J19) | n/a |
| **active, expired** | **Not skipped**: new active, old → replaced (A3) | New active; old code "replaced" (G7, C23) | Unaffected | **Refused** "expired", not counted (E4, D7) | Dashboard (F11) | n/a | Already linked (order step 5 before 10; J7's rule) | Refused; which message wins: NG-3 | n/a | No change | Actions on an expired line: NG-9 (A7) | → cancelled (K4) | → cancelled (U3) | "No longer valid" wins over expired (C21) | n/a |
| **used, person still linked** | Household Linked: skipped (H7, I10) | Not offered; **refused** (A4) | n/a | **Refused** "already used" (F1, F2) | Dashboard, no second member (F3, F4, C28) | n/a | **Refused** already linked (C20) | n/a (a linked person had a record) | n/a | No change; member kept (A8) | **Refused**; no control (A6, T7) | Stays used; `usedBy` kept (S13) | Stays used; `usedBy` kept (S13, U18) | **Refused**: someone linked (J19) | n/a |
| **used, person since removed** | Household Not invited: allowed (K12) | n/a | n/a | **Refused** "already used" (K11 second half) | A new member of the household: dashboard (step 4) | **Refused** "Your access to {lot} was removed…", not counted (K11, U18) | Already linked | n/a | n/a | No change | **Refused** (A6) | n/a | Stays used | Allowed if nobody else is linked (J22) | n/a |
| **replaced** | n/a (newer active exists) | Applies to the newest only (N1) | n/a | **Refused** "replaced", not counted (G6, D9) | Dashboard (step 4) | n/a | Already linked | n/a | n/a | No change | Not listed, so not offered (K24); server: A7 | No change | No change | No change | No change |
| **cancelled** (any reason) | New invite allowed (K12, T3) | n/a | n/a | **Refused** "no longer valid" (K4, J13, A5), not counted (D9) | Dashboard (step 4 before 6) | Step 6 before 7: "no longer valid" (C22 rule) | Already linked | n/a | n/a | No change | Already cancelled: "done", no second entry (A7) | No change | No change | No change | **Not revived** (J16) |
| **household inactive** (any invitation) | **Refused**, no controls (J17) | **Refused** (J17) | **Refused** (J17) | **Refused** "no longer valid" (J13, J15) | Option (c): nobody is linked; old data only (J25) | Already linked or no longer valid | Already linked | n/a | n/a | No change | n/a | Allowed from the Inactive list (old data, J25) | Offered on an inactive household? NG-8 | n/a | → active; codes stay dead; Not invited (J16) |

**Table 2: invitation email (`mail` document), Step 2**

| Prior mail state ↓ / event → | Provider accepts hand-off | Provider refuses hand-off | Its turn comes but the invitation is no longer active (v1.1, C-4) | Bounce event later (decision 3) | Resend invitation | Print slip (same slot) | Redeem |
|---|---|---|---|---|---|---|---|
| **queued** | → sent; code and body cleared (B5) | → failed; code cleared; pill "Email failed" with "Resend invitation", "Print slip" (B6, G9) | → **skipped**; not handed over; code and body cleared (G17) | n/a | Old mail is skipped at its turn; only the new one is handed over (G17) | Email invitation replaced; its mail skipped at its turn (G11, G17) | Possible if the code is known; household Linked |
| **sent** | n/a | n/a | n/a | → failed; "Email failed" (G12) | Old code "replaced" (G5, G6) | Old code "replaced" (G11) | → Linked |
| **failed** (hand-off) | n/a | n/a | n/a | Duplicate signal ignored (G14) | New mail queued; pill Invited (G10, G18) | New print code; pill Invited (G11) | n/a in practice |
| **failed** (bounced) | n/a | n/a | n/a | Repeat event ignored, one state (G14) | As above (G10) | As above (G11) | Redeemed before the bounce: member kept, stays Linked (G14) |
| **skipped** (v1.1) | n/a (terminal) | n/a | n/a | n/a | n/a | n/a | n/a. Never shown or counted as Email failed (G25) |

**Table 3: household link-status pill** (r5 order: Linked · {n} → Email failed → Invited · expires {latest} → Invite expired → Not invited; never "Linked · 0 people")

| From ↓ | Event | To | Case |
|---|---|---|---|
| Not invited (or field missing) | Invite / Print slip | Invited · expires {date} | E1, E2, S1 |
| Invited | Redeem | Linked · 1 person | C7 |
| Invited | End of the expiry date passes, Manila (nothing written) | Invite expired | E6, W8 |
| Invited (email) | Refused at hand-off / bounced | Email failed | G9, G12 |
| Invite expired | Resend / Print slip / Invite selected / Print invite slips | Invited · expires {new date} | A3, G7 |
| Email failed | Resend / Print slip | Invited · expires {new date} | G10, G11 |
| Invited, its only invitation | Withdraw | Not invited | T3 |
| No one linked, unused owner invitation | A co-owner's email fails | Email failed | W3 |
| No one linked, unused owner invitation | A co-owner's invitation expires | Invited · expires {owner date} | W4 |
| Linked · 1 person | Another person invited, failed or expired | Stays Linked · 1 person | W1, W9 |
| Linked · 1 person | Second redeem | Linked · 2 people | J2 |
| Linked · 2 people | Remove one | Linked · 1 person | K7, K15 |
| Linked · 1 person | Remove the last | Not invited (never "Linked · 0 people") | K7, S9 |
| Linked · {n} | Change of owner | Not invited | U7 |
| Not linked (any) | Deactivate | Inactive chip only; out of the header total | J14, W7 |
| Linked · {n} | Deactivate | **Refused**; stays Linked · {n} | J19, J21 |
| Inactive (no members) | Reactivate | Not invited; old codes stay dead | J16 |

**Table 4: deactivation, decision 9 option (c)** (v1.1). Rule: "Deactivation is refused while anyone is linked."

| Household before | Deactivate | Reactivate afterwards | Case |
|---|---|---|---|
| Active, no one linked, no invitation | Inactive | Not invited | J22, TC-03-H11 |
| Active, no one linked, unused invitations | Inactive; every unused invitation → cancelled / deactivated | Not invited; codes "no longer valid" for good | J13, J14, J16 |
| Active, 1 person linked | **Refused**: "{lot} still has 1 person linked. Remove them first, or use Change of owner." | n/a | J19, J21 |
| Active, 2 or more linked | **Refused**: "{lot} still has {n} people linked…" | n/a | J20 |
| Active, someone links while the confirm is open | **Refused** by the server | n/a | J23, J24 |
| Inactive with a member (old data only) | n/a | "Remove" works from the Inactive list | J25 |

---

## Test plan

### 1. Smoke

The standing smoke pass (`smoke.spec.js`) covers the mock-up's role menus only. This change adds role-visible areas it doesn't cover. **Smoke additions for QE:**

1. A signed-in account with no household and no role lands on the page headed **"Enter your invite code"** (REQ-001 r4: one page) with its hint and field; no page error.
2. **`/join#{code}`** with a fixture code opens the **confirm screen** "You're joining … Is this your lot?" for a signed-in account with no household (Step 1 only if Step 1 ships `/join`: NG-14).
3. **Household detail (4E)** opens for admin office staff and for the treasurer, showing "People with portal access", "Invitations" and **(v1.1)** the "Change of owner" button.
4. The Homeowners directory shows a link-status pill on every row and the "Invite selected" and "Print invite slips" actions. (TC-03's smoke already loads the directory; add only these.)
5. **(v1.1)** **Settings → Invitations** card opens for admin office staff and for the treasurer, with both fields and "Save" (read-only: don't press Save).
6. **(v1.1)** In a **step-1** build the directory shows "Print slip" and "Print invite slips" and no email control.

### 2. Acceptance

Every Gherkin scenario in REQ-004 r6 maps to at least one case. **(v1.1)** rows are new or changed in r4–r6.

| REQ-004 scenario | Cases |
|---|---|
| Send an invitation (r5 changed: relation "Owner") | G1, E1, G8, G20 |
| Accept an emailed invitation (incl. Google) | P2, P3, P4, C5, C7 |
| Enter a printed code | C1, C2, C3 |
| A wrong code | C12 |
| Guessing codes is stopped | D1–D6, D11 |
| An expired code | E3, E4, E6 |
| A code can be used only once | F1, F2 |
| The person who used a code enters it again (r5 changed: only while linked) | F3, F4, F11 |
| Two people redeem the same code at the same moment | F8, F9 |
| Resending replaces the old invitation | G5, G6, N1 |
| A second person in the same household (r5 changed) | J1, J2, J3, J29 |
| A person already linked to another lot | J7, J8 |
| A code for a deactivated household | J13, J14 |
| Invite many households at once (r5 changed) | H1–H5 |
| Print code slips (r5 changed: owner-slot wording, "Printing…") | I1–I6, I12 |
| Removing a person after a sale (r5 changed: "within a minute") | K1–K8, K18 |
| An email the provider refuses is shown, not hidden (r5 changed: "Resend invitation") | G9 |
| An email that bounces later is shown (decision 3) | G12 (Blocked — provider) |
| (v1.1) A household turns "Invite expired" with no one doing anything | E6, W8 |
| (v1.1) An expired invitation does not block a new one | A3, G7 |
| (v1.1) Which status a household shows (7 rows) | W1, W2, W3, W4, W5, K7, S1 |
| (v1.1) The directory header counts add up | S10, W7 |
| (v1.1) Expiry dates show the year and say when they end | E10, G3, I3, R3 |
| (v1.1) The household detail shows each email's status | G22, G8 |
| (v1.1) Printing a slip replaces the owner's emailed invitation, not another person's | I8, I9 |
| (v1.1) Linked households are skipped by bulk invite and bulk print | H7, H17, I10, A2 |
| (v1.1) The bulk invite confirm reads correctly for any mix (6 rows) | H8, H6, H13, H14 |
| (v1.1) The counts are what is actually done | H4, H15 |
| (v1.1) The print confirm says how many earlier invitations stop working | I15, I14 |
| (v1.1) Two staff print slips for the same household at about the same time | N3, N9 |
| (v1.1) Resend after the contact email is corrected | G18 |
| (v1.1) Resend while the earlier email is still waiting to go out | G17, G25 |
| (v1.1) Buttons that make or stop invitations act once (6 rows) | N12, N13, N14, I12, T6, U10 |
| (v1.1) Withdraw an unused invitation | T1, T2, T3, T4, A5 |
| (v1.1) A used invitation can't be withdrawn | T7, A6 |
| (v1.1) Only admin office staff and the treasurer can withdraw | M4, M18, P11 |
| (v1.1) A removed person re-entering her own used code does not get back in | K11 |
| (v1.1) Someone else entering a removed person's used code | K11 |
| (v1.1) A linked person enters another unused code for their own household | J12 |
| (v1.1) A code the page can tell is not a code (4 rows + server) | C13, C14, C16, C17, C18 |
| (v1.1) A successful link clears earlier wrong codes | D15, D18 |
| (v1.1) Codes entered while locked don't extend the lock | D6 |
| (v1.1) Which message wins when several apply (6 rows) | C19, C20, C21, C22, C23, F11 |
| (v1.1) The connection fails while checking or linking (4 rows) | C24, C25, C26, C27 |
| (v1.1) Pressing "Yes, link my account" again after a lost reply | C28, F6 |
| (v1.1) "No, this isn't my lot" clears the code | C10, C11, P8 |
| (v1.1, r6) Linking is refused while the person record is missing | Y1–Y5, Z2 |
| (v1.1, r6) A code call that gets no answer gives up after 15 seconds (2 rows) | Y8–Y17 |
| (v1.1) Change of owner after a sale | U1–U10 |
| (v1.1) The new owner sees her own name on the confirm screen | K14 |
| (v1.1) The change of owner form keeps what was typed | U11, U12, U14 |
| (v1.1) Someone joins or leaves while the change of owner form is open (C-1) | U16, U17 |
| (v1.1) After the last person is removed | K7, K20, K21 |
| (v1.1) Removing someone who was already removed | K8 |
| (v1.1) Who the household detail lists | K22, K23, K24 |
| (v1.1) Changing how long invitations last | V1, E11, E12, V11 |
| (v1.1) Expiry days must be a whole number from 1 to 90 (7 rows) | V3, V4, V5, V6, V7, V8 |
| (v1.1) Board members, guards and homeowners can't change expiry | V9, V10 |
| (v1.1) With no setting stored, the defaults apply | E13 |
| (v1.1) Before the email provider is chosen (step 1) | G19, G23, G24, J30 |
| (v1.1) Inviting another person by slip (decision 8) | J26, J27, J28 |
| (v1.1) The relation must be picked | J29, J6 |
| (v1.1) Deactivating a household that still has people linked (decision 9 c) | J19, J20, J21, J22, J23 |
| (v1.1) People linked to a household that is deactivated (option a) | **Not adopted: no case** (the REQ says "don't build or test it") |
| (v1.1) Deactivating stops codes for good (C-3) | J16, J17 |
| (v1.1, r4) `memberOf` kept by `redeemInvite` and `removeMember` (and `changeOwner`, r5) | Z1–Z6 |

### 3. Regression

What else could break, and why:

- **Household access is decided by `members` documents** (ADR-004), and since r4 also by **`memberOf/{uid}`** for announcements, `config/features` and the REQ-015 to REQ-017 rules. A redeem, remove or change-of-owner bug either leaks one family's finances to another (SA-001 R-6), locks a family out, or leaves a removed owner reading announcements. Re-run TC-02's rules matrix, TC-16-J9, TC-16-J10, TC-16-J12, TC-16-J13 and TC-17's `memberOf` rows after the invite functions land.
- **Directory (REQ-003 / TC-03)**: pills, filter chips, header counts, phone cards, **deactivate (now refused while anyone is linked: decision 9 c)**, reactivate, edit owner name and contacts, name search. **Change of owner writes `displayName`, `searchTokens` and `householdContacts`**, the same fields REQ-003's edit writes: re-run TC-03 blocks G (edit, stale edit), H (deactivate, reactivate) and J (search). TC-03-H7, TC-03-H14, TC-03-H19 and TC-03-K30's "with members" half assume a linked household can be deactivated; that now conflicts with REQ-004 (NG-1).
- **Sign-in (REQ-001 / TC-01)**: the page headed "Enter your invite code", Google popup, sign-out on a shared phone. **`redeemInvite` now reads `users/{uid}`** (r6), so TC-01-F11, TC-01-F20, TC-01-F21 (missing record, 15-second save) and J11–J18 (the `users` rule) are part of this flow. TC-01-F20 and TC-04-Y2/Y3 prove the same refusal from two sides: QE should run it once and report both ids.
- **Roles (REQ-002 / TC-02)**: no-access page for homeowners and board; treasurer-who-is-also-a-homeowner (S-TREAS-HO); a removed staff role must not invite, withdraw, remove, change the owner or the settings.
- **Settings page (REQ-007 / TC-07)**: the new Invitations card sits on the shared Settings screen next to the dues and payment settings. Re-run TC-07's settings save, role and navigation cases: a shared Save or a shared form state could leak between cards.
- **Activity log (REQ-006 / TC-06)**: the invite functions write through the shared audit helper; withdraw, change of owner and the expiry change are new writers with no code yet (NG-11). Re-run TC-06-A8 to TC-06-A10 and TC-06's allow-list case.
- **Shared code style and normalisation**: invite codes look like guest-pass codes (`.code`, `XXXX-XXXX`, same alphabet). If Dev shares a code-input or normaliser, re-run the guest pass display and the guard's manual pass-code entry.
- **Mail queue (ADR-002)** is shared with every later email feature: the new `skipped` status and the "is it still active?" check before hand-off must not change other emails.
- **15-second limit**: the same pattern as REQ-001's "Continue" and REQ-005's privacy notice (TC-05). A shared call wrapper with a timeout could change their behaviour.
- **Open defect DEF-001** (no viewport meta): the join screens and the new staff forms are 375 px single cards; Q6 and Q16 must pass on the `mobile` project.

**Not affected:** billing runs (REQ-008), statements, payments and receipts (REQ-009 to REQ-014: no payment data exists in R1; decision 5 stays open, block L), amenities, vehicles, guest passes and the guard gate. No change to their data or screens.

**Existing specs and screens QE should re-run:** `tests/specs/ui/smoke.spec.js` (SMK-admin-nav, SMK-admin-homeowners, SMK-owner-*), `tests/specs/ui/navigation.spec.js` NAV-03 (one `aria-current`), NAV-05 (important announcement pop-up), NAV-06 (Escape closes a modal), NAV-07 / NAV-08 (375 px, DEF-001), `tests/specs/ui/vehicle-registration.spec.js` VEH-J1 (homeowner data scoped to the household); TC-01-F11, TC-01-F20, TC-01-F21, TC-01-J11 to TC-01-J18, TC-01-Q11; TC-02 rules matrix; TC-03 blocks G, H, J and TC-03-K30 to TC-03-K32; TC-06-A8 to TC-06-A10; TC-07 settings save and roles; TC-16-J9, TC-16-J10, TC-16-J12, TC-16-J13; guest pass and guard Scan Pass screens.

### Known failure patterns, checked

| Pattern | Applies? | Cases |
|---|---|---|
| Copy promises what the code doesn't do | Yes: "invitations queued", "Any that fail are marked Email failed", "Its code stops working at once", "Everyone linked … loses access at once", "Saved. New invitations use these dates.", "The slips weren't made" (NG-7), "We couldn't link your account" after a late success | G8, H3, I7, I11, K2, T2, U2, U3, V1, I16, Y15 |
| A value written for one role, never shown back | Yes: relation, the account name and email on the membership, `cancelReason`, `memberOf`, expiry settings, who printed | Register rows 4, 10, 12, 13, 25, 27; J3, K22, Z1, V1, N9 |
| Status-gated rule checked for one transition only | Yes: redeem (eleven-step order plus the person record), resend, withdraw, remove, change of owner, deactivate | Status enumeration Tables 1–4; A-, C-, T-, U-, J19–J25 |
| Same concept, different word on another screen | Yes: "Resend invitation" never "Resend"; "withdraw" on screen, `cancelled` in data, "Cancel" only closes dialogs; dates always with the year | R2, R3, G9, T1 |
| Dates computed in UTC where the user means local | Yes: end of day Manila; created after Manila midnight; 1-day setting | E3–E7, V4, W8 |
| A derived figure doesn't refresh after a related write | Yes: `linkStatus`, `inviteExpiresAt`, `memberCount`, header counts, search tokens after a change of owner | C7, K7, S4, S5, S11, U6, W8 |
| Zero and "not set" look the same | Yes: `memberCount` 0 vs missing; expiry setting missing vs 0; empty contact after change of owner | S1, S9, E13, V3, U24 |
| A write silently refused by security rules | Yes: every refused role and client write; deactivation refused while linked; missing-record refusal | M-block, J21, U20, V10, Y2 |
| Double-tap / two devices create duplicates | Yes: Yes-link, Invite, Resend, Send invitation, Print, Withdraw, Change owner, Save, Remove | F5, F6, F7, H2, I12, K8, K9, N1, N2, N12–N14, T6, U10, V13 |
| Stale reference | Yes: confirm screen open while code replaced, expired, deactivated; Change of owner form while someone joins or leaves; deactivate confirm while someone links; withdraw while someone redeems | E16, J15, J23, N6, N8, N15, T8, U16, U17 |
| Backdrop click loses work or leaves stale state | Yes: Invite another person, Change of owner, Remove and print confirms | J5, U14, K10, I11 |
| A modal appearing mid-flow blocks the next action | Yes: announcement pop-up after redeem | P15 |
| Assumed SDK/network behaviour baked into a case | Yes: offline vs no answer, a late answer after the 15-second give-up (NG-4), sessionStorage across the Google popup, provider events | P4, H11, G12, Y10, Y16 (assumptions marked) |
| Data leaking across households or roles | Yes, the core risk; plus the seller's name and contacts after a change of owner | C8, K11, K13, K14, U5, M-block, L-block |

### Scenario list by mandatory type

- **Negative**: wrong, empty, malformed, expired, used, replaced, cancelled, withdrawn, deactivated and already-linked codes; removed person's own code; locked account; refused roles; refused direct writes; Resend or Withdraw on used; double remove; deactivate while linked; change of owner with no name or a bad email; expiry 0, 91, −3, 7.5, empty; linking with no person record. C12–C14, C16, C17, D2, D3, E4, F1, G6, J7, J13, J19, K8, K11, A4, A6, U11, U12, V3, V6, V7, Y1, M-block.
- **Boundary**: 5th vs 6th wrong code; 14:59 vs 15:00 after the first refusal; 23:59:59 vs 00:00:00 Manila; created after Manila midnight; year end; leap day; expiry setting 0 / 1 / 90 / 91; bulk outline rows (m = 0, n = 1, n = 0, all skipped); print notice at 59 vs 61 minutes; 1 person vs 2 people (pill and the deactivate refusal); last member removed; owner name at the REQ-003 maximum; a code call answered at 14 s, at 15 s and after it. D1, D2, D4, D5, D14, E3–E8, V3–V6, H8, H13, H14, N10, R4, J20, K7, U13, Y8–Y13.
- **Usability**: labelled monospaced code field, paste, errors announced, "Checking…" and "Linking…", format and connection messages under the field, 375 px single cards for join screens and staff forms, tap targets, focus into and back out of every modal, pills with text, slip legibility, error messages say what to do. Q-block, C18, I13, R1, R7.
- **Navigation**: landing on "Enter your invite code", `/join#CODE` through each sign-in method, refresh mid-flow, code cleared after link and after "No", after-save landing, Back, staff detail and back (lot name opens the detail on every row), Settings → Invitations, Change of owner and Cancel, removed person's screen changing within a minute, homeowner blocked from Homeowners and Settings by URL. P-block, K18, U15, V14.

---

## Layer legend (QE)

QE filled in each case's **Layer** at triage on 2026-11-28. Nothing else in a case was changed. The reasons, the Unit list for Dev, the locator contract, the spec list, the automation order and the findings are in **QE triage** at the end. Rows, with each case's status (Planned, Deferred to Step 2, or Blocked), are in [COVERAGE-MAP.md](COVERAGE-MAP.md).

| Layer | Meaning here | Owner |
|---|---|---|
| **Unit** | Vitest on a plain module (no DOM, no Firebase, no network): code format and normalising, the wrong-code window, expiry dates in Manila, link-status pills and the actions each state offers, join error copy, email and slip templates, in-flight guards behind an injected port | Dev writes, QE reviews |
| **API** | The Auth, Firestore and Functions emulators, called directly (callable functions, `@firebase/rules-unit-testing`, Admin SDK reads of function-only collections). The mail provider is the emulator stub. No browser | QE |
| **API (staging)** | The same kind of test on `hoa-portal-staging`, because only staging has the mail allow-list (G15) | QE |
| **UI** | Playwright against the emulator-backed app: what only a browser shows, plus the wiring from a click to a function. *(mobile)* rows run in the `mobile` project | QE |
| **Journey** | One end-to-end happy path for the flow, crossing layers on purpose: print a slip → enter the code → link → staff see "Linked · 1 person" (C7) | QE |
| **Manual (staging)** | Run by hand on staging (the project-wide wrong-code alert, D16) | QE |
| **Manual** | Physical print, a real phone keyboard, or an exploratory charter | QE |

**Email is asserted at the `mail` queue** (recipient, subject, status, body while queued), never as delivered mail. **Time:** exact boundaries (23:59:59 vs 00:00:00 Manila, 14:59 vs 15:00, year end, leap day) are proven at Unit. API cases that need time to have passed seed `expiresAt` or the attempt window with the Admin SDK instead of moving a server clock.

---

## A. Lifecycle transitions not covered elsewhere

#### TC-04-A1: A second Invite for a household whose owner slot has an unused invitation makes no new code
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff (S-ADMIN). **Tags:** Step 2 · Provisional — not yet in SA-001: invitation `slot` (SA-001 §8.1 still says "household and recipient")
- **Setup:** HH-A has one active, unexpired emailed invitation in its owner slot.
- **Action:** Call `createInvites` for HH-A, not as a resend (as "Invite" or "Invite selected" would).
- **Expected:** The household is reported as skipped; HH-A still has exactly one active owner-slot invitation, the original one; no new `mail` document; the original code still opens the confirm screen.
- **Don't assert:** the exact wording of the skip reason in the function response.

#### TC-04-A2: A household with an active invitation offers "Resend invitation", not "Invite"
**Priority** P2 · **Type** UI/UX · **Layer** Unit · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2
- **Setup:** HH-A invited by email (active).
- **Action:** Open the directory row and household detail for HH-A.
- **Expected:** "Resend invitation" is offered; "Invite" is not.
- **Don't assert:** button position or colour.

#### TC-04-A3: A household whose only invitation expired is invited again, and its old code reads "replaced"
**Priority** P2 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2 (r5, G-1)
- **Setup:** HH-A's only invitation is active but past its expiry (pill "Invite expired").
- **Action:** Include HH-A in "Invite selected" (Step 2) or "Print invite slips" (Step 1); then enter the old code.
- **Expected:** HH-A is **not** skipped; it gets a new active invitation and shows "Invited · expires {new date}". The old invitation is `replaced`, and its code shows "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office." (r5: replaced wins over expired, check order step 9 before 10).
- **Don't assert:** the new date's value beyond "today + the channel's days".

#### TC-04-A4: Resend is refused for a used invitation, and the member stays linked
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Setup:** U-ANA linked to HH-A with her email invitation (status used).
- **Action:** Check that 4E shows no Resend on the used row; then call `createInvites` as a resend for that used invitation's slot.
- **Expected:** No Resend control on the used row. The call does not change the used invitation (still `used`, same `usedBy`); U-ANA's membership still exists; `memberCount` unchanged.
- **Don't assert:** whether the call errors or returns "skipped".

#### TC-04-A5: Withdrawing an active invitation makes its code "no longer valid"
**Priority** P2 · **Type** Happy path · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-5)
- **Setup:** HH-A has an active printed invitation.
- **Action:** Call `cancelInvite` for it (the call "Withdraw" makes; the screen is T1–T3); then U-STRANGER enters the code.
- **Expected:** The invitation is `cancelled`; U-STRANGER sees "This invitation is no longer valid. Ask the admin office."; no member is created; not counted towards the limit; one `invite.cancelled` audit entry.
- **Don't assert:** the cancel reason here (A10).

#### TC-04-A6: Cancelling a used invitation is refused and the member stays linked
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** U-ANA linked to HH-A.
- **Action:** Call `cancelInvite` on her used invitation.
- **Expected:** Refused; invitation stays `used`; U-ANA can still read HH-A.
- **Don't assert:** error code text.

#### TC-04-A7: Withdrawing an invitation that is already cancelled, or replaced, changes nothing
**Priority** P3 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** — (r5, Sol Arch Q6) · NG-9 for the expired case
- **Setup:** Three HH-A invitations: one replaced, one cancelled, one active-but-expired.
- **Action:** Call `cancelInvite` on each.
- **Expected:** Cancelled: returns done and writes nothing, so there is no second `invite.cancelled` audit entry. Replaced: stays `replaced`. Every code is still refused.
- **Don't assert:** whether the expired one may be withdrawn, or whether its line offers "Withdraw invitation" (NG-9).

#### TC-04-A8: When a used invitation's expiry date passes, the member stays linked
**Priority** P1 · **Type** Boundary · **Layer** API · **Writes** No
**Role:** Homeowner (U-ANA). **Tags:** Step 1 · Staging note: controllable server clock
- **Setup:** U-ANA linked to HH-A with an invitation expiring Dec 5, 2026.
- **Action:** Move server time to Dec 6, 2026 00:00:01 Manila; U-ANA opens her dashboard.
- **Expected:** U-ANA sees HH-A's dashboard; her membership is unchanged; HH-A's pill is still "Linked · 1 person", not "Invite expired".
- **Don't assert:** dashboard content beyond the lot.

#### TC-04-A9: Stored invitation status only ever holds active, used, replaced or cancelled
**Priority** P3 · **Type** Data integrity · **Layer** API · **Writes** No
**Role:** none (data check after the A–K blocks). **Tags:** —
- **Setup:** Run after the other blocks on the emulator.
- **Action:** Read every `invites` document created by this run.
- **Expected:** Every `status` is one of `active`, `used`, `replaced`, `cancelled`; none is `expired`; every one has `expiresAt`.
- **Don't assert:** counts of each status.

#### TC-04-A10: Every cancellation stores the reason that caused it
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 1 (r5 Data "Invitation") · Provisional — not yet in SA-001: `cancelReason`
- **Setup:** Four fixture households, each with an unused invitation and no one linked except where the action needs it.
- **Action:** Withdraw one (T2); remove the only member of the second, which has an unused person-slot invitation (K4); run Change of owner on the third (U3); deactivate the fourth (J14).
- **Expected:** Each cancelled invitation's cancel reason is, in order, withdrawn, removed, owner changed, deactivated; every code shows the same "no longer valid" message.
- **Don't assert:** the stored spelling of the reason values.

#### TC-04-A11: Every invitation records its slot: the owner slot, or one person slot per "Invite another person"
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 1 and 2 (r5, G-4, G-16) · Provisional — not yet in SA-001: invitation `slot`
- **Action:** For HH-A: Print slip on the row; Resend invitation; Invite another person twice (Co-owner, then Family). Read the invitations.
- **Expected:** The row print and the resend are in the owner slot (the second replaced the first); the two "Invite another person" invitations are in two different person slots, both active.
- **Don't assert:** the person-slot id format.

#### TC-04-A12: Resend, Print slip and Withdraw on an Invitations line act on that line's slot only
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2 (r5 Invitation rules "Slots")
- **Setup:** HH-A not linked, with an unused owner invitation and an unused person-slot invitation for U-CARLO.
- **Action:** On Carlo's line press "Print slip" and confirm; then enter both the owner code and Carlo's old code.
- **Expected:** Only Carlo's invitation is replaced: his old code reads "replaced", the owner code still opens the confirm screen. Repeating with "Withdraw invitation" on Carlo's line leaves the owner code working too.
- **Don't assert:** —

## B. Code generation, storage and secrecy

#### TC-04-B1: Generated codes are 8 characters from the 32-character alphabet, shown as XXXX-XXXX
**Priority** P1 · **Type** Data integrity · **Layer** Unit · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** 1,000 fixture households (or repeated print runs).
- **Action:** Print slips (or create invitations) and collect every displayed code.
- **Expected:** Every code is `XXXX-XXXX`; every character is in `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`; none contains 0, O, 1 or I.
- **Don't assert:** any particular code value.

#### TC-04-B2: 1,000 generated codes are all different
**Priority** P2 · **Type** Data integrity · **Layer** Unit · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Setup / Action:** As B1.
- **Expected:** No two codes are equal after normalisation; each opens the confirm screen for the lot it was printed with.
- **Don't assert:** distribution or randomness statistics.

#### TC-04-B3: No invitation document holds the plain code
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** Admin office staff creates; QE reads with admin SDK. **Tags:** Step 1 · Staging note: console / admin SDK access
- **Setup:** Print a slip for HH-A; note the code shown.
- **Action:** Read the new `invites` document (id and every field).
- **Expected:** Neither the id nor any field equals the code, its normalised form (`K7QXM9TA`) or its displayed form; `householdId`, `channel`, `status`, `expiresAt` are present.
- **Don't assert:** the hash value.

#### TC-04-B4: The invitation id is a keyed hash, not a plain hash of the code
**Priority** P2 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** QE data check. **Tags:** —
- **Setup:** As B3.
- **Action:** Compute unkeyed SHA-256 (hex and base64url) of the normalised code and compare with the document id.
- **Expected:** No match. The emulator/staging key is not the production key (separate secret).
- **Don't assert:** the key value or HMAC output.

#### TC-04-B5: The email's code and body are removed from the mail document once it is sent
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** Admin office staff invites; stub provider accepts. **Tags:** Step 2
- **Setup:** Stub provider set to accept.
- **Action:** Invite HH-A; read the `mail` document while queued and after the mail function runs.
- **Expected:** While `queued`, the document holds the recipient, subject and body with the code. Once `sent`, the code and the body are gone; status, recipient and timestamps remain.
- **Don't assert:** the provider message id format.

#### TC-04-B6: The email's code and body are removed from the mail document when hand-off fails
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** As B5. **Tags:** Step 2
- **Setup:** Stub provider set to refuse.
- **Action:** Invite HH-A; let the mail function run.
- **Expected:** Status `failed`; code and body gone.
- **Don't assert:** the provider's error text.

#### TC-04-B7: Invitation audit entries hold no codes, contacts or homeowner names
**Priority** P2 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** QE data check after A–K and T–V. **Tags:** NG-11 (staff `actorName`)
- **Action:** Read every `auditLog` entry with an `invite.*`, `member.removed`, withdrawal, change-of-owner or expiry-settings action.
- **Expected:** No entry contains a code, an email address, a phone number, the owner name on file or a homeowner's account name; each has actor id, household id (where one applies), action and time.
- **Don't assert:** the staff `actorName` / `actorRole` that REQ-006 copies onto entries (REQ-004 says "ids only": NG-11); field names beyond those.

#### TC-04-B8: Function logs contain no code and no email address
**Priority** P2 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** QE reads emulator function logs. **Tags:** (CS-14)
- **Action:** Run create, check (right and wrong code), redeem and the mail function; collect logs.
- **Expected:** No log line contains a code (any form) or a recipient email address.
- **Don't assert:** log format.

#### TC-04-B9: The email link carries the code after `#`, never in the path or query
**Priority** P1 · **Type** Security · **Layer** UI · **Writes** Yes
**Role:** Admin office staff invites; homeowner opens the link. **Tags:** Step 2
- **Setup:** Read the queued mail body for HH-A.
- **Action:** Inspect the "Join the portal" link; open it and capture the requests sent to Hosting.
- **Expected:** The link is `{portal}/join#{code}`; no request URL, query string or `Referer` header carries the code.
- **Don't assert:** whether the fragment includes the hyphen.

#### TC-04-B10: Printing stores no slip PDF on the server
**Priority** P2 · **Type** Security · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Print slips for HH-C; then list Storage and any new Firestore documents.
- **Expected:** No PDF or code list is stored in Storage or Firestore; the PDF is built in the browser from the function response.
- **Don't assert:** PDF library or file name.

#### TC-04-B11: Staff cannot see an existing code again after it is made
**Priority** P1 · **Type** Security · **Layer** API · **Writes** No
**Role:** Admin office staff and treasurer. **Tags:** Step 1
- **Setup:** HH-A has an active printed invitation.
- **Action:** Open 4E for HH-A; read HH-A's invitations as staff through the allowed query.
- **Expected:** No screen and no readable field shows the code. The only way to get a code is a new print or resend.
- **Don't assert:** layout of the invitation list.

## C. Code entry, confirm and redeem (Step 1 core)

#### TC-04-C1: A printed code typed in lower case with a space opens the confirm screen
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
**Role:** Homeowner without a household (U-ANA). **Tags:** Step 1
- **Setup:** A printed slip for HH-A; note its code, e.g. `K7QX-M9TA`.
- **Action:** On "Enter your invite code" type `k7qx m9ta` and submit.
- **Expected:** "You're joining Blk 2 Lot 7 (ZZ Ana Reyes). Is this your lot?" with "Yes, link my account" and "No, this isn't my lot".
- **Don't assert:** the specific code value.

#### TC-04-C2: The code is accepted in its printed form with the hyphen
**Priority** P2 · **Type** Boundary · **Layer** Unit · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Enter `K7QX-M9TA`.
- **Expected:** Confirm screen for HH-A.
- **Don't assert:** —

#### TC-04-C3: The code is accepted with no separator
**Priority** P2 · **Type** Boundary · **Layer** Unit · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Enter `K7QXM9TA`.
- **Expected:** Confirm screen for HH-A.
- **Don't assert:** —

#### TC-04-C4: Leading, trailing and mixed spaces and hyphens are ignored
**Priority** P3 · **Type** Boundary · **Layer** Unit · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Enter `  k7qx - m9ta  ` and `K7-QX-M9-TA`.
- **Expected:** Both open the confirm screen for HH-A.
- **Don't assert:** that other punctuation is accepted (not specified).

#### TC-04-C5: "Yes, link my account" lands the person on the lot's dashboard
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** Yes
**Role:** Homeowner without a household (U-ANA). **Tags:** Step 1
- **Setup:** Confirm screen for HH-A (C1).
- **Action:** Press "Yes, link my account".
- **Expected:** U-ANA lands on HH-A's dashboard (lot shown as Blk 2 Lot 7); the homeowner menu replaces the not-linked menu.
- **Don't assert:** dashboard figures.

#### TC-04-C6: Redeeming marks the invitation used and creates one membership with the invite's details
**Priority** P1 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Homeowner (U-ANA); QE reads data. **Tags:** Step 1
- **Action:** After C5, read the invitation and `members/{HH-A}_{U-ANA uid}`.
- **Expected:** Invitation `used`, `usedBy` = U-ANA's uid, `usedAt` set. One membership with `householdId` = HH-A, `uid` = U-ANA, `relation` = the invite's relation, `inviteId`, `invitedBy` = the staff uid who created it, `linkedAt` set. One `invite.redeemed` audit entry.
- **Don't assert:** timestamp values.

#### TC-04-C7: After a redeem, staff see "Linked · 1 person" and the person's own account name
**Priority** P1 · **Type** Integration · **Layer** Journey · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-18) · NG-2 for the name source
- **Setup:** After C5 (U-ANA, account name "ZZ Ana R.", linked by printed slip).
- **Action:** Open the directory and HH-A's detail (fresh load).
- **Expected:** Pill "Linked · 1 person" on the row and the 4E header; "People with portal access" lists "ZZ Ana R." with "zz.owner.a@example.test" and "Owner · linked {today}" (the account's own name, not the owner on file "ZZ Ana Reyes").
- **Don't assert:** where the name is read from (NG-2).

#### TC-04-C8: Checking a code returns only the lot and the owner name on file
**Priority** P1 · **Type** Security · **Layer** API · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Call `checkInvite` with HH-A's valid code; inspect the full response.
- **Expected:** Contains the lot label and owner name (and whatever id the redeem needs); no email, mobile, balance, member names, other invitations or the expiry settings.
- **Don't assert:** response field names.

#### TC-04-C9: The confirm screen shows the lot and the owner on file, nothing else
**Priority** P2 · **Type** UI/UX · **Layer** UI · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Open the confirm screen for HH-A.
- **Expected:** Lot "Blk 2 Lot 7" and "Owner on file ZZ Ana Reyes" (4C); no balance, contact, people or history.
- **Don't assert:** card styling.

#### TC-04-C10: "No, this isn't my lot" returns to an empty "Enter your invite code" with the contact-office line
**Priority** P1 · **Type** Negative · **Layer** UI · **Writes** No
**Role:** Homeowner without a household (U-STRANGER). **Tags:** Step 1 (r5, G-30)
- **Action:** On the HH-A confirm screen press "No, this isn't my lot".
- **Expected:** Back on "Enter your invite code" with an **empty** code field and "Please contact the admin office to get the right invitation." above the field; U-STRANGER is not linked.
- **Don't assert:** the reload half (P8).

#### TC-04-C11: After "No, this isn't my lot" the code is still unused and works for the right person
**Priority** P2 · **Type** Integration · **Layer** UI · **Writes** Yes
**Role:** U-STRANGER then U-ANA. **Tags:** Step 1
- **Action:** After C10, staff open HH-A; U-ANA enters the same code and confirms.
- **Expected:** HH-A still "Invited · expires {date}" before U-ANA redeems; U-ANA is linked; U-STRANGER's attempt did not count towards her guess limit.
- **Don't assert:** —

#### TC-04-C12: A code that doesn't exist shows the "doesn't match" message
**Priority** P1 · **Type** Negative · **Layer** UI · **Writes** Yes (attempt counter)
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Enter a well-formed code that no invitation has, e.g. `ZZZZ-2222`.
- **Expected:** "That code doesn't match an invitation. Check it, or ask the admin office for a new one." under the field; no confirm screen.
- **Don't assert:** —

#### TC-04-C13: An empty code shows "Enter the code from your invitation." and the server is not asked
**Priority** P3 · **Type** Negative · **Layer** Unit · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r5, G-22)
- **Action:** Press "Continue" with the field empty.
- **Expected:** "Enter the code from your invitation." under the code field; no `checkInvite` call; the wrong-code count is unchanged.
- **Don't assert:** the announcement mechanism (Q14).

#### TC-04-C14: A code of the wrong length, or with a 0, gets the format message and is not sent
**Priority** P3 · **Type** Negative · **Layer** Unit · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r5, G-22)
- **Action:** Enter `K7QX-M9T` (7), `K7QX-M9TAA` (9), `K7QX-M9T0` (zero) and press "Continue" each time.
- **Expected:** Each shows "Invite codes have 8 letters and numbers, like K7QX-M9TA. They never use O, 0, I or 1." under the field; no `checkInvite` call; the count is unchanged.
- **Don't assert:** the server half (C17).

#### TC-04-C15: The confirm screen shows the owner name on file at the time of the check
**Priority** P2 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff, then homeowner without a household. **Tags:** Step 1
- **Setup:** Print a slip for HH-A; then staff change HH-A's owner name to "ZZ Ana Reyes-Santos" (REQ-003 edit).
- **Action:** Enter the slip's code.
- **Expected:** "You're joining Blk 2 Lot 7 (ZZ Ana Reyes-Santos)…".
- **Don't assert:** —

#### TC-04-C16: A code with the letter O, the letter I or the digit 1 gets the format message
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r5, G-22)
- **Action:** Enter `K7QX-M9TO`, `K7QX-M9TI` and `K7QX-M9T1`.
- **Expected:** Each shows "Invite codes have 8 letters and numbers, like K7QX-M9TA. They never use O, 0, I or 1."; no server call; the count is unchanged.
- **Don't assert:** —

#### TC-04-C17: The server refuses an empty or malformed code without looking it up or counting it
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER with a scripted client (the page check skipped). **Tags:** Step 1 (r5, C-6)
- **Action:** Call `checkInvite` and `redeemInvite` directly with an empty code, `K7QX-M9T`, `K7QX-M9T0` and a 200-character string.
- **Expected:** Every call is refused as an invalid code; `inviteAttempts/{uid}` is unchanged; no lookup result (no lot, no owner name) is returned.
- **Don't assert:** the error code name.

#### TC-04-C18: After a format message, what was typed stays in the field
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r5, G-22)
- **Action:** Enter `K7QX-M9T0` and press "Continue".
- **Expected:** The field still holds `K7QX-M9T0`, so the person can fix one character.
- **Don't assert:** whether the field shows it re-formatted.

#### TC-04-C19: A locked account linked to another lot is told it is locked
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN (HH-B), locked after 5 non-matching codes. **Tags:** Step 1 (r5, G-24; check order step 2 before 5)
- **Action:** Enter HH-A's valid code.
- **Expected:** "Too many wrong codes. Try again in 15 minutes.", not the already-linked message.
- **Don't assert:** —

#### TC-04-C20: A person linked elsewhere entering a used code is told she's already linked
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** U-JUAN (HH-B). **Tags:** Step 1 (r5, G-24; step 5 before 8)
- **Setup:** HH-A's code used by U-ANA.
- **Action:** U-JUAN enters it.
- **Expected:** "Your account is already linked to Blk 4 Lot 12. Ask the admin office if you need access to another lot.", not "already used".
- **Don't assert:** —

#### TC-04-C21: An expired code for a deactivated household reads "no longer valid"
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r5, G-24; step 6 before 10)
- **Setup:** HH-D's printed invitation expired; then HH-D deactivated.
- **Action:** Enter the code.
- **Expected:** "This invitation is no longer valid. Ask the admin office."
- **Don't assert:** —

#### TC-04-C22: An expired code that was withdrawn reads "no longer valid"
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r5, G-24)
- **Setup:** An invitation withdrawn, with its expiry since passed.
- **Action:** Enter the code.
- **Expected:** "This invitation is no longer valid. Ask the admin office."
- **Don't assert:** —

#### TC-04-C23: An expired code that was replaced reads "replaced"
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r5, G-24; step 9 before 10)
- **Setup:** An invitation replaced by a newer print, with its expiry since passed.
- **Action:** Enter the old code.
- **Expected:** "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."
- **Don't assert:** —

#### TC-04-C24: "Continue" while offline shows the offline line and keeps the code
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r5, G-25)
- **Action:** Go offline; enter a valid code; press "Continue".
- **Expected:** "You're offline. Connect to the internet to use your invite code." under the field; the code is still typed; the count is unchanged.
- **Don't assert:** how the page detects offline.

#### TC-04-C25: "Continue" when the server errors shows "We couldn't check the code…"
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r5, G-25)
- **Action:** Make `checkInvite` return a server error; press "Continue" with a valid code.
- **Expected:** "We couldn't check the code. Check your connection and try again."; code kept; count unchanged.
- **Don't assert:** —

#### TC-04-C26: "Yes, link my account" while offline shows the offline line and links nothing
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household on the HH-A confirm screen. **Tags:** Step 1 (r5, G-25)
- **Action:** Go offline; press "Yes, link my account".
- **Expected:** "You're offline. Connect to the internet to use your invite code."; she stays on the confirm screen and can press Yes again once online; the invitation is still unused.
- **Don't assert:** —

#### TC-04-C27: "Yes, link my account" when the server errors shows "We couldn't link your account…"
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r5, G-25)
- **Action:** Make `redeemInvite` return a server error; press Yes.
- **Expected:** "We couldn't link your account. Check your connection and try again."; the code is kept; count unchanged.
- **Don't assert:** —

#### TC-04-C28: Pressing "Yes, link my account" again after a lost reply lands on the dashboard with one membership
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA. **Tags:** Step 1 (r5, G-25; Sol Arch Q10) · Staging note: drop the reply after the server commits
- **Action:** Press Yes; the link commits but the reply never reaches the page; press Yes again.
- **Expected:** She lands on HH-A's dashboard; exactly one membership; one `invite.redeemed` entry.
- **Don't assert:** what the page showed after the lost reply (C27 or the 15-second message).

## D. Wrong-code limit (per account)

All D cases: **Staging note:** seed the attempt window to a past time rather than moving a clock (v1.1, QE finding 6); fresh account per case.

#### TC-04-D1: The 5th wrong code in 15 minutes is still checked and shows "doesn't match"
**Priority** P1 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** Homeowner without a household (U-STRANGER). **Tags:** Step 1
- **Action:** Enter five different non-existent codes starting 10:00:00 Manila.
- **Expected:** Each of the five shows "That code doesn't match an invitation…".
- **Don't assert:** response time.

#### TC-04-D2: The 6th attempt in the window shows "Too many wrong codes. Try again in 15 minutes."
**Priority** P1 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1
- **Setup:** D1 done (5 refused from 10:00:00).
- **Action:** Enter a 6th non-existent code at 10:05.
- **Expected:** "Too many wrong codes. Try again in 15 minutes."
- **Don't assert:** —

#### TC-04-D3: A right code entered while locked is not checked and reveals nothing
**Priority** P1 · **Type** Security · **Layer** API · **Writes** No
**Role:** U-STRANGER (locked). **Tags:** Step 1
- **Setup:** Locked as in D2; HH-A has an active code.
- **Action:** Enter HH-A's valid code; inspect the response.
- **Expected:** "Too many wrong codes…"; no confirm screen; the response holds no lot or owner name; the invitation is still active and HH-A still "Invited".
- **Don't assert:** —

#### TC-04-D4: 14:59 after the first refused code the account is still locked
**Priority** P1 · **Type** Boundary · **Layer** Unit · **Writes** No
**Role:** U-STRANGER. **Tags:** Step 1
- **Setup:** First refusal 10:00:00, fifth at 10:04.
- **Action:** At 10:14:59 enter HH-A's valid code.
- **Expected:** "Too many wrong codes…".
- **Don't assert:** —

#### TC-04-D5: 15 minutes after the first refused code the account can try again
**Priority** P1 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1
- **Setup:** As D4.
- **Action:** At 10:15:00 enter HH-A's valid code.
- **Expected:** Confirm screen for HH-A.
- **Don't assert:** —

#### TC-04-D6: Codes entered while locked don't extend the lock
**Priority** P2 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1 (r5, G-23)
- **Setup:** First refused code 10:00:00, fifth at 10:05:00; codes entered at 10:06, 10:10 and 10:14, each answered "Too many wrong codes. Try again in 15 minutes."
- **Action:** At 10:15:00 enter a valid code.
- **Expected:** The confirm screen for that code (the window still ends 15 minutes after the first refusal).
- **Don't assert:** —

#### TC-04-D7: Expired codes don't count towards the limit
**Priority** P2 · **Type** Negative · **Layer** Unit · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1
- **Setup:** Five expired fixture codes; one valid HH-A code.
- **Action:** Enter the five expired codes, then the valid one, within 5 minutes.
- **Expected:** Five "This invitation has expired…" messages, then the confirm screen.
- **Don't assert:** —

#### TC-04-D8: Already-used codes don't count towards the limit
**Priority** P2 · **Type** Negative · **Layer** Unit · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1
- **Action:** Enter five codes used by other accounts, then a valid code.
- **Expected:** Five "already used" messages, then the confirm screen.
- **Don't assert:** —

#### TC-04-D9: Refusals other than "doesn't match" never count towards the limit
**Priority** P2 · **Type** Negative · **Layer** Unit · **Writes** Yes
**Role:** U-STRANGER for replaced, cancelled and deactivated-household codes; U-JUAN for already linked; a removed U-ANA for "access removed"; a linked U-ANA for her own household's other code. **Tags:** Step 1 (r5: "Only 'doesn't match' counts")
- **Action:** For each account, enter at least five codes of these refusal kinds, then a valid code.
- **Expected:** Each kind shows its own message; none moves the count, so the valid code then opens the confirm screen (U-JUAN: the already-linked message; linked U-ANA: her dashboard), never "Too many".
- **Don't assert:** —

#### TC-04-D10: Non-counting refusals in between don't reset or skip the count
**Priority** P2 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1
- **Action:** 4 wrong, 1 expired, 1 wrong (the 5th wrong), then a valid code, all within 10 minutes.
- **Expected:** The 5th wrong shows "doesn't match"; the next attempt shows "Too many wrong codes…".
- **Don't assert:** —

#### TC-04-D11: Another account is not locked when one account is
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** U-STRANGER (locked) and U-STRANGER-2. **Tags:** Step 1
- **Action:** While U-STRANGER is locked, U-STRANGER-2 enters HH-A's valid code.
- **Expected:** U-STRANGER-2 sees the confirm screen.
- **Don't assert:** —

#### TC-04-D12: The lock follows the account across sign-out and a second device
**Priority** P2 · **Type** Security · **Layer** API · **Writes** No
**Role:** U-STRANGER (locked). **Tags:** Step 1 · Staging note: two sessions
- **Action:** Sign out and back in; and sign in on a second browser context; enter a valid code in each.
- **Expected:** "Too many wrong codes…" in both.
- **Don't assert:** —

#### TC-04-D13: Wrong codes sent straight to redeemInvite count and lock the same way
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** U-STRANGER with a scripted client. **Tags:** —
- **Action:** Call `redeemInvite` directly with 5 non-existent codes, then `checkInvite` and `redeemInvite` with a valid code.
- **Expected:** The 6th call of either function is refused as too many; no membership is created; the valid invitation stays active.
- **Don't assert:** error code names.

#### TC-04-D14: Wrong codes spread over more than 15 minutes don't lock
**Priority** P2 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1 (fixed window from first failure)
- **Action:** Wrong codes at 10:00, 10:04, 10:08, 10:12, then 10:16, then a valid code at 10:17.
- **Expected:** The 10:16 entry shows "doesn't match" (a new window); the valid code opens the confirm screen.
- **Don't assert:** —

#### TC-04-D15: A successful link clears earlier wrong codes, so a later code is answered on its merits
**Priority** P2 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** U-STRANGER. **Tags:** Step 1 (r5, G-23)
- **Action:** 4 wrong codes, then redeem a valid code for HH-A; then, still within 15 minutes of the first refusal, enter a valid code for HH-C.
- **Expected:** The count is back to 0 after the link; the HH-C code shows "Your account is already linked to Blk 2 Lot 7. Ask the admin office if you need access to another lot.", not "Too many wrong codes…".
- **Don't assert:** the stored record (D18).

#### TC-04-D16: A spike of wrong codes across the project raises the alert
**Priority** P3 · **Type** Security · **Layer** Manual (staging) · **Writes** Yes
**Lane:** exclusive — asserts the project-wide wrong-code count and alert
**Role:** 11 no-household accounts. **Tags:** Staging only · Provisional — not yet in SA-001: the alert threshold (Sol Arch's "for example more than 50 an hour", REQ-004 review)
- **Action:** 51 wrong codes within an hour across accounts.
- **Expected:** The wrong-code alert fires once.
- **Don't assert:** alert channel or exact threshold if Sol Arch changes it.

#### TC-04-D17: Pressing "No, this isn't my lot" doesn't count as a wrong code
**Priority** P3 · **Type** Negative · **Layer** UI · **Writes** No
**Role:** U-STRANGER. **Tags:** Step 1
- **Action:** Open the confirm screen and press "No" six times with valid codes; then enter a valid code.
- **Expected:** Confirm screen, never "Too many".
- **Don't assert:** —

#### TC-04-D18: A successful redeem sets the account's wrong-code record back to 0 in the same transaction
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER; QE reads. **Tags:** Step 1 (r5, G-23)
- **Setup:** 4 non-matching codes recorded for U-STRANGER.
- **Action:** Redeem HH-A's valid code; read `inviteAttempts/{uid}`.
- **Expected:** Failures 0 (or the record gone); the membership exists. A redeem that is refused (for example already used) leaves the record as it was.
- **Don't assert:** the record's field names.

## E. Expiry

All E cases: **Staging note:** seed `expiresAt` rather than moving a clock (v1.1, QE finding 6); build dates from local Manila today.

#### TC-04-E1: An emailed invitation made Nov 28 shows "Invited · expires Dec 5, 2026"
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Setup:** Defaults (7 email / 30 print); today Nov 28, 2026 Manila.
- **Action:** Press "Invite" on HH-A.
- **Expected:** HH-A shows "Invited · expires Dec 5, 2026".
- **Don't assert:** pill colour.

#### TC-04-E2: A slip printed Nov 28 expires at the end of Dec 28, 2026
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-8)
- **Action:** Print a slip for HH-C on Nov 28, 2026.
- **Expected:** The slip reads "Expires at the end of Dec 28, 2026 (Philippine time)"; HH-C shows "Invited · expires Dec 28, 2026".
- **Don't assert:** —

#### TC-04-E3: A code is still accepted at 23:59:59 Manila on its expiry date
**Priority** P1 · **Type** Boundary · **Layer** Unit · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** HH-A invitation expiring Dec 5, 2026.
- **Action:** At Dec 5, 2026 23:59:59 Manila (15:59:59 UTC) enter the code.
- **Expected:** Confirm screen.
- **Don't assert:** —

#### TC-04-E4: At 00:00:00 Manila the next day the code is refused as expired
**Priority** P1 · **Type** Boundary · **Layer** Unit · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** As E3.
- **Action:** At Dec 6, 2026 00:00:00 Manila (Dec 5, 16:00:00 UTC, still "Dec 5" in UTC) enter the code.
- **Expected:** "This invitation has expired. Ask the admin office to send a new one."; no confirm screen; not counted towards the limit.
- **Don't assert:** —

#### TC-04-E5: An invitation made just after Manila midnight takes its date from Manila, not UTC
**Priority** P1 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2
- **Action:** At Nov 29, 2026 00:30 Manila (Nov 28, 16:30 UTC) print a slip and send an email invite.
- **Expected:** Email "This invitation expires at the end of Dec 6, 2026 (Philippine time)."; slip "Expires at the end of Dec 29, 2026 (Philippine time)" (not Dec 5 / Dec 28).
- **Don't assert:** —

#### TC-04-E6: The pill turns "Invite expired" at Manila midnight with no one doing anything
**Priority** P1 · **Type** Integration · **Layer** Unit · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-3: worked out when read)
- **Setup:** HH-A's only invitation expires at the end of Dec 5, 2026.
- **Action:** Work out HH-A's pill at Dec 5, 2026 23:59:59 and at Dec 6, 2026 00:00:01 Manila, for its row, its phone card and its detail page.
- **Expected:** "Invited · expires Dec 5, 2026" at 23:59:59; "Invite expired" at 00:00:01 in all three places. Nothing is written at midnight.
- **Don't assert:** the counts (W8).

#### TC-04-E7: An invitation spanning the year end shows the new year
**Priority** P2 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2
- **Action:** On Dec 25, 2026 send an email invite; on Dec 2, 2026 print a slip.
- **Expected:** Both expire "Jan 1, 2027"; the code works at Jan 1, 2027 23:59:59 Manila.
- **Don't assert:** —

#### TC-04-E8: An invitation ending on a leap day shows Feb 29
**Priority** P3 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Print a slip on Jan 30, 2028.
- **Expected:** "Expires Feb 29, 2028".
- **Don't assert:** —

#### TC-04-E9: A device clock set back does not make an expired code work
**Priority** P2 · **Type** Security · **Layer** UI · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** HH-A code expired (server time Dec 6, 2026).
- **Action:** Set the browser clock to Dec 1, 2026 and enter the code.
- **Expected:** "This invitation has expired…".
- **Don't assert:** —

#### TC-04-E10: The same expiry date, with the year, appears everywhere it is shown
**Priority** P2 · **Type** Integration · **Layer** UI · **Writes** Yes
**Role:** Admin office staff; homeowner reads the email. **Tags:** Step 2 (email), Step 1 (slip) (r5, G-8) · NG-13
- **Action:** Invite HH-A by email and print a slip for HH-C; compare the email body, the directory pill, the 4E line and the slip.
- **Expected:** Each place shows the same date for the same invitation, written "Dec 5, 2026"; the email and slip say "at the end of {date} (Philippine time)".
- **Don't assert:** a bulk-confirm "Expire on {date}" line (NG-13).

#### TC-04-E11: A changed expiry setting applies to invitations made after the change
**Priority** P2 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff changes the setting (decision 6); admin office staff invite. **Tags:** Step 2 · Provisional — not yet in SA-001: `setInviteExpiry`
- **Action:** S-ADMIN sets "Emailed invitations expire after (days)" to 14 on Nov 28, 2026; then invites HH-A.
- **Expected:** HH-A "Invited · expires Dec 12, 2026".
- **Don't assert:** the settings screen (V1).

#### TC-04-E12: Invitations made before a settings change keep their original expiry
**Priority** P2 · **Type** Back-compat · **Layer** API · **Writes** Yes
**Role:** Treasurer; admin office staff. **Tags:** Step 2 (r5, G-7)
- **Setup:** HH-E invited Nov 28 with 7 days (Dec 5).
- **Action:** The treasurer changes email expiry to 14 days.
- **Expected:** HH-E still expires Dec 5, 2026; its pill still reads "Invited · expires Dec 5, 2026"; its code is refused as expired on Dec 6.
- **Don't assert:** —

#### TC-04-E13: With no expiry setting stored, the defaults 7 and 30 days apply
**Priority** P2 · **Type** Boundary (zero vs not set) · **Layer** Unit · **Writes** Yes
**Role:** Admin office staff. **Tags:** Staging note: settings absent · Provisional — not yet in SA-001: where the expiry settings are stored (REQ-004 "SA to name")
- **Setup:** No expiry setting saved.
- **Action:** Invite by email and print a slip on Nov 28, 2026.
- **Expected:** End of Dec 5, 2026 and end of Dec 28, 2026; never "expires today" or an error.
- **Don't assert:** —

#### TC-04-E14: An expiry setting outside 1 to 90 whole days is refused
**Priority** P3 · **Type** Boundary · **Layer** Unit · **Writes** Yes
**Role:** Treasurer. **Tags:** (r5, G-7; decision 6)
- **Action:** Validate 0, 1, 90, 91, −3, 7.5 and empty.
- **Expected:** 1 and 90 accepted; 0, 91, −3, 7.5 and empty refused with "Enter a whole number of days from 1 to 90.".
- **Don't assert:** the screen (V3–V7) or the server (V8).

#### ~~TC-04-E15: Only the treasurer can change invitation expiry~~ — Retired in v1.1
**Priority** P2 · **Type** Security · **Layer** API · **Writes** Yes
**Retired in v1.1:** contradicted by owner decision 6 (approved 2026-11-28): admin office staff **and** the treasurer change the expiry settings. Replaced by V1 (admin office allowed), M18 (treasurer allowed) and V10 (board, guard, homeowner refused).

#### TC-04-E16: A confirm screen left open past midnight on the expiry day refuses the link
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** API · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** HH-A expiring Dec 5; confirm screen opened at 23:59:30 Manila.
- **Action:** Press "Yes, link my account" at Dec 6 00:00:05 Manila.
- **Expected:** "This invitation has expired…"; no membership.
- **Don't assert:** —

## F. Single use and redeem concurrency

#### TC-04-F1: A code someone else used is refused as already used
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** No
**Role:** Homeowner without a household (U-STRANGER). **Tags:** Step 1
- **Setup:** U-ANA linked with HH-A's code.
- **Action:** U-STRANGER enters it.
- **Expected:** "This invitation was already used. Ask the admin office for a new one."
- **Don't assert:** —

#### TC-04-F2: That refusal creates no membership and leaves the first member linked
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** No
**Role:** U-STRANGER; QE reads. **Tags:** Step 1
- **Action:** After F1, read HH-A's members and U-STRANGER's memberships.
- **Expected:** HH-A has only U-ANA; U-STRANGER has none; `memberCount` 1.
- **Don't assert:** —

#### TC-04-F3: The person who used a code enters it again and lands on the dashboard
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
**Role:** Homeowner (U-ANA, linked). **Tags:** Step 1
- **Action:** U-ANA enters her used code again (code entry or `/join#code`).
- **Expected:** She lands on HH-A's dashboard; no error.
- **Don't assert:** —

#### TC-04-F4: Re-entering one's own code creates no second membership and no extra audit entry
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** No
**Role:** U-ANA; QE reads. **Tags:** —
- **Action:** After F3, read members and audit.
- **Expected:** One membership; `memberCount` 1; still one `invite.redeemed` entry; `usedAt` unchanged.
- **Don't assert:** —

#### TC-04-F5: "Yes, link my account" is disabled while the link is in flight
**Priority** P1 · **Type** Concurrency · **Layer** Unit · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Press "Yes, link my account" and press it again at once (double tap).
- **Expected:** The button is disabled after the first press until the result; she lands on the dashboard once.
- **Don't assert:** spinner design.

#### TC-04-F6: Two rapid redeem calls from the same account make one membership
**Priority** P1 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** Homeowner without a household, scripted. **Tags:** —
- **Action:** Send two `redeemInvite` calls with the same code from the same account at once.
- **Expected:** Both succeed or the second returns "already yours"; exactly one membership; `memberCount` 1.
- **Don't assert:** which call wins.

#### TC-04-F7: The same account redeeming on two devices at once ends up linked once
**Priority** P2 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** U-ANA on two browser contexts. **Tags:** Step 1 · Staging note: two sessions
- **Action:** Both press "Yes, link my account" together.
- **Expected:** Both land on HH-A's dashboard; one membership.
- **Don't assert:** —

#### TC-04-F8: Two people submitting the same unused code at once: exactly one is linked
**Priority** P1 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** U-ANA and U-STRANGER. **Tags:** Step 1 · Staging note: two sessions
- **Action:** Both press "Yes, link my account" for HH-A's code at the same moment.
- **Expected:** One lands on the dashboard; the other sees "This invitation was already used. Ask the admin office for a new one."
- **Don't assert:** which one wins.

#### TC-04-F9: Ten parallel redeems of one code create exactly one membership
**Priority** P1 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** U-RACE-01 … 10, scripted. **Tags:** —
- **Action:** 10 parallel `redeemInvite` calls with HH-A's code.
- **Expected:** 1 success, 9 "already used"; one membership; `memberCount` 1; invitation `used` by the winner; one `invite.redeemed` entry.
- **Don't assert:** which account wins.

#### TC-04-F10: Negative control: ten parallel redeems of ten different codes all succeed
**Priority** P2 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** U-RACE-01 … 10. **Tags:** (CS-8)
- **Setup:** 10 bulk fixture households, one code each.
- **Action:** 10 parallel redeems, one code per account.
- **Expected:** 10 memberships, each household "Linked · 1 person". (Proves F9 isn't passing because calls are serialised by the test.)
- **Don't assert:** timing.

#### TC-04-F11: The person who used a code re-enters it after its expiry date and lands on the dashboard
**Priority** P3 · **Type** Boundary · **Layer** API · **Writes** No
**Role:** U-ANA (linked). **Tags:** Step 1 (r5, G-31)
- **Action:** After the used invitation's expiry passes, U-ANA enters the code.
- **Expected:** She lands on HH-A's dashboard (check order step 4: she is linked to the code's household), not "expired"; no second membership.
- **Don't assert:** —

## G. Emailed invitations (Step 2)

**Mail rule for every G case:** assert the `mail` queue document (recipient, subject, status), never a delivered inbox. Tests must not send real mail: the emulator uses a stub provider; staging relies on the allow-list (ADR-005, SA-001 §10). All fixture addresses use `.test`.

#### TC-04-G1: "Invite" queues one email to the contact address with the subject of record
**Priority** P1 · **Type** Happy path · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Action:** Press "Invite" on HH-A (Greenfield brand; repeat on Gentri Heights).
- **Expected:** One `mail` document: to zz.owner.a@example.test, subject "Your invitation to the Greenfield Homes HOA portal" ("…Gentri Heights HOA portal" on that brand), status `queued`. One active email invitation with `sentTo` = that address. One `invite.created` audit entry.
- **Don't assert:** that anything was delivered.

#### TC-04-G2: The email subject carries no lot or person's name
**Priority** P3 · **Type** Security · **Layer** Unit · **Writes** No
**Role:** QE reads the mail document. **Tags:** Step 2 (SA-001 §8.2)
- **Expected:** The subject is exactly the copy of record; no lot, name or code.
- **Don't assert:** —

#### TC-04-G3: The email body follows the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** Unit · **Writes** No
**Role:** QE reads the queued body. **Tags:** Step 2 (r5, G-8, G-20)
- **Expected:** "Hi ZZ Ana Reyes, the Greenfield Homes HOA admin office has invited you to the resident portal for Blk 2 Lot 7. Press the button to join. This invitation expires at the end of Dec 5, 2026 (Philippine time)." Button "Join the portal". "If the button doesn't work, sign in at {portal address} and enter this code: {code}".
- **Don't assert:** the footer (G21); HTML structure.

#### TC-04-G4: Resend queues a new email to the same address
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Setup:** HH-A has an unused email invitation.
- **Action:** Press "Resend invitation".
- **Expected:** A second `mail` document to zz.owner.a@example.test, status `queued`; HH-A shows "Invited · expires {today + 7}".
- **Don't assert:** —

#### TC-04-G5: Resend leaves exactly one active invitation, marking the old one replaced
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 2
- **Action:** After G4, read HH-A's invitations.
- **Expected:** Old `replaced` with `replacedBy` = new; new `active`; one `invite.replaced` audit entry.
- **Don't assert:** —

#### TC-04-G6: The old code after a resend shows the "replaced" message
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 2
- **Action:** Enter the code from the first email.
- **Expected:** "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."; not counted towards the limit; the new code works.
- **Don't assert:** —

#### TC-04-G7: Resending an expired invitation gives a working new code and the old one reads "replaced"
**Priority** P2 · **Type** Happy path · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-20, G-24)
- **Setup:** HH-A "Invite expired".
- **Action:** Press "Resend invitation".
- **Expected:** New mail queued; pill "Invited · expires {new date}"; the new code opens the confirm screen; the old code shows "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."
- **Don't assert:** —

#### TC-04-G8: No screen says an invitation was sent or delivered while it is only queued
**Priority** P1 · **Type** UI/UX (copy promises) · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-14)
- **Setup:** Stub provider paused, so the mail stays `queued`.
- **Action:** Invite HH-A; read every toast, pill and 4E line.
- **Expected:** The pill reads "Invited · expires Dec 5, 2026"; the 4E line reads "Queued Nov 28, 2026"; no "Sent" and no "delivered" anywhere.
- **Don't assert:** the "Sent" line after hand-off (G22).

#### TC-04-G9: An email the provider refuses at hand-off shows "Email failed" with "Resend invitation" and "Print slip"
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-20)
- **Setup:** Stub provider refuses zz.owner.a@example.test.
- **Action:** Invite HH-A; let the mail function run; reload the directory and 4E.
- **Expected:** Mail `failed`; HH-A shows "Email failed" with "Resend invitation" and "Print slip" in both places; never the label "Resend".
- **Don't assert:** the provider's reason.

#### TC-04-G10: Resend from "Email failed" queues a new email and shows Invited
**Priority** P2 · **Type** Happy path · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Action:** From G9, fix nothing and press Resend with the stub now accepting.
- **Expected:** New mail queued then sent; pill "Invited · expires {date}"; one active invitation.
- **Don't assert:** —

#### TC-04-G11: "Print slip" from "Email failed" makes a print code and the email code stops working
**Priority** P2 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (v1.1 retag, QE finding 4: it starts from "Email failed")
- **Action:** From G9, press "Print slip" and confirm.
- **Expected:** One-slip PDF; pill "Invited · expires {today + 30}"; the email invitation's code (captured by the test from the queued mail before clearing) is refused as replaced.
- **Don't assert:** —

#### TC-04-G12: A bounce reported later shows "Email failed" with Resend and Print slip
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Decision 3 (approved for step 2) · Blocked — provider (bounce events need the chosen provider; ADR-002 r2)
- **Setup:** HH-E invited to zz.owner.e@exmaple.test; mail `sent`.
- **Action:** Deliver a simulated provider bounce event for that message.
- **Expected:** Mail `failed`; HH-E shows "Email failed" with "Resend" and "Print slip".
- **Don't assert:** the provider's event format (assumed, not known until the provider is chosen).

#### TC-04-G13: A bounce for a replaced invitation doesn't mark a household with a newer invitation as failed
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Blocked — provider (bounce events, decision 3)
- **Setup:** HH-A invited, then resent; the new mail is `sent`.
- **Action:** Deliver a bounce event for the first (replaced) mail.
- **Expected:** HH-A still shows "Invited · expires {date of newer}".
- **Don't assert:** whether the old mail document is updated.

#### TC-04-G14: A late or repeated bounce never unlinks a member or duplicates state
**Priority** P3 · **Type** Data integrity · **Layer** API · **Writes** Yes
**Role:** Homeowner linked; provider events. **Tags:** Step 2 · Blocked — provider (bounce events, decision 3)
- **Setup:** U-ANA linked via the email invite; later a bounce event arrives, twice.
- **Expected:** Membership kept; pill stays "Linked · 1 person"; at most one failure recorded.
- **Don't assert:** —

#### TC-04-G15: A recipient outside the staging allow-list is never handed to the provider
**Priority** P1 · **Type** Security · **Layer** API (staging) · **Writes** Yes
**Role:** Admin office staff on `hoa-portal-staging`. **Tags:** Step 2 (ADR-005) · Staging only
- **Setup:** A fixture household whose contact email is a `.test` address not on the allow-list.
- **Action:** Invite it.
- **Expected:** The mail function does not call the provider for it; the mail document is not `sent`.
- **Don't assert:** whether it shows as `failed` or a separate blocked state (not specified).

#### TC-04-G16: A household with no email offers "Print slip", and an email invite for it is refused
**Priority** P2 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Action:** Open HH-C's row; then call `createInvites` with channel email for HH-C.
- **Expected:** Row offers "Print slip", not "Invite"; the call creates no invitation and no mail.
- **Don't assert:** —

#### TC-04-G17: Resending while the earlier email is still queued hands over only the new email
**Priority** P2 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-15) · Provisional — not yet in SA-001: mail status `skipped` (ADR-002 follow-up)
- **Setup:** Stub provider paused (pacing); HH-A's first mail `queued`.
- **Action:** Press "Resend invitation"; resume the provider.
- **Expected:** Only the new mail is handed to the provider; the first mail is not handed over, its code and body are cleared, and its status is `skipped`. The household's one working code is the new one.
- **Don't assert:** the seconds-long window between the check and the hand-off (Sol Arch Q4 accepts it).

#### TC-04-G18: After the contact email is corrected, Resend goes to the new address and replaces the old invitation
**Priority** P2 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-16)
- **Setup:** HH-E "Email failed" to zz.owner.e@exmaple.test; staff correct it to zz.owner.e@example.test (REQ-003 edit).
- **Action:** Press "Resend invitation".
- **Expected:** Mail queued to the corrected address; the invitation to the typo address is `replaced` (same owner slot); HH-E has exactly one active owner invitation.
- **Don't assert:** —

#### TC-04-G19: Before the email provider is chosen, the email controls are not shown at all
**Priority** P2 · **Type** UI/UX · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-21)
- **Setup:** A step-1 build (`config/features.emailInvites` off).
- **Action:** Open the directory and HH-A's detail page.
- **Expected:** No "Invite", "Invite selected" or "Resend invitation" anywhere, not even disabled; "Invite another person" has no email field and no "Send invitation" (J30).
- **Don't assert:** layout of the print controls (G24).

#### TC-04-G20: "Invite" makes the household's owner invitation with the relation "Owner"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; then U-ANA redeems. **Tags:** Step 2 (r5, G-17)
- **Action:** Press "Invite" on HH-A; U-ANA redeems; staff open 4E.
- **Expected:** The invitation is in the owner slot with relation Owner; People shows "Owner · linked {date}".
- **Don't assert:** —

#### TC-04-G21: The email footer reads the copy of record
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** QE reads the queued body. **Tags:** Step 2 (r5, G-20)
- **Expected:** "You got this email because your address is on file with the admin office. If this isn't your lot, ignore it."
- **Don't assert:** placement.

#### TC-04-G22: The household detail's invitation line reads "Queued", then "Sent", then "Email failed" if refused
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-14)
- **Action:** Invite HH-A on Nov 28, 2026 with the stub paused; open 4E; let the stub accept; reopen. Repeat for HH-E with the stub refusing.
- **Expected:** HH-A: "zz.owner.a@example.test" with "Queued Nov 28, 2026", then "Sent Nov 28, 2026"; the pill "Invited · expires Dec 5, 2026" both times. HH-E: the line's status reads "Email failed". No line says "delivered".
- **Don't assert:** —

#### TC-04-G23: With email off, `createInvites` refuses an email invitation
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN with a scripted client. **Tags:** Step 1 (r5, Sol Arch Q15) · Provisional — not yet in SA-001: `config/features.emailInvites`
- **Setup:** `config/features.emailInvites` off.
- **Action:** Call `createInvites` with channel email for HH-A.
- **Expected:** Refused; no invitation and no `mail` document; HH-A still "Not invited". A print call for HH-A still works.
- **Don't assert:** the error code.

#### TC-04-G24: In step 1, every household that isn't linked offers "Print slip", and "Print invite slips" works on a selection
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-21)
- **Setup:** Step-1 build; HH-A (has an email on file), HH-C (no email), HH-B (Linked).
- **Action:** Read each row; select HH-A and HH-C and press "Print invite slips".
- **Expected:** HH-A and HH-C each offer "Print slip" (HH-A too, although it has an email); HH-B offers none; the print confirm reads "Print 2 slips?".
- **Don't assert:** —

#### TC-04-G25: An email that was skipped is never shown or counted as "Email failed"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, C-4) · Provisional — not yet in SA-001: mail status `skipped`
- **Setup:** After G17 (first mail `skipped`).
- **Action:** Open the directory and HH-A's detail; read the "Email failed" chip.
- **Expected:** HH-A shows "Invited · expires {date}"; no line or pill reads "Email failed"; the "Email failed" chip doesn't count HH-A.
- **Don't assert:** whether the skipped mail has a line on 4E at all (its invitation is replaced, so not listed: K24).

## H. Invite many households at once (Step 2)

#### TC-04-H1: Selecting 400 households, 20 without email, shows the bulk confirm of record
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-20) · NG-13
- **Setup:** HH-BULK-001 … 400 "Not invited", 380 with email.
- **Action:** Select all 400; press "Invite selected".
- **Expected:** Title "Send 380 invitations?"; line "20 households have no email. Print their slips instead."; buttons "Send 380 invitations", "Print 20 slips" and "Cancel"; no skipped line (its count is 0).
- **Don't assert:** an "Expire on {date}" line (NG-13); dialog layout.

#### TC-04-H2: After confirming, the button reads "Queuing…" and is disabled until all are queued
**Priority** P1 · **Type** Concurrency · **Layer** Unit · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2
- **Action:** Confirm; press the button again during the run.
- **Expected:** "Queuing…", disabled, until the run ends; the second press does nothing.
- **Don't assert:** how long it takes.

#### TC-04-H3: When done, "380 invitations queued. Any that fail are marked Email failed in the list."
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-14: v1's "Each household shows its email status." is replaced)
- **Expected:** That message exactly.
- **Don't assert:** toast duration.

#### TC-04-H4: Exactly 380 emails are queued and the 20 without email are untouched
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** No
**Role:** QE reads. **Tags:** Step 2
- **Action:** Count `mail` documents and active invitations for the 400 fixture households.
- **Expected:** 380 queued mails, one per emailed household, each to that household's address; 380 active email invitations; the 20 remain "Not invited" with no invitation.
- **Don't assert:** totals outside the fixture set.

#### TC-04-H5: Pressing "Invite selected" again skips households with an unused invitation
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-13)
- **Action:** After H3, select the same 400 and press "Invite selected" again.
- **Expected:** "No invitations to send" with "380 households are skipped: they are linked or already have an unused invitation." (and the 20-no-email line with "Print 20 slips"); no new mail and no replaced invitation for the 380; the first run's codes still open the confirm screen.
- **Don't assert:** —

#### TC-04-H6: For a mix of 50, the confirm and done messages say 35, and 35 are queued
**Priority** P2 · **Type** UI/UX (copy promises) · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-13)
- **Setup:** 50 selected: 35 can get an email, 5 have no email, 10 already have an unused invitation.
- **Action:** "Invite selected", then "Send 35 invitations".
- **Expected:** Title "Send 35 invitations?"; lines "5 households have no email. Print their slips instead." and "10 households are skipped: they are linked or already have an unused invitation."; buttons "Send 35 invitations · Print 5 slips · Cancel"; done "35 invitations queued. Any that fail are marked Email failed in the list."; exactly 35 mails queued.
- **Don't assert:** —

#### TC-04-H7: Linked households in a bulk selection are skipped and get no invitation
**Priority** P2 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-12)
- **Setup:** Selection includes HH-B (Linked · 1 person).
- **Action:** "Invite selected", confirm.
- **Expected:** No invitation is made for HH-B and no mail to zz.owner.b@example.test; HH-B stays Linked; U-JUAN's invitation stays `used`.
- **Don't assert:** the confirm's skipped line (H17).

#### TC-04-H8: The bulk confirm with no zero-count lines, and the singular, reads correctly
**Priority** P3 · **Type** Boundary · **Layer** Unit · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-13; outline rows 1 and 2)
- **Action:** Build the confirm for (a) 10 households, all with email, none skipped; (b) 1 household with email.
- **Expected:** (a) "Send 10 invitations?", no other line, buttons "Send 10 invitations · Cancel". (b) "Send 1 invitation?", no other line, "Send 1 invitation · Cancel".
- **Don't assert:** —

#### TC-04-H9: Cancelling the bulk confirm queues nothing
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2
- **Action:** Open the confirm; press "Cancel"; also try a backdrop click and Escape.
- **Expected:** No mail, no invitation; selection kept.
- **Don't assert:** whether backdrop closes the dialog.

#### TC-04-H10: After a bulk run, failed emails show "Email failed" and the rest "Invited"
**Priority** P2 · **Type** UI/UX (copy promises) · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-14)
- **Setup:** Stub provider accepts 370, refuses 10.
- **Action:** After the run, open the directory filtered to the fixture set.
- **Expected:** The 10 show "Email failed" (as the done message promised); the 370 show "Invited · expires {date}"; the chip reads "Email failed (10)" within the fixture set.
- **Don't assert:** absolute chip counts outside the fixture set.

#### TC-04-H11: A bulk run interrupted and retried makes no duplicates
**Priority** P2 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 · Assumption: the network drop happens client-side after the call is sent; offline behaviour itself is not asserted
- **Action:** Drop the network during Queuing…; reconnect; press Invite selected again.
- **Expected:** Each household ends with exactly one active invitation and one queued mail.
- **Don't assert:** what the screen shows while offline.

#### TC-04-H12: "Print 20 slips" in the bulk confirm leads to printing for the households without email
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 and 2 (r5, G-20)
- **Action:** From H1 press "Print 20 slips".
- **Expected:** The print confirm for exactly the 20 households without email ("Print 20 slips?", I1).
- **Don't assert:** —

#### TC-04-H13: When no selected household has an email, the confirm offers only printing
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-13; outline rows 4 and 5)
- **Action:** Build the confirm for (a) 3 households with no email; (b) 1 household with no email.
- **Expected:** (a) "No invitations to send", "3 households have no email. Print their slips instead.", buttons "Print 3 slips · Cancel". (b) "No invitations to send", "1 household has no email. Print its slip instead.", "Print 1 slip · Cancel". Never "Send 0 invitations".
- **Don't assert:** —

#### TC-04-H14: When every selected household is skipped, the confirm offers only "Close"
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-13; outline row 6)
- **Action:** Build the confirm for 4 households, all linked or with an unused invitation; and for 1 such household.
- **Expected:** "No invitations to send", "4 households are skipped: they are linked or already have an unused invitation.", one button "Close". For one: "1 household is skipped: it is linked or already has an unused invitation."
- **Don't assert:** —

#### TC-04-H15: Inviting one household says "1 invitation queued. If it fails, it is marked Email failed in the list."
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-13)
- **Action:** Invite selected for one household with email; confirm.
- **Expected:** That message exactly; one mail queued.
- **Don't assert:** —

#### TC-04-H16: An interrupted bulk run shows the "Some invitations may not have been queued…" line
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-25) · Assumption: the call fails client-side after it was sent
- **Action:** Drop the network during "Queuing…".
- **Expected:** "Some invitations may not have been queued. Check your connection and press Invite selected again. Households already invited are skipped."; pressing "Invite selected" again then skips the households that were queued (H11).
- **Don't assert:** what else the screen shows while offline.

#### TC-04-H17: Linked households in a selection are counted in the skipped line
**Priority** P2 · **Type** UI/UX (copy promises) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-12)
- **Setup:** 5 selected: 3 Not invited with email, HH-B and HH-F (Linked).
- **Action:** "Invite selected".
- **Expected:** "Send 3 invitations?" and "2 households are skipped: they are linked or already have an unused invitation."
- **Don't assert:** —

## I. Printed slips (Step 1)

#### TC-04-I1: "Print invite slips" for 20 households shows the print confirm of record
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-4)
- **Setup:** 20 bulk fixture households with no email, none invited.
- **Action:** Select them; press "Print invite slips".
- **Expected:** Title "Print 20 slips?"; "Printing makes new codes. Each household's earlier unused invitation for the owner, emailed or printed, stops working. Invitations for other people in the household keep working."; buttons "Print 20 slips" and "Cancel"; no "{j} …" or "{k} …" line (their counts are 0).
- **Don't assert:** —

#### TC-04-I2: Confirming downloads one PDF with one slip per household
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Confirm.
- **Expected:** One PDF downloads with 20 slips, one per selected lot, no lot twice.
- **Don't assert:** file name; slips per page.

#### TC-04-I3: Each slip shows the copy of record: HOA, lot, code, expiry, how to join
**Priority** P1 · **Type** UI/UX · **Layer** Unit · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-8)
- **Expected:** "{HOA name} resident portal", the lot, "Your invite code: XXXX-XXXX", "Expires at the end of {today + 30, e.g. Dec 28, 2026} (Philippine time)", "1. Go to {portal address} 2. Sign in or create an account 3. Enter the code".
- **Don't assert:** fonts or exact layout.

#### TC-04-I4: Slips show no balance, email or phone number
**Priority** P1 · **Type** Security (privacy) · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** Include a household with a seeded balance, an email and a mobile.
- **Action:** Extract all PDF text.
- **Expected:** No peso amount, no "@", no mobile number; no owner name (not in the slip copy).
- **Don't assert:** —

#### TC-04-I5: The PDF shows "Delete this file after printing."
**Priority** P1 · **Type** UI/UX · **Layer** Unit · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** The text appears in the PDF (footer).
- **Don't assert:** on which page only.

#### TC-04-I6: Every printed code links to the lot printed beside it
**Priority** P1 · **Type** Data integrity · **Layer** UI · **Writes** No
**Role:** Homeowner without a household (checkInvite for each). **Tags:** Step 1
- **Action:** For each of the 20 slips, check the code.
- **Expected:** The confirm screen names the same lot as its slip, for all 20 (a mismatch links a family to the wrong lot, R-6).
- **Don't assert:** —

#### TC-04-I7: Printing again makes the earlier unused print code show "replaced"
**Priority** P1 · **Type** Negative (copy promises) · **Layer** API · **Writes** Yes
**Role:** Admin office staff; homeowner without a household. **Tags:** Step 1
- **Action:** Print HH-C twice; enter the first code.
- **Expected:** "This invitation was replaced by a newer one…"; the second code works.
- **Don't assert:** —

#### TC-04-I8: Printing a slip for a household with an unused emailed owner invitation stops the email code
**Priority** P2 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-4)
- **Setup:** HH-A active emailed owner invitation (code captured by the test).
- **Action:** Print a slip for HH-A; enter the email code.
- **Expected:** "This invitation was replaced by a newer one. Use the newest invitation, or ask the admin office."; HH-A has one unused owner invitation, the printed one.
- **Don't assert:** —

#### TC-04-I9: Printing the owner's slip leaves a second person's invitation working
**Priority** P2 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-4)
- **Setup:** HH-A not linked; an unused owner invitation and an unused person-slot invitation for U-CARLO (Family).
- **Action:** Print a slip for HH-A (row "Print slip"); U-CARLO enters his code.
- **Expected:** The owner invitation is replaced by the new print one; Carlo's code still opens the confirm screen and links him.
- **Don't assert:** —

#### TC-04-I10: A linked household is skipped by "Print invite slips" and its member is untouched
**Priority** P2 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-12)
- **Action:** Include HH-B (Linked) in "Print invite slips" and confirm; check HH-B's row.
- **Expected:** No printed invitation is made for HH-B and it has no slip in the PDF; U-JUAN still linked and his invitation still `used`; HH-B stays "Linked · 1 person"; its row offers no "Print slip".
- **Don't assert:** the confirm line (I15).

#### TC-04-I11: Cancelling the print confirm keeps the earlier codes working
**Priority** P1 · **Type** Negative (copy promises) · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** HH-C has an active print code.
- **Action:** Print invite slips → Cancel (and separately: backdrop click, Escape).
- **Expected:** No PDF, no new invitation; HH-C's existing code still opens the confirm screen.
- **Don't assert:** —

#### TC-04-I12: Pressing the print confirm twice quickly makes one printed invitation per household and one PDF
**Priority** P2 · **Type** Concurrency · **Layer** Unit · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-33)
- **Action:** Double-press "Print 20 slips".
- **Expected:** The button reads "Printing…" and is disabled until the PDF is ready; one printed invitation per household; one PDF downloads.
- **Don't assert:** a retry after a lost reply (it makes new codes by design, Sol Arch Q9; I16).

#### TC-04-I13: A printed slip is legible and cut-able
**Priority** P3 · **Type** Usability · **Layer** Manual · **Writes** No
**Role:** Admin office staff (manual print). **Tags:** Step 1
- **Action:** Print on A4 and Letter; cut along the dashes.
- **Expected:** Two slips per page, cut lines between; the code monospaced and large enough to read at arm's length; no slip split across the cut.
- **Don't assert:** exact point size.

#### TC-04-I14: "Print slip" on a single no-email row asks "Print 1 slip?" and downloads a one-slip PDF
**Priority** P2 · **Type** Happy path · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-13)
- **Action:** On HH-C's directory row press "Print slip" and confirm.
- **Expected:** Title "Print 1 slip?" with button "Print 1 slip"; one-slip PDF; HH-C "Invited · expires {today + 30}".
- **Don't assert:** —

#### TC-04-I15: The print confirm says how many earlier invitations stop working and how many are skipped
**Priority** P2 · **Type** UI/UX (copy promises) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-13) · NG-6
- **Setup:** 20 selected: 3 with an unused owner invitation, 2 linked, 15 not invited.
- **Action:** Press "Print invite slips".
- **Expected:** "Print 18 slips?"; "3 of these households have an unused invitation. It stops working when you print."; "2 households are skipped because they are linked."; button "Print 18 slips". After printing, those 3 earlier codes read "replaced".
- **Don't assert:** the singular forms of the two lines, or the title when all are linked (NG-6).

#### TC-04-I16: A print that fails shows "The slips weren't made. Check your connection and try again."
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-25) · NG-7
- **Action:** Make `createInvites` fail before it commits; press "Print 20 slips".
- **Expected:** That message; no PDF; the earlier codes still work.
- **Don't assert:** the case where the server committed but the reply was lost (NG-7).

## J. Second person, already linked elsewhere, deactivated, limits

#### TC-04-J1: "Invite another person" with Family and an email gives the second person their own code
**Priority** P1 · **Type** Happy path · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-17, G-2)
- **Setup:** U-ANA linked to HH-A.
- **Action:** On 4E press "Invite another person", pick "Family", enter zz.family.a2@example.test, press "Send invitation".
- **Expected:** One queued mail to that address; a new active invitation in a new person slot with relation Family; U-ANA's invitation and membership unchanged; HH-A still "Linked · 1 person".
- **Don't assert:** —

#### TC-04-J2: After the second person redeems, the directory shows "Linked · 2 people"
**Priority** P1 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** U-CARLO, then admin office staff. **Tags:** Step 2
- **Action:** U-CARLO redeems; staff reload the directory and 4E.
- **Expected:** "Linked · 2 people" on the row and the 4E header.
- **Don't assert:** row order of people.

#### TC-04-J3: The relation the admin picked is what the household detail shows
**Priority** P1 · **Type** Integration (round trip) · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-18) · NG-2 for the name source
- **Expected:** 4E People lists Carlo's account name and email with "Family · linked {date}" and Ana's with "Owner · linked {date}"; `members.relation` = family.
- **Don't assert:** where the name is read from (NG-2).

#### ~~TC-04-J4: Inviting the same address twice for one household makes one active invitation~~ — Retired in v1.1
**Priority** P2 · **Type** Negative · **Layer** API · **Writes** Yes
**Retired in v1.1:** contradicted by r5's slot rule (G-4, G-16): "Each use of 'Invite another person' opens a person slot for that person", so two uses give two active invitations, not one. A double press of one "Send invitation" still makes one (N14). Replaced by J32 (two uses, two slots; whether to warn is NG-10).

#### TC-04-J5: A click outside "Invite another person" keeps what was typed
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2 (r5 UX: "don't close on a backdrop click") · NG-15
- **Action:** Pick a relation and type an email; click the backdrop.
- **Expected:** The dialog stays open with both values; nothing sent.
- **Don't assert:** Escape behaviour (NG-15).

#### TC-04-J6: "Invite another person" offers only "Co-owner" and "Family", with neither picked
**Priority** P3 · **Type** UI/UX · **Layer** Unit · **Writes** No
**Role:** Admin office staff. **Tags:** (r5, G-17)
- **Expected:** Under "How is this person related to the household?" exactly two choices, "Co-owner" and "Family", neither picked when the form opens; no "Owner" and no "Tenant" (D3).
- **Don't assert:** order.

#### TC-04-J7: A person linked to another lot sees the already-linked message
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** No
**Role:** Homeowner U-JUAN (member of HH-B). **Tags:** Step 1 · Decision 4 (approved: refuse in R1)
- **Action:** Enter HH-A's valid code.
- **Expected:** "Your account is already linked to Blk 4 Lot 12. Ask the admin office if you need access to another lot."; no confirm screen.
- **Don't assert:** —

#### TC-04-J8: That refusal leaves the code unused and Juan's single membership unchanged
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** No
**Role:** U-JUAN; QE reads. **Tags:** Step 1
- **Expected:** HH-A invitation still active; HH-A "Invited"; U-JUAN has only the HH-B membership.
- **Don't assert:** —

#### TC-04-J9: The already-linked refusal holds when redeemInvite is called directly
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** U-JUAN, scripted. **Tags:** —
- **Action:** Call `redeemInvite` with HH-A's code, skipping `checkInvite`.
- **Expected:** Refused; no HH-A membership; invitation still active.
- **Don't assert:** —

#### TC-04-J10: A treasurer who is also a homeowner can't redeem a code for a second lot
**Priority** P2 · **Type** Security · **Layer** API · **Writes** No
**Role:** S-TREAS-HO (member of HH-F). **Tags:** Step 1
- **Action:** Enter HH-A's valid code.
- **Expected:** "Your account is already linked to Blk 2 Lot 10…"; the staff role does not bypass it.
- **Don't assert:** —

#### TC-04-J11: A staff member with no household can link to their own lot and gets the view switch
**Priority** P3 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** S-TREAS (no household). **Tags:** Step 1 (REQ-002 regression)
- **Action:** Redeem a fixture household's code.
- **Expected:** Linked; the top bar shows "Treasurer" and "My household".
- **Don't assert:** —

#### TC-04-J12: A member entering another unused code for her own household lands on her dashboard with a notice
**Priority** P2 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** U-ANA (linked to HH-A). **Tags:** Step 1 (r5, G-19)
- **Setup:** U-CARLO's unused person-slot code for HH-A.
- **Action:** U-ANA enters Carlo's code.
- **Expected:** She lands on HH-A's dashboard with "You're already linked to Blk 2 Lot 7. That code wasn't used, so the person it was meant for can still use it."; Carlo's invitation is still `active` and unchanged; U-ANA has one membership; not counted.
- **Don't assert:** —

#### TC-04-J13: A code for a household deactivated after printing shows "no longer valid"
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** Print a slip for HH-D; staff deactivate HH-D (REQ-003).
- **Action:** Enter the slip's code.
- **Expected:** "This invitation is no longer valid. Ask the admin office."; not counted towards the limit.
- **Don't assert:** —

#### TC-04-J14: Deactivating a household with no one linked cancels its unused invitations with reason "deactivated"
**Priority** P1 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 1 (r5, C-3) · Provisional — not yet in SA-001: `cancelReason`
- **Setup:** HH-D (no one linked) with an unused printed invitation.
- **Action:** Deactivate HH-D (REQ-003).
- **Expected:** The invitation is `cancelled` with cancel reason "deactivated"; one `invite.cancelled` audit entry; HH-D listed under "Inactive".
- **Don't assert:** —

#### TC-04-J15: A confirm screen open when the household is deactivated refuses the link
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** API · **Writes** No
**Role:** Homeowner without a household; admin office staff. **Tags:** Step 1 · Staging note: two sessions
- **Action:** Homeowner opens HH-D's confirm screen; staff deactivate HH-D; homeowner presses Yes.
- **Expected:** "This invitation is no longer valid…"; no membership.
- **Don't assert:** —

#### TC-04-J16: Reactivating a household doesn't revive its old code, and it shows "Not invited"
**Priority** P2 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, C-3)
- **Setup:** After J14.
- **Action:** Reactivate HH-D; enter its old code; print a new slip.
- **Expected:** The old code still shows "This invitation is no longer valid. Ask the admin office."; HH-D shows "Not invited"; the new slip's code opens the confirm screen.
- **Don't assert:** —

#### TC-04-J17: A deactivated household can't be invited, resent or printed
**Priority** P2 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** —
- **Action:** Open HH-D under Inactive; then call `createInvites` for it.
- **Expected:** No invite controls; the call creates nothing.
- **Don't assert:** —

#### TC-04-J18: Inviting beyond the people-per-household limit
**Priority** P3 · **Type** Boundary · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** **Blocked — board** (open question: is there a limit?)
- **Expected:** Pending the board. If no limit, a 10th person can be invited and the pill reads "Linked · 10 people".
- **Don't assert:** anything until decided.

#### TC-04-J19: Deactivating a household with one person linked is refused with the copy of record
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-27; decision 9 option c) · NG-1
- **Setup:** HH-G with U-DORA linked.
- **Action:** Press "Deactivate" on HH-G (REQ-003).
- **Expected:** "Blk 7 Lot 3 still has 1 person linked. Remove them first, or use Change of owner."; HH-G is not deactivated.
- **Don't assert:** whether the message replaces REQ-003's Deactivate confirm or follows it (NG-1).

#### TC-04-J20: With two people linked, the refusal says "2 people"
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (decision 9 c) · NG-1
- **Setup:** HH-A with Ana and Carlo linked.
- **Action:** Press "Deactivate".
- **Expected:** "Blk 2 Lot 7 still has 2 people linked. Remove them first, or use Change of owner."
- **Don't assert:** as J19.

#### TC-04-J21: A refused deactivation changes nothing
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 1 (decision 9 c)
- **Setup:** HH-G (U-DORA linked) with an unused person-slot invitation.
- **Action:** Call `setHouseholdActive` to deactivate HH-G (as the screen would); read everything.
- **Expected:** Refused explicitly; `active` still true; U-DORA's membership and `memberOf` unchanged; the invitation still `active` and its code still opens the confirm screen; no `household.deactivated` and no `invite.cancelled` entry.
- **Don't assert:** the error code.

#### TC-04-J22: Once the last person is removed, "Deactivate" works
**Priority** P2 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (decision 9 c)
- **Action:** After J19, remove U-DORA; press "Deactivate" and confirm.
- **Expected:** HH-G is inactive and listed under "Inactive", as REQ-003 describes (TC-03-H2).
- **Don't assert:** REQ-003's confirm text (TC-03-H1).

#### TC-04-J23: A deactivation confirmed after someone linked is refused by the server
**Priority** P1 · **Type** Concurrency (stale reference) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN; U-STRANGER redeems meanwhile. **Tags:** Step 1 (decision 9 c) · Staging note: two sessions
- **Setup:** HH-D with no one linked and an unused slip; S-ADMIN opens the Deactivate confirm.
- **Action:** U-STRANGER redeems HH-D's code; then S-ADMIN confirms Deactivate.
- **Expected:** The deactivation is refused with "Blk 7 Lot 1 still has 1 person linked…"; HH-D stays active; U-STRANGER stays linked.
- **Don't assert:** whether the screen refreshes the household.

#### TC-04-J24: A redeem and a deactivation at the same moment end in one consistent state
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-STRANGER and S-ADMIN, scripted. **Tags:** Step 1 (decision 9 c; Sol Arch Q3: every invite and member transaction reads the household)
- **Action:** Fire `redeemInvite` for HH-D's code and `setHouseholdActive` (deactivate) for HH-D together, 10 times on fresh fixtures.
- **Expected:** Each run ends either linked and active (deactivate refused) or inactive with the code refused as "no longer valid" and no membership. Never inactive with a member.
- **Don't assert:** which one wins.

#### TC-04-J25: A person linked to an inactive household from older data can be removed from the Inactive list
**Priority** P3 · **Type** Back-compat · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Staging note: HH-LEGACY-INACTIVE seeded inactive with a member (a shape option c never creates)
- **Action:** Open HH-LEGACY-INACTIVE from "Inactive"; press "Remove" next to U-LEGACY and confirm.
- **Expected:** U-LEGACY is removed and can no longer read the household; one `member.removed` entry ("Remove works from the Inactive list under every option").
- **Don't assert:** the inactive household's pill.

#### TC-04-J26: "Invite another person" by slip prints a one-slip PDF for the household
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-21; decision 8)
- **Setup:** U-ANA linked to HH-A.
- **Action:** Press "Invite another person", pick "Co-owner", press "Print slip"; on the print confirm for 1 household press "Print 1 slip".
- **Expected:** A one-slip PDF for Blk 2 Lot 7 downloads; the slip's code opens the confirm screen for Blk 2 Lot 7.
- **Don't assert:** —

#### TC-04-J27: The second person's slip shows on the Invitations list as "Printed slip · Co-owner"
**Priority** P2 · **Type** Integration (round trip) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (decision 8)
- **Action:** After J26, read HH-A's Invitations list.
- **Expected:** A line "Printed slip · Co-owner" with "Printed {date}" and "Invited · expires {date}"; the directory pill stays "Linked · 1 person".
- **Don't assert:** line order.

#### TC-04-J28: Printing a second person's slip leaves the first person's access and the owner invitation unchanged
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 1 (decision 8)
- **Action:** After J26, read U-ANA's membership and the owner-slot invitation; U-ANA opens her dashboard.
- **Expected:** U-ANA still linked and sees HH-A; her used invitation unchanged.
- **Don't assert:** —

#### TC-04-J29: "Send invitation" or "Print slip" without a relation shows "Choose how this person is related to the household"
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 and 2 (r5, G-17)
- **Action:** Open "Invite another person"; press "Print slip" (and, in step 2, "Send invitation" with an email typed) without picking a relation.
- **Expected:** "Choose how this person is related to the household" under the choices; nothing made; the typed email kept.
- **Don't assert:** the announcement mechanism (Q14).

#### TC-04-J30: In step 1, "Invite another person" has no email field and no "Send invitation"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-21)
- **Action:** Open "Invite another person" on HH-A in a step-1 build.
- **Expected:** The relation choices, "Print slip" and "Cancel"; no email field and no "Send invitation", not even disabled.
- **Don't assert:** —

#### TC-04-J31: The print confirm for a second person says only that person's earlier invitation stops working
**Priority** P3 · **Type** UI/UX (copy promises) · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5 Copy "Print confirm", person slot)
- **Setup:** HH-A: an unused owner invitation and Carlo's unused person-slot slip.
- **Action:** On Carlo's line press "Print slip".
- **Expected:** "Print 1 slip?" with "Printing makes a new code. This person's earlier unused invitation stops working."; after printing, Carlo's old code reads "replaced" and the owner code still works.
- **Don't assert:** —

#### TC-04-J32: Two uses of "Invite another person" for the same person leave two working codes
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-4; replaces J4) · NG-10
- **Action:** "Invite another person" with Family and zz.family.a2@example.test; later, a second "Invite another person" with the same email and relation.
- **Expected:** Two person slots, each with an active invitation and one mail; the first code is **not** replaced; both open the confirm screen. To replace Carlo's invitation the admin uses "Resend invitation" on his line (A12).
- **Don't assert:** a warning on the second use (NG-10).

## K. Removing a person after a sale

#### TC-04-K1: "Remove" asks the confirm of record
**Priority** P1 · **Type** Happy path · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-20)
- **Setup:** U-ANA linked to HH-A.
- **Action:** On 4E press "Remove" next to her.
- **Expected:** "Remove {name} from Blk 2 Lot 7? They will no longer see this lot. Its bills and payments stay with the lot." with "Cancel" and "Remove".
- **Don't assert:** which name source fills {name} (NG-2).

#### TC-04-K2: After removal, the removed person's next household read is refused
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** Admin office staff removes; U-ANA reads. **Tags:** Step 1
- **Action:** Confirm Remove; U-ANA's still-open session requests HH-A's household document.
- **Expected:** Refused at once (no token refresh needed).
- **Don't assert:** —

#### TC-04-K3: The removed person lands on "Enter your invite code" on her next load
**Priority** P1 · **Type** Navigation · **Layer** UI · **Writes** No
**Role:** U-ANA. **Tags:** Step 1 (r5, G-26; REQ-001 r4: one page)
- **Action:** Reload or navigate after the removal.
- **Expected:** The page headed "Enter your invite code" with "Your account isn't linked to a household yet. Enter the invite code from the admin office."; no HH-A data, even briefly.
- **Don't assert:** the open-screen change without a reload (K18).

#### TC-04-K4: Removal makes every unused invitation for the lot "no longer valid"
**Priority** P1 · **Type** Negative · **Layer** API · **Writes** Yes
**Role:** Admin office staff; homeowner without a household. **Tags:** Step 1 (r5, G-5)
- **Setup:** HH-A also has Carlo's unused person-slot invitation and an unused printed owner invitation.
- **Action:** Remove U-ANA; enter both codes.
- **Expected:** Both show "This invitation is no longer valid. Ask the admin office."; both invitations `cancelled` with cancel reason "removed".
- **Don't assert:** —

#### TC-04-K5: The lot's bills, payments and totals stay with the lot
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 1 · Staging note: seeded bill and payment documents for HH-A (no billing in R1 yet)
- **Action:** Remove U-ANA; read HH-A's totals and every seeded bill and payment.
- **Expected:** All still carry `householdId` = HH-A; billed, paid and balance unchanged; nothing deleted or moved.
- **Don't assert:** figures beyond "unchanged".

#### TC-04-K6: The activity log records who removed her and when
**Priority** P1 · **Type** Integration · **Layer** API · **Writes** No
**Role:** QE reads (the screen is REQ-006, TC-06-A10). **Tags:** Step 1 (r5, G-6: data level)
- **Expected:** One `member.removed` entry with actor = S-ADMIN's uid, household HH-A, target U-ANA's uid, time.
- **Don't assert:** the activity-log sentence (TC-06).

#### TC-04-K7: Removing people counts down, and after the last one the household shows "Not invited"
**Priority** P1 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-9)
- **Setup:** HH-A has Ana and Carlo, no unused invitation.
- **Action:** Remove Ana; then remove Carlo.
- **Expected:** After Ana: "Linked · 1 person", `memberCount` 1. After Carlo: `memberCount` 0 and "Not invited", never "Linked · 0 people".
- **Don't assert:** —

#### TC-04-K8: Removing someone already removed says so and changes nothing
**Priority** P1 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** S-ADMIN and S-ADMIN-2 (both with the Remove confirm open). **Tags:** Step 1 (r5, G-10)
- **Action:** Both press Remove for U-ANA; the second confirms after the first.
- **Expected:** The second sees "{name} was already removed from Blk 2 Lot 7. Nothing was changed."; `memberCount` decremented once; one `member.removed` entry.
- **Don't assert:** which name source fills {name} (NG-2).

#### TC-04-K9: "Remove" is disabled while in flight
**Priority** P2 · **Type** Concurrency · **Layer** Unit · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Double-press the confirm "Remove".
- **Expected:** Disabled after the first press; one removal.
- **Don't assert:** —

#### TC-04-K10: Cancelling the remove confirm keeps the person linked
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Remove → Cancel; also backdrop click and Escape.
- **Expected:** U-ANA still linked and listed; no audit entry.
- **Don't assert:** —

#### TC-04-K11: A removed person re-entering her own used code is told her access was removed
**Priority** P1 · **Type** Security · **Layer** API · **Writes** No
**Role:** U-ANA after removal; then U-STRANGER. **Tags:** Step 1 (r5, G-11)
- **Action:** U-ANA enters the code she used (code entry, and `/join#code`); then U-STRANGER enters the same code.
- **Expected:** U-ANA sees "Your access to Blk 2 Lot 7 was removed by the admin office. Ask them if you think this is a mistake."; she is not linked, sees no HH-A data, stays on "Enter your invite code", and the refusal is not counted. U-STRANGER sees "This invitation was already used. Ask the admin office for a new one."
- **Don't assert:** —

#### TC-04-K12: The new owner can be invited and linked after the old owner is removed
**Priority** P1 · **Type** Happy path · **Layer** API · **Writes** Yes
**Role:** Admin office staff; U-NEW. **Tags:** Step 1
- **Setup:** Ana removed; staff edit HH-A's owner name to "ZZ New Owner" (REQ-003).
- **Action:** Print a slip for HH-A; U-NEW redeems.
- **Expected:** U-NEW linked; HH-A "Linked · 1 person"; 4E People lists only U-NEW.
- **Don't assert:** —

#### TC-04-K13: The new owner cannot see the previous owner's contact details
**Priority** P1 · **Type** Security (privacy) · **Layer** API · **Writes** No
**Role:** U-NEW. **Tags:** Step 1
- **Action:** Request HH-A's `householdContacts` and inspect every household screen.
- **Expected:** Read refused; no previous email or mobile on any screen.
- **Don't assert:** —

#### TC-04-K14: After a change of owner, the new owner's confirm screen shows her name and never the seller's
**Priority** P1 · **Type** Security (privacy) · **Layer** API · **Writes** Yes
**Role:** Admin office staff; U-ROSA. **Tags:** Step 1 (r5, G-28; decision 7)
- **Setup:** HH-A "Change of owner" to "ZZ Rosa Lim" (U4); then a slip printed for HH-A.
- **Action:** U-ROSA enters the code.
- **Expected:** "You're joining Blk 2 Lot 7 (ZZ Rosa Lim). Is this your lot?"; nothing on the screen or in the `checkInvite` response names ZZ Ana Reyes.
- **Don't assert:** — (QE finding 1: this is now the Change-of-owner path, distinct from C15's REQ-003 edit.)

#### TC-04-K15: "Remove" on one person leaves the others linked
**Priority** P2 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-29: "Remove" stays for one person; a sale uses Change of owner)
- **Setup:** Ana and Carlo linked.
- **Action:** Remove Ana only.
- **Expected:** Carlo still linked and listed; "Linked · 1 person".
- **Don't assert:** —

#### TC-04-K16: Editing the owner name alone doesn't unlink anyone
**Priority** P2 · **Type** Regression · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Edit HH-A's owner name and contact email (REQ-003).
- **Expected:** Existing members stay linked; nothing removes the old owner automatically.
- **Don't assert:** —

#### TC-04-K17: Treasurer can remove a person
**Priority** P2 · **Type** Security (role) · **Layer** API · **Writes** Yes
**Role:** S-TREAS. **Tags:** Step 1
- **Action:** Remove a linked fixture member.
- **Expected:** Removed, as for admin office staff.
- **Don't assert:** —

#### TC-04-K18: A removed person's open screen changes to "Enter your invite code" within a minute
**Priority** P1 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA with HH-A's dashboard open, online. **Tags:** Step 1 (r5, G-26)
- **Action:** Staff remove U-ANA; wait without touching her screen.
- **Expected:** Within a minute her screen shows "Enter your invite code"; no HH-A data remains on screen.
- **Don't assert:** the exact delay under a minute (Sol Arch expects seconds).

#### TC-04-K19: The open screen treats a refused read of the membership as a removal
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA. **Tags:** Step 1 (r5, Sol Arch Q8) · Provisional — not yet in SA-001: the removal listener
- **Action:** Feed the membership listener a permission-denied error instead of "document missing".
- **Expected:** The same change to "Enter your invite code" as K18, not an error page.
- **Don't assert:** the listener's mechanism.

#### TC-04-K20: With no one linked, "People with portal access" says what to do next
**Priority** P2 · **Type** UI/UX (empty state) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-9) · NG-12
- **Action:** Open HH-A's detail after its last person is removed (and HH-C, never linked).
- **Expected:** "No one is linked to this lot. Invite the owner or print a slip."
- **Don't assert:** the step-1 wording (NG-12: step 1 has no "Invite").

#### TC-04-K21: Removed people are not listed on the household detail
**Priority** P2 · **Type** Privacy · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-9)
- **Action:** After removing Ana from HH-A (Carlo stays), open 4E.
- **Expected:** "People with portal access" lists Carlo only; Ana appears nowhere on the page (the activity log keeps the removal).
- **Don't assert:** —

#### TC-04-K22: "People with portal access" shows each person's own account name and email
**Priority** P1 · **Type** Security (lost-slip safeguard) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-18, C-5) · NG-2
- **Setup:** U-ANA (account "ZZ Ana R.", zz.owner.a@example.test) linked to HH-A on Nov 29, 2026; owner on file "ZZ Ana Reyes".
- **Action:** Open HH-A's detail.
- **Expected:** "ZZ Ana R." with "zz.owner.a@example.test" and "Owner · linked Nov 29, 2026"; a stranger who linked with a lost slip would show their own account name and email, not the owner's.
- **Don't assert:** the name for an email-and-password account whose token has no name (NG-2).

#### TC-04-K23: The membership keeps the name and email the account had at link time
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** QE reads. **Tags:** Step 1 (r5, C-5) · Provisional — not yet in SA-001: `members.name`, `members.email` · NG-2
- **Action:** After C5, read `members/{HH-A}_{U-ANA uid}`.
- **Expected:** `name` and `email` hold the account's values at link time; staff read them without reading `users/{uid}`.
- **Don't assert:** which source the name was copied from (NG-2).

#### TC-04-K24: The Invitations list shows current and used invitations, not replaced or withdrawn ones
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 and 2 (r5, G-18)
- **Setup:** HH-A with: a used owner invitation (Ana), a replaced print for Carlo, his current print, and a withdrawn Family invitation.
- **Action:** Open 4E.
- **Expected:** Two lines: Ana's "Used {date}" and Carlo's current one; no line for the replaced or withdrawn invitations.
- **Don't assert:** line order.

## L. Privacy after a sale (Blocked — decision 5)

Owner decision 5 is open: decide before the payments REQ (EPIC-003). Sol Arch's options: **Option 1**, members see records from their `linkedAt` date only; **Option 2**, payment screenshots are visible only to the uploader and staff. Bills and payments don't exist in R1, so these cases also wait for the payments REQ. Keep them in the plan so the decision has test cases waiting. **(v1.1)** These cases also rest on **SA-001 R-16** (sale privacy), which Final SA-001 still lists as open; REQ-004 r5 confirms decision 5 is not affected by Change of owner (decision 7). No change to the cases.

#### TC-04-L1: [Option 1] The new owner sees no receipts or bills dated before they linked
**Priority** P1 · **Type** Security (privacy) · **Layer** API · **Writes** No
**Role:** U-NEW (HH-A after the sale). **Tags:** Blocked — decision 5 · Blocked — payments REQ
- **Setup:** Seeded HH-A receipts and bills before U-NEW's `linkedAt`, and one after.
- **Expected:** Only the later record is visible and readable.
- **Don't assert:** until decided.

#### TC-04-L2: [Option 1] A record on the link date itself
**Priority** P2 · **Type** Boundary · **Layer** API · **Writes** No
**Role:** U-NEW. **Tags:** Blocked — decision 5
- **Setup:** A record the same Manila day as `linkedAt`, minutes before and after.
- **Expected:** Pending decision 5 (timestamp vs Manila date).
- **Don't assert:** until decided.

#### TC-04-L3: [Option 2] The new owner can't open the previous owner's payment screenshots
**Priority** P1 · **Type** Security (privacy) · **Layer** API · **Writes** No
**Role:** U-NEW. **Tags:** Blocked — decision 5 · Blocked — payments REQ
- **Expected:** Storage read of `proofs/HH-A/…` uploaded by U-ANA refused.
- **Don't assert:** until decided.

#### TC-04-L4: [Option 2] What the new owner sees of earlier receipts
**Priority** P2 · **Type** Security (privacy) · **Layer** UI · **Writes** No
**Role:** U-NEW. **Tags:** Blocked — decision 5
- **Expected:** Pending decision 5 (receipts visible but the previous owner's name?).
- **Don't assert:** until decided.

#### TC-04-L5: [Either] The removed owner can't open any of the lot's records, including her own uploads
**Priority** P2 · **Type** Security · **Layer** API · **Writes** No
**Role:** U-ANA after removal. **Tags:** Blocked — payments REQ
- **Expected:** Every read refused, including a previously opened screenshot URL.
- **Don't assert:** signed-URL lifetime.

#### TC-04-L6: [Either] Staff still see the lot's full history after a sale
**Priority** P2 · **Type** Integration · **Layer** API · **Writes** No
**Role:** Admin office staff, treasurer. **Tags:** Blocked — decision 5
- **Expected:** All HH-A bills, payments and screenshots visible to staff.
- **Don't assert:** —

## M. Roles, rules and data leaks

All M cases assert the refusal explicitly ("nothing changed on screen" is not proof).

#### TC-04-M1: Treasurer can invite, resend and print
**Priority** P1 · **Type** Security (role) · **Layer** API · **Writes** Yes
**Role:** S-TREAS. **Tags:** Step 1 and 2
- **Expected:** Each action works as for admin office staff.
- **Don't assert:** —

#### TC-04-M2: createInvites is refused for board, guard, homeowner, no-role and signed-out callers
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** S-BOARD, S-GUARD, U-JUAN, U-STRANGER, anonymous. **Tags:** —
- **Expected:** Each call refused; no invitation, no mail.
- **Don't assert:** error code names.

#### TC-04-M3: removeMember is refused for the same callers
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** As M2 (U-JUAN tries to remove himself and someone in HH-A). **Tags:** —
- **Expected:** Refused; memberships unchanged.
- **Don't assert:** —

#### TC-04-M4: cancelInvite is refused for the same callers
**Priority** P2 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** As M2. **Tags:** —
- **Expected:** Refused; invitations unchanged.
- **Don't assert:** —

#### TC-04-M5: checkInvite and redeemInvite are refused when signed out
**Priority** P1 · **Type** Security · **Layer** API · **Writes** No
**Role:** Anonymous. **Tags:** —
- **Expected:** Both refused; nothing revealed about the code.
- **Don't assert:** —

#### TC-04-M6: A person can only redeem for themselves
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** U-STRANGER, scripted. **Tags:** —
- **Action:** Call `redeemInvite` with HH-A's code and U-ANA's uid as a parameter.
- **Expected:** Any membership created belongs to U-STRANGER (the caller) or the call is refused; never one for U-ANA.
- **Don't assert:** which of the two.

#### TC-04-M7: Non-staff cannot read invitations, even for their own household
**Priority** P1 · **Type** Security · **Layer** API · **Writes** No
**Role:** U-JUAN (HH-B), U-STRANGER, S-BOARD, S-GUARD. **Tags:** —
- **Expected:** Every read of `invites` refused.
- **Don't assert:** —

#### TC-04-M8: Staff can read a household's invitations by household
**Priority** P2 · **Type** Security · **Layer** API · **Writes** No
**Role:** S-ADMIN, S-TREAS. **Tags:** —
- **Expected:** Query `invites` where `householdId` = HH-A allowed; a query without the household filter refused.
- **Don't assert:** index details.

#### TC-04-M9: No client can write an invitation, staff included
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** S-ADMIN, U-STRANGER. **Tags:** —
- **Action:** Create an invite document; set an existing one's status to `active` or its `expiresAt` later.
- **Expected:** All refused.
- **Don't assert:** —

#### TC-04-M10: No client can read or reset its wrong-code counter
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** U-STRANGER (locked). **Tags:** —
- **Action:** Read, delete or update `inviteAttempts/{own uid}`.
- **Expected:** All refused; still locked.
- **Don't assert:** —

#### TC-04-M11: No client can read or write the mail queue, staff included
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** S-ADMIN, S-TREAS, U-ANA. **Tags:** —
- **Expected:** Reads and writes of `mail` refused (a queued mail holds a live code).
- **Don't assert:** —

#### TC-04-M12: No client can create a membership
**Priority** P1 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** U-STRANGER, S-ADMIN. **Tags:** —
- **Action:** Write `members/{HH-A}_{own uid}`.
- **Expected:** Refused; no access to HH-A.
- **Don't assert:** —

#### TC-04-M13: A member can't read another household's memberships
**Priority** P1 · **Type** Security (cross-household) · **Layer** API · **Writes** No
**Role:** U-JUAN. **Tags:** —
- **Expected:** Read of HH-A memberships refused; his own allowed.
- **Don't assert:** —

#### TC-04-M14: A newly linked member reads only their own household
**Priority** P1 · **Type** Security (cross-household) · **Layer** API · **Writes** No
**Role:** U-ANA just after redeeming HH-A. **Tags:** Step 1
- **Action:** Request HH-B's household document and contacts.
- **Expected:** Refused.
- **Don't assert:** —

#### TC-04-M15: Clients can't change link status or member count
**Priority** P2 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** S-ADMIN, U-ANA. **Tags:** —
- **Action:** Update `households/HH-A.linkStatus` or `memberCount`.
- **Expected:** Refused.
- **Don't assert:** —

#### TC-04-M16: A guard sees no households, invitations or people
**Priority** P2 · **Type** Security (role) · **Layer** API · **Writes** No
**Role:** S-GUARD. **Tags:** Step 1
- **Expected:** No Homeowners menu; the Homeowners and household detail URLs show "You don't have access to this page"; reads of households, members and invites refused.
- **Don't assert:** —

#### TC-04-M17: A staff member whose role was just removed can't invite or remove
**Priority** P2 · **Type** Security · **Layer** API · **Writes** Yes
**Role:** S-ADMIN-2 with role removed, still holding the old token. **Tags:** (REQ-002 "at once")
- **Expected:** `createInvites` and `removeMember` refused on the next call.
- **Don't assert:** —

#### TC-04-M18: The treasurer can withdraw, change the owner and change the expiry settings
**Priority** P1 · **Type** Security (role) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-TREAS. **Tags:** Step 1 (r5 UX "Roles"; decision 6)
- **Expected:** Withdraw (T2), Change of owner (U2) and Settings → Invitations Save (V1) each work as for admin office staff.
- **Don't assert:** —

## N. Staff concurrency and stale screens

#### TC-04-N1: Two staff pressing Resend at once leave exactly one active code and one email
**Priority** P1 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** S-ADMIN and S-ADMIN-2. **Tags:** Step 2 (r5, G-33; Sol Arch Q9 expected-state check) · Staging note: two sessions
- **Action:** Both press "Resend invitation" for HH-A's owner slot together, from screens that showed the same active invitation.
- **Expected:** One active invitation for the slot; every other `replaced`; only the active one's code works; one new mail queued for the pair.
- **Don't assert:** which admin's call wins, or the message the other sees (NG-5).

#### TC-04-N2: Two staff running "Invite selected" on the same households make one invitation each
**Priority** P1 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** S-ADMIN and S-ADMIN-2. **Tags:** Step 2 · Staging note: two sessions
- **Action:** Both confirm Invite selected for 50 fixture households at once.
- **Expected:** Each household: one active invitation, one queued mail.
- **Don't assert:** whose run did which household.

#### TC-04-N3: Two staff printing the same household leave one working printed code, the second one
**Priority** P2 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** S-ADMIN, then S-ADMIN-2 minutes later. **Tags:** Step 1 (r5, G-32)
- **Expected:** HH-C ends with exactly one active printed invitation, the second; the first PDF's code is refused as replaced.
- **Don't assert:** the notice (N9).

#### TC-04-N4: Redeem and Resend at the same moment end in one consistent state
**Priority** P1 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** U-ANA; S-ADMIN. **Tags:** Step 2
- **Expected:** Either U-ANA is linked and that invitation is `used` (and the resend creates no second active invitation for her slot), or she sees the "replaced" message and a new active invitation exists. Never both a member and an active invitation for the same slot from this pair.
- **Don't assert:** which wins.

#### TC-04-N5: Redeem and Remove in the same household at once keep the count right
**Priority** P2 · **Type** Concurrency · **Layer** API · **Writes** Yes
**Role:** U-CARLO redeems; S-ADMIN removes U-ANA. **Tags:** —
- **Expected:** `memberCount` equals the number of memberships afterwards; if the removal ran first, Carlo's code is refused (K4).
- **Don't assert:** which wins.

#### TC-04-N6: A confirm screen open while staff resend refuses the old code
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** API · **Writes** No
**Role:** Homeowner without a household; S-ADMIN. **Tags:** Step 2
- **Action:** Homeowner on the confirm screen; staff resend; homeowner presses Yes.
- **Expected:** "This invitation was replaced by a newer one…"; no membership.
- **Don't assert:** —

#### TC-04-N7: An open household detail shows the link after a reload
**Priority** P2 · **Type** Integration (derived refresh) · **Layer** UI · **Writes** No
**Role:** S-ADMIN with 4E open; U-ANA redeems meanwhile. **Tags:** Step 1
- **Expected:** After reload (or live update, if built), "Linked · 1 person" and Ana listed.
- **Don't assert:** live update without reload (not specified).

#### TC-04-N8: Resend from a stale screen on a household that just linked creates no active invitation
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** API · **Writes** Yes
**Role:** S-ADMIN with a stale directory. **Tags:** Step 2 · NG-5
- **Action:** U-ANA redeems; staff press the stale "Resend invitation" for her slot.
- **Expected:** No new active invitation and no mail for the used slot; the screen refreshes to Linked.
- **Don't assert:** the message (NG-5).

#### TC-04-N9: The second printer is told whose slips stopped working
**Priority** P2 · **Type** UI/UX (copy promises) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN prints HH-C; minutes later S-ADMIN-2 prints HH-C and two other households. **Tags:** Step 1 (r5, G-32)
- **Expected:** S-ADMIN-2 sees "Slips for 1 of these households were printed in the last hour by ZZ Admin One. Those slips no longer work."
- **Don't assert:** where on the screen it shows.

#### TC-04-N10: No notice when the earlier print is more than an hour old
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN, S-ADMIN-2. **Tags:** Step 1 (r5, G-32) · Staging note: seed the first print's time
- **Action:** S-ADMIN's print of HH-C seeded 59 minutes ago, then (fresh fixture) 61 minutes ago; S-ADMIN-2 prints HH-C each time.
- **Expected:** At 59 minutes the notice shows; at 61 minutes it doesn't. The 61-minute code is still replaced.
- **Don't assert:** behaviour at exactly 60:00.

#### TC-04-N11: No notice when the same staff member prints twice
**Priority** P3 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN. **Tags:** Step 1 (r5, Sol Arch Q5: "by another uid")
- **Action:** S-ADMIN prints HH-C twice within a few minutes.
- **Expected:** No "printed in the last hour by …" notice; the first code is replaced.
- **Don't assert:** —

#### TC-04-N12: "Invite" pressed twice quickly reads "Queuing…" and makes one invitation and one email
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-33)
- **Action:** Double-press "Invite" on HH-A.
- **Expected:** "Queuing…", disabled until the save finishes; one invitation; one mail.
- **Don't assert:** —

#### TC-04-N13: "Resend invitation" pressed twice quickly makes one new invitation and one email
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-33)
- **Action:** Double-press "Resend invitation" on HH-A.
- **Expected:** "Queuing…", disabled; one new active invitation; one new mail; the first code reads "replaced".
- **Don't assert:** —

#### TC-04-N14: "Send invitation" in "Invite another person" pressed twice makes one invitation and one email
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 2 (r5, G-33)
- **Action:** Pick Family, enter an email, double-press "Send invitation".
- **Expected:** "Queuing…", disabled; one person slot, one invitation, one mail (contrast J32: two separate uses).
- **Don't assert:** —

#### TC-04-N15: A Resend from a screen that is out of date makes no second email
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN-2 with HH-A's detail loaded before S-ADMIN resent. **Tags:** Step 2 (r5, Sol Arch Q9) · NG-5
- **Action:** S-ADMIN presses "Resend invitation"; then S-ADMIN-2 presses it on the stale screen.
- **Expected:** S-ADMIN-2's call is refused or returns "already done": no further invitation is made and no further mail queued; the code S-ADMIN's resend made still works.
- **Don't assert:** the message (NG-5).

## P. Navigation and deep links

#### TC-04-P1: A signed-in account with no household lands on "Enter your invite code"
**Priority** P1 · **Type** Navigation · **Layer** UI · **Writes** No
**Role:** U-STRANGER. **Tags:** Step 1 (REQ-001 r4 regression: the not-linked page and code entry are one page)
- **Expected:** The page headed "Enter your invite code" with "Your account isn't linked to a household yet. Enter the invite code from the admin office.", the hint "You'll find it in your invitation email or on the slip from the admin office.", the "Invite code" field and "Continue"; "Sign out" reachable; no household data.
- **Don't assert:** the menu layout (TC-01).

#### TC-04-P2: The email link survives email-and-password sign-in without typing the code
**Priority** P1 · **Type** Navigation · **Layer** UI · **Writes** No
**Role:** U-ANA, signed out. **Tags:** Step 2
- **Action:** Open `/join#{code}`; sign in with email and password.
- **Expected:** Confirm screen for HH-A, without typing the code.
- **Don't assert:** —

#### TC-04-P3: The email link survives creating a new account
**Priority** P1 · **Type** Navigation · **Layer** UI · **Writes** Yes
**Role:** New account. **Tags:** Step 2
- **Action:** Open `/join#{code}`; "New here? Create an account"; create it.
- **Expected:** Confirm screen for the lot.
- **Don't assert:** email verification flow (TC-01).

#### TC-04-P4: The email link survives "Continue with Google"
**Priority** P1 · **Type** Navigation · **Layer** UI · **Writes** No
**Role:** U-ANA-G. **Tags:** Step 2 · Assumption: popup flow on desktop and phone emulation; in-app email browsers are in the exploratory charter, not asserted
- **Action:** Open `/join#{code}`; Continue with Google; complete the popup.
- **Expected:** Confirm screen for the lot.
- **Don't assert:** popup behaviour on in-app browsers.

#### TC-04-P5: Refreshing the sign-in page mid-flow keeps the code
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** No
**Role:** Signed out. **Tags:** Step 2
- **Action:** Open `/join#{code}`; reload the sign-in page; sign in.
- **Expected:** Confirm screen for the lot.
- **Don't assert:** —

#### TC-04-P6: Refreshing the confirm screen keeps the lot and the link still works
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 1 and 2
- **Action:** Reload on the confirm screen; press Yes.
- **Expected:** The confirm screen shows the same lot after reload; Yes links.
- **Don't assert:** —

#### TC-04-P7: After linking, the code is cleared from session storage and the address bar
**Priority** P1 · **Type** Security · **Layer** UI · **Writes** Yes
**Role:** U-ANA. **Tags:** Step 1 and 2
- **Expected:** No `sessionStorage` key holds the code; the URL has no fragment code.
- **Don't assert:** the storage key name.

#### TC-04-P8: After "No, this isn't my lot", the code is cleared and a reload doesn't bring back the confirm
**Priority** P2 · **Type** Security · **Layer** UI · **Writes** No
**Role:** U-STRANGER, arrived by `/join#{code}`. **Tags:** Step 1 and 2 (r5, G-30)
- **Action:** Press "No, this isn't my lot"; reload the page.
- **Expected:** No pending code in `sessionStorage` or the address bar; after the reload, "Enter your invite code" with an empty field, not the confirm screen; the code is still unused (C11).
- **Don't assert:** the storage key name.

#### TC-04-P9: Signing out with a pending code leaves no code on the device
**Priority** P2 · **Type** Security · **Layer** UI · **Writes** No
**Role:** Shared phone: U-STRANGER opened the link, then signs out. **Tags:** Step 2 · Assumption (REQ silent)
- **Action:** Open `/join#{code}`; sign in; sign out before confirming; sign in as U-STRANGER-2.
- **Expected:** U-STRANGER-2 does not see the confirm screen for that code.
- **Don't assert:** —

#### TC-04-P10: Back after linking doesn't create a second link
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** No
**Role:** U-ANA. **Tags:** Step 1
- **Action:** After landing on the dashboard press Back (and Yes again if shown).
- **Expected:** Dashboard or confirm screen; any second Yes lands on the dashboard; one membership.
- **Don't assert:** which screen Back shows.

#### TC-04-P11: A homeowner can't open the Homeowners directory or a household detail by URL
**Priority** P1 · **Type** Navigation (security) · **Layer** UI · **Writes** No
**Role:** U-ANA (linked) and U-STRANGER. **Tags:** Step 1
- **Action:** Open the Homeowners URL and HH-A's detail URL.
- **Expected:** "You don't have access to this page" with "Go to my dashboard" (U-STRANGER: the not-linked screen); no data requests succeed.
- **Don't assert:** —

#### TC-04-P12: A no-household account opening a household URL sees no data
**Priority** P2 · **Type** Navigation (security) · **Layer** UI · **Writes** No
**Role:** U-STRANGER after "No, this isn't my lot". **Tags:** Step 1
- **Action:** Open the dashboard URL directly.
- **Expected:** "Enter your invite code"; no household data, even briefly.
- **Don't assert:** —

#### TC-04-P13: Staff move from the directory to household detail and back with the Homeowners menu highlighted
**Priority** P2 · **Type** Navigation · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (NAV-03 regression)
- **Action:** Search "blk 2", open HH-A, press Back.
- **Expected:** "Homeowners" is the one `aria-current` item on both; Back returns to the list with the search kept.
- **Don't assert:** scroll position.

#### TC-04-P14: After Remove, staff stay on the household detail with the list updated
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** Still on 4E; the person is gone; focus moves to a sensible place (the People heading or the next row).
- **Don't assert:** exact focus target.

#### TC-04-P15: An important announcement doesn't block the join flow
**Priority** P2 · **Type** Navigation (modal mid-flow) · **Layer** UI · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 1 (NAV-05 regression)
- **Setup:** An important announcement is live.
- **Action:** Enter a code, confirm, land on the dashboard.
- **Expected:** No pop-up on the code entry or confirm screens; on the dashboard the pop-up may appear and can be acknowledged; the link has already completed.
- **Don't assert:** —

#### TC-04-P16: `/join` with no code opens empty code entry
**Priority** P3 · **Type** Navigation · **Layer** UI · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 2
- **Expected:** "Enter your invite code" with an empty field; no check sent; attempt count unchanged.
- **Don't assert:** —

#### TC-04-P17: The lot name opens the household detail on every row, and no row has "Manage"
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-20)
- **Action:** Press the lot name on a Not invited, an Invited, a Linked and an Email failed row (table and phone card).
- **Expected:** Each opens that household's detail; no "Manage" button anywhere.
- **Don't assert:** —

## Q. Usability and accessibility (WCAG 2.2 AA, 375 px)

#### TC-04-Q1: The code field has a visible label and the hint is tied to it
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Expected:** A visible label programmatically linked to the input; hint "You'll find it in your invitation email or on the slip from the admin office." referenced by `aria-describedby`.
- **Don't assert:** label wording beyond the copy of record.

#### TC-04-Q2: The code field uses the large monospaced code style
**Priority** P3 · **Type** UI/UX · **Layer** UI · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Expected:** Monospaced, large, letter-spaced like the guest pass `.code`; no autocorrect or auto-capitalise errors on phones.
- **Don't assert:** exact font size.

#### TC-04-Q3: A code can be pasted into the field
**Priority** P2 · **Type** Usability (WCAG 3.3.8) · **Layer** UI · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** Paste "K7QX-M9TA" from the clipboard.
- **Expected:** Accepted; confirm screen after submit.
- **Don't assert:** —

#### TC-04-Q4: Errors are announced and tied to the field, with focus kept there
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** Yes
**Role:** Homeowner without a household, with a screen reader. **Tags:** Step 1
- **Action:** Enter a wrong code.
- **Expected:** The error is announced (live region or `role="alert"`), shown under the field, linked by `aria-describedby`; focus stays in the field with the text kept.
- **Don't assert:** the announcement mechanism.

#### TC-04-Q5: While a code is being checked the button reads "Checking…" and is disabled
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 · Staging note: slowed network
- **Expected:** "Checking…", disabled, until the result.
- **Don't assert:** duration.

#### TC-04-Q6: The join screens are single cards at 375 px with the phone layout
**Priority** P2 · **Type** Responsive · **Layer** UI · **Writes** No
**Role:** Homeowner without a household on phone emulation (`isMobile`). **Tags:** Step 1 · DEF-001
- **Expected:** Layout width 375 (viewport meta present); code entry, confirm and error screens are single cards; no sideways scroll.
- **Don't assert:** —

#### TC-04-Q7: Tap targets on the join screens and the email button are large enough
**Priority** P2 · **Type** Usability (WCAG 2.5.8) · **Layer** UI · **Writes** No
**Role:** Homeowner at 375 px. **Tags:** Step 1; email button Step 2
- **Expected:** "Yes, link my account", "No, this isn't my lot", submit, and "Join the portal" at least 24 × 24 CSS px (target 44 px).
- **Don't assert:** exact sizes above the minimum.

#### TC-04-Q8: The on-screen keyboard doesn't hide the focused field or the error
**Priority** P3 · **Type** Usability (WCAG 2.4.11) · **Layer** Manual · **Writes** No
**Role:** Homeowner at 375 px. **Tags:** Step 1
- **Expected:** With the keyboard open, the field and its error stay visible.
- **Don't assert:** —

#### TC-04-Q9: Link-status pills carry text and enough contrast
**Priority** P3 · **Type** UI/UX · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** Every pill has words, not colour alone; text contrast ≥ 4.5:1 on both brands.
- **Don't assert:** colours.

#### TC-04-Q10: The Remove dialog traps focus, Escape cancels, and focus returns
**Priority** P2 · **Type** Usability · **Layer** UI · **Writes** No
**Role:** Admin office staff, keyboard only. **Tags:** Step 1 (NAV-06 regression)
- **Expected:** Focus inside the dialog; Tab cycles within; Escape closes without removing; focus returns to the Remove button.
- **Don't assert:** which button gets first focus.

#### TC-04-Q11: "Queuing…" and the bulk result are announced
**Priority** P3 · **Type** Usability · **Layer** UI · **Writes** Yes
**Role:** Admin office staff with a screen reader. **Tags:** Step 2
- **Expected:** The in-flight state and "380 invitations queued…" are announced.
- **Don't assert:** mechanism.

#### TC-04-Q12: The whole join flow works with a keyboard only
**Priority** P3 · **Type** Usability · **Layer** UI · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 1
- **Expected:** Code entry, submit with Enter, Yes / No reachable and operable with visible focus.
- **Don't assert:** —

#### TC-04-Q13: Phone directory cards show the pill and the invite action
**Priority** P3 · **Type** Responsive · **Layer** UI · **Writes** No
**Role:** Admin office staff at 375 px. **Tags:** Step 1
- **Expected:** Each card (3B) shows the link-status pill and its action (Print slip, Resend, Open) without sideways scroll.
- **Don't assert:** card order.

#### TC-04-Q14: Format and connection messages show under the code field and are announced
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household, with a screen reader. **Tags:** Step 1 (r5 UX "Accessibility")
- **Action:** Trigger the empty-code, malformed, offline and server-error messages.
- **Expected:** Each shows under the code field like the other code errors, is linked to the field and is announced; focus stays in the field.
- **Don't assert:** the announcement mechanism.

#### TC-04-Q15: Focus moves into each new staff dialog and back to the button that opened it
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff, keyboard only. **Tags:** Step 1 (r5 UX "Accessibility")
- **Action:** Open and close (Cancel or Keep invitation) the Withdraw confirm, Invite another person, the Change of owner form and the deactivate refusal.
- **Expected:** Focus moves into each when it opens and returns to the button that opened it when it closes; labels are visible; field errors sit under their field and are announced.
- **Don't assert:** which control gets first focus.

#### TC-04-Q16: The staff forms are single-column cards that fit 375 px
**Priority** P3 · **Type** Responsive · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff at 375 px. **Tags:** Step 1 · DEF-001
- **Expected:** Change of owner, Invite another person and Settings → Invitations are single columns with no sideways scroll; buttons at least 24 × 24 CSS px.
- **Don't assert:** exact sizes above the minimum.

## R. Copy consistency

#### TC-04-R1: Every join error matches the copy of record exactly
**Priority** P2 · **Type** UI/UX · **Layer** Unit · **Writes** Yes
**Role:** Homeowner (various fixture states). **Tags:** Step 1
- **Expected:** The seven error strings exactly as in REQ-004 Copy of record, with `{lot}` filled (e.g. "Blk 4 Lot 12"), each telling the person what to do next.
- **Don't assert:** punctuation styling (curly vs straight apostrophes) unless the BA fixes it.

#### TC-04-R2: Directory and detail buttons use only the labels of record
**Priority** P2 · **Type** UI/UX (same word everywhere) · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** (r5, G-20)
- **Expected:** Only "Invite", "Invite selected", "Resend invitation", "Invite another person", "Print invite slips", "Print slip", "Remove", "Withdraw invitation", "Change of owner". Never "Resend" alone, never "Manage" (the lot name opens the detail, P17). "Cancel" appears only as a dialog's close button, never for withdrawing an invitation.
- **Don't assert:** button order.

#### TC-04-R3: The same pill words, with the year, appear on the table, phone cards, filter chips and household detail
**Priority** P2 · **Type** UI/UX · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-8)
- **Expected:** "Not invited", "Invited · expires Dec 5, 2026", "Linked · 1 person" / "Linked · {n} people", "Invite expired", "Email failed", identical in every place; the date always with the year; invitation lines add only "Used {date}".
- **Don't assert:** colours.

#### TC-04-R4: "Linked · 1 person" and "Linked · 2 people" use the right number word
**Priority** P2 · **Type** Boundary · **Layer** Unit · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** Singular at 1, plural at 2 and above.
- **Don't assert:** —

#### TC-04-R5: Code entry, confirm and wrong-lot texts match the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** UI · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Expected:** "Enter your invite code", its hint, "You're joining {lot} ({owner name}). Is this your lot?", "Yes, link my account", "No, this isn't my lot", "Please contact the admin office to get the right invitation."
- **Don't assert:** —

#### TC-04-R6: The HOA name follows the brand in email, slip and screens
**Priority** P2 · **Type** UI/UX · **Layer** UI · **Writes** Yes
**Role:** Admin office staff on each brand. **Tags:** Step 1 and 2
- **Expected:** "Greenfield Homes HOA" on one brand, "Gentri Heights HOA" on the other, in the subject, body and slip; never the other brand's name.
- **Don't assert:** logos.

#### TC-04-R7: The r5 and r6 homeowner messages match the copy of record
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner (various fixture states). **Tags:** Step 1
- **Expected:** Exactly: "Your access to {lot} was removed by the admin office. Ask them if you think this is a mistake." · "You're already linked to {lot}. That code wasn't used, so the person it was meant for can still use it." · "You're offline. Connect to the internet to use your invite code." · "We couldn't check the code. Check your connection and try again." · "We couldn't link your account. Check your connection and try again." · "Enter the code from your invitation." · "Invite codes have 8 letters and numbers, like K7QX-M9TA. They never use O, 0, I or 1." · "We couldn't save your details. Check your connection and try again." (the same text as REQ-001) · "Linking…".
- **Don't assert:** curly vs straight apostrophes.

## S. Back-compat and data integrity

#### TC-04-S1: A household created before invitations existed shows "Not invited"
**Priority** P1 · **Type** Back-compat · **Layer** UI · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 · Staging note: HH-LEGACY written without `linkStatus` and `memberCount`
- **Expected:** "Not invited" pill; the "Not invited" filter includes it; never blank, "undefined" or "Linked · 0 people".
- **Don't assert:** —

#### TC-04-S2: Inviting a legacy household works and fills in its link fields
**Priority** P2 · **Type** Back-compat · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Print a slip for HH-LEGACY; a fixture account redeems.
- **Expected:** "Invited", then "Linked · 1 person"; `linkStatus` and `memberCount` now present and correct.
- **Don't assert:** —

#### TC-04-S3: A freshly imported household shows "Not invited" and can be invited
**Priority** P3 · **Type** Integration · **Layer** API · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (REQ-003 regression)
- **Expected:** After a fixture import, the household shows "Not invited" and "Print slip" / "Invite" are offered.
- **Don't assert:** import details (TC-03).

#### TC-04-S4: Member count always equals the number of memberships
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** Yes
**Role:** QE runs a sequence. **Tags:** —
- **Action:** Invite, redeem, invite another, redeem, remove one, re-entry, double remove on HH-A; check after each step.
- **Expected:** `memberCount` = count of `members` for HH-A after every step.
- **Don't assert:** —

#### TC-04-S5: Link status always follows the r5 status order
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** Yes
**Role:** QE runs the S4 sequence plus expiry, a co-owner's failed email and withdrawals. **Tags:** (r5, G-2, G-3, G-9)
- **Expected:** After every step the household shows: "Linked · {n}" if anyone is linked; else "Email failed" if any active invitation's email failed; else "Invited · expires {latest}" if any is unused; else "Invite expired" if any active one has expired; else "Not invited". Never "Linked · 0 people".
- **Don't assert:** —

#### TC-04-S6: There is never more than one active invitation per slot
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** No
**Role:** QE data check after blocks A–N and T–W. **Tags:** Provisional — not yet in SA-001: invitation `slot`
- **Expected:** For every (household, slot) at most one `active` invitation; a household may have several active invitations only in different slots.
- **Don't assert:** —

#### TC-04-S7: Every used invitation has exactly one matching membership, and every membership one invitation
**Priority** P1 · **Type** Data integrity · **Layer** API · **Writes** No
**Role:** QE data check. **Tags:** —
- **Expected:** Each `used` invite's `usedBy` + household matches a membership whose `inviteId` is that invite, unless the member was removed (then a `member.removed` entry exists); no membership without an invite.
- **Don't assert:** —

#### TC-04-S8: Every lifecycle action writes exactly one audit entry of the right kind
**Priority** P2 · **Type** Data integrity · **Layer** API · **Writes** No
**Role:** QE data check. **Tags:** —
- **Expected:** One `invite.created` per created, one `invite.replaced` per replacement, one `invite.cancelled` per cancellation, one `invite.redeemed` per redeem (not per re-entry), one `member.removed` per removal (not per "already removed").
- **Don't assert:** entries outside the fixture households.

#### TC-04-S9: Zero members and "never linked" both read "Not invited", never "Linked · 0 people"
**Priority** P2 · **Type** Boundary (zero vs not set) · **Layer** Unit · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-9)
- **Setup:** HH-LEGACY (field missing) and HH-A after its last member is removed (`memberCount` 0, no unused invitation).
- **Expected:** Both show "Not invited"; neither shows "Linked · 0 people", a blank or "undefined".
- **Don't assert:** —

#### TC-04-S10: Directory header counts are five groups of active households that add up
**Priority** P2 · **Type** Data integrity · **Layer** UI · **Writes** No
**Lane:** exclusive — asserts the directory-wide header counts and filter chips
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-3)
- **Expected:** The header reads "{total} households · {linked} linked · {invited} invited · {expired} invite expired · {failed} email failed · {not invited} not invited"; linked + invited + invite expired + email failed + not invited = total active households; each chip count equals its header count.
- **Don't assert:** absolute numbers.

#### TC-04-S11: Link status and the latest expiry equal a fresh recount after every writer
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** QE runs a sequence. **Tags:** Step 1 and 2 (r5, C-3) · Provisional — not yet in SA-001: `inviteExpiresAt`
- **Action:** On HH-A, run each writer once: createInvites (owner and person slot), cancelInvite, redeemInvite, removeMember, changeOwner, deactivate and reactivate (with no one linked), and the mail function failing a co-owner's email. After each, recompute the status and the latest unused expiry from the invitations and members.
- **Expected:** After every step `linkStatus` and `inviteExpiresAt` equal the recount; no writer ever leaves a value another writer set (for example a co-owner's failure never overwrites "linked").
- **Don't assert:** the stored field spellings.

#### TC-04-S12: Withdrawal, change of owner and an expiry change each write exactly one audit entry
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** QE data check after T, U and V. **Tags:** (r5 Data "Change records") · NG-11
- **Expected:** One entry per withdrawal (none for a repeated withdraw), one per change of owner (none for a refused one), one per expiry-settings save holding the old and new values (none for a refused value).
- **Don't assert:** the action codes (NG-11).

#### TC-04-S13: `usedBy` is never cleared, after a removal or a change of owner
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** QE reads. **Tags:** (r5, Sol Arch Q10)
- **Action:** After K-block removals and U2, read every used invitation of those households.
- **Expected:** Each still has its original `usedBy` and `usedAt`; that is what lets K11 and U18 answer "access removed".
- **Don't assert:** —

## T. Withdrawing an invitation (v1.1: r5, G-5)

Staff "withdraw" on screen; the data status is `cancelled`, reason withdrawn. "Cancel" stays the label for closing a dialog. The server half (code refused, one audit entry) is A5 and A7; roles are M4 and M18.

#### TC-04-T1: "Withdraw invitation" asks the confirm of record
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** HH-A with an unused printed slip the household reports lost.
- **Action:** On that line of the Invitations list press "Withdraw invitation".
- **Expected:** "Withdraw this invitation? Its code stops working at once. You can invite again later." with "Keep invitation" and "Withdraw".
- **Don't assert:** dialog layout.

#### TC-04-T2: Confirming shows "Invitation withdrawn." and the line leaves the list
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** From T1 press "Withdraw".
- **Expected:** "Invitation withdrawn."; the line is gone from the Invitations list; the code at once reads "This invitation is no longer valid. Ask the admin office." (the promise "stops working at once", proven at data level by A5).
- **Don't assert:** toast duration.

#### TC-04-T3: After a withdrawal the household's status is worked out again
**Priority** P1 · **Type** Integration (derived figure) · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** (a) HH-A's only invitation is the slip; (b) HH-C has an unused owner slip and an unused co-owner slip.
- **Action:** Withdraw (a) the slip; (b) the owner slip.
- **Expected:** (a) "Not invited", and "Print slip" is offered again; (b) still "Invited · expires {co-owner date}".
- **Don't assert:** —

#### TC-04-T4: A withdrawal is recorded with who did it and when
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** QE reads. **Tags:** Step 1 · NG-11
- **Expected:** One entry with S-ADMIN's uid, HH-A, the invitation and the time; ids only.
- **Don't assert:** the action code or the activity-log sentence (NG-11).

#### TC-04-T5: "Keep invitation", a backdrop click or Escape leaves the code working
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Open the Withdraw confirm; press "Keep invitation"; repeat with a backdrop click and Escape.
- **Expected:** The line stays; the code still opens the confirm screen; no audit entry.
- **Don't assert:** whether the backdrop closes the dialog (it holds no input).

#### TC-04-T6: "Withdraw" pressed twice quickly reads "Withdrawing…" and withdraws once
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-33)
- **Action:** Double-press "Withdraw".
- **Expected:** "Withdrawing…", disabled until the save finishes; one withdrawal; one audit entry.
- **Don't assert:** —

#### TC-04-T7: A used invitation's line reads "Used {date}" and has no "Withdraw invitation"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** U-ANA linked to HH-A on Nov 29, 2026.
- **Expected:** Her invitation's line reads "Used Nov 29, 2026" with no "Withdraw invitation", "Resend invitation" or "Print slip"; "Remove" next to her name is the way to stop her access.
- **Don't assert:** —

#### TC-04-T8: A withdrawal and a redeem at the same moment end in one consistent state
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN and U-STRANGER, scripted. **Tags:** Step 1 · NG-5
- **Action:** Fire `cancelInvite` and `redeemInvite` for the same unused code together, 10 times on fresh fixtures.
- **Expected:** Each run ends either used with one membership (the withdrawal refused) or cancelled with no membership (the redeem told "no longer valid"). Never both a member and a cancelled invitation from the pair.
- **Don't assert:** which wins; the message staff see when the withdrawal is refused (NG-5).

## U. Change of owner (v1.1: r5, decision 7, G-28, G-29, Sol Arch C-1, C-2)

Setup for the block unless a case says otherwise: HH-A with U-ANA ("ZZ Ana R.") and U-CARLO linked, an unused co-owner invitation, owner on file "ZZ Ana Reyes", contact email zz.owner.a@example.test and mobile "0917 555 0101". The lot is sold to ZZ Rosa Lim.

#### TC-04-U1: "Change of owner" opens the form of record, naming everyone who will lose access
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** On HH-A's detail press "Change of owner".
- **Expected:** "Change of owner for Blk 2 Lot 7"; "Everyone linked to this lot loses access at once: {Ana's name}, {Carlo's name}. Every unused invitation stops working. Its bills and payments stay with the lot."; fields "New owner's name", "New owner's email (optional)", "New owner's mobile (optional)"; "Cancel" and "Change owner".
- **Don't assert:** the name source (NG-2).

#### TC-04-U2: "Change owner" removes everyone linked at once
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; U-ANA and U-CARLO read. **Tags:** Step 1 · Provisional — not yet in SA-001: `changeOwner`
- **Action:** Enter "ZZ Rosa Lim" and "zz.rosa@example.test"; press "Change owner"; U-ANA and U-CARLO request HH-A's household document.
- **Expected:** Both memberships are deleted; both reads are refused on the next request.
- **Don't assert:** —

#### TC-04-U3: "Change owner" stops every unused invitation, owner and person slots alike
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; homeowner without a household. **Tags:** Step 1
- **Setup:** Also an unused printed owner slip.
- **Action:** After U2, enter the co-owner code and the owner slip's code.
- **Expected:** Both read "This invitation is no longer valid. Ask the admin office."; both `cancelled` with reason "owner changed".
- **Don't assert:** —

#### TC-04-U4: The owner on file and contact email become the new owner's, and a blank mobile stays blank
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** After U2, open HH-A in the directory and its REQ-003 dialog.
- **Expected:** Owner "ZZ Rosa Lim"; contact email "zz.rosa@example.test"; contact mobile blank (the seller's "0917 555 0101" is gone).
- **Don't assert:** —

#### TC-04-U5: The seller's name and contacts are kept nowhere in the portal
**Priority** P1 · **Type** Security (privacy) · **Layer** TBD — QE · **Writes** No
**Role:** QE reads every collection the change wrote. **Tags:** Step 1 (r5, C-2) · Provisional — not yet in SA-001: C-2's "not kept anywhere" (office and DPO to confirm, REQ-004 Open questions)
- **Action:** After U2, search `households`, `householdContacts`, `auditLog` and the function's logs for "ZZ Ana Reyes", "zz.owner.a@example.test" and "0917 555 0101".
- **Expected:** No match. The removed accounts stay traceable by uid in the audit entry.
- **Don't assert:** membership documents of other households.

#### TC-04-U6: The directory search finds the lot by the new owner's name, not the seller's
**Priority** P2 · **Type** Integration (derived figure) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (r5, C-2)
- **Action:** After U2, search "rosa" and then "reyes" in "Search name or lot".
- **Expected:** "rosa" lists Blk 2 Lot 7; "reyes" doesn't (unless another fixture is named Reyes).
- **Don't assert:** result order.

#### TC-04-U7: After a change of owner the household shows "Not invited"
**Priority** P1 · **Type** Integration (derived figure) · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** After U2, HH-A's pill is "Not invited" on the row, phone card and detail; `memberCount` 0; "People with portal access" shows the empty line (K20).
- **Don't assert:** header counts.

#### TC-04-U8: The done message names the new owner and says to invite her
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** "Blk 2 Lot 7 now shows ZZ Rosa Lim as owner. Invite the new owner when you're ready."
- **Don't assert:** —

#### TC-04-U9: A change of owner is recorded with ids only
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** QE reads. **Tags:** Step 1 · NG-11
- **Expected:** One entry with S-ADMIN's uid, HH-A, the removed uids and the time; no owner name, email or mobile, old or new.
- **Don't assert:** the action code or staff `actorName` (NG-11).

#### TC-04-U10: "Change owner" pressed twice quickly reads "Saving…" and changes once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-33)
- **Action:** Double-press "Change owner".
- **Expected:** "Saving…", disabled until the save finishes; one change; one audit entry; no error shown for the second press.
- **Don't assert:** —

#### TC-04-U11: An empty name shows "Enter the new owner's name" and keeps what was typed
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Type an email, leave the name empty, press "Change owner".
- **Expected:** "Enter the new owner's name" under the name field; the email still typed; nothing changed on the server.
- **Don't assert:** —

#### TC-04-U12: A wrong-format email or mobile gets the household form's messages
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 (REQ-003 validation reused)
- **Action:** Enter "zz.rosa@" as the email, and separately "0917 55" as the mobile.
- **Expected:** The same messages as REQ-003's household form gives for those values (TC-03 block C); nothing changed.
- **Don't assert:** the message text here (TC-03 owns it).

#### TC-04-U13: The new owner's name accepts REQ-003's maximum and refuses one more
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (Sol Arch Q7: reuses REQ-003's household validation, owner name up to 80 characters)
- **Action:** Enter an 80-character name and save (fresh fixture); then try 81.
- **Expected:** 80 saved; 81 refused with REQ-003's message; nothing changed.
- **Don't assert:** the message text (TC-03).

#### TC-04-U14: A click outside the form doesn't close it
**Priority** P2 · **Type** Usability · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 · NG-15
- **Action:** Type a name and email; click the backdrop.
- **Expected:** The form stays open with both values.
- **Don't assert:** Escape (NG-15).

#### TC-04-U15: "Cancel" closes the form and changes nothing
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Open the form, type a name, press "Cancel".
- **Expected:** Back on HH-A's detail; both people still linked; the co-owner code still works; no audit entry.
- **Don't assert:** —

#### TC-04-U16: Someone linking while the form is open stops the change, and the form lists them
**Priority** P1 · **Type** Concurrency (stale reference) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN; U-LIZA redeems the co-owner code meanwhile. **Tags:** Step 1 (r5, C-1)
- **Action:** S-ADMIN opens the form (Ana and Carlo listed) and types; U-LIZA links; S-ADMIN presses "Change owner".
- **Expected:** Nothing changed: no one removed, no invitation stopped, owner name unchanged. "Someone joined or left Blk 2 Lot 7 since you opened this. Check the list and try again."; the form now lists Ana, Carlo and Liza; what was typed is kept.
- **Don't assert:** —

#### TC-04-U17: Someone being removed while the form is open also stops the change
**Priority** P2 · **Type** Concurrency (stale reference) · **Layer** TBD — QE · **Writes** Yes
**Role:** S-ADMIN with the form open; S-ADMIN-2 removes Carlo. **Tags:** Step 1 (r5, C-1)
- **Action:** S-ADMIN presses "Change owner" after the removal.
- **Expected:** Nothing changed by the change of owner; the same "Someone joined or left…" message; the form lists Ana only.
- **Don't assert:** —

#### TC-04-U18: The seller re-entering her old code is told her access was removed
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA after U2. **Tags:** Step 1 (r5, Sol Arch Q10: `usedBy` kept)
- **Action:** U-ANA enters the code she used.
- **Expected:** "Your access to Blk 2 Lot 7 was removed by the admin office. Ask them if you think this is a mistake."; not linked; not counted.
- **Don't assert:** —

#### TC-04-U19: The seller's open screen changes to "Enter your invite code" within a minute
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** U-ANA with HH-A's dashboard open, online. **Tags:** Step 1
- **Action:** Staff run Change of owner.
- **Expected:** As K18: within a minute "Enter your invite code", no HH-A data on screen.
- **Don't assert:** the exact delay.

#### TC-04-U20: Change of owner is refused for board, guard, homeowner, no-role and signed-out callers
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-BOARD, S-GUARD, U-JUAN, U-STRANGER, anonymous, scripted. **Tags:** Step 1 · Provisional — not yet in SA-001: `changeOwner`
- **Action:** Each calls `changeOwner` for HH-A with the right member list.
- **Expected:** Every call refused; memberships, invitations, owner name and contacts unchanged.
- **Don't assert:** error code names.

#### TC-04-U21: The lot's bills and payments stay with the lot after a change of owner
**Priority** P2 · **Type** Data integrity (copy promises) · **Layer** TBD — QE · **Writes** Yes
**Role:** QE reads. **Tags:** Step 1 · Staging note: seeded bill and payment documents for HH-A
- **Expected:** After U2, every seeded bill and payment still carries `householdId` = HH-A; totals unchanged; nothing deleted or moved.
- **Don't assert:** what the new owner sees of them (decision 5, block L).

#### TC-04-U22: After saving, the admin stays on the household detail with the new state shown
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** After U2 the form closes onto HH-A's detail, showing "ZZ Rosa Lim", "Not invited", the empty people line and an empty Invitations list; focus returns to a sensible place.
- **Don't assert:** the exact focus target.

#### TC-04-U23: Change of owner on a lot where no one is linked
**Priority** P3 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 · NG-8
- **Setup:** HH-C, never linked, with an unused slip.
- **Action:** Run Change of owner to "ZZ New Owner C".
- **Expected:** The owner name changes; the slip reads "no longer valid"; HH-C "Not invited".
- **Don't assert:** the form's "loses access at once: {names}" line with no names (NG-8).

#### TC-04-U24: With only a name given, both the contact email and mobile end up blank
**Priority** P2 · **Type** Boundary (zero vs not set) · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (decision 7: "left blank if not given, so the seller's contacts don't stay")
- **Action:** Run Change of owner with only "ZZ Rosa Lim".
- **Expected:** Contact email and mobile both blank; HH-A then offers "Print slip" and no "Invite" (no email on file).
- **Don't assert:** —


## V. Invitation expiry settings (v1.1: r5, decision 6, G-7)

The screen is Settings → Invitations. The date effect on new and old invitations is E11, E12, E13; the pure validation is E14.

#### TC-04-V1: Admin office staff change the emailed expiry and see it saved
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff (S-ADMIN). **Tags:** Step 1
- **Action:** Open Settings → Invitations; set "Emailed invitations expire after (days)" to 14; press "Save"; reopen the card.
- **Expected:** "Saving…", disabled until the save finishes; "Saved. New invitations use these dates."; on reopen the field reads 14 and the printed field still 30.
- **Don't assert:** card position on the Settings page.

#### TC-04-V2: The card says changes apply only to new invitations
**Priority** P3 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Step 1
- **Expected:** "Invitations", the two labelled fields, and "Changes apply to invitations made from now on. Invitations already made keep their date."
- **Don't assert:** —

#### TC-04-V3: 0 days is refused
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Step 1
- **Action:** Enter 0 in "Printed slips expire after (days)" and leave the field; press "Save".
- **Expected:** "Enter a whole number of days from 1 to 90." under the field; Save stores nothing (the stored value is unchanged).
- **Don't assert:** —

#### TC-04-V4: 1 day is accepted, and a slip printed Nov 28 then expires at the end of Nov 29
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer; admin office staff prints. **Tags:** Step 1
- **Action:** Save 1 for printed slips; print a slip for HH-C on Nov 28, 2026.
- **Expected:** Saved; the slip reads "Expires at the end of Nov 29, 2026 (Philippine time)".
- **Don't assert:** —

#### TC-04-V5: 90 days is accepted
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Step 1
- **Expected:** Saved; a slip printed Nov 28, 2026 expires at the end of Feb 26, 2027.
- **Don't assert:** —

#### TC-04-V6: 91 days is refused
**Priority** P1 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Step 1
- **Expected:** "Enter a whole number of days from 1 to 90."; nothing stored.
- **Don't assert:** —

#### TC-04-V7: A negative, a fraction or an empty field is refused
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** Treasurer. **Tags:** Step 1
- **Action:** Enter −3, then 7.5, then clear the field; leave the field each time.
- **Expected:** "Enter a whole number of days from 1 to 90." each time; nothing stored.
- **Don't assert:** —

#### TC-04-V8: The server refuses an out-of-range value sent directly
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, scripted (page check skipped). **Tags:** Step 1 (Sol Arch Q12) · Provisional — not yet in SA-001: `setInviteExpiry`
- **Action:** Call `setInviteExpiry` with 0, 91, 7.5 and "abc".
- **Expected:** Each refused; stored values unchanged; no audit entry.
- **Don't assert:** error code.

#### TC-04-V9: Board, guard and homeowner don't see the Invitations settings
**Priority** P2 · **Type** Security (role) · **Layer** TBD — QE · **Writes** No
**Role:** S-BOARD, S-GUARD, U-JUAN. **Tags:** Step 1
- **Expected:** No Invitations card; opening the Settings URL shows their no-access page (REQ-002).
- **Don't assert:** the rest of each role's menu.

#### TC-04-V10: A direct write of the expiry settings from board, guard or homeowner is refused
**Priority** P1 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** S-BOARD, S-GUARD, U-JUAN, U-STRANGER, scripted. **Tags:** Step 1
- **Action:** Each calls `setInviteExpiry` with valid values, and writes the settings document directly.
- **Expected:** Every attempt refused explicitly; stored values unchanged.
- **Don't assert:** "nothing changed on screen" as proof.

#### TC-04-V11: Each change is recorded with who, the old and new values, and when
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** QE reads. **Tags:** Step 1 · NG-11
- **Expected:** After V1: one entry with S-ADMIN's uid, email days 7 → 14, and the time.
- **Don't assert:** the action code or sentence (NG-11).

#### TC-04-V12: Changing one field leaves the other as it was
**Priority** P3 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** Treasurer. **Tags:** Step 1
- **Action:** With 7 / 30 stored, save print = 45 only.
- **Expected:** Email still 7; print 45; a new email invitation expires 7 days on.
- **Don't assert:** —

#### TC-04-V13: "Save" pressed twice quickly saves once
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-33)
- **Expected:** "Saving…", disabled; one stored change; one audit entry.
- **Don't assert:** —

#### TC-04-V14: Settings → Invitations is reached from the Settings menu for admin and treasurer
**Priority** P3 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** S-ADMIN, S-TREAS. **Tags:** Step 1 (NAV-03 regression)
- **Expected:** "Settings" is the one `aria-current` menu item; the Invitations card is on the page; leaving and coming back shows the stored values.
- **Don't assert:** the order of cards (TC-07).

## W. Household status, pills and counts (v1.1: r5, G-1, G-2, G-3)

Order of record: Linked · {n} → Email failed → Invited · expires {latest} → Invite expired → Not invited. Rows 6 and 7 of the REQ outline are K7 and S1.

#### TC-04-W1: A linked household with a failed email to another person shows "Linked · 1 person"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2
- **Setup:** U-ANA linked; Carlo's invitation email failed.
- **Expected:** Directory pill "Linked · 1 person"; Carlo's line on the detail page reads "Email failed".
- **Don't assert:** —

#### TC-04-W2: Two people linked with an unused co-owner invitation shows "Linked · 2 people"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** "Linked · 2 people".
- **Don't assert:** —

#### TC-04-W3: No one linked, an unused owner invitation and a co-owner's failed email shows "Email failed"
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 2
- **Expected:** "Email failed" (it wins over Invited).
- **Don't assert:** —

#### TC-04-W4: No one linked, an unused owner invitation and an expired co-owner invitation shows "Invited"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Setup:** Owner slip expires Dec 28, 2026; co-owner slip expired.
- **Expected:** "Invited · expires Dec 28, 2026".
- **Don't assert:** —

#### TC-04-W5: Only expired invitations shows "Invite expired"
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1
- **Expected:** "Invite expired".
- **Don't assert:** —

#### TC-04-W6: With several unused invitations, the pill shows the latest expiry
**Priority** P2 · **Type** Boundary · **Layer** TBD — QE · **Writes** No
**Role:** Admin office staff. **Tags:** Step 1 and 2 · Provisional — not yet in SA-001: `inviteExpiresAt`
- **Setup:** No one linked; unused owner email invitation (Dec 5, 2026) and unused co-owner slip (Dec 28, 2026).
- **Expected:** "Invited · expires Dec 28, 2026"; on Dec 6 it still reads "Invited · expires Dec 28, 2026", not "Invite expired".
- **Don't assert:** —

#### TC-04-W7: Inactive households are counted only in the "Inactive" chip
**Priority** P2 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Lane:** exclusive — asserts the directory header total and the Inactive chip
**Role:** Admin office staff. **Tags:** Step 1
- **Action:** Note the header total and "Inactive (n)"; deactivate HH-D (no one linked).
- **Expected:** The header total falls by 1 and none of the five groups counts HH-D; "Inactive" rises by 1.
- **Don't assert:** absolute numbers.

#### TC-04-W8: An invitation passing its expiry moves its household to the "Invite expired" count with nothing written
**Priority** P2 · **Type** Integration (derived figure) · **Layer** TBD — QE · **Writes** No
**Lane:** exclusive — asserts the "invited" and "invite expired" header counts and chips
**Role:** Admin office staff. **Tags:** Step 1 (r5, G-3; Sol Arch Q1 read-time counts)
- **Setup:** HH-A's only invitation's `expiresAt` seeded to a moment just past.
- **Expected:** "invited" is one lower and "invite expired" one higher than with `expiresAt` just ahead; the "Invite expired" chip lists HH-A; `households/HH-A` was not written.
- **Don't assert:** absolute numbers.

#### TC-04-W9: A co-owner's failed email on a linked household leaves the stored status "linked"
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** QE reads. **Tags:** Step 2 (r5, Sol Arch Q2, C-3)
- **Action:** As W1, let the mail function mark Carlo's email failed; read `households/HH-A`.
- **Expected:** `linkStatus` linked; `memberCount` 1 (the failure recomputed, it didn't overwrite).
- **Don't assert:** the stored spelling.

## Y. Person record and the 15-second limit (v1.1: r6, from REQ-001 r4)

REQ-001's side ("Continue" creates the missing record, the 15-second save) is TC-01-F11, TC-01-F20, TC-01-F21; this block is `redeemInvite`'s refusal and the code calls' time limit. **Staging note for every timing case:** delay or stall the function's answer (emulator proxy or test hook); don't move a clock. Boundaries: an answer at 14 s (just under), no answer (the page gives up by 15 s), an answer at 16 s (just over, after the page gave up).

#### TC-04-Y1: Pressing "Yes, link my account" with no person record shows "We couldn't save your details…"
**Priority** P1 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** U-NOREC on the HH-A confirm screen. **Tags:** Step 1
- **Action:** Press "Yes, link my account".
- **Expected:** "We couldn't save your details. Check your connection and try again."; she stays on the confirm screen and "Yes, link my account" can be pressed again.
- **Don't assert:** the app's own repair of the record (TC-01-F21).

#### TC-04-Y2: That refusal writes nothing: no membership, no `memberOf`, no status change
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** U-NOREC, scripted; QE reads. **Tags:** Step 1 · Provisional — not yet in SA-001: the person-record read in `redeemInvite`
- **Action:** Call `redeemInvite` with HH-A's valid code.
- **Expected:** Refused as a failed precondition; no `members` doc; no `memberOf/{uid}`; HH-A's `linkStatus`, `memberCount` and `inviteExpiresAt` unchanged; no `invite.redeemed` entry. (Same refusal as TC-01-F20; QE runs it once and reports both ids.)
- **Don't assert:** the error text.

#### TC-04-Y3: After that refusal the code is not used up
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** Yes
**Role:** U-NOREC, then U-STRANGER. **Tags:** Step 1
- **Action:** After Y2, read the invitation; U-STRANGER redeems the same code.
- **Expected:** Still `active`, no `usedBy`; U-STRANGER links with it.
- **Don't assert:** —

#### TC-04-Y4: That refusal doesn't change the wrong-code count
**Priority** P2 · **Type** Negative · **Layer** TBD — QE · **Writes** No
**Role:** U-NOREC with 4 non-matching codes recorded. **Tags:** Step 1
- **Action:** Press Yes (refused for the missing record); then enter a non-matching code.
- **Expected:** The non-matching code shows "That code doesn't match…" (the 5th), not "Too many wrong codes…".
- **Don't assert:** —

#### TC-04-Y5: Once the person record exists, pressing Yes again links her
**Priority** P1 · **Type** Happy path · **Layer** TBD — QE · **Writes** Yes
**Role:** U-NOREC. **Tags:** Step 1
- **Action:** After Y1, create her `users/{uid}` (as the app would on the next open, REQ-001); press "Yes, link my account" again.
- **Expected:** She lands on HH-A's dashboard; one membership and `memberOf` entry.
- **Don't assert:** how the record was created (TC-01).

#### TC-04-Y6: Checking a code works without a person record
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** U-NOREC, scripted. **Tags:** Step 1 (r6 Design: "checkInvite doesn't need the person record")
- **Action:** Call `checkInvite` with HH-A's code.
- **Expected:** It returns the lot and owner name for the confirm screen.
- **Don't assert:** —

#### TC-04-Y7: An account with no person record can't use the linking call to test codes past the limit
**Priority** P2 · **Type** Security · **Layer** TBD — QE · **Writes** Yes
**Role:** U-NOREC, scripted. **Tags:** Step 1 · NG-3
- **Action:** Call `redeemInvite` 20 times with non-matching codes, with HH-A's valid code mixed in at call 10 and call 20.
- **Expected:** Either every call is refused for the missing record with the same answer (nothing learned), or non-matching codes count and the account is locked after 5. In no reading does the valid code get a different answer from the non-matching ones after the 5th.
- **Don't assert:** which of the two orders the server uses (NG-3).

#### TC-04-Y8: "Continue" answered at 14 seconds shows the confirm screen
**Priority** P2 · **Type** Boundary (just under) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** `checkInvite`'s answer delayed 14 s.
- **Expected:** "Checking…" until the answer, then the confirm screen for HH-A; no error message.
- **Don't assert:** —

#### TC-04-Y9: "Continue" with no answer gives up by 15 seconds
**Priority** P1 · **Type** Boundary (at the limit) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 · Provisional — not yet in SA-001: the 15-second client limit
- **Setup:** `checkInvite` never answers.
- **Action:** Press "Continue"; watch for 20 s.
- **Expected:** By 15 s "Checking…" ends and "We couldn't check the code. Check your connection and try again." shows; the code is still typed; "Continue" can be pressed again. It doesn't wait for the 70-second default.
- **Don't assert:** the exact millisecond.

#### TC-04-Y10: An answer that arrives at 16 seconds, after the page gave up, doesn't change the screen by itself
**Priority** P3 · **Type** Boundary (just over) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 · NG-4 · Assumption: the page discards a late answer
- **Setup:** `checkInvite`'s answer delayed 16 s.
- **Expected:** At 15 s the message shows; when the late answer arrives nothing links and the person isn't moved anywhere they didn't ask to go.
- **Don't assert:** whether the late answer opens the confirm screen (NG-4).

#### TC-04-Y11: After a "Continue" timeout the code is untouched and pressing again checks it afresh
**Priority** P2 · **Type** Integration · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1
- **Action:** After Y9, restore the answer; press "Continue" again.
- **Expected:** The invitation is still `active`; the wrong-code count is unchanged by the timeout; the confirm screen opens.
- **Don't assert:** the count if the stalled call later reached the server (NG-4).

#### TC-04-Y12: "Yes, link my account" answered at 14 seconds lands on the dashboard
**Priority** P2 · **Type** Boundary (just under) · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 1
- **Setup:** `redeemInvite`'s answer delayed 14 s.
- **Expected:** "Linking…" until the answer, then HH-A's dashboard.
- **Don't assert:** —

#### TC-04-Y13: "Yes, link my account" with no answer gives up by 15 seconds
**Priority** P1 · **Type** Boundary (at the limit) · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 · Provisional — not yet in SA-001: the 15-second client limit
- **Setup:** `redeemInvite` never answers.
- **Expected:** By 15 s "Linking…" ends with "We couldn't link your account. Check your connection and try again."; the confirm screen stays; "Yes, link my account" can be pressed again.
- **Don't assert:** the exact millisecond.

#### TC-04-Y14: When the stalled link never reached the server, the code is still unused
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** QE reads after Y13 with the call blocked before the server. **Tags:** Step 1
- **Expected:** The invitation is `active`; no membership; the count unchanged; pressing Yes again once the server answers links her.
- **Don't assert:** —

#### TC-04-Y15: When the link went through after the page gave up, pressing Yes again lands on the dashboard once
**Priority** P1 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 1 · Staging note: the server commits at 16 s
- **Setup:** `redeemInvite` commits but answers at 16 s.
- **Action:** After the 15-second message, press "Yes, link my account" again.
- **Expected:** HH-A's dashboard; exactly one membership and one `memberOf` entry; the invitation used by her and nobody else.
- **Don't assert:** what the page showed when the late answer arrived (NG-4).

#### TC-04-Y16: When the link went through after the page gave up, reopening the portal lands on the dashboard
**Priority** P2 · **Type** Navigation · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner, as Y15 but she reloads instead of pressing Yes. **Tags:** Step 1 · NG-4
- **Expected:** HH-A's dashboard (she is a member: REQ-001 landing), not "Enter your invite code".
- **Don't assert:** —

#### TC-04-Y17: The in-flight words are "Checking…" on "Continue" and "Linking…" on "Yes, link my account"
**Priority** P2 · **Type** UI/UX · **Layer** TBD — QE · **Writes** No
**Role:** Homeowner without a household. **Tags:** Step 1 (r6 copy)
- **Expected:** While each call runs, the button reads its in-flight word and is disabled; after the result or the 15-second message it reads "Continue" / "Yes, link my account" and is enabled.
- **Don't assert:** spinner design.

## Z. The `memberOf` index (v1.1: r4, kept by `changeOwner` in r5)

The readers (announcement rules, no client writes, the back-fill for people linked before S3) are TC-16-J9, TC-16-J10, TC-16-J12, TC-16-J13 and TC-17; this block proves the writes. **Tags for every Z case:** Provisional — not yet in SA-001: `memberOf/{uid}`.

#### TC-04-Z1: A redeem adds the household to `memberOf` in the same transaction as the membership
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA; QE reads. **Tags:** Step 1
- **Action:** After C5, read `memberOf/{U-ANA uid}`.
- **Expected:** `householdIds` = [HH-A]; written by the same commit as `members/{HH-A}_{uid}` (a redeem failed mid-transaction leaves neither).
- **Don't assert:** —

#### TC-04-Z2: A refused redeem writes no `memberOf`
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** U-STRANGER, U-JUAN, U-NOREC. **Tags:** Step 1
- **Action:** Redeem refused as already used, expired, no longer valid, already linked (U-JUAN) and missing person record (U-NOREC).
- **Expected:** No `memberOf` doc for U-STRANGER or U-NOREC; U-JUAN's still lists only HH-B.
- **Don't assert:** —

#### TC-04-Z3: Removal takes the household out of `memberOf`, and deletes the document when empty
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** Admin office staff; QE reads. **Tags:** Step 1
- **Action:** Remove U-ANA from HH-A; read `memberOf/{U-ANA uid}`.
- **Expected:** The document no longer exists (her only household); TC-16-J9's announcement refusal then follows.
- **Don't assert:** —

#### TC-04-Z4: Change of owner removes the household from every removed person's `memberOf`
**Priority** P1 · **Type** Integration · **Layer** TBD — QE · **Writes** Yes
**Role:** QE reads after U2. **Tags:** Step 1
- **Expected:** Neither U-ANA nor U-CARLO has a `memberOf` document listing HH-A.
- **Don't assert:** —

#### TC-04-Z5: A retried redeem doesn't list the household twice
**Priority** P2 · **Type** Concurrency · **Layer** TBD — QE · **Writes** Yes
**Role:** U-ANA. **Tags:** Step 1
- **Action:** After C28 (Yes pressed again after a lost reply), read `memberOf/{uid}`.
- **Expected:** HH-A appears once.
- **Don't assert:** —

#### TC-04-Z6: `memberOf` always agrees with `members`
**Priority** P1 · **Type** Data integrity · **Layer** TBD — QE · **Writes** No
**Role:** QE data check after every other block. **Tags:** —
- **Expected:** For every uid, `memberOf.householdIds` equals the set of households with a `members/{hh}_{uid}` document; no `memberOf` doc with an empty list.
- **Don't assert:** documents created outside this run.

## X. Exploratory charters

#### TC-04-X1: 20 minutes breaking the join flow on a phone
**Priority** P2 · **Type** Exploratory · **Layer** Manual · **Writes** Yes
**Role:** Homeowner without a household. **Tags:** Step 2
- **Charter:** Explore `/join#code` across email-and-password, create account, Google; links opened from Gmail and other in-app browsers, a second tab, airplane mode at each step, app switch during the Google popup, rotate the phone. Look for lost codes, double links, data shown before linking. Time-box 20 min; note every path tried.

#### TC-04-X2: 20 minutes trying to link to a lot you don't own
**Priority** P2 · **Type** Exploratory · **Layer** Manual · **Writes** Yes
**Role:** U-STRANGER with devtools. **Tags:** Step 1
- **Charter:** Tamper with fragments, replay `checkInvite` / `redeemInvite` responses, change ids in requests, use a removed owner's code, race "No" and "Yes", try lots of near-miss codes. Time-box 20 min.

#### TC-04-X3: 15 minutes looking for directory status drift
**Priority** P3 · **Type** Exploratory · **Layer** Manual · **Writes** Yes
**Role:** Admin office staff in two tabs plus a homeowner. **Tags:** Step 1 and 2
- **Charter:** Invite, resend, print, invite another person, withdraw, redeem, remove, change of owner, deactivate (refused and allowed) and reactivate in random orders; compare pills, 4E, filter chips, header counts and data after each. Time-box 15 min.

#### TC-04-X4: 15 minutes reading and typing codes from a printed slip
**Priority** P3 · **Type** Exploratory · **Layer** Manual · **Writes** Yes
**Role:** Homeowner with a printed slip. **Tags:** Step 1
- **Charter:** Print, cut, photograph and type codes on a phone; note look-alike characters still in the alphabet (5/S, 8/B, 2/Z) and whether errors help. Time-box 15 min.

---

## Cases that hinge on open decisions or open architecture

| Open item | Who decides | Cases |
|---|---|---|
| Decision 3 (approved for step 2: bounces), needs the provider's bounce events; provider not chosen (SA-001 Q7) | Owner (provider) | G12, G13, G14 (Blocked — provider) |
| Decision 4 (approved: refuse a second lot in R1; revisit with D3) | Owner, D3 later | J7, J8, J9, J10, C19, C20, D9 (already-linked part) |
| Decision 5 (open: privacy after a sale), and SA-001 R-16 (still open in Final SA-001) | Owner with the HOA's DPO, before the payments REQ | L1–L6 (Blocked — decision 5) |
| People per household limit | HOA board | J18 (Blocked — board) |
| How the office learns of sales; whether it uses Change of owner on every sale; the lost-slip procedure; splitting printing by block | Admin office | No case can prove a process. U-block proves the tool; K16 proves that nothing removes the old owner automatically; N9 proves the warning to a second printer |
| Whether the portal may keep no copy of the seller's name or contacts (C-2) | Admin office with the DPO | U5 (tagged provisional) |
| Whether showing the owner name on the confirm screen fits the privacy notice (G-28) | Owner with the DPO | C9, K14 (the approved behaviour is tested; a change would revise them) |
| Email provider and sending domain (SA-001 Q7) | Owner | Every Step 2 case (blocks G and H except G19, G23, G24; P2–P5, P9, P16; B5, B6, B9; J1–J3, J32; N1, N2, N4, N6, N8, N12–N15; W1, W3, W9) |
| **REQ-004 r5/r6 Sol Arch additions not yet in SA-001** (slot, `cancelReason`, `inviteExpiresAt`, mail `skipped`, `changeOwner`, `setInviteExpiry`, `config/features.emailInvites`, `members.name/email`, `memberOf`, removal listener, person-record read, 15-second limit, alert threshold, where the expiry settings live) | Sol Arch (SA-001 follow-up) | Tagged *Provisional — not yet in SA-001*: A1, A10, A11, D16, E11, E13, G17, G23, G25, J14, K19, K23, S6, S11, U2, U5, U20, V8, W6, Y2, Y9, Y13, Z1–Z6 (28) |
| New gaps NG-1 to NG-15 | BA | See Requirement gaps; each case names only the part that waits |

## v1.1 change log (for QE)

Source moved from REQ-004 **r3** to **r6** (r4 `memberOf`; r5 gap answers G-1 to G-33, owner decisions 6–9 approved as recommended with 9 = option c, Sol Arch C-1 to C-6; r6 person record, 15-second limit, "Linking…"). SA-001 r3 and ADR-001 to ADR-005 are Final.

**Layers.** Every new case carries `**Layer** TBD — QE` (145). **No changed case's layer was reset:** each change kept the behaviour at the same level (a Unit rule stayed a rule, an API refusal stayed a refusal). QE should still re-check the cases marked † below, whose expected result grew.

**Retired (2), ids kept, never reused:**
- **E15** "Only the treasurer can change invitation expiry": contradicted by decision 6 (admin office and treasurer). Replaced by V1, M18, V10.
- **J4** "Inviting the same address twice … makes one active invitation": contradicted by r5 slots (each "Invite another person" opens a new person slot). Replaced by J32 (and N14 for a double press).

**Changed: expected result now follows r5's answer (gap tag removed)** (62):
- G-1 expired is not unused: A3 · G-2/G-3/G-9 status order and counts: E6, S5†, S9, S10†, K7 · G-4 slots and printing: I1, I8, I9 · G-5 withdraw and "no longer valid": A5, A7, K4, J16 · G-6 data-level log: K6 · G-7 / decision 6 settings: E11, E12, E14† · G-8 "at the end of … (Philippine time)", year everywhere: E2, E5, E10, G3, I3, R3 · G-9 / G-10 removal: K7, K8 · G-11 removed person's code: K11† · G-12 linked households skipped: H7, I10 · G-13 bulk and print copy: H5, H6, H8, I14 · G-14 email status words: G8, H3 (title changed: v1's done message is replaced), H10 · G-15 queued resend: G17† · G-16 slot after an email edit: G18 · G-17 relations: J1, J6 · G-18 people list: C7, J3 · G-19 own household's other code: J12 · G-20 copy mismatches: G7, G9, H1, H12, K1, R2 · G-21 step 1: G19† · G-22 format check: C13, C14 · G-23 attempts: D6, D15 · G-24 precedence: G7 · G-26 open screen: K3 (now "next load" only; the open screen is K18) · G-28 / decision 7: K14 (now the Change-of-owner path, distinct from C15: QE finding 1) · G-29: K15 · G-30: C10, P8 · G-31: F11 · G-32: N3 · G-33: I12, N1 · r5 "only doesn't match counts": D9†.

**Changed for another r5/r6 reason** (14):
- Slots replace "household and recipient": A1, S6. Deactivation only when nobody is linked, with `cancelReason`: J14. REQ-001 r4 (one page "Enter your invite code"): P1, P12. REQ-006 copies staff names onto audit entries: B7 (narrowed, NG-11). Stale-screen copy undefined: N8 (NG-5 tag). Invite another person must not close on a backdrop click: J5 (NG-15 tag). Charter widened: X3. Narrower provisional tag: D16, E13. Retagged Step 2 (QE finding 4): G11. Retagged **Blocked — provider** (they need bounce events, like G12): G13, G14.

**Priority changes:** D15, G17, G19, I9, J12, P8 P3 → P2 (now runnable, with a defined expected result); K14 P2 → P1 (it now proves the seller's name never reaches the buyer).

**Tag-only (layers not reset)** (48 + 1): *Provisional — SA-001 Draft* dropped, because Final SA-001 / ADRs carry the detail: A4, A6, A9, B3, B4, B5, B6, B8, B9, B10, C6, C8, D3, D13, D14, F4, F6, F9, F10, G1, G5, G12, G15, G16, H4, J9, J17, M2–M13, M15, M17, N4, N5, P7, S2, S4, S7, S8. G12 also: "Blocked until the provider is chosen" → "Blocked — provider". Block notes: D and E now "seed times" (QE finding 6); L notes SA-001 R-16.

**New (145), Layer `TBD — QE`:**
- A10–A12 (cancel reason, slots) · C16–C28 (format, server format check, precedence, connection failures, retry after a lost reply) · D18 · G20–G25 (relation Owner, footer, Queued/Sent lines, step 1 server guard and print controls, `skipped`) · H13–H17 · I15, I16 · J19–J32 (decision 9 c deactivation, decision 8 second person by slip, relation required, two slots) · K18–K24 (open screen within a minute, empty and removed people, account name and email, Invitations list) · M18 · N9–N15 (second-printer notice, double presses, stale Resend) · P17 · Q14–Q16 · R7 · S11–S13.
- New blocks: **T1–T8** Withdraw · **U1–U24** Change of owner · **V1–V14** expiry settings · **W1–W9** status order and counts · **Y1–Y17** person record and 15-second limit (r6) · **Z1–Z6** `memberOf` (r4).

**QE findings for QA, answered:** (1) K14 now proves the Change-of-owner path, so it no longer duplicates C15. (2) Every gap tag is gone; the K-block P1s are runnable. (3) Accepted; no new UI case for the "which control" halves except T7, G24, J30 and P17, which are about new controls. (4) G11 retagged Step 2. (5) Whether Step 1 ships `/join` is NG-14. (6) Accepted; block notes now say "seed times". (7) Accepted. (8) TC-03 overlap: TC-03-H4 → J13, TC-03-H8 → J16, TC-03-H21 → J17 as before; **TC-03-H7, TC-03-H14, TC-03-H19 and TC-03-K30's "with members" half now conflict with decision 9 c (NG-1)**. (9) Done: 48 tags dropped, 28 cases carry a narrower provisional tag. (10) Accepted: TC-04 keeps K2 and M2; TC-02-D5 and TC-02-C13 can become cross-references.

**Cross-references (no second test):** TC-01-F20 ≡ Y2/Y3 (run once, report both). TC-16-J9 / J10 read the `memberOf` that Z3 / Z1 write; TC-16-J12 (no client writes) and J13 (back-fill) are not repeated here. TC-06-A8 to TC-06-A10 own the log sentences that K6, T4, U9, V11 only check at data level.

**Fixtures added:** HH-G, HH-LEGACY-INACTIVE; U-LIZA, U-ROSA, U-DORA, U-LEGACY, U-NOREC; U-ANA's account name is now "ZZ Ana R."; staff display names "ZZ Admin One", "ZZ Admin Two", "ZZ Treasurer"; HH-D is stated to have no one linked. `COVERAGE-MAP.md` is QE's to update.

## Coverage summary

"Blocked" = waits on an open decision or the provider. "NG" = cases where one named part waits on a new gap; the rest of the case is runnable.

| Block | Scope | Cases | P1 | New in v1.1 | Retired | Blocked | NG-tagged |
|---|---|---|---|---|---|---|---|
| A | Lifecycle transitions | 12 | 5 | 3 | 0 | 0 | 1 |
| B | Code generation, storage, secrecy | 11 | 6 | 0 | 0 | 0 | 1 |
| C | Code entry, confirm, redeem, check order, connection | 28 | 9 | 13 | 0 | 0 | 1 |
| D | Wrong-code limit | 18 | 7 | 1 | 0 | 0 | 0 |
| E | Expiry | 15 | 6 | 0 | 1 | 0 | 1 |
| F | Single use, redeem concurrency | 11 | 8 | 0 | 0 | 0 | 0 |
| G | Emailed invitations; step 1 controls | 25 | 10 | 6 | 0 | 3 | 0 |
| H | Bulk invite (Step 2) | 17 | 5 | 5 | 0 | 0 | 1 |
| I | Printed slips | 16 | 8 | 2 | 0 | 0 | 2 |
| J | Second person, already linked, deactivation, limits | 31 | 14 | 14 | 1 | 1 | 5 |
| K | Remove after a sale, people list | 24 | 14 | 7 | 0 | 0 | 5 |
| L | Privacy after a sale (decision 5) | 6 | 2 | 0 | 0 | 6 | 0 |
| M | Roles, rules, data leaks | 18 | 13 | 1 | 0 | 0 | 0 |
| N | Staff concurrency, stale screens, double presses | 15 | 5 | 7 | 0 | 0 | 3 |
| P | Navigation, deep links | 17 | 6 | 1 | 0 | 0 | 0 |
| Q | Usability, WCAG 2.2 AA, 375 px | 16 | 0 | 3 | 0 | 0 | 0 |
| R | Copy consistency | 7 | 0 | 1 | 0 | 0 | 0 |
| S | Back-compat, data integrity | 13 | 6 | 3 | 0 | 0 | 1 |
| T | Withdraw (new) | 8 | 4 | 8 | 0 | 0 | 2 |
| U | Change of owner (new) | 24 | 10 | 24 | 0 | 0 | 4 |
| V | Expiry settings (new) | 14 | 6 | 14 | 0 | 0 | 1 |
| W | Status order and counts (new) | 9 | 3 | 9 | 0 | 0 | 0 |
| Y | Person record, 15-second limit (new, r6) | 17 | 8 | 17 | 0 | 0 | 5 |
| Z | `memberOf` (new, r4) | 6 | 5 | 6 | 0 | 0 | 0 |
| X | Exploratory charters | 4 | 0 | 0 | 0 | 0 | 0 |
| **Total** | | **382** | **160** | **145** | **2** | **10** | **33** |

v1 had 239 cases (106 P1). v1.1: 239 − 2 retired + 145 new = **382 live cases** (384 ids), **160 P1** (107 kept or raised from v1, 53 new). Every Gherkin scenario in REQ-004 r6 maps to at least one case (Acceptance table), except the option-a scenario, which the REQ marks "don't build or test it". Every mandatory type is covered: negative (C, D, J19–J21, K11, U11, V3, Y1, M), boundary (D, E, V3–V6, H8, H13, H14, N10, U13, Y8–Y13), usability (Q, C18, R7), navigation (P, K18, U15, U22, V14).

## Requirement gaps for the BA

### G-1 to G-33 (raised in v1): all answered by REQ-004 r5

Every v1 gap is answered in REQ-004's **r5 change log**; no gap is left open. Cases updated are listed in the v1.1 change log.

| # | Gap (v1) | r5 answer (REQ-004 section) |
|---|---|---|
| G-1 | Expired as "unused" | No; expired households are re-invited, old code "replaced" (Invitation rules "Unused") |
| G-2 | Pill precedence | Linked → Email failed → Invited → Invite expired → Not invited (outline "Which status a household shows") |
| G-3 | How "Invite expired" appears; header counts | Worked out when read from `inviteExpiresAt`; five groups of active households; inactive only in its chip (Sol Arch Q1, Q2, C-3) |
| G-4 | Printing vs other invitations | Owner slot and person slots; printing replaces only the owner's (Invitation rules "Slots") |
| G-5 | `cancelInvite` | "Withdraw invitation"; every cancelled code reads "no longer valid" (Withdraw scenarios) |
| G-6 | Activity log screen | Backlog story 06 (REQ-006); data level until then |
| G-7 | Expiry settings | New invitations only; whole days 1–90; defaults 7 / 30; decision 6: admin office and treasurer |
| G-8 | Manila wording, year | "at the end of {date} (Philippine time)"; year always shown |
| G-9 | After the last member; removed people | "Not invited", empty-state line, removed people not listed |
| G-10 | "Already removed" copy | "{name} was already removed from {lot}. Nothing was changed." |
| G-11 | Removed owner re-entering her code | "Your access to {lot} was removed…"; check order step 7 |
| G-12 | Linked households in bulk | Skipped and counted as skipped |
| G-13 | Bulk copy at m = 0, n = 1, n = 0 | Outline "The bulk invite confirm…"; zero-count lines hidden |
| G-14 | Email status display | Queued / Sent / Email failed lines; never "delivered" |
| G-15 | Resend while queued | Old mail not handed over; status `skipped` (C-4) |
| G-16 | Contact email edited | Owner slot doesn't depend on the address |
| G-17 | Relations | Owner for the owner slot; Co-owner or Family, required, no default |
| G-18 | Names in the people list; replaced lines | Account name and email copied at link time (C-5); replaced and withdrawn not listed |
| G-19 | Member entering another code for her household | Dashboard with a notice; code not consumed |
| G-20 | Mock-up vs copy | "Resend invitation", no "Manage", 4F buttons adopted, "They will" |
| G-21 | Step 1 UI | Email controls not shown at all; decision 8 adds a second person by slip |
| G-22 | Empty or malformed codes | Page messages; not sent, not counted; server refuses too (C-6) |
| G-23 | Reset on link; locked refusals | Reset to 0; locked codes don't extend the window |
| G-24 | Message precedence | Eleven-step check order |
| G-25 | Network or server error | Offline and two server-error lines; retry lands on the dashboard |
| G-26 | Removed member's open screen | Within a minute while online |
| G-27 | Members of a deactivated household | Decision 9, option (c): deactivation refused while anyone is linked |
| G-28 | New owner sees the seller's name | Change of owner sets the new name first (decision 7) |
| G-29 | Seller's family stays linked | Change of owner removes everyone (decision 7) |
| G-30 | After "No, this isn't my lot" | Code cleared; back on code entry with the wrong-lot line |
| G-31 | Used code re-entered after expiry | Dashboard (step 4) |
| G-32 | Two staff printing | Second printer told whose slips stopped working |
| G-33 | In-flight states | Every make-or-stop button disabled with its in-flight word, acts once |

### New gaps found in REQ-004 r6 (v1.1)

Cases citing these assert only what holds under every reading.

| # | Gap | Where it bites |
|---|---|---|
| NG-1 | **REQ-003 is not yet changed for decision 9 (c).** REQ-004 says (c) "needs a matching change to REQ-003's deactivate". REQ-003 r4 still has the Deactivate confirm with no refusal, and its Reactivate confirm's "… and its {n} linked members get full access back" variant can no longer happen. TC-03-H7, TC-03-H14, TC-03-H19 and TC-03-K30 assume a linked household can be deactivated. Also: does the refusal appear on pressing "Deactivate" (instead of the confirm) or after confirming? | J19, J20; TC-03-H7, TC-03-H14, TC-03-H19, TC-03-K30 |
| NG-2 | **Where the membership's name comes from.** Sol Arch C-5: copied "from the signed-in account (Auth token)". For email-and-password accounts the name lives in `users/{uid}.name` (REQ-001) and the token may carry none, while r6 already reads `users/{uid}` in the same transaction. Which source, and what shows if it is empty? | C7, J3, K1, K8, K22, K23, U1 |
| NG-3 | **Where the r6 person-record check sits in the eleven-step check order.** If it comes after the lookup but before counting, an account with no record could ask `redeemInvite` about codes without ever being counted. Which message wins when the account is also locked, or the code also expired? | Y7; status Table 1 |
| NG-4 | **A late answer after the 15-second give-up.** Does the page ignore it or show its result? The outline says "the wrong-code count does not change": true only if the server never processed the call. If a stalled non-matching code reaches the server late, it counts. Please say "the time-out itself adds no count" | Y10, Y11, Y15, Y16 |
| NG-5 | **No copy for stale-screen refusals** of Invite, Resend invitation, Send invitation and Withdraw (Sol Arch Q9: "refuse or return already done"), including Withdraw on an invitation used a moment earlier | N1, N8, N15, T8 |
| NG-6 | **Print confirm copy gaps:** the title when every selected household is linked ("Print 0 slips?"?), and the singular forms of "{j} of these households have…" and "{k} households are skipped…" | I15 |
| NG-7 | **"The slips weren't made"** is shown when printing fails, but if the server made the codes and only the reply was lost, the earlier owner codes are already dead and no PDF exists. The copy promises nothing changed | I16 |
| NG-8 | **Change of owner with no one linked:** what the "loses access at once: {names}" line says with no names; and whether Change of owner is offered on an inactive household (REQ-003 inactive rows offer only Reactivate) | U23; status Table 1 |
| NG-9 | **Expired invitation lines on the detail page:** "Actions on an unused line" offers Resend, Print slip, Withdraw, but "unused" excludes expired. What does an expired line offer, and may it be withdrawn? | A7; status Table 1 |
| NG-10 | **Two uses of "Invite another person" for the same person** leave two working codes (one could be lost or misused). Should the form warn when the email matches an unused person-slot invitation? | J32 (replaces J4) |
| NG-11 | **Audit "ids only" vs REQ-006.** REQ-004 says ids only (and "no names" for Change of owner); REQ-006 copies staff `actorName` and `actorRole` onto entries. REQ-006 also has no action code or sentence for a withdrawal (`cancelReason` withdrawn), a change of owner or the expiry-settings change | B7, S12, T4, U9, V11 |
| NG-12 | **Empty "People with portal access"** says "Invite the owner or print a slip." In step 1 there is no "Invite". Step-1 wording? | K20 |
| NG-13 | **Bulk confirm "Expire on {date}" line:** mock-up 4F shows it; r5's copy of record doesn't list it. Kept or dropped? | E10, H1 |
| NG-14 | **Does step 1 ship the `/join` route?** Only the email link uses it (QE finding 5). Decides smoke item 2 | Smoke item 2 |
| NG-15 | **Escape on the new forms** (Invite another person, Change of owner, Settings → Invitations). REQ-004 says only "don't close on a backdrop click"; REQ-003's household form asks "Discard your changes…?" on Escape. Same here? | J5, U14 |

---

## QE triage

*QE-owned. Written at triage, 2026-11-28, against TC-04 v1 (owner-approved, merged as `e0cb23d`). Refreshed the same day, before merging, for SA-001 r3 (now Final) and TC-03 (now on `main`). QA owns everything above this line. QE changed only each case's **Layer** field and added the layer legend.*

### Shape

| Layer | Cases | Of the 232 automated | Blocked | Deferred to Step 2 | Notes |
|---|---|---|---|---|---|
| Unit | 40 | 17% | 11 | 3 | All in `shared/domain/`, `web/src/features/invites/` and `functions/src/mail/` (Dev) |
| API | 121 | 52% | 30 | 26 | 120 on the emulator, 1 on staging (G15) |
| UI | 70 | 30% | 11 | 15 | 3 in the `mobile` project (Q6, Q7, Q13); 1 `exclusive` (S10) |
| Journey | 1 | <1% | 0 | 0 | C7: print → code → link → staff see Linked |
| Manual | 7 | — | 0 | 1 | 1 on staging (D16), 1 physical print (I13), 1 real phone keyboard (Q8), 4 charters (X1–X4) |
| **Total** | **239** | | **52** | **45** | **142** runnable once the app exists; 68 of all cases are tagged provisional, still to be re-checked against SA-001 r3 (Final) |

**API carries half the plan, and that is the right shape for REQ-004.** The feature is server logic: five callable functions, a transaction per redeem, function-only collections (`invites`, `inviteAttempts`, `mail`, `members`) and the rules that decide who sees which household. Only a few things need a browser: the join screens, the directory pills, the slip PDF and deep links. Against the 70 / 20 / 10 target, Unit is low because the wrong-code window, the expiry dates and the pill derivation are the only real calculations. Taken together, TC-01 and TC-04 come to Unit 61, API 165, UI 164, Journey 1. That is still too much UI, but it's moving the right way.

### Status rules applied

- **Gap G-n (44 cases):** each keeps its layer but is **not automatable** until the BA answers the gap. REQ-004 r4 is answering them in a sibling session. QE did not read or edit `docs/requirements/`.
- **Blocked on a decision (8):** L1–L6 (decision 5, and L1, L3, L5 also need the payments REQ), J18 (the board's people-per-household limit), G12 (the bounce event needs the email provider; decision 3). They stay blocked.
- **Step 2 (45, plus 10 of the blocked above):** deferred until an email provider is chosen (the owner picks it; ADR-002, now Final, leaves it open). QE also deferred **G11**: it's tagged "Step 1 and 2" but starts from an "Email failed" household (finding 4). The 9 "Step 1 and 2" cases that remain (E5, E7, E10, M1, P6, P7, Q7, R6, X3) run their Step 1 half now and add the email half later.
- **Provisional — SA-001 Draft (68):** QA wrote these against the Draft. SA-001 r3 and ADR-001 to ADR-005 were approved (Final) on 2026-11-28, after this triage was first written. A spot check of r3 shows that the details the layers rest on are unchanged:
  - the five callable functions (`createInvites`, `checkInvite`, `redeemInvite`, `removeMember`, `cancelInvite`);
  - `inviteAttempts/{uid}`, 5 refused codes per 15 minutes per account;
  - codes stored as a keyed hash;
  - expiry per channel, ending at the end of the day in Asia/Manila;
  - `shared/domain/` for logic shared by the web app and functions.

  So the layers stand. Each case stays flagged *provisional* in the coverage map until QA re-checks its expected result against r3 (finding 9), and QE re-checks it again before writing its test. r3 still leaves the lot key (§4.2) and sale privacy (R-16) open; L1–L6 are blocked anyway.
- **13 blocked cases are P1:** E6, G8, G12, K1, K3, K4, K6, K7, K8, K11, L1, L3, S5. Six of them sit in block K (remove after a sale). See finding 2: most of what they assert doesn't depend on the gap.

### Where each case went, and why

- **Unit (40).** Rules about inputs with no server in the way:
  - code generation, format and normalising (B1, B2, C2–C4, C14);
  - the wrong-code window: 5th vs 6th, 14:59 vs 15:00, fixed from the first refusal, which refusals count (D1, D2, D4–D10, D14, D15);
  - expiry dates in Manila: midnight, year end, leap day, defaults when the setting is absent, setting limits (E3–E5, E7, E8, E13, E14);
  - pill derivation and the actions each state offers: "expired" is derived, never stored (A2, E6, R4, S9);
  - the seven join errors' copy (R1);
  - the email subject and body templates (G2, G3);
  - the slip's text and footer (I3, I5);
  - the relation choices (J6);
  - in-flight guards on "Yes, link my account", "Invite selected", the print confirm and Remove (F5, H2, I12, K9);
  - the empty-code check that sends no request (C13).
- **API (121).** Everything the functions or rules decide:
  - lifecycle transitions and refusals (A, G, I, J, K);
  - secrecy: no plain code stored, keyed hash, mail body cleared, audit ids only, clean logs (B3–B8, B11, C8);
  - redeem and its races: 10 parallel redeems give one membership, with the 10-code negative control (F6–F10);
  - the per-account lock as the functions apply it (D3, D11–D13);
  - the whole rules matrix (M), staff races (N), the data-integrity sweeps (A9, S4–S8);
  - privacy after a sale (L, blocked).

  Cases QA wrote as two-session browser flows (F7, F8, J15, N1, N2, N6) are API: the server is what keeps them safe, and two tokens calling in parallel prove it. No two-browser UI spec is planned, because the only button guards are Unit (F5, K9).
- **UI (70).** What only the browser shows or does:
  - the join screens and their errors (one wiring case each: C12 for "doesn't match", F3 for "already yours" → dashboard);
  - deep links through each sign-in method and `sessionStorage` (P);
  - focus, labels, paste, tap targets, 375 px (Q);
  - pills in every place (R3, S1);
  - the PDF the browser builds: **I4 and I6 stay UI on purpose.** A slip that leaks a phone number, or prints a code beside the wrong lot (R-6), can only be caught in the downloaded PDF, so the real file is the proof;
  - **B10 stays UI** because only the browser flow can show that nothing uploads the PDF;
  - **E9** needs a real browser clock.
- **Journey (1).** C7 is the one cross-layer path for invite and link (Step 1). It replaces a separate UI check of "staff see Linked · 1 person".
- **Manual (7), with reasons:**
  - **D16 (staging):** the wrong-code alert is Cloud Monitoring on staging; the emulator has none;
  - **I13:** a physical print, cut and read at arm's length;
  - **Q8:** a real on-screen keyboard (as TC-01-O3);
  - **X1–X4:** exploratory charters (X1 waits for Step 2).

### Unit scenarios for Dev

Dev writes these with the feature; QE reviews them against this list. Paths follow SA-001 r3 §9 (`shared/domain/` is shared by web and functions).

| Module (anticipated) | Cases | Seam it needs |
|---|---|---|
| `shared/domain/inviteCode.js` | B1, B2, C2, C3, C4, C14 | `generateCode(rng)` over `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`; `normaliseCode(input)` (case, spaces, hyphens); `isWellFormed(code)`. One normaliser used by the code field **and** by `checkInvite` / `redeemInvite`. C14 waits on G-22 |
| `shared/domain/inviteAttempts.js` | D1, D2, D4–D10, D14, D15 | `applyAttempt(record, outcome, now)` → `{ allowed, record }`; `countsTowardLimit(reason)`. Fixed 15-minute window from the first refusal. D6, D15 wait on G-23 |
| `shared/domain/inviteExpiry.js` (on `dates.js`) | E3, E4, E5, E7, E8, E13, E14 | `expiresAtFor(createdAt, channel, settings)` = end of day, Asia/Manila; `isExpired(expiresAt, now)`; `resolveExpiryDays(settings)` (absent ≠ 0); `validateExpirySettings()` (E14 waits on G-7) |
| `shared/domain/linkStatus.js` | A2, E6, R4, S9 | `pillFor(household, invites, now)` (Not invited for a missing field, never "Linked · 0 people"); `inviteActions(state)` → which of Invite / Resend invitation / Print slip is offered; "1 person" / "n people". E6 waits on G-3, S9 on G-9 |
| `shared/domain/relations.js` | J6 | The relation list (waits on G-17) |
| `web/src/features/invites/invite-messages.js` | R1 | `inviteErrorMessage(reason, { lot })` for the seven reasons of record |
| `web/src/features/invites/join-controller.js` | C13, F5 | Submit and confirm handlers with an **injected invites port**: no call on an empty code; one redeem when "Yes" is pressed twice in flight. C13 waits on G-22 |
| `web/src/features/invites/staff-actions.js` | H2, I12, K9 | The same in-flight guard for Invite selected, the print confirm and Remove. I12 waits on G-33 |
| `web/src/features/invites/bulk-summary.js` | H8 | The bulk confirm copy at m = 0, n = 1, n = 0 (waits on G-13) |
| `web/src/features/invites/slip-pdf.js` | I3, I5 | `buildSlipPdf({ hoaName, portalUrl, slips })` → bytes, with no DOM, so Vitest can extract the text |
| `functions/src/mail/invite-email.js` | G2, G3 | `inviteEmail({ brand, ownerName, lot, expiresAt, code, portalUrl })` → subject and body. G3 waits on G-8 / G-20 |

### Locator contract (asked of Dev)

TC-01's contract still applies: `screen-<view>`, `app-version`, `form-error`, `screen-not-linked`, `screen-invite-code`, `screen-confirm-lot`, `invite-code`, `screen-no-access`. TC-04 adds:

| Screen | Element | Hook |
|---|---|---|
| Not linked (1G) | "Enter invite code" menu item | `data-action="go-invite-code"` |
| Code entry (4B) | Hint, submit, field error | `data-testid="invite-code-hint"`, `data-action="check-invite"`, `data-testid="error-invite-code"` |
| Confirm (4C) | Lot, owner on file | `data-testid="confirm-lot"`, `data-testid="confirm-owner"` |
| | Yes, link my account / No, this isn't my lot | `data-action="confirm-link"`, `data-action="reject-lot"` |
| | Wrong-lot message | `data-testid="wrong-lot-message"` |
| Directory (3A, 3B) | Row / phone card | `data-testid="household-row"` / `data-testid="household-card"`, each with `data-household-id` |
| | Link-status pill (every place it appears) | `data-testid="link-pill"` with `data-link-status="not-invited \| invited \| linked \| expired \| email-failed"` |
| | Row actions | `data-action="invite"`, `resend-invite`, `print-slip`, `open-household` |
| | Select, bulk actions | `data-action="select-household"`, `data-action="invite-selected"`, `data-action="print-invite-slips"` |
| | Filter chips, header counts | `data-testid="filter-<status>"`, `data-testid="directory-counts"` |
| Bulk confirm (4F) | Dialog, summary, expiry, confirm, print instead | `data-testid="bulk-invite-dialog"`, `bulk-invite-summary`, `bulk-expiry`; `data-action="confirm-bulk-invite"`, `data-action="bulk-print-instead"` |
| Print confirm | Dialog, confirm | `data-testid="print-confirm-dialog"`, `data-action="confirm-print"` |
| Household detail (4E) | Screen, people, invitations | `data-testid="screen-household-detail"`, `people-list`, `person-row` (with `data-uid`), `invitations-list`, `invitation-row` |
| | Remove, Invite another person | `data-action="remove-member"`, `data-action="invite-another"` |
| Invite another person | Dialog, email, relation, send | `data-testid="invite-another-dialog"`, `invite-email`, `invite-relation`; `data-action="send-invite"` |
| Remove confirm | Dialog, confirm | `data-testid="remove-dialog"`, `data-action="confirm-remove"` |
| Every dialog | Cancel | `data-action="cancel"` |
| Every screen | Toast / result message | `data-testid="toast"` |
| Routes | `/join`, household detail | Stable paths, named by Dev (P11, P12, P16) |

### Spec files

**New (planned, none written yet).** API specs in `tests/specs/api/`, the staging spec in `tests/specs/staging/`, UI specs in `tests/specs/ui/`. This is the same layout question TC-01 raised with Sol Arch.

| File | Layer | Cases |
|---|---|---|
| `api/invites-create.spec.js` | API | A1, A3, A4, E11, E12, G1, G5, G7, G10, G11, G16, H4, H5, H7, H11, I7–I10, J1, J4, J17 |
| `api/invites-cancel.spec.js` | API | A5, A6, A7 |
| `api/invites-secrecy.spec.js` | API | B3, B4, B11, C8 |
| `api/invites-redeem.spec.js` | API | A8, C6, C15, E16, F1, F2, F4, F11, G6, J7–J13, J15, J16, K14, N6, S2, S3 |
| `api/invites-attempts.spec.js` | API | D3, D11, D12, D13 |
| `api/invites-redeem-race.spec.js` | API | F6–F10 (F10 is the negative control for F9) |
| `api/mail-queue.spec.js` | API | B5, B6, G9, G12, G13, G14, G17, G18 |
| `api/invites-audit-logs.spec.js` | API | B7, B8, K6, S8 |
| `api/members-remove.spec.js` | API | K2, K4, K5, K7, K8, K11–K13, K15–K17 |
| `api/rules-invites.spec.js` | API | E15, M1–M17 |
| `api/invites-staff-race.spec.js` | API | N1–N5, N8 |
| `api/invites-integrity.spec.js` | API | A9, J2, J14, J18, S4–S7 (runs last; reads what the run created) |
| `api/privacy-after-sale.spec.js` | API | L1, L2, L3, L5, L6 (blocked) |
| `staging/mail-allow-list.staging.spec.js` | API (staging) | G15 |
| `ui/join-code-entry.spec.js` | UI | C1, C5, C9–C12, D17, E9, F3, P1, Q1–Q5, Q12, R5 |
| `ui/join-deep-link.spec.js` | UI | B9, P2–P10, P15, P16 |
| `ui/join-access.spec.js` | UI | K3, P11, P12 |
| `ui/invite-directory.spec.js` | UI | E1, E2, E10, G4, G8, G19, J3, N7, P13, Q9, R2, R3, R6, S1 |
| `ui/invite-directory-counts.exclusive.spec.js` | UI | S10 (`exclusive`: asserts directory-wide counts) |
| `ui/bulk-invite.spec.js` | UI | H1, H3, H6, H9, H10, H12, Q11 |
| `ui/print-slips.spec.js` | UI | B10, I1, I2, I4, I6, I11, I14 |
| `ui/household-detail.spec.js` | UI | J5, K1, K10, P14, Q10 |
| `ui/join-phone.spec.js` | UI (`mobile`) | Q6, Q7, Q13 |
| `ui/privacy-after-sale.spec.js` | UI | L4 (blocked) |
| `ui/invite-link.journey.spec.js` | Journey | C7 |

**Smoke.** TC-03 is now on `main`. Its smoke scope already loads the Homeowners directory for admin **and** treasurer (heading, Import / Add household, search, filter chips, empty state), the import page and the Add household dialog. So TC-04 adds only what TC-03's smoke doesn't check:

1. **P1** gets the `@smoke` tag: the no-household account lands on not-linked and opens "Enter your invite code".
2. **`SMK-join-link`** (new, read-only): `/join#{fixture code}` opens the confirm screen, and the test never presses Yes. It's deferred with P2 until the `/join` link ships (Step 2), unless Dev ships `/join` in Step 1 (finding 5).
3. **`SMK-admin-household-detail`** and **`SMK-treasurer-household-detail`** (new): 4E opens and shows "People with portal access" and "Invitations".
4. **`SMK-admin-homeowners-portal`** (new, trimmed): on the directory TC-03's smoke item has already loaded, a link-status pill on every row, plus the "Invite selected" and "Print invite slips" actions. It doesn't re-check the heading, search or chips. When QE triages TC-03, the two smoke items share one page load.

**Changed (when the real app exists):**

- `smoke.spec.js`: the new SMK rows above.
- `navigation.spec.js`: NAV-03 / NAV-06 re-run on the new screens (P13, Q10 depend on them).
- Support:
  - fixtures HH-A … HH-F, HH-LEGACY and 400 bulk households, seeded per run on the emulator;
  - the accounts in TC-04's fixture table as signed-in fixtures;
  - an emulator helper for Admin SDK reads and seeds of `invites`, `inviteAttempts`, `mail`, `members` and `auditLog`;
  - stub mail provider controls (accept / refuse / pause / inject bounce);
  - `.env.example` gains every fixture account's email and password variable (names only).

### Automation order (highest consequence first)

1. **Harness:**
   - environment guard per project;
   - emulator seed with the **test HMAC key** (never the production secret);
   - Admin SDK helpers;
   - stub mail provider controls;
   - fixtures and signed-in accounts.
2. **Household isolation (R-6):** M7–M15, K2, K13, M14, M16, then the refusals M2–M6, M17.
3. **Redeem is single-use and goes to the right person:** C6, F1, F2, F4, F6, F8, F9, F10, M6, J7–J10, J13, J15, E16, N6.
4. **Secrecy and the lock:** B3, B4, B11, C8, D3, D11, D12, D13, B7, B8.
5. **Remove after a sale:** K5, K12, K13, K15, K16, K17. Then **K11, K4, K7, K8** as soon as G-11, G-5, G-9, G-10 are answered. Ask the BA for G-11 first: it is the top risk in TC-04's hand-over.
6. **Unit domain (Dev, with the feature):** code, attempts, expiry, link status, messages, slip, guards.
7. **Step 1 UI and the Journey:** C7, I1, I2, I4, I6, I11, I14, E2, B10, C1, C5, C9–C12, F3, P1, smoke.
8. **Integrity sweep:** A6–A9, S2–S4, S6–S8, J14, I7.
9. **Navigation and usability:** P10–P15, block Q, R3, R5, S1, N7, K10, P14.
10. **Step 2, once the provider is chosen:**
    - mail queue: B5, B6, B9, G1, G4–G16;
    - bulk: block H;
    - second person: J1–J5;
    - staff races: N1, N2, N4, N8;
    - deep links: P2–P5, P9, P16;
    - E1, A1, A2, A4.
11. **Manual:** I13, Q8, X2–X4; D16 on staging; X1 after Step 2.

### Implementation status

2026-11-28: **nothing automated.** The real app doesn't exist yet (`main` holds only the mock-ups). SA-001 r3 was approved on 2026-11-28, so the design is settled, but no app code or test has been written. Every row is **Planned**, **Deferred: Step 2**, or **Blocked** on the gap or decision it names. No spec, fixture or config was written at triage.

### Findings for QA

These are QE's reading of the cases, for QA to accept or reject. QE did not change the cases.

1. **K14 proves the same thing as C15**: `checkInvite` returns the owner name on file at the time of the check. Both are API. QE will run them as one test that reports both ids. Only "what if the office forgets the edit" is G-28, and K14 doesn't assert that.
2. **Several Gap-tagged cases assert nothing that depends on the gap.** The gap appears only in *Don't assert*:
   - K1 (pronoun);
   - K3 (how fast the screen changes);
   - K4 (which message);
   - K7 (the last-member pill);
   - K11 (which message: the refusal itself is the security point);
   - H12 (button label);
   - R2 ("Resend" / "Manage" only);
   - E6 (job or read-time).

   By rule they stay blocked. If QA narrows each tag to the gated assertion, about 8 cases, 6 of them P1, can be automated now. K11 matters most.
3. **Cases with two halves at two layers.** QE kept each at the lower layer and relies on the case named for the other half:
   - A4, G9, G16 and J17's "which control is offered" → A2's `inviteActions` unit;
   - B11's "no screen shows the code" follows from no readable field holding it;
   - J11's view switch → TC-01's `resolveLanding` unit;
   - M16's menu and URL half → TC-02's no-access cases.

   If QA wants a browser check of any of these, add a UI case.
4. **G11 is tagged "Step 1 and 2" but starts from "Email failed",** so it can't run before Step 2. QE deferred it. QA may retag it Step 2.
5. **Smoke item 2 (`/join#code`) assumes the `/join` route exists in Step 1.** Only the email link uses it. Confirm with the BA or Dev whether Step 1 ships `/join`; if not, the smoke item waits for Step 2 with P2.
6. **"Controllable server clock" staging notes (A8, the D and E blocks)** don't need a staging clock. Unit proves the boundaries, and API seeds `expiresAt` or the attempt record to a time already past. Only D16 needs staging, and it is Manual there.
7. **F7, F8, J15, N1, N2 and N6 carry "two sessions" notes.** QE proves them with two tokens at API, not two browsers.
8. **TC-03 overlaps to settle at TC-03's triage** (TC-03 is on `main` but not yet triaged): TC-03's link-status pills and deactivate-cancels-invite cases against TC-04's R3, S1, Q9, Q13 and J14. One layer each, and no second row.

9. **Re-check the 68 *provisional* cases against SA-001 r3 (Final).** The spot check found no change that moves a layer. QA owns the tag and the expected results, so QA should confirm each one and drop the tag, or rewrite the case where r3 differs.
10. **Two TC-04 cases overlap TC-02 rows that have since merged**, both at API:
    - **K2** (a removed member's next household read is refused at once) overlaps **TC-02-D5**. TC-02's own finding 7 already proposes that TC-04 owns it. It also answers TC-01's triage finding 3.
    - **M2** (`createInvites` refused for board, guard, homeowner, no-role and signed-out callers) overlaps **TC-02-C13**, and M2 is the wider case.

    QE proposes that TC-04 keeps both tests and that the TC-02 rows become cross-references once QA agrees. QE didn't edit TC-02.

### For Sol Arch (and Dev)

- **`shared/domain/` placement is what keeps 29 cases at Unit.** The code normaliser, the attempt window, the expiry dates and the pill derivation need to be plain modules that both the web app and the functions import. If they live inside function handlers, those cases move up to API. That would be a design finding, not a test choice.
- **The slip PDF builder must run in Node** (no DOM) for I3 and I5. SA-001 r3 §9 has functions make *official* PDFs. A slip isn't one: REQ-004 and B10 have the browser build it and store nothing. Please confirm that in SA-001, and name a PDF library that runs in Node.
- **Functions read time through an injectable `now()`.** QE doesn't need an emulator clock override if API cases can seed times.
- **Emulator mail stub:** it must accept, refuse, pause and inject a bounce, controlled only when `FUNCTIONS_EMULATOR` is set, so no staging or production path can reach it. The bounce event shape waits on the provider (G12).
- **The emulator HMAC key** is a separate test secret (B4). SA-001 r3 should say where it lives, so it can never be the production key.
- **Function logs (B8):** QE reads them from the emulator's log output. Please confirm functions don't log request payloads by default (CS-14).
- **Staging:** the mail allow-list (G15) and the staging host for the guard (ADR-005), plus the test-folder layout. SA-001 r3 still names `tests/rules/` and `tests/e2e/`, while TC-01, TC-02 and TC-04 plan `tests/specs/api/`, `tests/specs/staging/` and `tests/specs/ui/`. These are the same open items TC-01 raised.
