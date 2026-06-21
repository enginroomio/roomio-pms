export type SyncEntity = 'reservation' | 'housekeeping' | 'audit' | 'consent' | 'review';

export type SyncOperation = 'create' | 'update' | 'delete';

export type SyncQueueItem = {
  id: string;
  entity: SyncEntity;
  operation: SyncOperation;
  entityId: string;
  payload: unknown;
  createdAt: string;
  deviceId: string;
  checksum: string;
};

export type SyncPushRequest = {
  deviceId: string;
  items: SyncQueueItem[];
};

export type SyncPullResponse = {
  since: string;
  items: SyncQueueItem[];
  serverTime: string;
};

export type SyncMeta = {
  deviceId: string;
  lastSyncAt: string | null;
  pendingCount: number;
  mode: 'local-server' | 'cloud' | 'offline';
  encryptionEnabled: boolean;
};

export type EncryptedBlob = {
  iv: string;
  tag: string;
  data: string;
  alg: 'AES-256-GCM';
  keyId: string;
};
