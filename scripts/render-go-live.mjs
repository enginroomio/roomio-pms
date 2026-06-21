#!/usr/bin/env node
/**
 * Production go-live sırası — domain, uptime, HK push, Postgres hatırlatma.
 * Kullanım: npm run render:go-live
 *           npm run render:go-live -- --step 2
 */
import { spawnSync } from 'node:child_process';
import {
  customDomainUrl,
  defaultRenderUrl,
  productionUrl,
  renderServiceName,
  saveProductionUrl,
  waitForHealth,
} from './render-production.mjs';

const args = process.argv.slice(2);
const stepOnly = args.includes('--step') ? Number(args[args.indexOf('--step') + 1]) : null;

const RENDER_URL = productionUrl() ?? defaultRenderUrl(renderServiceName());
const DOMAIN_URL = customDomainUrl();

async function step1Production() {
  console.log('\n══ Adım 1/5 — Production health (Render) ══\n');
  console.log(`URL: ${RENDER_URL}`);
  const health = await waitForHealth(RENDER_URL, 15, 4000);
  if (health.ok) {
    console.log('✓ Health OK');
    console.log(`  database: ${health.body?.checks?.database?.ok ? 'ok' : 'FAIL'}`);
    console.log(`  monitoring: ${health.body?.checks?.monitoring?.detail ?? '—'}`);
    saveProductionUrl(RENDER_URL);
    return true;
  }
  console.log(`✗ Health başarısız (${health.reason ?? 'unknown'})`);
  console.log('  Render Dashboard → roomio-pms-v2 → Manual Deploy');
  return false;
}

async function step2CustomDomain() {
  console.log('\n══ Adım 2/5 — Özel domain (pms.roomio.io) ══\n');
  spawnSync('node', ['scripts/render-custom-domain.mjs'], { stdio: 'inherit' });

  console.log('\n── DNS / SSL doğrulama ──\n');
  console.log(`Denenen URL: ${DOMAIN_URL}`);
  const health = await waitForHealth(DOMAIN_URL, 6, 4000);
  if (health.ok) {
    console.log(`✓ ${DOMAIN_URL} canlı`);
    saveProductionUrl(DOMAIN_URL);
    console.log('\n  Render Environment (opsiyonel):');
    console.log(`  ROOMIO_PUBLIC_URL=${DOMAIN_URL}`);
    return true;
  }

  if (health.reason === 'dns') {
    console.log('ℹ DNS henüz yayılmamış veya Render\'da domain eklenmemiş');
  } else {
    console.log(`ℹ Henüz hazır değil (${health.reason ?? 'bekleniyor'})`);
  }
  console.log('\n  Sizde: Render → Custom Domains → pms.roomio.io → DNS kaydı');
  console.log('  Cloudflare: CNAME pms → roomio-pms-v2.onrender.com, SSL Full (strict)');
  return false;
}

function step3Uptime() {
  console.log('\n══ Adım 3/5 — UptimeRobot (cold start) ══\n');
  spawnSync('node', ['scripts/render-uptime-setup.mjs'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ROOMIO_PRODUCTION_URL: productionUrl() ?? DOMAIN_URL,
      ROOMIO_CUSTOM_DOMAIN: process.env.ROOMIO_CUSTOM_DOMAIN ?? 'pms.roomio.io',
    },
  });
  return true;
}

function step4HkMobile() {
  console.log('\n══ Adım 4/5 — HK mobil saha testi ══\n');
  const base = productionUrl() ?? DOMAIN_URL;
  console.log('Checklist:');
  console.log(`  1. ${base}/housekeeping/mobile — Cmd+Shift+R`);
  console.log('  2. Giriş: hk@hotelsapphire.com / roomio123');
  console.log('  3. Test bildirimi → Chrome sağ üst bildirim');
  console.log('  4. İkinci cihaz açık → Kayıtlı: 2 · Online: 2');
  console.log('  5. Oda durumu değiştir → push gecikmesi varsa UptimeRobot bekleyin\n');
  console.log(`  Test: ROOMIO_PRODUCTION_URL=${base} npm run test:push-mobile`);
  return true;
}

function step5Postgres() {
  console.log('\n══ Adım 5/5 — Postgres kalıcılık ══\n');
  console.log('✓ roomio-db bağlı (Internal DATABASE_URL)');
  console.log('ℹ Render Postgres trial ~21 Temmuz 2026 — Starter\'a geçin veya Neon\'a taşıyın');
  console.log('  npm run render:postgres:setup\n');
  return true;
}

const steps = [
  { n: 1, fn: step1Production },
  { n: 2, fn: step2CustomDomain },
  { n: 3, fn: step3Uptime },
  { n: 4, fn: step4HkMobile },
  { n: 5, fn: step5Postgres },
];

let allOk = true;
for (const step of steps) {
  if (stepOnly && step.n !== stepOnly) continue;
  const ok = await step.fn();
  if (step.n <= 2 && !ok) allOk = false;
}

console.log('\n── Özet ──');
console.log(`Production: ${RENDER_URL}`);
console.log(`Hedef domain: ${DOMAIN_URL}`);
console.log(allOk ? '✅ Adım 1 tamam — domain DNS sizde' : '⚠️ Bazı adımlar bekliyor\n');

process.exit(stepOnly ? 0 : allOk ? 0 : 1);
