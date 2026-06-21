import { ROOM_TYPES, type RoomTypeCode } from '@/lib/rooms/room-types';

export type GraphicCalendarCell = {
  type: string;
  booked: number;
  available: number;
  total: number;
  occupancyPct: number;
};

export type GraphicCalendarDay = {
  date: string;
  cells: GraphicCalendarCell[];
  totalAvail: number;
  totalBooked: number;
  totalRooms: number;
  occupancyPct: number;
};

export type GraphicKpi = {
  label: string;
  value: string;
  priorLabel: string;
  priorValue: string;
  deltaPct: number;
};

export type ChartPoint = {
  date: string;
  label: string;
  value: number;
  priorValue: number;
  booked: number;
  available: number;
  priorBooked: number;
  priorAvailable: number;
  isForecast: boolean;
};

export const GRAPHIC_ROOM_TYPES: RoomTypeCode[] = ['SGL', 'DBL', 'TWN', 'TPL', 'SUI'];

export const GRAPHIC_RANGE_OPTIONS = [7, 14, 30, 31] as const;
export type GraphicRangeDays = (typeof GRAPHIC_RANGE_OPTIONS)[number];

const FORECAST_WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;

export type ForecastBar = {
  day: number;
  label: string;
  date: string;
  occupied: number;
  empty: number;
  totalRooms: number;
};

export function buildForecastBars(matrix: GraphicCalendarDay[]): ForecastBar[] {
  return matrix.map((day, index) => {
    const d = new Date(`${day.date}T12:00:00`);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const wd = FORECAST_WEEKDAYS[(d.getDay() + 6) % 7];
    return {
      day: index + 1,
      label: `${dd}/${mm} ${wd}`,
      date: day.date,
      occupied: day.totalBooked,
      empty: day.totalAvail,
      totalRooms: day.totalRooms,
    };
  });
}

export function forecastSummary(matrix: GraphicCalendarDay[]) {
  if (matrix.length === 0) {
    return { booked: 0, capacity: 0, occupancyPct: 0, revenue: 0 };
  }
  const booked = matrix.reduce((s, d) => s + d.totalBooked, 0);
  const capacity = matrix.reduce((s, d) => s + d.totalRooms, 0);
  const occupancyPct = capacity > 0 ? Math.round((booked / capacity) * 1000) / 10 : 0;
  const revenue = matrix.reduce((s, day) => {
    const dayRev = day.cells.reduce((acc, c) => acc + typeBaseRate(c.type) * c.booked, 0);
    return s + dayRev;
  }, 0);
  return { booked, capacity, occupancyPct, revenue };
}

export function formatForecastDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function formatGraphicDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export function formatGraphicDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

