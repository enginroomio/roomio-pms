'use client';

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
  const { user, loading } = useSession();

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
    <div className="roomio-header-user">
      <div className="roomio-avatar">{initials(user.name)}</div>
      <div>
        <div>{user.name}</div>
        <div className="roomio-header-user-role">{user.roleLabel}</div>
      </div>
    </div>
  );
}
