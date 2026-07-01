import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createBackupBundle } from '@/lib/server/cloud-backup/bundle';

test('cloud backup bundle — sqlite + manifest oluşturur', async () => {
  const businessDate = '2099-03-01';
  const bundle = await createBackupBundle({
    propertyId: 'prop-sapphire-ist',
    businessDate,
    includeDatabase: true,
    includeEod: false,
    userName: 'TEST',
  });

  assert.ok(bundle.archivePath);
  assert.ok(bundle.sizeBytes > 0);
  assert.equal(bundle.manifest.businessDate, businessDate);
  assert.ok(bundle.manifest.files.includes('roomio.db') || bundle.manifest.files.includes('database-missing.txt'));
});
