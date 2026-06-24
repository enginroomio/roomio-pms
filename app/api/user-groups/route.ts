import { NextResponse } from 'next/server';
import { getUserGroupsServer, saveUserGroupServer } from '@/lib/server/user-groups';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiAnyPermission, requireApiPermission } from '@/lib/auth/require-permission';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAnyPermission(req, ['settings.admin', 'identity.read']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const groups = await getUserGroupsServer(propertyId);
    return NextResponse.json({ ok: true, groups });
  } catch {
    return NextResponse.json({ error: 'user groups fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'settings.admin');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    userCount?: number;
    description?: string;
    active?: boolean;
    permissions?: string[];
  };
  if (!body.code || !body.name) {
    return NextResponse.json({ error: 'code, name gerekli' }, { status: 400 });
  }
  try {
    const group = await saveUserGroupServer({
      code: body.code,
      name: body.name,
      userCount: body.userCount ?? 0,
      description: body.description,
      active: body.active ?? true,
      permissions: (body.permissions ?? []) as import('@/lib/auth/roles').Permission[],
    }, propertyId);
    return NextResponse.json({ ok: true, group });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
