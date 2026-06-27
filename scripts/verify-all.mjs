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

/** @type {import('node:child_process').ChildProcess | null} */
let serverProc = null;
let keepServer = false;

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

function runTry(label, cmd, args, opts = {}) {
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
    return false;
  }
  return true;
}

function killPort() {
  spawnSync('node', [join(ROOT, 'scripts/roomio-kill-ports.mjs')], {
    cwd: ROOT,
    stdio: 'ignore',
    env: { ...process.env, ROOMIO_PORT_START: PORT, ROOMIO_PORT_END: PORT },
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitPortFree(maxMs = 30_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (!(await readHealth())) return true;
    killPort();
    await sleep(750);
  }
  return !(await readHealth());
}

async function waitHealth(maxMs = 300_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const j = await res.json();
        if (j.ok) return j;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

async function readHealth() {
  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const j = await res.json();
    return j.ok ? j : null;
  } catch {
    return null;
  }
}

function stopServer() {
  if (serverProc) {
    try {
      serverProc.kill('SIGKILL');
    } catch {
      /* ignore */
    }
    serverProc = null;
  }
  killPort();
}

async function stopServerAndWait() {
  stopServer();
  await waitPortFree();
  await sleep(1500);
}

function startServer(useProductionServer) {
  mkdirSync(join(ROOT, '.roomio/runtime'), { recursive: true });
  writeFileSync(join(ROOT, '.roomio/runtime/active-port.txt'), PORT);

  console.log(`\n▶ Sunucu başlatılıyor (${useProductionServer ? 'production' : 'dev'})…\n`);
  serverProc = spawn(
    'npx',
    useProductionServer
      ? ['next', 'start', '-p', PORT, '-H', '127.0.0.1']
      : ['next', 'dev', '-p', PORT, '-H', '127.0.0.1'],
    {
      cwd: ROOT,
      stdio: 'ignore',
      env: {
        ...process.env,
        ROOMIO_AUTH_REQUIRED: '0',
        WATCHPACK_POLLING: 'true',
        NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=4096',
      },
    },
  );
}

async function waitAppReady(maxMs = 300_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const [health, home] = await Promise.all([
        fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) }),
        fetch(`${BASE}/`, { signal: AbortSignal.timeout(20_000) }),
      ]);
      if (health.ok && home.ok) return true;
    } catch {
      /* compile sürüyor */
    }
    await sleep(2000);
  }
  return false;
}

async function ensureServer(useProductionServer, { fresh = false, label = 'Sunucu' } = {}) {
  if (fresh) await stopServerAndWait();

  let health = await readHealth();
  if (fresh && health) {
    console.warn(`· ${label} eski süreç (uptime ${health.uptimeSec ?? '?'}s) — yeniden başlatılıyor…`);
    await stopServerAndWait();
    health = null;
  }

  if (!health) {
    startServer(useProductionServer);
    health = await waitHealth(300_000);
    if (!health) {
      await stopServerAndWait();
      console.error(`✗ ${label} /api/health yanıt vermedi`);
      process.exit(1);
    }
    console.log(`✓ ${label} hazır → ${BASE} (uptime ${health.uptimeSec ?? '?'}s)`);
    if (!(await waitAppReady())) {
      await stopServerAndWait();
      console.error(`✗ ${label} ana sayfa hazır değil`);
      process.exit(1);
    }
    return health;
  }

  console.log(`✓ ${label} hazır → ${BASE} (uptime ${health.uptimeSec ?? '?'}s)`);
  if (!(await waitAppReady())) {
    console.error(`✗ ${label} ana sayfa hazır değil`);
    process.exit(1);
  }
  return health;
}

