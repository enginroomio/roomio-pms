import { KURULUS_NAV, type KurulusNavEntry } from './kurulus-nav';
import { ROLLOUT_PHASES } from './rollout-phases';
import { topMenuItems } from './top-menu-nav';

export type ModuleNavItem = {
  id: string;
  label: string;
  href: string;
  separator?: boolean;
  children?: ModuleNavItem[];
};

function fromKurulus(entries: KurulusNavEntry[]): ModuleNavItem[] {
  return entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    href: entry.href,
    separator: entry.separator,
    children: entry.children?.length ? fromKurulus(entry.children) : undefined,
  }));
}

export const KURULUS_MODULE_MENU = fromKurulus(KURULUS_NAV);

const IDENTITY_KURULUS_MENU: ModuleNavItem[] = [
  { id: 'users', label: 'Kullanıcı Tanımları', href: '/settings?section=users' },
  { id: 'user-groups', label: 'Kullanıcı Grup Tanımları', href: '/settings?section=user-groups' },
];

export function kurulusModuleMenuForUser(
  user: { permissions: string[] } | null | undefined,
): ModuleNavItem[] {
  if (!user) return KURULUS_MODULE_MENU;
  if (user.permissions.includes('settings.admin')) return KURULUS_MODULE_MENU;
  if (user.permissions.includes('identity.read')) return IDENTITY_KURULUS_MENU;
  return [];
}

/** Üst SİSTEM menüsü ile aynı sıra — yan menü ve rollout testleriyle hizalı */
export const SISTEM_MODULE_MENU: ModuleNavItem[] = [
  { id: 'kurulus', label: 'Kuruluş', href: '/settings?hub=sistem' },
  { id: 'sistem-hub', label: 'Sistem Merkezi', href: '/tools/sistem' },
  { id: 'rapor-design', label: 'Rapor Tasarım', href: '/reports?tab=design' },
  { id: 'raporla', label: 'Raporla', href: '/reports' },
  { id: 'user-reports', label: 'Kullanıcı Tanımlı Raporlar', href: '/reports?tab=user' },
  { id: 'sep-1', label: '', href: '#', separator: true },
  { id: 'servis', label: 'Servis Programları', href: '/settings/integrations' },
  { id: '5651', label: '5651 Hotspot Loglama', href: '/settings/compliance/5651' },
  { id: 'tesa', label: 'TESA Kapı Kartı', href: '/settings/integrations/tesa' },
  { id: 'pbx', label: 'Grandstream Santral', href: '/settings/integrations/pbx' },
  { id: 'dil', label: 'Dil Tanımları', href: '/settings?section=language' },
  { id: 'forms', label: 'Form Tasarım Listesi', href: '/reports?tab=forms' },
  { id: 'sep-2', label: '', href: '#', separator: true },
  { id: 'sql', label: 'SQL Mesaj', href: '/tools/sistem?tab=sql' },
];

const SISTEM_SETTINGS_SECTIONS = new Set([
  'language',
  'lang-forms',
  'lang-menus',
  'lang-reports',
  'nationalities',
  'sync',
  'pbx-calls',
  'pbx-lookup',
]);

const SISTEM_REPORT_TABS = new Set(['design', 'forms', 'user', 'special', 'daily', 'management']);

/** Yan menüde SİSTEM modül ağacını göster */
export function isSistemMenuContext(pathname: string, search = ''): boolean {
  const path = pathname.split('?')[0];
  const params = new URLSearchParams(search.replace(/^\?/, ''));

  if (path.startsWith('/tools/sistem') || path.startsWith('/tools/deploy')) return true;

  if (path.startsWith('/settings/integrations') || path.startsWith('/settings/compliance')) return true;
  if (path.startsWith('/settings/privacy') || path.startsWith('/settings/licensing')) return true;

  if (path.startsWith('/settings')) {
    if (params.get('hub') === 'sistem') return true;
    const section = params.get('section');
    return Boolean(section && SISTEM_SETTINGS_SECTIONS.has(section));
  }

  if (path.startsWith('/reports')) {
    if (params.get('hub') === 'raporlar' || params.get('hub') === 'gunsonu') return false;
    if (params.get('category') || params.get('report')) return false;
    const tab = params.get('tab');
    if (!tab) return true;
    return SISTEM_REPORT_TABS.has(tab);
  }

  return false;
}

