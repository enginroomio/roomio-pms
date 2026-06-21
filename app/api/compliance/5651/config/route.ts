import { NextResponse } from 'next/server';
import { loadHotspot5651Config, saveHotspot5651Config } from '@/lib/integrations/hotspot5651/server';
import type { Hotspot5651Config } from '@/lib/integrations/hotspot5651/types';

export async function GET() {
  return NextResponse.json(await loadHotspot5651Config());
}

export async function POST(req: Request) {
  const body = (await req.json()) as Hotspot5651Config;
  await saveHotspot5651Config(body);
  return NextResponse.json({ ok: true });
}
