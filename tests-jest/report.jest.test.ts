import fs from 'fs';
import path from 'path';
import { generateHtmlReport } from '../src/plugin/report';
import type { CyNovaRun } from '../src/plugin/types';

const tmpDir = path.resolve(process.cwd(), '.tmp', 'jest-report');

describe('Jest: HTML report generation', () => {
  beforeAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function baseRun(overrides: Partial<CyNovaRun> = {}): CyNovaRun {
    return {
      tool: 'CyNova',
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      totals: { tests: 2, passed: 1, failed: 1, pending: 0, skipped: 0, durationMs: 100 },
      specs: [
        {
          specRelative: 'cypress/e2e/a.cy.ts',
          tests: [
            { id: 't1', title: ['a'], displayTitle: 'a', state: 'passed', attempts: [], wallClockDurationMs: 10 },
            { id: 't2', title: ['b'], displayTitle: 'b', state: 'failed', attempts: [], wallClockDurationMs: 90 },
          ],
        },
      ],
      timeline: [{ type: 'run:start', atMillis: 0 }, { type: 'run:end', atMillis: 100 }],
      performance: { totalDurationMs: 100 },
      ...overrides,
    } as CyNovaRun;
  }

  test('generates HTML with embedded JSON and assets', () => {
    const htmlPath = generateHtmlReport(baseRun(), { outputDir: path.relative(process.cwd(), tmpDir), htmlFileName: 'r.html' });
    expect(fs.existsSync(htmlPath)).toBe(true);
    const html = fs.readFileSync(htmlPath, 'utf-8');
    expect(html.toLowerCase()).toContain('<!doctype html>');
    expect(html).toContain('window.__CYNOVA__');
    expect(html).toContain('CyNova');
  });

  test('falls back when forced via env flag', () => {
    const prev = process.env.CYNOVA_FORCE_FALLBACK;
    process.env.CYNOVA_FORCE_FALLBACK = '1';
    try {
      const p = generateHtmlReport(baseRun(), { outputDir: path.relative(process.cwd(), tmpDir), htmlFileName: 'fallback.html' });
      const html = fs.readFileSync(p, 'utf-8');
      expect(html).toContain('CyNova Report (fallback)');
      expect(html).toContain('window.__CYNOVA__');
    } finally {
      if (prev === undefined) delete process.env.CYNOVA_FORCE_FALLBACK; else process.env.CYNOVA_FORCE_FALLBACK = prev;
    }
  });

  test('handles large suites quickly (smoke)', () => {
    const big: CyNovaRun = baseRun({}) as any;
    big.totals.tests = 2000; big.totals.passed = 1900; big.totals.failed = 100;
    big.specs = [
      {
        specRelative: 'cypress/e2e/huge.cy.ts',
        tests: Array.from({ length: 2000 }, (_, i) => ({ id: 't'+i, title: ['T', String(i)], displayTitle: 'T '+i, state: i % 10 === 0 ? 'failed' : 'passed', attempts: [], wallClockDurationMs: (i%100)+1 })),
      },
    ] as any;
    const p = generateHtmlReport(big, { outputDir: path.relative(process.cwd(), tmpDir), htmlFileName: 'big.html' });
    expect(fs.existsSync(p)).toBe(true);
  });
});
