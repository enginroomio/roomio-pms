'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { PROPERTY } from '@/lib/navigation';

export function ForgotPasswordScreen() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        setError(j.error ?? 'Bir hata oluştu, lütfen tekrar deneyin');
        return;
      }
      // Sunucu her zaman aynı genel mesajı döner (e-posta enumeration
      // koruması) — burada o mesajı doğrudan gösteriyoruz.
      setMessage(j.message ?? 'Bu e-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.');
    } catch {
      setError('Bağlantı hatası, lütfen tekrar deneyin');
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
            <h1>{t('login.forgotPasswordTitle', undefined, 'Şifremi Unuttum')}</h1>
            <p>{PROPERTY.name}</p>
          </div>
        </div>

        {message ? (
          <p className="roomio-page-desc" role="status" style={{ marginTop: 8 }}>
            {message}
          </p>
        ) : (
          <>
            <p className="roomio-page-desc" style={{ marginTop: 8 }}>
              {t(
                'login.forgotPasswordHint',
                undefined,
                'E-posta adresinizi girin, şifre sıfırlama bağlantısını gönderelim.',
              )}
            </p>
            <form className="roomio-login-form" onSubmit={(e) => void onSubmit(e)}>
              <label className="roomio-field">
                <span>E-posta</span>
                <input
                  className="roomio-input"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                />
              </label>
              {error ? <p className="roomio-login-error" role="alert">{error}</p> : null}
              <button
                type="submit"
                className="roomio-btn roomio-btn--primary roomio-login-submit"
                disabled={submitting}
              >
                {submitting ? t('login.submitting') : t('login.forgotPasswordSubmit', undefined, 'Bağlantı Gönder')}
              </button>
            </form>
          </>
        )}

        <p className="roomio-login-hint">
          <a href="/login">{t('login.backToLogin', undefined, 'Girişe geri dön')}</a>
        </p>
      </div>
    </div>
  );
}
