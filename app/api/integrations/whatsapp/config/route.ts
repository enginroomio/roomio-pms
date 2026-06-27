import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadWhatsappConfig, saveWhatsappConfig, testWhatsappConnection } from '@/lib/integrations/whatsapp/client';
import type { WhatsappConfig } from '@/lib/integrations/whatsapp/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadWhatsappConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadWhatsappConfig();
    return NextResponse.json(await testWhatsappConnection(config));
  }

  await saveWhatsappConfig((await req.json()) as WhatsappConfig);
  return NextResponse.json({ ok: true });
}
