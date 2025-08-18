import { defineConfig } from 'cypress';
// In this monorepo, we import from source for convenience. In real projects use: import { registerCyNova } from 'cynova'
import { registerCyNova } from '../src/plugin';

export default defineConfig({
  e2e: {
    baseUrl: 'https://example.cypress.io',
    setupNodeEvents(on, config) {
      registerCyNova(on, config, {
        outputDir: 'reports',
        fileName: 'cynova-summary.json',
        // liveServer: { enabled: true }, // enable if you want live updates
      });
      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,ts,jsx,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
  },
});
