#!/usr/bin/env node
/**
 * Render özel domain kurulum rehberi (ör. pms.roomio.io).
 * Kullanım: npm run render:domain:setup
 */
const SERVICE = process.env.RENDER_SERVICE_NAME ?? 'roomio-pms-v2';
const DOMAIN = process.env.ROOMIO_CUSTOM_DOMAIN ?? 'pms.roomio.io';
const PROD = process.env.ROOMIO_PRODUCTION_URL ?? 'https://roomio-pms-v2.onrender.com';

console.log('\n── Render özel domain ──\n');
console.log(`Hedef: ${DOMAIN}`);
console.log(`Mevcut: ${PROD}\n`);

console.log('📋 Adım 1 — Render\'da domain ekle\n');
console.log(`1. https://dashboard.render.com → ${SERVICE}`);
console.log('2. Settings → Custom Domains → Add Custom Domain');
console.log(`3. Domain: ${DOMAIN}`);
console.log('4. Render size DNS kayıtlarını gösterecek\n');

console.log('📋 Adım 2 — DNS (domain sağlayıcınızda)\n');
console.log('Tipik kayıtlar (Render\'ın verdiği değerleri kullanın):\n');
console.log(`  CNAME  ${DOMAIN}  →  ${SERVICE}.onrender.com`);
console.log('  veya kök domain için A/ALIAS kayıtları\n');

console.log('📋 Adım 3 — SSL\n');
console.log('- Render Let\'s Encrypt sertifikası otomatik verir (5–30 dk)');
console.log('- Status: Verified + Certificate Issued olunca hazır\n');

console.log('📋 Adım 4 — Push bildirimleri\n');
console.log('- Service Worker scope domain\'e bağlı — yeni domainde tekrar Bildirimleri aç');
console.log('- VAPID anahtarları aynı kalabilir');
console.log('- Chrome: yeni origin için notification izni gerekir\n');

console.log('📋 Adım 5 — Test\n');
console.log(`https://${DOMAIN}/api/health`);
console.log(`https://${DOMAIN}/housekeeping/mobile\n`);

console.log('📋 Adım 6 — URL kaydet + go-live\n');
console.log(`ROOMIO_PRODUCTION_URL=https://${DOMAIN} npm run render:go-live -- --step 2`);
console.log('Render Environment (opsiyonel): ROOMIO_PUBLIC_URL=https://' + DOMAIN + '\n');

console.log('📋 Adım 7 — UptimeRobot\n');
console.log('npm run render:uptime:setup\n');

console.log('ℹ roomio.io Cloudflare ise: Proxy ON (turuncu bulut) genelde çalışır;');
console.log('  SSL/TLS → Full (strict) önerilir.\n');
