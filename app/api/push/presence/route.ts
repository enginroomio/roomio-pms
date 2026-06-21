import { NextResponse } from 'next/server';
import { touchPushPresence } from '@/lib/server/push-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as { endpoint?: string };
  if (!body.endpoint?.trim()) {
    return NextResponse.json({ ok: false, message: 'endpoint gerekli' }, { status: 400 });
  }

  const ok = await touchPushPresence(body.endpoint.trim());
  return NextResponse.json({ ok });
}
