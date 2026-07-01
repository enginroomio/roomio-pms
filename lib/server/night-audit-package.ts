import { getAuditLogsServer } from '@/lib/server/audit-log';
import { runNightAuditPreCloseChecks } from '@/lib/server/night-audit-checks';
import { getBusinessDate, getProperty, init } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

export type NightAuditPackage = {
  hotel: string;
  businessDate: string;
  generatedAt: string;
  ready: boolean;
  checks: Awaited<ReturnType<typeof runNightAuditPreCloseChecks>>['checks'];
  auditLogs: Awaited<ReturnType<typeof getAuditLogsServer>>;
};

export { formatNightAuditPackageText } from '@/lib/reports/night-audit-text';

export async function buildNightAuditPackageForDate(
  propertyId?: string,
  businessDate?: string,
): Promise<NightAuditPackage> {
  await init();
  const prop = propertyId ?? DEFAULT_PROPERTY_ID;
  const date = businessDate ?? (await getBusinessDate(prop));
  const hotel = (await getProperty(prop))?.name ?? 'Hotel';
  const [preClose, auditLogs] = await Promise.all([
    runNightAuditPreCloseChecks(prop, { log: false }),
    getAuditLogsServer(prop, { businessDate: date, limit: 100 }),
  ]);

  return {
    hotel,
    businessDate: date,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    ready: preClose.ready,
    checks: preClose.checks,
    auditLogs,
  };
}

export async function buildNightAuditPackageServer(propertyId?: string): Promise<NightAuditPackage> {
  return buildNightAuditPackageForDate(propertyId);
}
