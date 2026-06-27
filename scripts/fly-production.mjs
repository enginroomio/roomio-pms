#!/usr/bin/env node
/**
 * Fly.io production yardımcıları — URL, CLI, health.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { localFlyBin } from './fly-install.mjs';
import { flyProcessEnv } from './fly-auth.mjs';

const ROOT = process.cwd();
const URL_FILE = join(ROOT, '.roomio', 'production-url.txt');

export function hasFlyCli() {
  if (localFlyBin()) return true;
  if (spawnSync('fly', ['version'], { stdio: 'ignore' }).status === 0) return true;
  const homeFly = join(process.env.HOME ?? '', '.fly', 'bin', 'fly');
  return existsSync(homeFly) && spawnSync(homeFly, ['version'], { stdio: 'ignore' }).status === 0;
}

export function flyBin() {
  const local = localFlyBin();
  if (local) return local;
  if (spawnSync('fly', ['version'], { stdio: 'ignore' }).status === 0) return 'fly';
  const homeFly = join(process.env.HOME ?? '', '.fly', 'bin', 'fly');
  if (existsSync(homeFly)) return homeFly;
  return 'fly';
}

export function flyAppName() {
  const flyToml = join(ROOT, 'fly.toml');
  if (!existsSync(flyToml)) return 'roomio-pms';
  const match = readFileSync(flyToml, 'utf8').match(/^app\s*=\s*"([^"]+)"/m);
  return match?.[1] ?? 'roomio-pms';
}

export function productionUrl() {
  const fromEnv = process.env.ROOMIO_PRODUCTION_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  try {
    const fromFile = readFileSync(URL_FILE, 'utf8').trim();
    if (fromFile) return fromFile.replace(/\/$/, '');
  } catch {
    /* ignore */
  }
  return null;
}

export function defaultFlyUrl(app = flyAppName()) {
  return `https://${app}.fly.dev`;
}

export function saveProductionUrl(url) {
  mkdirSync(join(ROOT, '.roomio'), { recursive: true });
  writeFileSync(URL_FILE, `${url.replace(/\/$/, '')}\n`, 'utf8');
}

export async function waitForHealth(base, attempts = 30, intervalMs = 2000) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/api/health`);
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.ok === true) return { ok: true, body };
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { ok: false, body: null };
}

export function runFly(args, { inherit = false } = {}) {
  return spawnSync(flyBin(), args, {
    cwd: ROOT,
    stdio: inherit ? 'inherit' : 'pipe',
    encoding: 'utf8',
    env: flyProcessEnv(),
  });
}

export const FLY_REQUIRED_SECRETS = [
  'ROOMIO_JWT_SECRET',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
];

export const FLY_OPTIONAL_SECRETS = [
  'SENTRY_DSN',
  'REDIS_URL',
  'ROOMIO_INTEGRATION_LIVE',
  'ROOMIO_SERVER_KEY',
];
