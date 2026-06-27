import { WAREHOUSES } from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type WarehouseRow = {
  id: string;
  code: string;
  name: string;
  location: string;
  active: boolean;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  code: string;
  name: string;
  location: string;
  active: boolean;
}): WarehouseRow {
  return { ...r };
}

export async function seedWarehousesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.warehouse.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.warehouse.createMany({
    data: WAREHOUSES.map((w) => ({
      id: `wh-${w.code}`,
      propertyId: prop,
      code: w.code,
      name: w.name,
      location: w.location,
      active: w.active,
    })),
  });
}

export async function getWarehousesServer(propertyId?: string): Promise<WarehouseRow[]> {
  await init();
  await seedWarehousesIfEmpty(propertyId);
  const rows = await prisma.warehouse.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { code: 'asc' },
  });
  return rows.map(mapRow);
}

export async function saveWarehouseServer(
  data: Omit<WarehouseRow, 'id'> & { id?: string },
  propertyId?: string,
): Promise<WarehouseRow> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `wh-${data.code}`;
  const row = await prisma.warehouse.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      location: data.location,
      active: data.active,
    },
    update: {
      name: data.name,
      location: data.location,
      active: data.active,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}
