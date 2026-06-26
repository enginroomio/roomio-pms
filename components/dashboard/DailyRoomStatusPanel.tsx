'use client';

import Link from 'next/link';
import { RACK_LEGEND, countRackByState } from '@/lib/rooms/inventory';
import { buildRackCells } from '@/lib/rooms/inventory';
import type { DashboardSnapshot } from '@/lib/server/dashboard-data';
import { StatTile } from '@/components/kit';
import { BedDouble, CalendarCheck, CalendarX, Percent, Sparkles } from 'lucide-react';
import { useProperty } from '@/components/property/PropertyProvider';
import { useMemo } from 'react';

type Props = {
  snapshot: DashboardSnapshot;
};

export function DailyRoomStatusPanel({ snapshot }: Props) {
  const { activeProperty } = useProperty();
  const cells = useMemo(
    () => buildRackCells(undefined, snapshot.reservations, snapshot.businessDate, snapshot.hkMap),
    [snapshot],
  );
  const counts = useMemo(() => countRackByState(cells), [cells]);

  const floorRows = useMemo(() => {
    const map = new Map<number, { total: number; occupied: number; vacant: number; dirty: number; ooo: number }>();
    for (const cell of cells) {
      const floor = cell.room.floor;
      const row = map.get(floor) ?? { total: 0, occupied: 0, vacant: 0, dirty: 0, ooo: 0 };
      row.total += 1;
      if (cell.occupied) row.occupied += 1;
      else row.vacant += 1;
      if (cell.state === 'kirli' || cell.state === 'dolu-kirli') row.dirty += 1;
      if (cell.state === 'ooi' || cell.state === 'ariza') row.ooo += 1;
      map.set(floor, row);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [cells]);

  const total = activeProperty?.totalRooms ?? snapshot.totalRooms;

  return (
    <div className="roomio-daily-room-status">
      <div className="roomio-daily-room-status__head">
        <div>
          <h1 className="roomio-card-title">Günlük Oda Durumu</h1>
          <p className="roomio-page-desc">
            {activeProperty?.name ?? 'Otel'} · Program tarihi: <strong>{snapshot.businessDate}</strong>
          </p>
        </div>
        <div className="roomio-quick-actions">
          <Link href="/rooms" className="roomio-btn roomio-btn--secondary roomio-btn--sm">Oda Rack (F12)</Link>
          <Link href="/housekeeping/rooms" className="roomio-btn roomio-btn--secondary roomio-btn--sm">HK Oda Listesi</Link>
          <Link href="/" className="roomio-btn roomio-btn--ghost roomio-btn--sm">Ana Sayfa</Link>
        </div>
      </div>

      <section className="roomio-kpi-strip roomio-daily-room-status__kpi" aria-label="Özet">
        <StatTile label="Doluluk" value={`%${snapshot.occupancy}`} hint={`${snapshot.inHouse} / ${total}`} icon={Percent} />
        <StatTile label="Giriş" value={String(snapshot.arrivals.length)} hint="Bugün" icon={CalendarCheck} />
        <StatTile label="Çıkış" value={String(snapshot.departures.length)} hint="Bugün" icon={CalendarX} />
        <StatTile label="Konaklayan" value={String(snapshot.inHouse)} hint="In-house" icon={BedDouble} />
        <StatTile label="Temiz boş" value={String(snapshot.cleanVacant)} hint="Satılabilir" icon={Sparkles} />
      </section>

      <div className="roomio-detail-grid roomio-daily-room-status__grid">
        <div className="roomio-card">
          <h2 className="roomio-card-title">Durum dağılımı</h2>
          <table className="roomio-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Durum</th>
                <th>Adet</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {RACK_LEGEND.map((leg) => (
                <tr key={leg.id}>
                  <td>
                    <span className="roomio-daily-room-status__swatch" style={{ background: leg.color }} aria-hidden />
                    {leg.label}
                  </td>
                  <td><strong>{counts[leg.id]}</strong></td>
                  <td>{total > 0 ? Math.round((counts[leg.id] / total) * 100) : 0}%</td>
                </tr>
              ))}
              <tr>
                <td><strong>Toplam</strong></td>
                <td><strong>{total}</strong></td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="roomio-card">
          <h2 className="roomio-card-title">Kat özeti</h2>
          <table className="roomio-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Kat</th>
                <th>Toplam</th>
                <th>Dolu</th>
                <th>Boş</th>
                <th>Kirli</th>
                <th>Kapalı</th>
              </tr>
            </thead>
            <tbody>
              {floorRows.map(([floor, row]) => (
                <tr key={floor}>
                  <td><strong>{floor}. kat</strong></td>
                  <td>{row.total}</td>
                  <td>{row.occupied}</td>
                  <td>{row.vacant}</td>
                  <td>{row.dirty}</td>
                  <td>{row.ooo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="roomio-card">
          <h2 className="roomio-card-title">Bugün giriş ({snapshot.arrivals.length})</h2>
          {snapshot.arrivals.length === 0 ? (
            <p className="roomio-page-desc" style={{ marginTop: 8 }}>Planlı giriş yok.</p>
          ) : (
            <ul className="roomio-daily-room-status__list">
              {snapshot.arrivals.slice(0, 12).map((r) => (
                <li key={r.id}>
                  <strong>{r.guestName}</strong>
                  <span>{r.refNo} · {r.roomType}{r.roomNo ? ` · ${r.roomNo}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="roomio-card">
          <h2 className="roomio-card-title">Bugün çıkış ({snapshot.departures.length})</h2>
          {snapshot.departures.length === 0 ? (
            <p className="roomio-page-desc" style={{ marginTop: 8 }}>Planlı çıkış yok.</p>
          ) : (
            <ul className="roomio-daily-room-status__list">
              {snapshot.departures.slice(0, 12).map((r) => (
                <li key={r.id}>
                  <strong>{r.guestName}</strong>
                  <span>{r.refNo} · Oda {r.roomNo ?? '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
