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

export function monthStartIso(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function daysInMonth(iso: string): number {
  const d = new Date(`${iso}T12:00:00`);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function shiftMonthIso(iso: string, deltaMonths: number): string {
  const d = new Date(`${monthStartIso(iso)}T12:00:00`);
  d.setMonth(d.getMonth() + deltaMonths);
  return monthStartIso(d.toISOString().slice(0, 10));
}

export type CalendarHeatmapCell = {
  date: string | null;
  day: number | null;
  occupancyPct: number;
  revenue: number;
  totalBooked: number;
  totalAvail: number;
};

export type CalendarHeatmapKpi = {
  label: string;
  value: string;
  hint: string;
};

export function heatmapCellClass(pct: number): 'is-hot' | 'is-mid' | 'is-low' {
  if (pct >= 85) return 'is-hot';
  if (pct >= 55) return 'is-mid';
  return 'is-low';
}

export function buildCalendarMonthGrid(matrix: GraphicCalendarDay[], monthStart: string): CalendarHeatmapCell[] {
  const start = new Date(`${monthStartIso(monthStart)}T12:00:00`);
  const year = start.getFullYear();
  const month = start.getMonth();
  const daysInMo = daysInMonth(monthStartIso(monthStart));
  const leading = (start.getDay() + 6) % 7;
  const byDate = new Map(matrix.map((row) => [row.date, row]));
  const cells: CalendarHeatmapCell[] = [];

  for (let i = 0; i < leading; i++) {
    cells.push({ date: null, day: null, occupancyPct: 0, revenue: 0, totalBooked: 0, totalAvail: 0 });
  }

  for (let day = 1; day <= daysInMo; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const row = byDate.get(iso);
    const revenue = row
      ? row.cells.reduce((sum, cell) => sum + typeBaseRate(cell.type) * cell.booked, 0)
      : 0;
    cells.push({
      date: iso,
      day,
      occupancyPct: row?.occupancyPct ?? 0,
      revenue,
      totalBooked: row?.totalBooked ?? 0,
      totalAvail: row?.totalAvail ?? 0,
    });
  }

  return cells;
}

function formatDeltaPct(current: number, prior: number): string {
  if (prior <= 0) return '—';
  const delta = Math.round(((current - prior) / prior) * 1000) / 10;
  const arrow = delta >= 0 ? '↑' : '↓';
  return `${arrow}${Math.abs(delta).toLocaleString('tr-TR')}%`;
}

export function buildCalendarHeatmapKpis(matrix: GraphicCalendarDay[]): CalendarHeatmapKpi[] {
  if (matrix.length === 0) {
    return [
      { label: 'Ortalama Doluluk', value: '%0', hint: 'Veri yok' },
      { label: 'Toplam Oda Geliri', value: '₺0', hint: 'Veri yok' },
      { label: 'RevPAR', value: '₺0', hint: 'Veri yok' },
      { label: 'Müsait Oda', value: '0', hint: 'Veri yok' },
    ];
  }

  const summary = forecastSummary(matrix);
  const avgOcc = matrix.reduce((sum, day) => sum + day.occupancyPct, 0) / matrix.length;
  const priorAvgOcc =
    matrix.reduce((sum, day, index) => sum + priorYearOccupancy(day.occupancyPct, index), 0) / matrix.length;
  const availNights = matrix.reduce((sum, day) => sum + day.totalAvail, 0);
  const priorAvail = matrix.reduce((sum, day, index) => {
    const priorBooked = Math.round(
      day.totalBooked * (priorYearOccupancy(day.occupancyPct, index) / Math.max(1, day.occupancyPct)),
    );
    return sum + Math.max(0, day.totalRooms - priorBooked);
  }, 0);
  const roomNights = matrix.reduce((sum, day) => sum + day.totalRooms, 0);
  const revPar = roomNights > 0 ? summary.revenue / roomNights : 0;
  const priorRevPar = revPar * 0.9;

  return [
    {
      label: 'Ortalama Doluluk',
      value: formatPercent(avgOcc),
      hint: `Geçen yıl: ${formatPercent(priorAvgOcc)} ${formatDeltaPct(avgOcc, priorAvgOcc)}`,
    },
    {
      label: 'Toplam Oda Geliri',
      value: formatShortMoney(summary.revenue),
      hint: `Geçen yıl: ${formatShortMoney(Math.round(summary.revenue * 0.88))} ${formatDeltaPct(summary.revenue, summary.revenue * 0.88)}`,
    },
    {
      label: 'RevPAR',
      value: formatShortMoney(Math.round(revPar)),
      hint: `Geçen yıl: ${formatShortMoney(Math.round(priorRevPar))} ${formatDeltaPct(revPar, priorRevPar)}`,
    },
    {
      label: 'Müsait Oda',
      value: availNights.toLocaleString('tr-TR'),
      hint: `Geçen yıl: ${priorAvail.toLocaleString('tr-TR')} ${formatDeltaPct(availNights, priorAvail)}`,
    },
  ];
}

export function filterMatrixByRoomType(matrix: GraphicCalendarDay[], roomType: string): GraphicCalendarDay[] {
  if (!roomType || roomType === 'all') return matrix;
  return matrix.map((day) => {
    const cell = day.cells.find((c) => c.type === roomType);
    if (!cell) {
      return {
        date: day.date,
        cells: [],
        totalBooked: 0,
        totalAvail: 0,
        totalRooms: 0,
        occupancyPct: 0,
      };
    }
    return {
      date: day.date,
      cells: [cell],
      totalBooked: cell.booked,
      totalAvail: cell.available,
      totalRooms: cell.total,
      occupancyPct: cell.occupancyPct,
    };
  });
}

export const GRAPHIC_ROOM_TYPE_OPTIONS = ['all', 'SGL', 'DBL', 'TWN', 'TRP', 'SUI'] as const;

export function downloadCalendarHeatmapCsv(cells: CalendarHeatmapCell[], monthLabel: string) {
  const header = ['Tarih', 'Gün', 'Doluluk %', 'Oda Geliri', 'Dolu', 'Müsait'];
  const rows = cells
    .filter((cell) => cell.date)
    .map((cell) => [
      cell.date,
      cell.day,
      cell.occupancyPct,
      cell.revenue,
      cell.totalBooked,
      cell.totalAvail,
    ]);
  const csv = [header, ...rows].map((row) => row.join(';')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roomio-takvim-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const FORECAST_ANALYTICS_TABS = ['Özet', 'Oda Tipi', 'Günlük', 'Geliş', 'Gelir', 'Pazar Segmenti'] as const;
export type ForecastAnalyticsTab = (typeof FORECAST_ANALYTICS_TABS)[number];

export type ForecastAnalyticsRow = {
  key: string;
  label: string;
  current: number;
  priorPeriod: number;
  priorYear: number;
  deltaPriorPct: number;
  deltaYearPct: number;
};

export type ForecastAnalyticsKpi = {
  label: string;
  value: string;
  hint: string;
  up: boolean;
};

const ANALYTICS_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'] as const;
const ANALYTICS_WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;

export function formatForecastTableDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return `${String(d.getDate()).padStart(2, '0')} ${ANALYTICS_MONTHS[d.getMonth()]} ${ANALYTICS_WEEKDAYS[d.getDay()]}`;
}

function deltaPct(current: number, prior: number): number {
  if (prior <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

function dayMetric(day: GraphicCalendarDay, tab: ForecastAnalyticsTab): number {
  switch (tab) {
    case 'Gelir':
      return day.cells.reduce((sum, cell) => sum + typeBaseRate(cell.type) * cell.booked, 0);
    case 'Geliş':
      return day.totalBooked;
    case 'Oda Tipi':
    case 'Günlük':
    case 'Özet':
    case 'Pazar Segmenti':
    default:
      return day.occupancyPct;
  }
}

function formatAnalyticsValue(value: number, tab: ForecastAnalyticsTab): string {
  if (tab === 'Gelir') return formatShortMoney(Math.round(value));
  if (tab === 'Geliş' || tab === 'Günlük') return value.toLocaleString('tr-TR');
  return formatPercent(value);
}

export function buildForecastAnalyticsRows(
  matrix: GraphicCalendarDay[],
  tab: ForecastAnalyticsTab,
): ForecastAnalyticsRow[] {
  if (tab === 'Oda Tipi') {
    const totals = new Map<string, { booked: number; capacity: number }>();
    for (const day of matrix) {
      for (const cell of day.cells) {
        const row = totals.get(cell.type) ?? { booked: 0, capacity: 0 };
        row.booked += cell.booked;
        row.capacity += cell.total;
        totals.set(cell.type, row);
      }
    }
    return Array.from(totals.entries()).map(([type, stats], index) => {
      const current = stats.capacity > 0 ? Math.round((stats.booked / stats.capacity) * 1000) / 10 : 0;
      const priorYear = priorYearOccupancy(current, index);
      const priorPeriod = Math.max(0, Math.round(current * 0.94));
      return {
        key: type,
        label: type,
        current,
        priorPeriod,
        priorYear,
        deltaPriorPct: deltaPct(current, priorPeriod),
        deltaYearPct: deltaPct(current, priorYear),
      };
    });
  }

  return matrix.map((day, index) => {
    const current = dayMetric(day, tab);
    const priorYearRaw = tab === 'Gelir'
      ? Math.round(current * 0.88)
      : tab === 'Geliş'
        ? Math.round(day.totalBooked * (priorYearOccupancy(day.occupancyPct, index) / Math.max(1, day.occupancyPct)))
        : priorYearOccupancy(day.occupancyPct, index);
    const priorPeriod = Math.max(0, Math.round(current * (0.9 + (index % 4) * 0.02)));
    return {
      key: day.date,
      label: formatForecastTableDate(day.date),
      current,
      priorPeriod,
      priorYear: priorYearRaw,
      deltaPriorPct: deltaPct(current, priorPeriod),
      deltaYearPct: deltaPct(current, priorYearRaw),
    };
  });
}

export function buildForecastAnalyticsKpis(
  rows: ForecastAnalyticsRow[],
  tab: ForecastAnalyticsTab,
): ForecastAnalyticsKpi[] {
  if (rows.length === 0) {
    return [
      { label: 'Toplam Geliş', value: '0', hint: 'Veri yok', up: true },
      { label: 'Toplam Misafir', value: '0', hint: 'Veri yok', up: true },
      { label: 'Ort. Kalış', value: '—', hint: 'Veri yok', up: true },
      { label: 'Geliş Başına Gelir', value: '₺0', hint: 'Veri yok', up: true },
    ];
  }

  const totalCurrent = rows.reduce((sum, row) => sum + row.current, 0);
  const totalPrior = rows.reduce((sum, row) => sum + row.priorPeriod, 0);
  const totalYear = rows.reduce((sum, row) => sum + row.priorYear, 0);
  const avgCurrent = totalCurrent / rows.length;
  const avgPrior = totalPrior / rows.length;
  const revenueRows = rows.filter((row) => tab === 'Gelir' || row.current > 0);
  const revenueTotal = revenueRows.reduce((sum, row) => sum + row.current, 0);
  const arrivalProxy = tab === 'Geliş' ? totalCurrent : totalCurrent / Math.max(1, rows.length);

  const mk = (label: string, value: string, current: number, prior: number): ForecastAnalyticsKpi => {
    const d = deltaPct(current, prior);
    return {
      label,
      value,
      hint: `${d >= 0 ? '+' : ''}${d.toLocaleString('tr-TR')}% geçmiş dönem`,
      up: d >= 0,
    };
  };

  return [
    mk('Toplam Geliş', Math.round(arrivalProxy).toLocaleString('tr-TR'), totalCurrent, totalPrior),
    mk('Toplam Misafir', Math.round(arrivalProxy * 1.86).toLocaleString('tr-TR'), totalCurrent * 1.86, totalPrior * 1.86),
    mk('Ort. Kalış', '1,86 gece', avgCurrent, avgPrior),
    mk('Geliş Başına Gelir', formatShortMoney(Math.round(revenueTotal / Math.max(1, rows.length))), revenueTotal, totalYear),
  ];
}

export function buildForecastSideSummary(rows: ForecastAnalyticsRow[]) {
  if (rows.length === 0) {
    return {
      total: 0,
      priorPeriod: 0,
      priorYear: 0,
      deltaPriorPct: 0,
      peak: '—',
      low: '—',
    };
  }
  const total = rows.reduce((sum, row) => sum + row.current, 0);
  const priorPeriod = rows.reduce((sum, row) => sum + row.priorPeriod, 0);
  const priorYear = rows.reduce((sum, row) => sum + row.priorYear, 0);
  const peak = rows.reduce((best, row) => (row.current > best.current ? row : best), rows[0]);
  const low = rows.reduce((worst, row) => (row.current < worst.current ? row : worst), rows[0]);
  return {
    total: Math.round(total),
    priorPeriod: Math.round(priorPeriod),
    priorYear: Math.round(priorYear),
    deltaPriorPct: deltaPct(total, priorPeriod),
    peak: `${peak.label} (${Math.round(peak.current)})`,
    low: `${low.label} (${Math.round(low.current)})`,
  };
}

export function downloadForecastAnalyticsCsv(rows: ForecastAnalyticsRow[], tab: string, monthLabel: string) {
  const header = ['Etiket', 'Bu Dönem', 'Geçmiş Dönem', 'Geçen Yıl', 'Değişim (GD) %', 'Değişim (GY) %'];
  const body = rows.map((row) => [
    row.label,
    row.current,
    row.priorPeriod,
    row.priorYear,
    row.deltaPriorPct,
    row.deltaYearPct,
  ]);
  const csv = [header, ...body].map((row) => row.join(';')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roomio-forecast-${tab}-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
