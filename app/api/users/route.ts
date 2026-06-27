import { NextResponse } from 'next/server';
import { ROLE_LABELS, type Role } from '@/lib/auth/roles';
import { listUsers } from '@/lib/server/pms-store';
import { updateUserAdminServer, createUserAdmin, adminResetUserPassword, deleteUserAdmin } from '@/lib/server/users-admin';
import { getUserPropertyIds, userHasAllPropertyAccess } from '@/lib/server/user-properties';
import { requireApiAnyPermission, requireApiPermission } from '@/lib/auth/require-permission';

export const dynamic = 'force-dynamic';

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

export async function GET(req: Request) {
  const auth = await requireApiAnyPermission(req, ['settings.admin', 'identity.read']);
  if (auth instanceof NextResponse) return auth;

  try {
    const rows = await listUsers();
    const users = await Promise.all(rows.map(async (u) => {
      const role = u.role as Role;
      const propertyIds = await getUserPropertyIds(u.id);
      return {
        id: u.id,
        email: u.email,
        username: u.email.split('@')[0] ?? u.email,
        fullName: u.name,
        role: ROLE_LABELS[role] ?? u.role,
        roleId: u.role,
        department: u.department ?? DEPARTMENT_BY_ROLE[role] ?? '—',
        groupCode: u.groupCode ?? GROUP_BY_ROLE[role],
        active: u.active,
        propertyIds,
        allProperties: userHasAllPropertyAccess(u.role),
        lastLoginAt: u.lastLoginAt ?? null,
      };
    }));
    return NextResponse.json({
      ok: true,
      count: users.length,
      users,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kullanıcı listesi alınamadı';
    return NextResponse.json({ ok: false, message, users: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'settings.admin');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    action?: 'update' | 'create' | 'reset-password' | 'delete';
    id?: string;
    department?: string;
    groupCode?: string | null;
    active?: boolean;
    role?: Role;
    propertyIds?: string[];
    email?: string;
    name?: string;
    password?: string;
    newPassword?: string;
  };

  if (body.action === 'delete') {
    if (!body.id) {
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    }
    try {
      await deleteUserAdmin(auth.user.id, body.id, auth.user.name);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kullanıcı silinemedi';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (body.action === 'create') {
    if (!body.email || !body.name || !body.role || !body.password) {
      return NextResponse.json({ error: 'email, name, role, password gerekli' }, { status: 400 });
    }
    try {
      const user = await createUserAdmin({
        email: body.email,
        name: body.name,
        role: body.role,
        password: body.password,
        department: body.department,
        groupCode: body.groupCode,
        propertyIds: body.propertyIds,
      });
      return NextResponse.json({ ok: true, user });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kullanıcı oluşturulamadı';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (body.action === 'reset-password') {
    if (!body.id || !body.newPassword) {
      return NextResponse.json({ error: 'id ve newPassword gerekli' }, { status: 400 });
    }
    try {
      await adminResetUserPassword(auth.user.id, body.id, body.newPassword, auth.user.name);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Şifre sıfırlanamadı';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (!body.id) {
    return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  }
  try {
    const user = await updateUserAdminServer(body.id, {
      department: body.department,
      groupCode: body.groupCode,
      active: body.active,
      role: body.role,
      propertyIds: body.propertyIds,
    });
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }
}
