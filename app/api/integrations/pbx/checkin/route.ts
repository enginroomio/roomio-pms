import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { pbxCheckIn } from '@/lib/integrations/pbx/client';
import type { PbxGuestRequest } from '@/lib/integrations/pbx/types';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as PbxGuestRequest;
  const result = await pbxCheckIn(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
