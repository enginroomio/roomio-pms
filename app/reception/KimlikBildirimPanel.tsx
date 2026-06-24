'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

type IdentityRow = {
  id: string;
  guestName: string;
  roomNo: string;
  nationality: string;
  idNo: string;
  checkIn: string;
  status: 'pending' | 'sent' | 'error';
  sentAt?: string;
};

export function KimlikBildirimPanel() {
  const [rows, setRows] = useState<IdentityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [nationality, setNationality] = useState('TR');
  const [idNo, setIdNo] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await roomioFetch('/api/identity/notifications');
      if (!r.ok) throw new Error(await parseApiError(r, 'Liste yüklenemedi'));
      const j = (await r.json()) as { notifications?: IdentityRow[] };
      setRows(j.notifications ?? []);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Liste yüklenemedi');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await roomioFetch('/api/identity/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName,
          roomNo,
          nationality,
          idNo,
          checkIn: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!r.ok) throw new Error(await parseApiError(r, 'Kayıt eklenemedi'));
      setGuestName('');
      setRoomNo('');
      setIdNo('');
      setMsg('Kayıt eklendi');
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Kayıt eklenemedi');
    }
  }

  async function send(id: string) {
    setMsg(null);
    try {
      const r = await roomioFetch('/api/identity/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', id }),
      });
      if (!r.ok) throw new Error(await parseApiError(r, 'Gönderim başarısız'));
      setMsg('Polis sistemine gönderildi (demo)');
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gönderim başarısız');
    }
  }

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <PermissionGate permission="identity.notify">
        <div className="roomio-card">
          <h2 className="roomio-card-title">Yeni kimlik bildirimi</h2>
          {msg ? (
            <p className={`roomio-page-desc${msg.includes('başarısız') || msg.includes('yüklenemedi') || msg.includes('yetkiniz') || msg.includes('Oturum') ? ' roomio-text-warn' : ''}`} role="status">
              {msg}
            </p>
          ) : null}
          <form className="roomio-form" onSubmit={(e) => void add(e)}>
            <div className="roomio-form-grid">
              <label className="roomio-field"><span>Misafir</span><input className="roomio-input" value={guestName} onChange={(e) => setGuestName(e.target.value)} required /></label>
              <label className="roomio-field"><span>Oda</span><input className="roomio-input" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} required /></label>
              <label className="roomio-field"><span>Uyruk</span><input className="roomio-input" value={nationality} onChange={(e) => setNationality(e.target.value)} required /></label>
              <label className="roomio-field"><span>Kimlik / Pasaport</span><input className="roomio-input" value={idNo} onChange={(e) => setIdNo(e.target.value)} required /></label>
            </div>
            <div className="roomio-form-actions"><Button type="submit">Kaydet</Button></div>
          </form>
        </div>
      </PermissionGate>

      <div className="roomio-card roomio-table-wrap">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Günlük polis kimlik bildirim listesi</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void load()}>
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </Button>
        </div>
        <table className="roomio-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Oda</th><th>Misafir</th><th>Uyruk</th><th>Kimlik</th><th>Durum</th><th /></tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr><td colSpan={6} className="roomio-table-empty">Kayıt yok.</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.roomNo}</strong></td>
                  <td>{row.guestName}</td>
                  <td>{row.nationality}</td>
                  <td>{row.idNo}</td>
                  <td><span className="roomio-badge">{row.status === 'sent' ? 'Gönderildi' : 'Bekliyor'}</span></td>
                  <td>
                    {row.status === 'pending' ? (
                      <PermissionGate permission="identity.notify">
                        <Button variant="secondary" onClick={() => void send(row.id)}>Gönder</Button>
                      </PermissionGate>
                    ) : (
                      <span className="roomio-page-desc">{row.sentAt}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
