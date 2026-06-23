import { NextResponse } from 'next/server';
import {
  assignRoomFault,
  completeRoomFault,
  createRoomFault,
  ensureDemoFaultsSeeded,
  listRoomFaults,
} from '@/lib/server/fault-service';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export async function GET(request: Request) {
  const propertyId = propertyIdFromRequest(request);
  await ensureDemoFaultsSeeded(propertyId);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'open' | 'assigned' | 'in_progress' | 'resolved' | 'active' | null;
  const faults = await listRoomFaults(propertyId, status ?? 'active');
  return NextResponse.json({ count: faults.length, faults });
}

export async function POST(request: Request) {
  const propertyId = propertyIdFromRequest(request);
  const body = (await request.json()) as {
    roomNo?: string;
    category?: string;
    description?: string;
    reportedBy?: string;
    assignTechnicianId?: string;
  };
  if (!body.roomNo) {
    return NextResponse.json({ error: 'roomNo gerekli' }, { status: 400 });
  }
  const fault = await createRoomFault({ ...body, roomNo: body.roomNo, propertyId });
  return NextResponse.json({ fault });
}

export async function PATCH(request: Request) {
  const propertyId = propertyIdFromRequest(request);
  const body = (await request.json()) as {
    faultId?: string;
    action?: 'assign' | 'complete';
    technicianId?: string;
    resolvedBy?: string;
  };
  if (!body.faultId || !body.action) {
    return NextResponse.json({ error: 'faultId ve action gerekli' }, { status: 400 });
  }
  if (body.action === 'assign') {
    if (!body.technicianId) {
      return NextResponse.json({ error: 'technicianId gerekli' }, { status: 400 });
    }
    const fault = await assignRoomFault(body.faultId, body.technicianId, propertyId);
    return NextResponse.json({ fault });
  }
  const fault = await completeRoomFault(body.faultId, body.resolvedBy, propertyId);
  return NextResponse.json({ fault });
}
