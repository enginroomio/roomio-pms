import { NextResponse } from 'next/server';
import { ingestBridgeEvent } from '@/lib/integrations/hotspot5651/bridge';
import { loadHotspot5651Config } from '@/lib/integrations/hotspot5651/server';
import type { Hotspot5651Config } from '@/lib/integrations/hotspot5651/types';

function verifySecret(req: Request, secret: string): boolean {
  const header = req.headers.get('x-roomio-bridge-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return Boolean(secret && header === secret);
}

export async function POST(req: Request) {
  const config = await loadHotspot5651Config();
  if (!config.bridgeEnabled) {
    return NextResponse.json({ ok: false, message: 'Köprü kapalı' }, { status: 403 });
  }
  if (!verifySecret(req, config.bridgeSecret)) {
    return NextResponse.json({ ok: false, message: 'Geçersiz köprü anahtarı' }, { status: 401 });
  }

  const body = (await req.json()) as {
    provider?: Hotspot5651Config['provider'];
    line?: string;
    radius?: Record<string, unknown>;
    format?: string;
  };

  const provider = body.provider ?? config.provider;
  const result = await ingestBridgeEvent(provider, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
