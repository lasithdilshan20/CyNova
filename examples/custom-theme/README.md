# CyNova Example: Custom Theme

Use a custom Handlebars template to restyle the report while keeping features.

## Files
- `cynova-custom.hbs` – starter template that embeds CyNova CSS/JS and overrides CSS variables.

## Usage
1. Ensure your Cypress config registers CyNova with `templatePath` pointing to the custom `.hbs` file. See `examples/advanced/cypress.config.ts` for a reference.
2. Run Cypress and open the generated HTML report to see your theme applied.

## Tips
- Keep `{{{inlineCss}}}` and `{{{inlineJs}}}` in the `<style>`/`<script>` areas so features like filters and charts continue to work.
- Override CSS variables (see `src/web/report.css`) for a future-proof skin without changing markup.
