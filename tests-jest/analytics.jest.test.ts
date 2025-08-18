import fs from 'fs';
import path from 'path';
import { registerCyNova } from '../src/plugin';

describe('Jest: analytics computation and history', () => {
  const tmpDir = path.resolve(process.cwd(), '.tmp', 'jest-analytics');

  beforeAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('flaky detection persists across runs', () => {
    let afterRun: ((results: any) => void) | undefined;
    const on = (event: string, handler: any) => { if (event === 'after:run') afterRun = handler; };

    registerCyNova(on as any, {}, { outputDir: path.relative(process.cwd(), tmpDir), fileName: 'sum.json', generateHtml: false });

    const spec = { relative: 'cypress/e2e/ana.cy.ts', absolute: 'C:/project/cypress/e2e/ana.cy.ts' };
    const base = {
      title: ['suite', 'flaky'],
      testId: 't1',
      attempts: [{ attempt: 0, duration: 50, startedAt: new Date().toISOString(), screenshots: [] }],
    };

    // Run 1 passed
    afterRun?.({ projectRoot: process.cwd(), cypressVersion: '13.5.0', totalTests: 1, totalPassed: 1, totalFailed: 0, totalPending: 0, totalSkipped: 0, totalDuration: 60, runs: [ { spec, stats: { wallClockDuration: 60 }, tests: [ { ...base, state: 'passed' } ], screenshots: [] } ] });
    // Run 2 failed
    afterRun?.({ projectRoot: process.cwd(), cypressVersion: '13.5.0', totalTests: 1, totalPassed: 0, totalFailed: 1, totalPending: 0, totalSkipped: 0, totalDuration: 70, runs: [ { spec, stats: { wallClockDuration: 70 }, tests: [ { ...base, state: 'failed' } ], screenshots: [] } ] });

    const sumPath = path.join(tmpDir, 'sum.json');
    expect(fs.existsSync(sumPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(sumPath, 'utf-8'));
    expect(summary.analytics).toBeDefined();
    const flaky = (summary.analytics.flakyTests || []).find((f: any) => f.testId === 't1' && f.specRelative === spec.relative);
    expect(flaky).toBeTruthy();

    const histPath = path.join(tmpDir, 'cynova-history.json');
    expect(fs.existsSync(histPath)).toBe(true);
    const hist = JSON.parse(fs.readFileSync(histPath, 'utf-8'));
    expect(Array.isArray(hist.runs)).toBe(true);
    expect(hist.runs.length).toBeGreaterThanOrEqual(2);
  });
});
