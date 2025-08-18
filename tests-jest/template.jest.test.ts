import fs from 'fs';
import path from 'path';
import { generateHtmlReport } from '../src/plugin/report';
import type { CyNovaRun } from '../src/plugin/types';

describe('Jest: custom Handlebars template', () => {
  const tmpDir = path.resolve(process.cwd(), '.tmp', 'jest-template');
  const tmplDir = path.resolve(tmpDir, 'tmpl');

  beforeAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(tmplDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function run(): CyNovaRun {
    return {
      tool: 'CyNova',
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      totals: { tests: 1, passed: 1, failed: 0, pending: 0, skipped: 0, durationMs: 1 },
      specs: [],
    } as any;
  }

  test('uses provided templatePath when available', () => {
    const templatePath = path.join(tmplDir, 'custom.hbs');
    fs.writeFileSync(templatePath, '<!doctype html><html><head><title>Custom</title><style>{{{inlineCss}}}</style></head><body><h1>{{tool}}</h1><script>window.__CYNOVA__ = {{json this}};</script>{{{inlineJs}}}</body></html>', 'utf-8');
    const out = generateHtmlReport(run(), { outputDir: path.relative(process.cwd(), tmpDir), htmlFileName: 'custom.html', templatePath });
    const html = fs.readFileSync(out, 'utf-8');
    expect(html).toContain('<title>Custom</title>');
    expect(html).toContain('window.__CYNOVA__');
  });
});
