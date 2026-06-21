#!/usr/bin/env node
/**
 * Roomio servisleri: Next.js + syslog köprü + otomasyon döngüsü
 *
 *   npm run services
 *   PORT=3100 ROOMIO_URL=http://127.0.0.1:3100 npm run services
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const PORT = process.env.PORT ?? '3100';
const ROOMIO_URL = process.env.ROOMIO_URL ?? `http://127.0.0.1:${PORT}`;

const children = [];

function run(name, cmd, args, extraEnv = {}) {
  const child = spawn(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ROOMIO_URL, ...extraEnv },
    shell: process.platform === 'win32',
  });
  child.on('exit', (code) => {
    console.error(`[services] ${name} çıktı (kod ${code})`);
    shutdown(code ?? 1);
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const c of children) {
    try {
      c.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log(`[services] Roomio @ ${ROOMIO_URL}`);

run('next', 'npm', ['run', 'start'], { PORT });
run('syslog-bridge', 'node', ['scripts/hotspot-syslog-bridge.mjs']);
run('automation', 'node', ['scripts/hotspot-automation.mjs']);
