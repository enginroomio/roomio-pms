export type RoomTypeCode = 'SGL' | 'DBL' | 'TWN' | 'TPL' | 'SUI';

export type RoomTypeDef = {
  code: RoomTypeCode;
  short: string;
  name: string;
  description: string;
  location: string;
  bedType: string;
  maxPersons: number;
  maxAdults: number;
  maxChildren: number;
  baseRate: number;
  specialInfo?: string;
};

/** Oda tipi kataloğu — Hotel Sapphire */
export const ROOM_TYPES: Record<RoomTypeCode, RoomTypeDef> = {
  SGL: {
    code: 'SGL',
    short: 'SNG',
    name: 'Deluxe Single',
    description: '5 yıldız deluxe tek kişilik oda — şehir manzarası',
    location: 'Ana bina, 1–4. kat',
    bedType: 'Single',
    maxPersons: 1,
    maxAdults: 1,
    maxChildren: 0,
    baseRate: 3500,
  },
  DBL: {
    code: 'DBL',
    short: 'DBL',
    name: 'Deluxe Double — French Bed',
    description: '5 yıldız deluxe çift kişilik oda, French bed',
    location: 'Ana bina, 1–4. kat',
    bedType: 'French Bed',
    maxPersons: 2,
    maxAdults: 2,
    maxChildren: 1,
    baseRate: 5200,
  },
  TWN: {
    code: 'TWN',
    short: 'TWN',
    name: 'Deluxe Twin',
    description: '5 yıldız deluxe twin oda — iki ayrı yatak',
    location: 'Ana bina, 1–4. kat',
    bedType: 'Twin',
    maxPersons: 2,
    maxAdults: 2,
    maxChildren: 0,
    baseRate: 5200,
  },
  TPL: {
    code: 'TPL',
    short: 'TRP',
    name: 'Executive Triple',
    description: '5 yıldız executive üç kişilik oda',
    location: 'Ana bina, geniş plan',
    bedType: 'Twin',
    maxPersons: 3,
    maxAdults: 3,
    maxChildren: 1,
    baseRate: 6800,
  },
  SUI: {
    code: 'SUI',
    short: 'SUI',
    name: 'Sapphire Suite',
    description: '5 yıldız jakuzili suit — premium kat',
    location: '5. kat, panoramik İstanbul manzarası',
    bedType: 'King',
    maxPersons: 2,
    maxAdults: 2,
    maxChildren: 1,
    baseRate: 12000,
    specialInfo: 'Jakuzi, balkon, butler servisi',
  },
};

let typesOverride: Record<string, RoomTypeDef> | null = null;

export function setRoomTypesOverride(types: Record<string, RoomTypeDef>) {
  typesOverride = Object.keys(types).length > 0 ? types : null;
}

export function getRoomTypeDef(code: string): RoomTypeDef | undefined {
  return typesOverride?.[code] ?? ROOM_TYPES[code as RoomTypeCode];
}

export function getActiveRoomTypes(): RoomTypeDef[] {
  return typesOverride ? Object.values(typesOverride) : Object.values(ROOM_TYPES);
}

export function typeCodeForSuffix(suffix: number): RoomTypeCode {
  if (suffix % 15 === 0) return 'SUI';
  if (suffix % 7 === 0) return 'TPL';
  if (suffix % 5 === 0) return 'SGL';
  if (suffix % 3 === 0) return 'TWN';
  return 'DBL';
}
