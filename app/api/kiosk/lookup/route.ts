import { NextResponse } from 'next/server';
import { kioskLookup } from '@/lib/kiosk/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as { token?: string; refNo?: string; email?: string };
  return NextResponse.json(await kioskLookup(body));
}
