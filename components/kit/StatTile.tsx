import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
};

export function StatTile({ label, value, hint, icon: Icon, className = '' }: Props) {
  return (
    <div className={`roomio-kpi-strip__item${className ? ` ${className}` : ''}`}>
      {Icon ? (
        <span className="roomio-kpi-strip__icon" aria-hidden>
          <Icon size={16} />
        </span>
      ) : null}
      <div>
        <span className="roomio-kpi-strip__label">{label}</span>
        <strong className="roomio-kpi-strip__value">{value}</strong>
        {hint ? <span className="roomio-kpi-strip__hint">{hint}</span> : null}
      </div>
    </div>
  );
}
