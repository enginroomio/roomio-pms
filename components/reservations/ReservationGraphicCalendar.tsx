'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Printer, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClientSearchParams } from '@/lib/client/use-client-search-params';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { Button } from '@/components/ui';
import { PROPERTY } from '@/lib/navigation';
import { GraphicCharts } from '@/components/reservations/graphic/GraphicCharts';
import { GraphicDesignPicker, GraphicMockupView, type GraphicDesignMode } from '@/components/reservations/graphic/GraphicDesignPicker';
import { ElektraForecastF1Mockup } from '@/components/reservations/graphic/mockups/ElektraForecastF1Mockup';
import { FilterWizardProMockup } from '@/components/reservations/graphic/mockups/FilterWizardProMockup';
import { CalendarHeatmapMockup } from '@/components/reservations/graphic/mockups/CalendarHeatmapMockup';
import { ElektraV5Mockup } from '@/components/reservations/graphic/mockups/ElektraV5Mockup';
import { ForecastAnalyticsMockup } from '@/components/reservations/graphic/mockups/ForecastAnalyticsMockup';
import { GraphicKpiStrip } from '@/components/reservations/graphic/GraphicKpiStrip';
import { GraphicRoomMatrix } from '@/components/reservations/graphic/GraphicRoomMatrix';
import type { GraphicFilterRule } from '@/lib/reservations/graphic-filters';
import {
  buildChartPoints,
  buildGraphicKpis,
  daysInMonth,
  formatGraphicMonthYear,
  GRAPHIC_RANGE_OPTIONS,
  monthStartIso,
  shiftIsoDate,
  shiftMonthIso,
  type GraphicCalendarDay,
  type GraphicRangeDays,
} from '@/lib/reservations/graphic-calendar';

