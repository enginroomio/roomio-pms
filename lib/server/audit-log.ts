import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { getBusinessDate, init } from '@/lib/server/pms-store';

export type AuditModule = 'eod' | 'folio' | 'reception' | 'cash' | 'deposit' | 'reservation' | 'group' | 'settings';

export type AuditEntry = {
  id: string;
  businessDate: string;
  createdAt: string;
  module: AuditModule;
  action: string;
  entityType?: string;
  entityId?: string;
  user: string;
  detail?: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

export async function appendAuditLog(
  entry: Omit<AuditEntry, 'id' | 'businessDate' | 'createdAt'> & { businessDate?: string },
  propertyId?: string,
): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const businessDate = entry.businessDate ?? (await getBusinessDate(prop));
  await prisma.auditLog.create({
    data: {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      propertyId: prop,
      businessDate,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      module: entry.module,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      user: entry.user,
      detail: entry.detail ?? null,
    },
  });
}

export async function getAuditLogsServer(
  propertyId?: string,
  opts: { businessDate?: string; module?: string; limit?: number } = {},
): Promise<AuditEntry[]> {
  await init();
  const rows = await prisma.auditLog.findMany({
    where: {
      propertyId: pid(propertyId),
      ...(opts.businessDate ? { businessDate: opts.businessDate } : {}),
      ...(opts.module ? { module: opts.module } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: opts.limit ?? 200,
  });
  return rows.map((r) => ({
    id: r.id,
    businessDate: r.businessDate,
    createdAt: r.createdAt,
    module: r.module as AuditModule,
    action: r.action,
    entityType: r.entityType ?? undefined,
    entityId: r.entityId ?? undefined,
    user: r.user,
    detail: r.detail ?? undefined,
  }));
}
