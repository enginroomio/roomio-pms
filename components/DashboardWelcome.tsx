import type { ReactNode } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { DEMO_USER, PROPERTY } from '@/lib/navigation';

type Insight = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone: 'teal' | 'blue' | 'amber' | 'rose';
  icon: ReactNode;
};

type Props = {
  arrivals: number;
  departures: number;
  inHouse: number;
  occupancy: number;
  cleanVacant: number;
  dirtyVacant: number;
};

function formatBusinessDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function DashboardWelcome({
  arrivals,
  departures,
  inHouse,
  occupancy,
  cleanVacant,
  dirtyVacant,
}: Props) {
  const firstName = DEMO_USER.name.split(/[\s.]/)[0] ?? DEMO_USER.name;
  const businessDate = formatBusinessDate(PROPERTY.businessDate);

  const insights: Insight[] = [
    {
      id: 'arrivals',
      label: 'Bugün giriş',
      value: String(arrivals),
      hint: 'Bekleyen check-in',
      tone: 'teal',
      icon: <LogIn size={16} />,
    },
    {
      id: 'departures',
      label: 'Bugün çıkış',
      value: String(departures),
      hint: 'Check-out planı',
      tone: 'amber',
      icon: <LogOut size={16} />,
    },
    {
      id: 'inhouse',
      label: 'Konaklayan',
      value: String(inHouse),
      hint: `%${occupancy} doluluk`,
      tone: 'blue',
      icon: <BedDouble size={16} />,
    },
    {
      id: 'hk',
      label: 'Temiz / kirli',
      value: `${cleanVacant} / ${dirtyVacant}`,
      hint: 'Müsait oda durumu',
      tone: 'rose',
      icon: <Sparkles size={16} />,
    },
  ];

  return (
    <section className="roomio-welcome-bar" aria-label="Günlük özet">
      <div className="roomio-welcome-bar__main">
        <p className="roomio-welcome-bar__eyebrow">
          <CalendarDays size={14} aria-hidden />
          {businessDate}
        </p>
        <h1 className="roomio-welcome-bar__title">Merhaba, {firstName}</h1>
        <p className="roomio-welcome-bar__meta">
          {PROPERTY.name} · {PROPERTY.totalRooms} oda · İş günü{' '}
          {PROPERTY.businessDate.split('-').reverse().join('.')}
        </p>
      </div>

      <div className="roomio-welcome-bar__insights" role="list">
        {insights.map((item) => (
          <div
            key={item.id}
            className={`roomio-welcome-insight roomio-welcome-insight--${item.tone}`}
            role="listitem"
          >
            <span className="roomio-welcome-insight__icon" aria-hidden>
              {item.icon}
            </span>
            <div className="roomio-welcome-insight__body">
              <span className="roomio-welcome-insight__label">{item.label}</span>
              <strong className="roomio-welcome-insight__value">{item.value}</strong>
              {item.hint ? <span className="roomio-welcome-insight__hint">{item.hint}</span> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="roomio-welcome-bar__status">
        <div className="roomio-welcome-status-card">
          <span className="roomio-welcome-status-card__label">Doluluk</span>
          <strong className="roomio-welcome-status-card__value">%{occupancy}</strong>
          <span className="roomio-welcome-status-card__trend roomio-welcome-status-card__trend--up">
            <ArrowUpRight size={14} aria-hidden />
            Operasyon aktif
          </span>
        </div>
        <div className="roomio-welcome-status-card roomio-welcome-status-card--muted">
          <span className="roomio-welcome-status-card__label">Vardiya</span>
          <strong className="roomio-welcome-status-card__value">{DEMO_USER.role}</strong>
          <span className="roomio-welcome-status-card__trend">
            <ArrowDownRight size={14} aria-hidden />
            {DEMO_USER.name}
          </span>
        </div>
      </div>
    </section>
  );
}
