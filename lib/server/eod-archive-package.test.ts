import assert from 'node:assert/strict';
import test from 'node:test';
import { archiveEodDayPackage } from '@/lib/server/eod-archive-package';
import { countEodArchiveSnapshots, getEodGrSnapshotText } from '@/lib/server/eod-gr-snapshot';
import { nightAuditSnapshotDisplayText } from '@/lib/reports/night-audit-text';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

test('eod archive package — GR + gece denetim arşivler', async () => {
  await init();
  const archiveId = `arc-pkg-${Date.now()}`;
  const prop = 'prop-sapphire-ist';
  const businessDate = '2026-06-14';

  await prisma.eodArchive.upsert({
    where: { id: archiveId },
    create: {
      id: archiveId,
      propertyId: prop,
      businessDate,
      closedAt: '2026-06-14 23:59',
      closedBy: 'TEST',
      occupancy: 65,
      revenue: 90000,
    },
    update: {},
  });

  const result = await archiveEodDayPackage(archiveId, businessDate, 'TEST', prop);
  assert.equal(result.grCount, 49);
  assert.equal(result.totalCount, 51);

  const counts = await countEodArchiveSnapshots(businessDate, prop);
  assert.equal(counts.gr, 49);
  assert.equal(counts.total, 51);

  const night = await getEodGrSnapshotText(businessDate, 'NIGHT-AUDIT', prop);
  assert.ok(night);
  assert.ok(nightAuditSnapshotDisplayText(night!).includes('GECE DENETİM'));

  const manifest = await getEodGrSnapshotText(businessDate, 'EOD-MANIFEST', prop);
  assert.ok(manifest?.includes('"grReportCount": 49'));

  await prisma.eodGrSnapshot.deleteMany({ where: { archiveId } });
  await prisma.eodArchive.delete({ where: { id: archiveId } });
});
