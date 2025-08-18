import fs from 'fs';
import path from 'path';
import { CyNovaRun } from './types';

export interface HtmlReportOptions {
  /** Output directory where HTML will be written */
  outputDir: string;
  /** File name for the HTML report */
  htmlFileName?: string;
  /** Optional custom template path; defaults to src/web/report.hbs if present */
  templatePath?: string;
}

function readFileSafe(p: string): string | undefined {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return undefined;
  }
}

function defaultTemplatePath(): string {
  // use a repo-relative template when running in dev; fallback to built-in minimal template
  return path.resolve(process.cwd(), 'src', 'web', 'report.hbs');
}

function loadChartJsUmd(): string {
  // Try node_modules first (prefer minified)
  const candidates = [
    path.resolve(process.cwd(), 'node_modules', 'chart.js', 'dist', 'chart.umd.min.js'),
    path.resolve(process.cwd(), 'node_modules', 'chart.js', 'dist', 'chart.umd.js'),
  ];
  for (const c of candidates) {
    const contents = readFileSafe(c);
    if (contents) return contents;
  }
  // As a resilient fallback, provide a tiny stub to avoid runtime errors
  return 'window.Chart = window.Chart || function(){};';
}

function minifyCss(css: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const csso = require('csso');
    return csso.minify(css).css || css;
  } catch {
    // fallback: strip comments and collapse whitespace conservatively
    try {
      const noComments = css.replace(/\/\*[^!*][\s\S]*?\*\//g, '');
      return noComments.replace(/\s+/g, ' ').trim();
    } catch {
      return css;
    }
  }
}

function minifyInlineJs(js: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const terser = require('terser');
    const res = terser.minify(js, { compress: false, mangle: false });
    return (res && res.code) || js;
  } catch {
    // Safe fallback: leave JS as is to avoid breaking functionality
    return js;
  }
}

/**
 * Generate a single-file HTML report for a CyNova run.
 * Embeds CSS/JS and inlines Chart.js when available. Falls back to a minimal
 * HTML document if Handlebars is unavailable or when CYNOVA_FORCE_FALLBACK=1.
 *
 * @param run - The CyNovaRun payload written by the plugin.
 * @param opts - Output options (directory, file name, optional custom templatePath).
 * @returns Absolute file path to the generated HTML report.
 */
export function generateHtmlReport(run: CyNovaRun, opts: HtmlReportOptions) {
  const outDir = path.resolve(process.cwd(), opts.outputDir);
  const fileName = opts.htmlFileName ?? 'cynova-report.html';
  const templatePath = opts.templatePath ?? defaultTemplatePath();

  const cssPath = path.resolve(process.cwd(), 'src', 'web', 'report.css');
  const jsEnhancePath = path.resolve(process.cwd(), 'src', 'web', 'enhance.js');

  const templateSource = readFileSafe(templatePath) ?? `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CyNova Report</title>
<style>{{{inlineCss}}}</style>
</head>
<body>
  <header class="cn-header">
    <h1>CyNova</h1>
    <span class="cn-badge">alpha</span>
  </header>
  <main>
    <section>
      <h2>Summary</h2>
      <p>Tests: {{totals.tests}}, Passed: {{totals.passed}}, Failed: {{totals.failed}}, Pending: {{totals.pending}}, Skipped: {{totals.skipped}}</p>
      <noscript><p>Charts and interactive features require JavaScript. Data is rendered server-side.</p></noscript>
      <canvas id="cn-summary"></canvas>
    </section>
    <section>
      <h2>Specs</h2>
      <ul>
        {{#each specs}}
        <li>
          <strong>{{specRelative}}</strong> — {{tests.length}} tests
          <ul>
            {{#each tests}}
              <li>{{displayTitle}} — {{state}}</li>
            {{/each}}
          </ul>
        </li>
        {{/each}}
      </ul>
    </section>
  </main>
<script>{{{chartJs}}}</script>
<script>window.__CYNOVA__ = {{json this}};</script>
<script>{{{inlineJs}}}</script>
</body></html>`;

  const inlineCss = minifyCss(readFileSafe(cssPath) ?? '');
  const inlineJs = minifyInlineJs(readFileSafe(jsEnhancePath) ?? '');
  const chartJs = loadChartJsUmd();

  let html: string;
  try {
    // Allow tests to force fallback path via env flag
    if (process.env.CYNOVA_FORCE_FALLBACK === '1') {
      throw new Error('forced');
    }
    // Lazy require to keep runtime optional if users don't need HTML
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Handlebars = require('handlebars');
    Handlebars.registerHelper('json', function (ctx: any) {
      return new Handlebars.SafeString(JSON.stringify(ctx));
    });
    const template = Handlebars.compile(templateSource);
    html = template({
      ...run,
      inlineCss,
      inlineJs,
      chartJs,
    });
  } catch {
    // Fallback minimal HTML if handlebars is unavailable
    html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CyNova Report (fallback)</title>
<style>${inlineCss}</style>
</head>
<body>
<header class="cn-header glass"><h1>CyNova</h1><span class="cn-sub">${run.generatedAt}</span></header>
<main class="cn-container">
  <section class="card glass"><div class="card-b">
    <h2>Summary</h2>
    <p>Tests: ${run.totals.tests}, Passed: ${run.totals.passed}, Failed: ${run.totals.failed}, Pending: ${run.totals.pending}, Skipped: ${run.totals.skipped}</p>
    <canvas id="cn-summary-chart" height="120"></canvas>
  </div></section>
</main>
<script>${chartJs}</script>
<script>window.__CYNOVA__ = ${JSON.stringify(run)};</script>
<script>${inlineJs}</script>
</body></html>`;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, fileName);
  fs.writeFileSync(filePath, html, 'utf-8');
  return filePath;
}
