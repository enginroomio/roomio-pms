'use client';

import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { formatMoney } from '@/lib/data/cash';
import type { FxExchange } from '@/lib/data/cash';
import type { ExchangeRateSnapshot } from '@/lib/exchange/types';

type Props = {
  reloadKey?: number;
};

export function FxExchangeList({ reloadKey = 0 }: Props) {
  const [fx, setFx] = useState<ExchangeRateSnapshot | null>(null);
  const [exchanges, setExchanges] = useState<FxExchange[]>([]);
  const [businessDate, setBusinessDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ratesRes, listRes] = await Promise.all([
        roomioFetch('/api/exchange-rates'),
        roomioFetch('/api/fx-exchanges'),
      ]);
      if (!ratesRes.ok) throw new Error(await parseApiError(ratesRes, 'TCMB kurları alınamadı'));
      const ratesJ = (await ratesRes.json()) as ExchangeRateSnapshot & { error?: string };
      if (!ratesJ.rates?.length) throw new Error(ratesJ.error ?? 'TCMB kurları alınamadı');
      setFx(ratesJ);
      if (!listRes.ok) throw new Error(await parseApiError(listRes, 'Bozdurma listesi alınamadı'));
      const listJ = (await listRes.json()) as { exchanges?: FxExchange[]; businessDate?: string };
      setExchanges(listJ.exchanges ?? []);
      setBusinessDate(listJ.businessDate ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  if (error) {
    return <p className="roomio-alert roomio-alert--warn">{error}</p>;
  }

  if (loading || !fx) {
    return <p className="roomio-page-desc">TCMB kurları ve bozdurma listesi yükleniyor…</p>;
  }

  return (
    <>
      <p className="roomio-page-desc" style={{ marginBottom: 12 }}>
        Bozdurma kuru: TCMB alış − %{fx.exchangeDiscountPct} indirim · Tarih: {fx.date}
        {businessDate ? ` · İş günü: ${businessDate}` : ''}
      </p>
      <table className="roomio-table">
        <thead>
          <tr><th>Saat</th><th>Misafir</th><th>Oda</th><th>Döviz</th><th>Bozdurma kuru</th><th>TRY</th><th>Kullanıcı</th></tr>
        </thead>
        <tbody>
          {exchanges.length === 0 ? (
            <tr><td colSpan={7}>Bu iş günü için bozdurma kaydı yok.</td></tr>
          ) : (
            exchanges.map((row) => (
              <tr key={row.id}>
                <td>{row.time}</td>
                <td>{row.guest}</td>
                <td>{row.roomNo}</td>
                <td>{row.fromAmount} {row.fromCurrency}</td>
                <td>{row.rate.toFixed(4)}</td>
                <td>{formatMoney(row.tryAmount)}</td>
                <td>{row.user}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