function downloadMatrixCsv(matrix: GraphicCalendarDay[], from: string, days: number) {
  const header = ['Tarih', 'Oda Tipi', 'Dolu', 'Müsait', 'Toplam', 'Doluluk %', 'Otel Doluluk %'];
  const rows = matrix.flatMap((day) =>
    day.cells.map((cell) => [
      day.date,
      cell.type,
      cell.booked,
      cell.available,
      cell.total,
      cell.occupancyPct,
      day.occupancyPct,
    ]),
  );
  const csv = [header, ...rows].map((row) => row.join(';')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roomio-doluluk-${from}-${days}g.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type Props = {
  initialFrom?: string;
};

const MODE_PARAM = 'mode';

function parseDesignMode(raw: string | null): GraphicDesignMode | null {
  if (!raw) return null;
  const allowed: GraphicDesignMode[] = ['live', 'monthly-pro', 'filter-wizard', 'elektra', 'calendar', 'forecast'];
  return allowed.includes(raw as GraphicDesignMode) ? (raw as GraphicDesignMode) : null;
}

export function ReservationGraphicCalendar({ initialFrom = PROPERTY.businessDate }: Props) {
  const router = useRouter();
  const searchParams = useClientSearchParams();
  const [from, setFrom] = useState(initialFrom);
  const [days, setDays] = useState<GraphicRangeDays>(31);
  const [matrix, setMatrix] = useState<GraphicCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterRules, setFilterRules] = useState<GraphicFilterRule[]>([]);
  // SSR + ilk hydrate aynı kalsın; URL modu mount sonrası (hydration hatası önlenir)
  const [designMode, setDesignMode] = useState<GraphicDesignMode>('monthly-pro');

  useEffect(() => {
    const fromUrl = searchParams.get(MODE_PARAM);
    setDesignMode(parseDesignMode(fromUrl) ?? 'monthly-pro');
  }, [searchParams.toString()]);

  useEffect(() => {
    if (designMode !== 'calendar' && designMode !== 'elektra' && designMode !== 'forecast') return;
    const start = monthStartIso(from);
    if (from !== start) setFrom(start);
  }, [designMode, from]);

  const setDesignModeAndUrl = useCallback(
    (mode: GraphicDesignMode) => {
      setDesignMode(mode);
      const params = new URLSearchParams(searchParams.toString());
      if (mode === 'monthly-pro') params.delete(MODE_PARAM);
      else params.set(MODE_PARAM, mode);
      const qs = params.toString();
      router.replace(qs ? `/reservations/calendar?${qs}` : '/reservations/calendar', { scroll: false });
      searchParams.sync();
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const fetchFrom = designMode === 'calendar' || designMode === 'elektra' || designMode === 'forecast'
        ? monthStartIso(from)
        : from;
      const fetchDays = designMode === 'calendar' || designMode === 'elektra' || designMode === 'forecast'
        ? daysInMonth(fetchFrom)
        : days;
      const filters = filterRules.length > 0
        ? `&filters=${encodeURIComponent(JSON.stringify(filterRules))}`
        : '';
      const res = await roomioFetch(
        `/api/reservations/availability?from=${fetchFrom}&days=${fetchDays}${filters}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error(await parseApiError(res, 'Doluluk verisi yüklenemedi'));
      const j = (await res.json()) as { matrix?: GraphicCalendarDay[] };
      setMatrix(j.matrix ?? []);
    } catch (err) {
      setMatrix([]);
      setLoadError(err instanceof Error ? err.message : 'Doluluk verisi yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [days, designMode, filterRules, from]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartPoints = useMemo(
    () => buildChartPoints(matrix, PROPERTY.businessDate),
    [matrix],
  );
  const kpis = useMemo(() => buildGraphicKpis(matrix), [matrix]);

  return (
    <div className="roomio-rez-graphic-pro">
      {loadError ? (
        <p className="roomio-page-desc roomio-text-warn" role="alert" style={{ marginBottom: 12 }}>
          {loadError}
        </p>
      ) : null}
      <GraphicDesignPicker mode={designMode} onChange={setDesignModeAndUrl} />

      {designMode === 'monthly-pro' ? (
        <ElektraForecastF1Mockup
          matrix={matrix}
          from={from}
          days={days}
          loading={loading}
          onRefresh={() => void load()}
          onShiftFrom={(delta) => setFrom((v) => shiftIsoDate(v, delta))}
          onResetFrom={() => setFrom(PROPERTY.businessDate)}
          onOpenFilterWizard={() => setDesignModeAndUrl('filter-wizard')}
        />
      ) : designMode === 'filter-wizard' ? (
        <FilterWizardProMockup
          live
          from={from}
          days={days}
          onApply={(rules) => {
            setFilterRules(rules);
            setDesignModeAndUrl('monthly-pro');
          }}
          onOpenForecast={() => setDesignModeAndUrl('monthly-pro')}
        />
      ) : designMode === 'calendar' ? (
        <CalendarHeatmapMockup
          live
          matrix={matrix}
          monthStart={monthStartIso(from)}
          loading={loading}
          onRefresh={() => void load()}
          onShiftMonth={(delta) => setFrom((v) => shiftMonthIso(v, delta))}
        />
      ) : designMode === 'elektra' ? (
        <ElektraV5Mockup
          live
          matrix={matrix}
          from={from}
          days={daysInMonth(monthStartIso(from))}
          loading={loading}
          onRefresh={() => void load()}
          onShiftMonth={(delta) => setFrom((v) => shiftMonthIso(v, delta))}
          onExport={() => downloadMatrixCsv(matrix, monthStartIso(from), daysInMonth(monthStartIso(from)))}
        />
      ) : designMode === 'forecast' ? (
        <ForecastAnalyticsMockup
          live
          matrix={matrix}
          from={from}
          loading={loading}
          onRefresh={() => void load()}
          onShiftMonth={(delta) => setFrom((v) => shiftMonthIso(v, delta))}
          onOpenFilterWizard={() => setDesignModeAndUrl('filter-wizard')}
        />
      ) : designMode !== 'live' ? (
        <GraphicMockupView mode={designMode} />
      ) : (
        <>
      <div className="roomio-rez-graphic-pro__toolbar">
        <div className="roomio-rez-graphic-pro__filters">
          <label className="roomio-rez-graphic-pro__filter">
            <span>Dönem</span>
            <div className="roomio-rez-graphic-pro__nav">
              <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => setFrom((v) => shiftIsoDate(v, -days))} aria-label="Önceki dönem">
                <ChevronLeft size={16} />
              </button>
              <strong>{formatGraphicMonthYear(from)}</strong>
              <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => setFrom((v) => shiftIsoDate(v, days))} aria-label="Sonraki dönem">
                <ChevronRight size={16} />
              </button>
            </div>
          </label>

          <label className="roomio-rez-graphic-pro__filter">
            <span>Görünüm</span>
            <div className="roomio-rez-graphic-pro__segments" role="group" aria-label="Gün aralığı">
              {GRAPHIC_RANGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`roomio-rez-graphic-pro__segment${days === option ? ' is-active' : ''}`}
                  onClick={() => setDays(option)}
                >
                  {option} gün
                </button>
              ))}
            </div>
          </label>
        </div>

        <div className="roomio-rez-graphic-pro__actions">
          <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => void load()}>
            <RefreshCw size={15} /> Yenile
          </button>
          <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => window.print()}>
            <Printer size={15} /> Yazdır
          </button>
          <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => downloadMatrixCsv(matrix, from, days)}>
            <Download size={15} /> Dışa Aktar
          </button>
          <Button href="/reservations/new">+ Yeni Rezervasyon (F2)</Button>
        </div>
      </div>

      <GraphicKpiStrip items={kpis} />
      <GraphicCharts points={chartPoints} />
      <GraphicRoomMatrix matrix={matrix} />

      <footer className="roomio-rez-graphic-pro__foot">
        <p>
          Elektra v5 F1 — doluluk trendi, gecelemeler ve oda tipi matrisi.
          {' · '}
          <Link href="/reservations?tab=availability">Tablo görünümü (Oda Planı)</Link>
        </p>
        <p className="roomio-rez-graphic-pro__foot-note">
          Geçen yıl karşılaştırması demo verisiyle simüle edilir · tahmin bölgesi iş günü sonrasını gösterir
        </p>
      </footer>
        </>
      )}
    </div>
  );
}
