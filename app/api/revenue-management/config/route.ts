import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import {
  loadRevenueManagementConfig,
  saveRevenueManagementConfig,
} from '@/lib/revenue-management/config';
import type { RevenueManagementConfig } from '@/lib/revenue-management/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await loadRevenueManagementConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as RevenueManagementConfig;
  await saveRevenueManagementConfig(body);
  return NextResponse.json({ ok: true });
}
