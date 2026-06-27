import { allRoomNumbers } from '@/lib/rooms/room-config';

export type RoomFixture = {
  roomNo: string;
  floor: number;
  type: string;
  items: { name: string; qty: number; condition: 'good' | 'fair' | 'replace' }[];
};

export type RoomEnergyRow = {
  roomNo: string;
  floor: number;
  type: string;
  occupied: boolean;
  kwhToday: number;
  kwhMonth: number;
  hvacMode: string;
};

const TYPE_BY_FLOOR: Record<number, string> = {
  1: 'DBL',
  2: 'DBL',
  3: 'TWN',
  4: 'SUI',
  5: 'SGL',
};

function roomType(roomNo: string): string {
  const floor = Math.floor(parseInt(roomNo, 10) / 100);
  return TYPE_BY_FLOOR[floor] ?? 'DBL';
}

const BASE_FIXTURES = [
  { name: 'Yatak (çift)', qty: 1, condition: 'good' as const },
  { name: 'Minibar', qty: 1, condition: 'good' as const },
  { name: 'TV', qty: 1, condition: 'good' as const },
  { name: 'Klima kumandası', qty: 1, condition: 'fair' as const },
  { name: 'Saç kurutma', qty: 1, condition: 'good' as const },
  { name: 'Kasa', qty: 1, condition: 'good' as const },
];

export function buildRoomFixtures(): RoomFixture[] {
  return allRoomNumbers().map((roomNo) => {
    const n = parseInt(roomNo, 10);
    const suffix = n % 100;
    const items = BASE_FIXTURES.map((item, i) => ({
      ...item,
      condition: suffix === 15 && i === 3 ? 'replace' as const : item.condition,
    }));
    if (roomType(roomNo) === 'SUI') {
      items.push({ name: 'Jakuzi', qty: 1, condition: 'good' });
    }
    return {
      roomNo,
      floor: Math.floor(n / 100),
      type: roomType(roomNo),
      items,
    };
  });
}

export function buildEnergyRows(occupiedRooms: Set<string>): RoomEnergyRow[] {
  return allRoomNumbers().map((roomNo) => {
    const occupied = occupiedRooms.has(roomNo);
    const base = roomType(roomNo) === 'SUI' ? 18 : roomType(roomNo) === 'SGL' ? 8 : 12;
    const n = parseInt(roomNo, 10);
    const bump = (n % 7) * 0.6;
    const kwhToday = occupied ? Math.round((base + bump) * 10) / 10 : Math.round((2 + bump * 0.2) * 10) / 10;
    return {
      roomNo,
      floor: Math.floor(n / 100),
      type: roomType(roomNo),
      occupied,
      kwhToday,
      kwhMonth: Math.round(kwhToday * 22 * 10) / 10,
      hvacMode: occupied ? 'Cool 22°C' : 'Eco',
    };
  });
}
