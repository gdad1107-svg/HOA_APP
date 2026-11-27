# EPIC-011: Records and certificates

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R3 |
| Stories | 36, 37, 38 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Homeowner](../product/PERSONAS.md#homeowner), [Admin office staff](../product/PERSONAS.md#admin-office-staff) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

Homeowners selling a lot or applying for a loan need a certificate of good standing, and members may ask for the association’s records under R.A. 9904. Requests today are made in person and tracked informally.

## Goal and success metrics

Every request is answered by its expected date, and certificates are only issued to accounts in good standing.

| Measure | Baseline | Proposed target |
|---|---|---|
| Requests fulfilled or declined by the expected date | to measure after launch | 90% |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Requesting a record or certificate, with purpose and delivery choice
- Generating it from portal data, uploading a file, or declining with a reason
- Numbered certificate of good standing, valid 30 days

## Out of scope

- Electronic signatures and notarisation
- Charging fees for certificates: see the open question below

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 36 | [Request a record or certificate](../backlog/BACKLOG.md#36-request-a-record-or-certificate) | Should | S | R3 | 01, 11 |
| 37 | [Fulfil or decline a record request](../backlog/BACKLOG.md#37-fulfil-or-decline-a-record-request) | Should | M | R3 | 36, 09, 35 |
| 38 | [Certificate of good standing](../backlog/BACKLOG.md#38-certificate-of-good-standing) | Should | S | R3 | 37, 18 |

## Dependencies on other epics

- Story 01 Sign in to the portal (Access and households)
- Story 09 Statement of account (Billing and statement)
- Story 11 In-app notifications (Announcements and notifications)
- Story 18 Delinquent accounts list (Collections and notices)
- Story 35 Standard reports with CSV download (Admin dashboard and reports)

## Risks

- Releasing a record the HOA should not release, or refusing one it must release. Mitigation: counsel confirms the list of record types before launch.
- A forged certificate. Mitigation (later story): a verification page where a bank can check a certificate number.

## Open questions

| Question | Who decides |
|---|---|
| Which records must members be given under R.A. 9904, and which are withheld? | HOA board with counsel |
| Is there a fee for a certificate of good standing? | HOA board |
| Who signs certificates (treasurer and president?) | HOA board |

## Release slicing

Stories 36 and 37 ship together. Story 38 straight after, since clearances are the most-requested item in the mock-up’s sample data.
