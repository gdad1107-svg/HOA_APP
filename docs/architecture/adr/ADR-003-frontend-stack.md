# ADR-003 — Frontend: Vite + plain ES modules + lit-html

**Status:** Accepted (Final) — approved by the owner, 2026-11-28: "APPROVED — FINAL: SA-001 r3 and ADR-001 to ADR-005". Previously Proposed (Draft, with SA-001). **Date:** 2026-11-27.

**Context.** The agreed UX is a 1,500-line single-file mock-up built from string templates and lookup tables of action handlers (`ACT` line 1333, `FORMS` line 1416). The SonarQube gate needs unit-testable modules, ≥ 80% coverage and per-function complexity ≤ 15; the free edition does not detect XSS.

**Options.**
1. Vite + plain JS ES modules + `lit-html` (auto-escaping templates) + Firebase SDK from npm. Closest to the mock-up; small; escaping by default.
2. React or Vue. Rejected for now: every screen rewritten, larger dependency surface, no need at this size.
3. Keep a single HTML file and add Firebase. Rejected: untestable (no coverage), god-file, CDN dependencies, fails the gate.

**Decision (accepted 2026-11-28).** Option 1, structured per SA-001 §9.

**Consequences.** Mock-up CSS and markup reused; data layer rewritten; a PWA manifest for the guard device.
