import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@/lib/auth/roles';

const SECRET = new TextEncoder().encode(
  process.env.ROOMIO_JWT_SECRET ?? 'roomio-dev-jwt-secret-change-in-production',
);

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
  groupCode?: string;
  jti?: string;
};

export async function signToken(payload: JwtPayload, expiresIn = '8h'): Promise<string> {
  const jti = payload.jti ?? crypto.randomUUID();
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    groupCode: payload.groupCode ?? '',
    jti,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

/** Edge-safe doğrulama — Redis revoke kontrolü yok (middleware için). */
export async function verifyTokenEdge(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
      groupCode: payload.groupCode ? String(payload.groupCode) : undefined,
      jti: payload.jti ? String(payload.jti) : undefined,
    };
  } catch {
    return null;
  }
}
