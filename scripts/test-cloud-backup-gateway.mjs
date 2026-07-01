#!/usr/bin/env node
/**
 * Referans gateway upload + prune smoke testi (Roomio sunucusu gerekmez).
 * Kullanım: node scripts/test-cloud-backup-gateway.mjs
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.ROOMIO_BACKUP_GATEWAY_PORT ?? 3922);
const STORE = path.join(process.cwd(), '.roomio-data', 'gateway-backups-test');

function startGateway() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['scripts/cloud-backup-gateway-reference.mjs'],
      {
        env: {
          ...process.env,
          ROOMIO_BACKUP_GATEWAY_PORT: String(PORT),
          ROOMIO_BACKUP_GATEWAY_STORE: STORE,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let ready = false;
    const timer = setTimeout(() => {
      if (!ready) {
        child.kill();
        reject(new Error('gateway timeout'));
      }
    }, 10_000);
    child.stdout?.on('data', (buf) => {
      if (String(buf).includes(String(PORT))) {
        ready = true;
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (!ready) reject(new Error(`gateway exit ${code}`));
    });
  });
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  await fs.rm(STORE, { recursive: true, force: true }).catch(() => undefined);
  const gateway = await startGateway();
  const base = `http://127.0.0.1:${PORT}`;
  const fileName = `smoke-${Date.now()}.tar.gz`;
  const payload = Buffer.from('roomio-gateway-smoke').toString('base64');

  try {
    const upload = await postJson(base, {
      provider: 'google-drive',
      fileName,
      mimeType: 'application/gzip',
      contentBase64: payload,
    });
    if (!upload.ok || !upload.data.remotePath) {
      throw new Error(`upload failed: ${upload.status}`);
    }

    const stored = await fs.readFile(path.join(STORE, fileName), 'utf8');
    if (stored !== 'roomio-gateway-smoke') {
      throw new Error('stored content mismatch');
    }

    const prune = await postJson(base, {
      action: 'prune',
      provider: 'google-drive',
      retainDays: 0,
      olderThan: new Date().toISOString(),
      items: [{ runId: 'smoke-1', remotePath: upload.data.remotePath, fileName, startedAt: '2000-01-01 00:00:00' }],
    });
    if (!prune.ok || (prune.data.removed ?? 0) < 1) {
      throw new Error(`prune failed: ${prune.status}`);
    }

    console.log('✓ gateway upload');
    console.log('✓ gateway prune');
    console.log('\n2/2 geçti');
    process.exit(0);
  } finally {
    gateway.kill();
    await fs.rm(STORE, { recursive: true, force: true }).catch(() => undefined);
  }
}

main().catch((err) => {
  console.error('✗', err instanceof Error ? err.message : err);
  process.exit(1);
});
