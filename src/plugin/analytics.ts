import fs from 'fs';
import path from 'path';
import { CyNovaRun, CyNovaAnalytics, DurationOutlierInsight, FlakyTestInsight, TrendsInsight } from './types';

export interface HistoryTestOutcome {
  testId: string;
  specRelative: string;
  displayTitle?: string;
  state?: 'passed' | 'failed' | 'pending' | 'skipped' | 'unknown';
  durationMs?: number;
}

export interface HistoryRunEntry {
  generatedAt: string; // ISO
  browserName?: string;
  totals: { tests: number; passed: number; failed: number; durationMs: number };
  specDurations: Record<string, number | undefined>;
  tests: HistoryTestOutcome[];
}

export interface CyNovaHistory {
  version: 1;
  runs: HistoryRunEntry[];
}

function readHistory(filePath: string): CyNovaHistory {
  try {
    const txt = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(txt);
    if (Array.isArray((data as any).runs)) return data as CyNovaHistory;
  } catch {}
  return { version: 1, runs: [] };
}

function writeHistory(filePath: string, history: CyNovaHistory) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8');
}

function toHistoryEntry(run: CyNovaRun): HistoryRunEntry {
  const tests: HistoryTestOutcome[] = [];
  const specDurations: Record<string, number | undefined> = {};
  for (const s of run.specs || []) {
    specDurations[s.specRelative] = s.durationMs;
    for (const t of s.tests) {
      tests.push({
        testId: t.id,
        specRelative: s.specRelative,
        displayTitle: t.displayTitle,
        state: t.state,
        durationMs: t.wallClockDurationMs,
      });
    }
  }
  return {
    generatedAt: run.generatedAt,
    browserName: run.browser?.name,
    totals: { tests: run.totals.tests, passed: run.totals.passed, failed: run.totals.failed, durationMs: run.totals.durationMs },
    specDurations,
    tests,
  };
}

function computeFlaky(history: CyNovaHistory, recentN = 10): FlakyTestInsight[] {
  const map = new Map<string, { spec: string; title?: string; pass: number; fail: number; total: number }>();
  const slice = history.runs.slice(-recentN);
  for (const r of slice) {
    for (const t of r.tests) {
      const key = `${t.specRelative}::${t.testId}`;
      let v = map.get(key);
      if (!v) {
        v = { spec: t.specRelative, title: t.displayTitle, pass: 0, fail: 0, total: 0 };
        map.set(key, v);
      }
      if (t.state === 'passed') v.pass++;
      if (t.state === 'failed') v.fail++;
      v.total++;
    }
  }
  const out: FlakyTestInsight[] = [];
  map.forEach((v, key) => {
    const flakyScore = v.total > 0 ? Math.min(1, (v.pass > 0 && v.fail > 0 ? (v.pass + v.fail) / v.total : 0)) : 0;
    if (v.pass > 0 && v.fail > 0) {
      const [specRelative, testId] = key.split('::');
      out.push({ testId, specRelative, displayTitle: v.title, passCount: v.pass, failCount: v.fail, totalRuns: v.total, flakyScore });
    }
  });
  // sort by highest flaky score then by total runs
  out.sort((a, b) => b.flakyScore - a.flakyScore || b.totalRuns - a.totalRuns);
  return out;
}

