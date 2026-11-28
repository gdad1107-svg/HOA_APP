# REQ-005: Privacy notice and acknowledgement

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-001 Access and households](../epics/EPIC-001-access-and-households.md) |
| Backlog story | [05 Privacy notice and consent](../backlog/BACKLOG.md#05-privacy-notice-and-consent) |
| Status | **Approved** by the owner, 2026-11-28 ("Approve all as shown"), with every recommendation accepted. Sol Arch reviewed: supports Option A with changes (applied in r3) |
| Mockup | Screens 5A–5E of the [REQ-005 to REQ-011 mockup](../mockups/req-005-011-mockup.html). Not yet published as an artifact: ready for the main session to publish |
| Architecture | SA-001 §8.2 (privacy, RA 10173) and §4.2 (`users`), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-001 (sign-in). Must ship before any real homeowner signs in (Sol Arch, REQ-001 review) |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft · r2, 2026-11-28: Sol Arch review recorded · r3, 2026-11-28: Sol Arch's changes applied (versions compared by `seq`, only `config/privacy` and `privacyNotices` public, structured text never `innerHTML`, stale-version scenario, treasurer reads `privacyAck`, publish script in one batch with prod confirmation) · r4, 2026-11-28: owner approval recorded; recommendations accepted · 2026-11-28: size re-done with mock-up reuse (REVIEW-sizing-reuse.md, owner approved) |

## Owner decisions

Approved by the owner on 2026-11-28 ("Approve all as shown"): every recommendation in the right-hand column is accepted. Decision 2 stands as acknowledgement unless the DPO says otherwise. Questions for the DPO or the HOA board under Open questions stay open.

| # | Decision | Approved |
|---|---|---|
| 1 | Option A (notice shown once after sign-in, acknowledged, re-shown on a material change), B (a link at account creation only) or C (separate consent per purpose) | **A** |
| 2 | What the tick box means: "I agree" (consent) or "I have read and understood" (acknowledgement). See Problem | **Acknowledgement**, unless the HOA's Data Protection Officer (DPO) says the HOA relies on consent |
| 3 | Who publishes a new version of the notice in R1 | **The developer, on the DPO's written request**, the same way roles are set (REQ-002 decision 2). An editing screen can come later |
| 4 | Whether a staff member must acknowledge the notice too | **Yes**, the same screen. Staff are data subjects as well, and the record shows they saw it |
| 5 | A person who presses "I don't agree" | **Signed out**, with the office's contact shown. The account stays; nothing is deleted |

## Problem

The portal holds names, emails, mobile numbers, lots, balances and payment screenshots for 623+ households, and in R4 possibly guests' ID photos. The Data Privacy Act of 2012 (RA 10173) requires the HOA to tell people what it collects, why, who sees it, how long it is kept and how to ask for access or correction. Nothing in the mock-up does this. SA-001 §8.2 lists "a privacy notice in the app" as a requester-to-confirm item, and Sol Arch's REQ-001 review says it must ship before any real homeowner signs in.

Who has the problem: every [Homeowner](../product/PERSONAS.md#homeowner) (their right to be informed) and the HOA board (accountable as the personal information controller).

**Challenge to the backlog story: "consent" is probably the wrong word.** The backlog story makes the portal unusable until the person ticks "I agree". Under the Act, consent is only one lawful basis; others include a contract and legitimate interest, which needs a purpose, necessity and balancing test recorded by the controller (NPC Circular 2023-07, as summarised by [Baker McKenzie](https://insightplus.bakermckenzie.com/bm/data-technology/philippines-national-privacy-commission-issues-guidelines-on-the-processing-of-personal-information-based-on-legitimate-interest)). Billing dues and recording payments is something the HOA does whether or not a member opens the portal, so asking for "consent" to it, and refusing access when it is withheld, is unlikely to be freely given consent. A notice that the person **acknowledges reading** gives the HOA the same record without that problem. This is a legal reading, not legal advice: **the HOA's DPO must confirm the lawful basis and write the notice text.** The portal only shows the text, records who acknowledged which version, and shows it again when it changes.

## Options

### Option A: Notice shown once after sign-in, acknowledged, re-shown on a material change (recommended)

- **How it works:** after signing in (REQ-001), and before "Enter your invite code" or the dashboard, the person sees the notice in full with a tick box "I have read and understood the privacy notice" and a "Continue" button. The portal records the version and the date. When the HOA publishes a version marked as a material change, everyone sees it again at their next sign-in, with a short "What changed" at the top. A typo fix doesn't ask again. "Privacy notice" is always linked from the sign-in page and the account menu.
- **Where it lives:** a full page between sign-in and the first screen; the link in the footer of the sign-in page and in the account menu.
- **Cost:** cheap. One page, one versioned text document, one field per person.
- **Excludes:** nothing. Works on any device and role.
- **Honest downside:** one more screen the first time, and people tick without reading. That is true of every option; the record still shows the notice was put in front of them.

### Option B: A link at account creation only

- **How it works:** "Create account" (REQ-001) carries "By creating an account you confirm you have read the privacy notice", with a link. No separate screen.
- **Cost:** cheapest.
- **Excludes:** people who already have an account when the notice changes. There is no way to show them a new version.
- **Honest downside:** no record per version, and Google sign-in skips the "Create account" form, so many people never see the line.

### Option C: Separate consent for each purpose

- **How it works:** the notice lists purposes (billing, announcements, email, guest passes) with a switch for each, and the portal respects each switch.
- **Cost:** moderate to a project: every later feature has to check the right switch.
- **Honest downside:** most purposes aren't optional (the HOA bills dues regardless), so most switches would be fake choices, which the NPC's guidance on deceptive design discourages. Worth it only for truly optional uses, and R1 has none.

### Recommendation

**Option A, worded as an acknowledgement.** It gives a dated, versioned record for every person, handles a changed notice, and costs about a day. If a truly optional purpose appears later (for example marketing email), add one consent switch for that purpose then.

## Story

As a homeowner, I want to read what personal data the HOA keeps, why, who sees it and how long, so that I know how my data is handled and how to ask about it.

This revises backlog story 05: the record is per person (on their account), not per household, because two people on one lot each read the notice for themselves.

**Accepted limitation:** the gate is on screen only. A modified browser could skip the page and still read its own household's data. That is accepted because it hides nothing from anyone else and the person only skips being informed; the missing acknowledgement shows in the directory (Sol Arch to confirm).

## Acceptance criteria (Option A)

```gherkin
Feature: Privacy notice

  Background:
    Given version 1 of the privacy notice is published, effective Dec 1, 2026

  Scenario: A homeowner sees the notice at first sign-in
    Given Juan Dela Cruz has just created an account and has never acknowledged a notice
    When he signs in
    Then he sees "Privacy notice" before "Enter your invite code" or any dashboard
    And "Continue" is disabled until he ticks "I have read and understood the privacy notice"

  Scenario: The acknowledgement is recorded
    Given today is Dec 1, 2026 in Manila
    When Juan ticks the box and presses "Continue"
    Then he lands on "Enter your invite code" (or his dashboard if already linked)
    And in the household directory, his row under Blk 4 Lot 12 shows "Privacy notice v1 read Dec 1, 2026"
    And the next time he signs in he does not see the notice

  Scenario: Pressing Continue twice records once
    When Juan presses "Continue" twice quickly
    Then exactly one acknowledgement is recorded
    And the button reads "Saving…" and is disabled until the save finishes

  Scenario: A material change asks again
    Given Juan acknowledged version 1
    And the HOA publishes version 2 marked as a material change
    When Juan next opens the portal
    Then he sees "We've updated our privacy notice" with the "What changed" summary above the full text
    And he must tick the box and press "Continue" before any other page

  Scenario: A minor correction does not ask again
    Given Juan acknowledged version 1
    And the HOA publishes version 1.1 marked as a minor correction
    When Juan next opens the portal
    Then he lands on his dashboard without seeing the notice
    And "Privacy notice" in the account menu shows version 1.1

  Scenario: A person who does not agree is signed out
    When Juan presses "I don't agree"
    Then he sees "You've been signed out. To ask about how your data is used, contact the admin office at {office contact}."
    And no acknowledgement is recorded
    And his account and his household's records are unchanged

  Scenario: Staff see the notice too
    Given Carmela Cruz holds the treasurer role and has not acknowledged version 1
    When she signs in
    Then she sees the privacy notice before the staff dashboard

  Scenario: The notice can be read at any time
    Given Maria Santos is signed in
    When she opens the account menu and chooses "Privacy notice"
    Then she sees the current version, its effective date, and "You read this on {date}"
    And the sign-in page shows a "Privacy notice" link that anyone can open without signing in

  Scenario: The notice fails to load
    Given the notice cannot be loaded
    When Juan signs in
    Then he sees "We couldn't load the privacy notice. Check your connection and try again." with "Try again"
    And "Continue" stays disabled
    And no other page opens

  Scenario: A person who has not read the notice yet, seen by staff
    Given Ana Reyes is linked to Blk 2 Lot 7 but has not acknowledged the current version
    When the admin opens Blk 2 Lot 7 in the directory
    Then Ana's row shows "Privacy notice not read yet"

  Scenario: Only the server time is recorded
    When anyone acknowledges the notice
    Then the recorded date comes from the server, not the phone's clock
    And the acknowledgement is refused unless it names the current version

  Scenario: The notice changes while the page is open
    Given Juan has version 1 of the notice open and has ticked the box
    And version 1.1 is published before he presses "Continue"
    When he presses "Continue"
    Then no acknowledgement of version 1 is recorded
    And the page reloads version 1.1 with the box unticked
    And he sees "The privacy notice was just updated. Please read it again before continuing."

  Scenario: The treasurer sees who has read the notice
    Given Juan acknowledged version 1 on Dec 1, 2026
    When the treasurer opens Blk 4 Lot 12 in the directory
    Then Juan's row shows "Privacy notice v1 read Dec 1, 2026"
```

## Data changes

| What | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Notice version | `privacyNotices/{seq}` `{label, effectiveDate, material, whatChanged[], sections[], publishedBy, dpoRequestRef, publishedAt}`. `seq` is a whole number (1, 2, 3 …) used for comparing; `label` ("1.1") is for display only; `sections[]` is headings and paragraphs as plain text | No client writes. Old versions kept, never edited | Developer script on the DPO's written request (decision 3) | Everyone, including signed-out visitors (public text) |
| Version pointer | `config/privacy` `{currentSeq, lastMaterialSeq}`. A minor correction raises `currentSeq` only; a material change raises both. **Never** in `config/settings`, which signed-out visitors must not read | No client writes | Developer script, in the same batch as the version | Everyone, including signed-out visitors |
| Acknowledgement | `users/{uid}.privacyAck` `{seq, label, at}` | Rules, no function: the update changes only `privacyAck` (`diff().affectedKeys().hasOnly(['privacyAck'])`); `privacyAck.seq == get(/config/privacy).data.currentSeq`; `privacyAck.at == request.time`. The gate shows the notice when `privacyAck` is missing or `privacyAck.seq < lastMaterialSeq` | The person | The person; admin office and treasurer (directory member row) |
| Change record | `auditLog` | `privacy.published` (seq, label, material yes/no). Acknowledgements are **not** audited one by one: `users/{uid}.privacyAck` is the record | Developer script | Board, treasurer |

`users/{uid}` already allows the person to write `name`, `email`, `phone`, `createdAt` (REQ-001 review). `privacyAck` is added to that closed list. **Rules change to REQ-001:** the treasurer may read `users/{uid}` as well as the admin office, so both see the "read / not read yet" status (Sol Arch change 5; the BA keeps the treasurer because REQ-003 gives the treasurer the directory).

**Publish script:** writes `privacyNotices/{seq}`, `config/privacy` and the `auditLog` entry `privacy.published` in one batch. It reads the text from a file named for the target project, so staging text never reaches production; it prints the target project and asks for typed confirmation on `-prod` (L-003, as with `setRole`).

## UX/UI notes

- **Accessibility:** the notice is real text with headings (not an image or PDF), at least 16 px on phones, contrast 4.5:1; the tick box has a visible label and a 44 × 44 px tap area; "Continue" being disabled is explained by the hint "Tick the box to continue" (not colour alone); focus starts on the page heading.
- **Consistency:** "Privacy notice" everywhere (not "privacy policy" or "data privacy consent"). Same card and buttons as the sign-in pages (REQ-001).
- **Mobile-first:** a single scrolling page at 375 px. The tick box and "Continue" sit in a sticky footer within thumb reach, so nobody has to scroll to the bottom to find them. We do **not** force scrolling to the end before the box can be ticked: it frustrates people and proves nothing.
- **States:** loading (skeleton lines); error (above); success (lands on the next screen, no toast needed); offline ("You're offline. Connect to the internet to continue.").
- **Safe actions:** "Continue" shows "Saving…" while in flight. "I don't agree" is a plain secondary button, not hidden, and it is not destructive (it signs out only).
- **Roles:** every signed-in role sees it. Signed-out visitors can read it from the sign-in page.
- **Rendering:** the notice is structured plain text (headings and paragraphs), rendered through `lit-html` bindings. It is **never** put into the page with `innerHTML`, even though only the developer writes it (CS-10).
- **Stale version:** if the notice changes while the page is open, the refused save reloads the new version, unticks the box and says why (scenario "The notice changes while the page is open").
- **Privacy:** the "What changed" summary is written by the DPO in plain words, two to five bullet points.

## Copy of record

| Where | Text |
|---|---|
| Page heading (first time) | Privacy notice |
| Page heading (material change) | We've updated our privacy notice |
| Sub-heading | Version {n} · effective {date} |
| What changed (material change only) | What changed · {DPO's bullet points} |
| Tick box | I have read and understood the privacy notice |
| Hint while unticked | Tick the box to continue |
| Primary button | Continue (in flight: Saving…) |
| Secondary button | I don't agree |
| Signed out after "I don't agree" | You've been signed out. To ask about how your data is used, contact the admin office at {office contact}. |
| Load error | We couldn't load the privacy notice. Check your connection and try again. · Try again |
| Offline | You're offline. Connect to the internet to continue. |
| Version changed while open | The privacy notice was just updated. Please read it again before continuing. |
| Account menu item | Privacy notice |
| Read-any-time footer | You read this on {date}. |
| Sign-in page link | Privacy notice |
| Directory member row | Privacy notice v{n} read {date} · Privacy notice not read yet |

The notice text itself is **not** copy of record here: the DPO writes it. It should cover, at least, what is collected, why, the lawful basis, who sees it (household members, admin office, treasurer, board), where it is stored (SA-001 Q11: Singapore region), how long, and how to ask for access, correction or deletion.

## Out of scope

- Writing the notice text (the HOA's DPO).
- A screen for staff to edit and publish notice versions (decision 3).
- Consent switches per purpose (Option C).
- A homeowner asking for a copy of their data or for deletion; the notice says how to ask the office, and the office handles it by hand in R1.
- The gate's own notice for guests (R4, story 45 and SA-001 §8.2 "privacy notice posted at the gate"). When the gate add-on ships, the portal notice gets a material-change version.

## Open questions

| Question | Who decides |
|---|---|
| Confirm decision 2 (acknowledgement, not consent) and the lawful basis (P1), and write the notice text including the "What changed" bullets | DPO |
| Who is the HOA's Data Protection Officer, and will they write the notice before the pilot? (SA-001 §8.2) | HOA board |
| Lawful basis for billing and payment records: contract, legitimate interest or consent? | DPO |
| Is storing data in Singapore (`asia-southeast1`) acceptable, and must the notice say so? (SA-001 Q11) | DPO |
| Retention periods to state in the notice (payment screenshots, activity log, notifications) | DPO with the treasurer |

## Sol Arch review

Questions for Sol Arch (from the BA, r1):

1. Acknowledgement as a client write on `users/{uid}` checked by rules (`version == current`, `at == request.time`), or a small callable? The rule needs a `get()` on `config/privacy`.
2. Is reading `privacyNotices` without signing in acceptable (public text), or should the sign-in page link go to a static Hosting page instead?
3. Confirm the on-screen-only gate is acceptable (see Accepted limitation), rather than every rule checking `privacyAck`.

**BA size estimate (Sol Arch to confirm):** S, about 1–1.5 person-days with Claude Code, including the publish script and Playwright journeys.

### Sol Arch findings (2026-11-28, draft)

*Sol Arch, 2026-11-28, draft.* Reviewed against SA-001 r3 §4.2, §8.2 and CODING-STANDARDS (CS), Draft on branch `docs/sa-001-architecture` at `e28d9bc`; this REQ as drafted on branch `docs/req-005-045` (uncommitted, based on `da89072`). Greenfield: no application code exists, so nothing was grepped beyond the documents.

**Verdict: Supports Option A, with changes.** Acknowledgement rather than consent is the right default, but that is a legal reading for the DPO to confirm, not something the design decides. Nothing here needs a Cloud Function. The changes are about where the text lives, how versions compare, and how the text is rendered.

#### Options

| Option | Feasible? | Cost (BA) | Sol Arch |
|---|---|---|---|
| A: notice after sign-in, acknowledged, re-shown on a material change | Yes | Cheap | **Agree.** About 1–1.5 days |
| B: link at account creation only | Yes | Cheapest | Agree with the BA's downside. Google sign-in skips the form, so many people never see it, and there is no record per version |
| C: consent per purpose | Yes | Moderate to a project | Agree. Every later feature would have to check a switch. Not justified while R1 has no optional purpose |

#### Answers to the BA's questions

1. **A client write checked by rules, not a callable.** The write is one field on the person's own document, it is idempotent (pressing twice sets the same value), and the audit record *is* that field, as the REQ says. Rule: the update changes only `privacyAck` (`diff().affectedKeys().hasOnly(['privacyAck'])`), `privacyAck.version == get(/config/privacy).data.currentVersion`, and `privacyAck.at == request.time`. The `get()` costs one read per acknowledgement, which is trivial. **Change: compare versions by a number, not a label.** "1.1" vs "2" as strings sorts wrongly once there are ten versions. Store `seq` (1, 2, 3 …) plus a display `label` ("1.1"), and `config/privacy.lastMaterialSeq`. The gate shows the notice when `privacyAck.seq < lastMaterialSeq`. A minor correction raises `currentSeq` but not `lastMaterialSeq`. The rule checks that `privacyAck.seq == currentSeq`.
2. **A public Firestore read is acceptable, with one condition.** The notice is public text, and keeping it in Firestore means one source for the sign-in link, the gate and the account menu, published by the developer script without a Hosting deploy. **The condition:** the public documents are `config/privacy` and `privacyNotices/{seq}` only. **Never** put the version pointer in `config/settings`, which holds other settings that signed-out visitors must not read. App Check (SA-001 §8.3) limits scripted reads. Expect about 2 reads per visitor; trivial cost.
3. **The on-screen gate is acceptable.** If every rule checked `privacyAck`, each rule evaluation would need an extra `get()`, and household list queries would get more complicated. The only person who loses anything by skipping the page is the one skipping it. The record shows they did not acknowledge it, and the directory row says so. I confirm the BA's "Accepted limitation".

#### Required changes (for the BA to apply)

> **BA note (r3):** all six are applied above: 1 and 6 in Data changes; 2 in UX/UI notes; 3 and 4 in the acceptance criteria and copy of record; 5 by keeping the treasurer, adding the treasurer's read of `users/{uid}` as a rules change to REQ-001, and a scenario. None conflicts with an approved decision.

1. **Data changes:** use `config/privacy` `{currentSeq, lastMaterialSeq}` and `privacyNotices/{seq}` `{label, effectiveDate, material, whatChanged[], sections[], publishedBy, dpoRequestRef, publishedAt}`. The acknowledgement is `users/{uid}.privacyAck {seq, label, at}`. Remove "(SA to confirm names)".
2. **The notice text is structured plain text, not HTML.** It is stored as headings and paragraphs (or a very small Markdown subset) and rendered through `lit-html` bindings. It is never put into the page with `innerHTML`, even though only the developer writes it (CS-10; SonarQube Community does not trace XSS). Add to UX/UI notes.
3. **Add a scenario: the version changes while the page is open.** Juan has the notice open, then version 1.1 is published, and then he presses Continue. The write is refused as "not current", so the page reloads the new version and shows: "The privacy notice was just updated. Please read it again before continuing." (copy for the BA).
4. **Scenario "Only the server time is recorded":** reword the second line to "And the acknowledgement is refused unless it names the current version". "Firestore refuses" is fine for the test plan, but the screen needs its own outcome (item 3).
5. **The directory's "read / not read yet" status** requires staff (admin office, treasurer) to read `privacyAck` on `users/{uid}`. REQ-001's rules let the admin office read `users`. Add the treasurer, or drop the treasurer from "Read by". BA to choose.
6. **Publish script:** it writes the version document and the pointer in one batch, and the `auditLog` entry `privacy.published`. It prints the target project and asks for typed confirmation on `-prod` (L-003, as with `setRole`).

#### Risks not covered

- **No DPO, no notice text (RA 10173).** This is not a *build* blocker: staging can use placeholder text. It **is a production go-live blocker**, because SA-001 §8.2 and the REQ-001 review say no real homeowner signs in before the notice exists. The lawful-basis wording (decision 2) maps to the Act's criteria for lawful processing. The requester and the DPO must confirm it; I make no compliance claim.
- **Cross-border transfer (SA-001 Q11).** If the DPO wants the notice to name Singapore, the notice depends on ADR-001's region, which cannot be changed after the database is created.
- **Repeat-trigger safety:** not applicable beyond the in-flight flag, because the write is idempotent.
- **Stale reference:** covered by required change 3.
- **Roles and leakage:** no leakage. The notice is public, and the acknowledgement is readable by the person and by staff only.
- **Multiple environments:** each project has its own `privacyNotices`. The publish script must not publish staging text to production. It reads the text from a file named for the target project.
- **Observability:** an error-monitoring event when the notice fails to load. Otherwise none needed.

#### Size

**S, 1–1.5 person-days with Claude Code. I confirm the BA's estimate.** It covers the gate route, the page, the rules and rules tests (current or stale version, other fields, other user), the publish script and Playwright journeys.

#### Size with mock-up reuse (2026-11-28, replaces the size above)

**1–1.5 person-days with Claude Code** (was 1–1.5). Re-sized under the owner's rule to reuse what is already in the repo (L-006), in [REVIEW-sizing-reuse.md](../architecture/REVIEW-sizing-reuse.md), approved by the owner on 2026-11-28 ("APPROVED — FINAL: sizing reuse review, merge it").

- **Parts** (port UI · extend UI · new UI · back end · tests): 0 · 0 · 0.25–0.5 · 0.5 · 0.25–0.5
- **Reuses:** Nothing in `index.html`. Drawn at `req-005-011-mockup.html` 583–586. The page uses the shell
