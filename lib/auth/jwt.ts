import { isTokenRevoked } from '@/lib/auth/session-store';
import { verifyTokenEdge, type JwtPayload } from '@/lib/auth/jwt-edge';
import { isUserActive } from '@/lib/server/users-admin';

export type { JwtPayload } from '@/lib/auth/jwt-edge';
export { signToken } from '@/lib/auth/jwt-edge';

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  const payload = await verifyTokenEdge(token);
  if (!payload) return null;
  if (payload.jti && (await isTokenRevoked(payload.jti))) return null;
  // Kullanıcı pasif yapılmış/silinmişse token'ı reddet. Önceden bu kontrol
  // hiç yapılmıyordu — `updateUserAdminServer` artık `active:false`
  // yapıldığında kayıtlı oturumları geçersiz kılıyor (bkz. session-store.ts),
  // ama bu sadece `registerSession` ile DB/Redis'e yazılmış oturumları
  // kapsar. Bu kontrol, kayıt dışı kalan (örn. eski/legacy) token'lar için
  // de aynı garantiyi sağlayan ikinci bir savunma katmanıdır.
  if (!(await isUserActive(payload.sub))) return null;
  return payload;
}

/** @deprecated use tokenFromRequest from lib/auth/request-token */
export function tokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}
