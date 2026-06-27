import type { SessionUser } from '@/lib/auth/roles';
import { propertyIdFromRequest } from '@/lib/server/property-context';

/**
 * Kullanıcının istekte belirtilen şubeye (property) erişimi var mı?
 *
 * Geriye dönük uyumluluk: `accessiblePropertyIds` / `hasAllPropertyAccess`
 * hiç set edilmemişse (eski bir çağrı yolu, ör. doğrudan `buildSessionUser`
 * kullanan bir yer) erişime izin verilir — bu alanlar opsiyonel olarak
 * eklendi, mevcut davranışı varsayılan olarak bozmamak için. Alanlar set
 * edildiğinde (artık `resolveApiUser` üzerinden gelen tüm oturumlarda
 * olduğu gibi) gerçek kontrol devreye girer.
 */
export function hasPropertyAccess(user: SessionUser, propertyId: string): boolean {
  if (user.hasAllPropertyAccess) return true;
  if (user.accessiblePropertyIds === undefined) return true;
  return user.accessiblePropertyIds.includes(propertyId);
}

/**
 * Request'ten okunan şube id'sini, kullanıcının erişim listesiyle karşılaştırır.
 * Erişim yoksa true döner (çağıran taraf bunu 403 olarak işlemeli).
 */
export function requestPropertyDenied(user: SessionUser, req: Request): boolean {
  const propertyId = propertyIdFromRequest(req);
  return !hasPropertyAccess(user, propertyId);
}
