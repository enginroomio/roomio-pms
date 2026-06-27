import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import {
  addLedgerEntry,
  deleteLedgerEntry,
  getLedgerEntries,
  updateLedgerEntry,
} from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'accounting.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const entries = await getLedgerEntries(propertyId);
  return NextResponse.json({ ok: true, entries });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'accounting.write');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json()) as {
      date?: string;
      account?: string;
      description?: string;
      debit?: number;
      credit?: number;
      ref?: string;
    };
    if (!body.account || !body.description) {
      return NextResponse.json({ error: 'account ve description gerekli' }, { status: 400 });
    }
    const propertyId = propertyIdFromRequest(req);
    const entry = await addLedgerEntry(
      {
        date: body.date ?? new Date().toISOString().slice(0, 10),
        account: body.account,
        description: body.description,
        debit: Number(body.debit ?? 0),
        credit: Number(body.credit ?? 0),
        ref: body.ref,
      },
      propertyId,
    );
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    logApiError('POST /api/accounting/ledger', err);
    return NextResponse.json({ error: 'Kayıt eklenemedi' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireApiPermission(req, 'accounting.write');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json()) as { id?: string; date?: string; account?: string; description?: string; debit?: number; credit?: number; ref?: string };
    if (!body.id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    const propertyId = propertyIdFromRequest(req);
    const { id, ...patch } = body;
    const entry = await updateLedgerEntry(id, patch, propertyId);
    if (!entry) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    logApiError('PATCH /api/accounting/ledger', err);
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
  const ok = await deleteLedgerEntry(id, propertyId);
  if (!ok) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
