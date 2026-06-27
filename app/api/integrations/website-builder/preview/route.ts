import { NextResponse } from 'next/server';
import { getPublicWebsitePreview } from '@/lib/integrations/website-builder/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicWebsitePreview());
}
