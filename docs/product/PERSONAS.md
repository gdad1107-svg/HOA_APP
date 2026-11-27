# Personas

Who uses the HOA portal, on what device, how often, and what they are trying to get done.

Revision 1 · Business Analyst · 2026-11-27 · Draft for owner review

**These are assumptions.** They come from the mock-up's three views and `docs/backend-plan.md`, not from talking to residents or officers. Before R1 is finalised, check each one with at least two real people in that role, and correct this page.

## Homeowner

- **Device:** their own phone, mostly Android, often on mobile data. Some use a laptop to download receipts and statements.
- **How often:** once or twice a month to pay dues; more often around bookings, guests and requests.
- **Trying to:** pay dues without visiting the office, get a receipt, know their balance, book the pool or function room, let guests in, report a problem.
- **Frustrations:** not knowing what they owe or whether a payment was received; office hours; being called by the guard about a guest they already told someone about.
- **Design for:** a 375 px screen, one hand, short sessions; plain wording; nothing that needs a table to read.

## Treasurer

- **Device:** a laptop at home or at the clubhouse; a phone for quick approvals.
- **How often:** daily during collection weeks (start and end of month), weekly otherwise. Usually a volunteer officer with another job.
- **Trying to:** match each QR payment to the collection account, issue receipts, chase overdue accounts, record expenses, and report figures to the board.
- **Frustrations:** screenshots that don't match the account; retyping figures into spreadsheets; disputes about whether someone paid.
- **Design for:** batch work (approve several payments in a row), figures that agree across pages, nothing irreversible without a reason and a record.

## Admin office staff

- **Device:** a desktop or laptop at the clubhouse office.
- **How often:** every working day.
- **Trying to:** keep the household list current, handle requests and complaints, approve vehicles and bookings, post announcements, answer record requests.
- **Frustrations:** requests arriving by text, chat and in person with no single list; residents asking for updates the office has already given.
- **Design for:** queues with counts, filters and search; clear next actions; no lost typing in dialogs.

## Board member

- **Device:** laptop or phone; often prints or projects reports.
- **How often:** monthly for board meetings; yearly for the general assembly.
- **Trying to:** understand collections, spending and the fund balance, and present them to members.
- **Frustrations:** figures that don't agree with each other; reports that take the treasurer days to prepare.
- **Design for:** read-only access, summaries before detail, downloadable PDF and CSV.

## Guard

- **Device:** a phone at the guardhouse, possibly shared between shifts (to confirm, see EPIC-013). Outdoors: glare, rain, sometimes weak signal.
- **How often:** all shift, dozens of checks a day.
- **Trying to:** decide in seconds whether to let a guest in, and record who came in and out.
- **Frustrations:** calling residents who don't answer; queues of cars at the gate; fake or screenshot-of-a-screenshot passes.
- **Design for:** large tap targets, a verdict that reads at a glance (colour plus words), as few taps as possible, and a fallback when the QR won't scan.

## Guest

- **Device:** their own phone. No account and no portal access.
- **Trying to:** get through the gate quickly with the pass the homeowner sent them by Messenger, Viber or SMS.
- **Design for:** a pass image that works offline, with the code printed under the QR.
