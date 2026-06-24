import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { runNightPostingServer } from '@/lib/server/night-posting';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'eod.close');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json().catch(() => ({}))) as { user?: string };
  try {
    const result = await runNightPostingServer(propertyId, body.user ?? user.name);
    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json({ error: 'night posting failed' }, { status: 500 });
  }
}
