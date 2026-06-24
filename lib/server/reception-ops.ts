import type { CashEntry } from '@/lib/data/cash';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { appendAuditLog } from '@/lib/server/audit-log';
import { getAllRoomsServer } from '@/lib/server/room-inventory-bridge';
import { getAllReservationsServer, getBusinessDate, init } from '@/lib/server/pms-store';
import { getCashEntriesServer } from '@/lib/server/folio-cash';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export type RoomSuggestion = {
  roomNo: string;
  floor: number;
  type: string;
  hkStatus: string;
  routeCode?: string;
  score: number;
  reason: string;
};

export async function suggestRoomsForCheckIn(
  reservationId: string,
  propertyId?: string,
): Promise<RoomSuggestion[]> {
  await init();
  const prop = pid(propertyId);
  const reservations = await getAllReservationsServer(prop);
  const reservation = reservations.find((r) => r.id === reservationId);
  if (!reservation) return [];

  const occupied = new Set(
    reservations
      .filter((r) => r.status === 'CHECKED_IN' && r.roomNo)
      .map((r) => r.roomNo!),
  );

  const hkRows = await prisma.roomHousekeeping.findMany({ where: { propertyId: prop } });
  const hkMap = new Map(hkRows.map((h) => [h.roomNo, h]));

  const routeLoad = new Map<string, number>();
  for (const h of hkRows) {
    if (h.routeCode && occupied.has(h.roomNo)) {
      routeLoad.set(h.routeCode, (routeLoad.get(h.routeCode) ?? 0) + 1);
    }
  }

  const suggestions: RoomSuggestion[] = [];
  const allRooms = await getAllRoomsServer(prop);
  for (const room of allRooms) {
    if (room.typeCode !== reservation.roomType) continue;
    if (occupied.has(room.roomNo)) continue;

    const hk = hkMap.get(room.roomNo);
    const hkStatus = hk?.hkStatus ?? 'CLEAN';
    if (hkStatus === 'OOO') continue;

    let score = 50;
    const reasons: string[] = [];

    if (hkStatus === 'CLEAN') {
      score += 30;
      reasons.push('temiz');
    } else {
      score -= 20;
      reasons.push('kirli');
    }

    if (hk?.routeCode) {
      const load = routeLoad.get(hk.routeCode) ?? 0;
      score += Math.max(0, 15 - load * 3);
      reasons.push(`route ${hk.routeCode}`);
    }

    const sameFloorGuest = reservations.some(
      (r) => r.status === 'CHECKED_IN' && r.roomNo && allRooms.find((x) => x.roomNo === r.roomNo)?.floor === room.floor,
    );
    if (sameFloorGuest) {
      score += 5;
      reasons.push('aynı kat doluluk');
    }

    suggestions.push({
      roomNo: room.roomNo,
      floor: room.floor,
      type: room.typeCode,
      hkStatus,
      routeCode: hk?.routeCode ?? undefined,
      score,
      reason: reasons.join(' · '),
    });
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 12);
}

export async function postManualCashEntryServer(
  data: {
    register?: string;
    type: 'odeme' | 'avans' | 'doviz' | 'tahsilat';
    amount: number;
    description: string;
    user?: string;
    currency?: string;
  },
  propertyId?: string,
): Promise<CashEntry> {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);
  const time = nowTime();
  const user = data.user ?? 'Resepsiyon';
  const register = data.register ?? 'Ana Kasa';
  const id = `ce-man-${Date.now()}`;

  const currency: CashEntry['currency'] =
    data.currency === 'USD' || data.currency === 'EUR' ? data.currency : 'TRY';

  await prisma.cashEntry.create({
    data: {
      id,
      propertyId: prop,
      businessDate,
      time,
      register,
      type: data.type,
      description: data.description,
      amount: data.amount,
      currency,
      user,
      reservationId: null,
    },
  });

  await appendAuditLog({
    module: 'cash',
    action: 'manual_entry',
    entityType: 'CashEntry',
    entityId: id,
    user,
    detail: `${data.type} · ${data.description} · ${data.amount}`,
  }, prop);

  bustReadCaches(prop);
  return {
    id,
    time,
    register,
    type: data.type,
    description: data.description,
    amount: data.amount,
    currency,
    user,
  };
}

export async function getCashLedgerReportServer(propertyId?: string) {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);
  const entries = await getCashEntriesServer(prop, businessDate);
  const tahsilat = entries.filter((e) => e.type === 'tahsilat').reduce((s, e) => s + e.amount, 0);
  const odeme = entries.filter((e) => e.type === 'odeme').reduce((s, e) => s + e.amount, 0);
  const depozit = entries.filter((e) => e.type === 'depozit').reduce((s, e) => s + e.amount, 0);
  const avans = entries.filter((e) => e.type === 'avans').reduce((s, e) => s + e.amount, 0);
  return {
    businessDate,
    entries,
    summary: { tahsilat, odeme, depozit, avans, net: tahsilat + depozit + avans - odeme },
  };
}
