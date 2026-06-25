import { NextResponse } from 'next/server';
import { sendInvoiceToEfatura, testEfaturaConnection, listEfaturaSubmissions, loadEfaturaConfig, saveEfaturaConfig } from '@/lib/integrations/efatura/client';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import type { EfaturaConfig } from '@/lib/integrations/efatura/types';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('submissions') === '1') {
    return NextResponse.json({ ok: true, submissions: await listEfaturaSubmissions() });
  }

  return NextResponse.json(await loadEfaturaConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadEfaturaConfig();
    return NextResponse.json(await testEfaturaConnection(config));
  }

  const body = (await req.json()) as EfaturaConfig | { invoiceId: string };
  if ('invoiceId' in body && body.invoiceId) {
    const propertyId = propertyIdFromRequest(req);
    return NextResponse.json(await sendInvoiceToEfatura(body.invoiceId, propertyId));
  }

  await saveEfaturaConfig(body as EfaturaConfig);
  return NextResponse.json({ ok: true });
}
