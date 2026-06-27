import { NextResponse } from 'next/server';
import { isAuthRequired, isDemoAuthEnabled } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    authRequired: isAuthRequired(),
    demoAuth: isDemoAuthEnabled(),
  });
}
