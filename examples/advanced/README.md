# CyNova Example: Advanced (Live + Custom Template)

This example demonstrates enabling CyNova's live WebSocket server and using a custom Handlebars template.

## Steps

1. Install dev dependencies in your project:
   ```bash
   npm i -D cynova cypress ws
   ```
2. Copy `examples/advanced/cypress.config.ts` and `examples/custom-theme/cynova-custom.hbs` into your repo (adjust paths if needed).
3. Run Cypress headless:
   ```bash
   npx cypress run --config-file cypress.config.ts
   ```
4. Open the generated report with live query parameters while the run is ongoing or for a subsequent run:
   ```
   reports/cynova-report.html?live=1&host=127.0.0.1&port=9777
   ```

Notes:
- Live server uses the optional `ws` package; if not installed, CyNova will log a warning and fall back to a noop server.
- The custom template shows how to override CSS variables and structure while keeping embedded CSS/JS via `{{{inlineCss}}}` and `{{{inlineJs}}}`.
