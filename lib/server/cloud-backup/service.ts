import fs from 'node:fs/promises';
import path from 'node:path';
import { appendAuditLog } from '@/lib/server/audit-log';
import { createBackupBundle, pruneLocalBackups } from '@/lib/server/cloud-backup/bundle';
import { loadCloudBackupConfig } from '@/lib/server/cloud-backup/config';
import {
  isPathUnderAllowedBackupRoot,
  pruneExternalBackups,
} from '@/lib/server/cloud-backup/paths';
import { getCloudBackupProvider, remoteBackupFileName } from '@/lib/server/cloud-backup/providers';
import type {
  CloudBackupConfig,
  CloudBackupHistoryItem,
  CloudBackupResult,
  CloudBackupTrigger,
} from '@/lib/server/cloud-backup/types';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

const AUTOMATED_DEDUP_MINUTES = 30;

function ts(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export async function hasRecentBackupForTrigger(
  propertyId: string,
  trigger: CloudBackupTrigger,
  withinMinutes = AUTOMATED_DEDUP_MINUTES,
): Promise<boolean> {
  const since = new Date(Date.now() - withinMinutes * 60_000).toISOString().replace('T', ' ').slice(0, 19);
  const recent = await prisma.cloudBackupRun.findFirst({
    where: {
      propertyId,
      status: 'ok',
      trigger,
      startedAt: { gte: since },
    },
    orderBy: { startedAt: 'desc' },
  });
  return Boolean(recent);
}

export async function resolveCloudBackupDownload(
  runId: string,
  propertyId?: string,
): Promise<{ path: string; fileName: string } | null> {
  await init();
  const cfg = await loadCloudBackupConfig();
  const row = await prisma.cloudBackupRun.findUnique({ where: { id: runId } });
  if (!row || row.status !== 'ok' || !row.localPath) return null;
  if (propertyId && row.propertyId && row.propertyId !== propertyId) return null;

  const resolved = path.resolve(row.localPath);
  if (!isPathUnderAllowedBackupRoot(resolved, cfg)) return null;

  try {
    await fs.access(resolved);
  } catch {
    return null;
  }

  return { path: resolved, fileName: path.basename(resolved) };
}

export async function testCloudBackupConnection(
  config?: CloudBackupConfig,
): Promise<CloudBackupResult> {
  const cfg = config ?? (await loadCloudBackupConfig());
  if (!cfg.enabled) return { ok: false, message: 'Bulut yedekleme kapalı' };
  const provider = getCloudBackupProvider(cfg.provider);
  const result = await provider.test(cfg);
  return {
    ok: result.ok,
    message: result.message,
    provider: cfg.provider,
    simulated: result.simulated,
  };
}

export async function runCloudBackup(options?: {
  propertyId?: string;
  businessDate?: string;
  user?: string;
  trigger?: CloudBackupTrigger;
  config?: CloudBackupConfig;
}): Promise<CloudBackupResult> {
  await init();
  const cfg = options?.config ?? (await loadCloudBackupConfig());
  const prop = options?.propertyId ?? DEFAULT_PROPERTY_ID;
  const trigger = options?.trigger ?? 'manual';
  const user = options?.user ?? 'Sistem';
  const businessDate = options?.businessDate;

  if (!cfg.enabled && trigger !== 'manual') {
    return { ok: false, message: 'Bulut yedekleme kapalı' };
  }

  const runId = `cbk-${Date.now()}`;
  const startedAt = ts();
  await prisma.cloudBackupRun.create({
    data: {
      id: runId,
      propertyId: prop,
      businessDate: businessDate ?? null,
      provider: cfg.provider,
      status: 'running',
      startedAt,
      includesDatabase: cfg.includeDatabase,
      includesEod: cfg.includeEodSnapshots,
      trigger,
      simulated: false,
    },
  });

  try {
    const bundle = await createBackupBundle({
      propertyId: prop,
      businessDate: options?.businessDate,
      includeDatabase: cfg.includeDatabase,
      includeEod: cfg.includeEodSnapshots,
      userName: user,
    });

    const provider = getCloudBackupProvider(cfg.provider);
    const remoteName = remoteBackupFileName(bundle.archivePath);
    const upload = await provider.upload(cfg, {
      localPath: bundle.archivePath,
      remoteName,
      mimeType: bundle.archivePath.endsWith('.tar.gz') ? 'application/gzip' : 'application/octet-stream',
    });

    if (!upload.ok) {
      await prisma.cloudBackupRun.update({
        where: { id: runId },
        data: {
          status: 'failed',
          finishedAt: ts(),
          localPath: bundle.archivePath,
          sizeBytes: bundle.sizeBytes,
          message: upload.message,
        },
      });
      return { ok: false, message: upload.message, runId, localPath: bundle.archivePath };
    }

    const finishedAt = ts();
    const storedPath = upload.storedPath ?? bundle.archivePath;
    await prisma.cloudBackupRun.update({
      where: { id: runId },
      data: {
        status: 'ok',
        finishedAt,
        localPath: storedPath,
        remotePath: upload.remotePath ?? null,
        sizeBytes: bundle.sizeBytes,
        simulated: Boolean(upload.simulated),
        message: upload.message,
      },
    });

    await pruneLocalBackups(cfg.retainLocalDays);
    await pruneExternalBackups(cfg.retainLocalDays, cfg);

    try {
      const { pruneRemoteBackups } = await import('@/lib/server/cloud-backup/retention');
      await pruneRemoteBackups(cfg);
    } catch {
      // Uzak temizleme yedeklemeyi bloklamamalı
    }

    await appendAuditLog(
      {
        module: 'eod',
        action: 'cloud_backup',
        entityType: 'CloudBackupRun',
        entityId: runId,
        user,
        detail: `${cfg.provider}: ${upload.message} (${bundle.sizeBytes} bayt)`,
        businessDate: options?.businessDate,
      },
      prop,
    );

    return {
      ok: true,
      message: upload.message,
      runId,
      provider: cfg.provider,
      localPath: upload.storedPath ?? bundle.archivePath,
      remotePath: upload.remotePath,
      sizeBytes: bundle.sizeBytes,
      simulated: upload.simulated,
      includesDatabase: cfg.includeDatabase,
      includesEod: cfg.includeEodSnapshots,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yedekleme başarısız';
    await prisma.cloudBackupRun.update({
      where: { id: runId },
      data: { status: 'failed', finishedAt: ts(), message },
    });
    return { ok: false, message, runId };
  }
}

export async function listCloudBackupHistory(limit = 20, propertyId?: string): Promise<CloudBackupHistoryItem[]> {
  await init();
  const rows = await prisma.cloudBackupRun.findMany({
    where: propertyId ? { propertyId } : undefined,
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
  return rows.map((row) => ({
    id: row.id,
    provider: row.provider,
    status: row.status,
    businessDate: row.businessDate,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    localPath: row.localPath,
    remotePath: row.remotePath,
    sizeBytes: row.sizeBytes,
    simulated: row.simulated,
    message: row.message,
    includesDatabase: row.includesDatabase,
    includesEod: row.includesEod,
    trigger: row.trigger,
  }));
}

export async function maybeBackupOnEodClose(
  businessDate: string,
  closedBy: string,
  propertyId?: string,
): Promise<CloudBackupResult | null> {
  const cfg = await loadCloudBackupConfig();
  if (!cfg.enabled || !cfg.backupOnEodClose) return null;
  const prop = propertyId ?? DEFAULT_PROPERTY_ID;
  if (await hasRecentBackupForTrigger(prop, 'eod-close')) {
    return { ok: true, message: 'Son 30 dk içinde gün kapanış yedeği alındı (atlandı)', skipped: true };
  }
  return runCloudBackup({
    propertyId,
    businessDate,
    user: closedBy,
    trigger: 'eod-close',
    config: cfg,
  });
}

/** Günlük GR arşivi kaydedildikten sonra bulut yedek (ayar açıksa). */
export async function maybeBackupAfterDailyArchive(
  businessDate: string,
  user: string,
  propertyId?: string,
): Promise<CloudBackupResult | null> {
  const cfg = await loadCloudBackupConfig();
  if (!cfg.enabled || !cfg.backupAfterDailyArchive) return null;
  const prop = propertyId ?? DEFAULT_PROPERTY_ID;
  if (await hasRecentBackupForTrigger(prop, 'daily-archive')) {
    return { ok: true, message: 'Son 30 dk içinde günlük arşiv yedeği alındı (atlandı)', skipped: true };
  }
  return runCloudBackup({
    propertyId,
    businessDate,
    user,
    trigger: 'daily-archive',
    config: cfg,
  });
}
