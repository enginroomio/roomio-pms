import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import {
  deleteReclamationServer,
  getReclamationsServer,
  saveReclamationServer,
  updateReclamationStatusServer,
} from '@/lib/server/reclamations';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const cases = await getReclamationsServer(propertyId);
    return NextResponse.json({ ok: true, cases });
  } catch {
    return NextResponse.json({ error: 'reclamations fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    action?: string;
    id?: string;
    status?: 'İncelemede' | 'Onaylandı' | 'Reddedildi' | 'Kapandı';
    guest?: string;
    roomNo?: string;
    subject?: string;
    compensation?: string;
    date?: string;
  };

  try {
    if (body.action === 'status' && body.id && body.status) {
      const item = await updateReclamationStatusServer(body.id, body.status, propertyId);
      if (!item) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
      return NextResponse.json({ ok: true, case: item });
    }

    if (!body.guest || !body.roomNo || !body.subject || !body.compensation) {
      return NextResponse.json({ error: 'guest, roomNo, subject, compensation gerekli' }, { status: 400 });
    }

    const item = await saveReclamationServer({
      id: body.id,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      guest: body.guest,
      roomNo: body.roomNo,
      subject: body.subject,
      compensation: body.compensation,
      status: body.status ?? 'İncelemede',
    }, propertyId);
    return NextResponse.json({ ok: true, case: item });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

  const ok = await deleteReclamationServer(id, propertyId);
  if (!ok) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
