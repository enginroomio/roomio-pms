import { HOTEL_INFO } from '@/lib/data/kurulus';
import { appendAuditLog } from '@/lib/server/audit-log';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { getBusinessDate, init } from '@/lib/server/pms-store';

export type PropertyProfile = {
  id: string;
  code: string;
  name: string;
  city: string | null;
  totalRooms: number;
  company: string;
  taxOffice: string;
  taxNumber: string;
  address: string;
  phone: string;
  email: string;
  stars: number;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  businessDate: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapProfile(
  row: {
    id: string;
    code: string;
    name: string;
    city: string | null;
    totalRooms: number;
    company: string | null;
    taxOffice: string | null;
    taxNumber: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    stars: number | null;
    checkInTime: string | null;
    checkOutTime: string | null;
    currency: string | null;
  },
  businessDate: string,
): PropertyProfile {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    city: row.city,
    totalRooms: row.totalRooms,
    company: row.company ?? HOTEL_INFO.company,
    taxOffice: row.taxOffice ?? HOTEL_INFO.taxOffice,
    taxNumber: row.taxNumber ?? HOTEL_INFO.taxNumber,
    address: row.address ?? HOTEL_INFO.address,
    phone: row.phone ?? HOTEL_INFO.phone,
    email: row.email ?? HOTEL_INFO.email,
    stars: row.stars ?? HOTEL_INFO.stars,
    checkInTime: row.checkInTime ?? HOTEL_INFO.checkInTime,
    checkOutTime: row.checkOutTime ?? HOTEL_INFO.checkOutTime,
    currency: row.currency ?? HOTEL_INFO.currency,
    businessDate,
  };
}

export async function seedPropertyProfileIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const row = await prisma.property.findUnique({ where: { id: prop } });
  if (!row || row.company) return;

  await prisma.property.update({
    where: { id: prop },
    data: {
      company: HOTEL_INFO.company,
      taxOffice: HOTEL_INFO.taxOffice,
      taxNumber: HOTEL_INFO.taxNumber,
      address: row.city?.includes('Antalya')
        ? 'Lara Turizm Yolu No:45, Muratpaşa / Antalya'
        : HOTEL_INFO.address,
      phone: row.city?.includes('Antalya') ? '+90 242 555 02 00' : HOTEL_INFO.phone,
      email: row.city?.includes('Antalya') ? 'antalya@sapphirehotel.com' : HOTEL_INFO.email,
      stars: HOTEL_INFO.stars,
      checkInTime: HOTEL_INFO.checkInTime,
      checkOutTime: HOTEL_INFO.checkOutTime,
      currency: HOTEL_INFO.currency,
    },
  });
}

export async function getPropertyProfileServer(propertyId?: string): Promise<PropertyProfile> {
  await init();
  await seedPropertyProfileIfEmpty(propertyId);
  const prop = pid(propertyId);
  const [row, businessDate] = await Promise.all([
    prisma.property.findUniqueOrThrow({ where: { id: prop } }),
    getBusinessDate(prop),
  ]);
  return mapProfile(row, businessDate);
}

export async function savePropertyProfileServer(
  data: Partial<Omit<PropertyProfile, 'id' | 'businessDate'>>,
  propertyId?: string,
  user = 'Kuruluş',
): Promise<PropertyProfile> {
  await init();
  const prop = pid(propertyId);
  const row = await prisma.property.update({
    where: { id: prop },
    data: {
      ...(data.name != null ? { name: data.name } : {}),
      ...(data.code != null ? { code: data.code } : {}),
      ...(data.company != null ? { company: data.company } : {}),
      ...(data.taxOffice != null ? { taxOffice: data.taxOffice } : {}),
      ...(data.taxNumber != null ? { taxNumber: data.taxNumber } : {}),
      ...(data.address != null ? { address: data.address } : {}),
      ...(data.phone != null ? { phone: data.phone } : {}),
      ...(data.email != null ? { email: data.email } : {}),
      ...(data.stars != null ? { stars: data.stars } : {}),
      ...(data.checkInTime != null ? { checkInTime: data.checkInTime } : {}),
      ...(data.checkOutTime != null ? { checkOutTime: data.checkOutTime } : {}),
      ...(data.currency != null ? { currency: data.currency } : {}),
    },
  });

  await appendAuditLog({
    module: 'settings',
    action: 'property_profile_save',
    entityType: 'Property',
    entityId: prop,
    user,
    detail: row.name,
  }, prop);

  bustReadCaches(prop);
  const businessDate = await getBusinessDate(prop);
  return mapProfile(row, businessDate);
}
