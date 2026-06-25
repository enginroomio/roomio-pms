/**
 * Profesyonel PMS modül kataloğu — Konak (Elektra), Roomio mockup ve canlı rotalar.
 */

export type ModuleStatus = 'live' | 'partial' | 'planned';

export type ProModule = {
  id: string;
  group: string;
  label: string;
  href: string;
  status: ModuleStatus;
  shortcut?: string;
  note?: string;
};

export const PRO_MODULE_GROUPS = [
  'Kabuk & Ana Sayfa',
  'Sistem & Kuruluş',
  'Rezervasyon',
  'Resepsiyon',
  'Ön Kasa',
  'Kat Hizmetleri',
  'Misafir İlişkileri',
  'Banket & F&B',
  'Arka Büro',
  'Raporlar',
  'Gün Sonu',
  'Entegrasyonlar',
] as const;

/** Konak Elektra + Roomio eşlemesi — üretim öncelik sırası */
export const PROFESSIONAL_MODULES: ProModule[] = [
  { id: 'home', group: 'Kabuk & Ana Sayfa', label: 'Operasyon Özeti', href: '/', status: 'live', shortcut: 'Alt+1' },
  { id: 'rack', group: 'Kabuk & Ana Sayfa', label: 'Oda Rack (F12)', href: '/rooms', status: 'live', shortcut: 'F12' },
  { id: 'theme', group: 'Kabuk & Ana Sayfa', label: 'Tema & Ekran Kataloğu', href: '/tools/theme', status: 'live' },
  { id: 'rollout', group: 'Kabuk & Ana Sayfa', label: 'Rollout Test', href: '/tools/rollout', status: 'live' },
  { id: 'deploy-hub', group: 'Kabuk & Ana Sayfa', label: 'Production Deploy', href: '/tools/deploy', status: 'live', note: 'Canlıya alma hazırlık' },
  { id: 'pro-hub', group: 'Kabuk & Ana Sayfa', label: 'Profesyonel PMS Merkezi', href: '/tools/pro', status: 'live' },

  { id: 'kurulus', group: 'Sistem & Kuruluş', label: 'Kuruluş Tanımları', href: '/settings', status: 'live', note: 'Oda envanteri, kullanıcı parametreleri, market kuralı canlı' },
  { id: 'rapor-design', group: 'Sistem & Kuruluş', label: 'Rapor Tasarım', href: '/reports?tab=design', status: 'live' },
  { id: 'integrations', group: 'Sistem & Kuruluş', label: 'Entegrasyon Merkezi', href: '/settings/integrations', status: 'live' },
  { id: '5651', group: 'Sistem & Kuruluş', label: '5651 Hotspot', href: '/settings/compliance/5651', status: 'live' },
  { id: 'licensing', group: 'Sistem & Kuruluş', label: 'Lisanslama', href: '/settings/licensing', status: 'live' },

  { id: 'rez-forecast', group: 'Rezervasyon', label: 'Grafikler / Forecast (F1)', href: '/reservations/calendar', status: 'live', shortcut: 'F1' },
  { id: 'rez-new', group: 'Rezervasyon', label: 'Yeni Rezervasyon', href: '/reservations/new', status: 'live', shortcut: 'F2' },
  { id: 'rez-list', group: 'Rezervasyon', label: 'Rezervasyon Listesi', href: '/reservations', status: 'live' },
  { id: 'rez-group', group: 'Rezervasyon', label: 'Grup & Blok Yönetimi', href: '/groups', status: 'live', note: 'Allotment, pickup, release' },
  { id: 'dynamic-pricing', group: 'Entegrasyonlar', label: 'Dinamik Fiyatlandırma', href: '/settings/integrations/dynamic-pricing', status: 'live', note: 'Kural editörü' },
  { id: 'revenue-rms', group: 'Rezervasyon', label: 'Gelir Yönetimi (RMS)', href: '/revenue', status: 'live', note: 'ADR, RevPAR, kanal stratejisi' },
  { id: 'loyalty-hub', group: 'Misafir İlişkileri', label: 'Sadakat Programı', href: '/loyalty', status: 'live', note: 'Puan, kademe, acente bonus' },
  { id: 'rez-block', group: 'Rezervasyon', label: 'Hızlı Blokaj', href: '/rooms?tab=blocking', status: 'live', shortcut: 'F4' },
  { id: 'rez-vacant', group: 'Rezervasyon', label: 'Boş Oda Listesi', href: '/reception/vacant', status: 'live', shortcut: 'F5' },
  { id: 'rez-egm', group: 'Rezervasyon', label: 'EGM Kimlik', href: '/reservations?tab=egm', status: 'live' },

  { id: 'rec-hub', group: 'Resepsiyon', label: 'Resepsiyon Özeti', href: '/reception', status: 'live' },
  { id: 'rec-arrivals', group: 'Resepsiyon', label: 'Bugün Giriş', href: '/reception/arrivals', status: 'live' },
  { id: 'rec-departures', group: 'Resepsiyon', label: 'Bugün Çıkış', href: '/reception/departures', status: 'live' },
  { id: 'rec-inhouse', group: 'Resepsiyon', label: 'Konaklayanlar', href: '/reception/inhouse', status: 'live', shortcut: 'F3' },
  { id: 'rec-queue', group: 'Resepsiyon', label: 'Oda Bekleme Kuyruğu', href: '/reception/queue', status: 'live', note: 'Opera Queue Rooms' },
  { id: 'rec-guest-profile', group: 'Resepsiyon', label: 'Misafir Profili 360°', href: '/reception/guest-profile', status: 'live', note: 'Fidelio / Opera CRM' },
  { id: 'rec-kimlik', group: 'Resepsiyon', label: 'Kimlik Bildirimi', href: '/reception?tab=kimlik', status: 'live' },
  { id: 'rec-info', group: 'Resepsiyon', label: 'Info Rack', href: '/guest-relations/info-rack', status: 'live' },
  { id: 'gr-restaurant', group: 'Misafir İlişkileri', label: 'Restoran Rez.', href: '/guest-relations/restaurant', status: 'live' },
  { id: 'gr-tennis', group: 'Misafir İlişkileri', label: 'Tenis Rez.', href: '/guest-relations/tennis', status: 'live' },
  { id: 'gr-reclamation', group: 'Misafir İlişkileri', label: 'Reklamasyon', href: '/guest-relations/reclamations', status: 'live' },
  { id: 'kurulus-codes', group: 'Sistem & Kuruluş', label: 'Departman & Pansiyon', href: '/settings?section=departments', status: 'live' },

  { id: 'cash-ledger', group: 'Ön Kasa', label: 'Kasa Defteri', href: '/reception?tab=kasa', status: 'live', shortcut: 'F6' },
  { id: 'cash-close', group: 'Ön Kasa', label: 'Kasa Kapatma', href: '/reception?tab=kasa-close', status: 'live' },
  { id: 'cash-fx', group: 'Ön Kasa', label: 'Döviz Bozdurma', href: '/reception/departures?tab=fx', status: 'live' },
  { id: 'cash-deposit', group: 'Ön Kasa', label: 'Depozit', href: '/reception/vacant?tab=deposit', status: 'live' },
  { id: 'company-invoice', group: 'Ön Kasa', label: 'Şirket Folyo Faturası', href: '/reception/inhouse', status: 'live' },

  { id: 'hk-hub', group: 'Kat Hizmetleri', label: 'Kat HK Özeti', href: '/housekeeping', status: 'live' },
  { id: 'hk-rooms', group: 'Kat Hizmetleri', label: 'Oda Listesi', href: '/housekeeping/rooms', status: 'live', shortcut: 'F8' },
  { id: 'hk-ops', group: 'Kat Hizmetleri', label: 'Operations Hub', href: '/housekeeping/operations', status: 'live' },
  { id: 'hk-mobile', group: 'Kat Hizmetleri', label: 'Mobil HK', href: '/housekeeping/mobile', status: 'live' },
  { id: 'hk-assign', group: 'Kat Hizmetleri', label: 'Oda Atama Pro', href: '/housekeeping/assign', status: 'live' },

  { id: 'gr-hub', group: 'Misafir İlişkileri', label: 'Misafir İlişkileri', href: '/guest-relations', status: 'live' },
  { id: 'gr-traces', group: 'Misafir İlişkileri', label: 'Takip Listesi', href: '/guest-relations/traces', status: 'live' },
  { id: 'gr-vip', group: 'Misafir İlişkileri', label: 'VIP', href: '/guest-relations/vip', status: 'live' },
  { id: 'gr-complaints', group: 'Misafir İlişkileri', label: 'Şikayetler', href: '/guest-relations/complaints', status: 'live' },
  { id: 'gr-lost-found', group: 'Misafir İlişkileri', label: 'Kayıp & Buluntu', href: '/guest-relations/lost-found', status: 'live' },
  { id: 'gr-reviews', group: 'Misafir İlişkileri', label: 'Misafir Yorumları', href: '/guest-relations/reviews', status: 'live' },
  { id: 'gr-repeat', group: 'Misafir İlişkileri', label: 'Tekrarlayan Misafirler', href: '/guest-relations/repeat-guests', status: 'live' },
  { id: 'gr-inhouse', group: 'Misafir İlişkileri', label: 'In House List', href: '/guest-relations/inhouse', status: 'live' },
  { id: 'gr-daily-act', group: 'Misafir İlişkileri', label: 'Günlük Aktivite', href: '/guest-relations/daily-activities', status: 'live' },
  { id: 'gr-guest-act', group: 'Misafir İlişkileri', label: 'Misafir Aktivite', href: '/guest-relations/guest-activities', status: 'live' },
  { id: 'gr-weather', group: 'Misafir İlişkileri', label: 'Günlük Hava', href: '/guest-relations/weather', status: 'live', note: 'Open-Meteo canlı' },
  { id: 'gr-weather-forecast', group: 'Misafir İlişkileri', label: 'Hava Tahmini', href: '/guest-relations/weather-forecast', status: 'live' },
  { id: 'ops-dashboard', group: 'Ana Sayfa', label: 'Operasyon Özeti', href: '/', status: 'live', note: 'Birleşik KPI ve uyarı şeridi' },
  { id: 'master-codes', group: 'Sistem & Kuruluş', label: 'Market / Segment / Kaynak', href: '/settings?section=markets', status: 'live' },
  { id: 'nationality-codes', group: 'Sistem & Kuruluş', label: 'Uyruk Kodları', href: '/settings?section=nationalities', status: 'live' },

  { id: 'fnb', group: 'Banket & F&B', label: 'Banket & POS', href: '/fnb', status: 'live' },

  { id: 'accounting', group: 'Arka Büro', label: 'Muhasebe / Stok', href: '/accounting', status: 'live' },
  { id: 'agencies', group: 'Arka Büro', label: 'Acenta Kontratları', href: '/settings?section=agencies', status: 'live' },
  { id: 'rate-plans', group: 'Arka Büro', label: 'Fiyat Listeleri', href: '/settings?section=rate-plans', status: 'live' },

  { id: 'rpt-hub', group: 'Raporlar', label: 'Raporlama Programı', href: '/reports', status: 'live' },
  { id: 'rpt-fo', group: 'Raporlar', label: 'Önbüro Raporları', href: '/reports?category=rezervasyon', status: 'live' },
  { id: 'rpt-mgmt', group: 'Raporlar', label: 'Yönetim Raporları', href: '/reports?category=yonetim', status: 'live' },

  { id: 'eod', group: 'Gün Sonu', label: 'Gün Kapatma', href: '/reports?tab=eod&action=close', status: 'live' },
  { id: 'eod-archive', group: 'Gün Sonu', label: 'EOD Arşivi', href: '/reports?tab=eod&action=archive', status: 'live' },
  { id: 'eod-audit', group: 'Gün Sonu', label: 'Gece Denetim İzi', href: '/reports?tab=eod&action=audit', status: 'live' },
  { id: 'eod-preclose', group: 'Gün Sonu', label: 'Ön Kontrol (Otomatik)', href: '/reports?tab=eod&action=close', status: 'live' },
  { id: 'company-master', group: 'Arka Büro', label: 'Şirket Master', href: '/settings?section=company-list', status: 'live' },
  { id: 'group-pickup', group: 'Rezervasyon', label: 'Grup Pickup Raporu', href: '/groups', status: 'live' },
  { id: 'hk-routing', group: 'Kat Hizmetleri', label: 'HK Routing', href: '/housekeeping/operations', status: 'live' },
  { id: 'room-routing', group: 'Resepsiyon', label: 'Check-in Oda Routing', href: '/reception/arrivals', status: 'live', note: 'Ek ücret seçimi → folyo' },
  { id: 'night-audit-pkg', group: 'Gün Sonu', label: 'Gece Denetim Paketi', href: '/reports?tab=eod&action=audit', status: 'live', note: 'Otomatik gece oda/ek ücret basımı' },

  { id: 'tesa', group: 'Entegrasyonlar', label: 'TESA Kart', href: '/settings/integrations/tesa', status: 'live' },
  { id: 'pbx', group: 'Entegrasyonlar', label: 'Santral PBX', href: '/settings/integrations/pbx', status: 'live' },
  { id: 'wifi', group: 'Entegrasyonlar', label: 'Captive WiFi', href: '/wifi', status: 'live' },
];

export function modulesByGroup(group: string): ProModule[] {
  return PROFESSIONAL_MODULES.filter((m) => m.group === group);
}

export function moduleStats() {
  const total = PROFESSIONAL_MODULES.length;
  const live = PROFESSIONAL_MODULES.filter((m) => m.status === 'live').length;
  const partial = PROFESSIONAL_MODULES.filter((m) => m.status === 'partial').length;
  const planned = PROFESSIONAL_MODULES.filter((m) => m.status === 'planned').length;
  return { total, live, partial, planned, pct: Math.round((live / total) * 100) };
}
