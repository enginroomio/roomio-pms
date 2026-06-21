import fs from 'node:fs/promises';
import path from 'node:path';

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  role?: string;
  deviceLabel?: string;
  createdAt: string;
};

const FILE = process.env.ROOMIO_PUSH_STORE
  ?? path.join(process.cwd(), '.roomio-data', 'push-subscriptions.json');

async function readAll(): Promise<PushSubscriptionRecord[]> {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return JSON.parse(raw) as PushSubscriptionRecord[];
  } catch {
    return [];
  }
}

async function writeAll(items: PushSubscriptionRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(items, null, 2), 'utf8');
}

export async function savePushSubscription(input: Omit<PushSubscriptionRecord, 'id' | 'createdAt'>): Promise<PushSubscriptionRecord> {
  const items = await readAll();
  const existing = items.find((x) => x.endpoint === input.endpoint);
  if (existing) {
    Object.assign(existing, input);
    await writeAll(items);
    return existing;
  }
  const record: PushSubscriptionRecord = {
    ...input,
    id: `ps-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  items.push(record);
  await writeAll(items);
  return record;
}

export async function listPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  return readAll();
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const items = await readAll();
  await writeAll(items.filter((x) => x.endpoint !== endpoint));
}

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}
