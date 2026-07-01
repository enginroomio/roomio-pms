import { isAuthRequired, DEMO_ROLE_HEADER } from '@/lib/auth/config';
import { getJwtPayloadFromRequest } from '@/lib/auth/request-token';
import { getDemoSession, normalizeRole, type SessionUser } from '@/lib/auth/roles';
import { buildSessionUserFromAuth } from '@/lib/auth/session-user';
import { propertyIdFromRequest } from '@/lib/server/property-context';

function demoRoleFromRequest(req: Request) {
  const header = req.headers.get(DEMO_ROLE_HEADER);
  return header ? normalizeRole(header) : 'fo_manager';
}

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
  if (!isAuthRequired()) return getDemoSession(demoRoleFromRequest(req));
  return null;
}
