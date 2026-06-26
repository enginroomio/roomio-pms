'use client';

import { useCallback, useEffect, useState } from 'react';
import { TableFooter } from '@/components/ReportToolbar';
import { roomioFetch } from '@/lib/client/api';
import type { RepeatGuest } from '@/lib/data/guest-relations';

export function RepeatGuestsPanel({ variant = 'default' }: { variant?: 'default' | 'fr3' }) {
  const [guests, setGuests] = useState<RepeatGuest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/repeat-guests');
      const j = (await res.json()) as { guests?: RepeatGuest[] };
      setGuests(j.guests ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="roomio-card roomio-table-wrap">
      <p className="roomio-page-desc" style={{ padding: '12px 16px 0' }}>
        {variant === 'fr3'
          ? 'FastReport Fr3 uyumlu repeater listesi — PDF/CSV dışa aktarım için hazır.'
          : 'Rezervasyon geçmişinden hesaplanan tekrarlayan misafirler (≥2 konaklama).'}
      </p>
      <table className="roomio-table">
        <thead><tr><th>Misafir</th><th>Ziyaret</th><th>Son Konaklama</th><th>Toplam Gece</th><th>Segment</th><th>E-posta</th></tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6}>Yükleniyor…</td></tr>
          ) : guests.length === 0 ? (
            <tr><td colSpan={6}>Tekrarlayan misafir bulunamadı.</td></tr>
          ) : (
            guests.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.guestName}</strong></td>
                <td>{r.visits}</td>
                <td>{r.lastStay}</td>
                <td>{r.totalNights}</td>
                <td>{r.segment}</td>
                <td>{r.email ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <TableFooter total={guests.length} />
    </div>
  );
}
