import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/require-permission';
import { testEgmConnection } from '@/lib/integrations/egm/client';
import { collectHealthStatus } from '@/lib/server/health';
import { getProperties } from '@/lib/server/pms-store';
import { sentryConfigured, initSentry } from '@/lib/monitoring/sentry';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const [health, properties, egmTest] = await Promise.all([
    collectHealthStatus(),
    getProperties(),
    testEgmConnection(),
  ]);

  const uptimeSec = health.uptimeSec ?? 0;
  const uptimePct = Math.min(100, Math.round((uptimeSec / (uptimeSec + 1)) * 10000) / 100);

  return NextResponse.json({
    ok: health.ok,
    time: health.time,
    mode: isIntegrationLiveMode() ? 'live' : 'simulated',
    sla: {
      uptimeSec,
      uptimeLabel: formatUptime(uptimeSec),
      healthOk: health.ok,
      databaseOk: health.checks.database?.ok === true,
      redisOk: health.checks.redis?.ok === true,
      pushReady: health.checks.monitoring?.detail?.includes('push:ready') ?? false,
      sentryConfigured: sentryConfigured(),
      sentryActive: initSentry(),
      targetUptimePct: 99.5,
      currentUptimePct: uptimePct,
    },
    properties: {
      count: properties.length,
      cities: [...new Set(properties.map((p) => p.city).filter(Boolean))],
    },
    egm: {
      ok: egmTest.ok,
      simulated: egmTest.simulated ?? false,
      message: egmTest.message,
    },
    release: {
      version: health.version,
      build: health.build,
      gitSha: health.gitSha,
    },
  });
}

function formatUptime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}s ${m}dk`;
  if (m > 0) return `${m}dk ${s}sn`;
  return `${s}sn`;
}
