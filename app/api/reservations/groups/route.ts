import { NextResponse } from 'next/server';
import {
  addGroupMemberServer,
  createReservationGroupServer,
  getGroupAllotmentStatusServer,
  getGroupBlocksSummaryServer,
  getGroupMembersServer,
  getReservationGroupsServer,
  releaseGroupBlockServer,
  setGroupAllotmentServer,
} from '@/lib/server/group-reservations';
import { getGroupPickupReportServer } from '@/lib/server/group-pickup-report';
import { buildGroupPickupPdfKit } from '@/lib/server/pdf-templates';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';
import type { Reservation } from '@/lib/types/reservation';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');
  const view = searchParams.get('view');
  const format = searchParams.get('format');

  const permission = view === 'pickup-report' && format === 'pdf' ? 'reports.export' : 'reservations.read';
  const auth = await requireApiPermission(req, permission);
  if (auth instanceof NextResponse) return auth;

  try {
    if (view === 'pickup-report') {
      const report = await getGroupPickupReportServer(propertyId);
      if (format === 'pdf') {
        const pdf = await buildGroupPickupPdfKit(report);
        return new NextResponse(new Uint8Array(pdf), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="group-pickup-${report.businessDate}.pdf"`,
          },
        });
      }
      return NextResponse.json({ ok: true, report });
    }
    if (view === 'summary') {
      const summary = await getGroupBlocksSummaryServer(propertyId);
      return NextResponse.json({ ok: true, summary });
    }
    if (groupId && view === 'allotment') {
      const status = await getGroupAllotmentStatusServer(groupId, propertyId);
      if (!status) return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 });
      return NextResponse.json({ ok: true, status });
    }
    if (groupId) {
      const members = await getGroupMembersServer(groupId, propertyId);
      return NextResponse.json({ ok: true, members });
    }
    const groups = await getReservationGroupsServer(propertyId);
    return NextResponse.json({ ok: true, groups });
  } catch (err) {
    logApiError('GET /api/reservations/groups', err);
    return NextResponse.json({ error: 'groups fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const auth = await requireApiPermission(req, 'reservations.write');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    action?: 'create' | 'add_member' | 'release';
    name?: string;
    contactName?: string;
    checkIn?: string;
    checkOut?: string;
    roomCount?: number;
    notes?: string;
    releaseDays?: number;
    groupId?: string;
    member?: Partial<Reservation>;
  };

  try {
    if (body.action === 'release' && body.groupId) {
      const group = await releaseGroupBlockServer(body.groupId, propertyId, auth.user.name);
      if (!group) return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 });
      return NextResponse.json({ ok: true, group });
    }
    if (body.action === 'add_member' && body.groupId && body.member) {
      const m = body.member;
      if (!m.guestName) {
        return NextResponse.json({ error: 'member.guestName gerekli' }, { status: 400 });
      }
      const saved = await addGroupMemberServer(body.groupId, {
        guestName: m.guestName,
        email: m.email,
        phone: m.phone,
        checkIn: m.checkIn ?? '',
        checkOut: m.checkOut ?? '',
        roomType: m.roomType ?? 'DBL',
        adults: m.adults ?? 2,
        children: m.children ?? 0,
        mealPlan: m.mealPlan ?? 'BB',
        rate: m.rate ?? 0,
        currency: m.currency ?? 'TRY',
        agency: m.agency ?? 'Group',
        market: m.market ?? 'GRP',
        status: m.status ?? 'CONFIRMED',
      }, propertyId);
      return NextResponse.json({ ok: true, reservation: saved });
    }

    if (!body.name || !body.checkIn || !body.checkOut || !body.roomCount) {
      return NextResponse.json({ error: 'name, checkIn, checkOut, roomCount gerekli' }, { status: 400 });
    }
    const group = await createReservationGroupServer({
      name: body.name,
      contactName: body.contactName,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      roomCount: body.roomCount,
      notes: body.notes,
      releaseDays: body.releaseDays,
    }, propertyId);
    return NextResponse.json({ ok: true, group });
  } catch (err) {
    logApiError('POST /api/reservations/groups', err, { propertyId });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'group operation failed' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const auth = await requireApiPermission(req, 'reservations.write');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    groupId?: string;
    allotment?: Record<string, number>;
    releaseDays?: number;
  };
  if (!body.groupId || !body.allotment) {
    return NextResponse.json({ error: 'groupId ve allotment gerekli' }, { status: 400 });
  }
  try {
    const group = await setGroupAllotmentServer(
      body.groupId,
      body.allotment,
      propertyId,
      body.releaseDays,
    );
    if (!group) return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 });
    return NextResponse.json({ ok: true, group });
  } catch (err) {
    logApiError('PATCH /api/reservations/groups', err, { propertyId, groupId: body.groupId });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'allotment update failed' },
      { status: 500 },
    );
  }
}
