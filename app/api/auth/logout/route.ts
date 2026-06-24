import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth/config';
import { getJwtPayloadFromRequest } from '@/lib/auth/request-token';
import { revokeToken } from '@/lib/auth/session-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const payload = await getJwtPayloadFromRequest(req);
  if (payload?.jti) await revokeToken(payload.jti);

  const res = NextResponse.json({ ok: true, message: 'Oturum kapatıldı' });
  res.cookies.set(AUTH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
