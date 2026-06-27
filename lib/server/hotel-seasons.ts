import { HOTEL_SEASONS } from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type HotelSeasonRow = {
  id: string;
  code: string;
  name: string;
  start: string;
  end: string;
  active: boolean;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  code: string;
  name: string;
  start: string;
  end: string;
  active: boolean;
}): HotelSeasonRow {
  return { ...r };
}

export async function seedHotelSeasonsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.hotelSeason.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.hotelSeason.createMany({
    data: HOTEL_SEASONS.map((s) => ({
      id: `season-${s.code}`,
      propertyId: prop,
      code: s.code,
      name: s.name,
      start: s.start,
      end: s.end,
      active: s.active,
    })),
  });
}

export async function getHotelSeasonsServer(propertyId?: string): Promise<HotelSeasonRow[]> {
  await init();
  await seedHotelSeasonsIfEmpty(propertyId);
  const rows = await prisma.hotelSeason.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { start: 'asc' },
  });
  return rows.map(mapRow);
}

export async function saveHotelSeasonServer(
  data: Omit<HotelSeasonRow, 'id'> & { id?: string },
  propertyId?: string,
): Promise<HotelSeasonRow> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `season-${data.code}`;
  const row = await prisma.hotelSeason.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      start: data.start,
      end: data.end,
      active: data.active,
    },
    update: {
      name: data.name,
      start: data.start,
      end: data.end,
      active: data.active,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}
