# Workflow: approved requirement → deployed to demo

| | |
|---|---|
| Status | **Draft** — for the owner's review |
| Date | 2026-11-28 |
| Built from | `.claude/agents/` (business-analyst, sol-arch, qa, qe, dev) as on `main` at `191e740` |
| Scope | From the moment the owner approves a `REQ-` to the build running on the **demo** environment. Production is out of scope (it repeats stages 9–10 with its own approval). |

## The path at a glance

```
REQ approved (owner)
   │
   ├──────────────► 2. QA: TC-NN test plan ──► owner approves ──► 3. QE: triage (layers, locators, unit list)
   │                                                                     │
   ▼                                                                     ▼
1. Sol Arch: SA/CIA review ──► owner "APPROVED — FINAL" ──► 4. Dev: build in a worktree ◄── locator contract + Unit scenarios
                                                               │
                                                               ▼
                                                5. Dev gate: unit + rules tests, ≥80% coverage, SonarQube pass
                                                               │
                                                               ▼
                                                6. Merge to main (owner OK, merge commit, no PR)
                                                               │
                                                               ▼
                                                7. Deploy to TEST (rules first, then hosting)
                                                               │
                                                               ▼
                                                8. QE: smoke → ACCEPTANCE tests (per story) ──► defects loop to Dev (back to 4)
                                                               │
                                                     all ACs pass → story CLOSED
                                                               │
                                     (repeat 4–8 for every story in the release batch)
                                                               │
                                                               ▼
                                                9. QE: targeted REGRESSION, once, for the whole batch → "Ready" / "Not ready"
                                                               │
                                                               ▼
                                               10. Owner approves promotion → Dev deploys the batch to DEMO → QE smoke on demo
                                                               │
                                                               ▼
                                               11. Release plan + chart updated: "On demo"
```

Stages 1 and 2 start **at the same time**, the moment the REQ is approved. QA never waits for a build (qa.md: "Wait for a build before starting" is a Never).

## Stages

### 0. Entry condition — the requirement is approved

- **Owner:** BA
- **In:** `docs/requirements/REQ-NNN-*.md` with Status **Approved** by the owner, the chosen UX option, Gherkin acceptance criteria, and a published mockup for any screen change.
- **Out:** BA hands off to Sol Arch and QA together.
- **Release plan stage:** *Owner approved*.

### 1. Architecture review — Sol Arch

- **Does:** reads the REQ, writes or updates `SA-NNN` (design) and `CIA-NNN` (change-impact analysis): data model, `firestore.rules` changes, Cloud Functions needed, risks checklist, deploy order, SonarQube-risky design choices. Records lessons in `docs/architecture/LEARNINGS.md`.
- **Gaps:** go back to the BA as specific questions or proposed extra acceptance criteria — never a rewrite. If the BA revises the REQ, QA updates the test plan in stage 2.
- **Gate:** the owner writes exactly `APPROVED — FINAL`. Nothing else counts.
- **Out:** Status **Final — approved by <owner>, <date>**; Dev may start.
- **Release plan stage:** *Sol Arch*.

### 2. Test plan — QA (in parallel with stage 1)

