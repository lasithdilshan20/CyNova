#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const outDir = path.resolve(root, 'templates');
fs.mkdirSync(outDir, { recursive: true });

const srcs = [
  path.resolve(root, 'src', 'web', 'report.hbs'),
  path.resolve(root, 'src', 'web', 'report.css'),
  path.resolve(root, 'src', 'web', 'enhance.js'),
];

for (const src of srcs) {
  const base = path.basename(src);
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outDir, base));
      // eslint-disable-next-line no-console
      console.log(`[cynova] Copied ${base} -> templates/`);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[cynova] Warning: missing ${src}, skipping.`);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[cynova] Failed to copy ${base}:`, e);
    process.exitCode = 1;
  }
}
