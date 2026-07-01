'use client';

import { useState } from 'react';
import type { FolioLine } from '@/lib/data/reception-queries';
import { formatDate, formatMoney } from '@/lib/data/reception';
import { FolioAmountCell } from '@/components/folio/FolioAmountCell';
import { GuestFolioCharge } from '@/components/reception/GuestFolioCharge';
import { GuestFolioPayment } from '@/components/reception/GuestFolioPayment';
import { CompanyFolioInvoiceButton } from '@/components/reception/CompanyFolioInvoiceButton';

type FolioWindow = 'guest' | 'company';

type Props = {
  reservationId: string;
  guestName: string;
  guestLines: FolioLine[];
  companyLines: FolioLine[];
  guestBalance: number;
  companyBalance: number;
  onFolioChange?: () => void;
};

function balance(lines: FolioLine[]): number {
  const charges = lines.filter((l) => l.type === 'charge').reduce((s, l) => s + l.amount, 0);
  const payments = lines.filter((l) => l.type === 'payment').reduce((s, l) => s + l.amount, 0);
  return charges - payments;
}

export function GuestFolioSplitPanel({
  reservationId,
  guestName,
  guestLines,
  companyLines,
  guestBalance,
  companyBalance,
  onFolioChange,
}: Props) {
  const [window, setWindow] = useState<FolioWindow>('guest');
  const lines = window === 'guest' ? guestLines : companyLines;
  const activeBalance = window === 'guest' ? guestBalance : companyBalance;
  const totalBalance = guestBalance + companyBalance;

  return (
    <>
      <nav className="roomio-tabs" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`roomio-tab${window === 'guest' ? ' is-active' : ''}`}
          onClick={() => setWindow('guest')}
        >
          Misafir folyosu ({formatMoney(guestBalance)})
        </button>
        <button
          type="button"
          className={`roomio-tab${window === 'company' ? ' is-active' : ''}`}
          onClick={() => setWindow('company')}
        >
          Şirket folyosu ({formatMoney(companyBalance)})
        </button>
      </nav>

      <div className="roomio-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Aktif pencere bakiye</div>
          <div className="roomio-kpi-value">{formatMoney(activeBalance)}</div>
        </div>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Misafir / Şirket</div>
          <div className="roomio-kpi-value" style={{ fontSize: '1rem' }}>
            {formatMoney(guestBalance)} / {formatMoney(companyBalance)}
          </div>
        </div>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Toplam bakiye</div>
          <div className="roomio-kpi-value">{formatMoney(totalBalance)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <GuestFolioCharge reservationId={reservationId} window={window} onComplete={onFolioChange} />
        <GuestFolioPayment
          reservationId={reservationId}
          guestName={guestName}
          balance={activeBalance}
          window={window}
          onComplete={onFolioChange}
        />
        {window === 'company' ? (
          <CompanyFolioInvoiceButton reservationId={reservationId} balance={activeBalance} />
        ) : null}
      </div>

      <div id="folio-section" className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Açıklama</th>
              <th>Tip</th>
              <th>Tutar</th>
              <th>TL karşılığı</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan={5}>Bu pencerede hareket yok.</td></tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id}>
                  <td>{formatDate(line.date)}</td>
                  <td>{line.description}</td>
                  <td>{line.type === 'charge' ? 'Harcama' : 'Tahsilat'}</td>
                  <td className={line.type === 'payment' ? 'roomio-text-credit' : ''}>
                    {line.type === 'payment' ? '−' : ''}
                    <FolioAmountCell line={line} part="foreign" />
                  </td>
                  <td className={line.type === 'payment' ? 'roomio-text-credit' : ''}>
                    {line.type === 'payment' ? '−' : ''}
                    <FolioAmountCell line={line} part="try" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export { balance as folioWindowBalance };
