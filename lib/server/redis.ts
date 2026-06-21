type RedisHandle = {
  connect: () => Promise<unknown>;
  ping: () => Promise<string>;
  setEx: (key: string, seconds: number, value: string) => Promise<unknown>;
  get: (key: string) => Promise<string | null>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
};

let client: RedisHandle | null = null;
let connectPromise: Promise<RedisHandle | null> | null = null;

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

export async function getRedis(): Promise<RedisHandle | null> {
  if (!isRedisConfigured()) return null;
  if (client) return client;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      const { createClient } = await import('redis');
      const next = createClient({ url: process.env.REDIS_URL }) as unknown as RedisHandle;
      next.on('error', () => {});
      await next.connect();
      client = next;
      return client;
    } catch {
      client = null;
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export async function pingRedis(): Promise<{ ok: boolean; detail: string }> {
  if (!isRedisConfigured()) return { ok: true, detail: 'disabled' };
  const redis = await getRedis();
  if (!redis) return { ok: false, detail: 'unreachable' };
  try {
    const pong = await redis.ping();
    return { ok: pong === 'PONG', detail: pong };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'ping failed' };
  }
}
