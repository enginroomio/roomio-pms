'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import type { GuestProfile360 } from '@/lib/server/guest-profile';

type SearchHit = {
  guestName: string;
  email?: string;
  visits: number;
  lastStay?: string;
};

export function GuestProfilePanel({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [profile, setProfile] = useState<GuestProfile360 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const res = await roomioFetch(`/api/guests/profile?mode=search&q=${encodeURIComponent(q)}`);
    const j = (await res.json()) as { results?: SearchHit[] };
    setHits(j.results ?? []);
  }, []);

  const loadProfile = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const res = await roomioFetch(`/api/guests/profile?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const j = (await res.json()) as { message?: string };
        setError(j.message ?? 'Misafir bulunamadı');
        return;
      }
      const j = (await res.json()) as { profile?: GuestProfile360 };
      setProfile(j.profile ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery.length >= 2) void loadProfile(initialQuery);
  }, [initialQuery, loadProfile]);

  useEffect(() => {
    const t = setTimeout(() => void search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <div className="roomio-stack">
      <div className="roomio-card" style={{ padding: 16 }}>
        <h2 className="roomio-card-title">Misafir Arama</h2>
        <p className="roomio-page-desc">
          Fidelio / Opera CRM tarzı 360° profil — konaklama geçmişi, harcama, VIP ve şikayet özeti.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <input
            className="roomio-input"
            style={{ flex: 1, minWidth: 240 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ad, e-posta, telefon veya rez. no…"
          />
          <Button onClick={() => void loadProfile(query)} disabled={loading || query.trim().length < 2}>
            Profili aç
          </Button>
        </div>
        {hits.length > 0 && !profile ? (
          <ul className="roomio-list" style={{ marginTop: 12 }}>
            {hits.map((h) => (
              <li key={`${h.guestName}-${h.email ?? ''}`}>
                <button
                  type="button"
                  className="roomio-link-button"
                  onClick={() => {
                    setQuery(h.email ?? h.guestName);
                    void loadProfile(h.email ?? h.guestName);
                  }}
                >
                  <strong>{h.guestName}</strong>
                  {h.email ? ` · ${h.email}` : ''}
                  {h.visits > 0 ? ` · ${h.visits} konaklama` : ''}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {loading ? <p className="roomio-page-desc">Profil yükleniyor…</p> : null}
      {error ? <p className="roomio-page-desc roomio-text-danger">{error}</p> : null}

      {profile ? (
        <>
          <div className="roomio-kpi-strip">
            <div className="roomio-kpi">
              <span className="roomio-kpi__label">Segment</span>
              <strong>{profile.segment}</strong>
            </div>
            <div className="roomio-kpi">
              <span className="roomio-kpi__label">Konaklama</span>
              <strong>{profile.visits}</strong>
            </div>
            <div className="roomio-kpi">
              <span className="roomio-kpi__label">Toplam gece</span>
              <strong>{profile.totalNights}</strong>
            </div>
            <div className="roomio-kpi">
              <span className="roomio-kpi__label">Folyo harcama</span>
              <strong>{profile.totalSpend.toLocaleString('tr-TR')} {profile.currency}</strong>
            </div>
            <div className="roomio-kpi">
              <span className="roomio-kpi__label">VIP</span>
              <strong>{profile.isVip ? profile.vipLevel ?? 'Evet' : 'Hayır'}</strong>
            </div>
            {profile.loyalty ? (
              <div className="roomio-kpi">
                <span className="roomio-kpi__label">Sadakat</span>
                <strong>{profile.loyalty.tierName} · {profile.loyalty.points} puan</strong>
              </div>
            ) : null}
          </div>

          <div className="roomio-card" style={{ padding: 16 }}>
            <h2 className="roomio-card-title">{profile.guestName}</h2>
            <p className="roomio-page-desc">
              {profile.email ?? '—'} · {profile.phone ?? '—'}
              {profile.lastStay ? ` · Son konaklama: ${profile.lastStay}` : ''}
            </p>
            <div className="roomio-form-actions" style={{ marginTop: 8 }}>
              <span className="roomio-pill">Trace: {profile.traces}</span>
              <span className="roomio-pill">Şikayet: {profile.complaints}</span>
              <span className="roomio-pill">Yorum: {profile.reviews}</span>
              {profile.isVip ? <Link href="/guest-relations/vip" className="roomio-link">VIP listesi</Link> : null}
              {profile.loyalty ? (
                <Link href="/loyalty" className="roomio-link">
                  Sadakat: %{profile.loyalty.discountPercent} indirim
                </Link>
              ) : null}
            </div>
            {profile.preferences.length > 0 ? (
              <p className="roomio-page-desc" style={{ marginTop: 8 }}>
                Tercihler: {profile.preferences.join(' · ')}
              </p>
            ) : null}
          </div>

          <div className="roomio-card roomio-table-wrap">
            <table className="roomio-table">
              <thead>
                <tr>
                  <th>Rez. No</th>
                  <th>Giriş</th>
                  <th>Çıkış</th>
                  <th>Oda</th>
                  <th>Durum</th>
                  <th>Acenta</th>
                  <th>Gece</th>
                </tr>
              </thead>
              <tbody>
                {profile.stays.map((s) => (
                  <tr key={s.reservationId}>
                    <td>
                      <Link href={`/reservations/${s.reservationId}`} className="roomio-link">
                        {s.refNo}
                      </Link>
                    </td>
                    <td>{s.checkIn}</td>
                    <td>{s.checkOut}</td>
                    <td>{s.roomNo ?? s.roomType}</td>
                    <td>{s.status}</td>
                    <td>{s.agency}</td>
                    <td>{s.nights}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
