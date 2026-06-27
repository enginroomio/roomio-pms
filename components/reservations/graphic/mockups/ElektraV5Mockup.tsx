'use client';

import { useMemo, useState } from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { PROPERTY } from '@/lib/navigation';
import { GraphicCharts } from '@/components/reservations/graphic/GraphicCharts';
import {
  buildChartPoints,
  buildGraphicKpis,
  daysInMonth,
  filterMatrixByRoomType,
  formatForecastDate,
  formatGraphicMonthYear,
  GRAPHIC_ROOM_TYPE_OPTIONS,
  monthStartIso,
  shiftMonthIso,
  type GraphicCalendarDay,
} from '@/lib/reservations/graphic-calendar';

const DEMO_OCC = [72, 68, 75, 81, 79, 84, 88, 85, 82, 78, 76, 80, 83, 86, 89, 87, 84, 81, 78, 74, 71, 69, 73, 77, 80, 83, 85, 82, 79, 76, 74];

export type ElektraV5MockupProps = {
  matrix?: GraphicCalendarDay[];
  from?: string;
  days?: number;
  loading?: boolean;
  live?: boolean;
  onRefresh?: () => void;
  onShiftMonth?: (deltaMonths: number) => void;
  onExport?: () => void;
};

function formatDelta(deltaPct: number): { text: string; up: boolean } {
  const up = deltaPct >= 0;
  const arrow = up ? '+' : '';
  return { text: `${arrow}${deltaPct.toLocaleString('tr-TR')}%`, up };
}

