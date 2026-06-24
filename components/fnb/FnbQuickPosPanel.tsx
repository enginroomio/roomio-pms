'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import { useReservations } from '@/lib/client/use-reservations';
import { formatMoney } from '@/lib/data/cash';
import type { ExtraChargeRow } from '@/lib/server/extra-charges';

type Props = {
  cardPrep?: boolean;
};

export function FnbQuickPosPanel({ cardPrep }: Props) {
  const { t } = useI18n();
  const { reservations } = useReservations();
  const inHouse = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN' && r.roomNo),
    [reservations],
  );

  const [reservationId, setReservationId] = useState('');
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('450');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [presets, setPresets] = useState<ExtraChargeRow[]>([]);

  const loadPresets = useCallback(async () => {
    const res = await roomioFetch('/api/extra-charges');
    const j = (await res.json()) as { charges?: ExtraChargeRow[] };
    setPresets((j.charges ?? []).filter((c) => c.active).slice(0, 6));
  }, []);

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  const selected = inHouse.find((r) => r.id === reservationId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setMsg(t('fnb.pos.selectRoom'));
      return;
    }
    const value = Number(amount.replace(',', '.'));
    if (!item.trim() || !Number.isFinite(value) || value <= 0) {
      setMsg(t('fnb.pos.invalid'));
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/folio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'charge',
          reservationId: selected.id,
          amount: value,
          description: cardPrep ? `POS kart — ${item}` : `Hızlı POS — ${item}`,
          user: 'F&B',
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || j.ok === false) throw new Error(j.error ?? t('fnb.banket.folioFail'));
      setMsg(t('fnb.pos.success').replace('{room}', selected.roomNo ?? '').replace('{amount}', formatMoney(value)));
      setItem('');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('gr.traces.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <h2 className="roomio-card-title">{cardPrep ? t('fnb.title.cardPrep') : t('fnb.title.quickPos')}</h2>
      <p className="roomio-page-desc">
        {cardPrep ? t('fnb.pos.cardPrepDesc') : t('fnb.pos.desc')}
      </p>
      <form className="roomio-form" onSubmit={(e) => void submit(e)} style={{ marginTop: 16 }}>
        {presets.length ? (
          <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {presets.map((p) => (
              <button
                key={p.code}
                type="button"
                className="roomio-btn roomio-btn--secondary"
                onClick={() => {
                  setItem(p.name);
                  setAmount(String(p.price));
                }}
              >
                {p.name} · {p.priceLabel}
              </button>
            ))}
          </div>
        ) : null}
        <div className="roomio-form-grid">
          <label className="roomio-field roomio-field--full">
            <span>{t('fnb.pos.room')}</span>
            <select className="roomio-select" value={reservationId} onChange={(e) => setReservationId(e.target.value)}>
              <option value="">{t('fnb.pos.roomSelect')}</option>
              {inHouse.map((r) => (
                <option key={r.id} value={r.id}>{r.roomNo} — {r.guestName}</option>
              ))}
            </select>
          </label>
          <label className="roomio-field"><span>{t('fnb.pos.product')}</span><input className="roomio-input" value={item} onChange={(e) => setItem(e.target.value)} placeholder={t('fnb.pos.productPlaceholder')} /></label>
          <label className="roomio-field"><span>{t('fnb.pos.amount')}</span><input className="roomio-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 16 }}>
          <Button type="submit" disabled={busy}>{busy ? t('fnb.pos.submitting') : t('fnb.pos.submit')}</Button>
          <Button variant="secondary" href="/fnb">{t('fnb.pos.backBanket')}</Button>
        </div>
        {msg ? <p className="roomio-page-desc" style={{ marginTop: 12 }}>{msg}</p> : null}
      </form>
    </div>
  );
}