function mean(nums: number[]): number { return nums.reduce((a, b) => a + b, 0) / (nums.length || 1); }
function stddev(nums: number[], m = mean(nums)): number {
  const v = mean(nums.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function computeOutliers(run: CyNovaRun): DurationOutlierInsight[] {
  const durations: number[] = [];
  const entries: { testId: string; spec: string; title?: string; d?: number }[] = [];
  for (const s of run.specs || []) {
    for (const t of s.tests) {
      const d = t.wallClockDurationMs ?? (t.attempts?.[0]?.durationMs);
      entries.push({ testId: t.id, spec: s.specRelative, title: t.displayTitle, d });
      if (typeof d === 'number') durations.push(d);
    }
  }
  if (durations.length < 5) return [];
  const m = mean(durations);
  const sd = stddev(durations, m) || 1;
  const out: DurationOutlierInsight[] = [];
  for (const e of entries) {
    if (typeof e.d !== 'number') continue;
    const z = (e.d - m) / sd;
    if (z >= 2) {
      out.push({ testId: e.testId, specRelative: e.spec, displayTitle: e.title, durationMs: e.d, zScore: z });
    }
  }
  out.sort((a, b) => (b.zScore ?? 0) - (a.zScore ?? 0));
  return out;
}

function computeTrends(history: CyNovaHistory): TrendsInsight {
  const totalDurationMs = history.runs.map((r, idx) => ({ runIndex: idx, value: r.totals.durationMs, timestamp: r.generatedAt }));
  const specSet = new Set<string>();
  history.runs.forEach((r) => Object.keys(r.specDurations).forEach((s) => specSet.add(s)));
  const specDurationMs: Record<string, { runIndex: number; value: number; timestamp?: string }[]> = {};
  for (const spec of specSet) {
    specDurationMs[spec] = history.runs.map((r, idx) => ({ runIndex: idx, value: r.specDurations[spec] ?? 0, timestamp: r.generatedAt }));
  }
  const passRatePct = history.runs.map((r, idx) => {
    const total = r.totals.tests || 0;
    const passed = r.totals.passed || 0;
    const rate = total > 0 ? (passed / total) * 100 : 0;
    return { runIndex: idx, value: Number(rate.toFixed(2)), timestamp: r.generatedAt };
  });
  return { totalDurationMs, specDurationMs, passRatePct };
}

function computeCrossBrowser(history: CyNovaHistory) {
  const out: Record<string, { runs: number; avgDurationMs?: number; passed: number; failed: number }> = {};
  for (const r of history.runs) {
    const key = r.browserName || 'unknown';
    const v = out[key] || { runs: 0, avgDurationMs: 0, passed: 0, failed: 0 };
    v.runs += 1;
    v.passed += r.totals.passed;
    v.failed += r.totals.failed;
    v.avgDurationMs = ((v.avgDurationMs || 0) * (v.runs - 1) + (r.totals.durationMs || 0)) / v.runs;
    out[key] = v;
  }
  return out;
}

function computeDependencies(run: CyNovaRun) {
  // Lightweight placeholder: derive dependencies from stats if available else leave empty.
  const graph: Record<string, string[]> = {};
  for (const s of run.specs || []) {
    const deps = Array.isArray((s.stats as any)?.deps) ? ((s.stats as any).deps as string[]) : [];
    graph[s.specRelative] = deps;
  }
  return { graph };
}

function tryScreenshotDiff(run: CyNovaRun, outputDir: string) {
  const insights: any[] = [];
  let PNG: any;
  let pixelmatch: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    PNG = require('pngjs').PNG;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    pixelmatch = require('pixelmatch');
  } catch {
    return insights; // dependencies not available
  }
  const outDir = path.resolve(process.cwd(), outputDir, 'cynova-diffs');
  fs.mkdirSync(outDir, { recursive: true });
  for (const s of run.specs || []) {
    for (const t of s.tests) {
      // collect first two screenshots across attempts for this test
      const paths: string[] = [];
      for (const a of t.attempts || []) {
        for (const sc of a.screenshots || []) {
          if (sc.path && typeof sc.path === 'string') paths.push(sc.path);
          if (paths.length >= 2) break;
        }
        if (paths.length >= 2) break;
      }
      if (paths.length >= 2 && fs.existsSync(paths[0]) && fs.existsSync(paths[1])) {
        try {
          const img1 = PNG.sync.read(fs.readFileSync(paths[0]));
          const img2 = PNG.sync.read(fs.readFileSync(paths[1]));
          const width = Math.min(img1.width, img2.width);
          const height = Math.min(img1.height, img2.height);
          if (width > 0 && height > 0) {
            const diffPng = new PNG({ width, height });
            const diffPixels = pixelmatch(img1.data, img2.data, diffPng.data, width, height, { threshold: 0.1 });
            const totalPixels = width * height;
            const ratio = totalPixels ? diffPixels / totalPixels : 0;
            const diffFile = path.join(outDir, `${t.id.replace(/[^a-z0-9_-]/gi, '_')}-diff.png`);
            fs.writeFileSync(diffFile, PNG.sync.write(diffPng));
            insights.push({
              testId: t.id,
              specRelative: s.specRelative,
              baselinePath: paths[0],
              comparePath: paths[1],
              diffImagePath: diffFile,
              totalPixels,
              diffPixels,
              diffRatio: ratio,
              status: 'computed',
            });
          }
        } catch (e: any) {
          insights.push({ testId: t.id, specRelative: s.specRelative, baselinePath: paths[0], comparePath: paths[1], status: 'error', errorMessage: e?.message || String(e) });
        }
      } else if (paths.length > 0) {
        insights.push({ testId: t.id, specRelative: s.specRelative, baselinePath: paths[0], status: 'skipped' });
      }
    }
  }
  return insights;
}

export function computeAnalyticsAndUpdateHistory(run: CyNovaRun, outputDir: string) {
  const historyPath = path.resolve(process.cwd(), outputDir, 'cynova-history.json');
  const history = readHistory(historyPath);

  // Merge current run into history copy for trend/cross-browser based on including current
  const entry = toHistoryEntry(run);
  const merged: CyNovaHistory = { version: 1, runs: [...history.runs, entry] };

  const analytics: CyNovaAnalytics = {
    flakyTests: computeFlaky(merged),
    durationOutliers: computeOutliers(run),
    trends: computeTrends(merged),
    crossBrowser: computeCrossBrowser(merged),
    dependencies: computeDependencies(run),
    screenshotDiffs: tryScreenshotDiff(run, outputDir),
  };

  // Persist updated history
  writeHistory(historyPath, merged);
  return analytics;
}
