#!/usr/bin/env node
/**
 * Faz 7 adım adım test.
 * Kullanım: npm run test:faz7
 *         npm run test:faz7 -- --step 7.3
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expectedPushSendStatus } from './push-test-helper.mjs';

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const onlyStep = process.argv.find((a) => a.startsWith('--step'))?.split('=')[1]
  ?? (process.argv.includes('--step') ? process.argv[process.argv.indexOf('--step') + 1] : null);

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

function shouldRun(step) {
  if (!onlyStep) return true;
  return onlyStep === step || onlyStep === step.replace('Adım ', '');
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

async function check(label, path, expect = 200, init) {
  const res = await fetch(`${BASE}${path}`, init);
  const ok = res.status === expect;
  console.log(`${ok ? '✓' : '✗'} ${label} — ${path} [${res.status}]`);
  return ok;
}

console.log(`Faz 7 adım testi → ${BASE}\n`);
let ok = true;

if (shouldRun('7.1')) {
  console.log('══ Adım 7.1 Fly / Railway deploy ══');
  ok = runStep('Deploy dosyaları', 'npm', ['run', 'test:deploy']) && ok;
  ok = runStep('Fly dry-run', 'npm', ['run', 'deploy:fly']) && ok;
  const rail = existsSync('railway.toml');
  console.log(`${rail ? '✓' : '✗'} railway.toml`);
  if (!rail) ok = false;
}

if (shouldRun('7.2')) {
  console.log('\n══ Adım 7.2 Sentry production ══');
  const res = await fetch(`${BASE}/api/monitoring/status`);
  const j = await res.json().catch(() => ({}));
  const detailOk = res.ok && typeof j.sentry?.detail === 'string';
  console.log(`${detailOk ? '✓' : '✗'} Monitoring status — ${j.sentry?.detail ?? 'yok'} [${res.status}]`);
  ok = detailOk && ok;

  if (process.env.SENTRY_DSN?.trim()) {
    const ping = await fetch(`${BASE}/api/monitoring/status?test=1`);
    const pj = await ping.json().catch(() => ({}));
    const sentryOk = ping.ok && pj.sentry?.configured === true;
    console.log(`${sentryOk ? '✓' : '✗'} Sentry ping (DSN set) — active=${pj.sentry?.active}`);
    ok = sentryOk && ok;
  } else {
    console.log('ℹ SENTRY_DSN yok — production ping atlandı (health: sentry:disabled beklenir)');
  }
}

if (shouldRun('7.3')) {
  console.log('\n══ Adım 7.3 VAPID + push ══');
  ok = runStep('VAPID üretimi', 'npm', ['run', 'vapid:gen']) && ok;
  ok = (await check('Push VAPID', '/api/push/vapid-public-key')) && ok;
  const res = await fetch(`${BASE}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Faz 7', body: 'Push test' }),
  });
  const expected = await expectedPushSendStatus(BASE);
  const pushOk = res.status === expected;
  console.log(`${pushOk ? '✓' : '✗'} Push send [${res.status}] (beklenen ${expected})`);
  if (expected === 503) {
    console.log('ℹ VAPID sunucuya eklemek için: .env.vapid.generated → .env.local + restart');
  }
  ok = pushOk && ok;
}

if (shouldRun('7.4')) {
  console.log('\n══ Adım 7.4 Canlı entegrasyon ══');
  const res = await fetch(`${BASE}/api/integrations/status`);
  const j = await res.json().catch(() => ({}));
  const statusOk = res.ok && j.tesa && j.hotspot5651;
  console.log(`${statusOk ? '✓' : '✗'} Integration status API [${res.status}] mode=${j.mode}`);
  ok = statusOk && ok;

  if (process.env.ROOMIO_INTEGRATION_LIVE === '1' || process.env.ROOMIO_INTEGRATION_LIVE === 'true') {
    ok = runStep('Canlı cihaz', 'npm', ['run', 'test:integrations:live']) && ok;
  } else {
    console.log('ℹ ROOMIO_INTEGRATION_LIVE=1 değil — sahada cihaz testi atlandı');
    ok = runStep('Simülasyon smoke', 'npm', ['run', 'test:integrations']) && ok;
  }
}

if (shouldRun('7.5')) {
  console.log('\n══ Adım 7.5 Form şablon paylaşımı ══');
  const createRes = await fetch(`${BASE}/api/reports/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-roomio-property': 'prop-sapphire-ist' },
    body: JSON.stringify({
      name: 'Faz7 Form Test',
      module: 'Rezervasyon',
      columns: ['guestName', 'checkIn'],
      kind: 'form',
      pageId: 'reservations-new',
      layout: { steps: [{ id: 's1', title: 'Misafir', fields: ['guestName', 'checkIn'] }] },
    }),
  });
  const created = await createRes.json().catch(() => ({}));
  const tplId = created.template?.id;
  if (!createRes.ok || !tplId) {
    console.log('✗ Form şablon oluşturma başarısız');
    ok = false;
  } else {
    console.log(`✓ Form şablon oluşturuldu — ${tplId}`);
    const shareRes = await fetch(`${BASE}/api/reports/templates/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-roomio-property': 'prop-sapphire-ist' },
      body: JSON.stringify({ templateId: tplId, targetPropertyIds: ['prop-sapphire-ant'] }),
    });
    const share = await shareRes.json().catch(() => ({}));
    const shareOk = shareRes.ok && share.ok && (share.count ?? 0) >= 1;
    console.log(`${shareOk ? '✓' : '✗'} Form share API → Antalya [${shareRes.status}]`);
    ok = shareOk && ok;
  }

  const page = await fetch(`${BASE}/reports?tab=forms`);
  const html = await page.text();
  const uiOk = page.ok && html.includes('Paylaş');
  console.log(`${uiOk ? '✓' : '✗'} Form share UI — /reports?tab=forms`);
  ok = uiOk && ok;
}

if (!onlyStep) {
  console.log('\n══ Faz 6 regresyon ══');
  ok = runStep('Faz 6 smoke', 'npm', ['run', 'test:faz6']) && ok;
}

console.log(ok ? '\n✅ Faz 7 adımları geçti' : '\n❌ Bazı Faz 7 adımları başarısız');
process.exit(ok ? 0 : 1);
