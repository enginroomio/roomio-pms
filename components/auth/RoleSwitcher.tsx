'use client';

import { useState } from 'react';
import { ROLE_LABELS, type Role } from '@/lib/auth/roles';
import { useSession } from '@/components/auth/SessionProvider';

export function RoleSwitcher() {
  const { user, setRole, login, logout, authenticated } = useSession();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('arda@hotelsapphire.com');
  const [password, setPassword] = useState('roomio123');
  const [err, setErr] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const r = await login(email, password);
    if (r.ok) setShowLogin(false);
    else setErr(r.error ?? 'Hata');
  }

  return (
    <div className="roomio-role-switch">
      <span className="roomio-role-switch__label" title={user.id}>{user.name}</span>
      {authenticated ? (
        <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--xs" onClick={logout}>Çıkış</button>
      ) : (
        <>
          <select
            className="roomio-select roomio-select--sm"
            value={user.role}
            onChange={(e) => setRole(e.target.value as Role)}
            aria-label="Demo rol seçimi"
          >
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--xs" onClick={() => setShowLogin((v) => !v)}>JWT</button>
        </>
      )}
      {showLogin && !authenticated ? (
        <form className="roomio-login-popover" onSubmit={(e) => void onLogin(e)}>
          <input className="roomio-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta" />
          <input className="roomio-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" />
          <button type="submit" className="roomio-btn roomio-btn--primary roomio-btn--xs">Giriş</button>
          {err ? <span className="roomio-text-warn">{err}</span> : null}
        </form>
      ) : null}
    </div>
  );
}
