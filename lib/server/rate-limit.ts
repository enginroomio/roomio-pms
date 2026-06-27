/**
 * Basit, sabit-pencereli (fixed-window) rate limiter.
 *
 * Redis yapılandırılmışsa (`REDIS_URL`) sayaçları Redis'te tutar — bu,
 * çoklu sunucu instance'ı (örn. Render/Fly'da birden fazla makine) arasında
 * limitin doğru paylaşılmasını sağlar. Redis yoksa (şu anki varsayılan
 * tek-instance/SQLite deploy senaryosu) process-içi bir Map ile fallback
 * yapar — bu, tek instance için yeterli bir korumadır ama instance
 * yeniden başlatıldığında veya birden fazla instance arkasında load
 * balancer varsa sıfırlanır/paylaşılmaz. Üretimde çoklu instance
 * planlanıyorsa REDIS_URL ayarlanmalıdır.
 *
 * Bilinçli olarak basit tutuldu: harici bağımlılık eklemedik, mevcut
 * `lib/server/redis.ts` istemcisini kullanıyoruz.
 */
import { getRedis, isRedisConfigured } from '@/lib/server/redis';

/**
 * Test/CI ortamlarında rate limiting'i devre dışı bırakmak için.
 * Playwright e2e testleri aynı hesaba/IP'ye çok kısa sürede onlarca login
 * isteği gönderebiliyor (her test kendi token'ını alıyor) — bu, gerçek bir
 * saldırı değil, test koşum deseni. Production'da bu env değişkeni
 * ayarlanmamalı; varsayılan davranış limiti her zaman uygular.
 */
function rateLimitDisabled(): boolean {
  return process.env.ROOMIO_DISABLE_RATE_LIMIT === '1';
}

type MemoryEntry = { count: number; resetAt: number };

const memoryStore = new Map<string, MemoryEntry>();

/** Bellek sızıntısını önlemek için süresi geçmiş kayıtları periyodik temizler. */
function pruneMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) memoryStore.delete(key);
  }
}

let lastPrune = 0;

export type RateLimitResult = {
  /** İstek izinli mi? */
  allowed: boolean;
  /** Pencere içinde kalan izin verilen istek sayısı (0 = limit doldu). */
  remaining: number;
  /** Pencerenin sıfırlanacağı Unix saniye damgası (Retry-After hesaplamak için). */
  resetAt: number;
  /** Limiti aşan istek sayısı (loglama/izleme için faydalı). */
  limit: number;
};

/**
 * `key` için sabit pencereli rate limit kontrolü yapar ve sayaçı artırır.
 * Aynı anahtarla `windowSeconds` içinde en fazla `limit` kez `allowed: true`
 * döner.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (rateLimitDisabled()) {
    return { allowed: true, remaining: limit, resetAt: Math.floor(Date.now() / 1000) + windowSeconds, limit };
  }

  if (isRedisConfigured()) {
    const redis = await getRedis();
    if (redis) {
      try {
        const redisKey = `roomio:ratelimit:${key}`;
        const count = await redis.incr(redisKey);
        if (count === 1) {
          // İlk istek bu pencerede — TTL'i şimdi ayarla.
          await redis.expire(redisKey, windowSeconds);
        }
        const resetAt = Math.floor(Date.now() / 1000) + windowSeconds;
        return {
          allowed: count <= limit,
          remaining: Math.max(0, limit - count),
          resetAt,
          limit,
        };
      } catch {
        // Redis çağrısı başarısız oldu (bağlantı koptu vb.) — in-memory'e düş.
      }
    }
  }

  const now = Date.now();
  if (now - lastPrune > 60_000) {
    pruneMemoryStore();
    lastPrune = now;
  }

  const existing = memoryStore.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: 1 <= limit,
      remaining: Math.max(0, limit - 1),
      resetAt: Math.floor(resetAt / 1000),
      limit,
    };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: Math.floor(existing.resetAt / 1000),
    limit,
  };
}

/**
 * İstekten en olası istemci IP'sini çıkarır. `x-forwarded-for` birden fazla
 * IP içerebilir (proxy zinciri) — ilk değer orijinal istemcidir. Hiçbiri
 * yoksa sabit bir değer döner (rate limit tamamen devre dışı kalmasın diye;
 * bu durumda tüm IP'siz istekler aynı kovada birikir, en kötü durumda bile
 * limit hâlâ uygulanır).
 */
export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

/** 429 yanıtı için standart header'ları üretir. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfterSec = Math.max(0, result.resetAt - Math.floor(Date.now() / 1000));
  return {
    'Retry-After': String(retryAfterSec),
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };
}
