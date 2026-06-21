'use client';

import { foreignToTry, formatMoney, rateMapFromRows } from '@/lib/exchange/money';
import type { PaymentCurrency } from '@/lib/exchange/types';
import type { TaxBreakdown } from '@/lib/tax/types';

type RateMap = ReturnType<typeof rateMapFromRows>;

type Props = {
  currency: string;
  rate: number;
  rateDate: string;
  exchangeRate: number;
  currencyOptions: string[];
  nights: number;
  roomCount: number;
  discountPct: number;
  gross: number;
  subtotal: number;
  taxes: TaxBreakdown;
  rateMap: RateMap;
  fxReady: boolean;
  fxLoading: boolean;
  fxDate?: string;
  onCurrencyChange: (next: PaymentCurrency) => void;
  onRateChange: (rate: number) => void;
  onRefreshFx: () => void;
};

function fxAmount(amount: number, currency: string, rates: RateMap): number {
  return foreignToTry(amount, currency, rates);
}

function DetailRow({
  label,
  amount,
  currency,
  rates,
  muted,
  strong,
}: {
  label: string;
  amount: number;
  currency: string;
  rates: RateMap;
  muted?: boolean;
  strong?: boolean;
}) {
  const tryAmount = fxAmount(amount, currency, rates);
  return (
    <tr className={strong ? 'is-total' : muted ? 'is-muted' : undefined}>
      <td>{label}</td>
      <td>{formatMoney(amount, currency)}</td>
      <td>{formatMoney(tryAmount, 'TRY')}</td>
    </tr>
  );
}

/** Elektra screen-038 — Fiyat + Döviz Kuru + Hesap detayı (döviz + TRY) */
export function ReservationPricingPanel({
  currency,
  rate,
  rateDate,
  exchangeRate,
  currencyOptions,
  nights,
  roomCount,
  discountPct,
  gross,
  subtotal,
  taxes,
  rateMap,
  fxReady,
  fxLoading,
  fxDate,
  onCurrencyChange,
  onRateChange,
  onRefreshFx,
}: Props) {
  const nightLabel = nights > 0 ? `${nights} gece × ${roomCount} oda` : `${roomCount} oda`;

  return (
    <div className="roomio-elektra-pricing">
      <div className="roomio-elektra-pricing__top">
        <div className="roomio-elektra-pricing__price-block">
          <label className="roomio-field">
            <span>Fiyat (gece)</span>
            <div className="roomio-elektra-pricing__price-row">
              <input
                className="roomio-input"
                type="number"
                min={0}
                step={currency === 'JPY' ? 1 : currency === 'TRY' ? 100 : 0.01}
                value={rate}
                onChange={(e) => onRateChange(Number(e.target.value))}
              />
              <select
                className="roomio-select roomio-elektra-pricing__currency"
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as PaymentCurrency)}
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <div className="roomio-elektra-pricing__rate-block">
          <label className="roomio-field">
            <span>Döviz kuru (TCMB alış)</span>
            <div className="roomio-elektra-pricing__rate-row">
              <input
                className="roomio-input"
                type="text"
                readOnly
                value={exchangeRate > 0 || currency === 'TRY'
                  ? exchangeRate.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
                  : '—'}
              />
              <span className="roomio-elektra-pricing__rate-code">{currency}</span>
            </div>
          </label>
        </div>

        <label className="roomio-field">
          <span>Kur günü (giriş)</span>
          <input
            className="roomio-input"
            type="text"
            readOnly
            value={rateDate}
          />
        </label>
      </div>

      <div className="roomio-elektra-pricing__status">
        {fxLoading ? (
          <span>Giriş günü TCMB kuru yükleniyor…</span>
        ) : fxReady ? (
          <span>Giriş günü TCMB alış kuru · {fxDate ?? rateDate}</span>
        ) : (
          <>
            <span>TCMB kurları alınamadı.</span>
            <button type="button" className="roomio-link-btn" onClick={onRefreshFx}>Yeniden dene</button>
          </>
        )}
        {currency !== 'TRY' && !fxReady ? (
          <span className="roomio-elektra-pricing__warn">TL karşılığı kur gelince hesaplanır.</span>
        ) : null}
      </div>

      <section className="roomio-elektra-pricing__detail">
        <h3 className="roomio-elektra-pricing__detail-title">Hesap detayı</h3>
        <div className="roomio-table-wrap">
          <table className="roomio-table roomio-pricing-detail-table">
            <thead>
              <tr>
                <th>Kalem</th>
                <th>{currency}</th>
                <th>TRY (giriş günü alış)</th>
              </tr>
            </thead>
            <tbody>
              <DetailRow label="Gece fiyatı" amount={rate} currency={currency} rates={rateMap} />
              <DetailRow label={`Konaklama · ${nightLabel}`} amount={gross} currency={currency} rates={rateMap} />
              {discountPct > 0 ? (
                <DetailRow label={`İndirim %${discountPct}`} amount={-(gross - subtotal)} currency={currency} rates={rateMap} muted />
              ) : null}
              <DetailRow label="Ara toplam" amount={subtotal} currency={currency} rates={rateMap} />
              {taxes.lines.map((line) => (
                <DetailRow key={line.code} label={`${line.name} (%${line.rate})`} amount={line.amount} currency={currency} rates={rateMap} />
              ))}
              <DetailRow label="Toplam" amount={taxes.total} currency={currency} rates={rateMap} strong />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
