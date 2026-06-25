export type GoogleBackupConfig = {
  enabled: boolean;
  projectId: string;
  datasetId: string;
  serviceAccountEmail: string;
  backupIntervalHours: number;
  retainDays: number;
  tables: string[];
  simulateWhenOffline: boolean;
};

export const DEFAULT_GOOGLE_BACKUP_CONFIG: GoogleBackupConfig = {
  enabled: false,
  projectId: '',
  datasetId: 'roomio_hotel_backup',
  serviceAccountEmail: '',
  backupIntervalHours: 24,
  retainDays: 90,
  tables: ['reservations', 'folios', 'guests', 'invoices', 'audit_log'],
  simulateWhenOffline: true,
};

export type GoogleBackupResult = {
  ok: boolean;
  message: string;
  rowsExported?: number;
  simulated?: boolean;
};
