import fs from 'fs';
import path from 'path';

export interface CyNovaOptions {
  /** Directory where the summary JSON will be written (relative to process.cwd()). */
  outputDir?: string;
  /** File name for the summary JSON. */
  fileName?: string;
}

/**
 * Register CyNova in Cypress's setupNodeEvents hook.
 * Example (cypress.config.ts):
 *   import { defineConfig } from 'cypress';
 *   import { registerCyNova } from 'cynova';
 *   export default defineConfig({
 *     e2e: {
 *       setupNodeEvents(on, config) {
 *         registerCyNova(on, config, { outputDir: 'reports' });
 *         return config;
 *       },
 *     },
 *   });
 */
export function registerCyNova(on: any, config: any, options: CyNovaOptions = {}) {
  const outputDir = options.outputDir ?? 'reports';
  const fileName = options.fileName ?? 'cynova-summary.json';

  on('after:run', (results: any) => {
    try {
      const summary = {
        tool: 'CyNova',
        version: '0.1.0',
        generatedAt: new Date().toISOString(),
        totals: {
          tests: results?.totalTests ?? 0,
          passed: results?.totalPassed ?? 0,
          failed: results?.totalFailed ?? 0,
          pending: results?.totalPending ?? 0,
          skipped: results?.totalSkipped ?? 0,
          durationMs: results?.totalDuration ?? 0,
        },
      };

      const dir = path.resolve(process.cwd(), outputDir);
      fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), 'utf-8');
      // eslint-disable-next-line no-console
      console.log(`[CyNova] Wrote summary to ${filePath}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[CyNova] Failed to write summary:', err);
    }
  });

  return config;
}
