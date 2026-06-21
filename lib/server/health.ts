import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { pingRedis } from '@/lib/server/redis';
import { pushConfigured } from '@/lib/server/push-store';
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
    checks.database = { ok: true };
  } catch (e) {
    checks.database = { ok: false, detail: e instanceof Error ? e.message : 'database error' };
  }

  const redis = await pingRedis();
  checks.redis = { ok: redis.ok, detail: redis.detail };

  checks.integrations = {
    ok: true,
    detail: isIntegrationLiveMode() ? 'live' : 'simulated',
  };

  checks.monitoring = {
    ok: true,
    detail: [
      pushConfigured() ? 'push:ready' : 'push:disabled',
      process.env.SENTRY_DSN ? 'sentry:configured' : 'sentry:disabled',
    ].join(', '),
  };

  const release = await readReleaseManifest();
  const ok = checks.database.ok && checks.redis.ok;

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
