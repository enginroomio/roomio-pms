import { EXTRA_CHARGES } from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type ExtraChargeRow = {
  id: string;
  code: string;
  name: string;
  price: number;
  priceUnit: string;
  currency: string;
  active: boolean;
  priceLabel: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function parsePriceLabel(price: number, unit: string, currency: string): string {
  const sym = currency === 'TRY' ? '₺' : currency;
  const unitLabel = unit === 'gece' ? '/gece' : unit === 'konaklama' ? '/konaklama' : '';
  return `${sym}${price}${unitLabel}`;
}

function parseSeedPrice(raw: string): { price: number; unit: string } {
  const m = raw.match(/(\d+)/);
  const price = m ? Number(m[1]) : 0;
  if (raw.includes('konaklama')) return { price, unit: 'konaklama' };
  if (raw.includes('gece')) return { price, unit: 'gece' };
  return { price, unit: 'adet' };
}

function mapRow(r: {
  id: string;
  code: string;
  name: string;
  price: number;
  priceUnit: string;
  currency: string;
  active: boolean;
}): ExtraChargeRow {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    price: r.price,
    priceUnit: r.priceUnit,
    currency: r.currency,
    active: r.active,
    priceLabel: parsePriceLabel(r.price, r.priceUnit, r.currency),
  };
}

export async function seedExtraChargesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.extraCharge.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.extraCharge.createMany({
    data: EXTRA_CHARGES.map((e) => {
      const { price, unit } = parseSeedPrice(e.price);
      return {
        id: `ex-${e.code}`,
        propertyId: prop,
        code: e.code,
        name: e.name,
        price,
        priceUnit: unit,
        currency: 'TRY',
        active: e.active,
      };
    }),
  });
}

export async function getExtraChargesServer(propertyId?: string): Promise<ExtraChargeRow[]> {
  await init();
  await seedExtraChargesIfEmpty(propertyId);
  const rows = await prisma.extraCharge.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { code: 'asc' },
  });
  return rows.map(mapRow);
}

export async function saveExtraChargeServer(
  data: {
    code: string;
    name: string;
    price: number;
    priceUnit?: string;
    currency?: string;
    active?: boolean;
  },
  propertyId?: string,
): Promise<ExtraChargeRow> {
  await init();
  const prop = pid(propertyId);
  const id = `ex-${data.code}`;
  const row = await prisma.extraCharge.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      price: data.price,
      priceUnit: data.priceUnit ?? 'gece',
      currency: data.currency ?? 'TRY',
      active: data.active ?? true,
    },
    update: {
      name: data.name,
      price: data.price,
      priceUnit: data.priceUnit ?? 'gece',
      currency: data.currency ?? 'TRY',
      active: data.active ?? true,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}
