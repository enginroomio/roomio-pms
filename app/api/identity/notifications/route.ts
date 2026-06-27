import { NextResponse } from 'next/server';
import {
  addIdentityNotification,
  getIdentityNotifications,
  markIdentitySent,
} from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { hasPermission } from '@/lib/auth/roles';
import { resolveApiUser } from '@/lib/auth/require-api-user';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const rows = await getIdentityNotifications(propertyId);
  return NextResponse.json({ ok: true, notifications: rows });
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const user = await resolveApiUser(req);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  if (!hasPermission(user, 'identity.notify')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }
  try {
    const body = (await req.json()) as {
      guestName: string;
      roomNo: string;
      nationality: string;
      idNo: string;
      checkIn: string;
      action?: 'send';
      id?: string;
    };

    if (body.action === 'send' && body.id) {
      const row = await markIdentitySent(body.id);
      if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
      return NextResponse.json({ ok: true, notification: row });
    }

    const row = await addIdentityNotification({
      guestName: body.guestName,
      roomNo: body.roomNo,
      nationality: body.nationality,
      idNo: body.idNo,
      checkIn: body.checkIn,
    }, propertyId);
    return NextResponse.json({ ok: true, notification: row });
  } catch (err) {
    logApiError('POST /api/identity/notifications', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
