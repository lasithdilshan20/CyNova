# CyNova Example: Basic

This example shows a minimal Cypress setup with CyNova enabled.

## Steps

1. Install dev dependencies in your project:
   ```bash
   npm i -D cynova cypress
   ```
2. Copy `examples/basic/cypress.config.ts` into your project root and adjust paths if needed.
3. Run Cypress:
   ```bash
   npx cypress run --config-file cypress.config.ts
   ```
4. After the run, check `reports/cynova-summary.json` and `reports/cynova-report.html`.
