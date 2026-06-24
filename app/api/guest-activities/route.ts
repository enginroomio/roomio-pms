import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import {
  getDailyActivitiesServer,
  getGuestActivitiesServer,
  getGuestRelationsStatsServer,
  saveDailyActivityServer,
  saveGuestActivityServer,
} from '@/lib/server/guest-activities';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  try {
    if (view === 'stats') {
      const stats = await getGuestRelationsStatsServer(propertyId);
      return NextResponse.json({ ok: true, stats });
    }
    if (view === 'daily') {
      const date = searchParams.get('date') ?? undefined;
      const type = searchParams.get('type') ?? undefined;
      const activities = await getDailyActivitiesServer(propertyId, { date, type });
      return NextResponse.json({ ok: true, activities });
    }

    const activities = await getGuestActivitiesServer(propertyId);
    return NextResponse.json({ ok: true, activities });
  } catch {
    return NextResponse.json({ error: 'activities fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    view?: 'daily' | 'guest';
    guestName?: string;
    roomNo?: string;
    nationality?: string;
    activity?: string;
    description?: string;
    staff?: string;
    datetime?: string;
    date?: string;
    time?: string;
    type?: string;
    guest?: string;
    department?: string;
    reservationId?: string;
  };

  try {
    if (body.view === 'daily') {
      if (!body.type || !body.guest || !body.roomNo || !body.staff || !body.department) {
        return NextResponse.json({ error: 'type, guest, roomNo, staff, department gerekli' }, { status: 400 });
      }
      const activity = await saveDailyActivityServer({
        date: body.date ?? new Date().toISOString().slice(0, 10),
        time: body.time ?? new Date().toTimeString().slice(0, 5),
        type: body.type,
        description: body.description ?? body.type,
        guest: body.guest,
        roomNo: body.roomNo,
        staff: body.staff,
        department: body.department,
      }, propertyId);
      return NextResponse.json({ ok: true, activity });
    }

    if (!body.guestName || !body.roomNo || !body.activity || !body.staff) {
      return NextResponse.json({ error: 'guestName, roomNo, activity, staff gerekli' }, { status: 400 });
    }

    const activity = await saveGuestActivityServer({
      datetime: body.datetime ?? new Date().toISOString().replace('T', ' ').slice(0, 16),
      guestName: body.guestName,
      roomNo: body.roomNo,
      nationality: body.nationality ?? '—',
      activity: body.activity,
      description: body.description ?? body.activity,
      staff: body.staff,
      reservationId: body.reservationId,
    }, propertyId);
    return NextResponse.json({ ok: true, activity });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
