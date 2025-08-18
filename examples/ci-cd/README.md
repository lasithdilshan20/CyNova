# CyNova Example: CI/CD Pipeline (GitHub Actions)

This example shows how to run Cypress with CyNova in GitHub Actions and upload report artifacts.

## Files
- `github-actions.yml` – sample workflow you can adapt.

## What it does
- Runs Cypress on Ubuntu with a browser matrix (Chrome, Edge).
- Uploads the generated CyNova artifacts as build artifacts:
  - `reports/cynova-summary.json`
  - `reports/cynova-report.html`
  - `reports/cynova-history.json`

## Usage
1. Copy `examples/ci-cd/github-actions.yml` to `.github/workflows/e2e.yml` in your repo.
2. Ensure your project registers CyNova in `setupNodeEvents`.
3. Push to `main` or open a PR to trigger the workflow.

## Tips
- Add more browsers to the matrix if available.
- Store artifacts for PR review; a reviewer can download and open `cynova-report.html` locally.
- Consider running the report with live mode in a self-hosted environment for real-time dashboards.
