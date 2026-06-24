import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isAuthRequired } from '@/lib/auth/config';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { cacheStats } from '@/lib/server/perf-cache';
import { pingRedis } from '@/lib/server/redis';
import { pushConfigured, countPushSubscriptions } from '@/lib/server/push-store';
import { prisma } from '@/lib/server/prisma';

type HealthChecks = Record<string, { ok: boolean; detail?: string }>;

type ReleaseManifest = {
  version?: string;
  builtAt?: string;
  gitSha?: string | null;
  label?: string;
};

async function readReleaseManifest(): Promise<ReleaseManifest | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), 'public/release-manifest.json'), 'utf8');
    return JSON.parse(raw) as ReleaseManifest;
  } catch {
    return null;
  }
}

export async function collectHealthStatus() {
  const checks: HealthChecks = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbUrl = process.env.DATABASE_URL ?? '';
    const provider = dbUrl.startsWith('postgres') ? 'postgresql' : 'sqlite';
    checks.database = { ok: true, detail: provider };
  } catch (e) {
    checks.database = { ok: false, detail: e instanceof Error ? e.message : 'database error' };
  }

  const redis = await pingRedis();
  checks.redis = { ok: redis.ok, detail: redis.detail };

  checks.integrations = {
    ok: true,
    detail: isIntegrationLiveMode() ? 'live' : 'simulated',
  };

  const pushCount = pushConfigured() ? await countPushSubscriptions().catch(() => -1) : 0;

  checks.monitoring = {
    ok: true,
    detail: [
      pushConfigured() ? 'push:ready' : 'push:disabled',
      pushConfigured() && pushCount >= 0 ? `push:subs:${pushCount}` : null,
      process.env.SENTRY_DSN ? 'sentry:configured' : 'sentry:disabled',
    ].filter(Boolean).join(', '),
  };

  const release = await readReleaseManifest();
  const perf = cacheStats();
  const jwtSecret = process.env.ROOMIO_JWT_SECRET ?? '';
  const authRequired = isAuthRequired();
  const authOk = !authRequired || (jwtSecret.length >= 32 && !jwtSecret.includes('replace-with'));

  checks.auth = {
    ok: authOk,
    detail: authRequired
      ? authOk ? 'jwt:configured' : 'jwt:missing-or-weak'
      : 'optional (dev)',
  };

  checks.performance = {
    ok: true,
    detail: `cache:${perf.size} keys, heap:${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  };

  const ok = checks.database.ok && checks.redis.ok && checks.auth.ok;

  return {
    ok,
    service: 'roomio-pms',
    time: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    version: release?.version ?? process.env.npm_package_version ?? '0.0.0',
    build: release?.builtAt ?? null,
    gitSha: release?.gitSha ?? null,
    label: release?.label ?? null,
    checks,
  };
}
