import { syncTcmbDaily } from '@/lib/server/tcmb-daily-sync';
import { readSyncState } from '@/lib/server/tcmb-archive';
import { todayTurkey } from '@/lib/server/tcmb-rates';

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

const CHECK_MS = 30 * 60 * 1000;

async function tick(): Promise<void> {
  const today = todayTurkey();
  const state = readSyncState();
  if (state.lastSyncDay === today) return;

  const result = await syncTcmbDaily({ backfillDays: 3 });
  if (result.ok && !result.skipped) {
    console.log(`[roomio/tcmb] günlük arşiv · ${result.date} · backfill +${result.backfilled ?? 0}`);
  } else if (!result.ok) {
    console.warn('[roomio/tcmb] günlük sync başarısız:', result.error);
  }
}

/** Production/dev sunucuda günlük TCMB arşiv zamanlayıcısı */
export function startTcmbDailyScheduler(): void {
  if (started) return;
  started = true;

  setTimeout(() => {
    void syncTcmbDaily({ backfillDays: 7 }).then((result) => {
      if (result.ok) {
        console.log(`[roomio/tcmb] başlangıç sync · ${result.date ?? 'atlandı'}${result.skipped ? ' (bugün zaten)' : ''}`);
      }
    });
    timer = setInterval(() => void tick(), CHECK_MS);
  }, 45_000);
}

export function stopTcmbDailyScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}
