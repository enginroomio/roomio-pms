import type { Reservation } from '@/lib/types/reservation';
import { appendAuditLog } from '@/lib/server/audit-log';
import { getExtraChargesServer, type ExtraChargeRow } from '@/lib/server/extra-charges';
import { postFolioLinesServer } from '@/lib/server/folio-cash';
import { getBusinessDate, init } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { bustReadCaches } from '@/lib/server/perf-cache';
import type { FolioLine } from '@/lib/data/reception-queries';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export function computeExtraChargeAmount(
  charge: Pick<ExtraChargeRow, 'price' | 'priceUnit'>,
  reservation: Pick<Reservation, 'checkIn' | 'checkOut'>,
): number {
  const nights = nightsBetween(reservation.checkIn, reservation.checkOut);
  if (charge.priceUnit === 'gece') return charge.price * nights;
  return charge.price;
}

export function buildExtraChargeFolioLines(
  charges: ExtraChargeRow[],
  reservation: Pick<Reservation, 'checkIn' | 'checkOut'>,
  businessDate: string,
): (Omit<FolioLine, 'id'> & { window?: FolioLine['window'] })[] {
  return charges
    .filter((c) => c.active)
    .map((charge) => {
      const amount = computeExtraChargeAmount(charge, reservation);
      const unitHint = charge.priceUnit === 'gece' ? '/gece' : charge.priceUnit === 'konaklama' ? '/konaklama' : '';
      return {
        date: businessDate,
        description: `Ek ücret — ${charge.name} (${charge.code})${unitHint}`,
        amount,
        type: 'charge' as const,
        window: 'guest' as const,
      };
    });
}

export async function postExtraChargesToFolioServer(
  reservationId: string,
  codes: string[],
  reservation: Pick<Reservation, 'checkIn' | 'checkOut'>,
  propertyId?: string,
  user = 'Resepsiyon',
): Promise<FolioLine[]> {
  await init();
  const prop = pid(propertyId);
  if (!codes.length) return [];

  const allCharges = await getExtraChargesServer(prop);
  const selected = allCharges.filter((c) => codes.includes(c.code) && c.active);
  if (!selected.length) return [];

  const businessDate = await getBusinessDate(prop);
  const lines = buildExtraChargeFolioLines(selected, reservation, businessDate);
  const posted = await postFolioLinesServer(reservationId, lines, prop);

  await appendAuditLog({
    module: 'folio',
    action: 'extra_charges',
    entityType: 'Reservation',
    entityId: reservationId,
    user,
    detail: selected.map((c) => c.code).join(', '),
  }, prop);

  bustReadCaches(prop);
  return posted;
}
