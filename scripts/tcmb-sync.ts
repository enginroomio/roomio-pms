#!/usr/bin/env npx tsx
/**
 * TCMB günlük kur arşivi — cron veya manuel:
 *   npm run tcmb:sync
 *   npm run tcmb:sync -- --force
 *   npm run tcmb:sync -- --backfill=30
 */
import { archiveStats } from '../lib/server/tcmb-archive';
import { backfillTcmbArchive, syncTcmbDaily } from '../lib/server/tcmb-daily-sync';

const args = process.argv.slice(2);
const force = args.includes('--force');
const backfillArg = args.find((a) => a.startsWith('--backfill='));
const backfillDays = backfillArg ? Number(backfillArg.split('=')[1]) : 0;

async function main() {
  if (backfillDays > 0) {
    console.log(`[tcmb:sync] son ${backfillDays} gün arşivleniyor…`);
    const result = await backfillTcmbArchive(backfillDays);
    console.log('[tcmb:sync] backfill +', result.added);
  } else {
    console.log('[tcmb:sync] günlük çekim…');
    const result = await syncTcmbDaily({ force, backfillDays: 7 });
    console.log(JSON.stringify(result, null, 2));
  }

  const stats = archiveStats();
  console.log(`[tcmb:sync] arşiv: ${stats.totalDays} gün · son kur: ${stats.lastRateDate ?? '—'}`);
}

main().catch((err) => {
  console.error('[tcmb:sync] hata:', err);
  process.exit(1);
});
