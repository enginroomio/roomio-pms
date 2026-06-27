'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { reservationExtra } from '@/lib/reservations/list-tabs';
import type { Reservation } from '@/lib/types/reservation';

type Row = {
  reservation: Reservation;
  transferIn: string;
  transferOut: string;
  flightNo: string;
  plateNo: string;
};

function pickTransferRows(reservations: Reservation[]): Row[] {
  return reservations
    .map((r) => ({
      reservation: r,
      transferIn: reservationExtra(r, 'transferIn'),
      transferOut: reservationExtra(r, 'transferOut'),
      flightNo: reservationExtra(r, 'flightNo'),
      plateNo: reservationExtra(r, 'plateNo'),
    }))
    .filter((x) => x.transferIn || x.transferOut || x.flightNo || x.plateNo)
    .sort((a, b) => a.reservation.checkIn.localeCompare(b.reservation.checkIn));
}

export function TransferReportPanel({ reservations }: { reservations: Reservation[] }) {
  const rows = useMemo(() => pickTransferRows(reservations), [reservations]);
  const today = new Date().toISOString().slice(0, 10);
  const arrivalsToday = rows.filter((r) => r.reservation.checkIn === today);
  const departuresToday = rows.filter((r) => r.reservation.checkOut === today);

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Transfer Listesi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Rezervasyon ek bilgilerindeki geliş/gidiş transfer saatleri, uçuş ve plaka alanları.
        </p>
        <div className="roomio-kpi-strip" style={{ marginTop: 12 }}>
          <span className="roomio-badge">{rows.length} kayıtlı transfer</span>
          <span className="roomio-badge">Bugün giriş: {arrivalsToday.length}</span>
          <span className="roomio-badge">Bugün çıkış: {departuresToday.length}</span>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/api/reports/export?format=csv&module=transfer">CSV indir</Button>
          <Button variant="ghost" href="/reservations">← Rezervasyonlar</Button>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Rez. no</th>
              <th>Misafir</th>
              <th>Oda</th>
              <th>Giriş</th>
              <th>Çıkış</th>
              <th>Geliş transfer</th>
              <th>Gidiş transfer</th>
              <th>Uçuş</th>
              <th>Plaka</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  Transfer bilgisi yok. Rezervasyon sihirbazı → Ek bilgiler adımından transfer alanlarını doldurun.
                </td>
              </tr>
            ) : rows.map(({ reservation: r, transferIn, transferOut, flightNo, plateNo }) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/reservations/${r.id}/edit`} className="roomio-link">{r.refNo}</Link>
                </td>
                <td><strong>{r.guestName}</strong></td>
                <td>{r.roomNo ?? '—'}</td>
                <td>{r.checkIn}</td>
                <td>{r.checkOut}</td>
                <td>{transferIn || '—'}</td>
                <td>{transferOut || '—'}</td>
                <td>{flightNo || '—'}</td>
                <td>{plateNo || '—'}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
