'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wifi } from 'lucide-react';
import { PROPERTY } from '@/lib/navigation';

function WifiLoginForm() {
  const params = useSearchParams();
  const mac = params.get('mac') ?? params.get('mac-address') ?? '';
  const clientIp = params.get('ip') ?? params.get('client-ip') ?? '';
  const roomParam = params.get('room') ?? '';

  const [roomNo, setRoomNo] = useState('');
  const [password, setPassword] = useState('');
  const [kvkk, setKvkk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (roomParam) setRoomNo(roomParam);
  }, [roomParam]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/compliance/5651/wifi/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomNo,
        password,
        macAddress: mac || undefined,
        clientIp: clientIp || undefined,
        userAgent: navigator.userAgent,
        kvkkAccepted: kvkk,
      }),
    });
    const j = (await res.json()) as { ok: boolean; message: string; guestName?: string };
    setLoading(false);

    if (j.ok) {
      setSuccess(j.guestName ? `Hoş geldiniz, ${j.guestName}. ${j.message}` : j.message);
    } else {
      setError(j.message);
    }
  }

  return (
    <div className="roomio-wifi-portal">
      <div className="roomio-wifi-portal__card">
        <div className="roomio-wifi-portal__brand">
          <Wifi size={28} />
          <div>
            <strong>{PROPERTY.name}</strong>
            <span>Misafir WiFi — 5651 uyumlu giriş</span>
          </div>
        </div>

        {success ? (
          <div className="roomio-wifi-portal__success">
            <p>{success}</p>
            <p className="roomio-page-desc">Artık internete erişebilirsiniz. Bu pencereyi kapatabilirsiniz.</p>
          </div>
        ) : (
          <form className="roomio-wifi-portal__form" onSubmit={(e) => void submit(e)}>
            <p className="roomio-page-desc">
              Oda numaranız ve resepsiyondan aldığınız WiFi şifresi ile giriş yapın.
            </p>
            <label className="roomio-field">
              <span>Oda numarası</span>
              <input
                className="roomio-input"
                inputMode="numeric"
                placeholder="ör. 412"
                required
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
              />
            </label>
            <label className="roomio-field">
              <span>WiFi şifresi</span>
              <input
                className="roomio-input"
                type="password"
                placeholder="Check-in sırasında verilen şifre"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="roomio-field roomio-field--row">
              <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} required />
              <span>
                5651 kapsamında bağlantı kayıtlarımın tutulacağını ve{' '}
                <a href="/settings/privacy" target="_blank" rel="noreferrer">KVKK aydınlatma</a>
                {' '}metnini okudum.
              </span>
            </label>
            {error ? <p className="roomio-text-warn">{error}</p> : null}
            <button type="submit" className="roomio-btn roomio-btn--primary roomio-wifi-portal__submit" disabled={loading}>
              {loading ? 'Bağlanıyor…' : 'İnternete Bağlan'}
            </button>
          </form>
        )}

        <p className="roomio-wifi-portal__foot">
          Yardım için resepsiyonu arayın · Şifre check-in sırasında verilir
        </p>
      </div>
    </div>
  );
}

export default function GuestWifiPage() {
  return (
    <Suspense fallback={<div className="roomio-wifi-portal">Yükleniyor…</div>}>
      <WifiLoginForm />
    </Suspense>
  );
}
