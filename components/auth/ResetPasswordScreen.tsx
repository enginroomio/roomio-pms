'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/components/i18n/I18nProvider';
import { PROPERTY } from '@/lib/navigation';

export function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { t } = useI18n();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        setError(j.error ?? 'Şifre sıfırlama başarısız');
        return;
      }
      setDone(true);
      setTimeout(() => router.replace('/login'), 2500);
    } catch {
      setError('Bağlantı hatası, lütfen tekrar deneyin');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="roomio-login-page">
        <div className="roomio-login-card">
          <div className="roomio-login-brand">
            <div className="roomio-login-logo" aria-hidden>
              R
            </div>
            <div>
              <h1>{t('login.resetPasswordTitle', undefined, 'Şifre Sıfırlama')}</h1>
              <p>{PROPERTY.name}</p>
            </div>
          </div>
          <p className="roomio-login-error" role="alert">
            {t('login.resetPasswordMissingToken', undefined, 'Geçersiz veya eksik bağlantı.')}
          </p>
          <p className="roomio-login-hint">
            <a href="/forgot-password">{t('login.forgotPassword', undefined, 'Şifremi unuttum')}</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="roomio-login-page">
      <div className="roomio-login-card">
        <div className="roomio-login-brand">
          <div className="roomio-login-logo" aria-hidden>
            R
          </div>
          <div>
            <h1>{t('login.resetPasswordTitle', undefined, 'Şifre Sıfırlama')}</h1>
            <p>{PROPERTY.name}</p>
          </div>
        </div>

        {done ? (
          <p className="roomio-page-desc" role="status" style={{ marginTop: 8 }}>
            {t(
              'login.resetPasswordDone',
              undefined,
              'Şifreniz değiştirildi. Giriş sayfasına yönlendiriliyorsunuz…',
            )}
          </p>
        ) : (
          <form className="roomio-login-form" onSubmit={(e) => void onSubmit(e)}>
            <label className="roomio-field">
              <span>{t('login.newPassword', undefined, 'Yeni şifre')}</span>
              <input
                className="roomio-input"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(ev) => setNewPassword(ev.target.value)}
                required
              />
            </label>
            <label className="roomio-field">
              <span>{t('login.confirmPassword', undefined, 'Yeni şifre (tekrar)')}</span>
              <input
                className="roomio-input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
                required
              />
            </label>
            {error ? <p className="roomio-login-error" role="alert">{error}</p> : null}
            <button
              type="submit"
              className="roomio-btn roomio-btn--primary roomio-login-submit"
              disabled={submitting}
            >
              {submitting ? t('login.submitting') : t('login.resetPasswordSubmit', undefined, 'Şifreyi Değiştir')}
            </button>
          </form>
        )}

        <p className="roomio-login-hint">
          <a href="/login">{t('login.backToLogin', undefined, 'Girişe geri dön')}</a>
        </p>
      </div>
    </div>
  );
}
