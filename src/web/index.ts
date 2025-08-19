import './report.css';
import './index.css';
import { Chart, registerables } from 'chart.js';

declare global {
  interface Window { __CYNOVA__?: any; Chart?: any; }
}

Chart.register(...registerables);
(window as any).Chart = Chart;

const root = document.getElementById('app');

function el<K extends keyof HTMLElementTagNameMap>(tag: K, opts?: { className?: string; text?: string; attrs?: Record<string, string> }) {
  const e = document.createElement(tag);
  if (opts?.className) e.className = opts.className;
  if (opts?.text) e.textContent = opts.text;
  if (opts?.attrs) for (const [k, v] of Object.entries(opts.attrs)) e.setAttribute(k, v);
  return e;
}

function fmtMs(ms?: number) { return typeof ms === 'number' ? `${ms.toLocaleString()} ms` : '—'; }

function particleField(container: HTMLElement, count = 48) {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  container.classList.add('particles');
  for (let i = 0; i < count; i++) {
    const p = el('span', { className: 'particle' });
    const left = Math.random() * 100;
    const size = 2 + Math.random() * 3;
    const delay = Math.random() * 16;
    const dur = 10 + Math.random() * 24;
    p.style.left = `${left}vw`;
    p.style.top = `${100 + Math.random() * 60}vh`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.animationDelay = `${delay}s`;
    p.style.setProperty('--spd', `${dur}s`);
    container.appendChild(p);
  }
}

function kpi(label: string, value: string, cls = '') {
  const box = el('div', { className: `kpi neumorph ${cls}` });
  const l = el('div', { className: 'kpi-label', text: label });
  const v = el('div', { className: 'kpi-value countup', text: value });
  box.appendChild(l); box.appendChild(v);
  return box;
}

