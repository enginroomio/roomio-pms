import { NextResponse } from 'next/server';
import { ROLE_LABELS, type Role } from '@/lib/auth/roles';
import { listUsers } from '@/lib/server/pms-store';

export const dynamic = 'force-dynamic';

const DEPARTMENT_BY_ROLE: Record<Role, string> = {
  admin: 'IT',
  fo_manager: 'Ön Büro',
  reception: 'Ön Büro',
  hk: 'Kat Hizmetleri',
  accounting: 'Finans',
  viewer: 'Genel',
};

export async function GET() {
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
          department: DEPARTMENT_BY_ROLE[role] ?? '—',
          active: true,
        };
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kullanıcı listesi alınamadı';
    return NextResponse.json({ ok: false, message, users: [] }, { status: 500 });
  }
}
