import { BarChart3, BedDouble, CalendarRange, Percent, TrendingUp } from 'lucide-react';
import type { GraphicKpi } from '@/lib/reservations/graphic-calendar';

const ICONS = [Percent, BedDouble, CalendarRange, BedDouble, TrendingUp];

type Props = {
  items: GraphicKpi[];
};

export function GraphicKpiStrip({ items }: Props) {
  return (
    <div className="roomio-rez-graphic-pro__kpis" aria-label="Doluluk özet göstergeleri">
      {items.map((item, index) => {
        const Icon = ICONS[index] ?? BarChart3;
        const positive = item.deltaPct >= 0;
        const neutral = item.deltaPct === 0;
        return (
          <article key={item.label} className="roomio-rez-graphic-pro__kpi">
            <span className="roomio-rez-graphic-pro__kpi-icon" aria-hidden>
              <Icon size={18} />
            </span>
            <div className="roomio-rez-graphic-pro__kpi-body">
              <span className="roomio-rez-graphic-pro__kpi-label">{item.label}</span>
              <strong className="roomio-rez-graphic-pro__kpi-value">{item.value}</strong>
              <div className="roomio-rez-graphic-pro__kpi-meta">
                <span>{item.priorLabel}: {item.priorValue}</span>
                {!neutral ? (
                  <span className={`roomio-rez-graphic-pro__kpi-delta${positive ? ' is-up' : ' is-down'}`}>
                    {positive ? '↑' : '↓'} {Math.abs(item.deltaPct).toLocaleString('tr-TR')}%
                  </span>
                ) : (
                  <span className="roomio-rez-graphic-pro__kpi-delta is-flat">—</span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
