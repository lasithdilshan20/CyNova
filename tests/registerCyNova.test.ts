import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { registerCyNova } from '../src/plugin';

const tmpDir = path.resolve(process.cwd(), '.tmp', 'vitest-output');

describe('registerCyNova', () => {
  beforeAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes a summary JSON on after:run', async () => {
    let capturedHandler: ((results: any) => void) | undefined;
    const on = (event: string, handler: (results: any) => void) => {
      if (event === 'after:run') capturedHandler = handler;
    };
    const config = {};

    const ret = registerCyNova(on as any, config, {
      outputDir: path.relative(process.cwd(), tmpDir),
      fileName: 'cynova-summary.json',
    });

    expect(ret).toBe(config);
    expect(typeof capturedHandler).toBe('function');

    const fakeResults = {
      totalTests: 3,
      totalPassed: 2,
      totalFailed: 1,
      totalPending: 0,
      totalSkipped: 0,
      totalDuration: 1234,
    };

    capturedHandler?.(fakeResults);

    const filePath = path.join(tmpDir, 'cynova-summary.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(json.tool).toBe('CyNova');
    expect(json.totals.tests).toBe(3);
    expect(json.totals.passed).toBe(2);
    expect(json.totals.failed).toBe(1);
  });
});
