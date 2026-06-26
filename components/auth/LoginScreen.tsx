'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/components/auth/SessionProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import { PROPERTY } from '@/lib/navigation';

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const { login, authenticated, loading, demoAuth } = useSession();
  const { t } = useI18n();
  const [email, setEmail] = useState('arda@hotelsapphire.com');
  const [password, setPassword] = useState('roomio123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetch('/api/auth/setup-status')
      .then((r) => r.json())
      .then((j: { needsSetup?: boolean }) => {
        if (j.needsSetup) router.replace('/setup');
      })
      .catch(() => undefined);
  }, [router]);

  useEffect(() => {
    if (!loading && authenticated) {
      router.replace(next);
    }
  }, [loading, authenticated, next, router]);

  if (!loading && authenticated) {
    return <div className="roomio-login-page">Yönlendiriliyor…</div>;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.ok) {
        setError(result.error ?? 'Giriş başarısız');
        return;
      }
      if (result.mustChangePassword) {
        router.replace('/settings?tab=password&required=1');
        return;
      }
      router.replace(next);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="roomio-login-page">
      <div className="roomio-login-card">
        <div className="roomio-login-brand">
          <div className="roomio-login-logo" aria-hidden>
            R
          </div>
          <div>
            <h1>{t('login.title')}</h1>
            <p>{PROPERTY.name}</p>
          </div>
        </div>

        <form className="roomio-login-form" onSubmit={(e) => void onSubmit(e)}>
          <label className="roomio-field">
            <span>E-posta</span>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="roomio-login-error" role="alert">{error}</p> : null}
          <button
            type="submit"
            className="roomio-btn roomio-btn--primary roomio-login-submit"
            disabled={submitting}
          >
            {submitting ? t('login.submitting') : t('login.submit')}
          </button>
        </form>

        {demoAuth ? (
          <p className="roomio-login-hint">
            Demo: <code>arda@hotelsapphire.com</code> / <code>roomio123</code>
            {' · '}
            <code>admin@roomio.local</code> · <code>hk@hotelsapphire.com</code>
          </p>
        ) : null}
      </div>
    </div>
  );
}
