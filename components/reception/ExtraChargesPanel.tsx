'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import type { ExtraChargeRow } from '@/lib/server/extra-charges';

type Props = {
  checkIn: string;
  checkOut: string;
  selected: string[];
  onChange: (codes: string[]) => void;
};

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function estimateAmount(charge: ExtraChargeRow, nights: number): number {
  if (charge.priceUnit === 'gece') return charge.price * nights;
  return charge.price;
}

export function ExtraChargesCheckInPicker({ checkIn, checkOut, selected, onChange }: Props) {
  const [charges, setCharges] = useState<ExtraChargeRow[]>([]);
  const nights = nightsBetween(checkIn, checkOut);

  const load = useCallback(async () => {
    const res = await roomioFetch('/api/extra-charges');
    const j = (await res.json()) as { charges?: ExtraChargeRow[] };
    setCharges((j.charges ?? []).filter((c) => c.active));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(code: string) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  }

  if (!charges.length) return null;

  return (
    <div className="roomio-card" style={{ marginTop: 0 }}>
      <h2 className="roomio-card-title">Ek Ücretler</h2>
      <p className="roomio-page-desc">Seçilen ücretler check-in ile birlikte misafir folyosuna yazılır.</p>
      <ul className="roomio-extra-charge-list" style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
        {charges.map((c) => {
          const est = estimateAmount(c, nights);
          const sym = c.currency === 'TRY' ? '₺' : c.currency;
          return (
            <li key={c.code} style={{ marginBottom: 8 }}>
              <label className="roomio-field roomio-field--checkbox">
                <input
                  type="checkbox"
                  checked={selected.includes(c.code)}
                  onChange={() => toggle(c.code)}
                />
                <span>
                  <strong>{c.name}</strong> ({c.code}) — {sym}{est.toLocaleString('tr-TR')}
                  {c.priceUnit === 'gece' ? ` · ${nights} gece` : ''}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type FolioProps = {
  reservationId: string;
  onApplied?: () => void;
};

export function ExtraChargesFolioPanel({ reservationId, onApplied }: FolioProps) {
  const [charges, setCharges] = useState<ExtraChargeRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await roomioFetch('/api/extra-charges');
    const j = (await res.json()) as { charges?: ExtraChargeRow[] };
    setCharges((j.charges ?? []).filter((c) => c.active));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function apply() {
    if (!selected.length) {
      setMsg('En az bir ek ücret seçin');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/folio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extra_charges',
          reservationId,
          extraChargeCodes: selected,
          user: 'Resepsiyon',
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Kayıt başarısız'));
      const j = (await res.json()) as { ok?: boolean };
      if (!j.ok) throw new Error('Kayıt başarısız');
      setMsg(`${selected.length} ek ücret folyoya yazıldı`);
      setSelected([]);
      onApplied?.();
      if (!onApplied) window.location.reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  if (!charges.length) return null;

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <h2 className="roomio-card-title">Ek Ücret Ekle</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {charges.map((c) => (
          <button
            key={c.code}
            type="button"
            className={`roomio-btn roomio-btn--secondary${selected.includes(c.code) ? ' roomio-btn--primary' : ''}`}
            onClick={() => setSelected((prev) => (
              prev.includes(c.code) ? prev.filter((x) => x !== c.code) : [...prev, c.code]
            ))}
          >
            {c.name} · {c.priceLabel}
          </button>
        ))}
      </div>
      <div className="roomio-form-actions" style={{ marginTop: 12 }}>
        <Button onClick={() => void apply()} disabled={busy}>{busy ? 'Yazılıyor…' : 'Folyoya yaz'}</Button>
      </div>
      {msg ? <p className="roomio-page-desc" style={{ marginTop: 8 }}>{msg}</p> : null}
    </div>
  );
}
