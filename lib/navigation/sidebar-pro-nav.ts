import { SIDEBAR_NAV, navItemActive, type SidebarNavItem } from './sidebar-nav';

export type ProSidebarModule = {
  id: string;
  label: string;
  icon: string;
  sectionIds: string[];
};

/** Saha için sadeleştirilmiş 6 modül — tam menü arama ile erişilir */
export const PRO_SIDEBAR_MODULES: ProSidebarModule[] = [
  { id: 'daily', label: 'Günlük', icon: 'home', sectionIds: ['panel', 'gunsonu'] },
  { id: 'front', label: 'Önbüro', icon: 'wallet', sectionIds: ['rezervasyon', 'resepsiyon', 'onkasa'] },
  { id: 'hk', label: 'Kat HK', icon: 'bed-double', sectionIds: ['kat'] },
  { id: 'guest', label: 'Misafir', icon: 'heart', sectionIds: ['misafir', 'banket'] },
  { id: 'finance', label: 'Finans', icon: 'building', sectionIds: ['arkaburo', 'raporlar'] },
  { id: 'system', label: 'Sistem', icon: 'settings', sectionIds: ['sistem', 'ayarlar'] },
];

export const PRO_QUICK_ACTIONS = [
  { label: 'Yeni Rez.', href: '/reservations/new', key: 'F2' },
  { label: 'Oda Rack', href: '/rooms', key: 'F12' },
  { label: 'Ön Kasa', href: '/reception', key: 'F6' },
] as const;

/** Modül başına öne çıkan menü — geri kalanı "Tümünü göster" veya arama */
const PRO_ESSENTIAL_LABELS: Record<string, string[]> = {
  daily: ['Ana Sayfa', 'Oda Rack', 'Gün Sonu Raporlarını Al', 'Günü Kapat'],
  front: [
    'Yeni Rezervasyon Kaydı',
    'Rezervasyon Listesi',
    'Konaklayanlar Listesi',
    'Boş Oda Listesi',
    'Planlanan Oda Değişimleri',
    'Kasa Defterleri',
    'Takip Listesi (Traces)',
  ],
  hk: [
    'Oda Listesi',
    'Room Rack',
    'House Keeping Oda İşlemleri',
    'House Keeping Oda Kontrolü',
    'Takip Listesi (Traces)',
    'Arıza ve Şikayet Listesi',
  ],
  guest: [
    'Takip Listesi (Traces)',
    'In House List',
    'Info Rack (İsim Listesi)',
    'Arıza ve Şikayet Listesi',
    'Kayıp ve Bulunan Listesi',
    'Banket Rezervasyon',
  ],
  finance: [
    'Fatura Listesi',
    'Yeni Fatura',
    'Raporlama Programı',
    'Cari Kartlar',
    'Yönetim Raporları',
    'FO-Önbüro Raporları',
    'HK-HouseKeeping Raporları',
  ],
  system: [
    'Kuruluş',
    'Servis Programları',
    'Rapor Tasarım',
    'Sisteme Giriş',
    'KVKK & Gizlilik',
    'Lisanslama',
    'Kapı Entegrasyonu',
  ],
};

function itemMatchesEssential(item: SidebarNavItem, labels: string[]): boolean {
  if (item.separator) return false;
  if (labels.includes(item.label)) return true;
  if (item.children?.some((c) => itemMatchesEssential(c, labels) || labels.includes(c.label))) return true;
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

  const labels = PRO_ESSENTIAL_LABELS[moduleId] ?? [];
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
    if (itemMatchesEssential(item, labels) || navItemActive(pathname, item)) {
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
