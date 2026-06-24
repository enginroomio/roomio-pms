'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { formatMoney } from '@/lib/data/cash';
import type { FxExchange } from '@/lib/data/cash';
import { foreignToTryExchange, rateMapFromRows } from '@/lib/exchange/money';
import type { ExchangeRateSnapshot } from '@/lib/exchange/types';
import { useReservations } from '@/lib/client/use-reservations';

type Props = {
  onDone?: () => void;
};

const FX_CODES = ['EUR', 'USD', 'GBP'] as const;

export function FxExchangeForm({ onDone }: Props) {
  const { reservations } = useReservations();
  const inHouse = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN' && r.roomNo),
    [reservations],
  );

  const [fx, setFx] = useState<ExchangeRateSnapshot | null>(null);
  const [reservationId, setReservationId] = useState('');
  const [fromCurrency, setFromCurrency] = useState<(typeof FX_CODES)[number]>('EUR');
  const [fromAmount, setFromAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = useMemo(
    () => inHouse.find((r) => r.id === reservationId),
    [inHouse, reservationId],
  );

  useEffect(() => {
    void roomioFetch('/api/exchange-rates')
      .then(async (r) => {
        if (!r.ok) throw new Error(await parseApiError(r, 'Kurlar yüklenemedi'));
        return r.json() as Promise<ExchangeRateSnapshot>;
      })
      .then((j) => setFx(j))
      .catch((err) => setMsg(err instanceof Error ? err.message : 'Kurlar yüklenemedi'));
  }, []);

  const preview = useMemo(() => {
    if (!fx?.rates?.length) return null;
    const amount = Number(fromAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const map = rateMapFromRows(fx.rates);
    const row = map.get(fromCurrency);
    if (!row?.tryPerUnitExchange) return null;
    return {
      rate: row.tryPerUnitExchange,
      tryAmount: Math.round(foreignToTryExchange(amount, fromCurrency, map)),
    };
  }, [fx, fromAmount, fromCurrency]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setMsg('Konaklayan misafir seçin');
      return;
    }
    const amount = Number(fromAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      setMsg('Geçerli döviz tutarı girin');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/fx-exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest: selected.guestName,
          roomNo: selected.roomNo,
          reservationId: selected.id,
          fromCurrency,
          fromAmount: amount,
          user: 'Resepsiyon',
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Bozdurma kaydedilemedi'));
      const j = (await res.json()) as { ok?: boolean; exchange?: FxExchange; error?: string };
      if (!j.ok) throw new Error(j.error ?? 'Bozdurma kaydedilemedi');
      setFromAmount('');
      setMsg(`Kaydedildi: ${formatMoney(j.exchange?.tryAmount ?? 0)}`);
      onDone?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="roomio-card roomio-form" onSubmit={(e) => void submit(e)} style={{ marginBottom: 16 }}>
      <h3 className="roomio-card-title">Yeni döviz bozdurma</h3>
      <div className="roomio-form-grid">
        <label className="roomio-field roomio-field--full">
          <span>Misafir / Oda</span>
          <select className="roomio-select" value={reservationId} onChange={(e) => setReservationId(e.target.value)}>
            <option value="">Seçin…</option>
            {inHouse.map((r) => (
              <option key={r.id} value={r.id}>{r.roomNo} — {r.guestName}</option>
            ))}
          </select>
        </label>
        <label className="roomio-field">
          <span>Döviz</span>
          <select className="roomio-select" value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value as typeof fromCurrency)}>
            {FX_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="roomio-field">
          <span>Tutar</span>
          <input className="roomio-input" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} placeholder="400" />
        </label>
        {preview ? (
          <div className="roomio-field roomio-field--full">
            <span>Önizleme</span>
            <p className="roomio-page-desc">
              Kur: {preview.rate.toFixed(4)} · TRY: <strong>{formatMoney(preview.tryAmount)}</strong>
            </p>
          </div>
        ) : null}
      </div>
      <div className="roomio-form-actions">
        <Button type="submit" disabled={busy || !fx?.rates?.length}>{busy ? 'Kaydediliyor…' : 'Bozdur'}</Button>
      </div>
      {msg ? <p className="roomio-page-desc" style={{ marginTop: 8 }}>{msg}</p> : null}
    </form>
  );
}
