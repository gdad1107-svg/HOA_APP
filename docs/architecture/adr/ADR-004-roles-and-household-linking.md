# ADR-004 — Staff roles as custom claims; household membership as documents

**Status:** Proposed (Draft, with SA-001). **Date:** 2026-11-27.

**Context.** Roles: homeowner, admin, treasurer, board, guard. The client has not decided on multiple lots per owner or tenants (backend-plan open decision). Custom claims are limited to 1,000 bytes and apply only when the ID token refreshes (firebase.google.com/docs/auth/admin/custom-claims, fetched 2026-11-27). Shared family emails and phones are common.

**Options.**
1. Staff role in a custom claim set by a function; household membership in `members/{householdId}_{uid}` documents created by redeeming a single-use invite.
2. Everything in custom claims (role + household ids). Rejected: multi-lot lists grow, every change needs a token refresh.
3. Everything in role documents read by rules. Rejected: an extra read on every rule evaluation for the most common check.
4. Link households by matching email or phone. Rejected: not unique; leaks one family's finances to another.

**Decision (proposed).** Option 1. `setRole` revokes refresh tokens so removals bite promptly.

**Consequences.** Rules use `request.auth.token.role` and `exists(members/...)`; onboarding needs invite codes for 623+ households (SA-001 R-8).
