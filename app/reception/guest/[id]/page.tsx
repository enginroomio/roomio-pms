import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button, StatusBadge } from '@/components/ui';
import { enrichInHouse, formatDate, formatMoney, getReservationForReception } from '@/lib/data/reception';

type Props = { params: Promise<{ id: string }> };

export default async function GuestFolioPage({ params }: Props) {
  const { id } = await params;
  const r = getReservationForReception(id);
  if (!r || r.status !== 'CHECKED_IN') notFound();
  const guest = enrichInHouse(r);

  return (
    <PageHeader
      breadcrumb={`Resepsiyon > Oda ${guest.roomNo} > Folyo`}
      title={guest.guestName}
      description={`Oda ${guest.roomNo} · ${guest.roomType} · Çıkış ${formatDate(guest.checkOut)}`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" href="/reception/inhouse">← Konaklayanlar</Button>
          <Button variant="ghost">Tahsilat</Button>
        </div>
      }
    >
      <div className="roomio-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Folyo Bakiye</div>
          <div className="roomio-kpi-value">{formatMoney(guest.folioBalance)}</div>
        </div>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Gece</div>
          <div className="roomio-kpi-value">{guest.nights}</div>
        </div>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Durum</div>
          <div style={{ marginTop: 8 }}><StatusBadge status={guest.status} /></div>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Açıklama</th>
              <th>Tip</th>
              <th>Tutar</th>
            </tr>
          </thead>
          <tbody>
            {guest.folioLines.map((line) => (
              <tr key={line.id}>
                <td>{formatDate(line.date)}</td>
                <td>{line.description}</td>
                <td>{line.type === 'charge' ? 'Harcama' : 'Tahsilat'}</td>
                <td className={line.type === 'payment' ? 'roomio-text-credit' : ''}>
                  {line.type === 'payment' ? '−' : ''}{formatMoney(line.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageHeader>
  );
}
