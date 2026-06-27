import type { Role, SessionUser } from '@/lib/auth/roles';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/lib/auth/roles';
import { resolvePermissionsForUser, getGroupPermissionsServer } from '@/lib/server/user-groups';
import { getUserPropertyAccessSummary } from '@/lib/server/user-properties';

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
  const [groupPerms, access] = await Promise.all([
    groupCode
      ? getGroupPermissionsServer(groupCode, propertyId)
      : Promise.resolve({ added: [], excluded: [] }),
    getUserPropertyAccessSummary(id, role),
  ]);
  return {
    id,
    name,
    role,
    roleLabel: ROLE_LABELS[role],
    permissions: resolvePermissionsForUser(role, groupPerms.added, groupPerms.excluded),
    accessiblePropertyIds: access.accessiblePropertyIds,
    hasAllPropertyAccess: access.hasAllPropertyAccess,
  };
}
