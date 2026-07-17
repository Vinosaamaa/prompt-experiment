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
const horror = join(root, 'bridge-horror-house');
if (existsSync(join(horror, 'package.json'))) {
  console.log('Building bridge-horror-house…');
  run('npm', ['ci'], horror);
  run('npm', ['run', 'build'], horror);
}

// Copy lab shell
for (const f of ['index.html', 'experiments.json', 'AGENTS.md']) {
  const src = join(root, f);
  if (existsSync(src)) cpSync(src, join(out, f));
}

// Static experiments
const geo = join(root, 'geometry-dash-autoplay');
if (existsSync(geo)) {
  cpSync(geo, join(out, 'geometry-dash-autoplay'), { recursive: true });
}

// Built horror game → /bridge-horror-house/
const horrorDist = join(horror, 'dist');
if (existsSync(horrorDist)) {
  cpSync(horrorDist, join(out, 'bridge-horror-house'), { recursive: true });
} else {
  console.warn('Warning: bridge-horror-house/dist missing — skipping');
}

// Cloudflare: SPA-ish fallback not needed; add headers for COOP optional
writeFileSync(join(out, '_headers'), `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`);

console.log('Publish folder ready:', out);
console.log(readFileSync(join(out, 'experiments.json'), 'utf8'));
