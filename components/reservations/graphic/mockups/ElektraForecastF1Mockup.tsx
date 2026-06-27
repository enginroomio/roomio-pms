'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { PROPERTY } from '@/lib/navigation';
import {
  buildForecastBars,
  formatForecastDate,
  forecastSummary,
  shiftIsoDate,
  type ForecastBar,
  type GraphicCalendarDay,
} from '@/lib/reservations/graphic-calendar';

const MAIN_TABS = [
  'Liste',
  'Grafik',
  'Analiz',
  'Oda Tipi Analiz',
  'Acenta Analiz',
  'Dönem Analiz',
  'Günlük Listeler',
  'İndirim Analizi',
  'Pansiyon F.',
  'Yıllık',
  'İptal Analizi',
  'EGM Grafiği',
  'TGA Grafiği',
  'TİS Grafiği',
] as const;

const METRIC_TABS = ['Doluluk', 'Hareketlilik', 'Gelir', 'Ortalama', 'Oranlar'] as const;

const CHECKBOXES = [
  { id: 'dolu-oda', label: 'Dolu Oda', checked: true },
  { id: 'bos-oda', label: 'Boş Oda', checked: true },
  { id: 'dolu-yatak', label: 'Dolu Yatak', checked: false },
  { id: 'bos-yatak', label: 'Boş Yatak', checked: false },
  { id: 'arizali', label: 'Arızalı Oda', checked: false },
  { id: 'garanti', label: 'Garanti Oda', checked: false },
  { id: 'on-forecast', label: 'Ön Forecast', checked: false },
  { id: 'kontenjan', label: 'Kontenjan', checked: false },
  { id: 'cocuk-ucretsiz', label: 'Total Children Free', checked: false },
  { id: 'cocuk-ucretli', label: 'Total Children Paid', checked: false },
  { id: 'yetiskin', label: 'Total Adults', checked: false },
  { id: 'kisi', label: 'Total Persons', checked: false },
] as const;

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function formatDayLabel(dayIndex: number) {
  const d = new Date(2026, 5, 20 + dayIndex);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const wd = WEEKDAYS[(d.getDay() + 6) % 7];
  return `${dd}/${mm} ${wd}`;
}

function demoBars(): ForecastBar[] {
  return Array.from({ length: 31 }, (_, i) => {
    const occupied = 8 + (i % 3 === 0 ? 1 : 0);
    const totalRooms = 77;
    const empty = totalRooms - occupied - (i % 5 === 0 ? 1 : 0);
    const pax = Math.round(occupied * 2.1);
    const paxCapacity = totalRooms * 2;
    return {
      day: i + 1,
      label: formatDayLabel(i),
      date: shiftIsoDate(PROPERTY.businessDate, i),
      occupied,
      empty,
      totalRooms,
      pax,
      paxCapacity,
      roomOccPct: Math.round((occupied / totalRooms) * 100),
      paxOccPct: Math.round((pax / paxCapacity) * 100),
    };
  });
}

export type ElektraForecastF1MockupProps = {
  matrix?: GraphicCalendarDay[];
  from?: string;
  days?: number;
  loading?: boolean;
  fill?: boolean;
  onRefresh?: () => void;
  onShiftFrom?: (deltaDays: number) => void;
  onResetFrom?: () => void;
  onOpenFilterWizard?: () => void;
};

