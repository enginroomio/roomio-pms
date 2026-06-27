import { RATE_PLANS } from '@/lib/data/kurulus';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';
import { lookupCalendarRate } from '@/lib/server/rate-calendar';

export type RatePlan = {
  id: string;
  code: string;
  name: string;
  market: string;
  roomType?: string;
  baseRate: number;
  currency: string;
  mealPlan?: string;
  active: boolean;
  validFrom?: string;
  validTo?: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  code: string;
  name: string;
  market: string;
  roomType: string | null;
  baseRate: number;
  currency: string;
  mealPlan: string | null;
  active: boolean;
  validFrom: string | null;
  validTo: string | null;
}): RatePlan {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    market: r.market,
    roomType: r.roomType ?? undefined,
    baseRate: r.baseRate,
    currency: r.currency,
    mealPlan: r.mealPlan ?? undefined,
    active: r.active,
    validFrom: r.validFrom ?? undefined,
    validTo: r.validTo ?? undefined,
  };
}

export async function seedRatePlansIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.ratePlan.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const parseRate = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0;
  await prisma.ratePlan.createMany({
    data: RATE_PLANS.map((p, i) => ({
      id: `rp-seed-${i}`,
      propertyId: prop,
      code: p.code,
      name: p.name,
      market: p.market,
      roomType: null,
      baseRate: parseRate(p.baseRate),
      currency: p.currency,
      mealPlan: 'BB',
      active: p.active,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
    })),
  });
}

export async function getRatePlansServer(propertyId?: string, activeOnly = true): Promise<RatePlan[]> {
  await init();
  await seedRatePlansIfEmpty(propertyId);
  const rows = await prisma.ratePlan.findMany({
    where: { propertyId: pid(propertyId), ...(activeOnly ? { active: true } : {}) },
    orderBy: { code: 'asc' },
  });
  return rows.map(mapRow);
}

export async function resolveRatePlanQuote(
  code: string,
  roomType: string,
  checkIn: string,
  propertyId?: string,
): Promise<RatePlan | null> {
  const plans = await getRatePlansServer(propertyId);
  const plan = plans.find((p) => p.code === code);
  if (!plan) return null;
  if (plan.roomType && plan.roomType !== roomType) return null;
  if (plan.validFrom && checkIn < plan.validFrom) return null;
  if (plan.validTo && checkIn > plan.validTo) return null;

  const calendar = await lookupCalendarRate(code, roomType, checkIn, propertyId);
  if (calendar) {
    return { ...plan, baseRate: calendar.rate, currency: calendar.currency };
  }
  return plan;
}

export async function saveRatePlanServer(
  data: Omit<RatePlan, 'id'> & { id?: string },
  propertyId?: string,
): Promise<RatePlan> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `rp-${Date.now()}`;
  const row = await prisma.ratePlan.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      market: data.market,
      roomType: data.roomType ?? null,
      baseRate: data.baseRate,
      currency: data.currency,
      mealPlan: data.mealPlan ?? null,
      active: data.active,
      validFrom: data.validFrom ?? null,
      validTo: data.validTo ?? null,
    },
    update: {
      code: data.code,
      name: data.name,
      market: data.market,
      roomType: data.roomType ?? null,
      baseRate: data.baseRate,
      currency: data.currency,
      mealPlan: data.mealPlan ?? null,
      active: data.active,
      validFrom: data.validFrom ?? null,
      validTo: data.validTo ?? null,
    },
  });
  return mapRow(row);
}
