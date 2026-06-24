import { SIDEBAR_NAV, type SidebarNavItem } from './sidebar-nav';

/** Elektra v5 — 11 ana grup (sağ tık / masaüstü menü) */
export const CONTEXT_MENU_GROUPS = [
  { id: 'sistem', label: 'Sistem', sectionIds: ['sistem'] },
  { id: 'rezervasyon', label: 'Rezervasyon', sectionIds: ['rezervasyon'] },
  { id: 'resepsiyon', label: 'Resepsiyon', sectionIds: ['resepsiyon'] },
  { id: 'onkasa', label: 'Ön Kasa', sectionIds: ['onkasa'] },
  { id: 'kat', label: 'Kat Hizmetleri', sectionIds: ['kat'] },
  { id: 'misafir', label: 'Misafir İlişkileri', sectionIds: ['misafir'] },
  { id: 'banket', label: 'Banket', sectionIds: ['banket'] },
  { id: 'arkaburo', label: 'Arka Büro', sectionIds: ['arkaburo'] },
  { id: 'gunsonu', label: 'Gün Sonu', sectionIds: ['gunsonu'] },
  { id: 'raporlar', label: 'Raporlar', sectionIds: ['raporlar'] },
  { id: 'ayarlar', label: 'Ayarlar', sectionIds: ['ayarlar'] },
] as const;

export function contextMenuItems(groupId: string): SidebarNavItem[] {
  const group = CONTEXT_MENU_GROUPS.find((g) => g.id === groupId);
  if (!group) return [];
  const items: SidebarNavItem[] = [];
  for (const sectionId of group.sectionIds) {
    const section = SIDEBAR_NAV.find((s) => s.id === sectionId);
    if (section) items.push(...section.items);
  }
  return items;
}
