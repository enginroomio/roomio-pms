import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildEodLegacyPackageTextBundle } from '@/lib/reports/eod-legacy-package';
import { buildLegacyRenderContextServer } from '@/lib/server/eod-legacy-context';
import { backupsStagingRoot } from '@/lib/server/cloud-backup/paths';
import { listEodGrSnapshotMeta } from '@/lib/server/eod-gr-snapshot';
import { prisma } from '@/lib/server/prisma';
import { getBusinessDate } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import type { BackupBundleManifest } from '@/lib/server/cloud-backup/types';

const execFileAsync = promisify(execFile);

export type BackupBundleInput = {
  propertyId?: string;
  businessDate?: string;
  includeDatabase: boolean;
  includeEod: boolean;
  userName?: string;
};

export type BackupBundle = {
  archivePath: string;
  manifest: BackupBundleManifest;
  sizeBytes: number;
};

function backupsRoot(): string {
  return backupsStagingRoot();
}

function resolveSqlitePath(): string | null {
  const url = process.env.DATABASE_URL ?? '';
  if (!url.startsWith('file:')) return null;
  const raw = url.replace(/^file:/, '');
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function databaseKind(): BackupBundleManifest['databaseUrlKind'] {
  const url = process.env.DATABASE_URL ?? '';
  if (url.startsWith('file:')) return 'sqlite';
  if (url.startsWith('postgres')) return 'postgres';
  return 'unknown';
}

async function checkpointSqlite(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL)');
  } catch {
    // WAL yoksa veya postgres ise atla
  }
}

async function tryTarGz(sourceDir: string, outPath: string): Promise<boolean> {
  try {
    await execFileAsync('tar', ['-czf', outPath, '-C', sourceDir, '.']);
    return true;
  } catch {
    return false;
  }
}

async function tryPgDump(outPath: string): Promise<boolean> {
  const url = process.env.DATABASE_URL ?? '';
  if (!url.startsWith('postgres')) return false;
  try {
    await execFileAsync('pg_dump', ['--format=custom', '--no-owner', '--file', outPath, url], {
      env: process.env,
      timeout: 120_000,
    });
    return true;
  } catch {
    return false;
  }
}

export async function createBackupBundle(input: BackupBundleInput): Promise<BackupBundle> {
  const prop = input.propertyId ?? DEFAULT_PROPERTY_ID;
  const businessDate = input.businessDate ?? (await getBusinessDate(prop));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const workDir = path.join(backupsRoot(), `work-${stamp}`);
  const files: string[] = [];
  await fs.mkdir(workDir, { recursive: true });

  if (input.includeDatabase) {
    const dbPath = resolveSqlitePath();
    if (dbPath) {
      try {
        await fs.access(dbPath);
        await checkpointSqlite();
        const dest = path.join(workDir, 'roomio.db');
        await fs.copyFile(dbPath, dest);
        files.push('roomio.db');
      } catch {
        await fs.writeFile(
          path.join(workDir, 'database-missing.txt'),
          `Veritabanı dosyası bulunamadı: ${dbPath}`,
          'utf8',
        );
        files.push('database-missing.txt');
      }
    } else if (databaseKind() === 'postgres') {
      const dumpPath = path.join(workDir, 'roomio-pg.dump');
      const dumped = await tryPgDump(dumpPath);
      if (dumped) {
        files.push('roomio-pg.dump');
      } else {
        const note = [
          'PostgreSQL ortamı — pg_dump başarısız veya yüklü değil.',
          'Manuel: pg_dump --format=custom --file=roomio.dump $DATABASE_URL',
          `Tarih: ${new Date().toISOString()}`,
        ].join('\n');
        await fs.writeFile(path.join(workDir, 'postgres-readme.txt'), note, 'utf8');
        files.push('postgres-readme.txt');
      }
    }
  }

  if (input.includeEod) {
    const archived = await listEodGrSnapshotMeta(businessDate, prop);
    if (archived.length > 0) {
      const parts: string[] = [];
      for (const meta of archived) {
        const row = await prisma.eodGrSnapshot.findFirst({
          where: { propertyId: prop, businessDate, reportId: meta.reportId },
          select: { text: true, reportId: true },
        });
        parts.push(`### ${meta.reportId}\n${row?.text ?? ''}`);
      }
      await fs.writeFile(path.join(workDir, `eod-gr-${businessDate}.txt`), parts.join('\n\n'), 'utf8');
      files.push(`eod-gr-${businessDate}.txt`);
    } else {
      const ctx = await buildLegacyRenderContextServer(prop, businessDate, input.userName ?? 'Yedek');
      const { buildEodLegacyPackage } = await import('@/lib/reports/eod-legacy-package');
      const pkg = buildEodLegacyPackage(ctx);
      const bundle = buildEodLegacyPackageTextBundle(pkg);
      await fs.writeFile(path.join(workDir, `eod-gr-live-${businessDate}.txt`), bundle, 'utf8');
      files.push(`eod-gr-live-${businessDate}.txt`);
    }
  }

  const manifest: BackupBundleManifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    propertyId: prop,
    businessDate,
    databaseUrlKind: databaseKind(),
    files,
    includesEod: input.includeEod,
  };
  await fs.writeFile(path.join(workDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  files.push('manifest.json');

  const archiveBase = path.join(backupsRoot(), `roomio-backup-${stamp}`);
  const tarPath = `${archiveBase}.tar.gz`;
  const archived = await tryTarGz(workDir, tarPath);
  let archivePath: string;
  if (archived) {
    archivePath = tarPath;
    await fs.rm(workDir, { recursive: true, force: true });
  } else {
    archivePath = workDir;
  }

  const stat = await fs.stat(archivePath);
  return { archivePath, manifest, sizeBytes: stat.size };
}

export async function pruneLocalBackups(retainDays: number): Promise<number> {
  if (retainDays <= 0) return 0;
  const root = backupsRoot();
  await fs.mkdir(root, { recursive: true });
  const cutoff = Date.now() - retainDays * 86_400_000;
  let removed = 0;
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    const stat = await fs.stat(full);
    if (stat.mtimeMs < cutoff) {
      await fs.rm(full, { recursive: true, force: true });
      removed += 1;
    }
  }
  return removed;
}
