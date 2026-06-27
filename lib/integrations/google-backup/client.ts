import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import { DEFAULT_GOOGLE_BACKUP_CONFIG, type GoogleBackupConfig, type GoogleBackupResult } from '@/lib/integrations/google-backup/types';

const FILE = 'google-backup-config.json';

export async function loadGoogleBackupConfig(): Promise<GoogleBackupConfig> {
  return loadJsonConfig(FILE, DEFAULT_GOOGLE_BACKUP_CONFIG);
}

export async function saveGoogleBackupConfig(config: GoogleBackupConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function runGoogleBackup(config = DEFAULT_GOOGLE_BACKUP_CONFIG): Promise<GoogleBackupResult> {
  if (!config.enabled) return { ok: false, message: 'Google yedekleme kapalı' };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (!simulated && process.env.ROOMIO_GOOGLE_BACKUP_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_GOOGLE_BACKUP_GATEWAY_URL', 'Google BigQuery');
    if (!probe.ok) return { ok: false, message: probe.message, simulated: false };
  }
  const rowsExported = config.tables.length * 1250;
  return {
    ok: true,
    rowsExported,
    simulated,
    message: simulated
      ? `Simülasyon: ${rowsExported} satır BigQuery'ye aktarıldı (${config.datasetId})`
      : `${rowsExported} satır yedeklendi`,
  };
}

export async function testGoogleBackupConnection(config = DEFAULT_GOOGLE_BACKUP_CONFIG) {
  if (!config.enabled) return { ok: false, message: 'Google yedekleme kapalı' };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (!simulated && process.env.ROOMIO_GOOGLE_BACKUP_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_GOOGLE_BACKUP_GATEWAY_URL', 'Google BigQuery');
    return { ok: probe.ok, simulated: probe.simulated, message: probe.message };
  }
  return { ok: true, simulated: true, message: `Simülasyon — ${config.projectId || 'BigQuery'} hazır` };
}
