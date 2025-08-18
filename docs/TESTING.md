# CyNova Testing Guide

This repo uses both Vitest and Jest for unit/integration tests, and ships a Cypress E2E scaffold to validate live behavior and reporter output.

## Unit tests

- Vitest tests live in `tests/` and run with:
  - `npm test` (Vitest) or `npm run test:watch`
- Jest tests live in `tests-jest/` and run with:
  - `npm run test:jest`
- To run both suites:
  - `npm run test:all`

### What is covered
- Plugin event handlers and tasks (Jest + Vitest)
- Report HTML generation including Handlebars fallback (Jest)
- Analytics engine: flaky detection, history persistence, trend series (Jest)
- Edge cases: missing runs/specs, failed file writes (Jest)
- Large suite smoke: HTML generation for thousands of tests (Jest)

## Cypress End-to-End (E2E)

A sample Cypress setup is provided to exercise the reporter during real browser runs.

- Config: `e2e/cypress.config.ts`
- Specs: `cypress/e2e/`
- Support: `cypress/support/e2e.ts`

Run locally:

```bash
# open interactive runner
npm run test:e2e:open
# or run headless
npm run test:e2e
```

The config registers CyNova so runs will produce:
- `reports/cynova-summary.json`
- Optionally `reports/cynova-report.html` (if `generateHtml` is true in your project)

### Visual regression of report layouts

Two recommended options:
1. Cypress Image Snapshot
   - Install: `npm i -D cypress-image-snapshot`
   - Our support file attempts to import its commands if present.
   - Add snapshot assertions to a spec that navigates to your report page hosted by a static server, for example:
     ```js
     // serve the folder with your HTML file, e.g. npx http-server reports
     cy.visit('http://127.0.0.1:8080/cynova-report.html');
     cy.matchImageSnapshot('cynova-report');
     ```
2. Hosted services (Percy/Applitools)
   - Point them to `cynova-report.html` served from a static server.

### Performance benchmarks for large suites

- You can simulate a large number of tests by generating synthetic runs or running parallel Cypress specs.
- The Jest test `tests-jest/report.jest.test.ts` includes a large suite HTML generation smoke case.
- For browser-level measurement, run Cypress with many specs and measure total duration from the generated summary file `totals.durationMs`.

### Cross-browser compatibility

Run Cypress across multiple browsers installed locally:

```bash
# Chrome
npx cypress run --browser chrome --config-file e2e/cypress.config.ts
# Edge
npx cypress run --browser edge --config-file e2e/cypress.config.ts
# Firefox (if installed)
npx cypress run --browser firefox --config-file e2e/cypress.config.ts
```

CyNova history stores the browser name so the report can show cross-browser analytics.

### Live updates

Enable the live WebSocket server and connect the report for real-time progress:
- In `registerCyNova` options: `{ liveServer: { enabled: true } }`
- Open your HTML with `?live=1` (and optional `host`/`port`) query params.

## Notes
- The E2E suite is not enabled in CI by default due to browser/OS dependencies; it is designed for local validation and can be enabled per project as needed.
