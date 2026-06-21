'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SessionUser, Role, Permission } from '@/lib/auth/roles';
import { getDemoSession } from '@/lib/auth/roles';

type SessionContextValue = {
  user: SessionUser;
  setRole: (role: Role) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  authenticated: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const ROLE_STORAGE = 'roomio-demo-role';
const TOKEN_STORAGE = 'roomio-token';

type ApiUser = {
  id: string;
  name: string;
  email?: string;
  role: Role;
  roleLabel: string;
  permissions: Permission[];
};

function toSessionUser(u: ApiUser): SessionUser {
  return { id: u.id, name: u.name, role: u.role, roleLabel: u.roleLabel, permissions: u.permissions };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser>(getDemoSession('fo_manager'));
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE);
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const role = localStorage.getItem(ROLE_STORAGE) as Role | null;
    const url = role && !token ? `/api/auth/session?role=${role}` : '/api/auth/session';
    const r = await fetch(url, { headers });
    const j = (await r.json()) as { user?: ApiUser; authenticated?: boolean };
    if (j.user) {
      setUser(toSessionUser(j.user));
      setAuthenticated(Boolean(j.authenticated));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function setRole(r: Role) {
    localStorage.removeItem(TOKEN_STORAGE);
    localStorage.setItem(ROLE_STORAGE, r);
    setUser(getDemoSession(r));
    setAuthenticated(false);
    void refresh();
  }

  async function login(email: string, password: string) {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const j = (await r.json()) as { ok?: boolean; token?: string; user?: ApiUser; error?: string };
    if (!r.ok || !j.token || !j.user) return { ok: false, error: j.error ?? 'Giriş başarısız' };
    localStorage.setItem(TOKEN_STORAGE, j.token);
    localStorage.removeItem(ROLE_STORAGE);
    setUser(toSessionUser(j.user));
    setAuthenticated(true);
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE);
    setRole('fo_manager');
  }

  return (
    <SessionContext.Provider value={{ user, setRole, login, logout, loading, authenticated }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession requires SessionProvider');
  return ctx;
}
