import { AGENCY_CONTRACTS } from '@/lib/data/kurulus';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { init } from '@/lib/server/pms-store';

export type AgencyContract = {
  id: string;
  code: string;
  name: string;
  commission: number;
  contractEnd?: string;
  market?: string;
  active: boolean;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function parseCommission(s: string): number {
  const n = Number(s.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function mapRow(r: {
  id: string;
  code: string;
  name: string;
  commission: number;
  contractEnd: string | null;
  market: string | null;
  active: boolean;
}): AgencyContract {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    commission: r.commission,
    contractEnd: r.contractEnd ?? undefined,
    market: r.market ?? undefined,
    active: r.active,
  };
}

export async function seedAgencyContractsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.agencyContract.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.agencyContract.createMany({
    data: AGENCY_CONTRACTS.map((a, i) => ({
      id: `ag-seed-${i}`,
      propertyId: prop,
      code: a.code,
      name: a.name,
      commission: parseCommission(a.commission),
      contractEnd: a.contractEnd === '—' ? null : a.contractEnd,
      market: a.code === 'DIR' ? 'FIT' : 'OTA',
      active: a.active,
    })),
  });
}

export async function getAgencyContractsServer(propertyId?: string, activeOnly = true): Promise<AgencyContract[]> {
  await init();
  await seedAgencyContractsIfEmpty(propertyId);
  const rows = await prisma.agencyContract.findMany({
    where: { propertyId: pid(propertyId), ...(activeOnly ? { active: true } : {}) },
    orderBy: { code: 'asc' },
  });
  return rows.map(mapRow);
}

export async function getAgencyByCodeServer(code: string, propertyId?: string): Promise<AgencyContract | null> {
  await seedAgencyContractsIfEmpty(propertyId);
  const row = await prisma.agencyContract.findFirst({
    where: { propertyId: pid(propertyId), code },
  });
  return row ? mapRow(row) : null;
}

export async function saveAgencyContractServer(
  data: Omit<AgencyContract, 'id'> & { id?: string },
  propertyId?: string,
): Promise<AgencyContract> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `ag-${Date.now()}`;
  const row = await prisma.agencyContract.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      commission: data.commission,
      contractEnd: data.contractEnd ?? null,
      market: data.market ?? null,
      active: data.active,
    },
    update: {
      code: data.code,
      name: data.name,
      commission: data.commission,
      contractEnd: data.contractEnd ?? null,
      market: data.market ?? null,
      active: data.active,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}
