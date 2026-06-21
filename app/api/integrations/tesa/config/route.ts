import { NextResponse } from 'next/server';
import { loadTesaConfig, saveTesaConfig } from '@/lib/integrations/tesa/client';
import type { TesaConfig } from '@/lib/integrations/tesa/types';

export async function GET() {
  return NextResponse.json(await loadTesaConfig());
}

export async function POST(req: Request) {
  const body = (await req.json()) as TesaConfig;
  await saveTesaConfig(body);
  return NextResponse.json({ ok: true });
}