/** Elektra v5 Forecast — orijinal düzen, modern görünüm */
export function ElektraForecastF1Mockup({
  matrix,
  from = PROPERTY.businessDate,
  days = 31,
  loading = false,
  fill = false,
  onRefresh,
  onShiftFrom,
  onResetFrom,
  onOpenFilterWizard,
}: ElektraForecastF1MockupProps = {}) {
  const [mainTab, setMainTab] = useState<(typeof MAIN_TABS)[number]>('Grafik');
  const [metricTab, setMetricTab] = useState<(typeof METRIC_TABS)[number]>('Doluluk');
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CHECKBOXES.map((c) => [c.id, c.checked])),
  );
  const [threeD, setThreeD] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartH, setChartH] = useState(280);

  const live = matrix !== undefined;
  const bars = useMemo(() => {
    if (matrix && matrix.length > 0) return buildForecastBars(matrix);
    if (live) return [] as ForecastBar[];
    return demoBars();
  }, [live, matrix]);

  useLayoutEffect(() => {
    if (!fill) {
      setChartH(280);
      return;
    }
    const el = chartRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight - 28;
      setChartH(Math.max(220, h));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fill, bars.length, mainTab]);

  const summary = useMemo(() => {
    if (matrix && matrix.length > 0) return forecastSummary(matrix);
    return { booked: 18, capacity: 2387, occupancyPct: 0.75, revenue: 49800 };
  }, [matrix]);

  const dateFrom = formatForecastDate(from);
  const dateTo = formatForecastDate(
    matrix?.length ? matrix[matrix.length - 1].date : shiftIsoDate(from, Math.max(0, days - 1)),
  );

  const maxY = useMemo(() => {
    const peak = bars.reduce((m, b) => Math.max(m, b.totalRooms, b.occupied + b.empty), 0);
    return Math.max(80, Math.ceil(peak / 10) * 10);
  }, [bars]);

  const avgRoomRev = summary.booked > 0 ? Math.round(summary.revenue / summary.booked) : 0;
  const nowLabel = new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`roomio-grafik-mockup roomio-grafik-mockup--elektra-forecast${fill ? ' roomio-grafik-mockup--fill' : ''}`}
    >
      {!fill ? (
        <div className="roomio-grafik-mockup__badge">
          Elektra v5 Forecast F1{live ? ' · canlı veri' : ' mockup'}
        </div>
      ) : null}

      <div className={`roomio-ef1 roomio-ef1--modern${fill ? ' roomio-ef1--fill roomio-ef1--chart-focus' : ''}`}>
        <header className="roomio-ef1__titlebar">
          <BarChart3 size={16} aria-hidden />
          <span>Forecast</span>
          {loading ? (
            <span className="roomio-ef1__loading">
              <RefreshCw size={14} className="roomio-rez-graphic-pro__spin" aria-hidden />
              Yükleniyor…
            </span>
          ) : null}
        </header>

        <div className="roomio-ef1__toolbar">
          <div className="roomio-ef1__toolbar-row">
            <label className="roomio-ef1__field">
              <span>Seçenekler</span>
              <select defaultValue="default">
                <option value="default">Varsayılan</option>
                <option value="room">Oda bazlı</option>
                <option value="bed">Yatak bazlı</option>
              </select>
            </label>
            <div className="roomio-ef1__field roomio-ef1__field--range">
              <span>Tarih Aralığı</span>
              <input type="text" readOnly value={dateFrom} />
              <span className="roomio-ef1__range-sep">—</span>
              <input type="text" readOnly value={dateTo} />
              <button type="button" className="roomio-ef1__mini" onClick={() => onShiftFrom?.(-1)} disabled={!onShiftFrom}>
                -1
              </button>
              <button type="button" className="roomio-ef1__mini" onClick={() => onShiftFrom?.(1)} disabled={!onShiftFrom}>
                +1
              </button>
              <button type="button" className="roomio-ef1__mini roomio-ef1__mini--today" onClick={() => onResetFrom?.()} disabled={!onResetFrom}>
                Bugün
              </button>
            </div>
          </div>

          <div className="roomio-ef1__toolbar-row roomio-ef1__toolbar-row--actions">
            <button
              type="button"
              className="roomio-ef1__btn roomio-ef1__btn--accent"
              onClick={() => onOpenFilterWizard?.()}
              disabled={!onOpenFilterWizard}
            >
              <SlidersHorizontal size={14} aria-hidden /> Filtre Sihirbazı
            </button>
            <button type="button" className="roomio-ef1__btn roomio-ef1__btn--primary" onClick={() => onRefresh?.()} disabled={!onRefresh}>
              Raporu Hazırla
            </button>
            <button type="button" className="roomio-ef1__btn">Raporu Yazdır</button>
            <button type="button" className="roomio-ef1__btn">Grafik Yazdır</button>
            <button type="button" className="roomio-ef1__btn">Excele Gönder</button>
            <button type="button" className="roomio-ef1__btn">Raporlar ▾</button>
            <button type="button" className="roomio-ef1__btn">Rapor Dizayn ▾</button>
            <button type="button" className="roomio-ef1__btn">Servis ▾</button>
            <button type="button" className="roomio-ef1__btn roomio-ef1__btn--danger">Kapat</button>
          </div>
        </div>

        <div className="roomio-ef1__maintabs" role="tablist" aria-label="Forecast sekmeleri">
          {MAIN_TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={mainTab === t}
              className={`roomio-ef1__maintab${mainTab === t ? ' is-active' : ''}`}
              onClick={() => setMainTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="roomio-ef1__summary">
          <strong>{PROPERTY.name.toUpperCase()}</strong>
          <span>Now : {nowLabel}</span>
          <span>
            Forecast Dönemi Oda : <em>{summary.booked} / {summary.capacity} (%{summary.occupancyPct.toLocaleString('tr-TR')})</em>
            {' · '}
            Ort. Kalış : <em>3,15 gün</em>
          </span>
          <span>
            Toplam Dönem Geliri : <em>{summary.revenue.toLocaleString('tr-TR')} TL</em>
            {' · '}
            Ort. Oda Geliri : <em>{avgRoomRev.toLocaleString('tr-TR')} TL</em>
          </span>
        </div>

        {mainTab === 'Grafik' ? (
          <div className="roomio-ef1__chart-wrap">
            <div className="roomio-ef1__chart-head">
              <span>Grafik Gün [{bars.length || days}]</span>
              <label className="roomio-ef1__check-inline">
                <input type="checkbox" checked={threeD} onChange={(e) => setThreeD(e.target.checked)} />
                3 Boyut
              </label>
            </div>

            {bars.length === 0 && !loading ? (
              <p className="roomio-page-desc" style={{ padding: 16 }}>Bu dönem için grafik verisi yok.</p>
            ) : (
              <div ref={chartRef} className={`roomio-ef1__chart${threeD ? ' is-3d' : ''}`}>
                <div className="roomio-ef1__y-axis" style={{ height: chartH }}>
                  {[maxY, Math.round(maxY * 0.75), Math.round(maxY * 0.5), Math.round(maxY * 0.25), 0].map((v) => (
                    <span key={v}>{v}</span>
                  ))}
                </div>
                <div className="roomio-ef1__bars">
                  {bars.map((b) => {
                    const occH = (b.occupied / maxY) * chartH;
                    const emptyH = (b.empty / maxY) * chartH;
                    return (
                      <div key={b.date} className="roomio-ef1__bar-col" title={`${b.label}: ${b.occupied} dolu, ${b.empty} boş`}>
                        <div className="roomio-ef1__bar-stack" style={{ height: chartH }}>
                          <div className="roomio-ef1__bar-empty" style={{ height: emptyH }}>
                            <span>{b.empty}</span>
                          </div>
                          <div className="roomio-ef1__bar-occ" style={{ height: occH }}>
                            <span>{b.occupied}</span>
                          </div>
                        </div>
                        <span className="roomio-ef1__bar-label">{b.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="roomio-ef1__metric-tabs" role="tablist">
              {METRIC_TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={metricTab === t}
                  className={`roomio-ef1__metrictab${metricTab === t ? ' is-active' : ''}`}
                  onClick={() => setMetricTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <fieldset className="roomio-ef1__checks">
              <legend>Görünecekleri İşaretleyiniz — {metricTab}</legend>
              <div className="roomio-ef1__checks-grid">
                {CHECKBOXES.map((c) => (
                  <label key={c.id}>
                    <input
                      type="checkbox"
                      checked={!!checks[c.id]}
                      onChange={(e) => setChecks((p) => ({ ...p, [c.id]: e.target.checked }))}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : (
          <div className="roomio-ef1__placeholder">
            <p><strong>{mainTab}</strong> sekmesi — Elektra Forecast{live ? ' (canlı veri)' : ' mockup'}</p>
            <p>Grafik sekmesinde günlük doluluk sütun grafiği gösterilir.</p>
          </div>
        )}

      </div>
    </div>
  );
}
