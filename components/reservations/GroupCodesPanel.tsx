'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

type GroupRow = {
  id: string;
  refNo: string;
  name: string;
  checkIn: string;
  checkOut: string;
  roomCount: number;
  status: string;
  memberCount?: number;
};

export function GroupCodesPanel() {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomioFetch('/api/reservations/groups');
      if (!res.ok) throw new Error(await parseApiError(res, 'Grup kodları yüklenemedi'));
      const j = (await res.json()) as { groups?: GroupRow[] };
      setGroups(j.groups ?? []);
    } catch (err) {
      setGroups([]);
      setError(err instanceof Error ? err.message : 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = groups.filter((g) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [g.refNo, g.name, g.status].join(' ').toLowerCase().includes(q);
  });

  return (
    <div className="roomio-card roomio-table-wrap">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Grup Kod Listesi</h2>
        <Button variant="secondary" disabled={loading} onClick={() => void load()}>
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </Button>
        <Button href="/groups">Grup yönetimi</Button>
        <Button variant="ghost" href="/reservations?tab=group">Grup rezervasyonları</Button>
      </div>
      <label className="roomio-field" style={{ marginTop: 12, maxWidth: 320 }}>
        <span>Ara (kod, ad)</span>
        <input className="roomio-input" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {error ? <p className="roomio-text-warn" role="alert">{error}</p> : null}
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Grup kodu</th>
            <th>Grup adı</th>
            <th>Giriş</th>
            <th>Çıkış</th>
            <th>Oda</th>
            <th>Üye</th>
            <th>Durum</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8}>Yükleniyor…</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}>Grup kaydı yok</td></tr>
          ) : filtered.map((g) => (
            <tr key={g.id}>
              <td><strong>{g.refNo}</strong></td>
              <td>{g.name}</td>
              <td>{g.checkIn}</td>
              <td>{g.checkOut}</td>
              <td>{g.roomCount}</td>
              <td>{g.memberCount ?? '—'}</td>
              <td>{g.status}</td>
              <td>
                <Link href={`/reservations?tab=group`} className="roomio-link">Aç</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
