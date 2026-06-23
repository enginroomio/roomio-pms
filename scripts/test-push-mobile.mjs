#!/usr/bin/env node
/**
 * HK mobil push pipeline testi.
 * Kullanım: npm run test:push-mobile
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { parseEnvFile } from './parse-env-file.mjs';
import { pickPort, waitForHealth, baseUrlForPort } from './roomio-port.mjs';

const PROD = process.env.ROOMIO_PRODUCTION_URL?.replace(/\/$/, '') ?? null;
const preferProd =
  process.env.ROOMIO_PUSH_TEST_PRODUCTION === '1' || Boolean(PROD && !process.env.ROOMIO_URL);
const BASE = preferProd
  ? PROD
  : (process.env.ROOMIO_URL ?? readActivePort() ?? PROD ?? null);
const USE_VAPID_SERVER =
  process.env.ROOMIO_PUSH_TEST_VAPID !== '0' && !preferProd;

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

async function check(base, label, path, expect = 200, init) {
  const res = await fetch(`${base}${path}`, init);
  const ok = res.status === expect;
  console.log(`${ok ? '✓' : '✗'} ${label} — ${path} [${res.status}]`);
  return { ok, res };
}

async function runAgainst(base) {
  let ok = true;

  const mobile = await fetch(`${base}/housekeeping/mobile`);
  const mobileHtml = await mobile.text();
  const mobileOk = mobile.ok && (
    mobileHtml.includes('HK Mobil') ||
    mobileHtml.includes('Roomio HK') ||
    mobileHtml.includes('Atama')
  );
  console.log(`${mobileOk ? '✓' : '✗'} HK mobil sayfa [${mobile.status}]`);
  ok = mobileOk && ok;

  ok = (await check(base, 'Push subscribe GET', '/api/push/subscribe')).ok && ok;

  const vapid = await fetch(`${base}/api/push/vapid-public-key`).then((r) => r.json()).catch(() => ({}));
  const vapidConfigured = vapid.ok === true && Boolean(vapid.publicKey);
  console.log(`${vapidConfigured ? '✓' : 'ℹ'} VAPID yapılandırılmış — ${vapidConfigured ? 'evet' : 'hayır (503 beklenir)'}`);

  const sendRes = await fetch(`${base}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'HK Test', body: 'Mobil push pipeline' }),
  });
  const sendExpected = vapidConfigured ? 200 : 503;
  const sendOk = sendRes.status === sendExpected;
  console.log(`${sendOk ? '✓' : '✗'} Push send [${sendRes.status}] (beklenen ${sendExpected})`);
  ok = sendOk && ok;

  if (vapidConfigured) {
    const subRes = await fetch(`${base}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/roomio-faz8-test',
          keys: {
            p256dh: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37-SUtbK8pXUQ',
            auth: 'dGVzdC1hdXRoLXRva2Vu',
          },
        },
        role: 'hk',
        deviceLabel: 'Faz8 test',
      }),
    });
    const subOk = subRes.status === 200;
    console.log(`${subOk ? '✓' : '✗'} Push subscribe POST (test abonelik) [${subRes.status}]`);
    ok = subOk && ok;

    const send2 = await fetch(`${base}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'HK Test', body: 'Abonelikli gönderim' }),
    });
    const send2Ok = send2.status === 200;
    const send2Body = await send2.json().catch(() => ({}));
    console.log(`${send2Ok ? '✓' : '✗'} Push send (abonelikli) [${send2.status}] sent=${send2Body.sent ?? '?'} failed=${send2Body.failed ?? '?'}`);
    ok = send2Ok && ok;
  }

  for (const path of [
    '/housekeeping/assign',
    '/housekeeping/faults',
    '/housekeeping/reports',
    '/housekeeping/operations',
  ]) {
    ok = (await check(base, `HK sayfa ${path}`, path)).ok && ok;
  }

  return ok;
}

async function startVapidServer() {
  const vapidEnv = parseEnvFile('.env.vapid.generated');
  if (!vapidEnv.VAPID_PUBLIC_KEY || !vapidEnv.VAPID_PRIVATE_KEY) {
    console.log('ℹ VAPID sunucu testi atlandı (.env.vapid.generated yok)');
    return null;
  }

  const port = await pickPort(3100);
  const nextBin = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(
    process.execPath,
    [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)],
    {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, ...vapidEnv },
    },
  );
  child.unref();
  const base = baseUrlForPort(port);
  await waitForHealth(base);
  console.log(`\n── VAPID test sunucusu → ${base} ──\n`);
  return base;
}

console.log('HK mobil push pipeline testi\n');

let ok = true;

if (BASE) {
  console.log(`── Mevcut sunucu → ${BASE} ──\n`);
  ok = (await runAgainst(BASE.replace(/\/$/, ''))) && ok;
}

if (USE_VAPID_SERVER && existsSync('.env.vapid.generated')) {
  const vapidBase = await startVapidServer();
  if (vapidBase) {
    ok = (await runAgainst(vapidBase.replace(/\/$/, ''))) && ok;
  }
}

console.log(ok ? '\n✓ Push mobil pipeline geçti\n' : '\n✗ Push mobil pipeline başarısız\n');
process.exit(ok ? 0 : 1);
