# HOA portal: UI automation (Playwright, Page Object Model)

This is the **UI layer** of the testing pyramid (see `.claude/agents/qe.md`). Unit (Vitest) and
API (emulator) layers arrive with the real app. Every scenario is placed in
`docs/test-cases/COVERAGE-MAP.md` at the lowest layer that can prove it.

## Run it

```powershell
npm install
npx playwright install chromium      # once per machine
npm run test:ui                      # everything: both brands + phone cases
npm run test:smoke                   # @smoke only
npx playwright test vehicle-registration --project=greenfield
npm run test:report                  # open the last HTML report
```

Playwright starts the static server itself (`scripts/serve.mjs`, `http://127.0.0.1:4173`).
To look at the app by hand: `npm run serve`.

## Layout

```
playwright.config.js        projects: greenfield (/), gentri-heights (/gentri-heights/), mobile (@mobile only)
scripts/serve.mjs           zero-dependency static server, loopback only
tests/
  support/
    environment-guard.js    assertTestEnvironment(): verbatim from the QE definition
    network-tripwire.js     aborts and fails on any request off the allow-list
    console-watch.js        page errors and console.error, asserted empty
  components/               pieces shared by every screen
    app-shell.js            header role switch, side nav, menu, #main
    modal.js                the single #modal host
    confirm-dialog.js       confirmBox(): Cancel / data-act="confirmOk"
    toasts.js               #toasts
  pages/
    base-page.js            owns the components; every page object extends it
    portal-page.js          opens the build, waits for boot, hands out role portals
    role-portal.js          VIEWS list + goTo(view)
    owner/  admin/  guard/  one portal per role, plus one page object per screen
  fixtures/test.js          import { test, expect } from here, never from @playwright/test
  data/test-data.js         disposable "Automation " records
  specs/ui/                 the specs
```

## How it fits together

```js
const { test, expect } = require('../../fixtures/test');

test('…', async ({ portal }) => {
  const vehicles = await (await portal.asOwner()).vehicles();   // role → screen
  await vehicles.register({ plate: 'ZZA 0001', make: 'Automation Vios', color: 'White' });
  await expect(vehicles.statusOf('ZZA 0001')).toHaveText('Pending approval');
});
```

- Fixtures: `portal` (opened, booted, sign-in pop-up acknowledged), and `owner`, `admin`,
  `guard` for a single-role test. `appPath` comes from the project, so one spec runs on both brands.
- **Specs never hold a selector.** They call page-object methods (intents) and assert on
  locators the page object exposes.
- A page object method that completes an action also waits for its outcome (a toast, the row
  appearing or leaving), so specs stay free of waits.

## Rules this framework enforces

| Rule | Where |
|---|---|
| Write-capable specs run on loopback only | `assertTestEnvironment` in each such spec's `beforeAll` |
| No real email, SMS or payment leaves the browser | `network-tripwire.js` (auto fixture; fails the test) |
| No halting console error | `console-watch.js` (auto fixture; opt out per test with `allowConsoleErrors`) |
| Fresh, known state per test | every test gets a new browser context, so the app re-seeds its demo data |
| One spec, two brands | projects `greenfield` and `gentri-heights`; never assert brand text |
| Concurrency declared | every spec's `// Concurrency:` header line |

Fresh contexts make every spec **parallel-safe** today. That changes when the real backend
arrives: then specs seed their own prefixed data on the emulator, per the QE definition.

## Locators

Order of preference: the app's `data-act` / `data-view` / `data-role` / `data-form` / `data-g` +
`data-t` hooks → stable ids (`#vPlate`, `#rejReason`) → `getByRole` with a name → rows by text.
Grep `index.html` for the real hook before writing one. Never select on styling classes or brand text.

**Locator contract asked of Dev** (not blocking; the mock-up's hooks suffice today):
1. Expose `APP_VERSION` in the footer, so smoke can confirm the build under test.
2. Add `data-id` to each vehicle card and each approval row (`approveVeh` buttons have it; the row does not).
3. A `data-testid` on each screen's `<h1>` (`screen-<view>`), so smoke can assert the heading belongs to that screen.

## Adding a screen

1. Add a page object under `pages/<role>/`, extending `BasePage`; locators in the constructor, intents as methods.
2. Add an accessor on the role portal (`async dues() { await this.goTo('dues'); return new OwnerDuesPage(this.page); }`).
3. Write the spec header first (what, version, writes and safety, accommodations, run command, `// Concurrency:`).
4. Add the scenario rows to `docs/test-cases/COVERAGE-MAP.md`. Unit or API first; UI only if neither can prove it.
5. Run it twice in a row.

## Known open defects affecting the suite

- **DEF-001**: no viewport meta tag; NAV-07 fails under the `mobile` project until it is fixed. It is left failing on purpose.
