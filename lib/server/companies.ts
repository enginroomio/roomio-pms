import { DEMO_COMPANIES } from '@/lib/data/kurulus';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { init } from '@/lib/server/pms-store';

export type Company = {
  id: string;
  code: string;
  name: string;
  branch?: string;
  taxNo?: string;
  address?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  creditLimit?: number;
  active: boolean;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  code: string;
  name: string;
  branch: string | null;
  taxNo: string | null;
  address: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  creditLimit: number | null;
  active: boolean;
}): Company {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    branch: r.branch ?? undefined,
    taxNo: r.taxNo ?? undefined,
    address: r.address ?? undefined,
    contactName: r.contactName ?? undefined,
    email: r.email ?? undefined,
    phone: r.phone ?? undefined,
    creditLimit: r.creditLimit ?? undefined,
    active: r.active,
  };
}

export async function seedCompaniesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.company.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.company.createMany({
    data: DEMO_COMPANIES.map((c, i) => ({
      id: `co-seed-${i}`,
      propertyId: prop,
      code: c.code,
      name: c.name,
      branch: c.branch,
      taxNo: null,
      address: null,
      contactName: null,
      email: null,
      phone: null,
      creditLimit: 50000,
      active: c.active,
    })),
  });
}

export async function getCompaniesServer(propertyId?: string, activeOnly = true): Promise<Company[]> {
  await init();
  await seedCompaniesIfEmpty(propertyId);
  const rows = await prisma.company.findMany({
    where: { propertyId: pid(propertyId), ...(activeOnly ? { active: true } : {}) },
    orderBy: { code: 'asc' },
  });
  return rows.map(mapRow);
}

export async function getCompanyByCodeServer(code: string, propertyId?: string): Promise<Company | null> {
  await seedCompaniesIfEmpty(propertyId);
  const row = await prisma.company.findFirst({
    where: { propertyId: pid(propertyId), code },
  });
  return row ? mapRow(row) : null;
}

export async function saveCompanyServer(
  data: Omit<Company, 'id'> & { id?: string },
  propertyId?: string,
): Promise<Company> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `co-${Date.now()}`;
  const row = await prisma.company.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      branch: data.branch ?? null,
      taxNo: data.taxNo ?? null,
      address: data.address ?? null,
      contactName: data.contactName ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      creditLimit: data.creditLimit ?? null,
      active: data.active,
    },
    update: {
      code: data.code,
      name: data.name,
      branch: data.branch ?? null,
      taxNo: data.taxNo ?? null,
      address: data.address ?? null,
      contactName: data.contactName ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      creditLimit: data.creditLimit ?? null,
      active: data.active,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}
