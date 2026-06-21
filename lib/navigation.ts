export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
};

/** Roomio ana modüller — konak-pms menü haritasından sadeleştirilmiş */
export const ROOMIO_NAV: NavItem[] = [
  { id: 'home', label: 'Ana Sayfa', href: '/', icon: 'home' },
  { id: 'reservations', label: 'Rezervasyon', href: '/reservations', icon: 'calendar' },
  { id: 'reception', label: 'Resepsiyon', href: '/reception', icon: 'concierge' },
  { id: 'rooms', label: 'Oda Rack', href: '/rooms', icon: 'grid' },
  { id: 'housekeeping', label: 'Kat Hizmetleri', href: '/housekeeping', icon: 'bed' },
  { id: 'guest-relations', label: 'Misafir İlişkileri', href: '/guest-relations', icon: 'heart' },
  { id: 'fnb', label: 'Yiyecek & İçecek', href: '/fnb', icon: 'utensils' },
  { id: 'accounting', label: 'Muhasebe', href: '/accounting', icon: 'calculator' },
  { id: 'reports', label: 'Raporlar', href: '/reports', icon: 'chart' },
  { id: 'settings', label: 'Ayarlar', href: '/settings', icon: 'settings' },
];

export const PROPERTY = {
  name: 'Hotel Sapphire İstanbul',
  code: 'SAPPHIRE',
  totalRooms: 77,
  businessDate: '2026-06-18',
};

export const DEMO_USER = {
  initials: 'AY',
  name: 'Arda Yılmaz',
  role: 'Ön Büro Müdürü',
};
