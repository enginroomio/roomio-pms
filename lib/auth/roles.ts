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
    'identity.notify', 'settings.admin', 'hk.manage',
  ],
  fo_manager: [
    'reservations.read', 'reservations.write', 'reception.checkin', 'reception.checkout',
    'cash.read', 'cash.write', 'reports.export', 'eod.close', 'identity.notify', 'hk.manage',
  ],
  reception: [
    'reservations.read', 'reservations.write', 'reception.checkin', 'reception.checkout',
    'cash.read', 'cash.write', 'identity.notify',
  ],
  hk: ['reservations.read', 'hk.manage'],
  accounting: ['accounting.read', 'accounting.write', 'reports.export', 'cash.read'],
  viewer: ['reservations.read', 'cash.read', 'accounting.read'],
};

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Sistem Yöneticisi',
  fo_manager: 'Ön Büro Müdürü',
  reception: 'Resepsiyonist',
  hk: 'Kat Hizmetleri',
  accounting: 'Muhasebe',
  viewer: 'Salt Okunur',
};

/** Demo oturum — production'da JWT/session ile değiştirilir */
export function getDemoSession(role: Role = 'fo_manager'): SessionUser {
  const ids: Record<Role, string> = {
    admin: 'user-admin',
    fo_manager: 'user-arda',
    reception: 'user-arda',
    hk: 'user-hk',
    accounting: 'user-acc',
    viewer: 'user-arda',
  };
  const names: Record<Role, string> = {
    admin: 'Sistem Admin',
    fo_manager: 'Arda Yılmaz',
    reception: 'Resepsiyon Demo',
    hk: 'Elif Kaya',
    accounting: 'Selin Demir',
    viewer: 'Salt Okunur',
  };
  return {
    id: ids[role],
    name: names[role],
    role,
    roleLabel: ROLE_LABELS[role],
    permissions: ROLE_PERMISSIONS[role],
  };
}

export function hasPermission(user: SessionUser, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

export function canAccessRoute(user: SessionUser, pathname: string): boolean {
  if (pathname.startsWith('/settings') && !hasPermission(user, 'settings.admin')) {
    return pathname === '/settings/privacy';
  }
  if (pathname.startsWith('/accounting') && !hasPermission(user, 'accounting.read')) return false;
  if (pathname.includes('tab=eod') && pathname.includes('action=close') && !hasPermission(user, 'eod.close')) return false;
  return true;
}

export { ROLE_PERMISSIONS, ROLE_LABELS };
