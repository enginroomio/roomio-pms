#!/usr/bin/env node
/**
 * Production Postgres durumu — health API üzerinden sqlite vs postgresql.
 * Kullanım: npm run render:postgres:verify
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { customDomainUrl, productionUrl, saveProductionUrl } from './render-production.mjs';

const BASE = (productionUrl() ?? customDomainUrl()).replace(/\/$/, '');

async function probe() {
  const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(20_000) });
  const body = await res.json().catch(() => ({}));
  const provider = body?.checks?.database?.detail ?? 'unknown';
  const isPostgres = provider === 'postgresql';

  const routes = [];
  for (const path of ['/api/housekeeping/faults', '/api/housekeeping/requests']) {
    const r = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(15_000) });
    routes.push({ path, status: r.status, ok: r.status === 200 });
  }

  return { ok: res.ok && body.ok === true, provider, isPostgres, body, routes };
}

console.log('\n── Postgres production doğrulama ──\n');
console.log(`Hedef: ${BASE}\n`);

saveProductionUrl(BASE);

let result;
try {
  result = await probe();
} catch (err) {
  console.error('✗ Health erişilemedi:', err instanceof Error ? err.message : err);
  process.exit(1);
}

console.log(`Health: ${result.ok ? '✓' : '✗'}`);
console.log(`Veritabanı: ${result.provider}${result.isPostgres ? ' ✓ kalıcı' : ' ⚠ geçici (sqlite/tmp)'}`);
console.log(`Uptime: ${result.body.uptimeSec ?? '?'}s · git ${result.body.gitSha ?? '?'}`);
console.log(`Monitoring: ${result.body.checks?.monitoring?.detail ?? '—'}`);

console.log('\nHK API:');
for (const r of result.routes) {
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.path} [${r.status}]`);
}

if (result.isPostgres) {
  console.log('\n✅ Production PostgreSQL aktif — veri kalıcı.\n');
} else {
  console.log('\n⚠️ Hâlâ SQLite (/tmp) — deploy sonrası veri sıfırlanır.\n');
  console.log('Kurulum: npm run render:postgres:setup\n');
  console.log('Özet:');
  console.log('  1. Render → New PostgreSQL → roomio-db (Frankfurt, Starter)');
  console.log(`  2. ${process.env.RENDER_SERVICE_NAME ?? 'roomio-pms-v2'} → Environment`);
  console.log('  3. DATABASE_URL = Internal Database URL (postgres://...)');
  console.log('  4. PRISMA_SCHEMA=postgresql (isteğe bağlı)');
  console.log('  5. Save → Manual Deploy');
  console.log('  6. npm run render:postgres:verify\n');
}

const report = { at: new Date().toISOString(), base: BASE, ...result };
const dir = join(process.cwd(), '.roomio');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'postgres-verify.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

process.exit(result.isPostgres ? 0 : 1);
