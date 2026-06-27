'use client';

import { useMemo } from 'react';
import { linePath } from '@/lib/reservations/graphic-calendar';
import type { ForecastBar } from '@/lib/reservations/graphic-calendar';

type Props = {
  bars: ForecastBar[];
  loading?: boolean;
};

export function ForecastF1ModernChart({ bars, loading }: Props) {
  const layout = useMemo(() => {
    const chartW = Math.max(640, bars.length * 30 + 80);
    const chartH = 280;
    const padL = 44;
    const padR = 44;
    const padT = 20;
    const padB = 52;
    const innerW = chartW - padL - padR;
    const innerH = chartH - padT - padB;
    const step = bars.length > 1 ? innerW / (bars.length - 1) : innerW;
    const barW = Math.min(18, Math.max(8, step * 0.55));

    const roomPoints = bars.map((b, i) => ({
      x: padL + i * step,
      y: padT + innerH - (b.roomOccPct / 100) * innerH,
      pct: b.roomOccPct,
    }));
    const paxPoints = bars.map((b, i) => ({
      x: padL + i * step,
      y: padT + innerH - (b.paxOccPct / 100) * innerH,
      pct: b.paxOccPct,
    }));

    const yTicks = [100, 75, 50, 25, 0];

    return { chartW, chartH, padL, padT, innerH, step, barW, roomPoints, paxPoints, yTicks };
  }, [bars]);

  if (loading) {
    return (
      <div className="roomio-ev5-pro__chart-loading">
        <span className="roomio-ev5-pro__spin" aria-hidden />
        Grafik yükleniyor…
      </div>
    );
  }

  if (bars.length === 0) {
    return <p className="roomio-ev5-pro__empty">Bu dönem için grafik verisi yok.</p>;
  }

  const { chartW, chartH, padL, padT, innerH, step, barW, roomPoints, paxPoints, yTicks } = layout;

  return (
    <div className="roomio-ev5-pro__chart-scroll">
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="roomio-ev5-pro__svg"
        role="img"
        aria-label="Oda ve kişi doluluğu grafiği"
      >
        {yTicks.map((tick) => {
          const y = padT + innerH - (tick / 100) * innerH;
          return (
            <g key={tick}>
              <line
                x1={padL}
                y1={y}
                x2={chartW - 44}
                y2={y}
                className="roomio-ev5-pro__grid-line"
              />
              <text x={padL - 8} y={y + 4} textAnchor="end" className="roomio-ev5-pro__axis">
                %{tick}
              </text>
            </g>
          );
        })}

        {bars.map((b, i) => {
          const x = padL + i * step;
          const roomH = (b.roomOccPct / 100) * innerH;
          const paxH = (b.paxOccPct / 100) * innerH;
          const roomY = padT + innerH - roomH;
          const paxY = padT + innerH - paxH;
          return (
            <g key={b.date} className="roomio-ev5-pro__day">
              <title>
                {b.label}
                {'\n'}
                Oda: {b.occupied}/{b.totalRooms} (%{b.roomOccPct})
                {'\n'}
                Kişi: {b.pax}/{b.paxCapacity} (%{b.paxOccPct})
              </title>
              <rect
                x={x - barW / 2}
                y={roomY}
                width={barW}
                height={roomH}
                rx={3}
                className="roomio-ev5-pro__bar-room"
              />
              <rect
                x={x - barW / 2 + barW + 2}
                y={paxY}
                width={Math.max(6, barW - 4)}
                height={paxH}
                rx={3}
                className="roomio-ev5-pro__bar-pax"
              />
              <text x={x} y={chartH - 28} textAnchor="middle" className="roomio-ev5-pro__day-label">
                {b.label.split(' ')[0]}
              </text>
              <text x={x} y={chartH - 14} textAnchor="middle" className="roomio-ev5-pro__day-sub">
                {b.label.split(' ')[1] ?? ''}
              </text>
            </g>
          );
        })}

        <path d={linePath(roomPoints)} className="roomio-ev5-pro__line-room" fill="none" />
        <path d={linePath(paxPoints)} className="roomio-ev5-pro__line-pax" fill="none" />

        {roomPoints.map((p, i) => (
          <circle key={`r-${bars[i].date}`} cx={p.x} cy={p.y} r={3.5} className="roomio-ev5-pro__dot-room" />
        ))}
        {paxPoints.map((p, i) => (
          <circle key={`p-${bars[i].date}`} cx={p.x + barW + 2} cy={p.y} r={3.5} className="roomio-ev5-pro__dot-pax" />
        ))}
      </svg>
    </div>
  );
}
