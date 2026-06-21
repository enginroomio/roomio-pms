import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@/lib/auth/roles';
import { isTokenRevoked } from '@/lib/auth/session-store';

const SECRET = new TextEncoder().encode(
  process.env.ROOMIO_JWT_SECRET ?? 'roomio-dev-jwt-secret-change-in-production',
);

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
  jti?: string;
};

export async function signToken(payload: JwtPayload, expiresIn = '8h'): Promise<string> {
  const jti = payload.jti ?? crypto.randomUUID();
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const jti = payload.jti ? String(payload.jti) : undefined;
    if (jti && (await isTokenRevoked(jti))) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
      jti,
    };
  } catch {
    return null;
  }
}

export function tokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}
