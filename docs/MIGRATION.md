# Migrating from Mochawesome to CyNova

This guide helps you move from a Mochawesome-based workflow to CyNova.

## Why CyNova?
- Modern TypeScript Cypress plugin with rich data capture (console, network, media).
- Single-file HTML report with embedded assets and interactive UI (filters, charts, live updates).
- Historical analytics (flaky tests, trends, outliers, cross-browser) with `cynova-history.json`.

## Concept Mapping

| Mochawesome Concept          | CyNova Equivalent                      |
|-----------------------------|----------------------------------------|
| mochawesome.json            | cynova-summary.json (structured run)   |
| mochawesome-report/         | cynova-report.html (single file)       |
| Reporter configuration      | `registerCyNova(on, config, options)`  |
| Merging multiple reports    | Use cynova-history.json for trends     |
| Screenshots/videos          | `MediaRef` entries in `specs[].tests[]`|

## Steps

1. Remove Mochawesome reporter configuration from `cypress.config.*` (e.g. `reporter`, `reporterOptions`).
2. Install CyNova: `npm i -D cynova`
3. Register CyNova in `setupNodeEvents`:
   ```ts
   import { defineConfig } from 'cypress';
   import { registerCyNova } from 'cynova';

   export default defineConfig({
     e2e: {
       setupNodeEvents(on, config) {
         registerCyNova(on, config, {
           outputDir: 'reports',
           fileName: 'cynova-summary.json',
           generateHtml: true,
           htmlFileName: 'cynova-report.html',
         });
         return config;
       },
     },
   });
   ```
4. Update any CI artifacts collection to capture:
   - `reports/cynova-summary.json`
   - `reports/cynova-report.html` (if enabled)
   - Optionally `reports/cynova-history.json` across runs
5. If you previously depended on Mochawesome merging, consider:
   - Using CyNova’s `history` which aggregates per run.
   - Or run Cypress in parallel and use the single HTML per run per shard.

## Custom Theming
- Mochawesome allowed custom CSS. In CyNova, provide a `templatePath` to a custom `.hbs` and override CSS variables or styles.
- See `examples/custom-theme/` for a starter template.

## Known Differences
- CyNova focuses on a single-file HTML for portability; it doesn’t generate multi-file asset directories by default.
- Live reporting is optional (WebSocket), enabling real-time dashboards.

## Validation Checklist
- [ ] Cypress run completes without reporter errors.
- [ ] `reports/cynova-summary.json` exists and includes totals/specs/tests.
- [ ] `reports/cynova-report.html` opens locally and displays results.
- [ ] CI stores CyNova artifacts for PR review.
