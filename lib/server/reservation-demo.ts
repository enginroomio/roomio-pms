import { DEMO_RESERVATIONS } from '@/lib/data/reservations';
import { DEMO_ROOM_BLOCKS } from '@/lib/data/room-blocks';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { prisma } from '@/lib/server/prisma';
import type { Reservation } from '@/lib/types/reservation';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function toDbRow(propertyId: string, r: Reservation) {
  return {
    propertyId,
    id: r.id,
    refNo: r.refNo,
    guestName: r.guestName,
    email: r.email ?? null,
    phone: r.phone ?? null,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    roomType: r.roomType,
    roomNo: r.roomNo ?? null,
    adults: r.adults,
    children: r.children,
    mealPlan: r.mealPlan,
    rate: r.rate,
    currency: r.currency,
    agency: r.agency,
    market: r.market,
    status: r.status,
    createdAt: r.createdAt,
    notes: r.notes ?? null,
    groupId: r.groupId ?? null,
    extraData: r.extraData ? JSON.stringify(r.extraData) : null,
  };
}

async function purgeTestReservations(propertyId: string): Promise<number> {
  const legacyIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];
  const result = await prisma.reservation.deleteMany({
    where: {
      propertyId,
      OR: [
        { refNo: { startsWith: 'E2E-' } },
        { id: { startsWith: 'e2e-' } },
        { refNo: { startsWith: 'RSV-2026-' } },
        { id: { in: legacyIds } },
        { guestName: { contains: 'Deny' } },
        { guestName: 'Reception Guest' },
        { guestName: { contains: 'RECEPTION GUEST' } },
      ],
    },
  });
  return result.count;
}

async function purgeTestRoomBlocks(propertyId: string): Promise<void> {
  const blocks = await prisma.roomBlock.findMany({ where: { propertyId } });
  const keep = new Set(DEMO_ROOM_BLOCKS.map((b) => b.id));
  for (const block of blocks) {
    if (keep.has(block.id)) continue;
    if (/^blk-\d{10,}$/.test(block.id)) {
      await prisma.roomBlock.delete({ where: { id: block.id } });
    }
  }
}

async function upsertDemoReservations(propertyId: string): Promise<void> {
  for (const r of DEMO_RESERVATIONS) {
    const data = toDbRow(propertyId, r);
    await prisma.reservation.upsert({
      where: { id: r.id },
      create: data,
      update: data,
    });
  }
}

async function upsertDemoRoomBlocks(propertyId: string): Promise<void> {
  for (const b of DEMO_ROOM_BLOCKS) {
    await prisma.roomBlock.upsert({
      where: { id: b.id },
      create: {
        propertyId,
        id: b.id,
        roomNo: b.roomNo,
        fromDate: b.from,
        toDate: b.to,
        reason: b.reason,
        blockedBy: b.blockedBy,
        status: b.status,
      },
      update: {
        roomNo: b.roomNo,
        fromDate: b.from,
        toDate: b.to,
        reason: b.reason,
        blockedBy: b.blockedBy,
        status: b.status,
      },
    });
  }
}

/**
 * Demo rezervasyon listesini Konaklama PMS verisiyle senkronlar.
 * E2E test kalıntılarını temizler, kanonik demo kayıtlarını upsert eder.
 */
export async function ensureReservationListDemo(propertyId?: string): Promise<void> {
  const prop = pid(propertyId);
  const purged = await purgeTestReservations(prop);
  await purgeTestRoomBlocks(prop);
  await upsertDemoReservations(prop);
  await upsertDemoRoomBlocks(prop);
  if (purged > 0) bustReadCaches(prop);
}
