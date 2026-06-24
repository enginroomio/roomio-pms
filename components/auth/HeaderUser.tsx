'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useSession } from '@/components/auth/SessionProvider';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || '?';
}

export function HeaderUser() {
  const { user, loading, authenticated, logout } = useSession();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="roomio-header-user" aria-busy="true">
        <div className="roomio-avatar">…</div>
        <div>
          <div>Yükleniyor…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="roomio-header-user-wrap">
      <button
        type="button"
        className="roomio-header-user"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="roomio-avatar">{initials(user.name)}</div>
        <div>
          <div>{user.name}</div>
          <div className="roomio-header-user-role">{user.roleLabel}</div>
        </div>
      </button>
      {open ? (
        <div className="roomio-header-user-menu" role="menu">
          {authenticated ? (
            <button
              type="button"
              className="roomio-header-user-menu__item"
              role="menuitem"
              onClick={() => void logout()}
            >
              <LogOut size={14} aria-hidden />
              Çıkış Yap
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
