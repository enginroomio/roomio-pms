'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui';
import { useReservations } from '@/lib/client/use-reservations';

type ChangeKind = 'arrival' | 'departure';

const DEMO_CHANGES: Record<ChangeKind, Array<{ ref: string; guest: string; room: string; oldDate: string; newDate: string; user: string; at: string }>> = {
  arrival: [
    { ref: 'RSV-1042', guest: 'John Smith', room: '312', oldDate: '2026-06-18', newDate: '2026-06-19', user: 'Arda Y.', at: '2026-06-17 14:22' },
    { ref: 'RSV-1088', guest: 'Maria Garcia', room: '205', oldDate: '2026-06-18', newDate: '2026-06-18', user: 'Selin K.', at: '2026-06-17 11:05' },
  ],
  departure: [
    { ref: 'RSV-0991', guest: 'Ahmet Yılmaz', room: '401', oldDate: '2026-06-20', newDate: '2026-06-21', user: 'Murat S.', at: '2026-06-17 16:40' },
    { ref: 'RSV-1015', guest: 'Elena Rossi', room: '118', oldDate: '2026-06-19', newDate: '2026-06-18', user: 'Arda Y.', at: '2026-06-17 09:18' },
  ],
};

export function ReservationDateChangeReportPanel({ kind }: { kind: ChangeKind }) {
  const { reservations } = useReservations();
  const title = kind === 'arrival' ? 'Geliş Tarihi Değişim Tablosu' : 'Ayrılış Tarihi Değişim Tablosu';
  const rows = DEMO_CHANGES[kind];

  const liveCount = useMemo(() => {
    return reservations.filter((r) => r.extraData?.[`${kind}Changed`] === '1').length;
  }, [reservations, kind]);

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">{title}</h2>
          <Button variant="secondary" href={`/api/reports/export?format=csv&report=${kind}-change`}>CSV indir</Button>
        </div>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Planlanan {kind === 'arrival' ? 'giriş' : 'çıkış'} tarihi değişen rezervasyonlar.
          {liveCount > 0 ? ` Canlı işaretli: ${liveCount}` : null}
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="ghost" href="/reservations">Rezervasyon listesi</Button>
          <Link href="/reports?report=room-changes" className="roomio-btn roomio-btn--ghost">Oda değişimleri</Link>
        </div>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Ref</th><th>Misafir</th><th>Oda</th><th>Eski tarih</th><th>Yeni tarih</th><th>Kullanıcı</th><th>Değişim</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ref}>
                <td><strong>{r.ref}</strong></td>
                <td>{r.guest}</td>
                <td>{r.room}</td>
                <td>{r.oldDate}</td>
                <td>{r.newDate}</td>
                <td>{r.user}</td>
                <td>{r.at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
