import { NextResponse } from 'next/server';
import { getPublicSpaCatalog } from '@/lib/spa/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicSpaCatalog());
}
