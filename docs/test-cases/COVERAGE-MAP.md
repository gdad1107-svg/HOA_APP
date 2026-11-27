# Coverage map

One row per scenario, one layer per row (plus at most one `Journey` row per critical flow).
A row with no test file is a **gap**; two rows proving the same thing at different layers is an
**overlap**. Layers: **Unit** (Vitest, Dev), **API** (emulator: rules and functions, QE),
**UI** (Playwright, QE), **Journey**, **Manual**.

The app is still the browser-only mock-up: it has no plain modules to unit-test and no backend,
so only the UI layer exists today. Everything below is UI by necessity, not by choice; each row
marked *(moves down)* belongs at a lower layer once the real app splits logic out of the page.

## Shape

| Layer | Tests | Notes |
|---|---|---|
| Unit | 0 | No modules yet (mock-up is one HTML file) |
| API | 0 | No backend yet |
| UI | 34 scenarios × 2 brands, plus 2 phone cases | `tests/specs/ui/` |

## Scenarios

| Scenario id | Scenario | Type | Layer | Test file::test name | Status |
|---|---|---|---|---|---|
| SMK-owner-nav | Homeowner nav lists the 8 screens in order | navigation | UI | smoke.spec.js::SMK-owner-nav | Automated |
| SMK-owner-* (8) | Each homeowner screen loads with a heading, no page error | happy | UI | smoke.spec.js::SMK-owner-&lt;view&gt; | Automated |
| SMK-admin-nav | Admin nav lists the 11 screens in order | navigation | UI | smoke.spec.js::SMK-admin-nav | Automated |
| SMK-admin-* (11) | Each admin screen loads with a heading, no page error | happy | UI | smoke.spec.js::SMK-admin-&lt;view&gt; | Automated |
| SMK-guard-nav | Guard nav lists the 3 screens in order | navigation | UI | smoke.spec.js::SMK-guard-nav | Automated |
| SMK-guard-* (3) | Each guard screen loads with a heading, no page error | happy | UI | smoke.spec.js::SMK-guard-&lt;view&gt; | Automated |
| NAV-01 | Opens as Homeowner on the dashboard | navigation | UI | navigation.spec.js::NAV-01 | Automated |
| NAV-02 | Role switch lands on that role's dashboard, relabels nav | navigation | UI | navigation.spec.js::NAV-02 | Automated |
| NAV-03 | Exactly one nav item carries aria-current | usability | UI | navigation.spec.js::NAV-03 | Automated |
| NAV-04 | Role and screen survive a reload | navigation | UI | navigation.spec.js::NAV-04 | Automated |
| NAV-05 | Important announcement pop-up on load; acknowledged once, gone for good | happy | UI | navigation.spec.js::NAV-05 | Automated |
| NAV-06 | Escape closes an open modal | usability | UI | navigation.spec.js::NAV-06 | Automated |
| NAV-07 | 375 px: nav behind the menu button; Escape closes it | usability | UI | navigation.spec.js::NAV-07 | **Failing: DEF-001** |
| NAV-08 | 375 px: choosing a screen from the menu navigates and closes it | navigation | UI | navigation.spec.js::NAV-08 | Automated (re-check after DEF-001) |
| VEH-J1 | Register vehicle → admin approves → homeowner sees sticker | happy | Journey | vehicle-registration.spec.js::VEH-J1 | Automated |
| VEH-02 | Rejected registration shows the admin's reason to the homeowner | happy | UI | vehicle-registration.spec.js::VEH-02 | Automated |
| VEH-03 | Pending registration withdrawn leaves the admin queue | happy | UI | vehicle-registration.spec.js::VEH-03 | Automated |
| VEH-04 | Register form refuses empty required fields | negative | UI *(moves down: validation → Unit)* | vehicle-registration.spec.js::VEH-04 | Automated |

## Gaps (no test yet)

Dues and payments (pay by QR → approve → official receipt Journey), amenity booking and its
conflict check, requests and complaints, guest pass → guard check-in Journey, report requests,
collections and notices, accounting, settings and Reset demo data.
