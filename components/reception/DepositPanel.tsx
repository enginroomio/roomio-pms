'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { formatMoney, type DepositRow } from '@/lib/data/cash';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

export function DepositPanel() {
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<DepositRow['method']>('kart');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/deposits');
      if (!res.ok) throw new Error(await parseApiError(res, 'Depozit listesi yüklenemedi'));
      const j = (await res.json()) as { deposits?: DepositRow[] };
      setDeposits(j.deposits ?? []);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Yükleme hatası');
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function createDeposit() {
    const value = Number(amount.replace(',', '.'));
    if (!guestName.trim() || !Number.isFinite(value) || value <= 0) {
      setMsg('Misafir adı ve tutar gerekli');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: guestName.trim(), roomNo: roomNo.trim() || undefined, amount: value, method }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) throw new Error(await parseApiError(res, j.error ?? 'Kayıt başarısız'));
      setGuestName('');
      setRoomNo('');
      setAmount('');
      setMsg('Depozit kaydedildi ve kasa defterine işlendi');
      await reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: DepositRow['status']) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/deposits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Güncelleme başarısız'));
      await reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Güncelleme başarısız');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="roomio-card" style={{ marginTop: 16, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Yeni depozit</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
          <input className="roomio-input" placeholder="Misafir adı" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          <input className="roomio-input" placeholder="Oda no" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} style={{ width: 90 }} />
          <input className="roomio-input" type="number" min={0} placeholder="Tutar" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 100 }} />
          <select className="roomio-select" value={method} onChange={(e) => setMethod(e.target.value as DepositRow['method'])}>
            <option value="nakit">Nakit</option>
            <option value="kart">Kart</option>
            <option value="havale">Havale</option>
          </select>
          <Button disabled={busy} onClick={() => void createDeposit()}>Depozit al</Button>
        </div>
        {msg ? <p className="roomio-page-desc" style={{ marginTop: 8 }}>{msg}</p> : null}
      </div>

      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr><th>Misafir</th><th>Oda</th><th>Tutar</th><th>Yöntem</th><th>Tarih</th><th>Durum</th><th /></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="roomio-page-desc">Yükleniyor…</td></tr>
            ) : deposits.map((d) => (
              <tr key={d.id}>
                <td>{d.guest}</td>
                <td><strong>{d.roomNo}</strong></td>
                <td>{formatMoney(d.amount)}</td>
                <td>{d.method}</td>
                <td>{d.takenAt}</td>
                <td>
                  <span className="roomio-badge">
                    {d.status === 'held' ? 'Tutuluyor' : d.status === 'applied' ? 'Mahsup' : 'İade'}
                  </span>
                </td>
                <td>
                  {d.status === 'held' ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="ghost" disabled={busy} onClick={() => void setStatus(d.id, 'applied')}>Mahsup</Button>
                      <Button variant="ghost" disabled={busy} onClick={() => void setStatus(d.id, 'refunded')}>İade</Button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
