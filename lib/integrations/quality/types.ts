export type QualityDocument = {
  id: string;
  title: string;
  category: string;
  version: string;
  status: 'draft' | 'published' | 'archived';
};

export type QualityConfig = {
  enabled: boolean;
  iso9001Mode: boolean;
  auditIntervalDays: number;
  autoRemind: boolean;
  documents: QualityDocument[];
};

export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  enabled: true,
  iso9001Mode: true,
  auditIntervalDays: 90,
  autoRemind: true,
  documents: [
    { id: 'q1', title: 'HK Temizlik Prosedürü', category: 'Operasyon', version: '2.1', status: 'published' },
    { id: 'q2', title: 'Gıda Güvenliği HACCP', category: 'F&B', version: '1.4', status: 'published' },
    { id: 'q3', title: 'Acil Durum Planı', category: 'Güvenlik', version: '3.0', status: 'published' },
    { id: 'q4', title: 'Misafir Şikayet Prosedürü', category: 'CRM', version: '1.2', status: 'draft' },
  ],
};
