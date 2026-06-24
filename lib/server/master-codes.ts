import type { CodeRow } from '@/lib/data/kurulus';
import {
  DEPARTMENTS,
  MARKET_CODES,
  MEAL_PLANS,
  NATIONALITIES,
  RES_TYPES,
  REVENUE_GROUPS,
  SEGMENT_CODES,
  SOURCE_CODES,
} from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type MasterCodeKind =
  | 'market'
  | 'segment'
  | 'source'
  | 'department'
  | 'meal_plan'
  | 'nationality'
  | 'res_type'
  | 'revenue_group';

const ALL_KINDS: MasterCodeKind[] = [
  'market', 'segment', 'source', 'department', 'meal_plan', 'nationality', 'res_type', 'revenue_group',
];

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function seedForKind(kind: MasterCodeKind): CodeRow[] {
  switch (kind) {
    case 'market': return MARKET_CODES;
    case 'segment': return SEGMENT_CODES;
    case 'source': return SOURCE_CODES;
    case 'department': return DEPARTMENTS;
    case 'meal_plan': return MEAL_PLANS;
    case 'nationality':
      return NATIONALITIES.map((n) => ({ code: n.code, name: n.name, active: true }));
    case 'res_type': return RES_TYPES;
    case 'revenue_group': return REVENUE_GROUPS;
    default: return [];
  }
}

function mapRow(r: {
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}): CodeRow {
  return {
    code: r.code,
    name: r.name,
    description: r.description ?? undefined,
    active: r.active,
  };
}

export async function seedMasterCodesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);

  for (const kind of ALL_KINDS) {
    const count = await prisma.masterCode.count({ where: { propertyId: prop, kind } });
    if (count > 0) continue;

    await prisma.masterCode.createMany({
      data: seedForKind(kind).map((row) => ({
        id: `mc-${kind}-${row.code}`,
        propertyId: prop,
        kind,
        code: row.code,
        name: row.name,
        description: row.description ?? null,
        active: row.active,
      })),
    });
  }
}

export async function getMasterCodesServer(
  kind: MasterCodeKind,
  propertyId?: string,
  activeOnly = true,
): Promise<CodeRow[]> {
  await init();
  await seedMasterCodesIfEmpty(propertyId);
  const rows = await prisma.masterCode.findMany({
    where: {
      propertyId: pid(propertyId),
      kind,
      ...(activeOnly ? { active: true } : {}),
    },
    orderBy: { code: 'asc' },
  });
  return rows.map(mapRow);
}

export async function saveMasterCodeServer(
  kind: MasterCodeKind,
  data: CodeRow,
  propertyId?: string,
): Promise<CodeRow> {
  await init();
  const prop = pid(propertyId);
  const id = `mc-${kind}-${data.code}`;
  const row = await prisma.masterCode.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      kind,
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      active: data.active,
    },
    update: {
      name: data.name,
      description: data.description ?? null,
      active: data.active,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}
