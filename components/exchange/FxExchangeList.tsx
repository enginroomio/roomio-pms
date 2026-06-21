'use client';

import { useEffect, useMemo, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import { DEMO_FX_EXCHANGES, formatMoney } from '@/lib/data/cash';
import { foreignToTryExchange, rateMapFromRows } from '@/lib/exchange/money';
import type { ExchangeRateSnapshot } from '@/lib/exchange/types';

export function FxExchangeList() {
  const [fx, setFx] = useState<ExchangeRateSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await roomioFetch('/api/exchange-rates');
      const j = (await res.json()) as ExchangeRateSnapshot & { error?: string };
      if (res.ok && j.rates?.length) setFx(j);
      else setError(j.error ?? 'TCMB kurları alınamadı');
    })();
  }, []);

  const rows = useMemo(() => {
    if (!fx) return [];
    const map = rateMapFromRows(fx.rates);
    return DEMO_FX_EXCHANGES.map((row) => {
      const rate = map.get(row.fromCurrency)?.tryPerUnitExchange ?? row.rate;
      const tryAmount = foreignToTryExchange(row.fromAmount, row.fromCurrency, map);
      return { ...row, rate, tryAmount };
    });
  }, [fx]);

  if (error) {
    return <p className="roomio-alert roomio-alert--warn">{error}</p>;
  }

  if (!fx) {
    return <p className="roomio-page-desc">TCMB kurları yükleniyor…</p>;
  }

  return (
    <>
      <p className="roomio-page-desc" style={{ marginBottom: 12 }}>
        Bozdurma kuru: TCMB alış − %{fx.exchangeDiscountPct} indirim · Tarih: {fx.date}
      </p>
      <table className="roomio-table">
        <thead>
          <tr><th>Saat</th><th>Misafir</th><th>Oda</th><th>Döviz</th><th>Bozdurma kuru</th><th>TRY</th><th>Kullanıcı</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.time}</td>
              <td>{row.guest}</td>
              <td>{row.roomNo}</td>
              <td>{row.fromAmount} {row.fromCurrency}</td>
              <td>{row.rate.toFixed(4)}</td>
              <td>{formatMoney(row.tryAmount)}</td>
              <td>{row.user}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
