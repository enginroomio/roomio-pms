#!/usr/bin/env node
/**
 * Fly.io token tabanlı oturum — interaktif login gerekmez.
 * Token: .env.fly → FLY_API_TOKEN=...
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseEnvFile } from './parse-env-file.mjs';
import { ensureFlyInstalled, installFlyToProject, localFlyBin } from './fly-install.mjs';

const ENV_FLY = join(process.cwd(), '.env.fly');
const ENV_FLY_EXAMPLE = join(process.cwd(), '.env.fly.example');

export function loadFlyToken() {
  if (process.env.FLY_API_TOKEN?.trim()) return process.env.FLY_API_TOKEN.trim();
  if (process.env.FLY_ACCESS_TOKEN?.trim()) return process.env.FLY_ACCESS_TOKEN.trim();
  if (existsSync(ENV_FLY)) {
    const env = parseEnvFile(ENV_FLY);
    const token = env.FLY_API_TOKEN?.trim() || env.FLY_ACCESS_TOKEN?.trim() || null;
    if (token) return token;
  }
  return null;
}

export function hasFlyToken() {
  return Boolean(loadFlyToken());
}

export function saveFlyToken(token) {
  mkdirSync(join(process.cwd(), '.roomio'), { recursive: true });
  writeFileSync(ENV_FLY, `# Fly.io API token — https://fly.io/user/personal_access_tokens\nFLY_API_TOKEN=${token}\n`, 'utf8');
}

export function flyProcessEnv(extra = {}) {
  const token = loadFlyToken();
  const env = { ...process.env, ...extra };
  if (token) {
    env.FLY_API_TOKEN = token;
    env.FLY_ACCESS_TOKEN = token;
  }
  const bin = localFlyBin();
  if (bin) env.PATH = `${join(process.cwd(), '.roomio', 'bin')}:${env.PATH ?? ''}`;
  return env;
}

export async function ensureFlyAuth() {
  const token = loadFlyToken();
  let bin = localFlyBin();
  if (!bin && spawnSync('fly', ['version'], { stdio: 'ignore' }).status === 0) bin = 'fly';

  if (!bin) {
    if (token) {
      try {
        bin = await installFlyToProject();
      } catch (e) {
        return {
          ok: false,
          message: `flyctl kurulamadı: ${e instanceof Error ? e.message : e}\nManuel: brew install flyctl`,
        };
      }
    } else {
      if (!existsSync(ENV_FLY_EXAMPLE)) {
        writeFileSync(ENV_FLY_EXAMPLE, `# Fly.io personal access token\n# Oluştur: https://fly.io/user/personal_access_tokens\nFLY_API_TOKEN=\n`, 'utf8');
      }
      return {
        ok: false,
        bin: 'fly',
        message: [
          'Fly API token gerekli (interaktif login yok).',
          '1. https://fly.io/user/personal_access_tokens → token oluştur',
          '2. cp .env.fly.example .env.fly && token yapıştır',
          '3. npm run deploy:faz11',
        ].join('\n'),
      };
    }
  }

  const env = flyProcessEnv();
  const whoami = spawnSync(bin, ['auth', 'whoami'], { encoding: 'utf8', env });
  if (whoami.status === 0 && whoami.stdout.trim()) {
    return { ok: true, user: whoami.stdout.trim(), bin };
  }

  if (!token) {
    if (existsSync(ENV_FLY)) {
      const env = parseEnvFile(ENV_FLY);
      const raw = env.FLY_API_TOKEN ?? env.FLY_ACCESS_TOKEN ?? '';
      if (raw === '') {
        return {
          ok: false,
          bin,
          message: [
            '.env.fly dosyasında FLY_API_TOKEN boş.',
            '1. https://fly.io/user/personal_access_tokens → token oluştur',
            '2. .env.fly → FLY_API_TOKEN=fo1_... (tırnak yok)',
            '3. npm run deploy:faz11',
          ].join('\n'),
        };
      }
    }
    return {
      ok: false,
      bin,
      message: 'FLY_API_TOKEN geçersiz veya süresi dolmuş — yeni token oluşturun',
    };
  }

  return {
    ok: false,
    bin,
    message: 'Fly token reddedildi — .env.fly içindeki FLY_API_TOKEN kontrol edin',
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const auth = await ensureFlyAuth();
  if (auth.ok) {
    console.log(`✓ Fly auth — ${auth.user}`);
    process.exit(0);
  }
  console.error(`✗ ${auth.message}`);
  process.exit(1);
}
