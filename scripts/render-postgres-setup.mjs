#!/usr/bin/env node
/**
 * Render PostgreSQL kurulum rehberi (kalıcı veritabanı + push abonelikleri).
 * Kullanım: npm run render:postgres:setup
 */
import { spawnSync } from 'node:child_process';
import { customDomainUrl, productionUrl } from './render-production.mjs';

const SERVICE = process.env.RENDER_SERVICE_NAME ?? 'roomio-pms-v2';
const PROD = (productionUrl() ?? customDomainUrl()).replace(/\/$/, '');

console.log('\n── Render PostgreSQL (kalıcı veri) ──\n');
console.log('ℹ Render free web servisinde disk yok — SQLite /tmp\'de sıfırlanır.');
console.log('ℹ Postgres Starter ~$7/ay — veri + push abonelikleri kalıcı olur.\n');

console.log('📋 Adım 1 — Postgres oluştur\n');
console.log('1. https://dashboard.render.com → New + → PostgreSQL');
console.log('2. Name: roomio-db');
console.log('3. Region: Frankfurt (web servisiyle aynı)');
console.log('4. Plan: Starter (Free Postgres artık yok)');
console.log('5. Create Database\n');

console.log('📋 Adım 2 — Web servisine bağla\n');
console.log(`1. Dashboard → ${SERVICE} → Environment`);
console.log('2. DATABASE_URL → Postgres → Connect → Internal Database URL');
console.log('   (Internal URL kullanın — aynı Render ağı, daha hızlı)');
console.log('3. Eski DATABASE_URL=file:/tmp/roomio.db satırını silin veya override edin');
console.log('4. İsteğe bağlı: PRISMA_SCHEMA=postgresql');
console.log('5. ROOMIO_PUSH_STORE artık gerekmez (push DB\'de) — silebilirsiniz');
console.log('6. Save Changes → Manual Deploy\n');

console.log('📋 Adım 3 — Doğrula\n');
console.log(`npm run render:postgres:verify`);
console.log('Beklenen: Veritabanı: postgresql ✓ kalıcı\n');

console.log('📋 Kod tarafı (otomatik)\n');
console.log('- Docker entrypoint: DATABASE_URL\'e göre prisma generate + db push');
console.log('- Push abonelikleri: PushSubscription tablosu (Postgres/SQLite)');
console.log('- Eski /tmp/push-subscriptions.json varsa ilk açılışta DB\'ye taşınır\n');

const test = spawnSync('npm', ['run', 'test:postgres'], { stdio: 'inherit', shell: true });
process.exit(test.status === 0 ? 0 : 1);
