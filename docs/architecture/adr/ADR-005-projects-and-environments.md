# ADR-005 — One Firebase project per environment and per client, named by role

**Status:** Accepted (Final) — approved by the owner, 2026-11-28: "APPROVED — FINAL: SA-001 r3 and ADR-001 to ADR-005". Previously Proposed (Draft, with SA-001). **Date:** 2026-11-27.

**Context.** The mock-up exists in a generic and a Gentri Heights-branded copy that differ only in branding (SA-001 §4.1). Whether the product serves one HOA or many is open (SA-001 Q6). Firebase project ids are permanent. See L-003.

**Options.**
1. `hoa-portal-staging` shared for test/UAT; one `hoa-<client>-prod` project per HOA; branding from a config document; same build everywhere.
2. One multi-tenant production project with a `tenantId` on every document. Rejected for now: every rule and query carries tenant checks; one mistake leaks across HOAs; one DPA boundary for all clients.
3. Separate codebase per HOA. Rejected: forks drift.

**Decision (accepted 2026-11-28).** Option 1.

**Consequences.** Production deploys loop over client projects with per-project approval; staging email allow-list; rules/functions deployed before hosting in every project.
