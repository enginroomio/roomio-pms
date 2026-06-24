'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/reception';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

type Props = {
  reservationId: string;
  guestName: string;
  balance: number;
  window?: 'guest' | 'company';
  onComplete?: () => void;
};

export function GuestFolioPayment({ reservationId, guestName, balance, window = 'guest', onComplete }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function collectPayment() {
    if (balance <= 0) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/folio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          amount: balance,
          description: `Tahsilat — ${guestName}`,
          window,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Tahsilat başarısız'));
      const json = (await res.json()) as { ok?: boolean };
      if (!json.ok) throw new Error('Tahsilat başarısız');
      setMsg(`Tahsilat kaydedildi: ${formatMoney(balance)}`);
      onComplete?.();
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="ghost" disabled={busy || balance <= 0} onClick={() => void collectPayment()}>
        {busy ? 'Kaydediliyor…' : balance > 0 ? `Tahsilat (${formatMoney(balance)})` : 'Tahsilat'}
      </Button>
      {msg ? <span className="roomio-page-desc">{msg}</span> : null}
    </div>
  );
}
