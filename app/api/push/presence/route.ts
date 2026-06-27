import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/require-permission';
import { touchPushPresence } from '@/lib/server/push-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { endpoint?: string };
  if (!body.endpoint?.trim()) {
    return NextResponse.json({ ok: false, message: 'endpoint gerekli' }, { status: 400 });
  }

  const ok = await touchPushPresence(body.endpoint.trim());
  return NextResponse.json({ ok });
}
