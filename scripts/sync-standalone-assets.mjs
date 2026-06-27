#!/usr/bin/env node
/** Build sonrası standalone'a static + public kopyalar (next start uyarısını önler). */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { roomioDatabaseUrl } from './roomio-db-url.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const standalone = join(ROOT, '.next', 'standalone');
const staticDir = join(ROOT, '.next', 'static');
const publicDir = join(ROOT, 'public');

function fixStandaloneDatabaseUrl() {
  const envPath = join(standalone, '.env');
  const dbUrl = roomioDatabaseUrl();
  let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  if (/DATABASE_URL=/.test(env)) {
    env = env.replace(/DATABASE_URL=.*/, `DATABASE_URL="${dbUrl}"`);
  } else {
    env += `\nDATABASE_URL="${dbUrl}"\n`;
  }
  writeFileSync(envPath, env, 'utf8');
}

export function syncStandaloneAssets() {
  if (!existsSync(standalone)) return false;
  try {
    if (existsSync(publicDir)) {
      cpSync(publicDir, join(standalone, 'public'), { recursive: true });
    }
  } catch (err) {
    console.warn('[sync] public kopyalanamadı:', err instanceof Error ? err.message : err);
  }
  try {
    if (existsSync(staticDir)) {
      mkdirSync(join(standalone, '.next'), { recursive: true });
      cpSync(staticDir, join(standalone, '.next', 'static'), { recursive: true });
    }
  } catch (err) {
    console.warn('[sync] static kopyalanamadı:', err instanceof Error ? err.message : err);
  }
  fixStandaloneDatabaseUrl();
  return existsSync(join(standalone, 'server.js'));
}

if (process.argv[1]?.endsWith('sync-standalone-assets.mjs')) {
  const ok = syncStandaloneAssets();
  console.log(ok ? '[sync] standalone hazır' : '[sync] standalone yok — next start kullanılacak');
}
