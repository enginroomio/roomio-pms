#!/usr/bin/env node
/**
 * Go-live adım 3–4: UptimeRobot rehberi + production HK/push doğrulama.
 * Kullanım: npm run go-live:verify
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { customDomainUrl, productionUrl, saveProductionUrl } from './render-production.mjs';

const BASE = (productionUrl() ?? customDomainUrl()).replace(/\/$/, '');
const PING_URL = `${BASE}/api/health`;

const HK_ROUTES = [
  '/api/health',
  '/api/push/vapid-public-key',
  '/api/housekeeping/faults',
  '/api/housekeeping/requests',
  '/housekeeping/mobile',
  '/housekeeping/assign',
  '/housekeeping/faults',
  '/housekeeping/reports',
  '/housekeeping/operations',
  '/reception/guest-requests',
];

const PRO_MODULE_ROUTES = [
  '/revenue',
  '/loyalty',
  '/groups',
  '/tools/deploy',
  '/settings/integrations/channel-manager',
];

async function timedFetch(path, init) {
  const start = performance.now();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    signal: AbortSignal.timeout(25_000),
  });
  const ms = Math.round(performance.now() - start);
  return { res, ms };
}

async function probeHealth() {
  const samples = [];
  for (let i = 0; i < 3; i += 1) {
    try {
      const { res, ms } = await timedFetch('/api/health');
      const body = await res.json().catch(() => ({}));
      samples.push({ ok: res.ok && body.ok === true, ms, uptimeSec: body.uptimeSec, gitSha: body.gitSha });
    } catch (err) {
      samples.push({ ok: false, ms: -1, error: err instanceof Error ? err.message : String(err) });
    }
    if (i < 2) await new Promise((r) => setTimeout(r, 400));
  }
  const avgMs = Math.round(samples.filter((s) => s.ms >= 0).reduce((a, s) => a + s.ms, 0) / Math.max(1, samples.filter((s) => s.ms >= 0).length));
  const cold = samples.some((s) => s.ms > 8000);
  const warm = samples.every((s) => s.ok) && avgMs < 3000;
  return { samples, avgMs, cold, warm };
}

async function probeRoutes() {
  const results = [];
  for (const path of [...HK_ROUTES, ...PRO_MODULE_ROUTES]) {
    try {
      const { res, ms } = await timedFetch(path, { redirect: 'manual' });
      const isApi = path.startsWith('/api/');
      const ok = isApi
        ? res.status === 200
        : res.status === 200 || res.status === 302 || res.status === 307;
      results.push({ path, status: res.status, ms, ok });
    } catch (err) {
      results.push({ path, status: 0, ms: -1, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}

async function probePush() {
  const vapidRes = await fetch(`${BASE}/api/push/vapid-public-key`);
  const vapid = await vapidRes.json().catch(() => ({}));
  const vapidOk = vapidRes.ok && vapid.ok === true && Boolean(vapid.publicKey);

  const subsRes = await fetch(`${BASE}/api/push/subscribe?role=hk&detail=1`);
  const subs = await subsRes.json().catch(() => ({}));

  const sendRes = await fetch(`${BASE}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Go-live HK test', body: 'Push pipeline doğrulama' }),
  });
  const sendBody = await sendRes.json().catch(() => ({}));
  const sendOk = sendRes.status === 200 || (sendRes.status === 404 && vapidOk);

  return {
    vapidOk,
    subsOk: subsRes.ok && subs.ok === true,
    subscriberCount: subs.count ?? 0,
    onlineCount: subs.online ?? 0,
    sendStatus: sendRes.status,
    sendOk,
    sent: sendBody.sent ?? 0,
    failed: sendBody.failed ?? 0,
    pipelineReady: vapidOk && sendOk,
  };
}

function printUptimeGuide(warm, avgMs) {
  console.log('\n══ Adım 3 — UptimeRobot kurulumu ══\n');
  if (warm) {
    console.log(`✓ Sunucu sıcak (ortalama ${avgMs} ms)`);
  } else {
    console.log(`⚠ Yavaş yanıt (ortalama ${avgMs} ms) — cold start olabilir; UptimeRobot önerilir`);
  }
  console.log('\n1. https://uptimerobot.com → Sign Up (ücretsiz)');
  console.log('2. + Add New Monitor → HTTP(s)');
  console.log('3. Friendly Name: Roomio PMS');
  console.log(`4. URL: ${PING_URL}`);
  console.log('5. Monitoring Interval: 5 minutes');
  console.log('6. Create Monitor\n');
  console.log('Domain değişirse monitor URL\'sini güncelleyin.');
}

function printHkFieldChecklist(push) {
  console.log('\n══ Adım 4 — HK mobil saha testi (manuel) ══\n');
  console.log(`1. ${BASE}/housekeeping/mobile — hard refresh (Cmd+Shift+R)`);
  console.log('2. Giriş: hk@hotelsapphire.com / roomio123');
  console.log('3. Bildirim izni ver → test bildirimi');
  console.log(`4. Abone sayısı (API): ${push.subscriberCount} · online: ${push.onlineCount}`);
  if (push.subscriberCount === 0) {
    console.log('   ℹ Henüz kayıtlı cihaz yok — telefonda pano açıp bildirim izni verin');
  }
  console.log('5. Oda durumu değiştir → diğer cihazda push gelmeli');
  console.log(`6. Atama/kanban: ${BASE}/housekeeping/assign`);
  console.log(`7. Operasyon merkezi: ${BASE}/housekeeping/operations\n`);
  console.log(`Otomatik push testi: npm run test:push-mobile:prod`);
}

async function main() {
  console.log('\n── Roomio go-live doğrulama ──');
  console.log(`Hedef: ${BASE}\n`);

  saveProductionUrl(BASE);

  const health = await probeHealth();
  console.log('Health ping (3 örnek):');
  for (const [i, s] of health.samples.entries()) {
    if (s.error) console.log(`  ${i + 1}. ✗ ${s.error}`);
    else console.log(`  ${i + 1}. ${s.ok ? '✓' : '✗'} ${s.ms}ms · uptime ${s.uptimeSec ?? '?'}s · ${s.gitSha ?? '?'}`);
  }
  console.log(`  Ortalama: ${health.avgMs}ms · ${health.warm ? 'sıcak' : health.cold ? 'soğuk/cold start' : 'kararsız'}`);

  const routes = await probeRoutes();
  console.log('\nHK + profesyonel modül rotaları:');
  let routesOk = true;
  for (const r of routes) {
    console.log(`  ${r.ok ? '✓' : '✗'} ${r.path} [${r.status}] ${r.ms >= 0 ? `${r.ms}ms` : r.error ?? ''}`);
    if (!r.ok) routesOk = false;
  }

  const push = await probePush();
  console.log('\nPush pipeline:');
  console.log(`  ${push.vapidOk ? '✓' : '✗'} VAPID yapılandırılmış`);
  console.log(`  ${push.subsOk ? '✓' : '✗'} HK abonelik API`);
  console.log(`  ${push.sendOk ? '✓' : '✗'} Push send [${push.sendStatus}] sent=${push.sent} failed=${push.failed}`);
  console.log(`  Kayıtlı HK cihaz: ${push.subscriberCount} (online ${push.onlineCount})`);

  printUptimeGuide(health.warm, health.avgMs);
  printHkFieldChecklist(push);

  const report = {
    at: new Date().toISOString(),
    base: BASE,
    health,
    routes,
    push,
    ok: health.samples.every((s) => s.ok) && routesOk && push.pipelineReady,
  };

  const dir = join(process.cwd(), '.roomio');
  mkdirSync(dir, { recursive: true });
  const reportPath = join(dir, 'go-live-verify.json');
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nRapor: ${reportPath}`);
  console.log(report.ok ? '\n✅ Production go-live doğrulama geçti\n' : '\n⚠️ Bazı kontroller başarısız\n');

  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
