'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { HK_STATUS_LABELS, countByStatus } from '@/lib/data/housekeeping';
import { buildEnergyRows, buildRoomFixtures } from '@/lib/housekeeping/room-inventory-meta';
import { roomioFetch } from '@/lib/client/api';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

export function HkStatusReportPanel() {
  const [rooms, setRooms] = useState<HousekeepingBoardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/housekeeping/rooms');
      if (res.ok) {
        const data = (await res.json()) as { rooms: HousekeepingBoardRow[] };
        setRooms(data.rooms);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => countByStatus(rooms), [rooms]);

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">HK Durum Raporu</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void load()}>Yenile</Button>
        </div>
        <div className="roomio-kpi-grid" style={{ marginTop: 12 }}>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Temiz</span><strong className="roomio-kpi-value">{counts.clean}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Kirli</span><strong className="roomio-kpi-value">{counts.dirty}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Kontrol</span><strong className="roomio-kpi-value">{counts.inspect}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">OOO</span><strong className="roomio-kpi-value">{counts.ooo}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">DND</span><strong className="roomio-kpi-value">{counts.dnd}</strong></div>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/api/reports/export?format=csv&module=hk">CSV indir</Button>
          <Button variant="ghost" href="/housekeeping/rooms">Oda listesi</Button>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>Oda</th><th>Kat</th><th>Tip</th><th>Durum</th><th>Personel</th><th>Misafir</th></tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr><td colSpan={6} className="roomio-table-empty">Veri yok.</td></tr>
            ) : rooms.slice(0, 50).map((r) => (
              <tr key={r.id}>
                <td><strong>{r.roomNo}</strong></td>
                <td>{r.floor}</td>
                <td>{r.type}</td>
                <td>{HK_STATUS_LABELS[r.status]}</td>
                <td>{r.assignedTo ?? '—'}</td>
                <td>{r.guestName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rooms.length > 50 ? <p className="roomio-page-desc" style={{ padding: 8 }}>İlk 50 oda gösteriliyor — CSV ile tam liste.</p> : null}
      </div>
    </div>
  );
}

export function EnergyConsumptionPanel() {
  const [occupied, setOccupied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void roomioFetch('/api/housekeeping/rooms')
      .then((r) => r.json())
      .then((j: { rooms?: HousekeepingBoardRow[] }) => {
        const occ = new Set(
          (j.rooms ?? []).filter((r) => r.guestName).map((r) => r.roomNo),
        );
        setOccupied(occ);
      })
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => buildEnergyRows(occupied), [occupied]);
  const totalToday = rows.reduce((s, r) => s + r.kwhToday, 0);
  const totalMonth = rows.reduce((s, r) => s + r.kwhMonth, 0);

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Enerji Tüketim Tablosu</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Oda bazlı günlük ve aylık tüketim tahmini (kWh).</p>
        <div className="roomio-kpi-strip" style={{ marginTop: 12 }}>
          <span className="roomio-badge">Bugün: {totalToday.toFixed(1)} kWh</span>
          <span className="roomio-badge">Ay (tahmini): {totalMonth.toFixed(0)} kWh</span>
          <span className="roomio-badge">Dolu oda: {occupied.size}</span>
        </div>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>Oda</th><th>Kat</th><th>Tip</th><th>Durum</th><th>HVAC</th><th>Bugün kWh</th><th>Ay kWh</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Yükleniyor…</td></tr>
            ) : rows.map((r) => (
              <tr key={r.roomNo}>
                <td><strong>{r.roomNo}</strong></td>
                <td>{r.floor}</td>
                <td>{r.type}</td>
                <td>{r.occupied ? 'Dolu' : 'Boş'}</td>
                <td>{r.hvacMode}</td>
                <td>{r.kwhToday}</td>
                <td>{r.kwhMonth}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="roomio-page-desc" style={{ padding: 8 }}>
          <Link href="/housekeeping">HK Pano</Link>
        </p>
      </div>
    </div>
  );
}

export function RoomFixturesPanel() {
  const fixtures = useMemo(() => buildRoomFixtures(), []);
  const replaceCount = fixtures.reduce(
    (s, f) => s + f.items.filter((i) => i.condition === 'replace').length,
    0,
  );

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Oda Demirbaş Listesi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Oda envanter ve demirbaş durumu.</p>
        <div className="roomio-kpi-strip" style={{ marginTop: 12 }}>
          <span className="roomio-badge">{fixtures.length} oda</span>
          <span className="roomio-badge">Değişim gerekli: {replaceCount}</span>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/api/reports/export?format=csv&module=fixtures">CSV indir</Button>
        </div>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>Oda</th><th>Tip</th><th>Kalem</th><th>Adet</th><th>Durum</th></tr>
          </thead>
          <tbody>
            {fixtures.flatMap((f) =>
              f.items.map((item) => (
                <tr key={`${f.roomNo}-${item.name}`}>
                  <td><strong>{f.roomNo}</strong></td>
                  <td>{f.type}</td>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>
                    <span className={`roomio-badge${item.condition === 'replace' ? ' roomio-text-warn' : ''}`}>
                      {item.condition === 'good' ? 'İyi' : item.condition === 'fair' ? 'Orta' : 'Değişim'}
                    </span>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
