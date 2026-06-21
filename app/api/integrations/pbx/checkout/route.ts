import { NextResponse } from 'next/server';
import { pbxCheckOut } from '@/lib/integrations/pbx/client';

export async function POST(req: Request) {
  const body = (await req.json()) as { roomNo: string };
  const result = await pbxCheckOut(body.roomNo);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
