/** Rezervasyon listesi / rack — oda tipi renk tonları */
export type RoomTypeTone = 'sgl' | 'dbl' | 'twn' | 'tpl' | 'sui' | 'ooo' | 'default';

const CODE_TONE: Record<string, RoomTypeTone> = {
  SGL: 'sgl',
  SNG: 'sgl',
  SNGL: 'sgl',
  SINGLE: 'sgl',
  DBL: 'dbl',
  DBLE: 'dbl',
  DOUBLE: 'dbl',
  TWN: 'twn',
  TWIN: 'twn',
  TW: 'twn',
  TPL: 'tpl',
  TRP: 'tpl',
  TRIPLE: 'tpl',
  SUI: 'sui',
  SUITE: 'sui',
  STE: 'sui',
  OOO: 'ooo',
  OOS: 'ooo',
};

const FALLBACK_TONES: RoomTypeTone[] = ['sgl', 'dbl', 'twn', 'tpl', 'sui'];

export function resolveRoomTypeTone(code: string): RoomTypeTone {
  const key = code.trim().toUpperCase();
  if (!key) return 'default';
  if (CODE_TONE[key]) return CODE_TONE[key];

  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % FALLBACK_TONES.length;
  }
  return FALLBACK_TONES[hash] ?? 'default';
}
