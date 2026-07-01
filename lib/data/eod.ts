export type EodReport = {
  id: string;
  businessDate: string;
  generatedAt: string;
  type: string;
  status: 'ready' | 'pending' | 'archived';
};

export type EodArchive = {
  id: string;
  businessDate: string;
  closedAt: string;
  closedBy: string;
  occupancy: number;
  revenue: number;
  status?: 'open' | 'closed';
  generatedAt?: string;
  reportCount?: number;
};

export const DEMO_EOD_REPORTS: EodReport[] = [
  { id: 'eod-1', businessDate: '2026-06-18', generatedAt: '2026-06-18 06:05', type: 'FO Günlük Durum', status: 'ready' },
  { id: 'eod-2', businessDate: '2026-06-18', generatedAt: '2026-06-18 06:06', type: 'Kasa Özet', status: 'ready' },
  { id: 'eod-3', businessDate: '2026-06-18', generatedAt: '2026-06-18 06:08', type: 'HK Oda Durumu', status: 'pending' },
];

export const DEMO_EOD_ARCHIVE: EodArchive[] = [
  { id: 'arc-1', businessDate: '2026-06-17', closedAt: '2026-06-17 23:58', closedBy: 'Murat S.', occupancy: 72, revenue: 284500 },
  { id: 'arc-2', businessDate: '2026-06-16', closedAt: '2026-06-16 23:55', closedBy: 'Selin K.', occupancy: 68, revenue: 251200 },
];

