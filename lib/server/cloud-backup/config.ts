import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { DEFAULT_CLOUD_BACKUP_CONFIG, type CloudBackupConfig } from '@/lib/server/cloud-backup/types';

const FILE = 'cloud-backup-config.json';

export async function loadCloudBackupConfig(): Promise<CloudBackupConfig> {
  return loadJsonConfig(FILE, DEFAULT_CLOUD_BACKUP_CONFIG);
}

export async function saveCloudBackupConfig(config: CloudBackupConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}
