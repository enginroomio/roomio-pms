import { FAULT_CATEGORIES, technicianById } from '@/lib/housekeeping/technicians';
import { sendRolePush } from '@/lib/push/send';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { updateHkRoom } from '@/lib/server/housekeeping-service';
import { getAllRoomsServer } from '@/lib/server/room-inventory-bridge';

export type FaultStatus = 'open' | 'assigned' | 'in_progress' | 'resolved';

export type RoomFault = {
  id: string;
  propertyId: string;
  roomNo: string;
  floor: number;
  category: string;
  categoryLabel: string;
  description?: string;
  status: FaultStatus;
  assignedTo?: string;
  assignedToName?: string;
  reportedBy?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function categoryLabel(id: string) {
  return FAULT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

async function floorForRoom(roomNo: string, propertyId?: string) {
  const rooms = await getAllRoomsServer(propertyId);
  return (rooms.find((r) => r.roomNo === roomNo)?.floor ?? Math.floor(Number(roomNo) / 100)) || 1;
}

function toFault(row: {
  id: string;
  propertyId: string;
  roomNo: string;
  floor: number;
  category: string;
  description: string | null;
  status: string;
  assignedTo: string | null;
  reportedBy: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}): RoomFault {
  const tech = row.assignedTo ? technicianById(row.assignedTo) : undefined;
  return {
    id: row.id,
    propertyId: row.propertyId,
    roomNo: row.roomNo,
    floor: row.floor,
    category: row.category,
    categoryLabel: categoryLabel(row.category),
    description: row.description ?? undefined,
    status: row.status as FaultStatus,
    assignedTo: row.assignedTo ?? undefined,
    assignedToName: tech?.name ?? row.assignedTo ?? undefined,
    reportedBy: row.reportedBy ?? undefined,
    resolvedBy: row.resolvedBy ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt ?? undefined,
  };
}

async function notifyTechnician(fault: RoomFault) {
  void sendRolePush('technician', {
    title: `Arıza — Oda ${fault.roomNo}`,
    body: `${fault.categoryLabel}${fault.description ? ` · ${fault.description}` : ''} — atandı`,
    tag: `fault-${fault.id}`,
    url: '/housekeeping/faults',
    roomNo: fault.roomNo,
    eventType: 'fault-assigned',
    faultId: fault.id,
  });
}

async function notifyDepartmentsCompleted(fault: RoomFault) {
  const body = `Oda ${fault.roomNo} arızası giderildi — oda kullanıma hazır`;
  void sendRolePush(['hk', 'reception', 'fo', 'fo_manager'], {
    title: `Arıza tamamlandı — ${fault.roomNo}`,
    body,
    tag: `fault-done-${fault.roomNo}`,
    url: '/housekeeping/mobile',
    roomNo: fault.roomNo,
    hkStatus: 'CLEAN',
    eventType: 'fault-completed',
    faultId: fault.id,
  });
}

export async function listRoomFaults(
  propertyId?: string,
  status?: FaultStatus | 'active',
): Promise<RoomFault[]> {
  const prop = pid(propertyId);
  const where =
    status === 'active'
      ? { propertyId: prop, status: { in: ['open', 'assigned', 'in_progress'] } }
      : status
        ? { propertyId: prop, status }
        : { propertyId: prop, status: { not: 'resolved' } };

  const rows = await prisma.roomMaintenanceFault.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
  return rows.map(toFault);
}

export async function getOpenFaultForRoom(roomNo: string, propertyId?: string): Promise<RoomFault | null> {
  const row = await prisma.roomMaintenanceFault.findFirst({
    where: {
      propertyId: pid(propertyId),
      roomNo,
      status: { in: ['open', 'assigned', 'in_progress'] },
    },
    orderBy: { createdAt: 'desc' },
  });
  return row ? toFault(row) : null;
}

export async function createRoomFault(input: {
  roomNo: string;
  category?: string;
  description?: string;
  reportedBy?: string;
  assignTechnicianId?: string;
  propertyId?: string;
  skipHkUpdate?: boolean;
}): Promise<RoomFault> {
  const prop = pid(input.propertyId);
  const existing = await getOpenFaultForRoom(input.roomNo, prop);
  if (existing) return existing;

  const now = new Date().toISOString();
  const category = input.category ?? 'general';
  const row = await prisma.roomMaintenanceFault.create({
    data: {
      id: `fault-${prop}-${input.roomNo}-${Date.now()}`,
      propertyId: prop,
      roomNo: input.roomNo,
      floor: await floorForRoom(input.roomNo, prop),
      category,
      description: input.description ?? null,
      status: input.assignTechnicianId ? 'assigned' : 'open',
      assignedTo: input.assignTechnicianId ?? null,
      reportedBy: input.reportedBy ?? 'HK',
      createdAt: now,
      updatedAt: now,
    },
  });

  if (!input.skipHkUpdate) {
    await updateHkRoom(input.roomNo, { hkStatus: 'OOO', notes: input.description }, prop);
  }

  const fault = toFault(row);
  if (input.assignTechnicianId) await notifyTechnician(fault);
  return fault;
}

export async function assignRoomFault(
  faultId: string,
  technicianId: string,
  propertyId?: string,
): Promise<RoomFault> {
  const now = new Date().toISOString();
  const row = await prisma.roomMaintenanceFault.update({
    where: { id: faultId },
    data: {
      assignedTo: technicianId,
      status: 'assigned',
      updatedAt: now,
    },
  });
  if (row.propertyId !== pid(propertyId)) throw new Error('Fault not found');
  const fault = toFault(row);
  await notifyTechnician(fault);
  return fault;
}

export async function completeRoomFault(
  faultId: string,
  resolvedBy?: string,
  propertyId?: string,
): Promise<RoomFault> {
  const now = new Date().toISOString();
  const row = await prisma.roomMaintenanceFault.update({
    where: { id: faultId },
    data: {
      status: 'resolved',
      resolvedBy: resolvedBy ?? 'Teknik Servis',
      resolvedAt: now,
      updatedAt: now,
    },
  });
  if (row.propertyId !== pid(propertyId)) throw new Error('Fault not found');

  await updateHkRoom(row.roomNo, { hkStatus: 'CLEAN', notes: undefined }, row.propertyId);

  const fault = toFault(row);
  await notifyDepartmentsCompleted(fault);
  return fault;
}

export async function completeFaultForRoom(roomNo: string, resolvedBy?: string, propertyId?: string): Promise<RoomFault | null> {
  const open = await getOpenFaultForRoom(roomNo, propertyId);
  if (!open) return null;
  return completeRoomFault(open.id, resolvedBy, propertyId);
}

/** Mevcut OOO odalar için demo arıza kayıtları */
export async function ensureDemoFaultsSeeded(propertyId?: string): Promise<void> {
  const prop = pid(propertyId);
  const count = await prisma.roomMaintenanceFault.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const demo: { roomNo: string; category: string; description: string; assignedTo?: string }[] = [
    { roomNo: '113', category: 'plumbing', description: 'Lavabo tıkanıklığı', assignedTo: 'ali' },
    { roomNo: '410', category: 'hvac', description: 'Klima çalışmıyor', assignedTo: 'mehmet' },
    { roomNo: '415', category: 'general', description: 'Jakuzi arızası', assignedTo: 'serkan' },
  ];

  const now = new Date().toISOString();
  for (const d of demo) {
    await prisma.roomMaintenanceFault.create({
      data: {
        id: `fault-seed-${prop}-${d.roomNo}`,
        propertyId: prop,
        roomNo: d.roomNo,
        floor: await floorForRoom(d.roomNo, prop),
        category: d.category,
        description: d.description,
        status: d.assignedTo ? 'assigned' : 'open',
        assignedTo: d.assignedTo ?? null,
        reportedBy: 'HK Şefi',
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}
