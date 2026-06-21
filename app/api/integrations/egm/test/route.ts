import { NextResponse } from 'next/server';
import { testEgmConnection } from '@/lib/integrations/egm/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await testEgmConnection();
  return NextResponse.json({ ok: true, connection: result });
}
