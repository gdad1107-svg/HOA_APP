# DEF-001 — No viewport meta tag, so phones never get the phone layout

**Status:** **Open**
**Severity:** **Major** — on a real phone the portal renders as a shrunken desktop page: no menu button, tiny text, pinch-zoom needed for every screen. Homeowners and guards are expected to use phones.

| Field | Value |
|---|---|
| App version / commit | HOA mock-up, `main` at `c079503` (no `APP_VERSION` in the mock-up) |
| Environment | Local static server (`npm run serve`), Chromium with phone emulation (Pixel 5, 375 × 812, `isMobile`) |
| Spec | `tests/specs/ui/navigation.spec.js` › NAV-07, project `mobile` |
| Date | 2026-11-27 |
| Reported by | QE |

## 1. Steps to reproduce
1. `npx playwright test navigation --project=mobile`
2. Or by hand: open `index.html` in Chrome DevTools device mode (any phone preset), reload.

## 2. Expected results
At phone width (≤ 640 px) the side nav collapses behind the ☰ menu button. The app's own CSS says so: `@media (max-width:640px){ … .menu-btn{display:grid} }` (`index.html` lines 78–80). The QE usability scope requires every screen to work at 375 px.

## 3. Actual results
```
Error: expect(locator).toBeVisible() failed
Locator:  locator('#top').locator('[data-act="menu"]')
Expected: visible
Received: hidden
  at tests/specs/ui/navigation.spec.js:72
```
Measured on the same page, same 375 px screen:

| Context | Layout width (`innerWidth`) | Menu button shown |
|---|---|---|
| Phone (`isMobile`) | 981 px | no |
| Narrow desktop window | 375 px | yes |

## App or test suite?
**App.** Both `index.html` and `gentri-heights/index.html` lack `<meta name="viewport" content="width=device-width, initial-scale=1">`. Without it, mobile browsers lay the page out at a ~980 px virtual width, so no `max-width` media query below that ever matches. A desktop browser resized narrow does match, which is why it looks fine when checked by resizing a window.

## Root cause
Missing viewport meta tag in the page `<head>` of both builds.

## Resolution
Dev: add the viewport meta tag to both files. QE re-runs NAV-07 and NAV-08 under the `mobile` project to close.
