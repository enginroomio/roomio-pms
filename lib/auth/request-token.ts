import { AUTH_COOKIE } from '@/lib/auth/config';
import { verifyToken, type JwtPayload } from '@/lib/auth/jwt';

export function tokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);

  const cookie = req.headers.get('cookie');
  if (cookie) {
    const parts = cookie.split(';');
    for (const part of parts) {
      const [key, ...rest] = part.trim().split('=');
      if (key === AUTH_COOKIE && rest.length) return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}

export async function getJwtPayloadFromRequest(req: Request): Promise<JwtPayload | null> {
  const token = tokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
