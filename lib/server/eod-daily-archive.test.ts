import assert from 'node:assert/strict';
import test from 'node:test';
import { dailyArchiveId, saveDailyEodArchive } from '@/lib/server/eod-daily-archive';
import { countEodArchiveSnapshots, hasEodGrSnapshots } from '@/lib/server/eod-gr-snapshot';
import { prisma } from '@/lib/server/prisma';

test('daily eod archive — açık gün DB snapshot', async () => {
  const prop = 'prop-sapphire-ist';
  const businessDate = `2099-02-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;

  await prisma.eodGrSnapshot.deleteMany({ where: { propertyId: prop, businessDate } });
  await prisma.eodArchive.deleteMany({ where: { propertyId: prop, businessDate } });

  const result = await saveDailyEodArchive(businessDate, 'TEST', prop);
  assert.equal(result.grCount, 49);
  assert.equal(result.totalCount, 51);
  assert.equal(result.status, 'open');
  assert.equal(result.archiveId, dailyArchiveId(prop, businessDate));

  assert.equal(await hasEodGrSnapshots(businessDate, prop), true);
  const counts = await countEodArchiveSnapshots(businessDate, prop);
  assert.equal(counts.gr, 49);
  assert.equal(counts.total, 51);

  const row = await prisma.eodArchive.findUnique({
    where: { propertyId_businessDate: { propertyId: prop, businessDate } },
  });
  assert.equal(row?.status, 'open');
  assert.equal(row?.reportCount, 51);

  await prisma.eodGrSnapshot.deleteMany({ where: { propertyId: prop, businessDate } });
  await prisma.eodArchive.deleteMany({ where: { propertyId: prop, businessDate } });
});
