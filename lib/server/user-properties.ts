import type { Role } from '@/lib/auth/roles';
import {
  DEFAULT_PROPERTY_ID,
  DEMO_USER_PROPERTY_IDS,
  type PropertyInfo,
} from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { getProperties, init } from '@/lib/server/pms-store';

/** Yalnızca admin tüm şubelere erişir */
export function userHasAllPropertyAccess(role: string): boolean {
  return role === 'admin';
}

export async function getUserPropertyIds(userId: string): Promise<string[]> {
  await init();
  const rows = await prisma.userProperty.findMany({
    where: { userId },
    select: { propertyId: true },
  });
  return rows.map((r) => r.propertyId);
}

export async function setUserPropertyIds(userId: string, propertyIds: string[]): Promise<void> {
  await init();
  const unique = [...new Set(propertyIds.filter(Boolean))];
  await prisma.$transaction([
    prisma.userProperty.deleteMany({ where: { userId } }),
    ...(unique.length
      ? [
          prisma.userProperty.createMany({
            data: unique.map((propertyId) => ({ userId, propertyId })),
          }),
        ]
      : []),
  ]);
}

export async function getAccessiblePropertiesForUser(
  userId: string,
  role: Role | string,
): Promise<PropertyInfo[]> {
  const all = await getProperties();
  if (userHasAllPropertyAccess(role)) {
    return all;
  }
  const allowed = new Set(await getUserPropertyIds(userId));
  if (allowed.size === 0) {
    return all.filter((p) => p.id === DEFAULT_PROPERTY_ID);
  }
  return all.filter((p) => allowed.has(p.id));
}

/**
 * Auth/session katmanı için hafif erişim özeti — `PropertyInfo` listesini tam
 * çekmeden yalnızca id'leri ve "tüm şubelere erişim" bayrağını döner.
 * `requireApiPermission` / `resolveApiUser` her istekte bunu çağırır; bu yüzden
 * `getAccessiblePropertiesForUser`'dan daha hafif olması önemli.
 */
export async function getUserPropertyAccessSummary(
  userId: string,
  role: Role | string,
): Promise<{ accessiblePropertyIds: string[]; hasAllPropertyAccess: boolean }> {
  if (userHasAllPropertyAccess(role)) {
    return { accessiblePropertyIds: [], hasAllPropertyAccess: true };
  }
  const ids = await getUserPropertyIds(userId);
  if (ids.length === 0) {
    // Henüz hiç şube ataması yapılmamış kullanıcı — eski davranışla uyumlu
    // olarak varsayılan şubeye erişim ver, ama tüm şubelere değil.
    return { accessiblePropertyIds: [DEFAULT_PROPERTY_ID], hasAllPropertyAccess: false };
  }
  return { accessiblePropertyIds: ids, hasAllPropertyAccess: false };
}

export async function ensureDefaultPropertyAccess(userId: string, role: Role | string): Promise<void> {
  const existing = await getUserPropertyIds(userId);
  if (existing.length > 0 || role === 'admin') return;
  // Bilinen demo kullanıcılar (ör. user-arda) için tanımlı şube setini kullan;
  // mevcut/eski veritabanlarında bu fonksiyon çalıştığında Arda'nın Antalya
  // erişimi kaybolmasın (bkz. e2e/multiproperty-live.spec.ts). Bilinmeyen/
  // gerçek kullanıcılar için eski davranış korunur: yalnızca ana şube.
  const knownPropertyIds = DEMO_USER_PROPERTY_IDS[userId];
  await setUserPropertyIds(userId, knownPropertyIds?.length ? knownPropertyIds : [DEFAULT_PROPERTY_ID]);
}

/** Mevcut DB — demo kullanıcılara varsayılan şube atar */
export async function ensureUserPropertyAccessForAll(): Promise<void> {
  await init();
  const users = await prisma.user.findMany({ select: { id: true, role: true } });
  await Promise.all(users.map((u) => ensureDefaultPropertyAccess(u.id, u.role)));
}
