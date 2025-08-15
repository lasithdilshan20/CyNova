import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { registerCyNova } from '../src/plugin';

const tmpDir = path.resolve(process.cwd(), '.tmp', 'vitest-html');

describe('CyNova HTML report generation', () => {
  beforeAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('emits a single-file HTML report alongside JSON', async () => {
    let afterRun: ((results: any) => void) | undefined;

    const on = (event: string, handler: any) => {
      if (event === 'after:run') afterRun = handler;
    };

    const config = {};

    registerCyNova(on as any, config, {
      outputDir: path.relative(process.cwd(), tmpDir),
      fileName: 'cynova-summary.json',
      htmlFileName: 'cynova-report.html',
      // allow default generateHtml (true)
    });

    const fakeResults = {
      projectRoot: process.cwd(),
      cypressVersion: '13.5.0',
      totalTests: 2,
      totalPassed: 1,
      totalFailed: 1,
      totalPending: 0,
      totalSkipped: 0,
      totalDuration: 100,
      runs: [],
    };

    afterRun?.(fakeResults);

    // wait briefly for async dynamic import + generation
    await new Promise((r) => setTimeout(r, 50));

    const jsonPath = path.join(tmpDir, 'cynova-summary.json');
    const htmlPath = path.join(tmpDir, 'cynova-report.html');

    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(fs.existsSync(htmlPath)).toBe(true);

    const html = fs.readFileSync(htmlPath, 'utf-8');
    expect(html.toLowerCase()).toContain('<!doctype html>');
    expect(html).toContain('CyNova');
    expect(html).toContain('window.__CYNOVA__');
  });
});
