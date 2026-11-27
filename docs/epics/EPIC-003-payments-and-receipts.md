# EPIC-003: Payments and receipts

| | |
|---|---|
| Status | **Draft for owner review** |
| Release | R1 |
| Stories | 10, 12, 13, 14 (full text and Gherkin in [BACKLOG.md](../backlog/BACKLOG.md)) |
| Personas | [Homeowner](../product/PERSONAS.md#homeowner), [Treasurer](../product/PERSONAS.md#treasurer) |
| Author / date | Business Analyst, 2026-11-27 |
| Revision | 1 |

## Problem

Homeowners pay by QR Ph and then have to prove it. The treasurer matches each reference number to the collection account and issues an official receipt. In the mock-up a payment can be submitted twice, a reference number can be reused, and an approval can’t be undone. backend-plan.md requires receipt numbers with no gaps.

## Goal and success metrics

Every QR payment is confirmed or rejected online, and every confirmed payment has an official receipt with a gap-free number.

| Measure | Baseline | Proposed target |
|---|---|---|
| Median working days from submission to approval | to measure before launch | 2 working days or less |
| Share of dues paid through the portal | 0 (portal not live) | 60% within 6 months |
| Receipt numbers skipped or repeated | not applicable | 0 |

No baseline has been measured with the HOA yet. Targets are proposals for the owner to accept or change.

## In scope

- Submitting a QR payment with reference number and screenshot
- Approving or rejecting with a reason; two admins can’t approve the same payment
- Official receipt PDF, overpayments shown as credit
- Voiding an approved payment without reusing its receipt number

## Out of scope

- Automatic payment confirmation through a payment gateway
- Refunds of credits as cash
- Cash or cheque payments at the office: see the open question below

## Stories, in delivery order

| # | Story | Priority | Size | Release | Needs |
|---|---|---|---|---|---|
| 10 | [Submit a QR payment for approval](../backlog/BACKLOG.md#10-submit-a-qr-payment-for-approval) | Must | M | R1 | 07, 09 |
| 12 | [Approve or reject a payment](../backlog/BACKLOG.md#12-approve-or-reject-a-payment) | Must | L | R1 | 06, 10, 11 |
| 13 | [Official receipt PDF](../backlog/BACKLOG.md#13-official-receipt-pdf) | Must | M | R1 | 12 |
| 14 | [Void an approved payment](../backlog/BACKLOG.md#14-void-an-approved-payment) *(not in mock-up)* | Should | M | R1 | 12, 13 |

## Dependencies on other epics

- Story 06 Activity log of money and record changes (Access and households)
- Story 07 Dues rate and QR payment settings (Billing and statement)
- Story 09 Statement of account (Billing and statement)
- Story 11 In-app notifications (Announcements and notifications)

## Risks

- A fake or edited screenshot. Mitigation: the treasurer approves only after matching the reference number in the collection account; the screenshot alone is never proof.
- Receipt numbers with gaps fail a BIR review if D5 requires the BIR format. Mitigation: numbers are issued by a Cloud Function, never by the browser.

## Open questions

| Question | Who decides |
|---|---|
| D4 Treasurer only, or treasurer plus board | HOA board |
| D5 BIR receipt format | HOA board |
| Do some households pay cash or cheque at the office? If so, the treasurer needs a story to record an office payment. | Treasurer |

## Release slicing

Stories 10, 12 and 13: pay, approve, receipt. Story 14 (void) follows in the same release so mistakes can be corrected from day one.
