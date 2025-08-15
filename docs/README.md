# CyNova Documentation

CyNova is a modern Cypress reporting tool. It consists of:

- A Cypress plugin that listens to the `after:run` event and writes a summary JSON.
- A lightweight web UI that displays the summary JSON.

## Plugin

Register CyNova in your `cypress.config.ts`:

```ts
import { defineConfig } from 'cypress';
import { registerCyNova } from 'cynova';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      registerCyNova(on, config, { outputDir: 'reports', fileName: 'cynova-summary.json' });
      return config;
    },
  },
});
```

## Web Report

Build the web assets and open `dist/web/index.html`. Place your `cynova-summary.json` next to it or serve both files together.

```bash
npm run build:web
# then open dist/web/index.html
```

## Development

- `npm run build` – build plugin (Node) and web bundle
- `npm run dev:web` – start webpack dev server for the report UI
- `npm run typecheck` – TypeScript check for all references
- `npm run lint` – ESLint
- `npm run test` – Vitest
