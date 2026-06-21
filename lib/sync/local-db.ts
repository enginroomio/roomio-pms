/** IndexedDB — internet kesilince veri bu bilgisayarda kalır. */

const DB_NAME = 'roomio-local';
const DB_VERSION = 1;

type StoreName = 'reservations' | 'sync_queue' | 'meta' | 'housekeeping';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('reservations')) db.createObjectStore('reservations', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('sync_queue')) db.createObjectStore('sync_queue', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('housekeeping')) db.createObjectStore('housekeeping', { keyPath: 'id' });
    };
  });
}

async function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const req = fn(s);
    t.oncomplete = () => resolve(req ? (req as IDBRequest<T>).result : undefined);
    t.onerror = () => reject(t.error);
  });
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readonly');
    const req = t.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function put<T extends { id: string }>(store: StoreName, item: T): Promise<void> {
  await tx(store, 'readwrite', (s) => s.put(item));
}

export async function putMeta(key: string, value: unknown): Promise<void> {
  await tx('meta', 'readwrite', (s) => s.put({ key, value }));
}

export async function getMeta<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction('meta', 'readonly');
    const req = t.objectStore('meta').get(key);
    req.onsuccess = () => resolve((req.result?.value as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function removeFromQueue(id: string): Promise<void> {
  await tx('sync_queue', 'readwrite', (s) => s.delete(id));
}

export async function clearQueue(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction('sync_queue', 'readwrite');
    t.objectStore('sync_queue').clear();
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}
