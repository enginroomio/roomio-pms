import Link from 'next/link';
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
};

export function DailyMovements({ arrivals, departures, alerts = [] }: Props) {
  const defaultAlerts: AlertItem[] = alerts.length > 0 ? alerts : [
    { label: 'DND Odalar', count: 3, href: '/housekeeping/rooms' },
    { label: 'Kayıp Oda Anahtarları', count: 1, href: '/guest-relations/lost-found' },
    { label: 'Uyandırma Servisi', count: 5, href: '/guest-relations/daily-activities' },
  ];

  return (
    <aside className="roomio-movements" aria-label="Günlük giriş ve çıkışlar">
      <section className="roomio-movements__block">
        <div className="roomio-movements__head">
          <h2>Bugünkü Varışlar</h2>
          <span className="roomio-movements__count">{arrivals.length}</span>
        </div>
        <div className="roomio-movements__list">
          {arrivals.length === 0 ? (
            <p className="roomio-movements__empty">Bugün planlı giriş yok</p>
          ) : (
            arrivals.slice(0, 6).map((r) => (
              <MovementRow
                key={r.id}
                name={r.guestName}
                meta={arrivalMeta(r)}
                time="14:00"
                tone="in"
              />
            ))
          )}
        </div>
        <Link href="/reception/arrivals" className="roomio-movements__more">
          Tümünü gör
        </Link>
      </section>

      <section className="roomio-movements__block">
        <div className="roomio-movements__head">
          <h2>Bugünkü Ayrılışlar</h2>
          <span className="roomio-movements__count">{departures.length}</span>
        </div>
        <div className="roomio-movements__list">
          {departures.length === 0 ? (
            <p className="roomio-movements__empty">Bugün planlı çıkış yok</p>
          ) : (
            departures.slice(0, 6).map((r) => (
              <MovementRow
                key={r.id}
                name={r.guestName}
                meta={departureMeta(r)}
                time="11:00"
                tone="out"
              />
            ))
          )}
        </div>
        <Link href="/reception/departures" className="roomio-movements__more">
          Tümünü gör
        </Link>
      </section>

      <section className="roomio-movements__block roomio-movements__block--alerts">
        <div className="roomio-movements__head">
          <h2>Uyarılar</h2>
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
