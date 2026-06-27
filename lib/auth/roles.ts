export type Permission =
  | 'reservations.read'
  | 'reservations.write'
  | 'reception.checkin'
  | 'reception.checkout'
  | 'cash.read'
  | 'cash.write'
  | 'reports.export'
  | 'eod.close'
  | 'accounting.read'
  | 'accounting.write'
  | 'identity.read'
  | 'identity.notify'
  | 'settings.admin'
  | 'hk.manage';

export type Role = 'admin' | 'fo_manager' | 'reception' | 'hk' | 'accounting' | 'viewer';

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
  roleLabel: string;
  permissions: Permission[];
};

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'reservations.read', 'reservations.write', 'reception.checkin', 'reception.checkout',
    'cash.read', 'cash.write', 'reports.export', 'eod.close', 'accounting.read', 'accounting.write',
    'identity.read', 'identity.notify', 'settings.admin', 'hk.manage',
  ],
  fo_manager: [
    'reservations.read', 'reservations.write', 'reception.checkin', 'reception.checkout',
    'cash.read', 'cash.write', 'reports.export', 'eod.close', 'identity.read', 'identity.notify', 'hk.manage',
  ],
  reception: [
    'reservations.read', 'reservations.write', 'reception.checkin', 'reception.checkout',
    'cash.read', 'cash.write', 'identity.read', 'identity.notify',
  ],
  hk: ['reservations.read', 'hk.manage'],
  accounting: ['accounting.read', 'accounting.write', 'reports.export', 'cash.read'],
  viewer: ['reservations.read', 'cash.read', 'accounting.read', 'identity.read'],
};

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Sistem Yöneticisi',
  fo_manager: 'Ön Büro Müdürü',
  reception: 'Resepsiyonist',
  hk: 'Kat Hizmetleri',
  accounting: 'Muhasebe',
  viewer: 'Salt Okunur',
};

export function isRole(value: string | null | undefined): value is Role {
  return Boolean(value && Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, value));
}

export function normalizeRole(value: string | null | undefined, fallback: Role = 'fo_manager'): Role {
  return isRole(value) ? value : fallback;
}

/** Demo oturum — production'da JWT/session ile değiştirilir */
export function getDemoSession(role: Role = 'fo_manager'): SessionUser {
  const safeRole = normalizeRole(role);
  const ids: Record<Role, string> = {
    admin: 'user-admin',
    fo_manager: 'user-arda',
    reception: 'user-reception',
    hk: 'user-hk',
    accounting: 'user-acc',
    viewer: 'user-viewer',
  };
  const names: Record<Role, string> = {
    admin: 'Sistem Admin',
    fo_manager: 'Arda Yılmaz',
    reception: 'Can Demir',
    hk: 'Elif Kaya',
    accounting: 'Selin Demir',
    viewer: 'Deniz Salt',
  };
  return {
    id: ids[safeRole],
    name: names[safeRole],
    role: safeRole,
    roleLabel: ROLE_LABELS[safeRole],
    permissions: ROLE_PERMISSIONS[safeRole],
  };
}

export function hasPermission(user: SessionUser, permission: Permission): boolean {
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

export const SETTINGS_IDENTITY_SECTIONS = new Set(['users', 'user-groups']);

export function canAccessRoute(
  user: SessionUser,
  pathname: string,
  searchParams?: { section?: string | null; tab?: string | null },
): boolean {
  if (pathname.startsWith('/settings')) {
    if (pathname === '/settings/privacy') return true;
    const tab = searchParams?.tab ?? null;
    if (tab === 'password' || tab === 'theme') return true;
    if (
      pathname.startsWith('/settings/integrations')
      || pathname.startsWith('/settings/compliance')
      || pathname.startsWith('/settings/licensing')
    ) {
      return hasPermission(user, 'settings.admin');
    }
    if (hasPermission(user, 'settings.admin')) return true;
    const section = searchParams?.section ?? null;
    if (section && SETTINGS_IDENTITY_SECTIONS.has(section) && hasPermission(user, 'identity.read')) {
      return true;
    }
    return false;
  }
  if (pathname.startsWith('/accounting') && !hasPermission(user, 'accounting.read')) return false;
  if (pathname.startsWith('/housekeeping') && !hasPermission(user, 'hk.manage')) return false;
  if (pathname.includes('tab=eod') && pathname.includes('action=close') && !hasPermission(user, 'eod.close')) return false;
  return true;
}

export { ROLE_PERMISSIONS, ROLE_LABELS };

export const ALL_PERMISSIONS: Permission[] = [
  'reservations.read',
  'reservations.write',
  'reception.checkin',
  'reception.checkout',
  'cash.read',
  'cash.write',
  'reports.export',
  'eod.close',
  'accounting.read',
  'accounting.write',
  'identity.read',
  'identity.notify',
  'settings.admin',
  'hk.manage',
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  'reservations.read': 'Rezervasyon okuma',
  'reservations.write': 'Rezervasyon yazma',
  'reception.checkin': 'Check-in',
  'reception.checkout': 'Check-out',
  'cash.read': 'Kasa okuma',
  'cash.write': 'Kasa yazma',
  'reports.export': 'Rapor dışa aktarma',
  'eod.close': 'Gece kapanışı',
  'accounting.read': 'Muhasebe okuma',
  'accounting.write': 'Muhasebe yazma',
  'identity.read': 'Kimlik bildirimi okuma',
  'identity.notify': 'Kimlik bildirimi gönderme',
  'settings.admin': 'Sistem ayarları',
  'hk.manage': 'Kat hizmetleri',
};
