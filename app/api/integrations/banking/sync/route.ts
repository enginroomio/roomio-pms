import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadBankingConfig, syncBankingBalances } from '@/lib/integrations/banking/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  const config = await loadBankingConfig();
  return NextResponse.json(await syncBankingBalances(config));
}
