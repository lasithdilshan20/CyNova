// Cypress support file
// - Adds a helper command to emit CyNova console logs
// - Optionally wires in visual regression if cypress-image-snapshot is installed

// Optional visual regression commands (no-op if package not installed)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('cypress-image-snapshot/command');
} catch {}

declare global {
  namespace Cypress {
    interface Chainable {
      cynovaConsole(level: 'log' | 'info' | 'warn' | 'error' | 'debug', message: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('cynovaConsole', (level: any, message: string) => {
  const spec = (Cypress as any).spec?.relative || (Cypress as any).spec?.name || 'unknown';
  cy.task('cynova:console', { level, message, spec });
});

// Take a screenshot upon failure to aid report media collection
afterEach(function () {
  // Mocha context has currentTest
  const failed = (this as any)?.currentTest?.state === 'failed';
  if (failed) {
    cy.screenshot('failed');
  }
});
