'use client';

import type { ChartPoint } from '@/lib/reservations/graphic-calendar';
import { chartScale, linePath } from '@/lib/reservations/graphic-calendar';

type Props = {
  points: ChartPoint[];
};

const W = 1100;
const H = 260;
const PAD = { top: 28, right: 16, bottom: 36, left: 44 };

export function GraphicCharts({ points }: Props) {
  if (points.length === 0) return null;

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const occValues = points.flatMap((p) => [p.value, p.priorValue]);
  const occScale = chartScale(occValues, 6);
  const maxRooms = Math.max(1, ...points.flatMap((p) => [p.booked + p.available, p.priorBooked + p.priorAvailable]));

  const xAt = (index: number) => PAD.left + (index / Math.max(1, points.length - 1)) * chartW;
  const yOcc = (value: number) =>
    PAD.top + chartH - ((value - occScale.min) / occScale.span) * chartH;
  const yBar = (value: number) => PAD.top + chartH - (value / maxRooms) * chartH;

  const currentLine = points.map((p, i) => ({ x: xAt(i), y: yOcc(p.value) }));
  const priorLine = points.map((p, i) => ({ x: xAt(i), y: yOcc(p.priorValue) }));
  const forecastStart = points.findIndex((p) => p.isForecast);
  const forecastX = forecastStart >= 0 ? xAt(forecastStart) : null;

  return (
    <div className="roomio-rez-graphic-pro__charts">
      <section className="roomio-rez-graphic-pro__chart-panel" aria-label="Günlük doluluk oranları">
        <header className="roomio-rez-graphic-pro__chart-head">
          <div>
            <h3>Günlük Doluluk Oranları (%)</h3>
            <p>Bu yıl ve geçen yıl karşılaştırması</p>
          </div>
          <div className="roomio-rez-graphic-pro__chart-legend">
            <span><i className="swatch swatch--current" /> Bu yıl</span>
            <span><i className="swatch swatch--prior" /> Geçen yıl</span>
            <span><i className="swatch swatch--forecast" /> Tahmin</span>
          </div>
        </header>
        <svg viewBox={`0 0 ${W} ${H}`} className="roomio-rez-graphic-pro__svg" role="img" aria-label="Doluluk çizgi grafiği">
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = yOcc(tick);
            return (
              <g key={tick}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} className="roomio-rez-graphic-pro__grid" />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="roomio-rez-graphic-pro__axis">{tick}%</text>
              </g>
            );
          })}
          {forecastX != null ? (
            <>
              <rect
                x={forecastX}
                y={PAD.top}
                width={W - PAD.right - forecastX}
                height={chartH}
                className="roomio-rez-graphic-pro__forecast-zone"
              />
              <text x={forecastX + 8} y={PAD.top + 14} className="roomio-rez-graphic-pro__forecast-label">Tahmin</text>
            </>
          ) : null}
          <path d={linePath(priorLine)} className="roomio-rez-graphic-pro__line roomio-rez-graphic-pro__line--prior" fill="none" />
          <path d={linePath(currentLine)} className="roomio-rez-graphic-pro__line roomio-rez-graphic-pro__line--current" fill="none" />
          {points.map((p, i) => (
            <g key={p.date}>
              <circle cx={xAt(i)} cy={yOcc(p.value)} r={3.5} className="roomio-rez-graphic-pro__dot roomio-rez-graphic-pro__dot--current" />
              <text x={xAt(i)} y={yOcc(p.value) - 8} textAnchor="middle" className="roomio-rez-graphic-pro__point-label">{p.value}</text>
              <text x={xAt(i)} y={H - 10} textAnchor="middle" className="roomio-rez-graphic-pro__axis">{p.label}</text>
            </g>
          ))}
        </svg>
      </section>

      <section className="roomio-rez-graphic-pro__chart-panel" aria-label="Günlük oda gecelemeleri">
        <header className="roomio-rez-graphic-pro__chart-head">
          <div>
            <h3>Günlük Oda Gecelemeleri (Adet)</h3>
            <p>Dolu ve müsait oda dağılımı</p>
          </div>
          <div className="roomio-rez-graphic-pro__chart-legend">
            <span><i className="swatch swatch--booked" /> Dolu (bu yıl)</span>
            <span><i className="swatch swatch--avail" /> Müsait (bu yıl)</span>
          </div>
        </header>
        <svg viewBox={`0 0 ${W} ${H}`} className="roomio-rez-graphic-pro__svg" role="img" aria-label="Oda gecelemesi sütun grafiği">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = Math.round(maxRooms * ratio);
            const y = yBar(value);
            return (
              <g key={ratio}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} className="roomio-rez-graphic-pro__grid" />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="roomio-rez-graphic-pro__axis">{value}</text>
              </g>
            );
          })}
          {forecastX != null ? (
            <rect x={forecastX} y={PAD.top} width={W - PAD.right - forecastX} height={chartH} className="roomio-rez-graphic-pro__forecast-zone" />
          ) : null}
          {points.map((p, i) => {
            const slot = chartW / points.length;
            const barW = Math.max(8, slot * 0.42);
            const cx = xAt(i);
            const x = cx - barW / 2;
            const bookedH = (p.booked / maxRooms) * chartH;
            const availH = (p.available / maxRooms) * chartH;
            const baseY = PAD.top + chartH;
            return (
              <g key={p.date}>
                <rect x={x} y={baseY - availH - bookedH} width={barW} height={bookedH} className="roomio-rez-graphic-pro__bar roomio-rez-graphic-pro__bar--booked" rx={3} />
                <rect x={x} y={baseY - availH} width={barW} height={availH} className="roomio-rez-graphic-pro__bar roomio-rez-graphic-pro__bar--avail" rx={3} />
                <rect
                  x={x + barW * 0.15}
                  y={baseY - (p.priorBooked / maxRooms) * chartH - (p.priorAvailable / maxRooms) * chartH}
                  width={barW * 0.7}
                  height={((p.priorBooked + p.priorAvailable) / maxRooms) * chartH}
                  className="roomio-rez-graphic-pro__bar roomio-rez-graphic-pro__bar--prior-outline"
                  rx={3}
                />
                <text x={cx} y={H - 10} textAnchor="middle" className="roomio-rez-graphic-pro__axis">{p.label}</text>
              </g>
            );
          })}
        </svg>
      </section>
    </div>
  );
}
