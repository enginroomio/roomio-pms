import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { checkoutGuest, copyGuestKey } from '@/lib/integrations/tesa/client';
import { appendAuditLog } from '@/lib/server/audit-log';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkout');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { action: 'checkout' | 'copy'; roomNo: string; keyCount?: number };
  if (!body.roomNo) return NextResponse.json({ ok: false, message: 'roomNo gerekli' }, { status: 400 });

  const result =
    body.action === 'copy'
      ? await copyGuestKey(body.roomNo, body.keyCount ?? 1)
      : await checkoutGuest(body.roomNo);

  await appendAuditLog(
    {
      module: 'reception',
      action: body.action === 'copy' ? 'tesa_key_copy' : 'tesa_key_checkout',
      entityType: 'tesa_key',
      entityId: body.roomNo,
      user: auth.user.name,
      detail: `Oda ${body.roomNo} — kart ${body.action === 'copy' ? `kopyalandı (${body.keyCount ?? 1} adet)` : 'iptal edildi'} (${result.simulated ? 'simülasyon' : 'canlı'})`,
    },
    propertyIdFromRequest(req),
  ).catch(() => undefined);

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
