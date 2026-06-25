import { NextResponse } from 'next/server';
import { quoteCarbonOffset } from '@/lib/integrations/carbon/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as { nights?: number };

  if (!body.nights) {
    return NextResponse.json({ ok: false, message: 'nights gerekli' }, { status: 400 });
  }

  return NextResponse.json(await quoteCarbonOffset(Number(body.nights)));
}
