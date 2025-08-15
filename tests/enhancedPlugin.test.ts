import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { registerCyNova } from '../src/plugin';

const tmpDir = path.resolve(process.cwd(), '.tmp', 'vitest-enhanced');

describe('CyNova enhanced plugin', () => {
  beforeAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('captures tasks, builds rich JSON with specs/tests/logs/media/timeline', async () => {
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

    const config = {};

    registerCyNova(on as any, config, {
      outputDir: path.relative(process.cwd(), tmpDir),
      fileName: 'enhanced.json',
      generateHtml: false,
    });

    // simulate a spec lifecycle and inbound logs via tasks
    const spec = { relative: 'cypress/e2e/spec1.cy.ts', absolute: 'C:/project/cypress/e2e/spec1.cy.ts' };

    beforeRun?.({ cypressVersion: '13.5.0' });
    beforeSpec?.(spec);

    // send a console and network log
    taskHandlers?.['cynova:console']?.({ level: 'info', message: 'hello', spec: spec.relative });
    taskHandlers?.['cynova:network']?.({ method: 'GET', url: '/api/items', status: 200, spec: spec.relative });

    afterSpec?.(spec);

    const fakeResults = {
      projectRoot: process.cwd(),
      cypressVersion: '13.5.0',
      os: { platform: process.platform, arch: process.arch, release: 'test' },
      totalTests: 1,
      totalPassed: 1,
      totalFailed: 0,
      totalPending: 0,
      totalSkipped: 0,
      totalDuration: 250,
      runs: [
        {
          spec,
          stats: { wallClockDuration: 250 },
          tests: [
            {
              title: ['suite', 'does A'],
              testId: 't1',
              state: 'passed',
              attempts: [
                {
                  attempt: 0,
                  duration: 120,
                  startedAt: new Date().toISOString(),
                  screenshots: [{ path: 'cypress/screenshots/spec1--suite -- does A.png', width: 800, height: 600 }],
                },
              ],
            },
          ],
          screenshots: [{ path: 'cypress/screenshots/spec1--suite -- does A.png' }],
          video: 'cypress/videos/spec1.mp4',
        },
      ],
    };

    afterRun?.(fakeResults);

    const filePath = path.join(tmpDir, 'enhanced.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    expect(json.tool).toBe('CyNova');
    expect(json.totals.tests).toBe(1);

    // specs and tests
    expect(Array.isArray(json.specs)).toBe(true);
    expect(json.specs[0].specRelative).toBe(spec.relative);
    expect(json.specs[0].tests[0].id).toBe('t1');
    expect(json.specs[0].video?.type).toBe('video');

    // logs via tasks attached to spec
    expect(json.specs[0].console?.length).toBeGreaterThan(0);
    expect(json.specs[0].network?.length).toBeGreaterThan(0);

    // timeline captured
    expect(Array.isArray(json.timeline)).toBe(true);
    expect(json.timeline.length).toBeGreaterThan(0);
  });
});
