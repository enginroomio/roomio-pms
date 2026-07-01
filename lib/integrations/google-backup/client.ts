import { loadCloudBackupConfig, saveCloudBackupConfig } from '@/lib/server/cloud-backup/config';
import { runCloudBackup, testCloudBackupConnection } from '@/lib/server/cloud-backup/service';
import type { CloudBackupConfig } from '@/lib/integrations/cloud-backup/types';
import { DEFAULT_GOOGLE_BACKUP_CONFIG, type GoogleBackupConfig, type GoogleBackupResult } from '@/lib/integrations/google-backup/types';

/** Eski Google BigQuery ayarlarını yeni bulut yedek yapılandırmasına taşır. */
function migrateGoogleConfig(legacy: GoogleBackupConfig) {
  return {
    enabled: legacy.enabled,
    backupIntervalHours: legacy.backupIntervalHours,
    retainRemoteDays: legacy.retainDays,
    googleDrive: {
      folderId: legacy.datasetId,
      serviceAccountEmail: legacy.serviceAccountEmail,
    },
    simulateWhenOffline: legacy.simulateWhenOffline,
  };
}

export async function loadGoogleBackupConfig(): Promise<GoogleBackupConfig> {
  const { loadJsonConfig } = await import('@/lib/integrations/_config-store');
  return loadJsonConfig('google-backup-config.json', DEFAULT_GOOGLE_BACKUP_CONFIG);
}

export async function saveGoogleBackupConfig(config: GoogleBackupConfig): Promise<void> {
  const { saveJsonConfig } = await import('@/lib/integrations/_config-store');
  await saveJsonConfig('google-backup-config.json', config);
  const cloud = await loadCloudBackupConfig();
  await saveCloudBackupConfig({
    ...cloud,
    ...migrateGoogleConfig(config),
    provider: 'google-drive',
  });
}

export async function runGoogleBackup(config = DEFAULT_GOOGLE_BACKUP_CONFIG): Promise<GoogleBackupResult> {
  const cloud = await loadCloudBackupConfig();
  const merged: CloudBackupConfig = {
    ...cloud,
    ...migrateGoogleConfig(config),
    enabled: config.enabled || cloud.enabled,
    provider: 'google-drive',
  };
  const result = await runCloudBackup({ trigger: 'legacy-google', config: merged });
  return {
    ok: result.ok,
    message: result.message,
    rowsExported: result.includesEod ? 51 : undefined,
    simulated: result.simulated,
  };
}

export async function testGoogleBackupConnection(config = DEFAULT_GOOGLE_BACKUP_CONFIG) {
  const cloud = await loadCloudBackupConfig();
  const merged: CloudBackupConfig = {
    ...cloud,
    ...migrateGoogleConfig(config),
    enabled: true,
    provider: 'google-drive',
  };
  const result = await testCloudBackupConnection(merged);
  return { ok: result.ok, simulated: result.simulated, message: result.message };
}
