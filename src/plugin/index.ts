import fs from 'fs';
import path from 'path';
import {
  BrowserInfo,
  ConsoleLogEntry,
  CyNovaOptions,
  CyNovaRun,
  MediaRef,
  NetworkLogEntry,
  SpecResult,
  TestAttempt,
  TestResultNode,
  TimelineEvent,
} from './types';
import { computeAnalyticsAndUpdateHistory } from './analytics';
import { createLiveServer, LiveServer } from './live';

export * from './types';

function nowIso() {
  return new Date().toISOString();
}

function hrNow(): bigint {
  try {
    return process.hrtime.bigint();
  } catch {
    // Fallback if hrtime not supported
    return BigInt(Math.floor(performance.now() * 1_000_000));
  }
}

function hrDiffMs(start: bigint, end: bigint): number {
  const diffNs = end - start;
  return Number(diffNs) / 1_000_000;
}

/**
 * Register CyNova in Cypress's setupNodeEvents hook.
 * Example (cypress.config.ts):
 *   import { defineConfig } from 'cypress';
 *   import { registerCyNova } from 'cynova';
 *   export default defineConfig({
 *     e2e: {
 *       setupNodeEvents(on, config) {
 *         registerCyNova(on, config, { outputDir: 'reports' });
 *         return config;
 *       },
 *     },
 *   });
 */
