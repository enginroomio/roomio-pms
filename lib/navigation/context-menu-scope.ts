import { CONTEXT_MENU_GROUPS } from '@/lib/navigation/context-menu-nav';

export type ContextMenuGroupId = (typeof CONTEXT_MENU_GROUPS)[number]['id'];

/** Modül rotasında sağ tık ana menüde öncelikli gruplar; null = tüm gruplar */
const MODULE_MENU_GROUPS: Array<{
  match: (pathname: string) => boolean;
  groups: ContextMenuGroupId[];
}> = [
  {
    match: (p) => p.startsWith('/housekeeping'),
    groups: ['kat', 'sistem', 'ayarlar'],
  },
  {
    match: (p) => p.startsWith('/reservations'),
    groups: ['rezervasyon', 'sistem', 'ayarlar'],
  },
  {
    match: (p) => p.startsWith('/reception') || p === '/rooms',
    groups: ['resepsiyon', 'kat', 'onkasa', 'sistem', 'ayarlar'],
  },
  {
    match: (p) => p.startsWith('/cashier') || p.startsWith('/onkasa'),
    groups: ['onkasa', 'sistem', 'ayarlar'],
  },
  {
    match: (p) => p.startsWith('/guest-relations'),
    groups: ['misafir', 'sistem', 'ayarlar'],
  },
  {
    match: (p) => p.startsWith('/accounting') || p.startsWith('/arkaburo'),
    groups: ['arkaburo', 'sistem', 'ayarlar'],
  },
  {
    match: (p) => p.startsWith('/reports'),
    groups: ['raporlar', 'sistem', 'ayarlar'],
  },
  {
    match: (p) => p.startsWith('/banquet') || p.startsWith('/banket'),
    groups: ['banket', 'sistem', 'ayarlar'],
  },
  {
    match: (p) => p.startsWith('/end-of-day') || p.startsWith('/gunsonu'),
    groups: ['gunsonu', 'sistem', 'ayarlar'],
  },
  {
    match: (p) => p.startsWith('/settings') || p.startsWith('/system') || p.startsWith('/sistem'),
    groups: ['sistem', 'ayarlar'],
  },
];

export function contextMenuGroupsForPath(pathname: string): ContextMenuGroupId[] | null {
  for (const entry of MODULE_MENU_GROUPS) {
    if (entry.match(pathname)) return entry.groups;
  }
  return null;
}

/** HK oda hücrelerinde global ana menüyü engelle */
export const HK_CONTEXT_MENU_IGNORE =
  '.roomio-hk-mini-cell--hk-interactive, .roomio-nr-cell--hk-interactive';
