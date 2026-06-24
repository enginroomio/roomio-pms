import { BRANCHES } from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type PropertyBranchRow = {
  id: string;
  code: string;
  name: string;
  city: string;
  rooms: number;
  active: boolean;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  code: string;
  name: string;
  city: string;
  rooms: number;
  active: boolean;
}): PropertyBranchRow {
  return { ...r };
}

export async function seedPropertyBranchesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.propertyBranch.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.propertyBranch.createMany({
    data: BRANCHES.map((b) => ({
      id: `branch-${b.code}`,
      propertyId: prop,
      code: b.code,
      name: b.name,
      city: b.city,
      rooms: b.rooms,
      active: b.active,
    })),
  });
}

export async function getPropertyBranchesServer(propertyId?: string): Promise<PropertyBranchRow[]> {
  await init();
  await seedPropertyBranchesIfEmpty(propertyId);
  const rows = await prisma.propertyBranch.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { code: 'asc' },
  });
  return rows.map(mapRow);
}

export async function savePropertyBranchServer(
  data: Omit<PropertyBranchRow, 'id'> & { id?: string },
  propertyId?: string,
): Promise<PropertyBranchRow> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `branch-${data.code}`;
  const row = await prisma.propertyBranch.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      city: data.city,
      rooms: data.rooms,
      active: data.active,
    },
    update: {
      name: data.name,
      city: data.city,
      rooms: data.rooms,
      active: data.active,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}
