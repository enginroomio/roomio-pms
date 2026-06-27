import type { FacilityBooking } from '@/lib/data/guest-relations';
import { DEMO_RESTAURANT, DEMO_GYM, DEMO_SPA, DEMO_TENNIS } from '@/lib/data/guest-relations';
import { appendAuditLog } from '@/lib/server/audit-log';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { getBusinessDate, init } from '@/lib/server/pms-store';

export type FacilityKind = 'restaurant' | 'tennis' | 'spa' | 'gym';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  date: string;
  time: string;
  guest: string;
  roomNo: string;
  party: number;
  status: string;
  notes: string | null;
}): FacilityBooking {
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    guest: r.guest,
    roomNo: r.roomNo,
    party: r.party,
    status: r.status as FacilityBooking['status'],
    notes: r.notes ?? undefined,
  };
}

export async function seedFacilityBookingsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.facilityBooking.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const now = new Date().toISOString();
  const seeds: { kind: FacilityKind; rows: FacilityBooking[] }[] = [
    { kind: 'restaurant', rows: DEMO_RESTAURANT },
    { kind: 'tennis', rows: DEMO_TENNIS },
    { kind: 'spa', rows: DEMO_SPA },
    { kind: 'gym', rows: DEMO_GYM },
  ];

  await prisma.facilityBooking.createMany({
    data: seeds.flatMap(({ kind, rows }) =>
      rows.map((row) => ({
        id: `fb-${kind}-${row.id}`,
        propertyId: prop,
        kind,
        date: row.date,
        time: row.time,
        guest: row.guest,
        roomNo: row.roomNo,
        party: row.party,
        status: row.status,
        notes: row.notes ?? null,
        reservationId: null,
        createdAt: now,
      })),
    ),
  });
}

export async function getFacilityBookingsServer(
  kind: FacilityKind,
  propertyId?: string,
): Promise<FacilityBooking[]> {
  await init();
  await seedFacilityBookingsIfEmpty(propertyId);
  const rows = await prisma.facilityBooking.findMany({
    where: { propertyId: pid(propertyId), kind },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
  return rows.map(mapRow);
}

export async function saveFacilityBookingServer(
  kind: FacilityKind,
  data: Omit<FacilityBooking, 'id'> & { id?: string; reservationId?: string },
  propertyId?: string,
): Promise<FacilityBooking> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `fb-${kind}-${Date.now()}`;
  const businessDate = await getBusinessDate(prop);
  const row = await prisma.facilityBooking.create({
    data: {
      id,
      propertyId: prop,
      kind,
      date: data.date || businessDate,
      time: data.time,
      guest: data.guest,
      roomNo: data.roomNo,
      party: data.party,
      status: data.status,
      notes: data.notes ?? null,
      reservationId: data.reservationId ?? null,
      createdAt: new Date().toISOString(),
    },
  });

  await appendAuditLog({
    module: 'reception',
    action: 'facility_booking',
    entityType: 'FacilityBooking',
    entityId: id,
    user: 'Misafir İlişkileri',
    detail: `${kind} · ${data.guest} · ${data.date} ${data.time}`,
  }, prop);

  bustReadCaches(prop);
  return mapRow(row);
}