export const COMPLIANCE_MODULE_MENU: ModuleNavItem[] = [
  { id: 'hub', label: 'Entegrasyonlar', href: '/settings/integrations' },
  { id: '5651', label: '5651 Hotspot Loglama', href: '/settings/compliance/5651' },
  { id: 'tesa', label: 'TESA Hospitality', href: '/settings/integrations/tesa' },
  { id: 'pbx', label: 'Grandstream Santral', href: '/settings/integrations/pbx' },
  { id: 'egm', label: 'EGM Kimlik Bildirimi', href: '/settings/integrations/egm' },
  { id: 'kvkk', label: 'KVKK & Gizlilik', href: '/settings/privacy' },
  { id: 'license', label: 'Lisans', href: '/settings/licensing' },
];

export const RESEPSIYON_MODULE_MENU: ModuleNavItem[] = [
  { id: 'hub', label: 'Özet', href: '/reception' },
  { id: 'inhouse', label: 'Konaklayanlar', href: '/reception/inhouse' },
  { id: 'arrivals', label: 'Bugün Giriş', href: '/reception/arrivals' },
  { id: 'departures', label: 'Bugün Çıkış', href: '/reception/departures' },
  { id: 'vacant', label: 'Boş Odalar', href: '/reception/vacant' },
  { id: 'sep-1', label: '', href: '#', separator: true },
  { id: 'info-rack', label: 'Info Rack', href: '/guest-relations/info-rack' },
  { id: 'traces', label: 'Takip Listesi', href: '/guest-relations/traces' },
  { id: 'complaints', label: 'Arıza & Şikayet', href: '/guest-relations/complaints' },
  { id: 'lost-found', label: 'Kayıp & Bulunan', href: '/guest-relations/lost-found' },
];

export const REZERVASYON_MODULE_MENU: ModuleNavItem[] = topMenuItems('rezervasyon')
  .filter((item) => !item.separator)
  .slice(0, 12)
  .map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href ?? '#',
  }));

export function moduleMenuForPath(pathname: string, search = ''): ModuleNavItem[] | null {
  const path = pathname.split('?')[0];
  const qs = search || '';

  if (path.startsWith('/tools/sistem')) {
    return SISTEM_MODULE_MENU;
  }
  if (path.startsWith('/tools/rollout')) {
    return ROLLOUT_PHASES.map((phase) => ({
      id: phase.id,
      label: phase.title,
      href: `/tools/rollout?phase=${phase.id}`,
    }));
  }

  if (isSistemMenuContext(path, qs)) {
    return SISTEM_MODULE_MENU;
  }

  if (path.startsWith('/settings') || path.startsWith('/tools/license')) {
    return KURULUS_MODULE_MENU;
  }

  if (path.startsWith('/reception') || path.startsWith('/guest-relations/info-rack')) {
    return RESEPSIYON_MODULE_MENU;
  }
  if (path.startsWith('/reservations') || path.startsWith('/rooms')) {
    return REZERVASYON_MODULE_MENU;
  }
  if (path.startsWith('/housekeeping')) {
    return [
      { id: 'hub', label: 'Özet', href: '/housekeeping' },
      { id: 'rooms', label: 'Oda Durumu', href: '/housekeeping/rooms' },
      { id: 'tasks', label: 'Görevler', href: '/housekeeping/tasks' },
      { id: 'rack', label: 'Room Rack', href: '/rooms' },
    ];
  }
  if (path.startsWith('/guest-relations')) {
    return topMenuItems('misafir')
      .filter((item) => !item.separator && item.href)
      .slice(0, 14)
      .map((item) => ({ id: item.id, label: item.label, href: item.href! }));
  }
  if (path.startsWith('/fnb')) {
    return topMenuItems('misafir')
      .filter((item) => item.label.includes('Banket') || item.href?.startsWith('/fnb'))
      .map((item) => ({ id: item.id, label: item.label, href: item.href ?? '/fnb' }));
  }
  if (path.startsWith('/reports') || path.startsWith('/accounting')) {
    return topMenuItems('raporlar')
      .filter((item) => !item.separator && item.href)
      .slice(0, 12)
      .map((item) => ({ id: item.id, label: item.label, href: item.href! }));
  }

  return null;
}