export function registerCyNova(on: any, config: any, options: CyNovaOptions = {}) {
  const outputDir = options.outputDir ?? 'reports';
  const fileName = options.fileName ?? 'cynova-summary.json';

  const state: {
    runStartHr?: bigint;
    timeline: TimelineEvent[];
    browser?: BrowserInfo;
    extrasBySpec: Map<string, { console: ConsoleLogEntry[]; network: NetworkLogEntry[]; timeline: TimelineEvent[] }>;
    live?: LiveServer | null;
  } = {
    timeline: [],
    extrasBySpec: new Map(),
    live: null,
  };

  function pushTimeline(ev: TimelineEvent) {
    state.timeline.push(ev);
    if (ev.spec) {
      const bucket = ensureSpecExtras(ev.spec);
      bucket.timeline.push(ev);
    }
    try {
      state.live?.send({ type: 'timeline', event: ev });
    } catch {}
  }

  function ensureSpecExtras(spec: string) {
    let e = state.extrasBySpec.get(spec);
    if (!e) {
      e = { console: [], network: [], timeline: [] };
      state.extrasBySpec.set(spec, e);
    }
    return e;
  }

  on('before:browser:launch', (_browser: any, _launchOptions: any) => {
    // Best effort capture, Cypress passes Browser object here
    try {
      const b = _browser || {};
      state.browser = {
        name: b.name,
        family: b.family,
        version: b.version,
        majorVersion: b.majorVersion,
        channel: b.channel,
        isHeadless: b.isHeadless,
        isHeaded: b.isHeaded,
        displayName: b.displayName,
      };
    } catch {
      // ignore
    }
    return _launchOptions;
  });

  on('before:run', (details: any) => {
    state.runStartHr = hrNow();
    // start live server if enabled
    try {
      state.live = createLiveServer(options.liveServer);
      state.live?.send({ type: 'lifecycle', phase: 'before:run', details: { cypressVersion: details?.cypressVersion, at: nowIso() } });
    } catch {}
    pushTimeline({ type: 'run:start', atMillis: 0 });
    // Add a custom marker with cypress version if present
    const cv = details?.cypressVersion;
    if (cv) {
      pushTimeline({ type: 'custom', atMillis: 0, label: 'cypressVersion', details: { cypressVersion: cv } });
    }
  });

  on('before:spec', (spec: any) => {
    const at = state.runStartHr ? hrDiffMs(state.runStartHr, hrNow()) : 0;
    const specRel = spec?.relative ?? spec?.name;
    state.live?.send({ type: 'lifecycle', phase: 'before:spec', spec: specRel, at });
    pushTimeline({ type: 'spec:start', atMillis: at, spec: specRel });
  });

  on('after:spec', (spec: any) => {
    const at = state.runStartHr ? hrDiffMs(state.runStartHr, hrNow()) : 0;
    const specRel = spec?.relative ?? spec?.name;
    state.live?.send({ type: 'lifecycle', phase: 'after:spec', spec: specRel, at });
    pushTimeline({ type: 'spec:end', atMillis: at, spec: specRel });
  });

  on('task', {
    'cynova:console': (entry: ConsoleLogEntry & { spec?: string }) => {
      try {
        const spec = entry.spec ?? 'unknown';
        const at = state.runStartHr ? hrDiffMs(state.runStartHr, hrNow()) : undefined;
        const item: ConsoleLogEntry = { ...entry, atMillis: entry.atMillis ?? at };
        ensureSpecExtras(spec).console.push(item);
        state.live?.send({ type: 'task', task: 'cynova:console', entry: { ...item, spec } });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[CyNova] Failed to record console log', err);
      }
      return null;
    },
    'cynova:network': (entry: NetworkLogEntry & { spec?: string }) => {
      try {
        const spec = entry.spec ?? 'unknown';
        const at = state.runStartHr ? hrDiffMs(state.runStartHr, hrNow()) : undefined;
        const item: NetworkLogEntry = { ...entry, atMillis: entry.atMillis ?? at };
        ensureSpecExtras(spec).network.push(item);
        state.live?.send({ type: 'task', task: 'cynova:network', entry: { ...item, spec } });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[CyNova] Failed to record network log', err);
      }
      return null;
    },
    'cynova:timeline': (entry: { type?: string; spec?: string; label?: string; details?: any; atMillis?: number }) => {
      try {
        const at = entry.atMillis ?? (state.runStartHr ? hrDiffMs(state.runStartHr, hrNow()) : 0);
        const ev: TimelineEvent = {
          type: (entry.type as any) || 'custom',
          atMillis: at,
          spec: entry.spec,
          label: entry.label,
          details: entry.details,
        };
        pushTimeline(ev);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[CyNova] Failed to record timeline event', err);
      }
      return null;
    },
  });

  on('after:run', (results: any) => {
    try {
      const endAt = state.runStartHr ? hrDiffMs(state.runStartHr, hrNow()) : (results?.totalDuration ?? 0);
      pushTimeline({ type: 'run:end', atMillis: endAt });

      const run: CyNovaRun = {
        tool: 'CyNova',
        version: '0.1.0',
        generatedAt: nowIso(),
        projectRoot: results?.projectRoot,
        browser: state.browser,
        cypressVersion: results?.cypressVersion,
        os: results?.os ? { platform: results.os.platform, arch: results.os.arch, release: results.os.release } : undefined,
        totals: {
          tests: results?.totalTests ?? 0,
          passed: results?.totalPassed ?? 0,
          failed: results?.totalFailed ?? 0,
          pending: results?.totalPending ?? 0,
          skipped: results?.totalSkipped ?? 0,
          durationMs: results?.totalDuration ?? (typeof endAt === 'number' ? endAt : 0),
        },
        specs: [],
        timeline: state.timeline,
        performance: {
          totalDurationMs: results?.totalDuration ?? (typeof endAt === 'number' ? endAt : undefined),
        },
      };

      const runs = Array.isArray(results?.runs) ? results.runs : [];

      const specs: SpecResult[] = [];
      for (const r of runs) {
        const specRel = r?.spec?.relative ?? r?.spec?.name ?? r?.spec ?? 'unknown';
        const specAbs = r?.spec?.absolute ?? undefined;
        const specBucket = state.extrasBySpec.get(specRel) ?? { console: [], network: [], timeline: [] };

        const tests: TestResultNode[] = [];
        const rtests = Array.isArray(r?.tests) ? r.tests : [];
        for (const t of rtests) {
          const id = String(t?.testId ?? (Array.isArray(t?.title) ? t.title.join(' ') : t?.title ?? 'unknown'));
          const attempts: TestAttempt[] = [];
          const tatts = Array.isArray(t?.attempts) ? t.attempts : [];
          for (let i = 0; i < tatts.length; i++) {
            const a = tatts[i] ?? {};
            const screenshots: MediaRef[] = [];
            const ascreens = Array.isArray(a?.screenshots) ? a.screenshots : [];
            for (const s of ascreens) {
              if (!s?.path) continue;
              screenshots.push({ type: 'screenshot', path: s.path, width: s.width, height: s.height, testId: id });
            }
            const videos: MediaRef[] = [];
            if (r?.video) {
              videos.push({ type: 'video', path: r.video, testId: id });
            }
            attempts.push({
              attempt: typeof a?.attempt === 'number' ? a.attempt : i,
              state: a?.state ?? t?.state ?? 'unknown',
              error: a?.error ?? null,
              startedAt: a?.startedAt,
              durationMs: a?.duration,
              screenshots,
              videos,
            });
          }

          tests.push({
            id,
            title: Array.isArray(t?.title) ? t.title : [String(t?.title ?? id)],
            displayTitle: Array.isArray(t?.title) ? t.title.join(' ') : String(t?.title ?? id),
            state: t?.state ?? 'unknown',
            attempts,
            timings: t?.timings,
            wallClockStartedAt: t?.wallClockStartedAt,
            wallClockDurationMs: t?.wallClockDuration,
          });
        }

        const specResult: SpecResult = {
          specRelative: specRel,
          specAbsolute: specAbs,
          tests,
          screenshots: (r?.screenshots || []).map((s: any) => ({ type: 'screenshot', path: s.path } as MediaRef)),
          video: r?.video ? ({ type: 'video', path: r.video } as MediaRef) : null,
          console: specBucket.console,
          network: specBucket.network,
          durationMs: r?.stats?.wallClockDuration ?? r?.duration,
          stats: r?.stats,
        };
        specs.push(specResult);
      }

      if (specs.length) run.specs = specs;

      // Compute analytics and update history (optional advanced features)
      try {
        run.analytics = computeAnalyticsAndUpdateHistory(run, outputDir);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[CyNova] Analytics computation skipped:', (e as any)?.message || e);
      }

      const dir = path.resolve(process.cwd(), outputDir);
      fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(run, null, 2), 'utf-8');
      // eslint-disable-next-line no-console
      console.log(`[CyNova] Wrote summary to ${filePath}`);
      try { state.live?.send({ type: 'summary', run }); } catch {}

      // Optionally generate a single-file HTML report with embedded CSS/JS
      const shouldGenHtml = options.generateHtml !== false;
      if (shouldGenHtml) {
        try {
          // Use dynamic import so it works in TS test environments without prebuild
          import('./report')
            .then((m) => {
              const htmlPath = m.generateHtmlReport(run, {
                outputDir,
                htmlFileName: options.htmlFileName ?? 'cynova-report.html',
                templatePath: options.templatePath,
              });
              // eslint-disable-next-line no-console
              console.log(`[CyNova] Wrote HTML report to ${htmlPath}`);
            })
            .catch((e) => {
              // eslint-disable-next-line no-console
              console.warn('[CyNova] HTML report generation skipped:', e?.message || e);
            });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[CyNova] HTML report generation skipped:', (e as any)?.message || e);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[CyNova] Failed to write summary:', err);
    } finally {
      try { state.live?.close(); } catch {}
    }
  });

  return config;
}
