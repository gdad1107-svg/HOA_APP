# REQ-026: Log a request or complaint

| | |
|---|---|
| Raised by | Owner: "BA - can you continue writing the rest of the requirements" (2026-11-28) |
| Epic | [EPIC-008 Requests and complaints](../epics/EPIC-008-requests-and-complaints.md) |
| Backlog story | [26 Log a request or complaint](../backlog/BACKLOG.md#26-log-a-request-or-complaint) |
| Status | **Draft for owner review**. Sol Arch review not yet done. |
| Mockup | Screens 26A–26F of the R2 collect-and-account mockup. Repo copy: [req-018-027-mockup.html](../mockups/req-018-027-mockup.html). Not yet published as an artifact (main session to publish and put the link here) |
| Architecture | SA-001 §3 (filing a request is a client write checked by rules; `T-nnn` numbers by function or trigger), §4.2 (`tickets` + `tickets/{id}/updates`, Storage `tickets/{ticketId}/{file}`), §4.4 item 6 (images in Storage), §7 (resize on device), Draft on branch `docs/sa-001-architecture` |
| Depends on | REQ-001 (sign-in), REQ-004 (household link), REQ-011 (notifications). Ships with REQ-027 |
| Author / date | Business Analyst, 2026-11-28 |
| Revision | r1, 2026-11-28: first draft |

## Owner decisions

Not yet approved. The right-hand column is the BA's recommendation; the owner decides.

| # | Decision | Recommended |
|---|---|---|
| 1 | Option A (homeowners file in the portal; the office can also log one for a household that called or walked in), B (a dedicated HOA email inbox) or C (portal form for homeowners only) | **A.** Logging on behalf is about +0.5 day and is what gets every request into one list, including from residents who never use the portal |
| 2 | **Anonymous complaints** (EPIC-008 open question) | **Not in R2.** The office needs to follow up. Instead: the filer's name and lot are never shown to any other household, and the portal never contacts the household complained about |
| 3 | **Billing** requests | **Also shown to the treasurer**, since the admin office can't see payments (REQ-002 decision 3) |
| 4 | Photos per request | **Up to 3**, optional. The mock-up allows 1; a drainage or road problem usually needs a close-up and a wide shot |
| 5 | Withdraw a request | **Yes, while it is Open** (not yet picked up), with an optional reason |
| 6 | Emergency notice on the form | **Yes:** "For emergencies, call the guardhouse at {number}." The portal is not watched round the clock. Needs the number from the admin office |

## Problem

Maintenance problems, security concerns and neighbour complaints arrive by text, chat and in person, with no single list, and residents ask for updates the office has already given ([Admin office staff](../product/PERSONAS.md#admin-office-staff)). Homeowners don't know whether anyone saw their report ([Homeowner](../product/PERSONAS.md#homeowner)).

The mock-up's form (`FORMS.ticket`, line 1454) takes a category, subject, details and one photo stored as base64 inside the data, which SA-001 §4.4 item 6 rules out. It numbers requests from a counter in the browser, so two homeowners filing at once could get the same number.

## Options

### Option A: Portal form for homeowners, plus office logging on behalf (recommended)

- **How it works:** Requests → "New request". Category, subject, details (where, what, since when), up to 3 photos. On submit the homeowner sees the number (T-105), status "Open" and a timeline. The admin office's Requests page gets a badge. The office can also press "Log a request for a household" when someone phones or walks in; the household then sees it in the portal like any other.
- **Where it lives:** homeowner navigation, Requests (the mock-up's "Requests"); staff navigation, Requests & Complaints.
- **Cost:** cheap (backlog S), plus about 0.5 day for logging on behalf.
- **Excludes:** nothing by device; built for a phone.
- **Honest downside:** residents used to texting the office need a nudge to use it; the office will keep getting texts for a while, and logging them on behalf is what keeps the list complete.

### Option B: A dedicated HOA email inbox

- **How it works:** "Email requests@…". The office works from the inbox.
- **Cost:** none in the portal.
- **Honest downside:** no status the homeowner can see, no count for the board, and a shared inbox full of residents' photos and complaints about neighbours.

### Option C: Portal form for homeowners only

- **How it works:** Option A without logging on behalf.
- **Cost:** cheap.
- **Honest downside:** phoned-in and walk-in requests stay on paper, so the list never shows the whole picture.

### Recommendation

**Option A.** It gives homeowners a visible number and status, and the office one list.

## Story

As a homeowner, I want to report a maintenance, security or neighbour problem with a photo, so that the admin office has it in writing and I can follow its progress.

## Acceptance criteria (Option A)

```gherkin
Feature: Logging a request

  Background:
    Given the categories are Maintenance, Security, Noise / Neighbor, Garbage, Billing, Others

  Scenario: Submit a request
    Given Bea Santos of Blk 6 Lot 9 is signed in
    When she submits "Clogged drainage on Acacia St." under Maintenance with the details "Water pools in front of Blk 6 Lot 9 to Lot 12 since Monday" and one photo
    Then the button reads "Submitting…" and is disabled until it finishes
    And she sees "Request T-105 submitted. The admin office will reply here."
    And it appears under My requests as T-105 "Open"
    And its timeline reads "Request submitted." with today's date
    And the admin office's Requests & Complaints badge goes up by 1

  Scenario: Details are required
    When Bea submits without details
    Then "Describe what happened, where, and since when" shows under Details
    And the subject and photo she added are kept

  Scenario: A subject is required
    When Bea submits without a subject
    Then "Give your request a short title" shows under Subject

  Scenario: A large photo
    When Bea attaches a 9 MB photo
    Then it is resized on her phone before upload
    And the request is saved with the photo

  Scenario: Up to 3 photos (decision 4)
    Given Bea has attached 3 photos
    Then "Add photo" is disabled with "Up to 3 photos"

  Scenario: A file that isn't a photo
    When Bea attaches a PDF
    Then she sees "Attach a photo (JPG or PNG)."
    And nothing is uploaded

  Scenario: The upload fails
    Given the network drops while the photo uploads
    Then Bea sees "Your request wasn't sent. Check your connection and try again."
    And the category, subject, details and photos are kept
    And no request is saved

  Scenario: Pressing Submit twice files once
    When Bea presses "Submit request" twice quickly
    Then exactly one request is filed

  Scenario: Two households file at the same moment
    When Bea and another homeowner submit requests at the same moment
    Then each gets a different number

  Scenario: The emergency line (decision 6)
    When Bea opens "New request"
    Then she sees "For emergencies, call the guardhouse at {number}. Requests are read during office hours."
    And when she picks Security the same message is shown above the Subject field

  Scenario: Neighbour complaints stay private (decision 2)
    Given Bea filed T-106 under Noise / Neighbor about Blk 6 Lot 11
    When anyone signed in for Blk 6 Lot 11 uses the portal
    Then they see nothing about T-106
    And their device's request for T-106 is refused

  Scenario: Everyone in the household sees its requests
    Given Bea and Marco Santos are both linked to Blk 6 Lot 9
    When Marco opens Requests
    Then he sees T-105 with its timeline

  Scenario: Withdraw an open request (decision 5)
    Given T-105 is Open and nobody has replied
    When Bea presses "Withdraw", enters "Fixed by the city crew" and confirms
    Then T-105 shows "Withdrawn" and its timeline reads "Withdrawn by Bea Santos: Fixed by the city crew"
    And it leaves the admin office's Open list

  Scenario: A request already in progress can't be withdrawn
    Given T-105 is In Progress
    Then there is no "Withdraw" button
    And Bea can add a comment instead (REQ-027)

  Scenario: The office logs a request on behalf of a household (decision 1)
    Given an admin office staff member is signed in
    When they press "Log a request for a household", choose Blk 2 Lot 7, and submit "Streetlight out on Narra St." under Maintenance with "Reported by phone"
    Then T-107 is listed with "Logged by the admin office · Reported by phone"
    And the people linked to Blk 2 Lot 7 see T-107 under My requests

  Scenario: Billing requests reach the treasurer (decision 3)
    Given Bea files T-108 under Billing
    When the treasurer opens Requests & Complaints
    Then T-108 is listed for them

  Scenario: No requests yet
    Given Bea's household has filed nothing
    Then My requests reads "No requests yet. Report a problem and follow its progress here." with "New request"

  Scenario: Too many requests in a day
    Given Blk 6 Lot 9 has filed 10 requests today
    When Bea submits another
    Then she sees "Your household has sent 10 requests today. Please call the admin office if this can't wait."

  Scenario: Readable on a phone
    Given a screen 375 px wide
    Then the form is one column with "Submit request" at the bottom
    And My requests shows each request as a card with number, subject, status and last update
    And the page does not scroll sideways

  Scenario: A person not linked to a household can't file
    Given a signed-in person with no household link (REQ-004)
    When they open the New request address directly
    Then they see the "ask the admin office for your invite code" screen
    And their device's request to create a request is refused
```

## Data changes

| Field | Where | Rule | Written by | Read by |
|---|---|---|---|---|
| Request | `tickets/{id}`: `number` (T-105), `householdId`, `category`, `subject` (≤ 80), `details` (≤ 2,000), `photoPaths` (≤ 3), `status` (`Open` / `In Progress` / `Resolved` / `Withdrawn`), `assignee`, `filedBy` (uid), `loggedByStaff` (uid or null), `channel` (`portal` / `phone` / `walk-in`), `createdAt`, `updatedAt`, `lastStaffReplyAt` | Created only in status `Open`; homeowners can't set status past `Open` except `Withdrawn` while `Open`; fields from a closed list (SA-001 §8.1) | Household member (rules) or staff on behalf | That household, admin office; Billing also treasurer |
| Request number | `counters/ticket` | Sequential, unique | Function (callable or trigger, Sol Arch) | Everyone who sees the request |
| Timeline entry | `tickets/{id}/updates/{id}`: `at`, `by` (uid), `byRole`, `text`, `visibility` (REQ-027) | Append-only | Filer, household members, staff | As above |
| Photos | Storage `tickets/{ticketId}/{file}` | Images only, resized on device to about 1000 px, ≤ 5 MB each, up to 3 | Filer or staff | Filer's household, admin office (and treasurer for Billing) |
| Daily limit | per household per day, 10 (Sol Arch to choose where) | Refuse the 11th | Function or rules | — |
| Emergency number | settings `guardhouseNumber` | Shown on the form | Admin office, in Settings | Form |

**BA note for Sol Arch.** The homeowner should see "T-105" straight after submitting. A trigger assigns the number after the write, so the screen would briefly show no number. A callable `fileRequest` that takes the number and creates the request in one transaction avoids that, and also carries the daily limit and the double-submit guard. Sol Arch to choose.

## UX/UI notes

- **Accessibility:** labelled fields; the category is a set of large radio buttons (not a small select) on phones; photo thumbnails have alt text "Photo 1 of 2" and a labelled remove button; errors announced.
- **Consistency:** reuses the mock-up's form, `details.tk` request cards, `.timeline` and pills (**Open** warn, **In Progress** info, **Resolved** ok; **Withdrawn** muted). Term **Request** from the glossary; "complaint" only in the page title "Requests & Complaints".
- **Mobile-first:** one column at 375 px; "Add photo" opens the camera with a choose-file fallback; Submit at the bottom within thumb reach.
- **States:** empty list; loading skeleton; submitting; submitted (with number); upload failure keeps the form; daily limit reached.
- **Forms:** inline validation on blur; the details field shows a hint "Where, what, and since when"; nothing typed is lost on an error; the form is a page, not a modal, so a stray tap can't close it.
- **Safe actions:** "Submitting…" disables the button; server guard (decision in the note above). Withdraw is confirmed and recorded on the timeline.
- **Stable layout:** the Security emergency message area is reserved so the form doesn't jump when the category changes.
- **Roles:** household members see their household's requests; admin office sees all; treasurer sees Billing; board and guards see none in R2. Rules enforce it.
- **Privacy (RA 10173):** neighbour complaints name or describe other households. Only the filer's household and the office (and treasurer for Billing) can read a request. Photos may show neighbours' property or people; the form says "Photos are seen only by your household and the admin office."

## Copy of record

| Where | Text |
|---|---|
| Page and button | My requests · New request |
| Form heading | Report a problem |
| Emergency | For emergencies, call the guardhouse at {number}. Requests are read during office hours. |
| Fields | Category · Subject · Details · Photos (optional) |
| Details hint | Where, what, and since when |
| Photo hint | Up to 3 photos. Photos are seen only by your household and the admin office. |
| Submit | Submit request (in flight: Submitting…) |
| Submitted | Request {T-105} submitted. The admin office will reply here. |
| Errors | Give your request a short title · Describe what happened, where, and since when · Choose a category · Attach a photo (JPG or PNG). · Up to 3 photos |
| Upload failed | Your request wasn't sent. Check your connection and try again. |
| Daily limit | Your household has sent 10 requests today. Please call the admin office if this can't wait. |
| First timeline entry | Request submitted. |
| Withdraw | Withdraw {T-105}? The admin office will see that you withdrew it. · Reason (optional) · Withdraw request |
| Withdrawn timeline | Withdrawn by {name}: {reason} |
| On behalf | Log a request for a household · Household · How it was reported: Phone · Walk-in |
| On behalf label | Logged by the admin office · Reported by {phone / walk-in} |
| Empty | No requests yet. Report a problem and follow its progress here. |
| Status pills | Open · In Progress · Resolved · Withdrawn |

## Out of scope

- Anonymous complaints (decision 2).
- Video attachments.
- Automatic routing to outside contractors and service-level timers (EPIC-008).
- Guard or board access to requests.
- Assigning, updating and resolving (REQ-027).

## Open questions

| Question | Who decides |
|---|---|
| Owner decisions, rows 1–6 | Owner |
| Are the six categories right? | Admin office (EPIC-008) |
| The guardhouse number and office hours to show | Admin office |
| Anonymous complaints later? | HOA board |
| How long are resolved requests and their photos kept? | Admin office, with the DPO |

## Sol Arch review

Not yet done. Questions for Sol Arch:

1. Callable `fileRequest` vs client write plus trigger (BA note above).
2. Rules for the treasurer reading Billing requests only.
3. Where the daily limit lives.
4. Size: S plus 0.5 day for logging on behalf.
