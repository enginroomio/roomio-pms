import type { Permission, Role } from '@/lib/auth/roles';
import { ROLE_PERMISSIONS } from '@/lib/auth/roles';
import { USER_GROUPS } from '@/lib/data/kurulus';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type UserGroupRow = {
  id: string;
  code: string;
  name: string;
  userCount: number;
  description?: string;
  permissions: Permission[];
  active: boolean;
};

export const GROUP_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  ADM: ROLE_PERMISSIONS.admin,
  'FO-MGR': ROLE_PERMISSIONS.fo_manager,
  'FO-CLK': ROLE_PERMISSIONS.reception,
  HK: ROLE_PERMISSIONS.hk,
  FN: ROLE_PERMISSIONS.accounting,
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

export function permissionsFromGroupJson(raw: string | null | undefined): Permission[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((p): p is Permission => typeof p === 'string');
  } catch {
    return [];
  }
  return [];
}

export function resolvePermissionsForUser(
  role: Role,
  groupPermissions: Permission[],
): Permission[] {
  if (groupPermissions.length === 0) return ROLE_PERMISSIONS[role] ?? [];
  return [...new Set([...ROLE_PERMISSIONS[role], ...groupPermissions])];
}

function mapRow(r: {
  id: string;
  code: string;
  name: string;
  userCount: number;
  description: string | null;
  permissions: string | null;
  active: boolean;
}): UserGroupRow {
  const perms = permissionsFromGroupJson(r.permissions);
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    userCount: r.userCount,
    description: r.description ?? undefined,
    permissions: perms.length ? perms : GROUP_DEFAULT_PERMISSIONS[r.code] ?? [],
    active: r.active,
  };
}

export async function seedUserGroupsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.userGroup.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.userGroup.createMany({
    data: USER_GROUPS.map((g) => ({
      id: `ug-${prop}-${g.code}`,
      propertyId: prop,
      code: g.code,
      name: g.name,
      userCount: g.users,
      description: null,
      permissions: JSON.stringify(GROUP_DEFAULT_PERMISSIONS[g.code] ?? []),
      active: true,
    })),
  });
}

export async function getUserGroupsServer(propertyId?: string): Promise<UserGroupRow[]> {
  await init();
  await seedUserGroupsIfEmpty(propertyId);
  const rows = await prisma.userGroup.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { code: 'asc' },
  });
  return rows.map(mapRow);
}

export async function migrateUserGroupPermissions(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const rows = await prisma.userGroup.findMany({
    where: {
      propertyId: prop,
      OR: [{ permissions: null }, { permissions: '' }],
    },
  });
  await Promise.all(rows.map((g) => prisma.userGroup.update({
    where: { id: g.id },
    data: { permissions: JSON.stringify(GROUP_DEFAULT_PERMISSIONS[g.code] ?? []) },
  })));
}

/** Mevcut gruplara ROLE_DEFAULTS'tan eksik izinleri ekler (ör. identity.read). */
export async function syncUserGroupDefaultPermissions(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const rows = await prisma.userGroup.findMany({ where: { propertyId: prop } });
  const updates = rows.map((g) => {
    const current = permissionsFromGroupJson(g.permissions);
    const defaults = GROUP_DEFAULT_PERMISSIONS[g.code] ?? [];
    if (!defaults.length) return null;
    const merged = [...new Set([...current, ...defaults])];
    if (merged.length === current.length) return null;
    return prisma.userGroup.update({
      where: { id: g.id },
      data: { permissions: JSON.stringify(merged) },
    });
  }).filter(Boolean);
  if (updates.length) {
    await Promise.all(updates);
    bustReadCaches(prop);
  }
}

export async function saveUserGroupServer(
  data: Omit<UserGroupRow, 'id'> & { id?: string },
  propertyId?: string,
): Promise<UserGroupRow> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `ug-${prop}-${data.code}`;
  const row = await prisma.userGroup.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      userCount: data.userCount,
      description: data.description ?? null,
      permissions: JSON.stringify(data.permissions ?? []),
      active: data.active,
    },
    update: {
      name: data.name,
      userCount: data.userCount,
      description: data.description ?? null,
      permissions: JSON.stringify(data.permissions ?? []),
      active: data.active,
    },
  });
  bustReadCaches(prop);
  return mapRow(row);
}

export async function getGroupPermissionsServer(
  groupCode: string,
  propertyId?: string,
): Promise<Permission[]> {
  const groups = await getUserGroupsServer(propertyId);
  const group = groups.find((g) => g.code === groupCode);
  return group?.permissions ?? [];
}
