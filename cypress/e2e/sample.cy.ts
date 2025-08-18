// Sample Cypress spec to exercise CyNova reporter features

describe('CyNova Reporter E2E sample', () => {
  it('captures logs, network, screenshots and navigations', () => {
    cy.visit('https://example.cypress.io');

    // Emit a console log entry to CyNova via task
    cy.then(() => {
      const spec = (Cypress as any).spec?.relative || (Cypress as any).spec?.name || 'unknown';
      cy.task('cynova:console', { level: 'info', message: 'E2E: visit home', spec });
      cy.task('cynova:timeline', { type: 'custom', label: 'home:visited', spec });
    });

    // Simple interaction and screenshot
    cy.contains('type').click();
    cy.screenshot('after-click');

    // Intercept a request and send a network log to CyNova
    cy.intercept('GET', '**').as('any');
    cy.wait('@any').then((interception) => {
      const spec = (Cypress as any).spec?.relative || (Cypress as any).spec?.name || 'unknown';
      const req = interception.request;
      const res = interception.response || { statusCode: 0 };
      cy.task('cynova:network', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        atMillis: undefined,
        spec,
      });
    });

    // Final assertion to finish test
    cy.url().should('include', '/commands/actions');
  });
});
