import { MEAL_PRICES } from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type MealPriceRow = {
  id: string;
  mealPlan: string;
  roomType: string;
  adultPrice: number;
  childPrice: number;
  seasonName: string;
  currency: string;
  adultLabel: string;
  childLabel: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function parseMoney(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

function moneyLabel(amount: number, currency = 'TRY'): string {
  const sym = currency === 'TRY' ? '₺' : currency;
  return `${sym}${amount.toLocaleString('tr-TR')}`;
}

function mapRow(r: {
  id: string;
  mealPlan: string;
  roomType: string;
  adultPrice: number;
  childPrice: number;
  seasonName: string;
  currency: string;
}): MealPriceRow {
  return {
    id: r.id,
    mealPlan: r.mealPlan,
    roomType: r.roomType,
    adultPrice: r.adultPrice,
    childPrice: r.childPrice,
    seasonName: r.seasonName,
    currency: r.currency,
    adultLabel: moneyLabel(r.adultPrice, r.currency),
    childLabel: moneyLabel(r.childPrice, r.currency),
  };
}

export async function seedMealPricesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.mealPrice.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.mealPrice.createMany({
    data: MEAL_PRICES.map((row) => ({
      id: `mp-${row.mealPlan}-${row.roomType}-${row.season.replace(/\s+/g, '-')}`,
      propertyId: prop,
      mealPlan: row.mealPlan,
      roomType: row.roomType,
      adultPrice: parseMoney(row.adult),
      childPrice: parseMoney(row.child),
      seasonName: row.season,
      currency: 'TRY',
    })),
  });
}

export async function getMealPricesServer(propertyId?: string): Promise<MealPriceRow[]> {
  await init();
  await seedMealPricesIfEmpty(propertyId);
  const rows = await prisma.mealPrice.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: [{ seasonName: 'asc' }, { mealPlan: 'asc' }],
  });
  return rows.map(mapRow);
}

export async function saveMealPriceServer(
  data: {
    mealPlan: string;
    roomType: string;
    adultPrice: number;
    childPrice: number;
    seasonName: string;
    currency?: string;
  },
  propertyId?: string,
): Promise<MealPriceRow> {
  await init();
  const prop = pid(propertyId);
  const id = `mp-${data.mealPlan}-${data.roomType}-${data.seasonName.replace(/\s+/g, '-')}`;
  const row = await prisma.mealPrice.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      mealPlan: data.mealPlan,
      roomType: data.roomType,
      adultPrice: data.adultPrice,
      childPrice: data.childPrice,
      seasonName: data.seasonName,
      currency: data.currency ?? 'TRY',
    },
    update: {
      adultPrice: data.adultPrice,
      childPrice: data.childPrice,
      currency: data.currency ?? 'TRY',
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}
