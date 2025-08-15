import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { registerCyNova } from '../src/plugin';

const tmpDir = path.resolve(process.cwd(), '.tmp', 'vitest-analytics');

describe('CyNova analytics computation', () => {
  beforeAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('computes analytics and persists history across runs (flaky detection)', async () => {
    let afterRun: ((results: any) => void) | undefined;
    const on = (event: string, handler: any) => {
      if (event === 'after:run') afterRun = handler;
    };

    const config = {};

    registerCyNova(on as any, config, {
      outputDir: path.relative(process.cwd(), tmpDir),
      fileName: 'cynova-summary.json',
      generateHtml: false,
    });

    const spec = { relative: 'cypress/e2e/analytics.cy.ts', absolute: 'C:/project/cypress/e2e/analytics.cy.ts' };

    const baseTest = {
      title: ['suite', 'is flaky'],
      testId: 't1',
      attempts: [
        { attempt: 0, duration: 100, startedAt: new Date().toISOString(), screenshots: [] },
      ],
    };

    // Run 1: passed
    afterRun?.({
      projectRoot: process.cwd(),
      cypressVersion: '13.5.0',
      totalTests: 1,
      totalPassed: 1,
      totalFailed: 0,
      totalPending: 0,
      totalSkipped: 0,
      totalDuration: 120,
      runs: [
        {
          spec,
          stats: { wallClockDuration: 120 },
          tests: [ { ...baseTest, state: 'passed' } ],
          screenshots: [],
        },
      ],
    });

    // Run 2: failed (same test)
    afterRun?.({
      projectRoot: process.cwd(),
      cypressVersion: '13.5.0',
      totalTests: 1,
      totalPassed: 0,
      totalFailed: 1,
      totalPending: 0,
      totalSkipped: 0,
      totalDuration: 140,
      runs: [
        {
          spec,
          stats: { wallClockDuration: 140 },
          tests: [ { ...baseTest, state: 'failed' } ],
          screenshots: [],
        },
      ],
    });

    const filePath = path.join(tmpDir, 'cynova-summary.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(json.analytics).toBeDefined();
    const flaky = json.analytics.flakyTests || [];
    const found = flaky.find((f: any) => f.testId === 't1' && f.specRelative === spec.relative);
    expect(found).toBeTruthy();

    const historyPath = path.join(tmpDir, 'cynova-history.json');
    expect(fs.existsSync(historyPath)).toBe(true);
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    expect(Array.isArray(history.runs)).toBe(true);
    expect(history.runs.length).toBeGreaterThanOrEqual(2);
  });
});
