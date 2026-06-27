#!/usr/bin/env node
/**
 * Tüm rotaları küçük partiler halinde test eder (dev sunucu takılmalarını önler).
 * Kullanım: npm run test:routes:all
 */
import { spawnSync } from 'node:child_process';
import { ROUTES } from './test-routes.mjs';

const BATCH = Number(process.env.ROUTE_TEST_BATCH_SIZE ?? 25);
const env = { ...process.env, ROUTE_TEST_WARMUP: process.env.ROUTE_TEST_WARMUP ?? '0' };
const total = ROUTES.length;
let failed = 0;

console.log(`Toplu rota testi — ${total} rota, partiler: ${BATCH}\n`);

for (let offset = 0; offset < total; offset += BATCH) {
  const limit = Math.min(BATCH, total - offset);
  console.log(`\n── Parti ${Math.floor(offset / BATCH) + 1}: ${offset}–${offset + limit - 1} ──\n`);
  const res = spawnSync('node', ['scripts/test-routes.mjs'], {
    env: { ...env, ROUTE_TEST_OFFSET: String(offset), ROUTE_TEST_LIMIT: String(limit) },
    stdio: 'inherit',
  });
  if (res.status !== 0) failed += 1;
  await new Promise((r) => setTimeout(r, 1500));
}

console.log(`\nToplu test bitti — ${failed} başarısız parti / ${Math.ceil(total / BATCH)}`);
process.exit(failed > 0 ? 1 : 0);
