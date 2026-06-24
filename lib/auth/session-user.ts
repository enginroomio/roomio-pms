import type { Role, SessionUser } from '@/lib/auth/roles';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/lib/auth/roles';
import { resolvePermissionsForUser, getGroupPermissionsServer } from '@/lib/server/user-groups';

export function buildSessionUser(id: string, name: string, role: Role): SessionUser {
  return {
    id,
    name,
    role,
    roleLabel: ROLE_LABELS[role],
    permissions: ROLE_PERMISSIONS[role],
  };
}

export async function buildSessionUserFromAuth(
  id: string,
  name: string,
  role: Role,
  groupCode?: string | null,
  propertyId?: string,
): Promise<SessionUser> {
  const groupPerms = groupCode ? await getGroupPermissionsServer(groupCode, propertyId) : [];
  return {
    id,
    name,
    role,
    roleLabel: ROLE_LABELS[role],
    permissions: resolvePermissionsForUser(role, groupPerms),
  };
}
