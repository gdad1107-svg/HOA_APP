# ADR-001 — Firebase as the platform, region asia-southeast1

**Status:** Accepted (Final) — approved by the owner, 2026-11-28: "APPROVED — FINAL: SA-001 r3 and ADR-001 to ADR-005". Previously Proposed (Draft, with SA-001). **Date:** 2026-11-27.

**Context.** The owner mandated Firebase Hosting, Firebase Authentication and Firestore. The app needs atomic money operations, scheduled jobs, images and email (SA-001 §3, §6). Firestore's location cannot be changed after creation.

**Options.**
1. Firebase Hosting + Auth + Firestore + Cloud Functions + Cloud Storage + Cloud Scheduler on the Blaze plan, region `asia-southeast1` (Singapore). 
2. Same, with Storage in a US region to use the no-cost Storage allowance (pricing page, fetched 2026-11-27: free Storage quota applies only to us-central1, us-west1, us-east1).
3. Firebase for Hosting/Auth/Firestore only, no Functions (rules-only). Rejected: cannot make gap-free receipt numbers, billing runs, email or tamper-proof gate logs safe.

**Decision (accepted 2026-11-28).** Option 1. Option 2 is a cost-vs-locality trade the owner and client DPO may choose instead; storage volume is small either way.

**Consequences.** Blaze plan and a budget alert from day one; region fixed for good; lock-in to Firestore accepted (mitigated by scheduled backups/exports and plain-module domain logic).
