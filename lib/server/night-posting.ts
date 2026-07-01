import { getConfigParamValue } from '@/lib/server/config-params';
import { appendAuditLog } from '@/lib/server/audit-log';
import { getExtraChargesServer } from '@/lib/server/extra-charges';
import { postFolioLinesServer } from '@/lib/server/folio-cash';
import { buildFolioChargeAmounts } from '@/lib/folio/charge-amounts';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { getAllReservationsServer, getBusinessDate, init } from '@/lib/server/pms-store';
import type { Reservation } from '@/lib/types/reservation';

export type NightPostingResult = {
  businessDate: string;
  enabled: boolean;
  roomCharges: number;
  extraCharges: number;
  reservations: number;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function parseExtraChargeCodes(r: Reservation): string[] {
  const raw = r.extraData?.extraChargeCodes;
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export async function runNightPostingServer(
  propertyId?: string,
  user = 'Gece Denetim',
): Promise<NightPostingResult> {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);
  const autoPost = await getConfigParamValue('AUTO_NIGHT_POST', prop, 'Evet');
  const enabled = autoPost.toLowerCase() === 'evet' || autoPost.toLowerCase() === 'yes';

  const empty: NightPostingResult = {
    businessDate,
    enabled,
    roomCharges: 0,
    extraCharges: 0,
    reservations: 0,
  };

  if (!enabled) return empty;

  const [reservations, allExtras] = await Promise.all([
    getAllReservationsServer(prop),
    getExtraChargesServer(prop),
  ]);

  const inHouse = reservations.filter((r) => r.status === 'CHECKED_IN' && r.roomNo);
  let roomCharges = 0;
  let extraCharges = 0;

  for (const r of inHouse) {
    if (r.checkOut <= businessDate) continue;

    const roomLineId = `fl-night-room-${r.id}-${businessDate}`;
    const roomExists = await prisma.folioLine.findUnique({ where: { id: roomLineId } });
    if (!roomExists) {
      const corpWindow = r.extraData?.payerType === 'Şirket' ? 'company' as const : 'guest' as const;
      const nightCharge = buildFolioChargeAmounts(r.rate, r);
      await postFolioLinesServer(r.id, [{
        id: roomLineId,
        date: businessDate,
        description: `Gece oda ücreti — ${r.roomType} (${businessDate})`,
        type: 'charge',
        window: corpWindow,
        ...nightCharge,
      }], prop);
      roomCharges += 1;
    }

    const codes = parseExtraChargeCodes(r);
    for (const code of codes) {
      const charge = allExtras.find((c) => c.code === code && c.active);
      if (!charge || charge.priceUnit !== 'gece') continue;

      const extraLineId = `fl-night-extra-${r.id}-${code}-${businessDate}`;
      const extraExists = await prisma.folioLine.findUnique({ where: { id: extraLineId } });
      if (extraExists) continue;

      await postFolioLinesServer(r.id, [{
        id: extraLineId,
        date: businessDate,
        description: `Gece ek ücret — ${charge.name} (${code})`,
        amount: charge.price,
        type: 'charge',
        window: 'guest',
      }], prop);
      extraCharges += 1;
    }
  }

  if (roomCharges > 0 || extraCharges > 0) {
    await appendAuditLog({
      module: 'eod',
      action: 'night_posting',
      entityType: 'BusinessDay',
      entityId: businessDate,
      user,
      detail: `${roomCharges} oda · ${extraCharges} ek ücret`,
      businessDate,
    }, prop);
    bustReadCaches(prop);
  }

  return {
    businessDate,
    enabled: true,
    roomCharges,
    extraCharges,
    reservations: inHouse.length,
  };
}
