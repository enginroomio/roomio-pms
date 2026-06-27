import type { TesaEncodeRequest } from '@/lib/integrations/tesa/types';

const STX = '\x02';
const ETX = '\x03';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatHt24DateTime(isoDate: string, time = '14:00'): { date: string; time: string } {
  const [y, m, d] = isoDate.split('-');
  const [hh, mm] = time.split(':');
  return { date: `${y}${m}${d}`, time: `${pad(Number(hh))}${pad(Number(mm))}` };
}

/** HT24 — Check-In New Guest (CI) — Industry Standard Protocol */
export function buildCheckInMessage(
  encoderNumber: number,
  lockRoomId: string,
  req: TesaEncodeRequest,
): string {
  const ci = formatHt24DateTime(req.checkIn, '14:00');
  const co = formatHt24DateTime(req.checkOut, '12:00');
  const guest = req.guestName.replace(/\|/g, ' ').slice(0, 32);
  const keys = req.keyCount ?? 1;
  // CI|encoder|room|checkinDate|checkinTime|checkoutDate|checkoutTime|keyCount|guestName
  return `${STX}CI|${encoderNumber}|${lockRoomId}|${ci.date}|${ci.time}|${co.date}|${co.time}|${keys}|${guest}${ETX}`;
}

/** HT24 — Check-Out (CO) */
export function buildCheckOutMessage(encoderNumber: number, lockRoomId: string): string {
  return `${STX}CO|${encoderNumber}|${lockRoomId}${ETX}`;
}

/** HT24 — Copy Guest Key (CK) */
export function buildCopyKeyMessage(encoderNumber: number, lockRoomId: string, keyCount = 1): string {
  return `${STX}CK|${encoderNumber}|${lockRoomId}|${keyCount}${ETX}`;
}

/** HT24 — Link / status ping (LS) */
export function buildLinkStatusMessage(encoderNumber: number): string {
  return `${STX}LS|${encoderNumber}${ETX}`;
}

export function parseHt24Response(raw: string): { ok: boolean; code: string; detail: string } {
  const cleaned = raw.replace(/^\x02|\x03$/g, '').trim();
  const parts = cleaned.split('|');
  const code = parts[0] ?? '';
  const ok = code === 'OK' || code === 'AC' || code.startsWith('OK');
  return { ok, code, detail: parts.slice(1).join('|') || cleaned };
}

export function mapRoom(roomNo: string, mappings: Record<string, string>): string {
  return mappings[roomNo] ?? roomNo;
}
