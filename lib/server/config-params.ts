import { CONFIG_PARAMS } from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type ConfigParamRow = {
  id: string;
  key: string;
  value: string;
  description: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: { id: string; key: string; value: string; description: string }): ConfigParamRow {
  return { ...r };
}

export async function seedConfigParamsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.configParam.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.configParam.createMany({
    data: CONFIG_PARAMS.map((p) => ({
      id: `cfg-${p.key}`,
      propertyId: prop,
      key: p.key,
      value: p.value,
      description: p.description,
    })),
  });
}

export async function getConfigParamsServer(propertyId?: string): Promise<ConfigParamRow[]> {
  await init();
  await seedConfigParamsIfEmpty(propertyId);
  const rows = await prisma.configParam.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { key: 'asc' },
  });
  return rows.map(mapRow);
}

export async function getConfigParamValue(
  key: string,
  propertyId?: string,
  fallback = '',
): Promise<string> {
  const rows = await getConfigParamsServer(propertyId);
  return rows.find((r) => r.key === key)?.value ?? fallback;
}

export async function saveConfigParamServer(
  data: { key: string; value: string; description?: string },
  propertyId?: string,
): Promise<ConfigParamRow> {
  await init();
  const prop = pid(propertyId);
  const id = `cfg-${data.key}`;
  const existing = await prisma.configParam.findUnique({ where: { id } });
  const row = await prisma.configParam.upsert({
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
  if (!existing) {
    await seedConfigParamsIfEmpty(propertyId);
  }
  bustReadCaches(prop);
  return mapRow(row);
}
