#!/usr/bin/env node
/**
 * Tam otomatik doğrulama pipeline — adımlar ardışık, bekleme yok.
 *
 * Aşamalar:
 *   1. API tam (verify:all) — typecheck, checklist, routes, 160 E2E API
 *   2. UI rollout (verify:ui) — chromium varsa, aynı sunucu
 *   3. Production build smoke — build + next start + kritik E2E
 *   4. Auth-required smoke — ROOMIO_AUTH_REQUIRED=1 + JWT 401/403
 *   5. Tam rollout E2E — tüm rollout-*.spec.ts
 *   6. Docker deploy smoke — test:docker
 *   7. Canlı URL checklist — ROOMIO_PUBLIC_URL varsa
 *
 * Kullanım: npm run verify:pipeline
 * Atlama: VERIFY_SKIP_UI=1 VERIFY_SKIP_PROD=1 VERIFY_SKIP_AUTH=1
 *         VERIFY_SKIP_ROLLOUT=1 VERIFY_SKIP_DOCKER=1 VERIFY_SKIP_LIVE=1
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();
const DEV_PORT = process.env.VERIFY_PORT ?? '3117';
const PROD_PORT = process.env.VERIFY_PROD_PORT ?? '3118';
const AUTH_PORT = process.env.VERIFY_AUTH_PORT ?? '3119';

const stages = [];

function chromiumInstalled() {
  const r = spawnSync(
    'node',
    ['-e', "const { chromium } = require('playwright'); const p = chromium.executablePath(); process.exit(require('fs').existsSync(p)?0:1)"],
    { cwd: ROOT, encoding: 'utf8' },
  );
  return r.status === 0;
}

function killPort(port) {
  spawnSync(`lsof -ti :${port} 2>/dev/null | xargs kill -9 2>/dev/null; true`, { shell: true, stdio: 'ignore' });
}

function runStage(num, label, script, extraEnv = {}, optional = false) {
  const t0 = Date.now();
  console.log('\n╔════════════════════════════════════════╗');
  console.log(`║  AŞAMA ${num}: ${label.padEnd(28)}║`);
  console.log('╚════════════════════════════════════════╝\n');

  const r = spawnSync('node', [join(ROOT, script)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });

  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  const ok = r.status === 0;
  stages.push({ num, label, ok, sec, skipped: false });

  if (!ok) {
    if (optional) {
      console.warn(`\n· Aşama ${num} atlandı (opsiyonel, kod ${r.status})\n`);
      stages[stages.length - 1].skipped = true;
      stages[stages.length - 1].ok = true;
      return true;
    }
    console.error(`\n✗ Pipeline durdu — Aşama ${num} başarısız (${sec}s)\n`);
    printSummary();
    process.exit(r.status ?? 1);
  }
  console.log(`\n✓ Aşama ${num} tamam (${sec}s) → sonraki aşamaya geçiliyor…\n`);
  return true;
}

function runNpmStage(num, label, npmScript, extraEnv = {}, optional = false) {
  const t0 = Date.now();
  console.log('\n╔════════════════════════════════════════╗');
  console.log(`║  AŞAMA ${num}: ${label.padEnd(28)}║`);
  console.log('╚════════════════════════════════════════╝\n');

  const r = spawnSync('npm', ['run', npmScript], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });

  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  const ok = r.status === 0;
  stages.push({ num, label, ok, sec, skipped: false });

  if (!ok) {
    if (optional) {
      console.warn(`\n· Aşama ${num} atlandı (opsiyonel, kod ${r.status})\n`);
      stages[stages.length - 1].skipped = true;
      stages[stages.length - 1].ok = true;
      return true;
    }
    console.error(`\n✗ Pipeline durdu — Aşama ${num} başarısız (${sec}s)\n`);
    printSummary();
    process.exit(r.status ?? 1);
  }
  console.log(`\n✓ Aşama ${num} tamam (${sec}s) → sonraki aşamaya geçiliyor…\n`);
  return true;
}

function skipStage(num, label, reason) {
  stages.push({ num, label, ok: true, sec: '0', skipped: true, reason });
  console.log(`\n· Aşama ${num} atlandı: ${reason}\n`);
}

function printSummary() {
  console.log('\n════════════════════════════════════════');
  console.log('  Pipeline özeti');
  console.log('════════════════════════════════════════');
  for (const s of stages) {
    const mark = s.skipped ? '○' : s.ok ? '✓' : '✗';
    const note = s.skipped ? ` (${s.reason ?? 'atlandı'})` : '';
    console.log(`  ${mark} Aşama ${s.num}: ${s.label} — ${s.sec}s${note}`);
  }
  console.log('════════════════════════════════════════\n');
}

function main() {
  const t0 = Date.now();
  console.log('════════════════════════════════════════');
  console.log('  Roomio — verify:pipeline (otomatik zincir)');
  console.log('════════════════════════════════════════');
  console.log('\nAşamalar (ardışık, bekleme yok):');
  console.log('  1 API tam → 2 UI rollout → 3 Prod build');
  console.log('  4 Auth-required → 5 Tam rollout → 6 Docker → 7 Canlı URL\n');

  killPort(DEV_PORT);
  killPort(PROD_PORT);
  killPort(AUTH_PORT);

  runStage(1, 'API tam doğrulama', 'scripts/verify-all.mjs', {
    VERIFY_PORT: DEV_PORT,
    VERIFY_KEEP_SERVER: '1',
  });

  if (process.env.VERIFY_SKIP_UI === '1') {
    skipStage(2, 'UI rollout', 'VERIFY_SKIP_UI=1');
  } else if (!chromiumInstalled()) {
    spawnSync('npx', ['playwright', 'install', 'chromium'], { cwd: ROOT, stdio: 'inherit', shell: false });
  }
  if (process.env.VERIFY_SKIP_UI !== '1') {
    if (chromiumInstalled()) {
      runStage(2, 'UI rollout', 'scripts/verify-ui.mjs', {
        VERIFY_PORT: DEV_PORT,
        PLAYWRIGHT_REUSE_SERVER: '1',
      });
    } else {
      skipStage(2, 'UI rollout', 'chromium kurulu değil');
    }
  }

  killPort(DEV_PORT);

  if (process.env.VERIFY_SKIP_PROD === '1') {
    skipStage(3, 'Production build smoke', 'VERIFY_SKIP_PROD=1');
  } else {
    runStage(3, 'Production build smoke', 'scripts/verify-all.mjs', {
      VERIFY_PORT: PROD_PORT,
      VERIFY_BUILD: '1',
      // `next start` (production mod) artık zayıf/eksik ROOMIO_JWT_SECRET'ı
      // reddediyor (bkz. lib/auth/jwt-edge.ts) — bu pipeline gerçek bir
      // secret olmadan da çalışabilsin diye, ortamda zaten yoksa test-only
      // güçlü bir secret sağlıyoruz. Gerçek bir production secret değildir,
      // sadece bu smoke testin process'ine özeldir.
      ROOMIO_JWT_SECRET: process.env.ROOMIO_JWT_SECRET ?? 'verify-pipeline-test-only-secret-not-for-production-use-1234',
      ROOMIO_GUEST_PORTAL_SECRET: process.env.ROOMIO_GUEST_PORTAL_SECRET ?? 'verify-pipeline-test-only-guest-secret-not-for-prod-5678',
    });
    killPort(PROD_PORT);
  }

  if (process.env.VERIFY_SKIP_AUTH === '1') {
    skipStage(4, 'Auth-required smoke', 'VERIFY_SKIP_AUTH=1');
  } else {
    runStage(4, 'Auth-required smoke', 'scripts/verify-auth-required.mjs', {
      VERIFY_AUTH_PORT: AUTH_PORT,
    });
    killPort(AUTH_PORT);
  }

  if (process.env.VERIFY_SKIP_ROLLOUT === '1') {
    skipStage(5, 'Tam rollout E2E', 'VERIFY_SKIP_ROLLOUT=1');
  } else if (!chromiumInstalled()) {
    skipStage(5, 'Tam rollout E2E', 'chromium kurulu değil');
  } else {
    runStage(5, 'Tam rollout E2E', 'scripts/verify-rollout.mjs', {
      VERIFY_PORT: DEV_PORT,
    });
    killPort(DEV_PORT);
  }

  if (process.env.VERIFY_SKIP_DOCKER === '1') {
    skipStage(6, 'Docker deploy smoke', 'VERIFY_SKIP_DOCKER=1');
  } else {
    runNpmStage(6, 'Docker deploy smoke', 'test:docker');
  }

  const liveUrl = process.env.ROOMIO_PUBLIC_URL?.trim();
  if (process.env.VERIFY_SKIP_LIVE === '1') {
    skipStage(7, 'Canlı URL checklist', 'VERIFY_SKIP_LIVE=1');
  } else if (!liveUrl) {
    skipStage(7, 'Canlı URL checklist', 'ROOMIO_PUBLIC_URL ayarlanmadı');
  } else {
    runNpmStage(7, 'Canlı URL checklist', 'deploy:checklist', {
      ROOMIO_PUBLIC_URL: liveUrl,
      ROOMIO_URL: liveUrl,
    });
  }

  const totalMin = ((Date.now() - t0) / 60_000).toFixed(1);
  printSummary();
  console.log(`  Toplam süre: ${totalMin} dk`);
  console.log('  ✓ verify:pipeline tamamlandı\n');
}

main();
