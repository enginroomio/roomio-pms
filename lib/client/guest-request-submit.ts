'use client';

import { roomioFetch } from '@/lib/client/api';
import { guestRequestLabel } from '@/lib/housekeeping/guest-request-types';
import type { HkGuestRequestRecord } from '@/lib/server/guest-request-service';
import { enqueueSync, isOnline } from '@/lib/sync/engine';

export type GuestRequestPayload = {
  roomNo: string;
  requestType: string;
  description?: string;
  requestedBy?: string;
};

export type GuestRequestSubmitResult = {
  ok: boolean;
  queued: boolean;
  request?: HkGuestRequestRecord;
};

function pendingRequest(payload: GuestRequestPayload, id: string): HkGuestRequestRecord {
  const now = new Date().toISOString();
  const roomNum = Number(payload.roomNo);
  return {
    id,
    propertyId: '',
    roomNo: payload.roomNo,
    floor: Number.isFinite(roomNum) ? Math.floor(roomNum / 100) || 1 : 1,
    requestType: payload.requestType,
    requestLabel: guestRequestLabel(payload.requestType),
    description: payload.description,
    status: 'pending',
    requestedBy: payload.requestedBy ?? 'Resepsiyon',
    createdAt: now,
  };
}

export async function submitGuestRequest(payload: GuestRequestPayload): Promise<GuestRequestSubmitResult> {
  if (!isOnline()) {
    const id = `gr-pending-${crypto.randomUUID().slice(0, 12)}`;
    await enqueueSync({
      entity: 'guest_request',
      operation: 'create',
      entityId: id,
      payload,
    });
    return { ok: true, queued: true, request: pendingRequest(payload, id) };
  }

  const res = await roomioFetch('/api/housekeeping/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const data = (await res.json()) as { request: HkGuestRequestRecord };
    return { ok: true, queued: false, request: data.request };
  }

  const id = `gr-pending-${crypto.randomUUID().slice(0, 12)}`;
  await enqueueSync({
    entity: 'guest_request',
    operation: 'create',
    entityId: id,
    payload,
  });
  return { ok: true, queued: true, request: pendingRequest(payload, id) };
}
