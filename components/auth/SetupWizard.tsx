'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROPERTY } from '@/lib/navigation';
import { passwordsMatch } from '@/lib/auth/password';

export function SetupWizard() {
  const router = useRouter();
  const [propertyName, setPropertyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void fetch('/api/auth/setup-status')
      .then((r) => r.json())
      .then((j: { needsSetup?: boolean }) => {
        if (!j.needsSetup) router.replace('/login');
      })
      .finally(() => setChecking(false));
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordsMatch(password, confirmPassword)) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyName, name, email, password, confirmPassword }),
      });
      const j = (await res.json()) as { ok?: boolean; token?: string; error?: string };
      if (!res.ok || !j.ok) {
        setError(j.error ?? 'Kurulum başarısız');
        return;
      }
      if (j.token) localStorage.setItem('roomio-token', j.token);
      window.location.href = '/';
    } catch {
      setError('Kurulum başarısız');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return <div className="roomio-login-page">Kurulum kontrol ediliyor…</div>;
  }

  return (
    <div className="roomio-login-page">
      <div className="roomio-login-card roomio-setup-card">
        <div className="roomio-login-brand">
          <div className="roomio-login-logo" aria-hidden>R</div>
          <div>
            <h1>İlk Kurulum</h1>
            <p>{PROPERTY.name} — sistem yöneticisi hesabı</p>
          </div>
        </div>

        <p className="roomio-page-desc" style={{ marginBottom: 16 }}>
          Veritabanında henüz kullanıcı yok. Otel adını ve ilk admin bilgilerini girin.
        </p>

        <form className="roomio-login-form" onSubmit={(e) => void onSubmit(e)}>
          <label className="roomio-field">
            <span>Otel / tesis adı</span>
            <input
              className="roomio-input"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="Örn. Hotel Sapphire"
            />
          </label>
          <label className="roomio-field">
            <span>Yönetici adı soyadı</span>
            <input
              className="roomio-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="roomio-field">
            <span>E-posta (giriş)</span>
            <input
              className="roomio-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="roomio-field">
            <span>Şifre</span>
            <input
              className="roomio-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label className="roomio-field">
            <span>Şifre (tekrar)</span>
            <input
              className="roomio-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          <p className="roomio-login-hint">En az 8 karakter, bir harf ve bir rakam.</p>
          {error ? <p className="roomio-login-error" role="alert">{error}</p> : null}
          <button type="submit" className="roomio-btn roomio-btn--primary roomio-login-submit" disabled={submitting}>
            {submitting ? 'Kuruluyor…' : 'Kurulumu tamamla'}
          </button>
        </form>
      </div>
    </div>
  );
}
