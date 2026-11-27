# HOA_APP: homeowners association portal (mock-up)

An interactive mock-up of a homeowners association (HOA) portal, with three views: **Homeowner**, **Admin** and **Guard**. It is a single HTML file with sample data, built to agree on scope and design before building the real app.

| File | What it is |
|---|---|
| `index.html` | Generic demo ("Greenfield Homes HOA") |
| `gentri-heights/index.html` | Branded version for The Gentri Heights Homeowners Association |
| `docs/backend-plan.md` | Remaining work to build the real app on Firebase, with estimates |

## How to open it

Download a file and open it in a browser (Chrome works best). It needs an internet connection to load the PDF and QR code tools. Use the role switch at the top (**Homeowner | Admin | Guard**) to move between views. Demo data is saved in your browser; **Admin → Settings → Reset demo data** starts over.

## What it covers

**Homeowner**
- Dashboard, announcements (banner, and a pop-up for important ones)
- Dues: statement of account, pay by QR code, upload the reference number and screenshot, payment history, official receipts
- Amenity booking: pool, function room, pickleball and basketball courts
- Vehicle registration
- Requests and complaints
- Guest passes: list guests and vehicles, get a QR code to send to guests
- Report requests: financial reports, certified statements, certificate of good standing, and other records

**Admin**
- Dashboard: operations, plus a board financial report with charts
- Approvals: payments, bookings, vehicles
- Homeowners, accounting (collections, expenses, fund summary)
- Collections and notices: monthly billing, reminders and demand letters
- Requests and complaints, report requests, visitor log, reports, announcements, settings

**Guard**
- Scan a guest pass QR code or enter its code, check the guest list, photograph each guest's ID, let guests in and out
- Every scan is recorded, including refused and fake passes

## Limits of the mock-up

- No backend: everything is stored in the browser, so roles only work together on the same device.
- PDF and file downloads only work when the page is published as a Claude artifact.
- QR scanning reads a photo of the QR code. The real app would use a live camera view.

See `docs/backend-plan.md` for what the real app needs.
