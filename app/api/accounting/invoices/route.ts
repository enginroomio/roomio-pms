import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import {
  addInvoice,
  deleteInvoice,
  getInvoices,
  updateInvoice,
  type Invoice,
} from '@/lib/server/pms-store';
import { buildInvoicePdfKit } from '@/lib/server/pdf-templates';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'accounting.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');
  const id = searchParams.get('id');

  if (format === 'pdf' && id) {
    const invoices = await getInvoices(propertyId);
    const invoice = invoices.find((row) => row.id === id);
    if (!invoice) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
    const pdf = await buildInvoicePdfKit(invoice, propertyId);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fatura-${invoice.no}.pdf"`,
      },
    });
  }

  const invoices = await getInvoices(propertyId);
  return NextResponse.json({ ok: true, invoices });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'accounting.write');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json()) as Partial<Invoice>;
    if (!body.guest || body.amount == null) {
      return NextResponse.json({ error: 'guest ve amount gerekli' }, { status: 400 });
    }
    const propertyId = propertyIdFromRequest(req);
    const today = new Date().toISOString().slice(0, 10);
    const invoice = await addInvoice(
      {
        no: body.no ?? `FTR-${Date.now().toString(36).toUpperCase()}`,
        date: body.date ?? today,
        guest: body.guest,
        amount: Number(body.amount),
        vat: Number(body.vat ?? 0),
        status: (body.status as Invoice['status']) ?? 'draft',
        type: (body.type as Invoice['type']) ?? 'konaklama',
      },
      propertyId,
    );
    return NextResponse.json({ ok: true, invoice });
  } catch {
    return NextResponse.json({ error: 'Fatura oluşturulamadı' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireApiPermission(req, 'accounting.write');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json()) as { id?: string } & Partial<Invoice>;
    if (!body.id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    const propertyId = propertyIdFromRequest(req);
    const { id, ...patch } = body;
    const invoice = await updateInvoice(id, patch, propertyId);
    if (!invoice) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
    return NextResponse.json({ ok: true, invoice });
  } catch {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireApiPermission(req, 'accounting.write');
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  const propertyId = propertyIdFromRequest(req);
  const ok = await deleteInvoice(id, propertyId);
  if (!ok) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
