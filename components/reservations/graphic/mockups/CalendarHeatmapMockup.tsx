'use client';

import { useMemo, useState } from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { PROPERTY } from '@/lib/navigation';
import {
  buildCalendarHeatmapKpis,
  buildCalendarMonthGrid,
  downloadCalendarHeatmapCsv,
  formatGraphicMonthYear,
  heatmapCellClass,
  monthStartIso,
  type GraphicCalendarDay,
} from '@/lib/reservations/graphic-calendar';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export type CalendarHeatmapMockupProps = {
  matrix?: GraphicCalendarDay[];
  monthStart?: string;
  loading?: boolean;
  live?: boolean;
  onRefresh?: () => void;
  onShiftMonth?: (deltaMonths: number) => void;
};

/** Elektra — Takvim F1 aylık doluluk + gelir (canlı API veya demo) */
export function CalendarHeatmapMockup({
  matrix,
  monthStart = monthStartIso(PROPERTY.businessDate),
  loading = false,
  live = false,
  onRefresh,
  onShiftMonth,
}: CalendarHeatmapMockupProps = {}) {
  const [viewMode, setViewMode] = useState<'percent' | 'value'>('percent');
  const anchor = monthStartIso(monthStart);
  const monthLabel = formatGraphicMonthYear(anchor);

  const cells = useMemo(() => {
    if (matrix && matrix.length > 0) return buildCalendarMonthGrid(matrix, anchor);
    if (live) return buildCalendarMonthGrid([], anchor);

    const juneDays = Array.from({ length: 30 }, (_, i) => i + 1);
    const leading = 0;
    return [
      ...Array(leading).fill(null).map(() => ({
        date: null,
        day: null,
        occupancyPct: 0,
        revenue: 0,
        totalBooked: 0,
        totalAvail: 0,
      })),
      ...juneDays.map((day) => {
        const occ = 58 + ((day * 7) % 35);
        return {
          date: `2026-06-${String(day).padStart(2, '0')}`,
          day,
          occupancyPct: occ,
          revenue: Math.round(85000 + occ * 420),
          totalBooked: Math.round(occ * 0.77),
          totalAvail: Math.round(77 - occ * 0.77),
        };
      }),
    ];
  }, [anchor, live, matrix]);

  const kpis = useMemo(() => {
    if (matrix && matrix.length > 0) return buildCalendarHeatmapKpis(matrix);
    return [
      { label: 'Ortalama Doluluk', value: '%68,4', hint: 'Geçen ay: %62,7 ↑5,7%' },
      { label: 'Toplam Oda Geliri', value: '₺2.845.600', hint: 'Geçen ay: ₺2.410.800 ↑18%' },
      { label: 'RevPAR', value: '₺1.023', hint: 'Geçen ay: ₺886 ↑15,5%' },
      { label: 'Müsait Oda', value: '2.480', hint: 'Geçen ay: 2.480 —' },
    ];
  }, [matrix]);

  return (
    <div className="roomio-grafik-mockup roomio-grafik-mockup--calendar">
      {!live ? (
        <div className="roomio-grafik-mockup__badge">Mockup · Takvim F1 — Aylık Doluluk & Gelir</div>
      ) : (
        <div className="roomio-grafik-mockup__badge roomio-grafik-mockup__badge--live">
          Canlı API · {monthLabel}
          {loading ? ' · güncelleniyor…' : ''}
        </div>
      )}

      <div className="roomio-grafik-mockup__cal-toolbar">
        <button type="button" aria-label="Önceki ay" onClick={() => onShiftMonth?.(-1)} disabled={!onShiftMonth}>
          ‹
        </button>
        <strong>{monthLabel}</strong>
        <button type="button" aria-label="Sonraki ay" onClick={() => onShiftMonth?.(1)} disabled={!onShiftMonth}>
          ›
        </button>
        <div className="roomio-grafik-mockup__cal-actions">
          {live && onRefresh ? (
            <button type="button" onClick={onRefresh}>
              <RefreshCw size={14} aria-hidden /> Yenile
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => downloadCalendarHeatmapCsv(cells, monthLabel)}
          >
            <Download size={14} aria-hidden /> Excel&apos;e Aktar
          </button>
          <button type="button" onClick={() => window.print()}>
            <Printer size={14} aria-hidden /> Yazdır
          </button>
        </div>
      </div>

      <div className="roomio-grafik-mockup__kpis roomio-grafik-mockup__kpis--4">
        {kpis.map((k) => (
          <article key={k.label} className="roomio-grafik-mockup__kpi roomio-grafik-mockup__kpi--soft">
            <span className="roomio-grafik-mockup__kpi-label">{k.label}</span>
            <strong className="roomio-grafik-mockup__kpi-value">{k.value}</strong>
            <span className="roomio-grafik-mockup__kpi-prior">{k.hint}</span>
          </article>
        ))}
      </div>

      <div className="roomio-grafik-mockup__cal-legend">
        <span><i className="dot dot--occ" /> Doluluk %</span>
        <span><i className="dot dot--rev" /> Oda Geliri ₺</span>
        <div className="roomio-grafik-mockup__toggle">
          <button
            type="button"
            className={viewMode === 'percent' ? 'is-active' : ''}
            onClick={() => setViewMode('percent')}
          >
            Yüzde
          </button>
          <button
            type="button"
            className={viewMode === 'value' ? 'is-active' : ''}
            onClick={() => setViewMode('value')}
          >
            Değer
          </button>
        </div>
      </div>

      <div className="roomio-grafik-mockup__cal-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="roomio-grafik-mockup__cal-weekday">{d}</div>
        ))}
        {cells.map((cell, i) => {
          if (cell.day == null) {
            return <div key={`e-${i}`} className="roomio-grafik-mockup__cal-cell is-empty" />;
          }
          const heat = heatmapCellClass(cell.occupancyPct);
          const occLabel = `%${cell.occupancyPct.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
          const revLabel = `₺${cell.revenue.toLocaleString('tr-TR')}`;
          return (
            <div
              key={cell.date ?? `d-${i}`}
              className={`roomio-grafik-mockup__cal-cell ${heat}`}
              title={`${cell.date} · ${occLabel} · ${revLabel}`}
            >
              <span className="roomio-grafik-mockup__cal-day">{cell.day}</span>
              <span className="roomio-grafik-mockup__cal-occ">
                {viewMode === 'percent' ? occLabel : `${cell.totalBooked} dolu`}
              </span>
              <span className="roomio-grafik-mockup__cal-rev">
                {viewMode === 'percent' ? revLabel : `${cell.totalAvail} müsait`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
