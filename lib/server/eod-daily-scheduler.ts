import { runDailyEodArchiveAllProperties } from '@/lib/server/eod-daily-archive';

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

const CHECK_MS = 30 * 60 * 1000;

async function tick(): Promise<void> {
  const result = await runDailyEodArchiveAllProperties('Gün Sonu Zamanlayıcı');
  if (result.archived > 0) {
    console.log(`[roomio/eod] günlük arşiv · ${result.archived} şube · atlandı ${result.skipped}`);
  }
}

/** Açık iş günü gün sonu raporlarını periyodik olarak DB'ye arşivler. */
export function startEodDailyArchiveScheduler(): void {
  if (started || process.argv.includes('--test')) return;
  started = true;

  setTimeout(() => {
    void runDailyEodArchiveAllProperties('Başlangıç').then((result) => {
      if (result.archived > 0) {
        console.log(`[roomio/eod] başlangıç arşiv · ${result.archived} şube`);
      }
    });
    timer = setInterval(() => void tick(), CHECK_MS);
  }, 60_000);
}

export function stopEodDailyArchiveScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}
