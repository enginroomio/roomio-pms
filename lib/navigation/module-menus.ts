import { KURULUS_NAV, type KurulusNavEntry } from './kurulus-nav';
import { ROLLOUT_PHASES } from './rollout-phases';
import { topMenuItems } from './top-menu-nav';
import { SIDEBAR_NAV, type SidebarNavItem } from './sidebar-nav';

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
  { id: 'kurulus', label: 'Kuruluş', href: '/settings' },
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

const SISTEM_REPORT_TABS = new Set(['design', 'forms', 'user']);

const ARKABURO_REPORT_SLUGS = new Set([
  'dept-revenue-old',
  'gunluk-balans',
  'distribution',
  'mgmt-old',
  'kredi-kontrol',
  'gunluk-maliye',
  'dept-transfer',
]);

const ARKABURO_REPORT_TABS = new Set(['prepare', 'cube', 'occupancy', '3year', 'dept', 'management']);

const AYARLAR_SETTINGS_TABS = new Set(['password', 'theme']);

/** Yan menüde SİSTEM modül ağacını göster */
export function isSistemMenuContext(pathname: string, search = ''): boolean {
  const path = pathname.split('?')[0];
  const params = new URLSearchParams(search.replace(/^\?/, ''));

  if (path.startsWith('/tools/sistem') || path.startsWith('/tools/deploy')) return true;

  if (path.startsWith('/settings/integrations') || path.startsWith('/settings/compliance')) return true;

  if (path.startsWith('/settings')) {
    if (params.get('hub') === 'sistem') return true;
    const section = params.get('section');
    return Boolean(section && SISTEM_SETTINGS_SECTIONS.has(section));
  }

  if (path.startsWith('/reports')) {
    if (params.get('hub') === 'raporlar' || params.get('hub') === 'gunsonu') return false;
    if (params.get('category') || params.get('report')) return false;
    const tab = params.get('tab');
    if (tab === 'eod') return false;
    if (tab && ARKABURO_REPORT_TABS.has(tab)) return false;
    if (!tab) return false;
    return SISTEM_REPORT_TABS.has(tab);
  }

  return false;
}

/** Gün sonu yan menüsü — night audit ve arşiv */
export function isGunsonuMenuContext(pathname: string, search = ''): boolean {
  const path = pathname.split('?')[0];
  if (!path.startsWith('/reports')) return false;
  const params = new URLSearchParams(search.replace(/^\?/, ''));
  if (params.get('hub') === 'gunsonu') return true;
  return params.get('tab') === 'eod';
}

/** Arka büro yan menüsü — muhasebe ve yönetim raporları */
export function isArkaburoMenuContext(pathname: string, search = ''): boolean {
  const path = pathname.split('?')[0];
  if (path.startsWith('/accounting')) return true;
  if (!path.startsWith('/reports')) return false;
  const params = new URLSearchParams(search.replace(/^\?/, ''));
  const report = params.get('report');
  if (report && ARKABURO_REPORT_SLUGS.has(report)) return true;
  const tab = params.get('tab');
  return Boolean(tab && ARKABURO_REPORT_TABS.has(tab));
}

/** Raporlar yan menüsü — kategori raporları ve raporlama programı */
export function isRaporlarMenuContext(pathname: string, search = ''): boolean {
  const path = pathname.split('?')[0];
  if (!path.startsWith('/reports')) return false;
  if (isGunsonuMenuContext(pathname, search)) return false;
  if (isArkaburoMenuContext(pathname, search)) return false;
  if (isSistemMenuContext(pathname, search)) return false;
  return true;
}

