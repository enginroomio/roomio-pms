import { FISCAL_DEVICES } from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type FiscalDeviceRow = {
  id: string;
  code: string;
  name: string;
  serial: string;
  active: boolean;
};

export type FiscalDeviceStatusRow = FiscalDeviceRow & {
  connection: 'ok' | 'offline';
  zReportNo: number;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  code: string;
  name: string;
  serial: string;
  active: boolean;
}): FiscalDeviceRow {
  return { ...r };
}

export async function seedFiscalDevicesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.fiscalDevice.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.fiscalDevice.createMany({
    data: FISCAL_DEVICES.map((f) => ({
      id: `fiscal-${f.code}`,
      propertyId: prop,
      code: f.code,
      name: f.name,
      serial: f.serial,
      active: f.active,
    })),
  });
}

export async function getFiscalDevicesServer(propertyId?: string): Promise<FiscalDeviceRow[]> {
  await init();
  await seedFiscalDevicesIfEmpty(propertyId);
  const rows = await prisma.fiscalDevice.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { code: 'asc' },
  });
  return rows.map(mapRow);
}

function zReportForDevice(code: string, serial: string): number {
  const codeNum = Number.parseInt(code.replace(/\D/g, ''), 10) || 1;
  const serialTail = Number.parseInt(serial.replace(/\D/g, '').slice(-3), 10) || 0;
  return 1200 + codeNum * 10 + (serialTail % 47);
}

export function enrichFiscalDeviceStatus(row: FiscalDeviceRow): FiscalDeviceStatusRow {
  return {
    ...row,
    connection: row.active ? 'ok' : 'offline',
    zReportNo: zReportForDevice(row.code, row.serial),
  };
}

export async function getFiscalDevicesStatusServer(propertyId?: string): Promise<FiscalDeviceStatusRow[]> {
  const rows = await getFiscalDevicesServer(propertyId);
  return rows.map(enrichFiscalDeviceStatus);
}

export async function pingFiscalDevicesServer(propertyId?: string): Promise<{ ok: boolean; online: number; total: number }> {
  const rows = await getFiscalDevicesStatusServer(propertyId);
  const online = rows.filter((r) => r.connection === 'ok').length;
  return { ok: online > 0, online, total: rows.length };
}

export async function patchFiscalDeviceActiveServer(
  id: string,
  active: boolean,
  propertyId?: string,
): Promise<FiscalDeviceStatusRow | null> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.fiscalDevice.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return null;
  const row = await prisma.fiscalDevice.update({
    where: { id },
    data: { active },
  });
  bustReadCaches(prop);
  return enrichFiscalDeviceStatus(mapRow(row));
}

export async function saveFiscalDeviceServer(
  data: Omit<FiscalDeviceRow, 'id'> & { id?: string },
  propertyId?: string,
): Promise<FiscalDeviceRow> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `fiscal-${data.code}`;
  const row = await prisma.fiscalDevice.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      serial: data.serial,
      active: data.active,
    },
    update: {
      name: data.name,
      serial: data.serial,
      active: data.active,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}
