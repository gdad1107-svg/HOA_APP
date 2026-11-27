# Backend plan (Firebase)

Hosting on Firebase Hosting, data in Firestore, sign-in with Firebase Authentication, server logic in Cloud Functions. Excludes data migration and onboarding of users.

## Why a backend is still needed

Security rules alone can't safely handle: gap-free official receipt numbers, approving payments, scheduled monthly billing, sending email, generating official documents, and keeping report totals. These go in Cloud Functions.

## Tasks and estimates (person-days)

| Area | Traditional | With Claude Code |
|---|---|---|
| A. Foundation: projects, data model, emulator, deploy pipeline | 5–8 | 2–3 |
| B. Sign-in, roles, household linking, security rules and tests | 6–9 | 4–6 |
| C. Billing and payments: scheduled billing, balances, approvals, receipt numbers, receipt PDFs, voids | 12–18 | 7–10 |
| D. Amenities: slots, conflict-safe booking, approvals | 5–7 | 2–3 |
| E. Vehicles, requests and complaints, report requests | 6–9 | 2–4 |
| F. Collections and notices: aging, escalation, letter PDFs, email | 5–7 | 2–3 |
| G. Accounting and reports: expenses, monthly totals, reports, closing months | 8–12 | 4–6 |
| H. Communications: in-app notifications, email, announcements | 4–6 | 1.5–3 |
| I. Security, privacy (Data Privacy Act), backups, monitoring | 5–8 | 3–5 |
| J. Connecting the frontend to the backend | 12–18 | 4–7 |
| K. Testing and release | 10–15 | 7–10 |
| **Total** | **78–117** | **~40–60** |
| Guest passes and guard app (live camera scanning, ID photo storage and deletion) | — | +6–10 |

## Running cost (623+ households)

Roughly **$0–15 a month** on Firebase's pay-as-you-go plan: most usage stays within the free allowances. Watch for: SMS login codes (charged per message; prefer email or Google sign-in), and reports that recalculate from every record (keep running totals instead). Check current Firestore rates for the chosen region before quoting.

## Decisions needed from the client

- Late penalty or interest rules
- Owners with several lots; tenant accounts
- Who approves what (treasurer only, or treasurer plus board)
- Whether official receipts must follow the BIR format
- Whether the board financial report is entered by hand or calculated from transactions
