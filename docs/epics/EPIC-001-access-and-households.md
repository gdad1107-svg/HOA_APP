# EPIC-001: Access and households

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R1 |
| Stories | 01, 02, 03, 04, 05, 06 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Homeowner](../product/PERSONAS.md#homeowner), [Admin office staff](../product/PERSONAS.md#admin-office-staff), [Treasurer](../product/PERSONAS.md#treasurer) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

The mock-up has no sign-in. A role switch and a "Viewing as" picker let anyone see every household’s balance and contact number. The real portal serves 623+ households, so each person has to be linked to their own lot, see only what their role allows, and agree to how the HOA uses their data (Data Privacy Act).

## Goal and success metrics

Every household can sign in, and each person sees only their own lot and the screens for their role.

| Measure | Baseline | Proposed target |
|---|---|---|
| Households linked to a signed-in account | 0 (portal not live) | 80% within 3 months of launch |
| Security rule tests where one household can read another’s data | not tested yet | 0 failures, run on every change |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Sign-in by email link or Google (D1)
- Roles: Homeowner, Treasurer, Admin office staff, Board member, Guard, checked by the server
- Adding, editing and importing households
- Invitations that link an account to a lot, and unlinking on sale
- Privacy notice and recorded consent
- An activity log nobody can edit

## Out of scope

- SMS login codes, unless the board picks them in D1
- Tenant accounts and owners with several lots, until D3 is decided
- Migrating historical bills and payments from the HOA’s current records (backend-plan.md excludes data migration)
- Single sign-on with any other system

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 01 | [Sign in to the portal](../backlog/BACKLOG.md#01-sign-in-to-the-portal) *(not in mock-up)* | Must | M | R1 | — |
| 02 | [Roles and permissions enforced on the server](../backlog/BACKLOG.md#02-roles-and-permissions-enforced-on-the-server) *(not in mock-up)* | Must | M | R1 | 01 |
| 03 | [Household directory: add, edit and import](../backlog/BACKLOG.md#03-household-directory-add-edit-and-import) *(not in mock-up)* | Must | M | R1 | 02 |
| 04 | [Invite a homeowner and link them to a lot](../backlog/BACKLOG.md#04-invite-a-homeowner-and-link-them-to-a-lot) *(not in mock-up)* | Must | S | R1 | 01, 03 |
| 05 | [Privacy notice and consent](../backlog/BACKLOG.md#05-privacy-notice-and-consent) *(not in mock-up)* | Must | S | R1 | 01 |
| 06 | [Activity log of money and record changes](../backlog/BACKLOG.md#06-activity-log-of-money-and-record-changes) *(not in mock-up)* | Must | S | R1 | 02 |

## Dependencies on other epics

- None. This epic can start first.

## Risks

- A household linked to the wrong person sees a neighbour’s balance and contact details. Mitigation: invitations go only to the email on the household record; unlinking is logged.
- Many households may have no email on file, which stalls invitations. Mitigation: find out how many before launch; the admin office can collect emails at the clubhouse.

## Open questions

| Question | Who decides |
|---|---|
| D1 Sign-in method | HOA board |
| D3 Several lots per owner; tenants | HOA board |
| D4 Who approves payments (sets the roles) | HOA board |
| Who keeps the master household list today, and in what format? | Admin office |
| How many households have no email address on file? | Admin office |

## Release slicing

Stories 01–04 first: one household can sign in and see only its own lot. Then 05 and 06 before anyone else is invited.
