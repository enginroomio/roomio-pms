import { DEFAULT_HK_ROOMS } from '@/lib/data/hk-defaults';
import { guestRequestLabel } from '@/lib/housekeeping/guest-request-types';
import { sendRolePush } from '@/lib/push/send';
import { getHousekeepingBoardServer } from '@/lib/server/housekeeping-service';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { getAllRooms } from '@/lib/rooms/inventory';

export type GuestRequestStatus = 'pending' | 'done';

export type HkGuestRequestRecord = {
  id: string;
  propertyId: string;
  roomNo: string;
  floor: number;
  requestType: string;
  requestLabel: string;
  description?: string;
  status: GuestRequestStatus;
  requestedBy: string;
  assignedStaff?: string;
  createdAt: string;
  completedAt?: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function floorForRoom(roomNo: string) {
  return (getAllRooms(DEFAULT_HK_ROOMS).find((r) => r.roomNo === roomNo)?.floor ?? Math.floor(Number(roomNo) / 100)) || 1;
}

function toRecord(row: {
  id: string;
  propertyId: string;
  roomNo: string;
  floor: number;
  requestType: string;
  description: string | null;
  status: string;
  requestedBy: string;
  assignedStaff: string | null;
  createdAt: string;
  completedAt: string | null;
}): HkGuestRequestRecord {
  return {
    id: row.id,
    propertyId: row.propertyId,
    roomNo: row.roomNo,
    floor: row.floor,
    requestType: row.requestType,
    requestLabel: guestRequestLabel(row.requestType),
    description: row.description ?? undefined,
    status: row.status as GuestRequestStatus,
    requestedBy: row.requestedBy,
    assignedStaff: row.assignedStaff ?? undefined,
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
  };
}

async function staffForRoom(roomNo: string, propertyId: string): Promise<string | undefined> {
  const board = await getHousekeepingBoardServer(propertyId);
  return board.find((r) => r.roomNo === roomNo)?.assignedTo;
}

async function notifyKatci(request: HkGuestRequestRecord) {
  const label = request.description
    ? `${request.requestLabel} — ${request.description}`
    : request.requestLabel;
  void sendRolePush('hk', {
    title: `Misafir talebi — Oda ${request.roomNo}`,
    body: `${label} · ${request.requestedBy}`,
    tag: `guest-req-${request.id}`,
    url: '/housekeeping/reports',
    roomNo: request.roomNo,
    eventType: 'guest-request',
  });
}

export async function listGuestRequests(
  propertyId?: string,
  opts?: { status?: GuestRequestStatus | 'active'; assignedStaff?: string; roomNo?: string },
): Promise<HkGuestRequestRecord[]> {
  const prop = pid(propertyId);
  const where: {
    propertyId: string;
    status?: string | { in: string[] };
    assignedStaff?: string;
    roomNo?: string;
  } = { propertyId: prop };

  if (opts?.status === 'active') where.status = { in: ['pending'] };
  else if (opts?.status) where.status = opts.status;
  if (opts?.assignedStaff) where.assignedStaff = opts.assignedStaff;
  if (opts?.roomNo) where.roomNo = opts.roomNo;

  const rows = await prisma.hkGuestRequest.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
  return rows.map(toRecord);
}

export async function createGuestRequest(input: {
  roomNo: string;
  requestType: string;
  description?: string;
  requestedBy?: string;
  propertyId?: string;
}): Promise<HkGuestRequestRecord> {
  const prop = pid(input.propertyId);
  const assignedStaff = await staffForRoom(input.roomNo, prop);
  const now = new Date().toISOString();

  const row = await prisma.hkGuestRequest.create({
    data: {
      id: `greq-${prop}-${input.roomNo}-${Date.now()}`,
      propertyId: prop,
      roomNo: input.roomNo,
      floor: floorForRoom(input.roomNo),
      requestType: input.requestType,
      description: input.description ?? null,
      status: 'pending',
      requestedBy: input.requestedBy ?? 'Resepsiyon',
      assignedStaff: assignedStaff ?? null,
      createdAt: now,
    },
  });

  const record = toRecord(row);
  await notifyKatci(record);
  return record;
}

export async function completeGuestRequest(id: string, propertyId?: string): Promise<HkGuestRequestRecord> {
  const now = new Date().toISOString();
  const row = await prisma.hkGuestRequest.update({
    where: { id },
    data: { status: 'done', completedAt: now },
  });
  if (row.propertyId !== pid(propertyId)) throw new Error('Request not found');
  return toRecord(row);
}

export async function ensureDemoGuestRequestsSeeded(propertyId?: string): Promise<void> {
  const prop = pid(propertyId);
  const count = await prisma.hkGuestRequest.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const demo = [
    { roomNo: '205', requestType: 'extra_towel', description: '2 adet banyo havlusu', assignedStaff: 'Elif K.' },
    { roomNo: '116', requestType: 'double_pillow', description: 'Ek yastık — alerji yok', assignedStaff: 'Elif K.' },
    { roomNo: '305', requestType: 'crib', description: 'Bebek yatağı 15:00', assignedStaff: 'Murat S.' },
  ];
  const now = new Date().toISOString();
  for (const d of demo) {
    await prisma.hkGuestRequest.create({
      data: {
        id: `greq-seed-${prop}-${d.roomNo}-${d.requestType}`,
        propertyId: prop,
        roomNo: d.roomNo,
        floor: floorForRoom(d.roomNo),
        requestType: d.requestType,
        description: d.description,
        status: 'pending',
        requestedBy: 'Resepsiyon',
        assignedStaff: d.assignedStaff,
        createdAt: now,
      },
    });
  }
}
