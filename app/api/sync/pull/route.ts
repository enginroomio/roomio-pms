import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { pullSince } from '@/lib/server/local-store';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'hk.manage');
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const since = url.searchParams.get('since') ?? '1970-01-01T00:00:00.000Z';
  const deviceId = url.searchParams.get('deviceId') ?? '';
  try {
    const result = await pullSince(since, deviceId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'pull failed' }, { status: 500 });
  }
}
