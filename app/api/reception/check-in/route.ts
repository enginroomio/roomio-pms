import { NextResponse } from 'next/server';
import { performAutomatedCheckIn } from '@/lib/integrations/hotspot5651/automation';
import { loadIdReaderConfig } from '@/lib/integrations/id-reader/client';
import { validateEgmFormForCheckIn } from '@/lib/integrations/id-reader/validate';
import { computeEgmStatus, type EgmIdentityForm } from '@/lib/egm/types';
import { checkInReservationServer } from '@/lib/server/folio-cash';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { sendEgmIdentity, upsertEgmIdentity } from '@/lib/server/pms-store';
import { logApiError } from '@/lib/server/api-error';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const propertyId = propertyIdFromRequest(req);

  const body = (await req.json()) as {
    reservationId: string;
    roomNo: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    reservationRef: string;
    tesa?: boolean;
    hotspot?: boolean;
    pbx?: boolean;
    extraChargeCodes?: string[];
    egmForm?: EgmIdentityForm;
    identityApproved?: boolean;
  };

  if (!body.reservationId || !body.roomNo || !body.guestName) {
    return NextResponse.json({ ok: false, message: 'Eksik alan' }, { status: 400 });
  }

  const readerConfig = await loadIdReaderConfig();
  const egmMessages: string[] = [];

  if (readerConfig.enabled && body.egmForm) {
    if (readerConfig.requireManualApproval && !body.identityApproved) {
      return NextResponse.json(
        { ok: false, message: 'Kimlik bilgileri personel onayı olmadan check-in yapılamaz' },
        { status: 400 },
      );
    }

    const form: EgmIdentityForm = {
      ...body.egmForm,
      reservationId: body.reservationId,
      refNo: body.reservationRef,
      roomNo: body.roomNo,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
    };

    const validation = validateEgmFormForCheckIn(form);
    if (!validation.ok) {
      return NextResponse.json(
        { ok: false, message: validation.errors.join(' · ') },
        { status: 400 },
      );
    }

    const status = computeEgmStatus(form);
    if (readerConfig.blockCheckInUntilReady && status !== 'ready') {
      return NextResponse.json(
        { ok: false, message: 'EGM zorunlu alanları eksik — check-in engellendi' },
        { status: 400 },
      );
    }
  }

  const result = await performAutomatedCheckIn(body);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }

  try {
    await checkInReservationServer(
      body.reservationId,
      body.roomNo,
      propertyId,
      user.name,
      body.extraChargeCodes ?? [],
    );
  } catch (err) {
    logApiError('POST /api/reception/check-in (db)', err, { propertyId, reservationId: body.reservationId });
    return NextResponse.json({
      ok: false,
      messages: [...result.messages, `DB: ${err instanceof Error ? err.message : 'check-in kaydı başarısız'}`],
    }, { status: 500 });
  }

  if (readerConfig.enabled && body.egmForm) {
    try {
      const record = await upsertEgmIdentity(
        {
          ...body.egmForm,
          reservationId: body.reservationId,
          refNo: body.reservationRef,
          roomNo: body.roomNo,
          checkIn: body.checkIn,
          checkOut: body.checkOut,
        },
        propertyId,
      );
      egmMessages.push(`EGM kaydı: ${record.status}`);

      if (readerConfig.autoSendEgmAfterCheckIn && record.status === 'ready') {
        const sent = await sendEgmIdentity(record.id);
        if (sent?.status === 'sent') {
          egmMessages.push(`EGM otomatik gönderildi (${sent.egmRef ?? 'ref yok'})`);
        } else if (sent?.status === 'error') {
          egmMessages.push(`EGM gönderim hatası: ${sent.errorMessage ?? 'bilinmiyor'}`);
        }
      }
    } catch (err) {
      logApiError('POST /api/reception/check-in (egm)', err, { propertyId, reservationId: body.reservationId });
      egmMessages.push(`EGM: ${err instanceof Error ? err.message : 'kayıt hatası'}`);
    }
  }

  return NextResponse.json({
    ...result,
    messages: [...(result.messages ?? []), ...egmMessages],
  });
}
