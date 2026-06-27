#!/usr/bin/env node
/**
 * Ücretsiz Neon PostgreSQL → Render bağlantı rehberi (Starter $7 alternatifi).
 * Kullanım: npm run neon:postgres:setup
 */
import { spawnSync } from 'node:child_process';
import { customDomainUrl, productionUrl } from './render-production.mjs';

const SERVICE = process.env.RENDER_SERVICE_NAME ?? 'roomio-pms-v2';
const PROD = (productionUrl() ?? customDomainUrl()).replace(/\/$/, '');

console.log('\n── Neon PostgreSQL (ücretsiz, kalıcı veri) ──\n');
console.log('ℹ Render Postgres Starter ~$7/ay — Neon free tier kart istemez.');
console.log('ℹ Roomio kodu postgres:// URL\'yi otomatik algılar.\n');

console.log('📋 Adım 1 — Neon projesi\n');
console.log('1. https://neon.tech → Sign Up (GitHub ile)');
console.log('2. New Project → Name: roomio-pms');
console.log('3. Region: EU (Frankfurt yakını) → Create');
console.log('4. Dashboard → Connection string → **URI** kopyala');
console.log('   Örnek: postgresql://user:pass@ep-….eu-central-1.aws.neon.tech/neondb?sslmode=require\n');

console.log('📋 Adım 2 — Render Environment\n');
console.log(`1. https://dashboard.render.com → ${SERVICE} → Environment`);
console.log('2. DATABASE_URL = Neon URI (tam string, sslmode=require dahil)');
console.log('3. Silin:');
console.log('   - Eski DATABASE_URL=file:/tmp/roomio.db');
console.log('   - ROOMIO_PUSH_STORE, ROOMIO_DATA_DIR');
console.log('4. Save Changes → Manual Deploy (5–10 dk)\n');

console.log('📋 Adım 3 — Doğrula\n');
console.log('npm run render:postgres:verify');
console.log('Beklenen: Veritabanı: postgresql ✓ kalıcı\n');
console.log(`Health: ${PROD}/api/health → checks.database.detail = "postgresql"\n`);

console.log('📋 Notlar\n');
console.log('- Neon free: 0.5 GB, uyku modu olabilir (ilk istek 1–2 sn)');
console.log('- UptimeRobot health ping uyku sorununu azaltır');
console.log('- Push abonelikleri Postgres\'te kalıcı olur\n');

const test = spawnSync('npm', ['run', 'test:postgres'], { stdio: 'inherit', shell: true });
process.exit(test.status === 0 ? 0 : 1);
