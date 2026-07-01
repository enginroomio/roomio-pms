import { loadCloudBackupConfig } from '@/lib/server/cloud-backup/config';
import { pruneRemoteBackups } from '@/lib/server/cloud-backup/retention';
import { runCloudBackup } from '@/lib/server/cloud-backup/service';
import { prisma } from '@/lib/server/prisma';

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

const CHECK_MS = 30 * 60 * 1000;

async function tick(): Promise<void> {
  const cfg = await loadCloudBackupConfig();
  if (!cfg.enabled || cfg.backupIntervalHours <= 0) return;

  const since = new Date(Date.now() - cfg.backupIntervalHours * 3_600_000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);
  const recent = await prisma.cloudBackupRun.findFirst({
    where: { status: 'ok', startedAt: { gte: since } },
    orderBy: { startedAt: 'desc' },
  });
  if (recent) return;

  const result = await runCloudBackup({ trigger: 'scheduled', user: 'Zamanlayıcı' });
  if (result.ok) {
    console.log(`[roomio/backup] zamanlanmış yedek · ${result.provider} · ${result.sizeBytes ?? 0} bayt`);
  }

  try {
    const pruned = await pruneRemoteBackups(cfg);
    if (pruned.removed > 0) {
      console.log(`[roomio/backup] uzak temizlik · ${pruned.removed} · ${pruned.message}`);
    }
  } catch {
    // Zamanlayıcı devam etsin
  }
}

export function startCloudBackupScheduler(): void {
  if (started || process.argv.includes('--test')) return;
  started = true;

  setTimeout(() => {
    void tick();
    timer = setInterval(() => void tick(), CHECK_MS);
  }, 90_000);
}

export function stopCloudBackupScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}