function render(run: any) {
  if (!root) return;
  root.innerHTML = '';

  // Background grid overlay
  const gridWrap = el('div', { className: 'grid-bg' });
  root.appendChild(gridWrap);

  // Particles layer
  particleField(gridWrap, 60);

  // Header
  const header = el('header', { className: 'holo-header glass tilt reveal' });
  const brand = el('div', { className: 'cn-brand' });
  const title = el('h1', { className: 'holo-title', text: 'CyNova – Sci‑Fi Test Dashboard' });
  brand.appendChild(el('div', { className: 'cn-logo', text: '✦' }));
  brand.appendChild(el('div', { className: 'cn-title' }));
  (brand.lastChild as HTMLElement).appendChild(title);
  (brand.lastChild as HTMLElement).appendChild(el('div', { className: 'cn-sub', text: run?.generatedAt || '' }));

  const actions = el('div', { className: 'holo-badges' });
  actions.appendChild(el('span', { className: 'badge', text: 'alpha' }));
  actions.appendChild(el('span', { className: 'badge', attrs: { id: 'liveBadge' }, text: 'LIVE: off' }));
  actions.appendChild(el('button', { className: 'theme-toggle', attrs: { id: 'themeToggle' }, text: 'Theme' }));
  actions.appendChild(el('button', { className: 'btn', attrs: { id: 'toggleConstellation' }, text: 'Constellation' }));
  actions.appendChild(el('button', { className: 'btn', attrs: { id: 'micBtn' }, text: 'Mic' }));

  header.appendChild(brand);
  header.appendChild(actions);
  root.appendChild(header);

  const container = el('main', { className: 'cn-container' });
  const grid = el('div', { className: 'cn-grid' });
  container.appendChild(grid);

  // Left column: Summary + Specs
  const colLeft = el('div');
  const summaryCard = el('section', { className: 'card glass reveal delay-1' });
  const sH = el('div', { className: 'card-h' });
  sH.appendChild(el('h2', { text: 'Run Summary' }));
  summaryCard.appendChild(sH);
  const sB = el('div', { className: 'card-b' });

  // KPIs
  const kpis = el('div', { className: 'summary-kpis' });
  const totals = run?.totals || { tests: 0, passed: 0, failed: 0, skipped: 0, pending: 0, durationMs: 0 };
  kpis.appendChild(kpi('Tests', String(totals.tests), ''));
  kpis.appendChild(kpi('Passed', String(totals.passed), 'kpi-pass'));
  kpis.appendChild(kpi('Failed', String(totals.failed), 'kpi-fail'));
  kpis.appendChild(kpi('Skipped', String(totals.skipped), 'kpi-skip'));
  kpis.appendChild(kpi('Duration', fmtMs(totals.durationMs as number), ''));
  sB.appendChild(kpis);

  // Health class on body
  try {
    const tests = totals.tests || 0; const pass = totals.passed || 0; const fail = totals.failed || 0;
    const rate = tests ? pass / tests : 0;
    document.body.classList.remove('health-good','health-mid','health-bad');
    document.body.classList.add(rate >= 0.8 && fail === 0 ? 'health-good' : rate >= 0.5 ? 'health-mid' : 'health-bad');
  } catch {}

  // Chart canvas expected by enhance.js
  const canvasWrap = el('div', { attrs: { id: 'chartWrap', style: 'height:220px' } });
  const canvas = el('canvas', { attrs: { id: 'cn-summary-chart' } });
  canvasWrap.appendChild(canvas);
  sB.appendChild(canvasWrap);
  summaryCard.appendChild(sB);
  colLeft.appendChild(summaryCard);

  // Specs card
  const specsCard = el('section', { className: 'card glass reveal delay-2' });
  const spH = el('div', { className: 'card-h' });
  spH.appendChild(el('h2', { text: 'Specs & Tests' }));
  specsCard.appendChild(spH);
  const spB = el('div', { className: 'card-b' });
  const specList = el('ul', { className: 'spec-list', attrs: { id: 'specList' } });

  let order = 0;
  (run?.specs || []).forEach((spec: any) => {
    const li = el('li', { className: 'spec', attrs: { 'data-spec': spec.specRelative || '' } });
    const h = el('div', { className: 'spec-h' });
    h.appendChild(el('div', { className: 'spec-name', text: spec.specRelative || 'unknown.spec' }));
    const meta = `${(spec.tests||[]).length} tests • ${fmtMs(spec.durationMs as number)}`;
    h.appendChild(el('div', { className: 'spec-meta', text: meta }));
    li.appendChild(h);

    const tests = el('ul', { className: 'tests' });
    (spec.tests || []).forEach((t: any) => {
      const st = t.state || 'unknown';
      const dur = typeof t.wallClockDurationMs === 'number' ? t.wallClockDurationMs : (t.attempts && t.attempts[0] && t.attempts[0].durationMs) || '';
      const titleText = t.displayTitle || (t.title ? t.title.join(' › ') : '');
      const ti = el('li', { className: `test state-${st}` , attrs: { 'data-state': st, 'data-duration': String(dur || ''), 'data-order': String(order++) } });
      const titleEl = el('span', { className: 'test-title', text: titleText });
      titleEl.setAttribute('data-text', titleText);
      const stateEl = el('span', { className: 'pill test-state', text: st });
      stateEl.setAttribute('data-text', st);
      ti.appendChild(titleEl);
      ti.appendChild(stateEl);
      tests.appendChild(ti);
    });
    li.appendChild(tests);
    specList.appendChild(li);
  });
  spB.appendChild(specList);
  specsCard.appendChild(spB);
  colLeft.appendChild(specsCard);

  // Right column: Controls
  const colRight = el('div');
  const controls = el('section', { className: 'card glass reveal delay-3' });
  const cH = el('div', { className: 'card-h' });
  cH.appendChild(el('h2', { text: 'Controls' }));
  controls.appendChild(cH);
  const cB = el('div', { className: 'card-b cn-controls' });

  const row1 = el('div', { className: 'controls-row' });
  const search = el('input', { className: 'input', attrs: { id: 'searchBox', placeholder: 'Search tests (press / to focus)…', type: 'search' } });
  row1.appendChild(search);
  const browser = el('select', { className: 'input', attrs: { id: 'browserSelect' } });
  browser.appendChild(el('option', { text: 'All browsers', attrs: { value: 'all' } }));
  if (run?.browser?.name) browser.appendChild(el('option', { text: run.browser.name, attrs: { value: run.browser.name } }));
  row1.appendChild(browser);
  cB.appendChild(row1);

  const row2 = el('div', { className: 'controls-row filters' });
  const statuses: Array<{v:string;label:string}> = [
    { v: 'all', label: 'All' },
    { v: 'passed', label: 'Passed' },
    { v: 'failed', label: 'Failed' },
    { v: 'pending', label: 'Pending' },
    { v: 'skipped', label: 'Skipped' },
  ];
  statuses.forEach((s, idx) => {
    const id = `st-${s.v}`;
    const wrap = el('label', { className: 'pill' });
    const radio = el('input', { attrs: { type: 'radio', name: 'status', value: s.v, id } });
    if (idx === 0) (radio as HTMLInputElement).checked = true;
    wrap.appendChild(radio);
    wrap.appendChild(el('span', { text: s.label }));
    row2.appendChild(wrap);
  });
  cB.appendChild(row2);

  const row3 = el('div', { className: 'controls-row' });
  row3.appendChild(el('input', { className: 'input', attrs: { id: 'durMin', type: 'number', placeholder: 'Min ms' } }));
  row3.appendChild(el('input', { className: 'input', attrs: { id: 'durMax', type: 'number', placeholder: 'Max ms' } }));
  row3.appendChild(el('input', { className: 'input', attrs: { id: 'tagsBox', type: 'text', placeholder: 'Tags (comma separated)' } }));
  cB.appendChild(row3);

  const row4 = el('div', { className: 'controls-row btn-group' });
  row4.appendChild(el('button', { className: 'btn', attrs: { id: 'expandAll' }, text: 'Expand all (E)' }));
  row4.appendChild(el('button', { className: 'btn', attrs: { id: 'collapseAll' }, text: 'Collapse all (C)' }));
  row4.appendChild(el('button', { className: 'btn', attrs: { id: 'exportJson' }, text: 'Export JSON' }));
  row4.appendChild(el('button', { className: 'btn', attrs: { id: 'exportCsv' }, text: 'Export CSV' }));
  row4.appendChild(el('button', { className: 'btn', attrs: { id: 'exportPdf' }, text: 'Print / PDF' }));
  cB.appendChild(row4);

  // Timeline scrubber row
  const row5 = el('div', { className: 'controls-row scrubber-row' });
  row5.appendChild(el('span', { className: 'pill', text: 'Timeline' }));
  const tl = el('input', { className: 'input', attrs: { id: 'timelineScrubber', type: 'range', min: '0', max: String(totals.tests || 0), value: String(totals.tests || 0) } });
  row5.appendChild(tl);
  row5.appendChild(el('span', { className: 'pill', attrs: { id: 'tlCount' }, text: `${totals.tests || 0}/${totals.tests || 0}` }));
  cB.appendChild(row5);

  controls.appendChild(cB);
  colRight.appendChild(controls);

  // Achievements card
  const achieve = el('section', { className: 'card glass reveal delay-3' });
  const aH = el('div', { className: 'card-h' }); aH.appendChild(el('h2', { text: 'Achievements' })); achieve.appendChild(aH);
  const aB = el('div', { className: 'card-b' }); const achWrap = el('div', { className: 'achievements' });
  const addBadge = (txt: string) => achWrap.appendChild(el('span', { className: 'ach-badge', text: txt }));
  if ((totals.failed || 0) === 0 && (totals.tests || 0) > 0) addBadge('Zero Failures');
  if ((totals.passed || 0) === (totals.tests || 0) && (totals.tests || 0) > 0) addBadge('Perfect Run');
  if ((totals.durationMs || 0) < 2000) addBadge('Blazing Fast');
  if ((totals.skipped || 0) === 0 && (totals.pending || 0) === 0) addBadge('All Executed');
  if (achWrap.childElementCount === 0) addBadge('Keep Going!');
  aB.appendChild(achWrap); achieve.appendChild(aB);
  colRight.appendChild(achieve);

  grid.appendChild(colLeft);
  grid.appendChild(colRight);
  root.appendChild(container);
}

