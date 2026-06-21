import type { RoomHkStatus } from '@/lib/types/room';

export type HkRoomRecord = {
  hkStatus: RoomHkStatus;
  assignedTo?: string;
  notes?: string;
};

/** Demo / seed HK durumları — tek kaynak */
export const DEFAULT_HK_ROOMS: Record<string, HkRoomRecord> = {
  '108': { hkStatus: 'DIRTY', assignedTo: 'Elif K.' },
  '204': { hkStatus: 'INSPECT', assignedTo: 'Murat S.' },
  '305': { hkStatus: 'DIRTY', assignedTo: 'Elif K.' },
  '312': { hkStatus: 'DND' },
  '410': { hkStatus: 'OOO' },
  '415': { hkStatus: 'OOO', notes: 'Klima arızası' },
};
