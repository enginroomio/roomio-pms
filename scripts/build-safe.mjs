#!/usr/bin/env node
/**
 * Güvenilir production build — port temizliği + .next sıfırlama + Node 20.
 * Kullanım: npm run build:safe
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

try {
  execSync('node scripts/roomio-kill-ports.mjs', { cwd: ROOT, stdio: 'inherit' });
} catch {
  // port kill optional
}

if (existsSync(join(ROOT, '.next'))) {
  rmSync(join(ROOT, '.next'), { recursive: true, force: true });
}

const nodeBin = process.versions.node.startsWith('20.')
  ? process.execPath
  : 'npx';

const buildArgs = process.versions.node.startsWith('20.')
  ? [join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build']
  : ['-y', 'node@20.18.0', join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'];

run(nodeBin, buildArgs);
run('node', ['scripts/write-release-manifest.mjs']);
run('node', ['scripts/sync-standalone-assets.mjs']);

console.log('\n✓ build:safe tamamlandı\n');
