#!/usr/bin/env node
/**
 * Yerel ortamı uçtan uca hazırlar: typecheck → build → sunucu → checklist → e2e.
 * Kullanım: npm run setup:verify
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DEFAULT_BASE = 'http://127.0.0.1:3100';

function activeBase() {
  const portFile = join(ROOT, '.roomio/runtime/active-port.txt');
  if (existsSync(portFile)) {
    const p = readFileSync(portFile, 'utf8').trim();
    if (p) return `http://127.0.0.1:${p}`;
  }
  return process.env.ROOMIO_URL ?? DEFAULT_BASE;
}

function run(label, cmd, args, opts = {}) {
  const optional = Boolean(opts.optional);
  console.log(`\n▶ ${label}\n`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...opts.env },
  });
  if (r.status !== 0) {
    if (optional) {
      console.warn(`· ${label} atlandı (opsiyonel)`);
      return false;
    }
    console.error(`\n✗ ${label} başarısız (kod ${r.status})\n`);
    process.exit(r.status ?? 1);
  }
  return true;
}

async function apiSmoke() {
  const base = activeBase();
  console.log(`\n▶ API smoke testleri (${base})\n`);
  const resList = await fetch(`${base}/api/reservations`, { signal: AbortSignal.timeout(30_000) });
  if (!resList.ok) throw new Error('reservations API');
  const { reservations } = await resList.json();
  const inHouse = reservations.find((r) => r.status === 'CHECKED_IN');
  if (!inHouse) throw new Error('CHECKED_IN rezervasyon yok');

  const folioBefore = await (await fetch(`${base}/api/folio?reservationId=${inHouse.id}`)).json();
  const charge = await fetch(`${base}/api/folio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'charge', reservationId: inHouse.id, amount: 1, description: 'setup smoke' }),
  });
  if (!charge.ok) throw new Error('folio charge');
  const folioAfter = await (await fetch(`${base}/api/folio?reservationId=${inHouse.id}`)).json();
  if (folioAfter.balance <= folioBefore.balance) throw new Error('folio balance');

  const transfer = await fetch(`${base}/api/cash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'transfer', fromRegister: 'Resepsiyon 1', toRegister: 'Ana Kasa', amount: 1 }),
  });
  if (!transfer.ok) throw new Error('cash transfer');

  const health = await (await fetch(`${base}/api/health`)).json();
  if (!health.ok) throw new Error('health');
  console.log('✓ API smoke geçti');
}

function ensureEnv() {
  const envPath = join(ROOT, '.env');
  const localPath = join(ROOT, '.env.local');
  let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  const additions = [];
  if (!/ROOMIO_AUTH_REQUIRED=/m.test(env)) additions.push('ROOMIO_AUTH_REQUIRED=0');
  if (!/ROOMIO_JWT_SECRET=/m.test(env)) {
    additions.push('ROOMIO_JWT_SECRET=roomio-dev-secret-32chars-minimum!!');
  }
  if (additions.length) {
    const block = `\n# setup:verify — ${new Date().toISOString()}\n${additions.join('\n')}\n`;
    writeFileSync(envPath, env + block);
    console.log(`✓ .env güncellendi: ${additions.join(', ')}`);
  }
  if (!existsSync(localPath)) {
    writeFileSync(localPath, 'ROOMIO_AUTH_REQUIRED=0\n');
    console.log('✓ .env.local oluşturuldu (auth kapalı — geliştirme)');
  }
}

async function waitHealth(maxMs = 90_000) {
  const base = activeBase();
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const j = await res.json();
        if (j.ok) return true;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

async function main() {
  console.log('════════════════════════════════════════');
  console.log('  Roomio — Yerel otomatik kurulum');
  console.log('════════════════════════════════════════\n');

  ensureEnv();

  run('Typecheck', 'npm', ['run', 'typecheck']);
  const pwOk = run('Playwright tarayıcı', 'npx', ['playwright', 'install', 'chromium'], { optional: true });
  const buildOk = run('Production build', 'npm', ['run', 'build'], { optional: true });
  if (!buildOk) {
    console.log('\n· Production build başarısız — dev sunucusu ile devam ediliyor\n');
  }

  console.log('\n▶ Sunucu başlatılıyor…\n');
  spawnSync('npm', ['run', 'restart', '--', '--quick', '--no-test'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ROOMIO_AUTH_REQUIRED: '0' },
  });
  writeFileSync(join(ROOT, '.env.local'), 'ROOMIO_AUTH_REQUIRED=0\n');

  console.log('\n▶ Health bekleniyor…\n');
  const healthy = await waitHealth();
  if (!healthy) {
    console.error('✗ Sunucu /api/health yanıt vermedi');
    process.exit(1);
  }
  console.log('✓ Sunucu hazır');

  run('Deploy checklist', 'npm', ['run', 'deploy:checklist'], {
    env: { ROOMIO_PUBLIC_URL: activeBase() },
  });

  await apiSmoke();

  if (pwOk) {
    run('E2E — folio & kasa', 'npm', ['run', 'test:e2e', '--', 'e2e/folio-cash.spec.ts']);
    run('E2E — auth & çoklu şube', 'npm', ['run', 'test:e2e', '--', 'e2e/auth-multiproperty.spec.ts']);
    run('E2E — ön kasa rollout', 'npm', ['run', 'test:e2e', '--', 'e2e/rollout-onkasa.spec.ts']);
    run('E2E — rezervasyon rollout', 'npm', ['run', 'test:e2e', '--', 'e2e/rollout-rezervasyon.spec.ts']);
  } else {
    console.log('\n· Playwright tarayıcı yok — E2E UI testleri atlandı (API smoke geçti)\n');
  }

  if (process.env.SETUP_SKIP_PIPELINE === '1') {
    console.log('\n· Pipeline atlandı (SETUP_SKIP_PIPELINE=1)\n');
  } else {
    console.log('\n▶ Otomatik pipeline (verify:ci)…\n');
    const pipe = spawnSync('npm', ['run', 'verify:ci'], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
    if (pipe.status !== 0) {
      console.error('\n✗ Pipeline doğrulama başarısız\n');
      process.exit(pipe.status ?? 1);
    }
  }

  console.log('\n════════════════════════════════════════');
  console.log(`  ✓ setup:auto tamam → ${activeBase()}`);
  console.log('  · Tam pipeline: npm run verify:pipeline');
  console.log('  · Hızlı CI: npm run verify:ci');
  console.log('════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
