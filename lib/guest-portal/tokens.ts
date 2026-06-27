import { SignJWT, jwtVerify } from 'jose';
import type { GuestPortalTokenPayload } from '@/lib/guest-portal/types';

const DEV_FALLBACK_SECRET = 'roomio-guest-portal-dev-secret';
const MIN_SECRET_LENGTH = 32;

/**
 * Production'da zayıf/varsayılan secret kullanılırsa fırlatılır.
 * Bu token misafirin kendi rezervasyon/folio bilgisine erişim sağlıyor;
 * secret bilinirse (bu dosyada düz metin yazılı olduğu için potansiyel
 * olarak herkesçe), bir saldırgan `reservationId` tahmin ederek/deneyerek
 * başka misafirlerin rezervasyon verisine erişebilir (PII sızıntısı).
 * Bkz. lib/auth/jwt-edge.ts'teki aynı desen — gerekçe orada daha detaylı.
 */
function resolveSecret(): Uint8Array {
  const configured = process.env.ROOMIO_GUEST_PORTAL_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!configured || configured === DEV_FALLBACK_SECRET || configured.length < MIN_SECRET_LENGTH) {
    if (isProduction) {
      throw new Error(
        'ROOMIO_GUEST_PORTAL_SECRET ayarlanmamış, varsayılan değerde veya çok kısa (en az 32 karakter gerekli). ' +
        'Production ortamında güçlü, rastgele bir secret zorunludur — misafir portalı devre dışı bırakıldı.',
      );
    }
    return new TextEncoder().encode(configured || DEV_FALLBACK_SECRET);
  }

  return new TextEncoder().encode(configured);
}

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
    .sign(resolveSecret());
}

export async function verifyGuestPortalToken(token: string): Promise<GuestPortalTokenPayload | null> {
  let secret: Uint8Array;
  try {
    secret = resolveSecret();
  } catch (err) {
    console.error('[guest-portal] secret yapılandırma hatası:', err instanceof Error ? err.message : err);
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
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
