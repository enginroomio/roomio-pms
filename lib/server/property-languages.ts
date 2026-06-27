import { DEMO_LANGUAGES } from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type PropertyLanguageRow = {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  active: boolean;
  defaultLang: boolean;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  active: boolean;
  defaultLang: boolean;
}): PropertyLanguageRow {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    nativeName: r.nativeName,
    active: r.active,
    defaultLang: r.defaultLang,
  };
}

export async function seedPropertyLanguagesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.propertyLanguage.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.propertyLanguage.createMany({
    data: DEMO_LANGUAGES.map((l) => ({
      id: `lang-${l.code}`,
      propertyId: prop,
      code: l.code,
      name: l.name,
      nativeName: l.nativeName,
      active: l.active,
      defaultLang: l.defaultLang,
    })),
  });
}

export async function getPropertyLanguagesServer(propertyId?: string): Promise<PropertyLanguageRow[]> {
  await init();
  await seedPropertyLanguagesIfEmpty(propertyId);
  const rows = await prisma.propertyLanguage.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { code: 'asc' },
  });
  return rows.map(mapRow);
}

export async function savePropertyLanguageServer(
  data: Omit<PropertyLanguageRow, 'id'> & { id?: string },
  propertyId?: string,
): Promise<PropertyLanguageRow> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `lang-${data.code}`;

  if (data.defaultLang) {
    await prisma.propertyLanguage.updateMany({
      where: { propertyId: prop },
      data: { defaultLang: false },
    });
  }

  const row = await prisma.propertyLanguage.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      nativeName: data.nativeName,
      active: data.active,
      defaultLang: data.defaultLang,
    },
    update: {
      name: data.name,
      nativeName: data.nativeName,
      active: data.active,
      defaultLang: data.defaultLang,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}
