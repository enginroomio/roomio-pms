import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_CLOUD_BACKUP_CONFIG } from '@/lib/integrations/cloud-backup/types';
import { pruneRemoteBackups } from '@/lib/server/cloud-backup/retention';

describe('cloud-backup retention', () => {
  it('retainRemoteDays=0 skips prune', async () => {
    const result = await pruneRemoteBackups({ ...DEFAULT_CLOUD_BACKUP_CONFIG, retainRemoteDays: 0 });
    assert.equal(result.removed, 0);
    assert.match(result.message, /kapalı/i);
  });

  it('no stale runs returns empty', async () => {
    const result = await pruneRemoteBackups({
      ...DEFAULT_CLOUD_BACKUP_CONFIG,
      enabled: true,
      provider: 'local',
      retainRemoteDays: 90,
    });
    assert.equal(result.removed, 0);
  });
});
