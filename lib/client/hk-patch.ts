'use client';

import { roomioFetch } from '@/lib/client/api';
import { emitHkMapUpdate } from '@/lib/client/hk-map-sync';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import { enqueueSync, isOnline } from '@/lib/sync/engine';

type PatchResult = { ok: boolean; queued: boolean };

export type HkRoomPatch = Partial<Pick<HkRoomRecord, 'hkStatus' | 'assignedTo' | 'notes'>>;

async function sendPatch(roomNo: string, patch: HkRoomPatch): Promise<PatchResult> {
  const payload = { roomNo, ...patch };

  if (!isOnline()) {
    await enqueueSync({
      entity: 'housekeeping',
      operation: 'update',
      entityId: roomNo,
      payload,
    });
    if (patch.hkStatus !== undefined) {
      emitHkMapUpdate({ roomNo, hkStatus: patch.hkStatus });
    }
    return { ok: true, queued: true };
  }

  const res = await roomioFetch('/api/housekeeping/rooms', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { queued?: boolean };

  if (res.ok || data.queued) {
    if (patch.hkStatus !== undefined) {
      emitHkMapUpdate({ roomNo, hkStatus: patch.hkStatus });
    }
    return { ok: true, queued: Boolean(data.queued) };
  }

  await enqueueSync({
    entity: 'housekeeping',
    operation: 'update',
    entityId: roomNo,
    payload,
  });
  if (patch.hkStatus !== undefined) {
    emitHkMapUpdate({ roomNo, hkStatus: patch.hkStatus });
  }
  return { ok: true, queued: true };
}

export async function patchHkRoomFields(roomNo: string, patch: HkRoomPatch): Promise<PatchResult> {
  return sendPatch(roomNo, patch);
}

export async function patchHkRoomAssign(
  roomNo: string,
  assignedTo: string | null,
): Promise<PatchResult> {
  return sendPatch(roomNo, { assignedTo: assignedTo ?? undefined });
}
