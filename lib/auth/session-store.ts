import { getRedis, isRedisConfigured } from '@/lib/server/redis';

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

export async function registerSession(userId: string, jti: string, expiresIn = '8h'): Promise<void> {
  if (!isRedisConfigured()) return;
  const redis = await getRedis();
  if (!redis) return;
  const ttl = sessionTtlSeconds(expiresIn);
  await redis.setEx(`${SESSION_PREFIX}${userId}:${jti}`, ttl, new Date().toISOString());
}

export async function revokeToken(jti: string, expiresIn = '8h'): Promise<void> {
  if (!isRedisConfigured()) return;
  const redis = await getRedis();
  if (!redis) return;
  await redis.setEx(`${REVOKED_PREFIX}${jti}`, sessionTtlSeconds(expiresIn), '1');
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  if (!isRedisConfigured()) return false;
  const redis = await getRedis();
  if (!redis) return false;
  const value = await redis.get(`${REVOKED_PREFIX}${jti}`);
  return value === '1';
}
