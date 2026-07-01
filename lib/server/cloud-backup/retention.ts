import { loadCloudBackupConfig } from '@/lib/server/cloud-backup/config';
import { getCloudBackupProvider } from '@/lib/server/cloud-backup/providers';
import type { CloudBackupConfig } from '@/lib/server/cloud-backup/types';
import { prisma } from '@/lib/server/prisma';

function tsFromMs(ms: number): string {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 19);
}

export type RemotePruneResult = {
  ok: boolean;
  removed: number;
  message: string;
  simulated?: boolean;
};

/** Saklama süresini aşan uzak yedekleri gateway üzerinden temizle. */
export async function pruneRemoteBackups(config?: CloudBackupConfig): Promise<RemotePruneResult> {
  const cfg = config ?? (await loadCloudBackupConfig());
  if (cfg.retainRemoteDays <= 0) {
    return { ok: true, removed: 0, message: 'Uzak saklama kapalı' };
  }

  const cutoffMs = Date.now() - cfg.retainRemoteDays * 86_400_000;
  const cutoff = tsFromMs(cutoffMs);

  const stale = await prisma.cloudBackupRun.findMany({
    where: {
      provider: cfg.provider,
      status: 'ok',
      startedAt: { lt: cutoff },
      remotePath: { not: null },
    },
    orderBy: { startedAt: 'asc' },
    take: 200,
  });

  if (stale.length === 0) {
    return { ok: true, removed: 0, message: 'Silinecek uzak yedek yok' };
  }

  const provider = getCloudBackupProvider(cfg.provider);
  if (!provider.pruneRemote) {
    const simulatedOnly = stale.every((r) => r.simulated);
    if (simulatedOnly) {
      for (const row of stale) {
        await prisma.cloudBackupRun.update({
          where: { id: row.id },
          data: { status: 'pruned', remotePath: null, message: 'Simülasyon kaydı temizlendi' },
        });
      }
      return { ok: true, removed: stale.length, message: `${stale.length} simülasyon kaydı arşivlendi`, simulated: true };
    }
    return { ok: true, removed: 0, message: 'Sağlayıcı uzak temizleme desteklemiyor' };
  }

  const result = await provider.pruneRemote(cfg, {
    retainDays: cfg.retainRemoteDays,
    olderThan: new Date(cutoffMs).toISOString(),
    items: stale.map((row) => ({
      runId: row.id,
      remotePath: row.remotePath!,
      startedAt: row.startedAt,
      fileName: row.localPath?.split('/').pop() ?? row.id,
    })),
  });

  if (result.ok && result.removed > 0) {
    const prunedIds = stale.slice(0, result.removed).map((r) => r.id);
    await prisma.cloudBackupRun.updateMany({
      where: { id: { in: prunedIds } },
      data: { status: 'pruned', message: result.message },
    });
  }

  return result;
}
