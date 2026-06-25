import { NextResponse } from 'next/server';
import { getPublicGymCatalog } from '@/lib/integrations/gym/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicGymCatalog());
}
