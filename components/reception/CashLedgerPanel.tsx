'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/cash';
import type { CashEntry } from '@/lib/data/cash';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

type Props = {
  entries: CashEntry[];
  onDone?: () => void;
};

const TYPES = ['tahsilat', 'odeme', 'avans', 'depozit', 'doviz'] as const;

export function CashLedgerPanel({ entries, onDone }: Props) {
  const [filter, setFilter] = useState('');
  const [register, setRegister] = useState('Ana Kasa');
  const [type, setType] = useState<(typeof TYPES)[number]>('odeme');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!filter) return entries;
    return entries.filter((e) => e.type === filter);
  }, [entries, filter]);

  const totals = useMemo(() => {
    const tahsilat = entries.filter((e) => e.type === 'tahsilat').reduce((s, e) => s + e.amount, 0);
    const odeme = entries.filter((e) => e.type === 'odeme').reduce((s, e) => s + e.amount, 0);
    return { tahsilat, odeme, net: tahsilat - odeme };
  }, [entries]);

  async function postEntry() {
    const value = Number(amount.replace(',', '.'));
    if (!description.trim() || !Number.isFinite(value) || value <= 0) {
      setMsg('Geçerli tutar ve açıklama girin');
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
          register,
          type,
          amount: value,
          description: description.trim(),
          user: 'Resepsiyon',
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Kayıt başarısız'));
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? 'Kayıt başarısız');
      setAmount('');
      setDescription('');
      setMsg('Kasa hareketi kaydedildi');
      onDone?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="roomio-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Tahsilat</div>
          <div className="roomio-kpi-value">{formatMoney(totals.tahsilat)}</div>
        </div>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Ödeme</div>
          <div className="roomio-kpi-value">{formatMoney(totals.odeme)}</div>
        </div>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Net</div>
          <div className="roomio-kpi-value">{formatMoney(totals.net)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <select className="roomio-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tüm işlemler</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <Button variant="secondary" href="/api/cash?view=ledger&format=pdf">PDF indir (Fidelio)</Button>
      </div>

      <div className="roomio-card" style={{ padding: 12, marginBottom: 16 }}>
        <h3 className="roomio-card-title">Manuel kasa hareketi</h3>
        <div className="roomio-form-grid roomio-form-grid--3">
          <label className="roomio-field">
            <span>Kasa</span>
            <input className="roomio-input" value={register} onChange={(e) => setRegister(e.target.value)} />
          </label>
          <label className="roomio-field">
            <span>Tip</span>
            <select className="roomio-select" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="odeme">odeme</option>
              <option value="avans">avans</option>
              <option value="tahsilat">tahsilat</option>
              <option value="doviz">doviz</option>
            </select>
          </label>
          <label className="roomio-field">
            <span>Tutar</span>
            <input className="roomio-input" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="roomio-field roomio-field--full">
            <span>Açıklama</span>
            <input className="roomio-input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>
        <Button disabled={busy} onClick={() => void postEntry()} style={{ marginTop: 8 }}>
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        {msg ? <p className="roomio-page-desc" style={{ marginTop: 8 }}>{msg}</p> : null}
      </div>

      <div className="roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr><th>Saat</th><th>Kasa</th><th>Tip</th><th>Açıklama</th><th>Tutar</th><th>Kullanıcı</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6}>Hareket yok</td></tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td>{e.time}</td>
                  <td>{e.register}</td>
                  <td><span className="roomio-badge">{e.type}</span></td>
                  <td>{e.description}</td>
                  <td>{formatMoney(e.amount)}</td>
                  <td>{e.user}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
