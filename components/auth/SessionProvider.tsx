'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SessionUser, Role, Permission } from '@/lib/auth/roles';
import { getDemoSession } from '@/lib/auth/roles';

type SessionContextValue = {
  user: SessionUser;
  setRole: (role: Role) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  authenticated: boolean;
  authRequired: boolean;
  demoAuth: boolean;
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

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser>(getDemoSession('fo_manager'));
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [demoAuth, setDemoAuth] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const cfgRes = await fetch('/api/auth/config');
      const cfg = (await cfgRes.json()) as { authRequired?: boolean; demoAuth?: boolean };
      setAuthRequired(Boolean(cfg.authRequired));
      setDemoAuth(Boolean(cfg.demoAuth));

      const role = localStorage.getItem(ROLE_STORAGE) as Role | null;
      const token = localStorage.getItem(TOKEN_STORAGE);
      const useDemoRole = cfg.demoAuth && role && !token;
      const url = useDemoRole ? `/api/auth/session?role=${role}` : '/api/auth/session';

      const r = await fetch(url, { headers: authHeaders(), credentials: 'include' });
      if (r.status === 401 && cfg.authRequired) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      const j = (await r.json()) as { user?: ApiUser; authenticated?: boolean };
      if (j.user) {
        setUser(toSessionUser(j.user));
        setAuthenticated(Boolean(j.authenticated));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function setRole(r: Role) {
    if (!demoAuth) return;
    localStorage.removeItem(TOKEN_STORAGE);
    localStorage.setItem(ROLE_STORAGE, r);
    setUser(getDemoSession(r));
    setAuthenticated(false);
    void refresh();
  }

  async function login(email: string, password: string) {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const j = (await r.json()) as { ok?: boolean; token?: string; user?: ApiUser; error?: string };
    if (!r.ok || !j.user) return { ok: false, error: j.error ?? 'Giriş başarısız' };
    if (j.token) localStorage.setItem(TOKEN_STORAGE, j.token);
    localStorage.removeItem(ROLE_STORAGE);
    setUser(toSessionUser(j.user));
    setAuthenticated(true);
    return { ok: true };
  }

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(),
    }).catch(() => undefined);
    localStorage.removeItem(TOKEN_STORAGE);
    if (demoAuth) {
      localStorage.setItem(ROLE_STORAGE, 'fo_manager');
      setUser(getDemoSession('fo_manager'));
      setAuthenticated(false);
      void refresh();
      return;
    }
    setAuthenticated(false);
    window.location.href = '/login';
  }

  return (
    <SessionContext.Provider
      value={{ user, setRole, login, logout, loading, authenticated, authRequired, demoAuth }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession requires SessionProvider');
  return ctx;
}
