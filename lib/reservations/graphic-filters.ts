import type { Reservation, ReservationStatus } from '@/lib/types/reservation';
import type { GraphicCalendarDay } from '@/lib/reservations/graphic-calendar';

export type GraphicFilterLogic = 'VE' | 'VEYA';

export type GraphicFilterRule = {
  id: string;
  categoryId: string;
  operator: string;
  value: string;
  logic: GraphicFilterLogic;
};

const BOARD_CODES: Record<string, string> = {
  OB: 'RO',
  RO: 'RO',
  BB: 'BB',
  HB: 'HB',
  FB: 'FB',
  AI: 'AI',
  UAI: 'AI',
};

const STATUS_MAP: Record<string, ReservationStatus> = {
  Kesin: 'CONFIRMED',
  Onaylı: 'CONFIRMED',
  Opsiyon: 'OPTION',
  Beklemede: 'OPTION',
  Konaklayan: 'CHECKED_IN',
  Konaklıyor: 'CHECKED_IN',
  Ayrıldı: 'CHECKED_OUT',
  İptal: 'CANCELLED',
  'No-show': 'NO_SHOW',
};

function boardCode(raw: string): string {
  const head = raw.trim().split(/[\s(]/)[0]?.toUpperCase() ?? '';
  return BOARD_CODES[head] ?? head;
}

function norm(s: string): string {
  return s.toLocaleLowerCase('tr-TR').trim();
}

function compare(op: string, left: string, right: string): boolean {
  const l = norm(left);
  const r = norm(right);
  if (op === 'Eşittir') return l === r || l.includes(r) || r.includes(l);
  if (op === 'İçinde') return l.includes(r) || r.split(',').some((p) => l.includes(norm(p)));
  if (op === 'Hariç' || op === 'Hariç tut') return !l.includes(r);
  if (op === 'Boş değil') return left.trim().length > 0;
  if (op === '≥' || op === 'Büyük') return Number(left) >= Number(right.replace(/[^\d.]/g, ''));
  if (op === '≤' || op === 'Küçük') return Number(left) <= Number(right.replace(/[^\d.]/g, ''));
  if (op === 'Arasında') return l.includes(r);
  return l.includes(r);
}

function matchRule(reservation: Reservation, rule: GraphicFilterRule): boolean {
  const { categoryId, operator, value } = rule;

  switch (categoryId) {
    case 'board':
      return compare(operator, reservation.mealPlan, boardCode(value));
    case 'room':
      return compare(operator, reservation.roomType, value.split(/[\s,]/)[0] ?? value);
    case 'agency':
      return compare(operator, reservation.agency, value);
    case 'channel': {
      const ch = value.toUpperCase();
      if (ch.includes('OTA')) return reservation.market.toUpperCase().includes('OTA');
      if (ch.includes('WALK')) return reservation.market === 'BAR';
      if (ch.includes('CORP')) return reservation.market === 'CORP';
      return compare(operator, reservation.market, value);
    }
    case 'status': {
      const mapped = STATUS_MAP[value] ?? value.toUpperCase().replace(' ', '_');
      return compare(operator, reservation.status, mapped);
    }
    case 'guest': {
      if (value.toLowerCase().includes('çocuk')) return reservation.children > 0;
      if (value.toLowerCase().includes('tek kişi')) return reservation.adults === 1 && reservation.children === 0;
      if (value.toLowerCase().includes('vip')) return (reservation.notes ?? '').toLowerCase().includes('vip');
      return compare(operator, String(reservation.adults + reservation.children), value);
    }
    case 'revenue':
      return compare(operator, String(reservation.rate), value.replace(/[^\d.]/g, ''));
    case 'country':
      return compare(operator, reservation.market, value) || compare(operator, reservation.guestName, value);
    case 'property':
    case 'user':
    case 'custom':
    case 'date':
    case 'occupancy':
    case 'egm':
    case 'tis':
    case 'tga':
      return true;
    default:
      return true;
  }
}

export function filterReservations(reservations: Reservation[], rules: GraphicFilterRule[]): Reservation[] {
  if (rules.length === 0) return reservations;

  return reservations.filter((reservation) => {
    let matched = matchRule(reservation, rules[0]);
    for (let i = 1; i < rules.length; i++) {
      const next = matchRule(reservation, rules[i]);
      matched = rules[i].logic === 'VEYA' ? matched || next : matched && next;
    }
    return matched;
  });
}

export function queueItemToRule(item: {
  id: string;
  categoryId: string;
  operator: string;
  value: string;
  logic: GraphicFilterLogic;
}): GraphicFilterRule {
  return {
    id: item.id,
    categoryId: item.categoryId,
    operator: item.operator,
    value: item.value,
    logic: item.logic,
  };
}

export function graphicFilterImpact(matrix: GraphicCalendarDay[]) {
  if (matrix.length === 0) {
    return { days: 0, totalDays: 0, avgRoomOcc: 0, avgPersonOcc: 0 };
  }
  const activeDays = matrix.filter((d) => d.totalBooked > 0).length;
  const avgRoomOcc =
    matrix.reduce((sum, d) => sum + d.occupancyPct, 0) / matrix.length;
  const avgPersonOcc = Math.min(100, Math.round(avgRoomOcc * 1.08 * 10) / 10);
  return {
    days: activeDays,
    totalDays: matrix.length,
    avgRoomOcc: Math.round(avgRoomOcc * 10) / 10,
    avgPersonOcc,
  };
}
