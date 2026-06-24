import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';
import { getRatePlansServer } from '@/lib/server/rate-plans';

export type RateCalendarCell = {
  date: string;
  ratePlanCode: string;
  roomType?: string;
  rate: number;
  currency: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function seedRateCalendarIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.rateCalendarEntry.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const plans = await getRatePlansServer(prop);
  const start = '2026-06-01';
  const rows: RateCalendarCell[] = [];

  for (let i = 0; i < 45; i += 1) {
    const date = addDays(start, i);
    const weekend = [0, 6].includes(new Date(date).getDay());
    for (const plan of plans) {
      const bump = weekend ? 1.08 : 1;
      const roomTypes = plan.roomType ? [plan.roomType] : ['DBL', 'SUI', 'TRP'];
      for (const rt of roomTypes) {
        const typeFactor = rt === 'SUI' ? 1.85 : rt === 'TRP' ? 1.15 : 1;
        rows.push({
          date,
          ratePlanCode: plan.code,
          roomType: rt,
          rate: Math.round(plan.baseRate * typeFactor * bump),
          currency: plan.currency,
        });
      }
    }
  }

  await prisma.rateCalendarEntry.createMany({
    data: rows.map((r, i) => ({
      id: `rc-seed-${i}`,
      propertyId: prop,
      date: r.date,
      ratePlanCode: r.ratePlanCode,
      roomType: r.roomType ?? null,
      rate: r.rate,
      currency: r.currency,
    })),
  });
}

export async function getRateCalendarServer(
  from: string,
  to: string,
  opts: { code?: string; roomType?: string; propertyId?: string } = {},
): Promise<RateCalendarCell[]> {
  await init();
  await seedRateCalendarIfEmpty(opts.propertyId);
  const prop = pid(opts.propertyId);
  const rows = await prisma.rateCalendarEntry.findMany({
    where: {
      propertyId: prop,
      date: { gte: from, lte: to },
      ...(opts.code ? { ratePlanCode: opts.code } : {}),
      ...(opts.roomType ? { roomType: opts.roomType } : {}),
    },
    orderBy: [{ date: 'asc' }, { ratePlanCode: 'asc' }],
  });
  return rows.map((r) => ({
    date: r.date,
    ratePlanCode: r.ratePlanCode,
    roomType: r.roomType ?? undefined,
    rate: r.rate,
    currency: r.currency,
  }));
}

export async function lookupCalendarRate(
  code: string,
  roomType: string,
  checkIn: string,
  propertyId?: string,
): Promise<RateCalendarCell | null> {
  await seedRateCalendarIfEmpty(propertyId);
  const prop = pid(propertyId);
  const row = await prisma.rateCalendarEntry.findFirst({
    where: {
      propertyId: prop,
      date: checkIn,
      ratePlanCode: code,
      OR: [{ roomType }, { roomType: null }],
    },
    orderBy: { roomType: 'desc' },
  });
  if (!row) return null;
  return {
    date: row.date,
    ratePlanCode: row.ratePlanCode,
    roomType: row.roomType ?? undefined,
    rate: row.rate,
    currency: row.currency,
  };
}

export async function upsertCalendarRate(
  data: RateCalendarCell,
  propertyId?: string,
): Promise<RateCalendarCell> {
  await init();
  const prop = pid(propertyId);
  const id = `rc-${data.date}-${data.ratePlanCode}-${data.roomType ?? 'all'}`;
  const existing = await prisma.rateCalendarEntry.findFirst({
    where: {
      propertyId: prop,
      date: data.date,
      ratePlanCode: data.ratePlanCode,
      roomType: data.roomType ?? null,
    },
  });

  const row = existing
    ? await prisma.rateCalendarEntry.update({
        where: { id: existing.id },
        data: { rate: data.rate, currency: data.currency },
      })
    : await prisma.rateCalendarEntry.create({
        data: {
          id,
          propertyId: prop,
          date: data.date,
          ratePlanCode: data.ratePlanCode,
          roomType: data.roomType ?? null,
          rate: data.rate,
          currency: data.currency,
        },
      });
  return {
    date: row.date,
    ratePlanCode: row.ratePlanCode,
    roomType: row.roomType ?? undefined,
    rate: row.rate,
    currency: row.currency,
  };
}
