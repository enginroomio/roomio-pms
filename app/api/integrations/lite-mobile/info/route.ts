import { NextResponse } from 'next/server';
import { getPublicLiteMobileInfo } from '@/lib/integrations/lite-mobile/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicLiteMobileInfo());
}
