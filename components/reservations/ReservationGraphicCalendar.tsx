'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientSearchParams } from '@/lib/client/use-client-search-params';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { PROPERTY } from '@/lib/navigation';
import { GraphicDesignPicker, GraphicMockupView, type GraphicDesignMode } from '@/components/reservations/graphic/GraphicDesignPicker';
import { ElektraForecastF1Mockup } from '@/components/reservations/graphic/mockups/ElektraForecastF1Mockup';
import { FilterWizardProMockup } from '@/components/reservations/graphic/mockups/FilterWizardProMockup';
import { CalendarHeatmapMockup } from '@/components/reservations/graphic/mockups/CalendarHeatmapMockup';
import { ElektraV5Mockup } from '@/components/reservations/graphic/mockups/ElektraV5Mockup';
import { ForecastAnalyticsMockup } from '@/components/reservations/graphic/mockups/ForecastAnalyticsMockup';
import type { GraphicFilterRule } from '@/lib/reservations/graphic-filters';
import {
  daysInMonth,
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
  fullScreen?: boolean;
};

const MODE_PARAM = 'mode';

function parseDesignMode(raw: string | null): GraphicDesignMode | null {
  if (!raw) return null;
  const allowed: GraphicDesignMode[] = ['live', 'monthly-pro', 'filter-wizard', 'elektra', 'calendar', 'forecast'];
  return allowed.includes(raw as GraphicDesignMode) ? (raw as GraphicDesignMode) : null;
}

function GraphicViewport({ fullScreen, children }: { fullScreen: boolean; children: ReactNode }) {
  if (!fullScreen) return <>{children}</>;
  return <div className="roomio-grafik-f1-forecast-viewport">{children}</div>;
}

export function ReservationGraphicCalendar({ initialFrom = PROPERTY.businessDate, fullScreen = false }: Props) {
  const router = useRouter();
  const searchParams = useClientSearchParams();
  const [from, setFrom] = useState(initialFrom);
  const [days] = useState<GraphicRangeDays>(31);
  const [matrix, setMatrix] = useState<GraphicCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterRules, setFilterRules] = useState<GraphicFilterRule[]>([]);
  const [designMode, setDesignMode] = useState<GraphicDesignMode>('monthly-pro');
  const [pickerCollapsed, setPickerCollapsed] = useState(fullScreen);

  const searchParamsString = searchParams.toString();
  useEffect(() => {
    const fromUrl = new URLSearchParams(searchParamsString).get(MODE_PARAM);
    setDesignMode(parseDesignMode(fromUrl) ?? 'monthly-pro');
  }, [searchParamsString]);

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

  const forecastF1 = (
    <GraphicViewport fullScreen={fullScreen}>
      <ElektraForecastF1Mockup
        fill={fullScreen}
        matrix={matrix}
        from={from}
        days={days}
        loading={loading}
        onRefresh={() => void load()}
        onShiftFrom={(delta) => setFrom((v) => shiftIsoDate(v, delta))}
        onResetFrom={() => setFrom(PROPERTY.businessDate)}
        onOpenFilterWizard={() => setDesignModeAndUrl('filter-wizard')}
      />
    </GraphicViewport>
  );

  return (
    <div className={`roomio-grafik-f1-host${fullScreen ? ' roomio-grafik-f1-host--fill' : ''}`}>
      {loadError ? (
        <p className="roomio-page-desc roomio-text-warn" role="alert" style={{ marginBottom: 12 }}>
          {loadError}
        </p>
      ) : null}
      <GraphicDesignPicker
        mode={designMode}
        onChange={setDesignModeAndUrl}
        compact={fullScreen}
        collapsed={fullScreen && pickerCollapsed}
        onToggleCollapsed={() => setPickerCollapsed((v) => !v)}
      />

      {designMode === 'monthly-pro' || designMode === 'live' ? (
        forecastF1
      ) : designMode === 'filter-wizard' ? (
        <GraphicViewport fullScreen={fullScreen}>
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
        </GraphicViewport>
      ) : designMode === 'calendar' ? (
        <GraphicViewport fullScreen={fullScreen}>
          <CalendarHeatmapMockup
            live
            matrix={matrix}
            monthStart={monthStartIso(from)}
            loading={loading}
            onRefresh={() => void load()}
            onShiftMonth={(delta) => setFrom((v) => shiftMonthIso(v, delta))}
          />
        </GraphicViewport>
      ) : designMode === 'elektra' ? (
        <GraphicViewport fullScreen={fullScreen}>
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
        </GraphicViewport>
      ) : designMode === 'forecast' ? (
        <GraphicViewport fullScreen={fullScreen}>
          <ForecastAnalyticsMockup
            live
            matrix={matrix}
            from={from}
            loading={loading}
            onRefresh={() => void load()}
            onShiftMonth={(delta) => setFrom((v) => shiftMonthIso(v, delta))}
            onOpenFilterWizard={() => setDesignModeAndUrl('filter-wizard')}
          />
        </GraphicViewport>
      ) : (
        <GraphicViewport fullScreen={fullScreen}>
          <GraphicMockupView mode={designMode} />
        </GraphicViewport>
      )}
    </div>
  );
}
