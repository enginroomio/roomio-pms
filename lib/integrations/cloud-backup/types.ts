export type CloudBackupProviderId = 'local' | 'google-drive' | 's3' | 'webhook';

export type CloudBackupGoogleDriveConfig = {
  folderId: string;
  serviceAccountEmail: string;
};

export type CloudBackupS3Config = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix: string;
};

export type CloudBackupWebhookConfig = {
  url: string;
  apiKey: string;
  headerName: string;
};

export type CloudBackupLocalConfig = {
  /** Harici disk yolu — örn. /Volumes/SanDisk/roomio-backups */
  externalPath: string;
};

export type CloudBackupConfig = {
  enabled: boolean;
  provider: CloudBackupProviderId;
  backupIntervalHours: number;
  retainLocalDays: number;
  retainRemoteDays: number;
  includeDatabase: boolean;
  includeEodSnapshots: boolean;
  backupOnEodClose: boolean;
  backupAfterDailyArchive: boolean;
  simulateWhenOffline: boolean;
  local: CloudBackupLocalConfig;
  googleDrive: CloudBackupGoogleDriveConfig;
  s3: CloudBackupS3Config;
  webhook: CloudBackupWebhookConfig;
};

export const DEFAULT_CLOUD_BACKUP_CONFIG: CloudBackupConfig = {
  enabled: false,
  provider: 'local',
  backupIntervalHours: 24,
  retainLocalDays: 14,
  retainRemoteDays: 90,
  includeDatabase: true,
  includeEodSnapshots: true,
  backupOnEodClose: true,
  backupAfterDailyArchive: true,
  simulateWhenOffline: true,
  local: {
    externalPath: '',
  },
  googleDrive: {
    folderId: '',
    serviceAccountEmail: '',
  },
  s3: {
    endpoint: '',
    bucket: '',
    region: 'eu-central-1',
    accessKeyId: '',
    secretAccessKey: '',
    prefix: 'roomio-backups/',
  },
  webhook: {
    url: '',
    apiKey: '',
    headerName: 'Authorization',
  },
};

export type CloudBackupTrigger = 'manual' | 'scheduled' | 'eod-close' | 'daily-archive' | 'legacy-google';

export type CloudBackupResult = {
  ok: boolean;
  message: string;
  runId?: string;
  provider?: CloudBackupProviderId;
  localPath?: string;
  remotePath?: string;
  sizeBytes?: number;
  simulated?: boolean;
  includesDatabase?: boolean;
  includesEod?: boolean;
  skipped?: boolean;
};

export type CloudBackupHistoryItem = {
  id: string;
  provider: string;
  status: string;
  businessDate: string | null;
  startedAt: string;
  finishedAt: string | null;
  localPath: string | null;
  remotePath: string | null;
  sizeBytes: number;
  simulated: boolean;
  message: string | null;
  includesDatabase: boolean;
  includesEod: boolean;
  trigger: string;
};

export type BackupBundleManifest = {
  version: 1;
  createdAt: string;
  propertyId: string | null;
  businessDate: string | null;
  databaseUrlKind: 'sqlite' | 'postgres' | 'unknown';
  files: string[];
  includesEod: boolean;
};
