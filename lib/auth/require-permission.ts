import { NextResponse } from 'next/server';
import type { SessionUser } from '@/lib/auth/roles';
import type { Permission } from '@/lib/auth/roles';
import { hasPermission } from '@/lib/auth/roles';
import { resolveApiUser } from '@/lib/auth/require-api-user';
import { requestPropertyDenied } from '@/lib/auth/property-access';

export async function requireApiAuth(
  req: Request,
): Promise<{ user: SessionUser } | NextResponse> {
  const user = await resolveApiUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }
  if (requestPropertyDenied(user, req)) {
    return NextResponse.json({ error: 'Bu şubeye erişim yetkiniz yok' }, { status: 403 });
  }
  return { user };
}

export async function requireApiPermission(
  req: Request,
  permission: Permission,
): Promise<{ user: Awaited<ReturnType<typeof resolveApiUser>> & object } | NextResponse> {
  const user = await resolveApiUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }
  if (!hasPermission(user, permission)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }
  if (requestPropertyDenied(user, req)) {
    return NextResponse.json({ error: 'Bu şubeye erişim yetkiniz yok' }, { status: 403 });
  }
  return { user };
}

export async function requireApiAnyPermission(
  req: Request,
  permissions: Permission[],
): Promise<{ user: Awaited<ReturnType<typeof resolveApiUser>> & object } | NextResponse> {
  const user = await resolveApiUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }
  if (!permissions.some((p) => hasPermission(user, p))) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }
  if (requestPropertyDenied(user, req)) {
    return NextResponse.json({ error: 'Bu şubeye erişim yetkiniz yok' }, { status: 403 });
  }
  return { user };
}

/** Kuruluş master verisi GET — oturum gerekir */
export async function requireKurulusApiRead(
  req: Request,
): Promise<{ user: SessionUser } | NextResponse> {
  return requireApiAuth(req);
}

/** Kuruluş master verisi POST — settings.admin */
export async function requireKurulusApiWrite(
  req: Request,
): Promise<{ user: SessionUser } | NextResponse> {
  return requireApiPermission(req, 'settings.admin');
}

/** Entegrasyon / uyumluluk ayarları GET — oturum gerekir */
export async function requireIntegrationAdminRead(
  req: Request,
): Promise<{ user: SessionUser } | NextResponse> {
  return requireKurulusApiRead(req);
}

/** Entegrasyon / uyumluluk ayarları POST — settings.admin */
export async function requireIntegrationAdminWrite(
  req: Request,
): Promise<{ user: SessionUser } | NextResponse> {
  return requireKurulusApiWrite(req);
}

/** EGM / kimlik entegrasyon testi GET */
export async function requireIntegrationIdentityRead(
  req: Request,
): Promise<{ user: SessionUser } | NextResponse> {
  return requireApiAnyPermission(req, ['settings.admin', 'identity.read']);
}
