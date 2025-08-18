# CyNova

A modern Cypress reporting tool. CyNova provides:

- A Cypress plugin that captures run results and writes a compact JSON summary
- A lightweight web UI (bundled with Webpack) to visualize the summary
- TypeScript-first codebase with ESLint + Prettier
- GitHub Actions CI pipeline (lint, typecheck, test, build)

## Installation

Install CyNova in your Cypress project (as a dev dependency):

```bash
npm i -D cynova
```

## Quick Start (Cypress)

Register CyNova in your Cypress config (cypress.config.ts):

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

Run your Cypress tests as usual. After the run completes, a report summary will be written to `reports/cynova-summary.json` (configurable).

## License

MIT © CyNova Contributors