'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { CASH_REGISTERS, formatMoney, type KasaCloseRow } from '@/lib/data/cash';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

type Props = {
  registers: KasaCloseRow[];
  onDone: () => void;
};

export function KasaOperationsPanel({ registers, onDone }: Props) {
  const [closeId, setCloseId] = useState<string | null>(null);
  const [counted, setCounted] = useState('');
  const [fromReg, setFromReg] = useState<string>(CASH_REGISTERS[0]);
  const [toReg, setToReg] = useState<string>(CASH_REGISTERS[1]);
  const [transferAmt, setTransferAmt] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const openRegisters = registers.filter((r) => r.status === 'open');

  async function postCash(body: Record<string, unknown>) {
    const res = await roomioFetch('/api/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await parseApiError(res, 'İşlem başarısız'));
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!json.ok) throw new Error(json.error ?? 'İşlem başarısız');
  }

  async function handleClose() {
    if (!closeId) return;
    const value = Number(counted.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) {
      setMsg('Geçerli sayım tutarı girin');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await postCash({ action: 'close', registerId: closeId, countedBalance: value });
      setMsg('Kasa kapatıldı');
      setCloseId(null);
      setCounted('');
      onDone();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function handleTransfer() {
    const value = Number(transferAmt.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setMsg('Geçerli devir tutarı girin');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await postCash({ action: 'transfer', fromRegister: fromReg, toRegister: toReg, amount: value });
      setMsg(`Devir kaydedildi: ${formatMoney(value)}`);
      setTransferAmt('');
      onDone();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card">
        <h2 className="roomio-card-title">Kasa kapat</h2>
        <p className="roomio-page-desc">Sayım tutarını girerek günlük kasayı kapatın. Sistem beklenen bakiyeyi hesaplar ve farkı kaydeder.</p>
        {openRegisters.length === 0 ? (
          <p className="roomio-page-desc">Açık kasa yok.</p>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
            <select
              className="roomio-select"
              value={closeId ?? ''}
              onChange={(e) => setCloseId(e.target.value || null)}
            >
              <option value="">Kasa seçin</option>
              {openRegisters.map((r) => (
                <option key={r.id} value={r.id}>{r.register}</option>
              ))}
            </select>
            <input
              className="roomio-input"
              type="number"
              min={0}
              step={0.01}
              placeholder="Sayım tutarı"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              style={{ width: 140 }}
            />
            <Button disabled={busy || !closeId} onClick={() => void handleClose()}>
              {busy ? 'Kaydediliyor…' : 'Kapat'}
            </Button>
          </div>
        )}
      </div>

      <div className="roomio-card">
        <h2 className="roomio-card-title">Kasa devir</h2>
        <p className="roomio-page-desc">Kasalar arası nakit transferi (ör. Resepsiyon → Ana Kasa).</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
          <select className="roomio-select" value={fromReg} onChange={(e) => setFromReg(e.target.value)}>
            {CASH_REGISTERS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <span className="roomio-page-desc">→</span>
          <select className="roomio-select" value={toReg} onChange={(e) => setToReg(e.target.value)}>
            {CASH_REGISTERS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <input
            className="roomio-input"
            type="number"
            min={0}
            step={0.01}
            placeholder="Tutar"
            value={transferAmt}
            onChange={(e) => setTransferAmt(e.target.value)}
            style={{ width: 120 }}
          />
          <Button variant="secondary" disabled={busy || fromReg === toReg} onClick={() => void handleTransfer()}>
            Devir yap
          </Button>
        </div>
      </div>

      {msg ? <p className="roomio-page-desc" style={{ gridColumn: '1 / -1' }}>{msg}</p> : null}
    </div>
  );
}
