# ADR-004 — Staff roles as custom claims; household membership as documents

**Status:** Proposed (Draft, with SA-001). **Date:** 2026-11-27.

**Context.** Roles: homeowner, admin, treasurer, board, guard. The client has not decided on multiple lots per owner or tenants (backend-plan open decision). Custom claims are limited to 1,000 bytes and apply only when the ID token refreshes (firebase.google.com/docs/auth/admin/custom-claims, fetched 2026-11-27). Shared family emails and phones are common.

**Options.**
1. Staff role in a custom claim set by a function; household membership in `members/{householdId}_{uid}` documents created by redeeming a single-use invite.
2. Everything in custom claims (role + household ids). Rejected: multi-lot lists grow, every change needs a token refresh.
3. Everything in role documents read by rules. Rejected: an extra read on every rule evaluation for the most common check.
4. Link households by matching email or phone. Rejected: not unique; leaks one family's finances to another.

**Decision (proposed, revised r2 2026-11-28 after the REQ-002 review).** Option 1, with one addition: staff rules check both the `role` claim **and** a server-written `staff/{uid}` document. The r1 line "`setRole` revokes refresh tokens so removals bite promptly" was wrong for rules. Revoking refresh tokens does not stop Firestore rules accepting the ID token the person already holds, which stays valid for up to an hour. With the document check, a removal is refused on the next request, at the cost of about one extra read per staff request. `setRole` writes `staff/{uid}`, and it revokes refresh tokens only on a removal or downgrade, never on a grant. It refuses to remove the last treasurer, counting treasurers in a transaction over `staff`. The owner is choosing between "at once" (this design, recommended) and "within 1 hour" (claim only). Household linking uses `redeemInvite`. See L-004.

**Consequences.** Rules use `request.auth.token.role` plus `get(staff/{uid})` for staff, and `exists(members/...)` for households, so a homeowner's removal takes effect at once. Rules tests cover every R1 collection against a removed role with a stale token. onboarding needs invite codes for 623+ households (SA-001 R-8).
