import { SIDEBAR_NAV, type SidebarNavItem } from './sidebar-nav';

export type TopMenuGroup = {
  id: string;
  label: string;
  sectionIds: string[];
};

/** Üst menüde gösterilecek sadeleştirilmiş Gün Sonu listesi (rapor menüsüyle çakışmasın) */
const GUNSONU_TOP_MENU_ITEMS: SidebarNavItem[] = [
  { id: 'gunsonu-eod-fetch', label: 'Gün Sonu Raporlarını Al', href: '/reports?tab=eod&action=fetch', icon: 'clock', i18nKey: 'sidebar.item.eodFetch' },
  { id: 'gunsonu-eod-close', label: 'Günü Kapat', href: '/reports?tab=eod&action=close', icon: 'clock', i18nKey: 'sidebar.item.eodClose' },
  { id: 'gunsonu-eod-archive', label: 'Eski Gün Sonu Raporları', href: '/reports?tab=eod&action=archive', icon: 'clock', i18nKey: 'sidebar.item.eodArchive' },
  { id: 'gunsonu-sep-1', label: '', href: '#', icon: 'minus', separator: true },
  { id: 'gunsonu-backup', label: 'Yedek Al', href: '/reports?tab=eod&action=backup', icon: 'clock', i18nKey: 'sidebar.item.eodBackup' },
  { id: 'gunsonu-sep-2', label: '', href: '#', icon: 'minus', separator: true },
  { id: 'gunsonu-room-prices', label: 'Oda Fiyatlarını İşle', href: '/reports?tab=eod&action=room-prices', icon: 'clock', i18nKey: 'sidebar.item.eodRoomPrices' },
  { id: 'gunsonu-extra-prices', label: 'Ek Fiyatları Bas', href: '/reports?tab=eod&action=extra-prices', icon: 'clock', i18nKey: 'sidebar.item.eodExtraPrices' },
  { id: 'gunsonu-profile-check', label: 'Misafir Profil Kontrol', href: '/reports?tab=eod&action=profile-check', icon: 'clock', i18nKey: 'sidebar.item.eodProfileCheck' },
];

const TOP_MENU_ITEM_OVERRIDES: Partial<Record<string, SidebarNavItem[]>> = {
  gunsonu: GUNSONU_TOP_MENU_ITEMS,
};

export const TOP_MENU_GROUPS: TopMenuGroup[] = [
  { id: 'sistem', label: 'Sistem', sectionIds: ['sistem', 'ayarlar'] },
  { id: 'rezervasyon', label: 'Rezervasyon', sectionIds: ['rezervasyon'] },
  { id: 'resepsiyon', label: 'Resepsiyon', sectionIds: ['resepsiyon'] },
  { id: 'onkasa', label: 'Ön Kasa', sectionIds: ['onkasa'] },
  { id: 'kat', label: 'Kat HK', sectionIds: ['kat'] },
  { id: 'misafir', label: 'Misafir', sectionIds: ['misafir', 'banket'] },
  { id: 'raporlar', label: 'Raporlar', sectionIds: ['raporlar', 'arkaburo'] },
  { id: 'gunsonu', label: 'Gün Sonu', sectionIds: ['gunsonu'] },
];

export function topMenuItems(groupId: string): SidebarNavItem[] {
  const override = TOP_MENU_ITEM_OVERRIDES[groupId];
  if (override) return override;

  const group = TOP_MENU_GROUPS.find((g) => g.id === groupId);
  if (!group) return [];
  const items: SidebarNavItem[] = [];
  for (const sectionId of group.sectionIds) {
    const section = SIDEBAR_NAV.find((s) => s.id === sectionId);
    if (section) items.push(...section.items);
  }
  return items;
}

/** Üst menü aktif vurgusu — ana sayfa linki (/) grupları yanlışlıkla aktif göstermesin */
export function topMenuGroupActive(pathname: string, groupId: string, search = ''): boolean {
  return topMenuItems(groupId).some((item) => topMenuNavItemActive(pathname, item, search));
}

function topMenuNavItemActive(pathname: string, item: SidebarNavItem, search = ''): boolean {
  if (item.separator) return false;

  if (item.href && item.href !== '#') {
    const [itemPath, itemQuery = ''] = item.href.split('?');
    if (itemPath === '/' && pathname === '/') return false;
    if (pathname !== itemPath && !pathname.startsWith(`${itemPath}/`)) {
      return item.children?.some((c) => topMenuNavItemActive(pathname, c, search)) ?? false;
    }

    const current = new URLSearchParams(search.replace(/^\?/, ''));
    if (itemQuery) {
      const required = new URLSearchParams(itemQuery);
      for (const [key, value] of required.entries()) {
        if (current.get(key) !== value) return false;
      }
      return true;
    }

    // Genel /reports — gün sonu sekmesinde raporlar grubunu aktif gösterme
    if (itemPath === '/reports' && current.get('tab') === 'eod') return false;

    return true;
  }

  return item.children?.some((c) => topMenuNavItemActive(pathname, c, search)) ?? false;
}

export const ICON_RAIL = [
  { id: 'daily', label: 'Ana', href: '/', icon: 'home' },
  { id: 'front', label: 'Önbüro', href: '/reception', icon: 'wallet' },
  { id: 'hk', label: 'Kat HK', href: '/housekeeping', icon: 'bed-double' },
  { id: 'guest', label: 'Misafir', href: '/guest-relations', icon: 'heart' },
  { id: 'finance', label: 'Finans', href: '/reports', icon: 'bar-chart' },
  { id: 'system', label: 'Sistem', href: '/settings', icon: 'settings' },
] as const;
