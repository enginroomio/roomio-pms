'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/reception';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

type Props = {
  reservationId: string;
  balance: number;
};

export function CompanyFolioInvoiceButton({ reservationId, balance }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function issueInvoice() {
    if (balance <= 0) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/folio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'company_invoice',
          reservationId,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Fatura kesilemedi'));
      const json = (await res.json()) as {
        ok?: boolean;
        invoice?: { no: string };
      };
      if (!json.ok) throw new Error('Fatura kesilemedi');
      setMsg(`Fatura kesildi: ${json.invoice?.no ?? '—'}`);
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  if (balance <= 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="secondary" disabled={busy} onClick={() => void issueInvoice()}>
        {busy ? 'Kesiliyor…' : `Şirket faturası (${formatMoney(balance)})`}
      </Button>
      {msg ? <span className="roomio-page-desc">{msg}</span> : null}
    </div>
  );
}
