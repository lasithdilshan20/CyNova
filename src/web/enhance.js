(function () {
  const data = (typeof window !== 'undefined' && window.__CYNOVA__) || {};

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

  // Charts
  try {
    if (window.Chart && data && data.totals) {
      const ctx = document.getElementById('cn-summary-chart');
      if (ctx) {
        new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Passed', 'Failed', 'Pending', 'Skipped'],
            datasets: [
              {
                label: 'Tests',
                data: [data.totals.passed || 0, data.totals.failed || 0, data.totals.pending || 0, data.totals.skipped || 0],
                backgroundColor: ['#27d17f', '#ff6b6b', '#f7b955', '#9c9c9c'],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted') } },
              y: { beginAtZero: true, ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted') } },
            },
            plugins: {
              legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted') } },
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

  function applyFilter() {
    const status = /** @type {HTMLInputElement|null} */ (document.querySelector('input[name="status"]:checked'));
    const wanted = status ? status.value : 'all';
    const q = normalize(searchBox ? searchBox.value : '');

    if (!specList) return;
    const specItems = specList.querySelectorAll('.spec');
    specItems.forEach((spec) => {
      const specName = normalize(spec.getAttribute('data-spec'));
      let anyVisible = false;
      spec.querySelectorAll('.test').forEach((t) => {
        const state = t.getAttribute('data-state') || '';
        const titleEl = t.querySelector('.test-title');
        const title = normalize(titleEl ? titleEl.textContent : '');
        const matchState = wanted === 'all' || state === wanted;
        const matchText = !q || title.includes(q) || specName.includes(q);
        const show = matchState && matchText;
        t.toggleAttribute('hidden', !show);
        if (show) anyVisible = true;
      });
      spec.toggleAttribute('hidden', !anyVisible && !!q);
    });
  }

  if (searchBox) searchBox.addEventListener('input', applyFilter);
  statusRadios.forEach((r) => r.addEventListener('change', applyFilter));
})();