export function formatGraphicMonthYear(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

export function shiftIsoDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Elektra v5 — doluluk seviyesi (sol accent + mini bar) */
export function occupancyAccentColor(pct: number): string {
  if (pct >= 90) return '#dc2626';
  if (pct >= 75) return '#ea580c';
  if (pct >= 55) return '#ca8a04';
  if (pct >= 30) return '#059669';
  return '#0d9488';
}

export function occupancyBarFill(pct: number): string {
  if (pct >= 90) return 'linear-gradient(90deg, #fecaca, #ef4444)';
  if (pct >= 75) return 'linear-gradient(90deg, #fed7aa, #f97316)';
  if (pct >= 55) return 'linear-gradient(90deg, #fef08a, #eab308)';
  if (pct >= 30) return 'linear-gradient(90deg, #bbf7d0, #22c55e)';
  return 'linear-gradient(90deg, #ccfbf1, #14b8a6)';
}

export function typeBaseRate(type: string): number {
  const code = type === 'TRP' ? 'TPL' : type;
  return ROOM_TYPES[code as RoomTypeCode]?.baseRate ?? 0;
}

export function formatShortMoney(value: number) {
  if (value >= 1_000_000) return `₺${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `₺${Math.round(value / 1000)}k`;
  return `₺${value.toLocaleString('tr-TR')}`;
}

export function formatPercent(value: number) {
  return `%${value.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
}

/** Demo karşılaştırma — geçen yıl eğrisi (deterministik) */
export function priorYearOccupancy(pct: number, index: number): number {
  const swing = ((index * 7) % 11) - 5;
  return Math.max(0, Math.min(100, Math.round(pct * 0.88 + swing)));
}

export function buildChartPoints(matrix: GraphicCalendarDay[], businessDate: string): ChartPoint[] {
  return matrix.map((day, index) => {
    const priorOcc = priorYearOccupancy(day.occupancyPct, index);
    const priorBooked = Math.round(day.totalBooked * (priorOcc / Math.max(1, day.occupancyPct)));
    const priorAvailable = Math.max(0, day.totalRooms - priorBooked);
    return {
      date: day.date,
      label: formatGraphicDay(day.date),
      value: day.occupancyPct,
      priorValue: priorOcc,
      booked: day.totalBooked,
      available: day.totalAvail,
      priorBooked,
      priorAvailable,
      isForecast: day.date > businessDate,
    };
  });
}

export function buildGraphicKpis(matrix: GraphicCalendarDay[]): GraphicKpi[] {
  if (matrix.length === 0) {
    return [];
  }

  const avgOcc = matrix.reduce((s, d) => s + d.occupancyPct, 0) / matrix.length;
  const priorAvgOcc =
    matrix.reduce((s, d, i) => s + priorYearOccupancy(d.occupancyPct, i), 0) / matrix.length;
  const occupiedNights = matrix.reduce((s, d) => s + d.totalBooked, 0);
  const priorOccupied = matrix.reduce(
    (s, d, i) => s + Math.round(d.totalBooked * (priorYearOccupancy(d.occupancyPct, i) / Math.max(1, d.occupancyPct))),
    0,
  );
  const availableNights = matrix.reduce((s, d) => s + d.totalAvail, 0);
  const priorAvailable = matrix.reduce(
    (s, d, i) => {
      const priorBooked = Math.round(d.totalBooked * (priorYearOccupancy(d.occupancyPct, i) / Math.max(1, d.occupancyPct)));
      return s + Math.max(0, d.totalRooms - priorBooked);
    },
    0,
  );
  const roomCapacityNights = matrix.reduce((s, d) => s + d.totalRooms, 0);
  const revPar = matrix.reduce((s, d) => {
    const avgRate =
      d.cells.reduce((acc, c) => acc + typeBaseRate(c.type) * c.booked, 0) / Math.max(1, d.totalBooked);
    return s + (d.totalBooked / Math.max(1, d.totalRooms)) * avgRate;
  }, 0) / matrix.length;

  const delta = (current: number, prior: number) =>
    prior > 0 ? Math.round(((current - prior) / prior) * 1000) / 10 : 0;

  return [
    {
      label: 'Ortalama Doluluk',
      value: formatPercent(avgOcc),
      priorLabel: 'Geçen yıl',
      priorValue: formatPercent(priorAvgOcc),
      deltaPct: delta(avgOcc, priorAvgOcc),
    },
    {
      label: 'Dolu Oda Gecelemesi',
      value: occupiedNights.toLocaleString('tr-TR'),
      priorLabel: 'Geçen yıl',
      priorValue: priorOccupied.toLocaleString('tr-TR'),
      deltaPct: delta(occupiedNights, priorOccupied),
    },
    {
      label: 'Müsait Oda Gecelemesi',
      value: availableNights.toLocaleString('tr-TR'),
      priorLabel: 'Geçen yıl',
      priorValue: priorAvailable.toLocaleString('tr-TR'),
      deltaPct: delta(availableNights, priorAvailable),
    },
    {
      label: 'Toplam Kapasite',
      value: roomCapacityNights.toLocaleString('tr-TR'),
      priorLabel: 'Geçen yıl',
      priorValue: roomCapacityNights.toLocaleString('tr-TR'),
      deltaPct: 0,
    },
    {
      label: 'RevPAR (tahmini)',
      value: formatShortMoney(Math.round(revPar)),
      priorLabel: 'Geçen yıl',
      priorValue: formatShortMoney(Math.round(revPar * 0.9)),
      deltaPct: 11.1,
    },
  ];
}

export function chartScale(values: number[], padding = 8) {
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 100);
  const span = Math.max(max - min, 1);
  return { min: min - padding, max: max + padding, span: span + padding * 2 };
}

export function linePath(
  points: { x: number; y: number }[],
  closeBottom?: number,
): string {
  if (points.length === 0) return '';
  const head = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  if (closeBottom == null) return head;
  const last = points[points.length - 1];
  const first = points[0];
  return `${head} L ${last.x.toFixed(2)} ${closeBottom.toFixed(2)} L ${first.x.toFixed(2)} ${closeBottom.toFixed(2)} Z`;
}
