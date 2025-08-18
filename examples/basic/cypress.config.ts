// Basic Cypress config with CyNova integration
import { defineConfig } from 'cypress';
import { registerCyNova } from 'cynova';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      registerCyNova(on, config, {
        outputDir: 'reports',
        fileName: 'cynova-summary.json',
        generateHtml: true,
        htmlFileName: 'cynova-report.html',
      });
      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,ts,jsx,tsx}',
    supportFile: 'cypress/support/e2e.ts',
  },
});
