export type GrNavItem = {
  id: string;
  label: string;
  href: string;
  shortcut?: string;
  group: 'services' | 'feedback' | 'reports';
};

export const GUEST_RELATIONS_NAV: GrNavItem[] = [
  { id: 'traces', label: 'Takip Listesi (Traces)', href: '/guest-relations/traces', shortcut: 'Alt+P', group: 'services' },
  { id: 'inhouse', label: 'In House List', href: '/guest-relations/inhouse', group: 'services' },
  { id: 'info-rack', label: 'Info Rack (İsim Listesi)', href: '/guest-relations/info-rack', group: 'services' },
  { id: 'restaurant', label: 'Restoran Rezervasyon', href: '/guest-relations/restaurant', shortcut: 'Shift+R', group: 'services' },
  { id: 'tennis', label: 'Tenis Kort Rezervasyon', href: '/guest-relations/tennis', group: 'services' },
  { id: 'daily', label: 'Günlük Aktivite Listesi', href: '/guest-relations/daily-activities', group: 'services' },
  { id: 'guest-act', label: 'Misafir Aktivite Listesi', href: '/guest-relations/guest-activities', group: 'services' },
  { id: 'weather', label: 'Günlük Hava Durumu', href: '/guest-relations/weather', group: 'services' },
  { id: 'forecast', label: '5 Günlük Hava Tahmini', href: '/guest-relations/weather-forecast', group: 'services' },
  { id: 'complaints', label: 'Arıza ve Şikayet Listesi', href: '/guest-relations/complaints', group: 'feedback' },
  { id: 'lost', label: 'Kayıp ve Bulunan Listesi', href: '/guest-relations/lost-found', group: 'feedback' },
  { id: 'reviews', label: 'Misafir Yorum Listesi', href: '/guest-relations/reviews', group: 'feedback' },
  { id: 'review-new', label: 'Misafir Yorum Girişi', href: '/guest-relations/reviews/new', group: 'feedback' },
  { id: 'reclamation', label: 'Reklamasyon', href: '/guest-relations/reclamations', group: 'feedback' },
  { id: 'vip', label: 'VIP Misafir Listesi', href: '/guest-relations/vip', group: 'reports' },
  { id: 'repeat', label: 'Tekrarlayan Misafirler', href: '/guest-relations/repeat-guests', group: 'reports' },
];

export const GR_SHORTCUTS: Record<string, string> = {
  'Alt+p': '/guest-relations/traces',
  'Shift+r': '/guest-relations/restaurant',
};
