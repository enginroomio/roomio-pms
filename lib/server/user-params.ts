import { USER_PARAMS } from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type UserParamRow = {
  id: string;
  key: string;
  value: string;
  description: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

export async function seedUserParamsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.userParam.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.userParam.createMany({
    data: USER_PARAMS.map((p) => ({
      id: `up-${p.key}`,
      propertyId: prop,
      key: p.key,
      value: p.value,
      description: p.description,
    })),
  });
}

export async function getUserParamsServer(propertyId?: string): Promise<UserParamRow[]> {
  await init();
  await seedUserParamsIfEmpty(propertyId);
  const rows = await prisma.userParam.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { key: 'asc' },
  });
  return rows.map((r) => ({ id: r.id, key: r.key, value: r.value, description: r.description }));
}

export async function saveUserParamServer(
  data: { key: string; value: string; description?: string },
  propertyId?: string,
): Promise<UserParamRow> {
  await init();
  const prop = pid(propertyId);
  const id = `up-${data.key}`;
  const row = await prisma.userParam.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      key: data.key,
      value: data.value,
      description: data.description ?? data.key,
    },
    update: {
      value: data.value,
      ...(data.description ? { description: data.description } : {}),
    },
  });
  bustReadCaches(prop);
  return { id: row.id, key: row.key, value: row.value, description: row.description };
}

export async function isMarketRequiredServer(propertyId?: string): Promise<boolean> {
  const { getConfigParamValue } = await import('@/lib/server/config-params');
  const value = await getConfigParamValue('MARKET_REQUIRED', propertyId, 'Hayır');
  const v = value.toLowerCase();
  return v === 'evet' || v === 'yes' || v === 'true' || v === '1';
}
