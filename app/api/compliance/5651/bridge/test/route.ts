import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { parseBridgePayload, SAMPLE_SYSLOG_LINES } from '@/lib/integrations/hotspot5651/parsers';
import { ingestBridgeEvent } from '@/lib/integrations/hotspot5651/bridge';
import type { Hotspot5651Config } from '@/lib/integrations/hotspot5651/types';

export async function POST(req: Request) {
    const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    provider?: Hotspot5651Config['provider'];
    sample?: keyof typeof SAMPLE_SYSLOG_LINES;
    line?: string;
    radius?: Record<string, unknown>;
    dryRun?: boolean;
  };

  if (body.radius) {
    const parsed = parseBridgePayload(body.provider ?? 'mikrotik', { radius: body.radius });
    if (body.dryRun) return NextResponse.json({ ok: true, parsed });
    const result = await ingestBridgeEvent(body.provider ?? 'mikrotik', { radius: body.radius });
    return NextResponse.json({ ok: result.ok, parsed, result });
  }

  const provider = body.provider ?? 'mikrotik';
  const line = body.sample ? SAMPLE_SYSLOG_LINES[body.sample] : body.line;
  if (!line) {
    return NextResponse.json({ ok: false, message: 'line veya sample gerekli' }, { status: 400 });
  }

  const parsed = parseBridgePayload(provider, { line });
  if (body.dryRun) {
    return NextResponse.json({ ok: true, parsed, line });
  }

  const result = await ingestBridgeEvent(provider, { line });
  return NextResponse.json({ ok: result.ok, parsed, result });
}
