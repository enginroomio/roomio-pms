import type { Role } from '@/lib/auth/roles';
import { ROLE_LABELS } from '@/lib/auth/roles';
import { validatePassword } from '@/lib/auth/password';
import bcrypt from 'bcryptjs';
import { PROPERTY } from '@/lib/navigation';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { init } from '@/lib/server/pms-store';
import { appendAuditLog } from '@/lib/server/audit-log';
import { revokeAllUserSessions } from '@/lib/auth/session-store';
import {
  ensureDefaultPropertyAccess,
  getUserPropertyIds,
  setUserPropertyIds,
  userHasAllPropertyAccess,
} from '@/lib/server/user-properties';

const DEPARTMENT_BY_ROLE: Record<Role, string> = {
  admin: 'IT',
  fo_manager: 'Ön Büro',
  reception: 'Ön Büro',
  hk: 'Kat Hizmetleri',
  accounting: 'Finans',
  viewer: 'Genel',
};

const GROUP_BY_ROLE: Record<Role, string | null> = {
  admin: 'ADM',
  fo_manager: 'FO-MGR',
  reception: 'FO-CLK',
  hk: 'HK',
  accounting: 'FN',
  viewer: null,
};

export type AdminUserRow = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  roleId: string;
  department: string;
  groupCode: string | null;
  active: boolean;
  mustChangePassword: boolean;
};

export async function findUserById(userId: string) {
  await init();
  return prisma.user.findUnique({ where: { id: userId } });
}

/**
 * Sadece `active` alanını çeken hafif sorgu — `verifyToken` her API
 * isteğinde çağırdığı için tüm kullanıcı kaydını (passwordHash dahil)
 * taşımak gereksiz. Kullanıcı silinmişse de `false` döner (token geçersiz
 * sayılır).
 */
export async function isUserActive(userId: string): Promise<boolean> {
  await init();
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { active: true } });
  return row?.active ?? false;
}

export async function touchUserLogin(userId: string): Promise<void> {
  await init();
  await prisma.user.update({
    where: { id: userId },
    // Başarılı giriş — birikmiş başarısız deneme sayacı ve kilit sıfırlanır.
    data: { lastLoginAt: new Date().toISOString(), failedLoginCount: 0, lockedUntil: null },
  });
}

/** Hesap kilitleme eşikleri. */
const MAX_FAILED_LOGIN_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 30;

export type AccountLockStatus = {
  locked: boolean;
  /** Kilit açılana kadar kalan saniye (locked=false ise 0). */
  retryAfterSec: number;
};

/**
 * Bir kullanıcının hesabının şu an kilitli olup olmadığını kontrol eder.
 * Rate limiting (IP/hesap bazlı, kısa pencereli) ile birlikte ikinci bir
 * savunma katmanıdır: rate limit IP değiştirerek (proxy/botnet) aşılabilir,
 * ama bu kilit doğrudan hesaba bağlı olduğu için email sabit kaldığı sürece
 * etkili olur.
 */
export async function checkAccountLock(userId: string): Promise<AccountLockStatus> {
  await init();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });
  if (!user?.lockedUntil) return { locked: false, retryAfterSec: 0 };

  const lockedUntilMs = new Date(user.lockedUntil).getTime();
  const remainingMs = lockedUntilMs - Date.now();
  if (remainingMs <= 0) return { locked: false, retryAfterSec: 0 };
  return { locked: true, retryAfterSec: Math.ceil(remainingMs / 1000) };
}

/**
 * Başarısız giriş denemesini kaydeder; eşiğe ulaşıldığında hesabı geçici
 * olarak kilitler. `MAX_FAILED_LOGIN_ATTEMPTS` rate limit'in IP+hesap
 * penceresinden (5/15dk) kasıtlı olarak daha yüksek tutuldu — amaç günlük
 * kullanımda yanlış şifre giren gerçek kullanıcıyı cezalandırmak değil,
 * uzun süreli/dağıtık deneme paternini yakalamaktır.
 */
export async function recordFailedLogin(userId: string): Promise<AccountLockStatus> {
  await init();
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: { increment: 1 } },
    select: { failedLoginCount: true, email: true },
  });

  if (user.failedLoginCount < MAX_FAILED_LOGIN_ATTEMPTS) {
    return { locked: false, retryAfterSec: 0 };
  }

  const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
  await prisma.user.update({
    where: { id: userId },
    data: { lockedUntil: lockedUntil.toISOString() },
  });
  await appendAuditLog({
    module: 'auth',
    action: 'account_locked',
    entityType: 'User',
    entityId: userId,
    user: 'system',
    detail: `${user.email} — ${MAX_FAILED_LOGIN_ATTEMPTS} başarısız deneme sonrası ${LOCKOUT_MINUTES} dk kilitlendi`,
  }, DEFAULT_PROPERTY_ID).catch(() => undefined);

  return { locked: true, retryAfterSec: LOCKOUT_MINUTES * 60 };
}

