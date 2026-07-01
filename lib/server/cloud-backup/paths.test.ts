import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  ensureWritableBackupDir,
  isPathUnderAllowedBackupRoot,
  resolveExternalBackupDir,
} from '@/lib/server/cloud-backup/paths';
import { DEFAULT_CLOUD_BACKUP_CONFIG } from '@/lib/integrations/cloud-backup/types';

test('resolveExternalBackupDir — config ve env', () => {
  const prev = process.env.ROOMIO_BACKUP_DIR;
  process.env.ROOMIO_BACKUP_DIR = '/tmp/roomio-env-backup';
  assert.equal(
    resolveExternalBackupDir({ ...DEFAULT_CLOUD_BACKUP_CONFIG, local: { externalPath: '/Volumes/SanDisk/roomio' } }),
    path.resolve('/Volumes/SanDisk/roomio'),
  );
  assert.equal(
    resolveExternalBackupDir({ ...DEFAULT_CLOUD_BACKUP_CONFIG, local: { externalPath: '' } }),
    path.resolve('/tmp/roomio-env-backup'),
  );
  if (prev === undefined) delete process.env.ROOMIO_BACKUP_DIR;
  else process.env.ROOMIO_BACKUP_DIR = prev;
});

test('isPathUnderAllowedBackupRoot — harici disk yolu', () => {
  const cfg = {
    ...DEFAULT_CLOUD_BACKUP_CONFIG,
    local: { externalPath: '/Volumes/USB/roomio-backups' },
  };
  assert.equal(isPathUnderAllowedBackupRoot('/Volumes/USB/roomio-backups/file.tar.gz', cfg), true);
  assert.equal(isPathUnderAllowedBackupRoot('/etc/passwd', cfg), false);
});

test('ensureWritableBackupDir — yazılabilir klasör', async () => {
  const dir = path.join(os.tmpdir(), `roomio-backup-test-${Date.now()}`);
  const result = await ensureWritableBackupDir(dir);
  assert.equal(result.ok, true);
  await fs.rm(dir, { recursive: true, force: true });
});
