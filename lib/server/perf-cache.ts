type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

/** Sunucu tarafı kısa TTL önbellek — sık okunan API snapshot'ları */
export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const value = await loader();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function cacheStats(): { size: number; keys: string[] } {
  return { size: store.size, keys: [...store.keys()] };
}

/** Yazma işlemlerinden sonra okuma önbelleğini temizle */
export function bustReadCaches(propertyId: string): void {
  invalidateCache(`reservations:${propertyId}`);
  invalidateCache(`dashboard:${propertyId}`);
  invalidateCache('properties:');
}
