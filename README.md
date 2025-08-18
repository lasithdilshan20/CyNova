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

## Web Report

CyNova ships a tiny web UI that reads the summary JSON and displays it.

- Build the UI:

```bash
npm run build:web
```

- Open `dist/web/index.html` in your browser.
- Place your `cynova-summary.json` next to `index.html` (same folder) to see the data rendered.

Alternatively, use the dev server during development:

```bash
npm run dev:web
```

## Scripts

- `npm run build` – builds the plugin (Node) and the web bundle
- `npm run build:node` – builds the Node plugin (TypeScript -> dist/plugin)
- `npm run build:web` – bundles the web UI (Webpack -> dist/web)
- `npm run dev:web` – runs the Webpack dev server for the report UI
- `npm run lint` – ESLint (flat config)
- `npm run format` – Prettier
- `npm run typecheck` – TypeScript checks for Node and Web targets
- `npm run test` – runs Vitest test suite

## Project Structure

```
Cynova/
├─ src/
│  ├─ plugin/
│  │  └─ index.ts         # Cypress plugin entry (Node)
│  └─ web/
│     ├─ index.html       # Web UI template (for Webpack)
│     └─ index.ts         # Web UI entry (browser)
├─ tests/
│  └─ registerCyNova.test.ts
├─ examples/
│  └─ cypress.config.ts   # Example integration with Cypress
├─ docs/
│  └─ README.md
├─ .github/
│  └─ workflows/
│     └─ ci.yml           # GitHub Actions: lint, typecheck, test, build
├─ tsconfig.json          # Project references (node, web)
├─ tsconfig.node.json     # TS config for Node plugin
├─ tsconfig.web.json      # TS config for web UI
├─ webpack.config.js      # Webpack config for the UI
├─ eslint.config.js       # ESLint flat config
├─ .prettierrc            # Prettier config
├─ package.json
└─ README.md              # This file
```

## Continuous Integration

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on pushes/PRs to main/master and performs:
- Install dependencies
- Lint
- Typecheck (Node + Web TS configs)
- Test (Vitest)
- Build (plugin + web)

## Contributing

- Use Node 18+.
- Run `npm run lint` and `npm run test` before opening a PR.

## License

MIT © CyNova Contributors

## Documentation

- API Reference: docs/API.md
- Migration from Mochawesome: docs/MIGRATION.md
- Troubleshooting & FAQ: docs/TROUBLESHOOTING.md
- Contributing Guidelines: docs/CONTRIBUTING.md
- Changelog: docs/CHANGELOG.md

## Examples

Explore example setups under examples/:

- Basic: examples/basic
  - Minimal Cypress integration with default settings.
- Advanced: examples/advanced
  - Live updates via WebSocket and a custom Handlebars template.
- Custom Theme: examples/custom-theme
  - Starter custom template (cynova-custom.hbs) with CSS variable overrides.
- CI/CD Pipeline: examples/ci-cd
  - Sample GitHub Actions workflow to run Cypress and upload CyNova artifacts.
- Multi-browser: examples/multi-browser
  - Commands and GA matrix snippet for running across Chrome/Edge/Firefox.
- Performance: examples/perf
  - Tips and scripts for large suites and benchmarking.

Open each folder’s README for instructions.
