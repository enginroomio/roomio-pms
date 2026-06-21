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
  rezervasyon: [
    { id: 'rez-summary', name: 'Rezervasyon Özet', format: 'PDF / Excel' },
    { id: 'rez-arrival', name: 'Günlük Geliş Listesi', format: 'PDF' },
    { id: 'rez-departure', name: 'Günlük Ayrılış Listesi', format: 'PDF' },
    { id: 'rez-forecast', name: '7 Günlük Forecast', format: 'Excel' },
  ],
  kathizmetleri: [
    { id: 'hk-status', name: 'Oda Durum Raporu', format: 'PDF' },
    { id: 'hk-productivity', name: 'HK Verimlilik', format: 'Excel' },
    { id: 'hk-dnd', name: 'DND / OOO Listesi', format: 'PDF' },
  ],
  yonetim: [
    { id: 'mgmt-rev', name: 'Gelir Özeti', format: 'PDF / Excel' },
    { id: 'mgmt-occ', name: 'Doluluk Analizi', format: 'PDF' },
    { id: 'mgmt-adr', name: 'ADR / RevPAR', format: 'Excel' },
  ],
  kontrol: [
    { id: 'cs-cash', name: 'Kasa Defteri Özet', format: 'PDF' },
    { id: 'cs-variance', name: 'Kasa Fark Raporu', format: 'PDF' },
  ],
};
