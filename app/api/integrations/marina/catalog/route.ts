import { NextResponse } from 'next/server';
import { getPublicMarinaCatalog } from '@/lib/integrations/marina/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicMarinaCatalog());
}
