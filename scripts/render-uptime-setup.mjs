#!/usr/bin/env node
/**
 * Render free tier uyku — UptimeRobot ile 5 dk ping rehberi.
 * Kullanım: npm run render:uptime:setup
 */
const BASE =
  process.env.ROOMIO_PRODUCTION_URL?.replace(/\/$/, '')
  ?? (process.env.ROOMIO_CUSTOM_DOMAIN
    ? `https://${process.env.ROOMIO_CUSTOM_DOMAIN.replace(/^https?:\/\//, '')}`
    : 'https://pms.roomio.io');

const PING_URL = `${BASE}/api/health`;

console.log('\n── UptimeRobot — cold start azaltma ──\n');
console.log('Render free tier ~15 dk işlem yoksa uyur; ilk istek 30–60 sn sürebilir.');
console.log('5 dakikada bir health ping ile servis uyanık kalır.\n');

console.log('📋 Adım 1 — Hesap\n');
console.log('1. https://uptimerobot.com → Sign Up (ücretsiz, 50 monitor)');
console.log('2. Email doğrulama\n');

console.log('📋 Adım 2 — Monitor ekle\n');
console.log('1. + Add New Monitor');
console.log('2. Monitor Type: HTTP(s)');
console.log(`3. Friendly Name: Roomio PMS`);
console.log(`4. URL: ${PING_URL}`);
console.log('5. Monitoring Interval: 5 minutes');
console.log('6. Create Monitor\n');

console.log('📋 Adım 3 — Doğrula\n');
console.log('- 5–10 dk sonra Render Events\'te gereksiz deploy olmamalı');
console.log('- HK push testi daha hızlı yanıt vermeli\n');

console.log('ℹ Özel domain henüz yoksa geçici URL:');
console.log('   https://roomio-pms-v2.onrender.com/api/health');
console.log('   Domain aktif olunca monitor URL\'sini güncelleyin.\n');
