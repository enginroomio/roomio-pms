/** Roomio ekran rollout sırası — mockup kuyruğu ile hizalı */

export type RolloutStepStatus = 'pending' | 'in_progress' | 'done' | 'skipped';

export type RolloutStep = {
  id: string;
  label: string;
  href: string;
  screenRef?: string;
  notes?: string;
};

export type RolloutPhase = {
  id: string;
  order: number;
  title: string;
  description: string;
  steps: RolloutStep[];
};

export const ROLLOUT_PHASES: RolloutPhase[] = [
  {
    id: 'shell',
    order: 0,
    title: 'Kabuk & Navigasyon',
    description: 'İkon rayı, beyaz üst menü, cascade alt menü, kısayol çubuğu',
    steps: [
      { id: 'shell-rail', label: 'İkon rayı (Ana, Önbüro, Kat HK…)', href: '/', screenRef: 'toolbar' },
      { id: 'shell-top', label: 'Üst cascade menü (8 grup)', href: '/', screenRef: 'top-menu' },
      { id: 'shell-shortcuts', label: 'Alt kısayol çubuğu F2–F12', href: '/', screenRef: 'shortcut-bar' },
    ],
  },
  {
    id: 'home',
    order: 1,
    title: 'Ana Sayfa & Oda Rack',
    description: 'Karşılama, KPI, rack önizleme, günlük hareketler',
    steps: [
      { id: 'home-welcome', label: 'Karşılama & operasyon şeridi', href: '/' },
      { id: 'home-kpi', label: 'KPI kartları', href: '/' },
      { id: 'home-rack', label: 'Oda rack önizleme', href: '/' },
      { id: 'home-movements', label: 'Bugünkü varış / ayrılış', href: '/' },
      { id: 'home-rack-full', label: 'Tam oda rack (F12)', href: '/rooms' },
      {
        id: 'home-orijinal',
        label: 'Orijinal PMS şablonları',
        href: '/?design=1',
        notes: 'Operasyon · Kompakt · Klasik — tarayıcı mockup',
      },
    ],
  },
  {
    id: 'sistem',
    order: 2,
    title: 'Sistem',
    description: 'Kuruluş, rapor tasarım, servis programları, dil tanımları',
    steps: [
      { id: 'sys-kurulus', label: 'Kuruluş — yan menü + alt ağaç', href: '/settings', screenRef: 'SC-003' },
      { id: 'sys-rapor-design', label: 'Rapor Tasarım', href: '/reports?tab=design' },
      { id: 'sys-raporla', label: 'Raporla', href: '/reports' },
      { id: 'sys-servis', label: 'Servis Programları', href: '/settings/integrations/tesa', screenRef: '256-286' },
      { id: 'sys-dil', label: 'Dil Tanımları', href: '/settings?section=language', screenRef: '287-292' },
      { id: 'sys-hub', label: 'Sistem Merkezi', href: '/tools/sistem' },
      { id: 'sys-sql', label: 'SQL Mesaj', href: '/tools/sistem?tab=sql' },
      { id: 'sys-user-rpt', label: 'Kullanıcı Tanımlı Raporlar', href: '/reports?tab=user' },
      { id: 'sys-forms', label: 'Form Tasarım Listesi', href: '/reports?tab=forms' },
      { id: 'sys-5651', label: '5651 Hotspot Loglama', href: '/settings/compliance/5651' },
      { id: 'sys-pbx', label: 'Grandstream Santral', href: '/settings/integrations/pbx' },
    ],
  },
  {
    id: 'rezervasyon',
    order: 3,
    title: 'Rezervasyon',
    description: 'Yeni kayıt, listeler, blokaj, aktarım',
    steps: [
      {
        id: 'rez-hub',
        label: 'Rezervasyon Merkezi',
        href: '/reservations?hub=rezervasyon',
      },
      {
        id: 'rez-grafik',
        label: 'Grafikler (F1)',
        href: '/reservations/calendar',
        notes: 'Elektra Forecast F1 — canlı doluluk API, Grafik sekmesi, EGM/TGA/TİS',
      },
      { id: 'rez-new', label: 'Yeni Rezervasyon (F2)', href: '/reservations/new' },
      { id: 'rez-list', label: 'Rezervasyon Listesi', href: '/reservations' },
      { id: 'rez-import', label: 'Acenta Aktarım', href: '/reservations?tab=import' },
      { id: 'rez-availability', label: 'Müsaitlik / Fiyat', href: '/reservations?tab=availability&prices=1' },
      { id: 'rez-inhouse', label: 'Konaklayanlar Listesi', href: '/reception/inhouse' },
      { id: 'rez-vacant', label: 'Boş Oda Listesi', href: '/reception/vacant' },
      { id: 'rez-block', label: 'Hızlı Blokaj', href: '/rooms?tab=blocking' },
    ],
  },
  {
    id: 'resepsiyon',
    order: 4,
    title: 'Resepsiyon',
    description: 'Konaklayan, giriş/çıkış, info rack, şikayet',
    steps: [
      { id: 'rec-hub', label: 'Resepsiyon Merkezi', href: '/reception?hub=resepsiyon' },
      { id: 'rec-summary', label: 'Resepsiyon özeti', href: '/reception' },
      { id: 'rec-inhouse', label: 'Konaklayanlar', href: '/reception/inhouse' },
      { id: 'rec-arrivals', label: 'Bugün giriş', href: '/reception/arrivals' },
      { id: 'rec-departures', label: 'Bugün çıkış', href: '/reception/departures' },
      { id: 'rec-vacant', label: 'Boş odalar', href: '/reception/vacant' },
      { id: 'rec-info', label: 'Info Rack', href: '/guest-relations/info-rack' },
      { id: 'rec-traces', label: 'Takip listesi', href: '/guest-relations/traces' },
      { id: 'rec-complaints', label: 'Arıza & şikayet', href: '/guest-relations/complaints' },
      { id: 'rec-lost-found', label: 'Kayıp & bulunan', href: '/guest-relations/lost-found' },
    ],
  },
  {
    id: 'onkasa',
    order: 5,
    title: 'Ön Kasa',
    description: 'Kasa defteri, tahsilat, döviz, depozit',
    steps: [
      { id: 'cash-hub', label: 'Ön Kasa Merkezi', href: '/reception?hub=onkasa' },
      { id: 'cash-ledger', label: 'Kasa defteri (F6)', href: '/reception?tab=kasa' },
      { id: 'cash-close', label: 'Kasa kapatma listesi', href: '/reception?tab=kasa-close' },
      { id: 'cash-advance', label: 'Kasa avans ve devir', href: '/reception?tab=advance' },
      { id: 'cash-collections', label: 'Günlük oda tahsilat', href: '/reception/arrivals?tab=collections' },
      { id: 'cash-fx', label: 'Döviz bozdurma', href: '/reception/departures?tab=fx' },
      { id: 'cash-rates', label: 'Günlük kur girişi', href: '/reception/departures?tab=rates' },
      { id: 'cash-deposit', label: 'Depozit işlemleri', href: '/reception/vacant?tab=deposit' },
    ],
  },
  {
    id: 'kat',
    order: 6,
    title: 'Kat Hizmetleri',
    description: 'Oda listesi, HK işlemleri, görevler',
    steps: [
      { id: 'hk-hub', label: 'Kat Hizmetleri Merkezi', href: '/housekeeping?hub=kat' },
      { id: 'hk-summary', label: 'Housekeeping pano', href: '/housekeeping' },
      { id: 'hk-rooms', label: 'Oda listesi (F8)', href: '/housekeeping/rooms' },
      { id: 'hk-control', label: 'Oda kontrolü', href: '/housekeeping/rooms?tab=control' },
      { id: 'hk-tasks', label: 'Görevler', href: '/housekeeping/tasks' },
      { id: 'hk-checklist', label: 'Kontrol listesi', href: '/housekeeping/tasks?tab=checklist' },
      { id: 'hk-ops', label: 'Operasyon merkezi', href: '/housekeeping/operations' },
      { id: 'hk-rack', label: 'Room Rack (F12)', href: '/rooms' },
    ],
  },
  {
    id: 'misafir',
    order: 7,
    title: 'Misafir İlişkileri & Banket',
    description: 'Traces, VIP, yorumlar, banket',
    steps: [
      { id: 'gr-hub', label: 'Misafir İlişkileri Merkezi', href: '/guest-relations?hub=misafir' },
      { id: 'gr-summary', label: 'Misafir ilişkileri özeti', href: '/guest-relations' },
      { id: 'gr-traces', label: 'Takip listesi', href: '/guest-relations/traces' },
      { id: 'gr-vip', label: 'VIP', href: '/guest-relations/vip' },
      { id: 'gr-reviews', label: 'Misafir yorumları', href: '/guest-relations/reviews' },
      { id: 'bnk-hub', label: 'Banket Merkezi', href: '/fnb?hub=banket' },
      { id: 'bnk-res', label: 'Banket rezervasyon', href: '/fnb' },
    ],
  },
  {
    id: 'raporlar',
    order: 8,
    title: 'Raporlar',
    description: 'Raporlama programı, kategori raporları',
    steps: [
      { id: 'rpt-hub', label: 'Raporlama programı', href: '/reports' },
      { id: 'rpt-fo', label: 'FO — Önbüro raporları', href: '/reports?category=rezervasyon' },
      { id: 'rpt-hk', label: 'HK raporları', href: '/reports?category=kathizmetleri' },
      { id: 'rpt-mgmt', label: 'Yönetim raporları', href: '/reports?category=yonetim' },
    ],
  },
  {
    id: 'gunsonu',
    order: 9,
    title: 'Gün Sonu',
    description: 'Gün sonu raporları, gün kapatma, yedek',
    steps: [
      { id: 'eod-fetch', label: 'Gün sonu raporlarını al', href: '/reports?tab=eod&action=fetch', screenRef: '359-401' },
      { id: 'eod-close', label: 'Günü kapat', href: '/reports?tab=eod&action=close' },
      { id: 'eod-archive', label: 'Eski gün sonu raporları', href: '/reports?tab=eod&action=archive' },
      { id: 'eod-backup', label: 'Yedek al (bulut)', href: '/reports?tab=eod&action=backup' },
      { id: 'eod-prices', label: 'Oda fiyatlarını işle', href: '/reports?tab=eod&action=room-prices' },
    ],
  },
];

export const ROLLOUT_STORAGE_KEY = 'roomio-rollout-status-v1';

export function allRolloutSteps(): Array<RolloutStep & { phaseId: string; phaseTitle: string }> {
  return ROLLOUT_PHASES.flatMap((phase) =>
    phase.steps.map((step) => ({ ...step, phaseId: phase.id, phaseTitle: phase.title })),
  );
}
