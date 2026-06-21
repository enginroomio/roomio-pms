'use client';

import { DEMO_RESERVATIONS } from '@/lib/data/reservations';
import { DEMO_HK_TASKS, DEMO_ROOM_STATUSES } from '@/lib/data/housekeeping';
import type { Reservation } from '@/lib/types/reservation';
import { checksum, encryptPayload } from '@/lib/sync/crypto-client';
import * as db from '@/lib/sync/local-db';
import type { SyncMeta, SyncQueueItem } from '@/lib/sync/types';

const DEVICE_KEY = 'roomio_device_id';
const LAST_SYNC_KEY = 'lastSyncAt';
const FORCE_OFFLINE_KEY = 'roomio_force_offline';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `dev-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function isForceOffline(): boolean {
  return localStorage.getItem(FORCE_OFFLINE_KEY) === '1';
}

export function setForceOffline(value: boolean): void {
  localStorage.setItem(FORCE_OFFLINE_KEY, value ? '1' : '0');
  window.dispatchEvent(new Event('roomio-sync-status'));
}

export function isOnline(): boolean {
  if (isForceOffline()) return false;
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export async function seedLocalDbIfEmpty(): Promise<void> {
  const existing = await db.getAll<Reservation>('reservations');
  if (existing.length === 0) {
    for (const r of DEMO_RESERVATIONS) {
      const enc = await encryptPayload({ email: r.email, phone: r.phone });
      await db.put('reservations', { ...r, _pii: enc });
    }
    for (const room of DEMO_ROOM_STATUSES) await db.put('housekeeping', room);
    for (const task of DEMO_HK_TASKS) await db.put('housekeeping', task);
    await db.putMeta('seeded', true);
  }
}

export async function getSyncMeta(): Promise<SyncMeta> {
  const queue = await db.getAll<SyncQueueItem>('sync_queue');
  const lastSyncAt = await db.getMeta<string>(LAST_SYNC_KEY);
  return {
    deviceId: getDeviceId(),
    lastSyncAt,
    pendingCount: queue.length,
    mode: isOnline() ? 'cloud' : 'offline',
    encryptionEnabled: true,
  };
}

export async function enqueueSync(item: Omit<SyncQueueItem, 'id' | 'deviceId' | 'checksum' | 'createdAt'>): Promise<void> {
  const payload = item.payload;
  const cs = await checksum(payload);
  const entry: SyncQueueItem = {
    ...item,
    id: `sq-${crypto.randomUUID().slice(0, 12)}`,
    deviceId: getDeviceId(),
    checksum: cs,
    createdAt: new Date().toISOString(),
  };
  await db.put('sync_queue', entry);
  window.dispatchEvent(new Event('roomio-sync-status'));
  if (isOnline()) void runSync();
}

export async function runSync(): Promise<{ ok: boolean; pushed: number; pulled: number; error?: string }> {
  if (!isOnline()) return { ok: false, pushed: 0, pulled: 0, error: 'offline' };

  const deviceId = getDeviceId();
  const queue = await db.getAll<SyncQueueItem>('sync_queue');
  let pushed = 0;
  let pulled = 0;

  try {
    if (queue.length > 0) {
      const encItems = await Promise.all(
        queue.map(async (item) => ({
          ...item,
          payload: await encryptPayload(item.payload),
        })),
      );
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, items: encItems }),
      });
      if (!res.ok) throw new Error(`push ${res.status}`);
      const body = (await res.json()) as { accepted: string[] };
      for (const id of body.accepted) await db.removeFromQueue(id);
      pushed = body.accepted.length;
    }

    const since = (await db.getMeta<string>(LAST_SYNC_KEY)) ?? '1970-01-01T00:00:00.000Z';
    const pullRes = await fetch(`/api/sync/pull?deviceId=${encodeURIComponent(deviceId)}&since=${encodeURIComponent(since)}`);
    if (!pullRes.ok) throw new Error(`pull ${pullRes.status}`);
    const pullBody = (await pullRes.json()) as { items: SyncQueueItem[]; serverTime: string };
    pulled = pullBody.items.length;
    await db.putMeta(LAST_SYNC_KEY, pullBody.serverTime);
    window.dispatchEvent(new Event('roomio-sync-status'));
    return { ok: true, pushed, pulled };
  } catch (e) {
    return { ok: false, pushed, pulled, error: e instanceof Error ? e.message : 'sync failed' };
  }
}
