'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { QrCode, Receipt, UserCheck } from 'lucide-react';
import { GuestServiceLinks } from '@/components/GuestServiceLinks';
import { PROPERTY } from '@/lib/navigation';
import type { GuestPortalSession, GuestServiceLinksConfig } from '@/lib/guest-portal/types';

function GuestPortal() {
  const params = useSearchParams();
  const tokenParam = params.get('token') ?? '';

  const [token, setToken] = useState(tokenParam);
  const [refNo, setRefNo] = useState('');
  const [email, setEmail] = useState('');
  const [session, setSession] = useState<GuestPortalSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState<string | null>(null);
  const [serviceLinks, setServiceLinks] = useState<GuestServiceLinksConfig | undefined>(undefined);

  useEffect(() => {
    if (tokenParam) void loadSession({ token: tokenParam });
  }, [tokenParam]);

  useEffect(() => {
    void fetch('/api/guest-portal/services')
      .then((r) => r.json())
      .then((j: { ok: boolean; serviceLinks?: GuestServiceLinksConfig }) => {
        if (j.serviceLinks) setServiceLinks(j.serviceLinks);
      })
      .catch(() => undefined);
  }, []);

  async function loadSession(body: { token?: string; refNo?: string; email?: string }) {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/guest-portal/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = (await res.json()) as GuestPortalSession;
    setLoading(false);
    if (!j.ok) {
      setError(j.message ?? 'Oturum açılamadı');
      setSession(null);
      return;
    }
    setSession(j);
  }

  async function checkIn() {
    if (!token && !tokenParam) return;
    const res = await fetch('/api/guest-portal/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token || tokenParam }),
    });
    const j = (await res.json()) as { ok: boolean; message: string };
    setCheckInMsg(j.message);
    if (j.ok) void loadSession({ token: token || tokenParam });
  }

  async function requestEinvoice() {
    setCheckInMsg('e-Fatura talebiniz alındı. Check-out sonrası e-posta ile gönderilecektir.');
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <QrCode size={28} />
          <div>
            <strong>{PROPERTY.name}</strong>
            <span>Misafir Self-Servis Portalı</span>
          </div>
        </div>

        {!session ? (
          <form
            className="roomio-public-portal__stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (token.trim()) void loadSession({ token: token.trim() });
              else void loadSession({ refNo, email });
            }}
          >
            <p className="roomio-page-desc">
              QR kod veya konfirmasyon bağlantısı ile giriş yapın; alternatif olarak referans no + e-posta kullanın.
            </p>
            <label className="roomio-field">
              <span>Portal token (QR)</span>
              <input className="roomio-input" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Rezervasyon sonrası verilen token" />
            </label>
            <p className="roomio-page-desc" style={{ textAlign: 'center' }}>veya</p>
            <label className="roomio-field">
              <span>Referans no</span>
              <input className="roomio-input" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
            </label>
            <label className="roomio-field">
              <span>E-posta</span>
              <input className="roomio-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error ? <p className="roomio-public-portal__error">{error}</p> : null}
            <button className="roomio-btn roomio-btn--primary" type="submit" disabled={loading}>
              {loading ? 'Yükleniyor…' : 'Giriş Yap'}
            </button>
          </form>
        ) : (
          <div className="roomio-public-portal__stack">
            <h2 className="roomio-card-title">Hoş geldiniz, {session.reservation?.guestName}</h2>
            <p className="roomio-page-desc">
              Ref: <strong>{session.reservation?.refNo}</strong> · {session.reservation?.checkIn} → {session.reservation?.checkOut}
              {' '}· {session.reservation?.roomType} · Durum: {session.reservation?.status}
            </p>

            {session.features?.allowOnlineCheckIn && session.reservation?.status !== 'CHECKED_IN' ? (
              <button className="roomio-btn roomio-btn--primary" type="button" onClick={() => void checkIn()}>
                <UserCheck size={16} /> Online Check-in
              </button>
            ) : null}

            {session.folio && session.features?.allowFolioView ? (
              <div className="roomio-card" style={{ marginTop: 12 }}>
                <h3 className="roomio-card-title"><Receipt size={16} /> Folyo</h3>
                <p>Bakiye: <strong>{session.folio.balance} {session.reservation?.currency}</strong></p>
                <div className="roomio-table-wrap">
                  <table className="roomio-table">
                    <thead><tr><th>Tarih</th><th>Açıklama</th><th>Tutar</th></tr></thead>
                    <tbody>
                      {session.folio.lines.length ? session.folio.lines.map((l, i) => (
                        <tr key={i}><td>{l.date}</td><td>{l.description}</td><td>{l.amount}</td></tr>
                      )) : (
                        <tr><td colSpan={3}>Henüz hareket yok</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {session.features?.allowEinvoiceRequest ? (
              <button className="roomio-btn roomio-btn--secondary" type="button" onClick={() => void requestEinvoice()}>
                e-Fatura Talep Et
              </button>
            ) : null}

            {checkInMsg ? <p className="roomio-public-portal__success-inline">{checkInMsg}</p> : null}
          </div>
        )}

        <GuestServiceLinks enabled={serviceLinks} token={token || tokenParam} />
      </div>
    </div>
  );
}

export default function GuestPage() {
  return (
    <Suspense fallback={<div className="roomio-public-portal"><p>Yükleniyor…</p></div>}>
      <GuestPortal />
    </Suspense>
  );
}
