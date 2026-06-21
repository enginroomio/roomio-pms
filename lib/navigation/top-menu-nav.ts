import { SIDEBAR_NAV, type SidebarNavItem } from './sidebar-nav';

export type TopMenuGroup = {
  id: string;
  label: string;
  sectionIds: string[];
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
  const group = TOP_MENU_GROUPS.find((g) => g.id === groupId);
  if (!group) return [];
  const items: SidebarNavItem[] = [];
  for (const sectionId of group.sectionIds) {
    const section = SIDEBAR_NAV.find((s) => s.id === sectionId);
    if (section) items.push(...section.items);
  }
  return items;
}

export const ICON_RAIL = [
  { id: 'daily', label: 'Ana', href: '/', icon: 'home' },
  { id: 'front', label: 'Önbüro', href: '/reception', icon: 'wallet' },
  { id: 'hk', label: 'Kat HK', href: '/housekeeping', icon: 'bed-double' },
  { id: 'guest', label: 'Misafir', href: '/guest-relations', icon: 'heart' },
  { id: 'finance', label: 'Finans', href: '/reports', icon: 'bar-chart' },
  { id: 'system', label: 'Sistem', href: '/settings', icon: 'settings' },
] as const;
