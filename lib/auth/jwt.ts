import { isTokenRevoked } from '@/lib/auth/session-store';
import { signToken, verifyTokenEdge, type JwtPayload } from '@/lib/auth/jwt-edge';

export type { JwtPayload } from '@/lib/auth/jwt-edge';
export { signToken } from '@/lib/auth/jwt-edge';

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  const payload = await verifyTokenEdge(token);
  if (!payload) return null;
  if (payload.jti && (await isTokenRevoked(payload.jti))) return null;
  return payload;
}

/** @deprecated use tokenFromRequest from lib/auth/request-token */
export function tokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}
