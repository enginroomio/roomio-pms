import { createHash, randomBytes, createDecipheriv, createCipheriv } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { SyncQueueItem } from '@/lib/sync/types';

const DATA_DIR = process.env.ROOMIO_DATA_DIR ?? path.join(process.cwd(), '.roomio-data');
const SERVER_KEY_ENV = 'ROOMIO_SERVER_KEY';

function getServerKey(): Buffer {
  const env = process.env[SERVER_KEY_ENV];
  if (env && env.length >= 32) return Buffer.from(env.slice(0, 64), 'hex');
  return createHash('sha256').update(`roomio-local-${process.cwd()}`).digest();
}

export async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export function encryptServerBlob(value: unknown): string {
  const key = getServerKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const json = JSON.stringify(value);
  const enc = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: enc.toString('base64'),
    alg: 'AES-256-GCM',
  });
}

export function decryptServerBlob<T>(raw: string): T {
  const key = getServerKey();
  const blob = JSON.parse(raw) as { iv: string; tag: string; data: string };
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(blob.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(blob.tag, 'base64'));
  const dec = Buffer.concat([decipher.update(Buffer.from(blob.data, 'base64')), decipher.final()]);
  return JSON.parse(dec.toString('utf8')) as T;
}

type SyncLog = { items: SyncQueueItem[]; updatedAt: string };

async function readLog(): Promise<SyncLog> {
  await ensureDataDir();
  const file = path.join(DATA_DIR, 'sync-log.enc');
  try {
    const raw = await fs.readFile(file, 'utf8');
    return decryptServerBlob<SyncLog>(raw);
  } catch {
    return { items: [], updatedAt: new Date(0).toISOString() };
  }
}

async function writeLog(log: SyncLog): Promise<void> {
  await ensureDataDir();
  const file = path.join(DATA_DIR, 'sync-log.enc');
  await fs.writeFile(file, encryptServerBlob(log), 'utf8');
}

export async function appendSyncItems(items: SyncQueueItem[]): Promise<string[]> {
  const log = await readLog();
  const accepted: string[] = [];
  for (const item of items) {
    if (log.items.some((x) => x.id === item.id)) continue;
    log.items.push(item);
    accepted.push(item.id);
  }
  log.updatedAt = new Date().toISOString();
  await writeLog(log);
  return accepted;
}

export async function pullSince(since: string, excludeDevice?: string): Promise<{ items: SyncQueueItem[]; serverTime: string }> {
  const log = await readLog();
  const sinceMs = new Date(since).getTime();
  const items = log.items.filter((i) => {
    if (excludeDevice && i.deviceId === excludeDevice) return false;
    return new Date(i.createdAt).getTime() > sinceMs;
  });
  return { items, serverTime: new Date().toISOString() };
}

export async function getServerStats(): Promise<{ totalItems: number; lastUpdate: string; dataDir: string }> {
  const log = await readLog();
  return { totalItems: log.items.length, lastUpdate: log.updatedAt, dataDir: DATA_DIR };
}