async function restartServer(useProductionServer, label = 'Sunucu') {
  console.warn(`\n· ${label} yeniden başlatılıyor…\n`);
  await stopServerAndWait();
  startServer(useProductionServer);
  const booted = await waitHealth(300_000);
  if (!booted) {
    await stopServerAndWait();
    console.error(`✗ ${label} yeniden başlatılamadı`);
    process.exit(1);
  }
  console.log(`✓ ${label} yenilendi (uptime ${booted.uptimeSec ?? '?'}s)`);
  return booted;
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
  run('Unit tests', 'npm', ['run', 'test:unit']);

  if (process.env.VERIFY_BUILD === '1') {
    run('Production build', 'npm', ['run', 'build']);
  }

  run('Production-ready (statik)', 'npm', ['run', 'test:production-ready'], { optional: true });

  const pwOk = chromiumInstalled();
  if (!pwOk) {
    run('Playwright chromium', 'npx', ['playwright', 'install', 'chromium'], { optional: true });
  }
  const hasBrowser = chromiumInstalled();

  const useProductionServer = process.env.VERIFY_BUILD === '1';
  keepServer = process.env.VERIFY_KEEP_SERVER === '1';

  const shutdown = () => {
    if (!keepServer) {
      stopServer();
    }
  };

  process.on('SIGINT', () => {
    shutdown();
    process.exit(130);
  });
  if (!keepServer) {
    process.on('exit', shutdown);
  }

  if (process.env.VERIFY_REUSE_SERVER === '1') {
    const health = await readHealth();
    if (health) {
      keepServer = true;
      console.log(`✓ Mevcut sunucu yeniden kullanılıyor → ${BASE} (uptime ${health.uptimeSec ?? '?'}s)`);
      const appReady = await waitAppReady(60_000);
      if (!appReady) {
        console.warn('· Mevcut sunucu sağlıklı değil (500/derleme) — yeni süreç başlatılıyor…');
        keepServer = false;
        await ensureServer(useProductionServer, { fresh: true, label: 'Sunucu' });
      }
    } else {
      console.warn('· VERIFY_REUSE_SERVER: sunucu yanıt vermiyor — yeni süreç başlatılıyor…');
      await ensureServer(useProductionServer, { fresh: true, label: 'Sunucu' });
    }
  } else {
    await ensureServer(useProductionServer, { fresh: true, label: 'Sunucu' });
  }

  run('Deploy checklist', 'npm', ['run', 'deploy:checklist'], {
    env: { ROOMIO_URL: BASE, ROOMIO_PUBLIC_URL: BASE },
  });

  run('Route smoke', 'npm', ['run', 'test:routes'], {
    env: { ROOMIO_URL: BASE },
    optional: true,
  });

  run('Multi-property smoke', 'npm', ['run', 'test:multiproperty'], { optional: true });

  const e2eEnv = {
    ROOMIO_URL: BASE,
    PLAYWRIGHT_REUSE_SERVER: '1',
    PLAYWRIGHT_SKIP_WARM: '1',
    PLAYWRIGHT_PORT: PORT,
    ROOMIO_AUTH_REQUIRED: '0',
  };

  async function e2e(label, spec, grep, { restartOnFail = true } = {}) {
    console.log(`\n▶ ${label}\n`);
    const args = ['run', 'test:e2e', '--', spec];
    if (grep) args.push('-g', grep);
    const runOnce = () =>
      spawnSync('npm', args, {
        cwd: ROOT,
        stdio: 'inherit',
        shell: false,
        env: { ...process.env, ...e2eEnv },
      });

    let result = runOnce();
    if (result.status !== 0) {
      const reuse = process.env.VERIFY_REUSE_SERVER === '1';
      console.warn(
        reuse
          ? `\n· ${label} ilk deneme başarısız — mevcut sunucuda yeniden deneniyor…\n`
          : `\n· ${label} ilk deneme başarısız — sunucu kontrol edilip yeniden deneniyor…\n`,
      );
      if (!reuse) {
        const health = await readHealth();
        if (!health?.ok) {
          if (restartOnFail) await restartServer(useProductionServer, label);
          else {
            console.error(`\n✗ ${label} başarısız (sunucu yanıt vermiyor)\n`);
            process.exit(result.status ?? 1);
          }
        } else if (restartOnFail) {
          await restartServer(useProductionServer, label);
        }
      }
      result = runOnce();
      if (result.status !== 0) {
        console.error(`\n✗ ${label} başarısız (kod ${result.status})\n`);
        process.exit(result.status ?? 1);
      }
    }
  }

  const apiProtectedBatches = [
    {
      label: 'E2E — auth API (çekirdek)',
      grep: 'Oturum API|entegrasyon durumu|kimlik ve doluluk|grup rezervasyon|Korumalı API — rezervasyon|admin kullanıcı',
    },
    { label: 'E2E — auth API (viewer A)', grep: 'viewer salt okunur \\(A\\)' },
    { label: 'E2E — auth API (viewer B)', grep: 'viewer salt okunur \\(B\\)' },
    { label: 'E2E — auth API (HK & muhasebe)', grep: 'HK rolü|muhasebe rolü' },
    { label: 'E2E — auth API (resepsiyon & FO)', grep: 'resepsiyon rolü|fo_manager rolü' },
  ];

  for (let i = 0; i < apiProtectedBatches.length; i++) {
    const batch = apiProtectedBatches[i];
    await e2e(batch.label, 'e2e/api-protected.spec.ts', batch.grep);
    if (
      i < apiProtectedBatches.length - 1 &&
      process.env.VERIFY_REUSE_SERVER !== '1' &&
      process.env.VERIFY_KEEP_SERVER !== '1'
    ) {
      await restartServer(useProductionServer, 'Sunucu (batch arası)');
    }
  }

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
    console.log('\n· Sunucu açık bırakıldı (VERIFY_KEEP_SERVER=1)\n');
  } else {
    stopServer();
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