export async function getAuthSetupStatus(): Promise<{ needsSetup: boolean }> {
  const count = await prisma.user.count();
  return { needsSetup: count === 0 };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function bootstrapFirstAdmin(input: {
  email: string;
  name: string;
  password: string;
  propertyName?: string;
}): Promise<AdminUserRow> {
  const status = await getAuthSetupStatus();
  if (!status.needsSetup) {
    throw new Error('Kurulum zaten tamamlanmış');
  }

  const email = input.email.trim().toLowerCase();
  const err = validatePassword(input.password);
  if (err) throw new Error(err);

  const hash = await hashPassword(input.password);
  const now = new Date().toISOString().slice(0, 10);
  const propId = DEFAULT_PROPERTY_ID;
  const propertyName = input.propertyName?.trim() || 'Otel';

  const propCount = await prisma.property.count();
  if (propCount === 0) {
    await prisma.property.create({
      data: {
        id: propId,
        code: 'MAIN',
        name: propertyName,
        city: null,
        totalRooms: 0,
        isDefault: true,
        createdAt: now,
      },
    });
    await prisma.appState.create({
      data: { propertyId: propId, businessDate: PROPERTY.businessDate },
    });
  }

  const row = await prisma.user.create({
    data: {
      id: `user-admin-${Date.now()}`,
      email,
      name: input.name.trim(),
      role: 'admin',
      passwordHash: hash,
      department: DEPARTMENT_BY_ROLE.admin,
      groupCode: GROUP_BY_ROLE.admin,
      active: true,
      mustChangePassword: false,
    },
  });

  bustReadCaches(propId);
  return toAdminRow(row);
}

export async function changeUserPassword(
  userId: string,
  input: { currentPassword?: string; newPassword: string; force?: boolean },
): Promise<void> {
  await init();
  const row = await prisma.user.findUnique({ where: { id: userId } });
  if (!row) throw new Error('Kullanıcı bulunamadı');

  const err = validatePassword(input.newPassword);
  if (err) throw new Error(err);

  if (!input.force) {
    if (!input.currentPassword) throw new Error('Mevcut şifre gerekli');
    const ok = await bcrypt.compare(input.currentPassword, row.passwordHash);
    if (!ok) throw new Error('Mevcut şifre hatalı');
  }

  const hash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash, mustChangePassword: false },
  });
  bustReadCaches(DEFAULT_PROPERTY_ID);
}

export async function adminResetUserPassword(
  actorId: string,
  targetUserId: string,
  newPassword: string,
  actorName: string,
): Promise<void> {
  await init();
  const err = validatePassword(newPassword);
  if (err) throw new Error(err);

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error('Kullanıcı bulunamadı');

  const hash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: targetUserId },
    // Admin şifre sıfırlarken kilit/başarısız deneme sayacı da temizlenir —
    // aksi halde kullanıcı yeni şifresiyle bile kilitli kalabilirdi.
    data: { passwordHash: hash, mustChangePassword: true, failedLoginCount: 0, lockedUntil: null },
  });

  await appendAuditLog(
    {
      module: 'settings',
      action: 'password_reset',
      entityType: 'user',
      entityId: targetUserId,
      user: actorName,
      detail: `Şifre sıfırlandı: ${target.email}`,
    },
    DEFAULT_PROPERTY_ID,
  );

  bustReadCaches(DEFAULT_PROPERTY_ID);
  // Şifre sıfırlandı — hedef kullanıcının tüm aktif oturumları geçersiz
  // kılınır (admin işlemi, kendi oturumunu koruma ihtiyacı yok). Önceden
  // bu yapılmıyordu; eski token'lar şifre sıfırlansa bile süresine kadar
  // geçerli kalabiliyordu.
  await revokeAllUserSessions(targetUserId).catch(() => undefined);
  void actorId;
}

export async function createUserAdmin(input: {
  email: string;
  name: string;
  role: Role;
  password: string;
  department?: string;
  groupCode?: string | null;
  propertyIds?: string[];
}): Promise<AdminUserRow> {
  await init();
  const email = input.email.trim().toLowerCase();
  const err = validatePassword(input.password);
  if (err) throw new Error(err);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Bu e-posta zaten kayıtlı');

  const hash = await hashPassword(input.password);
  const row = await prisma.user.create({
    data: {
      id: `user-${Date.now()}`,
      email,
      name: input.name.trim(),
      role: input.role,
      passwordHash: hash,
      department: input.department ?? DEPARTMENT_BY_ROLE[input.role] ?? 'Genel',
      groupCode: input.groupCode ?? GROUP_BY_ROLE[input.role],
      active: true,
      mustChangePassword: true,
    },
  });

  bustReadCaches(DEFAULT_PROPERTY_ID);
  if (input.propertyIds && input.role !== 'admin') {
    await setUserPropertyIds(row.id, input.propertyIds);
  } else {
    await ensureDefaultPropertyAccess(row.id, input.role);
  }
  return toAdminRow(row);
}

