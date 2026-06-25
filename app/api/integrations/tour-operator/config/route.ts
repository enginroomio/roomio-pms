import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import {
  loadTourOperatorConfig,
  saveTourOperatorConfig,
  testTourOperatorConnection,
} from '@/lib/integrations/tour-operator/client';
import type { TourOperatorConfig } from '@/lib/integrations/tour-operator/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadTourOperatorConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadTourOperatorConfig();
    return NextResponse.json(await testTourOperatorConnection(config));
  }

  await saveTourOperatorConfig((await req.json()) as TourOperatorConfig);
  return NextResponse.json({ ok: true });
}
