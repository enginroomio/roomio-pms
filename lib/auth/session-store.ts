import { getRedis, isRedisConfigured } from '@/lib/server/redis';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

const REVOKED_PREFIX = 'roomio:jwt:revoked:';
const SESSION_PREFIX = 'roomio:session:';

function sessionTtlSeconds(expiresIn = '8h'): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) return 8 * 3600;
  const value = Number(match[1]);
  const unit = match[2];
  if (unit === 's') return value;
  if (unit === 'm') return value * 60;
  if (unit === 'h') return value * 3600;
  return value * 86400;
}

/**
 * Süresi geçmiş kayıtları DB'den temizler. Redis'te TTL otomatik yapardı;
 * DB fallback'inde bunu elle yapmamız gerekiyor. Her çağrıda tüm tabloyu
 * taramak maliyetli olabileceğinden, bu yalnızca yazma işlemlerinde
 * (register/revoke) tetiklenir ve best-effort'tur — başarısız olursa
 * sessizce yutulur (temizlik gecikse de doğruluk bozulmaz, sadece tablo
 * büyür).
 */
async function cleanupExpiredDbRecords(): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all([
    prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined),
    prisma.userSession.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined),
  ]);
}

export async function registerSession(userId: string, jti: string, expiresIn = '8h'): Promise<void> {
  if (isRedisConfigured()) {
    const redis = await getRedis();
    if (redis) {
      const ttl = sessionTtlSeconds(expiresIn);
      await redis.setEx(`${SESSION_PREFIX}${userId}:${jti}`, ttl, new Date().toISOString());
      return;
    }
  }
  // DB fallback (Redis yapılandırılmamış veya bağlantı başarısız).
  await init();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionTtlSeconds(expiresIn) * 1000);
  await prisma.userSession.create({
    data: {
      userId,
      jti,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  }).catch(() => undefined); // jti zaten varsa (çok düşük olasılık) sessizce geç
  void cleanupExpiredDbRecords();
}

export async function revokeToken(jti: string, expiresIn = '8h'): Promise<void> {
  if (isRedisConfigured()) {
    const redis = await getRedis();
    if (redis) {
      await redis.setEx(`${REVOKED_PREFIX}${jti}`, sessionTtlSeconds(expiresIn), '1');
      return;
    }
  }
  await init();
  const expiresAt = new Date(Date.now() + sessionTtlSeconds(expiresIn) * 1000);
  await prisma.revokedToken.upsert({
    where: { jti },
    create: { jti, expiresAt: expiresAt.toISOString() },
    update: { expiresAt: expiresAt.toISOString() },
  }).catch(() => undefined);
  void cleanupExpiredDbRecords();
}

export async function revokeAllUserSessions(userId: string, exceptJti?: string): Promise<number> {
  if (isRedisConfigured()) {
    const redis = await getRedis();
    if (redis) {
      const pattern = `${SESSION_PREFIX}${userId}:*`;
      const keys = await redis.keys(pattern);
      let count = 0;
      for (const key of keys) {
        const jti = key.slice(`${SESSION_PREFIX}${userId}:`.length);
        if (exceptJti && jti === exceptJti) continue;
        await redis.del(key);
        await revokeToken(jti);
        count += 1;
      }
      return count;
    }
  }
  await init();
  const sessions = await prisma.userSession.findMany({ where: { userId }, select: { jti: true } });
  let count = 0;
  for (const { jti } of sessions) {
    if (exceptJti && jti === exceptJti) continue;
    await prisma.userSession.deleteMany({ where: { userId, jti } }).catch(() => undefined);
    await revokeToken(jti);
    count += 1;
  }
  return count;
}

export type UserSessionRow = {
  jti: string;
  startedAt: string;
};

export async function listUserSessions(userId: string): Promise<UserSessionRow[]> {
  if (isRedisConfigured()) {
    const redis = await getRedis();
    if (redis) {
      const keys = await redis.keys(`${SESSION_PREFIX}${userId}:*`);
      const rows: UserSessionRow[] = [];
      for (const key of keys) {
        const jti = key.slice(`${SESSION_PREFIX}${userId}:`.length);
        const startedAt = (await redis.get(key)) ?? '';
        rows.push({ jti, startedAt });
      }
      return rows.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    }
  }
  await init();
  const sessions = await prisma.userSession.findMany({
    where: { userId },
    select: { jti: true, startedAt: true },
    orderBy: { startedAt: 'desc' },
  });
  return sessions;
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  if (isRedisConfigured()) {
    const redis = await getRedis();
    if (redis) {
      const value = await redis.get(`${REVOKED_PREFIX}${jti}`);
      return value === '1';
    }
  }
  await init();
  const row = await prisma.revokedToken.findUnique({ where: { jti } }).catch(() => null);
  if (!row) return false;
  return new Date(row.expiresAt).getTime() > Date.now();
}
