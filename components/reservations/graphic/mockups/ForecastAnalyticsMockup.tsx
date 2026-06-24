'use client';

import { useMemo, useState } from 'react';
import { Download, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { PROPERTY } from '@/lib/navigation';
import {
  buildForecastAnalyticsKpis,
  buildForecastAnalyticsRows,
  buildForecastSideSummary,
  daysInMonth,
  downloadForecastAnalyticsCsv,
  FORECAST_ANALYTICS_TABS,
  formatForecastDate,
  formatGraphicMonthYear,
  monthStartIso,
  type ForecastAnalyticsTab,
  type GraphicCalendarDay,
} from '@/lib/reservations/graphic-calendar';

// Re-export format helper used in component
function formatCellValue(value: number, tab: ForecastAnalyticsTab): string {
  if (tab === 'Gelir') return `₺${Math.round(value).toLocaleString('tr-TR')}`;
  if (tab === 'Geliş' || tab === 'Günlük' || tab === 'Oda Tipi') return Math.round(value).toLocaleString('tr-TR');
  return `%${value.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
}

function formatDelta(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toLocaleString('tr-TR')}%`;
}

const DEMO_BARS = [42, 38, 55, 48, 62, 58, 71, 65, 78, 72, 68, 74, 81, 76];

export type ForecastAnalyticsMockupProps = {
  matrix?: GraphicCalendarDay[];
  from?: string;
  loading?: boolean;
  live?: boolean;
  onRefresh?: () => void;
  onShiftMonth?: (deltaMonths: number) => void;
  onOpenFilterWizard?: () => void;
};

/** Forecast — doluluk grafik & analiz (canlı API veya demo) */
export function ForecastAnalyticsMockup({
  matrix,
  from = PROPERTY.businessDate,
  loading = false,
  live = false,
  onRefresh,
  onShiftMonth,
  onOpenFilterWizard,
}: ForecastAnalyticsMockupProps = {}) {
  const [tab, setTab] = useState<ForecastAnalyticsTab>('Geliş');

  const anchor = monthStartIso(from);
  const monthLabel = formatGraphicMonthYear(anchor);
  const dateRange = `${formatForecastDate(anchor)} — ${formatForecastDate(
    matrix?.length ? matrix[matrix.length - 1].date : `${anchor.slice(0, 8)}${String(daysInMonth(anchor)).padStart(2, '0')}`,
  )}`;

  const rows = useMemo(() => {
    if (matrix && matrix.length > 0) return buildForecastAnalyticsRows(matrix, tab);
    return null;
  }, [matrix, tab]);

  const kpis = useMemo(() => {
    if (rows) return buildForecastAnalyticsKpis(rows, tab);
    return [
      { label: 'Toplam Geliş', value: '1.248', hint: '+12,4% geçmiş dönem', up: true },
      { label: 'Toplam Misafir', value: '2.318', hint: '+10,1% geçmiş dönem', up: true },
      { label: 'Ort. Kalış', value: '1,86 gece', hint: '+3,2% geçmiş dönem', up: true },
      { label: 'Geliş Başına Gelir', value: '₺112,74', hint: '+8,7% geçmiş dönem', up: true },
    ];
  }, [rows, tab]);

  const side = useMemo(() => {
    if (rows) return buildForecastSideSummary(rows);
    return {
      total: 1248,
      priorPeriod: 1110,
      priorYear: 1063,
      deltaPriorPct: 12.4,
      peak: '15 Haz (98)',
      low: '02 Haz (24)',
    };
  }, [rows]);

  const chartRows = rows ?? [];
  const chartBars = chartRows.length > 0
    ? chartRows.slice(0, 14).map((row) => row.current)
    : DEMO_BARS;
  const maxBar = Math.max(1, ...chartBars, ...chartRows.map((r) => r.priorPeriod));

  const tableRows = rows ?? [
    { key: '1', label: '01 Haz Cmt', current: 42, priorPeriod: 38, priorYear: 35, deltaPriorPct: 10.5, deltaYearPct: 20 },
    { key: '2', label: '02 Haz Paz', current: 24, priorPeriod: 28, priorYear: 22, deltaPriorPct: -14.3, deltaYearPct: 9.1 },
    { key: '3', label: '03 Haz Pzt', current: 55, priorPeriod: 48, priorYear: 44, deltaPriorPct: 14.6, deltaYearPct: 25 },
  ] as typeof chartRows;

  const chartTitle = tab === 'Oda Tipi'
    ? 'Oda Tipi Doluluk %'
    : tab === 'Gelir'
      ? 'Günlük Oda Geliri'
      : tab === 'Geliş'
        ? 'Günlük Geliş Sayısı'
        : `Günlük ${tab} — ${tab}`;

  return (
    <div className="roomio-grafik-mockup roomio-grafik-mockup--forecast">
      {!live ? (
        <div className="roomio-grafik-mockup__badge">Mockup · Forecast — Doluluk Grafik & Analiz</div>
      ) : (
        <div className="roomio-grafik-mockup__badge roomio-grafik-mockup__badge--live">
          Canlı API · {monthLabel}
          {loading ? ' · güncelleniyor…' : ` · ${matrix?.length ?? 0} gün`}
        </div>
      )}

      <div className="roomio-grafik-mockup__forecast-head">
        <div>
          <h2>Doluluk Grafik ve Analizleri</h2>
          <p>{dateRange}</p>
        </div>
        <div className="roomio-grafik-mockup__forecast-actions">
          {onOpenFilterWizard ? (
            <button type="button" onClick={onOpenFilterWizard}>
              <SlidersHorizontal size={14} aria-hidden /> Filtrele
            </button>
          ) : (
            <button type="button">Filtrele</button>
          )}
          {live && onShiftMonth ? (
            <>
              <button type="button" onClick={() => onShiftMonth(-1)}>‹ Ay</button>
              <button type="button" onClick={() => onShiftMonth(1)}>Ay ›</button>
            </>
          ) : null}
          {live && onRefresh ? (
            <button type="button" onClick={onRefresh}>
              <RefreshCw size={14} aria-hidden /> Yenile
            </button>
          ) : null}
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              if (rows) downloadForecastAnalyticsCsv(rows, tab, monthLabel);
            }}
          >
            <Download size={14} aria-hidden /> Excel&apos;e Aktar
          </button>
        </div>
      </div>

      <div className="roomio-grafik-mockup__tabs" role="tablist">
        {FORECAST_ANALYTICS_TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'is-active' : ''}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="roomio-grafik-mockup__kpis roomio-grafik-mockup__kpis--4">
        {kpis.map((k) => (
          <article key={k.label} className="roomio-grafik-mockup__kpi roomio-grafik-mockup__kpi--soft">
            <span className="roomio-grafik-mockup__kpi-label">{k.label}</span>
            <strong className="roomio-grafik-mockup__kpi-value">{k.value}</strong>
            <span className={`roomio-grafik-mockup__kpi-prior${k.up ? ' is-up' : ' is-down'}`}>{k.hint}</span>
          </article>
        ))}
      </div>

      <div className="roomio-grafik-mockup__forecast-body">
        <section className="roomio-grafik-mockup__chart-block roomio-grafik-mockup__chart-block--wide">
          <header>
            <h3>{chartTitle}</h3>
            <div className="roomio-grafik-mockup__legend">
              <span><i className="bar bar--booked" /> Bu Dönem</span>
              <span><i className="bar bar--prior" /> Geçmiş Dönem</span>
              <span><i className="line line--prior" /> Geçen Yıl</span>
            </div>
          </header>
          <svg viewBox="0 0 800 220" className="roomio-grafik-mockup__svg" aria-hidden>
            {chartBars.map((value, i) => {
              const row = chartRows[i];
              const prior = row?.priorPeriod ?? value * 0.9;
              const x = 40 + i * 52;
              const h = (value / maxBar) * 160;
              const priorH = (prior / maxBar) * 160;
              return (
                <g key={row?.key ?? i}>
                  <rect x={x} y={180 - priorH * 0.85} width="18" height={priorH * 0.85} fill="#bae6fd" rx="2" />
                  <rect x={x + 4} y={180 - h} width="18" height={h} fill="#0f766e" rx="2" />
                  <circle cx={x + 22} cy={180 - (row?.priorYear ?? prior) / maxBar * 160 - 8} r="3" fill="#7c3aed" />
                </g>
              );
            })}
          </svg>
        </section>

        <aside className="roomio-grafik-mockup__side">
          <h4>Dönem Özeti</h4>
          <dl>
            <div><dt>Toplam</dt><dd>{side.total.toLocaleString('tr-TR')}</dd></div>
            <div><dt>Geçmiş Dönem</dt><dd>{side.priorPeriod.toLocaleString('tr-TR')}</dd></div>
            <div><dt>Geçen Yıl</dt><dd>{side.priorYear.toLocaleString('tr-TR')}</dd></div>
            <div>
              <dt>Değişim (GD)</dt>
              <dd className={side.deltaPriorPct >= 0 ? 'is-up' : 'is-down'}>
                {side.deltaPriorPct >= 0 ? '↑' : '↓'} %{Math.abs(side.deltaPriorPct).toLocaleString('tr-TR')}
              </dd>
            </div>
            <div><dt>En Yüksek</dt><dd>{side.peak}</dd></div>
            <div><dt>En Düşük</dt><dd>{side.low}</dd></div>
          </dl>
        </aside>
      </div>

      <table className="roomio-grafik-mockup__table">
        <thead>
          <tr>
            <th>{tab === 'Oda Tipi' ? 'Oda Tipi' : 'Tarih'}</th>
            <th>Bu Dönem</th>
            <th>Geçmiş Dönem</th>
            <th>Geçen Yıl</th>
            <th>Değişim (GD)</th>
            <th>Değişim (GY)</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.slice(0, live ? 12 : 3).map((row) => (
            <tr key={row.key}>
              <td>{row.label}</td>
              <td>{formatCellValue(row.current, tab)}</td>
              <td>{formatCellValue(row.priorPeriod, tab)}</td>
              <td>{formatCellValue(row.priorYear, tab)}</td>
              <td className={row.deltaPriorPct >= 0 ? 'is-up' : 'is-down'}>{formatDelta(row.deltaPriorPct)}</td>
              <td className={row.deltaYearPct >= 0 ? 'is-up' : 'is-down'}>{formatDelta(row.deltaYearPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
