#!/usr/bin/env node
/**
 * Faz 6 adım adım test.
 * Kullanım: npm run test:faz6
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

async function check(label, path, expect = 200, init) {
  const res = await fetch(`${BASE}${path}`, init);
  const ok = res.status === expect;
  console.log(`${ok ? '✓' : '✗'} ${label} — ${path} [${res.status}]`);
  return ok;
}

function runStep(name, cmd, args) {
  console.log(`\n── ${name} ──`);
  const r = spawnSync(cmd, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ROOMIO_URL: BASE },
  });
  return r.status === 0;
}

console.log(`Faz 6 adım testi → ${BASE}\n`);

let ok = true;

console.log('── Adım 6.1 Production deploy ──');
ok = runStep('Deploy dosyaları', 'npm', ['run', 'test:deploy']) && ok;

console.log('\n── Adım 6.2 Canlı entegrasyon durumu ──');
{
  const res = await fetch(`${BASE}/api/integrations/status`);
  const j = await res.json().catch(() => ({}));
  const modeOk = res.ok && (j.mode === 'simulated' || j.mode === 'live');
  console.log(`${modeOk ? '✓' : '✗'} Integration status mode=${j.mode ?? '?'} [${res.status}]`);
  ok = modeOk && ok;
}

if (process.env.ROOMIO_INTEGRATION_LIVE === '1' || process.env.ROOMIO_INTEGRATION_LIVE === 'true') {
  ok = runStep('Canlı cihaz testleri', 'npm', ['run', 'test:integrations:live']) && ok;
} else {
  console.log('ℹ ROOMIO_INTEGRATION_LIVE=1 değil — canlı cihaz testi atlandı');
}

console.log('\n── Adım 6.3 Sentry monitoring ──');
{
  const res = await fetch(`${BASE}/api/monitoring/status`);
  const j = await res.json().catch(() => ({}));
  const monOk = res.ok && j.sentry?.detail;
  console.log(`${monOk ? '✓' : '✗'} Monitoring status — ${j.sentry?.detail ?? 'yok'} [${res.status}]`);
  ok = monOk && ok;
}

console.log('\n── Adım 6.4 HK push (VAPID) ──');
ok = (await check('Push VAPID', '/api/push/vapid-public-key')) && ok;
{
  const res = await fetch(`${BASE}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test', body: 'Faz 6' }),
  });
  const expected = await expectedPushSendStatus(BASE);
  const pushOk = res.status === expected;
  console.log(`${pushOk ? '✓' : '✗'} Push send — /api/push/send [${res.status}] (beklenen ${expected})`);
  ok = pushOk && ok;
}

console.log('\n── Adım 6.5 Şablon paylaşım API ──');
{
  const listRes = await fetch(`${BASE}/api/reports/templates?kind=report`, {
    headers: { 'x-roomio-property': 'prop-sapphire-ist' },
  });
  const list = await listRes.json().catch(() => ({}));
  const tpl = list.templates?.[0];
  if (!tpl) {
    console.log('✗ Share API — şablon bulunamadı');
    ok = false;
  } else {
    const shareRes = await fetch(`${BASE}/api/reports/templates/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-roomio-property': 'prop-sapphire-ist',
      },
      body: JSON.stringify({ templateId: tpl.id, targetPropertyIds: ['prop-sapphire-ant'] }),
    });
    const share = await shareRes.json().catch(() => ({}));
    const shareOk = shareRes.ok && share.ok === true && (share.count ?? 0) >= 1;
    console.log(`${shareOk ? '✓' : '✗'} Share API — ${tpl.name} → Antalya [${shareRes.status}]`);
    ok = shareOk && ok;
  }
}

console.log('\n── Adım 6.5 UI (rapor tasarım) ──');
{
  const res = await fetch(`${BASE}/reports?tab=design`);
  const html = await res.text();
  const uiOk = res.ok && html.includes('Paylaş');
  console.log(`${uiOk ? '✓' : '✗'} Share UI — /reports?tab=design`);
  ok = uiOk && ok;
}

console.log('\n── Faz 5 smoke ──');
ok = runStep('Faz 5 regresyon', 'npm', ['run', 'test:faz5']) && ok;

console.log(ok ? '\n✅ Faz 6 adımları geçti' : '\n❌ Bazı Faz 6 adımları başarısız');
process.exit(ok ? 0 : 1);
