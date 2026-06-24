import { isAuthRequired } from '@/lib/auth/config';
import { getJwtPayloadFromRequest } from '@/lib/auth/request-token';
import { getDemoSession, type SessionUser } from '@/lib/auth/roles';
import { buildSessionUserFromAuth } from '@/lib/auth/session-user';
import { propertyIdFromRequest } from '@/lib/server/property-context';

/** API rotaları — JWT veya geliştirme demo oturumu */
export async function resolveApiUser(req: Request): Promise<SessionUser | null> {
  const payload = await getJwtPayloadFromRequest(req);
  if (payload) {
    const propertyId = propertyIdFromRequest(req);
    return buildSessionUserFromAuth(
      payload.sub,
      payload.name,
      payload.role,
      payload.groupCode,
      propertyId,
    );
  }
  if (!isAuthRequired()) return getDemoSession('fo_manager');
  return null;
}
