'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { EgmKimlikDrawer } from '@/components/egm/EgmKimlikDrawer';
import { EgmStatusBadge } from '@/components/egm/EgmStatusBadge';
import { roomioFetch } from '@/lib/client/api';
import { formatDate } from '@/lib/data/reservations';
import { mergeReservationEgm, reservationToEgmSeed, type ReservationEgmRow } from '@/lib/egm/merge';
import type { EgmIdentityRecord, EgmNotifyStatus } from '@/lib/egm/types';
import type { Reservation } from '@/lib/types/reservation';

const ALL = 'ALL' as const;

type Props = {
  reservations: Reservation[];
  onRefreshReservations?: () => void;
};

export function ReservationEgmTab({ reservations, onRefreshReservations }: Props) {
  const [records, setRecords] = useState<EgmIdentityRecord[]>([]);
  const [query, setQuery] = useState('');
  const [egmFilter, setEgmFilter] = useState<EgmNotifyStatus | typeof ALL>(ALL);
  const [drawerRow, setDrawerRow] = useState<ReservationEgmRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await roomioFetch('/api/egm/identity');
    const j = (await res.json()) as { records?: EgmIdentityRecord[] };
    setRecords(j.records ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => mergeReservationEgm(reservations, records), [reservations, records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (egmFilter !== ALL && row.status !== egmFilter) return false;
      if (!q) return true;
      const r = row.reservation;
      return (
        r.guestName.toLowerCase().includes(q) ||
        r.refNo.toLowerCase().includes(q) ||
        (r.roomNo?.includes(q) ?? false)
      );
    });
  }, [rows, query, egmFilter]);

  const stats = useMemo(() => ({
    missing: rows.filter((r) => r.status === 'missing').length,
    ready: rows.filter((r) => r.status === 'ready').length,
    sent: rows.filter((r) => r.status === 'sent').length,
    error: rows.filter((r) => r.status === 'error').length,
  }), [rows]);

  function openDrawer(row: ReservationEgmRow) {
    setDrawerRow(row);
  }

  function onSaved(record: EgmIdentityRecord) {
    setRecords((prev) => {
      const rest = prev.filter((r) => r.id !== record.id && r.reservationId !== record.reservationId);
      return [record, ...rest];
    });
    setDrawerRow((prev) => (prev ? { ...prev, egm: record, status: record.status } : prev));
    onRefreshReservations?.();
    void load();
  }

  return (
    <>
      <div className="roomio-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', marginTop: 16 }}>
        <div className="roomio-kpi"><div className="roomio-kpi-label">Eksik bilgi</div><div className="roomio-kpi-value">{stats.missing}</div></div>
        <div className="roomio-kpi"><div className="roomio-kpi-label">Gönderime hazır</div><div className="roomio-kpi-value">{stats.ready}</div></div>
        <div className="roomio-kpi"><div className="roomio-kpi-label">EGM gönderildi</div><div className="roomio-kpi-value">{stats.sent}</div></div>
        <div className="roomio-kpi"><div className="roomio-kpi-label">Hata</div><div className="roomio-kpi-value">{stats.error}</div></div>
      </div>

      <div className="roomio-card roomio-egm-intro">
        <p className="roomio-page-desc" style={{ margin: 0 }}>
          Rezervasyon listesi ile EGM/KBS kimlik bildirimi birleşik görünüm. Satırdan kimlik formunu açın, kaydedin ve EGM&apos;ye gönderin.
          {' · '}
          <a href="/reception?tab=kimlik" className="roomio-link">Resepsiyon kimlik listesi</a>
        </p>
      </div>

      <div className="roomio-card roomio-filter-bar">
        <input className="roomio-input" placeholder="Misafir, rez. no, oda…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Ara" />
        <select className="roomio-select" value={egmFilter} onChange={(e) => setEgmFilter(e.target.value as EgmNotifyStatus | typeof ALL)} aria-label="EGM durumu">
          <option value={ALL}>Tüm EGM durumları</option>
          <option value="missing">Eksik bilgi</option>
          <option value="draft">Taslak</option>
          <option value="ready">Gönderime hazır</option>
          <option value="sent">EGM gönderildi</option>
          <option value="error">Hata</option>
        </select>
        <Button variant="ghost" onClick={() => { setQuery(''); setEgmFilter(ALL); }}>Temizle</Button>
      </div>

      <div className="roomio-card roomio-table-wrap">
        {loading ? <p className="roomio-page-desc">EGM kayıtları yükleniyor…</p> : (
          <table className="roomio-table roomio-table--egm">
            <thead>
              <tr>
                <th>Rez. No</th>
                <th>Misafir</th>
                <th>Oda</th>
                <th>Giriş</th>
                <th>Uyruk</th>
                <th>Kimlik no</th>
                <th>EGM durumu</th>
                <th>Son işlem</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="roomio-table-empty">Kayıt bulunamadı.</td></tr>
              ) : (
                filtered.map((row) => {
                  const r = row.reservation;
                  const egm = row.egm;
                  return (
                    <tr key={r.id} className={row.status === 'missing' ? 'roomio-table-row--warn' : undefined}>
                      <td><strong>{r.refNo}</strong></td>
                      <td>{r.guestName}</td>
                      <td>{r.roomNo ?? '—'}</td>
                      <td>{formatDate(r.checkIn)}</td>
                      <td>{egm?.nationality ?? r.extraData?.nationality ?? '—'}</td>
                      <td>{egm?.idNo ? `${egm.idNo.slice(0, 3)}***` : '—'}</td>
                      <td><EgmStatusBadge status={row.status} compact /></td>
                      <td className="roomio-text-muted">{egm?.sentAt ?? egm?.createdAt?.slice(0, 10) ?? '—'}</td>
                      <td>
                        <Button variant="secondary" onClick={() => openDrawer(row)}>
                          {row.status === 'sent' ? 'Görüntüle' : 'Kimlik'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
        <p className="roomio-table-footer">{filtered.length} rezervasyon · EGM entegrasyonu (demo)</p>
      </div>

      <EgmKimlikDrawer
        open={Boolean(drawerRow)}
        seed={drawerRow ? reservationToEgmSeed(drawerRow.reservation) : {}}
        record={drawerRow?.egm}
        onClose={() => setDrawerRow(null)}
        onSaved={onSaved}
      />
    </>
  );
}
