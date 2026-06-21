'use client';

import { roomioFetch } from '@/lib/client/api';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import { enqueueSync, isOnline } from '@/lib/sync/engine';

type PatchResult = { ok: boolean; queued: boolean };

export async function patchHkRoom(
  roomNo: string,
  hkStatus: HousekeepingBoardRow['status'],
): Promise<PatchResult> {
  const payload = { roomNo, hkStatus };

  if (!isOnline()) {
    await enqueueSync({
      entity: 'housekeeping',
      operation: 'update',
      entityId: roomNo,
      payload,
    });
    return { ok: true, queued: true };
  }

  const res = await roomioFetch('/api/housekeeping/rooms', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { queued?: boolean };

  if (res.ok || data.queued) {
    return { ok: true, queued: Boolean(data.queued) };
  }

  await enqueueSync({
    entity: 'housekeeping',
    operation: 'update',
    entityId: roomNo,
    payload,
  });
  return { ok: true, queued: true };
}
