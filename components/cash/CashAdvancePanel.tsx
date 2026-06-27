'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { CASH_REGISTERS, formatMoney } from '@/lib/data/cash';
import { useCash } from '@/lib/client/use-cash';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

export function CashAdvancePanel() {
  const { entries, reload } = useCash();
  const advances = entries.filter((e) => e.type === 'avans');
  const transfers = entries.filter((e) => e.description.toLowerCase().includes('devir'));

  const [fromRegister, setFromRegister] = useState<string>(CASH_REGISTERS[0]);
  const [toRegister, setToRegister] = useState<string>(CASH_REGISTERS[1]);
  const [transferAmount, setTransferAmount] = useState('');
  const [avansDesc, setAvansDesc] = useState('');
  const [avansAmount, setAvansAmount] = useState('');
  const [avansRegister, setAvansRegister] = useState<string>(CASH_REGISTERS[0]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function postTransfer() {
    const amount = Number(transferAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0 || fromRegister === toRegister) {
      setMsg('Geçerli tutar ve farklı kasalar seçin');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'transfer', fromRegister, toRegister, amount }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Devir başarısız'));
      setTransferAmount('');
      setMsg(`${fromRegister} → ${toRegister}: ${formatMoney(amount)}`);
      await reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Devir başarısız');
    } finally {
      setBusy(false);
    }
  }

  async function postAvans() {
    const amount = Number(avansAmount.replace(',', '.'));
    if (!avansDesc.trim() || !Number.isFinite(amount) || amount <= 0) {
      setMsg('Açıklama ve tutar gerekli');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_entry',
          register: avansRegister,
          type: 'avans',
          amount,
          description: avansDesc.trim(),
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Avans kaydı başarısız'));
      setAvansDesc('');
      setAvansAmount('');
      setMsg('Avans kasa defterine işlendi.');
      await reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Avans kaydı başarısız');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Kasa devir</h2>
        <div className="roomio-form-grid" style={{ marginTop: 12 }}>
          <label className="roomio-field">
            <span>Kaynak kasa</span>
            <select className="roomio-input" value={fromRegister} onChange={(e) => setFromRegister(e.target.value)}>
              {CASH_REGISTERS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="roomio-field">
            <span>Hedef kasa</span>
            <select className="roomio-input" value={toRegister} onChange={(e) => setToRegister(e.target.value)}>
              {CASH_REGISTERS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="roomio-field">
            <span>Tutar (TRY)</span>
            <input className="roomio-input" type="number" min={0} value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
          </label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button disabled={busy} onClick={() => void postTransfer()}>Devir yap</Button>
        </div>
      </div>

      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Yeni avans</h2>
        <div className="roomio-form-grid" style={{ marginTop: 12 }}>
          <label className="roomio-field">
            <span>Kasa</span>
            <select className="roomio-input" value={avansRegister} onChange={(e) => setAvansRegister(e.target.value)}>
              {CASH_REGISTERS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="roomio-field">
            <span>Açıklama</span>
            <input className="roomio-input" value={avansDesc} onChange={(e) => setAvansDesc(e.target.value)} placeholder="Vardiya devir / avans" />
          </label>
          <label className="roomio-field">
            <span>Tutar</span>
            <input className="roomio-input" type="number" min={0} value={avansAmount} onChange={(e) => setAvansAmount(e.target.value)} />
          </label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button disabled={busy} onClick={() => void postAvans()}>Avans kaydet</Button>
        </div>
        {msg ? <p className="roomio-page-desc" role="status" style={{ marginTop: 8 }}>{msg}</p> : null}
      </div>

      <div className="roomio-card roomio-table-wrap" style={{ gridColumn: '1 / -1' }}>
        <h2 className="roomio-card-title" style={{ padding: '16px 16px 0' }}>Avans ve devir listesi</h2>
        <table className="roomio-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Saat</th><th>Kasa</th><th>Açıklama</th><th>Tutar</th><th>Kullanıcı</th></tr>
          </thead>
          <tbody>
            {[...advances, ...transfers].length === 0 ? (
              <tr><td colSpan={5} className="roomio-table-empty">Kayıt yok.</td></tr>
            ) : [...advances, ...transfers].map((e) => (
              <tr key={e.id}>
                <td>{e.time}</td>
                <td>{e.register}</td>
                <td>{e.description}</td>
                <td>{formatMoney(e.amount)}</td>
                <td>{e.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
