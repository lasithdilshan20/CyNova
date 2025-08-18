# Contributing to CyNova

Thanks for your interest in contributing!

## Development Setup
- Node.js 18+
- Install deps: `npm install`
- Useful scripts:
  - `npm run lint` – ESLint
  - `npm run typecheck` – TypeScript checks
  - `npm run test:all` – Vitest + Jest
  - `npm run build` – build plugin and web assets

## Pull Requests
1. Fork the repo, create a feature branch.
2. Add tests for new functionality and update docs as needed.
3. Ensure `npm run lint`, `npm run typecheck`, and `npm run test:all` are green.
4. Submit a PR with a clear description and rationale.

## Coding Guidelines
- TypeScript-first; prefer explicit types on public APIs.
- Keep changes minimal, cohesive, and well-tested.
- Follow the existing ESLint/Prettier config.
- Public API changes must include JSDoc and updates in `docs/`.

## Commit Messages
- Use clear, imperative messages.
- Reference issues if applicable (e.g., "Fixes #123").

## Release Process
- We follow Semantic Versioning.
- Changelog entries go to `docs/CHANGELOG.md`.

## Reporting Issues
- Use GitHub Issues. Include reproduction steps, expected vs actual behavior, and any logs or artifacts.
