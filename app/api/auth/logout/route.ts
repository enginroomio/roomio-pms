import { NextResponse } from 'next/server';
import { revokeToken } from '@/lib/auth/session-store';
import { tokenFromRequest, verifyToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const token = tokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  if (payload.jti) await revokeToken(payload.jti);
  return NextResponse.json({ ok: true, message: 'Oturum kapatıldı' });
}
