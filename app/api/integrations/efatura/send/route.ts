import { NextResponse } from 'next/server';
import { requireApiAnyPermission } from '@/lib/auth/require-permission';
import { sendInvoiceToEfatura } from '@/lib/integrations/efatura/client';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireApiAnyPermission(req, ['settings.admin', 'accounting.write']);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { invoiceId?: string };
  if (!body.invoiceId) {
    return NextResponse.json({ ok: false, message: 'invoiceId gerekli' }, { status: 400 });
  }

  const propertyId = propertyIdFromRequest(req);
  const result = await sendInvoiceToEfatura(body.invoiceId, propertyId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
