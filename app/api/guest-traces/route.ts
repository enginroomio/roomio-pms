import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import {
  completeGuestTraceServer,
  deleteGuestTraceServer,
  getGuestTracesServer,
  saveGuestTraceServer,
} from '@/lib/server/guest-traces';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;

  try {
    const traces = await getGuestTracesServer(propertyId, status ? { status } : undefined);
    return NextResponse.json({ ok: true, traces });
  } catch (err) {
    logApiError('GET /api/guest-traces', err);
    return NextResponse.json({ error: 'traces fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    action?: string;
    id?: string;
    guest?: string;
    roomNo?: string;
    subject?: string;
    due?: string;
    status?: 'Açık' | 'Tamamlandı';
    assignee?: string;
    notes?: string;
    date?: string;
  };

  try {
    if (body.action === 'complete' && body.id) {
      const trace = await completeGuestTraceServer(body.id, propertyId);
      if (!trace) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
      return NextResponse.json({ ok: true, trace });
    }

    if (!body.guest || !body.roomNo || !body.subject || !body.due || !body.assignee) {
      return NextResponse.json({ error: 'guest, roomNo, subject, due, assignee gerekli' }, { status: 400 });
    }

    const trace = await saveGuestTraceServer({
      id: body.id,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      guest: body.guest,
      roomNo: body.roomNo,
      subject: body.subject,
      due: body.due,
      status: body.status ?? 'Açık',
      assignee: body.assignee,
      notes: body.notes,
    }, propertyId);
    return NextResponse.json({ ok: true, trace });
  } catch (err) {
    logApiError('POST /api/guest-traces', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

  const ok = await deleteGuestTraceServer(id, propertyId);
  if (!ok) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