async function load() {
  if (!root) return;
  // Holographic overlays and ambient layers
  const body = document.body;
  if (!document.getElementById('cn-progress')) { const pr = document.createElement('div'); pr.id='cn-progress'; const bar=document.createElement('div'); bar.className='bar'; pr.appendChild(bar); body.appendChild(pr); }
  if (!document.getElementById('loadingOverlay')) { const o=document.createElement('div'); o.id='loadingOverlay'; const r=document.createElement('div'); r.className='ring'; const hint=document.createElement('div'); hint.className='hint'; hint.textContent='Initializing CyNova'; o.appendChild(r); o.appendChild(hint); body.appendChild(o);} 
  if (!document.getElementById('cn-constellation')) { const c=document.createElement('canvas'); c.id='cn-constellation'; body.appendChild(c);} 
  if (!document.getElementById('cursorDot')) { const d=document.createElement('div'); d.id='cursorDot'; body.appendChild(d);} 
  try { const pr = document.getElementById('cn-progress'); pr && pr.style.setProperty('--p','10%'); } catch {}
  let run: any;
  try {
    const res = await fetch('cynova-summary.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Not found');
    run = await res.json();
  } catch {
    // Fallback demo data
    run = {
      tool: 'CyNova',
      version: 'dev',
      generatedAt: new Date().toISOString(),
      browser: { name: 'Chrome' },
      totals: { tests: 5, passed: 3, failed: 1, pending: 0, skipped: 1, durationMs: 1234 },
      specs: [
        { specRelative: 'specs/example.cy.ts', durationMs: 800, tests: [
          { displayTitle: 'loads the home page', state: 'passed', attempts: [{ attempt: 1, durationMs: 120 }] },
          { displayTitle: 'shows results', state: 'failed', attempts: [{ attempt: 1, durationMs: 300 }] },
          { displayTitle: 'skips a step', state: 'skipped', attempts: [{ attempt: 1, durationMs: 0 }] },
        ]},
        { specRelative: 'specs/another.cy.ts', durationMs: 434, tests: [
          { displayTitle: 'can search', state: 'passed', attempts: [{ attempt: 1, durationMs: 200 }] },
          { displayTitle: 'can filter', state: 'passed', attempts: [{ attempt: 1, durationMs: 214 }] },
        ]},
      ],
    };
  }

  (window as any).__CYNOVA__ = run;
  render(run);
  // Lazily load enhance.js to wire interactions and charts
  await import('./enhance.js');
}

load();
