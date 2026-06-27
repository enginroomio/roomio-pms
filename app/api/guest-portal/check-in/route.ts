import { NextResponse } from 'next/server';
import { performGuestCheckIn } from '@/lib/guest-portal/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as { token?: string; notes?: string };
  if (!body.token) {
    return NextResponse.json({ ok: false, message: 'token gerekli' }, { status: 400 });
  }
  const result = await performGuestCheckIn(body.token, body.notes);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
