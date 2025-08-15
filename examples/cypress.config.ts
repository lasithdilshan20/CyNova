// Example Cypress config showing how to register CyNova
import { defineConfig } from 'cypress';
import { registerCyNova } from 'cynova';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      registerCyNova(on, config, { outputDir: 'reports', fileName: 'cynova-summary.json' });
      return config;
    },
    baseUrl: 'http://localhost:3000',
  },
});
