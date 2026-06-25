import { SignJWT, jwtVerify } from 'jose';
import type { GuestPortalTokenPayload } from '@/lib/guest-portal/types';

const SECRET = new TextEncoder().encode(
  process.env.ROOMIO_GUEST_PORTAL_SECRET ?? 'roomio-guest-portal-dev-secret',
);

export async function signGuestPortalToken(
  payload: GuestPortalTokenPayload,
  expiresIn = '72h',
): Promise<string> {
  return new SignJWT({
    refNo: payload.refNo,
    email: payload.email,
    propertyId: payload.propertyId,
    kind: 'guest-portal',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.reservationId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

export async function verifyGuestPortalToken(token: string): Promise<GuestPortalTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.kind !== 'guest-portal') return null;
    return {
      reservationId: String(payload.sub),
      refNo: String(payload.refNo ?? ''),
      email: String(payload.email ?? ''),
      propertyId: String(payload.propertyId ?? ''),
    };
  } catch {
    return null;
  }
}
