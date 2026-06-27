'use client';

import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import { patchHkRoomFields } from '@/lib/client/hk-patch';

type PatchResult = { ok: boolean; queued: boolean };

export async function patchHkRoom(
  roomNo: string,
  hkStatus: HousekeepingBoardRow['status'],
): Promise<PatchResult> {
  return patchHkRoomFields(roomNo, { hkStatus });
}

export { patchHkRoomFields, patchHkRoomAssign } from '@/lib/client/hk-patch';
