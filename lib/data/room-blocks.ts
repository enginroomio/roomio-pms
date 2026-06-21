export type RoomBlock = {
  id: string;
  roomNo: string;
  from: string;
  to: string;
  reason: string;
  blockedBy: string;
  status: 'active' | 'released';
};

const STORAGE_KEY = 'roomio-room-blocks-v1';

export const DEMO_ROOM_BLOCKS: RoomBlock[] = [
  { id: 'blk-1', roomNo: '415', from: '2026-06-15', to: '2026-06-25', reason: 'Klima arızası — OOO', blockedBy: 'Arda Y.', status: 'active' },
  { id: 'blk-2', roomNo: '318', from: '2026-06-20', to: '2026-06-22', reason: 'VIP hold — grup ön rezervasyon', blockedBy: 'Selin K.', status: 'active' },
  { id: 'blk-3', roomNo: '501', from: '2026-06-18', to: '2026-06-19', reason: 'Bakım — jakuzi kontrol', blockedBy: 'Murat S.', status: 'released' },
];

export function getRoomBlocks(): RoomBlock[] {
  if (typeof window === 'undefined') return DEMO_ROOM_BLOCKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEMO_ROOM_BLOCKS;
    return JSON.parse(raw) as RoomBlock[];
  } catch {
    return DEMO_ROOM_BLOCKS;
  }
}

export function saveRoomBlocks(blocks: RoomBlock[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

export function addRoomBlock(block: Omit<RoomBlock, 'id'>): RoomBlock {
  const entry: RoomBlock = { ...block, id: `blk-${Date.now()}` };
  const next = [...getRoomBlocks(), entry];
  saveRoomBlocks(next);
  return entry;
}

export function releaseRoomBlock(id: string): void {
  const next = getRoomBlocks().map((b) => (b.id === id ? { ...b, status: 'released' as const } : b));
  saveRoomBlocks(next);
}
