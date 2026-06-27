'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { useSession } from '@/components/auth/SessionProvider';

export function PasswordChangePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const required = searchParams.get('required') === '1';
  const { mustChangePassword, refreshSession, authenticated, authRequired } = useSession();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const forceChange = required || mustChangePassword;

  const submit = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await roomioFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: forceChange ? undefined : currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Şifre değiştirilemedi'));
      setSuccess('Şifreniz güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshSession();
      if (forceChange) {
        router.replace('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre değiştirilemedi');
    } finally {
      setSubmitting(false);
    }
  }, [confirmPassword, currentPassword, forceChange, newPassword, refreshSession, router]);

  if (authRequired && !authenticated && !forceChange) {
    return (
      <div className="roomio-card">
        <p className="roomio-page-desc">Şifre değiştirmek için giriş yapın.</p>
        <Button href="/login" style={{ marginTop: 12 }}>Giriş</Button>
      </div>
    );
  }

  return (
    <div className="roomio-card roomio-password-change">
      <h2 className="roomio-card-title">Şifre Değiştir</h2>
      {forceChange ? (
        <p className="roomio-page-desc roomio-alert roomio-alert--warn" role="status" style={{ marginTop: 12 }}>
          Güvenlik için yeni bir şifre belirlemeniz gerekiyor. İşlemi tamamlayana kadar diğer ekranlara erişemezsiniz.
        </p>
      ) : (
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Şifreniz en az 8 karakter, bir harf ve bir rakam içermelidir.
        </p>
      )}

      <div className="roomio-form-grid roomio-form-grid--2" style={{ marginTop: 16, maxWidth: 480 }}>
        {!forceChange ? (
          <label className="roomio-field">
            <span>Mevcut şifre</span>
            <input
              className="roomio-input"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
        ) : null}
        <label className="roomio-field">
          <span>Yeni şifre</span>
          <input
            className="roomio-input"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <label className="roomio-field">
          <span>Yeni şifre (tekrar)</span>
          <input
            className="roomio-input"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
      </div>

      {error ? <p className="roomio-text-warn" role="alert" style={{ marginTop: 12 }}>{error}</p> : null}
      {success ? <p className="roomio-page-desc roomio-text-success" role="status" style={{ marginTop: 12 }}>{success}</p> : null}

      <div className="roomio-form-actions" style={{ marginTop: 16 }}>
        <Button variant="primary" disabled={submitting} onClick={() => void submit()}>
          {submitting ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
        </Button>
        {!forceChange ? (
          <Button variant="ghost" href="/">İptal</Button>
        ) : null}
      </div>
    </div>
  );
}
