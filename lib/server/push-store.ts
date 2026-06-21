import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/server/prisma';

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  role?: string;
  deviceLabel?: string;
  createdAt: string;
  lastSeenAt?: string;
};

const LEGACY_FILE = process.env.ROOMIO_PUSH_STORE
  ?? path.join(process.cwd(), '.roomio-data', 'push-subscriptions.json');

const ONLINE_WINDOW_MS = 3 * 60 * 1000;

type DbPushRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  role: string | null;
  deviceLabel: string | null;
  createdAt: string;
  lastSeenAt: string | null;
};

function toRecord(row: DbPushRow): PushSubscriptionRecord {
  return {
    id: row.id,
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
    role: row.role ?? undefined,
    deviceLabel: row.deviceLabel ?? undefined,
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt ?? undefined,
  };
}

export function isPushSubscriberOnline(lastSeenAt?: string | null, now = Date.now()): boolean {
  if (!lastSeenAt) return false;
  const ts = Date.parse(lastSeenAt);
  if (Number.isNaN(ts)) return false;
  return now - ts <= ONLINE_WINDOW_MS;
}

export type PushSubscriberView = PushSubscriptionRecord & { online: boolean };

export function toSubscriberView(row: DbPushRow, now = Date.now()): PushSubscriberView {
  const record = toRecord(row);
  return { ...record, online: isPushSubscriberOnline(record.lastSeenAt, now) };
}

/** Eski JSON dosyasındaki abonelikleri Postgres/SQLite'a taşır (bir kez). */
export async function migratePushSubscriptionsFromFile(): Promise<number> {
  let raw: string;
  try {
    raw = await fs.readFile(LEGACY_FILE, 'utf8');
  } catch {
    return 0;
  }

  let items: PushSubscriptionRecord[];
  try {
    items = JSON.parse(raw) as PushSubscriptionRecord[];
  } catch {
    return 0;
  }

  if (!Array.isArray(items) || items.length === 0) return 0;

  let migrated = 0;
  const now = new Date().toISOString();
  for (const item of items) {
    if (!item.endpoint || !item.keys?.p256dh || !item.keys?.auth) continue;
    await prisma.pushSubscription.upsert({
      where: { endpoint: item.endpoint },
      create: {
        id: item.id || `ps-${Date.now()}-${migrated}`,
        endpoint: item.endpoint,
        p256dh: item.keys.p256dh,
        auth: item.keys.auth,
        role: item.role ?? null,
        deviceLabel: item.deviceLabel ?? null,
        createdAt: item.createdAt ?? now,
        lastSeenAt: now,
      },
      update: {
        p256dh: item.keys.p256dh,
        auth: item.keys.auth,
        role: item.role ?? null,
        deviceLabel: item.deviceLabel ?? null,
        lastSeenAt: now,
      },
    });
    migrated += 1;
  }

  if (migrated > 0) {
    const backup = `${LEGACY_FILE}.migrated`;
    await fs.rename(LEGACY_FILE, backup).catch(() => undefined);
    console.log(`[push] ${migrated} abonelik dosyadan veritabanına taşındı → ${backup}`);
  }

  return migrated;
}

export async function savePushSubscription(
  input: Omit<PushSubscriptionRecord, 'id' | 'createdAt' | 'lastSeenAt'>,
): Promise<PushSubscriptionRecord> {
  const now = new Date().toISOString();
  const row = await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      id: `ps-${Date.now()}`,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      role: input.role ?? null,
      deviceLabel: input.deviceLabel ?? null,
      createdAt: now,
      lastSeenAt: now,
    },
    update: {
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      role: input.role ?? null,
      deviceLabel: input.deviceLabel ?? null,
      lastSeenAt: now,
    },
  });
  return toRecord(row);
}

export async function touchPushPresence(endpoint: string): Promise<boolean> {
  const result = await prisma.pushSubscription.updateMany({
    where: { endpoint },
    data: { lastSeenAt: new Date().toISOString() },
  });
  return result.count > 0;
}

export async function listPushSubscriptions(role?: string): Promise<PushSubscriptionRecord[]> {
  const rows = await prisma.pushSubscription.findMany({
    where: role ? { role } : undefined,
    orderBy: [{ createdAt: 'desc' }],
  });
  return rows.map(toRecord);
}

export async function listPushSubscriberViews(role?: string): Promise<PushSubscriberView[]> {
  const rows = await prisma.pushSubscription.findMany({
    where: role ? { role } : undefined,
    orderBy: [{ createdAt: 'desc' }],
  });
  return rows.map((row) => toSubscriberView(row));
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function countPushSubscriptions(role?: string): Promise<number> {
  return prisma.pushSubscription.count({ where: role ? { role } : undefined });
}

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}
