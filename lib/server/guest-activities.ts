import type { GuestActivity, DailyActivity } from '@/lib/data/guest-relations';
import { DEMO_DAILY_ACTIVITIES, DEMO_GUEST_ACTIVITIES } from '@/lib/data/guest-relations';
import { appendAuditLog } from '@/lib/server/audit-log';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { getBusinessDate, init } from '@/lib/server/pms-store';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapGuest(r: {
  id: string;
  datetime: string;
  guestName: string;
  roomNo: string;
  nationality: string;
  activity: string;
  description: string;
  staff: string;
}): GuestActivity {
  return {
    id: r.id,
    datetime: r.datetime,
    guestName: r.guestName,
    roomNo: r.roomNo,
    nationality: r.nationality,
    activity: r.activity,
    description: r.description,
    staff: r.staff,
  };
}

function mapDaily(r: {
  id: string;
  date: string;
  time: string;
  type: string;
  description: string;
  guest: string;
  roomNo: string;
  staff: string;
  department: string;
}): DailyActivity {
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    type: r.type,
    description: r.description,
    guest: r.guest,
    roomNo: r.roomNo,
    staff: r.staff,
    department: r.department,
  };
}

export async function seedGuestActivitiesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.guestActivity.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const now = new Date().toISOString();
  await prisma.guestActivity.createMany({
    data: DEMO_GUEST_ACTIVITIES.map((a) => ({
      id: `ga-${a.id}`,
      propertyId: prop,
      datetime: a.datetime,
      guestName: a.guestName,
      roomNo: a.roomNo,
      nationality: a.nationality,
      activity: a.activity,
      description: a.description,
      staff: a.staff,
      reservationId: null,
      createdAt: now,
    })),
  });
}

export async function seedDailyActivitiesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.dailyActivity.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const now = new Date().toISOString();
  await prisma.dailyActivity.createMany({
    data: DEMO_DAILY_ACTIVITIES.map((a) => ({
      id: `da-${a.id}`,
      propertyId: prop,
      date: a.date,
      time: a.time,
      type: a.type,
      description: a.description,
      guest: a.guest,
      roomNo: a.roomNo,
      staff: a.staff,
      department: a.department,
      createdAt: now,
    })),
  });
}

export async function getGuestActivitiesServer(propertyId?: string): Promise<GuestActivity[]> {
  await init();
  await seedGuestActivitiesIfEmpty(propertyId);
  const rows = await prisma.guestActivity.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { datetime: 'desc' },
    take: 200,
  });
  return rows.map(mapGuest);
}

export async function getDailyActivitiesServer(
  propertyId?: string,
  opts?: { date?: string; type?: string },
): Promise<DailyActivity[]> {
  await init();
  await seedDailyActivitiesIfEmpty(propertyId);
  const rows = await prisma.dailyActivity.findMany({
    where: {
      propertyId: pid(propertyId),
      ...(opts?.date ? { date: opts.date } : {}),
      ...(opts?.type && opts.type !== 'Tümü' ? { type: opts.type } : {}),
    },
    orderBy: [{ date: 'desc' }, { time: 'desc' }],
    take: 200,
  });
  return rows.map(mapDaily);
}

export async function saveGuestActivityServer(
  data: Omit<GuestActivity, 'id'> & { reservationId?: string },
  propertyId?: string,
): Promise<GuestActivity> {
  await init();
  const prop = pid(propertyId);
  const id = `ga-${Date.now()}`;
  const row = await prisma.guestActivity.create({
    data: {
      id,
      propertyId: prop,
      datetime: data.datetime,
      guestName: data.guestName,
      roomNo: data.roomNo,
      nationality: data.nationality,
      activity: data.activity,
      description: data.description,
      staff: data.staff,
      reservationId: data.reservationId ?? null,
      createdAt: new Date().toISOString(),
    },
  });

  await appendAuditLog({
    module: 'reception',
    action: 'guest_activity',
    entityType: 'GuestActivity',
    entityId: id,
    user: data.staff,
    detail: `${data.guestName} · ${data.activity}`,
  }, prop);

  bustReadCaches(prop);
  return mapGuest(row);
}

export async function saveDailyActivityServer(
  data: Omit<DailyActivity, 'id'>,
  propertyId?: string,
): Promise<DailyActivity> {
  await init();
  const prop = pid(propertyId);
  const id = `da-${Date.now()}`;
  const row = await prisma.dailyActivity.create({
    data: {
      id,
      propertyId: prop,
      date: data.date,
      time: data.time,
      type: data.type,
      description: data.description,
      guest: data.guest,
      roomNo: data.roomNo,
      staff: data.staff,
      department: data.department,
      createdAt: new Date().toISOString(),
    },
  });

  await appendAuditLog({
    module: 'reception',
    action: 'daily_activity',
    entityType: 'DailyActivity',
    entityId: id,
    user: data.staff,
    detail: `${data.type} · ${data.guest}`,
  }, prop);

  bustReadCaches(prop);
  return mapDaily(row);
}

export async function getGuestRelationsStatsServer(propertyId?: string) {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);

  const [
    inHouse,
    openTraces,
    openComplaints,
    pendingReviews,
    openLostFound,
    openReclamations,
  ] = await Promise.all([
    prisma.reservation.count({ where: { propertyId: prop, status: 'CHECKED_IN' } }),
    prisma.guestTrace.count({ where: { propertyId: prop, status: 'Açık' } }),
    prisma.guestComplaint.count({ where: { propertyId: prop, status: 'Açık' } }),
    prisma.guestReview.count({ where: { propertyId: prop, status: 'pending' } }),
    prisma.lostFoundItem.count({ where: { propertyId: prop, status: 'Açık' } }),
    prisma.reclamationCase.count({ where: { propertyId: prop, status: 'İncelemede' } }),
  ]);

  return {
    businessDate,
    inHouse,
    openTraces,
    openComplaints,
    pendingReviews,
    openLostFound,
    openReclamations,
  };
}
