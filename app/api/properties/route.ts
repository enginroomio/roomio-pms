import { NextResponse } from 'next/server';
import { getProperties } from '@/lib/server/pms-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const properties = await getProperties();
  return NextResponse.json({ ok: true, properties });
}
