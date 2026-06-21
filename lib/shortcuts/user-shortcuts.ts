import type { LucideIcon } from 'lucide-react';
import {
  BedDouble,
  CalendarDays,
  FileText,
  Heart,
  Home,
  LogIn,
  LogOut,
  Search,
  Settings,
  Shield,
  Wallet,
  Wifi,
} from 'lucide-react';

export type ShortcutCatalogItem = {
  id: string;
  label: string;
  href: string;
  key: string;
  icon: string;
  category: string;
};

export const SHORTCUT_ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  login: LogIn,
  logout: LogOut,
  search: Search,
  wallet: Wallet,
  calendar: CalendarDays,
  bed: BedDouble,
  heart: Heart,
  settings: Settings,
  shield: Shield,
  wifi: Wifi,
  file: FileText,
};

export const SHORTCUT_CATALOG: ShortcutCatalogItem[] = [
  { id: 'grafik-rez', label: 'Grafikler', href: '/reservations/calendar', key: 'F1', icon: 'calendar', category: 'Rezervasyon' },
  { id: 'quick-checkin', label: 'Hızlı Giriş', href: '/reception/arrivals', key: 'F2', icon: 'login', category: 'Resepsiyon' },
  { id: 'quick-checkout', label: 'Hızlı Çıkış', href: '/reception/departures', key: 'F12', icon: 'logout', category: 'Resepsiyon' },
  { id: 'front-desk', label: 'Ön Kasa', href: '/reception', key: 'F6', icon: 'wallet', category: 'Resepsiyon' },
  { id: 'find-room', label: 'Oda Bul', href: '/rooms', key: 'F3', icon: 'search', category: 'Oda' },
  { id: 'hk-rooms', label: 'Kat HK Odalar', href: '/housekeeping/rooms', key: 'F8', icon: 'bed', category: 'Kat HK' },
  { id: 'reservations', label: 'Rezervasyon', href: '/reservations', key: '', icon: 'calendar', category: 'Rezervasyon' },
  { id: 'inhouse', label: 'Konaklayanlar', href: '/reception/inhouse', key: '', icon: 'wallet', category: 'Resepsiyon' },
  { id: 'guest-relations', label: 'Misafir İlişkileri', href: '/guest-relations', key: '', icon: 'heart', category: 'Misafir' },
  { id: 'home', label: 'Ana Sayfa', href: '/', key: '', icon: 'home', category: 'Genel' },
  { id: 'settings', label: 'Kuruluş', href: '/settings', key: '', icon: 'settings', category: 'Sistem' },
  { id: 'tesa', label: 'TESA Kart', href: '/settings/integrations/tesa', key: '', icon: 'shield', category: 'Entegrasyon' },
  { id: 'hotspot-5651', label: '5651 Hotspot', href: '/settings/compliance/5651', key: '', icon: 'wifi', category: 'Uyumluluk' },
  { id: 'reports', label: 'Raporlar', href: '/reports', key: '', icon: 'file', category: 'Rapor' },
  { id: 'rollout', label: 'Rollout Test', href: '/tools/rollout', key: '', icon: 'settings', category: 'Araçlar' },
];

export type UserShortcut = {
  id: string;
  catalogId: string;
  key: string;
};

export const DEFAULT_USER_SHORTCUTS: UserShortcut[] = [
  { id: 'u1', catalogId: 'quick-checkin', key: 'F2' },
  { id: 'u2', catalogId: 'quick-checkout', key: 'F12' },
  { id: 'u3', catalogId: 'front-desk', key: 'F6' },
  { id: 'u4', catalogId: 'find-room', key: 'F3' },
];

const STORAGE_KEY = 'roomio_user_shortcuts';

export function readUserShortcuts(): UserShortcut[] {
  if (typeof window === 'undefined') return DEFAULT_USER_SHORTCUTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_SHORTCUTS;
    const parsed = JSON.parse(raw) as UserShortcut[];
    return parsed.length ? parsed : DEFAULT_USER_SHORTCUTS;
  } catch {
    return DEFAULT_USER_SHORTCUTS;
  }
}

export function saveUserShortcuts(shortcuts: UserShortcut[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  window.dispatchEvent(new Event('roomio-shortcuts-changed'));
}

export function resolveShortcut(item: UserShortcut) {
  const catalog = SHORTCUT_CATALOG.find((c) => c.id === item.catalogId);
  if (!catalog) return null;
  return { ...catalog, key: item.key || catalog.key };
}

export function resolvedShortcuts(): Array<ShortcutCatalogItem & { userId: string; key: string }> {
  return readUserShortcuts()
    .map((u) => {
      const cat = resolveShortcut(u);
      if (!cat) return null;
      return { ...cat, userId: u.id };
    })
    .filter(Boolean) as Array<ShortcutCatalogItem & { userId: string; key: string }>;
}

export function shortcutKeyMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of resolvedShortcuts()) {
    if (item.key) map[item.key.toLowerCase()] = item.href;
  }
  return map;
}
