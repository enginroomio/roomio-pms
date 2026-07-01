import { NextResponse } from 'next/server';
import { performAutomatedCheckOut } from '@/lib/integrations/hotspot5651/automation';
import { checkOutReservationServer } from '@/lib/server/folio-cash';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { logApiError } from '@/lib/server/api-error';
import { loadTihConfig } from '@/lib/integrations/tih/client';
import { getIdentityNotifications, sendEgmDeparture } from '@/lib/server/pms-store';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkout');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const propertyId = propertyIdFromRequest(req);

  const body = (await req.json()) as {
    roomNo: string;
    guestName: string;
    reservationId?: string;
    pbx?: boolean;
  };

  if (!body.roomNo || !body.guestName) {
    return NextResponse.json({ ok: false, message: 'roomNo ve guestName gerekli' }, { status: 400 });
  }

  const result = await performAutomatedCheckOut(body);

  if (body.reservationId && result.ok) {
    try {
      await checkOutReservationServer(body.reservationId, propertyId, user.name);
    } catch (err) {
      logApiError('POST /api/reception/checkout', err);
      return NextResponse.json({
        ...result,
        ok: false,
        messages: [...result.messages, 'DB: check-out kaydı başarısız'],
      });
    }
  }

  const egmMessages: string[] = [];
  if (body.reservationId && result.ok) {
    try {
      const tihConfig = await loadTihConfig();
      if (tihConfig.autoSubmitOnCheckOut) {
        const notifications = await getIdentityNotifications(propertyId);
        const record = notifications.find((n) => n.reservationId === body.reservationId);
        if (record?.idNo?.trim()) {
          const sent = await sendEgmDeparture(record.id);
          if (sent?.checkOutStatus === 'sent') {
            egmMessages.push(`EGM çıkış bildirimi otomatik gönderildi (${sent.checkOutEgmRef ?? 'ref yok'})`);
          } else if (sent?.checkOutStatus === 'error') {
            egmMessages.push(`EGM çıkış bildirimi hatası: ${sent.checkOutErrorMessage ?? 'bilinmiyor'}`);
          }
        }
      }
    } catch (err) {
      logApiError('POST /api/reception/checkout (egm)', err, { propertyId, reservationId: body.reservationId });
      egmMessages.push(`EGM çıkış: ${err instanceof Error ? err.message : 'kayıt hatası'}`);
    }
  }

  return NextResponse.json({
    ...result,
    messages: [...(result.messages ?? []), ...egmMessages],
  });
}
