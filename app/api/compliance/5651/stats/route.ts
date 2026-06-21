import { NextResponse } from 'next/server';
import { getHotspot5651Stats } from '@/lib/integrations/hotspot5651/server';

export async function GET() {
  return NextResponse.json(await getHotspot5651Stats());
}
