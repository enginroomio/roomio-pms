import { NextResponse } from 'next/server';
import { getPublicViofunCatalog } from '@/lib/integrations/viofun/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicViofunCatalog());
}
