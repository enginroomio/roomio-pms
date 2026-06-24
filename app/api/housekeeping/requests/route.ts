import { NextResponse } from 'next/server';
import {
  completeGuestRequest,
  createGuestRequest,
  ensureDemoGuestRequestsSeeded,
  listGuestRequests,
} from '@/lib/server/guest-request-service';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiAnyPermission, requireApiPermission } from '@/lib/auth/require-permission';

export async function GET(request: Request) {
  const auth = await requireApiAnyPermission(request, ['hk.manage', 'reception.checkin']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(request);
  await ensureDemoGuestRequestsSeeded(propertyId);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'pending' | 'done' | 'active' | null;
  const assignedStaff = searchParams.get('staff') ?? undefined;
  const roomNo = searchParams.get('roomNo') ?? undefined;
  const requests = await listGuestRequests(propertyId, {
    status: status ?? 'active',
    assignedStaff,
    roomNo,
  });
  return NextResponse.json({ count: requests.length, requests });
}

export async function POST(request: Request) {
  const propertyId = propertyIdFromRequest(request);
  const auth = await requireApiPermission(request, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    roomNo?: string;
    requestType?: string;
    description?: string;
    requestedBy?: string;
  };
  if (!body.roomNo || !body.requestType) {
    return NextResponse.json({ error: 'roomNo ve requestType gerekli' }, { status: 400 });
  }
  const requestRecord = await createGuestRequest({
    roomNo: body.roomNo,
    requestType: body.requestType,
    description: body.description,
    requestedBy: body.requestedBy,
    propertyId,
  });
  return NextResponse.json({ request: requestRecord });
}

export async function PATCH(request: Request) {
  const propertyId = propertyIdFromRequest(request);
  const auth = await requireApiPermission(request, 'hk.manage');
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as { requestId?: string; action?: 'complete' };
  if (!body.requestId || body.action !== 'complete') {
    return NextResponse.json({ error: 'requestId ve action=complete gerekli' }, { status: 400 });
  }
  const requestRecord = await completeGuestRequest(body.requestId, propertyId);
  return NextResponse.json({ request: requestRecord });
}
