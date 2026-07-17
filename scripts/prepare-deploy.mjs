#!/usr/bin/env node
/**
 * Assemble a static publish folder for Cloudflare Pages.
 * Output: .cf-pages/
 */
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '.cf-pages');

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status || 1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// Build Vite experiment(s)
const viteApps = ['bridge-horror-house', 'jack-3d-portfolio'];
for (const name of viteApps) {
  const dir = join(root, name);
  if (existsSync(join(dir, 'package.json'))) {
    console.log(`Building ${name}…`);
    run('npm', ['ci'], dir);
    run('npm', ['run', 'build'], dir);
  }
}

// Copy lab shell
for (const f of ['index.html', 'experiments.json', 'AGENTS.md', 'README.md']) {
  const src = join(root, f);
  if (existsSync(src)) cpSync(src, join(out, f));
}

// Static experiments
const geo = join(root, 'geometry-dash-autoplay');
if (existsSync(geo)) {
  cpSync(geo, join(out, 'geometry-dash-autoplay'), { recursive: true });
}

// Built Vite apps → /name/
for (const name of viteApps) {
  const dist = join(root, name, 'dist');
  if (existsSync(dist)) {
    cpSync(dist, join(out, name), { recursive: true });
  } else {
    console.warn(`Warning: ${name}/dist missing — skipping`);
  }
}

// Cloudflare: SPA-ish fallback not needed; add headers for COOP optional
writeFileSync(join(out, '_headers'), `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`);

console.log('Publish folder ready:', out);
console.log(readFileSync(join(out, 'experiments.json'), 'utf8'));
