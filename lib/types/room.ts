export type RoomHkStatus = 'CLEAN' | 'DIRTY' | 'INSPECT' | 'OOO' | 'DND' | 'OOS';

export type RoomRecord = {
  id: string;
  roomNo: string;
  floor: number;
  suffix: number;
  typeCode: string;
  typeShort: string;
  typeName: string;
  bedType: string;
  maxPersons: number;
  maxAdults: number;
  maxChildren: number;
  baseRate: number;
  location: string;
  building: string;
  specialInfo?: string;
  hkStatus: RoomHkStatus;
  isActive: boolean;
};

export type RackCellState =
  | 'dolu-temiz'
  | 'dolu-kirli'
  | 'checkout'
  | 'temiz'
  | 'kirli'
  | 'onayli'
  | 'ooi'
  | 'ariza';

export type RackCell = {
  room: RoomRecord;
  state: RackCellState;
  guestName?: string;
  guestCode?: string;
  checkoutToday?: boolean;
  occupied: boolean;
};

export const HK_STATUS_LABELS: Record<RoomHkStatus, string> = {
  CLEAN: 'Temiz',
  DIRTY: 'Kirli',
  INSPECT: 'Kontrol',
  OOO: 'Arızalı',
  DND: 'Rahatsız Etmeyin',
  OOS: 'OOI',
};
