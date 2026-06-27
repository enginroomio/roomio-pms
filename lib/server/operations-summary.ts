import { getGuestRelationsStatsServer } from '@/lib/server/guest-activities';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';
import { runNightAuditPreCloseChecks } from '@/lib/server/night-audit-checks';
import { prisma } from '@/lib/server/prisma';
import { getBusinessDate, init } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

export type OperationsSummary = {
  businessDate: string;
  occupancy: number;
  inHouse: number;
  arrivalsToday: number;
  departuresToday: number;
  cleanVacant: number;
  dirtyVacant: number;
  openTraces: number;
  openComplaints: number;
  pendingReviews: number;
  openCashRegisters: number;
  eodReady: boolean;
  eodBlockers: number;
  alerts: { level: 'warn' | 'info'; message: string; href: string }[];
};

export async function getOperationsSummaryServer(propertyId?: string): Promise<OperationsSummary> {
  await init();
  const prop = propertyId ?? DEFAULT_PROPERTY_ID;
  const businessDate = await getBusinessDate(prop);

  const [dashboard, grStats, preClose, openCash] = await Promise.all([
    getDashboardSnapshot(prop),
    getGuestRelationsStatsServer(prop),
    runNightAuditPreCloseChecks(prop, { log: false }),
    prisma.cashRegister.count({
      where: { propertyId: prop, businessDate, status: 'open' },
    }),
  ]);

  const alerts: OperationsSummary['alerts'] = [];

  if (grStats.openTraces > 0) {
    alerts.push({
      level: 'warn',
      message: `${grStats.openTraces} açık trace`,
      href: '/guest-relations/traces',
    });
  }
  if (grStats.openComplaints > 0) {
    alerts.push({
      level: 'warn',
      message: `${grStats.openComplaints} açık şikayet`,
      href: '/guest-relations/complaints',
    });
  }
  if (openCash > 0) {
    alerts.push({
      level: 'warn',
      message: `${openCash} açık kasa`,
      href: '/reception?tab=kasa-close',
    });
  }
  if (!preClose.ready) {
    alerts.push({
      level: 'warn',
      message: `Gün sonu ön kontrol: ${preClose.checks.filter((c) => c.status !== 'ok').length} engel`,
      href: '/reports?tab=eod&action=close',
    });
  }
  if (dashboard.dirtyVacant > 5) {
    alerts.push({
      level: 'info',
      message: `${dashboard.dirtyVacant} kirli boş oda`,
      href: '/housekeeping/rooms',
    });
  }
  if (grStats.pendingReviews > 0) {
    alerts.push({
      level: 'info',
      message: `${grStats.pendingReviews} bekleyen misafir yorumu`,
      href: '/guest-relations/reviews',
    });
  }

  return {
    businessDate,
    occupancy: dashboard.occupancy,
    inHouse: dashboard.inHouse,
    arrivalsToday: dashboard.arrivals.length,
    departuresToday: dashboard.departures.length,
    cleanVacant: dashboard.cleanVacant,
    dirtyVacant: dashboard.dirtyVacant,
    openTraces: grStats.openTraces,
    openComplaints: grStats.openComplaints,
    pendingReviews: grStats.pendingReviews,
    openCashRegisters: openCash,
    eodReady: preClose.ready,
    eodBlockers: preClose.checks.filter((c) => c.status !== 'ok').length,
    alerts,
  };
}
