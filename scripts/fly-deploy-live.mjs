#!/usr/bin/env node
/**
 * Gerçek Fly.io deploy.
 * Kullanım: npm run deploy:fly:live
 * Auth: .env.fly → FLY_API_TOKEN (interaktif login gerekmez)
 */
import { existsSync } from 'node:fs';
import { parseEnvFile } from './parse-env-file.mjs';
import { ensureFlyAuth } from './fly-auth.mjs';
import {
  defaultFlyUrl,
  flyAppName,
  runFly,
  saveProductionUrl,
  waitForHealth,
} from './fly-production.mjs';

const secretsArgIdx = process.argv.indexOf('--secrets');
const secretsFile = secretsArgIdx >= 0 ? process.argv[secretsArgIdx + 1] : null;
const skipSecrets = process.argv.includes('--skip-secrets');

console.log('\n── Fly.io canlı deploy ──\n');

const auth = await ensureFlyAuth();
if (!auth.ok) {
  console.error(`✗ ${auth.message}`);
  process.exit(1);
}
console.log(`✓ Oturum — ${auth.user}`);

const app = flyAppName();
console.log(`✓ Uygulama — ${app}`);

const apps = runFly(['apps', 'list']);
if (apps.status !== 0) {
  console.error('✗ fly apps list başarısız');
  console.error(apps.stderr?.trim() || apps.stdout?.trim());
  process.exit(1);
}

if (!apps.stdout.includes(app)) {
  console.log(`ℹ ${app} yok — fly launch oluşturuluyor…`);
  const launch = runFly(['launch', '--no-deploy', '--copy-config', '--yes', '-a', app], { inherit: true });
  if (launch.status !== 0) {
    console.error('✗ fly launch başarısız');
    process.exit(1);
  }
}

const volumes = runFly(['volumes', 'list', '-a', app]);
if (volumes.status === 0 && !volumes.stdout.includes('roomio_data')) {
  console.log('ℹ Volume oluşturuluyor — roomio_data (fra, 1GB)…');
  const vol = runFly(['volumes', 'create', 'roomio_data', '--region', 'fra', '--size', '1', '-a', app], { inherit: true });
  if (vol.status !== 0) {
    console.warn('⚠ Volume oluşturulamadı — fly.toml mounts kontrol edin');
  }
}

if (!skipSecrets) {
  let secretSource = secretsFile;
  if (!secretSource && existsSync('.env.production')) secretSource = '.env.production';
  if (secretSource && existsSync(secretSource)) {
    const env = parseEnvFile(secretSource);
    const pairs = Object.entries(env).filter(([k, v]) => v && !k.startsWith('#'));
    if (pairs.length) {
      console.log(`ℹ Secrets aktarılıyor — ${secretSource} (${pairs.length} anahtar)`);
      const set = runFly(['secrets', 'set', ...pairs.map(([k, v]) => `${k}=${v}`), '-a', app], { inherit: true });
      if (set.status !== 0) process.exit(1);
    }
  } else if (existsSync('.env.vapid.generated')) {
    const vapid = parseEnvFile('.env.vapid.generated');
    const jwt = process.env.ROOMIO_JWT_SECRET ?? `roomio-${Date.now()}-prod`;
    console.log('ℹ VAPID + JWT secrets aktarılıyor (.env.vapid.generated)…');
    const set = runFly([
      'secrets', 'set',
      `ROOMIO_JWT_SECRET=${jwt}`,
      `VAPID_PUBLIC_KEY=${vapid.VAPID_PUBLIC_KEY}`,
      `VAPID_PRIVATE_KEY=${vapid.VAPID_PRIVATE_KEY}`,
      `VAPID_SUBJECT=${vapid.VAPID_SUBJECT ?? 'mailto:hk@hotelsapphire.com'}`,
      '-a', app,
    ], { inherit: true });
    if (set.status !== 0) process.exit(1);
  } else {
    console.log('ℹ Secret dosyası yok — mevcut Fly secrets korunuyor');
  }
}

console.log('\nℹ fly deploy --remote-only…');
const deploy = runFly(['deploy', '--remote-only', '-a', app], { inherit: true });
if (deploy.status !== 0) {
  console.error('\n✗ fly deploy başarısız');
  process.exit(1);
}

const base = defaultFlyUrl(app);
saveProductionUrl(base);
console.log(`\n✓ Production URL → ${base}`);

console.log('ℹ Health bekleniyor…');
const health = await waitForHealth(base, 45, 3000);
if (!health.ok) {
  console.error('✗ Production health zaman aşımı');
  process.exit(1);
}

console.log(`✓ Health OK — ${health.body?.checks?.monitoring?.detail ?? '?'}`);
console.log(`📱 ${base}/housekeeping/mobile\n`);
