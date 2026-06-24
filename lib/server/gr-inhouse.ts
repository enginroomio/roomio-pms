import type { InHouseGuestRow } from '@/lib/data/guest-relations';
import { NATIONALITIES } from '@/lib/data/kurulus';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { getAllReservationsServer, init } from '@/lib/server/pms-store';
import { getVipGuestsServer } from '@/lib/server/vip-guests';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function fmtShort(date: string): string {
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  return `${parts[2]}.${parts[1]}`;
}

const natMap = new Map(NATIONALITIES.map((n) => [n.code, n.name]));

function resolveNationality(extra?: Record<string, string>): string {
  const code = extra?.nationality ?? extra?.nationalityCode ?? 'TR';
  return natMap.get(code) ?? code;
}

export type GrInHouseSummary = {
  total: number;
  vip: number;
  international: number;
  rows: InHouseGuestRow[];
};

export async function getGrInHouseServer(propertyId?: string): Promise<GrInHouseSummary> {
  await init();
  const prop = pid(propertyId);
  const [reservations, vips] = await Promise.all([
    getAllReservationsServer(prop),
    getVipGuestsServer(prop),
  ]);

  const vipRooms = new Set(
    vips
      .filter((v) => v.status === 'Konaklıyor')
      .map((v) => v.room.replace(/\s*\([^)]*\)/, '').trim()),
  );

  const rows: InHouseGuestRow[] = reservations
    .filter((r) => r.status === 'CHECKED_IN' && r.roomNo)
    .sort((a, b) => (a.roomNo ?? '').localeCompare(b.roomNo ?? '', 'tr'))
    .map((r) => {
      const extra = (r as { extraData?: Record<string, string> }).extraData ?? {};
      const nationality = resolveNationality(extra);
      const isVip = vipRooms.has(r.roomNo!) || extra.vip === '1';
      return {
        id: r.id,
        roomNo: r.roomNo!,
        guestName: r.guestName,
        nationality,
        arrival: fmtShort(r.checkIn),
        departure: fmtShort(r.checkOut),
        vip: isVip,
      };
    });

  return {
    total: rows.length,
    vip: rows.filter((r) => r.vip).length,
    international: rows.filter((r) => r.nationality !== 'Türkiye' && r.nationality !== 'TR').length,
    rows,
  };
}
