'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/reception';
import { useFolioDetail } from '@/lib/client/use-folio-balances';

type Props = {
  reservationId: string;
  guestName: string;
};

export function ReservationFolioSummary({ reservationId, guestName }: Props) {
  const { detail, loading, error, reload } = useFolioDetail(reservationId);
  const totalBalance = detail ? detail.guestBalance + detail.companyBalance : 0;

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Folyo özeti</h2>
        <Button variant="ghost" disabled={loading} onClick={() => void reload()}>
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </Button>
      </div>
      {loading && !detail ? (
        <p className="roomio-page-desc">Folyo yükleniyor…</p>
      ) : error ? (
        <p className="roomio-page-desc roomio-text-warn" role="alert">{error}</p>
      ) : detail ? (
        <dl className="roomio-dl">
          <dt>Toplam bakiye</dt>
          <dd className={totalBalance > 0 ? 'roomio-text-warn' : ''}>
            <strong>{formatMoney(totalBalance)}</strong>
          </dd>
          <dt>Misafir bakiyesi</dt>
          <dd className={detail.guestBalance > 0 ? 'roomio-text-warn' : ''}>
            {formatMoney(detail.guestBalance)}
            <span className="roomio-text-muted" style={{ marginLeft: 8, fontSize: '0.85rem' }}>
              ({detail.guestLines} satır)
            </span>
          </dd>
          <dt>Şirket bakiyesi</dt>
          <dd>{formatMoney(detail.companyBalance)}
            <span className="roomio-text-muted" style={{ marginLeft: 8, fontSize: '0.85rem' }}>
              ({detail.companyLines} satır)
            </span>
          </dd>
        </dl>
      ) : (
        <p className="roomio-page-desc">Folyo kaydı yok</p>
      )}
      <p style={{ marginTop: 12, fontSize: '0.85rem' }}>
        <Link href={`/reception/guest/${reservationId}`} className="roomio-link">
          {guestName} — tam folyo görünümü
        </Link>
      </p>
    </div>
  );
}
