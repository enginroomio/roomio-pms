import { NextResponse } from 'next/server';
import { requireApiPermission, requireIntegrationAdminRead } from '@/lib/auth/require-permission';
import { encodeGuestKey, loadTesaConfig, testTesaConnection } from '@/lib/integrations/tesa/client';
import type { TesaEncodeRequest } from '@/lib/integrations/tesa/types';
import { appendAuditLog } from '@/lib/server/audit-log';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { maskGuestName } from '@/lib/kvkk/mask';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as TesaEncodeRequest;
  if (!body.roomNo || !body.guestName || !body.checkIn || !body.checkOut) {
    return NextResponse.json({ ok: false, message: 'Eksik alan' }, { status: 400 });
  }
  const result = await encodeGuestKey(body);
  await appendAuditLog(
    {
      module: 'reception',
      action: result.ok ? 'tesa_key_encode' : 'tesa_key_encode_failed',
      entityType: 'tesa_key',
      entityId: body.roomNo,
      user: auth.user.name,
      detail: `Oda ${body.roomNo} — ${maskGuestName(body.guestName)} için kart kodlandı (${result.simulated ? 'simülasyon' : 'canlı'})`,
    },
    propertyIdFromRequest(req),
  ).catch(() => undefined);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function GET(req: Request) {
    const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const config = await loadTesaConfig();
  const result = await testTesaConnection(config);
  return NextResponse.json({ config, connection: result });
}
