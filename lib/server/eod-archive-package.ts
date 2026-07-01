import { buildEodLegacyPackage } from '@/lib/reports/eod-legacy-package';
import { buildLegacyRenderContextServer } from '@/lib/server/eod-legacy-context';
import {
  EOD_ARCHIVE_SUPPLEMENT_IDS,
  saveEodArchivePackage,
} from '@/lib/server/eod-gr-snapshot';
import {
  buildNightAuditPackageForDate,
  type NightAuditPackage,
} from '@/lib/server/night-audit-package';
import { formatNightAuditPackageText, nightAuditSnapshotDisplayText } from '@/lib/reports/night-audit-text';

export type EodArchiveManifest = {
  businessDate: string;
  generatedAt: string;
  closedBy: string;
  grReportCount: number;
  supplements: string[];
  totalCount: number;
};

export type EodDayArchiveResult = {
  grCount: number;
  totalCount: number;
  manifest: EodArchiveManifest;
};

export async function archiveEodDayPackage(
  archiveId: string,
  businessDate: string,
  closedBy: string,
  propertyId: string,
): Promise<EodDayArchiveResult> {
  const ctx = await buildLegacyRenderContextServer(propertyId, businessDate, closedBy);
  const grPkg = buildEodLegacyPackage(ctx);
  const nightPkg = await buildNightAuditPackageForDate(propertyId, businessDate);
  const generatedAt = grPkg.generatedAt;

  const manifest: EodArchiveManifest = {
    businessDate,
    generatedAt,
    closedBy,
    grReportCount: grPkg.reportCount,
    supplements: [...EOD_ARCHIVE_SUPPLEMENT_IDS],
    totalCount: grPkg.reportCount + EOD_ARCHIVE_SUPPLEMENT_IDS.length,
  };

  const supplements = [
    { reportId: 'NIGHT-AUDIT', text: JSON.stringify(nightPkg) },
    {
      reportId: 'EOD-MANIFEST',
      text: JSON.stringify(manifest, null, 2),
    },
  ];

  const totalCount = await saveEodArchivePackage(
    archiveId,
    businessDate,
    grPkg,
    supplements,
    propertyId,
  );

  return { grCount: grPkg.reportCount, totalCount, manifest };
}

export function parseNightAuditSnapshot(text: string): NightAuditPackage | null {
  try {
    return JSON.parse(text) as NightAuditPackage;
  } catch {
    return null;
  }
}

export { nightAuditSnapshotDisplayText } from '@/lib/reports/night-audit-text';
