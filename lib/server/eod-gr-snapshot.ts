import type { EodLegacyPackage } from '@/lib/reports/eod-legacy-package';
import { EOD_LEGACY_REPORTS } from '@/lib/reports/eod-legacy-catalog';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export const EOD_ARCHIVE_SUPPLEMENT_IDS = ['NIGHT-AUDIT', 'EOD-MANIFEST'] as const;

const GR_REPORT_IDS = new Set(EOD_LEGACY_REPORTS.map((r) => r.id));

export type EodGrSnapshotMeta = {
  reportId: string;
  businessDate: string;
  generatedAt: string;
  lineCount: number;
};

export type EodArchiveSupplement = { reportId: string; text: string };

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function countListedLines(text: string): number {
  const m = text.match(/Listelenen\s+(\d+)/g);
  if (!m?.length) return 0;
  const last = m[m.length - 1]!.match(/(\d+)/);
  return last ? Number(last[1]) : 0;
}

function isGrReportId(reportId: string): boolean {
  return GR_REPORT_IDS.has(reportId);
}

export async function saveEodArchivePackage(
  archiveId: string,
  businessDate: string,
  grPkg: EodLegacyPackage,
  supplements: EodArchiveSupplement[],
  propertyId?: string,
): Promise<number> {
  await init();
  const prop = pid(propertyId);
  const rows = [
    ...grPkg.reports.map((report) => ({
      id: `egr-${archiveId}-${report.id}`,
      propertyId: prop,
      archiveId,
      businessDate,
      reportId: report.id,
      text: grPkg.texts[report.id] ?? '',
      generatedAt: grPkg.generatedAt,
    })),
    ...supplements.map((s) => ({
      id: `egr-${archiveId}-${s.reportId}`,
      propertyId: prop,
      archiveId,
      businessDate,
      reportId: s.reportId,
      text: s.text,
      generatedAt: grPkg.generatedAt,
    })),
  ];

  await prisma.$transaction([
    prisma.eodGrSnapshot.deleteMany({ where: { archiveId } }),
    prisma.eodGrSnapshot.createMany({ data: rows }),
  ]);

  return rows.length;
}

export async function saveEodGrSnapshots(
  archiveId: string,
  businessDate: string,
  pkg: EodLegacyPackage,
  propertyId?: string,
): Promise<number> {
  return saveEodArchivePackage(archiveId, businessDate, pkg, [], propertyId);
}

export async function getEodGrSnapshotText(
  businessDate: string,
  reportId: string,
  propertyId?: string,
): Promise<string | null> {
  await init();
  const row = await prisma.eodGrSnapshot.findFirst({
    where: { propertyId: pid(propertyId), businessDate, reportId },
    orderBy: { generatedAt: 'desc' },
    select: { text: true },
  });
  return row?.text ?? null;
}

export async function listEodGrSnapshotMeta(
  businessDate: string,
  propertyId?: string,
): Promise<EodGrSnapshotMeta[]> {
  await init();
  const rows = await prisma.eodGrSnapshot.findMany({
    where: {
      propertyId: pid(propertyId),
      businessDate,
      reportId: { notIn: [...EOD_ARCHIVE_SUPPLEMENT_IDS] },
    },
    orderBy: { reportId: 'asc' },
    select: { reportId: true, businessDate: true, generatedAt: true, text: true },
  });
  return rows.map((row) => ({
    reportId: row.reportId,
    businessDate: row.businessDate,
    generatedAt: row.generatedAt,
    lineCount: countListedLines(row.text),
  }));
}

export async function hasEodGrSnapshots(businessDate: string, propertyId?: string): Promise<boolean> {
  await init();
  const count = await prisma.eodGrSnapshot.count({
    where: {
      propertyId: pid(propertyId),
      businessDate,
      reportId: { in: [...GR_REPORT_IDS] },
    },
    take: 1,
  });
  return count > 0;
}

export async function getEodArchiveManifest(
  businessDate: string,
  propertyId?: string,
): Promise<Record<string, unknown> | null> {
  const text = await getEodGrSnapshotText(businessDate, 'EOD-MANIFEST', propertyId);
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function countEodArchiveSnapshots(
  businessDate: string,
  propertyId?: string,
): Promise<{ gr: number; total: number }> {
  await init();
  const rows = await prisma.eodGrSnapshot.findMany({
    where: { propertyId: pid(propertyId), businessDate },
    select: { reportId: true },
  });
  const gr = rows.filter((r) => isGrReportId(r.reportId)).length;
  return { gr, total: rows.length };
}
