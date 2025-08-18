# CyNova API Documentation

This document describes the public APIs and configuration options exposed by CyNova.

## Installation

```
npm i -D cynova
```

## Usage (Cypress config)

Register CyNova inside `setupNodeEvents`:

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
        // templatePath: path.resolve(__dirname, 'cynova-custom.hbs'),
        // liveServer: { enabled: true, host: '127.0.0.1', port: 9777 },
      });
      return config;
    },
  },
});
```

## Configuration Options

Type: `CyNovaOptions`

- outputDir?: string
  - Directory (relative to `process.cwd()`) where report files will be written. Default: `"reports"`.
- fileName?: string
  - Summary JSON file name. Default: `"cynova-summary.json"`.
- generateHtml?: boolean
  - Generate a single-file HTML report with embedded CSS/JS after JSON is written. Default: `true`.
- htmlFileName?: string
  - HTML file name when `generateHtml` is enabled. Default: `"cynova-report.html"`.
- templatePath?: string
  - Absolute path to a custom Handlebars template (`.hbs`). If not set, CyNova uses `src/web/report.hbs` when available; otherwise a minimal fallback is used.
- liveServer?: { enabled?: boolean; host?: string; port?: number }
  - Start a lightweight WebSocket server to stream live events during the run. Default host: `127.0.0.1`, port: `9777`.

## Tasks (from Cypress tests)

CyNova exposes `cy.task` channels to collect logs and timeline data from browser tests. You can call these safely from your specs.

- `cynova:console`: capture application console messages.
  - Payload: `{ level: 'log'|'info'|'warn'|'error'|'debug', message: string, spec?: string, testId?: string, atMillis?: number, ... }`
- `cynova:network`: capture network activity.
  - Payload: `{ method?: string, url?: string, status?: number, durationMs?: number, requestHeaders?: Record<string,string>, responseHeaders?: Record<string,string>, requestBody?: any, responseBody?: any, spec?: string, testId?: string, atMillis?: number }`
- `cynova:timeline`: append custom timeline markers.
  - Payload: `{ type?: 'custom'|string, label?: string, details?: any, spec?: string, atMillis?: number }`

Example usage in a spec:

```ts
cy.then(() => {
  const spec = (Cypress as any).spec?.relative || 'unknown';
  cy.task('cynova:console', { level: 'info', message: 'navigated', spec });
  cy.task('cynova:timeline', { type: 'custom', label: 'checkpoint', spec });
});
```

## Output Files

- Summary JSON: `${outputDir}/${fileName}` – typed as `CyNovaRun`.
  - Includes totals, specs/tests, media references, console/network logs, and a millisecond-precision timeline.
  - Also includes `analytics` computed from history (flaky tests, duration outliers, trends, cross-browser, etc.).
- History JSON: `${outputDir}/cynova-history.json` – rolling history for analytics/trends.
- Optional HTML: `${outputDir}/${htmlFileName}` – self-contained report. Open with a browser.

## Data Types (selected)

- `CyNovaRun`: full run payload (see `src/plugin/types.ts`).
- `SpecResult`: per-spec details with tests, media, and logs.
- `TimelineEvent`: run/spec/test timeline events with `atMillis` offsets.
- `CyNovaAnalytics`: computed insights (flaky tests, outliers, trends, cross-browser, dependencies, screenshot diffs if supported).

## Live Mode (real-time)

Enable the live WebSocket server via options. Then open the report with `?live=1` query to connect:

```
reports/cynova-report.html?live=1&host=127.0.0.1&port=9777
```

The UI will update KPIs and show a LIVE badge with event counts as the run progresses.

## HTML Templating & Theming

CyNova uses Handlebars for the default template. You can:
- Provide a `templatePath` to your custom `.hbs` file.
- Keep `{{{inlineCss}}}` and `{{{inlineJs}}}` placeholders to embed CyNova's default CSS/JS. You can override CSS variables afterward to implement custom themes.

Example (custom template excerpt):

```hbs
<style>
  {{{inlineCss}}}
  :root { --primary: #ff00aa; --pass: #00d1b2; }
</style>
```

## Programmatic HTML generation

While CyNova triggers HTML automatically after a run, you can also call:

```ts
import { generateHtmlReport } from 'cynova/dist/plugin/report';
// or from source in this repo: import { generateHtmlReport } from './src/plugin/report';

const htmlPath = generateHtmlReport(run, { outputDir: 'reports', htmlFileName: 'custom.html', templatePath });
```

## Environment Flags

- `CYNOVA_FORCE_FALLBACK=1` – force minimal HTML fallback (useful for tests or environments without Handlebars).

## Node/Browser Support

- Node 18+ (required by engines field)
- Cypress 13+
- Chart.js (bundled inlining). If not present, CyNova uses a tiny stub to avoid runtime errors.
- WebSocket server uses the optional `ws` package for live mode; if not installed, CyNova falls back gracefully.
