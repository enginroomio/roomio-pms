import type { Role } from '@/lib/auth/roles';
import { ROLE_LABELS } from '@/lib/auth/roles';
import { validatePassword } from '@/lib/auth/password';
import bcrypt from 'bcryptjs';
import { PROPERTY } from '@/lib/navigation';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { init } from '@/lib/server/pms-store';
import { appendAuditLog } from '@/lib/server/audit-log';

const DEPARTMENT_BY_ROLE: Record<Role, string> = {
  admin: 'IT',
  fo_manager: 'Ön Büro',
  reception: 'Ön Büro',
  hk: 'Kat Hizmetleri',
  accounting: 'Finans',
  viewer: 'Genel',
};

const GROUP_BY_ROLE: Record<Role, string | null> = {
  admin: 'ADM',
  fo_manager: 'FO-MGR',
  reception: 'FO-CLK',
  hk: 'HK',
  accounting: 'FN',
  viewer: null,
};

export type AdminUserRow = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  roleId: string;
  department: string;
  groupCode: string | null;
  active: boolean;
  mustChangePassword: boolean;
};

export async function getAuthSetupStatus(): Promise<{ needsSetup: boolean }> {
  const count = await prisma.user.count();
  return { needsSetup: count === 0 };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function bootstrapFirstAdmin(input: {
  email: string;
  name: string;
  password: string;
  propertyName?: string;
}): Promise<AdminUserRow> {
  const status = await getAuthSetupStatus();
  if (!status.needsSetup) {
    throw new Error('Kurulum zaten tamamlanmış');
  }

  const email = input.email.trim().toLowerCase();
  const err = validatePassword(input.password);
  if (err) throw new Error(err);

  const hash = await hashPassword(input.password);
  const now = new Date().toISOString().slice(0, 10);
  const propId = DEFAULT_PROPERTY_ID;
  const propertyName = input.propertyName?.trim() || 'Otel';

  const propCount = await prisma.property.count();
  if (propCount === 0) {
    await prisma.property.create({
      data: {
        id: propId,
        code: 'MAIN',
        name: propertyName,
        city: null,
        totalRooms: 0,
        isDefault: true,
        createdAt: now,
      },
    });
    await prisma.appState.create({
      data: { propertyId: propId, businessDate: PROPERTY.businessDate },
    });
  }

  const row = await prisma.user.create({
    data: {
      id: `user-admin-${Date.now()}`,
      email,
      name: input.name.trim(),
      role: 'admin',
      passwordHash: hash,
      department: DEPARTMENT_BY_ROLE.admin,
      groupCode: GROUP_BY_ROLE.admin,
      active: true,
      mustChangePassword: false,
    },
  });

  bustReadCaches(propId);
  return toAdminRow(row);
}

export async function changeUserPassword(
  userId: string,
  input: { currentPassword?: string; newPassword: string; force?: boolean },
): Promise<void> {
  await init();
  const row = await prisma.user.findUnique({ where: { id: userId } });
  if (!row) throw new Error('Kullanıcı bulunamadı');

  const err = validatePassword(input.newPassword);
  if (err) throw new Error(err);

  if (!input.force) {
    if (!input.currentPassword) throw new Error('Mevcut şifre gerekli');
    const ok = await bcrypt.compare(input.currentPassword, row.passwordHash);
    if (!ok) throw new Error('Mevcut şifre hatalı');
  }

  const hash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash, mustChangePassword: false },
  });
  bustReadCaches(DEFAULT_PROPERTY_ID);
}

export async function adminResetUserPassword(
  actorId: string,
  targetUserId: string,
  newPassword: string,
  actorName: string,
): Promise<void> {
  await init();
  const err = validatePassword(newPassword);
  if (err) throw new Error(err);

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error('Kullanıcı bulunamadı');

  const hash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: targetUserId },
    data: { passwordHash: hash, mustChangePassword: true },
  });

  await appendAuditLog(
    {
      module: 'settings',
      action: 'password_reset',
      entityType: 'user',
      entityId: targetUserId,
      user: actorName,
      detail: `Şifre sıfırlandı: ${target.email}`,
    },
    DEFAULT_PROPERTY_ID,
  );

  bustReadCaches(DEFAULT_PROPERTY_ID);
  void actorId;
}

