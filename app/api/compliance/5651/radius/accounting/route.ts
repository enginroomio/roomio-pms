import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { ingestBridgeEvent } from '@/lib/integrations/hotspot5651/bridge';
import { loadHotspot5651Config } from '@/lib/integrations/hotspot5651/server';
import {
  parseRadiusWebhook,
  parseRadiusWebhookBody,
  radiusEventSummary,
} from '@/lib/integrations/hotspot5651/radius-webhook';

function verifySecret(req: Request, secret: string): boolean {
  const header =
    req.headers.get('x-roomio-bridge-secret')
    ?? req.headers.get('x-roomio-radius-secret')
    ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return Boolean(secret && header === secret);
}

/** RADIUS Accounting-Start / Stop / Interim — FreeRADIUS rest, MikroTik */
export async function POST(req: Request) {
  const config = await loadHotspot5651Config();
  if (!config.radiusWebhookEnabled) {
    return NextResponse.json({ ok: false, message: 'RADIUS webhook kapalı' }, { status: 403 });
  }
  if (!verifySecret(req, config.bridgeSecret)) {
    return NextResponse.json({ ok: false, message: 'Geçersiz secret' }, { status: 401 });
  }

  const bodyText = await req.text();
  const raw = parseRadiusWebhookBody(req.headers.get('content-type'), bodyText);
  if (!raw) {
    return NextResponse.json({ ok: false, message: 'Geçersiz gövde' }, { status: 400 });
  }

  const event = parseRadiusWebhook(raw);
  const result = await ingestBridgeEvent('mikrotik', { radius: raw });

  return NextResponse.json({
    ok: result.ok,
    summary: radiusEventSummary(event),
    result,
  });
}

export async function GET(req: Request) {
    const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const config = await loadHotspot5651Config();
  return NextResponse.json({
    endpoint: '/api/compliance/5651/radius/accounting',
    method: 'POST',
    formats: ['application/json', 'application/x-www-form-urlencoded'],
    header: 'X-Roomio-Bridge-Secret',
    enabled: config.radiusWebhookEnabled,
  });
}
