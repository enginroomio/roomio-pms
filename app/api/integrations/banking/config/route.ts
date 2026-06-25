import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadBankingConfig, saveBankingConfig } from '@/lib/integrations/banking/client';
import type { BankingConfig } from '@/lib/integrations/banking/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadBankingConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveBankingConfig((await req.json()) as BankingConfig);
  return NextResponse.json({ ok: true });
}
