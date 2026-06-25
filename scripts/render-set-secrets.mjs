#!/usr/bin/env node
/**
 * Render environment secrets — JWT + VAPID + deploy tetikleme.
 * Kullanım:
 *   RENDER_API_KEY=rnd_xxx npm run render:set-secrets
 *   RENDER_SERVICE_ID=srv_xxx npm run render:set-secrets  (opsiyonel, otomatik aranır)
 */
import { randomBytes, readFileSync, existsSync } from 'node:fs';
import { parseEnvFile } from './parse-env-file.mjs';

const API = 'https://api.render.com/v1';
const TOKEN = process.env.RENDER_API_KEY?.trim();
const SERVICE_NAME = process.env.RENDER_SERVICE_NAME ?? 'roomio-pms-v2';

if (!TOKEN) {
  console.error('✗ RENDER_API_KEY gerekli');
  console.error('  Render Dashboard → Account Settings → API Keys');
  console.error('  RENDER_API_KEY=rnd_... npm run render:set-secrets');
  process.exit(1);
}

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${opts.method ?? 'GET'} ${path} → ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function findServiceId() {
  if (process.env.RENDER_SERVICE_ID?.trim()) return process.env.RENDER_SERVICE_ID.trim();
  const data = await api('/services?limit=50');
  const items = Array.isArray(data) ? data : data?.items ?? [];
  for (const row of items) {
    const svc = row.service ?? row;
    const name = svc.name ?? svc.service?.name;
    if (name === SERVICE_NAME || name === 'roomio-pms') return svc.id ?? row.id;
  }
  throw new Error(`Servis bulunamadı: ${SERVICE_NAME}`);
}

async function setEnv(serviceId, key, value) {
  await api(`/services/${serviceId}/env-vars/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
  console.log(`✓ ${key}`);
}

function loadVapid() {
  if (!existsSync('.env.vapid.generated')) return {};
  return parseEnvFile(readFileSync('.env.vapid.generated', 'utf8'));
}

async function triggerDeploy(serviceId) {
  await api(`/services/${serviceId}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ clearCache: 'clear' }),
  });
  console.log('✓ Deploy tetiklendi');
}

console.log('\n── Render secrets + deploy ──\n');

const jwt = process.env.ROOMIO_JWT_SECRET?.trim() || randomBytes(48).toString('base64');
const vapid = loadVapid();

try {
  const serviceId = await findServiceId();
  console.log(`Servis: ${SERVICE_NAME} (${serviceId})\n`);

  await setEnv(serviceId, 'ROOMIO_JWT_SECRET', jwt);
  await setEnv(serviceId, 'ROOMIO_AUTH_REQUIRED', '1');

  if (vapid.VAPID_PUBLIC_KEY) await setEnv(serviceId, 'VAPID_PUBLIC_KEY', vapid.VAPID_PUBLIC_KEY);
  if (vapid.VAPID_PRIVATE_KEY) await setEnv(serviceId, 'VAPID_PRIVATE_KEY', vapid.VAPID_PRIVATE_KEY);
  if (vapid.VAPID_SUBJECT) await setEnv(serviceId, 'VAPID_SUBJECT', vapid.VAPID_SUBJECT);

  await triggerDeploy(serviceId);

  console.log('\n✅ Secrets kaydedildi, deploy başlatıldı');
  console.log('   Doğrula: npm run render:go-live -- --step 1\n');
} catch (err) {
  console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}
