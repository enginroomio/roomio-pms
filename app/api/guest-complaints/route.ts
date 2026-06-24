import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import {
  deleteGuestComplaintServer,
  getGuestComplaintsServer,
  resolveGuestComplaintServer,
  saveGuestComplaintServer,
} from '@/lib/server/guest-complaints';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const complaints = await getGuestComplaintsServer(propertyId);
    return NextResponse.json({ ok: true, complaints });
  } catch {
    return NextResponse.json({ error: 'complaints fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    action?: string;
    id?: string;
    roomNo?: string;
    guest?: string;
    category?: string;
    description?: string;
    priority?: 'Normal' | 'Acil';
    status?: 'Açık' | 'Çözüldü';
    date?: string;
  };

  try {
    if (body.action === 'resolve' && body.id) {
      const complaint = await resolveGuestComplaintServer(body.id, propertyId);
      if (!complaint) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
      return NextResponse.json({ ok: true, complaint });
    }

    if (!body.roomNo || !body.guest || !body.category || !body.description) {
      return NextResponse.json({ error: 'roomNo, guest, category, description gerekli' }, { status: 400 });
    }

    const complaint = await saveGuestComplaintServer({
      id: body.id,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      roomNo: body.roomNo,
      guest: body.guest,
      category: body.category,
      description: body.description,
      priority: body.priority ?? 'Normal',
      status: body.status ?? 'Açık',
    }, propertyId);
    return NextResponse.json({ ok: true, complaint });
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

  const ok = await deleteGuestComplaintServer(id, propertyId);
  if (!ok) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
