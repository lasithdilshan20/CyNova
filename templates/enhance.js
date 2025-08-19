(function () {
  let data = (typeof window !== 'undefined' && window.__CYNOVA__) || {};

  // Theme toggle with localStorage
  const root = document.documentElement;
  const THEME_KEY = 'cynova-theme';
  function applyTheme(v) {
    if (!v || v === 'auto') {
      root.setAttribute('data-theme', 'auto');
      localStorage.removeItem(THEME_KEY);
    } else if (v === 'light') {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem(THEME_KEY, v);
    } else if (v === 'dark') {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem(THEME_KEY, v);
    }
  }
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) applyTheme(saved);

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const cur = root.getAttribute('data-theme') || 'auto';
      const next = cur === 'auto' ? 'light' : cur === 'light' ? 'dark' : 'auto';
      applyTheme(next);
    });
  }

  function updateKpis() {
    try {
      const kpis = {
        tests: document.querySelector('.summary-kpis .kpi:nth-child(1) .kpi-value'),
        passed: document.querySelector('.summary-kpis .kpi:nth-child(2) .kpi-value'),
        failed: document.querySelector('.summary-kpis .kpi:nth-child(3) .kpi-value'),
        skipped: document.querySelector('.summary-kpis .kpi:nth-child(4) .kpi-value'),
        duration: document.querySelector('.summary-kpis .kpi:nth-child(5) .kpi-value'),
      };
      if (kpis.tests && data?.totals) kpis.tests.textContent = String(data.totals.tests || 0);
      if (kpis.passed && data?.totals) kpis.passed.textContent = String(data.totals.passed || 0);
      if (kpis.failed && data?.totals) kpis.failed.textContent = String(data.totals.failed || 0);
      if (kpis.skipped && data?.totals) kpis.skipped.textContent = String(data.totals.skipped || 0);
      if (kpis.duration && data?.totals) kpis.duration.textContent = String(data.totals.durationMs || 0) + ' ms';
    } catch {}
  }

  // Charts
  try {
    if (window.Chart && data && data.totals) {
      const ctx = document.getElementById('cn-summary-chart');
      if (ctx) {
        try { if (ctx instanceof HTMLCanvasElement) { ctx.width = 360; ctx.height = 220; } } catch {}
        new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Passed', 'Failed', 'Pending', 'Skipped'],
            datasets: [
              {
                label: 'Tests',
                data: [data.totals.passed || 0, data.totals.failed || 0, data.totals.pending || 0, data.totals.skipped || 0],
                backgroundColor: ['#12f0a1', '#ff5c8a', '#ffd166', '#9aa0aa'],
                borderColor: ['rgba(18,240,161,0.6)','rgba(255,92,138,0.6)','rgba(255,209,102,0.6)','rgba(154,160,170,0.6)'],
                borderWidth: 2,
                hoverOffset: 0,
              },
            ],
          },
          options: {
            responsive: false,
            maintainAspectRatio: true,
            cutout: '60%',
            animation: false,
            plugins: {
              legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted') } },
              tooltip: { enabled: true },
            },
          },
        });
      }
    }
  } catch {}

  // Filtering and search
  const specList = document.getElementById('specList');
  const searchBox = document.getElementById('searchBox');
  const statusRadios = document.querySelectorAll('input[name="status"]');

  function normalize(s) {
    return (s || '').toLowerCase();
  }

  function getUrlParams() {
    try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); }
  }
  function setUrlParams(params) {
    try {
      const url = new URL(window.location.href);
      url.search = params.toString();
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }
  function highlight(el, query) {
    if (!el) return;
    const text = el.textContent || '';
    if (!query) { el.innerHTML = text; return; }
    const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
    el.innerHTML = text.replace(re, (m) => `<span class="hl">${m}</span>`);
  }

  function applyFilter() {
    const status = /** @type {HTMLInputElement|null} */ (document.querySelector('input[name="status"]:checked'));
    const wanted = status ? status.value : 'all';
    const q = normalize(searchBox ? searchBox.value : '');
    const durMinEl = document.getElementById('durMin');
    const durMaxEl = document.getElementById('durMax');
    const tagsEl = document.getElementById('tagsBox');
    const browserEl = document.getElementById('browserSelect');
    const dmin = durMinEl ? Number(durMinEl.value) : NaN;
    const dmax = durMaxEl ? Number(durMaxEl.value) : NaN;
    const tags = (tagsEl && tagsEl.value ? String(tagsEl.value) : '')
      .split(',')
      .map((s) => normalize(s.trim()))
      .filter(Boolean);
    const browserSel = browserEl ? browserEl.value : 'all';
    const browserOk = browserSel === 'all' || (data?.browser?.name && normalize(data.browser.name) === normalize(browserSel));

    if (!specList) return;
    if (!browserOk) {
      specList.querySelectorAll('.spec').forEach((sp) => sp.setAttribute('hidden', 'true'));
      return;
    }

    const specItems = specList.querySelectorAll('.spec');
    specItems.forEach((spec) => {
      const specName = normalize(spec.getAttribute('data-spec'));
      let anyVisible = false;
      spec.querySelectorAll('.test').forEach((t) => {
        const state = t.getAttribute('data-state') || '';
        const titleEl = t.querySelector('.test-title');
        const titleRaw = titleEl ? titleEl.textContent || '' : '';
        const title = normalize(titleRaw);
        const durAttr = t.getAttribute('data-duration');
        const dur = durAttr ? Number(durAttr) : NaN;
        const matchState = wanted === 'all' || state === wanted;
        const matchText = !q || title.includes(q) || specName.includes(q);
        const matchDurMin = isNaN(dmin) || (!isNaN(dur) && dur >= dmin);
        const matchDurMax = isNaN(dmax) || (!isNaN(dur) && dur <= dmax);
        const matchTags = !tags.length || tags.some((tg) => title.includes(tg) || specName.includes(tg));
        const show = matchState && matchText && matchDurMin && matchDurMax && matchTags;
        t.toggleAttribute('hidden', !show);
        if (titleEl) highlight(titleEl, q);
        if (show) anyVisible = true;
      });
      spec.toggleAttribute('hidden', !anyVisible && !!(q || !isNaN(dmin) || !isNaN(dmax) || tags.length));
    });

    // update URL state
    const params = getUrlParams();
    if (q) params.set('q', q); else params.delete('q');
    if (wanted && wanted !== 'all') params.set('status', wanted); else params.delete('status');
    if (!isNaN(dmin)) params.set('dmin', String(dmin)); else params.delete('dmin');
    if (!isNaN(dmax)) params.set('dmax', String(dmax)); else params.delete('dmax');
    if (tags.length) params.set('tags', tags.join(',')); else params.delete('tags');
    if (browserSel && browserSel !== 'all') params.set('browser', browserSel); else params.delete('browser');
    setUrlParams(params);
  }

  if (searchBox) searchBox.addEventListener('input', applyFilter);
  statusRadios.forEach((r) => r.addEventListener('change', applyFilter));

  // Live server client (opt-in via ?live=1)
  try {
    const params = new URLSearchParams(window.location.search);
    const enabled = params.get('live') === '1' || params.get('live') === 'true';
    const badge = document.getElementById('liveBadge');
    if (enabled && badge) {
      const host = params.get('host') || window.location.hostname || '127.0.0.1';
      const port = params.get('port') || '9777';
      const ws = new WebSocket(`ws://${host}:${port}`);
      badge.textContent = 'LIVE: connecting';
      ws.addEventListener('open', () => { badge.textContent = 'LIVE: on'; badge.classList.add('state-passed'); });
      ws.addEventListener('close', () => { badge.textContent = 'LIVE: off'; badge.classList.remove('state-passed'); });
      const countEl = document.getElementById('liveCount');
      let count = 0;
      ws.addEventListener('message', (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          count += 1;
          if (countEl) countEl.textContent = String(count);
          if (msg?.type === 'lifecycle') {
            if (badge) {
              const phase = msg.phase || '';
              const spec = msg.spec ? ` ${msg.spec}` : '';
              badge.textContent = `LIVE: ${phase}${spec}`;
            }
          } else if (msg?.type === 'summary' && msg.run) {
            data = msg.run;
            window.__CYNOVA__ = data;
            updateKpis();
            if (badge) badge.textContent = 'LIVE: done';
          }
        } catch {}
      });
    }
  } catch {}

  // Wire additional filter inputs
  const durMinEl = document.getElementById('durMin');
  const durMaxEl = document.getElementById('durMax');
  const tagsEl = document.getElementById('tagsBox');
  const browserEl = document.getElementById('browserSelect');
  if (durMinEl) durMinEl.addEventListener('input', applyFilter);
  if (durMaxEl) durMaxEl.addEventListener('input', applyFilter);
  if (tagsEl) tagsEl.addEventListener('input', applyFilter);
  if (browserEl) browserEl.addEventListener('change', applyFilter);

  // Collapsible spec tree
  if (specList) {
    specList.addEventListener('click', (e) => {
      const target = /** @type {HTMLElement} */(e.target);
      const header = target.closest && target.closest('.spec-h');
      if (header) {
        const spec = header.closest('.spec');
        if (spec) {
          const collapsed = spec.getAttribute('data-collapsed') === '1' ? '0' : '1';
          spec.setAttribute('data-collapsed', collapsed);
        }
      }
    });
  }
  const expandAllBtn = document.getElementById('expandAll');
  const collapseAllBtn = document.getElementById('collapseAll');
  if (expandAllBtn) expandAllBtn.addEventListener('click', () => {
    if (!specList) return;
    specList.querySelectorAll('.spec').forEach((sp) => sp.setAttribute('data-collapsed', '0'));
  });
  if (collapseAllBtn) collapseAllBtn.addEventListener('click', () => {
    if (!specList) return;
    specList.querySelectorAll('.spec').forEach((sp) => sp.setAttribute('data-collapsed', '1'));
  });

  // Exports
  function download(name, content, type = 'text/plain') {
    try {
      const blob = new Blob([content], { type });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 0);
    } catch {}
  }
  const exportJsonBtn = document.getElementById('exportJson');
  const exportCsvBtn = document.getElementById('exportCsv');
  const exportPdfBtn = document.getElementById('exportPdf');
  if (exportJsonBtn) exportJsonBtn.addEventListener('click', () => {
    download('cynova-summary.json', JSON.stringify(data || {}, null, 2), 'application/json');
  });
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => {
    try {
      const rows = [['spec','test','state','durationMs']];
      (data?.specs || []).forEach((s) => {
        (s.tests || []).forEach((t) => {
          const d = t.wallClockDurationMs || (t.attempts && t.attempts[0] && t.attempts[0].durationMs) || '';
          rows.push([s.specRelative || '', t.displayTitle || (t.title ? t.title.join(' ') : ''), t.state || '', String(d)]);
        });
      });
      const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
      download('cynova-tests.csv', csv, 'text/csv');
    } catch {}
  });
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => { try { window.print(); } catch {} });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const tag = /** @type {HTMLElement} */ (e.target);
    const typing = tag && (tag.tagName === 'INPUT' || tag.tagName === 'TEXTAREA');
    if (typing) return;
    if (e.key === '/' || e.key.toLowerCase() === 'f') {
      e.preventDefault();
      const sb = document.getElementById('searchBox');
      if (sb) { sb.focus(); sb.select && sb.select(); }
    } else if (e.key.toLowerCase() === 'e') {
      expandAllBtn && expandAllBtn.click();
    } else if (e.key.toLowerCase() === 'c') {
      collapseAllBtn && collapseAllBtn.click();
    } else if (e.key.toLowerCase() === 'x') {
      const sb = document.getElementById('searchBox');
      if (sb) sb.value = '';
      if (durMinEl) durMinEl.value = '';
      if (durMaxEl) durMaxEl.value = '';
      if (tagsEl) tagsEl.value = '';
      const all = document.querySelector('input[name="status"][value="all"]');
      if (all) all.checked = true;
      applyFilter();
    } else if (e.key.toLowerCase() === 'p') {
      e.preventDefault(); try { window.print(); } catch {}
    }
  });

  // Initialize filters from URL
  (function initFromUrl(){
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || '';
      const st = params.get('status') || 'all';
      const dmin = params.get('dmin');
      const dmax = params.get('dmax');
      const tags = params.get('tags') || '';
      const browser = params.get('browser') || 'all';
      const sb = document.getElementById('searchBox'); if (sb) sb.value = q;
      const stEl = document.querySelector(`input[name="status"][value="${st}"]`);
      if (stEl) stEl.checked = true;
      if (durMinEl && dmin) durMinEl.value = dmin;
      if (durMaxEl && dmax) durMaxEl.value = dmax;
      if (tagsEl && tags) tagsEl.value = tags;
      if (browserEl) browserEl.value = browser;
    } catch {}
    applyFilter();
  })();

  // Media overlay lazy loader
  (function setupMediaOverlay(){
    function collectMedia(specRel, testId){
      const out = [];
      try {
        const specs = (data && data.specs) || [];
        const s = specs.find((sp) => sp.specRelative === specRel);
        if (!s) return out;
        const seen = new Set();
        // test-level attempts
        const t = (s.tests || []).find((x) => x.id === testId);
        if (t) {
          (t.attempts || []).forEach((a) => {
            (a.screenshots || []).forEach((sc) => { if (sc && sc.path && !seen.has(sc.path)) { seen.add(sc.path); out.push({ type: 'img', path: sc.path }); } });
            (a.videos || []).forEach((v) => { if (v && v.path && !seen.has(v.path)) { seen.add(v.path); out.push({ type: 'video', path: v.path }); } });
          });
        }
        // spec-level fallbacks
        (s.screenshots || []).forEach((sc) => { if (sc && sc.path && !seen.has(sc.path)) { seen.add(sc.path); out.push({ type: 'img', path: sc.path }); } });
        if (s.video && s.video.path && !seen.has(s.video.path)) { seen.add(s.video.path); out.push({ type: 'video', path: s.video.path }); }
      } catch {}
      return out;
    }
    function openOverlay(items){
      const backdrop = document.createElement('div'); backdrop.className = 'cn-overlay-backdrop';
      const ov = document.createElement('div'); ov.className = 'cn-overlay glass';
      const header = document.createElement('div'); header.className = 'cn-ov-h';
      const title = document.createElement('div'); title.textContent = 'Media';
      const close = document.createElement('button'); close.className = 'btn neumorph cn-overlay-close'; close.textContent = 'Close';
      close.addEventListener('click', () => document.body.removeChild(backdrop));
      header.appendChild(title); header.appendChild(close);
      const body = document.createElement('div'); body.className = 'cn-ov-b';
      const grid = document.createElement('div'); grid.className = 'media-grid';
      if (!items.length) { const p = document.createElement('p'); p.className='muted'; p.textContent = 'No media found for this test.'; body.appendChild(p); }
      items.forEach((it) => {
        let el;
        if (it.type === 'img') { el = document.createElement('img'); el.loading = 'lazy'; el.alt = 'screenshot'; el.src = it.path; }
        else { el = document.createElement('video'); el.controls = true; el.preload = 'metadata'; const src = document.createElement('source'); src.src = it.path; el.appendChild(src); }
        grid.appendChild(el);
      });
      body.appendChild(grid);
      ov.appendChild(header); ov.appendChild(body);
      backdrop.appendChild(ov);
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) { try { document.body.removeChild(backdrop); } catch {} } });
      document.body.appendChild(backdrop);
    }
    document.addEventListener('click', (e) => {
      const t = /** @type {HTMLElement} */(e.target);
      const btn = t && t.closest && t.closest('.media-btn');
      if (!btn) return;
      const testEl = btn.closest('.test');
      const specEl = btn.closest('.spec');
      const testId = testEl && testEl.getAttribute('data-test-id');
      const specRel = specEl && specEl.getAttribute('data-spec');
      if (!testId || !specRel) return;
      const items = collectMedia(specRel, testId);
      openOverlay(items);
    });
  })();

  // Additional charts
  try {
    if (window.Chart && data) {
      const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || undefined;
      const muted = cssVar('--muted');
      // Timeline
      const tctx = document.getElementById('cn-timeline-chart');
      if (tctx && Array.isArray(data.timeline)) {
        const points = data.timeline.map((ev) => ({ x: ev.atMillis || 0, y: 0, label: ev.type, spec: ev.spec || '', details: ev.details || {}, l: ev.label || '' }));
        new window.Chart(tctx, {
          type: 'scatter',
          data: { datasets: [{ label: 'Timeline', data: points, pointRadius: 3, backgroundColor: '#6ea8fe' }] },
          options: { parsing: false, scales: { x: { type: 'linear', ticks: { color: muted } }, y: { display: false } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.raw.label} @ ${c.parsed.x}ms ${c.raw.spec ? '('+c.raw.spec+')' : ''}` } } } }
        });
      }
      // Pass rate trend
      const prctx = document.getElementById('cn-passrate-chart');
      const pr = data?.analytics?.trends?.passRatePct || [];
      if (prctx && pr.length) {
        new window.Chart(prctx, {
          type: 'line',
          data: { labels: pr.map((p) => p.runIndex), datasets: [{ label: 'Pass %', data: pr.map((p) => p.value), borderColor: '#27d17f', tension: 0.2, fill: false }] },
          options: { scales: { y: { min: 0, max: 100, ticks: { color: muted } }, x: { ticks: { color: muted } } } }
        });
      }
      // Duration histogram
      function collectDurations() {
        const arr = [];
        (data?.specs || []).forEach((s) => (s.tests || []).forEach((t) => {
          const d = t.wallClockDurationMs || (t.attempts && t.attempts[0] && t.attempts[0].durationMs);
          if (typeof d === 'number' && !isNaN(d)) arr.push(d);
        }));
        return arr;
      }
      function computeHistogram(vals, bins) {
        if (!vals.length) return { labels: [], data: [], ranges: [] };
        const min = Math.min(...vals), max = Math.max(...vals);
        const step = (max - min) / (bins || 10) || 1;
        const labels = [], dataArr = new Array(bins || 10).fill(0), ranges = [];
        for (let i=0;i<(bins||10);i++){ const a=min+i*step, b=i=== (bins||10)-1? max : min+(i+1)*step; labels.push(`${Math.round(a)}-${Math.round(b)}`); ranges.push([a,b]); }
        vals.forEach((v)=>{ let idx = Math.min(Math.floor((v - min) / step), (bins||10)-1); if (idx<0) idx=0; dataArr[idx]++; });
        return { labels, data: dataArr, ranges };
      }
      const hctx = document.getElementById('cn-histogram-chart');
      if (hctx) {
        const vals = collectDurations();
        const hist = computeHistogram(vals, 10);
        const hChart = new window.Chart(hctx, { type: 'bar', data: { labels: hist.labels, datasets: [{ label: 'Tests', data: hist.data, backgroundColor: '#6ea8fe' }] }, options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: muted } }, y: { beginAtZero: true, ticks: { color: muted } } } } });
        hctx.onclick = (evt) => {
          try {
            const points = hChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (points && points[0]) {
              const idx = points[0].index;
              const r = hist.ranges[idx];
              const dmin = document.getElementById('durMin');
              const dmax = document.getElementById('durMax');
              if (dmin && dmax) { dmin.value = String(Math.floor(r[0])); dmax.value = String(Math.ceil(r[1])); applyFilter(); }
            }
          } catch {}
        };
      }
      // Browser matrix
      const bmctx = document.getElementById('cn-browser-matrix');
      const cross = data?.analytics?.crossBrowser || {};
      const bNames = Object.keys(cross);
      if (bmctx && bNames.length) {
        const passed = bNames.map((n) => cross[n].passed || 0);
        const failed = bNames.map((n) => cross[n].failed || 0);
        new window.Chart(bmctx, { type: 'bar', data: { labels: bNames, datasets: [ { label: 'Passed', data: passed, backgroundColor: '#27d17f' }, { label: 'Failed', data: failed, backgroundColor: '#ff6b6b' } ] }, options: { responsive: true, scales: { x: { stacked: true, ticks: { color: muted } }, y: { stacked: true, beginAtZero: true, ticks: { color: muted } } } } });
      }
      // Performance trend
      const pctx = document.getElementById('cn-performance-chart');
      const td = data?.analytics?.trends?.totalDurationMs || [];
      if (pctx && td.length) {
        new window.Chart(pctx, { type: 'line', data: { labels: td.map((p) => p.runIndex), datasets: [{ label: 'Total Duration (ms)', data: td.map((p) => p.value), borderColor: '#6ea8fe', tension: 0.2, fill: false }] }, options: { scales: { x: { ticks: { color: muted } }, y: { ticks: { color: muted } } } } });
      }
    }
  } catch {}

  // Premium Interactivity Extensions
  (function premium(){
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Loading overlay + progress bar finalize
    try {
      const params = new URLSearchParams(window.location.search);
      const pb = document.getElementById('cn-progress');
      if (params.get('live') === '1' || params.get('live') === 'true') {
        pb && pb.classList.add('indeterminate');
      }
      setTimeout(() => {
        if (!(params.get('live') === '1' || params.get('live') === 'true')) {
          pb && pb.style.setProperty('--p','100%');
          const ov = document.getElementById('loadingOverlay'); if (ov && ov.parentElement) ov.parentElement.removeChild(ov);
        }
      }, 300);
      // Observe LIVE badge to end indeterminate when done
      const badge = document.getElementById('liveBadge');
      if (badge) {
        const mo = new MutationObserver(() => {
          const txt = (badge.textContent||'').toLowerCase();
          if (txt.includes('done') || txt.includes('off')) {
            pb && pb.classList.remove('indeterminate');
            pb && pb.style.setProperty('--p','100%');
            const ov = document.getElementById('loadingOverlay'); if (ov && ov.parentElement) ov.parentElement.removeChild(ov);
          }
        });
        mo.observe(badge, { childList: true, characterData: true, subtree: true });
      }
    } catch {}

    // Timeline scrubber
    (function setupScrubber(){
      try {
        const scrub = /** @type {HTMLInputElement|null} */(document.getElementById('timelineScrubber'));
        if (!scrub) return;
        const counter = document.getElementById('tlCount');
        const tests = Array.from(document.querySelectorAll('.test'));
        const total = tests.length;
        scrub.max = String(total);
        if (!scrub.value) scrub.value = String(total);
        function applyScrub(){
          const cut = Number(scrub.value||0);
          let shown = 0;
          tests.forEach((el) => {
            const ord = Number(el.getAttribute('data-order')||0);
            const show = ord < cut;
            // do not unhide if other filters hid it; only add additional hide
            if (show) {
              el.style.display = '';
              if (!el.hasAttribute('hidden')) shown++;
            } else {
              el.style.display = 'none';
            }
          });
          if (counter) counter.textContent = `${shown}/${total}`;
          const pb = document.getElementById('cn-progress');
          if (pb) pb.style.setProperty('--p', `${Math.round((Math.max(1, shown)/Math.max(1,total))*100)}%`);
        }
        scrub.addEventListener('input', applyScrub);
        // Also re-apply after filtering changes
        const inputs = [document.getElementById('searchBox'), document.getElementById('durMin'), document.getElementById('durMax'), document.getElementById('tagsBox'), document.getElementById('browserSelect')].filter(Boolean);
        inputs.forEach((n) => n && n.addEventListener('input', applyScrub));
        document.querySelectorAll('input[name="status"]').forEach((n)=> n.addEventListener('change', applyScrub));
        applyScrub();
      } catch {}
    })();

    // Swipe gestures for specs
    (function gestures(){
      try {
        const list = document.getElementById('specList'); if (!list) return;
        let sx=0, sy=0, targetSpec=null;
        list.addEventListener('touchstart', (e)=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; const el = /** @type {HTMLElement} */(e.target); targetSpec = el && el.closest && el.closest('.spec'); }, { passive: true });
        list.addEventListener('touchend', (e)=>{ if (!targetSpec) return; const t=e.changedTouches[0]; const dx = t.clientX - sx; const dy = t.clientY - sy; if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) { targetSpec.setAttribute('data-collapsed', dx < 0 ? '1' : '0'); } targetSpec=null; });
      } catch {}
    })();

    // Pinch-to-zoom for chart (disabled to prevent unintended scaling/growth)
    (function pinchZoom(){
      /* intentionally disabled */
    })();

    // Constellation network
    (function constellation(){
      const canvas = /** @type {HTMLCanvasElement|null} */(document.getElementById('cn-constellation'));
      const btn = document.getElementById('toggleConstellation');
      if (!canvas) return;
      const ctx = canvas.getContext && canvas.getContext('2d');
      let running = false;
      function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
      function collectNodes(){
        const arr = [];
        document.querySelectorAll('.test').forEach((el)=>{
          const rect = el.getBoundingClientRect();
          const x = rect.left + rect.width/2; const y = rect.top + rect.height/2;
          if (x>=0 && x<=window.innerWidth && y>=0 && y<=window.innerHeight) {
            arr.push({ x, y, state: el.getAttribute('data-state')||'unknown' });
          }
        });
        return arr;
      }
      function draw(){ if (!ctx) return; ctx.clearRect(0,0,canvas.width,canvas.height); const nodes = collectNodes(); const len = nodes.length; for (let i=0;i<len;i++){ const a=nodes[i]; for (let j=i+1;j<Math.min(i+8,len);j++){ const b=nodes[j]; const dx=a.x-b.x, dy=a.y-b.y; const d=Math.hypot(dx,dy); if (d<200 && a.state===b.state){ const alpha = 1 - (d/200); ctx.strokeStyle = a.state==='failed' ? `rgba(255,92,138,${0.35*alpha})` : a.state==='passed' ? `rgba(18,240,161,${0.25*alpha})` : `rgba(0,212,255,${0.2*alpha})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } ctx.fillStyle = 'rgba(0,212,255,0.6)'; ctx.beginPath(); ctx.arc(a.x,a.y,1.5,0,Math.PI*2); ctx.fill(); }
        if (running) requestAnimationFrame(draw);
      }
      function start(){ if (running) return; running=true; canvas.style.opacity='0.6'; resize(); draw(); }
      function stop(){ running=false; canvas.style.opacity='0'; if (ctx) ctx.clearRect(0,0,canvas.width,canvas.height); }
      window.addEventListener('resize', resize);
      window.addEventListener('scroll', ()=>{ if (running) { /* trigger redraw next frame */ } });
      if (btn) btn.addEventListener('click', ()=>{ if (running) stop(); else start(); });
    })();

    // Custom cursor + trails
    (function cursor(){
      try {
        const dot = document.getElementById('cursorDot'); if (!dot) return;
        if (prefersReduced) { dot.style.display='none'; return; }
        document.addEventListener('mousemove', (e)=>{
          dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
          const tr = document.createElement('div'); tr.className='cursor-trail'; tr.style.left = e.clientX + 'px'; tr.style.top = e.clientY + 'px';
          document.body.appendChild(tr); setTimeout(()=>{ try { document.body.removeChild(tr);} catch {} }, 600);
        });
      } catch {}
    })();

    // AR-style HUD on test hover
    (function hud(){
      let hudEl = null;
      function show(e, el){
        if (!hudEl) { hudEl = document.createElement('div'); hudEl.className='hud'; document.body.appendChild(hudEl); }
        const title = (el.querySelector('.test-title')||{}).textContent || '';
        const state = el.getAttribute('data-state')||'';
        const dur = el.getAttribute('data-duration')||'';
        hudEl.textContent = `${state.toUpperCase()} • ${dur}ms • ${title}`;
        hudEl.style.left = (e.clientX + 12) + 'px'; hudEl.style.top = (e.clientY + 12) + 'px';
      }
      document.addEventListener('mousemove', (e)=>{ const t = /** @type {HTMLElement} */(e.target); const test = t && t.closest && t.closest('.test'); if (test) show(e, test); else if (hudEl) { try { document.body.removeChild(hudEl); } catch {} hudEl=null; } });
    })();

    // Voice commands (optional)
    (function voice(){
      try {
        const btn = document.getElementById('micBtn'); if (!btn) return;
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRec) { btn.setAttribute('disabled','true'); btn.textContent = 'Mic N/A'; return; }
        let rec = null; let active=false;
        function start(){ if (active) return; rec = new SpeechRec(); rec.lang='en-US'; rec.continuous=true; rec.interimResults=false; rec.onresult=(ev)=>{ const res = ev.results[ev.results.length-1][0].transcript.toLowerCase().trim(); handle(res); }; rec.onend=()=>{ if (active) rec.start(); }; rec.start(); active=true; btn.textContent='Mic On'; }
        function stop(){ if (!active) return; try { rec && rec.stop(); } catch {} active=false; btn.textContent='Mic'; }
        function handle(cmd){ try {
          if (cmd.startsWith('search ')) { const q = cmd.slice(7); const sb = document.getElementById('searchBox'); if (sb) { sb.value = q; } applyFilter && applyFilter(); }
          else if (cmd.includes('expand all')) { const b = document.getElementById('expandAll'); b && b.click(); }
          else if (cmd.includes('collapse all')) { const b = document.getElementById('collapseAll'); b && b.click(); }
          else if (cmd.includes('filter passed')) { const r = document.querySelector('input[name="status"][value="passed"]'); if (r) { r.checked=true; } applyFilter && applyFilter(); }
          else if (cmd.includes('filter failed')) { const r = document.querySelector('input[name="status"][value="failed"]'); if (r) { r.checked=true; } applyFilter && applyFilter(); }
          else if (cmd.includes('filter all')) { const r = document.querySelector('input[name="status"][value="all"]'); if (r) { r.checked=true; } applyFilter && applyFilter(); }
          else if (cmd.includes('print')) { try { window.print(); } catch {} }
        } catch {}
        }
        btn.addEventListener('click', ()=>{ if (active) stop(); else start(); });
      } catch {}
    })();
  })();

})();