/** Ayarlar yan menüsü — tema, güvenlik, gizlilik ve lisans */
export function isAyarlarMenuContext(pathname: string, search = ''): boolean {
  const path = pathname.split('?')[0];
  if (path === '/settings/privacy' || path === '/settings/licensing') return true;
  if (path !== '/settings') return false;

  const params = new URLSearchParams(search.replace(/^\?/, ''));
  if (params.get('hub') === 'ayarlar') return true;
  if (params.get('tool') === 'calculator') return true;
  const tab = params.get('tab');
  return Boolean(tab && AYARLAR_SETTINGS_TABS.has(tab));
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

/** Üst RESEPSİYON menüsü + özet — yan menü ve rollout testleriyle hizalı */
export const RESEPSIYON_MODULE_MENU: ModuleNavItem[] = [
  { id: 'overview', label: 'Özet', href: '/reception' },
  ...fromSidebarNav(topMenuItems('resepsiyon')),
];

export const ONKASA_MODULE_MENU: ModuleNavItem[] = fromSidebarNav(topMenuItems('onkasa'));

const ONKASA_RECEPTION_TABS = new Set(['kasa', 'kasa-close', 'advance']);
const ONKASA_ARRIVAL_TABS = new Set(['collections', 'cash-sale', 'prepay']);
const ONKASA_DEPARTURE_TABS = new Set(['fx', 'rates']);
const ONKASA_VACANT_TABS = new Set(['deposit', 'deposit-collect', 'deposit-refund']);

/** Ön kasa işlemleri — /reception üzerindeki kasa sekmeleri ve alt rotalar */
export function isOnkasaMenuContext(pathname: string, search = ''): boolean {
  const path = pathname.split('?')[0];
  const params = new URLSearchParams(search.replace(/^\?/, ''));
  if (params.get('hub') === 'onkasa') return true;
  if (!path.startsWith('/reception')) return false;

  const tab = params.get('tab');
  if (tab && ONKASA_RECEPTION_TABS.has(tab)) return true;
  if (path === '/reception/arrivals' && tab && ONKASA_ARRIVAL_TABS.has(tab)) return true;
  if (path === '/reception/departures' && tab && ONKASA_DEPARTURE_TABS.has(tab)) return true;
  if (path === '/reception/vacant' && tab && ONKASA_VACANT_TABS.has(tab)) return true;
  if (path === '/reception/inhouse' && tab === 'bulk') return true;
  return false;
}

/** Üst KAT HİZMETLERİ menüsü + pano — yan menü ve rollout testleriyle hizalı */
export const KAT_MODULE_MENU: ModuleNavItem[] = [
  { id: 'overview', label: 'Housekeeping Pano', href: '/housekeeping' },
  ...fromSidebarNav(topMenuItems('kat')),
];

/** Kat HK yan menüsü — pano, oda listesi, operasyonlar */
export function isKatMenuContext(pathname: string): boolean {
  const path = pathname.split('?')[0];
  return path.startsWith('/housekeeping');
}

/** Resepsiyon yan menüsü — özet, konaklayanlar, info rack */
export function isResepsiyonMenuContext(pathname: string, search = ''): boolean {
  if (isOnkasaMenuContext(pathname, search)) return false;
  const path = pathname.split('?')[0];
  if (path.startsWith('/reception')) return true;
  return false;
}

/** Misafir ilişkileri yan menüsü */
export function isMisafirMenuContext(pathname: string): boolean {
  const path = pathname.split('?')[0];
  return path.startsWith('/guest-relations');
}

export const MISAFIR_MODULE_MENU: ModuleNavItem[] = [
  { id: 'overview', label: 'Misafir İlişkileri Özeti', href: '/guest-relations' },
  ...fromSidebarNav(topMenuItems('misafir')),
];

export const BANKET_MODULE_MENU: ModuleNavItem[] = fromSidebarNav(
  SIDEBAR_NAV.find((section) => section.id === 'banket')?.items ?? [],
);

/** Banket / F&B yan menüsü */
export function isBanketMenuContext(pathname: string): boolean {
  const path = pathname.split('?')[0];
  return path.startsWith('/fnb');
}

function fromSidebarNav(items: SidebarNavItem[]): ModuleNavItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href ?? '#',
    separator: item.separator,
    children: item.children?.length ? fromSidebarNav(item.children) : undefined,
  }));
}

export const GUNSONU_MODULE_MENU: ModuleNavItem[] = fromSidebarNav(
  SIDEBAR_NAV.find((section) => section.id === 'gunsonu')?.items ?? [],
);

export const RAPORLAR_MODULE_MENU: ModuleNavItem[] = fromSidebarNav(
  SIDEBAR_NAV.find((section) => section.id === 'raporlar')?.items ?? [],
);

export const ARKABURO_MODULE_MENU: ModuleNavItem[] = fromSidebarNav(
  SIDEBAR_NAV.find((section) => section.id === 'arkaburo')?.items ?? [],
);

export const AYARLAR_MODULE_MENU: ModuleNavItem[] = fromSidebarNav(
  SIDEBAR_NAV.find((section) => section.id === 'ayarlar')?.items ?? [],
);

export const REZERVASYON_MODULE_MENU: ModuleNavItem[] = fromSidebarNav(topMenuItems('rezervasyon'));

/** Rezervasyon yan menüsü — liste, grafik, aktarım, blokaj */
export function isRezervasyonMenuContext(pathname: string): boolean {
  const path = pathname.split('?')[0];
  if (path.startsWith('/reservations')) return true;
  if (path === '/groups') return true;
  if (path.startsWith('/rooms')) return true;
  return false;
}

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

  if (isAyarlarMenuContext(path, qs)) {
    return AYARLAR_MODULE_MENU;
  }

  if (path.startsWith('/settings') || path.startsWith('/tools/license')) {
    return KURULUS_MODULE_MENU;
  }

  if (isOnkasaMenuContext(path, qs)) {
    return ONKASA_MODULE_MENU;
  }
  if (isResepsiyonMenuContext(path, qs)) {
    return RESEPSIYON_MODULE_MENU;
  }
  if (isKatMenuContext(path)) {
    return KAT_MODULE_MENU;
  }
  if (isRezervasyonMenuContext(path)) {
    return REZERVASYON_MODULE_MENU;
  }
  if (isMisafirMenuContext(path)) {
    return MISAFIR_MODULE_MENU;
  }
  if (isBanketMenuContext(path)) {
    return BANKET_MODULE_MENU;
  }
  if (isGunsonuMenuContext(path, qs)) {
    return GUNSONU_MODULE_MENU;
  }
  if (isArkaburoMenuContext(path, qs)) {
    return ARKABURO_MODULE_MENU;
  }
  if (isRaporlarMenuContext(path, qs)) {
    return RAPORLAR_MODULE_MENU;
  }

  return null;
}
