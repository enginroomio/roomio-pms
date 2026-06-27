'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n/I18nProvider';
import { maskGuestName } from '@/lib/kvkk';
import type { Reservation } from '@/lib/types/reservation';

function MovementRow({
  name,
  meta,
  time,
  tone,
}: {
  name: string;
  meta: string;
  time: string;
  tone: 'in' | 'out';
}) {
  return (
    <div className={`roomio-movement-row roomio-movement-row--${tone}`}>
      <div className="roomio-movement-row__main">
        <strong>{name}</strong>
        <span>{meta}</span>
      </div>
      <time>{time}</time>
    </div>
  );
}

function arrivalMeta(r: Reservation) {
  const room = r.roomNo ? `${r.roomNo} · ` : '';
  return `${room}${r.roomType}`;
}

function departureMeta(g: Reservation) {
  return `${g.roomNo ?? '—'} · ${g.roomType}`;
}

type AlertItem = {
  label: string;
  count: number;
  href?: string;
};

type Props = {
  arrivals: Reservation[];
  departures: Reservation[];
  alerts?: AlertItem[];
  maskGuestNames?: boolean;
  compact?: boolean;
};

export function DailyMovements({ arrivals, departures, alerts = [], maskGuestNames = false, compact = false }: Props) {
  const { t } = useI18n();
  const displayName = (name: string) => (maskGuestNames ? maskGuestName(name) : name);
  const defaultAlerts: AlertItem[] = alerts.length > 0 ? alerts : [
    { label: t('dashboard.movements.dndRooms'), count: 3, href: '/housekeeping/rooms' },
    { label: t('dashboard.movements.lostKeys'), count: 1, href: '/guest-relations/lost-found' },
    { label: t('dashboard.movements.wakeup'), count: 5, href: '/guest-relations/daily-activities' },
  ];

  return (
    <aside className="roomio-movements" aria-label={t('dashboard.movements.aria')}>
      <section className="roomio-movements__block">
        <div className="roomio-movements__head">
          <h2>{t('dashboard.movements.arrivalsTitle')}</h2>
          <span className="roomio-movements__count">{arrivals.length}</span>
        </div>
        <div className="roomio-movements__list">
          {arrivals.length === 0 ? (
            <p className="roomio-movements__empty">{t('dashboard.movements.noArrivals')}</p>
          ) : (
            arrivals.slice(0, 6).map((r) => (
              <MovementRow
                key={r.id}
                name={displayName(r.guestName)}
                meta={arrivalMeta(r)}
                time="14:00"
                tone="in"
              />
            ))
          )}
        </div>
        {compact ? null : (
          <Link href="/reception/arrivals" className="roomio-movements__more">
            {t('dashboard.movements.viewAll')}
          </Link>
        )}
      </section>

      <section className="roomio-movements__block">
        <div className="roomio-movements__head">
          <h2>{t('dashboard.movements.departuresTitle')}</h2>
          <span className="roomio-movements__count">{departures.length}</span>
        </div>
        <div className="roomio-movements__list">
          {departures.length === 0 ? (
            <p className="roomio-movements__empty">{t('dashboard.movements.noDepartures')}</p>
          ) : (
            departures.slice(0, 6).map((r) => (
              <MovementRow
                key={r.id}
                name={displayName(r.guestName)}
                meta={departureMeta(r)}
                time="11:00"
                tone="out"
              />
            ))
          )}
        </div>
        {compact ? null : (
          <Link href="/reception/departures" className="roomio-movements__more">
            {t('dashboard.movements.viewAll')}
          </Link>
        )}
      </section>

      <section className="roomio-movements__block roomio-movements__block--alerts">
        <div className="roomio-movements__head">
          <h2>{t('dashboard.movements.alertsTitle')}</h2>
        </div>
        <ul className="roomio-movements__alerts">
          {defaultAlerts.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link href={item.href}>
                  <strong>{item.count}</strong>
                  <span>{item.label}</span>
                </Link>
              ) : (
                <>
                  <strong>{item.count}</strong>
                  <span>{item.label}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
