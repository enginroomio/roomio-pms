import type { APIRequestContext } from '@playwright/test';

export const DEMO_EMAIL = process.env.ROOMIO_CHECKLIST_EMAIL ?? 'arda@hotelsapphire.com';
export const DEMO_PASSWORD = process.env.ROOMIO_CHECKLIST_PASSWORD ?? 'roomio123';
export const ADMIN_EMAIL = process.env.ROOMIO_ADMIN_EMAIL ?? 'admin@roomio.local';
export const VIEWER_EMAIL = process.env.ROOMIO_VIEWER_EMAIL ?? 'viewer@hotelsapphire.com';
export const HK_EMAIL = process.env.ROOMIO_HK_EMAIL ?? 'hk@hotelsapphire.com';
export const ACCOUNTING_EMAIL = process.env.ROOMIO_ACCOUNTING_EMAIL ?? 'muhasebe@hotelsapphire.com';
export const RECEPTION_EMAIL = process.env.ROOMIO_RECEPTION_EMAIL ?? 'reception@hotelsapphire.com';

const TOKEN_TTL_MS = 10 * 60 * 1000;
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function loginApiToken(request: APIRequestContext): Promise<string> {
  return loginApiTokenWith(request, DEMO_EMAIL, DEMO_PASSWORD);
}

export async function loginApiTokenWith(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const cacheKey = `${email}:${password}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const res = await request.post('/api/auth/login', {
    data: { email, password },
  });
  if (!res.ok()) throw new Error(`login failed (${email}): ${res.status()}`);
  const j = (await res.json()) as { token?: string };
  if (!j.token) throw new Error('login response missing token');
  tokenCache.set(cacheKey, { token: j.token, expiresAt: Date.now() + TOKEN_TTL_MS });
  return j.token;
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function authedGet(request: APIRequestContext, path: string) {
  const token = await loginApiToken(request);
  return request.get(path, { headers: authHeaders(token) });
}

export async function authedPost(request: APIRequestContext, path: string, data: unknown) {
  const token = await loginApiToken(request);
  return request.post(path, { headers: authHeaders(token), data });
}

export async function authedPatch(request: APIRequestContext, path: string, data: unknown) {
  const token = await loginApiToken(request);
  return request.patch(path, { headers: authHeaders(token), data });
}

export async function authedPostAs(
  request: APIRequestContext,
  path: string,
  data: unknown,
  email: string,
  password: string,
) {
  const token = await loginApiTokenWith(request, email, password);
  return request.post(path, { headers: authHeaders(token), data });
}
