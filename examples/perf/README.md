# CyNova Example: Performance & Large Suites

Guidelines to exercise CyNova with large test suites and measure performance.

## Strategies
- Split tests across multiple specs and/or parallel CI shards.
- Prefer stable selectors and avoid unnecessary retries to keep timings meaningful.
- Enable videos/screenshots only where needed to reduce I/O.

## Generating Load
- Create multiple specs under `cypress/e2e/` (hundreds or thousands of tests) and run headless.
- Alternatively, programmatically generate synthetic tests via a loop.

## Measuring
- After the run, inspect `reports/cynova-summary.json`:
  - `totals.durationMs` – overall duration
  - `specs[].durationMs` – per spec duration
  - `specs[].tests[].wallClockDurationMs` – per test duration
- Use `reports/cynova-history.json` to compare across runs; the report visualizes duration trends and outliers.

## Tips
- Use Node 18+ and enough CPU/memory for parallelization.
- Consider disabling `generateHtml` in CI for ultra-large runs and generate HTML only for relevant PRs.
- Export CSV from the HTML (Export CSV button) to analyze durations offline.
