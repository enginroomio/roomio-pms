#!/usr/bin/env node
/**
 * Bulut yedek API smoke (demo admin header veya JWT).
 * Kullanım: ROOMIO_URL=http://127.0.0.1:3100 node scripts/test-cloud-backup-api.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const ADMIN_EMAIL = process.env.ROOMIO_ADMIN_EMAIL ?? 'admin@roomio.local';
const ADMIN_PASSWORD = process.env.ROOMIO_CHECKLIST_PASSWORD ?? 'roomio123';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

async function json(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

let token;
async function authed(method, path, body) {
  if (!token) {
    const login = await json('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    if (login.ok && login.data.token) token = login.data.token;
  }
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : { 'x-roomio-demo-role': 'admin' };
  return json(method, path, body, headers);
}

const tests = [
  { name: 'config GET', run: () => authed('GET', '/api/cloud-backup/config') },
  { name: 'backup run', run: () => authed('POST', '/api/cloud-backup/run', {}) },
  { name: 'history GET', run: () => authed('GET', '/api/cloud-backup/history?limit=2') },
  { name: 'prune POST', run: () => authed('POST', '/api/cloud-backup/prune', {}) },
];

let passed = 0;
console.log(`Cloud backup API → ${BASE}\n`);

for (const t of tests) {
  try {
    const r = await t.run();
    const ok = r.ok && (t.name === 'config GET' ? r.data.provider : r.data.ok !== false || typeof r.data.removed === 'number');
    console.log(ok ? `✓ ${t.name}` : `✗ ${t.name} (${r.status})`);
    if (ok) passed += 1;
  } catch (e) {
    console.log(`✗ ${t.name} — ${e instanceof Error ? e.message : 'error'}`);
  }
}

console.log(`\n${passed}/${tests.length} geçti`);
process.exit(passed === tests.length ? 0 : 1);
