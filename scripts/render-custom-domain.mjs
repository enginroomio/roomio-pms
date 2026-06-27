#!/usr/bin/env node
/**
 * Render özel domain kurulum rehberi (ör. pms.roomio.io).
 * Kullanım: npm run render:domain:setup
 */
const SERVICE = process.env.RENDER_SERVICE_NAME ?? 'roomio-pms-v2';
const DOMAIN = process.env.ROOMIO_CUSTOM_DOMAIN ?? 'www.roomio.web.tr';
const PROD = process.env.ROOMIO_PRODUCTION_URL ?? 'https://roomio-pms-v2.onrender.com';
const isWebTr = DOMAIN.endsWith('.web.tr');

console.log('\n── Render özel domain ──\n');
console.log(`Hedef: ${DOMAIN}`);
console.log(`Mevcut: ${PROD}\n`);

console.log('📋 Adım 1 — Render\'da domain ekle\n');
console.log(`1. https://dashboard.render.com → ${SERVICE}`);
console.log('2. Settings → Custom Domains → Add Custom Domain');
if (isWebTr) {
  console.log('3. Önerilen: önce www ile başlayın → www.roomio.web.tr');
  console.log('   (Kök domain roomio.web.tr için registrar ALIAS desteği gerekir)');
} else {
  console.log(`3. Domain: ${DOMAIN}`);
}
console.log('4. Render size DNS kayıtlarını gösterecek\n');

console.log('📋 Adım 2 — DNS (domain sağlayıcınızda)\n');
if (isWebTr) {
  console.log('Nic.tr registrar (Natro, Turhost, İsimtescil vb.):\n');
  console.log('  Kolay yol (önerilen):');
  console.log(`    CNAME  www  →  ${SERVICE}.onrender.com`);
  console.log('  Render custom domain: www.roomio.web.tr\n');
  console.log('  Kök domain (roomio.web.tr) — registrar ALIAS/ANAME destekliyorsa:');
  console.log(`    ALIAS/ANAME  @  →  ${SERVICE}.onrender.com`);
  console.log('  Desteklemiyorsa önce www ile canlıya alın.\n');
} else {
  console.log('Tipik kayıtlar (Render\'ın verdiği değerleri kullanın):\n');
  console.log(`  CNAME  ${DOMAIN}  →  ${SERVICE}.onrender.com`);
  console.log('  veya kök domain için A/ALIAS kayıtları\n');
}

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

console.log('ℹ roomio.web.tr: DNS yayılımı 30 dk–24 sa sürebilir; Verify\'i tekrar deneyin.');
console.log('ℹ roomio.io + Cloudflare: Proxy ON, SSL/TLS → Full (strict).\n');
