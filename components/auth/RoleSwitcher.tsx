'use client';

import { ROLE_LABELS, type Role } from '@/lib/auth/roles';
import { useSession } from '@/components/auth/SessionProvider';

/** Geliştirme modunda demo rol seçici — production JWT oturumunda gizli */
export function RoleSwitcher() {
  const { user, setRole, demoAuth, authenticated } = useSession();

  if (!demoAuth || authenticated) return null;

  return (
    <div className="roomio-role-switch">
      <span className="roomio-role-switch__label" title={user.id}>
        Demo
      </span>
      <select
        className="roomio-select roomio-select--sm"
        value={user.role}
        onChange={(e) => setRole(e.target.value as Role)}
        aria-label="Demo rol seçimi"
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </div>
  );
}