export async function createUserAdmin(input: {
  email: string;
  name: string;
  role: Role;
  password: string;
  department?: string;
  groupCode?: string | null;
}): Promise<AdminUserRow> {
  await init();
  const email = input.email.trim().toLowerCase();
  const err = validatePassword(input.password);
  if (err) throw new Error(err);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Bu e-posta zaten kayıtlı');

  const hash = await hashPassword(input.password);
  const row = await prisma.user.create({
    data: {
      id: `user-${Date.now()}`,
      email,
      name: input.name.trim(),
      role: input.role,
      passwordHash: hash,
      department: input.department ?? DEPARTMENT_BY_ROLE[input.role] ?? 'Genel',
      groupCode: input.groupCode ?? GROUP_BY_ROLE[input.role],
      active: true,
      mustChangePassword: true,
    },
  });

  bustReadCaches(DEFAULT_PROPERTY_ID);
  return toAdminRow(row);
}

function toAdminRow(row: {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  groupCode: string | null;
  active: boolean;
  mustChangePassword?: boolean;
}): AdminUserRow {
  const role = row.role as Role;
  return {
    id: row.id,
    email: row.email,
    username: row.email.split('@')[0] ?? row.email,
    fullName: row.name,
    role: ROLE_LABELS[role] ?? row.role,
    roleId: row.role,
    department: row.department ?? DEPARTMENT_BY_ROLE[role] ?? '—',
    groupCode: row.groupCode,
    active: row.active,
    mustChangePassword: row.mustChangePassword ?? false,
  };
}

export async function getUserMustChangePassword(userId: string): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { mustChangePassword: true },
  });
  return row?.mustChangePassword ?? false;
}

export async function seedUserProfilesIfEmpty(): Promise<void> {
  await init();
  const users = await prisma.user.findMany({ where: { department: null } });
  await Promise.all(users.map((u) => {
    const role = u.role as Role;
    return prisma.user.update({
      where: { id: u.id },
      data: {
        department: DEPARTMENT_BY_ROLE[role] ?? 'Genel',
        groupCode: GROUP_BY_ROLE[role],
        active: true,
      },
    });
  }));
}

const VIEWER_DEMO_EMAIL = 'viewer@hotelsapphire.com';
const RECEPTION_DEMO_EMAIL = 'reception@hotelsapphire.com';

export async function ensureViewerDemoUser(): Promise<void> {
  await init();
  const existing = await prisma.user.findUnique({ where: { email: VIEWER_DEMO_EMAIL } });
  if (existing) return;
  const hash = await bcrypt.hash('roomio123', 10);
  await prisma.user.create({
    data: {
      id: 'user-viewer',
      email: VIEWER_DEMO_EMAIL,
      name: 'Deniz Salt',
      role: 'viewer',
      passwordHash: hash,
      department: DEPARTMENT_BY_ROLE.viewer,
      groupCode: GROUP_BY_ROLE.viewer,
      active: true,
    },
  });
}

export async function ensureReceptionDemoUser(): Promise<void> {
  await init();
  const existing = await prisma.user.findUnique({ where: { email: RECEPTION_DEMO_EMAIL } });
  if (existing) return;
  const hash = await bcrypt.hash('roomio123', 10);
  await prisma.user.create({
    data: {
      id: 'user-reception',
      email: RECEPTION_DEMO_EMAIL,
      name: 'Can Demir',
      role: 'reception',
      passwordHash: hash,
      department: DEPARTMENT_BY_ROLE.reception,
      groupCode: GROUP_BY_ROLE.reception,
      active: true,
    },
  });
}

export async function updateUserAdminServer(
  userId: string,
  data: { department?: string; groupCode?: string | null; active?: boolean },
): Promise<AdminUserRow | null> {
  await init();
  const row = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.department != null ? { department: data.department } : {}),
      ...(data.groupCode !== undefined ? { groupCode: data.groupCode } : {}),
      ...(data.active != null ? { active: data.active } : {}),
    },
  });
  bustReadCaches(DEFAULT_PROPERTY_ID);
  return toAdminRow(row);
}
