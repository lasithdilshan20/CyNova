export type Millis = number;

export interface BrowserInfo {
  name?: string;
  family?: string;
  version?: string;
  majorVersion?: number;
  channel?: string;
  isHeadless?: boolean;
  isHeaded?: boolean;
  displayName?: string;
}

export interface TimelineEvent {
  type:
    | 'run:start'
    | 'run:end'
    | 'spec:start'
    | 'spec:end'
    | 'test:start'
    | 'test:end'
    | 'custom';
  atMillis: Millis; // Offset from run start in ms
  spec?: string; // spec file relative path
  testId?: string; // user-provided id or derived id
  label?: string; // extra info for custom events
  details?: Record<string, unknown>;
}

export interface MediaRef {
  type: 'screenshot' | 'video';
  path: string; // absolute or project-relative
  testId?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export interface ConsoleLogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  atMillis?: Millis;
  spec?: string;
  testId?: string;
  // arbitrary additional fields from the app
  [key: string]: unknown;
}

export interface NetworkLogEntry {
  id?: string;
  method?: string;
  url?: string;
  status?: number;
  statusText?: string;
  durationMs?: Millis;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  atMillis?: Millis;
  spec?: string;
  testId?: string;
  // arbitrary additional fields from the app
  [key: string]: unknown;
}

export interface PerformanceMetrics {
  totalDurationMs?: Millis;
  specDurationsMs?: Record<string, Millis>;
  pluginOverheadMs?: Millis; // optional estimate of plugin processing
}

export interface TestAttempt {
  attempt: number;
  state?: 'passed' | 'failed' | 'pending' | 'skipped' | 'unknown';
  error?: { name?: string; message?: string; stack?: string } | null;
  startedAt?: string; // ISO
  durationMs?: Millis;
  screenshots?: MediaRef[];
  videos?: MediaRef[];
  console?: ConsoleLogEntry[];
  network?: NetworkLogEntry[];
}

export interface TestResultNode {
  id: string;
  title: string[]; // Cypress style suite path segments + test title
  displayTitle?: string; // convenience joined string
  state?: 'passed' | 'failed' | 'pending' | 'skipped' | 'unknown';
  attempts: TestAttempt[];
  timings?: Record<string, Millis>;
  wallClockStartedAt?: string;
  wallClockDurationMs?: Millis;
}

export interface SpecResult {
  specRelative: string; // relative spec path
  specAbsolute?: string;
  tests: TestResultNode[];
  screenshots?: MediaRef[];
  video?: MediaRef | null;
  console?: ConsoleLogEntry[];
  network?: NetworkLogEntry[];
  durationMs?: Millis;
  stats?: Record<string, unknown>;
}

export interface RunTotals {
  tests: number;
  passed: number;
  failed: number;
  pending: number;
  skipped: number;
  durationMs: Millis;
}

export interface CyNovaRun {
  tool: 'CyNova';
  version: string;
  generatedAt: string; // ISO
  projectRoot?: string;
  browser?: BrowserInfo;
  cypressVersion?: string;
  os?: { platform?: string; arch?: string; release?: string };
  totals: RunTotals;
  specs?: SpecResult[];
  timeline?: TimelineEvent[];
  performance?: PerformanceMetrics;
}

export interface CyNovaOptions {
  /** Directory where the summary JSON will be written (relative to process.cwd()). */
  outputDir?: string;
  /** File name for the summary JSON. */
  fileName?: string;
  /** Also generate a single-file HTML report (embedded CSS/JS). Defaults to true. */
  generateHtml?: boolean;
  /** File name for the HTML report. Defaults to 'cynova-report.html'. */
  htmlFileName?: string;
  /** Optional custom Handlebars template absolute path. */
  templatePath?: string;
}
