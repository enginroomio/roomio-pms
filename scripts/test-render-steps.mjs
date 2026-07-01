#!/usr/bin/env node
/**
 * Render production doğrulama.
 * Kullanım: ROOMIO_PRODUCTION_URL=https://roomio-pms.onrender.com npm run test:render
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { defaultRenderUrl, productionUrl, renderServiceName, waitForHealth } from './render-production.mjs';

const LOCAL = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const PROD = productionUrl() ?? process.env.ROOMIO_PRODUCTION_URL?.trim() ?? null;
const EXPECTED = defaultRenderUrl(renderServiceName());

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

console.log('Render production testi');
console.log(`  Yerel  → ${LOCAL}`);
console.log(`  Prod   → ${PROD ?? `(beklenen ${EXPECTED})`}\n`);

let ok = true;

console.log('══ Render dosyaları ══');
for (const f of ['render.yaml', 'Dockerfile']) {
  const hit = existsSync(f);
  console.log(`${hit ? '✓' : '✗'} ${f}`);
  if (!hit) ok = false;
}

if (!PROD) {
  console.log('\nℹ Production URL yok');
  console.log(`  Deploy: npm run deploy:render`);
  console.log(`  Test:   ROOMIO_PRODUCTION_URL=${EXPECTED} npm run test:render`);
  process.exit(0);
}

console.log('\n══ Production health ══');
const health = await waitForHealth(PROD, 8, 5000);
console.log(`${health.ok ? '✓' : '✗'} ${PROD}/api/health`);
if (!health.ok) {
  const auth = health.body?.checks?.auth;
  if (auth && !auth.ok) {
    console.log(`  auth: ${auth.detail}`);
    console.log('  Düzeltme: npm run render:paste-env → Render Environment → Manual Deploy');
    console.log('  veya: RENDER_API_KEY=rnd_... npm run render:set-secrets');
  } else if (health.reason === 'dns') {
    console.log('ℹ DNS kaydı yok — Render Blueprint henüz deploy edilmemiş');
    console.log('  Önce: bash scripts/github-push.sh');
    console.log('  Sonra: render.com → New → Blueprint');
  } else if (health.reason === 'not_found') {
    console.log('ℹ 404 — site henüz Render\'da yok (Blueprint deploy yapılmamış)');
    console.log('  bash scripts/github-push.sh → Render Blueprint');
  } else {
    console.log('ℹ Site uyuyor olabilir (free plan) veya deploy devam ediyor');
    console.log('  Render dashboard → Logs kontrol edin');
  }
  if (health.body?.gitSha) {
    console.log(`  canlı build: ${health.body.gitSha} (${health.body.build?.slice(0, 10) ?? '—'})`);
  }
}
ok = health.ok && ok;

if (health.ok) {
  console.log('\n══ Push pipeline (HTTPS) ══');
  const r = spawnSync('npm', ['run', 'test:faz11', '--', '--step', '11.3'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ROOMIO_PRODUCTION_URL: PROD, ROOMIO_URL: PROD },
  });
  ok = r.status === 0 && ok;
}

console.log(ok ? '\n✅ Render test geçti' : '\n❌ Render test başarısız');
process.exit(ok ? 0 : 1);
