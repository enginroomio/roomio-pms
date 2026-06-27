import { NextResponse } from 'next/server';
import { getPublicMenu } from '@/lib/integrations/digital-menu/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicMenu());
}
