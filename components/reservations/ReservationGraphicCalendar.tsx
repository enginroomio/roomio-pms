'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Printer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { PROPERTY } from '@/lib/navigation';
import { GraphicCharts } from '@/components/reservations/graphic/GraphicCharts';
import { GraphicDesignPicker, GraphicMockupView, type GraphicDesignMode } from '@/components/reservations/graphic/GraphicDesignPicker';
import { ElektraForecastF1Mockup } from '@/components/reservations/graphic/mockups/ElektraForecastF1Mockup';
import { GraphicKpiStrip } from '@/components/reservations/graphic/GraphicKpiStrip';
import { GraphicRoomMatrix } from '@/components/reservations/graphic/GraphicRoomMatrix';
import {
  buildChartPoints,
  buildGraphicKpis,
  formatGraphicMonthYear,
  GRAPHIC_RANGE_OPTIONS,
  shiftIsoDate,
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

export function ReservationGraphicCalendar({ initialFrom = PROPERTY.businessDate }: Props) {
  const [from, setFrom] = useState(initialFrom);
  const [days, setDays] = useState<GraphicRangeDays>(31);
  const [matrix, setMatrix] = useState<GraphicCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [designMode, setDesignMode] = useState<GraphicDesignMode>('monthly-pro');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/availability?from=${from}&days=${days}`);
      const j = (await res.json()) as { matrix?: GraphicCalendarDay[] };
      setMatrix(j.matrix ?? []);
    } catch {
      setMatrix([]);
    } finally {
      setLoading(false);
    }
  }, [days, from]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartPoints = useMemo(
    () => buildChartPoints(matrix, PROPERTY.businessDate),
    [matrix],
  );
  const kpis = useMemo(() => buildGraphicKpis(matrix), [matrix]);

  if (loading && designMode === 'live') {
    return (
      <div className="roomio-rez-graphic-pro roomio-rez-graphic-pro--loading">
        <RefreshCw size={18} className="roomio-rez-graphic-pro__spin" aria-hidden />
        <p>Grafikler yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="roomio-rez-graphic-pro">
      <GraphicDesignPicker mode={designMode} onChange={setDesignMode} />

      {designMode === 'monthly-pro' ? (
        <ElektraForecastF1Mockup
          matrix={matrix}
          from={from}
          days={days}
          loading={loading}
          onRefresh={() => void load()}
          onShiftFrom={(delta) => setFrom((v) => shiftIsoDate(v, delta))}
          onResetFrom={() => setFrom(PROPERTY.businessDate)}
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
