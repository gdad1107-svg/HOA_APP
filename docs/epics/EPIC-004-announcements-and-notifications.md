# EPIC-004: Announcements and notifications

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R1, R2 |
| Stories | 11, 16, 17, 19 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Homeowner](../product/PERSONAS.md#homeowner), [Admin office staff](../product/PERSONAS.md#admin-office-staff) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

The HOA needs to reach every household with news, and homeowners need to hear when something about their own account changes without checking every page.

## Goal and success metrics

Every household gets the announcements and account updates that apply to them.

| Measure | Baseline | Proposed target |
|---|---|---|
| Households that press "Got it" on an important announcement within 7 days | not applicable | 70% |
| Emails that bounce | to measure after launch | under 5% of households |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- In-app notifications with an unread count
- Announcements shown as a banner
- Important announcements shown on sign-in, with a seen-by count
- Email for payment decisions, notices and ready records

## Out of scope

- SMS and phone push notifications
- Comments or replies on announcements
- Posting to the HOA’s Facebook group or group chats

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 11 | [In-app notifications](../backlog/BACKLOG.md#11-in-app-notifications) | Must | S | R1 | 02 |
| 16 | [Post an announcement](../backlog/BACKLOG.md#16-post-an-announcement) | Should | S | R1 | 02 |
| 17 | [Important announcement shown on sign-in](../backlog/BACKLOG.md#17-important-announcement-shown-on-sign-in) | Should | S | R1 | 16 |
| 19 | [Email for key events](../backlog/BACKLOG.md#19-email-for-key-events) *(not in mock-up)* | Should | M | R2 | 11 |

## Dependencies on other epics

- Story 02 Roles and permissions enforced on the server (Access and households)

## Risks

- Emails land in spam and residents miss notices. Mitigation: send from the HOA’s own domain; Sol Arch to confirm the mail service.
- A screen says "delivered" when the app only handed the email to the mail service. Mitigation: story 19 says "sent", never "delivered".

## Open questions

| Question | Who decides |
|---|---|
| Which email address and domain should emails come from? | HOA board |
| Is SMS wanted later? It is charged per message. | HOA board |

## Release slicing

Stories 11, 16 and 17 in R1. Story 19 (email) in R2, before notices are sent.
