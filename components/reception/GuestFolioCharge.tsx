'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/reception';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

type Props = {
  reservationId: string;
  window?: 'guest' | 'company';
  onComplete?: () => void;
};

export function GuestFolioCharge({ reservationId, window = 'guest', onComplete }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function postCharge() {
    const value = Number(amount.replace(',', '.'));
    if (!description.trim() || !Number.isFinite(value) || value <= 0) {
      setMsg('Geçerli açıklama ve tutar girin');
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
          reservationId,
          amount: value,
          description: description.trim(),
          window,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Harcama kaydedilemedi'));
      const json = (await res.json()) as { ok?: boolean };
      if (!json.ok) throw new Error('Harcama kaydedilemedi');
      setMsg(`Harcama eklendi: ${formatMoney(value)}`);
      setDescription('');
      setAmount('');
      setOpen(false);
      onComplete?.();
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Harcama ekle
      </Button>
    );
  }

  return (
    <div className="roomio-card" style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        className="roomio-input"
        placeholder="Açıklama (ör. Minibar)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ minWidth: 180 }}
      />
      <input
        className="roomio-input"
        type="number"
        min={0}
        step={0.01}
        placeholder="Tutar"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ width: 100 }}
      />
      <Button disabled={busy} onClick={() => void postCharge()}>{busy ? '…' : 'Kaydet'}</Button>
      <Button variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
      {msg ? <span className="roomio-page-desc">{msg}</span> : null}
    </div>
  );
}