export const CATEGORY_REPORTS: Record<string, { id: string; name: string; format: string }[]> = {
  forecast: [
    { id: 'fc-7d', name: '7 Günlük Forecast', format: 'PDF / Excel' },
    { id: 'fc-30d', name: '30 Günlük Forecast', format: 'Excel' },
    { id: 'fc-occ', name: 'Doluluk Projeksiyonu', format: 'PDF' },
    { id: 'fc-rev', name: 'Gelir Projeksiyonu', format: 'PDF / Excel' },
  ],
  rezervasyon: [
    { id: 'rez-summary', name: 'Rezervasyon Özet', format: 'PDF / Excel' },
    { id: 'rez-arrival', name: 'Günlük Geliş Listesi', format: 'PDF' },
    { id: 'rez-departure', name: 'Günlük Ayrılış Listesi', format: 'PDF' },
    { id: 'rez-forecast', name: '7 Günlük Forecast', format: 'Excel' },
    { id: 'rez-agency', name: 'Acenta Bazlı Liste', format: 'PDF / Excel' },
    { id: 'rez-cancel', name: 'İptal / No-Show', format: 'PDF' },
  ],
  gunluk: [
    { id: 'dl-inhouse', name: 'In-House Listesi', format: 'PDF' },
    { id: 'dl-arrival', name: 'Günlük Geliş', format: 'PDF' },
    { id: 'dl-departure', name: 'Günlük Ayrılış', format: 'PDF' },
    { id: 'dl-room-move', name: 'Oda Değişim Listesi', format: 'PDF' },
    { id: 'dl-vip', name: 'VIP Listesi', format: 'PDF' },
    { id: 'dl-transfer', name: 'Transfer Listesi', format: 'PDF / Excel' },
  ],
  kathizmetleri: [
    { id: 'hk-status', name: 'Oda Durum Raporu', format: 'PDF' },
    { id: 'hk-productivity', name: 'HK Verimlilik', format: 'Excel' },
    { id: 'hk-dnd', name: 'DND / OOO Listesi', format: 'PDF' },
    { id: 'hk-checkout', name: 'Çıkış Odaları', format: 'PDF' },
    { id: 'hk-assign', name: 'Katkıcı Atama', format: 'Excel' },
  ],
  gelir: [
    { id: 'dr-daily', name: 'Günlük Gelir Özeti', format: 'PDF' },
    { id: 'dr-dept', name: 'Departman Gelirleri', format: 'PDF / Excel' },
    { id: 'dr-room', name: 'Oda Geliri Detay', format: 'PDF' },
    { id: 'dr-fnb', name: 'F&B Gelir', format: 'PDF / Excel' },
    { id: 'mg-rev', name: 'Muhasebe Gelir Özeti', format: 'PDF' },
  ],
  kontrol: [
    { id: 'cs-cash', name: 'Kasa Defteri Özet', format: 'PDF' },
    { id: 'cs-variance', name: 'Kasa Fark Raporu', format: 'PDF' },
    { id: 'cs-fx', name: 'Döviz İşlemleri', format: 'PDF / Excel' },
    { id: 'cs-deposit', name: 'Depozit Listesi', format: 'PDF' },
  ],
  muhasebe: [
    { id: 'in-invoice', name: 'Fatura Listesi', format: 'PDF / Excel' },
    { id: 'in-proforma', name: 'Proforma Faturalar', format: 'PDF' },
    { id: 'ac-ledger', name: 'Hesap Ekstresi', format: 'PDF' },
    { id: 'ac-aging', name: 'Cari Yaşlandırma', format: 'Excel' },
  ],
  yonetim: [
    { id: 'mgmt-rev', name: 'Gelir Özeti', format: 'PDF / Excel' },
    { id: 'mgmt-occ', name: 'Doluluk Analizi', format: 'PDF' },
    { id: 'mgmt-adr', name: 'ADR / RevPAR', format: 'Excel' },
    { id: 'bo-budget', name: 'Bütçe Karşılaştırma', format: 'PDF / Excel' },
    { id: 'mr-daily', name: 'Günlük Yönetim Raporu', format: 'PDF' },
  ],
  acenta: [
    { id: 'ag-contract', name: 'Kontrat Performansı', format: 'PDF / Excel' },
    { id: 'ag-production', name: 'Acenta Üretim', format: 'PDF' },
    { id: 'ag-commission', name: 'Komisyon Raporu', format: 'Excel' },
    { id: 'ag-analysis', name: 'Acenta Analiz (Gün/Ay/Yıl)', format: 'PDF' },
  ],
  crm: [
    { id: 'gs-profile', name: 'Misafir Profil Listesi', format: 'PDF / Excel' },
    { id: 'gs-repeater', name: 'Sürekli Misafir (Repeater)', format: 'PDF' },
    { id: 'gs-vip', name: 'VIP Listesi', format: 'PDF' },
    { id: 'gs-review', name: 'Misafir Yorumları', format: 'PDF' },
  ],
  gr: [
    { id: 'gr-trace', name: 'Takip Listesi', format: 'PDF' },
    { id: 'gr-complaint', name: 'Şikayet Özeti', format: 'PDF' },
    { id: 'gr-lost', name: 'Kayıp & Bulunan', format: 'PDF' },
    { id: 'gr-activity', name: 'Aktivite Listesi', format: 'PDF' },
  ],
  banket: [
    { id: 'bnk-events', name: 'Etkinlik Listesi', format: 'PDF' },
    { id: 'bnk-revenue', name: 'Banket Gelir', format: 'PDF / Excel' },
    { id: 'bnk-forecast', name: 'Banket Forecast', format: 'Excel' },
  ],
  egm: [
    { id: 'egm-summary', name: 'Kimlik Bildirim Özeti', format: 'PDF' },
    { id: 'egm-pending', name: 'Bekleyen Bildirimler', format: 'PDF / Excel' },
    { id: 'egm-errors', name: 'Hatalı / Reddedilen', format: 'PDF' },
    { id: 'egm-nationality', name: 'Uyruk Dağılımı', format: 'PDF / Excel' },
    { id: 'egm-daily', name: 'Günlük Polis Kimlik Listesi', format: 'PDF' },
  ],
  tis: [
    { id: 'tis-nights', name: 'Günlük Geceleme İstatistiği', format: 'PDF / Excel' },
    { id: 'tis-arrival', name: 'Geliş Tipi Dağılımı', format: 'PDF' },
    { id: 'tis-nationality', name: 'Uyruk Bazlı Geceleme', format: 'PDF / Excel' },
    { id: 'tis-monthly', name: 'Aylık TIS Özeti', format: 'PDF / Excel' },
  ],
  tga: [
    { id: 'tga-segment', name: 'Segment Dağılımı', format: 'PDF / Excel' },
    { id: 'tga-channel', name: 'Kanal / Kaynak Analizi', format: 'PDF / Excel' },
    { id: 'tga-direct', name: 'Direct vs OTA', format: 'PDF' },
    { id: 'tga-mice', name: 'MICE / Leisure Ayrımı', format: 'PDF / Excel' },
  ],
};

// TGA (Segment&Kanal) ve TIS (Turizm İstatistik) raporları mevzuata göre ilgili
// kuruma gönderilen resmi istatistik raporlarıdır — KVKK/mevzuat kapsamında
// görüntüleme ve dışa aktarma sadece sistem yöneticisi ile sınırlandırılır
// (bkz. app/api/reports/export/route.ts, requireComplianceExportRead deseni).
export const COMPLIANCE_REPORT_CATEGORIES = ['tga', 'tis'] as const;

export function isComplianceReportCategory(category: string | null | undefined): boolean {
  return !!category && (COMPLIANCE_REPORT_CATEGORIES as readonly string[]).includes(category);
}
