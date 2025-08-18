import fs from 'fs';
import path from 'path';
import { registerCyNova } from '../src/plugin';

describe('Jest: CyNova plugin event handlers', () => {
  const tmpDir = path.resolve(process.cwd(), '.tmp', 'jest-plugin');

  beforeAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('collects tasks and writes rich JSON with specs/tests/logs/timeline', () => {
    let afterRun: ((results: any) => void) | undefined;
    let beforeRun: ((details: any) => void) | undefined;
    let beforeSpec: ((spec: any) => void) | undefined;
    let afterSpec: ((spec: any) => void) | undefined;
    let taskHandlers: Record<string, (arg: any) => any> | undefined;

    const on = (event: string, handler: any) => {
      if (event === 'after:run') afterRun = handler;
      if (event === 'before:run') beforeRun = handler;
      if (event === 'before:spec') beforeSpec = handler;
      if (event === 'after:spec') afterSpec = handler;
      if (event === 'task') taskHandlers = handler;
    };

    registerCyNova(on as any, {}, { outputDir: path.relative(process.cwd(), tmpDir), fileName: 'out.json', generateHtml: false });

    const spec = { relative: 'cypress/e2e/a.cy.ts', absolute: 'C:/p/cypress/e2e/a.cy.ts' };

    beforeRun?.({ cypressVersion: '13.5.0' });
    beforeSpec?.(spec);
    taskHandlers?.['cynova:console']?.({ level: 'info', message: 'hello', spec: spec.relative });
    taskHandlers?.['cynova:network']?.({ method: 'GET', url: '/api', status: 200, spec: spec.relative });
    afterSpec?.(spec);

    afterRun?.({
      projectRoot: process.cwd(),
      cypressVersion: '13.5.0',
      totalTests: 1,
      totalPassed: 1,
      totalFailed: 0,
      totalPending: 0,
      totalSkipped: 0,
      totalDuration: 77,
      runs: [
        {
          spec,
          stats: { wallClockDuration: 77 },
          tests: [
            { title: ['s', 't'], testId: 't1', state: 'passed', attempts: [{ attempt: 0, duration: 33, startedAt: new Date().toISOString(), screenshots: [] }] },
          ],
          screenshots: [],
          video: 'cypress/videos/a.mp4',
        },
      ],
    });

    const filePath = path.join(tmpDir, 'out.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(json.tool).toBe('CyNova');
    expect(json.totals.tests).toBe(1);
    expect(Array.isArray(json.specs)).toBe(true);
    expect(json.specs[0].console?.length).toBeGreaterThan(0);
    expect(json.timeline?.length).toBeGreaterThan(0);
  });

  test('handles write error gracefully and logs to console.error', () => {
    let afterRun: ((r: any) => void) | undefined;
    const on = (event: string, handler: any) => { if (event === 'after:run') afterRun = handler; };
    registerCyNova(on as any, {}, { outputDir: path.relative(process.cwd(), tmpDir), fileName: 'error.json', generateHtml: false });

    const orig = fs.writeFileSync;
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const spy = jest.spyOn(fs, 'writeFileSync').mockImplementation(((p: any, ...args: any[]) => {
      try {
        const pathStr = typeof p === 'string' ? p : '';
        if (pathStr.endsWith('error.json')) {
          throw new Error('disk full');
        }
        // delegate to original for other writes (e.g., history)
        // @ts-ignore
        return orig(p, ...args);
      } catch (e) {
        // rethrow
        throw e;
      }
    }) as any);

    afterRun?.({ totalTests: 0, totalPassed: 0, totalFailed: 0, totalPending: 0, totalSkipped: 0, totalDuration: 0, runs: [] });

    expect(errSpy).toHaveBeenCalled();
    spy.mockRestore();
    errSpy.mockRestore();
  });
});
