import type { VipGuest } from '@/lib/data/guest-relations';
import { DEMO_VIP_GUESTS } from '@/lib/data/guest-relations';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  level: string;
  guestName: string;
  country: string;
  arrival: string;
  departure: string;
  nights: number;
  room: string;
  status: string;
  reservationId: string | null;
}): VipGuest {
  return {
    id: r.id,
    level: r.level as VipGuest['level'],
    guestName: r.guestName,
    country: r.country,
    arrival: r.arrival,
    departure: r.departure,
    nights: r.nights,
    room: r.room,
    status: r.status as VipGuest['status'],
  };
}

export async function seedVipGuestsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.vipGuest.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.vipGuest.createMany({
    data: DEMO_VIP_GUESTS.map((v) => ({
      id: `vip-${v.id}`,
      propertyId: prop,
      level: v.level,
      guestName: v.guestName,
      country: v.country,
      arrival: v.arrival,
      departure: v.departure,
      nights: v.nights,
      room: v.room,
      status: v.status,
      reservationId: null,
    })),
  });
}

export async function getVipGuestsServer(
  propertyId?: string,
  level?: string,
): Promise<VipGuest[]> {
  await init();
  await seedVipGuestsIfEmpty(propertyId);
  const rows = await prisma.vipGuest.findMany({
    where: {
      propertyId: pid(propertyId),
      ...(level && level !== 'Tümü' ? { level } : {}),
    },
    orderBy: [{ level: 'asc' }, { arrival: 'asc' }],
  });
  return rows.map(mapRow);
}

export async function saveVipGuestServer(
  data: Omit<VipGuest, 'id'> & { id?: string; reservationId?: string },
  propertyId?: string,
): Promise<VipGuest> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `vip-${Date.now()}`;
  const row = await prisma.vipGuest.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      level: data.level,
      guestName: data.guestName,
      country: data.country,
      arrival: data.arrival,
      departure: data.departure,
      nights: data.nights,
      room: data.room,
      status: data.status,
      reservationId: data.reservationId ?? null,
    },
    update: {
      level: data.level,
      guestName: data.guestName,
      country: data.country,
      arrival: data.arrival,
      departure: data.departure,
      nights: data.nights,
      room: data.room,
      status: data.status,
      reservationId: data.reservationId ?? null,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}

export async function deleteVipGuestServer(id: string, propertyId?: string): Promise<boolean> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.vipGuest.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return false;
  await prisma.vipGuest.delete({ where: { id } });
  bustReadCaches(prop);
  return true;
}
