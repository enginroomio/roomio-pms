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
console.log('2. Add Environment Variable → Key: DATABASE_URL');
console.log('3. Value: roomio-db → Connect → **Internal Database URL** kopyala');
console.log('   (postgresql://… — External değil, Internal kullanın)');
console.log('4. **Silin** (artık gerekmez):');
console.log('   - DATABASE_URL=file:/tmp/roomio.db (eski satır)');
console.log('   - ROOMIO_PUSH_STORE');
console.log('   - ROOMIO_DATA_DIR=/tmp');
console.log('5. İsteğe bağlı: PRISMA_SCHEMA=postgresql (otomatik algılanır)');
console.log('6. Save Changes → **Manual Deploy** (5–10 dk)\n');

console.log('📋 Adım 3 — Deploy loglarında bekleyin\n');
console.log('[render-build] DATABASE_URL=postgresql://…');
console.log('→ prisma db push (postgresql şeması)');
console.log('✅ render-build tamam\n');

console.log('📋 Adım 3 — Doğrula\n');
console.log(`npm run render:postgres:verify`);
console.log(`URL: ${PROD}`);
console.log('Beklenen: Veritabanı: postgresql ✓ kalıcı\n');

console.log('📋 Kod tarafı (otomatik)\n');
console.log('- Docker entrypoint: DATABASE_URL\'e göre prisma generate + db push');
console.log('- Push abonelikleri: PushSubscription tablosu (Postgres/SQLite)');
console.log('- Eski /tmp/push-subscriptions.json varsa ilk açılışta DB\'ye taşınır\n');

const test = spawnSync('npm', ['run', 'test:postgres'], { stdio: 'inherit', shell: true });
process.exit(test.status === 0 ? 0 : 1);
