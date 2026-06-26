#!/usr/bin/env node
/**
 * Render.com deploy rehberi + doğrulama (ücretsiz, kredi kartı yok).
 * Kullanım: npm run deploy:render
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseEnvFile } from './parse-env-file.mjs';
import {
  defaultRenderUrl,
  productionUrl,
  renderServiceName,
  saveProductionUrl,
  waitForHealth,
} from './render-production.mjs';

const service = renderServiceName();
const expected = defaultRenderUrl(service);
const prod = productionUrl();

console.log('\n── Render deploy (ücretsiz) ──\n');

let ok = true;
for (const f of ['render.yaml', 'Dockerfile', 'scripts/docker-entrypoint.mjs']) {
  const hit = existsSync(f);
  console.log(`${hit ? '✓' : '✗'} ${f}`);
  if (!hit) ok = false;
}

if (!ok) {
  console.error('\n✗ Eksik dosya');
  process.exit(1);
}

console.log('\n📋 Kurulum (kredi kartı gerekmez):\n');
console.log('1. https://render.com → GitHub ile kayıt');
console.log('2. Repo GitHub\'a push (roomio-pms)');
console.log('3. Dashboard → New → Blueprint');
console.log('4. Repo seç → render.yaml otomatik algılanır');
console.log('5. Environment → VAPID anahtarlarını ekle:');
console.log('   npm run vapid:gen → .env.vapid.generated değerleri');

if (existsSync('.env.vapid.generated')) {
  const v = parseEnvFile('.env.vapid.generated');
  if (v.VAPID_PUBLIC_KEY) {
    console.log('\n   VAPID_PUBLIC_KEY=' + v.VAPID_PUBLIC_KEY.slice(0, 20) + '…');
    console.log('   VAPID_PRIVATE_KEY=(Render dashboard\'a yapıştır)');
  }
}

console.log('\n6. Deploy bitince URL:');
console.log(`   ${expected}`);
console.log('\n7. URL kaydet + test:');
console.log(`   ROOMIO_PRODUCTION_URL=${expected} npm run test:render`);

if (prod) {
  let activeUrl = prod;
  console.log(`\n── Mevcut production URL: ${activeUrl} ──`);
  let health = await waitForHealth(activeUrl, 12, 5000);
  if (!health.ok && !activeUrl.includes('onrender.com')) {
    const fallback = expected;
    console.log(`\nℹ Kayıtlı URL yanıt vermiyor (${activeUrl}) — Render varsayılan deneniyor: ${fallback}`);
    health = await waitForHealth(fallback, 12, 5000);
    if (health.ok) {
      saveProductionUrl(fallback);
      activeUrl = fallback;
    }
  }
  console.log(`${health.ok ? '✓' : '✗'} Health — ${activeUrl}/api/health`);
  if (health.ok) {
    saveProductionUrl(activeUrl);
    console.log('\n✅ Render production ayakta');
    process.exit(0);
  }
  console.log('\n⚠ Site henüz ayakta değil — Blueprint deploy tamamlanmamış olabilir');
  process.exit(1);
}

console.log('\nℹ İlk deploy 5–10 dk sürebilir (Docker build + cold start)');
console.log('ℹ Free plan: 15 dk hareketsizlikten sonra uyur; ilk istek 30–60 sn sürebilir');
console.log('ℹ Kalıcı veri için: npm run render:postgres:setup');
console.log('ℹ Özel domain için: npm run render:domain:setup\n');

if (!existsSync('.env.vapid.generated')) {
  const vapidOk = spawnSync('npm', ['run', 'vapid:gen'], { stdio: 'inherit', shell: true }).status === 0;
  if (!vapidOk) process.exit(1);
  console.log('✓ VAPID anahtarları üretildi — Render dashboard\'a ekleyin\n');
} else {
  console.log('✓ .env.vapid.generated mevcut — Render dashboard\'a ekleyin\n');
}
