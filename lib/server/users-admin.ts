import type { Role } from '@/lib/auth/roles';
import bcrypt from 'bcryptjs';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { init } from '@/lib/server/pms-store';

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
};

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
  return {
    id: row.id,
    email: row.email,
    username: row.email.split('@')[0] ?? row.email,
    fullName: row.name,
    role: row.role,
    roleId: row.role,
    department: row.department ?? '—',
    groupCode: row.groupCode,
    active: row.active,
  };
}
