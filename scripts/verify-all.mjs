#!/usr/bin/env node
/**
 * Sıralı otomatik doğrulama:
 *   typecheck → sunucu → deploy:checklist → E2E (auth, folio, entegrasyon, çoklu şube, i18n, roomio)
 *
 * Kullanım: npm run verify:all
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PORT = process.env.VERIFY_PORT ?? '3117';
const BASE = `http://127.0.0.1:${PORT}`;

function run(label, cmd, args, opts = {}) {
  const optional = Boolean(opts.optional);
  console.log(`\n▶ ${label}\n`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, ...opts.env },
  });
  if (r.status !== 0) {
    if (optional) {
      console.warn(`· ${label} atlandı (opsiyonel, kod ${r.status})`);
      return false;
    }
    console.error(`\n✗ ${label} başarısız (kod ${r.status})\n`);
    process.exit(r.status ?? 1);
  }
  return true;
}

function killPort() {
  spawnSync(
    `lsof -ti :${PORT} 2>/dev/null | xargs kill -9 2>/dev/null; true`,
    { shell: true, stdio: 'ignore' },
  );
}

async function waitHealth(maxMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
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

function chromiumInstalled() {
  try {
    const r = spawnSync(
      'node',
      ['-e', "const { chromium } = require('playwright'); const p = chromium.executablePath(); process.exit(require('fs').existsSync(p)?0:1)"],
      { cwd: ROOT, encoding: 'utf8' },
    );
    return r.status === 0;
  } catch {
    return false;
  }
}

async function main() {
  console.log('════════════════════════════════════════');
  console.log('  Roomio — verify:all');
  console.log(`  Port: ${PORT}`);
  console.log('════════════════════════════════════════');

  run('Typecheck', 'npm', ['run', 'typecheck']);

  if (process.env.VERIFY_BUILD === '1') {
    run('Production build', 'npm', ['run', 'build']);
  }

  run('Production-ready (statik)', 'npm', ['run', 'test:production-ready'], { optional: true });

  const pwOk = chromiumInstalled();
  if (!pwOk) {
    run('Playwright chromium', 'npx', ['playwright', 'install', 'chromium'], { optional: true });
  }
  const hasBrowser = chromiumInstalled();

  killPort();
  mkdirSync(join(ROOT, '.roomio/runtime'), { recursive: true });
  writeFileSync(join(ROOT, '.roomio/runtime/active-port.txt'), PORT);

  const useProductionServer = process.env.VERIFY_BUILD === '1';

  console.log(`\n▶ Sunucu başlatılıyor (${useProductionServer ? 'production' : 'dev'})…\n`);
  const server = spawn(
    'npx',
    useProductionServer
      ? ['next', 'start', '-p', PORT, '-H', '127.0.0.1']
      : ['next', 'dev', '-p', PORT, '-H', '127.0.0.1'],
    {
      cwd: ROOT,
      stdio: 'ignore',
      env: { ...process.env, ROOMIO_AUTH_REQUIRED: '0', WATCHPACK_POLLING: 'true' },
    },
  );

  const keepServer = process.env.VERIFY_KEEP_SERVER === '1';

  const shutdown = () => {
    try {
      server.kill('SIGTERM');
    } catch {
      /* ignore */
    }
    killPort();
  };

  process.on('SIGINT', () => {
    shutdown();
    process.exit(130);
  });
  if (!keepServer) {
    process.on('exit', shutdown);
  }

  console.log('▶ Health bekleniyor…\n');
  const healthy = await waitHealth();
  if (!healthy) {
    shutdown();
    console.error('✗ Sunucu /api/health yanıt vermedi');
    process.exit(1);
  }
  console.log(`✓ Sunucu hazır → ${BASE}`);

  run('Deploy checklist', 'npm', ['run', 'deploy:checklist'], {
    env: { ROOMIO_URL: BASE, ROOMIO_PUBLIC_URL: BASE },
  });

  run('Route smoke', 'npm', ['run', 'test:routes'], {
    env: { ROOMIO_URL: BASE },
  });

  run('Multi-property smoke', 'npm', ['run', 'test:multiproperty'], { optional: true });

  const e2eEnv = {
    ROOMIO_URL: BASE,
    PLAYWRIGHT_REUSE_SERVER: '1',
    PLAYWRIGHT_PORT: PORT,
    ROOMIO_AUTH_REQUIRED: '0',
  };

  async function e2e(label, spec, grep) {
    console.log(`\n▶ ${label}\n`);
    const args = ['run', 'test:e2e', '--', spec];
    if (grep) args.push('-g', grep);
    const r = spawnSync('npm', args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, ...e2eEnv },
    });
    if (r.status !== 0) {
      console.warn(`\n· ${label} ilk deneme başarısız — sunucu kontrol edilip yeniden deneniyor…\n`);
      if (!(await waitHealth(30_000))) {
        console.error(`\n✗ ${label} başarısız (sunucu yanıt vermiyor)\n`);
        process.exit(r.status ?? 1);
      }
      const retry = spawnSync('npm', args, {
        cwd: ROOT,
        stdio: 'inherit',
        shell: false,
        env: { ...process.env, ...e2eEnv },
      });
      if (retry.status !== 0) {
        console.error(`\n✗ ${label} başarısız (kod ${retry.status})\n`);
        process.exit(retry.status ?? 1);
      }
    }
  }

  await e2e('E2E — auth korumalı API', 'e2e/api-protected.spec.ts');

  const folioGrep = hasBrowser ? undefined : 'Folyo API|Kasa API';
  await e2e(hasBrowser ? 'E2E — folio & kasa (tam)' : 'E2E — folio & kasa (API only)', 'e2e/folio-cash.spec.ts', folioGrep);

  await e2e('E2E — entegrasyonlar', 'e2e/integrations.spec.ts');

  const multiGrep = hasBrowser
    ? undefined
    : 'login API token|properties API|konsolide PDF|fatura oluştur';
  await e2e(
    hasBrowser ? 'E2E — çoklu şube & muhasebe (tam)' : 'E2E — çoklu şube & muhasebe (API)',
    'e2e/auth-multiproperty.spec.ts',
    multiGrep,
  );

  await e2e('E2E — muhasebe CRUD', 'e2e/accounting-crud.spec.ts');

  await e2e('E2E — PDF şablonları', 'e2e/pdf-templates.spec.ts');

  await e2e('E2E — offline misafir talebi', 'e2e/offline-guest-request.spec.ts');

  await e2e('E2E — offline HK durumu', 'e2e/offline-hk-status.spec.ts');
  await e2e('E2E — offline trace', 'e2e/offline-guest-trace.spec.ts');

  await e2e('E2E — yazarkasa cihazları', 'e2e/fiscal-devices.spec.ts');

  await e2e('E2E — misafir ilişkileri CRUD', 'e2e/guest-relations-crud.spec.ts');

  await e2e('E2E — trace & review CRUD', 'e2e/guest-relations-traces-reviews.spec.ts');

  await e2e('E2E — kayıp/buluntu & reklamasyon', 'e2e/guest-relations-lost-reclamations.spec.ts');

  await e2e('E2E — banket folyo', 'e2e/fnb-banket-folio.spec.ts');

  await e2e('E2E — hızlı POS folyo', 'e2e/fnb-pos-folio.spec.ts');

  await e2e('E2E — çoklu şube canlı', 'e2e/multiproperty-live.spec.ts');

  const i18nGrep = hasBrowser ? undefined : 'locale API';
  await e2e(hasBrowser ? 'E2E — i18n & PWA (tam)' : 'E2E — i18n (API)', 'e2e/i18n-pwa.spec.ts', i18nGrep);

  const roomioGrep = hasBrowser
    ? undefined
    : 'rack API|dashboard API|rezervasyon listesi API|PDF export|housekeeping API|JWT login';
  await e2e(hasBrowser ? 'E2E — roomio çekirdek (tam)' : 'E2E — roomio çekirdek (API)', 'e2e/roomio.spec.ts', roomioGrep);

  if (keepServer) {
    server.unref();
    console.log('\n· Sunucu açık bırakıldı (VERIFY_KEEP_SERVER=1)\n');
  } else {
    shutdown();
  }

  console.log('\n════════════════════════════════════════');
  console.log('  ✓ verify:all tamamlandı');
  console.log('    · checklist + 57 route smoke');
  console.log('    · 160 E2E API testi');
  if (!hasBrowser) console.log('    · UI testleri atlandı → npm run verify:ui');
  console.log('════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
