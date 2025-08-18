# CyNova Example: Multi-Browser Testing

Run Cypress with CyNova across multiple browsers to populate cross-browser analytics.

## CLI Examples

```bash
# Chrome
npx cypress run --browser chrome --config-file e2e/cypress.config.ts
# Edge
npx cypress run --browser edge --config-file e2e/cypress.config.ts
# Firefox (if installed)
npx cypress run --browser firefox --config-file e2e/cypress.config.ts
```

CyNova stores the `browser.name` in `cynova-history.json`, enabling the Browser Matrix chart.

## GitHub Actions Matrix (Example)
See `examples/ci-cd/github-actions.yml` for a browser matrix setup.
