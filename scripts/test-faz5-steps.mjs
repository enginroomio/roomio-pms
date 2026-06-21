#!/usr/bin/env node
/**
 * Faz 5 adım adım test.
 * Kullanım: npm run test:faz5
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expectedPushSendStatus } from './push-test-helper.mjs';

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

async function check(label, path, expect = 200) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'follow' });
  const ok = res.status === expect;
  console.log(`${ok ? '✓' : '✗'} ${label} — ${path} [${res.status}]`);
  return ok;
}

function runStep(name, cmd, args) {
  console.log(`\n── ${name} ──`);
  const r = spawnSync(cmd, args, { cwd: process.cwd(), stdio: 'inherit', shell: true, env: { ...process.env, ROOMIO_URL: BASE } });
  return r.status === 0;
}

console.log(`Faz 5 adım testi → ${BASE}\n`);

let ok = true;

console.log('── Adım 5.1 Production deploy ──');
ok = runStep('Docker/compose doğrulama', 'npm', ['run', 'test:docker']) && ok;

console.log('\n── Adım 5.2 Canlı entegrasyon durumu ──');
ok = (await check('Integrations status', '/api/integrations/status')) && ok;

console.log('\n── Adım 5.3 Monitoring ──');
const health = await fetch(`${BASE}/api/health`).then((r) => r.json()).catch(() => ({}));
const monOk = health?.checks?.monitoring?.ok === true;
console.log(`${monOk ? '✓' : '✗'} Health monitoring — ${health?.checks?.monitoring?.detail ?? 'yok'}`);
ok = monOk && ok;

console.log('\n── Adım 5.4 HK push API ──');
ok = (await check('Push VAPID', '/api/push/vapid-public-key')) && ok;
{
  const expected = await expectedPushSendStatus(BASE);
  const res = await fetch(`${BASE}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const pushOk = res.status === expected;
  console.log(`${pushOk ? '✓' : '✗'} Push send — /api/push/send [${res.status}] (beklenen ${expected})`);
  ok = pushOk && ok;
}

console.log('\n── Adım 5.5 Şablon paylaşım API ──');
ok = (await check('Templates list', '/api/reports/templates')) && ok;

console.log('\n── Genel smoke (Faz 4) ──');
ok = runStep('Otomatik smoke', 'npm', ['run', 'test:faz4']) && ok;

console.log(ok ? '\n✅ Faz 5 adımları geçti' : '\n❌ Bazı Faz 5 adımları başarısız');
process.exit(ok ? 0 : 1);