/** Elektra v5 — detaylı doluluk grafiği (canlı API veya demo) */
export function ElektraV5Mockup({
  matrix,
  from = PROPERTY.businessDate,
  days = 31,
  loading = false,
  live = false,
  onRefresh,
  onShiftMonth,
  onExport,
}: ElektraV5MockupProps = {}) {
  const [roomType, setRoomType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  const anchor = monthStartIso(from);
  const monthLabel = formatGraphicMonthYear(anchor);
  const dateTo = formatForecastDate(
    matrix?.length ? matrix[matrix.length - 1].date : `${anchor.slice(0, 8)}${String(daysInMonth(anchor)).padStart(2, '0')}`,
  );

  const filteredMatrix = useMemo(() => {
    if (!matrix || matrix.length === 0) return [];
    return filterMatrixByRoomType(matrix, roomType);
  }, [matrix, roomType]);

  const chartPoints = useMemo(
    () => buildChartPoints(filteredMatrix, PROPERTY.businessDate),
    [filteredMatrix],
  );

  const kpiCards = useMemo(() => {
    if (filteredMatrix.length > 0) {
      const items = buildGraphicKpis(filteredMatrix);
      return items.map((item) => {
        const { text, up } = formatDelta(item.deltaPct);
        return {
          label: item.label,
          value: item.value.replace(/^%/, ''),
          prior: item.priorValue.replace(/^%/, ''),
          delta: text,
          up,
        };
      });
    }
    return [
      { label: 'Ortalama Doluluk %', value: '78,6', prior: '65,4', delta: '+13,2%', up: true },
      { label: 'Toplam Oda Gecelemesi', value: '1.917', prior: '1.595', delta: '+20,2%', up: true },
      { label: 'Toplam Müsait Oda Gecelemesi', value: '2.438', prior: '2.443', delta: '-0,2%', up: false },
      { label: 'Dolu Oda Gecelemesi', value: '1.917', prior: '1.595', delta: '+20,2%', up: true },
      { label: 'Müsait Oda Gecelemesi', value: '521', prior: '848', delta: '-38,5%', up: false },
    ];
  }, [filteredMatrix]);

  const occCurrent = live && filteredMatrix.length > 0
    ? filteredMatrix.map((day) => day.occupancyPct)
    : DEMO_OCC;
  const occPrior = occCurrent.map((v, i) => Math.max(55, v - 12 + (i % 5)));

  return (
    <div className="roomio-grafik-mockup roomio-grafik-mockup--elektra">
      {!live ? (
        <div className="roomio-grafik-mockup__badge">Mockup · Elektra v5 — Detaylı Doluluk Grafiği</div>
      ) : (
        <div className="roomio-grafik-mockup__badge roomio-grafik-mockup__badge--live">
          Canlı API · {monthLabel}
          {loading ? ' · güncelleniyor…' : ` · ${filteredMatrix.length} gün`}
        </div>
      )}

      <div className="roomio-grafik-mockup__filterbar">
        <label>
          <span>Otel</span>
          <select defaultValue="ist" disabled={live}>
            <option value="ist">Hotel Sapphire İstanbul</option>
          </select>
        </label>
        <label>
          <span>Tarih Aralığı</span>
          <input readOnly value={`${formatForecastDate(anchor)} — ${dateTo}`} />
        </label>
        <label>
          <span>Görünüm</span>
          <div className="roomio-grafik-mockup__seg">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={viewMode === mode ? 'is-active' : ''}
                onClick={() => setViewMode(mode)}
                disabled={live && mode !== 'day'}
              >
                {mode === 'day' ? 'Gün' : mode === 'week' ? 'Hafta' : 'Ay'}
              </button>
            ))}
          </div>
        </label>
        <label>
          <span>Oda Tipi</span>
          <select value={roomType} onChange={(e) => setRoomType(e.target.value)} disabled={!live && false}>
            <option value="all">Tümü</option>
            {GRAPHIC_ROOM_TYPE_OPTIONS.filter((t) => t !== 'all').map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        {live && onShiftMonth ? (
          <>
            <button type="button" className="roomio-grafik-mockup__report" onClick={() => onShiftMonth(-1)}>‹ Ay</button>
            <button type="button" className="roomio-grafik-mockup__report" onClick={() => onShiftMonth(1)}>Ay ›</button>
          </>
        ) : (
          <button type="button" className="roomio-grafik-mockup__report">Raporla</button>
        )}
        {live && onRefresh ? (
          <button type="button" className="roomio-grafik-mockup__export" onClick={onRefresh}>
            <RefreshCw size={14} aria-hidden /> Yenile
          </button>
        ) : null}
        <button
          type="button"
          className="roomio-grafik-mockup__export"
          onClick={() => (onExport ? onExport() : window.print())}
        >
          <Download size={14} aria-hidden /> Dışa Aktar
        </button>
        <button type="button" className="roomio-grafik-mockup__export" onClick={() => window.print()}>
          <Printer size={14} aria-hidden /> Yazdır
        </button>
      </div>

      <div className="roomio-grafik-mockup__kpis">
        {kpiCards.map((k) => (
          <article key={k.label} className="roomio-grafik-mockup__kpi">
            <span className="roomio-grafik-mockup__kpi-label">{k.label}</span>
            <strong className="roomio-grafik-mockup__kpi-value">{k.value}</strong>
            <span className="roomio-grafik-mockup__kpi-prior">Geçen Yıl: {k.prior}</span>
            <span className={`roomio-grafik-mockup__kpi-delta${k.up ? ' is-up' : ' is-down'}`}>{k.delta}</span>
          </article>
        ))}
      </div>

      {live && chartPoints.length > 0 ? (
        <div className="roomio-grafik-mockup__charts-live">
          <GraphicCharts points={chartPoints} />
        </div>
      ) : (
        <>
          <section className="roomio-grafik-mockup__chart-block">
            <header>
              <h3>Günlük Doluluk Oranları (%)</h3>
              <div className="roomio-grafik-mockup__legend">
                <span><i className="line line--cur" /> Bu Yıl (%)</span>
                <span><i className="line line--prior" /> Geçen Yıl (%)</span>
              </div>
            </header>
            <svg viewBox="0 0 1100 260" className="roomio-grafik-mockup__svg" aria-hidden>
              {[0, 25, 50, 75, 100].map((t) => (
                <g key={t}>
                  <line x1="48" y1={220 - t * 1.7} x2="1080" y2={220 - t * 1.7} stroke="#e8edf2" />
                  <text x="40" y={224 - t * 1.7} textAnchor="end" fill="#64748b" fontSize="11">{t}%</text>
                </g>
              ))}
              <rect x="700" y="24" width="380" height="196" fill="rgba(241,245,249,0.9)" />
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="6 4"
                points={occPrior.map((v, i) => `${48 + i * 34},${220 - v * 1.7}`).join(' ')}
              />
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                points={occCurrent.map((v, i) => `${48 + i * 34},${220 - v * 1.7}`).join(' ')}
              />
              {occCurrent.slice(0, 20).map((v, i) => (
                <text key={i} x={48 + i * 34} y={220 - v * 1.7 - 8} textAnchor="middle" fill="#065f46" fontSize="10" fontWeight="700">{v}</text>
              ))}
            </svg>
          </section>

          <section className="roomio-grafik-mockup__chart-block">
            <header>
              <h3>Günlük Oda Gecelemeleri (Adet)</h3>
              <div className="roomio-grafik-mockup__legend">
                <span><i className="bar bar--booked" /> Dolu (Bu Yıl)</span>
                <span><i className="bar bar--avail" /> Müsait (Bu Yıl)</span>
              </div>
            </header>
            <svg viewBox="0 0 1100 260" className="roomio-grafik-mockup__svg" aria-hidden>
              {[0, 25, 50, 75, 100].map((t) => (
                <line key={t} x1="48" y1={220 - t * 1.7} x2="1080" y2={220 - t * 1.7} stroke="#e8edf2" />
              ))}
              {occCurrent.slice(0, 20).map((v, i) => {
                const booked = Math.round(v * 0.7);
                const avail = 100 - booked;
                const x = 48 + i * 34;
                return (
                  <g key={i}>
                    <rect x={x - 10} y={220 - avail * 1.7 - booked * 1.7} width="20" height={booked * 1.7} fill="#059669" rx="2" />
                    <rect x={x - 10} y={220 - avail * 1.7} width="20" height={avail * 1.7} fill="#bbf7d0" rx="2" />
                  </g>
                );
              })}
            </svg>
          </section>
        </>
      )}

      <div className="roomio-grafik-mockup__info">
        {live
          ? 'Seçilen tarih aralığında canlı rezervasyon verisiyle doluluk ve oda gecelemesi dağılımı. Oda tipi filtresi anında uygulanır.'
          : 'Seçilen tarih aralığında geceleme bazlı doluluk ve oda gecelemesi dağılımı gösterilir. Tahmin bölgesi iş günü sonrasını içerir.'}
      </div>
    </div>
  );
}
