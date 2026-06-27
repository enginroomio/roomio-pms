import { NextResponse } from 'next/server';
import { getPublicGuestAppInfo } from '@/lib/integrations/guest-app/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicGuestAppInfo());
}
