import { SIDEBAR_NAV, navItemActive, type SidebarNavItem } from './sidebar-nav';

export type ProSidebarModule = {
  id: string;
  label: string;
  labelKey: string;
  icon: string;
  sectionIds: string[];
};

/** Saha için sadeleştirilmiş 6 modül — tam menü arama ile erişilir */
export const PRO_SIDEBAR_MODULES: ProSidebarModule[] = [
  { id: 'daily', label: 'Günlük', labelKey: 'sidebar.module.daily', icon: 'home', sectionIds: ['panel', 'gunsonu'] },
  { id: 'front', label: 'Önbüro', labelKey: 'sidebar.module.front', icon: 'wallet', sectionIds: ['rezervasyon', 'resepsiyon', 'onkasa'] },
  { id: 'hk', label: 'Kat HK', labelKey: 'sidebar.module.hk', icon: 'bed-double', sectionIds: ['kat'] },
  { id: 'guest', label: 'Misafir', labelKey: 'sidebar.module.guest', icon: 'heart', sectionIds: ['misafir', 'banket'] },
  { id: 'finance', label: 'Finans', labelKey: 'sidebar.module.finance', icon: 'building', sectionIds: ['arkaburo', 'raporlar'] },
  { id: 'system', label: 'Sistem', labelKey: 'sidebar.module.system', icon: 'settings', sectionIds: ['sistem', 'ayarlar'] },
];

export const PRO_QUICK_ACTIONS = [
  { label: 'Yeni Rez.', labelKey: 'sidebar.quick.newRes', href: '/reservations/new', key: 'F2' },
  { label: 'Oda Rack', labelKey: 'sidebar.item.roomRack', href: '/rooms', key: 'F12' },
  { label: 'Ön Kasa', labelKey: 'sidebar.quick.frontDesk', href: '/reception', key: 'F6' },
] as const;

/** Modül başına öne çıkan menü — locale-bağımsız item id'leri */
const PRO_ESSENTIAL_IDS: Record<string, string[]> = {
  daily: ['panel-ana-sayfa', 'panel-oda-rack', 'gunsonu-gun-sonu-raporlarn-al', 'gunsonu-gunu-kapat'],
  front: [
    'rezervasyon-yeni-rezervasyon-kayd',
    'rezervasyon-rezervasyon-listesi',
    'resepsiyon-konaklayanlar-listesi',
    'resepsiyon-bos-oda-listesi',
    'resepsiyon-planlanan-oda-degisimleri',
    'onkasa-kasa-defterleri',
    'rezervasyon-takip-listesi-traces',
  ],
  hk: [
    'kat-oda-listesi',
    'kat-room-rack',
    'kat-house-keeping-oda-islemleri',
    'kat-house-keeping-oda-kontrolu',
    'kat-takip-listesi-traces',
    'kat-arza-ve-sikayet-listesi',
  ],
  guest: [
    'misafir-takip-listesi-traces',
    'misafir-in-house-list',
    'misafir-info-rack-isim-listesi',
    'misafir-arza-ve-sikayet-listesi',
    'misafir-kayp-ve-bulunan-listesi',
    'banket-banket-rezervasyon',
  ],
  finance: [
    'arkaburo-fatura-listesi',
    'arkaburo-yeni-fatura',
    'raporlar-raporlama-program',
    'arkaburo-cari-kartlar',
    'raporlar-yonetim-raporlar',
    'raporlar-fo-onburo-raporlar',
    'raporlar-hk-housekeeping-raporlar',
  ],
  system: [
    'sistem-kurulus',
    'sistem-servis-programlar',
    'sistem-rapor-tasarm',
    'ayarlar-sisteme-giris',
    'ayarlar-kvkk-gizlilik',
    'ayarlar-lisanslama',
    'ayarlar-kap-entegrasyonu',
  ],
};

function itemMatchesEssential(item: SidebarNavItem, ids: string[]): boolean {
  if (item.separator) return false;
  if (ids.includes(item.id)) return true;
  if (item.children?.some((c) => itemMatchesEssential(c, ids))) return true;
  return false;
}

export function proModuleItems(moduleId: string): SidebarNavItem[] {
  const mod = PRO_SIDEBAR_MODULES.find((m) => m.id === moduleId);
  if (!mod) return [];
  const items: SidebarNavItem[] = [];
  for (const sectionId of mod.sectionIds) {
    const section = SIDEBAR_NAV.find((s) => s.id === sectionId);
    if (!section) continue;
    items.push(...section.items);
  }
  return items;
}

export function proModuleVisibleItems(
  moduleId: string,
  pathname: string,
  showAll: boolean,
): SidebarNavItem[] {
  const all = proModuleItems(moduleId);
  if (showAll) return all;

  const ids = PRO_ESSENTIAL_IDS[moduleId] ?? [];
  const picked: SidebarNavItem[] = [];
  let lastWasSep = false;

  for (const item of all) {
    if (item.separator) {
      if (!lastWasSep && picked.length > 0) {
        picked.push(item);
        lastWasSep = true;
      }
      continue;
    }
    lastWasSep = false;
    if (itemMatchesEssential(item, ids) || navItemActive(pathname, item)) {
      picked.push(item);
    }
  }

  return picked;
}

export function activeProModuleId(pathname: string): string {
  if (pathname === '/settings' || pathname.startsWith('/settings/') || pathname.startsWith('/tools/')) {
    return 'system';
  }
  if (pathname.startsWith('/reports')) return 'finance';
  if (pathname.startsWith('/accounting')) return 'finance';
  if (pathname.startsWith('/fnb')) return 'guest';
  if (pathname.startsWith('/guest-relations')) return 'guest';
  if (pathname.startsWith('/housekeeping') || pathname.startsWith('/rooms')) return 'hk';
  if (pathname.startsWith('/reception') || pathname.startsWith('/reservations')) return 'front';

  for (const mod of PRO_SIDEBAR_MODULES) {
    for (const sectionId of mod.sectionIds) {
      const section = SIDEBAR_NAV.find((s) => s.id === sectionId);
      if (section?.items.some((item) => navItemActive(pathname, item))) return mod.id;
    }
  }
  return 'daily';
}

export function countModuleLinks(moduleId: string): number {
  return proModuleItems(moduleId).filter((i) => !i.separator).length;
}
