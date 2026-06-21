#!/usr/bin/env node
/** Çalışan Roomio portunu bulur ve tarayıcıda açar. */
import { execSync, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseUrlForPort, ensureRoomioServer } from './roomio-port.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const port = await ensureRoomioServer();
const url = baseUrlForPort(port);

console.log(`\n✓ Roomio açılıyor → ${url}\n`);
if (port !== 3100) {
  console.log(`  Not: http://127.0.0.1:3100 eski/hatalı — ${url} kullanın.\n`);
}

try {
  execSync(`open -a "Google Chrome" ${JSON.stringify(url)}`, { stdio: 'ignore' });
} catch {
  try {
    execSync(`open ${JSON.stringify(url)}`, { stdio: 'ignore' });
  } catch {
    console.log(`  Tarayıcı otomatik açılamadı — adresi elle açın: ${url}\n`);
  }
}

// Arka planda hızlı smoke (404 avcılığı)
spawnSync('node', ['scripts/test-faz4-steps.mjs'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, ROOMIO_URL: url.replace(/\/$/, '') },
});
