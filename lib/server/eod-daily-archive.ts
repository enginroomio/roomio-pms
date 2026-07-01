import { archiveEodDayPackage, type EodDayArchiveResult } from '@/lib/server/eod-archive-package';
import { countEodArchiveSnapshots, hasEodGrSnapshots } from '@/lib/server/eod-gr-snapshot';
import { getBusinessDate, init } from '@/lib/server/pms-store';
import { prisma } from '@/lib/server/prisma';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

export function dailyArchiveId(propertyId: string, businessDate: string): string {
  return `daily-${propertyId}-${businessDate}`;
}

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

export type DailyEodArchiveResult = EodDayArchiveResult & {
  archiveId: string;
  businessDate: string;
  status: 'open' | 'closed';
  cloudBackup?: import('@/lib/integrations/cloud-backup/types').CloudBackupResult | null;
};

/** Günlük gün sonu paketini DB'ye kaydet (açık iş günü — gün kapatmadan). */
export async function saveDailyEodArchive(
  businessDate: string,
  user: string,
  propertyId?: string,
): Promise<DailyEodArchiveResult> {
  await init();
  const prop = pid(propertyId);
  const archiveId = dailyArchiveId(prop, businessDate);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const existing = await prisma.eodArchive.findUnique({
    where: { propertyId_businessDate: { propertyId: prop, businessDate } },
    select: { status: true, id: true },
  });
  if (existing?.status === 'closed') {
    const counts = await countEodArchiveSnapshots(businessDate, prop);
    return {
      archiveId: existing.id,
      businessDate,
      status: 'closed',
      grCount: counts.gr,
      totalCount: counts.total,
      manifest: {
        businessDate,
        generatedAt: now,
        closedBy: user,
        grReportCount: counts.gr,
        supplements: ['NIGHT-AUDIT', 'EOD-MANIFEST'],
        totalCount: counts.total,
      },
    };
  }

  await prisma.eodArchive.upsert({
    where: { propertyId_businessDate: { propertyId: prop, businessDate } },
    create: {
      id: archiveId,
      propertyId: prop,
      businessDate,
      status: 'open',
      closedAt: '',
      closedBy: user,
      occupancy: 0,
      revenue: 0,
      generatedAt: now,
      reportCount: 0,
    },
    update: {
      generatedAt: now,
      closedBy: user,
    },
  });

  const result = await archiveEodDayPackage(archiveId, businessDate, user, prop);

  await prisma.eodArchive.update({
    where: { id: archiveId },
    data: {
      generatedAt: result.manifest.generatedAt,
      reportCount: result.totalCount,
    },
  });

  let cloudBackup: import('@/lib/integrations/cloud-backup/types').CloudBackupResult | null = null;
  try {
    const { maybeBackupAfterDailyArchive } = await import('@/lib/server/cloud-backup/service');
    cloudBackup = await maybeBackupAfterDailyArchive(businessDate, user, prop);
  } catch {
    // Bulut yedek günlük arşivi bloklamamalı
  }

  return {
    ...result,
    archiveId,
    businessDate,
    status: 'open',
    cloudBackup,
  };
}

/** Mevcut iş günü için günlük arşiv yoksa oluştur. */
export async function ensureDailyEodArchive(user = 'Sistem', propertyId?: string): Promise<DailyEodArchiveResult | null> {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);
  const exists = await hasEodGrSnapshots(businessDate, prop);
  if (exists) return null;
  return saveDailyEodArchive(businessDate, user, prop);
}

/** Tüm şubeler için günlük arşiv (zamanlayıcı). */
export async function runDailyEodArchiveAllProperties(user = 'Sistem'): Promise<{ archived: number; skipped: number }> {
  await init();
  const properties = await prisma.property.findMany({ select: { id: true } });
  let archived = 0;
  let skipped = 0;
  for (const { id } of properties) {
    const businessDate = await getBusinessDate(id);
    const exists = await hasEodGrSnapshots(businessDate, id);
    if (exists) {
      skipped += 1;
      continue;
    }
    try {
      await saveDailyEodArchive(businessDate, user, id);
      archived += 1;
    } catch (err) {
      console.error(`[eod-daily-archive] ${id} ${businessDate}:`, err);
      skipped += 1;
    }
  }
  return { archived, skipped };
}
