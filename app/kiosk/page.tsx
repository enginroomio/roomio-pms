'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Monitor, UserCheck } from 'lucide-react';
import type { GuestPortalSession } from '@/lib/guest-portal/types';
import type { KioskConfig } from '@/lib/kiosk/types';

function KioskPortal() {
  const params = useSearchParams();
  const tokenParam = params.get('token') ?? '';

  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [token, setToken] = useState(tokenParam);
  const [refNo, setRefNo] = useState('');
  const [email, setEmail] = useState('');
  const [session, setSession] = useState<GuestPortalSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch('/api/kiosk/info').then((r) => r.json()).then((j) => setConfig(j as KioskConfig)).catch(() => null);
    if (tokenParam) void lookup({ token: tokenParam });
  }, [tokenParam]);

  async function lookup(body: { token?: string; refNo?: string; email?: string }) {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/kiosk/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = (await res.json()) as GuestPortalSession;
    setLoading(false);
    if (!j.ok) {
      setError(j.message ?? 'Rezervasyon bulunamadı');
      setSession(null);
      return;
    }
    setSession(j);
    if (body.token) setToken(body.token);
  }

  async function checkIn() {
    const t = token || tokenParam;
    if (!t) return;
    const res = await fetch('/api/kiosk/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    });
    const j = (await res.json()) as { ok: boolean; message: string; printRoomKey?: boolean };
    setMsg(j.printRoomKey ? `${j.message} · Oda kartı yazdırılıyor…` : j.message);
    if (j.ok) void lookup({ token: t });
  }

  const hotelName = config?.hotelName ?? 'Check-in Kiosk';

  return (
    <div className="roomio-public-portal roomio-public-portal--kiosk">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Monitor size={32} />
          <div>
            <strong>{hotelName}</strong>
            <span>Self Check-in Kiosk</span>
          </div>
        </div>

        {!session ? (
          <form
            className="roomio-public-portal__stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (token.trim()) void lookup({ token: token.trim() });
              else void lookup({ refNo, email });
            }}
          >
            <label className="roomio-field">
              <span>QR / Token</span>
              <input className="roomio-input roomio-input--lg" value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
            <p className="roomio-page-desc" style={{ textAlign: 'center' }}>veya</p>
            <label className="roomio-field">
              <span>Referans no</span>
              <input className="roomio-input roomio-input--lg" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
            </label>
            <label className="roomio-field">
              <span>E-posta</span>
              <input className="roomio-input roomio-input--lg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error ? <p className="roomio-public-portal__error">{error}</p> : null}
            <button className="roomio-btn roomio-btn--primary roomio-btn--lg" type="submit" disabled={loading}>
              {loading ? 'Aranıyor…' : 'Rezervasyonu Bul'}
            </button>
          </form>
        ) : (
          <div className="roomio-public-portal__stack">
            <h2 className="roomio-card-title">{session.reservation?.guestName}</h2>
            <p className="roomio-page-desc">
              Ref: <strong>{session.reservation?.refNo}</strong> · {session.reservation?.roomType}
              {' '}· {session.reservation?.checkIn} → {session.reservation?.checkOut}
            </p>
            {session.reservation?.status !== 'CHECKED_IN' ? (
              <button className="roomio-btn roomio-btn--primary roomio-btn--lg" type="button" onClick={() => void checkIn()}>
                <UserCheck size={20} /> Check-in Yap
              </button>
            ) : (
              <p className="roomio-public-portal__success-inline">Check-in tamamlandı. İyi konaklamalar!</p>
            )}
            {msg ? <p className="roomio-page-desc">{msg}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default function KioskPage() {
  return (
    <Suspense fallback={<div className="roomio-public-portal"><p>Yükleniyor…</p></div>}>
      <KioskPortal />
    </Suspense>
  );
}
