import fs from 'node:fs/promises';
import path from 'node:path';
import type { CloudBackupConfig } from '@/lib/integrations/cloud-backup/types';

const MAC_SYSTEM_VOLUMES = new Set([
  'Macintosh HD',
  'Macintosh HD - Data',
  'Preboot',
  'Recovery',
  'VM',
  'Update',
  'com.apple.TimeMachine.localsnapshots',
]);

export function roomioDataDir(): string {
  return process.env.ROOMIO_DATA_DIR?.trim() || path.join(process.cwd(), '.roomio-data');
}

/** Geçici paket ve yerel arşiv kökü */
export function backupsStagingRoot(): string {
  return path.join(roomioDataDir(), 'backups');
}

/** Ayar veya ortam değişkeninden harici yedek klasörü (ör. /Volumes/SanDisk/roomio-backups) */
export function resolveExternalBackupDir(config?: CloudBackupConfig): string | null {
  const fromConfig = config?.local?.externalPath?.trim();
  if (fromConfig) return path.resolve(fromConfig);
  const fromEnv = process.env.ROOMIO_BACKUP_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return null;
}

/** İndirme güvenliği ve prune için izin verilen kökler */
export function allowedBackupRoots(config?: CloudBackupConfig): string[] {
  const roots = [path.resolve(backupsStagingRoot())];
  const external = resolveExternalBackupDir(config);
  if (external) roots.push(external);
  return roots;
}

export function isPathUnderAllowedBackupRoot(filePath: string, config?: CloudBackupConfig): boolean {
  const resolved = path.resolve(filePath);
  return allowedBackupRoots(config).some((root) => resolved === root || resolved.startsWith(root + path.sep));
}

export async function ensureWritableBackupDir(dir: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await fs.mkdir(dir, { recursive: true });
    const probe = path.join(dir, `.roomio-write-test-${process.pid}`);
    await fs.writeFile(probe, 'ok', 'utf8');
    await fs.unlink(probe);
    return { ok: true };
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
    if (code === 'EROFS' || code === 'EPERM' || code === 'EACCES') {
      return {
        ok: false,
        message:
          `${dir} yazılamıyor. Mac'te NTFS diskler salt okunurdur; SanDisk'i exFAT veya APFS ile biçimlendirin.`,
      };
    }
    if (code === 'ENOENT') {
      return {
        ok: false,
        message: `${dir} bulunamadı. Harici diskin takılı olduğundan ve yolun doğru olduğundan emin olun.`,
      };
    }
    const msg = err instanceof Error ? err.message : 'Klasör yazılamıyor';
    return { ok: false, message: `${dir}: ${msg}` };
  }
}

export type MountedVolume = {
  name: string;
  path: string;
  suggestedBackupPath: string;
};

/** macOS'ta /Volumes altındaki harici diskleri listeler */
export async function listMountedVolumes(): Promise<MountedVolume[]> {
  if (process.platform !== 'darwin') return [];
  try {
    const entries = await fs.readdir('/Volumes', { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !MAC_SYSTEM_VOLUMES.has(e.name) && !e.name.startsWith('.'))
      .map((e) => ({
        name: e.name,
        path: path.join('/Volumes', e.name),
        suggestedBackupPath: path.join('/Volumes', e.name, 'roomio-backups'),
      }));
  } catch {
    return [];
  }
}

/** Harici diskteki eski yedekleri temizle */
export async function pruneExternalBackups(retainDays: number, config?: CloudBackupConfig): Promise<number> {
  const external = resolveExternalBackupDir(config);
  if (!external || retainDays <= 0) return 0;
  try {
    await fs.access(external);
  } catch {
    return 0;
  }
  const cutoff = Date.now() - retainDays * 86_400_000;
  let removed = 0;
  const entries = await fs.readdir(external, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.name.startsWith('roomio-backup-')) continue;
    const full = path.join(external, entry.name);
    const stat = await fs.stat(full);
    if (stat.mtimeMs < cutoff) {
      await fs.rm(full, { recursive: true, force: true });
      removed += 1;
    }
  }
  return removed;
}
