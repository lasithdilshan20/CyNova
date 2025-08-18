// Advanced Cypress config demonstrating CyNova live server + custom template
import path from 'path';
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
        templatePath: path.resolve(process.cwd(), 'examples', 'custom-theme', 'cynova-custom.hbs'),
        liveServer: { enabled: true, host: '127.0.0.1', port: 9777 },
      });
      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,ts,jsx,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
  },
});
