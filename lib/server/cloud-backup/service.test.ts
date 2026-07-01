import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasRecentBackupForTrigger } from '@/lib/server/cloud-backup/service';

describe('cloud-backup dedup', () => {
  it('hasRecentBackupForTrigger false when no runs', async () => {
    const recent = await hasRecentBackupForTrigger('nonexistent-property', 'daily-archive', 30);
    assert.equal(recent, false);
  });
});