- **Does:** writes `docs/test-cases/TC-NN-<slug>-v1.md`: smoke / acceptance / regression lenses, every scenario (happy, negative, boundary, usability, navigation, role/security, …), round-trip register for multi-role features, every prior status a gated rule checks. Layer stays `TBD — QE`. Updates `COVERAGE-MAP.md` hooks as needed.
- **Gate:** the owner approves the TC document. Gaps found go to the BA (as with TC-01's G-1 to G-21).
- **Out:** decision-ready summary — case count, P1 count, smoke additions, top regression risk.
- **Release plan stage:** *QA plan*.

### 3. Triage — QE (after stage 2 approval)

- **Does:** assigns every scenario a layer — **Unit → API → UI**, or Journey / Manual — at the lowest layer that can prove it; updates the coverage map with no overlaps; writes the **locator contract** (`data-action` / `data-testid`) and the list of **Unit scenarios** for Dev; plans spec files and automation order.
- **Out to Dev:** locator contract + Unit scenario list. Starts writing API (emulator) and UI (Playwright) specs while Dev builds.

### 4. Build — Dev (after stage 1 is FINAL; uses stage 3's output)

- **Does:** new branch **and** worktree (`../HOA_APP-<name>`, `feature/<name>` or `fix/<name>`). Reads the REQ, the `SA-`, and `CODING-STANDARDS.md`. Changes the code and `firestore.rules` as a matched pair; puts logic in plain modules so it can be unit-tested; writes the Unit scenarios QE sent, plus rules tests for any rules change. Adds the locator attributes from the contract. Bumps `APP_VERSION`.
- **Design surprises:** go to Sol Arch before departing from the design.

### 5. Dev done gate (before merge)

All must pass, or the branch does not merge:

- [ ] Unit tests and rules tests green (Vitest, V8 coverage → `coverage/lcov.info`)
- [ ] ≥ 80% coverage and ≤ 3% duplication on new code
- [ ] Local SonarQube scan passes the gate (ratings A, zero new Blocker/Critical/Major, hotspots reviewed, cognitive complexity ≤ 15). False positives go to Sol Arch — never `// NOSONAR`.
- [ ] QE's API (emulator) specs for this change run green
- [ ] `APP_VERSION` bumped; no `.env`, keys or real data committed
- [ ] Dev states in plain words what the merge/push deploys, and the deploy order

**Release plan stage:** *Built*.

### 6. Merge to `main`

- Owner OKs the merge. Land it as a merge commit `Merge <branch>: <what> (approved)` — **no pull request**. Remove the worktree.

### 7. Deploy to the test environment — Dev

- Order (from the `SA-`): usually **rules that accept both old and new shapes first**, then Functions, then Hosting.
- Record every rules and functions deploy: project, command, commit, ruleset / function revision before and after.
- Confirm the target project by its role, never by its name.

Testing is split into two separate activities with different purposes, scope and timing:

| | Acceptance testing (stage 8) | Regression testing (stage 9) |
|---|---|---|
| **Question it answers** | Does this story do what its acceptance criteria say? | Did the changes break anything that used to work? |
| **Scope** | One user story: every Gherkin scenario of its REQ, unhappy paths included | Only the features the code changes touched, plus the areas they could affect |
| **When** | As soon as the story is on the test environment | Once, after every story in the release batch has passed acceptance, before deploying to demo |
| **Gate for** | **Closing the user story** | **Deploying the batch to demo** |
| **Unit of work** | Per story | Per release batch (all stories going to demo together) |

### 8. Smoke, then acceptance tests — QE, per user story

- **Smoke** (read-only): every screen loads for Homeowner, each Admin sub-role, and Guard; sign-in works; no blank screen or halting console error; footer shows the expected `APP_VERSION`. **If smoke fails, stop** — show-stopper back to Dev.
- **Acceptance tests:** the cases in the story's `TC-NN` that trace to its acceptance criteria — at least one per Gherkin scenario, unhappy paths included. Nothing else; regression comes later.
- **Failures:** triage list first (re-render, modal, pagination, test data, drifting value, silent rules refusal); only then file `docs/defects/DEF-NNN-*.md` and hand to Dev.
- **Defect loop:** Dev fixes on a new `fix/` branch → stages 4–7 again → Dev marks **Resolved** → QE re-verifies on the deployed build and marks **Closed**.
- **Gate — closing the user story:** a story is **Closed** only when every acceptance criterion has a passing case (or the owner explicitly accepts an exception in writing), and every defect raised against it is Closed or accepted by the owner. QE reports per AC: pass / fail / accepted exception.
- **Release plan stage:** *Accepted* (story closed).
- Repeat stages 4–8 for each story in the release batch.

### 9. Regression — QE, once per release batch

- **When:** after **every** story in the batch has passed acceptance and is Closed, and the batch is all on the test environment together. Run it once for the whole batch, not per story.
- **Building the scope:** consolidate across all stories in the batch:
  1. **Touched features** — every screen, collection, rule, Function and shared component the batch's code changes modified (from the merge diffs and each `CIA-NNN`).
  2. **Potentially affected areas** — what reads or writes the same collections or fields, totals derived from touched data, shared components used elsewhere, roles whose access the rules changes alter, open defects in those areas, and known failure patterns that apply (from each `TC-NN`'s regression lens).
  3. Remove duplicates across stories; one consolidated regression list, written into the batch's release entry before the run.
- **Out of scope:** features no change touched and nothing touched can affect. They are not re-run.
- **Answer from evidence:** run counts; every case in the consolidated list executed or explicitly deferred; every defect fixed-and-retested or accepted by the owner; the environment serving the tested version.
- **Out:** **Ready** — or **Not ready, and here's what's outstanding**. Never a maybe.
- **Release plan stage:** *Tested*.

### 10. Promote the batch to demo

- **Gate:** every story in the batch is Closed (stage 8), QE said **Ready** on regression (stage 9), and the owner approves this specific promotion in chat (a relayed approval counts only as a verbatim quote).
- **Dev:** deploys **the same commit** QE regression-tested — no rebuild from a newer `main`, and no story that skipped acceptance or regression. Same order as stage 7. Records the deploy.
- **QE:** smoke on demo; confirm the footer `APP_VERSION` matches what was tested.
- **Data:** demo carries invented households only (e.g. "ZZ Test Household A"); no real homeowner data.

### 11. Track it

- Update `docs/backlog/RELEASE-PLAN.md` and the release chart, then republish the chart.

## Who hands what to whom

| From | To | Artifact | Trigger |
|---|---|---|---|
| BA | Sol Arch, QA | Approved `REQ-NNN` + mockup | Owner approves the REQ |
| Sol Arch | BA | Gap questions / proposed ACs | During review |
| Sol Arch | Dev | `SA-NNN` / `CIA-NNN` (Final) | `APPROVED — FINAL` |
| QA | BA | Gap list (`G-n`) | While writing cases |
| QA | QE | `TC-NN` (approved) | Owner approves the TC |
| QE | Dev | Locator contract + Unit scenarios | Triage done |
| Dev | QE | Merged commit + `APP_VERSION` on test | Stage 7 done |
| QE | Dev | `DEF-NNN` | A real app bug |
| QE | Owner | Per-AC result; story Closed | Acceptance tests done |
| QE | Owner | Consolidated regression list | All batch stories Closed |
| QE | Owner | Ready / Not ready | Regression done |
| Owner | Dev | Promotion approval | Ready accepted |
| QE | Sol Arch, QA | New failure shape | Any defect that reveals one |

## Not in place yet — needed before the first build can reach demo

These are prerequisites the workflow assumes but the repo doesn't have yet (as of `191e740`):

1. **Firebase projects** for test and demo, with `firebase.json` / `.firebaserc` — and which project is which role confirmed by the owner.
2. **`SA-001` architecture approved** (on branch `docs/sa-001-architecture`, not yet on `main`) — it names the test host for QE's environment guard.
3. **`docs/architecture/CODING-STANDARDS.md`** with the SonarQube gate written in, and the `hoa-portal` project configured on the local server.
4. **Vitest + coverage** in `package.json` (today only Playwright is installed).
5. **Firebase Emulator Suite** set up for API and rules tests.
6. **`APP_VERSION` in the footer** of every view.
7. A **deploy record** location (suggest `docs/deploys/DEPLOY-LOG.md`).

## Decisions for the owner

1. **Does a demo promotion need your approval each time?** The agent files require it only for production. This draft asks for it on demo too, because clients see demo. Alternative: QE's "Ready" alone promotes to demo.
2. **One approval phrase or two?** Sol Arch accepts only `APPROVED — FINAL`; REQs and TCs have been approved with "approve it". Suggest one rule for all three.
3. **What is a release batch?** Regression runs once per batch. Suggest one sprint (e.g. S1 = REQ-001–004), to match the release plan.
4. **New release-plan stages** *Accepted* (story closed) after *Built*, and *On demo* between *Tested* and *Released*?
5. **The QE agent file disagrees with this draft.** `qe.md` says "Before any promotion (demo or production): Full regression" (everything). This draft runs targeted regression instead. If you approve, `qe.md` (and the QA regression lens in `qa.md`) need updating to match.

## Revision history

| Rev | Date | Change |
|---|---|---|
| r1 | 2026-11-28 | First draft |
| r2 | 2026-11-28 | Testing split in two, per the owner: acceptance tests per story (gate to close the story) and targeted regression once per release batch (gate to deploy to demo) |
