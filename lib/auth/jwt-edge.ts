import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@/lib/auth/roles';

const DEV_FALLBACK_SECRET = 'roomio-dev-jwt-secret-change-in-production';
const MIN_SECRET_LENGTH = 32;

/**
 * Production'da zayıf/varsayılan JWT secret kullanılırsa fırlatılır.
 *
 * Önceden bu modül, `ROOMIO_JWT_SECRET` ayarlanmadığında sabit bir
 * dev-fallback secret'a sessizce düşüyordu. O secret bu dosyada düz metin
 * olarak yazılı olduğundan, projeyi gören herkes (bu kod tabanını inceleyen,
 * zip'i paylaşan, vb.) o secret'ı bilir — bu durumda kim olursa olsun
 * geçerli bir admin JWT üretip auth sistemini tamamen atlayabilir.
 *
 * Bu fonksiyon `signToken`/`verifyTokenEdge` her çağrıldığında (modül
 * yüklenirken değil, token işlenirken) kontrol edilir; böylece:
 *  - Production'da (`NODE_ENV=production`) secret eksik/zayıf/varsayılansa
 *    auth işlemleri hata fırlatır — sessizce güvensiz çalışmaz.
 *  - Geliştirmede (`NODE_ENV !== 'production'`) dev-fallback'e izin verilir,
 *    yerel kurulum env dosyası yazmadan da çalışsın diye.
 *  - Sağlık kontrolü gibi auth'tan bağımsız endpoint'ler etkilenmez (kontrol
 *    modül yüklenirken değil, bu fonksiyonlar çağrıldığında çalışır).
 */
function resolveSecret(): Uint8Array {
  const configured = process.env.ROOMIO_JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!configured || configured === DEV_FALLBACK_SECRET || configured.length < MIN_SECRET_LENGTH) {
    if (isProduction) {
      throw new Error(
        'ROOMIO_JWT_SECRET ayarlanmamış, varsayılan değerde veya çok kısa (en az 32 karakter gerekli). ' +
        'Production ortamında güçlü, rastgele bir secret zorunludur — auth devre dışı bırakıldı.',
      );
    }
    return new TextEncoder().encode(configured || DEV_FALLBACK_SECRET);
  }

  return new TextEncoder().encode(configured);
}

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
    .sign(resolveSecret());
}

/** Edge-safe doğrulama — Redis revoke kontrolü yok (middleware için). */
export async function verifyTokenEdge(token: string): Promise<JwtPayload | null> {
  let secret: Uint8Array;
  try {
    secret = resolveSecret();
  } catch (err) {
    // Yapılandırma hatası (zayıf/eksik secret) — bunu sessizce "geçersiz
    // token" gibi yutmak yerine açıkça loglarız ki yanlış yapılandırma
    // "kullanıcılar giriş yapamıyor" gibi belirsiz bir semptom olarak değil,
    // doğrudan teşhis edilebilir olsun.
    console.error('[auth] JWT yapılandırma hatası:', err instanceof Error ? err.message : err);
    return null;
  }

  try {
    // `algorithms` açıkça belirtilir: jose, Uint8Array secret verildiğinde
    // zaten sadece HMAC ailesini kabul eder (key tipi kontrolü ile asimetrik/
    // "none" algoritmalı token'lar otomatik reddedilir), ama bunu açıkça
    // yazmak niyeti kod okuyucusu için de netleştirir ve gelecekte secret
    // tipi değişse bile (örn. CryptoKey'e geçiş) garantiyi korur.
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
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
