# Coding standards — HOA portal

Owner: Sol Arch. Status: **Draft** (adopted with SA-001). Stack: Vite + plain JS ES
modules + `lit-html` (web), Node.js Cloud Functions (2nd gen), Firestore, Cloud
Storage, Firebase Auth. Cite rules by number in reviews ("CS-5").

## Rules

1. **Small modules, one job each.** One feature per folder (`web/src/features/<area>/`,
   `functions/src/<area>/`). No file over ~400 lines, no god-files. Business logic lives in
   `shared/domain/` as pure functions so it can be unit-tested without a browser or emulator.
2. **Automated style.** ESLint + Prettier, configs in the repo, enforced in CI. Lint enables
   `prefer-number-properties` (S7773) and `require-array-sort-compare`-style checks.
3. **Validate at every trust boundary.** Rules validate every client write (owner, fields,
   starting status). Every callable re-validates its input and checks the caller's role
   server-side. Hiding a button is never authorization.
4. **Errors are never swallowed.** Every promise is `await`ed inside `try`, or ends in
   `.catch(handler)`; fire-and-forget is `void task().catch(reportError)` (S9383). Every
   `await`, including library loading and camera start-up, sits inside the `try`. Messages to
   users say what to do next.
5. **Two guards for every non-repeatable write** (new id, money, counter, email, log entry):
   an in-flight flag (a `null`-or-named-string state, set before the first `await`, button
   disabled and "Saving…" until `finally`) **and** a refusal inside the server transaction
   when the record changed since the screen loaded (`seenUpdatedAt` or status check), or a
   deterministic document id. A confirm dialog is neither.
6. **Config and secrets out of source.** Email keys in Secret Manager. Per-environment
   config (`.firebaserc` aliases, branding doc) explicit; project names state their role
   (`-staging`, `-prod`). Never commit a SonarQube token.
7. **Dependencies pinned to exact versions** from npm (no `^`, no runtime CDN). Each new
   dependency is justified in its PR.
8. **Tests.** Unit (Vitest) for `shared/domain` and function logic, ≥ 80% new-code coverage
   via lcov; rules tests (`@firebase/rules-unit-testing`) for every collection × role ×
   allow/deny; emulator concurrency tests for every two-guard write (N parallel calls → one
   result, plus a negative control); Playwright for each role's main journey. Every defect
   fix ships with the test that would have caught it.
9. **Money and time.** Money is integer centavos, never floating point. Business dates are
   computed in `Asia/Manila` by `shared/domain/dates.js`.
10. **Rendering.** User text goes through `lit-html` bindings or `textContent`. Never build
    `innerHTML` from user input; `unsafeHTML` needs a review note. (SonarQube Community does not
    trace XSS — CS-14.)
11. **Accessibility and performance.** Labels on every input, keyboard reachable, colour
    contrast AA. Budget (assumed, SA-001 A-7): screen usable < 3 s on a mid-range phone on 4G;
    lists paginated; images compressed on device before upload.
12. **Copy matches behaviour.** Copy that asserts an outcome ("paid", "sent", "notified")
    names the code that makes it true; queued is "queued", not "sent".
13. **Small changes.** One branch per change, no direct commits to `main`, PRs reviewable in
    one sitting. Deploy order: rules + functions (backward-compatible) before hosting.
14. **Logging without PII.** Structured logs with ids and action codes; never names, phone
    numbers, emails, tokens, pass codes or image URLs. Enough to reconstruct an incident.
15. **Deletes.** Every delete names what still points at it; prefer soft delete for anything
    a total, number sequence or audit entry references. Firestore does not cascade.

## SonarQube quality gate (merge requirement from the first commit)

Self-hosted SonarQube Community Build (`http://localhost:9000`), project key `hoa-portal`,
`sonar-project.properties` in the repo excluding `node_modules`, build output and the HTML
mock-ups (`index.html`, `gentri-heights/`). Dev scans before every merge to `main`.
Confirm these thresholds on the server's Quality Gates page before quoting them as defaults.

| Condition (new code) | Threshold |
|---|---|
| Reliability, Security, Maintainability ratings | A |
| New Blocker / Critical / Major issues | 0 |
| Security hotspots reviewed | 100% |
| Coverage | ≥ 80% |
| Duplicated lines | ≤ 3% |
| Cognitive complexity per function (S3776) | ≤ 15 |

Rules from the Taekwondo scan (2026-11-27), adopted here:

| Sonar rule | Rule here |
|---|---|
| S9383 unhandled promise | CS-4 |
| S8786 slow regex | No nested/overlapping quantifiers; cap input length first; use a library validator for email/phone |
| S2871 `.sort()` without comparator | Always pass one (`localeCompare` / `a - b`) |
| S7773 global `parseInt`/`isNaN` | `Number.parseInt`, `Number.isNaN`, `Number.isFinite` |
| S6861 exported mutable `let` | Export getters/setters or a state object |
| S3403 always-false comparison | One type per variable; busy flags are `null` or a named string |
| S2189 infinite loop | No polling loops; wait on a listener or promise with a timeout |
| S3516 same return value | Keep side effects out of template helpers |
| S6544 promise as boolean | Test `promise !== null` |
| S7767 `\| 0` truncation | `Math.trunc` |
| S1313 hard-coded IP | Named config constant |
| Cognitive complexity | Actions routed through a lookup table of small handlers (as the mock-up's `ACT`/`FORMS` already are); no giant dispatcher |

False positives are marked on the server once with a one-line reason; never a global rule
disable or blanket `// NOSONAR`. Loosening a threshold or disabling a rule needs an ADR and
the owner's approval. `firestore.rules` and `storage.rules` are not scanned — their unit
tests are the check. "0 vulnerabilities" from the free edition is not a security sign-off.
