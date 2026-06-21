'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { formatTcmbRate, tcmbPublishedBuy, tcmbPublishedExchange } from '@/lib/exchange/tcmb-display';
import type { ExchangeRateSnapshot } from '@/lib/exchange/types';

type Props = {
  title?: string;
  compact?: boolean;
  /** Kur günü (YYYY-MM-DD) — Elektra Kur Günü */
  rateDate?: string;
  /** Üst bileşen kurları yönetiyorsa iç fetch atlanır */
  snapshot?: ExchangeRateSnapshot | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  /** Seçili döviz satırını vurgular */
  highlightCode?: string;
};

export function ExchangeRatesTable({
  title = 'TCMB kurları',
  compact = false,
  rateDate,
  snapshot,
  loading: externalLoading,
  error: externalError,
  onRefresh,
  highlightCode,
}: Props) {
  const controlled = snapshot !== undefined;
  const [data, setData] = useState<ExchangeRateSnapshot | null>(null);
  const [loading, setLoading] = useState(!controlled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const date = rateDate;
      const url = refresh
        ? `/api/exchange-rates?refresh=1${date ? `&date=${date}` : ''}`
        : `/api/exchange-rates${date ? `?date=${date}` : ''}`;
      const res = await roomioFetch(url);
      const j = (await res.json()) as ExchangeRateSnapshot & { ok?: boolean; stale?: boolean; error?: string; fetchError?: string };
      if (!res.ok || !j.rates?.length) {
        throw new Error(j.fetchError ?? j.error ?? 'TCMB kurları alınamadı');
      }
      setData(j);
      setError(j.stale && j.error ? `${j.error} (önbellekten gösteriliyor)` : null);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'TCMB kurları alınamadı');
    } finally {
      setLoading(false);
    }
  }, [rateDate]);

  useEffect(() => {
    if (controlled) return;
    void load();
  }, [controlled, load]);

  const displayData = controlled ? snapshot : data;
  const displayLoading = controlled ? Boolean(externalLoading) : loading;
  const displayError = controlled ? externalError ?? null : error;

  const updatedLabel = displayData?.updatedAt
    ? new Date(displayData.updatedAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  return (
    <div className="roomio-card roomio-exchange-rates">
      <div className="roomio-kurulus-toolbar">
        <div>
          <h2 className="roomio-card-title" style={{ margin: 0 }}>{title}</h2>
          <p className="roomio-page-desc" style={{ margin: '4px 0 0' }}>
            Kaynak: <strong>TCMB</strong>
            {rateDate ? ` · Kur günü: ${rateDate}` : ''}
            {displayData ? ` · Tarih: ${displayData.date}` : ''}
            {displayData ? ` · Bozdurma indirimi: %${displayData.exchangeDiscountPct}` : ''}
            {' · Güncelleme: '}{updatedLabel}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => (onRefresh ? onRefresh() : void load(true))}
          disabled={displayLoading}
        >
          {displayLoading ? 'Yükleniyor…' : 'TCMB\'den yenile'}
        </Button>
      </div>

      {displayError ? (
        <p className="roomio-alert roomio-alert--warn" style={{ marginTop: 12 }}>
          {displayError}
          {!displayData ? '. İnternet bağlantısını kontrol edin veya yenileyin — yedek kur kullanılmaz.' : ''}
        </p>
      ) : null}

      {displayData ? (
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Döviz</th>
                {!compact ? <th>Birim</th> : null}
                <th>TCMB alış</th>
                <th>Bozdurma kuru</th>
              </tr>
            </thead>
            <tbody>
              <tr className={highlightCode === 'TRY' ? 'is-selected' : undefined}>
                <td><strong>TRY</strong></td>
                <td>Türk Lirası</td>
                {!compact ? <td>1</td> : null}
                <td>1,0000</td>
                <td>1,0000</td>
              </tr>
              {displayData.rates.map((r) => (
                <tr key={r.code} className={highlightCode === r.code ? 'is-selected' : undefined}>
                  <td><strong>{r.code}</strong></td>
                  <td>{r.name}</td>
                  {!compact ? <td>{r.unit}</td> : null}
                  <td>{formatTcmbRate(tcmbPublishedBuy(r), r.code)}</td>
                  <td><strong>{formatTcmbRate(tcmbPublishedExchange(r), r.code)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
