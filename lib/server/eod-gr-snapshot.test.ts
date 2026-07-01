import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_RESERVATIONS } from '@/lib/data/reservations';
import { buildEodLegacyPackage } from '@/lib/reports/eod-legacy-package';
import {
  getEodGrSnapshotText,
  hasEodGrSnapshots,
  listEodGrSnapshotMeta,
  saveEodGrSnapshots,
} from '@/lib/server/eod-gr-snapshot';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

const ctx = {
  hotelName: 'HOTELSAPPHIRE',
  businessDate: '2026-06-15',
  userName: 'TEST',
  generatedAt: new Date('2026-06-16T03:00:00'),
  reservations: DEMO_RESERVATIONS,
  folioBalances: { 'rez-13': 4200 },
};

test('gr snapshot — kaydet ve geri yükle', async () => {
  await init();
  const archiveId = `arc-test-${Date.now()}`;
  const prop = 'prop-sapphire-ist';
  const businessDate = '2026-06-15';

  await prisma.eodArchive.upsert({
    where: { id: archiveId },
    create: {
      id: archiveId,
      propertyId: prop,
      businessDate,
      closedAt: '2026-06-15 23:59',
      closedBy: 'TEST',
      occupancy: 70,
      revenue: 100000,
    },
    update: {},
  });

  const pkg = buildEodLegacyPackage(ctx);
  const saved = await saveEodGrSnapshots(archiveId, businessDate, pkg, prop);
  assert.equal(saved, 49);

  const has = await hasEodGrSnapshots(businessDate, prop);
  assert.equal(has, true);

  const gr400 = await getEodGrSnapshotText(businessDate, 'GR400', prop);
  assert.ok(gr400);
  assert.equal(gr400, pkg.texts.GR400);

  const metas = await listEodGrSnapshotMeta(businessDate, prop);
  assert.equal(metas.length, 49);
  assert.ok(metas.some((m) => m.reportId === 'GR300'));

  await prisma.eodGrSnapshot.deleteMany({ where: { archiveId } });
  await prisma.eodArchive.delete({ where: { id: archiveId } });
});
