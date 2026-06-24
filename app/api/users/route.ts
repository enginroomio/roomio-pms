import { NextResponse } from 'next/server';
import { ROLE_LABELS, type Role } from '@/lib/auth/roles';
import { listUsers } from '@/lib/server/pms-store';
import { updateUserAdminServer } from '@/lib/server/users-admin';
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
    return NextResponse.json({
      ok: true,
      count: rows.length,
      users: rows.map((u) => {
        const role = u.role as Role;
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
        };
      }),
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
    id?: string;
    department?: string;
    groupCode?: string | null;
    active?: boolean;
  };
  if (!body.id) {
    return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  }
  try {
    const user = await updateUserAdminServer(body.id, {
      department: body.department,
      groupCode: body.groupCode,
      active: body.active,
    });
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }
}