function toAdminRow(row: {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  groupCode: string | null;
  active: boolean;
  mustChangePassword?: boolean;
}): AdminUserRow {
  const role = row.role as Role;
  return {
    id: row.id,
    email: row.email,
    username: row.email.split('@')[0] ?? row.email,
    fullName: row.name,
    role: ROLE_LABELS[role] ?? row.role,
    roleId: row.role,
    department: row.department ?? DEPARTMENT_BY_ROLE[role] ?? '—',
    groupCode: row.groupCode,
    active: row.active,
    mustChangePassword: row.mustChangePassword ?? false,
  };
}

export async function getUserAdminDetail(userId: string): Promise<(AdminUserRow & {
  propertyIds: string[];
  allProperties: boolean;
  lastLoginAt: string | null;
}) | null> {
  await init();
  const row = await prisma.user.findUnique({ where: { id: userId } });
  if (!row) return null;
  const propertyIds = await getUserPropertyIds(userId);
  const adminRow = toAdminRow(row);
  return {
    ...adminRow,
    propertyIds,
    allProperties: userHasAllPropertyAccess(row.role),
    lastLoginAt: row.lastLoginAt ?? null,
  };
}

export async function getUserMustChangePassword(userId: string): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { mustChangePassword: true },
  });
  return row?.mustChangePassword ?? false;
}

export async function seedUserProfilesIfEmpty(): Promise<void> {
  await init();
  const users = await prisma.user.findMany({ where: { department: null } });
  await Promise.all(users.map((u) => {
    const role = u.role as Role;
    return prisma.user.update({
      where: { id: u.id },
      data: {
        department: DEPARTMENT_BY_ROLE[role] ?? 'Genel',
        groupCode: GROUP_BY_ROLE[role],
        active: true,
      },
    });
  }));
}

const VIEWER_DEMO_EMAIL = 'viewer@hotelsapphire.com';
const RECEPTION_DEMO_EMAIL = 'reception@hotelsapphire.com';

export async function ensureViewerDemoUser(): Promise<void> {
  await init();
  const existing = await prisma.user.findUnique({ where: { email: VIEWER_DEMO_EMAIL } });
  if (existing) return;
  const hash = await bcrypt.hash('roomio123', 10);
  await prisma.user.create({
    data: {
      id: 'user-viewer',
      email: VIEWER_DEMO_EMAIL,
      name: 'Deniz Salt',
      role: 'viewer',
      passwordHash: hash,
      department: DEPARTMENT_BY_ROLE.viewer,
      groupCode: GROUP_BY_ROLE.viewer,
      active: true,
    },
  });
}

export async function ensureReceptionDemoUser(): Promise<void> {
  await init();
  const existing = await prisma.user.findUnique({ where: { email: RECEPTION_DEMO_EMAIL } });
  if (existing) return;
  const hash = await bcrypt.hash('roomio123', 10);
  await prisma.user.create({
    data: {
      id: 'user-reception',
      email: RECEPTION_DEMO_EMAIL,
      name: 'Can Demir',
      role: 'reception',
      passwordHash: hash,
      department: DEPARTMENT_BY_ROLE.reception,
      groupCode: GROUP_BY_ROLE.reception,
      active: true,
    },
  });
}

export async function updateUserAdminServer(
  userId: string,
  data: { department?: string; groupCode?: string | null; active?: boolean; role?: Role; propertyIds?: string[] },
): Promise<AdminUserRow | null> {
  await init();
  const row = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.department != null ? { department: data.department } : {}),
      ...(data.groupCode !== undefined ? { groupCode: data.groupCode } : {}),
      ...(data.active != null ? { active: data.active } : {}),
      ...(data.role != null ? { role: data.role } : {}),
    },
  });
  if (data.propertyIds !== undefined) {
    if (row.role === 'admin') {
      await setUserPropertyIds(userId, []);
    } else {
      await setUserPropertyIds(userId, data.propertyIds);
    }
  }
  if (data.active === false) {
    // Kullanıcı pasif yapıldı — mevcut JWT doğrulaması `active` durumunu
    // kontrol etmediği için (sadece imza + revoke listesine bakar), token
    // süresine kadar (varsayılan 8 saat) geçerli kalabilirdi. Oturumları
    // burada geçersiz kılmak bu boşluğu kapatır.
    await revokeAllUserSessions(userId).catch(() => undefined);
  }
  bustReadCaches(DEFAULT_PROPERTY_ID);
  return toAdminRow(row);
}

export async function deleteUserAdmin(actorId: string, targetUserId: string, actorName: string): Promise<void> {
  await init();
  if (actorId === targetUserId) {
    throw new Error('Kendi hesabınızı silemezsiniz');
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error('Kullanıcı bulunamadı');

  if (target.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin', active: true } });
    if (adminCount <= 1) {
      throw new Error('Son aktif yönetici silinemez');
    }
  }

  await prisma.user.delete({ where: { id: targetUserId } });

  await appendAuditLog(
    {
      module: 'settings',
      action: 'user_delete',
      entityType: 'user',
      entityId: targetUserId,
      user: actorName,
      detail: `Kullanıcı silindi: ${target.email}`,
    },
    DEFAULT_PROPERTY_ID,
  );

  bustReadCaches(DEFAULT_PROPERTY_ID);
}
