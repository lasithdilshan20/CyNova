const root = document.getElementById('app');

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  return e;
}

async function load() {
  if (!root) return;
  const title = el('h2', 'Run Summary');
  root.appendChild(title);

  const info = el(
    'p',
    'Place your generated "cynova-summary.json" next to this index.html to see results.',
  );
  info.style.opacity = '0.8';
  root.appendChild(info);

  try {
    const res = await fetch('cynova-summary.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Not found');
    const json = await res.json();
    const pre = el('pre');
    pre.textContent = JSON.stringify(json, null, 2);
    root.appendChild(pre);
  } catch {
    const note = el(
      'div',
      'No summary file found. After running Cypress with CyNova, copy the summary file here.',
    );
    note.style.marginTop = '1rem';
    root.appendChild(note);
  }
}

load();
